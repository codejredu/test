// ========================================================================
// מנגנון הצמדת בלוקים בממשק תכנות חזותי - linkageimproved.js
// ========================================================================

// הוספת סגנונות CSS למערכת ההצמדה
function addBlockStyles() {
    // וידוא שהסגנונות לא מתווספים פעמיים
    if (document.getElementById('block-linkage-styles')) {
        return;
    }
    
    // יצירת אלמנט סגנון
    const style = document.createElement('style');
    style.id = 'block-linkage-styles';
    style.textContent = `
        /* סגנון בלוק בגרירה */
        .block-container.dragging {
            opacity: 0.8;
            z-index: 1000;
        }
        
        /* סגנון בלוק שמהווה יעד הצמדה */
        .block-container.yellow-highlight {
            background-color: rgba(255, 255, 0, 0.3) !important;
            border: 4px solid #FFD700 !important;
            box-shadow: 0 0 12px 4px rgba(255, 215, 0, 0.7) !important;
        }
        
        /* סגנון בלוק נגרר בעת קרבה להצמדה */
        .block-container.blue-highlight {
            border: 4px dashed #0078FF !important;
            box-shadow: 0 0 12px 4px rgba(0, 120, 255, 0.7) !important;
        }
    `;
    
    // הוספה לדף
    document.head.appendChild(style);
    console.log('סגנונות ההצמדה נוספו לדף');
}

