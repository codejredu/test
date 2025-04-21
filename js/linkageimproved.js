// ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Added Highlight Class Logging
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 40;
    const VERTICAL_ALIGNMENT_TOLERANCE = 30;
    const HORIZONTAL_PROXIMITY_THRESHOLD = 15;
    const VERTICAL_PROXIMITY_THRESHOLD = 10;
    const HORIZONTAL_SNAP_OFFSET = 0; // שומרים 0 בינתיים
    const ENABLE_DETAILED_SNAP_LOGGING = true; // מפעילים לוגים מפורטים לבדיקה

    // State Variables
    let isDragging = false; let draggedElement = null;
    let potentialSnapTarget = null; let initialMouseX = 0; let initialMouseY = 0;
    let initialElementX = 0; let initialElementY = 0; let programmingArea = null;
    let nextBlockId = 1;

    // ========================================================================
    // Initialization
    // ========================================================================
    function initializeLinkageSystem() {
        console.log("[Linkage] Attempting Init...");
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) { console.error("[Linkage] ERROR: #program-blocks not found!"); return; }
        const currentPosition = window.getComputedStyle(programmingArea).position;
        if (currentPosition !== 'relative' && currentPosition !== 'absolute' && currentPosition !== 'fixed') {
             console.warn(`[Linkage] WARN: #program-blocks position is ${currentPosition}. Consider 'relative'.`);
        }
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("[Linkage] Mousedown listener ATTACHED.");
        console.log("[Linkage] System Initialized.");
        prepareExistingBlocks();
    }
    function prepareExistingBlocks() {
        const blocksInArea = programmingArea.querySelectorAll('.block-container');
        blocksInArea.forEach(block => {
            if (!block.id) { block.id = generateUniqueBlockId(); }
             if (!block.style.position || block.style.position === 'static') { block.style.position = 'absolute'; }
        });
        if(blocksInArea.length > 0) console.log(`[Linkage] Prepared ${blocksInArea.length} existing blocks.`);
    }
    function runInitialization() {
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeLinkageSystem); }
        else { initializeLinkageSystem(); }
    }
    runInitialization();

    // ========================================================================
    // Unique ID Generation
    // ========================================================================
    function generateUniqueBlockId() { return `block-proximity-${Date.now()}-${nextBlockId++}`; }

    // ========================================================================
    // Event Handlers
    // ========================================================================
    function handleMouseDown(event) {
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) return;
        event.preventDefault(); isDragging = true; draggedElement = targetBlock;
        if (!draggedElement.id) { draggedElement.id = generateUniqueBlockId(); }

        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`[Linkage] Drag Start: ${draggedElement.id}`);

        const prevBlockId = draggedElement.dataset.prevBlockId;
        if (prevBlockId) { const pb = document.getElementById(prevBlockId); if (pb) delete pb.dataset.nextBlockId; delete draggedElement.dataset.prevBlockId; }
        const leftBlockId = draggedElement.dataset.leftBlockId;
        if (leftBlockId) { const lb = document.getElementById(leftBlockId); if (lb) delete lb.dataset.rightBlockId; delete draggedElement.dataset.leftBlockId; }

        initialMouseX = event.clientX; initialMouseY = event.clientY;
        initialElementX = draggedElement.offsetLeft; initialElementY = draggedElement.offsetTop;
        draggedElement.style.zIndex = 1000; draggedElement.style.cursor = 'grabbing';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
    }

    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        const deltaX = event.clientX - initialMouseX; const deltaY = event.clientY - initialMouseY;
        const newX = initialElementX + deltaX; const newY = initialElementY + deltaY;
        draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`;
        findAndHighlightSnapTarget();
    }

    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        const currentDraggedElement = draggedElement;
        const currentTarget = potentialSnapTarget;
        const isValidSnapTarget = currentTarget && programmingArea && programmingArea.contains(currentTarget);

        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`[Linkage] --- Drag End: ${currentDraggedElement.id}. Target: ${currentTarget ? currentTarget.id : 'None'} ---`);

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        isDragging = false; draggedElement = null; potentialSnapTarget = null;

        if (isValidSnapTarget) {
            linkBlocksHorizontally(currentTarget, currentDraggedElement);
            if (ENABLE_DETAILED_SNAP_LOGGING) console.log("[Linkage] Snap performed.");
        } else {
             if (ENABLE_DETAILED_SNAP_LOGGING && currentDraggedElement) {
                 console.log(`[Linkage] Placed single block ${currentDraggedElement.id} (no snap)`);
             }
        }
        clearSnapHighlighting();
        if(currentDraggedElement) {
             currentDraggedElement.style.zIndex = '';
             currentDraggedElement.style.cursor = '';
        }
        console.log("[Linkage] --- MouseUp Finished ---");
    }

    function handleMouseLeave(event) { if (isDragging) { handleMouseUp(event); } }

    // Drag Group Management (Not Used) ...

    // ========================================================================
    // Snapping Logic (עם לוגים מפורטים)
    // ========================================================================
    function findAndHighlightSnapTarget() {
        const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement;
        clearSnapHighlighting(); // מנקה את ההדגשה הצהובה מהפעם הקודמת
        potentialSnapTarget = null;
        let showYellowHighlight = false;

        if (!isDragging || !draggedElement || !programmingArea) return;

        const dragRect = draggedElement.getBoundingClientRect();
        if (dragRect.height <= 0 || dragRect.width <= 0) return;
        const dragLeftConnector = { x: dragRect.left, y: dragRect.top + dragRect.height / 2 };

        let closestOverallDistance = HORIZONTAL_SNAP_DISTANCE;
        let bestOverallTarget = null;

        const allBlocks = programmingArea.querySelectorAll('.block-container');
        if (shouldLog) console.log(`[Linkage] Checking ${allBlocks.length} blocks. H_SNAP=${HORIZONTAL_SNAP_DISTANCE}, V_TOL=${VERTICAL_ALIGNMENT_TOLERANCE}, H_PROX=${HORIZONTAL_PROXIMITY_THRESHOLD}, V_PROX=${VERTICAL_PROXIMITY_THRESHOLD}`);

        allBlocks.forEach(block => {
            const targetId = block.id || 'no-id';
            if (block === draggedElement || block.dataset.rightBlockId) return;
            const targetRect = block.getBoundingClientRect();
            if (targetRect.height <= 0 || targetRect.width <= 0) return;

            const targetRightConnector = { x: targetRect.right - HORIZONTAL_SNAP_OFFSET, y: targetRect.top + targetRect.height / 2 };
            const dx = dragLeftConnector.x - targetRightConnector.x; const dy = dragLeftConnector.y - targetRightConnector.y;
            const horizontalDistance = Math.abs(dx); const verticalDistance = Math.abs(dy);

            if (shouldLog) console.log(` Target ${targetId}: H:${horizontalDistance.toFixed(1)}, V:${verticalDistance.toFixed(1)}`);

            if (horizontalDistance < closestOverallDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) {
                closestOverallDistance = horizontalDistance;
                bestOverallTarget = block;
                 if (shouldLog) console.log(`  -> Potential Target Found: ${targetId}`);

                if (horizontalDistance < HORIZONTAL_PROXIMITY_THRESHOLD && verticalDistance < VERTICAL_PROXIMITY_THRESHOLD) {
                    showYellowHighlight = true;
                    if (shouldLog) console.log(`  ==> VERY CLOSE! Enabling Yellow Highlight for ${targetId}`);
                }
            }
        });

        potentialSnapTarget = bestOverallTarget;

        if (showYellowHighlight) {
            highlightSnapTargetYellow(draggedElement, true); // שימוש בפונקציה החדשה עם לוגים
            if (shouldLog && bestOverallTarget) console.log(`[Linkage] --- Final decision: Best Target is ${bestOverallTarget.id}. YELLOW HIGHLIGHT ON for ${draggedElement.id}. ---`);
            else if (shouldLog) console.log(`[Linkage] --- Final decision: YELLOW HIGHLIGHT ON for ${draggedElement.id} (target might be further). ---`);
        } else {
            highlightSnapTargetYellow(draggedElement, false); // שימוש בפונקציה החדשה עם לוגים
            if (shouldLog && bestOverallTarget) console.log(`[Linkage] --- Final decision: Best Target is ${bestOverallTarget.id}. Yellow highlight OFF. ---`);
            else if (shouldLog) console.log(`[Linkage] --- Final decision: No target or not close enough for yellow highlight. ---`);
        }
    }

    // ========================================================================
    // Highlight and Clear Functions (עם לוגים)
    // ========================================================================
    function highlightSnapTargetYellow(block, shouldHighlight) {
         if (block && block.classList) {
             try {
                 if (shouldHighlight) {
                     if (!block.classList.contains('snap-highlight-yellow')) {
                         block.classList.add('snap-highlight-yellow');
                         console.log(`[Linkage][Highlight] Added .snap-highlight-yellow to ${block.id}`);
                     }
                 } else {
                     if (block.classList.contains('snap-highlight-yellow')) {
                         block.classList.remove('snap-highlight-yellow');
                         console.log(`[Linkage][Highlight] Removed .snap-highlight-yellow from ${block.id}`);
                     }
                 }
             } catch (e) { console.error("[Linkage] Yellow highlight error", e); }
         } else {
              console.warn("[Linkage] highlightSnapTargetYellow called with invalid block:", block);
         }
    }

     function clearSnapHighlighting() {
         if (!programmingArea) return;
         const highlighted = programmingArea.querySelectorAll('.snap-highlight-yellow, .snap-highlight, .snap-target, .snap-direction-left, .snap-direction-right');
         if (highlighted.length > 0) {
             console.log(`[Linkage][Clear] Clearing snap classes from ${highlighted.length} elements.`);
             highlighted.forEach(el => {
                 try {
                     // ודא שאנחנו מסירים רק את הקלאס הצהוב כרגע, כי האחרים לא בשימוש
                     el.classList.remove('snap-highlight-yellow');
                     // el.classList.remove('snap-highlight-yellow', 'snap-highlight', 'snap-target', 'snap-direction-left', 'snap-direction-right');
                 }
                 catch(e) { console.error("Clear highlight error", e, el); }
             });
         }
     }

    // ========================================================================
    // Linking Logic (זהה לגרסה הקודמת - משתמש ב-left/top + לוגים)
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        if (leftBlock.dataset.rightBlockId || rightBlock.dataset.leftBlockId) return;

        console.log(`[Linkage] Linking ${leftBlock.id} -> ${rightBlock.id} (Using Left/Top)`);
        console.log(`[Linkage]   Before - Left [${leftBlock.id}]: L=${leftBlock.offsetLeft}, T=${leftBlock.offsetTop}, W=${leftBlock.offsetWidth}`);
        console.log(`[Linkage]   Before - Right [${rightBlock.id}]: L=${rightBlock.offsetLeft}, T=${rightBlock.offsetTop}`);

        leftBlock.dataset.rightBlockId = rightBlock.id; rightBlock.dataset.leftBlockId = rightBlock.id;
        const leftWidth = leftBlock.offsetWidth;
        const targetX = leftBlock.offsetLeft + leftWidth - HORIZONTAL_SNAP_OFFSET;
        const targetY = leftBlock.offsetTop;
        console.log(`[Linkage]   Calculated Target: X=${targetX.toFixed(0)}, Y=${targetY.toFixed(0)} (Offset: ${HORIZONTAL_SNAP_OFFSET})`);

        rightBlock.style.left = `${targetX}px`;
        rightBlock.style.top = `${targetY}px`;
        console.log(`[Linkage]   Set Left/Top Style for ${rightBlock.id}`);

        setTimeout(() => {
            const finalLeft = rightBlock.offsetLeft;
            const finalTop = rightBlock.offsetTop;
            console.log(`[Linkage]   After Link (async) - Right [${rightBlock.id}]: FINAL L=${finalLeft}, FINAL T=${finalTop}`);
            if (Math.abs(finalLeft - targetX) > 1 || Math.abs(finalTop - targetY) > 1) {
                 console.warn(`[Linkage] Position discrepancy STILL detected for ${rightBlock.id}! Expected (${targetX.toFixed(0)}, ${targetY.toFixed(0)}), Got (${finalLeft}, ${finalTop})`);
            }
        }, 50);

        console.log(`[Linkage] Linked HORIZONTALLY ${leftBlock.id} -> ${rightBlock.id}.`);
    }

    // ========================================================================
    // Public API (זהה)
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement){ if (!newBlockElement) return; if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); } try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("Reg Error", e); } if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`[Linkage] Registered ${newBlockElement.id}.`); };

})();
console.log("linkageimproved.js script finished execution (Yellow Proximity Highlight + Logging).");
