// מודול תיקון חיבור קבוצות בדו-כיווניות - group-connect.js

(function() {
  console.log("[GroupFix] טוען מודול פתרון סופי עם תיקוני מיקום ואודיו");
  
  // קונפיגורציה
  const CONFIG = {
    SNAP_THRESHOLD: 25,           // מרחק סף להצמדה
    PERFECT_SNAP_DISTANCE: 0,     // מרחק מדויק בהצמדה (0 = מושלם)
    CONNECTION_HIGHLIGHT: true,    // האם להדגיש חיבורים אפשריים
    AUDIO_VOLUME: 0.5,            // עוצמת קול בהשמעת צליל חיבור
    AUDIO_PATH: 'assets/sound/link.mp3',  // נתיב לקובץ צליל
    DEBUG: true,                  // האם להציג הודעות דיבג
    BIDIRECTIONAL: true           // תמיכה בחיבור דו-כיווני
  };
  
  // משתנים גלובליים
  let audioPlayer = null;
  let originalDragHandler = null;
  let originalDropHandler = null;
  
  // יצירת אובייקט אודיו
  function setupAudio() {
    try {
      // בדוק אם כבר יש אובייקט אודיו במערכת
      if (!window.snapAudio) {
        window.snapAudio = new Audio(CONFIG.AUDIO_PATH);
        window.snapAudio.volume = CONFIG.AUDIO_VOLUME;
      }
      audioPlayer = window.snapAudio;
      console.log("[GroupFix] מערכת אודיו הוגדרה");
    } catch (err) {
      console.warn("[GroupFix] שגיאה באתחול אודיו:", err);
    }
  }
  
  // הוספת סגנונות למודול
  function injectStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .group-connection-highlight {
        box-shadow: 0 0 8px 2px rgba(0, 255, 0, 0.7) !important;
        outline: 2px solid rgba(0, 255, 0, 0.7) !important;
      }
      
      /* מונע רווחים מיותרים בין בלוקים */
      .block {
        margin: 0 !important;
        box-sizing: border-box !important;
      }
      
      /* תיקון מיקום עבור בלוקים מחוברים */
      .connected-block {
        transition: none !important;
        transform: none !important;
      }
      
      /* כדי לתקן את חיבורי הפאזל */
      .block.right-connected {
        margin-right: 0 !important;
        padding-right: 0 !important;
      }
      
      .block.left-connected {
        margin-left: 0 !important;
        padding-left: 0 !important;
      }
    `;
    document.head.appendChild(styleEl);
    console.log("[GroupFix] סגנונות הוזרקו");
  }
  
  // פונקציה לחישוב מרחק בין שני אלמנטים
  function calculateDistance(rect1, rect2, direction) {
    if (direction === 'right') {
      // מרחק בין הצד הימני של rect1 לצד השמאלי של rect2
      return Math.abs(rect1.right - rect2.left);
    } else if (direction === 'left') {
      // מרחק בין הצד השמאלי של rect1 לצד הימני של rect2
      return Math.abs(rect1.left - rect2.right);
    }
    
    // מרחק כללי - מינימום בין שתי האפשרויות
    const rightToLeftDist = Math.abs(rect1.right - rect2.left);
    const leftToRightDist = Math.abs(rect1.left - rect2.right);
    return Math.min(rightToLeftDist, leftToRightDist);
  }
  
  // זיהוי כיוון החיבור האופטימלי בין שני אלמנטים
  function determineConnectionDirection(rect1, rect2) {
    const rightToLeftDist = Math.abs(rect1.right - rect2.left);
    const leftToRightDist = Math.abs(rect1.left - rect2.right);
    
    if (rightToLeftDist < leftToRightDist) {
      return 'right'; // חיבור מימין של rect1 לשמאל של rect2
    } else {
      return 'left';  // חיבור משמאל של rect1 לימין של rect2
    }
  }
  
  // פונקציית הצמדה מדויקת שעובדת לכל הכיוונים
  function performPerfectSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock) return false;
    
    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    
    // הוסף מחלקת מחובר לשני הבלוקים
    sourceBlock.classList.add('connected-block');
    targetBlock.classList.add('connected-block');
    
    let newLeft, newTop;
    
    if (direction === 'right') {
      // חיבור מימין של source לשמאל של target
      newLeft = targetRect.left - sourceRect.width - CONFIG.PERFECT_SNAP_DISTANCE;
      
      // נסה לשמור על יישור אנכי מושלם
      newTop = targetRect.top;
      
      // הוסף מחלקות לציון כיוון החיבור
      sourceBlock.classList.add('right-connected');
      targetBlock.classList.add('left-connected');
    } else if (direction === 'left') {
      // חיבור משמאל של source לימין של target
      newLeft = targetRect.right + CONFIG.PERFECT_SNAP_DISTANCE;
      
      // נסה לשמור על יישור אנכי מושלם
      newTop = targetRect.top;
      
      // הוסף מחלקות לציון כיוון החיבור
      sourceBlock.classList.add('left-connected');
      targetBlock.classList.add('right-connected');
    }
    
    // עדכן את מיקום בלוק המקור
    applyExactPosition(sourceBlock, newLeft, newTop);
    
    return true;
  }
  
  // פונקציה המחילה מיקום מדויק על בלוק (גורמת לרנדור מחדש)
  function applyExactPosition(block, left, top) {
    if (!block) return;
    
    // הגדרת סגנונות ישירות עם !important כדי לדרוס הגדרות אחרות
    block.style.cssText = `
      position: absolute !important;
      left: ${left}px !important;
      top: ${top}px !important;
      margin: 0 !important;
      transform: none !important;
      transition: none !important;
    `;
    
    // כפה רנדור מחדש
    void block.offsetWidth;
  }
  
  // השמע צליל חיבור
  function playConnectionSound() {
    try {
      if (audioPlayer) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
        if (CONFIG.DEBUG) {
          console.log("[GroupFix] צליל חיבור הושמע");
        }
      }
    } catch (err) {
      console.warn("[GroupFix] שגיאה בהשמעת צליל:", err);
    }
  }
  
  // מצא את הבלוק הנגרר הנוכחי (ותומך גם בקבוצות)
  function getCurrentDraggedBlock() {
    // בדוק אם יש משתנה חשוף מהמודול המקורי
    if (window.blockLinkageState && window.blockLinkageState.currentDraggedBlock) {
      return window.blockLinkageState.currentDraggedBlock;
    }
    
    // בדוק אם יש בלוק עם מחלקת גרירה
    const draggedBlocks = document.querySelectorAll('.dragging, .group-dragging');
    if (draggedBlocks.length > 0) {
      return draggedBlocks[0];
    }
    
    return null;
  }
  
  // טיפול באירוע של עכבר למטה על בלוק
  function handleMouseDown(e) {
    // קרא לפונקציה המקורית אם קיימת
    if (originalDragHandler) {
      originalDragHandler(e);
    }
    
    // מרגע זה, הפונקציה שלנו תוסיף תמיכה בכיוון הפוך
    if (CONFIG.BIDIRECTIONAL) {
      enableReverseDirectionTracking();
    }
  }
  
  // הפעל מעקב לחיבורים בכיוון הפוך
  function enableReverseDirectionTracking() {
    document.addEventListener('mousemove', monitorReverseConnections);
    document.addEventListener('mouseup', cleanupReverseMonitoring, { once: true });
  }
  
  // נקה את המעקב לכיוון הפוך
  function cleanupReverseMonitoring() {
    document.removeEventListener('mousemove', monitorReverseConnections);
  }
  
  // מעקב אחר חיבורים בכיוון הפוך (מימין לשמאל)
  function monitorReverseConnections(e) {
    const draggedBlock = getCurrentDraggedBlock();
    if (!draggedBlock) return;
    
    // בדוק אם יש קבוצת גרירה
    const isGroupDrag = document.querySelectorAll('.group-dragging').length > 1;
    
    // מצא את הבלוק הימני ביותר בקבוצה (רלוונטי לגרירת קבוצה)
    let rightmostBlock = draggedBlock;
    
    if (isGroupDrag) {
      const groupBlocks = Array.from(document.querySelectorAll('.group-dragging'));
      rightmostBlock = groupBlocks.reduce((rightmost, block) => {
        const rightmostRect = rightmost.getBoundingClientRect();
        const blockRect = block.getBoundingClientRect();
        return blockRect.right > rightmostRect.right ? block : rightmost;
      }, groupBlocks[0]);
    }
    
    // מצא בלוקים פוטנציאליים לחיבור מימין לשמאל
    const allBlocks = Array.from(document.querySelectorAll('.block:not(.group-dragging):not(.in-drawer)'));
    
    // מצא את הבלוק הקרוב ביותר בכיוון שמאלה
    let closestLeftBlock = null;
    let minLeftDistance = CONFIG.SNAP_THRESHOLD;
    
    const rightmostRect = rightmostBlock.getBoundingClientRect();
    
    for (const targetBlock of allBlocks) {
      const targetRect = targetBlock.getBoundingClientRect();
      
      // בדוק אם הבלוק נמצא משמאל לימני ביותר בקבוצה
      if (targetRect.left < rightmostRect.right) {
        continue; // דלג על בלוקים שאינם משמאל
      }
      
      // חשב את המרחק האופקי בין הבלוקים
      const horizontalDistance = Math.abs(rightmostRect.right - targetRect.left);
      
      // בדוק גם יישור אנכי (שהבלוקים באותו גובה בערך)
      const verticalAlignment = Math.abs(rightmostRect.top - targetRect.top) < 10;
      
      if (horizontalDistance < minLeftDistance && verticalAlignment) {
        minLeftDistance = horizontalDistance;
        closestLeftBlock = targetBlock;
      }
    }
    
    // אם נמצא בלוק קרוב מספיק, הדגש אותו
    if (closestLeftBlock) {
      if (CONFIG.DEBUG) {
        console.log(`[GroupFix] הדגשת חיבור בין: ${rightmostBlock.id} -> ${closestLeftBlock.id}, מרחק: ${minLeftDistance.toFixed(1)}px `);
      }
      
      if (CONFIG.CONNECTION_HIGHLIGHT) {
        closestLeftBlock.classList.add('group-connection-highlight');
        rightmostBlock.classList.add('group-connection-highlight');
      }
      
      // אם קרוב מאוד, בצע חיבור מיידי
      if (minLeftDistance <= 5) {
        // חבר את הבלוקים
        connectBlocks(rightmostBlock, closestLeftBlock, 'left');
        
        // הסר את המעקב כי החיבור בוצע
        cleanupReverseMonitoring();
      }
    } else {
      // הסר הדגשות אם אין בלוק קרוב
      document.querySelectorAll('.group-connection-highlight').forEach(block => {
        block.classList.remove('group-connection-highlight');
      });
    }
  }
  
  // חיבור שני בלוקים (או קבוצות)
  function connectBlocks(sourceBlock, targetBlock, direction) {
    if (CONFIG.DEBUG) {
      console.log(`[GroupFix] חיבור קבוצות: ${sourceBlock.id} -> ${targetBlock.id} `);
    }
    
    // בדוק אם מדובר בגרירת קבוצה
    const isGroupDrag = document.querySelectorAll('.group-dragging').length > 1;
    
    if (isGroupDrag && direction === 'left') {
      // חיבור קבוצה מימין לשמאל (המקרה המורכב)
      connectGroupToBlockReverse(sourceBlock, targetBlock);
    } else {
      // בצע הצמדה רגילה בין שני בלוקים
      performPerfectSnap(sourceBlock, targetBlock, direction);
    }
    
    // השמע צליל חיבור
    playConnectionSound();
    
    if (CONFIG.DEBUG) {
      console.log(`[GroupFix] חיבור הושלם בהצלחה `);
    }
  }
  
  // חיבור קבוצה בכיוון של מימין לשמאל
  function connectGroupToBlockReverse(rightmostBlock, targetBlock) {
    // קבל את כל הבלוקים בקבוצה
    const groupBlocks = Array.from(document.querySelectorAll('.group-dragging'));
    
    // מצא את המיקום היחסי של כל בלוק ביחס לבלוק הימני ביותר
    const rightmostRect = rightmostBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    
    // חשב את ההיסט שיש להזיז את הקבוצה
    const offsetX = targetRect.left - rightmostRect.right - CONFIG.PERFECT_SNAP_DISTANCE;
    
    // הזז את כל הבלוקים בקבוצה
    for (const block of groupBlocks) {
      const blockRect = block.getBoundingClientRect();
      const newLeft = blockRect.left + offsetX;
      
      // החל מיקום מדויק על כל בלוק
      applyExactPosition(block, newLeft, blockRect.top);
    }
    
    // סמן את הבלוקים המחוברים
    rightmostBlock.classList.add('right-connected');
    targetBlock.classList.add('left-connected');
  }
  
  // תפיסת האינטרקציה בין בלוקים ברמת המסמך
  function setupInteractionMonitor() {
    // שמור את הפונקציות המקוריות (אם קיימות)
    if (typeof window.handleMouseDown === 'function') {
      originalDragHandler = window.handleMouseDown;
      window.handleMouseDown = handleMouseDown;
    }
    
    if (typeof window.handleMouseUp === 'function') {
      originalDropHandler = window.handleMouseUp;
    }
    
    // הוסף האזנה לאירועי עכבר
    document.addEventListener('mousedown', function(e) {
      const block = e.target.closest('.block');
      if (block) {
        handleMouseDown(e);
      }
    }, true);
    
    console.log("[GroupFix] דורס פונקציות גרירת קבוצות");
  }
  
  // פונקציה לטיפול בבעיות מחשב נמוך
  function optimizeForPerformance() {
    // התאם הגדרות לביצועים נמוכים אם צריך
    if (window.navigator && window.navigator.hardwareConcurrency) {
      if (window.navigator.hardwareConcurrency <= 2) {
        // מחשב חלש, הורד את תדירות הבדיקות ואפשרויות הדיבוג
        CONFIG.DEBUG = false;
      }
    }
  }
  
  // פונקציה לביטול רווחים בין בלוקים מחוברים
  function fixExistingConnections() {
    // מצא את כל הבלוקים המחוברים
    const allBlocks = Array.from(document.querySelectorAll('.block'));
    
    // עבור על כל זוג בלוקים כדי לזהות חיבורים
    for (let i = 0; i < allBlocks.length; i++) {
      const block1 = allBlocks[i];
      const rect1 = block1.getBoundingClientRect();
      
      for (let j = 0; j < allBlocks.length; j++) {
        if (i === j) continue;
        
        const block2 = allBlocks[j];
        const rect2 = block2.getBoundingClientRect();
        
        // בדוק אם הבלוקים מחוברים
        if (Math.abs(rect1.right - rect2.left) <= 2) {
          // יש חיבור מימין של block1 לשמאל של block2
          block1.classList.add('right-connected');
          block2.classList.add('left-connected');
        } else if (Math.abs(rect1.left - rect2.right) <= 2) {
          // יש חיבור משמאל של block1 לימין של block2
          block1.classList.add('left-connected');
          block2.classList.add('right-connected');
        }
      }
    }
  }
  
  // אתחול המודול
  function initializeModule() {
    console.log("[GroupFix] מאתחל מודול פתרון סופי");
    
    // הזרק סגנונות CSS
    injectStyles();
    
    // הגדר מערכת אודיו
    setupAudio();
    
    // התקן מעקב אינטרקציה
    setupInteractionMonitor();
    
    // תקן חיבורים קיימים
    setTimeout(fixExistingConnections, 500);
    
    // בצע אופטימיזציה לביצועים
    optimizeForPerformance();
    
    console.log("[GroupFix] אתחול הושלם");
  }
  
  // התחל את המודול
  initializeModule();
})();
