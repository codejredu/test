// --- START OF FILE linkage-improved.js ---

document.addEventListener('DOMContentLoaded', () => {
  // הגדרת משתנים גלובליים או בתוך סקופ מתאים
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let lastClickedBlock = null; // If used for other interactions
  let lastRightClickedBlock = null; // If used for context menu
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let currentPotentialSnapTarget = null; // Track previous target for efficient clearing

  // *** קונטיינר הבלוקים - חשוב לוודא שהוא קיים ושהוא ההורה של הבלוקים ***
  // *** ודא שיש לו position: relative או absolute כדי שהמיקום האבסולוטי של הבלוקים יעבוד נכון ***
  const blocksContainer = document.getElementById('blocks-container') || document.body;
  // ודא שלקונטיינר יש מיקום יחסי אם הבלוקים ממוקמים אבסולוטית בתוכו
  if (window.getComputedStyle(blocksContainer).position === 'static' && blocksContainer !== document.body) {
       console.warn("Warning: blocksContainer should have position: relative or absolute for absolute block positioning.");
       // blocksContainer.style.position = 'relative'; // Uncomment to force it if needed
  }


  // פונקציה ליצירת תפריט הקשר
  function createDetachMenu(block, x, y) {
    removeDetachMenu(); // הסרת תפריט קודם אם קיים

    const menu = document.createElement('div');
    menu.id = 'detachMenu'; // Add ID for easier selection
    menu.classList.add('detach-context-menu'); // Use class from CSS
    menu.style.position = 'fixed'; // Use fixed to position relative to viewport
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    // Styles moved to CSS for cleaner code

    const detachButton = document.createElement('button');
    detachButton.textContent = 'נתק חיבור'; // Detach connection
    // Styles moved to CSS

    detachButton.onclick = (e) => {
      e.stopPropagation(); // Prevent closing menu immediately
      console.log(`Attempting to detach block: ${block.id}`);
      disconnectBlock(block); // Call your specific disconnect function
      removeDetachMenu();
    };

    menu.appendChild(detachButton);
    document.body.appendChild(menu); // Append to body to avoid positioning issues

    // סגירת התפריט בלחיצה מחוץ לו
    setTimeout(() => { // Use timeout to avoid immediate closing by the same click
        document.addEventListener('click', handleOutsideClick, { capture: true, once: true }); // Use capture to catch clicks anywhere
    }, 0);

    lastRightClickedBlock = block;
  }

  // פונקציה להסרת תפריט הקשר
  function removeDetachMenu() {
    const existingMenu = document.getElementById('detachMenu');
    if (existingMenu) {
      existingMenu.remove();
      // Clean up listener if it wasn't used (removed by 'once: true' if clicked outside)
      document.removeEventListener('click', handleOutsideClick, { capture: true });
    }
    // lastRightClickedBlock = null; // Don't clear this here, might be needed elsewhere briefly
  }

  // פונקציה לסגירת התפריט בלחיצה מחוץ לו
  function handleOutsideClick(event) {
      const menu = document.getElementById('detachMenu');
      // Check if the click was outside the menu
      if (menu && !menu.contains(event.target)) {
           // console.log("Clicked outside menu, removing.");
          removeDetachMenu();
      } else if (menu) {
          // Click was inside (likely the button), re-attach listener because 'once' removed it
          // console.log("Clicked inside menu, re-attaching listener.");
          // The button's click handler should have already removed the menu,
          // but this is a fallback if not. Re-attaching is complex due to 'once'.
          // It's simpler to rely on the button click handler. If the menu persists,
          // there might be an issue in the button handler or event propagation.
          // For now, assume button click removes it correctly.
           document.removeEventListener('click', handleOutsideClick, { capture: true }); // Ensure cleanup
      }
  }


  // פונקציה להסתרת אינדיקטור החיבור
  function hideConnectionIndicator() {
    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
      indicator.style.pointerEvents = 'none';
    }
  }

  // הוספת סגנונות CSS להדגשה ואנימציה
  function addHighlightStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Container needs relative/absolute positioning if blocks are absolute */
      #blocks-container {
         /* position: relative; */ /* Uncomment if needed */
         /* min-height: 300px; */ /* Example minimum size */
         /* border: 1px dashed grey; */ /* For debugging layout */
      }

      .block {
        /* Ensure blocks are visible by default and positioned if needed */
        /* position: absolute; */ /* Set this if you calculate left/top */
        cursor: grab;
        user-select: none; /* Prevent text selection during drag */
        opacity: 1; /* Default state */
        transition: opacity 0.15s ease-out; /* Smooth opacity transition */
      }

      /* Style for the original element WHILE dragging */
      .dragging {
        opacity: 0.4; /* Make original semi-transparent */
        cursor: grabbing;
        /* box-shadow: 0 4px 15px rgba(0,0,0,0.2); Optional: lift effect */
      }

      /* הדגשת בלוק מקור (הנגרר) כשקרוב להצמדה */
      .snap-source .block-svg-image,
      .snap-source img {
        filter: brightness(1.05);
        transition: filter 0.15s ease-out, box-shadow 0.15s ease-out;
        box-shadow: 0 0 8px 2px rgba(0, 180, 255, 0.6);
      }

      /* הדגשת בלוק יעד */
      .snap-target .block-svg-image,
      .snap-target img {
        filter: brightness(1.1);
        transition: filter 0.15s ease-out, box-shadow 0.15s ease-out;
        box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.6);
      }

      /* הילה צהובה בוהקת ל"מוכן להצמדה" */
      .ready-to-snap .block-svg-image,
      .ready-to-snap img {
         box-shadow: 0 0 12px 5px rgba(255, 223, 0, 0.9) !important;
         filter: brightness(1.15) !important;
         transition: filter 0.1s ease-out, box-shadow 0.1s ease-out;
      }

      /* הדגשת שקע/פין ביעד */
      .snap-left::before, .snap-right::after {
        content: '';
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 5px;
        height: 18px;
        background-color: rgba(255, 255, 100, 0.8);
        z-index: 10;
        pointer-events: none;
      }
      .snap-left::before { left: 0; border-radius: 0 3px 3px 0; }
      .snap-right::after { right: 0; border-radius: 3px 0 0 3px; }

      /* אנימציות */
      @keyframes snapEffect { /* ... */ }
      .snap-animation { animation: snapEffect 0.3s ease-out; }
      @keyframes detachEffect { /* ... */ }
      .detach-animation { animation: detachEffect 0.3s ease-out; }
      @keyframes pulseIndicator { /* ... */ }

      /* סימון חיבור */
      .connected-block { /* ... */ }
      .has-connected-block { position: relative; }
      .connected-block[data-connection-direction="right"]::after,
      .has-connected-block[data-connection-direction="left"]::before {
        content: ''; position: absolute; width: 4px; height: 12px;
        background-color: rgba(255, 255, 0, 0.4); z-index: 5; pointer-events: none;
        top: 50%; transform: translateY(-50%);
      }
      .connected-block[data-connection-direction="right"]::after { right: -2px; }
      .has-connected-block[data-connection-direction="left"]::before { left: -2px; }

      /* תפריט הקשר */
      .detach-context-menu {
        position: fixed; /* Changed from absolute */
        min-width: 120px;
        font-family: Arial, sans-serif; font-size: 14px;
        background-color: white; border: 1px solid #ccc;
        padding: 5px; z-index: 1000;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
        color: #333; /* Added text color */
      }
       .detach-context-menu button {
            display: block; width: 100%; padding: 5px 10px;
            border: none; background-color: transparent; cursor: pointer;
            text-align: right; /* Or left */
            color: inherit; /* Inherit text color */
            font-size: inherit; /* Inherit font size */
        }
        .detach-context-menu button:hover { background-color: #eee; }

      /* אינדיקטור חיבור */
      #connection-indicator { /* ... */ }
    `;
    document.head.appendChild(style);
  }

  // פונקציית עזר לניקוי הדגשות ספציפיות
  function clearSpecificHighlights(sourceBlock, targetBlock) {
      const classesToRemove = ['snap-source', 'snap-target', 'snap-left', 'snap-right', 'ready-to-snap'];
      if (sourceBlock) {
          sourceBlock.classList.remove(...classesToRemove);
          // Reset filter/shadow directly on image if classes aren't enough
          const sourceImage = sourceBlock.querySelector('.block-svg-image, img');
          if (sourceImage) {
              sourceImage.style.filter = '';
              sourceImage.style.boxShadow = '';
          }
      }
      if (targetBlock) {
          targetBlock.classList.remove(...classesToRemove);
           const targetImage = targetBlock.querySelector('.block-svg-image, img');
           if (targetImage) {
               targetImage.style.filter = '';
               targetImage.style.boxShadow = '';
            }
      }
  }

  // פונקציית ניקוי כללית
  function clearAllHighlights() {
      document.querySelectorAll('.block').forEach(el => { // Iterate all blocks
          el.classList.remove('snap-source', 'snap-target', 'snap-left', 'snap-right', 'ready-to-snap');
           const image = el.querySelector('.block-svg-image, img');
           if (image) {
                image.style.filter = '';
                image.style.boxShadow = '';
           }
      });
      potentialSnapTarget = null;
      snapDirection = null;
      currentPotentialSnapTarget = null;
  }

  // --- פונקציות ליבה (ודא שהן ממומשות כראוי) ---

  function findPotentialSnapTarget(draggedBlock) {
     // Implement logic to find the nearest snappable block based on position and rules.
     // Returns the target block element or null.
     // Crucial: Ensure this correctly calculates distances relative to the viewport/container.
     const allBlocks = blocksContainer.querySelectorAll('.block:not(.dragging)');
     let closestTarget = null;
     let minValidDistance = 50; // Max snap distance

     const draggedRect = draggedBlock.getBoundingClientRect(); // Position relative to viewport

     allBlocks.forEach(block => {
         if (block === draggedBlock) return;

         // Check connection eligibility first (if applicable)
         // e.g., if (!canConnect(draggedBlock, block)) return;

         const targetRect = block.getBoundingClientRect();

         // Calculate distances between potential connection points
         const verticalAlign = Math.abs(draggedRect.top - targetRect.top) < draggedRect.height * 0.7; // Example vertical check

         if (verticalAlign) {
             // Check right-to-left snap potential
             const distRightLeft = Math.abs(draggedRect.right - targetRect.left);
             if (distRightLeft < minValidDistance && !draggedBlock.dataset.connectedRight && !block.dataset.connectedLeft) {
                 minValidDistance = distRightLeft;
                 closestTarget = block;
                 // Could store snap type here too if needed immediately
             }

             // Check left-to-right snap potential
             const distLeftRight = Math.abs(draggedRect.left - targetRect.right);
              if (distLeftRight < minValidDistance && !draggedBlock.dataset.connectedLeft && !block.dataset.connectedRight) {
                 minValidDistance = distLeftRight;
                 closestTarget = block;
              }
         }
     });
     return closestTarget;
  }

  function determineSnapDirection(draggedBlock, targetBlock) {
    if (!draggedBlock || !targetBlock) return null;

    const draggedRect = draggedBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    const snapThreshold = 35; // Increased threshold slightly
    const verticalThreshold = draggedRect.height * 0.7; // Vertical alignment tolerance

    if (Math.abs(draggedRect.top - targetRect.top) < verticalThreshold) {
        // Check right-to-left snap: dragged right edge near target left edge
        if (!draggedBlock.dataset.connectedRight && !targetBlock.dataset.connectedLeft &&
            Math.abs(draggedRect.right - targetRect.left) < snapThreshold) {
          return 'left'; // Target highlights its left side
        }
        // Check left-to-right snap: dragged left edge near target right edge
        if (!draggedBlock.dataset.connectedLeft && !targetBlock.dataset.connectedRight &&
            Math.abs(draggedRect.left - targetRect.right) < snapThreshold) {
          return 'right'; // Target highlights its right side
        }
    }
    return null;
  }

  function connectBlocks(sourceBlock, targetBlock, direction) {
    console.log(`Connecting ${sourceBlock.id} to ${targetBlock.id} (direction: ${direction})`);
    // --- IMPORTANT: Positioning Logic ---
    // This assumes blocks are absolutely positioned within blocksContainer

    // Ensure both blocks are absolutely positioned BEFORE calculating final position
    sourceBlock.style.position = 'absolute';
    targetBlock.style.position = 'absolute'; // Should already be, but safe to ensure

    const targetStyle = window.getComputedStyle(targetBlock);
    const sourceStyle = window.getComputedStyle(sourceBlock); // Get current style before moving

    // Use offsetLeft/Top if relative to a positioned parent (blocksContainer)
    // Make sure the parent container HAS position: relative or absolute!
    const targetLeft = parseFloat(targetStyle.left) || targetBlock.offsetLeft;
    const targetTop = parseFloat(targetStyle.top) || targetBlock.offsetTop;

    // Use getBoundingClientRect().width/height for accurate dimensions
    const sourceWidth = sourceBlock.getBoundingClientRect().width;
    const targetWidth = targetBlock.getBoundingClientRect().width;

    let newLeft, newTop = targetTop; // Assume vertical alignment is desired

    if (direction === 'left') { // Source right connects to Target left
      newLeft = targetLeft - sourceWidth + 1; // +1 for slight overlap/gap adjustment
      sourceBlock.dataset.connectedRight = targetBlock.id;
      targetBlock.dataset.connectedLeft = sourceBlock.id;
      sourceBlock.dataset.connectionDirection = 'right';
      targetBlock.dataset.connectionDirection = 'left';
    } else { // Source left connects to Target right
      newLeft = targetLeft + targetWidth - 1; // -1 for slight overlap/gap adjustment
      sourceBlock.dataset.connectedLeft = targetBlock.id;
      targetBlock.dataset.connectedRight = sourceBlock.id;
      sourceBlock.dataset.connectionDirection = 'left';
      targetBlock.dataset.connectionDirection = 'right';
    }

    // Apply new position
    sourceBlock.style.left = `${newLeft}px`;
    sourceBlock.style.top = `${newTop}px`;

    // Add classes for styling
    sourceBlock.classList.add('connected-block', 'has-connected-block');
    targetBlock.classList.add('connected-block', 'has-connected-block');

    console.log(`Block ${sourceBlock.id} moved to ${newLeft}px, ${newTop}px`);
  }

  function disconnectBlock(blockToDisconnect) {
     console.log(`Disconnecting block ${blockToDisconnect.id}`);
     blockToDisconnect.classList.add('detach-animation');
     blockToDisconnect.addEventListener('animationend', () => blockToDisconnect.classList.remove('detach-animation'), { once: true });

     let disconnected = false;
     const rightId = blockToDisconnect.dataset.connectedRight;
     const leftId = blockToDisconnect.dataset.connectedLeft;

     if (rightId) {
         const connectedBlock = document.getElementById(rightId);
         if (connectedBlock) {
             delete connectedBlock.dataset.connectedLeft;
             connectedBlock.removeAttribute('data-connection-direction');
             connectedBlock.classList.remove('has-connected-block','connected-block');
         }
         delete blockToDisconnect.dataset.connectedRight;
         disconnected = true;
     }
     if (leftId) {
         const connectedBlock = document.getElementById(leftId);
         if (connectedBlock) {
             delete connectedBlock.dataset.connectedRight;
             connectedBlock.removeAttribute('data-connection-direction');
             connectedBlock.classList.remove('has-connected-block','connected-block');
         }
         delete blockToDisconnect.dataset.connectedLeft;
         disconnected = true;
     }

     if (disconnected) {
          blockToDisconnect.removeAttribute('data-connection-direction');
          blockToDisconnect.classList.remove('has-connected-block','connected-block');
          // Make draggable again? (Should be draggable by default)
          // blockToDisconnect.setAttribute('draggable', 'true');
     }
     hideConnectionIndicator();
  }

  // --- מאזיני אירועים ---

  document.querySelectorAll('.block').forEach(block => {
    block.setAttribute('draggable', 'true');

    // Context Menu
    block.addEventListener('contextmenu', (e) => {
         e.preventDefault();
         if (block.dataset.connectedLeft || block.dataset.connectedRight) {
              createDetachMenu(block, e.clientX, e.clientY);
         } else {
             removeDetachMenu();
         }
         lastRightClickedBlock = block;
     });

    // Drag Start
    block.addEventListener('dragstart', (e) => {
        // Check if context menu is open for this block - if so, maybe prevent drag?
        const menu = document.getElementById('detachMenu');
        if (menu && lastRightClickedBlock === block) {
            console.log("Context menu open, preventing drag start for now.");
            e.preventDefault(); // Stop the drag if menu is open
            return;
        }

        console.log(`dragstart: ${block.id}`);
        currentDraggedBlock = block;
        currentDraggedBlock.classList.add('dragging'); // Apply dragging style

        const rect = block.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;

        e.dataTransfer.effectAllowed = 'move';
        // Try setting data (required for Firefox in some cases)
        e.dataTransfer.setData('text/plain', block.id);
        // Avoid setting drag image if default ghost is okay
        // e.dataTransfer.setDragImage(block, dragOffsetX, dragOffsetY);

        // **REMOVED**: setTimeout(() => block.style.opacity = '0.5', 0);
        // Rely on .dragging class for visual feedback

        clearAllHighlights();
        removeDetachMenu();
    });

    // Drag Over (on potential drop targets or container)
    // This listener is primarily to allow dropping by preventing default handling
    blocksContainer.addEventListener('dragover', (e) => {
         e.preventDefault(); // *** Crucial to allow drop ***
         e.dataTransfer.dropEffect = 'move';

         // --- Logic moved from 'drag' event to 'dragover' for better target detection ---
         if (!currentDraggedBlock) return;

         // Update highlighting based on cursor position over the container
         clearSpecificHighlights(currentDraggedBlock, currentPotentialSnapTarget);

         // Find potential target based on current dragged block's *ghost* position (approximated)
         // Or better: find target based on current mouse position (e.clientX, e.clientY) relative to potential targets
         potentialSnapTarget = findPotentialSnapTarget(currentDraggedBlock); // Use the same function, it uses getBoundingClientRect
         snapDirection = determineSnapDirection(currentDraggedBlock, potentialSnapTarget);

         if (potentialSnapTarget && snapDirection) {
             currentDraggedBlock.classList.add('snap-source');
             potentialSnapTarget.classList.add('snap-target');
             potentialSnapTarget.classList.add(snapDirection === 'left' ? 'snap-left' : 'snap-right');
             currentDraggedBlock.classList.add('ready-to-snap');
             potentialSnapTarget.classList.add('ready-to-snap');
             currentPotentialSnapTarget = potentialSnapTarget;
         } else {
             currentPotentialSnapTarget = null;
         }
         // --- End of logic moved from 'drag' ---
    });


    // Drag End (fired on the source element when drag finishes)
    block.addEventListener('dragend', (e) => {
      // Check if block is still the one being dragged (sanity check)
      if (currentDraggedBlock !== block) {
        // console.log("dragend: Mismatch, currentDraggedBlock is", currentDraggedBlock ? currentDraggedBlock.id : 'null', "block is", block.id);
        // This might happen if drag was cancelled unexpectedly or state is corrupt
        // Just try to reset the style of the block firing the event
        block.style.opacity = '1';
        block.classList.remove('dragging');
        clearAllHighlights(); // General cleanup might be needed
        return; // Exit early
      }

      console.log(`dragend: ${block.id}. Opacity before reset: ${block.style.opacity}`);

      // *** GUARANTEE VISIBILITY RESTORATION ***
      block.style.opacity = '1';
      block.classList.remove('dragging');

      // Determine final action based on state variables set during dragover/drag
      if (potentialSnapTarget && snapDirection) {
          console.log(`dragend: Snapping ${block.id} to ${potentialSnapTarget.id}`);
          // --- Snap Logic ---
          currentDraggedBlock.classList.remove('ready-to-snap');
          potentialSnapTarget.classList.remove('ready-to-snap');

          // Add animation (check if elements still exist)
          if (currentDraggedBlock) currentDraggedBlock.classList.add('snap-animation');
          if (potentialSnapTarget) potentialSnapTarget.classList.add('snap-animation');
           if (currentDraggedBlock) currentDraggedBlock.addEventListener('animationend', () => currentDraggedBlock.classList.remove('snap-animation'), { once: true });
           if (potentialSnapTarget) potentialSnapTarget.addEventListener('animationend', () => potentialSnapTarget.classList.remove('snap-animation'), { once: true });

          connectBlocks(currentDraggedBlock, potentialSnapTarget, snapDirection);

          // Clean up remaining highlights
          if (currentDraggedBlock) currentDraggedBlock.classList.remove('snap-source');
           if (potentialSnapTarget) potentialSnapTarget.classList.remove('snap-target', snapDirection === 'left' ? 'snap-left' : 'snap-right');

      } else {
          console.log(`dragend: No snap for ${block.id}. Final position calculation.`);
          // --- No Snap: Position the block where it was dropped ---
           // Check if drop was successful (e.dataTransfer.dropEffect is not 'none')
           // Note: dropEffect might not be reliably set on dragend in all browsers
           // We assume if no snap target, it should be placed.

          // Calculate position relative to the CONTAINER
          const containerRect = blocksContainer.getBoundingClientRect();

           // Use event coordinates (e.clientX/Y) which are relative to viewport
           let finalX = e.clientX - containerRect.left - dragOffsetX + blocksContainer.scrollLeft;
           let finalY = e.clientY - containerRect.top - dragOffsetY + blocksContainer.scrollTop;

           // Clamp position within container bounds (adjust as needed)
           const blockWidth = block.offsetWidth;
           const blockHeight = block.offsetHeight;
           finalX = Math.max(0, Math.min(finalX, blocksContainer.scrollWidth - blockWidth));
           finalY = Math.max(0, Math.min(finalY, blocksContainer.scrollHeight - blockHeight));

           console.log(`dragend: Setting ${block.id} position to X: ${finalX}, Y: ${finalY}`);

           // *** Ensure block is absolutely positioned ***
           block.style.position = 'absolute';
           block.style.left = `${finalX}px`;
           block.style.top = `${finalY}px`;

           // Clear any lingering highlights just in case
           clearSpecificHighlights(block, potentialSnapTarget);
      }

      // --- Final Cleanup ---
      console.log(`dragend: Resetting state for ${block.id}`);
      currentDraggedBlock = null;
      potentialSnapTarget = null;
      snapDirection = null;
      currentPotentialSnapTarget = null;
      dragOffsetX = 0;
      dragOffsetY = 0;
      lastRightClickedBlock = null; // Clear right-click context after drag potentially involving it
      hideConnectionIndicator();
      clearAllHighlights(); // Clear any remaining highlights globally as a safety net
    });

    // Optional: Handle dragleave from container to clear highlights if needed
    blocksContainer.addEventListener('dragleave', (e) => {
        // Be careful with this, it fires when moving over child elements.
        // Check if the relatedTarget is outside the container.
        if (!blocksContainer.contains(e.relatedTarget) && currentDraggedBlock) {
             console.log("dragleave container");
             clearSpecificHighlights(currentDraggedBlock, currentPotentialSnapTarget);
             currentPotentialSnapTarget = null; // Reset target when leaving container
        }
    });

     // Optional: Handle drop event on container (can be alternative place for final positioning)
     // blocksContainer.addEventListener('drop', (e) => {
     //    e.preventDefault(); // Prevent default drop handling (like opening link)
     //    if (currentDraggedBlock && !potentialSnapTarget) {
     //        // Logic to position the block if it wasn't snapped
     //        // This duplicates logic in dragend, usually one place is sufficient
     //    }
     // });


  }); // End forEach block

  // מאזין לכפתור "נקה הכל"
  const clearAllButton = document.getElementById('clear-all');
  if (clearAllButton) {
    clearAllButton.addEventListener('click', function() {
       console.log("Clearing all connections and resetting positions...");
       currentDraggedBlock = null; // Reset state variables
       potentialSnapTarget = null;
       snapDirection = null;
       lastClickedBlock = null;
       lastRightClickedBlock = null;
       currentPotentialSnapTarget = null;

       clearAllHighlights();
       removeDetachMenu();
       hideConnectionIndicator();

       document.querySelectorAll('.block').forEach((block, index) => {
           disconnectBlock(block); // Disconnect first

           // Reset styles - Adjust based on your initial layout
           block.style.position = ''; // Or 'relative'/'static' if that's the default
           block.style.left = '';
           block.style.top = '';
           block.style.opacity = '1'; // Ensure visible
           block.classList.remove('dragging', 'connected-block', 'has-connected-block');
           block.removeAttribute('data-connected-left');
           block.removeAttribute('data-connected-right');
           block.removeAttribute('data-connection-direction');
           block.setAttribute('draggable', 'true'); // Ensure draggable

           // TODO: Add logic here to reposition blocks to their initial state/layout
           // Example: Place them in a row/column based on index
           // block.style.position = 'absolute';
           // block.style.left = `${10 + index * 120}px`; // Example horizontal layout
           // block.style.top = '10px';
       });
       console.log("Clear all complete.");
       // alert("הכל נוקה ואופס!");
    });
  }

  // קריאה לפונקציה שמוסיפה את ה-CSS ל-head
  addHighlightStyles();

  console.log("linkage-improved.js loaded and initialized.");

}); // End DOMContentLoaded

// --- END OF FILE linkage-improved.js ---
