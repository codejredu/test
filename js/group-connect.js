// ===================================================
// GROUP-CONNECT.JS v2.0.0 (MAXIMALIST OVERRIDE)
// מודול מתוקן לחיבור בין קבוצות בלוקים מחוברים
// יש להוסיף אחרי הקבצים linkageimproved.js ו-linkage-group-drag-simplified.js
// ===================================================

console.log("[ טוען מודול חיבור קבוצות מקסימלי ]");

(() => {
  'use strict';

  // ודא שהחיבור פועל מיד ובאופן אגרסיבי
  // גרסה זו דורסת פונקציות מקוריות באופן ישיר כדי להבטיח תפקוד נכון

  // === משתנים גלובליים ===
  let potentialConnectSource = null;   // מקור חיבור פוטנציאלי
  let potentialConnectTarget = null;   // יעד חיבור פוטנציאלי
  let connectDirection = null;         // כיוון חיבור
  let lastCheckTime = 0;               // זמן בדיקה אחרון
  let activeConnectionPoints = [];     // נקודות חיבור פעילות
  let originalFunctions = {};          // פונקציות מקוריות

  // === הגדרות ===
  const CONFIG = {
    DEBUG: true,                        // האם להדפיס הודעות דיבאג
    THRESHOLD: 150,                     // מרחק לזיהוי חיבור (פיקסלים)
    OVERLAP: 0.05,                      // דרישת חפיפה אנכית מינימלית
    INTERVAL: 5,                        // מרווח בדיקה (מילישניות)
    POINT_SIZE: 24,                     // גודל נקודות חיבור
    HIGHLIGHT_COLOR: '#FF9800',         // צבע הדגשת חיבור
    CONNECTION_LEFT_OFFSET: -9,         // היסט לחיבור שמאלי
    CONNECTION_RIGHT_OFFSET: 9,         // היסט לחיבור ימני
    Z_INDEX: 10000                      // מיקום z של נקודות חיבור
  };

  // === לוגים ===
  function log(message, data) {
    if (CONFIG.DEBUG) {
      console.log(`[GroupConnectMax] ${message}`, data || '');
    }
  }

  // === סגנונות ===
  function injectStyles() {
    // הסר סגנונות קודמים אם קיימים
    const existingStyles = document.getElementById('group-connect-max-styles');
    if (existingStyles) existingStyles.remove();

    // יצירת אלמנט סגנון חדש
    const style = document.createElement('style');
    style.id = 'group-connect-max-styles';
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
        animation: gcPulse 0.5s infinite alternate !important;
        opacity: 1 !important;
      }

      /* אנימציה לעיגולים */
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

      /* הדגשת בלוקים בחיבור */
      .gc-highlight {
        box-shadow: 0 0 12px ${CONFIG.HIGHLIGHT_COLOR} !important;
        z-index: 1001 !important;
      }

      /* סימון הצלחת חיבור */
      .gc-connection-success {
        box-shadow: 0 0 15px #4CAF50 !important;
        animation: gcSuccess 0.6s !important;
      }

      @keyframes gcSuccess {
        0% { box-shadow: 0 0 5px #4CAF50; }
        50% { box-shadow: 0 0 25px #4CAF50; }
        100% { box-shadow: 0 0 5px #4CAF50; }
      }

      /* שכבת חיבור עליונה */
      #gc-connection-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: ${CONFIG.Z_INDEX - 1};
      }
    `;

    // הוספת הסגנון למסמך
    document.head.appendChild(style);
    log('סגנונות הוזרקו למסמך');
  }

  // === אתחול שכבת חיבור ===
  function createConnectionLayer() {
    // בדוק אם כבר קיימת שכבה
    if (document.getElementById('gc-connection-layer')) return;

    // מצא את אזור התכנות
    const programArea = document.getElementById('program-blocks');
    if (!programArea) {
      log('אזור התכנות לא נמצא, לא ניתן ליצור שכבת חיבור');
      return;
    }

    // יצירת שכבת חיבור
    const layer = document.createElement('div');
    layer.id = 'gc-connection-layer';
    programArea.appendChild(layer);
    log('שכבת חיבור נוצרה');
  }

  // === נקודות חיבור ===
  function createConnectionPoint(parent, position, id) {
    try {
      // מצא שכבת חיבור, אם אין - צור אותה
      let connectionLayer = document.getElementById('gc-connection-layer');
      if (!connectionLayer) {
        createConnectionLayer();
        connectionLayer = document.getElementById('gc-connection-layer');
      }

      // קבע מיכל להוספת נקודת החיבור
      const container = connectionLayer || parent;

      // יצירת נקודת חיבור
      const point = document.createElement('div');
      point.className = `gc-connection-point gc-point-${position}`;
      point.id = id || `gc-point-${position}-${Date.now()}`;

      // אם משתמשים בשכבת חיבור, חשב מיקום מדויק
      if (connectionLayer) {
        const parentRect = parent.getBoundingClientRect();
        const layerRect = connectionLayer.getBoundingClientRect();
        const topOffset = parentRect.top - layerRect.top + connectionLayer.scrollTop;

        if (position === 'right') {
          point.style.top = `${topOffset + parentRect.height/2}px`;
          point.style.left = `${parentRect.right - layerRect.left - Math.floor(CONFIG.POINT_SIZE/2) + connectionLayer.scrollLeft}px`;
        } else {
          point.style.top = `${topOffset + parentRect.height/2}px`;
          point.style.left = `${parentRect.left - layerRect.left - Math.floor(CONFIG.POINT_SIZE/2) + connectionLayer.scrollLeft}px`;
        }
      }

      // הוסף את הנקודה למיכל
      container.appendChild(point);

      // שמור במערך הנקודות הפעילות
      activeConnectionPoints.push({
        element: point,
        parent: parent,
        position: position
      });

      return point;
    } catch (error) {
      console.error('[GroupConnectMax] שגיאה ביצירת נקודת חיבור:', error);
      return null;
    }
  }

  // === ניקוי נקודות חיבור ===
  function clearConnectionPoints() {
    // הסר את כל נקודות החיבור
    document.querySelectorAll('.gc-connection-point').forEach(point => point.remove());
    
    // נקה את מערך הנקודות הפעילות
    activeConnectionPoints = [];
    
    // הסר הדגשות מבלוקים
    document.querySelectorAll('.gc-highlight').forEach(block => {
      block.classList.remove('gc-highlight');
    });
  }

  // === הדגשת חיבור אפשרי ===
  function highlightPotentialConnection(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock) return;
    
    try {
      // נקה הדגשות קודמות
      clearConnectionPoints();
      
      // הוסף הדגשה לבלוקים
      sourceBlock.classList.add('gc-highlight');
      targetBlock.classList.add('gc-highlight');
      
      // יצירת נקודות חיבור לפי הכיוון
      if (direction === 'right') {
        createConnectionPoint(sourceBlock, 'right', 'gc-source-point');
        createConnectionPoint(targetBlock, 'left', 'gc-target-point');
      } else {
        createConnectionPoint(sourceBlock, 'left', 'gc-source-point');
        createConnectionPoint(targetBlock, 'right', 'gc-target-point');
      }
      
      // הגדר משתנים גלובליים
      potentialConnectSource = sourceBlock;
      potentialConnectTarget = targetBlock;
      connectDirection = direction;
      
      log(`הדגשת חיבור פוטנציאלי: ${direction} | ${sourceBlock.id} -> ${targetBlock.id}`);
    } catch (error) {
      console.error('[GroupConnectMax] שגיאה בהדגשת חיבור:', error);
    }
  }

  // === בדיקת חפיפה אנכית ===
  function hasVerticalOverlap(rect1, rect2) {
    if (!rect1 || !rect2) return false;
    
    // חישוב החפיפה
    const topOverlap = Math.max(rect1.top, rect2.top);
    const bottomOverlap = Math.min(rect1.bottom, rect2.bottom);
    const overlapHeight = bottomOverlap - topOverlap;
    
    // אין חפיפה כלל
    if (overlapHeight <= 0) return false;
    
    // חפיפה מספקת?
    const minHeight = Math.min(rect1.height, rect2.height);
    return (overlapHeight / minHeight) >= CONFIG.OVERLAP;
  }

  // === מציאת בלוק קיצוני בקבוצה ===
  function findExtremeBlock(blocks, direction) {
    if (!blocks || blocks.length === 0) return null;
    
    // מקרה בסיסי - רק בלוק אחד
    if (blocks.length === 1) return blocks[0];
    
    // חיפוש הבלוק הקיצוני
    let extremeBlock = blocks[0];
    let extremeValue = direction === 'right' ? 
      extremeBlock.getBoundingClientRect().right : 
      extremeBlock.getBoundingClientRect().left;
    
    // עבור על כל הבלוקים ומצא את הקיצוני
    for (let i = 1; i < blocks.length; i++) {
      const value = direction === 'right' ? 
        blocks[i].getBoundingClientRect().right : 
        blocks[i].getBoundingClientRect().left;
      
      if ((direction === 'right' && value > extremeValue) || 
          (direction === 'left' && value < extremeValue)) {
        extremeValue = value;
        extremeBlock = blocks[i];
      }
    }
    
    return extremeBlock;
  }

  // === בדיקה אם בלוק יכול להתחבר בכיוון ===
  function canConnect(block, direction) {
    if (!block) return false;
    
    if (direction === 'left') {
      // בדוק אם הבלוק כבר מחובר משמאל
      return !block.hasAttribute('data-connected-from-left') || 
             block.getAttribute('data-connected-from-left') === "";
    } else {
      // בדוק אם הבלוק כבר מחובר מימין
      return !block.hasAttribute('data-connected-from-right') || 
             block.getAttribute('data-connected-from-right') === "";
    }
  }

  // === בדיקת אפשרויות חיבור בזמן גרירה ===
  function checkConnectionOpportunities(event) {
    const now = Date.now();
    if (now - lastCheckTime < CONFIG.INTERVAL) return;
    lastCheckTime = now;
    
    // מצא בלוקים בגרירה
    const draggingBlocks = document.querySelectorAll('.group-dragging');
    if (draggingBlocks.length === 0) {
      clearConnectionPoints();
      return;
    }
    
    // המר לרשימה רגילה
    const draggedGroup = Array.from(draggingBlocks);
    
    // מצא בלוקים קיצוניים בקבוצה
    const rightmostBlock = findExtremeBlock(draggedGroup, 'right');
    const leftmostBlock = findExtremeBlock(draggedGroup, 'left');
    
    if (!rightmostBlock || !leftmostBlock) {
      clearConnectionPoints();
      return;
    }
    
    // קבל מלבני המיקום של הבלוקים הקיצוניים
    const rightRect = rightmostBlock.getBoundingClientRect();
    const leftRect = leftmostBlock.getBoundingClientRect();
    
    // מצא את אזור התכנות
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    
    // מצא את כל הבלוקים שאינם בקבוצה הנגררת
    const allBlocks = programArea.querySelectorAll('.block-container');
    const otherBlocks = Array.from(allBlocks).filter(block => !draggedGroup.includes(block));
    
    // בדוק אם כבר יש חיבור פוטנציאלי
    if (potentialConnectSource && potentialConnectTarget) {
      const sourceRect = potentialConnectSource.getBoundingClientRect();
      const targetRect = potentialConnectTarget.getBoundingClientRect();
      
      // בדוק אם עדיין קרוב מספיק
      if (connectDirection === 'right') {
        const distance = Math.abs(sourceRect.right - targetRect.left);
        if (distance <= CONFIG.THRESHOLD && hasVerticalOverlap(sourceRect, targetRect)) {
          return; // עדיין בטווח חיבור, אין צורך לעדכן
        }
      } else {
        const distance = Math.abs(sourceRect.left - targetRect.right);
        if (distance <= CONFIG.THRESHOLD && hasVerticalOverlap(sourceRect, targetRect)) {
          return; // עדיין בטווח חיבור, אין צורך לעדכן
        }
      }
    }
    
    // נקה חיבורים קודמים
    clearConnectionPoints();
    potentialConnectSource = null;
    potentialConnectTarget = null;
    connectDirection = null;
    
    // זהה קבוצות אחרות
    const otherGroups = [];
    const processedIds = new Set();
    
    // פונקציית מציאת קבוצה
    const findConnectedGroup = (startBlock) => {
      if (processedIds.has(startBlock.id)) return [];
      
      // מצא את כל הבלוקים המחוברים
      let result = [startBlock];
      processedIds.add(startBlock.id);
      
      // תור לסריקה
      const queue = [startBlock];
      
      while (queue.length > 0) {
        const current = queue.shift();
        
        // בדוק חיבורים בכל הכיוונים
        const connections = new Set();
        
        // חיבור לבלוק מימין
        if (current.hasAttribute('data-connected-to')) {
          connections.add(current.getAttribute('data-connected-to'));
        }
        
        // חיבור מבלוק משמאל
        if (current.hasAttribute('data-connected-from-left')) {
          connections.add(current.getAttribute('data-connected-from-left'));
        }
        
        // חיבור מבלוק מימין
        if (current.hasAttribute('data-connected-from-right')) {
          connections.add(current.getAttribute('data-connected-from-right'));
        }
        
        // בדוק בלוקים המחוברים לבלוק הנוכחי
        document.querySelectorAll(`[data-connected-to="${current.id}"]`).forEach(block => {
          connections.add(block.id);
        });
        
        // הוסף בלוקים לתור
        for (const id of connections) {
          if (!processedIds.has(id)) {
            const block = document.getElementById(id);
            if (block) {
              result.push(block);
              processedIds.add(id);
              queue.push(block);
            }
          }
        }
      }
      
      return result;
    };
    
    // זהה את כל הקבוצות האחרות
    for (const block of otherBlocks) {
      if (!processedIds.has(block.id)) {
        const group = findConnectedGroup(block);
        if (group.length > 0) {
          otherGroups.push(group);
        }
      }
    }
    
    // בדוק אפשרויות חיבור עם כל קבוצה
    let bestRightConnection = null;
    let bestLeftConnection = null;
    let minRightDistance = CONFIG.THRESHOLD;
    let minLeftDistance = CONFIG.THRESHOLD;
    
    for (const group of otherGroups) {
      // בדוק חיבור ימין-שמאל
      const groupLeftmost = findExtremeBlock(group, 'left');
      if (groupLeftmost && canConnect(groupLeftmost, 'left')) {
        const leftmostRect = groupLeftmost.getBoundingClientRect();
        const distance = Math.abs(rightRect.right - leftmostRect.left);
        
        if (distance <= minRightDistance && hasVerticalOverlap(rightRect, leftmostRect)) {
          bestRightConnection = {
            source: rightmostBlock,
            target: groupLeftmost,
            distance: distance
          };
          minRightDistance = distance;
        }
      }
      
      // בדוק חיבור שמאל-ימין
      const groupRightmost = findExtremeBlock(group, 'right');
      if (groupRightmost && canConnect(groupRightmost, 'right')) {
        const rightmostRect = groupRightmost.getBoundingClientRect();
        const distance = Math.abs(leftRect.left - rightmostRect.right);
        
        if (distance <= minLeftDistance && hasVerticalOverlap(leftRect, rightmostRect)) {
          bestLeftConnection = {
            source: leftmostBlock,
            target: groupRightmost,
            distance: distance
          };
          minLeftDistance = distance;
        }
      }
    }
    
    // בחר את החיבור הטוב ביותר
    if (bestRightConnection && bestLeftConnection) {
      // בחר את הקרוב ביותר
      if (bestRightConnection.distance <= bestLeftConnection.distance) {
        highlightPotentialConnection(bestRightConnection.source, bestRightConnection.target, 'right');
      } else {
        highlightPotentialConnection(bestLeftConnection.source, bestLeftConnection.target, 'left');
      }
    } else if (bestRightConnection) {
      highlightPotentialConnection(bestRightConnection.source, bestRightConnection.target, 'right');
    } else if (bestLeftConnection) {
      highlightPotentialConnection(bestLeftConnection.source, bestLeftConnection.target, 'left');
    }
  }

  // === עדכון חיבור בין בלוקים ===
  function updateBlockConnection(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock) return false;
    
    try {
      if (direction === 'right') {
        // חיבור מימין לשמאל
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', 'left');
        targetBlock.setAttribute('data-connected-from-left', sourceBlock.id);
      } else {
        // חיבור משמאל לימין
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', 'right');
        targetBlock.setAttribute('data-connected-from-right', sourceBlock.id);
      }
      
      // סימון הבלוקים כמחוברים
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      
      // סימון הצלחת חיבור
      sourceBlock.classList.add('gc-connection-success');
      targetBlock.classList.add('gc-connection-success');
      
      // הסרת סימון הצלחה אחרי זמן מה
      setTimeout(() => {
        if (document.body.contains(sourceBlock)) {
          sourceBlock.classList.remove('gc-connection-success');
        }
        if (document.body.contains(targetBlock)) {
          targetBlock.classList.remove('gc-connection-success');
        }
      }, 800);
      
      // הסרת מסגרות אם יש פונקציה מתאימה
      if (typeof window.removeOutlinesFromConnected === 'function') {
        setTimeout(() => {
          window.removeOutlinesFromConnected(sourceBlock);
          window.removeOutlinesFromConnected(targetBlock);
        }, 100);
      } else {
        // פתרון חלופי
        sourceBlock.classList.add('no-outlines');
        targetBlock.classList.add('no-outlines');
      }
      
      return true;
    } catch (error) {
      console.error('[GroupConnectMax] שגיאה בעדכון חיבור:', error);
      return false;
    }
  }

  // === ביצוע חיבור בין בלוקים ===
  function performConnection() {
    if (!potentialConnectSource || !potentialConnectTarget || !connectDirection) {
      return false;
    }
    
    try {
      const sourceBlock = potentialConnectSource;
      const targetBlock = potentialConnectTarget;
      const direction = connectDirection;
      
      // התאמת מיקום הבלוק המקור
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const programArea = document.getElementById('program-blocks');
      
      if (programArea) {
        const areaRect = programArea.getBoundingClientRect();
        
        // חישוב מיקום חדש
        let newLeft, newTop;
        
        if (direction === 'right') {
          // חיבור ימין-שמאל
          newLeft = targetRect.left - sourceRect.width + CONFIG.CONNECTION_LEFT_OFFSET;
        } else {
          // חיבור שמאל-ימין
          newLeft = targetRect.right + CONFIG.CONNECTION_RIGHT_OFFSET;
        }
        newTop = targetRect.top;
        
        // התאמה יחסית לאזור התכנות
        const finalLeft = Math.round(newLeft - areaRect.left + programArea.scrollLeft);
        const finalTop = Math.round(newTop - areaRect.top + programArea.scrollTop);
        
        // הזזת הבלוק למיקום החדש
        sourceBlock.style.position = 'absolute';
        sourceBlock.style.left = `${finalLeft}px`;
        sourceBlock.style.top = `${finalTop}px`;
        sourceBlock.style.margin = '0';
      }
      
      // עדכון החיבור בין הבלוקים
      const result = updateBlockConnection(sourceBlock, targetBlock, direction);
      
      // נקה סימונים
      clearConnectionPoints();
      
      // איפוס משתנים גלובליים
      potentialConnectSource = null;
      potentialConnectTarget = null;
      connectDirection = null;
      
      // השמע צליל חיבור אם זמין
      if (result && typeof window.playSnapSound === 'function') {
        window.playSnapSound();
      }
      
      // עדכון רשימת קבוצות אם יש פונקציה מתאימה
      if (typeof window.groupDragApi?.scanAndMarkLeaders === 'function') {
        setTimeout(window.groupDragApi.scanAndMarkLeaders, 300);
      }
      
      return result;
    } catch (error) {
      console.error('[GroupConnectMax] שגיאה בביצוע חיבור:', error);
      clearConnectionPoints();
      return false;
    }
  }

  // === שינוי פעולת הגרירה של מודול גרירת קבוצות ===
  function overrideGroupDragFunctions() {
    // בדיקה אם מודול גרירת קבוצות קיים
    if (typeof window.groupDragApi === 'undefined') {
      log('מודול גרירת קבוצות לא נמצא, לא ניתן לדרוס פונקציות');
      return;
    }
    
    log('מתחיל דריסת פונקציות גרירת קבוצות');
    
    // שמירת פונקציות מקוריות
    originalFunctions.startDragGroup = window.groupDragApi.startDragGroup;
    originalFunctions.moveDragGroup = window.groupDragApi.moveDragGroup;
    originalFunctions.endDragGroup = window.groupDragApi.endDragGroup;
    
    // דריסת פונקציית התחלת גרירה
    if (typeof originalFunctions.startDragGroup === 'function') {
      window.groupDragApi.startDragGroup = function(groupBlocks, event) {
        // הפעל את הפונקציה המקורית
        const result = originalFunctions.startDragGroup.apply(this, arguments);
        log(`התחלת גרירת קבוצה: ${groupBlocks.length} בלוקים`);
        return result;
      };
    }
    
    // דריסת פונקציית תזוזת גרירה
    if (typeof originalFunctions.moveDragGroup === 'function') {
      window.groupDragApi.moveDragGroup = function(event) {
        // הפעל את הפונקציה המקורית
        const result = originalFunctions.moveDragGroup.apply(this, arguments);
        
        // בדוק אפשרויות חיבור
        checkConnectionOpportunities(event);
        
        return result;
      };
    }
    
    // דריסת פונקציית סיום גרירה
    if (typeof originalFunctions.endDragGroup === 'function') {
      window.groupDragApi.endDragGroup = function(event) {
        // בדוק אם יש חיבור פוטנציאלי
        const hasConnection = potentialConnectSource && potentialConnectTarget;
        
        // הפעל את הפונקציה המקורית
        const result = originalFunctions.endDragGroup.apply(this, arguments);
        
        // בצע חיבור אם יש אפשרות
        if (hasConnection) {
          log('סיום גרירה עם חיבור פוטנציאלי, מבצע חיבור');
          performConnection();
        }
        
        return result;
      };
    }
    
    log('פונקציות גרירת קבוצות נדרסו בהצלחה');
  }

  // === מאזיני אירועים ===
  function setupEventListeners() {
    // מאזין לתזוזת עכבר
    document.addEventListener('mousemove', event => {
      // בדוק אם לחצן שמאלי לחוץ
      if (event.buttons !== 1) return;
      
      // בדוק אפשרויות חיבור
      checkConnectionOpportunities(event);
    }, { passive: true });
    
    // מאזין לשחרור עכבר
    document.addEventListener('mouseup', event => {
      // בדוק אם יש חיבור פוטנציאלי ובצע אותו
      if (potentialConnectSource && potentialConnectTarget) {
        performConnection();
      } else {
        clearConnectionPoints();
      }
    });
    
    // מאזין לתזוזת מגע
    document.addEventListener('touchmove', event => {
      if (event.touches.length !== 1) return;
      
      // בדוק אפשרויות חיבור
      checkConnectionOpportunities(event);
    }, { passive: true });
    
    // מאזין לסיום מגע
    document.addEventListener('touchend', event => {
      // בדוק אם יש חיבור פוטנציאלי ובצע אותו
      if (potentialConnectSource && potentialConnectTarget) {
        performConnection();
      } else {
        clearConnectionPoints();
      }
    });
    
    log('מאזיני אירועים הוגדרו בהצלחה');
  }

  // === אתחול המודול ===
  function initializeModule() {
    // בדוק אם כבר אותחל
    if (window.groupConnectMaxInitialized) {
      log('המודול כבר אותחל, מדלג');
      return;
    }
    
    log('מתחיל אתחול מודול חיבור קבוצות מקסימלי');
    
    // הזרקת סגנונות
    injectStyles();
    
    // יצירת שכבת חיבור
    createConnectionLayer();
    
    // הגדרת מאזיני אירועים
    setupEventListeners();
    
    // דריסת פונקציות גרירת קבוצות
    overrideGroupDragFunctions();
    
    // הגדרת API
    window.groupConnectMax = {
      // פונקציות יסוד
      highlightConnection: highlightPotentialConnection,
      clearConnections: clearConnectionPoints,
      performConnection: performConnection,
      
      // הגדרות
      config: CONFIG,
      
      // פונקציית בדיקה מפורשת
      checkForConnections: checkConnectionOpportunities,
      
      // פונקציית תיקון
      repairConnections: () => {
        log('מתקן חיבורים שבורים');
        let fixCount = 0;
        
        // מצא את כל הבלוקים
        const blocks = document.querySelectorAll('.block-container');
        
        // בדוק כל בלוק
        Array.from(blocks).forEach(block => {
          // תיקון חיבורים מהבלוק לבלוקים אחרים
          if (block.hasAttribute('data-connected-to')) {
            const targetId = block.getAttribute('data-connected-to');
            const targetBlock = document.getElementById(targetId);
            
            if (targetBlock) {
              const direction = block.getAttribute('data-connection-direction');
              
              if (direction === 'left') {
                // וודא שיש סימון הדדי
                if (!targetBlock.hasAttribute('data-connected-from-left') || 
                    targetBlock.getAttribute('data-connected-from-left') !== block.id) {
                  targetBlock.setAttribute('data-connected-from-left', block.id);
                  fixCount++;
                }
              } else if (direction === 'right') {
                // וודא שיש סימון הדדי
                if (!targetBlock.hasAttribute('data-connected-from-right') || 
                    targetBlock.getAttribute('data-connected-from-right') !== block.id) {
                  targetBlock.setAttribute('data-connected-from-right', block.id);
                  fixCount++;
                }
              }
            }
          }
        });
        
        log(`תיקון חיבורים הסתיים, תוקנו ${fixCount} חיבורים`);
        return fixCount;
      }
    };
    
    // סימון שהמודול אותחל
    window.groupConnectMaxInitialized = true;
    
    log('אתחול מודול חיבור קבוצות מקסימלי הושלם בהצלחה');
    
    // תיקון חיבורים קיימים
    setTimeout(() => {
      window.groupConnectMax.repairConnections();
    }, 1000);
  }

  // === הפעלת המודול ===
  
  // הפעלה מיידית אם המסמך כבר נטען
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeModule, 0);
  } else {
    // הפעלה כאשר המסמך נטען
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeModule, 0);
    });
  }
  
  // הפעלה נוספת אחרי 1 שנייה למקרה שמשהו השתבש
  setTimeout(initializeModule, 1000);
  
  // הפעלה נוספת אחרי 3 שניות למקרה של טעינה מאוחרת
  setTimeout(initializeModule, 3000);
})();
