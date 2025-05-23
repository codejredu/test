document.addEventListener('DOMContentLoaded', () => {
  // Configuration - Edit this section to change path settings
  const config = {
    // Base path for background assets - change this to modify all paths at once
    basePath: 'assets/bg/',
    // List of background file names only (without the base path)
    backgrounds: [
      'canyon1.svg',
     
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
      'soccer2.svg',
      'soccer1.svg',
      'road2.svg',
      'road1.svg',
      'winter1.svg',
       'winter2.svg',
      
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
      // Create the event with more descriptive details
      const event = new CustomEvent('backgroundChanged', {
        detail: { 
          time: new Date().getTime(),
          background: stage ? stage.style.backgroundImage : null
        }
      });
      
      // Log before dispatching for debugging
      console.log('Dispatching background change event with details:', event.detail);
      
      // Dispatch the event
      document.dispatchEvent(event);
      
      // Additional event for compatibility with other potential listeners
      const simpleEvent = new Event('backgroundChange');
      document.dispatchEvent(simpleEvent);
      
      console.log('Background change events dispatched successfully');
    } catch (e) {
      console.error('Failed to dispatch background change event:', e);
    }
  }

  // Resource management - keep track of created objects for proper cleanup
  const resourceManager = {
    tempImageUrls: [],
    
    // Add a URL to be tracked
    trackUrl(url) {
      if (url && typeof url === 'string' && url.startsWith('blob:')) {
        console.log('Tracking URL for cleanup:', url);
        this.tempImageUrls.push(url);
      } else {
        console.warn('Attempted to track invalid URL:', url);
      }
      return url;
    },
    
    // Cleanup all tracked resources
    cleanup() {
      console.log(`Cleaning up ${this.tempImageUrls.length} tracked URLs`);
      
      if (this.tempImageUrls.length > 0) {
        this.tempImageUrls.forEach(url => {
          try {
            if (url && typeof url === 'string' && url.startsWith('blob:')) {
              console.log('Revoking object URL:', url);
              URL.revokeObjectURL(url);
            }
          } catch (e) {
            console.error('Failed to revoke URL:', url, e);
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

    // Create upload section - MOVED ABOVE the image grid
    const uploadContainer = createUploadSection();
    modal.appendChild(uploadContainer);

    // Create image grid - NOW AFTER the upload section
    const imageGrid = createImageGrid();
    modal.appendChild(imageGrid);

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
      margin-top: 15px; /* Added margin to create space after the upload section */
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
        // Update background first
        if (stage) {
          stage.style.backgroundImage = `url(${imagePath})`;
          stage.style.backgroundSize = 'cover';
          stage.style.backgroundPosition = 'center';
        }
        
        // Notify app that background changed
        dispatchBackgroundChangeEvent();
        
        // Then close modal - this ensures the background is updated
        // before the modal is closed
        closeModalAndCleanup();
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
      text-align: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee; /* Changed to bottom border instead of top */
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
      // Create URL for the image
      const imageUrl = URL.createObjectURL(file);
      
      // Add to resource manager for proper cleanup
      resourceManager.tempImageUrls.push(imageUrl);
      
      console.log("Image URL created:", imageUrl);
      
      // Update background - make sure the stage element is available
      console.log("Stage element before update:", stage ? "Found" : "Not found");
      
      if (stage) {
        // Set background directly
        stage.style.backgroundImage = `url("${imageUrl}")`;
        stage.style.backgroundSize = 'cover';
        stage.style.backgroundPosition = 'center';
        console.log("Background image updated to:", imageUrl);
      } else {
        console.error("Stage element not found when trying to set background");
        alert('אירעה שגיאה: אלמנט הרקע לא נמצא.');
        return;
      }
      
      // Wait a moment to ensure the background is updated
      setTimeout(() => {
        // Dispatch event indicating background changed
        try {
          dispatchBackgroundChangeEvent();
          console.log("Background change event dispatched");
        } catch (e) {
          console.error("Error dispatching event:", e);
        }
        
        // Close modal after the background is updated
        closeModalAndCleanup();
      }, 100);
    } catch (error) {
      console.error('Error handling file upload:', error);
      alert('אירעה שגיאה בעת עיבוד הקובץ. אנא נסה שוב.');
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
    overlay.addEventListener('click', closeModalAndCleanup);
    return overlay;
  }
  
  // Close modal and clean up resources
  function closeModalAndCleanup() {
    try {
      // Get all modal and overlay elements (in case there are duplicates)
      const modals = document.querySelectorAll('.background-modal');
      const overlays = document.querySelectorAll('.background-modal-overlay');
      
      // Remove all modals
      modals.forEach(modal => {
        if (modal && modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      });
      
      // Remove all overlays
      overlays.forEach(overlay => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      });
      
      // Clean up resources
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
    // Check if modal is already open and close it first
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
});
