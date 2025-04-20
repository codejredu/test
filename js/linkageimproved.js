// --- START OF FILE linkageimproved.js ---
// --- Version 3.3: Adjusted Snap Thresholds ---

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
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 20, // *** שונה: הוגדל מ-15 ל-20 ***
    VERTICAL_ALIGN_THRESHOLD: 20, // (לא בשימוש ישיר בהצמדה כרגע, אבל נשאר)
    VERTICAL_OVERLAP_REQ: 0.3, // *** שונה: הוקטן מ-0.4 ל-0.3 (30%) ***
    BLOCK_GAP: 0,
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3', // נתיב לקובץ השמע
    DEBUG: true // הגדר ל-false בייצור
  };

  // ========================================================================
  // הוספת סגנונות CSS - גרסה משופרת עם הילה בולטת
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

      /* הילה צהובה סביב בלוק יעד פוטנציאלי - מודגשת מאוד */
      .snap-target {
        outline: 6px solid #FFC107 !important; /* צהוב בולט */
        outline-offset: 4px;
        box-shadow: 0 0 20px 8px rgba(255, 193, 7, 0.8) !important;
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important;
      }

      /* מלבן כחול מקווקו לציון מיקום עתידי - יותר בולט */
      .future-position-indicator {
        position: absolute;
        border: 3px dashed rgba(0, 120, 255, 0.95);
        border-radius: 5px;
        background-color: rgba(0, 120, 255, 0.15);
        pointer-events: none;
        z-index: 998;
        opacity: 0;
        transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear;
        display: none; /* Start hidden */
      }
      .future-position-indicator.visible {
        display: block;
        opacity: 0.9;
      }

      /* סימון כיוון (פס צהוב בצד ימין/שמאל) - יותר בולט */
      .snap-target.snap-left::before {
        content: '';
        position: absolute;
        left: -10px;
        top: 10%;
        bottom: 10%;
        width: 8px;
        background-color: #FFC107;
        border-radius: 2px;
        z-index: 1000;
        box-shadow: 0 0 10px 2px rgba(255, 193, 7, 0.8);
        transition: all 0.1s ease-out;
      }
      .snap-target.snap-right::after {
        content: '';
        position: absolute;
        right: -10px;
        top: 10%;
        bottom: 10%;
        width: 8px;
        background-color: #FFC107;
        border-radius: 2px;
        z-index: 1000;
        box-shadow: 0 0 10px 2px rgba(255, 193, 7, 0.8);
        transition: all 0.1s ease-out;
      }

      /* אנימציות משופרות */
      @keyframes snapEffect {
        0% { transform: scale(1); }
        35% { transform: scale(1.05); }
        70% { transform: scale(0.98); }
        100% { transform: scale(1); }
      }
      .snap-animation {
        animation: snapEffect 0.3s ease-out;
      }

      @keyframes detachEffect {
        0% { transform: translate(0, 0) rotate(0); }
        30% { transform: translate(3px, 1px) rotate(0.8deg); }
        60% { transform: translate(-2px, 2px) rotate(-0.5deg); }
        100% { transform: translate(0, 0) rotate(0); }
      }
      .detach-animation {
        animation: detachEffect 0.3s ease-in-out;
      }

      /* תפריט ניתוק */
      #detach-menu {
        position: absolute;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.2);
        z-index: 1100;
        padding: 5px;
        font-size: 14px;
        min-width: 100px;
      }
      #detach-menu div {
        padding: 6px 12px;
        cursor: pointer;
        border-radius: 3px;
      }
      #detach-menu div:hover {
        background-color: #eee;
      }

      /* כללי: מניעת בחירת טקסט בזמן גרירה */
      body.user-select-none {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      /* בלוקים מחוברים */
      .connected-block, .has-connected-block {
        /* Optional styling */
      }

      /* כפתור בדיקת שמע */
      #sound-test-button {
        position: fixed;
        bottom: 15px;
        right: 15px;
        padding: 8px 12px;
        background-color: #2196F3; /* Blue initial */
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: background-color 0.2s, opacity 0.5s ease-out;
        opacity: 1;
      }
      #sound-test-button:hover:not(:disabled) {
        background-color: #0b7dda;
      }
      #sound-test-button.success {
          background-color: #4CAF50; /* Green */
      }
      #sound-test-button.error {
          background-color: #f44336; /* Red */
      }
      #sound-test-button.loading {
          background-color: #ff9800; /* Orange */
          cursor: wait;
      }
      #sound-test-button.hidden {
        opacity: 0;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Highlighting and animation styles added/verified.');
  }

  // ========================================================================
  // אתחול מערכת השמע (משתמש בקובץ MP3 חיצוני)
  // ========================================================================
  function initAudio() {
    if (!CONFIG.PLAY_SOUND) return;
    if (soundInitialized && snapSound && document.body.contains(snapSound)) {
        if (CONFIG.DEBUG) console.log("Audio already initialized.");
        return; // אל תאתחל שוב אם כבר קיים ותקין
    }

    soundInitialized = false; // Reset status before trying again

    try {
      // הסר אלמנט קודם אם קיים אבל לא תקין או נמחק מה-DOM
      const existingAudio = document.getElementById('snap-sound-element');
      if (existingAudio) {
          if (CONFIG.DEBUG) console.log("Removing previous audio element before re-initialization.");
          existingAudio.remove();
          snapSound = null;
      }

      // צור אלמנט אודיו גלובלי חדש
      snapSound = document.createElement('audio');
      snapSound.id = 'snap-sound-element';
      snapSound.preload = 'auto';
      snapSound.volume = CONFIG.SOUND_VOLUME;

      // הוסף מקור MP3 חיצוני
      const source = document.createElement('source');
      source.src = CONFIG.SOUND_PATH;
      source.type = 'audio/mpeg';
      snapSound.appendChild(source);

      // מאזין לשגיאות טעינה
      snapSound.addEventListener('error', (e) => {
        console.error(`Error loading audio file: ${CONFIG.SOUND_PATH}`, e.target.error);
        const button = document.getElementById('sound-test-button');
        if (button) {
            button.textContent = 'שגיאה בטעינת קובץ';
            button.classList.remove('success', 'loading');
            button.classList.add('error');
            button.style.backgroundColor = '#f44336';
            button.disabled = true;
        }
        CONFIG.PLAY_SOUND = false; // Disable sound globally on error
        snapSound = null;
        soundInitialized = false;
      });

      // מאזין לאירוע המציין שניתן לנגן (או לפחות חלק משמעותי נטען)
      snapSound.addEventListener('canplaythrough', () => {
          if (!soundInitialized) { // Prevent multiple logs if event fires again
              soundInitialized = true;
              if (CONFIG.DEBUG) console.log('Audio element initialized and ready to play.');
              const button = document.getElementById('sound-test-button');
              if (button && button.classList.contains('loading')) {
                  button.textContent = 'בדוק צליל הצמדה';
                  button.classList.remove('loading');
                  button.disabled = false;
                  button.style.backgroundColor = '#2196F3';
              }
          }
      });

       // מאזין לאירוע שמעיד שאין אפשרות לנגן (למשל, קובץ פגום או פורמט לא נתמך)
       snapSound.addEventListener('stalled', () => {
            if (!soundInitialized) { // Only if not already playing/ready
                console.warn('Audio loading stalled. Check network or file integrity.');
                // Optionally update button state here too
            }
       });


      // הוסף לעמוד (מוסתר)
      snapSound.style.display = 'none';
      document.body.appendChild(snapSound);

      if (CONFIG.DEBUG) console.log(`Audio element created, attempting to load: ${CONFIG.SOUND_PATH}`);

    } catch (err) {
      console.error('Error initializing audio element:', err);
      CONFIG.PLAY_SOUND = false;
      snapSound = null;
      soundInitialized = false;
    }
  }


  // ========================================================================
  // הוספת כפתור בדיקת שמע - מעודכן לטפל במצב טעינה ושגיאה
  // ========================================================================
  function addSoundTestButton() {
    if (!CONFIG.PLAY_SOUND) return;

    try {
      const existingButton = document.getElementById('sound-test-button');
      if (existingButton) existingButton.remove(); // Remove previous if exists

      const button = document.createElement('button');
      button.id = 'sound-test-button';
      button.title = 'לחץ כאן כדי לבדוק את צליל ההצמדה';
      button.className = '';

      // Set initial state based on audio status
      if (!snapSound && !soundInitialized && CONFIG.PLAY_SOUND) {
          // If initAudio failed completely before even creating the element
          button.textContent = 'אתחול שמע נכשל';
          button.classList.add('error');
          button.style.backgroundColor = '#f44336';
          button.disabled = true;
      } else if (!soundInitialized) {
          button.textContent = 'טוען צליל...';
          button.classList.add('loading');
          button.style.backgroundColor = '#ff9800';
          button.disabled = true; // Enabled by 'canplaythrough' listener
      } else {
          button.textContent = 'בדוק צליל הצמדה';
          button.style.backgroundColor = '#2196F3';
          button.disabled = false;
      }

      // Common styles
      button.style.position = 'fixed';
      button.style.bottom = '15px';
      button.style.right = '15px';
      button.style.zIndex = '9999';
      button.style.padding = '8px 12px';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      button.style.fontFamily = 'Arial, sans-serif';
      button.style.fontSize = '14px';
      button.style.fontWeight = 'bold';
      button.style.transition = 'background-color 0.2s, opacity 0.5s ease-out';
      button.style.opacity = '1';

      // Hover effect
      button.onmouseover = function() {
        if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) {
             this.style.backgroundColor = '#0b7dda';
        }
      };
      button.onmouseout = function() {
         if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) {
            this.style.backgroundColor = '#2196F3';
         }
      };

      // Click listener
      button.addEventListener('click', function() {
        if (this.disabled || !snapSound || !soundInitialized) {
            console.warn('Sound test clicked but audio not ready or disabled.');
            return;
        }

        // Attempt to play the global sound
        snapSound.play().then(() => {
          if (CONFIG.DEBUG) console.log('Sound test successful!');
          button.textContent = 'הצליל פועל ✓';
          button.classList.remove('error', 'loading');
          button.classList.add('success');
          button.style.backgroundColor = '#4CAF50'; // Green
          audioContextAllowed = true; // Mark interaction

          // Fade out and remove the button
          setTimeout(() => {
            button.classList.add('hidden');
            setTimeout(() => {
              if (button.parentNode) button.remove(); // Remove only if still exists
            }, 500);
          }, 3000);

          // Reset sound for potential immediate use
          if(snapSound) {
            snapSound.pause();
            snapSound.currentTime = 0;
          }

        }).catch(err => {
          console.warn('Sound test failed:', err);
          if (err.name === 'NotAllowedError') {
              button.textContent = 'שמע חסום - לחץ שוב';
              button.classList.remove('success', 'loading');
              button.classList.add('error');
              button.style.backgroundColor = '#f44336';
              audioContextAllowed = false;
          } else {
              button.textContent = 'שגיאת נגינה';
              button.classList.remove('success', 'loading');
              button.classList.add('error');
              button.style.backgroundColor = '#f44336';
              button.disabled = true; // Disable on unexpected play error
          }
        });
      });

      document.body.appendChild(button);
      if (CONFIG.DEBUG) console.log('Sound test button added/updated.');

    } catch (err) {
      console.error('Error adding sound test button:', err);
    }
  }

  // ========================================================================
  // השמעת צליל הצמדה - משתמש ב-snapSound הגלובלי
  // ========================================================================
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) {
      if (CONFIG.DEBUG && CONFIG.PLAY_SOUND && (!snapSound || !soundInitialized)) {
          console.log(`Snap sound skipped: audio enabled but not ready (snapSound: ${!!snapSound}, initialized: ${soundInitialized})`);
      }
      return;
    }

    if (!audioContextAllowed) {
        if (CONFIG.DEBUG) console.warn('Attempting to play sound before confirmed user interaction. Might be blocked.');
        // We still try, as interaction might have happened elsewhere
    }

    try {
      // Check ready state again, just in case
      if (snapSound.readyState < 3) { // HAVE_FUTURE_DATA or more
          if (CONFIG.DEBUG) console.log('Snap sound skipped: audio data not sufficiently available (readyState=' + snapSound.readyState + ').');
          return;
      }

      snapSound.pause();
      snapSound.currentTime = 0; // Rewind

      const playPromise = snapSound.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          audioContextAllowed = true; // Confirm interaction worked
          if (CONFIG.DEBUG > 1) console.log('Snap sound played.');
        }).catch(err => {
          if (err.name === 'NotAllowedError') {
            console.warn('Snap sound blocked by browser policy. User interaction needed.');
            audioContextAllowed = false;
             if (!document.getElementById('sound-test-button')) {
                addSoundTestButton(); // Re-add test button if user needs to click it
             }
          } else if (err.name === 'AbortError') {
            if (CONFIG.DEBUG > 1) console.log('Snap sound playback aborted (likely due to rapid interaction).');
          } else {
            console.error('Error playing snap sound:', err);
          }
        });
      }
    } catch (err) {
      console.error('Unexpected error trying to play snap sound:', err);
    }
  }

  // ========================================================================
  // אתחול מאזינים באזור התכנות
  // ========================================================================
  function initProgrammingAreaListeners() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
        console.error('Programming area (#program-blocks) not found!');
        return;
    }
    programmingArea.addEventListener('dragover', (e) => {
      e.preventDefault(); // Allow dropping
    });
    programmingArea.addEventListener('dragstart', (e) => {
        if (e.target && e.target.closest && e.target.closest('#program-blocks .block-container')) {
            if (CONFIG.DEBUG) console.log("Preventing default dragstart for internal block.");
            e.preventDefault();
        }
    });
  }

  // ========================================================================
  // האזנה לבלוקים חדשים
  // ========================================================================
  function observeNewBlocks() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Check if it's an element node
                let block = null;
                if (node.classList && node.classList.contains('block-container')) {
                    block = node;
                } else if (node.querySelector && node.querySelector('.block-container')) {
                    block = node.querySelector('.block-container');
                }

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
  // הוספת מאזינים לבלוקים קיימים
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
  // הוספת מאזיני גרירה וקליק ימני לבלוק
  // ========================================================================
  function addBlockDragListeners(block) {
      // Ensure no duplicate listeners
      block.removeEventListener('mousedown', handleMouseDown);
      block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu);
      block.addEventListener('contextmenu', handleContextMenu);
  }

  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק
  // ========================================================================
  function handleMouseDown(e) {
      if (e.button !== 0 || !e.target.closest) return; // Left click only
      if (e.target.matches('input, button, select, textarea, a[href], .no-drag')) {
        if (CONFIG.DEBUG > 1) console.log("[MouseDown] Ignored on interactive or 'no-drag' element:", e.target.tagName);
        return; // Ignore clicks on interactive elements or elements with 'no-drag' class
      }

      const block = e.target.closest('.block-container');
      const programmingArea = document.getElementById('program-blocks');
      if (!block || !programmingArea || !programmingArea.contains(block)) return; // Ensure block is within the correct area

      if (!block.id) generateUniqueId(block);

      e.preventDefault(); // Prevent text selection, etc.
      block.draggable = false; // Disable native drag API during custom drag

      if (CONFIG.DEBUG) console.log(`[MouseDown] Started for block: ${block.id}`);

      // --- Detach block and any blocks attached TO it ---
      // 1. Detach if this block is connected TO another
      if (block.hasAttribute('data-connected-to')) {
          if (CONFIG.DEBUG) console.log(`[MouseDown] Block ${block.id} was connected TO another block, detaching...`);
          detachBlock(block, false); // Detach without animation
      }
      // 2. Detach blocks connected FROM the sides of this block
      ['left', 'right'].forEach(side => {
          const connectedFromAttr = `data-connected-from-${side}`;
          const connectedBlockId = block.getAttribute(connectedFromAttr);
          if (connectedBlockId) {
              const connectedBlock = document.getElementById(connectedBlockId);
              if (connectedBlock) {
                  if (CONFIG.DEBUG) console.log(`[MouseDown] Block ${connectedBlock.id} was connected FROM ${side} to ${block.id}, detaching ${connectedBlock.id}...`);
                  detachBlock(connectedBlock, false); // Detach the *other* block
              } else {
                  console.warn(`[MouseDown] Could not find connected block ${connectedBlockId} to detach from ${side} of ${block.id}`);
                  block.removeAttribute(connectedFromAttr); // Clean up dangling attribute
              }
          }
      });
      // --- End Detach ---

      currentDraggedBlock = block;
      isDraggingBlock = true;

      const rect = block.getBoundingClientRect();
      const parentRect = programmingArea.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // Ensure absolute positioning relative to the programming area
      if (window.getComputedStyle(block).position !== 'absolute') {
        block.style.position = 'absolute';
        block.style.left = (rect.left - parentRect.left + programmingArea.scrollLeft) + 'px';
        block.style.top = (rect.top - parentRect.top + programmingArea.scrollTop) + 'px';
        block.style.margin = '0';
      } else {
          // Already absolute, just ensure margin is zero
          block.style.margin = '0';
      }

      // Visual styling for drag
      block.style.zIndex = '1001';
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none');

      if (CONFIG.DEBUG) console.log(`[MouseDown] Initial drag setup: left=${block.style.left}, top=${block.style.top}, zIndex=${block.style.zIndex}`);
  }

  // ========================================================================
  // טיפול בקליק ימני על בלוק
  // ========================================================================
  function handleContextMenu(e) {
      e.preventDefault();
      const block = e.target.closest('.block-container');
      // Show menu only if the block is connected TO another block
      if (block && block.hasAttribute('data-connected-to')) {
          showDetachMenu(e.clientX, e.clientY, block);
      }
  }

  // ========================================================================
  // מאזינים גלובליים לתנועה ושחרור עכבר
  // ========================================================================
  function initGlobalMouseListeners() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseLeave); // Use specific handler

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave); // Use specific handler
  }

  // Handler for mouse leaving the document boundaries
  function handleMouseLeave(e) {
      // Check if dragging and the mouse truly left the viewport
      if (isDraggingBlock && e.target === document.documentElement && !e.relatedTarget) {
          if (CONFIG.DEBUG) console.warn("Mouse left document during drag, treating as mouseup.");
          handleMouseUp(e); // Trigger mouse up logic
      }
  }


  // ========================================================================
  // טיפול בתנועת העכבר בזמן גרירה
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    e.preventDefault();

    const parentElement = document.getElementById('program-blocks');
    if (!parentElement) {
        console.error("Programming area not found during mouse move! Cancelling drag.");
        handleMouseUp(e); // Cancel drag if parent disappears
        return;
    }

    const parentRect = parentElement.getBoundingClientRect();
    let newLeft = e.clientX - parentRect.left - dragOffset.x + parentElement.scrollLeft;
    let newTop = e.clientY - parentRect.top - dragOffset.y + parentElement.scrollTop;

    // Boundary collision detection (within programming area)
    const blockWidth = currentDraggedBlock.offsetWidth;
    const blockHeight = currentDraggedBlock.offsetHeight;
    const scrollWidth = parentElement.scrollWidth;
    const scrollHeight = parentElement.scrollHeight;

    newLeft = Math.max(0, Math.min(newLeft, scrollWidth - blockWidth));
    newTop = Math.max(0, Math.min(newTop, scrollHeight - blockHeight));

    // Update position
    currentDraggedBlock.style.left = Math.round(newLeft) + 'px';
    currentDraggedBlock.style.top = Math.round(newTop) + 'px';

    // Check for snap possibilities
    checkAndHighlightSnapPossibility();
  }

  // ========================================================================
  // טיפול בשחרור העכבר (סיום גרירה)
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock;
    const targetToSnap = potentialSnapTarget;
    const directionToSnap = snapDirection;

    if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing block ${blockReleased.id}. Potential target: ${targetToSnap?.id || 'none'}, direction: ${directionToSnap || 'none'}`);

    // --- Immediate cleanup of dragging state ---
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source');
    blockReleased.style.zIndex = ''; // Reset z-index

    // Remove visual indicators
    document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
      el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    removeFuturePositionIndicator();
    // --- End cleanup ---

    // Attempt snap if a valid target was found
    if (targetToSnap && directionToSnap) {
      if (CONFIG.DEBUG) console.log(`[MouseUp] Performing snap operation.`);
      const snapSuccess = performBlockSnap(blockReleased, targetToSnap, directionToSnap);
      if (snapSuccess) {
           // Snap succeeded, block is now connected, disable native drag
           blockReleased.draggable = false;
           if (CONFIG.DEBUG) console.log(`[MouseUp] Snap successful, setting draggable=false for ${blockReleased.id}.`);
      } else {
          // Snap failed (e.g., target disappeared, target already connected), keep block draggable
           blockReleased.draggable = true;
           if (CONFIG.DEBUG) console.log(`[MouseUp] Snap failed, ensuring block ${blockReleased.id} remains draggable.`);
      }
    } else {
      // No snap target, leave block at its current position, ensure it's draggable
      if (CONFIG.DEBUG) console.log(`[MouseUp] No snap target found, block ${blockReleased.id} left at final drag position.`);
      blockReleased.draggable = true;
    }

    if (CONFIG.DEBUG) console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
  }

  // ========================================================================
  // בדיקת הצמדה והדגשה - כולל בדיקת חיבורים קיימים
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null); // Consider only visible blocks

    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1; // Start above threshold

    // Reset previous highlights and potential target
    document.querySelectorAll('.snap-target').forEach(el => {
        el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    potentialSnapTarget = null;
    snapDirection = null;
    removeFuturePositionIndicator();

    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock); // Ensure target has ID
      const targetRect = targetBlock.getBoundingClientRect();

      // Check if the target slot is already occupied
      const targetHasLeftConnection = targetBlock.hasAttribute('data-connected-from-left');
      const targetHasRightConnection = targetBlock.hasAttribute('data-connected-from-right');

      const snapInfo = calculateSnapInfo(sourceRect, targetRect);

      if (snapInfo && snapInfo.distance < minDistance) {
         // Check if the proposed connection direction is available on the target
         let connectionAllowed = true;
         if (snapInfo.direction === 'left' && targetHasLeftConnection) {
             connectionAllowed = false;
             if (CONFIG.DEBUG > 1) console.log(`[Highlight] Snap to left of ${targetBlock.id} blocked: Target already has connection on left.`);
         } else if (snapInfo.direction === 'right' && targetHasRightConnection) {
             connectionAllowed = false;
             if (CONFIG.DEBUG > 1) console.log(`[Highlight] Snap to right of ${targetBlock.id} blocked: Target already has connection on right.`);
         }

         if (connectionAllowed) {
             // Found a closer, allowed potential snap
             minDistance = snapInfo.distance;
             bestTarget = targetBlock;
             bestDirection = snapInfo.direction;
         }
      }
    }

    // If a suitable target was found within range
    if (bestTarget) {
      if (CONFIG.DEBUG > 1) console.log(`[Highlight] Potential snap: ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}), dist: ${minDistance.toFixed(1)}px`);

      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;

      // Highlight target and show direction indicator
      bestTarget.classList.add('snap-target');
      bestTarget.classList.add(snapDirection === 'left' ? 'snap-left' : 'snap-right');

      // Show future position indicator
      const programRect = programmingArea.getBoundingClientRect(); // Pass parent rect
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programRect);
    }
  }

  // ========================================================================
  // חישוב מידע על הצמדה אפשרית - כולל בדיקת חפיפה אנכית
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) {
    // 1. Vertical Overlap Check
    const topOverlap = Math.max(sourceRect.top, targetRect.top);
    const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
    const minHeightForOverlapCheck = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;

    if (verticalOverlap < minHeightForOverlapCheck || verticalOverlap <= 0) {
      // if (CONFIG.DEBUG > 1) console.log(`[CalcSnap] No snap: Insufficient vertical overlap (${verticalOverlap.toFixed(1)}px < ${minHeightForOverlapCheck.toFixed(1)}px)`);
      return null;
    }

    // 2. Horizontal Distance Check
    let distance;
    let direction; // Direction indicates where the *source* will be relative to the *target*

    // Distance: Source's right edge to Target's left edge
    const distRightToLeft = Math.abs(sourceRect.right - targetRect.left);
    // Distance: Source's left edge to Target's right edge
    const distLeftToRight = Math.abs(sourceRect.left - targetRect.right);

    // Choose the closer connection possibility
    if (distRightToLeft < distLeftToRight) {
        // Potential snap: Source on the left of the target
        distance = distRightToLeft;
        direction = 'left';
    } else {
        // Potential snap: Source on the right of the target
        distance = distLeftToRight;
        direction = 'right';
    }

    // 3. Check if within threshold
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
       if (CONFIG.DEBUG > 1) console.log(`[calculateSnapInfo] Possible connection: direction=${direction}, distance=${distance.toFixed(2)}px, vertical overlap=${verticalOverlap.toFixed(1)}px`);
      return { direction, distance }; // Return where source should go and the distance
    }

    // if (CONFIG.DEBUG > 1) console.log(`[CalcSnap] No snap: Distance too large (${distance.toFixed(1)}px > ${CONFIG.CONNECT_THRESHOLD}px)`);
    return null;
  }


  // ========================================================================
  // ביצוע ההצמדה הפיזית ועדכון מצב - עם בדיקות נוספות
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock) {
      console.error("[PerformSnap] Error: Invalid block(s) provided.");
      return false;
    }
    // Double-check target validity and availability before snapping
    if (!document.body.contains(targetBlock) || targetBlock.offsetParent === null) {
        console.warn(`[PerformSnap] Target block ${targetBlock.id} is no longer valid or visible. Snap cancelled.`);
        return false;
    }
    const targetAttrToCheck = `data-connected-from-${direction}`; // e.g., data-connected-from-left
    if (targetBlock.hasAttribute(targetAttrToCheck)) {
        console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} slot for direction '${direction}' is already occupied (possibly by another block simultaneously).`);
        return false;
    }

    if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (source will be on the '${direction}' side of target)`);

    try {
      const sourceRect = sourceBlock.getBoundingClientRect(); // Use current source dimensions
      const targetRect = targetBlock.getBoundingClientRect();
      const parentElement = document.getElementById('program-blocks');
      const parentRect = parentElement.getBoundingClientRect();

      // Calculate final *absolute* viewport positions
      let finalViewportLeft;
      const finalViewportTop = targetRect.top; // Align tops

      if (direction === 'left') { // Source block goes to the left of target
        finalViewportLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
      } else { // Source block goes to the right of target (direction === 'right')
        finalViewportLeft = targetRect.right + CONFIG.BLOCK_GAP;
      }

      // Convert to style values relative to the scrolled parent
      let styleLeft = finalViewportLeft - parentRect.left + parentElement.scrollLeft;
      let styleTop = finalViewportTop - parentRect.top + parentElement.scrollTop;

      // Apply final position (rounded)
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = `${Math.round(styleLeft)}px`;
      sourceBlock.style.top = `${Math.round(styleTop)}px`;
      sourceBlock.style.margin = '0';

      // Update data attributes for connection tracking
      sourceBlock.setAttribute('data-connected-to', targetBlock.id); // Source is connected TO target
      sourceBlock.setAttribute('data-connection-direction', direction); // Source is on this side OF target
      targetBlock.setAttribute(targetAttrToCheck, sourceBlock.id); // Target is connected FROM this side BY source

      // Add visual classes (optional)
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');

      // Play sound and animation
      playSnapSound(); // *** THIS IS WHERE THE SOUND PLAYS ***
      addSnapEffectAnimation(sourceBlock);

      // Make the source block non-draggable via native HTML drag (our system handles it)
      sourceBlock.draggable = false;

      if (CONFIG.DEBUG) console.log(`[PerformSnap] Snap successful. ${sourceBlock.id} positioned at left=${Math.round(styleLeft)}px, top=${Math.round(styleTop)}px`);
      return true; // Indicate success

    } catch (err) {
      console.error(`[PerformSnap] Error during snap operation for ${sourceBlock.id} -> ${targetBlock.id}:`, err);
      // Attempt to clean up / revert state
      try {
        detachBlock(sourceBlock, false); // Detach without animation on error
      } catch (detachErr) {
         console.error(`[PerformSnap] Error during cleanup detach:`, detachErr);
         // Manual cleanup as fallback
         sourceBlock.removeAttribute('data-connected-to');
         sourceBlock.removeAttribute('data-connection-direction');
         sourceBlock.classList.remove('connected-block');
         if (targetBlock) {
             targetBlock.removeAttribute(`data-connected-from-${direction}`);
             // Best not to remove 'has-connected-block' without certainty
         }
      }
      sourceBlock.draggable = true; // Ensure block is draggable after failed snap
      return false; // Indicate failure
    }
  }


  // ========================================================================
  // עדכון מחוון מיקום עתידי (מלבן כחול מקווקו)
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    if (!futureIndicator) {
        futureIndicator = document.createElement('div');
        futureIndicator.id = 'future-position-indicator';
        futureIndicator.className = 'future-position-indicator';
        programmingArea.appendChild(futureIndicator); // Append to programming area
        if (CONFIG.DEBUG > 1) console.log('Created future position indicator.');
    }

    try {
        const sourceRectNow = sourceBlock.getBoundingClientRect(); // Current size of dragged block
        const targetRect = targetBlock.getBoundingClientRect();
        const parentRect = programRect; // Use the passed parent rectangle

        // Calculate theoretical future position (same logic as performBlockSnap)
        let desiredViewportLeft;
        const desiredViewportTop = targetRect.top;

        if (direction === 'left') {
            desiredViewportLeft = targetRect.left - sourceRectNow.width - CONFIG.BLOCK_GAP;
        } else { // direction === 'right'
            desiredViewportLeft = targetRect.right + CONFIG.BLOCK_GAP;
        }

        // Convert to position relative to programming area parent
        let indicatorLeft = desiredViewportLeft - parentRect.left + programmingArea.scrollLeft;
        let indicatorTop = desiredViewportTop - parentRect.top + programmingArea.scrollTop;

        // Apply styles to the indicator
        futureIndicator.style.left = Math.round(indicatorLeft) + 'px';
        futureIndicator.style.top = Math.round(indicatorTop) + 'px';
        futureIndicator.style.width = Math.round(sourceRectNow.width) + 'px';
        futureIndicator.style.height = Math.round(sourceRectNow.height) + 'px';
        futureIndicator.classList.add('visible'); // Make it visible

    } catch (err) {
        console.error('Error updating future position indicator:', err);
        removeFuturePositionIndicator(); // Hide on error
    }
  }

  // ========================================================================
  // הסרת מחוון מיקום עתידי
  // ========================================================================
  function removeFuturePositionIndicator() {
    if (futureIndicator) {
        futureIndicator.classList.remove('visible'); // Hide using CSS
        // Don't remove from DOM, just hide for performance
    }
  }


  // ========================================================================
  // פונקציות עזר לניתוק בלוקים (כולל תפריט קליק ימני)
  // ========================================================================
  function showDetachMenu(x, y, block) {
    removeDetachMenu(); // Ensure only one menu exists

    const menu = document.createElement('div');
    menu.id = 'detach-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const detachOption = document.createElement('div');
    detachOption.textContent = 'נתק בלוק';
    detachOption.onclick = function(event) {
        event.stopPropagation();
        detachBlock(block, true); // Detach the block that was right-clicked
        removeDetachMenu();
    };

    menu.appendChild(detachOption);
    document.body.appendChild(menu);

    // Listeners to close the menu
    setTimeout(() => { // Use timeout to prevent immediate closure
        document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
        window.addEventListener('scroll', removeDetachMenu, { capture: true, once: true }); // Close on scroll
    }, 0);
  }

  function closeMenuOutside(e) {
    const menu = document.getElementById('detach-menu');
    if (menu && !menu.contains(e.target)) {
        removeDetachMenu();
    } else if (menu) {
        // Click was inside menu but not on an option, re-add listener
         setTimeout(() => {
             document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
         }, 0);
    }
    // Always remove scroll listener if click occurred (handled or not)
    window.removeEventListener('scroll', removeDetachMenu, { capture: true });
  }

  function removeDetachMenu() {
    const menu = document.getElementById('detach-menu');
    if (menu) {
        // Clean up listeners when menu is removed
        document.removeEventListener('click', closeMenuOutside, { capture: true });
        window.removeEventListener('scroll', removeDetachMenu, { capture: true });
        menu.remove();
    }
  }

  function detachBlock(blockToDetach, animate = true) {
    // Check if the block is actually connected *to* something
    if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) {
        if (CONFIG.DEBUG > 1) console.log(`[Detach] Block ${blockToDetach?.id || 'unknown'} has no 'data-connected-to'. No detach action needed for this block.`);
        // Make sure it's draggable if it's not connected
        if (blockToDetach) blockToDetach.draggable = true;
        return; // Not connected as a source block
    }

    const targetId = blockToDetach.getAttribute('data-connected-to');
    const direction = blockToDetach.getAttribute('data-connection-direction'); // 'left' or 'right' (where source WAS relative to target)

    if (!targetId || !direction) {
        console.warn(`[Detach] Missing connection data on ${blockToDetach.id}. Cleaning up attributes.`);
        blockToDetach.removeAttribute('data-connected-to');
        blockToDetach.removeAttribute('data-connection-direction');
        blockToDetach.classList.remove('connected-block');
        blockToDetach.draggable = true; // Make draggable since connection is broken
        return;
    }

    if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${blockToDetach.id} from target ${targetId} (was connected on the '${direction}' side of target)`);

    // --- Clean up the block being detached (the source) ---
    blockToDetach.removeAttribute('data-connected-to');
    blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block');
    blockToDetach.draggable = true; // Make it draggable again

    // --- Clean up the target block ---
    const targetBlock = document.getElementById(targetId);
    if (targetBlock) {
        // Remove the attribute pointing back to the source block
        const targetAttrToRemove = `data-connected-from-${direction}`; // e.g., data-connected-from-left
        targetBlock.removeAttribute(targetAttrToRemove);

        // Check if target still has any connections left
        const hasOtherConnections =
            targetBlock.hasAttribute('data-connected-from-left') ||
            targetBlock.hasAttribute('data-connected-from-right') ||
            targetBlock.hasAttribute('data-connected-to'); // Is it connected TO another block?

        if (!hasOtherConnections) {
            targetBlock.classList.remove('has-connected-block');
            if (CONFIG.DEBUG > 1) console.log(`[Detach] Target ${targetId} no longer has any connections.`);
        } else {
            if (CONFIG.DEBUG > 1) console.log(`[Detach] Target ${targetId} still has other connections.`);
        }
    } else {
        console.warn(`[Detach] Target block ${targetId} for detached block ${blockToDetach.id} not found.`);
    }

    // Add detach animation if requested
    if (animate) {
        addDetachEffectAnimation(blockToDetach);
    }

    if (CONFIG.DEBUG) console.log(`[Detach] Finished detaching ${blockToDetach.id}. Draggable: ${blockToDetach.draggable}`);
  }

  // ========================================================================
  // פונקציות עזר לאנימציה
  // ========================================================================
  function addSnapEffectAnimation(block) {
    block.classList.remove('snap-animation');
    void block.offsetWidth; // Force reflow
    block.classList.add('snap-animation');
    block.addEventListener('animationend', () => {
      block.classList.remove('snap-animation');
    }, { once: true });
  }

  function addDetachEffectAnimation(block) {
    block.classList.remove('detach-animation');
    void block.offsetWidth; // Force reflow
    block.classList.add('detach-animation');
     block.addEventListener('animationend', () => {
      block.classList.remove('detach-animation');
    }, { once: true });
  }

  // ========================================================================
  // יצירת ID ייחודי לבלוקים ללא ID
  // ========================================================================
  function generateUniqueId(block) {
    if (block.id && typeof block.id === 'string' && block.id.trim() !== '') return block.id;

    const prefix = block.dataset.type || block.classList[0] || 'block'; // Use data-type, first class, or 'block' as prefix
    let uniqueId = `${prefix}-${Math.random().toString(36).substring(2, 7)}`;
    let attempt = 0;
    // Ensure uniqueness within the document
    while (document.getElementById(uniqueId) && attempt < 10) {
        uniqueId = `${prefix}-${Math.random().toString(36).substring(2, 7)}-${attempt}`;
        attempt++;
    }
     if (attempt >= 10) { // Fallback if random collisions persist
       console.warn("Could not generate unique ID with random string after 10 attempts, using timestamp fallback.");
       uniqueId = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    }

    block.id = uniqueId;
    if (CONFIG.DEBUG) console.log(`Generated ID for block: ${uniqueId}`);
    return uniqueId;
  }

  // ========================================================================
  // אתחול המערכת כולה
  // ========================================================================
  function initializeSystem() {
    // Prevent multiple initializations
    if (window.blockLinkageInitialized) {
        if (CONFIG.DEBUG) console.log("Block linkage system already initialized. Skipping.");
        return;
    }

    addHighlightStyles();           // Add CSS styles
    initAudio();                    // Initialize audio element
    initProgrammingAreaListeners(); // Add listeners to the main area
    observeNewBlocks();             // Watch for dynamically added blocks
    initExistingBlocks();           // Add listeners to blocks present on load
    initGlobalMouseListeners();     // Add global mouse move/up/leave listeners

    // Add sound test button if enabled (will show loading/error state if needed)
    if (CONFIG.PLAY_SOUND) {
        addSoundTestButton();
    }

    window.blockLinkageInitialized = true; // Set flag to prevent re-init
    console.log(`Block linkage system initialized (Version 3.3 - Adjusted Thresholds)`);
    console.log(`Configuration: Connect Threshold=${CONFIG.CONNECT_THRESHOLD}px, Vertical Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // Run initialization when the DOM is ready
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
      // DOMContentLoaded has already fired
      initializeSystem();
  }

})(); // End of IIFE

// --- END OF FILE linkageimproved.js ---
