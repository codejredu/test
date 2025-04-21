// --- START OF FILE linkageimproved.js ---

(function() {
    // ================= Configuration =================
    const SNAP_THRESHOLD = 20; // Max vertical distance in pixels to trigger snap
    const HORIZONTAL_OVERLAP_THRESHOLD = 0.4; // Minimum 40% horizontal overlap needed to snap
    const SNAP_GAP = 0; // Vertical gap between snapped blocks (0 for direct contact)
    const LINK_SOUND_SRC = 'assets/sound/link.mp3'; // Path to your link sound
    const DEBUG = true; // Set to true to see console logs from this script

    // ================= State Variables =================
    let programmingArea = null;
    let currentlyDraggedBlock = null;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let linkSound = null;
    let programmingAreaRect = null; // Cache the container's bounds

    // ================= Logging Helper =================
    function log(...args) {
        if (DEBUG) {
            console.log("[LinkageImproved]", ...args);
        }
    }

    // ================= Initialization =================
    function initialize() {
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("[LinkageImproved] Programming area (#program-blocks) not found!");
            return;
        }
        log("Programming area found.");

        // Prepare link sound
        try {
            linkSound = new Audio(LINK_SOUND_SRC);
            linkSound.addEventListener('canplaythrough', () => log("Audio ready."), { once: true });
             linkSound.addEventListener('error', (e) => console.error("[LinkageImproved] Error loading audio:", e), { once: true });
            log("Audio created:", LINK_SOUND_SRC);
        } catch (e) {
            console.error("[LinkageImproved] Could not create Audio object:", e);
        }

        // Add global listeners for mouse move and up (to catch drag outside blocks)
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Observe the programming area for blocks being added or removed
        const observer = new MutationObserver(handleMutations);
        observer.observe(programmingArea, { childList: true });
        log("MutationObserver watching.");

        // Add listeners to any blocks already present
        addListenersToExistingBlocks();

        log("Block linkage system initialized (Version Basic Snap)");
        log(`Configuration: Snap Threshold=${SNAP_THRESHOLD}px, Overlap=${HORIZONTAL_OVERLAP_THRESHOLD*100}%, Gap=${SNAP_GAP}px`);
    }

    // ================= Block Discovery & Listener Setup =================

    function handleMutations(mutationsList) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('block-container')) {
                        addBlockListeners(node);
                        log("Listeners added to new block:", node.dataset.type, node.id);
                    }
                });
                // Optional: Handle removed nodes if needed (e.g., clean up connections)
                 mutation.removedNodes.forEach(node => {
                     if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('block-container')) {
                         log("Block removed:", node.dataset.type, node.id);
                         // Clean up connections if this block was part of a chain
                         // (Requires storing connection data, e.g., in data attributes)
                     }
                 });
            }
        }
    }

    function addListenersToExistingBlocks() {
        const existingBlocks = programmingArea.querySelectorAll('.block-container');
        existingBlocks.forEach(block => addBlockListeners(block));
        log(`Listeners added to ${existingBlocks.length} existing blocks.`);
    }

    function addBlockListeners(block) {
        // Ensure block has a unique ID (important for tracking connections)
        if (!block.id) {
            block.id = generateUniqueId(block.dataset.type);
            log("Generated ID:", block.id);
        }
        // Remove listener first to prevent duplicates if function is called again
        block.removeEventListener('mousedown', handleMouseDown);
        block.addEventListener('mousedown', handleMouseDown);
    }

    function generateUniqueId(prefix = 'block') {
        return `${prefix}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // ================= Drag Handling (Mouse Events) =================

    function handleMouseDown(event) {
        // Only drag with left mouse button and directly on the block element
        if (event.button !== 0 || !event.target.classList.contains('block-svg-image')) {
             // Allow starting drag only on the image inside the container
            return;
        }

        const block = event.target.closest('.block-container');
        if (!block || !programmingArea.contains(block)) return; // Ensure it's a block within our area

        event.preventDefault(); // Prevent default image dragging or text selection

        currentlyDraggedBlock = block;
        isDragging = true;

        // Calculate offset relative to the block's top-left corner
        const blockRect = currentlyDraggedBlock.getBoundingClientRect();
        offsetX = event.clientX - blockRect.left;
        offsetY = event.clientY - blockRect.top;

        // Bring dragged block to the front (optional)
        currentlyDraggedBlock.style.zIndex = 1000;
        currentlyDraggedBlock.style.cursor = 'grabbing';

        // Cache programming area bounds for efficiency during drag
        programmingAreaRect = programmingArea.getBoundingClientRect();

        log(`[MouseDown] Start drag: ${currentlyDraggedBlock.id}`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !currentlyDraggedBlock) {
            return;
        }
        event.preventDefault();

        // Calculate new desired top-left position within the programming area
        let newLeft = event.clientX - programmingAreaRect.left - offsetX;
        let newTop = event.clientY - programmingAreaRect.top - offsetY;

        // --- Boundary checks (optional but recommended) ---
        const blockRect = currentlyDraggedBlock.getBoundingClientRect(); // Get current size
        const maxLeft = programmingAreaRect.width - blockRect.width;
        const maxTop = programmingAreaRect.height - blockRect.height;
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        // --- End Boundary checks ---

        // Update visual position
        currentlyDraggedBlock.style.left = `${newLeft}px`;
        currentlyDraggedBlock.style.top = `${newTop}px`;

        // --- Visual Snap Indication (Optional) ---
        // Find potential snap target during move for visual feedback (e.g., halo)
        // const potentialTarget = findSnapTarget(currentlyDraggedBlock);
        // updateVisualIndicators(currentlyDraggedBlock, potentialTarget); // Implement this function
    }

    function handleMouseUp(event) {
        if (!isDragging || !currentlyDraggedBlock) {
            return;
        }
        event.preventDefault();

        log(`[MouseUp] Releasing block ${currentlyDraggedBlock.id}. Checking for snap...`);

        // Reset styles
        currentlyDraggedBlock.style.zIndex = ''; // Or original z-index
        currentlyDraggedBlock.style.cursor = 'grab';

        // --- Find Snap Target ---
        const snapTarget = findSnapTarget(currentlyDraggedBlock);

        if (snapTarget) {
            log(`[MouseUp] Found snap target: ${snapTarget.id}`);
            snapBlocks(currentlyDraggedBlock, snapTarget);
            if (linkSound && linkSound.readyState >= 2) { // Check if sound is ready
                linkSound.currentTime = 0; // Rewind
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
        programmingAreaRect = null; // Clear cache
    }

    // ================= Snapping Logic =================

    function findSnapTarget(draggedBlock) {
        let bestTarget = null;
        let minDistance = SNAP_THRESHOLD; // Start with the max allowed distance

        const draggedRect = draggedBlock.getBoundingClientRect();
        const allBlocks = programmingArea.querySelectorAll('.block-container');

        allBlocks.forEach(potentialTarget => {
            if (potentialTarget === draggedBlock || potentialTarget.id === draggedBlock.id) {
                 return; // Don't snap to self
            }

            const targetRect = potentialTarget.getBoundingClientRect();

            // 1. Vertical Check: Is the top of dragged block NEAR the bottom of potential target?
            const verticalDistance = Math.abs(draggedRect.top - (targetRect.bottom + SNAP_GAP));

            if (verticalDistance < minDistance) {
                // 2. Horizontal Check: Do they overlap sufficiently?
                const horizontalOverlap = Math.max(0, Math.min(draggedRect.right, targetRect.right) - Math.max(draggedRect.left, targetRect.left));
                const requiredOverlap = Math.min(draggedRect.width, targetRect.width) * HORIZONTAL_OVERLAP_THRESHOLD;

                if (horizontalOverlap >= requiredOverlap) {
                    // 3. Compatibility Check (Basic Example: Don't snap under an 'end' block unless it's also 'end')
                     const isTargetEnd = potentialTarget.dataset.type === 'end' || potentialTarget.dataset.type === 'repeatForever';
                     const isDraggedEnd = draggedBlock.dataset.type === 'end' || draggedBlock.dataset.type === 'repeatForever';
                     // You might need more complex rules based on block shapes (e.g., C-blocks)

                     if (!isTargetEnd || isDraggedEnd) { // Allow snapping under non-end blocks, or end under end
                         minDistance = verticalDistance;
                         bestTarget = potentialTarget;
                         log(`       Potential snap: ${draggedBlock.id} under ${potentialTarget.id} (dist: ${verticalDistance.toFixed(1)}, overlap: ${horizontalOverlap.toFixed(1)} >= ${requiredOverlap.toFixed(1)})`);
                    } else {
                         log(`       Rejected snap (End block incompatibility): ${draggedBlock.id} under ${potentialTarget.id}`);
                     }
                }
            }
        });

        return bestTarget;
    }

    function snapBlocks(blockToSnap, targetBlock) {
        if (!programmingAreaRect) { // Ensure we have container bounds
             programmingAreaRect = programmingArea.getBoundingClientRect();
        }
        const targetRect = targetBlock.getBoundingClientRect();

        // Calculate new position relative to the programming area
        const newTop = targetRect.bottom - programmingAreaRect.top + SNAP_GAP;
        const newLeft = targetRect.left - programmingAreaRect.left; // Align left edges

        // Apply the snapped position
        blockToSnap.style.top = `${newTop}px`;
        blockToSnap.style.left = `${newLeft}px`;

        log(`Snapped ${blockToSnap.id} to L:${newLeft.toFixed(1)}, T:${newTop.toFixed(1)} (under ${targetBlock.id})`);

        // --- Optional: Store connection data ---
        // Store which block comes *after* the target block
        // targetBlock.dataset.nextBlockId = blockToSnap.id;
        // Store which block is *before* the snapped block
        // blockToSnap.dataset.prevBlockId = targetBlock.id;
        // You'll need logic in handleMouseDown to clear these when dragging starts
    }


    // ================= Start Initialization =================
    // Wait for the main DOM to be ready before initializing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();

// --- END OF FILE linkageimproved.js ---
