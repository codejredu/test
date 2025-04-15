// linkage-minimal.js - הצמדת בלוקים מינימלית
document.addEventListener('DOMContentLoaded', function() {
  console.log('טוען מערכת הצמדת בלוקים מינימלית...');
  
  // מחכה שהדף יטען לגמרי כולל הסקריפטים האחרים
  setTimeout(function() {
    setupSnapping();
  }, 1000);
  
  function setupSnapping() {
    console.log('מפעיל מערכת הצמדה...');
    
    // איתור אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('אזור התכנות לא נמצא!');
      return;
    }
    
    // מאזין לאירועי mouseup ברמת החלון
    // כך נלכוד את סיום הגרירה בלי להתערב בקוד המקורי
    window.addEventListener('mouseup', function() {
      // אחרי שחרור העכבר, נבדוק אם יש בלוקים שניתן להצמיד
      checkForSnapping();
    });
    
    // בדיקת הצמדה עבור כל הבלוקים באזור התכנות
    function checkForSnapping() {
      const blocks = programmingArea.querySelectorAll('.block-container');
      if (blocks.length < 2) return; // צריך לפחות 2 בלוקים כדי להצמיד
      
      // בדיקת כל בלוק מול כל בלוק אחר
      for (let i = 0; i < blocks.length; i++) {
        for (let j = 0; j < blocks.length; j++) {
          if (i !== j) { // לא בודקים בלוק מול עצמו
            const block1 = blocks[i];
            const block2 = blocks[j];
            
            // בדיקה אם הבלוקים קרובים מספיק להצמדה
            if (shouldSnap(block1, block2)) {
              snapBlocks(block1, block2);
              // נסיים אחרי הצמדה אחת כדי למנוע הצמדות מרובות בו-זמנית
              return;
            }
          }
        }
      }
    }
    
    // בדיקה אם שני בלוקים צריכים להיות מוצמדים
    function shouldSnap(block1, block2) {
      const SNAP_THRESHOLD = 20; // מרחק מקסימלי בפיקסלים להצמדה
      
      // קבלת מיקום ומידות
      const rect1 = block1.getBoundingClientRect();
      const rect2 = block2.getBoundingClientRect();
      
      // בדיקת מרחק בין הפין הימני של בלוק1 לשקע השמאלי של בלוק2
      const rightConnector1 = {
        x: rect1.right,
        y: rect1.top + rect1.height / 2
      };
      
      const leftConnector2 = {
        x: rect2.left,
        y: rect2.top + rect2.height / 2
      };
      
      // חישוב מרחק
      const distance = Math.sqrt(
        Math.pow(rightConnector1.x - leftConnector2.x, 2) +
        Math.pow(rightConnector1.y - leftConnector2.y, 2)
      );
      
      return distance < SNAP_THRESHOLD;
    }
    
    // ביצוע הצמדה בין שני בלוקים
    function snapBlocks(sourceBlock, targetBlock) {
      const rect1 = sourceBlock.getBoundingClientRect();
      const rect2 = targetBlock.getBoundingClientRect();
      const programRect = programmingArea.getBoundingClientRect();
      
      // חישוב מיקום חדש - הפין הימני של בלוק המקור יתחבר לשקע השמאלי של בלוק היעד
      const newLeft = rect2.left - programRect.left - rect1.width + 9; // 9 פיקסלים לחפיפה קטנה
      const newTop = rect2.top - programRect.top;
      
      // עדכון מיקום הבלוק
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';
      
      console.log('הצמדה בוצעה!');
    }
  }
});
