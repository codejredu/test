// --- START OF FILE linkageimproved.js ---

(function() {
    // ================= Configuration =================
    const SNAP_THRESHOLD = 20;
    const HORIZONTAL_OVERLAP_THRESHOLD = 0.4;
    const SNAP_GAP = 0;
    const LINK_SOUND_SRC = 'assets/sound/link.mp3';
    const DEBUG = true; // *** ודא שזה true ***
    const INDICATOR_CLASS = 'snap-indicator';

    // ================= State Variables =================
    let programmingArea = null;
    let currentlyDraggedBlock = null;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let linkSound = null;
    let programmingAreaRect = null;
    let currentIndicatorTarget = null;

    // ================= Logging Helper =================
    function log(...args) {
        if (DEBUG) {
            console.log("[LinkageImproved]", ...args);
        }
    }

    // ================= CSS for Indicator =================
    function addIndicatorStyles() {
        const styleId = 'linkage-styles';
        if (document.getElementById(styleId)) return;
        const css = `
            .${INDICATOR_CLASS} {
                outline: 2px dashed #007bff !important; /* !important למקרה שיש override */
                outline-offset: 2px;
                box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
            }
            .block-dragging {
                 opacity: 0.7;
                 cursor: grabbing !important;
                 /* מניעת אירועי הצבעה על הבלוק הנגרר עצמו בזמן גרירה */
                 pointer-events: none;
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
        addIndicatorStyles();

        try {
            linkSound = new Audio(LINK_SOUND_SRC);
             linkSound.addEventListener('canplaythrough', () => log("Audio ready."), { once: true });
             linkSound.addEventListener('error', (e) => console.error("[LinkageImproved] Error loading audio:", e), { once: true });
            log("Audio created:", LINK_SOUND_SRC);
        } catch (e) {
            console.error("[LinkageImproved] Could not create Audio object:", e);
        }

        // Add global listeners for mouse move and up
        document.addEventListener('mousemove', handleMouseMove); // חובה על document
        document.addEventListener('mouseup', handleMouseUp);   // חובה על document

        const observer = new MutationObserver(handleMutations);
        observer.observe(programmingArea, { childList: true });
        log("MutationObserver watching.");

        addListenersToExistingBlocks();

        log("Block linkage system initialized (Version Basic Snap + Indicator v2)");
        log(`Configuration: Snap Threshold=${SNAP_THRESHOLD}px, Overlap=${HORIZONTAL_OVERLAP_THRESHOLD*100}%, Gap=${SNAP_GAP}px`);
    }

    // ================= Block Discovery & Listener Setup =================
    function handleMutations(mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('block-container') && !node.classList.contains('in-palette')) {
                        addBlockListeners(node);
                        log("Listeners added to new block in area:", node.dataset.type, node.id || '(no id yet)');
                    }
                });
                mutation.removedNodes.forEach(node => { /* ... */ });
            }
        }
    }

    function addListenersToExistingBlocks() {
        const existingBlocks = programmingArea.querySelectorAll('.block-container:not(.in-palette)');
        existingBlocks.forEach(block => addBlockListeners(block));
        log(`Listeners added to ${existingBlocks.length} existing blocks in area.`);
    }

    function addBlockListeners(block) {
        if (!block.id) {
            block.id = generateUniqueId(block.dataset.type);
            log("Generated ID:", block.id);
        }
        block.removeEventListener('mousedown', handleMouseDown);
        block.addEventListener('mousedown', handleMouseDown); // הוסף מאזין לכל ה-div
    }

    function generateUniqueId(prefix = 'block') {
        return `${prefix}-${Math.random().toString(36).substring(2, 8)}`;
    }


    // ================= Drag Handling (Mouse Events) =================

    function handleMouseDown(event) {
        if (event.button !== 0) return; // רק כפתור שמאלי

        // מצא את ה-div הראשי של הבלוק שעליו לחצו
        const block = event.target.closest('.block-container');
        // ודא שזה בלוק חוקי בתוך אזור התכנות
        if (!block || !programmingArea.contains(block) || block.classList.contains('in-palette')) {
            // log("MouseDown ignored: Not a valid block in the programming area.");
            return;
        }

        // --- מנע התנהגויות ברירת מחדל שעלולות להפריע ---
        event.preventDefault();

        currentlyDraggedBlock = block;
        isDragging = true;

        programmingAreaRect = programmingArea.getBoundingClientRect(); // קבלת גבולות עדכניים
        const blockRect = currentlyDraggedBlock.getBoundingClientRect();

        // Offset של העכבר יחסית לפינה השמאלית-עליונה של הבלוק
        offsetX = event.clientX - blockRect.left;
        offsetY = event.clientY - blockRect.top;

        // סגנונות ויזואליים לגרירה
        currentlyDraggedBlock.style.zIndex = 1000;
        currentlyDraggedBlock.classList.add('block-dragging');

        log(`[MouseDown] Start custom drag: ${currentlyDraggedBlock.id}`); // לוג קריטי
    }

    function handleMouseMove(event) {
        // קודם כל בדוק אם אנחנו בכלל גוררים
        if (!isDragging || !currentlyDraggedBlock) {
            return;
        }
        // אין צורך ב-preventDefault כאן בדרך כלל

        log("[MouseMove] Event triggered."); // *** לוג חשוב לבדיקה! ***

        try {
            if (!programmingAreaRect) {
                 log("[MouseMove] Warning: programmingAreaRect missing, recalculating.");
                 programmingAreaRect = programmingArea.getBoundingClientRect();
                 if (!programmingAreaRect) { console.error("Cannot get programming area bounds!"); return; }
            }

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
            // log(`[MouseMove] Updated position: L=${newLeft.toFixed(0)}, T=${newTop.toFixed(0)}`); // לוג מעט רועש, אפשר להפעיל אם צריך

            // --- בדיקה והצגת אינדיקטור ---
            const potentialTarget = findSnapTarget(currentlyDraggedBlock);
            updateVisualIndicator(potentialTarget); // עדכון האינדיקטור

        } catch (error) {
            console.error("[LinkageImproved] Error in handleMouseMove:", error);
            // אפשר לעצור את הגרירה במקרה של שגיאה
            // isDragging = false; currentlyDraggedBlock = null;
        }
    }

    function handleMouseUp(event) {
        if (!isDragging || !currentlyDraggedBlock) {
            return;
        }
        // אין צורך ב-preventDefault כאן

        log(`[MouseUp] Releasing block ${currentlyDraggedBlock.id}. Checking for snap...`);

        // הסרת סגנונות גרירה ואינדיקטור
        currentlyDraggedBlock.style.zIndex = '';
        currentlyDraggedBlock.classList.remove('block-dragging');
        updateVisualIndicator(null); // נקה את האינדיקטור הנוכחי

        // --- מצא והפעל הצמדה ---
        const snapTarget = findSnapTarget(currentlyDraggedBlock); // בדוק שוב סופית

        if (snapTarget) {
            log(`[MouseUp] Found snap target: ${snapTarget.id}`);
            snapBlocks(currentlyDraggedBlock, snapTarget);
            if (linkSound && linkSound.readyState >= 4) {
                linkSound.currentTime = 0;
                linkSound.play().catch(e => console.warn("Audio play failed:", e));
                log("Played link sound.");
            } else {
                 log("Link sound not ready or not available.");
            }
        } else {
            log(`[MouseUp] No valid snap target found.`);
        }

        log(`[MouseUp] ----- End MouseUp for ${currentlyDraggedBlock.id} -----`);

        // ניקוי מצב
        isDragging = false;
        currentlyDraggedBlock = null;
        programmingAreaRect = null; // נקה את המטמון של גבולות האזור
    }

    // ================= Snapping Logic & Indicator =================

    function findSnapTarget(draggedBlock) {
        let bestTarget = null;
        let minDistance = SNAP_THRESHOLD;

        const draggedRect = draggedBlock.getBoundingClientRect();
        if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();

        // חפש רק בבלוקים שאינם הבלוק הנגרר כרגע
        const potentialTargets = programmingArea.querySelectorAll('.block-container:not(.block-dragging)');

        potentialTargets.forEach(potentialTarget => {
            // אין צורך לבדוק ש-ID שונה, כי הבלוק הנגרר מסונן כבר מהרשימה
            const targetRect = potentialTarget.getBoundingClientRect();

            // 1. בדיקה אנכית: האם החלק העליון של הנגרר קרוב לחלק התחתון של המטרה?
            const verticalDistance = Math.abs(draggedRect.top - (targetRect.bottom + SNAP_GAP));

            if (verticalDistance < minDistance) {
                // 2. בדיקה אופקית: האם יש חפיפה מספקת?
                const horizontalOverlap = Math.max(0, Math.min(draggedRect.right, targetRect.right) - Math.max(draggedRect.left, targetRect.left));
                const requiredOverlap = Math.min(draggedRect.width, targetRect.width) * HORIZONTAL_OVERLAP_THRESHOLD;

                if (horizontalOverlap >= requiredOverlap) {
                     // 3. בדיקת תאימות (אופציונלי, ניתן להרחיב)
                     minDistance = verticalDistance;
                     bestTarget = potentialTarget;
                     // log(`       Potential snap: ${draggedBlock.id} under ${potentialTarget.id}`);
                }
            }
        });
        return bestTarget;
    }

     function snapBlocks(blockToSnap, targetBlock) {
        if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();

        // חישוב מיקום חדש יחסית לאזור התכנות
        const newTop = targetRect.bottom - programmingAreaRect.top + SNAP_GAP;
        const newLeft = targetRect.left - programmingAreaRect.top; // יישור לשמאל של המטרה

        blockToSnap.style.top = `${newTop}px`;
        blockToSnap.style.left = `${newLeft}px`;

        log(`Snapped ${blockToSnap.id} to L:${newLeft.toFixed(0)}, T:${newTop.toFixed(0)} (under ${targetBlock.id})`);
    }

    // פונקציה מעודכנת ופשוטה יותר לניהול האינדיקטור
    function updateVisualIndicator(newTarget) {
        // log(`[UpdateIndicator] Target: ${newTarget ? newTarget.id : 'null'}. Current: ${currentIndicatorTarget ? currentIndicatorTarget.id : 'null'}`); // לוג רועש, הפעל אם צריך

        // אם המטרה לא השתנתה, אין מה לעשות
        if (newTarget === currentIndicatorTarget) {
            return;
        }

        // הסר את הסימון מהמטרה הקודמת (אם הייתה כזו)
        if (currentIndicatorTarget) {
            // log(`[UpdateIndicator] Removing indicator from ${currentIndicatorTarget.id}`);
            currentIndicatorTarget.classList.remove(INDICATOR_CLASS);
        }

        // הוסף סימון למטרה החדשה (אם יש כזו)
        if (newTarget) {
            log(`[UpdateIndicator] Adding indicator to ${newTarget.id}`); // לוג חשוב!
            newTarget.classList.add(INDICATOR_CLASS);
        }

        // עדכן את המשתנה שמחזיק את המטרה הנוכחית
        currentIndicatorTarget = newTarget;
    }


    // ================= Start Initialization =================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize(); // במקרה שהסקריפט נטען אחרי שה-DOM כבר מוכן
    }

})();

// --- END OF FILE linkageimproved.js ---
