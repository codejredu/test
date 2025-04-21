// --- START OF FILE linkageimproved.js ---
// --- Version 4.1: Protected Release (Snap only if close on MouseUp) ---
// Based on v4.0 logic, cleaned up debug logs.
// Snaps ONLY if a valid target is found within CONNECT_THRESHOLD distance *at release*.
// No "jumping" behavior if released outside the threshold.
// Visual feedback (highlight/indicator) is shown during drag based on proximity.

(function() {
  // Module-level variables
  let currentDraggedBlock = null;
  let potentialSnapTargetForVisuals = null; // Stores target for visual feedback during move
  let snapDirectionForVisuals = null;       // Stores direction for visual feedback
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null;
  let audioContextAllowed = false; // Track if user interaction allowed audio
  let soundInitialized = false;

  // Configuration
  const CONFIG = {
    PIN_WIDTH: 5, // Theoretical width of connection pins (not visually used here)
    CONNECT_THRESHOLD: 8, // Pixels: Proximity threshold for visual highlight AND final snap check
    INDICATOR_TOUCH_THRESHOLD: 1, // Pixels: Proximity threshold for showing the blue dashed indicator
    VERTICAL_OVERLAP_REQ: 0.4, // Requires 40% vertical overlap between blocks to connect
    BLOCK_GAP: 0, // Pixels: Final horizontal gap between connected blocks (0 for direct contact)
    PLAY_SOUND: true, // Enable/disable snap sound
    SOUND_VOLUME: 0.8, // Volume (0.0 to 1.0)
    SOUND_PATH: 'assets/sound/link.mp3', // Path to the snap sound file
    DEBUG: true // Enable console log messages (set to false for production)
  };

  // ========================================================================
  // Dynamic CSS Style Injection for Highlights and Effects
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* Style for the block being dragged */
      .snap-source {
        box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important;
        transition: box-shadow 0.15s ease-out;
        cursor: grabbing !important;
        z-index: 1001 !important; /* Ensure dragged block is on top */
      }
      /* Style for potential target block (Yellow Halo) */
      .snap-target {
        outline: 6px solid #FFC107 !important; /* Yellow outline */
        outline-offset: 4px;
        box-shadow: 0 0 20px 8px rgba(255, 193, 7, 0.8) !important; /* Yellow glow */
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important; /* Target below source but above others */
      }
      /* Dashed blue indicator for future position */
      .future-position-indicator {
        position: absolute;
        border: 3px dashed rgba(0, 120, 255, 0.95) !important; /* Dashed blue border */
        border-radius: 5px;
        background-color: rgba(0, 120, 255, 0.15) !important; /* Light blue background */
        pointer-events: none; /* Ignore mouse events */
        z-index: 998; /* Below target halo */
        opacity: 0;
        transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear;
        display: none; /* Hidden by default */
      }
      .future-position-indicator.visible {
        display: block;
        opacity: 0.9;
      }
      /* Optional side indicators on the target block */
      .snap-target.snap-left::before {
        content: ''; position: absolute; left: -10px; top: 10%; bottom: 10%; width: 8px;
        background-color: #FFC107; border-radius: 2px; z-index: 1000;
        box-shadow: 0 0 10px 2px rgba(255,193,7,0.8); transition: all 0.1s ease-out;
      }
      .snap-target.snap-right::after {
        content: ''; position: absolute; right: -10px; top: 10%; bottom: 10%; width: 8px;
        background-color: #FFC107; border-radius: 2px; z-index: 1000;
        box-shadow: 0 0 10px 2px rgba(255,193,7,0.8); transition: all 0.1s ease-out;
      }
      /* Animations */
      @keyframes snapEffect { 0%{transform:scale(1)} 35%{transform:scale(1.05)} 70%{transform:scale(0.98)} 100%{transform:scale(1)} }
      .snap-animation { animation: snapEffect 0.3s ease-out; }
      @keyframes detachEffect { 0%{transform:translate(0,0) rotate(0)} 30%{transform:translate(3px,1px) rotate(0.8deg)} 60%{transform:translate(-2px,2px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0)} }
      .detach-animation { animation: detachEffect 0.3s ease-in-out; }
      /* Context Menu for Detach */
      #detach-menu { position:absolute; background-color:white; border:1px solid #ccc; border-radius:4px; box-shadow:0 3px 8px rgba(0,0,0,0.2); z-index:1100; padding:5px; font-size:14px; min-width:100px; }
      #detach-menu div { padding:6px 12px; cursor:pointer; border-radius:3px; }
      #detach-menu div:hover { background-color:#eee; }
      /* Prevent text selection during drag */
      body.user-select-none { user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; }
      /* Optional styles for connected blocks (can be used for visual grouping) */
      .connected-block, .has-connected-block { /* Optional */ }
      /* Sound Test Button Styles */
      #sound-test-button { position:fixed; bottom:15px; right:15px; padding:8px 12px; background-color:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; z-index:9999; font-family:Arial,sans-serif; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background-color .2s,opacity .5s ease-out; opacity:1; }
      #sound-test-button:hover { background-color:#0b7dda; }
      #sound-test-button.success { background-color:#4CAF50; }
      #sound-test-button.error { background-color:#f44336; }
      #sound-test-button.loading { background-color:#ff9800; cursor:wait; }
      #sound-test-button.hidden { opacity:0; pointer-events:none; }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Linkage Styles Added.');
  }

  // ========================================================================
  // Audio Initialization and Playback
  // ========================================================================
  function initAudio() {
    if (!CONFIG.PLAY_SOUND || soundInitialized) return;
    try {
        // Reuse existing element if available
        const existingElement = document.getElementById('snap-sound-element');
        if (existingElement) {
            snapSound = existingElement;
            soundInitialized = true; // Assume it's ready or will be soon
            if (CONFIG.DEBUG) console.log('Audio element reused.');
            // Ensure the correct source is loaded if path changed
            if (!existingElement.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)) {
                existingElement.innerHTML = ''; // Clear old sources
                const source = document.createElement('source');
                source.src = CONFIG.SOUND_PATH;
                source.type = 'audio/mpeg'; // Adjust type if needed
                existingElement.appendChild(source);
                existingElement.load(); // Reload the audio element
            }
            return;
        }

        // Create new audio element
        snapSound = document.createElement('audio');
        snapSound.id = 'snap-sound-element';
        snapSound.preload = 'auto';
        snapSound.volume = CONFIG.SOUND_VOLUME;

        const source = document.createElement('source');
        source.src = CONFIG.SOUND_PATH;
        source.type = 'audio/mpeg'; // Adjust type if necessary (e.g., 'audio/wav')
        snapSound.appendChild(source);

        // Error handling
        snapSound.addEventListener('error', (e) => {
            console.error(`Audio Error: Could not load sound "${CONFIG.SOUND_PATH}".`, e);
            const btn = document.getElementById('sound-test-button');
            if(btn) { btn.textContent='שגיאה בטעינת שמע'; btn.className='error'; btn.disabled=true; }
            CONFIG.PLAY_SOUND = false;
            snapSound = null;
            soundInitialized = false;
        });

        // Ready handler
        snapSound.addEventListener('canplaythrough', () => {
            soundInitialized = true;
            if (CONFIG.DEBUG) console.log('Audio ready to play.');
            const btn = document.getElementById('sound-test-button');
            if (btn?.classList.contains('loading')) {
                btn.textContent = 'בדוק צליל';
                btn.classList.remove('loading');
                btn.disabled = false;
            }
        });

        snapSound.style.display = 'none'; // Hide the element
        document.body.appendChild(snapSound);
        if (CONFIG.DEBUG) console.log(`Audio element created: ${CONFIG.SOUND_PATH}`);

    } catch (err) {
        console.error('Audio initialization failed:', err);
        CONFIG.PLAY_SOUND = false;
        snapSound = null;
        soundInitialized = false;
    }
  }

  function addSoundTestButton() {
      if (!CONFIG.PLAY_SOUND) return;
      try {
          // Remove existing button first
          const existingButton = document.getElementById('sound-test-button');
          if (existingButton) existingButton.remove();

          const button = document.createElement('button');
          button.id = 'sound-test-button';
          button.title = 'בדוק צליל חיבור';
          button.className = ''; // Base class

          // Set initial state based on audio readiness
          if (!snapSound) {
              button.textContent = 'שמע נכשל'; button.classList.add('error'); button.disabled = true;
          } else if (!soundInitialized) {
              button.textContent = 'טוען צליל...'; button.classList.add('loading'); button.disabled = true;
          } else {
              button.textContent = 'בדוק צליל'; button.disabled = false;
          }

          // Apply basic styles (can be moved to CSS if preferred)
          Object.assign(button.style, {
              position:'fixed', bottom:'15px', right:'15px', zIndex:'9999',
              padding:'8px 12px', color:'white', border:'none', borderRadius:'4px',
              cursor:'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.2)',
              fontFamily:'Arial, sans-serif', fontSize:'14px', fontWeight:'bold',
              transition:'background-color .2s, opacity .5s ease-out', opacity:'1'
          });
          // Default background color set by class later or manually
          if (!button.classList.contains('error') && !button.classList.contains('loading')) {
             button.style.backgroundColor = '#2196F3'; // Default blue
          }

          // Hover effect
          button.onmouseover = function() {
              if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) this.style.backgroundColor = '#0b7dda'; // Darker blue
          };
          button.onmouseout = function() {
              if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) this.style.backgroundColor = '#2196F3'; // Default blue
          };

          // Click handler
          button.addEventListener('click', function() {
              if (this.disabled || !snapSound || !soundInitialized) return;

              snapSound.play()
                  .then(() => {
                      button.textContent = 'צליל פועל ✓';
                      button.classList.add('success');
                      button.style.backgroundColor = '#4CAF50'; // Green for success
                      audioContextAllowed = true; // Mark audio as allowed by user interaction
                      // Fade out and remove after a delay
                      setTimeout(() => {
                          button.classList.add('hidden');
                          button.style.opacity = '0';
                          setTimeout(() => button.remove(), 500); // Remove from DOM after fade
                      }, 3000);
                      // Reset sound for next play
                      snapSound.pause();
                      snapSound.currentTime = 0;
                  })
                  .catch(err => {
                      console.warn('Sound test failed:', err.name, err.message);
                      if (err.name === 'NotAllowedError') {
                          button.textContent = 'צליל נחסם - לחץ שוב';
                          button.classList.add('error'); // Keep error state
                          button.style.backgroundColor = '#f44336'; // Red
                          audioContextAllowed = false;
                          // Re-enable button to allow another attempt
                          button.disabled = false;
                          button.classList.remove('loading');
                      } else {
                          // Other errors
                          button.textContent = 'שגיאת נגינה';
                          button.classList.add('error');
                          button.style.backgroundColor = '#f44336'; // Red
                          button.disabled = true; // Disable on other errors
                      }
                  });
          });

          document.body.appendChild(button);
          if (CONFIG.DEBUG) console.log('Sound test button added.');

      } catch (err) {
          console.error('Error adding sound test button:', err);
      }
  }

  function playSnapSound() {
      if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) return;

      // Warn if trying to play before user interaction allowed it
      if (!audioContextAllowed && CONFIG.DEBUG) {
          console.warn('Attempting to play sound before user interaction.');
          // Consider adding the test button if it's not there
          if (!document.getElementById('sound-test-button')) {
             // addSoundTestButton(); // Optionally force button display
          }
         // Don't return here, let the browser handle the first play attempt (might work or fail)
      }

      try {
          // Check if audio is ready (readyState 4 means enough data to play)
          if (snapSound.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) { // HAVE_ENOUGH_DATA is 4
              if (CONFIG.DEBUG) console.log('Snap sound skipped: audio not ready yet (readyState:', snapSound.readyState, ')');
              return;
          }

          // Reset and play
          snapSound.pause();
          snapSound.currentTime = 0;
          const playPromise = snapSound.play();

          if (playPromise !== undefined) {
              playPromise
                  .then(() => {
                      audioContextAllowed = true; // Mark as allowed after successful play
                      if (CONFIG.DEBUG > 1) console.log('Snap sound played successfully.');
                  })
                  .catch(error => {
                      // Handle playback errors (especially NotAllowedError)
                      if (error.name === 'NotAllowedError') {
                          console.warn('Snap sound playback blocked by browser (needs user interaction).');
                          audioContextAllowed = false;
                          // Show the test button again if it was hidden
                          if (!document.getElementById('sound-test-button')) {
                             addSoundTestButton();
                          }
                      } else if (error.name !== 'AbortError') { // Ignore AbortError caused by rapid pause/play
                          console.error('Error playing snap sound:', error);
                      }
                  });
          }
      } catch (err) {
          console.error('Unexpected error during playSnapSound:', err);
      }
  }


  // ========================================================================
  // Event Listeners Setup (Programming Area, Blocks, Global)
  // ========================================================================
  function initProgrammingAreaListeners() {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) {
          console.error("Programming area (#program-blocks) not found!");
          return;
      }
      // Prevent default dragover behavior to allow dropping
      programmingArea.addEventListener('dragover', (event) => event.preventDefault());
      // Prevent default dragstart for blocks *within* the programming area
      programmingArea.addEventListener('dragstart', (event) => {
          if (event.target?.closest?.('#program-blocks .block-container')) {
              event.preventDefault();
          }
      });
      if (CONFIG.DEBUG) console.log("Programming area listeners initialized.");
  }

  function observeNewBlocks() {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return; // Should have been caught earlier, but safe check

      const observer = new MutationObserver((mutationsList) => {
          for (const mutation of mutationsList) {
              if (mutation.type === 'childList') {
                  mutation.addedNodes.forEach(node => {
                      // Check if the added node itself is a block container
                      if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('block-container')) {
                         if (!node.id) generateUniqueId(node);
                         addBlockDragListeners(node);
                         if (CONFIG.DEBUG > 1) console.log(`Observer: Added listener to new block ${node.id}`);
                      }
                      // Check if the added node contains block containers (e.g., if a wrapper div was added)
                      else if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll) {
                          node.querySelectorAll('.block-container').forEach(block => {
                             // Ensure it's directly within the observed area
                             if (block.closest('#program-blocks') === programmingArea) {
                                if (!block.id) generateUniqueId(block);
                                addBlockDragListeners(block);
                                if (CONFIG.DEBUG > 1) console.log(`Observer: Added listener to new block ${block.id} (found via querySelectorAll)`);
                             }
                          });
                      }
                  });
              }
          }
      });

      observer.observe(programmingArea, { childList: true, subtree: true });
      if (CONFIG.DEBUG) console.log("MutationObserver watching programming area for new blocks.");
  }

  function initExistingBlocks() {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;
      const blocks = programmingArea.querySelectorAll('.block-container');
      blocks.forEach(block => {
          if (!block.id) generateUniqueId(block);
          addBlockDragListeners(block);
      });
      if (CONFIG.DEBUG) console.log(`Listeners added to ${blocks.length} existing blocks in programming area.`);
  }

  function addBlockDragListeners(blockElement) {
      // Remove existing listeners first to prevent duplicates
      blockElement.removeEventListener('mousedown', handleMouseDown);
      blockElement.removeEventListener('contextmenu', handleContextMenu);

      // Add new listeners
      blockElement.addEventListener('mousedown', handleMouseDown);
      blockElement.addEventListener('contextmenu', handleContextMenu);

      // Ensure draggable attribute is initially true for standalone blocks
       if (!blockElement.hasAttribute('data-connected-to') &&
           !blockElement.hasAttribute('data-connected-from-left') &&
           !blockElement.hasAttribute('data-connected-from-right')) {
             blockElement.draggable = true;
        } else {
            blockElement.draggable = false; // Connected blocks shouldn't be natively draggable
        }
  }

  function initGlobalMouseListeners() {
      // Remove potential old listeners before adding new ones
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave); // Handles leaving the window

      // Add global listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseLeave);
      if (CONFIG.DEBUG) console.log("Global mouse listeners initialized.");
  }

  // ========================================================================
  // Drag Lifecycle Handlers (MouseDown, MouseMove, MouseUp, MouseLeave)
  // ========================================================================

  function handleMouseDown(event) {
      // Only handle left mouse button clicks
      if (event.button !== 0 || !event.target.closest) return;

      // Ignore clicks on inputs/buttons inside a block if any exist
      if (event.target.matches('input, button, select, textarea, a[href]')) {
         return;
      }

      const block = event.target.closest('.block-container');
      // Ensure the block is directly within the programming area and not nested improperly
      if (!block || !block.parentElement || block.parentElement.id !== 'program-blocks') {
          return; // Click wasn't on a draggable block in the programming area
      }

      // Generate ID if missing (important for tracking connections)
      if (!block.id) {
          generateUniqueId(block);
      }

      event.preventDefault(); // Prevent default drag behaviors like text selection
      block.draggable = false; // Use our custom dragging, disable native HTML drag

      if (CONFIG.DEBUG) console.log(`[MouseDown] Start drag on: ${block.id}`);

      // --- Detach block from its neighbors before dragging ---
      // Detach self from the block it was connected TO
      const connectedToId = block.getAttribute('data-connected-to');
      if (connectedToId) {
          detachBlock(block, false); // Detach self silently (no animation)
      }
      // Detach blocks connected TO this block (on its left/right)
      const leftId = block.getAttribute('data-connected-from-left');
      if (leftId) {
          const leftBlock = document.getElementById(leftId);
          if (leftBlock) detachBlock(leftBlock, false); // Detach the block on the left
      }
      const rightId = block.getAttribute('data-connected-from-right');
      if (rightId) {
          const rightBlock = document.getElementById(rightId);
          if (rightBlock) detachBlock(rightBlock, false); // Detach the block on the right
      }
       // --- End Detach ---

      currentDraggedBlock = block;
      isDraggingBlock = true;

      // Calculate offset from mouse pointer to block's top-left corner
      const rect = block.getBoundingClientRect();
      dragOffset.x = event.clientX - rect.left;
      dragOffset.y = event.clientY - rect.top;

      const programmingArea = document.getElementById('program-blocks');
      const areaRect = programmingArea.getBoundingClientRect();

      // Ensure the block is absolutely positioned *relative to the programming area*
      // This might involve converting its current visual position if it wasn't absolute
      if (window.getComputedStyle(block).position !== 'absolute') {
          block.style.position = 'absolute';
          // Calculate position relative to programming area, considering scroll
          block.style.left = (rect.left - areaRect.left + programmingArea.scrollLeft) + 'px';
          block.style.top = (rect.top - areaRect.top + programmingArea.scrollTop) + 'px';
      }
      block.style.margin = '0'; // Remove any margin that might interfere

      // Apply dragging styles
      block.style.zIndex = '1001'; // Bring to front
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none'); // Prevent text selection globally

      // Reset visual state from previous drags
      potentialSnapTargetForVisuals = null;
      snapDirectionForVisuals = null;
  }

 function handleMouseMove(event) {
      if (!isDraggingBlock || !currentDraggedBlock) return;

      event.preventDefault(); // Prevent other default actions during drag

      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) {
          console.error("Programming area lost during drag!");
          handleMouseUp(event); // Abort drag if area disappears
          return;
      }
      const areaRect = programmingArea.getBoundingClientRect();

      // Calculate new top-left position based on mouse movement, offset, and container scroll
      let newLeft = event.clientX - areaRect.left - dragOffset.x + programmingArea.scrollLeft;
      let newTop = event.clientY - areaRect.top - dragOffset.y + programmingArea.scrollTop;

      // Constrain block position within the programming area boundaries
      const blockWidth = currentDraggedBlock.offsetWidth;
      const blockHeight = currentDraggedBlock.offsetHeight;
      const scrollWidth = programmingArea.scrollWidth; // Content width including overflow
      const scrollHeight = programmingArea.scrollHeight; // Content height including overflow

      newLeft = Math.max(0, Math.min(newLeft, scrollWidth - blockWidth));
      newTop = Math.max(0, Math.min(newTop, scrollHeight - blockHeight));

      // Apply the new position
      currentDraggedBlock.style.left = Math.round(newLeft) + 'px';
      currentDraggedBlock.style.top = Math.round(newTop) + 'px';

      // Check for potential snap targets and update visual feedback (highlight/indicator)
      checkAndHighlightForVisuals();
  }

  function handleMouseUp(event) {
      if (!isDraggingBlock || !currentDraggedBlock) return;

      const blockReleased = currentDraggedBlock;
      const releasedRect = blockReleased.getBoundingClientRect(); // Get final position
      const programmingArea = document.getElementById('program-blocks');

      let finalTarget = null;
      let finalDirection = null;
      let finalMinDistance = CONFIG.CONNECT_THRESHOLD + 1; // Start above threshold

      if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Releasing ${blockReleased.id}. Performing final proximity check...`);

      // --- Perform Final Proximity Check at Release Position ---
      if (programmingArea) {
          const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                        .filter(block => block.offsetParent !== null && block !== blockReleased); // Exclude self

          for (const targetBlock of allVisibleBlocks) {
              if (!targetBlock.id) generateUniqueId(targetBlock);
              const targetRect = targetBlock.getBoundingClientRect();
              const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
              const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');

              // Use the utility function with the *released* block's final position
              const snapInfo = calculateSnapInfo(releasedRect, targetRect);

              if (snapInfo) { // If within threshold and sufficient overlap
                  let connectionAllowed = true;
                  // Check if target side is already occupied
                  if (snapInfo.direction === 'left' && targetConnectedLeft) connectionAllowed = false;
                  else if (snapInfo.direction === 'right' && targetConnectedRight) connectionAllowed = false;

                  // If connection is allowed and this target is the closest so far
                  if (connectionAllowed && snapInfo.distance < finalMinDistance) {
                      finalMinDistance = snapInfo.distance;
                      finalTarget = targetBlock;
                      finalDirection = snapInfo.direction;
                  }
              }
          } // End loop through potential targets
      }
      // --- End Final Proximity Check ---


      // --- Cleanup Drag State (Always perform) ---
      isDraggingBlock = false;
      currentDraggedBlock = null;
      potentialSnapTargetForVisuals = null; // Clear visual state variables
      snapDirectionForVisuals = null;
      document.body.classList.remove('user-select-none');
      blockReleased.classList.remove('snap-source');
      blockReleased.style.zIndex = ''; // Reset z-index

      // Remove any lingering visual highlights from all blocks
      document.querySelectorAll('.snap-target').forEach(el => {
          el.classList.remove('snap-target', 'snap-left', 'snap-right');
      });
      removeFuturePositionIndicator(); // Ensure blue indicator is hidden
      // --- End Cleanup ---


      // --- Decide and Perform Snap (Based on Final Check) ---
      if (finalTarget && finalDirection) {
          // Valid target found within threshold AT RELEASE
          if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Final check PASSED. Snapping ${blockReleased.id} to ${finalTarget.id} (${finalDirection}). Distance: ${finalMinDistance.toFixed(1)}px`);

          // Execute the snap (this function handles positioning and attribute setting)
          const snapSuccess = performBlockSnap(blockReleased, finalTarget, finalDirection);

          if (!snapSuccess) {
              // Snap failed for some internal reason (e.g., target removed concurrently)
              blockReleased.draggable = true; // Make it draggable again
              if (CONFIG.DEBUG) console.warn(`[MouseUp - Protected] Snap attempt failed unexpectedly. Block ${blockReleased.id} remains draggable.`);
          } else {
              // Snap succeeded, block is now connected and should be non-draggable
              if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Snap successful. Block ${blockReleased.id} is connected.`);
              // performBlockSnap should set draggable = false
          }
      } else {
          // No valid target found within threshold at release
          if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Final check FAILED (No target within ${CONFIG.CONNECT_THRESHOLD}px at release). No snap performed.`);
          // Ensure the released block is draggable if it's not connected
          blockReleased.draggable = true;
      }

      if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] ----- End MouseUp for ${blockReleased.id} -----`);
  }

  function handleMouseLeave(event) {
      // If the mouse leaves the document element entirely while dragging
      if (isDraggingBlock && event.target === document.documentElement && !event.relatedTarget) {
          if (CONFIG.DEBUG) console.warn("Mouse left document during drag, triggering MouseUp.");
          handleMouseUp(event); // Treat as if the mouse button was released
      }
  }

  // ========================================================================
  // Snap Calculation and Visual Feedback Logic
  // ========================================================================

  // Calculates potential snap based on proximity and overlap.
  // Returns { direction, distance } if a potential snap is viable within CONNECT_THRESHOLD, else null.
  function calculateSnapInfo(sourceRect, targetRect) {
      // 1. Check for sufficient vertical overlap
      const topOverlap = Math.max(sourceRect.top, targetRect.top);
      const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
      const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
      const minHeightReq = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;

      if (verticalOverlap < minHeightReq || verticalOverlap <= 0) {
          return null; // Not enough vertical overlap
      }

      // 2. Calculate horizontal distances between relevant edges
      let distance, direction;
      // Distance from source's right edge to target's left edge
      const distRightToLeft = Math.abs(sourceRect.right - targetRect.left);
      // Distance from source's left edge to target's right edge
      const distLeftToRight = Math.abs(sourceRect.left - targetRect.right);

      // 3. Determine the closer connection possibility
      if (distRightToLeft < distLeftToRight) {
          distance = distRightToLeft;
          direction = 'left'; // Source snaps to the LEFT of the target
      } else {
          distance = distLeftToRight;
          direction = 'right'; // Source snaps to the RIGHT of the target
      }

      // 4. Check if the distance is within the connection threshold
      if (distance <= CONFIG.CONNECT_THRESHOLD) {
          // Potential connection is viable
          return { direction, distance };
      } else {
          // Too far apart horizontally
          return null;
      }
  }

  // Called during MouseMove to update visual highlights (yellow halo, blue indicator)
  function checkAndHighlightForVisuals() {
      if (!currentDraggedBlock) return;
      const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
      const sourceRect = currentDraggedBlock.getBoundingClientRect();
      const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                    .filter(block => block.offsetParent !== null); // Only check visible blocks

      let bestTarget = null;
      let bestDirection = null;
      let minDistance = CONFIG.CONNECT_THRESHOLD + 1; // Start above threshold

      // --- Reset current visual state ---
      // Remove halo from previously highlighted target (if any)
      if (potentialSnapTargetForVisuals && document.body.contains(potentialSnapTargetForVisuals)) {
         potentialSnapTargetForVisuals.classList.remove('snap-target', 'snap-left', 'snap-right');
      }
      potentialSnapTargetForVisuals = null; // Reset global state for visuals
      snapDirectionForVisuals = null;
      removeFuturePositionIndicator(); // Hide blue indicator by default
      // --- End Reset ---

      // --- Find the best potential target for visual feedback ---
      for (const targetBlock of allVisibleBlocks) {
          if (!targetBlock.id) generateUniqueId(targetBlock); // Ensure target has an ID
          const targetRect = targetBlock.getBoundingClientRect();
          const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
          const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');

          const snapInfo = calculateSnapInfo(sourceRect, targetRect); // Check proximity and overlap

          if (snapInfo) { // If within threshold and overlaps sufficiently
              let connectionAllowed = true;
              // Check if the target side is already occupied
              if (snapInfo.direction === 'left' && targetConnectedLeft) connectionAllowed = false;
              else if (snapInfo.direction === 'right' && targetConnectedRight) connectionAllowed = false;

              // If connection is allowed and this target is the closest found so far
              if (connectionAllowed && snapInfo.distance < minDistance) {
                  minDistance = snapInfo.distance;
                  bestTarget = targetBlock;
                  bestDirection = snapInfo.direction;
              }
          }
      } // --- End loop through potential targets ---

      // --- Apply Visual Feedback if a best target was found ---
      if (bestTarget) {
          // Store the best target for visuals (used for cleanup)
          potentialSnapTargetForVisuals = bestTarget;
          snapDirectionForVisuals = bestDirection;

          // Add the yellow halo class to the best target
          bestTarget.classList.add('snap-target', bestDirection === 'left' ? 'snap-left' : 'snap-right');
          if (CONFIG.DEBUG > 1) console.log(`[Visuals] Highlight ON for ${bestTarget.id}`);

          // Show the blue dashed indicator only if within the tighter threshold
          if (minDistance <= CONFIG.INDICATOR_TOUCH_THRESHOLD) {
              if (CONFIG.DEBUG > 1) console.log(`[Visuals] Indicator ON (dist ${minDistance.toFixed(1)} <= ${CONFIG.INDICATOR_TOUCH_THRESHOLD})`);
              updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programmingArea.getBoundingClientRect());
          } else {
              removeFuturePositionIndicator(); // Ensure it's hidden if not close enough
              if (CONFIG.DEBUG > 1) console.log(`[Visuals] Indicator OFF (dist ${minDistance.toFixed(1)} > ${CONFIG.INDICATOR_TOUCH_THRESHOLD})`);
          }
      } else {
           // No suitable target found, ensure indicator is off
           removeFuturePositionIndicator();
           if (CONFIG.DEBUG > 1) console.log(`[Visuals] No target within ${CONFIG.CONNECT_THRESHOLD}px for highlight.`);
      }
  }

  // ========================================================================
  // Core Snap/Detach Actions and Effects
  // ========================================================================

  // Performs the actual connection between two blocks
  function performBlockSnap(sourceBlock, targetBlock, direction) {
      // Safety checks
      if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock) || targetBlock.offsetParent === null) {
          console.error("[PerformSnap] Invalid block(s) or target not visible. Snap cancelled.", { sourceBlock, targetBlock });
          return false; // Indicate failure
      }
       // Final check for connection conflicts (important for race conditions)
       if ((direction === 'left' && targetBlock.hasAttribute('data-connected-from-left')) ||
           (direction === 'right' && targetBlock.hasAttribute('data-connected-from-right'))) {
           console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} side '${direction}' became occupied just before snap.`);
           return false; // Indicate failure due to conflict
       }

      if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);

      try {
          const sourceRect = sourceBlock.getBoundingClientRect(); // Use current rect for width/height info
          const targetRect = targetBlock.getBoundingClientRect();
          const programmingArea = document.getElementById('program-blocks');
          const areaRect = programmingArea.getBoundingClientRect();

          // Calculate the final absolute position for the source block
          let finalPixelLeft, finalPixelTop;

          if (direction === 'left') { // Source snaps to the LEFT of the target
              finalPixelLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
          } else { // Source snaps to the RIGHT of the target
              finalPixelLeft = targetRect.right + CONFIG.BLOCK_GAP;
          }
          // Align tops (can be adjusted for center alignment if needed)
          finalPixelTop = targetRect.top;

          // Convert absolute screen pixels to style values relative to the programming area, including scroll
          let styleLeft = finalPixelLeft - areaRect.left + programmingArea.scrollLeft;
          let styleTop = finalPixelTop - areaRect.top + programmingArea.scrollTop;

          // --- Apply final position and styles ---
          sourceBlock.style.position = 'absolute'; // Ensure it's absolute
          sourceBlock.style.left = `${Math.round(styleLeft)}px`;
          sourceBlock.style.top = `${Math.round(styleTop)}px`;
          sourceBlock.style.margin = '0'; // Remove margin
          sourceBlock.style.zIndex = ''; // Reset z-index after snap

          // --- Update connection attributes ---
          // Source block remembers what it connected TO
          sourceBlock.setAttribute('data-connected-to', targetBlock.id);
          sourceBlock.setAttribute('data-connection-direction', direction); // 'left' or 'right' relative to target

          // Target block remembers what connected FROM its side
          targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);

          // --- Add CSS classes for potential styling ---
          sourceBlock.classList.add('connected-block');
          targetBlock.classList.add('has-connected-block'); // Target now has a neighbor

          // --- Final steps ---
          playSnapSound(); // Play the connection sound
          addSnapEffectAnimation(sourceBlock); // Add visual snap animation
          sourceBlock.draggable = false; // Make the source block non-draggable now it's connected

          if (CONFIG.DEBUG) console.log(`[PerformSnap] Success. ${sourceBlock.id} final pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}. Draggable: ${sourceBlock.draggable}`);
          return true; // Indicate success

      } catch (err) {
          console.error(`[PerformSnap] Error during snap (${sourceBlock.id} -> ${targetBlock.id}):`, err);
          // Attempt to clean up if snap failed mid-way
          try {
              detachBlock(sourceBlock, false); // Try to detach silently
          } catch (detachErr) {
              console.error(`[PerformSnap] Error during cleanup detach:`, detachErr);
          }
          sourceBlock.draggable = true; // Ensure it's draggable after failure
          return false; // Indicate failure
      }
  }

  // Detaches a block from its connected neighbor
  function detachBlock(blockToDetach, playAnimation = true) {
      if (!blockToDetach) {
        console.warn("[Detach] Attempted to detach null block.");
        return;
      }
      // Find the block it was connected TO
      const targetId = blockToDetach.getAttribute('data-connected-to');
      const direction = blockToDetach.getAttribute('data-connection-direction');

      if (!targetId || !direction) {
          // Block wasn't actually connected, just ensure attributes are clean
          blockToDetach.removeAttribute('data-connected-to');
          blockToDetach.removeAttribute('data-connection-direction');
          blockToDetach.classList.remove('connected-block');
          blockToDetach.draggable = true; // Ensure free blocks are draggable
          // console.warn(`[Detach] Block ${blockToDetach.id} had no connection data. Cleaned up.`);
          return;
      }

      if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${blockToDetach.id} from ${targetId} (direction: ${direction})`);

      // 1. Clear connection attributes from the block being detached
      blockToDetach.removeAttribute('data-connected-to');
      blockToDetach.removeAttribute('data-connection-direction');
      blockToDetach.classList.remove('connected-block');
      blockToDetach.draggable = true; // Make it draggable again

      // 2. Clear connection attribute from the target block
      const targetBlock = document.getElementById(targetId);
      if (targetBlock) {
          const attributeToRemove = (direction === 'left') ? 'data-connected-from-left' : 'data-connected-from-right';
          targetBlock.removeAttribute(attributeToRemove);

          // Check if the target block still has any connections left
          const stillHasConnections =
              targetBlock.hasAttribute('data-connected-from-left') ||
              targetBlock.hasAttribute('data-connected-from-right') ||
              targetBlock.hasAttribute('data-connected-to'); // Check if it's connected TO another block

          if (!stillHasConnections) {
              targetBlock.classList.remove('has-connected-block');
          }
          if (CONFIG.DEBUG > 1) console.log(`[Detach] Removed attribute ${attributeToRemove} from target ${targetId}. Target still connected: ${stillHasConnections}`);
      } else {
          console.warn(`[Detach] Target block with ID ${targetId} not found in DOM during detach.`);
      }

      // 3. Optionally play detach animation
      if (playAnimation) {
          addDetachEffectAnimation(blockToDetach);
      }

      if (CONFIG.DEBUG) console.log(`[Detach] Finished detaching ${blockToDetach.id}. Draggable: ${blockToDetach.draggable}`);
  }

  // Updates the position and visibility of the blue dashed indicator
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programmingAreaRect) {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;

      // Create indicator if it doesn't exist
      if (!futureIndicator) {
          futureIndicator = document.createElement('div');
          futureIndicator.id = 'future-position-indicator';
          futureIndicator.className = 'future-position-indicator'; // Base class from styles
          programmingArea.appendChild(futureIndicator);
          if (CONFIG.DEBUG > 1) console.log("Created future position indicator.");
      }

      try {
          const sourceRect = sourceBlock.getBoundingClientRect();
          const targetRect = targetBlock.getBoundingClientRect();

          // Calculate the theoretical final position (same logic as performBlockSnap)
          let desiredVisualLeft, desiredVisualTop;
          if (direction === 'left') {
              desiredVisualLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
          } else {
              desiredVisualLeft = targetRect.right + CONFIG.BLOCK_GAP;
          }
          desiredVisualTop = targetRect.top; // Align tops

          // Convert to style values relative to programming area with scroll
          let indicatorStyleLeft = desiredVisualLeft - programmingAreaRect.left + programmingArea.scrollLeft;
          let indicatorStyleTop = desiredVisualTop - programmingAreaRect.top + programmingArea.scrollTop;

          // Apply styles to the indicator div
          futureIndicator.style.left = `${Math.round(indicatorStyleLeft)}px`;
          futureIndicator.style.top = `${Math.round(indicatorStyleTop)}px`;
          futureIndicator.style.width = `${Math.round(sourceRect.width)}px`;
          futureIndicator.style.height = `${Math.round(sourceRect.height)}px`;

          // Make it visible
          futureIndicator.classList.add('visible');

      } catch (err) {
          console.error('Error updating future position indicator:', err);
          removeFuturePositionIndicator(); // Hide indicator on error
      }
  }

  // Hides the blue dashed indicator
  function removeFuturePositionIndicator() {
      if (futureIndicator) {
          futureIndicator.classList.remove('visible');
          // Optional: Could set display:none after transition if needed
          // setTimeout(() => {
          //    if (!futureIndicator.classList.contains('visible')) futureIndicator.style.display = 'none';
          // }, 200); // Match transition duration
      }
  }

  // Shows the context menu for detaching
  function handleContextMenu(event) {
      event.preventDefault(); // Prevent default browser context menu
      const block = event.target.closest('.block-container');

      // Show menu only if the block is actually connected to something
      if (block && block.hasAttribute('data-connected-to')) {
          showDetachMenu(event.clientX, event.clientY, block);
      } else {
          removeDetachMenu(); // Ensure no old menu is visible
      }
  }

  function showDetachMenu(x, y, blockToDetach) {
      removeDetachMenu(); // Remove any existing menu first

      const menu = document.createElement('div');
      menu.id = 'detach-menu';
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;

      const option = document.createElement('div');
      option.textContent = 'נתק בלוק'; // "Detach Block"
      option.onclick = (e) => {
          e.stopPropagation(); // Prevent click from closing menu immediately
          detachBlock(blockToDetach, true); // Detach with animation
          removeDetachMenu();
      };
      menu.appendChild(option);

      document.body.appendChild(menu);

      // Add listeners to close the menu when clicking outside or scrolling
      setTimeout(() => { // Use timeout to avoid immediate closing by the same click
          document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
          window.addEventListener('scroll', removeDetachMenu, { capture: true, once: true });
      }, 0);
  }

  // Closes the detach menu if a click occurs outside it
  function closeMenuOutside(event) {
      const menu = document.getElementById('detach-menu');
      // Check if menu exists and the click was outside it
      if (menu && !menu.contains(event.target)) {
          removeDetachMenu();
      } else if (menu) {
          // If click was inside, re-attach listener for next click
          // Need to remove the 'once:true' listener and add a new one
          window.removeEventListener('scroll', removeDetachMenu, { capture: true }); // Remove scroll listener too
          setTimeout(() => {
            document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
            window.addEventListener('scroll', removeDetachMenu, { capture: true, once: true });
          }, 0);
      } else {
         // Menu already removed, clean up listeners just in case
         window.removeEventListener('scroll', removeDetachMenu, { capture: true });
      }
  }

  // Removes the detach context menu from the DOM and cleans up listeners
  function removeDetachMenu() {
      const menu = document.getElementById('detach-menu');
      if (menu) {
          document.removeEventListener('click', closeMenuOutside, { capture: true });
          window.removeEventListener('scroll', removeDetachMenu, { capture: true });
          menu.remove();
      }
  }

  // Adds a short snap animation class
  function addSnapEffectAnimation(block) {
      block.classList.remove('snap-animation'); // Remove first to allow re-triggering
      void block.offsetWidth; // Force reflow to restart animation
      block.classList.add('snap-animation');
      block.addEventListener('animationend', () => block.classList.remove('snap-animation'), { once: true });
  }

  // Adds a short detach animation class
  function addDetachEffectAnimation(block) {
      block.classList.remove('detach-animation');
      void block.offsetWidth;
      block.classList.add('detach-animation');
      block.addEventListener('animationend', () => block.classList.remove('detach-animation'), { once: true });
  }

  // ========================================================================
  // Utility Functions
  // ========================================================================

  // Generates a unique ID for a block element if it doesn't have one
  function generateUniqueId(blockElement) {
      if (blockElement.id) return blockElement.id; // Return existing ID

      const prefix = blockElement.dataset.type || 'block'; // Use block type or default
      let randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      let newId = `${prefix}-${randomSuffix}`;
      let attempts = 0;

      // Ensure ID is truly unique within the document
      while (document.getElementById(newId) && attempts < 10) {
          newId = `${prefix}-${randomSuffix}-${attempts}`;
          attempts++;
      }
      // Fallback if somehow still not unique
      if (attempts >= 10) {
         newId = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }

      blockElement.id = newId;
      if (CONFIG.DEBUG > 1) console.log(`Generated unique ID: ${newId}`);
      return newId;
  }


  // ========================================================================
  // System Initialization
  // ========================================================================
  function initializeSystem() {
      // Use a version-specific flag to prevent multiple initializations
      const initFlag = 'blockLinkageInitialized_v4_1_Protected';
      if (window[initFlag]) {
          if (CONFIG.DEBUG) console.log(`Block linkage system ${initFlag} already initialized. Skipping.`);
          return;
      }

      if (CONFIG.DEBUG) console.log(`Initializing Block Linkage System (${initFlag})...`);

      addHighlightStyles();            // Inject CSS for visual feedback
      initAudio();                     // Set up the snap sound element
      initProgrammingAreaListeners();  // Add listeners to the main drop zone
      observeNewBlocks();              // Watch for blocks added dynamically
      initExistingBlocks();            // Add listeners to blocks already present on load
      initGlobalMouseListeners();      // Add document-level mouse move/up listeners

      // Add the sound test button if sound is enabled
      if (CONFIG.PLAY_SOUND) {
          // Delay slightly to ensure DOM is fully ready and styles applied
          setTimeout(addSoundTestButton, 100);
      }

      window[initFlag] = true; // Mark this version as initialized
      console.log(`Block linkage system initialized (${initFlag})`);
      console.log(`Configuration: Snap Threshold=${CONFIG.CONNECT_THRESHOLD}px, Indicator Threshold=${CONFIG.INDICATOR_TOUCH_THRESHOLD}px, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // Run initialization when the DOM is ready
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
      // DOM is already ready, run immediately
      initializeSystem();
  }

})(); // End of IIFE (Immediately Invoked Function Expression)

// --- END OF FILE linkageimproved.js ---
