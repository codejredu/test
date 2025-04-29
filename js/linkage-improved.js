// המשך הקובץ הקודם

  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock;
    const candidateTarget = potentialSnapTarget;
    const candidateDirection = snapDirection;

    if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing block ${blockReleased.id}. Candidate: ${candidateTarget?.id || 'none'}, direction: ${candidateDirection || 'none'}`);

    // ניקוי מצב הגרירה
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source');
    blockReleased.style.zIndex = '';

    // ניקוי ראשוני של נקודות החיבור
    clearAllHighlights();

    // החלטה על הצמדה
    let performSnap = false;
    if (candidateTarget && candidateDirection && document.body.contains(candidateTarget)) {
        if (CONFIG.DEBUG) console.log(`[MouseUp] Candidate target ${candidateTarget.id} identified during drag. Attempting snap.`);
        performSnap = true;
    }

    // בצע הצמדה
    if (performSnap) {
      const snapSuccess = performBlockSnap(blockReleased, candidateTarget, candidateDirection);
      clearAllHighlights();

      if (!snapSuccess) {
          blockReleased.draggable = true;
      }
    } else {
      blockReleased.draggable = true;
    }
  }
  
  // ========================================================================
  // פונקציות ניתוק, תפריט, אנימציה
  // ========================================================================
  function showDetachMenu(x, y, b) {
    removeDetachMenu();
    const m = document.createElement('div');
    m.id = 'detach-menu';
    m.style.left = `${x}px`;
    m.style.top = `${y}px`;
    const o = document.createElement('div');
    o.textContent = 'נתק בלוק';
    o.onclick = (e) => {
      e.stopPropagation();
      detachBlock(b, true);
      removeDetachMenu();
    };
    m.appendChild(o);
    document.body.appendChild(m);
    setTimeout(() => {
      document.addEventListener('click', closeMenuOutside, {capture: true, once: true});
      window.addEventListener('scroll', removeDetachMenu, {capture: true, once: true});
    }, 0);
  }

  function closeMenuOutside(e) {
    const m = document.getElementById('detach-menu');
    if (m && !m.contains(e.target)) {
      removeDetachMenu();
    } else if (m) {
      setTimeout(() => document.addEventListener('click', closeMenuOutside, {capture: true, once: true}), 0);
    }
    if (m) window.removeEventListener('scroll', removeDetachMenu, {capture: true});
  }

  function removeDetachMenu() {
    const m = document.getElementById('detach-menu');
    if (m) {
      document.removeEventListener('click', closeMenuOutside, {capture: true});
      window.removeEventListener('scroll', removeDetachMenu, {capture: true});
      m.remove();
    }
  }

  function detachBlock(btd, animate=true) {
    if (!btd || !btd.hasAttribute('data-connected-to')) return;

    const tid = btd.getAttribute('data-connected-to');
    const dir = btd.getAttribute('data-connection-direction');

    if (!tid || !dir) {
      console.warn(`[Detach] Missing data on ${btd.id}. Cleaning attributes.`);
      btd.removeAttribute('data-connected-to');
      btd.removeAttribute('data-connection-direction');
      btd.classList.remove('connected-block');
      btd.classList.remove('no-outlines');
      btd.draggable = true;
      return;
    }

    if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${btd.id} from ${tid}`);

    btd.removeAttribute('data-connected-to');
    btd.removeAttribute('data-connection-direction');
    btd.classList.remove('connected-block');
    btd.classList.remove('no-outlines');
    btd.draggable = true;

    // ניקוי חיווי
    clearAllHighlights();

    const tb = document.getElementById(tid);
    if (tb) {
      tb.removeAttribute(dir === 'left' ? 'data-connected-from-left' : 'data-connected-from-right');
      const isStillConnected = tb.hasAttribute('data-connected-from-left') ||
                               tb.hasAttribute('data-connected-from-right') ||
                               tb.hasAttribute('data-connected-to');
      if (!isStillConnected) {
          tb.classList.remove('has-connected-block');
          tb.classList.remove('no-outlines');
      }
    } else {
      console.warn(`[Detach] Target block with ID ${tid} not found.`);
    }

    if (animate) addDetachEffectAnimation(btd);
  }

  function addSnapEffectAnimation(b) {
    b.classList.remove('snap-animation');
    void b.offsetWidth;
    b.classList.add('snap-animation');
    b.addEventListener('animationend', () => b.classList.remove('snap-animation'), {once: true});
  }

  function addDetachEffectAnimation(b) {
    b.classList.remove('detach-animation');
    void b.offsetWidth;
    b.classList.add('detach-animation');
    b.addEventListener('animationend', () => b.classList.remove('detach-animation'), {once: true});
  }

  function generateUniqueId(b) {
    if (b.id) return b.id;
    const p = b.dataset.type || 'block';
    let s = Math.random().toString(36).substring(2, 8);
    let id = `${p}-${s}`;
    let i = 0;
    while (document.getElementById(id) && i < 10) {
      s = Math.random().toString(36).substring(2, 8);
      id = `${p}-${s}-${i++}`;
    }
    if (document.getElementById(id)) {
         id = `${p}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    }
    b.id = id;
    if (CONFIG.DEBUG > 1) console.log(`Generated ID: ${id} for block.`);
    return id;
  }

  // ========================================================================
  // אתחול המערכת - עם הוספת קריאה להסרת מסגרות
  // ========================================================================
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v3_9_5';
    if (window[initFlag]) {
        if (CONFIG.DEBUG) console.log("Block linkage system already initialized. Skipping.");
        return;
    }

    // אתחול כל הרכיבים
    addHighlightStyles();
    initAudio();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();

    if (CONFIG.PLAY_SOUND) {
      addSoundTestButton();
    }

    // הוספת נקודות חיבור לכל הבלוקים הקיימים
    document.querySelectorAll('#program-blocks .block-container').forEach(block => {
      addConnectionPoints(block);
    });

    // וידוא שהסגנונות הוטענו
    if (!document.getElementById('block-connection-styles-enhanced-v3-9-5')) {
      console.warn("Enhanced connection styles were not loaded properly. Re-adding...");
      addHighlightStyles();
    }
    
    // טיפול בכל הבלוקים שכבר מחוברים (לניקוי מסגרות קיימות)
    removeOutlinesFromConnectedBlocks();

    window[initFlag] = true;
    console.log(`Block linkage system initialized (Version 3.9.5 - Balanced Fix)`);
    console.log(`Configuration: Connection points preserved with targeted outline removal`);
    console.log(`Outlines will be removed only from connected blocks after ${CONFIG.CLEAR_OUTLINES_DELAY}ms`);
  }

  // הפעל אתחול
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem(); // DOM already loaded
  }

})();

// --- תוספת לתמיכה בגרירה קבוצתית ---
// מאפשר גרירה של שרשרת בלוקים כאשר הלבנה הראשונה היא הגוררת

(function() {
  console.log("Group Dragging module loading...");
  
  // ===== קונפיגורציה =====
  const GROUP_CONFIG = {
    DEBUG: true,                  // הצגת הודעות בקונסול
    CHECK_INTERVAL_MS: 10,        // קצב בדיקה (מילישניות)
    CONNECTION_DISTANCE: 9,       // מרחק חיבור (פיקסלים)
    WAIT_INIT_MS: 1000            // המתנה לאתחול
  };
  
  // ===== משתנים גלובליים =====
  let isActive = false;           // האם המודול פעיל
  let isInitialized = false;      // האם המודול אותחל
  let checkTimer = null;          // טיימר בדיקה
  let lastDraggedBlock = null;    // בלוק אחרון שנגרר
  
  // ===== פונקציות לוג =====
  function groupLog(...args) {
    if (GROUP_CONFIG.DEBUG) {
      console.log("[GroupDrag]", ...args);
    }
  }
  
  // ===== אתחול המודול =====
  function initGroupDragging() {
    // בדוק שלא אותחל כבר
    if (isInitialized) return;
    
    groupLog("Initializing Group Dragging module...");
    
    // התחל לעקוב אחר בלוקים בגרירה
    startBlockTracking();
    
    isInitialized = true;
    isActive = true;
    
    groupLog("Group Dragging module initialized successfully");
  }
  
  // ===== התחלת מעקב אחר בלוקים =====
  function startBlockTracking() {
    // נקה טיימר קודם אם יש
    if (checkTimer) {
      clearInterval(checkTimer);
      checkTimer = null;
    }
    
    // הפעל בדיקה תקופתית
    checkTimer = setInterval(() => {
      if (!isActive) return;
      
      // מצא בלוק בגרירה
      const draggedBlock = findDraggedBlock();
      
      // אם נמצא בלוק בגרירה
      if (draggedBlock) {
        // אם זה בלוק חדש שנגרר
        if (draggedBlock !== lastDraggedBlock) {
          groupLog("New block being dragged:", draggedBlock.id);
          
          // שמור את הבלוק הנוכחי
          lastDraggedBlock = draggedBlock;
          
          // מצא את כל הבלוקים המחוברים
          const connectedBlocks = findConnectedBlocks(draggedBlock);
          
          if (connectedBlocks.length > 0) {
            groupLog(`Found ${connectedBlocks.length} connected blocks`);
          }
          
          // שמור את המיקומים היחסיים
          saveRelativePositions(draggedBlock, connectedBlocks);
        }
        
        // עדכן את מיקום הבלוקים המחוברים
        updateConnectedBlocksPositions(draggedBlock);
      } else if (lastDraggedBlock) {
        // הבלוק הפסיק להיגרר
        groupLog("Block released:", lastDraggedBlock.id);
        lastDraggedBlock = null;
      }
    }, GROUP_CONFIG.CHECK_INTERVAL_MS);
    
    groupLog("Block tracking started");
  }
  
  // ===== מציאת בלוק בגרירה =====
  function findDraggedBlock() {
    return document.querySelector('#program-blocks .block-container.snap-source');
  }
  
  // ===== מציאת בלוקים מחוברים =====
  function findConnectedBlocks(block) {
    if (!block) return [];
    
    // מצא את כל הבלוקים שמחוברים לבלוק המקורי
    const connectedBlocks = [];
    
    // בדוק אם יש בלוק מחובר מימין
    if (block.hasAttribute('data-connected-from-right')) {
      const rightId = block.getAttribute('data-connected-from-right');
      const rightBlock = document.getElementById(rightId);
      
      if (rightBlock) {
        connectedBlocks.push({
          block: rightBlock,
          direction: 'right'
        });
        
        // מצא גם בלוקים שמחוברים לבלוק הימני
        const rightConnected = findConnectedBlocks(rightBlock);
        connectedBlocks.push(...rightConnected);
      }
    }
    
    // בדוק אם יש בלוק שמחובר אלינו משמאל
    if (block.hasAttribute('data-connected-to') && 
        block.getAttribute('data-connection-direction') === 'left') {
      
      const leftId = block.getAttribute('data-connected-to');
      const leftBlock = document.getElementById(leftId);
      
      if (leftBlock && !connectedBlocks.some(item => item.block.id === leftId)) {
        connectedBlocks.push({
          block: leftBlock,
          direction: 'left'
        });
      }
    }
    
    return connectedBlocks;
  }
  
  // ===== מיקומים יחסיים של בלוקים מחוברים =====
  function saveRelativePositions(mainBlock, connectedBlocks) {
    if (!mainBlock || connectedBlocks.length === 0) return;
    
    // קבל מיקום של הבלוק הראשי
    const mainLeft = parseFloat(mainBlock.style.left) || 0;
    const mainTop = parseFloat(mainBlock.style.top) || 0;
    
    // שמור מיקומים יחסיים
    connectedBlocks.forEach(item => {
      const block = item.block;
      const left = parseFloat(block.style.left) || 0;
      const top = parseFloat(block.style.top) || 0;
      
      // שמור את ההיסט היחסי
      block.dataset.relativeLeft = left - mainLeft;
      block.dataset.relativeTop = top - mainTop;
      
      groupLog(`Saved relative position for ${block.id}: left=${block.dataset.relativeLeft}, top=${block.dataset.relativeTop}`);
    });
  }
  
  // ===== עדכון מיקום בלוקים מחוברים =====
  function updateConnectedBlocksPositions(mainBlock) {
    if (!mainBlock) return;
    
    // מצא את הבלוקים המחוברים
    const connectedBlocks = findConnectedBlocks(mainBlock);
    if (connectedBlocks.length === 0) return;
    
    // קבל את המיקום הנוכחי של הבלוק הראשי
    const mainLeft = parseFloat(mainBlock.style.left) || 0;
    const mainTop = parseFloat(mainBlock.style.top) || 0;
    
    // עדכן כל בלוק מחובר
    connectedBlocks.forEach(item => {
      const block = item.block;
      
      // אם אין מידע על מיקום יחסי, חשב אותו
      if (!block.dataset.relativeLeft || !block.dataset.relativeTop) {
        const left = parseFloat(block.style.left) || 0;
        const top = parseFloat(block.style.top) || 0;
        
        block.dataset.relativeLeft = left - mainLeft;
        block.dataset.relativeTop = top - mainTop;
      }
      
      // חשב מיקום חדש
      const newLeft = mainLeft + parseFloat(block.dataset.relativeLeft);
      const newTop = mainTop + parseFloat(block.dataset.relativeTop);
      
      // עדכן מיקום
      block.style.position = 'absolute';
      block.style.left = Math.round(newLeft) + 'px';
      block.style.top = Math.round(newTop) + 'px';
    });
  }
  
  // ===== הפעלה/כיבוי של המודול =====
  function toggleGroupDragging() {
    isActive = !isActive;
    groupLog(`Group dragging ${isActive ? 'enabled' : 'disabled'}`);
    return isActive;
  }
  
  // ===== חשיפת API ציבורי =====
  window.GroupDrag = {
    toggle: toggleGroupDragging,
    
    status: function() {
      return {
        initialized: isInitialized,
        active: isActive
      };
    },
    
    restart: function() {
      if (checkTimer) {
        clearInterval(checkTimer);
        checkTimer = null;
      }
      
      lastDraggedBlock = null;
      isInitialized = false;
      setTimeout(initGroupDragging, 200);
      
      return "Group Dragging restarted";
    }
  };
  
  // ===== אתחול אוטומטי =====
  setTimeout(initGroupDragging, GROUP_CONFIG.WAIT_INIT_MS);
  
  console.log("Group Dragging module loaded!");
})();

// --- END OF FILE linkageimproved.js v3.9.5 ---
