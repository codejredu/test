// מודול פתרון חיבור פאזל - puzzle-fix.js

(function() {
  console.log("[PuzzleFix] טוען מודול תיקון חיבור פאזל");
  
  // קונפיגורציה
  const CONFIG = {
    DEBUG: true,                  // מצב דיבאג
    SNAP_MARGIN: -5,              // שולי הצמדה (שלילי = חפיפה)
    CHECK_INTERVAL: 300,          // בדיקה תקופתית כל X מילישניות
    AUDIO_PATH: 'assets/sound/link.mp3', // צליל חיבור
    PHASE: 1                      // שלב הפיתוח (1 = תיקון שמאל לימין, 2 = תיקון מלא)
  };
  
  // משתנים גלובאליים
  let audioPlayer = null;
  let checkInterval = null;
  
  // אתחול אודיו
  function setupAudio() {
    try {
      if (!window.snapAudio) {
        window.snapAudio = new Audio(CONFIG.AUDIO_PATH);
        window.snapAudio.volume = 0.5;
      }
      audioPlayer = window.snapAudio;
      console.log("[PuzzleFix] מערכת אודיו אותחלה");
    } catch (err) {
      console.warn("[PuzzleFix] שגיאה באתחול אודיו:", err);
    }
  }
  
  // הזרקת סגנונות CSS
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* סגנונות לתיקון חיבור פאזל */
      .puzzle-connection {
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
        transition: none !important;
        transform: none !important;
      }
      
      /* צד שמאל של חיבור */
      .puzzle-left {
        margin-right: ${CONFIG.SNAP_MARGIN}px !important;
        z-index: 10 !important;
        position: relative !important;
      }
      
      /* צד ימין של חיבור */
      .puzzle-right {
        margin-left: ${CONFIG.SNAP_MARGIN}px !important;
        z-index: 9 !important;
        position: relative !important;
      }
      
      /* בלוקים בכללי */
      .block {
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);
    console.log("[PuzzleFix] סגנונות CSS הוזרקו");
  }
  
  // השמע צליל חיבור
  function playConnectionSound() {
    if (audioPlayer) {
      try {
        audioPlayer.currentTime = 0;
        audioPlayer.play();
      } catch (err) {
        console.warn("[PuzzleFix] שגיאה בהשמעת צליל:", err);
      }
    }
  }
  
  // יישור מדויק של בלוק למיקום
  function positionBlockExactly(block, left, top) {
    if (!block) return;
    
    // הגדר סגנונות עם !important
    block.style.cssText = `
      position: absolute !important;
      left: ${left}px !important;
      top: ${top}px !important;
      transform: none !important;
      transition: none !important;
      margin: 0 !important;
      padding: 0 !important;
    `;
    
    // כפה רנדור מחדש
    void block.offsetWidth;
  }
  
  // חיבור פאזל משמאל לימין
  function connectPuzzleLeftToRight(leftBlock, rightBlock) {
    if (!leftBlock || !rightBlock) return false;
    
    // קבל את המיקום הנוכחי
    const leftRect = leftBlock.getBoundingClientRect();
    const rightRect = rightBlock.getBoundingClientRect();
    
    // חשב את המיקום החדש ללא רווחים
    const newLeft = leftRect.right + CONFIG.SNAP_MARGIN;
    
    // מקם את הבלוק הימני במיקום המדויק
    positionBlockExactly(rightBlock, newLeft, leftRect.top);
    
    // הוסף מחלקות CSS למראה פאזל
    leftBlock.classList.add('puzzle-connection', 'puzzle-left');
    rightBlock.classList.add('puzzle-connection', 'puzzle-right');
    
    if (CONFIG.DEBUG) {
      console.log(`[PuzzleFix] ביצוע חיבור פאזל: ${leftBlock.id} -> ${rightBlock.id}`);
    }
    
    // השמע צליל חיבור
    playConnectionSound();
    
    return true;
  }
  
  // מצא את כל הבלוקים המחוברים עם רווחים
  function findAllConnectedBlocksWithGaps() {
    const allBlocks = Array.from(document.querySelectorAll('.block:not(.in-drawer)'));
    const connectedPairs = [];
    
    for (let i = 0; i < allBlocks.length; i++) {
      const block1 = allBlocks[i];
      const rect1 = block1.getBoundingClientRect();
      
      for (let j = 0; j < allBlocks.length; j++) {
        if (i === j) continue;
        
        const block2 = allBlocks[j];
        const rect2 = block2.getBoundingClientRect();
        
        // בדוק אם הבלוקים קרובים מאוד אופקית (אבל יש רווח)
        const horizontalGap = Math.abs(rect1.right - rect2.left);
        
        // בדוק גם יישור אנכי
        const verticalAlignment = Math.abs(rect1.top - rect2.top) < 5;
        
        if (horizontalGap < 5 && horizontalGap > 0 && verticalAlignment && rect1.left < rect2.left) {
          // בלוק 1 משמאל ובלוק 2 מימין
          connectedPairs.push({
            left: block1,
            right: block2,
            gap: horizontalGap
          });
        }
      }
    }
    
    return connectedPairs;
  }
  
  // תיקון כל הרווחים בחיבורי פאזל
  function fixAllPuzzleGaps() {
    const pairs = findAllConnectedBlocksWithGaps();
    let fixed = 0;
    
    for (const pair of pairs) {
      if (connectPuzzleLeftToRight(pair.left, pair.right)) {
        fixed++;
      }
    }
    
    if (fixed > 0 && CONFIG.DEBUG) {
      console.log(`[PuzzleFix] תוקנו ${fixed} רווחים בחיבורי פאזל`);
    }
    
    return fixed;
  }
  
  // עקיפת הפונקציות המקוריות
  function overrideOriginalFunctions() {
    // אם קיימת פונקציית ה-PerformSnap המקורית, עקוף אותה
    if (typeof window.performSnap === 'function') {
      const originalPerformSnap = window.performSnap;
      
      window.performSnap = function(sourceBlock, targetBlock, direction) {
        // קרא לפונקציה המקורית
        const result = originalPerformSnap.apply(this, arguments);
        
        // אם החיבור הצליח, תקן את הרווח
        if (result && direction === 'right') {
          // החיבור הוא משמאל לימין (sourceBlock מימין ל-targetBlock)
          setTimeout(() => {
            connectPuzzleLeftToRight(sourceBlock, targetBlock);
          }, 50);
        }
        
        return result;
      };
    }
    
    // אם קיימת פונקציית ה-MouseUp המקורית, עקוף אותה
    if (typeof window.handleMouseUp === 'function') {
      const originalMouseUp = window.handleMouseUp;
      
      window.handleMouseUp = function(e) {
        // קרא לפונקציה המקורית
        const result = originalMouseUp.apply(this, arguments);
        
        // תקן את כל הרווחים אחרי שחרור העכבר
        setTimeout(fixAllPuzzleGaps, 100);
        
        return result;
      };
    }
    
    console.log("[PuzzleFix] פונקציות מקוריות נעקפו");
  }
  
  // תפיסת אירועי גרירת קבוצות
  function handleGroupDragging() {
    document.addEventListener('mouseup', function(e) {
      // תקן את הרווחים אחרי גרירת קבוצה
      setTimeout(fixAllPuzzleGaps, 150);
    });
  }
  
  // תיקון רווחים בבלוקים קיימים
  function fixExistingConnections() {
    fixAllPuzzleGaps();
  }
  
  // בדיקה תקופתית של רווחים
  function startPeriodicCheck() {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    
    checkInterval = setInterval(fixAllPuzzleGaps, CONFIG.CHECK_INTERVAL);
    console.log(`[PuzzleFix] בדיקה תקופתית הופעלה (כל ${CONFIG.CHECK_INTERVAL}ms)`);
  }
  
  // אתחול המודול
  function initialize() {
    console.log("[PuzzleFix] מאתחל מודול תיקון חיבור פאזל - שלב " + CONFIG.PHASE);
    
    // הזרק סגנונות CSS
    injectStyles();
    
    // הגדר מערכת אודיו
    setupAudio();
    
    // עקוף את הפונקציות המקוריות
    overrideOriginalFunctions();
    
    // הוסף האזנה לגרירת קבוצות
    handleGroupDragging();
    
    // התחל בדיקה תקופתית של רווחים
    startPeriodicCheck();
    
    // בדוק ותקן חיבורים קיימים
    setTimeout(fixExistingConnections, 500);
    
    console.log("[PuzzleFix] אתחול הושלם - שלב " + CONFIG.PHASE);
  }
  
  // הפעל את המודול
  initialize();
})();
