 // ========================================================================
// Block Linkage System using CSS Grid
// Version: GRID-BASED CONNECTION
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
    
    // מונה לזיהוי מיכלי בלוקים
    let containerCounter = 1;
    
    // ========================================================================
    // אתחול המערכת
    // ========================================================================
    function initGridBasedLinkageSystem() {
        console.log("[Grid Linkage] אתחול מערכת חיבורים מבוססת Grid...");
        
        // איתור אזור התכנות
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("[Grid Linkage] שגיאה: לא נמצא אזור #program-blocks");
            return;
        }
        
        // הוספת סגנונות
        addGridStyles();
        
        // הגדרת מאזין ללחיצת עכבר
        programmingArea.addEventListener('mousedown', handleMouseDown);
        console.log("[Grid Linkage] מאזין mousedown נוסף בהצלחה");
        
        // הכנת בלוקים קיימים
        prepareExistingBlocks();
        
        console.log("[Grid Linkage] מערכת אותחלה בהצלחה");
    }
    
    // הוספת סגנונות CSS הנדרשים למערכת
    function addGridStyles() {
        if (document.getElementById('grid-linkage-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'grid-linkage-styles';
        styleElement.textContent = `
            .snap-highlight {
                box-shadow: 0 0 0 3px #4285f4 !important;
                transition: box-shadow 0.2s ease-in-out;
            }
            
            .snap-target {
                box-shadow: 0 0 0 3px #34a853 !important;
                transition: box-shadow 0.2s ease-in-out;
            }
            
            .blocks-grid-container {
                display: grid;
                position: absolute;
                grid-template-columns: repeat(auto-fit, min-content);
                grid-column-gap: -${PUZZLE_CONNECTOR_WIDTH}px;
                z-index: 10;
            }
            
            .block-in-grid {
                position: relative !important;
                left: 0 !important;
                top: 0 !important;
                margin: 0;
            }
            
            .block-container {
                cursor: grab;
            }
            
            .block-container.dragging {
                cursor: grabbing;
                z-index: 1000;
            }
        `;
        
        document.head.appendChild(styleElement);
        console.log("[Grid Linkage] סגנונות Grid נוספו");
    }
    
    // הכנת בלוקים קיימים
    function prepareExistingBlocks() {
        const blocks = programmingArea.querySelectorAll('.block-container');
        blocks.forEach(block => {
            if (!block.id) {
                block.id = generateUniqueBlockId();
            }
        });
        
        console.log(`[Grid Linkage] הוכנו ${blocks.length} בלוקים קיימים`);
    }
    
    // יצירת מזהה ייחודי לבלוק
    function generateUniqueBlockId() {
        return `block-${Date.now()}-${nextBlockId++}`;
    }
    
    // יצירת מזהה ייחודי למיכל
    function generateUniqueContainerId() {
        return `grid-container-${Date.now()}-${containerCounter++}`;
    }
    
    // ========================================================================
    // טיפול באירועי עכבר
    // ========================================================================
    function handleMouseDown(event) {
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock || !programmingArea) return;
        
        event.preventDefault();
        
        // בדיקה אם הבלוק הוא חלק ממיכל גריד
        const gridContainer = targetBlock.closest('.blocks-grid-container');
        
        isDragging = true;
        draggedElement = targetBlock;
        
        if (!draggedElement.id) {
            draggedElement.id = generateUniqueBlockId();
        }
        
        // אם הבלוק הוא חלק ממיכל, יש להוציא אותו
        if (gridContainer) {
            // הסרת הבלוק מהמיכל
            removeBlockFromGridContainer(draggedElement, gridContainer);
        }
        
        initialMouseX = event.clientX;
        initialMouseY = event.clientY;
        
        // לרוב הבלוק יהיה במיקום אבסולוטי, אבל אם הוא יוצא ממיכל הוא יהיה במיקום יחסי
        // לכן אנחנו צריכים לחשב את המיקום האבסולוטי שלו
        const rect = draggedElement.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();
        initialElementX = rect.left - programRect.left;
        initialElementY = rect.top - programRect.top;
        
        // הגדרת מיקום אבסולוטי לבלוק
        draggedElement.style.position = 'absolute';
        draggedElement.style.left = `${initialElementX}px`;
        draggedElement.style.top = `${initialElementY}px`;
        
        // הוספת מחלקה לבלוק בזמן גרירה
        draggedElement.classList.add('dragging');
        
        // הוספת מאזינים זמניים
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        if (ENABLE_LOGGING) {
            console.log(`[Grid Linkage] התחלת גרירה: ${draggedElement.id}`);
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
                console.log(`[Grid Linkage] ביצוע הצמדה - בלוק: ${currentDraggedElement.id}, יעד: ${currentTarget.id}, כיוון: ${snapDirection}`);
            }
            
            // ביצוע חיבור באמצעות גריד
            connectBlocksWithGrid(currentDraggedElement, currentTarget, snapDirection);
        } else {
            if (ENABLE_LOGGING) {
                console.log(`[Grid Linkage] אין יעד הצמדה - הבלוק נשאר במיקומו הנוכחי`);
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
                console.log(`[Grid Linkage] נמצא יעד הצמדה: ${bestTarget.id}, כיוון: ${snapDirection}, מרחק: ${closestDistance.toFixed(2)}px`);
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
    // חיבור בלוקים באמצעות CSS Grid
    // ========================================================================
    function connectBlocksWithGrid(draggedBlock, targetBlock, direction) {
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
            
            // בדיקה אם אחד הבלוקים כבר נמצא במיכל גריד
            const leftContainer = leftBlock.closest('.blocks-grid-container');
            const rightContainer = rightBlock.closest('.blocks-grid-container');
            
            // מקרה 1: שני הבלוקים לא במיכל - יצירת מיכל חדש
            if (!leftContainer && !rightContainer) {
                createNewGridContainer(leftBlock, rightBlock);
                return;
            }
            
            // מקרה 2: רק הבלוק השמאלי במיכל - הוספת הימני למיכל
            if (leftContainer && !rightContainer) {
                addBlockToContainer(rightBlock, leftContainer);
                return;
            }
            
            // מקרה 3: רק הבלוק הימני במיכל - הוספת השמאלי למיכל
            if (!leftContainer && rightContainer) {
                addBlockToContainer(leftBlock, rightContainer, true); // הוספה בתחילת המיכל
                return;
            }
            
            // מקרה 4: שני הבלוקים במיכלים שונים - איחוד המיכלים
            if (leftContainer !== rightContainer) {
                mergeContainers(leftContainer, rightContainer);
                return;
            }
            
            // מקרה 5: שני הבלוקים באותו מיכל - סידור מחדש
            rearrangeBlocksInContainer(leftBlock, rightBlock, leftContainer);
            
        } catch (e) {
            console.error("[Grid Linkage] שגיאה בחיבור בלוקים:", e);
            
            // החזרה למיקום אבסולוטי במקרה של שגיאה
            draggedBlock.style.position = 'absolute';
        }
    }
    
    // יצירת מיכל גריד חדש
    function createNewGridContainer(leftBlock, rightBlock) {
        // יצירת מיכל
        const container = document.createElement('div');
        container.id = generateUniqueContainerId();
        container.classList.add('blocks-grid-container');
        
        // מיקום המיכל במיקום הבלוק השמאלי
        const leftRect = leftBlock.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();
        container.style.left = `${leftRect.left - programRect.left}px`;
        container.style.top = `${leftRect.top - programRect.top}px`;
        
        // שמירת מיקום הבלוקים
        const leftParent = leftBlock.parentNode;
        const rightParent = rightBlock.parentNode;
        
        // הסרת הבלוקים מההורים שלהם
        if (leftParent) leftParent.removeChild(leftBlock);
        if (rightParent) rightParent.removeChild(rightBlock);
        
        // הוספת הבלוקים למיכל החדש
        container.appendChild(leftBlock);
        container.appendChild(rightBlock);
        
        // הגדרת הבלוקים כחלק ממיכל
        leftBlock.classList.add('block-in-grid');
        rightBlock.classList.add('block-in-grid');
        
        // יצירת קשר לוגי
        leftBlock.dataset.rightBlockId = rightBlock.id;
        rightBlock.dataset.leftBlockId = leftBlock.id;
        
        // הוספת המיכל לאזור התכנות
        programmingArea.appendChild(container);
        
        if (ENABLE_LOGGING) {
            console.log(`[Grid Linkage] נוצר מיכל גריד חדש: ${container.id} עם בלוקים ${leftBlock.id}, ${rightBlock.id}`);
        }
    }
    
    // הוספת בלוק למיכל קיים
    function addBlockToContainer(block, container, addToStart = false) {
        // הסרת הבלוק מההורה הנוכחי
        if (block.parentNode) {
            block.parentNode.removeChild(block);
        }
        
        // הוספת הבלוק למיכל
        if (addToStart && container.firstChild) {
            container.insertBefore(block, container.firstChild);
        } else {
            container.appendChild(block);
        }
        
        // הגדרת הבלוק כחלק ממיכל
        block.classList.add('block-in-grid');
        
        // עדכון קשרים לוגיים
        if (addToStart && container.children.length > 1) {
            // קישור הבלוק החדש לבלוק השני במיכל
            const secondBlock = container.children[1];
            block.dataset.rightBlockId = secondBlock.id;
            secondBlock.dataset.leftBlockId = block.id;
        } else if (!addToStart && container.children.length > 1) {
            // קישור הבלוק החדש לבלוק האחרון במיכל
            const lastIndex = container.children.length - 1;
            const prevLastBlock = container.children[lastIndex - 1];
            prevLastBlock.dataset.rightBlockId = block.id;
            block.dataset.leftBlockId = prevLastBlock.id;
        }
        
        if (ENABLE_LOGGING) {
            console.log(`[Grid Linkage] בלוק ${block.id} נוסף למיכל ${container.id}`);
        }
    }
    
    // איחוד שני מיכלים
    function mergeContainers(container1, container2) {
        // קביעת סדר המיכלים
        let leftContainer, rightContainer;
        const container1Rect = container1.getBoundingClientRect();
        const container2Rect = container2.getBoundingClientRect();
        
        if (container1Rect.left <= container2Rect.left) {
            leftContainer = container1;
            rightContainer = container2;
        } else {
            leftContainer = container2;
            rightContainer = container1;
        }
        
        // העברת כל הבלוקים מהמיכל הימני למיכל השמאלי
        while (rightContainer.firstChild) {
            const block = rightContainer.firstChild;
            rightContainer.removeChild(block);
            leftContainer.appendChild(block);
        }
        
        // הסרת המיכל הריק
        if (rightContainer.parentNode) {
            rightContainer.parentNode.removeChild(rightContainer);
        }
        
        // עדכון קשרים לוגיים בין הבלוקים במיכל
        updateBlockConnectionsInContainer(leftContainer);
        
        if (ENABLE_LOGGING) {
            console.log(`[Grid Linkage] מיכלים אוחדו: ${leftContainer.id} ספג את ${rightContainer.id}`);
        }
    }
    
    // סידור מחדש של בלוקים באותו מיכל
    function rearrangeBlocksInContainer(block1, block2, container) {
        // יצירת מערך של כל הבלוקים במיכל
        const blocks = Array.from(container.children);
        
        // מציאת האינדקסים של הבלוקים
        const index1 = blocks.indexOf(block1);
        const index2 = blocks.indexOf(block2);
        
        // אם הבלוקים כבר צמודים, אין צורך בפעולה
        if (Math.abs(index1 - index2) === 1) {
            return;
        }
        
        // הסרת בלוק2 ממיקומו הנוכחי
        container.removeChild(block2);
        
        // הוספת בלוק2 ליד בלוק1
        if (index1 < blocks.length - 1) {
            container.insertBefore(block2, blocks[index1 + 1]);
        } else {
            container.appendChild(block2);
        }
        
        // עדכון קשרים לוגיים
        updateBlockConnectionsInContainer(container);
        
        if (ENABLE_LOGGING) {
            console.log(`[Grid Linkage] בלוקים סודרו מחדש במיכל: ${block1.id}, ${block2.id}`);
        }
    }
    
    // עדכון קשרים לוגיים בין בלוקים במיכל
    function updateBlockConnectionsInContainer(container) {
        const children = container.children;
        
        // ניקוי כל הקשרים הקודמים
        for (let i = 0; i < children.length; i++) {
            delete children[i].dataset.leftBlockId;
            delete children[i].dataset.rightBlockId;
        }
        
        // יצירת קשרים חדשים
        for (let i = 0; i < children.length - 1; i++) {
            children[i].dataset.rightBlockId = children[i + 1].id;
            children[i + 1].dataset.leftBlockId = children[i].id;
        }
    }
    
    // הסרת בלוק ממיכל גריד
    function removeBlockFromGridContainer(block, container) {
        if (!block || !container) return;
        
        // שמירת המיקום האבסולוטי לפני ההסרה
        const rect = block.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();
        const absoluteLeft = rect.left - programRect.left;
        const absoluteTop = rect.top - programRect.top;
        
        // הסרת מחלקת 'block-in-grid'
        block.classList.remove('block-in-grid');
        
        // הסרת הבלוק מהמיכל
        container.removeChild(block);
        
        // החזרת הבלוק לאזור התכנות עם מיקום אבסולוטי
        block.style.position = 'absolute';
        block.style.left = `${absoluteLeft}px`;
        block.style.top = `${absoluteTop}px`;
        programmingArea.appendChild(block);
        
        // ניקוי קשרים לוגיים
        const leftBlockId = block.dataset.leftBlockId;
        const rightBlockId = block.dataset.rightBlockId;
        
        if (leftBlockId) {
            const leftBlock = document.getElementById(leftBlockId);
            if (leftBlock) delete leftBlock.dataset.rightBlockId;
            delete block.dataset.leftBlockId;
        }
        
        if (rightBlockId) {
            const rightBlock = document.getElementById(rightBlockId);
            if (rightBlock) delete rightBlock.dataset.leftBlockId;
            delete block.dataset.rightBlockId;
        }
        
        // עדכון קשרים במיכל
        if (container.children.length > 0) {
            updateBlockConnectionsInContainer(container);
        } else {
            // הסרת מיכל ריק
            programmingArea.removeChild(container);
        }
        
        if (ENABLE_LOGGING) {
            console.log(`[Grid Linkage] בלוק ${block.id} הוסר ממיכל ${container.id}`);
        }
    }
    
    // ========================================================================
    // API ציבורי
    // ========================================================================
    window.registerNewBlockForGridLinkage = function(newBlockElement){
        if (!newBlockElement) return;
        
        if (!newBlockElement.id) {
            newBlockElement.id = generateUniqueBlockId();
        }
        
        if (ENABLE_LOGGING) {
            console.log(`[Grid Linkage] בלוק חדש נרשם: ${newBlockElement.id}`);
        }
    };
    
    // החלף את מערכת החיבורים הנוכחית
    if (window.registerNewBlockForLinkage) {
        console.log("[Grid Linkage] מחליף את מערכת החיבורים הקודמת");
        window.registerNewBlockForLinkage = window.registerNewBlockForGridLinkage;
    }
    
    // הפעלת המערכת
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGridBasedLinkageSystem);
    } else {
        initGridBasedLinkageSystem();
    }
    
})();

console.log("Grid-based linkage system loaded");
