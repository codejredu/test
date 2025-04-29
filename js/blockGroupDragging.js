/**
 * blockGroupDragging.js v1.0
 * מודול גרירה קבוצתית של בלוקים תכנות
 * 
 * מאפשר גרירה של שרשרת בלוקים מחוברים כיחידה אחת.
 * אין תלות בקוד המקורי ועובד עם כל כמות בלוקים בשרשרת.
 * 
 * שימוש:
 * - העתק את הקובץ לפרויקט 
 * - הוסף תג script לאחר הקוד המקורי של linkageimproved.js
 * <script src="blockGroupDragging.js"></script>
 */

(function() {
  /**
   * --- הגדרות קונפיגורציה ---
   * ניתן לשנות כדי להתאים להתנהגות הרצויה
   */
  const CONFIG = {
    DEBUG: false,                    // הדפסת הודעות בקונסול
    CHECK_INTERVAL_MS: 16,           // זמן בדיקת מיקום (מילישניות) - 60 פעמים בשנייה
    MIN_MOVEMENT_PX: 2,              // מרחק מינימלי לזיהוי תזוזה (פיקסלים)
    HIDE_CONNECTION_POINTS: true,    // הסתרת נקודות חיבור בזמן גרירה
    CLEANUP_DELAY_MS: 300,           // זמן המתנה לניקוי אחרי גרירה
    WAIT_BEFORE_INIT_MS: 1000,       // זמן המתנה לפני אתחול ראשוני
    MAX_CHAIN_BLOCKS: 50,            // כמות מקסימלית של בלוקים בשרשרת
    AUTO_REINIT_ON_ERROR: true,      // אתחול אוטומטי במקרה של שגיאה
    HIGHLIGHT_BLOCKS: true,          // הדגשה חזותית של בלוקים בגרירה
    STATUS_DISPLAY: true             // הצגת הודעות סטטוס למשתמש
  };

  /**
   * --- משתנים גלובליים ---
   * מצב המערכת ונתונים נוכחיים
   */
  let moduleActive = false;           // האם המודול פעיל
  let isDragging = false;             // האם מתבצעת גרירה כרגע
  let mainBlock = null;               // הבלוק הראשי שנגרר
  let chainBlocks = [];               // כל הבלוקים בשרשרת
  let blocksData = [];                // נתוני מיקום הבלוקים
  let lastMainPosition = {x:0, y:0};  // המיקום האחרון של הבלוק הראשי
  let checkTimer = null;              // טיימר בדיקת מיקום
  let cleanupTimer = null;            // טיימר ניקוי
  let startTimestamp = 0;             // זמן התחלת הגרירה

  /**
   * --- פונקציות לוג ---
   * הדפסת הודעות בקונסול
   */
  function log(...args) {
    if (CONFIG.DEBUG) console.log("[GroupDrag]", ...args);
  }

  function warn(...args) {
    if (CONFIG.DEBUG) console.warn("[GroupDrag]", ...args);
  }

  /**
   * --- אתחול המערכת ---
   * מגדיר את המודול ומכין אותו לשימוש
   */
  function initialize() {
    // בדוק אם כבר אותחל
    if (window.blockGroupDraggingInitialized) {
      log("Module already initialized");
      return;
    }

    log("Initializing Block Group Dragging v1.0");

    // הוסף סגנונות CSS
    addStyles();

    // התקן מאזינים
    setupListeners();

    // הפעל את המודול
    moduleActive = true;
    window.blockGroupDraggingInitialized = true;

    // הצג סטטוס
    showStatus("Block Group Dragging Ready");
    log("Initialization complete");
  }

  /**
   * --- הוספת סגנונות CSS ---
   * מוסיף סגנונות לתצוגה ותגובה
   */
  function addStyles() {
    // אם הסגנונות כבר קיימים, לא להוסיף שוב
    if (document.getElementById('block-group-dragging-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'block-group-dragging-styles';
    styleEl.textContent = `
      /* סגנונות בלוקים בגרירה */
      .bgd-chain-block {
        transition: none !important;
      }

      .bgd-chain-block.bgd-highlight {
        box-shadow: 0 0 0 1px rgba(76, 175, 80, 0.5) !important;
      }

      .bgd-main-block.bgd-highlight {
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.8) !important;
      }

      /* הסתרת נקודות חיבור */
      .bgd-hide-connections .right-connection-point,
      .bgd-hide-connections .left-connection-point {
        display: none !important;
        opacity: 0 !important;
        animation: none !important;
      }

      /* חלונית סטטוס */
      #bgd-status {
        position: fixed;
        bottom: 15px;
        left: 15px;
        background-color: rgba(33, 150, 243, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 9999;
        pointer-events: none;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      #bgd-status.visible {
        opacity: 1;
      }
    `;

    document.head.appendChild(styleEl);
    log("Styles added");

    // הוסף אלמנט סטטוס
    if (CONFIG.STATUS_DISPLAY) {
      const statusEl = document.createElement('div');
      statusEl.id = 'bgd-status';
      document.body.appendChild(statusEl);
    }
  }

  /**
   * --- התקנת מאזינים ---
   * מוסיף מאזינים לאירועי עכבר
   */
  function setupListeners() {
    // לחיצת עכבר - לזיהוי התחלת גרירה
    document.addEventListener('mousedown', handleMouseDown, true);
    
    // שחרור לחצן עכבר - לזיהוי סיום גרירה
    document.addEventListener('mouseup', handleMouseUp, true);
    
    log("Event listeners installed");
  }

  /**
   * --- הצגת הודעת סטטוס ---
   * מציג הודעה למשתמש
   */
  function showStatus(message, duration = 2000) {
    if (!CONFIG.STATUS_DISPLAY) return;
    
    const statusEl = document.getElementById('bgd-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.classList.add('visible');
    
    clearTimeout(window.bgdStatusTimer);
    window.bgdStatusTimer = setTimeout(() => {
      statusEl.classList.remove('visible');
    }, duration);
  }

  /**
   * --- טיפול בלחיצת עכבר ---
   * מזהה לחיצה על בלוק ומתחיל גרירה
   */
  function handleMouseDown(e) {
    // אם המודול לא פעיל או לא לחיצה שמאלית, צא
    if (!moduleActive || e.button !== 0) return;
    
    // סיים גרירה קודמת אם קיימת
    if (isDragging) {
      log("Ending previous drag first");
      endDragging(false);
    }
    
    // מצא בלוק תכנות
    const block = findProgrammingBlock(e.target);
    if (!block) return;
    
    log("Block clicked:", block.id || "unknown");
    
    // מצא את כל הבלוקים בשרשרת
    const chain = findCompleteBlockChain(block);
    
    // אם יש רק בלוק אחד או אין בלוקים, אל תפעיל גרירה קבוצתית
    if (chain.length <= 1) {
      log("Single block - regular drag");
      return;
    }
    
    log(`Found chain with ${chain.length} blocks`);
    
    // התחל גרירה קבוצתית
    startDragging(block, chain);
  }

  /**
   * --- התחלת גרירה קבוצתית ---
   * שומר את המצב ומתחיל לעקוב אחר תנועה
   */
  function startDragging(block, chain) {
    try {
      // שמור את הבלוק הראשי והשרשרת
      mainBlock = block;
      chainBlocks = chain;
      isDragging = true;
      startTimestamp = Date.now();
      
      // שמור את המיקום ההתחלתי של הבלוק הראשי
      updateMainBlockPosition();
      
      // חשב את המיקומים היחסיים
      calculateRelativePositions();
      
      // הוסף סימון ויזואלי לבלוקים
      markChainBlocks();
      
      // הסתר נקודות חיבור אם צריך
      if (CONFIG.HIDE_CONNECTION_POINTS) {
        document.body.classList.add('bgd-hide-connections');
      }
      
      // התחל לעקוב אחר תנועת הבלוק הראשי
      startBlockTracking();
      
      showStatus(`Dragging ${chain.length} blocks`);
      log("Drag started successfully");
    } catch (err) {
      warn("Error starting drag:", err);
      
      // נקה את המצב במקרה של שגיאה
      cleanupDragging();
      
      if (CONFIG.AUTO_REINIT_ON_ERROR) {
        log("Auto-reinitializing due to error");
        reinitialize();
      }
    }
  }

  /**
   * --- עדכון מיקום הבלוק הראשי ---
   * שומר את המיקום הנוכחי של הבלוק הראשי
   */
  function updateMainBlockPosition() {
    if (!mainBlock) return false;
    
    const rect = mainBlock.getBoundingClientRect();
    const newPos = { x: rect.left, y: rect.top };
    
    // בדוק אם זז מספיק
    const moved = (
      Math.abs(newPos.x - lastMainPosition.x) > CONFIG.MIN_MOVEMENT_PX ||
      Math.abs(newPos.y - lastMainPosition.y) > CONFIG.MIN_MOVEMENT_PX
    );
    
    // שמור את המיקום החדש
    lastMainPosition = newPos;
    
    return moved;
  }

  /**
   * --- חישוב מיקומים יחסיים ---
   * מחשב את ההיסטים בין הבלוקים
   */
  function calculateRelativePositions() {
    if (!mainBlock || !chainBlocks.length) return;
    
    blocksData = [];
    
    // קבל את המיקום של הבלוק הראשי
    const mainLeft = parseFloat(mainBlock.style.left) || 0;
    const mainTop = parseFloat(mainBlock.style.top) || 0;
    
    // שמור מידע על כל בלוק
    chainBlocks.forEach(block => {
      // קבל את המיקום הנוכחי
      const left = parseFloat(block.style.left) || 0;
      const top = parseFloat(block.style.top) || 0;
      
      // שמור מיקום יחסי
      blocksData.push({
        block: block,
        relativeLeft: left - mainLeft,
        relativeTop: top - mainTop
      });
    });
    
    log("Calculated positions for", chainBlocks.length, "blocks");
  }

  /**
   * --- סימון בלוקים בשרשרת ---
   * מוסיף סימון ויזואלי לבלוקים
   */
  function markChainBlocks() {
    if (!chainBlocks.length) return;
    
    // הוסף מחלקות לכל בלוק
    chainBlocks.forEach(block => {
      block.classList.add('bgd-chain-block');
      
      if (CONFIG.HIGHLIGHT_BLOCKS) {
        block.classList.add('bgd-highlight');
      }
    });
    
    // סמן במיוחד את הבלוק הראשי
    if (mainBlock) {
      mainBlock.classList.add('bgd-main-block');
    }
  }

  /**
   * --- התחלת מעקב אחר תנועה ---
   * מפעיל טיימר שבודק את מיקום הבלוק הראשי
   */
  function startBlockTracking() {
    // בטל טיימר קודם אם קיים
    stopBlockTracking();
    
    // הפעל טיימר חדש
    checkTimer = setInterval(() => {
      if (!isDragging || !mainBlock) {
        stopBlockTracking();
        return;
      }
      
      // בדוק אם הבלוק עדיין בDOM
      if (!document.body.contains(mainBlock)) {
        warn("Main block removed from DOM");
        endDragging(false);
        return;
      }
      
      // בדוק אם הבלוק עדיין בגרירה (יש לו את המחלקה snap-source)
      if (!mainBlock.classList.contains('snap-source')) {
        // אם לא עבר מספיק זמן, אולי זה רק אתחול של הגרירה
        const timeElapsed = Date.now() - startTimestamp;
        
        if (timeElapsed < 100) {
          // כנראה עדיין בתהליך אתחול
          return;
        }
        
        // הגרירה הסתיימה
        log("Main block is no longer being dragged");
        endDragging(false);
        return;
      }
      
      // בדוק אם הבלוק זז ועדכן את הבלוקים האחרים
      const moved = updateMainBlockPosition();
      if (moved) {
        updateChainPositions();
      }
      
    }, CONFIG.CHECK_INTERVAL_MS);
    
    log("Position tracking started");
  }

  /**
   * --- עצירת מעקב ---
   * מבטל את טיימר המעקב
   */
  function stopBlockTracking() {
    if (checkTimer) {
      clearInterval(checkTimer);
      checkTimer = null;
    }
  }

  /**
   * --- עדכון מיקום הבלוקים בשרשרת ---
   * מזיז את כל הבלוקים בהתאם לתנועת הבלוק הראשי
   */
  function updateChainPositions() {
    if (!isDragging || !mainBlock || !chainBlocks.length || !blocksData.length) return;
    
    // קבל את המיקום הנוכחי של הבלוק הראשי
    const currentMainLeft = parseFloat(mainBlock.style.left) || 0;
    const currentMainTop = parseFloat(mainBlock.style.top) || 0;
    
    // עדכן את כל הבלוקים בשרשרת חוץ מהבלוק הראשי
    blocksData.forEach(data => {
      if (data.block === mainBlock) return;
      
      // וודא שהבלוק עדיין בDOM
      if (!document.body.contains(data.block)) return;
      
      // עדכן את המיקום
      data.block.style.position = 'absolute';
      data.block.style.left = Math.round(currentMainLeft + data.relativeLeft) + 'px';
      data.block.style.top = Math.round(currentMainTop + data.relativeTop) + 'px';
    });
  }

  /**
   * --- סיום גרירה ---
   * מסיים את תהליך הגרירה ומנקה
   */
  function endDragging(byUser = false) {
    if (!isDragging) return;
    
    log("Ending drag, triggered by", byUser ? "user" : "system");
    
    // הפסק מעקב
    stopBlockTracking();
    
    // וודא עדכון אחרון של המיקומים
    updateChainPositions();
    
    // החזר את נקודות החיבור
    if (CONFIG.HIDE_CONNECTION_POINTS) {
      document.body.classList.remove('bgd-hide-connections');
    }
    
    // הסר סימון ויזואלי
    unmarkChainBlocks();
    
    // סמן שהגרירה הסתיימה
    isDragging = false;
    
    // הפעל טיימר לניקוי סופי
    clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(() => {
      cleanupDragging();
    }, CONFIG.CLEANUP_DELAY_MS);
    
    showStatus("Drag complete", 1000);
  }

  /**
   * --- הסרת סימון מהבלוקים ---
   * מסיר את המחלקות שהוספו לבלוקים
   */
  function unmarkChainBlocks() {
    chainBlocks.forEach(block => {
      if (document.body.contains(block)) {
        block.classList.remove('bgd-chain-block', 'bgd-main-block', 'bgd-highlight');
      }
    });
  }

  /**
   * --- ניקוי סופי של נתוני הגרירה ---
   * מנקה את כל המשתנים
   */
  function cleanupDragging() {
    mainBlock = null;
    chainBlocks = [];
    blocksData = [];
    
    log("Drag cleanup complete");
  }

  /**
   * --- טיפול בשחרור לחצן עכבר ---
   * מזהה סיום גרירה
   */
  function handleMouseUp(e) {
    if (!isDragging) return;
    
    log("Mouse up detected");
    endDragging(true);
  }

  /**
   * --- מציאת בלוק תכנות ---
   * מוצא בלוק תכנות בהתחלה מאלמנט נתון
   */
  function findProgrammingBlock(element) {
    let current = element;
    
    while (current && current !== document.body) {
      if (current.classList && 
          current.classList.contains('block-container') && 
          current.closest('#program-blocks')) {
        return current;
      }
      current = current.parentElement;
    }
    
    return null;
  }

  /**
   * --- מציאת שרשרת בלוקים מלאה ---
   * מוצא את כל הבלוקים המחוברים לבלוק נתון
   */
  function findCompleteBlockChain(startBlock) {
    if (!startBlock) return [];
    
    const chain = [startBlock];
    let currentBlock = startBlock;
    let chainLength = 1;
    
    // מצא בלוקים לשמאל
    while (currentBlock.hasAttribute('data-connected-to') && 
           chainLength < CONFIG.MAX_CHAIN_BLOCKS) {
      
      const direction = currentBlock.getAttribute('data-connection-direction');
      const connectedId = currentBlock.getAttribute('data-connected-to');
      
      // רק אם החיבור הוא לשמאל
      if (direction === 'left' && connectedId) {
        const leftBlock = document.getElementById(connectedId);
        
        if (leftBlock) {
          chain.unshift(leftBlock);
          chainLength++;
          currentBlock = leftBlock;
          continue;
        }
      }
      
      break;
    }
    
    // אפס לבלוק ההתחלתי
    currentBlock = startBlock;
    
    // מצא בלוקים לימין
    while (currentBlock.hasAttribute('data-connected-from-right') && 
           chainLength < CONFIG.MAX_CHAIN_BLOCKS) {
      
      const rightBlockId = currentBlock.getAttribute('data-connected-from-right');
      
      if (rightBlockId) {
        const rightBlock = document.getElementById(rightBlockId);
        
        if (rightBlock) {
          chain.push(rightBlock);
          chainLength++;
          currentBlock = rightBlock;
          continue;
        }
      }
      
      break;
    }
    
    return chain;
  }

  /**
   * --- אתחול מחדש ---
   * מאפס את המודול ומאתחל מחדש
   */
  function reinitialize() {
    // נקה את כל המצב הנוכחי
    stopBlockTracking();
    clearTimeout(cleanupTimer);
    
    if (isDragging) {
      endDragging(false);
    }
    
    cleanupDragging();
    
    // אפס ואתחל מחדש
    window.blockGroupDraggingInitialized = false;
    moduleActive = false;
    
    // הפעל מחדש אחרי זמן קצר
    setTimeout(initialize, 200);
  }

  /**
   * --- הוספת כפתור בדיקה (למצב דיבוג) ---
   * מוסיף כפתור שמציג את השרשראות הקיימות
   */
  function addDebugButton() {
    if (!CONFIG.DEBUG) return;
    
    const btn = document.createElement('button');
    btn.textContent = 'בדוק שרשראות';
    btn.style.cssText = 'position:fixed;bottom:15px;right:15px;z-index:9999;padding:8px 12px;background:#2196F3;color:white;border:none;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;cursor:pointer;';
    
    btn.addEventListener('click', () => {
      const blocks = document.querySelectorAll('#program-blocks .block-container');
      let foundChains = 0;
      
      blocks.forEach(block => {
        const chain = findCompleteBlockChain(block);
        if (chain.length > 1) {
          console.log(`Block ${block.id || 'unknown'} has chain of ${chain.length} blocks`);
          console.log(chain.map(b => b.id || 'unknown').join(' -> '));
          foundChains++;
        }
      });
      
      if (foundChains === 0) {
        console.log("No chains found");
      } else {
        console.log(`Found ${foundChains} chains`);
      }
      
      showStatus(`Found ${foundChains} chains`);
    });
    
    document.body.appendChild(btn);
  }

  /**
   * --- חשיפת API ציבורי ---
   * מספק גישה חיצונית לפונקציות הרכיב
   */
  window.BlockGroupDrag = {
    // הפעלה מחדש של המודול
    restart: function() {
      reinitialize();
      return "Restarting module...";
    },
    
    // בדיקת סטטוס
    status: function() {
      return {
        initialized: window.blockGroupDraggingInitialized || false,
        active: moduleActive,
        dragging: isDragging,
        chainLength: chainBlocks.length
      };
    },
    
    // הפעלה/כיבוי של המודול
    toggle: function() {
      moduleActive = !moduleActive;
      showStatus(`Group dragging ${moduleActive ? 'enabled' : 'disabled'}`);
      return moduleActive;
    },
    
    // שינוי הגדרות
    setConfig: function(key, value) {
      if (key in CONFIG) {
        CONFIG[key] = value;
        return `Config ${key} set to ${value}`;
      }
      return `Unknown config key: ${key}`;
    },
    
    // הצגת הגדרות נוכחיות
    getConfig: function() {
      return { ...CONFIG };
    }
  };

  /**
   * --- התחלת אתחול ---
   * מתחיל את האתחול כשהדף מוכן
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initialize, CONFIG.WAIT_BEFORE_INIT_MS);
    });
  } else {
    setTimeout(initialize, CONFIG.WAIT_BEFORE_INIT_MS);
  }
  
  // הוסף כפתור בדיקה אם במצב דיבוג
  if (CONFIG.DEBUG) {
    setTimeout(addDebugButton, CONFIG.WAIT_BEFORE_INIT_MS + 500);
  }
})();
