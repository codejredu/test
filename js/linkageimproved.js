/**
 * מנגנון מתוקן להצמדת בלוקים - fixed-linkage.js
 * עם הדגשות רק בזמן קרבה (לא במהלך כל הגרירה)
 */

// גלובלי - מידע על הבלוק הנוכחי שנגרר
let currentDraggedBlock = null;
let isDragging = false;
let offsetX, offsetY;

// הגדרות
const SNAP_DISTANCE = 30; // מרחק בפיקסלים להצמדה - הוגדל מ-20 ל-30 לשיפור רגישות

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
            background-color: rgba(255, 255, 0, 0.3) !important;
            border: 2px solid #FFD700 !important;
            box-shadow: 0 0 8px 2px rgba(255, 215, 0, 0.6) !important;
            z-index: 100 !important;
            position: relative !important;
        }
        
        /* מסגרת כחולה מקווקווה לבלוק הנגרר - רק בזמן קרבה */
        .near-snap {
            border: 2px dashed #0078FF !important;
            box-shadow: 0 0 8px 2px rgba(0, 120, 255, 0.6) !important;
            z-index: 1000 !important;
            position: relative !important;
        }
        
        /* סגנון גרירה רגילה - ללא דגשים מיוחדים */
        .simple-dragging {
            opacity: 0.9;
            cursor: grabbing !important;
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
    
    // סימון ויזואלי פשוט (בלי המסגרת הכחולה)
    block.classList.add('simple-dragging');
    
    // מניעת ברירת המחדל לאפשר גרירה חלקה
    event.preventDefault();
    
    console.log('התחלת גרירה:', block);
}

// הזזת בלוק בעת גרירה
function dragBlock(event) {
    if (!isDragging || !currentDraggedBlock) return;
    
    // קבלת אזור התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return; // וידוא שאזור התכנות קיים
    
    const rect = programmingArea.getBoundingClientRect();
    
    // חישוב מיקום חדש
    const x = event.clientX - rect.left - offsetX;
    const y = event.clientY - rect.top - offsetY;
    
    // עדכון מיקום
    currentDraggedBlock.style.position = 'absolute';
    currentDraggedBlock.style.left = x + 'px';
    currentDraggedBlock.style.top = y + 'px';
    
    // נקה הדגשות קודמות
    clearAllHighlights();
    
    // בדוק האם יש בלוק קרוב להצמדה
    checkForSnapTarget();
    
    // מניעת ברירת המחדל
    event.preventDefault();
}

// ניקוי כל ההדגשות
function clearAllHighlights() {
    // ניקוי הדגשת יעד הצמדה
    document.querySelectorAll('.snap-target').forEach(block => {
        block.classList.remove('snap-target');
    });
    
    // ניקוי הדגשת בלוק נגרר
    if (currentDraggedBlock) {
        currentDraggedBlock.classList.remove('near-snap');
    }
}

