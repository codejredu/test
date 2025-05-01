// ===================================================
// GROUP-CONNECT-FIXED.JS v5.0.0 (FINAL POSITION & SOUND FIX)
// ===================================================
// פתרון סופי עם תיקון למיקום העיגולים וצליל החיבור
// ===================================================

console.log("[GroupFix] טוען מודול פתרון סופי עם תיקוני מיקום ואודיו");

(function() {
  'use strict';

  // === משתנים גלובליים ===
  let activeGroups = [];               // קבוצות פעילות במסמך
  let draggedGroup = null;             // קבוצה נוכחית בגרירה
  let potentialTarget = null;          // יעד פוטנציאלי לחיבור
  let connectionPoints = [];           // נקודות חיבור פעילות
  let lastCheck = 0;                   // זמן הבדיקה האחרון
  let oldSnapSound = null;             // פונקציית צליל מקורית
  let connectDistance = 0;             // מרחק החיבור הנוכחי
  
  // === הגדרות ===
  const CONFIG = {
    DEBUG: true,                      // הדפסת הודעות דיבאג
    POINT_SIZE: 20,                   // גודל נקודות החיבור
    HIGHLIGHT_COLOR: '#FF9800',       // צבע ההדגשה
    MIN_DISTANCE: 50,                 // מרחק מינימלי להתחלת הצגת עיגולים
    MAX_DISTANCE: 120,                // מרחק מקסימלי לזיהוי חיבור
    VERTICAL_OVERLAP: 0.05,           // חפיפה אנכית נדרשת (5%)
    CHECK_INTERVAL: 10,               // מרווח בין בדיקות במילישניות
    Z_INDEX: 10000,                   // שכבת תצוגה של העיגולים
    SOUND_URL: 'assets/sound/link.mp3', // נתיב לקובץ הצליל
    CONNECTION_DELAY: 0,              // השהיית החיבור
    CONNECTION_OFFSET_LEFT: -9,       // היסט חיבור שמאלי
    CONNECTION_OFFSET_RIGHT: 9        // היסט חיבור ימני
  };

  // === לוגים ===
  function log(message, data) {
    if (CONFIG.DEBUG) {
      console.log(`[GroupFix] ${message}`, data || '');
    }
  }

  // === הזרקת סגנונות ===
  function injectStyles() {
    // הסרת סגנונות קודמים אם קיימים
    const oldStyle = document.getElementById('group-connect-fixed-styles');
    if (oldStyle) oldStyle.remove();
    
    // יצירת סגנונות חדשים
    const style = document.createElement('style');
    style.id = 'group-connect-fixed-styles';
    style.textContent = `
      /* נקודות חיבור */
      .gfix-connection-point {
        position: fixed !important;
        width: ${CONFIG.POINT_SIZE}px !important;
        height: ${CONFIG.POINT_SIZE}px !important;
        background-color: ${CONFIG.HIGHLIGHT_COLOR} !important;
        border-radius: 50% !important;
        z-index: ${CONFIG.Z_INDEX} !important;
        box-shadow: 0 0 12px 2px ${CONFIG.HIGHLIGHT_COLOR} !important;
        pointer-events: none !important;
        opacity: 0.95 !important;
        animation: gfixPulse 0.6s infinite alternate !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: translate(-50%, -50%) !important;
      }
      
      @keyframes gfixPulse {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
      }
      
      /* הדגשת בלוקים */
      .gfix-highlight {
        box-shadow: 0 0 10px ${CONFIG.HIGHLIGHT_COLOR} !important;
        z-index: 1001 !important;
      }
      
      /* אנימציית הצלחה */
      .gfix-success {
        box-shadow: 0 0 15px #4CAF50 !important;
        animation: gfixSuccess 0.6s !important;
      }
      
      @keyframes gfixSuccess {
        0% { box-shadow: 0 0 5px #4CAF50; }
        50% { box-shadow: 0 0 25px #4CAF50; }
        100% { box-shadow: 0 0 5px #4CAF50; }
      }
    `;
    
    document.head.appendChild(style);
    log("סגנונות הוזרקו");
  }
  
  // === אודיו ===
  function setupAudio() {
    try {
      // שמור את הפונקציה המקורית אם קיימת
      if (typeof window.playSnapSound === 'function') {
        oldSnapSound = window.playSnapSound;
      }
      
      // צור אלמנט אודיו חדש
      const audio = new Audio(CONFIG.SOUND_URL);
      audio.preload = 'auto';
      
      // יישם פונקציית השמעה משלנו
      window.playFixSound = function() {
        // נסה את הפונקציה המקורית קודם
        if (oldSnapSound) {
          try {
            oldSnapSound();
            return;
          } catch (error) {
            log("שגיאה בהפעלת צליל מקורי:", error);
          }
        }
        
        // אם הפונקציה המקורית נכשלה, השתמש באודיו שלנו
        try {
          const sound = new Audio(CONFIG.SOUND_URL);
          sound.volume = 1.0;
          sound.play().catch(e => log("שגיאה בהשמעת צליל:", e));
        } catch (e) {
          log("שגיאה ביצירת אובייקט אודיו:", e);
        }
      };
      
      log("מערכת אודיו הוגדרה");
    } catch (error) {
      log("שגיאה בהגדרת אודיו:", error);
    }
  }
  
  // === ניקוי נקודות חיבור ===
  function clearConnectionPoints() {
    connectionPoints.forEach(point => {
      if (point && point.parentNode) {
        point.parentNode.removeChild(point);
      }
    });
    
    connectionPoints = [];
    
    document.querySelectorAll('.gfix-highlight').forEach(block => {
      block.classList.remove('gfix-highlight');
    });
  }
  
  // === יצירת נקודת חיבור ===
  function createConnectionPoint(blockPosition, type) {
    try {
      // בדיקה שיש מיקום תקין
      if (!blockPosition || typeof blockPosition.x === 'undefined' || typeof blockPosition.y === 'undefined') {
        return null;
      }
      
      // יצירת נקודה חדשה
      const point = document.createElement('div');
      point.className = `gfix-connection-point gfix-point-${type}`;
      point.id = `gfix-point-${type}-${Date.now()}`;
      
      // מיקום הנקודה ישירות במסך (position: fixed)
      point.style.left = `${blockPosition.x}px`;
      point.style.top = `${blockPosition.y}px`;
      
      // הוספה למסמך
      document.body.appendChild(point);
      connectionPoints.push(point);
      
      return point;
    } catch (error) {
      log("שגיאה ביצירת נקודת חיבור:", error);
      return null;
    }
  }
  
  // === הדגשת חיבור פוטנציאלי ===
  function highlightConnection(rightBlock, leftBlock) {
    if (!rightBlock || !leftBlock) {
      clearConnectionPoints();
      return;
    }
    
    // ניקוי נקודות קודמות
    clearConnectionPoints();
    
    // הדגשת הבלוקים
    rightBlock.classList.add('gfix-highlight');
    leftBlock.classList.add('gfix-highlight');
    
    // מציאת המיקום המדויק לנקודות החיבור
    const rightRect = rightBlock.getBoundingClientRect();
    const leftRect = leftBlock.getBoundingClientRect();
    
    // חישוב מיקום בצד ימין של הבלוק הימני
    const rightPoint = {
      x: rightRect.right,
      y: rightRect.top + (rightRect.height / 2)
    };
    
    // חישוב מיקום בצד שמאל של הבלוק השמאלי
    const leftPoint = {
      x: leftRect.left,
      y: leftRect.top + (leftRect.height / 2)
    };
    
    // יצירת נקודות החיבור
    createConnectionPoint(rightPoint, 'right');
    createConnectionPoint(leftPoint, 'left');
    
    log(`הדגשת חיבור בין: ${rightBlock.id} -> ${leftBlock.id}, מרחק: ${connectDistance.toFixed(1)}px`);
  }
  
  // === בדיקת חפיפה אנכית ===
  function hasVerticalOverlap(rect1, rect2) {
    if (!rect1 || !rect2) return false;
    
    const topOverlap = Math.max(rect1.top, rect2.top);
    const bottomOverlap = Math.min(rect1.bottom, rect2.bottom);
    const overlapHeight = bottomOverlap - topOverlap;
    
    if (overlapHeight <= 0) return false;
    
    const minHeight = Math.min(rect1.height, rect2.height);
    return (overlapHeight / minHeight) >= CONFIG.VERTICAL_OVERLAP;
  }
  
  // === מציאת קבוצות ===
  function findAllGroups() {
    const groups = [];
    const visited = new Set();
    const blocks = document.querySelectorAll('.block-container');
    
    blocks.forEach(block => {
      if (visited.has(block.id)) return;
      
      const connectedBlocks = findConnectedBlocks(block);
      
      if (connectedBlocks.length > 1) {
        // מצא את הבלוק המוביל
        const leadBlock = findLeftmostBlock(connectedBlocks);
        
        groups.push({
          blocks: connectedBlocks,
          lead: leadBlock,
          id: leadBlock.id
        });
        
        connectedBlocks.forEach(b => visited.add(b.id));
      } else {
        visited.add(block.id);
      }
    });
    
    return groups;
  }
  
  // === מציאת בלוקים מחוברים ===
  function findConnectedBlocks(startBlock) {
    if (!startBlock) return [];
    
    const result = [startBlock];
    const processed = new Set([startBlock.id]);
    const queue = [startBlock];
    
    while (queue.length > 0) {
      const current = queue.shift();
      const connections = new Set();
      
      // בדוק חיבורים בכל הכיוונים
      if (current.hasAttribute('data-connected-to')) {
        connections.add(current.getAttribute('data-connected-to'));
      }
      
      if (current.hasAttribute('data-connected-from-left')) {
        connections.add(current.getAttribute('data-connected-from-left'));
      }
      
      if (current.hasAttribute('data-connected-from-right')) {
        connections.add(current.getAttribute('data-connected-from-right'));
      }
      
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
  
  // === מציאת בלוקים קיצוניים ===
  function findLeftmostBlock(blocks) {
    if (!blocks || blocks.length === 0) return null;
    
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
  
  function findRightmostBlock(blocks) {
    if (!blocks || blocks.length === 0) return null;
    
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
  
  // === השמעת צליל ===
  function playConnectionSound() {
    // הפעל את הצליל המותאם שלנו
    if (typeof window.playFixSound === 'function') {
      window.playFixSound();
      log("צליל חיבור הושמע");
    } else if (typeof window.playSnapSound === 'function') {
      // גיבוי - נסה את הפונקציה המקורית
      window.playSnapSound();
      log("צליל חיבור מקורי הושמע");
    } else {
      log("לא נמצאה פונקציית צליל תקינה");
    }
  }
  
  // === חיבור קבוצות ===
  function connectGroups(sourceGroup, targetGroup) {
    if (!sourceGroup || !targetGroup) return false;
    
    try {
      log(`חיבור קבוצות: ${sourceGroup.id} -> ${targetGroup.id}`);
      
      // מצא את הבלוקים הקיצוניים
      const sourceRight = findRightmostBlock(sourceGroup.blocks);
      const targetLeft = findLeftmostBlock(targetGroup.blocks);
      
      if (!sourceRight || !targetLeft) return false;
      
      // השמע צליל לפני החיבור
      playConnectionSound();
      
      // עדכן את החיבור
      sourceRight.setAttribute('data-connected-to', targetLeft.id);
      sourceRight.setAttribute('data-connection-direction', 'left');
      targetLeft.setAttribute('data-connected-from-left', sourceRight.id);
      
      // סימון בלוקים כמחוברים
      sourceRight.classList.add('connected-block');
      targetLeft.classList.add('has-connected-block');
      
      // אפקט הצלחה
      sourceRight.classList.add('gfix-success');
      targetLeft.classList.add('gfix-success');
      
      setTimeout(() => {
        sourceRight.classList.remove('gfix-success');
        targetLeft.classList.remove('gfix-success');
      }, 600);
      
      // הסרת מסגרות
      if (typeof window.removeOutlinesFromConnected === 'function') {
        window.removeOutlinesFromConnected(sourceRight);
        window.removeOutlinesFromConnected(targetLeft);
      } else {
        sourceRight.classList.add('no-outlines');
        targetLeft.classList.add('no-outlines');
      }
      
      // ניקוי נקודות חיבור
      setTimeout(clearConnectionPoints, 200);
      
      log(`חיבור הושלם בהצלחה`);
      return true;
    } catch (error) {
      log("שגיאה בחיבור קבוצות:", error);
      clearConnectionPoints();
      return false;
    }
  }
  
  // === בדיקת חיבורים אפשריים ===
  function checkPotentialConnections() {
    const now = Date.now();
    if (now - lastCheck < CONFIG.CHECK_INTERVAL) return;
    lastCheck = now;
    
    // מצא קבוצות פעילות
    activeGroups = findAllGroups();
    
    if (activeGroups.length < 2) {
      clearConnectionPoints();
      return;
    }
    
    // מצא קבוצה בגרירה
    const draggingBlocks = document.querySelectorAll('.group-dragging');
    if (draggingBlocks.length === 0) {
      clearConnectionPoints();
      return;
    }
    
    // מצא את הקבוצה הנגררת
    const draggingGroup = activeGroups.find(group => 
      group.blocks.some(block => block.classList.contains('group-dragging')));
    
    if (!draggingGroup) {
      clearConnectionPoints();
      return;
    }
    
    // חפש את הקבוצה הקרובה ביותר
    let closestGroup = null;
    let minDistance = CONFIG.MAX_DISTANCE;
    
    activeGroups.forEach(otherGroup => {
      if (otherGroup.id !== draggingGroup.id) {
        // בדוק מרחק בין הקבוצות
        const draggingRight = findRightmostBlock(draggingGroup.blocks);
        const otherLeft = findLeftmostBlock(otherGroup.blocks);
        
        if (!draggingRight || !otherLeft) return;
        
        const rect1 = draggingRight.getBoundingClientRect();
        const rect2 = otherLeft.getBoundingClientRect();
        
        // חשב מרחק אופקי
        const distance = Math.abs(rect1.right - rect2.left);
        
        // בדוק אם המרחק קטן מסף מקסימלי וגדול מסף מינימלי ויש חפיפה אנכית
        if (distance < minDistance && distance > 0 && hasVerticalOverlap(rect1, rect2)) {
          closestGroup = otherGroup;
          minDistance = distance;
          connectDistance = distance;
        }
      }
    });
    
    // אם נמצאה קבוצה קרובה מספיק
    if (closestGroup && minDistance < CONFIG.MAX_DISTANCE) {
      // הצג עיגולים רק אם מספיק קרוב
      if (minDistance < CONFIG.MIN_DISTANCE) {
        const draggingRight = findRightmostBlock(draggingGroup.blocks);
        const closestLeft = findLeftmostBlock(closestGroup.blocks);
        
        highlightConnection(draggingRight, closestLeft);
        
        draggedGroup = draggingGroup;
        potentialTarget = closestGroup;
      }
    } else {
      // אם אין קבוצה מספיק קרובה
      clearConnectionPoints();
      draggedGroup = null;
      potentialTarget = null;
    }
  }
  
  // === טיפול בשחרור עכבר ===
  function handleMouseUp() {
    if (draggedGroup && potentialTarget && connectDistance < CONFIG.MIN_DISTANCE) {
      // בצע חיבור
      connectGroups(draggedGroup, potentialTarget);
      
      // איפוס
      draggedGroup = null;
      potentialTarget = null;
    }
    
    // ניקוי בכל מקרה
    clearConnectionPoints();
  }
  
  // === דריסת פונקציות מקוריות ===
  function overrideOriginalFunctions() {
    if (window.groupDragApi) {
      log("דורס פונקציות גרירת קבוצות");
      
      // דריסת פונקציית תזוזת גרירה
      if (typeof window.groupDragApi.moveDragGroup === 'function') {
        const originalMoveDragGroup = window.groupDragApi.moveDragGroup;
        
        window.groupDragApi.moveDragGroup = function(event) {
          // הפעל פונקציה מקורית
          const result = originalMoveDragGroup.apply(this, arguments);
          
          // בדוק חיבורים אפשריים
          checkPotentialConnections();
          
          return result;
        };
      }
      
      // דריסת פונקציית סיום גרירה
      if (typeof window.groupDragApi.endDragGroup === 'function') {
        const originalEndDragGroup = window.groupDragApi.endDragGroup;
        
        window.groupDragApi.endDragGroup = function(event) {
          // שמור מצב לפני סיום
          const hasConnection = draggedGroup && potentialTarget && connectDistance < CONFIG.MIN_DISTANCE;
          
          // הפעל פונקציה מקורית
          const result = originalEndDragGroup.apply(this, arguments);
          
          // בצע חיבור אם נדרש
          if (hasConnection) {
            setTimeout(() => {
              connectGroups(draggedGroup, potentialTarget);
              draggedGroup = null;
              potentialTarget = null;
            }, CONFIG.CONNECTION_DELAY);
          } else {
            clearConnectionPoints();
          }
          
          return result;
        };
      }
    }
  }
  
  // === אתחול ===
  function initialize() {
    log("מאתחל מודול פתרון סופי");
    
    // הזרקת סגנונות
    injectStyles();
    
    // הגדרת מערכת אודיו
    setupAudio();
    
    // דריסת פונקציות
    overrideOriginalFunctions();
    
    // הגדרת אירועי עכבר גלובליים
    document.addEventListener('mousemove', function(event) {
      if (event.buttons === 1) { // לחצן שמאלי
        checkPotentialConnections();
      }
    }, { passive: true });
    
    document.addEventListener('mouseup', handleMouseUp);
    
    // הגדרת API גלובלי
    window.groupConnectFix = {
      connect: connectGroups,
      checkConnections: checkPotentialConnections,
      findGroups: findAllGroups,
      playSound: playConnectionSound,
      CONFIG
    };
    
    log("אתחול הושלם");
  }
  
  // === ריצה ===
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 500));
  } else {
    // הפעל מיד
    setTimeout(initialize, 100);
  }
  
  // הפעל גם אחרי זמן נוסף למקרה של טעינה מאוחרת
  setTimeout(initialize, 1000);
})();
