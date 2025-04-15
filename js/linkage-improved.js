--- START OF FILE linkage-improved.js ---

// linkage-improved.js - הצמדת בלוקים עם חיווי ויזואלי משופר
document.addEventListener('DOMContentLoaded', function() {
  console.log('טוען מערכת הצמדת בלוקים משופרת...');

  setTimeout(function() {
    setupSnapping();
  }, 1000);

  function setupSnapping() {
    console.log('מפעיל מערכת הצמדה עם חיווי ויזואלי...');

    // קבועים
    const SNAP_THRESHOLD = 25;
    // *** שינוי: הגדלת הסף לבדיקה ***
    const CLOSE_HIGHLIGHT_THRESHOLD = 60; // מרחק גדול יותר לבדיקה, אפשר להקטין אח"כ ל-35 או ערך רצוי אחר

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות לא נמצא!');
      return;
    }

    let currentDraggedBlock = null;
    let potentialSnapTarget = null;
    let snapDirection = null;

    addHighlightStyles();

    // ---- מערכת הגרירה (ללא שינוי מהגרסה הקודמת שהייתה תקינה מבחינת גרירה) ----

    programmingArea.addEventListener('dragstart', function(e) {
      if (e.target.classList.contains('block-container')) {
        currentDraggedBlock = e.target;

        // הסתרת רוח רפאים סטנדרטית (כמו שהיה)
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.effectAllowed = 'move'; // ניתן להוסיף
        e.dataTransfer.setDragImage(img, 0, 0);

        e.target.classList.add('dragging');

        // שמירת מיקום מקורי משופרת
        e.target.dataset.originalLeft = e.target.style.left || e.target.offsetLeft + 'px';
        e.target.dataset.originalTop = e.target.style.top || e.target.offsetTop + 'px';
        console.log('Drag started for:', currentDraggedBlock.id);
      }
    });

    programmingArea.addEventListener('dragend', function(e) {
      if (currentDraggedBlock && e.target === currentDraggedBlock) {
        console.log('סיום גרירה נתפס');

        // *** ניקוי הדגשת הקרבה ***
        e.target.classList.remove('close-to-snap-highlight');
        e.target.classList.remove('dragging');


        checkForPossibleSnapAfterDrag(e.target);

        resetHighlighting(); // מנקה משתני מצב
        currentDraggedBlock = null;
      }
    });

    programmingArea.addEventListener('dragover', function(e) {
      if (currentDraggedBlock) {
        e.preventDefault(); // חיוני לאפשר drop
      }
    });

    // עדכון מיקום וזיהוי קרבה באמצעות mousemove (כמו שהיה)
    programmingArea.addEventListener('mousemove', function(e) {
      if (currentDraggedBlock && currentDraggedBlock.classList.contains('dragging')) {
        // עדכון מיקום הבלוק הנגרר (ללא שינוי, כדי לשמר את הגרירה שאהבת)
        updateDraggedBlockPosition(e);

        // בדיקה אם יש בלוק פוטנציאלי להצמדה בקרבת מקום והחלת האפקט החדש
        checkForProximityHighlight(currentDraggedBlock, e.clientX, e.clientY);
      }
    });

    // פונקציה לעדכון מיקום הבלוק הנגרר (ללא שינוי מהגרסה הקודמת)
    function updateDraggedBlockPosition(e) {
       if (!currentDraggedBlock) return;
       const programRect = programmingArea.getBoundingClientRect();
       const blockRect = currentDraggedBlock.getBoundingClientRect();
       // הפחתת מחצית כדי למרכז את הבלוק תחת הסמן
       const halfWidth = blockRect.width / 2;
       const halfHeight = blockRect.height / 2;

       // הגבלת הגרירה לגבולות אזור התכנות (בערך)
       const minLeft = 0;
       const maxLeft = programRect.width - blockRect.width;
       const minTop = 0;
       const maxTop = programRect.height - blockRect.height;

       let newLeft = e.clientX - programRect.left - halfWidth;
       let newTop = e.clientY - programRect.top - halfHeight;

       // החל הגבלות
       newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
       newTop = Math.max(minTop, Math.min(newTop, maxTop));


       // עדכן מיקום אם העכבר בתוך הגבולות הגיוניים של האזור
       if (e.clientX > programRect.left && e.clientX < programRect.right && e.clientY > programRect.top && e.clientY < programRect.bottom) {
            currentDraggedBlock.style.position = 'absolute'; // ודא אבסולוטיות
            currentDraggedBlock.style.left = newLeft + 'px';
            currentDraggedBlock.style.top = newTop + 'px';
       }
    }

    // מאזין לאירוע 'drop' (ללא שינוי משמעותי)
    programmingArea.addEventListener('drop', function(e) {
      console.log('אירוע drop נתפס באזור התכנות');
      e.preventDefault();

      setTimeout(function() {
        const blocks = programmingArea.querySelectorAll('.block-container:not(.dragging)');
        if (blocks.length > 0) {
             const droppedX = e.clientX - programmingArea.getBoundingClientRect().left;
             const droppedY = e.clientY - programmingArea.getBoundingClientRect().top;
             let closestDroppedBlock = null;
             let minDropDist = Infinity;

             blocks.forEach(block => {
                 if(!block.classList.contains('dragging') && !block.hasAttribute('data-original-left')) {
                     const rect = block.getBoundingClientRect();
                     const blockCenterX = rect.left - programmingArea.getBoundingClientRect().left + rect.width / 2;
                     const blockCenterY = rect.top - programmingArea.getBoundingClientRect().top + rect.height / 2;
                     const dist = Math.sqrt(Math.pow(droppedX - blockCenterX, 2) + Math.pow(droppedY - blockCenterY, 2));
                     if (dist < minDropDist && dist < 100) {
                         minDropDist = dist;
                         closestDroppedBlock = block;
                     }
                 }
             });

             if (closestDroppedBlock) {
                 console.log("זוהה בלוק חדש שהוטל:", closestDroppedBlock.id);
                 checkForPossibleSnapAfterDrop(closestDroppedBlock);
             } else {
                 console.log("לא זוהה בלוק חדש שהוטל בבירור.");
             }
        }
        resetHighlighting();
      }, 150);
    });


    // ---- פונקציות עזר ----

    // *** שינוי: הוספת console.log לאבחון ***
    function checkForProximityHighlight(draggedBlock, mouseX, mouseY) {
      if (!draggedBlock) return;

      const result = findClosestBlockForSnap(draggedBlock, mouseX, mouseY);
      // --- לוג אבחון 1 ---
      // console.log(`Checking proximity for ${draggedBlock.id}. Mouse: (${mouseX}, ${mouseY})`);

      if (result && result.block) {
        // --- לוג אבחון 2 ---
        console.log(`Closest block: ${result.block.id}, Distance: ${result.distance.toFixed(2)}, Threshold: ${CLOSE_HIGHLIGHT_THRESHOLD}`);

        // בדוק אם מספיק קרוב להדגשה
        if (result.distance < CLOSE_HIGHLIGHT_THRESHOLD) {
          // --- לוג אבחון 3 ---
          if (!draggedBlock.classList.contains('close-to-snap-highlight')) {
            console.log("!!! Applying highlight !!!");
          }
          potentialSnapTarget = result.block;
          snapDirection = result.direction;
          draggedBlock.classList.add('close-to-snap-highlight');
          clearTargetHighlight(potentialSnapTarget); // נקה הדגשות ישנות מהמטרה אם היו

        } else {
          // אם לא מספיק קרוב, הסר הדגשה אם קיימת
          if (draggedBlock.classList.contains('close-to-snap-highlight')) {
             console.log("--- Distance increased - Removing highlight ---"); // לוג 4
             draggedBlock.classList.remove('close-to-snap-highlight');
             potentialSnapTarget = null; // נקה גם את המטרה
             snapDirection = null;
          }
        }
      } else {
        // לא נמצא בלוק קרוב מספיק, הסר הדגשה אם קיימת
        if (draggedBlock.classList.contains('close-to-snap-highlight')) {
           console.log("--- No target found - Removing highlight ---"); // לוג 5
           draggedBlock.classList.remove('close-to-snap-highlight');
           potentialSnapTarget = null;
           snapDirection = null;
        }
      }
    }

    function checkForPossibleSnapAfterDrag(draggedBlock) {
        if (potentialSnapTarget && snapDirection && draggedBlock) {
            const draggedRect = draggedBlock.getBoundingClientRect();
            const targetRect = potentialSnapTarget.getBoundingClientRect();
            let finalDistance = calculateSnapDistance(draggedRect, targetRect, snapDirection);

            console.log(`Checking snap on dragend. Target: ${potentialSnapTarget.id}, Direction: ${snapDirection}, Final Distance: ${finalDistance.toFixed(2)}, Snap Threshold: ${SNAP_THRESHOLD}`);

            if (finalDistance <= SNAP_THRESHOLD) {
                 console.log("Executing snap.");
                 snapBlocks(draggedBlock, potentialSnapTarget, snapDirection);
            } else {
                 console.log("Final distance too large for snap.");
            }
        } else {
             console.log("No potential snap target at drag end.");
        }
         // ניקוי לאחר בדיקה
         potentialSnapTarget = null;
         snapDirection = null;
    }

     function checkForPossibleSnapAfterDrop(droppedBlock) {
         if (!droppedBlock) return;
         const blockRect = droppedBlock.getBoundingClientRect();
         const centerX = blockRect.left + blockRect.width / 2;
         const centerY = blockRect.top + blockRect.height / 2;

         const result = findClosestBlockForSnap(droppedBlock, centerX, centerY, true);

         if (result && result.block && result.distance <= SNAP_THRESHOLD) {
              console.log(`Executing snap after drop. Target: ${result.block.id}, Direction: ${result.direction}`);
              snapBlocks(droppedBlock, result.block, result.direction);
         } else {
              console.log("No snap target found after drop.");
              if(result) console.log(`Closest block after drop: ${result.block?.id}, Distance: ${result.distance?.toFixed(2)}`);
         }
     }

    function findClosestBlockForSnap(draggedBlock, clientX, clientY, isAfterDrop = false) {
      // ... (קוד הפונקציה נשאר זהה לגרסה הקודמת, מחזיר אובייקט עם block, direction, distance) ...
      if (!draggedBlock) return null;
      const blocks = programmingArea.querySelectorAll('.block-container');
      if (blocks.length < 2) return null;
      const draggedRect = draggedBlock.getBoundingClientRect();
      const rightPinX = draggedRect.right;
      const rightPinY = draggedRect.top + draggedRect.height / 2;
      const leftSocketX = draggedRect.left;
      const leftSocketY = draggedRect.top + draggedRect.height / 2;
      let closestBlock = null;
      let minDistance = Infinity;
      let bestDirection = null;
      // *** שימוש בסף הנכון: קרבה או הצמדה ***
      const threshold = isAfterDrop ? SNAP_THRESHOLD : CLOSE_HIGHLIGHT_THRESHOLD;

      blocks.forEach(block => {
        if (block === draggedBlock) return;
        const blockRect = block.getBoundingClientRect();
        const targetLeftSocketX = blockRect.left;
        const targetSocketY = blockRect.top + blockRect.height / 2;
        const targetRightPinX = blockRect.right;
        const targetPinY = targetSocketY;

        const leftDistance = Math.sqrt(Math.pow(rightPinX - targetLeftSocketX, 2) + Math.pow(rightPinY - targetSocketY, 2));
        const rightDistance = Math.sqrt(Math.pow(leftSocketX - targetRightPinX, 2) + Math.pow(leftSocketY - targetPinY, 2));

        let currentMinDist = Math.min(leftDistance, rightDistance);
        let currentDirection = (leftDistance <= rightDistance) ? 'left' : 'right'; // שיניתי ל <= כדי לתת עדיפות לחיבור משמאל במקרה של שוויון

        // בדיקה אם הוא הכי קרוב *וגם* מתחת לסף הרלוונטי
        if (currentMinDist < minDistance && currentMinDist < threshold) {
          minDistance = currentMinDist;
          closestBlock = block;
          bestDirection = currentDirection;
        }
      });
      return closestBlock ? { block: closestBlock, direction: bestDirection, distance: minDistance } : null;
    }

    function calculateSnapDistance(sourceRect, targetRect, direction) {
      // ... (קוד הפונקציה נשאר זהה) ...
        const sourcePinY = sourceRect.top + sourceRect.height / 2;
        const targetSocketY = targetRect.top + targetRect.height / 2;
        if (direction === 'left') {
            const sourceRightPinX = sourceRect.right;
            const targetLeftSocketX = targetRect.left;
            return Math.sqrt(Math.pow(sourceRightPinX - targetLeftSocketX, 2) + Math.pow(sourcePinY - targetSocketY, 2));
        } else {
            const sourceLeftSocketX = sourceRect.left;
            const targetRightPinX = targetRect.right;
            return Math.sqrt(Math.pow(sourceLeftSocketX - targetRightPinX, 2) + Math.pow(sourcePinY - targetSocketY, 2));
        }
    }

    function clearTargetHighlight(targetBlock) {
        if (targetBlock) {
             targetBlock.classList.remove('snap-target', 'snap-left', 'snap-right');
        }
    }

    function clearAllTargetHighlights() {
        const potentialTargets = programmingArea.querySelectorAll('.snap-target, .snap-left, .snap-right');
        potentialTargets.forEach(block => {
            block.classList.remove('snap-target', 'snap-left', 'snap-right');
        });
    }

    function resetHighlighting() {
      if (currentDraggedBlock) {
         currentDraggedBlock.classList.remove('close-to-snap-highlight');
      }
      clearAllTargetHighlights();
      potentialSnapTarget = null;
      snapDirection = null;
    }

    function snapBlocks(sourceBlock, targetBlock, direction) {
      // ... (קוד הפונקציה נשאר זהה לגרסה הקודמת) ...
       if (!sourceBlock || !targetBlock) return;
       try {
         const sourceRect = sourceBlock.getBoundingClientRect();
         const targetRect = targetBlock.getBoundingClientRect();
         const programRect = programmingArea.getBoundingClientRect();
         let newLeft, newTop;
         const verticalOffset = targetRect.top - programRect.top; // יישור אנכי

         if (direction === 'left') {
           newLeft = targetRect.left - programRect.left - sourceRect.width;
           newTop = verticalOffset;
         } else {
           newLeft = targetRect.right - programRect.left;
           newTop = verticalOffset;
         }

         sourceBlock.style.position = 'absolute';
         sourceBlock.style.left = newLeft + 'px';
         sourceBlock.style.top = newTop + 'px';

         sourceBlock.classList.add('connected-block');
         targetBlock.classList.add('has-connected-block');

         sourceBlock.setAttribute('data-connected-to', generateUniqueId(targetBlock));
         sourceBlock.setAttribute('data-connection-direction', direction);
         if(direction === 'left') {
             targetBlock.setAttribute('data-prev-block', generateUniqueId(sourceBlock));
             // אולי כדאי לעדכן גם את הבלוק שאחרי המקור, אם היה?
         } else { // direction == 'right'
             targetBlock.setAttribute('data-next-block', generateUniqueId(sourceBlock));
              // אולי כדאי לעדכן גם את הבלוק שלפני המקור, אם היה?
         }

         addSnapEffectAnimation(sourceBlock);
         console.log(`Snap executed: ${generateUniqueId(sourceBlock)} ${direction === 'left' ? '<--' : '-->'} ${generateUniqueId(targetBlock)}`);

       } catch (err) {
         console.error('Error snapping blocks:', err);
       }
    }

    function generateUniqueId(block) {
      // ... (קוד הפונקציה נשאר זהה) ...
      if (!block) return null;
      if (!block.id) {
        const uniqueId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        block.id = uniqueId;
      }
      return block.id;
    }

    function addSnapEffectAnimation(block) {
      // ... (קוד הפונקציה נשאר זהה) ...
      block.classList.add('snap-animation');
      setTimeout(() => {
        block.classList.remove('snap-animation');
      }, 300);
    }

    // *** שינוי: הוספת !important וביטול transition ב-CSS לבדיקה ***
    function addHighlightStyles() {
      const style = document.createElement('style');
      style.textContent = `
        .block-container.dragging {
          z-index: 1000;
          /* opacity: 0.8; */ /* אפשר להחזיר אם רוצים שקיפות קלה */
        }

        /* הדגשת קרבה לבלוק הנגרר */
        .block-container.dragging.close-to-snap-highlight > .scratch-block {
          box-shadow: 0 0 12px 5px rgba(255, 255, 0, 0.7), /* הילה צהובה */
                      0 0 0 3px blue !important; /* מסגרת כחולה - נוסף !important */
          filter: brightness(1.1);
          transition: none !important; /* בוטלה הטרנזיציה לבדיקה */
        }

        /* ביטול הדגשות ישנות/אחרות (נשאר כמו קודם) */
        .snap-source .scratch-block,
        .snap-target .scratch-block,
        .snap-left .scratch-block::before,
        .snap-right .scratch-block::after {
           box-shadow: none !important;
           filter: none;
           background-color: initial !important;
        }

        @keyframes snapEffect {
          0% { transform: scale(1.03); }
          50% { transform: scale(0.97); }
          100% { transform: scale(1); }
        }
        .snap-animation {
          animation: snapEffect 0.3s ease-out;
        }
        .connected-block, .has-connected-block {
          /* סגנון לבלוקים מחוברים אם רוצים */
        }
      `;
      document.head.appendChild(style);
    }

    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        currentDraggedBlock = null;
        resetHighlighting();
      });
    }

    console.log('מערכת הצמדה עם חיווי ויזואלי הופעלה (עם אבחון).');
  }
});
--- END OF FILE linkage-improved.js ---
