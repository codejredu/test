// group-puzzle-fix.js - פתרון חיבור פאזל לקבוצות בלוקים
// מבוסס על פתרון linkageimproved.js גרסה 3.9.5

(function() {
  console.log("[GroupPuzzle] טוען מודול חיבור פאזל לקבוצות");
  
  // קונפיגורציה
  const CONFIG = {
    DEBUG: true,                      // הדפסת הודעות לוג
    HORIZONTAL_FINE_TUNING_LEFT: 9,   // כוונון עדין שמאל (כמו בפתרון המקורי)
    HORIZONTAL_FINE_TUNING_RIGHT: -9, // כוונון עדין ימין (סגירת רווח)
    VERTICAL_FINE_TUNING: 0,          // כוונון עדין אנכי
    CHECK_INTERVAL: 200,              // בדיקת חיבורים בפעימות
    FIX_OUTLINES_DELAY: 50            // זמן השהייה לתיקון מסגרות
  };
  
  // משתנים גלובליים
  let fixIntervalId = null;
  let originalFunctions = {};
  
  // הזרקת סגנונות CSS
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'group-puzzle-fix-styles';
    style.textContent = `
      /* סגנונות לחיבור פאזל מושלם */
      .group-connected-left {
        z-index: 10 !important;
        position: relative !important;
        margin-right: -1px !important;
      }
      
      .group-connected-right {
        z-index: 9 !important;
        position: relative !important;
        margin-left: -1px !important;
      }
      
      /* ביטול מסגרות בבלוקים מחוברים */
      .group-no-outlines,
      .group-no-outlines * {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log("[GroupPuzzle] סגנונות CSS הוזרקו");
  }
  
  // תיקון מיקום רווחים בין בלוקים מחוברים
  function fixBlockGroupConnections() {
    // מצא את כל הבלוקים המחוברים
    const connectedGroups = findConnectedBlockGroups();
    let fixedCount = 0;
    
    // עבור על כל חיבור ותקן אותו
    for (const connection of connectedGroups) {
      if (fixBlockGroupConnection(connection.left, connection.right)) {
        fixedCount++;
      }
    }
    
    if (fixedCount > 0 && CONFIG.DEBUG) {
      console.log(`[GroupPuzzle] תוקנו ${fixedCount} חיבורי קבוצות בלוקים`);
    }
    
    return fixedCount;
  }
  
  // תיקון חיבור ספציפי בין בלוקים
  function fixBlockGroupConnection(leftBlock, rightBlock) {
    if (!leftBlock || !rightBlock) return false;
    
    try {
      // קבל את המיקום הנוכחי של הבלוקים
      const leftRect = leftBlock.getBoundingClientRect();
      const rightRect = rightBlock.getBoundingClientRect();
      
      // חשב את המיקום האידאלי ליצירת חיבור פאזל
      const idealLeft = leftRect.right + CONFIG.HORIZONTAL_FINE_TUNING_RIGHT;
      const idealTop = leftRect.top + CONFIG.VERTICAL_FINE_TUNING;
      
      // בדוק אם יש צורך בתיקון
      const needsFix = Math.abs(rightRect.left - idealLeft) > 0.5;
      
      if (needsFix) {
        // התאם את המיקום של הבלוק הימני
        const pE = document.getElementById('programming-area') || document.body;
        const pR = pE.getBoundingClientRect();
        
        // חשב מיקום מתוקן
        const fixedLeft = idealLeft - pR.left + pE.scrollLeft;
        const fixedTop = idealTop - pR.top + pE.scrollTop;
        
        // תקן את המיקום
        rightBlock.style.position = 'absolute';
        rightBlock.style.left = `${Math.round(fixedLeft)}px`;
        rightBlock.style.top = `${Math.round(fixedTop)}px`;
        rightBlock.style.margin = '0';
        rightBlock.style.transform = 'none';
        rightBlock.style.transition = 'none';
        
        // הוסף קלאסים לשיפור חיבור פאזל
        leftBlock.classList.add('group-connected-left');
        rightBlock.classList.add('group-connected-right');
        
        // הסר מסגרות מהבלוקים המחוברים
        setTimeout(() => {
          leftBlock.classList.add('group-no-outlines');
          rightBlock.classList.add('group-no-outlines');
        }, CONFIG.FIX_OUTLINES_DELAY);
        
        return true;
      }
    } catch (err) {
      console.error('[GroupPuzzle] שגיאה בתיקון חיבור:', err);
    }
    
    return false;
  }
  
  // מציאת כל קבוצות הבלוקים המחוברות
  function findConnectedBlockGroups() {
    const allBlocks = Array.from(document.querySelectorAll('.block:not(.in-drawer)'));
    const connections = [];
    
    for (let i = 0; i < allBlocks.length; i++) {
      const block1 = allBlocks[i];
      const rect1 = block1.getBoundingClientRect();
      
      for (let j = i + 1; j < allBlocks.length; j++) {
        const block2 = allBlocks[j];
        const rect2 = block2.getBoundingClientRect();
        
        // בדוק אם הבלוקים קרובים אופקית (מחוברים)
        const horizontalGap = Math.abs(rect1.right - rect2.left);
        
        // בדוק גם יישור אנכי
        const verticalAligned = Math.abs(rect1.top - rect2.top) < 10;
        
        if (horizontalGap < 10 && verticalAligned && rect1.left < rect2.left) {
          // הבלוק הראשון משמאל לשני
          connections.push({
            left: block1,
            right: block2,
            gap: horizontalGap
          });
        }
      }
    }
    
    return connections;
  }
  
  // חיבור פאזל בין קבוצות בלוקים
  function connectBlockGroups(sourceGroup, targetBlock) {
    if (!sourceGroup || sourceGroup.length === 0 || !targetBlock) return false;
    
    // מצא את הבלוק הימני ביותר בקבוצת המקור
    let rightmostBlock = sourceGroup[0];
    let rightmostRect = rightmostBlock.getBoundingClientRect();
    
    for (const block of sourceGroup) {
      const rect = block.getBoundingClientRect();
      if (rect.right > rightmostRect.right) {
        rightmostBlock = block;
        rightmostRect = rect;
      }
    }
    
    // חבר את הקבוצה לבלוק היעד (בכיוון שמאל לימין)
    return fixBlockGroupConnection(rightmostBlock, targetBlock);
  }
  
  // עקיפת פונקציית ה-performSnap המקורית
  function overridePerformSnapFunction() {
    if (typeof window.performSnap === 'function') {
      originalFunctions.performSnap = window.performSnap;
      
      window.performSnap = function(sourceBlock, targetBlock, direction) {
        // הפעל את הפונקציה המקורית
        const result = originalFunctions.performSnap.apply(this, arguments);
        
        // אם החיבור הצליח, שפר אותו
        if (result && direction === 'right') {
          setTimeout(() => {
            // בדוק אם מדובר בגרירת קבוצה
            const isDraggingGroup = document.querySelectorAll('.group-dragging').length > 1;
            
            if (isDraggingGroup) {
              // ניסיון לחבר את הקבוצה עם הבלוק
              const groupBlocks = Array.from(document.querySelectorAll('.group-dragging'));
              connectBlockGroups(groupBlocks, targetBlock);
            } else {
              // בלוק בודד, תקן את החיבור הרגיל
              fixBlockGroupConnection(sourceBlock, targetBlock);
            }
          }, 10);
        }
        
        return result;
      };
      
      if (CONFIG.DEBUG) console.log("[GroupPuzzle] עקפתי את פונקציית ההצמדה המקורית");
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
        setTimeout(fixBlockGroupConnections, 20);
        
        return result;
      };
      
      if (CONFIG.DEBUG) console.log("[GroupPuzzle] עקפתי את פונקציית שחרור העכבר המקורית");
    }
  }
  
  // עקיפת פונקציית ה-fixAllPuzzleGaps אם קיימת (לקובץ קודם)
  function overrideFixGapsFunction() {
    if (typeof window.fixAllPuzzleGaps === 'function') {
      originalFunctions.fixAllPuzzleGaps = window.fixAllPuzzleGaps;
      
      window.fixAllPuzzleGaps = function() {
        // הפעל את הפונקציה המקורית
        const result = originalFunctions.fixAllPuzzleGaps.apply(this, arguments);
        
        // הפעל את הפונקציה שלנו
        fixBlockGroupConnections();
        
        return result;
      };
      
      if (CONFIG.DEBUG) console.log("[GroupPuzzle] עקפתי את פונקציית תיקון הרווחים הקודמת");
    }
  }
  
  // האזנה לאירועי גרירת קבוצות
  function listenToGroupDragEvents() {
    document.addEventListener('mouseup', function(e) {
      // בדוק אם אירוע שחרור קבוצה עם הקבוצה .group-dragging
      if (document.querySelectorAll('.group-dragging').length > 1) {
        setTimeout(fixBlockGroupConnections, 20);
      }
    });
    
    if (CONFIG.DEBUG) console.log("[GroupPuzzle] הוספתי האזנה לאירועי גרירת קבוצות");
  }
  
  // הוספת האזנה לשינויים בעץ ה-DOM
  function observeDOMChanges() {
    // יצירת MutationObserver לזיהוי שינויים
    const observer = new MutationObserver((mutations) => {
      // בדוק אם יש שינויים רלוונטיים
      let shouldFix = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || 
            (mutation.type === 'attributes' && 
             (mutation.attributeName === 'style' || 
              mutation.attributeName === 'class'))) {
          shouldFix = true;
          break;
        }
      }
      
      if (shouldFix) {
        // תקן חיבורים אם צריך
        setTimeout(fixBlockGroupConnections, 50);
      }
    });
    
    // התחל להאזין לשינויים באזור התכנות
    const programmingArea = document.getElementById('programming-area') || document.body;
    
    observer.observe(programmingArea, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    if (CONFIG.DEBUG) console.log("[GroupPuzzle] הוספתי האזנה לשינויים ב-DOM");
  }
  
  // האם יש תמיכה חסרה בכיוון הפוך (מימין לשמאל)
  function addReverseDirectionSupport() {
    // פונקציה זו מוסיפה תמיכה בחיבור מימין לשמאל
    // תתווסף בגרסה הבאה אם פתרון הבסיס עובד היטב
    console.log("[GroupPuzzle] תמיכה בחיבור מימין לשמאל תתווסף בגרסה הבאה");
  }
  
  // בדיקה תקופתית של חיבורים
  function startPeriodicCheck() {
    if (fixIntervalId) {
      clearInterval(fixIntervalId);
    }
    
    fixIntervalId = setInterval(fixBlockGroupConnections, CONFIG.CHECK_INTERVAL);
    
    if (CONFIG.DEBUG) console.log("[GroupPuzzle] הפעלתי בדיקה תקופתית של חיבורים");
  }
  
  // אתחול המודול
  function initializeModule() {
    console.log("[GroupPuzzle] מאתחל מודול חיבור פאזל לקבוצות");
    
    // הזרק סגנונות
    injectStyles();
    
    // עקוף פונקציות מקוריות
    overridePerformSnapFunction();
    overrideMouseUpFunction();
    overrideFixGapsFunction();
    
    // הוסף האזנה לאירועים
    listenToGroupDragEvents();
    observeDOMChanges();
    
    // הפעל בדיקה תקופתית
    startPeriodicCheck();
    
    // גרסה זו לא כוללת תמיכה בחיבור מימין לשמאל
    // addReverseDirectionSupport(); // תווסף בגרסה הבאה
    
    // תקן חיבורים קיימים
    setTimeout(fixBlockGroupConnections, 500);
    
    console.log("[GroupPuzzle] אתחול הושלם - שלב 1: תיקון חיבור משמאל לימין");
  }
  
  // הפעל את המודול
  initializeModule();
  
})();
