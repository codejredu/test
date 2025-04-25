// --- START OF FILE linkage-simple-fix.js ---
// --- Version 1.0: Simple Visual Fix for Block Linkage ---
// Simple solution with 10px offset to make connections visible

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

  // Configuration - parameters that can be adjusted
  const CONFIG = {
    CONNECT_THRESHOLD: 20,      // Distance for connection detection (px)
    VERTICAL_THRESHOLD: 15,     // Maximum vertical misalignment (px)
    VISUAL_OFFSET: 10,          // Visual offset for connected blocks (px)
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true                 // Enable for debugging
  };

  // ========================================================================
  // Add CSS styles for highlighting
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('simple-connection-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'simple-connection-styles';
    style.textContent = `
      .snap-source { 
        box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important; 
        transition: box-shadow 0.15s ease-out; 
        cursor: grabbing !important; 
        z-index: 1001 !important; 
      }
      .snap-target { 
        outline: 6px solid #FFC107 !important; 
        outline-offset: 4px; 
        box-shadow: 0 0 20px 8px rgba(255,193,7,0.8) !important; 
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out; 
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
        content:''; 
        position:absolute; 
        left:-10px; 
        top:10%; 
        bottom:10%; 
        width:8px; 
        background-color:#FFC107; 
        border-radius:2px; 
        z-index:1000; 
        box-shadow:0 0 10px 2px rgba(255,193,7,0.8); 
        transition:all 0.1s ease-out; 
      }
      .snap-target.snap-right::after { 
        content:''; 
        position:absolute; 
        right:-10px; 
        top:10%; 
        bottom:10%; 
        width:8px; 
        background-color:#FFC107; 
        border-radius:2px; 
        z-index:1000; 
        box-shadow:0 0 10px 2px rgba(255,193,7,0.8); 
        transition:all 0.1s ease-out; 
      }
      @keyframes snapEffect { 
        0% {transform:scale(1)} 
        35% {transform:scale(1.05)} 
        70% {transform:scale(0.98)} 
        100% {transform:scale(1)} 
      } 
      .snap-animation { 
        animation:snapEffect 0.3s ease-out; 
      }
      @keyframes detachEffect { 
        0% {transform:translate(0,0) rotate(0)} 
        30% {transform:translate(3px,1px) rotate(0.8deg)} 
        60% {transform:translate(-2px,2px) rotate(-0.5deg)} 
        100% {transform:translate(0,0) rotate(0)} 
      } 
      .detach-animation { 
        animation:detachEffect 0.3s ease-in-out; 
      }
      #detach-menu { 
        position:absolute; 
        background-color:white; 
        border:1px solid #ccc; 
        border-radius:4px; 
        box-shadow:0 3px 8px rgba(0,0,0,0.2); 
        z-index:1100; 
        padding:5px; 
        font-size:14px; 
        min-width:100px; 
      } 
      #detach-menu div { 
        padding:6px 12px; 
        cursor:pointer; 
        border-radius:3px; 
      } 
      #detach-menu div:hover { 
        background-color:#eee; 
      }
      body.user-select-none { 
        user-select:none; 
        -webkit-user-select:none; 
        -moz-user-select:none; 
        -ms-user-select:none; 
      }
    `;
    
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Styles added');
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
  function findBlocks() {
    const blocks = document.querySelectorAll('#program-blocks .block-container');
    
    if (CONFIG.DEBUG) console.log(`Found ${blocks.length} blocks`);
    
    return blocks;
  }
  
  // Initialize existing blocks
  function initExistingBlocks() {
    const blocks = findBlocks();
    
    blocks.forEach(block => {
      if (!block.id) {
        generateUniqueId(block);
      }
      
      addBlockDragListeners(block);
    });
    
    if (CONFIG.DEBUG) console.log(`Initialized ${blocks.length} existing blocks`);
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
              let block = node.classList?.contains('block-container') ? 
                        node : 
                        node.querySelector?.('.block-container');
                              
              if (block && block.closest('#program-blocks')) {
                if (!block.id) {
                  generateUniqueId(block);
                }
                
                addBlockDragListeners(block);
                
                if (CONFIG.DEBUG) console.log(`Added new block: ${block.id}`);
              }
            }
          });
        }
      });
    });
    
    observer.observe(programArea, {childList: true, subtree: true});
    
    if (CONFIG.DEBUG) console.log("MutationObserver watching for new blocks");
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
    
    if (CONFIG.DEBUG) console.log(`[MouseDown] Start drag block: ${block.id}`);
    
    // Detach this block if it's connected to another
    if (block.hasAttribute('data-connected-to')) detachBlock(block, false);
    
    // Detach any blocks connected to this one
    const leftId = block.getAttribute('data-connected-from-left');
    if (leftId) {
      const leftBlock = document.getElementById(leftId);
      if (leftBlock) detachBlock(leftBlock, false);
    }
    
    const rightId = block.getAttribute('data-connected-from-right');
    if (rightId) {
      const rightBlock = document.getElementById(rightId);
      if (rightBlock) detachBlock(rightBlock, false);
    }
    
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
    
    // Check for snap opportunities
    checkAndHighlightSnapPossibility();
  }
  
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    
    const blockReleased = currentDraggedBlock;
    const candidateTarget = potentialSnapTarget;
    const candidateDirection = snapDirection;
    
    if (CONFIG.DEBUG) {
      console.log(`[MouseUp] Releasing block ${blockReleased.id}. ` +
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
    const allPotentialTargets = Array.from(findBlocks())
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
      
      // Simple connection calculation
      const snapInfo = calculateSimpleSnapInfo(sourceRect, targetRect);
      
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
  
  function calculateSimpleSnapInfo(sourceRect, targetRect) {
    // First check vertical alignment
    const sourceMiddleY = sourceRect.top + sourceRect.height / 2;
    const targetMiddleY = targetRect.top + targetRect.height / 2;
    const verticalDistance = Math.abs(sourceMiddleY - targetMiddleY);
    
    // If vertical misalignment is too large, no snap possible
    if (verticalDistance > CONFIG.VERTICAL_THRESHOLD) {
      return null;
    }
    
    // Calculate horizontal distances for potential connections
    let distance, direction;
    
    // Source RIGHT to target LEFT
    const rightToLeftDist = Math.abs(sourceRect.right - targetRect.left);
    
    // Source LEFT to target RIGHT
    const leftToRightDist = Math.abs(sourceRect.left - targetRect.right);
    
    // Determine best connection direction
    if (rightToLeftDist < leftToRightDist) {
      distance = rightToLeftDist;
      direction = 'left'; // Source's RIGHT connects to target's LEFT
    } else {
      distance = leftToRightDist;
      direction = 'right'; // Source's LEFT connects to target's RIGHT
    }
    
    // Return snap info only if within threshold
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
      if (CONFIG.DEBUG > 1) {
        console.log(`[calculateSimpleSnapInfo] Within threshold (${CONFIG.CONNECT_THRESHOLD}px): ` +
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
      
      // Calculate position with visual offset for better appearance
      let destVisualLeft;
      
      if (direction === 'left') {
        // Source RIGHT connects to target LEFT
        // Add 10px offset to the left for better visual connection
        destVisualLeft = targetRect.left - sourceRect.width - CONFIG.VISUAL_OFFSET;
      } else {
        // Source LEFT connects to target RIGHT
        // Add 10px offset to the right for better visual connection
        destVisualLeft = targetRect.right + CONFIG.VISUAL_OFFSET;
      }
      
      // Align tops
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
  // Connection and Detachment Functions - WITH VISUAL OFFSET
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
      
      // *** THE KEY CHANGE: Add visual offset for better appearance ***
      let finalLeft;
      
      if (direction === 'left') {
        // Source RIGHT connects to target LEFT with left offset
        finalLeft = targetRect.left - sourceRect.width - CONFIG.VISUAL_OFFSET;
      } else {
        // Source LEFT connects to target RIGHT with right offset
        finalLeft = targetRect.right + CONFIG.VISUAL_OFFSET;
      }
      
      // Align tops
      const finalTop = targetRect.top;
      
      // Convert to local coordinates
      let styleLeft = finalLeft - programRect.left + programElement.scrollLeft;
      let styleTop = finalTop - programRect.top + programElement.scrollTop;
      
      // Add smooth transition
      sourceBlock.style.transition = 'left 0.2s ease-out, top 0.2s ease-out';
      
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
      
      // Add classes for styling
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      
      // Play sound effect
      playSnapSound();
      
      // Add animation effect
      addSnapEffectAnimation(sourceBlock);
      
      // Prevent dragging when connected
      sourceBlock.draggable = false;
      
      // Clear transition after animation completes
      setTimeout(() => {
        sourceBlock.style.transition = '';
      }, 250);
      
      if (CONFIG.DEBUG) {
        console.log(`[PerformSnap] Success. ${sourceBlock.id} pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}. Draggable: ${sourceBlock.draggable}`);
      }
