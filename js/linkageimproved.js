 // ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Increased Horizontal Snap Distance + Rect Check
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 60; // *** הוגדל ל-60 ***
    const VERTICAL_ALIGNMENT_TOLERANCE = 30;
    const HORIZONTAL_SNAP_OFFSET = 2;
    const ENABLE_DETAILED_SNAP_LOGGING = true; // *** הפעלת לוגים חזרה לבדיקה ***

    // State Variables ... (זהה)
    let isDragging = false; let draggedElement = null; /* אין dragGroup*/
    let potentialSnapTarget = null; let initialMouseX = 0; let initialMouseY = 0;
    let initialElementX = 0; let initialElementY = 0; let programmingArea = null;
    let nextBlockId = 1;

    // Initialization ... (זהה)
    function initializeLinkageSystem(){ console.log("Attempting Linkage Init..."); programmingArea = document.getElementById("program-blocks"); if (!programmingArea) { console.error("Programming area not found!"); return; } const currentPosition = window.getComputedStyle(programmingArea).position; if (currentPosition !== 'relative' && currentPosition !== 'absolute' && currentPosition !== 'fixed') { console.warn(`Programming area position: ${currentPosition}. Consider 'relative'.`); } programmingArea.addEventListener('mousedown', handleMouseDown); console.log("Linkage System Initialized."); prepareExistingBlocks(); }
    function prepareExistingBlocks(){ const blocksInArea = programmingArea.querySelectorAll('.block-container'); blocksInArea.forEach(block => { if (!block.id) { block.id = generateUniqueBlockId(); } if (!block.style.position || block.style.position === 'static') { block.style.position = 'absolute'; } }); if(blocksInArea.length > 0) console.log(`Prepared ${blocksInArea.length} existing blocks.`); }
    function runInitialization(){ if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeLinkageSystem); } else { initializeLinkageSystem(); } }
    runInitialization();

    // Unique ID Generation ... (זהה)
    function generateUniqueBlockId() { return `block-${Date.now()}-${nextBlockId++}`; }

    // Event Handlers ... (זהה לגרסה הקודמת - ללא dragGroup)
    function handleMouseDown(event) { console.log(`>>> handleMouseDown triggered!`); const targetBlock = event.target.closest('.block-container'); if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) return; event.preventDefault(); isDragging = true; draggedElement = targetBlock; if (!draggedElement.id) { draggedElement.id = generateUniqueBlockId(); } console.log(`   Dragging single block: ${draggedElement.id}`); const prevBlockId = draggedElement.dataset.prevBlockId; if (prevBlockId) { const pb = document.getElementById(prevBlockId); if (pb) delete pb.dataset.nextBlockId; delete draggedElement.dataset.prevBlockId; console.log(`   Detached V from ${prevBlockId}`); } const leftBlockId = draggedElement.dataset.leftBlockId; if (leftBlockId) { const lb = document.getElementById(leftBlockId); if (lb) delete lb.dataset.rightBlockId; delete draggedElement.dataset.leftBlockId; console.log(`   Detached H from ${leftBlockId}`); } initialMouseX = event.clientX; initialMouseY = event.clientY; initialElementX = draggedElement.offsetLeft; initialElementY = draggedElement.offsetTop; draggedElement.style.zIndex = 1000; draggedElement.style.cursor = 'grabbing'; document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); document.addEventListener('mouseleave', handleMouseLeave); if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag Start: ${draggedElement.id} ---`); }
    function handleMouseMove(event) { if (!isDragging || !draggedElement) return; const deltaX = event.clientX - initialMouseX; const deltaY = event.clientY - initialMouseY; const newX = initialElementX + deltaX; const newY = initialElementY + deltaY; if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`MouseMove: Setting ${draggedElement.id} to X=${newX.toFixed(0)}, Y=${newY.toFixed(0)}`); draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`; findAndHighlightSnapTarget(); }
    function handleMouseUp(event) { if (!isDragging || !draggedElement) return; const currentDraggedElement = draggedElement; const currentTarget = potentialSnapTarget; const isValidSnapTarget = currentTarget && programmingArea && programmingArea.contains(currentTarget); if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag End: ${currentDraggedElement.id}. Target: ${currentTarget ? currentTarget.id : 'None'} ---`); if (isValidSnapTarget) { linkBlocksHorizontally(currentTarget, currentDraggedElement); } else { if (programmingArea && currentDraggedElement) { const areaRect = programmingArea.getBoundingClientRect(); let finalX = currentDraggedElement.offsetLeft; let finalY = currentDraggedElement.offsetTop; const elemRect = currentDraggedElement.getBoundingClientRect(); finalX = Math.max(0, Math.min(finalX, areaRect.width - elemRect.width)); finalY = Math.max(0, Math.min(finalY, areaRect.height - elemRect.height)); currentDraggedElement.style.left = `${finalX}px`; currentDraggedElement.style.top = `${finalY}px`; if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Placed single block ${currentDraggedElement.id} at final pos X=${finalX.toFixed(0)}, Y=${finalY.toFixed(0)} (no snap)`); } } clearSnapHighlighting(); if(currentDraggedElement) { currentDraggedElement.style.zIndex = ''; currentDraggedElement.style.cursor = ''; } document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); document.removeEventListener('mouseleave', handleMouseLeave); isDragging = false; draggedElement = null; potentialSnapTarget = null; console.log("--- MouseUp Finished ---"); }
    function handleMouseLeave(event) { if (isDragging) { handleMouseUp(event); } }

    // Drag Group Management (פונקציות אלו לא בשימוש)
    // ...

    // ========================================================================
    // Snapping Logic ( *** מרחק אופקי מוגדל, בדיקת Rect *** )
    // ========================================================================
    function findAndHighlightSnapTarget() {
        const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement;
        if (shouldLog) console.log(`--- findAndHighlightSnapTarget HORIZONTAL (${draggedElement.id}) ---`);

        clearSnapHighlighting(); potentialSnapTarget = null;
        if (!isDragging || !draggedElement || !programmingArea) return;

        const dragRect = draggedElement.getBoundingClientRect();
        // *** בדיקת ערכי ה-Rect של הבלוק הנגרר ***
        if (shouldLog) console.log(`Dragged (${draggedElement.id}) RECT: T:${dragRect.top.toFixed(0)} R:${dragRect.right.toFixed(0)} B:${dragRect.bottom.toFixed(0)} L:${dragRect.left.toFixed(0)} W:${dragRect.width.toFixed(0)} H:${dragRect.height.toFixed(0)}`);
        if (dragRect.height <= 0 || dragRect.width <= 0) {
             if(shouldLog) console.warn("Dragged block has invalid dimensions, skipping snap check.");
             return;
        }

        const dragLeftConnector = { x: dragRect.left, y: dragRect.top + dragRect.height / 2 };
        let closestDistance = HORIZONTAL_SNAP_DISTANCE; // עכשיו 60
        let bestTarget = null;
        const allBlocks = programmingArea.querySelectorAll('.block-container');
        if (shouldLog) console.log(`Checking against ${allBlocks.length} blocks. HORIZONTAL_SNAP_DISTANCE = ${HORIZONTAL_SNAP_DISTANCE}`);

        allBlocks.forEach(block => {
            const targetId = block.id || 'no-id';
            if (block === draggedElement || block.dataset.rightBlockId) return; // Skip self and occupied blocks

            const targetRect = block.getBoundingClientRect();
             // *** בדיקת ערכי ה-Rect של בלוק המטרה ***
            if (shouldLog) console.log(`\nChecking target (${targetId}) RECT: T:${targetRect.top.toFixed(0)} R:${targetRect.right.toFixed(0)} B:${targetRect.bottom.toFixed(0)} L:${targetRect.left.toFixed(0)} W:${targetRect.width.toFixed(0)} H:${targetRect.height.toFixed(0)}`);
            if (targetRect.height <= 0 || targetRect.width <= 0) {
                if(shouldLog) console.warn(`Target block ${targetId} has invalid dimensions, skipping.`);
                return;
            }

            const targetRightConnector = { x: targetRect.right - HORIZONTAL_SNAP_OFFSET, y: targetRect.top + targetRect.height / 2 };
            const dx = dragLeftConnector.x - targetRightConnector.x; const dy = dragLeftConnector.y - targetRightConnector.y;
            const horizontalDistance = Math.abs(dx); const verticalDistance = Math.abs(dy);
            if (shouldLog) console.log(` -> Distances for ${targetId}: H:${horizontalDistance.toFixed(1)} (Need < ${closestDistance}), V:${verticalDistance.toFixed(1)} (Need < ${VERTICAL_ALIGNMENT_TOLERANCE})`);

            if (horizontalDistance < closestDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) {
                if (shouldLog) console.log(` ==> Potential Match: ${targetId}`);
                closestDistance = horizontalDistance; bestTarget = block;
            }
        });

        if (bestTarget) {
            potentialSnapTarget = bestTarget; highlightSnapTarget(draggedElement, true);
            if (shouldLog) console.log(`--- Best H target: ${bestTarget.id}. Highlighting dragged ONLY. ---`);
        } else { highlightSnapTarget(draggedElement, false); if (shouldLog) console.log(`--- No H target found. ---`); }
    }

    function highlightSnapTarget(block, shouldHighlight){ if (block) { try { if (shouldHighlight) { block.classList.add('snap-highlight'); } else { block.classList.remove('snap-highlight'); } } catch (e) { /* ignore */ } } }
    function clearSnapHighlighting(){ if (!programmingArea) return; const highlighted = programmingArea.querySelectorAll('.snap-highlight'); highlighted.forEach(el => { try { el.classList.remove('snap-highlight'); } catch(e) { /* ignore */ } }); }

    // ========================================================================
    // Linking Logic (זהה לקודם - יישור עליון, עם היסט X, לוגים)
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) { /* ... קוד זהה ... */ if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return; if (leftBlock.dataset.rightBlockId || rightBlock.dataset.leftBlockId) return; console.log(`Linking ${leftBlock.id} -> ${rightBlock.id}`); console.log(`  Before Link - Left [${leftBlock.id}]: L=${leftBlock.offsetLeft}, T=${leftBlock.offsetTop}, W=${leftBlock.offsetWidth}`); console.log(`  Before Link - Right [${rightBlock.id}]: L=${rightBlock.offsetLeft}, T=${rightBlock.offsetTop}`); leftBlock.dataset.rightBlockId = rightBlock.id; rightBlock.dataset.leftBlockId = leftBlock.id; const leftWidth = leftBlock.offsetWidth; const targetX = leftBlock.offsetLeft + leftWidth - HORIZONTAL_SNAP_OFFSET; const targetY = leftBlock.offsetTop; console.log(`  Calculated Target: X=${targetX.toFixed(0)}, Y=${targetY.toFixed(0)} (Offset: ${HORIZONTAL_SNAP_OFFSET})`); rightBlock.style.left = `${targetX}px`; rightBlock.style.top = `${targetY}px`; console.log(`  Set Style for ${rightBlock.id}`); setTimeout(() => { console.log(`  After Link (async) - Right [${rightBlock.id}]: FINAL L=${rightBlock.offsetLeft}, FINAL T=${rightBlock.offsetTop}`); }, 0); console.log(`Linked HORIZONTALLY ${leftBlock.id} -> ${rightBlock.id}.`); }

    // ========================================================================
    // Public API (זהה)
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement){ if (!newBlockElement) return; if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); } try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("Reg Error", e); } };

})();
console.log("linkageimproved.js script finished execution (Increased H Snap Dist + Rect Check).");
