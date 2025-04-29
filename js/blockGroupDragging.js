/**
 * blockGroupDragging.js v1.0
 * קובץ המאפשר גרירה קבוצתית של בלוקי תכנות
 * הלבנה הראשונה משמשת כ"קטר" שדוחף/מושך את שאר הבלוקים
 */

(function() {
  // --- בדיקה שלא יריצו פעמיים ---
  if (window.blockGroupDraggingInitialized) {
    console.log("Block Group Dragging already initialized.");
    return;
  }
  
  // --- קונפיגורציה ---
  const CONFIG = {
    DEBUG: true,                    // הצגת הודעות דיבוג בקונסול
    UPDATE_INTERVAL_MS: 10,         // תדירות בדיקות (מילישניות)
    ACTIVATION_DELAY_MS: 500,       // המתנה לאתחול מערכת קישור בלוקים
    HORIZONTAL_OFFSET: -9,          // היסט אופקי בין בלוקים מחוברים
    VERTICAL_OFFSET: 0,             // היסט אנכי בין בלוקים מחוברים
    MAX_BLOCKS_IN_CHAIN: 50,        // הגבלת אורך שרשרת לביצועים
    FAIL_SAFE_CHECK: true           // בדיקת מנגנון התאוששות
  };
  
  // --- משתנים גלובליים ---
  let isActive = false;              // האם המודול פעיל כרגע
  let timerInterval = null;          // מזהה אינטרוול הבדיקה
  let lastDraggedBlock = null;       // הבלוק האחרון שהיה בגרירה
  let blockMovementCount = 0;        // מונה תנועות בלוקים (דיבוג)
  
  // --- פונקציית לוג עם דיבוג ---
  function log(...args) {
    if (CONFIG.DEBUG) {
      console.log("[BlockGroupDrag]", ...args);
    }
  }
  
  // --- הפעלת המודול ---
  function initialize() {
    log("Initializing BlockGroupDragging v1.0...");
    
    // מנע התחברות כפולה
    if (isActive) {
      log("Already active, skipping initialization");
      return;
    }
    
    // בדוק שהמערכת בבסיס הוטענה
    if (!document.querySelector('#program-blocks')) {
      log("Programming area not found, waiting...");
      setTimeout(initialize, 300);
      return;
    }

    // הפעל טיימר שיבדוק גרירת בלוקים
    timerInterval = setInterval(checkForDraggedBlocks, CONFIG.UPDATE_INTERVAL_MS);
    
    // סמן שהמודול אותחל ופעיל
    isActive = true;
    window.blockGroupDraggingInitialized = true;
    
    log("Initialization complete");
    log("Monitoring for block dragging events...");
  }
  
  // --- בדיקת בלוקים בגרירה ---
  function checkForDraggedBlocks() {
    try {
      // מצא בלוק שנגרר כרגע (מסומן עם המחלקה snap-source)
      const draggedBlock = document.querySelector('#program-blocks .block-container.snap-source');
      
      // אם אין בלוק בגרירה, נקה את המצב הקודם
      if (!draggedBlock) {
        if (lastDraggedBlock) {
          log("Drag ended");
          lastDraggedBlock = null;
        }
        return;
      }
      
      // אם זה בלוק חדש שנגרר
      if (draggedBlock !== lastDraggedBlock) {
        log("New drag started:", draggedBlock.id);
        lastDraggedBlock = draggedBlock;
        blockMovementCount = 0;
      }
      
      // קבל את המיקום הנוכחי של הבלוק הנגרר
      const mainLeft = parseFloat(draggedBlock.style.left) || 0;
      const mainTop = parseFloat(draggedBlock.style.top) || 0;
      
      // עדכן את מיקום כל הבלוקים המחוברים לבלוק הנגרר
      const updatedCount = updateConnectedBlocks(draggedBlock, mainLeft, mainTop);
      
      // ספור את סך התנועות (למטרות דיבוג)
      if (updatedCount > 0) {
        blockMovementCount++;
      }
    } catch (err) {
      log("Error in check:", err);
      if (CONFIG.FAIL_SAFE_CHECK) {
        // אתחל מחדש אם יש שגיאה
        try {
          stop();
          setTimeout(initialize, 1000);
        } catch (e) {
          console.error("Failed to recover:", e);
        }
      }
    }
  }
  
  // --- עדכון בלוקים מחוברים ---
  function updateConnectedBlocks(sourceBlock, baseLeft, baseTop) {
    let updatedCount = 0;
    
    // --- מיקום בלוקים מחוברים מימין ---
    updatedCount += updateRightConnections(sourceBlock, baseLeft, baseTop);
    
    // --- מיקום בלוקים מחוברים משמאל ---
    updatedCount += updateLeftConnections(sourceBlock, baseLeft, baseTop);
    
    return updatedCount;
  }
  
  // --- עדכון בלוקים מחוברים מימין (רקורסיבי) ---
  function updateRightConnections(block, baseLeft, baseTop, depth = 0) {
    // בדיקת עומק למניעת לולאה אינסופית
    if (depth >= CONFIG.MAX_BLOCKS_IN_CHAIN) {
      return 0;
    }
    
    // בדוק אם יש בלוק מחובר מימין
    if (!block.hasAttribute('data-connected-from-right')) {
      return 0;
    }
    
    // קבל את מזהה הבלוק הימני
    const rightBlockId = block.getAttribute('data-connected-from-right');
    const rightBlock = document.getElementById(rightBlockId);
    
    // אם הבלוק לא קיים, צא
    if (!rightBlock) {
      return 0;
    }
    
    // עדכן את מיקום הבלוק הימני
    // חשב מרחק בהתבסס על הרוחב של הבלוק הנוכחי
    const blockWidth = block.offsetWidth || 80; // ברירת מחדל אם לא ניתן לקבל רוחב
    
    // קבע מיקום חדש לבלוק הימני
    rightBlock.style.position = 'absolute';
    rightBlock.style.left = (baseLeft + blockWidth + CONFIG.HORIZONTAL_OFFSET) + 'px';
    rightBlock.style.top = (baseTop + CONFIG.VERTICAL_OFFSET) + 'px';
    
    // המשך רקורסיבית לבלוקים נוספים מימין
    const rightUpdated = updateRightConnections(
      rightBlock, 
      baseLeft + blockWidth + CONFIG.HORIZONTAL_OFFSET, 
      baseTop + CONFIG.VERTICAL_OFFSET,
      depth + 1
    );
    
    // החזר מספר הבלוקים שעודכנו (כולל זה)
    return 1 + rightUpdated;
  }
  
  // --- עדכון בלוקים מחוברים משמאל (רקורסיבי) ---
  function updateLeftConnections(block, baseLeft, baseTop, depth = 0) {
    // בדיקת עומק למניעת לולאה אינסופית
    if (depth >= CONFIG.MAX_BLOCKS_IN_CHAIN) {
      return 0;
    }
    
    // בדוק אם הבלוק מחובר לבלוק אחר משמאל
    if (!block.hasAttribute('data-connected-to') || 
        block.getAttribute('data-connection-direction') !== 'left') {
      return 0;
    }
    
    // קבל את מזהה הבלוק השמאלי
    const leftBlockId = block.getAttribute('data-connected-to');
    const leftBlock = document.getElementById(leftBlockId);
    
    // אם הבלוק לא קיים, צא
    if (!leftBlock) {
      return 0;
    }
    
    // עדכן את מיקום הבלוק השמאלי
    // הבלוק השמאלי צריך להיות ממוקם כך שהקצה הימני שלו יתחבר לקצה השמאלי של הבלוק הנוכחי
    const leftBlockWidth = leftBlock.offsetWidth || 80; // ברירת מחדל אם לא ניתן לקבל רוחב
    
    // קבע מיקום חדש לבלוק השמאלי
    leftBlock.style.position = 'absolute';
    leftBlock.style.left = (baseLeft - leftBlockWidth - CONFIG.HORIZONTAL_OFFSET) + 'px';
    leftBlock.style.top = (baseTop + CONFIG.VERTICAL_OFFSET) + 'px';
    
    // המשך רקורסיבית לבלוקים נוספים משמאל
    const leftUpdated = updateLeftConnections(
      leftBlock, 
      baseLeft - leftBlockWidth - CONFIG.HORIZONTAL_OFFSET, 
      baseTop + CONFIG.VERTICAL_OFFSET,
      depth + 1
    );
    
    // החזר מספר הבלוקים שעודכנו (כולל זה)
    return 1 + leftUpdated;
  }
  
  // --- עצירת המודול ---
  function stop() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    isActive = false;
    lastDraggedBlock = null;
    
    log("Stopped monitoring for block dragging");
  }
  
  // --- אתחול מחדש ---
  function restart() {
    stop();
    
    // אתחל מחדש אחרי השהייה קצרה
    setTimeout(() => {
      log("Restarting...");
      initialize();
    }, 100);
    
    return "Restarting BlockGroupDragging...";
  }
  
  // --- בדיקת פעילות המודול ---
  function getStatus() {
    return {
      active: isActive,
      initialized: window.blockGroupDraggingInitialized || false,
      lastDraggedBlock: lastDraggedBlock ? lastDraggedBlock.id : null,
      movements: blockMovementCount
    };
  }
  
  // --- חשיפת API ציבורי ---
  window.BlockGroupDrag = {
    start: initialize,
    stop: stop,
    restart: restart,
    status: getStatus,
    
    // שינוי הגדרות בזמן ריצה
    setDebug: function(value) {
      CONFIG.DEBUG = !!value;
      return `Debug mode ${CONFIG.DEBUG ? 'enabled' : 'disabled'}`;
    },
    
    // שינוי תדירות בדיקות
    setUpdateInterval: function(ms) {
      if (typeof ms !== 'number' || ms < 5 || ms > 500) {
        return "Invalid interval. Must be between 5 and 500 ms.";
      }
      
      CONFIG.UPDATE_INTERVAL_MS = ms;
      
      // יישם מיד אם פעיל
      if (isActive && timerInterval) {
        clearInterval(timerInterval);
        timerInterval = setInterval(checkForDraggedBlocks, CONFIG.UPDATE_INTERVAL_MS);
      }
      
      return `Update interval set to ${ms} ms`;
    },
    
    // שינוי הסטים
    setOffsets: function(horizontal, vertical) {
      if (typeof horizontal === 'number') {
        CONFIG.HORIZONTAL_OFFSET = horizontal;
      }
      
      if (typeof vertical === 'number') {
        CONFIG.VERTICAL_OFFSET = vertical;
      }
      
      return `Offsets set to: H=${CONFIG.HORIZONTAL_OFFSET}, V=${CONFIG.VERTICAL_OFFSET}`;
    }
  };
  
  // --- אתחול ראשוני אוטומטי ---
  // המתן זמן מה כדי לאפשר לשאר הסקריפטים להטען
  setTimeout(initialize, CONFIG.ACTIVATION_DELAY_MS);
  
  log("BlockGroupDragging module loaded");
})();
