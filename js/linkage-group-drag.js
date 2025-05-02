// connection-points-replacer.js - החלפה מוחלטת של עיגולי חיבור ותיקון פאזל

(function() {
  console.log("[ConnectionReplacer] מודול החלפת עיגולי חיבור נטען");
  
  // הגדרת קבועים
  const BLUE_COLOR = "#2196F3"; // כחול
  const ORANGE_COLOR = "#FF9800"; // כתום
  
  // יצירת שכבת עיגולים מותאמת
  function createCustomPointsLayer() {
    // בדוק אם השכבה כבר קיימת
    if (document.getElementById("custom-points-layer")) {
      return;
    }
    
    // יצירת שכבה חדשה
    const layer = document.createElement("div");
    layer.id = "custom-points-layer";
    layer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
    `;
    
    // יצירת עיגולים מותאמים
    const leftCircle = document.createElement("div");
    leftCircle.id = "custom-left-point";
    leftCircle.style.cssText = `
      position: absolute;
      width: 20px;
      height: 20px;
      background-color: ${BLUE_COLOR};
      border-radius: 50%;
      box-shadow: 0 0 10px 4px rgba(33,150,243,0.95);
      border: 2px solid #FFF;
      opacity: 0;
      pointer-events: none;
      display: none;
      z-index: 10001;
    `;
    
    const rightCircle = document.createElement("div");
    rightCircle.id = "custom-right-point";
    rightCircle.style.cssText = `
      position: absolute;
      width: 20px;
      height: 20px;
      background-color: ${ORANGE_COLOR};
      border-radius: 50%;
      box-shadow: 0 0 10px 4px rgba(255,152,0,0.95);
      border: 2px solid #FFF;
      opacity: 0;
      pointer-events: none;
      display: none;
      z-index: 10001;
    `;
    
    // הוספת העיגולים לשכבה
    layer.appendChild(leftCircle);
    layer.appendChild(rightCircle);
    
    // הוספת השכבה למסמך
    document.body.appendChild(layer);
    
    console.log("[ConnectionReplacer] שכבת עיגולים מותאמת נוצרה");
  }
  
  // הסרת נקודות חיבור קיימות
  function removeExistingPoints() {
    const points = document.querySelectorAll('.left-connection-point, .right-connection-point');
    points.forEach(point => {
      point.style.display = 'none';
      point.style.opacity = '0';
    });
  }
  
  // הצגת עיגול מותאם לפי סוג וצד
  function showCustomPoint(isLeft, sourceBlock) {
    if (!sourceBlock) return;
    
    // קבל את העיגול המתאים
    const pointElement = document.getElementById(isLeft ? "custom-left-point" : "custom-right-point");
    if (!pointElement) return;
    
    // קבל את המיקום של הבלוק
    const rect = sourceBlock.getBoundingClientRect();
    
    // חשב את המיקום המדויק של העיגול
    const x = isLeft ? rect.left - 10 : rect.right - 10;
    const y = rect.top + rect.height / 2 - 10;
    
    // הצב את העיגול במיקום הנכון
    pointElement.style.left = `${x}px`;
    pointElement.style.top = `${y}px`;
    pointElement.style.display = 'block';
    pointElement.style.opacity = '1';
    
    // תזמן הסרה אוטומטית של העיגול
    setTimeout(() => {
      pointElement.style.opacity = '0';
      setTimeout(() => {
        pointElement.style.display = 'none';
      }, 300);
    }, 3000);
  }
  
  // עקיפת פונקציות הצגת נקודות
  function overrideConnectionFunctions() {
    // שמור את הפונקציה המקורית
    if (typeof window.highlightConnectionPoint === 'function') {
      const originalFunction = window.highlightConnectionPoint;
      
      // דרוס אותה עם שלנו
      window.highlightConnectionPoint = function(block, isLeft) {
        // הסתר את העיגולים המקוריים
        removeExistingPoints();
        
        // הצג את העיגול המותאם שלנו
        showCustomPoint(isLeft, block);
        
        // הפעל את הפונקציה המקורית (אופציונלי)
        // return originalFunction.apply(this, arguments);
        
        return true;
      };
      
      console.log("[ConnectionReplacer] פונקציית הצגת נקודות חיבור הוחלפה");
    }
  }
  
  // תיקון חיבורי פאזל
  function fixPuzzleConnections() {
    const blocks = document.querySelectorAll('.block:not(.in-drawer)');
    const pairs = [];
    
    // מצא זוגות מחוברים
    blocks.forEach(block1 => {
      // בדוק אם הבלוק מחובר לאחר דרך התכונות
      const connectedToId = block1.getAttribute('data-connected-to');
      if (connectedToId) {
        const block2 = document.getElementById(connectedToId);
        if (block2) {
          // קבע איזה בלוק משמאל ואיזה מימין
          const rect1 = block1.getBoundingClientRect();
          const rect2 = block2.getBoundingClientRect();
          
          if (rect1.left < rect2.left) {
            pairs.push({ left: block1, right: block2 });
          } else {
            pairs.push({ left: block2, right: block1 });
          }
        }
      }
    });
    
    // תקן את החיבורים
    pairs.forEach(pair => {
      // קבל את המיקום הנוכחי
      const leftRect = pair.left.getBoundingClientRect();
      const rightRect = pair.right.getBoundingClientRect();
      
      // אם יש רווח, תקן אותו
      const gap = Math.abs(leftRect.right - rightRect.left);
      if (gap > 0) {
        // קבל את אזור התכנות
        const progArea = document.getElementById('programming-area') || 
                        document.getElementById('program-blocks') || 
                        document.body;
        const areaRect = progArea.getBoundingClientRect();
        
        // חשב מיקום מדויק ללא רווח
        const newLeft = leftRect.right - 1; // חפיפה של פיקסל אחד
        const scrollLeft = progArea.scrollLeft || 0;
        const scrollTop = progArea.scrollTop || 0;
        
        // החל מיקום חדש
        const absoluteLeft = newLeft - areaRect.left + scrollLeft;
        const absoluteTop = leftRect.top - areaRect.top + scrollTop;
        
        // הגדר מיקום חדש ישירות
        pair.right.style.cssText = `
          position: absolute !important;
          left: ${Math.round(absoluteLeft)}px !important;
          top: ${Math.round(absoluteTop)}px !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 9 !important;
          transition: none !important;
          transform: none !important;
        `;
        
        // הגדר את z-index של הבלוק השמאלי להיות גבוה יותר
        pair.left.style.zIndex = '10';
      }
    });
    
    return pairs.length;
  }
  
  // האזנה לאירועי עכבר
  function addMouseListeners() {
    // האזנה לתנועת עכבר לזיהוי חיבורים אפשריים
    document.addEventListener('mousemove', function(e) {
      // הסתר את העיגולים המקוריים
      removeExistingPoints();
    });
    
    // האזנה לשחרור עכבר לתיקון חיבורים
    document.addEventListener('mouseup', function(e) {
      // תיקון חיבורי פאזל לאחר שחרור
      setTimeout(fixPuzzleConnections, 50);
      
      // וגם בהשהיה ארוכה יותר למקרה שהמיקום משתנה
      setTimeout(fixPuzzleConnections, 500);
    });
    
    console.log("[ConnectionReplacer] נוספו מאזינים לאירועי עכבר");
  }
  
  // פונקציה לעדיפות גבוהה
  function setupMutationObserver() {
    // הגדר צופה לשינויים בDOM
    const observer = new MutationObserver(function(mutations) {
      // הסתר את העיגולים המקוריים
      removeExistingPoints();
      
      // תקן חיבורי פאזל
      fixPuzzleConnections();
    });
    
    // התחל לעקוב אחרי שינויים במסמך
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    console.log("[ConnectionReplacer] צופה שינויים מוגדר");
  }
  
  // פונקציית אתחול ראשי
  function initialize() {
    // בדוק אם כבר אותחל
    if (window.connectionReplacerInitialized) {
      console.log("[ConnectionReplacer] כבר אותחל");
      return;
    }
    
    // יצירת שכבת עיגולים מותאמת
    createCustomPointsLayer();
    
    // החלפת פונקציות הצגת נקודות
    overrideConnectionFunctions();
    
    // הוספת מאזינים לאירועי עכבר
    addMouseListeners();
    
    // הגדרת צופה שינויים
    setupMutationObserver();
    
    // תיקון ראשוני
    setTimeout(fixPuzzleConnections, 1000);
    
    // סימון שאותחל
    window.connectionReplacerInitialized = true;
    
    console.log("[ConnectionReplacer] מודול החלפת עיגולי חיבור אותחל בהצלחה");
  }
  
  // הפעלת המודול
  initialize();
})();
