document.addEventListener('DOMContentLoaded', () => {
  // בוחרים את לחצן "רקע" באמצעות ה-ID שלו
  const backgroundButton = document.getElementById('background-button');
  // בוחרים את אזור הבמה
  const stage = document.getElementById('stage');

  const svgBackgrounds = [
    'assets/BG/canyon1.svg',
    'assets/BG/castel.svg',
    'assets/BG/castel1.svg',
    'assets/BG/citynight.svg',
    'assets/BG/citynight2.svg',
    'assets/BG/colorfulcity.svg',
    'assets/BG/colorfulcity1.svg',
    'assets/BG/desert.svg',
    'assets/BG/desert1.svg',
    'assets/BG/farm.svg',
    'assets/BG/kidbadroom.svg',
    'assets/BG/kidbadroom1.svg',
    'assets/BG/moon.svg',
    'assets/BG/room1.svg',
    'assets/BG/room2.svg',
    'assets/BG/savanna1.svg',
    'assets/BG/savanna2.svg',
    'assets/BG/school1.svg',
    'assets/BG/slopes1.svg',
    'assets/BG/slopes2.svg',
    'assets/BG/soccer1.svg',
    'assets/BG/soccer2.svg'
  ];

  // יצירת המודל של בחירת רקע
  function createBackgroundModal() {
    // יצירת מודל
    const modal = document.createElement('div');
    modal.className = 'background-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      max-width: 90%;
      max-height: 90%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    `;

    // כותרת המודל
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    `;

    const modalTitle = document.createElement('h3');
    modalTitle.textContent = 'בחר רקע';
    modalTitle.style.margin = '0';
    modalTitle.style.direction = 'rtl';

    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    `;
    closeButton.onclick = () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    modal.appendChild(modalHeader);

    // מטריצת התמונות
    const imageGrid = document.createElement('div');
    imageGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      justify-content: center;
      direction: rtl;
    `;

    // הוספת תמונות SVG מהרשימה
    svgBackgrounds.forEach(svg => {
      const imgContainer = document.createElement('div');
      imgContainer.style.cssText = `
        border: 2px solid #ddd;
        border-radius: 5px;
        padding: 10px;
        cursor: pointer;
        text-align: center;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f9f9f9;
      `;

      const img = document.createElement('img');
      img.src = svg;
      img.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      `;

      imgContainer.onclick = () => {
        if (stage) {
          stage.style.backgroundImage = `url(${svg})`;
          stage.style.backgroundSize = 'cover';
          stage.style.backgroundPosition = 'center';
        }
        try {
          if (modal.parentNode) modal.parentNode.removeChild(modal);
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        } catch (error) {
          console.error('Error closing modal:', error);
        }
      };

      imgContainer.appendChild(img);
      imageGrid.appendChild(imgContainer);
    });

    modal.appendChild(imageGrid);

    // לחצן העלאת תמונה
    const uploadContainer = document.createElement('div');
    uploadContainer.style.cssText = `
      margin-top: 20px;
      text-align: center;
      padding: 15px 0;
      border-top: 1px solid #eee;
    `;

    const uploadButton = document.createElement('div');
    uploadButton.style.cssText = `
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      padding: 10px 15px;
      background-color: #f0f0f0;
      border-radius: 5px;
      border: 1px solid #ddd;
    `;

    const uploadIcon = document.createElement('img');
    uploadIcon.src = 'assets/images/uploadimage.svg';
    uploadIcon.style.cssText = `
      width: 24px;
      height: 24px;
      margin-left: 8px;
    `;

    const uploadText = document.createElement('span');
    uploadText.textContent = 'העלאת תמונה';
    uploadText.style.direction = 'rtl';

    uploadButton.appendChild(uploadIcon);
    uploadButton.appendChild(uploadText);
    uploadContainer.appendChild(uploadButton);
    modal.appendChild(uploadContainer);

    // יצירת input מסוג file נסתר
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    uploadButton.onclick = () => {
      fileInput.click();
    };

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      
      if (file) {
        if (file.type.startsWith('image/')) {
          try {
            const imageUrl = URL.createObjectURL(file);
            
            // שינוי הרקע רק אחרי שה-URL נוצר בהצלחה
            if (stage) {
              stage.style.backgroundImage = `url(${imageUrl})`;
              stage.style.backgroundSize = 'cover';
              stage.style.backgroundPosition = 'center';
            }
            
            // סגירת המודל עם השהייה קצרה למניעת תקיעות
            setTimeout(() => {
              try {
                if (modal.parentNode) modal.parentNode.removeChild(modal);
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
              } catch (error) {
                console.error('Error closing modal after upload:', error);
              }
            }, 100);
          } catch (error) {
            console.error('Error processing uploaded file:', error);
            alert('אירעה שגיאה בעת עיבוד הקובץ. אנא נסה שוב.');
          }
        } else {
          alert('אנא בחר קובץ תמונה (jpg, png, gif וכו׳)');
        }
      }
    });

    modal.appendChild(fileInput);

    return modal;
  }

  // יצירת שכבת הרקע האפורה
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999;
    `;
    
    // הוספת מאזין לחיצה לסגירת המודל בלחיצה על הרקע
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        try {
          const modal = document.querySelector('.background-modal');
          if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        } catch (error) {
          console.error('Error closing modal from overlay:', error);
        }
      }
    });
    return overlay;
  }

  // מוסיפים מאזין לאירוע 'click' ללחצן הרקע
  if (backgroundButton) {
    backgroundButton.addEventListener('click', () => {
      // בדיקה אם המודל כבר פתוח
      const existingModal = document.querySelector('.background-modal');
      if (existingModal) {
        try {
          const existingOverlay = document.querySelector('.overlay');
          if (existingModal.parentNode) existingModal.parentNode.removeChild(existingModal);
          if (existingOverlay && existingOverlay.parentNode) existingOverlay.parentNode.removeChild(existingOverlay);
        } catch (error) {
          console.error('Error removing existing modal:', error);
        }
      }
      
      const overlay = createOverlay();
      overlay.className = 'overlay';
      const modal = createBackgroundModal();
      
      document.body.appendChild(overlay);
      document.body.appendChild(modal);
    });
  } else {
    console.error("לחצן 'רקע' לא נמצא!");
  }
});
