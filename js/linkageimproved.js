 // ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Yellow Proximity Highlight for Dragged Block
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 40; // טווח לקביעת יעד הצמדה פוטנציאלי
    const VERTICAL_ALIGNMENT_TOLERANCE = 30; // יישור אנכי כללי ליעד פוטנציאלי
    const HORIZONTAL_PROXIMITY_THRESHOLD = 15; // *** סף קרבה *אופקית* להדגשה צהובה ***
    const VERTICAL_PROXIMITY_THRESHOLD = 10;  // *** סף קרבה *אנכית* להדגשה צהובה ***
    const HORIZONTAL_SNAP_OFFSET = 0; // היסט בהצמדה עצמה
    const ENABLE_DETAILED_SNAP_LOGGING = true; // אפשר להפעיל לבדיקה

    // State Variables
    let isDragging = false; let draggedElement = null;
    let potentialSnapTarget = null; let initialMouseX = 0; let initialMouseY = 0;
    let initialElementX = 0; let initialElementY = 0; let programmingArea = null;
    let nextBlockId = 1;

    // Initialization (זהה לגרסה הקודמת)
    function initializeLinkageSystem(){ console.log("[Linkage] Attempting Init..."); programmingArea = document.getElementById("program-blocks"); if (!programmingArea) { console.error("[Linkage] ERROR: #program-blocks not found!"); return; } programmingArea.addEventListener('mousedown', handleMouseDown); console.log("[Linkage] System Initialized."); prepareExistingBlocks(); }
    function prepareExistingBlocks(){ const blocksInArea = programmingArea.querySelectorAll('.block-container'); blocksInArea.forEach(block => { if (!block.id) { block.id = generateUniqueBlockId(); } if (!block.style.position || block.style.position === 'static') { block.style.position = 'absolute'; } }); if(blocksInArea.length > 0) console.log(`[Linkage] Prepared ${blocksInArea.length} existing blocks.`); }
    function runInitialization(){ if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeLinkageSystem); } else { initializeLinkageSystem(); } }
    runInitialization();

    // Unique ID Generation (זהה)
    function generateUniqueBlockId() { return `block-proximity-${Date.now()}-${nextBlockId++}`; }

    // Event Handlers (זהה לגרסה הקודמת - ללא קבוצה)
    function handleMouseDown(event) { const targetBlock = event.target.closest('.block-container'); if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) return; event.preventDefault(); isDragging = true; draggedElement = targetBlock; if (!draggedElement.id) { draggedElement.id = generateUniqueBlockId(); } const prevBlockId = draggedElement.dataset.prevBlockId; if (prevBlockId) { const pb = document.getElementById(prevBlockId); if (pb) delete pb.dataset.nextBlockId; delete draggedElement.dataset.prevBlockId; } const leftBlockId = draggedElement.dataset.leftBlockId; if (leftBlockId) { const lb = document.getElementById(leftBlockId); if (lb) delete lb.dataset.rightBlockId; delete draggedElement.dataset.leftBlockId; } initialMouseX = event.clientX; initialMouseY = event.clientY; initialElementX = draggedElement.offsetLeft; initialElementY = draggedElement.offsetTop; draggedElement.style.zIndex = 1000; draggedElement.style.cursor = 'grabbing'; document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); document.addEventListener('mouseleave', handleMouseLeave); }
    function handleMouseMove(event) { if (!isDragging || !draggedElement) return; const deltaX = event.clientX - initialMouseX; const deltaY = event.clientY - initialMouseY; const newX = initialElementX + deltaX; const newY = initialElementY + deltaY; draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`; findAndHighlightSnapTarget(); }
    function handleMouseUp(event) { if (!isDragging || !draggedElement) return; const currentDraggedElement = draggedElement; const currentTarget = potentialSnapTarget; const isValidSnapTarget = currentTarget && programmingArea && programmingArea.contains(currentTarget); document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); document.removeEventListener('mouseleave', handleMouseLeave); isDragging = false; draggedElement = null; potentialSnapTarget = null; if (isValidSnapTarget) { linkBlocksHorizontally(currentTarget, currentDraggedElement); } clearSnapHighlighting(); if(currentDraggedElement) { currentDraggedElement.style.zIndex = ''; currentDraggedElement.style.cursor = ''; } console.log("--- MouseUp Finished ---"); }
    function handleMouseLeave(event) { if (isDragging) { handleMouseUp(event); } }

    // ========================================================================
    // Snapping Logic ( *** הדגשה צהובה בקרבה גבוהה *** )
    // ========================================================================
    function findAndHighlightSnapTarget() {
        const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement;
        clearSnapHighlighting(); // מנקה את ההדגשה הצהובה מהפעם הקודמת
        potentialSnapTarget = null; // מאפס את היעד הפוטנציאלי הכללי
        let showYellowHighlight = false; // דגל להדגשה הצהובה

        if (!isDragging || !draggedElement || !programmingArea) return;

        const dragRect = draggedElement.getBoundingClientRect();
        if (dragRect.height <= 0 || dragRect.width <= 0) return;
        const dragLeftConnector = { x: dragRect.left, y: dragRect.top + dragRect.height / 2 };

        let closestOverallDistance = HORIZONTAL_SNAP_DISTANCE; // למציאת היעד הכללי
        let bestOverallTarget = null;

        const allBlocks = programmingArea.querySelectorAll('.block-container');
        if (shouldLog) console.log(`Checking ${allBlocks.length} blocks. H_SNAP=${HORIZONTAL_SNAP_DISTANCE}, V_TOL=${VERTICAL_ALIGNMENT_TOLERANCE}, H_PROX=${HORIZONTAL_PROXIMITY_THRESHOLD}, V_PROX=${VERTICAL_PROXIMITY_THRESHOLD}`);

        allBlocks.forEach(block => {
            const targetId = block.id || 'no-id';
            if (block === draggedElement || block.dataset.rightBlockId) return;
            const targetRect = block.getBoundingClientRect();
            if (targetRect.height <= 0 || targetRect.width <= 0) return;

            const targetRightConnector = { x: targetRect.right - HORIZONTAL_SNAP_OFFSET, y: targetRect.top + targetRect.height / 2 };
            const dx = dragLeftConnector.x - targetRightConnector.x; const dy = dragLeftConnector.y - targetRightConnector.y;
            const horizontalDistance = Math.abs(dx); const verticalDistance = Math.abs(dy);

            if (shouldLog) console.log(` Target ${targetId}: H:${horizontalDistance.toFixed(1)}, V:${verticalDistance.toFixed(1)}`);

            // שלב 1: בדיקה אם הבלוק הזה הוא יעד *פוטנציאלי* להצמדה (טווח רחב יותר)
            if (horizontalDistance < closestOverallDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) {
                closestOverallDistance = horizontalDistance; // עדכון המרחק הקרוב ביותר שנמצא *עד כה*
                bestOverallTarget = block; // שמירת היעד הפוטנציאלי
                if (shouldLog) console.log(`  -> Potential Target Found: ${targetId}`);

                // שלב 2: בדיקה אם הבלוק הזה *מאוד קרוב* כדי להפעיל הדגשה צהובה
                if (horizontalDistance < HORIZONTAL_PROXIMITY_THRESHOLD && verticalDistance < VERTICAL_PROXIMITY_THRESHOLD) {
                    showYellowHighlight = true; // מצאנו לפחות אחד קרוב מספיק להדגשה
                    if (shouldLog) console.log(`  ==> VERY CLOSE! Enabling Yellow Highlight for ${targetId}`);
                }
            }
        });

        // אחרי שבדקנו את כל הבלוקים:
        potentialSnapTarget = bestOverallTarget; // קובעים את היעד הפוטנציאלי הכללי (אם נמצא)

        // מפעילים/מכבים את ההדגשה הצהובה *רק* על הבלוק הנגרר
        if (showYellowHighlight) {
            highlightSnapTargetYellow(draggedElement, true);
            if (shouldLog && bestOverallTarget) console.log(`--- Final decision: Best Target is ${bestOverallTarget.id}. YELLOW HIGHLIGHT ON for ${draggedElement.id}. ---`);
            else if (shouldLog) console.log(`--- Final decision: YELLOW HIGHLIGHT ON for ${draggedElement.id} (target might be slightly further). ---`);
        } else {
            highlightSnapTargetYellow(draggedElement, false);
            if (shouldLog && bestOverallTarget) console.log(`--- Final decision: Best Target is ${bestOverallTarget.id}. Yellow highlight OFF. ---`);
            else if (shouldLog) console.log(`--- Final decision: No suitable target found OR not close enough for yellow highlight. ---`);
        }
    }

    // *** פונקציה חדשה להדגשה צהובה ***
    function highlightSnapTargetYellow(block, shouldHighlight) {
         if (block) {
             try {
                 if (shouldHighlight) {
                     block.classList.add('snap-highlight-yellow'); // שימוש בקלאס החדש
                 } else {
                     block.classList.remove('snap-highlight-yellow'); // הסרת הקלאס החדש
                 }
             } catch (e) { console.error("Yellow highlight error", e); }
         }
    }

    // *** עדכון פונקציית הניקוי ***
     function clearSnapHighlighting() {
         if (!programmingArea) return;
         // הסר את כל סוגי ההדגשות האפשריים
         const highlighted = programmingArea.querySelectorAll('.snap-highlight-yellow, .snap-highlight, .snap-target, .snap-direction-left, .snap-direction-right');
         highlighted.forEach(el => {
             try { el.classList.remove('snap-highlight-yellow', 'snap-highlight', 'snap-target', 'snap-direction-left', 'snap-direction-right'); }
             catch(e) { /* ignore */ }
         });
     }

    // ========================================================================
    // Linking Logic (זהה לגרסה הקודמת - משתמש ב-left/top)
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        if (leftBlock.dataset.rightBlockId || rightBlock.dataset.leftBlockId) return;

        console.log(`[Linkage] Linking ${leftBlock.id} -> ${rightBlock.id} (Using Left/Top)`);
        // ... לוגים של Before ... (ניתן להסיר אם רוצים פחות רעש)
        // console.log(`[Linkage]   Before - Left [${leftBlock.id}]: L=${leftBlock.offsetLeft}, T=${leftBlock.offsetTop}, W=${leftBlock.offsetWidth}`);
        // console.log(`[Linkage]   Before - Right [${rightBlock.id}]: L=${rightBlock.offsetLeft}, T=${rightBlock.offsetTop}`);

        leftBlock.dataset.rightBlockId = rightBlock.id; rightBlock.dataset.leftBlockId = rightBlock.id;
        const leftWidth = leftBlock.offsetWidth;
        const targetX = leftBlock.offsetLeft + leftWidth - HORIZONTAL_SNAP_OFFSET;
        const targetY = leftBlock.offsetTop;
        // console.log(`[Linkage]   Calculated Target: X=${targetX.toFixed(0)}, Y=${targetY.toFixed(0)} (Offset: ${HORIZONTAL_SNAP_OFFSET})`);

        rightBlock.style.left = `${targetX}px`;
        rightBlock.style.top = `${targetY}px`;
        // console.log(`[Linkage]   Set Left/Top Style for ${rightBlock.id}`);

        // הסרתי את הבדיקה האסינכרונית כי הבעיה כנראה נפתרה
        // setTimeout(() => { ... }, 50);

        console.log(`[Linkage] Linked HORIZONTALLY ${leftBlock.id} -> ${rightBlock.id}.`);
    }

    // ========================================================================
    // Public API (זהה)
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement){ if (!newBlockElement) return; if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); } try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("Reg Error", e); } if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`[Linkage] Registered ${newBlockElement.id}.`); };

})();
console.log("linkageimproved.js script finished execution (Yellow Proximity Highlight).");
