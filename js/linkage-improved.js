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
    const HIGHLIGHT_THRESHOLD = 50; // מרחק להתחלת הדגשה ויזואלית (גדול יותר מסף ההצמדה)
    
    // איתור אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות לא נמצא!');
      return;
    }
    
    // משתנים גלובליים
    let draggedBlock = null;
    let potentialSnapTarget = null;
    let snapDirection = null; // 'left' or 'right' - האם ההצמדה משמאל או מימין
    
    // הוספת סגנונות להדגשה ויזואלית באופן דינמי
    addHighlightStyles();
    
    // מאזין לאירועי dragstart כדי לדעת איזה בלוק נגרר
    programmingArea.addEventListener('dragstart', function(e) {
      if (e.target.classList.contains('block-container')) {
        draggedBlock = e.target;
        // הוספת מסגרת לבלוק הנגרר עצמו
        draggedBlock.classList.add('dragging');
        console.log('התחלת גרירה:', draggedBlock.dataset.type);
      }
    });
    
    // מאזין לאירועי drag כדי לחפש בלוקים קרובים בזמן גרירה
    programmingArea.addEventListener('drag', function(e) {
      if (!draggedBlock || !e.clientX) return; // אם אין בלוק נגרר או מיקום לא תקף
      
      // נקה הדגשות קודמות
      clearSnapHighlights();
      
      // חפש בלוק קרוב להצמדה, כולל הכיוון
      const result = findClosestBlock(e.clientX, e.clientY);
      
      // אם נמצא בלוק מתאים, הדגש אותו
      if (result && result.block) {
        highlightSnapTarget(result.block, result.direction);
        potentialSnapTarget = result.block;
        snapDirection = result.direction;
      } else {
        potentialSnapTarget = null;
        snapDirection = null;
      }
    });
    
    // מאזין לאירועי dragend כדי לבצע הצמדה
    programmingArea.addEventListener('dragend', function(e) {
      if (draggedBlock) {
        // הסרת המסגרת מהבלוק הנגרר
        draggedBlock.classList.remove('dragging');
        
        // אם יש בלוק מטרה להצמדה
        if (potentialSnapTarget && snapDirection) {
          // בצע הצמדה בכיוון המתאים
          snapBlocks(draggedBlock, potentialSnapTarget, snapDirection);
          
          // אפס את המצב אחרי ההצמדה
          setTimeout(() => {
            clearSnapHighlights();
            draggedBlock = null;
            potentialSnapTarget = null;
            snapDirection = null;
          }, 50);
        }
      }
    });
    
    // מאזין גם ל-mouseup גלובלי למקרה שה-dragend לא נתפס
    window.addEventListener('mouseup', function() {
      if (draggedBlock) {
        // הסרת המסגרת מהבלוק הנגרר
        draggedBlock.classList.remove('dragging');
        
        // אם יש בלוק מטרה להצמדה
        if (potentialSnapTarget && snapDirection) {
          // בצע הצמדה בכיוון המתאים
          snapBlocks(draggedBlock, potentialSnapTarget, snapDirection);
          
          // אפס את המצב אחרי ההצמדה
          setTimeout(() => {
            clearSnapHighlights();
            draggedBlock = null;
            potentialSnapTarget = null;
            snapDirection = null;
          }, 50);
        } else {
          // נקה הדגשות בכל מקרה
          clearSnapHighlights();
          draggedBlock = null;
        }
      }
    });
    
    // מחפש את הבלוק הקרוב ביותר להצמדה, ומחזיר את הכיוון (ימין/שמאל)
    function findClosestBlock(clientX, clientY) {
      if (!draggedBlock) return null;
      
      const blocks = programmingArea.querySelectorAll('.block-container');
      if (blocks.length < 2) return null; // דרושים לפחות 2 בלוקים
      
      // קבלת המיקום של הבלוק הנגרר
      const draggedRect = draggedBlock.getBoundingClientRect();
      
      // חישוב מיקום הפין הימני של הבלוק הנגרר (לחיבור משמאל)
      const rightConnectorX = draggedRect.right;
      const rightConnectorY = draggedRect.top + (draggedRect.height / 2);
      
      // חישוב מיקום השקע השמאלי של הבלוק הנגרר (לחיבור מימין)
      const leftConnectorX = draggedRect.left;
      const leftConnectorY = draggedRect.top + (draggedRect.height / 2);
      
      let closestBlock = null;
      let minDistance = HIGHLIGHT_THRESHOLD; // מרחק מינימלי להתחלת הדגשה
      let bestDirection = null;
      
      // בדיקת כל בלוק
      blocks.forEach(block => {
        // דלג על הבלוק עצמו
        if (block === draggedBlock) return;
        
        const blockRect = block.getBoundingClientRect();
        
        // בדיקת חיבור משמאל: פין ימני של הנגרר לשקע שמאלי של היעד
        const leftConnectDistance = Math.sqrt(
          Math.pow(rightConnectorX - blockRect.left, 2) +
          Math.pow(rightConnectorY - (blockRect.top + blockRect.height / 2), 2)
        );
        
        // בדיקת חיבור מימין: שקע שמאלי של הנגרר לפין ימני של היעד
        const rightConnectDistance = Math.sqrt(
          Math.pow(leftConnectorX - blockRect.right, 2) +
          Math.pow(leftConnectorY - (blockRect.top + blockRect.height / 2), 2)
        );
        
        // בחירת הכיוון הטוב יותר
        let direction = null;
        let distance = Infinity;
        
        if (leftConnectDistance < rightConnectDistance) {
          direction = 'left'; // חיבור משמאל לטרגט (פין ימני שלנו לשקע שמאלי שלו)
          distance = leftConnectDistance;
        } else {
          direction = 'right'; // חיבור מימין לטרגט (שקע שמאלי שלנו לפין ימני שלו)
          distance = rightConnectDistance;
        }
        
        // אם קרוב יותר מהקודם ובטווח ההדגשה
        if (distance < minDistance) {
          minDistance = distance;
          closestBlock = block;
          bestDirection = direction;
        }
      });
      
      // אם המרחק קטן מסף ההצמדה, מחזיר את הבלוק הקרוב והכיוון
      return closestBlock ? { block: closestBlock, direction: bestDirection } : null;
    }
    
    // הדגשת בלוק יעד פוטנציאלי להצמדה, כולל הכיוון
    function highlightSnapTarget(block, direction) {
      if (!block || !draggedBlock) return;
      
      // הדגשת הבלוק הנגרר
      draggedBlock.classList.add('dragging-highlight');
      
      // מוצא את אלמנט ה-scratch-block בבלוקים
      const targetScratchBlock = block.querySelector('.scratch-block');
      
      if (targetScratchBlock) {
        // שמירת הסגנון המקורי לשחזור מאוחר יותר
        if (!targetScratchBlock.dataset.originalBoxShadow) {
          targetScratchBlock.dataset.originalBoxShadow = targetScratchBlock.style.boxShadow || '';
        }
        
        // הוספת הדגשה ויזואלית לבלוק המטרה
        block.classList.add('snap-highlight');
        
        // מדגיש את החלק הרלוונטי לפי הכיוון
        if (direction === 'left') {
          // הדגשת השקע השמאלי בבלוק המטרה
          block.classList.add('highlight-left-connector');
        } else if (direction === 'right') {
          // הדגשת הפין הימני בבלוק המטרה
          block.classList.add('highlight-right-connector');
        }
      }
    }
    
    // ניקוי כל ההדגשות
    function clearSnapHighlights() {
      // מסיר את כל סימוני ההדגשה
      const highlightedBlocks = programmingArea.querySelectorAll('.snap-highlight, .dragging-highlight');
      highlightedBlocks.forEach(block => {
        block.classList.remove('snap-highlight', 'highlight-left-connector', 'highlight-right-connector', 'dragging-highlight');
        
        // שחזור סגנון המקורי
        const scratchBlock = block.querySelector('.scratch-block');
        if (scratchBlock && scratchBlock.dataset.originalBoxShadow !== undefined) {
          scratchBlock.style.boxShadow = scratchBlock.dataset.originalBoxShadow;
          delete scratchBlock.dataset.originalBoxShadow;
        }
      });
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
          newLeft = targetRect.left - programRect.left - sourceRect.width + 9; // 9 פיקסלים לחפיפה מדויקת
          newTop = targetRect.top - programRect.top;
        } else {
          // הצמדה מימין לטרגט: השקע השמאלי של המקור לפין הימני של היעד
          newLeft = targetRect.right - programRect.left - 9; // 9 פיקסלים לחפיפה מדויקת
          newTop = targetRect.top - programRect.top;
        }
        
        // עדכון מיקום הבלוק
        sourceBlock.style.position = 'absolute';
        sourceBlock.style.left = newLeft + 'px';
        sourceBlock.style.top = newTop + 'px';
        
        // הוספת סימון חיבור
        sourceBlock.classList.add('connected-block');
        targetBlock.classList.add('has-connected-block');
        
        // סימון כיוון החיבור
        if (direction === 'left') {
          sourceBlock.setAttribute('data-connected-direction', 'left-to-target');
          targetBlock.setAttribute('data-connected-direction', 'source-to-left');
        } else {
          sourceBlock.setAttribute('data-connected-direction', 'right-to-target');
          targetBlock.setAttribute('data-connected-direction', 'source-to-right');
        }
        
        // אפקט ויזואלי קטן בזמן ההצמדה
        addSnapEffectAnimation(sourceBlock);
        
        console.log('הצמדה בוצעה! כיוון:', direction);
      } catch (err) {
        console.error('שגיאה בהצמדת בלוקים:', err);
      }
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
        /* הדגשת בלוק פוטנציאלי להצמדה */
        .snap-highlight .scratch-block {
          box-shadow: 0 0 10px 2px rgba(255, 255, 0, 0.7) !important;
          filter: brightness(1.1);
          transition: all 0.15s ease-out;
        }
        
        /* הדגשת הבלוק הנגרר כשקרוב להצמדה */
        .dragging-highlight .scratch-block {
          box-shadow: 0 0 10px 3px rgba(0, 180, 255, 0.7) !important;
          filter: brightness(1.15);
          transition: all 0.15s ease-out;
        }
        
        /* מסגרת רמז קלה לבלוק נגרר */
        .block-container.dragging .scratch-block {
          outline: 2px dashed rgba(0, 180, 255, 0.5);
          transform: scale(1.01);
        }
        
        /* הדגשה ספציפית לשקע השמאלי */
        .highlight-left-connector .scratch-block::before {
          box-shadow: inset 0 0 5px 2px rgba(255, 255, 255, 0.9) !important;
          background-color: rgba(255, 255, 255, 0.9) !important;
        }
        
        /* הדגשה ספציפית לפין הימני */
        .highlight-right-connector .scratch-block::after {
          box-shadow: 0 0 5px 2px rgba(255, 255, 0, 0.7) !important;
        }
        
        /* אנימציית הצמדה */
        @keyframes snapEffect {
          0% { transform: scale(1.03); }
          40% { transform: scale(0.97); }
          70% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }
        
        .snap-animation {
          animation: snapEffect 0.3s ease-out;
        }
        
        /* סימון בלוקים מחוברים */
        .connected-block, .has-connected-block {
          /* הבלטה קלה מאוד של בלוקים מחוברים */
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
        draggedBlock = null;
        potentialSnapTarget = null;
        snapDirection = null;
        clearSnapHighlights();
      });
    }
  }
});
