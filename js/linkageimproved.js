// --- START OF FILE linkageimproved.js ---
(function() {
    'use strict';
    // ... (Config, State Vars, Log Helper, Utilities, CSS) ...
    const SNAP_THRESHOLD = 20, HORIZONTAL_OVERLAP_THRESHOLD = 0.4, SNAP_GAP = 0;
    const LINK_SOUND_SRC = 'assets/sound/link.mp3', DEBUG = true, INDICATOR_CLASS = 'snap-indicator';
    let programmingArea, currentlyDraggedBlock, offsetX, offsetY, isDragging, linkSound, programmingAreaRect, currentIndicatorTarget, observer;
    function log(...args) { if (DEBUG) console.log("[LinkageImproved]", ...args); }
    function generateUniqueId(prefix = 'block') { /* ... */ }
    function addIndicatorStyles() { /* ... */ }

    // ================= Core Logic Functions =================
    function findSnapTarget(draggedBlock) { /* ... */ return null; }
    function snapBlocks(blockToSnap, targetBlock) { /* ... */ }
    function updateVisualIndicator(newTarget) { /* ... */ }

    // ================= Event Listener Setup =================
    function addBlockListeners(block) {
        log(`   [addBlockListeners] Attempting listener for:`, block.id || block.dataset.type);
        try {
            if (!block || !block.addEventListener) { console.warn("Invalid block for listener."); return; }
            if (!block.id) block.id = generateUniqueId(block.dataset.type);
            log(`      Block ID: ${block.id}`);
            block.removeEventListener('mousedown', handleMouseDown); // Prevent duplicates
            block.addEventListener('mousedown', handleMouseDown); // Add listener
            log(`      Mousedown listener added to ${block.id}`);
        } catch (e) { console.error(`Error adding listener to ${block.id}:`, e); }
    }

    // ================= Event Handlers =================
    function handleMouseDown(event) { /* ... (כמו בגרסה הקודמת, מוסיף מאזינים גלובליים) ... */ }
    function handleMouseMove(event) { /* ... (כמו בגרסה הקודמת) ... */ }
    function handleMouseUp(event) { /* ... (כמו בגרסה הקודמת, מסיר מאזינים גלובליים) ... */ }

    // *** הגדרת פונקציית הקולבק של ה-Observer בתוך ה-Scope של ה-IIFE ***
    function mutationCallback(mutationsList, obs) {
        log("[mutationCallback] Fired! Mutations:", mutationsList.length); // לוג קריטי!
        try {
            mutationsList.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        log(`   [mutationCallback] Checking added node:`, node);
                        if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('block-container') && !node.classList.contains('in-palette')) {
                            log(`      Node is a valid block in area. Calling addBlockListeners...`);
                            addBlockListeners(node); // קריאה לפונקציה שהוגדרה למעלה
                        } else {
                            log(`      Node is not a valid block in area.`);
                        }
                    });
                }
            });
        } catch (e) {
            console.error("Error inside mutationCallback:", e);
        }
    }

    // ================= Initialization Function =================
    function initialize() {
        log("Attempting initialization...");
        try {
            programmingArea = document.getElementById("program-blocks");
            if (!programmingArea) { console.error("CRITICAL: Programming area not found!"); return; }
            log("Programming area found:", programmingArea);

            // addIndicatorStyles(); // הפעל כשנצטרך
            // try { /* Audio setup */ } catch (e) { /* ... */ }

            log("Dynamic global listeners will be added on mousedown.");

            // --- Mutation Observer Setup - בדיקה ממוקדת ---
            log("Setting up MutationObserver...");
            try {
                // ודא שהפונקציה mutationCallback מוגדרת וזמינה כאן
                if (typeof mutationCallback !== 'function') {
                    throw new Error("mutationCallback is not defined or not a function!");
                }
                log("   mutationCallback function found.");

                // יצירת ה-Observer עם הפונקציה שהוגדרה למעלה
                observer = new MutationObserver(mutationCallback);
                log("   MutationObserver instance created.");

                // התחלת ההאזנה לאלמנט אזור התכנות
                observer.observe(programmingArea, { childList: true }); // האזן רק לשינויים בילדים הישירים
                log("   MutationObserver is now actively watching programmingArea."); // אישור קריטי!

                // בדיקה נוספת: האם ה-observer אכן מאזין? (לא דרך סטנדרטית, אבל לבדיקה)
                // אין דרך פשוטה לבדוק אם הוא 'active' ב-API הסטנדרטי

            } catch (observerError) {
                console.error("CRITICAL: Failed to setup MutationObserver!", observerError);
                observer = null;
                return; // עצור אם ה-Observer נכשל
            }

            // --- הוספת מאזינים לבלוקים שכבר קיימים (אם יש) ---
            // log("Running addListenersToExistingBlocks..."); // הפונקציה הזו קוראת ל-addBlockListeners
            // try {
            //     const existingBlocks = programmingArea.querySelectorAll('.block-container:not(.in-palette)');
            //     existingBlocks.forEach(block => addBlockListeners(block));
            //     log(`Listeners setup called for ${existingBlocks.length} existing blocks.`);
            // } catch (e) { console.error("Error in initial addListenersToExistingBlocks:", e); }


            log("Block linkage system initialized (Version - Observer Test)");
            log("Initialization function finished successfully.");

        } catch (initError) { console.error("CRITICAL ERROR during initialization:", initError); }
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
