// מודול תיקון חיבור קבוצות - group-connect.js

(function() {
  console.log("[GroupFix] טוען מודול פתרון סופי עם תיקוני מיקום ואודיו");
  
  // קונפיגורציה
  const CONFIG = {
    SNAP_THRESHOLD: 25,           // מרחק סף להצמדה
    PERFECT_SNAP_DISTANCE: 0,     // מרחק מדויק בהצמדה (0 = מושלם)
    CONNECTION_HIGHLIGHT: true,    // האם להדגיש חיבורים אפשריים
    AUDIO_VOLUME: 0.5,            // עוצמת קול בהשמעת צליל חיבור
    AUDIO_PATH: 'assets/sound/link.mp3',  // נתיב לקובץ צליל
    DEBUG: true                   // האם להציג הודעות דיבג
  };
  
  // משתנים גלובליים
  let audioPlayer = null;
  
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
    return Math.min(
      Math.abs(rect1.right - rect2.left),
      Math.abs(rect1.left - rect2.right)
    );
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
    `;
    document.head.appendChild(styleEl);
    console.log("[GroupFix] סגנונות הוזרקו");
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
    } else if (direction === 'left') {
      // חיבור משמאל של source לימין של target
      newLeft = targetRect.right + CONFIG.PERFECT_SNAP_DISTANCE;
      
      // נסה לשמור על יישור אנכי מושלם
      newTop = targetRect.top;
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
  
  // תיקון: תפיסת האינטרקציה בין בלוקים ברמת המסמך
  function setupInteractionMonitor() {
    // המודול המקורי משתמש בdrag ו-MouseUp, אנחנו נתפוס את האירועים הללו
    const originalMouseMove = window.handleMouseMove;
    if (typeof originalMouseMove === 'function') {
      window.handleMouseMove = function(e) {
        // קרא לפונקציה המקורית
        const result = originalMouseMove.call(this, e);
        
        // הוסף את הלוגיקה שלנו
        monitorBlocksForConnection(e);
        
        return result;
      };
    }
    
    console.log("[GroupFix] דורס פונקציות גרירת קבוצות");
  }
  
  // בדיקה אם שני בלוקים צריכים להתחבר
  function monitorBlocksForConnection(e) {
    // בצע את הבדיקה רק אם יש בלוק בגרירה
    if (!window.blockLinkageState || !window.blockLinkageState.isDraggingBlock) return;
    
    // שלוף את הבלוק הנגרר
    const draggedBlock = window.blockLinkageState.currentDraggedBlock;
    if (!draggedBlock) return;
    
    // עבור על כל הבלוקים כדי למצוא מועמדים לחיבור
    const allBlocks = Array.from(document.querySelectorAll('.block'));
    
    // מצא את הקבוצה של הבלוק הנגרר
    const draggedGroup = findConnectedBlocks(draggedBlock);
    
    // סנן את הבלוקים שכבר בקבוצה
    const potentialTargets = allBlocks.filter(block => {
      return block !== draggedBlock && 
             !draggedGroup.includes(block) &&
             !block.classList.contains('in-drawer');
    });
    
    let closestBlock = null;
    let minDistance = CONFIG.SNAP_THRESHOLD;
    let bestDirection = null;
    
    // מצא את הבלוק הקרוב ביותר לחיבור
    for (const targetBlock of potentialTargets) {
      const draggedRect = draggedBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      
      // בדוק את המרחק בשני הכיוונים
      const direction = determineConnectionDirection(draggedRect, targetRect);
      const distance = calculateDistance(draggedRect, targetRect, direction);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestBlock = targetBlock;
        bestDirection = direction;
      }
    }
    
    // אם נמצא בלוק קרוב מספיק, הדגש אותו
    if (closestBlock) {
      if (CONFIG.DEBUG) {
        console.log(`[GroupFix] הדגשת חיבור בין: ${draggedBlock.id} -> ${closestBlock.id}, מרחק: ${minDistance.toFixed(1)}px `);
      }
      
      if (CONFIG.CONNECTION_HIGHLIGHT) {
        closestBlock.classList.add('group-connection-highlight');
      }
      
      // אם קרוב מאוד, בצע חיבור מיידי
      if (minDistance <= 5) {
        // חבר את הבלוקים
        connectBlocks(draggedBlock, closestBlock, bestDirection);
      }
    }
    
    // הסר הדגשות מבלוקים שאינם הקרובים ביותר
    allBlocks.forEach(block => {
      if (block !== closestBlock) {
        block.classList.remove('group-connection-highlight');
      }
    });
  }
  
  // מצא את כל הבלוקים המחוברים לבלוק מסוים
  function findConnectedBlocks(startBlock) {
    if (!startBlock) return [];
    
    const visited = new Set([startBlock.id]);
    const connected = [startBlock];
    const queue = [startBlock];
    
    while (queue.length > 0) {
      const current = queue.shift();
      const rect = current.getBoundingClientRect();
      
      // בדוק את כל הבלוקים לחיבורים אפשריים
      const allBlocks = Array.from(document.querySelectorAll('.block'));
      
      allBlocks.forEach(block => {
        if (visited.has(block.id)) return;
        
        const blockRect = block.getBoundingClientRect();
        
        // בדוק אם הבלוקים מחוברים (מרחק קטן מאוד ביניהם)
        const rightToLeftDist = Math.abs(rect.right - blockRect.left);
        const leftToRightDist = Math.abs(rect.left - blockRect.right);
        
        if (rightToLeftDist <= 5 || leftToRightDist <= 5) {
          // בדוק גם יישור אנכי
          const verticalOverlap = 
            rect.top < blockRect.bottom - 10 && 
            rect.bottom > blockRect.top + 10;
            
          if (verticalOverlap) {
            visited.add(block.id);
            connected.push(block);
            queue.push(block);
          }
        }
      });
    }
    
    return connected;
  }
  
  // חיבור שני בלוקים
  function connectBlocks(sourceBlock, targetBlock, direction) {
    if (CONFIG.DEBUG) {
      console.log(`[GroupFix] חיבור קבוצות: ${sourceBlock.id} -> ${targetBlock.id} `);
    }
    
    // בצע הצמדה מושלמת
    performPerfectSnap(sourceBlock, targetBlock, direction);
    
    // השמע צליל חיבור
    playConnectionSound();
    
    if (CONFIG.DEBUG) {
      console.log(`[GroupFix] חיבור הושלם בהצלחה `);
    }
  }
  
  // פונקציה לטיפול בבעיות מחשב נמוך
  function optimizeForPerformance() {
    // התאם הגדרות לביצועים נמוכים אם צריך
    if (window.navigator && window.navigator.hardwareConcurrency) {
      if (window.navigator.hardwareConcurrency <= 2) {
        // מחשב חלש, הורד את תדירות הבדיקות
        CONFIG.DEBUG = false;
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
    
    // בצע אופטימיזציה לביצועים
    optimizeForPerformance();
    
    console.log("[GroupFix] אתחול הושלם");
  }
  
  // התחל את המודול
  initializeModule();
})();
