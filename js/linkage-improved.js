// מימוש של מערכת חיבור בלוקים עם הילה צהובה ומלבן כחול מקווקו
(function() {
  // משתנים גלובליים
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let lastClickedBlock = null;
  let lastRightClickedBlock = null;
  
  // פונקציה ראשית - תחילת המימוש
  document.addEventListener('DOMContentLoaded', function() {
    // אתחול סגנונות וניקוי הדגשות
    addHighlightStyles();
    removeFuturePositionIndicator();
    clearAllHighlights();
    
    // הוספת מאזינים לאירועים
    initDragAndDropListeners();
    initBlockConnectionListeners();
    initClearAllButton();
  });
  
  // אתחול מאזינים לגרירה ושחרור
  function initDragAndDropListeners() {
    // הקוד הקיים שלך לאתחול מאזיני גרירה ושחרור
    // ...
  }
  
  // אתחול מאזינים לחיבורי בלוקים
  function initBlockConnectionListeners() {
    // הקוד הקיים שלך לאתחול מאזיני חיבורים
    // ...
  }
  
  // פונקציה לבדיקת אפשרות הצמדה
  function checkSnapPossibility(sourceBlock, blocks) {
    // הקוד הקיים שלך לבדיקת אפשרות הצמדה
    // ...
  }
  
  // חישוב כיוון ההצמדה
  function calculateSnapDirection(sourceBlock, targetBlock) {
    // הקוד הקיים שלך לחישוב כיוון ההצמדה
    // ...
  }
  
  // פונקציה להצמדת בלוקים
  function snapBlocks(sourceBlock, targetBlock, direction) {
    try {
      // חישוב מיקומים
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const programRect = document.getElementById('program-container').getBoundingClientRect();
      
      let newLeft, newTop;
      
      if (direction === 'left') {
        // הצמדה משמאל לטרגט: הפין הימני של המקור לשקע השמאלי של היעד
        // מצמיד את הבלוק כך שקצהו הימני נמצא בדיוק על קצהו השמאלי של הבלוק היעד
        newLeft = targetRect.left - programRect.left - sourceRect.width;
        newTop = targetRect.top - programRect.top;
      } else {
        // הצמדה מימין לטרגט: השקע השמאלי של המקור לפין הימני של היעד
        // מצמיד את הבלוק כך שקצהו השמאלי נמצא בדיוק על קצהו הימני של הבלוק היעד
        newLeft = targetRect.right - programRect.left;
        newTop = targetRect.top - programRect.top;
      }
      
      // עדכון מיקום הבלוק
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';
      
      // הוספת סימון חיבור
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      
      // סימון כיוון החיבור לשימוש עתידי
      sourceBlock.setAttribute('data-connected-to', targetBlock.id || generateUniqueId(targetBlock));
      sourceBlock.setAttribute('data-connection-direction', direction);
      
      // אפקט ויזואלי קטן בזמן ההצמדה
      addSnapEffectAnimation(sourceBlock);
      
      // הסרת אינדיקטור מיקום עתידי אם קיים
      removeFuturePositionIndicator();
      
      console.log('הצמדה בוצעה בכיוון:', direction);
    } catch (err) {
      console.error('שגיאה בהצמדת בלוקים:', err);
    }
  }
  
  // יצירת מזהה ייחודי לבלוק אם אין לו
  function generateUniqueId(block) {
    if (!block.id) {
      const uniqueId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      block.id = uniqueId;
    }
    return block.id;
  }
  
  // הוספת אנימציית הצמדה
  function addSnapEffectAnimation(block) {
    // הוספת קלאס אנימציה
    block.classList.add('snap-animation');
    
    // הסרת הקלאס אחרי סיום האנימציה
    setTimeout(() => {
      block.classList.remove('snap-animation');
    }, 300); // 300ms - משך האנימציה
  }
  
  // הוספת אנימציית ניתוק
  function addDetachEffectAnimation(block) {
    // הוספת קלאס אנימציה
    block.classList.add('detach-animation');
    
    // הסרת הקלאס אחרי סיום האנימציה
    setTimeout(() => {
      block.classList.remove('detach-animation');
    }, 300); // 300ms - משך האנימציה
  }
  
  // פונקציה ליצירת אינדיקטור מיקום עתידי
  function createFuturePositionIndicator() {
    // מחיקת אינדיקטור קודם אם קיים
    removeFuturePositionIndicator();
    
    // יצירת אלמנט חדש
    const indicator = document.createElement('div');
    indicator.id = 'future-position-indicator';
    indicator.className = 'future-position-indicator';
    
    // הוספה למסמך
    document.body.appendChild(indicator);
    
    return indicator;
  }
  
  // פונקציה להסרת אינדיקטור מיקום עתידי
  function removeFuturePositionIndicator() {
    const existingIndicator = document.getElementById('future-position-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
  }
  
  // פונקציה לעדכון המיקום העתידי של הבלוק - קריאה בזמן גרירה
  function updateFuturePosition(sourceBlock, targetBlock, direction, programRect) {
    try {
      // קבלת האינדיקטור או יצירתו אם לא קיים
      let indicator = document.getElementById('future-position-indicator');
      if (!indicator) {
        indicator = createFuturePositionIndicator();
      }
      
      // מחשב מיקום ומימדים
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      
      let newLeft, newTop;
      
      if (direction === 'left') {
        // הצמדה משמאל לטרגט
        newLeft = targetRect.left - programRect.left - sourceRect.width;
        newTop = targetRect.top - programRect.top;
      } else {
        // הצמדה מימין לטרגט
        newLeft = targetRect.right - programRect.left;
        newTop = targetRect.top - programRect.top;
      }
      
      // עדכון מיקום וגודל האינדיקטור
      indicator.style.position = 'absolute';
      indicator.style.left = newLeft + 'px';
      indicator.style.top = newTop + 'px';
      indicator.style.width = sourceRect.width + 'px';
      indicator.style.height = sourceRect.height + 'px';
      indicator.style.display = 'block';
      
    } catch (err) {
      console.error('שגיאה בעדכון אינדיקטור מיקום עתידי:', err);
    }
  }
  
  // הוספת סגנונות CSS להדגשה ואנימציה - גרסה משופרת
  function addHighlightStyles() {
    // בדיקה אם כבר קיים אלמנט סגנון למניעת כפילות
    if (document.getElementById('block-connection-styles')) return;
    
    // יצירת אלמנט style חדש
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* הדגשת בלוק מקור (הנגרר) בצורה ישירה */
      .snap-source {
        filter: brightness(1.05) !important;
        transition: all 0.15s ease-out !important;
        box-shadow: 0 0 12px 4px rgba(0, 180, 255, 0.7) !important;
        z-index: 1000 !important;
      }
      
      /* הדגשת בלוק יעד */
      .snap-target {
        filter: brightness(1.1) !important;
        transition: all 0.15s ease-out !important;
        box-shadow: 0 0 12px 4px rgba(255, 255, 0, 0.7) !important;
        z-index: 999 !important;
      }
      
      /* מלבן כחול מקווקו לציון מיקום עתידי */
      .future-position-indicator {
        position: absolute;
        border: 2px dashed rgba(0, 136, 255, 0.8);
        border-radius: 5px;
        background-color: rgba(0, 136, 255, 0.05);
        pointer-events: none;
        z-index: 998;
        transition: all 0.15s ease-out;
      }
      
      /* סימוני הצמדה משופרים - חזקים יותר וברורים יותר */
      .snap-left::before {
        content: '';
        position: absolute;
        left: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 24px;
        background-color: rgba(255, 255, 0, 0.9);
        border-radius: 0 4px 4px 0;
        z-index: 1001;
        box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.6);
      }
      
      .snap-right::after {
        content: '';
        position: absolute;
        right: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 24px;
        background-color: rgba(255, 255, 0, 0.9);
        border-radius: 4px 0 0 4px;
        z-index: 1001;
        box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.6);
      }
      
      /* תמיכה בכל סוגי דפדפנים לאנימציה */
      @-webkit-keyframes snapEffect {
        0% { transform: scale(1.02); -webkit-transform: scale(1.02); }
        40% { transform: scale(0.98); -webkit-transform: scale(0.98); }
        70% { transform: scale(1.01); -webkit-transform: scale(1.01); }
        100% { transform: scale(1); -webkit-transform: scale(1); }
      }
      
      @keyframes snapEffect {
        0% { transform: scale(1.02); }
        40% { transform: scale(0.98); }
        70% { transform: scale(1.01); }
        100% { transform: scale(1); }
      }
      
      .snap-animation {
        animation: snapEffect 0.3s ease-out;
        -webkit-animation: snapEffect 0.3s ease-out;
      }
      
      @-webkit-keyframes detachEffect {
        0% { transform: scale(1); -webkit-transform: scale(1); }
        30% { transform: scale(1.04) rotate(1deg); -webkit-transform: scale(1.04) rotate(1deg); }
        60% { transform: scale(0.98) rotate(-1deg); -webkit-transform: scale(0.98) rotate(-1deg); }
        100% { transform: scale(1) rotate(0); -webkit-transform: scale(1) rotate(0); }
      }
      
      @keyframes detachEffect {
        0% { transform: scale(1); }
        30% { transform: scale(1.04) rotate(1deg); }
        60% { transform: scale(0.98) rotate(-1deg); }
        100% { transform: scale(1) rotate(0); }
      }
      
      .detach-animation {
        animation: detachEffect 0.3s ease-out;
        -webkit-animation: detachEffect 0.3s ease-out;
      }
      
      @-webkit-keyframes pulseIndicator {
        0% { opacity: 0.5; }
        50% { opacity: 0.9; }
        100% { opacity: 0.5; }
      }
      
      @keyframes pulseIndicator {
        0% { opacity: 0.5; }
        50% { opacity: 0.9; }
        100% { opacity: 0.5; }
      }
      
      /* אינדיקטור חיבור גדול ובולט יותר */
      #connection-indicator {
        transition: all 0.2s ease-out;
        -webkit-transition: all 0.2s ease-out;
        animation: pulseIndicator 1.2s infinite ease-in-out;
        -webkit-animation: pulseIndicator 1.2s infinite ease-in-out;
        width: 12px !important;
        opacity: 0.8 !important;
        box-shadow: 0 0 15px 5px rgba(255, 255, 100, 0.7) !important;
      }
      
      /* סימון בלוקים מחוברים */
      .connected-block {
        filter: brightness(1.02);
        position: relative;
      }
      
      .has-connected-block {
        position: relative;
      }
    `;
    
    // הוספה לראש המסמך
    document.head.appendChild(style);
    console.log('נוספו סגנונות CSS להדגשה ואנימציה');
  }
  
  // פונקציה לניקוי כל ההדגשות וסימונים
  function clearAllHighlights() {
    // הסרת קלאסים מכל האלמנטים
    document.querySelectorAll('.snap-source, .snap-target, .snap-left, .snap-right').forEach(el => {
      el.classList.remove('snap-source', 'snap-target', 'snap-left', 'snap-right');
    });
  }
  
  // פונקציה להסרת תפריט הניתוק
  function removeDetachMenu() {
    const detachMenu = document.getElementById('detach-menu');
    if (detachMenu) {
      detachMenu.remove();
    }
  }
  
  // פונקציה להסתרת אינדיקטור חיבור
  function hideConnectionIndicator() {
    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }
  
  // פונקציה לטיפול בגרירת בלוק
  function onBlockDrag(e) {
    // בדיקה אם יש בלוק יעד פוטנציאלי
    if (currentDraggedBlock && potentialSnapTarget) {
      // חישוב כיוון ההצמדה
      const direction = calculateSnapDirection(currentDraggedBlock, potentialSnapTarget);
      
      // בדיקה אם יש כיוון הצמדה תקף
      if (direction) {
        // קבלת מיקום ה-program container
        const programRect = document.getElementById('program-container').getBoundingClientRect();
        
        // עדכון אינדיקטור מיקום עתידי
        updateFuturePosition(currentDraggedBlock, potentialSnapTarget, direction, programRect);
        
        // הדגשת בלוקים
        currentDraggedBlock.classList.add('snap-source');
        potentialSnapTarget.classList.add('snap-target');
        
        // הוספת סימן חזותי לכיוון ההצמדה
        if (direction === 'left') {
          potentialSnapTarget.classList.add('snap-left');
        } else {
          potentialSnapTarget.classList.add('snap-right');
        }
      }
    } else {
      // אם אין מטרת הצמדה, מסיר את האינדיקטור
      removeFuturePositionIndicator();
      clearAllHighlights();
    }
  }
  
  // פונקציה לטיפול בשחרור הבלוק הנגרר
  function onBlockDrop() {
    // הסרת האינדיקטור
    removeFuturePositionIndicator();
    
    // אם יש הצמדה, ביצוע הצמדה כרגיל
    if (currentDraggedBlock && potentialSnapTarget && snapDirection) {
      snapBlocks(currentDraggedBlock, potentialSnapTarget, snapDirection);
    }
    
    // ניקוי הדגשות
    clearAllHighlights();
    
    // איפוס משתנים גלובליים
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
  }
  
  // אתחול כפתור "נקה הכל"
  function initClearAllButton() {
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        // ניקוי משתנים גלובליים
        currentDraggedBlock = null;
        potentialSnapTarget = null;
        snapDirection = null;
        lastClickedBlock = null;
        lastRightClickedBlock = null;
        clearAllHighlights();
        removeDetachMenu();
        hideConnectionIndicator();
        removeFuturePositionIndicator();
        console.log('בוצע ניקוי כללי');
      });
    }
  }
})();
