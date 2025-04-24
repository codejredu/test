// --- START OF FILE puzzle-blocks-linkage.js ---
// --- Version 1.0: Puzzle Block Connection System ---
// Specialized for blocks with puzzle-like connectors (pins and sockets)

(function() {
  // Global module variables
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;
  let lastHighlightTime = 0;

  // Configuration - parameters that can be adjusted
  const CONFIG = {
    CONNECT_THRESHOLD: 25,        // Increased threshold for easier connections
    VERTICAL_ALIGN_THRESHOLD: 15, // How close vertically blocks should be
    BLOCK_GAP: 0,                 // No gap between connected blocks
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true,                  // Enable for debugging
    PIN_DETECTION_WIDTH: 20,      // Width to check for pin/socket detection
    ANIMATE_CONNECTIONS: true,    // Enable smooth animation when connecting
    CONNECTION_ANIMATION_SPEED: 200 // ms for connection animation
  };

  // ========================================================================
  // Add CSS styles - focus on puzzle connection visuals
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('puzzle-connection-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'puzzle-connection-styles';
    style.textContent = `
      .snap-source { 
        filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5));
        transition: filter 0.15s ease-out; 
        cursor: grabbing !important; 
        z-index: 1001 !important; 
      }
      .snap-target { 
        outline: 6px solid #FFC107 !important; 
        outline-offset: 2px; 
        filter: drop-shadow(0 0 10px rgba(255,193,7,0.8));
        transition: outline 0.1s ease-out, filter 0.1s ease-out; 
        z-index: 999 !important; 
      }
      .future-position-indicator { 
        position: absolute; 
        border: 3px dashed rgba(0,120,255,0.95) !important; 
        border-radius: 5px; 
        background-color: rgba(0,120,255,0.15) !important; 
        pointer-events: none; 
        z-index: 998; 
        opacity: 0; 
        transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear; 
        display: none; 
      }
      .future-position-indicator.visible { 
        display: block; 
        opacity: 0.9; 
      }
      .snap-target.snap-left::before, .snap-target.snap-socket::before { 
        content: ''; 
        position: absolute; 
        left: -3px; 
        top: 30%; 
        bottom: 30%; 
        width: 8px; 
        background-color: #FFC107; 
        border-radius: 2px; 
        z-index: 1000; 
        filter: drop-shadow(0 0 5px rgba(255,193,7,0.8));
        transition: all 0.1s ease-out; 
      }
      .snap-target.snap-right::after, .snap-target.snap-pin::after { 
        content: ''; 
        position: absolute; 
        right: -3px; 
        top: 30%; 
        bottom: 30%; 
        width: 8px; 
        background-color: #FFC107; 
        border-radius: 2px; 
        z-index: 1000; 
        filter: drop-shadow(0 0 5px rgba(255,193,7,0.8));
        transition: all 0.1s ease-out; 
      }
      @keyframes snapEffect { 
        0% {transform: scale(1)} 
        35% {transform: scale(1.05)} 
        70% {transform: scale(0.98)} 
        100% {transform: scale(1)} 
      } 
      .snap-animation { 
        animation: snapEffect 0.3s ease-out; 
      }
      @keyframes detachEffect { 
        0% {transform: translate(0,0) rotate(0)} 
        30% {transform: translate(3px,1px) rotate(0.8deg)} 
        60% {transform: translate(-2px,2px) rotate(-0.5deg)} 
        100% {transform: translate(0,0) rotate(0)} 
      } 
      .detach-animation { 
        animation: detachEffect 0.3s ease-in-out; 
      }
      #detach-menu { 
        position: absolute; 
        background-color: white; 
        border: 1px solid #ccc; 
        border-radius: 4px; 
        box-shadow: 0 3px 8px rgba(0,0,0,0.2); 
        z-index: 1100; 
        padding: 5px; 
        font-size: 14px; 
        min-width: 100px; 
      } 
      #detach-menu div { 
        padding: 6px 12px; 
        cursor: pointer; 
        border-radius: 3px; 
      } 
      #detach-menu div:hover { 
        background-color: #eee; 
      }
      body.user-select-none { 
        user-select: none; 
        -webkit-user-select: none; 
        -moz-user-select: none; 
        -ms-user-select: none; 
      }
      .pin-indicator, .socket-indicator {
        position: absolute;
        top: 40%;
        height: 20%;
        width: 10px;
        background-color: rgba(255,193,7,0.5);
        filter: drop-shadow(0 0 3px rgba(255,193,7,0.5));
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
      }
      .pin-indicator {
        right: -5px;
        border-radius: 0 3px 3px 0;
      }
      .socket-indicator {
        left: -5px;
        border-radius: 3px 0 0 3px;
      }
      .snap-highlight .pin-indicator,
      .snap-highlight .socket-indicator {
        opacity: 1;
      }
      /* Additional styles for puzzle pieces - adapt to your specific blocks */
      .puzzle-block.connected-pin {
        margin-right: -5px !important; /* Adjust based on your pin width */
      }
      .puzzle-block.connected-socket {
        margin-left: -5px !important; /* Adjust based on your socket width */
      }
    `;
    
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Puzzle block styles added');
  }

  // ========================================================================
  // Audio initialization and playback
  // ========================================================================
  function initAudio() {
    if (!CONFIG.PLAY_SOUND || soundInitialized) return;
    
    try {
      const existingElement = document.getElementById('snap-sound-element');
      if (existingElement) {
        snapSound = existingElement;
        soundInitialized = true;
        
        if (CONFIG.DEBUG) console.log('Audio reused.');
        
        if (!existingElement.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)) {
          existingElement.innerHTML = '';
          const source = document.createElement('source');
          source.src = CONFIG.SOUND_PATH;
          source.type = 'audio/mpeg';
          existingElement.appendChild(source);
          existingElement.load();
        }
        return;
      }
      
      snapSound = document.createElement('audio');
      snapSound.id = 'snap-sound-element';
      snapSound.preload = 'auto';
      snapSound.volume = CONFIG.SOUND_VOLUME;
      
      const source = document.createElement('source');
      source.src = CONFIG.SOUND_PATH;
      source.type = 'audio/mpeg';
      snapSound.appendChild(source);
      
      snapSound.addEventListener('error', (e) => {
        console.error(`Audio Error: ${CONFIG.SOUND_PATH}`, e);
        CONFIG.PLAY_SOUND = false;
        snapSound = null;
        soundInitialized = false;
      });
      
      snapSound.addEventListener('canplaythrough', () => {
        soundInitialized = true;
        if (CONFIG.DEBUG) console.log('Audio ready.');
      });
      
      snapSound.style.display = 'none';
      document.body.appendChild(snapSound);
      
      if (CONFIG.DEBUG) console.log(`Audio created: ${CONFIG.SOUND_PATH}`);
      
    } catch (err) {
      console.error('Audio init error:', err);
      CONFIG.PLAY_SOUND = false;
      snapSound = null;
      soundInitialized = false;
    }
  }
  
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) return;
    
    try {
      if (snapSound.readyState < 3) {
        if (CONFIG.DEBUG) console.log('Snap sound skip: audio not ready.');
        return;
      }
      
      snapSound.pause();
      snapSound.currentTime = 0;
      
      const playPromise = snapSound.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audioContextAllowed = true;
          if (CONFIG.DEBUG > 1) console.log('Snap sound played.');
        }).catch(err => {
          if (err.name === 'NotAllowedError') {
            console.warn('Snap sound blocked by browser.');
            audioContextAllowed = false;
          } else if (err.name !== 'AbortError') {
            console.error('Error playing snap sound:', err);
          }
        });
      }
    } catch (err) {
      console.error('Unexpected play sound error:', err);
    }
  }

  // ========================================================================
  // Block Identification and Event Listeners
  // ========================================================================
  
  // Find all blocks in the programming area
  function findPuzzleBlocks() {
    const blocks = document.querySelectorAll('#program-blocks .block-container');
    
    if (CONFIG.DEBUG) console.log(`Found ${blocks.length} puzzle blocks`);
    
    return blocks;
  }
  
  // Initialize existing blocks
  function initExistingBlocks() {
    const blocks = findPuzzleBlocks();
    
    blocks.forEach(block => {
      if (!block.id) {
        generateUniqueId(block);
      }
      
      // Look for pin/socket indicators or add them
      addPinSocketIndicators(block);
      
      // Add event listeners
      addBlockDragListeners(block);
    });
    
    if (CONFIG.DEBUG) console.log(`Initialized ${blocks.length} existing puzzle blocks`);
  }
  
  // Add visual indicators for pins and sockets if they don't exist
  function addPinSocketIndicators(block) {
    // Only add if they don't exist
    if (!block.querySelector('.pin-indicator')) {
      const pin = document.createElement('div');
      pin.className = 'pin-indicator';
      block.appendChild(pin);
    }
    
    if (!block.querySelector('.socket-indicator')) {
      const socket = document.createElement('div');
      socket.className = 'socket-indicator';
      block.appendChild(socket);
    }
  }
  
  // Add event listeners to block
  function addBlockDragListeners(block) {
    block.removeEventListener('mousedown', handleMouseDown);
    block.addEventListener('mousedown', handleMouseDown);
    
    block.removeEventListener('contextmenu', handleContextMenu);
    block.addEventListener('contextmenu', handleContextMenu);
    
    if (CONFIG.DEBUG > 1) console.log(`Added listeners to block: ${block.id}`);
  }
  
  // Watch for new blocks
  function observeNewBlocks() {
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              // Check if it's a block container or contains one
              const block = node.classList?.contains('block-container') ? 
                          node : 
                          node.querySelector?.('.block-container');
                                
              if (block && block.closest('#program-blocks')) {
                if (!block.id) {
                  generateUniqueId(block);
                }
                
                addPinSocketIndicators(block);
                addBlockDragListeners(block);
                
                if (CONFIG.DEBUG) console.log(`Added new puzzle block: ${block.id}`);
              }
            }
          });
        }
      });
    });
    
    observer.observe(programArea, {childList: true, subtree: true});
    
    if (CONFIG.DEBUG) console.log("MutationObserver watching for new puzzle blocks");
  }
  
  // Initialize programming area
  function initProgrammingAreaListeners() {
    const area = document.getElementById('program-blocks');
    if (!area) return;
    
    // Prevent default drag behavior
    area.addEventListener('dragover', (e) => e.preventDefault());
    area.addEventListener('dragstart', (e) => {
      if (e.target?.closest?.('#program-blocks .block-container')) e.preventDefault();
    });
  }

  // ========================================================================
  // Mouse Event Handlers
  // ========================================================================
  
  function handleContextMenu(e) {
    e.preventDefault();
    
    const block = e.target.closest('.block-container');
    
    if (block?.hasAttribute('data-connected-to')) {
      showDetachMenu(e.clientX, e.clientY, block);
    }
  }
  
  function handleMouseDown(e) {
    // Skip if not left click or clicked on interactive element
    if (e.button !== 0 || !e.target.closest || e.target.matches('input,button,select,textarea,a[href]')) return;
    
    const block = e.target.closest('.block-container');
    
    // Skip if not a valid block
    if (!block || !block.parentElement || block.parentElement.id !== 'program-blocks') return;
    
    // Ensure ID exists
    if (!block.id) generateUniqueId(block);
    
    e.preventDefault();
    block.draggable = false;
    
    if (CONFIG.DEBUG) console.log(`[MouseDown] Start drag puzzle block: ${block.id}`);
    
    // Detach this block if it's connected to another
    if (block.hasAttribute('data-connected-to')) detachBlock(block, false);
    
    // Detach any blocks connected to this one
    const leftId = block.getAttribute('data-connected-from-left');
    if (leftId) detachBlock(document.getElementById(leftId), false);
    
    const rightId = block.getAttribute('data-connected-from-right');
    if (rightId) detachBlock(document.getElementById(rightId), false);
    
    // Set drag state
    currentDraggedBlock = block;
    isDraggingBlock = true;
    
    // Calculate drag offset (where within the block was clicked)
    const rect = block.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    // Position block absolutely if it's not already
    const programElement = document.getElementById('program-blocks');
    const programRect = programElement.getBoundingClientRect();
    
    if (window.getComputedStyle(block).position !== 'absolute') {
      block.style.position = 'absolute';
      block.style.left = (rect.left - programRect.left + programElement.scrollLeft) + 'px';
      block.style.top = (rect.top - programRect.top + programElement.scrollTop) + 'px';
    }
    
    block.style.margin = '0';
    block.style.zIndex = '1001';
    block.classList.add('snap-source');
    document.body.classList.add('user-select-none');
    
    // Add global listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp, { once: true });
    document.addEventListener('mouseleave', handleMouseLeave);
  }
  
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    
    e.preventDefault();
    
    const programElement = document.getElementById('program-blocks');
    if (!programElement) {
      handleMouseUp(e);
      return;
    }
    
    const programRect = programElement.getBoundingClientRect();
    
    // Calculate new position
    let newLeft = e.clientX - programRect.left - dragOffset.x + programElement.scrollLeft;
    let newTop = e.clientY - programRect.top - dragOffset.y + programElement.scrollTop;
    
    // Keep within bounds
    const blockWidth = currentDraggedBlock.offsetWidth;
    const blockHeight = currentDraggedBlock.offsetHeight;
    const scrollWidth = programElement.scrollWidth;
    const scrollHeight = programElement.scrollHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, scrollWidth - blockWidth));
    newTop = Math.max(0, Math.min(newTop, scrollHeight - blockHeight));
    
    // Update position
    currentDraggedBlock.style.left = Math.round(newLeft) + 'px';
    currentDraggedBlock.style.top = Math.round(newTop) + 'px';
    
    // Throttle highlight checking to improve performance
    const now = Date.now();
    if (now - lastHighlightTime > 30) { // Check every 30ms (about 33fps)
      checkAndHighlightSnapPossibility();
      lastHighlightTime = now;
    }
  }
  
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    
    const blockReleased = currentDraggedBlock;
    const candidateTarget = potentialSnapTarget;
    const candidateDirection = snapDirection;
    
    if (CONFIG.DEBUG) {
      console.log(`[MouseUp] Releasing puzzle block ${blockReleased.id}. ` +
                  `Candidate target: ${candidateTarget?.id || 'none'}, ` +
                  `direction: ${candidateDirection || 'none'}`);
    }
    
    // Clean up
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseleave', handleMouseLeave);
    
    // Immediately clean up drag state and highlights
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source');
    blockReleased.style.zIndex = '';
    
    // Remove all highlights
    document.querySelectorAll('.snap-target').forEach(element => {
      element.classList.remove('snap-target', 'snap-left', 'snap-right',
                             'snap-pin', 'snap-socket', 'snap-highlight');
    });
    
    removeFuturePositionIndicator();
    
    // Decide whether to perform snap
    let performSnap = false;
    
    if (candidateTarget && candidateDirection && document.body.contains(candidateTarget)) {
      // We had a valid candidate during the drag, so attempt to snap
      if (CONFIG.DEBUG) {
        console.log(`[MouseUp] Valid candidate ${candidateTarget.id} identified during drag. Attempting snap.`);
      }
      performSnap = true;
      
      // If already connected, cancel snap
      if ((candidateDirection === 'left' && candidateTarget.hasAttribute('data-connected-from-left')) ||
          (candidateDirection === 'right' && candidateTarget.hasAttribute('data-connected-from-right'))) {
        if (CONFIG.DEBUG) {
          console.log(`[MouseUp] Target ${candidateTarget.id} already has a connection on ${candidateDirection} side. No snap.`);
        }
        performSnap = false;
      }
    } else {
      if (CONFIG.DEBUG) {
        console.log(`[MouseUp] No valid candidate target identified during drag. No snap.`);
      }
    }
    
    // Perform the snap if decided
    if (performSnap) {
      const snapSuccess = performBlockSnap(blockReleased, candidateTarget, candidateDirection);
      
      if (!snapSuccess) {
        // If snap failed for technical reasons, allow re-dragging
        blockReleased.draggable = true;
        
        if (CONFIG.DEBUG) {
          console.log(`[MouseUp] Snap attempt failed. Block ${blockReleased.id} remains draggable.`);
        }
      } else {
        // Snap successful, block is connected
        if (CONFIG.DEBUG) {
          console.log(`[MouseUp] Snap successful. Block ${blockReleased.id} is connected.`);
        }
      }
    } else {
      // No snap performed, block remains free
      if (CONFIG.DEBUG) {
        console.log(`[MouseUp] No snap performed. Block ${blockReleased.id} remains free.`);
      }
      
      blockReleased.draggable = true;
    }
  }
  
  function handleMouseLeave(e) {
    if (isDraggingBlock && e.target === document.documentElement && !e.relatedTarget) {
      if (CONFIG.DEBUG) console.warn("Mouse left document during drag, firing mouseup.");
      handleMouseUp(e);
    }
  }

  // ========================================================================
  // Snap Detection and Visual Feedback
  // ========================================================================
  
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;
    
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    
    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    
    // Get all potential targets that aren't the source
    const allPotentialTargets = Array.from(findPuzzleBlocks())
                               .filter(block => block !== currentDraggedBlock && block.offsetParent !== null);
    
    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1;
    
    // Reset highlights and global state before checking
    document.querySelectorAll('.snap-target').forEach(element => {
      element.classList.remove('snap-target', 'snap-left', 'snap-right', 
                             'snap-pin', 'snap-socket', 'snap-highlight');
    });
    
    potentialSnapTarget = null;
    snapDirection = null;
    removeFuturePositionIndicator();
    
    // Check each potential target
    for (const targetBlock of allPotentialTargets) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      
      const targetRect = targetBlock.getBoundingClientRect();
      const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');
      
      // Special puzzle piece snap calculation
      const snapInfo = calculatePuzzleSnapInfo(sourceRect, targetRect);
      
      if (snapInfo) {
        let connectionAllowed = true;
        
        if (snapInfo.direction === 'left' && targetConnectedLeft) connectionAllowed = false;
        else if (snapInfo.direction === 'right' && targetConnectedRight) connectionAllowed = false;
        
        if (connectionAllowed && snapInfo.distance < minDistance) {
          minDistance = snapInfo.distance;
          bestTarget = targetBlock;
          bestDirection = snapInfo.direction;
        }
      }
    }
    
    // If a suitable target is found within the threshold
    if (bestTarget) {
      if (CONFIG.DEBUG > 1) {
        console.log(`[Highlight] Threshold met (${CONFIG.CONNECT_THRESHOLD}px): ` +
                   `${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}). Activating visuals.`);
      }
      
      // Update global state for MouseUp
      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;
      
      // Activate highlights - use pin/socket specific classes
      const directionClass = bestDirection === 'left' ? 'snap-socket' : 'snap-pin';
      bestTarget.classList.add('snap-target', directionClass, 'snap-highlight');
      
      // Show indicator of future position
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection);
    }
  }
  
  function calculatePuzzleSnapInfo(sourceRect, targetRect) {
    // First check vertical alignment - puzzle pieces must be well-aligned
    const sourceMiddleY = sourceRect.top + sourceRect.height / 2;
    const targetMiddleY = targetRect.top + targetRect.height / 2;
    const verticalDistance = Math.abs(sourceMiddleY - targetMiddleY);
    
    // If vertical alignment is poor, no snap possible
    if (verticalDistance > CONFIG.VERTICAL_ALIGN_THRESHOLD) {
      return null;
    }
    
    // Calculate horizontal distances for pin/socket connections
    let distance, direction;
    
    // Source RIGHT pin to target LEFT socket
    const pinToSocketDist = Math.abs(sourceRect.right - targetRect.left);
    
    // Source LEFT socket to target RIGHT pin
    const socketToPinDist = Math.abs(sourceRect.left - targetRect.right);
    
    // Determine best connection direction
    if (pinToSocketDist < socketToPinDist) {
      distance = pinToSocketDist;
      direction = 'left'; // Source RIGHT (pin) connects to target LEFT (socket)
    } else {
      distance = socketToPinDist;
      direction = 'right'; // Source LEFT (socket) connects to target RIGHT (pin)
    }
    
    // Return snap info only if within threshold
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
      if (CONFIG.DEBUG > 1) {
        console.log(`[calculatePuzzleSnapInfo] Within threshold (${CONFIG.CONNECT_THRESHOLD}px): ` +
                   `dir=${direction}, dist=${distance.toFixed(1)}, vdist=${verticalDistance.toFixed(1)}`);
      }
      return { direction, distance, verticalDistance };
    }
    
    return null;
  }

  // ========================================================================
  // Visual Indicator Functions
  // ========================================================================
  
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction) {
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    
    // Create indicator if it doesn't exist
    if (!futureIndicator) {
      futureIndicator = document.createElement('div');
      futureIndicator.id = 'future-position-indicator';
      futureIndicator.className = 'future-position-indicator';
      programArea.appendChild(futureIndicator);
    }
    
    try {
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const programRect = programArea.getBoundingClientRect();
      
      // Calculate position based on pin/socket connection
      let destVisualLeft;
      
      if (direction === 'left') {
        // Source RIGHT (pin) connects to target LEFT (socket)
        destVisualLeft = targetRect.left - sourceRect.width + CONFIG.PIN_DETECTION_WIDTH;
      } else {
        // Source LEFT (socket) connects to target RIGHT (pin)
        destVisualLeft = targetRect.right - CONFIG.PIN_DETECTION_WIDTH;
      }
      
      // Align vertically
      let destVisualTop = targetRect.top;
      
      // Convert to position relative to programming area
      let indicatorLeft = destVisualLeft - programRect.left + programArea.scrollLeft;
      let indicatorTop = destVisualTop - programRect.top + programArea.scrollTop;
      
      // Update indicator style
      futureIndicator.style.left = Math.round(indicatorLeft) + 'px';
      futureIndicator.style.top = Math.round(indicatorTop) + 'px';
      futureIndicator.style.width = Math.round(sourceRect.width) + 'px';
      futureIndicator.style.height = Math.round(sourceRect.height) + 'px';
      
      // Show the indicator
      futureIndicator.classList.add('visible');
      
    } catch (err) {
      console.error('Error updating future position indicator:', err);
      removeFuturePositionIndicator();
    }
  }
  
  function removeFuturePositionIndicator() {
    if (futureIndicator) {
      futureIndicator.classList.remove('visible');
    }
  }

  // ========================================================================
  // Connection and Detachment Functions
  // ========================================================================
  
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock) || targetBlock.offsetParent === null) {
      console.error("[PerformSnap] Invalid block(s). Snap cancelled.");
      return false;
    }
    
    // Final check before changing anything
    if ((direction === 'left' && targetBlock.hasAttribute('data-connected-from-left')) || 
        (direction === 'right' && targetBlock.hasAttribute('data-connected-from-right'))) {
      console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} conflict on side '${direction}' just before snap.`);
      return false;
    }
    
    if (CONFIG.DEBUG) {
      console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);
    }
    
    try {
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const programElement = document.getElementById('program-blocks');
      const programRect = programElement.getBoundingClientRect();
      
      // Calculate exact position for puzzle piece connection
      let finalLeft;
      
      if (direction === 'left') {
        // Source RIGHT pin to target LEFT socket
        // Adjust position to account for pin/socket overlap
        finalLeft = targetRect.left - sourceRect.width + CONFIG.PIN_DETECTION_WIDTH;
      } else {
        // Source LEFT socket to target RIGHT pin
        finalLeft = targetRect.right - CONFIG.PIN_DETECTION_WIDTH;
      }
      
      // Align tops precisely
      const finalTop = targetRect.top;
      
      // Convert to local coordinates
      let styleLeft = finalLeft - programRect.left + programElement.scrollLeft;
      let styleTop = finalTop - programRect.top + programElement.scrollTop;
      
      // Animate the movement to the final position if configured
      if (CONFIG.ANIMATE_CONNECTIONS) {
        sourceBlock.style.transition = `left ${CONFIG.CONNECTION_ANIMATION_SPEED}ms ease-out, top ${CONFIG.CONNECTION_ANIMATION_SPEED}ms ease-out`;
      }
      
      // Set the final position
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = `${Math.round(styleLeft)}px`;
      sourceBlock.style.top = `${Math.round(styleTop)}px`;
      sourceBlock.style.margin = '0';
      
      // Update connection attributes
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      
      targetBlock.setAttribute(
        direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', 
        sourceBlock.id
      );
      
      // Add classes for styling - use pin/socket specific classes
      if (direction === 'left') {
        sourceBlock.classList.add('connected-block', 'connected-pin');
        targetBlock.classList.add('has-connected-block', 'connected-socket');
      } else {
        sourceBlock.classList.add('connected-block', 'connected-socket');
        targetBlock.classList.add('has-connected-block', 'connected-pin');
      }
      
      // Play sound effect
      playSnapSound();
      
      // Add animation effect
      addSnapEffectAnimation(sourceBlock);
      
      // Prevent dragging when connected
      sourceBlock.draggable = false;
      
      // Clear transition after animation completes
      if (CONFIG.ANIMATE_CONNECTIONS) {
        setTimeout(() => {
          sourceBlock.style.transition = '';
        }, CONFIG.CONNECTION_ANIMATION_SPEED + 50);
      }
      
      if (CONFIG.DEBUG) {
        console.log(`[PerformSnap] Success. ${sourceBlock.id} pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}. Draggable: ${sourceBlock.draggable}`);
      }
      
      return true;
      
    } catch (err) {
      console.error(`[PerformSnap] Error during snap for ${sourceBlock.id} -> ${targetBlock.id}:`, err);
      
      // Attempt to clean up on error
      try {
        detachBlock(sourceBlock, false);
      } catch (detachError) {
        console.error(`[PerformSnap] Cleanup detach error:`, detachError);
      }
      
      sourceBlock.draggable = true;
      return false;
    }
  }
  
  function detachBlock(blockToDetach, animate = true) {
    if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) return;
    
    const targetId = blockToDetach.getAttribute('data-connected-to');
    const direction = blockToDetach.getAttribute('data-connection-direction');
    
    if (!targetId || !direction) {
      console.warn(`[Detach] Missing data on ${blockToDetach.id}. Cleaning.`);
      blockToDetach.removeAttribute('data-connected-to');
      blockToDetach.removeAttribute('data-connection-direction');
      blockToDetach.classList.remove('connected-block', 'connected-pin', 'connected-socket');
      blockToDetach.draggable = true;
      return;
    }
    
    if (CONFIG.DEBUG) {
      console.log(`[Detach] Detaching block ${blockToDetach.id} from ${targetId}`);
    }
    
    // Remove connection attributes from source
    blockToDetach.removeAttribute('data-connected-to');
    blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block', 'connected-pin', 'connected-socket');
    blockToDetach.draggable = true;
    
    // Update target block
    const targetBlock = document.getElementById(targetId);
    
    if (targetBlock) {
      targetBlock.removeAttribute(
        direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right'
      );
      
      // Check if target still has any connections
      const hasOtherConnections = targetBlock.hasAttribute('data-connected-from-left') || 
                                 targetBlock.hasAttribute('data-connected-from-right') || 
                                 targetBlock.hasAttribute('data-connected-to');
      
      // Remove has-connected-block class if no remaining connections
      if (!hasOtherConnections) {
        targetBlock.classList.remove('has-connected-block', 'connected-pin', 'connected-socket');
      }
    } else {
      console.warn(`[Detach] Target ${targetId} not found.`);
    }
    
    // Play detach animation if requested
    if (animate) {
      addDetachEffectAnimation(blockToDetach);
    }
    
    if (CONFIG.DEBUG) {
      console.log(`[Detach] Finished ${blockToDetach.id}. Draggable: ${blockToDetach.draggable}`);
    }
  }
  
  function showDetachMenu(x, y, block) {
    // Remove any existing menu
    const existingMenu = document.getElementById('detach-menu');
    if (existingMenu) existingMenu.remove();
    
    // Create new menu
    const menu = document.createElement('div');
    menu.id = 'detach-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    // Add detach option
    const option = document.createElement('div');
    option.textContent = 'Detach Block';
    option.onclick = (e) => {
      e.stopPropagation();
      detachBlock(block, true);
      menu.remove();
    };
    
    menu.appendChild(option);
    document.body.appendChild(menu);
    
    // Add event listeners to close menu
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      }, {capture: true, once: true});
      
      window.addEventListener('scroll', function scrollClose() {
        menu.remove();
        window.removeEventListener('scroll', scrollClose);
      }, {capture: true, once: true});
    }, 0);
  }

  // ========================================================================
  // Animation and Utility Functions
  // ========================================================================
  
  function addSnapEffectAnimation(block) {
    // Remove existing animation if any
    block.classList.remove('snap-animation');
    
    // Force reflow to restart animation
    void block.offsetWidth;
    
    // Apply animation
    block.classList.add('snap-animation');
    
    // Clean up after animation ends
    block.addEventListener('animationend', () => {
      block.classList.remove('snap-animation');
    }, {once: true});
  }
  
  function addDetachEffectAnimation(block) {
    // Remove existing animation if any
    block.classList.remove('detach-animation');
    
    // Force reflow to restart animation
    void block.offsetWidth;
    
    // Apply animation
    block.classList.add('detach-animation');
    
    // Clean up after animation ends
    block.addEventListener('animationend', () => {
      block.classList.remove('detach-animation');
    }, {once: true});
  }
  
  function generateUniqueId(block) {
    if (block.id) return block.id;
    
    const prefix = block.dataset.type || 'puzzle-block';
    let suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    let id = `${prefix}-${suffix}`;
    
    // Ensure uniqueness
    let counter = 0;
    while (document.getElementById(id) && counter < 10) {
      id = `${prefix}-${suffix}-${counter++}`;
    }
    
    if (counter >= 10) {
      id = `${prefix}-${Date.now()}`;
    }
    
    block.id = id;
    
    if (CONFIG.DEBUG) {
      console.log(`Generated unique ID for puzzle block: ${id}`);
    }
    
    return id;
  }

  // ========================================================================
  // System Initialization
  // ========================================================================
  
  function initializeSystem() {
    const initFlag = 'puzzleBlockLinkageInitialized';
    
    if (window[initFlag]) {
      if (CONFIG.DEBUG) {
        console.log("Puzzle Block Linkage System already initialized. Skipping.");
      }
      return;
    }
    
    // Initialize components
    addHighlightStyles();
    initAudio();
    initProgrammingAreaListeners();
    initExistingBlocks();
    observeNewBlocks();
    
    window[initFlag] = true; // Mark as initialized
    
    console.log(`Puzzle Block Linkage System initialized. Optimized for pin/socket connections.`);
    console.log(`Configuration: Connect Threshold=${CONFIG.CONNECT_THRESHOLD}px, Vertical Alignment Threshold=${CONFIG.VERTICAL_ALIGN_THRESHOLD}px, Animate Connections: ${CONFIG.ANIMATE_CONNECTIONS}`);
  }

  // Initialize system when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem();
  }

})(); // End IIFE

// --- END OF FILE puzzle-blocks-linkage.js ---
