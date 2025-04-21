// --- START OF FILE linkageimproved.js ---
(function() {
    'use strict';

    // ================= Configuration =================
    const SNAP_THRESHOLD = 20;
    const HORIZONTAL_OVERLAP_THRESHOLD = 0.4;
    const SNAP_GAP = 0;
    const LINK_SOUND_SRC = 'assets/sound/link.mp3';
    const DEBUG = true;
    const TARGET_INDICATOR_CLASS = 'snap-indicator'; // קלאס לאינדיקטור על המטרה
    const DRAGGED_NEAR_CLASS = 'dragged-block-near-target'; // *** קלאס חדש לבלוק הנגרר ***

    // ================= State Variables =================
    let programmingArea = null;
    let currentlyDraggedBlock = null;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let linkSound = null;
    let programmingAreaRect = null;
    let currentIndicatorTarget = null; // המטרה הנוכחית שמסומנת עם TARGET_INDICATOR_CLASS
    let observer = null;

    // ================= Logging Helper =================
    function log(...args) { if (DEBUG) console.log("[LinkageImproved]", ...args); }

    // ================= Utility Functions =================
    function generateUniqueId(prefix = 'block') { return `${prefix}-${Math.random().toString(36).substring(2, 8)}`; }

    // ================= CSS Injection =================
    function addIndicatorStyles() {
        const styleId = 'linkage-styles';
        if (document.getElementById(styleId)) return;
        const css = `
            .${TARGET_INDICATOR_CLASS} { /* אינדיקטור על המטרה */
                outline: 2px dashed #007bff !important;
                outline-offset: 2px;
                box-shadow: 0 0 8px rgba(0, 123, 255, 0.4);
            }
            .${DRAGGED_NEAR_CLASS} { /* *** סגנון חדש לבלוק הנגרר כשקרוב *** */
                outline: 2px solid #28a745 !important; /* מתאר ירוק רציף */
                outline-offset: -1px; /* צמוד יותר לגבול הבלוק */
                box-shadow: 0 0 10px rgba(40, 167, 69, 0.6); /* הצללה ירוקה */
            }
            .block-dragging { /* סגנון רגיל לבלוק נגרר */
                 opacity: 0.7;
                 cursor: grabbing !important;
                 pointer-events: none;
            }
        `;
        const style = document.createElement('style'); style.id = styleId; style.textContent = css;
        document.head.appendChild(style);
        log("Indicator styles added (including dragged-near).");
    }

    // ================= Core Logic Functions =================
    // findSnapTarget, snapBlocks - ללא שינוי
    function findSnapTarget(draggedBlock) { /* ... (כמו קודם) ... */ return null; } // השאר עם הערות לוג פנימיות
    function snapBlocks(blockToSnap, targetBlock) { /* ... (כמו קודם) ... */ }

    // הפונקציה הזו תמשיך לטפל באינדיקטור על המטרה (קו כחול מקווקו)
    function updateTargetIndicator(newTarget) {
        if (newTarget === currentIndicatorTarget) return;
        if (currentIndicatorTarget) {
            currentIndicatorTarget.classList.remove(TARGET_INDICATOR_CLASS);
        }
        if (newTarget) {
            log(`[UpdateTargetIndicator] Adding target indicator to ${newTarget.id}`);
            newTarget.classList.add(TARGET_INDICATOR_CLASS);
        }
        currentIndicatorTarget = newTarget;
    }

    // ================= Event Listener Setup =================
    // addBlockListeners, updateAllBlockListeners - ללא שינוי
    function addBlockListeners(block) { /* ... (כמו קודם) ... */ }
    function updateAllBlockListeners() { /* ... (כמו קודם) ... */ }
    window.updateLinkageListeners = updateAllBlockListeners; // חשיפה נשארת

    // ================= Event Handlers =================
    function handleMouseDown(event) {
        // (כמו בגרסה הקודמת - מתחיל גרירה ומוסיף מאזינים גלובליים)
        log("[MouseDown] Event triggered on element:", event.target);
        if (event.button !== 0) return;
        const block = event.target.closest('.block-container');
        if (!block || !programmingArea.contains(block) || block.classList.contains('in-palette')) { log("[MouseDown] Ignored."); return; }
        event.preventDefault();
        if (isDragging) return;
        currentlyDraggedBlock = block;
        isDragging = true;
        programmingAreaRect = programmingArea.getBoundingClientRect();
        const blockRect = currentlyDraggedBlock.getBoundingClientRect();
        offsetX = event.clientX - blockRect.left;
        offsetY = event.clientY - blockRect.top;
        currentlyDraggedBlock.style.zIndex = 1000;
        currentlyDraggedBlock.classList.add('block-dragging'); // קלאס בסיסי לגרירה
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        log(`[MouseDown] Start custom drag: ${currentlyDraggedBlock.id}. Added global listeners.`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !currentlyDraggedBlock) return;
        // log("[MouseMove] Event triggered."); // אפשר להפעיל לדיבוג

        try {
            // עדכון מיקום הבלוק הנגרר
            if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();
            let newLeft = event.clientX - programmingAreaRect.left - offsetX;
            let newTop = event.clientY - programmingAreaRect.top - offsetY;
            const blockWidth = currentlyDraggedBlock.offsetWidth; const blockHeight = currentlyDraggedBlock.offsetHeight;
            const maxLeft = programmingAreaRect.width - blockWidth; const maxTop = programmingAreaRect.height - blockHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxLeft)); newTop = Math.max(0, Math.min(newTop, maxTop));
            currentlyDraggedBlock.style.left = `${newLeft}px`; currentlyDraggedBlock.style.top = `${newTop}px`;

            // --- בדיקת קרבה ועדכון אינדיקטורים ---
            const potentialTarget = findSnapTarget(currentlyDraggedBlock);

            // 1. עדכון האינדיקטור על המטרה (כמו קודם)
            updateTargetIndicator(potentialTarget);

            // 2. *** עדכון האינדיקטור על הבלוק הנגרר עצמו ***
            if (potentialTarget) {
                // אם נמצאה מטרה קרובה, הוסף את הקלאס לבלוק הנגרר (אם עוד לא קיים)
                if (!currentlyDraggedBlock.classList.contains(DRAGGED_NEAR_CLASS)) {
                    log(`[MouseMove] Adding proximity indicator (${DRAGGED_NEAR_CLASS}) to dragged block ${currentlyDraggedBlock.id}`);
                    currentlyDraggedBlock.classList.add(DRAGGED_NEAR_CLASS);
                }
            } else {
                // אם אין מטרה קרובה, הסר את הקלאס מהבלוק הנגרר (אם קיים)
                if (currentlyDraggedBlock.classList.contains(DRAGGED_NEAR_CLASS)) {
                    log(`[MouseMove] Removing proximity indicator (${DRAGGED_NEAR_CLASS}) from dragged block ${currentlyDraggedBlock.id}`);
                    currentlyDraggedBlock.classList.remove(DRAGGED_NEAR_CLASS);
                }
            }
            // --- סוף עדכון אינדיקטורים ---

        } catch (error) { console.error("[LinkageImproved] Error in handleMouseMove:", error); }
    }

    function handleMouseUp(event) {
        if (!isDragging || !currentlyDraggedBlock) return;
        log(`[MouseUp] Releasing block ${currentlyDraggedBlock.id}. Removing global listeners.`);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // ניקוי סגנונות ואינדיקטורים
        currentlyDraggedBlock.style.zIndex = '';
        currentlyDraggedBlock.classList.remove('block-dragging');
        currentlyDraggedBlock.classList.remove(DRAGGED_NEAR_CLASS); // *** הסר את הקלאס החדש ***
        updateTargetIndicator(null); // נקה את האינדיקטור מהמטרה

        // בדיקה והצמדה
        const snapTarget = findSnapTarget(currentlyDraggedBlock);
        if (snapTarget) {
            log(`[MouseUp] Found snap target: ${snapTarget.id}`);
            snapBlocks(currentlyDraggedBlock, snapTarget);
            // השמע צליל
            if (linkSound && linkSound.readyState >= 4) { /* ... */ }
            else { log("Link sound not ready."); }
        } else { log(`[MouseUp] No valid snap target found.`); }

        log(`[MouseUp] ----- End MouseUp for ${currentlyDraggedBlock.id} -----`);
        isDragging = false; currentlyDraggedBlock = null; programmingAreaRect = null;
    }

    function mutationCallback(mutationsList, obs) { /* ... (כמו קודם) ... */ }


    // ================= Initialization Function =================
    function initialize() {
        // (כמו בגרסה הקודמת - מפעיל Observer ומאפשר קריאה ידנית לעדכון מאזינים)
        log("Attempting initialization...");
        try {
            programmingArea = document.getElementById("program-blocks");
            if (!programmingArea) { console.error("CRITICAL: Programming area not found!"); return; }
            log("Programming area found:", programmingArea);
            addIndicatorStyles(); // קורא לפונקציה המעודכנת
            try { /* Audio setup */ linkSound = new Audio(LINK_SOUND_SRC); /* ... */ log("Audio created:", LINK_SOUND_SRC); } catch (e) { /* ... */ }
            log("Dynamic global listeners will be added on mousedown.");
            log("Setting up MutationObserver...");
            try { /* MutationObserver setup */ observer = new MutationObserver(mutationCallback); observer.observe(programmingArea, { childList: true, subtree: true }); log("   MutationObserver is actively watching (with subtree)."); }
            catch (e) { console.error("CRITICAL: Observer setup failed!", e); return; }
            log("Block linkage system initialized (Version - Dragged Block Indicator)");
            log("Initialization function finished successfully.");
        } catch (initError) { console.error("CRITICAL ERROR during initialization:", initError); }
    }

    // ================= Start Initialization =================
    log("Script execution started. Waiting for DOMContentLoaded or initializing if ready.");
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else { log("DOM already loaded, initializing immediately."); initialize(); }

})();
// --- END OF FILE linkageimproved.js ---
