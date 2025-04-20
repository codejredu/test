// ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: Horizontal Snap - With Visual Indication & Position Fix - Final
// ========================================================================

(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 40;
    const VERTICAL_ALIGNMENT_TOLERANCE = 30;
    const HORIZONTAL_SNAP_OFFSET = 0; 
    const ENABLE_DETAILED_SNAP_LOGGING = true; // הפכתי לפעיל כדי לקבל יותר לוגים
    
    // Fixed Position Correction Values (based on logs analysis)
    const POSITION_CORRECTION_X = 16; // תיקון קבוע לציר X - הוכפל ל-16
    const POSITION_CORRECTION_Y = 0; // תיקון קבוע לציר Y - הוכפל ל-16

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
        console.log("[Linkage] System Initialized with position correction X=" + POSITION_CORRECTION_X + ", Y=" + POSITION_CORRECTION_Y);
        prepareExistingBlocks();
    }
    
    // פונקציה להוספת חיווי חזותי
    function addVisualIndicationStyles() {
        // בדוק קודם אם הסגנונות כבר קיימים
        if (document.getElementById('linkage-styles')) return;

        const styleElement = document.createElement('style');
        styleElement.id = 'linkage-styles';
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

        if (ENABLE_DETAILED_SNAP_LOGGING) {
            console.log(`[Linkage] Started dragging block: ${draggedElement.id}`);
        }

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
            if (ENABLE_DETAILED_SNAP_LOGGING) {
                console.log(`[Linkage] Attempting to link with valid target`);
            }
            linkBlocksHorizontally(currentTarget, currentDraggedElement);
        } else {
            // אין הצמדה - המיקום האחרון מ-mousemove נשאר
            if (ENABLE_DETAILED_SNAP_LOGGING && currentDraggedElement) {
                 console.log(`[Linkage] Placed single block ${currentDraggedElement.id} (no snap)`);
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
                
                if (shouldLog) {
                    console.log(`[Linkage] Found potential target: ${block.id}, distance H=${horizontalDistance.toFixed(2)}, V=${verticalDistance.toFixed(2)}`);
                }
            } 
        }); 
        
        if (bestTarget) { 
            potentialSnapTarget = bestTarget; 
            highlightSnapTarget(draggedElement, bestTarget); 
            
            // הוסף חיווי חזותי לאזור הצימוד
            showSnapAreaIndicator(bestTarget, draggedElement);
            
            if (shouldLog) console.log(`[Linkage] Best target found: ${bestTarget.id}. Added visual indicators.`); 
        } else { 
            if (shouldLog) console.log(`[Linkage] No target found within range.`); 
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
    
    // פונקציות לחיווי חזותי של אזור הצימוד
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
    // Linking Logic (Horizontal - With Position Correction)
    // ========================================================================
    function linkBlocksHorizontally(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        if (leftBlock.dataset.rightBlockId || rightBlock.dataset.leftBlockId) return;

        console.log(`[Linkage] Linking ${leftBlock.id} -> ${rightBlock.id} (Using Left/Top + Position Fix)`);
        console.log(`[Linkage]   Before - Left [${leftBlock.id}]: L=${leftBlock.offsetLeft}, T=${leftBlock.offsetTop}, W=${leftBlock.offsetWidth}`);
        console.log(`[Linkage]   Before - Right [${rightBlock.id}]: L=${rightBlock.offsetLeft}, T=${rightBlock.offsetTop}`);

        // תיקון: הגדרת קשרים נכונה בין הבלוקים
        leftBlock.dataset.rightBlockId = rightBlock.id;
        rightBlock.dataset.leftBlockId = leftBlock.id;

        const leftWidth = leftBlock.offsetWidth;
        
        // חישוב מיקום עם תיקון הפער
        const targetX = leftBlock.offsetLeft + leftWidth - HORIZONTAL_SNAP_OFFSET - POSITION_CORRECTION_X;
        const targetY = leftBlock.offsetTop - POSITION_CORRECTION_Y;
        
        console.log(`[Linkage]   Calculated Target: X=${targetX.toFixed(0)}, Y=${targetY.toFixed(0)} (With correction X=${POSITION_CORRECTION_X}, Y=${POSITION_CORRECTION_Y})`);

        // מיקום מדויק עם התאמה
        rightBlock.style.left = `${targetX}px`;
        rightBlock.style.top = `${targetY}px`;
        console.log(`[Linkage]   Set Left/Top Style for ${rightBlock.id}`);

        // אנימציה קצרה להדגשת הצימוד
        rightBlock.classList.add('snap-highlight');
        leftBlock.classList.add('snap-target');
        
        // תיקון מיידי נוסף - יש להוסיף עוד פעם מיד אחרי השמת המיקום הראשון
        // כך הדפדפן לא יספיק להזיז את הלבנה למקום אחר
        rightBlock.style.left = `${targetX}px`;
        rightBlock.style.top = `${targetY}px`;
        
        // בדיקה של המיקום הסופי לאחר הצימוד
        setTimeout(() => {
            rightBlock.classList.remove('snap-highlight');
            leftBlock.classList.remove('snap-target');
            
            const finalLeft = rightBlock.offsetLeft;
            const finalTop = rightBlock.offsetTop;
            console.log(`[Linkage]   After Link (async) - Right [${rightBlock.id}]: FINAL L=${finalLeft}, FINAL T=${finalTop}`);
            
            // בדוק אם המיקום עדיין שגוי
            const positionError = Math.abs(finalLeft - targetX) > 1 || Math.abs(finalTop - targetY) > 1;
            if (positionError) {
                console.warn(`[Linkage] Position discrepancy detected for ${rightBlock.id}! Expected (${targetX.toFixed(0)}, ${targetY.toFixed(0)}), Got (${finalLeft}, ${finalTop})`);
                
                // תיקון אגרסיבי: הפעם נשתמש בהפרש הממשי שמצאנו
                const offsetX = finalLeft - targetX; // ההפרש הממשי
                const offsetY = finalTop - targetY;  // ההפרש הממשי
                
                // חישוב מיקום עם תיקון כפול של ההפרש הממשי
                const retryX = targetX - offsetX * 2;
                const retryY = targetY - offsetY * 2;
                
                rightBlock.style.left = `${retryX}px`;
                rightBlock.style.top = `${retryY}px`;
                
                console.log(`[Linkage] Made final correction using aggressive X=${retryX}, Y=${retryY}`);
                
                // בדיקה נוספת לוודא שהתיקון עבד
                setTimeout(() => {
                    const finalCheckLeft = rightBlock.offsetLeft;
                    const finalCheckTop = rightBlock.offsetTop;
                    console.log(`[Linkage] Final check - Right [${rightBlock.id}]: L=${finalCheckLeft}, T=${finalCheckTop}`);
                }, 20);
            } else {
                console.log(`[Linkage] Position looks good!`);
            }
        }, 50); // הקטנתי את הזמן כדי לתקן מהר יותר

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
console.log("linkageimproved.js script finished execution (With Visual Indication + Position Fix).");
