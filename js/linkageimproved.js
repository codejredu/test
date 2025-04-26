// --- START OF FILE linkageimproved.js ---
// --- Version 3.9: Centered External Marker (Reverting v3.8 Y-calc) ---
// Changes from v3.8:
// 1. Reverted the vertical positioning logic for external markers introduced in v3.8.
// 2. External markers are now vertically centered relative to the block height using CSS (top: 50%; transform: translateY(-50%)).
// 3. Removed EXTERNAL_MARKER_CONN_HEIGHT and EXTERNAL_MARKER_CONN_OFFSET_Y from CONFIG.

(function() {
  // ... (משתנים גלובליים ללא שינוי) ...
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 8,
    PROXIMITY_HIGHLIGHT_THRESHOLD: 40,
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4,
    BLOCK_GAP: 0,
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true,
    HIGHLIGHT_COLOR: '#FFC107',
    HIGHLIGHT_OPACITY: '0.5'
    // *** הוסרו: EXTERNAL_MARKER_CONN_HEIGHT, EXTERNAL_MARKER_CONN_OFFSET_Y ***
  };

  // ========================================================================
  // הוספת סגנונות CSS - חזרה לסגנון המקורי של מיקום הסמן
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* ... (סגנונות snap-source, connection-point-highlight ללא שינוי) ... */
      .snap-source {
        box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important;
        cursor: grabbing !important;
        z-index: 1001 !important;
      }
      .connection-point-highlight {
         filter: drop-shadow(0 0 4px rgba(255,193,7,0.8)) !important;
         transition: fill 0.1s ease-out, stroke 0.1s ease-out, fill-opacity 0.1s ease-out;
      }

      /* סמן חיצוני למקרה שאין נקודות עיגון SVG */
      .svg-anchor-marker {
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: rgba(255, 193, 7, 0.6);
        border: 2px solid ${CONFIG.HIGHLIGHT_COLOR};
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease-out; /* הסרת transition מיותר ל-top/transform */
        z-index: 1002;
        box-shadow: 0 0 8px 2px rgba(255,193,7,0.4);
        /* *** חזרה למיקום האנכי המקורי *** */
        top: 50%; /* מרכז אנכי יחסית לגובה הבלוק */
      }

      .marker-left {
        left: 0px;
        transform: translate(-50%, -50%); /* הזז שמאלה ומרכז אנכית */
      }

      .marker-right {
        right: 0px;
        transform: translate(50%, -50%); /* הזז ימינה ומרכז אנכית */
      }

      .marker-visible {
        opacity: 1;
      }

      /* ... (סגנונות אנימציה, תפריט וכו' ללא שינוי) ... */
      @keyframes snapEffect { 0%{transform:scale(1)} 35%{transform:scale(1.05)} 70%{transform:scale(0.98)} 100%{transform:scale(1)} }
      .snap-animation { animation:snapEffect 0.3s ease-out; }
      @keyframes detachEffect { 0%{transform:translate(0,0) rotate(0)} 30%{transform:translate(3px,1px) rotate(0.8deg)} 60%{transform:translate(-2px,2px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0)} }
      .detach-animation { animation:detachEffect 0.3s ease-in-out; }
      #detach-menu { position:absolute; background-color:white; border:1px solid #ccc; border-radius:4px; box-shadow:0 3px 8px rgba(0,0,0,0.2); z-index:1100; padding:5px; font-size:14px; min-width:100px; }
      #detach-menu div { padding:6px 12px; cursor:pointer; border-radius:3px; }
      #detach-menu div:hover { background-color:#eee; }
      body.user-select-none { user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; }
      .connected-block, .has-connected-block { /* Optional */ }
      #sound-test-button { position:fixed; bottom:15px; right:15px; padding:8px 12px; background-color:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; z-index:9999; font-family:Arial,sans-serif; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background-color .2s,opacity .5s ease-out; opacity:1; }
      #sound-test-button:hover { background-color:#0b7dda; }
      #sound-test-button.success { background-color:#4CAF50; }
      #sound-test-button.error { background-color:#f44336; }
      #sound-test-button.loading { background-color:#ff9800; cursor:wait; }
      #sound-test-button.hidden { opacity:0; pointer-events:none; }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Styles added (Centered External Marker)');
  }

  // ========================================================================
  // אתחול אודיו, כפתור בדיקה, נגינת צליל - ללא שינוי
  // ========================================================================
  function initAudio() { /* ... קוד זהה ... */ }
  function addSoundTestButton() { /* ... קוד זהה ... */ }
  function playSnapSound() { /* ... קוד זהה ... */ }

  // ========================================================================
  // איתור והדגשת נקודות עיגון בתוך ה-SVG - ללא שינוי
  // ========================================================================
  function findSVGConnectionPoints(block, direction) { /* ... קוד זהה ... */ }
  function highlightSVGConnectionPoints(block, direction) { /* ... קוד זהה ... */ }
  function clearAllSVGHighlights() { /* ... קוד זהה ... */ }

  // ========================================================================
  // *** הוספת סמן חיצוני - חזרה ללוגיקה פשוטה ***
  // ========================================================================
  function addExternalMarker(block, direction) {
    if (!block) return;

    // בדוק אם כבר קיים סמן עם הקלאס הספציפי
    let marker = block.querySelector(`.svg-anchor-marker.marker-${direction}`);

    // אם לא, צור אחד חדש
    if (!marker) {
      marker = document.createElement('div');
      // הוסף קלאס בסיס וקלאס כיוון ספציפי
      marker.className = `svg-anchor-marker marker-${direction}`;
      block.appendChild(marker);
      if (CONFIG.DEBUG > 1) console.log(`Created external marker for ${block.id} (${direction})`);
    } else {
      if (CONFIG.DEBUG > 1) console.log(`Reusing external marker for ${block.id} (${direction})`);
    }

    // הסגנונות top, left/right, transform מוגדרים ע"י CSS
    // רק צריך להפוך אותו לנראה
    marker.classList.add('marker-visible');
    // אין צורך לעדכן style.top או style.transform כאן
  }


  // ========================================================================
  // מאזינים, זיהוי בלוקים, קליק ימני, MouseDown - ללא שינוי
  // ========================================================================
  function initProgrammingAreaListeners() { /* ... קוד זהה ... */ }
  function observeNewBlocks() { /* ... קוד זהה ... */ }
  function initExistingBlocks() { /* ... קוד זהה ... */ }
  function addBlockDragListeners(b) { /* ... קוד זהה ... */ }
  function handleContextMenu(e) { /* ... קוד זהה ... */ }
  function handleMouseDown(e) { /* ... קוד זהה ... */ }

  // ========================================================================
  // מאזינים גלובליים, MouseLeave, MouseMove - ללא שינוי
  // ========================================================================
  function initGlobalMouseListeners() { /* ... קוד זהה ... */ }
  function handleMouseLeave(e) { /* ... קוד זהה ... */ }
  function handleMouseMove(e) { /* ... קוד זהה ... */ }

  // ========================================================================
  // בדיקת הצמדה והדגשה - ללא שינוי (מגרסה 3.7)
  // ========================================================================
  function checkAndHighlightSnapPossibility() { /* ... קוד זהה מגרסה 3.7 ... */ }

  // ========================================================================
  // טיפול בשחרור העכבר (MouseUp) - ללא שינוי (מגרסה 3.7)
  // ========================================================================
  function handleMouseUp(e) { /* ... קוד זהה מגרסה 3.7 ... */ }

  // ========================================================================
  // ביצוע ההצמדה הפיזית (כולל הקפיצה) - ללא שינוי
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) { /* ... קוד זהה ... */ }

  // ========================================================================
  // פונקציות ניתוק, תפריט, אנימציה, יצירת מזהה - ללא שינוי
  // ========================================================================
  function showDetachMenu(x, y, b) { /* ... קוד זהה ... */ }
  function closeMenuOutside(e) { /* ... קוד זהה ... */ }
  function removeDetachMenu() { /* ... קוד זהה ... */ }
  function detachBlock(btd, animate=true) { /* ... קוד זהה ... */ }
  function addSnapEffectAnimation(b) { /* ... קוד זהה ... */ }
  function addDetachEffectAnimation(b) { /* ... קוד זהה ... */ }
  function generateUniqueId(b) { /* ... קוד זהה ... */ }

  // ========================================================================
  // אתחול המערכת כולה
  // ========================================================================
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v3_9_svg'; // עדכון גרסה ודגל
    if (window[initFlag]) {
        if (CONFIG.DEBUG) console.log("Block linkage system v3.9 SVG (Centered External Marker) already initialized. Skipping.");
        return;
    }

    // גרסה 3.9 SVG - חזרה לסמן חיצוני ממורכז
    addHighlightStyles();
    initAudio();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();

    if (CONFIG.PLAY_SOUND) {
      addSoundTestButton();
    }

    window[initFlag] = true;
    console.log(`Block linkage system initialized (Version 3.9 SVG - Centered External Marker, Highlight Threshold=${CONFIG.PROXIMITY_HIGHLIGHT_THRESHOLD}px, Snap Threshold=${CONFIG.CONNECT_THRESHOLD}px)`);
    // הסרת הלוגים של הקונפיגורציה שהוסרה
    console.log(`Configuration: Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // הפעל את האתחול
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem(); // DOM already loaded
  }

})(); // סוף IIFE

// --- END OF FILE linkageimproved.js ---
