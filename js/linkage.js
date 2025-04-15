// linkage.js - פונקציונליות הצמדת בלוקים לסביבת ScratchJr

document.addEventListener('DOMContentLoaded', () => {
    // נתונים גלובליים
    const SNAP_THRESHOLD = 20; // מרחק בפיקסלים שבו תתבצע הצמדה
    let blockBeingDragged = null;
    let potentialTargetBlock = null;
    
    // מאזין לאירועים במרחב התכנות
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
        console.error('חסר אלמנט מרחב התכנות (#program-blocks)');
        return;
    }

    // יצירת אירועי דרג-דרופ משופרים
    function initializeBlockDragHandlers() {
        // מאתר את כל הבלוקים הקיימים במרחב התכנות
        const existingBlocks = programmingArea.querySelectorAll('.block-container');
        existingBlocks.forEach(setupBlockDragHandlers);
        
        // מאזין לשינויים במרחב התכנות - הוספה של בלוקים חדשים
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.classList && node.classList.contains('block-container')) {
                            setupBlockDragHandlers(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(programmingArea, { childList: true });
    }
    
    // הגדרת מאזיני האירועים לכל בלוק
    function setupBlockDragHandlers(block) {
        // מסיר מאזינים קודמים כדי למנוע כפילויות
        block.removeEventListener('mousedown', handleBlockMouseDown);
        block.removeEventListener('touchstart', handleBlockTouchStart);
        
        // מוסיף מאזינים חדשים
        block.addEventListener('mousedown', handleBlockMouseDown);
        block.addEventListener('touchstart', handleBlockTouchStart);
        
        // מאפשר פתיחת אירוע drag רגיל גם במקביל
        block.addEventListener('dragstart', (e) => {
            blockBeingDragged = block;
        });
        
        // סיום גרירה
        block.addEventListener('dragend', () => {
            resetBlockStyles();
            blockBeingDragged = null;
        });
    }
    
    // טיפול באירוע mousedown
    function handleBlockMouseDown(e) {
        // שומר את הבלוק הנגרר
        blockBeingDragged = e.currentTarget;
        
        // מוסיף מאזינים זמניים בזמן הגרירה
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // מונע ברירת מחדל כדי לא להפריע לגרירה
        e.preventDefault();
    }
    
    // טיפול באירוע touchstart (לתמיכה במכשירים ניידים)
    function handleBlockTouchStart(e) {
        // שומר את הבלוק הנגרר
        blockBeingDragged = e.currentTarget;
        
        // מוסיף מאזינים זמניים בזמן הגרירה
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
        
        // מונע ברירת מחדל כדי לא להפריע לגרירה
        e.preventDefault();
    }
    
    // טיפול בתנועת העכבר בזמן גרירה
    function handleMouseMove(e) {
        if (!blockBeingDragged) return;
        
        // עדכון מיקום הבלוק הנגרר
        updateDragPosition(e.clientX, e.clientY);
        
        // בדיקת קרבה לבלוקים אחרים
        checkForPotentialConnections();
    }
    
    // טיפול בתנועת מגע בזמן גרירה (למכשירים ניידים)
    function handleTouchMove(e) {
        if (!blockBeingDragged || !e.touches[0]) return;
        
        // עדכון מיקום הבלוק הנגרר
        updateDragPosition(e.touches[0].clientX, e.touches[0].clientY);
        
        // בדיקת קרבה לבלוקים אחרים
        checkForPotentialConnections();
        
        // מונע גלילה במסך בזמן גרירה
        e.preventDefault();
    }
    
    // עדכון מיקום הבלוק הנגרר
    function updateDragPosition(clientX, clientY) {
        const rect = programmingArea.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // מגביל את הבלוק לתוך מרחב התכנות
        const maxX = rect.width - blockBeingDragged.offsetWidth;
        const maxY = rect.height - blockBeingDragged.offsetHeight;
        
        const boundedX = Math.max(0, Math.min(x, maxX));
        const boundedY = Math.max(0, Math.min(y, maxY));
        
        blockBeingDragged.style.position = 'absolute';
        blockBeingDragged.style.left = `${boundedX}px`;
        blockBeingDragged.style.top = `${boundedY}px`;
    }
    
    // בדיקה אם הבלוק הנגרר קרוב לבלוקים אחרים להצמדה
    function checkForPotentialConnections() {
        if (!blockBeingDragged) return;
        
        // מאפס סטייל קודם
        resetBlockStyles();
        
        // בודק את כל הבלוקים (חוץ מהנגרר) לחיבור אפשרי
        const blocks = Array.from(programmingArea.querySelectorAll('.block-container'));
        
        // בדיקה אם בלוק end - אלה לא יכולים להיות יעד להצמדה מלמטה
        const isEndBlock = blockBeingDragged.dataset.category === 'end';
        
        // מחשב את המיקום של הבליטה הימנית (connector) של הבלוק הנגרר
        const draggedRect = blockBeingDragged.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();
        
        // נקודת החיבור הימנית של הבלוק הנגרר
        const draggedRightConnector = {
            x: draggedRect.right - programRect.left,
            y: draggedRect.top + (draggedRect.height / 2) - programRect.top
        };
        
        // חיפוש הבלוק הקרוב ביותר להצמדה
        let closestBlock = null;
        let closestDistance = SNAP_THRESHOLD;
        
        blocks.forEach(block => {
            // דילוג על עצמו
            if (block === blockBeingDragged) return;
            
            // בלוקי repeat מטופלים באופן מיוחד - בודק אם הבלוק הנגרר הוא מסוג repeat
            if (blockBeingDragged.dataset.type === 'repeat' && block.dataset.category !== 'end') {
                // לוגיקה מיוחדת לבלוקי repeat
                checkRepeatBlockConnection(block);
                return;
            }
            
            // בלוקי end לא יכולים להתחבר מלמטה
            if (isEndBlock && block.querySelector('.block-connected-bottom')) return;
            
            const blockRect = block.getBoundingClientRect();
            
            // נקודת החיבור השמאלית
            const blockLeftConnector = {
                x: blockRect.left - programRect.left,
                y: blockRect.top + (blockRect.height / 2) - programRect.top
            };
            
            // חישוב מרחק בין נקודות החיבור
            const distance = Math.sqrt(
                Math.pow(draggedRightConnector.x - blockLeftConnector.x, 2) +
                Math.pow(draggedRightConnector.y - blockLeftConnector.y, 2)
            );
            
            // אם נמצא קרוב יותר מהסף ומהקודם
            if (distance < SNAP_THRESHOLD && distance < closestDistance) {
                closestDistance = distance;
                closestBlock = block;
            }
        });
        
        // אם נמצא בלוק קרוב, מסמן אותו כפוטנציאלי להצמדה
        if (closestBlock) {
            potentialTargetBlock = closestBlock;
            highlightPotentialConnection(closestBlock);
        } else {
            potentialTargetBlock = null;
        }
    }
    
    // בדיקת חיבור מיוחדת לבלוקי repeat
    function checkRepeatBlockConnection(targetBlock) {
        // לוגיקה ספציפית לבלוקי repeat תתווסף כאן
        // למשל, בדיקה אם הבלוק המטרה יכול להיכנס לתוך לולאת הrepeat
    }
    
    // הדגשת חיבור פוטנציאלי
    function highlightPotentialConnection(block) {
        // הוספת סטייל או קלאס להדגשת אפשרות החיבור
        block.classList.add('potential-connection');
        
        // אפשר גם לשנות סטייל ישירות
        const scratchBlock = block.querySelector('.scratch-block');
        if (scratchBlock) {
            // שמירת הצבע המקורי לשחזור מאוחר יותר
            scratchBlock.dataset.originalBoxShadow = scratchBlock.style.boxShadow;
            // הוספת אפקט הילה לסימון אפשרות החיבור
            scratchBlock.style.boxShadow = '0 0 10px 3px rgba(255, 255, 0, 0.7)';
        }
    }
    
    // איפוס סטייל של כל הבלוקים
    function resetBlockStyles() {
        // מסיר את כל סימוני ההדגשה
        const blocks = programmingArea.querySelectorAll('.block-container');
        blocks.forEach(block => {
            block.classList.remove('potential-connection');
            
            const scratchBlock = block.querySelector('.scratch-block');
            if (scratchBlock && scratchBlock.dataset.originalBoxShadow !== undefined) {
                scratchBlock.style.boxShadow = scratchBlock.dataset.originalBoxShadow;
                delete scratchBlock.dataset.originalBoxShadow;
            }
        });
        
        potentialTargetBlock = null;
    }
    
    // סיום גרירה עם עכבר
    function handleMouseUp(e) {
        if (!blockBeingDragged) return;
        
        // אם יש בלוק מטרה פוטנציאלי, מבצע הצמדה
        if (potentialTargetBlock) {
            snapBlocks(blockBeingDragged, potentialTargetBlock);
        }
        
        // ניקוי האירועים הזמניים והמצב
        cleanup();
    }
    
    // סיום גרירה עם מגע (מכשירים ניידים)
    function handleTouchEnd(e) {
        if (!blockBeingDragged) return;
        
        // אם יש בלוק מטרה פוטנציאלי, מבצע הצמדה
        if (potentialTargetBlock) {
            snapBlocks(blockBeingDragged, potentialTargetBlock);
        }
        
        // ניקוי האירועים הזמניים והמצב
        cleanup();
        
        e.preventDefault();
    }
    
    // ניקוי אירועים ומצב
    function cleanup() {
        // הסרת מאזינים זמניים
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        
        // איפוס סטיילים
        resetBlockStyles();
        
        // איפוס משתנים גלובליים
        blockBeingDragged = null;
        potentialTargetBlock = null;
    }
    
    // ביצוע הצמדה בין שני בלוקים
    function snapBlocks(sourceBlock, targetBlock) {
        // בדיקה מיוחדת לבלוקי repeat
        if (sourceBlock.dataset.type === 'repeat') {
            handleRepeatBlockSnap(sourceBlock, targetBlock);
            return;
        }
        
        // חישוב מיקום יחסי לפי הנקודות
        const sourceRect = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        const programRect = programmingArea.getBoundingClientRect();
        
        // חישוב המיקום החדש
        const newLeft = targetRect.left - programRect.left - sourceRect.width + 2; // 2 פיקסלים לחפיפה קלה
        const newTop = targetRect.top - programRect.top;
        
        // עדכון המיקום
        sourceBlock.style.position = 'absolute';
        sourceBlock.style.left = `${newLeft}px`;
        sourceBlock.style.top = `${newTop}px`;
        
        // סימון החיבור
        sourceBlock.classList.add('block-connected');
        targetBlock.classList.add('block-connected');
        
        sourceBlock.dataset.connectedTo = targetBlock.id || generateBlockId(targetBlock);
        
        // יצירת קשר ויזואלי (אופציונלי)
        visualizeConnection(sourceBlock, targetBlock);
        
        // אירוע לידיעת שאר המערכת
        dispatchConnectionEvent(sourceBlock, targetBlock);
    }
    
    // טיפול בהצמדת בלוק repeat
    function handleRepeatBlockSnap(repeatBlock, targetBlock) {
        // לוגיקת הצמדה ספציפית לבלוקי repeat
        // צריכה להתחשב במבנה המיוחד של repeat
    }
    
    // יצירת אפקט ויזואלי לחיבור (אופציונלי)
    function visualizeConnection(sourceBlock, targetBlock) {
        // לדוגמה: יצירת הבלטה של החיבור
        const sourceScratchBlock = sourceBlock.querySelector('.scratch-block');
        const targetScratchBlock = targetBlock.querySelector('.scratch-block');
        
        if (sourceScratchBlock && targetScratchBlock) {
            // אפשר לסמן את הבלוק שמחובר מעליו
            targetBlock.classList.add('has-block-above');
            
            // וכן לסמן את הבלוק שמחובר מתחתיו
            sourceBlock.classList.add('has-block-below');
        }
    }
    
    // יצירת מזהה ייחודי לבלוק אם אין לו
    function generateBlockId(block) {
        if (!block.id) {
            const blockId = `block-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            block.id = blockId;
        }
        return block.id;
    }
    
    // שליחת אירוע לידיעת שאר המערכת
    function dispatchConnectionEvent(sourceBlock, targetBlock) {
        const event = new CustomEvent('blocksConnected', {
            detail: {
                sourceBlock: sourceBlock,
                targetBlock: targetBlock,
                sourceType: sourceBlock.dataset.type,
                targetType: targetBlock.dataset.type,
                time: new Date().getTime()
            },
            bubbles: true
        });
        
        programmingArea.dispatchEvent(event);
    }
    
    // טיפול באירוע drop מקורי של הדף
    function enhanceOriginalDropHandler() {
        // שמירת הטיפול המקורי
        const originalDropHandler = programmingArea.ondrop;
        
        // החלפת הטיפול בפונקציה משופרת
        programmingArea.ondrop = function(event) {
            // קריאה לטיפול המקורי
            if (typeof originalDropHandler === 'function') {
                originalDropHandler.call(this, event);
            }
            
            // שמירת הבלוק האחרון שנוסף (מניח שהוא האחרון ברשימה)
            const blocks = programmingArea.querySelectorAll('.block-container');
            const lastBlock = blocks[blocks.length - 1];
            
            if (lastBlock) {
                // הגדרת מאזינים לבלוק החדש
                setupBlockDragHandlers(lastBlock);
                
                // בדיקה אם הבלוק החדש קרוב לבלוקים אחרים
                setTimeout(() => {
                    blockBeingDragged = lastBlock;
                    checkForPotentialConnections();
                    
                    // אם יש בלוק פוטנציאלי להצמדה, מצמיד אליו
                    if (potentialTargetBlock) {
                        snapBlocks(lastBlock, potentialTargetBlock);
                    }
                    
                    blockBeingDragged = null;
                    resetBlockStyles();
                }, 50);
            }
        };
    }
    
    // כפתור "Clear All" צריך גם לנקות את כל החיבורים
    function enhanceClearAllHandler() {
        const clearAllButton = document.getElementById('clear-all');
        if (clearAllButton) {
            // שמירת הטיפול המקורי
            const originalClickHandler = clearAllButton.onclick;
            
            // הוספת ניקוי חיבורים
            clearAllButton.onclick = function(event) {
                // קריאה לטיפול המקורי
                if (typeof originalClickHandler === 'function') {
                    originalClickHandler.call(this, event);
                }
                
                // ניקוי נוסף אם נדרש
                resetAllConnections();
            };
        }
    }
    
    // איפוס כל החיבורים במערכת
    function resetAllConnections() {
        const blocks = programmingArea.querySelectorAll('.block-container');
        blocks.forEach(block => {
            block.classList.remove('block-connected', 'has-block-above', 'has-block-below');
            delete block.dataset.connectedTo;
        });
    }
    
    // פונקציות חשיפה כלפי חוץ
    window.ScratchJrLinkage = {
        initialize: function() {
            initializeBlockDragHandlers();
            enhanceOriginalDropHandler();
            enhanceClearAllHandler();
        },
        getConnectedBlocks: function(blockId) {
            // מחזיר רשימת בלוקים מחוברים לבלוק מסוים
            const block = document.getElementById(blockId);
            if (!block) return [];
            
            const connectedBlocks = [];
            const blocks = programmingArea.querySelectorAll('.block-container');
            
            blocks.forEach(otherBlock => {
                if (otherBlock.dataset.connectedTo === blockId) {
                    connectedBlocks.push(otherBlock);
                }
            });
            
            return connectedBlocks;
        },
        isConnected: function(blockId) {
            // בודק אם בלוק מחובר לאחרים
            const block = document.getElementById(blockId);
            return block && (
                block.classList.contains('block-connected') || 
                block.classList.contains('has-block-above') || 
                block.classList.contains('has-block-below')
            );
        }
    };
    
    // אתחול אוטומטי כשהדף נטען
    setTimeout(() => {
        window.ScratchJrLinkage.initialize();
        console.log('ScratchJr Linkage system initialized');
    }, 500);
});
