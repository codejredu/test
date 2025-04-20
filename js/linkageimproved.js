// --- START OF REVISED FILE linkageimproved.js ---

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

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 15, // הגדלנו מעט את הסף כדי שיהיה קל יותר להצמיד
    VERTICAL_ALIGN_THRESHOLD: 20, // עדיין קיים, אך החפיפה חשובה יותר
    VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות
    BLOCK_GAP: 0,
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8, // עוצמה מעט מופחתת כדי לא להבהיל
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
      #sound-test-button.hidden {
        opacity: 0;
        pointer-events: none; /* Prevent clicks during fade out */
      }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Highlighting and animation styles added/verified.');
  }

  // ========================================================================
  // אתחול מערכת השמע (מאוחד ופשוט יותר)
  // ========================================================================
  function initAudio() {
    if (!CONFIG.PLAY_SOUND) return;

    try {
      // בדוק אם כבר קיים
      if (document.getElementById('snap-sound-element')) {
          snapSound = document.getElementById('snap-sound-element');
          if (CONFIG.DEBUG) console.log('Audio element already exists.');
          return;
      }

      // צור אלמנט אודיו גלובלי אחד
      snapSound = document.createElement('audio');
      snapSound.id = 'snap-sound-element'; // ניתן ID ברור
      snapSound.preload = 'auto'; // טען מראש
      snapSound.volume = CONFIG.SOUND_VOLUME;

      // הוסף מקור Base64 (צליל קליק/הצמדה ברור)
      const source = document.createElement('source');
      // This is a short, distinct "click" sound
      source.src = 'data:audio/wav;base64,UklGRjQnAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRAnAACAgICAgICAgICAgICAgICAgICAgICAgICBgYGBgYGBgoKCgoKCg4ODg4ODhISEhISEhYWFhYWFhoaGhoaGh4eHh4eHiIiIiIiIiYmJiYmJioqKioqKi4uLi4uLjIyMjIyMjY2NjY2Njo6Ojo6Oj4+Pj4+PkJCQkJCQkZGRkZGRkpKSkpKSk5OTk5OTlJSUlJSUlZWVlZWVlpaWlpaWl5eXl5eXmJiYmJiYmZmZmZmZmpqampqam5ubm5ubnJycnJycnZ2dnZ2dnp6enp6en5+fn5+foKCgoKCgoaGhoaGhoqKioqKio6Ojo6Ojvb29u7u7ubm5t7e3tbW1s7OzsbGxr6+vrq6urKysqqqqqKiop6enpKSkpKSkpaWlpaWlpqamp6enqKioqampqqqqqqqqqampp6ennp6elZWVjIyMg4ODe3t7c3NzbW1taWlpZmZmZWVlZGRkZGRkY2NjYmJiYWFhYGBgX19fXl5eXV1dXFxcW1tbWlpaWVlZWFhYV1dXVlZWVVVVVFRUU1NTUlJSUVFRUFBQT09PTk5OTU1NTExMS0tLSkpKSUlJSEhIR0dHRkZGRUVFREREQ0NDQkJCQUFBQEBAQEBAQUFBQkJCQ0NDRERERUVFRkZGR0dHSEhISUlJSkpKS0tLTExMTU1NTk5OT09PUFBQUVFRUlJSU1NTVFRUVVVVVlZWV1dXWFhYWVlZWlpaW1tbXFxcXV1dXl5eX19fYGBgYWFhYmJiY2NjZGRkZWVlZmZmaWlpbW1tc3Nze3t7g4ODjIyMlZWVnp6ep6enqampqqqqqqqqqqqqq6urq6urrKysrKysra2tra2trq6urq6ur6+vr6+vsLCwsLCwsbGxsbGxs7Oztra2uLi4ubm5u7u7vb29v7+/wMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw';
      source.type = 'audio/wav'; // או mp3 אם מעדיפים
      snapSound.appendChild(source);

      // הוסף לעמוד (מוסתר)
      snapSound.style.display = 'none';
      document.body.appendChild(snapSound);

      soundInitialized = true; // סמן שהשמע אותחל
      if (CONFIG.DEBUG) console.log('Audio element initialized successfully.');

    } catch (err) {
      console.error('Error initializing audio:', err);
      CONFIG.PLAY_SOUND = false; // בטל שמע במקרה של שגיאה
      snapSound = null;
    }
  }


  // ========================================================================
  // הוספת כפתור בדיקת שמע - עכשיו משתמש ב-snapSound הגלובלי
  // ========================================================================
  function addSoundTestButton() {
    if (!CONFIG.PLAY_SOUND) return;

    try {
      // הסר כפתור קודם אם קיים
      const existingButton = document.getElementById('sound-test-button');
      if (existingButton) existingButton.remove();

      // צור כפתור בדיקת שמע חדש
      const button = document.createElement('button');
      button.id = 'sound-test-button';
      button.textContent = 'בדוק צליל הצמדה'; // טקסט התחלתי
      button.title = 'לחץ כאן כדי לבדוק את צליל ההצמדה';
      button.className = ''; // Remove any state classes

      // העיצוב מהגרסה הטובה יותר
      button.style.position = 'fixed';
      button.style.bottom = '15px';
      button.style.right = '15px';
      button.style.zIndex = '9999';
      button.style.padding = '8px 12px';
      button.style.backgroundColor = '#2196F3'; // כחול התחלתי
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      button.style.fontFamily = 'Arial, sans-serif';
      button.style.fontSize = '14px';
      button.style.fontWeight = 'bold';
      button.style.transition = 'background-color 0.2s, opacity 0.5s ease-out'; // הוספנו transition
      button.style.opacity = '1';

      // אפקט מעבר עכבר
      button.onmouseover = function() {
        if (!this.classList.contains('success') && !this.classList.contains('error')) {
             this.style.backgroundColor = '#0b7dda';
        }
      };
      button.onmouseout = function() {
         if (!this.classList.contains('success') && !this.classList.contains('error')) {
            this.style.backgroundColor = '#2196F3';
         }
      };

      // הוסף מאזין לחיצה - משתמש ב-snapSound הגלובלי
      button.addEventListener('click', function() {
        if (!snapSound) {
            console.warn('Snap sound element not initialized.');
            button.textContent = 'שגיאה באתחול';
            button.classList.remove('success');
            button.classList.add('error');
            button.style.backgroundColor = '#f44336'; // אדום
            return;
        }

        // נסה להפעיל את הצליל הגלובלי
        snapSound.play().then(() => {
          console.log('Sound test successful!');
          button.textContent = 'הצליל פועל ✓';
          button.classList.remove('error');
          button.classList.add('success');
          button.style.backgroundColor = '#4CAF50'; // ירוק
          audioContextAllowed = true; // סמן שהמשתמש ביצע אינטראקציה

          // העלם את הכפתור אחרי 3 שניות
          setTimeout(() => {
            button.classList.add('hidden');
            setTimeout(() => {
              button.remove();
            }, 500); // אחרי שהמעבר הסתיים
          }, 3000);

          // החזר את הצליל להתחלה למקרה שנצטרך אותו מיד
          snapSound.pause();
          snapSound.currentTime = 0;

        }).catch(err => {
          console.warn('Sound test failed:', err);
          button.textContent = 'שמע חסום - לחץ שוב';
          button.classList.remove('success');
          button.classList.add('error');
          button.style.backgroundColor = '#f44336'; // אדום
          audioContextAllowed = false; // נשאר לא מאופשר
        });
      });

      // הוסף את הכפתור לעמוד
      document.body.appendChild(button);
      if (CONFIG.DEBUG) console.log('Sound test button added to page');

    } catch (err) {
      console.error('Error adding sound test button:', err);
    }
  }

  // ========================================================================
  // השמעת צליל הצמדה - משתמש ב-snapSound הגלובלי
  // ========================================================================
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !snapSound) {
      if (CONFIG.DEBUG && CONFIG.PLAY_SOUND && !snapSound) console.log('Snap sound skipped: audio element not ready.');
      return;
    }

    // אם זו הפעם הראשונה שמנסים להפעיל אחרי טעינת הדף,
    // ייתכן שהדפדפן יחסום זאת עד לאינטראקציה. ה-catch יטפל בזה.
    // הכפתור בדיקה עוזר "לפתוח" את ההקשר מראש.
    if (!audioContextAllowed) {
        console.warn('Attempting to play sound before user interaction. Might be blocked.');
        // אנו עדיין מנסים, כי ייתכן שהמשתמש כבר לחץ במקום אחר
    }

    try {
      snapSound.pause(); // עצור אם במקרה מנגן
      snapSound.currentTime = 0; // חזור להתחלה
      snapSound.play().then(() => {
        audioContextAllowed = true; // הפעלה ראשונה מוצלחת מאפשרת השמעות עתידיות
        if (CONFIG.DEBUG) console.log('Snap sound played successfully.');
      }).catch(err => {
        // שגיאה נפוצה: NotAllowedError - המשתמש עוד לא ביצע אינטראקציה
        // שגיאה אחרת: AbortError - אם קריאה נוספת ל-play קטעה את הקודמת
        if (err.name !== 'AbortError') {
             console.warn('Could not play snap sound:', err);
        }
        // אין צורך לנסות חלופות, הבעיה כנראה בהרשאות דפדפן או באלמנט עצמו
      });
    } catch (err) {
      console.error('Error playing snap sound:', err);
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
                if (node.classList.contains('block-container')) {
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
      // ודא שאין מאזינים כפולים
      block.removeEventListener('mousedown', handleMouseDown);
      block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu);
      block.addEventListener('contextmenu', handleContextMenu);
  }

  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק
  // ========================================================================
  function handleMouseDown(e) {
      // רק לחיצה שמאלית, ורק על הבלוק עצמו או רכיב פנימי שלו
      if (e.button !== 0 || !e.target.closest) return;
      const block = e.target.closest('.block-container');
      if (!block || !block.parentElement || block.parentElement.id !== 'program-blocks') return; // ודא שהבלוק באזור הנכון

      if (!block.id) generateUniqueId(block);

      // מנע התנהגות ברירת מחדל שעשויה להפריע
      e.preventDefault();
      block.draggable = false; // נטרל גרירת דפדפן סטנדרטית

      if (CONFIG.DEBUG) console.log(`[MouseDown] Started for block: ${block.id}`);

      // אם הבלוק מחובר, נתק אותו לפני תחילת הגרירה
      if (block.hasAttribute('data-connected-to')) {
          if (CONFIG.DEBUG) console.log(`[MouseDown] Block ${block.id} was connected, detaching...`);
          detachBlock(block, false); // נתק בלי אנימציה (מיידי)
      }

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
      block.style.position = 'absolute';
      block.style.left = (rect.left - parentRect.left + parentElement.scrollLeft) + 'px';
      block.style.top = (rect.top - parentRect.top + parentElement.scrollTop) + 'px';
      block.style.margin = '0'; // נטרל margin אם היה קיים

      // סגנונות ויזואליים לגרירה
      block.style.zIndex = '1001'; // מעל בלוקים אחרים
      block.classList.add('snap-source'); // סגנון לבלוק נגרר
      document.body.classList.add('user-select-none'); // מנע בחירת טקסט

      if (CONFIG.DEBUG) console.log(`[MouseDown] Initial style: left=${block.style.left}, top=${block.style.top}`);
  }

  // ========================================================================
  // טיפול בקליק ימני על בלוק
  // ========================================================================
  function handleContextMenu(e) {
      e.preventDefault(); // מנע תפריט הקשר רגיל
      const block = e.target.closest('.block-container');
      // הצג תפריט ניתוק רק אם הבלוק מחובר לבלוק אחר
      if (block && block.hasAttribute('data-connected-to')) {
          showDetachMenu(e.clientX, e.clientY, block);
      }
  }

  // ========================================================================
  // מאזינים גלובליים לתנועה ושחרור עכבר
  // ========================================================================
  function initGlobalMouseListeners() {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // שיפור: טיפול בעזיבת חלון הדפדפן
    document.addEventListener('mouseleave', (e) => {
       if (isDraggingBlock && e.target === document.documentElement && !e.relatedTarget) {
           if (CONFIG.DEBUG) console.warn("Mouse left document during drag, treating as mouseup.");
           handleMouseUp(e); // סיים את הגרירה
       }
    });
  }

  // ========================================================================
  // טיפול בתנועת העכבר בזמן גרירה
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    // מנע התנהגות ברירת מחדל נוספת
    e.preventDefault();

    const parentElement = document.getElementById('program-blocks');
    if (!parentElement) return; // Should not happen if initialized correctly

    const parentRect = parentElement.getBoundingClientRect();

    // חשב מיקום חדש יחסי לאזור התכנות, כולל גלילה
    let newLeft = e.clientX - parentRect.left - dragOffset.x + parentElement.scrollLeft;
    let newTop = e.clientY - parentRect.top - dragOffset.y + parentElement.scrollTop;

    // הגבלת תנועה לגבולות אזור התכנות
    const blockWidth = currentDraggedBlock.offsetWidth;
    const blockHeight = currentDraggedBlock.offsetHeight;
    const maxLeft = Math.max(0, parentElement.scrollWidth - blockWidth);
    const maxTop = Math.max(0, parentElement.scrollHeight - blockHeight);
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));

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
    blockReleased.style.zIndex = ''; // חזור ל-z-index רגיל
    blockReleased.draggable = true; // אפשר גרירה מובנית שוב אם לא הוצמד

    // הסר את כל ההדגשות והאינדיקטורים מכל הבלוקים
    document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
      el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    removeFuturePositionIndicator();
    // --- סוף ניקוי ---


    // בצע הצמדה אם נמצא יעד מתאים
    if (targetToSnap && directionToSnap) {
      if (CONFIG.DEBUG) console.log(`[MouseUp] Performing snap operation.`);
      performBlockSnap(blockReleased, targetToSnap, directionToSnap);
    } else {
      if (CONFIG.DEBUG) console.log(`[MouseUp] No snap target found, block left at final drag position.`);
      // אין צורך לעשות כלום, הבלוק כבר במיקום הסופי שלו מה-mousemove
      // רק נוודא ש-draggable=true הוחזר (נעשה בניקוי)
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
    const allBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)')); // אל תבדוק מול הבלוק הנגרר עצמו

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


    for (const targetBlock of allBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      const targetRect = targetBlock.getBoundingClientRect();

      const snapInfo = calculateSnapInfo(sourceRect, targetRect);

      if (snapInfo && snapInfo.distance < minDistance) {
        // מצאנו התאמה קרובה יותר
        minDistance = snapInfo.distance;
        bestTarget = targetBlock;
        bestDirection = snapInfo.direction;
      }
    }

    // אם מצאנו יעד מתאים בטווח
    if (bestTarget) {
      if (CONFIG.DEBUG) console.log(`[Highlight] Potential snap: ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}), dist: ${minDistance.toFixed(1)}px`);

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
    // 1. בדיקת חפיפה אנכית
    const topOverlap = Math.max(sourceRect.top, targetRect.top);
    const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);

    // הגדר גובה מינימלי להשוואה (למקרה שאחד הבלוקים קטן מאוד)
    const minHeightForOverlapCheck = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;

    if (verticalOverlap < minHeightForOverlapCheck) {
      // if (CONFIG.DEBUG) console.log(`[CalcSnap] No snap: Insufficient vertical overlap (${verticalOverlap.toFixed(1)}px < ${minHeightForOverlapCheck.toFixed(1)}px) between ${sourceRect.top.toFixed(0)}-${sourceRect.bottom.toFixed(0)} and ${targetRect.top.toFixed(0)}-${targetRect.bottom.toFixed(0)}`);
      return null; // אין מספיק חפיפה אנכית
    }

    // 2. בדיקת מרחק אופקי בין פינים/שקעים רלוונטיים
    let distance;
    let direction;

    // מקרה א': המקור עשוי להתחבר משמאל ליעד (פין ימני של המקור לשקע שמאלי של היעד)
    const distanceLeftSnap = Math.abs(sourceRect.right - targetRect.left);
    // מקרה ב': המקור עשוי להתחבר מימין ליעד (פין שמאלי של המקור לשקע ימני של היעד)
    const distanceRightSnap = Math.abs(sourceRect.left - targetRect.right);

    // בחר את הכיוון עם המרחק הקטן ביותר
    if (distanceLeftSnap < distanceRightSnap) {
        distance = distanceLeftSnap;
        direction = 'left'; // המקור משמאל ליעד
    } else {
        distance = distanceRightSnap;
        direction = 'right'; // המקור מימין ליעד
    }

    // בדוק אם המרחק המינימלי בטווח ההצמדה
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
       if (CONFIG.DEBUG > 1) console.log(`[calculateSnapInfo] Possible connection: direction=${direction}, distance=${distance.toFixed(2)}px, vertical overlap=${verticalOverlap.toFixed(1)}px`);
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
    if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);

    try {
      const sourceRect = sourceBlock.getBoundingClientRect(); // מימדים נוכחיים
      const targetRect = targetBlock.getBoundingClientRect(); // מיקום יעד
      const parentElement = document.getElementById('program-blocks'); // ההורה הוא תמיד אזור התכנות
      const parentRect = parentElement.getBoundingClientRect();

      // חישוב מיקום אופקי סופי (מדויק, ללא רווח)
      let finalLeft;
      if (direction === 'left') { // מקור משמאל ליעד
        finalLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
      } else { // מקור מימין ליעד (direction === 'right')
        finalLeft = targetRect.right + CONFIG.BLOCK_GAP;
      }

      // חישוב מיקום אנכי סופי (יישור לחלק העליון של היעד)
      const finalTop = targetRect.top;

      // המרה לערכי style יחסיים להורה (אזור התכנות)
      let styleLeft = finalLeft - parentRect.left + parentElement.scrollLeft;
      let styleTop = finalTop - parentRect.top + parentElement.scrollTop;

       // עיגול למניעת שגיאות עיגול קטנות
       styleLeft = Math.round(styleLeft);
       styleTop = Math.round(styleTop);

      // החל את המיקום החדש על הבלוק הנגרר (המקור)
      sourceBlock.style.left = `${styleLeft}px`;
      sourceBlock.style.top = `${styleTop}px`;
      sourceBlock.style.position = 'absolute'; // ודא שזה נשאר אבסולוטי

      // עדכן מאפייני נתונים לציון החיבור
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);

      // הוסף קלאסים לסימון ויזואלי (אופציונלי, תלוי ב-CSS)
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');

      // השמע צליל הצמדה
      playSnapSound();

      // הוסף אנימציית הצמדה ויזואלית
      addSnapEffectAnimation(sourceBlock);

      // אפשר גרירה מובנית שוב (חשוב לאינטראקציות עתידיות)
      sourceBlock.draggable = true;

      if (CONFIG.DEBUG) console.log(`[PerformSnap] Snap successful. ${sourceBlock.id} positioned at left=${styleLeft}px, top=${styleTop}px`);
      return true;

    } catch (err) {
      console.error(`[PerformSnap] Error during snap operation:`, err);
      // נסה להחזיר את הבלוק למצב לא מחובר אם הייתה שגיאה
      detachBlock(sourceBlock, false); // נתק ללא אנימציה
      sourceBlock.draggable = true; // אפשר גרירה
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
        const sourceRect = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        const parentRect = programmingArea.getBoundingClientRect();

        // חשב מיקום עתידי תיאורטי (זהה לחישוב ב-performBlockSnap)
        let desiredViewportLeft, desiredViewportTop;
        desiredViewportTop = targetRect.top; // יישור עליון

        if (direction === 'left') {
            desiredViewportLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
        } else { // direction === 'right'
            desiredViewportLeft = targetRect.right + CONFIG.BLOCK_GAP;
        }

        // המר למיקום יחסי לאזור התכנות
        let indicatorLeft = desiredViewportLeft - parentRect.left + programmingArea.scrollLeft;
        let indicatorTop = desiredViewportTop - parentRect.top + programmingArea.scrollTop;

        // החל סגנונות על המחוון
        futureIndicator.style.left = Math.round(indicatorLeft) + 'px';
        futureIndicator.style.top = Math.round(indicatorTop) + 'px';
        futureIndicator.style.width = sourceRect.width + 'px';
        futureIndicator.style.height = sourceRect.height + 'px';
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
        // Optional: Could remove the element entirely if performance is an issue
        // futureIndicator.remove(); futureIndicator = null;
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

    // מאזין לסגירת התפריט בלחיצה מחוץ לו
    setTimeout(() => { // setTimeout למניעת סגירה מיידית מהקליק שפתח אותו
        document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
    }, 0);
  }

  function closeMenuOutside(e) {
    const menu = document.getElementById('detach-menu');
    // אם הקליק לא היה בתוך התפריט, הסר אותו
    if (menu && !menu.contains(e.target)) {
        removeDetachMenu();
    } else if (menu) {
        // אם הקליק היה בתוך התפריט אבל לא על אופציה (נדיר), הוסף מחדש את המאזין
         setTimeout(() => {
             document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
         }, 0);
    }
  }

  function removeDetachMenu() {
    const menu = document.getElementById('detach-menu');
    if (menu) {
        document.removeEventListener('click', closeMenuOutside, { capture: true }); // הסר מאזין קודם
        menu.remove();
    }
  }

  function detachBlock(blockToDetach, animate = true) {
    if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) {
        // if (CONFIG.DEBUG) console.log(`[Detach] Block ${blockToDetach?.id || 'unknown'} is not connected.`);
        return; // הבלוק לא מחובר
    }

    const targetId = blockToDetach.getAttribute('data-connected-to');
    const direction = blockToDetach.getAttribute('data-connection-direction');

    if (!targetId || !direction) {
        console.warn(`[Detach] Missing connection data on ${blockToDetach.id}`);
        // נקה בכל מקרה
        blockToDetach.removeAttribute('data-connected-to');
        blockToDetach.removeAttribute('data-connection-direction');
        blockToDetach.classList.remove('connected-block');
        return;
    }

    if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${blockToDetach.id} from ${targetId}`);

    // הסר את המאפיינים מהבלוק המנותק
    blockToDetach.removeAttribute('data-connected-to');
    blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block');

    // הסר את המאפיינים מבלוק המטרה
    const targetBlock = document.getElementById(targetId);
    if (targetBlock) {
        targetBlock.removeAttribute(`data-connected-from-${direction}`);

        // בדוק אם לבלוק המטרה נשארו חיבורים אחרים
        const hasOtherConnections =
            targetBlock.hasAttribute('data-connected-from-left') ||
            targetBlock.hasAttribute('data-connected-from-right') ||
            targetBlock.hasAttribute('data-connected-to'); // אולי הוא מחובר לבלוק אחר

        if (!hasOtherConnections) {
            targetBlock.classList.remove('has-connected-block');
        }
    } else {
        console.warn(`[Detach] Target block ${targetId} not found.`);
    }

    // הוסף אנימציית ניתוק אם נדרש
    if (animate) {
        addDetachEffectAnimation(blockToDetach);
        // אפשר להוסיף כאן קריאה ל-playDetachSound() אם רוצים צליל ניתוק
    }
  }

  // ========================================================================
  // פונקציות עזר לאנימציה
  // ========================================================================
  function addSnapEffectAnimation(block) {
    block.classList.remove('snap-animation');
    void block.offsetWidth; // Trigger reflow to restart animation
    block.classList.add('snap-animation');
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
    if (block.id) return block.id;
    const prefix = 'block'; // יכול להיות מתוחכם יותר אם צריך
    const uniqueId = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    block.id = uniqueId;
    if (CONFIG.DEBUG) console.log(`Generated ID for block: ${uniqueId}`);
    return uniqueId;
  }

  // ========================================================================
  // אתחול המערכת כולה
  // ========================================================================
  function initializeSystem() {
    addHighlightStyles(); // הוסף סגנונות CSS
    initAudio(); // אתחול שמע (פעם אחת)
    initProgrammingAreaListeners(); // מאזינים לאזור הכללי
    observeNewBlocks(); // מאזין לבלוקים שנוספים דינמית
    initExistingBlocks(); // מאזינים לבלוקים שכבר קיימים בטעינה
    initGlobalMouseListeners(); // מאזיני עכבר גלובליים

    // הוסף כפתור בדיקת שמע (אם מופעל) אחרי שהכל נטען
    if (CONFIG.PLAY_SOUND) {
      setTimeout(() => {
          addSoundTestButton();
      }, 500); // השהייה קלה לתת לדף לסיים להיטען
    }

    console.log(`Block linkage system initialized (Version 3.1 - Improved Highlight & Sound)`);
    console.log(`Configuration: Connect Threshold=${CONFIG.CONNECT_THRESHOLD}px, Vertical Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Sound=${CONFIG.PLAY_SOUND}`);
  }

  // הפעל את האתחול כשה-DOM מוכן
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
      // DOMContentLoaded already fired
      initializeSystem();
  }

})(); // סוף IIFE

// --- END OF REVISED FILE linkageimproved.js ---
