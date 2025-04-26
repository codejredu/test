// ========================================================================
  // נקודות עיגון פעילות - פונקציות חדשות בגרסה 4.1
  // ========================================================================
  function highlightActiveAnchors(sourceAnchor, targetAnchor) {
    if (!sourceAnchor || !targetAnchor) return;
    
    // Save reference to active anchors
    activeAnchors.source = sourceAnchor;
    activeAnchors.target = targetAnchor;
    
    // Find the SVG elements for these anchors
    const sourceElement = document.querySelector(`.anchor-point[data-anchor-id="${sourceAnchor.blockId}-${sourceAnchor.type}"]`);
    const targetElement = document.querySelector(`.anchor-point[data-anchor-id="${targetAnchor.blockId}-${targetAnchor.type}"]`);
    
    // Debug info
    if (CONFIG.DEBUG > 1) {
      console.log('Highlighting anchors:');
      console.log('Source anchor:', sourceAnchor);
      console.log('Target anchor:', targetAnchor);
      console.log('Source element found:', !!sourceElement);
      console.log('Target element found:', !!targetElement);
    }
    
    // Highlight anchors
    if (sourceElement) {
      sourceElement.classList.add('highlight-active');
      // Force repaint to make sure highlighting applies immediately
      sourceElement.setAttribute('r', CONFIG.ANCHOR_RADIUS * 1.6);
    }
    
    if (targetElement) {
      targetElement.classList.add('highlight-active');
      // Force repaint to make sure highlighting applies immediately
      targetElement.setAttribute('r', CONFIG.ANCHOR_RADIUS * 1.6);
    }
  }
  
  function resetActiveAnchors() {
    // Remove highlight from all anchor points
    document.querySelectorAll('.anchor-point.highlight-active').forEach(anchor => {
      anchor.classList.remove('highlight-active');
    });
    
    // Reset active anchors
    activeAnchors.source = null;
    activeAnchors.target = null;
    
    // Hide potential connection line
    hidePotentialConnection();
  }
  
  function showPotentialConnection(sourceAnchor, targetAnchor) {
    if (!svgContainer || !sourceAnchor || !targetAnchor) return;
    
    // Remove existing line if any
    hidePotentialConnection();
    
    // Create new connection line
    potentialConnectionLine = document.createElementNS(CONFIG.SVG_NAMESPACE, 'path');
    potentialConnectionLine.setAttribute('class', 'potential-connection');
    
    // Calculate control points for a smooth curve
    const dx = targetAnchor.x - sourceAnchor.x;
    const dy = targetAnchor.y - sourceAnchor.y;
    const controlPointOffset = Math.min(Math.abs(dx) * 0.5, 50); // Limit curve
    
    // Create a bezier curve path
    const pathData = `
      M ${sourceAnchor.x},${sourceAnchor.y} 
      C ${sourceAnchor.x + controlPointOffset},${sourceAnchor.y} 
        ${targetAnchor.x - controlPointOffset},${targetAnchor.y} 
        ${targetAnchor.x},${targetAnchor.y}
    `;
    
    potentialConnectionLine.setAttribute('d', pathData);
    
    // Add to SVG container
    svgContainer.appendChild(potentialConnectionLine);
  }
  
  function hidePotentialConnection() {
    if (potentialConnectionLine) {
      potentialConnectionLine.remove();
      potentialConnectionLine = null;
    }
  }
  
  function updateFuturePositionIndicator() {
    if (!futureIndicator || !isDraggingBlock || !currentDraggedBlock || !potentialSnapTarget) {
      if (futureIndicator) futureIndicator.classList.remove('visible');
      return;
    }
    
    // Get coordinates and anchor points
    const currentCoords = getElementCoordinates(currentDraggedBlock);
    
    if (!currentCoords || !blockAnchors[currentDraggedBlock.id] || !blockAnchors[potentialSnapTarget.id]) {
      futureIndicator.classList.remove('visible');
      return;
    }
    
    // Get the relevant anchor points based on snap direction
    let sourceAnchor, targetAnchor;
    
    if (snapDirection === 'right') {
      // Current block's output connects to target's input
      sourceAnchor = blockAnchors[currentDraggedBlock.id].outputs[0];
      targetAnchor = blockAnchors[potentialSnapTarget.id].inputs[0];
    } else if (snapDirection === 'left') {
      // Target block's output connects to current's input
      sourceAnchor = blockAnchors[currentDraggedBlock.id].inputs[0];
      targetAnchor = blockAnchors[potentialSnapTarget.id].outputs[0];
    }
    
    if (!sourceAnchor || !targetAnchor) {
      futureIndicator.classList.remove('visible');
      return;
    }
    
    // Calculate future position based on anchor points alignment
    let newLeft, newTop;
    
    if (snapDirection === 'right') {
      // Position current block so its output aligns with target's input
      // Calculate offset from right edge of block to output anchor
      const outputOffsetFromRight = currentCoords.right - sourceAnchor.x;
      // Position left edge so output anchor aligns with input anchor
      newLeft = targetAnchor.x - (currentCoords.width - outputOffsetFromRight);
      // Vertically align based on anchor point y position
      newTop = targetAnchor.y - (sourceAnchor.y - currentCoords.top);
    } else if (snapDirection === 'left') {
      // Position current block so its input aligns with target's output
      // Calculate offset from left edge of block to input anchor
      const inputOffsetFromLeft = sourceAnchor.x - currentCoords.left;
      // Position left edge so input anchor aligns with output anchor
      newLeft = targetAnchor.x - inputOffsetFromLeft;
      // Vertically align based on anchor point y position
      newTop = targetAnchor.y - (sourceAnchor.y - currentCoords.top);
    }
    
    // Update indicator style
    futureIndicator.style.left = `${newLeft}px`;
    futureIndicator.style.top = `${newTop}px`;
    futureIndicator.style.width = `${currentCoords.width}px`;
    futureIndicator.style.height = `${currentCoords.height}px`;
    futureIndicator.classList.add('visible');
  }
  
  // ========================================================================
  // Detach & Context Menu - Updated for SVG connections
  // ========================================================================
  function addDetachContextMenu() {
    // Remove existing menu if any
    const existingMenu = document.getElementById('detach-menu');
    if (existingMenu) existingMenu.remove();
    
    // Create new menu
    const menu = document.createElement('div');
    menu.id = 'detach-menu';
    menu.style.display = 'none';
    
    const detachOption = document.createElement('div');
    detachOption.textContent = 'נתק חיבור';
    detachOption.id = 'detach-option';
    
    menu.appendChild(detachOption);
    document.body.appendChild(menu);
    
    // Add click handler for detach option
    detachOption.addEventListener('click', () => {
      const targetId = menu.getAttribute('data-target');
      const sourceId = menu.getAttribute('data-source');
      
      if (sourceId && targetId) {
        removeConnection(sourceId, targetId);
        
        // Add detach animation
        const block = document.getElementById(targetId);
        if (block) {
          block.classList.add('detach-animation');
          setTimeout(() => block.classList.remove('detach-animation'), 300);
        }
      }
      
      // Hide menu
      menu.style.display = 'none';
    });
    
    // Close menu when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target.id !== 'detach-option') {
        menu.style.display = 'none';
      }
    });
    
    if (CONFIG.DEBUG) console.log('Detach context menu created');
  }
  
  function setupContextMenuListeners() {
    // Add right-click handler to SVG container
    svgContainer.addEventListener('contextmenu', (e) => {
      // Check if click is on a connection path
      const path = e.target.closest('.connection-path');
      if (!path) return;
      
      e.preventDefault();
      
      // Get connection details
      const sourceId = path.getAttribute('data-source');
      const targetId = path.getAttribute('data-target');
      
      // Show context menu
      const menu = document.getElementById('detach-menu');
      if (menu) {
        menu.style.display = 'block';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        menu.setAttribute('data-source', sourceId);
        menu.setAttribute('data-target', targetId);
      }
    });
    
    if (CONFIG.DEBUG) console.log('Context menu listeners added');
  }
  
  // ========================================================================
  // מאזינים, זיהוי בלוקים חדשים - מעודכן למערכת עוגנים
  // ========================================================================
  function observeNewBlocks() { 
    const a = document.getElementById('program-blocks');
    if (!a) {
      if (CONFIG.DEBUG) console.error('Programming area not found for block observation!');
      return;
    }
    
    // שימוש ב-MutationObserver לזיהוי בלוקים חדשים
    const o = new MutationObserver((mutations) => {
      mutations.forEach((mu) => {
        if (mu.type === 'childList') {
          mu.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // אלמנט DOM
              let block = node.classList?.contains('block-container') ? node : node.querySelector?.('.block-container');
              if (block?.closest('#program-blocks')) {
                if (!block.id) generateUniqueId(block);
                addBlockDragListeners(block);
                if (CONFIG.DEBUG > 1) console.log(`Added listeners to new block: ${block.id}`);
              }
            }
          });
        }
      });
    });
    
    // עקוב אחרי שינויים באזור התכנות
    o.observe(a, { childList: true, subtree: true });
    
    if (CONFIG.DEBUG) console.log("MutationObserver watching for new blocks.");
  }
  
  // ========================================================================
  // אתחול המערכת והפעלה - מעודכן לעבודה עם עוגנים
  // ========================================================================
  function init() {
    // Add CSS styles
    addHighlightStyles();
    
    // Initialize audio
    initAudio();
    if (CONFIG.PLAY_SOUND) addSoundTestButton();
    
    // Initialize SVG container for connections
    initSVGContainer();
    
    // Add arrowhead marker for connections
    initArrowheadMarker();
    
    // Add context menu for detaching connections
    addDetachContextMenu();
    
    // Add listeners to SVG container
    setupContextMenuListeners();
    
    // Initialize programming area listeners
    initProgrammingAreaListeners();
    
    // Add listeners to existing blocks
    const existingBlocks = document.querySelectorAll('#program-blocks .block-container');
    existingBlocks.forEach(block => {
      if (!block.id) generateUniqueId(block);
      addBlockDragListeners(block);
    });
    
    // Watch for new blocks
    observeNewBlocks();
    
    if (CONFIG.DEBUG) console.log('SVG Anchor Point Connection System initialized with Ghost Drag Fix (v4.1.1)');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
// --- START OF FILE linkageimproved.js ---
// --- Version 4.1.0: SVG Anchor Points Connection System with Ghost Drag Fix ---
// Changes from v4.0.0:
// 1. Fixed ghost drag issue with drag blocker and willChange optimization
// 2. Improved anchor point visibility
// 3. Enhanced connection visualization

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
  let svgContainer = null; // Will hold reference to the SVG container
  let connectionPaths = {}; // Stores SVG path elements for visualizing connections
  let blockAnchors = {}; // Stores anchor points for each block

  // משתנים גלובליים נוספים עבור הדגשת נקודות עיגון
  let potentialConnectionLine = null; // קו להצגת חיבור פוטנציאלי
  let activeAnchors = { source: null, target: null }; // נקודות עיגון פעילות
  
  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 50, // הגדלנו את הסף לזיהוי חיבורים פוטנציאליים (50px)
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות
    BLOCK_GAP: 0, // אין רווח - חיבור שקע-תקע
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3', // ודא שהנתיב נכון
    DEBUG: true, // Set to false for production
    
    // SVG Anchor point configuration - New in v4.0
    SVG_NAMESPACE: "http://www.w3.org/2000/svg",
    ANCHOR_RADIUS: 8, // הגדלנו את גודל נקודות העיגון
    SHOW_ANCHORS: true, // תמיד מציג את נקודות העיגון לנוחות המשתמש
    CONNECTION_PATH_WIDTH: 2,
    CONNECTION_PATH_COLOR: "rgba(76, 175, 80, 0.7)",
    CONNECTION_PATH_DASH: "5,3",
    
    // Definition of anchor points (relative positions)
    ANCHOR_POINTS: {
      OUTPUT: { right: 0.5 }, // Output on right center
      INPUT: { left: 0.5 }    // Input on left center
    }
  };

  // ========================================================================
  // Utility Functions
  // ========================================================================
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

  // ========================================================================
  // SVG Anchor Point System - New in v4.0
  // ========================================================================
  function initSVGContainer() {
    // Check if SVG container already exists
    svgContainer = document.getElementById('connection-svg-container');
    if (svgContainer) return;
    
    // Create SVG container for connection visualization
    svgContainer = document.createElementNS(CONFIG.SVG_NAMESPACE, 'svg');
    svgContainer.id = 'connection-svg-container';
    svgContainer.style.position = 'absolute';
    svgContainer.style.top = '0';
    svgContainer.style.left = '0';
    svgContainer.style.width = '100%';
    svgContainer.style.height = '100%';
    svgContainer.style.pointerEvents = 'none';
    svgContainer.style.zIndex = '998';
    
    // Add to programming area
    const programmingArea = document.getElementById('program-blocks');
    if (programmingArea) {
      programmingArea.style.position = 'relative'; // Ensure positioning context
      programmingArea.appendChild(svgContainer);
      if (CONFIG.DEBUG) console.log('SVG container created for connections');
    } else {
      console.error('Programming area not found for SVG container');
    }
  }

  function createAnchorPoints(block) {
    if (!block || !block.id) return;
    
    // Get block dimensions
    const coords = getElementCoordinates(block);
    if (!coords) return;
    
    // Create anchor points object for this block if it doesn't exist
    if (!blockAnchors[block.id]) {
      blockAnchors[block.id] = {
        inputs: [],
        outputs: []
      };
    }
    
    // Find SVG elements inside the block if any
    const svgElement = block.querySelector('svg');
    
    if (svgElement) {
      // Option 1: SVG block with predefined connection points
      const outputPoint = svgElement.querySelector('.output-point, .output, .output-anchor');
      const inputPoint = svgElement.querySelector('.input-point, .input, .input-anchor');
      
      // Get SVG's position relative to block
      const svgRect = svgElement.getBoundingClientRect();
      const svgOffsetX = svgRect.left - coords.left;
      const svgOffsetY = svgRect.top - coords.top;
      
      if (outputPoint) {
        // Get point position within SVG
        const pointX = parseFloat(outputPoint.getAttribute('cx') || 0);
        const pointY = parseFloat(outputPoint.getAttribute('cy') || 0);
        
        // Create output anchor at exact point position
        const outputAnchor = {
          type: 'output',
          x: coords.left + svgOffsetX + pointX,
          y: coords.top + svgOffsetY + pointY,
          blockId: block.id
        };
        
        blockAnchors[block.id].outputs = [outputAnchor];
      } else {
        // Default output anchor if no specific point found
        const outputAnchor = {
          type: 'output',
          x: coords.right,
          y: coords.top + (coords.height * CONFIG.ANCHOR_POINTS.OUTPUT.right),
          blockId: block.id
        };
        
        blockAnchors[block.id].outputs = [outputAnchor];
      }
      
      if (inputPoint) {
        // Get point position within SVG
        const pointX = parseFloat(inputPoint.getAttribute('cx') || 0);
        const pointY = parseFloat(inputPoint.getAttribute('cy') || 0);
        
        // Create input anchor at exact point position
        const inputAnchor = {
          type: 'input',
          x: coords.left + svgOffsetX + pointX,
          y: coords.top + svgOffsetY + pointY,
          blockId: block.id
        };
        
        blockAnchors[block.id].inputs = [inputAnchor];
      } else {
        // Default input anchor if no specific point found
        const inputAnchor = {
          type: 'input',
          x: coords.left,
          y: coords.top + (coords.height * CONFIG.ANCHOR_POINTS.INPUT.left),
          blockId: block.id
        };
        
        blockAnchors[block.id].inputs = [inputAnchor];
      }
    } else {
      // Option 2: Standard block without SVG - use default positions
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
    
    // Visualize anchor points if debug mode is enabled
    if (CONFIG.SHOW_ANCHORS) {
      blockAnchors[block.id].outputs.forEach(visualizeAnchorPoint);
      blockAnchors[block.id].inputs.forEach(visualizeAnchorPoint);
    }
    
    if (CONFIG.DEBUG > 1) console.log(`Created anchor points for block ${block.id}`);
    return blockAnchors[block.id];
  }

  function visualizeAnchorPoint(anchor) {
    if (!svgContainer || !anchor) return;
    
    // Remove existing anchor visualization with same id if exists
    const existingAnchor = document.querySelector(`.anchor-point[data-block-id="${anchor.blockId}"][data-anchor-type="${anchor.type}"]`);
    if (existingAnchor) {
      existingAnchor.remove();
    }
    
    // Create anchor point visualization
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
    
    // Get updated block coordinates
    const coords = getElementCoordinates(block);
    if (!coords) return;
    
    // Update output anchor positions
    blockAnchors[block.id].outputs.forEach(anchor => {
      anchor.x = coords.right;
      anchor.y = coords.top + (coords.height * CONFIG.ANCHOR_POINTS.OUTPUT.right);
    });
    
    // Update input anchor positions
    blockAnchors[block.id].inputs.forEach(anchor => {
      anchor.x = coords.left;
      anchor.y = coords.top + (coords.height * CONFIG.ANCHOR_POINTS.INPUT.left);
    });
    
    // Update visualizations if in debug mode
    if (CONFIG.SHOW_ANCHORS) {
      // Remove old visualization
      const existingPoints = svgContainer.querySelectorAll(`.anchor-point[data-block-id="${block.id}"]`);
      existingPoints.forEach(point => point.remove());
      
      // Create new visualizations
      blockAnchors[block.id].outputs.forEach(visualizeAnchorPoint);
      blockAnchors[block.id].inputs.forEach(visualizeAnchorPoint);
    }
    
    // Update any connections involving this block
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
    
    // For each output anchor of source block
    blockAnchors[sourceBlock.id].outputs.forEach(output => {
      // For each input anchor of target block
      blockAnchors[targetBlock.id].inputs.forEach(input => {
        // Calculate distance between points
        const distance = Math.sqrt(
          Math.pow(output.x - input.x, 2) + 
          Math.pow(output.y - input.y, 2)
        );
        
        // Update best match if this is closer
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
    
    // Get the output anchor from source block and input anchor from target block
    const outputAnchor = blockAnchors[sourceBlockId].outputs[0];
    const inputAnchor = blockAnchors[targetBlockId].inputs[0];
    
    if (!outputAnchor || !inputAnchor) return false;
    
    // Create SVG path for connection visualization
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
    
    // Draw the path
    updatePathBetweenAnchors(path, outputAnchor, inputAnchor);
    
    // Add to SVG container
    svgContainer.appendChild(path);
    
    // Store reference
    connectionPaths[connectionId] = path;
    
    // Add classes to indicate connected blocks
    const sourceBlock = document.getElementById(sourceBlockId);
    const targetBlock = document.getElementById(targetBlockId);
    
    if (sourceBlock) sourceBlock.classList.add('has-connected-block');
    if (targetBlock) targetBlock.classList.add('connected-block');
    
    if (CONFIG.DEBUG) console.log(`Created connection: ${connectionId}`);
    return true;
  }

  function updatePathBetweenAnchors(path, fromAnchor, toAnchor) {
    if (!path || !fromAnchor || !toAnchor) return;
    
    // Calculate control points for a smooth curve
    const dx = toAnchor.x - fromAnchor.x;
    const dy = toAnchor.y - fromAnchor.y;
    const controlPointOffset = Math.min(Math.abs(dx) * 0.5, 50); // Limit curve
    
    // Create a bezier curve path
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
    
    // Find all connections involving this block
    Object.keys(connectionPaths).forEach(connectionId => {
      const path = connectionPaths[connectionId];
      const sourceId = path.getAttribute('data-source');
      const targetId = path.getAttribute('data-target');
      
      // If this block is involved in the connection
      if (sourceId === blockId || targetId === blockId) {
        // Get the anchors
        const sourceAnchor = blockAnchors[sourceId]?.outputs[0];
        const targetAnchor = blockAnchors[targetId]?.inputs[0];
        
        if (sourceAnchor && targetAnchor) {
          // Update the path
          updatePathBetweenAnchors(path, sourceAnchor, targetAnchor);
        }
      }
    });
  }

  function removeConnection(sourceBlockId, targetBlockId) {
    const connectionId = `${sourceBlockId}-to-${targetBlockId}`;
    const path = connectionPaths[connectionId];
    
    if (path) {
      // Remove the path element
      path.remove();
      
      // Remove from our tracking
      delete connectionPaths[connectionId];
      
      // Update classes for blocks
      const sourceBlock = document.getElementById(sourceBlockId);
      const targetBlock = document.getElementById(targetBlockId);
      
      // Check if source block has other connections
      const sourceHasOtherConnections = Object.keys(connectionPaths).some(id => 
        id.startsWith(`${sourceBlockId}-to-`)
      );
      
      // Check if target block has other connections
      const targetHasOtherConnections = Object.keys(connectionPaths).some(id => 
        id.endsWith(`-to-${targetBlockId}`)
      );
      
      // Update classes based on connection status
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
    
    // Define marker for arrowhead
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

  // ========================================================================
  // הוספת סגנונות CSS - עדכון לעבודה עם מערכת עוגנים
  // ========================================================================
  function addHighlightStyles() {
    // בדוק אם הסגנונות כבר קיימים
    if (document.getElementById('block-connection-styles')) {
      if (CONFIG.DEBUG) console.log('Styles already exist - ensuring they are properly applied');
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
      
      /* Make sure dragged blocks stay visible */
      .block-container.dragging {
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        z-index: 1000 !important;
      }

      /* סגנונות עבור פתרון "רוח רפאים" */
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
      }
      
      #sound-test-button { position:fixed; bottom:15px; right:15px; padding:8px 12px; background-color:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; z-index:9999; font-family:Arial,sans-serif; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background-color .2s,opacity .5s ease-out; opacity:1; } #sound-test-button:hover { background-color:#0b7dda; } #sound-test-button.success { background-color:#4CAF50; } #sound-test-button.error { background-color:#f44336; } #sound-test-button.loading { background-color:#ff9800; cursor:wait; } #sound-test-button.hidden { opacity:0; pointer-events:none; }
    `;
    
    // וודא שהסגנונות נוספים לראש המסמך
    document.head.appendChild(style);
    
    // בדוק אם הסגנונות התווספו כמצופה
    if (CONFIG.DEBUG) {
      console.log('Styles added successfully for SVG anchor system');
      const appliedStyle = document.getElementById('block-connection-styles');
      if (appliedStyle) {
        console.log('Connection styles verified in DOM');
      } else {
        console.error('Connection styles missing from DOM after append!');
      }
    }
  }

  // ========================================================================
  // אתחול אודיו, כפתור בדיקה, נגינת צליל - ללא שינוי מ-v3.5.1
  // ========================================================================
  function initAudio() { if (!CONFIG.PLAY_SOUND || soundInitialized) return; try { const el=document.getElementById('snap-sound-element'); if(el){snapSound=el;soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio reused.');if(!el.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)){el.innerHTML='';const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';el.appendChild(s);el.load();}return;} snapSound=document.createElement('audio');snapSound.id='snap-sound-element';snapSound.preload='auto';snapSound.volume=CONFIG.SOUND_VOLUME;const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';snapSound.appendChild(s);snapSound.addEventListener('error',(e)=>{console.error(`Audio Error: ${CONFIG.SOUND_PATH}`,e);const b=document.getElementById('sound-test-button');if(b){b.textContent='שגיאה';b.classList.add('error');b.disabled=true;}CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;});snapSound.addEventListener('canplaythrough',()=>{soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio ready.');const b=document.getElementById('sound-test-button');if(b?.classList.contains('loading')){b.textContent='בדוק';b.classList.remove('loading');b.disabled=false;}});snapSound.style.display='none';document.body.appendChild(snapSound);if(CONFIG.DEBUG)console.log(`Audio created: ${CONFIG.SOUND_PATH}`);}catch(err){console.error('Audio init error:',err);CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;}}
  function addSoundTestButton() { if(!CONFIG.PLAY_SOUND)return;try{const eb=document.getElementById('sound-test-button');if(eb)eb.remove();const b=document.createElement('button');b.id='sound-test-button';b.title='בדוק צליל';b.className='';if(!snapSound){b.textContent='שמע נכשל';b.classList.add('error');b.disabled=true;}else if(!soundInitialized){b.textContent='טוען...';b.classList.add('loading');b.disabled=true;}else{b.textContent='בדוק';b.disabled=false;}Object.assign(b.style,{position:'fixed',bottom:'15px',right:'15px',zIndex:'9999',padding:'8px 12px',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',boxShadow:'0 2px 5px rgba(0,0,0,0.2)',fontFamily:'Arial,sans-serif',fontSize:'14px',fontWeight:'bold',transition:'background-color .2s,opacity .5s ease-out',opacity:'1'});b.onmouseover=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#0b7dda'};b.onmouseout=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#2196F3'};b.addEventListener('click',function(){if(this.disabled||!snapSound||!soundInitialized)return;snapSound.play().then(()=>{b.textContent='פועל ✓';b.classList.add('success');audioContextAllowed=true;setTimeout(()=>{b.classList.add('hidden');setTimeout(()=>b.remove(),500)},3000);if(snapSound){snapSound.pause();snapSound.currentTime=0;}}).catch(err=>{console.warn('Sound test fail:',err.name);if(err.name==='NotAllowedError'){b.textContent='חסום-לחץ';b.classList.add('error');audioContextAllowed=false;}else{b.textContent='שגיאה';b.classList.add('error');b.disabled=true;}});});document.body.appendChild(b);if(CONFIG.DEBUG)console.log('Sound test button added.');}catch(err){console.error('Err adding sound btn:',err);}}
