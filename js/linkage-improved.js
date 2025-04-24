// --- START OF FILE linkageimproved.js ---
// --- Version 3.5: Reverted to Snap-on-Release if Highlighted (Jumping Behavior) ---
// Changes from v3.4:
// 1. Increased CONNECT_THRESHOLD back to 8px as requested.
// 2. Reverted handleMouseUp logic: Removed the final proximity check.
//    If a potential target was highlighted *during* the drag (within 8px),
//    the dragged block will now "jump" and snap to that target upon release,
//    even if slightly outside the 8px threshold at the exact moment of release.
//    This restores the "jumping" behavior.

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null; // Stores the candidate target identified during move
  let snapDirection = null; // Stores the candidate direction identified during move
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5,
    // *** שונה בחזרה ל-8 ***
    CONNECT_THRESHOLD: 8, // סף להפעלת הדגשה וזיהוי יעד פוטנציאלי
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות
    BLOCK_GAP: 0, // אין רווח - חיבור שקע-תקע
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3', // ודא שהנתיב נכון
    DEBUG: true // Set to false for production
  };

  // ========================================================================
  // הוספת סגנונות CSS - הילה צהובה, מחוון כחול (ללא שינוי מ-v3.3/3.4)
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
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
      .connected-block, .has-connected-block { /* Optional */ }
      #sound-test-button { position:fixed; bottom:15px; right:15px; padding:8px 12px; background-color:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; z-index:9999; font-family:Arial,sans-serif; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background-color .2s,opacity .5s ease-out; opacity:1; } #sound-test-button:hover { background-color:#0b7dda; } #sound-test-button.success { background-color:#4CAF50; } #sound-test-button.error { background-color:#f44336; } #sound-test-button.loading { background-color:#ff9800; cursor:wait; } #sound-test-button.hidden { opacity:0; pointer-events:none; }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Styles added (Yellow Halo, Blue Indicator)');
  }

  // ========================================================================
  // אתחול אודיו, כפתור בדיקה, נגינת צליל - ללא שינוי מ-v3.4
  // ========================================================================
  function initAudio() { if (!CONFIG.PLAY_SOUND || soundInitialized) return; try { const el=document.getElementById('snap-sound-element'); if(el){snapSound=el;soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio reused.');if(!el.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)){el.innerHTML='';const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';el.appendChild(s);el.load();}return;} snapSound=document.createElement('audio');snapSound.id='snap-sound-element';snapSound.preload='auto';snapSound.volume=CONFIG.SOUND_VOLUME;const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';snapSound.appendChild(s);snapSound.addEventListener('error',(e)=>{console.error(`Audio Error: ${CONFIG.SOUND_PATH}`,e);const b=document.getElementById('sound-test-button');if(b){b.textContent='שגיאה';b.className='error';b.disabled=true;}CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;});snapSound.addEventListener('canplaythrough',()=>{soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio ready.');const b=document.getElementById('sound-test-button');if(b?.classList.contains('loading')){b.textContent='בדוק';b.classList.remove('loading');b.disabled=false;}});snapSound.style.display='none';document.body.appendChild(snapSound);if(CONFIG.DEBUG)console.log(`Audio created: ${CONFIG.SOUND_PATH}`);}catch(err){console.error('Audio init error:',err);CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;}}
  function addSoundTestButton() { if(!CONFIG.PLAY_SOUND)return;try{const eb=document.getElementById('sound-test-button');if(eb)eb.remove();const b=document.createElement('button');b.id='sound-test-button';b.title='בדוק צליל';b.className='';if(!snapSound){b.textContent='שמע נכשל';b.classList.add('error');b.disabled=true;}else if(!soundInitialized){b.textContent='טוען...';b.classList.add('loading');b.disabled=true;}else{b.textContent='בדוק';b.disabled=false;}Object.assign(b.style,{position:'fixed',bottom:'15px',right:'15px',zIndex:'9999',padding:'8px 12px',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',boxShadow:'0 2px 5px rgba(0,0,0,0.2)',fontFamily:'Arial,sans-serif',fontSize:'14px',fontWeight:'bold',transition:'background-color .2s,opacity .5s ease-out',opacity:'1'});b.onmouseover=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#0b7dda'};b.onmouseout=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#2196F3'};b.addEventListener('click',function(){if(this.disabled||!snapSound||!soundInitialized)return;snapSound.play().then(()=>{b.textContent='פועל ✓';b.classList.add('success');audioContextAllowed=true;setTimeout(()=>{b.classList.add('hidden');setTimeout(()=>b.remove(),500)},3000);if(snapSound){snapSound.pause();snapSound.currentTime=0;}}).catch(err=>{console.warn('Sound test fail:',err.name);if(err.name==='NotAllowedError'){b.textContent='חסום-לחץ';b.classList.add('error');audioContextAllowed=false;}else{b.textContent='שגיאה';b.classList.add('error');b.disabled=true;}});});document.body.appendChild(b);if(CONFIG.DEBUG)console.log('Sound test button added.');}catch(err){console.error('Err adding sound btn:',err);}}
  function playSnapSound() { if(!CONFIG.PLAY_SOUND||!snapSound||!soundInitialized)return;if(!audioContextAllowed&&CONFIG.DEBUG)console.warn('Playing sound before user interaction.');try{if(snapSound.readyState<3){if(CONFIG.DEBUG)console.log('Snap sound skip: audio not ready.');return;}snapSound.pause();snapSound.currentTime=0;const pp=snapSound.play();if(pp!==undefined){pp.then(()=>{audioContextAllowed=true;if(CONFIG.DEBUG>1)console.log('Snap sound played.');}).catch(err=>{if(err.name==='NotAllowedError'){console.warn('Snap sound blocked.');audioContextAllowed=false;if(!document.getElementById('sound-test-button'))addSoundTestButton();}else if(err.name!=='AbortError'){console.error('Err play snap sound:',err);}});}}catch(err){console.error('Unexpected play sound err:',err);}}

  // ========================================================================
  // מאזינים, זיהוי בלוקים, קליק ימני, MouseDown - ללא שינוי מ-v3.4
  // ========================================================================
  function initProgrammingAreaListeners() { const a=document.getElementById('program-blocks');if(!a)return;a.addEventListener('dragover',(e)=>e.preventDefault());a.addEventListener('dragstart',(e)=>{if(e.target?.closest?.('#program-blocks .block-container'))e.preventDefault();}); }
  function observeNewBlocks() { const a=document.getElementById('program-blocks');if(!a)return;const o=new MutationObserver((m)=>{m.forEach((mu)=>{if(mu.type==='childList'){mu.addedNodes.forEach((n)=>{if(n.nodeType===1){let b=n.classList?.contains('block-container')?n:n.querySelector?.('.block-container');if(b?.closest('#program-blocks')){if(!b.id)generateUniqueId(b);addBlockDragListeners(b);}}});}});});o.observe(a,{childList:true,subtree:true});if(CONFIG.DEBUG)console.log("MutationObserver watching."); }
  function initExistingBlocks() { document.querySelectorAll('#program-blocks .block-container').forEach(b=>{if(!b.id)generateUniqueId(b);addBlockDragListeners(b);});if(CONFIG.DEBUG)console.log("Listeners added to existing blocks."); }
  function addBlockDragListeners(b) { b.removeEventListener('mousedown',handleMouseDown);b.addEventListener('mousedown',handleMouseDown);b.removeEventListener('contextmenu',handleContextMenu);b.addEventListener('contextmenu',handleContextMenu); }
  function handleContextMenu(e) { e.preventDefault();const b=e.target.closest('.block-container');if(b?.hasAttribute('data-connected-to'))showDetachMenu(e.clientX,e.clientY,b); }
  function handleMouseDown(e) { if(e.button!==0||!e.target.closest||e.target.matches('input,button,select,textarea,a[href]'))return;const b=e.target.closest('.block-container');if(!b||!b.parentElement||b.parentElement.id!=='program-blocks')return;if(!b.id)generateUniqueId(b);e.preventDefault();b.draggable=false;if(CONFIG.DEBUG)console.log(`[MouseDown] Start drag: ${b.id}`);if(b.hasAttribute('data-connected-to'))detachBlock(b,false);const lId=b.getAttribute('data-connected-from-left');if(lId)detachBlock(document.getElementById(lId),false);const rId=b.getAttribute('data-connected-from-right');if(rId)detachBlock(document.getElementById(rId),false);currentDraggedBlock=b;isDraggingBlock=true;const r=b.getBoundingClientRect();dragOffset.x=e.clientX-r.left;dragOffset.y=e.clientY-r.top;const pE=document.getElementById('program-blocks');const pR=pE.getBoundingClientRect();if(window.getComputedStyle(b).position!=='absolute'){b.style.position='absolute';b.style.left=(r.left-pR.left+pE.scrollLeft)+'px';b.style.top=(r.top-pR.top+pE.scrollTop)+'px';}b.style.margin='0';b.style.zIndex='1001';b.classList.add('snap-source');document.body.classList.add('user-select-none'); }

  // ========================================================================
  // מאזינים גלובליים, MouseLeave, MouseMove - ללא שינוי מ-v3.4
  // ========================================================================
  function initGlobalMouseListeners() { document.removeEventListener('mousemove',handleMouseMove);document.removeEventListener('mouseup',handleMouseUp);document.removeEventListener('mouseleave',handleMouseLeave);document.addEventListener('mousemove',handleMouseMove);document.addEventListener('mouseup',handleMouseUp);document.addEventListener('mouseleave',handleMouseLeave); }
  function handleMouseLeave(e) { if(isDraggingBlock&&e.target===document.documentElement&&!e.relatedTarget){if(CONFIG.DEBUG)console.warn("Mouse left doc during drag, mouseup.");handleMouseUp(e);} }
  function handleMouseMove(e) { if(!isDraggingBlock||!currentDraggedBlock)return;e.preventDefault();const pE=document.getElementById('program-blocks');if(!pE){handleMouseUp(e);return;}const pR=pE.getBoundingClientRect();let x=e.clientX-pR.left-dragOffset.x+pE.scrollLeft;let y=e.clientY-pR.top-dragOffset.y+pE.scrollTop;const minX=pR.left+pE.scrollLeft-dragOffset.x;const minY=pR.top+pE.scrollTop-dragOffset.y;const maxX=pR.right+pE.scrollLeft-dragOffset.x;const maxY=pR.bottom+pE.scrollTop-dragOffset.y;x=Math.max(minX,Math.min(maxX,x));y=Math.max(minY,Math.min(maxY,y));currentDraggedBlock.style.left=x+'px';currentDraggedBlock.style.top=y+'px';let closestTarget=null;let closestDistance=Infinity;let targetSnapDirection=null;document.querySelectorAll('#program-blocks .block-container').forEach(targetBlock=>{if(targetBlock===currentDraggedBlock||targetBlock.hasAttribute('data-connected-to')||targetBlock.hasAttribute('data-connected-from-left')||targetBlock.hasAttribute('data-connected-from-right'))return;const tR=targetBlock.getBoundingClientRect();const cR=currentDraggedBlock.getBoundingClientRect();const overlap=Math.max(0,Math.min(cR.bottom,tR.bottom)-Math.max(cR.top,tR.top));if(overlap<(Math.min(cR.height,tR.height)*CONFIG.VERTICAL_OVERLAP_REQ))return;let dL=Math.abs(x-(tR.left+tR.width-CONFIG.PIN_WIDTH-CONFIG.BLOCK_GAP));let dR=Math.abs(x-(tR.left-cR.width+CONFIG.PIN_WIDTH+CONFIG.BLOCK_GAP));if(dL<closestDistance&&dL<=CONFIG.CONNECT_THRESHOLD){closestDistance=dL;closestTarget=targetBlock;targetSnapDirection='left';}if(dR<closestDistance&&dR<=CONFIG.CONNECT_THRESHOLD){closestDistance=dR;closestTarget=targetBlock;targetSnapDirection='right';}if(closestTarget){if(potentialSnapTarget!==closestTarget||snapDirection!==targetSnapDirection){clearSnapFeedback();potentialSnapTarget=closestTarget;snapDirection=targetSnapDirection;potentialSnapTarget.classList.add('snap-target');potentialSnapTarget.classList.add(`snap-${targetSnapDirection}`);showFuturePosition(currentDraggedBlock,potentialSnapTarget,targetSnapDirection);}}else{clearSnapFeedback();potentialSnapTarget=null;snapDirection=null;} }); }

  // ========================================================================
  // סיום גרירה, חיבור, ניתוק - עם שינוי הלוגיקה ל"הצמדה אם הודגש"
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock) return;
    e.preventDefault();
    isDraggingBlock = false;
    document.body.classList.remove('user-select-none');
    currentDraggedBlock.classList.remove('snap-source');
    let snapped = false;

    if (potentialSnapTarget) {
      // *** שינוי לוגיקה: הצמד אם היה מודגש (בתוך הסף) במהלך הגרירה ***
      const targetRect = potentialSnapTarget.getBoundingClientRect();
      const currentRect = currentDraggedBlock.getBoundingClientRect();

      if (snapDirection === 'left') {
        currentDraggedBlock.style.left = (targetRect.left + targetRect.width - CONFIG.PIN_WIDTH - CONFIG.BLOCK_GAP) + 'px';
        connectBlocks(potentialSnapTarget, currentDraggedBlock, 'left');
        snapped = true;
      } else if (snapDirection === 'right') {
        currentDraggedBlock.style.left = (targetRect.left - currentRect.width + CONFIG.PIN_WIDTH + CONFIG.BLOCK_GAP) + 'px';
        connectBlocks(currentDraggedBlock, potentialSnapTarget, 'left');
        snapped = true;
      }
      if (snapped) {
        currentDraggedBlock.classList.add('snap-animation');
        playSnapSound();
        setTimeout(() => currentDraggedBlock.classList.remove('snap-animation'), 300);
      }
    }

    if (!snapped) {
      clearSnapFeedback();
    }
    currentDraggedBlock.style.zIndex = '1000';
    currentDraggedBlock.draggable = true;
    currentDraggedBlock = null;
  }


  function connectBlocks(block1, block2, direction) {
    if (!block1 || !block2) return;
    if (CONFIG.DEBUG) console.log(`Connecting ${block1.id} to ${block2.id} from ${direction}`);
    if (direction === 'left') {
      block1.setAttribute('data-connected-to', block2.id);
      block2.setAttribute('data-connected-from-left', block1.id);
    } else {
      block1.setAttribute('data-connected-to', block2.id);
      block2.setAttribute('data-connected-from-right', block1.id);
    }
    block1.classList.add('connected-block');
    block2.classList.add('has-connected-block');
  }

  function detachBlock(block, animate = true) {
    if (!block) return;
    const connectedToId = block.getAttribute('data-connected-to');
    const connectedFromLeftId = block.getAttribute('data-connected-from-left');
    const connectedFromRightId = block.getAttribute('data-connected-from-right');
    let detachedBlock = null;
    if (connectedToId) {
      detachedBlock = document.getElementById(connectedToId);
      if (detachedBlock) {
        if (CONFIG.DEBUG) console.log(`Detaching ${block.id} from ${detachedBlock.id}`);
        block.removeAttribute('data-connected-to');
        detachedBlock.classList.remove('has-connected-block');
        if (animate) {
          block.classList.add('detach-animation');
          setTimeout(() => block.classList.remove('detach-animation'), 300);
        }
      }
    }
    if (connectedFromLeftId) {
      const leftBlock = document.getElementById(connectedFromLeftId);
      if (leftBlock) {
        leftBlock.removeAttribute('data-connected-from-left');
        leftBlock.classList.remove('connected-block');
      }
    }
    if (connectedFromRightId) {
      const rightBlock = document.getElementById(connectedFromRightId);
      if (rightBlock) {
        rightBlock.removeAttribute('data-connected-from-right');
        rightBlock.classList.remove('connected-block');
      }
    }
    block.classList.remove('connected-block');
    return detachedBlock;
  }

  // ========================================================================
  // תפריט ניתוק בלוקים (קליק ימני) - ללא שינוי מ-v3.4
  // ========================================================================
  function showDetachMenu(x, y, block) {
    const menuId = 'detach-menu';
    let menu = document.getElementById(menuId);
    if (!menu) {
      menu = document.createElement('div');
      menu.id = menuId;
      menu.style.position = 'absolute';
      menu.style.backgroundColor = 'white';
      menu.style.border = '1px solid #ccc';
      menu.style.borderRadius = '4px';
      menu.style.boxShadow = '0 3px 8px rgba(0,0,0,0.2)';
      menu.style.zIndex = '1100';
      menu.style.padding = '5px';
      menu.style.fontSize = '14px';
      menu.style.minWidth = '100px';
      document.body.appendChild(menu);
    } else {
      menu.innerHTML = '';
    }
    const detach خودش = document.createElement('div');
    detach خودش.textContent = 'נתק בלוק זה';
    detach خودش.style.padding = '6px 12px';
    detach خودش.style.cursor = 'pointer';
    detach خودش.style.borderRadius = '3px';
    detach خودش.addEventListener('click', () => {
      detachBlock(block);
      menu.remove();
    });
    menu.appendChild(detach خودش);
    if (block.getAttribute('data-connected-to')) {
      const detachNext = document.createElement('div');
      detachNext.textContent = 'נתקאת הבא';
      detachNext.style.padding = '6px 12px';
      detachNext.style.cursor = 'pointer';
      detachNext.style.borderRadius = '3px';
      detachNext.addEventListener('click', () => {
        const nextBlockId = block.getAttribute('data-connected-to');
        if (nextBlockId) {
          detachBlock(document.getElementById(nextBlockId));
        }
        menu.remove();
      });
      menu.appendChild(detachNext);
    }
    if (block.getAttribute('data-connected-from-left') || block.getAttribute('data-connected-from-right')) {
      const detachPrevious = document.createElement('div');
      detachPrevious.textContent = 'נתק את הקודם';
      detachPrevious.style.padding = '6px 12px';
      detachPrevious.style.cursor = 'pointer';
      detachPrevious.style.borderRadius = '3px';
      detachPrevious.addEventListener('click', () => {
        const prevBlockId = block.getAttribute('data-connected-from-left') || block.getAttribute('data-connected-from-right');
        if (prevBlockId) {
          detachBlock(document.getElementById(prevBlockId));
        }
        menu.remove();
      });
      menu.appendChild(detachPrevious);
    }
    const ילדים = document.createElement('div');
    ילדים.textContent = 'נתק הכל מתחת';
    ילדים.style.padding = '6px 12px';
    ילדים.style.cursor = 'pointer';
    ילדים.style.borderRadius = '3px';
    ילדים.addEventListener('click', () => {
      let currentBlock = block;
      while (currentBlock) {
        const nextBlockId = currentBlock.getAttribute('data-connected-to');
        detachBlock(currentBlock);
        if (nextBlockId) {
          currentBlock = document.getElementById(nextBlockId);
        } else {
          currentBlock = null;
        }
      }
      menu.remove();
    });
    menu.appendChild(ילדים);
    menu.querySelectorAll('div').forEach(div => {
      div.addEventListener('mouseover', () => {
        div.style.backgroundColor = '#eee';
      });
      div.addEventListener('mouseout', () => {
        div.style.backgroundColor = 'transparent';
      });
    });
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
  }

  // ========================================================================
  // מחוון מיקום עתידי (פס כחול) - ללא שינוי מ-v3.4
  // ========================================================================
  function showFuturePosition(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock || !direction) {
      if (futureIndicator) futureIndicator.classList.remove('visible');
      return;
    }
    const sourceRect = sourceBlock.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    const pE = document.getElementById('program-blocks');
    if (!pE) return;
    const pR = pE.getBoundingClientRect();
    let x, y;
    if (direction === 'left') {
      x = targetRect.left + targetRect.width - CONFIG.PIN_WIDTH - CONFIG.BLOCK_GAP - pR.left + pE.scrollLeft;
      y = targetRect.top - pR.top + pE.scrollTop;
    } else {
      x = targetRect.left - sourceRect.width + CONFIG.PIN_WIDTH + CONFIG.BLOCK_GAP - pR.left + pE.scrollLeft;
      y = targetRect.top - pR.top + pE.scrollTop;
    }
    if (!futureIndicator) {
      futureIndicator = document.createElement('div');
      futureIndicator.className = 'future-position-indicator';
      pE.appendChild(futureIndicator);
    }
    futureIndicator.style.left = x + 'px';
    futureIndicator.style.top = y + 'px';
    futureIndicator.style.width = sourceRect.width + 'px';
    futureIndicator.style.height = sourceRect.height + 'px';
    futureIndicator.classList.add('visible');
  }

  function clearSnapFeedback() {
    if (potentialSnapTarget) {
      potentialSnapTarget.classList.remove('snap-target');
      potentialSnapTarget.classList.remove('snap-left');
      potentialSnapTarget.classList.remove('snap-right');
    }
    if (futureIndicator) futureIndicator.classList.remove('visible');
    potentialSnapTarget = null;
    snapDirection = null;
  }

  // ========================================================================
  // עזרים שונים (generateId, initializeSystem) - ללא שינוי מ-v3.4
  // ========================================================================
  function generateUniqueId(b) {
    if (b.id) return b.id;
    const p = 'block';
    const s = Math.random().toString(36).substring(2, 9);
    let id = `${p}-${s}`;
    let i = 0;
    while (document.getElementById(id) && i < 10) {
      id = `${p}-${s}-${i++}`;
    }
    if (i >= 10) id = `${p}-${Date.now()}`;
    b.id = id;
    if (CONFIG.DEBUG) console.log(`Generated ID: ${id}`);
    return id;
  }

  // ========================================================================
  // אתחול המערכת כולה
  // ========================================================================
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v3_5'; // Version specific flag
    if (window[initFlag]) {
      if (CONFIG.DEBUG) console.log("Block linkage system v3.5 already initialized. Skipping.");
      return;
    }

    addHighlightStyles();
    initAudio();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();

    if (CONFIG.PLAY_SOUND) { addSoundTestButton(); }

    window[initFlag] = true; // Mark as initialized
    console.log(`Block linkage system initialized (Version 3.5 - Snap Jump on Release, Threshold=${CONFIG.CONNECT_THRESHOLD}px)`);
    console.log(`Configuration: Snap Threshold=${CONFIG.CONNECT_THRESHOLD}px, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ * 100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // הפעל את האתחול
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem();
  }
})();
