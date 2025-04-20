// ========================================================================
// מנגנון פשוט להצמדת בלוקים - simpleBlockLinkage.js
// ========================================================================

// הוספת סגנונות CSS
function addBlockLinkageStyles() {
    const style = document.createElement('style');
    style.id = 'simple-linkage-styles';
    style.textContent = `
        .block-container.dragging {
            opacity: 0.8;
        }
        
        .block-container.highlight-yellow {
            background-color: rgba(255, 255, 0, 0.3) !important;
            border: 4px solid #FFD700 !important;
            box-shadow: 0 0 12px 4px rgba(255, 215, 0, 0.7) !important;
        }
        
        .block-container.highlight-blue {
            border: 4px dashed #0078FF !important;
            box-shadow: 0 0 12px 4px rgba(0, 120, 255, 0.7) !important;
        }
    `;
    document.head.appendChild(style);
    console.log('סגנונות הצמדה פשוטים נוספו');
}

// הוספת מאזינים לבלוקים
function setupBlockDragListeners() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
        console.error('אזור התכנות לא נמצא');
        return;
    }
    
    console.log('מוסיף מאזינים לבלוקים...');
    
    // מרחק להצמדה (פיקסלים)
    const SNAP_DISTANCE = 20;
    
    // ניקוי הדגשות
    function clearHighlights() {
        const blocks = programmingArea.querySelectorAll('.block-container');
        blocks.forEach(block => {
            block.classList.remove('highlight-yellow');
            block.classList.remove('highlight-blue');
        });
    }
    
    // חיפוש בלוק קרוב לנקודה מסוימת
    function findNearbyBlock(x, y, currentBlock) {
        const blocks = programmingArea.querySelectorAll('.block-container');
        let closestBlock = null;
        let minDistance = SNAP_DISTANCE;
        
        blocks.forEach(block => {
            if (block === currentBlock) return;
            
            const rect = block.getBoundingClientRect();
            const blockCenterX = rect.left + rect.width / 2;
            const blockBottomY = rect.bottom;
            
            // מדידת מרחק מתחתית הבלוק
            const distance = Math.sqrt(
                Math.pow(blockCenterX - x, 2) + 
                Math.pow(blockBottomY - y, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestBlock = block;
            }
        });
        
        return closestBlock;
    }
    
    // טיפול בתחילת גרירה
    function handleDragStart(e) {
        console.log('תחילת גרירה', this);
        
        this.classList.add('dragging');
        
        // שמירת מיקום העכבר יחסית לבלוק
        const rect = this.getBoundingClientRect();
        this.dragOffsetX = e.clientX - rect.left;
        this.dragOffsetY = e.clientY - rect.top;
        
        e.dataTransfer.setDragImage(new Image(), 0, 0);
        e.dataTransfer.effectAllowed = 'move';
    }
    
    // טיפול במהלך גרירה
    function handleDrag(e) {
        if (!e.clientX) return; // קורה בחלק מהדפדפנים
        
        clearHighlights();
        
        const block = this;
        const areaRect = programmingArea.getBoundingClientRect();
        
        // חישוב המיקום החדש של הבלוק
        const left = e.clientX - areaRect.left - this.dragOffsetX;
        const top = e.clientY - areaRect.top - this.dragOffsetY;
        
        // עדכון מיקום הבלוק
        block.style.position = 'absolute';
        block.style.left = left + 'px';
        block.style.top = top + 'px';
        
        // חיפוש בלוק קרוב
        const blockRect = block.getBoundingClientRect();
        const blockBottomCenterX = blockRect.left + blockRect.width / 2;
        const blockBottomY = blockRect.bottom;
        
        const nearbyBlock = findNearbyBlock(blockBottomCenterX, blockBottomY, block);
        
        // הוספת הדגשות אם נמצא בלוק קרוב
        if (nearbyBlock) {
            console.log('נמצא בלוק קרוב:', nearbyBlock);
            nearbyBlock.classList.add('highlight-yellow');
            block.classList.add('highlight-blue');
        }
    }
    
    // טיפול בסיום גרירה
    function handleDragEnd(e) {
        console.log('סיום גרירה');
        
        this.classList.remove('dragging');
        clearHighlights();
    }
    
    // הגדרת אירועי גרירה לכל הבלוקים
    function setupExistingBlocks() {
        const blocks = programmingArea.querySelectorAll('.block-container');
        
        blocks.forEach(block => {
            console.log('מוסיף מאזיני גרירה לבלוק:', block);
            
            // הסרת מאזינים קודמים למניעת כפילויות
            block.removeEventListener('dragstart', handleDragStart);
            block.removeEventListener('drag', handleDrag);
            block.removeEventListener('dragend', handleDragEnd);
            
            // הוספת מאזינים חדשים
            block.addEventListener('dragstart', handleDragStart);
            block.addEventListener('drag', handleDrag);
            block.addEventListener('dragend', handleDragEnd);
        });
    }
    
    // הגדרת צפייה בשינויים באזור התכנות
    function setupMutationObserver() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // בדיקה האם נוספו בלוקים חדשים
                    mutation.addedNodes.forEach(node => {
                        if (node.classList && node.classList.contains('block-container')) {
                            console.log('נוסף בלוק חדש, מוסיף מאזינים:', node);
                            
                            node.removeEventListener('dragstart', handleDragStart);
                            node.removeEventListener('drag', handleDrag);
                            node.removeEventListener('dragend', handleDragEnd);
                            
                            node.addEventListener('dragstart', handleDragStart);
                            node.addEventListener('drag', handleDrag);
                            node.addEventListener('dragend', handleDragEnd);
                        }
                    });
                }
            });
        });
        
        observer.observe(programmingArea, { childList: true });
        console.log('צופה במוטציות DOM הופעל');
    }
    
    // אתחול
    setupExistingBlocks();
    setupMutationObserver();
}

// פונקציה מרכזית להפעלת מנגנון ההצמדה הפשוט
function initializeSimpleBlockLinkage() {
    console.log('מאתחל מנגנון הצמדה פשוט');
    
    addBlockLinkageStyles();
    setupBlockDragListeners();
    
    console.log('מנגנון הצמדה פשוט הופעל בהצלחה');
}

// הפעלת המנגנון כאשר המסמך נטען
document.addEventListener('DOMContentLoaded', initializeSimpleBlockLinkage);

// הפעלה גם אם המסמך כבר נטען
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('מסמך כבר נטען, מאתחל מיד');
    setTimeout(initializeSimpleBlockLinkage, 500);
}