// חיפוש בלוק קרוב להצמדה
function checkForSnapTarget() {
    if (!currentDraggedBlock) return;
    
    // קבלת מיקום הבלוק הנגרר
    const draggedRect = currentDraggedBlock.getBoundingClientRect();
    
    // בדיקת כל הבלוקים האחרים
    const blocks = document.querySelectorAll('.block-container:not(.simple-dragging)');
    let nearBlock = null;
    let minDistance = SNAP_DISTANCE;
    let snapDirection = '';
    
    // לוגים של המרחק הנבדק וסטטוס כללי
    console.log(`בדיקת הצמדה - minDistance התחלתי: ${minDistance}, בלוקים לבדיקה: ${blocks.length}`);
    
    blocks.forEach(block => {
        const blockRect = block.getBoundingClientRect();
        
        // בדיקה אם הבלוק הנגרר יכול להיות מעל הבלוק הנוכחי
        const topDist = Math.abs(draggedRect.bottom - blockRect.top);
        // בדיקה אם הבלוק הנגרר יכול להיות מתחת לבלוק הנוכחי
        const bottomDist = Math.abs(draggedRect.top - blockRect.bottom);
        
        // יישור אופקי - בדיקה אם יש חפיפה אופקית בין הבלוקים
        // הרחבת התנאי כדי להתחשב גם במקרים של חפיפה חלקית
        const horizontalOverlap = 
            (draggedRect.left <= blockRect.right && draggedRect.right >= blockRect.left);
        
        // לוגינג מפורט - כדי לראות את חישובי המרחקים
        console.log(`בדיקת קרבה: בלוק=${block.dataset.type}, מרחק עליון=${topDist}, מרחק תחתון=${bottomDist}, חפיפה אופקית=${horizontalOverlap}`);
        
        if (horizontalOverlap) {
            // בדיקה אם יש להצמיד מלמעלה
            if (topDist <= minDistance) { // שונה מ < ל <= לשיפור הזיהוי
                minDistance = topDist;
                nearBlock = block;
                snapDirection = 'top';
                console.log('בלוק קרוב להצמדה מלמעלה:', block, 'מרחק:', topDist);
            }
            
            // בדיקה אם יש להצמיד מלמטה
            if (bottomDist <= minDistance) { // שונה מ < ל <= לשיפור הזיהוי
                minDistance = bottomDist;
                nearBlock = block;
                snapDirection = 'bottom';
                console.log('בלוק קרוב להצמדה מלמטה:', block, 'מרחק:', bottomDist);
            }
        }
    });
    
    // אם נמצא בלוק קרוב, הוסף הדגשות
    if (nearBlock) {
        console.log('!!! נמצא בלוק קרוב להצמדה !!!', nearBlock, 'כיוון:', snapDirection, 'מרחק:', minDistance);
        
        // הוסף הילה צהובה ליעד ההצמדה
        nearBlock.classList.add('snap-target');
        nearBlock.dataset.snapDirection = snapDirection;
        
        // הוסף מסגרת כחולה לבלוק הנגרר - רק כשיש בלוק קרוב
        currentDraggedBlock.classList.add('near-snap');
        
        // בדיקת סטטוס הוספת המחלקות - דיבאג נוסף
        console.log('סטטוס המחלקות:',
            'snap-target:', nearBlock.classList.contains('snap-target'),
            'near-snap:', currentDraggedBlock.classList.contains('near-snap'));
    } else {
        console.log('לא נמצא בלוק להצמדה במרחק מתאים');
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
    currentDraggedBlock.classList.remove('simple-dragging');
    currentDraggedBlock.classList.remove('near-snap');
    clearAllHighlights();
    
    isDragging = false;
    currentDraggedBlock = null;
}

// הוספת האזנה לאירועי עכבר לבלוק
function setupBlockForDragging(block) {
    // הסרת מאזינים קודמים
    block.removeEventListener('mousedown', startDragging);
    
    // הוספת מאזין חדש
    block.addEventListener('mousedown', startDragging);
    
    // וידוא שהבלוק הוגדר למצב draggable=true
    if (block.getAttribute('draggable') !== 'true') {
        block.setAttribute('draggable', 'true');
    }
}

// הגדרת מאזיני אירועים גלובליים
function setupGlobalListeners() {
    // מאזיני אירועים גלובליים לטיפול בגרירה
    document.addEventListener('mousemove', dragBlock);
    document.addEventListener('mouseup', stopDragging);
    
    // צופה בשינויים - להוספת מאזינים לבלוקים חדשים
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
        console.error('לא נמצא אזור תכנות עם ID: program-blocks');
        return;
    }
    
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
    observer.observe(programmingArea, { childList: true, subtree: true });
}

// אתחול הגדרות הצמדה לכל הבלוקים הנוכחיים
function setupExistingBlocks() {
    const blocks = document.querySelectorAll('.block-container');
    blocks.forEach(block => {
        setupBlockForDragging(block);
    });
    console.log(`הוגדרו ${blocks.length} בלוקים קיימים לגרירה`);
}

// פונקציה לאיפוס ידני של ההדגשות במקרה של בעיות
function forceResetHighlights() {
    console.log('איפוס ידני של כל ההדגשות');
    clearAllHighlights();
    
    // איפוס גם של המחלקה simple-dragging
    document.querySelectorAll('.simple-dragging').forEach(block => {
        block.classList.remove('simple-dragging');
    });
    
    isDragging = false;
    currentDraggedBlock = null;
}

// הפעלת המנגנון בטעינת הדף
function initializeFixedLinkage() {
    console.log('מאתחל מנגנון הצמדה מתוקן...');
    
    // הוסף סגנונות
    addHighlightStyles();
    
    // הגדר מאזינים גלובליים
    setupGlobalListeners();
    
    // הגדר בלוקים קיימים
    setupExistingBlocks();
    
    // הוסף פונקציית איפוס גלובלית לדיבאג
    window.resetBlockHighlights = forceResetHighlights;
    
    console.log('מנגנון הצמדה מתוקן הופעל בהצלחה!');
}

// הפעל בטעינת המסמך
document.addEventListener('DOMContentLoaded', initializeFixedLinkage);

// הפעל גם אם המסמך כבר נטען
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeFixedLinkage, 500);
}
