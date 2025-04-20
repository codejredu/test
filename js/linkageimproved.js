// --- START OF FILE linkageimproved.js ---
// --- Version 3.6: Removed Automatic Detach on Drag Start ---
// Changes from v3.5:
// 1. Removed the automatic detachment logic from handleMouseDown.
//    - Clicking and dragging an already connected block will move it visually,
//      but it remains logically connected to its original target.
//    - Snapping the dragged (but still connected) block to a NEW target will NOT work.
//    - Users MUST explicitly use the right-click -> "נתק בלוק" menu option
//      to disconnect a block before it can be re-snapped elsewhere.
// 2. Kept the "jump on release" behavior if a valid snap target was detected during drag.

(function() {
  // Globals
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;

  // Config
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 8, // Highlight/Snap candidate threshold
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4,
    BLOCK_GAP: 0, // Pin/socket connection
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3', // Verify path
    DEBUG: true // Set to false for production
  };

  // Styles - No changes from v3.5
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style'); style.id = 'block-connection-styles';
    style.textContent = `
      .snap-source { box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important; transition: box-shadow 0.15s ease-out; cursor: grabbing !important; z-index: 1001 !important; }
      .snap-target { outline: 6px solid #FFC107 !important; outline-offset: 4px; box-shadow: 0 0 20px 8px rgba(255,193,7,0.8) !important; transition: outline 0.1s ease-out, box-shadow 0.1s ease-out; z-index: 999 !important; }
      .future-position-indicator { position: absolute; border: 3px dashed rgba(0,120,255,0.95) !important; border-radius: 5px; background-color: rgba(0,120,255,0.15) !important; pointer-events: none; z-index: 998; opacity: 0; transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear; display: none; }
      .future-position-indicator.visible { display: block; opacity: 0.9; }
      .snap-target.snap-left::before { content:''; position:absolute; left:-10px; top:10%; bottom:10%; width:8px; background-color:#FFC107; border-radius:2px; z-index:1000; box-shadow:0 0 10px 2px rgba(255,193,7,0.8); transition:all 0.1s ease-out; }
      .snap-target.snap-right::after { content:''; position:absolute; right:-10px; top:10%; bottom:10%; width:8px; background-color:#FFC107; border-radius:2px; z-index:1000; box-shadow:0 0 10px 2px rgba(255,193,7,0.8); transition:all 0.1s ease-out; }
      @keyframes snapEffect { 0%{transform:scale(1)} 35%{transform:scale(1.05)} 70%{transform:scale(0.98)} 100%{transform:scale(1)} } .snap-animation { animation:snapEffect 0.3s ease-out; }
      @keyframes detachEffect { 0%{transform:translate(0,0) rotate(0)} 30%{transform:translate(3px,1px) rotate(0.8deg)} 60%{transform:translate(-2px,2px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0)} } .detach-animation { animation:detachEffect 0.3s ease-in-out; }
      #detach-menu { position:absolute; background-color:white; border:1px solid #ccc; border-radius:4px; box-shadow:0 3px 8px rgba(0,0,0,0.2); z-index:1100; padding:5px; font-size:14px; min-width:100px; } #detach-menu div { padding:6px 12px; cursor:pointer; border-radius:3px; } #detach-menu div:hover { background-color:#eee; }
      body.user-select-none { user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; }
      #sound-test-button { position:fixed; bottom:15px; right:15px; padding:8px 12px; background-color:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; z-index:9999; font-family:Arial,sans-serif; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background-color .2s,opacity .5s ease-out; opacity:1; } #sound-test-button:hover { background-color:#0b7dda; } #sound-test-button.success { background-color:#4CAF50; } #sound-test-button.error { background-color:#f44336; } #sound-test-button.loading { background-color:#ff9800; cursor:wait; } #sound-test-button.hidden { opacity:0; pointer-events:none; }
      .connected-block, .has-connected-block { /* Optional */ }
    `;
    document.head.appendChild(style); if (CONFIG.DEBUG) console.log('Styles added');
  }

  // Audio Init, Test Button, Play Sound - No changes from v3.5
  function initAudio() { if (!CONFIG.PLAY_SOUND || soundInitialized) return; try { const el=document.getElementById('snap-sound-element'); if(el){snapSound=el;soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio reused.');if(!el.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)){el.innerHTML='';const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';el.appendChild(s);el.load();}return;} snapSound=document.createElement('audio');snapSound.id='snap-sound-element';snapSound.preload='auto';snapSound.volume=CONFIG.SOUND_VOLUME;const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';snapSound.appendChild(s);snapSound.addEventListener('error',(e)=>{console.error(`Audio Error: ${CONFIG.SOUND_PATH}`,e);const b=document.getElementById('sound-test-button');if(b){b.textContent='שגיאה';b.className='error';b.disabled=true;}CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;});snapSound.addEventListener('canplaythrough',()=>{soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio ready.');const b=document.getElementById('sound-test-button');if(b?.classList.contains('loading')){b.textContent='בדוק';b.classList.remove('loading');b.disabled=false;}});snapSound.style.display='none';document.body.appendChild(snapSound);if(CONFIG.DEBUG)console.log(`Audio created: ${CONFIG.SOUND_PATH}`);}catch(err){console.error('Audio init error:',err);CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;}}
  function addSoundTestButton() { if(!CONFIG.PLAY_SOUND)return;try{const eb=document.getElementById('sound-test-button');if(eb)eb.remove();const b=document.createElement('button');b.id='sound-test-button';b.title='בדוק צליל';b.className='';if(!snapSound){b.textContent='שמע נכשל';b.classList.add('error');b.disabled=true;}else if(!soundInitialized){b.textContent='טוען...';b.classList.add('loading');b.disabled=true;}else{b.textContent='בדוק';b.disabled=false;}Object.assign(b.style, { position:'fixed', bottom:'15px', right:'15px', zIndex:'9999', padding:'8px 12px', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.2)', fontFamily:'Arial,sans-serif', fontSize:'14px', fontWeight:'bold', transition:'background-color .2s,opacity .5s ease-out', opacity:'1' });b.onmouseover=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#0b7dda'};b.onmouseout=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#2196F3'};b.addEventListener('click',function(){if(this.disabled||!snapSound||!soundInitialized)return;snapSound.play().then(()=>{b.textContent='פועל ✓';b.classList.add('success');audioContextAllowed=true;setTimeout(()=>{b.classList.add('hidden');setTimeout(()=>b.remove(),500)},3000);if(snapSound){snapSound.pause();snapSound.currentTime=0;}}).catch(err=>{console.warn('Sound test fail:',err.name);if(err.name==='NotAllowedError'){b.textContent='חסום-לחץ';b.classList.add('error');audioContextAllowed=false;}else{b.textContent='שגיאה';b.classList.add('error');b.disabled=true;}});});document.body.appendChild(b);if(CONFIG.DEBUG)console.log('Sound test button added.');}catch(err){console.error('Err adding sound btn:',err);}}
  function playSnapSound() { if(!CONFIG.PLAY_SOUND||!snapSound||!soundInitialized)return;if(!audioContextAllowed&&CONFIG.DEBUG)console.warn('Playing sound before user interaction.');try{if(snapSound.readyState<3){if(CONFIG.DEBUG)console.log('Snap sound skip: audio not ready.');return;}snapSound.pause();snapSound.currentTime=0;const pp=snapSound.play();if(pp!==undefined){pp.then(()=>{audioContextAllowed=true;if(CONFIG.DEBUG>1)console.log('Snap sound played.');}).catch(err=>{if(err.name==='NotAllowedError'){console.warn('Snap sound blocked.');audioContextAllowed=false;if(!document.getElementById('sound-test-button'))addSoundTestButton();}else if(err.name!=='AbortError'){console.error('Err play snap sound:',err);}});}}catch(err){console.error('Unexpected play sound err:',err);}}

  // Listeners, Block Detection, Context Menu - No changes from v3.5
  function initProgrammingAreaListeners() { const a=document.getElementById('program-blocks');if(!a)return;a.addEventListener('dragover',(e)=>e.preventDefault());a.addEventListener('dragstart',(e)=>{if(e.target?.closest?.('#program-blocks .block-container'))e.preventDefault();}); }
  function observeNewBlocks() { const a=document.getElementById('program-blocks');if(!a)return;const o=new MutationObserver((m)=>{m.forEach((mu)=>{if(mu.type==='childList'){mu.addedNodes.forEach((n)=>{if(n.nodeType===1){let b=n.classList?.contains('block-container')?n:n.querySelector?.('.block-container');if(b?.closest('#program-blocks')){if(!b.id)generateUniqueId(b);addBlockDragListeners(b);}}});}});});o.observe(a,{childList:true,subtree:true});if(CONFIG.DEBUG)console.log("MutationObserver watching."); }
  function initExistingBlocks() { document.querySelectorAll('#program-blocks .block-container').forEach(b=>{if(!b.id)generateUniqueId(b);addBlockDragListeners(b);});if(CONFIG.DEBUG)console.log("Listeners added to existing blocks."); }
  function addBlockDragListeners(b) { b.removeEventListener('mousedown',handleMouseDown);b.addEventListener('mousedown',handleMouseDown);b.removeEventListener('contextmenu',handleContextMenu);b.addEventListener('contextmenu',handleContextMenu); }
  function handleContextMenu(e) { e.preventDefault();const b=e.target.closest('.block-container');if(b?.hasAttribute('data-connected-to'))showDetachMenu(e.clientX,e.clientY,b); } // Right-click menu still works for detachment

  // *** MOUSE DOWN - VERSION 3.6 ***
  // REMOVED automatic detachment before drag starts.
  function handleMouseDown(e) {
      if (e.button !== 0 || !e.target.closest || e.target.matches('input, button, select, textarea, a[href]')) return;
      const block = e.target.closest('.block-container');
      if (!block || !block.parentElement || block.parentElement.id !== 'program-blocks') return;
      if (!block.id) generateUniqueId(block);
      e.preventDefault(); // Prevent default text selection/drag
      block.draggable = false; // Use our custom drag logic

      // *** הוסר הבלוק שהיה כאן וביצע ניתוק אוטומטי ***
      // if (block.hasAttribute('data-connected-to')) detachBlock(block, false);
      // const lId = block.getAttribute('data-connected-from-left'); if (lId) detachBlock(document.getElementById(lId), false);
      // const rId = block.getAttribute('data-connected-from-right'); if (rId) detachBlock(document.getElementById(rId), false);
      if (CONFIG.DEBUG) console.log(`[MouseDown v3.6] Start drag: ${block.id}. Auto-detach REMOVED.`);

      // Start dragging state (even if block is still logically connected)
      currentDraggedBlock = block;
      isDraggingBlock = true;
      const rect = block.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      const parentElement = document.getElementById('program-blocks');
      const parentRect = parentElement.getBoundingClientRect();
      if (window.getComputedStyle(block).position !== 'absolute') {
        block.style.position = 'absolute';
        block.style.left = (rect.left - parentRect.left + parentElement.scrollLeft) + 'px';
        block.style.top = (rect.top - parentRect.top + parentElement.scrollTop) + 'px';
      }
      block.style.margin = '0';
      block.style.zIndex = '1001';
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none');
  }

  // Global Listeners, MouseLeave, MouseMove - No changes from v3.5
  function initGlobalMouseListeners() { document.removeEventListener('mousemove',handleMouseMove);document.removeEventListener('mouseup',handleMouseUp);document.removeEventListener('mouseleave',handleMouseLeave);document.addEventListener('mousemove',handleMouseMove);document.addEventListener('mouseup',handleMouseUp);document.addEventListener('mouseleave',handleMouseLeave); }
  function handleMouseLeave(e) { if(isDraggingBlock&&e.target===document.documentElement&&!e.relatedTarget){if(CONFIG.DEBUG)console.warn("Mouse left doc during drag, mouseup.");handleMouseUp(e);} }
  function handleMouseMove(e) { if(!isDraggingBlock||!currentDraggedBlock)return;e.preventDefault();const pE=document.getElementById('program-blocks');if(!pE){handleMouseUp(e);return;}const pR=pE.getBoundingClientRect();let nL=e.clientX-pR.left-dragOffset.x+pE.scrollLeft;let nT=e.clientY-pR.top-dragOffset.y+pE.scrollTop;const bW=currentDraggedBlock.offsetWidth;const bH=currentDraggedBlock.offsetHeight;const sW=pE.scrollWidth;const sH=pE.scrollHeight;nL=Math.max(0,Math.min(nL,sW-bW));nT=Math.max(0,Math.min(nT,sH-bH));currentDraggedBlock.style.left=Math.round(nL)+'px';currentDraggedBlock.style.top=Math.round(nT)+'px';checkAndHighlightSnapPossibility(); }

  // MouseUp - Snap if Highlighted (Jump Behavior) - No changes from v3.5
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    const blockReleased = currentDraggedBlock;
    const candidateTarget = potentialSnapTarget;
    const candidateDirection = snapDirection;
    if (CONFIG.DEBUG) console.log(`[MouseUp v3.6] Releasing ${blockReleased.id}. Candidate: ${candidateTarget?.id || 'none'}, Dir: ${candidateDirection || 'none'}`);

    // --- Cleanup ---
    isDraggingBlock = false; currentDraggedBlock = null; potentialSnapTarget = null; snapDirection = null;
    document.body.classList.remove('user-select-none'); blockReleased.classList.remove('snap-source'); blockReleased.style.zIndex = '';
    document.querySelectorAll('.snap-target').forEach(el => { el.classList.remove('snap-target', 'snap-left', 'snap-right'); }); removeFuturePositionIndicator();
    // --- End cleanup ---

    // *** Snap Decision - Based only on candidate from drag ***
    let performSnap = false;
    // Crucial check: Only attempt snap IF THE RELEASED BLOCK IS NOT ALREADY CONNECTED TO SOMETHING ELSE
    // This prevents trying to snap a block that was dragged without being explicitly detached first.
    if (candidateTarget && candidateDirection && document.body.contains(candidateTarget) && !blockReleased.hasAttribute('data-connected-to')) {
        if (CONFIG.DEBUG) console.log(`[MouseUp v3.6] Candidate ${candidateTarget.id} was highlighted AND released block is free. Attempting snap.`);
        performSnap = true;
    } else {
        if (blockReleased.hasAttribute('data-connected-to')) {
             if (CONFIG.DEBUG) console.log(`[MouseUp v3.6] Block ${blockReleased.id} was released but is still logically connected (use right-click to detach first). No snap attempt.`);
        } else if (candidateTarget) {
             if (CONFIG.DEBUG) console.log(`[MouseUp v3.6] Candidate target ${candidateTarget.id} was invalid or disappeared. No snap attempt.`);
        } else {
             if (CONFIG.DEBUG) console.log(`[MouseUp v3.6] No candidate target identified during drag. No snap attempt.`);
        }
    }

    // Execute snap if decided
    if (performSnap) {
      const snapSuccess = performBlockSnap(blockReleased, candidateTarget, candidateDirection); // This performs the jump
      if (!snapSuccess) { blockReleased.draggable = true; if (CONFIG.DEBUG) console.log(`[MouseUp v3.6] Snap attempt failed. ${blockReleased.id} remains draggable.`); }
      else { if (CONFIG.DEBUG) console.log(`[MouseUp v3.6] Snap successful. ${blockReleased.id} jumped to position.`); }
    } else {
      // No snap occurred, block stays where it was released
      // If it was dragged while connected, it remains visually moved but logically connected.
      // If it was free, it remains free.
      if (CONFIG.DEBUG) console.log(`[MouseUp v3.6] No snap performed. Block ${blockReleased.id} state unchanged (remains free or remains connected).`);
      // Ensure a *free* block that didn't snap is draggable.
      // A block that was dragged *while connected* should arguably not be draggable either,
      // but let's make free blocks draggable again just in case.
      if (!blockReleased.hasAttribute('data-connected-to')) {
           blockReleased.draggable = true;
      } else {
           // Optional: Keep connected block non-draggable even after visual move?
           // blockReleased.draggable = false;
           // Let's default to false for now, as dragging it further won't help.
           blockReleased.draggable = false;
           if (CONFIG.DEBUG) console.log(`[MouseUp v3.6] Block ${blockReleased.id} was moved visually but remains connected and non-draggable.`);
      }
    }
    if (CONFIG.DEBUG) console.log(`[MouseUp v3.6] ----- End MouseUp for ${blockReleased.id} -----`);
  }

  // Check Highlight (MouseMove) - No changes from v3.5
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock || !isDraggingBlock) return;
    // *** Crucial Check: Do not check for snapping if the dragged block is still logically connected ***
    if (currentDraggedBlock.hasAttribute('data-connected-to')) {
        // If it's connected, remove any potential highlights from previous moves
        if (potentialSnapTarget) {
            potentialSnapTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
            potentialSnapTarget = null;
            snapDirection = null;
            removeFuturePositionIndicator();
            if (CONFIG.DEBUG > 1) console.log("[Highlight Check] Dragged block is connected, skipping snap checks.");
        }
        return; // Don't look for new snap targets
    }

    const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null);
    let bestTarget = null; let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1;

    // Reset previous highlights before checking new ones
    document.querySelectorAll('.snap-target').forEach(el => { el.classList.remove('snap-target', 'snap-left', 'snap-right'); });
    potentialSnapTarget = null; snapDirection = null;
    removeFuturePositionIndicator();

    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      const targetRect = targetBlock.getBoundingClientRect();
      const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');
      const snapInfo = calculateSnapInfo(sourceRect, targetRect); // Checks distance <= 8 and overlap

      if (snapInfo) {
         let connectionAllowed = true;
         if (snapInfo.direction === 'left' && targetConnectedLeft) connectionAllowed = false;
         else if (snapInfo.direction === 'right' && targetConnectedRight) connectionAllowed = false;
         if (connectionAllowed && snapInfo.distance < minDistance) { minDistance = snapInfo.distance; bestTarget = targetBlock; bestDirection = snapInfo.direction; }
      }
    }
    // Activate highlights if a valid, available target is found
    if (bestTarget) {
      if (CONFIG.DEBUG > 1) console.log(`[Highlight Check] Threshold met (${CONFIG.CONNECT_THRESHOLD}px): ${currentDraggedBlock.id} -> ${bestTarget.id}. Activating visuals.`);
      potentialSnapTarget = bestTarget; // Set candidate for MouseUp
      snapDirection = bestDirection;
      bestTarget.classList.add('snap-target', bestDirection === 'left' ? 'snap-left' : 'snap-right');
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programmingArea.getBoundingClientRect());
    }
  }

  // Calculate Snap Info (Distance/Overlap) - No changes from v3.5
  function calculateSnapInfo(sourceRect, targetRect) {
    const topOverlap=Math.max(sourceRect.top,targetRect.top);const bottomOverlap=Math.min(sourceRect.bottom,targetRect.bottom);const verticalOverlap=Math.max(0,bottomOverlap-topOverlap);const minHeightReq=Math.min(sourceRect.height,targetRect.height)*CONFIG.VERTICAL_OVERLAP_REQ;if(verticalOverlap<minHeightReq||verticalOverlap<=0)return null;
    let distance,direction;const distRightToLeft=Math.abs(sourceRect.right-targetRect.left);const distLeftToRight=Math.abs(sourceRect.left-targetRect.right);if(distRightToLeft<distLeftToRight){distance=distRightToLeft;direction='left';}else{distance=distLeftToRight;direction='right';}
    if(distance<=CONFIG.CONNECT_THRESHOLD){if(CONFIG.DEBUG>1)console.log(`[calculateSnapInfo] Within threshold (${CONFIG.CONNECT_THRESHOLD}px): dir=${direction}, dist=${distance.toFixed(1)}`);return{direction,distance};}
    return null;
  }

  // Perform Snap (The actual "Jump") - No changes from v3.5
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock) || targetBlock.offsetParent === null) { console.error("[PerformSnap] Invalid block(s). Snap cancelled."); return false; }
    if ((direction === 'left' && targetBlock.hasAttribute('data-connected-from-left')) || (direction === 'right' && targetBlock.hasAttribute('data-connected-from-right'))) { console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} conflict just before snap.`); return false; }
    // Ensure source block isn't trying to connect to itself or something it's already connected to indirectly
    if (sourceBlock.id === targetBlock.id || sourceBlock.contains(targetBlock) || targetBlock.contains(sourceBlock)) { console.warn(`[PerformSnap] Snap cancelled: Invalid connection attempt (self or descendant).`); return false; }
    // Prevent snapping if source already has a connection (should have been detached)
    if (sourceBlock.hasAttribute('data-connected-to')) { console.warn(`[PerformSnap] Snap cancelled: Source block ${sourceBlock.id} still has 'data-connected-to'. Detach first.`); return false; }

    if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);
    try {
      const sourceRect = sourceBlock.getBoundingClientRect(); const targetRect = targetBlock.getBoundingClientRect();
      const pE = document.getElementById('program-blocks'); const pR = pE.getBoundingClientRect();
      let finalLeft = (direction === 'left') ? (targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP) : (targetRect.right + CONFIG.BLOCK_GAP);
      const finalTop = targetRect.top; let styleLeft = finalLeft - pR.left + pE.scrollLeft; let styleTop = finalTop - pR.top + pE.scrollTop;
      sourceBlock.style.position = 'absolute'; sourceBlock.style.left = `${Math.round(styleLeft)}px`; sourceBlock.style.top = `${Math.round(styleTop)}px`; sourceBlock.style.margin = '0';
      sourceBlock.setAttribute('data-connected-to', targetBlock.id); sourceBlock.setAttribute('data-connection-direction', direction); targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id); sourceBlock.classList.add('connected-block'); targetBlock.classList.add('has-connected-block');
      playSnapSound(); addSnapEffectAnimation(sourceBlock);
      sourceBlock.draggable = false; // Connected block is not draggable
      if (CONFIG.DEBUG) console.log(`[PerformSnap] Success. ${sourceBlock.id} pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}. Draggable: ${sourceBlock.draggable}`);
      return true;
    } catch (err) { console.error(`[PerformSnap] Error for ${sourceBlock.id} -> ${targetBlock.id}:`, err); try { detachBlock(sourceBlock, false); } catch (derr) { console.error(`[PerformSnap] Cleanup detach error:`, derr); } sourceBlock.draggable = true; return false; }
  }

  // Indicator Update/Remove, Detach functions, Animation, Unique ID - No changes from v3.5
  function updateFuturePositionIndicator(sB,tB,dir,pR){const pA=document.getElementById('program-blocks');if(!pA)return;if(!futureIndicator){futureIndicator=document.createElement('div');futureIndicator.id='future-position-indicator';futureIndicator.className='future-position-indicator';pA.appendChild(futureIndicator);}try{const sRN=sB.getBoundingClientRect();const tR=tB.getBoundingClientRect();const pRct=pA.getBoundingClientRect();let dVL=(dir==='left')?(tR.left-sRN.width-CONFIG.BLOCK_GAP):(tR.right+CONFIG.BLOCK_GAP);let dVT=tR.top;let iL=dVL-pRct.left+pA.scrollLeft;let iT=dVT-pRct.top+pA.scrollTop;futureIndicator.style.left=Math.round(iL)+'px';futureIndicator.style.top=Math.round(iT)+'px';futureIndicator.style.width=Math.round(sRN.width)+'px';futureIndicator.style.height=Math.round(sRN.height)+'px';futureIndicator.classList.add('visible');}catch(err){console.error('Err updating future indicator:',err);removeFuturePositionIndicator();}}
  function removeFuturePositionIndicator() { if(futureIndicator)futureIndicator.classList.remove('visible'); }
  function showDetachMenu(x,y,b){removeDetachMenu();const m=document.createElement('div');m.id='detach-menu';m.style.left=`${x}px`;m.style.top=`${y}px`;const o=document.createElement('div');o.textContent='נתק בלוק';o.onclick=(e)=>{e.stopPropagation();detachBlock(b,true);removeDetachMenu();};m.appendChild(o);document.body.appendChild(m);setTimeout(()=>{document.addEventListener('click',closeMenuOutside,{capture:true,once:true});window.addEventListener('scroll',removeDetachMenu,{capture:true,once:true});},0);}
  function closeMenuOutside(e){const m=document.getElementById('detach-menu');if(m&&!m.contains(e.target))removeDetachMenu();else if(m)setTimeout(()=>document.addEventListener('click',closeMenuOutside,{capture:true,once:true}),0);window.removeEventListener('scroll',removeDetachMenu,{capture:true});}
  function removeDetachMenu(){const m=document.getElementById('detach-menu');if(m){document.removeEventListener('click',closeMenuOutside,{capture:true});window.removeEventListener('scroll',removeDetachMenu,{capture:true});m.remove();}}
  // detachBlock now only called by right-click menu
  function detachBlock(btd,animate=true){if(!btd||!btd.hasAttribute('data-connected-to'))return;const tid=btd.getAttribute('data-connected-to');const dir=btd.getAttribute('data-connection-direction');if(!tid||!dir){console.warn(`[Detach] Missing data on ${btd.id}. Clean.`);btd.removeAttribute('data-connected-to');btd.removeAttribute('data-connection-direction');btd.classList.remove('connected-block');btd.draggable=true;return;}if(CONFIG.DEBUG)console.log(`[Detach Menu] Detaching ${btd.id} from ${tid}`);btd.removeAttribute('data-connected-to');btd.removeAttribute('data-connection-direction');btd.classList.remove('connected-block');btd.draggable=true; const tb=document.getElementById(tid);if(tb){tb.removeAttribute(dir==='left'?'data-connected-from-left':'data-connected-from-right');const hoc=tb.hasAttribute('data-connected-from-left')||tb.hasAttribute('data-connected-from-right')||tb.hasAttribute('data-connected-to');if(!hoc)tb.classList.remove('has-connected-block');}else{console.warn(`[Detach Menu] Target ${tid} not found.`);}if(animate)addDetachEffectAnimation(btd);if(CONFIG.DEBUG)console.log(`[Detach Menu] Finished ${btd.id}. Draggable: ${btd.draggable}`);}
  function addSnapEffectAnimation(b){b.classList.remove('snap-animation');void b.offsetWidth;b.classList.add('snap-animation');b.addEventListener('animationend',()=>b.classList.remove('snap-animation'),{once:true});}
  function addDetachEffectAnimation(b){b.classList.remove('detach-animation');void b.offsetWidth;b.classList.add('detach-animation');b.addEventListener('animationend',()=>b.classList.remove('detach-animation'),{once:true});}
  function generateUniqueId(b){if(b.id)return b.id;const p=b.dataset.type||'block';let s=Math.floor(Math.random()*10000).toString().padStart(4,'0');let id=`${p}-${s}`;let i=0;while(document.getElementById(id)&&i<10){id=`${p}-${s}-${i++}`;}if(i>=10)id=`${p}-${Date.now()}`;b.id=id;if(CONFIG.DEBUG)console.log(`Generated ID: ${id}`);return id;}

  // System Init
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v3_6';
    if (window[initFlag]) { if (CONFIG.DEBUG) console.log("Block linkage v3.6 already initialized."); return; }
    addHighlightStyles(); initAudio(); initProgrammingAreaListeners(); observeNewBlocks(); initExistingBlocks(); initGlobalMouseListeners();
    if (CONFIG.PLAY_SOUND) { addSoundTestButton(); }
    window[initFlag] = true;
    console.log(`Block linkage system initialized (Version 3.6 - No Auto Detach, Threshold=${CONFIG.CONNECT_THRESHOLD}px)`);
    console.log(`Config: Threshold=${CONFIG.CONNECT_THRESHOLD}px, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND?'Enabled':'Disabled'}`);
  }

  // Start
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeSystem); }
  else { initializeSystem(); }

})(); // End IIFE
// --- END OF FILE linkageimproved.js ---
