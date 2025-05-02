// group-puzzle-fix.js - תיקון חיבור פאזל לקבוצות בלוקים (גרסה מתוקנת)

(function() {
  console.log("[PuzzleFix] טוען מודול תיקון חיבור פאזל לקבוצות");
  
  // קונפיגורציה - מבוססת ישירות על פרמטרים מקוריים מ-linkageimproved.js
  const CONFIG = {
    DEBUG: true,
    HORIZONTAL_FINE_TUNING_LEFT: 9,   // כמו המקור
    HORIZONTAL_FINE_TUNING_RIGHT: -9, // כמו המקור
    PUZZLE_RIGHT_BULGE_WIDTH: 10,     // כמו המקור
    PUZZLE_LEFT_SOCKET_WIDTH: 10,     // כמו המקור
    VERTICAL_CENTER_OFFSET: 0,        // כמו המקור
    CONNECTION_DELAY: 5,              // זמן קצר מאוד לתיקון חיבור
    CLEAR_OUTLINES_DELAY: 50,         // זמן לניקוי מסגרות
    FIX_INTERVAL: 200                 // בדיקת חיבורים קיימים
  };
  
  // משתנים גלובליים
  let fixInterval = null;
  let originalFunctions = {};
  
  // הזרקת סגנונות CSS
  function injectStyles() {
    const styleId = 'puzzle-fix-group-styles';
    
    // בדוק אם כבר קיים סגנון
    if (document.getElementById(styleId)) {
      document.getElementById(styleId).remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* סגנונות לחיבור פאזל מושלם בקבוצות */
      .puzzle-connected-left {
        z-index: 10 !important;
        position: relative !important;
        margin-right: -1px !important;
      }
      
      .puzzle-connected-right {
        z-index: 9 !important;
        position: relative !important;
        margin-left: -1px !important;
      }
      
      /* ביטול רווחים ושוליים */
      .block {
        box-sizing: border-box !important;
      }
      
      /* ניקוי מסגרות */
      .puzzle-no-outlines,
      .puzzle-no-outlines * {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log("[PuzzleFix] סגנונות CSS הוזרקו");
  }
  
  // פונקציה להצמדה מדויקת של בלוק ימני לשמאלי - זהה לפתרון בקובץ המקורי
  function performPerfectSnap(sourceBlock, targetBlock) {
    if (!sourceBlock || !targetBlock) return false;
    
    try {
      // קבל מיקום נוכחי
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      
      // חשב את המיקום האידאלי ע"פ הפרמטרים המקוריים
      const idealLeft = targetRect.right - CONFIG.PUZZLE_RIGHT_BULGE_WIDTH;
      const idealTop = targetRect.top + CONFIG.VERTICAL_CENTER_OFFSET;
      const adjustedLeft = idealLeft + CONFIG.HORIZONTAL_FINE_TUNING_RIGHT;
      
      // קבל את אזור התכנות
      const pE = document.getElementById('programming-area') || document.querySelector('#program-blocks') || document.body;
      const pR = pE.getBoundingClientRect();
      
      // חשב את המיקום המוחלט
      const absoluteLeft = adjustedLeft - pR.left + pE.scrollLeft;
      const absoluteTop = idealTop - pR.top + pE.scrollTop;
      
      // מקם את הבלוק במיקום המדויק
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = `${Math.round(absoluteLeft)}px`;
      sourceBlock.style.top = `${Math.round(absoluteTop)}px`;
      sourceBlock.style.margin = '0';
      sourceBlock.style.transition = 'none';
      sourceBlock.style.transform = 'none';
      
      // הוסף סימון מתאים
      sourceBlock.classList.add('puzzle-connected-left');
      targetBlock.classList.add('puzzle-connected-right');
      
      // הסר מסגרות
      setTimeout(() => {
        sourceBlock.classList.add('puzzle-no-outlines');
        targetBlock.classList.add('puzzle-no-outlines');
      }, CONFIG.CLEAR_OUTLINES_DELAY);
      
      return true;
    } catch (err) {
      console.error('[PuzzleFix] שגיאה בהצמדה מדויקת:', err);
      return false;
    }
  }
  
  // טיפול בגרירת קבוצות - הצמדה של קבוצה שמאלית לקבוצה ימנית
  function fixGroupConnection(leftGroup, rightGroup) {
    if (!leftGroup || !leftGroup.length || !rightGroup || !rightGroup.length) return false;
    
    try {
      // מצא את הבלוק הימני ביותר בקבוצה השמאלית
      let rightmostInLeft = leftGroup[0];
      let rightmostLeftRect = rightmostInLeft.getBoundingClientRect();
      
      for (const block of leftGroup) {
        const rect = block.getBoundingClientRect();
        if (rect.right > rightmostLeftRect.right) {
          rightmostInLeft = block;
          rightmostLeftRect = rect;
        }
      }
      
      // מצא את הבלוק השמאלי ביותר בקבוצה הימנית
      let leftmostInRight = rightGroup[0];
      let leftmostRightRect = leftmostInRight.getBoundingClientRect();
      
      for (const block of rightGroup) {
        const rect = block.getBoundingClientRect();
        if (rect.left < leftmostRightRect.left) {
          leftmostInRight = block;
          leftmostRightRect = rect;
        }
      }
      
      // הצמד בין הבלוקים
      return performPerfectSnap(rightmostInLeft, leftmostInRight);
    } catch (err) {
      console.error('[PuzzleFix] שגיאה בתיקון חיבור קבוצות:', err);
      return false;
    }
  }
  
  // מציאת כל זוגות הבלוקים שמחוברים עם רווח
  function findConnectedBlockPairs() {
    const allBlocks = Array.from(document.querySelectorAll('.block:not(.in-drawer)'));
    const pairs = [];
    
    for (let i = 0; i < allBlocks.length; i++) {
      const block1 = allBlocks[i];
      const rect1 = block1.getBoundingClientRect();
      
      for (let j = i + 1; j < allBlocks.length; j++) {
        const block2 = allBlocks[j];
        const rect2 = block2.getBoundingClientRect();
        
        // בדוק אם הבלוקים קרובים אופקית (מחוברים)
        const horizontalGap = Math.abs(rect1.right - rect2.left);
        const reverseGap = Math.abs(rect1.left - rect2.right);
        
        // בדוק גם יישור אנכי
        const verticalAligned = Math.abs(rect1.top - rect2.top) < 5;
        
        if (horizontalGap < 5 && horizontalGap > 0 && verticalAligned && rect1.left < rect2.left) {
          // הבלוק הראשון משמאל לשני
          pairs.push({
            left: block1,
            right: block2,
            gap: horizontalGap
          });
        } else if (reverseGap < 5 && reverseGap > 0 && verticalAligned && rect1.right > rect2.right) {
          // הבלוק הראשון מימין לשני
          pairs.push({
            left: block2,
            right: block1,
            gap: reverseGap
          });
        }
      }
    }
    
    return pairs;
  }
  
  // תיקון כל חיבורי הבלוקים עם רווחים
  function fixAllBlockConnections() {
    const pairs = findConnectedBlockPairs();
    let fixed = 0;
    
    for (const pair of pairs) {
      if (performPerfectSnap(pair.left, pair.right)) {
        fixed++;
      }
    }
    
    if (fixed > 0 && CONFIG.DEBUG) {
      console.log(`[PuzzleFix] תוקנו ${fixed} חיבורי בלוקים`);
    }
    
    return fixed;
  }
  
  // טיפול בחיבור קבוצות בלוקים
  function handleGroupConnections() {
    // מצא את כל קבוצות הבלוקים
    const blockGroups = findBlockGroups();
    
    if (blockGroups.length < 2) return false;
    
    let fixed = 0;
    
    // בדוק חיבורים בין כל זוג קבוצות
    for (let i = 0; i < blockGroups.length; i++) {
      for (let j = i + 1; j < blockGroups.length; j++) {
        const group1 = blockGroups[i];
        const group2 = blockGroups[j];
        
        // מצא את הבלוק הימני ביותר מקבוצה 1
        let rightmost1 = group1[0];
        let rightmostRect1 = rightmost1.getBoundingClientRect();
        
        for (const block of group1) {
          const rect = block.getBoundingClientRect();
          if (rect.right > rightmostRect1.right) {
            rightmost1 = block;
            rightmostRect1 = rect;
          }
        }
        
        // מצא את הבלוק השמאלי ביותר מקבוצה 2
        let leftmost2 = group2[0];
        let leftmostRect2 = leftmost2.getBoundingClientRect();
        
        for (const block of group2) {
          const rect = block.getBoundingClientRect();
          if (rect.left < leftmostRect2.left) {
            leftmost2 = block;
            leftmostRect2 = rect;
          }
        }
        
        // בדוק אם הקבוצות קרובות
        const horizontalGap = Math.abs(rightmostRect1.right - leftmostRect2.left);
        const verticalAligned = Math.abs(rightmostRect1.top - leftmostRect2.top) < 10;
        
        if (horizontalGap < 5 && verticalAligned) {
          // הקבוצות קרובות מספיק, תקן את החיבור
          if (performPerfectSnap(rightmost1, leftmost2)) {
            fixed++;
          }
        }
      }
    }
    
    if (fixed > 0 && CONFIG.DEBUG) {
      console.log(`[PuzzleFix] תוקנו ${fixed} חיבורי קבוצות`);
    }
    
    return fixed;
  }
  
  // מציאת כל קבוצות הבלוקים
  function findBlockGroups() {
    const groupBlocks = document.querySelectorAll('.group-dragging');
    if (groupBlocks.length <= 1) {
      return [];
    }
    
    // קבל רשימת כל הקבוצות הקיימות
    const groups = [];
    const processedBlocks = new Set();
    
    Array.from(groupBlocks).forEach(block => {
      if (processedBlocks.has(block.id)) return;
      
      // מצא את כל הבלוקים המחוברים לבלוק הנוכחי
      const connectedBlocks = [block];
      processedBlocks.add(block.id);
      
      // יצירת קבוצה חדשה
      const group = [block];
      
      // BFS למציאת כל הבלוקים המחוברים
      for (let i = 0; i < connectedBlocks.length; i++) {
        const currentBlock = connectedBlocks[i];
        const currentRect = currentBlock.getBoundingClientRect();
        
        // בדוק את כל שאר הבלוקים בקבוצה
        Array.from(groupBlocks).forEach(otherBlock => {
          if (otherBlock.id === currentBlock.id || processedBlocks.has(otherBlock.id)) return;
          
          const otherRect = otherBlock.getBoundingClientRect();
          
          // בדוק אם הבלוקים קרובים מאוד (מחוברים)
          const rightToLeftGap = Math.abs(currentRect.right - otherRect.left);
          const leftToRightGap = Math.abs(currentRect.left - otherRect.right);
          const verticalAligned = Math.abs(currentRect.top - otherRect.top) < 5;
          
          if ((rightToLeftGap < 5 || leftToRightGap < 5) && verticalAligned) {
            // הבלוקים מחוברים
            connectedBlocks.push(otherBlock);
            group.push(otherBlock);
            processedBlocks.add(otherBlock.id);
          }
        });
      }
      
      // הוסף את הקבוצה לרשימת הקבוצות
      if (group.length > 1) {
        groups.push(group);
      }
    });
    
    return groups;
  }
  
  // עקיפת הפונקציות המקוריות
  
  // עקיפת פונקציית ה-performSnap המקורית
  function overridePerformSnapFunction() {
    if (typeof window.performSnap === 'function') {
      originalFunctions.performSnap = window.performSnap;
      
      window.performSnap = function(sourceBlock, targetBlock, direction) {
        // הפעל את הפונקציה המקורית
        const result = originalFunctions.performSnap.apply(this, arguments);
        
        // אם החיבור הצליח, תקן אותו
        if (result && direction === 'right') {
          setTimeout(() => {
            performPerfectSnap(sourceBlock, targetBlock);
          }, CONFIG.CONNECTION_DELAY);
        }
        
        return result;
      };
      
      if (CONFIG.DEBUG) console.log("[PuzzleFix] עקפתי את פונקציית ההצמדה המקורית");
    }
  }
  
  // עקיפת פונקציית ה-handleMouseUp המקורית
  function overrideMouseUpFunction() {
    if (typeof window.handleMouseUp === 'function') {
      originalFunctions.handleMouseUp = window.handleMouseUp;
      
      window.handleMouseUp = function(e) {
        // הפעל את הפונקציה המקורית
        const result = originalFunctions.handleMouseUp.apply(this, arguments);
        
        // בדוק ותקן חיבורים
        setTimeout(() => {
          fixAllBlockConnections();
          handleGroupConnections();
        }, CONFIG.CONNECTION_DELAY);
        
        return result;
      };
      
      if (CONFIG.DEBUG) console.log("[PuzzleFix] עקפתי את פונקציית שחרור העכבר המקורית");
    }
  }
  
  // הוספת מאזינים מיוחדים לאירועי גרירת קבוצות
  function listenToGroupDragEvents() {
    document.addEventListener('mouseup', function(e) {
      const groupBlocks = document.querySelectorAll('.group-dragging');
      
      if (groupBlocks.length > 1) {
        setTimeout(() => {
          handleGroupConnections();
          fixAllBlockConnections();
        }, CONFIG.CONNECTION_DELAY * 2);
      }
    });
    
    if (CONFIG.DEBUG) console.log("[PuzzleFix] הוספתי האזנה לאירועי גרירת קבוצות");
  }
  
  // התחלת בדיקה תקופתית
  function startPeriodicCheck() {
    if (fixInterval) {
      clearInterval(fixInterval);
    }
    
    fixInterval = setInterval(() => {
      fixAllBlockConnections();
      handleGroupConnections();
    }, CONFIG.FIX_INTERVAL);
    
    if (CONFIG.DEBUG) console.log(`[PuzzleFix] הפעלתי בדיקה תקופתית (כל ${CONFIG.FIX_INTERVAL}ms)`);
  }
  
  // אתחול פונקציות תמיכה בחיבור מימין לשמאל
  function addReverseDirectionSupport() {
    // פונקציה זו תוסיף את תמיכה בחיבורים מימין לשמאל בגרסה הבאה
    if (CONFIG.DEBUG) console.log("[PuzzleFix] תמיכה בחיבור מימין לשמאל תתווסף בגרסה הבאה");
  }
  
  // אתחול המודול
  function initializeModule() {
    // בדיקה אם המודול כבר אותחל
    if (window.puzzleFixInitialized) {
      console.log("[PuzzleFix] המודול כבר אותחל - מדלג");
      return;
    }
    
    console.log("[PuzzleFix] מאתחל מודול תיקון חיבור פאזל");
    
    // הזרק סגנונות CSS
    injectStyles();
    
    // עקוף פונקציות מקוריות
    overridePerformSnapFunction();
    overrideMouseUpFunction();
    
    // הוסף האזנה לאירועי גרירה
    listenToGroupDragEvents();
    
    // התחל בדיקה תקופתית
    startPeriodicCheck();
    
    // תיקון ראשוני
    setTimeout(() => {
      fixAllBlockConnections();
      handleGroupConnections();
    }, 500);
    
    // סימון אתחול
    window.puzzleFixInitialized = true;
    
    console.log("[PuzzleFix] אתחול המודול הושלם");
  }
  
  // הפעל
  initializeModule();
})();
