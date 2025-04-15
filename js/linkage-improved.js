/**
 * linkage-improved.js - פתרון גרירה וחיבור לבנים ללא רוחות רפאים
 */

(function() {
    // נוודא שהגרירה הטבעית של הדפדפן כבויה לחלוטין ברמת המסמך
    document.addEventListener('DOMContentLoaded', function() {
        // הגדר משתנים גלובליים
        let isDragging = false;
        let draggedElement = null;
        let dragOffsetX = 0;
        let dragOffsetY = 0;
        let dragClone = null;
        let potentialConnection = null;
        
        // קבועים
        const HIGHLIGHT_COLOR = '#0D6EFD';
        const CONNECTION_THRESHOLD = 20;
        const SNAP_THRESHOLD = 10;
        
        // גישה לאלמנטים העיקריים
        const blockPalette = document.getElementById('block-palette');
        const programmingArea = document.getElementById('program-blocks');
        
        if (!blockPalette || !programmingArea) {
            console.error('לא נמצאו אלמנטים חיוניים');
            return;
        }
        
        // הוסף סגנון CSS גלובלי שמבטל גרירה באופן מוחלט
        const style = document.createElement('style');
        style.innerHTML = `
            * {
                -webkit-user-drag: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
            }
            
            .block-container, .scratch-block, img {
                pointer-events: auto !important;
                user-drag: none !important;
                -webkit-user-drag: none !important;
                -moz-user-drag: none !important;
                -ms-user-drag: none !important;
                -khtml-user-drag: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                drag: none !important;
                draggable: false !important;
            }
            
            .drop-highlight {
                box-shadow: 0 0 10px 3px ${HIGHLIGHT_COLOR} !important;
                border: 2px solid ${HIGHLIGHT_COLOR} !important;
            }
            
            .drag-clone {
                position: absolute;
                z-index: 9999;
                opacity: 0.8;
                pointer-events: none;
                transform-origin: center center;
            }
        `;
        document.head.appendChild(style);
        
        // ביטול גרירה לכל האלמנטים
        function disableDragForElement(element) {
            if (!element) return;
            
            // שים מאזיני אירועים שמבטלים את כל אירועי הגרירה
            ['dragstart', 'drag', 'dragend', 'dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                element.addEventListener(eventName, function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }, true); // השתמש ב-capture כדי לתפוס את האירוע בשלב מוקדם
            });
            
            // מאפיינים שמבטלים גרירה
            element.setAttribute('draggable', 'false');
            element.draggable = false;
            
            // טיפול בתמונות בתוך האלמנט
            element.querySelectorAll('img').forEach(img => {
                img.setAttribute('draggable', 'false');
                img.draggable = false;
                
                ['dragstart', 'drag', 'dragend'].forEach(eventName => {
                    img.addEventListener(eventName, function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }, true);
                });
            });
        }
        
        // ביטול גרירה ברמת המסמך
        function disableGlobalDrag() {
            document.addEventListener('dragstart', preventDefault, true);
            
            // ביטול גרירה לכל התמונות
            document.querySelectorAll('img').forEach(img => {
                img.setAttribute('draggable', 'false');
                img.draggable = false;
            });
            
            // ביטול גרירה לכל המיכלים של הלבנים
            document.querySelectorAll('.block-container').forEach(block => {
                disableDragForElement(block);
            });
        }
        
        // פונקציה למניעת ברירת מחדל
        function preventDefault(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // תפיסת אירוע לחיצה על לבנה באזור הלבנים
        function handlePaletteMouseDown(e) {
            // וודא שהלחיצה היא על לבנה
            const blockContainer = e.target.closest('.block-container');
            if (!blockContainer) return;
            
            // מנע פעולות ברירת מחדל
            e.preventDefault();
            e.stopPropagation();
            
            // חשב היסט של נקודת הלחיצה מתחילת הלבנה
            const rect = blockContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            // צור קלון של הלבנה לגרירה
            dragClone = blockContainer.cloneNode(true);
            dragClone.classList.add('drag-clone');
            dragClone.style.position = 'fixed'; // השתמש ב-fixed במקום absolute
            dragClone.style.left = (e.clientX - dragOffsetX) + 'px';
            dragClone.style.top = (e.clientY - dragOffsetY) + 'px';
            dragClone.style.pointerEvents = 'none';
            dragClone.style.opacity = '0.8';
            dragClone.style.zIndex = '9999';
            
            // שמור מידע על הלבנה הנגררת
            draggedElement = {
                source: 'palette',
                element: blockContainer,
                type: blockContainer.dataset.type,
                category: blockContainer.dataset.category
            };
            
            // ביטול גרירה של הקלון
            disableDragForElement(dragClone);
            
            // הוספת הקלון לתחתית הדף (מחוץ לזרימת המסמך)
            document.body.appendChild(dragClone);
            
            // סמן שהתחלנו לגרור
            isDragging = true;
            
            // הוסף מאזיני אירועים זמניים
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        
        // תפיסת אירוע לחיצה על לבנה באזור התכנות
        function handleProgramMouseDown(e) {
            // וודא שהלחיצה היא על לבנה
            const blockContainer = e.target.closest('.block-container');
            if (!blockContainer) return;
            
            // מנע פעולות ברירת מחדל
            e.preventDefault();
            e.stopPropagation();
            
            // חשב היסט של נקודת הלחיצה מתחילת הלבנה
            const rect = blockContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            // שמור מידע על הלבנה הנגררת
            draggedElement = {
                source: 'program',
                element: blockContainer,
                type: blockContainer.dataset.type,
                category: blockContainer.dataset.category,
                startLeft: parseInt(blockContainer.style.left || '0'),
                startTop: parseInt(blockContainer.style.top || '0')
            };
            
            // הבא את הלבנה קדימה
            blockContainer.style.zIndex = '1000';
            
            // סמן שהתחלנו לגרור
            isDragging = true;
            
            // הוסף מאזיני אירועים זמניים
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        
        // טיפול בתנועת העכבר בזמן גרירה
        function handleMouseMove(e) {
            if (!isDragging || !draggedElement) return;
            
            // מנע פעולות ברירת מחדל
            e.preventDefault();
            e.stopPropagation();
            
            // טיפול בגרירה מאזור הלבנים (עם קלון)
            if (draggedElement.source === 'palette' && dragClone) {
                // עדכן את מיקום הקלון
                dragClone.style.left = (e.clientX - dragOffsetX) + 'px';
                dragClone.style.top = (e.clientY - dragOffsetY) + 'px';
                
                // בדוק אם הקלון מעל אזור התכנות
                const areaRect = programmingArea.getBoundingClientRect();
                const isOverProgramArea = (
                    e.clientX >= areaRect.left &&
                    e.clientX <= areaRect.right &&
                    e.clientY >= areaRect.top &&
                    e.clientY <= areaRect.bottom
                );
                
                // שנה שקיפות בהתאם
                dragClone.style.opacity = isOverProgramArea ? '1.0' : '0.7';
            }
            // טיפול בגרירה באזור התכנות
            else if (draggedElement.source === 'program') {
                const block = draggedElement.element;
                const areaRect = programmingArea.getBoundingClientRect();
                
                // חישוב מיקום חדש (יחסי לאזור התכנות)
                let newLeft = e.clientX - areaRect.left - dragOffsetX;
                let newTop = e.clientY - areaRect.top - dragOffsetY;
                
                // וידוא שהלבנה נשארת באזור התכנות
                const blockRect = block.getBoundingClientRect();
                newLeft = Math.max(0, Math.min(newLeft, areaRect.width - blockRect.width));
                newTop = Math.max(0, Math.min(newTop, areaRect.height - blockRect.height));
                
                // עדכון מיקום הלבנה
                block.style.left = newLeft + 'px';
                block.style.top = newTop + 'px';
                
                // חיפוש חיבורים אפשריים
                findAndHighlightConnections(block);
            }
        }
        
        // טיפול בשחרור העכבר בסיום גרירה
        function handleMouseUp(e) {
            if (!isDragging || !draggedElement) return;
            
            // מנע פעולות ברירת מחדל
            e.preventDefault();
            e.stopPropagation();
            
            // טיפול בגרירה מאזור הלבנים
            if (draggedElement.source === 'palette' && dragClone) {
                // בדוק אם שחררנו מעל אזור התכנות
                const areaRect = programmingArea.getBoundingClientRect();
                const isOverProgramArea = (
                    e.clientX >= areaRect.left &&
                    e.clientX <= areaRect.right &&
                    e.clientY >= areaRect.top &&
                    e.clientY <= areaRect.bottom
                );
                
                // הסר את הקלון
                if (dragClone.parentNode) {
                    dragClone.parentNode.removeChild(dragClone);
                }
                
                // אם שחררנו מעל אזור התכנות, יצור לבנה חדשה
                if (isOverProgramArea) {
                    const newBlock = createNewBlock(
                        draggedElement.type,
                        draggedElement.category,
                        e.clientX - areaRect.left - dragOffsetX,
                        e.clientY - areaRect.top - dragOffsetY
                    );
                    
                    // בדוק אם יש חיבורים אפשריים מיד
                    if (newBlock) {
                        setTimeout(() => {
                            findAndApplyConnection(newBlock);
                        }, 10);
                    }
                }
            }
            // טיפול בגרירה באזור התכנות
            else if (draggedElement.source === 'program') {
                const block = draggedElement.element;
                
                // בטל את העדיפות בהערמה
                block.style.zIndex = '';
                
                // בדוק וחבר את הלבנה אם היא קרובה לחיבור
                if (potentialConnection) {
                    applyConnection(potentialConnection);
                }
                
                // נקה הדגשות
                clearHighlights();
            }
            
            // ניקוי משתנים גלובליים
            isDragging = false;
            draggedElement = null;
            dragClone = null;
            dragOffsetX = 0;
            dragOffsetY = 0;
            potentialConnection = null;
            
            // הסר מאזיני אירועים זמניים
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        
        // חיפוש והדגשת חיבורים אפשריים
        function findAndHighlightConnections(block) {
            // נקה הדגשות קודמות
            clearHighlights();
            
            // קבל את כל הלבנים באזור התכנות
            const allBlocks = programmingArea.querySelectorAll('.block-container');
            const blockRect = block.getBoundingClientRect();
            const blockCategory = block.dataset.category;
            const blockType = block.dataset.type;
            
            let closestConnection = null;
            let minDistance = CONNECTION_THRESHOLD;
            
            // עבור על כל הלבנים (חוץ מהלבנה הנוכחית)
            allBlocks.forEach(targetBlock => {
                if (targetBlock === block) return;
                
                const targetRect = targetBlock.getBoundingClientRect();
                const targetCategory = targetBlock.dataset.category;
                const targetType = targetBlock.dataset.type;
                
                // בדיקת חיבור ימין-לשמאל (הפלט של הנגרר לקלט של היעד)
                if (canConnect(blockCategory, targetCategory)) {
                    // נקודות החיבור
                    const sourceRight = {
                        x: blockRect.right,
                        y: blockRect.top + blockRect.height / 2
                    };
                    
                    const targetLeft = {
                        x: targetRect.left,
                        y: targetRect.top + targetRect.height / 2
                    };
                    
                    // חישוב מרחק
                    const distance = calculateDistance(sourceRight, targetLeft);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestConnection = {
                            type: 'right-to-left',
                            source: block,
                            target: targetBlock,
                            distance: distance
                        };
                    }
                }
                
                // בדיקת חיבור שמאל-לימין (הקלט של הנגרר לפלט של היעד)
                if (canConnect(targetCategory, blockCategory)) {
                    // נקודות החיבור
                    const sourceLeft = {
                        x: blockRect.left,
                        y: blockRect.top + blockRect.height / 2
                    };
                    
                    const targetRight = {
                        x: targetRect.right,
                        y: targetRect.top + targetRect.height / 2
                    };
                    
                    // חישוב מרחק
                    const distance = calculateDistance(sourceLeft, targetRight);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestConnection = {
                            type: 'left-to-right',
                            source: block,
                            target: targetBlock,
                            distance: distance
                        };
                    }
                }
                
                // חיבור מיוחד לבלוק repeat
                if (targetType === 'repeat' && blockCategory !== 'end' && blockCategory !== 'triggering') {
                    // נקודות החיבור
                    const sourceLeft = {
                        x: blockRect.left,
                        y: blockRect.top + blockRect.height / 2
                    };
                    
                    const targetBottom = {
                        x: targetRect.left + targetRect.width / 2,
                        y: targetRect.bottom
                    };
                    
                    // חישוב מרחק
                    const distance = calculateDistance(sourceLeft, targetBottom);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestConnection = {
                            type: 'left-to-bottom',
                            source: block,
                            target: targetBlock,
                            distance: distance
                        };
                    }
                }
            });
            
            // שמור את החיבור הקרוב ביותר והדגש אותו
            if (closestConnection) {
                potentialConnection = closestConnection;
                highlightBlock(closestConnection.target);
            } else {
                potentialConnection = null;
            }
        }
        
        // בדיקת אפשרות חיבור בין שתי קטגוריות
        function canConnect(sourceCategory, targetCategory) {
            // לבנות סיום לא יכולות להתחבר מימין
            if (sourceCategory === 'end') return false;
            
            // לבנות הפעלה לא יכולות להתחבר משמאל
            if (targetCategory === 'triggering') return false;
            
            // שאר הלבנים יכולות להתחבר
            return true;
        }
        
        // חישוב מרחק בין שתי נקודות
        function calculateDistance(point1, point2) {
            return Math.sqrt(
                Math.pow(point2.x - point1.x, 2) +
                Math.pow(point2.y - point1.y, 2)
            );
        }
        
        // הדגשת לבנה כאשר היא קרובה לחיבור
        function highlightBlock(block) {
            if (!block) return;
            
            const scratchBlock = block.querySelector('.scratch-block');
            if (scratchBlock) {
                scratchBlock.classList.add('drop-highlight');
            }
        }
        
        // ניקוי כל ההדגשות
        function clearHighlights() {
            document.querySelectorAll('.drop-highlight').forEach(block => {
                block.classList.remove('drop-highlight');
            });
        }
        
        // בדיקה וביצוע חיבור בין לבנים
        function findAndApplyConnection(block) {
            findAndHighlightConnections(block);
            
            if (potentialConnection && potentialConnection.distance < SNAP_THRESHOLD) {
                applyConnection(potentialConnection);
            }
            
            clearHighlights();
            potentialConnection = null;
        }
        
        // ביצוע חיבור בין לבנים
        function applyConnection(connection) {
            if (!connection) return;
            
            const { type, source, target } = connection;
            const sourceRect = source.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const areaRect = programmingArea.getBoundingClientRect();
            
            // חישוב מיקום חדש
            let newLeft, newTop;
            
            if (type === 'right-to-left') {
                // הפלט של המקור לקלט של היעד
                newLeft = targetRect.left - sourceRect.width - areaRect.left + 'px';
                newTop = targetRect.top - areaRect.top + 'px';
            } else if (type === 'left-to-right') {
                // הקלט של המקור לפלט של היעד
                newLeft = targetRect.right - areaRect.left + 'px';
                newTop = targetRect.top - areaRect.top + 'px';
            } else if (type === 'left-to-bottom') {
                // הקלט של המקור לתחתית של בלוק repeat
                newLeft = targetRect.left - areaRect.left + 'px';
                newTop = targetRect.bottom - areaRect.top + 'px';
            }
            
            // עדכון מיקום
            source.style.left = newLeft;
            source.style.top = newTop;
        }
        
        // יצירת לבנה חדשה באזור התכנות
        function createNewBlock(type, category, left, top) {
            // מצא את הלבנה המקורית באזור הלבנים
            const sourceBlock = document.querySelector(`.block-container[data-type="${type}"][data-category="${category}"]`);
            if (!sourceBlock) return null;
            
            // צור לבנה חדשה
            const newBlock = document.createElement('div');
            newBlock.className = 'block-container';
            newBlock.dataset.type = type;
            newBlock.dataset.category = category;
            
            // העתק את התוכן של הלבנה המקורית
            const sourceBlockInner = sourceBlock.querySelector('.scratch-block');
            if (sourceBlockInner) {
                const newInner = document.createElement('div');
                newInner.className = 'scratch-block';
                
                // העתק סגנון
                const style = window.getComputedStyle(sourceBlockInner);
                newInner.style.backgroundColor = style.backgroundColor;
                newInner.style.width = style.width;
                newInner.style.height = style.height;
                newInner.style.borderRadius = style.borderRadius;
                newInner.style.boxShadow = style.boxShadow;
                
                // העתק אייקון אם יש
                const sourceIcon = sourceBlockInner.querySelector('.block-icon-img');
                if (sourceIcon) {
                    const newIcon = document.createElement('img');
                    newIcon.src = sourceIcon.src;
                    newIcon.alt = sourceIcon.alt || '';
                    newIcon.className = 'block-icon-img';
                    newIcon.draggable = false;
                    newInner.appendChild(newIcon);
                }
                
                newBlock.appendChild(newInner);
            }
            
            // הגדר מיקום
            newBlock.style.position = 'absolute';
            newBlock.style.left = left + 'px';
            newBlock.style.top = top + 'px';
            
            // בטל גרירה סטנדרטית
            disableDragForElement(newBlock);
            
            // הוסף לאזור התכנות
            programmingArea.appendChild(newBlock);
            
            // הוסף מאזין אירועים לגרירה
            newBlock.addEventListener('mousedown', handleProgramMouseDown);
            
            return newBlock;
        }
        
        // אתחול מערכת הגרירה והחיבור
        function init() {
            console.log('אתחול מערכת גרירה וחיבור משופרת');
            
            // ביטול גרירה גלובלי
            disableGlobalDrag();
            
            // הוספת מאזיני אירועים לאזור הלבנים
            blockPalette.querySelectorAll('.block-container').forEach(block => {
                disableDragForElement(block);
                block.addEventListener('mousedown', handlePaletteMouseDown);
            });
            
            // הוספת מאזיני אירועים לאזור התכנות
            programmingArea.querySelectorAll('.block-container').forEach(block => {
                disableDragForElement(block);
                block.addEventListener('mousedown', handleProgramMouseDown);
            });
            
            // יצירת MutationObserver לזיהוי אלמנטים חדשים
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) { // אלמנט נוד
                                // אם זוהתה לבנה חדשה
                                if (node.classList && node.classList.contains('block-container')) {
                                    // בטל גרירה סטנדרטית
                                    disableDragForElement(node);
                                    
                                    // הוסף התנהגות גרירה בהתאם לאזור
                                    if (blockPalette.contains(node)) {
                                        node.addEventListener('mousedown', handlePaletteMouseDown);
                                    } else if (programmingArea.contains(node)) {
                                        node.addEventListener('mousedown', handleProgramMouseDown);
                                    }
                                }
                                
                                // טיפול בתמונות
                                node.querySelectorAll('img').forEach(img => {
                                    img.setAttribute('draggable', 'false');
                                    img.draggable = false;
                                });
                            }
                        });
                    }
                });
            });
            
            // התחל לצפות בשינויים
            observer.observe(document.body, { childList: true, subtree: true });
        }
        
        // הפעלת האתחול
        init();
    });
})();
