// ========================================================================
// Block Linkage System using Transform (Pixel Offset)
// Version: TRANSFORM-BASED CONNECTION
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
    
    // מעקב אחרי בלוקים מחוברים
    let connectedBlocks = new Map(); // מפה שמכילה רשימת חיבורים לכל בלוק
    
    // ========================================================================
    // אתחול המערכת
    // ========================================================================
    function initTransformLinkageSystem() {
        console.log("[Transform Linkage] אתחול מערכת חיבורים מבוססת Transform...");
        
        // איתור אזור התכנות
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("[Transform Linkage] שגיאה: לא נמצא אזור #program-blocks");
            return;
        }
        
        // הוספת סגנונות
        addTransformStyles();
        
        // הגדרת מאזין ללחיצת עכבר
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("[Transform Linkage] מאזין mousedown נוסף בהצלחה");
        
        // הכנת בלוקים קיימים
        prepareExistingBlocks();
        
        console.log("[Transform Linkage] מערכת אותחלה בהצלחה");
    }
    
    // הוספת סגנונות CSS הנדרשים למערכת
    function addTransformStyles() {
        if (document.getElementById('transform-linkage-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'transform-linkage-styles';
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
                transition: transform 0.2s ease-out;
            }
            
            .block-container.dragging {
                cursor: grabbing;
                z-index: 1000;
                transition: none;
            }
            
            .block-parent {
                position: absolute;
                pointer-events: none;
            }
            
            .block-child {
                pointer-events: auto;
            }
        `;
        
        document.head.appendChild(styleElement);
        console.log("[Transform Linkage] סגנונות Transform נוספו");
    }
    
    // הכנת בלוקים קיימים
    function prepareExistingBlocks() {
        const blocks = programmingArea.querySelectorAll('.block-container');
        blocks.forEach(block => {
            if (!block.id) {
                block.id = generateUniqueBlockId();
            }
            
            // ודא שאין transform קיים
            block.style.transform = '';
        });
        
        console.log(`[Transform Linkage] הוכנו ${blocks.length} בלוקים קיימים`);
    }
    
    // יצירת מזהה ייחודי לבלוק
    function generateUniqueBlockId() {
        return `block-${Date.now()}-${nextBlockId++}`;
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
        
        const rect = draggedElement.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(draggedElement);
        let transform = computedStyle.transform;
        
        // אם יש טרנספורם קיים, נשמור את המיקום האבסולוטי הנוכחי
        if (transform && transform !== 'none') {
            // מיקום אבסולוטי מחושב
            const programRect = programmingArea.getBoundingClientRect();
            initialElementX = rect.left - programRect.left;
            initialElementY = rect.top - programRect.top;
            
            // איפוס הטרנספורם כך שנוכל לגרור מהמיקום האמיתי
            draggedElement.style.transform = '';
            
            // עדכון המיקום האבסולוטי לאחר איפוס הטרנספורם
            draggedElement.style.left = `${initialElementX}px`;
            draggedElement.style.top = `${initialElementY}px`;
        } else {
            // אם אין טרנספורם, נשתמש במיקום ה-CSS הנוכחי
            initialElementX = parseInt(computedStyle.left) || 0;
            initialElementY = parseInt(computedStyle.top) || 0;
        }
        
        // ברר אם הבלוק מחובר לבלוקים אחרים
        const connections = getBlockConnections(draggedElement.id);
        
        // נתק את כל החיבורים של הבלוק
        if (connections.length > 0) {
            disconnectBlock(draggedElement.id);
        }
        
        // הוספת מאזינים זמניים
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        if (ENABLE_LOGGING) {
            console.log(`[Transform Linkage] התחלת גרירה: ${draggedElement.id}`);
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
        
        // הסרת מחלקת גרירה
        draggedElement.classList.remove('dragging');
        
        const currentDraggedElement = draggedElement;
        const currentTarget = potentialSnapTarget;
        
        // ניקוי הדגשות
        clearHighlights();
        
        // בדיקה אם יש יעד הצמדה
        if (currentTarget && programmingArea && programmingArea.contains(currentTarget)) {
            if (ENABLE_LOGGING) {
                console.log(`[Transform Linkage] ביצוע הצמדה - בלוק: ${currentDraggedElement.id}, יעד: ${currentTarget.id}, כיוון: ${snapDirection}`);
            }
            
            // ביצוע חיבור באמצעות טרנספורם
            connectBlocksWithTransform(currentDraggedElement, currentTarget, snapDirection);
        } else {
            if (ENABLE_LOGGING) {
                console.log(`[Transform Linkage] אין יעד הצמדה - הבלוק נשאר במיקומו הנוכחי`);
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
        clearHighlights();
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
                console.log(`[Transform Linkage] נמצא יעד הצמדה: ${bestTarget.id}, כיוון: ${snapDirection}, מרחק: ${closestDistance.toFixed(2)}px`);
            }
        }
    }
    
    // ניקוי הדגשות
    function clearHighlights() {
        document.querySelectorAll('.snap-highlight, .snap-target').forEach(el => {
            el.classList.remove('snap-highlight', 'snap-target');
        });
    }
    
    // ========================================================================
    // חיבור בלוקים באמצעות Transform
    // ========================================================================
    function connectBlocksWithTransform(draggedBlock, targetBlock, direction) {
        try {
            let leftBlock, rightBlock;
            
            // קביעת סדר הבלוקים לפי כיוון החיבור
            if (direction === 'right') {
                // הבלוק הנגרר יהיה מימין לבלוק היעד
                leftBlock = targetBlock;
                rightBlock = draggedBlock;
            } else {
                // הבלוק הנגרר יהיה משמאל לבלוק היעד
                leftBlock = draggedBlock;
                rightBlock = targetBlock;
            }
            
            // חישוב ההסט
            const leftRect = leftBlock.getBoundingClientRect();
            const rightRect = rightBlock.getBoundingClientRect();
            
            // חישוב ההסט בפיקסלים שהבלוק הימני צריך לנוע כדי להיות בחפיפה עם הבלוק השמאלי
            const offsetX = (leftRect.right - PUZZLE_CONNECTOR_WIDTH) - rightRect.left;
            const offsetY = leftRect.top - rightRect.top;
            
            if (ENABLE_LOGGING) {
                console.log(`[Transform Linkage] חישוב הסט: X=${offsetX}px, Y=${offsetY}px`);
                console.log(`[Transform Linkage] מיקום לפני הסט - שמאל: ${leftRect.left}, ${leftRect.top}, ימין: ${rightRect.left}, ${rightRect.top}`);
            }
            
            // הגדרת טרנספורמציה לבלוק הימני
            rightBlock.style.transition = 'transform 0.2s ease-out';
            rightBlock.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            
            // זיהוי חזותי לבלוקים מחוברים
            leftBlock.classList.add('connected-left');
            rightBlock.classList.add('connected-right');
            
            // יצירת קשר לוגי בין הבלוקים
            leftBlock.dataset.rightBlockId = rightBlock.id;
            rightBlock.dataset.leftBlockId = leftBlock.id;
            
            // שמירת החיבור במפת החיבורים
            addConnection(leftBlock.id, rightBlock.id);
            
            // הפעלת אירוע לבדיקת חיבור תקין
            setTimeout(() => {
                const newRightRect = rightBlock.getBoundingClientRect();
                if (ENABLE_LOGGING) {
                    console.log(`[Transform Linkage] מיקום אחרי הסט - ימין: ${newRightRect.left}, ${newRightRect.top}`);
                    console.log(`[Transform Linkage] טרנספורם סופי: ${rightBlock.style.transform}`);
                }
            }, 250);
            
        } catch (e) {
            console.error("[Transform Linkage] שגיאה בחיבור בלוקים:", e);
            // איפוס הטרנספורם במקרה של שגיאה
            draggedBlock.style.transform = '';
        }
    }
    
    // ========================================================================
    // ניהול חיבורים
    // ========================================================================
    
    // הוספת חיבור בין שני בלוקים
    function addConnection(leftBlockId, rightBlockId) {
        // אתחול המפה אם צריך
        if (!connectedBlocks.has(leftBlockId)) {
            connectedBlocks.set(leftBlockId, { left: null, right: rightBlockId });
        } else {
            connectedBlocks.get(leftBlockId).right = rightBlockId;
        }
        
        if (!connectedBlocks.has(rightBlockId)) {
            connectedBlocks.set(rightBlockId, { left: leftBlockId, right: null });
        } else {
            connectedBlocks.get(rightBlockId).left = leftBlockId;
        }
        
        if (ENABLE_LOGGING) {
            console.log(`[Transform Linkage] חיבור נוסף: ${leftBlockId} -> ${rightBlockId}`);
        }
    }
    
    // קבלת כל החיבורים של בלוק
    function getBlockConnections(blockId) {
        const connections = [];
        
        // אם לבלוק אין רשומה במפה, אין לו חיבורים
        if (!connectedBlocks.has(blockId)) {
            return connections;
        }
        
        const blockConnections = connectedBlocks.get(blockId);
        
        // בדיקת חיבור שמאלי
        if (blockConnections.left) {
            connections.push({
                type: 'left',
                blockId: blockConnections.left
            });
        }
        
        // בדיקת חיבור ימני
        if (blockConnections.right) {
            connections.push({
                type: 'right',
                blockId: blockConnections.right
            });
        }
        
        return connections;
    }
    
    // ניתוק בלוק מכל החיבורים שלו
    function disconnectBlock(blockId) {
        if (!connectedBlocks.has(blockId)) {
            return;
        }
        
        const block = document.getElementById(blockId);
        if (!block) {
            return;
        }
        
        const connections = getBlockConnections(blockId);
        
        // ניתוק כל החיבורים של הבלוק
        connections.forEach(connection => {
            const connectedBlock = document.getElementById(connection.blockId);
            if (!connectedBlock) return;
            
            if (connection.type === 'left') {
                // הבלוק שמאלי לבלוק הנוכחי
                if (connectedBlocks.has(connection.blockId)) {
                    connectedBlocks.get(connection.blockId).right = null;
                }
                connectedBlocks.get(blockId).left = null;
                delete block.dataset.leftBlockId;
                delete connectedBlock.dataset.rightBlockId;
                
                // הסרת מחלקות חיבור
                block.classList.remove('connected-right');
                connectedBlock.classList.remove('connected-left');
            } else {
                // הבלוק ימני לבלוק הנוכחי
                if (connectedBlocks.has(connection.blockId)) {
                    connectedBlocks.get(connection.blockId).left = null;
                }
                connectedBlocks.get(blockId).right = null;
                delete block.dataset.rightBlockId;
                delete connectedBlock.dataset.leftBlockId;
                
                // הסרת מחלקות חיבור
                block.classList.remove('connected-left');
                connectedBlock.classList.remove('connected-right');
            }
            
            if (ENABLE_LOGGING) {
                console.log(`[Transform Linkage] חיבור נותק: ${blockId} - ${connection.blockId}`);
            }
        });
        
        // איפוס טרנספורם
        block.style.transform = '';
    }
    
    // ========================================================================
    // API ציבורי
    // ========================================================================
    window.registerNewBlockForTransformLinkage = function(newBlockElement){
        if (!newBlockElement) return;
        
        if (!newBlockElement.id) {
            newBlockElement.id = generateUniqueBlockId();
        }
        
        // ודא שאין טרנספורם קיים
        newBlockElement.style.transform = '';
        
        if (ENABLE_LOGGING) {
            console.log(`[Transform Linkage] בלוק חדש נרשם: ${newBlockElement.id}`);
        }
    };
    
    // החלף את מערכת החיבורים הנוכחית
    if (window.registerNewBlockForLinkage) {
        console.log("[Transform Linkage] מחליף את מערכת החיבורים הקודמת");
        window.registerNewBlockForLinkage = window.registerNewBlockForTransformLinkage;
    }
    
    // הפעלת המערכת
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTransformLinkageSystem);
    } else {
        initTransformLinkageSystem();
    }
    
})();

console.log("Transform-based linkage system loaded");
