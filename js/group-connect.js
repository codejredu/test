// === תיקון אינטגרציה מיוחד עם מודול גרירת קבוצות ===
  
  // התאמה למודול גרירת קבוצות
  function integrateWithGroupDrag() {
    if (isIntegrationInit || !config.forceGroupDragHooks) return;
    
    try {
      log("מנסה לשלב עם מודול גרירת קבוצות");
      
      // ודא שמודול הגרירה קיים
      if (typeof window.groupDragApi === 'undefined') {
        log("מודול גרירת קבוצות לא נמצא, דילוג על שילוב");
        return;
      }
      
      // קודם בדוק אם יש תמיכה בפונקציות אירועים
      if (typeof window.groupDragApi.onGroupDragStart === 'function') {
        log("נמצאה תמיכה באירועים במודול גרירת קבוצות");
      } else {
        // אין תמיכה באירועים, צריך להוסיף וו אל מודול הגרירה
        window.groupDragApi.onGroupDragStart = function(blocks) { };
        window.groupDragApi.onGroupDragMove = function(blocks) { };
        window.groupDragApi.onGroupDragEnd = function(blocks) { };
        
        log("נוספו פונקציות אירועים חסרות למודול גרירת קבוצות");
      }
      
      // שמור את הפונקציות המקוריות
      const originalStartDragGroup = window.groupDragApi.startDragGroup;
      const originalMoveDragGroup = window.groupDragApi.moveDragGroup;
      const originalEndDragGroup = window.groupDragApi.endDragGroup;
      
      // דרס את פונקציות גרירת הקבוצות כדי שיקראו לאירועים
      if (typeof originalStartDragGroup === 'function') {
        window.groupDragApi.startDragGroup = function(groupBlocks, event) {
          const result = originalStartDragGroup.apply(this, arguments);
          
          // שמור את הקבוצה הנגררת
          storeDraggedGroup(groupBlocks);
          
          // קרא לאירוע התחלת גרירה
          if (typeof window.groupDragApi.onGroupDragStart === 'function') {
            window.groupDragApi.onGroupDragStart(groupBlocks);
          }
          
          return result;
        };
        log("נתפסה פונקציית התחלת גרירת קבוצה");
      }
      
      if (typeof originalMoveDragGroup === 'function') {
        window.groupDragApi.moveDragGroup = function(event) {
          const result = originalMoveDragGroup.apply(this, arguments);
          
          // בדוק אפשרות חיבור
          if (config.monitorGroupDragEvents) {
            setTimeout(checkForConnectOpportunity, 0);
          }
          
          // קרא לאירוע תזוזת גרירה
          if (typeof window.groupDragApi.onGroupDragMove === 'function') {
            window.groupDragApi.onGroupDragMove(draggedGroupBlocks);
          }
          
          return result;
        };
        log("נתפסה פונקציית תזוזת גרירת קבוצה");
      }
      
      if (typeof originalEndDragGroup === 'function') {
        window.groupDragApi.endDragGroup = function(event) {
          const currentDraggedBlocks = [...draggedGroupBlocks]; // שמור העתק
          const result = originalEndDragGroup.apply(this, arguments);
          
          // בדוק אם יש אפשרות חיבור וביצוע חיבור
          if (potentialConnectSource && potentialConnectTarget) {
            log("סיום גרירה עם אפשרות חיבור פוטנציאלית");
            connectGroups();
          }
          
          // קרא לאירוע סיום גרירה
          if (typeof window.groupDragApi.onGroupDragEnd === 'function') {
            window.groupDragApi.onGroupDragEnd(currentDraggedBlocks);
          }
          
          return result;
        };
        log("נתפסה פונקציית סיום גרירת קבוצה");
      }
      
      // רשום אירועים
      window.groupDragApi.onGroupDragStart = function(blocks) {
        log(`התחלת גרירת קבוצה עם ${blocks.length} בלוקים`);
      };
      
      window.groupDragApi.onGroupDragMove = function(blocks) {
        // בדוק אפשרות חיבור - כבר נקרא ביציאת moveDragGroup
      };
      
      window.groupDragApi.onGroupDragEnd = function(blocks) {
        log(`סיום גרירת קבוצה עם ${blocks.length} בלוקים`);
      };
      
      isIntegrationInit = true;
      
      log("שילוב עם מודול גרירת קבוצות הושלם בהצלחה");
    } catch (err) {
      console.error('[GroupConnect] שגיאה בשילוב עם מודול גרירת קבוצות:', err);
    }
  }

  // === מאזיני אירועים ===
  
  // מאזין למסמך - בדיקת אפשרויות חיבור בזמן תזוזת העכבר
  function handleDocumentMouseMove(event) {
    // בדיקת מצב לחצני העכבר - דרושה גרירה פעילה
    if (event.buttons !== 1) return; // 1 = לחצן שמאלי
    
    // בדוק אם יש גרירת קבוצה פעילה
    checkForConnectOpportunity();
  }
  
  // מאזין לשחרור העכבר - ביצוע חיבור אם יש אפשרות
  function handleDocumentMouseUp() {
    // בדוק אם יש אפשרות חיבור פעילה
    if (potentialConnectSource && potentialConnectTarget) {
      // בצע את החיבור
      connectGroups();
    }
    
    // נקה את ההדגשות בכל מקרה
    clearConnectionHighlights();
  }
  
  // תמיכה בטאץ' - מגע
  function handleTouchMove(event) {
    if (event.touches.length !== 1) return;
    
    // המשך לבדיקת חיבור
    checkForConnectOpportunity();
  }
  
  function handleTouchEnd() {
    // בדוק אם יש אפשרות חיבור פעילה
    if (potentialConnectSource && potentialConnectTarget) {
      // בצע את החיבור
      connectGroups();
    }
    
    // נקה את ההדגשות בכל מקרה
    clearConnectionHighlights();
  }
  
  // האזנה לאירועי גרירה באמצעות אירועי DOM מותאמים
  function listenToCustomDragEvents() {
    document.addEventListener('blockGroupDragStart', function(e) {
      if (e.detail && e.detail.blocks) {
        storeDraggedGroup(e.detail.blocks);
      }
    });
    
    document.addEventListener('blockGroupDragMove', function(e) {
      checkForConnectOpportunity();
    });
    
    document.addEventListener('blockGroupDragEnd', function(e) {
      if (potentialConnectSource && potentialConnectTarget) {
        connectGroups();
      }
    });
  }
  
  // אתחול המודול
  function initModule() {
    const initFlag = 'groupConnectInitialized_v1_3_1';
    if (window[initFlag]) {
      if (config.debug) {
        log("מודול חיבור קבוצות כבר אותחל. מדלג.");
      }
      return;
    }
    
    log("אתחול מודול חיבור קבוצות אגרסיבי");
    
    try {
      // זיהוי והתאמה להגדרות קיימות
      detectOriginalConfiguration();
      
      // גיבוי פונקציות מקוריות
      backupOriginalFunctions();
      
      // בדוק אם מודול גרירת הקבוצות קיים
      if (typeof window.groupDragInitialized === 'undefined') {
        log("מודול גרירת קבוצות לא זוהה! הפעלה במצב אוטונומי.");
      } else {
        log("זוהה מודול גרירת קבוצות - שימוש באינטרפייס שלו כשניתן.");
        
        // שלב עם מודול גרירת קבוצות
        setTimeout(integrateWithGroupDrag, 500);
      }
      
      // הוסף סגנונות CSS
      addConnectStyles();
      
      // הוסף מאזיני אירועים
      document.addEventListener('mousemove', handleDocumentMouseMove, { passive: true });
      document.addEventListener('mouseup', handleDocumentMouseUp);
      
      // תמיכה במגע
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
      
      // הוסף האזנה לאירועי גרירה מותאמים
      listenToCustomDragEvents();
      
      // חשיפת API לשימוש חיצוני
      window.groupConnectApi = {
        // פונקציות ליבה
        highlightConnection,
        clearConnectionHighlights,
        connectGroups,
        findConnectedBlocks,
        config, // מאפשר שינוי ההגדרות מבחוץ
        storeDraggedGroup, // חשיפת פונקציה לעדכון קבוצה נגררת
        checkForConnectOpportunity, // אפשר לקרוא לבדיקה מבחוץ באופן מפורש
        
        // פונקציות בדיקה ותיקון
        repairAllConnections: () => {
          log("סורק ומתקן את כל החיבורים במסמך...");
          const blocks = document.querySelectorAll('.block-container');
          let fixCount = 0;
          
          Array.from(blocks).forEach(block => {
            if (block.hasAttribute('data-connected-to')) {
              const targetId = block.getAttribute('data-connected-to');
              const targetBlock = document.getElementById(targetId);
              
              if (targetBlock) {
                const direction = block.getAttribute('data-connection-direction');
                
                if (direction === 'left') {
                  // וודא שיש סימון הדדי
                  if (!targetBlock.hasAttribute('data-connected-from-left') || 
                      targetBlock.getAttribute('data-connected-from-left') !== block.id) {
                    targetBlock.setAttribute('data-connected-from-left', block.id);
                    fixCount++;
                  }
                } else if (direction === 'right') {
                  // וודא שיש סימון הדדי
                  if (!targetBlock.hasAttribute('data-connected-from-right') || 
                      targetBlock.getAttribute('data-connected-from-right') !== block.id) {
                    targetBlock.setAttribute('data-connected-from-right', block.id);
                    fixCount++;
                  }
                }
              }
            }
          });
          
          log(`תיקון חיבורים הסתיים. תוקנו ${fixCount} חיבורים.`);
          return fixCount;
        },
        
        // פונקציה ישירה ליצירת חיבור מוכרח
        forceConnect: (blockId1, blockId2, direction) => {
          const block1 = document.getElementById(blockId1);
          const block2 = document.getElementById(blockId2);
          
          if (!block1 || !block2) {
            return { success: false, error: "בלוק לא נמצא" };
          }
          
          potentialConnectSource = block1;
          potentialConnectTarget = block2;
          connectDirection = direction || 'right';
          
          const result = connectGroups();
          return { success: result };
        }
      };
      
      // סמן שהמודול אותחל
      window[initFlag] = true;
      window.groupConnectInitialized = true;
      
      log("מודול חיבור קבוצות אותחל בהצלחה");
      log(`גילוי חיבורים: טווח ${config.connectThreshold}px עם היסט שמאלי ${config.LEFT_CONNECTION_OFFSET} וימני ${config.RIGHT_CONNECTION_OFFSET}`);
      
      // בדיקה ותיקון אוטומטי של חיבורים קיימים
      setTimeout(() => {
        window.groupConnectApi.repairAllConnections();
      }, 1000);
      
      // נקה משאבים בעת פריקת הדף
      window.addEventListener('beforeunload', () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      });
    } catch (err) {
      console.error('[GroupConnect] שגיאה באתחול מודול חיבור קבוצות:', err);
    }
  }
  
  // הפעל את האתחול כאשר המסמך נטען
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initModule, 200));
  } else {
    // הדף כבר נטען, אתחל מיד
    setTimeout(initModule, 0);
  }
  
})();
// ===================================================
// GROUP-CONNECT.JS v1.3.1 (FIXED + FORCE INTEGRATION)
// מודול לחיבור בין קבוצות בלוקים מחוברים
// יש להוסיף אחרי הקבצים linkageimproved.js ו-linkage-group-drag-simplified.js
// ===================================================

