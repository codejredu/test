 // ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Horizontal Snap - Center Align - Reduced Logs
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 40;
    const VERTICAL_ALIGNMENT_TOLERANCE = 30;
    const HORIZONTAL_SNAP_OFFSET = 2; // נסה לשנות ערך זה (למשל 0, 5, ...)
    const ENABLE_DETAILED_SNAP_LOGGING = false; // *** כיבוי לוגים מפורטים ***

    // State Variables
    let isDragging = false; let draggedElement = null; let dragGroup = [];
    let potentialSnapTarget = null; let initialMouseX = 0; let initialMouseY = 0;
    let initialElementX = 0; let initialElementY = 0; let programmingArea = null;
    let nextBlockId = 1;

    // ========================================================================
    // Initialization
    // ========================================================================
    function initializeLinkageSystem() {
        console.log("Attempting Linkage Init..."); // לוג מקוצר
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) { console.error("Programming area not found!"); return; }
        const currentPosition = window.getComputedStyle(programmingArea).position;
        if (currentPosition !== 'relative' && currentPosition !== 'absolute' && currentPosition !== 'fixed') {
             console.warn(`Programming area position: ${currentPosition}. Consider 'relative'.`);
        }
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("Linkage System Initialized.");
        prepareExistingBlocks();
    }
    function prepareExistingBlocks() {
        const blocksInArea = programmingArea.querySelectorAll('.block-container');
        blocksInArea.forEach(block => {
            if (!block.id) { block.id = generateUniqueBlockId(); }
             if (!block.style.position || block.style.position === 'static') { block.style.position = 'absolute'; }
        });
        if(blocksInArea.length > 0) console.log(`Prepared ${blocksInArea.length} existing blocks.`);
    }
    function runInitialization() {
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeLinkageSystem); }
        else { initializeLinkageSystem(); }
    }
    runInitialization();

    // ========================================================================
    // Unique ID Generation
    // ========================================================================
    function generateUniqueBlockId() { return `block-${Date.now()}-${nextBlockId++}`; }

    // ========================================================================
    // Event Handlers
    // ========================================================================
    function handleMouseDown(event) {
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) { return; }
        event.preventDefault(); isDragging = true; draggedElement = targetBlock;
        if (!draggedElement.id) { draggedElement.id = generateUniqueBlockId(); }

        const prevBlockId = draggedElement.dataset.prevBlockId;
        if (prevBlockId) { const pb = document.getElementById(prevBlockId); if (pb) delete pb.dataset.nextBlockId; delete draggedElement.dataset.prevBlockId; }
        const leftBlockId = draggedElement.dataset.leftBlockId;
        if (leftBlockId) { const lb = document.getElementById(leftBlockId); if (lb) delete lb.dataset.rightBlockId; delete draggedElement.dataset.leftBlockId; }

        dragGroup = getVerticalBlockGroup(draggedElement); // עדיין אנכי
        initialMouseX = event.clientX; initialMouseY = event.clientY;
        initialElementX = draggedElement.offsetLeft; initialElementY = draggedElement.offsetTop;
        dragGroup.forEach((block, index) => { block.style.zIndex = 1000 + index; block.style.cursor = 'grabbing'; });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag Start: ${draggedElement.id} ---`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        const deltaX = event.clientX - initialMouseX; const deltaY = event.clientY - initialMouseY;
        const newX = initialElementX + deltaX; const newY = initialElementY + deltaY;
        draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`;
        updateVerticalDragGroupPosition(newX, newY); // עדיין אנכי
        findAndHighlightSnapTarget();
    }

    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        const isValidSnapTarget = potentialSnapTarget && programmingArea && programmingArea.contains(potentialSnapTarget);
        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag End: ${draggedElement.id}. Target: ${potentialSnapTarget ? potentialSnapTarget.id : 'None'} ---`);

        if (isValidSnapTarget) {
            linkBlocksHorizontally(potentialSnapTarget, draggedElement);
        } else {
             if (programmingArea && draggedElement) {
                 const areaRect = programmingArea.getBoundingClientRect();
                 const elemRect = draggedElement.getBoundingClientRect();
                 let finalX = draggedElement.offsetLeft; let finalY = draggedElement.offsetTop;
                 finalX = Math.max(0, Math.min(finalX, areaRect.width - elemRect.width));
                 finalY = Math.max(0, Math.min(finalY, areaRect.height - elemRect.height));
                 draggedElement.style.left = `${finalX}px`; draggedElement.style.top = `${finalY}px`;
                 updateVerticalDragGroupPosition(finalX, finalY); // עדיין אנכי
             }
        }
        clearSnapHighlighting();
        dragGroup.forEach(block => { if (block) { block.style.zIndex = ''; block.style.cursor = ''; } });
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        isDragging = false; draggedElement = null; dragGroup = []; potentialSnapTarget = null;
    }

    function handleMouseLeave(event) { if (isDragging) { handleMouseUp(event); } }

    // ========================================================================
    // Drag Group Management (Vertical Only)
    // ========================================================================
    function getVerticalBlockGroup(startBlock) { /* ... קוד זהה ... */
         const group = [startBlock]; let currentBlock = startBlock;
         while (currentBlock && currentBlock.dataset.nextBlockId) { const nextId = currentBlock.dataset.nextBlockId; const nextBlock = document.getElementById(nextId); if (nextBlock && programmingArea && programmingArea.contains(nextBlock)) { group.push(nextBlock); currentBlock = nextBlock; } else { if (nextId) { delete currentBlock.dataset.nextBlockId; } break; } } return group;
    }
    function updateVerticalDragGroupPosition(leaderX, leaderY) { /* ... קוד זהה ... */
         if (dragGroup.length <= 1) return; let currentTop = leaderY; let currentLeft = leaderX; for (let i = 0; i < dragGroup.length; i++) { const block = dragGroup[i]; if (!block) continue; const blockHeight = block.offsetHeight; if (i === 0) { currentTop += blockHeight - VERTICAL_SNAP_OFFSET; } else { block.style.left = `${currentLeft}px`; block.style.top = `${currentTop}px`; currentTop += blockHeight - VERTICAL_SNAP_OFFSET; } }
    }

    // ========================================================================
    // Snapping Logic (Horizontal - Highlight Dragged Only)
    // ========================================================================
    function findAndHighlightSnapTarget() {
        const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement;
        // if (shouldLog) console.log(`--- find H Snap (${draggedElement.id}) ---`); // לוג מקוצר יותר

        clearSnapHighlighting(); potentialSnapTarget = null;
        if (!isDragging || !draggedElement || !programmingArea) return;

        const dragRect = draggedElement.getBoundingClientRect();
        if (dragRect.height <= 0 || dragRect.width <= 0) return; // יציאה שקטה

        const dragLeftConnector = { x: dragRect.left, y: dragRect.top + dragRect.height / 2 };
        let closestDistance = HORIZONTAL_SNAP_DISTANCE; let bestTarget = null;
        const allBlocks = programmingArea.querySelectorAll('.block-container');

        allBlocks.forEach(block => {
            if (dragGroup.includes(block) || block.dataset.rightBlockId) return;
            const targetRect = block.getBoundingClientRect();
            if (targetRect.height <= 0 || targetRect.width <= 0) return;
            const targetRightConnector = { x: targetRect.right - HORIZONTAL_SNAP_OFFSET, y: targetRect.top + targetRect.height / 2 };
            const dx = dragLeftConnector.x - targetRightConnector.x; const dy = dragLeftConnector.y - targetRightConnector.y;
            const horizontalDistance = Math.abs(dx); const verticalDistance = Math.abs(dy);

            if (horizontalDistance < closestDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) {
                // if (shouldLog) console.log(` ==> H Match: ${block.id || 'no-id'} (H:${horizontalDistance.toFixed(0)}, V:${verticalDistance.toFixed(0)})`);
                closestDistance = horizontalDistance; bestTarget = block;
            }
        });

        if (bestTarget) {
            potentialSnapTarget = bestTarget; highlightSnapTarget(draggedElement, true);
            // if (shouldLog) console.log(`--- Best H target: ${bestTarget.id}. Highlighting dragged ONLY. ---`);
        } else { highlightSnapTarget(draggedElement, false); /* if (shouldLog) console.log(`--- No H target found. ---`); */ }
    }

    function highlightSnapTarget(block, shouldHighlight) {
         if (block) { try { if (shouldHighlight) { block.classList.add('snap-highlight'); } else { block.classList.remove('snap-highlight'); } } catch (e) { console.error("Highlight error", e); } }
    }
     function clearSnapHighlighting() {
         if (!programmingArea) return;
         const highlighted = programmingArea.querySelectorAll('.snap-highlight');
         highlighted.forEach(el => { try { el.classList.remove('snap-highlight'); } catch(e) { /* ignore */ } });
     }

    // ========================================================================
    // Linking Logic (Horizontal - *** Center Align Y ***)
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        if (leftBlock.dataset.rightBlockId || rightBlock.dataset.leftBlockId) return; // בדיקה כפולה

        leftBlock.dataset.rightBlockId = rightBlock.id; rightBlock.dataset.leftBlockId = leftBlock.id;

        // חישוב רוחב וגובה
        const leftWidth = leftBlock.offsetWidth;
        const leftHeight = leftBlock.offsetHeight;
        const rightHeight = rightBlock.offsetHeight; // גובה הבלוק הנגרר

        // חישוב מיקום X (קצה שמאלי של המטרה + רוחב המטרה - היסט)
        const targetX = leftBlock.offsetLeft + leftWidth - HORIZONTAL_SNAP_OFFSET;

        // *** חישוב מיקום Y (יישור למרכז האנכי של המטרה) ***
        const targetY = (leftBlock.offsetTop + leftHeight / 2) - (rightHeight / 2);

        rightBlock.style.left = `${targetX}px`; rightBlock.style.top = `${targetY}px`;

        // updateHorizontalDragGroupPosition(targetX, targetY); // עדיין לא ממומש
        console.log(`Linked HORIZONTALLY ${leftBlock.id} -> ${rightBlock.id} at pos (${targetX.toFixed(0)}, ${targetY.toFixed(0)}) (Center Y Aligned)`);
    }

    // ========================================================================
    // Public API
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement) {
         // if (ENABLE_DETAILED_SNAP_LOGGING) console.log("Registering...", newBlockElement); // לוגים מופחתים
         if (!newBlockElement) return;
         if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); }
         try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("Reg Error", e); }
         // if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Registered block ${newBlockElement.id}.`);
    };

})();
console.log("linkageimproved.js script finished execution (Horizontal Snap - Center Align - Reduced Logs).");
