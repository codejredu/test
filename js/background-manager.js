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

  // נתיב לתיקיית הרקעים
  const bgPath = 'test/assets/bg/';
  
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

  // יצירת תמונות ממוזערות
  bgFiles.forEach(function(fileName) {
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
      backgroundColor: '#f8f8f8'
    });

    // יצירת תמונה
    const img = document.createElement('img');
    img.src = fullPath;
    img.alt = 'רקע';
    Object.assign(img.style, {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain'
    });

    // בדיקת טעינת תמונה
    img.onload = function() {
      console.log(`תמונה נטענה בהצלחה: ${fullPath}`);
    };

    img.onerror = function() {
      console.error(`שגיאה בטעינת תמונה: ${fullPath}`);
      thumbnail.textContent = '!';
    };

    // הוספת מאזין לחיצה
    thumbnail.addEventListener('click', function() {
      console.log(`נבחר רקע: ${fullPath}`);
      stage.style.backgroundImage = `url(${fullPath})`;
      stage.style.backgroundSize = 'cover';
      stage.style.backgroundPosition = 'center';
      thumbnailContainer.style.display = 'none';
    });

    // הוספת התמונה למיכל
    thumbnail.appendChild(img);
    thumbnailContainer.appendChild(thumbnail);
  });

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
  const uploadIcon = document.createElement('img');
  uploadIcon.src = '/assets/images/uploadimage.svg';
  uploadIcon.alt = 'העלאת תמונה';
  Object.assign(uploadIcon.style, {
    maxWidth: '70%',
    maxHeight: '70%'
  });
  
  uploadIcon.onerror = function() {
    uploadButton.textContent = 'העלאת תמונה';
    uploadButton.style.fontSize = '12px';
  };
  
  uploadButton.appendChild(uploadIcon);
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
