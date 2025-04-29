/**
 * blockGroupDragging.js - פתרון פשוט לגרירה קבוצתית של בלוקים
 * יוצר גרירה קבוצתית כך שהלבנה הראשונה תהיה הגוררת
 */

// פתרון מינימליסטי ופשוט - נוודא שהוא עובד
(function() {
  console.log("Loading ultra-simple block group dragging...");
  
  // הקובץ עשוי להיטען לפני שה-DOM מוכן, אז נמתין מעט
  setTimeout(function() {
    // נטען רק פעם אחת
    if (window.blockGroupDraggingActive) return;
    window.blockGroupDraggingActive = true;
    
    // הגדר פונקציה פשוטה שבודקת אם יש בלוק בגרירה
    function checkDraggedBlocks() {
      try {
        // מצא בלוק בגרירה (בלוק עם המחלקה snap-source)
        const draggedBlock = document.querySelector('#program-blocks .block-container.snap-source');
        
        // אם אין בלוק בגרירה, אין מה לעשות
        if (!draggedBlock) return;
        
        // קבל את המיקום הנוכחי של הבלוק הנגרר
        const mainLeft = parseFloat(draggedBlock.style.left) || 0;
        const mainTop = parseFloat(draggedBlock.style.top) || 0;
        
        // בדוק אם יש בלוק מחובר מימין
        if (draggedBlock.hasAttribute('data-connected-from-right')) {
          // קבל את מזהה הבלוק הימני
          const rightBlockId = draggedBlock.getAttribute('data-connected-from-right');
          const rightBlock = document.getElementById(rightBlockId);
          
          if (rightBlock) {
            // חשב רוחב בלוק
            const blockWidth = draggedBlock.offsetWidth;
            
            // עדכן את מיקום הבלוק הימני
            rightBlock.style.position = 'absolute';
            rightBlock.style.left = (mainLeft + blockWidth - 9) + 'px';
            rightBlock.style.top = mainTop + 'px';
            
            // בדוק אם יש בלוק מחובר לבלוק הימני (רקורסיבי)
            if (rightBlock.hasAttribute('data-connected-from-right')) {
              const nextBlockId = rightBlock.getAttribute('data-connected-from-right');
              const nextBlock = document.getElementById(nextBlockId);
              
              if (nextBlock) {
                const nextBlockLeft = (mainLeft + blockWidth - 9 + rightBlock.offsetWidth - 9);
                nextBlock.style.position = 'absolute';
                nextBlock.style.left = nextBlockLeft + 'px';
                nextBlock.style.top = mainTop + 'px';
                
                // בדיקה רקורסיבית לבלוק שלישי
                if (nextBlock.hasAttribute('data-connected-from-right')) {
                  const thirdBlockId = nextBlock.getAttribute('data-connected-from-right');
                  const thirdBlock = document.getElementById(thirdBlockId);
                  
                  if (thirdBlock) {
                    thirdBlock.style.position = 'absolute';
                    thirdBlock.style.left = (nextBlockLeft + nextBlock.offsetWidth - 9) + 'px';
                    thirdBlock.style.top = mainTop + 'px';
                    
                    // בדיקה רקורסיבית לבלוק רביעי
                    if (thirdBlock.hasAttribute('data-connected-from-right')) {
                      const fourthBlockId = thirdBlock.getAttribute('data-connected-from-right');
                      const fourthBlock = document.getElementById(fourthBlockId);
                      
                      if (fourthBlock) {
                        fourthBlock.style.position = 'absolute';
                        fourthBlock.style.left = (nextBlockLeft + nextBlock.offsetWidth - 9 + thirdBlock.offsetWidth - 9) + 'px';
                        fourthBlock.style.top = mainTop + 'px';
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error in group dragging:", err);
      }
    }
    
    // הפעל את הבדיקה בתדירות גבוהה
    setInterval(checkDraggedBlocks, 10);
    
    console.log("Block group dragging active - simplest solution");
  }, 1000); // המתן שנייה אחת לפני האתחול
})();
