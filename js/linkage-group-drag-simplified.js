// --- LINKAGE-GROUP-DRAG-SIMPLIFIED.JS v1.0.0 ---
// מודול פשוט לגרירת קבוצות בלוקים מחוברים

(function() {
  'use strict';
  
  // === משתנים גלובליים ===
  let isGroupDragging = false;         // האם מתבצעת כרגע גרירת קבוצה
  let groupLeader = null;              // הבלוק המוביל (השמאלי ביותר) בקבוצה
  let groupBlocks = [];                // כל הבלוקים בקבוצה
  let dragOffset = { x: 0, y: 0 };     // ההיסט של נקודת הלחיצה מפינת הבלוק המוביל
  let startPositions = [];             // מיקומים מקוריים של כל הבלוקים בתחילת הגרירה
  
  // === הגדרות ===
  const config = {
    debug: true,                       // האם להדפיס הודעות דיבאג בקונסול
    groupMinSize: 2,                   // גודל מינימלי לקבוצה (מספר בלוקים)
    leaderHighlightColor: '#FFA500',   // צבע ההדגשה לבלוק המוביל (כתום)
    dragZIndex: 1000,                  // z-index לבלוקים בזמן גרירה
    dragOpacity: 0.95                  // אטימות בזמן גרירה
  };
  
  // === פונקציות עזר ===
  
  // הדפסת הודעות דיבאג
  function log(message, data) {
    if (config.debug) {
      if (data) {
        console.log(`[GroupDrag] ${message}`, data);
      } else {
        console.log(`[GroupDrag] ${message}`);
      }
    }
  }
  
  // מציאת כל הבלוקים המחוברים
  function findConnectedBlocks(startBlock) {
    if (!startBlock) return [];
    
    log(`מציאת בלוקים מחוברים מ-${startBlock.id}`);
    
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
    
    log(`נמצאו ${result.length} בלוקים מחוברים`);
    return result;
  }
  
  // מציאת הבלוק השמאלי ביותר (המוביל)
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
    
    log(`הבלוק השמאלי ביותר: ${leftmost.id}`);
    return leftmost;
  }
  
  // שמירת המיקום המקורי של בלוקים לפני גרירה
  function storeBlockPositions(blocks) {
    const positions = [];
    const programArea = document.getElementById('program-blocks');
    const areaRect = programArea.getBoundingClientRect();
    
    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      positions.push({
        id: block.id,
        left: rect.left - areaRect.left + programArea.scrollLeft,
        top: rect.top - areaRect.top + programArea.scrollTop
      });
    }
    
    return positions;
  }
  
  // סימון הבלוק המוביל עם נקודה כתומה
  function markLeaderBlock(block) {
    if (!block) return;
    
    // הסר סימון קיים
    clearLeaderMarkers();
    
    // הוסף מחלקת CSS לבלוק המוביל
    block.classList.add('group-leader');
    
    // ודא שיש בו סגנון CSS להדגשה
    if (!document.getElementById('group-leader-style')) {
      const style = document.createElement('style');
      style.id = 'group-leader-style';
      style.textContent = `
        .group-leader {
          position: relative;
        }
        .group-leader::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 12px;
          height: 12px;
          background-color: ${config.leaderHighlightColor};
          border-radius: 50%;
          box-shadow: 0 0 5px rgba(255, 165, 0, 0.8);
          z-index: 1001;
          pointer-events: none;
        }
        .group-dragging {
          opacity: ${config.dragOpacity};
          z-index: ${config.dragZIndex} !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // הסרת סימוני מוביל מכל הבלוקים
  function clearLeaderMarkers() {
    document.querySelectorAll('.group-leader').forEach(block => {
      block.classList.remove('group-leader');
    });
  }
  
  // === מאזיני אירועים ===
  
  // טיפול בלחיצת עכבר על בלוק
  function handleMouseDown(e) {
    // וודא שזו לחיצה ראשית
    if (e.button !== 0) return;
    
    // התעלם מאלמנטים אינטראקטיביים
    if (e.target.matches('input, button, select, a, textarea')) return;
    
    // מצא את הבלוק שנלחץ
    const block = e.target.closest('.block-container');
    if (!block || !block.parentElement || block.parentElement.id !== 'program-blocks') return;
    
    // בדוק אם הבלוק חלק מקבוצה (מחובר לבלוק אחר)
    const isConnected = block.hasAttribute('data-connected-to') || 
                        block.hasAttribute('data-connected-from-left') || 
                        block.hasAttribute('data-connected-from-right');
    
    if (!isConnected) return;
    
    // מצא את כל הבלוקים המחוברים
    const allConnected = findConnectedBlocks(block);
    
    // בדוק אם יש מספיק בלוקים לקבוצה
    if (allConnected.length < config.groupMinSize) {
      log(`לא מספיק בלוקים לקבוצה: ${allConnected.length}`);
      return;
    }
    
    // מצא את הבלוק השמאלי ביותר (המוביל)
    const leader = findLeftmostBlock(allConnected);
    
    // אם לחצו על בלוק שאינו המוביל, סמן את המוביל ואל תתחיל גרירה
    if (block !== leader) {
      log(`לחיצה על בלוק שאינו המוביל (${block.id}). המוביל הוא: ${leader.id}`);
      markLeaderBlock(leader);
      // לא מונעים את האירוע המקורי במקרה זה
      return;
    }
    
    // מכאן והלאה מטפלים בגרירת קבוצה
    log(`התחלת גרירת קבוצה: ${allConnected.length} בלוקים`);
    
    // מנע את הטיפול באירוע על ידי הקוד המקורי
    e.preventDefault();
    e.stopPropagation();
    
    // שמור את הפרטים על הקבוצה
    isGroupDragging = true;
    groupLeader = leader;
    groupBlocks = allConnected;
    
    // שמור את מיקום הלחיצה ביחס לפינת הבלוק המוביל
    const rect = leader.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    // שמור את המיקומים ההתחלתיים של כל הבלוקים
    startPositions = storeBlockPositions(groupBlocks);
    
    // סמן את כל הבלוקים בקבוצה
    for (const groupBlock of groupBlocks) {
      groupBlock.classList.add('group-dragging');
      groupBlock.style.zIndex = config.dragZIndex;
    }
    
    // סמן את המוביל
    markLeaderBlock(leader);
    
    // הוסף מאזינים זמניים לגרירה
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  // טיפול בתזוזת העכבר בזמן גרירה
  function handleMouseMove(e) {
    if (!isGroupDragging || !groupLeader) return;
    
    // מנע ברירת מחדל ומניעת התפשטות
    e.preventDefault();
    e.stopPropagation();
    
    // חשב את המיקום החדש
    const programArea = document.getElementById('program-blocks');
    const areaRect = programArea.getBoundingClientRect();
    
    // חשב את ההיסט החדש מהמיקום המקורי
    const newX = e.clientX - areaRect.left - dragOffset.x + programArea.scrollLeft;
    const newY = e.clientY - areaRect.top - dragOffset.y + programArea.scrollTop;
    
    // חשב את ההפרש מהמיקום המקורי של המוביל
    const deltaX = newX - startPositions[0].left;
    const deltaY = newY - startPositions[0].top;
    
    // עדכן את המיקום של כל הבלוקים בקבוצה
    updateGroupPosition(deltaX, deltaY);
  }
  
  // עדכון מיקום כל הבלוקים בקבוצה
  function updateGroupPosition(deltaX, deltaY) {
    if (!groupBlocks.length || !startPositions.length) return;
    
    const programArea = document.getElementById('program-blocks');
    
    // עבור על כל הבלוקים ועדכן את המיקום שלהם
    for (let i = 0; i < groupBlocks.length; i++) {
      const block = groupBlocks[i];
      const startPos = startPositions[i];
      
      if (!block || !startPos) continue;
      
      // חשב מיקום חדש
      const newLeft = startPos.left + deltaX;
      const newTop = startPos.top + deltaY;
      
      // הגבל את המיקום לגבולות אזור התכנות
      const limitedLeft = Math.max(0, Math.min(newLeft, programArea.scrollWidth - block.offsetWidth));
      const limitedTop = Math.max(0, Math.min(newTop, programArea.scrollHeight - block.offsetHeight));
      
      // עדכן את מיקום הבלוק
      block.style.position = 'absolute';
      block.style.left = `${Math.round(limitedLeft)}px`;
      block.style.top = `${Math.round(limitedTop)}px`;
      block.style.margin = '0';
    }
  }
  
  // טיפול בשחרור העכבר
  function handleMouseUp(e) {
    if (!isGroupDragging) return;
    
    log(`סיום גרירת קבוצה`);
    
    // מנע את התפשטות האירוע
    e.preventDefault();
    e.stopPropagation();
    
    // הסר את מאזיני הגרירה הזמניים
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // שחרר את מצב הגרירה
    for (const block of groupBlocks) {
      block.classList.remove('group-dragging');
      block.style.zIndex = '';
    }
    
    // נקה את המשתנים הגלובליים של הגרירה
    isGroupDragging = false;
    groupLeader = null;
    groupBlocks = [];
    startPositions = [];
  }
  
  // סריקה אוטומטית של בלוקים מחוברים וסימון מובילים
  function scanAndMarkLeaders() {
    log(`סריקה אוטומטית של קבוצות בלוקים`);
    
    // מצא את כל הבלוקים המחוברים
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    
    // נקה סימונים קודמים
    clearLeaderMarkers();
    
    // מצא את כל הבלוקים המחוברים
    const connectedBlocks = Array.from(programArea.querySelectorAll(
      '.block-container[data-connected-to], .block-container[data-connected-from-left], .block-container[data-connected-from-right]'
    ));
    
    // אוסף קבוצות ייחודיות
    const processedGroups = new Set();
    const groups = [];
    
    // עבור על כל הבלוקים המחוברים
    for (const block of connectedBlocks) {
      // דלג על בלוקים שכבר עובדו
      if (processedGroups.has(block.id)) continue;
      
      // מצא את כל הבלוקים בקבוצה
      const group = findConnectedBlocks(block);
      if (group.length < config.groupMinSize) continue;
      
      // הוסף את כל הבלוקים בקבוצה לרשימת המעובדים
      for (const groupBlock of group) {
        processedGroups.add(groupBlock.id);
      }
      
      // מצא את המוביל (השמאלי ביותר)
      const leader = findLeftmostBlock(group);
      if (leader) {
        // סמן אותו
        markLeaderBlock(leader);
        groups.push(group);
      }
    }
    
    log(`נמצאו ${groups.length} קבוצות בלוקים`);
  }
  
  // === אתחול המודול ===
  function initModule() {
    log('אתחול מודול גרירת קבוצות');
    
    try {
      // הוסף מאזין לחיצה עבור כל אזור התכנות
      document.addEventListener('mousedown', handleMouseDown, true);
      
      // סרוק וסמן את המובילים של כל הקבוצות
      scanAndMarkLeaders();
      
      // הוסף מאזין למוטציות של ה-DOM כדי לעדכן סימוני מובילים
      const observer = new MutationObserver((mutations) => {
        // בדוק אם יש שינויים רלוונטיים
        let shouldUpdate = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' || 
              (mutation.type === 'attributes' && 
               ['data-connected-to', 'data-connected-from-left', 'data-connected-from-right'].includes(mutation.attributeName))) {
            shouldUpdate = true;
            break;
          }
        }
        
        if (shouldUpdate) {
          // השהה מעט את העדכון כדי לאפשר לכל השינויים להתבצע
          setTimeout(scanAndMarkLeaders, 100);
        }
      });
      
      // הפעל את המאזין למוטציות
      const programArea = document.getElementById('program-blocks');
      if (programArea) {
        observer.observe(programArea, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-connected-to', 'data-connected-from-left', 'data-connected-from-right']
        });
      }
      
      // סמן שהמודול אותחל
      window.groupDragInitialized = true;
      log('מודול גרירת קבוצות אותחל בהצלחה');
      
      // בצע סריקה נוספת אחרי זמן קצר (לטיפול במקרה שבלוקים כבר קיימים)
      setTimeout(scanAndMarkLeaders, 1000);
    } catch (error) {
      console.error('[GroupDrag] שגיאה באתחול מודול גרירת קבוצות:', error);
    }
  }
  
  // הפעל את האתחול כשהדף נטען
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModule);
  } else {
    // הדף כבר נטען, אתחל מיד
    initModule();
  }
  
})();
