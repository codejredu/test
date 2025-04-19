// --- START OF FILE linkageimproved.js ---
// מימוש משופר של מערכת חיבור בלוקים עם הילה צהובה ומלבן כחול מקווקו

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;    // הבלוק הנגרר כרגע
  let potentialSnapTarget = null;  // הבלוק שאליו ייתכן ונתחבר
  let snapDirection = null;        // כיוון ההצמדה האפשרי ('left' או 'right')
  let isDraggingBlock = false;       // האם מתבצעת גרירה של בלוק מתוך אזור התכנות
  let dragOffset = { x: 0, y: 0 }; // ההיסט של העכבר מפינת הבלוק הנגרר
  let futureIndicator = null;      // אלמנט המלבן הכחול המקווקו

  // ========================================================================
  // אתחול המערכת
  // ========================================================================
  document.addEventListener('DOMContentLoaded', function() {
    addHighlightStyles(); // הוספת סגנונות CSS דינמיים
    initProgrammingAreaListeners(); // האזנה לאירועים באזור התכנות
    observeNewBlocks(); // האזנה לבלוקים חדשים שנוספים
    initExistingBlocks(); // הוספת מאזינים לבלוקים שכבר קיימים
    initGlobalMouseListeners(); // מאזינים גלובליים לעכבר
    console.log("Block linkage system initialized.");
  });

  // ========================================================================
  // אתחול מאזינים באזור התכנות
  // ========================================================================
  function initProgrammingAreaListeners() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('Programming area (#program-blocks) not found!');
      return;
    }

    // מאזין זה חיוני כדי לאפשר זריקה (drop) באזור
    // (הוא מונע את התנהגות ברירת המחדל של הדפדפן)
    programmingArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      // אין צורך בטיפול מיוחד כאן אם הגרירה מטופלת ב-mousemove
    });

    // שימו לב: ה-drop כאן יטופל רק עבור בלוקים *חדשים* מהפלטה,
    // כפי שמוגדר ב-script.js. גרירה פנימית מטופלת ב-mouseup.
  }

  // ========================================================================
  // האזנה לבלוקים חדשים שנוספים לאזור התכנות
  // ========================================================================
  function observeNewBlocks() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            // ודא שזה אלמנט ושהוא בלוק חדש באזור התכנות
            if (node.nodeType === 1 && node.classList.contains('block-container') && node.closest('#program-blocks')) {
              console.log('New block detected in programming area, adding listeners:', node);
              addBlockDragListeners(node);
            }
          });
        }
      });
    });

    observer.observe(programmingArea, { childList: true });
  }

  // ========================================================================
  // הוספת מאזינים לבלוקים קיימים בטעינה ראשונית
  // ========================================================================
  function initExistingBlocks() {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;
      programmingArea.querySelectorAll('.block-container').forEach(block => {
          addBlockDragListeners(block);
      });
  }

  // ========================================================================
  // הוספת מאזיני גרירה (mousedown) לבלוק בודד
  // ========================================================================
  function addBlockDragListeners(block) {
      // הסרת מאזינים קיימים למניעת כפילות (למקרה שנקרא בטעות שוב)
      block.removeEventListener('mousedown', handleMouseDown);
      block.addEventListener('mousedown', handleMouseDown);

      // מאזין לקליק ימני (לניתוק)
      block.removeEventListener('contextmenu', handleContextMenu);
      block.addEventListener('contextmenu', handleContextMenu);
  }

  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק (תחילת גרירה פוטנציאלית)
  // ========================================================================
  function handleMouseDown(e) {
      // רק לחיצה שמאלית
      if (e.button !== 0) return;
      // ודא שאנחנו לוחצים על הבלוק עצמו ולא על אלמנט פנימי אם יש
      if (!e.target.closest('.block-container')) return;

      const block = e.target.closest('.block-container');
      currentDraggedBlock = block;
      isDraggingBlock = true; // סמן שאנו גוררים בלוק *מתוך* אזור התכנות

      // חשב את ההיסט של העכבר מפינת הבלוק
      const rect = block.getBoundingClientRect();
      const programAreaRect = block.parentElement.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // הבא את הבלוק הנגרר קדימה
      block.style.zIndex = '1001';
      block.classList.add('snap-source'); // סימון חזותי קל לבלוק הנגרר

      // מנע התנהגויות ברירת מחדל כמו גרירת טקסט או תמונה
      e.preventDefault();
  }

  // ========================================================================
  // טיפול בקליק ימני על בלוק
  // ========================================================================
    function handleContextMenu(e) {
        e.preventDefault();
        const block = e.target.closest('.block-container');
        if (block && block.hasAttribute('data-connected-to')) {
            showDetachMenu(e.clientX, e.clientY, block);
        }
    }

  // ========================================================================
  // מאזינים גלובליים לתנועת ושחרור העכבר
  // ========================================================================
  function initGlobalMouseListeners() {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  // ========================================================================
  // טיפול בתנועת העכבר (כאשר גוררים בלוק)
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const programmingArea = document.getElementById('program-blocks');
    const containerRect = programmingArea.getBoundingClientRect();

    // חשב מיקום חדש יחסית לאזור התכנות
    let newLeft = e.clientX - containerRect.left - dragOffset.x;
    let newTop = e.clientY - containerRect.top - dragOffset.y;

    // הגבל את המיקום לגבולות אזור התכנות (אופציונלי, אך מומלץ)
    const blockRect = currentDraggedBlock.getBoundingClientRect(); // גודל עדכני
    const maxLeft = containerRect.width - blockRect.width;
    const maxTop = containerRect.height - blockRect.height;
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

    // עדכן את מיקום הבלוק הנגרר (חייב להיות position: absolute)
    currentDraggedBlock.style.position = 'absolute';
    currentDraggedBlock.style.left = newLeft + 'px';
    currentDraggedBlock.style.top = newTop + 'px';

    // בדוק אפשרות הצמדה והצג משוב חזותי
    checkAndHighlightSnapPossibility();
  }

  // ========================================================================
  // טיפול בשחרור העכבר (סיום גרירה)
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    // בדוק אם יש יעד הצמדה חוקי שנמצא בזמן הגרירה
    if (potentialSnapTarget && snapDirection) {
      console.log(`Snapping block to ${potentialSnapTarget.id || 'target'} in direction ${snapDirection}`);
      snapBlocks(currentDraggedBlock, potentialSnapTarget, snapDirection);
    } else {
      console.log("Block dropped freely.");
      // המיקום כבר נקבע ב-mousemove, אין צורך לשנות כלום כאן
      // אלא אם רוצים התנהגות מיוחדת לשחרור חופשי
    }

    // ניקוי כללי בסיום הגרירה
    cleanupAfterDrag();
  }

  // ========================================================================
  // ניקוי מצב וסגנונות לאחר סיום גרירה
  // ========================================================================
  function cleanupAfterDrag() {
      if (currentDraggedBlock) {
          currentDraggedBlock.style.zIndex = ''; // החזר z-index לברירת מחדל
          currentDraggedBlock.classList.remove('snap-source');
      }
      clearAllHighlights(); // הסר הילות צהובות
      removeFuturePositionIndicator(); // הסר מלבן כחול

      // איפוס משתני מצב
      currentDraggedBlock = null;
      potentialSnapTarget = null;
      snapDirection = null;
      isDraggingBlock = false;
  }

  // ========================================================================
  // בדיקת אפשרות הצמדה והחלת הדגשות
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;

    const programmingArea = document.getElementById('program-blocks');
    const allBlocks = Array.from(programmingArea.querySelectorAll('.block-container'));
    const sourceRect = currentDraggedBlock.getBoundingClientRect();

    let closestDistance = 100; // מרחק מקסימלי להצמדה (בפיקסלים בין מרכזים)
    let bestTarget = null;
    let bestDirection = null;

    // איפוס הדגשות קודמות לפני הבדיקה החדשה
    clearAllHighlights();
    potentialSnapTarget = null; // איפוס היעד הפוטנציאלי הקודם

    for (const targetBlock of allBlocks) {
      // לא ניתן להצמיד בלוק לעצמו
      if (targetBlock === currentDraggedBlock) continue;

      // אל תצמיד לבלוק שכבר מחובר באותו צד אליו אתה מנסה להתחבר
      // (למשל, אם לבלוק היעד כבר מחובר משהו מימין, אל תנסה להצמיד מימין)
      // (נוסיף לוגיקה זו אם נדרש)

      const targetRect = targetBlock.getBoundingClientRect();

      // חישוב מרחק בין מרכזים (אומדן גס לקרבה)
      const centerDist = Math.sqrt(
        Math.pow((sourceRect.left + sourceRect.width / 2) - (targetRect.left + targetRect.width / 2), 2) +
        Math.pow((sourceRect.top + sourceRect.height / 2) - (targetRect.top + targetRect.height / 2), 2)
      );

      if (centerDist < closestDistance) {
        // חישוב כיוון הצמדה מדויק יותר לפי קצוות
        const direction = calculateSnapDirection(sourceRect, targetRect);

        if (direction) {
            // מצאנו התאמה קרובה יותר
            closestDistance = centerDist;
            bestTarget = targetBlock;
            bestDirection = direction;
        }
      }
    }

    // אם מצאנו יעד מתאים
    if (bestTarget && bestDirection) {
        potentialSnapTarget = bestTarget; // שמירת היעד הפוטנציאלי
        snapDirection = bestDirection;    // שמירת כיוון ההצמדה

        // --- הדגשת היעד בהילה צהובה ---
        potentialSnapTarget.classList.add('snap-target');
        // הוספת סימון כיוון (אופציונלי, יכול לעזור בהבנה)
        if (snapDirection === 'left') {
            potentialSnapTarget.classList.add('snap-left');
        } else {
            potentialSnapTarget.classList.add('snap-right');
        }
        // ---------------------------------

        // --- הצגת המלבן הכחול המקווקו ---
        const programRect = programmingArea.getBoundingClientRect();
        updateFuturePositionIndicator(currentDraggedBlock, potentialSnapTarget, snapDirection, programRect);
        // ---------------------------------

    } else {
        // לא נמצא יעד - הסר את המלבן הכחול
        removeFuturePositionIndicator();
        snapDirection = null; // איפוס כיוון
    }
  }

  // ========================================================================
  // חישוב כיוון הצמדה אפשרי בין שני בלוקים
  // ========================================================================
  function calculateSnapDirection(sourceRect, targetRect) {
    const snapThresholdHorizontal = 40; // כמה קרובים הקצוות צריכים להיות אופקית
    const snapThresholdVertical = targetRect.height * 0.8; // כמה חפיפה אנכית נדרשת

    // בדיקת חפיפה אנכית מספקת
    const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));
    if (verticalOverlap < snapThresholdVertical) {
        return null; // אין מספיק חפיפה אנכית
    }

    // חישוב מרחקים בין הקצוות הרלוונטיים
    const rightToLeftDist = Math.abs(sourceRect.right - targetRect.left); // מקור מימין ליעד
    const leftToRightDist = Math.abs(sourceRect.left - targetRect.right); // מקור משמאל ליעד

    // בדוק הצמדה: הבלוק הנגרר (source) יהיה משמאל ליעד (target)
    if (rightToLeftDist <= snapThresholdHorizontal) {
        // בדוק אם ליעד כבר מחובר משהו משמאל (אופציונלי)
        // if (targetBlock.dataset.connectedFromLeft) return null;
      return 'left'; // פין ימני של המקור לשקע שמאלי של היעד
    }

    // בדוק הצמדה: הבלוק הנגרר (source) יהיה מימין ליעד (target)
    if (leftToRightDist <= snapThresholdHorizontal) {
        // בדוק אם ליעד כבר מחובר משהו מימין (אופציונלי)
        // if (targetBlock.dataset.connectedFromRight) return null;
      return 'right'; // שקע שמאלי של המקור לפין ימני של היעד
    }

    return null; // אין קרבה מספקת להצמדה
  }

  // ========================================================================
  // ביצוע ההצמדה בפועל (מיקום הבלוק)
  // ========================================================================
  function snapBlocks(sourceBlock, targetBlock, direction) {
    try {
      const sourceRect = sourceBlock.getBoundingClientRect(); // מידות הבלוק הנגרר
      const targetRect = targetBlock.getBoundingClientRect(); // מיקום ומידות היעד
      const programRect = sourceBlock.parentElement.getBoundingClientRect(); // מיקום אזור התכנות

      let newLeft, newTop;

      // חישוב מיקום אנכי: מרכז את הבלוק הנגרר אנכית ביחס ליעד
      // או שמור על ה-Y הנוכחי אם הוא קרוב מספיק
      const currentSourceTopRelative = sourceRect.top - programRect.top;
      const targetTopRelative = targetRect.top - programRect.top;
      const verticalDiff = Math.abs(currentSourceTopRelative - targetTopRelative);

      // אם ההבדל האנכי קטן, נצמיד לאותו גובה Y
      if (verticalDiff < sourceRect.height * 0.5) {
          newTop = targetTopRelative;
      } else {
          // אחרת, נשאיר את ה-Y מהגרירה האחרונה
          newTop = parseFloat(sourceBlock.style.top) || targetTopRelative; // שימוש במיקום האחרון או היעד כברירת מחדל
      }
      newTop = Math.max(0, newTop); // ודא שלא יוצא מהגבול העליון

      // חישוב מיקום אופקי לפי כיוון ההצמדה
      if (direction === 'left') {
        // הצמד את הפין הימני של source לשקע השמאלי של target
        newLeft = targetRect.left - programRect.left - sourceRect.width;
        // הוסף מרווח קטן אם רוצים שהם לא ייגעו בדיוק
        // newLeft -= 2; // למשל, רווח של 2 פיקסלים
      } else { // direction === 'right'
        // הצמד את השקע השמאלי של source לפין הימני של target
        newLeft = targetRect.right - programRect.left;
        // הוסף מרווח קטן אם רוצים
        // newLeft += 2; // למשל, רווח של 2 פיקסלים
      }
      newLeft = Math.max(0, newLeft); // ודא שלא יוצא מהגבול השמאלי

      // עדכון סופי של מיקום הבלוק הנגרר
      sourceBlock.style.position = 'absolute'; // ודא שהוא ממוקם אבסולוטית
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';

      // הוספת סימוני חיבור לוגיים (אופציונלי אך שימושי)
      sourceBlock.setAttribute('data-connected-to', targetBlock.id || generateUniqueId(targetBlock));
      sourceBlock.setAttribute('data-connection-direction', direction); // 'left' או 'right' מנקודת המבט של היעד
      targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id || generateUniqueId(sourceBlock));

      // הוספת קלאסים לסימון חזותי (אופציונלי)
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');

      // אפקט ויזואלי קטן בזמן ההצמדה
      addSnapEffectAnimation(sourceBlock);

      console.log(`Block ${sourceBlock.id} snapped to ${targetBlock.id} (${direction}) at (${newLeft}px, ${newTop}px)`);

    } catch (err) {
      console.error('Error snapping blocks:', err);
      // במקרה של שגיאה, אולי נרצה להחזיר את הבלוק למקומו המקורי או פשוט לנקות
      cleanupAfterDrag();
    }
  }

  // ========================================================================
  // יצירה ועדכון של מחוון המיקום העתידי (מלבן כחול מקווקו)
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;

      if (!futureIndicator) {
          futureIndicator = document.createElement('div');
          futureIndicator.id = 'future-position-indicator';
          futureIndicator.className = 'future-position-indicator';
          // **חשוב**: הוסף את המחוון לאזור התכנות, לא ל-body
          programmingArea.appendChild(futureIndicator);
      }

      try {
          const sourceStyle = window.getComputedStyle(sourceBlock);
          const sourceWidth = parseFloat(sourceStyle.width);
          const sourceHeight = parseFloat(sourceStyle.height);
          const targetRect = targetBlock.getBoundingClientRect(); // מיקום היעד יחסית ל-viewport

          let indicatorLeft, indicatorTop;

          // חישוב מיקום אנכי (כמו ב-snapBlocks)
          const sourceTopRelative = sourceBlock.getBoundingClientRect().top - programRect.top;
          const targetTopRelative = targetRect.top - programRect.top;
          const verticalDiff = Math.abs(sourceTopRelative - targetTopRelative);

          if (verticalDiff < sourceHeight * 0.5) {
              indicatorTop = targetTopRelative;
          } else {
              indicatorTop = parseFloat(sourceBlock.style.top) || targetTopRelative;
          }
           indicatorTop = Math.max(0, indicatorTop);

          // חישוב מיקום אופקי (כמו ב-snapBlocks)
          if (direction === 'left') {
              indicatorLeft = targetRect.left - programRect.left - sourceWidth;
              // indicatorLeft -= 2; // התאמת רווח אם קיים ב-snapBlocks
          } else { // direction === 'right'
              indicatorLeft = targetRect.right - programRect.left;
              // indicatorLeft += 2; // התאמת רווח אם קיים ב-snapBlocks
          }
          indicatorLeft = Math.max(0, indicatorLeft);

          // עדכון סגנון המחוון
          futureIndicator.style.position = 'absolute';
          futureIndicator.style.left = indicatorLeft + 'px';
          futureIndicator.style.top = indicatorTop + 'px';
          futureIndicator.style.width = sourceWidth + 'px';
          futureIndicator.style.height = sourceHeight + 'px';
          futureIndicator.style.display = 'block'; // ודא שהוא נראה

      } catch (err) {
          console.error('Error updating future position indicator:', err);
          removeFuturePositionIndicator(); // הסתר במקרה של שגיאה
      }
  }

  // ========================================================================
  // הסרת מחוון המיקום העתידי
  // ========================================================================
  function removeFuturePositionIndicator() {
      if (futureIndicator) {
          futureIndicator.style.display = 'none'; // פשוט הסתר אותו, אין צורך להסיר ולהוסיף כל פעם
      }
  }

  // ========================================================================
  // ניקוי כל ההדגשות (הילות צהובות)
  // ========================================================================
  function clearAllHighlights() {
      document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
          el.classList.remove('snap-target', 'snap-left', 'snap-right');
      });
      // אין צורך לנקות snap-source כאן, הוא מנוקה ב-cleanupAfterDrag
  }

  // ========================================================================
  // הוספת סגנונות CSS דינמיים למערכת
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;

    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* הדגשת בלוק נגרר (מופעל דרך JS ב-mousedown) */
      .snap-source {
        /* אפשר להוסיף כאן סגנון אם רוצים, למשל צל קל */
         box-shadow: 0 0 8px 2px rgba(0, 0, 0, 0.1);
         /* filter: brightness(1.03); /* אפשר בהירות קלה */
         transition: box-shadow 0.15s ease-out;
      }

      /* הילה צהובה סביב בלוק יעד פוטנציאלי */
      .snap-target {
        outline: 3px solid rgba(255, 220, 0, 0.8) !important; /* צהוב חזק */
        outline-offset: 2px;
        box-shadow: 0 0 12px 4px rgba(255, 220, 0, 0.5) !important; /* צל צהבהב */
        filter: brightness(1.05); /* מעט בהיר יותר */
        transition: outline 0.15s ease-out, box-shadow 0.15s ease-out, filter 0.15s ease-out;
        z-index: 999 !important; /* מעל בלוקים אחרים אך מתחת לנגרר */
      }

      /* מלבן כחול מקווקו לציון מיקום עתידי */
      .future-position-indicator {
        position: absolute; /* מיקום יחסית לאזור התכנות */
        border: 2px dashed rgba(0, 136, 255, 0.9); /* כחול מקווקו */
        border-radius: 5px;
        background-color: rgba(0, 136, 255, 0.08); /* רקע כחלחל שקוף */
        pointer-events: none; /* לא מפריע לאירועי עכבר */
        z-index: 998; /* מתחת ליעד ומתחת לנגרר */
        opacity: 0; /* מתחיל שקוף */
        transition: opacity 0.15s ease-out, left 0.1s linear, top 0.1s linear; /* אנימציה עדינה */
        display: none; /* מוסתר כברירת מחדל */
      }

      /* הצגת המחוון עם אנימציה */
      .future-position-indicator[style*="display: block"] {
          opacity: 0.8;
      }

      /* סימון כיוון (פס צהוב בצד) - אופציונלי */
      .snap-left::before {
        content: '';
        position: absolute;
        left: -5px; /* קצת מחוץ לבלוק */
        top: 10%;
        bottom: 10%;
        width: 4px;
        background-color: rgba(255, 220, 0, 0.8);
        border-radius: 2px;
        z-index: 1000;
        box-shadow: 0 0 5px 1px rgba(255, 220, 0, 0.6);
      }

      .snap-right::after {
        content: '';
        position: absolute;
        right: -5px; /* קצת מחוץ לבלוק */
        top: 10%;
        bottom: 10%;
        width: 4px;
        background-color: rgba(255, 220, 0, 0.8);
        border-radius: 2px;
        z-index: 1000;
        box-shadow: 0 0 5px 1px rgba(255, 220, 0, 0.6);
      }

      /* אנימציית "קפיצה" קלה בהצמדה */
      @keyframes snapEffect {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      .snap-animation {
        animation: snapEffect 0.2s ease-out;
      }

       /* אנימציית "רעידה" קלה בניתוק */
      @keyframes detachEffect {
         0% { transform: translateX(0); }
         25% { transform: translateX(-2px) rotate(-0.5deg); }
         50% { transform: translateX(2px) rotate(0.5deg); }
         75% { transform: translateX(-1px) rotate(-0.2deg); }
         100% { transform: translateX(0) rotate(0); }
      }
      .detach-animation {
        animation: detachEffect 0.3s ease-in-out;
      }

      /* סימון חזותי לבלוקים מחוברים (נקודה ירוקה קטנה) - אופציונלי */
      .connected-block::after, .has-connected-block::before {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background-color: rgba(76, 175, 80, 0.6); /* ירוק שקוף */
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(76, 175, 80, 0.8);
      }
      .connected-block::after { /* נקודה בפינה ימנית תחתונה לבלוק שמחובר *ל*משהו */
          bottom: 4px;
          right: 4px;
      }
       .has-connected-block::before { /* נקודה בפינה שמאלית תחתונה לבלוק *שמחובר אליו* משהו */
          bottom: 4px;
          left: 4px;
      }

      /* סגנון תפריט ניתוק */
      #detach-menu {
        position: absolute; /* חשוב שיהיה אבסולוטי */
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.2);
        z-index: 1100; /* מעל הכל */
        padding: 5px;
        font-size: 14px;
      }
      #detach-menu div {
        padding: 6px 12px;
        cursor: pointer;
        border-radius: 3px;
      }
       #detach-menu div:hover {
        background-color: #eee;
       }
    `;
    document.head.appendChild(style);
    console.log('Highlighting and animation styles added.');
  }

  // ========================================================================
  // פונקציות עזר לניתוק בלוקים (כולל תפריט קונטקסט)
  // ========================================================================
  function showDetachMenu(x, y, block) {
      removeDetachMenu(); // הסר תפריט קודם אם קיים

      const menu = document.createElement('div');
      menu.id = 'detach-menu';
      // מיקום התפריט ליד העכבר, תוך וידוא שהוא לא חורג מהמסך
      menu.style.left = Math.min(x, window.innerWidth - 100) + 'px'; // 100 = רוחב משוער של התפריט
      menu.style.top = Math.min(y, window.innerHeight - 50) + 'px'; // 50 = גובה משוער

      const detachOption = document.createElement('div');
      detachOption.textContent = 'Detach Block'; // אפשר לתרגם אם צריך
      detachOption.onclick = () => {
          detachBlock(block);
          removeDetachMenu();
      };

      menu.appendChild(detachOption);
      document.body.appendChild(menu); // הוסף לגוף המסמך כדי שיהיה מעל הכל

      // סגירת התפריט בלחיצה מחוץ לו
      setTimeout(() => { // setTimeout קטן כדי למנוע סגירה מיידית מהקליק שפתח
        document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
      }, 50);
  }

  function closeMenuOutside(e) {
      const menu = document.getElementById('detach-menu');
      // סגור רק אם הקליק היה *מחוץ* לתפריט עצמו
      if (menu && !menu.contains(e.target)) {
          removeDetachMenu();
      } else if (menu) {
          // אם הקליק היה בתוך התפריט, הוסף שוב את המאזין
          // (כי הוא הוסר עם once: true)
          document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
      }
  }

  function removeDetachMenu() {
      const menu = document.getElementById('detach-menu');
      if (menu) {
          // הסר מאזין קליקים גלובלי אם קיים (למקרה שהתפריט נסגר לא דרך קליק)
          document.removeEventListener('click', closeMenuOutside, { capture: true });
          menu.remove();
      }
  }

  function detachBlock(blockToDetach) {
      if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) return;

      const connectedToId = blockToDetach.getAttribute('data-connected-to');
      const connectionDirection = blockToDetach.getAttribute('data-connection-direction');
      const connectedBlock = document.getElementById(connectedToId);

      console.log(`Detaching block ${blockToDetach.id} from ${connectedToId} (direction: ${connectionDirection})`);

      // הסרת מאפייני חיבור מהבלוק המנותק
      blockToDetach.removeAttribute('data-connected-to');
      blockToDetach.removeAttribute('data-connection-direction');
      blockToDetach.classList.remove('connected-block');

      // הסרת מאפייני חיבור מהבלוק שהיה מחובר אליו
      if (connectedBlock) {
          const attributeToRemove = connectionDirection === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
          connectedBlock.removeAttribute(attributeToRemove);
          // בדוק אם עדיין יש לו חיבורים אחרים לפני הסרת הקלאס הכללי
          if (!connectedBlock.hasAttribute('data-connected-from-left') && !connectedBlock.hasAttribute('data-connected-from-right')) {
              connectedBlock.classList.remove('has-connected-block');
          }
      }

      // אפקט ויזואלי של ניתוק
      addDetachEffectAnimation(blockToDetach);

      // אופציונלי: הזז מעט את הבלוק המנותק כדי להראות שהוא חופשי
      const currentLeft = parseFloat(blockToDetach.style.left) || 0;
      const currentTop = parseFloat(blockToDetach.style.top) || 0;
      blockToDetach.style.left = (currentLeft + 10) + 'px';
      blockToDetach.style.top = (currentTop + 10) + 'px';

      removeDetachMenu(); // סגור את התפריט אם הוא עדיין פתוח
  }


  // ========================================================================
  // פונקציות עזר לאנימציה
  // ========================================================================
  function addSnapEffectAnimation(block) {
      block.classList.add('snap-animation');
      block.addEventListener('animationend', () => {
          block.classList.remove('snap-animation');
      }, { once: true });
  }

  function addDetachEffectAnimation(block) {
      block.classList.add('detach-animation');
      block.addEventListener('animationend', () => {
          block.classList.remove('detach-animation');
      }, { once: true });
  }

  // ========================================================================
  // פונקציית עזר ליצירת ID ייחודי (אם אין לבלוק ID)
  // ========================================================================
  function generateUniqueId(block) {
      // נשתמש ב-crypto אם זמין, אחרת בשיטה פשוטה יותר
      if (window.crypto && window.crypto.randomUUID) {
          block.id = `block-${crypto.randomUUID()}`;
      } else {
          block.id = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      }
      console.log("Generated unique ID:", block.id);
      return block.id;
  }

})(); // סוף ה-IIFE
// --- END OF FILE linkageimproved.js ---
