// הוראות להתקנה וטיפול בבעיות נפוצות

/*
 * הוראות התקנה:
 * 1. וודא שקובץ linkageimproved.js כבר מותקן ונטען בדף שלך
 * 2. הוסף את הקובץ linkage-group-drag.js לאחר קובץ linkageimproved.js
 * 3. אם אתה עדיין נתקל בבעיות, נסה להוסיף את תיקוני החירום הבאים
 */

// ----- תוספים חשובים לפתרון בעיות -----

// תיקון #1: הוספת גישה ישירה למשתנים הפנימיים של מודול ההצמדה המקורי
// העתק את הקוד הבא לסוף קובץ linkageimproved.js, בתוך ה-IIFE
// (בערך בשורה 614, ממש לפני })();

function exposeInternalState() {
  // חושף משתנים פנימיים לשימוש ע"י מודול גרירת הקבוצות
  window.blockLinkageState = {
    currentDraggedBlock,
    isDraggingBlock,
    potentialSnapTarget,
    snapDirection,
    dragOffset
  };
  
  // פונקציה להגדרת המשתנים מבחוץ
  window.resetBlockLinkageState = function() {
    currentDraggedBlock = null;
    isDraggingBlock = false;
    potentialSnapTarget = null;
    snapDirection = null;
  };
  
  console.log("Block linkage internal state exposed for group drag module");
}

exposeInternalState();


// תיקון #2: הוספת גרייסי לקובץ linkage-group-drag.js
// העתק את הקוד הבא לתחילת קובץ linkage-group-drag.js, אחרי ההגדרות של המשתנים הגלובליים

function accessOriginalModuleState() {
  // נסה לגשת למשתנים הפנימיים של המודול המקורי
  try {
    if (window.blockLinkageState) {
      // נמצאה הרחבת משתנים חשופים
      console.log("[GroupDrag] נמצאה גישה למשתני המודול המקורי");
      return true;
    } else if (window.resetBlockLinkageState) {
      // יש לפחות פונקציית איפוס
      console.log("[GroupDrag] נמצאה פונקציית איפוס של המודול המקורי");
      return true;
    }
  } catch (err) {
    console.warn("[GroupDrag] שגיאה בנסיון לגשת למודול ההצמדה המקורי:", err);
  }
  return false;
}

// קורא לפונקציה זו בתחילת handleGroupMouseDown
// וקורא לפונקציית האיפוס בתחילת handleGroupMouseUp אם היא קיימת


// תיקון #3: שינוי סלקטור CSS
// אם התאים CSS לא מוחלים נכון בקובץ linkage-group-drag.js, נסה להחליף את

.group-dragging {
  transition: left ${GROUP_CONFIG.ANIM_DURATION} ease, top ${GROUP_CONFIG.ANIM_DURATION} ease !important;
  opacity: 0.85 !important;
  z-index: ${GROUP_CONFIG.GROUP_DRAG_Z_INDEX} !important;
}

// עם

.group-dragging {
  transition: none !important;
  opacity: 0.85 !important;
  z-index: ${GROUP_CONFIG.GROUP_DRAG_Z_INDEX} !important;
  transform: none !important;
}


// תיקון #4: הוספת קוד גיבוי למקרה שבלוק לא זז כראוי
// הוסף פונקציית עזר זו לקובץ:

function forceUpdateBlockPosition(block, left, top) {
  if (!block) return;
  
  // נסה שיטות שונות להזזת הבלוק
  block.style.cssText = `position: absolute !important; left: ${left}px !important; top: ${top}px !important; z-index: ${GROUP_CONFIG.GROUP_DRAG_Z_INDEX} !important; margin: 0 !important; transform: none !important;`;
  
  // ניקוי טרנספורמציות ומעברים
  block.style.transition = 'none';
  block.style.transform = 'none';
  
  // הכרח את הדפדפן לרנדר מחדש (repaint)
  void block.offsetWidth;
}

// וקרא לה בתוך updateGroupPosition במקום להגדיר סגנונות אחד אחד


// תיקון #5: הוספת תמיכה בקוד המוסתר מהמודול המקורי
// הוסף זאת לאחר האתחול במודול שלך

function monkeyPatchOriginalModule() {
  if (typeof window.handleMouseMove === 'function') {
    const originalMouseMove = window.handleMouseMove;
    window.handleMouseMove = function(e) {
      if (isGroupDragging) {
        return; // דלג על הטיפול המקורי אם גרירת קבוצה פעילה
      }
      return originalMouseMove.call(this, e);
    };
    console.log("[GroupDrag] Monkey-patched original mouse move handler");
  }
  
  if (typeof window.handleMouseUp === 'function') {
    const originalMouseUp = window.handleMouseUp;
    window.handleMouseUp = function(e) {
      if (isGroupDragging) {
        return; // דלג על הטיפול המקורי אם גרירת קבוצה פעילה
      }
      return originalMouseUp.call(this, e);
    };
    console.log("[GroupDrag] Monkey-patched original mouse up handler");
  }
}

// קרא לפונקציה זו בסוף initializeGroupDragModule
