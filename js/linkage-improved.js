// --- START OF FILE linkage-improved.js ---

// קוד גרירת בלוקים עם הילה בהתקרבות וחיבור ויזואלי "פאזל"
document.addEventListener('DOMContentLoaded', function() {
  console.log('טוען מערכת גרירת בלוקים...');

  // מחכה שהדף יטען לגמרי כולל הסקריפטים האחרים
  // ניתן להפחית את זמן ההמתנה אם אין תלויות כבדות
  setTimeout(function() {
    setupDragging();
  }, 500); // הופחת ל-500ms

  function setupDragging() {
    console.log('מפעיל מערכת גרירה...');

    // קבועים שניתן לכוונן
    let PROXIMITY_THRESHOLD = 15; // הוגדל ל-15 פיקסלים למרחק התקרבות נוח יותר

    // הוספת כפתור לשינוי סף הקרבה
    addProximityControl();

    // איתור אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות #program-blocks לא נמצא!');
      return;
    }
     // ודא שלאזור התכנות יש סגנון position מתאים
    if (window.getComputedStyle(programmingArea).position === 'static') {
        console.warn('לאזור התכנות #program-blocks אין position מוגדר. מגדיר ל-relative.');
        programmingArea.style.position = 'relative';
    }

    // משתנים גלובליים
    let currentDraggedBlock = null;
    let nearbyBlock = null;
    let offsetX = 0; // קיזוז עכבר מתחילת הבלוק
    let offsetY = 0;

    // הוספת סגנונות להילה וחיבור הפאזל
    addVisualStyles();

    // מאזין לאירוע dragstart - כאשר מתחילים לגרור בלוק
    programmingArea.addEventListener('dragstart', function(e) {
      if (e.target.classList.contains('block-container')) {
        currentDraggedBlock = e.target;
        const rect = currentDraggedBlock.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();

        // חישוב הקיזוז של העכבר מפינת הבלוק
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        // מניעת יצירת רוח רפאים - הגדרת התמונה שתיווצר בזמן גרירה
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        e.dataTransfer.effectAllowed = "move"; // חשוב לאפשר הזזה

        // מסמנים את הבלוק כנגרר
        currentDraggedBlock.classList.add('dragging');
        currentDraggedBlock.style.zIndex = '1000'; // ודא שהבלוק הנגרר מעל אחרים

        // מיקום מקורי של הבלוק למקרה שנצטרך לשחזר אותו (אם כי פחות רלוונטי כעת)
        // e.target.dataset.originalLeft = e.target.style.left || '';
        // e.target.dataset.originalTop = e.target.style.top || '';

        // לא מעדכנים מיקום כאן, אלא ב-dragover/mousemove
        console.log('מתחיל גרירה של:', currentDraggedBlock.id);
      }
    });

    // מאזין לאירוע dragend - כאשר מסיימים לגרור בלוק
    programmingArea.addEventListener('dragend', function(e) {
      if (currentDraggedBlock && e.target === currentDraggedBlock) {
        console.log('סיום גרירה של:', currentDraggedBlock.id);

        // הסרת הסימון והחזרת z-index
        currentDraggedBlock.classList.remove('dragging');
        currentDraggedBlock.style.zIndex = ''; // מחזיר ל-z-index רגיל

        // בדיקה אם יש בלוק קרוב וההילה מופיעה
        if (nearbyBlock &&
            (currentDraggedBlock.classList.contains('proximity-source') ||
             nearbyBlock.classList.contains('proximity-target'))) {
          console.log('יש הילה - מבצע חיבור פאזל');
          connectBlocks(currentDraggedBlock, nearbyBlock);
          addConnectionAnimation(currentDraggedBlock, nearbyBlock); // הפעל אנימציה
        } else {
          console.log('אין הילה - לא מבצע חיבור');
           // אם לא חובר, ודא שהמיקום הסופי מעודכן נכון
          updateDraggedBlockPosition(e, true); // עדכון סופי
        }

        // נקה את המצב והילות
        clearAllHighlights();
        currentDraggedBlock = null;
        nearbyBlock = null;
        offsetX = 0;
        offsetY = 0;
      }
    });

    // מאזין לאירוע dragover - כאשר גוררים מעל אזור התכנות
    programmingArea.addEventListener('dragover', function(e) {
      if (currentDraggedBlock) {
        e.preventDefault(); // חייב למניעת התנהגות ברירת מחדל ולאפשר drop
        e.dataTransfer.dropEffect = "move";

        updateDraggedBlockPosition(e);

        // בדיקת קרבה לבלוקים אחרים
        checkProximityToOtherBlocks();
      }
    });

    // מאזין לאירוע drop - כאשר משחררים בלוק באזור התכנות
    // שימו לב: אירוע drop מתרחש *על האלמנט שמעליו הבלוק שוחרר*.
    // כאן אנחנו מאזינים על אזור התכנות כולו.
    programmingArea.addEventListener('drop', function(e) {
        console.log('אירוע drop נתפס באזור התכנות');
        e.preventDefault(); // מנע התנהגות ברירת מחדל (כמו פתיחת קישור)

        // הלוגיקה של החיבור/אי-חיבור מטופלת ב-dragend
        // ה-drop כאן בעיקר כדי לאפשר את השחרור באופן תקין.
        if (currentDraggedBlock) {
             // ודא מיקום סופי - חשוב אם ה-dragend לא מספיק מדויק
             updateDraggedBlockPosition(e, true);
        }
    });


    // פונקציה לעדכון מיקום הבלוק הנגרר בזמן אמת
    function updateDraggedBlockPosition(e, isFinalPosition = false) {
      if (!currentDraggedBlock) return;

      const programRect = programmingArea.getBoundingClientRect();

      // חישוב מיקום חדש יחסית לאזור התכנות, תוך התחשבות בקיזוז
      let newLeft = e.clientX - programRect.left - offsetX;
      let newTop = e.clientY - programRect.top - offsetY;

      // הגבלת המיקום לגבולות אזור התכנות (אופציונלי)
      // newLeft = Math.max(0, Math.min(newLeft, programRect.width - currentDraggedBlock.offsetWidth));
      // newTop = Math.max(0, Math.min(newTop, programRect.height - currentDraggedBlock.offsetHeight));

      // עדכון המיקום רק אם העכבר נמצא בגבולות הגיוניים
      if (e.clientX > 0 && e.clientY > 0) {
        currentDraggedBlock.style.position = 'absolute';
        currentDraggedBlock.style.left = newLeft + 'px';
        currentDraggedBlock.style.top = newTop + 'px';
        if (isFinalPosition) {
            console.log(`מיקום סופי (לא מחובר): ${newLeft.toFixed(1)}px, ${newTop.toFixed(1)}px`);
        }
      }
    }

    // פונקציה לבדיקת קרבה לבלוקים אחרים
    function checkProximityToOtherBlocks() {
      if (!currentDraggedBlock) return;

      const draggedRect = currentDraggedBlock.getBoundingClientRect();
      let potentialTarget = null;
      let minDistance = PROXIMITY_THRESHOLD + 1; // התחל עם ערך גבוה מהסף

      // קבלת כל הבלוקים באזור התכנות *שאינם* הבלוק הנגרר
      const otherBlocks = programmingArea.querySelectorAll('.block-container:not(.dragging)');

      otherBlocks.forEach(block => {
        const blockRect = block.getBoundingClientRect();

        // בדיקת חפיפה אנכית מינימלית (לפחות חלק מהגובה חופף)
        const verticalOverlap = !(draggedRect.bottom < blockRect.top || draggedRect.top > blockRect.bottom);

        if (verticalOverlap) {
          // בדוק קרבה מימין לבלוק הקיים (הבלוק הנגרר משמאל)
          const distanceRight = Math.abs(draggedRect.right - blockRect.left);
          if (distanceRight <= PROXIMITY_THRESHOLD && distanceRight < minDistance) {
            // ודא שהם בערך באותו גובה Y (מרכזי הבלוקים)
             const verticalCenterDiff = Math.abs((draggedRect.top + draggedRect.height / 2) - (blockRect.top + blockRect.height / 2));
             if (verticalCenterDiff < draggedRect.height / 2) { // מאפשר חפיפה חלקית בגובה
                 minDistance = distanceRight;
                 potentialTarget = block;
                 console.log(`קרוב מימין ל-${block.id}, מרחק: ${distanceRight.toFixed(1)}`);
             }
          }

          // בדוק קרבה משמאל לבלוק הקיים (הבלוק הנגרר מימין)
          const distanceLeft = Math.abs(draggedRect.left - blockRect.right);
           if (distanceLeft <= PROXIMITY_THRESHOLD && distanceLeft < minDistance) {
             // ודא שהם בערך באותו גובה Y (מרכזי הבלוקים)
             const verticalCenterDiff = Math.abs((draggedRect.top + draggedRect.height / 2) - (blockRect.top + blockRect.height / 2));
             if (verticalCenterDiff < draggedRect.height / 2) { // מאפשר חפיפה חלקית בגובה
                 minDistance = distanceLeft;
                 potentialTarget = block;
                 console.log(`קרוב משמאל ל-${block.id}, מרחק: ${distanceLeft.toFixed(1)}`);
             }
          }
        }
      });

      // אם מצאנו בלוק קרוב, עדכן את ההדגשות
      if (potentialTarget && potentialTarget !== nearbyBlock) {
        clearAllHighlights(); // נקה קודם
        nearbyBlock = potentialTarget;
        highlightBlocks(currentDraggedBlock, nearbyBlock);
        console.log('נמצא בלוק קרוב:', nearbyBlock.id, 'מרחק:', minDistance.toFixed(1), 'מפעיל הילה.');
      } else if (!potentialTarget && nearbyBlock) {
        // אם התרחקנו מבלוק שהיה קרוב
        clearAllHighlights();
        nearbyBlock = null;
        console.log('התרחק מבלוק, מסיר הילה.');
      }
    }

    // פונקציה להדגשת בלוקים קרובים
    function highlightBlocks(draggedBlock, targetBlock) {
      if (!draggedBlock || !targetBlock) return;
      console.log('מוסיף הילה לבלוקים');
      draggedBlock.classList.add('proximity-source');
      targetBlock.classList.add('proximity-target');

      // בדיקה קצרה אם הקלאסים הוחלו
      setTimeout(() => {
        if (!draggedBlock.classList.contains('proximity-source') || !targetBlock.classList.contains('proximity-target')) {
          console.warn('בעיה בהחלת קלאס הילה');
        }
      }, 0);
    }

    // פונקציה לניקוי כל ההילות
    function clearAllHighlights() {
      const highlightedBlocks = programmingArea.querySelectorAll('.proximity-source, .proximity-target');
      highlightedBlocks.forEach(block => {
        block.classList.remove('proximity-source', 'proximity-target');
      });
      // חשוב: גם לנקות את המשתנה הגלובלי
      // nearbyBlock = null; // -- נעשה ב-dragend או ב-checkProximity
    }

    // פונקציה לחיבור בלוקים (התממשקות)
    function connectBlocks(sourceBlock, targetBlock) {
      if (!sourceBlock || !targetBlock) return;

      try {
        const sourceRect = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();

        let direction;
        let newLeft, newTop;

        // קביעת כיוון החיבור (מי משמאל ומי מימין)
        if (sourceRect.left < targetRect.left) {
          // המקור (הנגרר) משמאל ליעד
          direction = 'left-to-right';
          newLeft = targetRect.left - sourceRect.width - programRect.left; // הצמד את הקצה הימני של המקור לשמאלי של היעד
          newTop = targetRect.top - programRect.top; // שמור על אותו גובה Y של היעד
          console.log('מחבר משמאל לימין.');
        } else {
          // המקור (הנגרר) מימין ליעד
          direction = 'right-to-left';
          newLeft = targetRect.right - programRect.left; // הצמד את הקצה השמאלי של המקור לימני של היעד
          newTop = targetRect.top - programRect.top; // שמור על אותו גובה Y של היעד
          console.log('מחבר מימין לשמאל.');
        }

        // עדכון מיקום הבלוק המקור (הנגרר) למיקום המדויק
        sourceBlock.style.position = 'absolute';
        sourceBlock.style.left = newLeft + 'px';
        sourceBlock.style.top = newTop + 'px';

        // הוספת קלאסים ותכונות לסימון החיבור (מפעיל את ה-CSS)
        sourceBlock.classList.add('connected-block');
        targetBlock.classList.add('has-connected-block'); // קלאס ליעד
        sourceBlock.setAttribute('data-connected-to', targetBlock.id || generateUniqueId(targetBlock));
        sourceBlock.setAttribute('data-connection-direction', direction);

        // עדכון z-index כדי שהבלוק השמאלי (עם השקע) יהיה קצת מעל
        if (direction === 'left-to-right') {
            sourceBlock.style.zIndex = '10';
            targetBlock.style.zIndex = '5';
        } else { // direction === 'right-to-left'
            targetBlock.style.zIndex = '10'; // היעד הוא השמאלי
            sourceBlock.style.zIndex = '5';  // המקור הוא הימני
        }


        console.log(`חיבור ${sourceBlock.id} (${direction}) ל-${targetBlock.id}. מיקום חדש: ${newLeft.toFixed(1)}, ${newTop.toFixed(1)}`);

        // רישום מיקומים סופיים לבדיקה
        setTimeout(() => {
          const finalSourceRect = sourceBlock.getBoundingClientRect();
          const finalTargetRect = targetBlock.getBoundingClientRect();
          console.log('מיקום סופי של מקור:', finalSourceRect.left.toFixed(1), finalSourceRect.top.toFixed(1));
          console.log('מיקום סופי של יעד:', finalTargetRect.left.toFixed(1), finalTargetRect.top.toFixed(1));
          let gap;
          if (direction === 'left-to-right') {
              gap = finalTargetRect.left - finalSourceRect.right;
          } else {
              gap = finalSourceRect.left - finalTargetRect.right;
          }
          console.log(`רווח סופי ביניהם: ${gap.toFixed(2)}px`); // אמור להיות קרוב מאוד ל-0
        }, 50); // המתנה קצרה לעיבוד הדפדפן

      } catch (err) {
        console.error('שגיאה בהתממשקות בלוקים:', err);
      }
    }

    // פונקציה ליצירת מזהה ייחודי לבלוק אם אין לו
    function generateUniqueId(block) {
      if (!block.id) {
        const uniqueId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        block.id = uniqueId;
        console.log('נוצר ID חדש:', uniqueId);
      }
      return block.id;
    }

    // פונקציה להוספת אנימציית התממשקות
    function addConnectionAnimation(sourceBlock, targetBlock) {
      sourceBlock.classList.add('connection-animation');
      targetBlock.classList.add('connection-animation');

      setTimeout(() => {
        sourceBlock.classList.remove('connection-animation');
        targetBlock.classList.remove('connection-animation');
      }, 500); // משך האנימציה מוגדר ב-CSS
    }

    // פונקציה להוספת סגנונות CSS להילה ולהתממשקות הפאזל
    function addVisualStyles() {
      const styleId = 'block-linkage-styles';
      if (document.getElementById(styleId)) return; // מנע הוספה כפולה

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* הגדרות בסיס ומשתני CSS */
        :root {
          --connector-width: 10px;  /* רוחב השינן/שקע */
          --connector-height: 20px; /* גובה השינן/שקע */
          --connector-radius: calc(var(--connector-height) / 2);
          /* חשוב: צבע זה חייב להתאים לרקע של #program-blocks */
          --container-bg: ${window.getComputedStyle(programmingArea).backgroundColor || '#f0f0f0'};
          --block-border-radius: 5px; /* עיגול פינות כללי של הבלוק */
          --block-border-color: rgba(0, 0, 0, 0.2); /* צבע גבול עדין */
        }

        /* ודא שלאיזור התכנות יש צבע רקע ו-position */
        #program-blocks {
          background-color: var(--container-bg);
          position: relative; /* הכרחי למיקום אבסולוטי של הבלוקים */
          min-height: 200px; /* גובה מינימלי כלשהו */
          border: 1px solid #ccc; /* גבול ויזואלי */
          overflow: hidden; /* למנוע גלישה של בלוקים נגררים */
        }

        .block-container {
          position: absolute; /* מאפשר מיקום עם left/top */
          border-radius: var(--block-border-radius);
          cursor: grab;
          padding: 8px 12px;
          min-height: 36px; /* גובה מינימלי כדי שהמחבר יראה טוב */
          box-shadow: 2px 2px 5px rgba(0,0,0,0.15);
          display: inline-flex; /* מאפשר לתוכן לקבוע רוחב, וממרכז אנכית */
          align-items: center;
          box-sizing: border-box;
          border: 1px solid var(--block-border-color);
          color: black; /* צבע טקסט ברירת מחדל */
          /* צבע רקע ברירת מחדל - *מומלץ מאוד* להגדיר לכל בלוק ב-HTML או עם קלאס */
          background-color: lightgrey;
          /* מניעת בחירת טקסט בזמן גרירה */
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
        }

        .block-container.dragging {
            cursor: grabbing;
            opacity: 0.75; /* שקיפות קלה בזמן גרירה */
            box-shadow: 4px 4px 10px rgba(0,0,0,0.3);
        }

        /* סגנון הילה */
        .proximity-source, .proximity-target {
          outline: 3px dashed orange;
          outline-offset: 3px;
          /* אין צורך ב-position: relative כאן אם הוא כבר absolute */
        }

        /* --- סגנונות חיבור "פאזל" --- */

        /* כל בלוק שיכול להתחבר צריך relative כדי שה-pseudo elements יעבדו */
        .connected-block, .has-connected-block {
            position: absolute; /* או relative אם הם לא ממוקמים אבסולוטית */
        }

        /* בלוק המקור שמחובר משמאל לימין (הוא השמאלי, צריך "שקע" Notch בימין) */
        .connected-block[data-connection-direction="left-to-right"] {
          z-index: 10; /* ודא שהוא מעל הבלוק הימני */
        }
        .connected-block[data-connection-direction="left-to-right"]::after {
          content: '';
          position: absolute;
          width: var(--connector-width);
          height: var(--connector-height);
          background-color: var(--container-bg); /* צבע הרקע של המיכל ליצירת אשליית חיתוך */
          border-radius: var(--connector-radius) 0 0 var(--connector-radius); /* עיגול שמאלי */
          right: 0; /* צמוד לקצה הימני של הבלוק */
          top: 50%;
          transform: translateY(-50%);
          box-shadow: inset 1px 0 2px rgba(0, 0, 0, 0.15); /* צל פנימי קל */
          z-index: 1; /* מעל רקע הבלוק, מתחת לתוכן */
        }

        /* בלוק המקור שמחובר מימין לשמאל (הוא הימני, צריך "שינן" Bump בשמאל) */
        .connected-block[data-connection-direction="right-to-left"] {
           z-index: 5; /* מתחת לבלוק השמאלי */
        }
        .connected-block[data-connection-direction="right-to-left"]::before {
          content: '';
          position: absolute;
          width: var(--connector-width);
          height: var(--connector-height);
          /* חשוב: יורש את צבע הרקע של הבלוק עצמו */
          background-color: inherit;
          border: 1px solid var(--block-border-color);
          border-left: none; /* אין גבול איפה שהוא מתחבר לבלוק */
          border-radius: 0 var(--connector-radius) var(--connector-radius) 0; /* עיגול ימני */
          /* מיקום כך שיבלוט שמאלה מהקצה (מתחשב בגבול) */
          left: calc(-1 * var(--connector-width) + 1px);
          top: 50%;
          transform: translateY(-50%);
          box-sizing: border-box; /* כולל את הגבול במידות */
          z-index: -1; /* מאחורי תוכן הבלוק */
        }

        /* אנימציית התממשקות */
        @keyframes connectAnimation {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .connection-animation {
          animation: connectAnimation 0.5s ease-out;
        }
      `;
      document.head.appendChild(style);
      console.log('סגנונות ויזואליים (הילה ופאזל) הוטענו.');
    }

    // פונקציה להוספת שליטה על סף הקרבה
    function addProximityControl() {
      const controlId = 'proximity-control';
      if (document.getElementById(controlId)) return;

      const controlContainer = document.createElement('div');
      controlContainer.id = controlId;
      controlContainer.style.cssText = 'position: fixed; top: 10px; right: 10px; background: rgba(240, 240, 240, 0.9); padding: 10px; border: 1px solid #ccc; border-radius: 5px; z-index: 2000; font-family: sans-serif; font-size: 12px;';

      const title = document.createElement('div');
      title.textContent = 'סף קרבה (פיקסלים):';
      title.style.marginBottom = '5px';
      controlContainer.appendChild(title);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '1';
      slider.max = '50';
      slider.value = PROXIMITY_THRESHOLD;
      slider.style.width = '120px';
      controlContainer.appendChild(slider);

      const valueDisplay = document.createElement('span');
      valueDisplay.textContent = PROXIMITY_THRESHOLD;
      valueDisplay.style.marginLeft = '10px';
      valueDisplay.style.minWidth = '20px';
      valueDisplay.style.display = 'inline-block';
      valueDisplay.style.textAlign = 'right';
      controlContainer.appendChild(valueDisplay);

      slider.addEventListener('input', function() {
        PROXIMITY_THRESHOLD = parseInt(this.value);
        valueDisplay.textContent = PROXIMITY_THRESHOLD;
        console.log('סף קרבה שונה ל:', PROXIMITY_THRESHOLD);
      });

      document.body.appendChild(controlContainer);
    }

    // מאזין לכפתור "נקה הכל" (אם קיים)
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        console.log('מנקה את כל החיבורים...');
        currentDraggedBlock = null;
        nearbyBlock = null;
        clearAllHighlights();

        const allBlocks = programmingArea.querySelectorAll('.block-container');
        allBlocks.forEach(block => {
          // הסרת קלאסים ותכונות חיבור
          block.classList.remove('connected-block', 'has-connected-block', 'proximity-source', 'proximity-target');
          block.removeAttribute('data-connected-to');
          block.removeAttribute('data-connection-direction');
          // איפוס z-index (אם שונה)
          block.style.zIndex = '';
          // אופציונלי: איפוס מיקום התחלתי אם נדרש
          // block.style.left = block.dataset.initialLeft || '';
          // block.style.top = block.dataset.initialTop || '';
        });
        console.log('ניקוי הושלם.');
      });
    } else {
        console.warn('כפתור #clear-all לא נמצא. פונקציית הניקוי לא תהיה זמינה דרך כפתור.');
    }

    console.log('מערכת הגרירה והחיבור מוכנה.');
  } // סוף setupDragging
}); // סוף DOMContentLoaded
// --- END OF FILE linkage-improved.js ---
