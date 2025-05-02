// group-puzzle-fix.js - תיקון חיבור פאזל מושלם לקבוצות בלוקים

(function() {
  console.log("[PuzzleFix] טוען מודול תיקון חיבור פאזל מושלם");
  
  // קונפיגורציה עם פרמטרים מכוונים במדויק לסגירת הרווח
  const CONFIG = {
    DEBUG: true,
    // כוונון עדין - עכשיו עם ערכים חזקים יותר לסגירת הרווח
    HORIZONTAL_FINE_TUNING_LEFT: 10,      // מוגדל
    HORIZONTAL_FINE_TUNING_RIGHT: -11,    // מוגדל
    PUZZLE_OVERLAP: -2,                   // חפיפה של פיקסלים
    VERTICAL_CENTER_OFFSET: 0,            // יישור אנכי
    CONNECTION_DELAY: 5,                  // תגובה מיידית
    CLEAR_OUTLINES_DELAY: 30,             // ניקוי מסגרות מהיר
    FIX_INTERVAL: 100,                    // בדיקה תכופה יותר
    FORCE_CSS_SNAP: true                  // הכרח חיבור ע"י CSS
  };
  
  // משתנים גלובליים
  let fixInterval = null;
  let originalFunctions = {};
  
  // הזרקת סגנונות CSS משופרים עם חפיפה כפויה
  function injectStyles() {
    const styleId = 'puzzle-fix-perfect-styles';
    
    // בדוק אם כבר קיים סגנון
    if (document.getElementById(styleId)) {
      document.getElementById(styleId).remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* סגנונות משופרים לחיבור פאזל מושלם */
      .puzzle-connected-left {
        z-index: 11 !important;
        position: relative !important;
        margin-right: ${CONFIG.PUZZLE_OVERLAP}px !important;
        padding-right: 0 !important;
        border-right: 0 !important;
      }
      
      .puzzle-connected-right {
        z-index: 9 !important;
        position: relative !important;
        margin-left: ${CONFIG.PUZZLE_OVERLAP}px !important;
        padding-left: 0 !important;
        border-left: 0 !important;
      }
      
      /* ביטול רווחים ושוליים לכל הבלוקים */
      .block {
        box-sizing: border-box !important;
      }
      
      /* ניקוי מסגרות */
      .puzzle-no-outlines,
      .puzzle-no-outlines * {
        outline: none !important;
        box-shadow: none !important;
      }
      
      /* כפיית חיבור יחסי בין בלוקים */
      .perfect-connection .block {
        transform: none !important;
        transition: none !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log("[PuzzleFix] סגנונות CSS משופרים הוזרקו");
  }
  
  // פונקציה להצמדה מושלמת של בלוק ימני לשמאלי
  function performPerfectSnap(sourceBlock, targetBlock) {
    if (!sourceBlock || !targetBlock) return false;
    
    try {
      // קבל מיקום נוכחי
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      
      // קבל אזור התכנות
      const pE = document.getElementById('programming-area') || document.querySelector('#program-blocks') || document.body;
      const pR = pE.getBoundingClientRect();
      
      // חשב היסטים לפי הפרמטרים המשופרים
      // נקודה קריטית: מיקום שמונע רווח כלשהו
      const idealLeft = targetRect.right + CONFIG.HORIZONTAL_FINE_TUNING_RIGHT - 1;
      const idealTop = targetRect.top + CONFIG.VERTICAL_CENTER_OFFSET;
      
      // חשב מיקום מוחלט בדף
      const absoluteLeft = idealLeft - pR.left + pE.scrollLeft;
      const absoluteTop = idealTop - pR.top + pE.scrollTop;
      
      // החל מיקום מדויק (ללא שימוש ב-transition)
      sourceBlock.style.cssText = `
        position: absolute !important;
        left: ${Math.round(absoluteLeft)}px !important;
        top: ${Math.round(absoluteTop)}px !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        transition: none !important;
        transform: none !important;
      `;
      
      // כפה רנדור מחדש של הבלוק
      void sourceBlock.offsetWidth;
      
      // הוסף סימון והסר מסגרות
      sourceBlock.classList.add('puzzle-connected-left');
      targetBlock.classList.add('puzzle-connected-right');
      
      // בטל מעברים לשני הבלוקים
      targetBlock.style.transition = 'none';
      targetBlock.style.transform = 'none';
      targetBlock.style.margin = '0';
      targetBlock.style.padding = '0';
      targetBlock.style.border = '0';
      
      // הוסף קלאס לאב משותף (אם קיים)
      const parent = sourceBlock.parentElement;
      if (parent) {
        parent.classList.add('perfect-connection');
      }
      
      // הסר מסגרות
      setTimeout(() => {
        sourceBlock.classList.add('puzzle-no-outlines');
        targetBlock.classList.add('puzzle-no-outlines');
      }, CONFIG.CLEAR_OUTLINES_DELAY);
      
      if (CONFIG.DEBUG) {
        console.log(`[PuzzleFix] בוצע חיבור מושלם בין ${sourceBlock.id} ל-${targetBlock.id}`);
        console.log(`[PuzzleFix] מיקום: L=${Math.round(absoluteLeft)}, T=${Math.round(absoluteTop)}`);
      }
      
      return true;
    } catch (err) {
      console.error('[PuzzleFix] שגיאה בהצמדה מושלמת:', err);
      return false;
    }
  }
  
  // טיפול בחיבור בין קבוצות בלוקים
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
      
      // בצע הצמדה מושלמת בין שני הבלוקים
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
        
        // בדוק אם הבלוקים קרובים אופקית (מחוברים עם רווח)
        const horizontalGap = Math.abs(rect1.right - rect2.left);
        const reverseGap = Math.abs(rect1.left - rect2.right);
        
        // בדוק גם יישור אנכי
        const verticalAligned = Math.abs(rect1.top - rect2.top) < 8;
        
        if (horizontalGap < 15 && verticalAligned && rect1.left < rect2.left) {
          // הבלוק הראשון משמאל לשני
          pairs.push({
            left: block1,
            right: block2,
            gap: horizontalGap
          });
        } else if (reverseGap < 15 && verticalAligned && rect1.left > rect2.left) {
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
  
  // מציאת קבוצות בלוקים פעילות
  function findActiveBlockGroups() {
    const groupDraggingBlocks = document.querySelectorAll('.group-dragging');
    
    if (groupDraggingBlocks.length <= 1) {
      return [];
    }
    
    // מפה של בלוקים לפי קבוצות (מזהה קבוצה -> רשימת בלוקים)
    const groupMap = new Map();
    
    // עבור על כל הבלוקים ובדוק אילו קבוצות הם יוצרים
    Array.from(groupDraggingBlocks).forEach(block => {
      const rect = block.getBoundingClientRect();
      
      // בדוק אם הבלוק כבר משויך לקבוצה
      let foundGroup = false;
      
      for (const [groupId, blocks] of groupMap.entries()) {
        for (const groupBlock of blocks) {
          const groupRect = groupBlock.getBoundingClientRect();
          
          // בדוק אם הבלוקים קרובים מאוד (באותה קבוצה)
          const horizontalDistance = Math.min(
            Math.abs(rect.right - groupRect.left),
            Math.abs(rect.left - groupRect.right)
          );
          
          const verticalAligned = Math.abs(rect.top - groupRect.top) < 10;
          
          if (horizontalDistance < 15 && verticalAligned) {
            // הבלוק שייך לקבוצה זו
            groupMap.get(groupId).push(block);
            foundGroup = true;
            break;
          }
        }
        
        if (foundGroup) break;
      }
      
      // אם הבלוק לא משויך לאף קבוצה, צור קבוצה חדשה
      if (!foundGroup) {
        const newGroupId = 'group_' + Math.random().toString(36).substr(2, 9);
        groupMap.set(newGroupId, [block]);
      }
    });
    
    // המר את מפת הקבוצות לרשימת קבוצות
    return Array.from(groupMap.values()).filter(group => group.length > 0);
  }
  
  // טיפול בחיבור קבוצות בלוקים
  function handleGroupConnections() {
    // מצא את כל קבוצות הבלוקים הפעילות
    const blockGroups = findActiveBlockGroups();
    
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
        
        if (horizontalGap < 15 && verticalAligned) {
          // הקבוצות קרובות מספיק, בצע חיבור מושלם
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
  
  // אם יש פונקציה של טיפול בקבוצות, עקוף גם אותה
  function overrideGroupHandlers() {
    // עקיפת פונקציית סיום גרירת קבוצה אם קיימת
    if (typeof window.handleGroupDragEnd === 'function') {
      originalFunctions.handleGroupDragEnd = window.handleGroupDragEnd;
      
      window.handleGroupDragEnd = function(e) {
        // הפעל את הפונקציה המקורית
        const result = originalFunctions.handleGroupDragEnd.apply(this, arguments);
        
        // בדוק ותקן חיבורים
        setTimeout(() => {
          fixAllBlockConnections();
          handleGroupConnections();
        }, CONFIG.CONNECTION_DELAY);
        
        return result;
      };
      
      if (CONFIG.DEBUG) console.log("[PuzzleFix] עקפתי את פונקציית סיום גרירת קבוצה");
    }
  }
  
  // האזנה לאירועי גרירת קבוצות
  function listenToGroupDragEvents() {
    document.addEventListener('mouseup', function(e) {
      // בדוק אם זו גרירת קבוצה
      const groupBlocks = document.querySelectorAll('.group-dragging');
      
      if (groupBlocks.length > 1) {
        // טיפול מיידי בקבוצות
        setTimeout(() => {
          handleGroupConnections();
          fixAllBlockConnections();
        }, CONFIG.CONNECTION_DELAY);
        
        // טיפול נוסף לאחר זמן קצר
        setTimeout(() => {
          handleGroupConnections();
          fixAllBlockConnections();
        }, CONFIG.CONNECTION_DELAY * 5);
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
  
  // אתחול המודול
  function initializeModule() {
    // בדיקה אם המודול כבר אותחל
    if (window.puzzleFixPerfectInitialized) {
      console.log("[PuzzleFix] המודול כבר אותחל - מדלג");
      return;
    }
    
    console.log("[PuzzleFix] מאתחל מודול תיקון חיבור פאזל מושלם");
    
    // הזרק סגנונות CSS
    injectStyles();
    
    // עקוף פונקציות מקוריות
    overridePerformSnapFunction();
    overrideMouseUpFunction();
    overrideGroupHandlers();
    
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
    window.puzzleFixPerfectInitialized = true;
    
    console.log("[PuzzleFix] אתחול מודול חיבור פאזל מושלם הושלם");
  }
  
  // הפעל את המודול
  initializeModule();
})();
