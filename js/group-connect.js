// --- LINKAGE-GROUP-DRAG-SIMPLIFIED.JS (עם דיבאג ב-onMouseMove) ---
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
    debug: true,                       // האם להדפיס הודעות דיבאג בקונסול (מלבד הדיבאג הנרחב ב-onMouseMove)
    groupMinSize: 2,                   // גודל מינימלי לקבוצה (מספר בלוקים)
    leaderHighlightColor: '#FFA500',   // צבע ההדגשה לבלוק המוביל (כתום) - לא בשימוש פעיל בקוד זה כרגע להדגשה ויזואלית
    dragZIndex: 1000,                  // z-index לבלוקים בזמן גרירה
    dragOpacity: 0.95                  // אטימות בזמן גרירה
  };
  
  // === פונקציות עזר ===
  
  // הדפסת הודעות דיבאג
  function log(message, data) {
    if (config.debug) {
      if (data !== undefined) { // בדיקה מפורשת ל-undefined כדי לאפשר הדפסת false, 0, null
        console.log(`[GroupDrag] ${message}`, data);
      } else {
        console.log(`[GroupDrag] ${message}`);
      }
    }
  }

  // קבלת כל הבלוקים באזור התכנות
  function getAllBlocks() {
    return Array.from(document.querySelectorAll('#program-blocks .block-container'));
  }

  // מציאת הבלוק המוביל (השמאלי ביותר) של קבוצה שאליה שייך בלוק נתון
  function findLeaderOfBlock(blockElement) {
    let current = blockElement;
    const visitedInLoop = new Set(); // למניעת לולאות מקומיות בחיפוש מוביל
    visitedInLoop.add(current.id);

    // נווט שמאלה עד שתגיע לבלוק שאין לו חיבור משמאל, או לבלוק שכבר סומן כמוביל
    while (current.dataset.connectedFromLeft && document.getElementById(current.dataset.connectedFromLeft) && !current.dataset.isGroupLeader) {
      let prevBlockId = current.dataset.connectedFromLeft;
      let prevBlock = document.getElementById(prevBlockId);
      if (!prevBlock || prevBlock === current || visitedInLoop.has(prevBlockId)) { // מניעת לולאה אינסופית
        log('אזהרה: זוהתה לולאה או חוסר עקביות בחיפוש מוביל שמאלי.', {currentId: current.id, prevBlockId: prevBlockId});
        break; 
      }
      current = prevBlock;
      visitedInLoop.add(current.id);
    }
    return current;
  }
  
  // מציאת כל הבלוקים המחוברים לבלוק נתון (ימינה)
  function findConnectedBlocks(startBlock) {
    const connected = [startBlock];
    let current = startBlock;
    const visited = new Set(); // למניעת לולאות אינסופיות במקרה של נתונים פגומים
    visited.add(current.id);

    while (current.dataset.connectedTo) {
      const nextBlockId = current.dataset.connectedTo;
      const nextBlock = document.getElementById(nextBlockId);
      if (nextBlock && !visited.has(nextBlockId)) {
        connected.push(nextBlock);
        current = nextBlock;
        visited.add(current.id);
      } else {
        if (nextBlock && visited.has(nextBlockId)) {
          log('אזהרה: זוהתה לולאה בחיבור בלוקים בעת סריקת קבוצה.', {startBlockId: startBlock.id, currentId: current.id, nextId: nextBlockId});
        }
        break; // אין בלוק הבא או שזוהתה לולאה
      }
    }
    return connected;
  }

  // סריקת כל הבלוקים וסימון מובילי קבוצות
  function scanAndMarkLeaders() {
    log('סריקה אוטומטית של קבוצות בלוקים');
    const allBlocks = getAllBlocks();
    let groupCount = 0;

    // נקה סימונים קודמים של מובילים
    allBlocks.forEach(block => {
      delete block.dataset.isGroupLeader;
      // block.style.border = block.dataset.originalBorder || ''; // שחזר גבול מקורי אם יש (כרגע לא בשימוש)
    });

    const processedLeaders = new Set(); // למנוע עיבוד כפול של אותה קבוצה

    allBlocks.forEach(block => {
      // אם הבלוק כבר טופל כחלק מקבוצה ידועה, דלג
      if (processedLeaders.has(findLeaderOfBlock(block).id) && !block.dataset.isGroupLeader) {
          return;
      }
      
      const leader = findLeaderOfBlock(block);
      // אם המוביל הזה כבר סומן (למשל, אם הבלוק הנוכחי הוא המוביל עצמו), אל תספור מחדש
      if(leader.dataset.isGroupLeader) {
        // ודא שכל חברי הקבוצה שלו מסומנים כחלק ממנה (למקרה שהקבוצה טופלה דרך חבר אחר שלה)
         const groupForThisLeader = findConnectedBlocks(leader);
         if (groupForThisLeader.length >= config.groupMinSize) {
            groupForThisLeader.forEach(member => processedLeaders.add(member.id));
         }
        return;
      }

      const group = findConnectedBlocks(leader);

      if (group.length >= config.groupMinSize) {
        groupCount++;
        leader.dataset.isGroupLeader = 'true';
        group.forEach(member => processedLeaders.add(member.id)); // סמן את כל חברי הקבוצה כמעובדים דרך מוביל זה
        log(`זוהתה קבוצה עם מוביל: ${leader.id}, גודל: ${group.length}, חברים: ${group.map(b=>b.id).join(',')}`);
      }
    });
    log(`נמצאו ${groupCount} קבוצות בלוקים העומדות בתנאי המינימום.`);
  }

  // === אירועי עכבר ===
  
  function onMouseDown(event) {
    let targetBlock = event.target.closest('.block-container');
    
    // בדוק אם הלחיצה היא על כפתור המחיקה או אלמנט אינטראקטיבי אחר בתוך הבלוק שאמור למנוע גרירה
    if (event.target.closest('.delete-button') || event.target.closest('input, select, textarea, button:not(.block-container)')) {
        log('לחיצה על אלמנט פנימי, גרירת קבוצה מבוטלת.');
        return;
    }

    if (!targetBlock || !targetBlock.parentElement || targetBlock.parentElement.id !== 'program-blocks') {
        // אם הלחיצה לא על בלוק ישירות, או על בלוק בתוך פלטה, התעלם
        return;
    }

    log(`MouseDown על בלוק: ${targetBlock.id}`);

    let leaderCandidate = findLeaderOfBlock(targetBlock);
    const currentGroup = findConnectedBlocks(leaderCandidate);

    if (currentGroup.length >= config.groupMinSize) {
      isGroupDragging = true;
      groupLeader = leaderCandidate;
      groupBlocks = currentGroup;
      
      log(`מתחיל גרירת קבוצה. מוביל: ${groupLeader.id}, בלוקים בקבוצה: ${groupBlocks.map(b => b.id).join(', ')}`);

      const leaderRect = groupLeader.getBoundingClientRect(); // מיקום יחסי ל-viewport
      
      // האלמנט #program-blocks הוא מיכל הבלוקים שהמיקומים `left` ו-`top` שלהם יחסיים אליו
      const programBlocksElem = document.getElementById('program-blocks');
      if (!programBlocksElem) {
        console.error('[GroupDrag] onMouseDown: #program-blocks element not found!');
        isGroupDragging = false; // בטל גרירה אם המיכל לא נמצא
        return;
      }
      const programBlocksRect = programBlocksElem.getBoundingClientRect();
      
      // ההיסט של העכבר הוא מנקודת הלחיצה (event.clientX/Y)
      // לנקודה השמאלית-עליונה של הבלוק המוביל, אך מנורמל לתוך מערכת הקואורדינטות של programBlocksElem
      dragOffset.x = event.clientX - (leaderRect.left - programBlocksRect.left);
      dragOffset.y = event.clientY - (leaderRect.top - programBlocksRect.top);

      startPositions = groupBlocks.map(block => {
        const style = window.getComputedStyle(block);
        return {
          block: block,
          left: parseFloat(style.left) || 0,
          top: parseFloat(style.top) || 0,
          originalZIndex: style.zIndex,
          originalOpacity: style.opacity
        };
      });

      groupBlocks.forEach(block => { // שים לב: groupBlocks הוא מערך של אלמנטים, לא של אובייקטים מ-startPositions
        block.style.zIndex = config.dragZIndex;
        block.style.opacity = config.dragOpacity;
        block.style.userSelect = 'none'; 
      });
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      event.preventDefault(); 
    } else {
      log(`הבלוק ${targetBlock.id} אינו חלק מקבוצה העומדת בתנאים (מוביל: ${leaderCandidate.id}, גודל קבוצה שנמצאה: ${currentGroup.length})`);
    }
  }

  // --- פונקציית onMouseMove עם הדפסות דיבאג ---
  function onMouseMove(event) {
    if (!isGroupDragging) {
      // console.log('[GroupDrag Debug] onMouseMove called but isGroupDragging is false'); // בטל הערה אם יש ספק
      return;
    }

    console.log('[GroupDrag Debug] onMouseMove START'); // הודעת התחלה

    const programBlocksElem = document.getElementById('program-blocks'); 
    if (!programBlocksElem) {
        console.error('[GroupDrag Debug] onMouseMove: #program-blocks element not found!');
        return;
    }
    const programBlocksRect = programBlocksElem.getBoundingClientRect();

    // מיקום חדש של הבלוק המוביל, יחסית למיכל הבלוקים
    let newLeaderX = event.clientX - programBlocksRect.left - dragOffset.x;
    let newLeaderY = event.clientY - programBlocksRect.top - dragOffset.y;
    
    // אם מיכל הבלוקים (#program-blocks) יכול להיגלל, יש להוסיף את ערכי הגלילה:
    // newLeaderX += programBlocksElem.scrollLeft;
    // newLeaderY += programBlocksElem.scrollTop;

    console.log(`[GroupDrag Debug] event.clientX: ${event.clientX}, event.clientY: ${event.clientY}`);
    console.log(`[GroupDrag Debug] programBlocksRect.left: ${programBlocksRect.left}, programBlocksRect.top: ${programBlocksRect.top}`);
    console.log(`[GroupDrag Debug] dragOffset.x: ${dragOffset.x}, dragOffset.y: ${dragOffset.y}`);
    console.log(`[GroupDrag Debug] Calculated newLeaderX: ${newLeaderX}, newLeaderY: ${newLeaderY}`);

    // מציאת המיקום ההתחלתי של הבלוק המוביל
    const leaderStartPosData = startPositions.find(p => p.block === groupLeader);
    if (!leaderStartPosData) {
        console.error('[GroupDrag Debug] Could not find start position for groupLeader:', groupLeader);
        return;
    }
    const leaderStartLeft = leaderStartPosData.left;
    const leaderStartTop = leaderStartPosData.top;

    console.log(`[GroupDrag Debug] Leader startPos: left=${leaderStartLeft}, top=${leaderStartTop}`);

    // חישוב ההפרש מהמיקום המקורי של המוביל
    const deltaX = newLeaderX - leaderStartLeft;
    const deltaY = newLeaderY - leaderStartTop;

    console.log(`[GroupDrag Debug] deltaX: ${deltaX}, deltaY: ${deltaY}`);

    if (isNaN(deltaX) || isNaN(deltaY)) {
        console.error('[GroupDrag Debug] deltaX or deltaY is NaN. Halting movement.');
        return;
    }

    groupBlocks.forEach((block, index) => { // block הוא אלמנט DOM
      const originalPos = startPositions.find(p => p.block === block); // מצא את המידע ההתחלתי עבור הבלוק הספציפי הזה
      if (!originalPos) {
          console.error(`[GroupDrag Debug] No startPosition data for block ${block.id} at index ${index}`);
          return;
      }

      const newBlockX = originalPos.left + deltaX;
      const newBlockY = originalPos.top + deltaY;

      console.log(`[GroupDrag Debug] Updating block: ${block.id}. Old L/T: ${originalPos.left}/${originalPos.top}. New L/T: ${newBlockX}/${newBlockY}`);
      
      block.style.left = `${newBlockX}px`;
      block.style.top = `${newBlockY}px`;
    });

    event.preventDefault();
    console.log('[GroupDrag Debug] onMouseMove END'); // הודעת סיום
  }
  // --- סוף פונקציית onMouseMove עם דיבאג ---


  function onMouseUp(event) {
    if (!isGroupDragging) return;

    log(`סיום גרירת קבוצה. מוביל: ${groupLeader ? groupLeader.id : 'unknown'}`);
    
    // שחזור סגנונות מקוריים לכל הבלוקים בקבוצה
    startPositions.forEach(posData => { // startPositions מכיל את המידע המקורי, כולל הבלוק עצמו
        if (posData.block) {
            posData.block.style.zIndex = posData.originalZIndex;
            posData.block.style.opacity = posData.originalOpacity;
            posData.block.style.userSelect = ''; 
        }
    });


    isGroupDragging = false;
    groupLeader = null;
    groupBlocks = [];
    startPositions = [];

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    // אין צורך להריץ כאן scanAndMarkLeaders באופן יזום,
    // כי ה-MutationObserver אמור לטפל בזה אם מאפייני החיבור ישתנו כתוצאה מפעולת snap של linkageimproved
    // אם הגרירה עצמה (ללא snap) משנה את האפשרות לחיבורים, linkageimproved אמור לטפל בזה.
    // scanAndMarkLeaders יפעל אוטומטית אם linkageimproved ישנה data-attributes.
  }

  // === אתחול ===
  
  function init() {
    if (window.groupDragInitialized_v1_0_0_debug) { // שינוי שם המשתנה למניעת התנגשות עם גרסאות קודמות
      log('מודול גרירת קבוצות (עם דיבאג) כבר אותחל.');
      return;
    }
    log('אתחול מודול גרירת קבוצות (עם דיבאג ב-onMouseMove)');
    
    try {
      const programBlocksDiv = document.getElementById('program-blocks');
      if (!programBlocksDiv) {
        console.error('[GroupDrag] אלמנט #program-blocks לא נמצא. המודול לא יאותחל.');
        return;
      }
      
      programBlocksDiv.addEventListener('mousedown', onMouseDown, false); 
      
      // אין צורך להוסיף סגנונות CSS דינמיים דרך JS אם הם כבר בקובץ CSS ראשי

      const observer = new MutationObserver(mutations => {
        let shouldUpdate = false;
        log('[GroupDrag MutationObserver] זוהו שינויים:', mutations); // דיבאג נוסף ל-Observer
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' || 
              (mutation.type === 'attributes' && 
               ['data-connected-to', 'data-connected-from-left', 'data-connected-from-right'].includes(mutation.attributeName))) {
            shouldUpdate = true;
            log(`[GroupDrag MutationObserver] שינוי רלוונטי זוהה: type=${mutation.type}, attribute=${mutation.attributeName}, target=${mutation.target.id || mutation.target.nodeName}`);
            break;
          }
        }
        
        if (shouldUpdate) {
          log('[GroupDrag MutationObserver] מבצע עדכון קבוצות (scanAndMarkLeaders) בעקבות שינוי.');
          setTimeout(scanAndMarkLeaders, 100); // השהיה קלה
        }
      });
      
      observer.observe(programBlocksDiv, { // שים לב: המאזין הוא על programBlocksDiv
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-connected-to', 'data-connected-from-left', 'data-connected-from-right']
      });
      log('[GroupDrag] משקיף לשינויים (MutationObserver) הופעל על #program-blocks');
      
      window.groupDragInitialized_v1_0_0_debug = true;
      log(`מודול גרירת קבוצות (עם דיבאג) אותחל בהצלחה. סף קבוצה: מינימום ${config.groupMinSize} בלוקים`);
      
      setTimeout(scanAndMarkLeaders, 500); 
      
    } catch (error) {
      console.error('[GroupDrag] שגיאה באתחול מודול גרירת קבוצות:', error);
    }
  }

  // הרצת האתחול כאשר ה-DOM מוכן
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
