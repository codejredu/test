// מודול גרירת קבוצות מתוקן - linkage-group-drag-simplified.js

(function() {
  console.log("[GroupDrag] אתחול מודול גרירת קבוצות");
  
  // הגדרות קונפיגורציה
  const GROUP_CONFIG = {
    GROUP_DRAG_Z_INDEX: 1000,
    MIN_BLOCKS_FOR_GROUP: 2,
    ANIM_DURATION: '0.1s',
    AUTO_SCAN_INTERVAL: 2000,
    SNAP_THRESHOLD: 20,      // מרחק סף להצמדה בין קבוצות
    CONNECTION_HIGHLIGHT: true
  };
  
  // משתנים גלובליים למודול
  let isGroupDragging = false;
  let currentDraggedGroup = [];
  let groupLeaderBlock = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let blockGroups = [];
  let autoScanInterval = null;
  
  // מזריק סגנונות CSS
  function injectStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .group-dragging {
        transition: none !important;
        opacity: 0.85 !important;
        z-index: ${GROUP_CONFIG.GROUP_DRAG_Z_INDEX} !important;
        transform: none !important;
      }
      
      .group-connection-highlight {
        box-shadow: 0 0 8px 2px rgba(0, 255, 0, 0.7) !important;
        outline: 2px solid rgba(0, 255, 0, 0.7) !important;
      }
    `;
    document.head.appendChild(styleEl);
    console.log("[GroupDrag] סגנונות גרירת קבוצות נוספו");
  }
  
  // פונקציה לאיתור קבוצות בלוקים מחוברים
  function findConnectedBlocks(startBlock) {
    if (!startBlock) return [];
    
    const connectedBlocks = [startBlock];
    const visited = new Set([startBlock.id]);
    
    // מצא את כל הבלוקים המחוברים
    function traverseConnections(block) {
      // בדוק חיבור ימינה
      const rightBlock = findConnectedBlockInDirection(block, 'right');
      if (rightBlock && !visited.has(rightBlock.id)) {
        visited.add(rightBlock.id);
        connectedBlocks.push(rightBlock);
        traverseConnections(rightBlock);
      }
      
      // בדוק חיבור שמאלה
      const leftBlock = findConnectedBlockInDirection(block, 'left');
      if (leftBlock && !visited.has(leftBlock.id)) {
        visited.add(leftBlock.id);
        connectedBlocks.push(leftBlock);
        traverseConnections(leftBlock);
      }
    }
    
    traverseConnections(startBlock);
    return connectedBlocks;
  }
  
  // פונקציה למציאת בלוק מחובר בכיוון מסוים
  function findConnectedBlockInDirection(block, direction) {
    // מימוש משופר להתחשב בכל הכיוונים
    const allBlocks = Array.from(document.querySelectorAll('.block'));
    
    if (direction === 'right') {
      // מצא בלוק הנמצא מימין וקרוב מספיק להיחשב כמחובר
      return allBlocks.find(otherBlock => {
        if (block.id === otherBlock.id) return false;
        
        const blockRect = block.getBoundingClientRect();
        const otherRect = otherBlock.getBoundingClientRect();
        
        // הבלוק צריך להיות בקו אחד אנכית ובדיוק מימין
        const verticalOverlap = 
          blockRect.top < otherRect.bottom && 
          blockRect.bottom > otherRect.top;
          
        const isToRight = 
          Math.abs(blockRect.right - otherRect.left) < 5;
        
        return verticalOverlap && isToRight;
      });
    } else if (direction === 'left') {
      // מצא בלוק הנמצא משמאל וקרוב מספיק להיחשב כמחובר
      return allBlocks.find(otherBlock => {
        if (block.id === otherBlock.id) return false;
        
        const blockRect = block.getBoundingClientRect();
        const otherRect = otherBlock.getBoundingClientRect();
        
        // הבלוק צריך להיות בקו אחד אנכית ובדיוק משמאל
        const verticalOverlap = 
          blockRect.top < otherRect.bottom && 
          blockRect.bottom > otherRect.top;
          
        const isToLeft = 
          Math.abs(blockRect.left - otherRect.right) < 5;
        
        return verticalOverlap && isToLeft;
      });
    }
    
    return null;
  }
  
  // מצא את הבלוק השמאלי ביותר בקבוצה
  function findLeftmostBlock(blocks) {
    return blocks.reduce((leftmost, block) => {
      const leftmostRect = leftmost.getBoundingClientRect();
      const blockRect = block.getBoundingClientRect();
      return blockRect.left < leftmostRect.left ? block : leftmost;
    }, blocks[0]);
  }
  
  // סורק את כל הקבוצות באזור התכנות
  function scanForBlockGroups() {
    console.log("[GroupDrag] סריקה אוטומטית של קבוצות בלוקים");
    blockGroups = [];
    
    // קבל את כל הבלוקים באזור התכנות
    const allBlocks = Array.from(document.querySelectorAll('.block'));
    const processedBlocks = new Set();
    
    // עבור על כל בלוק שעדיין לא עובד
    allBlocks.forEach(block => {
      if (processedBlocks.has(block.id)) return;
      
      // מצא את כל הבלוקים המחוברים לבלוק הנוכחי
      console.log(`[GroupDrag] מציאת בלוקים מחוברים מ-${block.id}`);
      const connectedBlocks = findConnectedBlocks(block);
      console.log(`[GroupDrag] נמצאו ${connectedBlocks.length} בלוקים מחוברים`);
      
      // הוסף את כל הבלוקים לרשימת המעובדים
      connectedBlocks.forEach(b => processedBlocks.add(b.id));
      
      // אם הקבוצה גדולה מספיק, הוסף אותה לרשימת הקבוצות
      if (connectedBlocks.length >= GROUP_CONFIG.MIN_BLOCKS_FOR_GROUP) {
        const leftmostBlock = findLeftmostBlock(connectedBlocks);
        console.log(`[GroupDrag] הבלוק השמאלי ביותר: ${leftmostBlock.id}`);
        blockGroups.push({
          blocks: connectedBlocks,
          leader: leftmostBlock
        });
      }
    });
    
    console.log(`[GroupDrag] נמצאו ${blockGroups.length} קבוצות בלוקים`);
  }
  
  // אירוע לחיצת עכבר על בלוק
  function handleGroupMouseDown(e) {
    if (isGroupDragging) return;
    
    // בדוק אם הבלוק שנלחץ שייך לקבוצה
    const block = e.target.closest('.block');
    if (!block) return;
    
    // מתי שיש שינוי, בצע סריקה חדשה של קבוצות
    scanForBlockGroups();
    
    // בדוק אם הבלוק הוא חלק מקבוצה
    const groupIndex = blockGroups.findIndex(group => 
      group.blocks.some(b => b.id === block.id)
    );
    
    if (groupIndex === -1) return;
    
    const group = blockGroups[groupIndex];
    
    // בדוק אם הבלוק שנלחץ הוא המוביל של הקבוצה
    if (block.id !== group.leader.id) {
      console.log(`[GroupDrag] לחיצה על בלוק שאינו המוביל (${block.id}). המוביל הוא: ${group.leader.id}`);
      // במקרה זה, אפשר את ההתנהגות הרגילה של המודול המקורי
      return;
    }
    
    // מקרה של גרירת קבוצה
    groupLeaderBlock = block;
    currentDraggedGroup = group.blocks;
    
    // חשב את ההיסט לגרירה
    const rect = block.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    
    // סמן את כל בלוקי הקבוצה
    currentDraggedGroup.forEach(b => {
      b.classList.add('group-dragging');
    });
    
    isGroupDragging = true;
    console.log(`[GroupDrag] התחלת גרירת קבוצה: ${currentDraggedGroup.length} בלוקים`);
    
    // מנע התנהגות ברירת מחדל ובועות
    e.preventDefault();
    e.stopPropagation();
    
    // הוסף מאזיני אירועים זמניים
    document.addEventListener('mousemove', handleGroupMouseMove);
    document.addEventListener('mouseup', handleGroupMouseUp);
  }
  
  // אירוע הזזת עכבר בזמן גרירת קבוצה
  function handleGroupMouseMove(e) {
    if (!isGroupDragging || !groupLeaderBlock) return;
    
    // חשב את המיקום החדש של הבלוק המוביל
    const newLeft = e.clientX - dragOffsetX;
    const newTop = e.clientY - dragOffsetY;
    
    // מקם את הבלוק המוביל
    groupLeaderBlock.style.left = `${newLeft}px`;
    groupLeaderBlock.style.top = `${newTop}px`;
    
    // נע את שאר הבלוקים בקבוצה יחסית למוביל
    updateGroupPosition(groupLeaderBlock, newLeft, newTop);
    
    // בדוק אם יש קבוצה אחרת קרובה מספיק לחיבור
    checkForGroupConnection();
  }
  
  // פונקציה לעדכון מיקום כל בלוקי הקבוצה
  function updateGroupPosition(leaderBlock, newLeft, newTop) {
    if (!leaderBlock || currentDraggedGroup.length === 0) return;
    
    // עדכן את המיקום של כל בלוק בקבוצה חוץ מהמוביל
    for (const block of currentDraggedGroup) {
      if (block.id === leaderBlock.id) continue;
      
      // חשב את המיקום היחסי לבלוק המוביל
      const leaderRect = leaderBlock.getBoundingClientRect();
      const blockRect = block.getBoundingClientRect();
      
      // שמור על המרחק היחסי בין הבלוקים
      const relativeLeft = newLeft + (blockRect.left - leaderRect.left);
      const relativeTop = newTop + (blockRect.top - leaderRect.top);
      
      // עדכן את מיקום הבלוק
      block.style.left = `${relativeLeft}px`;
      block.style.top = `${relativeTop}px`;
      
      // שימוש בפונקציית גיבוי כדי לוודא שהבלוק מתעדכן כראוי
      forceUpdateBlockPosition(block, relativeLeft, relativeTop);
    }
  }
  
  // פונקציית גיבוי לעדכון מיקום בלוק
  function forceUpdateBlockPosition(block, left, top) {
    if (!block) return;
    
    // נסה שיטות שונות להזזת הבלוק
    block.style.cssText = `position: absolute !important; left: ${left}px !important; top: ${top}px !important; z-index: ${GROUP_CONFIG.GROUP_DRAG_Z_INDEX} !important; margin: 0 !important; transform: none !important;`;
    
    // ניקוי טרנספורמציות ומעברים
    block.style.transition = 'none';
    block.style.transform = 'none';
    
    // הכרח את הדפדפן לרנדר מחדש (repaint)
    void block.offsetWidth;
  }
  
  // בדוק אם הקבוצה הנוכחית קרובה לקבוצה אחרת
  function checkForGroupConnection() {
    if (!isGroupDragging || blockGroups.length <= 1) return;
    
    // קבל את הקבוצה הנוכחית שנגררת
    const currentGroup = blockGroups.find(group => 
      group.blocks.some(b => b.id === groupLeaderBlock.id)
    );
    
    if (!currentGroup) return;
    
    // מצא את הבלוק הימני ביותר בקבוצה הנוכחית
    const rightmostBlock = currentGroup.blocks.reduce((rightmost, block) => {
      const rightmostRect = rightmost.getBoundingClientRect();
      const blockRect = block.getBoundingClientRect();
      return blockRect.right > rightmostRect.right ? block : rightmost;
    }, currentGroup.blocks[0]);
    
    // בדוק לכל קבוצה אחרת אם היא קרובה לחיבור
    for (const otherGroup of blockGroups) {
      // דלג על הקבוצה הנוכחית
      if (otherGroup.leader.id === currentGroup.leader.id) continue;
      
      // מצא את הבלוק השמאלי ביותר בקבוצה האחרת
      const leftmostOtherBlock = otherGroup.leader;
      
      // בדוק את המרחק בין הבלוקים
      const rightRect = rightmostBlock.getBoundingClientRect();
      const leftRect = leftmostOtherBlock.getBoundingClientRect();
      
      const horizontalDistance = Math.abs(rightRect.right - leftRect.left);
      const verticalDistance = Math.abs((rightRect.top + rightRect.height/2) - 
                                       (leftRect.top + leftRect.height/2));
      
      // אם המרחק קטן מסף ההצמדה, צור היילייט
      if (horizontalDistance <= GROUP_CONFIG.SNAP_THRESHOLD && 
          verticalDistance <= GROUP_CONFIG.SNAP_THRESHOLD) {
        
        console.log(`[GroupFix] הדגשת חיבור בין: ${rightmostBlock.id} -> ${leftmostOtherBlock.id}, מרחק: ${horizontalDistance.toFixed(1)}px `);
        
        if (GROUP_CONFIG.CONNECTION_HIGHLIGHT) {
          rightmostBlock.classList.add('group-connection-highlight');
          leftmostOtherBlock.classList.add('group-connection-highlight');
        }
        
        // אם קרוב מאוד, בצע הצמדה
        if (horizontalDistance <= 5 && verticalDistance <= 5) {
          connectGroups(currentGroup, otherGroup, rightmostBlock, leftmostOtherBlock);
          break;
        }
      } else {
        // הסר הדגשים אם אין התאמה
        rightmostBlock.classList.remove('group-connection-highlight');
        leftmostOtherBlock.classList.remove('group-connection-highlight');
      }
    }
  }
  
  // חבר שתי קבוצות
  function connectGroups(currentGroup, otherGroup, rightBlock, leftBlock) {
    console.log(`[GroupFix] חיבור קבוצות: ${currentGroup.leader.id} -> ${otherGroup.leader.id} `);
    
    // בצע סנאפ בין הבלוקים - כאן נדרש להשתמש במודול הבסיסי
    performSnap(rightBlock, leftBlock);
    
    // השמע צליל חיבור
    playConnectionSound();
    console.log(`[GroupFix] צליל חיבור הושמע `);
    
    // סיים את הגרירה
    isGroupDragging = false;
    
    // עדכן את הקבוצות לאחר החיבור
    setTimeout(() => {
      scanForBlockGroups();
      console.log(`[GroupFix] חיבור הושלם בהצלחה `);
    }, 100);
  }
  
  // פונקציית הצמדה שמטפלת גם בכיוון מימין לשמאל
  function performSnap(sourceBlock, targetBlock) {
    if (!sourceBlock || !targetBlock) return false;
    
    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    
    // חשב את המיקום החדש של הבלוק המקור
    const newLeft = targetRect.left - sourceRect.width;
    const newTop = targetRect.top;
    
    // עדכן את מיקום בלוק המקור
    sourceBlock.style.left = `${newLeft}px`;
    sourceBlock.style.top = `${newTop}px`;
    
    // עדכון מיקום הקבוצה כולה
    updateGroupPosition(groupLeaderBlock, newLeft, newTop);
    
    return true;
  }
  
  // השמע צליל חיבור (נניח שיש קובץ שמע מתאים)
  function playConnectionSound() {
    try {
      // אם קיים אובייקט אודיו מהמודול המקורי, השתמש בו
      if (window.snapAudio) {
        window.snapAudio.play();
      } else {
        // אחרת, צור אובייקט חדש
        const audio = new Audio('assets/sound/link.mp3');
        audio.volume = 0.5;
        audio.play();
      }
    } catch (err) {
      console.warn("שגיאה בהשמעת צליל:", err);
    }
  }
  
  // אירוע שחרור העכבר
  function handleGroupMouseUp(e) {
    if (!isGroupDragging) return;
    
    // הסר את כל הסימונים
    if (currentDraggedGroup.length > 0) {
      currentDraggedGroup.forEach(block => {
        block.classList.remove('group-dragging');
        block.classList.remove('group-connection-highlight');
      });
    }
    
    // אפס את מצב הגרירה
    isGroupDragging = false;
    console.log("[GroupDrag] סיום גרירת קבוצה");
    
    // הסר מאזיני אירועים זמניים
    document.removeEventListener('mousemove', handleGroupMouseMove);
    document.removeEventListener('mouseup', handleGroupMouseUp);
    
    // כאשר גרירת קבוצה מסתיימת, רענן את רשימת הקבוצות
    setTimeout(scanForBlockGroups, 100);
    
    // אם המודול המקורי חשף פונקציה לאיפוס, הפעל אותה
    if (window.resetBlockLinkageState) {
      window.resetBlockLinkageState();
    }
  }
  
  // עקוף את הפונקציות של המודול המקורי
  function monkeyPatchOriginalModule() {
    if (typeof window.handleMouseMove === 'function') {
      const originalMouseMove = window.handleMouseMove;
      window.handleMouseMove = function(e) {
        if (isGroupDragging) {
          return; // דלג על הטיפול המקורי אם גרירת קבוצה פעילה
        }
        return originalMouseMove.call(this, e);
      };
      console.log("[GroupFix] דורס פונקציות גרירת קבוצות ");
    }
    
    if (typeof window.handleMouseUp === 'function') {
      const originalMouseUp = window.handleMouseUp;
      window.handleMouseUp = function(e) {
        if (isGroupDragging) {
          return; // דלג על הטיפול המקורי אם גרירת קבוצה פעילה
        }
        return originalMouseUp.call(this, e);
      };
    }
  }
  
  // אתחול המודול
  function initializeGroupDragModule() {
    // הזרק סגנונות CSS
    injectStyles();
    
    // צור משקיף לשינויים באזור התכנות
    const observer = new MutationObserver(() => {
      if (!isGroupDragging) {
        scanForBlockGroups();
      }
    });
    
    // הוסף את המשקיף לאזור התכנות
    const programmingArea = document.querySelector('#programming-area') || document.body;
    observer.observe(programmingArea, { childList: true, subtree: true });
    console.log("[GroupDrag] משקיף לשינויים באזור התכנות הופעל");
    
    // סריקה ראשונית של קבוצות
    scanForBlockGroups();
    
    // הוסף האזנה לאירועי עכבר
    document.addEventListener('mousedown', handleGroupMouseDown, true);
    
    // עקוף את הפונקציות של המודול המקורי
    monkeyPatchOriginalModule();
    
    // אתחל סריקה אוטומטית מדי פעם
    autoScanInterval = setInterval(scanForBlockGroups, GROUP_CONFIG.AUTO_SCAN_INTERVAL);
    
    console.log(`[GroupDrag] מודול גרירת קבוצות אותחל בהצלחה (גרסה 1.0.0)`);
    console.log(`[GroupDrag] סף קבוצה: מינימום ${GROUP_CONFIG.MIN_BLOCKS_FOR_GROUP} בלוקים`);
    console.log(`[GroupFix] אתחול הושלם `);
  }
  
  // הפעלת המודול
  initializeGroupDragModule();
  
})();
