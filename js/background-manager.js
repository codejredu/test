document.addEventListener('DOMContentLoaded', function() {
  console.log("הדף נטען, מתחיל אתחול מנהל הרקע");

  // בדיקת קיום אלמנטים חיוניים
  const backgroundButton = document.getElementById('background-button');
  const stage = document.getElementById('stage');

  // בדיקת קיום לחצן הרקע
  if (!backgroundButton) {
    console.error("שגיאה: לא נמצא אלמנט עם ID 'background-button'");
    return;
  }

  // בדיקת קיום אזור הבמה
  if (!stage) {
    console.error("שגיאה: לא נמצא אלמנט עם ID 'stage'");
    return;
  }

  console.log("נמצאו אלמנטים נדרשים: לחצן רקע ובמה");

  // יצירת מיכל למטריצת התמונות
  const thumbnailContainer = document.createElement('div');
  thumbnailContainer.id = 'background-thumbnails-container';
  thumbnailContainer.className = 'background-grid';
  
  // עיצוב בסיסי למיכל התמונות
  Object.assign(thumbnailContainer.style, {
    position: 'absolute',
    display: 'none',
    flexWrap: 'wrap',
    gap: '10px',
    padding: '10px',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '5px',
    zIndex: '10000',
    width: '300px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  });

  // הוספת כותרת
  const gridHeader = document.createElement('div');
  gridHeader.textContent = 'בחר רקע';
  gridHeader.style.width = '100%';
  gridHeader.style.textAlign = 'center';
  gridHeader.style.marginBottom = '10px';
  gridHeader.style.fontWeight = 'bold';
  thumbnailContainer.appendChild(gridHeader);

  // נתיב לתיקיית הרקעים - תיקון הנתיב
  const bgPath = 'assets/bg/';
  
  // רשימת קבצי SVG לטעינה
  const bgFiles = [
    'background1.svg',
    'background2.svg',
    'background3.svg',
    'background4.svg',
    'background5.svg',
    'background6.svg'
  ];

  console.log(`מנסה לטעון ${bgFiles.length} תמונות מהנתיב ${bgPath}`);

  // יצירת פונקציה לטעינת תמונה עם ניסיונות חוזרים
  function loadImageWithRetry(src, maxRetries = 2) {
    return new Promise((resolve, reject) => {
      let retries = 0;
      
      function attemptLoad() {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn(`ניסיון ${retries + 1} נכשל לטעינת ${src}`);
          if (retries < maxRetries) {
            retries++;
            setTimeout(attemptLoad, 500); // ניסיון חוזר אחרי חצי שנייה
          } else {
            reject(new Error(`נכשל בטעינת התמונה אחרי ${maxRetries + 1} ניסיונות: ${src}`));
          }
        };
        img.src = src;
      }
      
      attemptLoad();
    });
  }

  // יצירת תמונות ממוזערות
  bgFiles.forEach(function(fileName, index) {
    const fullPath = bgPath + fileName;
    
    // יצירת מיכל לתמונה ממוזערת
    const thumbnail = document.createElement('div');
    Object.assign(thumbnail.style, {
      width: '80px',
      height: '60px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      overflow: 'hidden',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8f8f8',
      position: 'relative'
    });

    // הוספת טקסט טעינה
    const loadingText = document.createElement('div');
    loadingText.textContent = 'טוען...';
    loadingText.style.fontSize = '12px';
    loadingText.style.color = '#666';
    thumbnail.appendChild(loadingText);

    // יצירת תמונה
    const img = document.createElement('img');
    img.alt = `רקע ${index + 1}`;
    Object.assign(img.style, {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      display: 'none' // מוסתר עד שהטעינה תושלם
    });

    // טעינת התמונה עם ניסיונות חוזרים
    loadImageWithRetry(fullPath)
      .then(() => {
        img.src = fullPath; // הגדרת מקור התמונה רק אחרי שוידאנו שהיא זמינה
        img.style.display = 'block'; // הצגת התמונה
        loadingText.remove(); // הסרת טקסט הטעינה
        console.log(`תמונה נטענה בהצלחה: ${fullPath}`);
      })
      .catch(error => {
        console.error(`שגיאה בטעינת תמונה: ${fullPath}`, error);
        loadingText.textContent = '!';
        loadingText.style.color = 'red';
        
        // הוספת הודעת שגיאה מפורטת בהצבעה
        thumbnail.title = `שגיאה בטעינת ${fileName}`;
      });

    // הוספת מאזין לחיצה
    thumbnail.addEventListener('click', function() {
      if (img.complete && img.naturalWidth > 0) {
        console.log(`נבחר רקע: ${fullPath}`);
        stage.style.backgroundImage = `url(${fullPath})`;
        stage.style.backgroundSize = 'cover';
        stage.style.backgroundPosition = 'center';
        thumbnailContainer.style.display = 'none';
      } else {
        console.warn(`ניסיון לבחור תמונה שלא נטענה: ${fullPath}`);
        alert('התמונה עדיין לא נטענה או שיש בעיה בטעינתה');
      }
    });

    // הוספת התמונה למיכל
    thumbnail.appendChild(img);
    thumbnailContainer.appendChild(thumbnail);
  });

  // יצירת כפתור לבדיקת נתיב (דיבוג)
  const debugButton = document.createElement('div');
  Object.assign(debugButton.style, {
    width: '100%',
    padding: '8px',
    marginTop: '10px',
    textAlign: 'center',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  });
  debugButton.textContent = 'בדוק נתיבי תמונות';
  debugButton.addEventListener('click', function() {
    console.group('בדיקת נתיבי תמונות');
    bgFiles.forEach(file => {
      const fullPath = bgPath + file;
      console.log(`מנסה לגשת ל: ${fullPath}`);
      
      // יצירת בקשת fetch לבדיקת קיום הקובץ
      fetch(fullPath)
        .then(response => {
          if (response.ok) {
            console.log(`✓ הקובץ ${file} נמצא ונגיש`);
          } else {
            console.error(`✗ הקובץ ${file} לא נמצא (קוד: ${response.status})`);
          }
        })
        .catch(error => {
          console.error(`✗ שגיאה בגישה לקובץ ${file}:`, error);
        });
    });
    console.groupEnd();
    
    alert(`פרטי בדיקת הנתיבים מוצגים בקונסול.\nמחפש תמונות בנתיב: ${bgPath}`);
  });
  thumbnailContainer.appendChild(debugButton);

  // יצירת לחצן העלאת תמונה
  const uploadButton = document.createElement('div');
  Object.assign(uploadButton.style, {
    width: '80px',
    height: '60px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: '#f0f0f0'
  });
  
  // יצירת אייקון העלאה או טקסט חלופי
  uploadButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
  uploadButton.title = 'העלאת תמונה';
  thumbnailContainer.appendChild(uploadButton);

  // יצירת אלמנט input לבחירת קובץ
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  // מאזין לחיצה על לחצן העלאה
  uploadButton.addEventListener('click', function() {
    fileInput.click();
  });

  // מאזין לבחירת קובץ
  fileInput.addEventListener('change', function(event) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (file.type.startsWith('image/')) {
        const imageUrl = URL.createObjectURL(file);
        stage.style.backgroundImage = `url(${imageUrl})`;
        stage.style.backgroundSize = 'cover';
        stage.style.backgroundPosition = 'center';
        thumbnailContainer.style.display = 'none';
        console.log(`תמונה הועלתה בהצלחה: ${file.name} (${file.type})`);
      } else {
        alert('אנא בחר קובץ תמונה');
      }
    }
  });

  // הוספת מיכל התמונות לעמוד
  document.body.appendChild(thumbnailContainer);

  // מאזין לחיצה על לחצן הרקע
  backgroundButton.addEventListener('click', function(event) {
    event.stopPropagation();
    
    console.log("לחצן רקע נלחץ");
    
    // מיקום המטריצה יחסית ללחצן
    const buttonRect = backgroundButton.getBoundingClientRect();
    thumbnailContainer.style.top = buttonRect.bottom + 5 + 'px';
    thumbnailContainer.style.left = buttonRect.left + 'px';
    
    // החלפת מצב תצוגה
    if (thumbnailContainer.style.display === 'none' || thumbnailContainer.style.display === '') {
      thumbnailContainer.style.display = 'flex';
      console.log("מציג מטריצת רקעים");
    } else {
      thumbnailContainer.style.display = 'none';
      console.log("מסתיר מטריצת רקעים");
    }
  });

  // סגירת המטריצה בלחיצה מחוץ לה
  document.addEventListener('click', function(event) {
    if (thumbnailContainer.style.display !== 'none' && 
        !thumbnailContainer.contains(event.target) &&
        event.target !== backgroundButton) {
      thumbnailContainer.style.display = 'none';
    }
  });

  console.log("אתחול מנהל הרקע הושלם");
});
