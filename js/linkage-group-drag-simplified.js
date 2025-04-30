// --- LINKAGE-GROUP-DRAG-SIMPLIFIED.JS v2.0.0 ---
// מודול משולב לגרירת קבוצות בלוקים וחיבור ביניהן

(function() {
  'use strict';
  
  // === משתנים גלובליים ===
  let isGroupDragging = false;         // האם מתבצעת כרגע גרירת קבוצה
  let groupLeader = null;              // הבלוק המוביל (השמאלי ביותר) בקבוצה
  let groupBlocks = [];                // כל הבלוקים בקבוצה
  let dragOffset = { x: 0, y: 0 };     // ההיסט של נקודת הלחיצה מפינת הבלוק המוביל
  let startPositions = [];             // מיקומים מקוריים של כל הבלוקים בתחילת הגרירה
  let groupHighlightTimer = null;      // טיימר להסרת הדגשת קבוצה
  
  // משתנים לחיבור קבוצות
  let potentialConnectTarget = null;   // בלוק יעד פוטנציאלי לחיבור
  let connectDirection = null;         // כיוון החיבור ('right' או 'left')
  let lastCheckTime = 0;               // זמן הבדיקה האחרונה (למניעת עומס)
  
  // === הגדרות ===
  const config = {
    debug: true,                       // האם להדפיס הודעות דיבאג בקונסול
    groupMinSize: 2,                   // גודל מינימלי לקבוצה (מספר בלוקים)
    leaderHighlightColor: '#FFA500',   // צבע ההדגשה לבלוק המוביל (כתום)
    dragZIndex: 1000,                  // z-index לבלוקים בזמן גרירה
    dragOpacity: 0.95,                 // אטימות בזמן גרירה
    highlightDuration: 1200,           // משך זמן ההדגשה במילישניות
    connectThreshold: 50,              // מרחק בפיקסלים לזיהוי אפשרות חיבור
    connectHighlightColor: '#FF9800',  // צבע הדגשה לנקודות חיבור פוטנציאליות
    verticalOverlapRequired: 0.3,      // החפיפה האנכית הנדרשת כאחוז מגובה הבלוק
    checkInterval: 100,                // זמן מינימלי בין בדיקות חיבור (במילישניות)
    
    // ערכי היסט מדויקים לחיבור אופקי
    LEFT_CONNECTION_OFFSET: -9,        // היסט שמאלי (מחבר מימין לשמאל)
    RIGHT_CONNECTION_OFFSET: 9         // היסט ימני (מחבר משמאל לימין)
  };
  
  // === פונקציות עזר ===
  
  // הדפסת הודעות דיבאג
  function log(message, data) {
    if (config.debug) {
      if (data) {
        console.log(`[GroupDrag] ${message}`, data);
      } else {
        console.log(`[GroupDrag] ${message}`);
      }
    }
  }
  
  // הוספת סגנונות CSS לתמיכה בגרירת קבוצות וחיבור ביניהן
  function addGroupStyles() {
    const oldStyle = document.getElementById('group-drag-styles');
    if (oldStyle) oldStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'group-drag-styles';
    style.textContent = `
      /* סימון הבלוק המוביל */
      .group-leader {
        position: relative;
      }
      .group-leader::before {
        content: '';
        position: absolute;
        left: -8px;
        top: 50%;
        transform: translateY(-50%);
        width: 12px;
        height: 12px;
        background-color: ${config.leaderHighlightColor};
        border-radius: 50%;
        box-shadow: 0 0 5px rgba(255, 165, 0, 0.8);
        z-index: 1001;
        pointer-events: none;
      }
      
      /* סגנון בלוקים בזמן גרירה */
      .group-dragging {
        opacity: ${config.dragOpacity};
        z-index: ${config.dragZIndex} !important;
      }
      
      .group-dragging * {
        pointer-events: none !important;
      }
      
      /* הדגשת קבוצה */
      .group-highlight {
        background-color: rgba(77, 208, 225, 0.2) !important;
        border: 2px dashed rgba(77, 208, 225, 0.8) !important;
        border-radius: 8px !important;
      }
      
      /* הדגשת המוביל */
      .leader-highlight {
        background-color: rgba(255, 183, 77, 0.3) !important;
        border: 2px dashed rgba(255, 183, 77, 0.9) !important;
        border-radius: 8px !important;
      }
      
      /* אנימציית פעימה למוביל */
      @keyframes leaderPulse {
        0% { transform: translateY(-50%) scale(1); opacity: 0.7; }
        50% { transform: translateY(-50%) scale(1.3); opacity: 1; }
        100% { transform: translateY(-50%) scale(1); opacity: 0.7; }
      }
      
      .group-leader.pulse::before {
        animation: leaderPulse 1s infinite ease-in-out;
      }
      
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
    log('סגנונות גרירת וחיבור קבוצות נוספו');
  }
  
  // מציאת כל הבלוקים המחוברים
  function findConnectedBlocks(startBlock) {
    if (!startBlock) return [];
    
    log(`מציאת בלוקים מחוברים מ-${startBlock.id}`);
    
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
    
    log(`נמצאו ${result.length} בלוקים מחוברים`);
    return result;
  }
  
  // מציאת הבלוק השמאלי ביותר (המוביל)
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
    
    log(`הבלוק השמאלי ביותר: ${leftmost.id}`);
    return leftmost;
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
  
  // בדיקת חפיפה אנכית בין שני בלוקים
  function checkVerticalOverlap(rect1, rect2) {
    const topOverlap = Math.max(rect1.top, rect2.top);
    const bottomOverlap = Math.min(rect1.bottom, rect2.bottom);
    const overlapHeight = bottomOverlap - topOverlap;
    
    // חפיפה אנכית מספקת אם היא יותר מאחוז מסוים מגובה הבלוק הקטן יותר
    const minHeight = Math.min(rect1.height, rect2.height);
    return overlapHeight > minHeight * config.verticalOverlapRequired;
  }
  
  // שמירת המיקום המקורי של בלוקים לפני גרירה
  function storeBlockPositions(blocks) {
    const positions = [];
    const programArea = document.getElementById('program-blocks');
    const areaRect = programArea.getBoundingClientRect();
    
    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      positions.push({
        id: block.id,
        left: rect.left - areaRect.left + programArea.scrollLeft,
        top: rect.top - areaRect.top + programArea.scrollTop
      });
    }
    
    return positions;
  }
  
  // סימון הבלוק המוביל
  function markLeaderBlock(block) {
    if (!block) return;
    
    // הסר סימון קיים
    clearLeaderMarkers();
    
    // הוסף מחלקת CSS לבלוק המוביל
    block.classList.add('group-leader');
  }
  
  // הסרת סימוני מוביל מכל הבלוקים
  function clearLeaderMarkers() {
    document.querySelectorAll('.group-leader').forEach(block => {
      block.classList.remove('group-leader');
      block.classList.remove('pulse');
    });
  }
  
  // הדגשת קבוצת בלוקים
  function highlightBlockGroup(blocks, leader) {
    // נקה כל הדגשה קודמת
    clearGroupHighlight();
    
    if (!blocks || blocks.length < config.groupMinSize) return;
    
    // הדגש את כל הבלוקים בקבוצה
    blocks.forEach(block => {
      if (block && block !== leader) {
        block.classList.add('group-highlight');
      }
    });
    
    // הדגש את הקטר
    if (leader) {
      leader.classList.add('leader-highlight');
      leader.classList.add('group-leader');
      leader.classList.add('pulse');
    }
    
    // הגדר טיימר להסרת ההדגשה אחרי זמן מסוים
    if (config.highlightDuration > 0) {
      groupHighlightTimer = setTimeout(() => {
        clearGroupHighlight();
        
        // השאר את סימון המוביל
        if (leader) {
          leader.classList.add('group-leader');
        }
      }, config.highlightDuration);
    }
  }
  
  // ניקוי הדגשת קבוצת בלוקים
  function clearGroupHighlight() {
    // בטל את הטיימר אם קיים
    if (groupHighlightTimer) {
      clearTimeout(groupHighlightTimer);
      groupHighlightTimer = null;
    }
    
    // נקה את כל הבלוקים המודגשים
    document.querySelectorAll('.group-highlight').forEach(block => {
      block.classList.remove('group-highlight');
    });
    
    document.querySelectorAll('.leader-highlight').forEach(block => {
      block.classList.remove('leader-highlight');
    });
    
    document.querySelectorAll('.pulse').forEach(block => {
      block.classList.remove('pulse');
    });
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
  
  // סריקה אוטומטית של בלוקים מחוברים וסימון מובילים
  function scanAndMarkLeaders() {
    log(`סריקה אוטומטית של קבוצות בלוקים`);
    
    // מצא את כל הבלוקים המחוברים
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    
    // נקה סימונים קודמים
    clearLeaderMarkers();
    
    // מצא את כל הבלוקים המחוברים
    const connectedBlocks = Array.from(programArea.querySelectorAll(
      '.block-container[data-connected-to], .block-container[data-connected-from-left], .block-container[data-connected-from-right]'
    ));
    
    // אוסף קבוצות ייחודיות
    const processedIds = new Set();
    const groups = [];
    
    // עבור על כל הבלוקים המחוברים
    for (const block of connectedBlocks) {
      // דלג על בלוקים שכבר עובדו
      if (processedIds.has(block.id)) continue;
      
      // מצא את כל הבלוקים בקבוצה
      const group = findConnectedBlocks(block);
      if (group.length < config.groupMinSize) continue;
      
      // הוסף את כל הבלוקים בקבוצה לרשימת המעובדים
      for (const groupBlock of group) {
        processedIds.add(groupBlock.id);
      }
      
      // מצא את המוביל (השמאלי ביותר)
      const leader = findLeftmostBlock(group);
      if (leader) {
        // סמן אותו
        markLeaderBlock(leader);
        groups.push(group);
      }
    }
    
    log(`נמצאו ${groups.length} קבוצות בלוקים`);
  }
  
  // עדכון מיקום כל הבלוקים בקבוצה
  function updateGroupPosition(deltaX, deltaY) {
    if (!groupBlocks.length || !startPositions.length) return;
    
    const programArea = document.getElementById('program-blocks');
    
    // עבור על כל הבלוקים ועדכן את המיקום שלהם
    for (let i = 0; i < groupBlocks.length; i++) {
      const block = groupBlocks[i];
      const startPos = startPositions[i];
      
      if (!block || !startPos) continue;
      
      // חשב מיקום חדש
      const newLeft = startPos.left + deltaX;
      const newTop = startPos.top + deltaY;
      
      // הגבל את המיקום לגבולות אזור התכנות
      const limitedLeft = Math.max(0, Math.min(newLeft, programArea.scrollWidth - block.offsetWidth));
      const limitedTop = Math.max(0, Math.min(newTop, programArea.scrollHeight - block.offsetHeight));
      
      // עדכן את מיקום הבלוק
      block.style.position = 'absolute';
      block.style.left = `${Math.round(limitedLeft)}px`;
      block.style.top = `${Math.round(limitedTop)}px`;
      block.style.margin = '0';
    }
  }
  
  // בדיקת אפשרות חיבור לקבוצה אחרת בזמן גרירה
  function checkForConnectOpportunity() {
    const now = Date.now();
    
    // מניעת עומס - בדוק רק אם עבר מספיק זמן מהבדיקה האחרונה
    if (now - lastCheckTime < config.checkInterval) return false;
    lastCheckTime = now;
    
    // ודא שיש גרירת קבוצה פעילה
    if (!isGroupDragging || !groupBlocks.length) return false;
    
    // נקה הדגשות קודמות
    clearConnectionHighlights();
    
    // איפוס משתני חיבור
    potentialConnectTarget = null;
    connectDirection = null;
    
    // מצא את הבלוקים הקיצוניים בקבוצה הנגררת
    const rightmostBlock = findRightmostBlock(groupBlocks);
    const leftmostBlock = findLeftmostBlock(groupBlocks);
    
    if (!rightmostBlock || !leftmostBlock) return false;
    
    // קבל את המלבנים של הבלוקים הקיצוניים
    const rightRect = rightmostBlock.getBoundingClientRect();
    const leftRect = leftmostBlock.getBoundingClientRect();
    
    // מצא את כל הבלוקים שאינם בקבוצה הנגררת
    const programArea = document.getElementById('program-blocks');
    const allBlocks = programArea.querySelectorAll('.block-container');
    const otherBlocks = Array.from(allBlocks).filter(block => !groupBlocks.includes(block));
    
    // מצא קבוצות אחרות שאינן הקבוצה הנגררת
    const otherGroups = [];
    for (const block of otherBlocks) {
      // דלג על בלוקים שכבר נבדקו
      if (otherGroups.some(group => group.includes(block))) continue;
      
      // בדוק אם הבלוק מחובר לבלוקים אחרים
      const isConnected = block.hasAttribute('data-connected-to') || 
                          block.hasAttribute('data-connected-from-left') || 
                          block.hasAttribute('data-connected-from-right');
      
      if (isConnected) {
        const group = findConnectedBlocks(block);
        if (group.length >= config.groupMinSize) {
          // הוסף את הקבוצה לרשימה אם היא גדולה מספיק
          otherGroups.push(group);
        }
      }
    }
    
    // עבור על כל הקבוצות האחרות ובדוק אפשרות חיבור
    for (const group of otherGroups) {
      // בדוק חיבור מימין של הקבוצה הנגררת לשמאל של קבוצה אחרת
      const otherLeftmost = findLeftmostBlock(group);
      
      if (otherLeftmost && !otherLeftmost.hasAttribute('data-connected-from-left')) {
        const otherRect = otherLeftmost.getBoundingClientRect();
        const distance = Math.abs(rightRect.right - otherRect.left);
        
        if (distance <= config.connectThreshold && checkVerticalOverlap(rightRect, otherRect)) {
          // יש אפשרות חיבור מימין של הקבוצה הנגררת לשמאל של הקבוצה האחרת
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
  
  // ביצוע חיבור בין קבוצות
  function connectGroups() {
    if (!potentialConnectTarget || !connectDirection || !groupBlocks.length) {
      log("אין אפשרות חיבור זמינה");
      return false;
    }
    
    try {
      log(`ביצוע חיבור בין קבוצות: ${connectDirection}`);
      
      let sourceBlock, targetBlock;
      
      if (connectDirection === 'right') {
        // חיבור ימין-שמאל (הימני של הקבוצה הנגררת לשמאלי של קבוצת היעד)
        sourceBlock = findRightmostBlock(groupBlocks);
        targetBlock = potentialConnectTarget;
      } else {
        // חיבור שמאל-ימין (השמאלי של הקבוצה הנגררת לימני של קבוצת היעד)
        sourceBlock = findLeftmostBlock(groupBlocks);
        targetBlock = potentialConnectTarget;
      }
      
      if (!sourceBlock || !targetBlock) {
        log("לא ניתן לזהות את הבלוקים לחיבור");
        return false;
      }
      
      // נסה להשתמש בפונקציית החיבור של המודול המקורי
      if (typeof window.performBlockSnap === 'function') {
        const blockConnectionDirection = connectDirection === 'right' ? 'left' : 'right';
        window.performBlockSnap(sourceBlock, targetBlock, blockConnectionDirection);
        log("חיבור בוצע באמצעות API קיים");
      } else {
        // ביצוע חיבור ידני
        connectBlocksManually(sourceBlock, targetBlock, connectDirection);
        log("חיבור בוצע ידנית");
      }
      
      // השמע צליל אם זמין
      if (typeof window.playSnapSound === 'function') {
        window.playSnapSound();
      }
      
      // נקה את ההדגשות
      clearConnectionHighlights();
      
      return true;
    } catch (err) {
      console.error('[GroupDrag] שגיאה בחיבור קבוצות:', err);
      return false;
    }
  }
  
  // חיבור ידני בין בלוקים במקרה שאין גישה לפונקציה המקורית
  function connectBlocksManually(sourceBlock, targetBlock, direction) {
    if (direction === 'right') {
      // חיבור הצד הימני של המקור לצד שמאלי של היעד
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', 'left');
      targetBlock.setAttribute('data-connected-from-left', sourceBlock.id);
    } else {
      // חיבור הצד השמאלי של המקור לצד ימני של היעד
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', 'right');
      targetBlock.setAttribute('data-connected-from-right', sourceBlock.id);
    }
    
    // התאם את המיקום
    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    const programArea = document.getElementById('program-blocks');
    const areaRect = programArea.getBoundingClientRect();
    
    let newLeft, newTop;
    
    if (direction === 'right') {
      // חבר את הצד הימני של המקור לצד שמאלי של היעד - השתמש בהיסט שמאלי מדויק
      newLeft = targetRect.left - sourceRect.width + config.LEFT_CONNECTION_OFFSET;
      newTop = targetRect.top;
    } else {
      // חבר את הצד השמאלי של המקור לצד ימני של היעד - השתמש בהיסט ימני מדויק
      newLeft = targetRect.right + config.RIGHT_CONNECTION_OFFSET;
      newTop = targetRect.top;
    }
    
    // התאם למיקום יחסי לאזור התכנות
    sourceBlock.style.position = 'absolute';
    sourceBlock.style.left = `${Math.round(newLeft - areaRect.left + programArea.scrollLeft)}px`;
    sourceBlock.style.top = `${Math.round(newTop - areaRect.top + programArea.scrollTop)}px`;
    sourceBlock.style.margin = '0';
    
    // סמן את הבלוקים כמחוברים
    sourceBlock.classList.add('connected-block');
    targetBlock.classList.add('has-connected-block');
    
    // טיפול במסגרות
    sourceBlock.classList.add('no-outlines');
    targetBlock.classList.add('no-outlines');
    
    log(`חיבור ידני בוצע בהצלחה עם היסט ${direction === 'right' ? config.LEFT_CONNECTION_OFFSET : config.RIGHT_CONNECTION_OFFSET}`);
  }
  
  // === מאזיני אירועים ===
  
  // טיפול בלחיצת עכבר על בלוק
  function handleMouseDown(e) {
    // וודא שזו לחיצה ראשית
    if (e.button !== 0) return;
    
    // התעלם מאלמנטים אינטראקטיביים
    if (e.target.matches('input, button, select, a, textarea')) return;
    
    // מצא את הבלוק שנלחץ
    const block = e.target.closest('.block-container');
    if (!block || !block.parentElement || block.parentElement.id !== 'program-blocks') return;
    
    // בדוק אם הבלוק חלק מקבוצה (מחובר לבלוק אחר)
    const isConnected = block.hasAttribute('data-connected-to') || 
                        block.hasAttribute('data-connected-from-left') || 
                        block.hasAttribute('data-connected-from-right');
    
    if (!isConnected) return;
    
    // מצא את כל הבלוקים המחוברים
    const allConnected = findConnectedBlocks(block);
    
    // בדוק אם יש מספיק בלוקים לקבוצה
    if (allConnected.length < config.groupMinSize) {
      log(`לא מספיק בלוקים לקבוצה: ${allConnected.length}`);
      return;
    }
    
    // מצא את הבלוק השמאלי ביותר (המוביל)
    const leader = findLeftmostBlock(allConnected);
    
    // אם לחצו על בלוק שאינו המוביל, סמן את המוביל ואל תתחיל גרירה
    if (block !== leader) {
      log(`לחיצה על בלוק שאינו המוביל (${block.id}). המוביל הוא: ${leader.id}`);
      highlightBlockGroup(allConnected, leader);
      // לא מונעים את האירוע המקורי במקרה זה
      return;
    }
    
    // מכאן והלאה מטפלים בגרירת קבוצה
    log(`התחלת גרירת קבוצה: ${allConnected.length} בלוקים`);
    
    // מנע את הטיפול באירוע על ידי הקוד המקורי
    e.preventDefault();
    e.stopPropagation();
    
    // ניסיון לנקות התנהגות גרירה מהמודול המקורי
    if (typeof window.currentDraggedBlock !== 'undefined') {
      window.currentDraggedBlock = null;
    }
    if (typeof window.isDraggingBlock !== 'undefined') {
      window.isDraggingBlock = false;
    }
    
    // שמור את הפרטים על הקבוצה
    isGroupDragging = true;
    groupLeader = leader;
    groupBlocks = allConnected;
    
    // שמור את מיקום הלחיצה ביחס לפינת הבלוק המוביל
    const rect = leader.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    // שמור את המיקומים ההתחלתיים של כל הבלוקים
    startPositions = storeBlockPositions(groupBlocks);
    
    // סמן את כל הבלוקים בקבוצה
    for (const groupBlock of groupBlocks) {
      groupBlock.classList.add('group-dragging');
      groupBlock.style.zIndex = config.dragZIndex;
    }
    
    // סמן את המוביל
    markLeaderBlock(leader);
    
    // הוסף מאזינים זמניים לגרירה
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  // טיפול בתזוזת העכבר בזמן גרירה
  function handleMouseMove(e) {
    if (!isGroupDragging || !groupLeader) return;
    
    // מנע ברירת מחדל ומניעת התפשטות
    e.preventDefault();
    e.stopPropagation();
    
    // ניסיון לבטל את התנהגות הגרירה המקורית של המודול המקורי
    if (typeof window.isDraggingBlock !== 'undefined') {
      window.isDraggingBlock = false;
    }
    if (typeof window.currentDraggedBlock !== 'undefined') {
      window.currentDraggedBlock = null;
    }
    
    const programArea = document.getElementById('program-blocks');
    const areaRect = programArea.getBoundingClientRect();
    
    // חשב את ההיסט החדש מהמיקום המקורי
    const newX = e.clientX - areaRect.left - dragOffset.x + programArea.scrollLeft;
    const newY = e.clientY - areaRect.top - dragOffset.y + programArea.scrollTop;
    
    // חשב את ההפרש מהמיקום המקורי של המוביל
    const deltaX = newX - startPositions[0].left;
    const deltaY = newY - startPositions[0].top;
    
    // עדכן את המיקום של כל הבלוקים בקבוצה
    updateGroupPosition(deltaX, deltaY);
    
    // בדוק אפשרויות חיבור לקבוצות אחרות
    checkForConnectOpportunity();
  }
  
  // טיפול בשחרור העכבר
  function handleMouseUp(e) {
    if (!isGroupDragging) return;
    
    log(`סיום גרירת קבוצה`);
    
    // מנע את התפשטות האירוע
    e.preventDefault();
    e.stopPropagation();
    
    // נסה לנקות התנהגות גרירה מהמודול המקורי
    if (typeof window.isDraggingBlock !== 'undefined') {
      window.isDraggingBlock = false;
    }
    if (typeof window.currentDraggedBlock !== 'undefined') {
      window.currentDraggedBlock = null;
    }
    
    // בדוק אם יש אפשרות חיבור, אם כן - בצע חיבור
    if (potentialConnectTarget) {
      connectGroups();
    }
    
    // נקה את ההדגשות
    clearConnectionHighlights();
    
    // הסר את מאזיני הגרירה הזמניים
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // שחרר את מצב הגרירה - השאר את סימון המוביל
    if (groupBlocks) {
      groupBlocks.forEach(block => {
        if (block) {
          block.classList.remove('group-dragging');
          block.style.zIndex = '';
        }
      });
    }
    
    // נקה את המשתנים הגלובליים של הגרירה
    isGroupDragging = false;
    groupLeader = null;
    groupBlocks = [];
    startPositions = [];
    potentialConnectTarget = null;
    connectDirection = null;
    
    // עדכן את המובילים של כל הקבוצות שיש כעת
    setTimeout(scanAndMarkLeaders, 300);
  }
  
  // מאזין לשינויים באזור התכנות
  function observeProgrammingArea() {
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    
    // יצירת משקיף לשינויים באזור התכנות
    const observer = new MutationObserver(mutations => {
      let shouldCheck = false;
      
      // בדוק אם היו שינויים רלוונטיים
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || 
            (mutation.type === 'attributes' && 
             ['data-connected-to', 'data-connected-from-left', 'data-connected-from-right'].includes(mutation.attributeName))) {
          shouldCheck = true;
          break;
        }
      }
      
      // אם היו שינויים רלוונטיים, בדוק מחדש את הקבוצות
      if (shouldCheck && !isGroupDragging) {
        // השהה מעט כדי לאפשר לכל השינויים להתבצע
        setTimeout(scanAndMarkLeaders, 100);
      }
    });
    
    // התחל לעקוב אחרי שינויים
    observer.observe(programArea, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-connected-to', 'data-connected-from-left', 'data-connected-from-right', 'class']
    });
    
    log("משקיף לשינויים באזור התכנות הופעל");
  }
  
  // אתחול מודול גרירת קבוצות
  function initializeGroupDragModule() {
    const initFlag = 'blockGroupDragInitialized_v2_0_0';
    if (window[initFlag]) {
      if (config.debug) {
        log("מודול גרירת קבוצות כבר אותחל. מדלג.");
      }
      return;
    }
    
    log("אתחול מודול גרירת קבוצות");
    
    try {
      // הוסף סגנונות CSS
      addGroupStyles();
      
      // הוסף מאזין לחיצה עבור כל אזור התכנות
      document.addEventListener('mousedown', handleMouseDown, true);
      
      // הפעל משקיף לשינויים באזור התכנות
      observeProgrammingArea();
      
      // סרוק וסמן את המובילים של כל הקבוצות
      scanAndMarkLeaders();
      
      // בדוק אם יש גישה לקונפיגורציה של המודול המקורי
      if (typeof window.CONFIG !== 'undefined') {
        // אם יש גישה להגדרות המודול המקורי, אמץ את ערכי ההיסט
        if (window.CONFIG.HORIZONTAL_FINE_TUNING_LEFT !== undefined) {
          config.LEFT_CONNECTION_OFFSET = window.CONFIG.HORIZONTAL_FINE_TUNING_LEFT;
          log(`אימוץ היסט שמאלי ממודול המקורי: ${config.LEFT_CONNECTION_OFFSET}`);
        }
        
        if (window.CONFIG.HORIZONTAL_FINE_TUNING_RIGHT !== undefined) {
          config.RIGHT_CONNECTION_OFFSET = window.CONFIG.HORIZONTAL_FINE_TUNING_RIGHT;
          log(`אימוץ היסט ימני ממודול המקורי: ${config.RIGHT_CONNECTION_OFFSET}`);
        }
      }
      
      // חשיפת פונקציות שימושיות לשימוש חיצוני
      window.groupDragApi = {
        findConnectedBlocks,
        findLeftmostBlock,
        findRightmostBlock,
        scanAndMarkLeaders,
        highlightConnection
      };
      
      // סמן שהמודול אותחל
      window.groupDragInitialized = true;
      
      log('מודול גרירת קבוצות משולב אותחל בהצלחה (גרסה 2.0.0)');
      log(`סף קבוצה: מינימום ${config.groupMinSize} בלוקים`);
      log(`גילוי חיבורים: טווח ${config.connectThreshold}px עם היסט שמאלי ${config.LEFT_CONNECTION_OFFSET} וימני ${config.RIGHT_CONNECTION_OFFSET}`);
      
      // בצע סריקה נוספת אחרי זמן קצר (לטיפול במקרה שבלוקים כבר קיימים)
      setTimeout(scanAndMarkLeaders, 1000);
    } catch (error) {
      console.error('[GroupDrag] שגיאה באתחול מודול גרירת קבוצות:', error);
    }
  }
  
  // הפעל את האתחול כאשר המסמך נטען
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGroupDragModule);
  } else {
    // הדף כבר נטען, אתחל מיד
    initializeGroupDragModule();
  }
  
})();
