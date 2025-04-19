// === linkage-corrected.js ===

document.addEventListener('DOMContentLoaded', () => {

  // --- משתנים גלובליים ---
  let currentDraggedBlock = null;   // הבלוק שנגרר כרגע
  let potentialSnapTarget = null; // בלוק המטרה הפוטנציאלי להצמדה
  let snapDirection = null;         // כיוון ההצמדה הפוטנציאלי ('left' או 'right' ביחס לנגרר)
  // הסרנו את lastClickedBlock / lastRightClickedBlock כי לא היו בשימוש בקוד הגרירה

  const SNAP_THRESHOLD = 30; // מרחק בפיקסלים להפעלת הדגשת פוטנציאל הצמדה

  // --- פונקציות עזר ---

  // הוספת סגנונות CSS להדגשה ואנימציה
  function addHighlightStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ברירת מחדל לבלוקים - חשוב: לא משתמשים ב-position: absolute כאן! */
      .block {
        cursor: grab;
        position: relative; /* מאפשר מיקום יחסי ושימוש ב ::before/::after */
        user-select: none;
        /* ודא שעיצוב ברירת המחדל שלך נמצא כאן (גודל, רקע, גבול וכו') */
        width: 100px;
        height: 50px;
        border: 1px solid black;
        background-color: lightblue;
        margin: 5px; /* הוסף מרווח אם צריך */
        display: inline-block; /* או flex, או מה שמתאים לפריסה שלך */
        vertical-align: top; /* מומלץ אם display: inline-block */
        transition: opacity 0.15s ease-out; /* מעבר עדין להוספת/הסרת dragging */
      }

      /* סגנון לבלוק בזמן שהוא נגרר - להפחתת אפקט ה"רוח" */
      .block.dragging {
        opacity: 0.4;
        cursor: grabbing;
        /* ודא שהבלוק הנגרר תמיד מעל השאר */
        z-index: 1000;
      }

      /* בלוק שהוצמד והפך להיות ממוקם אבסולוטית */
      .block.snapped-absolute {
         position: absolute;
         /* הסר מרווחים שהיו אולי בפריסה הרגילה */
         margin: 0;
         /* ודא שהוא מעל בלוקים רגילים אך מתחת לבלוק נגרר */
         z-index: 10;
      }

      /* הדגשת בלוק מקור (הנגרר) כשקרוב להצמדה */
      .snap-source { /* חל על הבלוק עם קלאס dragging */
        /* אפשר להוסיף אפקט עדין, אבל ה-opacity כבר מבדיל אותו */
         /* box-shadow: 0 0 8px 2px rgba(0, 180, 255, 0.6); */
      }

      /* הדגשת בלוק יעד פוטנציאלי */
      .snap-target {
        filter: brightness(1.1);
        transition: filter 0.15s ease-out, box-shadow 0.15s ease-out;
        box-shadow: 0 0 10px 3px rgba(255, 255, 0, 0.7);
        /* העלה קצת את ה-z-index שלו כדי שה-box-shadow יהיה ברור */
        z-index: 5;
      }

      /* הדגשת השקע השמאלי בבלוק היעד (כשהמקור יתחבר מימין לו) */
      /* ה-::before/::after ימוקמו יחסית לבלוק המטרה כי הוא position: relative */
      .snap-target.snap-left::before {
        content: '';
        position: absolute;
        left: -6px; /* מעט שמאלה מהגבול */
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 22px;
        background-color: rgba(255, 255, 100, 0.95);
        border: 1px solid rgba(200, 200, 0, 0.8);
        border-radius: 0 5px 5px 0;
        box-shadow: 1px 0 3px rgba(0,0,0,0.2);
        z-index: 15; /* מעל ה-box-shadow של המטרה */
        animation: pulseIndicator 1.5s infinite ease-in-out;
      }

      /* הדגשת הפין הימני בבלוק היעד (כשהמקור יתחבר משמאל לו) */
      .snap-target.snap-right::after {
        content: '';
        position: absolute;
        right: -6px; /* מעט ימינה מהגבול */
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 22px;
        background-color: rgba(255, 255, 100, 0.95);
        border: 1px solid rgba(200, 200, 0, 0.8);
        border-radius: 5px 0 0 5px;
        box-shadow: -1px 0 3px rgba(0,0,0,0.2);
        z-index: 15; /* מעל ה-box-shadow של המטרה */
        animation: pulseIndicator 1.5s infinite ease-in-out;
      }

      /* אנימציית הצמדה (פועלת על הבלוק הנגרר) */
      @keyframes snapEffect {
        0% { transform: scale(1.03); }
        40% { transform: scale(0.97); }
        70% { transform: scale(1.01); }
        100% { transform: scale(1); }
      }
      .snap-animation {
        /* הפעלת האנימציה על הבלוק שזה עתה הוצמד */
        animation: snapEffect 0.3s ease-out;
      }

      /* אנימציית פעימה לאינדיקטור החיבור */
      @keyframes pulseIndicator {
        0% { opacity: 0.6; transform: translateY(-50%) scale(0.95); }
        50% { opacity: 1.0; transform: translateY(-50%) scale(1.05); }
        100% { opacity: 0.6; transform: translateY(-50%) scale(0.95); }
      }

      /* --- סימוני חיבור קבועים --- */
      .connected-block, .has-connected-block {
         /* סגנון בסיסי לבלוקים מחוברים אם רוצים */
         /* למשל, שינוי קל בגבול או ברקע */
      }

      /* סימון חיבור ויזואלי - קו קטן בין בלוקים מחוברים */
      .connected-block[data-connection-direction="right"]::after,
      .has-connected-block[data-connection-direction="left"]::before {
        content: '';
        position: absolute;
        width: 4px;
        height: 12px;
        background-color: rgba(100, 100, 0, 0.7); /* צבע קו חיבור קבוע */
        z-index: 5; /* מתחת לאינדיקטורים אבל מעל תוכן רגיל */
        top: 50%;
        transform: translateY(-50%);
      }
      .connected-block[data-connection-direction="right"]::after {
           right: -2px; /* ממקם חצי בפנים חצי בחוץ */
           border-radius: 0 2px 2px 0;
       }
      .has-connected-block[data-connection-direction="left"]::before {
           left: -2px; /* ממקם חצי בפנים חצי בחוץ */
           border-radius: 2px 0 0 2px;
       }

       /* -- שאר הסגנונות מהקוד הקודם (תפריט הקשר וכו') נשארו כפי שהם -- */
      .detach-context-menu { /* ... */ }
      #connection-indicator { /* ... */ }
    `;
    document.head.appendChild(style);
  }

  // פונקציה לניקוי הדגשות של פוטנציאל הצמדה
  function clearPotentialSnapHighlights() {
    const currentTarget = document.querySelector('.snap-target');
    if (currentTarget) {
      currentTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
    }
    // אין צורך לנקות snap-source כי הוא פשוט ה-dragging class
  }

  // פונקציה לניקוי *כל* ההדגשות והמצבים הזמניים (נקראת ב-Clear All)
  function clearAllHighlightsAndConnections() {
    clearPotentialSnapHighlights(); // נקה הדגשות פוטנציאל

    document.querySelectorAll('.block').forEach(el => {
      // הסר קלאסים של חיבור והצמדה
      el.classList.remove(
        'connected-block',
        'has-connected-block',
        'snapped-absolute', // חשוב להסיר את הקלאס של המיקום האבסולוטי
        'snap-animation',
        'detach-animation'
      );
      // נקה data attributes
      el.removeAttribute('data-connection-direction');
      // **איפוס סגנונות inline שהוספנו**
      el.style.position = ''; // מחזיר לברירת המחדל מה-CSS (relative)
      el.style.left = '';
      el.style.top = '';
      el.style.transform = ''; // נקה גם transform אם השתמשת בו
      el.style.zIndex = ''; // איפוס z-index
    });
  }

  // פונקציות פלייס הולדר (לא בשימוש ישיר בקוד הזה, אך נשארות למקרה הצורך)
  function removeDetachMenu() { /* ... */ }
  function hideConnectionIndicator() { /* ... */ }

  // --- הגדרת האזנה לאירועים ---

  // 1. הזרקת ה-CSS לדף
  addHighlightStyles();

  // 2. קבלת רפרנסים לאלמנטים
  const blocksContainer = document.getElementById('blocks-container'); // עדכן מזהה
  const allBlocks = document.querySelectorAll('.block');           // עדכן סלקטור

  if (!blocksContainer) {
    console.error("Error: Element with ID 'blocks-container' not found.");
    return; // עצור אם הקונטיינר לא קיים
  }

  // 3. הוספת מאזיני גרירה לכל בלוק
  allBlocks.forEach(block => {
    block.setAttribute('draggable', true);

    block.addEventListener('dragstart', (event) => {
      // event.dataTransfer.setData('text/plain', event.target.id); // אם צריך
      event.dataTransfer.effectAllowed = 'move';
      currentDraggedBlock = event.target;
      console.log('dragstart:', currentDraggedBlock.id);

      // הוסף שקיפות למקור הנגרר (עם timeout קטן)
      setTimeout(() => {
        if (currentDraggedBlock) {
          currentDraggedBlock.classList.add('dragging');
        }
      }, 0);
    });

    block.addEventListener('dragend', (event) => {
      console.log('dragend:', event.target.id);
      // הסר שקיפות מהבלוק שנגרר
      if (currentDraggedBlock && currentDraggedBlock === event.target) {
        currentDraggedBlock.classList.remove('dragging');
      }
      // נקה הדגשות פוטנציאליות (המטרה) אם הגרירה הסתיימה בלי הצמדה
      clearPotentialSnapHighlights();

      // אפס משתנים גלובליים
      currentDraggedBlock = null;
      potentialSnapTarget = null;
      snapDirection = null;
    });

    // מאזין ל-dragleave על בלוקים בודדים (לניקוי הדגשת מטרה אם הסמן יוצא)
    block.addEventListener('dragleave', (event) => {
      if (potentialSnapTarget === event.target) {
        clearPotentialSnapHighlights();
        potentialSnapTarget = null;
        snapDirection = null;
      }
    });
  });

  // 4. מאזינים על הקונטיינר (dragover, drop)
  blocksContainer.addEventListener('dragover', (event) => {
    event.preventDefault(); // חובה כדי לאפשר drop
    event.dataTransfer.dropEffect = 'move';

    if (!currentDraggedBlock) return;

    const draggedRect = currentDraggedBlock.getBoundingClientRect();
    let foundPotentialTargetThisCycle = false;
    let closestTarget = null;
    let closestDirection = null;
    let minDistance = SNAP_THRESHOLD;

    // נקה הדגשת מטרה קודמת *בתחילת* כל בדיקה
    clearPotentialSnapHighlights();

    // חפש את המטרה הקרובה ביותר
    document.querySelectorAll('.block:not(.dragging)').forEach(targetBlock => {
      if (targetBlock === currentDraggedBlock) return;

      const targetRect = targetBlock.getBoundingClientRect();

      // בדוק חפיפה אנכית מינימלית
      const verticalOverlap = Math.max(0, Math.min(draggedRect.bottom, targetRect.bottom) - Math.max(draggedRect.top, targetRect.top));
      if (verticalOverlap < targetRect.height / 3) return;

      // מרחקים אופקיים
      const distRightToLeft = Math.abs(draggedRect.right - targetRect.left);
      const distLeftToRight = Math.abs(draggedRect.left - targetRect.right);

      // בדוק אם צד ימין של הנגרר קרוב לשמאל המטרה
      if (distRightToLeft < minDistance) {
        minDistance = distRightToLeft;
        closestTarget = targetBlock;
        closestDirection = 'right'; // נגרר יתחבר מימין (לשמאל המטרה)
        foundPotentialTargetThisCycle = true;
      }

      // בדוק אם צד שמאל של הנגרר קרוב לימין המטרה
      if (distLeftToRight < minDistance) {
        minDistance = distLeftToRight;
        closestTarget = targetBlock;
        closestDirection = 'left'; // נגרר יתחבר משמאל (לימין המטרה)
        foundPotentialTargetThisCycle = true;
      }
    });

    // אם מצאנו יעד קרוב מספיק
    if (foundPotentialTargetThisCycle && closestTarget) {
      potentialSnapTarget = closestTarget;
      snapDirection = closestDirection;

      // הדגש את המטרה ואת הצד הרלוונטי
      potentialSnapTarget.classList.add('snap-target');
      potentialSnapTarget.classList.add(snapDirection === 'right' ? 'snap-left' : 'snap-right');

    } else {
      // לא נמצא יעד קרוב - אפס משתנים (ההדגשה נוקתה קודם)
      potentialSnapTarget = null;
      snapDirection = null;
    }
  });

  blocksContainer.addEventListener('drop', (event) => {
    event.preventDefault();
    console.log('drop event');

    // בדוק אם השחרור קרה בזמן שהיה יעד פוטנציאלי מודגש
    if (potentialSnapTarget && snapDirection && currentDraggedBlock) {
      console.log(`Snapping ${currentDraggedBlock.id} to ${potentialSnapTarget.id}, direction: ${snapDirection}`);

      // --- לוגיקת הצמדה ---
      const targetRect = potentialSnapTarget.getBoundingClientRect();
      // חשוב: קח את ה-offset של הקונטיינר אם הוא לא ב-(0,0) של ה-viewport
      const containerRect = blocksContainer.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      // 1. הפוך את הבלוק הנגרר לאבסולוטי והוסף קלאס מתאים
      currentDraggedBlock.classList.add('snapped-absolute');

      // 2. חשב את המיקום האבסולוטי החדש (יחסית לקונטיינר)
      let newX, newY;
      // שמור על יישור אנכי עם המטרה (בהנחה שהם באותו גובה בערך)
      newY = (targetRect.top + scrollY) - (containerRect.top + scrollY);

      const spacing = 2; // רווח קטן בין הבלוקים

      if (snapDirection === 'right') { // הצמד לשמאל המטרה
        newX = (targetRect.left + scrollX) - currentDraggedBlock.offsetWidth - spacing - (containerRect.left + scrollX);
      } else { // snapDirection === 'left' // הצמד לימין המטרה
        newX = (targetRect.right + scrollX) + spacing - (containerRect.left + scrollX);
      }

      // 3. עדכן את מיקום הבלוק
      currentDraggedBlock.style.left = `${newX}px`;
      currentDraggedBlock.style.top = `${newY}px`;
      // ודא שה-z-index מתאים לבלוק מחובר
      // currentDraggedBlock.style.zIndex = '10'; // נקבע ע"י snapped-absolute

      console.log(`Snapped! New position for ${currentDraggedBlock.id}: (${newX}px, ${newY}px)`);

      // 4. הוסף אנימציית הצמדה (על הבלוק שהוזז)
      currentDraggedBlock.classList.add('snap-animation');
      setTimeout(() => {
        if(currentDraggedBlock) currentDraggedBlock.classList.remove('snap-animation');
      }, 300); // משך האנימציה

      // 5. הוסף סימונים ויזואליים קבועים של החיבור
      currentDraggedBlock.classList.add('connected-block');
      potentialSnapTarget.classList.add('has-connected-block');
      if (snapDirection === 'right') {
        currentDraggedBlock.dataset.connectionDirection = 'right';
        potentialSnapTarget.dataset.connectionDirection = 'left';
      } else {
        currentDraggedBlock.dataset.connectionDirection = 'left';
        potentialSnapTarget.dataset.connectionDirection = 'right';
      }
      // ----------------------

    } else {
      console.log('Drop occurred outside a snap zone.');
      // כאן אפשר להוסיף לוגיקה למה קורה אם הבלוק מושמט לא באזור הצמדה
      // למשל, להחזיר אותו למקומו המקורי, או למקם אותו במקום השחרור
      // (כרגע הוא פשוט יישאר במקום האחרון שהיה בו לפני dragend)
    }

    // נקה את מצב ההדגשה הפוטנציאלי בכל מקרה לאחר ה-drop
    clearPotentialSnapHighlights();
    potentialSnapTarget = null; // אפס את המשתנים
    snapDirection = null;
    // ה-dragend ינקה את currentDraggedBlock ואת ה-dragging class
  });

  // 5. מאזין לכפתור "נקה הכל"
  const clearAllButton = document.getElementById('clear-all'); // עדכן מזהה
  if (clearAllButton) {
    clearAllButton.addEventListener('click', function() {
      console.log('Clear All button clicked');
      // ניקוי משתנים גלובליים
      currentDraggedBlock = null;
      potentialSnapTarget = null;
      snapDirection = null;

      // ניקוי כל ההדגשות, החיבורים, והסגנונות שהוספנו מה-DOM
      clearAllHighlightsAndConnections();

      // ניקוי אלמנטים נוספים (אם קיימים)
      removeDetachMenu();
      hideConnectionIndicator();

      // כאן ניתן להוסיף קוד לאיפוס נוסף אם צריך
      // (למשל, אם שמרתם מצב כלשהו ב-localStorage)
    });
  } else {
     console.warn("Warning: Element with ID 'clear-all' not found.");
  }

}); // סוף DOMContentLoaded
