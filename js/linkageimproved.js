// ========================================================================
// Improved Block Linkage System (linkageimproved.js)
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
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("Linkage System Error: Programming area 'program-blocks' not found.");
            return;
        } // Correctly closed 'if' block

        // Use event delegation on the programming area for mousedown
        programmingArea.addEventListener('mousedown', handleMouseDown);

        // Mouse move and up listeners are added to the document during drag
        console.log("Linkage System Initialized for #program-blocks"); // This was line 38

        // Ensure existing blocks (if any loaded/persisted) are prepared
        prepareExistingBlocks();
    } // Correctly closed 'initializeLinkageSystem' function

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

    // Call initialization when the DOM is ready (or potentially after script.js runs)
    // Assuming script.js might create the programming area or initial blocks
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLinkageSystem);
    } else {
        // DOMContentLoaded has already fired
        initializeLinkageSystem();
    }

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
        if (!targetBlock || !programmingArea.contains(targetBlock)) {
            return;
        }

        // Prevent default text selection or image dragging behavior
        event.preventDefault();

        isDragging = true;
        draggedElement = targetBlock;

        // Ensure the block has an ID
        if (!draggedElement.id) {
            draggedElement.id = generateUniqueBlockId();
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
        const areaRect = programmingArea.getBoundingClientRect();

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
        if (!isDragging) return;

        console.log(`Stop dragging block: ${draggedElement.id}`);

        // --- Apply Snapping ---
        if (potentialSnapTarget) {
            linkBlocks(potentialSnapTarget, draggedElement);
            // Position is finalized within linkBlocks
            clearSnapHighlighting(); // Clear visual cues from the target
        } else {
             // Optional: Check for overlaps or boundary constraints if not snapping
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
        }


        // --- Cleanup ---
        dragGroup.forEach(block => {
            block.style.zIndex = ''; // Reset z-index
            block.style.cursor = ''; // Reset cursor
        });
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);

        isDragging = false;
        draggedElement = null;
        dragGroup = [];
        potentialSnapTarget = null;
        clearSnapHighlighting(); // Ensure any residual highlighting is gone
    }

    // Handle case where mouse leaves the window during drag
    function handleMouseLeave(event) {
         if (isDragging) {
             console.log("Mouse left window during drag, cancelling.");
              // Treat it like a mouse up without snapping
             handleMouseUp(event);
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
            const nextBlock = document.getElementById(currentBlock.dataset.nextBlockId);
            if (nextBlock && programmingArea.contains(nextBlock)) {
                group.push(nextBlock);
                currentBlock = nextBlock;
            } else {
                // Link is broken or points outside the area, stop iteration
                if (currentBlock.dataset.nextBlockId) {
                     console.warn(`Broken link detected: ${currentBlock.id} -> ${currentBlock.dataset.nextBlockId}`);
                     delete currentBlock.dataset.nextBlockId;
                }
                break;
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
            const blockHeight = block.offsetHeight; // Get actual height

             if (i === 0) { // The leader block, already positioned
                 currentTop += blockHeight - VERTICAL_SNAP_OFFSET; // Adjust for next block based on *leader's* height
             } else {
                // Follower block
                block.style.left = `${currentLeft}px`; // Align horizontally with leader
                block.style.top = `${currentTop}px`;
                currentTop += blockHeight - VERTICAL_SNAP_OFFSET; // Position next block below current one
            }
        }
    }


    // ========================================================================
    // Snapping Logic
    // ========================================================================

    function findAndHighlightSnapTarget() {
        clearSnapHighlighting(); // Clear previous highlighting
        potentialSnapTarget = null; // Reset potential target

        if (!draggedElement) return;

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

            if (distance < closestDistance) {
                 // Check if the target block is *above* the dragged block generally
                 // This prevents snapping upwards which can be confusing
                 if (targetRect.bottom < dragRect.top + (dragRect.height / 2) ) {
                    closestDistance = distance;
                    bestTarget = block;
                 }
            }
        });

        if (bestTarget) {
            potentialSnapTarget = bestTarget;
            highlightSnapTarget(potentialSnapTarget, true); // Highlight the target
            highlightSnapTarget(draggedElement, true); // Highlight the dragged block too
             console.log(`Potential snap target: ${bestTarget.id} (Distance: ${closestDistance.toFixed(1)})`);
        }
    }

    function highlightSnapTarget(block, shouldHighlight) {
        if (block) {
             if (shouldHighlight) {
                 block.classList.add('snap-highlight'); // Define this class in your CSS
             } else {
                 block.classList.remove('snap-highlight');
             }
        }
    }

     function clearSnapHighlighting() {
         const highlighted = programmingArea.querySelectorAll('.snap-highlight');
         highlighted.forEach(el => el.classList.remove('snap-highlight'));
          // Also clear the stored potential target
         // potentialSnapTarget = null; // Done in findAndHighlightSnapTarget start and mouseUp
     }


    // ========================================================================
    // Linking Logic
    // ========================================================================

    function linkBlocks(topBlock, bottomBlock) {
        if (!topBlock || !bottomBlock || topBlock === bottomBlock) return;

        // Check if topBlock already has a next block (should be prevented by findAndHighlightSnapTarget, but double-check)
         if (topBlock.dataset.nextBlockId) {
             console.warn(`Attempted to link to ${topBlock.id} which already has a next block (${topBlock.dataset.nextBlockId})`);
             return;
         }
         // Check if bottomBlock already has a prev block (should be prevented by detaching on mousedown, but double-check)
         if (bottomBlock.dataset.prevBlockId) {
              console.warn(`Attempted to link ${bottomBlock.id} which already has a prev block (${bottomBlock.dataset.prevBlockId})`);
              return;
         }

        // --- Update Data Attributes ---
        topBlock.dataset.nextBlockId = bottomBlock.id;
        bottomBlock.dataset.prevBlockId = topBlock.id;

        // --- Final Positioning ---
        const topRect = topBlock.getBoundingClientRect();
        // const bottomRect = bottomBlock.getBoundingClientRect(); // Use current rect as it might have moved slightly - Not needed if using offsetTop/Left

        // Calculate target position relative to programming area
        // const areaRect = programmingArea.getBoundingClientRect(); // Not needed if using offsetTop/Left
        const targetX = topBlock.offsetLeft; // Align horizontally with the top block's position relative to the area
        const targetY = topBlock.offsetTop + topRect.height - VERTICAL_SNAP_OFFSET; // Position directly below, adjusted by offset

        // Apply final position to the bottom block (which is the leader of the drag group)
        bottomBlock.style.left = `${targetX}px`;
        bottomBlock.style.top = `${targetY}px`;

        // Recalculate and apply positions for the rest of the group based on the new snapped position
        updateDragGroupPosition(targetX, targetY);

        console.log(`Linked ${topBlock.id} -> ${bottomBlock.id}`);
    }

    // ========================================================================
    // Public API (Optional - for interaction from script.js if needed)
    // ========================================================================

    // Function to be called by script.js AFTER a block is created from the palette
    window.registerNewBlockForLinkage = function(newBlockElement) {
         if (!newBlockElement) return;

          // 1. Assign Unique ID
         if (!newBlockElement.id) {
             newBlockElement.id = generateUniqueBlockId();
         }

          // 2. Ensure Position Absolute (might be already set by script.js drop)
         newBlockElement.style.position = 'absolute';

         // 3. Make sure it's draggable via our system (mousedown listener is delegated)
         console.log(`Registered new block ${newBlockElement.id} for linkage.`);

         // Note: No need to add mousedown listener here directly due to event delegation
    };


})(); // IIFE to encapsulate scope

