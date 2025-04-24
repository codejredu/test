// --- START OF FILE blocksLinkage_fabricJS.js ---
// FabricJS Block Linkage System
// Version 1.0 - Complete reimplementation using FabricJS canvas
// Supports: Block snapping with visual indicators, sound effects, and advanced interaction

(function() {
  // Configuration - Adjustable parameters
  const CONFIG = {
    CONNECT_THRESHOLD: 15,           // Snap threshold in pixels
    VERTICAL_OVERLAP_REQ: 0.4,       // Require 40% vertical overlap for connections
    BLOCK_GAP: 0,                    // No gap - direct socket-pin connection
    PLAY_SOUND: true,                // Enable sound effects
    SOUND_VOLUME: 0.8,               // Sound volume (0-1)
    SOUND_PATH: 'assets/sound/link.mp3', // Sound file path
    DEBUG: true,                     // Set to false for production
    CANVAS_UPDATE_INTERVAL: 1000/60, // Canvas refresh rate (60fps)
    HIGHLIGHT_COLOR: '#FFC107',      // Yellow highlight
    INDICATOR_COLOR: 'rgba(0,120,255,0.5)', // Blue indicator
    ALLOW_OBJECT_SCALING: false,     // Disable scaling of blocks
    ALLOW_OBJECT_ROTATION: false,    // Disable rotation of blocks
    CANVAS_ID: 'fabric-blocks-canvas', // Canvas ID to create
    CANVAS_Z_INDEX: 100              // Canvas z-index
  };

  // Module-level variables
  let canvas = null;
  let audioContext = null;
  let snapSound = null;
  let soundInitialized = false;
  let audioContextAllowed = false;
  let blockObjects = {};
  let draggedObject = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let indicatorObject = null;
  let programBlocksElement = null;
  let scaleFactor = 1;

  // ========================================================================
  // Canvas and FabricJS setup
  // ========================================================================
  
  /**
   * Create or get the canvas element and initialize FabricJS
   */
  function setupCanvas() {
    // Find the programming area
    programBlocksElement = document.getElementById('program-blocks');
    if (!programBlocksElement) {
      console.error("Programming area (#program-blocks) not found");
      return false;
    }
    
    // Create or get canvas
    let canvasEl = document.getElementById(CONFIG.CANVAS_ID);
    if (!canvasEl) {
      canvasEl = document.createElement('canvas');
      canvasEl.id = CONFIG.CANVAS_ID;
      
      // Style the canvas to overlay the programming area
      Object.assign(canvasEl.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: CONFIG.CANVAS_Z_INDEX,
        pointerEvents: 'auto',
        touchAction: 'none'
      });
      
      // Append to the programming area
      programBlocksElement.style.position = 'relative';
      programBlocksElement.appendChild(canvasEl);
    }
    
    // Initialize FabricJS canvas
    canvas = new fabric.Canvas(canvasEl, {
      selection: false,          // Disable group selection
      defaultCursor: 'default',
      hoverCursor: 'move',
      preserveObjectStacking: true
    });
    
    // Set canvas dimensions to match the programming area
    resizeCanvas();
    
    // Event listeners for canvas interactions
    canvas.on('object:moving', onObjectMoving);
    canvas.on('mouse:up', onMouseUp);
    canvas.on('mouse:over', onMouseOver);
    canvas.on('mouse:out', onMouseOut);
    
    // Add window resize handler for responsive canvas
    window.addEventListener('resize', debounce(resizeCanvas, 250));
    
    // Create the future position indicator object (hidden initially)
    createFuturePositionIndicator();
    
    if (CONFIG.DEBUG) {
      console.log("FabricJS canvas initialized with dimensions: ", 
        canvas.width, "x", canvas.height);
    }
    
    return true;
  }
  
  /**
   * Resize canvas to match the programming area
   */
  function resizeCanvas() {
    if (!canvas || !programBlocksElement) return;
    
    const rect = programBlocksElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    canvas.setDimensions({
      width: width,
      height: height
    });
    
    if (CONFIG.DEBUG) {
      console.log("Canvas resized to: ", width, "x", height);
    }
    
    // Re-render after resize
    canvas.renderAll();
  }
  
  /**
   * Create a future position indicator object
   */
  function createFuturePositionIndicator() {
    indicatorObject = new fabric.Rect({
      width: 100,
      height: 50,
      fill: 'transparent',
      stroke: CONFIG.INDICATOR_COLOR,
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      opacity: 0,
      selectable: false,
      evented: false
    });
    
    canvas.add(indicatorObject);
  }
  
  /**
   * Create a FabricJS object from an existing block in the DOM
   */
  function createFabricObjectFromBlock(blockElement) {
    if (!blockElement || !blockElement.id) {
      if (!blockElement.id) generateUniqueId(blockElement);
      if (CONFIG.DEBUG) console.log(`Created ID for block: ${blockElement.id}`);
    }
    
    // Skip if this block is already converted
    if (blockObjects[blockElement.id]) return blockObjects[blockElement.id];
    
    const rect = blockElement.getBoundingClientRect();
    const canvasRect = canvas.getElement().getBoundingClientRect();
    
    // Calculate position relative to canvas
    const left = rect.left - canvasRect.left;
    const top = rect.top - canvasRect.top;
    
    // Create an image of the block using html2canvas or similar
    // For this implementation, we'll create a rectangle with the block's dimensions
    const fabricObj = new fabric.Rect({
      left: left,
      top: top,
      width: rect.width,
      height: rect.height,
      fill: getComputedStyle(blockElement).backgroundColor || '#f0f0f0',
      stroke: '#333',
      strokeWidth: 1,
      rx: 5,
      ry: 5,
      hasControls: false,
      hasBorders: false,
      lockScalingX: !CONFIG.ALLOW_OBJECT_SCALING,
      lockScalingY: !CONFIG.ALLOW_OBJECT_SCALING,
      lockRotation: !CONFIG.ALLOW_OBJECT_ROTATION,
      transparentCorners: false,
      cornerColor: 'rgba(0,0,0,0.5)',
      cornerSize: 8,
      originX: 'left',
      originY: 'top'
    });
    
    // Add metadata to the Fabric object
    fabricObj.blockId = blockElement.id;
    fabricObj.blockType = blockElement.dataset.type || 'unknown';
    fabricObj.connectedTo = null;
    fabricObj.connectionDirection = null;
    fabricObj.connectedFromLeft = null;
    fabricObj.connectedFromRight = null;
    
    // Store the reference to the original DOM element
    fabricObj.domElement = blockElement;
    
    // Store in our registry
    blockObjects[blockElement.id] = fabricObj;
    
    // Hide the original DOM element
    blockElement.style.visibility = 'hidden';
    
    // Add to canvas
    canvas.add(fabricObj);
    
    if (CONFIG.DEBUG) {
      console.log(`Converted block ${blockElement.id} to FabricJS object`);
    }
    
    return fabricObj;
  }
  
  /**
   * Sync the position of a block between DOM and FabricJS
   */
  function syncBlockPosition(fabricObj) {
    if (!fabricObj || !fabricObj.domElement) return;
    
    const domElement = fabricObj.domElement;
    const canvasEl = canvas.getElement();
    const canvasRect = canvasEl.getBoundingClientRect();
    
    // Calculate the absolute position
    const absLeft = canvasRect.left + fabricObj.left;
    const absTop = canvasRect.top + fabricObj.top;
    
    // Position the DOM element (now hidden but maintaining its position for functionality)
    domElement.style.position = 'absolute';
    domElement.style.left = `${fabricObj.left}px`;
    domElement.style.top = `${fabricObj.top}px`;
    domElement.style.width = `${fabricObj.width}px`;
    domElement.style.height = `${fabricObj.height}px`;
    domElement.style.margin = '0';
    
    if (CONFIG.DEBUG > 1) {
      console.log(`Synced position for ${fabricObj.blockId}: (${fabricObj.left}, ${fabricObj.top})`);
    }
  }

  // ========================================================================
  // Event handlers for FabricJS canvas
  // ========================================================================
  
  /**
   * Handle object moving event
   */
  function onObjectMoving(e) {
    const obj = e.target;
    draggedObject = obj;
    
    // Enforce canvas boundaries
    enforceCanvasBoundaries(obj);
    
    // Check for potential snap targets
    checkAndHighlightSnapPossibility(obj);
    
    // Sync with DOM element
    syncBlockPosition(obj);
  }
  
  /**
   * Keep objects within canvas boundaries
   */
  function enforceCanvasBoundaries(obj) {
    if (!obj) return;
    
    const halfWidth = obj.width * obj.scaleX / 2;
    const halfHeight = obj.height * obj.scaleY / 2;
    
    // Adjust for originX/Y
    let leftAdjust = 0, topAdjust = 0;
    if (obj.originX === 'left') leftAdjust = halfWidth;
    if (obj.originY === 'top') topAdjust = halfHeight;
    
    // Calculate boundaries
    const maxLeft = canvas.width - halfWidth;
    const maxTop = canvas.height - halfHeight;
    
    // Enforce boundaries
    if (obj.left < 0) obj.left = 0;
    if (obj.top < 0) obj.top = 0;
    if (obj.left > maxLeft) obj.left = maxLeft;
    if (obj.top > maxTop) obj.top = maxTop;
  }
  
  /**
   * Handle mouse up event
   */
  function onMouseUp(e) {
    if (!draggedObject) return;
    
    const releasedObject = draggedObject;
    const targetObject = potentialSnapTarget;
    const direction = snapDirection;
    
    // Reset state
    draggedObject = null;
    potentialSnapTarget = null;
    snapDirection = null;
    
    // Hide indicator
    hideIndicator();
    
    // If we have a potential snap target, perform the snap
    if (targetObject && direction) {
      performBlockSnap(releasedObject, targetObject, direction);
    }
    
    // Reset highlighting
    resetObjectHighlighting();
    
    // Re-render canvas
    canvas.renderAll();
  }
  
  /**
   * Handle mouse over event
   */
  function onMouseOver(e) {
    if (e.target && e.target.blockId) {
      if (CONFIG.DEBUG > 1) {
        console.log(`Mouse over block: ${e.target.blockId}`);
      }
      // Potentially add hover effects
    }
  }
  
  /**
   * Handle mouse out event
   */
  function onMouseOut(e) {
    if (e.target && e.target.blockId) {
      if (CONFIG.DEBUG > 1) {
        console.log(`Mouse out of block: ${e.target.blockId}`);
      }
      // Potentially remove hover effects
    }
  }

  // ========================================================================
  // Snap detection and highlighting
  // ========================================================================
  
  /**
   * Check if the dragged object can snap to any target
   */
  function checkAndHighlightSnapPossibility(obj) {
    if (!obj) return;
    
    // Reset highlights and indicators
    resetObjectHighlighting();
    hideIndicator();
    
    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1;
    
    // Check each potential target
    canvas.forEachObject(function(target) {
      // Skip self, non-block objects, and objects already connected
      if (target === obj || !target.blockId || target === indicatorObject) return;
      
      // Skip if target already has connections that would conflict
      const targetConnectedLeft = target.connectedFromLeft !== null;
      const targetConnectedRight = target.connectedFromRight !== null;
      
      // Get snap info
      const snapInfo = calculateSnapInfo(obj, target);
      
      if (snapInfo) {
        let connectionAllowed = true;
        if (snapInfo.direction === 'left' && targetConnectedLeft) connectionAllowed = false;
        else if (snapInfo.direction === 'right' && targetConnectedRight) connectionAllowed = false;
        
        if (connectionAllowed && snapInfo.distance < minDistance) {
          minDistance = snapInfo.distance;
          bestTarget = target;
          bestDirection = snapInfo.direction;
        }
      }
    });
    
    // If we found a valid target within threshold
    if (bestTarget && bestDirection) {
      if (CONFIG.DEBUG > 1) {
        console.log(`Highlighting potential snap: ${obj.blockId} -> ${bestTarget.blockId} (${bestDirection})`);
      }
      
      // Store for mouseup event
      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;
      
      // Highlight the target
      highlightSnapTarget(bestTarget, bestDirection);
      
      // Show the future position indicator
      showFuturePositionIndicator(obj, bestTarget, bestDirection);
    }
  }
  
  /**
   * Calculate if and how two blocks can snap together
   */
  function calculateSnapInfo(sourceObj, targetObj) {
    // Calculate vertical overlap
    const sourceTop = sourceObj.top;
    const sourceBottom = sourceObj.top + sourceObj.height * sourceObj.scaleY;
    const targetTop = targetObj.top;
    const targetBottom = targetObj.top + targetObj.height * targetObj.scaleY;
    
    const topOverlap = Math.max(sourceTop, targetTop);
    const bottomOverlap = Math.min(sourceBottom, targetBottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
    
    // Minimum overlap requirement
    const minHeightReq = Math.min(
      sourceObj.height * sourceObj.scaleY,
      targetObj.height * targetObj.scaleY
    ) * CONFIG.VERTICAL_OVERLAP_REQ;
    
    // If not enough vertical overlap, no snap possible
    if (verticalOverlap < minHeightReq || verticalOverlap <= 0) return null;
    
    // Calculate horizontal distances for potential connections
    const sourceLeft = sourceObj.left;
    const sourceRight = sourceObj.left + sourceObj.width * sourceObj.scaleX;
    const targetLeft = targetObj.left;
    const targetRight = targetObj.left + targetObj.width * targetObj.scaleX;
    
    // Calculate distance for both potential directions
    let distance, direction;
    const distRightToLeft = Math.abs(sourceRight - targetLeft);
    const distLeftToRight = Math.abs(sourceLeft - targetRight);
    
    if (distRightToLeft < distLeftToRight) {
      distance = distRightToLeft;
      direction = 'left'; // Source's RIGHT connects to target's LEFT
    } else {
      distance = distLeftToRight;
      direction = 'right'; // Source's LEFT connects to target's RIGHT
    }
    
    // Return snap info if within threshold
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
      if (CONFIG.DEBUG > 1) {
        console.log(`Potential snap: ${direction}, distance: ${distance.toFixed(1)}px`);
      }
      return { direction, distance };
    }
    
    return null;
  }
  
  /**
   * Highlight a potential snap target
   */
  function highlightSnapTarget(target, direction) {
    if (!target) return;
    
    // Create a new highlight effect
    // In FabricJS we can modify the object's appearance directly
    target.set({
      stroke: CONFIG.HIGHLIGHT_COLOR,
      strokeWidth: 3,
      shadow: new fabric.Shadow({
        color: CONFIG.HIGHLIGHT_COLOR,
        blur: 15,
        offsetX: 0,
        offsetY: 0
      })
    });
    
    // Add direction indicator
    // We could add a small line or marker on the appropriate side
    
    // Re-render
    canvas.renderAll();
  }
  
  /**
   * Reset highlighting on all objects
   */
  function resetObjectHighlighting() {
    canvas.forEachObject(function(obj) {
      if (obj.blockId) {
        obj.set({
          stroke: '#333',
          strokeWidth: 1,
          shadow: null
        });
      }
    });
    
    canvas.renderAll();
  }
  
  /**
   * Show the future position indicator
   */
  function showFuturePositionIndicator(sourceObj, targetObj, direction) {
    if (!indicatorObject || !sourceObj || !targetObj) return;
    
    // Calculate the future position
    let futureLeft, futureTop;
    
    if (direction === 'left') {
      // Source RIGHT connects to target LEFT
      futureLeft = targetObj.left - sourceObj.width * sourceObj.scaleX - CONFIG.BLOCK_GAP;
    } else {
      // Source LEFT connects to target RIGHT
      futureLeft = targetObj.left + targetObj.width * targetObj.scaleX + CONFIG.BLOCK_GAP;
    }
    
    // Align tops
    futureTop = targetObj.top;
    
    // Update indicator
    indicatorObject.set({
      left: futureLeft,
      top: futureTop,
      width: sourceObj.width * sourceObj.scaleX,
      height: sourceObj.height * sourceObj.scaleY,
      opacity: 0.7
    });
    
    canvas.bringToFront(indicatorObject);
    canvas.renderAll();
  }
  
  /**
   * Hide the future position indicator
   */
  function hideIndicator() {
    if (indicatorObject) {
      indicatorObject.set({ opacity: 0 });
      canvas.renderAll();
    }
  }

  // ========================================================================
  // Connection and detachment functions
  // ========================================================================
  
  /**
   * Perform the snap connection between two blocks
   */
  function performBlockSnap(sourceObj, targetObj, direction) {
    if (!sourceObj || !targetObj) {
      console.error("Invalid source or target for snap");
      return false;
    }
    
    try {
      // Calculate the final position
      let finalLeft;
      
      if (direction === 'left') {
        // Source RIGHT connects to target LEFT
        finalLeft = targetObj.left - sourceObj.width * sourceObj.scaleX - CONFIG.BLOCK_GAP;
      } else {
        // Source LEFT connects to target RIGHT
        finalLeft = targetObj.left + targetObj.width * targetObj.scaleX + CONFIG.BLOCK_GAP;
      }
      
      // Align tops
      const finalTop = targetObj.top;
      
      // Animate the move to final position
      sourceObj.animate({
        left: finalLeft,
        top: finalTop
      }, {
        duration: 150,
        onChange: canvas.renderAll.bind(canvas),
        onComplete: function() {
          // Update connection metadata
          sourceObj.connectedTo = targetObj.blockId;
          sourceObj.connectionDirection = direction;
          
          if (direction === 'left') {
            targetObj.connectedFromLeft = sourceObj.blockId;
          } else {
            targetObj.connectedFromRight = sourceObj.blockId;
          }
          
          // Update DOM element connections (for backward compatibility)
          updateDOMElementConnections(sourceObj, targetObj, direction);
          
          // Play sound effect
          playSnapSound();
          
          // Reset highlighting
          resetObjectHighlighting();
          
          // Re-render
          canvas.renderAll();
          
          if (CONFIG.DEBUG) {
            console.log(`Connected ${sourceObj.blockId} to ${targetObj.blockId} (${direction})`);
          }
        }
      });
      
      return true;
    } catch (err) {
      console.error("Error during block snap:", err);
      return false;
    }
  }
  
  /**
   * Update DOM element connections
   */
  function updateDOMElementConnections(sourceObj, targetObj, direction) {
    if (!sourceObj.domElement || !targetObj.domElement) return;
    
    // Update source attributes
    sourceObj.domElement.setAttribute('data-connected-to', targetObj.blockId);
    sourceObj.domElement.setAttribute('data-connection-direction', direction);
    sourceObj.domElement.classList.add('connected-block');
    
    // Update target attributes
    const attrName = direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
    targetObj.domElement.setAttribute(attrName, sourceObj.blockId);
    targetObj.domElement.classList.add('has-connected-block');
  }
  
  /**
   * Detach a block from its connections
   */
  function detachBlock(obj, animate = true) {
    if (!obj || !obj.connectedTo) return;
    
    const targetId = obj.connectedTo;
    const direction = obj.connectionDirection;
    
    // Reset connection properties
    obj.connectedTo = null;
    obj.connectionDirection = null;
    
    // Find the target object
    const targetObj = blockObjects[targetId];
    
    if (targetObj) {
      if (direction === 'left') {
        targetObj.connectedFromLeft = null;
      } else {
        targetObj.connectedFromRight = null;
      }
      
      // Update target DOM element
      if (targetObj.domElement) {
        const attrName = direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
        targetObj.domElement.removeAttribute(attrName);
        
        const hasConnections = targetObj.connectedFromLeft || 
                              targetObj.connectedFromRight || 
                              targetObj.connectedTo;
        
        if (!hasConnections) {
          targetObj.domElement.classList.remove('has-connected-block');
        }
      }
    }
    
    // Update source DOM element
    if (obj.domElement) {
      obj.domElement.removeAttribute('data-connected-to');
      obj.domElement.removeAttribute('data-connection-direction');
      obj.domElement.classList.remove('connected-block');
    }
    
    // Add detach animation effect
    if (animate) {
      // A simple wiggle animation
      const originalLeft = obj.left;
      const originalTop = obj.top;
      
      obj.animate('left', originalLeft + 3, {
        duration: 100,
        onChange: canvas.renderAll.bind(canvas),
        onComplete: function() {
          obj.animate('left', originalLeft - 2, {
            duration: 100,
            onChange: canvas.renderAll.bind(canvas),
            onComplete: function() {
              obj.animate('left', originalLeft, {
                duration: 100,
                onChange: canvas.renderAll.bind(canvas)
              });
            }
          });
        }
      });
    }
    
    if (CONFIG.DEBUG) {
      console.log(`Detached ${obj.blockId} from ${targetId}`);
    }
    
    // Re-render canvas
    canvas.renderAll();
  }
  
  /**
   * Show a detach context menu
   */
  function showDetachMenu(x, y, obj) {
    // Create a DOM menu for detaching
    // This would be a simple context menu that appears on right-click
    const menuId = 'fabric-detach-menu';
    let menu = document.getElementById(menuId);
    
    // Remove existing menu if any
    if (menu) menu.remove();
    
    // Create new menu
    menu = document.createElement('div');
    menu.id = menuId;
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 3px 8px rgba(0,0,0,0.2)';
    menu.style.zIndex = '1100';
    menu.style.padding = '5px';
    menu.style.fontSize = '14px';
    menu.style.minWidth = '100px';
    
    // Add detach option
    const option = document.createElement('div');
    option.textContent = 'Detach Block';
    option.style.padding = '6px 12px';
    option.style.cursor = 'pointer';
    option.style.borderRadius = '3px';
    
    option.addEventListener('mouseover', function() {
      this.style.backgroundColor = '#eee';
    });
    
    option.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'transparent';
    });
    
    option.addEventListener('click', function(event) {
      event.stopPropagation();
      detachBlock(obj, true);
      menu.remove();
    });
    
    menu.appendChild(option);
    document.body.appendChild(menu);
    
    // Handle outside clicks to close menu
    setTimeout(function() {
      document.addEventListener('click', function closeMenu(event) {
        if (!menu.contains(event.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 0);
  }

  // ========================================================================
  // Audio handling
  // ========================================================================
  
  /**
   * Initialize audio for snap sound
   */
  function initAudio() {
    if (!CONFIG.PLAY_SOUND || soundInitialized) return;
    
    try {
      // Check for existing audio element
      const existingSound = document.getElementById('snap-sound-element');
      if (existingSound) {
        snapSound = existingSound;
        soundInitialized = true;
        
        // Ensure correct source
        if (!existingSound.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)) {
          existingSound.innerHTML = '';
          const source = document.createElement('source');
          source.src = CONFIG.SOUND_PATH;
          source.type = 'audio/mpeg';
          existingSound.appendChild(source);
          existingSound.load();
        }
        
        if (CONFIG.DEBUG) {
          console.log('Audio reused.');
        }
        return;
      }
      
      // Create new audio element
      snapSound = document.createElement('audio');
      snapSound.id = 'snap-sound-element';
      snapSound.preload = 'auto';
      snapSound.volume = CONFIG.SOUND_VOLUME;
      
      const source = document.createElement('source');
      source.src = CONFIG.SOUND_PATH;
      source.type = 'audio/mpeg';
      snapSound.appendChild(source);
      
      // Error handling
      snapSound.addEventListener('error', function(e) {
        console.error(`Audio Error: ${CONFIG.SOUND_PATH}`, e);
        CONFIG.PLAY_SOUND = false;
        snapSound = null;
        soundInitialized = false;
      });
      
      // Ready handling
      snapSound.addEventListener('canplaythrough', function() {
        soundInitialized = true;
        if (CONFIG.DEBUG) {
          console.log('Audio ready.');
        }
      });
      
      snapSound.style.display = 'none';
      document.body.appendChild(snapSound);
      
      if (CONFIG.DEBUG) {
        console.log(`Audio created: ${CONFIG.SOUND_PATH}`);
      }
    } catch (err) {
      console.error('Audio init error:', err);
      CONFIG.PLAY_SOUND = false;
      snapSound = null;
      soundInitialized = false;
    }
  }
  
  /**
   * Play the snap sound
   */
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) return;
    
    try {
      // Check if audio is ready
      if (snapSound.readyState < 3) {
        if (CONFIG.DEBUG) {
          console.log('Snap sound skip: audio not ready.');
        }
        return;
      }
      
      // Reset and play
      snapSound.pause();
      snapSound.currentTime = 0;
      
      const playPromise = snapSound.play();
      
      if (playPromise !== undefined) {
        playPromise.then(function() {
          audioContextAllowed = true;
          if (CONFIG.DEBUG > 1) {
            console.log('Snap sound played.');
          }
        }).catch(function(err) {
          if (err.name === 'NotAllowedError') {
            console.warn('Snap sound blocked.');
            audioContextAllowed = false;
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
  // DOM-to-Canvas Conversion
  // ========================================================================
  
  /**
   * Convert all existing blocks to FabricJS objects
   */
  function convertExistingBlocks() {
    const blocks = document.querySelectorAll('#program-blocks .block-container');
    
    if (blocks.length === 0) {
      if (CONFIG.DEBUG) {
        console.log("No existing blocks found to convert");
      }
      return;
    }
    
    blocks.forEach(function(block) {
      if (!block.id) generateUniqueId(block);
      createFabricObjectFromBlock(block);
    });
    
    // Reconnect blocks that were already connected
    reconnectExistingBlocks();
    
    if (CONFIG.DEBUG) {
      console.log(`Converted ${blocks.length} existing blocks to FabricJS objects`);
    }
  }
  
  /**
   * Reconnect blocks that were already connected in the DOM
   */
  function reconnectExistingBlocks() {
    // For each block that has connections
    Object.values(blockObjects).forEach(function(obj) {
      if (!obj.domElement) return;
      
      // Check if this block is connected to another
      const connectedToId = obj.domElement.getAttribute('data-connected-to');
      if (connectedToId) {
        const targetObj = blockObjects[connectedToId];
        if (targetObj) {
          const direction = obj.domElement.getAttribute('data-connection-direction');
          
          // Update FabricJS object properties
          obj.connectedTo = connectedToId;
          obj.connectionDirection = direction;
          
          if (direction === 'left') {
            targetObj.connectedFromLeft = obj.blockId;
          } else {
            targetObj.connectedFromRight = obj.blockId;
          }
          
          if (CONFIG.DEBUG) {
            console.log(`Reconnected existing connection: ${obj.blockId} -> ${targetObj.blockId} (${direction})`);
          }
        }
      }
    });
  }
  
  /**
   * Generate a unique ID for a block
   */
  function generateUniqueId(block) {
    if (block.id) return block.id;
    
    const prefix = block.dataset.type || 'block';
    const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
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
      console.log(`Generated unique ID: ${id}`);
    }
    
    return id;
  }
  
  /**
   * Watch for new blocks added to the DOM
   */
  function observeNewBlocks() {
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;
    
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              let block = node.classList?.contains('block-container') ? 
                          node : 
                          node.querySelector?.('.block-container');
                          
              if (block && block.closest('#program-blocks')) {
                if (!block.id) generateUniqueId(block);
                createFabricObjectFromBlock(block);
              }
            }
          });
        }
      });
    });
    
    observer.observe(programArea, {
      childList: true,
      subtree: true
    });
    
    if (CONFIG.DEBUG) {
      console.log("MutationObserver watching for new blocks");
    }
  }

  // ========================================================================
  // Utility functions
  // ========================================================================
  
  /**
   * Simple debounce function
   */
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }
  
  /**
   * Add styles for any remaining DOM elements we need
   */
  function addStyles() {
    if (document.getElementById('fabric-blocks-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'fabric-blocks-styles';
    style.textContent = `
      #fabric-detach-menu {
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
      
      #fabric-detach-menu div {
        padding: 6px 12px;
        cursor: pointer;
        border-radius: 3px;
      }
      
      #fabric-detach-menu div:hover {
        background-color: #eee;
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
    
    if (CONFIG.DEBUG) {
      console.log('Added required styles for FabricJS block linkage');
    }
  }
  
  /**
   * Check for FabricJS and load it if needed
   */
  function ensureFabricJSLoaded() {
    return new Promise((resolve, reject) => {
      // Check if fabric is already loaded
      if (window.fabric) {
        if (CONFIG.DEBUG) {
          console.log('FabricJS already loaded');
        }
        resolve(true);
        return;
      }
      
      // Create script element for FabricJS
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
      script.integrity = 'sha512-CeIsOAsgJnmevfCi2C7Zsyy6bQKi43utIcYW3PsbhwID4anCGWxhYYOqxK7Q+HkyllDtGrN/GZ/uXWkLaZ0xA==';
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      
      script.onload = function() {
        if (CONFIG.DEBUG) {
          console.log('FabricJS loaded successfully');
        }
        resolve(true);
      };
      
      script.onerror = function() {
        console.error('Failed to load FabricJS');
        reject(new Error('Failed to load FabricJS library'));
      };
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Main initialization function
   */
  async function initializeSystem() {
    const initFlag = 'fabricBlockLinkageInitialized';
    
    // Prevent duplicate initialization
    if (window[initFlag]) {
      if (CONFIG.DEBUG) {
        console.log("FabricJS block linkage already initialized. Skipping.");
      }
      return;
    }
    
    try {
      // Load FabricJS if needed
      await ensureFabricJSLoaded();
      
      // Add required styles
      addStyles();
      
      // Setup canvas
      if (!setupCanvas()) {
        console.error("Failed to setup canvas, aborting initialization");
        return;
      }
      
      // Initialize audio
      initAudio();
      
      // Convert existing blocks
      convertExistingBlocks();
      
      // Watch for new blocks
      observeNewBlocks();
      
      // Mark as initialized
      window[initFlag] = true;
      
      console.log(`FabricJS Block Linkage System initialized (Version 1.0, Threshold=${CONFIG.CONNECT_THRESHOLD}px)`);
      console.log(`Configuration: Canvas=${CONFIG.CANVAS_ID}, Snap Threshold=${CONFIG.CONNECT_THRESHOLD}px, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
      
    } catch (error) {
      console.error("Failed to initialize FabricJS Block Linkage System:", error);
    }
  }
  
  // Initialize system when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem();
  }

})(); // End of IIFE

// --- END OF FILE blocksLinkage_fabricJS.js ---
