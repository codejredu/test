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
    
    // מעקב אחרי שינויי DOM רלוונטיים - עם הגנת לולאה אינסופית
    function setupDOMObserver() {
        // גבול מקסימלי של עדכונים רצופים כדי למנוע לולאה אינסופית
        const MAX_CONSECUTIVE_UPDATES = 5;
        let updateCounter = 0;
        let lastUpdateTime = Date.now();
        
        // מעקב אחרי בלוקים שכבר עודכנו בסבב הנוכחי
        const updatedBlocks = new Set();
        
        // אנחנו רוצים לעקוב אחרי שינויים בתכונות החזותיות של האלמנטים
        observer = new MutationObserver(function(mutations) {
            // איפוס מונה העדכונים אם עבר מספיק זמן מהעדכון האחרון
            const now = Date.now();
            if (now - lastUpdateTime > 500) {
                updateCounter = 0;
                updatedBlocks.clear();
            }
            lastUpdateTime = now;
            
            // בדיקת גבול העדכונים הרצופים
            if (updateCounter >= MAX_CONSECUTIVE_UPDATES) {
                console.warn(`[Linkage] זוהתה אפשרות ללולאה אינסופית - עצירת מנגנון העדכון האוטומטי`);
                if (observer) observer.disconnect();
                return;
            }
            
            mutations.forEach(function(mutation) {
                // אם יש שינוי במיקום של אלמנט שכבר היינו אמורים לחבר
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'style' && 
                    mutation.target.classList.contains('block-container')) {
                    
                    // בדוק אם זה בלוק שאמור להיות מחובר למשהו
                    const blockElement = mutation.target;
                    const blockId = blockElement.id;
                    
                    // בדוק אם כבר עדכנו את הבלוק הזה בסבב הנוכחי
                    if (updatedBlocks.has(blockId)) {
                        return; // דלג על בלוקים שכבר עודכנו בסבב הנוכחי
                    }
                    
                    const leftBlockId = blockElement.dataset.leftBlockId;
                    const rightBlockId = blockElement.dataset.rightBlockId;
                    
                    if (leftBlockId || rightBlockId) {
                        // מצאנו בלוק שאמור להיות מחובר - נתקן את המיקום שלו
                        updateCounter++;
                        updatedBlocks.add(blockId);
                        
                        // מניעת שינויים נוספים בזמן העדכון הנוכחי
                        if (observer) observer.disconnect();
                        
                        try {
                            enforceConnectionPosition(blockElement);
                        } catch (e) {
                            console.error(`[Linkage] שגיאה בעדכון מיקום החיבור:`, e);
                        }
                        
                        // חידוש המעקב
                        if (observer && programmingArea) {
                            observer.observe(programmingArea, { 
                                attributes: true,
                                attributeFilter: ['style'],
                                childList: true,
                                subtree: true
                            });
                        }
                    }
                }
            });
        });
        
        // נפעיל את המעקב על כל האזור של הבלוקים
        if (programmingArea) {
            observer.observe(programmingArea, { 
                attributes: true,
                attributeFilter: ['style'],
                childList: true,
                subtree: true
            });
            
            console.log('[Linkage] מנגנון מעקב DOM הופעל עם הגנה מפני לולאות אינסופיות');
        } else {
            console.error('[Linkage] לא ניתן להפעיל מנגנון מעקב - אזור התכנות לא נמצא');
        }
    }
    
    // פונקציה בטוחה לאכיפת קשר בין בלוקים מחוברים
    function enforceConnectionPosition(blockElement) {
        if (!blockElement || !programmingArea) return;
        
        try {
            // הגבלת זמן ביצוע
            const startTime = performance.now();
            const MAX_EXECUTION_TIME = 500; // מקסימום 500 מילישניות
            
            const leftBlockId = blockElement.dataset.leftBlockId;
            const rightBlockId = blockElement.dataset.rightBlockId;
            
            // מניעת תקיעות - בדוק אם הבלוק הוא גם שמאלי וגם ימני לאותו בלוק (שגיאה לוגית)
            if (leftBlockId && rightBlockId && leftBlockId === rightBlockId) {
                console.error(`[Linkage] שגיאה לוגית - בלוק ${blockElement.id} מוגדר גם שמאלי וגם ימני לאותו בלוק ${leftBlockId}`);
                delete blockElement.dataset.leftBlockId;
                delete blockElement.dataset.rightBlockId;
                return;
            }
            
            if (leftBlockId) {
                // זה בלוק ימני שצריך להיות מחובר לבלוק שמאלי
                const leftBlock = document.getElementById(leftBlockId);
                if (leftBlock) {
                    console.log(`[Linkage] עדכון מיקום עבור ${blockElement.id} עם בלוק שמאלי ${leftBlockId}`);
                    directlySetPuzzleConnection(leftBlock, blockElement, true);
                    
                    // בדיקת חריגת זמן
                    if (performance.now() - startTime > MAX_EXECUTION_TIME) {
                        console.warn(`[Linkage] ביצוע החיבור לקח זמן רב מדי`);
                        return;
                    }
                } else {
                    // הבלוק השמאלי כבר לא קיים - נקה את הקשר
                    delete blockElement.dataset.leftBlockId;
                }
            }
            
            if (rightBlockId) {
                // זה בלוק שמאלי שצריך להיות מחובר לבלוק ימני
                const rightBlock = document.getElementById(rightBlockId);
                if (rightBlock) {
                    console.log(`[Linkage] עדכון מיקום עבור ${blockElement.id} עם בלוק ימני ${rightBlockId}`);
                    directlySetPuzzleConnection(blockElement, rightBlock, true);
                    
                    // בדיקת חריגת זמן
                    if (performance.now() - startTime > MAX_EXECUTION_TIME) {
                        console.warn(`[Linkage] ביצוע החיבור לקח זמן רב מדי`);
                        return;
                    }
                } else {
                    // הבלוק הימני כבר לא קיים - נקה את הקשר
                    delete blockElement.dataset.rightBlockId;
                }
            }
        } catch (e) {
            console.error(`[Linkage] שגיאה באכיפת קשר בין בלוקים:`, e);
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
    
    // פונקציה בסיסית ופשוטה לחיבור בלוקים
    function directlySetPuzzleConnection(leftBlock, rightBlock, isFromObserver = false) {
        if (!leftBlock || !rightBlock || leftBlock === rightBlock || !programmingArea) return;
        
        // מניעת לולאות אינסופיות - אם הבלוק השמאלי כבר מחובר לבלוק הימני, אין צורך לעשות שום דבר
        if (leftBlock.dataset.rightBlockId === rightBlock.id && rightBlock.dataset.leftBlockId === leftBlock.id) {
            // הקשר כבר קיים - בדוק אם המיקום נכון
            const expectedLeft = leftBlock.offsetLeft + leftBlock.offsetWidth - PUZZLE_CONNECTOR_WIDTH;
            const currentLeft = rightBlock.offsetLeft;
            const expectedTop = leftBlock.offsetTop;
            const currentTop = rightBlock.offsetTop;
            
            // אם המיקום כבר נכון, אין צורך לעשות שום דבר נוסף
            if (Math.abs(expectedLeft - currentLeft) < 2 && Math.abs(expectedTop - currentTop) < 2) {
                return;
            }
        }
        
        console.log(`[Linkage] פעולת חיבור פשוטה: ${leftBlock.id} -> ${rightBlock.id}`);
        
        // שלב 1: הגדרת הקשר בין הבלוקים
        leftBlock.dataset.rightBlockId = rightBlock.id;
        rightBlock.dataset.leftBlockId = leftBlock.id;
        
        // שלב 2: השבתה זמנית של המשקיף למניעת לולאות
        const observerWasActive = !!observer;
        if (observerWasActive && !isFromObserver) {
            observer.disconnect();
        }
        
        try {
            // שלב 3: חישוב המיקום הנכון
            const newLeft = leftBlock.offsetLeft + leftBlock.offsetWidth - PUZZLE_CONNECTOR_WIDTH;
            const newTop = leftBlock.offsetTop;
            
            // שלב 4: הגדרת המיקום
            rightBlock.style.position = 'absolute';
            
            // אם זה לא מהמשקיף, הוסף אנימציה חלקה
            if (!isFromObserver) {
                rightBlock.style.transition = 'left 0.2s ease-out, top 0.2s ease-out';
            } else {
                rightBlock.style.transition = 'none'; // אין אנימציה כשזה מהמשקיף
            }
            
            rightBlock.style.left = newLeft + 'px';
            rightBlock.style.top = newTop + 'px';
            
            // שלב 5: הוספת מחוונים חזותיים
            leftBlock.classList.add('connected-left');
            rightBlock.classList.add('connected-right');
            
            // הסרת האנימציה אחרי זמן קצר
            if (!isFromObserver) {
                setTimeout(() => {
                    rightBlock.style.transition = '';
                }, 250);
            }
        }
        catch(e) {
            console.error("[Linkage] שגיאה בפעולת החיבור:", e);
        }
        finally {
            // שחזור המשקיף אם היה פעיל ואם זו לא קריאה מהמשקיף עצמו
            if (observerWasActive && !isFromObserver && programmingArea) {
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

console.log("linkageimproved.js script finished execution (FIXED DIRECT DOM MANIPULATION).");
