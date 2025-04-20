/**
 * מנגנון פשוט להצמדת בלוקים - simplified-linkage.js
 * גרסה המבוססת על mousedown/mousemove במקום על drag/drop
 */

// גלובלי - מידע על הבלוק הנוכחי שנגרר
let currentDraggedBlock = null;
let isDragging = false;
let offsetX, offsetY;

// הגדרות
const SNAP_DISTANCE = 20; // מרחק בפיקסלים להצמדה

// הוספת סגנונות הצמדה
function addHighlightStyles() {
    // בדוק שהסגנונות לא קיימים כבר
    if (document.getElementById('highlight-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'highlight-styles';
    style.textContent = `
        /* הילה צהובה ליעד ההצמדה */
        .snap-target {
            outline: 3px solid #FFD700 !important;
            background-color: rgba(255, 255, 0, 0.3) !important;
            box-shadow: 0 0 8px 2px rgba(255, 215, 0, 0.6) !important;
            z-index: 100 !important;
            position: relative !important;
        }
        
        /* מסגרת כחולה מקווקווה לבלוק הנגרר */
        .dragging {
            outline: 3px dashed #0078FF !important;
            box-shadow: 0 0 8px 2px rgba(0, 120, 255, 0.6) !important;
            z-index: 1000 !important;
            cursor: grabbing !important;
            position: relative !important;
        }
    `;
    
    document.head.appendChild(style);
    console.log('נוספו סגנונות הדגשה להצמדה');
}

// התחלת גרירה
function startDragging(event) {
    // בדוק שזה click שמאלי
    if (event.button !== 0) return;
    
    // הפעלת הגרירה
    const block = event.currentTarget;
    currentDraggedBlock = block;
    isDragging = true;
    
    // חישוב היסט העכבר יחסית לאלמנט
    const rect = block.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    
    // סימון ויזואלי
    block.classList.add('dragging');
    
    // מניעת ברירת המחדל לאפשר גרירה חלקה
    event.preventDefault();
    
    console.log('התחלת גרירה:', block);
}

// הזזת בלוק בעת גרירה
function dragBlock(event) {
    if (!isDragging || !currentDraggedBlock) return;
    
    // קבלת אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    const rect = programmingArea.getBoundingClientRect();
    
    // חישוב מיקום חדש
    const x = event.clientX - rect.left - offsetX;
    const y = event.clientY - rect.top - offsetY;
    
    // עדכון מיקום
    currentDraggedBlock.style.position = 'absolute';
    currentDraggedBlock.style.left = x + 'px';
    currentDraggedBlock.style.top = y + 'px';
    
    // נקה הדגשות קודמות
    clearSnapHighlights();
    
    // בדוק האם יש בלוק קרוב להצמדה
    checkForSnapTarget();
    
    // מניעת ברירת המחדל
    event.preventDefault();
}

// ניקוי הדגשות
function clearSnapHighlights() {
    document.querySelectorAll('.snap-target').forEach(block => {
        block.classList.remove('snap-target');
    });
}

// חיפוש בלוק קרוב להצמדה
function checkForSnapTarget() {
    if (!currentDraggedBlock) return;
    
    // קבלת מיקום הבלוק הנגרר
    const draggedRect = currentDraggedBlock.getBoundingClientRect();
    
    // בדיקת כל הבלוקים האחרים
    const blocks = document.querySelectorAll('.block-container:not(.dragging)');
    let closestBlock = null;
    let minDistance = SNAP_DISTANCE;
    let snapDirection = '';
    
    blocks.forEach(block => {
        const blockRect = block.getBoundingClientRect();
        
        // בדיקה אם הבלוק הנגרר יכול להיות מעל הבלוק הנוכחי
        const topDist = Math.abs(draggedRect.bottom - blockRect.top);
        // בדיקה אם הבלוק הנגרר יכול להיות מתחת לבלוק הנוכחי
        const bottomDist = Math.abs(draggedRect.top - blockRect.bottom);
        
        // יישור אופקי - בדיקה אם יש חפיפה אופקית בין הבלוקים
        const horizontalOverlap = 
            (draggedRect.left < blockRect.right) && 
            (draggedRect.right > blockRect.left);
        
        if (horizontalOverlap) {
            // בדיקה אם יש להצמיד מלמעלה
            if (topDist < minDistance) {
                minDistance = topDist;
                closestBlock = block;
                snapDirection = 'top';
                console.log('בלוק קרוב להצמדה מלמעלה:', block, 'מרחק:', topDist);
            }
            
            // בדיקה אם יש להצמיד מלמטה
            if (bottomDist < minDistance) {
                minDistance = bottomDist;
                closestBlock = block;
                snapDirection = 'bottom';
                console.log('בלוק קרוב להצמדה מלמטה:', block, 'מרחק:', bottomDist);
            }
        }
    });
    
    // אם נמצא בלוק קרוב, הוסף הדגשה
    if (closestBlock) {
        closestBlock.classList.add('snap-target');
        closestBlock.dataset.snapDirection = snapDirection;
        console.log('נמצא בלוק להצמדה:', closestBlock, 'כיוון:', snapDirection);
    }
}

// סיום גרירה - כולל הצמדה אם יש צורך
function stopDragging() {
    if (!isDragging || !currentDraggedBlock) return;
    
    console.log('סיום גרירה');
    
    // בדיקה אם יש בלוק להצמדה
    const targetBlock = document.querySelector('.snap-target');
    
    if (targetBlock) {
        // קבלת כיוון ההצמדה
        const snapDirection = targetBlock.dataset.snapDirection;
        console.log('הצמדה בכיוון:', snapDirection);
        
        // קבלת מיקום יעד ההצמדה
        const programmingArea = document.getElementById('program-blocks');
        const areaRect = programmingArea.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        
        // חישוב מיקום חדש לפי כיוון ההצמדה
        let newLeft = targetRect.left - areaRect.left;
        let newTop;
        
        if (snapDirection === 'top') {
            // הצמדה מעל הבלוק
            newTop = targetRect.top - areaRect.top - currentDraggedBlock.offsetHeight;
        } else {
            // הצמדה מתחת לבלוק
            newTop = targetRect.bottom - areaRect.top;
        }
        
        // עדכון מיקום
        currentDraggedBlock.style.left = newLeft + 'px';
        currentDraggedBlock.style.top = newTop + 'px';
        
        // אנימציית הצמדה
        currentDraggedBlock.animate([
            { transform: 'scale(1.05)' },
            { transform: 'scale(0.95)' },
            { transform: 'scale(1)' }
        ], {
            duration: 200,
            easing: 'ease'
        });
    }
    
    // ניקוי מצב הגרירה
    currentDraggedBlock.classList.remove('dragging');
    clearSnapHighlights();
    
    isDragging = false;
    currentDraggedBlock = null;
}

// הוספת האזנה לאירועי עכבר לבלוק
function setupBlockForDragging(block) {
    // הסרת מאזינים קודמים
    block.removeEventListener('mousedown', startDragging);
    
    // הוספת מאזין חדש
    block.addEventListener('mousedown', startDragging);
}

// הגדרת מאזיני אירועים גלובליים
function setupGlobalListeners() {
    // מאזיני אירועים גלובליים לטיפול בגרירה
    document.addEventListener('mousemove', dragBlock);
    document.addEventListener('mouseup', stopDragging);
    
    // צופה בשינויים - להוספת מאזינים לבלוקים חדשים
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('block-container')) {
                        setupBlockForDragging(node);
                        console.log('הוגדר בלוק חדש לגרירה:', node);
                    }
                });
            }
        });
    });
    
    // התחלת צפייה בשינויים
    observer.observe(programmingArea, { childList: true });
}

// אתחול הגדרות הצמדה לכל הבלוקים הנוכחיים
function setupExistingBlocks() {
    const blocks = document.querySelectorAll('.block-container');
    blocks.forEach(block => {
        setupBlockForDragging(block);
    });
    console.log(`הוגדרו ${blocks.length} בלוקים קיימים לגרירה`);
}

// הפעלת המנגנון בטעינת הדף
function initializeSimpleLinkage() {
    console.log('מאתחל מנגנון הצמדה פשוט...');
    
    // הוסף סגנונות
    addHighlightStyles();
    
    // הגדר מאזינים גלובליים
    setupGlobalListeners();
    
    // הגדר בלוקים קיימים
    setupExistingBlocks();
    
    console.log('מנגנון הצמדה הופעל בהצלחה!');
}

// הפעל בטעינת המסמך
document.addEventListener('DOMContentLoaded', initializeSimpleLinkage);

// הפעל גם אם המסמך כבר נטען
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeSimpleLinkage, 500);
}
