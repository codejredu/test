// --- START OF FILE linkageimproved.js ---
// מימוש משופר - v3.4 - ניסיון נוסף לתיקון קפיצה + הילה + שמע

(function() {
  // ----------------------------------------------------------------------
  // Configuration
  // ----------------------------------------------------------------------
  const CONFIG = {
    PIN_WIDTH: 5,             // רוחב/עומק פין/שקע לצורך זיהוי קרבה (פיקסלים)
    CONNECT_THRESHOLD: 15,    // מרחק אופקי מקסימלי (בין פין לשקע) לזיהוי (פיקסלים)
    VERTICAL_ALIGN_THRESHOLD: 30, // הפרש אנכי מקסימלי מותר (בין top-ים)
    BLOCK_GAP: 0,             // רווח סופי בין בלוקים מחוברים
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.7,
    DEBUG: true
  };

  // ----------------------------------------------------------------------
  // Global State Variables
  // ----------------------------------------------------------------------
  let currentDraggedBlock = null;    // הבלוק הנגרר כרגע
  let potentialSnapTarget = null;  // הבלוק הפוטנציאלי להצמדה
  let snapDirection = null;        // כיוון ההצמדה ('left' או 'right' יחסית ליעד)
  let isDraggingBlock = false;       // האם מתבצעת גרירה
  let dragOffset = { x: 0, y: 0 }; // היסט העכבר מהפינה השמאלית-עליונה של הבלוק
  let futureIndicator = null;      // אלמנט המלבן הכחול
  let snapSound = null;            // אלמנט האודיו לצליל הצמדה
  let audioEnabled = false;        // האם המשתמש אפשר שמע
  let soundInitialized = false;    // האם בוצע ניסיון אתחול לשמע

  // ========================================================================
  // Initialization
  // ========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    addHighlightStyles();           // הוסף סגנונות CSS
    initProgrammingAreaListeners(); // מאזינים לאזור התכנות הראשי
    observeNewBlocks();             // צפה בבלוקים חדשים
    initExistingBlocks();           // אתחל בלוקים קיימים
    initGlobalMouseListeners();     // מאזינים גלובליים לעכבר
    initAudio();                    // אתחל מערכת שמע
    addSoundTestButton();           // הוסף כפתור בדיקת שמע

    if (CONFIG.DEBUG) console.log(`Block linkage system initialized (v3.4)`);
    if (CONFIG.DEBUG) console.log(`Config:`, JSON.stringify(CONFIG));
  });

  // ========================================================================
  // Audio Handling (Using provided code)
  // ========================================================================
   function initAudio() {
    if (!CONFIG.PLAY_SOUND || soundInitialized) return;
    soundInitialized = true;

    try {
      snapSound = document.createElement('audio');
      snapSound.id = 'snap-sound';
      const source = document.createElement('source');
      // Base64 encoded short click sound (WAV)
      source.src = 'data:audio/wav;base64,UklGRjQnAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRAnAACAgICAgICAgICAgICAgICAgICAgICAgICBgYGBgYGBgoKCgoKCg4ODg4ODhISEhISEhYWFhYWFhoaGhoaGh4eHh4eHiIiIiIiIiYmJiYmJioqKioqKi4uLi4uLjIyMjIyMjY2NjY2Njo6Ojo6Oj4+Pj4+PkJCQkJCQkZGRkZGRkpKSkpKSk5OTk5OTlJSUlJSUlZWVlZWVlpaWlpaWl5eXl5eXmJiYmJiYmZmZmZmZmpqampqam5ubm5ubnJycnJycnZ2dnZ2dnp6enp6en5+fn5+foKCgoKCgoaGhoaGhoqKioqKio6Ojo6Ojvb29u7u7ubm5t7e3tbW1s7OzsbGxr6+vrq6urKysqqqqqKiop6enpKSkpKSkpaWlpaWlpqamp6enqKioqampqqqqqqqqqampp6ennp6elZWVjIyMg4ODe3t7c3NzbW1taWlpZmZmZWVlZGRkZGRkY2NjYmJiYWFhYGBgX19fXl5eXV1dXFxcW1tbWlpaWVlZWFhYV1dXVlZWVVVVVFRUU1NTUlJSUVFRUFBQT09PTk5OTU1NTExMS0tLSkpKSUlJSEhIR0dHRkZGRUVFREREQ0NDQkJCQUFBQEBAQEBAQUFBQkJCQ0NDRERERUVFRkZGR0dHSEhISUlJSkpKS0tLTExMTU1NTk5OT09PUFBQUVFRUlJSU1NTVFRUVVVVVlZWV1dXWFhYWVlZWlpaW1tbXFxcXV1dXl5eX19fYGBgYWFhYmJiY2NjZGRkZWVlZmZmaWlpbW1tc3Nze3t7g4ODjIyMlZWVnp6ep6enqampqqqqqqqqqqqqq6urq6urrKysrKysra2tra2trq6urq6ur6+vr6+vsLCwsLCwsbGxsbGxs7Oztra2uLi4ubm5u7u7vb29v7+/wMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwDAwMAwMDAsOwAwAdMAwAAABgAAAA=';
      snapSound.src = source.src; // הגדר את המקור שנוצר
      document.body.appendChild(snapSound); // הוסף את הבלוק לדף (נדרש בחלק מהדפדפנים)
      if (CONFIG.DEBUG) console.log('Audio element created and added to body');
    } catch (err) {
      console.error('Error creating audio element:', err);
    }
  }

  // אתחול השמע בעת אינטראקציה ראשונה (לחיצה או מגע)
  const enableAudioHandler = () => {
    if (!audioEnabled && snapSound) {
      snapSound.play().then(() => {
        snapSound.pause(); // עצור מיד אחרי הפעלה ראשונית
        snapSound.currentTime = 0;
        audioEnabled = true;
        if (CONFIG.DEBUG) console.log('Audio context unlocked by user interaction.');
      }).catch(err => {
        // שגיאה צפויה אם לא היתה אינטראקציה, נמשיך ללא שמע
        if (CONFIG.DEBUG) console.warn('Audio context not yet unlocked by user interaction:', err.name);
      }).finally(() => {
        // הסר את המאזינים אחרי הניסיון הראשון
        document.removeEventListener('click', enableAudioHandler, true);
        document.removeEventListener('touchstart', enableAudioHandler, true);
      });
    }
  };

  // האזן לאירועים שיכולים לאפשר הפעלת אודיו אוטומטית
  document.addEventListener('click', enableAudioHandler, { capture: true, once: true });
  document.addEventListener('touchstart', enableAudioHandler, { capture: true, once: true });


  // ========================================================================
  // השמעת צליל הצמדה
  // ========================================================================
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !snapSound) {
        if (CONFIG.DEBUG && CONFIG.PLAY_SOUND && !snapSound) {
             console.warn("[PlaySound] Audio element not initialized.");
        }
        return; // לא ניתן להשמיע אם השמע כבוי או לא אותחל
    }

    // בדוק אם השמע כבר הופעל על ידי המשתמש
    if (!audioEnabled) {
        if (CONFIG.DEBUG) console.warn("[PlaySound] Audio context not yet unlocked. Please click/tap the screen first.");
        // אופציונלי: נסה להפעיל שוב, למקרה שהיה עיכוב באינטראקציה
        snapSound.play().then(() => {
            snapSound.pause();
            snapSound.currentTime = 0;
            audioEnabled = true;
            console.log("[PlaySound] Audio context unlocked now, retrying play...");
            playSnapSound(); // נסה שוב עכשיו שההקשר פעיל
        }).catch(() => {
            // עדיין לא ניתן להפעיל
        });
        return;
    }

    // אם השמע מאופשר ואותחל, נגן
    try {
        snapSound.currentTime = 0; // התחל מההתחלה
        snapSound.play().catch(error => {
            // התעלם משגיאות AbortError שקורות אם קוראים ל-play מהר מדי ברצף
            if (error.name !== 'AbortError' && CONFIG.DEBUG) {
               console.warn('Error playing snap sound:', error);
            }
        });
         if (CONFIG.DEBUG) console.log('Attempted to play snap sound.');
    } catch (err) {
      console.error('[PlaySound] Exception:', err);
    }
  }

  // ========================================================================
  // הוספת כפתור בדיקת שמע (מהקוד שסופק)
  // ========================================================================
  function addSoundTestButton() {
    if (!CONFIG.PLAY_SOUND) return;

    try {
        if (document.getElementById('sound-test-button')) return;

        const button = document.createElement('button');
        button.id = 'sound-test-button';
        button.textContent = 'בדוק צליל';
        button.title = 'לחץ כדי לאפשר ולהשמיע את צליל ההצמדה';
        Object.assign(button.style, {
            position: 'fixed', bottom: '15px', right: '15px', zIndex: '9999',
            padding: '8px 12px', backgroundColor: '#f0ad4e', /* Orange */
            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)', fontFamily: 'Arial, sans-serif',
            fontSize: '13px', fontWeight: 'bold', opacity: '1',
            transition: 'opacity 0.5s ease-out, background-color 0.3s ease'
        });

        button.onmouseover = function() { if (!this.disabled) this.style.backgroundColor = '#ec971f'; };
        button.onmouseout = function() { if (!this.disabled) this.style.backgroundColor = '#f0ad4e'; };

        button.addEventListener('click', function() {
            if (CONFIG.DEBUG) console.log("[Sound Test] Button clicked. Audio enabled:", audioEnabled, "Sound Initialized:", soundInitialized);

            if (!soundInitialized) {
                 console.warn("[Sound Test] Audio not initialized yet.");
                 button.textContent = 'שגיאת אתחול';
                 button.style.backgroundColor = '#d9534f'; // Red
                 button.disabled = true;
                 return;
            }

            // נסה להפעיל ישירות את אובייקט ה-snapSound
            if (snapSound) {
                const playPromise = snapSound.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        snapSound.pause(); // עצור מיד אחרי הבדיקה
                        snapSound.currentTime = 0;
                        audioEnabled = true; // ודא שהדגל מוגדר
                        button.textContent = 'צליל תקין ✓';
                        button.classList.add('success');
                        button.style.backgroundColor = '#5cb85c'; // Green
                        button.onmouseover = null; // הסר אירועי ריחוף מיותרים
                        button.onmouseout = null;
                        button.disabled = true;
                        setTimeout(() => { button.style.opacity = '0'; setTimeout(() => button.remove(), 500); }, 2000);
                    }).catch(error => {
                        console.warn('[Sound Test] Playback failed:', error);
                        button.textContent = 'שמע נכשל/חסום';
                        button.style.backgroundColor = '#d9534f'; // Red
                        button.classList.add('fail');
                        button.title = 'לא ניתן להפעיל שמע. לחץ במקום אחר בדף ונסה שוב.';
                    });
                } else {
                    console.warn('[Sound Test] snapSound.play() did not return a promise.');
                    button.textContent = 'שגיאת שמע (Promise)';
                    button.style.backgroundColor = '#d9534f'; // Red
                }
            } else {
                console.error("[Sound Test] snapSound object is null.");
                button.textContent = 'שגיאת שמע (Null)';
                button.style.backgroundColor = '#d9534f'; // Red
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

    // Allow dropping elements from the palette onto the programming area
    programmingArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move"; // Indicate it's a move operation
        // Optional visual feedback while dragging over
        if (!programmingArea.classList.contains('drag-over-active')) {
            programmingArea.classList.add('drag-over-active');
        }
    });

    programmingArea.addEventListener('dragleave', (event) => {
        // Remove visual feedback if not dragging over a child element
        if (!programmingArea.contains(event.relatedTarget)) {
            programmingArea.classList.remove('drag-over-active');
        }
    });

     programmingArea.addEventListener('drop', (event) => {
        // This drop handler is primarily for blocks coming *from* the palette,
        // handled by script.js. We just remove the visual feedback here.
        programmingArea.classList.remove('drag-over-active');
        // The actual positioning and adding logic is in script.js's handleDrop
    });


    // Prevent default HTML5 drag and drop for blocks *within* the area
    // to avoid conflicts with our custom mouse listeners.
    programmingArea.addEventListener('dragstart', (event) => {
        if (event.target.classList.contains('block-container')) {
            if (CONFIG.DEBUG) console.log("[Programming Area] Preventing default dragstart on internal block.");
            event.preventDefault();
        }
    });
  }


  // ========================================================================
  // הוספת מאזינים לבלוקים (קיימים וחדשים)
  // ========================================================================
  function observeNewBlocks() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList.contains('block-container')) {
              if (!node.id) generateUniqueId(node);
              addBlockDragListeners(node);
              if (CONFIG.DEBUG) console.log(`[Observer] Listeners added to new block: ${node.id}`);
            }
          });
          // Optional: Handle removed nodes if needed (e.g., cleanup)
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList.contains('block-container')) {
                 if (CONFIG.DEBUG) console.log(`[Observer] Block removed: ${node.id}`);
                 // Perform any cleanup related to the removed block if necessary
            }
          });
        }
      });
    });
    observer.observe(programmingArea, { childList: true });
  }

  function initExistingBlocks() {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;
      programmingArea.querySelectorAll('.block-container').forEach(block => {
          if (!block.id) generateUniqueId(block);
          addBlockDragListeners(block);
      });
      if (CONFIG.DEBUG) console.log("[Init] Listeners added to existing blocks.");
  }

  function addBlockDragListeners(block) {
      // Ensure only one listener of each type
      block.removeEventListener('mousedown', handleMouseDown);
      block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu);
      block.addEventListener('contextmenu', handleContextMenu);
  }


  // ========================================================================
  // לוגיקת גרירה (MouseDown, MouseMove, MouseUp)
  // ========================================================================

  function handleMouseDown(e) {
      if (e.button !== 0 || !e.target.closest('.block-container')) return; // Left click only

      const block = e.target.closest('.block-container');
      if (!block.id) generateUniqueId(block);

      // Prevent default drag and text selection
      block.draggable = false;
      e.preventDefault();

      if (CONFIG.DEBUG) console.log(`[MouseDown] ${block.id}`);

      // --- Detach if connected ---
      if (block.hasAttribute('data-connected-to')) {
          if (CONFIG.DEBUG) console.log(`  [MouseDown] Detaching ${block.id} before drag.`);
          detachBlock(block, false); // Detach without animation/sound
      }

      currentDraggedBlock = block;
      isDraggingBlock = true;

      const rect = block.getBoundingClientRect();
      const parentElement = block.offsetParent || document.body;
      const parentRect = parentElement.getBoundingClientRect();

      // Calculate offset from the block's top-left corner
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // Prepare for dragging
      block.style.position = 'absolute';
      // Recalculate initial position in case it wasn't absolute before
      block.style.left = (rect.left - parentRect.left + parentElement.scrollLeft) + 'px';
      block.style.top = (rect.top - parentRect.top + parentElement.scrollTop) + 'px';
      block.style.zIndex = '1001'; // Bring to front
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none'); // Prevent text selection globally

      if (CONFIG.DEBUG) console.log(`  [MouseDown] Initial pos: L=${block.style.left}, T=${block.style.top}. Offset: X=${dragOffset.x.toFixed(1)}, Y=${dragOffset.y.toFixed(1)}`);
  }

  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    // Prevent default actions during drag
    e.preventDefault();
    e.stopPropagation();

    const parentElement = currentDraggedBlock.offsetParent || document.body;
    const parentRect = parentElement.getBoundingClientRect();

    // Calculate new position relative to the offset parent's viewport origin, considering scroll
    let newLeft = e.clientX - parentRect.left - dragOffset.x + parentElement.scrollLeft;
    let newTop = e.clientY - parentRect.top - dragOffset.y + parentElement.scrollTop;

    // Constrain to parent bounds if the parent is the programming area
    if (parentElement.id === 'program-blocks') {
        const blockWidth = currentDraggedBlock.offsetWidth;
        const blockHeight = currentDraggedBlock.offsetHeight;
        const maxLeft = Math.max(0, parentElement.scrollWidth - blockWidth);
        const maxTop = Math.max(0, parentElement.scrollHeight - blockHeight);
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
    }

    // Update block position visually
    currentDraggedBlock.style.left = newLeft + 'px';
    currentDraggedBlock.style.top = newTop + 'px';

    // Check for snap possibility and update highlights/indicator
    checkAndHighlightSnapPossibility();
  }

  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) {
      // If we somehow get a mouseup without dragging, ensure cleanup
      if(isDraggingBlock || currentDraggedBlock) cleanupAfterDragState();
      return;
    }

    // Prevent default actions for mouseup
    e.preventDefault();
    e.stopPropagation();

    const blockReleased = currentDraggedBlock;
    const targetToSnap = potentialSnapTarget;
    const directionToSnap = snapDirection;

    if (CONFIG.DEBUG) console.log(`[MouseUp] ----- Start MouseUp for ${blockReleased.id} -----`);
    if (CONFIG.DEBUG) console.log(`[MouseUp] Target=${targetToSnap?.id || 'none'}, Direction=${directionToSnap || 'none'}`);

    // --- Perform Snap Action (if applicable) ---
    // The actual position change happens here
    if (targetToSnap && directionToSnap) {
      performBlockSnap(blockReleased, targetToSnap, directionToSnap);
    } else {
       if (CONFIG.DEBUG) console.log(`[MouseUp] No snap target found.`);
       // Block remains at its last position from mousemove
       blockReleased.draggable = true; // Still need to make it draggable again
    }

    // --- Cleanup ---
    // Reset state variables and remove visual cues AFTER snap logic
    cleanupAfterDragState();
    if (CONFIG.DEBUG) console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
  }

  function handleMouseLeave(e) {
      if (isDraggingBlock && (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML')) {
          if (CONFIG.DEBUG) console.warn("Mouse left window during drag, treating as mouseup.");
          handleMouseUp(e);
      }
  }

  // ========================================================================
  // ניקוי מצב אחרי גרירה
  // ========================================================================
  function cleanupAfterDragState() {
      if (CONFIG.DEBUG) console.log("[Cleanup] Cleaning up drag state and visuals...");

      document.body.classList.remove('user-select-none'); // Allow text selection again

      // Clean up the block that was being dragged
      if (currentDraggedBlock) {
          currentDraggedBlock.style.zIndex = ''; // Reset z-index
          currentDraggedBlock.classList.remove('snap-source');
          currentDraggedBlock.draggable = true; // Restore default draggable behavior if needed
           // console.log(`[Cleanup] Cleaned up dragged block: ${currentDraggedBlock.id}`);
      }

      // Remove highlights from all potential targets
      document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
          el.classList.remove('snap-target', 'snap-left', 'snap-right');
      });
       // console.log("[Cleanup] Removed target highlights.");

      removeFuturePositionIndicator(); // Hide the blue indicator

      // Reset global state variables
      currentDraggedBlock = null;
      potentialSnapTarget = null;
      snapDirection = null;
      isDraggingBlock = false;
      // console.log("[Cleanup] Reset global state variables.");
  }

  // ========================================================================
  // בדיקת הצמדה והדגשה (עם לוגים להילה)
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock || !isDraggingBlock) return; // Only check if dragging

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const allBlocks = Array.from(programmingArea.querySelectorAll('.block-container'));
    const sourceRect = currentDraggedBlock.getBoundingClientRect();

    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1; // Start above threshold

    // Find the closest valid snap target
    for (const targetBlock of allBlocks) {
      if (targetBlock === currentDraggedBlock) continue; // Skip self
      if (!targetBlock.id) generateUniqueId(targetBlock); // Ensure ID

      const targetRect = targetBlock.getBoundingClientRect();
      // Calculate potential snap based on geometry and threshold
      const snapInfo = calculateSnapInfo(sourceRect, targetRect);

      if (snapInfo && snapInfo.distance < minDistance) {
          // Check vertical alignment more strictly here if needed
           const verticalDiff = Math.abs(sourceRect.top - targetRect.top);
           if (verticalDiff <= CONFIG.VERTICAL_ALIGN_THRESHOLD) {
                minDistance = snapInfo.distance;
                bestTarget = targetBlock;
                bestDirection = snapInfo.direction;
                 // if (CONFIG.DEBUG) console.log(`[Highlight Check] Found potential target: ${bestTarget.id}, dir: ${bestDirection}, dist: ${minDistance.toFixed(1)}`);
           } else {
                 // if (CONFIG.DEBUG) console.log(`[Highlight Check] Target ${targetBlock.id} failed vertical alignment (diff: ${verticalDiff.toFixed(1)})`);
           }
      }
    }

    // --- Update Highlights and Global State ---

    // If no target found this cycle, clear previous highlight and indicator
    if (!bestTarget) {
        if (potentialSnapTarget) { // If there *was* a target before
            if (CONFIG.DEBUG) console.log(`%c[Highlight] De-highlighting OLD target: ${potentialSnapTarget.id}`, 'color: #aaa;');
            potentialSnapTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
        }
        removeFuturePositionIndicator();
        potentialSnapTarget = null;
        snapDirection = null;
    } else {
        // A target was found (could be the same or different from previous)
        // If the target is different from the previous one, clear the old highlight
        if (potentialSnapTarget && potentialSnapTarget !== bestTarget) {
            if (CONFIG.DEBUG) console.log(`%c[Highlight] De-highlighting PREVIOUS target: ${potentialSnapTarget.id}`, 'color: #aaa;');
            potentialSnapTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
        }

        // Update global state
        potentialSnapTarget = bestTarget;
        snapDirection = bestDirection;

        // Add highlight to the *current* best target
        if (!potentialSnapTarget.classList.contains('snap-target')) {
            if (CONFIG.DEBUG) console.log(`%c[Highlight] Highlighting NEW target: ${potentialSnapTarget.id}`, 'color: orange; font-weight: bold;');
            potentialSnapTarget.classList.add('snap-target');
        }
        // Always update direction class
        potentialSnapTarget.classList.remove('snap-left', 'snap-right');
        potentialSnapTarget.classList.add(snapDirection === 'left' ? 'snap-left' : 'snap-right');

        // Update the future position indicator
        const programRect = programmingArea.getBoundingClientRect();
        updateFuturePositionIndicator(currentDraggedBlock, potentialSnapTarget, snapDirection, programRect);
    }
     // console.log("[Highlight Check] Finished. Current Target:", potentialSnapTarget?.id);
  }


  // ========================================================================
  // חישוב כיוון הצמדה (בודק קרבה של פין/שקע)
  // ========================================================================
  function calculateSnapDirection(sourceRect, targetRect) {
    // 1. בדיקת חפיפה אנכית גסה
    if (sourceRect.bottom < targetRect.top || sourceRect.top > targetRect.bottom) {
        return null; // אין חפיפה אנכית כלל
    }

    // 2. בדיקת הפרש אנכי בין מרכזים או קצוות עליונים
    const verticalDiff = Math.abs(sourceRect.top - targetRect.top);
    if (verticalDiff > CONFIG.VERTICAL_ALIGN_THRESHOLD) {
      // if (CONFIG.DEBUG) console.log(` -> Vertical diff too large: ${verticalDiff.toFixed(1)} > ${CONFIG.VERTICAL_ALIGN_THRESHOLD}`);
      return null;
    }

    // 3. חישוב מרחק אופקי בין נקודות החיבור הפוטנציאליות
    // נקודת החיבור היא מרכז הפין/שקע
    const sourceRightConnectX = sourceRect.right - CONFIG.PIN_WIDTH / 2;
    const targetLeftConnectX = targetRect.left + CONFIG.PIN_WIDTH / 2;
    const rightToLeftDist = Math.abs(sourceRightConnectX - targetLeftConnectPoint);

    const sourceLeftConnectX = sourceRect.left + CONFIG.PIN_WIDTH / 2;
    const targetRightConnectX = targetRect.right - CONFIG.PIN_WIDTH / 2;
    const leftToRightDist = Math.abs(sourceLeftConnectX - targetRightConnectX);

    // 4. קביעת הכיוון המועדף ובדיקת סף הקרבה
    const isSourceLikelyLeft = (sourceRect.left + sourceRect.width / 2) < (targetRect.left + targetRect.width / 2);

    if (isSourceLikelyLeft && rightToLeftDist <= CONFIG.CONNECT_THRESHOLD) {
      // if (CONFIG.DEBUG) console.log(` -> Possible snap 'left' (dist=${rightToLeftDist.toFixed(1)})`);
      return 'left'; // המקור משמאל ליעד
    }

    if (!isSourceLikelyLeft && leftToRightDist <= CONFIG.CONNECT_THRESHOLD) {
      // if (CONFIG.DEBUG) console.log(` -> Possible snap 'right' (dist=${leftToRightDist.toFixed(1)})`);
      return 'right'; // המקור מימין ליעד
    }

    return null; // רחוק מדי
  }


  // ========================================================================
  // ביצוע ההצמדה הפיזית (חישוב מיקום *ללא* PIN_SOCKET_DEPTH)
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock) {
        console.error("[Perform Snap] Invalid blocks provided.");
        return;
    }
    if (CONFIG.DEBUG) console.log(`%c[Perform Snap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`, 'color: blue; font-weight: bold;');

    try {
        const sourceRect = sourceBlock.getBoundingClientRect(); // Get current dimensions
        const targetRect = targetBlock.getBoundingClientRect(); // Get target position

        const parentElement = sourceBlock.offsetParent || document.body;
        if (!parentElement) throw new Error("Cannot find offsetParent for positioning.");
        const parentRect = parentElement.getBoundingClientRect();

        // Calculate desired *viewport* position (edge-to-edge alignment)
        let desiredViewportTop = targetRect.top; // Align tops
        let desiredViewportLeft;
        if (direction === 'left') {
            // Source block is to the LEFT of the target block
            // Align source's right edge with target's left edge
            desiredViewportLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
        } else { // direction === 'right'
            // Source block is to the RIGHT of the target block
            // Align source's left edge with target's right edge
            desiredViewportLeft = targetRect.right + CONFIG.BLOCK_GAP;
        }
        if (CONFIG.DEBUG) console.log(`[Perform Snap] Desired Viewport Pos: Left=${desiredViewportLeft.toFixed(1)}, Top=${desiredViewportTop.toFixed(1)}`);

        // Convert viewport position to style values relative to offset parent
        let styleLeft = desiredViewportLeft - parentRect.left + parentElement.scrollLeft;
        let styleTop = desiredViewportTop - parentRect.top + parentElement.scrollTop;
        if (CONFIG.DEBUG) console.log(`[Perform Snap] Calculated Style (Raw): left=${styleLeft.toFixed(1)}, top=${styleTop.toFixed(1)}`);

        // Constrain within parent if necessary
        if (parentElement.id === 'program-blocks') {
            const maxLeft = Math.max(0, parentElement.scrollWidth - sourceRect.width);
            const maxTop = Math.max(0, parentElement.scrollHeight - sourceRect.height);
            styleLeft = Math.max(0, Math.min(styleLeft, maxLeft));
            styleTop = Math.max(0, Math.min(styleTop, maxTop));
        }

        // Apply the final calculated position (rounding might help consistency)
        const finalLeftPx = Math.round(styleLeft) + 'px';
        const finalTopPx = Math.round(styleTop) + 'px';
        console.log(`%c[Perform Snap] Applying final style: left=${finalLeftPx}, top=${finalTopPx}`, 'color: green; font-weight: bold;');
        sourceBlock.style.left = finalLeftPx;
        sourceBlock.style.top = finalTopPx;

        // Update connection attributes
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', direction);
        const targetAttr = direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
        targetBlock.setAttribute(targetAttr, sourceBlock.id);
        sourceBlock.classList.add('connected-block');
        targetBlock.classList.add('has-connected-block');
        if (CONFIG.DEBUG) console.log("[Perform Snap] Connection attributes updated.");

        // Play sound and animation
        playSnapSound();
        addSnapEffectAnimation(sourceBlock);

    } catch (err) {
        console.error('[Perform Snap] Error:', err);
    } finally {
        // console.log(`[Perform Snap] ----- End Snap for ${sourceBlock.id} -----`);
    }
}


  // ========================================================================
  // עדכון מחוון מיקום עתידי (ללא PIN_SOCKET_DEPTH)
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) {
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
          const targetRect = targetBlock.getBoundingClientRect();

          // Calculate desired viewport position (edge-to-edge, same as snapBlocks)
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

          // Constrain (optional)
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
         box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4) !important;
         transition: box-shadow 0.15s ease-out;
         cursor: grabbing !important;
         z-index: 1001 !important;
         opacity: 0.9;
      }

      /* הילה צהובה סביב יעד פוטנציאלי - **מודגשת** */
      .snap-target {
        outline: 4px solid #FFEB3B !important; /* צהוב בהיר יותר */
        outline-offset: 4px;
        box-shadow: 0 0 20px 8px rgba(255, 235, 59, 0.75) !important;
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important;
      }

      /* מלבן כחול מקווקו למיקום עתידי */
      .future-position-indicator {
        position: absolute; border: 2px dashed #03A9F4; border-radius: 5px;
        background-color: rgba(3, 169, 244, 0.1); pointer-events: none;
        z-index: 998; opacity: 0;
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
       /* סימון בלוקים מחוברים - מוסתר */
      .connected-block::after, .has-connected-block::before { display: none; }

      /* כפתור בדיקת שמע */
      #sound-test-button {
        position: fixed; bottom: 15px; right: 15px; z-index: 9999;
        padding: 8px 12px; background-color: #f0ad4e; /* Default: Orange */
        color: white; border: none; border-radius: 4px; cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2); font-family: Arial, sans-serif;
        fontSize: '13px', fontWeight: 'bold', opacity: '1',
        transition: opacity 0.5s ease-out, background-color 0.3s ease;
      }
      #sound-test-button:hover:not(:disabled) { background-color: #ec971f; }
      #sound-test-button.success { background-color: #5cb85c; }
      #sound-test-button.fail { background-color: #d9534f; cursor: default; }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Highlighting and animation styles added.');
  }

   // ========================================================================
  // הוספת כפתור בדיקת שמע (מהקוד שסופק, עם שיפורים קלים)
  // ========================================================================
  function addSoundTestButton() {
    if (!CONFIG.PLAY_SOUND) return;

    try {
        if (document.getElementById('sound-test-button')) return;

        const button = document.createElement('button');
        button.id = 'sound-test-button';
        button.textContent = 'אפשר/בדוק צליל';
        button.title = 'לחץ כאן כדי לאפשר ולהשמיע את צליל ההצמדה';
        Object.assign(button.style, {
            position: 'fixed', bottom: '15px', right: '15px', zIndex: '9999',
            padding: '8px 12px', backgroundColor: '#f0ad4e', /* Orange */
            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)', fontFamily: 'Arial, sans-serif',
            fontSize: '13px', fontWeight: 'bold', opacity: '1',
            transition: 'opacity 0.5s ease-out, background-color 0.3s ease'
        });

         button.onmouseover = function() { if (!this.disabled) this.style.backgroundColor = '#ec971f'; };
         button.onmouseout = function() { if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('fail')) this.style.backgroundColor = '#f0ad4e'; };

        button.addEventListener('click', function() {
            if (CONFIG.DEBUG) console.log("[Sound Test] Button clicked. Audio initialized:", soundInitialized, "Audio enabled:", audioEnabled);

            if (!soundInitialized || !snapSound) {
                 console.warn("[Sound Test] Audio not initialized.");
                 button.textContent = 'שגיאת אתחול';
                 button.style.backgroundColor = '#d9534f'; button.classList.add('fail');
                 button.disabled = true;
                 return;
            }

            // ניסיון להפעיל את האודיו כדי לקבל אישור מהדפדפן
            const playPromise = snapSound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    snapSound.pause(); // עצור מיד
                    snapSound.currentTime = 0;
                    if (!audioEnabled) {
                         console.log("[Sound Test] Audio context unlocked!");
                         audioEnabled = true;
                    }
                    button.textContent = 'צליל תקין ✓';
                    button.style.backgroundColor = '#5cb85c'; button.classList.add('success');
                    button.disabled = true;
                    // השמע את הצליל שוב לבדיקה סופית
                    playSnapSound();
                    setTimeout(() => { button.style.opacity = '0'; setTimeout(() => button.remove(), 500); }, 2500);
                }).catch(error => {
                    console.warn('[Sound Test] Audio unlock/play failed:', error.name, error.message);
                    button.textContent = 'שמע נכשל/חסום';
                    button.style.backgroundColor = '#d9534f'; button.classList.add('fail');
                    button.title = 'לא ניתן להפעיל שמע. נסה לרענן או לבדוק הגדרות דפדפן.';
                    // אל תסיר את הכפתור, אולי לחיצה אחרת תעבוד
                });
            } else {
                console.warn('[Sound Test] snapSound.play() did not return a promise. Audio might be blocked.');
                button.textContent = 'שגיאת שמע';
                button.style.backgroundColor = '#d9534f'; button.classList.add('fail');
             }
        });

        document.body.appendChild(button);
        if (CONFIG.DEBUG) console.log('Sound test button added.');
    } catch (err) {
        console.error('Error adding sound test button:', err);
    }
}

  // ========================================================================
  // השמעת צליל הצמדה
  // ========================================================================
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND) return; // בדיקה ראשונית

    if (!snapSound || !soundInitialized) {
        if (CONFIG.DEBUG) console.warn("[PlaySound] Sound not initialized.");
        return;
    }
    if (!audioEnabled) {
        if (CONFIG.DEBUG) console.warn("[PlaySound] Audio context not unlocked. Click the test button or interact with the page.");
        // אולי נציג שוב את כפתור הבדיקה אם הוא הוסר
         if (!document.getElementById('sound-test-button')) addSoundTestButton();
        return;
    }

    try {
      snapSound.currentTime = 0; // אפס תמיד לפני הפעלה
      const playPromise = snapSound.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // נפוץ: AbortError אם לוחצים מהר מדי. נתעלם ממנו.
          if (error.name !== 'AbortError' && CONFIG.DEBUG) {
             console.warn('[PlaySound] Error playing sound:', error);
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
      removeDetachMenu(); // נקה תפריט קודם

      const menu = document.createElement('div');
      menu.id = 'detach-menu';
      // מיקום חכם יותר
      const menuWidth = 120;
      const menuHeight = 40;
      menu.style.left = Math.min(x, window.innerWidth - menuWidth - 10) + 'px';
      menu.style.top = Math.min(y, window.innerHeight - menuHeight - 10) + 'px';

      const detachOption = document.createElement('div');
      detachOption.textContent = 'נתק בלוק';
      detachOption.onclick = (e) => {
          e.stopPropagation();
          detachBlock(block, true); // נתק עם אנימציה
          removeDetachMenu();
      };

      menu.appendChild(detachOption);
      document.body.appendChild(menu);

      // סגירה בלחיצה מחוץ לתפריט
      setTimeout(() => {
          document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
          document.addEventListener('contextmenu', closeMenuOutside, { capture: true, once: true });
      }, 50);
  }

  function closeMenuOutside(e) {
      const menu = document.getElementById('detach-menu');
      if (menu && !menu.contains(e.target)) {
          removeDetachMenu();
      } else if (menu) { // אם הקליק היה בתוך התפריט, צריך להאזין שוב
           document.removeEventListener('click', closeMenuOutside, { capture: true });
           document.removeEventListener('contextmenu', closeMenuOutside, { capture: true });
           setTimeout(() => { // הוסף מחדש את המאזינים
               document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
               document.addEventListener('contextmenu', closeMenuOutside, { capture: true, once: true });
           }, 0);
      }
  }

  function removeDetachMenu() {
      const menu = document.getElementById('detach-menu');
      if (menu) {
          document.removeEventListener('click', closeMenuOutside, { capture: true });
          document.removeEventListener('contextmenu', closeMenuOutside, { capture: true });
          menu.remove();
      }
  }

  function detachBlock(blockToDetach, animate = true) {
    if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) {
        if(CONFIG.DEBUG) console.log(`[Detach] Block ${blockToDetach?.id} not connected or invalid.`);
        return;
    }

    const targetId = blockToDetach.getAttribute('data-connected-to');
    const connectionDirection = blockToDetach.getAttribute('data-connection-direction'); // How source was connected to target
    const connectedBlock = document.getElementById(targetId);

    if(CONFIG.DEBUG) console.log(`[Detach] Detaching ${blockToDetach.id} from ${targetId || 'unknown target'} (direction=${connectionDirection})`);

    // Remove connection attributes from the source block
    blockToDetach.removeAttribute('data-connected-to');
    blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block');

    // Remove connection attributes from the target block
    if (connectedBlock) {
        // Determine which attribute to remove based on how source was connected
        const attributeToRemove = connectionDirection === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
        connectedBlock.removeAttribute(attributeToRemove);
        // Check if the target block still has any connections
        if (!connectedBlock.hasAttribute('data-connected-from-left') && !connectedBlock.hasAttribute('data-connected-from-right')) {
            connectedBlock.classList.remove('has-connected-block');
        }
         if(CONFIG.DEBUG) console.log(`[Detach] Removed connection attribute '${attributeToRemove}' from target ${targetId}`);
    } else {
        if(CONFIG.DEBUG) console.warn(`[Detach] Target block with ID ${targetId} not found during detach.`);
    }

    if (animate) {
        addDetachEffectAnimation(blockToDetach);
        // playDetachSound(); // הפעל צליל ניתוק אם קיים
    }

    removeDetachMenu(); // סגור תפריט אם פתוח
  }

  // ========================================================================
  // פונקציות עזר לאנימציה
  // ========================================================================
  function addSnapEffectAnimation(block) {
      if (!block) return;
      block.classList.remove('snap-animation');
      void block.offsetWidth; // Force reflow
      block.classList.add('snap-animation');
      // Remove class after animation duration (match CSS)
      setTimeout(() => {
          if(block) block.classList.remove('snap-animation');
      }, 250); // Match animation duration in CSS
  }

  function addDetachEffectAnimation(block) {
      if (!block) return;
      block.classList.remove('detach-animation');
      void block.offsetWidth;
      block.classList.add('detach-animation');
      setTimeout(() => {
         if (block) block.classList.remove('detach-animation');
      }, 300); // Match animation duration in CSS
  }

  // ========================================================================
  // יצירת ID ייחודי
  // ========================================================================
  function generateUniqueId(block) {
      if (block && block.id) return block.id;
      let prefix = 'block';
      if (block && block.dataset.category) {
          prefix = block.dataset.category.substring(0, 4);
      }
      // Use crypto.randomUUID if available, otherwise fallback
      let randomPart = window.crypto && window.crypto.randomUUID ?
                       crypto.randomUUID().split('-')[0] : // Use first part of UUID
                       Math.random().toString(36).substring(2, 9);
      let newId = `${prefix}-${randomPart}`;
      if(block) block.id = newId; // Set the ID on the element
      // if (CONFIG.DEBUG) console.log(`Generated unique ID: ${newId}`);
      return newId;
  }

})();
// --- END OF FILE linkageimproved.js ---
