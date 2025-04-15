// קוד גרירת בלוקים מפושט
document.addEventListener('DOMContentLoaded', function() {
  console.log('טוען מערכת גרירת בלוקים בסיסית...');
  
  // מחכה שהדף יטען לגמרי כולל הסקריפטים האחרים
  setTimeout(function() {
    setupDragging();
  }, 1000);
  
  function setupDragging() {
    console.log('מפעיל מערכת גרירה בסיסית...');
    
    // איתור אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות לא נמצא!');
      return;
    }
    
    // משתנה גלובלי
    let currentDraggedBlock = null;
    
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
        
        // נקה את המצב
        currentDraggedBlock = null;
      }
    });
    
    // מאזין לאירוע dragover - כאשר גוררים מעל אזור התכנות
    programmingArea.addEventListener('dragover', function(e) {
      if (currentDraggedBlock) {
        e.preventDefault(); // חייב למניעת התנהגות ברירת מחדל
        updateDraggedBlockPosition(e);
      }
    });
    
    // מאזין לאירוע mousemove - לעדכון רציף של מיקום הבלוק
    programmingArea.addEventListener('mousemove', function(e) {
      if (currentDraggedBlock && currentDraggedBlock.classList.contains('dragging')) {
        updateDraggedBlockPosition(e);
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
    
    // מאזין לאירוע drop - כאשר משחררים בלוק באזור התכנות
    programmingArea.addEventListener('drop', function(e) {
      console.log('אירוע drop נתפס באזור התכנות');
      e.preventDefault();
    });
    
    // מאזין לכפתור "נקה הכל"
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        // ניקוי משתנים גלובליים
        currentDraggedBlock = null;
      });
    }
  }
});
