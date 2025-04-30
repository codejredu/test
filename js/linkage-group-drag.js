// --- LINKAGE-GROUP-DRAG.JS v1.0.0: GROUP DRAGGING EXTENSION ---
// הרחבה לקובץ linkageimproved.js לתמיכה בגרירת קבוצות בלוקים מחוברים
// מבוסס על גרסה 3.9.5 של מודול הצמדת הבלוקים

(function() {
  // משתנים גלובליים של המודול
  let isGroupDragging = false;
  let groupDraggedBlock = null; // הבלוק שנגרר ישירות (הקטר)
  let connectedGroup = []; // מערך של כל הבלוקים בקבוצה
  let groupDragOffset = { x: 0, y: 0 };
  let originalPositions = []; // מיקומים מקוריים של כל הבלוקים בקבוצה
  let groupHighlightTimer = null;
  
  // קונפיגורציה
  const GROUP_CONFIG = {
    HIGHLIGHT_COLOR: 'rgba(77, 208, 225, 0.2)', // צבע הדגשה לקבוצה
    HIGHLIGHT_BORDER: '2px dashed rgba(77, 208, 225, 0.8)', // מסגרת הדגשה
    HIGHLIGHT_DURATION: 500, // משך זמן ההדגשה במילישניות
    DEBUG: true, // הדפסת מידע דיבאג
    LOCOMOTOR_HIGHLIGHT_COLOR: 'rgba(255, 183, 77, 0.3)', // צבע הדגשה לקטר
    LOCOMOTOR_BORDER: '2px dashed rgba(255, 183, 77, 0.9)', // מסגרת קטר
    MIN_GROUP_SIZE: 2, // מספר מינימלי של בלוקים להגדרת קבוצה
    DISABLE_ORIGINAL_DRAGGING: true, // האם לבטל את התנהגות הגרירה המקורית לבלוקים בקבוצה
    GROUP_DRAG_Z_INDEX: 1500, // z-index לקבוצה בזמן גרירה
    ANIM_DURATION: '0.2s', // משך זמן אנימציה לגרירה
  };

  // הוספת סגנונות CSS לתמיכה בגרירת קבוצות
  function addGroupDragStyles() {
    const oldStyle = document.getElementById('block-group-drag-styles');
    if (oldStyle) oldStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'block-group-drag-styles';
    style.textContent = `
      .group-highlight {
        background-color: ${GROUP_CONFIG.HIGHLIGHT_COLOR} !important;
        border: ${GROUP_CONFIG.HIGHLIGHT_BORDER} !important;
        border-radius: 8px !important;
        transition: background-color 0.3s ease !important;
      }
      
      .locomotor-highlight {
        background-color: ${GROUP_CONFIG.LOCOMOTOR_HIGHLIGHT_COLOR} !important;
        border: ${GROUP_CONFIG.LOCOMOTOR_BORDER} !important;
        border-radius: 8px !important;
        cursor: grab !important;
      }
      
      .locomotor-highlight:active {
        cursor: grabbing !important;
      }
      
      .group-dragging {
        transition: left ${GROUP_CONFIG.ANIM_DURATION} ease, top ${GROUP_CONFIG.ANIM_DURATION} ease !important;
        opacity: 0.85 !important;
        z-index: ${GROUP_CONFIG.GROUP_DRAG_Z_INDEX} !important;
      }
      
      .group-dragging * {
        pointer-events: none !important;
      }
      
      /* סגנון ויז'ואלי של "קטר" (בלוק שמאלי) */
      .locomotor {
        position: relative !important;
      }
      
      .locomotor::before {
        content: '';
        position: absolute;
        left: -8px;
        top: 50%;
        transform: translateY(-50%);
        width: 10px;
        height: 10px;
        background-color: rgba(255, 160, 0, 0.9);
        border-radius: 50%;
        z-index: ${GROUP_CONFIG.GROUP_DRAG_Z_INDEX + 1};
        box-shadow: 0 0 5px 2px rgba(255, 160, 0, 0.4);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .locomotor:hover::before {
        opacity: 1;
      }
      
      /* אנימציית "פעימה" להדגשת אפשרות גרירת קבוצה */
      @keyframes locomotorPulse {
        0% { transform: translateY(-50%) scale(1); opacity: 0.7; }
        50% { transform: translateY(-50%) scale(1.3); opacity: 1; }
        100% { transform: translateY(-50%) scale(1); opacity: 0.7; }
      }
      
      .locomotor.pulse::before {
        animation: locomotorPulse 1s infinite ease-in-out;
        opacity: 0.7;
      }
      
      /* סמן "קטר" גדול יותר בזמן גרירה */
      .group-dragging.locomotor::before {
        width: 14px;
        height: 14px;
        left: -10px;
        opacity: 1;
        background-color: rgba(255, 140, 0, 1);
      }
    `;
    
    document.head.appendChild(style);
    if (GROUP_CONFIG.DEBUG) console.log('Group drag styles added');
  }

  // פונקציה לבדיקה האם בלוק הוא הבלוק השמאלי ביותר בשרשרת (הקטר)
  function isLocomotorBlock(block) {
    if (!block) return false;
    
    // בדוק אם יש בלוק שמחובר לצד שמאל שלו
    if (block.hasAttribute('data-connected-from-left')) {
      return false; // יש בלוק מחובר לשמאל, לכן זה לא הבלוק השמאלי ביותר
    }
    
    // בדוק אם הוא מחובר לבלוק אחר מצד ימין
    if (block.hasAttribute('data-connected-to') && 
        block.getAttribute('data-connection-direction') === 'left') {
      return true; // הוא מחובר לבלוק אחר מצד ימין, ואין בלוק בצד שמאל
    }
    
    // בלוק בודד או לא מחובר
    return false;
  }

  // פונקציה לאיתור כל הבלוקים המחוברים ברצף מבלוק מסוים
  function findConnectedBlocks(startBlock) {
    if (!startBlock) return [];
    
    const connectedBlocks = [startBlock];
    let currentBlock = startBlock;
    
    // עקוב אחרי הבלוקים ימינה (הבלוקים שמחוברים לצד ימין של הבלוק הנוכחי)
    while (currentBlock && currentBlock.hasAttribute('data-connected-to') && 
           currentBlock.getAttribute('data-connection-direction') === 'left') {
      const nextBlockId = currentBlock.getAttribute('data-connected-to');
      const nextBlock = document.getElementById(nextBlockId);
      
      if (!nextBlock) break;
      
      connectedBlocks.push(nextBlock);
      currentBlock = nextBlock;
    }
    
    // עקוב אחרי הבלוקים שמאלה (מצא את הקטר אם התחלנו מאמצע השרשרת)
    currentBlock = startBlock;
    while (currentBlock && currentBlock.hasAttribute('data-connected-from-left')) {
      const prevBlockId = currentBlock.getAttribute('data-connected-from-left');
      const prevBlock = document.getElementById(prevBlockId);
      
      if (!prevBlock) break;
      
      // הוספה לתחילת המערך כי אנחנו הולכים שמאלה
      connectedBlocks.unshift(prevBlock);
      currentBlock = prevBlock;
    }
    
    if (GROUP_CONFIG.DEBUG) console.log(`Found ${connectedBlocks.length} connected blocks in group`);
    return connectedBlocks;
  }

  // מאתר את הבלוק השמאלי ביותר בקבוצה (הקטר)
  function findLocomotorBlock(blocks) {
    if (!blocks || blocks.length === 0) return null;
    
    // הקטר אמור להיות הבלוק הראשון בשרשרת (השמאלי ביותר)
    // בדוק אם הוא באמת קטר לפי הגדרה
    if (blocks.length > 0 && isLocomotorBlock(blocks[0])) {
      return blocks[0];
    }
    
    // אם מסיבה כלשהי הבלוק הראשון לא נחשב קטר
    // חפש את הקטר באופן מפורש בכל השרשרת
    for (const block of blocks) {
      if (isLocomotorBlock(block)) {
        return block;
      }
    }
    
    return null;
  }

  // הדגשת קבוצת בלוקים (להדגמה ויזואלית)
  function highlightBlockGroup(blocks, locomotor) {
    // נקה כל הדגשה קודמת
    clearGroupHighlight();
    
    if (!blocks || blocks.length < GROUP_CONFIG.MIN_GROUP_SIZE) return;
    
    // הדגש את כל הבלוקים בקבוצה
    blocks.forEach(block => {
      if (block) {
        block.classList.add('group-highlight');
      }
    });
    
    // הדגש את הקטר
    if (locomotor) {
      locomotor.classList.add('locomotor-highlight');
      locomotor.classList.add('locomotor');
      locomotor.classList.add('pulse');
    }
    
    // הגדר טיימר להסרת ההדגשה אחרי זמן מסוים
    if (GROUP_CONFIG.HIGHLIGHT_DURATION > 0) {
      groupHighlightTimer = setTimeout(() => {
        blocks.forEach(block => {
          if (block) {
            block.classList.remove('group-highlight');
          }
        });
        
        if (locomotor) {
          locomotor.classList.remove('locomotor-highlight');
          locomotor.classList.remove('pulse');
          // נשאיר את המחלקה 'locomotor' כדי שסמן הקטר יישאר
        }
      }, GROUP_CONFIG.HIGHLIGHT_DURATION);
    }
  }

  // ניקוי הדגשת קבוצת בלוקים
  function clearGroupHighlight() {
    // בטל את הטיימר אם קיים
    if (groupHighlightTimer) {
      clearTimeout(groupHighlightTimer);
      groupHighlightTimer = null;
    }
    
    // נקה את כל הבלוקים המודגשים
    document.querySelectorAll('.group-highlight').forEach(block => {
      block.classList.remove('group-highlight');
    });
    
    document.querySelectorAll('.locomotor-highlight').forEach(block => {
      block.classList.remove('locomotor-highlight');
    });
    
    document.querySelectorAll('.pulse').forEach(block => {
      block.classList.remove('pulse');
    });
  }

  // מחשב את המיקומים המקוריים של כל בלוק בקבוצה
  function storeOriginalPositions(blocks) {
    const positions = [];
    const pE = document.getElementById('program-blocks');
    const pR = pE.getBoundingClientRect();
    
    blocks.forEach(block => {
      if (block) {
        const rect = block.getBoundingClientRect();
        positions.push({
          id: block.id,
          left: rect.left - pR.left + pE.scrollLeft,
          top: rect.top - pR.top + pE.scrollTop
        });
      }
    });
    
    return positions;
  }

  // עדכון מיקום קבוצת הבלוקים בגרירה
  function updateGroupPosition(deltaX, deltaY) {
    if (!connectedGroup || connectedGroup.length === 0 || !originalPositions || originalPositions.length === 0) {
      return;
    }
    
    connectedGroup.forEach((block, index) => {
      if (block && originalPositions[index]) {
        const newLeft = originalPositions[index].left + deltaX;
        const newTop = originalPositions[index].top + deltaY;
        
        block.style.position = 'absolute';
        block.style.left = `${Math.round(newLeft)}px`;
        block.style.top = `${Math.round(newTop)}px`;
      }
    });
  }

  // טיפול באירוע MouseDown על בלוק קטר (התחלת גרירת קבוצה)
  function handleGroupMouseDown(e) {
    // בדוק שזו לחיצה ראשית (לחצן שמאלי) ולא על אלמנט אינטראקטיבי
    if (e.button !== 0 || e.target.matches('input,button,select,textarea,a[href]')) {
      return;
    }
    
    // מצא את הבלוק המדויק שנלחץ
    const clickedBlock = e.target.closest('.block-container');
    if (!clickedBlock || !clickedBlock.parentElement || clickedBlock.parentElement.id !== 'program-blocks') {
      return;
    }
    
    // בדוק אם הבלוק הוא חלק מקבוצה ואם הוא הקטר
    const isInGroup = clickedBlock.hasAttribute('data-connected-to') || 
                      clickedBlock.hasAttribute('data-connected-from-left') || 
                      clickedBlock.hasAttribute('data-connected-from-right');
                      
    if (!isInGroup) {
      // אם לא מחובר לקבוצה, אל תמנע את ההתנהגות הרגילה
      return;
    }
    
    // מצא את כל הבלוקים המחוברים
    const allConnectedBlocks = findConnectedBlocks(clickedBlock);
    if (allConnectedBlocks.length < GROUP_CONFIG.MIN_GROUP_SIZE) {
      // אם זה בלוק בודד או קבוצה קטנה מדי, אל תטפל בגרירת קבוצה
      return;
    }
    
    // מצא את הקטר (הבלוק השמאלי ביותר)
    const locomotor = findLocomotorBlock(allConnectedBlocks);
    
    // בדוק אם הבלוק שנלחץ הוא הקטר
    if (clickedBlock !== locomotor) {
      if (GROUP_CONFIG.DEBUG) {
        console.log("לחיצה על בלוק שאינו הקטר, מדגיש את הקבוצה");
      }
      
      // הדגש את הקבוצה והקטר לרמז למשתמש
      highlightBlockGroup(allConnectedBlocks, locomotor);
      
      if (GROUP_CONFIG.DISABLE_ORIGINAL_DRAGGING) {
        e.stopPropagation(); // מנע את הגרירה המקורית
        e.preventDefault();
      }
      
      return;
    }
    
    // כעת אנחנו בטוחים שהמשתמש לחץ על הקטר, התחל גרירת קבוצה
    if (GROUP_CONFIG.DEBUG) {
      console.log(`[GroupDrag] התחלת גרירת קבוצה של ${allConnectedBlocks.length} בלוקים`);
    }
    
    e.stopPropagation(); // מנע את הגרירה המקורית
    e.preventDefault();
    
    // שמור מידע על הגרירה
    isGroupDragging = true;
    groupDraggedBlock = locomotor;
    connectedGroup = allConnectedBlocks;
    
    // שמור את ההיסט מנקודת הלחיצה לפינת הבלוק
    const rect = locomotor.getBoundingClientRect();
    groupDragOffset.x = e.clientX - rect.left;
    groupDragOffset.y = e.clientY - rect.top;
    
    // שמור את המיקומים המקוריים של כל הבלוקים
    originalPositions = storeOriginalPositions(connectedGroup);
    
    // הוסף מחלקות CSS לכל הבלוקים בקבוצה
    connectedGroup.forEach(block => {
      block.classList.add('group-dragging');
    });
    
    // הוסף מחלקה מיוחדת לקטר
    locomotor.classList.add('locomotor');
    
    // הוסף הדגשה לקבוצה
    clearGroupHighlight();  // נקה קודם כל הדגשה קודמת
    
    // הוסף מעטפת של בחירת השתמש למניעת בחירת טקסט בזמן גרירה
    document.body.classList.add('user-select-none');
  }

  // טיפול באירוע MouseMove לגרירת קבוצה
  function handleGroupMouseMove(e) {
    if (!isGroupDragging || !groupDraggedBlock || connectedGroup.length === 0) {
      return;
    }
    
    e.preventDefault();
    
    const pE = document.getElementById('program-blocks');
    if (!pE) {
      handleGroupMouseUp(e);
      return;
    }
    
    const pR = pE.getBoundingClientRect();
    
    // חשב את המיקום החדש של הקטר
    let newLeft = e.clientX - pR.left - groupDragOffset.x + pE.scrollLeft;
    let newTop = e.clientY - pR.top - groupDragOffset.y + pE.scrollTop;
    
    // מגבלות גבולות אזור התכנות
    const locomotorWidth = groupDraggedBlock.offsetWidth;
    const locomotorHeight = groupDraggedBlock.offsetHeight;
    const sW = pE.scrollWidth;
    const sH = pE.scrollHeight;
    
    // הגבל את התנועה לגבולות אזור התכנות
    newLeft = Math.max(0, Math.min(newLeft, sW - locomotorWidth));
    newTop = Math.max(0, Math.min(newTop, sH - locomotorHeight));
    
    // חשב את השינוי מהמיקום המקורי של הקטר
    const deltaX = newLeft - originalPositions[0].left;
    const deltaY = newTop - originalPositions[0].top;
    
    // עדכן את המיקום של כל הבלוקים בקבוצה
    updateGroupPosition(deltaX, deltaY);
  }

  // טיפול באירוע MouseUp לסיום גרירת קבוצה
  function handleGroupMouseUp(e) {
    if (!isGroupDragging) {
      return;
    }
    
    if (GROUP_CONFIG.DEBUG) {
      console.log(`[GroupDrag] סיום גרירת קבוצה של ${connectedGroup.length} בלוקים`);
    }
    
    // הסר מחלקות CSS מכל הבלוקים בקבוצה
    connectedGroup.forEach(block => {
      block.classList.remove('group-dragging');
    });
    
    // נקה את מצב הגרירה
    isGroupDragging = false;
    groupDraggedBlock = null;
    connectedGroup = [];
    originalPositions = [];
    
    // הסר מעטפת של בחירת משתמש
    document.body.classList.remove('user-select-none');
  }

  // טיפול באירוע MouseLeave על המסמך
  function handleGroupMouseLeave(e) {
    if (isGroupDragging && e.target === document.documentElement && !e.relatedTarget) {
      if (GROUP_CONFIG.DEBUG) {
        console.warn("[GroupDrag] העכבר עזב את המסמך בזמן גרירת קבוצה, ביצוע mouseup");
      }
      handleGroupMouseUp(e);
    }
  }

  // הוספת מאזינים גלובליים לגרירת קבוצות
  function initGroupDragListeners() {
    document.addEventListener('mousedown', handleGroupMouseDown, true);
    document.addEventListener('mousemove', handleGroupMouseMove);
    document.addEventListener('mouseup', handleGroupMouseUp);
    document.addEventListener('mouseleave', handleGroupMouseLeave);
    
    if (GROUP_CONFIG.DEBUG) {
      console.log("Group drag listeners initialized");
    }
  }

  // זיהוי ועדכון אינדיקטורים של קטרים לכל הבלוקים המחוברים
  function updateLocomotorIndicators() {
    // ראשית, נקה את כל סמני הקטר הנוכחיים
    document.querySelectorAll('.locomotor').forEach(block => {
      block.classList.remove('locomotor');
    });
    
    // מצא את כל הבלוקים המחוברים באזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    
    // מצא את כל הבלוקים המחוברים
    const connectedBlocks = Array.from(programmingArea.querySelectorAll('.block-container[data-connected-to], .block-container[data-connected-from-left], .block-container[data-connected-from-right]'));
    
    // מצא את כל הקבוצות הייחודיות של בלוקים מחוברים
    const processedGroups = new Set();
    connectedBlocks.forEach(block => {
      // דלג על בלוקים שכבר עובדו כחלק מקבוצה
      if (processedGroups.has(block.id)) return;
      
      // מצא את כל הבלוקים בקבוצה הזו
      const groupBlocks = findConnectedBlocks(block);
      if (groupBlocks.length < GROUP_CONFIG.MIN_GROUP_SIZE) return;
      
      // סמן את כל הבלוקים בקבוצה כמעובדים
      groupBlocks.forEach(groupBlock => {
        if (groupBlock) processedGroups.add(groupBlock.id);
      });
      
      // מצא את הקטר ועדכן את הסמן שלו
      const locomotor = findLocomotorBlock(groupBlocks);
      if (locomotor) {
        locomotor.classList.add('locomotor');
      }
    });
    
    if (GROUP_CONFIG.DEBUG) {
      console.log(`Updated ${processedGroups.size} blocks in connected groups`);
    }
  }

  // מאזין שינויים באזור התכנות (כדי לעדכן סמני קטר)
  function observeBlockChanges() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        // בדוק אם יש שינויים בתוכן או במאפיינים
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          if (mutation.type === 'attributes' && 
              (mutation.attributeName === 'data-connected-to' || 
               mutation.attributeName === 'data-connected-from-left' || 
               mutation.attributeName === 'data-connected-from-right')) {
            shouldUpdate = true;
          } else if (mutation.type === 'childList') {
            shouldUpdate = true;
          }
        }
      });
      
      if (shouldUpdate) {
        // עדכן את סמני הקטר, אך השהה מעט לאפשר לכל השינויים להתרחש
        setTimeout(updateLocomotorIndicators, 100);
      }
    });
    
    observer.observe(programmingArea, {
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['data-connected-to', 'data-connected-from-left', 'data-connected-from-right', 'id', 'class', 'style']
    });
    
    if (GROUP_CONFIG.DEBUG) {
      console.log("Observing program blocks for changes to update locomotor indicators");
    }
  }

  // אתחול מודול גרירת קבוצות
  function initializeGroupDragModule() {
    const initFlag = 'blockGroupDragInitialized_v1_0_0';
    if (window[initFlag]) {
      if (GROUP_CONFIG.DEBUG) {
        console.log("Block group drag system v1.0.0 already initialized. Skipping.");
      }
      return;
    }
    
    // וודא שמודול ההצמדה המקורי כבר הותקן
    if (!window.blockLinkageInitialized_v3_9_5) {
      console.warn("Block linkage system is not initialized yet. Waiting...");
      setTimeout(initializeGroupDragModule, 500);
      return;
    }
    
    // אתחל את כל הרכיבים
    addGroupDragStyles();
    initGroupDragListeners();
    updateLocomotorIndicators(); // סמן את הקטרים הקיימים
    observeBlockChanges();
    
    window[initFlag] = true;
    console.log(`Block group drag system initialized (Version 1.0.0)`);
    console.log(`Group size threshold: ${GROUP_CONFIG.MIN_GROUP_SIZE} blocks`);
  }

  // הפעל אתחול
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGroupDragModule);
  } else {
    // אנחנו נמתין מעט לוודא שמודול ההצמדה המקורי הותקן
    setTimeout(initializeGroupDragModule, 300);
  }

})();

// --- END OF FILE linkage-group-drag.js v1.0.0 ---
