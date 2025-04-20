// ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Vertical Distance Snapping Check Only (Syntax Corrected)
// ========================================================================

(function() {
    // Configuration
    const SNAP_DISTANCE = 80; // טווח הצמדה (מתייחס עכשיו בעיקר למרחק אנכי)
    const VERTICAL_SNAP_OFFSET = 5;
    const CONNECTOR_OFFSET_X_PERCENT = 0;
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
            console.warn(`Programming area (#program-blocks) has position: ${currentPosition}. Consider setting it to 'relative' for consistent child positioning.`);
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
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeLinkageSystem);
        } else { initializeLinkageSystem(); }
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
            console.log(`   MouseDown ignored: Not on a valid block inside programming area.`); return;
        }
        event.preventDefault();
        console.log(`   Prevented default behavior.`);
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
            console.log(`   Detached ${draggedElement.id} from ${prevBlockId}`);
        } else { console.log(`   Block ${draggedElement.id} has no previous block to detach from.`); }
        dragGroup = getBlockGroup(draggedElement);
        console.log(`   Calculated drag group (size ${dragGroup.length}):`, dragGroup);
        initialMouseX = event.clientX;
        initialMouseY = event.clientY;
        initialElementX = draggedElement.offsetLeft;
        initialElementY = draggedElement.offsetTop;
        console.log(`   Recorded initial positions: Mouse(${initialMouseX},${initialMouseY}), Element(${initialElementX},${initialElementY})`);
        dragGroup.forEach((block, index) => { block.style.zIndex = 1000 + index; block.style.cursor = 'grabbing'; });
        console.log(`   Set z-index and cursor for drag group.`);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
        console.log(`   Added mousemove, mouseup, mouseleave listeners to document.`);
        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag Start: ${draggedElement.id} ---`);
        console.log(`>>> handleMouseDown finished processing.`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        const currentMouseX = event.clientX;
        const currentMouseY = event.clientY;
        const deltaX = currentMouseX - initialMouseX;
        const deltaY = currentMouseY - initialMouseY;
        const newX = initialElementX + deltaX;
        const newY = initialElementY + deltaY;
        draggedElement.style.left = `${newX}px`;
        draggedElement.style.top = `${newY}px`;
        updateDragGroupPosition(newX, newY);
        findAndHighlightSnapTarget();
    }

    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        const isValidSnapTarget = potentialSnapTarget && programmingArea && programmingArea.contains(potentialSnapTarget);
        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag End: ${draggedElement.id}. Potential target: ${potentialSnapTarget ? potentialSnapTarget.id : 'None'} ---`);
        if (isValidSnapTarget) {
            if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Attempting to link ${potentialSnapTarget.id} -> ${draggedElement.id}`);
            linkBlocks(potentialSnapTarget, draggedElement);
        } else {
             if (programmingArea && draggedElement) {
                 const areaRect = programmingArea.getBoundingClientRect();
                 const elemRect = draggedElement.getBoundingClientRect();
                 let finalX = draggedElement.offsetLeft;
                 let finalY = draggedElement.offsetTop;
                 finalX = Math.max(0, Math.min(finalX, areaRect.width - elemRect.width));
                 finalY = Math.max(0, Math.min(finalY, areaRect.height - elemRect.height));
                 draggedElement.style.left = `${finalX}px`;
                 draggedElement.style.top = `${finalY}px`;
                 updateDragGroupPosition(finalX, finalY);
                  if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Placed block ${draggedElement.id} at ${finalX}, ${finalY} (no snap)`);
             }
        }
        clearSnapHighlighting();
        dragGroup.forEach(block => {
            if (block) { block.style.zIndex = ''; block.style.cursor = ''; }
        });
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        isDragging = false;
        draggedElement = null;
        dragGroup = [];
        potentialSnapTarget = null;
    }

    function handleMouseLeave(event) {
         if (isDragging) { console.warn("Mouse left window during drag, cancelling drag and snap."); handleMouseUp(event); }
    }

    // ========================================================================
    // Drag Group Management
    // ========================================================================
    function getBlockGroup(startBlock) {
        const group = [startBlock];
        let currentBlock = startBlock;
        while (currentBlock && currentBlock.dataset.nextBlockId) {
            const nextId = currentBlock.dataset.nextBlockId;
            const nextBlock = document.getElementById(nextId);
            if (nextBlock && programmingArea && programmingArea.contains(nextBlock)) {
                group.push(nextBlock); currentBlock = nextBlock;
            } else {
                if (nextId) { console.warn(`Broken link detected...`); delete currentBlock.dataset.nextBlockId; }
                break;
            }
        }
        return group;
    }

    function updateDragGroupPosition(leaderX, leaderY) {
        if (dragGroup.length <= 1) return;
        let currentTop = leaderY;
        let currentLeft = leaderX;
        for (let i = 0; i < dragGroup.length; i++) {
            const block = dragGroup[i];
            if (!block) continue;
            const blockHeight = block.offsetHeight;
             if (i === 0) { currentTop += blockHeight - VERTICAL_SNAP_OFFSET; }
             else { block.style.left = `${currentLeft}px`; block.style.top = `${currentTop}px`; currentTop += blockHeight - VERTICAL_SNAP_OFFSET; }
        }
    }

    // ========================================================================
    // Snapping Logic (Vertical Distance Only - Syntax Corrected)
    // ========================================================================
    function findAndHighlightSnapTarget() {
        const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement;
        if (shouldLog) console.log(`--- findAndHighlightSnapTarget (${draggedElement.id}) ---`);

        clearSnapHighlighting();
        potentialSnapTarget = null;

        if (!isDragging || !draggedElement || !programmingArea) return;

        const dragRect = draggedElement.getBoundingClientRect();
        if (shouldLog) console.log(`Dragged (${draggedElement.id}): Rect T:${dragRect.top.toFixed(0)} L:${dragRect.left.toFixed(0)} W:${dragRect.width.toFixed(0)} H:${dragRect.height.toFixed(0)}`);
        if (dragRect.height <= 0 && shouldLog) console.warn(`Dragged block ${draggedElement.id} has height <= 0!`);

        const dragTopConnector = {
            x: dragRect.left + dragRect.width / 2 + (dragRect.width * CONNECTOR_OFFSET_X_PERCENT / 200),
            y: dragRect.top
        };
        if (shouldLog) console.log(`Dragged Top Connector: Y:${dragTopConnector.y.toFixed(0)}`);

        let closestDistance = SNAP_DISTANCE;
        let bestTarget = null;

        const allBlocks = programmingArea.querySelectorAll('.block-container');
        if (shouldLog) console.log(`Checking against ${allBlocks.length} blocks. Vertical SNAP_DISTANCE = ${SNAP_DISTANCE}`);

        allBlocks.forEach(block => {
            const targetId = block.id || 'no-id';
            if (shouldLog) console.log(`\nChecking target: ${targetId}`);

            if (dragGroup.includes(block)) {
                if (shouldLog) console.log(` -> Skip ${targetId}: Part of drag group.`); return;
            }
            if (block.dataset.nextBlockId) {
                if (shouldLog) console.log(` -> Skip ${targetId}: Already has nextBlockId (${block.dataset.nextBlockId}).`); return;
            }

            const targetRect = block.getBoundingClientRect();
            // ** שורה 269 המתוקנת - וידאתי שכל הסוגריים והתווים במקומם **
            if (shouldLog) console.log(` -> Target (${targetId}): Rect T:${targetRect.top.toFixed(0)} L:${targetRect.left.toFixed(0)} W:${targetRect.width.toFixed(0)} H:${targetRect.height.toFixed(0)}`);
            if (targetRect.height <= 0 && shouldLog) console.warn(`Target block ${targetId} has height <= 0!`);

            const targetBottomConnector = {
                y: targetRect.bottom - VERTICAL_SNAP_OFFSET
            };
             if (shouldLog) console.log(` -> Target Bottom Connector: Y:${targetBottomConnector.y.toFixed(0)}`);

            const dy = dragTopConnector.y - targetBottomConnector.y;
            const verticalDistance = Math.abs(dy);
            if (shouldLog) console.log(` -> Vertical Distance: ${verticalDistance.toFixed(1)} (Need < ${closestDistance})`);

            if (verticalDistance < closestDistance) {
                 if (shouldLog) console.log(` ==> Potential Match Found (Vertical Distance Only): ${targetId} is close enough vertically (${verticalDistance.toFixed(1)}).`);
                closestDistance = verticalDistance;
                bestTarget = block;
            } else {
                 if (shouldLog) console.log(` -> No Match: Vertical Distance (${verticalDistance.toFixed(1)}) is too large.`);
            }
        }); // End forEach block

        if (bestTarget) {
            potentialSnapTarget = bestTarget;
            highlightSnapTarget(potentialSnapTarget, true);
            highlightSnapTarget(draggedElement, true);
             if (shouldLog) console.log(`--- Best target found (vertically): ${bestTarget.id} ---`);
        } else {
            if (shouldLog) console.log(`--- No suitable target found (vertically) ---`);
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
         const highlighted = programmingArea.querySelectorAll('.snap-highlight');
         highlighted.forEach(el => {
             try { el.classList.remove('snap-highlight'); }
             catch(e) { console.error("Error removing highlight class:", e, el); }
         });
     }

    // ========================================================================
    // Linking Logic
    // ========================================================================
    function linkBlocks(topBlock, bottomBlock) {
        if (!topBlock || !bottomBlock || topBlock === bottomBlock || !programmingArea) return;
        if (topBlock.dataset.nextBlockId) { console.warn(`Link aborted...`); return; }
        if (bottomBlock.dataset.prevBlockId) { console.warn(`Link aborted...`); return; }
        topBlock.dataset.nextBlockId = bottomBlock.id;
        bottomBlock.dataset.prevBlockId = topBlock.id;
        const topRect = topBlock.getBoundingClientRect();
        const targetX = topBlock.offsetLeft; // Align horizontally here
        const targetY = topBlock.offsetTop + topRect.height - VERTICAL_SNAP_OFFSET;
        bottomBlock.style.left = `${targetX}px`;
        bottomBlock.style.top = `${targetY}px`;
        updateDragGroupPosition(targetX, targetY);
        console.log(`Linked ${topBlock.id} -> ${bottomBlock.id} at pos (${targetX}, ${targetY})`);
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
console.log("linkageimproved.js script finished execution (Vertical Snap Only - Syntax Corrected).");