// פונקציית ניהול הצמדת בלוקים
function setupBlockLinkage() {
    console.log('מאתחל מנגנון הצמדת בלוקים פשוט');
    
    // האזור שבו נמצאים הבלוקים
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
        console.error('אזור התכנות לא נמצא!');
        return;
    }
    
    // מאפיינים ומשתנים
    let currentDraggedBlock = null;      // הבלוק שנגרר כעת
    const SNAP_DISTANCE = 20;            // מרחק ההצמדה בפיקסלים
    
    // מעקב אחרי בלוקים מחוברים
    const linkedBlocks = [];             // מערך של מערכים, כל אחד מייצג קבוצת בלוקים מחוברים
    
    // פונקציה למציאת בלוק קרוב
    function findNearbyBlock(draggedBlock) {
        // השג את כל הבלוקים מלבד זה שנגרר
        const blocks = Array.from(programmingArea.querySelectorAll('.block-container'))
            .filter(block => block !== draggedBlock);
        
        // קבל את המיקום של הבלוק הנגרר
        const draggedRect = draggedBlock.getBoundingClientRect();
        
        // בדוק קרבה לכל בלוק אחר
        for (const targetBlock of blocks) {
            const targetRect = targetBlock.getBoundingClientRect();
            
            // בדוק אם הבלוק הנגרר קרוב לחלק העליון או התחתון של בלוק אחר
            const verticalDistance = Math.min(
                Math.abs(draggedRect.bottom - targetRect.top),    // מגיע מלמעלה
                Math.abs(draggedRect.top - targetRect.bottom)     // מגיע מלמטה
            );
            
            // בדיקה אם יש חפיפה אופקית
            const horizontalOverlap = (
                draggedRect.left < targetRect.right &&
                draggedRect.right > targetRect.left
            );
            
            // אם המרחק קטן מסף ההצמדה ויש חפיפה אופקית
            if (verticalDistance < SNAP_DISTANCE && horizontalOverlap) {
                console.log('נמצא בלוק קרוב להצמדה!', targetBlock);
                
                // קבע אם הבלוק מגיע מלמעלה או מלמטה
                const isFromTop = (draggedRect.bottom - targetRect.top) < (targetRect.bottom - draggedRect.top);
                
                return {
                    block: targetBlock,
                    direction: isFromTop ? 'top-to-bottom' : 'bottom-to-top'
                };
            }
        }
        
        // לא נמצא בלוק קרוב
        return null;
    }
    
    // הוספת מאזיני אירועים לבלוקים
    function addEventListenersToBlock(block) {
        block.addEventListener('dragstart', handleDragStart);
        block.addEventListener('drag', handleDrag);
        block.addEventListener('dragend', handleDragEnd);
    }
    
    // טיפול בתחילת גרירה
    function handleDragStart(event) {
        currentDraggedBlock = this;
        console.log('התחלת גרירת בלוק:', currentDraggedBlock);
        
        // סימון הבלוק כנגרר
        this.classList.add('dragging');
        
        // נסה להשתמש בתמונה ריקה להסתרת הצל של הגרירה
        try {
            const img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            event.dataTransfer.setDragImage(img, 0, 0);
        } catch (e) {
            console.warn('לא ניתן להגדיר תמונת גרירה ריקה:', e);
        }
    }
    
    // טיפול בזמן גרירה
    function handleDrag(event) {
        // בדוק שיש מידע תקין על המיקום ושיש בלוק נגרר
        if (!event.clientX || !event.clientY || !currentDraggedBlock) return;
        
        // חשב את המיקום החדש של הבלוק
        const rect = programmingArea.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // עדכן את מיקום הבלוק
        currentDraggedBlock.style.position = 'absolute';
        currentDraggedBlock.style.left = `${x - (currentDraggedBlock.offsetWidth / 2)}px`;
        currentDraggedBlock.style.top = `${y - (currentDraggedBlock.offsetHeight / 2)}px`;
        
        // נקה הדגשות קודמות
        document.querySelectorAll('.block-container').forEach(block => {
            block.classList.remove('yellow-highlight');
            block.classList.remove('blue-highlight');
        });
        
        // חפש בלוק קרוב
        const nearbyInfo = findNearbyBlock(currentDraggedBlock);
        
        // אם נמצא בלוק קרוב, הדגש אותו
        if (nearbyInfo) {
            // הדגש את הבלוק היעד בצהוב
            nearbyInfo.block.classList.add('yellow-highlight');
            
            // הדגש את הבלוק הנגרר בכחול
            currentDraggedBlock.classList.add('blue-highlight');
            
            // שמור את כיוון ההצמדה
            currentDraggedBlock.dataset.snapDirection = nearbyInfo.direction;
            currentDraggedBlock.dataset.snapTarget = nearbyInfo.block.dataset.type;
        }
    }
    
    // טיפול בסיום גרירה
    function handleDragEnd(event) {
        // בדוק אם יש בלוק שנגרר כעת
        if (!currentDraggedBlock) return;
        
        console.log('סיום גרירת בלוק');
        
        // בדוק אם יש יעד הצמדה
        const snapDirection = currentDraggedBlock.dataset.snapDirection;
        const snapTargetType = currentDraggedBlock.dataset.snapTarget;
        
        if (snapDirection && snapTargetType) {
            // מצא את בלוק היעד
            const targetBlock = Array.from(programmingArea.querySelectorAll('.block-container'))
                .find(block => block.classList.contains('yellow-highlight'));
            
            if (targetBlock) {
                console.log('מבצע הצמדה:', snapDirection, 'ליעד:', targetBlock);
                
                // חשב את המיקום החדש של הבלוק
                const targetRect = targetBlock.getBoundingClientRect();
                const areaRect = programmingArea.getBoundingClientRect();
                
                let newLeft = targetRect.left - areaRect.left;
                let newTop;
                
                if (snapDirection === 'bottom-to-top') {
                    // הבלוק הנגרר צריך להיות מעל היעד
                    newTop = targetRect.top - areaRect.top - currentDraggedBlock.offsetHeight;
                } else {
                    // הבלוק הנגרר צריך להיות מתחת ליעד
                    newTop = targetRect.bottom - areaRect.top;
                }
                
                // עדכן את מיקום הבלוק
                currentDraggedBlock.style.left = `${newLeft}px`;
                currentDraggedBlock.style.top = `${newTop}px`;
                
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
        }
        
        // נקה את ההדגשות
        document.querySelectorAll('.block-container').forEach(block => {
            block.classList.remove('dragging');
            block.classList.remove('yellow-highlight');
            block.classList.remove('blue-highlight');
        });
        
        // נקה נתונים
        delete currentDraggedBlock.dataset.snapDirection;
        delete currentDraggedBlock.dataset.snapTarget;
        currentDraggedBlock = null;
    }
    
    // הוסף האזנה לשינויים ב-DOM כדי להוסיף מאזינים לבלוקים חדשים
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('block-container')) {
                        addEventListenersToBlock(node);
                    }
                });
            }
        });
    });
    
    // התחל להאזין לשינויים
    observer.observe(programmingArea, { childList: true });
    
    // הוסף מאזינים לבלוקים קיימים
    programmingArea.querySelectorAll('.block-container').forEach(block => {
        addEventListenersToBlock(block);
    });
    
    // עדכן את המאזין לנפילת בלוקים 
    function handleImprovedDrop(event) {
        event.preventDefault();
        
        // בדיקה אם מדובר בהזזת בלוק קיים
        const blockIndex = event.dataTransfer.getData('block-index');
        if (blockIndex !== undefined && blockIndex !== '') {
            // הזזת בלוק קיים מטופלת בפונקציות הגרירה
            return;
        }
        
        // יצירת בלוק חדש (נשאר כמו בקוד המקורי)
        const dataString = event.dataTransfer.getData("text/plain");
        
        if (!dataString) {
            console.error("No data transferred on drop.");
            return;
        }
        
        try {
            const data = JSON.parse(dataString);
            const blockCategory = data.category;
            const blockDefinition = blocks[blockCategory]?.find(b => b.type === data.type);
            
            if (!blockDefinition) {
                console.error("Could not find block definition:", data);
                return;
            }
            
            // יצירת בלוק חדש
            const newBlock = createBlockElement(blockDefinition, blockCategory);
            programmingArea.appendChild(newBlock);
            
            // הוספת מאזיני גרירה
            addEventListenersToBlock(newBlock);
            
            // מיקום הבלוק החדש
            const rect = programmingArea.getBoundingClientRect();
            newBlock.style.position = "absolute";
            const blockWidth = newBlock.offsetWidth || 100;
            const blockHeight = newBlock.offsetHeight || 80;
            newBlock.style.left = `${event.clientX - rect.left - (blockWidth / 2)}px`;
            newBlock.style.top = `${event.clientY - rect.top - (blockHeight / 2)}px`;
            
        } catch (e) {
            console.error("Error parsing dropped data:", e);
        }
    }
    
    // החלף את מאזין הdrop
    programmingArea.removeEventListener('drop', handleDrop);
    programmingArea.addEventListener('drop', handleImprovedDrop);
    
    console.log('מאזיני אירועי הצמדה הוגדרו בהצלחה!');
}

// הפעלת המערכת
document.addEventListener('DOMContentLoaded', function() {
    console.log('מאתחל מערכת הצמדת בלוקים...');
    addBlockStyles();
    setupBlockLinkage();
});

// הפעל גם אם הדף כבר נטען
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('הדף כבר נטען, מאתחל מנגנון הצמדה מיד');
    setTimeout(function() {
        addBlockStyles();
        setupBlockLinkage();
    }, 500);
}
