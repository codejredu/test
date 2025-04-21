 // ========================================================================
// Improved Block Linkage System (linkageimproved.js)
// Version: DIRECT DOM MANIPULATION - FIXED CONNECTION
// ========================================================================
(function() {
    // Configuration
    const HORIZONTAL_SNAP_DISTANCE = 40;
    const VERTICAL_ALIGNMENT_TOLERANCE = 30;
    const HORIZONTAL_SNAP_OFFSET = 0; 
    const ENABLE_DETAILED_SNAP_LOGGING = true; 
    
    // קבועים לחיבור מושלם של פאזל
    const PUZZLE_CONNECTOR_WIDTH = 8; // הרוחב של חיבור הפאזל
    // State Variables
    let isDragging = false; 
    let draggedElement = null;
    let potentialSnapTarget = null; 
    let initialMouseX = 0; 
    let initialMouseY = 0;
    let initialElementX = 0; 
    let initialElementY = 0; 
    let programmingArea = null;
    let nextBlockId = 1;
    
    // מצב הצימוד - שמאלה או ימינה
    let snapDirection = 'right'; // 'right' = לבנה שמאלית מצמידה ימינה, 'left' = לבנה ימנית מצמידה שמאלה
    
    // מאזין לשינויים ב-DOM
    let observer = null;
    
    // ========================================================================
    // Initialization
    // ========================================================================
    function initializeLinkageSystem() {
        console.log("[Linkage] Attempting Init with direct DOM approach...");
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) { 
            console.error("[Linkage] ERROR: #program-blocks not found!"); 
            return; 
        }
        
        // הוספת CSS לחיווי חזותי
        addVisualIndicationStyles();
        
        const currentPosition = window.getComputedStyle(programmingArea).position;
        if (currentPosition !== 'relative' && currentPosition !== 'absolute' && currentPosition !== 'fixed') {
             console.warn(`[Linkage] WARN: #program-blocks position is ${currentPosition}. Consider 'relative'.`);
        }
        
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("[Linkage] Mousedown listener ATTACHED.");
        console.log("[Linkage] System Initialized with DIRECT DOM MANIPULATION for puzzle connection");
        
        prepareExistingBlocks();
        
        // הוספת observer לזיהוי שינויים בתכונות החזותיות
        setupDOMObserver();
    }
    
    // מעקב אחרי שינויי DOM רלוונטיים
    function setupDOMObserver() {
        // אנחנו רוצים לעקוב אחרי שינויים בתכונות החזותיות של האלמנטים
        observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // אם יש שינוי במיקום של אלמנט שכבר היינו אמורים לחבר
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style') && 
                    mutation.target.classList.contains('block-container')) {
                    
                    // בדוק אם זה בלוק שאמור להיות מחובר למשהו
                    const blockElement = mutation.target;
                    const leftBlockId = blockElement.dataset.leftBlockId;
                    const rightBlockId = blockElement.dataset.rightBlockId;
                    
                    if (leftBlockId || rightBlockId) {
                        // מצאנו בלוק שאמור להיות מחובר - נתקן את המיקום שלו
                        enforceConnectionPosition(blockElement);
                    }
                }
            });
        });
        
        // נפעיל את המעקב על כל האזור של הבלוקים
        observer.observe(programmingArea, { 
            attributes: true,
            attributeFilter: ['style'],
            childList: true,
            subtree: true
        });
        
        console.log('[Linkage] DOM Observer activated to enforce connections');
    }
    
    // מאלץ את הקשר בין בלוקים מחוברים
    function enforceConnectionPosition(blockElement) {
        const leftBlockId = blockElement.dataset.leftBlockId;
        const rightBlockId = blockElement.dataset.rightBlockId;
        
        if (leftBlockId) {
            // זה בלוק ימני שצריך להיות מחובר לבלוק שמאלי
            const leftBlock = document.getElementById(leftBlockId);
            if (leftBlock) {
                console.log(`[Linkage] Enforcing connection position for ${blockElement.id} with left block ${leftBlockId}`);
                directlySetPuzzleConnection(leftBlock, blockElement);
            }
        }
        
        if (rightBlockId) {
            // זה בלוק שמאלי שצריך להיות מחובר לבלוק ימני
            const rightBlock = document.getElementById(rightBlockId);
            if (rightBlock) {
                console.log(`[Linkage] Enforcing connection position for ${blockElement.id} with right block ${rightBlockId}`);
                directlySetPuzzleConnection(blockElement, rightBlock);
            }
        }
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
            
            /* Add styles for connected blocks */
            .connected-left {
                box-shadow: -2px 0 0 1px #34a853 !important;
            }
            
            .connected-right {
                box-shadow: 2px 0 0 1px #4285f4 !important;
            }
        `;
        document.head.appendChild(styleElement);
        console.log("[Linkage] Added visual indication styles");
    }
    
    function prepareExistingBlocks() {
        const blocksInArea = programmingArea.querySelectorAll('.block-container');
        blocksInArea.forEach(block => {
            if (!block.id) { 
                block.id = generateUniqueBlockId(); 
            }
            
            if (!block.style.position || block.style.position === 'static') { 
                block.style.position = 'absolute'; 
            }
        });
        
        if(blocksInArea.length > 0) {
            console.log(`[Linkage] Prepared ${blocksInArea.length} existing blocks.`);
        }
    }
    
    function runInitialization() {
        if (document.readyState === 'loading') { 
            document.addEventListener('DOMContentLoaded', initializeLinkageSystem); 
        }
        else { 
            initializeLinkageSystem(); 
        }
    }
    
    runInitialization();
    
    // ========================================================================
    // Unique ID Generation
    // ========================================================================
    function generateUniqueBlockId() { 
        return `block-${Date.now()}-${nextBlockId++}`; 
    }
    
    // ========================================================================
    // Event Handlers
    // ========================================================================
    function handleMouseDown(event) {
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea || !programmingArea.contains(targetBlock)) return;
        
        event.preventDefault(); 
        isDragging = true; 
        draggedElement = targetBlock;
        
        if (!draggedElement.id) { 
            draggedElement.id = generateUniqueBlockId(); 
        }
        
        if (ENABLE_DETAILED_SNAP_LOGGING) {
            console.log(`[Linkage] Started dragging block: ${draggedElement.id}`);
        }
        
        // איפוס כל טרנספורמציה קודמת
        draggedElement.style.transform = '';
        
        // הסרת קשרים קודמים
        removeExistingConnections(draggedElement);
        
        initialMouseX = event.clientX; 
        initialMouseY = event.clientY;
        initialElementX = draggedElement.offsetLeft; 
        initialElementY = draggedElement.offsetTop;
        
        draggedElement.style.zIndex = 1000; 
        draggedElement.style.cursor = 'grabbing';
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
    }
    
    // פונקציה חדשה להסרת חיבורים קיימים
    function removeExistingConnections(element) {
        // קשרים שמאלה-ימינה
        const leftBlockId = element.dataset.leftBlockId;
        if (leftBlockId) { 
            const lb = document.getElementById(leftBlockId); 
            if (lb) {
                delete lb.dataset.rightBlockId;
                lb.classList.remove('connected-left');
            }
            delete element.dataset.leftBlockId;
            element.classList.remove('connected-right');
        }
        
        // קשרים ימינה-שמאלה
        const rightBlockId = element.dataset.rightBlockId;
        if (rightBlockId) { 
            const rb = document.getElementById(rightBlockId); 
            if (rb) {
                delete rb.dataset.leftBlockId;
                rb.classList.remove('connected-right');
            }
            delete element.dataset.rightBlockId;
            element.classList.remove('connected-left');
        }
    }
    
    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        
        const deltaX = event.clientX - initialMouseX; 
        const deltaY = event.clientY - initialMouseY;
        const newX = initialElementX + deltaX; 
        const newY = initialElementY + deltaY;
        
        draggedElement.style.left = `${newX}px`; 
        draggedElement.style.top = `${newY}px`;
        
        findAndHighlightSnapTarget();
    }
    
    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        
        const currentDraggedElement = draggedElement;
        const currentTarget = potentialSnapTarget;
        const isValidSnapTarget = currentTarget && programmingArea && programmingArea.contains(currentTarget);
        const currentDirection = snapDirection;
        
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
                console.log(`[Linkage] Attempting to link with valid target in direction: ${currentDirection}`);
            }
            
            if (currentDirection === 'right') {
                // הלבנה הנגררת מימין, היעד משמאל
                directlySetPuzzleConnection(currentTarget, currentDraggedElement);
            } else {
                // הלבנה הנגררת משמאל, היעד מימין
                directlySetPuzzleConnection(currentDraggedElement, currentTarget);
            }
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
    
    function handleMouseLeave(event) { 
        if (isDragging) { 
            handleMouseUp(event); 
        } 
    }
    
    // ========================================================================
    // Snapping Logic (Bi-Directional with Improved Visual Indication)
    // ========================================================================
    function findAndHighlightSnapTarget() {
        const shouldLog = ENABLE_DETAILED_SNAP_LOGGING && isDragging && draggedElement; 
        clearSnapHighlighting(); 
        removeSnapAreaIndicator();
        potentialSnapTarget = null;
        snapDirection = 'right'; // איפוס כיוון הצימוד
        
        if (!isDragging || !draggedElement || !programmingArea) return;
        
        const dragRect = draggedElement.getBoundingClientRect(); 
        if (dragRect.height <= 0 || dragRect.width <= 0) return;
        
        // נקודות חיבור - שמאל וימין של הלבנה הנגררת
        const dragLeftConnector = { x: dragRect.left, y: dragRect.top + dragRect.height / 2 }; 
        const dragRightConnector = { x: dragRect.right, y: dragRect.top + dragRect.height / 2 };
        
        let closestDistance = HORIZONTAL_SNAP_DISTANCE; 
        let bestTarget = null;
        
        const allBlocks = programmingArea.querySelectorAll('.block-container'); 
        allBlocks.forEach(block => { 
            if (block === draggedElement) return;
            
            const targetRect = block.getBoundingClientRect(); 
            if (targetRect.height <= 0 || targetRect.width <= 0) return;
            
            // נקודות חיבור - שמאל וימין של הלבנה הפוטנציאלית לחיבור
            const targetLeftConnector = { 
                x: targetRect.left, 
                y: targetRect.top + targetRect.height / 2 
            };
            
            const targetRightConnector = { 
                x: targetRect.right - HORIZONTAL_SNAP_OFFSET, 
                y: targetRect.top + targetRect.height / 2 
            };
            
            // בדיקת מרחק ימינה (הלבנה הנגררת מימין ליעד)
            // אם הלבנה הנגררת היא מימין והלבנה היעד לא מחוברת כבר ללבנה אחרת מימין
            if (!block.dataset.rightBlockId) {
                const rightDx = dragLeftConnector.x - targetRightConnector.x; 
                const rightDy = dragLeftConnector.y - targetRightConnector.y; 
                const rightHorizontalDistance = Math.abs(rightDx); 
                const rightVerticalDistance = Math.abs(rightDy);
                
                if (rightHorizontalDistance < closestDistance && rightVerticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) { 
                    closestDistance = rightHorizontalDistance; 
                    bestTarget = block;
                    snapDirection = 'right';
                    
                    if (shouldLog) {
                        console.log(`[Linkage] Found potential RIGHT target: ${block.id}, distance H=${rightHorizontalDistance.toFixed(2)}, V=${rightVerticalDistance.toFixed(2)}`);
                    }
                }
            }
            
            // בדיקת מרחק שמאלה (הלבנה הנגררת משמאל ליעד)
            // אם הלבנה הנגררת היא משמאל והלבנה היעד לא מחוברת כבר ללבנה אחרת משמאל
            if (!block.dataset.leftBlockId) {
                const leftDx = dragRightConnector.x - targetLeftConnector.x; 
                const leftDy = dragRightConnector.y - targetLeftConnector.y; 
                const leftHorizontalDistance = Math.abs(leftDx); 
                const leftVerticalDistance = Math.abs(leftDy);
                
                if (leftHorizontalDistance < closestDistance && leftVerticalDistance < VERTICAL_ALIGNMENT_TOLERANCE) { 
                    closestDistance = leftHorizontalDistance; 
                    bestTarget = block;
                    snapDirection = 'left';
                    
                    if (shouldLog) {
                        console.log(`[Linkage] Found potential LEFT target: ${block.id}, distance H=${leftHorizontalDistance.toFixed(2)}, V=${leftVerticalDistance.toFixed(2)}`);
                    }
                }
            }
        }); 
        
        if (bestTarget) { 
            potentialSnapTarget = bestTarget; 
            highlightSnapTarget(draggedElement, bestTarget); 
            
            // הוסף חיווי חזותי לאזור הצימוד
            showSnapAreaIndicator(snapDirection === 'right' ? bestTarget : draggedElement, 
                                  snapDirection === 'right' ? draggedElement : bestTarget);
            
            if (shouldLog) console.log(`[Linkage] Best target found: ${bestTarget.id} in direction: ${snapDirection}. Added visual indicators.`); 
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
    // Linking Logic (FIXED DIRECT DOM MANIPULATION)
    // ========================================================================
    function directlySetPuzzleConnection(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        
        console.log(`[Linkage] Connecting blocks: ${leftBlock.id} -> ${rightBlock.id}`);
        
        // Log initial positions
        console.log(`[Linkage] Before - Left [${leftBlock.id}]: L=${leftBlock.offsetLeft}, T=${leftBlock.offsetTop}, W=${leftBlock.offsetWidth}`);
        console.log(`[Linkage] Before - Right [${rightBlock.id}]: L=${rightBlock.offsetLeft}, T=${rightBlock.offsetTop}`);
        
        // 1. Establish relationship between blocks
        leftBlock.dataset.rightBlockId = rightBlock.id;
        rightBlock.dataset.leftBlockId = leftBlock.id;
        
        // 2. Temporarily disable observer to prevent infinite loops
        if (observer) observer.disconnect();
        
        try {
            // 3. Calculate the desired position with overlap
            const leftWidth = leftBlock.offsetWidth;
            const targetX = leftBlock.offsetLeft + leftWidth - PUZZLE_CONNECTOR_WIDTH;
            const targetY = leftBlock.offsetTop;
            
            console.log(`[Linkage] Setting position: X=${targetX}, Y=${targetY} (overlap=${PUZZLE_CONNECTOR_WIDTH}px)`);
            
            // 4. Clear any interfering properties
            rightBlock.style.transition = 'none';
            rightBlock.style.transform = '';
            
            // 5. Set basic positioning directly
            rightBlock.style.position = 'absolute';
            rightBlock.style.left = targetX + 'px';
            rightBlock.style.top = targetY + 'px';
            
            // 6. Add visual connection indicators
            leftBlock.classList.add('connected-left');
            rightBlock.classList.add('connected-right');
            
            // 7. Force a layout reflow to ensure the browser applies our changes
            void rightBlock.offsetWidth;
            
            // 8. Check position after setting
            console.log(`[Linkage] After positioning: L=${rightBlock.offsetLeft}, T=${rightBlock.offsetTop}`);
            
            // 9. Add brief visual feedback
            rightBlock.classList.add('snap-highlight');
            leftBlock.classList.add('snap-target');
            
            setTimeout(() => {
                rightBlock.classList.remove('snap-highlight');
                leftBlock.classList.remove('snap-target');
            }, 300);
        }
        catch(e) {
            console.error("[Linkage] Error in direct positioning:", e);
            
            // Fallback - simpler approach
            const leftWidth = leftBlock.offsetWidth;
            const targetX = leftBlock.offsetLeft + leftWidth - PUZZLE_CONNECTOR_WIDTH;
            const targetY = leftBlock.offsetTop;
            
            rightBlock.style.left = targetX + 'px';
            rightBlock.style.top = targetY + 'px';
        }
        finally {
            // Always restore the observer
            if (observer) {
                setupDOMObserver();
            }
        }
        
        console.log(`[Linkage] Connection completed: ${leftBlock.id} -> ${rightBlock.id}`);
    }
    
    // ========================================================================
    // Public API
    // ========================================================================
    window.registerNewBlockForLinkage = function(newBlockElement) {
         if (!newBlockElement) return;
         
         if (!newBlockElement.id) { 
             newBlockElement.id = generateUniqueBlockId(); 
         }
         
         try { 
             newBlockElement.style.position = 'absolute'; 
             // איפוס כל טרנספורם שעלול להשפיע
             newBlockElement.style.transform = '';
         } catch (e) { 
             console.error("Reg Error", e); 
         }
    };
    
    // Expose direct methods for external use
    window.directlySetPuzzleConnection = directlySetPuzzleConnection;
    window.enforceConnectionPosition = enforceConnectionPosition;
})();

console.log("linkageimproved.js script finished execution (FIXED DIRECT DOM MANIPULATION).");
