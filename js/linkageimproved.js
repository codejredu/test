// ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Puzzle Connector Snapping Logic
// ========================================================================

(function() {
    // Configuration
    const PUZZLE_CONNECTOR_WIDTH = 8; // רוחב אזור השקע/בליטה (בערך)
    const HORIZONTAL_SNAP_DISTANCE = 20; // מרחק אופקי קטן יותר להצמדה מדויקת יותר
    const VERTICAL_ALIGNMENT_TOLERANCE = 15; // יישור אנכי הדוק יותר
    const ENABLE_LOGGING = true; // הפעלת לוגים לבדיקה

    // State Variables
    let isDragging = false; let draggedElement = null;
    let potentialSnapTarget = null; // הבלוק משמאל שאליו אולי נצמד
    let initialMouseX = 0; let initialMouseY = 0;
    let initialElementX = 0; let initialElementY = 0; let programmingArea = null;
    let nextBlockId = 1;

    // ========================================================================
    // Initialization
    // ========================================================================
    function initializeLinkageSystem() {
        if (ENABLE_LOGGING) console.log("[PuzzleLink] Attempting Init...");
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) { console.error("[PuzzleLink] ERROR: #program-blocks not found!"); return; }
        programmingArea.addEventListener('mousedown', handleMouseDown);
        if (ENABLE_LOGGING) console.log("[PuzzleLink] System Initialized.");
        prepareExistingBlocks();
    }
    function prepareExistingBlocks() {
        const blocksInArea = programmingArea.querySelectorAll('.block-container');
        blocksInArea.forEach(block => {
            if (!block.id) { block.id = generateUniqueBlockId(); }
            if (!block.style.position || block.style.position === 'static') { block.style.position = 'absolute'; }
        });
        if (blocksInArea.length > 0) console.log(`[PuzzleLink] Prepared ${blocksInArea.length} existing blocks.`);
    }
    function runInitialization() {
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeLinkageSystem); }
        else { setTimeout(initializeLinkageSystem, 0); } // עיכוב קל
    }
    runInitialization();

    // ========================================================================
    // Unique ID Generation
    // ========================================================================
    function generateUniqueBlockId() { return `block-puzzle-${Date.now()}-${nextBlockId++}`; }

    // ========================================================================
    // Event Handlers
    // ========================================================================
    function handleMouseDown(event) {
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) return;
        // אם הבלוק כבר מחובר מימין (יש לו leftBlockId), נתפוס רק אותו
        // אם הוא מחובר משמאל (יש לו rightBlockId), צריך לתפוס את כל השרשרת מימין (לא ממומש כרגע)
        // אם הוא מחובר מלמעלה, נתפוס את כל השרשרת מתחת (לא ממומש כרגע)

        event.preventDefault(); isDragging = true; draggedElement = targetBlock;
        if (!draggedElement.id) { draggedElement.id = generateUniqueBlockId(); }
        if (ENABLE_LOGGING) console.log(`[PuzzleLink] Drag Start: ${draggedElement.id}`);

        // --- Detaching Logic ---
        // ניתוק מהבלוק משמאל (אם קיים)
        const leftBlockId = draggedElement.dataset.leftBlockId;
        if (leftBlockId) {
            const leftBlock = document.getElementById(leftBlockId);
            if (leftBlock) {
                delete leftBlock.dataset.rightBlockId;
                leftBlock.classList.remove('connected-right'); // הסרת קלאס CSS
                if (ENABLE_LOGGING) console.log(`[PuzzleLink] Detached ${draggedElement.id} from Left: ${leftBlockId}`);
            }
            delete draggedElement.dataset.leftBlockId;
            draggedElement.classList.remove('connected-left'); // הסרת קלאס CSS
        }
        // ניתוק מהבלוק מימין (אם קיים - לא יזוז איתנו כרגע)
         const rightBlockId = draggedElement.dataset.rightBlockId;
         if (rightBlockId) {
             const rightBlock = document.getElementById(rightBlockId);
             if (rightBlock) {
                 delete rightBlock.dataset.leftBlockId;
                 rightBlock.classList.remove('connected-left');
                 if (ENABLE_LOGGING) console.log(`[PuzzleLink] Detached Right block ${rightBlockId} from ${draggedElement.id}`);
             }
             delete draggedElement.dataset.rightBlockId;
             draggedElement.classList.remove('connected-right');
         }
         // ניתוק מהבלוק מלמעלה (אם קיים)
        const prevBlockId = draggedElement.dataset.prevBlockId;
        if (prevBlockId) {
             const prevBlock = document.getElementById(prevBlockId);
             if (prevBlock) { delete prevBlock.dataset.nextBlockId; /* להוסיף הסרת קלאס אנכי אם יש */ }
             delete draggedElement.dataset.prevBlockId;
             /* להוסיף הסרת קלאס אנכי אם יש */
             if (ENABLE_LOGGING) console.log(`[PuzzleLink] Detached ${draggedElement.id} from Top: ${prevBlockId}`);
         }


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
        findAndHighlightSnapTarget(); // הלוגיקה החדשה
    }

    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        const currentDraggedElement = draggedElement;
        const currentTarget = potentialSnapTarget;
        const isValidSnapTarget = currentTarget && programmingArea && programmingArea.contains(currentTarget);

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);

        isDragging = false; draggedElement = null; potentialSnapTarget = null; // איפוס לפני הקישור

        if (isValidSnapTarget) {
            linkBlocksHorizontally(currentTarget, currentDraggedElement); // הצמדה ומיקום
            // הפעלת אנימציה קצרה
            currentTarget.classList.add('connection-animation');
            currentDraggedElement.classList.add('connection-animation');
            setTimeout(() => {
                currentTarget.classList.remove('connection-animation');
                currentDraggedElement.classList.remove('connection-animation');
            }, 400); // משך האנימציה מ-CSS
        } else {
            // מיקום סופי רגיל אם אין הצמדה
             if (programmingArea && currentDraggedElement) {
                 let finalX = currentDraggedElement.offsetLeft; let finalY = currentDraggedElement.offsetTop;
                 // אין צורך בתיקון גבולות כרגע
                 // console.log(`[PuzzleLink] Placed ${currentDraggedElement.id} at ${finalX}, ${finalY} (no snap)`);
             }
        }

        // ניקוי סופי של סגנונות גרירה והדגשה
        clearSnapHighlighting(); // הסרת קלאסי snap
        if(currentDraggedElement) {
             currentDraggedElement.style.zIndex = '';
             currentDraggedElement.style.cursor = '';
        }
        if (ENABLE_LOGGING) console.log("[PuzzleLink] --- MouseUp Finished ---");
    }

    function handleMouseLeave(event) { if (isDragging) { handleMouseUp(event); } }

    // ========================================================================
    // Snapping Logic ( Puzzle Connector Version )
    // ========================================================================
    function findAndHighlightSnapTarget() {
        const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement;
        clearSnapHighlighting(); // תמיד מנקה קודם
        potentialSnapTarget = null;

        if (!isDragging || !draggedElement || !programmingArea) return;

        const dragRect = draggedElement.getBoundingClientRect();
        if (dragRect.height <= 0 || dragRect.width <= 0) return;

        // נקודת חיבור: מרכז השקע בצד שמאל של הבלוק הנגרר
        const dragNotchCenter = {
            x: dragRect.left + (PUZZLE_CONNECTOR_WIDTH / 2), // קרוב לקצה השמאלי
            y: dragRect.top + dragRect.height / 2
        };

        let closestDistance = HORIZONTAL_SNAP_DISTANCE;
        let bestTarget = null;

        const allBlocks = programmingArea.querySelectorAll('.block-container');

        allBlocks.forEach(block => {
            const targetId = block.id || 'no-id';
            if (block === draggedElement || block.dataset.rightBlockId || draggedElement.dataset.leftBlockId) {
                 // דלג על עצמך, על מטרות שכבר מחוברות מימין, או אם הנגרר כבר מחובר משמאל
                 return;
            }

            const targetRect = block.getBoundingClientRect();
            if (targetRect.height <= 0 || targetRect.width <= 0) return;

            // נקודת חיבור: מרכז הבליטה בצד ימין של בלוק המטרה
            const targetBumpCenter = {
                x: targetRect.right - (PUZZLE_CONNECTOR_WIDTH / 2), // קרוב לקצה הימני
                y: targetRect.top + targetRect.height / 2
            };

            const dx = dragNotchCenter.x - targetBumpCenter.x;
            const dy = dragNotchCenter.y - targetBumpCenter.y;
            const horizontalDistance = Math.abs(dx);
            const verticalDistance = Math.abs(dy);

            if (horizontalDistance < closestDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) {
                 if (shouldLog) console.log(`[PuzzleLink] ==> Potential Match: ${targetId} (H:${horizontalDistance.toFixed(0)}, V:${verticalDistance.toFixed(0)})`);
                closestDistance = horizontalDistance;
                bestTarget = block;
            }
        });

        if (bestTarget) {
            potentialSnapTarget = bestTarget;
            // הוספת קלאסים להדגשה ויזואלית לפי ה-CSS החדש
            draggedElement.classList.add('snap-highlight', 'snap-direction-right');
            potentialSnapTarget.classList.add('snap-target', 'snap-direction-left');
            if (shouldLog) console.log(`[PuzzleLink] --- Best target found: ${bestTarget.id}. Added snap classes. ---`);
        }
        // אם לא נמצא יעד, clearSnapHighlighting כבר ניקה את הקלאסים בתחילת הפונקציה
    }

    function highlightSnapTarget(block, classToAdd) { // פונקציה זו הוחלפה בלוגיקה ב-findAndHighlight...
         // ניתן למחוק או להשאיר ריקה
    }

     function clearSnapHighlighting() {
         if (!programmingArea) return;
         const highlighted = programmingArea.querySelectorAll('.snap-highlight, .snap-target, .snap-direction-left, .snap-direction-right');
         highlighted.forEach(el => {
             el.classList.remove('snap-highlight', 'snap-target', 'snap-direction-left', 'snap-direction-right');
         });
     }

    // ========================================================================
    // Linking Logic ( Puzzle Connector Version )
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        if (leftBlock.dataset.rightBlockId || rightBlock.dataset.leftBlockId) return;

        if (ENABLE_LOGGING) console.log(`[PuzzleLink] Linking ${leftBlock.id} -> ${rightBlock.id}`);

        leftBlock.dataset.rightBlockId = rightBlock.id;
        rightBlock.dataset.leftBlockId = leftBlock.id;

        // חישוב מיקום ההצמדה המדויק של הפאזל
        const leftWidth = leftBlock.offsetWidth;
        const targetX = leftBlock.offsetLeft + leftWidth - PUZZLE_CONNECTOR_WIDTH; // מיקום שמאל הנגרר
        const targetY = (leftBlock.offsetTop + leftBlock.offsetHeight / 2) - (rightBlock.offsetHeight / 2); // יישור מרכז אנכי

        if (ENABLE_LOGGING) console.log(`[PuzzleLink]   Calculated Target: X=${targetX.toFixed(0)}, Y=${targetY.toFixed(0)}`);

        rightBlock.style.left = `${targetX}px`;
        rightBlock.style.top = `${targetY}px`;

        // הוספת קלאסים של חיבור
        leftBlock.classList.add('connected-right');
        rightBlock.classList.add('connected-left');

        if (ENABLE_LOGGING) console.log(`[PuzzleLink] Linked & Positioned ${leftBlock.id} -> ${rightBlock.id}. Added connection classes.`);

         // אין צורך בבדיקת פער אסינכרונית כרגע, הבעיה הקודמת נפתרה כנראה
    }

    // ========================================================================
    // Public API
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement) {
         if (!newBlockElement) return;
         if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); }
         try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("Reg Error", e); }
         if (ENABLE_LOGGING) console.log(`[PuzzleLink] Registered block ${newBlockElement.id}.`);
    };

})();
console.log("linkageimproved.js script finished execution (Puzzle Connector Logic).");
