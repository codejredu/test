/**
 * blockGroupDragging.js - גרסת דיבוג משופרת עם ניסיון לגרירת שרשרת בלוקים
 */

(function() {
  console.log("DEBUG VERSION - Loading block group dragging (attempting chain drag)...");

  document.addEventListener('DOMContentLoaded', function() {
    if (window.blockGroupDraggingDebug) return;
    window.blockGroupDraggingDebug = true;

    console.log("DEBUG - Group dragging activated");
    console.log("DEBUG - Checking for programming area:", document.getElementById('program-blocks') ? "Found" : "Not Found");

    const programBlocks = document.getElementById('program-blocks');
    if (!programBlocks) {
      console.error("DEBUG - Programming area element with ID 'program-blocks' not found.");
      return;
    }

    function checkForDraggedBlocks() {
      const draggedBlock = programBlocks.querySelector('.block-container.snap-source');

      if (draggedBlock) {
        let currentBlock = draggedBlock;
        while (currentBlock && currentBlock.hasAttribute('data-connected-from-right')) {
          const rightBlockId = currentBlock.getAttribute('data-connected-from-right');
          const rightBlock = document.getElementById(rightBlockId);
          if (rightBlock) {
            ensureAbsolutePosition(rightBlock);
            updateRightBlockPosition(currentBlock, rightBlock);
            currentBlock = rightBlock; // עבור לבלוק הבא בשרשרת
          } else {
            console.log("DEBUG - Right block with ID", rightBlockId, "not found in DOM (in chain)");
            break;
          }
        }
      }
    }

    function ensureAbsolutePosition(block) {
      if (getComputedStyle(block).position !== 'absolute' && getComputedStyle(block).position !== 'fixed') {
        block.style.position = 'absolute';
        console.log("DEBUG - Set block", block.id, "position to absolute.");
      }
    }

    function updateRightBlockPosition(mainBlock, rightBlock) {
      const mainLeft = parseFloat(mainBlock.style.left) || 0;
      const mainTop = parseFloat(mainBlock.style.top) || 0;
      const blockWidth = mainBlock.offsetWidth || 80;
      const spacing = 10;

      console.log("DEBUG - Main block position (left, top):", mainLeft, mainTop);
      console.log("DEBUG - Main block width:", blockWidth);

      try {
        const newLeft = (mainLeft + blockWidth + spacing);
        console.log("DEBUG - Setting right block", rightBlock.id, "to (left, top):", newLeft, mainTop);

        rightBlock.style.left = newLeft + 'px';
        rightBlock.style.top = mainTop + 'px';

        console.log("DEBUG - Right block", rightBlock.id, "updated");
      } catch (err) {
        console.error("DEBUG - Error updating right block", rightBlock.id, ":", err);
      }
    }

    // הפעל בדיקה כל 50 מילישניות
    const intervalId = setInterval(checkForDraggedBlocks, 50);
    console.log("DEBUG - Checking interval started with ID:", intervalId);

    // גם נבצע בדיקה מיידית אחת
    checkForDraggedBlocks();
  });
})();
