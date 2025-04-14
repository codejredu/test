document.addEventListener('DOMContentLoaded', () => {
  // Configuration - Edit this section to change path settings
  const config = {
    // Base path for background assets - change this to modify all paths at once
    basePath: 'assets/bg/',
    // List of background file names only (without the base path)
    backgrounds: [
      'canyon1.svg',
      'castel.jpg',
      'castel.svg',
      'castel1.svg',
      'citynight.svg',
      'citynight2.svg',
      'colorfulcity.svg',
      'colorfulcity1.svg',
      'desert.svg',
      'desert1.svg',
      'farm.svg',
      'kidbadroom.svg',
      'kidbadroom1.svg',
      'moon.svg',
      'room1.svg',
      'room2.svg',
      'savanna1.svg',
      'savanna2.svg',
      'school1.svg',
      'slopes1.svg',
      'slopes2.svg',
      'soccer1.svg',
      'soccer2.svg'
    ],
    // Upload icon path
    uploadIconPath: 'assets/images/uploadimage.svg',
    // Grid layout configuration
    gridColumns: 4,
    // Modal settings
    modalZIndex: 1000
  };

  // Utility function to get full path for a background
  function getBackgroundPath(filename) {
    return `${config.basePath}${filename}`;
  }

  // Select required DOM elements
  const backgroundButton = document.getElementById('background-button');
  const stage = document.getElementById('stage');
  
  // Event dispatcher function - notifies the application when background changes
  function dispatchBackgroundChangeEvent() {
    try {
      const event = new CustomEvent('backgroundChanged', {
        detail: { time: new Date().getTime() }
      });
      document.dispatchEvent(event);
      
      // Force browser to repaint the UI
      window.requestAnimationFrame(() => {
        const temp = document.body.style.opacity;
        document.body.style.opacity = '0.99';
        setTimeout(() => {
          document.body.style.opacity = temp;
        }, 1);
      });
    } catch (e) {
      console.error('Failed to dispatch background change event', e);
    }
  }

  // Resource management - keep track of created objects for proper cleanup
  const resourceManager = {
    tempImageUrls: [],
    
    // Add a URL to be tracked
    trackUrl(url) {
      this.tempImageUrls.push(url);
      return url;
    },
    
    // Cleanup all tracked resources
    cleanup() {
      if (this.tempImageUrls.length > 0) {
        this.tempImageUrls.forEach(url => {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error('Failed to revoke URL', e);
          }
        });
        this.tempImageUrls = [];
      }
    }
  };
  
  // Create a modal for background selection
  function createBackgroundModal() {
    // Create modal container
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
      z-index: ${config.modalZIndex};
      max-width: 90%;
      max-height: 90%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    `;

    // Create modal header
    const modalHeader = createModalHeader();
    modal.appendChild(modalHeader);

    // Create image grid
    const imageGrid = createImageGrid();
    modal.appendChild(imageGrid);

    // Create upload section
    const uploadContainer = createUploadSection();
    modal.appendChild(uploadContainer);

    return modal;
  }

  // Create modal header with title and close button
  function createModalHeader() {
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      position: sticky;
      top: 0;
      background-color: white;
      padding: 5px 0;
      z-index: 1;
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
    closeButton.onclick = closeModalAndCleanup;

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    return modalHeader;
  }

  // Create the grid of background images
  function createImageGrid() {
    const imageGrid = document.createElement('div');
    imageGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${config.gridColumns}, 1fr);
      gap: 15px;
      justify-content: center;
      direction: rtl;
    `;

    // Add each background to the grid
    config.backgrounds.forEach(backgroundFile => {
      const fullPath = getBackgroundPath(backgroundFile);
      const imgContainer = createImageThumbnail(fullPath);
      imageGrid.appendChild(imgContainer);
    });

    return imageGrid;
  }

  // Create a single image thumbnail
  function createImageThumbnail(imagePath) {
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
    img.src = imagePath;
    img.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    `;
    
    // Add error handling for image loading
    img.onerror = () => {
      console.error(`Failed to load image: ${imagePath}`);
      imgContainer.innerHTML = '<div style="color:red">טעינת תמונה נכשלה</div>';
    };

    imgContainer.onclick = () => {
      try {
        // Close modal first
        closeModalAndCleanup();
        
        // Update background with short delay after modal closing
        setTimeout(() => {
          if (stage) {
            stage.style.backgroundImage = `url(${imagePath})`;
            stage.style.backgroundSize = 'cover';
            stage.style.backgroundPosition = 'center';
          }
          // Dispatch event indicating background changed
          dispatchBackgroundChangeEvent();
        }, 10);
      } catch (error) {
        console.error('Error handling background selection:', error);
      }
    };

    imgContainer.appendChild(img);
    return imgContainer;
  }

  // Create the upload section
  function createUploadSection() {
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
    uploadIcon.src = config.uploadIconPath;
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

    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    uploadButton.onclick = () => {
      fileInput.click();
    };

    fileInput.addEventListener('change', handleFileUpload);
    uploadContainer.appendChild(fileInput);

    return uploadContainer;
  }

  // Handle file upload
  function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('אנא בחר קובץ תמונה (jpg, png, gif וכו׳)');
      return;
    }
    
    try {
      // Close modal first
      closeModalAndCleanup();
      
      // Create URL for the image and update background after modal closes
      setTimeout(() => {
        try {
          const imageUrl = resourceManager.trackUrl(URL.createObjectURL(file));
          
          if (stage) {
            stage.style.backgroundImage = `url(${imageUrl})`;
            stage.style.backgroundSize = 'cover';
            stage.style.backgroundPosition = 'center';
          }
          
          // Dispatch event indicating background changed
          dispatchBackgroundChangeEvent();
        } catch (error) {
          console.error('Error processing uploaded file:', error);
          alert('אירעה שגיאה בעת עיבוד הקובץ. אנא נסה שוב.');
        }
      }, 10);
    } catch (error) {
      console.error('Error handling file upload:', error);
    }
  }

  // Create overlay for the modal
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'background-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: ${config.modalZIndex - 1};
    `;
    
    // Add click listener to close modal when clicking on overlay
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeModalAndCleanup();
      }
    });
    return overlay;
  }
  
  // Close modal and clean up resources
  function closeModalAndCleanup() {
    try {
      const modal = document.querySelector('.background-modal');
      const overlay = document.querySelector('.background-modal-overlay');
      
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      
      resourceManager.cleanup();
    } catch (error) {
      console.error('Error in cleanup', error);
    }
  }

  // Initialize event listener for background button
  if (backgroundButton) {
    backgroundButton.addEventListener('click', openBackgroundModal);
  } else {
    console.error("לחצן 'רקע' לא נמצא!");
  }
  
  // Open modal function
  function openBackgroundModal() {
    // Check if modal is already open
    closeModalAndCleanup();
    
    // Create and add overlay and modal
    const overlay = createOverlay();
    const modal = createBackgroundModal();
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  }
  
  // Function to change the base path for backgrounds
  window.changeBackgroundPath = function(newPath) {
    if (typeof newPath === 'string') {
      // Make sure the path ends with a slash
      config.basePath = newPath.endsWith('/') ? newPath : `${newPath}/`;
      console.log(`Background path changed to: ${config.basePath}`);
      return true;
    }
    return false;
  };
});document.addEventListener('DOMContentLoaded', () => {
  // בוחרים את לחצן "רקע" באמצעות ה-ID שלו
  const backgroundButton = document.getElementById('background-button');
  // בוחרים את אזור הבמה
  const stage = document.getElementById('stage');
  
  // פונקציה ליצירת אירוע שינוי רקע
  function dispatchBackgroundChangeEvent() {
    try {
      const event = new CustomEvent('backgroundChanged', {
        detail: { time: new Date().getTime() }
      });
      document.dispatchEvent(event);
      
      // ניסיון לאלץ את הדפדפן לצייר מחדש את הממשק
      window.requestAnimationFrame(() => {
        const temp = document.body.style.opacity;
        document.body.style.opacity = '0.99';
        setTimeout(() => {
          document.body.style.opacity = temp;
        }, 1);
      });
    } catch (e) {
      console.error('Failed to dispatch event', e);
    }
  }

  const svgBackgrounds = [
    'assets/bg/canyon1.svg',
     'assets/bg/castel.svg',
    'assets/bg/castel1.svg',
    'assets/bg/citynight.svg',
    'assets/bg/citynight2.svg',
    'assets/bg/colorfulcity.svg',
    'assets/bg/colorfulcity1.svg',
    'assets/bg/desert.svg',
    'assets/bg/desert1.svg',
    'assets/bg/farm.svg',
    'assets/bg/kidbadroom.svg',
    'assets/bg/kidbadroom1.svg',
    'assets/bg/moon.svg',
    'assets/bg/room1.svg',
    'assets/bg/room2.svg',
    'assets/bg/savanna1.svg',
    'assets/bg/savanna2.svg',
    'assets/bg/school1.svg',
    'assets/bg/slopes1.svg',
    'assets/bg/slopes2.svg',
    'assets/bg/soccer1.svg',
    'assets/bg/soccer2.svg'
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
      position: sticky;
      top: 0;
      background-color: white;
      padding: 5px 0;
      z-index: 1;
    `;

    const modalTitle = document.createElement('h3');
    modalTitle.textContent = 'בחר רקע';
    modalTitle.style.margin = '0';
    modalTitle.style.direction = 'rtl';

    // שיטה לניקוי זיכרון ושחרור משאבים
    function cleanupResources() {
      // אם יש URLs של תמונות שנוצרו, משחררים אותם
      if (window._tempImageUrls && window._tempImageUrls.length > 0) {
        window._tempImageUrls.forEach(url => {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error('Failed to revoke URL', e);
          }
        });
        window._tempImageUrls = [];
      }
    }
    
    // פונקציה שמנקה את הכל ומחזירה את הממשק לתפקוד
    function closeModalAndCleanup() {
      try {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        cleanupResources();
      } catch (error) {
        console.error('Error in cleanup', error);
      }
    }

    // מוסיפים לחצן ניקוי מידי  
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    `;
    closeButton.onclick = closeModalAndCleanup;

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
        try {
          // נסגור את המודל ראשון
          closeModalAndCleanup();
          
          // עדכון הרקע באיחור קל אחרי סגירת המודל
          setTimeout(() => {
            if (stage) {
              stage.style.backgroundImage = `url(${svg})`;
              stage.style.backgroundSize = 'cover';
              stage.style.backgroundPosition = 'center';
            }
            // הפעלת האירוע המציין שהרקע שונה
            dispatchBackgroundChangeEvent();
          }, 10);
        } catch (error) {
          console.error('Error handling background selection:', error);
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
            // סגירת המודל מיד
            closeModalAndCleanup();
            
            // יצירת URL לתמונה ועדכון הרקע אחרי סגירת המודל
            setTimeout(() => {
              try {
                const imageUrl = URL.createObjectURL(file);
                // שמירת ה-URL כדי לשחרר את הזיכרון מאוחר יותר
                if (!window._tempImageUrls) window._tempImageUrls = [];
                window._tempImageUrls.push(imageUrl);
                
                if (stage) {
                  stage.style.backgroundImage = `url(${imageUrl})`;
                  stage.style.backgroundSize = 'cover';
                  stage.style.backgroundPosition = 'center';
                }
                
                // הפעלת האירוע המציין שהרקע שונה
                dispatchBackgroundChangeEvent();
              } catch (error) {
                console.error('Error processing uploaded file:', error);
                alert('אירעה שגיאה בעת עיבוד הקובץ. אנא נסה שוב.');
              }
            }, 10);
          } catch (error) {
            console.error('Error handling file upload:', error);
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
        closeModalAndCleanup();
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
