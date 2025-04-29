/**
 * blockGroupDragging.js - גרסת דיבוג משופרת עם טיפול בבעיות גרירה
 */

(function() {
  console.log("DEBUG VERSION - Loading block group dragging (improved)...");

  document.addEventListener('DOMContentLoaded', function() {
    if (window.blockGroupDraggingDebug) return;
    window.blockGroupDraggingDebug = true;

    console.log("DEBUG - Group dragging activated");
    console.log("DEBUG - Checking for programming area:", document.getElementById('program-blocks') ? "Found" : "Not Found");

    const programBlocks = document.getElementById('program-blocks');
    if (!programBlocks) {
      console.error("DEBUG - Programming area element with ID 'program-blocks' not found. Group dragging will not work.");
      return;
    }

    function checkForDraggedBlocks() {
      const draggedBlock = programBlocks.querySelector('.block-container.snap-source');

      if (draggedBlock) {
        console.log("DEBUG - Found dragged block:", draggedBlock.id, "Classes:", draggedBlock.className);

        if (draggedBlock.hasAttribute('data-connected-from-right')) {
          const rightBlockId = draggedBlock.getAttribute('data-connected-from-right');
          console.log("DEBUG - Block has connection to the right:", rightBlockId);

          const rightBlock = document.getElementById(rightBlockId);
          if (rightBlock) {
            console.log("DEBUG - Right block found, ID:", rightBlock.id);

            // ודא שהבלוק המחובר מוגדר עם מיקום אבסולוטי
            if (getComputedStyle(rightBlock).position !== 'absolute' && getComputedStyle(rightBlock).position !== 'fixed') {
              rightBlock.style.position = 'absolute';
              console.log("DEBUG - Set right block position to absolute.");
            }

            const mainLeft = parseFloat(draggedBlock.style.left) || 0;
            const mainTop = parseFloat(draggedBlock.style.top) || 0;
            const blockWidth = draggedBlock.offsetWidth || 80;
            const spacing = 10; // מרחק רצוי בין הבלוקים

            console.log("DEBUG - Main block position (left, top):", mainLeft, mainTop);
            console.log("DEBUG - Main block width:", blockWidth);

            try {
              const newLeft = (mainLeft + blockWidth + spacing);
              console.log("DEBUG - Setting right block to (left, top):", newLeft, mainTop);

              rightBlock.style.left = newLeft + 'px';
              rightBlock.style.top = mainTop + 'px';

              console.log("DEBUG - Right block updated");
            } catch (err) {
              console.error("DEBUG - Error updating right block:", err);
            }
          } else {
            console.log("DEBUG - Right block with ID", rightBlockId, "not found in DOM");
          }
        } else {
          console.log("DEBUG - Dragged block has no 'data-connected-from-right' attribute.");
        }
      }
    }

    // הפעל בדיקה כל 50 מילישניות
    const intervalId = setInterval(checkForDraggedBlocks, 50);
    console.log("DEBUG - Checking interval started with ID:", intervalId);

    // גם נבצע בדיקה מיידית אחת
    checkForDraggedBlocks();
  });
})();
