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
    
    // הוספת סגנונות להדגשה ויזואלית באופן דינמי
    addHighlightStyles();
    
    // מאזין לאירועי dragstart כדי לדעת איזה בלוק נגרר
    programmingArea.addEventListener('dragstart', function(e) {
      if (e.target.classList.contains('block-container')) {
        draggedBlock = e.target;
        console.log('התחלת גרירה:', draggedBlock.dataset.type);
      }
    });
    
    // מאזין לאירועי drag כדי לחפש בלוקים קרובים בזמן גרירה
    programmingArea.addEventListener('drag', function(e) {
      if (!draggedBlock || !e.clientX) return; // אם אין בלוק נגרר או מיקום לא תקף
      
      // נקה הדגשות קודמות
      clearSnapHighlights();
      
      // חפש בלוק קרוב להצמדה
      const closestBlock = findClosestBlock(e.clientX, e.clientY);
      
      // אם נמצא בלוק מתאים, הדגש אותו
      if (closestBlock) {
        highlightSnapTarget(closestBlock);
        potentialSnapTarget = closestBlock;
      } else {
        potentialSnapTarget = null;
      }
    });
    
    // מאזין לאירועי dragend כדי לבצע הצמדה
    programmingArea.addEventListener('dragend', function(e) {
      if (draggedBlock && potentialSnapTarget) {
        // בצע הצמדה
        snapBlocks(draggedBlock, potentialSnapTarget);
        
        // אפס את המצב אחרי ההצמדה
        setTimeout(() => {
          clearSnapHighlights();
          draggedBlock = null;
          potentialSnapTarget = null;
        }, 50);
      }
    });
    
    // מאזין גם ל-mouseup גלובלי למקרה שה-dragend לא נתפס
    window.addEventListener('mouseup', function() {
      if (draggedBlock && potentialSnapTarget) {
        // בצע הצמדה
        snapBlocks(draggedBlock, potentialSnapTarget);
        
        // אפס את המצב אחרי ההצמדה
        setTimeout(() => {
          clearSnapHighlights();
          draggedBlock = null;
          potentialSnapTarget = null;
        }, 50);
      } else {
        // נקה הדגשות בכל מקרה
        clearSnapHighlights();
      }
    });
    
    // מחפש את הבלוק הקרוב ביותר להצמדה
    function findClosestBlock(clientX, clientY) {
      if (!draggedBlock) return null;
      
      const blocks = programmingArea.querySelectorAll('.block-container');
      if (blocks.length < 2) return null; // דרושים לפחות 2 בלוקים
      
      // קבלת המיקום של הבלוק הנגרר
      const draggedRect = draggedBlock.getBoundingClientRect();
      
      // חישוב מיקום הפין הימני של הבלוק הנגרר
      const rightConnectorX = draggedRect.right;
      const rightConnectorY = draggedRect.top + (draggedRect.height / 2);
      
      let closestBlock = null;
      let minDistance = HIGHLIGHT_THRESHOLD; // מרחק מינימלי להתחלת הדגשה
      
      // בדיקת כל בלוק
      blocks.forEach(block => {
        // דלג על הבלוק עצמו
        if (block === draggedBlock) return;
        
        const blockRect = block.getBoundingClientRect();
        
        // חישוב מיקום השקע השמאלי של הבלוק הנבדק
        const leftConnectorX = blockRect.left;
        const leftConnectorY = blockRect.top + (blockRect.height / 2);
        
        // חישוב מרחק בין הפין הימני של הנגרר לשקע השמאלי של הנבדק
        const distance = Math.sqrt(
          Math.pow(rightConnectorX - leftConnectorX, 2) +
          Math.pow(rightConnectorY - leftConnectorY, 2)
        );
        
        // אם קרוב יותר מהקודם ובטווח ההדגשה
        if (distance < minDistance) {
          minDistance = distance;
          closestBlock = block;
        }
      });
      
      // אם המרחק קטן מסף ההצמדה, מחזיר את הבלוק הקרוב
      return closestBlock;
    }
    
    // הדגשת בלוק יעד פוטנציאלי להצמדה
    function highlightSnapTarget(block) {
      if (!block) return;
      
      // מוצא את אלמנט ה-scratch-block בתוך הבלוק
      const scratchBlock = block.querySelector('.scratch-block');
      if (scratchBlock) {
        // שמירת הסגנון המקורי לשחזור מאוחר יותר
        if (!scratchBlock.dataset.originalBoxShadow) {
          scratchBlock.dataset.originalBoxShadow = scratchBlock.style.boxShadow || '';
        }
        
        // הוספת הדגשה ויזואלית
        block.classList.add('snap-highlight');
        
        // מוסיף גם אפקט מיוחד לשקע השמאלי
        const beforeElem = scratchBlock.querySelector('::before');
        if (beforeElem) {
          beforeElem.style.boxShadow = 'inset 0 0 5px 2px rgba(255, 255, 255, 0.9)';
        }
      }
    }
    
    // ניקוי כל ההדגשות
    function clearSnapHighlights() {
      // מסיר את כל סימוני ההדגשה
      const highlightedBlocks = programmingArea.querySelectorAll('.snap-highlight');
      highlightedBlocks.forEach(block => {
        block.classList.remove('snap-highlight');
        
        // שחזור סגנון המקורי
        const scratchBlock = block.querySelector('.scratch-block');
        if (scratchBlock && scratchBlock.dataset.originalBoxShadow !== undefined) {
          scratchBlock.style.boxShadow = scratchBlock.dataset.originalBoxShadow;
          delete scratchBlock.dataset.originalBoxShadow;
        }
        
        // ניקוי אפקט השקע
        const beforeElem = scratchBlock.querySelector('::before');
        if (beforeElem) {
          beforeElem.style.boxShadow = '';
        }
      });
    }
    
    // ביצוע הצמדה בין שני בלוקים
    function snapBlocks(sourceBlock, targetBlock) {
      if (!sourceBlock || !targetBlock) return;
      
      try {
        const sourceRect = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();
        
        // חישוב מיקום חדש - הפין הימני של בלוק המקור יתחבר לשקע השמאלי של בלוק היעד
        // 9 פיקסלים לחפיפה מדויקת
        const newLeft = targetRect.left - programRect.left - sourceRect.width + 9;
        const newTop = targetRect.top - programRect.top;
        
        // עדכון מיקום הבלוק
        sourceBlock.style.position = 'absolute';
        sourceBlock.style.left = newLeft + 'px';
        sourceBlock.style.top = newTop + 'px';
        
        // הוספת סימון חיבור
        sourceBlock.classList.add('connected-block');
        targetBlock.classList.add('has-connected-block');
        
        // אפקט ויזואלי קטן בזמן ההצמדה
        addSnapEffectAnimation(sourceBlock);
        
        console.log('הצמדה בוצעה!');
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
        
        /* אפקט השקע השמאלי מודגש */
        .snap-highlight .scratch-block::before {
          box-shadow: inset 0 0 5px 2px rgba(255, 255, 255, 0.8) !important;
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
        clearSnapHighlights();
      });
    }
  }
});
