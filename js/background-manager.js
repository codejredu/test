document.addEventListener('DOMContentLoaded', () => {
  // בוחרים את לחצן "רקע" באמצעות ה-ID שלו
  const backgroundButton = document.getElementById('background-button');
  // בוחרים את אזור הבמה
  const stage = document.getElementById('stage');
  
  // יוצרים אלמנט שיכיל את מטריצת התמונות
  const thumbnailGrid = document.createElement('div');
  thumbnailGrid.className = 'thumbnail-grid';
  thumbnailGrid.style.display = 'none';
  thumbnailGrid.style.position = 'absolute';
  thumbnailGrid.style.zIndex = '100';
  thumbnailGrid.style.backgroundColor = 'white';
  thumbnailGrid.style.padding = '10px';
  thumbnailGrid.style.border = '1px solid #ccc';
  thumbnailGrid.style.borderRadius = '5px';
  thumbnailGrid.style.display = 'none';
  thumbnailGrid.style.flexWrap = 'wrap';
  thumbnailGrid.style.gap = '10px';
  thumbnailGrid.style.maxWidth = '300px';
  
  // הוספת האלמנט לעמוד
  document.body.appendChild(thumbnailGrid);
  
  // רשימת התמונות בספרייה (צריך להתאים לתמונות שקיימות בפועל)
  const bgImages = [
    'background1.jpg',
    'background2.jpg',
    'background3.jpg',
    'background4.jpg',
    'background5.jpg',
    'background6.jpg'
  ];
  
  // יצירת האלמנטים עבור כל תמונה ממוזערת
  bgImages.forEach(imgName => {
    const imgPath = `test/assets/bg/${imgName}`;
    
    // יצירת אלמנט div שיכיל את התמונה הממוזערת
    const thumbnail = document.createElement('div');
    thumbnail.className = 'bg-thumbnail';
    thumbnail.style.width = '80px';
    thumbnail.style.height = '60px';
    thumbnail.style.backgroundImage = `url(${imgPath})`;
    thumbnail.style.backgroundSize = 'cover';
    thumbnail.style.backgroundPosition = 'center';
    thumbnail.style.cursor = 'pointer';
    thumbnail.style.border = '2px solid #ddd';
    thumbnail.style.borderRadius = '4px';
    
    // מאזין לאירוע לחיצה על תמונה ממוזערת
    thumbnail.addEventListener('click', () => {
      // החלת התמונה כרקע הבמה
      if (stage) {
        stage.style.backgroundImage = `url(${imgPath})`;
        stage.style.backgroundSize = 'cover';
        stage.style.backgroundPosition = 'center';
        
        // הסתרת מטריצת התמונות אחרי הבחירה
        thumbnailGrid.style.display = 'none';
      }
    });
    
    // הוספת התמונה הממוזערת לרשת
    thumbnailGrid.appendChild(thumbnail);
  });
  
  // יצירת לחצן להעלאת תמונה
  const uploadButton = document.createElement('div');
  uploadButton.className = 'upload-button';
  uploadButton.style.width = '80px';
  uploadButton.style.height = '60px';
  uploadButton.style.backgroundImage = 'url(/assets/images/uploadimage.svg)';
  uploadButton.style.backgroundSize = 'contain';
  uploadButton.style.backgroundPosition = 'center';
  uploadButton.style.backgroundRepeat = 'no-repeat';
  uploadButton.style.cursor = 'pointer';
  uploadButton.style.border = '2px solid #ddd';
  uploadButton.style.borderRadius = '4px';
  
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
  
  // מוסיפים מאזין לאירוע 'click' ללחצן הרקע
  if (backgroundButton) {
    backgroundButton.addEventListener('click', (event) => {
      // ממקמים את רשת התמונות ליד הלחצן
      const buttonRect = backgroundButton.getBoundingClientRect();
      thumbnailGrid.style.top = `${buttonRect.bottom + 5}px`;
      thumbnailGrid.style.left = `${buttonRect.left}px`;
      
      // החלפת מצב התצוגה של רשת התמונות
      if (thumbnailGrid.style.display === 'none' || thumbnailGrid.style.display === '') {
        thumbnailGrid.style.display = 'flex';
      } else {
        thumbnailGrid.style.display = 'none';
      }
      
      // מניעת התפשטות האירוע לחלונית המסמך
      event.stopPropagation();
    });
  } else {
    console.error("לחצן 'רקע' לא נמצא!");
  }
  
  // מאזין לאירוע שינוי בבחירת קובץ
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0]; // מקבלים את הקובץ שנבחר
    
    if (file) {
      // בודקים אם הקובץ הוא תמונה
      if (file.type.startsWith('image/')) {
        // יוצרים URL זמני לתמונה שנבחרה
        const imageUrl = URL.createObjectURL(file);
        
        // מגדירים את התמונה כרקע לבמה
        if (stage) {
          stage.style.backgroundImage = `url(${imageUrl})`;
          stage.style.backgroundSize = 'cover'; // התאמת גודל התמונה לבמה
          stage.style.backgroundPosition = 'center'; // מיקום התמונה במרכז
          
          // הסתרת מטריצת התמונות אחרי הבחירה
          thumbnailGrid.style.display = 'none';
        } else {
          console.error("אזור הבמה לא נמצא!");
        }
      } else {
        // אם הקובץ אינו תמונה, מציגים הודעת שגיאה
        alert('אנא בחר קובץ תמונה (jpg, png, gif וכו׳)');
      }
    }
  });
  
  // סגירת תפריט התמונות הממוזערות בלחיצה בכל מקום אחר במסמך
  document.addEventListener('click', (event) => {
    if (thumbnailGrid.style.display === 'flex' && 
        !thumbnailGrid.contains(event.target) && 
        event.target !== backgroundButton) {
      thumbnailGrid.style.display = 'none';
    }
  });
});
