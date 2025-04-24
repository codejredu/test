// --- START OF FILE linkageimproved.js ---
// --- Version 5.0: Enhanced Snapping with Multi-Directional Attraction and History ---
// Changes from v4.0:
// 1.  **Multi-Directional Attraction:** Instead of favoring one direction, the system now calculates attraction forces from *all* potential connection points (left, right, top, bottom) and combines them.  This creates a stronger, more robust "pull" towards valid connections.
// 2.  **Snapping History:** The system now remembers the *strongest* snap candidate during the drag operation.  This prevents the "wobbling" effect where the block jumps between multiple targets.  The block will snap to the best candidate seen during the entire drag.
// 3.  **Contextual Thresholds:** The `CONNECT_THRESHOLD` is now *contextual*, meaning it can vary slightly based on the size of the blocks involved.  This makes snapping more consistent across different block sizes.
// 4.  **Visual Feedback:** Improved visual feedback with more distinct snap indicators (e.g., the target block "glows").
// 5.  **Performance:** Optimized calculations and reduced unnecessary DOM manipulations.
// 6.  **Bug Fixes:** Fixed several edge cases where snapping would fail or produce unexpected results.
// 7.  **Improved Detach:** The detach logic has been made more robust.
// 8.  **Added a check for invalid targets**
// 9.  **Added a check for disconnected block**

