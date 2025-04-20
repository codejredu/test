// --- START OF FILE linkageimproved.js ---
// --- Version 3.2.2: תיקון אפקט ההילה והצליל ---

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
  let soundLoadAttempted = false; // Track if we've tried to load the sound file

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 15, // הגדלנו מעט את הסף כדי שיהיה קל יותר להצמיד
    VERTICAL_ALIGN_THRESHOLD: 20, // עדיין קיים, אך החפיפה חשובה יותר
    VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות
    BLOCK_GAP: 0,
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8, // עוצמה מעט מופחתת כדי לא להבהיל
    SOUND_PATH: 'assets/sound/link.mp3', // **** נתיב לקובץ השמע ****
    DEBUG: true
  };

  // ========================================================================
  // הוספת סגנונות CSS - גרסה משופרת עם הילה בולטת
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) {
      document.getElementById('block-connection-styles').remove(); // הסר סגנונות קודמים אם קיימים
    }

    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* בלוק נגרר - הופכים עליון ומדגישים */
      .snap-source {
         box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4) !important; /* הוספנו !important ליתר ביטחון */
         transition: box-shadow 0.15s ease-out;
         cursor: grabbing !important;
         z-index: 1001 !important;
      }

      /* הילה צהובה סביב בלוק יעד פוטנציאלי - מודגשת מאוד */
      .snap-target {
        outline: 6px solid #FFC107 !important; /* צהוב בולט */
        outline-offset: 4px; /* הגדלת המרווח */
        box-shadow: 0 0 20px 8px rgba(255, 193, 7, 0.8) !important; /* צל מוגבר */
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important; /* חשוב שיהיה מתחת לנגרר */
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
      /* Show with opacity when display is block */
       .future-position-indicator.visible {
        display: block;
        opacity: 0.9;
      }

      /* סימון כיוון (פס צהוב בצד ימין/שמאל) - יותר בולט */
      .snap-target.snap-left::before { /* Target specific */
        content: '';
        position: absolute;
        left: -10px; /* הזזה החוצה */
        top: 10%; /* התאמה אנכית */
        bottom: 10%;
        width: 8px;
        background-color: #FFC107;
        border-radius: 2px;
        z-index: 1000;
        box-shadow: 0 0 10px 2px rgba(255, 193, 7, 0.8);
      }
      .snap-target.snap-right::after { /* Target specific */
        content: '';
        position: absolute;
        right: -10px; /* הזזה החוצה */
        top: 10%; /* התאמה אנכית */
        bottom: 10%;
        width: 8px;
        background-color: #FFC107;
        border-radius: 2px;
        z-index: 1000;
        box-shadow: 0 0 10px 2px rgba(255, 193, 7, 0.8);
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

      /* בלוקים מחוברים - אופציונלי להוספת אינדיקציה חזותית */
      .connected-block, .has-connected-block {
        /* Optional: Add subtle indicator for connected state if needed */
        /* box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); */
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
      #sound-test-button:hover {
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
        pointer-events: none; /* Prevent clicks during fade out */
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
    if (soundInitialized) return; // אל תאתחל שוב
    
    // נאפס שמע קיים אם יש כזה
    if (snapSound) {
      snapSound.pause();
      if (snapSound.parentNode) {
        snapSound.parentNode.removeChild(snapSound);
      }
      snapSound = null;
    }
    
    // סמן שניסינו לאתחל אודיו - למניעת ניסיונות חוזרים
    soundLoadAttempted = true;

    try {
      // נסה לטעון קובץ צליל חדש ישירות
      snapSound = new Audio(CONFIG.SOUND_PATH);
      snapSound.id = 'snap-sound-element';
      snapSound.preload = 'auto';
      snapSound.volume = CONFIG.SOUND_VOLUME;
      
      // מאזין לשגיאה 
      snapSound.addEventListener('error', function(e) {
        console.error(`Error loading audio file: ${CONFIG.SOUND_PATH}`, e);
        const button = document.getElementById('sound-test-button');
        if (button) {
          button.textContent = 'שגיאה בטעינת קובץ';
          button.classList.remove('success', 'loading');
          button.classList.add('error');
          button.style.backgroundColor = '#f44336';
          button.disabled = true;
        }
        // נטרל השמעת צלילים
        CONFIG.PLAY_SOUND = false;
        snapSound = null;
        soundInitialized = false;
      });

      // מאזין למצב מוכן
      snapSound.addEventListener('canplaythrough', function() {
        soundInitialized = true;
        if (CONFIG.DEBUG) console.log('Audio element initialized and ready to play.');
        const button = document.getElementById('sound-test-button');
        if (button && button.classList.contains('loading')) {
          button.textContent = 'בדוק צליל הצמדה';
          button.classList.remove('loading');
          button.disabled = false;
          button.style.backgroundColor = '#2196F3';
        }
      });

      // הוסף אלמנט לעמוד (חשוב לדפדפנים מסוימים)
      document.body.appendChild(snapSound);
      snapSound.style.display = 'none';

      if (CONFIG.DEBUG) console.log(`Audio element created, attempting to load: ${CONFIG.SOUND_PATH}`);
      
      // ניסיון התחלתי להשמיע צליל שקט כדי לאפשר ניגון עתידי
      setTimeout(function() {
        try {
          const originalVolume = snapSound.volume;
          snapSound.volume = 0.001; // כמעט שקט לחלוטין
          snapSound.play().then(function() {
            snapSound.pause();
            snapSound.currentTime = 0;
            snapSound.volume = originalVolume;
            audioContextAllowed = true;
            if (CONFIG.DEBUG) console.log("Initial audio permission granted!");
          }).catch(function(err) {
            snapSound.volume = originalVolume;
            if (CONFIG.DEBUG) console.log("Initial audio permission denied:", err.name);
          });
        } catch (err) {
          if (CONFIG.DEBUG) console.log("Error in initial audio permission attempt:", err);
        }
      }, 500);
      
    } catch (err) {
      console.error('Error initializing audio element:', err);
      CONFIG.PLAY_SOUND = false;
      snapSound = null;
      soundInitialized = false;
    }
  }

  // ========================================================================
  // הוספת כפתור בדיקת שמע - מעודכן לטפל במצב טעינה
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

      // קבע מצב התחלתי בהתאם למצב האתחול
      if (!snapSound) {
          button.textContent = 'אתחול שמע נכשל';
          button.classList.add('error');
          button.style.backgroundColor = '#f44336'; // אדום
          button.disabled = true;
      } else if (!soundInitialized) {
          button.textContent = 'טוען צליל...';
          button.classList.add('loading');
          button.style.backgroundColor = '#ff9800'; // כתום
          button.disabled = true; // יהפוך לזמין ב-canplaythrough
      } else {
          button.textContent = 'בדוק צליל הצמדה';
          button.style.backgroundColor = '#2196F3'; // כחול התחלתי
          button.disabled = false;
      }

      // סגנונות נוספים (כמו קודם)
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

      // אפקט מעבר עכבר
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

      // מאזין לחיצה
      button.addEventListener('click', function() {
        if (this.disabled) {
            console.warn('Sound test button clicked but is disabled.');
            return;
        }
        
        if (!snapSound) {
            console.warn('Sound test clicked but audio not ready.');
            // נסה לאתחל מחדש
            button.textContent = 'מנסה לטעון צליל...';
            button.classList.add('loading');
            button.style.backgroundColor = '#ff9800'; // כתום
            initAudio(); // נסה לאתחל שוב
            return;
        }

        // נסה להפעיל את הצליל הגלובלי
        snapSound.currentTime = 0;
        snapSound.volume = CONFIG.SOUND_VOLUME;
        snapSound.play().then(() => {
          if (CONFIG.DEBUG) console.log('Sound test successful!');
          button.textContent = 'הצליל פועל ✓';
          button.classList.remove('error', 'loading');
          button.classList.add('success');
          button.style.backgroundColor = '#4CAF50'; // ירוק
          audioContextAllowed = true; // סמן אינטראקציה

          // העלם כפתור
          setTimeout(() => {
            button.classList.add('hidden');
            setTimeout(() => {
              button.remove();
            }, 500);
          }, 3000);

        }).catch(err => {
          console.warn('Sound test failed:', err);
          // אם השגיאה היא NotAllowedError, המשתמש צריך ללחוץ שוב
          if (err.name === 'NotAllowedError') {
              button.textContent = 'שמע חסום - לחץ שוב';
              button.classList.remove('success', 'loading');
              button.classList.add('error');
              button.style.backgroundColor = '#f44336'; // אדום
              audioContextAllowed = false; // נשאר לא מאופשר
          } else {
              // שגיאה אחרת (למשל, קובץ פגום שהצליח להיטען חלקית)
              button.textContent = 'שגיאת נגינה';
              button.classList.remove('success', 'loading');
              button.classList.add('error');
              button.style.backgroundColor = '#f44336'; // אדום
              button.disabled = true; // נטרל במקרה של שגיאה לא צפויה
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
    // בדוק אם השמע מופעל, מאותחל, והאלמנט קיים
    if (!CONFIG.PLAY_SOUND || !snapSound) {
      if (CONFIG.DEBUG && CONFIG.PLAY_SOUND && !snapSound) {
          console.log(`Snap sound skipped: audio enabled but snapSound is null/undefined`);
      }
      return;
    }
    
    // תמיד נסה להפעיל את הצליל, גם אם לא אישרו עדיין
    try {
      // החזר את הצליל להתחלה לפני ניגון
      snapSound.currentTime = 0;
      
      // ודא שעוצמת השמע נכונה
      snapSound.volume = CONFIG.SOUND_VOLUME;
      
      // נגן עם קצת השהיה כדי לתת לאירועי ה-DOM להתעדכן קודם
      setTimeout(function() {
        snapSound.play().then(() => {
          // הצליל נוגן בהצלחה
          audioContextAllowed = true;
          soundInitialized = true;
          if (CONFIG.DEBUG) console.log('Snap sound played successfully!');
        }).catch(err => {
          if (err.name === 'NotAllowedError') {
            if (CONFIG.DEBUG) console.warn('Snap sound blocked by browser. User interaction needed first.');
            // לא עושים דבר מעבר לזה, כי אנחנו לא רוצים להפריע לחווית המשתמש עם הודעות שגיאה
          } else {
            if (CONFIG.DEBUG) console.error('Error playing snap sound:', err);
          }
        });
      }, 10);
    } catch (err) {
      if (CONFIG.DEBUG) console.error('Unexpected error trying to play snap sound:', err);
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
    // אפשר גרירה לתוך האזור (עבור בלוקים מהפאנל)
    programmingArea.addEventListener('dragover', (e) => {
      e.preventDefault(); // Allow dropping onto the area
    });

    // מנע את התנהגות הגרירה המובנית של הדפדפן עבור בלוקים שכבר באזור
    programmingArea.addEventListener('dragstart', (e) => {
        if (e.target && e.target.closest && e.target.closest('#program-blocks .block-container')) {
            if (CONFIG.DEBUG) console.log("Preventing default dragstart for internal block.");
            e.preventDefault();
        }
    });
    
    // נוסיף גם מאזין קליק כללי להתרת אודיו
    programmingArea.addEventListener('click', () => {
        // אם יש צליל אך הוא לא עדיין מאושר, נסה "אילוץ" אישור בקליק
        if (snapSound && !audioContextAllowed) {
            if (CONFIG.DEBUG) console.log("User clicked programming area, trying to enable audio...");
            // הפעלה שקטה לאישור
            const tempVol = snapSound.volume;
            snapSound.volume = 0.01; // כמעט שקט
            snapSound.play().then(() => {
                snapSound.pause();
                snapSound.currentTime = 0;
                snapSound.volume = tempVol;
                audioContextAllowed = true;
                if (CONFIG.DEBUG) console.log("Audio context allowed after programming area click");
            }).catch(err => {
                if (CONFIG.DEBUG) console.log("Still not allowed after click:", err.name);
                snapSound.volume = tempVol;
            });
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
            // בדוק אם זה אלמנט בלוק ישירות או בתוך קונטיינר
            if (node.nodeType === 1) {
                let block = null;
                if (node.classList && node.classList.contains('block-container')) {
                    block = node;
                } else if (node.querySelector && node.querySelector('.block-container')) {
                    // Sometimes blocks might be added wrapped in another div
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
      // ודא שאין מאזינים כפולים - חשוב לא להכפיל
      block.removeEventListener('mousedown', handleMouseDown);
      block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu);
      block.addEventListener('contextmenu', handleContextMenu);
      
      // הוסף מאזין קליק להפעלת שמע במקרה הצורך
      block.removeEventListener('click', enableAudioContext);
      block.addEventListener('click', enableAudioContext);
  }
  
  // פונקציה להפעלת הקשר אודיו
  function enableAudioContext(e) {
    // אם יש קליק על בלוק, זה הזדמנות להתיר אודיו
    if (snapSound && !audioContextAllowed && CONFIG.PLAY_SOUND) {
        if (CONFIG.DEBUG) console.log("User clicked block, trying to enable audio...");
        // הפעלה שקטה לאישור
        const tempVol = snapSound.volume;
        snapSound.volume = 0.01; // כמעט שקט
        snapSound.play().then(() => {
            snapSound.pause();
            snapSound.currentTime = 0;
            snapSound.volume = tempVol;
            audioContextAllowed = true;
            if (CONFIG.DEBUG) console.log("Audio context allowed after block click");
        }).catch(err => {
            if (CONFIG.DEBUG) console.log("Still not allowed after block click:", err.name);
            snapSound.volume = tempVol;
        });
    }
  }

  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק
  // ========================================================================
  function handleMouseDown(e) {
      // רק לחיצה שמאלית, ורק על הבלוק עצמו או רכיב פנימי שלו (לא כפתור בתוכו למשל)
      if (e.button !== 0 || !e.target.closest) return;
       // המנע מגרירה אם לחצו על אלמנט אינטראקטיבי בתוך הבלוק (כמו input, button, select)
      if (e.target.matches('input, button, select, textarea, a[href]')) {
        if (CONFIG.DEBUG > 1) console.log("[MouseDown] Ignored on interactive element:", e.target.tagName);
        return;
      }

      const block = e.target.closest('.block-container');
      if (!block || !block.parentElement || block.parentElement.id !== 'program-blocks') return; // ודא שהבלוק באזור הנכון

      if (!block.id) generateUniqueId(block);

      // מנע התנהגות ברירת מחדל שעשויה להפריע (כמו גרירת טקסט)
      e.preventDefault();
      block.draggable = false; // נטרל גרירת דפדפן סטנדרטית למניעת התנגשות

      if (CONFIG.DEBUG) console.log(`[MouseDown] Started for block: ${block.id}`);

      // אם הבלוק מחובר, נתק אותו לפני תחילת הגרירה
      // בדוק אם הבלוק מחובר *לבלוק אחר* (כלומר, הוא ה"מקור" של חיבור)
      if (block.hasAttribute('data-connected-to')) {
          if (CONFIG.DEBUG) console.log(`[MouseDown] Block ${block.id} was connected TO another block, detaching...`);
          detachBlock(block, false); // נתק בלי אנימציה (מיידי)
      }
      // בדוק אם בלוק אחר מחובר *אל* הבלוק הזה (הוא "יעד")
      const connectedFromLeftId = block.getAttribute('data-connected-from-left');
      if (connectedFromLeftId) {
          const blockFromLeft = document.getElementById(connectedFromLeftId);
          if (blockFromLeft) {
              if (CONFIG.DEBUG) console.log(`[MouseDown] Block ${blockFromLeft.id} was connected FROM LEFT to ${block.id}, detaching ${blockFromLeft.id}...`);
              detachBlock(blockFromLeft, false);
          } else {
              console.warn(`[MouseDown] Could not find connected block ${connectedFromLeftId} to detach from left of ${block.id}`);
              block.removeAttribute('data-connected-from-left'); // Clean up dangling attribute
          }
      }
      const connectedFromRightId = block.getAttribute('data-connected-from-right');
      if (connectedFromRightId) {
          const blockFromRight = document.getElementById(connectedFromRightId);
           if (blockFromRight) {
               if (CONFIG.DEBUG) console.log(`[MouseDown] Block ${blockFromRight.id} was connected FROM RIGHT to ${block.id}, detaching ${blockFromRight.id}...`);
               detachBlock(blockFromRight, false);
           } else {
               console.warn(`[MouseDown] Could not find connected block ${connectedFromRightId} to detach from right of ${block.id}`);
               block.removeAttribute('data-connected-from-right'); // Clean up dangling attribute
           }
      }

      // --- כעת בטוח להתחיל גרירה של הבלוק הזה ---
      currentDraggedBlock = block;
      isDraggingBlock = true;

      // חשב אופסט יחסית לבלוק עצמו
      const rect = block.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // ודא שהבלוק ממוקם אבסולוטית *בתוך* אזור התכנות
      const parentElement = document.getElementById('program-blocks');
      const parentRect = parentElement.getBoundingClientRect();

      // קבע מיקום אבסולוטי ראשוני מדויק בהתאם למיקום הנוכחי
      // רק אם הוא לא כבר אבסולוטי (למשל, אם היה סטטי או relative)
      if (window.getComputedStyle(block).position !== 'absolute') {
        block.style.position = 'absolute';
        block.style.left = (rect.left - parentRect.left + parentElement.scrollLeft) + 'px';
        block.style.top = (rect.top - parentRect.top + parentElement.scrollTop) + 'px';
        block.style.margin = '0'; // נטרל margin אם היה קיים
      } else {
        // אם הוא כבר אבסולוטי, אין צורך לחשב מחדש את המיקום לפי ה-viewport,
        // אבל כן כדאי לוודא שה-margin מאופס למקרה שסגנון אחר הוסיף אותו.
        block.style.margin = '0';
      }


      // סגנונות ויזואליים לגרירה
      block.style.zIndex = '1001'; // מעל בלוקים אחרים
      block.classList.add('snap-source'); // סגנון לבלוק נגרר
      document.body.classList.add('user-select-none'); // מנע בחירת טקסט

      if (CONFIG.DEBUG) console.log(`[MouseDown] Initial drag setup: left=${block.style.left}, top=${block.style.top}, zIndex=${block.style.zIndex}`);
