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
    
    // מוסיף סגנונות CSS מותאמים עבור אנימציית החיבור
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
            
            /* סגנונות עבור בלוקים מחוברים */
            .connected-left {
                box-shadow: -2px 0 0 1px #34a853 !important;
                position: relative;
                z-index: 1;
            }
            
            .connected-right {
                box-shadow: 2px 0 0 1px #4285f4 !important;
                position: relative;
                z-index: 2;
            }
            
            /* אנימציית חיבור */
            .block-with-transition {
                transition: left 0.2s ease-out, top 0.2s ease-out !important;
            }
        `;
        document.head.appendChild(styleElement);
        console.log("[Linkage] נוספו סגנונות חזותיים");
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
        
        // הסרת מאזיני האירועים הגלובליים
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        
        // רישום מפורט של המצב בעת שחרור העכבר
        console.log(`[Linkage] עכבר שוחרר. בלוק: ${currentDraggedElement.id}, יעד: ${currentTarget ? currentTarget.id : 'אין'}, כיוון: ${currentDirection}`);
        console.log(`[Linkage] מיקום נוכחי - dragged: שמאל=${currentDraggedElement.offsetLeft}, למעלה=${currentDraggedElement.offsetTop}`);
        if (currentTarget) {
            console.log(`[Linkage] מיקום נוכחי - target: שמאל=${currentTarget.offsetLeft}, למעלה=${currentTarget.offsetTop}`);
        }
        
        // בצע הצמדה אם יש יעד מתאים
        if (isValidSnapTarget) {
            console.log(`[Linkage] מתחיל הצמדה בין בלוקים...`);
            
            try {
                // קביעת חיבור ברורה ופשוטה בהתאם לכיוון
                if (currentDirection === 'right') {
                    // סיטואציה: הבלוק הנגרר ימוקם מימין לבלוק היעד
                    console.log(`[Linkage] הבלוק ${currentDraggedElement.id} צריך להיות מימין ל-${currentTarget.id}`);
                    directlySetPuzzleConnection(currentTarget, currentDraggedElement);
                } else { 
                    // סיטואציה: הבלוק הנגרר ימוקם משמאל לבלוק היעד
                    console.log(`[Linkage] הבלוק ${currentDraggedElement.id} צריך להיות משמאל ל-${currentTarget.id}`);
                    directlySetPuzzleConnection(currentDraggedElement, currentTarget);
                }
            } catch (e) {
                console.error("[Linkage] שגיאה בביצוע חיבור הבלוקים:", e);
            }
        } else {
            // אין צורך בהצמדה, השאר במיקום הנוכחי
            console.log(`[Linkage] אין יעד הצמדה - הבלוק נשאר במיקום הנוכחי`);
        }
        
        // ניקוי סופי של כל ההדגשות והחיוויים
        clearSnapHighlighting();
        if (currentDraggedElement) {
            currentDraggedElement.style.zIndex = '';
            currentDraggedElement.style.cursor = '';
        }
        removeSnapAreaIndicator();
        
        // איפוס משתני המצב בסוף הפעולה
        isDragging = false;
        draggedElement = null;
        potentialSnapTarget = null;
        
        console.log("--- סיום פעולת MouseUp ---");
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
        
        // פשטות מקסימלית: בדיקה אם האלמנט הנגרר קרוב לאלמנט אחר
        let closestDistance = HORIZONTAL_SNAP_DISTANCE; 
        let bestTarget = null;
        
        const allBlocks = programmingArea.querySelectorAll('.block-container'); 
        allBlocks.forEach(block => { 
            if (block === draggedElement) return;
            
            const targetRect = block.getBoundingClientRect(); 
            if (targetRect.height <= 0 || targetRect.width <= 0) return;
            
            // בדיקה אנכית: האם הבלוקים קרובים מספיק אנכית
            const verticalMidpoint1 = dragRect.top + dragRect.height / 2;
            const verticalMidpoint2 = targetRect.top + targetRect.height / 2;
            const verticalDistance = Math.abs(verticalMidpoint1 - verticalMidpoint2);
            
            if (verticalDistance > VERTICAL_ALIGNMENT_TOLERANCE) return;
            
            // בדיקת קצה ימני של בלוק אחד מול קצה שמאלי של בלוק שני
            // זה מזהה אם הבלוק הנגרר צריך להיות מימין לבלוק היעד
            if (!block.dataset.rightBlockId) {
                const distanceRightToLeft = Math.abs(dragRect.left - targetRect.right);
                if (distanceRightToLeft < closestDistance) {
                    closestDistance = distanceRightToLeft;
                    bestTarget = block;
                    snapDirection = 'right'; // הבלוק הנגרר יהיה מימין לבלוק היעד
                    if (shouldLog) {
                        console.log(`[Linkage] מצאנו יעד פוטנציאלי. הבלוק ${draggedElement.id} יהיה מימין ל-${block.id}. מרחק=${distanceRightToLeft.toFixed(2)}px`);
                    }
                }
            }
            
            // בדיקת קצה שמאלי של בלוק אחד מול קצה ימני של בלוק שני
            // זה מזהה אם הבלוק הנגרר צריך להיות משמאל לבלוק היעד
            if (!block.dataset.leftBlockId) {
                const distanceLeftToRight = Math.abs(dragRect.right - targetRect.left);
                if (distanceLeftToRight < closestDistance) {
                    closestDistance = distanceLeftToRight;
                    bestTarget = block;
                    snapDirection = 'left'; // הבלוק הנגרר יהיה משמאל לבלוק היעד
                    if (shouldLog) {
                        console.log(`[Linkage] מצאנו יעד פוטנציאלי. הבלוק ${draggedElement.id} יהיה משמאל ל-${block.id}. מרחק=${distanceLeftToRight.toFixed(2)}px`);
                    }
                }
            }
        });
        
        if (bestTarget) { 
            potentialSnapTarget = bestTarget; 
            highlightSnapTarget(draggedElement, bestTarget);
            
            // הוספת חיווי ויזואלי
            if (snapDirection === 'right') {
                // הבלוק הנגרר אמור להיות מימין לבלוק היעד
                showSnapAreaIndicator(bestTarget, draggedElement);
            } else {
                // הבלוק הנגרר אמור להיות משמאל לבלוק היעד
                showSnapAreaIndicator(draggedElement, bestTarget);
            }
            
            if (shouldLog) {
                console.log(`[Linkage] היעד הטוב ביותר: ${bestTarget.id}, כיוון: ${snapDirection}`);
            }
        } else if (shouldLog) {
            console.log(`[Linkage] לא נמצא יעד מתאים להצמדה`);
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
    
    // פונקציה פשוטה יותר וישירה לטיפול בהצמדת בלוקים
    function directlySetPuzzleConnection(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        
        console.log(`[Linkage] חיבור בלוקים פשוט: ${leftBlock.id} -> ${rightBlock.id}`);
        
        // שלב 1: הגדרת קשרים בין הבלוקים
        leftBlock.dataset.rightBlockId = rightBlock.id;
        rightBlock.dataset.leftBlockId = leftBlock.id;
        
        // שלב 2: השבתה זמנית של המשקיף
        if (observer) observer.disconnect();
        
        try {
            // שלב 3: חישוב המיקום החדש בצורה פשוטה וישירה
            // הבלוק הימני צריך להיות ממוקם בדיוק בקצה הימני של הבלוק השמאלי פחות חפיפה של 8 פיקסלים
            const newLeft = leftBlock.offsetLeft + leftBlock.offsetWidth - PUZZLE_CONNECTOR_WIDTH;
            const newTop = leftBlock.offsetTop; // שמירה על אותו גובה
            
            console.log(`[Linkage] מיקום ישיר - מקור: שמאל=${rightBlock.offsetLeft} למעלה=${rightBlock.offsetTop}`);
            console.log(`[Linkage] מיקום ישיר - יעד: שמאל=${newLeft} למעלה=${newTop}`);
            
            // שלב 4: הוספת מעבר אנימציה לפני שינוי המיקום
            rightBlock.style.transition = 'left 0.2s ease-out, top 0.2s ease-out';
            
            // שלב 5: הגדרת מיקום חדש
            rightBlock.style.position = 'absolute';
            rightBlock.style.left = newLeft + 'px';
            rightBlock.style.top = newTop + 'px';
            
            // שלב 6: הוספת מחוונים חזותיים
            leftBlock.classList.add('connected-left');
            rightBlock.classList.add('connected-right');
            
            // שלב 7: רישום למטרות דיאגנוסטיקה
            console.log(`[Linkage] חיבור הושלם - מיקום סופי: שמאל=${rightBlock.offsetLeft}, למעלה=${rightBlock.offsetTop}`);
            
            // הסרת האנימציה לאחר השלמתה
            setTimeout(() => {
                rightBlock.style.transition = '';
            }, 250);
        }
        catch(e) {
            console.error("[Linkage] שגיאה בפעולת החיבור:", e);
        }
        finally {
            // שחזור המשקיף
            if (observer) {
                setupDOMObserver();
            }
        }
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

console.log("linkageimproved.js script finished execution (FIXED DIRECT DOM MANIPULATION).");// ========================================================================
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
    
    // מוסיף סגנונות CSS מותאמים עבור אנימציית החיבור
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
            
            /* סגנונות עבור בלוקים מחוברים */
            .connected-left {
                box-shadow: -2px 0 0 1px #34a853 !important;
                position: relative;
                z-index: 1;
            }
            
            .connected-right {
                box-shadow: 2px 0 0 1px #4285f4 !important;
                position: relative;
                z-index: 2;
            }
            
            /* אנימציית חיבור */
            .block-with-transition {
                transition: left 0.2s ease-out, top 0.2s ease-out !important;
            }
        `;
        document.head.appendChild(styleElement);
        console.log("[Linkage] נוספו סגנונות חזותיים");
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
        
        // שמירת מיקום נוכחי של האלמנט הנגרר
        const currentPosition = {
            x: currentDraggedElement.offsetLeft,
            y: currentDraggedElement.offsetTop
        };
        
        // הסר מאזינים גלובליים מיד
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        
        console.log(`[Linkage] עכבר שוחרר. יעד: ${currentTarget ? currentTarget.id : 'ללא'}, כיוון: ${currentDirection}`);
        
        // בצע הצמדה או מיקום סופי
        if (isValidSnapTarget) {
            console.log(`[Linkage] הצמדה: חיבור בלוקים בכיוון: ${currentDirection}`);
            
            try {
                // הוספת אנימציה חלקה
                currentDraggedElement.classList.add('block-with-transition');
                if (currentTarget) currentTarget.classList.add('block-with-transition');
                
                if (currentDirection === 'right') {
                    // בלוק היעד משמאל והבלוק הנגרר מימין
                    // כלומר, הבלוק הנגרר צריך להיות ממוקם מימין לבלוק היעד
                    directlySetPuzzleConnection(currentTarget, currentDraggedElement);
                    console.log(`[Linkage] חיבור משמאל-לימין: ${currentTarget.id} -> ${currentDraggedElement.id}`);
                } else {
                    // בלוק היעד מימין והבלוק הנגרר משמאל
                    // כלומר, הבלוק הנגרר צריך להיות ממוקם משמאל לבלוק היעד
                    directlySetPuzzleConnection(currentDraggedElement, currentTarget);
                    console.log(`[Linkage] חיבור משמאל-לימין: ${currentDraggedElement.id} -> ${currentTarget.id}`);
                }
                
                // הסרת מעבר האנימציה לאחר זמן קצר
                setTimeout(() => {
                    currentDraggedElement.classList.remove('block-with-transition');
                    if (currentTarget) currentTarget.classList.remove('block-with-transition');
                }, 300);
            } catch (e) {
                console.error("[Linkage] שגיאה בחיבור בלוקים:", e);
                // החזרת האלמנט למצב הקודם
                currentDraggedElement.style.left = currentPosition.x + 'px';
                currentDraggedElement.style.top = currentPosition.y + 'px';
            }
        } else {
            // אין הצמדה - המיקום האחרון מ-mousemove נשאר
            console.log(`[Linkage] אין יעד הצמדה - הבלוק יישאר במיקום הנוכחי`);
        }
        
        // ניקוי סופי
        clearSnapHighlighting();
        if(currentDraggedElement) {
             currentDraggedElement.style.zIndex = '';
             currentDraggedElement.style.cursor = '';
        }
        
        // הסר את אזור החיווי אם קיים
        removeSnapAreaIndicator();
        
        // אפס מצב גרירה - חשוב לעשות זאת רק בסוף כדי שלא נאבד התייחסות
        isDragging = false;
        draggedElement = null;
        potentialSnapTarget = null;
        
        console.log("--- סיום MouseUp ---");
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
        const dragLeftEdge = dragRect.left;
        const dragRightEdge = dragRect.right;
        const dragVerticalCenter = dragRect.top + dragRect.height / 2;
        
        let closestDistance = HORIZONTAL_SNAP_DISTANCE; 
        let bestTarget = null;
        
        const allBlocks = programmingArea.querySelectorAll('.block-container'); 
        allBlocks.forEach(block => { 
            if (block === draggedElement) return;
            
            const targetRect = block.getBoundingClientRect(); 
            if (targetRect.height <= 0 || targetRect.width <= 0) return;
            
            // נקודות חיבור של הבלוק הפוטנציאלי
            const targetLeftEdge = targetRect.left;
            const targetRightEdge = targetRect.right;
            const targetVerticalCenter = targetRect.top + targetRect.height / 2;
            
            // בדיקה אנכית - האם הבלוקים באותו גובה בערך
            const verticalDistance = Math.abs(dragVerticalCenter - targetVerticalCenter);
            if (verticalDistance >= VERTICAL_ALIGNMENT_TOLERANCE) return;
            
            // בדיקת חיבור מימין (דהיינו, הלבנה הנגררת משמאל לבלוק היעד)
            // בתצורה כזו, הצד הימני של הנגרר צריך להיות קרוב לצד השמאלי של היעד
            if (!block.dataset.leftBlockId) {
                const rightDistance = Math.abs(dragRightEdge - targetLeftEdge);
                
                if (rightDistance < closestDistance) {
                    closestDistance = rightDistance;
                    bestTarget = block;
                    snapDirection = 'left';  // הכיוון מציין את כיוון החיבור ביחס לבלוק היעד
                    
                    if (shouldLog) {
                        console.log(`[Linkage] Found potential connection: ${draggedElement.id} LEFT OF ${block.id}, distance=${rightDistance.toFixed(2)}px`);
                    }
                }
            }
            
            // בדיקת חיבור משמאל (דהיינו, הלבנה הנגררת מימין לבלוק היעד)
            // בתצורה כזו, הצד השמאלי של הנגרר צריך להיות קרוב לצד הימני של היעד
            if (!block.dataset.rightBlockId) {
                const leftDistance = Math.abs(dragLeftEdge - targetRightEdge);
                
                if (leftDistance < closestDistance) {
                    closestDistance = leftDistance;
                    bestTarget = block;
                    snapDirection = 'right';  // הכיוון מציין את כיוון החיבור ביחס לבלוק היעד
                    
                    if (shouldLog) {
                        console.log(`[Linkage] Found potential connection: ${draggedElement.id} RIGHT OF ${block.id}, distance=${leftDistance.toFixed(2)}px`);
                    }
                }
            }
        }); 
        
        if (bestTarget) { 
            potentialSnapTarget = bestTarget; 
            highlightSnapTarget(draggedElement, bestTarget); 
            
            // הוסף חיווי חזותי לאזור הצימוד
            if (snapDirection === 'right') {
                // הלבנה הנגררת אמורה להיות מימין לבלוק היעד
                showSnapAreaIndicator(bestTarget, draggedElement);
            } else {
                // הלבנה הנגררת אמורה להיות משמאל לבלוק היעד
                showSnapAreaIndicator(draggedElement, bestTarget);
            }
            
            if (shouldLog) console.log(`[Linkage] Best snap target: ${bestTarget.id}, direction: ${snapDirection}`); 
        } else { 
            if (shouldLog) console.log(`[Linkage] No suitable snap target found.`); 
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
        
        console.log(`[Linkage] חיבור בלוקים: ${leftBlock.id} -> ${rightBlock.id}`);
        
        // רישום מיקומים התחלתיים
        console.log(`[Linkage] לפני - שמאל [${leftBlock.id}]: שמאל=${leftBlock.offsetLeft}, למעלה=${leftBlock.offsetTop}, רוחב=${leftBlock.offsetWidth}`);
        console.log(`[Linkage] לפני - ימין [${rightBlock.id}]: שמאל=${rightBlock.offsetLeft}, למעלה=${rightBlock.offsetTop}`);
        
        // 1. יצירת קשר בין הבלוקים
        leftBlock.dataset.rightBlockId = rightBlock.id;
        rightBlock.dataset.leftBlockId = leftBlock.id;
        
        // 2. השבתה זמנית של המשקיף למניעת לולאות אינסופיות
        if (observer) observer.disconnect();
        
        try {
            // 3. חישוב המיקום הנכון לחיבור
            // השגת מימדים ומיקומים של הבלוק השמאלי
            const leftRect = leftBlock.getBoundingClientRect();
            const rightRect = rightBlock.getBoundingClientRect();
            
            // שמירת המיקום הנוכחי של הבלוק הימני לפני שינוי
            const originalRight = {
                x: rightBlock.offsetLeft,
                y: rightBlock.offsetTop
            };
            
            // חישוב מיקום ההצמדה עם חפיפה מתאימה
            // הבלוק הימני אמור לחפוף את הבלוק השמאלי בדיוק ב-PUZZLE_CONNECTOR_WIDTH פיקסלים
            const targetX = leftBlock.offsetLeft + leftBlock.offsetWidth - PUZZLE_CONNECTOR_WIDTH;
            
            // ליישור אנכי, נשמור את הבלוקים באותה רמה
            const targetY = leftBlock.offsetTop;
            
            console.log(`[Linkage] מיקום הבלוק הימני ב-X=${targetX}, Y=${targetY} (חפיפה=${PUZZLE_CONNECTOR_WIDTH}פיקסלים)`);
            
            // 4. ניקוי כל המאפיינים שעלולים להפריע
            rightBlock.style.transition = 'none';
            rightBlock.style.transform = '';
            
            // 5. הגדרת מיקום בסיסי ישירות עם מיקום אבסולוטי
            rightBlock.style.position = 'absolute';
            rightBlock.style.left = targetX + 'px';
            rightBlock.style.top = targetY + 'px';
            
            // 6. הוספת מחווני חיבור חזותיים
            leftBlock.classList.add('connected-left');
            rightBlock.classList.add('connected-right');
            
            // 7. אילוץ זרימת פריסה מחדש כדי להבטיח שהדפדפן מחיל את השינויים שלנו באופן מיידי
            void rightBlock.offsetWidth;
            
            // 8. בדיקת מיקום לאחר הגדרה לאימות
            console.log(`[Linkage] אחרי מיקום - בלוק ימני: שמאל=${rightBlock.offsetLeft}, למעלה=${rightBlock.offsetTop}`);
            
            // 9. הוספת משוב חזותי קצר לציון חיבור מוצלח
            rightBlock.classList.add('snap-highlight');
            leftBlock.classList.add('snap-target');
            
            // בדיקה אם הבלוק קפץ במקום להתחבר הלאה
            if (originalRight.x > targetX + 50) {
                console.warn(`[Linkage] זוהתה קפיצה אחורה! מיקום מקורי: ${originalRight.x}, מיקום יעד: ${targetX}`);
                
                // נסיון תיקון - החזרת הבלוק למיקום הקודם ואז אנימציה
                rightBlock.style.transition = 'none';
                rightBlock.style.left = originalRight.x + 'px';
                rightBlock.style.top = originalRight.y + 'px';
                
                // אילוץ עיבוד מחדש
                void rightBlock.offsetWidth;
                
                // אנימציה למיקום החדש
                rightBlock.style.transition = 'left 0.2s ease-out, top 0.2s ease-out';
                setTimeout(() => {
                    rightBlock.style.left = targetX + 'px';
                    rightBlock.style.top = targetY + 'px';
                }, 50);
            }
            
            setTimeout(() => {
                rightBlock.classList.remove('snap-highlight');
                leftBlock.classList.remove('snap-target');
                rightBlock.style.transition = '';  // הסרת אנימציה לאחר סיום
            }, 300);
            
            // 10. הצגת הודעת הצלחה
            if (ENABLE_DETAILED_SNAP_LOGGING) {
                console.log(`[Linkage] חיבור בלוקים הושלם בהצלחה עם חפיפה של ${PUZZLE_CONNECTOR_WIDTH} פיקסלים`);
            }
        }
        catch(e) {
            console.error("[Linkage] שגיאה במיקום ישיר:", e);
            
            // גישה חלופית - פשוטה יותר במקרה של כישלון בגישה הראשית
            try {
                const leftWidth = leftBlock.offsetWidth;
                const targetX = leftBlock.offsetLeft + leftWidth - PUZZLE_CONNECTOR_WIDTH;
                const targetY = leftBlock.offsetTop;
                
                // אנימציה חלקה
                rightBlock.style.transition = 'left 0.2s ease-out, top 0.2s ease-out';
                rightBlock.style.left = targetX + 'px';
                rightBlock.style.top = targetY + 'px';
                
                console.log(`[Linkage] שימוש בשיטת מיקום חלופית: X=${targetX}, Y=${targetY}`);
            } catch (fallbackError) {
                console.error("[Linkage] גם שיטת המיקום החלופית נכשלה:", fallbackError);
            }
        }
        finally {
            // תמיד שחזר את המשקיף
            if (observer) {
                setupDOMObserver();
            }
        }
        
        console.log(`[Linkage] החיבור הושלם: ${leftBlock.id} -> ${rightBlock.id}`);
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
