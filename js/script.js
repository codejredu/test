// הוסף את הקוד הזה לסוף הקובץ script.js שלך

// ========================================================================
// תיקון גרירת איקון בלבנה
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
  // מניעת גרירה ישירה של האיקונים
  function preventIconDrag() {
    // מצא את כל האיקונים בלבנים
    const blockIcons = document.querySelectorAll('.block-icon-img');
    
    blockIcons.forEach(icon => {
      // מנע גרירה של האיקון עצמו
      icon.setAttribute('draggable', 'false');
      
      // הוסף מאזין לאירוע לחיצה שיעביר את האירוע ללבנה המכילה
      icon.addEventListener('mousedown', function(event) {
        // מצא את הלבנה המכילה את האיקון
        const blockContainer = icon.closest('.block-container');
        if (blockContainer) {
          // בטל את האירוע הנוכחי
          event.stopPropagation();
          
          // יצירת אירוע mousedown חדש עבור הלבנה המכילה
          const newEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: event.clientX,
            clientY: event.clientY,
            screenX: event.screenX,
            screenY: event.screenY,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            button: event.button,
            buttons: event.buttons
          });
          
          // שלח את האירוע ללבנה המכילה
          blockContainer.dispatchEvent(newEvent);
        }
      });
    });
  }
  
  // הפעל את הפונקציה בטעינת הדף
  preventIconDrag();
  
  // הפעל גם בכל פעם שמשתנה קטגוריה, כי נוספים אלמנטים חדשים
  const categoryTabs = document.querySelectorAll('.category-tab');
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // השהייה קטנה כדי לוודא שהאלמנטים החדשים נטענו
      setTimeout(preventIconDrag, 100);
    });
  });
  
  // מוסיף שיפור לפונקציית createBlockElement
  const originalCreateBlockElement = window.createBlockElement;
  if (typeof originalCreateBlockElement === 'function') {
    window.createBlockElement = function(block, category) {
      const blockElement = originalCreateBlockElement(block, category);
      
      // מצא את האיקון ומנע ממנו להיגרר בנפרד
      const icon = blockElement.querySelector('.block-icon-img');
      if (icon) {
        icon.setAttribute('draggable', 'false');
        
        icon.addEventListener('mousedown', function(event) {
          event.stopPropagation();
          
          const newEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: event.clientX,
            clientY: event.clientY,
            screenX: event.screenX,
            screenY: event.screenY,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
            button: event.button,
            buttons: event.buttons
          });
          
          blockElement.dispatchEvent(newEvent);
        });
      }
      
      return blockElement;
    };
  }
  
  // הוסף מאזין לאירוע המתאים כאשר נוספים בלוקים חדשים לאזור התכנות
  const programmingArea = document.getElementById('program-blocks');
  if (programmingArea) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // מרפרש את מניעת הגרירה על האיקונים בבלוקים החדשים
          preventIconDrag();
        }
      });
    });
    
    observer.observe(programmingArea, { childList: true });
  }
});
