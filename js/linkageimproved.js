// ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Cleaned and Verified
// ========================================================================

(function() {
    // Configuration
    const SNAP_DISTANCE = 30; // Max distance in pixels to trigger a snap
    const VERTICAL_SNAP_OFFSET = 5; // Fine-tune vertical alignment on snap
    const CONNECTOR_OFFSET_X_PERCENT = 0; // Horizontal offset for connection point (0 = center)

    // State Variables
    let isDragging = false;      // Is a block currently being dragged?
    let draggedElement = null;  // The specific block element being clicked/dragged
    let dragGroup = [];         // Array of elements being dragged together (draggedElement + children)
    let potentialSnapTarget = null; // The block we might snap to
    let initialMouseX = 0;      // Mouse X at drag start
    let initialMouseY = 0;      // Mouse Y at drag start
    let initialElementX = 0;    // Element X at drag start
    let initialElementY = 0;    // Element Y at drag start
    let programmingArea = null; // Reference to the programming area div
    let nextBlockId = 1;       // Counter for generating unique IDs

    // ========================================================================
    // Initialization
    // ========================================================================

    function initializeLinkageSystem() {
        console.log("Attempting to initialize Linkage System..."); // Added log
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("Linkage System Error: Programming area 'program-blocks' not found. Cannot initialize.");
            return;
        }

        // Use event delegation on the programming area for mousedown
        programmingArea.addEventListener('mousedown', handleMouseDown);

        // Mouse move and up listeners are added to the document during drag
        console.log("Linkage System Initialized for #program-blocks");

        // Ensure existing blocks (if any loaded/persisted) are prepared
        prepareExistingBlocks();
    }

    function prepareExistingBlocks() {
        const blocksInArea = programmingArea.querySelectorAll('.block-container');
        blocksInArea.forEach(block => {
            if (!block.id) {
                block.id = generateUniqueBlockId();
            }
            // Ensure they have necessary styling for absolute positioning if needed
             if (!block.style.position || block.style.position === 'static') {
                 block.style.position = 'absolute';
                 // You might need to set initial left/top if they weren't already
             }
        });
         console.log(`Prepared ${blocksInArea.length} existing blocks.`);
    }

    // Call initialization when the DOM is ready
    // Use a more robust check for DOM readiness
    function runInitialization() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeLinkageSystem);
        } else {
            // DOMContentLoaded has already fired
            initializeLinkageSystem();
        }
    }
    runInitialization(); // Execute the readiness check


    // ========================================================================
    // Unique ID Generation
    // ========================================================================

    function generateUniqueBlockId() {
        return `block-${Date.now()}-${nextBlockId++}`;
    }

    // ========================================================================
    // Event Handlers
    // ========================================================================

    function handleMouseDown(event) {
        // Only trigger drag for direct clicks on block-containers within the programming area
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) { // Added null check for programmingArea
            return;
        }

        // Prevent default text selection or image dragging behavior
        event.preventDefault();

        isDragging = true;
        draggedElement = targetBlock;

        // Ensure the block has an ID
        if (!draggedElement.id) {
            draggedElement.id = generateUniqueBlockId();
            console.log(`Assigned new ID during mousedown: ${draggedElement.id}`); // Log ID assignment
        }

        // --- Detaching Logic ---
        const prevBlockId = draggedElement.dataset.prevBlockId;
        if (prevBlockId) {
            const prevBlock = document.getElementById(prevBlockId);
            if (prevBlock) {
                delete prevBlock.dataset.nextBlockId; // Remove link from parent
            }
            delete draggedElement.dataset.prevBlockId; // Remove link from child
            console.log(`Detached ${draggedElement.id} from ${prevBlockId}`);
        }

        // --- Grouping Logic ---
        dragGroup = getBlockGroup(draggedElement);

        // --- Positioning & Offset ---
        const rect = draggedElement.getBoundingClientRect();
        // const areaRect = programmingArea.getBoundingClientRect(); // Not strictly needed here

        initialMouseX = event.clientX;
        initialMouseY = event.clientY;
        // Ensure element coordinates are relative to the programming area
        initialElementX = draggedElement.offsetLeft;
        initialElementY = draggedElement.offsetTop;

        // Bring the entire group to the front
        dragGroup.forEach((block, index) => {
            block.style.zIndex = 1000 + index; // Make dragged group appear on top
            block.style.cursor = 'grabbing';
        });

        // Add listeners to the whole document for move and up events
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave); // Handle mouse leaving window

        console.log(`Start dragging block: ${draggedElement.id}, Group size: ${dragGroup.length}`);
    }

    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;

        // Calculate new position based on mouse movement
        const currentMouseX = event.clientX;
        const currentMouseY = event.clientY;
        const deltaX = currentMouseX - initialMouseX;
        const deltaY = currentMouseY - initialMouseY;

        const newX = initialElementX + deltaX;
        const newY = initialElementY + deltaY;

        // Update position of the main dragged element
        draggedElement.style.left = `${newX}px`;
        draggedElement.style.top = `${newY}px`;

        // Update position of all other elements in the group relative to the main one
        updateDragGroupPosition(newX, newY);

        // --- Snapping Logic ---
        findAndHighlightSnapTarget();
    }

    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;

        // Ensure potentialSnapTarget is valid before using it
        const isValidSnapTarget = potentialSnapTarget && programmingArea.contains(potentialSnapTarget);

        console.log(`Stop dragging block: ${draggedElement.id}. Potential target: ${potentialSnapTarget ? potentialSnapTarget.id : 'None'}`);

        // --- Apply Snapping ---
        if (isValidSnapTarget) {
            console.log(`Attempting to link ${potentialSnapTarget.id} -> ${draggedElement.id}`); // Log before linking
            linkBlocks(potentialSnapTarget, draggedElement);
            // Position is finalized within linkBlocks
        } else {
             // Optional: Check for overlaps or boundary constraints if not snapping
             if (programmingArea && draggedElement) { // Add checks before accessing properties
                 const areaRect = programmingArea.getBoundingClientRect();
                 const elemRect = draggedElement.getBoundingClientRect();
                 let finalX = draggedElement.offsetLeft;
                 let finalY = draggedElement.offsetTop;

                 // Basic boundary check (optional)
                 finalX = Math.max(0, Math.min(finalX, areaRect.width - elemRect.width));
                 finalY = Math.max(0, Math.min(finalY, areaRect.height - elemRect.height));

                 draggedElement.style.left = `${finalX}px`;
                 draggedElement.style.top = `${finalY}px`;
                 updateDragGroupPosition(finalX, finalY); // Ensure group is aligned
                 console.log(`Placed block ${draggedElement.id} at ${finalX}, ${finalY} (no snap)`);
             }
        }

        // --- Cleanup ---
        // Clear highlighting regardless of whether snap occurred
        clearSnapHighlighting();

        // Reset styles and remove listeners
        dragGroup.forEach(block => {
            if (block) { // Ensure block exists before trying to style it
                block.style.zIndex = ''; // Reset z-index
                block.style.cursor = ''; // Reset cursor
            }
        });
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);

        isDragging = false;
        draggedElement = null;
        dragGroup = [];
        potentialSnapTarget = null; // Reset potential target explicitly here too
        console.log("Dragging ended, state reset.");
    }

    // Handle case where mouse leaves the window during drag
    function handleMouseLeave(event) {
         if (isDragging) {
             console.warn("Mouse left window during drag, cancelling drag and snap."); // Use warn
              // Treat it like a mouse up without snapping
             handleMouseUp(event); // This will handle cleanup
         }
    }

    // ========================================================================
    // Drag Group Management
    // ========================================================================

    // Get the dragged block and all blocks connected below it
    function getBlockGroup(startBlock) {
        const group = [startBlock];
        let currentBlock = startBlock;
        while (currentBlock && currentBlock.dataset.nextBlockId) {
            const nextId = currentBlock.dataset.nextBlockId;
            const nextBlock = document.getElementById(nextId);
            // Extra check: ensure nextBlock exists and is inside the programming area
            if (nextBlock && programmingArea && programmingArea.contains(nextBlock)) {
                group.push(nextBlock);
                currentBlock = nextBlock;
            } else {
                // Link is broken or points outside the area, stop iteration
                if (nextId) { // Only warn if there was an ID
                     console.warn(`Broken link detected or block outside area: ${currentBlock.id} -> ${nextId}. Stopping group traversal.`);
                     // Optionally remove the broken link
                     delete currentBlock.dataset.nextBlockId;
                }
                break; // Exit loop
            }
        }
        return group;
    }

    // Update positions of blocks connected below the main dragged element
    function updateDragGroupPosition(leaderX, leaderY) {
        if (dragGroup.length <= 1) return; // No followers

        let currentTop = leaderY;
        let currentLeft = leaderX; // Keep horizontal alignment for now

        for (let i = 0; i < dragGroup.length; i++) {
            const block = dragGroup[i];
            if (!block) continue; // Skip if block is somehow null/undefined in the group

            const blockHeight = block.offsetHeight; // Get actual height

             if (i === 0) { // The leader block, already positioned
                 // Adjust currentTop for the *next* block based on the leader's height
                 currentTop += blockHeight - VERTICAL_SNAP_OFFSET;
             } else {
                // Follower block
                block.style.left = `${currentLeft}px`; // Align horizontally with leader
                block.style.top = `${currentTop}px`;
                // Adjust currentTop for the block after *this* one
                currentTop += blockHeight - VERTICAL_SNAP_OFFSET;
            }
        }
    }


    // ========================================================================
    // Snapping Logic
    // ========================================================================

    function findAndHighlightSnapTarget() {
        clearSnapHighlighting(); // Clear previous highlighting first
        potentialSnapTarget = null; // Reset potential target

        if (!isDragging || !draggedElement || !programmingArea) return; // Check programmingArea too

        const dragRect = draggedElement.getBoundingClientRect();
        // Calculate the connection point for the top of the dragged block
        const dragTopConnector = {
            x: dragRect.left + dragRect.width / 2 + (dragRect.width * CONNECTOR_OFFSET_X_PERCENT / 200),
            y: dragRect.top
        };

        let closestDistance = SNAP_DISTANCE;
        let bestTarget = null;

        const allBlocks = programmingArea.querySelectorAll('.block-container');

        allBlocks.forEach(block => {
            // Don't snap to self or any block within the current drag group
            if (dragGroup.includes(block)) {
                return;
            }

            // Can only snap to blocks that DON'T already have a block below them
            if (block.dataset.nextBlockId) {
                return;
            }

            // Can only snap if the target block doesn't have a previous block (i.e., it's a top-level block or start of a stack)
            // This prevents snapping in the middle of a stack, although detachment handles this mostly. Can be relaxed if needed.
            // if (block.dataset.prevBlockId) {
            //     return;
            // }

            const targetRect = block.getBoundingClientRect();
            // Calculate the connection point for the bottom of the potential target block
            const targetBottomConnector = {
                x: targetRect.left + targetRect.width / 2 + (targetRect.width * CONNECTOR_OFFSET_X_PERCENT / 200),
                y: targetRect.bottom - VERTICAL_SNAP_OFFSET // Apply offset for visual fit
            };

            // Calculate distance (primarily vertical, slight horizontal allowance)
            const dx = dragTopConnector.x - targetBottomConnector.x;
            const dy = dragTopConnector.y - targetBottomConnector.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check distance and vertical position (target must be above)
            if (distance < closestDistance && targetRect.bottom < dragRect.top + (dragRect.height / 2)) {
                closestDistance = distance;
                bestTarget = block;
            }
        });

        if (bestTarget) {
            potentialSnapTarget = bestTarget;
            highlightSnapTarget(potentialSnapTarget, true); // Highlight the target
            highlightSnapTarget(draggedElement, true); // Highlight the dragged block too
            // console.log(`Potential snap target: ${bestTarget.id} (Distance: ${closestDistance.toFixed(1)})`); // Keep log minimal unless debugging
        }
    }

    function highlightSnapTarget(block, shouldHighlight) {
        if (block) {
             try { // Add try-catch for safety
                 if (shouldHighlight) {
                     block.classList.add('snap-highlight'); // Define this class in your CSS
                 } else {
                     block.classList.remove('snap-highlight');
                 }
             } catch (e) {
                 console.error("Error applying/removing highlight class:", e, block);
             }
        }
    }

     function clearSnapHighlighting() {
         if (!programmingArea) return;
         const highlighted = programmingArea.querySelectorAll('.snap-highlight');
         highlighted.forEach(el => {
             try {
                 el.classList.remove('snap-highlight');
             } catch(e) {
                  console.error("Error removing highlight class:", e, el);
             }
         });
     }


    // ========================================================================
    // Linking Logic
    // ========================================================================

    function linkBlocks(topBlock, bottomBlock) {
        if (!topBlock || !bottomBlock || topBlock === bottomBlock || !programmingArea) return;

        // Double-check conditions before linking
        if (topBlock.dataset.nextBlockId) {
             console.warn(`Link aborted: Target ${topBlock.id} already has next block (${topBlock.dataset.nextBlockId})`);
             return;
        }
        if (bottomBlock.dataset.prevBlockId) {
              console.warn(`Link aborted: Source ${bottomBlock.id} already has prev block (${bottomBlock.dataset.prevBlockId})`);
              // This should ideally be cleared on mousedown, but check again.
              return;
        }

        // --- Update Data Attributes ---
        topBlock.dataset.nextBlockId = bottomBlock.id;
        bottomBlock.dataset.prevBlockId = topBlock.id;

        // --- Final Positioning ---
        const topRect = topBlock.getBoundingClientRect();
        // Calculate target position relative to programming area using offsetLeft/Top
        const targetX = topBlock.offsetLeft;
        const targetY = topBlock.offsetTop + topRect.height - VERTICAL_SNAP_OFFSET;

        // Apply final position to the bottom block (leader of the drag group)
        bottomBlock.style.left = `${targetX}px`;
        bottomBlock.style.top = `${targetY}px`;

        // Recalculate and apply positions for the rest of the group based on the new snapped position
        // Need to pass the correct leader's NEW coordinates
        updateDragGroupPosition(targetX, targetY);

        console.log(`Linked ${topBlock.id} -> ${bottomBlock.id} at pos (${targetX}, ${targetY})`);
    }

    // ========================================================================
    // Public API (for interaction from script.js)
    // ========================================================================

    // Function to be called by script.js AFTER a block is created from the palette
    window.registerNewBlockForLinkage = function(newBlockElement) {
         console.log("Executing registerNewBlockForLinkage for element:", newBlockElement); // Log entry
         if (!newBlockElement) {
             console.error("registerNewBlockForLinkage called with null element.");
             return;
         }

         // 1. Assign Unique ID if it doesn't have one
         if (!newBlockElement.id) {
             newBlockElement.id = generateUniqueBlockId();
             console.log(`Assigned new ID via registration: ${newBlockElement.id}`);
         } else {
             console.log(`Element already had ID: ${newBlockElement.id}`);
         }

         // 2. Ensure Position Absolute (might be already set by script.js drop)
         console.log("Setting position to absolute for", newBlockElement.id); // Log before setting style
         try {
            newBlockElement.style.position = 'absolute'; // This is line ~403 where the error occurred
         } catch (e) {
             console.error("!!! CRITICAL ERROR setting style.position:", e, newBlockElement);
         }
         console.log("Finished setting position for", newBlockElement.id); // Log after setting style


         // 3. Log successful registration
         console.log(`Successfully registered block ${newBlockElement.id} for linkage.`);

         // Note: No need to add mousedown listener here directly due to event delegation
    };


})(); // IIFE to encapsulate scope
console.log("linkageimproved.js script finished execution."); // Log end of script
