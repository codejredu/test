// --- GROUP DRAGGING MODULE ---
// מודול לאפשר גרירת קבוצת בלוקים מחוברים
// להוסיף לאחר הקוד המקורי של linkageimproved.js

(function() {
  // הפונקציה הראשית - מאתחלת את רכיב הגרירה הקבוצתית
  function initGroupDragging() {
    // מוודא שהמודול הראשי של חיבור הבלוקים כבר הותקן
    if (typeof window.blockLinkageInitialized_v3_9_5 === 'undefined') {
      console.warn('BlockLinkage system not yet initialized, waiting...');
      setTimeout(initGroupDragging, 200);
      return;
    }
    
    console.log('Initializing Group Dragging functionality');
    
    // החלף את המאזין למאורע mousedown המקורי עם הגרסה המורחבת שלנו
    overrideMouseDownHandler();
  }
  
  // פונקציה שמחליפה את מאזין ה-mousedown המקורי
  function overrideMouseDownHandler() {
    // זהה את כל הבלוקים בזירת התכנות
    const blocks = document.querySelectorAll('#program-blocks .block-container');
    
    // הסר את מאזין ה-mousedown מכל בלוק ורשום מאזין חדש
    blocks.forEach(block => {
      block.removeEventListener('mousedown', window.handleMouseDown);
      block.addEventListener('mousedown', enhancedMouseDown);
    });
    
    // התקן מאזין התבוננות (observer) שיוסיף את המאזין החדש לבלוקים חדשים
    setupDragObserver();
    
    console.log('Enhanced mousedown handler installed for group dragging');
  }
  
  // פונקציה שמגדירה observer לזיהוי בלוקים חדשים ולהוספת מאזין הגרירה הקבוצתית
  function setupDragObserver() {
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    
    // צור observer שיזהה בלוקים חדשים
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              let block = node.classList?.contains('block-container') ? 
                          node : node.querySelector?.('.block-container');
              
              if (block?.closest('#program-blocks')) {
                // הסר את מאזין הגרירה המקורי והוסף את המאזין המורחב
                block.removeEventListener('mousedown', window.handleMouseDown);
                block.addEventListener('mousedown', enhancedMouseDown);
              }
            }
          });
        }
      });
    });
    
    // הפעל את ה-observer
    observer.observe(programArea, { childList: true, subtree: true });
  }
  
  // המאזין המורחב למאורע mousedown - מאפשר גרירה קבוצתית
  function enhancedMouseDown(e) {
    // אם לא מדובר בלחיצה שמאלית או האלמנט אינו בלוק, הפעל את ההתנהגות הרגילה
    if (e.button !== 0 || !e.target.closest || e.target.matches('input,button,select,textarea,a[href]')) {
      if (typeof window.handleMouseDown === 'function') {
        return window.handleMouseDown.call(this, e);
      }
      return;
    }
    
    // מצא את הבלוק שנלחץ
    const block = e.target.closest('.block-container');
    if (!block || !block.parentElement || block.parentElement.id !== 'program-blocks') {
      if (typeof window.handleMouseDown === 'function') {
        return window.handleMouseDown.call(this, e);
      }
      return;
    }
    
    // מנע את ברירת המחדל של האירוע
    e.preventDefault();
    
    // זהה את כל הבלוקים הקשורים (מימין) שצריכים להיגרר יחד
    const groupBlocks = collectConnectedBlocks(block);
    
    if (groupBlocks.length <= 1) {
      // אם אין בלוקים קשורים, הפעל את התנהגות הגרירה הרגילה
      if (typeof window.handleMouseDown === 'function') {
        return window.handleMouseDown.call(this, e);
      }
      return;
    }
    
    // נתק זמנית את כל הבלוקים בקבוצה כדי לאפשר גרירה
    const connectionData = temporarilyDetachGroup(groupBlocks);
    
    // הפעל את הגרירה עם הנתונים השמורים
    startGroupDrag(block, groupBlocks, connectionData, e);
  }
  
  // פונקציה לאיסוף כל הבלוקים המחוברים מימין
  function collectConnectedBlocks(startBlock) {
    const blocks = [startBlock];
    let currentBlock = startBlock;
    
    // בדוק אם יש בלוק שמחובר מימין
    while (currentBlock.hasAttribute('data-connected-from-right')) {
      const nextBlockId = currentBlock.getAttribute('data-connected-from-right');
      const nextBlock = document.getElementById(nextBlockId);
      
      if (!nextBlock) break;
      
      blocks.push(nextBlock);
      currentBlock = nextBlock;
    }
    
    return blocks;
  }
  
  // פונקציה שמנתקת זמנית את הבלוקים לצורך גרירה
  function temporarilyDetachGroup(blocks) {
    const connectionData = [];
    
    // שמור את נתוני החיבור של כל בלוק ונתק אותו
    blocks.forEach(block => {
      // שמור נתונים רק על בלוקים מחוברים
      if (block.hasAttribute('data-connected-to')) {
        connectionData.push({
          blockId: block.id,
          connectedToId: block.getAttribute('data-connected-to'),
          connectionDirection: block.getAttribute('data-connection-direction')
        });
        
        // הסר את החיבור באופן זמני
        detachBlockWithoutAnimation(block);
      }
    });
    
    return connectionData;
  }
  
  // פונקציה שמנתקת בלוק ללא אנימציה
  function detachBlockWithoutAnimation(block) {
    if (!block || !block.hasAttribute('data-connected-to')) return;
    
    const targetId = block.getAttribute('data-connected-to');
    const direction = block.getAttribute('data-connection-direction');
    
    // נקה את תכונות החיבור מהבלוק הנוכחי
    block.removeAttribute('data-connected-to');
    block.removeAttribute('data-connection-direction');
    block.classList.remove('connected-block');
    
    // נקה את תכונות החיבור מהבלוק היעד
    const targetBlock = document.getElementById(targetId);
    if (targetBlock) {
      targetBlock.removeAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right');
      
      // בדוק אם הבלוק עדיין מחובר לאחרים
      const isStillConnected = targetBlock.hasAttribute('data-connected-from-left') ||
                               targetBlock.hasAttribute('data-connected-from-right') ||
                               targetBlock.hasAttribute('data-connected-to');
      
      if (!isStillConnected) {
        targetBlock.classList.remove('has-connected-block');
      }
    }
  }
  
  // פונקציה שמתחילה את הגרירה הקבוצתית
  function startGroupDrag(mainBlock, allBlocks, connectionData, e) {
    // הגדר משתנים לשמירת המצב הנוכחי
    const initialPositions = [];
    const programmingArea = document.getElementById('program-blocks');
    const areaRect = programmingArea.getBoundingClientRect();
    
    // קבע את מיקום הבלוק הראשי
    const mainRect = mainBlock.getBoundingClientRect();
    const dragOffsetX = e.clientX - mainRect.left;
    const dragOffsetY = e.clientY - mainRect.top;
    
    // שמור את המיקום ההתחלתי של כל הבלוקים
    allBlocks.forEach(block => {
      const rect = block.getBoundingClientRect();
      
      // קבע את סגנון המיקום אם עדיין לא הוגדר
      if (window.getComputedStyle(block).position !== 'absolute') {
        block.style.position = 'absolute';
        block.style.left = (rect.left - areaRect.left + programmingArea.scrollLeft) + 'px';
        block.style.top = (rect.top - areaRect.top + programmingArea.scrollTop) + 'px';
      }
      
      // שמור את המיקום ההתחלתי
      initialPositions.push({
        block: block,
        startX: parseFloat(block.style.left) || 0,
        startY: parseFloat(block.style.top) || 0,
        width: rect.width,
        height: rect.height
      });
      
      // הוסף קלאס ויזואלי לבלוקים בקבוצה
      block.classList.add('group-dragged');
    });
    
    // הוסף קלאס מיוחד לבלוק הראשי
    mainBlock.classList.add('snap-source');
    
    // הוסף מאזין לתנועת העכבר - ימשיך את הגרירה
    function handleGroupMouseMove(moveEvent) {
      moveEvent.preventDefault();
      
      // חשב את המיקום החדש של הבלוק הראשי
      const newMainX = moveEvent.clientX - areaRect.left - dragOffsetX + programmingArea.scrollLeft;
      const newMainY = moveEvent.clientY - areaRect.top - dragOffsetY + programmingArea.scrollTop;
      
      // הזז את הבלוק הראשי
      mainBlock.style.left = Math.round(newMainX) + 'px';
      mainBlock.style.top = Math.round(newMainY) + 'px';
      
      // חשב את השינוי מהמיקום ההתחלתי
      const deltaX = newMainX - initialPositions[0].startX;
      const deltaY = newMainY - initialPositions[0].startY;
      
      // הזז את כל שאר הבלוקים בקבוצה
      for (let i = 1; i < initialPositions.length; i++) {
        const pos = initialPositions[i];
        pos.block.style.left = Math.round(pos.startX + deltaX) + 'px';
        pos.block.style.top = Math.round(pos.startY + deltaY) + 'px';
      }
    }
    
    // מאזין לשחרור העכבר - יסיים את הגרירה
    function handleGroupMouseUp(upEvent) {
      // הסר את המאזינים
      document.removeEventListener('mousemove', handleGroupMouseMove);
      document.removeEventListener('mouseup', handleGroupMouseUp);
      document.body.classList.remove('user-select-none');
      
      // הסר את קלאס הגרירה מכל הבלוקים
      allBlocks.forEach(block => {
        block.classList.remove('group-dragged', 'snap-source');
      });
      
      // שחזר את החיבורים הקודמים
      restoreConnections(connectionData);
      
      // הוסף אפקט חיבור לבלוקים
      allBlocks.forEach(block => {
        if (block.hasAttribute('data-connected-to')) {
          addSnapEffectToBlock(block);
        }
      });
    }
    
    // הוסף את המאזינים
    document.addEventListener('mousemove', handleGroupMouseMove);
    document.addEventListener('mouseup', handleGroupMouseUp);
    document.body.classList.add('user-select-none');
  }
  
  // פונקציה לשחזור החיבורים בין הבלוקים
  function restoreConnections(connectionData) {
    connectionData.forEach(data => {
      const block = document.getElementById(data.blockId);
      const targetBlock = document.getElementById(data.connectedToId);
      
      if (!block || !targetBlock) return;
      
      // שחזר את תכונות החיבור של הבלוק
      block.setAttribute('data-connected-to', data.connectedToId);
      block.setAttribute('data-connection-direction', data.connectionDirection);
      block.classList.add('connected-block');
      
      // שחזר את תכונות החיבור של הבלוק היעד
      targetBlock.setAttribute(
        data.connectionDirection === 'left' ? 'data-connected-from-left' : 'data-connected-from-right',
        data.blockId
      );
      targetBlock.classList.add('has-connected-block');
    });
    
    // הפעל את פונקציית הניקוי של המסגרות
    if (typeof window.removeOutlinesFromConnectedBlocks === 'function') {
      setTimeout(window.removeOutlinesFromConnectedBlocks, 100);
    }
  }
  
  // פונקציה להוספת אפקט חיבור ויזואלי לבלוק
  function addSnapEffectToBlock(block) {
    block.classList.remove('snap-animation');
    void block.offsetWidth;  // אתחול מאולץ של reflow
    block.classList.add('snap-animation');
    block.addEventListener('animationend', () => block.classList.remove('snap-animation'), {once: true});
  }
  
  // התחל את האתחול כשהמסמך נטען
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGroupDragging);
  } else {
    // הוסף השהיה קטנה לוודא שהמודול הראשי כבר נטען
    setTimeout(initGroupDragging, 200);
  }
  
  // חשוף את הפונקציה לחלונית הגלובלית כדי לאפשר גישה חיצונית
  window.initGroupDragging = initGroupDragging;
})();

// --- END GROUP DRAGGING MODULE ---
