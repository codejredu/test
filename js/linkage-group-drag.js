// circle-replace.js - החלפה פשוטה של עיגולי חיבור

(function() {
  // פונקציה שרצה כל 100 מילישניות ובודקת אם יש עיגולי חיבור להחליף
  function checkAndReplaceCircles() {
    // בדוק אם יש עיגולי חיבור גלויים
    const leftPoints = Array.from(document.querySelectorAll('.left-connection-point[style*="opacity: 1"]'));
    const rightPoints = Array.from(document.querySelectorAll('.right-connection-point[style*="opacity: 1"]'));
    
    // החלף צבעים של עיגולים שמאליים (כחולים)
    leftPoints.forEach(point => {
      // החלף צבע ישירות
      point.style.backgroundColor = '#2196F3';  // כחול
      point.style.boxShadow = '0 0 10px 4px rgba(33,150,243,0.95)';
    });
    
    // השאר צבעים של עיגולים ימניים (כתום)
    rightPoints.forEach(point => {
      // ודא שהצבע הוא כתום (לא צריך לשנות)
      point.style.backgroundColor = '#FF9800';  // כתום
      point.style.boxShadow = '0 0 10px 4px rgba(255,152,0,0.95)';
    });
    
    // תקן חיבורי פאזל
    const connectedBlocks = findConnectedBlocks();
    fixPuzzleConnections(connectedBlocks);
  }
  
  // מצא בלוקים מחוברים
  function findConnectedBlocks() {
    const blocks = Array.from(document.querySelectorAll('.block:not(.in-drawer)'));
    const pairs = [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block1 = blocks[i];
      const rect1 = block1.getBoundingClientRect();
      
      for (let j = i+1; j < blocks.length; j++) {
        const block2 = blocks[j];
        const rect2 = block2.getBoundingClientRect();
        
        // בדוק אם הבלוקים קרובים מאוד (מחוברים)
        const gap = Math.abs(rect1.right - rect2.left);
        const verticalGap = Math.abs(rect1.top - rect2.top);
        
        if (gap < 5 && verticalGap < 5 && rect1.left < rect2.left) {
          pairs.push({
            left: block1,
            right: block2
          });
        }
      }
    }
    
    return pairs;
  }
  
  // תקן חיבורי פאזל בין בלוקים מחוברים
  function fixPuzzleConnections(pairs) {
    pairs.forEach(pair => {
      // הוסף חפיפה של פיקסל
      pair.left.style.zIndex = '10';
      pair.right.style.zIndex = '9';
      
      const leftRect = pair.left.getBoundingClientRect();
      const rightRect = pair.right.getBoundingClientRect();
      
      // אם יש רווח בין הבלוקים, סגור אותו
      if (Math.abs(leftRect.right - rightRect.left) > 0) {
        // חשב מיקום חדש לבלוק הימני
        const progArea = document.querySelector('#programming-area') || document.body;
        const progRect = progArea.getBoundingClientRect();
        
        // מיקום מדויק ללא רווח
        const newLeft = leftRect.right - 1;
        const scroll = progArea.scrollLeft || 0;
        
        // החל מיקום אבסולוטי
        pair.right.style.position = 'absolute';
        pair.right.style.left = (newLeft - progRect.left + scroll) + 'px';
        pair.right.style.top = (leftRect.top - progRect.top + (progArea.scrollTop || 0)) + 'px';
      }
    });
  }
  
  // פונקציה ליצירת עיגולי חיבור חדשים אם אין
  function createConnectionPointsIfNeeded() {
    const blocks = document.querySelectorAll('.block:not(.in-drawer)');
    
    blocks.forEach(block => {
      // בדוק אם יש נקודות חיבור
      const hasLeft = block.querySelector('.left-connection-point');
      const hasRight = block.querySelector('.right-connection-point');
      
      // צור עיגול שמאלי אם אין
      if (!hasLeft) {
        const leftPoint = document.createElement('div');
        leftPoint.className = 'left-connection-point';
        leftPoint.style.cssText = `
          position: absolute;
          width: 20px;
          height: 20px;
          top: 50%;
          left: -10px;
          transform: translateY(-50%);
          background-color: #2196F3;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.1s ease-out;
          pointer-events: none;
          z-index: 9999;
          box-shadow: 0 0 10px 4px rgba(33,150,243,0.95);
          border: 2px solid #FFF;
        `;
        block.appendChild(leftPoint);
      }
      
      // צור עיגול ימני אם אין
      if (!hasRight) {
        const rightPoint = document.createElement('div');
        rightPoint.className = 'right-connection-point';
        rightPoint.style.cssText = `
          position: absolute;
          width: 20px;
          height: 20px;
          top: 50%;
          right: -10px;
          transform: translateY(-50%);
          background-color: #FF9800;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.1s ease-out;
          pointer-events: none;
          z-index: 9999;
          box-shadow: 0 0 10px 4px rgba(255,152,0,0.95);
          border: 2px solid #FFF;
        `;
        block.appendChild(rightPoint);
      }
    });
  }
  
  // הפעל בדיקה כל 100 מילישניות
  setInterval(() => {
    checkAndReplaceCircles();
    createConnectionPointsIfNeeded();
  }, 100);
  
  // גם האזן לאירועי עכבר
  document.addEventListener('mousemove', checkAndReplaceCircles);
  document.addEventListener('mouseup', checkAndReplaceCircles);
  
  console.log("מודול החלפת עיגולים ותיקון פאזל נטען");
})();
