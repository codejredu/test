// --- START OF FILE svg-puzzle-linkage-fixed.js ---
// --- Version 2.0: SVG Puzzle Block Connection System ---
// Specialized for SVG blocks with exact dimensions of 126x93 pixels

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

  // Configuration - optimized for 126x93 SVG blocks
  const CONFIG = {
    CONNECT_THRESHOLD: 30,        // Increased threshold for easier connections
    VERTICAL_ALIGN_THRESHOLD: 20, // Maximum vertical misalignment allowed
    BLOCK_WIDTH: 126,             // Exact SVG width
    BLOCK_HEIGHT: 93,             // Exact SVG height
    PIN_WIDTH: 15,                // Estimated width of puzzle pin
    SOCKET_DEPTH: 15,             // Estimated depth of puzzle socket
    BLOCK_GAP: 0,                 // No gap between connected blocks
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true,                  // Enable for debugging
    ANIMATE_CONNECTIONS: true,    // Enable smooth animation when connecting
    CONNECTION_ANIMATION_SPEED: 200, // ms for connection animation
    RIGHT_PIN_OFFSET: 0,          // Fine-tune pin position if needed
    LEFT_SOCKET_OFFSET: 0         // Fine-tune socket position if needed
  };

  // ========================================================================
  // Add CSS styles for connection visuals
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('svg-puzzle-connection-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'svg-puzzle-connection-styles';
    style.textContent = `
      .snap-source { 
        filter: drop-shadow(0 5px 15px rgba(0,0,0,0.5)) !important;
        transition: filter 0.15s ease-out; 
        cursor: grabbing !important; 
        z-index: 1001 !important; 
      }
      .snap-target { 
        outline: 6px solid #FFC107 !important; 
        outline-offset: 2px; 
        filter: drop-shadow(0 0 10px rgba(255,193,7,0.8)) !important;
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
      .snap-target.snap-left::before { 
        content: ''; 
        position: absolute; 
        left: 0; 
        top: 40%; 
        height: 20%; 
        width: 10px; 
        background-color: #FFC107; 
        border-radius: 2px 0 0 2px; 
        z-index: 1000; 
        filter: drop-shadow(0 0 5px rgba(255,193,7,0.8));
      }
      .snap-target.snap-right::after { 
        content: ''; 
        position: absolute; 
        right: 0; 
        top: 40%; 
        height: 20%; 
        width: 10px; 
        background-color: #FFC107; 
        border-radius: 0 2px 2px 0; 
        z-index: 1000; 
        filter: drop-shadow(0 0 5px rgba(255,193,7,0.8));
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
      /* Show original element boundaries for debugging */
      .show-debug-bounds .block-container,
      .show-debug-bounds .block-svg,
      .show-debug-bounds svg {
        outline: 1px dotted red;
      }
      /* Special fixes for SVG in Firefox and Safari */
      svg {
        pointer-events: auto !important;
      }
      svg * {
        pointer-events: inherit !important;
      }
    `;
    
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('SVG puzzle block styles added');
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
  // SVG Block Identification and Event Listeners
  // ========================================================================
  
  // Find all blocks in the programming area
  function findSvgBlocks() {
    // Try multiple selectors to catch different structures
    const blocks = Array.from(document.querySelectorAll(
      '#program-blocks > .block-container, ' + 
      '#program-blocks > div > .block-container, ' +
      '#program-blocks svg, ' +
      '#program-blocks .block-svg, ' +
      '#program-blocks > [id*="block"], ' +
      '#program-blocks > div > [id*="block"]'
    ));
    
    if (CONFIG.DEBUG) console.log(`Found ${blocks.length} potential SVG blocks`);
    
    return blocks;
  }
  
  // Find the actual SVG element inside a container
  function findSvgElement(container) {
    // If the container is an SVG, return it directly
    if (container.nodeName.toLowerCase() === 'svg') {
      return container;
    }
    
    // Otherwise look for an SVG inside
    return container.querySelector('svg');
  }
  
  // Get the container element that should be moved
  function getBlockContainer(element) {
    // If it's an SVG, find its proper container
    if (element.nodeName.toLowerCase() === 'svg') {
      const parent = element.parentElement;
      // If parent seems like a proper container, use it
      if (parent && parent.id !== 'program-blocks') {
        return parent;
      }
      // Otherwise use the SVG itself
      return element;
    }
    
    // Find the closest container
    const container = element.closest('.block-container, .block-svg, [id*="block"]');
    
    // If no container, use the element itself
    return container || element;
  }
  
  // Initialize existing blocks
  function initExistingBlocks() {
    const blocks = findSvgBlocks();
    
    blocks.forEach(block => {
      const container = getBlockContainer(block);
      
      if (!container.id) {
        generateUniqueId(container);
      }
      
      // Ensure that each block has an SVG element reference
      container.svgElement = findSvgElement(container);
      
      // Add event listeners
      addBlockDragListeners(container);
      
      // Log original dimensions for reference
      if (CONFIG.DEBUG && container.svgElement) {
        const rect = container.svgElement.getBoundingClientRect();
        console.log(`SVG ${container.id} dimensions: ${rect.width}x${rect.height}`);
      }
    });
    
    if (CONFIG.DEBUG) console.log(`Initialized ${blocks.length} existing SVG blocks`);
  }
  
  // Add event listeners to block
  function addBlockDragListeners(block) {
    // Make sure we have the SVG element reference
    if (!block.svgElement) {
      block.svgElement = findSvgElement(block);
    }
    
    // Add listeners to both the container and the SVG
    block.removeEventListener('mousedown', handleMouseDown);
    block.addEventListener('mousedown', handleMouseDown);
    
    if (block.svgElement && block.svgElement !== block) {
      block.svgElement.removeEventListener('mousedown', handleSvgMouseDown);
      block.svgElement.addEventListener('mousedown', handleSvgMouseDown);
    }
    
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
              // Check for SVG or container
              const svgElement = node.nodeName.toLowerCase() === 'svg' ? 
                              node : 
                              node.querySelector('svg');
                              
              if (svgElement && node.closest('#program-blocks')) {
                const container = getBlockContainer(svgElement);
                
                if (!container.id) {
                  generateUniqueId(container);
                }
                
                container.svgElement = svgElement;
                addBlockDragListeners(container);
                
                if (CONFIG.DEBUG) console.log(`Added new SVG block: ${container.id}`);
              }
            }
          });
        }
      });
    });
    
    observer.observe(programArea, {childList: true, subtree: true});
    
    if (CONFIG.DEBUG) console.log("MutationObserver watching for new SVG blocks");
  }
  
  // Initialize programming area
  function initProgrammingAreaListeners() {
    const area = document.getElementById('program-blocks');
    if (!area) return;
    
    // Prevent default drag behavior
    area.addEventListener('dragover', (e) => e.preventDefault());
    area.addEventListener('dragstart', (e) => {
      if (e.target?.closest?.('#program-blocks')) e.preventDefault();
    });
  }

  // ========================================================================
  // Mouse Event Handlers
  // ========================================================================
  
  function handleContextMenu(e) {
    e.preventDefault();
    
    const container = getBlockContainer(e.target);
    
    if (container?.hasAttribute('data-connected-to')) {
      showDetachMenu(e.clientX, e.clientY, container);
    }
  }
  
  // Handle mousedown directly on SVG element
  function handleSvgMouseDown(e) {
    // Redirect to the container's event handler
    const container = getBlockContainer(e.currentTarget);
    if (container) {
      // Create a new event to pass to the container
      const newEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        button: e.button,
        buttons: e.buttons,
        clientX: e.clientX,
        clientY: e.clientY
      });
      
      // Stop the current event to prevent double handling
      e.stopPropagation();
      
      // Dispatch to container
      container.dispatchEvent(newEvent);
    }
  }
  
  function handleMouseDown(e) {
    // Skip if not left click or clicked on interactive element
    if (e.button !== 0 || !e.target || e.target.matches('input,button,select,textarea,a[href]')) return;
    
    // Get the block container
    const container = getBlockContainer(e.target);
    
    // Skip if not a valid block
    if (!container || !container.closest('#program-blocks')) return;
    
    // Ensure ID exists
    if (!container.id) generateUniqueId(container);
    
    // Make sure we have the SVG element reference
    if (!container.svgElement) {
      container.svgElement = findSvgElement(container);
    }
    
    e.preventDefault();
    e.stopPropagation();
    container.draggable = false;
    
    if (CONFIG.DEBUG) console.log(`[MouseDown] Start drag SVG block: ${container.id}`);
    
    // Detach this block if it's connected to another
    if (container.hasAttribute('data-connected-to')) detachBlock(container, false);
    
    // Detach any blocks connected to this one
    const leftId = container.getAttribute('data-connected-from-left');
    if (leftId) {
      const leftBlock = document.getElementById(leftId);
      if (leftBlock) detachBlock(leftBlock, false);
    }
    
    const rightId = container.getAttribute('data-connected-from-right');
    if (rightId) {
      const rightBlock = document.getElementById(rightId);
      if (rightBlock) detachBlock(rightBlock, false);
    }
    
    // Set drag state
    currentDraggedBlock = container;
    isDraggingBlock = true;
    
    // Calculate drag offset (where within the block was clicked)
    const rect = container.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    // Position block absolutely if it's not already
    const programElement = document.getElementById('program-blocks');
    const programRect = programElement.getBoundingClientRect();
    
    if (window.getComputedStyle(container).position !== 'absolute') {
      container.style.position = 'absolute';
      container.style.left = (rect.left - programRect.left + programElement.scrollLeft) + 'px';
      container.style.top = (rect.top - programRect.top + programElement.scrollTop) + 'px';
    }
    
    container.style.margin = '0';
    container.style.zIndex = '1001';
    container.classList.add('snap-source');
    document.body.classList.add('user-select-none');
    
    // If debugging, show boundaries
    if (CONFIG.DEBUG) {
      document.documentElement.classList.add('show-debug-bounds');
    }
    
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
    const blockWidth = currentDraggedBlock.offsetWidth || CONFIG.BLOCK_WIDTH;
    const blockHeight = currentDraggedBlock.offsetHeight || CONFIG.BLOCK_HEIGHT;
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
      console.log(`[MouseUp] Releasing SVG block ${blockReleased.id}. ` +
                  `Candidate target: ${candidateTarget?.id || 'none'}, ` +
                  `direction: ${candidateDirection || 'none'}`);
    }
    
    // Clean up
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseleave', handleMouseLeave);
    
    // Remove debug boundaries
    document.documentElement.classList.remove('show-debug-bounds');
    
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
      element.classList.remove('snap-target', 'snap-left', 'snap-right');
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
    const allPotentialTargets = Array.from(findSvgBlocks())
                               .map(block => getBlockContainer(block))
                               .filter(block => block !== currentDraggedBlock && block.offsetParent !== null);
    
    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1;
    
    // Reset highlights and global state before checking
    document.querySelectorAll('.snap-target').forEach(element => {
      element.classList.remove('snap-target', 'snap-left', 'snap-right');
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
      
      // Skip if no valid snap possibility due to existing connections
      if (targetConnectedLeft && targetConnectedRight) continue;
      
      // Special SVG puzzle snap calculation
      const snapInfo = calculateSvgPuzzleSnapInfo(sourceRect, targetRect);
      
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
      
      // Activate highlights
      bestTarget.classList.add('snap-target', bestDirection === 'left' ? 'snap-left' : 'snap-right');
      
      // Show indicator of future position
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection);
    }
  }
  
  function calculateSvgPuzzleSnapInfo(sourceRect, targetRect) {
    // First check vertical alignment - SVG blocks must be fairly aligned
    const sourceMiddleY = sourceRect.top + sourceRect.height / 2;
    const targetMiddleY = targetRect.top + targetRect.height / 2;
    const verticalDistance = Math.abs(sourceMiddleY - targetMiddleY);
    
    // If vertical alignment is poor, no snap possible
    if (verticalDistance > CONFIG.VERTICAL_ALIGN_THRESHOLD) {
      return null;
    }
    
    // Calculate horizontal distances for potential connections
    let distance, direction;
    
    // Source RIGHT (pin) to target LEFT (socket)
    // Pin is on right side of source, Socket is on left side of target
    const pinToSocketDist = Math.abs(sourceRect.right - targetRect.left);
    
    // Source LEFT (socket) to target RIGHT (pin)
    // Socket is on left side of source, Pin is on right side of target
    const socketToPinDist = Math.abs(sourceRect.left - targetRect.right);
    
    // Determine best connection direction
    if (pinToSocketDist < socketToPinDist) {
      distance = pinToSocketDist;
      direction = 'left'; // Source's RIGHT (pin) connects to target's LEFT (socket)
    } else {
      distance = socketToPinDist;
      direction = 'right'; // Source's LEFT (socket) connects to target's RIGHT (pin)
    }
    
    // Return snap info only if within threshold
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
      if (CONFIG.DEBUG > 1) {
        console.log(`[calculateSvgSnapInfo] Within threshold (${CONFIG.CONNECT_THRESHOLD}px): ` +
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
