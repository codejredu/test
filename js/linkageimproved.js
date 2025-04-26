 // --- Linkage Improved JS - SVG Anchor Point Connection System ---
// Version 4.2.0 - Ghost Drag Fixed, Simple Edition

(function() {
  // Global variables
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;
  let svgContainer = null;
  let connectionPaths = {};
  let blockAnchors = {};
  let potentialConnectionLine = null;
  let activeAnchors = { source: null, target: null };
  
  // Configuration
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 50,
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4,
    BLOCK_GAP: 0,
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true,
    
    SVG_NAMESPACE: "http://www.w3.org/2000/svg",
    ANCHOR_RADIUS: 8,
    SHOW_ANCHORS: true,
    CONNECTION_PATH_WIDTH: 2,
    CONNECTION_PATH_COLOR: "rgba(76, 175, 80, 0.7)",
    CONNECTION_PATH_DASH: "5,3",
    
    ANCHOR_POINTS: {
      OUTPUT: { right: 0.5 },
      INPUT: { left: 0.5 }
    }
  };

  // Utility Functions
  function generateUniqueId(element) {
    if (!element.id) {
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 10000);
      element.id = `block-${timestamp}-${random}`;
    }
    return element.id;
  }

  function getElementCoordinates(element) {
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      center: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    };
  }

  // SVG Container Initialization
  function initSVGContainer() {
    svgContainer = document.getElementById('connection-svg-container');
    if (svgContainer) return;
    
    svgContainer = document.createElementNS(CONFIG.SVG_NAMESPACE, 'svg');
    svgContainer.id = 'connection-svg-container';
    svgContainer.style.position = 'absolute';
    svgContainer.style.top = '0';
    svgContainer.style.left = '0';
    svgContainer.style.width = '100%';
    svgContainer.style.height = '100%';
    svgContainer.style.pointerEvents = 'none';
    svgContainer.style.zIndex = '998';
    
    const programmingArea = document.getElementById('program-blocks');
    if (programmingArea) {
      programmingArea.style.position = 'relative';
      programmingArea.appendChild(svgContainer);
      if (CONFIG.DEBUG) console.log('SVG container created for connections');
    } else {
      console.error('Programming area not found for SVG container');
    }
  }

  // Anchor Point Creation
  function createAnchorPoints(block) {
    if (!block || !block.id) return;
    
    const coords = getElementCoordinates(block);
    if (!coords) return;
    
    if (!blockAnchors[block.id]) {
      blockAnchors[block.id] = {
        inputs: [],
        outputs: []
      };
    }
    
    const svgElement = block.querySelector('svg');
    
    if (svgElement) {
      const outputPoint = svgElement.querySelector('.output-point, .output, .output-anchor');
      const inputPoint = svgElement.querySelector('.input-point, .input, .input-anchor');
      
      const svgRect = svgElement.getBoundingClientRect();
      const svgOffsetX = svgRect.left - coords.left;
      const svgOffsetY = svgRect.top - coords.top;
      
      if (outputPoint) {
        const pointX = parseFloat(outputPoint.getAttribute('cx') || 0);
        const pointY = parseFloat(outputPoint.getAttribute('cy') || 0);
        
        const outputAnchor = {
          type: 'output',
          x: coords.left + svgOffsetX + pointX,
          y: coords.top + svgOffsetY + pointY,
          blockId: block.id
        };
        
        blockAnchors[block.id].outputs = [outputAnchor];
      } else {
        const outputAnchor = {
          type: 'output',
          x: coords.right,
          y: coords.top + (coords.height * CONFIG.ANCHOR_POINTS.OUTPUT.right),
          blockId: block.id
        };
        
        blockAnchors[block.id].outputs = [outputAnchor];
      }
      
      if (inputPoint) {
        const pointX = parseFloat(inputPoint.getAttribute('cx') || 0);
        const pointY = parseFloat(inputPoint.getAttribute('cy') || 0);
        
        const inputAnchor = {
          type: 'input',
          x: coords.left + svgOffsetX + pointX,
          y: coords.top + svgOffsetY + pointY,
          blockId: block.id
        };
        
        blockAnchors[block.id].inputs = [inputAnchor];
      } else {
        const inputAnchor = {
          type: 'input',
          x: coords.left,
          y: coords.top + (coords.height * CONFIG.ANCHOR_POINTS.INPUT.left),
          blockId: block.id
        };
        
        blockAnchors[block.id].inputs = [inputAnchor];
      }
    } else {
      const outputAnchor = {
        type: 'output',
        x: coords.right,
        y: coords.top + (coords.height * CONFIG.ANCHOR_POINTS.OUTPUT.right),
        blockId: block.id
      };
      
      const inputAnchor = {
        type: 'input',
        x: coords.left,
        y: coords.top + (coords.height * CONFIG.ANCHOR_POINTS.INPUT.left),
        blockId: block.id
      };
      
      blockAnchors[block.id].outputs = [outputAnchor];
      blockAnchors[block.id].inputs = [inputAnchor];
    }
    
    if (CONFIG.SHOW_ANCHORS) {
      blockAnchors[block.id].outputs.forEach(visualizeAnchorPoint);
      blockAnchors[block.id].inputs.forEach(visualizeAnchorPoint);
    }
    
    return blockAnchors[block.id];
  }

  function visualizeAnchorPoint(anchor) {
    if (!svgContainer || !anchor) return;
    
    const existingAnchor = document.querySelector(`.anchor-point[data-block-id="${anchor.blockId}"][data-anchor-type="${anchor.type}"]`);
    if (existingAnchor) {
      existingAnchor.remove();
    }
    
    const point = document.createElementNS(CONFIG.SVG_NAMESPACE, 'circle');
    point.setAttribute('cx', anchor.x);
    point.setAttribute('cy', anchor.y);
    point.setAttribute('r', CONFIG.ANCHOR_RADIUS);
    point.setAttribute('fill', anchor.type === 'output' ? '#4CAF50' : '#2196F3');
    point.setAttribute('stroke', '#fff');
    point.setAttribute('stroke-width', '2');
    point.setAttribute('class', `anchor-point anchor-${anchor.type}`);
    point.setAttribute('data-block-id', anchor.blockId);
    point.setAttribute('data-anchor-type', anchor.type);
    point.setAttribute('data-anchor-id', `${anchor.blockId}-${anchor.type}`);
    
    svgContainer.appendChild(point);
    
    return point;
  }

  function updateAnchorPositions(block) {
    if (!block || !block.id || !blockAnchors[block.id]) return;
    
    const coords = getElementCoordinates(block);
    if (!coords) return;
    
    blockAnchors[block.id].outputs.forEach(anchor => {
      anchor.x = coords.right;
      anchor.y = coords.top + (coords.height * CONFIG.ANCHOR_POINTS.OUTPUT.right);
    });
    
    blockAnchors[block.id].inputs.forEach(anchor => {
      anchor.x = coords.left;
      anchor.y = coords.top + (coords.height * CONFIG.ANCHOR_POINTS.INPUT.left);
    });
    
    if (CONFIG.SHOW_ANCHORS) {
      const existingPoints = svgContainer.querySelectorAll(`.anchor-point[data-block-id="${block.id}"]`);
      existingPoints.forEach(point => point.remove());
      
      blockAnchors[block.id].outputs.forEach(visualizeAnchorPoint);
      blockAnchors[block.id].inputs.forEach(visualizeAnchorPoint);
    }
    
    updateConnections(block.id);
  }

  function findClosestAnchors(sourceBlock, targetBlock) {
    if (!sourceBlock || !targetBlock || 
        !blockAnchors[sourceBlock.id] || 
        !blockAnchors[targetBlock.id]) {
      return null;
    }
    
    let minDistance = Infinity;
    let bestMatch = null;
    
    blockAnchors[sourceBlock.id].outputs.forEach(output => {
      blockAnchors[targetBlock.id].inputs.forEach(input => {
        const distance = Math.sqrt(
          Math.pow(output.x - input.x, 2) + 
          Math.pow(output.y - input.y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = { output, input, distance };
        }
      });
    });
    
    return bestMatch;
  }

  function createConnection(sourceBlockId, targetBlockId) {
    if (!sourceBlockId || !targetBlockId || 
        !blockAnchors[sourceBlockId] || 
        !blockAnchors[targetBlockId]) {
      return false;
    }
    
    const connectionId = `${sourceBlockId}-to-${targetBlockId}`;
    
    const outputAnchor = blockAnchors[sourceBlockId].outputs[0];
    const inputAnchor = blockAnchors[targetBlockId].inputs[0];
    
    if (!outputAnchor || !inputAnchor) return false;
    
    const path = document.createElementNS(CONFIG.SVG_NAMESPACE, 'path');
    path.setAttribute('id', connectionId);
    path.setAttribute('stroke', CONFIG.CONNECTION_PATH_COLOR);
    path.setAttribute('stroke-width', CONFIG.CONNECTION_PATH_WIDTH);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-dasharray', CONFIG.CONNECTION_PATH_DASH);
    path.setAttribute('marker-end', 'url(#arrowhead)');
    path.setAttribute('data-source', sourceBlockId);
    path.setAttribute('data-target', targetBlockId);
    path.classList.add('connection-path');
    
    updatePathBetweenAnchors(path, outputAnchor, inputAnchor);
    
    svgContainer.appendChild(path);
    
    connectionPaths[connectionId] = path;
    
    const sourceBlock = document.getElementById(sourceBlockId);
    const targetBlock = document.getElementById(targetBlockId);
    
    if (sourceBlock) sourceBlock.classList.add('has-connected-block');
    if (targetBlock) targetBlock.classList.add('connected-block');
    
    if (CONFIG.DEBUG) console.log(`Created connection: ${connectionId}`);
    return true;
  }

  function updatePathBetweenAnchors(path, fromAnchor, toAnchor) {
    if (!path || !fromAnchor || !toAnchor) return;
    
    const dx = toAnchor.x - fromAnchor.x;
    const dy = toAnchor.y - fromAnchor.y;
    const controlPointOffset = Math.min(Math.abs(dx) * 0.5, 50);
    
    const pathData = `
      M ${fromAnchor.x},${fromAnchor.y} 
      C ${fromAnchor.x + controlPointOffset},${fromAnchor.y} 
        ${toAnchor.x - controlPointOffset},${toAnchor.y} 
        ${toAnchor.x},${toAnchor.y}
    `;
    
    path.setAttribute('d', pathData);
  }

  function updateConnections(blockId) {
    if (!blockId) return;
    
    Object.keys(connectionPaths).forEach(connectionId => {
      const path = connectionPaths[connectionId];
      const sourceId = path.getAttribute('data-source');
      const targetId = path.getAttribute('data-target');
      
      if (sourceId === blockId || targetId === blockId) {
        const sourceAnchor = blockAnchors[sourceId]?.outputs[0];
        const targetAnchor = blockAnchors[targetId]?.inputs[0];
        
        if (sourceAnchor && targetAnchor) {
          updatePathBetweenAnchors(path, sourceAnchor, targetAnchor);
        }
      }
    });
  }

  function removeConnection(sourceBlockId, targetBlockId) {
    const connectionId = `${sourceBlockId}-to-${targetBlockId}`;
    const path = connectionPaths[connectionId];
    
    if (path) {
      path.remove();
      
      delete connectionPaths[connectionId];
      
      const sourceBlock = document.getElementById(sourceBlockId);
      const targetBlock = document.getElementById(targetBlockId);
      
      const sourceHasOtherConnections = Object.keys(connectionPaths).some(id => 
        id.startsWith(`${sourceBlockId}-to-`)
      );
      
      const targetHasOtherConnections = Object.keys(connectionPaths).some(id => 
        id.endsWith(`-to-${targetBlockId}`)
      );
      
      if (sourceBlock && !sourceHasOtherConnections) {
        sourceBlock.classList.remove('has-connected-block');
      }
      
      if (targetBlock && !targetHasOtherConnections) {
        targetBlock.classList.remove('connected-block');
      }
      
      if (CONFIG.DEBUG) console.log(`Removed connection: ${connectionId}`);
      return true;
    }
    
    return false;
  }

  function initArrowheadMarker() {
    if (!svgContainer) return;
    
    const defs = document.createElementNS(CONFIG.SVG_NAMESPACE, 'defs');
    const marker = document.createElementNS(CONFIG.SVG_NAMESPACE, 'marker');
    
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS(CONFIG.SVG_NAMESPACE, 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', CONFIG.CONNECTION_PATH_COLOR);
    
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svgContainer.appendChild(defs);
    
    if (CONFIG.DEBUG) console.log('Added arrowhead marker to SVG');
  }

  // CSS Styles
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) {
      if (CONFIG.DEBUG) console.log('Styles already exist');
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      .snap-source { 
        box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important; 
        transition: box-shadow 0.15s ease-out; 
        cursor: grabbing !important; 
        z-index: 1001 !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
      }
      .snap-target { outline: 6px solid #FFC107 !important; outline-offset: 4px; box-shadow: 0 0 20px 8px rgba(255,193,7,0.8) !important; transition: outline 0.1s ease-out, box-shadow 0.1s ease-out; z-index: 999 !important; }
      .future-position-indicator { position: absolute; border: 3px dashed rgba(0,120,255,0.95) !important; border-radius: 5px; background-color: rgba(0,120,255,0.15) !important; pointer-events: none; z-index: 998; opacity: 0; transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear; display: none; }
      .future-position-indicator.visible { display: block; opacity: 0.9; }
      .snap-target.snap-left::before { content:''; position:absolute; left:-10px; top:40%; bottom:40%; width:8px; background-color:#FFC107; border-radius:2px; z-index:1000; box-shadow:0 0 10px 2px rgba(255,193,7,0.8); transition:all 0.1s ease-out; }
      .snap-target.snap-right::after { content:''; position:absolute; right:-10px; top:40%; bottom:40%; width:8px; background-color:#FFC107; border-radius:2px; z-index:1000; box-shadow:0 0 10px 2px rgba(255,193,7,0.8); transition:all 0.1s ease-out; }
      @keyframes snapEffect { 0%{transform:scale(1)} 35%{transform:scale(1.05)} 70%{transform:scale(0.98)} 100%{transform:scale(1)} } .snap-animation { animation:snapEffect 0.3s ease-out; }
      @keyframes detachEffect { 0%{transform:translate(0,0) rotate(0)} 30%{transform:translate(3px,1px) rotate(0.8deg)} 60%{transform:translate(-2px,2px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0)} } .detach-animation { animation:detachEffect 0.3s ease-in-out; }
      #detach-menu { position:absolute; background-color:white; border:1px solid #ccc; border-radius:4px; box-shadow:0 3px 8px rgba(0,0,0,0.2); z-index:1100; padding:5px; font-size:14px; min-width:100px; } #detach-menu div { padding:6px 12px; cursor:pointer; border-radius:3px; } #detach-menu div:hover { background-color:#eee; }
      body.user-select-none { user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; }
      .connected-block { outline: 2px solid rgba(76, 175, 80, 0.6) !important; outline-offset: 2px; }
      .has-connected-block { outline: 2px solid rgba(33, 150, 243, 0.6) !important; outline-offset: 2px; }
      
      /* Anchor point styles */
      .anchor-point { 
        opacity: 0.9; 
        transition: opacity 0.2s, r 0.2s, fill 0.3s; 
        pointer-events: none;
        filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.3));
      }
      .anchor-point:hover { opacity: 1; r: 8; }
      .anchor-input { cursor: pointer; fill: #2196F3; }
      .anchor-output { cursor: pointer; fill: #4CAF50; }
      
      /* Highlighted anchor points when close to connection */
      .anchor-point.highlight-active {
        opacity: 1 !important;
        r: 10 !important;
        fill: #FFC107 !important;
        stroke: #FFF !important;
        stroke-width: 2 !important;
        filter: drop-shadow(0 0 5px rgba(255, 193, 7, 0.8)) !important;
        animation: pulse 1.5s infinite !important;
      }
      
      /* Pulse animation for active anchor points */
      @keyframes pulse {
        0% { r: 8; stroke-width: 2; }
        50% { r: 12; stroke-width: 3; }
        100% { r: 8; stroke-width: 2; }
      }
      
      .connection-path { transition: stroke 0.3s; }
      .connection-path:hover { stroke: rgba(76, 175, 80, 1); stroke-width: 3; }
      
      /* Connection line between potential anchors */
      .potential-connection {
        stroke: #FFC107;
        stroke-width: 2;
        stroke-dasharray: 5,3;
        opacity: 0.8;
        pointer-events: none;
      }
      
      /* Fix for disappearing blocks */
      .block-container {
        transition: none !important; /* Prevent transitions from causing disappearing */
      }
      
      /* Ghost drag fix */
      .dragging {
        box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important;
        cursor: grabbing !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        z-index: 1000 !important;
      }

      #drag-blocker {
        cursor: grabbing;
        background: transparent;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 990;
        pointer-events: all;
      }
      
      #sound-test-button { position:fixed; bottom:15px; right:15px; padding:8px 12px; background-color:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; z-index:9999; font-family:Arial,sans-serif; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background-color .2s,opacity .5s ease-out; opacity:1; } #sound-test-button:hover { background-color:#0b7dda; } #sound-test-button.success { background-color:#4CAF50; } #sound-test-button.error { background-color:#f44336; } #sound-test-button.loading { background-color:#ff9800; cursor:wait; } #sound-test-button.hidden { opacity:0; pointer-events:none; }
    `;
    
    document.head.appendChild(style);
    
    if (CONFIG.DEBUG) {
      console.log('Styles added successfully');
      const appliedStyle = document.getElementById('block-connection-styles');
      if (appliedStyle) {
        console.log('Connection styles verified in DOM');
      } else {
        console.error('Connection styles missing from DOM after append!');
      }
    }
  }

  // Audio Functions
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
          b.classList.add('error');
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
      
      Object.assign(b.style, {
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
        transition: 'background-color .2s,opacity .5s ease-out',
        opacity: '1'
      });
      
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
    
    if (!audioContextAllowed && CONFIG.DEBUG) console.warn('Playing sound before user interaction.');
    
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
            if (!document.getElementById('sound-test-button')) addSoundTestButton();
          } else if (err.name !== 'AbortError') {
            console.error('Err play snap sound:', err);
          }
        });
      }
    } catch (err) {
      console.error('Unexpected play sound err:', err);
    }
  }

  // Drag & Drop Handlers with Ghost Fix
  function addBlockDragListeners(block) {
    if (!block || block._hasDragListeners) return;
    
    // Create anchor points for this block
    createAnchorPoints(block);
    
    // Mark block to avoid duplicate listeners
    block._hasDragListeners = true;
    
    // Explicitly disable HTML5 native drag
    block.setAttribute('draggable', 'false');
    
    // Add listeners
    block.addEventListener('mousedown', handleBlockMouseDown);
    block.addEventListener('touchstart', handleBlockTouchStart, { passive: false });
    
    // Prevent default browser drag behavior
    block.addEventListener('dragstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  }
  
  function handleBlockMouseDown(e) {
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const block = e.currentTarget;
    
    if (!block.id) generateUniqueId(block);
    
    startDragging(block, e.clientX, e.clientY);
    handleMove(e.clientX, e.clientY);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  
  function handleBlockTouchStart(e) {
    e.preventDefault();
    
    const block = e.currentTarget;
    const touch = e.touches[0];
    
    if (!block.id) generateUniqueId(block);
    
    startDragging(block, touch.clientX, touch.clientY);
    handleMove(touch.clientX, touch.clientY);
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  }
  
  function handleTouchMove(e) {
    e.preventDefault();
    
    if (!isDraggingBlock || !currentDraggedBlock) return;
    
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  }
  
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  }
  
  // Ghost Drag Fix Implementation
  function startDragging(block, clientX, clientY) {
    if (!block || isDraggingBlock) return;
    
    isDraggingBlock = true;
    currentDraggedBlock = block;
    
    // Calculate offset
    const rect = block.getBoundingClientRect();
    dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    
    // Position before dragging
    const computedStyle = window.getComputedStyle(block);
    const currentLeft = computedStyle.left !== 'auto' ? parseInt(computedStyle.left) : rect.left;
    const currentTop = computedStyle.top !== 'auto' ? parseInt(computedStyle.top) : rect.top;
    
    block.style.left = `${currentLeft}px`;
    block.style.top = `${currentTop}px`;
    block.style.position = 'absolute';
    
    // Ensure visibility
    block.style.opacity = '1';
    block.style.visibility = 'visible';
    block.style.display = 'block';
    block.style.zIndex = '1000';
    
    // Prevent ghost effect
    block.style.willChange = 'transform';
    
    // Create blocker to prevent mouse events on other elements
    const blocker = document.createElement('div');
    blocker.id = 'drag-blocker';
    blocker.style.position = 'fixed';
    blocker.style.top = '0';
    blocker.style.left = '0';
    blocker.style.width = '100%';
    blocker.style.height = '100%';
    blocker.style.zIndex = '990';
    blocker.style.pointerEvents = 'all';
    blocker.style.cursor = 'grabbing';
    document.body.appendChild(blocker);
    
    // Visual feedback
    block.classList.add('dragging');
    document.body.classList.add('user-select-none');
    document.body.style.cursor = 'grabbing';
    block.classList.add('snap-source');
    
    // Initialize future indicator
    if (!futureIndicator) {
      futureIndicator = document.createElement('div');
      futureIndicator.className = 'future-position-indicator';
      document.body.appendChild(futureIndicator);
    }
  }
  
  function handleMove(clientX, clientY) {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    
    // Calculate new position
    const newLeft = clientX - dragOffset.x;
    const newTop = clientY - dragOffset.y;
    
    // Move the block
    currentDraggedBlock.style.left = `${newLeft}px`;
    currentDraggedBlock.style.top = `${newTop}px`;
    
    // Ensure visibility
    currentDraggedBlock.style.opacity = '1';
    currentDraggedBlock.style.visibility = 'visible';
    currentDraggedBlock.style.display = 'block';
    
    // Update anchors and find connections
    updateAnchorPositions(currentDraggedBlock);
    findPotentialSnapTarget();
    updateFuturePositionIndicator();
  }
  
  function handleMouseUp(e) {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    finishDragging();
  }
  
  function handleTouchEnd(e) {
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
    finishDragging();
  }
  
  function finishDragging() {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    
    // Remove blocker
    const blocker = document.getElementById('drag-blocker');
    if (blocker) blocker.remove();
    
    // Clean up effects
    document.body.classList.remove('user-select-none');
    document.body.style.cursor = 'default';
    currentDraggedBlock.classList.remove('snap-source');
    currentDraggedBlock.classList.remove('dragging');
    currentDraggedBlock.style.willChange = 'auto';
    
    // Handle connection
    if (potentialSnapTarget) {
      potentialSnapTarget.classList.remove('snap-target');
      potentialSnapTarget.classList.remove('snap-left', 'snap-right');
      
      applySnapAnimation();
      
      if (snapDirection === 'right') {
        createConnection(currentDraggedBlock.id, potentialSnapTarget.id);
      } else if (snapDirection === 'left') {
        createConnection(potentialSnapTarget.id, currentDraggedBlock.id);
      }
      
      playSnapSound();
    }
    
    // Hide indicator
    if (futureIndicator) {
      futureIndicator.classList.remove('visible');
    }
    
    // Reset anchors
    resetActiveAnchors();
    
    // Reset state
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
  }

  // Connection Finding
  function findPotentialSnapTarget() {
    if (potentialSnapTarget) {
      potentialSnapTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
      potentialSnapTarget = null;
      snapDirection = null;
    }
    
    resetActiveAnchors();
    
    if (!isDraggingBlock || !currentDraggedBlock) return;
    
    const allBlocks = Array.from(document.querySelectorAll('#program-blocks .block-container'))
      .filter(b => b !== currentDraggedBlock);
    
    const currentCoords = getElementCoordinates(currentDraggedBlock);
    if (!currentCoords) return;
    
    let bestDistance = CONFIG.CONNECT_THRESHOLD;
    let bestTarget = null;
    let bestDirection = null;
    let bestMatchingAnchors = null;
    
    allBlocks.forEach(targetBlock => {
      if (!targetBlock.id) return;
      
      const targetCoords = getElementCoordinates(targetBlock);
      if (!targetCoords) return;
      
      updateAnchorPositions(targetBlock);
      
      const outputToInput = findClosestAnchors(currentDraggedBlock, targetBlock);
      const inputToOutput = findClosestAnchors(targetBlock, currentDraggedBlock);
      
      if (outputToInput && outputToInput.distance < bestDistance) {
        bestDistance = outputToInput.distance;
        bestTarget = targetBlock;
        bestDirection = 'right';
        bestMatchingAnchors = {
          source: outputToInput.output,
          target: outputToInput.input
        };
      }
      
      if (inputToOutput && inputToOutput.distance < bestDistance) {
        bestDistance = inputToOutput.distance;
        bestTarget = targetBlock;
        bestDirection = 'left';
        bestMatchingAnchors = {
          source: inputToOutput.output,
          target: inputToOutput.input
        };
      }
    });
    
    if (bestTarget) {
      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;
      
      potentialSnapTarget.classList.add('snap-target');
      potentialSnapTarget.classList.add(`snap-${snapDirection}`);
      
      highlightActiveAnchors(bestMatchingAnchors.source, bestMatchingAnchors.target);
      showPotentialConnection(bestMatchingAnchors.source, bestMatchingAnchors.target);
    } else {
      hidePotentialConnection();
    }
  }

  // Anchor Highlighting
  function highlightActiveAnchors(sourceAnchor, targetAnchor) {
    if (!sourceAnchor || !targetAnchor) return;
    
    activeAnchors.source = sourceAnchor;
    activeAnchors.target = targetAnchor;
    
    const sourceElement = document.querySelector(`.anchor-point[data-anchor-id="${sourceAnchor.blockId}-${sourceAnchor.type}"]`);
    const targetElement = document.querySelector(`.anchor-point[data-anchor-id="${targetAnchor.blockId}-${targetAnchor.type}"]`);
    
    if (sourceElement) {
      sourceElement.classList.add('highlight-active');
      sourceElement.setAttribute('r', CONFIG.ANCHOR_RADIUS * 1.6);
    }
    
    if (targetElement) {
      targetElement.classList.add('highlight-active');
      targetElement.setAttribute('r', CONFIG.ANCHOR_RADIUS * 1.6);
    }
  }
  
  function resetActiveAnchors() {
    document.querySelectorAll('.anchor-point.highlight-active').forEach(anchor => {
      anchor.classList.remove('highlight-active');
    });
    
    activeAnchors.source = null;
    activeAnchors.target = null;
    
    hidePotentialConnection();
  }
  
  function showPotentialConnection(sourceAnchor, targetAnchor) {
    if (!svgContainer || !sourceAnchor || !targetAnchor) return;
    
    hidePotentialConnection();
    
    potentialConnectionLine = document.createElementNS(CONFIG.SVG_NAMESPACE, 'path');
    potentialConnectionLine.setAttribute('class', 'potential-connection');
    
    const dx = targetAnchor.x - sourceAnchor.x;
    const dy = targetAnchor.y - sourceAnchor.y;
    const controlPointOffset = Math.min(Math.abs(dx) * 0.5, 50);
    
    const pathData = `
      M ${sourceAnchor.x},${sourceAnchor.y} 
      C ${sourceAnchor.x + controlPointOffset},${sourceAnchor.y} 
        ${targetAnchor.x - controlPointOffset},${targetAnchor.y} 
        ${targetAnchor.x},${targetAnchor.y}
    `;
    
    potentialConnectionLine.setAttribute('d', pathData);
    svgContainer.appendChild(potentialConnectionLine);
  }
  
  function hidePotentialConnection() {
    if (potentialConnectionLine) {
      potentialConnectionLine.remove();
      potentialConnectionLine = null;
    }
  }

  // Position Indicator
  function updateFuturePositionIndicator() {
    if (!futureIndicator || !isDraggingBlock || !currentDraggedBlock || !potentialSnapTarget) {
      if (futureIndicator) futureIndicator.classList.remove('visible');
      return;
    }
    
    const currentCoords = getElementCoordinates(currentDraggedBlock);
    
    if (!currentCoords || !blockAnchors[currentDraggedBlock.id] || !blockAnchors[potentialSnapTarget.id]) {
      futureIndicator.classList.remove('visible');
      return;
    }
    
    let sourceAnchor, targetAnchor;
    
    if (snapDirection === 'right') {
      sourceAnchor = blockAnchors[currentDraggedBlock.id].outputs[0];
      targetAnchor = blockAnchors[potentialSnapTarget.id].inputs[0];
    } else if (snapDirection === 'left') {
      sourceAnchor = blockAnchors[currentDraggedBlock.id].inputs[0];
      targetAnchor = blockAnchors[potentialSnapTarget.id].outputs[0];
    }
    
    if (!sourceAnchor || !targetAnchor) {
      futureIndicator.classList.remove('visible');
      return;
    }
    
    let newLeft, newTop;
    
    if (snapDirection === 'right') {
      const outputOffsetFromRight = currentCoords.right - sourceAnchor.x;
      newLeft = targetAnchor.x - (currentCoords.width - outputOffsetFromRight);
      newTop = targetAnchor.y - (sourceAnchor.y - currentCoords.top);
    } else if (snapDirection === 'left') {
      const inputOffsetFromLeft = sourceAnchor.x - currentCoords.left;
      newLeft = targetAnchor.x - inputOffsetFromLeft;
      newTop = targetAnchor.y - (sourceAnchor.y - currentCoords.top);
    }
    
    futureIndicator.style.left = `${newLeft}px`;
    futureIndicator.style.top = `${newTop}px`;
    futureIndicator.style.width = `${currentCoords.width}px`;
    futureIndicator.style.height = `${currentCoords.height}px`;
    futureIndicator.classList.add('visible');
  }

  function applySnapAnimation() {
    if (!currentDraggedBlock || !potentialSnapTarget) return;
    
    currentDraggedBlock.classList.add('snap-animation');
    
    setTimeout(() => {
      if (currentDraggedBlock) {
        currentDraggedBlock.classList.remove('snap-animation');
      }
    }, 300);
    
    const currentCoords = getElementCoordinates(currentDraggedBlock);
    
    if (!currentCoords || !blockAnchors[currentDraggedBlock.id] || !blockAnchors[potentialSnapTarget.id]) {
      return;
    }
    
    let sourceAnchor, targetAnchor;
    
    if (snapDirection === 'right') {
      sourceAnchor = blockAnchors[currentDraggedBlock.id].outputs[0];
      targetAnchor = blockAnchors[potentialSnapTarget.id].inputs[0];
    } else if (snapDirection === 'left') {
      sourceAnchor = blockAnchors[currentDraggedBlock.id].inputs[0];
      targetAnchor = blockAnchors[potentialSnapTarget.id].outputs[0];
    }
    
    if (!sourceAnchor || !targetAnchor) return;
    
    let newLeft, newTop;
    
    if (snapDirection === 'right') {
      const outputOffsetFromRight = currentCoords.right - sourceAnchor.x;
      newLeft = targetAnchor.x - (currentCoords.width - outputOffsetFromRight);
      newTop = targetAnchor.y - (sourceAnchor.y - currentCoords.top);
    } else if (snapDirection === 'left') {
      const inputOffsetFromLeft = sourceAnchor.x - currentCoords.left;
      newLeft = targetAnchor.x - inputOffsetFromLeft;
      newTop = targetAnchor.y - (sourceAnchor.y - currentCoords.top);
    }
    
    currentDraggedBlock.style.left = `${newLeft}px`;
    currentDraggedBlock.style.top = `${newTop}px`;
    
    updateAnchorPositions(currentDraggedBlock);
  }

  // Context Menu
  function addDetachContextMenu() {
    const existingMenu = document.getElementById('detach-menu');
    if (existingMenu) existingMenu.remove();
    
    const menu = document.createElement('div');
    menu.id = 'detach-menu';
    menu.style.display = 'none';
    
    const detachOption = document.createElement('div');
    detachOption.textContent = 'נתק חיבור';
    detachOption.id = 'detach-option';
    
    menu.appendChild(detachOption);
    document.body.appendChild(menu);
    
    detachOption.addEventListener('click', () => {
      const targetId = menu.getAttribute('data-target');
      const sourceId = menu.getAttribute('data-source');
      
      if (sourceId && targetId) {
        removeConnection(sourceId, targetId);
        
        const block = document.getElementById(targetId);
        if (block) {
          block.classList.add('detach-animation');
          setTimeout(() => block.classList.remove('detach-animation'), 300);
        }
      }
      
      menu.style.display = 'none';
    });
    
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target.id !== 'detach-option') {
        menu.style.display = 'none';
      }
    });
  }

  function setupContextMenuListeners() {
    svgContainer.addEventListener('contextmenu', (e) => {
      const path = e.target.closest('.connection-path');
      if (!path) return;
      
      e.preventDefault();
      
      const sourceId = path.getAttribute('data-source');
      const targetId = path.getAttribute('data-target');
      
      const menu = document.getElementById('detach-menu');
      if (menu) {
        menu.style.display = 'block';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        menu.setAttribute('data-source', sourceId);
        menu.setAttribute('data-target', targetId);
      }
    });
  }

  // Area Listeners
  function initProgrammingAreaListeners() {
    const a = document.getElementById('program-blocks');
    if (!a) {
      if (CONFIG.DEBUG) console.error('Programming area not found!');
      return;
    }
    
    a.addEventListener('dragover', (e) => e.preventDefault());
    a.addEventListener('dragstart', (e) => {
      if (e.target?.closest?.('#program-blocks .block-container')) {
        e.preventDefault();
        e.stopPropagation();
      }
      return false;
    });
    a.addEventListener('drop', (e) => e.preventDefault());
    
    a.addEventListener('contextmenu', (e) => {
      const block = e.target.closest('.block-container');
      if (!block) return;
      
      if (!block.classList.contains('connected-block') && 
          !block.classList.contains('has-connected-block')) {
        return;
      }
      
      e.preventDefault();
      
      const blockId = block.id;
      const connectionIds = Object.keys(connectionPaths).filter(id => 
        id.startsWith(`${blockId}-to-`) || id.endsWith(`-to-${blockId}`)
      );
      
      if (connectionIds.length === 0) return;
      
      const connectionId = connectionIds[0];
      const parts = connectionId.split('-to-');
      const sourceId = parts[0];
      const targetId = parts[1];
      
      const menu = document.getElementById('detach-menu');
      if (menu) {
        menu.style.display = 'block';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        menu.setAttribute('data-source', sourceId);
        menu.setAttribute('data-target', targetId);
      }
    });
  }

  function observeNewBlocks() {
    const a = document.getElementById('program-blocks');
    if (!a) {
      if (CONFIG.DEBUG) console.error('Programming area not found!');
      return;
    }
    
    const o = new MutationObserver((mutations) => {
      mutations.forEach((mu) => {
        if (mu.type === 'childList') {
          mu.addedNodes.forEach((node) => {
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
    
    o.observe(a, { childList: true, subtree: true });
  }

  // Initialization
  function init() {
    addHighlightStyles();
    
    initAudio();
    if (CONFIG.PLAY_SOUND) addSoundTestButton();
    
    initSVGContainer();
    initArrowheadMarker();
    
    addDetachContextMenu();
    setupContextMenuListeners();
    
    initProgrammingAreaListeners();
    
    const existingBlocks = document.querySelectorAll('#program-blocks .block-container');
    existingBlocks.forEach(block => {
      if (!block.id) generateUniqueId(block);
      addBlockDragListeners(block);
    });
    
    observeNewBlocks();
    
    if (CONFIG.DEBUG) console.log('SVG Anchor Point Connection System initialized with Ghost Drag Fix (v4.2.0)');
  }
  
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
