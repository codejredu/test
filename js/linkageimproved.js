// --- START OF FILE linkageimproved.js ---
// --- Version 3.3: Refined Snapping Threshold and Visuals ---
// Changes from v3.2:
// 1. Snap highlight (yellow halo) and future position indicator (blue rectangle)
//    now appear only when blocks are within 3px horizontally (configurable).
// 2. Blocks snap on mouse release *only* if the highlight was active.
// 3. Snap sound plays on successful snap.
// 4. Confirmed colors: Yellow halo, Blue indicator.
// 5. Confirmed adjacent positioning (simulating pin/socket) using BLOCK_GAP=0.

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null; // 'left' or 'right'
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null; // אודיו לצליל הצמדה
  let audioContextAllowed = false; // Track if user interaction has allowed audio
  let soundInitialized = false; // Track if initAudio was successful

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5, // Not actively used in current snapping logic, but kept for context
    // *** שונה ***: סף מרחק קטן להפעלת ההדגשה וההצמדה
    CONNECT_THRESHOLD: 1, // **הסף שונה ל-3 פיקסלים כפי שביקשת** (היה 15). ייתכן שתרצה להגדיל מעט לנוחות שימוש.
    VERTICAL_ALIGN_THRESHOLD: 20, // For potential future use, less critical with overlap check
    VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות (חשוב מאוד)
    BLOCK_GAP: 0, // **אין רווח בין בלוקים מוצמדים (מדמה שקע-תקע)**
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3', // נתיב לקובץ השמע (ודא שהוא קיים)
    DEBUG: true // Set to false for production
  };

  // ========================================================================
  // הוספת סגנונות CSS - גרסה משופרת עם הילה בולטת ומחוון כחול
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;

    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* בלוק נגרר - הופכים עליון ומדגישים */
      .snap-source {
         box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4) !important;
         transition: box-shadow 0.15s ease-out;
         cursor: grabbing !important;
         z-index: 1001 !important;
      }

      /* *** הילה צהובה *** סביב בלוק יעד פוטנציאלי (מופיעה רק בסף הנמוך) */
      .snap-target {
        outline: 6px solid #FFC107 !important; /* צהוב בולט */
        outline-offset: 4px;
        box-shadow: 0 0 20px 8px rgba(255, 193, 7, 0.8) !important;
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important;
      }

      /* *** מלבן כחול מקווקו *** לציון מיקום עתידי (מופיע עם ההילה) */
      .future-position-indicator {
        position: absolute;
        border: 3px dashed rgba(0, 120, 255, 0.95) !important; /* *** צבע כחול *** */
        border-radius: 5px;
        background-color: rgba(0, 120, 255, 0.15) !important; /* *** רקע כחול שקוף *** */
        pointer-events: none;
        z-index: 998;
        opacity: 0;
        transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear;
        display: none; /* Start hidden */
      }
      /* Show with opacity when display is block */
       .future-position-indicator.visible {
        display: block;
        opacity: 0.9;
      }

      /* סימון כיוון (פס צהוב בצד) - נשאר צהוב כמו ההילה */
      .snap-target.snap-left::before {
        content: '';
        position: absolute;
        left: -10px; top: 10%; bottom: 10%; width: 8px;
        background-color: #FFC107; /* צהוב */
        border-radius: 2px; z-index: 1000;
        box-shadow: 0 0 10px 2px rgba(255, 193, 7, 0.8);
        transition: all 0.1s ease-out;
      }
      .snap-target.snap-right::after {
        content: '';
        position: absolute;
        right: -10px; top: 10%; bottom: 10%; width: 8px;
        background-color: #FFC107; /* צהוב */
        border-radius: 2px; z-index: 1000;
        box-shadow: 0 0 10px 2px rgba(255, 193, 7, 0.8);
        transition: all 0.1s ease-out;
      }

      /* אנימציות (ללא שינוי) */
      @keyframes snapEffect { 0% { transform: scale(1); } 35% { transform: scale(1.05); } 70% { transform: scale(0.98); } 100% { transform: scale(1); } }
      .snap-animation { animation: snapEffect 0.3s ease-out; }
      @keyframes detachEffect { 0% { transform: translate(0, 0) rotate(0); } 30% { transform: translate(3px, 1px) rotate(0.8deg); } 60% { transform: translate(-2px, 2px) rotate(-0.5deg); } 100% { transform: translate(0, 0) rotate(0); } }
      .detach-animation { animation: detachEffect 0.3s ease-in-out; }

      /* תפריט ניתוק (ללא שינוי) */
      #detach-menu { position: absolute; background-color: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 3px 8px rgba(0,0,0,0.2); z-index: 1100; padding: 5px; font-size: 14px; min-width: 100px; }
      #detach-menu div { padding: 6px 12px; cursor: pointer; border-radius: 3px; }
      #detach-menu div:hover { background-color: #eee; }

      /* כללי: מניעת בחירת טקסט (ללא שינוי) */
      body.user-select-none { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }

      /* בלוקים מחוברים (ללא שינוי) */
      .connected-block, .has-connected-block { /* Optional styling */ }

      /* כפתור בדיקת שמע (ללא שינוי) */
      #sound-test-button { position: fixed; bottom: 15px; right: 15px; padding: 8px 12px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; z-index: 9999; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: background-color 0.2s, opacity 0.5s ease-out; opacity: 1; }
      #sound-test-button:hover { background-color: #0b7dda; }
      #sound-test-button.success { background-color: #4CAF50; }
      #sound-test-button.error { background-color: #f44336; }
      #sound-test-button.loading { background-color: #ff9800; cursor: wait; }
      #sound-test-button.hidden { opacity: 0; pointer-events: none; }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Highlighting (Yellow Halo, Blue Indicator) and animation styles added/verified.');
  }

  // ========================================================================
  // אתחול מערכת השמע (קובץ MP3 חיצוני) - ללא שינוי מהותי
  // ========================================================================
  function initAudio() {
    if (!CONFIG.PLAY_SOUND) return;
    if (soundInitialized) return;

    try {
      const existingAudio = document.getElementById('snap-sound-element');
      if (existingAudio) {
          snapSound = existingAudio;
          soundInitialized = true;
          if (CONFIG.DEBUG) console.log('Audio element already exists and reused.');
          if (!snapSound.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)) {
               if (CONFIG.DEBUG) console.log('Audio element exists but needs updated source.');
               snapSound.innerHTML = '';
               const source = document.createElement('source');
               source.src = CONFIG.SOUND_PATH; source.type = 'audio/mpeg';
               snapSound.appendChild(source); snapSound.load();
          }
          return;
      }

      snapSound = document.createElement('audio');
      snapSound.id = 'snap-sound-element';
      snapSound.preload = 'auto';
      snapSound.volume = CONFIG.SOUND_VOLUME;

      const source = document.createElement('source');
      source.src = CONFIG.SOUND_PATH;
      source.type = 'audio/mpeg'; // MIME type for MP3
      snapSound.appendChild(source);

      snapSound.addEventListener('error', (e) => {
        console.error(`Error loading audio file: ${CONFIG.SOUND_PATH}`, e);
        const button = document.getElementById('sound-test-button');
        if (button) {
            button.textContent = 'שגיאה בטעינת קובץ'; button.className = 'error';
            button.style.backgroundColor = '#f44336'; button.disabled = true;
        }
        CONFIG.PLAY_SOUND = false; snapSound = null; soundInitialized = false;
      });

      snapSound.addEventListener('canplaythrough', () => {
          soundInitialized = true;
          if (CONFIG.DEBUG) console.log('Audio element initialized and ready to play.');
          const button = document.getElementById('sound-test-button');
          if (button && button.classList.contains('loading')) {
              button.textContent = 'בדוק צליל הצמדה'; button.classList.remove('loading');
              button.disabled = false; button.style.backgroundColor = '#2196F3';
          }
      });

      snapSound.style.display = 'none';
      document.body.appendChild(snapSound);
      if (CONFIG.DEBUG) console.log(`Audio element created, attempting to load: ${CONFIG.SOUND_PATH}`);

    } catch (err) {
      console.error('Error initializing audio element:', err);
      CONFIG.PLAY_SOUND = false; snapSound = null; soundInitialized = false;
    }
  }


  // ========================================================================
  // הוספת כפתור בדיקת שמע - ללא שינוי מהותי
  // ========================================================================
  function addSoundTestButton() {
     if (!CONFIG.PLAY_SOUND) return;
    try {
      const existingButton = document.getElementById('sound-test-button');
      if (existingButton) existingButton.remove();

      const button = document.createElement('button');
      button.id = 'sound-test-button';
      button.title = 'לחץ כאן כדי לבדוק את צליל ההצמדה';
      button.className = '';

      if (!snapSound) {
          button.textContent = 'אתחול שמע נכשל'; button.classList.add('error');
          button.style.backgroundColor = '#f44336'; button.disabled = true;
      } else if (!soundInitialized) {
          button.textContent = 'טוען צליל...'; button.classList.add('loading');
          button.style.backgroundColor = '#ff9800'; button.disabled = true;
      } else {
          button.textContent = 'בדוק צליל הצמדה'; button.style.backgroundColor = '#2196F3';
          button.disabled = false;
      }

      button.style.position = 'fixed'; button.style.bottom = '15px'; button.style.right = '15px';
      button.style.zIndex = '9999'; button.style.padding = '8px 12px'; button.style.color = 'white';
      button.style.border = 'none'; button.style.borderRadius = '4px'; button.style.cursor = 'pointer';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)'; button.style.fontFamily = 'Arial, sans-serif';
      button.style.fontSize = '14px'; button.style.fontWeight = 'bold';
      button.style.transition = 'background-color 0.2s, opacity 0.5s ease-out'; button.style.opacity = '1';

      button.onmouseover = function() { if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) { this.style.backgroundColor = '#0b7dda'; } };
      button.onmouseout = function() { if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) { this.style.backgroundColor = '#2196F3'; } };

      button.addEventListener('click', function() {
        if (this.disabled || !snapSound || !soundInitialized) { console.warn('Sound test clicked but audio not ready or disabled.'); return; }

        snapSound.play().then(() => {
          if (CONFIG.DEBUG) console.log('Sound test successful!');
          button.textContent = 'הצליל פועל ✓'; button.classList.add('success'); button.style.backgroundColor = '#4CAF50';
          audioContextAllowed = true;
          setTimeout(() => { button.classList.add('hidden'); setTimeout(() => { button.remove(); }, 500); }, 3000);
          if(snapSound) { snapSound.pause(); snapSound.currentTime = 0; }
        }).catch(err => {
          console.warn('Sound test failed:', err);
          if (err.name === 'NotAllowedError') {
              button.textContent = 'שמע חסום - לחץ שוב'; button.classList.add('error'); button.style.backgroundColor = '#f44336'; audioContextAllowed = false;
          } else {
              button.textContent = 'שגיאת נגינה'; button.classList.add('error'); button.style.backgroundColor = '#f44336'; button.disabled = true;
          }
        });
      });

      document.body.appendChild(button);
      if (CONFIG.DEBUG) console.log('Sound test button added/updated.');
    } catch (err) { console.error('Error adding sound test button:', err); }
  }

  // ========================================================================
  // השמעת צליל הצמדה (MP3) - נקרא מ-performBlockSnap
  // ========================================================================
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) {
      if (CONFIG.DEBUG && CONFIG.PLAY_SOUND && (!snapSound || !soundInitialized)) { console.log(`Snap sound skipped: audio enabled but not ready (snapSound: ${!!snapSound}, initialized: ${soundInitialized})`); }
      return;
    }
    if (!audioContextAllowed && CONFIG.DEBUG) { console.warn('Attempting to play sound before confirmed user interaction. Might be blocked.'); }

    try {
      if (snapSound.readyState < 3) { // HAVE_FUTURE_DATA or more
          if (CONFIG.DEBUG) console.log('Snap sound skipped: audio data not yet available.');
          return;
      }
      snapSound.pause();
      snapSound.currentTime = 0; // Reset playback to the beginning
      const playPromise = snapSound.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          audioContextAllowed = true; // Confirm interaction worked
          if (CONFIG.DEBUG > 1) console.log('Snap sound played.');
        }).catch(err => {
          if (err.name === 'NotAllowedError') { console.warn('Snap sound blocked by browser policy. User interaction needed.'); audioContextAllowed = false; if (!document.getElementById('sound-test-button')) { addSoundTestButton(); } }
          else if (err.name === 'AbortError') { if (CONFIG.DEBUG > 1) console.log('Snap sound playback aborted (likely rapid interaction).'); }
          else { console.error('Error playing snap sound:', err); }
        });
      }
    } catch (err) { console.error('Unexpected error trying to play snap sound:', err); }
  }

  // ========================================================================
  // אתחול מאזינים באזור התכנות - ללא שינוי
  // ========================================================================
  function initProgrammingAreaListeners() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) { console.error('Programming area (#program-blocks) not found!'); return; }
    programmingArea.addEventListener('dragover', (e) => { e.preventDefault(); });
    programmingArea.addEventListener('dragstart', (e) => {
        if (e.target && e.target.closest && e.target.closest('#program-blocks .block-container')) {
            if (CONFIG.DEBUG) console.log("Preventing default dragstart for internal block.");
            e.preventDefault();
        }
    });
  }

  // ========================================================================
  // האזנה לבלוקים חדשים - ללא שינוי
  // ========================================================================
  function observeNewBlocks() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
                let block = null;
                if (node.classList && node.classList.contains('block-container')) { block = node; }
                else if (node.querySelector && node.querySelector('.block-container')) { block = node.querySelector('.block-container'); }
                if (block && block.closest('#program-blocks')) {
                  if (!block.id) generateUniqueId(block);
                  addBlockDragListeners(block);
                  if (CONFIG.DEBUG) console.log(`New block detected and initialized: ${block.id}`);
                }
            }
          });
        }
      });
    });
    observer.observe(programmingArea, { childList: true, subtree: true });
    if (CONFIG.DEBUG) console.log("MutationObserver watching for new blocks.");
  }

  // ========================================================================
  // הוספת מאזינים לבלוקים קיימים - ללא שינוי
  // ========================================================================
  function initExistingBlocks() {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;
      programmingArea.querySelectorAll('.block-container').forEach(block => {
          if (!block.id) generateUniqueId(block);
          addBlockDragListeners(block);
      });
      if (CONFIG.DEBUG) console.log("Listeners added to existing blocks.");
  }

  // ========================================================================
  // הוספת מאזיני גרירה וקליק ימני לבלוק - ללא שינוי
  // ========================================================================
  function addBlockDragListeners(block) {
      block.removeEventListener('mousedown', handleMouseDown);
      block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu);
      block.addEventListener('contextmenu', handleContextMenu);
  }

  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק - ללא שינוי מהותי
  // ========================================================================
  function handleMouseDown(e) {
      if (e.button !== 0 || !e.target.closest) return;
      if (e.target.matches('input, button, select, textarea, a[href]')) {
        if (CONFIG.DEBUG > 1) console.log("[MouseDown] Ignored on interactive element:", e.target.tagName);
        return;
      }
      const block = e.target.closest('.block-container');
      if (!block || !block.parentElement || block.parentElement.id !== 'program-blocks') return;
      if (!block.id) generateUniqueId(block);

      e.preventDefault();
      block.draggable = false;

      if (CONFIG.DEBUG) console.log(`[MouseDown] Started for block: ${block.id}`);

      // ניתוק אוטומטי לפני גרירה (חיוני)
      if (block.hasAttribute('data-connected-to')) {
          if (CONFIG.DEBUG) console.log(`[MouseDown] Block ${block.id} was connected TO, detaching...`);
          detachBlock(block, false); // נתק בלי אנימציה
      }
      const connectedFromLeftId = block.getAttribute('data-connected-from-left');
      if (connectedFromLeftId) {
          const blockFromLeft = document.getElementById(connectedFromLeftId);
          if (blockFromLeft) { detachBlock(blockFromLeft, false); }
          else { block.removeAttribute('data-connected-from-left'); }
      }
      const connectedFromRightId = block.getAttribute('data-connected-from-right');
      if (connectedFromRightId) {
          const blockFromRight = document.getElementById(connectedFromRightId);
           if (blockFromRight) { detachBlock(blockFromRight, false); }
           else { block.removeAttribute('data-connected-from-right'); }
      }

      // התחל גרירה
      currentDraggedBlock = block;
      isDraggingBlock = true;
      const rect = block.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      const parentElement = document.getElementById('program-blocks');
      const parentRect = parentElement.getBoundingClientRect();

      if (window.getComputedStyle(block).position !== 'absolute') {
        block.style.position = 'absolute';
        block.style.left = (rect.left - parentRect.left + parentElement.scrollLeft) + 'px';
        block.style.top = (rect.top - parentRect.top + parentElement.scrollTop) + 'px';
      }
      block.style.margin = '0';
      block.style.zIndex = '1001';
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none');
      if (CONFIG.DEBUG) console.log(`[MouseDown] Initial drag setup: left=${block.style.left}, top=${block.style.top}`);
  }

  // ========================================================================
  // טיפול בקליק ימני על בלוק - ללא שינוי
  // ========================================================================
  function handleContextMenu(e) {
      e.preventDefault();
      const block = e.target.closest('.block-container');
      if (block && block.hasAttribute('data-connected-to')) {
          showDetachMenu(e.clientX, e.clientY, block);
      }
  }

  // ========================================================================
  // מאזינים גלובליים לתנועה ושחרור עכבר - ללא שינוי
  // ========================================================================
  function initGlobalMouseListeners() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseLeave); // Handle leaving window
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
  }

  function handleMouseLeave(e) {
      if (isDraggingBlock && e.target === document.documentElement && !e.relatedTarget) {
          if (CONFIG.DEBUG) console.warn("Mouse left document during drag, treating as mouseup.");
          handleMouseUp(e); // Treat as mouse up
      }
  }

  // ========================================================================
  // טיפול בתנועת העכבר בזמן גרירה - ללא שינוי מהותי
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    e.preventDefault();
    const parentElement = document.getElementById('program-blocks');
    if (!parentElement) { handleMouseUp(e); return; }

    const parentRect = parentElement.getBoundingClientRect();
    let newLeft = e.clientX - parentRect.left - dragOffset.x + parentElement.scrollLeft;
    let newTop = e.clientY - parentRect.top - dragOffset.y + parentElement.scrollTop;

    const blockWidth = currentDraggedBlock.offsetWidth;
    const blockHeight = currentDraggedBlock.offsetHeight;
    const scrollWidth = parentElement.scrollWidth;
    const scrollHeight = parentElement.scrollHeight;

    // Boundary checks
    newLeft = Math.max(0, Math.min(newLeft, scrollWidth - blockWidth));
    newTop = Math.max(0, Math.min(newTop, scrollHeight - blockHeight));

    currentDraggedBlock.style.left = Math.round(newLeft) + 'px';
    currentDraggedBlock.style.top = Math.round(newTop) + 'px';

    // בדוק אפשרות הצמדה והצג הדגשות (רק אם עומד בסף הקטן)
    checkAndHighlightSnapPossibility();
  }

  // ========================================================================
  // טיפול בשחרור העכבר (סיום גרירה) - ההצמדה תלויה ב-potentialSnapTarget
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock;
    const targetToSnap = potentialSnapTarget; // היעד שהיה מודגש (אם היה)
    const directionToSnap = snapDirection;   // הכיוון שהיה מודגש

    if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing block ${blockReleased.id}. Highlighted target: ${targetToSnap?.id || 'none'}, direction: ${directionToSnap || 'none'}`);

    // --- ניקוי מיידי של מצב הגרירה וההדגשות ---
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null; // Reset for next drag
    snapDirection = null;      // Reset for next drag
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source');
    blockReleased.style.zIndex = '';
    // הסר את כל ההדגשות והאינדיקטורים מכל הבלוקים הפוטנציאליים
    document.querySelectorAll('.snap-target').forEach(el => {
      el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    removeFuturePositionIndicator(); // הסתר מחוון כחול
    // --- סוף ניקוי ---

    // *** לוגיקת הצמדה בשחרור ***
    // בצע הצמדה אך ורק אם היה יעד מודגש ברגע השחרור
    if (targetToSnap && directionToSnap) {
      if (CONFIG.DEBUG) console.log(`[MouseUp] Performing snap: ${blockReleased.id} to ${targetToSnap.id} (${directionToSnap})`);
      const snapSuccess = performBlockSnap(blockReleased, targetToSnap, directionToSnap);
      // PerformBlockSnap מטפל ב-draggable=false בהצלחה
      if (!snapSuccess) {
          blockReleased.draggable = true; // אפשר גרירה מחדש אם ההצמדה נכשלה
          if (CONFIG.DEBUG) console.log(`[MouseUp] Snap failed, ensuring block ${blockReleased.id} is draggable.`);
      } else {
           if (CONFIG.DEBUG) console.log(`[MouseUp] Snap successful, block ${blockReleased.id} is now connected.`);
           // draggable يبقى false כי הוא מחובר
      }
    } else {
      // לא היה יעד מודגש (לא היה קרוב מספיק או לא היה יעד מתאים)
      if (CONFIG.DEBUG) console.log(`[MouseUp] No highlighted target on release. Block ${blockReleased.id} remains free.`);
      blockReleased.draggable = true; // ודא שניתן לגרור אותו שוב כי הוא חופשי
    }

    if (CONFIG.DEBUG) console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
  }

  // ========================================================================
  // בדיקת הצמדה והדגשה - מפעיל הדגשה רק בסף הקטן (CONNECT_THRESHOLD)
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null);

    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1; // Start above threshold

    // איפוס הדגשות קודמות ויעד פוטנציאלי לפני הבדיקה הנוכחית
    // זה חשוב כי אם נתרחק, ההדגשה צריכה להיעלם
    document.querySelectorAll('.snap-target').forEach(el => {
        el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    potentialSnapTarget = null; // Reset global state
    snapDirection = null;
    removeFuturePositionIndicator(); // Hide indicator initially

    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      const targetRect = targetBlock.getBoundingClientRect();

      // Check if target sides are already connected
      const targetAlreadyConnectedOnLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetAlreadyConnectedOnRight = targetBlock.hasAttribute('data-connected-from-right');

      // חישוב - הפונקציה הזו תחזיר ערך רק אם המרחק <= CONFIG.CONNECT_THRESHOLD
      const snapInfo = calculateSnapInfo(sourceRect, targetRect);

      // אם נמצאה התאמה בטווח (כולל בדיקת חפיפה ומרחק <= 3px)
      if (snapInfo) {
         // בדוק אם הצד הזה פנוי ביעד
         let connectionAllowed = true;
         if (snapInfo.direction === 'left' && targetAlreadyConnectedOnLeft) { connectionAllowed = false; }
         else if (snapInfo.direction === 'right' && targetAlreadyConnectedOnRight) { connectionAllowed = false; }

         if (connectionAllowed && snapInfo.distance < minDistance) {
             // מצאנו את המטרה הקרובה ביותר *שעומדת בתנאים*
             minDistance = snapInfo.distance;
             bestTarget = targetBlock;
             bestDirection = snapInfo.direction;
         }
      }
    }

    // *** אם מצאנו יעד שעומד בסף הקטן (CONNECT_THRESHOLD) ***
    if (bestTarget) {
      if (CONFIG.DEBUG > 1) console.log(`[Highlight] Threshold met: ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}), dist: ${minDistance.toFixed(1)}px. Activating visuals.`);

      // עדכן את המצב הגלובלי שישמש ב-MouseUp
      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;

      // *** הפעל את ההדגשות הויזואליות (הילה צהובה ומחוון כחול) ***
      bestTarget.classList.add('snap-target'); // הילה צהובה
      bestTarget.classList.add(bestDirection === 'left' ? 'snap-left' : 'snap-right'); // פס צד
      const programRect = programmingArea.getBoundingClientRect();
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programRect); // מחוון כחול
    }
    // אם לא נמצא bestTarget (אף בלוק לא היה קרוב מספיק או חפף מספיק),
    // ההדגשות והמחוון לא יופעלו או יוסרו (כי איפסנו אותם בתחילת הפונקציה).
  }

  // ========================================================================
  // חישוב מידע על הצמדה אפשרית - מחזיר תוצאה רק אם עומד בסף
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) {
    // 1. בדיקת חפיפה אנכית
    const topOverlap = Math.max(sourceRect.top, targetRect.top);
    const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
    const minHeightForOverlapCheck = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;
    if (verticalOverlap < minHeightForOverlapCheck || verticalOverlap <= 0) {
      return null; // No snap if not enough vertical overlap
    }

    // 2. בדיקת מרחק אופקי
    let distance;
    let direction;
    const distRightToLeft = Math.abs(sourceRect.right - targetRect.left);
    const distLeftToRight = Math.abs(sourceRect.left - targetRect.right);

    if (distRightToLeft < distLeftToRight) {
        distance = distRightToLeft;
        direction = 'left'; // Source will be to the LEFT of target
    } else {
        distance = distLeftToRight;
        direction = 'right'; // Source will be to the RIGHT of target
    }

    // *** התנאי המרכזי: החזר מידע רק אם המרחק קטן או שווה לסף שנקבע ***
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
       if (CONFIG.DEBUG > 1) console.log(`[calculateSnapInfo] Within threshold (${CONFIG.CONNECT_THRESHOLD}px): direction=${direction}, distance=${distance.toFixed(2)}px`);
      return { direction, distance };
    }

    // אם המרחק גדול מהסף, אל תחזיר כלום (כאילו אין אפשרות הצמדה)
    // if (CONFIG.DEBUG > 1) console.log(`[CalcSnap] Distance too large (${distance.toFixed(1)}px > ${CONFIG.CONNECT_THRESHOLD}px)`);
    return null;
  }


  // ========================================================================
  // ביצוע ההצמדה הפיזית ועדכון מצב - כולל נגינת צליל MP3
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock) || targetBlock.offsetParent === null) {
      console.error("[performBlockSnap] Error: Invalid or detached block(s). Snap cancelled.", { source: sourceBlock?.id, target: targetBlock?.id });
      return false;
    }
    // בדיקה חוזרת שהיעד פנוי (למקרה של תחרות)
    if ((direction === 'left' && targetBlock.hasAttribute('data-connected-from-left')) ||
        (direction === 'right' && targetBlock.hasAttribute('data-connected-from-right'))) {
        console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} connection conflict on side '${direction}'.`);
        return false;
    }

    if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);

    try {
      const sourceRect = sourceBlock.getBoundingClientRect(); // Get final size before positioning
      const targetRect = targetBlock.getBoundingClientRect();
      const parentElement = document.getElementById('program-blocks');
      const parentRect = parentElement.getBoundingClientRect();

      // חישוב מיקום סופי (עם BLOCK_GAP = 0 זה יהיה צמוד)
      let finalLeft;
      if (direction === 'left') { // מקור משמאל ליעד
        finalLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
      } else { // מקור מימין ליעד
        finalLeft = targetRect.right + CONFIG.BLOCK_GAP;
      }
      const finalTop = targetRect.top; // יישור לחלק העליון של היעד

      // המרה ל-style יחסי לאזור התכנות
      let styleLeft = finalLeft - parentRect.left + parentElement.scrollLeft;
      let styleTop = finalTop - parentRect.top + parentElement.scrollTop;

      // מיקום סופי
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = `${Math.round(styleLeft)}px`;
      sourceBlock.style.top = `${Math.round(styleTop)}px`;
      sourceBlock.style.margin = '0'; // נטרול margin

      // עדכון מאפייני חיבור
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');

      // *** השמע צליל הצמדה (MP3) ***
      playSnapSound();

      // אנימציית הצמדה
      addSnapEffectAnimation(sourceBlock);

      // מנע גרירה מובנית מהבלוק המחובר
      sourceBlock.draggable = false; // חשוב!

      if (CONFIG.DEBUG) console.log(`[PerformSnap] Snap successful. ${sourceBlock.id} positioned at left=${styleLeft}px, top=${styleTop}px. Draggable: ${sourceBlock.draggable}`);
      return true;

    } catch (err) {
      console.error(`[PerformSnap] Error during snap for ${sourceBlock.id} -> ${targetBlock.id}:`, err);
      try { detachBlock(sourceBlock, false); } catch (detachErr) { console.error(`[PerformSnap] Error during cleanup detach:`, detachErr); }
      sourceBlock.draggable = true; // Allow retry drag
      return false;
    }
  }


  // ========================================================================
  // עדכון מחוון מיקום עתידי (מלבן כחול) - ללא שינוי מהותי
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    if (!futureIndicator) {
        futureIndicator = document.createElement('div');
        futureIndicator.id = 'future-position-indicator';
        futureIndicator.className = 'future-position-indicator'; // CSS class controls appearance (blue)
        programmingArea.appendChild(futureIndicator);
        if (CONFIG.DEBUG > 1) console.log('Created future position indicator.');
    }

    try {
        const sourceRectNow = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        const parentRect = programmingArea.getBoundingClientRect();

        let desiredViewportLeft, desiredViewportTop;
        desiredViewportTop = targetRect.top;
        if (direction === 'left') {
            desiredViewportLeft = targetRect.left - sourceRectNow.width - CONFIG.BLOCK_GAP;
        } else { // direction === 'right'
            desiredViewportLeft = targetRect.right + CONFIG.BLOCK_GAP;
        }

        let indicatorLeft = desiredViewportLeft - parentRect.left + programmingArea.scrollLeft;
        let indicatorTop = desiredViewportTop - parentRect.top + programmingArea.scrollTop;

        futureIndicator.style.left = Math.round(indicatorLeft) + 'px';
        futureIndicator.style.top = Math.round(indicatorTop) + 'px';
        futureIndicator.style.width = Math.round(sourceRectNow.width) + 'px';
        futureIndicator.style.height = Math.round(sourceRectNow.height) + 'px';
        futureIndicator.classList.add('visible'); // Make visible via CSS

    } catch (err) {
        console.error('Error updating future position indicator:', err);
        removeFuturePositionIndicator();
    }
  }

  // ========================================================================
  // הסרת מחוון מיקום עתידי - ללא שינוי
  // ========================================================================
  function removeFuturePositionIndicator() {
    if (futureIndicator) {
        futureIndicator.classList.remove('visible'); // Hide via CSS
    }
  }


  // ========================================================================
  // פונקציות עזר לניתוק בלוקים (ותפריט) - ללא שינוי מהותי
  // ========================================================================
  function showDetachMenu(x, y, block) {
    removeDetachMenu();
    const menu = document.createElement('div');
    menu.id = 'detach-menu';
    menu.style.left = `${x}px`; menu.style.top = `${y}px`;
    const detachOption = document.createElement('div');
    detachOption.textContent = 'נתק בלוק';
    detachOption.onclick = function(event) {
        event.stopPropagation(); detachBlock(block, true); removeDetachMenu();
    };
    menu.appendChild(detachOption); document.body.appendChild(menu);
    setTimeout(() => {
        document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
        window.addEventListener('scroll', removeDetachMenu, { capture: true, once: true });
    }, 0);
  }

  function closeMenuOutside(e) {
    const menu = document.getElementById('detach-menu');
    if (menu && !menu.contains(e.target)) { removeDetachMenu(); }
    else if (menu) { setTimeout(() => { document.addEventListener('click', closeMenuOutside, { capture: true, once: true }); }, 0); }
    window.removeEventListener('scroll', removeDetachMenu, { capture: true });
  }

  function removeDetachMenu() {
    const menu = document.getElementById('detach-menu');
    if (menu) {
        document.removeEventListener('click', closeMenuOutside, { capture: true });
        window.removeEventListener('scroll', removeDetachMenu, { capture: true });
        menu.remove();
    }
  }

  function detachBlock(blockToDetach, animate = true) {
    if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) {
        if (CONFIG.DEBUG > 1) console.log(`[Detach] Block ${blockToDetach?.id || 'unknown'} has no 'data-connected-to'. No action.`);
        return;
    }
    const targetId = blockToDetach.getAttribute('data-connected-to');
    const direction = blockToDetach.getAttribute('data-connection-direction');
    if (!targetId || !direction) {
        console.warn(`[Detach] Missing connection data on ${blockToDetach.id}. Cleaning up.`);
        blockToDetach.removeAttribute('data-connected-to'); blockToDetach.removeAttribute('data-connection-direction');
        blockToDetach.classList.remove('connected-block'); blockToDetach.draggable = true;
        return;
    }
    if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${blockToDetach.id} from target ${targetId} (direction: ${direction})`);

    // Clean source block
    blockToDetach.removeAttribute('data-connected-to');
    blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block');
    blockToDetach.draggable = true; // Make it draggable again!

    // Clean target block
    const targetBlock = document.getElementById(targetId);
    if (targetBlock) {
        targetBlock.removeAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right');
        const hasOtherConnections = targetBlock.hasAttribute('data-connected-from-left') || targetBlock.hasAttribute('data-connected-from-right') || targetBlock.hasAttribute('data-connected-to');
        if (!hasOtherConnections) { targetBlock.classList.remove('has-connected-block'); }
        if (CONFIG.DEBUG > 1) console.log(`[Detach] Target ${targetId} cleaned. Has other connections: ${hasOtherConnections}`);
    } else { console.warn(`[Detach] Target block ${targetId} not found for detached ${blockToDetach.id}.`); }

    if (animate) { addDetachEffectAnimation(blockToDetach); /* playDetachSound(); */ }
    if (CONFIG.DEBUG) console.log(`[Detach] Finished detaching ${blockToDetach.id}. Draggable: ${blockToDetach.draggable}`);
  }

  // ========================================================================
  // פונקציות עזר לאנימציה - ללא שינוי
  // ========================================================================
  function addSnapEffectAnimation(block) {
    block.classList.remove('snap-animation'); void block.offsetWidth;
    block.classList.add('snap-animation');
    block.addEventListener('animationend', () => { block.classList.remove('snap-animation'); }, { once: true });
  }
  function addDetachEffectAnimation(block) {
    block.classList.remove('detach-animation'); void block.offsetWidth;
    block.classList.add('detach-animation');
     block.addEventListener('animationend', () => { block.classList.remove('detach-animation'); }, { once: true });
  }

  // ========================================================================
  // יצירת ID ייחודי - ללא שינוי
  // ========================================================================
  function generateUniqueId(block) {
    if (block.id && typeof block.id === 'string' && block.id.trim() !== '') return block.id;
    const prefix = block.dataset.type || 'block';
    const uniqueSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    let attempt = 0; let uniqueId = `${prefix}-${uniqueSuffix}`;
    while (document.getElementById(uniqueId) && attempt < 10) { uniqueId = `${prefix}-${uniqueSuffix}-${attempt}`; attempt++; }
    if (attempt >= 10) { uniqueId = `${prefix}-${Date.now()}`; }
    block.id = uniqueId;
    if (CONFIG.DEBUG) console.log(`Generated ID for block: ${uniqueId}`);
    return uniqueId;
  }

  // ========================================================================
  // אתחול המערכת כולה - ללא שינוי מהותי
  // ========================================================================
  function initializeSystem() {
    if (window.blockLinkageInitialized_v3_3) { // Use versioned flag
        if (CONFIG.DEBUG) console.log("Block linkage system v3.3 already initialized. Skipping.");
        return;
    }

    addHighlightStyles();           // הוסף סגנונות (הילה צהובה, מחוון כחול)
    initAudio();                    // אתחל שמע (MP3)
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();

    if (CONFIG.PLAY_SOUND) { addSoundTestButton(); }

    window.blockLinkageInitialized_v3_3 = true; // Mark as initialized
    console.log(`Block linkage system initialized (Version 3.3 - Refined Snap ${CONFIG.CONNECT_THRESHOLD}px)`);
    console.log(`Configuration: Connect Threshold=${CONFIG.CONNECT_THRESHOLD}px, Vertical Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // הפעל את האתחול
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
      initializeSystem();
  }

})(); // סוף IIFE

// --- END OF FILE linkageimproved.js ---
