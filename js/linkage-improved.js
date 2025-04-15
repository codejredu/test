// קוד גרירת בלוקים עם הילה בהתקרבות
document.addEventListener('DOMContentLoaded', function() {
  console.log('טוען מערכת גרירת בלוקים...');
  
  // מחכה שהדף יטען לגמרי כולל הסקריפטים האחרים
  setTimeout(function() {
    setupDragging();
  }, 1000);
  
  function setupDragging() {
    console.log('מפעיל מערכת גרירה...');
    
    // קבועים שניתן לכוונן
    let PROXIMITY_THRESHOLD = 5; // ברירת מחדל: 5 פיקסלים למרחק התקרבות
    
    // הוספת כפתור לשינוי סף הקרבה
    addProximityControl();
    
    // איתור אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות לא נמצא!');
      return;
    }
    
    // משתנים גלובליים
    let currentDraggedBlock = null;
    let nearbyBlock = null;
    
    // הוספת סגנונות להילה
    addHighlightStyles();
    
    // מאזין לאירוע dragstart - כאשר מתחילים לגרור בלוק
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
        
        // עדכון תצוגת הבלוק בזמן אמת
        updateDraggedBlockPosition(e);
      }
    });
    
    // מאזין לאירוע dragend - כאשר מסיימים לגרור בלוק
    programmingArea.addEventListener('dragend', function(e) {
      if (e.target.classList.contains('block-container')) {
        console.log('סיום גרירה נתפס באזור התכנות');
        
        // הסרת הסימון
        e.target.classList.remove('dragging');
        
        // בדיקה אם יש בלוק קרוב וההילה מופיעה
        if (nearbyBlock && 
            (e.target.classList.contains('proximity-source') || 
             nearbyBlock.classList.contains('proximity-target'))) {
          console.log('יש הילה - מבצע חיבור');
          connectBlocks(e.target, nearbyBlock);
        } else {
          console.log('אין הילה - לא מבצע חיבור');
        }
        
        // נקה את המצב והילות
        clearAllHighlights();
        currentDraggedBlock = null;
        nearbyBlock = null;
      }
    });
    
    // מאזין לאירוע dragover - כאשר גוררים מעל אזור התכנות
    programmingArea.addEventListener('dragover', function(e) {
      if (currentDraggedBlock) {
        e.preventDefault(); // חייב למניעת התנהגות ברירת מחדל
        updateDraggedBlockPosition(e);
        
        // בדיקת קרבה לבלוקים אחרים
        checkProximityToOtherBlocks();
      }
    });
    
    // מאזין לאירוע mousemove - לעדכון רציף של מיקום הבלוק
    programmingArea.addEventListener('mousemove', function(e) {
      if (currentDraggedBlock && currentDraggedBlock.classList.contains('dragging')) {
        updateDraggedBlockPosition(e);
        
        // בדיקת קרבה לבלוקים אחרים
        checkProximityToOtherBlocks();
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
    
    // פונקציה לבדיקת קרבה לבלוקים אחרים
    function checkProximityToOtherBlocks() {
      if (!currentDraggedBlock) return;
      
      // נקה הילות קודמות
      clearAllHighlights();
      nearbyBlock = null;
      
      // קבלת כל הבלוקים באזור התכנות
      const blocks = programmingArea.querySelectorAll('.block-container');
      if (blocks.length < 2) return; // צריך לפחות 2 בלוקים
      
      // קבלת המיקום של הבלוק הנגרר
      const draggedRect = currentDraggedBlock.getBoundingClientRect();
      
      // משתנה לשמירת הבלוק הקרוב ביותר
      let closestBlock = null;
      let minDistance = Infinity;
      
      // חישוב מרכז הבלוק הנגרר
      const draggedCenterX = draggedRect.left + draggedRect.width / 2;
      const draggedCenterY = draggedRect.top + draggedRect.height / 2;
      
      // בדיקת כל בלוק
      blocks.forEach(block => {
        // דלג על הבלוק הנגרר עצמו
        if (block === currentDraggedBlock) return;
        
        const blockRect = block.getBoundingClientRect();
        
        // חישוב מרכז הבלוק הנבדק
        const blockCenterX = blockRect.left + blockRect.width / 2;
        const blockCenterY = blockRect.top + blockRect.height / 2;
        
        // חישוב המרחק בין מרכזי הבלוקים
        const distance = Math.sqrt(
          Math.pow(draggedCenterX - blockCenterX, 2) +
          Math.pow(draggedCenterY - blockCenterY, 2)
        );
        
        // חישוב המרחק האופקי בין קצוות הבלוקים
        let horizontalGap;
        if (draggedRect.right < blockRect.left) {
          // הבלוק הנגרר משמאל לבלוק הנבדק
          horizontalGap = blockRect.left - draggedRect.right;
        } else if (draggedRect.left > blockRect.right) {
          // הבלוק הנגרר מימין לבלוק הנבדק
          horizontalGap = draggedRect.left - blockRect.right;
        } else {
          // יש חפיפה אופקית
          horizontalGap = 0;
        }
        
        // אם הבלוקים קרובים אופקית וגם באותו גובה בערך
        const verticalMatch = Math.abs(draggedRect.top - blockRect.top) < 20;
        
        // אם הבלוקים קרובים מספיק אופקית ובאותו גובה בערך
        if (horizontalGap <= PROXIMITY_THRESHOLD && verticalMatch && horizontalGap < minDistance) {
          minDistance = horizontalGap;
          closestBlock = block;
        }
      });
      
      // אם נמצא בלוק קרוב מספיק, הדגש אותו
      if (closestBlock) {
        console.log('נמצא בלוק קרוב במרחק:', minDistance, 'פיקסלים. מציג הילה.');
        nearbyBlock = closestBlock;
        highlightBlocks(currentDraggedBlock, nearbyBlock);
      } else {
        console.log('לא נמצא בלוק קרוב מספיק.');
      }
    }
    
    // פונקציה להדגשת בלוקים קרובים
    function highlightBlocks(draggedBlock, targetBlock) {
      if (!draggedBlock || !targetBlock) return;
      
      console.log('מוסיף הילה לבלוקים');
      
      // הוספת קלאס להילה לבלוק הנגרר
      draggedBlock.classList.add('proximity-source');
      
      // הוספת קלאס להילה לבלוק המטרה
      targetBlock.classList.add('proximity-target');
      
      // בדיקת החלה מוצלחת של ההילה
      setTimeout(() => {
        if (draggedBlock.classList.contains('proximity-source') && 
            targetBlock.classList.contains('proximity-target')) {
          console.log('ההילה הופעלה בהצלחה');
        } else {
          console.log('בעיה בהפעלת ההילה');
        }
      }, 50);
    }
    
    // פונקציה לניקוי כל ההילות
    function clearAllHighlights() {
      const highlightedBlocks = programmingArea.querySelectorAll('.proximity-source, .proximity-target');
      highlightedBlocks.forEach(block => {
        block.classList.remove('proximity-source', 'proximity-target');
      });
    }
    
    // פונקציה לחיבור בלוקים (התממשקות)
    function connectBlocks(sourceBlock, targetBlock) {
      if (!sourceBlock || !targetBlock) return;
      
      try {
        const sourceRect = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();
        
        // קביעת כיוון החיבור
        let direction;
        let newLeft, newTop;
        
        // חישוב מרכזי הבלוקים
        const sourceCenterX = sourceRect.left + sourceRect.width / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        
        // גודל הפין והשקע - מרווח להצמדה מדויקת
        const PIN_SIZE = 2; // הפין בולט 2 פיקסלים - מרווח קטן יותר בדיוק כמו בתמונה
        
        if (sourceCenterX < targetCenterX) {
          // המקור משמאל ליעד - החלק הימני (פין) מתחבר לחלק השמאלי (שקע)
          direction = 'left-to-right';
          
          // הפאות כמעט צמודות - הפין (צד ימין של המקור) נכנס לשקע (צד שמאל של היעד)
          // בתמונה שהראית - הפאות ממש צמודות עם חפיפה מינימלית
          newLeft = targetRect.left - sourceRect.width + PIN_SIZE - programRect.left;
          newTop = targetRect.top - programRect.top;
          
          // הפין בשכבה עליונה
          sourceBlock.style.zIndex = "110";
          targetBlock.style.zIndex = "100";
        } else {
          // המקור מימין ליעד - החלק השמאלי (שקע) מתחבר לחלק הימני (פין)
          direction = 'right-to-left';
          
          // הפאות כמעט צמודות - השקע (צד שמאל של המקור) מקבל את הפין (צד ימין של היעד)
          newLeft = targetRect.right - PIN_SIZE - programRect.left;
          newTop = targetRect.top - programRect.top;
          
          // הפין בשכבה עליונה
          sourceBlock.style.zIndex = "100";
          targetBlock.style.zIndex = "110";
        }
        
        // עדכון מיקום הבלוק המקור
        sourceBlock.style.position = 'absolute';
        sourceBlock.style.left = newLeft + 'px';
        sourceBlock.style.top = newTop + 'px';
        
        // הוספת סימון לבלוקים המחוברים
        sourceBlock.classList.add('connected-block');
        targetBlock.classList.add('has-connected-block');
        
        // שמירת יחס החיבור לשימוש עתידי
        sourceBlock.setAttribute('data-connected-to', targetBlock.id || generateUniqueId(targetBlock));
        sourceBlock.setAttribute('data-connection-direction', direction);
        
        // אפקט ויזואלי של התממשקות
        addConnectionAnimation(sourceBlock, targetBlock);
        
        console.log('בוצעה התממשקות בכיוון:', direction);
      } catch (err) {
        console.error('שגיאה בהתממשקות בלוקים:', err);
      }
    }
    
    // פונקציה ליצירת מזהה ייחודי לבלוק
    function generateUniqueId(block) {
      if (!block.id) {
        const uniqueId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        block.id = uniqueId;
      }
      return block.id;
    }
    
    // פונקציה להוספת אנימציית התממשקות
    function addConnectionAnimation(sourceBlock, targetBlock) {
      // הוספת אפקט הבהוב לשני הבלוקים
      sourceBlock.classList.add('connection-animation');
      targetBlock.classList.add('connection-animation');
      
      // הסרת האפקט אחרי שניה
      setTimeout(() => {
        sourceBlock.classList.remove('connection-animation');
        targetBlock.classList.remove('connection-animation');
      }, 1000);
    }
    
    // מאזין לאירוע drop - כאשר משחררים בלוק באזור התכנות
    programmingArea.addEventListener('drop', function(e) {
      console.log('אירוע drop נתפס באזור התכנות');
      e.preventDefault();
    });
    
    // הוספת סגנונות CSS להילה ולהתממשקות
    function addHighlightStyles() {
      // יצירת אלמנט style
      const style = document.createElement('style');
      style.textContent = `
        /* הילה צהובה למקור (הבלוק הנגרר) */
        .proximity-source {
          position: relative;
          outline: 2px dashed #0066cc;
          background-color: rgba(255, 255, 0, 0.3) !important;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
        }
        
        /* הילה צהובה למטרה (הבלוק הקרוב) */
        .proximity-target {
          position: relative;
          outline: 2px dashed #0066cc;
          background-color: rgba(255, 255, 0, 0.3) !important;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
        }
        
        /* סגנונות לבלוקים מחוברים - פין ושקע */
        /* בלוק שמתחבר משמאל לימין (הפין בצד ימין) */
        .connected-block[data-connection-direction="left-to-right"] {
          position: relative;
        }
        
        .connected-block[data-connection-direction="left-to-right"]::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background-color: #0066cc;
          border-radius: 4px;
          right: -4px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 120;
        }
        
        /* בלוק שמתחבר מימין לשמאל (השקע בצד שמאל) */
        .connected-block[data-connection-direction="right-to-left"] {
          position: relative;
        }
        
        .connected-block[data-connection-direction="right-to-left"]::before {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background-color: #f5f5f5;
          border: 1px solid #cccccc;
          border-radius: 4px;
          left: -4px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 110;
        }
        
        /* וגם בלוק שיש לו חיבור */
        .has-connected-block {
          position: relative;
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
        
        /* סימון ויזואלי לבלוקים מחוברים */
        .connected-block .scratch-block {
          box-shadow: 0 0 5px rgba(0, 102, 204, 0.5);
        }
        
        .has-connected-block .scratch-block {
          box-shadow: 0 0 5px rgba(0, 102, 204, 0.5);
        }
      `;
      
      // הוספה לראש המסמך
      document.head.appendChild(style);
    }
    
    // פונקציה להוספת שליטה על סף הקרבה
    function addProximityControl() {
      // בדיקה אם הפקד כבר קיים
      if (document.getElementById('proximity-control')) return;
      
      // יצירת מיכל לפקדים
      const controlContainer = document.createElement('div');
      controlContainer.id = 'proximity-control';
      controlContainer.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #f0f0f0; padding: 10px; border: 1px solid #ccc; border-radius: 5px; z-index: 1000;';
      
      // כותרת
      const title = document.createElement('div');
      title.textContent = 'הגדרת סף קרבה (פיקסלים):';
      title.style.marginBottom = '5px';
      controlContainer.appendChild(title);
      
      // מחוון (סליידר)
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '1';
      slider.max = '50';
      slider.value = PROXIMITY_THRESHOLD;
      slider.style.width = '150px';
      controlContainer.appendChild(slider);
      
      // תצוגת ערך
      const valueDisplay = document.createElement('span');
      valueDisplay.textContent = PROXIMITY_THRESHOLD;
      valueDisplay.style.marginLeft = '10px';
      controlContainer.appendChild(valueDisplay);
      
      // האזנה לשינויים
      slider.addEventListener('input', function() {
        PROXIMITY_THRESHOLD = parseInt(this.value);
        valueDisplay.textContent = PROXIMITY_THRESHOLD;
      });
      
      // הוספה למסמך
      document.body.appendChild(controlContainer);
    }
    
    // מאזין לכפתור "נקה הכל"
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        // ניקוי משתנים גלובליים
        currentDraggedBlock = null;
        nearbyBlock = null;
        clearAllHighlights();
        
        // הסרת סימוני חיבור מכל הבלוקים
        const connectedBlocks = programmingArea.querySelectorAll('.connected-block, .has-connected-block');
        connectedBlocks.forEach(block => {
          block.classList.remove('connected-block', 'has-connected-block');
          block.removeAttribute('data-connected-to');
          block.removeAttribute('data-connection-direction');
          block.style.zIndex = '';
        });
      });
    }
  }
});
