// קוד ניפוי שגיאות להילה
// העתק את הקוד הזה לקונסולת הדפדפן כדי לבדוק את מצב ההילה

(function() {
  console.log("=== בדיקת מערכת ההילה ===");
  
  // בדיקת קיום הסגנון
  const styleElements = document.querySelectorAll('style');
  let hasGlowStyle = false;
  
  styleElements.forEach(style => {
    if (style.textContent.includes('glow-effect')) {
      hasGlowStyle = true;
      console.log("נמצא סגנון להילה:", style.textContent.match(/\.glow-effect[^}]+}/)[0]);
    }
  });
  
  console.log("האם הסגנון קיים:", hasGlowStyle);
  
  // בדיקת הבלוק הנגרר הנוכחי
  const draggedBlocks = document.querySelectorAll('.dragging');
  console.log("בלוקים בגרירה:", draggedBlocks.length);
  
  if (draggedBlocks.length > 0) {
    const draggedBlock = draggedBlocks[0];
    console.log("מחלקות של הבלוק הנגרר:", draggedBlock.className);
    console.log("האם יש מחלקת glow-effect:", draggedBlock.classList.contains('glow-effect'));
    
    // בדיקת מרחקים לבלוקים אחרים
    const otherBlocks = Array.from(
      document.querySelectorAll('.block-container')
    ).filter(block => block !== draggedBlock);
    
    if (otherBlocks.length > 0) {
      console.log("מספר הבלוקים האחרים:", otherBlocks.length);
      
      // קבלת המיקום של הבלוק הנגרר
      const draggedRect = draggedBlock.getBoundingClientRect();
      console.log("מיקום הבלוק הנגרר:", {
        left: draggedRect.left,
        top: draggedRect.top,
        right: draggedRect.right,
        bottom: draggedRect.bottom,
        width: draggedRect.width,
        height: draggedRect.height
      });
      
      // בדיקת מרחקים
      otherBlocks.forEach((block, index) => {
        const blockRect = block.getBoundingClientRect();
        
        // חישוב מרחק בין קצוות
        const edgeDistances = {
          rightToLeft: Math.abs(draggedRect.right - blockRect.left),
          leftToRight: Math.abs(draggedRect.left - blockRect.right),
          topToBottom: Math.abs(draggedRect.top - blockRect.bottom),
          bottomToTop: Math.abs(draggedRect.bottom - blockRect.top)
        };
        
        // חישוב מרחק בין מרכזים
        const draggedCenterX = draggedRect.left + draggedRect.width / 2;
        const draggedCenterY = draggedRect.top + draggedRect.height / 2;
        const blockCenterX = blockRect.left + blockRect.width / 2;
        const blockCenterY = blockRect.top + blockRect.height / 2;
        
        const centerDistance = Math.sqrt(
          Math.pow(draggedCenterX - blockCenterX, 2) + 
          Math.pow(draggedCenterY - blockCenterY, 2)
        );
        
        console.log(`מרחקים לבלוק ${index}:`, {
          edgeDistances,
          centerDistance
        });
      });
    } else {
      console.log("אין בלוקים אחרים");
    }
  }
  
  // בדיקה אם יש בלוקים עם מחלקת glow-effect
  const glowingBlocks = document.querySelectorAll('.glow-effect');
  console.log("מספר בלוקים עם הילה:", glowingBlocks.length);
  
  // הצעה לפתרון
  console.log("\n=== הצעה לפתרון ===");
  console.log("1. וודא שאירוע mousemove אכן קורא לפונקציה checkForBlockGlow");
  console.log("2. הוסף console.log לפונקציה checkForBlockGlow כדי לוודא שהיא רצה");
  console.log("3. בדוק את החישוב של המרחקים ושנה את סף ההילה");
  console.log("4. אולי יש התנגשות עם מחלקות CSS אחרות - נסה להשתמש במחלקה ספציפית יותר");
})();
