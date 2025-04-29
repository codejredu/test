/**
 * blockGroupDragging.js v1.1
 * מודול גרירה קבוצתית של בלוקים תכנות עם יציבות משופרת ללבנה הראשית
 * 
 * יש להכליל קוד זה ישירות בסוף linkageimproved.js
 * (או להוסיף כסקריפט נפרד)
 */

(function() {
  /**
   * --- הגדרות קונפיגורציה ---
   */
  const BGD_CONFIG = {
    DEBUG: false,                    // הדפסת הודעות לקונסול
    UPDATE_INTERVAL_MS: 10,          // תדירות עדכון חריגה (מילישניות)
    MIN_MOVEMENT_PX: 1,              // סף תזוזה מינימלי (פיקסלים)
    HIDE_CONNECTION_POINTS: true,    // הסתרת נקודות חיבור בגרירה
    CLEANUP_DELAY_MS: 300,           // זמן איפוס אחרי גרירה
    WAIT_BEFORE_INIT_MS: 1000,       // זמן המתנה לאתחול
    MAX_CHAIN_BLOCKS: 50,            // מקסימום בלוקים בשרשרת
    AUTO_REINIT_ON_ERROR: true,      // אתחול אוטומטי בשגיאה
    HIGHLIGHT_BLOCKS: false,         // הדגשה חזותית של בלוקים
    STATUS_DISPLAY: false,           // הצגת הודעות סטטוס
    LEAVE_MAIN_BLOCK_ALONE: true,    // אל תשנה את הבלוק הראשי
    PREVENT_JITTER: true             // מניעת רעידות בבלוק הראשי
  };

  /**
   * --- משתנים גלובליים ---
   */
  let moduleActive = false;          // האם המודול פעיל
  let isDragging = false;            // האם יש גרירה כרגע
  let mainBlock = null;              // הבלוק הראשי שנגרר
  let chainBlocks = [];              // כל הבלוקים בשרשרת
  let blocksData = [];               // נתוני מיקום הבלוקים
  let lastMainPosition = null;       // המיקום האחרון של הבלוק הראשי
  let checkTimer = null;             // טיימר בדיקה
  let cleanupTimer = null;           // טיימר ניקוי
  let startTimestamp = 0;            // זמן התחלת הגרירה
  let dragOffsets = { x: 0, y: 0 };  // היסטי הגרירה
  let mainBlockOrigPos = null;       // מיקום מקורי של הבלוק הראשי
  let lastDelta = { x: 0, y: 0 };    // ההיסט האחרון שחושב
  let updateCount = 0;               // מונה עדכונים

  /**
   * --- פונקציות לוג ---
   */
  function bgdLog(...args) {
    if (BGD_CONFIG.DEBUG) console.log("[BGD]", ...args);
  }

  function bgdWarn(...args) {
    if (BGD_CONFIG.DEBUG) console.warn("[BGD]", ...args);
  }

  /**
   * --- אתחול המערכת ---
   */
  function bgdInitialize() {
    // בדוק אם כבר אותחל
    if (window.blockGroupDraggingInitialized) {
      bgdLog("Already initialized");
      return;
    }

    bgdLog("Initializing Block Group Dragging v1.1");

    // הוסף סגנונות CSS
    bgdAddStyles();

    // התקן מאזינים
    bgdSetupListeners();

    // הפעל את המודול
    moduleActive = true;
    window.blockGroupDraggingInitialized = true;

    // הצג סטטוס
    bgdShowStatus("Block Group Dragging Ready");
    bgdLog("Initialization complete");
  }

  /**
   * --- הוספת סגנונות CSS ---
   */
  function bgdAddStyles() {
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
    bgdLog("Styles added");

    // הוסף אלמנט סטטוס
    if (BGD_CONFIG.STATUS_DISPLAY) {
      const statusEl = document.createElement('div');
      statusEl.id = 'bgd-status';
      document.body.appendChild(statusEl);
    }
  }

  /**
   * --- התקנת מאזינים ---
   */
  function bgdSetupListeners() {
    // מאזין התחלת גרירה - כשליש מהתהליך
    document.addEventListener('mousedown', bgdHandleMouseDown, true);
    
    // מאזין תזוזת עכבר - שליש נוסף מהתהליך
    document.addEventListener('mousemove', bgdHandleMouseMove, true);
    
    // מאזין סיום גרירה
    document.addEventListener('mouseup', bgdHandleMouseUp, true);
    
    bgdLog("Event listeners installed");
  }

  /**
   * --- הצגת הודעת סטטוס ---
   */
  function bgdShowStatus(message, duration = 2000) {
    if (!BGD_CONFIG.STATUS_DISPLAY) return;
    
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
   */
  function bgdHandleMouseDown(e) {
    // אם המודול לא פעיל או לא לחיצה שמאלית, צא
    if (!moduleActive || e.button !== 0) return;
    
    // סיים גרירה קודמת אם קיימת
    if (isDragging) {
      bgdLog("Ending previous drag first");
      bgdEndDragging(false);
    }
    
    // מצא בלוק תכנות
    const block = bgdFindProgrammingBlock(e.target);
    if (!block) return;
    
    bgdLog("Block clicked:", block.id || "unknown");

    // שמור את היסט העכבר מהבלוק
    const rect = block.getBoundingClientRect();
    dragOffsets = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // מצא את כל הבלוקים בשרשרת
    const chain = bgdFindCompleteBlockChain(block);
    
    // אם יש רק בלוק אחד או אין בלוקים, אל תפעיל גרירה קבוצתית
    if (chain.length <= 1) {
      bgdLog("Single block - regular drag");
      return;
    }
    
    bgdLog(`Found chain with ${chain.length} blocks`);
    
    // התחל גרירה קבוצתית
    bgdStartDragging(block, chain, e);
  }

  /**
   * --- טיפול בתנועת עכבר ---
   * חלק מהתהליך - עובד מול הטיימר לשיפור ביצועים
   */
  function bgdHandleMouseMove(e) {
    if (!isDragging || !mainBlock) return;
    
    // במקום לעדכן באופן ישיר, שמור את מיקום העכבר הנוכחי
    window.bgdCurrentMouseX = e.clientX;
    window.bgdCurrentMouseY = e.clientY;
  }

  /**
   * --- התחלת גרירה קבוצתית ---
   */
  function bgdStartDragging(block, chain, e) {
    try {
      // שמור את הבלוק הראשי והשרשרת
      mainBlock = block;
      chainBlocks = chain;
      isDragging = true;
      startTimestamp = Date.now();
      mainBlockOrigPos = {
        left: parseFloat(mainBlock.style.left) || 0,
        top: parseFloat(mainBlock.style.top) || 0
      };
      
      // שמור את מיקום העכבר הנוכחי
      window.bgdCurrentMouseX = e.clientX;
      window.bgdCurrentMouseY = e.clientY;
      
      // קבל את המיקום הנוכחי של הבלוק הראשי
      updateMainBlockPosition();
      
      // חשב את המיקומים היחסיים
      calculateRelativePositions();
      
      // הוסף סימון ויזואלי לבלוקים
      markChainBlocks();
      
      // הסתר נקודות חיבור אם צריך
      if (BGD_CONFIG.HIDE_CONNECTION_POINTS) {
        document.body.classList.add('bgd-hide-connections');
      }
      
      // התחל לעקוב אחר תנועת הבלוק הראשי
      startBlockTracking();
      
      bgdShowStatus(`Dragging ${chain.length} blocks`);
      bgdLog("Drag started successfully");
    } catch (err) {
      bgdWarn("Error starting drag:", err);
      
      // נקה את המצב במקרה של שגיאה
      cleanupDragging();
      
      if (BGD_CONFIG.AUTO_REINIT_ON_ERROR) {
        bgdLog("Auto-reinitializing due to error");
        bgdReinitialize();
      }
    }
  }

  /**
   * --- עדכון מיקום הבלוק הראשי ---
   */
  function updateMainBlockPosition() {
    if (!mainBlock) return false;
    
    const rect = mainBlock.getBoundingClientRect();
    const newPos = { 
      x: rect.left, 
      y: rect.top,
      left: parseFloat(mainBlock.style.left) || 0,
      top: parseFloat(mainBlock.style.top) || 0
    };
    
    // אתחל את המיקום האחרון אם צריך
    if (!lastMainPosition) {
      lastMainPosition = newPos;
      return false;
    }
    
    // בדוק אם זז מספיק
    const moved = (
      Math.abs(newPos.x - lastMainPosition.x) > BGD_CONFIG.MIN_MOVEMENT_PX ||
      Math.abs(newPos.y - lastMainPosition.y) > BGD_CONFIG.MIN_MOVEMENT_PX ||
      Math.abs(newPos.left - lastMainPosition.left) > BGD_CONFIG.MIN_MOVEMENT_PX ||
      Math.abs(newPos.top - lastMainPosition.top) > BGD_CONFIG.MIN_MOVEMENT_PX
    );
    
    // שמור את המיקום החדש
    lastMainPosition = newPos;
    
    return moved;
  }

  /**
   * --- חישוב מיקומים יחסיים ---
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
        relativeTop: top - mainTop,
        originalLeft: left,
        originalTop: top
      });
    });
    
    bgdLog("Calculated positions for", chainBlocks.length, "blocks");
  }

  /**
   * --- סימון בלוקים בשרשרת ---
   */
  function markChainBlocks() {
    if (!chainBlocks.length) return;
    
    // הוסף מחלקות לכל בלוק
    chainBlocks.forEach(block => {
      if (block !== mainBlock || !BGD_CONFIG.LEAVE_MAIN_BLOCK_ALONE) {
        block.classList.add('bgd-chain-block');
        
        if (BGD_CONFIG.HIGHLIGHT_BLOCKS) {
          block.classList.add('bgd-highlight');
        }
      }
    });
    
    // סמן במיוחד את הבלוק הראשי
    if (mainBlock && BGD_CONFIG.HIGHLIGHT_BLOCKS && !BGD_CONFIG.LEAVE_MAIN_BLOCK_ALONE) {
      mainBlock.classList.add('bgd-main-block');
    }
  }

  /**
   * --- התחלת מעקב אחר תנועה ---
   */
  function startBlockTracking() {
    // בטל טיימר קודם אם קיים
    stopBlockTracking();
    
    // הפעל טיימר חדש עם אינטרוול קצר יותר (משמעותית)
    checkTimer = setInterval(() => {
      if (!isDragging || !mainBlock) {
        stopBlockTracking();
        return;
      }
      
      // בדוק אם הבלוק עדיין בDOM
      if (!document.body.contains(mainBlock)) {
        bgdWarn("Main block removed from DOM");
        bgdEndDragging(false);
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
        bgdLog("Main block is no longer being dragged");
        bgdEndDragging(false);
        return;
      }
      
      // **חידוש חשוב**: במקום להסתמך על תזוזת הבלוק הראשי,
      // אנו משתמשים ישירות במיקום העכבר
      if (window.bgdCurrentMouseX !== undefined && window.bgdCurrentMouseY !== undefined) {
        updatePositionsFromMouse();
      }
      
    }, BGD_CONFIG.UPDATE_INTERVAL_MS); // אינטרוול קצר יותר
    
    bgdLog("Position tracking started");
  }

  /**
   * --- עצירת מעקב ---
   */
  function stopBlockTracking() {
    if (checkTimer) {
      clearInterval(checkTimer);
      checkTimer = null;
    }
  }

  /**
   * --- עדכון מיקומים ישירות ממיקום העכבר ---
   * גישה חדשה - שימוש ישיר בעכבר במקום להסתמך על תזוזת הבלוק הראשי
   */
  function updatePositionsFromMouse() {
    if (!isDragging || !mainBlock || !blocksData.length) return;
    
    // קבל את אזור התכנות
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    
    const programRect = programArea.getBoundingClientRect();
    
    // **חידוש**: חשב את המיקום החדש ישירות ממיקום העכבר
    const mouseX = window.bgdCurrentMouseX;
    const mouseY = window.bgdCurrentMouseY;
    
    // יצירת מיקום חדש - עדכון הבלוק הראשי
    if (!BGD_CONFIG.LEAVE_MAIN_BLOCK_ALONE) {
      const newLeft = mouseX - programRect.left - dragOffsets.x + programArea.scrollLeft;
      const newTop = mouseY - programRect.top - dragOffsets.y + programArea.scrollTop;
      
      // שים מגבלות כדי להישאר באזור הנראה
      const adjustedLeft = Math.max(0, newLeft);
      const adjustedTop = Math.max(0, newTop);
      
      // מיקום החדש
      //mainBlock.style.left = `${Math.round(adjustedLeft)}px`;
      //mainBlock.style.top = `${Math.round(adjustedTop)}px`;
    }
    
    // קבל את המיקום העדכני של הבלוק הראשי (כפי שנקבע על ידי המערכת המקורית)
    const currentMainLeft = parseFloat(mainBlock.style.left) || 0;
    const currentMainTop = parseFloat(mainBlock.style.top) || 0;
    
    // חשב את השינוי מהמיקום המקורי
    const deltaX = currentMainLeft - mainBlockOrigPos.left;
    const deltaY = currentMainTop - mainBlockOrigPos.top;
    
    // **חידוש** - מונע רעידות על ידי אימוץ השינוי רק אם הוא גדול מספיק
    if (BGD_CONFIG.PREVENT_JITTER) {
      if (Math.abs(deltaX - lastDelta.x) < 1 && Math.abs(deltaY - lastDelta.y) < 1) {
        // דילוג על עדכון קטן מדי למניעת רעידות
        return;
      }
      
      // שמור את ההיסט הנוכחי
      lastDelta = { x: deltaX, y: deltaY };
    }
    
    updateCount++;
    
    // עדכן את כל הבלוקים המחוברים (לא כולל הבלוק הראשי)
    blocksData.forEach(data => {
      // דלג על הבלוק הראשי
      if (data.block === mainBlock) return;
      
      // וודא שהבלוק עדיין בDOM
      if (!document.body.contains(data.block)) return;
      
      // עדכן את המיקום - שימוש בהיסט מוחלט מהמיקום המקורי
      data.block.style.position = 'absolute';
      data.block.style.left = `${Math.round(data.originalLeft + deltaX)}px`;
      data.block.style.top = `${Math.round(data.originalTop + deltaY)}px`;
    });
  }

  /**
   * --- סיום גרירה ---
   */
  function bgdEndDragging(byUser = false) {
    if (!isDragging) return;
    
    bgdLog("Ending drag, triggered by", byUser ? "user" : "system");
    bgdLog(`Total updates during drag: ${updateCount}`);
    
    // הפסק מעקב
    stopBlockTracking();
    
    // וודא עדכון אחרון של המיקומים
    if (window.bgdCurrentMouseX !== undefined && window.bgdCurrentMouseY !== undefined) {
      updatePositionsFromMouse();
    }
    
    // החזר את נקודות החיבור
    if (BGD_CONFIG.HIDE_CONNECTION_POINTS) {
      document.body.classList.remove('bgd-hide-connections');
    }
    
    // הסר סימון ויזואלי
    unmarkChainBlocks();
    
    // סמן שהגרירה הסתיימה
    isDragging = false;
    updateCount = 0;
    
    // נקה משתני עכבר
    window.bgdCurrentMouseX = undefined;
    window.bgdCurrentMouseY = undefined;
    
    // הפעל טיימר לניקוי סופי
    clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(() => {
      cleanupDragging();
    }, BGD_CONFIG.CLEANUP_DELAY_MS);
    
    bgdShowStatus("Drag complete", 1000);
  }

  /**
   * --- הסרת סימון מהבלוקים ---
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
   */
  function cleanupDragging() {
    mainBlock = null;
    chainBlocks = [];
    blocksData = [];
    lastMainPosition = null;
    mainBlockOrigPos = null;
    lastDelta = { x: 0, y: 0 };
    
    bgdLog("Drag cleanup complete");
  }

  /**
   * --- טיפול בשחרור לחצן עכבר ---
   */
  function bgdHandleMouseUp(e) {
    if (!isDragging) return;
    
    bgdLog("Mouse up detected");
    bgdEndDragging(true);
  }

  /**
   * --- מציאת בלוק תכנות ---
   */
  function bgdFindProgrammingBlock(element) {
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
   */
  function bgdFindCompleteBlockChain(startBlock) {
    if (!startBlock) return [];
    
    const chain = [startBlock];
    let currentBlock = startBlock;
    let chainLength = 1;
    
    // מצא בלוקים לשמאל
    while (currentBlock.hasAttribute('data-connected-to') && 
           chainLength < BGD_CONFIG.MAX_CHAIN_BLOCKS) {
      
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
           chainLength < BGD_CONFIG.MAX_CHAIN_BLOCKS) {
      
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
   */
  function bgdReinitialize() {
    // נקה את כל המצב הנוכחי
    stopBlockTracking();
    clearTimeout(cleanupTimer);
    
    if (isDragging) {
      bgdEndDragging(false);
    }
    
    cleanupDragging();
    
    // אפס ואתחל מחדש
    window.blockGroupDraggingInitialized = false;
    moduleActive = false;
    
    // הפעל מחדש אחרי זמן קצר
    setTimeout(bgdInitialize, 200);
  }

  /**
   * --- הוספת כפתור בדיקה (למצב דיבוג) ---
   */
  function bgdAddDebugButton() {
    if (!BGD_CONFIG.DEBUG) return;
    
    const btn = document.createElement('button');
    btn.textContent = 'בדוק שרשראות';
    btn.style.cssText = 'position:fixed;bottom:15px;right:15px;z-index:9999;padding:8px 12px;background:#2196F3;color:white;border:none;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;cursor:pointer;';
    
    btn.addEventListener('click', () => {
      const blocks = document.querySelectorAll('#program-blocks .block-container');
      let foundChains = 0;
      
      blocks.forEach(block => {
        const chain = bgdFindCompleteBlockChain(block);
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
      
      bgdShowStatus(`Found ${foundChains} chains`);
    });
    
    document.body.appendChild(btn);
  }

  /**
   * --- חשיפת API ציבורי ---
   */
  window.BlockGroupDrag = {
    // הפעלה מחדש של המודול
    restart: function() {
      bgdReinitialize();
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
      bgdShowStatus(`Group dragging ${moduleActive ? 'enabled' : 'disabled'}`);
      return moduleActive;
    },
    
    // שינוי הגדרות
    setConfig: function(key, value) {
      if (key in BGD_CONFIG) {
        BGD_CONFIG[key] = value;
        return `Config ${key} set to ${value}`;
      }
      return `Unknown config key: ${key}`;
    },
    
    // הצגת הגדרות נוכחיות
