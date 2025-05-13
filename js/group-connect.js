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

  // קבלת כל הבלוקים באזור התכנות
  function getAllBlocks() {
    return Array.from(document.querySelectorAll('#program-blocks .block-container'));
  }

  // מציאת הבלוק המוביל (השמאלי ביותר) של קבוצה שאליה שייך בלוק נתון
  function findLeaderOfBlock(blockElement) {
    let current = blockElement;
    // נווט שמאלה עד שתגיע לבלוק שאין לו חיבור משמאל, או לבלוק שכבר סומן כמוביל
    while (current.dataset.connectedFromLeft && document.getElementById(current.dataset.connectedFromLeft) && !current.dataset.isGroupLeader) {
      let prevBlockId = current.dataset.connectedFromLeft;
      let prevBlock = document.getElementById(prevBlockId);
      if (!prevBlock || prevBlock === current) break; // מניעת לולאה אינסופית
      current = prevBlock;
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
      block.style.border = block.dataset.originalBorder || ''; // שחזר גבול מקורי אם יש
    });

    allBlocks.forEach(block => {
      // אם הבלוק כבר נבדק כחלק מקבוצה אחרת, דלג
      if (allBlocks.find(b => b.dataset.isGroupLeader && findConnectedBlocks(b).includes(block) && b !== block)) {
          return;
      }

      const leader = findLeaderOfBlock(block);
      const group = findConnectedBlocks(leader);

      if (group.length >= config.groupMinSize) {
        groupCount++;
        leader.dataset.isGroupLeader = 'true';
        // ניתן להוסיף כאן הדגשה ויזואלית למוביל אם רוצים
        // leader.dataset.originalBorder = leader.style.border;
        // leader.style.border = `2px solid ${config.leaderHighlightColor}`;
        log(`זוהתה קבוצה עם מוביל: ${leader.id}, גודל: ${group.length}`);
      }
    });
    log(`נמצאו ${groupCount} קבוצות בלוקים`);
  }

  // === אירועי עכבר ===
  
  function onMouseDown(event) {
    let targetBlock = event.target.closest('.block-container');
    if (!targetBlock || !targetBlock.parentElement || targetBlock.parentElement.id !== 'program-blocks') {
        // אם הלחיצה לא על בלוק ישירות, או על בלוק בתוך פלטה, התעלם
        return;
    }

    log('MouseDown על בלוק:', targetBlock.id);

    let leaderCandidate = findLeaderOfBlock(targetBlock);
    const currentGroup = findConnectedBlocks(leaderCandidate);

    if (currentGroup.length >= config.groupMinSize) {
      isGroupDragging = true;
      groupLeader = leaderCandidate;
      groupBlocks = currentGroup;
      
      log(`מתחיל גרירת קבוצה. מוביל: ${groupLeader.id}, בלוקים בקבוצה: ${groupBlocks.map(b => b.id).join(', ')}`);

      const leaderRect = groupLeader.getBoundingClientRect();
      const programAreaRect = document.getElementById('programming-area').getBoundingClientRect();
      
      // חשב היסט ביחס ל-programming-area כדי לתמוך בגלילה
      dragOffset.x = event.clientX - (leaderRect.left - programAreaRect.left);
      dragOffset.y = event.clientY - (leaderRect.top - programAreaRect.top);

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

      groupBlocks.forEach(data => {
        data.block.style.zIndex = config.dragZIndex;
        data.block.style.opacity = config.dragOpacity;
        // מניעת בחירת טקסט בזמן גרירה
        data.block.style.userSelect = 'none'; 
      });
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      event.preventDefault(); // מניעת התנהגות ברירת מחדל של גרירה (כמו גרירת תמונה)
    } else {
      log(`הבלוק ${targetBlock.id} אינו חלק מקבוצה (או שהקבוצה קטנה מדי)`);
    }
  }

  function onMouseMove(event) {
    if (!isGroupDragging) return;

    // קבל את גבולות אזור התכנות כדי לוודא שהבלוקים לא יוצאים ממנו (אופציונלי)
    const programArea = document.getElementById('programming-area');
    const programAreaRect = programArea.getBoundingClientRect();

    // מיקום חדש של הבלוק המוביל, יחסית ל-programming-area
    let newLeaderX = event.clientX - programAreaRect.left - dragOffset.x;
    let newLeaderY = event.clientY - programAreaRect.top - dragOffset.y;
    
    // חישוב ההפרש מהמיקום המקורי של המוביל
    const deltaX = newLeaderX - startPositions.find(p => p.block === groupLeader).left;
    const deltaY = newLeaderY - startPositions.find(p => p.block === groupLeader).top;

    groupBlocks.forEach((block, index) => {
      const originalPos = startPositions[index];
      block.style.left = `${originalPos.left + deltaX}px`;
      block.style.top = `${originalPos.top + deltaY}px`;
    });
    event.preventDefault();
  }

  function onMouseUp(event) {
    if (!isGroupDragging) return;

    log(`סיום גרירת קבוצה. מוביל: ${groupLeader.id}`);
    
    groupBlocks.forEach(data => {
      const original = startPositions.find(p => p.block === data);
      if (original) {
        original.block.style.zIndex = original.originalZIndex;
        original.block.style.opacity = original.originalOpacity;
        original.block.style.userSelect = ''; // אפשר בחירת טקסט מחדש
      }
    });

    isGroupDragging = false;
    groupLeader = null;
    groupBlocks = [];
    startPositions = [];

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    // בצע סריקה מחדש לאחר הגרירה, למקרה שהמיקומים השפיעו על זיהוי חיבורים (אם linkageimproved מטפל בזה)
    // זה חשוב אם מערכת החיבור הבסיסית (linkageimproved.js) יכולה לנתק/לחבר בלוקים כתוצאה מגרירה
    // ואז נרצה שה-GroupConnectDEBUG (ב-linkageimproved.js) יפעל מחדש על הקבוצה.
    // במודל הנוכחי, GroupDrag רק מזיז קבוצה קיימת.
    // אם רוצים לאפשר "שחרור" של קבוצה מעל בלוק אחר לחיבור, זה דורש אינטגרציה עמוקה יותר
    // עם לוגיקת ה-snap של linkageimproved.js.
    if (typeof window.runSnapDetection === 'function') {
        // נניח ש-linkageimproved.js חושף פונקציה כזו
        // window.runSnapDetection(groupBlocks[0]); // או כל בלוק אחר בקבוצה
    }
    
    // עדכן את סימון המובילים, ייתכן שהגרירה שינתה את המבנה הלוגי (פחות סביר במודל זה)
    scanAndMarkLeaders(); 
  }

  // === אתחול ===
  
  function init() {
    if (window.groupDragInitialized) {
      log('מודול גרירת קבוצות כבר אותחל.');
      return;
    }
    log('אתחול מודול גרירת קבוצות');
    
    try {
      const programBlocksDiv = document.getElementById('program-blocks');
      if (!programBlocksDiv) {
        console.error('[GroupDrag] אלמנט #program-blocks לא נמצא. המודול לא יאותחל.');
        return;
      }
      
      // הוספת מאזין ללחיצה על אזור הבלוקים הראשי (event delegation)
      // מאזין זה יופעל רק אם הלחיצה היא על .block-container
      programBlocksDiv.addEventListener('mousedown', onMouseDown, false); 
      // 'false' (או השמטה) משמעו event bubbling phase.
      
      // הוספת סגנונות CSS דינמיים (אם צריך)
      // const styles = `...`;
      // const styleSheet = document.createElement("style");
      // styleSheet.type = "text/css";
      // styleSheet.innerText = styles;
      // document.head.appendChild(styleSheet);
      // log('סגנונות גרירת קבוצות נוספו');

      // שימוש ב-MutationObserver כדי לעקוב אחרי שינויים בחיבורי הבלוקים
      // (שנגרמים על ידי linkageimproved.js) ולעדכן את סימון המובילים בהתאם.
      const observer = new MutationObserver(mutations => {
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
      log('מודול גרירת קבוצות אותחל בהצלחה (גרסה 1.0.0)');
      log(`סף קבוצה: מינימום ${config.groupMinSize} בלוקים`);
      
      // בצע סריקה ראשונית לזיהוי קבוצות קיימות בעת טעינה
      setTimeout(scanAndMarkLeaders, 500); // השהייה קלה כדי לאפשר ל-linkageimproved לאתחל
      
    } catch (error) {
      console.error('[GroupDrag] שגיאה באתחול מודול גרירת קבוצות:', error);
    }
  }

  // הרצת האתחול כאשר ה-DOM מוכן
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOMContentLoaded כבר התרחש
    init();
  }

})();
