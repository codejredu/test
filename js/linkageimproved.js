// --- Version 3.8.2: כולל תיקונים לחיווי ריבועים ונקודות ---

(function() {
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;

  const CONFIG = {
    CONNECT_THRESHOLD: 25,
    VERTICAL_OVERLAP_REQ: 0.4,
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true,
    HIGHLIGHT_COLOR_RIGHT: '#FFC107',
    HIGHLIGHT_COLOR_LEFT: '#2196F3',
    PUZZLE_RIGHT_BULGE_WIDTH: 10,
    PUZZLE_LEFT_SOCKET_WIDTH: 10,
    VERTICAL_CENTER_OFFSET: 0,
    HORIZONTAL_FINE_TUNING: -9
  };

  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      .right-connection-point, .left-connection-point {
        position: absolute;
        width: 14px;
        height: 14px;
        top: 50%;
        transform: translateY(-50%);
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        z-index: 1005;
      }
      .right-connection-point {
        right: -7px;
        background-color: ${CONFIG.HIGHLIGHT_COLOR_RIGHT};
        box-shadow: 0 0 6px 2px rgba(255,193,7,0.8);
      }
      .left-connection-point {
        left: -7px;
        background-color: ${CONFIG.HIGHLIGHT_COLOR_LEFT};
        box-shadow: 0 0 6px 2px rgba(33,150,243,0.8);
      }
      .connection-point-visible { opacity: 1; }

      /* מסגרת הדגשה סביב בלוק שמועמד להתחברות */
      .highlight-outline {
        outline: 2px solid limegreen;
      }
    `;
    document.head.appendChild(style);
  }

  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) return Promise.resolve();
    return snapSound.play().catch(err => {
      console.warn('Sound play failed:', err);
    });
  }

  function clearAllHighlights() {
    document.querySelectorAll('.connection-point-visible').forEach(p => p.classList.remove('connection-point-visible'));
    document.querySelectorAll('.highlight-outline').forEach(b => b.classList.remove('highlight-outline'));
  }

  function highlightConnectionPoint(block, isLeft) {
    const point = block.querySelector(isLeft ? '.left-connection-point' : '.right-connection-point');
    if (point) point.classList.add('connection-point-visible');
  }

  function highlightOutline(block) {
    block.classList.add('highlight-outline');
  }

  function addConnectionPoints(block) {
    if (!block.querySelector('.right-connection-point')) {
      const right = document.createElement('div');
      right.className = 'right-connection-point';
      block.appendChild(right);
    }
    if (!block.querySelector('.left-connection-point')) {
      const left = document.createElement('div');
      left.className = 'left-connection-point';
      block.appendChild(left);
    }
  }

  function handleMouseDown(e) {
    if (e.button !== 0) return;
    const block = e.target.closest('.block-container');
    if (!block) return;
    currentDraggedBlock = block;
    isDraggingBlock = true;
    const r = block.getBoundingClientRect();
    dragOffset.x = e.clientX - r.left;
    dragOffset.y = e.clientY - r.top;
  }

  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    e.preventDefault();
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    const pRect = programArea.getBoundingClientRect();

    let x = e.clientX - pRect.left - dragOffset.x;
    let y = e.clientY - pRect.top - dragOffset.y;

    currentDraggedBlock.style.position = 'absolute';
    currentDraggedBlock.style.left = `${x}px`;
    currentDraggedBlock.style.top = `${y}px`;

    checkSnapPossibility();
  }

  function checkSnapPossibility() {
    clearAllHighlights();
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    const blocks = Array.from(programArea.querySelectorAll('.block-container'));
    blocks.forEach(b => addConnectionPoints(b));
    
    for (const target of blocks) {
      if (target === currentDraggedBlock) continue;
      highlightOutline(target);
    }
  }

  function handleMouseUp() {
    if (!isDraggingBlock) return;
    isDraggingBlock = false;

    playSnapSound().then(() => {
      clearAllHighlights();
    });
  }

  function initGlobalListeners() {
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  function initializeSystem() {
    addHighlightStyles();
    snapSound = new Audio(CONFIG.SOUND_PATH);
    snapSound.volume = CONFIG.SOUND_VOLUME;
    snapSound.addEventListener('canplaythrough', () => {
      soundInitialized = true;
    });
    initGlobalListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem();
  }
})();
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    return new Promise(resolve => {
      if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock)) {
        resolve();
        return;
      }

      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const programArea = document.getElementById('program-blocks');
      const pRect = programArea.getBoundingClientRect();

      let finalLeft, finalTop;

      if (direction === 'left') {
        finalLeft = targetRect.left - sourceRect.width + CONFIG.PUZZLE_LEFT_SOCKET_WIDTH;
        finalTop = targetRect.top + CONFIG.VERTICAL_CENTER_OFFSET;
      } else {
        finalLeft = targetRect.right - CONFIG.PUZZLE_RIGHT_BULGE_WIDTH;
        finalTop = targetRect.top + CONFIG.VERTICAL_CENTER_OFFSET;
      }

      finalLeft += CONFIG.HORIZONTAL_FINE_TUNING;

      let styleLeft = finalLeft - pRect.left + programArea.scrollLeft;
      let styleTop = finalTop - pRect.top + programArea.scrollTop;

      sourceBlock.style.left = `${Math.round(styleLeft)}px`;
      sourceBlock.style.top = `${Math.round(styleTop)}px`;
      sourceBlock.style.margin = '0';

      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      targetBlock.setAttribute(
        direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right',
        sourceBlock.id
      );
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');

      playSnapSound().then(() => {
        resolve();
      });
    });
  }

  function detachBlock(blockToDetach) {
    if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) return;

    const targetId = blockToDetach.getAttribute('data-connected-to');
    const direction = blockToDetach.getAttribute('data-connection-direction');

    blockToDetach.removeAttribute('data-connected-to');
    blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block');
    blockToDetach.draggable = true;

    const targetBlock = document.getElementById(targetId);
    if (targetBlock) {
      targetBlock.removeAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right');
      if (!targetBlock.hasAttribute('data-connected-from-left') &&
          !targetBlock.hasAttribute('data-connected-from-right') &&
          !targetBlock.hasAttribute('data-connected-to')) {
        targetBlock.classList.remove('has-connected-block');
      }
    }

    clearAllHighlights();
  }

  function addListenersToBlock(block) {
    block.addEventListener('mousedown', handleMouseDown);
    block.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (block.hasAttribute('data-connected-to')) {
        detachBlock(block);
      }
    });
  }

  function observeNewBlocks() {
    const area = document.getElementById('program-blocks');
    if (!area) return;

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && node.classList.contains('block-container')) {
            addConnectionPoints(node);
            addListenersToBlock(node);
          }
        }
      }
    });

    observer.observe(area, { childList: true, subtree: true });
  }

  function initExistingBlocks() {
    document.querySelectorAll('#program-blocks .block-container').forEach(block => {
      addConnectionPoints(block);
      addListenersToBlock(block);
    });
  }

  function initGlobalListeners() {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  function initializeSystem() {
    const flag = 'blockLinkageInitialized_v3_8_2_clean';
    if (window[flag]) return;

    addHighlightStyles();
    initAudio();
    initExistingBlocks();
    observeNewBlocks();
    initGlobalListeners();

    window[flag] = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem();
  }
})();
