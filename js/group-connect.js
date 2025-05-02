// --- LINKAGE-GROUP-CONNECTION-SIMPLIFIED.JS v1.0.0 ---
// מודול לחיבור קבוצות בלוקים לבלוקים אחרים

(function(global) {
  'use strict';

  // === הגדרות ===
  const CONNECTION_CONFIG = {
    debug: true,                      // האם להדפיס הודעות דיבאג בקונסול
    SNAP_RADIUS: 35,                  // רדיוס מקסימלי (בפיקסלים) לחיבור אוטומטי
    CONNECTION_TYPE_NEXT: 'next',       // מזהה לחיבור הבא (מתחת)
    CONNECTION_TYPE_PREVIOUS: 'previous', // מזהה לחיבור קודם (מעל)
    CONNECTION_TYPE_OUTPUT: 'output',   // מזהה לחיבור פלט (מימין, לרוב לתוך קלט)
    CONNECTION_TYPE_INPUT: 'input',     // מזהה לחיבור קלט (משמאל, לרוב מקבל פלט)
    // (אופציונלי: ניתן להוסיף סוגי חיבור נוספים לפי הצורך)
  };

  // === פונקציות עזר ===

  // הדפסת הודעות דיבאג
  function log(message, data) {
    if (CONNECTION_CONFIG.debug) {
      const prefix = '[GroupConnect]';
      if (data !== undefined) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  // קבלת אזור העבודה הראשי
  function getProgrammingArea() {
      // נסה למצוא את האזורים הנפוצים, אם לא נמצא החזר את ה-body
      return document.getElementById('program-blocks') || 
             document.getElementById('programming-area') || 
             document.body;
  }


  /**
   * מחשב את הקואורדינטות המוחלטות (יחסית לדף) של נקודת חיבור ספציפית על בלוק.
   * **חשוב:** יש להתאים את הפונקציה הזו למבנה ה-HTML הספציפי של הבלוקים שלך!
   * @param {HTMLElement} block - הבלוק שעליו נמצאת נקודת החיבור.
   * @param {string} connectionType - סוג החיבור (מהקונפיגורציה, למשל 'next').
   * @returns {{x: number, y: number}|null} - אובייקט עם קואורדינטות או null אם לא נמצא.
   */
  function getConnectionPointCoords(block, connectionType) {
    if (!block) return null;
    const rect = block.getBoundingClientRect();

    // --- התאם את הלוגיקה הזו למבנה הבלוקים שלך ---
    // דוגמאות גנריות:
    switch (connectionType) {
      case CONNECTION_CONFIG.CONNECTION_TYPE_NEXT: // נקודה תחתונה-אמצעית
        // נניח שיש בליטה תחתונה, או פשוט נשתמש בקצה התחתון
        return { x: rect.left + rect.width / 2, y: rect.bottom };
      case CONNECTION_CONFIG.CONNECTION_TYPE_PREVIOUS: // נקודה עליונה-אמצעית
        // נניח שיש שקע עליון, או פשוט נשתמש בקצה העליון
        return { x: rect.left + rect.width / 2, y: rect.top };
      case CONNECTION_CONFIG.CONNECTION_TYPE_OUTPUT: // נקודה ימנית-אמצעית
         // נניח שיש בליטה ימנית
        return { x: rect.right, y: rect.top + rect.height / 2 };
      case CONNECTION_CONFIG.CONNECTION_TYPE_INPUT: // נקודה שמאלית-אמצעית (של שקע קלט ספציפי)
        // זה ידרוש לרוב זיהוי אלמנט input ספציפי בתוך הבלוק
        // דוגמה פשוטה: נשתמש בקצה השמאלי
        return { x: rect.left, y: rect.top + rect.height / 2 };
        // **במציאות:** תצטרך למצוא אלמנט input ספציפי:
        // const inputElement = block.querySelector('.input-value-connector'); // דוגמה
        // if (!inputElement) return null;
        // const inputRect = inputElement.getBoundingClientRect();
        // return { x: inputRect.left, y: inputRect.top + inputRect.height / 2 };
      default:
        return null;
    }
    // --- סוף אזור להתאמה ---
  }

  // בדיקת תאימות בין שני סוגי חיבורים
  function areConnectionsCompatible(sourceType, targetType) {
    return (sourceType === CONNECTION_CONFIG.CONNECTION_TYPE_NEXT && targetType === CONNECTION_CONFIG.CONNECTION_TYPE_PREVIOUS) ||
           (sourceType === CONNECTION_CONFIG.CONNECTION_TYPE_PREVIOUS && targetType === CONNECTION_CONFIG.CONNECTION_TYPE_NEXT) ||
           (sourceType === CONNECTION_CONFIG.CONNECTION_TYPE_OUTPUT && targetType === CONNECTION_CONFIG.CONNECTION_TYPE_INPUT) ||
           (sourceType === CONNECTION_CONFIG.CONNECTION_TYPE_INPUT && targetType === CONNECTION_CONFIG.CONNECTION_TYPE_OUTPUT);
  }

  // חישוב מרחק בין שתי נקודות
  function calculateDistance(point1, point2) {
    if (!point1 || !point2) return Infinity;
    return Math.hypot(point1.x - point2.x, point1.y - point2.y);
  }

  /**
   * מוצא את החיבור הפוטנציאלי הטוב ביותר (הקרוב ביותר) עבור קבוצת בלוקים שנגררה.
   * @param {Array<HTMLElement>} draggedGroupBlocks - מערך הבלוקים בקבוצה הנגררת.
   * @returns {object|null} - אובייקט המכיל את פרטי החיבור הטוב ביותר, או null אם לא נמצא.
   *   פורמט האובייקט: {
   *     sourceBlock: HTMLElement,      // הבלוק מהקבוצה הנגררת
   *     targetBlock: HTMLElement,      // הבלוק שאליו מתחברים
   *     sourceType: string,          // סוג החיבור בבלוק המקור
   *     targetType: string,          // סוג החיבור בבלוק היעד
   *     sourceCoords: {x, y},        // קואורדינטות נק' החיבור במקור
   *     targetCoords: {x, y},        // קואורדינטות נק' החיבור ביעד
   *     distance: number             // המרחק ביניהם
   *   }
   */
  function findBestConnectionForGroup(draggedGroupBlocks) {
    let bestConnection = null;
    let minDistance = CONNECTION_CONFIG.SNAP_RADIUS;

    const programArea = getProgrammingArea();
    if (!programArea) return null;

    const allBlocks = Array.from(programArea.querySelectorAll('.block-container')); // שנה בהתאם לקלאס של הבלוקים שלך
    const draggedGroupIds = new Set(draggedGroupBlocks.map(b => b.id));

    // עבור על כל בלוק בקבוצה הנגררת
    for (const sourceBlock of draggedGroupBlocks) {
      // מצא את כל נקודות החיבור האפשריות בבלוק המקור
      // (התאם לרשימת החיבורים הרלוונטית שלך)
      const sourceConnectionTypes = [
        CONNECTION_CONFIG.CONNECTION_TYPE_NEXT,
        CONNECTION_CONFIG.CONNECTION_TYPE_PREVIOUS,
        CONNECTION_CONFIG.CONNECTION_TYPE_OUTPUT,
        // CONNECTION_CONFIG.CONNECTION_TYPE_INPUT // לרוב קלט לא "מחפש" חיבור באופן אקטיבי
      ];

      for (const sourceType of sourceConnectionTypes) {
        const sourceCoords = getConnectionPointCoords(sourceBlock, sourceType);
        if (!sourceCoords) continue;

        // עבור על כל הבלוקים האחרים באזור העבודה
        for (const targetBlock of allBlocks) {
          // דלג על בלוקים שהם חלק מהקבוצה הנגררת
          if (draggedGroupIds.has(targetBlock.id)) continue;

          // מצא את כל נקודות החיבור האפשריות בבלוק היעד
           // (התאם לרשימת החיבורים הרלוונטית שלך)
          const targetConnectionTypes = [
            CONNECTION_CONFIG.CONNECTION_TYPE_PREVIOUS,
            CONNECTION_CONFIG.CONNECTION_TYPE_NEXT,
            CONNECTION_CONFIG.CONNECTION_TYPE_INPUT,
            // CONNECTION_CONFIG.CONNECTION_TYPE_OUTPUT // לרוב פלט לא "מחפש" חיבור
          ];

          for (const targetType of targetConnectionTypes) {
            // בדוק תאימות ראשונית
            if (!areConnectionsCompatible(sourceType, targetType)) continue;

            const targetCoords = getConnectionPointCoords(targetBlock, targetType);
            if (!targetCoords) continue;

            // חשב מרחק
            const distance = calculateDistance(sourceCoords, targetCoords);

            // בדוק אם זה החיבור הקרוב ביותר שנמצא עד כה ובטווח
            if (distance < minDistance) {
              minDistance = distance;
              bestConnection = {
                sourceBlock,
                targetBlock,
                sourceType,
                targetType,
                sourceCoords,
                targetCoords,
                distance
              };
              log(`חיבור פוטנציאלי נמצא: ${sourceBlock.id}(${sourceType}) -> ${targetBlock.id}(${targetType}), מרחק: ${distance.toFixed(1)}`);
            }
          } // end loop target types
        } // end loop target blocks
      } // end loop source types
    } // end loop source blocks

    if (bestConnection) {
        log(`החיבור הטוב ביותר שנמצא: ${bestConnection.sourceBlock.id}(${bestConnection.sourceType}) -> ${bestConnection.targetBlock.id}(${bestConnection.targetType})`);
    } else {
        log('לא נמצא חיבור פוטנציאלי בטווח.');
    }

    return bestConnection;
  }

  /**
   * מעדכן את מאפייני ה-DOM כדי לשקף את החיבור החדש.
   * **חשוב:** התאם את הפונקציה הזו למאפיינים שבהם אתה משתמש!
   * @param {object} connectionDetails - האובייקט שהוחזר מ-findBestConnectionForGroup.
   */
  function applyConnection(connectionDetails) {
    const { sourceBlock, targetBlock, sourceType, targetType } = connectionDetails;

    log(`יישום חיבור: ${sourceBlock.id}(${sourceType}) ל-${targetBlock.id}(${targetType})`);

    // --- התאם את עדכון המאפיינים לשיטה שלך ---
    // דוגמאות:

    // נתק חיבורים קודמים אם קיימים (חשוב!)
    // (צריך לוגיקה מפורטת יותר לדעת *איזה* חיבור לנתק)
    // לדוגמה, אם מחברים next, נתק את ה-next הקודם של sourceBlock
    // ואת ה-previous הקודם של targetBlock.

    if (sourceType === CONNECTION_CONFIG.CONNECTION_TYPE_NEXT && targetType === CONNECTION_CONFIG.CONNECTION_TYPE_PREVIOUS) {
      sourceBlock.setAttribute('data-connected-next', targetBlock.id); // מאפיין לדוגמה
      targetBlock.setAttribute('data-connected-previous', sourceBlock.id); // מאפיין לדוגמה
      // הסר חיבורים אופקיים אם היו קיימים בנקודה זו? תלוי בלוגיקה שלך
      sourceBlock.removeAttribute('data-connected-to');
    } else if (sourceType === CONNECTION_CONFIG.CONNECTION_TYPE_PREVIOUS && targetType === CONNECTION_CONFIG.CONNECTION_TYPE_NEXT) {
       sourceBlock.setAttribute('data-connected-previous', targetBlock.id);
       targetBlock.setAttribute('data-connected-next', sourceBlock.id);
       // וכו'
    } else if (sourceType === CONNECTION_CONFIG.CONNECTION_TYPE_OUTPUT && targetType === CONNECTION_CONFIG.CONNECTION_TYPE_INPUT) {
       // כאן אפשר להשתמש במאפיין הקיים שלך מהגרירה, או משהו ספציפי יותר
       targetBlock.setAttribute('data-connected-from-output', sourceBlock.id); // דוגמה
       sourceBlock.setAttribute('data-connected-to-input', targetBlock.id); // דוגמה
       // אם אתה משתמש ב-data-connected-to הכללי:
       // sourceBlock.setAttribute('data-connected-to', targetBlock.id);
       // targetBlock.setAttribute('data-connected-from-left', sourceBlock.id); // אם רלוונטי
       // הסר חיבורי next/previous אם היו קיימים?
       sourceBlock.removeAttribute('data-connected-next');
       sourceBlock.removeAttribute('data-connected-previous');
    }
    // הוסף עוד מקרים לפי הצורך...

    // --- סוף אזור התאמה ---

    // הפעל מנגנונים נוספים אם צריך (כמו תיקון הרווחים מהקוד הראשון שלך)
    if (global.fixPuzzleGaps) { // בדוק אם הפונקציה קיימת גלובלית
        log('מפעיל את fixPuzzleGaps לאחר החיבור');
        setTimeout(global.fixPuzzleGaps, 50); // תן זמן קצר לדפדפן לעדכן
    }

    // הפעל סריקה מחדש של המובילים מהקוד של הגרירה (אם הפונקציה חשופה)
    // זה חשוב אם חיבור שינה את מבנה הקבוצות
     if (global.scanAndMarkLeaders) { // (תצטרך לחשוף את הפונקציה הזו מהקוד השני)
         log('מפעיל את scanAndMarkLeaders לאחר החיבור');
         setTimeout(global.scanAndMarkLeaders, 150); // תן עוד זמן קצר
     }
  }


  /**
   * פונקציה ציבורית שנקראת מהמודול של גרירת קבוצות בסוף הגרירה.
   * @param {Array<HTMLElement>} draggedGroupBlocks - מערך הבלוקים שנגררו זה עתה.
   * @param {Function} updateGroupPositionFunc - הפונקציה לעדכון מיקום הקבוצה (מהמודול השני).
   * @param {Array<object>} startPositions - המיקומים ההתחלתיים של הבלוקים בקבוצה.
   */
  function tryConnectGroupOnDrop(draggedGroupBlocks, updateGroupPositionFunc, startPositions) {
    log(`בדיקת חיבור עבור קבוצה עם ${draggedGroupBlocks.length} בלוקים`);
    if (!draggedGroupBlocks || draggedGroupBlocks.length === 0 || !updateGroupPositionFunc || !startPositions) {
      log('נתונים חסרים לבדיקת חיבור.');
      return;
    }

    const bestConnection = findBestConnectionForGroup(draggedGroupBlocks);

    if (bestConnection) {
      // חישוב ההזזה (Delta) הנדרשת כדי שהחיבור יהיה מושלם
      const deltaX = bestConnection.targetCoords.x - bestConnection.sourceCoords.x;
      const deltaY = bestConnection.targetCoords.y - bestConnection.sourceCoords.y;

      log(`חישוב הזזה לחיבור: dx=${deltaX.toFixed(1)}, dy=${deltaY.toFixed(1)}`);

      // מציאת המיקום ההתחלתי של הבלוק הספציפי שהתחבר
      const sourceBlockStartPos = startPositions.find(p => p.id === bestConnection.sourceBlock.id);
      if (!sourceBlockStartPos) {
          console.error("לא נמצא מיקום התחלתי עבור בלוק המקור!");
          return;
      }

      // המיקום *הנוכחי* התיאורטי של נקודת החיבור במקור (לפני ההזזה)
      // (מחושב מהמיקום ההתחלתי + ההזזה הכללית של הגרירה עד כה)
      // קשה לחשב במדויק כאן בלי לדעת את ההזזה הסופית של הגרירה.
      // במקום זאת, נחשב את ההזזה ה*נוספת* הדרושה ממיקום ה-drop הנוכחי.

      // השג את המיקום הנוכחי של הבלוק המקור (לאחר ה-drop, לפני ה-snap)
      const currentRect = bestConnection.sourceBlock.getBoundingClientRect();
      const currentSourceCoords = getConnectionPointCoords(bestConnection.sourceBlock, bestConnection.sourceType);

      if (!currentSourceCoords) {
          console.error("לא ניתן לחשב קואורדינטות נוכחיות של נקודת המקור!");
          return;
      }


      // ההפרש הנדרש הוא בין המיקום הרצוי (targetCoords) למיקום הנוכחי (currentSourceCoords)
      const finalDeltaX = bestConnection.targetCoords.x - currentSourceCoords.x;
      const finalDeltaY = bestConnection.targetCoords.y - currentSourceCoords.y;


      log(`הזזה סופית נדרשת (Snap): dx=${finalDeltaX.toFixed(1)}, dy=${finalDeltaY.toFixed(1)}`);

      // הזז את *כל* הקבוצה בהתאם להפרש הזה
      // עדכן את המיקום הסופי של כל הבלוקים בקבוצה
      const programArea = getProgrammingArea();
      if (!programArea) return;
      const areaRect = programArea.getBoundingClientRect();

      for (const block of draggedGroupBlocks) {
           const blockRect = block.getBoundingClientRect();
           // חשב את המיקום הנוכחי יחסית לאזור העבודה
           const currentLeft = blockRect.left - areaRect.left + programArea.scrollLeft;
           const currentTop = blockRect.top - areaRect.top + programArea.scrollTop;

           // חשב מיקום חדש עם ההזזה של ה-Snap
           const newLeft = currentLeft + finalDeltaX;
           const newTop = currentTop + finalDeltaY;

           // עדכן מיקום
           block.style.position = 'absolute';
           block.style.left = `${Math.round(newLeft)}px`;
           block.style.top = `${Math.round(newTop)}px`;
           block.style.margin = '0'; // ודא שאין margin שמפריע
      }


      // לאחר שהקבוצה הוזזה למיקום הסופי, עדכן את מאפייני החיבור
      applyConnection(bestConnection);

    } else {
      // לא נמצא חיבור, אין צורך לעשות כלום (הקבוצה נשארת איפה שהיא שוחררה)
      log('אין צורך ב-Snap.');
    }
  }

  // === חשיפת הפונקציה הציבורית ===
  // ניצור אובייקט גלובלי כדי שהמודול השני יוכל לקרוא לו
  global.GroupConnection = {
    tryConnectGroupOnDrop: tryConnectGroupOnDrop,
    // אפשר לחשוף פונקציות נוספות אם צריך
    _getConnectionPointCoords: getConnectionPointCoords, // לחשיפה לצורך בדיקה/התאמה
    _applyConnection: applyConnection // לחשיפה לצורך בדיקה/התאמה
  };

  log('מודול חיבור קבוצות אותחל.');

})(window); // חשוף לאובייקט ה-window הגלובלי
