// block-connection.js - מנגנוני הצמדה וניתוק משופרים עם אינדיקטור חיבור בולט
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
      const blockContainer = findParentBlockContainer(e.target);
      if (blockContainer) {
        // שמירת הבלוק הנגרר
        currentDraggedBlock = blockContainer;
        
        // מניעת יצירת רוח רפאים - הגדרת התמונה שתיווצר בזמן גרירה
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        
        // מסמנים את הבלוק כנגרר
        blockContainer.classList.add('dragging');
        
        // מיקום מקורי של הבלוק למקרה שנצטרך לשחזר אותו
        blockContainer.dataset.originalLeft = blockContainer.style.left || '';
        blockContainer.dataset.originalTop = blockContainer.style.top || '';
        
        // אם הבלוק היה מחובר, נתק אותו
        if (isBlockConnected(blockContainer)) {
          detachBlock(blockContainer);
        }
        
        // הסתרת האינדיקטור אם הוא מוצג
        hideConnectionIndicator();
        
        // עדכון תצוגת הבלוק בזמן אמת
        updateDraggedBlockPosition(e);
        
        console.log('התחלת גרירה של בלוק:', blockContainer.dataset.type || 'לא ידוע');
      }
    });
    
    // צעד 2: ניקוי הסימון בסיום הגרירה
    programmingArea.addEventListener('dragend', function(e) {
      const blockContainer = findParentBlockContainer(e.target);
      if (blockContainer) {
        console.log('סיום גרירה נתפס באזור התכנות');
        
        // הסרת הסימון
        blockContainer.classList.remove('dragging');
        
        // בדוק אם יש הצמדה אפשרית בין בלוקים
        checkForPossibleSnapAfterDrag(blockContainer);
        
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
      if (document.getElementById('connection-indicator')) {
        connectionIndicator = document.getElementById('connection-indicator');
        return;
      }
      
      // יצירת אלמנט האינדיקטור
      connectionIndicator = document.createElement('div');
      connectionIndicator.id = 'connection-indicator';
      connectionIndicator.style.position = 'absolute';
      connectionIndicator.style.display = 'none';
      connectionIndicator.style.pointerEvents = 'none'; // שלא יפריע לאירועי עכבר
      connectionIndicator.style.zIndex = '2000';
      
      // הוספת האינדיקטור לאזור התכנות
      programmingArea.appendChild(connectionIndicator);
      
      console.log('נוצר אינדיקטור חיבור');
    }
    
    // הצגת אינדיקטור החיבור - גרסה משופרת ובולטת יותר
    function showConnectionIndicator(targetBlock, direction) {
      if (!connectionIndicator || !targetBlock) return;
      
      console.log('מציג אינדיקטור חיבור עבור:', 
                  targetBlock.dataset.type || 'לא מזוהה', 
                  'בכיוון:', direction);
      
      const targetRect = targetBlock.getBoundingClientRect();
      const programRect = programmingArea.getBoundingClientRect();
      
      // קביעת גודל האינדיקטור - גדול יותר ובולט יותר
      connectionIndicator.style.width = '15px';
      connectionIndicator.style.height = targetRect.height + 'px';
      
      // קביעת צבע האינדיקטור בהתאם לסוג הבלוק
      let indicatorColor = 'rgba(0, 255, 0, 0.8)'; // ברירת מחדל - ירוק בהיר
      
      // ניסיון לקבוע צבע לפי קטגוריית הבלוק
      const category = targetBlock.dataset.category;
      if (category) {
        switch(category) {
          case 'motion': indicatorColor = 'rgba(102, 210, 255, 0.7)'; break; // כחול
          case 'looks': indicatorColor = 'rgba(210, 149, 246, 0.7)'; break; // סגול
          case 'sound': indicatorColor = 'rgba(126, 217, 87, 0.7)'; break; // ירוק
          case 'control': indicatorColor = 'rgba(255, 189, 103, 0.7)'; break; // כתום
          case 'end': indicatorColor = 'rgba(255, 107, 107, 0.7)'; break; // אדום
          case 'triggering': indicatorColor = 'rgba(255, 232, 102, 0.7)'; break; // צהוב
        }
      }
      
      connectionIndicator.style.backgroundColor = indicatorColor;
      connectionIndicator.style.boxShadow = `0 0 20px 5px ${indicatorColor}`;
      connectionIndicator.style.borderRadius = '6px';
      
      // קביעת מיקום האינדיקטור בהתאם לכיוון החיבור
      if (direction === 'left') {
        connectionIndicator.style.left = (targetRect.left - programRect.left - 15) + 'px';
        connectionIndicator.style.top = (targetRect.top - programRect.top) + 'px';
      } else if (direction === 'right') {
        connectionIndicator.style.left = (targetRect.right - programRect.left) + 'px';
        connectionIndicator.style.top = (targetRect.top - programRect.top) + 'px';
      }
      
      // הוספת אנימציה לאינדיקטור
      connectionIndicator.style.animation = 'none'; // איפוס אנימציה קודמת
      setTimeout(() => {
        connectionIndicator.style.animation = 'pulseIndicator 1.2s infinite ease-in-out';
      }, 10);
      
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
      menu.style.zIndex = '9999';
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
    
    // הדגשת בלוקים לקראת הצמדה - גרסה משופרת שעובדת טוב יותר עם מבנה ה-DOM
    function highlightBlockForSnapping(draggedBlock, targetBlock, direction) {
      if (!draggedBlock || !targetBlock) return;
      
      console.log('מדגיש בלוקים לקראת הצמדה:', 
                  draggedBlock.dataset.type || 'לא ידוע', 
                  targetBlock.dataset.type || 'לא ידוע', 
                  direction);
      
      // הדגשת הבלוק הנגרר - בצורה ישירה
      draggedBlock.classList.add('snap-source');
      
      // הדגשת בלוק המטרה
      targetBlock.classList.add('snap-target');
      
      // הדגשת החלק הרלוונטי לפי כיוון ההצמדה
      if (direction === 'left') {
        targetBlock.classList.add('snap-left');
      } else if (direction === 'right') {
        targetBlock.classList.add('snap-right');
      }

      // ניסיון נוסף להדגיש את הבלוקים - גם בצורה ישירה לסגנון
      try {
        // מציאת תמונת ה-SVG או התמונה בתוך הבלוק
        const draggedImg = draggedBlock.querySelector('img, .block-svg-image');
        const targetImg = targetBlock.querySelector('img, .block-svg-image');
        
        if (draggedImg) {
          draggedImg.style.filter = 'brightness(1.1)';
          draggedImg.style.boxShadow = '0 0 12px 4px rgba(0, 180, 255, 0.7)';
        }
        
        if (targetImg) {
          targetImg.style.filter = 'brightness(1.1)';
          targetImg.style.boxShadow = '0 0 12px 4px rgba(255, 255, 0, 0.7)';
        }
        
        // כאמצעי נוסף, נסה להגדיר סגנון ישירות על הבלוק עצמו
        draggedBlock.style.boxShadow = '0 0 12px 4px rgba(0, 180, 255, 0.7)';
        targetBlock.style.boxShadow = '0 0 12px 4px rgba(255, 255, 0, 0.7)';
      } catch (err) {
        console.warn('לא הצלחנו להחיל סגנון ישירות:', err);
      }
    }
    
    // ניקוי כל ההדגשות
    function clearAllHighlights() {
      const highlightedBlocks = programmingArea.querySelectorAll('.snap-source, .snap-target, .snap-left, .snap-right');
      highlightedBlocks.forEach(block => {
        // הסרת המחלקות
        block.classList.remove('snap-source', 'snap-target', 'snap-left', 'snap-right');
        
        // איפוס הסגנונות הישירים
        try {
          block.style.boxShadow = '';
          block.style.filter = '';
          
          // ניסיון לאפס גם את הסגנונות של התמונות
          const img = block.querySelector('img, .block-svg-image');
          if (img) {
            img.style.boxShadow = '';
            img.style.filter = '';
          }
        } catch (err) {
          console.warn('שגיאה בניקוי הדגשות:', err);
        }
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
          newLeft = targetRect.left - programRect.left - sourceRect
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
    
    // הוספת סגנונות CSS להדגשה ואנימציה - גרסה משופרת
    function addHighlightStyles() {
      // בדיקה אם כבר קיים אלמנט סגנון למניעת כפילות
      if (document.getElementById('block-connection-styles')) return;
      
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
      `;
      
      // הוספה לראש המסמך
      document.head.appendChild(style);
      console.log('נוספו סגנונות CSS להדגשה ואנימציה');
    }
    
    // מאזין לכפתור "נקה הכל"
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        // ניקוי משתנים גלובליים
        currentDraggedBlock = null;
        potentialSnapTarget = null;
        snapDirection = null;
        lastClickedBlock = null;
        lastRightClickedBlock = null;
        clearAllHighlights();
        removeDetachMenu();
        hideConnectionIndicator();
        console.log('בוצע ניקוי כללי');
      });
    }
  }
});
