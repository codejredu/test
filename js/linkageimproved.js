 // ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Horizontal Snap - Top Align Y - Final Position Tuning Attempt
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 40; // טווח הצמדה אופקי
    const VERTICAL_ALIGNMENT_TOLERANCE = 30; // כמה מותר הפרש גובה בין מרכזי הבלוקים
    const HORIZONTAL_SNAP_OFFSET = 2; // היסט קל בעת ההצמדה האופקית (נשאר בינתיים)
    const ENABLE_DETAILED_SNAP_LOGGING = false; // ברירת מחדל: כבוי

    // State Variables
    let isDragging = false; let draggedElement = null; /* אין dragGroup*/
    let potentialSnapTarget = null; let initialMouseX = 0; let initialMouseY = 0;
    let initialElementX = 0; let initialElementY = 0; let programmingArea = null;
    let nextBlockId = 1;

    // ========================================================================
    // Initialization
    // ========================================================================
    function initializeLinkageSystem() {
        console.log("Attempting Linkage Init...");
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
        // console.log(`>>> handleMouseDown triggered!`); // הפכתי להערה זמנית
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) return;
        event.preventDefault(); isDragging = true; draggedElement = targetBlock;
        if (!draggedElement.id) { draggedElement.id = generateUniqueBlockId(); }
        // console.log(`   Dragging single block: ${draggedElement.id}`); // הפכתי להערה זמנית

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
        // if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag Start: ${draggedElement.id} ---`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        const deltaX = event.clientX - initialMouseX; const deltaY = event.clientY - initialMouseY;
        const newX = initialElementX + deltaX; const newY = initialElementY + deltaY;
        // if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`MouseMove: Setting ${draggedElement.id} to X=${newX.toFixed(0)}, Y=${newY.toFixed(0)}`); // הפכתי להערה
        draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`;
        findAndHighlightSnapTarget();
    }

    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        const currentDraggedElement = draggedElement;
        const currentTarget = potentialSnapTarget;
        const isValidSnapTarget = currentTarget && programmingArea && programmingArea.contains(currentTarget);
        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag End: ${currentDraggedElement.id}. Target: ${currentTarget ? currentTarget.id : 'None'} ---`);

        if (isValidSnapTarget) {
            linkBlocksHorizontally(currentTarget, currentDraggedElement);
        } else {
             if (programmingArea && currentDraggedElement) {
                 const areaRect = programmingArea.getBoundingClientRect();
                 let finalX = currentDraggedElement.offsetLeft; let finalY = currentDraggedElement.offsetTop;
                 const elemRect = currentDraggedElement.getBoundingClientRect();
                 // הגבלת גבולות עשויה להיות מיותרת אם אין קפיצות
                 // finalX = Math.max(0, Math.min(finalX, areaRect.width - elemRect.width));
                 // finalY = Math.max(0, Math.min(finalY, areaRect.height - elemRect.height));
                 // פשוט נשאיר את המיקום האחרון מה-mousemove
                 // currentDraggedElement.style.left = `${finalX}px`;
                 // currentDraggedElement.style.top = `${finalY}px`;
                 if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Placed single block ${currentDraggedElement.id} at final pos X=${finalX.toFixed(0)}, Y=${finalY.toFixed(0)} (no snap)`);
             }
        }
        clearSnapHighlighting();
        if(currentDraggedElement) {
             currentDraggedElement.style.zIndex = ''; currentDraggedElement.style.cursor = '';
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        isDragging = false; draggedElement = null; potentialSnapTarget = null;
        // console.log("--- MouseUp Finished ---"); // הפכתי להערה
    }

    function handleMouseLeave(event) { if (isDragging) { handleMouseUp(event); } }

    // ========================================================================
    // Drag Group Management (פונקציות לא בשימוש)
    // ========================================================================
    // function getVerticalBlockGroup(startBlock) { ... }
    // function updateVerticalDragGroupPosition(leaderX, leaderY) { ... }

    // ========================================================================
    // Snapping Logic (Horizontal - Highlight Dragged Only)
    // ========================================================================
    function findAndHighlightSnapTarget() {
        const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement;
        clearSnapHighlighting(); potentialSnapTarget = null;
        if (!isDragging || !draggedElement || !programmingArea) return;

        const dragRect = draggedElement.getBoundingClientRect();
        if (dragRect.height <= 0 || dragRect.width <= 0) return;
        const dragLeftConnector = { x: dragRect.left, y: dragRect.top + dragRect.height / 2 };
        let closestDistance = HORIZONTAL_SNAP_DISTANCE; let bestTarget = null;
        const allBlocks = programmingArea.querySelectorAll('.block-container');

        allBlocks.forEach(block => {
            if (block === draggedElement || block.dataset.rightBlockId) return;
            const targetRect = block.getBoundingClientRect();
            if (targetRect.height <= 0 || targetRect.width <= 0) return;
            const targetRightConnector = { x: targetRect.right - HORIZONTAL_SNAP_OFFSET, y: targetRect.top + targetRect.height / 2 };
            const dx = dragLeftConnector.x - targetRightConnector.x; const dy = dragLeftConnector.y - targetRightConnector.y;
            const horizontalDistance = Math.abs(dx); const verticalDistance = Math.abs(dy);

            if (horizontalDistance < closestDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) {
                closestDistance = horizontalDistance; bestTarget = block;
            }
        });

        if (bestTarget) {
            potentialSnapTarget = bestTarget; highlightSnapTarget(draggedElement, true);
            if (shouldLog) console.log(`--- Best H target: ${bestTarget.id}. Highlighting dragged ONLY. ---`);
        } else { highlightSnapTarget(draggedElement, false); if (shouldLog) console.log(`--- No H target found. ---`); }
    }

    function highlightSnapTarget(block, shouldHighlight) {
         if (block) { try { if (shouldHighlight) { block.classList.add('snap-highlight'); } else { block.classList.remove('snap-highlight'); } } catch (e) { /* ignore */ } }
    }
     function clearSnapHighlighting() {
         if (!programmingArea) return;
         const highlighted = programmingArea.querySelectorAll('.snap-highlight');
         highlighted.forEach(el => { try { el.classList.remove('snap-highlight'); } catch(e) { /* ignore */ } });
     }

    // ========================================================================
    // Linking Logic (Horizontal - Top Align Y, WITH Offset X)
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
        const targetY = leftBlock.offsetTop; // יישור לפי קצה עליון
        console.log(`  Calculated Target: X=${targetX.toFixed(0)}, Y=${targetY.toFixed(0)} (Offset: ${HORIZONTAL_SNAP_OFFSET})`);

        rightBlock.style.left = `${targetX}px`;
        rightBlock.style.top = `${targetY}px`;
        console.log(`  Set Style for ${rightBlock.id}`);

        // בדיקה אסינכרונית של המיקום הסופי
        setTimeout(() => {
            console.log(`  After Link (async) - Right [${rightBlock.id}]: FINAL L=${rightBlock.offsetLeft}, FINAL T=${rightBlock.offsetTop}`);
            // אפשר להוסיף כאן בדיקה אם המיקום הסופי שונה מהמחושב ולהדפיס אזהרה
            if (Math.abs(rightBlock.offsetLeft - targetX) > 1 || Math.abs(rightBlock.offsetTop - targetY) > 1) {
                 console.warn(`Position discrepancy detected for ${rightBlock.id}! Expected (${targetX.toFixed(0)}, ${targetY.toFixed(0)}), Got (${rightBlock.offsetLeft}, ${rightBlock.offsetTop})`);
            }
        }, 0);

        console.log(`Linked HORIZONTALLY ${leftBlock.id} -> ${rightBlock.id}.`);
    }

    // ========================================================================
    // Public API
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement) {
         if (!newBlockElement) return;
         if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); }
         try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("Reg Error", e); }
    };

})();
console.log("linkageimproved.js script finished execution (Horizontal Snap - Top Align Y - Pos Tuning).");
