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

  // פונקציה ליצירת תפריט הקשר (אם עדיין רלוונטי)
  function createDetachMenu(block, x, y) {
    removeDetachMenu(); // הסרת תפריט קודם אם קיים

    const menu = document.createElement('div');
    menu.classList.add('detach-context-menu'); // Use class from CSS
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.padding = '5px';
    menu.style.zIndex = '1000';
    menu.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.2)'; // Added shadow

    const detachButton = document.createElement('button');
    detachButton.textContent = 'נתק חיבור'; // Detach connection
    detachButton.style.display = 'block'; // Ensure button takes full width
    detachButton.style.width = '100%';
    detachButton.style.padding = '5px 10px';
    detachButton.style.border = 'none';
    detachButton.style.backgroundColor = 'transparent';
    detachButton.style.cursor = 'pointer';
    detachButton.addEventListener('mouseover', () => detachButton.style.backgroundColor = '#eee');
    detachButton.addEventListener('mouseout', () => detachButton.style.backgroundColor = 'transparent');


    detachButton.onclick = () => {
      // לוגיקה לניתוק הבלוק (זו דוגמה, יש להתאים ללוגיקה הספציפית)
      console.log(`Attempting to detach block: ${block.id}`);
      disconnectBlock(block); // Call your specific disconnect function
      removeDetachMenu();
    };

    menu.appendChild(detachButton);
    document.body.appendChild(menu);

    // סגירת התפריט בלחיצה מחוץ לו
    setTimeout(() => { // Use timeout to avoid immediate closing by the same click
        document.addEventListener('click', handleOutsideClick, { once: true });
    }, 0);

    lastRightClickedBlock = block; // Store the block associated with the menu
  }

  // פונקציה להסרת תפריט הקשר
  function removeDetachMenu() {
    const existingMenu = document.querySelector('.detach-context-menu');
    if (existingMenu) {
      existingMenu.remove();
      document.removeEventListener('click', handleOutsideClick); // Clean up listener
    }
    lastRightClickedBlock = null;
  }

  // פונקציה לסגירת התפריט בלחיצה מחוץ לו
  function handleOutsideClick(event) {
      const menu = document.querySelector('.detach-context-menu');
      // Check if the click was outside the menu
      if (menu && !menu.contains(event.target)) {
          removeDetachMenu();
      } else {
          // If the click was inside, re-attach the listener
          // because the 'once: true' removed it. This happens
          // if the click was on the button itself.
           document.addEventListener('click', handleOutsideClick, { once: true });
      }
  }


  // פונקציה להסתרת אינדיקטור החיבור (אם קיים)
  function hideConnectionIndicator() {
    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
      indicator.style.pointerEvents = 'none'; // Make it non-interactive when hidden
    }
  }

  // הוספת סגנונות CSS להדגשה ואנימציה
  function addHighlightStyles() {
    // יצירת אלמנט style
    const style = document.createElement('style');
    style.textContent = `
      /* הדגשת בלוק מקור (הנגרר) כשקרוב להצמדה */
      .snap-source .block-svg-image,
      .snap-source img {
        filter: brightness(1.05);
        transition: filter 0.15s ease-out, box-shadow 0.15s ease-out; /* עדכון המעבר */
        box-shadow: 0 0 8px 2px rgba(0, 180, 255, 0.6);
      }

      /* הדגשת בלוק יעד */
      .snap-target .block-svg-image,
      .snap-target img {
        filter: brightness(1.1);
        transition: filter 0.15s ease-out, box-shadow 0.15s ease-out; /* עדכון המעבר */
        box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.6);
      }

      /* *** סגנון חדש: הילה צהובה בוהקת ל"מוכן להצמדה" *** */
      .ready-to-snap .block-svg-image,
      .ready-to-snap img {
         box-shadow: 0 0 12px 5px rgba(255, 223, 0, 0.9) !important; /* צהוב-זהב בוהק, שימוש ב-!important אם יש התנגשויות */
         filter: brightness(1.15) !important; /* שימוש ב-!important אם יש התנגשויות */
         transition: filter 0.1s ease-out, box-shadow 0.1s ease-out; /* מעבר מהיר יותר */
      }
      /* **************************************************** */

      /* הדגשת השקע השמאלי בבלוק היעד */
      .snap-left::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 5px;
        height: 18px;
        background-color: rgba(255, 255, 100, 0.8);
        border-radius: 0 3px 3px 0;
        z-index: 10;
        pointer-events: none; /* למנוע הפרעה לאירועי עכבר */
      }

      /* הדגשת הפין הימני בבלוק היעד */
      .snap-right::after {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 5px;
        height: 18px;
        background-color: rgba(255, 255, 100, 0.8);
        border-radius: 3px 0 0 3px;
        z-index: 10;
        pointer-events: none; /* למנוע הפרעה לאירועי עכבר */
      }

      /* אנימציית הצמדה */
      @keyframes snapEffect {
        0% { transform: scale(1.02); }
        40% { transform: scale(0.98); }
        70% { transform: scale(1.01); }
        100% { transform: scale(1); }
      }

      .snap-animation {
        animation: snapEffect 0.3s ease-out;
      }

      /* אנימציית ניתוק */
      @keyframes detachEffect {
        0% { transform: scale(1); }
        30% { transform: scale(1.04) rotate(1deg); }
        60% { transform: scale(0.98) rotate(-1deg); }
        100% { transform: scale(1) rotate(0); }
      }

      .detach-animation {
        animation: detachEffect 0.3s ease-out;
      }

      /* אנימציית פעימה לאינדיקטור החיבור (אם קיים) */
      @keyframes pulseIndicator {
        0% { opacity: 0.5; }
        50% { opacity: 0.9; }
        100% { opacity: 0.5; }
      }

      /* סימון בלוקים מחוברים */
      .connected-block {
        /* אפשר להוסיף סגנון עדין אם רוצים, אך ההילה עדיפה */
        /* filter: brightness(1.02); */
      }

      .has-connected-block {
        position: relative; /* נדרש עבור המיקום של הקו */
      }

      /* סימון חיבור ויזואלי - קו דק בין בלוקים מחוברים (אופציונלי) */
      .connected-block[data-connection-direction="right"]::after,
      .has-connected-block[data-connection-direction="left"]::before {
        content: '';
        position: absolute;
        width: 4px; /* רוחב הקו */
        height: 12px; /* גובה הקו */
        background-color: rgba(255, 255, 0, 0.4); /* צבע צהוב שקוף */
        z-index: 5; /* מתחת להדגשות אבל מעל הרקע */
        pointer-events: none; /* למנוע הפרעה לאירועי עכבר */
      }
      /* מיקום הקו הימני */
      .connected-block[data-connection-direction="right"]::after {
         right: -2px; /* ממקם אותו בין הבלוקים */
         top: 50%;
         transform: translateY(-50%);
      }
       /* מיקום הקו השמאלי */
      .has-connected-block[data-connection-direction="left"]::before {
          left: -2px; /* ממקם אותו בין הבלוקים */
          top: 50%;
          transform: translateY(-50%);
      }


      /* עיצוב התפריט הקשר */
      .detach-context-menu {
        min-width: 120px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        background-color: white; /* Ensure background */
        border: 1px solid #ccc; /* Ensure border */
        padding: 5px; /* Ensure padding */
        z-index: 1000; /* Ensure visibility */
        box-shadow: 2px 2px 5px rgba(0,0,0,0.2); /* Ensure shadow */
      }
       .detach-context-menu button {
            display: block;
            width: 100%;
            padding: 5px 10px;
            border: none;
            background-color: transparent;
            cursor: pointer;
            text-align: right; /* Or left based on language */
        }
        .detach-context-menu button:hover {
            background-color: #eee;
        }

      /* סגנון לאינדיקטור החיבור (אם קיים) */
      #connection-indicator {
        position: fixed; /* Or absolute depending on container */
        /* Add other styles: size, background, border-radius, etc. */
        transition: all 0.2s ease-out;
        opacity: 0; /* Start hidden */
        pointer-events: none;
        z-index: 900;
        /* Example Style:
        width: 10px;
        height: 10px;
        background-color: yellow;
        border-radius: 50%;
        border: 1px solid orange;
        */
      }
    `;

    // הוספה לראש המסמך
    document.head.appendChild(style);
  }

  // *** פונקציית עזר לניקוי הדגשות ספציפיות ***
  function clearSpecificHighlights(sourceBlock, targetBlock) {
      const classesToRemove = ['snap-source', 'snap-target', 'snap-left', 'snap-right', 'ready-to-snap'];
      if (sourceBlock) {
          sourceBlock.classList.remove(...classesToRemove);
          // Sometimes direct img/svg manipulation might be needed if classes aren't on the parent
          const sourceImage = sourceBlock.querySelector('.block-svg-image, img');
          if (sourceImage) sourceImage.style.filter = ''; // Reset direct styles if any
      }
      if (targetBlock) {
          targetBlock.classList.remove(...classesToRemove);
           const targetImage = targetBlock.querySelector('.block-svg-image, img');
          if (targetImage) targetImage.style.filter = '';
      }
  }

  // פונקציית ניקוי כללית (מעודכנת)
  function clearAllHighlights() {
      document.querySelectorAll('.snap-source, .snap-target, .snap-left, .snap-right, .ready-to-snap').forEach(el => {
          el.classList.remove('snap-source', 'snap-target', 'snap-left', 'snap-right', 'ready-to-snap');
           const image = el.querySelector('.block-svg-image, img');
           if (image) image.style.filter = ''; // Reset direct styles if any
      });
      // Reset global state variables related to highlighting
      potentialSnapTarget = null;
      snapDirection = null;
      currentPotentialSnapTarget = null;
  }

  // --- הגדרת הפונקציות הדרושות (יש להשלים או לוודא שהן קיימות) ---

  // מחזיר את הבלוק הקרוב ביותר שניתן להצמיד אליו, או null
  function findPotentialSnapTarget(draggedBlock) {
    // Placeholder: Implement logic to find the nearest snappable block
    // based on distance and connection rules (e.g., type compatibility).
    // Example: Iterate through all '.block' elements, calculate distance,
    // check if connection is allowed.
    const allBlocks = document.querySelectorAll('.block:not(.dragging)'); // Select blocks that are not being dragged
    let closestTarget = null;
    let minDistance = 50; // Maximum snap distance in pixels

    const draggedRect = draggedBlock.getBoundingClientRect();
    const draggedCenterX = draggedRect.left + draggedRect.width / 2;
    const draggedCenterY = draggedRect.top + draggedRect.height / 2;

    allBlocks.forEach(block => {
        if (block === draggedBlock) return; // Don't snap to self

        const targetRect = block.getBoundingClientRect();
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        const dx = draggedCenterX - targetCenterX;
        const dy = draggedCenterY - targetCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check horizontal proximity for left/right snapping
        const horizontalProximity = Math.abs(draggedRect.right - targetRect.left) < minDistance || Math.abs(draggedRect.left - targetRect.right) < minDistance;
        const verticalAlignment = Math.abs(draggedCenterY - targetCenterY) < targetRect.height * 0.7; // Allow some vertical leeway

        if (distance < minDistance * 1.5 && horizontalProximity && verticalAlignment) { // Adjust distance check logic as needed
             // Basic distance check, refine with connection point logic
             // Check connection point proximity more specifically if needed
             // Here, we just find the closest one within range for simplicity
            if (distance < minDistance) {
                minDistance = distance;
                closestTarget = block;
            }
        }
    });
    // console.log("Potential Target:", closestTarget ? closestTarget.id : 'None');
    return closestTarget;
  }

  // קובע את כיוון ההצמדה ('left' או 'right') או null
  function determineSnapDirection(draggedBlock, targetBlock) {
    if (!draggedBlock || !targetBlock) return null;

    const draggedRect = draggedBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    const snapThreshold = 25; // How close the edges need to be

    const canConnectRight = !draggedBlock.dataset.connectedRight; // Check if right side is free
    const canConnectLeft = !targetBlock.dataset.connectedLeft;   // Check if target's left side is free

    // Check for snapping dragged block's RIGHT to target block's LEFT
    if (canConnectRight && canConnectLeft &&
        Math.abs(draggedRect.right - targetRect.left) < snapThreshold &&
        Math.abs(draggedRect.top - targetRect.top) < draggedRect.height / 2) { // Check vertical alignment too
      return 'left'; // Snap target highlights its left socket
    }

    const canConnectLeftDragged = !draggedBlock.dataset.connectedLeft; // Check if dragged left is free
    const canConnectRightTarget = !targetBlock.dataset.connectedRight; // Check if target right is free

    // Check for snapping dragged block's LEFT to target block's RIGHT
     if (canConnectLeftDragged && canConnectRightTarget &&
         Math.abs(draggedRect.left - targetRect.right) < snapThreshold &&
         Math.abs(draggedRect.top - targetRect.top) < draggedRect.height / 2) {
       return 'right'; // Snap target highlights its right pin
     }

    return null; // No valid snap direction found
  }

  // מבצע את החיבור הלוגי והויזואלי בין הבלוקים
  function connectBlocks(sourceBlock, targetBlock, direction) {
    console.log(`Connecting ${sourceBlock.id} to ${targetBlock.id} (direction: ${direction})`);

    // 1. Update Data Attributes to mark connection
    if (direction === 'left') { // Source right connects to Target left
      sourceBlock.dataset.connectedRight = targetBlock.id;
      targetBlock.dataset.connectedLeft = sourceBlock.id;
      sourceBlock.dataset.connectionDirection = 'right'; // Visual cue on source
      targetBlock.dataset.connectionDirection = 'left'; // Visual cue on target
    } else { // Source left connects to Target right
      sourceBlock.dataset.connectedLeft = targetBlock.id;
      targetBlock.dataset.connectedRight = sourceBlock.id;
      sourceBlock.dataset.connectionDirection = 'left'; // Visual cue on source
      targetBlock.dataset.connectionDirection = 'right'; // Visual cue on target
    }

    // Add classes for visual styling of connected state
    sourceBlock.classList.add('connected-block', 'has-connected-block');
    targetBlock.classList.add('connected-block', 'has-connected-block');


    // 2. Align Blocks Visually (Absolute Positioning Example)
    const targetRect = targetBlock.getBoundingClientRect();
    const sourceRect = sourceBlock.getBoundingClientRect(); // Get current position
    const container = sourceBlock.parentElement; // Assuming they share a parent
    const containerRect = container.getBoundingClientRect();

     // Calculate position relative to the container
    const targetStyle = window.getComputedStyle(targetBlock);
    const targetLeft = parseFloat(targetStyle.left) || targetBlock.offsetLeft;
    const targetTop = parseFloat(targetStyle.top) || targetBlock.offsetTop;


    let newLeft, newTop;

    if (direction === 'left') { // Snap source's right to target's left
        newLeft = targetLeft - sourceRect.width + 1; // +1 for slight overlap or gap adjustment
        newTop = targetTop;
    } else { // Snap source's left to target's right
        newLeft = targetLeft + targetRect.width -1; // -1 for slight overlap or gap adjustment
        newTop = targetTop;
    }

     // Set new position - Make sure blocks are absolutely positioned
     sourceBlock.style.position = 'absolute'; // Ensure positioning context
     targetBlock.style.position = 'absolute'; // Ensure positioning context
     sourceBlock.style.left = `${newLeft}px`;
     sourceBlock.style.top = `${newTop}px`;

    // Optional: Disable dragging for connected blocks or implement chain dragging
     // sourceBlock.draggable = false; // Simple approach

    console.log(`Blocks connected: ${sourceBlock.id} <=> ${targetBlock.id}`);
     // Optional: Play sound effect
     // const snapSound = document.getElementById('snapSound');
     // if(snapSound) snapSound.play();
  }

  // מנתק בלוק מהבלוקים המחוברים אליו
  function disconnectBlock(blockToDisconnect) {
     console.log(`Disconnecting block ${blockToDisconnect.id}`);

     // Play detach animation
     blockToDisconnect.classList.add('detach-animation');
     blockToDisconnect.addEventListener('animationend', () => {
         blockToDisconnect.classList.remove('detach-animation');
     }, { once: true });

     let disconnected = false;

     // Check connection on the right side of the block
     const connectedRightId = blockToDisconnect.dataset.connectedRight;
     if (connectedRightId) {
         const connectedBlock = document.getElementById(connectedRightId);
         if (connectedBlock) {
             console.log(`  - Disconnecting from ${connectedBlock.id} (right side)`);
             delete connectedBlock.dataset.connectedLeft; // Clear connection from the other block
             connectedBlock.removeAttribute('data-connection-direction');
             connectedBlock.classList.remove('has-connected-block','connected-block'); // Adjust classes as needed
         }
         delete blockToDisconnect.dataset.connectedRight;
         disconnected = true;
     }

     // Check connection on the left side of the block
     const connectedLeftId = blockToDisconnect.dataset.connectedLeft;
     if (connectedLeftId) {
         const connectedBlock = document.getElementById(connectedLeftId);
         if (connectedBlock) {
              console.log(`  - Disconnecting from ${connectedBlock.id} (left side)`);
             delete connectedBlock.dataset.connectedRight; // Clear connection from the other block
             connectedBlock.removeAttribute('data-connection-direction');
              connectedBlock.classList.remove('has-connected-block','connected-block'); // Adjust classes as needed
         }
         delete blockToDisconnect.dataset.connectedLeft;
         disconnected = true;
     }

     // Clean up the disconnected block itself
     if (disconnected) {
          blockToDisconnect.removeAttribute('data-connection-direction');
          blockToDisconnect.classList.remove('has-connected-block','connected-block');
          // Optional: Make draggable again if it was disabled
          // blockToDisconnect.draggable = true;
     } else {
         console.log(`  - Block ${blockToDisconnect.id} was not connected.`);
     }

     // Optional: Play sound effect
     // const detachSound = document.getElementById('detachSound');
     // if(detachSound) detachSound.play();

     hideConnectionIndicator(); // Hide indicator after any disconnection
  }

  // --- מאזיני אירועים ---

  // הוספת מאזינים לכל הבלוקים שניתנים לגרירה
  document.querySelectorAll('.block').forEach(block => {
    block.setAttribute('draggable', 'true'); // Make sure blocks are draggable

    // לחיצה ימנית להצגת תפריט (אם הבלוק מחובר)
     block.addEventListener('contextmenu', (e) => {
         e.preventDefault(); // מניעת תפריט ברירת מחדל של הדפדפן
         // הצג תפריט רק אם הבלוק מחובר למשהו
         if (block.dataset.connectedLeft || block.dataset.connectedRight) {
              createDetachMenu(block, e.clientX, e.clientY);
         } else {
             removeDetachMenu(); // הסר תפריט אם קיים ולא רלוונטי
         }
         lastRightClickedBlock = block; // Store the clicked block regardless
     });

    // התחלת גרירה
    block.addEventListener('dragstart', (e) => {
      // Delay slightly to allow potential disconnect logic from context menu
      setTimeout(() => {
          // If a context menu was just used to disconnect, don't start drag
          if (lastRightClickedBlock === block && document.querySelector('.detach-context-menu')) {
              // Potentially prevent drag if menu is active / just used?
              // Or just let drag proceed after menu closes. For now, let it drag.
          }

          currentDraggedBlock = block;
          currentDraggedBlock.classList.add('dragging'); // Add class for styling during drag

          // חישוב ההיסט (offset) של העכבר יחסית לפינה השמאלית העליונה של הבלוק
          const rect = block.getBoundingClientRect();
          dragOffsetX = e.clientX - rect.left;
          dragOffsetY = e.clientY - rect.top;

          e.dataTransfer.effectAllowed = 'move';
          // Optional: Set drag image (can be tricky with custom styling)
          // e.dataTransfer.setDragImage(block, dragOffsetX, dragOffsetY);

          // Hide original block slightly later to avoid flash
           setTimeout(() => block.style.opacity = '0.5', 0); // Make original semi-transparent

          // ניקוי הדגשות קודמות אם נשארו בטעות
          clearAllHighlights();
          removeDetachMenu(); // Close context menu on drag start
      }, 10); // Short delay
    });

    // במהלך גרירה (dragover על קונטיינר או body)
    // Note: 'drag' event fires frequently on the dragged element itself.
    // 'dragover' fires on potential drop targets. We need position, so maybe use document listener?
    // Let's use drag event for position update and check targets.

    block.addEventListener('drag', (e) => {
        if (!currentDraggedBlock || e.clientX === 0 && e.clientY === 0) return; // Fix for drag end ghost event

        // עדכון ויזואלי מיידי (פחות מומלץ אם משתמשים ב-setDragImage)
        // במקום זה, נשתמש במיקום העכבר כדי לבדוק מטרות הצמדה
        const currentX = e.clientX;
        const currentY = e.clientY;

        // ניקוי הדגשות ספציפיות מהפעם הקודמת
        clearSpecificHighlights(currentDraggedBlock, currentPotentialSnapTarget); // Use the new function

        // מציאת יעד פוטנציאלי חדש
        potentialSnapTarget = findPotentialSnapTarget(currentDraggedBlock); // Find target based on current pos
        snapDirection = determineSnapDirection(currentDraggedBlock, potentialSnapTarget); // Determine direction

        if (potentialSnapTarget && snapDirection) {
            // 1. הוספת הדגשות הקרבה הרגילות
            currentDraggedBlock.classList.add('snap-source');
            potentialSnapTarget.classList.add('snap-target');
            potentialSnapTarget.classList.add(snapDirection === 'left' ? 'snap-left' : 'snap-right');

            // 2. *** הוספת הילת "מוכן להצמדה" לשני הבלוקים ***
            currentDraggedBlock.classList.add('ready-to-snap');
            potentialSnapTarget.classList.add('ready-to-snap');

            currentPotentialSnapTarget = potentialSnapTarget; // שמירת היעד הנוכחי לבדיקה הבאה

        } else {
            // לא נמצא יעד או שהתנאים לא מתקיימים
            currentPotentialSnapTarget = null; // איפוס היעד הקודם
        }
    });


    // סיום גרירה (שחרור)
    block.addEventListener('dragend', (e) => {
        if (!currentDraggedBlock) return;

        currentDraggedBlock.style.opacity = '1'; // Restore original opacity
        currentDraggedBlock.classList.remove('dragging');

        if (potentialSnapTarget && snapDirection) {
            // *** הצמדה מתבצעת ***

            // הסרת הילת "מוכן להצמדה" לפני האנימציה
            currentDraggedBlock.classList.remove('ready-to-snap');
            potentialSnapTarget.classList.remove('ready-to-snap');

            // הוספת אנימציית הצמדה
            currentDraggedBlock.classList.add('snap-animation');
            potentialSnapTarget.classList.add('snap-animation');
            currentDraggedBlock.addEventListener('animationend', () => currentDraggedBlock.classList.remove('snap-animation'), { once: true });
            potentialSnapTarget.addEventListener('animationend', () => potentialSnapTarget.classList.remove('snap-animation'), { once: true });

            // לוגיקת החיבור עצמה
            connectBlocks(currentDraggedBlock, potentialSnapTarget, snapDirection);

            // ניקוי הדגשות קרבה לאחר ההצמדה
            currentDraggedBlock.classList.remove('snap-source');
            potentialSnapTarget.classList.remove('snap-target', snapDirection === 'left' ? 'snap-left' : 'snap-right');

        } else {
            // שחרור ללא הצמדה - מקם את הבלוק במקום השחרור
            const container = document.getElementById('blocks-container') || document.body; // Or your specific container
            const containerRect = container.getBoundingClientRect();
            // Calculate position relative to container, considering scroll
            let finalX = e.clientX - containerRect.left - dragOffsetX + container.scrollLeft;
            let finalY = e.clientY - containerRect.top - dragOffsetY + container.scrollTop;

            // Ensure block stays within bounds (optional)
            finalX = Math.max(0, Math.min(finalX, containerRect.width - currentDraggedBlock.offsetWidth));
            finalY = Math.max(0, Math.min(finalY, containerRect.height - currentDraggedBlock.offsetHeight));


             // Ensure block is absolutely positioned for this to work
            currentDraggedBlock.style.position = 'absolute';
            currentDraggedBlock.style.left = `${finalX}px`;
            currentDraggedBlock.style.top = `${finalY}px`;


            // ודא שכל ההדגשות הוסרו
            clearSpecificHighlights(currentDraggedBlock, potentialSnapTarget); // Use specific clear
             // or use clearAllHighlights(); if preferred and updated
        }

        // איפוס משתני מצב הגרירה
        currentDraggedBlock = null;
        potentialSnapTarget = null;
        snapDirection = null;
        currentPotentialSnapTarget = null; // איפוס המשתנה החדש
        dragOffsetX = 0;
        dragOffsetY = 0;
        lastRightClickedBlock = null; // Clear right-click context on drag end

        // הסתר אינדיקטור אם היה מוצג
        hideConnectionIndicator();
    });

    // --- אירועי מטרה (על הקונטיינר או אלמנטים אחרים) ---
    // Need dragover on the container to allow dropping
     const container = document.getElementById('blocks-container') || document.body;
     container.addEventListener('dragover', (e) => {
         e.preventDefault(); // Necessary to allow dropping
         e.dataTransfer.dropEffect = 'move';
     });

     // Optional: dragenter / dragleave on targets for different highlighting
     // (but our current logic handles highlights during the 'drag' event)

  }); // End forEach block

  // מאזין לכפתור "נקה הכל"
  const clearAllButton = document.getElementById('clear-all');
  if (clearAllButton) {
    clearAllButton.addEventListener('click', function() {
       console.log("Clearing all connections and resetting positions...");
      // ניקוי משתנים גלובליים
      currentDraggedBlock = null;
      potentialSnapTarget = null;
      snapDirection = null;
      lastClickedBlock = null;
      lastRightClickedBlock = null;
      currentPotentialSnapTarget = null;

      clearAllHighlights(); // ניקוי כל ההדגשות החזותיות
      removeDetachMenu(); // הסרת תפריט קשר פתוח
      hideConnectionIndicator(); // הסתרת אינדיקטור

      // ניתוק כל הבלוקים ואיפוס מיקומים (דוגמה)
      document.querySelectorAll('.block').forEach((block, index) => {
          // לוגיקת ניתוק מלאה
          disconnectBlock(block); // Ensure disconnect logic runs for each

          // איפוס מיקום התחלתי (צריך להתאים ללוגיקת הפריסה המקורית)
          block.style.position = ''; // Remove absolute positioning if not default
          block.style.left = '';
          block.style.top = '';
          // Maybe reset to initial grid or list position? Example:
          // block.style.position = 'relative'; // Or static
          // Or re-apply initial absolute positions if known

          // ניקוי כל data attributes הקשורים לחיבורים
           delete block.dataset.connectedLeft;
           delete block.dataset.connectedRight;
           delete block.dataset.connectionDirection;
           block.classList.remove('connected-block', 'has-connected-block');
           block.style.filter = ''; // Reset any lingering filters
           block.style.opacity = '1'; // Ensure full opacity
           block.draggable = true; // Make sure it's draggable again
      });

        // כאן תוכל להוסיף קוד ש"מסדר מחדש" את הבלוקים אם יש לך פריסה התחלתית
        // לדוגמה, למקם אותם בשורה או בעמודה.
        alert("הכל נוקה ואופס!"); // Feedback למשתמש
    });
  }

  // קריאה לפונקציה שמוסיפה את ה-CSS ל-head
  addHighlightStyles();

}); // End DOMContentLoaded

// --- END OF FILE linkage-improved.js ---
