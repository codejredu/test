// קוד גרירת בלוקים עם הצמדה פשוטה ומדוייקת
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
    
    // משתנים גלובליים
    let currentDraggedBlock = null;
    let snapCandidate = null;
    let showingHighlight = false;
    
    // הגדרת סף קרבה להצמדה (בפיקסלים)
    const SNAP_THRESHOLD = 20;
    
    // הוספת סגנונות CSS
    addStyles();
    
    // מאזין לתחילת גרירה
    programmingArea.addEventListener('dragstart', function(e) {
      if (e.target.classList.contains('block-container')) {
        // שמירת הבלוק הנגרר
        currentDraggedBlock = e.target;
        
        // ביטול רוח רפאים
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        
        // סימון הבלוק
        e.target.classList.add('dragging');
        
        console.log('התחלת גרירה:', e.target.id || 'בלוק ללא מזהה');
      }
    });
    
    // מאזין לסיום גרירה
    programmingArea.addEventListener('dragend', function(e) {
      if (e.target.classList.contains('block-container')) {
        // הסרת סימון
        e.target.classList.remove('dragging');
        
        // אם יש מועמד להצמדה ומוצגת הילה
        if (snapCandidate && showingHighlight) {
          // בצע הצמדה
          snapBlocks(e.target, snapCandidate);
          console.log('ביצוע הצמדה לאחר זיהוי קירבה');
        }
        
        // ניקוי הילה
        clearHighlights();
        
        // ניקוי משתנים
        currentDraggedBlock = null;
        snapCandidate = null;
        showingHighlight = false;
      }
    });
    
    // מאזין לגרירה מעל האזור
    programmingArea.addEventListener('dragover', function(e) {
      if (currentDraggedBlock) {
        e.preventDefault();
        // עדכון מיקום
        updateBlockPosition(e);
        
        // בדיקת קירבה לבלוקים אחרים
        checkForProximity();
      }
    });
    
    // עדכון מיקום הבלוק בזמן גרירה
    function updateBlockPosition(e) {
      if (!currentDraggedBlock) return;
      
      const rect = programmingArea.getBoundingClientRect();
      const blockRect = currentDraggedBlock.getBoundingClientRect();
      
      // מיקום במרכז הסמן
      let left = e.clientX - rect.left - (blockRect.width / 2);
      let top = e.clientY - rect.top - (blockRect.height / 2);
      
      // וידוא שהבלוק לא יוצא מגבולות האזור
      left = Math.max(0, Math.min(left, rect.width - blockRect.width));
      top = Math.max(0, Math.min(top, rect.height - blockRect.height));
      
      // עדכון מיקום
      currentDraggedBlock.style.position = 'absolute';
      currentDraggedBlock.style.left = left + 'px';
      currentDraggedBlock.style.top = top + 'px';
    }
    
    // בדיקת קירבה לבלוקים אחרים
    function checkForProximity() {
      if (!currentDraggedBlock) return;
      
      // ניקוי הילה קודמת
      clearHighlights();
      snapCandidate = null;
      showingHighlight = false;
      
      // מיקום הבלוק הנגרר
      const draggedRect = currentDraggedBlock.getBoundingClientRect();
      
      // קבלת כל הבלוקים באזור
      const blocks = programmingArea.querySelectorAll('.block-container');
      
      // מעבר על כל הבלוקים
      for (let block of blocks) {
        // דלג על הבלוק הנגרר עצמו
        if (block === currentDraggedBlock) continue;
        
        const blockRect = block.getBoundingClientRect();
        
        // בדיקת מרחק אופקי
        let horizontalDistance = 9999; // ערך גדול כברירת מחדל
        let isLeftToRight = false;
        
        // המקור משמאל ליעד
        if (draggedRect.right < blockRect.left) {
          horizontalDistance = blockRect.left - draggedRect.right;
          isLeftToRight = true;
        }
        // המקור מימין ליעד
        else if (draggedRect.left > blockRect.right) {
          horizontalDistance = draggedRect.left - blockRect.right;
          isLeftToRight = false;
        }
        
        // בדיקת יישור אנכי - האם הבלוקים באותו גובה בערך
        let verticalAlignment = Math.abs(draggedRect.top - blockRect.top) < 20;
        
        // אם המרחק קטן מסף ההצמדה והבלוקים מיושרים אנכית
        if (horizontalDistance < SNAP_THRESHOLD && verticalAlignment) {
          // שמירת המועמד להצמדה וכיוון ההצמדה
          snapCandidate = block;
          snapCandidate.dataset.snapDirection = isLeftToRight ? 'left-to-right' : 'right-to-left';
          
          // הצגת הילה
          showHighlight(currentDraggedBlock, snapCandidate);
          showingHighlight = true;
          
          // נמצא בלוק להצמדה, אין צורך להמשיך
          console.log('נמצא בלוק להצמדה במרחק', horizontalDistance, 'פיקסלים, כיוון:', 
                     isLeftToRight ? 'משמאל לימין' : 'מימין לשמאל');
          break;
        }
      }
    }
    
    // הצגת הילה
    function showHighlight(sourceBlock, targetBlock) {
      sourceBlock.classList.add('snap-highlight');
      targetBlock.classList.add('snap-highlight');
    }
    
    // ניקוי הילות
    function clearHighlights() {
      const highlighted = document.querySelectorAll('.snap-highlight');
      highlighted.forEach(el => el.classList.remove('snap-highlight'));
    }
    
    // ביצוע הצמדה של בלוקים
    function snapBlocks(sourceBlock, targetBlock) {
      // קבלת נתוני המיקום של הבלוקים
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const areaRect = programmingArea.getBoundingClientRect();
      
      // קבלת כיוון ההצמדה
      const direction = targetBlock.dataset.snapDirection || 'left-to-right';
      
      // חישוב המיקום החדש
      let newLeft, newTop;
      
      if (direction === 'left-to-right') {
        // המקור משמאל ליעד - צד ימין של המקור צמוד לצד שמאל של היעד
        newLeft = targetRect.left - sourceRect.width - areaRect.left;
      } else {
        // המקור מימין ליעד - צד שמאל של המקור צמוד לצד ימין של היעד
        newLeft = targetRect.right - areaRect.left;
      }
      
      // שמירה על אותו גובה
      newTop = targetRect.top - areaRect.top;
      
      // עדכון מיקום הבלוק
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';
      
      // הוספת סימון לבלוקים המחוברים
      sourceBlock.classList.add('snapped');
      targetBlock.classList.add('snapped');
      
      // שמירת מידע על החיבור
      sourceBlock.dataset.snappedTo = targetBlock.id || generateId(targetBlock);
      sourceBlock.dataset.snapDirection = direction;
      
      console.log('בוצעה הצמדה בכיוון:', direction);
    }
    
    // יצירת מזהה ייחודי לבלוק אם אין לו
    function generateId(block) {
      if (!block.id) {
        block.id = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      }
      return block.id;
    }
    
    // הוספת סגנונות CSS
    function addStyles() {
      const style = document.createElement('style');
      style.textContent = `
        /* סגנון בסיסי */
        .block-container {
          position: absolute;
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        
        /* הילת הצמדה */
        .snap-highlight {
          outline: 2px dashed #0066cc !important;
          background-color: rgba(255, 255, 0, 0.3) !important;
          box-shadow: 0 0 10px rgba(255, 255, 0, 0.5) !important;
        }
        
        /* סגנון לבלוקים מוצמדים */
        .snapped {
          box-shadow: 0 0 5px rgba(0, 102, 204, 0.3);
        }
      `;
      document.head.appendChild(style);
    }
    
    // מאזין לנפילת בלוק
    programmingArea.addEventListener('drop', function(e) {
      e.preventDefault();
    });
    
    // מאזין לניקוי הכל
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        // ניקוי משתנים
        currentDraggedBlock = null;
        snapCandidate = null;
        showingHighlight = false;
        
        // ניקוי הילות
        clearHighlights();
        
        // ניקוי סימוני הצמדה
        const snapped = document.querySelectorAll('.snapped');
        snapped.forEach(block => {
          block.classList.remove('snapped');
          block.removeAttribute('data-snapped-to');
          block.removeAttribute('data-snap-direction');
        });
      });
    }
  }
});
