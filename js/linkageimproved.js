// ========================================================================
// Block Linkage System using Transform (Pixel Offset) - FIXED & IMPROVED
// Version: TRANSFORM-BASED CONNECTION v2
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
    let snapDirection = 'right';
    
    // מניעת תקיעה
    let isProcessingConnection = false;
    let lastConnectionTime = 0;
    
    // ========================================================================
    // אתחול המערכת
    // ========================================================================
    function initImprovedTransformSystem() {
        console.log("[Transform v2] אתחול מערכת חיבורים מבוססת Transform משופרת...");
        
        // איתור אזור התכנות
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("[Transform v2] שגיאה: לא נמצא אזור #program-blocks");
            return;
        }
        
        // הוספת סגנונות
        addImprovedTransformStyles();
        
        // הגדרת מאזין ללחיצת עכבר
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("[Transform v2] מאזין mousedown נוסף בהצלחה");
        
        // הכנת בלוקים קיימים
        prepareExistingBlocks();
        
        // הוספת מאזין חירום
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                recoverFromStuckState();
            }
        });
        
        console.log("[Transform v2] מערכת אותחלה בהצלחה");
    }
    
    // הוספת סגנונות CSS הנדרשים למערכת
    function addImprovedTransformStyles() {
        if (document.getElementById('transform-v2-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'transform-v2-styles';
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
                transition: transform 0.25s ease-out;
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
        `;
        
        document.head.appendChild(styleElement);
        console.log("[Transform v2] סגנונות נוספו");
    }
    
    // הכנת בלוקים קיימים
    function prepareExistingBlocks() {
        const blocks = programmingArea.querySelectorAll('.block-container');
        blocks.forEach(block => {
            if (!block.id) {
                block.id = generateUniqueBlockId();
            }
            
            // איפוס כל טרנספורם קיים
            block.style.transform = '';
            
            // וידוא שהבלוק במיקום אבסולוטי
            if (block.style.position !== 'absolute') {
                block.style.position = 'absolute';
            }
        });
        
        console.log(`[Transform v2] הוכנו ${blocks.length} בלוקים קיימים`);
    }
    
    // יצירת מזהה ייחודי לבלוק
    function generateUniqueBlockId() {
        return `block-${Date.now()}-${nextBlockId++}`;
    }
    
    // פונקציית התאוששות ממצב תקוע
    function recoverFromStuckState() {
        console.log("[Transform v2] מבצע ניקוי מצב תקוע...");
        
        isProcessingConnection = false;
        
        // ניקוי הדגשות וסימונים
        document.querySelectorAll('.snap-highlight, .snap-target, .dragging, .connection-animation').forEach(el => {
            el.classList.remove('snap-highlight', 'snap-target', 'dragging', 'connection-animation');
        });
        
        // ודא שאירועי העכבר כבר לא מאזינים
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // איפוס משתני מצב
        isDragging = false;
        draggedElement = null;
        potentialSnapTarget = null;
        
        console.log("[Transform v2] ניקוי מצב הושלם");
    }
    
    // ========================================================================
    // טיפול באירועי עכבר
    // ========================================================================
    function handleMouseDown(event) {
        // אם אנחנו באמצע עיבוד חיבור, יש לדלג
        if (isProcessingConnection) {
            console.log("[Transform v2] דילוג על אירוע mousedown כי מתבצע חיבור");
            return;
        }
        
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
        
        // טפל בטרנספורם קיים אם יש
        const currentTransform = computedStyle.transform;
        if (currentTransform && currentTransform !== 'none') {
            // איפוס טרנספורם
            draggedElement.style.transform = '';
            
            // ניתוק קשרים קיימים
            breakConnections(draggedElement);
        }
        
        // וידוא שהבלוק במיקום אבסולוטי
        if (draggedElement.style.position !== 'absolute') {
            draggedElement.style.position = 'absolute';
        }
        
        // הוספת מאזינים זמניים
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        if (ENABLE_LOGGING) {
            console.log(`[Transform v2] התחלת גרירה: ${draggedElement.id} ממיקום (${initialElementX}, ${initialElementY})`);
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
        
        // ניקוי הדגשות
        clearSnapHighlights();
        
        // בדיקה אם יש יעד הצמדה
        if (currentTarget && programmingArea && programmingArea.contains(currentTarget)) {
            if (ENABLE_LOGGING) {
                console.log(`[Transform v2] ביצוע הצמדה - בלוק: ${currentDraggedElement.id}, יעד: ${currentTarget.id}, כיוון: ${currentDirection}`);
            }
            
            // ביצוע חיבור עם טרנספורם
            connectBlocksWithImprovedTransform(currentDraggedElement, currentTarget, currentDirection);
        } else {
            if (ENABLE_LOGGING) {
                console.log(`[Transform v2] אין יעד הצמדה - הבלוק נשאר במיקומו הנוכחי`);
            }
        }
        
        // איפוס משתני מצב
        isDragging = false;
        draggedElement = null;
        potentialSnapTarget = null;
    }
    
    // ========================================================================
    // חיפוש יעד הצמדה
    // ========================================================================
    function findSnapTarget() {
        // ניקוי הדגשות קודמות
        clearSnapHighlights();
        potentialSnapTarget = null;
        
        if (!isDragging || !draggedElement || !programmingArea) return;
        
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
                snapDirection = 'right'; // הבלוק הנגרר יהיה מימין לבלוק היעד
            }
            
            // בדיקת מרחק אופקי - האם הבלוק הנגרר קרוב משמאל לבלוק הנבדק
            const distanceFromLeft = Math.abs(dragRect.right - blockRect.left);
            if (distanceFromLeft < closestDistance) {
                closestDistance = distanceFromLeft;
                bestTarget = block;
                snapDirection = 'left'; // הבלוק הנגרר יהיה משמאל לבלוק היעד
            }
        });
        
        // אם נמצא יעד מתאים, הדגש אותו
        if (bestTarget) {
            potentialSnapTarget = bestTarget;
            draggedElement.classList.add('snap-highlight');
            bestTarget.classList.add('snap-target');
            
            if (ENABLE_LOGGING) {
                console.log(`[Transform v2] נמצא יעד הצמדה: ${bestTarget.id}, כיוון: ${snapDirection}, מרחק: ${closestDistance.toFixed(2)}px`);
            }
        }
    }
    
    // ניקוי הדגשות
    function clearSnapHighlights() {
        document.querySelectorAll('.snap-highlight, .snap-target').forEach(el => {
            el.classList.remove('snap-highlight', 'snap-target');
        });
    }
    
    // ניתוק חיבורים קיימים
    function breakConnections(block) {
        // בדיקה אם הבלוק מחובר לבלוק שמאלי
        const leftBlockId = block.dataset.leftBlockId;
        if (leftBlockId) {
            const leftBlock = document.getElementById(leftBlockId);
            if (leftBlock) {
                delete leftBlock.dataset.rightBlockId;
                leftBlock.classList.remove('connected-left');
            }
            delete block.dataset.leftBlockId;
            block.classList.remove('connected-right');
            
            if (ENABLE_LOGGING) {
                console.log(`[Transform v2] נותק חיבור עם בלוק שמאלי: ${leftBlockId}`);
            }
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
            
            if (ENABLE_LOGGING) {
                console.log(`[Transform v2] נותק חיבור עם בלוק ימני: ${rightBlockId}`);
            }
        }
    }
    
    // ========================================================================
    // חיבור בלוקים עם טרנספורם משופר
    // ========================================================================
    function connectBlocksWithImprovedTransform(draggedBlock, targetBlock, direction) {
        // וידוא שהבלוקים תקפים
        if (!draggedBlock || !targetBlock || !programmingArea.contains(draggedBlock) || !programmingArea.contains(targetBlock)) {
            console.error("[Transform v2] בלוקים לא תקפים לחיבור");
            return;
        }
        
        // וידוא שאנחנו לא באמצע חיבור אחר
        if (isProcessingConnection) {
            console.warn("[Transform v2] דילוג על חיבור כי כבר מתבצע חיבור אחר");
            return;
        }
        
        // וידוא שעבר מספיק זמן מהחיבור האחרון
        const now = Date.now();
        if (now - lastConnectionTime < 300) {
            console.warn("[Transform v2] דילוג על חיבור כי לא עבר מספיק זמן מהחיבור האחרון");
            return;
        }
        
        lastConnectionTime = now;
        isProcessingConnection = true;
        
        try {
            // קביעת סדר הבלוקים לפי כיוון החיבור
            let leftBlock, rightBlock;
            
            if (direction === 'right') {
                // הבלוק הנגרר יהיה מימין לבלוק היעד
                leftBlock = targetBlock;
                rightBlock = draggedBlock;
            } else {
                // הבלוק הנגרר יהיה משמאל לבלוק היעד
                leftBlock = draggedBlock;
                rightBlock = targetBlock;
            }
            
            // רישום מידע לפני חיבור
            const leftRect = leftBlock.getBoundingClientRect();
            const rightRect = rightBlock.getBoundingClientRect();
            
            if (ENABLE_LOGGING) {
                console.log(`[Transform v2] לפני חיבור - שמאל: (${leftRect.left}, ${leftRect.top}), ימין: (${rightRect.left}, ${rightRect.top})`);
            }
            
            // ניתוק כל חיבור קיים
            breakConnections(leftBlock);
            breakConnections(rightBlock);
            
            // חישוב הסט מעודכן - בבוק ימני צריך להיות מוזז כך שיהיה בדיוק מימין לבלוק שמאלי עם חפיפה
            // נחשב את המרחק בין הקצה הימני של השמאלי לקצה השמאלי של הימני
            // ניקח בחשבון את תחילת הבלוק (left) ואת רוחב הבלוק
            const leftBlockLeft = parseInt(leftBlock.style.left) || 0;
            const leftBlockWidth = leftRect.width;
            const rightBlockLeft = parseInt(rightBlock.style.left) || 0;
            
            // המיקום הרצוי של הבלוק הימני: תחילת השמאלי + רוחב השמאלי - רוחב החפיפה
            const desiredRightBlockLeft = leftBlockLeft + leftBlockWidth - PUZZLE_CONNECTOR_WIDTH;
            
            // ההסט הדרוש: המיקום הרצוי פחות המיקום הנוכחי
            const offsetX = desiredRightBlockLeft - rightBlockLeft;
            
            // חישוב הסט האנכי - נרצה שהבלוקים יהיו באותו גובה
            const leftBlockTop = parseInt(leftBlock.style.top) || 0;
            const rightBlockTop = parseInt(rightBlock.style.top) || 0;
            const offsetY = leftBlockTop - rightBlockTop;
            
            if (ENABLE_LOGGING) {
                console.log(`[Transform v2] חישוב הסט: X=${offsetX}px, Y=${offsetY}px`);
                console.log(`[Transform v2] מיקום רצוי לבלוק ימני: ${desiredRightBlockLeft}px`);
            }
            
            // הגדרת טרנספורם לבלוק הימני
            rightBlock.style.transition = 'transform 0.25s ease-out';
            rightBlock.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            
            // סימון חזותי לבלוקים מחוברים
            leftBlock.classList.add('connected-left');
            rightBlock.classList.add('connected-right');
            
            // הוספת אנימציית חיבור
            leftBlock.classList.add('connection-animation');
            rightBlock.classList.add('connection-animation');
            
            // יצירת קשר לוגי בין הבלוקים
            leftBlock.dataset.rightBlockId = rightBlock.id;
            rightBlock.dataset.leftBlockId = leftBlock.id;
            
            // הסרת אנימציית החיבור לאחר סיום
            setTimeout(() => {
                leftBlock.classList.remove('connection-animation');
                rightBlock.classList.remove('connection-animation');
                
                // סיום עיבוד החיבור
                isProcessingConnection = false;
                
                if (ENABLE_LOGGING) {
                    const newRightRect = rightBlock.getBoundingClientRect();
                    console.log(`[Transform v2] לאחר חיבור - ימין: (${newRightRect.left}, ${newRightRect.top})`);
                    console.log(`[Transform v2] חיבור הושלם בהצלחה`);
                }
            }, 300);
            
        } catch (e) {
            console.error("[Transform v2] שגיאה בחיבור בלוקים:", e);
            
            // איפוס מצב במקרה של שגיאה
            isProcessingConnection = false;
            
            // ניסיון לנקות את הטרנספורם
            if (draggedBlock) {
                draggedBlock.style.transform = '';
            }
        }
    }
    
    // ========================================================================
    // API ציבורי
    // ========================================================================
    window.registerNewBlockForImprovedTransform = function(newBlockElement){
        if (!newBlockElement) return;
        
        if (!newBlockElement.id) {
            newBlockElement.id = generateUniqueBlockId();
        }
        
        // איפוס טרנספורם
        newBlockElement.style.transform = '';
        
        // וידוא שהבלוק במיקום אבסולוטי
        if (newBlockElement.style.position !== 'absolute') {
            newBlockElement.style.position = 'absolute';
        }
        
        if (ENABLE_LOGGING) {
            console.log(`[Transform v2] בלוק חדש נרשם: ${newBlockElement.id}`);
        }
    };
    
    // פונקציה לחיבור שני בלוקים באופן חיצוני
    window.connectBlocksWithTransform = function(block1, block2) {
        if (!block1 || !block2) {
            console.error("[Transform v2] ניסיון לחבר בלוקים לא תקפים");
            return;
        }
        
        // חיבור עם בלוק1 משמאל לבלוק2
        connectBlocksWithImprovedTransform(block2, block1, 'right');
    };
    
    // החלף את מערכת החיבורים הנוכחית
    if (window.registerNewBlockForLinkage) {
        console.log("[Transform v2] מחליף את מערכת החיבורים הקודמת");
        window.registerNewBlockForLinkage = window.registerNewBlockForImprovedTransform;
    }
    
    // הוסף פונקציית התאוששות לחלון
    window.recoverFromTransformV2StuckState = recoverFromStuckState;
    
    // הפעלת המערכת
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImprovedTransformSystem);
    } else {
        initImprovedTransformSystem();
    }
    
})();

console.log("Improved transform-based linkage system loaded");
