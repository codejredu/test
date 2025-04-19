document.addEventListener('DOMContentLoaded', function() {
  console.log('טוען מערכת הצמדה וניתוק משופרת...');
  
  // מחכה שהדף יטען לגמרי כולל הסקריפטים האחרים
  setTimeout(function() {
    setupBlockConnections();
  }, 1000);
  
  function setupBlockConnections() {
    console.log('מפעיל מערכת הצמדה וניתוק עם חיווי ויזואלי...');
    
    // קבועים
    const SNAP_THRESHOLD = 25; // מרחק מקסימלי בפיקסלים להצמדה
    const HIGHLIGHT_THRESHOLD = 50; // מרחק להתחלת הדגשה ויזואלית
    const DOUBLE_CLICK_THRESHOLD = 300; // זמן מקסימלי בין לחיצות לזיהוי כלחיצה כפולה
    
    // איתור אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות לא נמצא!');
      return;
    }
    
    // משתנים גלובליים
    let currentDraggedBlock = null;
    let potentialSnapTarget = null;
    let snapDirection = null; // 'left' או 'right'
    let lastClickedBlock = null;
    let lastClickTime = 0;
    let lastRightClickedBlock = null; // לזיהוי לחיצת כפתור ימני
    let connectionIndicator = null; // אינדיקטור חיבור ויזואלי
    
    // הוספת סגנונות להדגשה ויזואלית באופן דינמי
    addHighlightStyles();
    
    // יצירת אינדיקטור חיבור
    createConnectionIndicator();
    
    // ---- התאמת מערכת הגרירה הקיימת ----
    
    // צעד 1: הוספת מאזינים לאירועי גרירה כדי לנהל את הבלוק הנגרר
    programmingArea.addEventListener('dragstart', function(e) {
      if (e.target.classList.contains('block-container')) {
        // שמירת הבלוק הנגרר
        currentDraggedBlock = e.target;
        
        // מניעת יצירת רוח רפאים - הגדרת התמונה שתיווצר בזמן גרירה
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        
        // מסמנים את הבלוק כנגרר
        e.target.classList.add('dragging');
        
        // מיקום מקורי של הבלוק למקרה שנצטרך לשחזר אותו
        e.target.dataset.originalLeft = e.target.style.left || '';
        e.target.dataset.originalTop = e.target.style.top || '';
        
        // אם הבלוק היה מחובר, נתק אותו
        if (isBlockConnected(e.target)) {
          detachBlock(e.target);
        }
        
        // הסתרת האינדיקטור אם הוא מוצג
        hideConnectionIndicator();
        
        // עדכון תצוגת הבלוק בזמן אמת
        updateDraggedBlockPosition(e);
      }
    });
    
    // צעד 2: ניקוי הסימון בסיום הגרירה
    programmingArea.addEventListener('dragend', function(e) {
      if (e.target.classList.contains('block-container')) {
        console.log('סיום גרירה נתפס באזור התכנות');
        
        // הסרת הסימון
        e.target.classList.remove('dragging');
        
        // בדוק אם יש הצמדה אפשרית בין בלוקים
        checkForPossibleSnapAfterDrag(e.target);
        
        // נקה את המצב
        resetHighlighting();
        hideConnectionIndicator();
        currentDraggedBlock = null;
      }
    });
    
    // צעד 3: עדכון מיקום הבלוק בזמן גרירה
    programmingArea.addEventListener('dragover', function(e) {
      if (currentDraggedBlock) {
        e.preventDefault(); // חייב למניעת התנהגות ברירת מחדל
        updateDraggedBlockPosition(e);
      }
    });
    
    // צעד 4: במקום להאזין ל-drag, נתפוס mousemove לעדכון רציף
    programmingArea.addEventListener('mousemove', function(e) {
      if (currentDraggedBlock && currentDraggedBlock.classList.contains('dragging')) {
        updateDraggedBlockPosition(e);
        
        // בדיקה אם יש בלוק פוטנציאלי להצמדה בקרבת מקום
        checkForSnapTarget(currentDraggedBlock, e.clientX, e.clientY);
      }
    });
    
    // ---- הוספת מנגנון ניתוק ----
    
    // זיהוי לחיצה כפולה על בלוק לניתוק
    programmingArea.addEventListener('click', function(e) {
      const clickedBlock = findParentBlockContainer(e.target);
      if (!clickedBlock) return;
      
      const currentTime = new Date().getTime();
      
      // בדיקה אם מדובר בלחיצה כפולה על אותו בלוק
      if (lastClickedBlock === clickedBlock && 
          currentTime - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
        // זוהתה לחיצה כפולה על בלוק
        console.log('לחיצה כפולה זוהתה - מנסה לנתק את הבלוק');
        detachBlock(clickedBlock);
        lastClickedBlock = null; // איפוס כדי למנוע ניתוק חוזר
      } else {
        // לחיצה ראשונה או לחיצה על בלוק אחר
        lastClickedBlock = clickedBlock;
        lastClickTime = currentTime;
      }
    });
    
    // זיהוי לחיצה ימנית לפתיחת תפריט ניתוק
    programmingArea.addEventListener('contextmenu', function(e) {
      const clickedBlock = findParentBlockContainer(e.target);
      if (!clickedBlock) return;
      
      // מניעת תפריט הדפדפן המובנה
      e.preventDefault();
      
      // בדיקה אם הבלוק מחובר
      if (isBlockConnected(clickedBlock)) {
        // שמירת הבלוק לניתוק
        lastRightClickedBlock = clickedBlock;
        
        // הצגת תפריט ניתוק
        showDetachMenu(e.clientX, e.clientY);
      }
    });
    
    // ---- פונקציות לאינדיקטור חיבור ----
    
    // יצירת אינדיקטור חיבור
    function createConnectionIndicator() {
      // בדיקה אם האינדיקטור כבר קיים
      if (document.getElementById('connection-indicator')) return;
      
      // יצירת אלמנט האינדיקטור
      connectionIndicator = document.createElement('div');
      connectionIndicator.id = 'connection-indicator';
      connectionIndicator.style.position = 'absolute';
      connectionIndicator.style.display = 'none';
      connectionIndicator.style.pointerEvents = 'none'; // שלא יפריע לאירועי עכבר
      connectionIndicator.style.zIndex = '100';
      
      // הוספת האינדיקטור לאזור התכנות
      programmingArea.appendChild(connectionIndicator);
    }
    
    // הצגת אינדיקטור החיבור
    function showConnectionIndicator(targetBlock, direction) {
      if (!connectionIndicator || !targetBlock) return;
      
      const targetRect = targetBlock.getBoundingClientRect();
      const programRect = programmingArea.getBoundingClientRect();
      
      // קביעת גודל האינדיקטור
      connectionIndicator.style.width = '10px';
      connectionIndicator.style.height = targetRect.height + 'px';
      
      // קביעת צבע האינדיקטור בהתאם לסוג הבלוק (אם אפשר לקבוע)
      let indicatorColor = 'rgba(0, 255, 0, 0.4)'; // ברירת מחדל - ירוק
      
      // ניסיון לקבוע צבע לפי קטגוריית הבלוק
      const category = targetBlock.dataset.category;
      if (category) {
        switch(category) {
          case 'motion': indicatorColor = 'rgba(102, 210, 255, 0.5)'; break; // כחול
          case 'looks': indicatorColor = 'rgba(210, 149, 246, 0.5)'; break; // סגול
          case 'sound': indicatorColor = 'rgba(126, 217, 87, 0.5)'; break; // ירוק
          case 'control': indicatorColor = 'rgba(255, 189, 103, 0.5)'; break; // כתום
          case 'end': indicatorColor = 'rgba(255, 107, 107, 0.5)'; break; // אדום
          case 'triggering': indicatorColor = 'rgba(255, 232, 102, 0.5)'; break; // צהוב
        }
      }
      
      connectionIndicator.style.backgroundColor = indicatorColor;
      connectionIndicator.style.boxShadow = `0 0 10px ${indicatorColor}`;
      connectionIndicator.style.borderRadius = '5px';
      
      // קביעת מיקום האינדיקטור בהתאם לכיוון החיבור
      if (direction === 'left') {
        // הצמדה משמאל לבלוק המטרה
        connectionIndicator.style.left = (targetRect.left - programRect.left - 10) + 'px';
        connectionIndicator.style.top = (targetRect.top - programRect.top) + 'px';
      } else if (direction === 'right') {
        // הצמדה מימין לבלוק המטרה
        connectionIndicator.style.left = (targetRect.right - programRect.left) + 'px';
        connectionIndicator.style.top = (targetRect.top - programRect.top) + 'px';
      }
      
      // הוספת אנימציה קלה לאינדיקטור
      connectionIndicator.style.animation = 'pulseIndicator 1s infinite';
      
      // הצגת האינדיקטור
      connectionIndicator.style.display = 'block';
    }
    
    // הסתרת אינדיקטור החיבור
    function hideConnectionIndicator() {
      if (connectionIndicator) {
        connectionIndicator.style.display = 'none';
      }
    }
    
    // פונקציה לעדכון מיקום הבלוק הנגרר בזמן אמת
    function updateDraggedBlockPosition(e) {
      if (!currentDraggedBlock) return;
      
      const programRect = programmingArea.getBoundingClientRect();
      
      // חישוב מיקום חדש יחסית לאזור התכנות
      // הפחתת מחצית מרוחב הבלוק כדי שהבלוק יהיה ממוקם במרכז הסמן
      const blockRect = currentDraggedBlock.getBoundingClientRect();
      const halfWidth = blockRect.width / 2;
      const halfHeight = blockRect.height / 2;
      
      // עדכון המיקום רק אם העכבר נמצא בגבולות הגיוניים
      if (e.clientX > 0 && e.clientY > 0) {
        currentDraggedBlock.style.position = 'absolute';
        currentDraggedBlock.style.left = (e.clientX - programRect.left - halfWidth) + 'px';
        currentDraggedBlock.style.top = (e.clientY - programRect.top - halfHeight) + 'px';
      }
    }
    
    // צעד 4: מאזין לאירוע 'drop' הנוצר כשמשחררים בלוק מהפלטה לאזור התכנות
    programmingArea.addEventListener('drop', function(e) {
      console.log('אירוע drop נתפס באזור התכנות');
      
      // המתנה קצרה כדי לתת לקוד המקורי ליצור את הבלוק החדש
      setTimeout(function() {
        // מציאת הבלוק האחרון שנוסף (כנראה זה שזה עתה נזרק)
        const blocks = programmingArea.querySelectorAll('.block-container');
        if (blocks.length > 0) {
          const lastAddedBlock = blocks[blocks.length - 1];
          
          // בדיקה אם אפשר להצמיד את הבלוק החדש לבלוקים אחרים
          checkForPossibleSnapAfterDrag(lastAddedBlock);
        }
        
        // נקה את המצב
        resetHighlighting();
        hideConnectionIndicator();
      }, 100);
    });
    
    // ---- פונקציות עזר ----
    
    // מציאת אלמנט ההורה מסוג block-container
    function findParentBlockContainer(element) {
      while (element && !element.classList.contains('block-container')) {
        element = element.parentElement;
      }
      return element;
    }
    
    // בדיקה אם בלוק מחובר לבלוק אחר
    function isBlockConnected(block) {
      return block.classList.contains('connected-block') || 
             block.hasAttribute('data-connected-to');
    }
    
    // ניתוק בלוק מהחיבור שלו
    function detachBlock(block) {
      if (!block || !isBlockConnected(block)) return;
      
      console.log('מנתק בלוק:', block.id || block.dataset.type);
      
      // נקה את הסימונים של חיבור
      block.classList.remove('connected-block');
      
      // קבל את הבלוק שאליו היה מחובר
      const connectedToId = block.getAttribute('data-connected-to');
      if (connectedToId) {
        const connectedBlock = document.getElementById(connectedToId);
        if (connectedBlock) {
          connectedBlock.classList.remove('has-connected-block');
        }
      }
      
      // נקה מידע על חיבור
      block.removeAttribute('data-connected-to');
      block.removeAttribute('data-connection-direction');
      
      // הזז את הבלוק מעט כדי להדגיש את הניתוק ויזואלית
      const currentTop = parseInt(block.style.top) || 0;
      block.style.top = (currentTop + 10) + 'px';
      
      // הוסף אנימציית ניתוק
      addDetachEffectAnimation(block);
      
      return true;
    }
    
    // הצגת תפריט ניתוק
    function showDetachMenu(x, y) {
      // בדיקה אם כבר קיים תפריט פתוח
      removeDetachMenu();
      
      // יצירת תפריט הקשר פשוט
      const menu = document.createElement('div');
      menu.className = 'detach-context-menu';
      menu.style.position = 'fixed';
      menu.style.left = x + 'px';
      menu.style.top = y + 'px';
      menu.style.zIndex = '1000';
      menu.style.background = 'white';
      menu.style.border = '1px solid #ccc';
      menu.style.borderRadius = '4px';
      menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      menu.style.padding = '5px 0';
      
      // הוספת פעולת ניתוק
      const detachItem = document.createElement('div');
      detachItem.textContent = 'נתק בלוק';
      detachItem.style.padding = '8px 12px';
      detachItem.style.cursor = 'pointer';
      detachItem.style.direction = 'rtl'; // כיוון טקסט מימין לשמאל
      
      detachItem.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#f0f0f0';
      });
      
      detachItem.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'white';
      });
      
      detachItem.addEventListener('click', function() {
        if (lastRightClickedBlock) {
          detachBlock(lastRightClickedBlock);
          lastRightClickedBlock = null;
        }
        removeDetachMenu();
      });
      
      menu.appendChild(detachItem);
      document.body.appendChild(menu);
      
      // הוספת מאזין לסגירת התפריט בלחיצה מחוץ אליו
      setTimeout(function() {
        document.addEventListener('click', closeDetachMenuOnClick);
      }, 100);
    }
    
    // הסרת תפריט הניתוק
    function removeDetachMenu() {
      const existingMenu = document.querySelector('.detach-context-menu');
      if (existingMenu) {
        existingMenu.remove();
      }
      document.removeEventListener('click', closeDetachMenuOnClick);
    }
    
    // סגירת תפריט בלחיצה מחוץ אליו
    function closeDetachMenuOnClick(e) {
      const clickedOnMenu = e.target.closest('.detach-context-menu');
      if (!clickedOnMenu) {
        removeDetachMenu();
      }
    }
    
    // בדיקה אם יש בלוק פוטנציאלי להצמדה אחרי גרירה
    function checkForPossibleSnapAfterDrag(draggedBlock) {
      if (!draggedBlock) return;
      
      // הכן את המיקום של הבלוק הנגרר
      const blockRect = draggedBlock.getBoundingClientRect();
      const centerX = blockRect.left + blockRect.width / 2;
      const centerY = blockRect.top + blockRect.height / 2;
      
      // חפש בלוק קרוב
      const result = findClosestBlockForSnap(draggedBlock, centerX, centerY);
      
      // אם נמצא בלוק קרוב, בצע הצמדה
      if (result && result.block) {
        snapBlocks(draggedBlock, result.block, result.direction);
      }
    }
    
    // בדיקת בלוק מטרה להצמדה
    function checkForSnapTarget(draggedBlock, mouseX, mouseY) {
      if (!draggedBlock) return;
      
      // נקה הדגשות קודמות
      clearAllHighlights();
      hideConnectionIndicator();
      
      // חפש בלוק קרוב להצמדה
      const result = findClosestBlockForSnap(draggedBlock, mouseX, mouseY);
      
      // אם נמצא בלוק קרוב, הדגש אותו
      if (result && result.block) {
        // שמור את הבלוק המטרה והכיוון
        potentialSnapTarget = result.block;
        snapDirection = result.direction;
        
        // הדגש את שני הבלוקים
        highlightBlockForSnapping(draggedBlock, potentialSnapTarget, snapDirection);
        
        // הצג את אינדיקטור החיבור
        showConnectionIndicator(potentialSnapTarget, snapDirection);
      } else {
        potentialSnapTarget = null;
        snapDirection = null;
      }
    }
    
    // חיפוש הבלוק הקרוב ביותר להצמדה
    function findClosestBlockForSnap(draggedBlock, clientX, clientY) {
      if (!draggedBlock) return null;
      
      const blocks = programmingArea.querySelectorAll('.block-container');
      if (blocks.length < 2) return null; // צריך לפחות 2 בלוקים
      
      // קבלת המיקום של הבלוק הנגרר
      const draggedRect = draggedBlock.getBoundingClientRect();
      
      // חישוב מיקומי נקודות החיבור של הבלוק הנגרר
      const rightPinX = draggedRect.right;
      const rightPinY = draggedRect.top + draggedRect.height / 2;
      const leftSocketX = draggedRect.left;
      const leftSocketY = draggedRect.top + draggedRect.height / 2;
      
      let closestBlock = null;
      let minDistance = HIGHLIGHT_THRESHOLD;
      let bestDirection = null;
      
      // בדיקת כל בלוק
      blocks.forEach(block => {
        // דלג על הבלוק הנגרר עצמו
        if (block === draggedBlock) return;
        
        const blockRect = block.getBoundingClientRect();
        
        // בדיקת הצמדה משמאל לבלוק המטרה: הפין הימני שלנו לשקע השמאלי שלו
        const leftDistance = Math.sqrt(
          Math.pow(rightPinX - blockRect.left, 2) +
          Math.pow(rightPinY - (blockRect.top + blockRect.height / 2), 2)
        );
        
        // בדיקת הצמדה מימין לבלוק המטרה: השקע השמאלי שלנו לפין הימני שלו
        const rightDistance = Math.sqrt(
          Math.pow(leftSocketX - blockRect.right, 2) +
          Math.pow(leftSocketY - (blockRect.top + blockRect.height / 2), 2)
        );
        
        // בחירת הכיוון הטוב יותר
        let distance = Infinity;
        let direction = null;
        
        if (leftDistance < rightDistance) {
          distance = leftDistance;
          direction = 'left';
        } else {
          distance = rightDistance;
          direction = 'right';
        }
        
        // אם קרוב יותר מהמרחק המינימלי הקודם
        if (distance < minDistance) {
          minDistance = distance;
          closestBlock = block;
          bestDirection = direction;
        }
      });
      
      return closestBlock ? { block: closestBlock, direction: bestDirection } : null;
    }
    
    // הדגשת בלוקים לקראת הצמדה
    function highlightBlockForSnapping(draggedBlock, targetBlock, direction) {
      // הדגשת הבלוק הנגרר
      if (draggedBlock) {
        draggedBlock.classList.add('snap-source');
      }
      
      // הדגשת בלוק המטרה
      if (targetBlock) {
        targetBlock.classList.add('snap-target');
        
        // הדגשת החלק הרלוונטי לפי כיוון ההצמדה
        if (direction === 'left') {
          targetBlock.classList.add('snap-left');
        } else if (direction === 'right') {
          targetBlock.classList.add('snap-right');
        }
      }
    }
    
    // ניקוי כל ההדגשות
    function clearAllHighlights() {
      const highlightedBlocks = programmingArea.querySelectorAll('.snap-source, .snap-target, .snap-left, .snap-right');
      highlightedBlocks.forEach(block => {
        block.classList.remove('snap-source', 'snap-target', 'snap-left', 'snap-right');
      });
    }
    
    // איפוס מצב ההדגשה והמשתנים הגלובליים
    function resetHighlighting() {
      clearAllHighlights();
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
        
        if (direction === 'left') {
          // הצמדה משמאל לטרגט: הפין הימני של המקור לשקע השמאלי של היעד
          // מצמיד את הבלוק כך שקצהו הימני נמצא בדיוק על קצהו השמאלי של הבלוק היעד
          newLeft = targetRect.left - programRect.left - sourceRect.width;
          newTop = targetRect.top - programRect.top;
        } else {
          // הצמדה מימין לטרגט: השקע השמאלי של המקור לפין הימני של היעד
          // מצמיד את הבלוק כך שקצהו השמאלי נמצא בדיוק על קצהו הימני של הבלוק היעד
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
        
        console.log('הצמדה בוצעה בכיוון:', direction);
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
    
    // הוספת סגנונות CSS להדגשה ואנימציה
    
