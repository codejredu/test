// --- LINKAGE-IMPROVED.JS v4.0.0: GROUP DRAGGING SOLUTION ---
// גרסה 4.0.0 עם:
// 1. טיפול ממוקד במסגרות בבלוקים מחוברים בלבד
// 2. שמירה על עיגולי התקרבות שעובדים נהדר
// 3. תיקון בעיית הרווח בחיבור
// 4. גרירת בלוקים כקבוצה - בלוקים מחוברים זזים יחד

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;
  let outlineCleanupTimer = null;
  
  // משתנים חדשים לניהול גרירת קבוצה
  let isGroupDragging = false;
  let connectedBlocksGroup = [];
  let groupOffsets = [];

  // קונפיגורציה - פרמטרים עם תמיכה בכוונון עדין נפרד
  const CONFIG = {
    CONNECT_THRESHOLD: 40,
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4,
    BLOCK_GAP: 0,
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true,
    HIGHLIGHT_COLOR_RIGHT: '#FF9800', // כתום
    HIGHLIGHT_COLOR_LEFT: '#2196F3', // כחול
    HIGHLIGHT_OPACITY: 0.8,
    CLEAR_OUTLINES_DELAY: 500, // זמן בmilliseconds להסרה אוטומטית של מסגרות

    // ערכי היסט קבועים לחיבור פאזל מדויק
    PUZZLE_RIGHT_BULGE_WIDTH: 10, 
    PUZZLE_LEFT_SOCKET_WIDTH: 10,
    VERTICAL_CENTER_OFFSET: 0,
    
    // כוונון עדין לפי כיוון החיבור
    HORIZONTAL_FINE_TUNING_LEFT: 9,  // כוונון עדין כשמחברים לצד שמאל
    HORIZONTAL_FINE_TUNING_RIGHT: -9   // כוונון עדין כשמחברים לצד ימין (סוגר רווח)
  };

  // ========================================================================
  // הוספת סגנונות CSS - גדלים חדשים ובולטים יותר
  // ========================================================================
  function addHighlightStyles() {
    // הסר כל סגנון קודם אם קיים
    const oldStyle = document.getElementById('block-connection-styles');
    if (oldStyle) oldStyle.remove();
    
    // צור סגנון חדש
    const style = document.createElement('style');
    style.id = 'block-connection-styles-enhanced-v4-0-0';
    style.textContent = `
      .snap-source {
        box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important;
        cursor: grabbing !important;
        z-index: 1001 !important;
      }

      /* גרסה 4.0 - סטייל לבלוקים בקבוצה */
      .group-dragging {
        transition: none !important;
        pointer-events: none !important;
      }
      
      /* סגנון לבלוק שמוביל את הגרירה */
      .group-leader {
        box-shadow: 0 5px 15px rgba(0,0,0,0.5) !important;
      }

      /* נקודות חיבור - צד ימין (בליטה) */
      .right-connection-point {
        position: absolute !important;
        width: 20px !important;
        height: 20px !important;
        top: 50% !important;
        right: -10px !important;
        transform: translateY(-50%) !important;
        background-color: ${CONFIG.HIGHLIGHT_COLOR_RIGHT} !important;
        border-radius: 50% !important;
        opacity: 0;
        transition: opacity 0.1s ease-out !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        box-shadow: 0 0 10px 4px rgba(255,152,0,0.95) !important;
        border: 2px solid #FFF !important;
      }

      /* נקודות חיבור - צד שמאל (שקע) */
      .left-connection-point {
        position: absolute !important;
        width: 20px !important;
        height: 20px !important;
        top: 50% !important;
        left: -10px !important;
        transform: translateY(-50%) !important;
        background-color: ${CONFIG.HIGHLIGHT_COLOR_LEFT} !important;
        border-radius: 50% !important;
        opacity: 0;
        transition: opacity 0.1s ease-out !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        box-shadow: 0 0 10px 4px rgba(33,150,243,0.95) !important;
        border: 2px solid #FFF !important;
      }

      /* הדגשה נראית */
      .connection-point-visible {
        opacity: 1 !important;
        animation: pulseConnectionPoint 0.5s infinite !important;
      }

      /* אנימציית פעימה */
      @keyframes pulseConnectionPoint {
        0% { transform: translateY(-50%) scale(1) !important; }
        50% { transform: translateY(-50%) scale(1.5) !important; }
        100% { transform: translateY(-50%) scale(1) !important; }
      }

      /* תצוגת עזר */
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

      /* אנימציה לקבוצה מחוברת שזזה */
      @keyframes groupMoveEffect { 0%{box-shadow:0 2px 5px rgba(0,0,0,0.2)} 100%{box-shadow:0 8px 20px rgba(0,0,0,0.3)} }
      .group-moving-animation { animation:groupMoveEffect 0.2s forwards; }

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
      
      /* הבלוקים המחוברים לא צריכים מסגרות */
      .no-outlines, .no-outlines * {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Enhanced styles added (v4.0.0)');
  }

  // ========================================================================
  // אתחול אודיו, כפתור בדיקה, נגינת צליל - ללא שינוי
  // ========================================================================
  function initAudio() { if (!CONFIG.PLAY_SOUND || soundInitialized) return; try { const el=document.getElementById('snap-sound-element'); if(el){snapSound=el;soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio reused.');if(!el.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)){el.innerHTML='';const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';el.appendChild(s);el.load();}return;} snapSound=document.createElement('audio');snapSound.id='snap-sound-element';snapSound.preload='auto';snapSound.volume=CONFIG.SOUND_VOLUME;const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';snapSound.appendChild(s);snapSound.addEventListener('error',(e)=>{console.error(`Audio Error: ${CONFIG.SOUND_PATH}`,e);const b=document.getElementById('sound-test-button');if(b){b.textContent='שגיאה';b.className='error';b.disabled=true;}CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;});snapSound.addEventListener('canplaythrough',()=>{soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio ready.');const b=document.getElementById('sound-test-button');if(b?.classList.contains('loading')){b.textContent='בדוק';b.classList.remove('loading');b.disabled=false;}});snapSound.style.display='none';document.body.appendChild(snapSound);if(CONFIG.DEBUG)console.log(`Audio created: ${CONFIG.SOUND_PATH}`);}catch(err){console.error('Audio init error:',err);CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;}}
  function addSoundTestButton() { if(!CONFIG.PLAY_SOUND)return;try{const eb=document.getElementById('sound-test-button');if(eb)eb.remove();const b=document.createElement('button');b.id='sound-test-button';b.title='בדוק צליל';b.className='';if(!snapSound){b.textContent='שמע נכשל';b.classList.add('error');b.disabled=true;}else if(!soundInitialized){b.textContent='טוען...';b.classList.add('loading');b.disabled=true;}else{b.textContent='בדוק';b.disabled=false;}Object.assign(b.style,{position:'fixed',bottom:'15px',right:'15px',zIndex:'9999',padding:'8px 12px',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',boxShadow:'0 2px 5px rgba(0,0,0,0.2)',fontFamily:'Arial,sans-serif',fontSize:'14px',fontWeight:'bold',transition:'background-color .2s,opacity .5s ease-out',opacity:'1'});b.onmouseover=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#0b7dda'};b.onmouseout=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#2196F3'};b.addEventListener('click',function(){if(this.disabled||!snapSound||!soundInitialized)return;snapSound.play().then(()=>{b.textContent='פועל ✓';b.classList.add('success');audioContextAllowed=true;setTimeout(()=>{b.classList.add('hidden');setTimeout(()=>b.remove(),500)},3000);if(snapSound){snapSound.pause();snapSound.currentTime=0;}}).catch(err=>{console.warn('Sound test fail:',err.name);if(err.name==='NotAllowedError'){b.textContent='חסום-לחץ';b.classList.add('error');audioContextAllowed=false;}else{b.textContent='שגיאה';b.classList.add('error');b.disabled=true;}});});document.body.appendChild(b);if(CONFIG.DEBUG)console.log('Sound test button added.');}catch(err){console.error('Err adding sound btn:',err);}}
  function playSnapSound() { if(!CONFIG.PLAY_SOUND||!snapSound||!soundInitialized)return;if(!audioContextAllowed&&CONFIG.DEBUG)console.warn('Playing sound before user interaction.');try{if(snapSound.readyState<3){if(CONFIG.DEBUG)console.log('Snap sound skip: audio not ready.');return;}snapSound.pause();snapSound.currentTime=0;const pp=snapSound.play();if(pp!==undefined){pp.then(()=>{audioContextAllowed=true;if(CONFIG.DEBUG>1)console.log('Snap sound played.');}).catch(err=>{if(err.name==='NotAllowedError'){console.warn('Snap sound blocked.');audioContextAllowed=false;if(!document.getElementById('sound-test-button'))addSoundTestButton();}else if(err.name!=='AbortError'){console.error('Err play snap sound:',err);}});}}catch(err){console.error('Unexpected play sound err:',err);}}

  // ========================================================================
  // ניהול נקודות חיבור - ללא שינוי
  // ========================================================================
  function addConnectionPoints(block) {
    if (!block) return;
    if (block.querySelector('.right-connection-point')) return;
    
    const rightPoint = document.createElement('div');
    rightPoint.className = 'right-connection-point';
    block.appendChild(rightPoint);
    
    const leftPoint = document.createElement('div');
    leftPoint.className = 'left-connection-point';
    block.appendChild(leftPoint);
    
    if (CONFIG.DEBUG > 1) console.log(`Added connection points to block ${block.id}`);
  }

  function highlightConnectionPoint(block, isLeft) {
    if (!block) return false;
    
    addConnectionPoints(block);
    
    const connectionPoint = block.querySelector(isLeft ? '.left-connection-point' : '.right-connection-point');
    
    if (connectionPoint) {
      connectionPoint.classList.remove('connection-point-visible');
      connectionPoint.style.opacity = '0';
      
      setTimeout(() => {
        connectionPoint.classList.add('connection-point-visible');
        connectionPoint.style.opacity = '1';
      }, 10);
      
      return true;
    }
    
    return false;
  }

  function clearAllHighlights() {
    document.querySelectorAll('.connection-point-visible').forEach(point => {
      point.classList.remove('connection-point-visible');
      point.style.opacity = '0';
    });
    document.querySelectorAll('.connection-area.visible').forEach(area => {
      area.classList.remove('visible');
    });
  }

  // ========================================================================
  // פונקציות חדשות לגרירת קבוצה
  // ========================================================================
  
  // פונקציה חדשה: איסוף כל הבלוקים המחוברים בשרשרת ימינה
  function collectConnectedBlocksToRight(startBlock) {
    const group = [startBlock];
    const visited = new Set([startBlock.id]);
    
    // פונקציית עזר רקורסיבית לאיסוף בלוקים
    function collectRightward(block) {
      // בדוק חיבור ימינה (אם בלוק מחובר מימין)
      const rightConnectedId = block.getAttribute('data-connected-from-right');
      if (rightConnectedId) {
        const rightBlock = document.getElementById(rightConnectedId);
        if (rightBlock && !visited.has(rightBlock.id)) {
          visited.add(rightBlock.id);
          group.push(rightBlock);
          collectRightward(rightBlock); // המשך רקורסיבית
        }
      }
    }
    
    collectRightward(startBlock);
    
    if (CONFIG.DEBUG && group.length > 1) {
      console.log(`[Group] Collected ${group.length} blocks in right chain from ${startBlock.id}:`, 
                  group.map(b => b.id).join(', '));
    }
    
    return group;
  }
  
  // פונקציה חדשה: חישוב מיקום יחסי של בלוקים
  function calculateGroupOffsets(blocks, leaderBlock) {
    const leaderRect = leaderBlock.getBoundingClientRect();
    const offsets = [];
    
    blocks.forEach(block => {
      if (block === leaderBlock) {
        offsets.push({ x: 0, y: 0 }); // המוביל ביחס לעצמו
      } else {
        const blockRect = block.getBoundingClientRect();
        offsets.push({
          x: blockRect.left - leaderRect.left,
          y: blockRect.top - leaderRect.top
        });
      }
    });
    
    return offsets;
  }
  
  // פונקציה חדשה: עדכון מיקום בלוקים בקבוצה
  function updateGroupPositions(newX, newY) {
    if (!isGroupDragging || connectedBlocksGroup.length === 0) return;
    
    const pE = document.getElementById('program-blocks');
    const pR = pE.getBoundingClientRect();
    
    for (let i = 0; i < connectedBlocksGroup.length; i++) {
      const block = connectedBlocksGroup[i];
      const offset = groupOffsets[i];
      
      const adjustedX = newX + offset.x;
      const adjustedY = newY + offset.y;
      
      // מיקום עם התחשבות בהיסט יחסי
      const styleLeft = adjustedX + pE.scrollLeft - pR.left;
      const styleTop = adjustedY + pE.scrollTop - pR.top;
      
      block.style.position = 'absolute';
      block.style.left = `${Math.round(styleLeft)}px`;
      block.style.top = `${Math.round(styleTop)}px`;
      block.style.margin = '0';
    }
  }
  
  // פונקציה חדשה: סימון והכנת בלוקים לגרירה
  function prepareGroupForDragging(leaderBlock) {
    // אסוף בלוקים בקבוצה
    connectedBlocksGroup = collectConnectedBlocksToRight(leaderBlock);
    
    // אם יש יותר מבלוק אחד - הפעל מצב קבוצה
    if (connectedBlocksGroup.length > 1) {
      isGroupDragging = true;
      
      // חשב נקודות יחוס
      groupOffsets = calculateGroupOffsets(connectedBlocksGroup, leaderBlock);
      
      // סמן את כל הבלוקים
      connectedBlocksGroup.forEach((block, index) => {
        if (block === leaderBlock) {
          block.classList.add('group-leader');
        } else {
          block.classList.add('group-dragging');
          block.style.zIndex = '1000'; // להבטיח שיהיו מעל, אבל מתחת למוביל
        }
      });
      
      if (CONFIG.DEBUG) console.log(`[Group] Dragging group of ${connectedBlocksGroup.length} blocks led by ${leaderBlock.id}`);
      return true;
    }
    
    // אחרת - נקה את המצב הקבוצתי
    isGroupDragging = false;
    connectedBlocksGroup = [];
    groupOffsets = [];
    return false;
  }
  
  // פונקציה חדשה: נקה מצב גרירת קבוצה
  function clearGroupDragging() {
    if (connectedBlocksGroup.length > 0) {
      connectedBlocksGroup.forEach((block) => {
        block.classList.remove('group-dragging', 'group-leader');
        block.style.zIndex = '';
      });
      
      if (CONFIG.DEBUG && isGroupDragging) {
        console.log(`[Group] Stopped group dragging (${connectedBlocksGroup.length} blocks)`);
      }
    }
    
    isGroupDragging = false;
    connectedBlocksGroup = [];
    groupOffsets = [];
  }

  // ========================================================================
  // פונקציה ממוקדת להסרת מסגרות רק בבלוקים מחוברים
  // ========================================================================
  function removeOutlinesFromConnectedBlocks() {
    // טיפול ממוקד רק בבלוקים מחוברים
    document.querySelectorAll('.connected-block, [data-connected-to], [data-connected-from-left], [data-connected-from-right]').forEach(block => {
      // הוסף קלאס שמסיר מסגרות
      block.classList.add('no-outlines');
      
      // הסר סגנונות מסגרת ישירים
      block.style.outline = 'none';
      
      // אם יש ילדים (תמונות, טקסט וכו׳), נקה גם אותם
      block.querySelectorAll('*').forEach(child => {
        child.style.outline = 'none';
      });
    });
  }

  // ========================================================================
  // מאזינים, זיהוי בלוקים, קליק ימני, MouseDown - עם תמיכה בקבוצה
  // ========================================================================
  function initProgrammingAreaListeners() { 
    const a=document.getElementById('program-blocks');
    if(!a)return;
    a.addEventListener('dragover',(e)=>e.preventDefault());
    a.addEventListener('dragstart',(e)=>{if(e.target?.closest?.('#program-blocks .block-container'))e.preventDefault();}); 
  }
  
  function observeNewBlocks() { 
    const a=document.getElementById('program-blocks');
    if(!a)return;
    const o=new MutationObserver((m)=>{
      m.forEach((mu)=>{
        if(mu.type==='childList'){
          mu.addedNodes.forEach((n)=>{
            if(n.nodeType===1){
              let b=n.classList?.contains('block-container')?n:n.querySelector?.('.block-container');
              if(b?.closest('#program-blocks')){
                if(!b.id)generateUniqueId(b);
                addBlockDragListeners(b);
                addConnectionPoints(b);
              }
            }
          });
        }
      });
    });
    o.observe(a,{childList:true,subtree:true});
    if(CONFIG.DEBUG)console.log("MutationObserver watching."); 
  }
  
  function initExistingBlocks() { 
    document.querySelectorAll('#program-blocks .block-container').forEach(b=>{
      if(!b.id)generateUniqueId(b);
      addBlockDragListeners(b);
      addConnectionPoints(b);
    });
    if(CONFIG.DEBUG)console.log("Listeners added to existing blocks."); 
  }
  
  function addBlockDragListeners(b) { 
    b.removeEventListener('mousedown',handleMouseDown);
    b.addEventListener('mousedown',handleMouseDown);
    b.removeEventListener('contextmenu',handleContextMenu);
    b.addEventListener('contextmenu',handleContextMenu); 
  }
  
  function handleContextMenu(e) { 
    e.preventDefault();
    const b=e.target.closest('.block-container');
    if(b?.hasAttribute('data-connected-to'))showDetachMenu(e.clientX,e.clientY,b); 
  }
  
  // עדכון: תמיכה בגרירת קבוצה
  function handleMouseDown(e) { 
    if(e.button!==0||!e.target.closest||e.target.matches('input,button,select,textarea,a[href]'))return;
    
    const b=e.target.closest('.block-container');
    if(!b||!b.parentElement||b.parentElement.id!=='program-blocks')return;
    
    if(!b.id)generateUniqueId(b);
    e.preventDefault();
    b.draggable=false;
    
    if(CONFIG.DEBUG)console.log(`[MouseDown] Start drag: ${b.id}`);
    
    // נקה מצב גרירה קודם אם קיים
    clearGroupDragging();
    
    // בדוק האם הבלוק מחובר ל/או יש לו חיבורים מימין
    const hasRightConnections = b.hasAttribute('data-connected-from-right');
    
    if (hasRightConnections) {
      // הכן גרירת קבוצה
      prepareGroupForDragging(b);
    } else if(b.hasAttribute('data-connected-to')) {
      // אם זה חלק מקבוצה אחרת, נתק קודם
      detachBlock(b, false);
    }
    
    // נתק חיבורים משמאל אם לא גוררים כקבוצה
    const lId=b.getAttribute('data-connected-from-left');
    if (lId && !isGroupDragging) detachBlock(document.getElementById(lId), false);
    
    // שמור את הבלוק הנוכחי (או המוביל בקבוצה)
    currentDraggedBlock = b;
    isDraggingBlock = true;
    
    // חישוב היסט הגרירה יחסית לאירוע העכבר
    const r = b.getBoundingClientRect();
    dragOffset.x = e.clientX - r.left;
    dragOffset.y = e.clientY - r.top;
    
    // וידוא שהבלוק במיקום אבסולוטי
    const pE = document.getElementById('program-blocks');
    const pR = pE.getBoundingClientRect();
    if (window.getComputedStyle(b).position !== 'absolute') {
      b.style.position = 'absolute';
      b.style.left = (r.left - pR.left + pE.scrollLeft) + 'px';
      b.style.top = (r.top - pR.top + pE.scrollTop) + 'px';
    }
    
    // איפוס שוליים והתחלת גרירה
    b.style.margin = '0';
    
    // רק הבלוק הראשי צריך את קלאס הגרירה אם לא גוררים כקבוצה
    if (!isGroupDragging) {
      b.style.zIndex = '1001';
      b.classList.add('snap-source');
    }
    
    document.body.classList.add('user-select-none');
  }
