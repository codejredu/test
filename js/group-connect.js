// ===================================================
// GROUP-CONNECT-COMPLETE.JS v4.0.0 (FINAL SOLUTION)
// ===================================================
// פתרון מלא לחיבור קבוצות, כולל סימון עיגולי חיבור ממשק משתמש משופר
// ===================================================

console.log("[GroupComplete] טוען מודול פתרון מלא לחיבור קבוצות");

(function() {
  'use strict';

  // === משתנים גלובליים ===
  let activeGroups = [];               // קבוצות פעילות במסמך
  let draggedGroup = null;             // קבוצה נוכחית בגרירה
  let potentialTarget = null;          // יעד אפשרי לחיבור
  let originals = {};                  // שמירת פונקציות מקוריות
  let connectionPoints = [];           // מערך של נקודות חיבור פעילות
  let lastCheck = 0;                   // זמן הבדיקה האחרון
  let audioReady = false;              // האם האודיו מוכן
  
  // === הגדרות ===
  const CONFIG = {
    DEBUG: true,                       // הדפסת הודעות דיבאג
    POINT_SIZE: 24,                    // גודל נקודות חיבור בפיקסלים
    HIGHLIGHT_COLOR: '#FF9800',        // צבע נקודות חיבור
    CONNECTION_THRESHOLD: 150,         // טווח זיהוי בפיקסלים
    VERTICAL_OVERLAP: 0.05,            // חפיפה אנכית מינימלית
    CHECK_INTERVAL: 5,                 // זמן בין בדיקות במילישניות
    Z_INDEX: 10000,                    // שכבת תצוגה של נקודות חיבור
    CONNECTION_LEFT_OFFSET: -9,        // היסט שמאלי לחיבור
    CONNECTION_RIGHT_OFFSET: 9         // היסט ימני לחיבור
  };

  // === לוגים ===
  function log(message, data) {
    if (CONFIG.DEBUG) {
      if (data) {
        console.log(`[GroupComplete] ${message}`, data);
      } else {
        console.log(`[GroupComplete] ${message}`);
      }
    }
  }

  // === הזרקת סגנונות ===
  function injectStyles() {
    // הסרת סגנונות קודמים אם קיימים
    const oldStyle = document.getElementById('gc-connection-styles');
    if (oldStyle) oldStyle.remove();
    
    // יצירת סגנונות חדשים
    const style = document.createElement('style');
    style.id = 'gc-connection-styles';
    style.textContent = `
      /* עיגולי חיבור */
      .gc-connection-point {
        position: absolute !important;
        width: ${CONFIG.POINT_SIZE}px !important;
        height: ${CONFIG.POINT_SIZE}px !important;
        background-color: ${CONFIG.HIGHLIGHT_COLOR} !important;
        border-radius: 50% !important;
        z-index: ${CONFIG.Z_INDEX} !important;
        box-shadow: 0 0 15px ${CONFIG.HIGHLIGHT_COLOR} !important;
        pointer-events: none !important;
        animation: gcPulse 0.6s infinite alternate !important;
        opacity: 0.9 !important;
      }
      
      /* אנימציית פעימה */
      @keyframes gcPulse {
        0% { transform: scale(1) translateY(-50%); opacity: 0.8; }
        100% { transform: scale(1.3) translateY(-50%); opacity: 1; }
      }
      
      /* מיקום נקודות */
      .gc-point-left {
        top: 50% !important;
        left: -${Math.floor(CONFIG.POINT_SIZE/2)}px !important;
        transform: translateY(-50%) !important;
      }
      
      .gc-point-right {
        top: 50% !important;
        right: -${Math.floor(CONFIG.POINT_SIZE/2)}px !important;
        transform: translateY(-50%) !important;
      }
      
      /* הדגשת בלוקים */
      .gc-highlight {
        box-shadow: 0 0 12px ${CONFIG.HIGHLIGHT_COLOR} !important;
        z-index: 1001 !important;
      }
      
      /* אנימציית הצלחה */
      .gc-success {
        box-shadow: 0 0 15px #4CAF50 !important;
        animation: gcSuccess 0.6s !important;
      }
      
      @keyframes gcSuccess {
        0% { box-shadow: 0 0 5px #4CAF50; }
        50% { box-shadow: 0 0 25px #4CAF50; }
        100% { box-shadow: 0 0 5px #4CAF50; }
      }
      
      /* שכבת חיבור */
      #gc-connection-layer {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        z-index: ${CONFIG.Z_INDEX - 1} !important;
      }
    `;
    
    document.head.appendChild(style);
    log("סגנונות הוזרקו למסמך");
  }
  
  // === יצירת שכבת חיבור ===
  function createConnectionLayer() {
    // בדוק אם כבר קיימת שכבה
    if (document.getElementById('gc-connection-layer')) return;
    
    // מצא את אזור התכנות
    const programArea = document.getElementById('program-blocks');
    if (!programArea) {
      log("אזור התכנות לא נמצא!");
      return null;
    }
    
    // יצירת שכבה חדשה
    const layer = document.createElement('div');
    layer.id = 'gc-connection-layer';
    programArea.appendChild(layer);
    
    log("שכבת חיבור נוצרה");
    return layer;
  }
  
  // === יצירת נקודת חיבור ===
  function createConnectionPoint(block, position) {
    try {
      // מצא או צור שכבת חיבור
      let layer = document.getElementById('gc-connection-layer');
      if (!layer) {
        layer = createConnectionLayer();
      }
      
      if (!layer || !block) return null;
      
      // חשב מיקום
      const blockRect = block.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      
      // יצירת נקודה
      const point = document.createElement('div');
      point.className = `gc-connection-point gc-point-${position}`;
      point.id = `gc-point-${position}-${Date.now()}`;
      
      // חישוב מיקום מדויק
      const topOffset = blockRect.top - layerRect.top + layer.scrollTop + (blockRect.height / 2);
      
      if (position === 'right') {
        const leftOffset = blockRect.right - layerRect.left - Math.floor(CONFIG.POINT_SIZE/2) + layer.scrollLeft;
        point.style.top = `${topOffset}px`;
        point.style.left = `${leftOffset}px`;
      } else {
        const leftOffset = blockRect.left - layerRect.left - Math.floor(CONFIG.POINT_SIZE/2) + layer.scrollLeft;
        point.style.top = `${topOffset}px`;
        point.style.left = `${leftOffset}px`;
      }
      
      // הוספת הנקודה לשכבה
      layer.appendChild(point);
      
      // שמירת הנקודה במערך
      connectionPoints.push(point);
      
      return point;
    } catch (error) {
      console.error("[GroupComplete] שגיאה ביצירת נקודת חיבור:", error);
      return null;
    }
  }
  
  // === ניקוי נקודות חיבור ===
  function clearConnectionPoints() {
    // הסרת נקודות קיימות
    connectionPoints.forEach(point => {
      if (point && point.parentNode) {
        point.parentNode.removeChild(point);
      }
    });
    
    // איפוס המערך
    connectionPoints = [];
    
    // הסרת הדגשות
    document.querySelectorAll('.gc-highlight').forEach(block => {
      block.classList.remove('gc-highlight');
    });
  }
  
  // === הדגשת חיבור פוטנציאלי ===
  function highlightConnection(sourceBlock, targetBlock) {
    if (!sourceBlock || !targetBlock) return;
    
    // ניקוי נקודות קודמות
    clearConnectionPoints();
    
    // הדגשת בלוקים
    sourceBlock.classList.add('gc-highlight');
    targetBlock.classList.add('gc-highlight');
    
    // זיהוי כיוון החיבור
    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    
    // בדיקה אם מתחברים מימין לשמאל או להפך
    const isRightToLeft = sourceRect.right <= targetRect.left;
    
    if (isRightToLeft) {
      // חיבור מימין של המקור לשמאל של היעד
      createConnectionPoint(sourceBlock, 'right');
      createConnectionPoint(targetBlock, 'left');
    } else {
      // חיבור משמאל של המקור לימין של היעד
      createConnectionPoint(sourceBlock, 'left');
      createConnectionPoint(targetBlock, 'right');
    }
    
    log(`הדגשת חיבור: ${sourceBlock.id} -> ${targetBlock.id}`);
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
    
    // עבור על כל הבלוקים
    blocks.forEach(block => {
      if (visited.has(block.id)) return;
      
      // מצא את כל הבלוקים המחוברים
      const connectedBlocks = findConnectedBlocks(block);
      
      if (connectedBlocks.length > 1) {
        // מצא את הבלוק המוביל
        const leadBlock = findLeftmostBlock(connectedBlocks);
        
        // הוסף קבוצה חדשה
        groups.push({
          blocks: connectedBlocks,
          lead: leadBlock,
          id: leadBlock.id
        });
        
        // סמן את כל הבלוקים בקבוצה כמבוקרים
        connectedBlocks.forEach(b => visited.add(b.id));
      } else {
        // בלוק בודד
        visited.add(block.id);
      }
    });
    
    return groups;
  }

  // === מציאת בלוקים מחוברים ===
  function findConnectedBlocks(startBlock) {
    if (!startBlock) return [];
    
    // קבוצת הבלוקים המחוברים
    const result = [startBlock];
    const processed = new Set([startBlock.id]);
    
    // תור לסריקה
    const queue = [startBlock];
    
    while (queue.length > 0) {
      const current = queue.shift();
      const connections = new Set();
      
      // בדוק חיבורים לימין
      if (current.hasAttribute('data-connected-to')) {
        connections.add(current.getAttribute('data-connected-to'));
      }
      
      // בדוק חיבורים משמאל
      if (current.hasAttribute('data-connected-from-left')) {
        connections.add(current.getAttribute('data-connected-from-left'));
      }
      
      // בדוק חיבורים מימין
      if (current.hasAttribute('data-connected-from-right')) {
        connections.add(current.getAttribute('data-connected-from-right'));
      }
      
      // הוסף בלוקים מחוברים לתור
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
  
  // === מציאת הבלוק השמאלי ביותר ===
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
  
  // === מציאת הבלוק הימני ביותר ===
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
  
  // === השמעת צליל חיבור ===
  function playConnectionSound() {
    try {
      if (typeof window.playSnapSound === 'function') {
        window.playSnapSound();
        log("הושמע צליל חיבור");
      } else {
        log("פונקציית צליל חיבור לא נמצאה");
      }
    } catch (error) {
      console.error("[GroupComplete] שגיאה בהשמעת צליל:", error);
    }
  }
  
  // === חיבור קבוצות ===
  function connectGroups(sourceGroup, targetGroup) {
    if (!sourceGroup || !targetGroup) return false;
    
    try {
      log(`מחבר קבוצות: ${sourceGroup.id} -> ${targetGroup.id}`);
      
      // מצא את הבלוקים הקיצוניים
      const sourceRight = findRightmostBlock(sourceGroup.blocks);
      const targetLeft = findLeftmostBlock(targetGroup.blocks);
      
      if (!sourceRight || !targetLeft) return false;
      
      // הדגש את החיבור
      highlightConnection(sourceRight, targetLeft);
      
      // השמע צליל
      playConnectionSound();
      
      // עדכן את החיבור
      sourceRight.setAttribute('data-connected-to', targetLeft.id);
      sourceRight.setAttribute('data-connection-direction', 'left');
      targetLeft.setAttribute('data-connected-from-left', sourceRight.id);
      
      // סימון בלוקים כמחוברים
      sourceRight.classList.add('connected-block');
      targetLeft.classList.add('has-connected-block');
      
      // הוסף אפקט הצלחה
      sourceRight.classList.add('gc-success');
      targetLeft.classList.add('gc-success');
      
      // הסר אפקט הצלחה אחרי זמן מה
      setTimeout(() => {
        sourceRight.classList.remove('gc-success');
        targetLeft.classList.remove('gc-success');
      }, 1000);
      
      // הסר מסגרות
      if (typeof window.removeOutlinesFromConnected === 'function') {
        window.removeOutlinesFromConnected(sourceRight);
        window.removeOutlinesFromConnected(targetLeft);
      } else {
        sourceRight.classList.add('no-outlines');
        targetLeft.classList.add('no-outlines');
      }
      
      // ניקוי נקודות חיבור אחרי זמן מה
      setTimeout(clearConnectionPoints, 800);
      
      log(`חיבור בוצע בהצלחה`);
      return true;
    } catch (error) {
      console.error("[GroupComplete] שגיאה בחיבור קבוצות:", error);
      return false;
    }
  }

  // === בדיקת חיבורים אפשריים ===
  function checkPotentialConnections() {
    const now = Date.now();
    if (now - lastCheck < CONFIG.CHECK_INTERVAL) return;
    lastCheck = now;
    
    // מצא את כל הקבוצות הפעילות
    activeGroups = findAllGroups();
    
    // בדוק אם יש לפחות שתי קבוצות
    if (activeGroups.length >= 2) {
      // מצא קבוצות שכרגע בגרירה
      const draggingBlocks = document.querySelectorAll('.group-dragging');
      
      if (draggingBlocks.length > 0) {
        const draggingGroup = activeGroups.find(group => 
          group.blocks.some(block => block.classList.contains('group-dragging')));
        
        if (draggingGroup) {
          // חפש קבוצה קרובה
          let closestGroup = null;
          let minDistance = CONFIG.CONNECTION_THRESHOLD;
          
          // עבור על כל הקבוצות האחרות
          activeGroups.forEach(otherGroup => {
            if (otherGroup.id !== draggingGroup.id) {
              // בדוק מרחק בין הקבוצות
              const draggingRight = findRightmostBlock(draggingGroup.blocks);
              const otherLeft = findLeftmostBlock(otherGroup.blocks);
              
              const rect1 = draggingRight.getBoundingClientRect();
              const rect2 = otherLeft.getBoundingClientRect();
              
              const distance = Math.abs(rect1.right - rect2.left);
              
              if (distance < minDistance && hasVerticalOverlap(rect1, rect2)) {
                closestGroup = otherGroup;
                minDistance = distance;
              }
            }
          });
          
          // אם נמצאה קבוצה קרובה
          if (closestGroup) {
            // הדגש את החיבור הפוטנציאלי
            const draggingRight = findRightmostBlock(draggingGroup.blocks);
            const closestLeft = findLeftmostBlock(closestGroup.blocks);
            
            highlightConnection(draggingRight, closestLeft);
            
            // שמור את הקבוצות לחיבור
            draggedGroup = draggingGroup;
            potentialTarget = closestGroup;
            
            log(`זוהה חיבור פוטנציאלי: ${draggingGroup.id} -> ${closestGroup.id}, מרחק: ${minDistance.toFixed(1)}px`);
            return;
          }
        }
      }
    }
    
    // אם לא נמצא חיבור פוטנציאלי
    if (connectionPoints.length > 0) {
      clearConnectionPoints();
    }
  }

  // === דריסת פונקציות מקוריות ===
  function overrideOriginalFunctions() {
    // אם מודול הגרירה קיים
    if (window.groupDragApi) {
      log("דורס פונקציות גרירת קבוצות");
      
      // שמירת פונקציות מקוריות
      if (typeof window.groupDragApi.moveDragGroup === 'function') {
        originals.moveDragGroup = window.groupDragApi.moveDragGroup;
        
        // החלפת פונקציית תזוזת גרירה
        window.groupDragApi.moveDragGroup = function(event) {
          // הפעל את הפונקציה המקורית
          const result = originals.moveDragGroup.apply(this, arguments);
          
          // בדוק חיבורים פוטנציאליים
          checkPotentialConnections();
          
          return result;
        };
      }
      
      // החלפת פונקציית סיום גרירה
      if (typeof window.groupDragApi.endDragGroup === 'function') {
        originals.endDragGroup = window.groupDragApi.endDragGroup;
        
        window.groupDragApi.endDragGroup = function(event) {
          // בדוק אם יש חיבור פוטנציאלי
          const hasConnection = draggedGroup && potentialTarget;
          
          // הפעל את הפונקציה המקורית
          const result = originals.endDragGroup.apply(this, arguments);
          
          // אם יש חיבור פוטנציאלי, בצע אותו
          if (hasConnection) {
            // חבר את הקבוצות
            connectGroups(draggedGroup, potentialTarget);
            
            // איפוס משתנים
            draggedGroup = null;
            potentialTarget = null;
          } else {
            // נקה נקודות חיבור
            clearConnectionPoints();
          }
          
          return result;
        };
      }
    }
    
    // אם פונקציית החיבור המקורית קיימת
    if (typeof window.performBlockSnap === 'function') {
      originals.performBlockSnap = window.performBlockSnap;
      
      // החלפת פונקציית חיבור בלוקים
      window.performBlockSnap = function(sourceBlock, targetBlock, direction) {
        // הפעל את הפונקציה המקורית
        const result = originals.performBlockSnap.apply(this, arguments);
        
        if (result) {
          log(`בוצע חיבור בלוקים: ${sourceBlock.id} -> ${targetBlock.id}`);
          
          // בדוק אם צריך לעדכן קבוצות
          setTimeout(() => {
            activeGroups = findAllGroups();
          }, 200);
        }
        
        return result;
      };
    }
  }
  
  // === אתחול ===
  function initialize() {
    log("מאתחל מודול חיבור קבוצות משופר");
    
    // הזרקת סגנונות
    injectStyles();
    
    // יצירת שכבת חיבור
    createConnectionLayer();
    
    // דריסת פונקציות מקוריות
    overrideOriginalFunctions();
    
    // מאזין לאירועי עכבר
    document.addEventListener('mousemove', function(event) {
      // בדוק אם לחצן שמאלי לחוץ
      if (event.buttons === 1) {
        // בדוק חיבורים אפשריים
        checkPotentialConnections();
      }
    }, { passive: true });
    
    // מאזין לשחרור עכבר
    document.addEventListener('mouseup', function() {
      // בדוק אם יש חיבור פוטנציאלי
      if (draggedGroup && potentialTarget) {
        // חבר את הקבוצות
        connectGroups(draggedGroup, potentialTarget);
        
        // איפוס משתנים
        draggedGroup = null;
        potentialTarget = null;
      } else {
        // נקה נקודות חיבור
        clearConnectionPoints();
      }
    });
    
    // הגדרת API גלובלי
    window.groupConnectComplete = {
      findAllGroups,
      connectGroups,
      highlightConnection,
      clearConnectionPoints,
      checkPotentialConnections,
      CONFIG
    };
    
    log("אתחול הושלם");
  }
  
  // === ריצה ===
  // הפעל עם טעינת המסמך
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 500));
  } else {
    // הפעל מיד
    setTimeout(initialize, 100);
  }
  
  // הפעל גם אחרי זמן נוסף למקרה של טעינה מאוחרת
  setTimeout(initialize, 1000);
})();
