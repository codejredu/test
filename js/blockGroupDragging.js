// --- Simple Group Dragging v1.0 ---
// פתרון פשוט לגרירת קבוצת בלוקים צמודים
// יש להוסיף לסוף linkageimproved.js

(function() {
  // קונפיגורציה בסיסית
  const SIMPLE_CONFIG = {
    DEBUG: true,                  // הצגת הודעות לקונסול
    WAIT_MS: 1000,                // המתנה לאתחול
    UPDATE_INTERVAL_MS: 10,       // קצב עדכון בדיקת מיקום בלוקים
    ALWAYS_UPDATE_GROUP: true,    // עדכון הקבוצה בכל מצב
    MAX_BLOCKS: 50                // מקסימום בלוקים בקבוצה
  };

  // משתנים גלובליים
  let isInitialized = false;      // האם המודול אותחל
  let isActive = false;           // האם המודול פעיל
  let checkTimer = null;          // טיימר בדיקה
  
  // פונקציית לוג
  function log(...args) {
    if (SIMPLE_CONFIG.DEBUG) console.log("[SimpleGroupDrag]", ...args);
  }

  // פונקציית אתחול ראשית
  function initialize() {
    if (isInitialized) return;
    
    log("Initializing Simple Group Dragging v1.0");
    
    // התקן מאזין גלובלי לתזוזת דיבים
    startWatchingBlockMovements();
    
    isInitialized = true;
    isActive = true;
    log("Initialization complete");
  }
  
  // פונקציה המפעילה מעקב אחר תזוזת בלוקים
  function startWatchingBlockMovements() {
    if (checkTimer) clearInterval(checkTimer);
    
    checkTimer = setInterval(() => {
      // חפש בלוקים בגרירה
      const draggedBlock = findDraggedBlock();
      
      // אם נמצא בלוק בגרירה, עדכן את הקבוצה שלו
      if (draggedBlock) {
        updateConnectedBlocks(draggedBlock);
      }
    }, SIMPLE_CONFIG.UPDATE_INTERVAL_MS);
    
    log("Watching for block movements");
  }
  
  // פונקציה המוצאת בלוק שנגרר כרגע
  function findDraggedBlock() {
    // בלוק בגרירה מסומן עם מחלקת snap-source
    return document.querySelector('#program-blocks .block-container.snap-source');
  }
  
  // פונקציה המעדכנת את הבלוקים המחוברים לבלוק שנגרר
  function updateConnectedBlocks(draggedBlock) {
    if (!draggedBlock) return;
    
    // מצא את כל הבלוקים בקבוצה (כולל הבלוק המקורי)
    const blockGroup = findBlockGroup(draggedBlock);
    
    // אם יש רק בלוק אחד, אין מה לעדכן
    if (blockGroup.length <= 1) return;
    
    // קבל את המיקום הנוכחי של הבלוק שנגרר
    const mainLeft = parseFloat(draggedBlock.style.left) || 0;
    const mainTop = parseFloat(draggedBlock.style.top) || 0;
    
    // הסר את הבלוק הנגרר מהקבוצה (כי מיקומו כבר נקבע)
    const otherBlocks = blockGroup.filter(block => block !== draggedBlock);
    
    // מצא את כל החיבורים הישירים בין הבלוקים בקבוצה
    const connections = findConnections(blockGroup);
    
    // עדכן את מיקום כל הבלוקים האחרים בהתבסס על החיבורים
    updatePositionsBasedOnConnections(draggedBlock, otherBlocks, connections);
  }
  
  // פונקציה המוצאת את כל הבלוקים בקבוצה
  function findBlockGroup(startBlock) {
    const visited = new Set();
    const group = [];
    const queue = [startBlock];
    
    // שימוש באלגוריתם BFS למציאת כל הבלוקים המחוברים
    while (queue.length > 0 && group.length < SIMPLE_CONFIG.MAX_BLOCKS) {
      const block = queue.shift();
      
      // אם כבר ביקרנו בבלוק, דלג
      if (visited.has(block.id)) continue;
      
      // סמן את הבלוק כמבוקר והוסף לקבוצה
      visited.add(block.id);
      group.push(block);
      
      // מצא בלוקים מחוברים
      // בדוק אם יש בלוק מחובר מימין
      if (block.hasAttribute('data-connected-from-right')) {
        const rightId = block.getAttribute('data-connected-from-right');
        const rightBlock = document.getElementById(rightId);
        if (rightBlock && !visited.has(rightId)) {
          queue.push(rightBlock);
        }
      }
      
      // בדוק אם יש בלוק מחובר משמאל
      if (block.hasAttribute('data-connected-to')) {
        // רק אם החיבור הוא לשמאל
        const dir = block.getAttribute('data-connection-direction');
        if (dir === 'left') {
          const leftId = block.getAttribute('data-connected-to');
          const leftBlock = document.getElementById(leftId);
          if (leftBlock && !visited.has(leftId)) {
            queue.push(leftBlock);
          }
        }
      }
      
      // בדוק אם משהו מחובר אלינו משמאל
      const connectedFromLeft = document.querySelector(`[data-connected-to="${block.id}"][data-connection-direction="left"]`);
      if (connectedFromLeft && !visited.has(connectedFromLeft.id)) {
        queue.push(connectedFromLeft);
      }
      
      // בדוק אם משהו מחובר אלינו מימין
      const connectedFromRight = document.querySelector(`[data-connected-to="${block.id}"][data-connection-direction="right"]`);
      if (connectedFromRight && !visited.has(connectedFromRight.id)) {
        queue.push(connectedFromRight);
      }
    }
    
    return group;
  }
  
  // פונקציה המוצאת את כל החיבורים בין הבלוקים בקבוצה
  function findConnections(blockGroup) {
    const connections = [];
    
    blockGroup.forEach(block => {
      // בדוק חיבור לשמאל
      if (block.hasAttribute('data-connected-to')) {
        const dir = block.getAttribute('data-connection-direction');
        if (dir === 'left') {
          const targetId = block.getAttribute('data-connected-to');
          // וודא שהבלוק המחובר נמצא בקבוצה
          if (blockGroup.some(b => b.id === targetId)) {
            connections.push({
              from: block.id,
              to: targetId,
              direction: 'left'
            });
          }
        }
      }
      
      // בדוק חיבור לימין
      if (block.hasAttribute('data-connected-from-right')) {
        const rightId = block.getAttribute('data-connected-from-right');
        // וודא שהבלוק המחובר נמצא בקבוצה
        if (blockGroup.some(b => b.id === rightId)) {
          connections.push({
            from: block.id,
            to: rightId,
            direction: 'right'
          });
        }
      }
    });
    
    return connections;
  }
  
  // פונקציה המעדכנת מיקומים בהתבסס על החיבורים
  function updatePositionsBasedOnConnections(mainBlock, otherBlocks, connections) {
    // מיפוי ID לבלוק
    const idToBlock = {};
    otherBlocks.forEach(block => {
      idToBlock[block.id] = block;
    });
    idToBlock[mainBlock.id] = mainBlock;
    
    // מעקב אחר בלוקים שכבר עודכנו
    const updatedBlocks = new Set([mainBlock.id]);
    
    // עדכן באופן חוזר עד שכל הבלוקים מעודכנים
    let somethingChanged = true;
    let iterations = 0;
    const MAX_ITERATIONS = otherBlocks.length * 2; // הגנה מפני לולאה אינסופית
    
    while (somethingChanged && iterations < MAX_ITERATIONS) {
      somethingChanged = false;
      iterations++;
      
      // עבור על כל החיבורים
      for (const conn of connections) {
        const fromBlock = idToBlock[conn.from];
        const toBlock = idToBlock[conn.to];
        
        // אם אחד הבלוקים עודכן והשני לא
        if ((updatedBlocks.has(conn.from) && !updatedBlocks.has(conn.to)) ||
            (updatedBlocks.has(conn.to) && !updatedBlocks.has(conn.from)) ||
            SIMPLE_CONFIG.ALWAYS_UPDATE_GROUP) {
          
          if (conn.direction === 'left') {
            // בלוק הנוכחי מחובר לבלוק אחר משמאל
            if (updatedBlocks.has(conn.from)) {
              // חשב מיקום לבלוק שמאלי
              const fromLeft = parseFloat(fromBlock.style.left) || 0;
              const fromTop = parseFloat(fromBlock.style.top) || 0;
              
              // קבע את המיקום של הבלוק השמאלי
              // במקרה זה, הבלוק השמאלי צריך להיות משמאל לבלוק הנוכחי
              const distance = 9; // מרחק החיבור בפיקסלים
              toBlock.style.position = 'absolute';
              toBlock.style.left = (fromLeft - toBlock.offsetWidth + distance) + 'px';
              toBlock.style.top = fromTop + 'px';
              
              updatedBlocks.add(conn.to);
              somethingChanged = true;
            } else if (updatedBlocks.has(conn.to)) {
              // חשב מיקום לבלוק ימני
              const toLeft = parseFloat(toBlock.style.left) || 0;
              const toTop = parseFloat(toBlock.style.top) || 0;
              
              // קבע את המיקום של הבלוק הימני
              const distance = 9; // מרחק החיבור בפיקסלים
              fromBlock.style.position = 'absolute';
              fromBlock.style.left = (toLeft + toBlock.offsetWidth - distance) + 'px';
              fromBlock.style.top = toTop + 'px';
              
              updatedBlocks.add(conn.from);
              somethingChanged = true;
            }
          } else if (conn.direction === 'right') {
            // בלוק הנוכחי מחובר לבלוק אחר מימין
            if (updatedBlocks.has(conn.from)) {
              // חשב מיקום לבלוק ימני
              const fromLeft = parseFloat(fromBlock.style.left) || 0;
              const fromTop = parseFloat(fromBlock.style.top) || 0;
              
              // קבע את המיקום של הבלוק הימני
              const distance = 9; // מרחק החיבור בפיקסלים
              toBlock.style.position = 'absolute';
              toBlock.style.left = (fromLeft + fromBlock.offsetWidth - distance) + 'px';
              toBlock.style.top = fromTop + 'px';
              
              updatedBlocks.add(conn.to);
              somethingChanged = true;
            } else if (updatedBlocks.has(conn.to)) {
              // חשב מיקום לבלוק שמאלי
              const toLeft = parseFloat(toBlock.style.left) || 0;
              const toTop = parseFloat(toBlock.style.top) || 0;
              
              // קבע את המיקום של הבלוק השמאלי
              const distance = 9; // מרחק החיבור בפיקסלים
              fromBlock.style.position = 'absolute';
              fromBlock.style.left = (toLeft - fromBlock.offsetWidth + distance) + 'px';
              fromBlock.style.top = toTop + 'px';
              
              updatedBlocks.add(conn.from);
              somethingChanged = true;
            }
          }
        }
      }
    }
    
    // אם יש בלוקים שעדיין לא עודכנו, נסה לעדכן אותם
    if (updatedBlocks.size < otherBlocks.length + 1) {
      log("Warning: Some blocks were not updated");
    }
  }
  
  // המתנה לאתחול המערכת
  setTimeout(initialize, SIMPLE_CONFIG.WAIT_MS);
  
  // חשיפת API ציבורי
  window.SimpleGroupDrag = {
    toggle: function() {
      isActive = !isActive;
      log(`Group dragging ${isActive ? 'enabled' : 'disabled'}`);
      return isActive;
    },
    
    status: function() {
      return {
        initialized: isInitialized,
        active: isActive
      };
    },
    
    restart: function() {
      if (checkTimer) clearInterval(checkTimer);
      isInitialized = false;
      initialize();
      return "Restarted";
    }
  };
})();

// --- End Simple Group Dragging v1.0 ---
