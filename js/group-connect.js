// --- GROUP-CONNECT.JS v1.1.0 (FIXED) ---
// מודול לחיבור בין קבוצות בלוקים מחוברים
// יש להוסיף אחרי הקבצים linkageimproved.js ו-linkage-group-drag-simplified.js

(function() {
  'use strict';
  
  // === משתנים גלובליים ===
  let potentialConnectSource = null;   // קבוצת המקור הפוטנציאלית לחיבור
  let potentialConnectTarget = null;   // בלוק יעד פוטנציאלי לחיבור
  let connectDirection = null;         // כיוון החיבור ('right' או 'left')
  let lastCheckTime = 0;               // זמן הבדיקה האחרונה (למניעת עומס)
  let isConnecting = false;            // נעילה למניעת חיבורים מרובים בו-זמנית
  let draggedGroupBlocks = [];         // מאגר הבלוקים בקבוצה הנגררת הנוכחית
  
  // === הגדרות ===
  const config = {
    debug: true,                       // האם להדפיס הודעות דיבאג בקונסול
    connectThreshold: 70,              // מרחק בפיקסלים לזיהוי אפשרות חיבור (הוגדל מ-50)
    connectHighlightColor: '#FF9800',  // צבע הדגשה לנקודות חיבור פוטנציאליות
    verticalOverlapRequired: 0.2,      // החפיפה האנכית הנדרשת כאחוז מגובה הבלוק (הופחת מ-0.3)
    checkInterval: 50,                 // זמן מינימלי בין בדיקות חיבור (הופחת מ-100 למילישניות)
    
    // ערכי היסט מדויקים לחיבור אופקי (הוגדלו להבטחת חיבור נכון)
    LEFT_CONNECTION_OFFSET: -12,       // היסט שמאלי (הוגדל מ-9)
    RIGHT_CONNECTION_OFFSET: 12,       // היסט ימני (הוגדל מ-9)
    
    // מאפייני יציבות
    connectionDelayMs: 50,             // השהייה לפני ביצוע החיבור בפועל
    preserveGroupIntegrity: true,      // האם לשמור על שלמות הקבוצה בעת חיבור
    maxRetries: 3                      // כמות נסיונות חיבור מקסימלית במקרה של כשל
  };
  
  // === פונקציות עזר ===
  
  // הדפסת הודעות דיבאג
  function log(message, data) {
    if (config.debug) {
      if (data) {
        console.log(`[GroupConnect] ${message}`, data);
      } else {
        console.log(`[GroupConnect] ${message}`);
      }
    }
  }
  
  // חיבור ידני בין בלוקים במקרה שאין גישה לפונקציה המקורית - משופר
  function connectBlocksManually(sourceBlock, targetBlock, direction) {
    try {
      log(`מבצע חיבור ידני: sourceBlock=${sourceBlock.id}, targetBlock=${targetBlock.id}, direction=${direction}`);
      
      // שמור את המיקום המקורי של הבלוקים לפני החיבור
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const programArea = document.getElementById('program-blocks');
      
      if (!programArea) {
        log("אזור התכנות לא נמצא!");
        return false;
      }
      
      const areaRect = programArea.getBoundingClientRect();
      
      // חשב את המיקום החדש ואז הגדר את היחס בין הבלוקים
      let newLeft, newTop;
      
      if (direction === 'right') {
        // חיבור הצד הימני של המקור לצד שמאלי של היעד
        newLeft = targetRect.left - sourceRect.width + config.LEFT_CONNECTION_OFFSET;
        newTop = targetRect.top;
      } else {
        // חיבור הצד השמאלי של המקור לצד ימני של היעד
        newLeft = targetRect.right + config.RIGHT_CONNECTION_OFFSET;
        newTop = targetRect.top;
      }
      
      // התאם למיקום יחסי לאזור התכנות
      const finalLeft = Math.round(newLeft - areaRect.left + programArea.scrollLeft);
      const finalTop = Math.round(newTop - areaRect.top + programArea.scrollTop);
      
      log(`מיקום סופי: finalLeft=${finalLeft}, finalTop=${finalTop}`);
      
      // קביעת המיקום
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = `${finalLeft}px`;
      sourceBlock.style.top = `${finalTop}px`;
      sourceBlock.style.margin = '0';
      
      // עדכן את סימוני החיבור בין הבלוקים
      updateBlockConnections(sourceBlock, targetBlock, direction);
      
      // סמן את הבלוקים כמחוברים
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      
      // טיפול במסגרות
      sourceBlock.classList.add('no-outlines');
      targetBlock.classList.add('no-outlines');
      
      // נקה גרירה
      sourceBlock.classList.remove('group-dragging');
      
      log(`חיבור ידני בוצע בהצלחה עם היסט ${direction === 'right' ? config.LEFT_CONNECTION_OFFSET : config.RIGHT_CONNECTION_OFFSET}`);
      return true;
    } catch (err) {
      console.error('[GroupConnect] שגיאה בביצוע חיבור ידני:', err);
      return false;
    }
  }
  
  // === מאזיני אירועים ===
  
  // מאזין למסמך - בדיקת אפשרויות חיבור בזמן תזוזת העכבר
  function handleDocumentMouseMove(event) {
    // בדיקת מצב לחצני העכבר - דרושה גרירה פעילה
    if (event.buttons !== 1) return; // 1 = לחצן שמאלי
    
    // בדוק אם יש גרירת קבוצה פעילה
    checkForConnectOpportunity();
  }
  
  // מאזין לשחרור העכבר - ביצוע חיבור אם יש אפשרות
  function handleDocumentMouseUp() {
    // בדוק אם יש אפשרות חיבור פעילה
    if (potentialConnectSource && potentialConnectTarget) {
      // בצע את החיבור
      connectGroups();
    }
    
    // נקה את ההדגשות בכל מקרה
    clearConnectionHighlights();
  }
  
  // תמיכה בטאץ' - מגע
  function handleTouchMove(event) {
    if (event.touches.length !== 1) return;
    // המשך לבדיקת חיבור
    checkForConnectOpportunity();
  }
  
  function handleTouchEnd() {
    // בדוק אם יש אפשרות חיבור פעילה
    if (potentialConnectSource && potentialConnectTarget) {
      // בצע את החיבור
      connectGroups();
    }
    
    // נקה את ההדגשות בכל מקרה
    clearConnectionHighlights();
  }
  
  // אתחול המודול
  function initModule() {
    const initFlag = 'groupConnectInitialized_v1_1_0';
    if (window[initFlag]) {
      if (config.debug) {
        log("מודול חיבור קבוצות כבר אותחל. מדלג.");
      }
      return;
    }
    
    log("אתחול מודול חיבור קבוצות");
    
    try {
      // בדוק אם מודול גרירת הקבוצות קיים
      if (typeof window.groupDragInitialized === 'undefined') {
        log("מודול גרירת קבוצות לא זוהה! הפעלה במצב אוטונומי.");
      } else {
        log("זוהה מודול גרירת קבוצות - שימוש באינטרפייס שלו כשניתן.");
      }
      
      // הוסף סגנונות CSS
      addConnectStyles();
      
      // הוסף מאזיני אירועים
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      
      // תמיכה במגע
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      // חפש הגדרות כיוונון בקוד המקורי אם קיימות
      if (typeof window.CONFIG !== 'undefined') {
        if (window.CONFIG.HORIZONTAL_FINE_TUNING_LEFT !== undefined) {
          config.LEFT_CONNECTION_OFFSET = window.CONFIG.HORIZONTAL_FINE_TUNING_LEFT;
          log(`אימוץ היסט שמאלי ממודול מקורי: ${config.LEFT_CONNECTION_OFFSET}`);
        }
        
        if (window.CONFIG.HORIZONTAL_FINE_TUNING_RIGHT !== undefined) {
          config.RIGHT_CONNECTION_OFFSET = window.CONFIG.HORIZONTAL_FINE_TUNING_RIGHT;
          log(`אימוץ היסט ימני ממודול מקורי: ${config.RIGHT_CONNECTION_OFFSET}`);
        }
      }
      
      // חשיפת API לשימוש חיצוני
      window.groupConnectApi = {
        highlightConnection,
        clearConnectionHighlights,
        connectGroups,
        findConnectedBlocks,
        config, // מאפשר שינוי ההגדרות מבחוץ
        
        // פונקציות בדיקה
        testConnections: () => {
          log("בודק חיבורים קיימים במסמך...");
          const blocks = document.querySelectorAll('.block-container');
          const connectionStats = {
            total: blocks.length,
            connected: 0,
            disconnected: 0,
            groups: 0
          };
          
          // בדוק כל בלוק
          blocks.forEach(block => {
            const connections = findConnectedBlocks(block);
            if (connections.length > 1) {
              connectionStats.connected++;
            } else {
              connectionStats.disconnected++;
            }
          });
          
          // חשב את מספר הקבוצות הייחודיות
          const processedIds = new Set();
          blocks.forEach(block => {
            if (processedIds.has(block.id)) return;
            
            const group = findConnectedBlocks(block);
            if (group.length > 1) {
              connectionStats.groups++;
              group.forEach(b => processedIds.add(b.id));
            }
          });
          
          return connectionStats;
        },
        
        // בדיקת חיבור ספציפי
        testConnection: (blockId1, blockId2) => {
          const block1 = document.getElementById(blockId1);
          const block2 = document.getElementById(blockId2);
          
          if (!block1 || !block2) {
            return { success: false, error: "בלוק לא נמצא" };
          }
          
          const group1 = findConnectedBlocks(block1);
          return {
            success: true,
            connected: group1.includes(block2),
            group1Size: group1.length,
            group1Ids: group1.map(b => b.id)
          };
        }
      };
      
      // סמן שהמודול אותחל
      window[initFlag] = true;
      window.groupConnectInitialized = true;
      
      log("מודול חיבור קבוצות אותחל בהצלחה");
      log(`גילוי חיבורים: טווח ${config.connectThreshold}px עם היסט שמאלי ${config.LEFT_CONNECTION_OFFSET} וימני ${config.RIGHT_CONNECTION_OFFSET}`);
      
      // נקה משאבים בעת פריקת הדף
      window.addEventListener('beforeunload', () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      });
    } catch (err) {
      console.error('[GroupConnect] שגיאה באתחול מודול חיבור קבוצות:', err);
    }
  }
  
  // הפעל את האתחול כאשר המסמך נטען
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initModule, 500)); // הפחתת ההשהיה מ-1000 ל-500
  } else {
    // הדף כבר נטען, אתחל אחרי השהייה קצרה
    setTimeout(initModule, 500);
  }
  
})();
  
  // הוספת סגנונות CSS לחיבור בין קבוצות
  function addConnectStyles() {
    const oldStyle = document.getElementById('group-connect-styles');
    if (oldStyle) oldStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'group-connect-styles';
    style.textContent = `
      /* סגנונות לחיבור בין קבוצות */
      .connection-point {
        position: absolute;
        width: 16px;
        height: 16px;
        background-color: ${config.connectHighlightColor};
        border-radius: 50%;
        z-index: 2000;
        box-shadow: 0 0 8px ${config.connectHighlightColor};
        pointer-events: none;
        animation: connectionPulse 0.6s infinite alternate;
      }
      
      @keyframes connectionPulse {
        0% { transform: scale(1); opacity: 0.7; }
        100% { transform: scale(1.3); opacity: 1; }
      }
      
      .connection-left {
        top: 50%;
        left: -8px;
        transform: translateY(-50%);
      }
      
      .connection-right {
        top: 50%;
        right: -8px;
        transform: translateY(-50%);
      }
      
      .potential-connect {
        box-shadow: 0 0 8px ${config.connectHighlightColor};
        z-index: 1001;
      }
      
      /* סגנונות חדשים להבטחת יציבות */
      .connecting-group {
        opacity: 0.9;
        pointer-events: none;
        transition: transform 0.3s ease;
      }
      
      .connection-success {
        box-shadow: 0 0 12px #4CAF50;
      }
    `;
    
    document.head.appendChild(style);
    log('סגנונות חיבור קבוצות נוספו');
  }
  
  // בדיקת חפיפה אנכית בין שני בלוקים
  function checkVerticalOverlap(rect1, rect2) {
    // אם אחד המלבנים לא תקין, החזר שקר
    if (!rect1 || !rect2 || !rect1.height || !rect2.height) {
      return false;
    }
    
    const topOverlap = Math.max(rect1.top, rect2.top);
    const bottomOverlap = Math.min(rect1.bottom, rect2.bottom);
    const overlapHeight = bottomOverlap - topOverlap;
    
    if (overlapHeight <= 0) {
      return false; // אין חפיפה בכלל
    }
    
    // חפיפה אנכית מספקת אם היא יותר מאחוז מסוים מגובה הבלוק הקטן יותר
    const minHeight = Math.min(rect1.height, rect2.height);
    const overlapRatio = overlapHeight / minHeight;
    
    return overlapRatio >= config.verticalOverlapRequired;
  }
  
  // ניקוי הדגשות חיבור פוטנציאלי
  function clearConnectionHighlights() {
    // הסר את נקודות החיבור
    document.querySelectorAll('.connection-point').forEach(point => point.remove());
    
    // הסר את הדגשת הבלוקים
    document.querySelectorAll('.potential-connect').forEach(block => {
      block.classList.remove('potential-connect');
    });
    
    // הסר את סימון החיבור המוצלח
    document.querySelectorAll('.connection-success').forEach(block => {
      block.classList.remove('connection-success');
    });
  }
  
  // הדגשת חיבור פוטנציאלי בין בלוקים
  function highlightConnection(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock) {
      log("לא ניתן להדגיש חיבור - חסרים בלוקים");
      return;
    }
    
    try {
      // נקה הדגשות קודמות
      clearConnectionHighlights();
      
      if (direction === 'right') {
        // הצד הימני של המקור לצד שמאל של היעד
        const rightPoint = document.createElement('div');
        rightPoint.className = 'connection-point connection-right';
        rightPoint.id = 'connection-source-point';
        sourceBlock.appendChild(rightPoint);
        
        const leftPoint = document.createElement('div');
        leftPoint.className = 'connection-point connection-left';
        leftPoint.id = 'connection-target-point';
        targetBlock.appendChild(leftPoint);
      } else {
        // הצד השמאלי של המקור לצד ימין של היעד
        const leftPoint = document.createElement('div');
        leftPoint.className = 'connection-point connection-left';
        leftPoint.id = 'connection-source-point';
        sourceBlock.appendChild(leftPoint);
        
        const rightPoint = document.createElement('div');
        rightPoint.className = 'connection-point connection-right';
        rightPoint.id = 'connection-target-point';
        targetBlock.appendChild(rightPoint);
      }
      
      // הדגש את הבלוקים עצמם
      sourceBlock.classList.add('potential-connect');
      targetBlock.classList.add('potential-connect');
    } catch (err) {
      log(`שגיאה בהדגשת חיבור: ${err.message}`);
    }
  }
  
  // מציאת הבלוק הימני ביותר בקבוצה
  function findRightmostBlock(blocks) {
    if (!blocks || blocks.length === 0) return null;
    
    // מצא את הבלוק עם המיקום הימני ביותר
    let rightmost = blocks[0];
    let rightPosition = rightmost.getBoundingClientRect().right;
    
    for (let i = 1; i < blocks.length; i++) {
      const position = blocks[i].getBoundingClientRect().right;
      if (position > rightPosition) {
        rightPosition = position;
        rightmost = blocks[i];
      }
    }
    
    return rightmost;
  }
  
  // מציאת הבלוק השמאלי ביותר בקבוצה - עם שיפורים
  function findLeftmostBlock(blocks) {
    if (!blocks || blocks.length === 0) return null;
    
    // מצא את הבלוק עם המיקום השמאלי ביותר
    let leftmost = blocks[0];
    let leftPosition = leftmost.getBoundingClientRect().left;
    
    for (let i = 1; i < blocks.length; i++) {
      const position = blocks[i].getBoundingClientRect().left;
      if (position < leftPosition) {
        leftPosition = position;
        leftmost = blocks[i];
      }
    }
    
    return leftmost;
  }
  
  // שמירת רשימת הבלוקים בקבוצה הנגררת
  function storeDraggedGroup(blocks) {
    draggedGroupBlocks = Array.from(blocks || []);
    log(`נשמרו ${draggedGroupBlocks.length} בלוקים בקבוצה הנגררת`);
  }
  
  // בדיקת אפשרות חיבור לקבוצה אחרת בזמן גרירה - פונקציה משופרת
  function checkForConnectOpportunity() {
    const now = Date.now();
    
    // מניעת עומס - בדוק רק אם עבר מספיק זמן מהבדיקה האחרונה
    if (now - lastCheckTime < config.checkInterval) return false;
    lastCheckTime = now;
    
    // אם יש חיבור פעיל, דלג
    if (isConnecting) return false;
    
    // בדוק אם יש גרירת קבוצה פעילה
    const draggedElements = document.querySelectorAll('.group-dragging');
    const isGroupDragging = draggedElements.length > 0;
    
    if (!isGroupDragging) {
      clearConnectionHighlights();
      return false;
    }
    
    // נקה הדגשות קודמות
    clearConnectionHighlights();
    
    // איפוס משתני חיבור
    potentialConnectSource = null;
    potentialConnectTarget = null;
    connectDirection = null;
    
    // מצא את הקבוצה הנגררת ובלוקים קיצוניים
    const draggedBlocks = Array.from(draggedElements);
    storeDraggedGroup(draggedBlocks);
    
    if (draggedBlocks.length === 0) return false;
    
    // בחר API מתאים למציאת בלוקים קיצוניים
    let findLeftmostBlockFn = window.groupDragApi?.findLeftmostBlock || findLeftmostBlock;
    
    // מצא את הבלוקים הקיצוניים בקבוצה הנגררת
    const rightmostBlock = findRightmostBlock(draggedBlocks);
    const leftmostBlock = findLeftmostBlockFn(draggedBlocks);
    
    if (!rightmostBlock || !leftmostBlock) {
      log("לא נמצאו בלוקים קיצוניים בקבוצה הנגררת");
      return false;
    }
    
    // קבל את המלבנים של הבלוקים הקיצוניים
    const rightRect = rightmostBlock.getBoundingClientRect();
    const leftRect = leftmostBlock.getBoundingClientRect();
    
    // מצא את כל הבלוקים שאינם בקבוצה הנגררת
    const programArea = document.getElementById('program-blocks');
    if (!programArea) {
      log("אזור התכנות לא נמצא!");
      return false;
    }
    
    const allBlocks = programArea.querySelectorAll('.block-container');
    const otherBlocks = Array.from(allBlocks).filter(block => !draggedBlocks.includes(block));
    
    // מיפוי זיהוי קבוצות (טיפול בכשלון של קבוצות)
    let otherGroups = [];
    const findConnectedBlocksFn = window.groupDragApi?.findConnectedBlocks || findConnectedBlocks;
    
    // מצא קבוצות אחרות שאינן הקבוצה הנגררת
    const processedBlockIds = new Set();
    
    for (const block of otherBlocks) {
      // דלג על בלוקים שכבר עובדו
      if (processedBlockIds.has(block.id)) continue;
      
      // מצא את כל הבלוקים המחוברים לבלוק הנוכחי
      const connectedGroup = findConnectedBlocksFn(block);
      
      // הוסף את כל הבלוקים בקבוצה לרשימת המעובדים
      connectedGroup.forEach(b => processedBlockIds.add(b.id));
      
      // הוסף את הקבוצה לרשימת הקבוצות אם היא גדולה מספיק
      if (connectedGroup.length > 0) {
        otherGroups.push(connectedGroup);
      }
    }
    
    log(`נמצאו ${otherGroups.length} קבוצות אחרות לבדיקת חיבור`);
    
    // עבור על כל הקבוצות האחרות ובדוק אפשרות חיבור
    for (const group of otherGroups) {
      // בדוק חיבור מימין של הקבוצה הנגררת לשמאל של קבוצה אחרת
      const otherLeftmost = findLeftmostBlockFn(group);
      
      if (otherLeftmost) {
        const canConnectFromRight = !otherLeftmost.hasAttribute('data-connected-from-left') || 
                                  otherLeftmost.getAttribute('data-connected-from-left') === "";
        
        if (canConnectFromRight) {
          const otherRect = otherLeftmost.getBoundingClientRect();
          const distance = Math.abs(rightRect.right - otherRect.left);
          
          if (distance <= config.connectThreshold && checkVerticalOverlap(rightRect, otherRect)) {
            // יש אפשרות חיבור מימין של הקבוצה הנגררת לשמאל של הקבוצה האחרת
            potentialConnectSource = rightmostBlock;
            potentialConnectTarget = otherLeftmost;
            connectDirection = 'right';
            
            // הדגש את החיבור הפוטנציאלי
            highlightConnection(rightmostBlock, otherLeftmost, 'right');
            
            log(`זוהתה אפשרות חיבור ימין-שמאל, מרחק: ${distance.toFixed(1)}px`);
            return true;
          }
        }
      }
      
      // בדוק חיבור משמאל של הקבוצה הנגררת לימין של קבוצה אחרת
      const otherRightmost = findRightmostBlock(group);
      
      if (otherRightmost) {
        const canConnectFromLeft = !otherRightmost.hasAttribute('data-connected-from-right') ||
                                 otherRightmost.getAttribute('data-connected-from-right') === "";
        
        if (canConnectFromLeft) {
          const otherRect = otherRightmost.getBoundingClientRect();
          const distance = Math.abs(leftRect.left - otherRect.right);
          
          if (distance <= config.connectThreshold && checkVerticalOverlap(leftRect, otherRect)) {
            // יש אפשרות חיבור משמאל של הקבוצה הנגררת לימין של הקבוצה האחרת
            potentialConnectSource = leftmostBlock;
            potentialConnectTarget = otherRightmost;
            connectDirection = 'left';
            
            // הדגש את החיבור הפוטנציאלי
            highlightConnection(leftmostBlock, otherRightmost, 'left');
            
            log(`זוהתה אפשרות חיבור שמאל-ימין, מרחק: ${distance.toFixed(1)}px`);
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  // פונקציה משופרת למציאת בלוקים מחוברים
  function findConnectedBlocks(startBlock) {
    if (!startBlock) return [];
    
    // אוסף כל הבלוקים המחוברים
    const result = [startBlock];
    const processed = new Set([startBlock.id]);
    
    // תור לסריקה
    const queue = [startBlock];
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      // חיפוש חיבורים בכל הכיוונים
      const connections = new Set();
      
      // בדיקת חיבורים מימין של הבלוק הנוכחי
      if (current.hasAttribute('data-connected-to') && current.getAttribute('data-connected-to') !== "") {
        connections.add(current.getAttribute('data-connected-to'));
      }
      
      // בדיקת חיבורים משמאל של הבלוק הנוכחי
      if (current.hasAttribute('data-connected-from-left') && current.getAttribute('data-connected-from-left') !== "") {
        connections.add(current.getAttribute('data-connected-from-left'));
      }
      
      // בדיקת חיבורים שמובילים לבלוק הנוכחי מהצד השמאלי שלו
      const leftConnections = document.querySelectorAll(`[data-connected-to="${current.id}"][data-connection-direction="right"]`);
      leftConnections.forEach(block => connections.add(block.id));
      
      // בדיקת חיבורים משמאל של הבלוק הנוכחי
      if (current.hasAttribute('data-connected-from-right') && current.getAttribute('data-connected-from-right') !== "") {
        connections.add(current.getAttribute('data-connected-from-right'));
      }
      
      // בדיקת חיבורים שמובילים לבלוק הנוכחי מהצד הימני שלו
      const rightConnections = document.querySelectorAll(`[data-connected-to="${current.id}"][data-connection-direction="left"]`);
      rightConnections.forEach(block => connections.add(block.id));
      
      // עבור על כל החיבורים שנמצאו
      for (const id of connections) {
        if (!processed.has(id)) {
          const block = document.getElementById(id);
          if (block) {
            result.push(block);
            processed.add(id);
            queue.push(block);
          }
        }
      }
    }
    
    return result;
  }
  
  // פונקציה לביטול סימוני גרירה
  function clearDraggingState() {
    document.querySelectorAll('.group-dragging').forEach(block => {
      block.classList.remove('group-dragging');
      block.style.zIndex = '';
    });
  }
  
  // פונקציה לשינוי סימוני בלוקים
  function updateBlockConnections(sourceBlock, targetBlock, direction) {
    try {
      if (direction === 'right') {
        // חיבור הצד הימני של המקור לצד שמאלי של היעד
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', 'left');
        targetBlock.setAttribute('data-connected-from-left', sourceBlock.id);
        
        // בטל חיבורים קודמים באותו כיוון (למניעת חיבורים כפולים)
        targetBlock.removeAttribute('data-connected-to');
        
        log(`עדכון תכונות חיבור: ${sourceBlock.id} -> (ימין לשמאל) -> ${targetBlock.id}`);
      } else {
        // חיבור הצד השמאלי של המקור לצד ימני של היעד
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', 'right');
        targetBlock.setAttribute('data-connected-from-right', sourceBlock.id);
        
        // בטל חיבורים קודמים באותו כיוון
        sourceBlock.removeAttribute('data-connected-from-left');
        
        log(`עדכון תכונות חיבור: ${sourceBlock.id} -> (שמאל לימין) -> ${targetBlock.id}`);
      }
      
      // סמן את הבלוקים כמחוברים
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      
      // הוסף סימוני הצלחה זמניים
      sourceBlock.classList.add('connection-success');
      targetBlock.classList.add('connection-success');
      setTimeout(() => {
        sourceBlock.classList.remove('connection-success');
        targetBlock.classList.remove('connection-success');
      }, 800);
      
      return true;
    } catch (err) {
      console.error('[GroupConnect] שגיאה בעדכון חיבורים:', err);
      return false;
    }
  }
  
  // חישוב מיקום מדויק של קבוצה שלמה ביחס לבלוק יעד
  function calculateGroupPosition(sourceGroup, targetBlock, direction) {
    if (!sourceGroup || sourceGroup.length === 0 || !targetBlock) {
      return null;
    }
    
    // מצא את הבלוק שמתחבר בקבוצת המקור
    const sourceBlock = direction === 'right' ? 
      findRightmostBlock(sourceGroup) : 
      findLeftmostBlock(sourceGroup);
    
    if (!sourceBlock) return null;
    
    // חשב את ההיסט הנדרש לבלוק המקור
    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    const programArea = document.getElementById('program-blocks');
    const areaRect = programArea.getBoundingClientRect();
    
    // חשב את ההיסט בין הבלוק המקור לבלוק היעד
    let offsetX;
    if (direction === 'right') {
      // המקור מתחבר מימין ליעד שמשמאל
      offsetX = targetRect.left - sourceRect.right + config.LEFT_CONNECTION_OFFSET;
    } else {
      // המקור מתחבר משמאל ליעד שמימין
      offsetX = targetRect.right - sourceRect.left + config.RIGHT_CONNECTION_OFFSET;
    }
    
    // חשב את ההיסט האנכי - יישר לגובה היעד
    const offsetY = targetRect.top - sourceRect.top;
    
    return { offsetX, offsetY, sourceBlock };
  }
  
  // ביצוע חיבור בין קבוצות - משופר
  function connectGroups() {
    if (isConnecting) {
      log("תהליך חיבור כבר רץ - מדלג");
      return false;
    }
    
    if (!potentialConnectSource || !potentialConnectTarget || !connectDirection) {
      log("אין אפשרות חיבור זמינה");
      return false;
    }
    
    try {
      // סמן שהחיבור פעיל
      isConnecting = true;
      
      log(`ביצוע חיבור בין קבוצות: ${connectDirection}`);
      
      // מצא את כל הבלוקים בקבוצה המחוברת
      const sourceGroup = draggedGroupBlocks.length > 0 ? 
                         draggedGroupBlocks : 
                         findConnectedBlocks(potentialConnectSource);
      
      if (sourceGroup.length === 0) {
        log("לא נמצאו בלוקים בקבוצת המקור");
        isConnecting = false;
        return false;
      }
      
      log(`קבוצת המקור מכילה ${sourceGroup.length} בלוקים`);
      
      // נקה את כל הדגשות חיבור
      clearConnectionHighlights();
      
      // סמן את הקבוצה כנמצאת בתהליך חיבור
      sourceGroup.forEach(block => block.classList.add('connecting-group'));
      
      // השהה מעט את החיבור כדי לאפשר טיפול באירועים אחרים
      setTimeout(() => {
        // נסה לבצע חיבור באמצעות API מקורי אם קיים
        let connectResult = false;
        
        if (typeof window.performBlockSnap === 'function') {
          try {
            const blockConnectionDirection = connectDirection === 'right' ? 'left' : 'right';
            connectResult = window.performBlockSnap(potentialConnectSource, potentialConnectTarget, blockConnectionDirection);
            log("חיבור בוצע באמצעות API קיים");
          } catch (snapError) {
            console.error('[GroupConnect] שגיאה בביצוע חיבור דרך API מקורי:', snapError);
            // ממשיך לחיבור ידני
          }
        }
        
        // אם החיבור דרך API מקורי נכשל, בצע חיבור ידני
        if (!connectResult) {
          if (config.preserveGroupIntegrity) {
            // חשב מיקום עבור הקבוצה
            const groupPosition = calculateGroupPosition(sourceGroup, potentialConnectTarget, connectDirection);
            
            if (groupPosition) {
              // הזז את כל הקבוצה - שומר על יחס בין הבלוקים
              moveEntireGroup(sourceGroup, groupPosition.offsetX, groupPosition.offsetY);
              
              // עדכן את החיבור בין הבלוקים
              connectResult = updateBlockConnections(
                groupPosition.sourceBlock, 
                potentialConnectTarget, 
                connectDirection
              );
              
              log("חיבור בוצע באמצעות הזזת קבוצה שלמה");
            }
          } else {
            // חיבור ידני ברמת בלוק
            connectResult = connectBlocksManually(potentialConnectSource, potentialConnectTarget, connectDirection);
            log("חיבור בוצע ידנית ברמת בלוק");
          }
        }
        
        // נקה מצב גרירה
        clearDraggingState();
        
        // השמע צליל אם זמין
        if (connectResult && typeof window.playSnapSound === 'function') {
          window.playSnapSound();
        }
        
        // נקה את ההדגשות ומצב החיבור
        clearConnectionHighlights();
        sourceGroup.forEach(block => block.classList.remove('connecting-group'));
        
        // אם יש פונקציית סריקת מובילים, הפעל אותה אחרי החיבור
        if (typeof window.groupDragApi?.scanAndMarkLeaders === 'function') {
          setTimeout(window.groupDragApi.scanAndMarkLeaders, 300);
        }
        
        // שחרר את נעילת החיבור
        isConnecting = false;
        
      }, config.connectionDelayMs);
      
      return true;
    } catch (err) {
      console.error('[GroupConnect] שגיאה בחיבור קבוצות:', err);
      // שחרר נעילה במקרה של שגיאה
      isConnecting = false;
      return false;
    }
  }
  
  // הזזת קבוצה שלמה תוך שמירה על יחסים פנימיים
  function moveEntireGroup(blocks, offsetX, offsetY) {
    if (!blocks || blocks.length === 0) return false;
    
    try {
      log(`הזזת קבוצה שלמה עם ${blocks.length} בלוקים: שינוי X=${offsetX.toFixed(1)}px, Y=${offsetY.toFixed(1)}px`);
      
      // שמור את המיקומים המקוריים
      const originalPositions = blocks.map(block => ({
        id: block.id,
        left: parseFloat(block.style.left) || 0,
        top: parseFloat(block.style.top) || 0
      }));
      
      // התאם את המיקום של כל בלוק
      blocks.forEach(block => {
        const currentLeft = parseFloat(block.style.left) || 0;
        const currentTop = parseFloat(block.style.top) || 0;
        
        // חשב מיקום חדש
        const newLeft = currentLeft + offsetX;
        const newTop = currentTop + offsetY;
        
        // קבע מיקום חדש
        block.style.position = 'absolute';
        block.style.left = `${newLeft}px`;
        block.style.top = `${newTop}px`;
        block.style.margin = '0';
      });
      
      return true;
    } catch (err) {
      console.error('[GroupConnect] שגיאה בהזזת קבוצה:', err);
      return false;
    }
  }
