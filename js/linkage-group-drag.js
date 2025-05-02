// perfect-group-connect.js - פתרון מושלם לחיבור קבוצות בלוקים

(function() {
  console.log("[PerfectConnect] טוען מודול חיבור פאזל מושלם לקבוצות");
  
  // קונפיגורציה אגרסיבית יותר לחיבור מושלם
  const CONFIG = {
    DEBUG: true,                      // הדפסת הודעות דיבוג
    OVERLAP: -3,                      // ערך חפיפה של 3 פיקסלים בחיבור (שלילי = חפיפה)
    HORIZONTAL_FINE_TUNING: -15,      // כוונון אופקי אגרסיבי לסגירת רווחים
    VERTICAL_OFFSET: 0,               // יישור אנכי
    CONNECTION_DELAY: 1,              // זמן מינימלי לתגובה מהירה
    Z_INDEX_LEFT: 15,                 // שכבה גבוהה לבלוק שמאלי
    Z_INDEX_RIGHT: 5,                 // שכבה נמוכה לבלוק ימני
    GROUP_FIX_INTERVAL: 50,           // בדיקת חיבורים תכופה
    BORDER_COMPENSATION: -1,          // פיצוי לגבולות
    APPLY_FORCE: true                 // כפה סגנונות בצורה אגרסיבית
  };
  
  // משתנים גלובליים
  let checkInterval = null;
  
  // הזרקת סגנונות CSS לחיבור מושלם
  function injectStyles() {
    // הסר סגנון קודם אם קיים
    const oldStyle = document.getElementById('perfect-puzzle-fix-styles');
    if (oldStyle) {
      oldStyle.remove();
    }
    
    // יצירת סגנון חדש
    const style = document.createElement('style');
    style.id = 'perfect-puzzle-fix-styles';
    style.textContent = `
      /* סגנונות לחיבור פאזל מושלם */
      .perfect-left {
        position: relative !important;
        z-index: ${CONFIG.Z_INDEX_LEFT} !important;
        margin-right: ${CONFIG.OVERLAP}px !important;
        padding-right: 0 !important;
        border-right: 0 !important;
      }
      
      .perfect-right {
        position: relative !important;
        z-index: ${CONFIG.Z_INDEX_RIGHT} !important;
        margin-left: ${CONFIG.OVERLAP}px !important;
        padding-left: 0 !important;
        border-left: 0 !important;
      }
      
      /* הסרת מעברים ואנימציות */
      .perfect-connect {
        transition: none !important;
        transform: none !important;
      }
      
      /* הסרת מסגרות */
      .perfect-connect * {
        outline: none !important;
        box-shadow: none !important;
      }
      
      /* טיפול בכל בלוק */
      .block {
        box-sizing: border-box !important;
      }
      
      /* אין מרווחים בקבוצה */
      .group-connection {
        display: flex !important;
        flex-direction: row !important;
        gap: ${CONFIG.OVERLAP}px !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log("[PerfectConnect] סגנונות CSS משופרים הוזרקו");
  }
  
  // פונקציה ליצירת חיבור פאזל מושלם בין שני בלוקים
  function createPerfectConnection(leftBlock, rightBlock) {
    if (!leftBlock || !rightBlock) return false;
    
    try {
      // קבל מיקום נוכחי
      const leftRect = leftBlock.getBoundingClientRect();
      const rightRect = rightBlock.getBoundingClientRect();
      
      // חשב את המיקום האידיאלי בלי רווח
      const idealLeft = leftRect.right + CONFIG.HORIZONTAL_FINE_TUNING + CONFIG.BORDER_COMPENSATION;
      const idealTop = leftRect.top + CONFIG.VERTICAL_OFFSET;
      
      // קבל את אזור התכנות
      const programArea = document.getElementById('programming-area') || 
                          document.getElementById('program-blocks') || 
                          document.body;
      const areaRect = programArea.getBoundingClientRect();
      
      // חשב את המיקום האבסולוטי בדף
      const absoluteLeft = idealLeft - areaRect.left + programArea.scrollLeft;
      const absoluteTop = idealTop - areaRect.top + programArea.scrollTop;
      
      // החלת המיקום החדש - דרך ראשונה
      if (CONFIG.APPLY_FORCE) {
        // החלה ישירה ואגרסיבית של סגנונות
        rightBlock.style.cssText = `
          position: absolute !important;
          left: ${Math.round(absoluteLeft)}px !important;
          top: ${Math.round(absoluteTop)}px !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          transform: none !important;
          transition: none !important;
          z-index: ${CONFIG.Z_INDEX_RIGHT} !important;
        `;
      } else {
        // החלה רגילה
        rightBlock.style.position = 'absolute';
        rightBlock.style.left = `${Math.round(absoluteLeft)}px`;
        rightBlock.style.top = `${Math.round(absoluteTop)}px`;
      }
      
      // כפה רנדור מחדש
      void rightBlock.offsetWidth;
      
      // הוסף מחלקות
      leftBlock.classList.add('perfect-left', 'perfect-connect');
      rightBlock.classList.add('perfect-right', 'perfect-connect');
      
      // נסה לבטל טרנספורמציות גם בבלוק השמאלי
      leftBlock.style.transform = 'none';
      leftBlock.style.transition = 'none';
      leftBlock.style.margin = '0';
      leftBlock.style.border = '0';
      
      if (CONFIG.DEBUG) {
        console.log(`[PerfectConnect] חיבור מושלם בין ${leftBlock.id} ל-${rightBlock.id}`);
        console.log(`[PerfectConnect] מיקום: ${Math.round(absoluteLeft)}, ${Math.round(absoluteTop)}`);
      }
      
      return true;
    } catch (err) {
      console.error('[PerfectConnect] שגיאה בחיבור:', err);
      return false;
    }
  }
  
  // טיפול בחיבור בין קבוצות בלוקים
  function connectBlockGroups(leftGroup, rightGroup) {
    if (!leftGroup || !leftGroup.length || !rightGroup || !rightGroup.length) return false;
    
    try {
      // מצא את הבלוק הימני ביותר בקבוצה השמאלית
      let rightmostInLeft = findRightmostBlock(leftGroup);
      
      // מצא את הבלוק השמאלי ביותר בקבוצה הימנית
      let leftmostInRight = findLeftmostBlock(rightGroup);
      
      // יצור חיבור מושלם בין שני הבלוקים
      return createPerfectConnection(rightmostInLeft, leftmostInRight);
    } catch (err) {
      console.error('[PerfectConnect] שגיאה בחיבור קבוצות:', err);
      return false;
    }
  }
  
  // מציאת הבלוק הימני ביותר בקבוצה
  function findRightmostBlock(blocks) {
    if (!blocks || !blocks.length) return null;
    
    let rightmost = blocks[0];
    let rightmostRect = rightmost.getBoundingClientRect();
    
    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      if (rect.right > rightmostRect.right) {
        rightmost = block;
        rightmostRect = rect;
      }
    }
    
    return rightmost;
  }
  
  // מציאת הבלוק השמאלי ביותר בקבוצה
  function findLeftmostBlock(blocks) {
    if (!blocks || !blocks.length) return null;
    
    let leftmost = blocks[0];
    let leftmostRect = leftmost.getBoundingClientRect();
    
    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      if (rect.left < leftmostRect.left) {
        leftmost = block;
        leftmostRect = rect;
      }
    }
    
    return leftmost;
  }
  
  // מציאת כל זוגות הבלוקים שמחוברים עם רווח
  function findAllConnectedPairsWithGap() {
    const allBlocks = Array.from(document.querySelectorAll('.block:not(.in-drawer)'));
    const pairs = [];
    
    for (let i = 0; i < allBlocks.length; i++) {
      const block1 = allBlocks[i];
      const rect1 = block1.getBoundingClientRect();
      
      for (let j = i + 1; j < allBlocks.length; j++) {
        const block2 = allBlocks[j];
        const rect2 = block2.getBoundingClientRect();
        
        // חישוב מרחק אופקי בין הבלוקים
        const rightToLeftGap = Math.abs(rect1.right - rect2.left);
        
        // יישור אנכי
        const verticalAligned = Math.abs(rect1.top - rect2.top) < 10;
        
        // בדוק אם יש רווח (אבל הם קרובים ביחס)
        if (rightToLeftGap <= 20 && rightToLeftGap > 0 && verticalAligned && rect1.left < rect2.left) {
          // הבלוק הראשון משמאל לשני
          pairs.push({
            left: block1,
            right: block2,
            gap: rightToLeftGap
          });
        }
      }
    }
    
    return pairs;
  }
  
  // תיקון כל הרווחים בחיבורי בלוקים
  function fixAllConnections() {
    const pairs = findAllConnectedPairsWithGap();
    let fixed = 0;
    
    for (const pair of pairs) {
      if (createPerfectConnection(pair.left, pair.right)) {
        fixed++;
      }
    }
    
    if (fixed > 0 && CONFIG.DEBUG) {
      console.log(`[PerfectConnect] תוקנו ${fixed} חיבורים עם רווחים`);
    }
    
    return fixed;
  }
  
  // מציאת קבוצות בלוקים פעילות 
  function findActiveGroups() {
    const groupBlocks = document.querySelectorAll('.group-dragging');
    
    if (groupBlocks.length <= 1) {
      return [];
    }
    
    const groups = [];
    const processedBlocks = new Set();
    
    Array.from(groupBlocks).forEach(block => {
      if (processedBlocks.has(block.id)) return;
      
      // מצא את כל הבלוקים הקשורים (בקבוצה)
      const connectedBlocks = findConnectedBlocks(block);
      
      // סמן את כל הבלוקים כמעובדים
      connectedBlocks.forEach(b => processedBlocks.add(b.id));
      
      // הוסף את הקבוצה
      if (connectedBlocks.length > 0) {
        groups.push(connectedBlocks);
      }
    });
    
    return groups;
  }
  
  // מציאת כל הבלוקים המחוברים לבלוק נתון
  function findConnectedBlocks(startBlock) {
    if (!startBlock) return [];
    
    const visited = new Set([startBlock.id]);
    const queue = [startBlock];
    const result = [startBlock];
    
    while (queue.length > 0) {
      const current = queue.shift();
      const rect = current.getBoundingClientRect();
      
      // בדוק את כל הבלוקים האחרים
      document.querySelectorAll('.group-dragging').forEach(block => {
        if (visited.has(block.id)) return;
        
        const blockRect = block.getBoundingClientRect();
        
        // בדוק אם הבלוקים מחוברים
        const rightToLeftGap = Math.abs(rect.right - blockRect.left);
        const leftToRightGap = Math.abs(rect.left - blockRect.right);
        
        // יישור אנכי
        const verticalAligned = Math.abs(rect.top - blockRect.top) < 10;
        
        if ((rightToLeftGap < 20 || leftToRightGap < 20) && verticalAligned) {
          visited.add(block.id);
          queue.push(block);
          result.push(block);
        }
      });
    }
    
    return result;
  }
  
  // טיפול בחיבור בין כל הקבוצות הפעילות
  function fixAllGroupConnections() {
    const groups = findActiveGroups();
    
    if (groups.length < 2) return 0;
    
    let fixed = 0;
    
    // בדוק חיבורים בין כל זוג קבוצות
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const group1 = groups[i];
        const group2 = groups[j];
        
        // מצא את הבלוק הימני ביותר בקבוצה 1
        const rightmost1 = findRightmostBlock(group1);
        const rightRect1 = rightmost1.getBoundingClientRect();
        
        // מצא את הבלוק השמאלי ביותר בקבוצה 2
        const leftmost2 = findLeftmostBlock(group2);
        const leftRect2 = leftmost2.getBoundingClientRect();
        
        // גם להיפך
        const leftmost1 = findLeftmostBlock(group1);
        const leftRect1 = leftmost1.getBoundingClientRect();
        
        const rightmost2 = findRightmostBlock(group2);
        const rightRect2 = rightmost2.getBoundingClientRect();
        
        // בדוק את המרחק בין הקבוצות
        const dist1to2 = Math.abs(rightRect1.right - leftRect2.left);
        const dist2to1 = Math.abs(rightRect2.right - leftRect1.left);
        
        // יישור אנכי
        const verticalAligned1to2 = Math.abs(rightRect1.top - leftRect2.top) < 10;
        const verticalAligned2to1 = Math.abs(rightRect2.top - leftRect1.top) < 10;
        
        if (dist1to2 < 20 && verticalAligned1to2) {
          // קבוצה 1 משמאל לקבוצה 2
          if (createPerfectConnection(rightmost1, leftmost2)) {
            fixed++;
          }
        } else if (dist2to1 < 20 && verticalAligned2to1) {
          // קבוצה 2 משמאל לקבוצה 1
          if (createPerfectConnection(rightmost2, leftmost1)) {
            fixed++;
          }
        }
      }
    }
    
    if (fixed > 0 && CONFIG.DEBUG) {
      console.log(`[PerfectConnect] תוקנו ${fixed} חיבורי קבוצות`);
    }
    
    return fixed;
  }
  
  // עקיפת הפונקציה המקורית - performSnap
  function overrideSnapFunction() {
    if (typeof window.performSnap === 'function') {
      const originalPerformSnap = window.performSnap;
      
      window.performSnap = function(sourceBlock, targetBlock, direction) {
        // הפעל את הפונקציה המקורית
        const result = originalPerformSnap.apply(this, arguments);
        
        // אם החיבור הצליח והכיוון ימינה, תקן את החיבור
        if (result && direction === 'right') {
          setTimeout(() => {
            createPerfectConnection(sourceBlock, targetBlock);
          }, CONFIG.CONNECTION_DELAY);
        }
        
        return result;
      };
      
      console.log("[PerfectConnect] עקפתי את פונקציית ההצמדה המקורית");
    }
  }
  
  // עקיפת פונקציית mouseUp
  function overrideMouseUpFunction() {
    if (typeof window.handleMouseUp === 'function') {
      const originalMouseUp = window.handleMouseUp;
      
      window.handleMouseUp = function(e) {
        // הפעל את הפונקציה המקורית
        const result = originalMouseUp.apply(this, arguments);
        
        // תקן חיבורים
        setTimeout(() => {
          fixAllConnections();
          fixAllGroupConnections();
        }, CONFIG.CONNECTION_DELAY);
        
        return result;
      };
      
      console.log("[PerfectConnect] עקפתי את פונקציית שחרור העכבר המקורית");
    }
  }
  
  // האזנה לאירועי גרירת קבוצות
  function listenForGroupEvents() {
    document.addEventListener('mouseup', function(e) {
      const draggedGroups = document.querySelectorAll('.group-dragging');
      
      if (draggedGroups.length > 1) {
        // טיפול מיידי בקבוצות
        setTimeout(() => {
          fixAllGroupConnections();
          fixAllConnections();
        }, CONFIG.CONNECTION_DELAY);
        
        // טיפול נוסף
        setTimeout(() => {
          fixAllGroupConnections();
          fixAllConnections();
        }, CONFIG.CONNECTION_DELAY * 10);
      }
    });
    
    console.log("[PerfectConnect] הוספתי האזנה לאירועי גרירת קבוצות");
  }
  
  // הפעלת בדיקה תקופתית של חיבורים
  function startPeriodicCheck() {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    
    checkInterval = setInterval(() => {
      fixAllConnections();
      fixAllGroupConnections();
    }, CONFIG.GROUP_FIX_INTERVAL);
    
    console.log(`[PerfectConnect] הפעלתי בדיקה תקופתית של חיבורים (כל ${CONFIG.GROUP_FIX_INTERVAL}ms)`);
  }
  
  // גילוי והתחלת הטיפול באירועי "חיבור קבוצות" ממודולים קיימים
  function hookIntoExistingModules() {
    // אם קיימת פונקציית חיבור קבוצות, עקוף אותה
    if (typeof window.connectGroups === 'function') {
      const originalConnectGroups = window.connectGroups;
      
      window.connectGroups = function(leftGroup, rightGroup) {
        // הפעל את הפונקציה המקורית
        const result = originalConnectGroups.apply(this, arguments);
        
        // הוסף את הטיפול המושלם
        setTimeout(() => {
          fixAllGroupConnections();
        }, CONFIG.CONNECTION_DELAY);
        
        return result;
      };
      
      console.log("[PerfectConnect] עקפתי את פונקציית חיבור הקבוצות הקיימת");
    }
  }
  
  // אתחול המודול
  function initializeModule() {
    // בדיקה אם המודול כבר אותחל
    if (window.perfectConnectInitialized) {
      console.log("[PerfectConnect] המודול כבר אותחל");
      return;
    }
    
    console.log("[PerfectConnect] מאתחל מודול חיבור פאזל מושלם לקבוצות");
    
    // הזרק סגנונות
    injectStyles();
    
    // עקוף פונקציות קיימות
    overrideSnapFunction();
    overrideMouseUpFunction();
    hookIntoExistingModules();
    
    // האזן לאירועי גרירת קבוצות
    listenForGroupEvents();
    
    // הפעל בדיקה תקופתית
    startPeriodicCheck();
    
    // תיקון ראשוני
    setTimeout(() => {
      fixAllConnections();
      fixAllGroupConnections();
    }, 500);
    
    // סימון אתחול
    window.perfectConnectInitialized = true;
    
    console.log("[PerfectConnect] אתחול המודול הושלם");
  }
  
  // הפעל את המודול
  initializeModule();
})();
