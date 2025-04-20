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
        // console.log(`>>> handleMouseDown triggered!`);
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) return;
        event.preventDefault(); isDragging = true; draggedElement = targetBlock;
        if (!draggedElement.id) { draggedElement.id = generateUniqueBlockId(); }
        // console.log(`   Dragging single block: ${draggedElement.id}`);

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
        // if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`MouseMove: Setting ${draggedElement.id} to X=${newX.toFixed(0)}, Y=${newY.toFixed(0)}`);
        draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`;
        findAndHighlightSnapTarget();
    }

      // ========================================================
    // *** handleMouseUp - ניסיון אחרון לנטרול השפעות ***
    // ========================================================
    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;

        const currentDraggedElement = draggedElement; // שמור הפניות לפני איפוס גלובלי
        const currentTarget = potentialSnapTarget;
        const isValidSnapTarget = currentTarget && programmingArea && programmingArea.contains(currentTarget);

        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag End: ${currentDraggedElement.id}. Target: ${currentTarget ? currentTarget.id : 'None'} ---`);

        // קודם כל, הסר מאזינים גלובליים כדי למנוע אירועים נוספים
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        console.log("--- Global listeners removed ---"); // ודא שהמאזינים הוסרו

        // אפס את מצב הגרירה מיידית
        isDragging = false;
        draggedElement = null;
        potentialSnapTarget = null;
         // אין dragGroup לאפס

        // עכשיו בצע את ההצמדה או המיקום הסופי
        if (isValidSnapTarget) {
            linkBlocksHorizontally(currentTarget, currentDraggedElement);
            // *** סיום מיידי אחרי הצמדה! לא מבצעים ניקוי נוסף ***
            console.log("--- Snap performed, handleMouseUp exiting early ---");
            // החזרת הסגנון הרגיל לבלוקים תתבצע בפעם הבאה שילחצו עליהם
            return;
        } else {
             // אין הצמדה - רק וידוא מיקום סופי של הבלוק הנגרר
             if (programmingArea && currentDraggedElement) {
                 const areaRect = programmingArea.getBoundingClientRect();
                 let finalX = currentDraggedElement.offsetLeft; let finalY = currentDraggedElement.offsetTop;
                 const elemRect = currentDraggedElement.getBoundingClientRect();
                 finalX = Math.max(0, Math.min(finalX, areaRect.width - elemRect.width));
                 finalY = Math.max(0, Math.min(finalY, areaRect.height - elemRect.height));
                 currentDraggedElement.style.left = `${finalX}px`;
                 currentDraggedElement.style.top = `${finalY}px`;
                 if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Placed single block ${currentDraggedElement.id} at final pos X=${finalX.toFixed(0)}, Y=${finalY.toFixed(0)} (no snap)`);
             }
        }

        // ניקוי סגנונות (יתבצע רק אם לא הייתה הצמדה)
        clearSnapHighlighting();
        if(currentDraggedElement) {
             currentDraggedElement.style.zIndex = '';
             currentDraggedElement.style.cursor = '';
        }

        console.log("--- MouseUp Finished (No Snap Path) ---");
    }
    // ========================================================
    // *** סוף handleMouseUp החדש ***
    // ========================================================

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

    function highlightSnapTarget(block, shouldHighlight){ if (block) { try { if (shouldHighlight) { block.classList.add('snap-highlight'); } else { block.classList.remove('snap-highlight'); } } catch (e) { /* ignore */ } } }
    function clearSnapHighlighting(){ if (!programmingArea) return; const highlighted = programmingArea.querySelectorAll('.snap-highlight'); highlighted.forEach(el => { try { el.classList.remove('snap-highlight'); } catch(e) { /* ignore */ } }); }

    // ========================================================================
    // Linking Logic (Horizontal - Top Align Y, WITH Offset X)
    // ========================================================================
        // ========================================================================
    // Linking Logic (Horizontal - *** Using Transform for Positioning ***)
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        if (leftBlock.dataset.rightBlockId || rightBlock.dataset.leftBlockId) return;

        console.log(`Linking ${leftBlock.id} -> ${rightBlock.id} (Using Transform)`);
        console.log(`  Before Link - Left [${leftBlock.id}]: L=${leftBlock.offsetLeft}, T=${leftBlock.offsetTop}, W=${leftBlock.offsetWidth}`);
        console.log(`  Before Link - Right [${rightBlock.id}]: L=${rightBlock.offsetLeft}, T=${rightBlock.offsetTop}`);

        leftBlock.dataset.rightBlockId = rightBlock.id; rightBlock.dataset.leftBlockId = leftBlock.id;
        const leftWidth = leftBlock.offsetWidth;

        // חישוב מיקום היעד X ו-Y (כמו קודם, יישור עליון)
        const targetX = leftBlock.offsetLeft + leftWidth - HORIZONTAL_SNAP_OFFSET;
        const targetY = leftBlock.offsetTop;
        console.log(`  Calculated Target: X=${targetX.toFixed(0)}, Y=${targetY.toFixed(0)} (Offset: ${HORIZONTAL_SNAP_OFFSET})`);

        // *** שינוי: שימוש ב-transform במקום left/top ***
        // ודא שהבלוק מתחיל בלי transform קודם שיפריע
        rightBlock.style.transform = 'none';
        // הגדר left/top ל-0 והשתמש ב-translate
        rightBlock.style.left = '0px';
        rightBlock.style.top = '0px';
        rightBlock.style.transform = `translate(${targetX}px, ${targetY}px)`;
        console.log(`  Set Transform Style for ${rightBlock.id}`);

        // בדיקה אסינכרונית - נבדוק גם offset וגם transform
        setTimeout(() => {
            const finalLeft = rightBlock.offsetLeft;
            const finalTop = rightBlock.offsetTop;
            const finalTransform = window.getComputedStyle(rightBlock).transform;
            console.log(`  After Link (async) - Right [${rightBlock.id}]: FINAL L=${finalLeft}, T=${finalTop}, Transform=${finalTransform}`);

            // נבדוק אם ה-transform נשאר כפי שהגדרנו (בערך)
            // ניתוח ה-transform string הוא קצת מורכב, נדלג על הבדיקה האוטומטית בינתיים
            // ונבדוק ידנית בלוג אם ה-transform נראה כמו `matrix(1, 0, 0, 1, targetX, targetY)`

        }, 50); // ניתן עיכוב קצת יותר ארוך

        console.log(`Linked HORIZONTALLY ${leftBlock.id} -> ${rightBlock.id}.`);
    }

    // ========================================================================
    // Public API
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement){
         if (!newBlockElement) return;
         if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); }
         try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("Reg Error", e); }
    };

})();
console.log("linkageimproved.js script finished execution (Horizontal Snap - Top Align Y - Pos Tuning).");
