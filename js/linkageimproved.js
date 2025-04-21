// --- START OF FILE linkageimproved.js ---
(function() {
    'use strict';
    // ... (Config, State Vars, Log Helper, Utilities, CSS) ...
    const SNAP_THRESHOLD = 20, HORIZONTAL_OVERLAP_THRESHOLD = 0.4, SNAP_GAP = 0;
    const LINK_SOUND_SRC = 'assets/sound/link.mp3', DEBUG = true, INDICATOR_CLASS = 'snap-indicator';
    let programmingArea, currentlyDraggedBlock, offsetX, offsetY, isDragging, linkSound, programmingAreaRect, currentIndicatorTarget, observer;
    function log(...args) { if (DEBUG) console.log("[LinkageImproved]", ...args); }
    function generateUniqueId(prefix = 'block') {
         const randomPart = Math.random().toString(36).substring(2, 8);
         const id = `${prefix}-${randomPart}`;
         // log(`      Generated ID: ${id}`); // לוג בתוך הפונקציה עצמה
         return id;
    }
    function addIndicatorStyles() { /* ... */ }

    // ================= Core Logic Functions =================
    function findSnapTarget(draggedBlock) { /* ... */ return null; }
    function snapBlocks(blockToSnap, targetBlock) { /* ... */ }
    function updateVisualIndicator(newTarget) { /* ... */ }

    // ================= Event Listener Setup =================
    function addBlockListeners(block) {
        try {
            // 1. ודא שקיבלנו אלמנט תקין
            if (!block || typeof block.addEventListener !== 'function' || !block.dataset || !block.dataset.type) {
                 console.warn("   [addBlockListeners] Invalid block element passed, cannot add listener.", block);
                 return;
            }
            log(`   [addBlockListeners] Processing block type: ${block.dataset.type}, Current ID: ${block.id}`);

            // 2. ודא שיש ID, ואם לא - צור אחד
            if (!block.id) {
                block.id = generateUniqueId(block.dataset.type);
                log(`      [addBlockListeners] Assigned new ID: ${block.id}`);
            } else {
                 log(`      [addBlockListeners] Block already has ID: ${block.id}`);
            }

            // 3. ודא שה-ID שהוגדר אכן תקין ולא ריק/undefined
             if (!block.id) {
                 console.error("   [addBlockListeners] FAILED to assign a valid ID to the block. Aborting listener add.", block);
                 return; // לא להמשיך אם אין ID
             }

            // 4. הוספת המאזין (עם הסרה קודמת למניעת כפילות)
            block.removeEventListener('mousedown', handleMouseDown);
            block.addEventListener('mousedown', handleMouseDown);
            log(`      [addBlockListeners] Mousedown listener added/verified for ${block.id}`);

        } catch (e) {
            console.error(`   [addBlockListeners] Error adding listener to block (ID: ${block?.id || 'unknown'}):`, e);
        }
    }

    // ================= Event Handlers =================
    // handleMouseDown, handleMouseMove, handleMouseUp - ללא שינוי
    function handleMouseDown(event) { /* ... */ }
    function handleMouseMove(event) { /* ... */ }
    function handleMouseUp(event) { /* ... */ }
    function mutationCallback(mutationsList, obs) { /* ... (כמו קודם) ... */ }

    // ================= Initialization Function =================
    function initialize() { /* ... (כמו קודם) ... */ }

    // ================= Start Initialization =================
    // ... (כמו קודם)
    log("Script execution started. Waiting for DOMContentLoaded or initializing if ready.");
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else { log("DOM already loaded, initializing immediately."); initialize(); }

})();
// --- END OF FILE linkageimproved.js ---