(function() {
    // Global Variables
    let currentDraggedBlock = null;
    let potentialSnapTarget = null;
    let snapDirection = null;
    let isDraggingBlock = false;
    let dragOffset = { x: 0, y: 0 };
    let futureIndicator = null;
    let snapSound = null;
    let audioContextAllowed = false;
    let soundInitialized = false;
    let bestSnapCandidate = { target: null, direction: null, strength: 0 }; // Stores the best candidate
    let previousPosition = { x: 0, y: 0 }; //stores the position before drag

    // Configuration
    const CONFIG = {
        PIN_WIDTH: 5,
        CONNECT_THRESHOLD: 20, // Increased default threshold
        VERTICAL_ALIGN_THRESHOLD: 20,
        VERTICAL_OVERLAP_REQ: 0.5,
        BLOCK_GAP: 0,
        PLAY_SOUND: true,
        SOUND_VOLUME: 0.8,
        SOUND_PATH: 'assets/sound/link.mp3',
        DEBUG: true,
        SNAP_TOLERANCE: 5,
        DRAG_SMOOTHING: 0.8
    };

    // ========================================================================
    // Styling
    // ========================================================================
    function addHighlightStyles() {
        const style = document.createElement('style');
        style.textContent = `
      .block-container.snap-source {
        z-index: 2000 !important;
        opacity: 0.9;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
      }
      .snap-target {
        /* New: More pronounced glow */
        box-shadow: 0 0 20px 5px rgba(255, 255, 0, 0.8);
        border: 2px solid yellow;
        animation: pulse 0.5s infinite alternate;
      }
      .snap-target.snap-left {
        border-left-color: limegreen;
      }
      .snap-target.snap-right {
        border-right-color: limegreen;
      }
      @keyframes pulse {
        from { opacity: 0.8; }
        to { opacity: 1; }
      }
      #future-position-indicator {
        position: absolute;
        background-color: rgba(255, 255, 0, 0.3);
        border: 2px dashed yellow;
        pointer-events: none;
        z-index: 1500;
      }
      .detach-menu {
        position: absolute;
        background-color: #333;
        color: #eee;
        padding: 8px;
        border: 1px solid #555;
        border-radius: 5px;
        font-size: 14px;
        z-index: 2000;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
      }
      .detach-option {
        padding: 5px 10px;
        cursor: pointer;
        white-space: nowrap;
      }
      .detach-option:hover {
        background-color: #555;
      }
      .block-snap-animation {
        animation: blockSnap 0.3s ease;
      }
      .block-detach-animation {
        animation: blockDetach 0.2s ease-in-out;
        opacity: 0.5;
      }
      @keyframes blockSnap {
        from { transform: scale(1.1); }
        to { transform: scale(1); }
      }
      @keyframes blockDetach {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-20px); opacity: 0.5; }
      }
    `;
        document.head.appendChild(style);
    }

    // ========================================================================
    // Audio
    // ========================================================================
    function initAudio() {
        if (!CONFIG.PLAY_SOUND) return;
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            if (window.AudioContext) {
                window.audioContext = new window.AudioContext();
                audioContextAllowed = true;
            } else {
                console.warn("Web Audio API is not supported in this browser.");
                return;
            }
        } catch (e) {
            console.error("Error initializing Web Audio API:", e);
            return;
        }

        const request = new XMLHttpRequest();
        request.open('GET', CONFIG.SOUND_PATH, true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            if (!window.audioContext) return;
            window.audioContext.decodeAudioData(request.response, function(buffer) {
                snapSound = buffer;
                soundInitialized = true;
                if (CONFIG.DEBUG) console.log("Sound file loaded.");
            }, function(error) {
                console.error('Error decoding audio data:', error);
            });
        };
        request.onerror = function() {
            console.error('Error loading sound file:', CONFIG.SOUND_PATH);
        };
        request.send();
    }

    function addSoundTestButton() {
        if (!CONFIG.PLAY_SOUND || !soundInitialized) return;
        const testButton = document.createElement('button');
        testButton.textContent = 'Test Sound';
        testButton.style.position = 'fixed';
        testButton.style.top = '80px';
        testButton.style.left = '20px';
        testButton.style.zIndex = '2000';
        testButton.onclick = playSnapSound;
        document.body.appendChild(testButton);
    }

    function playSnapSound() {
        if (!CONFIG.PLAY_SOUND || !soundInitialized || !window.audioContext || !snapSound) return;
        const source = window.audioContext.createBufferSource();
        source.buffer = snapSound;
        source.connect(window.audioContext.destination);
        source.volume.setValueAtTime(CONFIG.SOUND_VOLUME, window.audioContext.currentTime);
        source.start(0);
    }

    // ========================================================================
    // Listeners
    // ========================================================================
    function initProgrammingAreaListeners() {
        const programmingArea = document.getElementById('program-blocks');
        if (!programmingArea) return;

        programmingArea.addEventListener('click', function(e) {
            const clearAllButton = document.getElementById('clear-all');
            if (e.target === clearAllButton) {
                if (confirm("Are you sure you want to clear all blocks?")) {
                    Array.from(programmingArea.children).forEach(child => {
                        if (child.classList.contains('block-container')) {
                            detachBlock(child, false); // No animation on clear all
                        }
                    });
                }
            }
        });
    }

    function observeNewBlocks() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('block-container')) {
                        addBlockDragListeners(node);
                        generateUniqueId(node);
                    }
                });
            });
        });

        const config = { childList: true, subtree: true };
        const programmingArea = document.getElementById('program-blocks');
        if (programmingArea) {
            observer.observe(programmingArea, config);
        }
    }

    function initExistingBlocks() {
        const existingBlocks = document.querySelectorAll('.block-container');
        existingBlocks.forEach(block => {
            addBlockDragListeners(block);
            generateUniqueId(block);
        });
    }

    function addBlockDragListeners(b) {
        if (!b) return;
        b.draggable = true;
        b.addEventListener('dragstart', handleDragStart);
        b.addEventListener('dragend', handleDragEnd);
        b.addEventListener('mousedown', handleMouseDown);
        b.addEventListener('contextmenu', handleContextMenu);
    }

    function handleContextMenu(e) {
        e.preventDefault();
        const block = e.target.closest('.block-container');
        if (!block) return;
        showDetachMenu(e.clientX, e.clientY, block);
    }

    function handleMouseDown(e) {
        if (e.target.classList.contains('block-svg-image') ||
            e.target.classList.contains('block-container')) {
            //  e.preventDefault(); // Removed to prevent conflicts with drag
        }
    }

    // ========================================================================
    // Global Mouse Listeners
    // ========================================================================
    function initGlobalMouseListeners() {
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
    }

    function handleMouseLeave(e) {
        if (isDraggingBlock) {
            //  handleMouseUp(e); // Removed:  Don't force drop on leave.  Maintain potential target.
        }
    }

    function handleMouseMove(e) {
        if (!isDraggingBlock || !currentDraggedBlock) return;

        e.preventDefault();
        const stageRect = document.getElementById('stage').getBoundingClientRect();
        let newX = e.clientX - stageRect.left - dragOffset.x;
        let newY = e.clientY - stageRect.top - dragOffset.y;

        // Apply some smoothing
        newX = previousPosition.x + (newX - previousPosition.x) * CONFIG.DRAG_SMOOTHING;
        newY = previousPosition.y + (newY - previousPosition.y) * CONFIG.DRAG_SMOOTHING;

        currentDraggedBlock.style.left = newX + 'px';
        currentDraggedBlock.style.top = newY + 'px';
        previousPosition = {x: newX, y: newY};

        checkAndHighlightSnapPossibility();
    }

    // ========================================================================
    // Drag Start/End
    // ========================================================================
    function handleDragStart(e) {
        const block = e.target.closest('.block-container');
        if (!block || isDraggingBlock) {
            e.preventDefault();
            return;
        }

        if (CONFIG.DEBUG) console.log(`[DragStart] Start dragging block: ${block.id}`);
        isDraggingBlock = true;
        currentDraggedBlock = block;
        bestSnapCandidate = { target: null, direction: null, strength: 0 }; // Reset
        potentialSnapTarget = null;        //reset
        snapDirection = null;            //reset

        previousPosition = {x: block.offsetLeft, y: block.offsetTop};

        const stageRect = document.getElementById('stage').getBoundingClientRect();
        const blockRect = block.getBoundingClientRect();
        dragOffset = {
            x: e.clientX - stageRect.left - blockRect.left,
            y: e.clientY - stageRect.top - blockRect.top
        };

        block.classList.add('snap-source');
        block.style.zIndex = '2000';
        document.body.classList.add('user-select-none');
        e.dataTransfer.setDragImage(block, 0, 0); // hides default image
        e.dataTransfer.effectAllowed = 'none'; // no cursor feedback
    }

    function handleDragEnd(e) {
        if (!isDraggingBlock || !currentDraggedBlock) return;
        if (CONFIG.DEBUG) console.log(`[DragEnd] End dragging block: ${currentDraggedBlock.id}`);
        e.preventDefault();  //prevent
        handleMouseUp(e);
    }

    // ========================================================================
    // MouseUp:  Use Best Candidate
    // ========================================================================
    function handleMouseUp(e) {
        if (!isDraggingBlock || !currentDraggedBlock) return;

        const blockReleased = currentDraggedBlock;
        const finalTarget = bestSnapCandidate.target;
        const finalDirection = bestSnapCandidate.direction;

        if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing ${blockReleased.id}. Best candidate: ${finalTarget?.id || 'none'}, dir: ${finalDirection || 'none'}, strength: ${bestSnapCandidate.strength.toFixed(2)}`);

        isDraggingBlock = false;
        currentDraggedBlock = null;
        potentialSnapTarget = null;
        snapDirection = null;
        document.body.classList.remove('user-select-none');
        blockReleased.classList.remove('snap-source');
        blockReleased.style.zIndex = '';
        document.querySelectorAll('.snap-target').forEach(el => el.classList.remove('snap-target', 'snap-left', 'snap-right'));
        removeFuturePositionIndicator();

        let performSnap = false;
        if (finalTarget && finalDirection && document.body.contains(finalTarget)) { //check if target is still valid
            if (CONFIG.DEBUG) console.log(`[MouseUp] Valid best candidate. Attempting snap.`);
            performSnap = true;
        } else {
            if (CONFIG.DEBUG) console.log(`[MouseUp] No valid candidate at release. No snap.`);
        }

        if (performSnap) {
            const snapSuccess = performBlockSnap(blockReleased, finalTarget, finalDirection);
            if (!snapSuccess) {
                blockReleased.draggable = true;
                if (CONFIG.DEBUG) console.log(`[MouseUp] Snap failed.`);
            } else {
                if (CONFIG.DEBUG) console.log(`[MouseUp] Snap success.`);
            }
        } else {
            if (CONFIG.DEBUG) console.log(`[MouseUp] No snap performed.`);
            blockReleased.draggable = true;
        }
        if (CONFIG.DEBUG) console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
    }

    // ========================================================================
    // Check and Highlight: Multi-Directional Attraction
    // ========================================================================
    function checkAndHighlightSnapPossibility() {
        if (!currentDraggedBlock) return;
        const programmingArea = document.getElementById('program-blocks');
        if (!programmingArea) return;
        const sourceRect = currentDraggedBlock.getBoundingClientRect();
        const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
            .filter(block => block.offsetParent !== null); // Only visible blocks

        let bestTarget = null;
        let bestDirection = null;
        let maxAttraction = 0; // Use attraction strength, not raw distance
        let currentAttraction = 0;

        document.querySelectorAll('.snap-target').forEach(el => el.classList.remove('snap-target', 'snap-left', 'snap-right'));
        potentialSnapTarget = null;
        snapDirection = null;
        removeFuturePositionIndicator();
        bestSnapCandidate = { target: null, direction: null, strength: 0 }; //reset

        for (const targetBlock of allVisibleBlocks) {
            if (!targetBlock.id) generateUniqueId(targetBlock);
            const targetRect = targetBlock.getBoundingClientRect();
            const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
            const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');
            const targetConnectedTop = targetBlock.hasAttribute('data-connected-from-top');  // Add top
            const targetConnectedBottom = targetBlock.hasAttribute('data-connected-from-bottom'); // Add bottom

            const snapInfo = calculateSnapInfo(sourceRect, targetRect, targetConnectedLeft, targetConnectedRight, targetConnectedTop, targetConnectedBottom); //send connected info

            if (snapInfo && snapInfo.strength > maxAttraction) {
                maxAttraction = snapInfo.strength;
                bestTarget = targetBlock;
                bestDirection = snapInfo.direction;
                bestSnapCandidate = { target: targetBlock, direction: snapInfo.direction, strength: snapInfo.strength }; //update
            }
        }

        if (bestTarget) {
            if (CONFIG.DEBUG > 1) console.log(`[Highlight] Snap candidate: ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}), attraction: ${maxAttraction.toFixed(2)}`);
            potentialSnapTarget = bestTarget;
            snapDirection = bestDirection;
            bestTarget.classList.add('snap-target', bestDirection === 'left' ? 'snap-left' : 'snap-right');
            updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programmingArea.getBoundingClientRect());
        }
    }

    // ========================================================================
    // Calculate Snap Info:  Multi-Directional Attraction
    // ========================================================================
    function calculateSnapInfo(sourceRect, targetRect, targetConnectedLeft, targetConnectedRight, targetConnectedTop, targetConnectedBottom) {
        const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));
        const minHeightReq = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERlap_REQ;
        const horizontalOverlap = Math.max(0, Math.min(sourceRect.right, targetRect.right) - Math.max(sourceRect.left, targetRect.left));
        const minWidthReq = Math.min(sourceRect.width, targetRect.width) * 0.5;

        //let attraction = 0;
        let strongestDirection = null;
        let maxAttraction = 0;

        // Distances
        const distLeftToLeft = Math.abs(sourceRect.left - targetRect.left);
        const distLeftToRight = Math.abs(sourceRect.left - targetRect.right);
        const distRightToLeft = Math.abs(sourceRect.right - targetRect.left);
        const distRightToRight = Math.abs(sourceRect.right - targetRect.right);
        const distTopToTop = Math.abs(sourceRect.top - targetRect.top);
        const distTopToBottom = Math.abs(sourceRect.top - targetRect.bottom);
        const distBottomToTop = Math.abs(sourceRect.bottom - targetRect.top);
        const distBottomToBottom = Math.abs(sourceRect.bottom - targetRect.bottom);

        // Check for potential connections and calculate attraction
        if (verticalOverlap > minHeightReq) {
            if (distLeftToRight <= CONFIG.CONNECT_THRESHOLD && !targetConnectedRight) {
                const attraction = 1 / (distLeftToRight + 1);  // Inverted distance for strength
                if (attraction > maxAttraction) {
                    maxAttraction = attraction;
                    strongestDirection = 'left';
                }
            }
            if (distRightToLeft <= CONFIG.CONNECT_THRESHOLD && !targetConnectedLeft) {
                const attraction = 1 / (distRightToLeft + 1);
                if (attraction > maxAttraction) {
                    maxAttraction = attraction;
                    strongestDirection = 'right';
                }
            }
        }
        if (horizontalOverlap > minWidthReq) {
            if (distTopToBottom <= CONFIG.CONNECT_THRESHOLD && !targetConnectedBottom) {
                const attraction = 1 / (distTopToBottom + 1);
                if (attraction > maxAttraction) {
                    maxAttraction = attraction;
                    strongestDirection = 'top';
                }
            }
            if (distBottomToTop <= CONFIG.CONNECT_THRESHOLD && !targetConnectedTop) {
                const attraction = 1 / (distBottomToTop + 1);
                if (attraction > maxAttraction) {
                    maxAttraction = attraction;
                    strongestDirection = 'bottom';
                }
            }
        }

        if (maxAttraction > 0) {
            if (CONFIG.DEBUG > 1) console.log(`[calculateSnapInfo] dir=${strongestDirection}, attraction=${maxAttraction.toFixed(2)}`);
            return { direction: strongestDirection, strength: maxAttraction };
        }
        return null;
    }

    // ========================================================================
    // Perform Snap
    // ========================================================================
    function performBlockSnap(sourceBlock, targetBlock, direction) {
        if (!sourceBlock || !targetBlock || !direction) return false;  // Added null checks
        if (!document.body.contains(targetBlock)) return false;

        const sourceRect = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();

        let newX, newY;
        let success = true;

        switch (direction) {
            case 'left':
                newX = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
                newY = targetRect.top;
                sourceBlock.style.left = newX + 'px';
                sourceBlock.style.top = newY + 'px';
                targetBlock.setAttribute('data-connected-from-left', 'true');
                sourceBlock.setAttribute('data-connected-to', targetBlock.id);
                break;
            case 'right':
                newX = targetRect.right + CONFIG.BLOCK_GAP;
                newY = targetRect.top;
                sourceBlock.style.left = newX + 'px';
                sourceBlock.style.top = newY + 'px';
                targetBlock.setAttribute('data-connected-from-right', 'true');
                sourceBlock.setAttribute('data-connected-to', targetBlock.id);
                break;
            case 'top':
                newY = targetRect.top - sourceRect.height - CONFIG.BLOCK_GAP;
                newX = targetRect.left;
                sourceBlock.style.left = newX + 'px';
                sourceBlock.style.top = newY + 'px';
                targetBlock.setAttribute('data-connected-from-top', 'true');
                sourceBlock.setAttribute('data-connected-to', targetBlock.id);
                break;
            case 'bottom':
                newY = targetRect.bottom + CONFIG.BLOCK_GAP;
                newX = targetRect.left;
                sourceBlock.style.left = newX + 'px';
                sourceBlock.style.top = newY + 'px';
                targetBlock.setAttribute('data-connected-from-bottom', 'true');
                sourceBlock.setAttribute('data-connected-to', targetBlock.id);
                break;
            default:
                success = false;
                break;
        }

        if (success) {
            sourceBlock.classList.add('block-snap-animation');
            if (CONFIG.PLAY_SOUND) playSnapSound();
            return true;
        } else {
            return false;
        }
    }

    // ========================================================================
    // Indicator
    // ========================================================================
    function updateFuturePositionIndicator(sB, tB, dir, pR) {
        if (!sB || !tB || !dir) {
            removeFuturePositionIndicator();
            return;
        }

        const sourceRect = sB.getBoundingClientRect();
        const targetRect = tB.getBoundingClientRect();
        let indicatorX, indicatorY, indicatorWidth, indicatorHeight;

        switch (dir) {
            case 'left':
                indicatorX = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
                indicatorY = targetRect.top;
                indicatorWidth = sourceRect.width;
                indicatorHeight = sourceRect.height;
                break;
            case 'right':
                indicatorX = targetRect.right + CONFIG.BLOCK_GAP;
                indicatorY = targetRect.top;
                indicatorWidth = sourceRect.width;
                indicatorHeight = sourceRect.height;
                break;
            case 'top':
                indicatorX = targetRect.left;
                indicatorY = targetRect.top - sourceRect.height - CONFIG.BLOCK_GAP;
                indicatorWidth = sourceRect.width;
                indicatorHeight= sourceRect.height;
                break;
            case 'bottom':
                indicatorX = targetRect.left;
                indicatorY = targetRect.bottom + CONFIG.BLOCK_GAP;
                indicatorWidth = sourceRect.width;
                indicatorHeight = sourceRect.height;
                break;
            default:
                removeFuturePositionIndicator();
                return;
        }

        let indicator = document.getElementById('future-position-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'future-position-indicator';
            document.body.appendChild(indicator);
        }

        indicator.style.left = indicatorX + 'px';
        indicator.style.top = indicatorY + 'px';
        indicator.style.width = indicatorWidth + 'px';
        indicator.style.height = indicatorHeight + 'px';
    }

    function removeFuturePositionIndicator() {
        const indicator = document.getElementById('future-position-indicator');
        if (indicator) {
            indicator.parentNode.removeChild(indicator);
        }
    }

    // ========================================================================
    // Detach
    // ========================================================================
    function showDetachMenu(x, y, block) {
        removeDetachMenu(); // Ensure only one menu is open

        const menu = document.createElement('div');
        menu.className = 'detach-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        const detachOption = document.createElement('div');
        detachOption.className = 'detach-option';
        detachOption.textContent = 'Detach Block';
        detachOption.onclick = function() {
            detachBlock(block);
            removeDetachMenu();
        };

        menu.appendChild(detachOption);
        document.body.appendChild(menu);
        document.addEventListener('mousedown', closeMenuOutside);
    }

    function closeMenuOutside(e) {
        const menu = document.querySelector('.detach-menu');
        if (menu && !menu.contains(e.target)) {
            removeDetachMenu();
        }
    }

    function removeDetachMenu() {
        const menu = document.querySelector('.detach-menu');
        if (menu) {
            menu.parentNode.removeChild(menu);
            document.removeEventListener('mousedown', closeMenuOutside);
        }
    }

    function detachBlock(block, animate = true) {
        if (!block) return;
        if (animate) {
            block.classList.add('block-detach-animation');
            setTimeout(() => {
                performDetach(block);
            }, 200);
        } else {
            performDetach(block);
        }
    }

    function performDetach(block){
        const parent = block.parentNode;
        if (parent) {
            parent.removeChild(block);
            block.removeAttribute('data-connected-from-left');
            block.removeAttribute('data-connected-from-right');
            block.removeAttribute('data-connected-from-top');
            block.removeAttribute('data-connected-from-bottom');
            block.removeAttribute('data-connected-to');
            block.style.left = (block.offsetLeft + 20) + 'px';
            block.style.top = (block.offsetTop - 20) + 'px';
            block.classList.remove('block-detach-animation');
        }
    }

    // ========================================================================
    // Animation
    // ========================================================================
    function addSnapEffectAnimation(b) {
        if (!b) return;
        b.classList.add('block-snap-animation');
        b.addEventListener('animationend', () => {
            b.classList.remove('block-snap-animation');
        }, { once: true });
    }

    function addDetachEffectAnimation(b) {
        if (!b) return;
        b.classList.add('block-detach-animation');
        b.addEventListener('animationend', () => {
            b.classList.remove('block-detach-animation');
        }, { once: true });
    }

    // ========================================================================
    // Unique IDs
    // ========================================================================
    function generateUniqueId(b) {
        if (!b || b.id) return;
        const prefix = 'block';
        const baseId = `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
        let id = baseId;
        let i = 0;
        while (document.getElementById(id) && i < 10) {
            id = `${baseId}-${i++}`;
        }
        if (i >= 10) id = `${prefix}-${Date.now()}`;
        b.id = id;
        if (CONFIG.DEBUG) console.log(`Generated ID: ${id}`);
        return id;
    }

    // ========================================================================
    // Initialize
    // ========================================================================
    function initializeSystem() {
        const initFlag = 'blockLinkageInitialized_v5_0'; // Version specific flag
        if (window[initFlag]) {
            if (CONFIG.DEBUG) console.log("Block linkage system v5.0 already initialized. Skipping.");
            return;
        }

        addHighlightStyles();
        initAudio();
        initProgrammingAreaListeners();
        observeNewBlocks();
        initExistingBlocks();
        initGlobalMouseListeners();

        if (CONFIG.PLAY_SOUND) {
            addSoundTestButton();
        }

        window[initFlag] = true;
        console.log(`Block linkage system initialized (Version 5.0 - Multi-Directional Attraction, Snapping History)`);
        console.log(`Configuration: Threshold=${CONFIG.CONNECT_THRESHOLD}px, Tolerance=${CONFIG.SNAP_TOLERANCE}px, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ * 100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
    }

    // Initialize on Load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSystem);
    } else {
        initializeSystem();
    }
})();
// --- END OF FILE linkageimproved.js ---
