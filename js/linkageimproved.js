 // ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Horizontal Snap Detection (Highlight Dragged Only)
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 40; // טווח הצמדה אופקי
    const VERTICAL_ALIGNMENT_TOLERANCE = 30; // כמה מותר הפרש גובה בין מרכזי הבלוקים
    const HORIZONTAL_SNAP_OFFSET = 2; // היסט קל בעת ההצמדה האופקית (למראה טוב יותר)
    const ENABLE_DETAILED_SNAP_LOGGING = true; // השאר לוגים פעילים

    // State Variables
    let isDragging = false;
    let draggedElement = null;
    let dragGroup = [];
    let potentialSnapTarget = null;
    let initialMouseX = 0;
    let initialMouseY = 0;
    let initialElementX = 0;
    let initialElementY = 0;
    let programmingArea = null;
    let nextBlockId = 1;

    // ========================================================================
    // Initialization
    // ========================================================================
    function initializeLinkageSystem() {
        console.log("Attempting to initialize Linkage System...");
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("Linkage System Error: Programming area 'program-blocks' not found. Cannot initialize.");
            return;
        }
        const currentPosition = window.getComputedStyle(programmingArea).position;
        if (currentPosition !== 'relative' && currentPosition !== 'absolute' && currentPosition !== 'fixed') {
            console.warn(`Programming area (#program-blocks) has position: ${currentPosition}. Consider setting it to 'relative'.`);
        }
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("Mousedown listener attached to #program-blocks.");
        console.log("Linkage System Initialized for #program-blocks");
        prepareExistingBlocks();
    }
    function prepareExistingBlocks() {
        const blocksInArea = programmingArea.querySelectorAll('.block-container');
        blocksInArea.forEach(block => {
            if (!block.id) { block.id = generateUniqueBlockId(); }
             if (!block.style.position || block.style.position === 'static') {
                 block.style.position = 'absolute';
             }
        });
         console.log(`Prepared ${blocksInArea.length} existing blocks.`);
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
        console.log(`>>> handleMouseDown triggered! Target:`, event.target);
        const targetBlock = event.target.closest('.block-container');
        console.log(`   Closest block-container found:`, targetBlock);
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) {
             console.log(`   MouseDown ignored: Not on a valid block.`); return;
        }
        event.preventDefault();
        isDragging = true;
        draggedElement = targetBlock;
        console.log(`   Set isDragging=true, draggedElement=`, draggedElement);
        if (!draggedElement.id) {
            draggedElement.id = generateUniqueBlockId();
            console.log(`   Assigned new ID during mousedown: ${draggedElement.id}`);
        }

        const prevBlockId = draggedElement.dataset.prevBlockId;
        if (prevBlockId) {
            const prevBlock = document.getElementById(prevBlockId);
            if (prevBlock) delete prevBlock.dataset.nextBlockId;
            delete draggedElement.dataset.prevBlockId;
            console.log(`   Detached Vertically ${draggedElement.id} from ${prevBlockId}`);
        }
        const leftBlockId = draggedElement.dataset.leftBlockId;
        if (leftBlockId) {
            const leftBlock = document.getElementById(leftBlockId);
            if (leftBlock) delete leftBlock.dataset.rightBlockId;
            delete draggedElement.dataset.leftBlockId;
             console.log(`   Detached Horizontally ${draggedElement.id} from ${leftBlockId}`);
        }

        dragGroup = getVerticalBlockGroup(draggedElement); // עדיין משתמש בשרשור אנכי לקבוצה
        console.log(`   Calculated drag group (size ${dragGroup.length}) - Currently Vertical Only:`, dragGroup);

        initialMouseX = event.clientX; initialMouseY = event.clientY;
        initialElementX = draggedElement.offsetLeft; initialElementY = draggedElement.offsetTop;
        dragGroup.forEach((block, index) => { block.style.zIndex = 1000 + index; block.style.cursor = 'grabbing'; });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag Start: ${draggedElement.id} ---`);
        console.log(`>>> handleMouseDown finished processing.`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        const currentMouseX = event.clientX; const currentMouseY = event.clientY;
        const deltaX = currentMouseX - initialMouseX; const deltaY = currentMouseY - initialMouseY;
        const newX = initialElementX + deltaX; const newY = initialElementY + deltaY;
        draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`;
        updateVerticalDragGroupPosition(newX, newY); // עדיין משתמש בשרשור אנכי לקבוצה
        findAndHighlightSnapTarget();
    }

    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        const isValidSnapTarget = potentialSnapTarget && programmingArea && programmingArea.contains(potentialSnapTarget);
        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag End: ${draggedElement.id}. Potential target: ${potentialSnapTarget ? potentialSnapTarget.id : 'None'} ---`);

        if (isValidSnapTarget) {
             if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Attempting to link HORIZONTALLY ${potentialSnapTarget.id} (left) -> ${draggedElement.id} (right)`);
            linkBlocksHorizontally(potentialSnapTarget, draggedElement);
        } else {
             if (programmingArea && draggedElement) {
                 const areaRect = programmingArea.getBoundingClientRect();
                 const elemRect = draggedElement.getBoundingClientRect();
                 let finalX = draggedElement.offsetLeft; let finalY = draggedElement.offsetTop;
                 finalX = Math.max(0, Math.min(finalX, areaRect.width - elemRect.width));
                 finalY = Math.max(0, Math.min(finalY, areaRect.height - elemRect.height));
                 draggedElement.style.left = `${finalX}px`; draggedElement.style.top = `${finalY}px`;
                 updateVerticalDragGroupPosition(finalX, finalY); // עדיין משתמש בשרשור אנכי לקבוצה
                  if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Placed block ${draggedElement.id} at ${finalX}, ${finalY} (no snap)`);
             }
        }

        clearSnapHighlighting(); // תמיד מנקה הדגשות בסוף
        dragGroup.forEach(block => { if (block) { block.style.zIndex = ''; block.style.cursor = ''; } });
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        isDragging = false; draggedElement = null; dragGroup = []; potentialSnapTarget = null;
    }

    function handleMouseLeave(event) {
         if (isDragging) { console.warn("Mouse left window during drag..."); handleMouseUp(event); }
    }

    // ========================================================================
    // Drag Group Management (שמות שונו לאנכי)
    // ========================================================================
    function getVerticalBlockGroup(startBlock) { // שם שונה
        const group = [startBlock]; let currentBlock = startBlock;
        while (currentBlock && currentBlock.dataset.nextBlockId) {
            const nextId = currentBlock.dataset.nextBlockId;
            const nextBlock = document.getElementById(nextId);
            if (nextBlock && programmingArea && programmingArea.contains(nextBlock)) {
                group.push(nextBlock); currentBlock = nextBlock;
            } else { if (nextId) { console.warn(`Broken V-link...`); delete currentBlock.dataset.nextBlockId; } break; }
        }
        return group;
    }
    function updateVerticalDragGroupPosition(leaderX, leaderY) { // שם שונה
        if (dragGroup.length <= 1) return;
        let currentTop = leaderY; let currentLeft = leaderX;
        for (let i = 0; i < dragGroup.length; i++) {
            const block = dragGroup[i]; if (!block) continue;
            const blockHeight = block.offsetHeight;
             if (i === 0) { currentTop += blockHeight - VERTICAL_SNAP_OFFSET; }
             else { block.style.left = `${currentLeft}px`; block.style.top = `${currentTop}px`; currentTop += blockHeight - VERTICAL_SNAP_OFFSET; }
        }
    }

    // ========================================================================
    // Snapping Logic ( *** Horizontal - Highlight Dragged Only *** )
    // ========================================================================
    function findAndHighlightSnapTarget() {
        const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement;
        if (shouldLog) console.log(`--- findAndHighlightSnapTarget HORIZONTAL (${draggedElement.id}) ---`);

        clearSnapHighlighting(); // מנקה הדגשות קודמות משני הבלוקים
        potentialSnapTarget = null;

        if (!isDragging || !draggedElement || !programmingArea) return;

        const dragRect = draggedElement.getBoundingClientRect();
        if (shouldLog) console.log(`Dragged (${draggedElement.id}): Rect T:${dragRect.top.toFixed(0)} L:${dragRect.left.toFixed(0)} W:${dragRect.width.toFixed(0)} H:${dragRect.height.toFixed(0)}`);
        if (dragRect.height <= 0 || dragRect.width <= 0) {
             if (shouldLog) console.warn(`Dragged block ${draggedElement.id} has invalid dimensions!`);
             return;
        }

        const dragLeftConnector = {
            x: dragRect.left,
            y: dragRect.top + dragRect.height / 2
        };
        if (shouldLog) console.log(`Dragged Left Connector: X:${dragLeftConnector.x.toFixed(0)} Y:${dragLeftConnector.y.toFixed(0)}`);

        let closestDistance = HORIZONTAL_SNAP_DISTANCE;
        let bestTarget = null;

        const allBlocks = programmingArea.querySelectorAll('.block-container');
        if (shouldLog) console.log(`Checking against ${allBlocks.length} blocks. HORIZONTAL_SNAP_DISTANCE = ${HORIZONTAL_SNAP_DISTANCE}, VERTICAL_ALIGNMENT_TOLERANCE = ${VERTICAL_ALIGNMENT_TOLERANCE}`);

        allBlocks.forEach(block => {
            const targetId = block.id || 'no-id';
            if (shouldLog) console.log(`\nChecking target: ${targetId}`);

            if (dragGroup.includes(block)) { if (shouldLog) console.log(` -> Skip ${targetId}: Part of drag group.`); return; }
            if (block.dataset.rightBlockId) { if (shouldLog) console.log(` -> Skip ${targetId}: Already has rightBlockId.`); return; }

            const targetRect = block.getBoundingClientRect();
            if (targetRect.height <= 0 || targetRect.width <= 0) { if (shouldLog) console.warn(`Target block ${targetId} invalid dims.`); return; }
            if (shouldLog) console.log(` -> Target (${targetId}): Rect T:${targetRect.top.toFixed(0)} L:${targetRect.left.toFixed(0)} R:${targetRect.right.toFixed(0)} W:${targetRect.width.toFixed(0)} H:${targetRect.height.toFixed(0)}`);

            const targetRightConnector = {
                x: targetRect.right - HORIZONTAL_SNAP_OFFSET,
                y: targetRect.top + targetRect.height / 2
            };
             if (shouldLog) console.log(` -> Target Right Connector: X:${targetRightConnector.x.toFixed(0)} Y:${targetRightConnector.y.toFixed(0)}`);

            const dx = dragLeftConnector.x - targetRightConnector.x;
            const dy = dragLeftConnector.y - targetRightConnector.y;
            const horizontalDistance = Math.abs(dx);
            const verticalDistance = Math.abs(dy);

            if (shouldLog) console.log(` -> Horiz Dist: ${horizontalDistance.toFixed(1)} (Need < ${closestDistance}). Vert Dist: ${verticalDistance.toFixed(1)} (Need < ${VERTICAL_ALIGNMENT_TOLERANCE})`);

            if (horizontalDistance < closestDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) {
                 if (shouldLog) console.log(` ==> Potential Match Found (Horizontal + Vertical): ${targetId} is close enough.`);
                closestDistance = horizontalDistance;
                bestTarget = block;
            } else {
                 if (shouldLog) console.log(` -> No Match: Horizontal or Vertical failed.`);
            }
        }); // End forEach block

        // *** השינוי כאן - הדגשת הנגרר בלבד ***
        if (bestTarget) {
            potentialSnapTarget = bestTarget;
            // highlightSnapTarget(potentialSnapTarget, true); // לא מדגישים את המטרה
            highlightSnapTarget(draggedElement, true);      // מדגישים רק את הבלוק הנגרר
             if (shouldLog) console.log(`--- Best target found (horizontally): ${bestTarget.id}. Highlighting dragged element ONLY. ---`);
        } else {
             // אם לא נמצא יעד, נוודא שגם הבלוק הנגרר לא מודגש
             highlightSnapTarget(draggedElement, false);
            if (shouldLog) console.log(`--- No suitable target found (horizontally). Clearing highlights. ---`);
        }
    } // End findAndHighlightSnapTarget

    function highlightSnapTarget(block, shouldHighlight) {
         if (block) {
             try {
                 if (shouldHighlight) { block.classList.add('snap-highlight'); }
                 else { block.classList.remove('snap-highlight'); }
             } catch (e) { console.error("Error applying/removing highlight class:", e, block); }
         }
    }

     function clearSnapHighlighting() {
         if (!programmingArea) return;
         // *** שינוי: נמצא את *כל* הבלוקים המודגשים וננקה אותם ***
         // זה חשוב כי יכול להיות שהבלוק שהיה מודגש כבר לא נגרר
         const highlighted = programmingArea.querySelectorAll('.snap-highlight');
         highlighted.forEach(el => {
             try { el.classList.remove('snap-highlight'); }
             catch(e) { console.error("Error removing highlight class:", e, el); }
         });
     }

    // ========================================================================
    // Linking Logic (Horizontal)
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;

        if (leftBlock.dataset.rightBlockId) { console.warn(`Link H-aborted: Target ${leftBlock.id} already has right block`); return; }
        if (rightBlock.dataset.leftBlockId) { console.warn(`Link H-aborted: Source ${rightBlock.id} already has left block`); return; }

        leftBlock.dataset.rightBlockId = rightBlock.id;
        rightBlock.dataset.leftBlockId = leftBlock.id;

        const leftRect = leftBlock.getBoundingClientRect();
        const targetX = leftBlock.offsetLeft + leftBlock.offsetWidth - HORIZONTAL_SNAP_OFFSET;
        const targetY = leftBlock.offsetTop;

        rightBlock.style.left = `${targetX}px`;
        rightBlock.style.top = `${targetY}px`;

        // updateHorizontalDragGroupPosition(targetX, targetY); // עדיין לא ממומש

        console.log(`Linked HORIZONTALLY ${leftBlock.id} -> ${rightBlock.id} at pos (${targetX}, ${targetY})`);
    }

    // ========================================================================
    // Public API
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement) {
         if (ENABLE_DETAILED_SNAP_LOGGING) console.log("Executing registerNewBlockForLinkage...", newBlockElement);
         if (!newBlockElement) { console.error("registerNewBlockForLinkage called with null"); return; }
         if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Assigned new ID...`); }
         try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("!!! CRITICAL ERROR...", e, newBlockElement); }
          if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Successfully registered block ${newBlockElement.id} for linkage.`);
    };


})(); // IIFE to encapsulate scope
console.log("linkageimproved.js script finished execution (Horizontal Snap - Highlight Dragged Only).");
