// --- GROUP-CONNECT.JS v1.0.0 ---
// מודול לחיבור בין קבוצות בלוקים מחוברים
// יש להוסיף אחרי הקבצים linkageimproved.js ו-linkage-group-drag-simplified.js

(function() {
  'use strict';
  
  // === משתנים גלובליים ===
  let potentialConnectSource = null;   // קבוצת המקור הפוטנציאלית לחיבור
  let potentialConnectTarget = null;   // בלוק יעד פוטנציאלי לחיבור
  let connectDirection = null;         // כיוון החיבור ('right' או 'left')
  let lastCheckTime = 0;               // זמן הבדיקה האחרונה (למניעת עומס)
  
  // === הגדרות ===
  const config = {
    debug: true,                       // האם להדפיס הודעות דיבאג בקונסול
    connectThreshold: 50,              // מרחק בפיקסלים לזיהוי אפשרות חיבור
    connectHighlightColor: '#FF9800',  // צבע הדגשה לנקודות חיבור פוטנציאליות
    verticalOverlapRequired: 0.3,      // החפיפה האנכית הנדרשת כאחוז מגובה הבלוק
    checkInterval: 100,                // זמן מינימלי בין בדיקות חיבור (במילישניות)
    
    // ערכי היסט מדויקים לחיבור אופקי
    LEFT_CONNECTION_OFFSET: -9,        // היסט שמאלי (כשמחברים מימין לשמאל)
    RIGHT_CONNECTION_OFFSET: 9         // היסט ימני (כשמחברים משמאל לימין)
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
    `;
    
    document.head.appendChild(style);
    log('סגנונות חיבור קבוצות נוספו');
  }
  
  // בדיקת חפיפה אנכית בין שני בלוקים
  function checkVerticalOverlap(rect1, rect2) {
    const topOverlap = Math.max(rect1.top, rect2.top);
    const bottomOverlap = Math.min(rect1.bottom, rect2.bottom);
    const overlapHeight = bottomOverlap - topOverlap;
    
    // חפיפה אנכית מספקת אם היא יותר מאחוז מסוים מגובה הבלוק הקטן יותר
    const minHeight = Math.min(rect1.height, rect2.height);
    return overlapHeight > minHeight * config.verticalOverlapRequired;
  }
  
  // ניקוי הדגשות חיבור פוטנציאלי
  function clearConnectionHighlights() {
    // הסר את נקודות החיבור
    document.querySelectorAll('.connection-point').forEach(point => point.remove());
    
    // הסר את הדגשת הבלוקים
    document.querySelectorAll('.potential-connect').forEach(block => {
      block.classList.remove('potential-connect');
    });
  }
  
  // הדגשת חיבור פוטנציאלי בין בלוקים
  function highlightConnection(sourceBlock, targetBlock, direction) {
    // נקה הדגשות קודמות
    clearConnectionHighlights();
    
    if (!sourceBlock || !targetBlock) return;
    
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
  
  // בדיקת אפשרות חיבור לקבוצה אחרת בזמן גרירה
  function checkForConnectOpportunity() {
    const now = Date.now();
    
    // מניעת עומס - בדוק רק אם עבר מספיק זמן מהבדיקה האחרונה
    if (now - lastCheckTime < config.checkInterval) return false;
    lastCheckTime = now;
    
    // בדוק אם יש גרירת קבוצה פעילה
    const isGroupDragging = document.querySelectorAll('.group-dragging').length > 0;
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
    
    // מצא את הקבוצה הנגררת
    const draggedBlocks = Array.from(document.querySelectorAll('.group-dragging'));
    if (!draggedBlocks.length) return false;
    
    // השתמש באפ"י של מודול הגרירה אם קיים
    const findLeftmostBlockFn = window.groupDragApi?.findLeftmostBlock || findLeftmostBlockFallback;
    
    // מצא את הבלוקים הקיצוניים בקבוצה הנגררת
    const rightmostBlock = findRightmostBlock(draggedBlocks);
    const leftmostBlock = findLeftmostBlockFn(draggedBlocks);
    
    if (!rightmostBlock || !leftmostBlock) return false;
    
    // קבל את המלבנים של הבלוקים הקיצוניים
    const rightRect = rightmostBlock.getBoundingClientRect();
    const leftRect = leftmostBlock.getBoundingClientRect();
    
    // מצא את כל הבלוקים שאינם בקבוצה הנגררת
    const programArea = document.getElementById('program-blocks');
    const allBlocks = programArea.querySelectorAll('.block-container');
    const otherBlocks = Array.from(allBlocks).filter(block => !draggedBlocks.includes(block));
    
    // מצא קבוצות אחרות שאינן הקבוצה הנגררת
    const otherGroups = [];
    const findConnectedBlocksFn = window.groupDragApi?.findConnectedBlocks || findConnectedBlocksFallback;
    
    for (const block of otherBlocks) {
      // דלג על בלוקים שכבר נבדקו
      if (otherGroups.some(group => group.includes(block))) continue;
      
      // בדוק אם הבלוק מחובר לבלוקים אחרים
      const isConnected = block.hasAttribute('data-connected-to') || 
                          block.hasAttribute('data-connected-from-left') || 
                          block.hasAttribute('data-connected-from-right');
      
      if (isConnected) {
        const group = findConnectedBlocksFn(block);
        if (group.length >= 2) { // מינימום 2 בלוקים בקבוצה
          // הוסף את הקבוצה לרשימה אם היא גדולה מספיק
          otherGroups.push(group);
        }
      }
    }
    
    // עבור על כל הקבוצות האחרות ובדוק אפשרות חיבור
    for (const group of otherGroups) {
      // בדוק חיבור מימין של הקבוצה הנגררת לשמאל של קבוצה אחרת
      const otherLeftmost = findLeftmostBlockFn(group);
      
      if (otherLeftmost && !otherLeftmost.hasAttribute('data-connected-from-left')) {
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
      
      // בדוק חיבור משמאל של הקבוצה הנגררת לימין של קבוצה אחרת
      const otherRightmost = findRightmostBlock(group);
      
      if (otherRightmost && !otherRightmost.hasAttribute('data-connected-from-right')) {
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
    
    return false;
  }
  
  // פונקציית גיבוי למציאת בלוקים מחוברים
  function findConnectedBlocksFallback(startBlock) {
    if (!startBlock) return [];
    
    // אוסף כל הבלוקים המחוברים
    const result = [startBlock];
    const processed = new Set([startBlock.id]);
    
    // תור לסריקה
    const queue = [startBlock];
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      // חיפוש חיבורים
      const connections = [];
      
      // בדוק אם הבלוק מחובר לבלוק אחר לצד ימין
      if (current.hasAttribute('data-connected-to')) {
        const rightBlockId = current.getAttribute('data-connected-to');
        connections.push(rightBlockId);
      }
      
      // בדוק אם יש בלוק מחובר לצד שמאל של הבלוק הנוכחי
      if (current.hasAttribute('data-connected-from-left')) {
        const leftBlockId = current.getAttribute('data-connected-from-left');
        connections.push(leftBlockId);
      }
      
      // בדוק אם יש בלוק מחובר לצד ימין של הבלוק הנוכחי
      if (current.hasAttribute('data-connected-from-right')) {
        const rightBlockId = current.getAttribute('data-connected-from-right');
        connections.push(rightBlockId);
      }
      
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
  
  // פונקציית גיבוי למציאת הבלוק השמאלי ביותר
  function findLeftmostBlockFallback(blocks) {
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
  
  // ביצוע חיבור בין קבוצות
  function connectGroups() {
    if (!potentialConnectSource || !potentialConnectTarget || !connectDirection) {
      log("אין אפשרות חיבור זמינה");
      return false;
    }
    
    try {
      log(`ביצוע חיבור בין קבוצות: ${connectDirection}`);
      
      // נקה את כל הדגשות חיבור
      clearConnectionHighlights();
      
      // הסר מחלקות גרירה (ישוחרר על ידי מודול הגרירה הקבוצתית)
      document.querySelectorAll('.group-dragging').forEach(block => {
        block.classList.remove('group-dragging');
        block.style.zIndex = '';
      });
      
      // נסה להשתמש בפונקציית החיבור של המודול המקורי
      if (typeof window.performBlockSnap === 'function') {
        const blockConnectionDirection = connectDirection === 'right' ? 'left' : 'right';
        window.performBlockSnap(potentialConnectSource, potentialConnectTarget, blockConnectionDirection);
        log("חיבור בוצע באמצעות API קיים");
      } else {
        // ביצוע חיבור ידני
        connectBlocksManually(potentialConnectSource, potentialConnectTarget, connectDirection);
        log("חיבור בוצע ידנית");
      }
      
      // השמע צליל אם זמין
      if (typeof window.playSnapSound === 'function') {
        window.playSnapSound();
      }
      
      // נקה את ההדגשות
      clearConnectionHighlights();
      
      // אם יש פונקציית סריקת מובילים, הפעל אותה אחרי החיבור
      if (typeof window.groupDragApi?.scanAndMarkLeaders === 'function') {
        setTimeout(window.groupDragApi.scanAndMarkLeaders, 300);
      }
      
      return true;
    } catch (err) {
      console.error('[GroupConnect] שגיאה בחיבור קבוצות:', err);
      return false;
    }
  }
  
  // חיבור ידני בין בלוקים במקרה שאין גישה לפונקציה המקורית
  function connectBlocksManually(sourceBlock, targetBlock, direction) {
    try {
      log(`מבצע חיבור ידני: sourceBlock=${sourceBlock.id}, targetBlock=${targetBlock.id}, direction=${direction}`);
      
      // שמור את המיקום המקורי של הבלוקים לפני החיבור
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const programArea = document.getElementById('program-blocks');
      const areaRect = programArea.getBoundingClientRect();
      
      // חשב את המיקום החדש ואז הגדר את היחס בין הבלוקים
      let newLeft, newTop;
      
      if (direction === 'right') {
        // חיבור הצד הימני של המקור לצד שמאלי של היעד
        newLeft = targetRect.left - sourceRect.width + config.LEFT_CONNECTION_OFFSET;
        newTop = targetRect.top;
        
        // הגדר את היחס: המקור מחובר ליעד מימין לשמאל
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', 'left');
        targetBlock.setAttribute('data-connected-from-left', sourceBlock.id);
      } else {
        // חיבור הצד השמאלי של המקור לצד ימני של היעד
        newLeft = targetRect.right + config.RIGHT_CONNECTION_OFFSET;
        newTop = targetRect.top;
        
        // הגדר את היחס: המקור מחובר ליעד משמאל לימין
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', 'right');
        targetBlock.setAttribute('data-connected-from-right', sourceBlock.id);
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
      
      // סמן את הבלוקים כמחוברים
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      
      // טיפול במסגרות
      sourceBlock.classList.add('no-outlines');
      targetBlock.classList.add('no-outlines');
      
      log(`חיבור ידני בוצע בהצלחה עם היסט ${direction === 'right' ? config.LEFT_CONNECTION_OFFSET : config.RIGHT_CONNECTION_OFFSET}`);
      return true;
    } catch (err) {
      console.error('[GroupConnect] שגיאה בביצוע חיבור ידני:', err);
      return false;
    }
  }
  
  // === מאזיני אירועים ===
  
  // מאזין למסמך - בדיקת אפשרויות חיבור בזמן תזוזת העכבר
  function handleDocumentMouseMove() {
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
  
  // אתחול המודול
  function initModule() {
    const initFlag = 'groupConnectInitialized_v1_0_0';
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
        config // מאפשר שינוי ההגדרות מבחוץ
      };
      
      // סמן שהמודול אותחל
      window.groupConnectInitialized = true;
      
      log("מודול חיבור קבוצות אותחל בהצלחה");
      log(`גילוי חיבורים: טווח ${config.connectThreshold}px עם היסט שמאלי ${config.LEFT_CONNECTION_OFFSET} וימני ${config.RIGHT_CONNECTION_OFFSET}`);
      
      // נקה משאבים בעת פריקת הדף
      window.addEventListener('beforeunload', () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
      });
    } catch (err) {
      console.error('[GroupConnect] שגיאה באתחול מודול חיבור קבוצות:', err);
    }
  }
  
  // הפעל את האתחול כאשר המסמך נטען
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initModule, 1000));
  } else {
    // הדף כבר נטען, אתחל אחרי השהייה קצרה
    setTimeout(initModule, 1000);
  }
  
})();
