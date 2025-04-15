/**
 * linkage-improved.js - Enhanced block connection and drag-and-drop functionality for ScratchJr
 * 
 * This file provides:
 * 1. Smooth dragging without ghost images from palette to programming area
 * 2. Smooth dragging within the programming area
 * 3. Blue highlight effect when blocks are close to connecting
 * 4. Automatic snapping when a block's pin meets another block's socket
 */

document.addEventListener('DOMContentLoaded', () => {
    // Constants for connection detection and highlighting
    const HIGHLIGHT_COLOR = '#0D6EFD';
    const CONNECTION_THRESHOLD = 20; // Distance in pixels for potential connection detection
    const SNAP_THRESHOLD = 10; // Distance in pixels for automatic snapping

    // Track dragged elements and their states
    let draggedBlock = null;
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let originalPosition = { x: 0, y: 0 };
    let potentialConnections = []; // Tracks blocks that could be connected to during a drag
    
    // Reference DOM elements
    const blockPalette = document.getElementById('block-palette');
    const programmingArea = document.getElementById('program-blocks');
    
    // Check required elements exist
    if (!blockPalette || !programmingArea) {
        console.error('Required elements not found. Linkage functionality disabled.');
        return;
    }
    
    // ========================================================================
    // Helper Functions
    // ========================================================================
    
    /**
     * Get the connection points for a block (where it can connect to other blocks)
     * @param {HTMLElement} block The block element
     * @param {boolean} useAbsolutePosition Whether to return absolute or relative positions
     * @returns {Object} The connection points with their coordinates
     */
    function getConnectionPoints(block, useAbsolutePosition = true) {
        const rect = block.getBoundingClientRect();
        const blockType = block.dataset.type;
        const blockCategory = block.dataset.category;
        
        // Default connection points
        const points = {
            input: null,  // Where other blocks can connect into this block (left side)
            output: null  // Where this block can connect to other blocks (right side)
        };
        
        // Skip special case blocks that don't have standard connections
        if (blockCategory === 'end' && blockType !== 'repeatForever') {
            // Most end blocks only have inputs, no outputs
            points.input = {
                x: useAbsolutePosition ? rect.left : 0,
                y: useAbsolutePosition ? rect.top + (rect.height / 2) : rect.height / 2
            };
            return points;
        }
        
        // For repeat block (special case)
        if (blockType === 'repeat') {
            points.input = {
                x: useAbsolutePosition ? rect.left : 0,
                y: useAbsolutePosition ? rect.top + (rect.height / 2) : rect.height / 2
            };
            points.output = {
                x: useAbsolutePosition ? rect.right : rect.width,
                y: useAbsolutePosition ? rect.top + (rect.height / 2) : rect.height / 2
            };
            // Add a special connection point for the bottom of the repeat block's white area
            points.bottom = {
                x: useAbsolutePosition ? rect.left + (rect.width / 2) : rect.width / 2,
                y: useAbsolutePosition ? rect.bottom - 5 : rect.height - 5
            };
            return points;
        }
        
        // For trigger blocks (they only have output)
        if (blockCategory === 'triggering') {
            points.output = {
                x: useAbsolutePosition ? rect.right : rect.width,
                y: useAbsolutePosition ? rect.top + (rect.height / 2) : rect.height / 2
            };
            return points;
        }
        
        // Standard blocks have both input and output connection points
        points.input = {
            x: useAbsolutePosition ? rect.left : 0,
            y: useAbsolutePosition ? rect.top + (rect.height / 2) : rect.height / 2
        };
        points.output = {
            x: useAbsolutePosition ? rect.right : rect.width,
            y: useAbsolutePosition ? rect.top + (rect.height / 2) : rect.height / 2
        };
        
        return points;
    }
    
    /**
     * Calculate distance between two points
     * @param {Object} point1 First point {x, y}
     * @param {Object} point2 Second point {x, y}
     * @returns {number} The distance between the points
     */
    function calculateDistance(point1, point2) {
        return Math.sqrt(
            Math.pow(point1.x - point2.x, 2) + 
            Math.pow(point1.y - point2.y, 2)
        );
    }
    
    /**
     * Find all potential connection points within the threshold distance
     * @param {HTMLElement} draggedBlock The block being dragged
     * @returns {Array} Array of potential connection information
     */
    function findPotentialConnections(draggedBlock) {
        if (!draggedBlock) return [];
        
        const connections = [];
        const draggedPoints = getConnectionPoints(draggedBlock);
        
        // Consider all blocks in the programming area as potential connection targets
        // (except the one being dragged)
        Array.from(programmingArea.querySelectorAll('.block-container'))
            .filter(block => block !== draggedBlock)
            .forEach(targetBlock => {
                const targetPoints = getConnectionPoints(targetBlock);
                
                // Check if dragged block output can connect to target block input
                if (draggedPoints.output && targetPoints.input) {
                    const distance = calculateDistance(draggedPoints.output, targetPoints.input);
                    if (distance < CONNECTION_THRESHOLD) {
                        connections.push({
                            type: 'output-to-input',
                            source: draggedBlock,
                            sourcePoint: draggedPoints.output,
                            target: targetBlock,
                            targetPoint: targetPoints.input,
                            distance: distance
                        });
                    }
                }
                
                // Check if dragged block input can connect to target block output
                if (draggedPoints.input && targetPoints.output) {
                    const distance = calculateDistance(draggedPoints.input, targetPoints.output);
                    if (distance < CONNECTION_THRESHOLD) {
                        connections.push({
                            type: 'input-to-output',
                            source: draggedBlock,
                            sourcePoint: draggedPoints.input,
                            target: targetBlock,
                            targetPoint: targetPoints.output,
                            distance: distance
                        });
                    }
                }
                
                // Special case for repeat block bottom connection
                if (targetPoints.bottom && draggedPoints.input) {
                    const distance = calculateDistance(draggedPoints.input, targetPoints.bottom);
                    if (distance < CONNECTION_THRESHOLD) {
                        connections.push({
                            type: 'input-to-bottom',
                            source: draggedBlock,
                            sourcePoint: draggedPoints.input,
                            target: targetBlock,
                            targetPoint: targetPoints.bottom,
                            distance: distance
                        });
                    }
                }
            });
        
        return connections;
    }
    
    /**
     * Highlight a block to show potential connection
     * @param {HTMLElement} block The block to highlight
     */
    function highlightBlock(block) {
        if (!block) return;
        
        // Add a glow effect by updating the box-shadow
        const scratchBlock = block.querySelector('.scratch-block');
        if (scratchBlock) {
            scratchBlock.style.boxShadow = `0 0 10px 3px ${HIGHLIGHT_COLOR}, inset 0 2px 4px rgba(0, 0, 0, 0.2)`;
        }
    }
    
    /**
     * Remove highlight from a block
     * @param {HTMLElement} block The block to unhighlight
     */
    function removeHighlight(block) {
        if (!block) return;
        
        // Restore original box-shadow
        const scratchBlock = block.querySelector('.scratch-block');
        if (scratchBlock) {
            scratchBlock.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2)';
        }
    }
    
    /**
     * Remove all highlights from blocks
     */
    function clearAllHighlights() {
        document.querySelectorAll('.block-container').forEach(block => {
            removeHighlight(block);
        });
    }
    
    /**
     * Create a linked list/chain of connected blocks
     * @param {HTMLElement} startBlock The starting block
     * @returns {Array} Array of connected blocks in order
     */
    function getConnectedBlockChain(startBlock) {
        if (!startBlock) return [];
        
        let currentBlock = startBlock;
        const chain = [currentBlock];
        
        // Follow the connection chain by looking at the positions
        while (currentBlock) {
            // Look for the next block in the chain
            const currentRect = currentBlock.getBoundingClientRect();
            const nextBlock = Array.from(programmingArea.querySelectorAll('.block-container'))
                .filter(block => block !== currentBlock && !chain.includes(block))
                .find(block => {
                    const blockRect = block.getBoundingClientRect();
                    const currentRight = currentRect.right;
                    const blockLeft = blockRect.left;
                    const verticalCenter = Math.abs((currentRect.top + currentRect.height/2) - 
                                                  (blockRect.top + blockRect.height/2));
                    
                    // Check if this block is positioned right after the current one
                    return Math.abs(currentRight - blockLeft) < 5 && verticalCenter < 10;
                });
            
            if (nextBlock) {
                chain.push(nextBlock);
                currentBlock = nextBlock;
            } else {
                currentBlock = null; // End the chain
            }
        }
        
        return chain;
    }
    
    /**
     * Connect blocks by positioning them correctly
     * @param {Object} connection The connection information
     */
    function connectBlocks(connection) {
        if (!connection) return;
        
        const { type, source, target } = connection;
        
        // Get the positions to align the blocks
        const sourceRect = source.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const areaRect = programmingArea.getBoundingClientRect();
        
        let newLeft, newTop;
        
        if (type === 'output-to-input') {
            // Position the source block so its output connects to target's input
            newLeft = (targetRect.left - sourceRect.width - areaRect.left) + 'px';
            newTop = (targetRect.top - areaRect.top) + 'px';
        } 
        else if (type === 'input-to-output') {
            // Position the source block so its input connects to target's output
            newLeft = (targetRect.right - areaRect.left) + 'px';
            newTop = (targetRect.top - areaRect.top) + 'px';
        }
        else if (type === 'input-to-bottom') {
            // Special case for repeat blocks - position under the white area
            newLeft = (targetRect.left - areaRect.left) + 'px';
            newTop = (targetRect.bottom - areaRect.top) + 'px';
        }
        
        // Apply the new position
        source.style.left = newLeft;
        source.style.top = newTop;
        
        // If this block has a chain of blocks connected to it,
        // we need to move those as well to maintain the chain
        if (type === 'input-to-output' || type === 'input-to-bottom') {
            const chainBlocks = getConnectedBlockChain(source);
            if (chainBlocks.length > 1) {
                // Skip the first element as it's the source block we already moved
                chainBlocks.slice(1).forEach((block, index) => {
                    const prevBlock = chainBlocks[index]; // The previous block in the chain
                    const prevRect = prevBlock.getBoundingClientRect();
                    
                    block.style.left = (prevRect.right - areaRect.left) + 'px';
                    block.style.top = (prevRect.top - areaRect.top) + 'px';
                });
            }
        }
    }
    
    // ========================================================================
    // Event Handlers for Blocks in the Palette
    // ========================================================================
    
    // Override the default dragstart behaviors in the palette
    blockPalette.addEventListener('mousedown', function(e) {
        // Find the closest block-container parent
        const blockContainer = e.target.closest('.block-container');
        if (!blockContainer) return;
        
        // Prevent the default dragstart behavior
        blockContainer.addEventListener('dragstart', function(evt) {
            evt.preventDefault();
        }, { once: true });
        
        // Track initial mouse position relative to the block
        const rect = blockContainer.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        
        // Create a clone of the block for dragging
        const clone = blockContainer.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.zIndex = '1000';
        clone.style.opacity = '0.9';
        clone.style.pointerEvents = 'none'; // So it doesn't interfere with drop targets
        
        // Copy the original block's data attributes
        Object.keys(blockContainer.dataset).forEach(key => {
            clone.dataset[key] = blockContainer.dataset[key];
        });
        
        // Add the clone to the document body
        document.body.appendChild(clone);
        
        // Store references
        draggedBlock = clone;
        isDragging = true;
        
        // Initial positioning
        draggedBlock.style.left = (e.clientX - dragOffsetX) + 'px';
        draggedBlock.style.top = (e.clientY - dragOffsetY) + 'px';
        
        // Handle the mouse move event
        const handlePaletteMouseMove = function(moveEvent) {
            if (!isDragging) return;
            
            // Move the clone
            draggedBlock.style.left = (moveEvent.clientX - dragOffsetX) + 'px';
            draggedBlock.style.top = (moveEvent.clientY - dragOffsetY) + 'px';
            
            // Check if we're over the programming area
            const areaRect = programmingArea.getBoundingClientRect();
            const isOverProgrammingArea = (
                moveEvent.clientX >= areaRect.left && 
                moveEvent.clientX <= areaRect.right &&
                moveEvent.clientY >= areaRect.top && 
                moveEvent.clientY <= areaRect.bottom
            );
            
            // Visual feedback
            draggedBlock.style.opacity = isOverProgrammingArea ? '1.0' : '0.7';
        };
        
        // Handle the mouse up event
        const handlePaletteMouseUp = function(upEvent) {
            if (!isDragging) return;
            
            // Clean up event listeners
            document.removeEventListener('mousemove', handlePaletteMouseMove);
            document.removeEventListener('mouseup', handlePaletteMouseUp);
            
            // Check if dropped over programming area
            const areaRect = programmingArea.getBoundingClientRect();
            const isOverProgrammingArea = (
                upEvent.clientX >= areaRect.left && 
                upEvent.clientX <= areaRect.right &&
                upEvent.clientY >= areaRect.top && 
                upEvent.clientY <= areaRect.bottom
            );
            
            if (isOverProgrammingArea) {
                // Create a new block in the programming area (not the clone)
                // First get the block data
                const type = blockContainer.dataset.type;
                const category = blockContainer.dataset.category;
                
                // Find the block definition
                const blockDefinition = window.blocks[category]?.find(b => b.type === type);
                
                if (blockDefinition) {
                    // Create new block element from window.blocks data
                    const createBlockElement = window.createBlockElement || function(block, category) {
                        // Fallback implementation if the external function isn't available
                        const newContainer = document.createElement("div");
                        newContainer.classList.add("block-container");
                        newContainer.dataset.type = block.type;
                        newContainer.dataset.category = category;

                        const scratchBlock = document.createElement("div");
                        scratchBlock.classList.add("scratch-block");
                        scratchBlock.style.backgroundColor = block.color;
                        
                        const iconImg = document.createElement("img");
                        iconImg.src = block.icon;
                        iconImg.alt = block.name;
                        iconImg.classList.add("block-icon-img");
                        
                        scratchBlock.appendChild(iconImg);
                        newContainer.appendChild(scratchBlock);
                        
                        return newContainer;
                    };
                    
                    const newBlock = createBlockElement(blockDefinition, category);
                    programmingArea.appendChild(newBlock);
                    
                    // Position at the drop point
                    newBlock.style.position = 'absolute';
                    newBlock.style.left = (upEvent.clientX - areaRect.left - dragOffsetX) + 'px';
                    newBlock.style.top = (upEvent.clientY - areaRect.top - dragOffsetY) + 'px';
                    
                    // Set up dragging for the new block within the programming area
                    setupProgrammingAreaDragging(newBlock);
                    
                    // Check for potential connections immediately
                    setTimeout(() => {
                        const connections = findPotentialConnections(newBlock);
                        if (connections.length > 0) {
                            // Sort by distance to get the closest connection
                            connections.sort((a, b) => a.distance - b.distance);
                            const closestConnection = connections[0];
                            
                            if (closestConnection.distance < SNAP_THRESHOLD) {
                                connectBlocks(closestConnection);
                            }
                        }
                    }, 10);
                }
            }
            
            // Remove the clone
            if (draggedBlock && draggedBlock.parentNode) {
                draggedBlock.parentNode.removeChild(draggedBlock);
            }
            
            // Reset state
            draggedBlock = null;
            isDragging = false;
        };
        
        // Set up the event listeners
        document.addEventListener('mousemove', handlePaletteMouseMove);
        document.addEventListener('mouseup', handlePaletteMouseUp);
    });
    
    // ========================================================================
    // Event Handlers for Blocks in the Programming Area
    // ========================================================================
    
    /**
     * Set up dragging for blocks in the programming area
     * @param {HTMLElement} block The block to make draggable
     */
    function setupProgrammingAreaDragging(block) {
        if (!block) return;
        
        // Prevent default drag behavior
        block.addEventListener('dragstart', function(e) {
            e.preventDefault();
        });
        
        // Handle mouse down to start dragging
        block.addEventListener('mousedown', function(e) {
            // Skip if not clicking directly on the block
            if (!e.target.closest('.scratch-block')) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Track which block is being dragged
            draggedBlock = block;
            isDragging = true;
            
            // Calculate offset from the mouse to the corner of the block
            const rect = block.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            // Store original position in case we need to cancel
            originalPosition = {
                x: parseInt(block.style.left) || 0,
                y: parseInt(block.style.top) || 0
            };
            
            // Bring the dragged block to front
            block.style.zIndex = '1000';
        });
    }
    
    // Handle mouse move events for programming area blocks
    document.addEventListener('mousemove', function(e) {
        if (!isDragging || !draggedBlock) return;
        
        // Skip if the dragged block isn't in the programming area
        if (!programmingArea.contains(draggedBlock)) return;
        
        // Calculate new position
        const areaRect = programmingArea.getBoundingClientRect();
        let newLeft = e.clientX - areaRect.left - dragOffsetX;
        let newTop = e.clientY - areaRect.top - dragOffsetY;
        
        // Ensure the block stays within the programming area
        newLeft = Math.max(0, Math.min(newLeft, areaRect.width - draggedBlock.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, areaRect.height - draggedBlock.offsetHeight));
        
        // Update position
        draggedBlock.style.left = newLeft + 'px';
        draggedBlock.style.top = newTop + 'px';
        
        // Find potential connections
        potentialConnections = findPotentialConnections(draggedBlock);
        
        // Clear all highlights first
        clearAllHighlights();
        
        // Highlight blocks that can be connected to
        if (potentialConnections.length > 0) {
            // Sort by distance to get the closest connection
            potentialConnections.sort((a, b) => a.distance - b.distance);
            const closestConnection = potentialConnections[0];
            
            // Highlight the target block
            highlightBlock(closestConnection.target);
        }
    });
    
    // Handle mouse up events for programming area blocks
    document.addEventListener('mouseup', function(e) {
        if (!isDragging || !draggedBlock) return;
        
        // Skip if the dragged block isn't in the programming area
        if (!programmingArea.contains(draggedBlock)) return;
        
        // Check for connections and snap if close enough
        if (potentialConnections.length > 0) {
            // Sort by distance to get the closest connection
            potentialConnections.sort((a, b) => a.distance - b.distance);
            const closestConnection = potentialConnections[0];
            
            if (closestConnection.distance < SNAP_THRESHOLD) {
                connectBlocks(closestConnection);
            }
        }
        
        // Clear all highlights
        clearAllHighlights();
        
        // Reset state
        draggedBlock.style.zIndex = '';
        draggedBlock = null;
        isDragging = false;
        potentialConnections = [];
    });
    
    // ========================================================================
    // Initialize the Improved Linkage Functionality
    // ========================================================================
    
    /**
     * Initialize the linkage functionality
     */
    function init() {
        console.log('Initializing improved block linkage functionality');
        
        // Find all existing blocks in the programming area and set up dragging
        const existingBlocks = programmingArea.querySelectorAll('.block-container');
        existingBlocks.forEach(block => {
            setupProgrammingAreaDragging(block);
        });
        
        // Create a mutation observer to detect new blocks and set up dragging for them
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('block-container')) {
                            setupProgrammingAreaDragging(node);
                        }
                    });
                }
            });
        });
        
        // Start observing the programming area
        observer.observe(programmingArea, { childList: true });
    }
    
    // Initialize the linkage functionality
    init();
});
