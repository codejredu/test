/**
 * blockGroupDragging.js v1.0
 * 
 * מודול לגרירת קבוצת בלוקים בו הלבנה הראשונה היא הגוררת
 * עובד עם linkageimproved.js
 * 
 * כיצד להשתמש:
 * 1. שמור את הקובץ בשם blockGroupDragging.js
 * 2. הוסף תג script בדף ה-HTML אחרי טעינת הקוד המקורי
 */

(function() {
  // --- הגדרות קונפיגורציה ---
  const CONFIG = {
    DEBUG: false,                    // הדפסת הודעות לקונסול
    UPDATE_INTERVAL_MS: 10,          // קצב עדכון (מילישניות)
    WAIT_FOR_INIT_MS: 1000,          // המתנה לאתחול
    MAX_BLOCKS: 50,                  // מקסימום בלוקים בשרשרת
    HIGHLIGHT_DRAGGED_GROUP: false,  // הדגשת הקבוצה הנגררת
    FIX_SNAP_DISTANCE: 9,            // מרחק התאמה בין בלוקים (פיקסלים)
    MAINTAIN_EXACT_POSITIONS: true   // שמירה על מיקום מדויק
  };

  // --- משתנים גלובליים ---
  let isInitialized = false;      // האם המודול אותחל
  let isActive = true;            // האם המודול פעיל
  let checkTimer = null;          // טיימר בדיקה
  let lastDraggedBlock = null;    // הבלוק האחרון שנגרר
  let lastGroupBlocks = [];       // הבלוקים האחרונים בקבוצה

  // --- פונקציות לוג ---
  function log(...args) {
    if (CONFIG.DEBUG) console.log("[BlockGroupDrag]", ...args);
  }

  function warn(...args) {
    if (CONFIG.DEBUG) console.warn("[BlockGroupDrag]", ...args);
  }

  // --- אתחול המערכת ---
  function initialize() {
    if (isInitialized) return;
    
    log("Initializing Block Group Dragging v1.0");
    
    // הוסף סגנונות CSS לצורך הדגשה ויזואלית
    if (CONFIG.HIGHLIGHT_DRAGGED_GROUP) {
      addStyles();
    }
    
    // התחל לעקוב אחר גרירת בלוקים
    startWatchingDraggedBlocks();
    
    isInitialized = true;
    log("Initialization complete");
  }

  // --- הוספת סגנונות CSS ---
  function addStyles() {
    const styleEl = document.createElement('style');
    styleEl.id = 'block-group-dragging-styles';
    styleEl.textContent = `
      .bgd-grouped-block {
        box-shadow: 0 0 0 1px rgba(76, 175, 80, 0.3) !important;
        transition: box-shadow 0.2s ease-in-out;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // --- התחלת מעקב אחר בלוקים בגרירה ---
  function startWatchingDraggedBlocks() {
    if (checkTimer) clearInterval(checkTimer);
    
    checkTimer = setInterval(() => {
      if (!isActive) return;
      
      // מצא בלוק שנגרר כרגע
      const draggedBlock = findDraggedBlock();
      
      // אם יש בלוק בגרירה
      if (draggedBlock) {
        // אם זה בלוק חדש שנגרר
        if (draggedBlock !== lastDraggedBlock) {
          log("New block dragged:", draggedBlock.id);
          
          // שמור את הבלוק הנוכחי
          lastDraggedBlock = draggedBlock;
          
          // נקה קבוצה קודמת ומצא קבוצה חדשה
          lastGroupBlocks = [];
          
          // מצא את כל הבלוקים בקבוצה
          lastGroupBlocks = findBlockGroup(draggedBlock);
          
          if (lastGroupBlocks.length > 1) {
            log(`Found group with ${lastGroupBlocks.length} blocks`);
            
            // הדגש את הקבוצה אם צריך
            if (CONFIG.HIGHLIGHT_DRAGGED_GROUP) {
              highlightGroup(lastGroupBlocks);
            }
          }
        }
        
        // אם יש קבוצת בלוקים, עדכן את מיקום כולם
        if (lastGroupBlocks.length > 1) {
          updateBlockGroupPositions(draggedBlock, lastGroupBlocks);
        }
      } else if (lastDraggedBlock) {
        // בלוק הפסיק להיגרר
        log("Block released:", lastDraggedBlock.id);
        
        // הסר הדגשה
        if (CONFIG.HIGHLIGHT_DRAGGED_GROUP) {
          unhighlightGroup(lastGroupBlocks);
        }
        
        // נקה את המצב
        lastDraggedBlock = null;
      }
    }, CONFIG.UPDATE_INTERVAL_MS);
    
    log("Watching for dragged blocks");
  }

  // --- מציאת בלוק שנגרר כרגע ---
  function findDraggedBlock() {
    // בלוק בגרירה מסומן בקלאס snap-source
    return document.querySelector('#program-blocks .block-container.snap-source');
  }

  // --- הדגשת קבוצת בלוקים ---
  function highlightGroup(blocks) {
    if (!CONFIG.HIGHLIGHT_DRAGGED_GROUP) return;
    
    blocks.forEach(block => {
      if (block !== blocks[0]) { // אל תדגיש את הבלוק הראשי
        block.classList.add('bgd-grouped-block');
      }
    });
  }

  // --- הסרת הדגשה מקבוצת בלוקים ---
  function unhighlightGroup(blocks) {
    if (!CONFIG.HIGHLIGHT_DRAGGED_GROUP) return;
    
    blocks.forEach(block => {
      block.classList.remove('bgd-grouped-block');
    });
  }

  // --- מציאת כל הבלוקים בקבוצה ---
  function findBlockGroup(startBlock) {
    const visited = new Set();
    const group = [];
    const queue = [startBlock];
    
    // שימוש באלגוריתם BFS למציאת כל הבלוקים המחוברים
    while (queue.length > 0 && group.length < CONFIG.MAX_BLOCKS) {
      const block = queue.shift();
      
      // דלג אם כבר ביקרנו בבלוק
      if (visited.has(block.id)) continue;
      
      // סמן כמבוקר והוסף לקבוצה
      visited.add(block.id);
      group.push(block);
      
      // בדוק אם יש בלוק מחובר מימין
      if (block.hasAttribute('data-connected-from-right')) {
        const rightId = block.getAttribute('data-connected-from-right');
        const rightBlock = document.getElementById(rightId);
        if (rightBlock && !visited.has(rightId)) {
          queue.push(rightBlock);
        }
      }
      
      // בדוק אם יש בלוק מחובר משמאל
      if (block.hasAttribute('data-connected-to') && 
          block.getAttribute('data-connection-direction') === 'left') {
        const leftId = block.getAttribute('data-connected-to');
        const leftBlock = document.getElementById(leftId);
        if (leftBlock && !visited.has(leftId)) {
          queue.push(leftBlock);
        }
      }
      
      // בדוק אם יש בלוק שמחובר אלינו משמאל
      const connectedFromLeft = document.querySelector(`[data-connected-to="${block.id}"][data-connection-direction="left"]`);
      if (connectedFromLeft && !visited.has(connectedFromLeft.id)) {
        queue.push(connectedFromLeft);
      }
      
      // בדוק אם יש בלוק שמחובר אלינו מימין
      const connectedFromRight = document.querySelector(`[data-connected-to="${block.id}"][data-connection-direction="right"]`);
      if (connectedFromRight && !visited.has(connectedFromRight.id)) {
        queue.push(connectedFromRight);
      }
    }
    
    return group;
  }

  // --- עדכון מיקום קבוצת בלוקים ---
  function updateBlockGroupPositions(mainBlock, blockGroup) {
    if (!mainBlock || blockGroup.length <= 1) return;
    
    // בנה מערך של חיבורים ישירים בין הבלוקים
    const connections = buildConnectionsMap(blockGroup);
    
    // מצא את המיקום הנוכחי של הבלוק הראשי
    const mainLeft = parseFloat(mainBlock.style.left) || 0;
    const mainTop = parseFloat(mainBlock.style.top) || 0;
    
    // שמור את הבלוקים שכבר עודכנו
    const updatedBlocks = new Set([mainBlock.id]);
    
    // המרת מערך לאובייקט מיפוי
    const blocksById = {};
    blockGroup.forEach(block => {
      blocksById[block.id] = block;
    });
    
    // עדכון בצורה הדרגתית
    let iterations = 0;
    const maxIterations = blockGroup.length * 2; // מניעת לולאה אינסופית
    
    let madeChanges = true;
    while (madeChanges && iterations < maxIterations) {
      madeChanges = false;
      iterations++;
      
      // עבור לכל הבלוקים שכבר עודכנו, עדכן את השכנים שלהם
      for (const blockId of updatedBlocks) {
        const blockConnections = connections[blockId] || [];
        
        // עדכן את כל הבלוקים המחוברים ישירות
        for (const conn of blockConnections) {
          // דלג אם הבלוק היעד כבר עודכן
          if (updatedBlocks.has(conn.targetId)) continue;
          
          const sourceBlock = blocksById[blockId];
          const targetBlock = blocksById[conn.targetId];
          
          if (!sourceBlock || !targetBlock) continue;
          
          // חשב את המיקום החדש לבלוק היעד
          const sourceLeft = parseFloat(sourceBlock.style.left) || 0;
          const sourceTop = parseFloat(sourceBlock.style.top) || 0;
          
          // עדכן את המיקום בהתאם לכיוון החיבור
          if (conn.direction === 'right') {
            // הבלוק היעד נמצא מימין לבלוק המקור
            targetBlock.style.position = 'absolute';
            targetBlock.style.left = (sourceLeft + sourceBlock.offsetWidth - CONFIG.FIX_SNAP_DISTANCE) + 'px';
            targetBlock.style.top = sourceTop + 'px';
          } else if (conn.direction === 'left') {
            // הבלוק היעד נמצא משמאל לבלוק המקור
            targetBlock.style.position = 'absolute';
            targetBlock.style.left = (sourceLeft - targetBlock.offsetWidth + CONFIG.FIX_SNAP_DISTANCE) + 'px';
            targetBlock.style.top = sourceTop + 'px';
          }
          
          // סמן את הבלוק כמעודכן
          updatedBlocks.add(conn.targetId);
          madeChanges = true;
        }
      }
    }
    
    // בדוק אם יש בלוקים שלא עודכנו
    if (updatedBlocks.size < blockGroup.length) {
      warn(`Warning: ${blockGroup.length - updatedBlocks.size} blocks were not updated`);
      
      // נסה לעדכן את כל הבלוקים שלא עודכנו עדיין
      // על פי המיקום המקורי שלהם יחסית לבלוק הראשי
      if (CONFIG.MAINTAIN_EXACT_POSITIONS) {
        // קבל את ההיסט מהמיקום המקורי של הבלוק הראשי
        // (יכול להיות מחושב רק אם יש לנו את המיקומים המקוריים)
        const originalLeft = parseFloat(mainBlock.dataset.originalLeft) || 0;
        const originalTop = parseFloat(mainBlock.dataset.originalTop) || 0;
        
        if (originalLeft !== 0 || originalTop !== 0) {
          const deltaX = mainLeft - originalLeft;
          const deltaY = mainTop - originalTop;
          
          // עדכן את שאר הבלוקים
          blockGroup.forEach(block => {
            if (!updatedBlocks.has(block.id) && block !== mainBlock) {
              const blockOriginalLeft = parseFloat(block.dataset.originalLeft) || 0;
              const blockOriginalTop = parseFloat(block.dataset.originalTop) || 0;
              
              if (blockOriginalLeft !== 0 || blockOriginalTop !== 0) {
                block.style.position = 'absolute';
                block.style.left = (blockOriginalLeft + deltaX) + 'px';
                block.style.top = (blockOriginalTop + deltaY) + 'px';
              }
            }
          });
        }
      }
    }
  }

  // --- בניית מפת חיבורים בין הבלוקים ---
  function buildConnectionsMap(blockGroup) {
    const connections = {};
    
    blockGroup.forEach(block => {
      if (!connections[block.id]) {
        connections[block.id] = [];
      }
      
      // בדוק חיבור לימין
      if (block.hasAttribute('data-connected-from-right')) {
        const rightId = block.getAttribute('data-connected-from-right');
        // וודא שהבלוק המחובר נמצא בקבוצה
        if (blockGroup.some(b => b.id === rightId)) {
          connections[block.id].push({
            targetId: rightId,
            direction: 'right'
          });
          
          // הוסף גם את החיבור ההפוך
          if (!connections[rightId]) {
            connections[rightId] = [];
          }
          connections[rightId].push({
            targetId: block.id,
            direction: 'left'
          });
        }
      }
      
      // בדוק חיבור לשמאל
      if (block.hasAttribute('data-connected-to') && 
          block.getAttribute('data-connection-direction') === 'left') {
        const leftId = block.getAttribute('data-connected-to');
        // וודא שהבלוק המחובר נמצא בקבוצה
        if (blockGroup.some(b => b.id === leftId)) {
          connections[block.id].push({
            targetId: leftId,
            direction: 'left'
          });
          
          // הוסף גם את החיבור ההפוך
          if (!connections[leftId]) {
            connections[leftId] = [];
          }
          connections[leftId].push({
            targetId: block.id,
            direction: 'right'
          });
        }
      }
    });
    
    return connections;
  }

  // --- שמירת המיקומים המקוריים של הבלוקים ---
  function saveOriginalPositions(blocks) {
    blocks.forEach(block => {
      block.dataset.originalLeft = parseFloat(block.style.left) || 0;
      block.dataset.originalTop = parseFloat(block.style.top) || 0;
    });
  }

  // --- אתחול מחדש של המודול ---
  function reinitialize() {
    if (checkTimer) {
      clearInterval(checkTimer);
      checkTimer = null;
    }
    
    lastDraggedBlock = null;
    lastGroupBlocks = [];
    isInitialized = false;
    
    setTimeout(initialize, 200);
  }

  // --- חשיפת API ציבורי ---
  window.BlockGroupDrag = {
    // הפעלה/כיבוי של המודול
    toggle: function() {
      isActive = !isActive;
      log(`Group dragging ${isActive ? 'enabled' : 'disabled'}`);
      return isActive;
    },
    
    // בדיקת סטטוס
    status: function() {
      return {
        initialized: isInitialized,
        active: isActive,
        lastGroupSize: lastGroupBlocks.length
      };
    },
    
    // אתחול מחדש
    restart: function() {
      reinitialize();
      return "Restarted";
    },
    
    // שינוי הגדרות
    setConfig: function(key, value) {
      if (key in CONFIG) {
        CONFIG[key] = value;
        return `Config ${key} set to ${value}`;
      }
      return `Unknown config key: ${key}`;
    }
  };

  // --- התחלת אתחול לאחר המתנה ---
  setTimeout(initialize, CONFIG.WAIT_FOR_INIT_MS);
})();
