// --- START OF FILE linkageimproved.js ---

(function() {
    // ================= Configuration =================
    const SNAP_THRESHOLD = 20;
    const HORIZONTAL_OVERLAP_THRESHOLD = 0.4;
    const SNAP_GAP = 0;
    const LINK_SOUND_SRC = 'assets/sound/link.mp3';
    const DEBUG = true;
    const INDICATOR_CLASS = 'snap-indicator'; // שם הקלאס לאינדיקטור

    // ================= State Variables =================
    let programmingArea = null;
    let currentlyDraggedBlock = null;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let linkSound = null;
    let programmingAreaRect = null;
    let currentIndicatorTarget = null; // בלוק המטרה הנוכחי שמסומן

    // ================= Logging Helper =================
    function log(...args) {
        if (DEBUG) {
            console.log("[LinkageImproved]", ...args);
        }
    }

    // ================= CSS for Indicator =================
    function addIndicatorStyles() {
        const styleId = 'linkage-styles';
        if (document.getElementById(styleId)) return; // הוסף רק פעם אחת

        const css = `
            .${INDICATOR_CLASS} {
                outline: 2px dashed #007bff; /* Blue dashed outline */
                outline-offset: 2px;
                box-shadow: 0 0 10px rgba(0, 123, 255, 0.5); /* Optional glow */
            }
            /* Style for the block being dragged (optional) */
            .block-dragging {
                 opacity: 0.7;
                 cursor: grabbing !important;
            }
        `;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
        log("Indicator styles added.");
    }

    // ================= Initialization =================
    function initialize() {
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("[LinkageImproved] Programming area (#program-blocks) not found!");
            return;
        }
        log("Programming area found.");

        addIndicatorStyles(); // הוספת סגנונות CSS

        // Prepare link sound
        try {
            linkSound = new Audio(LINK_SOUND_SRC);
             linkSound.addEventListener('canplaythrough', () => log("Audio ready."), { once: true });
             linkSound.addEventListener('error', (e) => console.error("[LinkageImproved] Error loading audio:", e), { once: true });
            log("Audio created:", LINK_SOUND_SRC);
        } catch (e) {
            console.error("[LinkageImproved] Could not create Audio object:", e);
        }

        // Add global listeners for mouse move and up
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Observe the programming area
        const observer = new MutationObserver(handleMutations);
        observer.observe(programmingArea, { childList: true });
        log("MutationObserver watching.");

        // Add listeners to any blocks already present
        addListenersToExistingBlocks();

        log("Block linkage system initialized (Version Basic Snap + Indicator)");
        log(`Configuration: Snap Threshold=${SNAP_THRESHOLD}px, Overlap=${HORIZONTAL_OVERLAP_THRESHOLD*100}%, Gap=${SNAP_GAP}px`);
    }

    // ================= Block Discovery & Listener Setup =================
    // handleMutations, addListenersToExistingBlocks, generateUniqueId - ללא שינוי מהגרסה הקודמת

    function handleMutations(mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('block-container') && !node.classList.contains('in-palette')) {
                        addBlockListeners(node); // הוסף מאזין רק לבלוקים באזור התכנות
                        log("Listeners added to new block in area:", node.dataset.type, node.id);
                    }
                });
                 mutation.removedNodes.forEach(node => { /* ... טיפול בהסרה ... */ });
            }
        }
    }

     function addListenersToExistingBlocks() {
        const existingBlocks = programmingArea.querySelectorAll('.block-container:not(.in-palette)'); // לא כולל בלוקים בפלטה
        existingBlocks.forEach(block => addBlockListeners(block));
        log(`Listeners added to ${existingBlocks.length} existing blocks in area.`);
    }

     function addBlockListeners(block) {
        if (!block.id) {
            block.id = generateUniqueId(block.dataset.type);
            log("Generated ID:", block.id);
        }
        block.removeEventListener('mousedown', handleMouseDown); // מניעת כפילות
        block.addEventListener('mousedown', handleMouseDown);
         // *** אין להפוך ל-draggable=true או להוסיף dragstart כאן ***
    }

     function generateUniqueId(prefix = 'block') {
         return `${prefix}-${Math.random().toString(36).substring(2, 8)}`;
     }


    // ================= Drag Handling (Mouse Events) =================

    function handleMouseDown(event) {
        // Only drag with left mouse button
        if (event.button !== 0) return;

        // Find the block container that was clicked on
        const block = event.target.closest('.block-container');
        // Ensure it's a block within our programming area and not from the palette
        if (!block || !programmingArea.contains(block) || block.classList.contains('in-palette')) {
            return;
        }

        event.preventDefault(); // *** חשוב: מונע התנהגות ברירת מחדל כמו גרירת טקסט/תמונה וגם את ה-dragstart של HTML5 ***

        currentlyDraggedBlock = block;
        isDragging = true;

        const blockRect = currentlyDraggedBlock.getBoundingClientRect();
        programmingAreaRect = programmingArea.getBoundingClientRect(); // עדכון גבולות האזור

        // חישוב offset ביחס לאזור התכנות
        offsetX = event.clientX - blockRect.left;
        offsetY = event.clientY - blockRect.top;

        currentlyDraggedBlock.style.zIndex = 1000;
        currentlyDraggedBlock.classList.add('block-dragging'); // הוספת קלאס לבלוק הנגרר

        log(`[MouseDown] Start custom drag: ${currentlyDraggedBlock.id}`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !currentlyDraggedBlock) return;
        // אין צורך ב-preventDefault כאן, זה יכול להפריע לגלילה וכו'

        let newLeft = event.clientX - programmingAreaRect.left - offsetX;
        let newTop = event.clientY - programmingAreaRect.top - offsetY;

        // Boundary checks
        const blockWidth = currentlyDraggedBlock.offsetWidth;
        const blockHeight = currentlyDraggedBlock.offsetHeight;
        const maxLeft = programmingAreaRect.width - blockWidth;
        const maxTop = programmingAreaRect.height - blockHeight;
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        currentlyDraggedBlock.style.left = `${newLeft}px`;
        currentlyDraggedBlock.style.top = `${newTop}px`;

        // --- בדיקה והצגת אינדיקטור ---
        const potentialTarget = findSnapTarget(currentlyDraggedBlock);
        updateVisualIndicator(potentialTarget); // פונקציה חדשה לניהול האינדיקטור
    }

    function handleMouseUp(event) {
        if (!isDragging || !currentlyDraggedBlock) return;
        // אין צורך ב-preventDefault

        log(`[MouseUp] Releasing block ${currentlyDraggedBlock.id}. Checking for snap...`);

        // הסרת סגנונות גרירה ואינדיקטור
        currentlyDraggedBlock.style.zIndex = '';
        currentlyDraggedBlock.classList.remove('block-dragging');
        updateVisualIndicator(null); // הסר את האינדיקטור הנוכחי

        // --- Find and Perform Snap ---
        const snapTarget = findSnapTarget(currentlyDraggedBlock); // בדוק שוב בסיום הגרירה

        if (snapTarget) {
            log(`[MouseUp] Found snap target: ${snapTarget.id}`);
            snapBlocks(currentlyDraggedBlock, snapTarget);
            if (linkSound && linkSound.readyState >= 4) { // readyState 4 (HAVE_ENOUGH_DATA) is safer
                linkSound.currentTime = 0;
                linkSound.play().catch(e => console.warn("Audio play failed:", e));
                log("Played link sound.");
            } else {
                 log("Link sound not ready or not available.");
            }
        } else {
            log(`[MouseUp] No valid snap target found.`);
            // Block remains where it was dropped (position already updated in mousemove)
        }

        log(`[MouseUp] ----- End MouseUp for ${currentlyDraggedBlock.id} -----`);

        // Clean up state
        isDragging = false;
        currentlyDraggedBlock = null;
        programmingAreaRect = null;
    }

    // ================= Snapping Logic & Indicator =================

    function findSnapTarget(draggedBlock) {
        // ... (הלוגיקה נשארת זהה לגרסה הקודמת) ...
        let bestTarget = null;
        let minDistance = SNAP_THRESHOLD;

        const draggedRect = draggedBlock.getBoundingClientRect();
        // חשוב לעדכן את גבולות האזור אם הם לא בתוקף
        if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();

        const allBlocks = programmingArea.querySelectorAll('.block-container:not(.block-dragging)'); // חפש רק בלוקים שאינם נגררים כרגע

        allBlocks.forEach(potentialTarget => {
            if (potentialTarget === draggedBlock || potentialTarget.id === draggedBlock.id) return;

            const targetRect = potentialTarget.getBoundingClientRect();

            // 1. Vertical Check
            const verticalDistance = Math.abs(draggedRect.top - (targetRect.bottom + SNAP_GAP));

            if (verticalDistance < minDistance) {
                // 2. Horizontal Check
                const horizontalOverlap = Math.max(0, Math.min(draggedRect.right, targetRect.right) - Math.max(draggedRect.left, targetRect.left));
                const requiredOverlap = Math.min(draggedRect.width, targetRect.width) * HORIZONTAL_OVERLAP_THRESHOLD;

                if (horizontalOverlap >= requiredOverlap) {
                     // 3. Compatibility Check (ניתן להרחיב)
                     // const isTargetEnd = ...
                     // const isDraggedEnd = ...
                     // if (compatible) {
                         minDistance = verticalDistance;
                         bestTarget = potentialTarget;
                         // log(`       Potential snap found for ${potentialTarget.id}`); // לוג מופעל רק ב-DEBUG
                    // }
                }
            }
        });

        return bestTarget; // מחזיר את הבלוק עצמו או null
    }

     function snapBlocks(blockToSnap, targetBlock) {
         // ... (הלוגיקה נשארת זהה) ...
        if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();

        const newTop = targetRect.bottom - programmingAreaRect.top + SNAP_GAP;
        const newLeft = targetRect.left - programmingAreaRect.top;

        blockToSnap.style.top = `${newTop}px`;
        blockToSnap.style.left = `${newLeft}px`;

        log(`Snapped ${blockToSnap.id} to L:${newLeft.toFixed(1)}, T:${newTop.toFixed(1)} (under ${targetBlock.id})`);
        // Optional: Store connection data
    }

    // פונקציה חדשה לניהול האינדיקטור
    function updateVisualIndicator(targetBlockToShow) {
         // אם יש בלוק ישן שמסומן והוא לא החדש, הסר ממנו את הסימון
        if (currentIndicatorTarget && currentIndicatorTarget !== targetBlockToShow) {
            currentIndicatorTarget.classList.remove(INDICATOR_CLASS);
            // log(`   Indicator removed from ${currentIndicatorTarget.id}`);
        }

        // אם יש בלוק חדש לסמן והוא לא כבר מסומן, סמן אותו
        if (targetBlockToShow && targetBlockToShow !== currentIndicatorTarget) {
             targetBlockToShow.classList.add(INDICATOR_CLASS);
             currentIndicatorTarget = targetBlockToShow; // עדכן מי מסומן כרגע
             log(`   Showing indicator on ${targetBlockToShow.id}`);
        }
         // אם אין בלוק חדש לסמן (targetBlockToShow is null), ודא שהקודם הוסר
         else if (!targetBlockToShow) {
             currentIndicatorTarget = null;
         }
    }


    // ================= Start Initialization =================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();

// --- END OF FILE linkageimproved.js ---
