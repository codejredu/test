// קוד גרירת בלוקים פשוט עם הצמדה
document.addEventListener('DOMContentLoaded', function() {
  console.log('טוען מערכת גרירת בלוקים בסיסית...');
  
  // מחכה שהדף יטען לגמרי כולל הסקריפטים האחרים
  setTimeout(function() {
    setupBlockSystem();
  }, 1000);
  
  function setupBlockSystem() {
    console.log('מפעיל מערכת גרירה והצמדה...');
    
    // קבועים
    const PROXIMITY_THRESHOLD = 20; // מרחק בפיקסלים להופעת ההילה וההצמדה
    
    // איתור אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות לא נמצא!');
      return;
    }
    
    // משתנים גלובליים
    let currentDraggedBlock = null;
    let isNearOtherBlock = false;
    let nearbyBlock = null;
    
    // הוספת סגנונות CSS
    addStyles();
    
    // ----- מאזיני אירועים -----
    
    // 1. התחלת גרירה
    programmingArea.addEventListener('dragstart', function(e) {
      if (e.target.classList.contains('block-container')) {
        // שמירת הבלוק הנגרר
        currentDraggedBlock = e.target;
        
        // הסתרת רוח רפאים של גרירה
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        
        // סימון בלוק בגרירה
        e.target.classList.add('dragging');
        
        // מיקום מקורי
        e.target.dataset.originalLeft = e.target.style.left || '';
        e.target.dataset.originalTop = e.target.style.top || '';
        
        console.log('התחלת גרירה של בלוק:', e.target.id || 'בלי מזהה');
      }
    });
    
    // 2. סיום גרירה
    programmingArea.addEventListener('dragend', function(e) {
      if (e.target.classList.contains('block-container')) {
        console.log('סיום גרירה', isNearOtherBlock ? 'ליד בלוק אחר' : 'לא ליד בלוק אחר');
        
        // הסרת סימון גרירה
        e.target.classList.remove('dragging');
        
        // ביצוע הצמדה אם יש בלוק קרוב
        if (isNearOtherBlock && nearbyBlock) {
          snapBlocks(e.target, nearbyBlock);
        }
        
        // ניקוי הילה
        removeHighlight();
        
        // איפוס משתנים
        currentDraggedBlock = null;
        isNearOtherBlock = false;
        nearbyBlock = null;
      }
    });
    
    // 3. גרירה מעל האזור
    programmingArea.addEventListener('dragover', function(e) {
      if (currentDraggedBlock) {
        e.preventDefault(); // חשוב!
        
        // עדכון מיקום הבלוק הנגרר
        updateBlockPosition(e);
        
        // בדיקה האם קרוב לבלוק אחר
        checkNearbyBlocks();
      }
    });
    
    // 4. מעבר עכבר
    programmingArea.addEventListener('mousemove', function(e) {
      if (currentDraggedBlock && currentDraggedBlock.classList.contains('dragging')) {
        updateBlockPosition(e);
      }
    });
    
    // 5. שחרור בלוק
    programmingArea.addEventListener('drop', function(e) {
      e.preventDefault();
      console.log('שחרור בלוק');
    });
    
    // ----- פונקציות עזר -----
    
    // עדכון מיקום הבלוק בזמן גרירה
    function updateBlockPosition(e) {
      if (!currentDraggedBlock) return;
      
      const programRect = programmingArea.getBoundingClientRect();
      const blockRect = currentDraggedBlock.getBoundingClientRect();
      
      // מיקום במרכז העכבר
      const halfWidth = blockRect.width / 2;
      const halfHeight = blockRect.height / 2;
      
      if (e.clientX > 0 && e.clientY > 0) {
        currentDraggedBlock.style.position = 'absolute';
        currentDraggedBlock.style.left = (e.clientX - programRect.left - halfWidth) + 'px';
        currentDraggedBlock.style.top = (e.clientY - programRect.top - halfHeight) + 'px';
      }
    }
    
    // בדיקה אם יש בלוק קרוב
    function checkNearbyBlocks() {
      if (!currentDraggedBlock) return;
      
      // נקה הילה קודמת
      removeHighlight();
      isNearOtherBlock = false;
      nearbyBlock = null;
      
      // קבל כל הבלוקים
      const blocks = programmingArea.querySelectorAll('.block-container');
      if (blocks.length < 2) return;
      
      const draggedRect = currentDraggedBlock.getBoundingClientRect();
      
      // עבור כל בלוק
      blocks.forEach(block => {
        // דלג על הבלוק הנגרר
        if (block === currentDraggedBlock) return;
        
        const blockRect = block.getBoundingClientRect();
        
        // בדיקת קרבה פשוטה - הפער בין הבלוקים
        let horizontalGap = 999; // ערך גדול כברירת מחדל
        
        // הבלוק הנגרר משמאל לבלוק האחר
        if (draggedRect.right < blockRect.left) {
          horizontalGap = blockRect.left - draggedRect.right;
        } 
        // הבלוק הנגרר מימין לבלוק האחר
        else if (draggedRect.left > blockRect.right) {
          horizontalGap = draggedRect.left - blockRect.right;
        }
        // חפיפה (לא צריך לבדוק)
        else {
          horizontalGap = 0;
        }
        
        // האם באותו גובה בערך
        const verticalMatch = Math.abs(draggedRect.top - blockRect.top) < 30;
        
        // אם מספיק קרוב והגובה מתאים
        if (horizontalGap <= PROXIMITY_THRESHOLD && verticalMatch) {
          isNearOtherBlock = true;
          nearbyBlock = block;
          
          // הוסף הילה
          addHighlight(currentDraggedBlock, block);
          return; // נמצא בלוק קרוב, אפשר לצאת מהלולאה
        }
      });
    }
    
    // פונקציה להוספת הילה לבלוקים קרובים
    function addHighlight(draggedBlock, targetBlock) {
      draggedBlock.classList.add('highlight-source');
      targetBlock.classList.add('highlight-target');
    }
    
    // הסרת הילה מכל הבלוקים
    function removeHighlight() {
      const highlighted = programmingArea.querySelectorAll('.highlight-source, .highlight-target');
      highlighted.forEach(block => {
        block.classList.remove('highlight-source', 'highlight-target');
      });
    }
    
    // הצמדת בלוקים
    function snapBlocks(sourceBlock, targetBlock) {
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const programRect = programmingArea.getBoundingClientRect();
      
      let newLeft, newTop;
      
      // קביעת כיוון הצמדה
      const isSourceLeftOfTarget = sourceRect.left < targetRect.left;
      
      if (isSourceLeftOfTarget) {
        // המקור משמאל ליעד - הצמד את המקור משמאל ליעד
        newLeft = targetRect.left - sourceRect.width - programRect.left;
      } else {
        // המקור מימין ליעד - הצמד את המקור מימין ליעד
        newLeft = targetRect.right - programRect.left;
      }
      
      // שמור על אותו גובה
      newTop = targetRect.top - programRect.top;
      
      // עדכן מיקום
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';
      
      console.log('הצמדה בוצעה!', isSourceLeftOfTarget ? 'המקור משמאל ליעד' : 'המקור מימין ליעד');
      
      // הוסף סימון חיבור
      sourceBlock.classList.add('connected');
      targetBlock.classList.add('connected');
    }
    
    // הוספת סגנונות CSS
    function addStyles() {
      const style = document.createElement('style');
      style.textContent = `
        /* סגנון בלוק בגרירה */
        .block-container.dragging {
          opacity: 0.8;
        }
        
        /* הילה לבלוק מקור */
        .highlight-source {
          outline: 2px dashed #0066cc;
          background-color: rgba(255, 255, 0, 0.3) !important;
        }
        
        /* הילה לבלוק יעד */
        .highlight-target {
          outline: 2px dashed #0066cc;
          background-color: rgba(255, 255, 0, 0.3) !important;
        }
        
        /* סגנון לבלוקים מחוברים */
        .connected {
          box-shadow: 0 0 5px rgba(0, 102, 204, 0.3);
        }
      `;
      document.head.appendChild(style);
    }
    
    // מאזין לכפתור "נקה הכל"
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        // ניקוי משתנים
        currentDraggedBlock = null;
        isNearOtherBlock = false;
        nearbyBlock = null;
        
        // הסרת הילות
        removeHighlight();
        
        // הסרת סימוני חיבור
        const connectedBlocks = programmingArea.querySelectorAll('.connected');
        connectedBlocks.forEach(block => {
          block.classList.remove('connected');
        });
      });
    }
  }
});
