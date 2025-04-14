document.addEventListener('DOMContentLoaded', () => {
  // בוחרים את לחצן "רקע" באמצעות ה-ID שלו
  const backgroundButton = document.getElementById('background-button');
  // בוחרים את אזור הבמה
  const stage = document.getElementById('stage');
  
  // בדיקה שלחצן הרקע קיים
  if (!backgroundButton) {
    console.error("לחצן 'רקע' לא נמצא! אנא ודא שיש אלמנט עם ID 'background-button'");
    return; // יציאה מהפונקציה אם הלחצן לא קיים
  }
  
  // בדיקה שהבמה קיימת
  if (!stage) {
    console.error("אזור הבמה לא נמצא! אנא ודא שיש אלמנט עם ID 'stage'");
    return; // יציאה מהפונקציה אם הבמה לא קיימת
  }
  
  console.log("לחצן הרקע והבמה נמצאו בהצלחה");
  
  // יוצרים אלמנט שיכיל את מטריצת התמונות
  const thumbnailGrid = document.createElement('div');
  thumbnailGrid.id = 'background-thumbnails';
  thumbnailGrid.className = 'thumbnail-grid';
  thumbnailGrid.style.position = 'absolute';
  thumbnailGrid.style.zIndex = '1000'; // ערך גבוה יותר להבטחת הופעה מעל אלמנטים אחרים
  thumbnailGrid.style.backgroundColor = 'white';
  thumbnailGrid.style.padding = '10px';
  thumbnailGrid.style.border = '1px solid #ccc';
  thumbnailGrid.style.borderRadius = '5px';
  thumbnailGrid.style.display = 'none'; // מוסתר בהתחלה
  thumbnailGrid.style.width = '280px';
  
  // עיצוב נוסף למטריצה
  thumbnailGrid.style.flexDirection = 'row';
  thumbnailGrid.style.flexWrap = 'wrap';
  thumbnailGrid.style.gap = '10px';
  thumbnailGrid.style.justifyContent = 'space-around';
  
  // הוספת כותרת למטריצה
  const gridTitle = document.createElement('div');
  gridTitle.textContent = 'בחר רקע';
  gridTitle.style.width = '100%';
  gridTitle.style.textAlign = 'center';
  gridTitle.style.marginBottom = '10px';
  gridTitle.style.fontWeight = 'bold';
  thumbnailGrid.appendChild(gridTitle);
  
  // הוספת המטריצה לעמוד
  document.body.appendChild(thumbnailGrid);
  
  // פונקציה לשליפת רשימת הקבצים מהספרייה
  // מכיוון שבדפדפן לא ניתן לגשת ישירות לספרייה, ניצור רשימה ידנית של תמונות
  
  // ניסיון לטעון את כל התמונות מהספרייה
  const basePath = '/test/assets/bg/';
  
  // רשימת התמונות SVG בספרייה
  // נשתמש בשמות קבצים כלליים ונבדוק אילו מהם קיימים
  const potentialImages = [
    'bg1.svg', 'bg2.svg', 'bg3.svg', 'bg4.svg', 'bg5.svg', 'bg6.svg',
    'background1.svg', 'background2.svg', 'background3.svg', 'background4.svg', 'background5.svg', 'background6.svg',
    'רקע1.svg', 'רקע2.svg', 'רקע3.svg', 'רקע4.svg', 'רקע5.svg', 'רקע6.svg'
  ];
  
  console.log(`מנסה לטעון תמונות מהנתיב: ${basePath}`);
  
  // פונקציה ליצירת תמונה ממוזערת
  function createThumbnail(imgPath) {
    // יצירת אלמנט div לתמונה ממוזערת
    const thumbnail = document.createElement('div');
    thumbnail.className = 'bg-thumbnail';
    thumbnail.style.width = '80px';
    thumbnail.style.height = '60px';
    thumbnail.style.cursor = 'pointer';
    thumbnail.style.border = '2px solid #ddd';
    thumbnail.style.borderRadius = '4px';
    thumbnail.style.display = 'flex';
    thumbnail.style.justifyContent = 'center';
    thumbnail.style.alignItems = 'center';
    thumbnail.style.overflow = 'hidden';
    thumbnail.style.background = '#f9f9f9';
    
    // יצירת אלמנט img עבור התמונה
    const img = document.createElement('img');
    img.src = imgPath;
    img.alt = 'תמונת רקע';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    
    // טיפול בשגיאת טעינת תמונה
    img.onerror = function() {
      console.error(`שגיאה בטעינת התמונה: ${imgPath}`);
      thumbnail.remove(); // הסרת התמונה הממוזערת אם הקובץ לא קיים
    };
    
    // התראה על טעינת תמונה מוצלחת
    img.onload = function() {
      console.log(`תמונה נטענה בהצלחה: ${imgPath}`);
      // הוספת התמונה לתוך ה-div רק אם היא טעונה בהצלחה
      thumbnail.appendChild(img);
      
      // מאזין לאירוע לחיצה על תמונה ממוזערת
      thumbnail.addEventListener('click', () => {
        console.log(`נבחרה תמונת רקע: ${imgPath}`);
        
        // החלת התמונה כרקע הבמה
        stage.style.backgroundImage = `url(${imgPath})`;
        stage.style.backgroundSize = 'cover';
        stage.style.backgroundPosition = 'center';
        stage.style.backgroundRepeat = 'no-repeat';
        
        // הסתרת מטריצת התמונות אחרי הבחירה
        thumbnailGrid.style.display = 'none';
      });
      
      // הוספת התמונה הממוזערת לרשת
      thumbnailGrid.appendChild(thumbnail);
    };
  }
  
  // יצירת תמונות ממוזערות עבור תמונות SVG שקיימות
  potentialImages.forEach(imgName => {
    createThumbnail(basePath + imgName);
  });
  
  // בדיקה אם יש צורך להוסיף תמונות מתיקיות שונות
  const alternativePaths = [
    '/',
    '/assets/bg/',
    '/bg/',
    '/images/bg/',
    '/assets/images/bg/'
  ];
  
  // ניסיון לטעון מנתיבים אלטרנטיביים אם לא נמצאו תמונות
  setTimeout(() => {
    // בדיקה אם נוספו תמונות לרשת
    const thumbnails = thumbnailGrid.querySelectorAll('.bg-thumbnail');
    if (thumbnails.length <= 1) { // רק כותרת או לא נוספו תמונות
      console.log('לא נמצאו תמונות בנתיב המקורי, מנסה נתיבים חלופיים');
      
      alternativePaths.forEach(path => {
        potentialImages.forEach(imgName => {
          createThumbnail(path + imgName);
        });
      });
    }
  }, 500);
  
  // יצירת לחצן להעלאת תמונה
  const uploadButton = document.createElement('div');
  uploadButton.className = 'upload-button';
  uploadButton.style.width = '80px';
  uploadButton.style.height = '60px';
  uploadButton.style.cursor = 'pointer';
  uploadButton.style.border = '2px solid #ddd';
  uploadButton.style.borderRadius = '4px';
  uploadButton.style.display = 'flex';
  uploadButton.style.justifyContent = 'center';
  uploadButton.style.alignItems = 'center';
  uploadButton.style.background = '#f0f0f0';
  
  // הוספת אייקון העלאת תמונה
  const uploadIcon = document.createElement('img');
  uploadIcon.src = '/assets/images/uploadimage.svg';
  uploadIcon.alt = 'העלאת תמונה';
  uploadIcon.style.maxWidth = '80%';
  uploadIcon.style.maxHeight = '80%';
  
  // טיפול בשגיאת טעינת אייקון העלאה
  uploadIcon.onerror = function() {
    console.error('שגיאה בטעינת אייקון העלאה, מנסה נתיב חלופי');
    // ניסיון להשתמש בנתיבים חלופיים לאייקון
    const alternativeIconPaths = [
      '/uploadimage.svg',
      '/images/uploadimage.svg',
      '/icons/uploadimage.svg',
      '/assets/uploadimage.svg'
    ];
    
    let iconLoaded = false;
    for (let i = 0; i < alternativeIconPaths.length; i++) {
      const testImg = new Image();
      testImg.src = alternativeIconPaths[i];
      testImg.onload = function() {
        if (!iconLoaded) {
          uploadIcon.src = alternativeIconPaths[i];
          iconLoaded = true;
        }
      };
    }
    
    // אם לא נמצא, נשתמש בטקסט
    setTimeout(() => {
      if (!iconLoaded) {
        uploadButton.textContent = 'העלאת תמונה';
        uploadButton.style.textAlign = 'center';
        uploadButton.style.fontSize = '12px';
      }
    }, 300);
  };
  
  uploadButton.appendChild(uploadIcon);
  
  // הוספת לחצן ההעלאה לרשת התמונות
  thumbnailGrid.appendChild(uploadButton);
  
  // יוצרים אלמנט input מסוג file שיהיה נסתר
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*'; // מקבל רק קבצי תמונה
  fileInput.style.display = 'none'; // הסתרת האלמנט
  document.body.appendChild(fileInput); // הוספת האלמנט לעמוד
  
  // מאזין לאירוע לחיצה על לחצן ההעלאה
  uploadButton.addEventListener('click', () => {
    fileInput.click();
  });
  
  // מאזין לאירוע לחיצה על לחצן הרקע
  backgroundButton.addEventListener('click', (event) => {
    console.log('לחצן רקע נלחץ');
    
    // ממקמים את רשת התמונות ליד הלחצן
    const buttonRect = backgroundButton.getBoundingClientRect();
    thumbnailGrid.style.top = `${buttonRect.bottom + 5}px`;
    thumbnailGrid.style.left = `${buttonRect.left}px`;
    
    // החלפת מצב התצוגה של רשת התמונות
    if (thumbnailGrid.style.display === 'none' || thumbnailGrid.style.display === '') {
      thumbnailGrid.style.display = 'flex';
      console.log('מטריצת התמונות מוצגת');
    } else {
      thumbnailGrid.style.display = 'none';
      console.log('מטריצת התמונות מוסתרת');
    }
    
    // מניעת התפשטות האירוע לחלונית המסמך
    event.stopPropagation();
  });
  
  // מאזין לאירוע שינוי בבחירת קובץ
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0]; // מקבלים את הקובץ שנבחר
    
    if (file) {
      // בודקים אם הקובץ הוא תמונה
      if (file.type.startsWith('image/')) {
        console.log(`נבחר קובץ: ${file.name}, סוג: ${file.type}`);
        
        // יוצרים URL זמני לתמונה שנבחרה
        const imageUrl = URL.createObjectURL(file);
        
        // מגדירים את התמונה כרקע לבמה
        stage.style.backgroundImage = `url(${imageUrl})`;
        stage.style.backgroundSize = 'cover'; // התאמת גודל התמונה לבמה
        stage.style.backgroundPosition = 'center'; // מיקום התמונה במרכז
        
        // הסתרת מטריצת התמונות אחרי הבחירה
        thumbnailGrid.style.display = 'none';
      } else {
        // אם הקובץ אינו תמונה, מציגים הודעת שגיאה
        alert('אנא בחר קובץ תמונה (jpg, png, svg וכו׳)');
      }
    }
  });
  
  // סגירת תפריט התמונות הממוזערות בלחיצה בכל מקום אחר במסמך
  document.addEventListener('click', (event) => {
    if (thumbnailGrid.style.display === 'flex' && 
        !thumbnailGrid.contains(event.target) && 
        event.target !== backgroundButton) {
      thumbnailGrid.style.display = 'none';
      console.log('מטריצת התמונות נסגרה בלחיצה מחוץ לה');
    }
  });
  
  console.log('הקוד נטען והמאזינים נרשמו בהצלחה');
});
