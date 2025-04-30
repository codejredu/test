// --- GROUP-CONNECT-EXTENSION.JS v1.0.0 ---
// הרחבה המאפשרת חיבור בין קבוצות בלוקים

(function() {
  'use strict';
  
  // קונפיגורציה
  const config = {
    debug: true,
    connectThreshold: 40,      // מרחק בפיקסלים לזיהוי אפשרות חיבור
    highlightColor: '#FF9800', // צבע הדגשה לחיבור אפשרי
    animationDuration: 300     // משך אנימציה במילישניות
  };
  
  // משתנים גלובליים
  let isDraggingGroup = false;        // האם גוררים קבוצה כרגע
  let draggedGroup = [];              // הקבוצה שנגררת
  let potentialTarget = null;         // בלוק מטרה לחיבור פוטנציאלי
  let potentialConnectSide = null;    // לאיזה צד של המטרה מתחברים
  let originalPositions = [];         // מיקומים מקוריים של הבלוקים בקבוצה
  
  // פונקציות עזר
  
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
  
  // בדיקת אפשרות חיבור בין קבוצות
  function checkGroupConnection(movedGroup) {
    // נקה חיווי קודם
    clearConnectionHighlight();
    
    // בלוק המטרה האפשרי
    potentialTarget = null;
    potentialConnectSide = null;
    
    if (!movedGroup || movedGroup.length === 0) return false;
    
    // מצא את הבלוקים הימני והשמאלי ביותר בקבוצה שמזיזים
    const rightmostBlock = findRightmostBlock(movedGroup);
    const leftmostBlock = findLeftmostBlock(movedGroup);
    
    if (!rightmostBlock || !leftmostBlock) return false;
    
    // קבל את המיקום של הבלוקים הקיצוניים
    const rightRect = rightmostBlock.getBoundingClientRect();
    const leftRect = leftmostBlock.getBoundingClientRect();
    
    // מצא בלוקים שאינם בקבוצה הנוכחית
    const allBlocks = document.querySelectorAll('#program-blocks .block-container');
    const otherBlocks = Array.from(allBlocks).filter(block => !movedGroup.includes(block));
    
    // בדוק אם אפשר להתחבר לבלוק כלשהו
    for (const block of otherBlocks) {
      const blockRect = block.getBoundingClientRect();
      
      // בדוק חיבור לצד ימין של הקבוצה הנגררת
      if (!block.hasAttribute('data-connected-from-left')) {
        const distanceLeft = Math.abs(rightRect.right - blockRect.left);
        if (distanceLeft <= config.connectThreshold) {
          const verticalOverlap = checkVerticalOverlap(rightRect, blockRect);
          if (verticalOverlap) {
            potentialTarget = block;
            potentialConnectSide = 'right';
            highlightConnection(rightmostBlock, block, 'right');
            return true;
          }
        }
      }
      
      // בדוק חיבור לצד שמאל של הקבוצה הנגררת
      if (!block.hasAttribute('data-connected-from-right')) {
        const distanceRight = Math.abs(leftRect.left - blockRect.right);
        if (distanceRight <= config.connectThreshold) {
          const verticalOverlap = checkVerticalOverlap(leftRect, blockRect);
          if (verticalOverlap) {
            potentialTarget = block;
            potentialConnectSide = 'left';
            highlightConnection(leftmostBlock, block, 'left');
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  // בדיקת חפיפה אנכית בין שני בלוקים
  function checkVerticalOverlap(rect1, rect2) {
    const topOverlap = Math.max(rect1.top, rect2.top);
    const bottomOverlap = Math.min(rect1.bottom, rect2.bottom);
    const overlapHeight = bottomOverlap - topOverlap;
    
    // חפיפה אנכית מספקת אם היא יותר מ-40% מגובה הבלוק הקטן יותר
    const minHeight = Math.min(rect1.height, rect2.height);
    return overlapHeight > minHeight * 0.4;
  }
  
  // הדגשת חיבור פוטנציאלי
  function highlightConnection(sourceBlock, targetBlock, side) {
    if (!sourceBlock || !targetBlock) return;
    
    // נקה הדגשות קודמות
    clearConnectionHighlight();
    
    // הוסף סגנון אם עוד לא קיים
    if (!document.getElementById('group-connection-style')) {
      const style = document.createElement('style');
      style.id = 'group-connection-style';
      style.textContent = `
        .connection-point {
          position: absolute;
          width: 16px;
          height: 16px;
          background-color: ${config.highlightColor};
          border-radius: 50%;
          z-index: 2000;
          box-shadow: 0 0 8px ${config.highlightColor};
          pointer-events: none;
          animation: pulse-connect 0.6s infinite alternate;
        }
        
        @keyframes pulse-connect {
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
          box-shadow: 0 0 8px ${config.highlightColor};
          z-index: 1001;
        }
      `;
      document.head.appendChild(style);
    }
    
    // הוסף נקודות חיבור לבלוקים
    if (side === 'right') {
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
  
  // ניקוי הדגשות חיבור
  function clearConnectionHighlight() {
    // הסר את נקודות החיבור
    document.querySelectorAll('.connection-point').forEach(point => point.remove());
    
    // הסר את הדגשת הבלוקים
    document.querySelectorAll('.potential-connect').forEach(block => {
      block.classList.remove('potential-connect');
    });
  }
  
  // חבר קבוצה הנגררת לבלוק יעד
  function connectGroups() {
    if (!potentialTarget || !potentialConnectSide || draggedGroup.length === 0) {
      return false;
    }
    
    let sourceBlock, targetBlock;
    
    if (potentialConnectSide === 'right') {
      // הקבוצה הנגררת מתחברת מימין
      sourceBlock = findRightmostBlock(draggedGroup);
      targetBlock = potentialTarget;
    } else {
      // הקבוצה הנגררת מתחברת משמאל
      sourceBlock = findLeftmostBlock(draggedGroup);
      targetBlock = potentialTarget;
    }
    
    if (!sourceBlock || !targetBlock) {
      log('חיבור קבוצות נכשל - לא ניתן לזהות בלוק מקור או יעד');
      return false;
    }
    
    try {
      // בצע חיבור באמצעות פונקציות המודול המקורי
      if (typeof window.performBlockSnap === 'function') {
        // אם הפונקציה חשופה, השתמש בה ישירות
        window.performBlockSnap(sourceBlock, targetBlock, potentialConnectSide);
        log(`חיבור באמצעות API גלוי: ${sourceBlock.id} -> ${targetBlock.id} (${potentialConnectSide})`);
      } else {
        // אחרת, נסה לדמות אירוע mouseup מעל בלוק היעד
        simulateSnapEvent(sourceBlock, targetBlock, potentialConnectSide);
        log(`חיבור באמצעות הדמיית אירוע: ${sourceBlock.id} -> ${targetBlock.id} (${potentialConnectSide})`);
      }
      
      // השמע צליל אם יש פונקציה זמינה
      if (typeof window.playSnapSound === 'function') {
        window.playSnapSound();
      }
      
      // הוסף אנימציית חיבור
      addSnapEffectAnimation(sourceBlock);
      
      // נקה הדגשות
      clearConnectionHighlight();
      
      return true;
    } catch (err) {
      console.error('[GroupConnect] שגיאה בחיבור קבוצות:', err);
      return false;
    }
  }
  
  // הדמיית אירוע חיבור - גישה חלופית אם אין API ישיר
  function simulateSnapEvent(sourceBlock, targetBlock, direction) {
    // בצע חיבור ידני
    if (direction === 'right') {
      // הוסף את היחס בין הבלוקים - הבלוק השמאלי מתחבר לימני
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', 'left');
      targetBlock.setAttribute('data-connected-from-left', sourceBlock.id);
    } else {
      // הוסף את היחס בין הבלוקים - הבלוק הימני מתחבר לשמאלי
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
      // חבר את הצד הימני של המקור לצד שמאלי של היעד
      newLeft = targetRect.left - sourceRect.width + 9; // התאמה לפי ערכי הסטה של המודול המקורי
      newTop = targetRect.top;
    } else {
      // חבר את הצד השמאלי של המקור לצד ימני של היעד
      newLeft = targetRect.right - 9; // התאמה לפי ערכי הסטה של המודול המקורי
      newTop = targetRect.top;
    }
    
    // התאם למיקום יחסי לאזור התכנות
    sourceBlock.style.position = 'absolute';
    sourceBlock.style.left = `${newLeft - areaRect.left + programArea.scrollLeft}px`;
    sourceBlock.style.top = `${newTop - areaRect.top + programArea.scrollTop}px`;
    sourceBlock.style.margin = '0';
    
    // סמן את הבלוקים כמחוברים
    sourceBlock.classList.add('connected-block');
    targetBlock.classList.add('has-connected-block');
    
    // ייתכן ונדרש גם לטפל במסגרות
    sourceBlock.classList.add('no-outlines');
    targetBlock.classList.add('no-outlines');
  }
  
  // אנימציית חיבור
  function addSnapEffectAnimation(block) {
    if (!block) return;
    
    block.classList.remove('snap-animation');
    void block.offsetWidth; // אתחול מחדש של האנימציה
    block.classList.add('snap-animation');
    
    // הסר את המחלקה בסיום האנימציה
    setTimeout(() => {
      block.classList.remove('snap-animation');
    }, config.animationDuration);
  }
  
  // מציאת הבלוק הימני ביותר בקבוצה
  function findRightmostBlock(blocks) {
    if (!blocks || blocks.length === 0) return null;
    
    return blocks.reduce((rightmost, block) => {
      const currentRight = block.getBoundingClientRect().right;
      const rightmostRight = rightmost.getBoundingClientRect().right;
      return currentRight > rightmostRight ? block : rightmost;
    }, blocks[0]);
  }
  
  // מציאת הבלוק השמאלי ביותר בקבוצה
  function findLeftmostBlock(blocks) {
    if (!blocks || blocks.length === 0) return null;
    
    return blocks.reduce((leftmost, block) => {
      const currentLeft = block.getBoundingClientRect().left;
      const leftmostLeft = leftmost.getBoundingClientRect().left;
      return currentLeft < leftmostLeft ? block : leftmost;
    }, blocks[0]);
  }
  
  // התאמה לאירועי גרירת קבוצה
  function overrideGroupDragEvents() {
    // שמור גישה למודול גרירת הקבוצות
    try {
      // בדוק אם יש גישה למשתנים או פונקציות של המודול הקודם
      if (typeof window.handleGroupMouseMove === 'function') {
        const originalMouseMove = window.handleGroupMouseMove;
        window.handleGroupMouseMove = function(e) {
          // קרא לפונקציה המקורית
          originalMouseMove.call(this, e);
          
          // בדוק אם יש אפשרות חיבור אם גוררים קבוצה
          if (isDraggingGroup && draggedGroup.length > 0) {
            checkGroupConnection(draggedGroup);
          }
        };
        log('הוחלפה פונקציית mousemove של גרירת קבוצות');
      }
      
      if (typeof window.handleGroupMouseUp === 'function') {
        const originalMouseUp = window.handleGroupMouseUp;
        window.handleGroupMouseUp = function(e) {
          // אם יש אפשרות חיבור, בצע אותו
          if (isDraggingGroup && potentialTarget) {
            connectGroups();
          }
          
          // נקה את ההדגשות בכל מקרה
          clearConnectionHighlight();
          
          // קרא לפונקציה המקורית
          originalMouseUp.call(this, e);
          
          // איפוס משתנים
          isDraggingGroup = false;
          draggedGroup = [];
          potentialTarget = null;
          potentialConnectSide = null;
        };
        log('הוחלפה פונקציית mouseup של גרירת קבוצות');
      }
    } catch (error) {
      console.error('[GroupConnect] שגיאה בהחלפת אירועי גרירת קבוצות:', error);
    }
  }
  
  // אתחול מאזיני עזר לזיהוי מתי קבוצה נגררת
  function initHelperListeners() {
    // מאזין עזר לזיהוי תחילת גרירת קבוצה
    document.addEventListener('mousedown', (e) => {
      const groupLeaderBlock = e.target.closest('.group-leader');
      if (groupLeaderBlock) {
        setTimeout(() => {
          // בדוק אם התחילה גרירת קבוצה
          if (document.querySelectorAll('.group-dragging').length > 0) {
            isDraggingGroup = true;
            draggedGroup = Array.from(document.querySelectorAll('.group-dragging'));
            log(`זוהתה תחילת גרירת קבוצה: ${draggedGroup.length} בלוקים`);
            
            // שמור את המיקומים המקוריים
            originalPositions = [];
            const programArea = document.getElementById('program-blocks');
            const areaRect = programArea.getBoundingClientRect();
            
            draggedGroup.forEach(block => {
              const rect = block.getBoundingClientRect();
              originalPositions.push({
                id: block.id,
                left: rect.left - areaRect.left + programArea.scrollLeft,
                top: rect.top - areaRect.top + programArea.scrollTop
              });
            });
          }
        }, 10);
      }
    });
    
    // מאזין עזר לזיהוי תנועת העכבר בזמן גרירת קבוצה
    document.addEventListener('mousemove', (e) => {
      if (isDraggingGroup && draggedGroup.length > 0) {
        checkGroupConnection(draggedGroup);
      }
    });
    
    // מאזין עזר לסיום גרירת קבוצה
    document.addEventListener('mouseup', (e) => {
      if (isDraggingGroup) {
        if (potentialTarget) {
          connectGroups();
        }
        
        clearConnectionHighlight();
        isDraggingGroup = false;
        draggedGroup = [];
        potentialTarget = null;
        potentialConnectSide = null;
      }
    });
  }
  
  // אתחול המודול
  function initModule() {
    log('אתחול מודול חיבור קבוצות');
    
    // בדוק אם גרסה קודמת כבר מותקנת
    if (window.groupConnectInitialized) {
      log('מודול חיבור קבוצות כבר הותקן');
      return;
    }
    
    try {
      // חכה לאיתחול של מודול גרירת הקבוצות
      if (typeof window.groupDragInitialized === 'undefined') {
        log('ממתין לאתחול מודול גרירת קבוצות');
        setTimeout(initModule, 500);
        return;
      }
      
      // התאם את פונקציות גרירת הקבוצות (אם אפשר)
      overrideGroupDragEvents();
      
      // אתחל מאזיני עזר
      initHelperListeners();
      
      // סמן שהמודול אותחל
      window.groupConnectInitialized = true;
      log('מודול חיבור קבוצות אותחל בהצלחה');
    } catch (error) {
      console.error('[GroupConnect] שגיאה באתחול מודול חיבור קבוצות:', error);
    }
  }
  
  // הפעל את האתחול כשהדף נטען
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initModule, 1000));
  } else {
    // הדף כבר נטען, אתחל אחרי השהייה קצרה
    setTimeout(initModule, 1000);
  }
  
})();
