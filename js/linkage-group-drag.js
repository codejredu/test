// pure-puzzle-fix.js - פתרון רווחים בחיבורי פאזל

(function() {
  console.log("[PuzzleFix] מודול תיקון רווחים בחיבורי פאזל");
  
  // קונפיגורציה מינימלית
  const CONFIG = {
    CHECK_INTERVAL: 50, // בדיקה תכופה מאוד של חיבורים
    OVERLAP: 1,         // חפיפה של פיקסל אחד
    DEBUG: true         // הדפסת לוג
  };
  
  // משתנה גלובלי לבדיקה תקופתית
  let checkInterval = null;
  
  // פונקציה פשוטה לתיקון רווחים בחיבורי פאזל
  function fixPuzzleGaps() {
    try {
      // מצא את כל הבלוקים המחוברים
      const allBlocks = document.querySelectorAll('.block:not(.in-drawer)');
      const pairs = [];
      
      // זיהוי בלוקים מחוברים דרך מאפיינים
      Array.from(allBlocks).forEach(block => {
        const connectedToId = block.getAttribute('data-connected-to');
        if (connectedToId) {
          const otherBlock = document.getElementById(connectedToId);
          if (otherBlock) {
            // בדוק איזה בלוק משמאל ואיזה מימין
            const blockRect = block.getBoundingClientRect();
            const otherRect = otherBlock.getBoundingClientRect();
            
            if (blockRect.left < otherRect.left) {
              pairs.push({ left: block, right: otherBlock });
            } else {
              pairs.push({ left: otherBlock, right: block });
            }
          }
        }
      });
      
      // תיקון הרווחים
      let fixed = 0;
      
      pairs.forEach(pair => {
        const leftRect = pair.left.getBoundingClientRect();
        const rightRect = pair.right.getBoundingClientRect();
        
        // בדוק אם יש רווח
        const gap = Math.abs(leftRect.right - rightRect.left);
        
        if (gap > 0) {
          // קבל אזור תכנות
          const progArea = document.getElementById('programming-area') || 
                          document.getElementById('program-blocks') || 
                          document.body;
          const areaRect = progArea.getBoundingClientRect();
          
          // חשב מיקום ללא רווח
          const newLeft = leftRect.right - CONFIG.OVERLAP;
          const scrollX = progArea.scrollLeft || window.scrollX || 0;
          const scrollY = progArea.scrollTop || window.scrollY || 0;
          
          // החל מיקום חדש
          const absLeft = newLeft - areaRect.left + scrollX;
          const absTop = leftRect.top - areaRect.top + scrollY;
          
          // הגדר מיקום חדש לבלוק הימני
          pair.right.style.position = 'absolute';
          pair.right.style.left = Math.round(absLeft) + 'px';
          pair.right.style.top = Math.round(absTop) + 'px';
          
          // הגדר z-index נכון
          pair.left.style.zIndex = '10';
          pair.right.style.zIndex = '9';
          
          fixed++;
        }
      });
      
      // דווח על תיקונים
      if (fixed > 0 && CONFIG.DEBUG) {
        console.log(`[PuzzleFix] תוקנו ${fixed} רווחים בחיבורי פאזל`);
      }
      
      return fixed;
    } catch (err) {
      console.error('[PuzzleFix] שגיאה בתיקון רווחים:', err);
      return 0;
    }
  }
  
  // האזנה לשחרור עכבר
  function setupMouseListeners() {
    document.addEventListener('mouseup', function() {
      // תקן רווחים אחרי שחרור עכבר
      setTimeout(fixPuzzleGaps, 10);
      setTimeout(fixPuzzleGaps, 100);
    });
  }
  
  // התחלת בדיקה תקופתית
  function startPeriodicCheck() {
    // נקה בדיקה קודמת אם קיימת
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    
    // הפעל בדיקה תקופתית חדשה
    checkInterval = setInterval(fixPuzzleGaps, CONFIG.CHECK_INTERVAL);
    
    if (CONFIG.DEBUG) {
      console.log(`[PuzzleFix] בדיקה תקופתית הופעלה כל ${CONFIG.CHECK_INTERVAL}ms`);
    }
  }
  
  // אתחול המודול
  function initialize() {
    // בדוק אם כבר אותחל
    if (window.puzzleFixInitialized) {
      console.log('[PuzzleFix] המודול כבר אותחל');
      return;
    }
    
    console.log('[PuzzleFix] אתחול מודול תיקון רווחים בחיבורי פאזל');
    
    // הוסף האזנה לאירועי עכבר
    setupMouseListeners();
    
    // הפעל בדיקה תקופתית
    startPeriodicCheck();
    
    // תיקון ראשוני
    setTimeout(fixPuzzleGaps, 500);
    
    // סמן אתחול
    window.puzzleFixInitialized = true;
    
    console.log('[PuzzleFix] אתחול הושלם');
  }
  
  // הפעל את המודול
  initialize();
})();
