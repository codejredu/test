// --- GROUP-CONNECT.JS (גישה עצמאית) ---
// מטרתו לזהות אפשרות לחיבור קבוצות ולהוציא אותו לפועל.
// מניח שקוד אחר מטפל בהזזה הפיזית של הבלוק/קבוצה הנגררת.

(function() {
  'use strict';

  const CONFIG = {
    CONNECT_THRESHOLD: 40,       // מרחק מרבי לזיהוי קרבה (בפיקסלים)
    VERTICAL_OVERLAP_REQ: 0.4,  // אחוז חפיפה אנכית מינימלי נדרש (40%)
    DEBUG: true,                // הפעלת הודעות דיבאג בקונסול
    // קלאסים להדגשות:
    HIGHLIGHT_SOURCE_GROUP_EDGE: 'gc-highlight-source-edge', // לבלוק בקצה הקבוצה הנגררת
    HIGHLIGHT_TARGET_GROUP_EDGE: 'gc-highlight-target-edge', // לבלוק בקצה קבוצת היעד
    HIGHLIGHT_CONNECTION_POINT: 'gc-highlight-connection-point' // להדגשת נקודת חיבור ספציפית
  };

  // === משתנים גלובליים במודול ===
  let isDragRelevantForGroupConnect = false; // האם הגרירה הנוכחית נבדקת לחיבור קבוצתי
  let currentDraggedBlockElement = null;     // הבלוק שהמשתמש לחץ עליו והתחיל לגרור
  let draggedGroupInfo = {                 // מידע על הקבוצה הנגררת
    blocks: [],                           // מערך של כל הבלוקים בקבוצה
    leftmostBlock: null,                  // הבלוק השמאלי ביותר בקבוצה
    rightmostBlock: null                  // הבלוק הימני ביותר בקבוצה
  };
  let potentialGroupSnapInfo = null;       // פרטי חיבור קבוצתי פוטנציאלי שזוהה

  function log(message, data) {
    if (CONFIG.DEBUG) {
      const prefix = '[GroupConnect]';
      if (data !== undefined) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
    }
  }

  // === שכפול/התאמת לוגיקות חיוניות ===

  /**
   * מאתר את כל הבלוקים המחוברים לבלוק התחלתי נתון.
   * הלוגיקה מנסה לחקות את אופן פעולת זיהוי קבוצה על בסיס data-attributes.
   */
  function findConnectedBlocksRecursively(startBlock, allBlocksInDOM) {
    if (!startBlock || !startBlock.id) return [];

    const group = new Set();
    const queue = [startBlock];
    group.add(startBlock);

    while (queue.length > 0) {
      const current = queue.shift();

      // 1. בדוק חיבור ימינה (current מחובר לבלוק מימינו)
      const connectedToId = current.getAttribute('data-connected-to');
      if (connectedToId) {
        const rightBlock = document.getElementById(connectedToId);
        if (rightBlock && !group.has(rightBlock)) {
          group.add(rightBlock);
          queue.push(rightBlock);
        }
      }

      // 2. בדוק חיבור שמאלה (current מחובר לבלוק משמאלו)
      //    כלומר, בלוק אחר ש-data-connected-to שלו הוא current.id
      //    או, אם יש data-connected-from-right על current
      const connectedFromRightId = current.getAttribute('data-connected-from-right');
      if (connectedFromRightId) {
         const leftBlock = document.getElementById(connectedFromRightId);
         if (leftBlock && !leftBlock.hasAttribute('data-connected-to') && !group.has(leftBlock)) { // תוספת בדיקה למניעת לולאה אם שני הצדדים מלאים
            // לא בטוח שהבדיקה הזו נכונה כאן, זה עלול למנוע זיהוי קבוצה שלמה
         }
         if (leftBlock && !group.has(leftBlock)) {
            group.add(leftBlock);
            queue.push(leftBlock);
         }
      }
      
      // אם אין data-connected-from-right, נסרוק את כל הבלוקים האחרים (פחות יעיל)
      // כרגע נניח ש-data-connected-from-right קיים ומתעדכן כראוי על ידי linkageimproved.js
      // או שנצטרך לממש את הסריקה המלאה.
      // בנוסף, linkageimproved.js עשוי להשתמש גם ב-data-connected-from-left על הבלוק הימני.
      // כלומר, אם B מחובר משמאל ל-A (A --- B), אז ל-A יש data-connected-to="B", ול-B יש data-connected-from-left="A"
      const connectedFromLeftOnOtherBlockId = current.getAttribute('data-connected-from-left'); // זה לא הגיוני על current, זה על הבלוק *השני*
                                                                                                // מה שחשוב זה מה ש-current מצביע אליו, או מי שמצביע אל current
    }
    // לוגיקה יותר חזקה (בדומה ל-linkage-group-drag-simplified.js):
    // נאתחל מחדש את הלוגיקה הזו להיות יותר פשוטה ומבוססת על מעבר דו-כיווני:
    const finalGroup = new Set();
    const processingQueue = [startBlock];
    finalGroup.add(startBlock);

    while(processingQueue.length > 0) {
        const currentBlock = processingQueue.shift();

        // בדוק ימינה
        const rightNeighborId = currentBlock.getAttribute('data-connected-to');
        if (rightNeighborId) {
            const rightNeighbor = document.getElementById(rightNeighborId);
            if (rightNeighbor && !finalGroup.has(rightNeighbor)) {
                finalGroup.add(rightNeighbor);
                processingQueue.push(rightNeighbor);
            }
        }
        // בדוק שמאלה (מי מחובר אל הצד השמאלי של currentBlock)
        // זה מתבטא בכך שבלוק אחר (leftNeighbor) יכיל data-connected-to="currentBlock.id"
        // וגם על currentBlock יהיה data-connected-from-left="leftNeighbor.id"
        const leftNeighborId = currentBlock.getAttribute('data-connected-from-left');
         if (leftNeighborId) {
            const leftNeighbor = document.getElementById(leftNeighborId);
             if (leftNeighbor && !finalGroup.has(leftNeighbor)) {
                finalGroup.add(leftNeighbor);
                processingQueue.push(leftNeighbor);
            }
        }
        // הבדיקה ב-linkage-group-drag-simplified נראית יותר נכונה לחיפוש דו-כיווני:
        // היא בודקת את data-connected-to של current, ואז את כל הבלוקים שמצביעים על current.
        // בשביל לפשט כאן, נניח ש-data-connected-from-left ו-data-connected-from-right
        // מעודכנים כראוי על ידי linkageimproved.js.
        const alsoConnectedFromRight = currentBlock.getAttribute('data-connected-from-right');
        if(alsoConnectedFromRight){
             const blockToLeft = document.getElementById(alsoConnectedFromRight);
             if (blockToLeft && !finalGroup.has(blockToLeft)) {
                finalGroup.add(blockToLeft);
                processingQueue.push(blockToLeft);
            }
        }

    }
    return Array.from(finalGroup);
  }


  function getGroupEdgeBlocks(groupBlocksArray) {
    if (!groupBlocksArray || groupBlocksArray.length === 0) {
      return { leftmostBlock: null, rightmostBlock: null };
    }
    let leftmost = groupBlocksArray[0];
    let rightmost = groupBlocksArray[0];
    for (let i = 1; i < groupBlocksArray.length; i++) {
      if (groupBlocksArray[i].getBoundingClientRect().left < leftmost.getBoundingClientRect().left) {
        leftmost = groupBlocksArray[i];
      }
      if (groupBlocksArray[i].getBoundingClientRect().right > rightmost.getBoundingClientRect().right) {
        rightmost = groupBlocksArray[i];
      }
    }
    return { leftmostBlock: leftmost, rightmostBlock: rightmost };
  }

  /**
   * מנסה למצוא את אלמנטי ה-DOM של נקודות החיבור ש-linkageimproved.js אמור היה ליצור.
   */
  function findVisualConnectionPoints(blockEl) {
    // ההנחה היא ש-linkageimproved יוצר <div class="connection-point left"> וכו'.
    const leftPoint = blockEl.querySelector('.connection-point.left');
    const rightPoint = blockEl.querySelector('.connection-point.right');
    return { leftPoint, rightPoint };
  }

  function applyHighlightToConnectionPoint(pointElement, shouldHighlight) {
    if (pointElement) {
      if (shouldHighlight) {
        pointElement.classList.add(CONFIG.HIGHLIGHT_CONNECTION_POINT);
      } else {
        pointElement.classList.remove(CONFIG.HIGHLIGHT_CONNECTION_POINT);
      }
    }
  }
  
  function clearAllGroupConnectHighlights() {
    document.querySelectorAll(`.${CONFIG.HIGHLIGHT_SOURCE_GROUP_EDGE}, .${CONFIG.HIGHLIGHT_TARGET_GROUP_EDGE}`)
      .forEach(el => {
        el.classList.remove(CONFIG.HIGHLIGHT_SOURCE_GROUP_EDGE);
        el.classList.remove(CONFIG.HIGHLIGHT_TARGET_GROUP_EDGE);
      });
    document.querySelectorAll(`.${CONFIG.HIGHLIGHT_CONNECTION_POINT}`)
      .forEach(el => el.classList.remove(CONFIG.HIGHLIGHT_CONNECTION_POINT));
    log('ניקוי כל הדגשות החיבור הקבוצתי.');
  }

  /**
   * בודק קרבה בין שני מלבנים (למשל, של בלוקים).
   * sourceSide ו-targetSide מציינים איזה צד של המלבן משתתף בבדיקה ('left' או 'right').
   */
  function checkProximity(sourceRect, targetRect, sourceSide, targetSide) {
    // 1. בדיקת חפיפה אנכית מינימלית
    const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));
    const minHeightForOverlap = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;
    if (verticalOverlap < minHeightForOverlap) {
      return false;
    }

    // 2. בדיקת מרחק אופקי
    let horizontalDistance;
    if (sourceSide === 'right' && targetSide === 'left') {
      horizontalDistance = Math.abs(targetRect.left - sourceRect.right);
    } else if (sourceSide === 'left' && targetSide === 'right') {
      horizontalDistance = Math.abs(sourceRect.left - targetRect.right);
    } else {
      return false; // צירוף צדדים לא נתמך
    }

    return horizontalDistance < CONFIG.CONNECT_THRESHOLD;
  }

  function evaluatePotentialGroupSnaps() {
    if (!isDragRelevantForGroupConnect || !currentDraggedBlockElement) return;

    // עדכון מידע על הקבוצה הנגררת (מיקומה עשוי להשתנות ע"י הקוד האחר)
    const currentGroupBlocks = findConnectedBlocksRecursively(currentDraggedBlockElement);
    const { leftmostBlock, rightmostBlock } = getGroupEdgeBlocks(currentGroupBlocks);
    
    draggedGroupInfo = { // עדכון המידע הגלובלי במודול
        blocks: currentGroupBlocks,
        leftmostBlock: leftmostBlock,
        rightmostBlock: rightmostBlock
    };

    if (!leftmostBlock || !rightmostBlock) {
      clearAllGroupConnectHighlights();
      potentialGroupSnapInfo = null;
      return;
    }

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    potentialGroupSnapInfo = null; // איפוס לפני כל בדיקה
    // אין לנקות הדגשות כאן, רק אם אין שום התאמה בסוף הלולאה

    const allPossibleTargets = Array.from(programmingArea.querySelectorAll('.block-container'))
      .filter(block => !draggedGroupInfo.blocks.some(draggedBlock => draggedBlock.id === block.id) && block.offsetParent !== null);

    let bestSnapFound = null;

    for (const targetCandidateElement of allPossibleTargets) {
      const targetGroupBlocks = findConnectedBlocksRecursively(targetCandidateElement);
      const { leftmostBlock: targetLeftmost, rightmostBlock: targetRightmost } = getGroupEdgeBlocks(targetGroupBlocks.length > 0 ? targetGroupBlocks : [targetCandidateElement]);

      // תרחיש 1: חיבור הצד הימני של הקבוצה הנגררת לצד השמאלי של קבוצת/בלוק יעד
      if (rightmostBlock && !rightmostBlock.hasAttribute('data-connected-to') && targetLeftmost && !targetLeftmost.hasAttribute('data-connected-from-left')) {
        if (checkProximity(rightmostBlock.getBoundingClientRect(), targetLeftmost.getBoundingClientRect(), 'right', 'left')) {
          bestSnapFound = {
            sourceDragConnectingBlock: rightmostBlock, // הבלוק בקצה הקבוצה הנגררת
            targetStaticConnectingBlock: targetLeftmost, // הבלוק בקצה קבוצת היעד
            sourceDragSide: 'right',
            targetStaticSide: 'left',
            entireDraggedGroupArray: draggedGroupInfo.blocks
          };
          break; // מצאנו התאמה, הפסק לחפש (אפשר לשכלל למצוא את "הכי טובה")
        }
      }

      // תרחיש 2: חיבור הצד השמאלי של הקבוצה הנגררת לצד הימני של קבוצת/בלוק יעד
      if (leftmostBlock && !leftmostBlock.hasAttribute('data-connected-from-right') && targetRightmost && !targetRightmost.hasAttribute('data-connected-from-right')) { // נראה ש-data-connected-from-right הוא הנכון לבלוק ימני שמחובר למשהו משמאלו
        if (checkProximity(leftmostBlock.getBoundingClientRect(), targetRightmost.getBoundingClientRect(), 'left', 'right')) {
          bestSnapFound = {
            sourceDragConnectingBlock: leftmostBlock,
            targetStaticConnectingBlock: targetRightmost,
            sourceDragSide: 'left',
            targetStaticSide: 'right',
            entireDraggedGroupArray: draggedGroupInfo.blocks
          };
          break;
        }
      }
    }
    
    clearAllGroupConnectHighlights(); // נקה הדגשות קודמות לפני הדגשת החדש (אם יש)
    if (bestSnapFound) {
      potentialGroupSnapInfo = bestSnapFound;
      log('זוהה חיבור קבוצתי פוטנציאלי:', potentialGroupSnapInfo);
      
      // הדגשת הבלוקים והנקודות
      potentialGroupSnapInfo.sourceDragConnectingBlock.classList.add(CONFIG.HIGHLIGHT_SOURCE_GROUP_EDGE);
      potentialGroupSnapInfo.targetStaticConnectingBlock.classList.add(CONFIG.HIGHLIGHT_TARGET_GROUP_EDGE);

      const sourcePoints = findVisualConnectionPoints(potentialGroupSnapInfo.sourceDragConnectingBlock);
      const targetPoints = findVisualConnectionPoints(potentialGroupSnapInfo.targetStaticConnectingBlock);

      if (potentialGroupSnapInfo.sourceDragSide === 'right') {
        applyHighlightToConnectionPoint(sourcePoints.rightPoint, true);
        applyHighlightToConnectionPoint(targetPoints.leftPoint, true);
      } else { // sourceDragSide === 'left'
        applyHighlightToConnectionPoint(sourcePoints.leftPoint, true);
        applyHighlightToConnectionPoint(targetPoints.rightPoint, true);
      }
    }
  }

  /**
   * מבצע את החיבור הקבוצתי בפועל.
   * כולל עדכון data-attributes והתאמת מיקום הקבוצה הנגררת.
   */
  function executeActualGroupSnap() {
    if (!potentialGroupSnapInfo) {
      log('אין חיבור קבוצתי לביצוע.');
      return false;
    }

    const {
      sourceDragConnectingBlock,
      targetStaticConnectingBlock,
      sourceDragSide,
      entireDraggedGroupArray
    } = potentialGroupSnapInfo;

    log('מבצע חיבור קבוצתי:', potentialGroupSnapInfo);

    // 1. ניקוי חיבורים קודמים (אם היו) בבלוקים המעורבים בצד החיבור
    // זהירות: חלק זה עלול להיות מורכב ודורש הבנה מדויקת של איך linkageimproved מנהל את זה.
    // ננסה להיות מינימליים כדי לא לשבור דברים.
    if (sourceDragSide === 'right') {
      const oldConnectedTo = sourceDragConnectingBlock.getAttribute('data-connected-to');
      if (oldConnectedTo) document.getElementById(oldConnectedTo)?.removeAttribute('data-connected-from-left');
      sourceDragConnectingBlock.removeAttribute('data-connected-to');
    } else { // sourceDragSide === 'left'
      const oldConnectedFromRight = sourceDragConnectingBlock.getAttribute('data-connected-from-right');
      if (oldConnectedFromRight) document.getElementById(oldConnectedFromRight)?.removeAttribute('data-connected-to'); // ההנחה היא שהשני היה מחובר אליו מימין
      sourceDragConnectingBlock.removeAttribute('data-connected-from-right');
    }
    // (בדיעבד, אולי לא צריך לנקות את היעד, כי הוא סטטי. החיבור החדש אמור לדרוס)

    // 2. יצירת החיבור החדש (עדכון data-attributes)
    if (sourceDragSide === 'right') { // הבלוק הנגרר מתחבר עם צדו הימני => הוא יהיה משמאל ליעד
      sourceDragConnectingBlock.setAttribute('data-connected-to', targetStaticConnectingBlock.id);
      targetStaticConnectingBlock.setAttribute('data-connected-from-left', sourceDragConnectingBlock.id);
    } else { // sourceDragSide === 'left' // הבלוק הנגרר מתחבר עם צדו השמאלי => הוא יהיה מימין ליעד
      sourceDragConnectingBlock.setAttribute('data-connected-from-right', targetStaticConnectingBlock.id); // שונה ממה שחשבתי קודם - זה נראה יותר נכון
      targetStaticConnectingBlock.setAttribute('data-connected-to', sourceDragConnectingBlock.id);      // אם linkageimproved מצפה לזה כך
    }

    // 3. התאמת מיקום של כל הקבוצה הנגררת
    const sourceRectBeforeAlignment = sourceDragConnectingBlock.getBoundingClientRect();
    const targetRect = targetStaticConnectingBlock.getBoundingClientRect();
    let newSourceX, newSourceY;

    if (sourceDragSide === 'right') { // הבלוק הנגרר צריך להיות משמאל ליעד
      newSourceX = targetRect.left - sourceDragConnectingBlock.offsetWidth; // - רווח אם יש
    } else { // הבלอก הנגרר צריך להיות מימין ליעד
      newSourceX = targetRect.right; // + רווח אם יש
    }
    // יישור אנכי פשוט: קצה עליון לקצה עליון
    newSourceY = targetRect.top;

    const deltaX = newSourceX - sourceRectBeforeAlignment.left;
    const deltaY = newSourceY - sourceRectBeforeAlignment.top;

    entireDraggedGroupArray.forEach(memberBlock => {
      const currentLeft = parseFloat(memberBlock.style.left || 0);
      const currentTop = parseFloat(memberBlock.style.top || 0);
      memberBlock.style.left = `${currentLeft + deltaX}px`;
      memberBlock.style.top = `${currentTop + deltaY}px`;
    });

    log(`הקבוצה הנגררת הוזזה (${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px) לחיבור.`);

    // 4. ניקוי סופי
    clearAllGroupConnectHighlights();
    potentialGroupSnapInfo = null;

    // השמעת צליל - לא אפשרי ישירות ללא API.
    // עדכון מנהיגי קבוצות - אם linkage-group-drag-simplified.js מאזין לשינויי attributes,
    // הוא עשוי לעשות זאת אוטומטית.

    return true;
  }

  // === מאזיני אירועים גלובליים ===
  function onMouseDown(event) {
    const target = event.target.closest('.block-container');
    if (!target) {
      isDragRelevantForGroupConnect = false;
      return;
    }

    // נניח שהגרירה רלוונטית אם לוחצים על בלוק כלשהו באזור התכנות.
    // הקוד האחר יטפל בהזזה. אנחנו רק נעקוב.
    currentDraggedBlockElement = target;
    isDragRelevantForGroupConnect = true;
    potentialGroupSnapInfo = null; // איפוס

    // הוספת קלאס זמני לבלוקים הנגררים (אם זוהו כקבוצה)
    // כדי ש-evaluatePotentialGroupSnaps יוכל להתעלם מהם כיעדים.
    // (הבדיקה הפנימית ב-evaluate אמורה גם היא לכסות זאת)
    const group = findConnectedBlocksRecursively(currentDraggedBlockElement);
    group.forEach(b => b.classList.add('gc-is-dragged-member'));


    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    log('MouseDown זוהה, מעקב אחר גרירה לחיבור קבוצתי:', currentDraggedBlockElement.id);
  }

  function onMouseMove(event) {
    if (!isDragRelevantForGroupConnect || !currentDraggedBlockElement) return;

    // ההנחה היא שהקוד האחר (linkageimproved/linkage-group-drag) מזיז את הבלוק/קבוצה.
    // אנחנו רק צריכים לבדוק אפשרויות חיבור על סמך המיקום המעודכן.
    evaluatePotentialGroupSnaps();
    event.preventDefault(); // למניעת התנהגויות ברירת מחדל של גרירה כמו בחירת טקסט
  }

  function onMouseUp(event) {
    if (!isDragRelevantForGroupConnect) return;
    
    const group = findConnectedBlocksRecursively(currentDraggedBlockElement); // קבל את הגרסה העדכנית ביותר
    group.forEach(b => b.classList.remove('gc-is-dragged-member'));

    if (potentialGroupSnapInfo) {
      const snapSuccess = executeActualGroupSnap();
      if (snapSuccess) {
        log('חיבור קבוצתי בוצע בהצלחה.');
        // כאן הבעיה: מה אם linkageimproved.js גם מנסה לבצע חיבור?
        // אם שינינו את מאפייני ה-data- כראוי, ייתכן שהחיבור שלו "ייכשל" או לא יהיה רלוונטי.
        // אסטרטגיה אפשרית (מורכבת): להמתין רגע עם setTimeout(0), לבדוק את מאפייני ה-data-
        // של הבלוקים המעורבים, ואם linkageimproved.js דרס אותם, לנסות לתקן.
        // כרגע, נסתמך על כך שהשינויים שלנו יהיו הקובעים.
      }
    } else {
      clearAllGroupConnectHighlights(); // אם לא היה חיבור, רק נקה הדגשות שלנו
    }

    isDragRelevantForGroupConnect = false;
    currentDraggedBlockElement = null;
    potentialGroupSnapInfo = null;
    draggedGroupInfo = { blocks: [], leftmostBlock: null, rightmostBlock: null };

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    log('MouseUp, סיום טיפול בחיבור קבוצתי.');
  }

  // === אתחול המודול ===
  function init() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('[GroupConnect] אלמנט #program-blocks לא נמצא. המודול לא יאותחל.');
      return;
    }

    // הוספת מאזין mousedown לאזור הכללי של הבלוקים.
    // חשוב: סדר הפעלת מאזיני mousedown מרובים על אותו אלמנט אינו מובטח תמיד,
    // אך בדרך כלל הוא לפי סדר ההוספה. אם linkageimproved.js מוסיף את שלו קודם,
    // הוא עשוי להתחיל לטפל בגרירה לפנינו. זה בסדר, כי אנחנו לא מזיזים את הבלוק, רק עוקבים.
    programmingArea.addEventListener('mousedown', onMouseDown, false); // false = bubbling phase

    // הוספת סגנונות CSS דינמיים להדגשות
    const styleId = 'group-connect-styles';
    if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      styleSheet.textContent = `
        .${CONFIG.HIGHLIGHT_SOURCE_GROUP_EDGE}, .${CONFIG.HIGHLIGHT_TARGET_GROUP_EDGE} {
          /* אפשר להוסיף כאן סגנון לכל הבלוק, למשל outline, אבל זה עלול להתנגש */
        }
        .connection-point.${CONFIG.HIGHLIGHT_CONNECTION_POINT} {
          background-color: #FFEB3B !important; /* צהוב בהיר, דריסה חזקה */
          border: 2px solid #FFC107 !important; /* כתום-זהב */
          transform: scale(1.6) !important;
          opacity: 1 !important;
          z-index: 10001 !important; /* ודא שהוא מעל נקודות רגילות */
          border-radius: 50%;
        }
        .gc-is-dragged-member {
          /* אופציונלי: סגנון לבלוקים בזמן שהם חלק מקבוצה נגררת הנבדקת לחיבור */
          /* לדוגמה: opacity: 0.9; */
        }
      `;
      document.head.appendChild(styleSheet);
    }

    log('מודול GroupConnect (גישה עצמאית) אותחל.');
  }

  // המתן לטעינת ה-DOM לפני האתחול
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init(); // אם ה-DOM כבר נטען
  }

})();
