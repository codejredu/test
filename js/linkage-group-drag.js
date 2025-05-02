// color-circle-fix.js - פתרון ייעודי לשינוי צבעי עיגולי חיבור וחיבור פאזל

(function() {
  console.log("[ColorCircleFix] טוען מודול תיקון צבעי עיגולים וחיבור פאזל");
  
  // קונפיגורציה
  const CONFIG = {
    LEFT_COLOR: '#2196F3',          // כחול
    RIGHT_COLOR: '#FF9800',         // כתום
    CONNECTION_THRESHOLD: 15,       // סף מופחת להופעת עיגולים
    CHECK_INTERVAL: 25,             // תדירות בדיקה גבוהה
    DEBUG: true,                    // הדפסת לוג
    OVERLAP_PIXELS: 2,              // חפיפה בחיבור פאזל
    FORCE_COLOR: true              // כפיית החלפת צבע
  };
  
  // משתנים גלובליים
  let checkInterval = null;
  
  // החלפת עיגולי חיבור קיימים בגרסאות חדשות
  function replaceConnectionPoints() {
    try {
      // הסר את כל העיגולים הקיימים
      const existingPoints = document.querySelectorAll('.left-connection-point, .right-connection-point');
      existingPoints.forEach(point => point.remove());
      
      // עבור על כל הבלוקים וצור להם עיגולים חדשים
      const allBlocks = document.querySelectorAll('.block:not(.in-drawer)');
      
      allBlocks.forEach(block => {
        // יצירת עיגול שמאלי (כחול)
        const leftPoint = document.createElement('div');
        leftPoint.className = 'left-connection-point';
        leftPoint.style.cssText = `
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
        `;
        
        // יצירת עיגול ימני (כתום)
        const rightPoint = document.createElement('div');
        rightPoint.className = 'right-connection-point';
        rightPoint.style.cssText = `
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
        `;
        
        // הוסף לבלוק
        block.appendChild(leftPoint);
        block.appendChild(rightPoint);
      });
      
      if (CONFIG.DEBUG) {
        console.log(`[ColorCircleFix] הוחלפו עיגולי חיבור עבור ${allBlocks.length} בלוקים`);
      }
      
      return true;
    } catch (err) {
      console.error("[ColorCircleFix] שגיאה בהחלפת עיגולי חיבור:", err);
      return false;
    }
  }
  
  // עדכון צבעי העיגולים הנוכחיים (כגיבוי)
  function updateExistingPointColors() {
    try {
      const leftPoints = document.querySelectorAll('.left-connection-point');
      const rightPoints = document.querySelectorAll('.right-connection-point');
      
      leftPoints.forEach(point => {
        point.style.backgroundColor = CONFIG.LEFT_COLOR;
        point.style.boxShadow = '0 0 10px 4px rgba(33,150,243,0.95)';
      });
      
      rightPoints.forEach(point => {
        point.style.backgroundColor = CONFIG.RIGHT_COLOR;
        point.style.boxShadow = '0 0 10px 4px rgba(255,152,0,0.95)';
      });
      
      return leftPoints.length + rightPoints.length;
    } catch (err) {
      console.error("[ColorCircleFix] שגיאה בעדכון צבעי עיגולים:", err);
      return 0;
    }
  }
  
  // תיקון חיבור פאזל בין בלוקים מחוברים
  function fixBlockConnections() {
    try {
      // מצא את כל הבלוקים המחוברים
      const allBlocks = Array.from(document.querySelectorAll('.block:not(.in-drawer)'));
      const pairs = [];
      
      for (let i = 0; i < allBlocks.length; i++) {
        const block1 = allBlocks[i];
        const rect1 = block1.getBoundingClientRect();
        
        for (let j = i + 1; j < allBlocks.length; j++) {
          const block2 = allBlocks[j];
          const rect2 = block2.getBoundingClientRect();
          
          // בדוק אם הבלוקים קרובים (מחוברים)
          const gap = Math.abs(rect1.right - rect2.left);
          const verticalAligned = Math.abs(rect1.top - rect2.top) < 5;
          
          if (gap < 5 && verticalAligned && rect1.left < rect2.left) {
            // בלוק 1 משמאל לבלוק 2
            pairs.push({
              left: block1,
              right: block2,
              gap: gap
            });
          }
        }
      }
      
      // תקן את כל הזוגות
      let fixed = 0;
      
      for (const pair of pairs) {
        const leftRect = pair.left.getBoundingClientRect();
        
        // מקם את הבלוק הימני בדיוק
        const areaEl = document.getElementById('programming-area') || 
                        document.getElementById('program-blocks') || 
                        document.body;
        const areaRect = areaEl.getBoundingClientRect();
        
        // חשב מיקום אידיאלי
        const idealLeft = leftRect.right - CONFIG.OVERLAP_PIXELS;
        const idealTop = leftRect.top;
        
        // המר למיקום אבסולוטי
        const absoluteLeft = idealLeft - areaRect.left + areaEl.scrollLeft;
        const absoluteTop = idealTop - areaRect.top + areaEl.scrollTop;
        
        // החל את המיקום המדויק
        pair.right.style.cssText = `
          position: absolute !important;
          left: ${absoluteLeft}px !important;
          top: ${absoluteTop}px !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          transform: none !important;
          transition: none !important;
          z-index: 9 !important;
        `;
        
        // הגדר סגנון לבלוק השמאלי
        pair.left.style.zIndex = '10';
        
        fixed++;
      }
      
      if (fixed > 0 && CONFIG.DEBUG) {
        console.log(`[ColorCircleFix] תוקנו ${fixed} חיבורי בלוקים`);
      }
      
      return fixed;
    } catch (err) {
      console.error("[ColorCircleFix] שגיאה בתיקון חיבורי בלוקים:", err);
      return 0;
    }
  }
  
  // יצירת שכבה כללית לעיגולי חיבור
  function createGlobalPoints() {
    try {
      // הסר שכבה קודמת אם קיימת
      const existingLayer = document.getElementById('global-connection-points');
      if (existingLayer) {
        existingLayer.remove();
      }
      
      // יצירת שכבה חדשה
      const layer = document.createElement('div');
      layer.id = 'global-connection-points';
      layer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10000;
      `;
      
      // יצירת עיגולים גלובליים
      const leftPoint = document.createElement('div');
      leftPoint.id = 'global-left-point';
      leftPoint.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background-color: ${CONFIG.LEFT_COLOR};
        border-radius: 50%;
        opacity: 0;
        box-shadow: 0 0 10px 4px rgba(33,150,243,0.95);
        border: 2px solid #FFF;
        transition: opacity 0.1s ease-out;
        display: none;
      `;
      
      const rightPoint = document.createElement('div');
      rightPoint.id = 'global-right-point';
      rightPoint.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background-color: ${CONFIG.RIGHT_COLOR};
        border-radius: 50%;
        opacity: 0;
        box-shadow: 0 0 10px 4px rgba(255,152,0,0.95);
        border: 2px solid #FFF;
        transition: opacity 0.1s ease-out;
        display: none;
      `;
      
      // הוסף עיגולים לשכבה
      layer.appendChild(leftPoint);
      layer.appendChild(rightPoint);
      
      // הוסף שכבה למסמך
      document.body.appendChild(layer);
      
      if (CONFIG.DEBUG) {
        console.log("[ColorCircleFix] נוצרה שכבה גלובלית לעיגולי חיבור");
      }
      
      return true;
    } catch (err) {
      console.error("[ColorCircleFix] שגיאה ביצירת שכבה גלובלית:", err);
      return false;
    }
  }
  
  // עקיפת פונקציית הצגת עיגולי חיבור
  function overrideHighlightFunction() {
    try {
      // אם פונקציית highlightConnectionPoint קיימת, עקוף אותה
      if (typeof window.highlightConnectionPoint === 'function') {
        const originalHighlight = window.highlightConnectionPoint;
        
        window.highlightConnectionPoint = function(block, isLeft) {
          if (!block) return false;
          
          try {
            // קבל עיגול מתאים
            const globalPoint = document.getElementById(isLeft ? 'global-left-point' : 'global-right-point');
            
            if (globalPoint) {
              // הצג את העיגול הגלובלי במיקום המתאים
              const rect = block.getBoundingClientRect();
              const x = isLeft ? rect.left - 10 : rect.right - 10;
              const y = rect.top + rect.height / 2 - 10;
              
              globalPoint.style.left = `${x}px`;
              globalPoint.style.top = `${y}px`;
              globalPoint.style.display = 'block';
              globalPoint.style.opacity = '1';
              
              // הסתר אחרי זמן מה
              setTimeout(() => {
                globalPoint.style.opacity = '0';
                setTimeout(() => {
                  globalPoint.style.display = 'none';
                }, 500);
              }, 2000);
              
              return true;
            }
          } catch (err) {
            console.error('[ColorCircleFix] שגיאה בהצגת עיגול גלובלי:', err);
          }
          
          // אם משהו נכשל, קרא לפונקציה המקורית
          return originalHighlight.apply(this, arguments);
        };
        
        if (CONFIG.DEBUG) {
          console.log("[ColorCircleFix] עקפתי את פונקציית הצגת עיגולי חיבור");
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("[ColorCircleFix] שגיאה בעקיפת פונקציית הצגת עיגולי חיבור:", err);
      return false;
    }
  }
  
  // האזנה לאירועי עכבר
  function setupMouseListeners() {
    document.addEventListener('mouseup', function(e) {
      // תקן את כל חיבורי הבלוקים
      setTimeout(fixBlockConnections, 10);
      
      // החלף עיגולי חיבור
      if (CONFIG.FORCE_COLOR) {
        setTimeout(replaceConnectionPoints, 100);
      }
    });
    
    document.addEventListener('mousemove', function(e) {
      if (CONFIG.FORCE_COLOR) {
        // עדכון צבעי עיגולים לפי צורך
        updateExistingPointColors();
      }
    });
    
    if (CONFIG.DEBUG) {
      console.log("[ColorCircleFix] נוספו מאזינים לאירועי עכבר");
    }
  }
  
  // תיקון עיגולים וחיבורים תקופתי
  function startFixInterval() {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    
    checkInterval = setInterval(() => {
      if (CONFIG.FORCE_COLOR) {
        updateExistingPointColors();
        
        // החלף עיגולים לפי צורך
        if (Math.random() < 0.1) { // רק 10% מהזמן
          replaceConnectionPoints();
        }
      }
      
      fixBlockConnections();
    }, CONFIG.CHECK_INTERVAL);
    
    if (CONFIG.DEBUG) {
      console.log(`[ColorCircleFix] הופעלה בדיקה תקופתית כל ${CONFIG.CHECK_INTERVAL}ms`);
    }
  }
  
  // אתחול המודול
  function initializeModule() {
    // בדיקה אם המודול כבר אותחל
    if (window.colorCircleFixInitialized) {
      console.log("[ColorCircleFix] המודול כבר אותחל - דלג");
      return;
    }
    
    console.log("[ColorCircleFix] אתחול מודול תיקון צבעי עיגולים וחיבור פאזל");
    
    // החלף את כל עיגולי החיבור
    replaceConnectionPoints();
    
    // יצור שכבה גלובלית לעיגולי חיבור
    createGlobalPoints();
    
    // עקוף פונקציות הצגת עיגולים
    overrideHighlightFunction();
    
    // הוסף מאזינים
    setupMouseListeners();
    
    // הפעל בדיקה תקופתית
    startFixInterval();
    
    // סמן אתחול
    window.colorCircleFixInitialized = true;
    
    // תקן את כל החיבורים הקיימים
    setTimeout(fixBlockConnections, 500);
    
    console.log("[ColorCircleFix] אתחול מודול תיקון צבעי עיגולים וחיבור פאזל הושלם");
  }
  
  // הפעל את המודול
  initializeModule();
})();
