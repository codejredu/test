--- START OF FILE linkage-improved.js ---

// linkage-improved.js - הצמדת בלוקים עם חיווי ויזואלי משופר
document.addEventListener('DOMContentLoaded', function() {
  console.log('טוען מערכת הצמדת בלוקים משופרת...');

  // מחכה שהדף יטען לגמרי כולל הסקריפטים האחרים
  setTimeout(function() {
    setupSnapping();
  }, 1000);

  function setupSnapping() {
    console.log('מפעיל מערכת הצמדה עם חיווי ויזואלי...');

    // קבועים
    const SNAP_THRESHOLD = 25; // מרחק מקסימלי בפיקסלים להצמדה
    // *** שינוי: קבוע חדש למרחק להפעלת ההילה והמסגרת ***
    const CLOSE_HIGHLIGHT_THRESHOLD = 35; // מרחק להתחלת הדגשת קרבה (הילה צהובה, מסגרת כחולה)
    // const HIGHLIGHT_THRESHOLD = 50; // קבוע ישן - לא נשתמש בו כרגע לדרישה החדשה

    // איתור אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות לא נמצא!');
      return;
    }

    // משתנים גלובליים
    let currentDraggedBlock = null;
    let potentialSnapTarget = null;
    let snapDirection = null; // 'left' or 'right'

    // הוספת סגנונות להדגשה ויזואלית באופן דינמי
    addHighlightStyles();

    // ---- התאמת מערכת הגרירה הקיימת ----

    // צעד 1: הוספת מאזינים לאירועי גרירה כדי לנהל את הבלוק הנגרר
    programmingArea.addEventListener('dragstart', function(e) {
      if (e.target.classList.contains('block-container')) {
        currentDraggedBlock = e.target;

        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);

        e.target.classList.add('dragging');

        e.target.dataset.originalLeft = e.target.style.left || '';
        e.target.dataset.originalTop = e.target.style.top || '';

        // אין צורך בעדכון מיקום כאן, dragover/mousemove יטפלו בזה
      }
    });

    // צעד 2: ניקוי הסימון בסיום הגרירה
    programmingArea.addEventListener('dragend', function(e) {
      if (currentDraggedBlock && e.target === currentDraggedBlock) { // ודא שזה הבלוק הנכון
        console.log('סיום גרירה נתפס באזור התכנות');

        e.target.classList.remove('dragging');
        // *** שינוי: הסר את הדגשת הקרבה המיוחדת ***
        e.target.classList.remove('close-to-snap-highlight');

        // בדוק אם יש הצמדה אפשרית בהתבסס על מה שזוהה במהלך הגרירה
        checkForPossibleSnapAfterDrag(e.target);

        // נקה את המצב (כולל ניקוי הדגשות אחרות אם ישנן)
        resetHighlighting(); // הפונקציה הזו תטפל גם בניקוי ה-potentialSnapTarget
        currentDraggedBlock = null; // נקה סופית כאן
      }
    });

    // צעד 3: עדכון מיקום הבלוק בזמן גרירה (חשוב לאפשר drop)
    programmingArea.addEventListener('dragover', function(e) {
      if (currentDraggedBlock) {
        e.preventDefault(); // חייב למניעת התנהגות ברירת מחדל ולאפשר drop
        // עדכון המיקום יבוצע ב-mousemove
      }
    });

    // צעד 4: עדכון מיקום וזיהוי קרבה באמצעות mousemove
    programmingArea.addEventListener('mousemove', function(e) {
      if (currentDraggedBlock && currentDraggedBlock.classList.contains('dragging')) {
        // עדכן מיקום הבלוק הנגרר (זהה למה שהיה קודם)
        updateDraggedBlockPosition(e);

        // *** שינוי: בדיקה אם יש בלוק פוטנציאלי להצמדה בקרבת מקום והחלת האפקט החדש ***
        checkForProximityHighlight(currentDraggedBlock, e.clientX, e.clientY);
      }
    });

    // פונקציה לעדכון מיקום הבלוק הנגרר בזמן אמת
    function updateDraggedBlockPosition(e) {
      if (!currentDraggedBlock) return;

      const programRect = programmingArea.getBoundingClientRect();
      const blockRect = currentDraggedBlock.getBoundingClientRect();
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

      // עדכון המיקום רק אם העכבר נמצא בגבולות הגיוניים
      if (e.clientX > programRect.left && e.clientX < programRect.right && e.clientY > programRect.top && e.clientY < programRect.bottom) {
        currentDraggedBlock.style.position = 'absolute';
        currentDraggedBlock.style.left = newLeft + 'px';
        currentDraggedBlock.style.top = newTop + 'px';
      }
    }

    // צעד 4: מאזין לאירוע 'drop' הנוצר כשמשחררים בלוק מהפלטה לאזור התכנות
    programmingArea.addEventListener('drop', function(e) {
      console.log('אירוע drop נתפס באזור התכנות');
      e.preventDefault(); // מנע התנהגות ברירת מחדל של דפדפן

      // קוד הוספת הבלוק מהפלטה מטופל בסקריפט אחר (ככל הנראה main.js)
      // אנחנו נחכה קצת ונתפוס את הבלוק החדש אם נוצר

      setTimeout(function() {
        // מצא את הבלוק האחרון שנוסף (זו הנחה, ייתכנו בעיות במקרה של ריבוי משימות)
        // דרך טובה יותר תהיה אם סקריפט ה-drop יסמן את הבלוק החדש
        const blocks = programmingArea.querySelectorAll('.block-container:not(.dragging)'); // חפש בלוקים שלא נגררים כרגע
        if (blocks.length > 0) {
             // ננסה למצוא את הבלוק שהכי קרוב לנקודת ה-drop
             const droppedX = e.clientX - programmingArea.getBoundingClientRect().left;
             const droppedY = e.clientY - programmingArea.getBoundingClientRect().top;
             let closestDroppedBlock = null;
             let minDropDist = Infinity;

             blocks.forEach(block => {
                 if(!block.classList.contains('dragging') && !block.hasAttribute('data-original-left')) { // נסה לזהות בלוק חדש
                     const rect = block.getBoundingClientRect();
                     const blockCenterX = rect.left - programmingArea.getBoundingClientRect().left + rect.width / 2;
                     const blockCenterY = rect.top - programmingArea.getBoundingClientRect().top + rect.height / 2;
                     const dist = Math.sqrt(Math.pow(droppedX - blockCenterX, 2) + Math.pow(droppedY - blockCenterY, 2));
                     if (dist < minDropDist && dist < 100) { // רק בלוקים קרובים לנקודת הזריקה
                         minDropDist = dist;
                         closestDroppedBlock = block;
                     }
                 }
             });

             if (closestDroppedBlock) {
                 console.log("זוהה בלוק חדש שהוטל:", closestDroppedBlock.id);
                 // בדיקה אם אפשר להצמיד את הבלוק החדש לבלוקים אחרים
                 checkForPossibleSnapAfterDrop(closestDroppedBlock);
             } else {
                 console.log("לא זוהה בלוק חדש שהוטל בבירור.");
             }
        }

        // נקה את המצב בכל מקרה
        resetHighlighting();
      }, 150); // הגדלנו מעט את ההמתנה
    });


    // ---- פונקציות עזר ----

    // *** שינוי: פונקציה חדשה לבדיקת קרבה והחלת הדגשת קרבה ***
    function checkForProximityHighlight(draggedBlock, mouseX, mouseY) {
      if (!draggedBlock) return;

      // חפש בלוק קרוב להצמדה
      const result = findClosestBlockForSnap(draggedBlock, mouseX, mouseY);

      // אם נמצא בלוק קרוב *ומספיק* קרוב להדגשה המיוחדת
      if (result && result.block && result.distance < CLOSE_HIGHLIGHT_THRESHOLD) {
        // שמור את הבלוק המטרה והכיוון למקרה של הצמדה בסוף
        potentialSnapTarget = result.block;
        snapDirection = result.direction;

        // הוסף את הקלאס להדגשה המיוחדת לבלוק הנגרר
        draggedBlock.classList.add('close-to-snap-highlight');
        // ודא שאין הדגשות ישנות/אחרות על בלוק המטרה (אם היו כאלה)
        clearTargetHighlight(potentialSnapTarget);

      } else {
        // אם אין בלוק קרוב או לא מספיק קרוב, הסר את ההדגשה המיוחדת
        draggedBlock.classList.remove('close-to-snap-highlight');
        // נקה את המטרה הפוטנציאלית
        potentialSnapTarget = null;
        snapDirection = null;
        // נקה הדגשות ממטרות קודמות אפשריות
        clearAllTargetHighlights();
      }
    }


    // בדיקה אם יש בלוק פוטנציאלי להצמדה אחרי גרירה (כשמשחררים בלוק קיים)
    function checkForPossibleSnapAfterDrag(draggedBlock) {
        // השתמש בנתונים שנשמרו במהלך הגרירה
        if (potentialSnapTarget && snapDirection && draggedBlock) {
            // אופציונלי: בצע בדיקת מרחק אחרונה עם SNAP_THRESHOLD
            const draggedRect = draggedBlock.getBoundingClientRect();
            const targetRect = potentialSnapTarget.getBoundingClientRect();
            let finalDistance = calculateSnapDistance(draggedRect, targetRect, snapDirection);

            if (finalDistance <= SNAP_THRESHOLD) {
                 console.log("מבצע הצמדה עם:", potentialSnapTarget.id, "בכיוון:", snapDirection);
                 snapBlocks(draggedBlock, potentialSnapTarget, snapDirection);
            } else {
                 console.log("המרחק בסוף הגרירה גדול מדי להצמדה:", finalDistance);
                 // אם רוצים, ניתן להחזיר את הבלוק למיקומו המקורי אם לא נצמד
                 // if (draggedBlock.dataset.originalLeft !== undefined) {
                 //     draggedBlock.style.left = draggedBlock.dataset.originalLeft;
                 //     draggedBlock.style.top = draggedBlock.dataset.originalTop;
                 // }
            }
        } else {
             console.log("אין יעד הצמדה פוטנציאלי בסיום הגרירה.");
        }
         // נקה את נתוני המטרה הפוטנציאלית בכל מקרה
         potentialSnapTarget = null;
         snapDirection = null;
    }

    // בדיקה אם יש בלוק פוטנציאלי להצמדה אחרי הטלה (כשזורקים בלוק חדש)
     function checkForPossibleSnapAfterDrop(droppedBlock) {
         if (!droppedBlock) return;

         const blockRect = droppedBlock.getBoundingClientRect();
         // חשב מרכז או נקודות חיבור של הבלוק החדש לצורך חיפוש
         const centerX = blockRect.left + blockRect.width / 2;
         const centerY = blockRect.top + blockRect.height / 2;

         // חפש בלוק קרוב *עכשיו*
         const result = findClosestBlockForSnap(droppedBlock, centerX, centerY, true); // ה-true מציין שזו בדיקה אחרי drop

         // אם נמצא בלוק קרוב ובמרחק הצמדה
         if (result && result.block && result.distance <= SNAP_THRESHOLD) {
              console.log("מבצע הצמדה אחרי הטלה עם:", result.block.id, "בכיוון:", result.direction);
              snapBlocks(droppedBlock, result.block, result.direction);
         } else {
              console.log("אין יעד הצמדה קרוב מספיק אחרי הטלה.");
         }
     }


    // חיפוש הבלוק הקרוב ביותר להצמדה
    // *** שינוי: מחזיר גם את המרחק ***
    // *** הוספת פרמטר isAfterDrop לבדיקה אחרי הטלה ***
    function findClosestBlockForSnap(draggedBlock, clientX, clientY, isAfterDrop = false) {
      if (!draggedBlock) return null;

      const blocks = programmingArea.querySelectorAll('.block-container');
      if (blocks.length < 2) return null; // צריך לפחות 2 בלוקים

      const draggedRect = draggedBlock.getBoundingClientRect();

      // נקודות חיבור של הבלוק הנגרר (מרכז הקצוות האנכיים)
      const rightPinX = draggedRect.right;
      const rightPinY = draggedRect.top + draggedRect.height / 2;
      const leftSocketX = draggedRect.left;
      const leftSocketY = draggedRect.top + draggedRect.height / 2;

      let closestBlock = null;
      let minDistance = Infinity; // התחל עם מרחק אינסופי
      let bestDirection = null;

      const threshold = isAfterDrop ? SNAP_THRESHOLD : CLOSE_HIGHLIGHT_THRESHOLD; // בחר סף מתאים

      blocks.forEach(block => {
        if (block === draggedBlock) return; // דלג על הבלוק הנגרר עצמו

        const blockRect = block.getBoundingClientRect();
        const targetLeftSocketX = blockRect.left;
        const targetSocketY = blockRect.top + blockRect.height / 2;
        const targetRightPinX = blockRect.right;
        const targetPinY = targetSocketY; // אותו גובה Y

        // מרחק: הפין הימני שלנו לשקע השמאלי שלו (רוצים להצמיד משמאל ליעד)
        const leftDistance = Math.sqrt(
          Math.pow(rightPinX - targetLeftSocketX, 2) +
          Math.pow(rightPinY - targetSocketY, 2)
        );

        // מרחק: השקע השמאלי שלנו לפין הימני שלו (רוצים להצמיד מימין ליעד)
        const rightDistance = Math.sqrt(
          Math.pow(leftSocketX - targetRightPinX, 2) +
          Math.pow(leftSocketY - targetPinY, 2)
        );

        // בחירת הכיוון עם המרחק הקטן יותר
        let currentMinDist = Math.min(leftDistance, rightDistance);
        let currentDirection = (leftDistance < rightDistance) ? 'left' : 'right';

        // בדוק אם זה המרחק הקטן ביותר שנמצא עד כה וגם מתחת לסף הרלוונטי
        if (currentMinDist < minDistance && currentMinDist < threshold) {
          minDistance = currentMinDist;
          closestBlock = block;
          bestDirection = currentDirection;
        }
      });

      // *** שינוי: החזר אובייקט עם כל המידע ***
      return closestBlock ? { block: closestBlock, direction: bestDirection, distance: minDistance } : null;
    }

    // פונקציה לחישוב מרחק הצמדה סופי בין שני מלבנים וכיוון
    function calculateSnapDistance(sourceRect, targetRect, direction) {
        const sourcePinY = sourceRect.top + sourceRect.height / 2;
        const targetSocketY = targetRect.top + targetRect.height / 2;

        if (direction === 'left') { // מקור משמאל ליעד
            const sourceRightPinX = sourceRect.right;
            const targetLeftSocketX = targetRect.left;
            return Math.sqrt(Math.pow(sourceRightPinX - targetLeftSocketX, 2) + Math.pow(sourcePinY - targetSocketY, 2));
        } else { // מקור מימין ליעד
            const sourceLeftSocketX = sourceRect.left;
            const targetRightPinX = targetRect.right;
            return Math.sqrt(Math.pow(sourceLeftSocketX - targetRightPinX, 2) + Math.pow(sourcePinY - targetSocketY, 2));
        }
    }


    // *** שינוי: הסרת פונקציית ההדגשה הישנה - לא רלוונטית לבקשה החדשה ***
    /*
    function highlightBlockForSnapping(draggedBlock, targetBlock, direction) {
        // ... (קוד ישן שהוסר) ...
    }
    */

    // *** שינוי: פונקציה לניקוי הדגשות ממטרות ***
    function clearTargetHighlight(targetBlock) {
        if (targetBlock) {
            // הסר כל קלאס הדגשה שהיה יכול להיות על המטרה מהלוגיקה הישנה
             targetBlock.classList.remove('snap-target', 'snap-left', 'snap-right');
        }
    }

    // *** שינוי: פונקציה לניקוי הדגשות מכל המטרות האפשריות ***
    function clearAllTargetHighlights() {
        const potentialTargets = programmingArea.querySelectorAll('.snap-target, .snap-left, .snap-right');
        potentialTargets.forEach(block => {
            block.classList.remove('snap-target', 'snap-left', 'snap-right');
        });
    }


    // איפוס מצב ההדגשה והמשתנים הגלובליים
    function resetHighlighting() {
      // *** שינוי: נקה את הדגשת הקרבה מהבלוק שאולי נגרר ***
      if (currentDraggedBlock) {
         currentDraggedBlock.classList.remove('close-to-snap-highlight');
      }
      // נקה הדגשות ישנות ממטרות אפשריות
      clearAllTargetHighlights();

      // נקה משתני מצב
      potentialSnapTarget = null;
      snapDirection = null;
    }

    // ביצוע הצמדה בין שני בלוקים בכיוון מסוים
    function snapBlocks(sourceBlock, targetBlock, direction) {
      if (!sourceBlock || !targetBlock) return;

      try {
        const sourceRect = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();

        let newLeft, newTop;

        // חישוב מיקום מדויק להצמדה
        const verticalOffset = targetRect.top - programRect.top; // יישור אנכי

        if (direction === 'left') {
          // הצמד את הפין הימני של המקור לשקע השמאלי של היעד
          newLeft = targetRect.left - programRect.left - sourceRect.width;
          newTop = verticalOffset;
        } else { // direction === 'right'
          // הצמד את השקע השמאלי של המקור לפין הימני של היעד
          newLeft = targetRect.right - programRect.left;
          newTop = verticalOffset;
        }

        // עדכון מיקום הבלוק הנגרר/שהוצמד
        sourceBlock.style.position = 'absolute'; // ודא שהמיקום אבסולוטי
        sourceBlock.style.left = newLeft + 'px';
        sourceBlock.style.top = newTop + 'px';

        // הוספת סימון חיבור (אופציונלי, אם רוצים לדעת שהם מחוברים)
        sourceBlock.classList.add('connected-block');
        targetBlock.classList.add('has-connected-block'); // או שינוי סגנון אחר

        // סימון כיוון החיבור (אם נדרש ללוגיקה עתידית)
        sourceBlock.setAttribute('data-connected-to', generateUniqueId(targetBlock));
        sourceBlock.setAttribute('data-connection-direction', direction);
        if(direction === 'left') {
            targetBlock.setAttribute('data-prev-block', generateUniqueId(sourceBlock));
        } else {
            targetBlock.setAttribute('data-next-block', generateUniqueId(sourceBlock));
        }


        // אפקט ויזואלי קטן בזמן ההצמדה
        addSnapEffectAnimation(sourceBlock);

        console.log(`הצמדה בוצעה: ${generateUniqueId(sourceBlock)} ${direction === 'left' ? '<--' : '-->'} ${generateUniqueId(targetBlock)}`);

      } catch (err) {
        console.error('שגיאה בהצמדת בלוקים:', err);
      }
    }

    // יצירת מזהה ייחודי לבלוק אם אין לו
    function generateUniqueId(block) {
      if (!block) return null;
      if (!block.id) {
        const uniqueId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        block.id = uniqueId;
      }
      return block.id;
    }

    // הוספת אנימציית הצמדה
    function addSnapEffectAnimation(block) {
      block.classList.add('snap-animation');
      setTimeout(() => {
        block.classList.remove('snap-animation');
      }, 300); // משך האנימציה
    }

    // הוספת סגנונות CSS להדגשה ואנימציה
    function addHighlightStyles() {
      const style = document.createElement('style');
      style.textContent = `
        /* בלוק בזמן גרירה - ללא אפקטים מיוחדים כברירת מחדל */
        .block-container.dragging {
          /* אפשר להוסיף כאן שקיפות קלה אם רוצים */
          /* opacity: 0.8; */
          z-index: 1000; /* ודא שהבלוק הנגרר מעל אחרים */
        }

        /* *** שינוי: סגנון חדש להדגשת קרבה לבלוק הנגרר *** */
        .block-container.dragging.close-to-snap-highlight > .scratch-block {
          /* הילה צהובה + מסגרת כחולה */
          box-shadow: 0 0 12px 5px rgba(255, 255, 0, 0.7), /* הילה צהובה רחבה */
                      0 0 0 3px blue; /* מסגרת כחולה בולטת */
          filter: brightness(1.1); /* הבהרה קלה */
          transition: box-shadow 0.15s ease-out, filter 0.15s ease-out;
        }

        /* הסרת הדגשות ישנות אם עדיין קיימות איפשהו */
        .snap-source .scratch-block,
        .snap-target .scratch-block,
        .snap-left .scratch-block::before,
        .snap-right .scratch-block::after {
           /* בטלו הגדרות קודמות אם ישנן */
           box-shadow: none !important;
           filter: none;
           background-color: initial !important; /* איפוס רקע של before/after אם היה */
        }


        /* אנימציית הצמדה */
        @keyframes snapEffect {
          0% { transform: scale(1.03); }
          50% { transform: scale(0.97); }
          100% { transform: scale(1); }
        }

        .snap-animation {
          animation: snapEffect 0.3s ease-out;
        }

        /* סימון בלוקים מחוברים (אופציונלי) */
        .connected-block, .has-connected-block {
          /* filter: brightness(1.02); */ /* אפשר להוסיף אפקט קל */
        }
      `;
      document.head.appendChild(style);
    }

    // מאזין לכפתור "נקה הכל"
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        // ניקוי משתנים גלובליים
        currentDraggedBlock = null; // ודא ניקוי כאן
        resetHighlighting(); // זה ינקה את שאר המשתנים וההדגשות
      });
    }

    console.log('מערכת הצמדה עם חיווי ויזואלי הופעלה.');
  } // end of setupSnapping function
}); // end of DOMContentLoaded listener

--- END OF FILE linkage-improved.js ---
