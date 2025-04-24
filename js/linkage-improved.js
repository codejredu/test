// --- START OF FILE svg-blocks-linkage.js ---
// --- Version 1.0: SVG Block Linkage System ---
// Specialized for SVG blocks with improved connection detection

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
  let svgNamespace = "http://www.w3.org/2000/svg";

  // Configuration - parameters that can be adjusted
  const CONFIG = {
    CONNECT_THRESHOLD: 20,        // Increased threshold for SVG elements
    VERTICAL_OVERLAP_REQ: 0.3,    // Reduced to 30% for SVG blocks
    BLOCK_GAP: 0,                 // No gap
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true                   // Enable for debugging
  };

  // ========================================================================
  // Add CSS styles for indicators and highlights
  // ========================================================================
  function addStyles() {
    if (document.getElementById('svg-block-connection-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'svg-block-connection-styles';
    style.textContent = `
      .svg-snap-source { 
        filter: drop-shadow(0 5px 10px rgba(0,0,0,0.4));
        cursor: grabbing !important; 
        z-index: 1001 !important; 
      }
      .svg-snap-target { 
        outline: 6px solid #FFC107 !important; 
        outline-offset: 4px; 
        filter: drop-shadow(0 0 10px rgba(255,193,7,0.8));
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
      @keyframes svgSnapEffect { 
        0% {transform:scale(1)} 
        35% {transform:scale(1.05)} 
        70% {transform:scale(0.98)} 
        100% {transform:scale(1)} 
      } 
      .svg-snap-animation { 
        animation: svgSnapEffect 0.3s ease-out; 
      }
      @keyframes svgDetachEffect { 
        0% {transform:translate(0,0) rotate(0)} 
        30% {transform:translate(3px,1px) rotate(0.8deg)} 
        60% {transform:translate(-2px,2px) rotate(-0.5deg)} 
        100% {transform:translate(0,0) rotate(0)} 
      } 
      .svg-detach-animation { 
        animation: svgDetachEffect 0.3s ease-in-out; 
      }
      #svg-detach-menu { 
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
      #svg-detach-menu div { 
        padding: 6px 12px; 
        cursor: pointer; 
        border-radius: 3px; 
      } 
      #svg-detach-menu div:hover { 
        background-color: #eee; 
      }
      body.svg-user-select-none { 
        user-select: none; 
        -webkit-user-select: none; 
        -moz-user-select: none; 
        -ms-user-select: none; 
      }
      .svg-connection-indicator {
        stroke: #FFC107;
        stroke-width: 4;
        stroke-dasharray: 5,5;
        opacity: 0.8;
      }
    `;
    
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('SVG block styles added');
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
  
  // Find all SVG blocks in the programming area
  function findSvgBlocks() {
    // Look for SVG elements or SVG containers that represent blocks
    // Adjust these selectors to match your specific SVG block structure
    const svgBlocks = document.querySelectorAll('#program-blocks .block-container svg, #program-blocks svg.block-svg, #program-blocks .block-svg');
    
    if (CONFIG.DEBUG) console.log(`Found ${svgBlocks.length} SVG blocks`);
    
    return svgBlocks;
  }
  
  // Initialize existing SVG blocks
  function initExistingSvgBlocks() {
    const blocks = findSvgBlocks();
    
    blocks.forEach(block => {
      const container = getBlockContainer(block);
      
      if (!container.id) {
        generateUniqueId(container);
      }
      
      addBlockDragListeners(container);
    });
    
    if (CONFIG.DEBUG) console.log(`Initialized ${blocks.length} existing SVG blocks`);
  }
  
  // Get the container of an SVG block (may be the SVG itself or a parent div)
  function getBlockContainer(svgElement) {
    // If the SVG is inside a container, return that
    const container = svgElement.closest('.block-container, .block-svg');
    
    // If no container, use the SVG itself
    return container || svgElement;
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
              // Check if it's an SVG or contains an SVG
              const svgElement = node.nodeName === 'svg' ? 
                                node : 
                                node.querySelector('svg');
                                
              if (svgElement && svgElement.closest('#program-blocks')) {
                const container = getBlockContainer(svgElement);
                
                if (!container.id) {
                  generateUniqueId(container);
                }
                
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

  // ========================================================================
  // Mouse Event Handlers
  // ========================================================================
  
  function handleContextMenu(e) {
    e.preventDefault();
    
    const block = getBlockContainer(e.target.closest('svg') || e.target);
    
    if (block?.hasAttribute('data-connected-to')) {
      showDetachMenu(e.clientX, e.clientY, block);
    }
  }
  
  function handleMouseDown(e) {
    // Skip if not left click or clicked on interactive element
    if (e.button !== 0 || !e.target || e.target.matches('input,button,select,textarea,a[href]')) return;
    
    // Get the SVG block container
    const svgElement = e.target.closest('svg');
    if (!svgElement) return;
    
    const block = getBlockContainer(svgElement);
    
    // Skip if not a valid block
    if (!block || !block.closest('#program-blocks')) return;
    
    // Ensure ID exists
    if (!block.id) generateUniqueId(block);
    
    e.preventDefault();
    block.draggable = false;
    
    if (CONFIG.DEBUG) console.log(`[MouseDown] Start drag SVG block: ${block.id}`);
    
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
    block.classList.add('svg-snap-source');
    document.body.classList.add('svg-user-select-none');
    
    // Start global listeners
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
    const blockWidth = currentDraggedBlock.offsetWidth || 100;
    const blockHeight = currentDraggedBlock.offsetHeight || 50;
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
      console.log(`[MouseUp] Releasing SVG block ${blockReleased.id}. ` +
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
    document.body.classList.remove('svg-user-select-none');
    blockReleased.classList.remove('svg-snap-source');
    blockReleased.style.zIndex = '';
    
    // Remove all highlights
    document.querySelectorAll('.svg-snap-target').forEach(element => {
      element.classList.remove('svg-snap-target');
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
    
    // Get all SVG blocks that aren't the source
    const allPotentialTargets = Array.from(findSvgBlocks())
                               .map(svg => getBlockContainer(svg))
                               .filter(block => block !== currentDraggedBlock && block.offsetParent !== null);
    
    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1;
    
    // Reset highlights and global state before checking
    document.querySelectorAll('.svg-snap-target').forEach(element => {
      element.classList.remove('svg-snap-target');
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
      
      // Special SVG optimized snap calculation
      const snapInfo = calculateSvgSnapInfo(sourceRect, targetRect);
      
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
      bestTarget.classList.add('svg-snap-target');
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection);
    }
  }
  
  function calculateSvgSnapInfo(sourceRect, targetRect) {
    // Calculate vertical overlap (optimized for SVG)
    const topOverlap = Math.max(sourceRect.top, targetRect.top);
    const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
    
    // Minimum height requirement (30% of smaller block for SVGs)
    const minHeightReq = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;
    
    // If not enough vertical overlap, no snap possible
    if (verticalOverlap < minHeightReq || verticalOverlap <= 0) return null;
    
    // Calculate horizontal distances for potential connections
    let distance, direction;
    
    const distRightToLeft = Math.abs(sourceRect.right - targetRect.left);
    const distLeftToRight = Math.abs(sourceRect.left - targetRect.right);
    
    if (distRightToLeft < distLeftToRight) {
      distance = distRightToLeft;
      direction = 'left'; // Source's RIGHT connects to target's LEFT
    } else {
      distance = distLeftToRight;
      direction = 'right'; // Source's LEFT connects to target's RIGHT
    }
    
    // Return snap info only if within threshold
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
      if (CONFIG.DEBUG > 1) {
        console.log(`[calculateSvgSnapInfo] Within threshold (${CONFIG.CONNECT_THRESHOLD}px): ` +
                   `dir=${direction}, dist=${distance.toFixed(1)}`);
      }
      return { direction, distance };
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
      
      // Calculate position
      let destVisualLeft = (direction === 'left') ? 
                          (targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP) : 
                          (targetRect.right + CONFIG.BLOCK_GAP);
      
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
      console.error("[PerformSnap] Invalid SVG block(s). Snap cancelled.");
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
      
      // Calculate exact position for snap
      let finalLeft = (direction === 'left') ? 
                     (targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP) : 
                     (targetRect.right + CONFIG.BLOCK_GAP);
      
      const finalTop = targetRect.top; // Align tops
      
      // Convert to local coordinates
      let styleLeft = finalLeft - programRect.left + programElement.scrollLeft;
      let styleTop = finalTop - programRect.top + programElement.scrollTop;
      
      // Animate the movement to the final position
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
      sourceBlock.classList.add('svg-connected-block');
      targetBlock.classList.add('svg-has-connected-block');
      
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
      blockToDetach.classList.remove('svg-connected-block');
      blockToDetach.draggable = true;
      return;
    }
    
    if (CONFIG.DEBUG) {
      console.log(`[Detach] Detaching SVG block ${blockToDetach.id} from ${targetId}`);
    }
    
    // Remove connection attributes from source
    blockToDetach.removeAttribute('data-connected-to');
    blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('svg-connected-block');
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
        targetBlock.classList.remove('svg-has-connected-block');
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
    const existingMenu = document.getElementById('svg-detach-menu');
    if (existingMenu) existingMenu.remove();
    
    // Create new menu
    const menu = document.createElement('div');
    menu.id = 'svg-detach-menu';
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
    block.classList.remove('svg-snap-animation');
    
    // Force reflow to restart animation
    void block.offsetWidth;
    
    // Apply animation
    block.classList.add('svg-snap-animation');
    
    // Clean up after animation ends
    block.addEventListener('animationend', () => {
      block.classList.remove('svg-snap-animation');
    }, {once: true});
  }
  
  function addDetachEffectAnimation(block) {
    // Remove existing animation if any
    block.classList.remove('svg-detach-animation');
    
    // Force reflow to restart animation
    void block.offsetWidth;
    
    // Apply animation
    block.classList.add('svg-detach-animation');
    
    // Clean up after animation ends
    block.addEventListener('animationend', () => {
      block.classList.remove('svg-detach-animation');
    }, {once: true});
  }
  
  function generateUniqueId(block) {
    if (block.id) return block.id;
    
    const prefix = block.dataset.type || 'svg-block';
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
      console.log(`Generated unique ID for SVG block: ${id}`);
    }
    
    return id;
  }

  // ========================================================================
  // SVG-specific Connection Visualization
  // ========================================================================
  
  // Adds an SVG connection line between blocks
  function addSvgConnectionLine(sourceBlock, targetBlock, direction) {
    const svgWrapperID = `connection-${sourceBlock.id}-to-${targetBlock.id}`;
    
    // Remove existing connection if any
    const existingConnection = document.getElementById(svgWrapperID);
    if (existingConnection) existingConnection.remove();
    
    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    
    // Create SVG element for the connection
    const svgWrapper = document.createElement('div');
    svgWrapper.id = svgWrapperID;
    svgWrapper.style.position = 'absolute';
    svgWrapper.style.top = '0';
    svgWrapper.style.left = '0';
    svgWrapper.style.width = '100%';
    svgWrapper.style.height = '100%';
    svgWrapper.style.pointerEvents = 'none';
    svgWrapper.style.zIndex = '500';
    
    const svg = document.createElementNS(svgNamespace, 'svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    
    // Create connection line
    const line = document.createElementNS(svgNamespace, 'line');
    line.classList.add('svg-connection-indicator');
    
    // Calculate connection points
    let x1, y1, x2, y2;
    
    if (direction === 'left') {
      // Source RIGHT to target LEFT
      x1 = sourceRect.right;
      y1 = sourceRect.top + sourceRect.height / 2;
      x2 = targetRect.left;
      y2 = targetRect.top + targetRect.height / 2;
    } else {
      // Source LEFT to target RIGHT
      x1 = sourceRect.left;
      y1 = sourceRect.top + sourceRect.height / 2;
      x2 = targetRect.right;
      y2 = targetRect.top + targetRect.height / 2;
    }
    
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    
    svg.appendChild(line);
    svgWrapper.appendChild(svg);
    document.getElementById('program-blocks').appendChild(svgWrapper);
    
    return svgWrapper;
  }
  
  // Remove SVG connection line
  function removeSvgConnectionLine(sourceBlock, targetBlock) {
    const svgWrapperID = `connection-${sourceBlock.id}-to-${targetBlock.id}`;
    const existingConnection = document.getElementById(svgWrapperID);
    
    if (existingConnection) {
      existingConnection.remove();
    }
  }

  // ========================================================================
  // System Initialization
  // ========================================================================
  
  function initializeSystem() {
    const initFlag = 'svgBlockLinkageInitialized';
    
    if (window[initFlag]) {
      if (CONFIG.DEBUG) {
        console.log("SVG Block linkage system already initialized. Skipping.");
      }
      return;
    }
    
    // Check if we're in a context with SVG blocks
    const svgBlocks = findSvgBlocks();
    if (svgBlocks.length === 0) {
      console.log("No SVG blocks found. SVG Block Linkage System not initialized.");
      return;
    }
    
    // Initialize components
    addStyles();
    initAudio();
    initExistingSvgBlocks();
    observeNewBlocks();
    
    window[initFlag] = true; // Mark as initialized
    
    console.log(`SVG Block Linkage System initialized. Found ${svgBlocks.length} SVG blocks.`);
    console.log(`Configuration: Connect Threshold=${CONFIG.CONNECT_THRESHOLD}px, Overlap Requirement=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px`);
  }

  // Initialize system when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem();
  }

})(); // End IIFE

// --- END OF FILE svg-blocks-linkage.js ---
