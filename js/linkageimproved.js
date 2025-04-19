// מימוש של מערכת חיבור בלוקים עם הילה צהובה ומלבן כחול מקווקו
(function() {
  // משתנים גלובליים
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let lastClickedBlock = null;
  let lastRightClickedBlock = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  
  // פונקציה ראשית - תחילת המימוש
  document.addEventListener('DOMContentLoaded', function() {
    console.log('מערכת חיבור בלוקים נטענה');
    
    // אתחול סגנונות וניקוי הדגשות
    addHighlightStyles();
    removeFuturePositionIndicator();
    clearAllHighlights();
    
    // הוספת מאזינים לאירועים
    initDragAndDropListeners();
    initBlockConnectionListeners();
    initClearAllButton();
  });
  
  // אתחול מאזינים לגרירה ושחרור
  function initDragAndDropListeners() {
    const programContainer = document.getElementById('program-blocks');
    if (!programContainer) {
      console.error('לא נמצא מיכל התכנות (program-blocks)');
      return;
    }
    
    console.log('נמצא מיכל התכנות:', programContainer);
    
    // האזנה להוספת בלוקים חדשים באמצעות מוטציות
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.classList.contains('block-container')) {
              console.log('בלוק חדש נוסף:', node);
              addBlockDragListeners(node);
            }
          });
        }
      });
    });
    
    observer.observe(programContainer, { childList: true });
    
    // הוספת מאזינים לבלוקים קיימים
    const existingBlocks = programContainer.querySelectorAll('.block-container');
    console.log('נמצאו', existingBlocks.length, 'בלוקים קיימים');
    existingBlocks.forEach(block => addBlockDragListeners(block));
    
    // מאזינים לאזור התכנות
    programContainer.addEventListener('dragover', function(e) {
      e.preventDefault();
      if (currentDraggedBlock) {
        onBlockDrag(e);
      }
    });
    
    programContainer.addEventListener('drop', function(e) {
      e.preventDefault();
      if (currentDraggedBlock) {
        onBlockDrop();
      }
    });
    
    // התייחסות לאירועי גרירה רגילים מהקוד הקיים
    programContainer.addEventListener("drop", handleDrop);
  }
  
  // הוספת מאזיני גרירה לבלוק בודד
  function addBlockDragListeners(block) {
    if (!block) return;
    
    // מניעת התנגשות עם המאזינים הקיימים
    block.removeEventListener('mousedown', onBlockMouseDown);
    
    // הוספת מאזין גרירה חדש
    block.addEventListener('mousedown', onBlockMouseDown);
    
    // סימון בלוק שנלחץ
    block.addEventListener('click', function() {
      lastClickedBlock = block;
    });
    
    // מאזין ללחיצה ימנית (לפתיחת תפריט ניתוק)
    block.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      lastRightClickedBlock = block;
      
      // בדיקה אם הבלוק מחובר
      if (block.hasAttribute('data-connected-to')) {
        showDetachMenu(e.clientX, e.clientY, block);
      }
    });
    
    console.log('נוספו מאזיני גרירה לבלוק:', block);
  }
  
  // טיפול בלחיצת עכבר על בלוק
  function onBlockMouseDown(e) {
    if (e.button !== 0) return; // רק לחיצה שמאלית
    console.log('התחלת גרירת בלוק');
    
    const block = this;
    const rect = block.getBoundingClientRect();
    
    // חישוב הסטה מנקודת הלחיצה
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    // סימון כבלוק נגרר
    currentDraggedBlock = block;
    isDragging = true;
    
    // מניעת גרירה סטנדרטית
    e.preventDefault();
    
    // הוספת מאזינים זמניים
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('mouseup', onDocumentMouseUp);
  }
  
  // טיפול בתזוזת עכבר בזמן גרירה
  function onDocumentMouseMove(e) {
    if (!isDragging || !currentDraggedBlock) return;
    
    const programContainer = document.getElementById('program-blocks');
    const containerRect = programContainer.getBoundingClientRect();
    
    // עדכון מיקום הבלוק הנגרר
    currentDraggedBlock.style.position = 'absolute';
    currentDraggedBlock.style.left = (e.clientX - containerRect.left - dragOffset.x) + 'px';
    currentDraggedBlock.style.top = (e.clientY - containerRect.top - dragOffset.y) + 'px';
    
    // סימון כבלוק נגרר
    currentDraggedBlock.classList.add('snap-source');
    
    // בדיקת אפשרות הצמדה
    const blocks = Array.from(programContainer.querySelectorAll('.block-container'));
    checkSnapPossibility(currentDraggedBlock, blocks);
    
    // עדכון אינדיקטור הצמדה
    onBlockDrag(e);
  }
  
  // טיפול בשחרור עכבר בסיום גרירה
  function onDocumentMouseUp(e) {
    if (!isDragging || !currentDraggedBlock) return;
    
    console.log('סיום גרירת בלוק');
    
    // ביצוע הצמדה אם יש מטרה
    if (potentialSnapTarget && snapDirection) {
      onBlockDrop();
    } else {
      clearAllHighlights();
      removeFuturePositionIndicator();
    }
    
    // הסרת מאזינים זמניים
    document.removeEventListener('mousemove', onDocumentMouseMove);
    document.removeEventListener('mouseup', onDocumentMouseUp);
    
    // איפוס משתנים
    isDragging = false;
  }
  
  // אתחול מאזינים לחיבורי בלוקים
  function initBlockConnectionListeners() {
    // האזנה לשינויי מיקום בלוקים
    document.addEventListener('keydown', function(e) {
      // ניתוק בלוק עם Delete או Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && lastClickedBlock) {
        if (lastClickedBlock.hasAttribute('data-connected-to')) {
          detachBlock(lastClickedBlock);
        }
      }
    });
  }
  
  // הצגת תפריט ניתוק
  function showDetachMenu(x, y, block) {
    // הסרת תפריט קודם אם קיים
    removeDetachMenu();
    
    // יצירת תפריט חדש
    const menu = document.createElement('div');
    menu.id = 'detach-menu';
    menu.style.position = 'absolute';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.backgroundColor = '#fff';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '4px';
    menu.style.padding = '5px';
    menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    menu.style.zIndex = '1000';
    
    // אפשרות ניתוק
    const detachOption = document.createElement('div');
    detachOption.textContent = 'נתק בלוק';
    detachOption.style.padding = '5px 10px';
    detachOption.style.cursor = 'pointer';
    detachOption.style.borderRadius = '3px';
    
    detachOption.addEventListener('mouseover', function() {
      this.style.backgroundColor = '#f0f0f0';
    });
    
    detachOption.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'transparent';
    });
    
    detachOption.addEventListener('click', function() {
      detachBlock(block);
      removeDetachMenu();
    });
    
    menu.appendChild(detachOption);
    document.body.appendChild(menu);
    
    // סגירת התפריט בלחיצה מחוץ לתפריט
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        removeDetachMenu();
        document.removeEventListener('click', closeMenu);
      }
    });
  }
  
  // ניתוק בלוק
  function detachBlock(block) {
    if (!block.hasAttribute('data-connected-to')) return;
    
    // מוצא את הבלוק המחובר
    const connectedToId = block.getAttribute('data-connected-to');
    const connectedBlock = document.getElementById(connectedToId);
    
    // הסרת סימוני חיבור
    block.removeAttribute('data-connected-to');
    block.removeAttribute('data-connection-direction');
    block.classList.remove('connected-block');
    
    if (connectedBlock) {
      connectedBlock.classList.remove('has-connected-block');
    }
    
    // אנימציית ניתוק
    addDetachEffectAnimation(block);
    
    console.log('ניתוק בלוק:', block.id || 'בלוק ללא מזהה');
  }
  
  // פונקציה לבדיקת אפשרות הצמדה
  function checkSnapPossibility(sourceBlock, blocks) {
    // איפוס ערכים קודמים
    potentialSnapTarget = null;
    snapDirection = null;
    clearAllHighlights();
    
    // אם אין מספיק בלוקים לבדיקה
    if (!sourceBlock || blocks.length <= 1) {
      console.log('אין מספיק בלוקים לבדיקת הצמדה');
      return false;
    }
    
    const sourceRect = sourceBlock.getBoundingClientRect();
    let closestBlock = null;
    let closestDistance = 100; // מרחק סף מקסימלי
    let bestDirection = null;
    
    // עוברים על כל הבלוקים
    for (const block of blocks) {
      // דילוג על הבלוק הנבדק עצמו
      if (block === sourceBlock) continue;
      
      const blockRect = block.getBoundingClientRect();
      
      // חישוב מרחק בין מרכזי הבלוקים
      const centerDist = Math.sqrt(
        Math.pow((sourceRect.left + sourceRect.width/2) - (blockRect.left + blockRect.width/2), 2) +
        Math.pow((sourceRect.top + sourceRect.height/2) - (blockRect.top + blockRect.height/2), 2)
      );
      
      // בדיקה אם המרחק קטן מסף מסוים
      if (centerDist < closestDistance) {
        // חישוב כיוון אפשרי להצמדה
        const direction = calculateSnapDirection(sourceBlock, block);
        
        // אם יש כיוון תקף
        if (direction) {
          closestDistance = centerDist;
          closestBlock = block;
          bestDirection = direction;
        }
      }
    }
    
    // אם נמצא בלוק מתאים
    if (closestBlock) {
      console.log('נמצא בלוק פוטנציאלי להצמדה:', closestBlock, 'בכיוון:', bestDirection);
      potentialSnapTarget = closestBlock;
      snapDirection = bestDirection;
      
      // הוספת הדגשות ויזואליות
      potentialSnapTarget.classList.add('snap-target');
      if (snapDirection === 'left') {
        potentialSnapTarget.classList.add('snap-left');
      } else {
        potentialSnapTarget.classList.add('snap-right');
      }
      return true;
    }
    
    return false;
  }
  
  // חישוב כיוון ההצמדה
  function calculateSnapDirection(sourceBlock, targetBlock) {
    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    
    // הצדדים של הבלוקים
    const sourceLeft = sourceRect.left;
    const sourceRight = sourceRect.right;
    const targetLeft = targetRect.left;
    const targetRight = targetRect.right;
    
    // חישוב מרחקים
    const leftToRightDist = Math.abs(sourceLeft - targetRight);
    const rightToLeftDist = Math.abs(sourceRight - targetLeft);
    
    // מרחק מינימלי להצמדה - מאפשר מרווח של 50 פיקסלים
    const snapThreshold = 50;
    
    // בדיקה אם יש אפשרות להצמיד משמאל או מימין
    if (leftToRightDist <= snapThreshold) {
      return 'right'; // הצמדה מימין לטרגט
    } else if (rightToLeftDist <= snapThreshold) {
      return 'left'; // הצמדה משמאל לטרגט
    }
    
    // אם אין אפשרות הצמדה
    return null;
  }
  
  // פונקציה להצמדת בלוקים
  function snapBlocks(sourceBlock, targetBlock, direction) {
    try {
      console.log('מבצע הצמדה בכיוון:', direction);
      
      // חישוב מיקומים
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const programRect = document.getElementById('program-blocks').getBoundingClientRect();
      
      let newLeft, newTop;
      
      if (direction === 'left') {
        // הצמדה משמאל לטרגט: הפין הימני של המקור לשקע השמאלי של היעד
        newLeft = targetRect.left - programRect.left - sourceRect.width;
        newTop = targetRect.top - programRect.top;
      } else {
        // הצמדה מימין לטרגט: השקע השמאלי של המקור לפין הימני של היעד
        newLeft = targetRect.right - programRect.left;
        newTop = targetRect.top - programRect.top;
      }
      
      // עדכון מיקום הבלוק
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';
      
      // הוספת סימון חיבור
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      
      // סימון כיוון החיבור לשימוש עתידי
      sourceBlock.setAttribute('data-connected-to', targetBlock.id || generateUniqueId(targetBlock));
      sourceBlock.setAttribute('data-connection-direction', direction);
      
      // אפקט ויזואלי קטן בזמן ההצמדה
      addSnapEffectAnimation(sourceBlock);
      
      // הסרת אינדיקטור מיקום עתידי אם קיים
      removeFuturePositionIndicator();
      
      console.log('הצמדה בוצעה בהצלחה');
    } catch (err) {
      console.error('שגיאה בהצמדת בלוקים:', err);
    }
  }
  
  // יצירת מזהה ייחודי לבלוק אם אין לו
  function generateUniqueId(block) {
    if (!block.id) {
      const uniqueId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      block.id = uniqueId;
    }
    return block.id;
  }
  
  // הוספת אנימציית הצמדה
  function addSnapEffectAnimation(block) {
    // הוספת קלאס אנימציה
    block.classList.add('snap-animation');
    
    // הסרת הקלאס אחרי סיום האנימציה
    setTimeout(() => {
      block.classList.remove('snap-animation');
    }, 300); // 300ms - משך האנימציה
  }
  
  // הוספת אנימציית ניתוק
  function addDetachEffectAnimation(block) {
    // הוספת קלאס אנימציה
    block.classList.add('detach-animation');
    
    // הסרת הקלאס אחרי סיום האנימציה
    setTimeout(() => {
      block.classList.remove('detach-animation');
    }, 300); // 300ms - משך האנימציה
  }
  
  // פונקציה ליצירת אינדיקטור מיקום עתידי
  function createFuturePositionIndicator() {
    // מחיקת אינדיקטור קודם אם קיים
    removeFuturePositionIndicator();
    
    // יצירת אלמנט חדש
    const indicator = document.createElement('div');
    indicator.id = 'future-position-indicator';
    indicator.className = 'future-position-indicator';
    
    // הוספה למסמך
    document.body.appendChild(indicator);
    
    return indicator;
  }
  
  // פונקציה להסרת אינדיקטור מיקום עתידי
  function removeFuturePositionIndicator() {
    const existingIndicator = document.getElementById('future-position-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
  }
  
  // פונקציה לעדכון המיקום העתידי של הבלוק - קריאה בזמן גרירה
  function updateFuturePosition(sourceBlock, targetBlock, direction, programRect) {
    try {
      // קבלת האינדיקטור או יצירתו אם לא קיים
      let indicator = document.getElementById('future-position-indicator');
      if (!indicator) {
        indicator = createFuturePositionIndicator();
      }
      
      // מחשב מיקום ומימדים
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      
      let newLeft, newTop;
      
      if (direction === 'left') {
        // הצמדה משמאל לטרגט
        newLeft = targetRect.left - sourceRect.width;
        newTop = targetRect.top;
      } else {
        // הצמדה מימין לטרגט
        newLeft = targetRect.right;
        newTop = targetRect.top;
      }
      
      // עדכון מיקום וגודל האינדיקטור (במיקום אבסולוטי בדף)
      indicator.style.position = 'absolute';
      indicator.style.left = newLeft + 'px';
      indicator.style.top = newTop + 'px';
      indicator.style.width = sourceRect.width + 'px';
      indicator.style.height = sourceRect.height + 'px';
      indicator.style.display = 'block';
      
    } catch (err) {
      console.error('שגיאה בעדכון אינדיקטור מיקום עתידי:', err);
    }
  }
  
  // הוספת סגנונות CSS להדגשה ואנימציה - גרסה משופרת
  function addHighlightStyles() {
    // בדיקה אם כבר קיים אלמנט סגנון למניעת כפילות
    if (document.getElementById('block-connection-styles')) {
      console.log('סגנונות חיבור כבר קיימים, לא מוסיף שוב');
      return;
    }
    
    // יצירת אלמנט style חדש
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* הדגשת בלוק מקור (הנגרר) בצורה ישירה */
      .snap-source {
        filter: brightness(1.05) !important;
        transition: all 0.15s ease-out !important;
        box-shadow: 0 0 12px 4px rgba(0, 180, 255, 0.7) !important;
        z-index: 1000 !important;
      }
      
      /* הדגשת בלוק יעד */
      .snap-target {
        filter: brightness(1.1) !important;
        transition: all 0.15s ease-out !important;
        box-shadow: 0 0 12px 4px rgba(255, 255, 0, 0.7) !important;
        z-index: 999 !important;
      }
      
      /* מלבן כחול מקווקו לציון מיקום עתידי */
      .future-position-indicator {
        position: absolute;
        border: 2px dashed rgba(0, 136, 255, 0.8);
        border-radius: 5px;
        background-color: rgba(0, 136, 255, 0.05);
        pointer-events: none;
        z-index: 998;
        transition: all 0.15s ease-out;
        opacity: 0.8;
        box-shadow: 0 0 5px rgba(0, 136, 255, 0.3);
      }
      
      /* סימוני הצמדה משופרים - חזקים יותר וברורים יותר */
      .snap-left::before {
        content: '';
        position: absolute;
        left: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 24px;
        background-color: rgba(255, 255, 0, 0.9);
        border-radius: 0 4px 4px 0;
        z-index: 1001;
        box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.6);
      }
      
      .snap-right::after {
        content: '';
        position: absolute;
        right: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 8px;
        height: 24px;
        background-color: rgba(255, 255, 0, 0.9);
        border-radius: 4px 0 0 4px;
        z-index: 1001;
        box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.6);
      }
      
      /* תמיכה בכל סוגי דפדפנים לאנימציה */
      @-webkit-keyframes snapEffect {
        0% { transform: scale(1.02); -webkit-transform: scale(1.02); }
        40% { transform: scale(0.98); -webkit-transform: scale(0.98); }
        70% { transform: scale(1.01); -webkit-transform: scale(1.01); }
        100% { transform: scale(1); -webkit-transform: scale(1); }
      }
      
      @keyframes snapEffect {
        0% { transform: scale(1.02); }
        40% { transform: scale(0.98); }
        70% { transform: scale(1.01); }
        100% { transform: scale(1); }
      }
      
      .snap-animation {
        animation: snapEffect 0.3s ease-out;
        -webkit-animation: snapEffect 0.3s ease-out;
      }
      
      @-webkit-keyframes detachEffect {
        0% { transform: scale(1); -webkit-transform: scale(1); }
        30% { transform: scale(1.04) rotate(1deg); -webkit-transform: scale(1.04) rotate(1deg); }
        60% { transform: scale(0.98) rotate(-1deg); -webkit-transform: scale(0.98) rotate(-1deg); }
        100% { transform: scale(1) rotate(0); -webkit-transform: scale(1) rotate(0); }
      }
      
      @keyframes detachEffect {
        0% { transform: scale(1); }
        30% { transform: scale(1.04) rotate(1deg); }
        60% { transform: scale(0.98) rotate(-1deg); }
        100% { transform: scale(1) rotate(0); }
      }
      
      .detach-animation {
        animation: detachEffect 0.3s ease-out;
        -webkit-animation: detachEffect 0.3s ease-out;
      }
      
      @-webkit-keyframes pulseIndicator {
        0% { opacity: 0.5; }
        50% { opacity: 0.9; }
        100% { opacity: 0.5; }
      }
      
      @keyframes pulseIndicator {
        0% { opacity: 0.5; }
        50% { opacity: 0.9; }
        100% { opacity: 0.5; }
      }
      
      /* אנימציית פעימה למלבן המקווקו */
      .future-position-indicator {
        animation: pulseIndicator 1.5s infinite ease-in-out;
        -webkit-animation: pulseIndicator 1.5s infinite ease-in-out;
      }
      
      /* אינדיקטור חיבור גדול ובולט יותר */
      #connection-indicator {
        transition: all 0.2s ease-out;
        -webkit-transition: all 0.2s ease-out;
        animation: pulseIndicator 1.2s infinite ease-in-out;
        -webkit-animation: pulseIndicator 1.2s infinite ease-in-out;
        width: 12px !important;
        opacity: 0.8 !important;
        box-shadow: 0 0 15px 5px rgba(255, 255, 100, 0.7) !important;
      }
      
      /* סימון בלוקים מחוברים */
      .connected-block {
        filter: brightness(1.02);
        position: relative;
      }
      
      .has-connected-block {
        position: relative;
      }
      
      /* סימון חזותי לבלוקים מחוברים */
      .connected-block::after {
        content: '';
        position: absolute;
        width: 10px;
        height: 10px;
        background-color: rgba(0, 255, 0, 0.5);
        border-radius: 50%;
        bottom: 5px;
        right: 5px;
        box-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
      }
      
      /* סגנון תפריט ניתוק */
      #detach-menu {
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 1100;
      }
    `;
    
    // הוספה לראש המסמך
    document.head.appendChild(style);
    console.log('נוספו סגנונות CSS להדגשה ואנימציה');
  }
  
  // פונקציה לניקוי כל ההדגשות וסימונים
  function clearAllHighlights() {
    // הסרת קלאסים מכל האלמנטים
    document.querySelectorAll('.snap-source, .snap-target, .snap-left, .snap-right').forEach(el => {
      el.classList.remove('snap-source', 'snap-target', 'snap-left', 'snap-right');
    });
  }
  
  // פונקציה להסרת תפריט הניתוק
  function removeDetachMenu() {
    const detachMenu = document.getElementById('detach-menu');
    if (detachMenu) {
      detachMenu.remove();
    }
  }
  
  // פונקציה להסתרת אינדיקטור חיבור
  function hideConnectionIndicator() {
    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }
  
  // פונקציה לטיפול בגרירת בלוק
  function onBlockDrag(e) {
    // בדיקה אם יש בלוק יעד פוטנציאלי
    if (currentDraggedBlock && potentialSnapTarget) {
      // חישוב כיוון ההצמדה
      const direction = calculateSnapDirection(currentDraggedBlock, potentialSnapTarget);
      
      // בדיקה אם יש כיוון הצמדה תקף
      if (direction) {
        // קבלת מיקום ה-program container
        const programRect = document.getElementById('program-blocks').getBoundingClientRect();
        
        // עדכון אינדיקטור מיקום עתידי
        updateFuturePosition(currentDraggedBlock, potentialSnapTarget, direction, programRect);
        
        // הדגשת בלוקים
        currentDraggedBlock.classList.add('snap-source');
        potentialSnapTarget.classList.add('snap-target');
        
        // הוספת סימן חזותי לכיוון ההצמדה
        if (direction === 'left') {
          potentialSnapTarget.classList.add('snap-left');
        } else {
          potentialSnapTarget.classList.add('snap-right');
        }
        
        // שמירת כיוון ההצמדה הנוכחי
        snapDirection = direction;
      } else {
        // אם אין כיוון תקף, מסיר את הסימונים
        removeFuturePositionIndicator();
      }
    } else {
      // אם אין מטרת הצמדה, מסיר את האינדיקטור
      removeFuturePositionIndicator();
      clearAllHighlights();
    }
  }
