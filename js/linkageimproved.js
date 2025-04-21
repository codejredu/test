// --- START OF FILE linkageimproved.js ---
(function() {
    'use strict';

    // ================= Configuration =================
    const SNAP_THRESHOLD = 20;
    const HORIZONTAL_OVERLAP_THRESHOLD = 0.4;
    const SNAP_GAP = 0;
    const LINK_SOUND_SRC = 'assets/sound/link.mp3';
    const DEBUG = true; // Ensure this is true for logging
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
    let observer = null;

    // ================= Logging Helper =================
    function log(...args) {
        if (DEBUG) {
            console.log("[LinkageImproved]", ...args);
        }
    }

    // ================= Utility Functions =================
    function generateUniqueId(prefix = 'block') {
        const randomPart = Math.random().toString(36).substring(2, 8);
        return `${prefix}-${randomPart}`;
    }

    // ================= CSS Injection =================
    function addIndicatorStyles() {
        const styleId = 'linkage-styles';
        if (document.getElementById(styleId)) return;
        const css = `
            .${INDICATOR_CLASS} { outline: 2px dashed #007bff !important; outline-offset: 2px; box-shadow: 0 0 8px rgba(0, 123, 255, 0.4); }
            .block-dragging { opacity: 0.7; cursor: grabbing !important; pointer-events: none; }
        `;
        const style = document.createElement('style'); style.id = styleId; style.textContent = css;
        document.head.appendChild(style);
        log("Indicator styles added.");
    }

    // ================= Core Logic Functions =================

    function findSnapTarget(draggedBlock) {
        let bestTarget = null;
        let minDistance = SNAP_THRESHOLD;
        const draggedRect = draggedBlock.getBoundingClientRect();
        if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();
        const potentialTargets = programmingArea.querySelectorAll('.block-container:not(.block-dragging)');

        potentialTargets.forEach(potentialTarget => {
            const targetRect = potentialTarget.getBoundingClientRect();
            const verticalDistance = Math.abs(draggedRect.top - (targetRect.bottom + SNAP_GAP));
            if (verticalDistance < minDistance) {
                const horizontalOverlap = Math.max(0, Math.min(draggedRect.right, targetRect.right) - Math.max(draggedRect.left, targetRect.left));
                const requiredOverlapWidth = Math.min(draggedRect.width, targetRect.width) * HORIZONTAL_OVERLAP_THRESHOLD;
                if (horizontalOverlap >= requiredOverlapWidth) {
                    minDistance = verticalDistance;
                    bestTarget = potentialTarget;
                }
            }
        });
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

    function updateVisualIndicator(newTarget) {
        if (newTarget === currentIndicatorTarget) return;
        if (currentIndicatorTarget) {
            currentIndicatorTarget.classList.remove(INDICATOR_CLASS);
        }
        if (newTarget) {
            log(`[UpdateIndicator] Adding indicator to ${newTarget.id}`); // Log when adding
            newTarget.classList.add(INDICATOR_CLASS);
        }
        currentIndicatorTarget = newTarget;
    }

    // ================= Event Listener Setup =================

    function addBlockListeners(block) {
        try {
            if (!block || typeof block.addEventListener !== 'function' || !block.dataset || !block.dataset.type) { console.warn("   [addBlockListeners] Invalid block element passed.", block); return; }
            log(`   [addBlockListeners] Processing block type: ${block.dataset.type}, Current ID: ${block.id}`);
            if (!block.id) { block.id = generateUniqueId(block.dataset.type); log(`      [addBlockListeners] Assigned new ID: ${block.id}`); }
            else { log(`      [addBlockListeners] Block already has ID: ${block.id}`); }
            if (!block.id) { console.error("   [addBlockListeners] FAILED to assign a valid ID. Aborting listener add.", block); return; }
            block.removeEventListener('mousedown', handleMouseDown);
            block.addEventListener('mousedown', handleMouseDown);
            log(`      [addBlockListeners] Mousedown listener added/verified for ${block.id}`);
        } catch (e) { console.error(`   [addBlockListeners] Error adding listener to ${block.id || 'unknown'}:`, e); }
    }

    // --- פונקציה שניתן לקרוא לה ידנית ---
    function updateAllBlockListeners() {
         log("[updateAllBlockListeners] Manually scanning for blocks to update listeners...");
         if (!programmingArea) { log("[updateAllBlockListeners] Programming area not found."); return; }
         try {
            const currentBlocks = programmingArea.querySelectorAll('.block-container:not(.in-palette)');
            log(`   [updateAllBlockListeners] Found ${currentBlocks.length} blocks in the area.`);
            currentBlocks.forEach(block => { addBlockListeners(block); });
            log("[updateAllBlockListeners] Finished manual listener update scan.");
         } catch(e) { console.error("[updateAllBlockListeners] Error during manual scan:", e); }
    }
    // --- חשיפת הפונקציה לחלון הגלובלי ---
    window.updateLinkageListeners = updateAllBlockListeners;
    log("Made updateLinkageListeners available globally.");


    // ================= Event Handlers =================

    function handleMouseDown(event) {
        log("[MouseDown] Event triggered on element:", event.target);
        if (event.button !== 0) return;
        const block = event.target.closest('.block-container');
        if (!block || !programmingArea.contains(block) || block.classList.contains('in-palette')) { log("[MouseDown] Ignored: Not valid block."); return; }
        event.preventDefault();
        if (isDragging) return;
        currentlyDraggedBlock = block;
        isDragging = true;
        programmingAreaRect = programmingArea.getBoundingClientRect();
        const blockRect = currentlyDraggedBlock.getBoundingClientRect();
        offsetX = event.clientX - blockRect.left;
        offsetY = event.clientY - blockRect.top;
        currentlyDraggedBlock.style.zIndex = 1000;
        currentlyDraggedBlock.classList.add('block-dragging');
        document.addEventListener('mousemove', handleMouseMove); // Add listener on start
        document.addEventListener('mouseup', handleMouseUp);     // Add listener on start
        log(`[MouseDown] Start custom drag: ${currentlyDraggedBlock.id}. Added global listeners.`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !currentlyDraggedBlock) return;
        // log("[MouseMove] Event triggered."); // Keep commented unless debugging move itself
        try {
            if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();
            let newLeft = event.clientX - programmingAreaRect.left - offsetX;
            let newTop = event.clientY - programmingAreaRect.top - offsetY;
            const blockWidth = currentlyDraggedBlock.offsetWidth; const blockHeight = currentlyDraggedBlock.offsetHeight;
            const maxLeft = programmingAreaRect.width - blockWidth; const maxTop = programmingAreaRect.height - blockHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxLeft)); newTop = Math.max(0, Math.min(newTop, maxTop));
            currentlyDraggedBlock.style.left = `${newLeft}px`; currentlyDraggedBlock.style.top = `${newTop}px`;
            const potentialTarget = findSnapTarget(currentlyDraggedBlock);
            updateVisualIndicator(potentialTarget); // Update indicator based on found target
        } catch (error) { console.error("[LinkageImproved] Error in handleMouseMove:", error); }
    }

    function handleMouseUp(event) {
        if (!isDragging || !currentlyDraggedBlock) return;
        log(`[MouseUp] Releasing block ${currentlyDraggedBlock.id}. Removing global listeners.`);
        document.removeEventListener('mousemove', handleMouseMove); // Remove listener on end
        document.removeEventListener('mouseup', handleMouseUp);     // Remove listener on end
        currentlyDraggedBlock.style.zIndex = '';
        currentlyDraggedBlock.classList.remove('block-dragging');
        updateVisualIndicator(null); // Clear indicator
        const snapTarget = findSnapTarget(currentlyDraggedBlock);
        if (snapTarget) {
            log(`[MouseUp] Found snap target: ${snapTarget.id}`);
            snapBlocks(currentlyDraggedBlock, snapTarget);
            if (linkSound && linkSound.readyState >= 4) { linkSound.currentTime = 0; linkSound.play().catch(e => console.warn("Audio play failed:", e)); log("Played link sound."); }
            else { log("Link sound not ready or not available."); }
        } else { log(`[MouseUp] No valid snap target found.`); }
        log(`[MouseUp] ----- End MouseUp for ${currentlyDraggedBlock.id} -----`);
        isDragging = false; currentlyDraggedBlock = null; programmingAreaRect = null;
    }

    function mutationCallback(mutationsList, obs) {
        log("[mutationCallback] Fired! Mutations:", mutationsList.length);
        try {
            mutationsList.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        // log(`   [mutationCallback] Checking added node:`, node);
                        if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('block-container') && !node.classList.contains('in-palette')) {
                            log(`      Node is a valid block in area. Calling addBlockListeners...`);
                            addBlockListeners(node);
                        } // else { log(`      Node is not a valid block in area.`); }
                    });
                }
            });
        } catch (e) { console.error("Error inside mutationCallback:", e); }
    }


    // ================= Initialization Function =================
    function initialize() {
        log("Attempting initialization...");
        try {
            programmingArea = document.getElementById("program-blocks");
            if (!programmingArea) { console.error("CRITICAL: Programming area not found!"); return; }
            log("Programming area found:", programmingArea);
            addIndicatorStyles();
            try { /* Audio setup */ linkSound = new Audio(LINK_SOUND_SRC); /* listeners */ log("Audio created:", LINK_SOUND_SRC); } catch (e) { console.error("Audio error:", e); }
            log("Dynamic global listeners will be added on mousedown.");
            log("Setting up MutationObserver...");
            try { /* MutationObserver setup */
                 if (typeof mutationCallback !== 'function') throw new Error("mutationCallback missing");
                 observer = new MutationObserver(mutationCallback);
                 observer.observe(programmingArea, { childList: true, subtree: true }); // Use subtree
                 log("   MutationObserver is now actively watching programmingArea (with subtree).");
            } catch (observerError) { console.error("CRITICAL: Failed to setup MutationObserver!", observerError); return; }
            // No initial call to addListenersToExistingBlocks needed if relying on manual trigger or observer
            log("Block linkage system initialized (Version - Observer Test + Manual Trigger)");
            log("Initialization function finished successfully.");
        } catch (initError) { console.error("CRITICAL ERROR during initialization:", initError); }
    }

    // ================= Start Initialization =================
    log("Script execution started. Waiting for DOMContentLoaded or initializing if ready.");
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else { log("DOM already loaded, initializing immediately."); initialize(); }

})();
// --- END OF FILE linkageimproved.js ---
