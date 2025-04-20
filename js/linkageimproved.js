// ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Horizontal Snap - Using ONLY Left/Top Positioning
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 40;
    const VERTICAL_ALIGNMENT_TOLERANCE = 30;
    const HORIZONTAL_SNAP_OFFSET = 0; // *** איפוס ההיסט לניסיון ***
    const ENABLE_DETAILED_SNAP_LOGGING = false; // כיבוי לוגים מפורטים

    // State Variables
    let isDragging = false; let draggedElement = null;
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
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) return;
        event.preventDefault(); isDragging = true; draggedElement = targetBlock;
        if (!draggedElement.id) { draggedElement.id = generateUniqueBlockId(); }

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
        draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`; // הזזה ישירה
        findAndHighlightSnapTarget();
    }

    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        const currentDraggedElement = draggedElement;
        const currentTarget = potentialSnapTarget;
        const isValidSnapTarget = currentTarget && programmingArea && programmingArea.contains(currentTarget);

        // הסר מאזינים גלובליים מיד
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);

        if (isValidSnapTarget) {
            linkBlocksHorizontally(currentTarget, currentDraggedElement); // מבצע הצמדה ומיקום
        } else {
            // אין הצמדה - המיקום האחרון מ-mousemove נשאר
            if (ENABLE_DETAILED_SNAP_LOGGING && currentDraggedElement) {
                console.log(`Placed single block ${currentDraggedElement.id} at final pos (no snap)`);
            }
        }

        // ניקוי סופי
        clearSnapHighlighting();
        if(currentDraggedElement) {
             currentDraggedElement.style.zIndex = ''; currentDraggedElement.style.cursor = '';
        }
        isDragging = false; draggedElement = null; potentialSnapTarget = null;
         console.log("--- MouseUp Finished ---"); // הודעה בסוף
    }

    function handleMouseLeave(event) { if (isDragging) { handleMouseUp(event); } }

    // ========================================================================
    // Drag Group Management (Not Used Currently)
    // ========================================================================
    // ...

    // ========================================================================
    // Snapping Logic (זהה לגרסה קודמת - הדגשת נגרר)
    // ========================================================================
    function findAndHighlightSnapTarget(){ const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement; clearSnapHighlighting(); potentialSnapTarget = null; if (!isDragging || !draggedElement || !programmingArea) return; const dragRect = draggedElement.getBoundingClientRect(); if (dragRect.height <= 0 || dragRect.width <= 0) return; const dragLeftConnector = { x: dragRect.left, y: dragRect.top + dragRect.height / 2 }; let closestDistance = HORIZONTAL_SNAP_DISTANCE; let bestTarget = null; const allBlocks = programmingArea.querySelectorAll('.block-container'); allBlocks.forEach(block => { if (block === draggedElement || block.dataset.rightBlockId) return; const targetRect = block.getBoundingClientRect(); if (targetRect.height <= 0 || targetRect.width <= 0) return; const targetRightConnector = { x: targetRect.right - HORIZONTAL_SNAP_OFFSET, y: targetRect.top + targetRect.height / 2 }; const dx = dragLeftConnector.x - targetRightConnector.x; const dy = dragLeftConnector.y - targetRightConnector.y; const horizontalDistance = Math.abs(dx); const verticalDistance = Math.abs(dy); if (horizontalDistance < closestDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) { closestDistance = horizontalDistance; bestTarget = block; } }); if (bestTarget) { potentialSnapTarget = bestTarget; highlightSnapTarget(draggedElement, true); if (shouldLog) console.log(`--- Best H target: ${bestTarget.id}. Highlighting dragged ONLY. ---`); } else { highlightSnapTarget(draggedElement, false); if (shouldLog) console.log(`--- No H target found. ---`); } }
    function highlightSnapTarget(block, shouldHighlight){ if (block) { try { if (shouldHighlight) { block.classList.add('snap-highlight'); } else { block.classList.remove('snap-highlight'); } } catch (e) { /* ignore */ } } }
    function clearSnapHighlighting(){ if (!programmingArea) return; const highlighted = programmingArea.querySelectorAll('.snap-highlight'); highlighted.forEach(el => { try { el.classList.remove('snap-highlight'); } catch(e) { /* ignore */ } }); }

    // ========================================================================
    // Linking Logic ( *** Horizontal - Using ONLY Left/Top *** )
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        if (leftBlock.dataset.rightBlockId || rightBlock.dataset.leftBlockId) return; // Prevent double linking

        console.log(`Linking ${leftBlock.id} -> ${rightBlock.id} (Using Left/Top)`);
        console.log(`  Before Link - Left [${leftBlock.id}]: L=${leftBlock.offsetLeft}, T=${leftBlock.offsetTop}, W=${leftBlock.offsetWidth}`);
        console.log(`  Before Link - Right [${rightBlock.id}]: L=${rightBlock.offsetLeft}, T=${rightBlock.offsetTop}`);

        leftBlock.dataset.rightBlockId = rightBlock.id; rightBlock.dataset.leftBlockId = leftBlock.id;

        const leftWidth = leftBlock.offsetWidth;
        // חישוב מיקום היעד X ו-Y
        const targetX = leftBlock.offsetLeft + leftWidth - HORIZONTAL_SNAP_OFFSET; // שימוש ב-offset=0 כרגע
        const targetY = leftBlock.offsetTop; // יישור לפי קצה עליון
        console.log(`  Calculated Target: X=${targetX.toFixed(0)}, Y=${targetY.toFixed(0)} (Offset: ${HORIZONTAL_SNAP_OFFSET})`);

        // *** הגדרת המיקום ישירות עם left/top ***
        rightBlock.style.left = `${targetX}px`;
        rightBlock.style.top = `${targetY}px`;
        // *** לא משתמשים ב-transform ***
        // rightBlock.style.transform = 'none';

        console.log(`  Set Left/Top Style for ${rightBlock.id}`);

        // בדיקה אסינכרונית של המיקום הסופי
        setTimeout(() => {
            const finalLeft = rightBlock.offsetLeft;
            const finalTop = rightBlock.offsetTop;
            console.log(`  After Link (async) - Right [${rightBlock.id}]: FINAL L=${finalLeft}, FINAL T=${finalTop}`);
            if (Math.abs(finalLeft - targetX) > 1 || Math.abs(finalTop - targetY) > 1) {
                 console.warn(`Position discrepancy STILL detected for ${rightBlock.id}! Expected (${targetX.toFixed(0)}, ${targetY.toFixed(0)}), Got (${finalLeft}, ${finalTop})`);
                 // אם זה עדיין קורה, הבעיה כנראה לא קשורה ל-transform אלא למשהו אחר לגמרי.
            }
        }, 50); // עיכוב קל

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
console.log("linkageimproved.js script finished execution (Using ONLY Left/Top).");
