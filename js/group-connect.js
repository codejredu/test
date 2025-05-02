// --- בתוך linkage-group-connection-simplified.js ---

(function(global) {
  'use strict';

  // ... (קוד קיים: CONNECTION_CONFIG, log, getProgrammingArea, וכו') ...

  // === משתנים גלובליים פנימיים למודול החיבור ===
  let currentAnchorCircles = []; // מערך לאחסון עיגולי העיגון המוצגים כרגע

  // === הגדרות נוספות ===
  const PREVIEW_CONFIG = {
    anchorCircleSize: 10,         // גודל עיגול העיגון בפיקסלים
    anchorSourceColor: 'rgba(0, 255, 0, 0.7)', // צבע עיגול במקור (ירוק שקוף)
    anchorTargetColor: 'rgba(0, 200, 255, 0.7)', // צבע עיגול ביעד (תכלת שקוף)
    anchorZIndex: 1001,          // לשים מעל הבלוקים אבל מתחת לסמן העכבר
    previewClass: 'snap-anchor-circle' // קלאס CSS לעיגולים
  };

  // === הוספת סגנונות CSS דינמית (אם לא קיימים) ===
  function addPreviewStyles() {
    const styleId = 'group-connect-preview-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .${PREVIEW_CONFIG.previewClass} {
        position: absolute;
        width: ${PREVIEW_CONFIG.anchorCircleSize}px;
        height: ${PREVIEW_CONFIG.anchorCircleSize}px;
        border-radius: 50%;
        pointer-events: none; /* לא להפריע לאירועי עכבר */
        z-index: ${PREVIEW_CONFIG.anchorZIndex};
        transition: opacity 0.1s ease-out; /* אפקט עדין */
        opacity: 0; /* התחל מוסתר */
        box-shadow: 0 0 3px rgba(0,0,0,0.5);
      }
      .${PREVIEW_CONFIG.previewClass}.visible {
          opacity: 1;
      }
      .${PREVIEW_CONFIG.previewClass}.source {
        background-color: ${PREVIEW_CONFIG.anchorSourceColor};
        /* מרכז את העיגול על הנקודה */
        transform: translate(-50%, -50%);
      }
      .${PREVIEW_CONFIG.previewClass}.target {
        background-color: ${PREVIEW_CONFIG.anchorTargetColor};
         /* מרכז את העיגול על הנקודה */
        transform: translate(-50%, -50%);
      }
    `;
    document.head.appendChild(style);
  }

  // === פונקציות חדשות ליצירה והסרה של עיגולי עיגון ===

  // יוצר עיגול עיגון במיקום נתון
  function createAnchorCircle(x, y, isTarget = false) {
    const circle = document.createElement('div');
    circle.className = `${PREVIEW_CONFIG.previewClass} ${isTarget ? 'target' : 'source'}`;

    // חשוב: המיקום צריך להיות אבסולוטי ביחס לדף כולו
    // getConnectionPointCoords מחזיר קואורדינטות יחסית ל-viewport.
    // צריך להוסיף את גלילת הדף כדי לקבל מיקום אבסולוטי בדף.
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    circle.style.left = `${Math.round(x + scrollX)}px`;
    circle.style.top = `${Math.round(y + scrollY)}px`;

    // הוסף לדף (עדיף ל-body כדי להיות מעל הכל)
    document.body.appendChild(circle);
    // הפעל אנימציה קטנה להופעה
    requestAnimationFrame(() => {
       circle.classList.add('visible');
    });

    return circle;
  }

  // מסיר את כל עיגולי העיגון הנוכחיים
  function removeAnchorCircles() {
    currentAnchorCircles.forEach(circle => {
        // אפשר להוסיף אפקט היעלמות לפני ההסרה
        circle.classList.remove('visible');
        // הסר מה-DOM אחרי זמן קצר
        setTimeout(() => {
             if (circle.parentNode) {
                 circle.parentNode.removeChild(circle);
             }
        }, 150); // תואם לזמן ה-transition ב-CSS
    });
    currentAnchorCircles = []; // אפס את המערך
  }

  /**
   * פונקציה ציבורית שמציגה את התצוגה המקדימה של החיבור הקרוב ביותר.
   * נקראת מתוך handleMouseMove של מודול הגרירה.
   * @param {Array<HTMLElement>} draggedGroupBlocks - מערך הבלוקים הנגררים.
   */
  function showConnectionPreview(draggedGroupBlocks) {
    if (!draggedGroupBlocks || draggedGroupBlocks.length === 0) return;

    // 1. נקה עיגולים קודמים
    removeAnchorCircles();

    // 2. מצא את החיבור הפוטנציאלי הטוב ביותר ברגע זה
    //    שים לב: findBestConnectionForGroup יכולה להיות יקרה לחישוב בכל תזוזת פיקסל.
    //    אפשר לשקול Throttling (הגבלת תדירות) אם יש בעיות ביצועים.
    const bestConnection = findBestConnectionForGroup(draggedGroupBlocks);

    // 3. אם נמצא חיבור בטווח
    if (bestConnection && bestConnection.distance < CONNECTION_CONFIG.SNAP_RADIUS) {
      log(`תצוגה מקדימה לחיבור: ${bestConnection.sourceBlock.id}(${bestConnection.sourceType}) -> ${bestConnection.targetBlock.id}(${bestConnection.targetType})`);

      // 4. הצג את עיגולי העיגון
      const sourceCircle = createAnchorCircle(bestConnection.sourceCoords.x, bestConnection.sourceCoords.y, false);
      const targetCircle = createAnchorCircle(bestConnection.targetCoords.x, bestConnection.targetCoords.y, true);

      // 5. שמור אותם כדי שנוכל להסירם אחר כך
      currentAnchorCircles.push(sourceCircle, targetCircle);
    }
  }


  // ... (קוד קיים: findBestConnectionForGroup, applyConnection, tryConnectGroupOnDrop) ...


  // === חשיפת הפונקציות הציבוריות ===
  global.GroupConnection = {
    tryConnectGroupOnDrop: tryConnectGroupOnDrop,
    showConnectionPreview: showConnectionPreview, // <-- חשוף את הפונקציה החדשה
    removeAnchorCircles: removeAnchorCircles,     // <-- חשוף גם את פונקציית הניקוי
    _getConnectionPointCoords: getConnectionPointCoords,
    _applyConnection: applyConnection
  };

  // הוסף את הסגנונות לדף בעת אתחול המודול
  addPreviewStyles();

  log('מודול חיבור קבוצות אותחל (עם תצוגה מקדימה).');

})(window);
