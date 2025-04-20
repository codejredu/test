 // ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Horizontal Snap - Disabled Group Movement - More Logs
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 40;
    const VERTICAL_ALIGNMENT_TOLERANCE = 30;
    const HORIZONTAL_SNAP_OFFSET = 2;
    const ENABLE_DETAILED_SNAP_LOGGING = false;

    // State Variables
    let isDragging = false; let draggedElement = null; // *** אין יותר dragGroup ***
    let potentialSnapTarget = null; let initialMouseX = 0; let initialMouseY = 0;
    let initialElementX = 0; let initialElementY = 0; let programmingArea = null;
    let nextBlockId = 1;

    // ========================================================================
    // Initialization (זהה)
    // ========================================================================
    function initializeLinkageSystem(){ console.log("Attempting Linkage Init..."); programmingArea = document.getElementById("program-blocks"); if (!programmingArea) { console.error("Programming area not found!"); return; } const currentPosition = window.getComputedStyle(programmingArea).position; if (currentPosition !== 'relative' && currentPosition !== 'absolute' && currentPosition !== 'fixed') { console.warn(`Programming area position: ${currentPosition}. Consider 'relative'.`); } programmingArea.addEventListener('mousedown', handleMouseDown); console.log("Linkage System Initialized."); prepareExistingBlocks(); }
    function prepareExistingBlocks(){ const blocksInArea = programmingArea.querySelectorAll('.block-container'); blocksInArea.forEach(block => { if (!block.id) { block.id = generateUniqueBlockId(); } if (!block.style.position || block.style.position === 'static') { block.style.position = 'absolute'; } }); if(blocksInArea.length > 0) console.log(`Prepared ${blocksInArea.length} existing blocks.`); }
    function runInitialization(){ if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeLinkageSystem); } else { initializeLinkageSystem(); } }
    runInitialization();

    // ========================================================================
    // Unique ID Generation (זהה)
    // ========================================================================
    function generateUniqueBlockId() { return `block-${Date.now()}-${nextBlockId++}`; }

    // ========================================================================
    // Event Handlers (עם שינויים)
    // ========================================================================
    function handleMouseDown(event) {
        console.log(`>>> handleMouseDown triggered!`);
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) return;
        event.preventDefault(); isDragging = true; draggedElement = targetBlock; // *** אין יותר חישוב dragGroup ***
        if (!draggedElement.id) { draggedElement.id = generateUniqueBlockId(); }

        console.log(`   Dragging single block: ${draggedElement.id}`); // הודעה שונה

        // --- Detaching Logic (זהה) ---
        const prevBlockId = draggedElement.dataset.prevBlockId;
        if (prevBlockId) { const pb = document.getElementById(prevBlockId); if (pb) delete pb.dataset.nextBlockId; delete draggedElement.dataset.prevBlockId; console.log(`   Detached V from ${prevBlockId}`); }
        const leftBlockId = draggedElement.dataset.leftBlockId;
        if (leftBlockId) { const lb = document.getElementById(leftBlockId); if (lb) delete lb.dataset.rightBlockId; delete draggedElement.dataset.leftBlockId; console.log(`   Detached H from ${leftBlockId}`); }

        initialMouseX = event.clientX; initialMouseY = event.clientY;
        initialElementX = draggedElement.offsetLeft; initialElementY = draggedElement.offsetTop;
        // --- אין צורך בלולאה על dragGroup ---
        draggedElement.style.zIndex = 1000; draggedElement.style.cursor = 'grabbing';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
        console.log(`--- Drag Start: ${draggedElement.id} ---`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        const deltaX = event.clientX - initialMouseX; const deltaY = event.clientY - initialMouseY;
        const newX = initialElementX + deltaX; const newY = initialElementY + deltaY;
        console.log(`MouseMove: Setting ${draggedElement.id} to X=${newX.toFixed(0)}, Y=${newY.toFixed(0)}`); // לוג מיקום
        draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`;
        // *** אין קריאה ל-updateDragGroupPosition ***
        findAndHighlightSnapTarget();
    }

    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        const currentDraggedElement = draggedElement; // שמירת הפניה לבלוק הנגרר
        const currentTarget = potentialSnapTarget;    // שמירת הפניה ליעד הפוטנציאלי
        const isValidSnapTarget = currentTarget && programmingArea && programmingArea.contains(currentTarget);
        console.log(`--- Drag End: ${currentDraggedElement.id}. Target: ${currentTarget ? currentTarget.id : 'None'} ---`);

        if (isValidSnapTarget) {
            linkBlocksHorizontally(currentTarget, currentDraggedElement);
        } else {
             // אין הצמדה - רק וידוא מיקום סופי של הבלוק הנגרר
             if (programmingArea && currentDraggedElement) {
                 const areaRect = programmingArea.getBoundingClientRect();
                 // קבל מיקום נוכחי (לאחר הפלת העכבר)
                 let finalX = currentDraggedElement.offsetLeft;
                 let finalY = currentDraggedElement.offsetTop;
                 // הגבל לגבולות אם צריך
                 const elemRect = currentDraggedElement.getBoundingClientRect(); // קבל מידות עדכניות
                 finalX = Math.max(0, Math.min(finalX, areaRect.width - elemRect.width));
                 finalY = Math.max(0, Math.min(finalY, areaRect.height - elemRect.height));
                 // ודא שהמיקום הסופי נקבע (למקרה שהיה שינוי קטן בין mousemove אחרון ל-mouseup)
                 currentDraggedElement.style.left = `${finalX}px`;
                 currentDraggedElement.style.top = `${finalY}px`;
                 console.log(`Placed single block ${currentDraggedElement.id} at final pos X=${finalX.toFixed(0)}, Y=${finalY.toFixed(0)} (no snap)`);
             }
        }

        clearSnapHighlighting();
        // אין צורך בלולאה על dragGroup
        if(currentDraggedElement) {
             currentDraggedElement.style.zIndex = ''; currentDraggedElement.style.cursor = '';
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        isDragging = false; draggedElement = null; /* אין dragGroup */ potentialSnapTarget = null;
        console.log("--- MouseUp Finished ---");
    }

    function handleMouseLeave(event) { if (isDragging) { handleMouseUp(event); } }

    // ========================================================================
    // Drag Group Management ( *** פונקציות אלו לא בשימוש כרגע *** )
    // ========================================================================
    // function getVerticalBlockGroup(startBlock) { ... }
    // function updateVerticalDragGroupPosition(leaderX, leaderY) { ... }

    // ========================================================================
    // Snapping Logic (זהה לקודם - הדגשת נגרר בלבד)
    // ========================================================================
    function findAndHighlightSnapTarget(){ const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement; clearSnapHighlighting(); potentialSnapTarget = null; if (!isDragging || !draggedElement || !programmingArea) return; const dragRect = draggedElement.getBoundingClientRect(); if (dragRect.height <= 0 || dragRect.width <= 0) return; const dragLeftConnector = { x: dragRect.left, y: dragRect.top + dragRect.height / 2 }; let closestDistance = HORIZONTAL_SNAP_DISTANCE; let bestTarget = null; const allBlocks = programmingArea.querySelectorAll('.block-container'); allBlocks.forEach(block => { /* שינינו את dragGroup ל-draggedElement בלבד לבדיקה */ if (block === draggedElement || block.dataset.rightBlockId) return; const targetRect = block.getBoundingClientRect(); if (targetRect.height <= 0 || targetRect.width <= 0) return; const targetRightConnector = { x: targetRect.right - HORIZONTAL_SNAP_OFFSET, y: targetRect.top + targetRect.height / 2 }; const dx = dragLeftConnector.x - targetRightConnector.x; const dy = dragLeftConnector.y - targetRightConnector.y; const horizontalDistance = Math.abs(dx); const verticalDistance = Math.abs(dy); if (horizontalDistance < closestDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) { closestDistance = horizontalDistance; bestTarget = block; } }); if (bestTarget) { potentialSnapTarget = bestTarget; highlightSnapTarget(draggedElement, true); if (shouldLog) console.log(`--- Best H target: ${bestTarget.id}. Highlighting dragged ONLY. ---`); } else { highlightSnapTarget(draggedElement, false); if (shouldLog) console.log(`--- No H target found. ---`); } }
    function highlightSnapTarget(block, shouldHighlight){ if (block) { try { if (shouldHighlight) { block.classList.add('snap-highlight'); } else { block.classList.remove('snap-highlight'); } } catch (e) { /* ignore */ } } }
    function clearSnapHighlighting(){ if (!programmingArea) return; const highlighted = programmingArea.querySelectorAll('.snap-highlight'); highlighted.forEach(el => { try { el.classList.remove('snap-highlight'); } catch(e) { /* ignore */ } }); }

    // ========================================================================
    // Linking Logic (זהה לקודם - יישור עליון, עם היסט X)
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        if (leftBlock.dataset.rightBlockId || rightBlock.dataset.leftBlockId) return;

        console.log(`Linking ${leftBlock.id} -> ${rightBlock.id}`);
        console.log(`  Before Link - Left [${leftBlock.id}]: L=${leftBlock.offsetLeft}, T=${leftBlock.offsetTop}, W=${leftBlock.offsetWidth}`);
        console.log(`  Before Link - Right [${rightBlock.id}]: L=${rightBlock.offsetLeft}, T=${rightBlock.offsetTop}`);

        leftBlock.dataset.rightBlockId = rightBlock.id; rightBlock.dataset.leftBlockId = leftBlock.id;
        const leftWidth = leftBlock.offsetWidth;
        const targetX = leftBlock.offsetLeft + leftWidth - HORIZONTAL_SNAP_OFFSET;
        const targetY = leftBlock.offsetTop;
        console.log(`  Calculated Target: X=${targetX.toFixed(0)}, Y=${targetY.toFixed(0)} (Offset: ${HORIZONTAL_SNAP_OFFSET})`);

        rightBlock.style.left = `${targetX}px`;
        rightBlock.style.top = `${targetY}px`;
        console.log(`  Set Style for ${rightBlock.id}`); // לוג לפני setTimeout

        setTimeout(() => {
            console.log(`  After Link (async) - Right [${rightBlock.id}]: FINAL L=${rightBlock.offsetLeft}, FINAL T=${rightBlock.offsetTop}`);
        }, 0);

        console.log(`Linked HORIZONTALLY ${leftBlock.id} -> ${rightBlock.id}.`);
    }

    // ========================================================================
    // Public API (זהה)
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement){ if (!newBlockElement) return; if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); } try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("Reg Error", e); } };

})();
console.log("linkageimproved.js script finished execution (Horizontal Snap - NO Group Movement).");
