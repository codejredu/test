// --- START OF FILE linkageimproved.js ---
// מימוש משופר - גרסה משולבת (הצמדה, הילה, שמע) v3.2 - תיקון קפיצה

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;    // הבלוק הנגרר כרגע
  let potentialSnapTarget = null;  // הבלוק שאליו ייתכן ונתחבר
  let snapDirection = null;        // כיוון ההצמדה האפשרי ('left' או 'right')
  let isDraggingBlock = false;       // האם מתבצעת גרירה של בלוק מתוך אזור התכנות
  let dragOffset = { x: 0, y: 0 }; // ההיסט של העכבר מפינת הבלוק הנגרר
  let futureIndicator = null;      // אלמנט המלבן הכחול המקווקו
  let snapSound = null; // אודיו לצליל הצמדה
  let audioEnabled = false; // האם השמע פעיל (בעקבות אינטראקציית משתמש)
  let soundInitialized = false; // האם בוצע ניסיון אתחול לשמע

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5,             // רוחב/עומק הפין/שקע בפיקסלים (לצורך זיהוי קרבה)
    CONNECT_THRESHOLD: 30,    // מרחק אופקי מקסימלי בפיקסלים לזיהוי הצמדה (בין נקודות החיבור)
    VERTICAL_ALIGN_THRESHOLD: 30, // הפרש אנכי מקסימלי מותר (בין top-ים)
    BLOCK_GAP: 0,             // רווח בין בלוקים מחוברים (0 = צמודים)
    PLAY_SOUND: true,         // האם להשמיע צליל בעת הצמדה
    SOUND_VOLUME: 0.5,        // עוצמת הצליל (בין 0 ל-1) - נוריד מעט את העוצמה
    DEBUG: true               // האם להציג לוגים מפורטים לדיבוג
  };

  // ========================================================================
  // אתחול המערכת
  // ========================================================================
  document.addEventListener('DOMContentLoaded', function() {
    addHighlightStyles(); // הוסף סגנונות CSS
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();
    initAudio(); // אתחול שמע
    addSoundTestButton(); // הוסף כפתור בדיקה

    if (CONFIG.DEBUG) console.log(`Block linkage system initialized (v3.2 - Fix Snap+Highlight+Sound)`);
    if (CONFIG.DEBUG) console.log(`Config: PIN_WIDTH=${CONFIG.PIN_WIDTH}, CONNECT_THRESHOLD=${CONFIG.CONNECT_THRESHOLD}, VERTICAL_ALIGN_THRESHOLD=${CONFIG.VERTICAL_ALIGN_THRESHOLD}, PLAY_SOUND=${CONFIG.PLAY_SOUND}`);
  });

  // ========================================================================
  // אתחול מערכת השמע (מהקוד שסופק)
  // ========================================================================
  function initAudio() {
    if (!CONFIG.PLAY_SOUND || soundInitialized) return;
    soundInitialized = true; // סמן שבוצע ניסיון אתחול

    try {
      snapSound = document.createElement('audio');
      snapSound.id = 'snap-sound';

      const source = document.createElement('source');
      // Base64 encoded short click sound (WAV) - קצר יותר
      source.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      source.type = 'audio/wav';
      snapSound.appendChild(source);

      snapSound.volume = CONFIG.SOUND_VOLUME;
      snapSound.preload = 'auto';

      document.body.appendChild(snapSound);

      // הפעלה ראשונית ריקה עם אינטראקציית משתמש
      const enableAudioHandler = () => {
          if (!audioEnabled) { // הפעל רק אם עדיין לא הופעל
              const playPromise = snapSound.play();
              if (playPromise !== undefined) {
                  playPromise.then(() => {
                      snapSound.pause();
                      snapSound.currentTime = 0;
                      audioEnabled = true;
                      console.log('Audio context unlocked by user interaction.');
                  }).catch(error => {
                      console.warn('Audio play() was interrupted or failed on first interaction:', error);
                      // נסיונות חוזרים עשויים להיות חסומים עד לאינטראקציה אמיתית
                  });
              }
          }
          // הסר את המאזין אחרי הפעם הראשונה
          document.removeEventListener('click', enableAudioHandler, true);
          document.removeEventListener('touchstart', enableAudioHandler, true);
      };

      document.addEventListener('click', enableAudioHandler, { capture: true, once: true });
      document.addEventListener('touchstart', enableAudioHandler, { capture: true, once: true }); // גם למגע

      console.log('Snap sound initialized. Waiting for user interaction to enable.');

    } catch (err) {
      console.error('Error initializing audio:', err);
      CONFIG.PLAY_SOUND = false; // בטל שמע אם האתחול נכשל
      snapSound = null;
    }
  }

  // ========================================================================
  // השמעת צליל הצמדה (מהקוד שסופק)
  // ========================================================================
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !audioEnabled || !snapSound) {
        if (CONFIG.DEBUG && CONFIG.PLAY_SOUND && !audioEnabled) {
            console.warn("Snap sound cannot play yet: Audio not enabled by user interaction.");
        } else if (CONFIG.DEBUG && CONFIG.PLAY_SOUND && !snapSound) {
             console.warn("Snap sound cannot play: Audio element not initialized.");
        }
        return;
    }

    try {
      // אסטרטגיה: שחק מאפס, אל תחכה לסיום קודם
      snapSound.currentTime = 0;
      const playPromise = snapSound.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (CONFIG.DEBUG) console.log('Snap sound played.');
        }).catch(error => {
          // שגיאות נפוצות: פעולה נקטעה על ידי קריאה נוספת ל-play, או שהמשתמש לא לחץ עדיין.
          if (error.name !== 'AbortError') { // התעלם משגיאות AbortError
             console.warn('Error playing snap sound:', error);
          }
        });
      }
    } catch (err) {
      console.error('Exception in playSnapSound:', err);
    }
  }

  // ========================================================================
  // הוספת כפתור בדיקת שמע (מהקוד שסופק)
  // ========================================================================
  function addSoundTestButton() {
    if (!CONFIG.PLAY_SOUND) return; // אל תוסיף אם השמע כבוי בקונפיגורציה

    try {
        if (document.getElementById('sound-test-button')) return; // אל תוסיף אם כבר קיים

        const button = document.createElement('button');
        button.id = 'sound-test-button';
        button.textContent = 'בדוק צליל'; // טקסט ראשוני
        button.title = 'לחץ להפעלת צליל ההצמדה';
        Object.assign(button.style, {
            position: 'fixed', bottom: '15px', right: '15px', zIndex: '9999',
            padding: '8px 12px', backgroundColor: '#f0ad4e', /* Orange */
            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)', fontFamily: 'Arial, sans-serif',
            fontSize: '13px', fontWeight: 'bold', opacity: '1', transition: 'opacity 0.5s ease-out'
        });

        button.onmouseover = function() { this.style.backgroundColor = '#ec971f'; };
        button.onmouseout = function() { this.style.backgroundColor = '#f0ad4e'; };

        button.addEventListener('click', function() {
            if (audioEnabled && snapSound) {
                playSnapSound(); // השתמש בפונקציה הקיימת
                button.textContent = 'צליל עובד ✓';
                button.style.backgroundColor = '#5cb85c'; // Green
                button.disabled = true; // מנע לחיצות נוספות
                setTimeout(() => { button.style.opacity = '0'; setTimeout(() => button.remove(), 500); }, 2000);
            } else {
                // נסה להפעיל אודיו אם לא הופעל עדיין
                initAudio(); // נסה לאתחל שוב אם לא הצליח
                // נסה להשמיע צליל זמני כדי לעורר את הדפדפן
                const tempSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
                 tempSound.play().then(() => {
                     audioEnabled = true; // סמן שהצלחנו
                     if(snapSound) { // אם האתחול הצליח בינתיים
                         snapSound.play().catch(()=>{}); // השמע את הצליל האמיתי
                         snapSound.pause();
                         snapSound.currentTime = 0;
                     }
                     button.textContent = 'השמע מופעל!';
                     button.style.backgroundColor = '#5cb85c';
                     button.disabled = true;
                     setTimeout(() => { button.style.opacity = '0'; setTimeout(() => button.remove(), 500); }, 2000);
                 }).catch(err => {
                     console.warn('Manual sound test failed:', err);
                     button.textContent = 'שמע חסום';
                     button.style.backgroundColor = '#d9534f'; // Red
                     button.title = 'ייתכן שהדפדפן חוסם שמע אוטומטי. נסה ללחוץ במקום אחר בדף.';
                 });
            }
        });

        document.body.appendChild(button);
        if (CONFIG.DEBUG) console.log('Sound test button added.');
    } catch (err) {
        console.error('Error adding sound test button:', err);
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
    programmingArea.addEventListener('dragover', function(e) {
        e.preventDefault(); // Allow drops
        // Optional: Add visual feedback for dropping area
        // programmingArea.classList.add('drag-over');
    });
    // programmingArea.addEventListener('dragleave', () => {
    //     programmingArea.classList.remove('drag-over');
    // });
    // programmingArea.addEventListener('drop', () => {
    //     programmingArea.classList.remove('drag-over');
    // });


    // Prevent default dragstart for blocks already inside the area
    programmingArea.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('block-container')) {
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
            if (node.nodeType === 1 && node.classList.contains('block-container') && node.closest('#program-blocks')) {
              if (!node.id) generateUniqueId(node);
              addBlockDragListeners(node);
              if (CONFIG.DEBUG) console.log('New block observed and listeners added:', node.id);
            }
          });
        }
      });
    });
    observer.observe(programmingArea, { childList: true });
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
      // Ensure only one listener of each type
      block.removeEventListener('mousedown', handleMouseDown);
      block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu);
      block.addEventListener('contextmenu', handleContextMenu);
  }


  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק
  // ========================================================================
  function handleMouseDown(e) {
      if (e.button !== 0 || !e.target.closest('.block-container')) return; // Only left click on block

      const block = e.target.closest('.block-container');
      if (!block.id) generateUniqueId(block);

      // Prevent browser's default drag-and-drop
      block.draggable = false;
      e.preventDefault(); // Prevent text selection and other defaults

      if (CONFIG.DEBUG) console.log(`[MouseDown] Started for block: ${block.id}`);

      // Detach if currently connected
      if (block.hasAttribute('data-connected-to')) {
          if (CONFIG.DEBUG) console.log(`[MouseDown] Block ${block.id} was connected, detaching...`);
          detachBlock(block, false); // Detach without animation/sound
      }

      currentDraggedBlock = block;
      isDraggingBlock = true;

      const rect = block.getBoundingClientRect();
      const parentElement = block.offsetParent || document.body; // Fallback to body
      const parentRect = parentElement.getBoundingClientRect();

      // Calculate offset relative to the block's top-left corner
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // Ensure absolute positioning and set initial position correctly
      // relative to the offset parent, considering scroll
      block.style.position = 'absolute';
      block.style.left = (rect.left - parentRect.left + parentElement.scrollLeft) + 'px';
      block.style.top = (rect.top - parentRect.top + parentElement.scrollTop) + 'px';
      block.style.zIndex = '1001'; // Bring to front
      block.classList.add('snap-source'); // Style for dragging
      document.body.classList.add('user-select-none'); // Prevent text selection during drag

      if (CONFIG.DEBUG) console.log(`[MouseDown] Initial Style set: left=${block.style.left}, top=${block.style.top}`);
  }

   // ========================================================================
  // טיפול בקליק ימני על בלוק
  // ========================================================================
    function handleContextMenu(e) {
        e.preventDefault(); // Prevent default context menu
        const block = e.target.closest('.block-container');
        if (block && block.hasAttribute('data-connected-to')) {
            showDetachMenu(e.clientX, e.clientY, block);
        }
    }

  // ========================================================================
  // מאזינים גלובליים
  // ========================================================================
  function initGlobalMouseListeners() {
    // Use capture phase for mousemove/mouseup to catch events even if over other elements
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    // Mouseleave on the window/document is a good fallback
    window.addEventListener('mouseleave', handleMouseLeave);
  }

  // ========================================================================
  // טיפול בתנועת העכבר
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    // Prevent default behavior during drag to avoid issues
    e.preventDefault();
    e.stopPropagation();

    const parentElement = currentDraggedBlock.offsetParent || document.body;
    const parentRect = parentElement.getBoundingClientRect();

    // Calculate new position relative to the offset parent, considering scroll
    let newLeft = e.clientX - parentRect.left - dragOffset.x + parentElement.scrollLeft;
    let newTop = e.clientY - parentRect.top - dragOffset.y + parentElement.scrollTop;

    // Optional: Constrain to parent bounds if the parent is the programming area
    if (parentElement.id === 'program-blocks') {
        const blockWidth = currentDraggedBlock.offsetWidth;
        const blockHeight = currentDraggedBlock.offsetHeight;
        // Use scrollWidth/Height for containment within the scrollable area
        const maxLeft = Math.max(0, parentElement.scrollWidth - blockWidth);
        const maxTop = Math.max(0, parentElement.scrollHeight - blockHeight);
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
    }

    // Update block position *directly*
    currentDraggedBlock.style.left = newLeft + 'px';
    currentDraggedBlock.style.top = newTop + 'px';

    // Check for snap possibility based on the new position
    checkAndHighlightSnapPossibility();
  }

  // ========================================================================
  // טיפול בשחרור העכבר (הפשוט ביותר)
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    // Prevent default behavior for the mouseup event
    e.preventDefault();
    e.stopPropagation();

    const blockReleased = currentDraggedBlock; // Keep a reference
    console.log(`[MouseUp] ----- Start MouseUp for ${blockReleased.id} -----`);
    const currentStylePos = { left: blockReleased.style.left, top: blockReleased.style.top };
    console.log(`[MouseUp] Position BEFORE snap check: ${currentStylePos.left}, ${currentStylePos.top}`);

    // --- Capture Snap State ---
    const targetToSnap = potentialSnapTarget;
    const directionToSnap = snapDirection;
    console.log(`[MouseUp] Snap State: Target=${targetToSnap?.id || 'none'}, Direction=${directionToSnap || 'none'}`);

    // --- Reset Global State Immediately ---
    // This prevents race conditions if another action starts quickly
    const wasDragging = isDraggingBlock; // Store the state before resetting
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    isDraggingBlock = false;

    // --- Perform Snap (if applicable) ---
    // We use the captured target and direction
    if (targetToSnap && directionToSnap) {
      console.log(`%c[MouseUp] SNAP Action: Snapping ${blockReleased.id} to ${targetToSnap.id} (${directionToSnap})`, 'color: green; font-weight: bold;');
      performBlockSnap(blockReleased, targetToSnap, directionToSnap);
      const finalStylePos = { left: blockReleased.style.left, top: blockReleased.style.top };
      console.log(`[MouseUp] Position AFTER snap action: ${finalStylePos.left}, ${finalStylePos.top}`);
    } else {
      console.log(`%c[MouseUp] NO SNAP Action: Block ${blockReleased.id} dropped freely.`, 'color: orange;');
      // Position is already set by the last mousemove
    }

    // --- Cleanup Visuals ---
    document.body.classList.remove('user-select-none');
    if(blockReleased) { // Ensure blockReleased is still valid
        blockReleased.style.zIndex = '';
        blockReleased.classList.remove('snap-source');
        blockReleased.draggable = true; // Re-enable default drag if needed elsewhere
    }
    document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
      el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    removeFuturePositionIndicator();
    console.log("[MouseUp] Cleanup visuals completed.");

    console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
  }


  // ========================================================================
  // טיפול בעזיבת החלון
  // ========================================================================
  function handleMouseLeave(e) {
      // Check if dragging and mouse is leaving the window (not just moving over another element)
      if (isDraggingBlock && (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML')) {
          console.warn("Mouse left window during drag, treating as mouseup.");
          handleMouseUp(e); // Trigger mouseup logic to cancel drag/snap
      }
  }

  // ========================================================================
  // בדיקת הצמדה והדגשה (עם לוגים מפורטים להילה)
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;
    // if (CONFIG.DEBUG) console.log("[Highlight Check] Running check...");

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const allBlocks = Array.from(programmingArea.querySelectorAll('.block-container'));
    const sourceRect = currentDraggedBlock.getBoundingClientRect();

    let bestTarget = null;
    let bestDirection = null;

    // שמור את היעד הפוטנציאלי הקודם כדי לנקות הדגשות ישנות
    const previousPotentialTarget = potentialSnapTarget;
    let currentTargetIsHighlighted = false; // עקוב אם היעד הנוכחי כבר מודגש

    // חפש את הבלוק המתאים ביותר להצמדה
    for (const targetBlock of allBlocks) {
      if (targetBlock === currentDraggedBlock) continue;
      if (!targetBlock.id) generateUniqueId(targetBlock);

      const targetRect = targetBlock.getBoundingClientRect();
      const direction = calculateSnapDirection(sourceRect, targetRect); // בדוק אם אפשר להצמיד בכיוון כלשהו

      if (direction) {
          // מצאנו יעד אפשרי!
          bestTarget = targetBlock;
          bestDirection = direction;
          // if (CONFIG.DEBUG) console.log(`[Highlight Check] Found potential target: ${bestTarget.id}, direction: ${bestDirection}`);
          break; // מספיק למצוא את הראשון שמתאים
      }
    }

    // --- עדכן את המצב הגלובלי ואת ההדגשות ---

    potentialSnapTarget = bestTarget; // עדכן את היעד הפוטנציאלי (יכול להיות null)
    snapDirection = bestDirection;   // עדכן את הכיוון (יכול להיות null)

    // 1. נקה הדגשה מהיעד הקודם אם הוא שונה מהנוכחי או אם אין יעד נוכחי
    if (previousPotentialTarget && previousPotentialTarget !== bestTarget) {
      if (CONFIG.DEBUG) console.log(`%c[Highlight] De-highlighting PREVIOUS target: ${previousPotentialTarget.id}`, 'color: #aaa;');
      previousPotentialTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
    }

    // 2. אם יש יעד נוכחי, הדגש אותו
    if (bestTarget) {
      if (!bestTarget.classList.contains('snap-target')) {
        if (CONFIG.DEBUG) console.log(`%c[Highlight] Highlighting NEW target: ${bestTarget.id}`, 'color: orange; font-weight: bold;');
        bestTarget.classList.add('snap-target');
      }
      // עדכן תמיד את סימון הכיוון
      bestTarget.classList.remove('snap-left', 'snap-right');
      bestTarget.classList.add(snapDirection === 'left' ? 'snap-left' : 'snap-right');
      currentTargetIsHighlighted = true; // סמן שהיעד הנוכחי מודגש

      // הצג/עדכן את המלבן הכחול
      const programRect = programmingArea.getBoundingClientRect();
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programRect);
    } else {
      // 3. אם אין יעד נוכחי, ודא שאין מלבן כחול
      removeFuturePositionIndicator();
      // ההדגשה מהיעד הקודם כבר הוסרה בשלב 1 אם הוא היה קיים
    }
    // if (CONFIG.DEBUG) console.log("[Highlight Check] Finished check.");
  }


  // ========================================================================
  // חישוב כיוון הצמדה אפשרי (עם PIN_SOCKET_DEPTH לזיהוי)
  // ========================================================================
  function calculateSnapDirection(sourceRect, targetRect) {
    // בדוק חפיפה אנכית ראשונית
    const verticalDiff = Math.abs(sourceRect.top - targetRect.top);
    if (verticalDiff > CONFIG.VERTICAL_ALIGN_THRESHOLD) {
      return null; // רחוקים מדי אנכית
    }

    // בדוק קרבה אופקית בין נקודות החיבור
    const sourceRightPinCenter = sourceRect.right - (CONFIG.PIN_WIDTH / 2);
    const targetLeftSocketCenter = targetRect.left + (CONFIG.PIN_WIDTH / 2);
    const rightToLeftDist = Math.abs(sourceRightPinCenter - targetSocketCenter);

    const sourceLeftSocketCenter = sourceRect.left + (CONFIG.PIN_WIDTH / 2);
    const targetRightPinCenter = targetRect.right - (CONFIG.PIN_WIDTH / 2);
    const leftToRightDist = Math.abs(sourceLeftSocketCenter - targetRightPinCenter);

    // קבע את הכיוון הסביר ביותר לפי מרכז הבלוקים
    const isSourceLikelyLeft = (sourceRect.left + sourceRect.width / 2) < (targetRect.left + targetRect.width / 2);

    // בדוק התאמה לכיוון 'left' (מקור משמאל ליעד)
    if (isSourceLikelyLeft && rightToLeftDist <= CONFIG.CONNECT_THRESHOLD) {
      // if (CONFIG.DEBUG) console.log(` -> Possible snap 'left' (dist=${rightToLeftDist.toFixed(1)})`);
      return 'left';
    }

    // בדוק התאמה לכיוון 'right' (מקור מימין ליעד)
    if (!isSourceLikelyLeft && leftToRightDist <= CONFIG.CONNECT_THRESHOLD) {
      // if (CONFIG.DEBUG) console.log(` -> Possible snap 'right' (dist=${leftToRightDist.toFixed(1)})`);
      return 'right';
    }

    return null; // אין התאמה קרובה מספיק
  }


  // ========================================================================
  // ביצוע ההצמדה הפיזית (חישוב מיקום *ללא* PIN_SOCKET_DEPTH)
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock) {
        console.error("[performBlockSnap] Invalid blocks provided.");
        return;
    }
    console.log(`%c[Perform Snap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`, 'color: blue; font-weight: bold;');

    try {
        const sourceRect = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        const parentElement = sourceBlock.offsetParent || document.body; // Fallback
        const parentRect = parentElement.getBoundingClientRect();

        // חישוב מיקום אנכי: יישור לפי החלק העליון של היעד
        let desiredViewportTop = targetRect.top;

        // חישוב מיקום אופקי רצוי ב-viewport (קצה לקצה)
        let desiredViewportLeft;
        if (direction === 'left') {
            // המקור משמאל ליעד, הצמד את הקצה הימני של המקור לשמאלי של היעד
            desiredViewportLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
        } else { // 'right'
            // המקור מימין ליעד, הצמד את הקצה השמאלי של המקור לימני של היעד
            desiredViewportLeft = targetRect.right + CONFIG.BLOCK_GAP;
        }
        // console.log(`[Perform Snap] Desired Viewport Pos: Left=${desiredViewportLeft.toFixed(1)}, Top=${desiredViewportTop.toFixed(1)}`);

        // המרה ל-style (יחסי ל-offsetParent, כולל scroll)
        let styleLeft = desiredViewportLeft - parentRect.left + parentElement.scrollLeft;
        let styleTop = desiredViewportTop - parentRect.top + parentElement.scrollTop;
        // console.log(`[Perform Snap] Calculated Style (Raw): left=${styleLeft.toFixed(1)}, top=${styleTop.toFixed(1)}`);

        // הגבלת גבולות (אם ההורה הוא אזור התכנות)
         if (parentElement.id === 'program-blocks') {
             const maxLeft = Math.max(0, parentElement.scrollWidth - sourceRect.width);
             const maxTop = Math.max(0, parentElement.scrollHeight - sourceRect.height);
             styleLeft = Math.max(0, Math.min(styleLeft, maxLeft));
             styleTop = Math.max(0, Math.min(styleTop, maxTop));
         }

        // החל את המיקום הסופי המחושב
        const finalLeftPx = Math.round(styleLeft) + 'px'; // עדיף לעגל למספר שלם
        const finalTopPx = Math.round(styleTop) + 'px';
        console.log(`%c[Perform Snap] Applying final style: left=${finalLeftPx}, top=${finalTopPx}`, 'color: green; font-weight: bold;');
        sourceBlock.style.left = finalLeftPx;
        sourceBlock.style.top = finalTopPx;

        // עדכן מאפייני חיבור
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', direction);
        targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);
        sourceBlock.classList.add('connected-block');
        targetBlock.classList.add('has-connected-block');
        // console.log("[Perform Snap] Connection attributes updated.");

        playSnapSound(); // השמע צליל
        addSnapEffectAnimation(sourceBlock); // הפעל אנימציה

    } catch (err) {
        console.error('[performBlockSnap] Error:', err);
    } finally {
        // console.log(`[Perform Snap] ----- End Snap for ${sourceBlock.id} -----`);
    }
}


  // ========================================================================
  // עדכון מחוון מיקום עתידי (המלבן הכחול)
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) { // programRect is viewport rect of #program-blocks
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea || !sourceBlock || !targetBlock) return;

      if (!futureIndicator) {
          futureIndicator = document.createElement('div');
          futureIndicator.id = 'future-position-indicator';
          futureIndicator.className = 'future-position-indicator';
          programmingArea.appendChild(futureIndicator);
      }

      try {
          const sourceStyle = window.getComputedStyle(sourceBlock);
          const sourceWidth = parseFloat(sourceStyle.width);
          const sourceHeight = parseFloat(sourceStyle.height);
          const targetRect = targetBlock.getBoundingClientRect(); // Target's viewport position

          // Calculate desired viewport position (edge-to-edge)
          let desiredViewportLeft, desiredViewportTop;
          desiredViewportTop = targetRect.top;
          if (direction === 'left') {
              desiredViewportLeft = targetRect.left - sourceWidth - CONFIG.BLOCK_GAP;
          } else { // direction === 'right'
              desiredViewportLeft = targetRect.right + CONFIG.BLOCK_GAP;
          }

          // Convert to position relative to programmingArea
          const parentRect = programmingArea.getBoundingClientRect();
          let indicatorLeft = desiredViewportLeft - parentRect.left + programmingArea.scrollLeft;
          let indicatorTop = desiredViewportTop - parentRect.top + programmingArea.scrollTop;

          // Constrain within bounds (optional for indicator)
          indicatorLeft = Math.max(0, indicatorLeft);
          indicatorTop = Math.max(0, indicatorTop);

          // Update indicator style
          futureIndicator.style.position = 'absolute';
          futureIndicator.style.left = indicatorLeft + 'px';
          futureIndicator.style.top = indicatorTop + 'px';
          futureIndicator.style.width = sourceWidth + 'px';
          futureIndicator.style.height = sourceHeight + 'px';
          futureIndicator.style.display = 'block';

      } catch (err) {
          console.error('Error updating future position indicator:', err);
          removeFuturePositionIndicator();
      }
  }

  // ========================================================================
  // הסרת מחוון מיקום עתידי
  // ========================================================================
  function removeFuturePositionIndicator() {
      if (futureIndicator) {
          futureIndicator.style.display = 'none';
      }
  }

  // ========================================================================
  // הוספת סגנונות CSS (מהקוד שסופק)
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* בלוק נגרר */
      .snap-source {
         box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4) !important; /* Increased shadow */
         cursor: grabbing !important;
         z-index: 1001 !important; /* Ensure it's on top */
         opacity: 0.9; /* Slightly transparent while dragging */
      }

      /* הילה צהובה סביב יעד פוטנציאלי - **מודגשת** */
      .snap-target {
        outline: 4px solid #FFEB3B !important; /* Brighter yellow */
        outline-offset: 4px;
        box-shadow: 0 0 20px 8px rgba(255, 235, 59, 0.75) !important; /* Stronger glow */
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important;
      }

      /* מלבן כחול מקווקו למיקום עתידי */
      .future-position-indicator {
        position: absolute;
        border: 2px dashed #03A9F4; /* Light blue dash */
        border-radius: 5px;
        background-color: rgba(3, 169, 244, 0.1);
        pointer-events: none;
        z-index: 998;
        opacity: 0;
        transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear;
        display: none;
      }
      .future-position-indicator[style*="display: block"] { opacity: 0.85; }

      /* סימון כיוון (פס צד) - מודגש */
      .snap-left::before, .snap-right::after {
        content: ''; position: absolute; top: 15%; bottom: 15%; width: 6px;
        background-color: #FFEB3B; border-radius: 3px; z-index: 1000;
        box-shadow: 0 0 8px 2px rgba(255, 235, 59, 0.7); transition: all 0.1s ease-out;
      }
      .snap-left::before { left: -7px; }
      .snap-right::after { right: -7px; }

      /* אנימציות */
      @keyframes snapEffect { 0% { transform: scale(1); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }
      .snap-animation { animation: snapEffect 0.2s ease-out; }
      @keyframes detachEffect { 0% { transform: translate(0, 0) rotate(0); } 50% { transform: translate(2px, 2px) rotate(0.5deg); } 100% { transform: translate(0, 0) rotate(0); } }
      .detach-animation { animation: detachEffect 0.2s ease-in-out; }

      /* תפריט ניתוק */
      #detach-menu { position: absolute; background-color: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 3px 8px rgba(0,0,0,0.2); z-index: 1100; padding: 5px; font-size: 14px; min-width: 100px; }
      #detach-menu div { padding: 6px 12px; cursor: pointer; border-radius: 3px; }
      #detach-menu div:hover { background-color: #eee; }

      /* כללי: מניעת בחירת טקסט */
       body.user-select-none { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
       /* סימון בלוקים מחוברים - מוסתר כברירת מחדל */
      .connected-block::after, .has-connected-block::before { display: none; }

      /* כפתור בדיקת שמע */
      #sound-test-button {
        position: fixed; bottom: 15px; right: 15px; z-index: 9999;
        padding: 8px 12px; background-color: #f0ad4e; /* Default: Orange */
        color: white; border: none; border-radius: 4px; cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2); font-family: Arial, sans-serif;
        font-size: 13px; font-weight: bold; opacity: 1; transition: opacity 0.5s ease-out, background-color 0.3s ease;
      }
      #sound-test-button:hover { background-color: #ec971f; }
      #sound-test-button.success { background-color: #5cb85c; }
      #sound-test-button.success:hover { background-color: #4cae4c; }
      #sound-test-button.fail { background-color: #d9534f; cursor: not-allowed;}
      #sound-test-button.fail:hover { background-color: #d43f3a; }
    `;
    document.head.appendChild(style);
    console.log('Highlighting and animation styles added/verified.');
  }

  // ========================================================================
  // הוספת כפתור בדיקת שמע (מהקוד שסופק)
  // ========================================================================
    function addSoundTestButton() {
        if (!CONFIG.PLAY_SOUND) return; // Only add if sound is configured to play

        try {
            if (document.getElementById('sound-test-button')) return; // Don't add if already exists

            const button = document.createElement('button');
            button.id = 'sound-test-button';
            button.textContent = 'אפשר/בדוק צליל'; // Initial text
            button.title = 'לחץ כאן כדי לאפשר ולהפעיל את צליל ההצמדה';

            // Apply styles using Object.assign for cleaner code
            Object.assign(button.style, {
                position: 'fixed', bottom: '15px', right: '15px', zIndex: '9999',
                padding: '8px 12px', backgroundColor: '#f0ad4e', /* Orange - Initial state */
                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)', fontFamily: 'Arial, sans-serif',
                fontSize: '13px', fontWeight: 'bold', opacity: '1',
                transition: 'opacity 0.5s ease-out, background-color 0.3s ease'
            });

             // Hover effect (can be done in CSS too)
            button.onmouseover = function() { if (!this.disabled) this.style.backgroundColor = '#ec971f'; };
            button.onmouseout = function() { if (!this.disabled) this.style.backgroundColor = '#f0ad4e'; };

            button.addEventListener('click', function() {
                console.log("[Sound Test] Button clicked. Audio enabled:", audioEnabled);
                if (!soundInitialized) {
                     console.warn("[Sound Test] Audio not initialized yet.");
                     // Optionally try initializing again, though it should happen on DOMContentLoaded
                     // initAudio();
                     button.textContent = 'שגיאת אתחול';
                     button.style.backgroundColor = '#d9534f'; // Red
                     button.disabled = true;
                     return;
                }

                if (audioEnabled) {
                    // If already enabled, just play the sound
                    playSnapSound(); // Use the existing function
                    button.textContent = 'צליל תקין ✓';
                    button.classList.add('success');
                     button.onmouseover = function() { this.style.backgroundColor = '#45a049'; };
                     button.onmouseout = function() { this.style.backgroundColor = '#5cb85c'; };
                    button.disabled = true;
                    setTimeout(() => { button.style.opacity = '0'; setTimeout(() => button.remove(), 500); }, 2000);
                } else {
                    // Attempt to enable audio context by playing
                    console.log("[Sound Test] Attempting to unlock audio context...");
                    if (snapSound) {
                       const playPromise = snapSound.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                console.log("[Sound Test] Audio context unlocked!");
                                snapSound.pause(); // Stop immediately after unlocking
                                snapSound.currentTime = 0;
                                audioEnabled = true;
                                button.textContent = 'שמע הופעל ✓';
                                button.classList.add('success');
                                button.style.backgroundColor = '#5cb85c'; // Green
                                button.onmouseover = function() { this.style.backgroundColor = '#45a049'; };
                                button.onmouseout = function() { this.style.backgroundColor = '#5cb85c'; };
                                button.disabled = true;
                                setTimeout(() => { button.style.opacity = '0'; setTimeout(() => button.remove(), 500); }, 2000);
                            }).catch(error => {
                                console.warn('[Sound Test] Audio unlock/play failed:', error);
                                button.textContent = 'שמע נכשל/חסום';
                                button.style.backgroundColor = '#d9534f'; // Red
                                button.classList.add('fail');
                                button.title = 'לא ניתן להפעיל שמע. נסה לרענן או לבדוק הגדרות דפדפן.';
                                // Don't disable the button, maybe user interaction later will work
                            });
                        } else {
                             console.warn('[Sound Test] snapSound.play() did not return a promise.');
                              button.textContent = 'שגיאת שמע';
                             button.style.backgroundColor = '#d9534f'; // Red
                        }
                    } else {
                         console.error("[Sound Test] snapSound object is null.");
                         button.textContent = 'שגיאת שמע';
                         button.style.backgroundColor = '#d9534f'; // Red
                    }
                }
            });

            document.body.appendChild(button);
            if (CONFIG.DEBUG) console.log('Sound test button added.');
        } catch (err) {
            console.error('Error adding sound test button:', err);
        }
    }

    // ========================================================================
    // השמעת צליל הצמדה (מהקוד שסופק)
    // ========================================================================
    function playSnapSound() {
        if (!CONFIG.PLAY_SOUND) return; // Check config first

        if (!audioEnabled || !snapSound) {
            if (CONFIG.DEBUG) {
                if (!soundInitialized) console.warn("[PlaySound] Audio not initialized yet.");
                else if (!audioEnabled) console.warn("[PlaySound] Cannot play sound: Audio context not yet unlocked by user interaction.");
                else if (!snapSound) console.warn("[PlaySound] Cannot play sound: Audio element missing.");
            }
             // Maybe briefly show the test button again?
            // addSoundTestButton();
            return;
        }

        try {
            // Reset and play
            snapSound.currentTime = 0;
            const playPromise = snapSound.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Success - do nothing or log if needed
                    // if (CONFIG.DEBUG) console.log('Snap sound played.');
                }).catch(error => {
                    // Ignore AbortError which happens if played again quickly
                    if (error.name !== 'AbortError' && CONFIG.DEBUG) {
                       console.warn('Error playing snap sound:', error);
                    }
                });
            }
        } catch (err) {
            console.error('[PlaySound] Exception:', err);
        }
    }


  // ========================================================================
  // פונקציות עזר לניתוק בלוקים
  // ========================================================================
  function showDetachMenu(x, y, block) {
      removeDetachMenu(); // Clean up previous menus

      const menu = document.createElement('div');
      menu.id = 'detach-menu';
      // Position menu near the click, ensuring it stays within viewport
      const menuWidth = 120; // Estimated width
      const menuHeight = 40; // Estimated height
      menu.style.left = Math.min(x, window.innerWidth - menuWidth - 10) + 'px';
      menu.style.top = Math.min(y, window.innerHeight - menuHeight - 10) + 'px';

      const detachOption = document.createElement('div');
      detachOption.textContent = 'נתק בלוק'; // Or "Detach Block"
      detachOption.onclick = (e) => {
          e.stopPropagation(); // Prevent click from closing menu immediately
          detachBlock(block); // Detach the block (with animation/sound)
          removeDetachMenu(); // Close the menu
      };

      menu.appendChild(detachOption);
      document.body.appendChild(menu); // Append to body to ensure visibility

      // Add listener to close menu when clicking outside
      // Use setTimeout to avoid capturing the same click that opened the menu
      setTimeout(() => {
          document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
          document.addEventListener('contextmenu', closeMenuOutside, { capture: true, once: true }); // Close on another right-click too
      }, 50);
  }

  function closeMenuOutside(e) {
      const menu = document.getElementById('detach-menu');
      if (menu && !menu.contains(e.target)) { // Only close if click is outside
          removeDetachMenu();
      } else if (menu && e.type === 'click') {
           // If click was inside, re-attach the listener because 'once: true' removed it
           document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
           document.addEventListener('contextmenu', closeMenuOutside, { capture: true, once: true });
      } else if (menu && e.type === 'contextmenu') {
           // If right-click was inside, also re-attach
           document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
           document.addEventListener('contextmenu', closeMenuOutside, { capture: true, once: true });
      }
  }

  function removeDetachMenu() {
      const menu = document.getElementById('detach-menu');
      if (menu) {
          // Remove global listeners when menu is removed
          document.removeEventListener('click', closeMenuOutside, { capture: true });
          document.removeEventListener('contextmenu', closeMenuOutside, { capture: true });
          menu.remove();
      }
  }

  function detachBlock(blockToDetach, animate = true) {
    if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) {
        if(CONFIG.DEBUG) console.log("[Detach] Block not connected or invalid.");
        return; // Not connected
    }

    const targetId = blockToDetach.getAttribute('data-connected-to');
    const connectionDirection = blockToDetach.getAttribute('data-connection-direction'); // How source connected to target ('left' or 'right')
    const connectedBlock = document.getElementById(targetId);

    if(CONFIG.DEBUG) console.log(`[Detach] Detaching ${blockToDetach.id} from ${targetId} (direction=${connectionDirection})`);

    // Remove connection attributes from the source block
    blockToDetach.removeAttribute('data-connected-to');
    blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block');

    // Remove connection attributes from the target block
    if (connectedBlock) {
        const attributeToRemove = connectionDirection === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
        connectedBlock.removeAttribute(attributeToRemove);
        // Check if the target block still has any connections before removing the general class
        if (!connectedBlock.hasAttribute('data-connected-from-left') && !connectedBlock.hasAttribute('data-connected-from-right')) {
            connectedBlock.classList.remove('has-connected-block');
        }
         if(CONFIG.DEBUG) console.log(`[Detach] Removed connection attribute '${attributeToRemove}' from target ${targetId}`);
    } else {
        if(CONFIG.DEBUG) console.warn(`[Detach] Target block with ID ${targetId} not found.`);
    }

    // Optional: Apply detach animation and sound
    if (animate) {
        addDetachEffectAnimation(blockToDetach);
        // playDetachSound(); // Add if you have a detach sound
    }

    removeDetachMenu(); // Close context menu if open
  }


  // ========================================================================
  // פונקציות עזר לאנימציה
  // ========================================================================
  function addSnapEffectAnimation(block) {
      block.classList.remove('snap-animation'); // Remove first to reset
      void block.offsetWidth; // Force reflow to restart animation
      block.classList.add('snap-animation');
      // Remove class after animation duration (match CSS)
      setTimeout(() => {
          block.classList.remove('snap-animation');
      }, 250); // Duration of snapEffect animation in CSS
  }

  function addDetachEffectAnimation(block) {
      block.classList.remove('detach-animation');
      void block.offsetWidth;
      block.classList.add('detach-animation');
      setTimeout(() => {
          block.classList.remove('detach-animation');
      }, 300); // Duration of detachEffect animation in CSS
  }

  // ========================================================================
  // יצירת ID ייחודי
  // ========================================================================
  function generateUniqueId(block) {
      if (block.id) return block.id; // Don't overwrite existing ID
      let prefix = 'block';
      // Basic type detection (can be expanded)
      if (block.dataset.category === 'triggering') prefix = 'trig';
      else if (block.dataset.category === 'motion') prefix = 'mot';
      else if (block.dataset.category === 'looks') prefix = 'look';
      else if (block.dataset.category === 'sound') prefix = 'snd';
      else if (block.dataset.category === 'control') prefix = 'ctrl';
      else if (block.dataset.category === 'end') prefix = 'end';

      let newId = `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      block.id = newId;
      // console.log(`Generated unique ID: ${block.id}`);
      return block.id;
  }

})();
// --- END OF FILE linkageimproved.js ---