--- END OF FILE linkageimproved.js ---

**שלבים הבאים:**

1.  **החלף את הקובץ:** ודא שהקובץ `linkageimproved.js` בפרויקט שלך מכיל בדיוק את הקוד הזה.
2.  **רענן קשיח:** רענן את הדף בדפדפן באמצעות Ctrl+Shift+R (או Cmd+Shift+R ב-Mac) כדי לוודא שאתה טוען את הגרסה החדשה של הקובץ ולא גרסה שמורה במטמון (cache).
3.  **בדוק קונסול:** פתח את כלי המפתחים (F12) ובדוק שאין יותר הודעות `SyntaxError` אדומות מטעם `linkageimproved.js`. אתה אמור לראות את ההודעה `Linkage System Initialized for #program-blocks`.
4.  **בדוק CSS:** ודא שכללי ה-CSS שסיפקתי בתגובה הקודמת (במיוחד `.snap-highlight` וסגנונות `#program-blocks .block-container`) נמצאים בקובץ ה-CSS שלך ונטענים כראוי. ללא ה-CSS, לא תראה את ההדגשה החזותית.
5.  **בדוק אינטגרציה:** ודא שביצעת את השינוי הנדרש בפונקציה `handleDrop` בקובץ `script.js` כדי לקרוא ל-`window.registerNewBlockForLinkage(newBlock);` לאחר יצירת בלוק חדש.

אם תבצע את כל השלבים האלה, מערכת ההצמדה וההדגשה אמורה לעבוד כמצופה.
