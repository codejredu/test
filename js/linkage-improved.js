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
        let pinBlock, socketBlock;
        
        if (isLeftToRight) {
          // המקור משמאל ליעד - צמד את הצד הימני של המקור לצד השמאלי של היעד
          newLeft = targetRect.left - sourceRect.width - areaRect.left;
          
          // בחיבור משמאל לימין: המקור הוא הפין והיעד הוא השקע
          pinBlock = sourceBlock;
          socketBlock = targetBlock;
        } else {
          // המקור מימין ליעד - צמד את הצד השמאלי של המקור לצד הימני של היעד
          newLeft = targetRect.right - areaRect.left;
          
          // בחיבור מימין לשמאל: היעד הוא הפין והמקור הוא השקע
          pinBlock = targetBlock;
          socketBlock = sourceBlock;
        }
        
        // הפין חייב להיות בשכבה העליונה - ערך גבוה מאוד
        pinBlock.style.zIndex = "9999999"; // ערך עצום שיהיה מעל הכל
        socketBlock.style.zIndex = "100";   // השקע בשכבה תחתונה
        
        // בנוסף - איתור האיקון בתוך הפין והעלאת ה-z-index שלו עוד יותר
        const pinIcon = pinBlock.querySelector('img, svg, .scratch-block, .icon');
        if (pinIcon) {
          pinIcon.style.position = 'relative';
          pinIcon.style.zIndex = "9999999";
        }
        
        // שמירה על אותו גובה
        newTop = targetRect.top - areaRect.top;
        
        // עדכון מיקום
        sourceBlock.style.position = 'absolute';
        sourceBlock.style.left = newLeft + 'px';
        sourceBlock.style.top = newTop + 'px';
        
        // בדיקה אם ההצמדה עובדת
        console.log('מיקום חדש:', newLeft, newTop);
        console.log('הפין קיבל z-index:', pinBlock.style.zIndex);
        
        // סימון הבלוקים כמחוברים
        sourceBlock.classList.add('snapped-block');
        targetBlock.classList.add('snapped-block');
        
        // שמירה של מזהה הבלוק השני לשימוש עתידי
        sourceBlock.dataset.connectedTo = targetBlock.id || generateId(targetBlock);
        targetBlock.dataset.connectedTo = sourceBlock.id || generateId(sourceBlock);
        
        // הוספת נקודה אדומה לחיווי החיבור על הפין
        setTimeout(() => {
          createWhiteDot(pinBlock);
        }, 50);
        
        console.log('הצמדה בוצעה! כיוון:', isLeftToRight ? 'משמאל לימין' : 'מימין לשמאל');
      } catch (err) {
        console.error('שגיאה בהצמדה:', err);
      }
    }
    
    // יצירת מזהה ייחודי לבלוק אם אין לו כזה
    function generateId(block) {
      if (!block.id) {
        block.id = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      }
      return block.id;
    }
    
    // פונקציה ליצירת נקודה אדומה בנקודת החיבור
    function createWhiteDot(blockWithPin) {
      try {
        // הסרת נקודות קודמות
        const oldDots = document.querySelectorAll('.connection-dot, .emergency-dot');
        oldDots.forEach(dot => dot.remove());
        
        // יצירת אלמנט נקודה חדש
        const dot = document.createElement('div');
        dot.className = 'connection-dot';
        document.body.appendChild(dot); // הוספת הנקודה ישירות לגוף המסמך לוודא שהיא מעל הכל
        
        // קבלת מיקום הבלוק עם הפין
        const blockRect = blockWithPin.getBoundingClientRect();
        
        // סגנון הנקודה - אדומה גדולה ובולטת
        dot.style.position = 'fixed'; // שימוש ב-fixed במקום absolute
        dot.style.width = '15px';
        dot.style.height = '15px';
        dot.style.backgroundColor = '#FF0000'; // אדום בולט
        dot.style.border = '3px solid white'; // גבול לבן עבה
        dot.style.borderRadius = '50%';
        dot.style.zIndex = '9999999'; // ערך גבוה מאוד
        dot.style.boxShadow = '0 0 10px rgba(0,0,0,0.8)'; // צל כהה ובולט
        dot.style.pointerEvents = 'none'; // מאפשר ללחוץ "דרך" הנקודה
        
        // מיקום במרכז הבלוק עם הפין
        dot.style.left = (blockRect.left + blockRect.width / 2) + 'px';
        dot.style.top = (blockRect.top + blockRect.height / 2) + 'px';
        dot.style.transform = 'translate(-50%, -50%)';
        
        // הוספת הבהוב לנקודה להדגשה
        dot.style.animation = 'pulse 1.5s infinite';
        
        // הוספת סגנון האנימציה
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
        `;
        document.head.appendChild(styleSheet);
        
        console.log('נוצרה נקודה אדומה בולטת על הבלוק עם הפין');
      } catch (err) {
        console.error('שגיאה ביצירת נקודה:', err);
        
        // ניסיון יצירת נקודה חירום פשוטה יותר
        try {
          const emergencyDot = document.createElement('div');
          emergencyDot.className = 'emergency-dot';
          document.body.appendChild(emergencyDot);
          
          emergencyDot.style.position = 'fixed';
          emergencyDot.style.width = '30px';
          emergencyDot.style.height = '30px';
          emergencyDot.style.backgroundColor = '#FF0000';
          emergencyDot.style.top = '50px';
          emergencyDot.style.left = '50px';
          emergencyDot.style.zIndex = '9999999';
          
          console.log('נוצרה נקודת חירום');
        } catch (e) {
          console.error('כישלון גם בנקודת חירום:', e);
        }
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
        const dots = document.querySelectorAll('.connection-dot, .emergency-dot');
        dots.forEach(dot => {
          dot.remove();
        });
        
        // הסרת סגנונות אנימציה
        const animStyles = document.querySelectorAll('style[data-for="dot-animation"]');
        animStyles.forEach(style => style.remove());
        
        // איפוס z-index וסימוני חיבור
        const blocks = programmingArea.querySelectorAll('.block-container');
        blocks.forEach(block => {
          block.style.zIndex = '';
          block.classList.remove('snapped-block');
          
          // איפוס z-index של רכיבים פנימיים
          const innerElements = block.querySelectorAll('*');
          innerElements.forEach(el => {
            el.style.zIndex = '';
          });
          
          // ניקוי מידע על חיבורים
          block.removeAttribute('data-connected-to');
        });
        
        console.log('ניקוי מלא בוצע');
      });
    }
  }
});
