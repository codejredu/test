--- START OF FILE background-manager.js ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. בוחרים את לחצן "רקע" באמצעות ה-ID שלו
  const backgroundButton = document.getElementById('background-button');
  const stage = document.getElementById('stage'); // Get the stage element

  // 2. מוסיפים מאזין לאירוע 'click' ללחצן
  if (backgroundButton) {
    backgroundButton.addEventListener('click', () => {
      // 3. הפעולה שתתבצע כאשר הלחצן נלחץ:
      //    במקום התראה, נפתח חלון בחירת קובץ

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*'; // Filter for image files

      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0]; // Get the selected file

        if (file) {
          const reader = new FileReader(); // Create a FileReader

          reader.onload = function(e) {
            // When the file is loaded, set it as the background image of the stage
            if (stage) {
              stage.style.backgroundImage = `url('${e.target.result}')`;
              stage.style.backgroundSize = 'cover'; // Adjust background size as needed
              stage.style.backgroundRepeat = 'no-repeat';
              stage.style.backgroundPosition = 'center';
            } else {
              console.error("אלמנט הבמה לא נמצא!"); // Stage element not found
            }
          }

          reader.onerror = function() {
            console.error("שגיאה בטעינת הקובץ!"); // Error loading file
            alert("שגיאה בטעינת הקובץ!"); // Alert user about the error
          }

          reader.readAsDataURL(file); // Read the file as a data URL
        }
      });

      fileInput.click(); // Programmatically click the file input to open the file dialog
    });
  } else {
    console.error("לחצן 'רקע' לא נמצא!"); // הודעת שגיאה אם הלחצן לא נמצא
  }
});
--- END OF FILE background-manager.js ---
