// block-connection.js - מנגנוני הצמדה וניתוק משופרים
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
    
    // הוספת סגנונות להדגשה ויזואלית באופן דינמי
    addHighlightStyles();
    
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
      
      // חפש בלוק קרוב להצמדה
      const result = findClosestBlockForSnap(draggedBlock, mouseX, mouseY);
      
      // אם נמצא בלוק קרוב, הדגש אותו
      if (result && result.block) {
        // שמור את הבלוק המטרה והכיוון
        potentialSnapTarget = result.block;
        snapDirection = result.direction;
        
        // הדגש את שני הבלוקים
        highlightBlockForSnapping(draggedBlock, potentialSnapTarget, snapDirection);
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
    function addHighlightStyles() {
      // יצירת אלמנט style
      const style = document.createElement('style');
      style.textContent = `
        /* הדגשת בלוק מקור (הנגרר) כשקרוב להצמדה */
        .snap-source .block-svg-image,
        .snap-source img {
          filter: brightness(1.05);
          transition: all 0.15s ease-out;
          box-shadow: 0 0 8px 2px rgba(0, 180, 255, 0.6);
        }
        
        /* הדגשת בלוק יעד */
        .snap-target .block-svg-image,
        .snap-target img {
          filter: brightness(1.1);
          transition: all 0.15s ease-out;
          box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.6);
        }
        
        /* הדגשת השקע השמאלי בבלוק היעד */
        .snap-left::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 18px;
          background-color: rgba(255, 255, 100, 0.8);
          border-radius: 0 3px 3px 0;
          z-index: 10;
        }
        
        /* הדגשת הפין הימני בבלוק היעד */
        .snap-right::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 18px;
          background-color: rgba(255, 255, 100, 0.8);
          border-radius: 3px 0 0 3px;
          z-index: 10;
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
        
        /* סימון בלוקים מחוברים */
        .connected-block {
          filter: brightness(1.02);
        }
        
        .has-connected-block {
          position: relative;
        }
        
        /* סימון חיבור ויזואלי - קו דק בין בלוקים מחוברים */
        .connected-block[data-connection-direction="right"]::after,
        .has-connected-block[data-connection-direction="left"]::before {
          content: '';
          position: absolute;
          width: 4px;
          height: 12px;
          background-color: rgba(255, 255, 0, 0.4);
          z-index: 5;
        }
        
        /* עיצוב התפריט הקשר */
        .detach-context-menu {
          min-width: 120px;
          font-family: Arial, sans-serif;
          font-size: 14px;
        }
      `;
      
      // הוספה לראש המסמך
      document.head.appendChild(style);
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
      });
    }
  }
});
