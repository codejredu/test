document.addEventListener('DOMContentLoaded', () => {
  // בוחרים את לחצן "רקע" באמצעות ה-ID שלו
  const backgroundButton = document.getElementById('background-button');
  // בוחרים את אזור הבמה
  const stage = document.getElementById('stage');

  // יוצרים אלמנט input מסוג file שיהיה נסתר
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*'; // מקבל רק קבצי תמונה
  fileInput.style.display = 'none'; // הסתרת האלמנט
  document.body.appendChild(fileInput); // הוספת האלמנט לעמוד

  // מוסיפים מאזין לאירוע 'click' ללחצן
  if (backgroundButton) {
    backgroundButton.addEventListener('click', () => {
      // מפעילים את חלון בחירת הקבצים
      fileInput.click();
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
        } else {
          console.error("אזור הבמה לא נמצא!");
        }
      } else {
        // אם הקובץ אינו תמונה, מציגים הודעת שגיאה
        alert('אנא בחר קובץ תמונה (jpg, png, gif וכו׳)');
      }
    }
  });
});
