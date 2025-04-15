// linkage-improved.js - הצמדת בלוקים עם חיווי ויזואלי
document.addEventListener('DOMContentLoaded', function() {
  console.log('טוען מערכת הצמדת בלוקים משופרת...');
  
  // מחכה שהדף יטען לגמרי כולל הסקריפטים האחרים
  setTimeout(function() {
    setupSnapping();
  }, 1000);
  
  function setupSnapping() {
    console.log('מפעיל מערכת הצמדה עם חיווי ויזואלי...');
    
    // קבועים
    const SNAP_THRESHOLD = 25; // מרחק מקסימלי בפיקסלים להצמדה
    const HIGHLIGHT_THRESHOLD = 50; // מרחק להתחלת הדגשה ויזואלית
    
    // איתור אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות לא נמצא!');
      return;
    }
    
    // משתנים גלובליים
    let currentDraggedBlock = null;
    let potentialSnapTarget = null;
    let snapDirection = null; // 'left' or 'right'
    
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
        
        // מסמנים את הבלוק כנגרר (בלי אפקטים ויזואליים)
        e.target.classList.add('dragging');
        
        // מיקום מקורי של הבלוק למקרה שנצטרך לשחזר אותו
        e.target.dataset.originalLeft = e.target.style.left || '';
        e.target.dataset.originalTop = e.target.style.top || '';
        
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
    
    // צעד 5: מאזין לתזוזת העכבר לזיהוי קרבה בין בלוקים
    programmingArea.addEventListener('mousemove', function(e) {
      // בדיקה אם יש בלוק בגרירה פעילה
      if (!currentDraggedBlock) return;
      
      // עדכון מיקום הבלוק הנגרר אם אנחנו צריכים לעשות זאת ידנית
      // זה לרוב לא נדרש כי הדפדפן מטפל בזה, אבל אם יש צורך אפשר להוסיף כאן
      
      // בדיקה אם יש בלוק פוטנציאלי להצמדה בקרבת מקום
      checkForSnapTarget(currentDraggedBlock, e.clientX, e.clientY);
    });
    
    // ---- פונקציות עזר ----
    
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
    
    // הוספת סגנונות CSS להדגשה ואנימציה
    function addHighlightStyles() {
      // יצירת אלמנט style
      const style = document.createElement('style');
      style.textContent = `
        /* הדגשת בלוק מקור (הנגרר) כשקרוב להצמדה */
        .snap-source .scratch-block {
          box-shadow: 0 0 10px 4px rgba(0, 180, 255, 0.8) !important;
          filter: brightness(1.05);
          transition: all 0.15s ease-out;
        }
        
        /* הדגשת בלוק יעד */
        .snap-target .scratch-block {
          box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.6) !important;
          filter: brightness(1.1);
          transition: all 0.15s ease-out;
        }
        
        /* הדגשת השקע השמאלי בבלוק היעד */
        .snap-left .scratch-block::before {
          background-color: rgba(255, 255, 255, 0.8) !important;
          box-shadow: inset 0 0 4px 1px rgba(255, 255, 255, 0.8) !important;
          transition: all 0.15s ease-out;
        }
        
        /* הדגשת הפין הימני בבלוק היעד */
        .snap-right .scratch-block::after {
          box-shadow: 0 0 4px 1px rgba(255, 255, 0, 0.6) !important;
          transition: all 0.15s ease-out;
        }
        
        /* בלוק בזמן גרירה - הוספת הילה */
        .block-container.dragging .scratch-block {
          box-shadow: 0 0 12px 3px rgba(100, 200, 255, 0.6) !important;
          transition: box-shadow 0.2s ease-out;
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
        
        /* סימון בלוקים מחוברים */
        .connected-block, .has-connected-block {
          filter: brightness(1.02);
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
        clearAllHighlights();
      });
    }
  }
});
