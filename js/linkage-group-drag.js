// תיקון חיבור פאזל פשוט - puzzle-fix-simple.js

(function() {
  console.log("[PuzzleFix] טוען מודול תיקון חיבור פאזל פשוט");
  
  // קונפיגורציה בסיסית
  const CONFIG = {
    OVERLAP: -2,                  // כמה פיקסלים חפיפה ליצור בין בלוקים
    DEBUG: true,                  // הצג הודעות דיבוג בקונסול
    CHECK_INTERVAL: 200           // כל כמה זמן לבדוק חיבורים
  };
  
  // משתנים גלובליים
  let checkTimer = null;
  
  // פונקציה לזיהוי בלוקים מחוברים
  function findConnectedBlocks() {
    const allBlocks = Array.from(document.querySelectorAll('.block:not(.in-drawer)'));
    const connectedPairs = [];
    
    for (let i = 0; i < allBlocks.length; i++) {
      const block1 = allBlocks[i];
      const rect1 = block1.getBoundingClientRect();
      
      for (let j = i + 1; j < allBlocks.length; j++) {
        const block2 = allBlocks[j];
        const rect2 = block2.getBoundingClientRect();
        
        // האם הבלוקים קרובים אופקית 
        const distance = Math.abs(rect1.right - rect2.left);
        
        // בדוק גם יישור אנכי
        const verticalOverlap = 
          rect1.top < rect2.bottom - 10 && 
          rect1.bottom > rect2.top + 10;
          
        // בלוק 1 משמאל לבלוק 2
        if (distance < 5 && verticalOverlap && rect1.right < rect2.right) {
          connectedPairs.push({
            left: block1,
            right: block2,
            distance: distance
          });
        }
      }
    }
    
    return connectedPairs;
  }
  
  // פונקציה לתיקון רווח בין בלוקים מחוברים
  function fixConnectedBlockPositions() {
    const pairs = findConnectedBlocks();
    let fixed = 0;
    
    pairs.forEach(pair => {
      const leftBlock = pair.left;
      const rightBlock = pair.right;
      
      // קבל מיקום נוכחי
      const leftRect = leftBlock.getBoundingClientRect();
      const rightRect = rightBlock.getBoundingClientRect();
      
      // חשב מיקום אידיאלי לבלוק הימני
      const idealLeft = leftRect.right + CONFIG.OVERLAP;
      
      // אם יש רווח, תקן אותו
      if (Math.abs(rightRect.left - idealLeft) > 0.5) {
        // הגדר מיקום חדש באופן ישיר
        rightBlock.style.position = 'absolute';
        rightBlock.style.left = idealLeft + 'px';
        rightBlock.style.top = leftRect.top + 'px';
        
        // שים z-index גבוה יותר לבלוק השמאלי
        leftBlock.style.zIndex = '10';
        rightBlock.style.zIndex = '9';
        
        // בטל שוליים ותזוזות
        leftBlock.style.margin = '0';
        rightBlock.style.margin = '0';
        leftBlock.style.transform = 'none';
        rightBlock.style.transform = 'none';
        
        fixed++;
      }
    });
    
    if (fixed > 0 && CONFIG.DEBUG) {
      console.log(`[PuzzleFix] תוקנו ${fixed} חיבורים`);
    }
    
    return fixed;
  }
  
  // פונקציה ליצירת חיבור פאזל ישיר בין שני בלוקים
  function createPuzzleConnection(leftBlock, rightBlock) {
    if (!leftBlock || !rightBlock) return false;
    
    const leftRect = leftBlock.getBoundingClientRect();
    
    // הגדר מיקום מדוייק
    rightBlock.style.position = 'absolute';
    rightBlock.style.left = (leftRect.right + CONFIG.OVERLAP) + 'px';
    rightBlock.style.top = leftRect.top + 'px';
    
    // הגדר z-index
    leftBlock.style.zIndex = '10';
    rightBlock.style.zIndex = '9';
    
    // בטל שוליים
    leftBlock.style.margin = '0';
    rightBlock.style.margin = '0';
    
    // בטל תזוזות אחרות
    leftBlock.style.transform = 'none';
    rightBlock.style.transform = 'none';
    
    if (CONFIG.DEBUG) {
      console.log(`[PuzzleFix] נוצר חיבור פאזל בין ${leftBlock.id} ל-${rightBlock.id}`);
    }
    
    return true;
  }
  
  // פונקציה לתיקון חיבורי קבוצות
  function fixGroupConnections() {
    // בדוק אם יש קבוצות בלוקים
    const blockGroups = document.querySelectorAll('.block-group');
    
    if (blockGroups.length === 0) return false;
    
    // מצא את הקבוצות ותקן את החיבורים ביניהן
    
    return false; // לא תוקנו חיבורים
  }
  
  // עקיפה ישירה של פונקציית ה-performSnap המקורית
  function overrideSnapFunction() {
    if (typeof window.performSnap === 'function') {
      const originalPerformSnap = window.performSnap;
      
      window.performSnap = function(sourceBlock, targetBlock, direction) {
        // הפעל את הפונקציה המקורית
        const result = originalPerformSnap.apply(this, arguments);
        
        // אם החיבור הצליח ובכיוון ימין
        if (result && direction === 'right') {
          // הפעל חיבור פאזל מיד
          setTimeout(() => {
            createPuzzleConnection(sourceBlock, targetBlock);
          }, 5);
        }
        
        return result;
      };
      
      console.log("[PuzzleFix] עקפתי את פונקציית ההצמדה המקורית");
    }
  }
  
  // עקיפה ישירה של פונקציית ה-handleMouseUp
  function overrideMouseUpFunction() {
    if (typeof window.handleMouseUp === 'function') {
      const originalMouseUp = window.handleMouseUp;
      
      window.handleMouseUp = function(e) {
        // הפעל את הפונקציה המקורית
        const result = originalMouseUp.apply(this, arguments);
        
        // תקן את כל החיבורים מיד
        setTimeout(fixConnectedBlockPositions, 5);
        
        return result;
      };
      
      console.log("[PuzzleFix] עקפתי את פונקציית שחרור העכבר המקורית");
    }
  }
  
  // התחלת בדיקה תקופתית של חיבורים
  function startPeriodicCheck() {
    if (checkTimer) {
      clearInterval(checkTimer);
    }
    
    checkTimer = setInterval(() => {
      fixConnectedBlockPositions();
    }, CONFIG.CHECK_INTERVAL);
    
    console.log("[PuzzleFix] הפעלתי בדיקה תקופתית של חיבורים");
  }
  
  // הקודם לכל הקוד - הזרקת סגנונות בסיסיים
  function injectBasicStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* סגנונות בסיסיים לתיקון רווחים */
      .block {
        box-sizing: border-box !important;
      }
      
      /* בלוק שמאלי בחיבור */
      .block.left-connected {
        z-index: 10 !important;
        margin-right: ${CONFIG.OVERLAP}px !important;
      }
      
      /* בלוק ימני בחיבור */
      .block.right-connected {
        z-index: 9 !important;
        margin-left: ${CONFIG.OVERLAP}px !important;
      }
    `;
    document.head.appendChild(style);
    console.log("[PuzzleFix] הזרקתי סגנונות CSS בסיסיים");
  }
  
  // האזנה ישירה לאירועי עכבר
  function addDirectMouseListeners() {
    document.addEventListener('mouseup', function(e) {
      // תקן חיבורים מיד עם שחרור העכבר
      setTimeout(fixConnectedBlockPositions, 5);
    });
  }
  
  // אתחול המודול
  function initializeModule() {
    console.log("[PuzzleFix] מאתחל מודול תיקון חיבור פאזל פשוט");
    
    // הזרק סגנונות בסיסיים
    injectBasicStyles();
    
    // עקוף פונקציות מקוריות
    overrideSnapFunction();
    overrideMouseUpFunction();
    
    // הוסף האזנה ישירה לאירועי עכבר
    addDirectMouseListeners();
    
    // התחל בדיקה תקופתית
    startPeriodicCheck();
    
    // הרץ תיקון ראשוני
    setTimeout(fixConnectedBlockPositions, 500);
    
    console.log("[PuzzleFix] אתחול הושלם");
  }
  
  // הפעל את המודול
  initializeModule();
})();
