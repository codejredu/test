/**
 * blockGroupDragging.js - גרסת דיבוג עם לוג
 * פתרון בסיסי עם הדפסות לוג מפורטות
 */

// פתרון עם לוג מפורט לבדיקת הבעיה
(function() {
  console.log("DEBUG VERSION - Loading block group dragging...");
  
  // המתן לטעינת ה-DOM
  setTimeout(function() {
    // וודא שרץ רק פעם אחת
    if (window.blockGroupDraggingDebug) return;
    window.blockGroupDraggingDebug = true;
    
    console.log("DEBUG - Group dragging activated");
    console.log("DEBUG - Checking for programming area:", document.getElementById('program-blocks') ? "Found" : "Not Found");
    
    // פונקציית בדיקת בלוקים בגרירה
    function checkForDraggedBlocks() {
      // בדוק אם יש בלוק בגרירה
      const draggedBlock = document.querySelector('#program-blocks .block-container.snap-source');
      
      // אם יש בלוק בגרירה
      if (draggedBlock) {
        console.log("DEBUG - Found dragged block:", draggedBlock.id);
        
        // בדוק אם יש בלוק מחובר מימין
        if (draggedBlock.hasAttribute('data-connected-from-right')) {
          const rightBlockId = draggedBlock.getAttribute('data-connected-from-right');
          console.log("DEBUG - Block has connection to the right:", rightBlockId);
          
          const rightBlock = document.getElementById(rightBlockId);
          if (rightBlock) {
            console.log("DEBUG - Right block found");
            
            // חשב מיקום חדש לבלוק הימני
            const mainLeft = parseFloat(draggedBlock.style.left) || 0;
            const mainTop = parseFloat(draggedBlock.style.top) || 0;
            const blockWidth = draggedBlock.offsetWidth || 80;
            
            console.log("DEBUG - Main block position:", mainLeft, mainTop);
            console.log("DEBUG - Main block width:", blockWidth);
            
            // נסה לעדכן את הבלוק הימני
            try {
              // עדכן את המיקום של הבלוק הימני
              const newLeft = (mainLeft + blockWidth - 9);
              console.log("DEBUG - Setting right block to:", newLeft, mainTop);
              
              rightBlock.style.position = 'absolute';
              rightBlock.style.left = newLeft + 'px';
              rightBlock.style.top = mainTop + 'px';
              
              console.log("DEBUG - Right block updated");
            } catch (err) {
              console.error("DEBUG - Error updating right block:", err);
            }
          } else {
            console.log("DEBUG - Right block not found in DOM");
          }
        } else {
          console.log("DEBUG - Block has no right connections");
        }
      }
    }
    
    // הפעל בדיקה כל 50 מילישניות
    const intervalId = setInterval(checkForDraggedBlocks, 50);
    
    console.log("DEBUG - Checking interval started with ID:", intervalId);
    
    // גם נבצע בדיקה מיידית אחת
    checkForDraggedBlocks();
  }, 2000); // המתן שתי שניות לוודא שהכל נטען
})();
