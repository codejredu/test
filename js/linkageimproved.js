// ========================================================================
// Block Linkage System using Relative Positioning
// Version: RELATIVE-POSITIONING CONNECTION
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
    let rowsContainer = null;
    let nextBlockId = 1;
    let nextRowId = 1;
    let snapDirection = 'right';
    
    // מעקב אחרי מצב שורות
    let rows = [];
    
    // ========================================================================
    // אתחול המערכת
    // ========================================================================
    function initRelativePositioningSystem() {
        console.log("[Relative Positioning] אתחול מערכת חיבורים מבוססת מיקום יחסי...");
        
        // איתור אזור התכנות
        programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("[Relative Positioning] שגיאה: לא נמצא אזור #program-blocks");
            return;
        }
        
        // יצירת מיכל שורות חדש
        createRowsContainer();
        
        // הוספת סגנונות
        addRelativePositioningStyles();
        
        // העברת בלוקים קיימים למיכל החדש
        moveExistingBlocksToRowsContainer();
        
        // הגדרת מאזינים לאירועים
        setupEventListeners();
        
        console.log("[Relative Positioning] מערכת אותחלה בהצלחה");
    }
    
    // יצירת מיכל השורות
    function createRowsContainer() {
        // בדיקה אם כבר קיים מיכל שורות
        const existingContainer = document.getElementById('blocks-rows-container');
        if (existingContainer) {
            rowsContainer = existingContainer;
            return;
        }
        
        // יצירת מיכל חדש
        rowsContainer = document.createElement('div');
        rowsContainer.id = 'blocks-rows-container';
        rowsContainer.className = 'blocks-rows-container';
        
        // החלפת מיכל התכנות הקיים במיכל השורות
        const parent = programmingArea.parentNode;
        
        // שמירת המיקום והמימדים המקוריים
        const originalRect = programmingArea.getBoundingClientRect();
        rowsContainer.style.width = programmingArea.style.width || '100%';
        rowsContainer.style.height = programmingArea.style.height || '100%';
        rowsContainer.style.position = 'relative';
        
        // החלפת המיכלים
        parent.insertBefore(rowsContainer, programmingArea);
        parent.removeChild(programmingArea);
        
        // עדכון ההפניה
        programmingArea = rowsContainer;
        
        if (ENABLE_LOGGING) {
            console.log("[Relative Positioning] נוצר מיכל שורות חדש");
        }
    }
    
    // הוספת סגנונות CSS
    function addRelativePositioningStyles() {
        if (document.getElementById('relative-positioning-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'relative-positioning-styles';
        styleElement.textContent = `
            .blocks-rows-container {
                width: 100%;
                height: 100%;
                position: relative;
                overflow: visible;
            }
            
            .blocks-row {
                display: flex;
                flex-direction: row;
                margin-bottom: 10px;
                position: absolute;
                left: 0;
                transition: top 0.3s ease-out;
            }
            
            .row-blocks-container {
                display: flex;
                flex-direction: row;
                margin-left: 0;
                transition: margin-left 0.2s ease-out;
            }
            
            .block-in-row {
                position: relative !important;
                left: auto !important;
                top: auto !important;
                margin-right: -${PUZZLE_CONNECTOR_WIDTH}px;
                cursor: grab;
            }
            
            .snap-highlight {
                box-shadow: 0 0 0 3px #4285f4 !important;
                transition: box-shadow 0.2s ease-in-out;
            }
            
            .snap-target {
                box-shadow: 0 0 0 3px #34a853 !important;
                transition: box-shadow 0.2s ease-in-out;
            }
            
            .dragging {
                cursor: grabbing;
                z-index: 1000;
                opacity: 0.8;
            }
            
            .ghost-placeholder {
                border: 2px dashed #4285f4;
                background-color: rgba(66, 133, 244, 0.1);
                border-radius: 4px;
            }
            
            .row-hidden {
                visibility: hidden;
                pointer-events: none;
            }
        `;
        
        document.head.appendChild(styleElement);
        console.log("[Relative Positioning] סגנונות נוספו");
    }
    
    // העברת בלוקים קיימים למיכל החדש
    function moveExistingBlocksToRowsContainer() {
        const existingBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.block-in-row)'));
        
        if (existingBlocks.length === 0) return;
        
        if (ENABLE_LOGGING) {
            console.log(`[Relative Positioning] העברת ${existingBlocks.length} בלוקים קיימים למיכל החדש`);
        }
        
        // יצירת שורה עבור כל בלוק קיים
        existingBlocks.forEach(block => {
            if (!block.id) {
                block.id = generateUniqueBlockId();
            }
            
            // יצירת שורה חדשה
            const row = createNewRow();
            
            // שמירת המיקום המקורי
            const left = parseInt(block.style.left) || 0;
            const top = parseInt(block.style.top) || 0;
            
            // מיקום השורה במיקום המקורי של הבלוק
            row.style.left = `${left}px`;
            row.style.top = `${top}px`;
            
            // הוספת הבלוק לשורה
            const blocksContainer = row.querySelector('.row-blocks-container');
            
            // הסרת הבלוק מהמיכל המקורי אם צריך
            if (block.parentNode) {
                block.parentNode.removeChild(block);
            }
            
            // הוספת הבלוק לשורה
            blocksContainer.appendChild(block);
            
            // הגדרת הבלוק כחלק משורה
            block.classList.add('block-in-row');
            
            // הוספת השורה למיכל
            programmingArea.appendChild(row);
            
            // הוספת השורה למעקב
            rows.push({
                id: row.id,
                element: row,
                blocks: [block.id]
            });
        });
        
        if (ENABLE_LOGGING) {
            console.log(`[Relative Positioning] נוצרו ${rows.length} שורות`);
        }
    }
    
    // הגדרת מאזינים לאירועים
    function setupEventListeners() {
        // מאזין גלובלי ללחיצת עכבר
        programmingArea.addEventListener('mousedown', handleMouseDown);
        
        // מאזין למקש Escape לניקוי מצב תקוע
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                recoverFromStuckState();
            }
        });
        
        if (ENABLE_LOGGING) {
            console.log("[Relative Positioning] מאזינים לאירועים הוגדרו");
        }
    }
    
    // יצירת שורה חדשה
    function createNewRow() {
        const row = document.createElement('div');
        row.id = generateUniqueRowId();
        row.className = 'blocks-row';
        
        // יצירת מיכל בלוקים בתוך השורה
        const blocksContainer = document.createElement('div');
        blocksContainer.className = 'row-blocks-container';
        row.appendChild(blocksContainer);
        
        return row;
    }
    
    // יצירת מזהה ייחודי לבלוק
    function generateUniqueBlockId() {
        return `block-${Date.now()}-${nextBlockId++}`;
    }
    
    // יצירת מזהה ייחודי לשורה
    function generateUniqueRowId() {
        return `row-${Date.now()}-${nextRowId++}`;
    }
    
    // ניקוי מצב תקוע
    function recoverFromStuckState() {
        if (ENABLE_LOGGING) {
            console.log("[Relative Positioning] ניקוי מצב תקוע");
        }
        
        // ביטול גרירה
        isDragging = false;
        
        // הסרת מחלקות מיוחדות
        document.querySelectorAll('.dragging, .snap-highlight, .snap-target, .ghost-placeholder, .row-hidden').forEach(el => {
            el.classList.remove('dragging', 'snap-highlight', 'snap-target', 'ghost-placeholder', 'row-hidden');
        });
        
        // הסרת מאזיני גרירה
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // איפוס משתני מצב
        draggedElement = null;
        potentialSnapTarget = null;
    }
    
    // ========================================================================
    // טיפול באירועי עכבר
    // ========================================================================
    function handleMouseDown(event) {
        // בדיקה אם לחצו על בלוק
        const targetBlock = event.target.closest('.block-container');
        if (!targetBlock) return;
        
        event.preventDefault();
        isDragging = true;
        draggedElement = targetBlock;
        
        if (!draggedElement.id) {
            draggedElement.id = generateUniqueBlockId();
        }
        
        // זיהוי השורה של הבלוק
        const sourceRow = draggedElement.closest('.blocks-row');
        if (!sourceRow) {
            console.warn("[Relative Positioning] בלוק ללא שורה הורה:", draggedElement.id);
            return;
        }
        
        // סימון השורה כמוסתרת
        sourceRow.classList.add('row-hidden');
        
        // יצירת עותק של הבלוק לגרירה
        const blockRect = draggedElement.getBoundingClientRect();
        const containerRect = programmingArea.getBoundingClientRect();
        
        // שמירת מיקום התחלתי
        initialMouseX = event.clientX;
        initialMouseY = event.clientY;
        initialElementX = blockRect.left - containerRect.left;
        initialElementY = blockRect.top - containerRect.top;
        
        // יצירת עותק של הבלוק לגרירה
        const ghostElement = draggedElement.cloneNode(true);
        ghostElement.id = 'ghost-' + draggedElement.id;
        ghostElement.classList.add('dragging');
        ghostElement.classList.remove('block-in-row');
        ghostElement.style.position = 'absolute';
        ghostElement.style.left = `${initialElementX}px`;
        ghostElement.style.top = `${initialElementY}px`;
        ghostElement.style.width = `${blockRect.width}px`;
        ghostElement.style.height = `${blockRect.height}px`;
        
        // הוספת העותק למיכל
        programmingArea.appendChild(ghostElement);
        
        // הוספת מאזינים לאירועי גרירה
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        if (ENABLE_LOGGING) {
            console.log(`[Relative Positioning] התחלת גרירה: ${draggedElement.id}`);
        }
    }
    
    function handleMouseMove(event) {
        if (!isDragging || !draggedElement) return;
        
        // מציאת העותק הרפאים
        const ghostElement = document.getElementById('ghost-' + draggedElement.id);
        if (!ghostElement) return;
        
        // חישוב מיקום חדש
        const deltaX = event.clientX - initialMouseX;
        const deltaY = event.clientY - initialMouseY;
        
        const newX = initialElementX + deltaX;
        const newY = initialElementY + deltaY;
        
        // עדכון מיקום העותק
        ghostElement.style.left = `${newX}px`;
        ghostElement.style.top = `${newY}px`;
        
        // חיפוש יעד אפשרי להצמדה
        findPotentialSnapTarget(ghostElement);
    }
    
    function handleMouseUp(event) {
        if (!isDragging || !draggedElement) return;
        
        // הסרת מאזינים
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // מציאת העותק הרפאים
        const ghostElement = document.getElementById('ghost-' + draggedElement.id);
        
        // זיהוי השורה המקורית
        const sourceRow = draggedElement.closest('.blocks-row');
        
        // בדיקה אם יש יעד הצמדה
        if (potentialSnapTarget && ghostElement) {
            // ביצוע הצמדה לבלוק אחר
            connectBlocksInRows(draggedElement, potentialSnapTarget, snapDirection);
        } else if (ghostElement) {
            // יצירת שורה חדשה במיקום הנוכחי
            createNewRowWithBlock(draggedElement, parseInt(ghostElement.style.left), parseInt(ghostElement.style.top));
        }
        
        // הסרת השורה הריקה אם צריך
        if (sourceRow) {
            const blocksContainer = sourceRow.querySelector('.row-blocks-container');
            if (blocksContainer && blocksContainer.children.length === 0) {
                // הסרת השורה הריקה
                sourceRow.parentNode.removeChild(sourceRow);
                
                // הסרת השורה ממעקב
                const rowIndex = rows.findIndex(r => r.id === sourceRow.id);
                if (rowIndex !== -1) {
                    rows.splice(rowIndex, 1);
                }
            } else {
                // ביטול הסתרת השורה
                sourceRow.classList.remove('row-hidden');
            }
        }
        
        // הסרת העותק
        if (ghostElement) {
            ghostElement.parentNode.removeChild(ghostElement);
        }
        
        // ניקוי הדגשות
        clearSnapHighlights();
        
        // איפוס משתני מצב
        isDragging = false;
        draggedElement = null;
        potentialSnapTarget = null;
        
        if (ENABLE_LOGGING) {
            console.log("[Relative Positioning] גרירה הסתיימה");
        }
    }
    
    // ========================================================================
    // חיפוש יעד הצמדה
    // ========================================================================
    function findPotentialSnapTarget(ghostElement) {
        // ניקוי הדגשות קודמות
        clearSnapHighlights();
        potentialSnapTarget = null;
        
        if (!ghostElement) return;
        
        const ghostRect = ghostElement.getBoundingClientRect();
        const allBlocks = programmingArea.querySelectorAll('.block-container:not(#' + ghostElement.id + ')');
        
        let closestDistance = HORIZONTAL_SNAP_DISTANCE;
        let bestTarget = null;
        
        allBlocks.forEach(block => {
            // דילוג על הבלוק המקורי
            if (block === draggedElement) return;
            
            const blockRect = block.getBoundingClientRect();
            
            // בדיקה אם הבלוקים קרובים מספיק אנכית
            const verticalDistance = Math.abs((ghostRect.top + ghostRect.height/2) - (blockRect.top + blockRect.height/2));
            if (verticalDistance > VERTICAL_ALIGNMENT_TOLERANCE) return;
            
            // בדיקת מרחק אופקי - האם הבלוק הנגרר קרוב מימין לבלוק הנבדק
            const distanceFromRight = Math.abs(ghostRect.left - blockRect.right);
            if (distanceFromRight < closestDistance) {
                closestDistance = distanceFromRight;
                bestTarget = block;
                snapDirection = 'right'; // הבלוק הנגרר יהיה מימין לבלוק היעד
            }
            
            // בדיקת מרחק אופקי - האם הבלוק הנגרר קרוב משמאל לבלוק הנבדק
            const distanceFromLeft = Math.abs(ghostRect.right - blockRect.left);
            if (distanceFromLeft < closestDistance) {
                closestDistance = distanceFromLeft;
                bestTarget = block;
                snapDirection = 'left'; // הבלוק הנגרר יהיה משמאל לבלוק היעד
            }
        });
        
        // אם נמצא יעד מתאים, הדגש אותו
        if (bestTarget) {
            potentialSnapTarget = bestTarget;
            ghostElement.classList.add('snap-highlight');
            bestTarget.classList.add('snap-target');
            
            if (ENABLE_LOGGING) {
                console.log(`[Relative Positioning] נמצא יעד הצמדה: ${bestTarget.id}, כיוון: ${snapDirection}`);
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
    // חיבור בלוקים
    // ========================================================================
    function connectBlocksInRows(sourceBlock, targetBlock, direction) {
        if (ENABLE_LOGGING) {
            console.log(`[Relative Positioning] חיבור בלוקים: ${sourceBlock.id} ו-${targetBlock.id}, כיוון: ${direction}`);
        }
        
        // זיהוי השורה של הבלוק היעד
        const targetRow = targetBlock.closest('.blocks-row');
        if (!targetRow) {
            console.error("[Relative Positioning] בלוק יעד ללא שורה:", targetBlock.id);
            return;
        }
        
        // קבלת מיכל הבלוקים בשורת היעד
        const targetBlocksContainer = targetRow.querySelector('.row-blocks-container');
        if (!targetBlocksContainer) return;
        
        // קבלת כל הבלוקים בשורת היעד
        const blocksInTargetRow = Array.from(targetBlocksContainer.children);
        
        // מציאת האינדקס של בלוק היעד
        const targetIndex = blocksInTargetRow.indexOf(targetBlock);
        if (targetIndex === -1) return;
        
        // הסרת הבלוק המקור מהשורה המקורית
        const sourceRow = sourceBlock.closest('.blocks-row');
        if (sourceRow) {
            sourceRow.classList.remove('row-hidden');
            const sourceBlocksContainer = sourceRow.querySelector('.row-blocks-container');
            if (sourceBlocksContainer && sourceBlocksContainer.contains(sourceBlock)) {
                sourceBlocksContainer.removeChild(sourceBlock);
            }
        }
        
        // קביעת אינדקס ההוספה בהתאם לכיוון
        let insertIndex = direction === 'right' ? targetIndex + 1 : targetIndex;
        
        // הוספת הבלוק לשורת היעד במיקום הנכון
        if (insertIndex >= blocksInTargetRow.length) {
            // הוספה בסוף
            targetBlocksContainer.appendChild(sourceBlock);
        } else {
            // הוספה באמצע
            targetBlocksContainer.insertBefore(sourceBlock, blocksInTargetRow[insertIndex]);
        }
        
        // הגדרת הבלוק כחלק משורה
        sourceBlock.classList.add('block-in-row');
        
        // עדכון רשימת הבלוקים בשורה במעקב
        const rowData = rows.find(r => r.id === targetRow.id);
        if (rowData) {
            // הוספת בלוק המקור לרשימת הבלוקים בשורה
            if (!rowData.blocks.includes(sourceBlock.id)) {
                // מציאת האינדקס הנכון להוספה
                const blockInsertIndex = direction === 'right' ? rowData.blocks.indexOf(targetBlock.id) + 1 : rowData.blocks.indexOf(targetBlock.id);
                rowData.blocks.splice(blockInsertIndex, 0, sourceBlock.id);
            }
        }
        
        // אנימציית חיבור
        sourceBlock.style.transition = 'all 0.3s ease-out';
        setTimeout(() => {
            sourceBlock.style.transition = '';
        }, 300);
        
        if (ENABLE_LOGGING) {
            console.log(`[Relative Positioning] בלוק ${sourceBlock.id} חובר לשורה ${targetRow.id}`);
        }
    }
    
    // יצירת שורה חדשה עם בלוק
    function createNewRowWithBlock(block, left, top) {
        if (ENABLE_LOGGING) {
            console.log(`[Relative Positioning] יצירת שורה חדשה עם בלוק ${block.id} במיקום (${left}, ${top})`);
        }
        
        // יצירת שורה חדשה
        const newRow = createNewRow();
        
        // מיקום השורה
        newRow.style.left = `${left}px`;
        newRow.style.top = `${top}px`;
        
        // הסרת הבלוק מהשורה המקורית
        const sourceRow = block.closest('.blocks-row');
        if (sourceRow) {
            sourceRow.classList.remove('row-hidden');
            const sourceBlocksContainer = sourceRow.querySelector('.row-blocks-container');
            if (sourceBlocksContainer && sourceBlocksContainer.contains(block)) {
                sourceBlocksContainer.removeChild(block);
            }
        }
        
        // הוספת הבלוק לשורה החדשה
        const blocksContainer = newRow.querySelector('.row-blocks-container');
        blocksContainer.appendChild(block);
        
        // הגדרת הבלוק כחלק משורה
        block.classList.add('block-in-row');
        
        // הוספת השורה למיכל
        programmingArea.appendChild(newRow);
        
        // הוספת השורה למעקב
        rows.push({
            id: newRow.id,
            element: newRow,
            blocks: [block.id]
        });
        
        if (ENABLE_LOGGING) {
            console.log(`[Relative Positioning] נוצרה שורה חדשה: ${newRow.id}`);
        }
    }
    
    // ========================================================================
    // API ציבורי
    // ========================================================================
    window.registerNewBlockForRelativePositioning = function(newBlockElement) {
        if (!newBlockElement) return;
        
        if (!newBlockElement.id) {
            newBlockElement.id = generateUniqueBlockId();
        }
        
        // יצירת שורה חדשה עבור הבלוק החדש
        const newRow = createNewRow();
        
        // מיקום השורה
        const left = parseInt(newBlockElement.style.left) || 0;
        const top = parseInt(newBlockElement.style.top) || 0;
        newRow.style.left = `${left}px`;
        newRow.style.top = `${top}px`;
        
        // הוספת הבלוק לשורה
        const blocksContainer = newRow.querySelector('.row-blocks-container');
        
        // הסרת הבלוק מההורה הנוכחי אם יש
        if (newBlockElement.parentNode) {
            newBlockElement.parentNode.removeChild(newBlockElement);
        }
        
        // הוספת הבלוק לשורה
        blocksContainer.appendChild(newBlockElement);
        
        // הגדרת הבלוק כחלק משורה
        newBlockElement.classList.add('block-in-row');
        
        // הוספת השורה למיכל
        programmingArea.appendChild(newRow);
        
        // הוספת השורה למעקב
        rows.push({
            id: newRow.id,
            element: newRow,
            blocks: [newBlockElement.id]
        });
        
        if (ENABLE_LOGGING) {
            console.log(`[Relative Positioning] בלוק חדש נרשם: ${newBlockElement.id} בשורה: ${newRow.id}`);
        }
    };
    
    // פונקציה לחיבור שני בלוקים
    window.connectBlocks = function(block1, block2) {
        if (!block1 || !block2) {
            console.error("[Relative Positioning] ניסיון לחבר בלוקים לא תקינים");
            return;
        }
        
        if (ENABLE_LOGGING) {
            console.log(`[Relative Positioning] חיבור חיצוני של בלוקים: ${block1.id} ו-${block2.id}`);
        }
        
        // בדיקה אם הבלוקים כבר בשורה
        const row1 = block1.closest('.blocks-row');
        const row2 = block2.closest('.blocks-row');
        
        if (row1 && row2 && row1 === row2) {
            // הבלוקים כבר באותה שורה, אין צורך לעשות כלום
            return;
        }
        
        // קביעת כיוון החיבור (בלוק 1 משמאל לבלוק 2)
        connectBlocksInRows(block2, block1, 'right');
    };
    
    // החלף את מערכת החיבורים הנוכחית
    if (window.registerNewBlockForLinkage) {
        console.log("[Relative Positioning] מחליף את מערכת החיבורים הקודמת");
        window.registerNewBlockForLinkage = window.registerNewBlockForRelativePositioning;
    }
    
    // הוסף פונקציית חירום
    window.recoverFromRelativePositioningStuckState = recoverFromStuckState;
    
    // הפעלת המערכת
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRelativePositioningSystem);
    } else {
        initRelativePositioningSystem();
    }
    
})();

console.log("Relative positioning linkage system loaded");
