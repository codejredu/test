// visual-puzzle-connect.js - מודול ייעודי לחיבור ויזואלי וצבעי עיגולים

(function() {
  console.log("[VisualPuzzle] טוען מודול חיבור ויזואלי ושינוי צבעי עיגולים");
  
  // קונפיגורציה
  const CONFIG = {
    DEBUG: true,                    // הדפסת הודעות דיבוג
    FIX_INTERVAL: 40,               // בדיקה כל 40 מילישניות
    FORCE_CONNECT: true,            // כפיית חיבור ויזואלי
    OVERLAP_PIXELS: 2,              // כמה פיקסלים של חפיפה
    CONNECTION_THRESHOLD: 15,       // סף מופחת להופעת עיגולים (במקום 40)
    LEFT_COLOR: '#2196F3',          // כחול לעיגול שמאלי
    RIGHT_COLOR: '#FF9800',         // כתום לעיגול ימני
    IMPORTANT_MARKER: '!important;' // סימון חשיבות לסגנונות
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
      
      /* עדיפות גבוהה - תמיד יחליף את ההגדרות המקוריות */
      .left-connection-point {
        background-color: ${CONFIG.LEFT_COLOR} !important;
        box-shadow: 0 0 10px 4px rgba(33,150,243,0.95) !important;
      }

      .right-connection-point {
        background-color: ${CONFIG.RIGHT_COLOR} !important;
        box-shadow: 0 0 10px 4px rgba(255,152,0,0.95) !important;
      }
    `;
    
    document.head.appendChild(styleEl);
    console.log("[VisualPuzzle] סגנונות חיבור ויזואלי ושינוי צבעי עיגולים הוזרקו");
  }
  
  // פונקציה לאיתור ועדכון עיגולי חיבור
  function updateConnectionPoints() {
    // איתור העיגולים בדף
    const leftPoints = document.querySelectorAll('.left-connection-point');
    const rightPoints = document.querySelectorAll('.right-connection-point');
    
    // עדכון צבעים באופן ישיר
    leftPoints.forEach(point => {
      point.style.backgroundColor = CONFIG.LEFT_COLOR;
      point.style.boxShadow = '0 0 10px 4px rgba(33,150,243,0.95)';
    });
    
    rightPoints.forEach(point => {
      point.style.backgroundColor = CONFIG.RIGHT_COLOR;
      point.style.boxShadow = '0 0 10px 4px rgba(255,152,0,0.95)';
    });
    
    return leftPoints.length + rightPoints.length;
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
      if (CONFIG.FORCE_CONNECT) {
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
  
  // פתרון קיצוני - מחיקה ויצירה מחדש של העיגולים בצבעים הנכונים
  function recreateConnectionPoints(block) {
    if (!block) return false;
    
    try {
      // הסר את העיגולים הקיימים
      const existingLeftPoint = block.querySelector('.left-connection-point');
      const existingRightPoint = block.querySelector('.right-connection-point');
      
      if (existingLeftPoint) existingLeftPoint.remove();
      if (existingRightPoint) existingRightPoint.remove();
      
      // צור עיגולים חדשים עם הצבעים הנכונים
      const leftPoint = document.createElement('div');
      leftPoint.className = 'left-connection-point';
      leftPoint.style.backgroundColor = CONFIG.LEFT_COLOR;
      leftPoint.style.boxShadow = '0 0 10px 4px rgba(33,150,243,0.95)';
      
      const rightPoint = document.createElement('div');
      rightPoint.className = 'right-connection-point';
      rightPoint.style.backgroundColor = CONFIG.RIGHT_COLOR;
      rightPoint.style.boxShadow = '0 0 10px 4px rgba(255,152,0,0.95)';
      
      // הוסף לבלוק
      block.appendChild(leftPoint);
      block.appendChild(rightPoint);
      
      return true;
    } catch(err) {
      console.error('[VisualPuzzle] שגיאה ביצירת נקודות חיבור:', err);
      return false;
    }
  }
  
  // יצירת עיגולים מחדש עבור כל הבלוקים
  function recreateAllConnectionPoints() {
    const allBlocks = document.querySelectorAll('.block:not(.in-drawer)');
    let recreated = 0;
    
    allBlocks.forEach(block => {
      if (recreateConnectionPoints(block)) {
        recreated++;
      }
    });
    
    if (recreated > 0 && CONFIG.DEBUG) {
      console.log(`[VisualPuzzle] נוצרו מחדש נקודות חיבור עבור ${recreated} בלוקים`);
    }
    
    return recreated;
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
    
    // עדכון צבעי עיגולים
    updateConnectionPoints();
    
    if (fixed > 0 && CONFIG.DEBUG) {
      console.log(`[VisualPuzzle] תוקנו ${fixed} חיבורים ויזואליים`);
    }
    
    return fixed;
  }
  
  // האזנה לשינויים בDOM - להחלפת עיגולים חדשים שנוצרים
  function observeDOMChanges() {
    // יצירת צופה לשינויים בDOM
    const observer = new MutationObserver(mutations => {
      let needsUpdate = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // עבור כל אלמנט חדש, בדוק אם יש נקודות חיבור
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // אלמנט HTML
              if (node.classList && 
                  (node.classList.contains('left-connection-point') || 
                   node.classList.contains('right-connection-point'))) {
                needsUpdate = true;
              }
              
              // בדוק גם אלמנטים בתוך האלמנט החדש
              const points = node.querySelectorAll('.left-connection-point, .right-connection-point');
              if (points.length > 0) {
                needsUpdate = true;
              }
            }
          });
        }
      });
      
      if (needsUpdate) {
        updateConnectionPoints();
      }
    });
    
    // התחל לעקוב אחרי כל העמוד
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log("[VisualPuzzle] התחלתי לעקוב אחרי שינויים ב-DOM");
  }
  
  // האזנה לאירועי עכבר
  function addMouseListeners() {
    document.addEventListener('mouseup', function(e) {
      // בדוק חיבורים מיד אחרי עזיבת העכבר
      setTimeout(() => {
        fixAllVisualConnections();
        updateConnectionPoints();
      }, 10);
      
      // ובדוק שוב מאוחר יותר
      setTimeout(() => {
        fixAllVisualConnections();
        updateConnectionPoints();
      }, 100);
    });
    
    // האזנה לתזוזת עכבר - לעדכון צבעי עיגולים במהלך גרירה
    document.addEventListener('mousemove', function(e) {
      // עדכן צבעי עיגולים (אם יש נקודות חיבור פעילות)
      updateConnectionPoints();
    });
    
    console.log("[VisualPuzzle] נוספו מאזינים לאירועי עכבר ותזוזה");
  }
  
  // הפעלת בדיקה תקופתית
  function startFixInterval() {
    if (fixInterval) {
      clearInterval(fixInterval);
    }
    
    fixInterval = setInterval(() => {
      fixAllVisualConnections();
      updateConnectionPoints();
    }, CONFIG.FIX_INTERVAL);
    
    console.log(`[VisualPuzzle] הופעלה בדיקה תקופתית כל ${CONFIG.FIX_INTERVAL}ms`);
  }
  
  // אתחול המודול
  function initialize() {
    // בדוק אם כבר אותחל
    if (window.visualPuzzleInitialized) {
      console.log("[VisualPuzzle] המודול כבר אותחל");
      return;
    }
    
    console.log("[VisualPuzzle] אתחול מודול חיבור ויזואלי ושינוי צבעי עיגולים");
    
    // הזרק סגנונות
    addStyles();
    
    // יצירה מחדש של כל העיגולים (פתרון קיצוני)
    setTimeout(recreateAllConnectionPoints, 500);
    
    // הוסף מאזינים לאירועים
    addMouseListeners();
    
    // מעקב אחרי שינויים בDOM
    observeDOMChanges();
    
    // הפעל בדיקה תקופתית
    startFixInterval();
    
    // סמן אתחול
    window.visualPuzzleInitialized = true;
    
    console.log("[VisualPuzzle] אתחול מודול חיבור ויזואלי ושינוי צבעי עיגולים הושלם");
  }
  
  // הפעל
  initialize();
})();
