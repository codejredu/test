 // ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Increased Logging for Debugging MouseDown/Snap Issues
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 60;
    const VERTICAL_ALIGNMENT_TOLERANCE = 30;
    const HORIZONTAL_SNAP_OFFSET = 0; // איפוס ההיסט לניסיון
    const ENABLE_DETAILED_SNAP_LOGGING = true; // *** הפעלת לוגים מפורטים ***

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
        // *** הוספת מאזין עם לוג אישור ***
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("[Linkage] Mousedown listener ATTACHED to #program-blocks.");
        console.log("[Linkage] System Initialized.");
        prepareExistingBlocks();
    }
    function prepareExistingBlocks() { /* ... קוד זהה ... */
        const blocksInArea = programmingArea.querySelectorAll('.block-container'); blocksInArea.forEach(block => { if (!block.id) { block.id = generateUniqueBlockId(); } if (!block.style.position || block.style.position === 'static') { block.style.position = 'absolute'; } }); if(blocksInArea.length > 0) console.log(`[Linkage] Prepared ${blocksInArea.length} existing blocks.`);
    }
    function runInitialization() { if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeLinkageSystem); } else { initializeLinkageSystem(); } }
    runInitialization();

    // ========================================================================
    // Unique ID Generation
    // ========================================================================
    function generateUniqueBlockId() { return `block-${Date.now()}-${nextBlockId++}`; }

    // ========================================================================
    // Event Handlers
    // ========================================================================
    function handleMouseDown(event) {
        // *** לוג ראשוני קריטי ***
        console.log(`[Linkage] >>> handleMouseDown triggered! Target:`, event.target, `Button: ${event.button}`);
        // בדוק אם זה בכלל אלמנט בתוך אזור התכנות
        if (!programmingArea.contains(event.target)) {
            console.log(`[Linkage] MouseDown outside programming area.`);
            return;
        }

        const targetBlock = event.target.closest('.block-container');
        console.log(`[Linkage]   Closest '.block-container':`, targetBlock);

        if (!targetBlock) { // בדיקה אם נמצא בלוק
             console.log(`[Linkage]   MouseDown ignored: Click was not on a '.block-container'.`);
             return;
        }
        // בדיקה נוספת: האם הבלוק שנמצא הוא באמת בתוך programmingArea? (למקרה ש-closest עלה גבוה מדי)
        if (!programmingArea.contains(targetBlock)) {
             console.log(`[Linkage]   MouseDown ignored: Found block is not inside #program-blocks.`);
             return;
        }


        event.preventDefault(); // חשוב למנוע התנהגויות ברירת מחדל
        console.log(`[Linkage]   Prevented default.`);
        isDragging = true;
        draggedElement = targetBlock;
        if (!draggedElement.id) { draggedElement.id = generateUniqueBlockId(); console.log(`[Linkage]   Assigned ID: ${draggedElement.id}`); }
        console.log(`[Linkage]   Dragging single block: ${draggedElement.id}`);

        // --- Detaching Logic ---
        const prevBlockId = draggedElement.dataset.prevBlockId;
        if (prevBlockId) { const pb = document.getElementById(prevBlockId); if (pb) delete pb.dataset.nextBlockId; delete draggedElement.dataset.prevBlockId; console.log(`[Linkage]   Detached V from ${prevBlockId}`); }
        const leftBlockId = draggedElement.dataset.leftBlockId;
        if (leftBlockId) { const lb = document.getElementById(leftBlockId); if (lb) delete lb.dataset.rightBlockId; delete draggedElement.dataset.leftBlockId; console.log(`[Linkage]   Detached H from ${leftBlockId}`); }

        initialMouseX = event.clientX; initialMouseY = event.clientY;
        initialElementX = draggedElement.offsetLeft; initialElementY = draggedElement.offsetTop;
        draggedElement.style.zIndex = 1000; draggedElement.style.cursor = 'grabbing';
        console.log(`[Linkage]   Adding document listeners.`);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
        console.log(`[Linkage] --- Drag Start: ${draggedElement.id} ---`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        const deltaX = event.clientX - initialMouseX; const deltaY = event.clientY - initialMouseY;
        const newX = initialElementX + deltaX; const newY = initialElementY + deltaY;
        // if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`MouseMove: Setting ${draggedElement.id} to X=${newX.toFixed(0)}, Y=${newY.toFixed(0)}`); // לוג מופחת
        draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`;
        findAndHighlightSnapTarget();
    }

    function handleMouseUp(event) {
        // *** לוג קריטי בכניסה ל-MouseUp ***
        console.log(`[Linkage] >>> handleMouseUp triggered!`);
        if (!isDragging || !draggedElement) {
             console.log(`[Linkage] MouseUp ignored: Not dragging.`);
             return;
        }

        const currentDraggedElement = draggedElement;
        const currentTarget = potentialSnapTarget;
        const isValidSnapTarget = currentTarget && programmingArea && programmingArea.contains(currentTarget);
        console.log(`[Linkage] --- Drag End: ${currentDraggedElement.id}. Target: ${currentTarget ? currentTarget.id : 'None'} ---`);

        // הסר מאזינים גלובליים מיד
        console.log(`[Linkage]   Removing document listeners.`);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);

        // אפס מצב גרירה
        isDragging = false;
        draggedElement = null;
        potentialSnapTarget = null;

        // בצע הצמדה או מיקום סופי
        if (isValidSnapTarget) {
            linkBlocksHorizontally(currentTarget, currentDraggedElement);
            console.log("[Linkage]   Snap performed.");
            // אין return מוקדם, נאפשר ניקוי סגנון
        } else {
             if (programmingArea && currentDraggedElement) {
                 // אין צורך לגעת במיקום, הוא כבר נקבע ב-mousemove האחרון
                 console.log(`[Linkage]   Placed single block ${currentDraggedElement.id} (no snap)`);
             }
        }

        // ניקוי סופי
        console.log("[Linkage]   Cleaning up styles...");
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
    function findAndHighlightSnapTarget(){ const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement; if (shouldLog) console.log(`--- find H Snap (${draggedElement.id}) ---`); clearSnapHighlighting(); potentialSnapTarget = null; if (!isDragging || !draggedElement || !programmingArea) return; const dragRect = draggedElement.getBoundingClientRect(); if (shouldLog) console.log(` Dragged RECT: T:${dragRect.top.toFixed(0)} R:${dragRect.right.toFixed(0)} B:${dragRect.bottom.toFixed(0)} L:${dragRect.left.toFixed(0)} W:${dragRect.width.toFixed(0)} H:${dragRect.height.toFixed(0)}`); if (dragRect.height <= 0 || dragRect.width <= 0) return; const dragLeftConnector = { x: dragRect.left, y: dragRect.top + dragRect.height / 2 }; let closestDistance = HORIZONTAL_SNAP_DISTANCE; let bestTarget = null; const allBlocks = programmingArea.querySelectorAll('.block-container'); if (shouldLog) console.log(` Checking ${allBlocks.length} blocks. H_SNAP=${HORIZONTAL_SNAP_DISTANCE}, V_TOL=${VERTICAL_ALIGNMENT_TOLERANCE}`); allBlocks.forEach(block => { const targetId = block.id || 'no-id'; if (block === draggedElement || block.dataset.rightBlockId) return; const targetRect = block.getBoundingClientRect(); if (shouldLog) console.log(`\n Target (${targetId}) RECT: T:${targetRect.top.toFixed(0)} R:${targetRect.right.toFixed(0)} B:${targetRect.bottom.toFixed(0)} L:${targetRect.left.toFixed(0)} W:${targetRect.width.toFixed(0)} H:${targetRect.height.toFixed(0)}`); if (targetRect.height <= 0 || targetRect.width <= 0) return; const targetRightConnector = { x: targetRect.right - HORIZONTAL_SNAP_OFFSET, y: targetRect.top + targetRect.height / 2 }; const dx = dragLeftConnector.x - targetRightConnector.x; const dy = dragLeftConnector.y - targetRightConnector.y; const horizontalDistance = Math.abs(dx); const verticalDistance = Math.abs(dy); if (shouldLog) console.log(`  -> Dist H:${horizontalDistance.toFixed(1)}, V:${verticalDistance.toFixed(1)}`); if (horizontalDistance < closestDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) { if (shouldLog) console.log(`  ==> Match: ${targetId}`); closestDistance = horizontalDistance; bestTarget = block; } }); if (bestTarget) { potentialSnapTarget = bestTarget; highlightSnapTarget(draggedElement, true); if (shouldLog) console.log(`--- Best H target: ${bestTarget.id}. Highlighting dragged ONLY. ---`); } else { highlightSnapTarget(draggedElement, false); if (shouldLog) console.log(`--- No H target found. ---`); } }
    function highlightSnapTarget(block, shouldHighlight){ if (block) { try { if (shouldHighlight) { block.classList.add('snap-highlight'); } else { block.classList.remove('snap-highlight'); } } catch (e) { /* ignore */ } } }
    function clearSnapHighlighting(){ if (!programmingArea) return; const highlighted = programmingArea.querySelectorAll('.snap-highlight'); highlighted.forEach(el => { try { el.classList.remove('snap-highlight'); } catch(e) { /* ignore */ } }); }

    // ========================================================================
    // Linking Logic (עם לוגים מפורטים)
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        if (leftBlock.dataset.rightBlockId || rightBlock.dataset.leftBlockId) return;

        console.log(`[Linkage] Linking ${leftBlock.id} -> ${rightBlock.id}`);
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
        }, 50); // עיכוב קל

        console.log(`[Linkage] Linked HORIZONTALLY ${leftBlock.id} -> ${rightBlock.id}.`);
    }

    // ========================================================================
    // Public API
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement) {
         console.log("[Linkage] Registering block:", newBlockElement);
         if (!newBlockElement) return;
         if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); }
         try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("Reg Error", e); }
         console.log(`[Linkage] Registered block ${newBlockElement.id}.`);
    };

})();
console.log("linkageimproved.js script finished execution (Increased Logging).");
