// קוד גרירת בלוקים עם הילה בהתקרבות
document.addEventListener('DOMContentLoaded', function() {
  console.log('טוען מערכת גרירת בלוקים עם הילה בהתקרבות...');
  
  // מחכה שהדף יטען לגמרי כולל הסקריפטים האחרים
  setTimeout(function() {
    setupDragging();
  }, 1000);
  
  function setupDragging() {
    console.log('מפעיל מערכת גרירה עם הילה בהתקרבות...');
    
    // קבועים שניתן לכוונן
    let PROXIMITY_THRESHOLD = 5; // ברירת מחדל: 5 פיקסלים
    
    // הוספת כפתור לשינוי סף הקרבה
    addProximityControl();
    
    // איתור אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות לא נמצא!');
      return;
    }
    
    // משתנים גלובליים
    let currentDraggedBlock = null;
    let nearbyBlock = null;
    
    // הוספת סגנונות להילה
    addHighlightStyles();
    
    // מאזין לאירוע dragstart - כאשר מתחילים לגרור בלוק
    programmingArea.addEventListener('dragstart', function(e) {
      if (e.target.classList.contains('block-container')) {
        // שמירת הבלוק הנגרר
        currentDraggedBlock = e.target;
        
        // מניעת יצירת רוח רפאים - הגדרת התמונה שתיווצר בזמן גרירה
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        
        // מסמנים את הבלוק כנגרר
        e.target.classList.add('dragging');
        
        // מיקום מקורי של הבלוק למקרה שנצטרך לשחזר אותו
        e.target.dataset.originalLeft = e.target.style.left || '';
        e.target.dataset.originalTop = e.target.style.top || '';
        
        // עדכון תצוגת הבלוק בזמן אמת
        updateDraggedBlockPosition(e);
      }
    });
    
    // מאזין לאירוע dragend - כאשר מסיימים לגרור בלוק
    programmingArea.addEventListener('dragend', function(e) {
      if (e.target.classList.contains('block-container')) {
        console.log('סיום גרירה נתפס באזור התכנות');
        
        // הסרת הסימון
        e.target.classList.remove('dragging');
        
        // נקה את המצב והילות
        clearAllHighlights();
        currentDraggedBlock = null;
        nearbyBlock = null;
      }
    });
    
    // מאזין לאירוע dragover - כאשר גוררים מעל אזור התכנות
    programmingArea.addEventListener('dragover', function(e) {
      if (currentDraggedBlock) {
        e.preventDefault(); // חייב למניעת התנהגות ברירת מחדל
        updateDraggedBlockPosition(e);
        
        // בדיקת קרבה לבלוקים אחרים
        checkProximityToOtherBlocks();
      }
    });
    
    // מאזין לאירוע mousemove - לעדכון רציף של מיקום הבלוק
    programmingArea.addEventListener('mousemove', function(e) {
      if (currentDraggedBlock && currentDraggedBlock.classList.contains('dragging')) {
        updateDraggedBlockPosition(e);
        
        // בדיקת קרבה לבלוקים אחרים
        checkProximityToOtherBlocks();
      }
    });
    
    // פונקציה לעדכון מיקום הבלוק הנגרר בזמן אמת
    function updateDraggedBlockPosition(e) {
      if (!currentDraggedBlock) return;
      
      const programRect = programmingArea.getBoundingClientRect();
      
      // חישוב מיקום חדש יחסית לאזור התכנות
      // הפחתת מחצית מרוחב הבלוק כדי שהבלוק יהיה ממוקם במרכז הסמן
      const blockRect = currentDraggedBlock.getBoundingClientRect();
      const halfWidth = blockRect.width / 2;
      const halfHeight = blockRect.height / 2;
      
      // עדכון המיקום רק אם העכבר נמצא בגבולות הגיוניים
      if (e.clientX > 0 && e.clientY > 0) {
        currentDraggedBlock.style.position = 'absolute';
        currentDraggedBlock.style.left = (e.clientX - programRect.left - halfWidth) + 'px';
        currentDraggedBlock.style.top = (e.clientY - programRect.top - halfHeight) + 'px';
      }
    }
    
    // פונקציה לבדיקת קרבה לבלוקים אחרים
    function checkProximityToOtherBlocks() {
      if (!currentDraggedBlock) return;
      
      // נקה הילות קודמות
      clearAllHighlights();
      nearbyBlock = null;
      
      // קבלת כל הבלוקים באזור התכנות
      const blocks = programmingArea.querySelectorAll('.block-container');
      if (blocks.length < 2) return; // צריך לפחות 2 בלוקים
      
      // קבלת המיקום של הבלוק הנגרר
      const draggedRect = currentDraggedBlock.getBoundingClientRect();
      
      // משתנה לשמירת הבלוק הקרוב ביותר
      let closestBlock = null;
      let minDistance = Infinity;
      
      // בדיקת כל בלוק
      blocks.forEach(block => {
        // דלג על הבלוק הנגרר עצמו
        if (block === currentDraggedBlock) return;
        
        const blockRect = block.getBoundingClientRect();
        
        // חישוב המרחק המינימלי בין הבלוקים (בדיקת מרחק אופקי ואנכי)
        // הערה: אנחנו בודקים קצוות לקצוות, לא מרכז למרכז
        
        // חישוב מרחק אופקי - בודק אם יש חפיפה אנכית
        let horizontalDistance = Infinity;
        if (draggedRect.bottom >= blockRect.top && draggedRect.top <= blockRect.bottom) {
          // יש חפיפה אנכית, בדוק את המרחק האופקי הקצר ביותר
          if (draggedRect.right < blockRect.left) {
            // הבלוק הנגרר משמאל לבלוק הנבדק
            horizontalDistance = blockRect.left - draggedRect.right;
          } else if (draggedRect.left > blockRect.right) {
            // הבלוק הנגרר מימין לבלוק הנבדק
            horizontalDistance = draggedRect.left - blockRect.right;
          } else {
            // יש חפיפה אופקית
            horizontalDistance = 0;
          }
        }
        
        // חישוב מרחק אנכי - בודק אם יש חפיפה אופקית
        let verticalDistance = Infinity;
        if (draggedRect.right >= blockRect.left && draggedRect.left <= blockRect.right) {
          // יש חפיפה אופקית, בדוק את המרחק האנכי הקצר ביותר
          if (draggedRect.bottom < blockRect.top) {
            // הבלוק הנגרר מעל הבלוק הנבדק
            verticalDistance = blockRect.top - draggedRect.bottom;
          } else if (draggedRect.top > blockRect.bottom) {
            // הבלוק הנגרר מתחת לבלוק הנבדק
            verticalDistance = draggedRect.top - blockRect.bottom;
          } else {
            // יש חפיפה אנכית
            verticalDistance = 0;
          }
        }
        
        // לקיחת המרחק הקטן יותר מבין האופקי והאנכי
        const distance = Math.min(horizontalDistance, verticalDistance);
        
        // אם מצאנו בלוק קרוב יותר מהקודם
        if (distance < minDistance) {
          minDistance = distance;
          closestBlock = block;
        }
      });
      
      // אם נמצא בלוק קרוב מספיק, הדגש אותו
      if (closestBlock && minDistance <= PROXIMITY_THRESHOLD) {
        nearbyBlock = closestBlock;
        highlightBlocks(currentDraggedBlock, nearbyBlock);
      }
    }
    
    // פונקציה להדגשת בלוקים קרובים
    function highlightBlocks(draggedBlock, targetBlock) {
      if (!draggedBlock || !targetBlock) return;
      
      // הוספת קלאס להילה לבלוק הנגרר
      draggedBlock.classList.add('proximity-source');
      
      // הוספת קלאס להילה לבלוק המטרה
      targetBlock.classList.add('proximity-target');
    }
    
    // פונקציה לניקוי כל ההילות
    function clearAllHighlights() {
      const highlightedBlocks = programmingArea.querySelectorAll('.proximity-source, .proximity-target');
      highlightedBlocks.forEach(block => {
        block.classList.remove('proximity-source', 'proximity-target');
      });
    }
    
    // מאזין לאירוע drop - כאשר משחררים בלוק באזור התכנות
    programmingArea.addEventListener('drop', function(e) {
      console.log('אירוע drop נתפס באזור התכנות');
      e.preventDefault();
      
      // נקה הילות לאחר השחרור
      setTimeout(clearAllHighlights, 100);
    });
    
    // הוספת סגנונות CSS להילה
    function addHighlightStyles() {
      // יצירת אלמנט style
      const style = document.createElement('style');
      style.textContent = `
        /* הילה צהובה למקור (הבלוק הנגרר) */
        .proximity-source {
          position: relative;
          z-index: 100;
        }
        
        .proximity-source::before {
          content: '';
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          background-color: rgba(255, 255, 0, 0.3);
          border: 2px dashed #0066cc;
          border-radius: 5px;
          z-index: -1;
          animation: pulsate 1.5s infinite alternate;
        }
        
        /* הילה צהובה למטרה (הבלוק הקרוב) */
        .proximity-target {
          position: relative;
          z-index: 90;
        }
        
        .proximity-target::before {
          content: '';
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          background-color: rgba(255, 255, 0, 0.3);
          border: 2px dashed #0066cc;
          border-radius: 5px;
          z-index: -1;
          animation: pulsate 1.5s infinite alternate;
        }
        
        /* אנימציית פעימה עדינה */
        @keyframes pulsate {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `;
      
      // הוספה לראש המסמך
      document.head.appendChild(style);
    }
    
    // פונקציה להוספת שליטה על סף הקרבה
    function addProximityControl() {
      // בדיקה אם הפקד כבר קיים
      if (document.getElementById('proximity-control')) return;
      
      // יצירת מיכל לפקדים
      const controlContainer = document.createElement('div');
      controlContainer.id = 'proximity-control';
      controlContainer.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #f0f0f0; padding: 10px; border: 1px solid #ccc; border-radius: 5px; z-index: 1000;';
      
      // כותרת
      const title = document.createElement('div');
      title.textContent = 'הגדרת סף קרבה (פיקסלים):';
      title.style.marginBottom = '5px';
      controlContainer.appendChild(title);
      
      // מחוון (סליידר)
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '1';
      slider.max = '50';
      slider.value = PROXIMITY_THRESHOLD;
      slider.style.width = '150px';
      controlContainer.appendChild(slider);
      
      // תצוגת ערך
      const valueDisplay = document.createElement('span');
      valueDisplay.textContent = PROXIMITY_THRESHOLD;
      valueDisplay.style.marginLeft = '10px';
      controlContainer.appendChild(valueDisplay);
      
      // האזנה לשינויים
      slider.addEventListener('input', function() {
        PROXIMITY_THRESHOLD = parseInt(this.value);
        valueDisplay.textContent = PROXIMITY_THRESHOLD;
      });
      
      // הוספה למסמך
      document.body.appendChild(controlContainer);
    }
    
    // מאזין לכפתור "נקה הכל"
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        // ניקוי משתנים גלובליים
        currentDraggedBlock = null;
        nearbyBlock = null;
        clearAllHighlights();
      });
    }
  }
});
