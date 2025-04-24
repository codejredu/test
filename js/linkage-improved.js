// --- START OF FILE linkageimproved.js ---
// --- Version 4.0: Enhanced Snapping System with Progressive Thresholds ---
// Changes from previous versions:
// 1. Implemented progressive snapping thresholds - 15px for highlighting, 8px for actual snap
// 2. Added smooth transition animation while dragging toward a potential target
// 3. Improved vertical alignment with magnetic attraction effect
// 4. Added visual markers for connection points
// 5. Optimized performance with debounced handler functions

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
  let isAttractingToTarget = false;
  let lastMousePosition = { x: 0, y: 0 };
  let snapAnimationFrame = null;

  // Configuration - adjustable parameters
  const CONFIG = {
    PIN_WIDTH: 6, // Visual width of connection pins
    HIGHLIGHT_THRESHOLD: 15, // Distance for highlighting potential connections
    SNAP_THRESHOLD: 8, // Distance for actual snapping to occur
    ATTRACTION_POWER: 0.35, // Magnetic attraction strength (0-1)
    VERTICAL_ALIGN_THRESHOLD: 20, // Vertical alignment threshold
    VERTICAL_OVERLAP_REQ: 0.4, // Requirement for 40% vertical overlap
    BLOCK_GAP: 0, // No gap - pin to socket connection
    SNAP_ANIMATION_DURATION: 150, // Animation duration in ms
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true // Set to false for production
  };

  // ========================================================================
  // Add CSS styles - highlight effects, connection points, magnetic indicators
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
        outline: 6px solid rgba(255,193,7,0.8) !important; 
        outline-offset: 4px; 
        box-shadow: 0 0 20px 8px rgba(255,193,7,0.6) !important; 
        transition: outline 0.2s ease-out, box-shadow 0.2s ease-out; 
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
        transition: opacity 0.2s ease-out; 
        display: none; 
      }
      
      .future-position-indicator.visible { 
        display: block; 
        opacity: 0.9; 
      }
      
      .connection-point {
        position: absolute;
        width: ${CONFIG.PIN_WIDTH}px;
        height: ${CONFIG.PIN_WIDTH * 3}px;
        background-color: rgba(0,120,255,0.6);
        border-radius: 3px;
        pointer-events: none;
        z-index: 997;
        opacity: 0;
        transition: opacity 0.2s ease-out;
      }
      
      .snap-source .connection-point,
      .snap-target .connection-point,
      .block-container:hover .connection-point {
        opacity: 0.8;
      }
      
      .connection-point-left {
        left: -${CONFIG.PIN_WIDTH/2}px;
        top: 40%;
      }
      
      .connection-point-right {
        right: -${CONFIG.PIN_WIDTH/2}px;
        top: 40%;
      }
      
      .snap-target.snap-left::before { 
        content:''; 
        position:absolute; 
        left:-10px; 
        top:30%; 
        bottom:30%; 
        width:8px; 
        background-color:#FFC107; 
        border-radius:2px; 
        z-index:1000; 
        box-shadow:0 0 10px 2px rgba(255,193,7,0.8); 
        transition: all 0.2s ease-out;
        animation: pulse 1.5s infinite;
      }
      
      .snap-target.snap-right::after { 
        content:''; 
        position:absolute; 
        right:-10px; 
        top:30%; 
        bottom:30%; 
        width:8px; 
        background-color:#FFC107; 
        border-radius:2px; 
        z-index:1000; 
        box-shadow:0 0 10px 2px rgba(255,193,7,0.8); 
        transition: all 0.2s ease-out;
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0% { opacity: 0.8; }
        50% { opacity: 1; }
        100% { opacity: 0.8; }
      }
      
      @keyframes snapEffect { 
        0% { transform: scale(1); } 
        35% { transform: scale(1.05); } 
        70% { transform: scale(0.98); } 
        100% { transform: scale(1); } 
      } 
      
      .snap-animation { 
        animation: snapEffect 0.3s ease-out; 
      }
      
      @keyframes detachEffect { 
        0% { transform: translate(0,0) rotate(0); } 
        30% { transform: translate(3px,1px) rotate(0.8deg); } 
        60% { transform: translate(-2px,2px) rotate(-0.5deg); } 
        100% { transform: translate(0,0) rotate(0); } 
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
      
      .block-transition {
        transition: left 0.15s ease-out, top 0.15s ease-out;
      }
      
      #sound-test-button { 
        position: fixed; 
        bottom: 15px; 
        right: 15px; 
        padding: 8px 12px; 
        background-color: #2196F3; 
        color: white; 
        border: none; 
        border-radius: 4px; 
        cursor: pointer; 
        z-index: 9999; 
        font-family: Arial, sans-serif; 
        font-size: 14px; 
        font-weight: bold; 
        box-shadow: 0 2px 5px rgba(0,0,0,0.2); 
        transition: background-color .2s, opacity .5s ease-out; 
        opacity: 1; 
      } 
      
      #sound-test-button:hover { 
        background-color: #0b7dda; 
      } 
      
      #sound-test-button.success { 
        background-color: #4CAF50; 
      } 
      
      #sound-test-button.error { 
        background-color: #f44336; 
      } 
      
      #sound-test-button.loading { 
        background-color: #ff9800; 
        cursor: wait; 
      } 
      
      #sound-test-button.hidden { 
        opacity: 0; 
        pointer-events: none; 
      }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Enhanced styles added (Snapping System)');
  }

  // ========================================================================
  // Audio initialization, test button, sound playback
  // ========================================================================
  function initAudio() { 
    if (!CONFIG.PLAY_SOUND || soundInitialized) return; 
    try { 
      const el = document.getElementById('snap-sound-element'); 
      if (el) {
        snapSound = el;
        soundInitialized = true;
        if (CONFIG.DEBUG) console.log('Audio reused.');
        if (!el.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)) {
          el.innerHTML = '';
          const s = document.createElement('source');
          s.src = CONFIG.SOUND_PATH;
          s.type = 'audio/mpeg';
          el.appendChild(s);
          el.load();
        }
        return;
      } 
      
      snapSound = document.createElement('audio');
      snapSound.id = 'snap-sound-element';
      snapSound.preload = 'auto';
      snapSound.volume = CONFIG.SOUND_VOLUME;
      
      const s = document.createElement('source');
      s.src = CONFIG.SOUND_PATH;
      s.type = 'audio/mpeg';
      snapSound.appendChild(s);
      
      snapSound.addEventListener('error', (e) => {
        console.error(`Audio Error: ${CONFIG.SOUND_PATH}`, e);
        const b = document.getElementById('sound-test-button');
        if (b) {
          b.textContent = 'שגיאה';
          b.className = 'error';
          b.disabled = true;
        }
        CONFIG.PLAY_SOUND = false;
        snapSound = null;
        soundInitialized = false;
      });
      
      snapSound.addEventListener('canplaythrough', () => {
        soundInitialized = true;
        if (CONFIG.DEBUG) console.log('Audio ready.');
        const b = document.getElementById('sound-test-button');
        if (b?.classList.contains('loading')) {
          b.textContent = 'בדוק';
          b.classList.remove('loading');
          b.disabled = false;
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
      const eb = document.getElementById('sound-test-button');
      if (eb) eb.remove();
      
      const b = document.createElement('button');
      b.id = 'sound-test-button';
      b.title = 'בדוק צליל';
      b.className = '';
      
      if (!snapSound) {
        b.textContent = 'שמע נכשל';
        b.classList.add('error');
        b.disabled = true;
      } else if (!soundInitialized) {
        b.textContent = 'טוען...';
        b.classList.add('loading');
        b.disabled = true;
      } else {
        b.textContent = 'בדוק';
        b.disabled = false;
      }
      
      b.onmouseover = function() {
        if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error'))
          this.style.backgroundColor = '#0b7dda';
      };
      
      b.onmouseout = function() {
        if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error'))
          this.style.backgroundColor = '#2196F3';
      };
      
      b.addEventListener('click', function() {
        if (this.disabled || !snapSound || !soundInitialized) return;
        
        snapSound.play().then(() => {
          b.textContent = 'פועל ✓';
          b.classList.add('success');
          audioContextAllowed = true;
          setTimeout(() => {
            b.classList.add('hidden');
            setTimeout(() => b.remove(), 500);
          }, 3000);
          
          if (snapSound) {
            snapSound.pause();
            snapSound.currentTime = 0;
          }
        }).catch(err => {
          console.warn('Sound test fail:', err.name);
          if (err.name === 'NotAllowedError') {
            b.textContent = 'חסום-לחץ';
            b.classList.add('error');
            audioContextAllowed = false;
          } else {
            b.textContent = 'שגיאה';
            b.classList.add('error');
            b.disabled = true;
          }
        });
      });
      
      document.body.appendChild(b);
      
      if (CONFIG.DEBUG) console.log('Sound test button added.');
    } catch (err) {
      console.error('Err adding sound btn:', err);
    }
  }
  
  function playSnapSound() { 
    if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) return;
    
    if (!audioContextAllowed && CONFIG.DEBUG) 
      console.warn('Playing sound before user interaction.');
    
    try {
      if (snapSound.readyState < 3) {
        if (CONFIG.DEBUG) console.log('Snap sound skip: audio not ready.');
        return;
      }
      
      snapSound.pause();
      snapSound.currentTime = 0;
      
      const pp = snapSound.play();
      if (pp !== undefined) {
        pp.then(() => {
          audioContextAllowed = true;
          if (CONFIG.DEBUG > 1) console.log('Snap sound played.');
        }).catch(err => {
          if (err.name === 'NotAllowedError') {
            console.warn('Snap sound blocked.');
            audioContextAllowed = false;
            if (!document.getElementById('sound-test-button'))
              addSoundTestButton();
          } else if (err.name !== 'AbortError') {
            console.error('Err play snap sound:', err);
          }
        });
      }
    } catch (err) {
      console.error('Unexpected play sound err:', err);
    }
  }

  // ========================================================================
  // Listeners, block detection, right-click, MouseDown
  // ========================================================================
  function initProgrammingAreaListeners() { 
    const a = document.getElementById('program-blocks');
    if (!a) return;
    
    a.addEventListener('dragover', (e) => e.preventDefault());
    a.addEventListener('dragstart', (e) => {
      if (e.target?.closest?.('#program-blocks .block-container'))
        e.preventDefault();
    }); 
  }
  
  function observeNewBlocks() { 
    const a = document.getElementById('program-blocks');
    if (!a) return;
    
    const o = new MutationObserver((m) => {
      m.forEach((mu) => {
        if (mu.type === 'childList') {
          mu.addedNodes.forEach((n) => {
            if (n.nodeType === 1) {
              let b = n.classList?.contains('block-container') ? n : n.querySelector?.('.block-container');
              if (b?.closest('#program-blocks')) {
                if (!b.id) generateUniqueId(b);
                addBlockDragListeners(b);
                addConnectionPoints(b);
              }
            }
          });
        }
      });
    });
    
    o.observe(a, {childList: true, subtree: true});
    
    if (CONFIG.DEBUG) console.log("MutationObserver watching."); 
  }
  
  function initExistingBlocks() { 
    document.querySelectorAll('#program-blocks .block-container').forEach(b => {
      if (!b.id) generateUniqueId(b);
      addBlockDragListeners(b);
      addConnectionPoints(b);
    });
    
    if (CONFIG.DEBUG) console.log("Listeners added to existing blocks."); 
  }
  
  function addBlockDragListeners(b) { 
    b.removeEventListener('mousedown', handleMouseDown);
    b.addEventListener('mousedown', handleMouseDown);
    b.removeEventListener('contextmenu', handleContextMenu);
    b.addEventListener('contextmenu', handleContextMenu); 
  }
  
  function addConnectionPoints(block) {
    // Add visual connection points to the block if they don't exist
    if (!block.querySelector('.connection-point-left')) {
      const leftPoint = document.createElement('div');
      leftPoint.className = 'connection-point connection-point-left';
      block.appendChild(leftPoint);
    }
    
    if (!block.querySelector('.connection-point-right')) {
      const rightPoint = document.createElement('div');
      rightPoint.className = 'connection-point connection-point-right';
      block.appendChild(rightPoint);
    }
  }
  
  function handleContextMenu(e) { 
    e.preventDefault();
    const b = e.target.closest('.block-container');
    if (b?.hasAttribute('data-connected-to'))
      showDetachMenu(e.clientX, e.clientY, b); 
  }
  
  function handleMouseDown(e) { 
    if (e.button !== 0 || !e.target.closest || e.target.matches('input,button,select,textarea,a[href]')) return;
    
    const b = e.target.closest('.block-container');
    if (!b || !b.parentElement || b.parentElement.id !== 'program-blocks') return;
    
    if (!b.id) generateUniqueId(b);
    
    e.preventDefault();
    b.draggable = false;
    
    if (CONFIG.DEBUG) console.log(`[MouseDown] Start drag: ${b.id}`);
    
    // Detach connected blocks if needed
    if (b.hasAttribute('data-connected-to'))
      detachBlock(b, false);
      
    const lId = b.getAttribute('data-connected-from-left');
    if (lId)
      detachBlock(document.getElementById(lId), false);
      
    const rId = b.getAttribute('data-connected-from-right');
    if (rId)
      detachBlock(document.getElementById(rId), false);
    
    // Set up dragging state
    currentDraggedBlock = b;
    isDraggingBlock = true;
    
    const r = b.getBoundingClientRect();
    dragOffset.x = e.clientX - r.left;
    dragOffset.y = e.clientY - r.top;
    
    // Record initial mouse position for animation
    lastMousePosition.x = e.clientX;
    lastMousePosition.y = e.clientY;
    
    // Set position to absolute if it's not already
    const pE = document.getElementById('program-blocks');
    const pR = pE.getBoundingClientRect();
    
    if (window.getComputedStyle(b).position !== 'absolute') {
      b.style.position = 'absolute';
      b.style.left = (r.left - pR.left + pE.scrollLeft) + 'px';
      b.style.top = (r.top - pR.top + pE.scrollTop) + 'px';
    }
    
    // Remove any existing transition during direct dragging
    b.classList.remove('block-transition');
    
    b.style.margin = '0';
    b.style.zIndex = '1001';
    b.classList.add('snap-source');
    document.body.classList.add('user-select-none'); 
  }

  // ========================================================================
  // Global mouse listeners, MouseLeave, MouseMove with debounce
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
      if (CONFIG.DEBUG) console.warn("Mouse left doc during drag, mouseup.");
      handleMouseUp(e);
    } 
  }
  
  // Debounce function to improve performance
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Main mouse move handler
  function handleMouseMove(e) { 
    if (!isDraggingBlock || !currentDraggedBlock) return;
    
    e.preventDefault();
    
    // Record current mouse position for smooth animation
    lastMousePosition.x = e.clientX;
    lastMousePosition.y = e.clientY;
    
    // If we're already in an attraction animation, don't interrupt
    if (isAttractingToTarget && snapAnimationFrame) return;
    
    const pE = document.getElementById('program-blocks');
    if (!pE) {
      handleMouseUp(e);
      return;
    }
    
    const pR = pE.getBoundingClientRect();
    
    // Calculate the new position
    let nL = e.clientX - pR.left - dragOffset.x + pE.scrollLeft;
    let nT = e.clientY - pR.top - dragOffset.y + pE.scrollTop;
    
    // Constrain to programming area boundaries
    const bW = currentDraggedBlock.offsetWidth;
    const bH = currentDraggedBlock.offsetHeight;
    const sW = pE.scrollWidth;
    const sH = pE.scrollHeight;
    
    nL = Math.max(0, Math.min(nL, sW - bW));
    nT = Math.max(0, Math.min(nT, sH - bH));
    
    // Apply position
    currentDraggedBlock.style.left = Math.round(nL) + 'px';
    currentDraggedBlock.style.top = Math.round(nT) + 'px';
    
    // Check for potential snap targets with debouncing
    debouncedCheckSnap();
  }
  
  // Debounced version of snap check to improve performance
  const debouncedCheckSnap = debounce(checkAndHighlightSnapPossibility, 10);

  // ========================================================================
  // MouseUp handler - progressive snapping with smooth transitions
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock;
    const candidateTarget = potentialSnapTarget;
    const candidateDirection = snapDirection;

    if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing block ${blockReleased.id}. Candidate: ${candidateTarget?.id || 'none'}, direction: ${candidateDirection || 'none'}`);

    // Cancel any ongoing animation
    cancelSnapAnimation();
    
    // Clean up global state
    isDraggingBlock = false;
    currentDraggedBlock = null;
    isAttractingToTarget = false;
    potentialSnapTarget = null;
    snapDirection = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source');
    blockReleased.style.zIndex = '';
    
    // Remove highlights
    document.querySelectorAll('.snap-target').forEach(el => {
      el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    removeFuturePositionIndicator();

    // Perform final distance check to determine if we should snap
    let shouldSnap = false;
    let finalDistance = Infinity;
    
    if (candidateTarget && candidateDirection && document.body.contains(candidateTarget)) {
      const sourceRect = blockReleased.getBoundingClientRect();
      const targetRect = candidateTarget.getBoundingClientRect();
      
      // Calculate final distance at moment of release
      const snapInfo = calculateSnapInfo(sourceRect, targetRect, CONFIG.SNAP_THRESHOLD);
      
      if (snapInfo && snapInfo.direction === candidateDirection) {
        finalDistance = snapInfo.distance;
        shouldSnap = true;
        
        if (CONFIG.DEBUG) console.log(`[MouseUp] Final distance check: ${finalDistance.toFixed(2)}px, below threshold: ${finalDistance <= CONFIG.SNAP_THRESHOLD}`);
      }
    }

    if (shouldSnap) {
      // Add transition class for smooth snapping animation
      blockReleased.classList.add('block-transition');
      
      // Perform the actual snap with animation
      const snapSuccess = performBlockSnap(blockReleased, candidateTarget, candidateDirection);
      
      if (!snapSuccess) {
        blockReleased.draggable = true;
        blockReleased.classList.remove('block-transition');
        if (CONFIG.DEBUG) console.log(`[MouseUp] Snap attempt failed. Block ${blockReleased.id} remains draggable.`);
      } else {
        if (CONFIG.DEBUG) console.log(`[MouseUp] Snap successful with smooth animation. Block ${blockReleased.id} is connected.`);
        
        // Remove transition class after animation completes
        setTimeout(() => {
          blockReleased.classList.remove('block-transition');
        }, CONFIG.SNAP_ANIMATION_DURATION);
      }
    } else {
      if (CONFIG.DEBUG) console.log(`[MouseUp] No snap performed. Block ${blockReleased.id} remains free.`);
      blockReleased.draggable = true;
    }

    if (CONFIG.DEBUG) console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
  }

  // ========================================================================
  // Snap checking and highlighting (progressive thresholds)
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;
    
    const programmingArea = document.getElementById('program-blocks'); 
    if (!programmingArea) return;
    
    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    
    // Get all visible blocks except the current one
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null);
    
    let bestTarget = null;
    let bestDirection = null;
    // Use the wider HIGHLIGHT threshold for visual feedback
    let minDistance = CONFIG.HIGHLIGHT_THRESHOLD + 1;

    // Reset highlights and global state before checking
    document.querySelectorAll('.snap-target').forEach(el => { 
      el.classList.remove('snap-target', 'snap-left', 'snap-right'); 
    });
    
    potentialSnapTarget = null; 
    snapDirection = null;
    removeFuturePositionIndicator();

    // Cancel any ongoing attraction animation
    cancelSnapAnimation();
    isAttractingToTarget = false;

    // Find the closest potential snap target
    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      
      const targetRect = targetBlock.getBoundingClientRect();
      const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');

      // Use the HIGHLIGHT threshold for finding candidates
      const snapInfo = calculateSnapInfo(sourceRect, targetRect, CONFIG.HIGHLIGHT_THRESHOLD);

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

    // If a suitable target is found within the highlight threshold
    if (bestTarget) {
      if (CONFIG.DEBUG > 1) console.log(`[Highlight] Threshold met (${minDistance.toFixed(1)}px): ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection})`);
      
      // Update global state for use in MouseUp
      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;
      
      // Apply highlights
      bestTarget.classList.add('snap-target', bestDirection === 'left' ? 'snap-left' : 'snap-right');
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programmingArea.getBoundingClientRect());
      
      // Check if we're close enough for magnetic attraction (using the stricter SNAP threshold)
      if (minDistance <= CONFIG.SNAP_THRESHOLD) {
        // Start magnetic attraction animation
        startSnapAttraction(currentDraggedBlock, bestTarget, bestDirection);
      }
    } else {
      if (CONFIG.DEBUG > 1) console.log(`No suitable snap target found or all are out of range.`);
    }
  }
  
  // ========================================================================
  // Magnetic attraction animation
  // ========================================================================
  function startSnapAttraction(sourceBlock, targetBlock, direction) {
    // If already in attraction mode, don't restart
    if (isAttractingToTarget) return;
    
    isAttractingToTarget = true;
    
    if (CONFIG.DEBUG > 1) console.log(`[Attraction] Starting magnetic pull to ${targetBlock.id} (${direction})`);
    
    // Cancel any existing animation frame
    cancelSnapAnimation();
    
    // Start the animation loop
    snapAnimationFrame = requestAnimationFrame(() => {
      animateAttraction(sourceBlock, targetBlock, direction);
    });
  }
  
  function cancelSnapAnimation() {
    if (snapAnimationFrame) {
      cancelAnimationFrame(snapAnimationFrame);
      snapAnimationFrame = null;
    }
  }
  
  function animateAttraction(sourceBlock, targetBlock, direction) {
    if (!isDraggingBlock || !document.body.contains(sourceBlock) || !document.body.contains(targetBlock)) {
      isAttractingToTarget = false;
      return;
    }
    
    const pE = document.getElementById('program-blocks');
    if (!pE) {
      isAttractingToTarget = false;
      return;
    }
    
    const pR = pE.getBoundingClientRect();
    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    
    // Calculate the ideal position for a perfect connection
    let idealX, idealY;
    
    if (direction === 'left') {
      // Source should be to the left of target
      idealX = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP - pR.left + pE.scrollLeft;
      // Vertical alignment with target
      idealY = targetRect.top - pR.top + pE.scrollTop;
    } else {
      // Source should be to the right of target
      idealX = targetRect.right + CONFIG.BLOCK_GAP - pR.left + pE.scrollLeft;
      // Vertical alignment with target
      idealY = targetRect.top - pR.top + pE.scrollTop;
    }
    
    // Calculate current mouse-controlled position
    const mouseX = lastMousePosition.x - pR.left - dragOffset.x + pE.scrollLeft;
    const mouseY = lastMousePosition.y - pR.top - dragOffset.y + pE.scrollTop;
    
    // Blend between mouse position and ideal position based on attraction power
    const blendX = mouseX + (idealX - mouseX) * CONFIG.ATTRACTION_POWER;
    const blendY = mouseY + (idealY - mouseY) * CONFIG.ATTRACTION_POWER;
    
    // Constrain to programming area boundaries
    const bW = sourceBlock.offsetWidth;
    const bH = sourceBlock.offsetHeight;
    const sW = pE.scrollWidth;
    const sH = pE.scrollHeight;
    
    const finalX = Math.max(0, Math.min(blendX, sW - bW));
    const finalY = Math.max(0, Math.min(blendY, sH - bH));
    
    // Apply the new position
    sourceBlock.style.left = Math.round(finalX) + 'px';
    sourceBlock.style.top = Math.round(finalY) + 'px';
    
    // Check if we should continue the animation
    snapAnimationFrame = requestAnimationFrame(() => {
      animateAttraction(sourceBlock, targetBlock, direction);
    });
  }
  
  // ========================================================================
  // Calculate snap information (distance and direction)
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect, threshold) {
    // Check for sufficient vertical overlap
    const topOverlap = Math.max(sourceRect.top, targetRect.top);
    const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
    const minHeightReq = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;
    
    // If there's not enough vertical overlap, no snap is possible
    if (verticalOverlap < minHeightReq || verticalOverlap <= 0) return null;
    
    // Calculate horizontal distances for both potential connections
    let distance, direction;
    const distRightToLeft = Math.abs(sourceRect.right - targetRect.left);
    const distLeftToRight = Math.abs(sourceRect.left - targetRect.right);
    
    // Choose the shorter distance
    if (distRightToLeft < distLeftToRight) { 
      distance = distRightToLeft; 
      direction = 'left'; 
    } else { 
      distance = distLeftToRight; 
      direction = 'right'; 
    }
    
    // Return info only if distance is within the specified threshold
    if (distance <= threshold) {
       if (CONFIG.DEBUG > 1) console.log(`[calculateSnapInfo] Within threshold (${threshold}px): dir=${direction}, dist=${distance.toFixed(1)}`);
       return { direction, distance };
    }
    
    return null;
  }
  
  // ========================================================================
  // Perform the actual block snapping
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock) || targetBlock.offsetParent === null) { 
      console.error("[PerformSnap] Invalid block(s). Snap cancelled."); 
      return false; 
    }
    
    // Final check before modification (important for race conditions)
    if ((direction === 'left' && targetBlock.hasAttribute('data-connected-from-left')) || 
        (direction === 'right' && targetBlock.hasAttribute('data-connected-from-right'))) { 
      console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} conflict on side '${direction}' just before snap.`); 
      return false; 
    }
    
    if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);
    
    try {
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const pE = document.getElementById('program-blocks');
      const pR = pE.getBoundingClientRect();
      
      // Calculate exact position for connection (with no gap)
      let finalLeft = (direction === 'left') ? 
                     (targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP) : 
                     (targetRect.right + CONFIG.BLOCK_GAP);
      const finalTop = targetRect.top; // Align to top
      
      // Convert to CSS position
      let styleLeft = finalLeft - pR.left + pE.scrollLeft;
      let styleTop = finalTop - pR.top + pE.scrollTop;
      
      // Move the dragged block to final position with animation
      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = `${Math.round(styleLeft)}px`;
      sourceBlock.style.top = `${Math.round(styleTop)}px`;
      sourceBlock.style.margin = '0';
      
      // Update data attributes
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);
      
      // Add classes
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      
      // Add visual effects
      playSnapSound();
      addSnapEffectAnimation(sourceBlock);
      
      // Prevent dragging when connected
      sourceBlock.draggable = false;
      
      if (CONFIG.DEBUG) console.log(`[PerformSnap] Success. ${sourceBlock.id} pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}. Draggable: ${sourceBlock.draggable}`);
      
      return true;
    } catch (err) {
      console.error(`[PerformSnap] Error during snap for ${sourceBlock.id} -> ${targetBlock.id}:`, err);
      
      try {
        detachBlock(sourceBlock, false);
      } catch (derr) {
        console.error(`[PerformSnap] Cleanup detach error:`, derr);
      }
      
      sourceBlock.draggable = true;
      return false;
    }
  }
  
  // ========================================================================
  // Update/remove indicator, detach functions, animation, ID generation
  // ========================================================================
  function updateFuturePositionIndicator(sB, tB, dir, pR) {
    const pA = document.getElementById('program-blocks');
    if (!pA) return;
    
    if (!futureIndicator) {
      futureIndicator = document.createElement('div');
      futureIndicator.id = 'future-position-indicator';
      futureIndicator.className = 'future-position-indicator';
      pA.appendChild(futureIndicator);
    }
    
    try {
      const sRN = sB.getBoundingClientRect();
      const tR = tB.getBoundingClientRect();
      const pRct = pA.getBoundingClientRect();
      
      let dVL = (dir === 'left') ? 
               (tR.left - sRN.width - CONFIG.BLOCK_GAP) : 
               (tR.right + CONFIG.BLOCK_GAP);
      let dVT = tR.top;
      
      let iL = dVL - pRct.left + pA.scrollLeft;
      let iT = dVT - pRct.top + pA.scrollTop;
      
      futureIndicator.style.left = Math.round(iL) + 'px';
      futureIndicator.style.top = Math.round(iT) + 'px';
      futureIndicator.style.width = Math.round(sRN.width) + 'px';
      futureIndicator.style.height = Math.round(sRN.height) + 'px';
      futureIndicator.classList.add('visible');
    } catch (err) {
      console.error('Err updating future indicator:', err);
      removeFuturePositionIndicator();
    }
  }
  
  function removeFuturePositionIndicator() {
    if (futureIndicator) futureIndicator.classList.remove('visible');
  }
  
  function showDetachMenu(x, y, b) {
    removeDetachMenu();
    
    const m = document.createElement('div');
    m.id = 'detach-menu';
    m.style.left = `${x}px`;
    m.style.top = `${y}px`;
    
    const o = document.createElement('div');
    o.textContent = 'נתק בלוק';
    o.onclick = (e) => {
      e.stopPropagation();
      detachBlock(b, true);
      removeDetachMenu();
    };
    
    m.appendChild(o);
    document.body.appendChild(m);
    
    setTimeout(() => {
      document.addEventListener('click', closeMenuOutside, {capture: true, once: true});
      window.addEventListener('scroll', removeDetachMenu, {capture: true, once: true});
    }, 0);
  }
  
  function closeMenuOutside(e) {
    const m = document.getElementById('detach-menu');
    if (m && !m.contains(e.target))
      removeDetachMenu();
    else if (m)
      setTimeout(() => document.addEventListener('click', closeMenuOutside, {capture: true, once: true}), 0);
      
    window.removeEventListener('scroll', removeDetachMenu, {capture: true});
  }
  
  function removeDetachMenu() {
    const m = document.getElementById('detach-menu');
    if (m) {
      document.removeEventListener('click', closeMenuOutside, {capture: true});
      window.removeEventListener('scroll', removeDetachMenu, {capture: true});
      m.remove();
    }
  }
  
  function detachBlock(btd, animate=true) {
    if (!btd || !btd.hasAttribute('data-connected-to')) return;
    
    const tid = btd.getAttribute('data-connected-to');
    const dir = btd.getAttribute('data-connection-direction');
    
    if (!tid || !dir) {
      console.warn(`[Detach] Missing data on ${btd.id}. Clean.`);
      btd.removeAttribute('data-connected-to');
      btd.removeAttribute('data-connection-direction');
      btd.classList.remove('connected-block');
      btd.draggable = true;
      return;
    }
    
    if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${btd.id} from ${tid}`);
    
    btd.removeAttribute('data-connected-to');
    btd.removeAttribute('data-connection-direction');
    btd.classList.remove('connected-block');
    btd.draggable = true;
    
    const tb = document.getElementById(tid);
    if (tb) {
      tb.removeAttribute(dir === 'left' ? 'data-connected-from-left' : 'data-connected-from-right');
      const hoc = tb.hasAttribute('data-connected-from-left') || 
                  tb.hasAttribute('data-connected-from-right') || 
                  tb.hasAttribute('data-connected-to');
                  
      if (!hoc) tb.classList.remove('has-connected-block');
    } else {
      console.warn(`[Detach] Target ${tid} not found.`);
    }
    
    if (animate) addDetachEffectAnimation(btd);
    
    if (CONFIG.DEBUG) console.log(`[Detach] Finished ${btd.id}. Draggable: ${btd.draggable}`);
  }
  
  function addSnapEffectAnimation(b) {
    b.classList.remove('snap-animation');
    void b.offsetWidth; // Force reflow
    b.classList.add('snap-animation');
    b.addEventListener('animationend', () => b.classList.remove('snap-animation'), {once: true});
  }
  
  function addDetachEffectAnimation(b) {
    b.classList.remove('detach-animation');
    void b.offsetWidth; // Force reflow
    b.classList.add('detach-animation');
    b.addEventListener('animationend', () => b.classList.remove('detach-animation'), {once: true});
  }
  
.DEBUG) console.log(`Generated ID: ${id}`);
    
    return id;
  }
