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
      
      try {
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
          
          // הגדרת z-index גבוה למקור (שבו הפין הימני) כדי שיסתיר את השקע
          sourceBlock.style.zIndex = "150";
          targetBlock.style.zIndex = "100";
        } else {
          // המקור מימין ליעד - צמד את הצד השמאלי של המקור לצד הימני של היעד
          newLeft = targetRect.right - areaRect.left;
          
          // הגדרת z-index גבוה ליעד (שבו הפין הימני) כדי שיסתיר את השקע
          sourceBlock.style.zIndex = "100";
          targetBlock.style.zIndex = "150";
        }
        
        // שמירה על אותו גובה
        newTop = targetRect.top - areaRect.top;
        
        // עדכון מיקום
        sourceBlock.style.position = 'absolute';
        sourceBlock.style.left = newLeft + 'px';
        sourceBlock.style.top = newTop + 'px';
        
        // בדיקה אם ההצמדה עובדת
        console.log('מיקום חדש:', newLeft, newTop);
        
        // סימון הבלוקים כמחוברים
        sourceBlock.classList.add('snapped-block');
        targetBlock.classList.add('snapped-block');
        
        // הוספת העיגול הלבן לחיווי החיבור עם השהיה קטנה
        setTimeout(() => {
          // זיהוי הבלוק עם הפין (בשכבה העליונה) והוספת הנקודה עליו
          if (isLeftToRight) {
            // המקור משמאל ליעד - הפין בצד ימין של המקור
            createWhiteDot(sourceBlock, targetBlock, isLeftToRight);
          } else {
            // המקור מימין ליעד - הפין בצד ימין של היעד
            createWhiteDot(targetBlock, sourceBlock, !isLeftToRight);
          }
        }, 50);
        
        console.log('הצמדה בוצעה בהצלחה! כיוון:', isLeftToRight ? 'משמאל לימין' : 'מימין לשמאל');
      } catch (err) {
        console.error('שגיאה בהצמדה:', err);
      }
    }
    
    // פונקציה ליצירת נקודה לבנה בנקודת החיבור
    function createWhiteDot(sourceBlock, targetBlock, isLeftToRight) {
      try {
        // הסרת נקודות קודמות
        const oldDots = document.querySelectorAll('.connection-dot');
        oldDots.forEach(dot => dot.remove());
        
        // איתור האיקון בתוך הבלוק
        let blockWithDot;
        
        if (isLeftToRight) {
          // הבלוק משמאל (עם הפין) מקבל את הנקודה
          blockWithDot = sourceBlock;
        } else {
          // הבלוק מימין (עם הפין) מקבל את הנקודה
          blockWithDot = targetBlock;
        }
        
        // חיפוש האיקון בתוך הבלוק
        const icon = blockWithDot.querySelector('img, svg, .icon');
        
        // יצירת נקודה חדשה
        const dot = document.createElement('div');
        dot.className = 'connection-dot';
        
        // בדיקה אם מצאנו איקון
        if (icon) {
          // מיקום הנקודה על האיקון
          icon.parentNode.style.position = 'relative';
          icon.parentNode.appendChild(dot);
          
          // סגנון הנקודה כשהיא בתוך האיקון
          dot.style.position = 'absolute';
          dot.style.width = '8px';
          dot.style.height = '8px';
          dot.style.backgroundColor = '#ffffff';
          dot.style.border = '1px solid #aaaaaa';
          dot.style.borderRadius = '50%';
          dot.style.zIndex = '200'; // מעל הכל
          
          // מיקום במרכז האיקון
          dot.style.left = '50%';
          dot.style.top = '50%';
          dot.style.transform = 'translate(-50%, -50%)';
          
          console.log('נוצרה נקודה לבנה על האיקון');
        } else {
          // לא מצאנו איקון, נשים את הנקודה בקצה הבלוק במקום
          blockWithDot.appendChild(dot);
          
          // סגנון הנקודה
          dot.style.position = 'absolute';
          dot.style.width = '8px';
          dot.style.height = '8px';
          dot.style.backgroundColor = '#ffffff';
          dot.style.border = '1px solid #aaaaaa';
          dot.style.borderRadius = '50%';
          dot.style.zIndex = '200'; // מעל הכל
          
          // מיקום בהתאם לכיוון החיבור
          if (isLeftToRight) {
            dot.style.right = '5px';
            dot.style.top = '50%';
            dot.style.transform = 'translateY(-50%)';
          } else {
            dot.style.left = '5px';
            dot.style.top = '50%';
            dot.style.transform = 'translateY(-50%)';
          }
          
          console.log('נוצרה נקודה לבנה בקצה הבלוק (לא נמצא איקון)');
        }
      } catch (err) {
        console.error('שגיאה ביצירת נקודה:', err);
      }
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
        
        // הסרת נקודות חיבור
        const dots = document.querySelectorAll('.connection-dot');
        dots.forEach(dot => dot.remove());
        
        // איפוס z-index וסימוני חיבור
        const blocks = programmingArea.querySelectorAll('.block-container');
        blocks.forEach(block => {
          block.style.zIndex = '';
          block.classList.remove('snapped-block');
        });
        
        console.log('ניקוי בוצע');
      });
    }
  }
});
