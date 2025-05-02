// פתרון משופר לחיבור פאזל בין בלוקים וקבוצות - puzzle-connect.js

(function() {
  console.log("[PuzzleFix] טוען מודול חיבור פאזל מושלם");
  
  // קונפיגורציה
  const CONFIG = {
    DEBUG: true,                  // הדפסת הודעות לוג
    SNAP_MARGIN: -2,              // שולי הצמדה (מספר שלילי יוצר חפיפה)
    PUZZLE_GAP_FIX: true,         // האם לתקן רווחים בחיבורי פאזל
    REVERSE_CONNECTION: true,     // האם לאפשר חיבור מימין לשמאל
    CHECK_INTERVAL: 250,          // מרווח זמן לבדיקת חיבורים (מילי-שניות)
    AUDIO_PATH: 'assets/sound/link.mp3'  // נתיב לקובץ צליל
  };
  
  // משתנים גלובליים
  let audioPlayer = null;
  let checkInterval = null;
  let originalHandlers = {};
  
  // אתחול מערכת שמע
  function setupAudio() {
    try {
      audioPlayer = new Audio(CONFIG.AUDIO_PATH);
      audioPlayer.volume = 0.5;
      console.log("[PuzzleFix] מערכת אודיו הוגדרה");
    } catch (e) {
      console.warn("[PuzzleFix] לא ניתן לטעון את קובץ האודיו:", e);
    }
  }
  
  // הזרקת סגנונות CSS לתיקון חיבורי פאזל
  function injectStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* סגנונות לתיקון חיבורי פאזל */
      .puzzle-connected {
        box-sizing: border-box !important;
        margin: 0 !important;
        transition: none !important;
        transform: none !important;
      }
      
      /* חיבור צד ימין */
      .puzzle-right {
        margin-right: ${CONFIG.SNAP_MARGIN}px !important;
        z-index: 10 !important;
        position: relative !important;
      }
      
      /* חיבור צד שמאל */
      .puzzle-left {
        margin-left: ${CONFIG.SNAP_MARGIN}px !important;
        z-index: 9 !important;
        position: relative !important;
      }
      
      /* דגש חזותי על חיבור אפשרי */
      .connection-highlight {
        box-shadow: 0 0 8px 2px rgba(0, 200, 0, 0.7) !important;
        outline: 2px solid rgba(0, 200, 0, 0.7) !important;
      }
    `;
    document.head.appendChild(styleElement);
    console.log("[PuzzleFix] סגנונות CSS הוזרקו");
  }
  
  // איתור בלוקים קרובים לחיבור
  function findNearbyBlocks(block, direction) {
    if (!block) return null;
    
    const allBlocks = Array.from(document.querySelectorAll('.block:not(.in-drawer)'));
    const rect = block.getBoundingClientRect();
    
    // מסנן את הבלוק עצמו
    const otherBlocks = allBlocks.filter(b => b !== block);
    
    // מצא את הבלוק הקרוב ביותר בכיוון המבוקש
    let closestBlock = null;
    let minDistance = 30; // מרחק מקסימלי לחיבור
    
    for (const other of otherBlocks) {
      const otherRect = other.getBoundingClientRect();
      
      // בדוק שהבלוקים באותו גובה בערך
      const verticalAligned = Math.abs(rect.top - otherRect.top) < 10;
      if (!verticalAligned) continue;
      
      let distance;
      if (direction === 'right') {
        // בדוק מרחק מצד ימין של הבלוק הנוכחי לצד שמאל של האחר
        distance = Math.abs(rect.right - otherRect.left);
        
        // וודא שהבלוק האחר באמת מימין
        if (otherRect.left <= rect.right) continue;
      } else if (direction === 'left') {
        // בדוק מרחק מצד שמאל של הבלוק הנוכחי לצד ימין של האחר
        distance = Math.abs(rect.left - otherRect.right);
        
        // וודא שהבלוק האחר באמת משמאל
        if (otherRect.right >= rect.left) continue;
      }
      
      if (distance < minDistance) {
        minDistance = distance;
        closestBlock = other;
      }
    }
    
    return closestBlock ? { block: closestBlock, distance: minDistance } : null;
  }
  
  // יישור מדויק של בלוק למיקום
  function positionBlockExactly(block, left, top) {
    if (!block) return;
    
    // החל סגנונות עם !important
    block.style.cssText = `
      position: absolute !important;
      left: ${left}px !important;
      top: ${top}px !important;
      transform: none !important;
      transition: none !important;
    `;
    
    // כפה רנדור מחדש
    void block.offsetWidth;
  }
  
  // ביצוע חיבור פאזל מדויק בין שני בלוקים
  function performPuzzleConnection(leftBlock, rightBlock) {
    if (!leftBlock || !rightBlock) return false;
    
    const leftRect = leftBlock.getBoundingClientRect();
    const rightRect = rightBlock.getBoundingClientRect();
    
    // חשב מיקום מדויק ללא רווח
    const exactLeft = leftRect.right + CONFIG.SNAP_MARGIN;
    
    // מקם את הבלוק הימני בדיוק
    positionBlockExactly(rightBlock, exactLeft, leftRect.top);
    
    // הוסף מחלקות CSS לחיבור פאזל
    leftBlock.classList.add('puzzle-connected', 'puzzle-right');
    rightBlock.classList.add('puzzle-connected', 'puzzle-left');
    
    // הסר הדגשות חיבור זמניות
    leftBlock.classList.remove('connection-highlight');
    rightBlock.classList.remove('connection-highlight');
    
    // השמע צליל
    playConnectionSound();
    
    if (CONFIG.DEBUG) {
      console.log(`[PuzzleFix] ביצוע חיבור פאזל: ${leftBlock.id} -> ${rightBlock.id}`);
    }
    
    return true;
  }
  
  // הפוך חיבור - בלוק ימני לשמאלי
  function performReverseConnection(rightBlock, leftBlock) {
    if (!leftBlock || !rightBlock) return false;
    
    const leftRect = leftBlock.getBoundingClientRect();
    const rightRect = rightBlock.getBoundingClientRect();
    
    // חשב מיקום מדויק ללא רווח
    const exactLeft = leftRect.right + CONFIG.SNAP_MARGIN;
    
    // מקם את הבלוק הימני בדיוק
    positionBlockExactly(rightBlock, exactLeft, leftRect.top);
    
    // הוסף מחלקות CSS לחיבור פאזל
    leftBlock.classList.add('puzzle-connected', 'puzzle-right');
    rightBlock.classList.add('puzzle-connected', 'puzzle-left');
    
    // הסר הדגשות חיבור זמניות
    leftBlock.classList.remove('connection-highlight');
    rightBlock.classList.remove('connection-highlight');
    
    // השמע צליל
    playConnectionSound();
    
    if (CONFIG.DEBUG) {
      console.log(`[PuzzleFix] ביצוע חיבור פאזל הפוך: ${rightBlock.id} -> ${leftBlock.id}`);
    }
    
    return true;
  }
  
  // השמע צליל חיבור
  function playConnectionSound() {
    if (audioPlayer) {
      try {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
      } catch (e) {
        console.warn("[PuzzleFix] שגיאה בהשמעת צליל:", e);
      }
    }
  }
  
  // טיפול בחיבור קבוצות
  function handleGroupConnection() {
    // בדוק אם יש קבוצת בלוקים בגרירה
    const groupBlocks = Array.from(document.querySelectorAll('.group-dragging'));
    if (groupBlocks.length <= 1) return; // אין קבוצה או רק בלוק אחד
    
    // מצא את הבלוק השמאלי ביותר והימני ביותר בקבוצה
    let leftmostBlock = null;
    let rightmostBlock = null;
    let leftmostRect = null;
    let rightmostRect = null;
    
    for (const block of groupBlocks) {
      const rect = block.getBoundingClientRect();
      
      if (!leftmostBlock || rect.left < leftmostRect.left) {
        leftmostBlock = block;
        leftmostRect = rect;
      }
      
      if (!rightmostBlock || rect.right > rightmostRect.right) {
        rightmostBlock = block;
        rightmostRect = rect;
      }
    }
    
    // חפש בלוקים קרובים לקבוצה משני הצדדים
    const rightTarget = findNearbyBlocks(rightmostBlock, 'right');
    const leftTarget = CONFIG.REVERSE_CONNECTION ? findNearbyBlocks(leftmostBlock, 'left') : null;
    
    // בחר את החיבור הקרוב ביותר
    if (rightTarget && (!leftTarget || rightTarget.distance <= leftTarget.distance)) {
      // חיבור רגיל - מימין הקבוצה לבלוק אחר
      if (rightTarget.distance < 10) {
        performPuzzleConnection(rightmostBlock, rightTarget.block);
      }
    } else if (leftTarget && leftTarget.distance < 10) {
      // חיבור הפוך - משמאל הקבוצה לבלוק אחר
      performReverseConnection(leftTarget.block, leftmostBlock);
    }
  }
  
  // מיפוי הפונקציות המקוריות והחלפתן
  function overrideOriginalFunctions() {
    // שמור את הפונקציה המקורית performSnap אם קיימת
    if (typeof window.performSnap === 'function') {
      originalHandlers.performSnap = window.performSnap;
      
      // החלף עם הגרסה המשופרת שלנו
      window.performSnap = function(sourceBlock, targetBlock, direction) {
        // קרא לפונקציה המקורית
        const result = originalHandlers.performSnap.call(this, sourceBlock, targetBlock, direction);
        
        // תקן את הרווח בחיבור
        if (result && CONFIG.PUZZLE_GAP_FIX) {
          if (direction === 'right') {
            // כיוון רגיל - source מחובר ל-target מימין
            setTimeout(() => performPuzzleConnection(sourceBlock, targetBlock), 50);
          } else if (direction === 'left' && CONFIG.REVERSE_CONNECTION) {
            // כיוון הפוך - source מחובר ל-target משמאל
            setTimeout(() => performReverseConnection(targetBlock, sourceBlock), 50);
          }
        }
        
        return result;
      };
    }
    
    // שמור את הפונקציה המקורית handleMouseUp אם קיימת
    if (typeof window.handleMouseUp === 'function') {
      originalHandlers.handleMouseUp = window.handleMouseUp;
      
      // החלף עם הגרסה המשופרת שלנו
      window.handleMouseUp = function(e) {
        // קרא לפונקציה המקורית
        const result = originalHandlers.handleMouseUp.call(this, e);
        
        // טפל בחיבור קבוצות
        setTimeout(handleGroupConnection, 50);
        
        // טפל בכל הרווחים שנותרו
        setTimeout(fixAllPuzzleGaps, 100);
        
        return result;
      };
    }
    
    console.log("[PuzzleFix] דורס פונקציות חיבור מקוריות");
  }
  
  // מצא וקבל את כל הבלוקים שיש רווח ביניהם
  function findAllPuzzleGaps() {
    const allBlocks = Array.from(document.querySelectorAll('.block:not(.in-drawer)'));
    const pairs = [];
    
    for (let i = 0; i < allBlocks.length; i++) {
      const block1 = allBlocks[i];
      const rect1 = block1.getBoundingClientRect();
      
      for (let j = i + 1; j < allBlocks.length; j++) {
        const block2 = allBlocks[j];
        const rect2 = block2.getBoundingClientRect();
        
        // בדיקת קרבה אופקית ויישור אנכי
        const horizontalGap = Math.abs(rect1.right - rect2.left);
        const reverseGap = Math.abs(rect1.left - rect2.right);
        const verticalAlignment = Math.abs(rect1.top - rect2.top) < 5;
        
        // חיבור רגיל - block1 משמאל ל-block2
        if (horizontalGap < 10 && horizontalGap > 0 && verticalAlignment && rect1.right < rect2.left) {
          pairs.push({
            leftBlock: block1,
            rightBlock: block2,
            gap: horizontalGap
          });
        }
        // חיבור הפוך - block2 משמאל ל-block1
        else if (reverseGap < 10 && reverseGap > 0 && verticalAlignment && rect2.right < rect1.left) {
          pairs.push({
            leftBlock: block2,
            rightBlock: block1,
            gap: reverseGap
          });
        }
      }
    }
    
    return pairs;
  }
  
  // תיקון כל הרווחים בחיבורי פאזל
  function fixAllPuzzleGaps() {
    const pairs = findAllPuzzleGaps();
    let fixed = 0;
    
    for (const pair of pairs) {
      const success = performPuzzleConnection(pair.leftBlock, pair.rightBlock);
      if (success) fixed++;
    }
    
    if (fixed > 0 && CONFIG.DEBUG) {
      console.log(`[PuzzleFix] תוקנו ${fixed} רווחים בחיבורי פאזל`);
    }
    
    return fixed;
  }
  
  // סריקה עתית של רווחים
  function startPeriodicCheck() {
    if (checkInterval) clearInterval(checkInterval);
    
    checkInterval = setInterval(() => {
      if (CONFIG.PUZZLE_GAP_FIX) {
        fixAllPuzzleGaps();
      }
    }, CONFIG.CHECK_INTERVAL);
    
    console.log(`[PuzzleFix] בדיקה עתית הופעלה (כל ${CONFIG.CHECK_INTERVAL}ms)`);
  }
  
  // הוספת מאזיני אירועים לתמיכה בחיבור קבוצות מימין לשמאל
  function setupGroupDragListeners() {
    // האזנה לאירוע mouseup לכל המסמך
    document.addEventListener('mouseup', function(e) {
      // בדיקה רק אם גרירת קבוצה הסתיימה (קורא אחרי המאזינים הקיימים)
      setTimeout(handleGroupConnection, 50);
    });
    
    // האזנה לאירוע mousemove לגילוי חיבורים אפשריים בזמן גרירה
    document.addEventListener('mousemove', function(e) {
      // בדוק אם יש קבוצת בלוקים בגרירה
      const groupBlocks = Array.from(document.querySelectorAll('.group-dragging'));
      if (groupBlocks.length <= 1) return; // אין קבוצה או רק בלוק אחד
      
      // מצא את הבלוק הימני ביותר בקבוצה
      let rightmostBlock = null;
      let rightmostRect = null;
      
      for (const block of groupBlocks) {
        const rect = block.getBoundingClientRect();
        
        if (!rightmostBlock || rect.right > rightmostRect.right) {
          rightmostBlock = block;
          rightmostRect = rect;
        }
      }
      
      // חפש בלוקים קרובים מימין
      const rightTarget = findNearbyBlocks(rightmostBlock, 'right');
      
      // הוסף הדגשה חזותית לבלוקים קרובים לחיבור
      if (rightTarget && rightTarget.distance < 15) {
        rightmostBlock.classList.add('connection-highlight');
        rightTarget.block.classList.add('connection-highlight');
      } else {
        // הסר הדגשות קודמות
        document.querySelectorAll('.connection-highlight').forEach(el => {
          el.classList.remove('connection-highlight');
        });
      }
      
      // אם תמיכה בחיבור מימין לשמאל מופעלת, חפש גם בכיוון הפוך
      if (CONFIG.REVERSE_CONNECTION) {
        // מצא את הבלוק השמאלי ביותר בקבוצה
        let leftmostBlock = null;
        let leftmostRect = null;
        
        for (const block of groupBlocks) {
          const rect = block.getBoundingClientRect();
          
          if (!leftmostBlock || rect.left < leftmostRect.left) {
            leftmostBlock = block;
            leftmostRect = rect;
          }
        }
        
        // חפש בלוקים קרובים משמאל
        const leftTarget = findNearbyBlocks(leftmostBlock, 'left');
        
        // הוסף הדגשה חזותית לבלוקים קרובים לחיבור
        if (leftTarget && leftTarget.distance < 15) {
          leftmostBlock.classList.add('connection-highlight');
          leftTarget.block.classList.add('connection-highlight');
        }
      }
    });
    
    console.log("[PuzzleFix] נוספו מאזינים לתמיכה בגרירת קבוצות");
  }
  
  // אתחול המודול
  function initialize() {
    console.log("[PuzzleFix] מאתחל מודול תיקון חיבור פאזל");
    
    // הזרק סגנונות CSS
    injectStyles();
    
    // אתחל מערכת שמע
    setupAudio();
    
    // החלף את הפונקציות המקוריות
    overrideOriginalFunctions();
    
    // תפיסת אירועי גרירת קבוצה
    setupGroupDragListeners();
    
    // התחל בדיקה עתית
    startPeriodicCheck();
    
    // ביצוע תיקון ראשוני
    setTimeout(fixAllPuzzleGaps, 500);
    
    console.log("[PuzzleFix] אתחול הושלם");
  }
  
  // הפעל את המודול
  initialize();
})();
