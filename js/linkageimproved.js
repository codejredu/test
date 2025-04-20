 // ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Horizontal Snapping Detection (Left-to-Right)
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 40; // טווח הצמדה אופקי
    const VERTICAL_ALIGNMENT_TOLERANCE = 30; // כמה מותר הפרש גובה בין מרכזי הבלוקים
    const HORIZONTAL_SNAP_OFFSET = 2; // היסט קל בעת ההצמדה האופקית (למראה טוב יותר)
    const ENABLE_DETAILED_SNAP_LOGGING = true; // השאר לוגים פעילים

    // State Variables
    let isDragging = false;
    let draggedElement = null;
    let dragGroup = []; // חשוב: כרגע מטפל רק בשרשור אנכי! נצטרך לעדכן אם רוצים תנועה קבוצתית אופקית.
    let potentialSnapTarget = null; // הבלוק משמאל שאליו אולי נצמד
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
            console.warn(`Programming area (#program-blocks) has position: ${currentPosition}. Consider setting it to 'relative'.`);
        }
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("Mousedown listener attached to #program-blocks.");
        console.log("Linkage System Initialized for #program-blocks");
        prepareExistingBlocks();
    }
    function prepareExistingBlocks() { /* ... קוד זהה ... */
        const blocksInArea = programmingArea.querySelectorAll('.block-container');
        blocksInArea.forEach(block => {
            if (!block.id) { block.id = generateUniqueBlockId(); }
             if (!block.style.position || block.style.position === 'static') { block.style.position = 'absolute'; }
        });
         console.log(`Prepared ${blocksInArea.length} existing blocks.`);
    }
    function runInitialization() { /* ... קוד זהה ... */
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
        console.log(`>>> handleMouseDown triggered! Target:`, event.target);
        const targetBlock = event.target.closest('.block-container');
        console.log(`   Closest block-container found:`, targetBlock);
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) {
             console.log(`   MouseDown ignored: Not on a valid block.`); return;
        }
        event.preventDefault();
        isDragging = true;
        draggedElement = targetBlock;
        console.log(`   Set isDragging=true, draggedElement=`, draggedElement);
        if (!draggedElement.id) {
            draggedElement.id = generateUniqueBlockId();
            console.log(`   Assigned new ID during mousedown: ${draggedElement.id}`);
        }

        // --- Detaching Logic (*** צריך להוסיף ניתוק אופקי data-left/right בהמשך ***) ---
        const prevBlockId = draggedElement.dataset.prevBlockId; // ניתוק אנכי קיים
        if (prevBlockId) {
            const prevBlock = document.getElementById(prevBlockId);
            if (prevBlock) delete prevBlock.dataset.nextBlockId;
            delete draggedElement.dataset.prevBlockId;
            console.log(`   Detached Vertically ${draggedElement.id} from ${prevBlockId}`);
        }
        // ניתוק אופקי (מהבלוק משמאל)
        const leftBlockId = draggedElement.dataset.leftBlockId;
        if (leftBlockId) {
            const leftBlock = document.getElementById(leftBlockId);
            if (leftBlock) delete leftBlock.dataset.rightBlockId; // הסר קישור מהבלוק משמאל
            delete draggedElement.dataset.leftBlockId; // הסר קישור מהבלוק הנגרר
             console.log(`   Detached Horizontally ${draggedElement.id} from ${leftBlockId}`);
        }
        // --- סוף עדכון ניתוק ---

        // --- Grouping Logic (*** כרגע רק אנכי, צריך עדכון לתנועה אופקית קבוצתית ***) ---
        dragGroup = getVerticalBlockGroup(draggedElement); // השתמש בפונקציה הישנה בינתיים
        console.log(`   Calculated drag group (size ${dragGroup.length}) - Currently Vertical Only:`, dragGroup);

        initialMouseX = event.clientX; initialMouseY = event.clientY;
        initialElementX = draggedElement.offsetLeft; initialElementY = draggedElement.offsetTop;
        dragGroup.forEach((block, index) => { block.style.zIndex = 1000 + index; block.style.cursor = 'grabbing'; });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag Start: ${draggedElement.id} ---`);
        console.log(`>>> handleMouseDown finished processing.`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        const currentMouseX = event.clientX; const currentMouseY = event.clientY;
        const deltaX = currentMouseX - initialMouseX; const deltaY = currentMouseY - initialMouseY;
        const newX = initialElementX + deltaX; const newY = initialElementY + deltaY;
        draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`;
        // *** חשוב: עדכון מיקום קבוצתי כרגע אנכי בלבד ***
        updateVerticalDragGroupPosition(newX, newY);
        findAndHighlightSnapTarget(); // קורא ללוגיקת ההצמדה האופקית החדשה
    }

    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        const isValidSnapTarget = potentialSnapTarget && programmingArea && programmingArea.contains(potentialSnapTarget);
        if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`--- Drag End: ${draggedElement.id}. Potential target: ${potentialSnapTarget ? potentialSnapTarget.id : 'None'} ---`);

        if (isValidSnapTarget) {
             if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Attempting to link HORIZONTALLY ${potentialSnapTarget.id} (left) -> ${draggedElement.id} (right)`);
            linkBlocksHorizontally(potentialSnapTarget, draggedElement); // קרא לפונקציית הקישור האופקית החדשה
        } else {
            // מיקום רגיל אם אין הצמדה
             if (programmingArea && draggedElement) {
                 const areaRect = programmingArea.getBoundingClientRect();
                 const elemRect = draggedElement.getBoundingClientRect();
                 let finalX = draggedElement.offsetLeft; let finalY = draggedElement.offsetTop;
                 finalX = Math.max(0, Math.min(finalX, areaRect.width - elemRect.width));
                 finalY = Math.max(0, Math.min(finalY, areaRect.height - elemRect.height));
                 draggedElement.style.left = `${finalX}px`; draggedElement.style.top = `${finalY}px`;
                 // *** עדכון מיקום קבוצתי כרגע אנכי בלבד ***
                 updateVerticalDragGroupPosition(finalX, finalY);
                  if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Placed block ${draggedElement.id} at ${finalX}, ${finalY} (no snap)`);
             }
        }

        clearSnapHighlighting();
        dragGroup.forEach(block => { if (block) { block.style.zIndex = ''; block.style.cursor = ''; } });
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        isDragging = false; draggedElement = null; dragGroup = []; potentialSnapTarget = null;
    }

    function handleMouseLeave(event) {
         if (isDragging) { console.warn("Mouse left window during drag..."); handleMouseUp(event); }
    }

    // ========================================================================
    // Drag Group Management (שמות שונו לאנכי)
    // ========================================================================
    function getVerticalBlockGroup(startBlock) { // שם שונה
        const group = [startBlock]; let currentBlock = startBlock;
        while (currentBlock && currentBlock.dataset.nextBlockId) { // משתמש ב-next
            const nextId = currentBlock.dataset.nextBlockId;
            const nextBlock = document.getElementById(nextId);
            if (nextBlock && programmingArea && programmingArea.contains(nextBlock)) {
                group.push(nextBlock); currentBlock = nextBlock;
            } else { if (nextId) { console.warn(`Broken V-link...`); delete currentBlock.dataset.nextBlockId; } break; }
        }
        return group;
    }
    function updateVerticalDragGroupPosition(leaderX, leaderY) { // שם שונה
        if (dragGroup.length <= 1) return;
        let currentTop = leaderY; let currentLeft = leaderX; // עדיין מתיישר אופקית עם המוביל
        for (let i = 0; i < dragGroup.length; i++) {
            const block = dragGroup[i]; if (!block) continue;
            const blockHeight = block.offsetHeight;
             if (i === 0) { currentTop += blockHeight - VERTICAL_SNAP_OFFSET; }
             else { block.style.left = `${currentLeft}px`; block.style.top = `${currentTop}px`; currentTop += blockHeight - VERTICAL_SNAP_OFFSET; }
        }
    }

    // ========================================================================
    // Snapping Logic ( *** חדש - אופקי *** )
    // ========================================================================
    function findAndHighlightSnapTarget() {
        const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement;
        if (shouldLog) console.log(`--- findAndHighlightSnapTarget HORIZONTAL (${draggedElement.id}) ---`);

        clearSnapHighlighting();
        potentialSnapTarget = null;

        if (!isDragging || !draggedElement || !programmingArea) return;

        const dragRect = draggedElement.getBoundingClientRect();
        if (shouldLog) console.log(`Dragged (${draggedElement.id}): Rect T:${dragRect.top.toFixed(0)} L:${dragRect.left.toFixed(0)} W:${dragRect.width.toFixed(0)} H:${dragRect.height.toFixed(0)}`);
        if (dragRect.height <= 0 || dragRect.width <= 0) {
             if (shouldLog) console.warn(`Dragged block ${draggedElement.id} has invalid dimensions! H:${dragRect.height} W:${dragRect.width}`);
             return; // לא ניתן לחשב הצמדה לבלוק לא תקין
        }


        // נקודת חיבור: מרכז הקצה השמאלי של הבלוק הנגרר
        const dragLeftConnector = {
            x: dragRect.left,
            y: dragRect.top + dragRect.height / 2
        };
        if (shouldLog) console.log(`Dragged Left Connector: X:${dragLeftConnector.x.toFixed(0)} Y:${dragLeftConnector.y.toFixed(0)}`);

        let closestDistance = HORIZONTAL_SNAP_DISTANCE; // טווח אופקי
        let bestTarget = null;

        const allBlocks = programmingArea.querySelectorAll('.block-container');
        if (shouldLog) console.log(`Checking against ${allBlocks.length} blocks. HORIZONTAL_SNAP_DISTANCE = ${HORIZONTAL_SNAP_DISTANCE}, VERTICAL_ALIGNMENT_TOLERANCE = ${VERTICAL_ALIGNMENT_TOLERANCE}`);

        allBlocks.forEach(block => {
            const targetId = block.id || 'no-id';
            if (shouldLog) console.log(`\nChecking target: ${targetId}`);

            // Condition 1: Don't snap to self or group members (קבוצה כרגע אנכית, אבל עדיין נכון)
            if (dragGroup.includes(block)) {
                if (shouldLog) console.log(` -> Skip ${targetId}: Part of drag group.`); return;
            }

            // Condition 2: Can only snap to blocks that DON'T already have a block to their RIGHT
            if (block.dataset.rightBlockId) {
                if (shouldLog) console.log(` -> Skip ${targetId}: Already has rightBlockId (${block.dataset.rightBlockId}).`); return;
            }

            const targetRect = block.getBoundingClientRect();
            if (targetRect.height <= 0 || targetRect.width <= 0) {
                 if (shouldLog) console.warn(`Target block ${targetId} has invalid dimensions! Skipping.`);
                 return;
            }
            if (shouldLog) console.log(` -> Target (${targetId}): Rect T:${targetRect.top.toFixed(0)} L:${targetRect.left.toFixed(0)} R:${targetRect.right.toFixed(0)} W:${targetRect.width.toFixed(0)} H:${targetRect.height.toFixed(0)}`);

            // נקודת חיבור: מרכז הקצה הימני של בלוק המטרה
            const targetRightConnector = {
                x: targetRect.right - HORIZONTAL_SNAP_OFFSET, // קצה ימני (עם היסט קל)
                y: targetRect.top + targetRect.height / 2 // מרכז אנכי
            };
             if (shouldLog) console.log(` -> Target Right Connector: X:${targetRightConnector.x.toFixed(0)} Y:${targetRightConnector.y.toFixed(0)}`);

            // Condition 3: Calculate HORIZONTAL and VERTICAL distances
            const dx = dragLeftConnector.x - targetRightConnector.x; // הפרש אופקי
            const dy = dragLeftConnector.y - targetRightConnector.y; // הפרש אנכי
            const horizontalDistance = Math.abs(dx);
            const verticalDistance = Math.abs(dy);

            if (shouldLog) console.log(` -> Horiz Dist: ${horizontalDistance.toFixed(1)} (Need < ${closestDistance}). Vert Dist: ${verticalDistance.toFixed(1)} (Need < ${VERTICAL_ALIGNMENT_TOLERANCE})`);


            // Final Check: Both horizontal distance AND vertical alignment must be within tolerance
            if (horizontalDistance < closestDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) {
                 if (shouldLog) console.log(` ==> Potential Match Found (Horizontal + Vertical): ${targetId} is close enough.`);
                // שים לב: closestDistance מתעדכן עם המרחק האופקי
                closestDistance = horizontalDistance;
                bestTarget = block;
            } else {
                 if (shouldLog) console.log(` -> No Match: Horizontal (${horizontalDistance.toFixed(1)}) or Vertical (${verticalDistance.toFixed(1)}) failed.`);
            }
        }); // End forEach block

        if (bestTarget) {
            potentialSnapTarget = bestTarget;
            highlightSnapTarget(potentialSnapTarget, true);
            highlightSnapTarget(draggedElement, true);
             if (shouldLog) console.log(`--- Best target found (horizontally): ${bestTarget.id} ---`);
        } else {
            if (shouldLog) console.log(`--- No suitable target found (horizontally) ---`);
        }
    } // End findAndHighlightSnapTarget

    function highlightSnapTarget(block, shouldHighlight) { /* ... קוד זהה ... */
         if (block) { try { if (shouldHighlight) { block.classList.add('snap-highlight'); } else { block.classList.remove('snap-highlight'); } } catch (e) { console.error("Highlight error:", e, block); } }
    }
     function clearSnapHighlighting() { /* ... קוד זהה ... */
         if (!programmingArea) return;
         const highlighted = programmingArea.querySelectorAll('.snap-highlight');
         highlighted.forEach(el => { try { el.classList.remove('snap-highlight'); } catch(e) { console.error("Highlight removal error:", e, el); } });
     }

    // ========================================================================
    // Linking Logic ( *** חדש - אופקי *** )
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;

        // בדיקות נוספות לפני קישור
        if (leftBlock.dataset.rightBlockId) { console.warn(`Link H-aborted: Target ${leftBlock.id} already has right block`); return; }
        if (rightBlock.dataset.leftBlockId) { console.warn(`Link H-aborted: Source ${rightBlock.id} already has left block`); return; }

        // --- עדכון מאפייני ה-Data ---
        leftBlock.dataset.rightBlockId = rightBlock.id;
        rightBlock.dataset.leftBlockId = leftBlock.id;

        // --- מיקום סופי ---
        // מקם את הבלוק הימני (הנגרר) מיד לימין הבלוק השמאלי (המטרה)
        const leftRect = leftBlock.getBoundingClientRect(); // צריך גובה ליישור
        const targetX = leftBlock.offsetLeft + leftBlock.offsetWidth - HORIZONTAL_SNAP_OFFSET;
        const targetY = leftBlock.offsetTop; // יישור אנכי לקצה העליון של המטרה

        rightBlock.style.left = `${targetX}px`;
        rightBlock.style.top = `${targetY}px`;

        // *** חשוב: עדכון קבוצת הגרירה כרגע לא מטפל בשרשור אופקי! ***
        // updateHorizontalDragGroupPosition(targetX, targetY); // נצטרך פונקציה כזו אם רוצים תנועה קבוצתית אופקית

        console.log(`Linked HORIZONTALLY ${leftBlock.id} -> ${rightBlock.id} at pos (${targetX}, ${targetY})`);
    }

    // ========================================================================
    // Public API (ללא שינוי)
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement) { /* ... קוד זהה ... */
         if (ENABLE_DETAILED_SNAP_LOGGING) console.log("Executing registerNewBlockForLinkage...", newBlockElement);
         if (!newBlockElement) { console.error("registerNewBlockForLinkage called with null"); return; }
         if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Assigned new ID...`); }
         try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("!!! CRITICAL ERROR...", e, newBlockElement); }
          if (ENABLE_DETAILED_SNAP_LOGGING) console.log(`Successfully registered block ${newBlockElement.id} for linkage.`);
    };


})(); // IIFE to encapsulate scope
console.log("linkageimproved.js script finished execution (Horizontal Snap Detection).");
