document.addEventListener('DOMContentLoaded', () => {
  // בוחרים את לחצן "רקע" באמצעות ה-ID שלו
  const backgroundButton = document.getElementById('background-button');
  // בוחרים את אזור הבמה
  const stage = document.getElementById('stage');
  
  // יוצרים אלמנט שיכיל את מטריצת התמונות
  const thumbnailGrid = document.createElement('div');
  thumbnailGrid.className = 'thumbnail-grid';
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
  
  // רשימת התמונות SVG בספרייה
  const bgImages = [
    'background1.svg',
    'background2.svg',
    'background3.svg',
    'background4.svg',
    'background5.svg',
    'background6.svg'
  ];
  
  // יצירת האלמנטים עבור כל תמונה ממוזערת
  bgImages.forEach(imgName => {
    const imgPath = `test/assets/bg/${imgName}`;
    
    // יצירת אלמנט img במקום div עם background-image
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
    
    // יצירת אלמנט img עבור ה-SVG
    const img = document.createElement('img');
    img.src = imgPath;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    
    // טיפול בשגיאת טעינת תמונה
    img.onerror = function() {
      console.error(`שגיאה בטעינת התמונה: ${imgPath}`);
      thumbnail.style.backgroundColor = '#f0f0f0';
      
      const errorText = document.createElement('span');
      errorText.textContent = 'שגיאה';
      errorText.style.color = 'red';
      errorText.style.fontSize = '10px';
      
      thumbnail.innerHTML = '';
      thumbnail.appendChild(errorText);
    };
    
    // הוספת התמונה לתוך ה-div
    thumbnail.appendChild(img);
    
    // מאזין לאירוע לחיצה על תמונה ממוזערת
    thumbnail.addEventListener('click', () => {
      // החלת התמונה כרקע הבמה
      if (stage) {
        // שימוש ב-SVG כרקע
        stage.style.backgroundImage = `url(${imgPath})`;
        stage.style.backgroundSize = 'cover';
        stage.style.backgroundPosition = 'center';
        stage.style.backgroundRepeat = 'no-repeat';
        
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
  uploadButton.style.cursor = 'pointer';
  uploadButton.style.border = '2px solid #ddd';
  uploadButton.style.borderRadius = '4px';
  uploadButton.style.display = 'flex';
  uploadButton.style.justifyContent =
