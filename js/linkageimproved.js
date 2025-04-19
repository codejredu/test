// ========================================================================
  // הוספת סגנונות CSS - משופר לפי התמונה, הגדלת בולטות ההילה הצהובה
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* בלוק נגרר - הופכים עליון ומדגישים */
      .snap-source {
         box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
         transition: box-shadow 0.15s ease-out;
         cursor: grabbing !important;
         z-index: 1001 !important;
      }

      /* הילה צהובה סביב בלוק יעד פוטנציאלי - מודגשת יותר */
      .snap-target {
        outline: 4px solid rgb(255, 210, 0) !important; /* צהוב בולט יותר */
        outline-offset: 3px;
        box-shadow: 0 0 18px 6px rgba(255, 210, 0, 0.7) !important;
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important; /* חשוב שיהיה מתחת לנגרר */
      }

      /* מלבן כחול מקווקו לציון מיקום עתידי - יותר בולט */
      .future-position-indicator {
        position: absolute; 
        border: 3px dashed rgba(0, 136, 255, 0.95);
        border-radius: 5px; 
        background-color: rgba(0, 136, 255, 0.1);
        pointer-events: none; 
        z-index: 998; 
        opacity: 0;
        transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear;
        display: none;
      }
      .future-position-indicator[style*="display: block"] { 
        opacity: 0.85; 
      }

      /* סימון כיוון (פס צהוב בצד ימין/שמאל) - יותר בולט */
      .snap-left::before {
        content: ''; 
        position: absolute; 
        left: -6px; 
        top: 15%; 
        bottom: 15%; 
        width: 5px;
        background-color: rgba(255, 210, 0, 0.95); 
        border-radius: 2px; 
        z-index: 1000;
        box-shadow: 0 0 8px 2px rgba(255, 210, 0, 0.7); 
        transition: all 0.1s ease-out;
      }
      .snap-right::after {
        content: ''; 
        position: absolute; 
        right: -6px; 
        top: 15%; 
        bottom: 15%; 
        width: 5px;
        background-color: rgba(255, 210, 0, 0.95); 
        border-radius: 2px; 
        z-index: 1000;
        box-shadow: 0 0 8px 2px rgba(255, 210, 0, 0.7); 
        transition: all 0.1s ease-out;
      }

      /* אנימציות משופרות */
      @keyframes snapEffect { 
        0% { transform: scale(1); } 
        35% { transform: scale(1.04); } 
        70% { transform: scale(0.98); }
        100% { transform: scale(1); } 
      }
      .snap-animation { 
        animation: snapEffect 0.25s ease-out; 
      }
      
      @keyframes detachEffect { 
        0% { transform: translate(0, 0) rotate(0); } 
        30% { transform: translate(3px, 1px) rotate(0.8deg); } 
        60% { transform: translate(-2px, 2px) rotate(-0.5deg); }
        100% { transform: translate(0, 0) rotate(0); } 
      }
      .detach-animation { 
        animation: detachEffect 0.3s ease-in-out; 
      }

      /* תפריט ניתוק */
      #detach-menu { 
        position: absolute; 
        background-color: white; 
        border: 1px solid #ccc; 
        border-radius: 4px; 
        box-shadow: 0 3px 8px rgba(0,0,0,0.2); 
        z-index: 1100; 
        padding: 5px; 
        font-size: 14px; 
        min-width: 100px; 
      }
      #detach-menu div { 
        padding: 6px 12px; 
        cursor: pointer; 
        border-radius: 3px; 
      }
      #detach-menu div:hover { 
        background-color: #eee; 
      }

      /* כללי: מניעת בחירת טקסט בזמן גרירה */
      body.user-select-none { 
        user-select: none; 
        -webkit-user-select: none; 
        -moz-user-select: none; 
        -ms-user-select: none; 
      }
      
      /* בלוקים מחוברים - אופציונלי להוספת אינדיקציה חזותית */
      .connected-block {
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
      }
      .has-connected-block {
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
      }
    `;
    document.head.appendChild(style);
    console.log('Highlighting and animation styles added/verified.');
  }// --- START OF FILE linkageimproved2.js ---
// מימוש משופר - תיקון קפיצה אחורה בהצמדה וחיבור בהתאם לתמונה

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null; // 'left' (source to left of target) or 'right' (source to right of target)
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;

  // קונפיגורציה - פרמטרים מותאמים
  const CONFIG = {
    PIN_SOCKET_DEPTH: 5,       // עומק/רוחב הפין/שקע 
    CONNECT_THRESHOLD: 6,      // מרחק מקסימלי בפיקסלים לזיהוי אפשרות חיבור - שונה ל-6 בדיוק
    VERTICAL_OVERLAP_REQ: 0.5, // אחוז החפיפה האנכית הנדרש (50%)
    BLOCK_GAP: 0,              // רווח בין בלוקים מחוברים (0 = צמוד)
    DEBUG: true                // האם להציג לוגים מפורטים לדיבוג
  };

  // ========================================================================
  // אתחול המערכת
  // ========================================================================
  document.addEventListener('DOMContentLoaded', function() {
    addHighlightStyles(); // הוסף סגנונות CSS
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();
    console.log(`Block linkage system initialized (Version 2.0).`);
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
    programmingArea.addEventListener('dragover', function(e) {
      e.preventDefault(); // Allow drops from palette
    });
    
    // מנע התנהגות גרירה מובנית באזור התכנות עצמו
    // כדי למנוע התנגשויות עם הלוגיקה המותאמת שלנו
    programmingArea.addEventListener('dragstart', function(e) {
        // אם האלמנט הנגרר הוא בלוק *בתוך* אזור התכנות
        if (e.target && e.target.closest && e.target.closest('#program-blocks .block-container')) {
            console.log("Preventing default dragstart for internal block.");
            e.preventDefault();
        }
    });
  }

  // ========================================================================
  // האזנה לבלוקים חדשים
  // ========================================================================
  function observeNewBlocks() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.classList.contains('block-container') && node.closest('#program-blocks')) {
              if (!node.id) generateUniqueId(node);
              addBlockDragListeners(node);
            }
          });
        }
      });
    });
    
    observer.observe(programmingArea, { childList: true, subtree: true });
  }

  // ========================================================================
  // הוספת מאזינים לבלוקים קיימים
  // ========================================================================
  function initExistingBlocks() {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;
      
      programmingArea.querySelectorAll('.block-container').forEach(block => {
          if (!block.id) generateUniqueId(block);
          addBlockDragListeners(block);
      });
      
      console.log("Listeners added to existing blocks.");
  }

  // ========================================================================
  // הוספת מאזיני גרירה וקליק ימני לבלוק
  // ========================================================================
  function addBlockDragListeners(block) {
      block.removeEventListener('mousedown', handleMouseDown);
      block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu);
      block.addEventListener('contextmenu', handleContextMenu);
  }

  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק
  // ========================================================================
  function handleMouseDown(e) {
      if (e.button !== 0 || !e.target.closest('.block-container')) return;

      const block = e.target.closest('.block-container');
      if (!block.id) generateUniqueId(block);

      // בטל את התנהגות הגרירה המובנית של הדפדפן לאלמנט זה *מיד*
      block.draggable = false;

      console.log(`[MouseDown] Started for block: ${block.id}`);

      // ניתוק אוטומטי אם גוררים בלוק מחובר
      if (block.hasAttribute('data-connected-to')) {
          console.log(`[MouseDown] Block ${block.id} was connected, detaching...`);
          detachBlock(block, false); // נתק בלי אנימציה
      }

      currentDraggedBlock = block;
      isDraggingBlock = true;

      const rect = block.getBoundingClientRect();
      const parentElement = block.offsetParent || document.getElementById('program-blocks') || document.body;
      const parentRect = parentElement.getBoundingClientRect();

      // חשב את ההיסט בין מיקום העכבר לפינה השמאלית העליונה של הבלוק
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // הגדר מיקום אבסולוטי וסגנון
      block.style.position = 'absolute';
      // ודא שהמיקום ההתחלתי מוגדר נכון ביחס להורה
      block.style.left = (rect.left - parentRect.left + parentElement.scrollLeft) + 'px';
      block.style.top = (rect.top - parentRect.top + parentElement.scrollTop) + 'px';
      block.style.zIndex = '1001';
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none');

      console.log(`[MouseDown] Initial Style: left=${block.style.left}, top=${block.style.top}`);
      e.preventDefault(); // מנע בחירת טקסט וכו'
  }

  // ========================================================================
  // טיפול בקליק ימני על בלוק
  // ========================================================================
  function handleContextMenu(e) {
      e.preventDefault();
      const block = e.target.closest('.block-container');
      // הצג תפריט רק אם הבלוק כרגע מחובר *ל*משהו
      if (block && block.hasAttribute('data-connected-to')) {
          showDetachMenu(e.clientX, e.clientY, block);
      }
  }

  // ========================================================================
  // מאזינים גלובליים
  // ========================================================================
  function initGlobalMouseListeners() {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.addEventListener('mouseleave', handleMouseLeave);
  }

  // ========================================================================
  // טיפול בתנועת העכבר
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const parentElement = currentDraggedBlock.offsetParent || document.getElementById('program-blocks') || document.body;
    const parentRect = parentElement.getBoundingClientRect();

    // מיקום חדש יחסי לפינה השמאלית-עליונה של ה-offsetParent, כולל התחשבות בגלילה שלו
    let newLeft = e.clientX - parentRect.left - dragOffset.x + parentElement.scrollLeft;
    let newTop = e.clientY - parentRect.top - dragOffset.y + parentElement.scrollTop;

    // הגבלת גבולות (אם ההורה הוא אזור התכנות)
    if (parentElement.id === 'program-blocks') {
        const blockWidth = currentDraggedBlock.offsetWidth;
        const blockHeight = currentDraggedBlock.offsetHeight;
        // השתמש ב-scrollWidth/Height כדי לקבל את הגודל המלא כולל התוכן שנגלל החוצה
        const maxLeft = Math.max(0, parentElement.scrollWidth - blockWidth);
        const maxTop = Math.max(0, parentElement.scrollHeight - blockHeight);
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
    }

    // עדכן את מיקום הבלוק הנגרר
    currentDraggedBlock.style.left = newLeft + 'px';
    currentDraggedBlock.style.top = newTop + 'px';

    // בדוק אפשרות הצמדה בכל עדכון מיקום
    checkAndHighlightSnapPossibility();
  }

  // ========================================================================
  // טיפול בשחרור העכבר (גרסה מתוקנת)
  // ========================================================================
  function handleMouseUp(e) {
    // אם לא היינו בתהליך גרירה, אל תעשה כלום
    if (!isDraggingBlock || !currentDraggedBlock) {
      if (isDraggingBlock || currentDraggedBlock) cleanupAfterDrag(); // נקה אם המצב לא תקין
      return;
    }

    const blockReleased = currentDraggedBlock; // שמור הפניה
    const initialPosition = { 
      left: blockReleased.style.left, 
      top: blockReleased.style.top 
    };
    
    console.log(`[MouseUp] ----- Start MouseUp for ${blockReleased.id} -----`);
    console.log(`[MouseUp] Initial position: left=${initialPosition.left}, top=${initialPosition.top}`);

    // שמור את היעד והכיוון לפני הניקוי
    const targetToSnap = potentialSnapTarget;
    const directionToSnap = snapDirection;
    console.log(`[MouseUp] Snap target: ${targetToSnap?.id || 'none'}, direction: ${directionToSnap || 'none'}`);

    // אפס את משתני המצב הגלובליים (אבל השאר הפניות מקומיות)
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    isDraggingBlock = false;
    
    // הסר סגנונות ומחלקות תצוגה
    document.body.classList.remove('user-select-none');
    blockReleased.style.zIndex = '';
    blockReleased.classList.remove('snap-source');
    
    // הסר הדגשות מכל הבלוקים 
    document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
      el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    
    removeFuturePositionIndicator(); // הסר מלבן כחול
    
    // בצע הצמדה אם יש יעד ודירקציה תקפים
    if (targetToSnap && directionToSnap) {
      console.log(`[MouseUp] Performing snap operation`);
      // בצע את ההצמדה בהתאם לתמונה - שים לב לסדר הפעולות!
      performBlockSnap(blockReleased, targetToSnap, directionToSnap);
    } else {
      console.log(`[MouseUp] No snap target, keeping block at current position`);
      blockReleased.draggable = true; // אפשר גרירה מובנית מחדש
    }
    
    console.log(`[MouseUp] ----- End MouseUp -----`);
  }

  // ========================================================================
  // טיפול בעזיבת החלון
  // ========================================================================
  function handleMouseLeave(e) {
      if (isDraggingBlock && (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML')) {
          console.warn("Mouse left window during drag, treating as mouseup.");
          handleMouseUp(e);
      }
  }

  // ========================================================================
  // ניקוי אחרי גרירה - פונקציה מבוטלת, הלוגיקה הועברה לפונקציית handleMouseUp
  // ========================================================================
  function cleanupAfterDrag() {
    // פונקציה זו מבוטלת - הלוגיקה הועברה ל-handleMouseUp
    console.log("[cleanupAfterDrag] This function is deprecated and should not be called directly.");
  }

  // ========================================================================
  // ביצוע הצמדת בלוקים - גרסה סופית עם מנגנון הצמדה מהיר
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    console.log(`[performBlockSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} in direction ${direction}`);
    
    try {
      if (!sourceBlock || !targetBlock) throw new Error("Invalid block(s).");
      
      // מדידות מיקום
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const parentElement = sourceBlock.offsetParent || document.getElementById('program-blocks') || document.body;
      const parentRect = parentElement.getBoundingClientRect();
      
      // יישור אנכי - יישר לפי חלק עליון
      const newTop = targetRect.top - parentRect.top + parentElement.scrollTop;
      
      // יישור אופקי - הצמדה מדויקת מותאמת לפינים/שקעים
      let newLeft;
      if (direction === 'left') {
        // המקור משמאל ליעד - צד ימין של המקור לצד שמאל של היעד
        newLeft = targetRect.left - sourceRect.width - parentRect.left + parentElement.scrollLeft;
      } else { // direction === 'right'
        // המקור מימין ליעד - צד שמאל של המקור לצד ימין של היעד
        newLeft = targetRect.right - parentRect.left + parentElement.scrollLeft;
      }
      
      // עיגול למספרים שלמים למניעת בעיות עיגול
      newLeft = Math.round(newLeft);
      newTop = Math.round(newTop);
      
      // קביעת פוזיציה ללא עיכוב
      sourceBlock.style.left = `${newLeft}px`;
      sourceBlock.style.top = `${newTop}px`;
      
      // שמירת קשר בין הבלוקים
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);
      
      // סימון חזותי
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      
      // אנימציית הצמדה
      addSnapEffectAnimation(sourceBlock);
      
      // החזרת יכולת גרירה
      sourceBlock.draggable = true;
      
      console.log(`[performBlockSnap] Snap complete - Block positioned at left=${newLeft}px, top=${newTop}px`);
      return true;
    } catch (err) {
      console.error(`[performBlockSnap] Error:`, err);
      sourceBlock.draggable = true;
      return false;
    }
  }

  // ========================================================================
  // בדיקת הצמדה והדגשה (עם לוגים ברורים)
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const allBlocks = Array.from(programmingArea.querySelectorAll('.block-container'));
    const sourceRect = currentDraggedBlock.getBoundingClientRect();

    let bestTarget = null;
    let bestDirection = null;
    let bestDistance = Infinity;
    
    const previousPotentialTarget = potentialSnapTarget; // שמור את היעד הקודם
    potentialSnapTarget = null; // אפס את היעד הנוכחי לפני החיפוש

    // חיפוש היעד הקרוב ביותר שמתאים לתנאי ההצמדה
    for (const targetBlock of allBlocks) {
      if (targetBlock === currentDraggedBlock) continue; // אל תצמיד לעצמו
      if (!targetBlock.id) generateUniqueId(targetBlock); // ודא שיש ID

      const targetRect = targetBlock.getBoundingClientRect();
      
      // בדוק אפשרויות הצמדה וחשב מרחק
      const connectionInfo = calculateSnapInfo(sourceRect, targetRect);
      
      if (connectionInfo && connectionInfo.distance < bestDistance) {
          bestTarget = targetBlock;
          bestDirection = connectionInfo.direction;
          bestDistance = connectionInfo.distance;
      }
    }

    // --- ניהול הדגשות ---

    // 1. אם היעד החדש *שונה* מהיעד הקודם, הסר הדגשה מהקודם (אם היה)
    if (previousPotentialTarget && previousPotentialTarget !== bestTarget) {
        console.log(`[Highlight] De-highlighting PREVIOUS target: ${previousPotentialTarget.id}`);
        previousPotentialTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
    }

    // 2. אם מצאנו יעד מתאים
    if (bestTarget) {
        potentialSnapTarget = bestTarget; // עדכן את היעד הגלובלי
        snapDirection = bestDirection;    // עדכן את הכיוון הגלובלי

        // הוסף הדגשה ליעד הנוכחי (אם היא לא קיימת כבר)
        if (!bestTarget.classList.contains('snap-target')) {
            console.log(`[Highlight] Highlighting NEW target: ${bestTarget.id} (${bestDirection})`);
            bestTarget.classList.add('snap-target');
        }
        
        // עדכן את סימון הכיוון
        bestTarget.classList.remove('snap-left', 'snap-right'); // נקה כיוון קודם
        bestTarget.classList.add(bestDirection === 'left' ? 'snap-left' : 'snap-right');

        // הצג/עדכן את המלבן הכחול
        const programRect = programmingArea.getBoundingClientRect();
        updateFuturePositionIndicator(currentDraggedBlock, potentialSnapTarget, snapDirection, programRect);

    } else {
        // 3. לא נמצא יעד מתאים
        snapDirection = null; // אפס כיוון גלובלי
        removeFuturePositionIndicator(); // הסר מלבן כחול
    }
  }

  // ========================================================================
  // חישוב מידע על הצמדה אפשרית - גרסה מתוקנת מותאמת לסף 6 פיקסלים
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) {
    // בדוק חפיפה אנכית - קריטית להצמדה תקינה
    const minHeight = Math.min(sourceRect.height, targetRect.height);
    const requiredVerticalOverlap = minHeight * CONFIG.VERTICAL_OVERLAP_REQ; // החפיפה הנדרשת
    const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));

    // אם אין מספיק חפיפה אנכית, אין אפשרות הצמדה
    if (verticalOverlap < requiredVerticalOverlap) {
      return null;
    }

    // בדוק מיקום יחסי של הבלוקים - האם המקור משמאל או מימין ליעד
    const sourceCenter = sourceRect.left + sourceRect.width / 2;
    const targetCenter = targetRect.left + targetRect.width / 2;
    const isSourceLeftOfTarget = sourceCenter < targetCenter;
    
    // מדוד מרחקים בדיוק בין קצוות הבלוקים - מתאים לסף 6 פיקסלים
    let distance;
    let direction;
    
    if (isSourceLeftOfTarget) {
      // המקור משמאל ליעד - החיבור הוא ימין-שמאל
      const rightEdgeSource = sourceRect.right;
      const leftEdgeTarget = targetRect.left;
      distance = Math.abs(rightEdgeSource - leftEdgeTarget);
      direction = 'left'; // המקור משמאל ליעד
    } else {
      // המקור מימין ליעד - החיבור הוא שמאל-ימין
      const leftEdgeSource = sourceRect.left;
      const rightEdgeTarget = targetRect.right;
      distance = Math.abs(leftEdgeSource - rightEdgeTarget);
      direction = 'right'; // המקור מימין ליעד
    }
    
    // החזר מידע על הצמדה רק אם המרחק קטן או שווה לסף (6 פיקסלים)
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
      if (CONFIG.DEBUG) console.log(`[calculateSnapInfo] Found possible connection: direction=${direction}, distance=${distance.toFixed(2)}px`);
      return { direction, distance };
    }
    
    // אין אפשרות הצמדה - המרחק גדול מ-6 פיקסלים
    return null;
  }

  // ========================================================================
  // ביצוע ההצמדה הפיזית - מותאם לתמונה
  // ========================================================================
  function snapBlocks(sourceBlock, targetBlock, direction) {
    console.log(`[SnapBlocks] ----- Start Snap for ${sourceBlock.id} to ${targetBlock.id} (${direction}) -----`);
    try {
      if (!sourceBlock || !targetBlock) throw new Error("Invalid block(s).");

      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();

      // מציאת ההורה למיקום יחסי
      const parentElement = sourceBlock.offsetParent || document.getElementById('program-blocks');
      if (!parentElement) throw new Error("Cannot find offsetParent.");
      const parentRect = parentElement.getBoundingClientRect();

      // חישוב מיקום רצוי לפי התמונה - הצמדה מצד לצד
      let desiredViewportLeft, desiredViewportTop;
      
      // יישור אנכי - יישר את חלקו העליון של המקור עם היעד
      desiredViewportTop = targetRect.top;
      
      // יישור אופקי - בהתאם לכיוון
      if (direction === 'left') {
        // המקור צריך להיות משמאל ליעד, עם רווח (אם מוגדר)
        desiredViewportLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
      } else { // 'right'
        // המקור צריך להיות מימין ליעד, עם רווח (אם מוגדר)
        desiredViewportLeft = targetRect.right + CONFIG.BLOCK_GAP;
      }

      // המרה לערכי style יחסיים להורה
      let newLeft = desiredViewportLeft - parentRect.left + parentElement.scrollLeft;
      let newTop = desiredViewportTop - parentRect.top + parentElement.scrollTop;

      // הגבלת גבולות אם ההורה הוא אזור התכנות
      if (parentElement.id === 'program-blocks') {
          const maxLeft = Math.max(0, parentElement.scrollWidth - sourceRect.width);
          const maxTop = Math.max(0, parentElement.scrollHeight - sourceRect.height);
          newLeft = Math.max(0, Math.min(newLeft, maxLeft));
          newTop = Math.max(0, Math.min(newTop, maxTop));
      }

      // החלת המיקום הסופי
      const finalLeftPx = newLeft.toFixed(1) + 'px';
      const finalTopPx = newTop.toFixed(1) + 'px';
      console.log(`[SnapBlocks] Applying final style: left=${finalLeftPx}, top=${finalTopPx}`);
      sourceBlock.style.left = finalLeftPx;
      sourceBlock.style.top = finalTopPx;

      // עדכון מאפיינים המציינים קשר
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      
      // הוסף אנימציית הצמדה
      addSnapEffectAnimation(sourceBlock);

    } catch (err) {
      console.error('[SnapBlocks] Error during execution:', err);
    }
  }

  // ========================================================================
  // עדכון מחוון מיקום עתידי (המלבן הכחול)
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;

      // צור את מחוון המיקום העתידי אם צריך
      if (!futureIndicator) {
          futureIndicator = document.createElement('div');
          futureIndicator.id = 'future-position-indicator';
          futureIndicator.className = 'future-position-indicator';
          programmingArea.appendChild(futureIndicator);
      }

      try {
          // קבל מימדי מקור נוכחיים
          const sourceRect = sourceBlock.getBoundingClientRect();
          const targetRect = targetBlock.getBoundingClientRect();

          // חשב מיקום עתידי (כמו בפונקציית snapBlocks)
          let desiredViewportLeft, desiredViewportTop;
          desiredViewportTop = targetRect.top;
          
          if (direction === 'left') {
              desiredViewportLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
          } else { // direction === 'right'
              desiredViewportLeft = targetRect.right + CONFIG.BLOCK_GAP;
          }

          // המר למיקום יחסי לאזור התכנות
          const parentRect = programmingArea.getBoundingClientRect();
          let indicatorLeft = desiredViewportLeft - parentRect.left + programmingArea.scrollLeft;
          let indicatorTop = desiredViewportTop - parentRect.top + programmingArea.scrollTop;

          // הגבל למסגרת אזור התכנות
          indicatorLeft = Math.max(0, indicatorLeft);
          indicatorTop = Math.max(0, indicatorTop);

          // עדכן את סגנון המחוון
          futureIndicator.style.position = 'absolute';
          futureIndicator.style.left = indicatorLeft + 'px';
          futureIndicator.style.top = indicatorTop + 'px';
          futureIndicator.style.width = sourceRect.width + 'px';
          futureIndicator.style.height = sourceRect.height + 'px';
          futureIndicator.style.display = 'block';

      } catch (err) {
          console.error('Error updating future position indicator:', err);
          removeFuturePositionIndicator();
      }
  }

  // ========================================================================
  // הסרת מחוון מיקום עתידי
  // ========================================================================
  function removeFuturePositionIndicator() {
      if (futureIndicator) {
          futureIndicator.style.display = 'none';
      }
  }

  // ========================================================================
  // הוספת סגנונות CSS - משופר לפי התמונה
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* בלוק נגרר - הופכים עליון ומדגישים */
      .snap-source {
         box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
         transition: box-shadow 0.15s ease-out;
         cursor: grabbing !important;
      }

      /* הילה צהובה סביב בלוק יעד פוטנציאלי */
      .snap-target {
        outline: 3px solid rgb(255, 210, 0) !important; /* צהוב ברור */
        outline-offset: 3px;
        box-shadow: 0 0 15px 5px rgba(255, 210, 0, 0.6) !important;
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important; /* חשוב שיהיה מתחת לנגרר */
      }

      /* מלבן כחול מקווקו לציון מיקום עתידי */
      .future-position-indicator {
        position: absolute; 
        border: 2px dashed rgba(0, 136, 255, 0.9);
        border-radius: 5px; 
        background-color: rgba(0, 136, 255, 0.08);
        pointer-events: none; 
        z-index: 998; 
        opacity: 0;
        transition: opacity 0.1s ease-out, left 0.05s linear, top 0.05s linear;
        display: none;
      }
      .future-position-indicator[style*="display: block"] { 
        opacity: 0.8; 
      }

      /* סימון כיוון (פס צהוב בצד ימין/שמאל) */
      .snap-left::before {
        content: ''; 
        position: absolute; 
        left: -6px; 
        top: 15%; 
        bottom: 15%; 
        width: 4px;
        background-color: rgba(255, 210, 0, 0.9); 
        border-radius: 2px; 
        z-index: 1000;
        box-shadow: 0 0 5px 1px rgba(255, 210, 0, 0.6); 
        transition: all 0.1s ease-out;
      }
      .snap-right::after {
        content: ''; 
        position: absolute; 
        right: -6px; 
        top: 15%; 
        bottom: 15%; 
        width: 4px;
        background-color: rgba(255, 210, 0, 0.9); 
        border-radius: 2px; 
        z-index: 1000;
        box-shadow: 0 0 5px 1px rgba(255, 210, 0, 0.6); 
        transition: all 0.1s ease-out;
      }

      /* אנימציות */
      @keyframes snapEffect { 
        0% { transform: scale(1); } 
        50% { transform: scale(1.03); } 
        100% { transform: scale(1); } 
      }
      .snap-animation { 
        animation: snapEffect 0.2s ease-out; 
      }
      
      @keyframes detachEffect { 
        0% { transform: translate(0, 0) rotate(0); } 
        50% { transform: translate(2px, 2px) rotate(0.5deg); } 
        100% { transform: translate(0, 0) rotate(0); } 
      }
      .detach-animation { 
        animation: detachEffect 0.2s ease-in-out; 
      }

      /* תפריט ניתוק */
      #detach-menu { 
        position: absolute; 
        background-color: white; 
        border: 1px solid #ccc; 
        border-radius: 4px; 
        box-shadow: 0 3px 8px rgba(0,0,0,0.2); 
        z-index: 1100; 
        padding: 5px; 
        font-size: 14px; 
        min-width: 100px; 
      }
      #detach-menu div { 
        padding: 6px 12px; 
        cursor: pointer; 
        border-radius: 3px; 
      }
      #detach-menu div:hover { 
        background-color: #eee; 
      }

      /* כללי: מניעת בחירת טקסט בזמן גרירה */
      body.user-select-none { 
        user-select: none; 
        -webkit-user-select: none; 
        -moz-user-select: none; 
        -ms-user-select: none; 
      }
    `;
    document.head.appendChild(style);
    console.log('Highlighting and animation styles added/verified.');
  }

  // ========================================================================
  // פונקציות עזר לניתוק בלוקים
  // ========================================================================
  function showDetachMenu(x, y, block) {
    removeDetachMenu(); // הסר תפריט קודם אם קיים
    
    const menu = document.createElement('div');
    menu.id = 'detach-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    const detachOption = document.createElement('div');
    detachOption.textContent = 'נתק בלוק';
    detachOption.onclick = function() {
        detachBlock(block, true);
        removeDetachMenu();
    };
    
    menu.appendChild(detachOption);
    document.body.appendChild(menu);
    
    // סגור את התפריט בלחיצה מחוץ לתפריט
    setTimeout(() => {
        document.addEventListener('click', closeMenuOutside);
    }, 0);
  }
  
  function closeMenuOutside(e) {
    const menu = document.getElementById('detach-menu');
    if (menu && !menu.contains(e.target)) {
        removeDetachMenu();
    }
  }
  
  function removeDetachMenu() {
    const menu = document.getElementById('detach-menu');
    if (menu) {
        document.removeEventListener('click', closeMenuOutside);
        menu.remove();
    }
  }
  
  function detachBlock(blockToDetach, animate = true) {
    if (!blockToDetach) return;
    
    // קבל מידע על החיבור
    const targetId = blockToDetach.getAttribute('data-connected-to');
    const direction = blockToDetach.getAttribute('data-connection-direction');
    
    if (!targetId || !direction) return;
    
    // מצא את הבלוק המטרה
    const targetBlock = document.getElementById(targetId);
    
    // הסר את המאפיינים מהבלוק הנוכחי
    blockToDetach.removeAttribute('data-connected-to');
    blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block');
    
    // הסר את המאפיינים מבלוק המטרה אם הוא קיים
    if (targetBlock) {
        targetBlock.removeAttribute(`data-connected-from-${direction}`);
        
        // בדוק אם יש עדיין בלוקים מחוברים לבלוק המטרה
        const stillHasConnections = 
            targetBlock.hasAttribute('data-connected-from-left') ||
            targetBlock.hasAttribute('data-connected-from-right') ||
            targetBlock.hasAttribute('data-connected-to');
            
        if (!stillHasConnections) {
            targetBlock.classList.remove('has-connected-block');
        }
    }
    
    // הוסף אנימציית ניתוק אם נדרש
    if (animate) {
        addDetachEffectAnimation(blockToDetach);
    }
    
    console.log(`Block ${blockToDetach.id} detached from ${targetId}`);
  }

  // ========================================================================
  // פונקציות עזר לאנימציה
  // ========================================================================
  function addSnapEffectAnimation(block) {
    block.classList.remove('snap-animation');
    // אילוץ reflow כדי שהאנימציה תופעל מחדש
    void block.offsetWidth;
    block.classList.add('snap-animation');
    
    // הסר את המחלקה אחרי סיום האנימציה
    setTimeout(() => {
        if (block && block.classList) {
            block.classList.remove('snap-animation');
        }
    }, 300);
  }
  
  function addDetachEffectAnimation(block) {
    block.classList.remove('detach-animation');
    void block.offsetWidth;
    block.classList.add('detach-animation');
    
    setTimeout(() => {
        if (block && block.classList) {
            block.classList.remove('detach-animation');
        }
    }, 300);
  }

  // ========================================================================
  // יצירת ID ייחודי
  // ========================================================================
  function generateUniqueId(block) {
    // בדוק אם יש כבר מזהה
    if (block.id) return block.id;
    
    // הגדר פרפיקס בהתבסס על סוג הבלוק
    let prefix = 'block';
    if (block.classList.contains('control-block')) {
        prefix = 'ctrl';
    } else if (block.classList.contains('action-block')) {
        prefix = 'act';
    } else if (block.classList.contains('condition-block')) {
        prefix = 'cond';
    }
    
    // צור מזהה ייחודי עם חותמת זמן
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 1000);
    const uniqueId = `${prefix}-${timestamp}-${randomPart}`;
    
    block.id = uniqueId;
    return uniqueId;
  }

})();
// --- END OF FILE linkageimproved2.js ---
