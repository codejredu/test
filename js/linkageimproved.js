// --- START OF FILE linkageimproved.js ---
(function() {
    'use strict';

    // ================= Configuration =================
    const SNAP_THRESHOLD = 20; // נשאיר 20 בינתיים, נראה אם זה עובד
    const HORIZONTAL_OVERLAP_THRESHOLD = 0.4; // נשאיר 40% בינתיים
    const SNAP_GAP = 0;
    const LINK_SOUND_SRC = 'assets/sound/link.mp3';
    const DEBUG = true;
    const INDICATOR_CLASS = 'snap-indicator'; // הקלאס של הריבוע המקווקו

    // ================= State Variables =================
    let programmingArea = null;
    let currentlyDraggedBlock = null;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let linkSound = null;
    let programmingAreaRect = null;
    let currentIndicatorTarget = null; // ישמור את הבלוק שמסומן כרגע
    let observer = null;

    // ================= Logging Helper =================
    function log(...args) {
        if (DEBUG) {
            console.log("[LinkageImproved]", ...args);
        }
    }

    // ================= Utility Functions =================
    function generateUniqueId(prefix = 'block') {
        return `${prefix}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // ================= CSS Injection =================
    function addIndicatorStyles() {
        const styleId = 'linkage-styles';
        if (document.getElementById(styleId)) return;
        const css = `
            .${INDICATOR_CLASS} {
                outline: 2px dashed #007bff !important; /* קו מקווקו כחול */
                outline-offset: 2px; /* ריווח קטן מהבלוק */
                box-shadow: 0 0 8px rgba(0, 123, 255, 0.4); /* הצללה קלה (אופציונלי) */
            }
            .block-dragging { /* סגנון לבלוק הנגרר */
                 opacity: 0.7;
                 cursor: grabbing !important;
                 pointer-events: none; /* חשוב למנוע הפרעה לאירועים מתחת */
            }
        `;
        const style = document.createElement('style'); style.id = styleId; style.textContent = css;
        document.head.appendChild(style);
        log("Indicator styles added.");
    }

    // ================= Core Logic Functions =================

    function findSnapTarget(draggedBlock) {
        // (הפונקציה הזו נשארת כפי שהייתה בגרסה הקודמת, כולל הלוגים שמושארים כהערות)
        let bestTarget = null;
        let minDistance = SNAP_THRESHOLD;
        const draggedRect = draggedBlock.getBoundingClientRect();
        if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();
        const potentialTargets = programmingArea.querySelectorAll('.block-container:not(.block-dragging)');
        // log(`[findSnapTarget] Dragging ${draggedBlock.id} (${draggedRect.top.toFixed(0)}). Checking ${potentialTargets.length} targets.`);

        potentialTargets.forEach(potentialTarget => {
            const targetRect = potentialTarget.getBoundingClientRect();
            // log(`   [findSnapTarget] Eval: ${potentialTarget.id} (Bottom: ${targetRect.bottom.toFixed(0)})`);
            const verticalDistance = Math.abs(draggedRect.top - (targetRect.bottom + SNAP_GAP));
            // log(`      [findSnapTarget] VDist = |${draggedRect.top.toFixed(1)} - ${targetRect.bottom.toFixed(1)}| = ${verticalDistance.toFixed(1)} (Threshold: ${minDistance})`);
            if (verticalDistance < minDistance) {
                // log(`      [findSnapTarget] VDist OK. Checking HOverlap...`);
                const horizontalOverlap = Math.max(0, Math.min(draggedRect.right, targetRect.right) - Math.max(draggedRect.left, targetRect.left));
                const requiredOverlapWidth = Math.min(draggedRect.width, targetRect.width) * HORIZONTAL_OVERLAP_THRESHOLD;
                // log(`         [findSnapTarget] HOverlap = ${horizontalOverlap.toFixed(1)}, Required >= ${requiredOverlapWidth.toFixed(1)} (Threshold: ${HORIZONTAL_OVERLAP_THRESHOLD*100}%)`);
                if (horizontalOverlap >= requiredOverlapWidth) {
                    // log(`            [findSnapTarget] >>> HOverlap OK. ${potentialTarget.id} is a candidate! <<<`);
                    minDistance = verticalDistance;
                    bestTarget = potentialTarget;
                } // else { log(`            [findSnapTarget] HOverlap FAILED for ${potentialTarget.id}.`); }
            } // else { log(`      [findSnapTarget] VDist too large for ${potentialTarget.id}.`); }
        });

        // if (bestTarget) log(`[findSnapTarget] ---> Best target found: ${bestTarget.id} (at VDist ${minDistance.toFixed(1)}) <---`);
        // else log("[findSnapTarget] No suitable target found in this pass.");
        return bestTarget;
    }

    function snapBlocks(blockToSnap, targetBlock) {
        if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        const newTop = targetRect.bottom - programmingAreaRect.top + SNAP_GAP;
        const newLeft = targetRect.left - programmingAreaRect.top;
        blockToSnap.style.top = `${newTop}px`;
        blockToSnap.style.left = `${newLeft}px`;
        log(`Snapped ${blockToSnap.id} to L:${newLeft.toFixed(0)}, T:${newTop.toFixed(0)} (under ${targetBlock.id})`);
    }

    // *** הפונקציה שמנהלת את הוספה/הסרה של הקלאס מהמטרה ***
    function updateVisualIndicator(newTarget) {
        // אם המטרה זהה לקודמת, אין שינוי
        if (newTarget === currentIndicatorTarget) {
            return;
        }

        // אם הייתה מטרה קודמת, הסר ממנה את הסימון
        if (currentIndicatorTarget) {
            // log(`[UpdateIndicator] Removing indicator from ${currentIndicatorTarget.id}`); // לוג להסרה
            currentIndicatorTarget.classList.remove(INDICATOR_CLASS);
        }

        // אם יש מטרה חדשה, הוסף לה את הסימון
        if (newTarget) {
            log(`[UpdateIndicator] Adding indicator to ${newTarget.id}`); // *** לוג חשוב! ***
            newTarget.classList.add(INDICATOR_CLASS);
        }

        // עדכן את המשתנה שמחזיק את המטרה הנוכחית
        currentIndicatorTarget = newTarget;
    }

    // ================= Event Listener Setup =================

    function addBlockListeners(block) {
        // (הפונקציה הזו נשארת כפי שהייתה בגרסה הקודמת)
        log(`   [addBlockListeners] Attempting to add listener to:`, block.id || block.dataset.type || block);
        try {
            if (!block || typeof block.addEventListener !== 'function') { console.warn("   [addBlockListeners] Invalid block element passed."); return; }
            if (!block.id) { block.id = generateUniqueId(block.dataset.type); log(`      [addBlockListeners] Generated ID: ${block.id}`); }
            else { log(`      [addBlockListeners] Block already has ID: ${block.id}`); }
            block.removeEventListener('mousedown', handleMouseDown);
            block.addEventListener('mousedown', handleMouseDown);
            log(`      [addBlockListeners] Added mousedown listener successfully to ${block.id}`);
        } catch (e) { console.error(`   [addBlockListeners] Error adding listener to ${block.id || 'unknown block'}:`, e); }
    }

    function addListenersToExistingBlocks() {
        // (הפונקציה הזו נשארת כפי שהייתה בגרסה הקודמת)
        log("Running addListenersToExistingBlocks...");
        try {
            const existingBlocks = programmingArea.querySelectorAll('.block-container:not(.in-palette)');
            existingBlocks.forEach(block => addBlockListeners(block));
            log(`Listeners added/verified for ${existingBlocks.length} existing blocks in area.`);
        } catch (e) { console.error("[LinkageImproved] Error in addListenersToExistingBlocks:", e); }
    }


    // ================= Event Handlers =================

    function handleMouseDown(event) {
        // (הפונקציה הזו נשארת כפי שהייתה בגרסה הקודמת)
        log("[MouseDown] Event triggered on element:", event.target);
        if (event.button !== 0) return;
        const block = event.target.closest('.block-container');
        if (!block || !programmingArea.contains(block) || block.classList.contains('in-palette')) { log("[MouseDown] Ignored: Not a valid block in the programming area."); return; }
        event.preventDefault();
        currentlyDraggedBlock = block;
        isDragging = true;
        programmingAreaRect = programmingArea.getBoundingClientRect();
        const blockRect = currentlyDraggedBlock.getBoundingClientRect();
        offsetX = event.clientX - blockRect.left;
        offsetY = event.clientY - blockRect.top;
        currentlyDraggedBlock.style.zIndex = 1000;
        currentlyDraggedBlock.classList.add('block-dragging');
        log(`[MouseDown] Start custom drag: ${currentlyDraggedBlock.id}`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !currentlyDraggedBlock) return;
        // log("[MouseMove] Event triggered."); // נשאיר כהערה כרגע
        try {
            if (!programmingAreaRect) { log("[MouseMove] Warning: programmingAreaRect missing, recalculating."); programmingAreaRect = programmingArea.getBoundingClientRect(); if (!programmingAreaRect) { console.error("Cannot get programming area bounds!"); return; } }
            let newLeft = event.clientX - programmingAreaRect.left - offsetX;
            let newTop = event.clientY - programmingAreaRect.top - offsetY;
            const blockWidth = currentlyDraggedBlock.offsetWidth; const blockHeight = currentlyDraggedBlock.offsetHeight;
            const maxLeft = programmingAreaRect.width - blockWidth; const maxTop = programmingAreaRect.height - blockHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxLeft)); newTop = Math.max(0, Math.min(newTop, maxTop));
            currentlyDraggedBlock.style.left = `${newLeft}px`; currentlyDraggedBlock.style.top = `${newTop}px`;

            // --- מציאת מטרה ועדכון האינדיקטור ---
            const potentialTarget = findSnapTarget(currentlyDraggedBlock);
            updateVisualIndicator(potentialTarget); // *** קריאה לפונקציה שמטפלת באינדיקטור ***

        } catch (error) { console.error("[LinkageImproved] Error in handleMouseMove:", error); }
    }

    function handleMouseUp(event) {
        if (!isDragging || !currentlyDraggedBlock) return;
        log(`[MouseUp] Releasing block ${currentlyDraggedBlock.id}. Checking for snap...`);

        // --- ניקוי סגנונות ואינדיקטור ---
        currentlyDraggedBlock.style.zIndex = '';
        currentlyDraggedBlock.classList.remove('block-dragging');
        updateVisualIndicator(null); // *** קריאה לניקוי האינדיקטור בסיום הגרירה ***

        // --- בדיקה סופית והצמדה אם נמצאה מטרה ---
        const snapTarget = findSnapTarget(currentlyDraggedBlock); // בדיקה סופית
        if (snapTarget) {
            log(`[MouseUp] Found snap target: ${snapTarget.id}`);
            snapBlocks(currentlyDraggedBlock, snapTarget); // בצע הצמדה
            // השמע צליל
            if (linkSound && linkSound.readyState >= 4) { linkSound.currentTime = 0; linkSound.play().catch(e => console.warn("Audio play failed:", e)); log("Played link sound."); }
            else { log("Link sound not ready or not available."); }
        } else { log(`[MouseUp] No valid snap target found.`); }

        log(`[MouseUp] ----- End MouseUp for ${currentlyDraggedBlock.id} -----`);

        // --- ניקוי מצב ---
        isDragging = false; currentlyDraggedBlock = null; programmingAreaRect = null;
    }

    function handleMutations(mutationsList, obs) {
        // (הפונקציה הזו נשארת כפי שהייתה בגרסה הקודמת)
        log("[handleMutations] Callback triggered! Mutations count:", mutationsList.length);
        try {
            for (const mutation of mutationsList) {
                 // log(`   [handleMutations] Mutation type: ${mutation.type}, Added: ${mutation.addedNodes.length}, Removed: ${mutation.removedNodes.length}`);
                 if (mutation.type === 'childList') {
                     mutation.addedNodes.forEach((node, index) => {
                         // log(`      [handleMutations] Checking added node ${index}: Tag=${node.tagName}, Type=${node.nodeType}, Classes=${node.classList ? JSON.stringify(Array.from(node.classList)) : 'N/A'}`);
                         if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('block-container') && !node.classList.contains('in-palette')) {
                             // log(`         [handleMutations] Node IS a valid block in area! Adding listener...`);
                             addBlockListeners(node);
                         } // else { log(`         [handleMutations] Node is NOT a valid block in area or is in palette.`); }
                     });
                 }
             }
        } catch (mutationError) { console.error("[LinkageImproved] Error inside handleMutations callback:", mutationError); }
    }


    // ================= Initialization Function =================
    function initialize() {
        // (הפונקציה הזו נשארת כפי שהייתה בגרסה הקודמת)
        log("Attempting initialization...");
        try {
            programmingArea = document.getElementById("program-blocks");
            if (!programmingArea) { console.error("[LinkageImproved] CRITICAL: Programming area not found!"); return; }
            log("Programming area found.");
            addIndicatorStyles();
            try { /* Audio setup */ linkSound = new Audio(LINK_SOUND_SRC); linkSound.addEventListener('canplaythrough', () => log("Audio ready."), { once: true }); linkSound.addEventListener('error', (e) => console.error("[LinkageImproved] Error loading audio:", e), { once: true }); log("Audio created:", LINK_SOUND_SRC); }
            catch (audioError) { console.error("[LinkageImproved] Could not create Audio object:", audioError); }
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            log("Global mouse listeners added.");
            log("Setting up MutationObserver...");
            try { /* MutationObserver setup */ if (typeof handleMutations !== 'function') throw new Error("handleMutations is not defined!"); observer = new MutationObserver(handleMutations); observer.observe(programmingArea, { childList: true }); log("MutationObserver setup complete and actively watching."); }
            catch (observerError) { console.error("[LinkageImproved] CRITICAL: Failed to setup MutationObserver!", observerError); return; }
            addListenersToExistingBlocks();
            log("Block linkage system initialized (Version - Indicator Enabled)");
            log(`Configuration: Snap Threshold=${SNAP_THRESHOLD}px, Overlap=${HORIZONTAL_OVERLAP_THRESHOLD*100}%, Gap=${SNAP_GAP}px`);
            log("Initialization function finished successfully.");
        } catch (initError) { console.error("[LinkageImproved] CRITICAL ERROR during initialization:", initError); }
    }

    // ================= Start Initialization =================
    log("Script execution started. Waiting for DOMContentLoaded or initializing if ready.");
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        log("DOM already loaded, initializing immediately.");
        initialize();
    }

})();
// --- END OF FILE linkageimproved.js ---
