// ========================================================================
// Block Linkage System using Transform - FIXED DIRECTION
// Version: TRANSFORM-BASED CONNECTION v3
// ========================================================================
(function() {
    // קונפיגורציה
    const PUZZLE_CONNECTOR_WIDTH = 8; // רוחב החיבור בפיקסלים
    const VERTICAL_ALIGNMENT_TOLERANCE = 30; // מרחק אנכי מקסימלי לחיבור
    const HORIZONTAL_SNAP_DISTANCE = 40; // מרחק אופקי מקסימלי לחיבור
    const ENABLE_LOGGING = true; // האם להציג לוגים מפורטים
    
    // משתני מצב
    let isDragging = false;
    let draggedElement = null;
    let potentialSnapTarget = null;
    let initialMouseX = 0;
    let initialMouseY = 0;
    let initialElementX = 0;
    let initialElementY = 0;
    let programmingArea = null;
    let nextBlockId = 1;
    let snapDirection = 'none';
    
    // ========================================================================
    // אתחול המערכת
    // ========================================================================
    function initFixedDirectionSystem() {
        console.log("[FixedDirection] אתחול מערכת חיבורים מתוקנת...");
        
        // איתור אזור התכנות
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("[FixedDirection] שגיאה: לא נמצא אזור #program-blocks");
            return;
        }
        
        // הוספת סגנונות
        addFixedDirectionStyles();
        
        // הגדרת מאזין ללחיצת עכבר
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("[FixedDirection] מאזין mousedown נוסף בהצלחה");
        
        // הכנת בלוקים קיימים
        prepareExistingBlocks();
        
        // הוספת מאזין חירום
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                recoverFromStuckState();
            }
        });
        
        console.log("[FixedDirection] מערכת אותחלה בהצלחה");
    }
    
    // הוספת סגנונות CSS
    function addFixedDirectionStyles() {
        if (document.getElementById('fixed-direction-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'fixed-direction-styles';
        styleElement.textContent = `
            .snap-highlight {
                box-shadow: 0 0 0 3px #4285f4 !important;
                transition: box-shadow 0.2s ease-in-out;
            }
            
            .snap-target {
                box-shadow: 0 0 0 3px #34a853 !important;
                transition: box-shadow 0.2s ease-in-out;
            }
            
            .connected-left {
                box-shadow: -2px 0 0 1px #34a853 !important;
            }
            
            .connected-right {
                box-shadow: 2px 0 0 1px #4285f4 !important;
            }
            
            .block-container {
                cursor: grab;
                transition: all 0.25s ease-out;
            }
            
            .block-container.dragging {
                cursor: grabbing;
                z-index: 1000;
                transition: none;
            }
            
            .connection-animation {
                animation: connect-pulse 0.3s ease-out;
            }
            
            @keyframes connect-pulse {
                0% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.05); }
                100% { opacity: 1; transform: scale(1); }
            }
            
            .snap-direction-left:before {
                content: "◄";
                position: absolute;
                left: -15px;
                top: 50%;
                transform: translateY(-50%);
                color: #34a853;
                font-size: 14px;
            }
            
            .snap-direction-right:after {
                content: "►";
                position: absolute;
                right: -15px;
                top: 50%;
                transform: translateY(-50%);
                color: #4285f4;
                font-size: 14px;
            }
        `;
        
        document.head.appendChild(styleElement);
        console.log("[FixedDirection] סגנונות נוספו");
    }
    
    // הכנת בלוקים קיימים
    function prepareExistingBlocks() {
        const blocks = programmingArea.querySelectorAll('.block-container');
        blocks.forEach(block => {
            if (!block.id) {
                block.id = generateUniqueBlockId();
            }
            
            // וידוא שהבלוק במיקום אבסולוטי
            if (block.style.position !== 'absolute') {
                block.style.position = 'absolute';
            }
        });
        
        console.log(`[FixedDirection] הוכנו ${blocks.length} בלוקים קיימים`);
    }
    
    // יצירת מזהה ייחודי לבלוק
    function generateUniqueBlockId() {
        return `block-${Date.now()}-${nextBlockId++}`;
    }
    
    // פונקציית התאוששות ממצב תקוע
    function recoverFromStuckState() {
        console.log("[FixedDirection] מבצע ניקוי מצב תקוע...");
        
        // ניקוי הדגשות וסימונים
        document.querySelectorAll('.snap-highlight, .snap-target, .dragging, .connection-animation, .snap-direction-left, .snap-direction-right').forEach(el => {
            el.classList.remove('snap-highlight', 'snap-target', 'dragging', 'connection-animation', 'snap-direction-left', 'snap-direction-right');
        });
        
        // ודא שאירועי העכבר כבר לא מאזינים
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // איפוס משתני מצב
        isDragging = false;
        draggedElement = null;
        potentialSnapTarget = null;
        
        console.log("[FixedDirection] ניקוי מצב הושלם");
    }
    
    // ========================================================================
    // טיפול באירועי עכבר
    // ========================================================================
    function handleMouseDown(event) {
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea) return;
        
        event.preventDefault();
        isDragging = true;
        draggedElement = targetBlock;
        
        if (!draggedElement.id) {
            draggedElement.id = generateUniqueBlockId();
        }
        
        // הוסף מחלקת גרירה
        draggedElement.classList.add('dragging');
        
        // שמור מיקום התחלתי
        initialMouseX = event.clientX;
        initialMouseY = event.clientY;
        
        // זכור את המיקום האבסולוטי הנוכחי
        const computedStyle = window.getComputedStyle(draggedElement);
        initialElementX = parseInt(computedStyle.left) || 0;
        initialElementY = parseInt(computedStyle.top) || 0;
        
        // נתק קשרים קיימים
        disconnectBlock(draggedElement);
        
        // הוספת מאזינים זמניים
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        if (ENABLE_LOGGING) {
            console.log(`[FixedDirection] התחלת גרירה: ${draggedElement.id} ממיקום (${initialElementX}, ${initialElementY})`);
        }
    }
    
    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        
        const deltaX = event.clientX - initialMouseX;
        const deltaY = event.clientY - initialMouseY;
        
        const newX = initialElementX + deltaX;
        const newY = initialElementY + deltaY;
        
        // עדכון מיקום הבלוק
        draggedElement.style.left = `${newX}px`;
        draggedElement.style.top = `${newY}px`;
        
        // חיפוש יעד אפשרי להצמדה
        findSnapTarget();
    }
    
    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        
        // הסרת מאזינים זמניים
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        const currentDraggedElement = draggedElement;
        const currentTarget = potentialSnapTarget;
        const currentDirection = snapDirection;
        
        // הסרת מחלקת גרירה
        currentDraggedElement.classList.remove('dragging');
        currentDraggedElement.classList.remove('snap-direction-left', 'snap-direction-right');
        
        // ניקוי הדגשות
        clearSnapHighlights();
        
        // בדיקה אם יש יעד הצמדה
        if (currentTarget && programmingArea && programmingArea.contains(currentTarget) && currentDirection !== 'none') {
            if (ENABLE_LOGGING) {
                console.log(`[FixedDirection] ביצוע הצמדה - בלוק: ${currentDraggedElement.id}, יעד: ${currentTarget.id}, כיוון: ${currentDirection}`);
            }
            
            // ביצוע חיבור מתוקן
            connectBlocksInCorrectDirection(currentDraggedElement, currentTarget, currentDirection);
        } else {
            if (ENABLE_LOGGING) {
                console.log(`[FixedDirection] אין יעד הצמדה - הבלוק נשאר במיקומו הנוכחי`);
            }
        }
        
        // איפוס משתני מצב
        isDragging = false;
        draggedElement = null;
        potentialSnapTarget = null;
        snapDirection = 'none';
    }
    
    // ========================================================================
    // חיפוש יעד הצמדה
    // ========================================================================
    function findSnapTarget() {
        // ניקוי הדגשות קודמות
        clearSnapHighlights();
        potentialSnapTarget = null;
        snapDirection = 'none';
        
        if (!isDragging || !draggedElement || !programmingArea) return;
        
        // הסרת סימוני כיוון קודמים
        draggedElement.classList.remove('snap-direction-left', 'snap-direction-right');
        
        const dragRect = draggedElement.getBoundingClientRect();
        const blocks = programmingArea.querySelectorAll('.block-container');
        
        let closestDistance = HORIZONTAL_SNAP_DISTANCE;
        let bestTarget = null;
        
        blocks.forEach(block => {
            // דילוג על הבלוק עצמו
            if (block === draggedElement) return;
            
            const blockRect = block.getBoundingClientRect();
            
            // בדיקה אם הבלוקים קרובים מספיק אנכית
            const verticalDistance = Math.abs((dragRect.top + dragRect.height/2) - (blockRect.top + blockRect.height/2));
            if (verticalDistance > VERTICAL_ALIGNMENT_TOLERANCE) return;
            
            // בדיקת מרחק אופקי - האם הבלוק הנגרר קרוב מימין לבלוק הנבדק
            const distanceFromRight = Math.abs(dragRect.left - blockRect.right);
            if (distanceFromRight < closestDistance) {
                closestDistance = distanceFromRight;
                bestTarget = block;
                snapDirection = 'toLeft';  // הבלוק הנגרר יזוז שמאלה אל הבלוק היעד
            }
            
            // בדיקת מרחק אופקי - האם הבלוק הנגרר קרוב משמאל לבלוק הנבדק
            const distanceFromLeft = Math.abs(dragRect.right - blockRect.left);
            if (distanceFromLeft < closestDistance) {
                closestDistance = distanceFromLeft;
                bestTarget = block;
                snapDirection = 'toRight';  // הבלוק הנגרר יזוז ימינה אל הבלוק היעד
            }
        });
        
        // אם נמצא יעד מתאים, הדגש אותו
        if (bestTarget) {
            potentialSnapTarget = bestTarget;
            draggedElement.classList.add('snap-highlight');
            bestTarget.classList.add('snap-target');
            
            // הוסף סימון כיוון חזותי
            if (snapDirection === 'toLeft') {
                draggedElement.classList.add('snap-direction-left');
            } else if (snapDirection === 'toRight') {
                draggedElement.classList.add('snap-direction-right');
            }
            
            if (ENABLE_LOGGING) {
                console.log(`[FixedDirection] נמצא יעד הצמדה: ${bestTarget.id}, כיוון: ${snapDirection}, מרחק: ${closestDistance.toFixed(2)}px`);
            }
        }
    }
    
    // ניקוי הדגשות
    function clearSnapHighlights() {
        document.querySelectorAll('.snap-highlight, .snap-target').forEach(el => {
            el.classList.remove('snap-highlight', 'snap-target');
        });
    }
    
    // ניתוק בלוק מהחיבורים שלו
    function disconnectBlock(block) {
        if (!block) return;
        
        // בדיקה אם הבלוק מחובר לבלוק שמאלי
        const leftBlockId = block.dataset.leftBlockId;
        if (leftBlockId) {
            const leftBlock = document.getElementById(leftBlockId);
            if (leftBlock) {
                delete leftBlock.dataset.rightBlockId;
                leftBlock.classList.remove('connected-left');
                
                // איפוס המיקום של הבלוק הנוכחי
                block.style.left = block.getBoundingClientRect().left + 'px';
                block.style.top = block.getBoundingClientRect().top + 'px';
            }
            delete block.dataset.leftBlockId;
            block.classList.remove('connected-right');
        }
        
        // בדיקה אם הבלוק מחובר לבלוק ימני
        const rightBlockId = block.dataset.rightBlockId;
        if (rightBlockId) {
            const rightBlock = document.getElementById(rightBlockId);
            if (rightBlock) {
                delete rightBlock.dataset.leftBlockId;
                rightBlock.classList.remove('connected-right');
            }
            delete block.dataset.rightBlockId;
            block.classList.remove('connected-left');
        }
        
        // איפוס כל טרנספורם
        block.style.transform = '';
        
        if (ENABLE_LOGGING && (leftBlockId || rightBlockId)) {
            console.log(`[FixedDirection] ניתוק בלוק ${block.id} מהחיבורים שלו`);
        }
    }
    
    // ========================================================================
    // חיבור בלוקים עם כיוון נכון
    // ========================================================================
    function connectBlocksInCorrectDirection(draggedBlock, targetBlock, direction) {
        if (!draggedBlock || !targetBlock) return;
        
        try {
            if (ENABLE_LOGGING) {
                console.log(`[FixedDirection] התחלת חיבור בכיוון: ${direction}`);
                console.log(`  לפני חיבור - נגרר: (${draggedBlock.offsetLeft}, ${draggedBlock.offsetTop}), יעד: (${targetBlock.offsetLeft}, ${targetBlock.offsetTop})`);
            }
            
            // מיקום וגודל הבלוקים לפני החיבור
            const draggedRect = draggedBlock.getBoundingClientRect();
            const targetRect = targetBlock.getBoundingClientRect();
            
            // ניתוק כל חיבור קודם
            disconnectBlock(draggedBlock);
            disconnectBlock(targetBlock);
            
            let leftBlock, rightBlock;
            let newX, newY;
            
            if (direction === 'toRight') {
                // הבלוק הנגרר צריך לזוז ימינה - יהיה משמאל ליעד
                leftBlock = draggedBlock;
                rightBlock = targetBlock;
                
                // חישוב מיקום חדש לבלוק הימני (היעד)
                newX = draggedBlock.offsetLeft + draggedRect.width - PUZZLE_CONNECTOR_WIDTH;
                newY = draggedBlock.offsetTop;
                
                if (ENABLE_LOGGING) {
                    console.log(`  [toRight] הבלוק ${rightBlock.id} יזוז למיקום (${newX}, ${newY})`);
                }
                
                // עדכון מיקום הבלוק הימני
                rightBlock.style.left = `${newX}px`;
                rightBlock.style.top = `${newY}px`;
                
            } else if (direction === 'toLeft') {
                // הבלוק הנגרר צריך לזוז שמאלה - יהיה מימין ליעד
                leftBlock = targetBlock;
                rightBlock = draggedBlock;
                
                // חישוב מיקום חדש לבלוק הימני (הנגרר)
                newX = targetBlock.offsetLeft + targetRect.width - PUZZLE_CONNECTOR_WIDTH;
                newY = targetBlock.offsetTop;
                
                if (ENABLE_LOGGING) {
                    console.log(`  [toLeft] הבלוק ${rightBlock.id} יזוז למיקום (${newX}, ${newY})`);
                }
                
                // עדכון מיקום הבלוק הימני
                rightBlock.style.left = `${newX}px`;
                rightBlock.style.top = `${newY}px`;
            }
            
            // יצירת קשר לוגי בין הבלוקים
            leftBlock.dataset.rightBlockId = rightBlock.id;
            rightBlock.dataset.leftBlockId = leftBlock.id;
            
            // הוספת סימונים חזותיים
            leftBlock.classList.add('connected-left');
            rightBlock.classList.add('connected-right');
            
            // הוספת אנימציית חיבור
            leftBlock.classList.add('connection-animation');
            rightBlock.classList.add('connection-animation');
            
            // הסרת אנימציית החיבור לאחר זמן קצר
            setTimeout(() => {
                leftBlock.classList.remove('connection-animation');
                rightBlock.classList.remove('connection-animation');
                
                if (ENABLE_LOGGING) {
                    console.log(`  אחרי חיבור - שמאל: (${leftBlock.offsetLeft}, ${leftBlock.offsetTop}), ימין: (${rightBlock.offsetLeft}, ${rightBlock.offsetTop})`);
                    console.log(`[FixedDirection] חיבור הושלם בהצלחה`);
                }
            }, 300);
            
        } catch (e) {
            console.error("[FixedDirection] שגיאה בחיבור בלוקים:", e);
        }
    }
    
    // ========================================================================
    // API ציבורי
    // ========================================================================
    window.registerNewBlockForFixedDirection = function(newBlockElement){
        if (!newBlockElement) return;
        
        if (!newBlockElement.id) {
            newBlockElement.id = generateUniqueBlockId();
        }
        
        // וידוא שהבלוק במיקום אבסולוטי
        if (newBlockElement.style.position !== 'absolute') {
            newBlockElement.style.position = 'absolute';
        }
        
        if (ENABLE_LOGGING) {
            console.log(`[FixedDirection] בלוק חדש נרשם: ${newBlockElement.id}`);
        }
    };
    
    // פונקציה לחיבור שני בלוקים באופן חיצוני
    window.connectBlocksFixed = function(leftBlock, rightBlock) {
        if (!leftBlock || !rightBlock) {
            console.error("[FixedDirection] ניסיון לחבר בלוקים לא תקפים");
            return;
        }
        
        // המתודה דואגת שהבלוק הימני ימוקם נכון ביחס לשמאלי
        connectBlocksInCorrectDirection(rightBlock, leftBlock, 'toLeft');
    };
    
    // החלף את מערכת החיבורים הנוכחית
    if (window.registerNewBlockForLinkage) {
        console.log("[FixedDirection] מחליף את מערכת החיבורים הקודמת");
        window.registerNewBlockForLinkage = window.registerNewBlockForFixedDirection;
    }
    
    // הוסף פונקציית התאוששות לחלון
    window.recoverFromFixedDirectionStuckState = recoverFromStuckState;
    
    // הפעלת המערכת
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFixedDirectionSystem);
    } else {
        initFixedDirectionSystem();
    }
    
})();

console.log("Fixed direction linkage system loaded");
