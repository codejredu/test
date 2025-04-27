// --- START OF FILE linkageimproved.js ---
// --- Version 3.8.1: Visible Highlight Fix ---
// Changes from v3.8:
// 1. Reverted CSS to make connection points visible during highlight (opacity: 1).
// 2. Added call to clearAllHighlights() after snap attempt in handleMouseUp
//    to ensure points disappear immediately after connection sound.

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null; // Note: Declared but not used
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    CONNECT_THRESHOLD: 25, // סף רחב יותר להפעלת זיהוי חיבור
    VERTICAL_ALIGN_THRESHOLD: 20, // Note: Declared but not used
    VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות
    BLOCK_GAP: 0, // Note: Declared but not used
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true, // Set to false for production
    HIGHLIGHT_COLOR_RIGHT: '#FFC107', // צהוב לצד ימין (בליטה)
    HIGHLIGHT_COLOR_LEFT: '#2196F3', // כחול לצד שמאל (שקע)
    HIGHLIGHT_OPACITY: 0.8, // Note: Declared but not used directly for points

    // ערכי היסט קבועים לחיבור פאזל מדויק
    PUZZLE_RIGHT_BULGE_WIDTH: 10,
    PUZZLE_LEFT_SOCKET_WIDTH: 10,
    VERTICAL_CENTER_OFFSET: 0,
    HORIZONTAL_FINE_TUNING: -9
  };

  // ========================================================================
  // הוספת סגנונות CSS - עבור הדגשת נקודות עיגון והדגשות
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      .snap-source {
        box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important;
        cursor: grabbing !important;
        z-index: 1001 !important;
      }

      /* נקודות חיבור - צד ימין (בליטה) */
      .right-connection-point {
        position: absolute;
        width: 14px;
        height: 14px;
        top: 50%;
        right: -7px;
        transform: translateY(-50%);
        background-color: ${CONFIG.HIGHLIGHT_COLOR_RIGHT};
        border-radius: 50%;
        opacity: 0; /* Start hidden */
        transition: opacity 0.2s ease-out;
        pointer-events: none;
        z-index: 1005;
        box-shadow: 0 0 6px 2px rgba(255,193,7,0.8);
      }

      /* נקודות חיבור - צד שמאל (שקע) */
      .left-connection-point {
        position: absolute;
        width: 14px;
        height: 14px;
        top: 50%;
        left: -7px;
        transform: translateY(-50%);
        background-color: ${CONFIG.HIGHLIGHT_COLOR_LEFT};
        border-radius: 50%;
        opacity: 0; /* Start hidden */
        transition: opacity 0.2s ease-out;
        pointer-events: none;
        z-index: 1005;
        box-shadow: 0 0 6px 2px rgba(33,150,243,0.8);
      }

      /* הדגשה נראית - חזר להיות opacity: 1 */
      .connection-point-visible {
        opacity: 1; /* <-- Points become VISIBLE when this class is added */
        animation: pulseConnectionPoint 0.8s infinite;
      }

      /* אנימציית פעימה לנקודות חיבור */
      @keyframes pulseConnectionPoint {
        0% { transform: translateY(-50%) scale(1); }
        50% { transform: translateY(-50%) scale(1.2); }
        100% { transform: translateY(-50%) scale(1); }
      }

      /* תצוגת עזר לאיזור חיבור (לא בשימוש כרגע) */
      .connection-area {
        position: absolute;
        background-color: rgba(255,0,0,0.2);
        pointer-events: none;
        z-index: 900;
        display: none;
      }

      .connection-area.visible {
        display: block;
      }

      /* אנימציות חיבור וניתוק */
      @keyframes snapEffect { 0%{transform:scale(1)} 35%{transform:scale(1.05)} 70%{transform:scale(0.98)} 100%{transform:scale(1)} }
      .snap-animation { animation:snapEffect 0.3s ease-out; }

      @keyframes detachEffect { 0%{transform:translate(0,0) rotate(0)} 30%{transform:translate(3px,1px) rotate(0.8deg)} 60%{transform:translate(-2px,2px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0)} }
      .detach-animation { animation:detachEffect 0.3s ease-in-out; }

      #detach-menu { position:absolute; background-color:white; border:1px solid #ccc; border-radius:4px; box-shadow:0 3px 8px rgba(0,0,0,0.2); z-index:1100; padding:5px; font-size:14px; min-width:100px; }
      #detach-menu div { padding:6px 12px; cursor:pointer; border-radius:3px; }
      #detach-menu div:hover { background-color:#eee; }

      body.user-select-none { user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; }
      .connected-block, .has-connected-block { /* Optional */ }

      #sound-test-button { position:fixed; bottom:15px; right:15px; padding:8px 12px; background-color:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; z-index:9999; font-family:Arial,sans-serif; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background-color .2s,opacity .5s ease-out; opacity:1; }
      #sound-test-button:hover { background-color:#0b7dda; }
      #sound-test-button.success { background-color:#4CAF50; }
      #sound-test-button.error { background-color:#f44336; }
      #sound-test-button.loading { background-color:#ff9800; cursor:wait; }
      #sound-test-button.hidden { opacity:0; pointer-events:none; }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Styles added (Puzzle Connection System - Visible Highlights)');
  }

  // ========================================================================
  // אתחול אודיו, כפתור בדיקה, נגינת צליל - ללא שינוי
  // ========================================================================
  function initAudio() { if (!CONFIG.PLAY_SOUND || soundInitialized) return; try { const el=document.getElementById('snap-sound-element'); if(el){snapSound=el;soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio reused.');if(!el.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)){el.innerHTML='';const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';el.appendChild(s);el.load();}return;} snapSound=document.createElement('audio');snapSound.id='snap-sound-element';snapSound.preload='auto';snapSound.volume=CONFIG.SOUND_VOLUME;const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';snapSound.appendChild(s);snapSound.addEventListener('error',(e)=>{console.error(`Audio Error: ${CONFIG.SOUND_PATH}`,e);const b=document.getElementById('sound-test-button');if(b){b.textContent='שגיאה';b.className='error';b.disabled=true;}CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;});snapSound.addEventListener('canplaythrough',()=>{soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio ready.');const b=document.getElementById('sound-test-button');if(b?.classList.contains('loading')){b.textContent='בדוק';b.classList.remove('loading');b.disabled=false;}});snapSound.style.display='none';document.body.appendChild(snapSound);if(CONFIG.DEBUG)console.log(`Audio created: ${CONFIG.SOUND_PATH}`);}catch(err){console.error('Audio init error:',err);CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;}}
  function addSoundTestButton() { if(!CONFIG.PLAY_SOUND)return;try{const eb=document.getElementById('sound-test-button');if(eb)eb.remove();const b=document.createElement('button');b.id='sound-test-button';b.title='בדוק צליל';b.className='';if(!snapSound){b.textContent='שמע נכשל';b.classList.add('error');b.disabled=true;}else if(!soundInitialized){b.textContent='טוען...';b.classList.add('loading');b.disabled=true;}else{b.textContent='בדוק';b.disabled=false;}Object.assign(b.style,{position:'fixed',bottom:'15px',right:'15px',zIndex:'9999',padding:'8px 12px',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',boxShadow:'0 2px 5px rgba(0,0,0,0.2)',fontFamily:'Arial,sans-serif',fontSize:'14px',fontWeight:'bold',transition:'background-color .2s,opacity .5s ease-out',opacity:'1'});b.onmouseover=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#0b7dda'};b.onmouseout=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#2196F3'};b.addEventListener('click',function(){if(this.disabled||!snapSound||!soundInitialized)return;snapSound.play().then(()=>{b.textContent='פועל ✓';b.classList.add('success');audioContextAllowed=true;setTimeout(()=>{b.classList.add('hidden');setTimeout(()=>b.remove(),500)},3000);if(snapSound){snapSound.pause();snapSound.currentTime=0;}}).catch(err=>{console.warn('Sound test fail:',err.name);if(err.name==='NotAllowedError'){b.textContent='חסום-לחץ';b.classList.add('error');audioContextAllowed=false;}else{b.textContent='שגיאה';b.classList.add('error');b.disabled=true;}});});document.body.appendChild(b);if(CONFIG.DEBUG)console.log('Sound test button added.');}catch(err){console.error('Err adding sound btn:',err);}}
  function playSnapSound() { if(!CONFIG.PLAY_SOUND||!snapSound||!soundInitialized)return;if(!audioContextAllowed&&CONFIG.DEBUG)console.warn('Playing sound before user interaction.');try{if(snapSound.readyState<3){if(CONFIG.DEBUG)console.log('Snap sound skip: audio not ready.');return;}snapSound.pause();snapSound.currentTime=0;const pp=snapSound.play();if(pp!==undefined){pp.then(()=>{audioContextAllowed=true;if(CONFIG.DEBUG>1)console.log('Snap sound played.');}).catch(err=>{if(err.name==='NotAllowedError'){console.warn('Snap sound blocked.');audioContextAllowed=false;if(!document.getElementById('sound-test-button'))addSoundTestButton();}else if(err.name!=='AbortError'){console.error('Err play snap sound:',err);}});}}catch(err){console.error('Unexpected play sound err:',err);}}

  // ========================================================================
  // ניהול נקודות חיבור - טיפול בנקודות החיבור הויזואליות
  // ========================================================================

  // הוספת נקודות חיבור לבלוק
  function addConnectionPoints(block) {
    if (!block) return;
    if (block.querySelector('.right-connection-point')) return;
    const rightPoint = document.createElement('div');
    rightPoint.className = 'right-connection-point';
    block.appendChild(rightPoint);
    const leftPoint = document.createElement('div');
    leftPoint.className = 'left-connection-point';
    block.appendChild(leftPoint);
    if (CONFIG.DEBUG > 1) console.log(`Added connection points (DOM elements) to block ${block.id}`);
  }

  // הדגשת נקודת חיבור (הופכת לנראית בזכות ה-CSS)
  function highlightConnectionPoint(block, isLeft) {
    if (!block) return false;
    addConnectionPoints(block); // Ensure elements exist
    const connectionPoint = block.querySelector(isLeft ? '.left-connection-point' : '.right-connection-point');
    if (connectionPoint) {
      connectionPoint.classList.add('connection-point-visible'); // CSS makes this visible
      return true;
    }
    return false;
  }

  // ניקוי כל ההדגשות (מסיר את הקלאס שהופך אותן לנראות)
  function clearAllHighlights() {
    document.querySelectorAll('.connection-point-visible').forEach(point => {
      point.classList.remove('connection-point-visible');
    });
    // גם מנקה את אזורי החיבור אם היו בשימוש
    document.querySelectorAll('.connection-area.visible').forEach(area => {
      area.classList.remove('visible');
    });
  }

  // ========================================================================
  // מאזינים, זיהוי בלוקים, קליק ימני, MouseDown - ללא שינוי
  // ========================================================================
  function initProgrammingAreaListeners() { const a=document.getElementById('program-blocks');if(!a)return;a.addEventListener('dragover',(e)=>e.preventDefault());a.addEventListener('dragstart',(e)=>{if(e.target?.closest?.('#program-blocks .block-container'))e.preventDefault();}); }
  function observeNewBlocks() { const a=document.getElementById('program-blocks');if(!a)return;const o=new MutationObserver((m)=>{m.forEach((mu)=>{if(mu.type==='childList'){mu.addedNodes.forEach((n)=>{if(n.nodeType===1){let b=n.classList?.contains('block-container')?n:n.querySelector?.('.block-container');if(b?.closest('#program-blocks')){if(!b.id)generateUniqueId(b);addBlockDragListeners(b);addConnectionPoints(b);}}});}});});o.observe(a,{childList:true,subtree:true});if(CONFIG.DEBUG)console.log("MutationObserver watching."); }
  function initExistingBlocks() { document.querySelectorAll('#program-blocks .block-container').forEach(b=>{if(!b.id)generateUniqueId(b);addBlockDragListeners(b);addConnectionPoints(b);});if(CONFIG.DEBUG)console.log("Listeners added to existing blocks."); }
  function addBlockDragListeners(b) { b.removeEventListener('mousedown',handleMouseDown);b.addEventListener('mousedown',handleMouseDown);b.removeEventListener('contextmenu',handleContextMenu);b.addEventListener('contextmenu',handleContextMenu); }
  function handleContextMenu(e) { e.preventDefault(); const block = e.target.closest('.block-container'); if (!block) return; showDetachMenu(e.clientX, e.clientY, block); }
  function handleMouseDown(e) {
    if (e.button !== 0) return;
    const block = e.target.closest('.block-container');
    if (!block) return;

    if (block.classList.contains('block-being-detached')) {
      if (CONFIG.DEBUG) console.log("Block is being detached, ignoring mousedown.");
      return;
    }

    isDraggingBlock = true;
    currentDraggedBlock = block;
    currentDraggedBlock.classList.add('snap-source');
    const rect = block.getBoundingClientRect();
    dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    block.style.zIndex = '1000';

    document.body.classList.add('user-select-none'); // prevent text selection
    if (CONFIG.DEBUG) console.log(`Drag started on block ${block.id}`);
  }

  // ========================================================================
  // חישוב מרחקים, בדיקת התאמה, סנאפ - ללא שינוי
  // ========================================================================
  function calculateDistance(block1, block2) {
    const rect1 = block1.getBoundingClientRect();
    const rect2 = block2.getBoundingClientRect();
    const dx = (rect1.left + rect1.width / 2) - (rect2.left + rect2.width / 2);
    const dy = (rect1.top + rect1.height / 2) - (rect2.top + rect2.height / 2);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function checkOverlap(rect1, rect2, requiredOverlap) {
    const overlapHeight = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
    const overlapPercentage = overlapHeight / Math.min(rect1.height, rect2.height);
    return overlapPercentage >= requiredOverlap;
  }

  function canSnap(block1, block2, direction) {
    if (!block1 || !block2 || direction === null) return false;

    const rect1 = block1.getBoundingClientRect();
    const rect2 = block2.getBoundingClientRect();

    // Check for sufficient horizontal overlap
    const horizontalOverlap = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
    const minWidth = Math.min(rect1.width, rect2.width);
    const overlapPercentage = horizontalOverlap / minWidth;

    if (overlapPercentage < CONFIG.VERTICAL_OVERLAP_REQ) {
      return false;
    }

    if (direction === 'right') {
      const horizontalGap = Math.abs(rect1.right - rect2.left - CONFIG.HORIZONTAL_FINE_TUNING);
      const verticalAlignment = Math.abs((rect1.top + rect1.height / 2) - (rect2.top + rect2.height / 2 + CONFIG.VERTICAL_CENTER_OFFSET));
      return horizontalGap <= CONFIG.CONNECT_THRESHOLD && verticalAlignment <= CONFIG.CONNECT_THRESHOLD;
    } else if (direction === 'left') {
      const horizontalGap = Math.abs(rect2.right - rect1.left - CONFIG.HORIZONTAL_FINE_TUNING);
      const verticalAlignment = Math.abs((rect1.top + rect1.height / 2) - (rect2.top + rect2.height / 2 + CONFIG.VERTICAL_CENTER_OFFSET));
      return horizontalGap <= CONFIG.CONNECT_THRESHOLD && verticalAlignment <= CONFIG.CONNECT_THRESHOLD;
    }
    return false;
  }

  function snapBlocks(block1, block2, direction) {
    if (!block1 || !block2 || direction === null) return;

    let targetX, targetY;
    const rect1 = block1.getBoundingClientRect();
    const rect2 = block2.getBoundingClientRect();

    if (direction === 'right') {
      targetX = rect2.left - (rect1.right - CONFIG.HORIZONTAL_FINE_TUNING);
      targetY = rect2.top - rect1.top;
    } else if (direction === 'left') {
      targetX = rect2.right - rect1.left + CONFIG.HORIZONTAL_FINE_TUNING;
      targetY = rect2.top - rect1.top;
    } else {
      return;
    }

    block1.style.left = `${targetX}px`;
    block1.style.top = `${targetY}px`;
    block1.classList.remove('snap-source');
    block1.classList.add('snap-animation');
    block2.classList.add('has-connected-block'); // Add class to target
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    isDraggingBlock = false;
    if (CONFIG.DEBUG) console.log(`Blocks ${block1.id} and ${block2.id} snapped.`);
    playSnapSound();
    setTimeout(() => {
      block1.classList.remove('snap-animation');
    }, 300);
  }

  // ========================================================================
  // טיפול באירועי עכבר גלובליים - MouseMove, MouseUp
  // ========================================================================
  function initGlobalMouseListeners() {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    currentDraggedBlock.style.left = `${newX}px`;
    currentDraggedBlock.style.top = `${newY}px`;

    let closestSnapTarget = null;
    let closestDistance = Infinity;
    let bestSnapDirection = null;

    document.querySelectorAll('.block-container').forEach(block => {
      if (block === currentDraggedBlock) return;

      const distance = calculateDistance(currentDraggedBlock, block);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSnapTarget = block;
      }
    });

    if (closestSnapTarget && closestDistance <= 100) { // עוד יותר קרוב
      let dir = null;
      if (canSnap(currentDraggedBlock, closestSnapTarget, 'right')) {
        dir = 'right';
      } else if (canSnap(currentDraggedBlock, closestSnapTarget, 'left')) {
        dir = 'left';
      }

      if (dir) {
        if (potentialSnapTarget !== closestSnapTarget || snapDirection !== dir) {
          clearAllHighlights(); // Clear previous highlights
          potentialSnapTarget = closestSnapTarget;
          snapDirection = dir;
          highlightConnectionPoint(currentDraggedBlock, dir === 'left');
          highlightConnectionPoint(closestSnapTarget, dir === 'right');
          if (CONFIG.DEBUG > 1) console.log(`Highlighting snap target ${closestSnapTarget.id} (${dir})`);
        }
      } else {
        clearAllHighlights();
        potentialSnapTarget = null;
        snapDirection = null;
      }
    } else {
      clearAllHighlights();
      potentialSnapTarget = null;
      snapDirection = null;
    }
  }

  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    if (potentialSnapTarget && snapDirection) {
      snapBlocks(currentDraggedBlock, potentialSnapTarget, snapDirection);
    } else {
      currentDraggedBlock.style.zIndex = 'initial';
      currentDraggedBlock.classList.remove('snap-source');
      currentDraggedBlock.classList.add('detach-animation'); // Apply detach animation
      setTimeout(() => {
        currentDraggedBlock.classList.remove('detach-animation');
      }, 300);
      if (CONFIG.DEBUG) console.log(`Dragged block ${currentDraggedBlock.id} released.`);
    }

    clearAllHighlights(); // Clear highlights after snap or detach
    document.body.classList.remove('user-select-none');
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
  }

  // ========================================================================
  // תפריט ניתוק - ללא שינוי
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

    const detachOption = document.createElement('div');
    detachOption.textContent = 'Disconnect Below'; // ניתוק למטה
    detachOption.style.padding = '6px 12px';
    detachOption.style.cursor = 'pointer';
    detachOption.style.borderRadius = '3px';
    detachOption.addEventListener('mouseenter', () => {
      detachOption.style.backgroundColor = '#eee';
    });
    detachOption.addEventListener('mouseleave', () => {
      detachOption.style.backgroundColor = 'transparent';
    });
    detachOption.addEventListener('click', () => {
      detachBelow(block);
      menu.remove();
    });
    menu.appendChild(detachOption);

    const rect = document.body.getBoundingClientRect();
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    // Adjust positioning to stay within bounds
    let finalX = x;
    let finalY = y;

    if (x + menuWidth > rect.right) {
      finalX = rect.right - menuWidth - 5; // 5px margin
    }
    if (y + menuHeight > rect.bottom) {
      finalY = rect.bottom - menuHeight - 5; // 5px margin
    }

    menu.style.left = `${finalX}px`;
    menu.style.top = `${finalY}px`;
    menu.style.display = 'block';
  }

  function detachBelow(block) {
    if (!block) return;
    if (CONFIG.DEBUG) console.log(`Detach initiated from block ${block.id}`);

    let currentBlock = block;
    const detachedBlocks = [];

    // Add a class to the initiating block
    block.classList.add('block-being-detached');

    while (currentBlock) {
      const nextBlock = findConnectedBlockBelow(currentBlock);
      if (nextBlock) {
        detachedBlocks.push(nextBlock);
        // nextBlock.style.position = 'absolute'; // אם צריך רי positioning
        nextBlock.classList.remove('has-connected-block');
      }
      currentBlock = nextBlock;
    }

    if (detachedBlocks.length > 0) {
      let firstDetachedBlock = detachedBlocks[0];
       const blockRect = firstDetachedBlock.getBoundingClientRect();
        const dx = 20;
        const dy = 10;
        firstDetachedBlock.style.left = `${blockRect.left + dx}px`;
        firstDetachedBlock.style.top = `${blockRect.top + dy}px`;
      if (CONFIG.DEBUG) console.log(`Detached ${detachedBlocks.length} blocks.`);
    }

     block.classList.remove('block-being-detached');
  }

  function findConnectedBlockBelow(block) {
    if (!block) return null;
    let connectedBlock = null;
    const blockRect = block.getBoundingClientRect();

    document.querySelectorAll('.block-container').forEach(otherBlock => {
      if (otherBlock === block) return;
      if (otherBlock.classList.contains('has-connected-block')) {
        const otherRect = otherBlock.getBoundingClientRect();
        const horizontalOverlap = Math.max(0, Math.min(blockRect.right, otherRect.right) - Math.max(blockRect.left, otherRect.left));
        const overlapPercentage = horizontalOverlap / Math.min(blockRect.width, otherRect.width);

        if (overlapPercentage >= CONFIG.VERTICAL_OVERLAP_REQ) {
          if (otherRect.top > blockRect.bottom && Math.abs(otherRect.left - blockRect.left) < CONFIG.CONNECT_THRESHOLD) {
            connectedBlock = otherBlock;
            return; // Exit the loop
          }
        }
      }
    });
    return connectedBlock;
  }

  // ========================================================================
  // עזרים שונים - ללא שינוי
  // ========================================================================
  function generateUniqueId(block) {
    const p = 'block-id';
    let id = `${p}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    if (document.getElementById(id)) {
      id = `${p}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    }
    block.id = id;
    if (CONFIG.DEBUG) console.log(`Generated ID: ${id} for block.`);
    return id;
  }

  // ========================================================================
  // אתחול המערכת כולה
  // ========================================================================
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v3_8_1_VisFix'; // Updated flag
    if (window[initFlag]) {
        if (CONFIG.DEBUG) console.log("Block linkage system v3.8.1 (Visible Highlight Fix) already initialized. Skipping.");
        return;
    }

    addHighlightStyles(); // Adds styles with opacity: 1 for .connection-point-visible
    initAudio();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();

    if (CONFIG.PLAY_SOUND) {
      addSoundTestButton();
    }

    window[initFlag] = true;
    console.log(`Block linkage system initialized (Version 3.8.1 - Visible Highlight Fix)`);
    console.log(`Configuration: Right Bulge Width=${CONFIG.PUZZLE_RIGHT_BULGE_WIDTH}px, Left Socket Width=${CONFIG.PUZZLE_LEFT_SOCKET_WIDTH}px`);
  }

  // הפעל את האתחול
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem();
  }
})();
// --- END OF FILE linkageimproved.js ---