(function() {
  'use strict';
  
  console.log("[GroupConnect] טוען מודול חיבור קבוצות משופר...");
  
  // === משתנים גלובליים ===
  let potentialConnectSource = null;   // קבוצת המקור הפוטנציאלית לחיבור
  let potentialConnectTarget = null;   // בלוק יעד פוטנציאלי לחיבור
  let connectDirection = null;         // כיוון החיבור ('right' או 'left')
  let lastCheckTime = 0;               // זמן הבדיקה האחרונה (למניעת עומס)
  let isConnecting = false;            // נעילה למניעת חיבורים מרובים בו-זמנית
  let draggedGroupBlocks = [];         // מאגר הבלוקים בקבוצה הנגררת הנוכחית
  let activeConnectionPoints = [];     // מאגר נקודות חיבור פעילות
  let originalLinkageFunctions = {};   // שמירה על פונקציות מקוריות מהקוד הקיים
  let isIntegrationInit = false;       // האם בוצע אתחול אינטגרציה עם מודול גרירת קבוצות

  // === הגדרות ===
  const config = {
    debug: true,                       // האם להדפיס הודעות דיבאג בקונסול
    connectThreshold: 150,             // מרחק בפיקסלים לזיהוי אפשרות חיבור (הוגדל משמעותית)
    connectHighlightColor: '#FF9800',  // צבע הדגשה לנקודות חיבור פוטנציאליות
    verticalOverlapRequired: 0.05,     // החפיפה האנכית הנדרשת כאחוז מגובה הבלוק (הופחת מאוד)
    checkInterval: 10,                 // זמן מינימלי בין בדיקות חיבור (במילישניות)
    
    // ערכי היסט מדויקים לחיבור אופקי - ייקחו מ-SNAP_DISTANCE בקוד המקורי
    LEFT_CONNECTION_OFFSET: -9,        // ברירת מחדל, יעודכן
    RIGHT_CONNECTION_OFFSET: 9,        // ברירת מחדל, יעודכן
    
    // מאפייני יציבות
    connectionDelayMs: 0,              // השהייה מינימלית לתהליך החיבור (כבוי לביצועים)
    preserveGroupIntegrity: true,      // האם לשמור על שלמות הקבוצה בעת חיבור
    maxRetries: 3,                     // כמות נסיונות חיבור מקסימלית במקרה של כשל
    
    // מאפייני נקודות חיבור
    connectionPointSize: 24,           // גודל נקודות החיבור בפיקסלים (הוגדל מאוד)
    connectionPointPulse: true,        // האם להפעיל אנימציה על נקודות החיבור
    connectionPointZIndex: 9999,       // שכבת הצגה של נקודות החיבור (גבוה מאוד)
    forceConnectionPoints: true,       // האם לכפות הצגת נקודות חיבור גם אם הן מוסתרות
    enforcedConnectionChecks: true,    // האם לבצע בדיקות חיבור אגרסיביות
    
    // אינטגרציה עם מערכת חיבור קיימת
    integrateWithExistingCode: true,   // האם להשתלב עם קוד linkageimproved הקיים
    useOriginalSnapFunction: false,    // האם להשתמש בפונקציית הצמדה המקורית (כבוי לאמינות)
    forceGroupDragHooks: true,         // האם לכפות וו שיתוף פעולה עם מודול גרירת קבוצות
    monitorGroupDragEvents: true       // האם לנטר אירועי גרירת קבוצות באופן אגרסיבי
  };
  
  // === פונקציות עזר ===
  
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
  
  // גישה לקבועים ומשתנים של הסקריפט המקורי
  function detectOriginalConfiguration() {
    // נסה לזהות קבועים שימושיים מהקוד המקורי
    try {
      if (typeof window.CONFIG !== 'undefined') {
        log("זוהו הגדרות מהמודול המקורי");
        
        if (window.CONFIG.HORIZONTAL_FINE_TUNING_LEFT !== undefined) {
          config.LEFT_CONNECTION_OFFSET = window.CONFIG.HORIZONTAL_FINE_TUNING_LEFT;
          log(`אומץ היסט שמאלי: ${config.LEFT_CONNECTION_OFFSET}`);
        }
        
        if (window.CONFIG.HORIZONTAL_FINE_TUNING_RIGHT !== undefined) {
          config.RIGHT_CONNECTION_OFFSET = window.CONFIG.HORIZONTAL_FINE_TUNING_RIGHT;
          log(`אומץ היסט ימני: ${config.RIGHT_CONNECTION_OFFSET}`);
        }
      }
      
      // בדוק אם יש משתנים גלובליים רלוונטיים
      if (typeof window.SNAP_DISTANCE !== 'undefined') {
        config.connectThreshold = Math.max(window.SNAP_DISTANCE * 3, config.connectThreshold);
        log(`אומץ מרחק צימוד מוגדל: ${config.connectThreshold}`);
      }
      
      if (typeof window.SNAP_POINTS_COLOR !== 'undefined') {
        config.connectHighlightColor = window.SNAP_POINTS_COLOR;
        log(`אומץ צבע נקודות חיבור: ${config.connectHighlightColor}`);
      }
    } catch (err) {
      console.error('[GroupConnect] שגיאה בזיהוי הגדרות מהקוד המקורי:', err);
    }
  }
  
  // שמירת פונקציות מקוריות לפני החלפתן
  function backupOriginalFunctions() {
    // שמור גיבויים של פונקציות מפתח
    try {
      if (typeof window.highlightPotentialConnection === 'function') {
        originalLinkageFunctions.highlightPotentialConnection = window.highlightPotentialConnection;
        log("גובתה פונקציית highlightPotentialConnection המקורית");
      }
      
      if (typeof window.performBlockSnap === 'function') {
        originalLinkageFunctions.performBlockSnap = window.performBlockSnap;
        log("גובתה פונקציית performBlockSnap המקורית");
      }
      
      if (typeof window.clearConnectionHighlights === 'function') {
        originalLinkageFunctions.clearConnectionHighlights = window.clearConnectionHighlights;
        log("גובתה פונקציית clearConnectionHighlights המקורית");
      }
    } catch (err) {
      console.error('[GroupConnect] שגיאה בגיבוי פונקציות מקוריות:', err);
    }
  }
  
  // בדיקה אם בלוק נמצא בקבוצה נגררת
  function isBlockInDraggedGroup(block) {
    if (!block || draggedGroupBlocks.length === 0) return false;
    return draggedGroupBlocks.includes(block);
  }
  
  // הוספת סגנונות CSS לחיבור בין קבוצות
  function addConnectStyles() {
    const oldStyle = document.getElementById('group-connect-styles');
    if (oldStyle) oldStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'group-connect-styles';
    style.textContent = `
      /* סגנונות לחיבור בין קבוצות */
      .connection-point {
        position: absolute !important;
        width: ${config.connectionPointSize}px !important;
        height: ${config.connectionPointSize}px !important;
        background-color: ${config.connectHighlightColor} !important;
        border-radius: 50% !important;
        z-index: ${config.connectionPointZIndex} !important;
        box-shadow: 0 0 12px ${config.connectHighlightColor} !important;
        pointer-events: none !important;
        opacity: 0.9 !important;
        animation: connectionPulse 0.6s infinite alternate !important;
      }
      
      @keyframes connectionPulse {
        0% { transform: scale(1) translateY(-50%); opacity: 0.7; }
        100% { transform: scale(1.4) translateY(-50%); opacity: 1; }
      }
      
      .connection-left {
        top: 50% !important;
        left: -${Math.floor(config.connectionPointSize/2)}px !important;
        transform: translateY(-50%) !important;
      }
      
      .connection-right {
        top: 50% !important;
        right: -${Math.floor(config.connectionPointSize/2)}px !important;
        transform: translateY(-50%) !important;
      }
      
      .potential-connect {
        box-shadow: 0 0 10px ${config.connectHighlightColor} !important;
        z-index: 2000 !important;
      }
      
      /* הדגש נוסף לאזור חיבור פוטנציאלי */
      .potential-connect::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        width: 8px;
        background-color: rgba(255, 152, 0, 0.6);
        z-index: 1999;
      }
      
      .potential-connect-left::before {
        left: -4px;
      }
      
      .potential-connect-right::before {
        right: -4px;
      }
      
      /* סגנונות חדשים להבטחת יציבות */
      .connecting-group {
        opacity: 0.95 !important;
        transition: transform 0.2s ease-out !important;
      }
      
      .connection-success {
        box-shadow: 0 0 15px #4CAF50 !important;
        animation: successPulse 0.5s !important;
      }
      
      @keyframes successPulse {
        0% { box-shadow: 0 0 0px #4CAF50; }
        50% { box-shadow: 0 0 20px #4CAF50; }
        100% { box-shadow: 0 0 8px #4CAF50; }
      }
      
      /* שכבת חיבור עליונה לאזור בלוקים */
      #connection-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: ${config.connectionPointZIndex - 1};
      }
      
      /* סגנונות להדגשה מוגברת */
      .enhanced-highlight-left,
      .enhanced-highlight-right {
        position: relative;
      }
      
      .enhanced-highlight-left::after,
      .enhanced-highlight-right::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        width: 12px;
        background-color: rgba(255, 152, 0, 0.3);
        animation: highlightPulse 1s infinite alternate;
      }
      
      .enhanced-highlight-left::after {
        left: -6px;
      }
      
      .enhanced-highlight-right::after {
        right: -6px;
      }
      
      @keyframes highlightPulse {
        0% { opacity: 0.3; }
        100% { opacity: 0.8; }
      }
    `;
    
    document.head.appendChild(style);
    log('סגנונות חיבור קבוצות נוספו');
    
    // הוסף שכבת חיבור לאזור התכנות
    const programArea = document.getElementById('program-blocks');
    if (programArea && !document.getElementById('connection-layer')) {
      const connectionLayer = document.createElement('div');
      connectionLayer.id = 'connection-layer';
      programArea.appendChild(connectionLayer);
    }
    
    // הוסף את אנימציית פעימת החיבור
    addKeyframeStyleIfNeeded();
  }
  
  // הוספת אנימציית keyframe אם חסרה
  function addKeyframeStyleIfNeeded() {
    if (!document.getElementById('connection-pulse-keyframes')) {
      const keyframeStyle = document.createElement('style');
      keyframeStyle.id = 'connection-pulse-keyframes';
      keyframeStyle.innerHTML = `
        @keyframes connectionPulse {
          0% { transform: scale(1) translateY(-50%); opacity: 0.7; }
          100% { transform: scale(1.4) translateY(-50%); opacity: 1; }
        }
        
        @keyframes highlightPulse {
          0% { opacity: 0.3; }
          100% { opacity: 0.8; }
        }
        
        @keyframes successPulse {
          0% { box-shadow: 0 0 0px #4CAF50; }
          50% { box-shadow: 0 0 20px #4CAF50; }
          100% { box-shadow: 0 0 8px #4CAF50; }
        }
      `;
      document.head.appendChild(keyframeStyle);
    }
  }
  
  // ניקוי הדגשות חיבור פוטנציאלי - מותאם לשילוב עם קוד קיים
  function clearConnectionHighlights() {
    // הפעל את הפונקציה המקורית אם קיימת והוגדר לשמר אותה
    if (config.integrateWithExistingCode && 
        typeof originalLinkageFunctions.clearConnectionHighlights === 'function') {
      originalLinkageFunctions.clearConnectionHighlights();
    }
    
    try {
      // הסר את נקודות החיבור המשופרות
      document.querySelectorAll('.enhanced-connection-point, .connection-point').forEach(point => {
        point.remove();
      });
      
      // נקה את המערך של נקודות החיבור הפעילות
      activeConnectionPoints = [];
      
      // הסר את הדגשת הבלוקים
      document.querySelectorAll('.potential-connect, .potential-connect-left, .potential-connect-right').forEach(block => {
        block.classList.remove('potential-connect', 'potential-connect-left', 'potential-connect-right');
      });
      
      // הסר הדגשות מוגברות
      document.querySelectorAll('.enhanced-highlight-left, .enhanced-highlight-right').forEach(block => {
        block.classList.remove('enhanced-highlight-left', 'enhanced-highlight-right');
      });
      
      // הסר את סימון החיבור המוצלח
      document.querySelectorAll('.connection-success').forEach(block => {
        block.classList.remove('connection-success');
      });
    } catch (err) {
      console.error('[GroupConnect] שגיאה בניקוי הדגשות:', err);
    }
  }
  
  // יצירת נקודת חיבור
  function createConnectionPoint(parent, position, id) {
    try {
      // אם פעילה כפיית הצגת נקודות חיבור, הוסף את הנקודה לשכבת החיבור
      const connectionLayer = document.getElementById('connection-layer');
      const container = config.forceConnectionPoints && connectionLayer ? connectionLayer : parent;
      
      const point = document.createElement('div');
      point.className = `connection-point connection-${position}`;
      point.id = id || `connection-${position}-${Date.now()}`;
      
      if (config.forceConnectionPoints && connectionLayer) {
        // חשב מיקום יחסי בשכבת החיבור
        const parentRect = parent.getBoundingClientRect();
        const layerRect = connectionLayer.getBoundingClientRect();
        
        const topOffset = parentRect.top - layerRect.top + connectionLayer.scrollTop;
        
        if (position === 'right') {
          point.style.top = `${topOffset + parentRect.height/2}px`;
          point.style.left = `${parentRect.right - layerRect.left - Math.floor(config.connectionPointSize/2) + connectionLayer.scrollLeft}px`;
          point.style.transform = 'translateY(-50%)';
        } else {
          point.style.top = `${topOffset + parentRect.height/2}px`;
          point.style.left = `${parentRect.left - layerRect.left - Math.floor(config.connectionPointSize/2) + connectionLayer.scrollLeft}px`;
          point.style.transform = 'translateY(-50%)';
        }
      }
      
      container.appendChild(point);
      
      // שמור את הנקודה במערך הפעיל
      activeConnectionPoints.push({
        element: point,
        parent: parent,
        position: position
      });
      
      return point;
    } catch (err) {
      console.error('[GroupConnect] שגיאה ביצירת נקודת חיבור:', err);
      return null;
    }
  }
  
  // הדגשת חיבור פוטנציאלי בין בלוקים - משודרג ומשולב
  function highlightConnection(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock) {
      log("לא ניתן להדגיש חיבור - חסרים בלוקים");
      return;
    }
    
    try {
      // נקה הדגשות קודמות
      clearConnectionHighlights();
      
      // הוסף את מחלקות ההדגשה לבלוקים
      if (direction === 'right') {
        // הצד הימני של המקור לצד שמאל של היעד
        sourceBlock.classList.add('potential-connect', 'potential-connect-right', 'enhanced-highlight-right');
        targetBlock.classList.add('potential-connect', 'potential-connect-left', 'enhanced-highlight-left');
        
        // צור נקודות חיבור מוגברות
        createConnectionPoint(sourceBlock, 'right', 'connection-source-point');
        createConnectionPoint(targetBlock, 'left', 'connection-target-point');
      } else {
        // הצד השמאלי של המקור לצד ימין של היעד
        sourceBlock.classList.add('potential-connect', 'potential-connect-left', 'enhanced-highlight-left');
        targetBlock.classList.add('potential-connect', 'potential-connect-right', 'enhanced-highlight-right');
        
        // צור נקודות חיבור מוגברות
        createConnectionPoint(sourceBlock, 'left', 'connection-source-point');
        createConnectionPoint(targetBlock, 'right', 'connection-target-point');
      }
      
      // הודע גם למסוף על חיבור אפשרי
      log(`זוהה חיבור פוטנציאלי ${direction}: ${sourceBlock.id} -> ${targetBlock.id}`);
    } catch (err) {
      log(`שגיאה בהדגשת חיבור: ${err.message}`);
    }
  }
  
  // בדיקת חפיפה אנכית בין שני בלוקים
  function checkVerticalOverlap(rect1, rect2) {
    // אם אחד המלבנים לא תקין, החזר שקר
    if (!rect1 || !rect2 || !rect1.height || !rect2.height) {
      return false;
    }
    
    const topOverlap = Math.max(rect1.top, rect2.top);
    const bottomOverlap = Math.min(rect1.bottom, rect2.bottom);
    const overlapHeight = bottomOverlap - topOverlap;
    
    if (overlapHeight <= 0) {
      return false; // אין חפיפה בכלל
    }
    
    // חפיפה אנכית מספקת אם היא יותר מאחוז מסוים מגובה הבלוק הקטן יותר
    const minHeight = Math.min(rect1.height, rect2.height);
    const overlapRatio = overlapHeight / minHeight;
    
    return overlapRatio >= config.verticalOverlapRequired;
  }
  
  // מציאת הבלוק הימני ביותר בקבוצה
  function findRightmostBlock(blocks) {
    if (!blocks || blocks.length === 0) return null;
    
    // מצא את הבלוק עם המיקום הימני ביותר
    let rightmost = blocks[0];
    let rightPosition = rightmost.getBoundingClientRect().right;
    
    for (let i = 1; i < blocks.length; i++) {
      const position = blocks[i].getBoundingClientRect().right;
      if (position > rightPosition) {
        rightPosition = position;
        rightmost = blocks[i];
      }
    }
    
    return rightmost;
  }
  
  // מציאת הבלוק השמאלי ביותר בקבוצה - עם שיפורים
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
    
    return leftmost;
  }
  
  // שמירת רשימת הבלוקים בקבוצה הנגררת
  function storeDraggedGroup(blocks) {
    if (!blocks || blocks.length === 0) return;
    
    draggedGroupBlocks = Array.from(blocks || []);
    log(`נשמרו ${draggedGroupBlocks.length} בלוקים בקבוצה הנגררת`);
  }
  
  // בדיקה אם בלוק יכול להתחבר בכיוון מסוים
  function canConnectInDirection(block, direction) {
    if (!block) return false;
    
    // בדוק אם הבלוק כבר מחובר בכיוון המבוקש
    if (direction === 'left') {
      const isConnectedFromLeft = block.hasAttribute('data-connected-from-left') && 
                                  block.getAttribute('data-connected-from-left') !== "";
      return !isConnectedFromLeft;
    } else { // direction === 'right'
      const isConnectedFromRight = block.hasAttribute('data-connected-from-right') && 
                                  block.getAttribute('data-connected-from-right') !== "";
      return !isConnectedFromRight;
    }
  }
  
  // פונקציה משופרת למציאת בלוקים מחוברים
  function findConnectedBlocks(startBlock) {
    if (!startBlock) return [];
    
    // אם זמינה פונקציית API מקורית, השתמש בה
    if (window.groupDragApi?.findConnectedBlocks) {
      return window.groupDragApi.findConnectedBlocks(startBlock);
    }
    
    // אוסף כל הבלוקים המחוברים
    const result = [startBlock];
    const processed = new Set([startBlock.id]);
    
    // תור לסריקה
    const queue = [startBlock];
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      // חיפוש חיבורים בכל הכיוונים
      const connections = new Set();
      
      // בדיקת חיבורים לצד ימין של הבלוק הנוכחי
      if (current.hasAttribute('data-connected-to') && current.getAttribute('data-connected-to') !== "") {
        connections.add(current.getAttribute('data-connected-to'));
      }
      
      // בדיקת חיבורים מהצד השמאלי של הבלוק הנוכחי
      if (current.hasAttribute('data-connected-from-left') && current.getAttribute('data-connected-from-left') !== "") {
        connections.add(current.getAttribute('data-connected-from-left'));
      }
      
      // בדיקת חיבורים שמובילים לבלוק הנוכחי מהצד השמאלי שלו
      const leftConnections = document.querySelectorAll(`[data-connected-to="${current.id}"][data-connection-direction="right"]`);
      leftConnections.forEach(block => connections.add(block.id));
      
      // בדיקת חיבורים מהצד הימני של הבלוק הנוכחי
      if (current.hasAttribute('data-connected-from-right') && current.getAttribute('data-connected-from-right') !== "") {
        connections.add(current.getAttribute('data-connected-from-right'));
      }
      
      // בדיקת חיבורים שמובילים לבלוק הנוכחי מהצד הימני שלו
      const rightConnections = document.querySelectorAll(`[data-connected-to="${current.id}"][data-connection-direction="left"]`);
      rightConnections.forEach(block => connections.add(block.id));
      
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
    
    return result;
  }
  
  // פונקציה לביטול סימוני גרירה
  function clearDraggingState() {
    document.querySelectorAll('.group-dragging').forEach(block => {
      block.classList.remove('group-dragging');
      block.style.zIndex = '';
    });
  }
  
  // פונקציה לשינוי סימוני בלוקים - משופרת לתמיכה בחיבורים אמינים יותר
  function updateBlockConnections(sourceBlock, targetBlock, direction) {
    try {
      if (direction === 'right') {
        // חיבור הצד הימני של המקור לצד שמאלי של היעד
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', 'left');
        targetBlock.setAttribute('data-connected-from-left', sourceBlock.id);
        
        // וודא שאין חיבורים סותרים
        sourceBlock.removeAttribute('data-connected-from-right');
        
        log(`עדכון תכונות חיבור: ${sourceBlock.id} -> (ימין לשמאל) -> ${targetBlock.id}`);
      } else {
        // חיבור הצד השמאלי של המקור לצד ימני של היעד
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', 'right');
        targetBlock.setAttribute('data-connected-from-right', sourceBlock.id);
        
        // וודא שאין חיבורים סותרים
