// ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Horizontal Snap - With Visual Indication - Stable Syntax + Link Logs
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 40;
    const VERTICAL_ALIGNMENT_TOLERANCE = 30;
    const HORIZONTAL_SNAP_OFFSET = 0; 
    const ENABLE_DETAILED_SNAP_LOGGING = false; // כבוי כברירת מחדל

    // State Variables
    let isDragging = false; let draggedElement = null;
    let potentialSnapTarget = null; let initialMouseX = 0; let initialMouseY = 0;
    let initialElementX = 0; let initialElementY = 0; let programmingArea = null;
    let nextBlockId = 1;

    // ========================================================================
    // Initialization
    // ========================================================================
    function initializeLinkageSystem() {
        console.log("[Linkage] Attempting Init...");
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) { console.error("[Linkage] ERROR: #program-blocks not found!"); return; }
        
        // הוספת CSS לחיווי חזותי
        addVisualIndicationStyles();
        
        const currentPosition = window.getComputedStyle(programmingArea).position;
        if (currentPosition !== 'relative' && currentPosition !== 'absolute' && currentPosition !== 'fixed') {
             console.warn(`[Linkage] WARN: #program-blocks position is ${currentPosition}. Consider 'relative'.`);
        }
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("[Linkage] Mousedown listener ATTACHED.");
        console.log("[Linkage] System Initialized.");
        prepareExistingBlocks();
    }
    
    // פונקציה להוספת חיווי חזותי
    function addVisualIndicationStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .snap-highlight {
                box-shadow: 0 0 0 3px #4285f4 !important;
                transition: box-shadow 0.2s ease-in-out;
            }
            
            .snap-target {
                box-shadow: 0 0 0 3px #34a853 !important;
                transition: box-shadow 0.2s ease-in-out;
            }
            
            .snap-area {
                position: absolute;
                background-color: rgba(66, 133, 244, 0.2);
                border: 2px dashed #4285f4;
                pointer-events: none;
                z-index: 999;
                transition: opacity 0.2s ease-in-out;
            }
        `;
        document.head.appendChild(styleElement);
        console.log("[Linkage] Added visual indication styles");
    }
    
    function prepareExistingBlocks() {
        const blocksInArea = programmingArea.querySelectorAll('.block-container');
        blocksInArea.forEach(block => {
            if (!block.id) { block.id = generateUniqueBlockId(); }
             if (!block.style.position || block.style.position === 'static') { block.style.position = 'absolute'; }
        });
        if(blocksInArea.length > 0) console.log(`[Linkage] Prepared ${blocksInArea.length} existing blocks.`);
    }
    function runInitialization() {
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeLinkageSystem); }
        else { initializeLinkageSystem(); }
    }
    runInitialization();

    // ========================================================================
    // Unique ID Generation
    // ========================================================================
    function generateUniqueBlockId() { return `block-${Date.now()}-${nextBlockId++}`; }

    // ========================================================================
    // Event Handlers
    // ========================================================================
    function handleMouseDown(event) {
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) return;
        event.preventDefault(); isDragging = true; draggedElement = targetBlock;
        if (!draggedElement.id) { draggedElement.id = generateUniqueBlockId(); }

        const prevBlockId = draggedElement.dataset.prevBlockId;
        if (prevBlockId) { const pb = document.getElementById(prevBlockId); if (pb) delete pb.dataset.nextBlockId; delete draggedElement.dataset.prevBlockId; }
        const leftBlockId = draggedElement.dataset.leftBlockId;
        if (leftBlockId) { const lb = document.getElementById(leftBlockId); if (lb) delete lb.dataset.rightBlockId; delete draggedElement.dataset.leftBlockId; }

        initialMouseX = event.clientX; initialMouseY = event.clientY;
        initialElementX = draggedElement.offsetLeft; initialElementY = draggedElement.offsetTop;
        draggedElement.style.zIndex = 1000; draggedElement.style.cursor = 'grabbing';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
    }

    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        const deltaX = event.clientX - initialMouseX; const deltaY = event.clientY - initialMouseY;
        const newX = initialElementX + deltaX; const newY = initialElementY + deltaY;
        draggedElement.style.left = `${newX}px`; draggedElement.style.top = `${newY}px`;
        findAndHighlightSnapTarget();
    }

    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        const currentDraggedElement = draggedElement;
        const currentTarget = potentialSnapTarget;
        const isValidSnapTarget = currentTarget && programmingArea && programmingArea.contains(currentTarget);

        // הסר מאזינים גלובליים מיד
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);

        // אפס מצב גרירה
        isDragging = false;
        draggedElement = null;
        potentialSnapTarget = null;

        // בצע הצמדה או מיקום סופי
        if (isValidSnapTarget) {
            linkBlocksHorizontally(currentTarget, currentDraggedElement);
        } else {
            // אין הצמדה - המיקום האחרון מ-mousemove נשאר
            if (ENABLE_DETAILED_SNAP_LOGGING && currentDraggedElement) {
                 console.log(`Placed single block ${currentDraggedElement.id} (no snap)`);
            }
        }

        // ניקוי סופי
        clearSnapHighlighting();
        if(currentDraggedElement) {
             currentDraggedElement.style.zIndex = '';
             currentDraggedElement.style.cursor = '';
        }
        
        // הסר את אזור החיווי אם קיים
        removeSnapAreaIndicator();
        
        console.log("--- MouseUp Finished ---");
    }

    function handleMouseLeave(event) { if (isDragging) { handleMouseUp(event); } }

    // ========================================================================
    // Snapping Logic (Horizontal - With Improved Visual Indication)
    // ========================================================================
    function findAndHighlightSnapTarget() {
        const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement; 
        clearSnapHighlighting(); 
        removeSnapAreaIndicator();
        potentialSnapTarget = null; 
        
        if (!isDragging || !draggedElement || !programmingArea) return;
        
        const dragRect = draggedElement.getBoundingClientRect(); 
        if (dragRect.height <= 0 || dragRect.width <= 0) return;
        
        const dragLeftConnector = { x: dragRect.left, y: dragRect.top + dragRect.height / 2 }; 
        let closestDistance = HORIZONTAL_SNAP_DISTANCE; 
        let bestTarget = null;
        
        const allBlocks = programmingArea.querySelectorAll('.block-container'); 
        allBlocks.forEach(block => { 
            if (block === draggedElement || block.dataset.rightBlockId) return; 
            
            const targetRect = block.getBoundingClientRect(); 
            if (targetRect.height <= 0 || targetRect.width <= 0) return;
            
            const targetRightConnector = { 
                x: targetRect.right - HORIZONTAL_SNAP_OFFSET, 
                y: targetRect.top + targetRect.height / 2 
            }; 
            
            const dx = dragLeftConnector.x - targetRightConnector.x; 
            const dy = dragLeftConnector.y - targetRightConnector.y; 
            const horizontalDistance = Math.abs(dx); 
            const verticalDistance = Math.abs(dy);
            
            if (horizontalDistance < closestDistance && verticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) { 
                closestDistance = horizontalDistance; 
                bestTarget = block; 
            } 
        }); 
        
        if (bestTarget) { 
            potentialSnapTarget = bestTarget; 
            highlightSnapTarget(draggedElement, bestTarget); 
            
            // הוסף חיווי חזותי לאזור הצימוד
            showSnapAreaIndicator(bestTarget, draggedElement);
            
            if (shouldLog) console.log(`--- Best H target: ${bestTarget.id}. Added visual indicators. ---`); 
        } else { 
            if (shouldLog) console.log(`--- No H target found. ---`); 
        } 
    }
    
    function highlightSnapTarget(draggedBlock, targetBlock) {
        if (draggedBlock) {
            try {
                // הוסף הדגשה ללבנה הנגררת
                draggedBlock.classList.add('snap-highlight');
                
                // הוסף הדגשה ליעד הצימוד
                if (targetBlock) {
                    targetBlock.classList.add('snap-target');
                }
            } catch (e) { 
                console.error("Error highlighting blocks", e);
            }
        }
    }
    
    function clearSnapHighlighting() {
        if (!programmingArea) return;
        const highlighted = programmingArea.querySelectorAll('.snap-highlight, .snap-target');
        highlighted.forEach(el => {
            try {
                el.classList.remove('snap-highlight');
                el.classList.remove('snap-target');
            } catch(e) {
                /* ignore */
            }
        });
    }
    
    // פונקציות חדשות לחיווי חזותי של אזור הצימוד
    function showSnapAreaIndicator(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || !programmingArea) return;
        
        // הסר חיווי קודם אם קיים
        removeSnapAreaIndicator();
        
        const leftRect = leftBlock.getBoundingClientRect();
        const rightRect = rightBlock.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();
        
        // יצירת אלמנט לחיווי אזור הצימוד
        const snapArea = document.createElement('div');
        snapArea.className = 'snap-area';
        snapArea.id = 'snap-area-indicator';
        
        // מיקום וגודל אזור החיווי
        const left = leftRect.right - programRect.left - HORIZONTAL_SNAP_OFFSET;
        const top = leftRect.top - programRect.top;
        const width = HORIZONTAL_SNAP_DISTANCE;
        const height = leftRect.height;
        
        snapArea.style.left = `${left}px`;
        snapArea.style.top = `${top}px`;
        snapArea.style.width = `${width}px`;
        snapArea.style.height = `${height}px`;
        
        // הוספת האלמנט לאזור התכנות
        programmingArea.appendChild(snapArea);
    }
    
    function removeSnapAreaIndicator() {
        const existingIndicator = document.getElementById('snap-area-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }

    // ========================================================================
    // Linking Logic (Horizontal - Using ONLY Left/Top)
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        if (leftBlock.dataset.rightBlockId || rightBlock.dataset.leftBlockId) return;

        console.log(`[Linkage] Linking ${leftBlock.id} -> ${rightBlock.id} (Using Left/Top)`);
        console.log(`[Linkage]   Before - Left [${leftBlock.id}]: L=${leftBlock.offsetLeft}, T=${leftBlock.offsetTop}, W=${leftBlock.offsetWidth}`);
        console.log(`[Linkage]   Before - Right [${rightBlock.id}]: L=${rightBlock.offsetLeft}, T=${rightBlock.offsetTop}`);

        // תיקון: הגדרת קשרים נכונה בין הבלוקים
        leftBlock.dataset.rightBlockId = rightBlock.id;
        rightBlock.dataset.leftBlockId = leftBlock.id; // תיקון: זה היה rightBlock.id במקור

        const leftWidth = leftBlock.offsetWidth;
        const targetX = leftBlock.offsetLeft + leftWidth - HORIZONTAL_SNAP_OFFSET;
        const targetY = leftBlock.offsetTop;
        console.log(`[Linkage]   Calculated Target: X=${targetX.toFixed(0)}, Y=${targetY.toFixed(0)} (Offset: ${HORIZONTAL_SNAP_OFFSET})`);

        rightBlock.style.left = `${targetX}px`;
        rightBlock.style.top = `${targetY}px`;
        console.log(`[Linkage]   Set Left/Top Style for ${rightBlock.id}`);

        // אנימציה קצרה להדגשת הצימוד
        rightBlock.classList.add('snap-highlight');
        leftBlock.classList.add('snap-target');
        
        setTimeout(() => {
            rightBlock.classList.remove('snap-highlight');
            leftBlock.classList.remove('snap-target');
            
            const finalLeft = rightBlock.offsetLeft;
            const finalTop = rightBlock.offsetTop;
            console.log(`[Linkage]   After Link (async) - Right [${rightBlock.id}]: FINAL L=${finalLeft}, FINAL T=${finalTop}`);
            if (Math.abs(finalLeft - targetX) > 1 || Math.abs(finalTop - targetY) > 1) {
                 console.warn(`[Linkage] Position discrepancy STILL detected for ${rightBlock.id}! Expected (${targetX.toFixed(0)}, ${targetY.toFixed(0)}), Got (${finalLeft}, ${finalTop})`);
            }
        }, 500);

        console.log(`[Linkage] Linked HORIZONTALLY ${leftBlock.id} -> ${rightBlock.id}.`);
    }

    // ========================================================================
    // Public API
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement){
         if (!newBlockElement) return;
         if (!newBlockElement.id) { newBlockElement.id = generateUniqueBlockId(); }
         try { newBlockElement.style.position = 'absolute'; } catch (e) { console.error("Reg Error", e); }
    };

})();
console.log("linkageimproved.js script finished execution (With Visual Indication).");
