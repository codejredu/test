// --- GROUP-CONNECT-FIXED.JS v1.0.1 ---
// מודול משופר המאפשר חיבור בין קבוצות בלוקים מחוברים עם מיקום מדויק

(function() {
  'use strict';
  
  // === משתנים גלובליים ===
  let isTrackingGroups = false;    // האם המודול פעיל ועוקב אחרי קבוצות
  let activeGroups = [];           // קבוצות בלוקים פעילות
  let potentialTarget = null;      // קבוצת היעד הפוטנציאלית לחיבור
  let potentialSource = null;      // קבוצת המקור הפוטנציאלית לחיבור
  let connectDirection = null;     // כיוון החיבור ('left' או 'right')
  let lastCheckTime = 0;           // זמן הבדיקה האחרונה (למניעת עומס)
  
  // === הגדרות ===
  const config = {
    debug: true,                        // האם להדפיס הודעות דיבאג בקונסול
    groupMinSize: 2,                    // גודל מינימלי לקבוצה (מספר בלוקים)
    connectThreshold: 50,               // מרחק מקסימלי בפיקסלים לזיהוי אפשרות חיבור
    connectHighlightColor: '#FF9800',   // צבע הדגשה לנקודות חיבור
    verticalOverlapRequired: 0.3,       // החפיפה האנכית הנדרשת כאחוז מגובה הבלוק
    checkInterval: 100,                 // משך זמן מינימלי בין בדיקות חיבור במילישניות
    animationDuration: 300,             // משך האנימציה במילישניות
    
    // ערכי היסט מדויקים (התאמה להגדרות המדויקות ממודול החיבור המקורי)
    PUZZLE_RIGHT_BULGE_WIDTH: 10,       // רוחב הבליטה בצד ימין
    PUZZLE_LEFT_SOCKET_WIDTH: 10,       // רוחב השקע בצד שמאל
    VERTICAL_CENTER_OFFSET: 0,          // היסט אנכי
    
    // היסטים מיוחדים לתיקון מיקומים
    RIGHT_TO_LEFT_OFFSET: -9,           // חיבור ימין-שמאל (כשהמקור מימין והיעד משמאל)
    LEFT_TO_RIGHT_OFFSET: -9            // חיבור שמאל-ימין (כשהמקור משמאל והיעד מימין)
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
  
  // מציאת כל הבלוקים המחוברים בקבוצה
  function findConnectedBlocks(startBlock) {
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
  
  // מציאת הבלוק השמאלי ביותר בקבוצה
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
  
  // הדגשת חיבור פוטנציאלי בין קבוצות
  function highlightPotentialConnection(sourceBlock, targetBlock, direction) {
    // נקה הדגשות קודמות
    clearConnectionHighlights();
    
    if (!sourceBlock || !targetBlock) return;
    
    // ודא שהסגנון CSS קיים
    ensureConnectionStyles();
    
    if (direction === 'right') {
      // הצד הימני של המקור לצד שמאל של היעד
      const rightPoint = document.createElement('div');
      rightPoint.className = 'group-connection-point group-connection-right';
      rightPoint.id = 'group-connection-source';
      sourceBlock.appendChild(rightPoint);
      
      const leftPoint = document.createElement('div');
      leftPoint.className = 'group-connection-point group-connection-left';
      leftPoint.id = 'group-connection-target';
      targetBlock.appendChild(leftPoint);
    } else {
      // הצד השמאלי של המקור לצד ימין של היעד
      const leftPoint = document.createElement('div');
      leftPoint.className = 'group-connection-point group-connection-left';
      leftPoint.id = 'group-connection-source';
      sourceBlock.appendChild(leftPoint);
      
      const rightPoint = document.createElement('div');
      rightPoint.className = 'group-connection-point group-connection-right';
      rightPoint.id = 'group-connection-target';
      targetBlock.appendChild(rightPoint);
    }
    
    // הדגש את הבלוקים
    sourceBlock.classList.add('group-potential-connect');
    targetBlock.classList.add('group-potential-connect');
  }
  
  // ניקוי הדגשות חיבור
  function clearConnectionHighlights() {
    // הסר את נקודות החיבור
    document.querySelectorAll('.group-connection-point').forEach(point => point.remove());
    
    // הסר את הדגשת הבלוקים
    document.querySelectorAll('.group-potential-connect').forEach(block => {
      block.classList.remove('group-potential-connect');
    });
  }
  
  // יצירת סגנונות CSS לחיבור
  function ensureConnectionStyles() {
    if (document.getElementById('group-connection-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'group-connection-styles';
    style.textContent = `
      .group-connection-point {
        position: absolute;
        width: 16px;
        height: 16px;
        background-color: ${config.connectHighlightColor};
        border-radius: 50%;
        z-index: 2000;
        box-shadow: 0 0 8px ${config.connectHighlightColor};
        pointer-events: none;
        animation: group-pulse-connect 0.6s infinite alternate;
      }
      
      @keyframes group-pulse-connect {
        0% { transform: scale(1); opacity: 0.7; }
        100% { transform: scale(1.3); opacity: 1; }
      }
      
      .group-connection-left {
        top: 50%;
        left: -8px;
        transform: translateY(-50%);
      }
      
      .group-connection-right {
        top: 50%;
        right: -8px;
        transform: translateY(-50%);
      }
      
      .group-potential-connect {
        box-shadow: 0 0 8px ${config.connectHighlightColor};
        z-index: 1001;
      }
      
      .group-connection-animation {
        transition: left ${config.animationDuration}ms ease-out, top ${config.animationDuration}ms ease-out !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // סריקת כל הקבוצות באזור התכנות
  function scanGroups() {
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return [];
    
    // מצא את כל הבלוקים המחוברים
    const allBlocks = Array.from(programArea.querySelectorAll('.block-container'));
    const processedIds = new Set();
    const groups = [];
    
    // עבור על כל הבלוקים
    for (const block of allBlocks) {
      // דלג על בלוקים שכבר עובדו
      if (processedIds.has(block.id)) continue;
      
      // בדוק אם הבלוק מחובר
      const isConnected = block.hasAttribute('data-connected-to') || 
                          block.hasAttribute('data-connected-from-left') || 
                          block.hasAttribute('data-connected-from-right');
      
      if (!isConnected) continue;
      
      // מצא את כל הבלוקים בקבוצה
      const groupBlocks = findConnectedBlocks(block);
      
      // התעלם מקבוצות קטנות מדי
      if (groupBlocks.length < config.groupMinSize) continue;
      
      // סמן את כל הבלוקים בקבוצה כמעובדים
      groupBlocks.forEach(b => processedIds.add(b.id));
      
      // הוסף את הקבוצה לרשימה
      groups.push({
        blocks: groupBlocks,
        leftmost: findLeftmostBlock(groupBlocks),
        rightmost: findRightmostBlock(groupBlocks),
        id: `group-${groupBlocks[0].id}`
      });
    }
    
    return groups;
  }
  
  // בדיקת אפשרויות חיבור בין קבוצות
  function checkForConnectionOpportunities() {
    const now = Date.now();
    
    // מניעת עומס - בדוק רק אם עבר מספיק זמן מהבדיקה האחרונה
    if (now - lastCheckTime < config.checkInterval) return;
    lastCheckTime = now;
    
    // נקה הדגשות קודמות
    clearConnectionHighlights();
    
    // איפוס משתני חיבור
    potentialSource = null;
    potentialTarget = null;
    connectDirection = null;
    
    // סרוק את כל הקבוצות
    activeGroups = scanGroups();
    
    if (activeGroups.length < 2) return; // צריך לפחות שתי קבוצות לחיבור
    
    // זיהוי קבוצה פעילה (נגררת)
    let draggingGroup = null;
    for (const group of activeGroups) {
      const isDragging = group.blocks.some(block => block.classList.contains('group-dragging'));
      if (isDragging) {
        draggingGroup = group;
        break;
      }
    }
    
    if (!draggingGroup) return; // אין קבוצה נגררת
    
    // עבור על כל הקבוצות האחרות ובדוק אפשרות חיבור
    for (const targetGroup of activeGroups) {
      // דלג על הקבוצה הנגררת
      if (targetGroup === draggingGroup) continue;
      
      // בדיקת חיבור: הימני של הקבוצה הנגררת לשמאלי של הקבוצה היעד
      checkRightToLeftConnection(draggingGroup, targetGroup);
      
      // אם נמצאה אפשרות חיבור, סיים את הבדיקה
      if (potentialSource && potentialTarget) return;
      
      // בדיקת חיבור: השמאלי של הקבוצה הנגררת לימני של הקבוצה היעד
      checkLeftToRightConnection(draggingGroup, targetGroup);
      
      // אם נמצאה אפשרות חיבור, סיים את הבדיקה
      if (potentialSource && potentialTarget) return;
    }
  }
  
  // בדיקת חיבור ימין-שמאל
  function checkRightToLeftConnection(group1, group2) {
    const rightmost = group1.rightmost;
    const leftmost = group2.leftmost;
    
    if (!rightmost || !leftmost) return false;
    
    // בדוק שהבלוק הימני ביותר של קבוצה 1 לא מחובר לבלוק אחר מצד ימין
    if (rightmost.hasAttribute('data-connected-from-right')) return false;
    
    // בדוק שהבלוק השמאלי של קבוצה 2 לא מחובר לבלוק אחר מצד שמאל
    if (leftmost.hasAttribute('data-connected-from-left')) return false;
    
    // חשב מרחק בין הבלוקים
    const rightRect = rightmost.getBoundingClientRect();
    const leftRect = leftmost.getBoundingClientRect();
    
    const distance = Math.abs(rightRect.right - leftRect.left);
    
    // בדוק אם המרחק קטן מהסף והיש חפיפה אנכית מספקת
    if (distance <= config.connectThreshold && checkVerticalOverlap(rightRect, leftRect)) {
      potentialSource = group1;
      potentialTarget = group2;
      connectDirection = 'right';
      
      // הדגש את הבלוקים המתאימים
      highlightPotentialConnection(rightmost, leftmost, 'right');
      
      log(`זוהתה אפשרות חיבור ימין-שמאל: ${group1.id} -> ${group2.id}, מרחק: ${distance.toFixed(1)}px`);
      return true;
    }
    
    return false;
  }
  
  // בדיקת חיבור שמאל-ימין
  function checkLeftToRightConnection(group1, group2) {
    const leftmost = group1.leftmost;
    const rightmost = group2.rightmost;
    
    if (!leftmost || !rightmost) return false;
    
    // בדוק שהבלוק השמאלי ביותר של קבוצה 1 לא מחובר לבלוק אחר מצד שמאל
    if (leftmost.hasAttribute('data-connected-from-left')) return false;
    
    // בדוק שהבלוק הימני של קבוצה 2 לא מחובר לבלוק אחר מצד ימין
    if (rightmost.hasAttribute('data-connected-from-right')) return false;
    
    // חשב מרחק בין הבלוקים
    const leftRect = leftmost.getBoundingClientRect();
    const rightRect = rightmost.getBoundingClientRect();
    
    const distance = Math.abs(leftRect.left - rightRect.right);
    
    // בדוק אם המרחק קטן מהסף והיש חפיפה אנכית מספקת
    if (distance <= config.connectThreshold && checkVerticalOverlap(leftRect, rightRect)) {
      potentialSource = group1;
      potentialTarget = group2;
      connectDirection = 'left';
      
      // הדגש את הבלוקים המתאימים
      highlightPotentialConnection(leftmost, rightmost, 'left');
      
      log(`זוהתה אפשרות חיבור שמאל-ימין: ${group1.id} -> ${group2.id}, מרחק: ${distance.toFixed(1)}px`);
      return true;
    }
    
    return false;
  }
  
  // ביצוע חיבור בין קבוצות
  function connectGroups() {
    if (!potentialSource || !potentialTarget || !connectDirection) {
      log("אין אפשרות חיבור זמינה");
      return false;
    }
    
    try {
      log(`ביצוע חיבור בין קבוצות: ${connectDirection}`);
      
      let sourceBlock, targetBlock;
      
      if (connectDirection === 'right') {
        // חיבור ימין-שמאל
        sourceBlock = potentialSource.rightmost;
        targetBlock = potentialTarget.leftmost;
      } else {
        // חיבור שמאל-ימין
        sourceBlock = potentialSource.leftmost;
        targetBlock = potentialTarget.rightmost;
      }
      
      if (!sourceBlock || !targetBlock) {
        log("לא ניתן לזהות את הבלוקים לחיבור");
        return false;
      }
      
      // הוספת אנימציה לקבוצות
      const allBlocks = [...potentialSource.blocks, ...potentialTarget.blocks];
      allBlocks.forEach(block => {
        block.classList.add('group-connection-animation');
      });
      
      // נתק את הבלוקים מהקבוצות שלהם (אם הם כבר מחוברים לבלוקים אחרים)
      detachConnections(sourceBlock, connectDirection);
      detachConnections(targetBlock, connectDirection === 'right' ? 'left' : 'right');
      
      // חבר את הבלוקים
      performOptimizedConnection(sourceBlock, targetBlock, connectDirection);
      
      // נקה אנימציות לאחר הסיום
      setTimeout(() => {
        allBlocks.forEach(block => {
          block.classList.remove('group-connection-animation');
        });
      }, config.animationDuration);
      
      // השמע צליל אם זמין
      if (typeof window.playSnapSound === 'function') {
        window.playSnapSound();
      }
      
      // נקה הדגשות
      clearConnectionHighlights();
      
      // איפוס משתני החיבור
      potentialSource = null;
      potentialTarget = null;
      connectDirection = null;
      
      return true;
    } catch (err) {
      console.error('[GroupConnect] שגיאה בחיבור קבוצות:', err);
      return false;
    }
  }
  
  // ניתוק חיבורים קיימים לפני חיבור חדש
  function detachConnections(block, direction) {
    if (!block) return;
    
    if (direction === 'right') {
      // נתק חיבור מצד ימין
      if (block.hasAttribute('data-connected-to') && 
          block.getAttribute('data-connection-direction') === 'left') {
        const rightBlockId = block.getAttribute('data-connected-to');
        const rightBlock = document.getElementById(rightBlockId);
        
        if (rightBlock) {
          rightBlock.removeAttribute('data-connected-from-left');
        }
        
        block.removeAttribute('data-connected-to');
        block.removeAttribute('data-connection-direction');
      }
    } else if (direction === 'left') {
      // נתק חיבור מצד שמאל
      if (block.hasAttribute('data-connected-from-left')) {
        const leftBlockId = block.getAttribute('data-connected-from-left');
        const leftBlock = document.getElementById(leftBlockId);
        
        if (leftBlock) {
          leftBlock.removeAttribute('data-connected-to');
          leftBlock.removeAttribute('data-connection-direction');
        }
        
        block.removeAttribute('data-connected-from-left');
      }
    }
  }
  
  // ביצוע חיבור בין בלוקים עם התאמות מיקום מדויקות
  function performOptimizedConnection(sourceBlock, targetBlock, direction) {
    log(`ביצוע חיבור מדויק: ${direction}`);
    
    // חישוב המיקומים המקוריים
    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    const programArea = document.getElementById('program-blocks');
    const areaRect = programArea.getBoundingClientRect();
    
    // קביעת סוג החיבור ויצירת היחסים בין הבלוקים
    if (direction === 'right') {
      // חיבור ימין-שמאל (הימני של המקור לשמאלי של היעד)
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', 'left');
      targetBlock.setAttribute('data-connected-from-left', sourceBlock.id);
      
      // חישוב מיקום מדויק עם היסט
      const newLeft = targetRect.left - sourceRect.width + config.RIGHT_TO_LEFT_OFFSET;
      const newTop = targetRect.top + config.VERTICAL_CENTER_OFFSET;
      
      // סרטוט המיקום היחסי לאזור התכנות
      const relativeLeft = newLeft - areaRect.left + programArea.scrollLeft;
      const relativeTop = newTop - areaRect.top + programArea.scrollTop;
      
      log(`מיקום חדש (ימין-שמאל): L=${relativeLeft.toFixed(1)}, T=${relativeTop.toFixed(1)}, offset=${config.RIGHT_TO_LEFT_OFFSET}`);
      
      // הצבת הבלוק במיקומו החדש
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = `${Math.round(relativeLeft)}px`;
      sourceBlock.style.top = `${Math.round(relativeTop)}px`;
      sourceBlock.style.margin = '0';
      
    } else if (direction === 'left') {
      // חיבור שמאל-ימין (השמאלי של המקור לימני של היעד)
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', 'right');
      targetBlock.setAttribute('data-connected-from-right', sourceBlock.id);
      
      // חישוב מיקום מדויק עם היסט
      const newLeft = targetRect.right + config.LEFT_TO_RIGHT_OFFSET;
      const newTop = targetRect.top + config.VERTICAL_CENTER_OFFSET;
      
      // סרטוט המיקום היחסי לאזור התכנות
      const relativeLeft = newLeft - areaRect.left + programArea.scrollLeft;
      const relativeTop = newTop - areaRect.top + programArea.scrollTop;
      
      log(`מיקום חדש (שמאל-ימין): L=${relativeLeft.toFixed(1)}, T=${relativeTop.toFixed(1)}, offset=${config.LEFT_TO_RIGHT_OFFSET}`);
      
      // הצבת הבלוק במיקומו החדש
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = `${Math.round(relativeLeft)}px`;
      sourceBlock.style.top = `${Math.round(relativeTop)}px`;
      sourceBlock.style.margin = '0';
    }
    
    // סימון הבלוקים כמחוברים
    sourceBlock.classList.add('connected-block');
    targetBlock.classList.add('has-connected-block');
    
    // הוספת מחלקות "ללא מסגרת" לשמירה על מראה אחיד
    sourceBlock.classList.add('no-outlines');
    targetBlock.classList.add('no-outlines');
    
    log(`חיבור בוצע בהצלחה: ${sourceBlock.id} -> ${targetBlock.id}`);
    
    // עדכון גם את כל הבלוקים בקבוצות
    if (potentialSource && potentialTarget) {
      [...potentialSource.blocks, ...potentialTarget.blocks].forEach(block => {
        if (block !== sourceBlock && block !== targetBlock) {
          block.classList.add('no-outlines');
        }
      });
    }
  }
  
  // === מאזיני אירועים ===
  
  // מאזין למסמך - בדיקת אפשרויות חיבור בזמן תזוזת העכבר
  function handleDocumentMouseMove(e) {
    // בדוק אם יש גרירת קבוצה פעילה
    const isGroupDragging = document.querySelectorAll('.group-dragging').length > 0;
    
    if (isGroupDragging) {
      // בדוק אפשרויות חיבור רק בזמן גרירה
      checkForConnectionOpportunities();
    }
  }
  
  // מאזין לשחרור העכבר - ביצוע חיבור אם יש אפשרות
  function handleDocumentMouseUp(e) {
    // בדוק אם יש אפשרות חיבור פעילה
    if (potentialSource && potentialTarget) {
      // בצע את החיבור
      connectGroups();
    }
    
    // נקה את ההדגשות בכל מקרה
    clearConnectionHighlights();
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
      if (shouldCheck) {
        setTimeout(() => {
          activeGroups = scanGroups();
        }, 200);
      }
    });
    
    // התחל לעקוב אחרי שינויים
    observer.observe(programArea, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-connected-to', 'data-connected-from-left', 'data-connected-from-right', 'style', 'class']
    });
    
    log("משקיף לשינויים באזור התכנות הופעל");
  }
