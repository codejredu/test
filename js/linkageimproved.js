// --- START OF FILE linkageimproved.js ---
(function() {
    // ... (Configuration, State Variables, Logging Helper, Indicator Styles) ...
    const SNAP_THRESHOLD = 20;
    const HORIZONTAL_OVERLAP_THRESHOLD = 0.4;
    const SNAP_GAP = 0;
    const LINK_SOUND_SRC = 'assets/sound/link.mp3';
    const DEBUG = true;
    const INDICATOR_CLASS = 'snap-indicator';

    let programmingArea = null;
    let currentlyDraggedBlock = null;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let linkSound = null;
    let programmingAreaRect = null;
    let currentIndicatorTarget = null;
    let observer = null; // הפכנו למשתנה גלובלי בתוך ה-IIFE כדי שנוכל לבדוק אותו

    function log(...args) {
        if (DEBUG) {
            console.log("[LinkageImproved]", ...args);
        }
    }

    function addIndicatorStyles() {
        // ... (כמו קודם) ...
        const styleId = 'linkage-styles';
        if (document.getElementById(styleId)) return;
        const css = `
            .${INDICATOR_CLASS} { outline: 2px dashed #007bff !important; outline-offset: 2px; box-shadow: 0 0 10px rgba(0, 123, 255, 0.5); }
            .block-dragging { opacity: 0.7; cursor: grabbing !important; pointer-events: none; }
        `;
        const style = document.createElement('style'); style.id = styleId; style.textContent = css;
        document.head.appendChild(style);
        log("Indicator styles added.");
    }


    // ================= Initialization =================
    function initialize() {
        log("Attempting initialization..."); // לוג חדש
        try {
            programmingArea = document.getElementById("program-blocks");
            if (!programmingArea) {
                console.error("[LinkageImproved] CRITICAL: Programming area (#program-blocks) not found during initialization!");
                return; // עצירה מוקדמת אם האלמנט לא קיים
            }
            log("Programming area found.");

            addIndicatorStyles();

            // Setup Audio
            try {
                linkSound = new Audio(LINK_SOUND_SRC);
                linkSound.addEventListener('canplaythrough', () => log("Audio ready."), { once: true });
                linkSound.addEventListener('error', (e) => console.error("[LinkageImproved] Error loading audio:", e), { once: true });
                log("Audio created:", LINK_SOUND_SRC);
            } catch (audioError) {
                console.error("[LinkageImproved] Could not create Audio object:", audioError);
            }

            // Add global listeners AFTER confirming area exists
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            log("Global mouse listeners added.");

            // --- Mutation Observer Setup ---
            log("Setting up MutationObserver...");
            try {
                // *** חשוב: לוודא ש-handleMutations היא פונקציה תקינה בשלב זה ***
                if (typeof handleMutations !== 'function') {
                     throw new Error("handleMutations is not defined or not a function!");
                }
                 observer = new MutationObserver(handleMutations); // השמה למשתנה הגלובלי
                 observer.observe(programmingArea, { childList: true });
                 log("MutationObserver setup complete and actively watching."); // לוג אישור קריטי
            } catch (observerError) {
                console.error("[LinkageImproved] CRITICAL: Failed to setup MutationObserver!", observerError);
                 // אם ה-Observer נכשל, שום דבר לא יעבוד
                 observer = null; // ודא שהוא null אם נכשל
                 return; // אולי כדאי לעצור כאן?
            }

            // Add listeners to any blocks already present (בדרך כלל 0 בהתחלה)
            addListenersToExistingBlocks();

            log("Block linkage system initialized (Version Basic Snap + Indicator v3 - Observer Check)");
            log(`Configuration: Snap Threshold=${SNAP_THRESHOLD}px, Overlap=${HORIZONTAL_OVERLAP_THRESHOLD*100}%, Gap=${SNAP_GAP}px`);

        } catch (initError) {
             console.error("[LinkageImproved] CRITICAL ERROR during initialization:", initError);
             // אם יש שגיאה כאן, שום דבר לא יפעל
        }
    }

    // ================= Block Discovery & Listener Setup =================
    function handleMutations(mutationsList, obs) { // הפרמטר השני הוא ה-observer עצמו
        log("[handleMutations] Callback triggered! Mutations count:", mutationsList.length); // לוג קריטי!
        try {
            for (const mutation of mutationsList) {
                 log(`   [handleMutations] Mutation type: ${mutation.type}, Added: ${mutation.addedNodes.length}, Removed: ${mutation.removedNodes.length}`);
                 if (mutation.type === 'childList') {
                     mutation.addedNodes.forEach((node, index) => {
                         log(`      [handleMutations] Checking added node ${index}: Tag=${node.tagName}, Type=${node.nodeType}, Classes=${node.classList ? JSON.stringify(Array.from(node.classList)) : 'N/A'}`);
                         if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('block-container') && !node.classList.contains('in-palette')) {
                             log(`         [handleMutations] Node IS a valid block in area! Adding listener...`);
                             addBlockListeners(node);
                         } else {
                             log(`         [handleMutations] Node is NOT a valid block in area or is in palette.`);
                         }
                     });
                    // טיפול ב-removedNodes אם צריך...
                 }
             }
        } catch (mutationError) {
            console.error("[LinkageImproved] Error inside handleMutations callback:", mutationError);
            // שקול לנתק את ה-observer אם יש שגיאה חוזרת
            // if (obs) obs.disconnect();
        }
    }

    function addListenersToExistingBlocks() {
        log("Running addListenersToExistingBlocks...");
        try {
            const existingBlocks = programmingArea.querySelectorAll('.block-container:not(.in-palette)');
            existingBlocks.forEach(block => addBlockListeners(block));
            log(`Listeners added to ${existingBlocks.length} existing blocks in area.`);
        } catch (e) {
            console.error("[LinkageImproved] Error in addListenersToExistingBlocks:", e);
        }
    }

    function addBlockListeners(block) {
        log(`   [addBlockListeners] Attempting to add listener to:`, block.id || block.dataset.type || block); // לוג חדש
        try {
            if (!block || typeof block.addEventListener !== 'function') {
                 console.warn("   [addBlockListeners] Invalid block element passed.");
                 return;
            }
             if (!block.id) {
                 block.id = generateUniqueId(block.dataset.type);
                 log(`      [addBlockListeners] Generated ID: ${block.id}`);
             } else {
                  log(`      [addBlockListeners] Block already has ID: ${block.id}`);
             }
             block.removeEventListener('mousedown', handleMouseDown);
             block.addEventListener('mousedown', handleMouseDown);
             log(`      [addBlockListeners] Added mousedown listener successfully to ${block.id}`);
        } catch (e) {
            console.error(`   [addBlockListeners] Error adding listener to ${block.id || 'unknown block'}:`, e);
        }
    }

    function generateUniqueId(prefix = 'block') {
        return `${prefix}-${Math.random().toString(36).substring(2, 8)}`;
    }


    // ================= Drag Handling (Mouse Events) =================
    // handleMouseDown, handleMouseMove, handleMouseUp ללא שינוי מהותי מגרסה קודמת
     function handleMouseDown(event) {
        log("[MouseDown] Event triggered on element:", event.target); // לוג חדש
        if (event.button !== 0) return;
        const block = event.target.closest('.block-container');
        if (!block || !programmingArea.contains(block) || block.classList.contains('in-palette')) {
            log("[MouseDown] Ignored: Not a valid block in the programming area.");
            return;
        }
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
     // handleMouseMove - ללא שינוי
     // handleMouseUp - ללא שינוי


    // ================= Snapping Logic & Indicator =================
    // findSnapTarget, snapBlocks, updateVisualIndicator ללא שינוי מגרסה קודמת


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
