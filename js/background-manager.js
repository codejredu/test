document.addEventListener('DOMContentLoaded', () => {
  const backgroundButton = document.getElementById('background-button');
  const stage = document.getElementById('stage'); // הנחתי שיש לך אלמנט במה עם ID "stage"
  const backgroundOptionsPanel = document.getElementById('background-options-panel');
  const uploadBackgroundInput = document.getElementById('upload-background');
  const galleryBackgroundsContainer = document.getElementById('gallery-backgrounds');
  const closePanelButton = document.getElementById('close-background-panel');

  // נתיב לתיקיית הרקעים בגלריה
  const galleryPath = 'assets/bg/';

  // פונקציה להצגת/הסתרת פאנל אפשרויות הרקע
  function toggleBackgroundOptionsPanel() {
    backgroundOptionsPanel.classList.toggle('active');
  }

  // פונקציה להגדרת רקע לבמה
  function setStageBackground(backgroundImage) {
    stage.style.backgroundImage = `url('${backgroundImage}')`;
    toggleBackgroundOptionsPanel(); // סגירת הפאנל לאחר בחירה
  }

  // טיפול בהעלאת רקע מקומי
  uploadBackgroundInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        setStageBackground(e.target.result); // קריאת קובץ התמונה כ-Data URL
      }
      reader.readAsDataURL(file);
    }
  });

  // טעינת תמונות רקע מהגלריה
  function loadGalleryBackgrounds() {
    // כאן, בקוד אמיתי, היית מבצע קריאה לשרת או משתמש בטכניקה אחרת כדי לקבל רשימת קבצים מהתיקייה assets/bg/
    // מכיוון שזה קוד צד לקוח בלבד, נשתמש בגישה פשוטה יותר - נניח שיש לנו רשימה ידועה של שמות קבצים.
    const galleryImages = [
      'bg1.jpg',
      'bg2.jpg',
      'bg3.jpg',
      // הוסף כאן את שמות קבצי הרקע שלך בתיקייה assets/bg/
    ];

    galleryImages.forEach(imageName => {
      const imgElement = document.createElement('img');
      imgElement.src = galleryPath + imageName;
      imgElement.alt = `רקע גלריה ${imageName}`;
      imgElement.classList.add('gallery-background-image');

      imgElement.addEventListener('click', () => {
        setStageBackground(imgElement.src);
      });

      galleryBackgroundsContainer.appendChild(imgElement);
    });
  }

  // אתחול: טעינת רקעי גלריה והוספת מאזין לאירוע ללחצן הרקע
  loadGalleryBackgrounds();
  backgroundButton.addEventListener('click', toggleBackgroundOptionsPanel);
  closePanelButton.addEventListener('click', toggleBackgroundOptionsPanel);
});
