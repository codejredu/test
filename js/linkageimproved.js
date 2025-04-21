// ========================================================================
// Block Linkage System using Safe Release Mechanism
// Version: SAFE-RELEASE CONNECTION
// ========================================================================
(function() {
    // קונפיגורציה
    const PUZZLE_CONNECTOR_WIDTH = 8; // רוחב החיבור בפיקסלים
    const VERTICAL_ALIGNMENT_TOLERANCE = 30; // מרחק אנכי מקסימלי לחיבור
    const HORIZONTAL_SNAP_DISTANCE = 40; // מרחק אופקי מקסימלי לחיבור
    const RELEASE_DELAY = 50; // השהייה בין שחרור לחיבור (במילישניות)
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
    
    // מניעת ריצוד ולולאות אינסופיות
    let isProcessingConnection = false;
    let lastConnectionTime = 0;
    
    // ========================================================================
    // אתחול המערכת
    // ========================================================================
    function initSafeReleaseLinkageSystem() {
        console.log("[Safe Release] אתחול מערכת חיבורים עם שחרור מוגן...");
        
        // איתור אזור התכנות
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("[Safe Release] שגיאה: לא נמצא אזור #program-blocks");
            return;
        }
        
        // הוספת סגנונות
        addSafeReleaseStyles();
        
        // הגדרת מאזין ללחיצת עכבר
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("[Safe Release] מאזין mousedown נוסף בהצלחה");
        
        // הכנת בלוקים קיימים
        prepareExistingBlocks();
        
        // הוספת מאזין חירום לניקוי מצב תקוע
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                recoverFromStuckState();
            }
        });
        
        console.log("[Safe Release] מערכת אותחלה בהצלחה");
    }
    
    // הוספת סגנונות CSS הנדרשים למערכת
    function addSafeReleaseStyles() {
        if (document.getElementById('safe-release-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'safe-release-styles';
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
                transition: left 0.2s ease-out, top 0.2s ease-out;
            }
            
            .block-container.dragging {
                cursor: grabbing;
                z-index: 1000;
                transition: none;
            }
            
            .connecting {
                pointer-events: none;
            }
            
            .connection-complete {
                animation: connect-pulse 0.5s ease-out;
            }
            
            @keyframes connect-pulse {
                0% { box-shadow: 0 0 0 0px rgba(66, 133, 244, 0.5); }
                50% { box-shadow: 0 0 0 10px rgba(66, 133, 244, 0.2); }
                100% { box-shadow: 0 0 0 0px rgba(66, 133, 244, 0); }
            }
        `;
        
        document.head.appendChild(styleElement);
        console.log("[Safe Release] סגנונות נוספו");
    }
    
    // הכנת בלוקים קיימים
    function prepareExistingBlocks() {
        const blocks = programmingArea.querySelectorAll('.block-container');
        blocks.forEach(block => {
            if (!block.id) {
                block.id = generateUniqueBlockId();
            }
            
            // ודא שכל בלוק במיקום אבסולוטי
            if (block.style.position !== 'absolute') {
                block.style.position = 'absolute';
            }
        });
        
        console.log(`[Safe Release] הוכנו ${blocks.length} בלוקים קיימים`);
    }
    
    // יצירת מזהה ייחודי לבלוק
    function generateUniqueBlockId() {
        return `block-${Date.now()}-${nextBlockId++}`;
    }
    
    // ניקוי מצב תקוע
    function recoverFromStuckState() {
        console.log("[Safe Release] מבצע ניקוי מצב תקוע...");
        
        isProcessingConnection = false;
        
        // ניקוי הדגשות וסימונים
        document.querySelectorAll('.snap-highlight, .snap-target, .connecting, .connection-complete, .dragging').forEach(el => {
            el.classList.remove('snap-highlight', 'snap-target', 'connecting', 'connection-complete', 'dragging');
        });
        
        // ודא שאירועי העכבר כבר לא מאזינים
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // איפוס משתני מצב
        isDragging = false;
        draggedElement = null;
        potentialSnapTarget = null;
        
        console.log("[Safe Release] ניקוי מצב הושלם");
    }
    
    // ========================================================================
    // טיפול באירועי עכבר
    // ========================================================================
    function handleMouseDown(event) {
        // אם אנחנו באמצע עיבוד חיבור, יש לדלג
        if (isProcessingConnection) {
            console.log("[Safe Release] דילוג על אירוע mousedown כי מתבצע חיבור");
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
        
        // וידוא שהבלוק במיקום אבסולוטי
        if (draggedElement.style.position !== 'absolute') {
            draggedElement.style.position = 'absolute';
        }
        
        // הוסף מחלקת גרירה
        draggedElement.classList.add('dragging');
        
        // שמירת מיקום התחלתי
        initialMouseX = event.clientX;
        initialMouseY = event.clientY;
        
        // מיקום התחלתי של הבלוק (נשתמש במיקום המוחלט)
        const rect = draggedElement.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();
        initialElementX = rect.left - programRect.left;
        initialElementY = rect.top - programRect.top;
        
        // שבירת חיבורים קיימים
        breakExistingConnections(draggedElement);
        
        // הוספת מאזינים זמניים
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        if (ENABLE_LOGGING) {
            console.log(`[Safe Release] התחלת גרירה: ${draggedElement.id}`);
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
        
        // הסרת מאזינים זמניים מיד
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        const currentDraggedElement = draggedElement;
        const currentTarget = potentialSnapTarget;
        const currentDirection = snapDirection;
        
        // ניקוי הדגשות חזותיות
        clearSnapHighlights();
        
        // בדיקה אם יש יעד הצמדה
        if (currentTarget && programmingArea && programmingArea.contains(currentTarget)) {
            if (ENABLE_LOGGING) {
                console.log(`[Safe Release] הכנה לשחרור מוגן - בלוק: ${currentDraggedElement.id}, יעד: ${currentTarget.id}, כיוון: ${currentDirection}`);
            }
            
            // ביצוע שחרור מוגן
            safeReleaseAndConnect(currentDraggedElement, currentTarget, currentDirection);
        } else {
            // אין יעד הצמדה - הבלוק נשאר במקומו
            if (ENABLE_LOGGING) {
                console.log(`[Safe Release] אין יעד הצמדה - הבלוק ${currentDraggedElement.id} נשאר במיקומו הנוכחי`);
            }
            
            // ניקוי הבלוק
            currentDraggedElement.classList.remove('dragging');
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
                console.log(`[Safe Release] נמצא יעד הצמדה: ${bestTarget.id}, כיוון: ${snapDirection}, מרחק: ${closestDistance.toFixed(2)}px`);
            }
        }
    }
    
    // ניקוי הדגשות
    function clearSnapHighlights() {
        document.querySelectorAll('.snap-highlight, .snap-target').forEach(el => {
            el.classList.remove('snap-highlight', 'snap-target');
        });
    }
    
    // ========================================================================
    // מימוש שחרור מוגן וחיבור
    // ========================================================================
    function safeReleaseAndConnect(draggedBlock, targetBlock, direction) {
        // וידוא שהבלוקים תקינים
        if (!draggedBlock || !targetBlock || !programmingArea.contains(draggedBlock) || !programmingArea.contains(targetBlock)) {
            console.error("[Safe Release] בלוקים לא תקינים לחיבור");
            return;
        }
        
        // וידוא שאנחנו לא באמצע חיבור אחר
        if (isProcessingConnection) {
            console.warn("[Safe Release] דילוג על חיבור כי כבר מתבצע חיבור אחר");
            draggedBlock.classList.remove('dragging');
            return;
        }
        
        // וידוא שעבר מספיק זמן מהחיבור האחרון
        const now = Date.now();
        if (now - lastConnectionTime < 300) {
            console.warn("[Safe Release] דילוג על חיבור כי לא עבר מספיק זמן מהחיבור האחרון");
            draggedBlock.classList.remove('dragging');
            return;
        }
        
        lastConnectionTime = now;
        isProcessingConnection = true;
        
        // סימון הבלוקים כבמצב חיבור
        draggedBlock.classList.add('connecting');
        targetBlock.classList.add('connecting');
        
        // הסרת מחלקת גרירה
        draggedBlock.classList.remove('dragging');
        
        try {
            // שלב 1: הפסקת הגרירה - הבלוק כבר נמצא במיקום אחרי שחרור העכבר
            if (ENABLE_LOGGING) {
                console.log(`[Safe Release] שלב 1: הפסקת גרירה - בלוק ${draggedBlock.id} במיקום (${draggedBlock.style.left}, ${draggedBlock.style.top})`);
            }
            
            // שלב 2: עיכוב קצר לפני ביצוע החיבור
            setTimeout(() => {
                try {
                    if (ENABLE_LOGGING) {
                        console.log(`[Safe Release] שלב 2: ביצוע חיבור אחרי השהייה של ${RELEASE_DELAY}ms`);
                    }
                    
                    // שלב 3: קביעת סדר הבלוקים
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
                    
                    // שלב 4: חישוב המיקום החדש
                    // ה-leftBlock נשאר במקומו וה-rightBlock מוזז לפי הצורך
                    const newX = leftBlock.offsetLeft + leftBlock.offsetWidth - PUZZLE_CONNECTOR_WIDTH;
                    const newY = leftBlock.offsetTop;
                    
                    if (ENABLE_LOGGING) {
                        console.log(`[Safe Release] שלב 4: חישוב מיקום - הבלוק ${rightBlock.id} יוזז למיקום (${newX}, ${newY})`);
                    }
                    
                    // שלב 5: הגדרת אנימציה
                    rightBlock.style.transition = 'left 0.2s ease-out, top 0.2s ease-out';
                    
                    // שלב 6: קביעת המיקום החדש
                    rightBlock.style.left = `${newX}px`;
                    rightBlock.style.top = `${newY}px`;
                    
                    // שלב 7: עדכון קשרים לוגיים
                    leftBlock.dataset.rightBlockId = rightBlock.id;
                    rightBlock.dataset.leftBlockId = leftBlock.id;
                    
                    // שלב 8: הוספת מחוונים חזותיים
                    leftBlock.classList.add('connected-left');
                    rightBlock.classList.add('connected-right');
                    
                    // שלב 9: אנימציית השלמת החיבור
                    setTimeout(() => {
                        // הסרת מצב חיבור
                        leftBlock.classList.remove('connecting');
                        rightBlock.classList.remove('connecting');
                        
                        // הוספת אנימציית השלמה
                        leftBlock.classList.add('connection-complete');
                        rightBlock.classList.add('connection-complete');
                        
                        // הסרת אנימציית השלמה אחרי סיום
                        setTimeout(() => {
                            leftBlock.classList.remove('connection-complete');
                            rightBlock.classList.remove('connection-complete');
                            
                            // החזרת האפשרות לאינטראקציה
                            isProcessingConnection = false;
                            
                            if (ENABLE_LOGGING) {
                                console.log(`[Safe Release] שלב 9: חיבור הושלם בהצלחה בין ${leftBlock.id} ל-${rightBlock.id}`);
                            }
                        }, 600);
                        
                    }, 220);
                    
                } catch (innerError) {
                    console.error("[Safe Release] שגיאה בזמן חיבור:", innerError);
                    isProcessingConnection = false;
                    draggedBlock.classList.remove('connecting');
                    targetBlock.classList.remove('connecting');
                }
            }, RELEASE_DELAY);
            
        } catch (error) {
            console.error("[Safe Release] שגיאה בתהליך השחרור המוגן:", error);
            isProcessingConnection = false;
            draggedBlock.classList.remove('connecting', 'dragging');
            targetBlock.classList.remove('connecting');
        }
    }
    
    // פונקציה לשבירת חיבורים קיימים
    function breakExistingConnections(block) {
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
        
        if (ENABLE_LOGGING && (leftBlockId || rightBlockId)) {
            console.log(`[Safe Release] חיבורים נשברו לבלוק ${block.id}`);
        }
    }
    
    // ========================================================================
    // API ציבורי
    // ========================================================================
    window.registerNewBlockForSafeReleaseLinkage = function(newBlockElement){
        if (!newBlockElement) return;
        
        if (!newBlockElement.id) {
            newBlockElement.id = generateUniqueBlockId();
        }
        
        // וידוא שהבלוק במיקום אבסולוטי
        if (newBlockElement.style.position !== 'absolute') {
            newBlockElement.style.position = 'absolute';
        }
        
        if (ENABLE_LOGGING) {
            console.log(`[Safe Release] בלוק חדש נרשם: ${newBlockElement.id}`);
        }
    };
    
    // החלף את מערכת החיבורים הנוכחית
    if (window.registerNewBlockForLinkage) {
        console.log("[Safe Release] מחליף את מערכת החיבורים הקודמת");
        window.registerNewBlockForLinkage = window.registerNewBlockForSafeReleaseLinkage;
    }
    
    // הוסף לחלון פונקציית התאוששות
    window.recoverFromBlockConnectionStuckState = recoverFromStuckState;
    
    // הפעלת המערכת
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSafeReleaseLinkageSystem);
    } else {
        initSafeReleaseLinkageSystem();
    }
    
})();

console.log("Safe-release linkage system loaded");
