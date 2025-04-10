document.addEventListener('DOMContentLoaded', () => {
  // 1. בוחרים את לחצן "רקע" באמצעות ה-ID שלו
  const backgroundButton = document.getElementById('background-button');

  // 2. מוסיפים מאזין לאירוע 'click' ללחצן
  if (backgroundButton) {
    backgroundButton.addEventListener('click', () => {
      // 3. הפעולה שתתבצע כאשר הלחצן נלחץ:
      //    במקרה הזה, פשוט נציג הודעה
      alert('לחצן "רקע" נלחץ!');

      // *** כאן תוכל להוסיף קוד לפעולה אמיתית של שינוי רקע ***
      // למשל, קוד שיפתח חלון לבחירת רקע, או שישנה את צבע הרקע של הבמה.
    });
  } else {
    console.error("לחצן 'רקע' לא נמצא!"); // הודעת שגיאה אם הלחצן לא נמצא
  }
});
