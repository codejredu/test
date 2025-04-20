// --- START OF FILE linkageimproved.js ---
// --- Version 3.2: Using external MP3 sound file ---

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
    if (document.getElementById('block-connection-styles')) return;

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
        transition: all 0.1s ease-out;
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

    try {
      // בדוק אם כבר קיים אלמנט (למקרה של ריצה חוזרת)
      const existingAudio = document.getElementById('snap-sound-element');
      if (existingAudio) {
          snapSound = existingAudio;
          soundInitialized = true;
          if (CONFIG.DEBUG) console.log('Audio element already exists and reused.');
          // ודא שהמקור הנכון טעון
          if (!snapSound.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)) {
               if (CONFIG.DEBUG) console.log('Audio element exists but needs updated source.');
               snapSound.innerHTML = ''; // נקה מקורות קודמים
               const source = document.createElement('source');
               source.src = CONFIG.SOUND_PATH;
               source.type = 'audio/mpeg';
               snapSound.appendChild(source);
               snapSound.load(); // טען מחדש
          }
          return;
      }

      // צור אלמנט אודיו גלובלי חדש
      snapSound = document.createElement('audio');
      snapSound.id = 'snap-sound-element';
      snapSound.preload = 'auto'; // בקש מהדפדפן לטעון מראש
      snapSound.volume = CONFIG.SOUND_VOLUME;

      // הוסף מקור MP3 חיצוני
      const source = document.createElement('source');
      source.src = CONFIG.SOUND_PATH;
      source.type = 'audio/mpeg'; // MIME type for MP3
      snapSound.appendChild(source);

      // הוסף הודעה למשתמש אם הקובץ לא נטען
      snapSound.addEventListener('error', (e) => {
        console.error(`Error loading audio file: ${CONFIG.SOUND_PATH}`, e);
        // עדכן כפתור בדיקה אם קיים
        const button = document.getElementById('sound-test-button');
        if (button) {
            button.textContent = 'שגיאה בטעינת קובץ';
            button.classList.remove('success', 'loading');
            button.classList.add('error');
            button.style.backgroundColor = '#f44336';
            button.disabled = true; // נטרל את הכפתור
        }
        // נטרל השמעת צלילים
        CONFIG.PLAY_SOUND = false;
        snapSound = null; // שחרר את האובייקט הלא תקין
        soundInitialized = false; // סמן כשלון באתחול
      });

       // אירוע המציין שהדפדפן יכול להתחיל לנגן (לא בהכרח כל הקובץ נטען)
      snapSound.addEventListener('canplaythrough', () => {
          soundInitialized = true; // סמן שהשמע מוכן
          if (CONFIG.DEBUG) console.log('Audio element initialized and ready to play.');
          // עדכן כפתור בדיקה אם קיים והוא במצב טעינה
          const button = document.getElementById('sound-test-button');
          if (button && button.classList.contains('loading')) {
              button.textContent = 'בדוק צליל הצמדה';
              button.classList.remove('loading');
              button.disabled = false;
              button.style.backgroundColor = '#2196F3'; // החזר לצבע ברירת מחדל
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
        if (this.disabled || !snapSound || !soundInitialized) {
            console.warn('Sound test clicked but audio not ready or disabled.');
            return;
        }

        // נסה להפעיל את הצליל הגלובלי
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

          // החזר את הצליל להתחלה
          if(snapSound) { // Check again in case it became null due to an error
            snapSound.pause();
            snapSound.currentTime = 0;
          }

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
    if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) {
      if (CONFIG.DEBUG && CONFIG.PLAY_SOUND && (!snapSound || !soundInitialized)) {
          console.log(`Snap sound skipped: audio enabled but not ready (snapSound: ${!!snapSound}, initialized: ${soundInitialized})`);
      }
      return;
    }

    // אזהרה אם מנסים לנגן לפני אינטראקציה (הבדיקה עשויה להיות מיותרת אם הכפתור הצליח)
    if (!audioContextAllowed) {
        if (CONFIG.DEBUG) console.warn('Attempting to play sound before confirmed user interaction. Might be blocked.');
    }

    try {
      // ודא שאנחנו לא מנסים לנגן אם עדיין טוען או במצב שגיאה
      if (snapSound.readyState < 3) { // HAVE_FUTURE_DATA or more is needed
          if (CONFIG.DEBUG) console.log('Snap sound skipped: audio data not yet available.');
          return;
      }

      snapSound.pause();
      // השימוש ב-currentTime = 0 עובד טוב יותר אחרי שהקובץ נטען במלואו או חלקית
      // אם הקובץ עדיין זורם, זה עלול לא לעבוד כצפוי, אבל preload='auto' אמור לעזור
      snapSound.currentTime = 0;

      // הפעלת הצליל מחזירה Promise
      const playPromise = snapSound.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          // הצליל נוגן בהצלחה
          audioContextAllowed = true; // אשר אינטראקציה מוצלחת
          if (CONFIG.DEBUG > 1) console.log('Snap sound played.'); // פחות מפורט
        }).catch(err => {
          // טיפול בשגיאות נפוצות
          if (err.name === 'NotAllowedError') {
            // הכי סביר - דרושה אינטראקציה מהמשתמש
            console.warn('Snap sound blocked by browser policy. User interaction needed.');
            audioContextAllowed = false; // נשאר לא מאופשר
            // אפשר לנסות להציג שוב את כפתור הבדיקה אם הוא הוסר
             if (!document.getElementById('sound-test-button')) {
                addSoundTestButton();
             }
          } else if (err.name === 'AbortError') {
            // קריאה מהירה נוספת ל-play קטעה את הקודמת - לא בהכרח שגיאה
            if (CONFIG.DEBUG > 1) console.log('Snap sound playback aborted (likely due to rapid interaction).');
          } else {
            // שגיאה אחרת
            console.error('Error playing snap sound:', err);
          }
        });
      }
    } catch (err) {
      // שגיאה סינכרונית (פחות סביר עם <audio>, יותר רלוונטי ל-Web Audio API)
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
  }

  // ========================================================================
  // טיפול בקליק ימני על בלוק
  // ========================================================================
  function handleContextMenu(e) {
      e.preventDefault(); // מנע תפריט הקשר רגיל
      const block = e.target.closest('.block-container');
      // הצג תפריט ניתוק רק אם הבלוק מחובר *לבלוק אחר*
      if (block && block.hasAttribute('data-connected-to')) {
          showDetachMenu(e.clientX, e.clientY, block);
      }
  }

  // ========================================================================
  // מאזינים גלובליים לתנועה ושחרור עכבר
  // ========================================================================
  function initGlobalMouseListeners() {
    // ודא שאין מאזינים כפולים מהפעלה קודמת
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseLeave);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // טיפול בעזיבת חלון הדפדפן - חשוב לשחרור נכון
    document.addEventListener('mouseleave', handleMouseLeave);
  }

  // פונקציה נפרדת לטיפול בעזיבת החלון
  function handleMouseLeave(e) {
      // בדוק אם העכבר יצא מהחלון כולו (e.relatedTarget === null) בזמן גרירה
      if (isDraggingBlock && e.target === document.documentElement && !e.relatedTarget) {
          if (CONFIG.DEBUG) console.warn("Mouse left document during drag, treating as mouseup.");
          handleMouseUp(e); // סיים את הגרירה כאילו שוחרר העכבר
      }
  }

  // ========================================================================
  // טיפול בתנועת העכבר בזמן גרירה
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    // מנע התנהגות ברירת מחדל נוספת
    e.preventDefault();

    const parentElement = document.getElementById('program-blocks');
    if (!parentElement) {
        console.error("Programming area not found during mouse move!");
        handleMouseUp(e); // בטל גרירה אם ההורה נעלם
        return;
    }

    const parentRect = parentElement.getBoundingClientRect();

    // חשב מיקום חדש יחסי לאזור התכנות, כולל גלילה
    let newLeft = e.clientX - parentRect.left - dragOffset.x + parentElement.scrollLeft;
    let newTop = e.clientY - parentRect.top - dragOffset.y + parentElement.scrollTop;

    // הגבלת תנועה לגבולות אזור התכנות
    const blockWidth = currentDraggedBlock.offsetWidth;
    const blockHeight = currentDraggedBlock.offsetHeight;

    // ודא שמימדי האזור מתחשבים בגלילה
    const scrollWidth = parentElement.scrollWidth;
    const scrollHeight = parentElement.scrollHeight;

    // הגבל שמאל וימין
    newLeft = Math.max(0, newLeft); // לא קטן מ-0
    newLeft = Math.min(newLeft, scrollWidth - blockWidth); // לא גדול מרוחב הגלילה פחות רוחב הבלוק

    // הגבל למעלה ולמטה
    newTop = Math.max(0, newTop); // לא קטן מ-0
    newTop = Math.min(newTop, scrollHeight - blockHeight); // לא גדול מגובה הגלילה פחות גובה הבלוק

    // עיגול ליתר ביטחון למניעת שברי פיקסלים
    newLeft = Math.round(newLeft);
    newTop = Math.round(newTop);


    // עדכן מיקום הבלוק
    currentDraggedBlock.style.left = newLeft + 'px';
    currentDraggedBlock.style.top = newTop + 'px';

    // בדוק אפשרות הצמדה והצג הדגשות
    checkAndHighlightSnapPossibility();
  }

  // ========================================================================
  // טיפול בשחרור העכבר (סיום גרירה)
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock; // שמור הפניה לפני איפוס
    const targetToSnap = potentialSnapTarget; // שמור יעד פוטנציאלי
    const directionToSnap = snapDirection;   // שמור כיוון

    if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing block ${blockReleased.id}. Potential target: ${targetToSnap?.id || 'none'}, direction: ${directionToSnap || 'none'}`);

    // --- ניקוי מיידי של מצב הגרירה ---
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source');
    blockReleased.style.zIndex = ''; // חזור ל-z-index רגיל (או ברירת המחדל של CSS)

    // אפשר גרירה מובנית שוב (רק אם לא הוצמד - יטופל בהמשך)
    // blockReleased.draggable = true; // נעביר לתוך ההצמדה/אי-הצמדה

    // הסר את כל ההדגשות והאינדיקטורים מכל הבלוקים
    document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
      el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    removeFuturePositionIndicator();
    // --- סוף ניקוי ---


    // בצע הצמדה אם נמצא יעד מתאים
    if (targetToSnap && directionToSnap) {
      if (CONFIG.DEBUG) console.log(`[MouseUp] Performing snap operation.`);
      const snapSuccess = performBlockSnap(blockReleased, targetToSnap, directionToSnap);
      if (!snapSuccess) {
          // אם ההצמדה נכשלה מסיבה כלשהי, ודא שהבלוק עדיין ניתן לגרירה
           blockReleased.draggable = true;
           if (CONFIG.DEBUG) console.log(`[MouseUp] Snap failed, ensuring block ${blockReleased.id} is draggable.`);
      } else {
          // ההצמדה הצליחה, אין צורך ב-draggable=true כרגע,
          // כי אינטראקציה נוספת תתחיל מחדש את התהליך ותנתק אותו
          blockReleased.draggable = false; // מנע גרירת דפדפן בטעות על בלוק צמוד
          if (CONFIG.DEBUG) console.log(`[MouseUp] Snap successful, setting draggable=false for ${blockReleased.id}.`);
      }
    } else {
      if (CONFIG.DEBUG) console.log(`[MouseUp] No snap target found, block ${blockReleased.id} left at final drag position.`);
      // אין הצמדה, הבלוק נשאר חופשי, ודא שניתן לגרור אותו שוב
      blockReleased.draggable = true;
    }

    if (CONFIG.DEBUG) console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
  }

  // ========================================================================
  // בדיקת הצמדה והדגשה - משופר
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    // סנן בלוקים שאינם גלויים (למשל, display:none) או את הבלוק הנגרר עצמו
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null);

    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1; // התחל עם ערך גדול מהסף

    // איפוס הדגשות קודמות ויעד פוטנציאלי
    document.querySelectorAll('.snap-target').forEach(el => {
        el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    potentialSnapTarget = null;
    snapDirection = null;
    removeFuturePositionIndicator(); // הסתר מחוון כחול

    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      const targetRect = targetBlock.getBoundingClientRect();

      // חשוב: בדוק שהיעד עצמו אינו כבר מחובר *באותו צד* שאנחנו מנסים להתחבר אליו
      // לדוגמה, אי אפשר לחבר שני בלוקים לצד ימין של אותו בלוק מטרה.
      const targetAlreadyConnectedOnLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetAlreadyConnectedOnRight = targetBlock.hasAttribute('data-connected-from-right');

      const snapInfo = calculateSnapInfo(sourceRect, targetRect);

      if (snapInfo && snapInfo.distance < minDistance) {
         // בדוק אם החיבור המוצע אפשרי מבחינת חיבורים קיימים של המטרה
         let connectionAllowed = true;
         if (snapInfo.direction === 'left' && targetAlreadyConnectedOnLeft) {
             connectionAllowed = false; // מנסים להתחבר משמאל למטרה שכבר מחוברת משמאל
             if (CONFIG.DEBUG > 1) console.log(`[Highlight] Snap to left of ${targetBlock.id} blocked: Target already has connection on left.`);
         } else if (snapInfo.direction === 'right' && targetAlreadyConnectedOnRight) {
             connectionAllowed = false; // מנסים להתחבר מימין למטרה שכבר מחוברת מימין
              if (CONFIG.DEBUG > 1) console.log(`[Highlight] Snap to right of ${targetBlock.id} blocked: Target already has connection on right.`);
         }

         if (connectionAllowed) {
             // מצאנו התאמה טובה יותר ומותרת
             minDistance = snapInfo.distance;
             bestTarget = targetBlock;
             bestDirection = snapInfo.direction;
         }
      }
    }

    // אם מצאנו יעד מתאים בטווח
    if (bestTarget) {
      if (CONFIG.DEBUG > 1) console.log(`[Highlight] Potential snap: ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}), dist: ${minDistance.toFixed(1)}px`);

      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;

      // הוסף הדגשה ליעד
      bestTarget.classList.add('snap-target');
      bestTarget.classList.add(snapDirection === 'left' ? 'snap-left' : 'snap-right'); // הוסף מחלקת כיוון

      // הצג מחוון מיקום עתידי
      const programRect = programmingArea.getBoundingClientRect();
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programRect);
    }
  }

  // ========================================================================
  // חישוב מידע על הצמדה אפשרית - כולל בדיקת חפיפה אנכית
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) {
    // 1. בדיקת חפיפה אנכית מינימלית
    const topOverlap = Math.max(sourceRect.top, targetRect.top);
    const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);

    // דרישת חפיפה מבוססת על הגובה הקטן מבין השניים
    const minHeightForOverlapCheck = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;

    // ודא שיש חפיפה מספקת (ולא רק גובה 0)
    if (verticalOverlap < minHeightForOverlapCheck || verticalOverlap <= 0) {
      // if (CONFIG.DEBUG > 1) console.log(`[CalcSnap] No snap: Insufficient vertical overlap (${verticalOverlap.toFixed(1)}px < ${minHeightForOverlapCheck.toFixed(1)}px)`);
      return null;
    }

    // 2. בדיקת מרחק אופקי בין הצדדים הרלוונטיים
    let distance;
    let direction;

    // מרחק בין צד ימין של המקור לשמאל של היעד
    const distRightToLeft = Math.abs(sourceRect.right - targetRect.left);
    // מרחק בין צד שמאל של המקור לימין של היעד
    const distLeftToRight = Math.abs(sourceRect.left - targetRect.right);

    // בחר את הכיוון עם המרחק הקטן ביותר
    if (distRightToLeft < distLeftToRight) {
        // מקרה פוטנציאלי: המקור יתחבר משמאל ליעד
        distance = distRightToLeft;
        direction = 'left'; // המקור יהיה משמאל ליעד (right of source -> left of target)
    } else {
        // מקרה פוטנציאלי: המקור יתחבר מימין ליעד
        distance = distLeftToRight;
        direction = 'right'; // המקור יהיה מימין ליעד (left of source -> right of target)
    }

    // בדוק אם המרחק המינימלי בטווח ההצמדה המותר
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
       if (CONFIG.DEBUG > 1) console.log(`[calculateSnapInfo] Possible connection: direction=${direction}, distance=${distance.toFixed(2)}px, vertical overlap=${verticalOverlap.toFixed(1)}px`);
      // החזר את הכיוון (איפה המקור יהיה יחסית ליעד) ואת המרחק
      return { direction, distance };
    }

    // אם לא נמצאה התאמה
    // if (CONFIG.DEBUG > 1) console.log(`[CalcSnap] No snap: Distance too large (${distance.toFixed(1)}px > ${CONFIG.CONNECT_THRESHOLD}px)`);
    return null;
  }


  // ========================================================================
  // ביצוע ההצמדה הפיזית ועדכון מצב
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock) {
      console.error("[performBlockSnap] Error: Invalid block(s) provided.");
      return false;
    }
    // ודא שהיעד לא נעלם בינתיים
    if (!document.body.contains(targetBlock) || targetBlock.offsetParent === null) {
        console.warn(`[PerformSnap] Target block ${targetBlock.id} is no longer valid or visible. Snap cancelled.`);
        return false;
    }
    // ודא שהיעד עדיין פנוי בצד הרלוונטי (מישהו אחר אולי הספיק להתחבר?)
    if (direction === 'left' && targetBlock.hasAttribute('data-connected-from-left')) {
        console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} now has a connection on the left.`);
        return false;
    }
    if (direction === 'right' && targetBlock.hasAttribute('data-connected-from-right')) {
         console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} now has a connection on the right.`);
        return false;
    }


    if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);

    try {
      // קבל מימדים עדכניים רגע לפני ההצמדה
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const parentElement = document.getElementById('program-blocks');
      const parentRect = parentElement.getBoundingClientRect();

      // חישוב מיקום אופקי סופי (מדויק, ללא רווח)
      let finalLeft;
      if (direction === 'left') { // מקור משמאל ליעד
        finalLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
      } else { // מקור מימין ליעד (direction === 'right')
        finalLeft = targetRect.right + CONFIG.BLOCK_GAP;
      }

      // חישוב מיקום אנכי סופי (יישור לחלק העליון של היעד - ניתן לשנות אם רוצים יישור אחר)
      const finalTop = targetRect.top;

      // המרה לערכי style יחסיים להורה (אזור התכנות) כולל גלילה
      let styleLeft = finalLeft - parentRect.left + parentElement.scrollLeft;
      let styleTop = finalTop - parentRect.top + parentElement.scrollTop;

      // עיגול למניעת שגיאות עיגול קטנות
      styleLeft = Math.round(styleLeft);
      styleTop = Math.round(styleTop);

      // החל את המיקום החדש על הבלוק הנגרר (המקור)
      sourceBlock.style.position = 'absolute'; // ודא שזה נשאר אבסולוטי
      sourceBlock.style.left = `${styleLeft}px`;
      sourceBlock.style.top = `${styleTop}px`;
      sourceBlock.style.margin = '0'; // אפס margin

      // עדכן מאפייני נתונים לציון החיבור
      // המקור מחובר אל היעד
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      // המקור מחובר בכיוון מסוים יחסית ליעד (left=משמאל ליעד, right=מימין ליעד)
      sourceBlock.setAttribute('data-connection-direction', direction);
      // היעד מחובר *מ*כיוון מסוים *על ידי* המקור
      targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);

      // הוסף קלאסים לסימון ויזואלי (אופציונלי)
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');

      // השמע צליל הצמדה
      playSnapSound();

      // הוסף אנימציית הצמדה ויזואלית
      addSnapEffectAnimation(sourceBlock);

      // מנע גרירה מובנית מהבלוק המחובר כעת
      sourceBlock.draggable = false;

      if (CONFIG.DEBUG) console.log(`[PerformSnap] Snap successful. ${sourceBlock.id} positioned at left=${styleLeft}px, top=${styleTop}px`);
      return true;

    } catch (err) {
      console.error(`[PerformSnap] Error during snap operation for ${sourceBlock.id} -> ${targetBlock.id}:`, err);
      // נסה להחזיר את הבלוק למצב לא מחובר אם הייתה שגיאה
      try {
        detachBlock(sourceBlock, false); // נתק ללא אנימציה
      } catch (detachErr) {
         console.error(`[PerformSnap] Error during cleanup detach:`, detachErr);
         // נקה מאפיינים ידנית במקרה קיצון
         sourceBlock.removeAttribute('data-connected-to');
         sourceBlock.removeAttribute('data-connection-direction');
         sourceBlock.classList.remove('connected-block');
         if (targetBlock) {
             targetBlock.removeAttribute(`data-connected-from-${direction}`);
             // השארת has-connected-block עדיפה על הסרה שגויה
         }
      }
      sourceBlock.draggable = true; // אפשר גרירה מחדש
      return false;
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
        futureIndicator.className = 'future-position-indicator'; // Use class for styling
        programmingArea.appendChild(futureIndicator);
        if (CONFIG.DEBUG > 1) console.log('Created future position indicator.');
    }

    try {
        // קבל מימדים עדכניים של הבלוק הנגרר
        const sourceRectNow = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        const parentRect = programmingArea.getBoundingClientRect();

        // חשב מיקום עתידי תיאורטי (זהה לחישוב ב-performBlockSnap)
        let desiredViewportLeft, desiredViewportTop;
        desiredViewportTop = targetRect.top; // יישור עליון

        if (direction === 'left') {
            // חשוב להשתמש ברוחב *הנוכחי* של הבלוק הנגרר
            desiredViewportLeft = targetRect.left - sourceRectNow.width - CONFIG.BLOCK_GAP;
        } else { // direction === 'right'
            desiredViewportLeft = targetRect.right + CONFIG.BLOCK_GAP;
        }

        // המר למיקום יחסי לאזור התכנות
        let indicatorLeft = desiredViewportLeft - parentRect.left + programmingArea.scrollLeft;
        let indicatorTop = desiredViewportTop - parentRect.top + programmingArea.scrollTop;

        // החל סגנונות על המחוון
        futureIndicator.style.left = Math.round(indicatorLeft) + 'px';
        futureIndicator.style.top = Math.round(indicatorTop) + 'px';
        futureIndicator.style.width = Math.round(sourceRectNow.width) + 'px';
        futureIndicator.style.height = Math.round(sourceRectNow.height) + 'px';
        futureIndicator.classList.add('visible'); // Make it visible using CSS class

    } catch (err) {
        console.error('Error updating future position indicator:', err);
        removeFuturePositionIndicator(); // הסתר במקרה שגיאה
    }
  }

  // ========================================================================
  // הסרת מחוון מיקום עתידי
  // ========================================================================
  function removeFuturePositionIndicator() {
    if (futureIndicator) {
        futureIndicator.classList.remove('visible'); // Hide using CSS class
        // לא מסירים מה-DOM כדי לשמור על רפרנס, רק מסתירים
    }
  }


  // ========================================================================
  // פונקציות עזר לניתוק בלוקים (כולל תפריט קליק ימני)
  // ========================================================================
  function showDetachMenu(x, y, block) {
    removeDetachMenu(); // הסר תפריט קודם אם קיים

    const menu = document.createElement('div');
    menu.id = 'detach-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const detachOption = document.createElement('div');
    detachOption.textContent = 'נתק בלוק'; // טקסט לתפריט
    detachOption.onclick = function(event) {
        event.stopPropagation(); // מנע סגירה מיידית של התפריט
        detachBlock(block, true); // נתק עם אנימציה
        removeDetachMenu();
    };

    menu.appendChild(detachOption);
    document.body.appendChild(menu);

    // מאזין לסגירת התפריט בלחיצה מחוץ לו או גלילה
    setTimeout(() => { // setTimeout למניעת סגירה מיידית מהקליק שפתח אותו
        document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
        window.addEventListener('scroll', removeDetachMenu, { capture: true, once: true }); // סגור גם בגלילה
    }, 0);
  }

  function closeMenuOutside(e) {
    const menu = document.getElementById('detach-menu');
    // אם הקליק לא היה בתוך התפריט, הסר אותו
    if (menu && !menu.contains(e.target)) {
        removeDetachMenu();
    } else if (menu) {
        // אם הקליק היה בתוך התפריט אבל לא על אופציה (נדיר), הוסף מחדש את המאזין
        // כי ה-once:true הסיר אותו
         setTimeout(() => {
             document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
         }, 0);
    }
     // הסר את מאזין הגלילה אם התפריט נסגר או נשאר פתוח מהקליק
     window.removeEventListener('scroll', removeDetachMenu, { capture: true });
  }

  function removeDetachMenu() {
    const menu = document.getElementById('detach-menu');
    if (menu) {
        // הסר את המאזינים שהוספנו
        document.removeEventListener('click', closeMenuOutside, { capture: true });
        window.removeEventListener('scroll', removeDetachMenu, { capture: true });
        menu.remove();
    }
  }

  function detachBlock(blockToDetach, animate = true) {
    if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) {
        // This block is not the 'source' of a connection, nothing to detach *from* it.
        // It might be a 'target', but detaching happens from the source block.
        if (CONFIG.DEBUG > 1) console.log(`[Detach] Block ${blockToDetach?.id || 'unknown'} has no 'data-connected-to' attribute. No action needed.`);
        return;
    }

    const targetId = blockToDetach.getAttribute('data-connected-to');
    const direction = blockToDetach.getAttribute('data-connection-direction'); // 'left' or 'right'

    if (!targetId || !direction) {
        console.warn(`[Detach] Missing connection data ('data-connected-to' or 'data-connection-direction') on ${blockToDetach.id}. Attempting cleanup.`);
        // נקה בכל מקרה את המאפיינים מהמקור
        blockToDetach.removeAttribute('data-connected-to');
        blockToDetach.removeAttribute('data-connection-direction');
        blockToDetach.classList.remove('connected-block');
        // אפשר גרירה מחדש כי הוא חופשי כעת
        blockToDetach.draggable = true;
        return;
    }

    if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${blockToDetach.id} from target ${targetId} (direction: ${direction})`);

    // הסר את המאפיינים מהבלוק המנותק (המקור)
    blockToDetach.removeAttribute('data-connected-to');
    blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block');
    // אפשר גרירה מחדש של הבלוק שזה עתה נותק
    blockToDetach.draggable = true;


    // מצא את בלוק המטרה ונקה את הצד הרלוונטי שלו
    const targetBlock = document.getElementById(targetId);
    if (targetBlock) {
        // נקה את המאפיין שמצביע חזרה למקור
        targetBlock.removeAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right');

        // בדוק אם לבלוק המטרה נשארו חיבורים *כלשהם* (או שהוא מחובר בעצמו)
        const hasOtherConnections =
            targetBlock.hasAttribute('data-connected-from-left') ||
            targetBlock.hasAttribute('data-connected-from-right') ||
            targetBlock.hasAttribute('data-connected-to'); // אולי הוא מחובר *ל*בלוק אחר

        if (!hasOtherConnections) {
            targetBlock.classList.remove('has-connected-block');
             if (CONFIG.DEBUG > 1) console.log(`[Detach] Target ${targetId} no longer has any connections, removing 'has-connected-block' class.`);
        } else {
             if (CONFIG.DEBUG > 1) console.log(`[Detach] Target ${targetId} still has other connections.`);
        }
    } else {
        // זה לא אמור לקרות בדרך כלל, אבל כדאי לטפל
        console.warn(`[Detach] Target block ${targetId} for detached block ${blockToDetach.id} not found in the DOM.`);
    }

    // הוסף אנימציית ניתוק אם נדרש
    if (animate) {
        addDetachEffectAnimation(blockToDetach);
        // אפשר להוסיף כאן קריאה ל-playDetachSound() אם רוצים צליל ניתוק
    }

    if (CONFIG.DEBUG) console.log(`[Detach] Finished detaching ${blockToDetach.id}. Draggable: ${blockToDetach.draggable}`);
  }

  // ========================================================================
  // פונקציות עזר לאנימציה
  // ========================================================================
  function addSnapEffectAnimation(block) {
    block.classList.remove('snap-animation'); // הסר קודם למקרה שהאנימציה הקודמת לא הסתיימה
    void block.offsetWidth; // Trigger reflow/repaint - חשוב להפעלת אנימציה מחדש
    block.classList.add('snap-animation');
    // נקה את המחלקה בסיום האנימציה כדי לאפשר הפעלה חוזרת
    block.addEventListener('animationend', () => {
      block.classList.remove('snap-animation');
    }, { once: true });
  }

  function addDetachEffectAnimation(block) {
    block.classList.remove('detach-animation');
    void block.offsetWidth; // Trigger reflow
    block.classList.add('detach-animation');
     block.addEventListener('animationend', () => {
      block.classList.remove('detach-animation');
    }, { once: true });
  }

  // ========================================================================
  // יצירת ID ייחודי לבלוקים ללא ID
  // ========================================================================
  function generateUniqueId(block) {
    // אל תיצור ID אם כבר קיים אחד תקין
    if (block.id && typeof block.id === 'string' && block.id.trim() !== '') return block.id;

    const prefix = block.dataset.type || 'block'; // השתמש ב-data-type אם קיים
    // צור ID קצת יותר קריא ופחות אקראי מוחלט
    const uniqueSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    let attempt = 0;
    let uniqueId = `${prefix}-${uniqueSuffix}`;
    // ודא שה-ID באמת ייחודי בדף (במקרה מאוד נדיר של התנגשות)
    while (document.getElementById(uniqueId) && attempt < 10) {
        uniqueId = `${prefix}-${uniqueSuffix}-${attempt}`;
        attempt++;
    }
    if (attempt >= 10) {
       console.warn("Could not generate a guaranteed unique ID after 10 attempts for block, using timestamp fallback.");
       uniqueId = `${prefix}-${Date.now()}`;
    }

    block.id = uniqueId;
    if (CONFIG.DEBUG) console.log(`Generated ID for block: ${uniqueId}`);
    return uniqueId;
  }

  // ========================================================================
  // אתחול המערכת כולה
  // ========================================================================
  function initializeSystem() {
    if (window.blockLinkageInitialized) {
        if (CONFIG.DEBUG) console.log("Block linkage system already initialized. Skipping re-initialization.");
        return;
    }

    addHighlightStyles();           // הוסף סגנונות CSS
    initAudio();                    // אתחול אלמנט השמע (יטפל בטעינת הקובץ)
    initProgrammingAreaListeners(); // מאזינים לאזור הכללי
    observeNewBlocks();             // מאזין לבלוקים שנוספים דינמית
    initExistingBlocks();           // מאזינים לבלוקים שכבר קיימים בטעינה
    initGlobalMouseListeners();     // מאזיני עכבר גלובליים

    // הוסף כפתור בדיקת שמע (אם מופעל)
    // יוצג במצב "טעינה" אם הקובץ עוד לא מוכן
    if (CONFIG.PLAY_SOUND) {
        addSoundTestButton();
    }

    window.blockLinkageInitialized = true; // סמן שהאתחול בוצע
    console.log(`Block linkage system initialized (Version 3.2 - External MP3)`);
    console.log(`Configuration: Connect Threshold=${CONFIG.CONNECT_THRESHOLD}px, Vertical Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // הפעל את האתחול כשה-DOM מוכן או מיידית אם כבר מוכן
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
      // DOMContentLoaded already fired
      initializeSystem();
  }

})(); // סוף IIFE

// --- END OF FILE linkageimproved.js ---
