// --- START OF FILE linkage-fixed.js ---
// --- Version 4.0: Fixed Block Linkage with Enhanced Reliability ---
// Changes from v3.5:
// 1. Fixed connection issues with improved snap detection
// 2. Enhanced visual feedback for connection opportunities
// 3. More consistent snapping behavior
// 4. Better performance with optimized code

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
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 25,        // Increased threshold for easier connections
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4,    // Require 40% vertical overlap
    BLOCK_GAP: 0,                 // No gap - socket-pin connection
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    HIGHLIGHT_INTENSITY: 1.3,     // Stronger highlight 
    SNAP_ANIMATION_SPEED: 200,    // Faster animation (ms)
    DEBUG: false                  // Set to false for production
  };

  // ========================================================================
  // Add CSS styles - yellow halo, blue indicator
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
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
      #sound-test-button { 
        position:fixed; 
        bottom:15px; 
        right:15px; 
        padding:8px 12px; 
        background-color:#2196F3; 
        color:white; 
        border:none; 
        border-radius:4px; 
        cursor:pointer; 
        z-index:9999; 
        font-family:Arial,sans-serif; 
        font-size:14px; 
        font-weight:bold; 
        box-shadow:0 2px 5px rgba(0,0,0,0.2); 
        transition:background-color .2s,opacity .5s ease-out; 
        opacity:1; 
      } 
      #sound-test-button:hover { 
        background-color:#0b7dda; 
      } 
      #sound-test-button.success { 
        background-color:#4CAF50; 
      } 
      #sound-test-button.error { 
        background-color:#f44336; 
      } 
      #sound-test-button.loading { 
        background-color:#ff9800; 
        cursor:wait; 
      } 
      #sound-test-button.hidden { 
        opacity:0; 
        pointer-events:none; 
      }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Styles added (Yellow Halo, Blue Indicator)');
  }

  // ========================================================================
  // Audio, test button and sound playing functions
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
        const button = document.getElementById('sound-test-button');
        if (button) {
          button.textContent = 'Error';
          button.className = 'error';
          button.disabled = true;
        }
        CONFIG.PLAY_SOUND = false;
        snapSound = null;
        soundInitialized = false;
      });
      
      snapSound.addEventListener('canplaythrough', () => {
        soundInitialized = true;
        if (CONFIG.DEBUG) console.log('Audio ready.');
        
        const button = document.getElementById('sound-test-button');
        if (button?.classList.contains('loading')) {
          button.textContent = 'Test Sound';
          button.classList.remove('loading');
          button.disabled = false;
        }
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
  
  function addSoundTestButton() {
    if (!CONFIG.PLAY_SOUND) return;
    
    try {
      const existingButton = document.getElementById('sound-test-button');
      if (existingButton) existingButton.remove();
      
      const button = document.createElement('button');
      button.id = 'sound-test-button';
      button.title = 'Test Sound';
      button.className = '';
      
      if (!snapSound) {
        button.textContent = 'Sound Failed';
        button.classList.add('error');
        button.disabled = true;
      } else if (!soundInitialized) {
        button.textContent = 'Loading...';
        button.classList.add('loading');
        button.disabled = true;
      } else {
        button.textContent = 'Test Sound';
        button.disabled = false;
      }
      
      Object.assign(button.style, {
        position: 'fixed',
        bottom: '15px',
        right: '15px',
        zIndex: '9999',
        padding: '8px 12px',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        fontFamily: 'Arial,sans-serif',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'background-color .2s, opacity .5s ease-out',
        opacity: '1'
      });
      
      button.onmouseover = function() {
        if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error'))
          this.style.backgroundColor = '#0b7dda';
      };
      
      button.onmouseout = function() {
        if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error'))
          this.style.backgroundColor = '#2196F3';
      };
      
      button.addEventListener('click', function() {
        if (this.disabled || !snapSound || !soundInitialized) return;
        
        snapSound.play().then(() => {
          button.textContent = 'Sound Works ✓';
          button.classList.add('success');
          audioContextAllowed = true;
          
          setTimeout(() => {
            button.classList.add('hidden');
            setTimeout(() => button.remove(), 500);
          }, 3000);
          
          if (snapSound) {
            snapSound.pause();
            snapSound.currentTime = 0;
          }
        }).catch(err => {
          console.warn('Sound test fail:', err.name);
          
          if (err.name === 'NotAllowedError') {
            button.textContent = 'Blocked-Click';
            button.classList.add('error');
            audioContextAllowed = false;
          } else {
            button.textContent = 'Error';
            button.classList.add('error');
            button.disabled = true;
          }
        });
      });
      
      document.body.appendChild(button);
      
      if (CONFIG.DEBUG) console.log('Sound test button added.');
      
    } catch (err) {
      console.error('Error adding sound button:', err);
    }
  }
  
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) return;
    
    if (!audioContextAllowed && CONFIG.DEBUG) console.warn('Playing sound before user interaction.');
    
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
            console.warn('Snap sound blocked.');
            audioContextAllowed = false;
            
            if (!document.getElementById('sound-test-button')) addSoundTestButton();
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
  // Add listeners, identify blocks, right-click, MouseDown functions
  // ========================================================================
  function initProgrammingAreaListeners() {
    const area = document.getElementById('program-blocks');
    if (!area) return;
    
    // Prevent default drag behavior
    area.addEventListener('dragover', (e) => e.preventDefault());
    area.addEventListener('dragstart', (e) => {
      if (e.target?.closest?.('#program-blocks .block-container')) e.preventDefault();
    });
  }
  
  function observeNewBlocks() {
    const area = document.getElementById('program-blocks');
    if (!area) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              let block = node.classList?.contains('block-container') ? node : node.querySelector?.('.block-container');
              if (block?.closest('#program-blocks')) {
                if (!block.id) generateUniqueId(block);
                addBlockDragListeners(block);
              }
            }
          });
        }
      });
    });
    
    observer.observe(area, {childList: true, subtree: true});
    
    if (CONFIG.DEBUG) console.log("MutationObserver watching.");
  }
  
  function initExistingBlocks() {
    document.querySelectorAll('#program-blocks .block-container').forEach(block => {
      if (!block.id) generateUniqueId(block);
      addBlockDragListeners(block);
    });
    
    if (CONFIG.DEBUG) console.log("Listeners added to existing blocks.");
  }
  
  function addBlockDragListeners(block) {
    block.removeEventListener('mousedown', handleMouseDown);
    block.addEventListener('mousedown', handleMouseDown);
    
    block.removeEventListener('contextmenu', handleContextMenu);
    block.addEventListener('contextmenu', handleContextMenu);
  }
  
  function handleContextMenu(e) {
    e.preventDefault();
    const block = e.target.closest('.block-container');
    if (block?.hasAttribute('data-connected-to')) showDetachMenu(e.clientX, e.clientY, block);
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
    
    if (CONFIG.DEBUG) console.log(`[MouseDown] Start drag: ${block.id}`);
    
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
  }

  // ========================================================================
  // Global listeners, MouseLeave, MouseMove functions
  // ========================================================================
  function initGlobalMouseListeners() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseLeave);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
  }
  
  function handleMouseLeave(e) {
    if (isDraggingBlock && e.target === document.documentElement && !e.relatedTarget) {
      if (CONFIG.DEBUG) console.warn("Mouse left doc during drag, firing mouseup.");
      handleMouseUp(e);
    }
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

  // ========================================================================
  // IMPROVED MouseUp handling - with more reliable snapping
  // ========================================================================
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
      
      // Verify the connection is still valid
      const targetRect = candidateTarget.getBoundingClientRect();
      const blockRect = blockReleased.getBoundingClientRect();
      
      // Double-check vertical overlap is sufficient
      const topOverlap = Math.max(blockRect.top, targetRect.top);
      const bottomOverlap = Math.min(blockRect.bottom, targetRect.bottom);
      const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
      const minHeightReq = Math.min(blockRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;
      
      if (verticalOverlap < minHeightReq) {
        if (CONFIG.DEBUG) {
          console.log(`[MouseUp] Insufficient vertical overlap at release. No snap.`);
        }
        performSnap = false;
      }
      
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
    
    if (CONFIG.DEBUG) {
      console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
    }
  }

  // ========================================================================
  // IMPROVED Snap Detection and Highlighting
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;
    
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    
    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    
    // Get all visible blocks that aren't the source
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null);
    
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
    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      
      const targetRect = targetBlock.getBoundingClientRect();
      const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');
      
      // Calculate returns info only if distance <= threshold and overlap is sufficient
      const snapInfo = calculateSnapInfo(sourceRect, targetRect);
      
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
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programmingArea.getBoundingClientRect());
    }
    // If no target found, highlights are reset at the beginning of this function
  }
  
  // ========================================================================
  // IMPROVED snap calculation
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) {
    // Calculate vertical overlap
    const topOverlap = Math.max(sourceRect.top, targetRect.top);
    const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
    
    // Minimum height requirement (40% of smaller block)
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
        console.log(`[calculateSnapInfo] Within threshold (${CONFIG.CONNECT_THRESHOLD}px): ` +
                   `dir=${direction}, dist=${distance.toFixed(1)}`);
      }
      return { direction, distance };
    }
    
    return null;
  }

  // ========================================================================
  // Physical snap function (with position calculation and animation)
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
      
      // Calculate exact position for snap
      let finalLeft = (direction === 'left') ? 
                     (targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP) : 
                     (targetRect.right + CONFIG.BLOCK_GAP);
      
      const finalTop = targetRect.top; // Align tops
      
      // Convert to local coordinates
      let styleLeft = finalLeft - programRect.left + programElement.scrollLeft;
      let styleTop = finalTop - programRect.top + programElement.scrollTop;
      
      // Animate the movement to the final position for smoother experience
      sourceBlock.style.transition = `left ${CONFIG.SNAP_ANIMATION_SPEED}ms ease-out, top ${CONFIG.SNAP_ANIMATION_SPEED}ms ease-out`;
      
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
      }, CONFIG.SNAP_ANIMATION_SPEED + 50);
      
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

  // ========================================================================
  // Update/remove indicator, detach functions, animation, ID generation
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) {
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
      const programRectFull = programArea.getBoundingClientRect();
      
      // Calculate position
      let destVisualLeft = (direction === 'left') ? 
                          (targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP) : 
                          (targetRect.right + CONFIG.BLOCK_GAP);
      
      let destVisualTop = targetRect.top;
      
      // Convert to position relative to programming area
      let indicatorLeft = destVisualLeft - programRectFull.left + programArea.scrollLeft;
      let indicatorTop = destVisualTop - programRectFull.top + programArea.scrollTop;
      
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
  
  function showDetachMenu(x, y, block) {
    // Remove any existing menu
    removeDetachMenu();
    
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
      removeDetachMenu();
    };
    
    menu.appendChild(option);
    document.body.appendChild(menu);
    
    // Add event listeners to close menu
    setTimeout(() => {
      document.addEventListener('click', closeMenuOutside, {capture: true, once: true});
      window.addEventListener('scroll', removeDetachMenu, {capture: true, once: true});
    }, 0);
  }
  
  function closeMenuOutside(e) {
    const menu = document.getElementById('detach-menu');
    
    if (menu && !menu.contains(e.target)) {
      removeDetachMenu();
    } else if (menu) {
      // Re-add listener if clicked inside menu
      setTimeout(() => document.addEventListener('click', closeMenuOutside, {capture: true, once: true}), 0);
    }
    
    window.removeEventListener('scroll', removeDetachMenu, {capture: true});
  }
  
  function removeDetachMenu() {
    const menu = document.getElementById('detach-menu');
    
    if (menu) {
      document.removeEventListener('click', closeMenuOutside, {capture: true});
      window.removeEventListener('scroll', removeDetachMenu, {capture: true});
      menu.remove();
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
      blockToDetach.classList.remove('connected-block');
      blockToDetach.draggable = true;
      return;
    }
    
    if (CONFIG.DEBUG) {
      console.log(`[Detach] Detaching ${blockToDetach.id} from ${targetId}`);
    }
    
    // Remove connection attributes from source
    blockToDetach.removeAttribute('data-connected-to');
    blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block');
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
        targetBlock.classList.remove('has-connected-block');
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
    
    const prefix = block.dataset.type || 'block';
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
      console.log(`Generated ID: ${id}`);
    }
    
    return id;
  }

  // ========================================================================
  // System initialization
  // ========================================================================
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v4_0'; // Version specific flag
    
    if (window[initFlag]) {
      if (CONFIG.DEBUG) {
        console.log("Block linkage system v4.0 already initialized. Skipping.");
      }
      return;
    }
    
    addHighlightStyles();
    initAudio();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();
    
    if (CONFIG.PLAY_SOUND) {
      addSoundTestButton();
    }
    
    window[initFlag] = true; // Mark as initialized
    
    console.log(`Block linkage system initialized (Version 4.0 - Fixed Snapping, Threshold=${CONFIG.CONNECT_THRESHOLD}px)`);
    console.log(`Configuration: Snap Threshold=${CONFIG.CONNECT_THRESHOLD}px, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // Initialize system
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem(); // DOM already loaded
  }

})(); // End IIFE

// --- END OF FILE linkage-fixed.js ---
