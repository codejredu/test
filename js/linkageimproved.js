// ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Checking Initial MouseDown Trigger
// ========================================================================

(function() {
    // ... (Configuration and State variables remain the same) ...
    const SNAP_DISTANCE = 80;
    const VERTICAL_SNAP_OFFSET = 5;
    const CONNECTOR_OFFSET_X_PERCENT = 0;
    const ENABLE_DETAILED_SNAP_LOGGING = true;
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
    // Initialization (נשאר זהה)
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
        // *** הדבקת המאזין - לוודא שזה קורה ***
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("Mousedown listener attached to #program-blocks."); // הוספנו אישור
        console.log("Linkage System Initialized for #program-blocks");
        prepareExistingBlocks();
    }
    function prepareExistingBlocks() { /* ... קוד זהה ... */
        const blocksInArea = programmingArea.querySelectorAll('.block-container');
        blocksInArea.forEach(block => {
            if (!block.id) { block.id = generateUniqueBlockId(); }
             if (!block.style.position || block.style.position === 'static') {
                 block.style.position = 'absolute';
             }
        });
         console.log(`Prepared ${blocksInArea.length} existing blocks.`);
    }
    function runInitialization() { /* ... קוד זהה ... */
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeLinkageSystem);
        } else { initializeLinkageSystem(); }
    }
    runInitialization();

    // ========================================================================
    // Unique ID Generation (נשאר זהה)
    // ========================================================================
    function generateUniqueBlockId() { return `block-${Date.now()}-${nextBlockId++}`; }

    // ========================================================================
    // Event Handlers
    // ========================================================================

    function handleMouseDown(event) {
        // *** הוספנו לוג ממש בתחילת הפונקציה ***
        console.log(`>>> handleMouseDown triggered! Target:`, event.target);

        // Only trigger drag for direct clicks on block-containers within the programming area
        const targetBlock = event.target.closest('.block-container');
        console.log(`   Closest block-container found:`, targetBlock); // בדוק מה נמצא

        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) {
            console.log(`   MouseDown ignored: Not on a valid block inside programming area.`);
            return; // סיים אם לא מדובר בלחיצה על בלוק תקין באזור
        }

        // Prevent default text selection or image dragging behavior
        event.preventDefault();
        console.log(`   Prevented default behavior.`);

        isDragging = true;
        draggedElement = targetBlock;
        console.log(`   Set isDragging=true, draggedElement=`, draggedElement);


        // Ensure the block has an ID
        if (!draggedElement.id) {
            draggedElement.id = generateUniqueBlockId();
            console.log(`   Assigned new ID during mousedown: ${draggedElement.id}`);
        }

        // --- Detaching Logic ---
        const prevBlockId = draggedElement.dataset.prevBlockId;
        if (prevBlockId) {
            const prevBlock = document.getElementById(prevBlockId);
            if (prevBlock) {
                delete prevBlock.dataset.nextBlockId; // Remove link from parent
            }
            delete draggedElement.dataset.prevBlockId; // Remove link from child
            console.log(`   Detached ${draggedElement.id} from ${prevBlockId}`);
        } else {
             console.log(`   Block ${draggedElement.id} has no previous block to detach from.`);
        }

        // --- Grouping Logic ---
        dragGroup = getBlockGroup(draggedElement);
        console.log(`   Calculated drag group (size ${dragGroup.length}):`, dragGroup);


        // --- Positioning & Offset ---
        // const rect = draggedElement.getBoundingClientRect(); // לא הכרחי כאן
        initialMouseX = event.clientX;
        initialMouseY = event.clientY;
        initialElementX = draggedElement.offsetLeft;
        initialElementY = draggedElement.offsetTop;
        console.log(`   Recorded initial positions: Mouse(${initialMouseX},${initialMouseY}), Element(${initialElementX},${initialElementY})`);


        // Bring the entire group to the front
        dragGroup.forEach((block, index) => {
            block.style.zIndex = 1000 + index;
            block.style.cursor = 'grabbing';
        });
        console.log(`   Set z-index and cursor for drag group.`);


        // Add listeners to the whole document for move and up events
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
        console.log(`   Added mousemove, mouseup, mouseleave listeners to document.`);


        // Log drag start consistent with previous logging
        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag Start: ${draggedElement.id} ---`);
        console.log(`>>> handleMouseDown finished processing.`); // סוף הפונקציה
    }

    // --- שאר הפונקציות (handleMouseMove, handleMouseUp, handleMouseLeave, getBlockGroup, updateDragGroupPosition, findAndHighlightSnapTarget, highlightSnapTarget, clearSnapHighlighting, linkBlocks, registerNewBlockForLinkage) נשארות כפי שהיו בגרסה הקודמת (עם הלוגים המפורטים ב-findAndHighlightSnapTarget ועם הלוגיקה הפשוטה של הסנאפ) ---
    // ... (העתק את שאר הפונקציות מהגרסה הקודמת לכאן אם אתה רוצה קובץ מלא) ...
    // ... או פשוט החלף את הקובץ כולו בזה ...
    // (מכיוון שביקשת קובץ מלא, אני מוסיף את השאר)

    function handleMouseMove(event) { /* ... קוד זהה לגרסה הקודמת ... */
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

    function handleMouseUp(event) { /* ... קוד זהה לגרסה הקודמת ... */
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

    function handleMouseLeave(event) { /* ... קוד זהה לגרסה הקודמת ... */
         if (isDragging) {
             console.warn("Mouse left window during drag, cancelling drag and snap.");
             handleMouseUp(event);
         }
    }

    function getBlockGroup(startBlock) { /* ... קוד זהה לגרסה הקודמת ... */
        const group = [startBlock];
        let currentBlock = startBlock;
        while (currentBlock && currentBlock.dataset.nextBlockId) {
            const nextId = currentBlock.dataset.nextBlockId;
            const nextBlock = document.getElementById(nextId);
            if (nextBlock && programmingArea && programmingArea.contains(nextBlock)) {
                group.push(nextBlock);
                currentBlock = nextBlock;
            } else {
                if (nextId) {
                     console.warn(`Broken link detected or block outside area: ${currentBlock.id} -> ${nextId}. Stopping group traversal.`);
                     delete currentBlock.dataset.nextBlockId;
                }
                break;
            }
        }
        return group;
    }
    function updateDragGroupPosition(leaderX, leaderY) { /* ... קוד זהה לגרסה הקודמת ... */
        if (dragGroup.length <= 1) return;
        let currentTop = leaderY;
        let currentLeft = leaderX;
        for (let i = 0; i < dragGroup.length; i++) {
            const block = dragGroup[i];
            if (!block) continue;
            const blockHeight = block.offsetHeight;
             if (i === 0) {
                 currentTop += blockHeight - VERTICAL_SNAP_OFFSET;
             } else {
                block.style.left = `${currentLeft}px`;
                block.style.top = `${currentTop}px`;
                currentTop += blockHeight - VERTICAL_SNAP_OFFSET;
            }
        }
    }

    function findAndHighlightSnapTarget() { /* ... קוד זהה לגרסה הקודמת (עם הלוגים והסנאפ הפשוט) ... */
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
        if (shouldLog) console.log(`Dragged Top Connector: X:${dragTopConnector.x.toFixed(0)} Y:${dragTopConnector.y.toFixed(0)}`);

        let closestDistance = SNAP_DISTANCE;
        let bestTarget = null;

        const allBlocks = programmingArea.querySelectorAll('.block-container');
        if (shouldLog) console.log(`Checking against ${allBlocks.length} blocks in the area. SNAP_DISTANCE = ${SNAP_DISTANCE}`);

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
            if (shouldLog) console.log(` -> Target (${targetId}): Rect T:${targetRect.top.toFixed(0)} L:${targetRect.left.toFixed(0)} W:${targetRect.width.toFixed(0)} H:${targetRect.height.toFixed(0)}`);
            if (targetRect.height <= 0 && shouldLog) console.warn(`Target block ${targetId} has height <= 0!`);
            const targetBottomConnector = {
                x: targetRect.left + targetRect.width / 2 + (targetRect.width * CONNECTOR_OFFSET_X_PERCENT / 200),
                y: targetRect.bottom - VERTICAL_SNAP_OFFSET
            };
             if (shouldLog) console.log(` -> Target Bottom Connector: X:${targetBottomConnector.x.toFixed(0)} Y:${targetBottomConnector.y.toFixed(0)}`);
            const dx = dragTopConnector.x - targetBottomConnector.x;
            const dy = dragTopConnector.y - targetBottomConnector.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (shouldLog) console.log(` -> Distance: ${distance.toFixed(1)} (Need < ${closestDistance})`);
            if (distance < closestDistance) {
                 if (shouldLog) console.log(` ==> Potential Match Found (Distance Check Only): ${targetId} is close enough (${distance.toFixed(1)}).`);
                closestDistance = distance;
                bestTarget = block;
            } else {
                 if (shouldLog) console.log(` -> No Match: Distance (${distance.toFixed(1)}) failed.`);
            }
        }); // End forEach block

        if (bestTarget) {
            potentialSnapTarget = bestTarget;
            highlightSnapTarget(potentialSnapTarget, true);
            highlightSnapTarget(draggedElement, true);
             if (shouldLog) console.log(`--- Best target found: ${bestTarget.id} ---`);
        } else {
            if (shouldLog) console.log(`--- No suitable target found ---`);
        }
    } // End findAndHighlightSnapTarget

    function highlightSnapTarget(block, shouldHighlight) { /* ... קוד זהה ... */
         if (block) {
             try {
                 if (shouldHighlight) { block.classList.add('snap-highlight'); }
                 else { block.classList.remove('snap-highlight'); }
             } catch (e) { console.error("Error applying/removing highlight class:", e, block); }
         }
    }
     function clearSnapHighlighting() { /* ... קוד זהה ... */
         if (!programmingArea) return;
         const highlighted = programmingArea.querySelectorAll('.snap-highlight');
         highlighted.forEach(el => {
             try { el.classList.remove('snap-highlight'); }
             catch(e) { console.error("Error removing highlight class:", e, el); }
         });
     }

    function linkBlocks(topBlock, bottomBlock) { /* ... קוד זהה ... */
        if (!topBlock || !bottomBlock || topBlock === bottomBlock || !programmingArea) return;
        if (topBlock.dataset.nextBlockId) { console.warn(`Link aborted: Target ${topBlock.id} already has next block (${topBlock.dataset.nextBlockId})`); return; }
        if (bottomBlock.dataset.prevBlockId) { console.warn(`Link aborted: Source ${bottomBlock.id} already has prev block (${bottomBlock.dataset.prevBlockId})`); return; }
        topBlock.dataset.nextBlockId = bottomBlock.id;
        bottomBlock.dataset.prevBlockId = topBlock.id;
        const topRect = topBlock.getBoundingClientRect();
        const targetX = topBlock.offsetLeft;
        const targetY = topBlock.offsetTop + topRect.height - VERTICAL_SNAP_OFFSET;
        bottomBlock.style.left = `${targetX}px`;
        bottomBlock.style.top = `${targetY}px`;
        updateDragGroupPosition(targetX, targetY);
        console.log(`Linked ${topBlock.id} -> ${bottomBlock.id} at pos (${targetX}, ${targetY})`);
    }

    window.registerNewBlockForLinkage = function(newBlockElement) { /* ... קוד זהה ... */
         if (ENABLE_DETAILED_SNAP_LOGGING) console.log("Executing registerNewBlockForLinkage for element:", newBlockElement);
         if (!newBlockElement) { console.error("registerNewBlockForLinkage called with null element."); return; }
         if (!newBlockElement.id) {
             newBlockElement.id = generateUniqueBlockId();
             if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Assigned new ID via registration: ${newBlockElement.id}`);
         }
         try { newBlockElement.style.position = 'absolute'; }
         catch (e) { console.error("!!! CRITICAL ERROR setting style.position:", e, newBlockElement); }
          if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Successfully registered block ${newBlockElement.id} for linkage.`);
    };


})(); // IIFE to encapsulate scope
console.log("linkageimproved.js script finished execution (MouseDown Check).");
