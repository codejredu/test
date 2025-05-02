// visual-puzzle-connect.js - מודול ייעודי לחיבור ויזואלי של קבוצות בלוקים

(function() {
  console.log("[VisualPuzzle] טוען מודול חיבור ויזואלי מושלם");
  
  // קונפיגורציה קיצונית לחיבור ויזואלי
  const CONFIG = {
    DEBUG: true,                    // הדפסת הודעות דיבוג
    FIX_INTERVAL: 40,               // בדיקה כל 40 מילישניות
    FORCE_CONNECT: true,            // כפיית חיבור ויזואלי
    OVERLAP_PIXELS: 2,              // כמה פיקסלים של חפיפה
    USE_ABSOLUTE_POSITIONING: true, // שימוש במיקום מוחלט
    CONNECTION_THRESHOLD: 15,       // סף מופחת להופעת עיגולים (במקום 40)
    LEFT_COLOR: '#2196F3',          // כחול לעיגול שמאלי
    RIGHT_COLOR: '#FF9800'          // כתום לעיגול ימני
  };
  
  // משתנים גלובליים
  let fixInterval = null;
  
  // הוספת סגנונות CSS
  function addStyles() {
    const styleId = 'visual-puzzle-fix-css';
    let styleEl = document.getElementById(styleId);
    
    if (styleEl) {
      styleEl.remove();
    }
    
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      /* סגנונות לחיבור ויזואלי מושלם */
      .visual-connected-left {
        /* חפיפה בצד ימין */
        margin-right: -${CONFIG.OVERLAP_PIXELS}px !important;
        padding-right: 0 !important;
        border-right: 0 !important;
        position: relative !important;
        z-index: 20 !important;
      }
      
      .visual-connected-right {
        /* חפיפה בצד שמאל */
        margin-left: -${CONFIG.OVERLAP_PIXELS}px !important;
        padding-left: 0 !important;
        border-left: 0 !important;
        position: relative !important;
        z-index: 10 !important;
      }
      
      /* ביטול אפקטים שעלולים להפריע */
      .visual-connected {
        transform: none !important;
        transition: none !important;
        animation: none !important;
        box-shadow: none !important;
        outline: none !important;
      }
      
      /* הגברת אפקט הפאזל */
      .visual-connected-left:after {
        content: '';
        position: absolute;
        right: -2px;
        top: 0;
        bottom: 0;
        width: 4px;
        background: inherit;
        z-index: 25;
      }
      
      /* עיגולי עגינה - צבעים שונים והופעה מהירה יותר */
      .right-connection-point {
        position: absolute !important;
        width: 20px !important;
        height: 20px !important;
        top: 50% !important;
        right: -10px !important;
        transform: translateY(-50%) !important;
        background-color: ${CONFIG.RIGHT_COLOR} !important;
        border-radius: 50% !important;
        opacity: 0;
        transition: opacity 0.1s ease-out !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        box-shadow: 0 0 10px 4px rgba(255,152,0,0.95) !important;
        border: 2px solid #FFF !important;
      }

      .left-connection-point {
        position: absolute !important;
        width: 20px !important;
        height: 20px !important;
        top: 50% !important;
        left: -10px !important;
        transform: translateY(-50%) !important;
        background-color: ${CONFIG.LEFT_COLOR} !important;
        border-radius: 50% !important;
        opacity: 0;
        transition: opacity 0.1s ease-out !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        box-shadow: 0 0 10px 4px rgba(33,150,243,0.95) !important;
        border: 2px solid #FFF !important;
      }
    `;
    
    document.head.appendChild(styleEl);
    console.log("[VisualPuzzle] סגנונות חיבור ויזואלי הוזרקו");
  }
  
  // עקיפת פונקציית Threshold המקורית - להופעה מהירה יותר של העיגולים
  function overrideThresholdFunction() {
    if (typeof window.handleThresholdMet === 'function') {
      const originalThreshold = window.handleThresholdMet;
      
      window.handleThresholdMet = function(sourceBlock, targetBlock, direction, distance) {
        // שימוש בסף נמוך יותר להופעת העיגולים
        if (distance <= CONFIG.CONNECTION_THRESHOLD) {
          // הפעל את הפונקציה המקורית
          return originalThreshold.apply(this, arguments);
        }
        
        return false;
      };
      
      console.log("[VisualPuzzle] עקפתי את פונקציית הסף להופעה מהירה יותר של עיגולים");
    }
  }
  
  // חיבור ויזואלי מושלם של שני בלוקים
  function forceVisualConnection(leftBlock, rightBlock) {
    if (!leftBlock || !rightBlock) return false;
    
    try {
      // קבל מיקום נוכחי
      const leftRect = leftBlock.getBoundingClientRect();
      const rightRect = rightBlock.getBoundingClientRect();
      
      // בדוק האם נדרש תיקון
      const currentGap = Math.abs(leftRect.right - rightRect.left);
      
      // אם יש כבר חיבור טוב, לא צריך לתקן
      if (currentGap < 0.5) return true;
      
      // סגירת הרווח באופן מוחלט
      // הוסף מחלקות לשני הבלוקים
      leftBlock.classList.add('visual-connected-left', 'visual-connected');
      rightBlock.classList.add('visual-connected-right', 'visual-connected');
      
      // אפשרות לכפיית מיקום
      if (CONFIG.USE_ABSOLUTE_POSITIONING && CONFIG.FORCE_CONNECT) {
        const areaEl = document.getElementById('programming-area') || 
                      document.getElementById('program-blocks') || 
                      document.body;
        const areaRect = areaEl.getBoundingClientRect();
        
        // חשב מיקום אידיאלי
        const idealLeft = leftRect.right - CONFIG.OVERLAP_PIXELS;
        const idealTop = leftRect.top;
        
        // המר למיקום בדף
        const absoluteLeft = idealLeft - areaRect.left + areaEl.scrollLeft;
        const absoluteTop = idealTop - areaRect.top + areaEl.scrollTop;
        
        // החל מיקום על הבלוק הימני
        rightBlock.style.cssText = `
          position: absolute !important;
          left: ${absoluteLeft}px !important;
          top: ${absoluteTop}px !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          transform: none !important;
          transition: none !important;
          z-index: 10 !important;
        `;
        
        // כפה רנדור
        void rightBlock.offsetWidth;
      }
      
      if (CONFIG.DEBUG) {
        console.log(`[VisualPuzzle] חיבור ויזואלי בין ${leftBlock.id} ל-${rightBlock.id}`);
      }
      
      return true;
    } catch (err) {
      console.error('[VisualPuzzle] שגיאה בחיבור:', err);
      return false;
    }
  }
  
  // זיהוי זוגות בלוקים שאמורים להיות מחוברים
  function findBlocksToConnect() {
    const allBlocks = Array.from(document.querySelectorAll('.block:not(.in-drawer)'));
    const connectedPairs = [];
    
    for (let i = 0; i < allBlocks.length; i++) {
      const block1 = allBlocks[i];
      const rect1 = block1.getBoundingClientRect();
      
      for (let j = 0; j < allBlocks.length; j++) {
        if (i === j) continue;
        
        const block2 = allBlocks[j];
        const rect2 = block2.getBoundingClientRect();
        
        // בדוק אם הבלוקים אמורים להיות מחוברים
        const gap = Math.abs(rect1.right - rect2.left);
        const verticalAligned = Math.abs(rect1.top - rect2.top) < 5;
        
        // רק אם הבלוק 1 משמאל לבלוק 2
        if (gap < 5 && verticalAligned && rect1.right < rect2.right) {
          connectedPairs.push({
            left: block1,
            right: block2,
            gap: gap
          });
        }
      }
    }
    
    return connectedPairs;
  }
  
  // תיקון כל החיבורים הויזואליים 
  function fixAllVisualConnections() {
    const pairs = findBlocksToConnect();
    let fixed = 0;
    
    for (const pair of pairs) {
      if (forceVisualConnection(pair.left, pair.right)) {
        fixed++;
      }
    }
    
    if (fixed > 0 && CONFIG.DEBUG) {
      console.log(`[VisualPuzzle] תוקנו ${fixed} חיבורים ויזואליים`);
    }
    
    return fixed;
  }
  
  // האזנה לאירועי עכבר
  function addMouseListeners() {
    document.addEventListener('mouseup', function(e) {
      // בדוק חיבורים מיד אחרי עזיבת העכבר
      setTimeout(fixAllVisualConnections, 10);
      
      // ובדוק שוב מאוחר יותר (למקרה שהמיקום השתנה)
      setTimeout(fixAllVisualConnections, 100);
    });
    
    console.log("[VisualPuzzle] נוספו מאזינים לאירועי עכבר");
  }
  
  // הפעלת בדיקה תקופתית
  function startFixInterval() {
    if (fixInterval) {
      clearInterval(fixInterval);
    }
    
    fixInterval = setInterval(fixAllVisualConnections, CONFIG.FIX_INTERVAL);
    console.log(`[VisualPuzzle] הופעלה בדיקה תקופתית כל ${CONFIG.FIX_INTERVAL}ms`);
  }
  
  // אתחול המודול
  function initialize() {
    // בדוק אם כבר אותחל
    if (window.visualPuzzleInitialized) {
      console.log("[VisualPuzzle] המודול כבר אותחל");
      return;
    }
    
    console.log("[VisualPuzzle] אתחול מודול חיבור ויזואלי");
    
    // הזרק סגנונות
    addStyles();
    
    // עקוף פונקציות סף
    overrideThresholdFunction();
    
    // הוסף מאזינים
    addMouseListeners();
    
    // הפעל בדיקה תקופתית
    startFixInterval();
    
    // תיקון ראשוני
    setTimeout(fixAllVisualConnections, 500);
    
    // סמן אתחול
    window.visualPuzzleInitialized = true;
    
    console.log("[VisualPuzzle] אתחול מודול חיבור ויזואלי הושלם");
  }
  
  // הפעל
  initialize();
})();
