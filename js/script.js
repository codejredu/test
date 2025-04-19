// === linkage-complete.js ===

document.addEventListener('DOMContentLoaded', () => {

  // --- משתנים גלובליים ---
  let currentDraggedBlock = null;   // הבלוק שנגרר כרגע
  let potentialSnapTarget = null; // בלוק המטרה הפוטנציאלי להצמדה
  let snapDirection = null;         // כיוון ההצמדה הפוטנציאלי ('left' או 'right' ביחס לנגרר)
  let lastClickedBlock = null;      // (לשימוש עתידי/קיים בלוגיקה אחרת)
  let lastRightClickedBlock = null; // (לשימוש עתידי/קיים בלוגיקה אחרת)

  const SNAP_THRESHOLD = 30; // מרחק בפיקסלים להפעלת הדגשת פוטנציאל הצמדה

  // --- פונקציות עזר ---

  // הוספת סגנונות CSS להדגשה ואנימציה
  function addHighlightStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* סגנון לבלוק בזמן שהוא נגרר - להפחתת אפקט ה"רוח" */
      .block.dragging {
        opacity: 0.5;
        cursor: grabbing;
      }

      /* ברירת מחדל לבלוקים */
      .block {
        cursor: grab;
        position: absolute; /* חשוב למיקום וחיבור */
        user-select: none; /* למנוע בחירת טקסט בזמן גרירה */
        /* הוסף כאן מידות ועיצוב בסיסי לבלוקים שלך */
        width: 100px;
        height: 50px;
        border: 1px solid black;
        background-color: lightblue;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1; /* ברירת מחדל */
      }
      .block.dragging {
        z-index: 1000; /* ודא שהבלוק הנגרר מעל הכל */
      }

      /* הדגשת בלוק מקור (הנגרר) כשקרוב להצמדה */
      .snap-source {
        filter: brightness(1.05);
        transition: filter 0.15s ease-out, box-shadow 0.15s ease-out;
        box-shadow: 0 0 8px 2px rgba(0, 180, 255, 0.6);
      }
      /* אפשר להוסיף גם הדגשה לתמונה אם יש */
      .snap-source img, .snap-source .block-svg-image {
         box-shadow: 0 0 8px 2px rgba(0, 180, 255, 0.6);
         filter: brightness(1.05);
      }

      /* הדגשת בלוק יעד פוטנציאלי */
      .snap-target {
        filter: brightness(1.1);
        transition: filter 0.15s ease-out, box-shadow 0.15s ease-out;
        box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.6);
      }
      /* אפשר להוסיף גם הדגשה לתמונה אם יש */
       .snap-target img, .snap-target .block-svg-image {
         box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.6);
         filter: brightness(1.1);
      }

      /* הדגשת השקע השמאלי בבלוק היעד (כשהמקור יתחבר מימין לו) */
      .snap-target.snap-left::before {
        content: '';
        position: absolute;
        left: -5px; /* הצמד לשמאל */
        top: 50%;
        transform: translateY(-50%);
        width: 8px; /* קצת יותר בולט */
        height: 22px;
        background-color: rgba(255, 255, 100, 0.9);
        border: 1px solid rgba(200, 200, 0, 0.7);
        border-radius: 0 5px 5px 0; /* פינות מעוגלות בצד הפונה לרווח */
        box-shadow: 1px 0 3px rgba(0,0,0,0.2);
        z-index: 10;
        animation: pulseIndicator 1.5s infinite ease-in-out;
      }

      /* הדגשת הפין הימני בבלוק היעד (כשהמקור יתחבר משמאל לו) */
      .snap-target.snap-right::after {
        content: '';
        position: absolute;
        right: -5px; /* הצמד לימין */
        top: 50%;
        transform: translateY(-50%);
        width: 8px; /* קצת יותר בולט */
        height: 22px;
        background-color: rgba(255, 255, 100, 0.9);
        border: 1px solid rgba(200, 200, 0, 0.7);
        border-radius: 5px 0 0 5px; /* פינות מעוגלות בצד הפונה לרווח */
        box-shadow: -1px 0 3px rgba(0,0,0,0.2);
        z-index: 10;
        animation: pulseIndicator 1.5s infinite ease-in-out;
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

      /* אנימציית פעימה לאינדיקטור החיבור */
      @keyframes pulseIndicator {
        0% { opacity: 0.6; transform: translateY(-50%) scale(0.95); }
        50% { opacity: 1.0; transform: translateY(-50%) scale(1.05); }
        100% { opacity: 0.6; transform: translateY(-50%) scale(0.95); }
      }

      /* סימון בלוקים מחוברים (דוגמה) */
      .connected-block {
         /* אפשר להוסיף סימן קבוע קטן או לשנות רקע קלות */
         /* filter: brightness(1.02); */
      }
      .has-connected-block {
         /* position: relative; */ /* כבר מוגדר בדרך כלל */
      }

      /* סימון חיבור ויזואלי - קו דק בין בלוקים מחוברים (דוגמה) */
      .connected-block[data-connection-direction="right"]::after,
      .has-connected-block[data-connection-direction="left"]::before {
        content: '';
        position: absolute;
        width: 4px; /* עובי הקו */
        height: 12px; /* גובה הקו */
        background-color: rgba(150, 150, 0, 0.6); /* צבע הקו */
        z-index: 5;
        top: 50%;
        transform: translateY(-50%);
      }
      /* מיקום הקו לימין הבלוק המחובר */
       .connected-block[data-connection-direction="right"]::after {
           right: -2px; /* ממקם את הקו בדיוק ברווח */
           border-radius: 0 2px 2px 0;
       }
       /* מיקום הקו לשמאל הבלוק שיש לו חיבור */
       .has-connected-block[data-connection-direction="left"]::before {
           left: -2px; /* ממקם את הקו בדיוק ברווח */
           border-radius: 2px 0 0 2px;
       }

      /* עיצוב התפריט הקשר (אם יש) */
      .detach-context-menu {
        min-width: 120px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        /* ... שאר העיצוב ... */
      }

      /* סגנון לאינדיקטור החיבור (אם יש) */
      #connection-indicator {
        transition: all 0.2s ease-out;
        /* ... שאר העיצוב ... */
      }
    `;
    document.head.appendChild(style);
  }

  // פונקציה לניקוי הדגשות של פוטנציאל הצמדה
  function clearPotentialSnapHighlights() {
    // הסר הדגשה מהמקור (שהיה נגרר)
    const currentSource = document.querySelector('.snap-source');
    if (currentSource) {
        currentSource.classList.remove('snap-source');
    }
    // הסר הדגשה מהיעד הפוטנציאלי
    const currentTarget = document.querySelector('.snap-target');
    if (currentTarget) {
        currentTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
    }
  }

  // פונקציה לניקוי *כל* ההדגשות והמצבים הזמניים
  function clearAllHighlights() {
    clearPotentialSnapHighlights(); // נקה הדגשות פוטנציאל
    document.querySelectorAll('.connected-block, .has-connected-block, .snap-animation, .detach-animation').forEach(el => {
      el.classList.remove('connected-block', 'has-connected-block', 'snap-animation', 'detach-animation');
      el.removeAttribute('data-connection-direction'); // נקה גם את נתוני הכיוון
    });
    // ניתן להוסיף כאן ניקוי של הדגשות נוספות אם יש
  }

  // פונקציות פלייס הולדר (ממש לפי הצורך)
  function removeDetachMenu() {
    // console.log("Placeholder: Removing detach menu");
    const menu = document.querySelector('.detach-context-menu');
    if (menu) menu.remove();
  }

  function hideConnectionIndicator() {
    // console.log("Placeholder: Hiding connection indicator");
     const indicator = document.getElementById('connection-indicator');
     if(indicator) indicator.style.display = 'none';
  }

  // --- הגדרת האזנה לאירועים ---

  // הזרקת ה-CSS לדף
  addHighlightStyles();

  const blocksContainer = document.getElementById('blocks-container'); // עדכן את המזהה בהתאם ל-HTML
  const allBlocks = document.querySelectorAll('.block'); // עדכן את הסלקטור בהתאם ל-HTML

  // הוספת מאזיני גרירה לכל בלוק
  allBlocks.forEach(block => {
    block.setAttribute('draggable', true);

    block.addEventListener('dragstart', (event) => {
      // event.dataTransfer.setData('text/plain', event.target.id); // אם צריך להעביר מידע
      event.dataTransfer.effectAllowed = 'move';
      currentDraggedBlock = event.target; // שמור את הבלוק הנגרר
      console.log('dragstart:', currentDraggedBlock.id);

      // השתמש ב-setTimeout כדי לאפשר לדפדפן ליצור את תמונת ה"רוח" לפני שינוי הסגנון
      setTimeout(() => {
        if (currentDraggedBlock) { // בדיקה נוספת למקרה שהגרירה בוטלה מיד
           currentDraggedBlock.classList.add('dragging');
        }
      }, 0);
    });

    block.addEventListener('dragend', (event) => {
        console.log('dragend:', event.target.id);
        // ודא שהבלוק שסיים את הגרירה הוא זה ששמרנו
        if (currentDraggedBlock && currentDraggedBlock === event.target) {
            currentDraggedBlock.classList.remove('dragging'); // הסר את קלאס השקיפות
        }
        // נקה הדגשות פוטנציאליות ומצב אם הגרירה הסתיימה בלי הצמדה
        clearPotentialSnapHighlights();
        currentDraggedBlock = null;
        potentialSnapTarget = null;
        snapDirection = null;
        // חשוב: אל תנקה כאן את connected-block וכו', רק את הדגשות הפוטנציאל
    });

    // (אופציונלי) מאזין ל-dragleave על בלוקים בודדים
    block.addEventListener('dragleave', (event) => {
        // אם הסמן עוזב בלוק שהיה מודגש כיעד פוטנציאלי
        if (potentialSnapTarget === event.target) {
            clearPotentialSnapHighlights();
            potentialSnapTarget = null;
            snapDirection = null;
        }
    });
  });

  // מאזינים על הקונטיינר (יעיל יותר ממאזינים על כל בלוק בנפרד עבור dragover/drop)
  if (blocksContainer) {
    blocksContainer.addEventListener('dragover', (event) => {
      event.preventDefault(); // חובה כדי לאפשר drop
      event.dataTransfer.dropEffect = 'move';

      if (!currentDraggedBlock) return; // אין בלוק נגרר כרגע

      const draggedRect = currentDraggedBlock.getBoundingClientRect();
      let foundPotentialTargetThisCycle = false;
      let closestTarget = null;
      let closestDirection = null;
      let minDistance = SNAP_THRESHOLD;

      // נקה הדגשות קודמות *בתחילת* כל בדיקה ב-dragover
      clearPotentialSnapHighlights();

      // עבור על כל הבלוקים האחרים כדי לבדוק אם הם יעד פוטנציאלי
      document.querySelectorAll('.block:not(.dragging)').forEach(targetBlock => {
        if (targetBlock === currentDraggedBlock) return; // אל תשווה בלוק לעצמו

        const targetRect = targetBlock.getBoundingClientRect();

        // בדוק קרבה אנכית גסה (למשל, חפיפה של לפחות חצי גובה)
        const verticalOverlap = Math.max(0, Math.min(draggedRect.bottom, targetRect.bottom) - Math.max(draggedRect.top, targetRect.top));
        if (verticalOverlap < targetRect.height / 3) { // דרוש חפיפה מינימלית
             return;
        }

        // מרחק בין הצד הימני של הנגרר לשמאלי של המטרה
        const distRightToLeft = Math.abs(draggedRect.right - targetRect.left);
        // מרחק בין הצד השמאלי של הנגרר לימני של המטרה
        const distLeftToRight = Math.abs(draggedRect.left - targetRect.right);

        // בדוק אפשרות הצמדה מימין לנגרר (לשמאל המטרה)
        if (distRightToLeft < minDistance) {
            minDistance = distRightToLeft;
            closestTarget = targetBlock;
            closestDirection = 'right'; // הנגרר יתחבר מימין (לשמאל המטרה)
            foundPotentialTargetThisCycle = true;
        }

        // בדוק אפשרות הצמדה משמאל לנגרר (לימין המטרה)
        if (distLeftToRight < minDistance) {
            minDistance = distLeftToRight;
            closestTarget = targetBlock;
            closestDirection = 'left'; // הנגרר יתחבר משמאל (לימין המטרה)
            foundPotentialTargetThisCycle = true;
        }
      }); // סוף לולאת forEach

      // אם מצאנו יעד קרוב מספיק במחזור הנוכחי
      if (foundPotentialTargetThisCycle && closestTarget) {
        potentialSnapTarget = closestTarget; // שמור את היעד הקרוב ביותר
        snapDirection = closestDirection; // שמור את הכיוון שלו

        // הדגש את הבלוק הנגרר כמקור
        currentDraggedBlock.classList.add('snap-source');
        // הדגש את בלוק המטרה
        potentialSnapTarget.classList.add('snap-target');
        // הדגש את הצד המתאים בבלוק המטרה
        potentialSnapTarget.classList.add(snapDirection === 'right' ? 'snap-left' : 'snap-right');

      } else {
        // אם לא נמצא יעד קרוב במחזור הזה, נקה משתנים
        potentialSnapTarget = null;
        snapDirection = null;
        // clearPotentialSnapHighlights() כבר נקרא בתחילת הפונקציה
      }
    });

    blocksContainer.addEventListener('drop', (event) => {
      event.preventDefault(); // מנע התנהגות ברירת מחדל (כמו פתיחת קובץ)
      console.log('drop event');

      if (potentialSnapTarget && snapDirection && currentDraggedBlock) {
        console.log(`Attempting to snap ${currentDraggedBlock.id} to ${potentialSnapTarget.id}, direction: ${snapDirection}`);

        // --- לוגיקת חיבור הבלוקים בפועל ---
        // כאן תצטרך להוסיף את הקוד ש:
        // 1. מחשב את המיקום החדש של currentDraggedBlock (למשל, צמוד ל-potentialSnapTarget)
        // 2. מעדכן את style.left ו-style.top של currentDraggedBlock
        // 3. אולי שומר את הקשר הלוגי ביניהם (למשל, ב-data attributes או במבנה נתונים אחר)
        // 4. מטפל במקרה שבלוק כבר מחובר בצד זה

        // דוגמה פשוטה לחישוב מיקום (צריך להתאים לגודל הבלוקים ולרווח הרצוי):
        const targetRect = potentialSnapTarget.getBoundingClientRect();
        const draggedRect = currentDraggedBlock.getBoundingClientRect();
        const containerRect = blocksContainer.getBoundingClientRect(); // לקבלת אופסט הקונטיינר

        let newX, newY;
        newY = targetRect.top - containerRect.top; // שמור על אותו גובה Y (בהנחה שהם כבר מיושרים)

        if (snapDirection === 'right') { // הצמד את הנגרר מימין לעצמו = משמאל למטרה
          newX = targetRect.left - draggedRect.width - containerRect.left - 2; // 2px רווח
        } else { // snapDirection === 'left' // הצמד את הנגרר משמאל לעצמו = מימין למטרה
          newX = targetRect.right - containerRect.left + 2; // 2px רווח
        }

        // עדכן מיקום (חשוב שהבלוקים יהיו position: absolute)
         currentDraggedBlock.style.left = `${newX}px`;
         currentDraggedBlock.style.top = `${newY}px`;

        console.log(`Snapped! New position for ${currentDraggedBlock.id}: (${newX}px, ${newY}px)`);
        // -----------------------------------------

        // הוסף אנימציית הצמדה
        currentDraggedBlock.classList.add('snap-animation');
        potentialSnapTarget.classList.add('snap-animation');
        setTimeout(() => {
          if(currentDraggedBlock) currentDraggedBlock.classList.remove('snap-animation');
          if(potentialSnapTarget) potentialSnapTarget.classList.remove('snap-animation');
        }, 300); // משך האנימציה ב-ms

        // הוסף סימונים לבלוקים מחוברים
        currentDraggedBlock.classList.add('connected-block');
        potentialSnapTarget.classList.add('has-connected-block');
        // קבע את כיוון החיבור עבור הקו הדק (::after / ::before)
        if (snapDirection === 'right') {
          currentDraggedBlock.dataset.connectionDirection = 'right';
          potentialSnapTarget.dataset.connectionDirection = 'left';
        } else { // snapDirection === 'left'
          currentDraggedBlock.dataset.connectionDirection = 'left';
          potentialSnapTarget.dataset.connectionDirection = 'right';
        }

      } else {
        console.log('Drop occurred outside a snap zone.');
        // אם רוצים שהבלוק יזוז למקום השחרור גם אם אין הצמדה:
        // const dropX = event.clientX - (currentDraggedBlock?.dataset?.offsetX || 0); // צריך לשמור אופסט ב-dragstart
        // const dropY = event.clientY - (currentDraggedBlock?.dataset?.offsetY || 0);
        // if (currentDraggedBlock) {
        //   currentDraggedBlock.style.left = `${dropX}px`;
        //   currentDraggedBlock.style.top = `${dropY}px`;
        // }
      }

      // נקה את מצב ההדגשה והפוטנציאל בכל מקרה לאחר ה-drop
      clearPotentialSnapHighlights();
      potentialSnapTarget = null;
      snapDirection = null;
      // ה-dragend ינקה את currentDraggedBlock ואת ה-dragging class
    });
  } // סוף if (blocksContainer)

  // מאזין לכפתור "נקה הכל" (מהקוד המקורי)
  const clearAllButton = document.getElementById('clear-all');
  if (clearAllButton) {
    clearAllButton.addEventListener('click', function() {
      console.log('Clear All button clicked');
      // ניקוי משתנים גלובליים
      currentDraggedBlock = null;
      potentialSnapTarget = null;
      snapDirection = null;
      lastClickedBlock = null;
      lastRightClickedBlock = null;

      // ניקוי כל ההדגשות והסימונים מה-DOM
      clearAllHighlights(); // מנקה את רוב הדברים
       document.querySelectorAll('.block.dragging').forEach(el => el.classList.remove('dragging')); // הסר גם dragging אם נתקע

      // ניקוי אלמנטים נוספים (לפי הצורך)
      removeDetachMenu();
      hideConnectionIndicator();

      // אופציונלי: איפוס מיקום הבלוקים למיקום התחלתי
      // allBlocks.forEach(block => {
      //    block.style.left = block.dataset.initialX + 'px'; // אם שמרת מיקום התחלתי
      //    block.style.top = block.dataset.initialY + 'px';
      // });

      // אופציונלי: הסרת כל הבלוקים מהקונטיינר
      // if (blocksContainer) blocksContainer.innerHTML = '';
    });
  }

}); // סוף DOMContentLoaded
