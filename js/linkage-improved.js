// קוד גרירה והצמדה פשוט ביותר - רק הצמדת פאות
document.addEventListener('DOMContentLoaded', function() {
  console.log('טוען מערכת גרירה בסיסית עם הצמדה...');
  
  // המתנה לטעינת הדף
  setTimeout(function() {
    setupBasicDragAndSnap();
  }, 1000);
  
  function setupBasicDragAndSnap() {
    // איתור אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות לא נמצא!');
      return;
    }
    
    // משתנים גלובליים
    let currentDraggedBlock = null;
    let targetBlock = null;
    
    // הגדרת מרחק להופעת הילה
    const PROXIMITY_DISTANCE = 20; // פיקסלים
    
    // מאזין לתחילת גרירה
    programmingArea.addEventListener('dragstart', function(e) {
      if (e.target.classList.contains('block-container')) {
        // שמירת הבלוק הנגרר
        currentDraggedBlock = e.target;
        
        // ביטול תמונת רוח רפאים
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
        
        // סימון הבלוק כנגרר
        currentDraggedBlock.classList.add('dragging');
      }
    });
    
    // מאזין לגרירה מעל האזור
    programmingArea.addEventListener('dragover', function(e) {
      if (currentDraggedBlock) {
        e.preventDefault();
        
        // עדכון מיקום
        updateDragPosition(e);
        
        // בדיקת קרבה לבלוקים אחרים
        checkNearbyBlocks();
      }
    });
    
    // מאזין לסיום גרירה
    programmingArea.addEventListener('dragend', function(e) {
      if (currentDraggedBlock) {
        // הסרת סימון גרירה
        currentDraggedBlock.classList.remove('dragging');
        
        // אם יש בלוק קרוב, הצמד אליו
        if (targetBlock) {
          snapToBlock(currentDraggedBlock, targetBlock);
        }
        
        // ניקוי משתנים
        currentDraggedBlock = null;
        targetBlock = null;
        
        // ניקוי הילות
        clearHighlights();
      }
    });
    
    // פונקציה לעדכון מיקום בזמן גרירה
    function updateDragPosition(e) {
      if (!currentDraggedBlock) return;
      
      const rect = programmingArea.getBoundingClientRect();
      const blockWidth = currentDraggedBlock.offsetWidth;
      const blockHeight = currentDraggedBlock.offsetHeight;
      
      // מיקום במרכז העכבר
      const left = e.clientX - rect.left - (blockWidth / 2);
      const top = e.clientY - rect.top - (blockHeight / 2);
      
      // עדכון מיקום
      currentDraggedBlock.style.position = 'absolute';
      currentDraggedBlock.style.left = left + 'px';
      currentDraggedBlock.style.top = top + 'px';
    }
    
    // פונקציה לבדיקת קרבה לבלוקים אחרים
    function checkNearbyBlocks() {
      if (!currentDraggedBlock) return;
      
      // ניקוי הילות
      clearHighlights();
      targetBlock = null;
      
      // קבלת רשימת כל הבלוקים באזור התכנות
      const blocks = programmingArea.querySelectorAll('.block-container');
      if (blocks.length < 2) return;
      
      // קבלת מיקום הבלוק הנגרר
      const draggedRect = currentDraggedBlock.getBoundingClientRect();
      
      // בדיקת כל בלוק
      for (const block of blocks) {
        // דלג על הבלוק הנגרר עצמו
        if (block === currentDraggedBlock) continue;
        
        // קבלת מיקום הבלוק הנוכחי
        const blockRect = block.getBoundingClientRect();
        
        // בדיקת מרחק אופקי
        let horizontalGap = 999;
        
        // הבלוק הנגרר משמאל לבלוק הנבדק
        if (draggedRect.right < blockRect.left) {
          horizontalGap = blockRect.left - draggedRect.right;
        }
        // הבלוק הנגרר מימין לבלוק הנבדק
        else if (draggedRect.left > blockRect.right) {
          horizontalGap = draggedRect.left - blockRect.right;
        }
        
        // בדיקת גובה - האם הבלוקים באותו גובה בערך
        const verticalMatch = Math.abs(draggedRect.top - blockRect.top) < 30;
        
        // אם המרחק קטן מסף הקרבה וגם באותו גובה
        if (horizontalGap < PROXIMITY_DISTANCE && verticalMatch) {
          // שמור את הבלוק הקרוב
          targetBlock = block;
          break;
        }
      }
    }
    
    // פונקציה להצמדת בלוק לבלוק אחר
    function snapToBlock(sourceBlock, targetBlock) {
      if (!sourceBlock || !targetBlock) return;
      
      // קבלת מיקום
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const areaRect = programmingArea.getBoundingClientRect();
      
      // קביעת כיוון ההצמדה
      const isLeftToRight = sourceRect.right < targetRect.left;
      
      let newLeft, newTop;
      
      if (isLeftToRight) {
        // המקור משמאל ליעד - צמד את הצד הימני של המקור לצד השמאלי של היעד
        newLeft = targetRect.left - sourceRect.width - areaRect.left;
        
        // הגדרת z-index כך שהפין (הימני) יהיה בשכבה העליונה
        sourceBlock.style.zIndex = "110";
        targetBlock.style.zIndex = "100";
      } else {
        // המקור מימין ליעד - צמד את הצד השמאלי של המקור לצד הימני של היעד
        newLeft = targetRect.right - areaRect.left;
        
        // הגדרת z-index כך שהפין (הימני של היעד) יהיה בשכבה העליונה
        sourceBlock.style.zIndex = "100";
        targetBlock.style.zIndex = "110";
      }
      
      // שמירה על אותו גובה
      newTop = targetRect.top - areaRect.top;
      
      // עדכון מיקום
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';
      
      // הוספת העיגול הלבן המחווה חיבור
      addConnectionIndicator(sourceBlock, targetBlock, isLeftToRight);
      
      // סימון שהבלוקים מחוברים
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('connected-block');
      
      console.log('הצמדה בוצעה בהצלחה! כיוון:', isLeftToRight ? 'משמאל לימין' : 'מימין לשמאל');
    }
    
    // פונקציה להוספת עיגול לבן המחווה את החיבור
    function addConnectionIndicator(sourceBlock, targetBlock, isLeftToRight) {
      // הסרת מחוונים קודמים אם קיימים
      removeConnectionIndicators();
      
      // יצירת העיגול הלבן
      const indicator = document.createElement('div');
      indicator.className = 'connection-indicator';
      
      // קביעת סגנון העיגול
      indicator.style.position = 'absolute';
      indicator.style.width = '6px';
      indicator.style.height = '6px';
      indicator.style.backgroundColor = '#ffffff';
      indicator.style.border = '1px solid #cccccc';
      indicator.style.borderRadius = '50%';
      indicator.style.zIndex = '105';
      
      // קביעת מיקום העיגול בהתאם לכיוון ההצמדה
      if (isLeftToRight) {
        // המקור משמאל ליעד - העיגול יהיה בקצה הימני של המקור
        sourceBlock.appendChild(indicator);
        indicator.style.right = '-3px';
        indicator.style.top = '50%';
        indicator.style.transform = 'translateY(-50%)';
      } else {
        // המקור מימין ליעד - העיגול יהיה בקצה השמאלי של המקור
        sourceBlock.appendChild(indicator);
        indicator.style.left = '-3px';
        indicator.style.top = '50%';
        indicator.style.transform = 'translateY(-50%)';
      }
    }
    
    // פונקציה להסרת מחווני חיבור קיימים
    function removeConnectionIndicators() {
      const indicators = document.querySelectorAll('.connection-indicator');
      indicators.forEach(indicator => indicator.remove());
    }
    
    // פונקציה לניקוי הילות
    function clearHighlights() {
      // כעת אין יותר הילות - בהתאם לבקשה
    }
    
    // מאזין לנפילה
    programmingArea.addEventListener('drop', function(e) {
      e.preventDefault(); // חשוב למניעת התנהגות ברירת מחדל של הדפדפן
    });
    
    // מאזין לכפתור ניקוי
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        // איפוס משתנים
        currentDraggedBlock = null;
        targetBlock = null;
        
        // הסרת מחווני חיבור
        removeConnectionIndicators();
        
        // הסרת סימון בלוקים מחוברים
        const connectedBlocks = document.querySelectorAll('.connected-block');
        connectedBlocks.forEach(block => {
          block.classList.remove('connected-block');
          block.style.zIndex = '';
        });
      });
    }
  }
});
