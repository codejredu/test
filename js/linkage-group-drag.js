// מודול תיקון חיבור פאזל וסגירת רווחים - group-connect.js

(function() {
  console.log("[GroupFix] טוען מודול פתרון סופי עם תיקוני מיקום ואודיו");
  
  // קונפיגורציה
  const CONFIG = {
    SNAP_THRESHOLD: 25,           // מרחק סף להצמדה
    PERFECT_SNAP_DISTANCE: -1,    // מרחק מדויק בהצמדה (-1 לחיבור מושלם ללא רווח)
    CONNECTION_HIGHLIGHT: true,    // האם להדגיש חיבורים אפשריים
    AUDIO_VOLUME: 0.5,            // עוצמת קול בהשמעת צליל חיבור
    AUDIO_PATH: 'assets/sound/link.mp3',  // נתיב לקובץ צליל
    DEBUG: true,                  // האם להציג הודעות דיבג
    FIX_INTERVAL: 300            // זמן בדיקה לתיקון רווחים (מילישניות)
  };
  
  // משתנים גלובליים
  let audioPlayer = null;
  let fixingInterval = null;
  
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
      
      /* מונע רווחים בין בלוקים */
      .block {
        margin: 0 !important;
        box-sizing: border-box !important;
      }
      
      /* סגנון מיוחד לבלוקים מחוברים עם תצוגת פאזל */
      .puzzle-connected-right {
        margin-right: -1px !important;
        padding-right: 0 !important;
        position: relative !important;
        z-index: 10 !important;
      }
      
      .puzzle-connected-left {
        margin-left: -1px !important;
        padding-left: 0 !important;
        position: relative !important;
        z-index: 9 !important;
      }
      
      /* תיקון מיקום עבור בלוקים מחוברים */
      .perfect-snap {
        transition: none !important;
        transform: none !important;
      }
    `;
    document.head.appendChild(styleEl);
    console.log("[GroupFix] סגנונות הוזרקו");
  }
  
  // התאמת מיקום מדויק בין שני אלמנטים
  function snapBlocksWithPerfectFit(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock) return false;
    
    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    
    // הוסף מחלקות לציון שהבלוקים מחוברים בסגנון פאזל
    sourceBlock.classList.add('perfect-snap');
    targetBlock.classList.add('perfect-snap');
    
    let newLeft, newTop;
    
    if (direction === 'right') {
      // חיבור מימין של source לשמאל של target (נפוץ)
      newLeft = targetRect.left - sourceRect.width + CONFIG.PERFECT_SNAP_DISTANCE;
      newTop = targetRect.top;
      
      // הוסף מחלקות לחיבור פאזל מדויק
      sourceBlock.classList.add('puzzle-connected-right');
      targetBlock.classList.add('puzzle-connected-left');
    } else if (direction === 'left') {
      // חיבור משמאל של source לימין של target (נדיר)
      newLeft = targetRect.right - CONFIG.PERFECT_SNAP_DISTANCE;
      newTop = targetRect.top;
      
      // הוסף מחלקות לחיבור פאזל מדויק
      sourceBlock.classList.add('puzzle-connected-left');
      targetBlock.classList.add('puzzle-connected-right');
    }
    
    // עדכן את מיקום בלוק המקור
    forceExactPosition(sourceBlock, newLeft, newTop);
    
    return true;
  }
  
  // פונקציה המכריחה מיקום מדויק של בלוק
  function forceExactPosition(block, left, top) {
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
  
  // פונקציה לזיהוי בלוקים מחוברים וקבוצות
  function findConnectedBlocks() {
    const allBlocks = Array.from(document.querySelectorAll('.block'));
    const connectedPairs = [];
    
    // מצא זוגות של בלוקים מחוברים
    for (let i = 0; i < allBlocks.length; i++) {
      const block1 = allBlocks[i];
      const rect1 = block1.getBoundingClientRect();
      
      for (let j = i + 1; j < allBlocks.length; j++) {
        const block2 = allBlocks[j];
        const rect2 = block2.getBoundingClientRect();
        
        // בדוק אם הבלוקים קרובים מאוד אופקית
        const horizontalGap = Math.abs(rect1.right - rect2.left);
        const reverseGap = Math.abs(rect1.left - rect2.right);
        
        // בדוק גם יישור אנכי
        const verticalAlignment = Math.abs(rect1.top - rect2.top) < 5;
        
        if (horizontalGap < 5 && verticalAlignment) {
          // בלוק 1 מימין לבלוק 2
          connectedPairs.push({
            left: block1,
            right: block2,
            gap: horizontalGap
          });
        } else if (reverseGap < 5 && verticalAlignment) {
          // בלוק 1 משמאל לבלוק 2
          connectedPairs.push({
            left: block2,
            right: block1,
            gap: reverseGap
          });
        }
      }
    }
    
    return connectedPairs;
  }
  
  // תקן את כל הרווחים בחיבורי בלוקים
  function fixAllConnections() {
    const pairs = findConnectedBlocks();
    let fixed = 0;
    
    for (const pair of pairs) {
      // תקן רק אם יש רווח
      if (pair.gap > 0) {
        const leftRect = pair.left.getBoundingClientRect();
        const rightRect = pair.right.getBoundingClientRect();
        
        // תקן את המיקום של הבלוק הימני
        forceExactPosition(
          pair.right,
          leftRect.right + CONFIG.PERFECT_SNAP_DISTANCE,
          leftRect.top
        );
        
        // הוסף מחלקות פאזל
        pair.left.classList.add('puzzle-connected-right');
        pair.right.classList.add('puzzle-connected-left');
        
        fixed++;
      }
    }
    
    if (fixed > 0 && CONFIG.DEBUG) {
      console.log(`[GroupFix] תוקנו ${fixed} חיבורים עם רווחים`);
    }
    
    return fixed;
  }
  
  // בדוק אם שני בלוקים מחוברים
  function areBlocksConnected(block1, block2) {
    if (!block1 || !block2) return false;
    
    const rect1 = block1.getBoundingClientRect();
    const rect2 = block2.getBoundingClientRect();
    
    // בדוק אם הבלוקים קרובים מאוד אופקית
    const horizontalGap = Math.abs(rect1.right - rect2.left);
    const reverseGap = Math.abs(rect1.left - rect2.right);
    
    // בדוק גם יישור אנכי
    const verticalAlignment = Math.abs(rect1.top - rect2.top) < 5;
    
    return (horizontalGap < 5 && verticalAlignment) || (reverseGap < 5 && verticalAlignment);
  }
  
  // תפיסת אירועי גרירת מערכת הבלוקים המקורית
  function monkeyPatchLinkageSystem() {
    // תפוס את פונקציית ה-PerformSnap המקורית
    if (typeof window.performSnap === 'function') {
      const originalPerformSnap = window.performSnap;
      window.performSnap = function(sourceBlock, targetBlock, direction) {
        // קרא לפונקציה המקורית
        const result = originalPerformSnap.apply(this, arguments);
        
        // הוסף את התיקונים שלנו אחרי שהפונקציה המקורית הסתיימה
        if (result) {
          setTimeout(() => {
            snapBlocksWithPerfectFit(sourceBlock, targetBlock, direction);
          }, 50); // קצת אחרי ההצמדה המקורית
        }
        
        return result;
      };
      
      console.log("[GroupFix] דורס פונקציות גרירת קבוצות");
    }
    
    // תפוס את פונקציית הMouseUp המקורית
    if (typeof window.handleMouseUp === 'function') {
      const originalMouseUp = window.handleMouseUp;
      window.handleMouseUp = function(e) {
        // קרא לפונקציה המקורית
        const result = originalMouseUp.apply(this, arguments);
        
        // הפעל את התיקון שלנו
        setTimeout(fixAllConnections, 100);
        
        return result;
      };
    }
    
    // עבור גרירת קבוצות
    if (typeof window.dragEnd === 'function') {
      const originalDragEnd = window.dragEnd;
      window.dragEnd = function(e) {
        // קרא לפונקציה המקורית
        const result = originalDragEnd.apply(this, arguments);
        
        // הפעל את התיקון שלנו
        setTimeout(fixAllConnections, 100);
        
        return result;
      };
    }
  }
  
  // השמע צליל חיבור
  function playConnectionSound() {
    try {
      if (audioPlayer) {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
      }
    } catch (err) {
      console.warn("[GroupFix] שגיאה בהשמעת צליל:", err);
    }
  }
  
  // הוסף את האזנה לחיבורים במהלך גרירת קבוצה
  function addGroupDragListeners() {
    document.addEventListener('mouseup', function(e) {
      // בדוק אם יש בלוקים בגרירת קבוצה
      const groupBlocks = document.querySelectorAll('.group-dragging');
      if (groupBlocks.length === 0) return;
      
      // מצא את כל הבלוקים האחרים שאינם בקבוצה
      const otherBlocks = Array.from(document.querySelectorAll('.block:not(.group-dragging)'));
      
      // מצא את הבלוק הימני והשמאלי בקבוצת הגרירה
      let leftmostInGroup = null;
      let rightmostInGroup = null;
      let leftmostRect = null;
      let rightmostRect = null;
      
      groupBlocks.forEach(block => {
        const rect = block.getBoundingClientRect();
        
        if (!leftmostInGroup || rect.left < leftmostRect.left) {
          leftmostInGroup = block;
          leftmostRect = rect;
        }
        
        if (!rightmostInGroup || rect.right > rightmostRect.right) {
          rightmostInGroup = block;
          rightmostRect = rect;
        }
      });
      
      // בדוק אם יש חיבור פוטנציאלי לבלוק כלשהו
      let closestBlock = null;
      let minDistance = CONFIG.SNAP_THRESHOLD;
      let snapDirection = null;
      
      for (const block of otherBlocks) {
        const blockRect = block.getBoundingClientRect();
        
        // בדוק מרחק מהימני ביותר לבלוק משמאל (חיבור רגיל)
        const rightToLeftDist = Math.abs(rightmostRect.right - blockRect.left);
        
        // בדוק מרחק מהשמאלי ביותר לבלוק מימין (חיבור הפוך)
        const leftToRightDist = Math.abs(leftmostRect.left - blockRect.right);
        
        // בדוק גם יישור אנכי
        const verticalAlignmentRight = Math.abs(rightmostRect.top - blockRect.top) < 10;
        const verticalAlignmentLeft = Math.abs(leftmostRect.top - blockRect.top) < 10;
        
        // מצא את החיבור הקרוב ביותר
        if (rightToLeftDist < minDistance && verticalAlignmentRight) {
          minDistance = rightToLeftDist;
          closestBlock = block;
          snapDirection = 'right';
        }
        
        if (leftToRightDist < minDistance && verticalAlignmentLeft) {
          minDistance = leftToRightDist;
          closestBlock = block;
          snapDirection = 'left';
        }
      }
      
      // אם נמצא בלוק קרוב מספיק, בצע הצמדה
      if (closestBlock && minDistance <= 5) {
        console.log(`[GroupFix] חיבור קבוצות: ${snapDirection === 'right' ? rightmostInGroup.id : leftmostInGroup.id} -> ${closestBlock.id} `);
        
        // בצע הצמדה מותאמת לכיוון
        if (snapDirection === 'right') {
          snapBlocksWithPerfectFit(rightmostInGroup, closestBlock, 'right');
        } else {
          snapBlocksWithPerfectFit(leftmostInGroup, closestBlock, 'left');
        }
        
        // השמע צליל חיבור
        playConnectionSound();
        
        console.log(`[GroupFix] חיבור הושלם בהצלחה `);
      }
      
      // בכל מקרה, בצע תיקון כללי של חיבורים
      setTimeout(fixAllConnections, 150);
    });
  }
  
  // אתחול המודול
  function initializeModule() {
    console.log("[GroupFix] מאתחל מודול פתרון סופי");
    
    // הזרק סגנונות CSS
    injectStyles();
    
    // הגדר מערכת אודיו
    setupAudio();
    
    // התקן חלפים לפונקציות של מערכת הגרירה המקורית
    monkeyPatchLinkageSystem();
    
    // הוסף האזנה לחיבורים בגרירת קבוצה
    addGroupDragListeners();
    
    // הפעל תיקון חיבורים אוטומטי מדי זמן קצוב
    fixingInterval = setInterval(fixAllConnections, CONFIG.FIX_INTERVAL);
    
    // תקן חיבורים קיימים
    setTimeout(fixAllConnections, 500);
    
    console.log("[GroupFix] אתחול הושלם");
  }
  
  // התחל את המודול
  initializeModule();
})();
