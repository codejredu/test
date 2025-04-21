// --- START OF FILE linkageimproved.js ---
// --- Version 4.2: Protected Release + Cleanup Highlight on Snap ---
// Changes from v4.1:
// 1. In performBlockSnap: Added code to explicitly remove the 'snap-target'
//    class from the target block after a successful snap.

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
  // (Code identical to v4.1 - No changes needed here)
  // ========================================================================
  function initAudio() { /* ... v4.1 code ... */
    if (!CONFIG.PLAY_SOUND || soundInitialized) return;
    try {
        const existingElement = document.getElementById('snap-sound-element');
        if (existingElement) {
            snapSound = existingElement;
            soundInitialized = true;
            if (CONFIG.DEBUG) console.log('Audio element reused.');
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
            console.error(`Audio Error: Could not load sound "${CONFIG.SOUND_PATH}".`, e);
            const btn = document.getElementById('sound-test-button');
            if(btn) { btn.textContent='שגיאה בטעינת שמע'; btn.className='error'; btn.disabled=true; }
            CONFIG.PLAY_SOUND = false; snapSound = null; soundInitialized = false;
        });
        snapSound.addEventListener('canplaythrough', () => {
            soundInitialized = true;
            if (CONFIG.DEBUG) console.log('Audio ready to play.');
            const btn = document.getElementById('sound-test-button');
            if (btn?.classList.contains('loading')) {
                btn.textContent = 'בדוק צליל'; btn.classList.remove('loading'); btn.disabled = false;
            }
        });
        snapSound.style.display = 'none';
        document.body.appendChild(snapSound);
        if (CONFIG.DEBUG) console.log(`Audio element created: ${CONFIG.SOUND_PATH}`);
    } catch (err) {
        console.error('Audio initialization failed:', err);
        CONFIG.PLAY_SOUND = false; snapSound = null; soundInitialized = false;
    }
  }
  function addSoundTestButton() { /* ... v4.1 code ... */
      if (!CONFIG.PLAY_SOUND) return;
      try {
          const existingButton = document.getElementById('sound-test-button');
          if (existingButton) existingButton.remove();
          const button = document.createElement('button');
          button.id = 'sound-test-button';
          button.title = 'בדוק צליל חיבור';
          button.className = '';
          if (!snapSound) {
              button.textContent = 'שמע נכשל'; button.classList.add('error'); button.disabled = true;
          } else if (!soundInitialized) {
              button.textContent = 'טוען צליל...'; button.classList.add('loading'); button.disabled = true;
          } else {
              button.textContent = 'בדוק צליל'; button.disabled = false;
          }
          Object.assign(button.style, {
              position:'fixed', bottom:'15px', right:'15px', zIndex:'9999', padding:'8px 12px',
              color:'white', border:'none', borderRadius:'4px', cursor:'pointer',
              boxShadow:'0 2px 5px rgba(0,0,0,0.2)', fontFamily:'Arial, sans-serif',
              fontSize:'14px', fontWeight:'bold', transition:'background-color .2s, opacity .5s ease-out', opacity:'1'
          });
          if (!button.classList.contains('error') && !button.classList.contains('loading')) {
             button.style.backgroundColor = '#2196F3';
          }
          button.onmouseover = function() { if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) this.style.backgroundColor = '#0b7dda'; };
          button.onmouseout = function() { if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) this.style.backgroundColor = '#2196F3'; };
          button.addEventListener('click', function() {
              if (this.disabled || !snapSound || !soundInitialized) return;
              snapSound.play()
                  .then(() => {
                      button.textContent = 'צליל פועל ✓'; button.classList.add('success'); button.style.backgroundColor = '#4CAF50'; audioContextAllowed = true;
                      setTimeout(() => { button.classList.add('hidden'); button.style.opacity = '0'; setTimeout(() => button.remove(), 500); }, 3000);
                      snapSound.pause(); snapSound.currentTime = 0;
                  })
                  .catch(err => {
                      console.warn('Sound test failed:', err.name, err.message);
                      if (err.name === 'NotAllowedError') {
                          button.textContent = 'צליל נחסם - לחץ שוב'; button.classList.add('error'); button.style.backgroundColor = '#f44336'; audioContextAllowed = false; button.disabled = false; button.classList.remove('loading');
                      } else {
                          button.textContent = 'שגיאת נגינה'; button.classList.add('error'); button.style.backgroundColor = '#f44336'; button.disabled = true;
                      }
                  });
          });
          document.body.appendChild(button);
          if (CONFIG.DEBUG) console.log('Sound test button added.');
      } catch (err) { console.error('Error adding sound test button:', err); }
  }
  function playSnapSound() { /* ... v4.1 code ... */
      if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) return;
      if (!audioContextAllowed && CONFIG.DEBUG) { console.warn('Attempting to play sound before user interaction.'); }
      try {
          if (snapSound.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) { if (CONFIG.DEBUG) console.log('Snap sound skipped: audio not ready yet (readyState:', snapSound.readyState, ')'); return; }
          snapSound.pause(); snapSound.currentTime = 0; const playPromise = snapSound.play();
          if (playPromise !== undefined) {
              playPromise
                  .then(() => { audioContextAllowed = true; if (CONFIG.DEBUG > 1) console.log('Snap sound played successfully.'); })
                  .catch(error => {
                      if (error.name === 'NotAllowedError') { console.warn('Snap sound playback blocked by browser (needs user interaction).'); audioContextAllowed = false; if (!document.getElementById('sound-test-button')) { addSoundTestButton(); } }
                      else if (error.name !== 'AbortError') { console.error('Error playing snap sound:', error); }
                  });
          }
      } catch (err) { console.error('Unexpected error during playSnapSound:', err); }
  }

  // ========================================================================
  // Event Listeners Setup
  // (Code identical to v4.1 - No changes needed here)
  // ========================================================================
  function initProgrammingAreaListeners() { /* ... v4.1 code ... */
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) { console.error("Programming area (#program-blocks) not found!"); return; }
      programmingArea.addEventListener('dragover', (event) => event.preventDefault());
      programmingArea.addEventListener('dragstart', (event) => { if (event.target?.closest?.('#program-blocks .block-container')) { event.preventDefault(); } });
      if (CONFIG.DEBUG) console.log("Programming area listeners initialized.");
  }
  function observeNewBlocks() { /* ... v4.1 code ... */
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;
      const observer = new MutationObserver((mutationsList) => {
          for (const mutation of mutationsList) {
              if (mutation.type === 'childList') {
                  mutation.addedNodes.forEach(node => {
                      if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('block-container')) { if (!node.id) generateUniqueId(node); addBlockDragListeners(node); if (CONFIG.DEBUG > 1) console.log(`Observer: Added listener to new block ${node.id}`); }
                      else if (node.nodeType === Node.ELEMENT_NODE && node.querySelectorAll) { node.querySelectorAll('.block-container').forEach(block => { if (block.closest('#program-blocks') === programmingArea) { if (!block.id) generateUniqueId(block); addBlockDragListeners(block); if (CONFIG.DEBUG > 1) console.log(`Observer: Added listener to new block ${block.id} (found via querySelectorAll)`); } }); }
                  });
              }
          }
      });
      observer.observe(programmingArea, { childList: true, subtree: true });
      if (CONFIG.DEBUG) console.log("MutationObserver watching programming area for new blocks.");
  }
  function initExistingBlocks() { /* ... v4.1 code ... */
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;
      const blocks = programmingArea.querySelectorAll('.block-container');
      blocks.forEach(block => { if (!block.id) generateUniqueId(block); addBlockDragListeners(block); });
      if (CONFIG.DEBUG) console.log(`Listeners added to ${blocks.length} existing blocks in programming area.`);
  }
  function addBlockDragListeners(blockElement) { /* ... v4.1 code ... */
      blockElement.removeEventListener('mousedown', handleMouseDown);
      blockElement.removeEventListener('contextmenu', handleContextMenu);
      blockElement.addEventListener('mousedown', handleMouseDown);
      blockElement.addEventListener('contextmenu', handleContextMenu);
       if (!blockElement.hasAttribute('data-connected-to') && !blockElement.hasAttribute('data-connected-from-left') && !blockElement.hasAttribute('data-connected-from-right')) { blockElement.draggable = true; }
       else { blockElement.draggable = false; }
  }
  function initGlobalMouseListeners() { /* ... v4.1 code ... */
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseLeave);
      if (CONFIG.DEBUG) console.log("Global mouse listeners initialized.");
  }

  // ========================================================================
  // Drag Lifecycle Handlers
  // (Code identical to v4.1 - No changes needed here)
  // ========================================================================
  function handleMouseDown(event) { /* ... v4.1 code ... */
      if (event.button !== 0 || !event.target.closest) return;
      if (event.target.matches('input, button, select, textarea, a[href]')) { return; }
      const block = event.target.closest('.block-container');
      if (!block || !block.parentElement || block.parentElement.id !== 'program-blocks') { return; }
      if (!block.id) { generateUniqueId(block); }
      event.preventDefault(); block.draggable = false;
      if (CONFIG.DEBUG) console.log(`[MouseDown] Start drag on: ${block.id}`);
      const connectedToId = block.getAttribute('data-connected-to');
      if (connectedToId) { detachBlock(block, false); }
      const leftId = block.getAttribute('data-connected-from-left');
      if (leftId) { const leftBlock = document.getElementById(leftId); if (leftBlock) detachBlock(leftBlock, false); }
      const rightId = block.getAttribute('data-connected-from-right');
      if (rightId) { const rightBlock = document.getElementById(rightId); if (rightBlock) detachBlock(rightBlock, false); }
      currentDraggedBlock = block; isDraggingBlock = true;
      const rect = block.getBoundingClientRect();
      dragOffset.x = event.clientX - rect.left; dragOffset.y = event.clientY - rect.top;
      const programmingArea = document.getElementById('program-blocks'); const areaRect = programmingArea.getBoundingClientRect();
      if (window.getComputedStyle(block).position !== 'absolute') {
          block.style.position = 'absolute';
          block.style.left = (rect.left - areaRect.left + programmingArea.scrollLeft) + 'px';
          block.style.top = (rect.top - areaRect.top + programmingArea.scrollTop) + 'px';
      }
      block.style.margin = '0'; block.style.zIndex = '1001'; block.classList.add('snap-source');
      document.body.classList.add('user-select-none');
      potentialSnapTargetForVisuals = null; snapDirectionForVisuals = null;
  }
  function handleMouseMove(event) { /* ... v4.1 code ... */
      if (!isDraggingBlock || !currentDraggedBlock) return;
      event.preventDefault();
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) { console.error("Programming area lost during drag!"); handleMouseUp(event); return; }
      const areaRect = programmingArea.getBoundingClientRect();
      let newLeft = event.clientX - areaRect.left - dragOffset.x + programmingArea.scrollLeft;
      let newTop = event.clientY - areaRect.top - dragOffset.y + programmingArea.scrollTop;
      const blockWidth = currentDraggedBlock.offsetWidth; const blockHeight = currentDraggedBlock.offsetHeight;
      const scrollWidth = programmingArea.scrollWidth; const scrollHeight = programmingArea.scrollHeight;
      newLeft = Math.max(0, Math.min(newLeft, scrollWidth - blockWidth));
      newTop = Math.max(0, Math.min(newTop, scrollHeight - blockHeight));
      currentDraggedBlock.style.left = Math.round(newLeft) + 'px'; currentDraggedBlock.style.top = Math.round(newTop) + 'px';
      checkAndHighlightForVisuals();
  }
  function handleMouseUp(event) { /* ... v4.1 code ... */
      if (!isDraggingBlock || !currentDraggedBlock) return;
      const blockReleased = currentDraggedBlock; const releasedRect = blockReleased.getBoundingClientRect();
      const programmingArea = document.getElementById('program-blocks');
      let finalTarget = null; let finalDirection = null; let finalMinDistance = CONFIG.CONNECT_THRESHOLD + 1;
      if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Releasing ${blockReleased.id}. Performing final proximity check...`);
      if (programmingArea) {
          const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                        .filter(block => block.offsetParent !== null && block !== blockReleased);
          for (const targetBlock of allVisibleBlocks) {
              if (!targetBlock.id) generateUniqueId(targetBlock);
              const targetRect = targetBlock.getBoundingClientRect();
              const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
              const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');
              const snapInfo = calculateSnapInfo(releasedRect, targetRect);
              if (snapInfo) {
                  let connectionAllowed = true;
                  if (snapInfo.direction === 'left' && targetConnectedLeft) connectionAllowed = false;
                  else if (snapInfo.direction === 'right' && targetConnectedRight) connectionAllowed = false;
                  if (connectionAllowed && snapInfo.distance < finalMinDistance) {
                      finalMinDistance = snapInfo.distance; finalTarget = targetBlock; finalDirection = snapInfo.direction;
                  }
              }
          }
      }
      isDraggingBlock = false; currentDraggedBlock = null; potentialSnapTargetForVisuals = null; snapDirectionForVisuals = null;
      document.body.classList.remove('user-select-none'); blockReleased.classList.remove('snap-source'); blockReleased.style.zIndex = '';
      document.querySelectorAll('.snap-target').forEach(el => { el.classList.remove('snap-target', 'snap-left', 'snap-right'); });
      removeFuturePositionIndicator();
      if (finalTarget && finalDirection) {
          if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Final check PASSED. Snapping ${blockReleased.id} to ${finalTarget.id} (${finalDirection}). Distance: ${finalMinDistance.toFixed(1)}px`);
          const snapSuccess = performBlockSnap(blockReleased, finalTarget, finalDirection);
          if (!snapSuccess) { blockReleased.draggable = true; if (CONFIG.DEBUG) console.warn(`[MouseUp - Protected] Snap attempt failed unexpectedly. Block ${blockReleased.id} remains draggable.`); }
          else { if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Snap successful. Block ${blockReleased.id} is connected.`); }
      } else {
          if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Final check FAILED (No target within ${CONFIG.CONNECT_THRESHOLD}px at release). No snap performed.`);
          blockReleased.draggable = true;
      }
      if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] ----- End MouseUp for ${blockReleased.id} -----`);
  }
  function handleMouseLeave(event) { /* ... v4.1 code ... */
      if (isDraggingBlock && event.target === document.documentElement && !event.relatedTarget) {
          if (CONFIG.DEBUG) console.warn("Mouse left document during drag, triggering MouseUp.");
          handleMouseUp(event);
      }
  }

  // ========================================================================
  // Snap Calculation and Visual Feedback Logic
  // (Code identical to v4.1 - No changes needed here)
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) { /* ... v4.1 code ... */
      const topOverlap = Math.max(sourceRect.top, targetRect.top); const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
      const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
      const minHeightReq = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;
      if (verticalOverlap < minHeightReq || verticalOverlap <= 0) { return null; }
      let distance, direction;
      const distRightToLeft = Math.abs(sourceRect.right - targetRect.left);
      const distLeftToRight = Math.abs(sourceRect.left - targetRect.right);
      if (distRightToLeft < distLeftToRight) { distance = distRightToLeft; direction = 'left'; }
      else { distance = distLeftToRight; direction = 'right'; }
      if (distance <= CONFIG.CONNECT_THRESHOLD) { return { direction, distance }; }
      else { return null; }
  }
  function checkAndHighlightForVisuals() { /* ... v4.1 code ... */
      if (!currentDraggedBlock) return;
      const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
      const sourceRect = currentDraggedBlock.getBoundingClientRect();
      const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                    .filter(block => block.offsetParent !== null);
      let bestTarget = null; let bestDirection = null; let minDistance = CONFIG.CONNECT_THRESHOLD + 1;
      if (potentialSnapTargetForVisuals && document.body.contains(potentialSnapTargetForVisuals)) { potentialSnapTargetForVisuals.classList.remove('snap-target', 'snap-left', 'snap-right'); }
      potentialSnapTargetForVisuals = null; snapDirectionForVisuals = null; removeFuturePositionIndicator();
      for (const targetBlock of allVisibleBlocks) {
          if (!targetBlock.id) generateUniqueId(targetBlock);
          const targetRect = targetBlock.getBoundingClientRect();
          const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
          const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');
          const snapInfo = calculateSnapInfo(sourceRect, targetRect);
          if (snapInfo) {
              let connectionAllowed = true;
              if (snapInfo.direction === 'left' && targetConnectedLeft) connectionAllowed = false;
              else if (snapInfo.direction === 'right' && targetConnectedRight) connectionAllowed = false;
              if (connectionAllowed && snapInfo.distance < minDistance) {
                  minDistance = snapInfo.distance; bestTarget = targetBlock; bestDirection = snapInfo.direction;
              }
          }
      }
      if (bestTarget) {
          potentialSnapTargetForVisuals = bestTarget; snapDirectionForVisuals = bestDirection;
          bestTarget.classList.add('snap-target', bestDirection === 'left' ? 'snap-left' : 'snap-right');
          if (CONFIG.DEBUG > 1) console.log(`[Visuals] Highlight ON for ${bestTarget.id}`);
          if (minDistance <= CONFIG.INDICATOR_TOUCH_THRESHOLD) {
              if (CONFIG.DEBUG > 1) console.log(`[Visuals] Indicator ON (dist ${minDistance.toFixed(1)} <= ${CONFIG.INDICATOR_TOUCH_THRESHOLD})`);
              updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programmingArea.getBoundingClientRect());
          } else {
              removeFuturePositionIndicator();
              if (CONFIG.DEBUG > 1) console.log(`[Visuals] Indicator OFF (dist ${minDistance.toFixed(1)} > ${CONFIG.INDICATOR_TOUCH_THRESHOLD})`);
          }
      } else {
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
       // Final check for connection conflicts
       if ((direction === 'left' && targetBlock.hasAttribute('data-connected-from-left')) ||
           (direction === 'right' && targetBlock.hasAttribute('data-connected-from-right'))) {
           console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} side '${direction}' became occupied just before snap.`);
           return false; // Indicate failure due to conflict
       }

      if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);

      try {
          const sourceRect = sourceBlock.getBoundingClientRect();
          const targetRect = targetBlock.getBoundingClientRect();
          const programmingArea = document.getElementById('program-blocks');
          const areaRect = programmingArea.getBoundingClientRect();

          // Calculate final position
          let finalPixelLeft, finalPixelTop;
          if (direction === 'left') {
              finalPixelLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
          } else {
              finalPixelLeft = targetRect.right + CONFIG.BLOCK_GAP;
          }
          finalPixelTop = targetRect.top;

          // Convert to style values
          let styleLeft = finalPixelLeft - areaRect.left + programmingArea.scrollLeft;
          let styleTop = finalPixelTop - areaRect.top + programmingArea.scrollTop;

          // Apply final position and styles
          sourceBlock.style.position = 'absolute';
          sourceBlock.style.left = `${Math.round(styleLeft)}px`;
          sourceBlock.style.top = `${Math.round(styleTop)}px`;
          sourceBlock.style.margin = '0';
          sourceBlock.style.zIndex = '';

          // Update connection attributes
          sourceBlock.setAttribute('data-connected-to', targetBlock.id);
          sourceBlock.setAttribute('data-connection-direction', direction);
          targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);

          // Add CSS classes
          sourceBlock.classList.add('connected-block');
          targetBlock.classList.add('has-connected-block');

          // --- Final steps ---
          playSnapSound();
          addSnapEffectAnimation(sourceBlock);
          sourceBlock.draggable = false; // Block is now connected

          // *** CHANGE V4.2: Remove highlight from target after successful snap ***
          if (targetBlock) {
              targetBlock.classList.remove('snap-target', 'snap-left', 'snap-right');
              if (CONFIG.DEBUG > 1) console.log(`[PerformSnap] Removed snap-target class from target ${targetBlock.id}`);
          }
          // *** END CHANGE V4.2 ***

          if (CONFIG.DEBUG) console.log(`[PerformSnap] Success. ${sourceBlock.id} final pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}. Draggable: ${sourceBlock.draggable}`);
          return true; // Indicate success

      } catch (err) {
          console.error(`[PerformSnap] Error during snap (${sourceBlock.id} -> ${targetBlock.id}):`, err);
          try { detachBlock(sourceBlock, false); }
          catch (detachErr) { console.error(`[PerformSnap] Error during cleanup detach:`, detachErr); }
          sourceBlock.draggable = true; // Ensure draggable after failure
          return false; // Indicate failure
      }
  }

  // Detaches a block from its connected neighbor
  function detachBlock(blockToDetach, playAnimation = true) {
      // (Code identical to v4.1 - No changes needed here)
      if (!blockToDetach) { console.warn("[Detach] Attempted to detach null block."); return; }
      const targetId = blockToDetach.getAttribute('data-connected-to');
      const direction = blockToDetach.getAttribute('data-connection-direction');
      if (!targetId || !direction) {
          blockToDetach.removeAttribute('data-connected-to'); blockToDetach.removeAttribute('data-connection-direction');
          blockToDetach.classList.remove('connected-block'); blockToDetach.draggable = true; return;
      }
      if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${blockToDetach.id} from ${targetId} (direction: ${direction})`);
      blockToDetach.removeAttribute('data-connected-to'); blockToDetach.removeAttribute('data-connection-direction');
      blockToDetach.classList.remove('connected-block'); blockToDetach.draggable = true;
      const targetBlock = document.getElementById(targetId);
      if (targetBlock) {
          const attributeToRemove = (direction === 'left') ? 'data-connected-from-left' : 'data-connected-from-right';
          targetBlock.removeAttribute(attributeToRemove);
          const stillHasConnections = targetBlock.hasAttribute('data-connected-from-left') || targetBlock.hasAttribute('data-connected-from-right') || targetBlock.hasAttribute('data-connected-to');
          if (!stillHasConnections) { targetBlock.classList.remove('has-connected-block'); }
          if (CONFIG.DEBUG > 1) console.log(`[Detach] Removed attribute ${attributeToRemove} from target ${targetId}. Target still connected: ${stillHasConnections}`);
      } else { console.warn(`[Detach] Target block with ID ${targetId} not found in DOM during detach.`); }
      if (playAnimation) { addDetachEffectAnimation(blockToDetach); }
      if (CONFIG.DEBUG) console.log(`[Detach] Finished detaching ${blockToDetach.id}. Draggable: ${blockToDetach.draggable}`);
  }

  // Updates the position and visibility of the blue dashed indicator
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programmingAreaRect) {
      // (Code identical to v4.1 - No changes needed here)
      const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
      if (!futureIndicator) {
          futureIndicator = document.createElement('div'); futureIndicator.id = 'future-position-indicator'; futureIndicator.className = 'future-position-indicator';
          programmingArea.appendChild(futureIndicator); if (CONFIG.DEBUG > 1) console.log("Created future position indicator.");
      }
      try {
          const sourceRect = sourceBlock.getBoundingClientRect(); const targetRect = targetBlock.getBoundingClientRect();
          let desiredVisualLeft, desiredVisualTop;
          if (direction === 'left') { desiredVisualLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP; }
          else { desiredVisualLeft = targetRect.right + CONFIG.BLOCK_GAP; }
          desiredVisualTop = targetRect.top;
          let indicatorStyleLeft = desiredVisualLeft - programmingAreaRect.left + programmingArea.scrollLeft;
          let indicatorStyleTop = desiredVisualTop - programmingAreaRect.top + programmingArea.scrollTop;
          futureIndicator.style.left = `${Math.round(indicatorStyleLeft)}px`; futureIndicator.style.top = `${Math.round(indicatorStyleTop)}px`;
          futureIndicator.style.width = `${Math.round(sourceRect.width)}px`; futureIndicator.style.height = `${Math.round(sourceRect.height)}px`;
          futureIndicator.classList.add('visible');
      } catch (err) { console.error('Error updating future position indicator:', err); removeFuturePositionIndicator(); }
  }

  // Hides the blue dashed indicator
  function removeFuturePositionIndicator() {
      // (Code identical to v4.1 - No changes needed here)
      if (futureIndicator) { futureIndicator.classList.remove('visible'); }
  }

  // Context Menu Handling
  function handleContextMenu(event) { /* ... v4.1 code ... */
      event.preventDefault(); const block = event.target.closest('.block-container');
      if (block && block.hasAttribute('data-connected-to')) { showDetachMenu(event.clientX, event.clientY, block); }
      else { removeDetachMenu(); }
  }
  function showDetachMenu(x, y, blockToDetach) { /* ... v4.1 code ... */
      removeDetachMenu(); const menu = document.createElement('div'); menu.id = 'detach-menu';
      menu.style.left = `${x}px`; menu.style.top = `${y}px`; const option = document.createElement('div');
      option.textContent = 'נתק בלוק'; option.onclick = (e) => { e.stopPropagation(); detachBlock(blockToDetach, true); removeDetachMenu(); };
      menu.appendChild(option); document.body.appendChild(menu);
      setTimeout(() => { document.addEventListener('click', closeMenuOutside, { capture: true, once: true }); window.addEventListener('scroll', removeDetachMenu, { capture: true, once: true }); }, 0);
  }
  function closeMenuOutside(event) { /* ... v4.1 code ... */
      const menu = document.getElementById('detach-menu');
      if (menu && !menu.contains(event.target)) { removeDetachMenu(); }
      else if (menu) { window.removeEventListener('scroll', removeDetachMenu, { capture: true }); setTimeout(() => { document.addEventListener('click', closeMenuOutside, { capture: true, once: true }); window.addEventListener('scroll', removeDetachMenu, { capture: true, once: true }); }, 0); }
      else { window.removeEventListener('scroll', removeDetachMenu, { capture: true }); }
  }
  function removeDetachMenu() { /* ... v4.1 code ... */
      const menu = document.getElementById('detach-menu');
      if (menu) { document.removeEventListener('click', closeMenuOutside, { capture: true }); window.removeEventListener('scroll', removeDetachMenu, { capture: true }); menu.remove(); }
  }

  // Animation Helpers
  function addSnapEffectAnimation(block) { /* ... v4.1 code ... */
      block.classList.remove('snap-animation'); void block.offsetWidth; block.classList.add('snap-animation');
      block.addEventListener('animationend', () => block.classList.remove('snap-animation'), { once: true });
  }
  function addDetachEffectAnimation(block) { /* ... v4.1 code ... */
      block.classList.remove('detach-animation'); void block.offsetWidth; block.classList.add('detach-animation');
      block.addEventListener('animationend', () => block.classList.remove('detach-animation'), { once: true });
  }

  // ========================================================================
  // Utility Functions
  // ========================================================================
  function generateUniqueId(blockElement) { /* ... v4.1 code ... */
      if (blockElement.id) return blockElement.id;
      const prefix = blockElement.dataset.type || 'block';
      let randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      let newId = `${prefix}-${randomSuffix}`; let attempts = 0;
      while (document.getElementById(newId) && attempts < 10) { newId = `${prefix}-${randomSuffix}-${attempts}`; attempts++; }
      if (attempts >= 10) { newId = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`; }
      blockElement.id = newId; if (CONFIG.DEBUG > 1) console.log(`Generated unique ID: ${newId}`); return newId;
  }

  // ========================================================================
  // System Initialization
  // ========================================================================
  function initializeSystem() {
      // Use a version-specific flag to prevent multiple initializations
      const initFlag = 'blockLinkageInitialized_v4_2_Protected'; // Updated version flag
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
          setTimeout(addSoundTestButton, 100); // Delay slightly
      }

      window[initFlag] = true; // Mark this version as initialized
      console.log(`Block linkage system initialized (${initFlag})`);
      console.log(`Configuration: Snap Threshold=${CONFIG.CONNECT_THRESHOLD}px, Indicator Threshold=${CONFIG.INDICATOR_TOUCH_THRESHOLD}px, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // Run initialization when the DOM is ready
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
      initializeSystem(); // DOM is already ready
  }

})(); // End of IIFE

// --- END OF FILE linkageimproved.js ---
