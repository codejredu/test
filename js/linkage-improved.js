/**
 * linkage-improved.js - שיפור גרירה וחיבור לבנים בסגנון ScratchJr
 * 
 * קובץ זה מספק:
 * 1. גרירה חלקה ללא תמונות רפאים מאזור הלבנים לאזור התכנות
 * 2. גרירה חלקה ללא תמונות רפאים בתוך אזור התכנות
 * 3. הילה כחולה כאשר לבנה מתקרבת לחיבור אפשרי
 * 4. הצמדה אוטומטית כאשר פין של לבנה אחת מתקרב לשקע של לבנה אחרת
 */

(function() {
    // פונקציה ראשית שתופעל כאשר ה-DOM נטען
    document.addEventListener('DOMContentLoaded', function() {
        // קבועים עבור זיהוי וסימון חיבורים
        const HIGHLIGHT_COLOR = '#0D6EFD';
        const CONNECTION_THRESHOLD = 20; // מרחק בפיקסלים לזיהוי חיבור פוטנציאלי
        const SNAP_THRESHOLD = 10; // מרחק בפיקסלים להצמדה אוטומטית
        
        // הוספת סגנון CSS גלובלי למניעת תמונות רפאים בזמן גרירה
        const style = document.createElement('style');
        style.textContent = `
            /* מניעת תמונות רפאים בזמן גרירה */
            * {
                -webkit-user-drag: none !important;
                user-drag: none !important;
                -moz-user-drag: none !important;
            }
            
            /* עיצוב מחברים ללבנים */
            .block-highlight {
                box-shadow: 0 0 8px 3px ${HIGHLIGHT_COLOR} !important;
                border: 2px solid ${HIGHLIGHT_COLOR} !important;
            }
            
            /* סגנון סמן העכבר בזמן גרירה */
            .block-container {
                cursor: grab;
            }
            
            .block-container.dragging {
                cursor: grabbing;
            }
        `;
        document.head.appendChild(style);
        
        // משתנים לעקיבה אחר מצב הגרירה
        let activeDrag = null; // האלמנט שנגרר כרגע
        let dragOffsetX = 0;   // היסט אופקי מנקודת הלחיצה
        let dragOffsetY = 0;   // היסט אנכי מנקודת הלחיצה
        let potentialTargets = []; // לבנים פוטנציאליות לחיבור
        
        // אלמנטים מרכזיים בממשק
        const blockPalette = document.getElementById('block-palette');
        const programmingArea = document.getElementById('program-blocks');
        
        // בדיקה שהאלמנטים הנדרשים קיימים
        if (!blockPalette || !programmingArea) {
            console.error('אלמנטים נדרשים חסרים. פונקציונליות גרירה וחיבור מבוטלת.');
            return;
        }
        
        /**
         * מבטל גרירה טבעית של הדפדפן לאלמנט
         * @param {HTMLElement} element - האלמנט שיש לבטל עבורו גרירה
         */
        function disableBrowserDrag(element) {
            if (!element) return;
            
            // מבטל את תכונת הגרירה
            element.setAttribute('draggable', 'false');
            element.draggable = false;
            
            // מטפל גם בתמונות בתוך האלמנט
            const images = element.querySelectorAll('img');
            images.forEach(img => {
                img.setAttribute('draggable', 'false');
                img.draggable = false;
                img.style.pointerEvents = 'none';
            });
            
            // מבטל אירועי גרירה
            element.addEventListener('dragstart', preventDefault, true);
            element.addEventListener('drag', preventDefault, true);
        }
        
        /**
         * פונקציית עזר למניעת אירועי ברירת מחדל
         * @param {Event} e - אירוע
         */
        function preventDefault(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        /**
         * מוצא נקודות חיבור אפשריות בין הלבנה הנגררת ללבנים אחרות
         * @param {HTMLElement} draggedBlock - הלבנה שנגררת
         * @returns {Array} מערך של חיבורים אפשריים
         */
        function findPotentialConnections(draggedBlock) {
            if (!draggedBlock) return [];
            
            const connections = [];
            const draggedRect = draggedBlock.getBoundingClientRect();
            const draggedCategory = draggedBlock.dataset.category;
            const draggedType = draggedBlock.dataset.type;
            
            // בדיקת כל הלבנים באזור התכנות כיעדים פוטנציאליים
            const allBlocks = programmingArea.querySelectorAll('.block-container');
            allBlocks.forEach(targetBlock => {
                // דלג על הלבנה הנגררת עצמה
                if (targetBlock === draggedBlock) return;
                
                const targetRect = targetBlock.getBoundingClientRect();
                const targetCategory = targetBlock.dataset.category;
                const targetType = targetBlock.dataset.type;
                
                // חישוב נקודות חיבור אפשריות
                
                // 1. חיבור צד ימין של לבנה נגררת לצד שמאל של לבנת יעד
                if (canConnect(draggedCategory, targetCategory)) {
                    // נקודת החיבור הימנית של הלבנה הנגררת
                    const rightEdge = {
                        x: draggedRect.right,
                        y: draggedRect.top + (draggedRect.height / 2)
                    };
                    
                    // נקודת החיבור השמאלית של לבנת היעד
                    const leftEdge = {
                        x: targetRect.left,
                        y: targetRect.top + (targetRect.height / 2)
                    };
                    
                    // חישוב המרחק בין הנקודות
                    const distance = calculateDistance(rightEdge, leftEdge);
                    
                    if (distance < CONNECTION_THRESHOLD) {
                        connections.push({
                            type: 'right-to-left',
                            source: draggedBlock,
                            target: targetBlock,
                            distance: distance
                        });
                    }
                }
                
                // 2. חיבור צד שמאל של לבנה נגררת לצד ימין של לבנת יעד
                if (canConnect(targetCategory, draggedCategory)) {
                    // נקודת החיבור השמאלית של הלבנה הנגררת
                    const leftEdge = {
                        x: draggedRect.left,
                        y: draggedRect.top + (draggedRect.height / 2)
                    };
                    
                    // נקודת החיבור הימנית של לבנת היעד
                    const rightEdge = {
                        x: targetRect.right,
                        y: targetRect.top + (targetRect.height / 2)
                    };
                    
                    // חישוב המרחק בין הנקודות
                    const distance = calculateDistance(leftEdge, rightEdge);
                    
                    if (distance < CONNECTION_THRESHOLD) {
                        connections.push({
                            type: 'left-to-right',
                            source: draggedBlock,
                            target: targetBlock,
                            distance: distance
                        });
                    }
                }
                
                // 3. חיבור מיוחד עבור בלוק repeat
                if (targetType === 'repeat' && draggedCategory !== 'triggering' && draggedCategory !== 'end') {
                    // נקודת החיבור השמאלית של הלבנה הנגררת
                    const leftEdge = {
                        x: draggedRect.left,
                        y: draggedRect.top + (draggedRect.height / 2)
                    };
                    
                    // נקודת החיבור התחתונה של בלוק repeat
                    const bottomEdge = {
                        x: targetRect.left + (targetRect.width / 2),
                        y: targetRect.bottom
                    };
                    
                    // חישוב המרחק בין הנקודות
                    const distance = calculateDistance(leftEdge, bottomEdge);
                    
                    if (distance < CONNECTION_THRESHOLD) {
                        connections.push({
                            type: 'left-to-bottom',
                            source: draggedBlock,
                            target: targetBlock,
                            distance: distance
                        });
                    }
                }
            });
            
            return connections;
        }
        
        /**
         * בודק אם שתי לבנים יכולות להתחבר לפי הקטגוריה שלהן
         * @param {string} sourceCategory - קטגוריית לבנת המקור
         * @param {string} targetCategory - קטגוריית לבנת היעד
         * @returns {boolean} האם החיבור אפשרי
         */
        function canConnect(sourceCategory, targetCategory) {
            // חוקי חיבור בסיסיים:
            
            // לבנות סיום אין חיבור ימני
            if (sourceCategory === 'end') return false;
            
            // לבנות הפעלה אין חיבור שמאלי
            if (targetCategory === 'triggering') return false;
            
            // כל שאר הלבנים יכולות להתחבר
            return true;
        }
        
        /**
         * חישוב מרחק בין שתי נקודות
         * @param {Object} point1 - נקודה ראשונה
         * @param {Object} point2 - נקודה שנייה
         * @returns {number} המרחק בין הנקודות
         */
        function calculateDistance(point1, point2) {
            return Math.sqrt(
                Math.pow(point2.x - point1.x, 2) +
                Math.pow(point2.y - point1.y, 2)
            );
        }
        
        /**
         * מדגיש לבנה כדי להראות חיבור אפשרי
         * @param {HTMLElement} block - הלבנה להדגשה
         */
        function highlightBlock(block) {
            if (!block) return;
            
            const scratchBlock = block.querySelector('.scratch-block');
            if (scratchBlock) {
                scratchBlock.classList.add('block-highlight');
            }
        }
        
        /**
         * מסיר הדגשה מלבנה
         * @param {HTMLElement} block - הלבנה להסרת הדגשה
         */
        function removeHighlight(block) {
            if (!block) return;
            
            const scratchBlock = block.querySelector('.scratch-block');
            if (scratchBlock) {
                scratchBlock.classList.remove('block-highlight');
            }
        }
        
        /**
         * מסיר הדגשה מכל הלבנים
         */
        function clearAllHighlights() {
            document.querySelectorAll('.scratch-block.block-highlight').forEach(block => {
                block.classList.remove('block-highlight');
            });
        }
        
        /**
         * מחבר שתי לבנים על ידי מיקום מדויק
         * @param {Object} connection - אובייקט המתאר את החיבור
         */
        function snapBlocks(connection) {
            if (!connection) return;
            
            const { type, source, target } = connection;
            const sourceRect = source.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const areaRect = programmingArea.getBoundingClientRect();
            
            // מיקום חדש עבור הלבנה הנגררת
            let newLeft, newTop;
            
            if (type === 'right-to-left') {
                // הימני של המקור מתחבר לשמאלי של היעד
                newLeft = targetRect.left - sourceRect.width - areaRect.left + 'px';
                newTop = targetRect.top - areaRect.top + 'px';
            } 
            else if (type === 'left-to-right') {
                // השמאלי של המקור מתחבר לימני של היעד
                newLeft = targetRect.right - areaRect.left + 'px';
                newTop = targetRect.top - areaRect.top + 'px';
            }
            else if (type === 'left-to-bottom') {
                // השמאלי של המקור מתחבר לתחתית של היעד (לבלוק repeat)
                newLeft = targetRect.left - areaRect.left + 'px';
                newTop = targetRect.bottom - areaRect.top + 'px';
            }
            
            // יישום המיקום החדש
            source.style.left = newLeft;
            source.style.top = newTop;
        }
        
        /**
         * טיפול בלחיצה על לבנה באזור הלבנים והתחלת גרירה
         * @param {Event} e - אירוע לחיצת עכבר
         */
        function handlePaletteBlockMouseDown(e) {
            // מצא את ה-container של הלבנה
            const blockContainer = e.target.closest('.block-container');
            if (!blockContainer) return;
            
            // מניעת התנהגות ברירת מחדל
            e.preventDefault();
            e.stopPropagation();
            
            // חישוב היסט הלחיצה מפינת הלבנה
            const rect = blockContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            // יצירת עותק של הלבנה לגרירה
            const clone = blockContainer.cloneNode(true);
            clone.style.position = 'absolute';
            clone.style.zIndex = '1000';
            clone.style.opacity = '0.9';
            clone.style.pointerEvents = 'none';
            clone.classList.add('dragging');
            
            // התאמת המראה החזותי
            const scratchBlock = clone.querySelector('.scratch-block');
            if (scratchBlock) {
                const originalBlock = blockContainer.querySelector('.scratch-block');
                if (originalBlock) {
                    // העתקת סגנון מהלבנה המקורית
                    const computedStyle = window.getComputedStyle(originalBlock);
                    scratchBlock.style.backgroundColor = computedStyle.backgroundColor;
                    scratchBlock.style.width = computedStyle.width;
                    scratchBlock.style.height = computedStyle.height;
                    scratchBlock.style.borderRadius = computedStyle.borderRadius;
                    scratchBlock.style.boxShadow = computedStyle.boxShadow;
                    scratchBlock.style.display = 'flex';
                    scratchBlock.style.justifyContent = 'center';
                    scratchBlock.style.alignItems = 'center';
                }
            }
            
            // ביטול גרירת דפדפן סטנדרטית
            disableBrowserDrag(clone);
            
            // הוספת העותק למסמך
            document.body.appendChild(clone);
            
            // שמירת הלבנה הנגררת
            activeDrag = {
                element: clone,
                source: 'palette',
                type: blockContainer.dataset.type,
                category: blockContainer.dataset.category
            };
            
            // מיקום התחלתי
            clone.style.left = (e.clientX - dragOffsetX) + 'px';
            clone.style.top = (e.clientY - dragOffsetY) + 'px';
            
            // הוספת מאזיני אירועים לגרירה
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        
        /**
         * טיפול בלחיצה על לבנה באזור התכנות והתחלת גרירה
         * @param {Event} e - אירוע לחיצת עכבר
         */
        function handleProgramBlockMouseDown(e) {
            // מצא את ה-container של הלבנה
            const blockContainer = e.target.closest('.block-container');
            if (!blockContainer || !blockContainer.querySelector('.scratch-block')) return;
            
            // מניעת התנהגות ברירת מחדל
            e.preventDefault();
            e.stopPropagation();
            
            // חישוב היסט הלחיצה מפינת הלבנה
            const rect = blockContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            // סימון הלבנה כנגררת
            blockContainer.classList.add('dragging');
            blockContainer.style.zIndex = '1000';
            
            // ביטול גרירת דפדפן סטנדרטית
            disableBrowserDrag(blockContainer);
            
            // שמירת הלבנה הנגררת
            activeDrag = {
                element: blockContainer,
                source: 'program',
                type: blockContainer.dataset.type,
                category: blockContainer.dataset.category,
                startPosition: {
                    left: blockContainer.style.left,
                    top: blockContainer.style.top
                }
            };
            
            // הוספת מאזיני אירועים לגרירה
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        
        /**
         * טיפול בתנועת העכבר בזמן גרירה
         * @param {Event} e - אירוע תנועת עכבר
         */
        function handleMouseMove(e) {
            if (!activeDrag || !activeDrag.element) return;
            
            // מניעת התנהגות ברירת מחדל
            e.preventDefault();
            e.stopPropagation();
            
            // עדכון מיקום האלמנט הנגרר
            const element = activeDrag.element;
            
            if (activeDrag.source === 'palette') {
                // עדכון מיקום עבור גרירה מאזור הלבנים
                element.style.left = (e.clientX - dragOffsetX) + 'px';
                element.style.top = (e.clientY - dragOffsetY) + 'px';
                
                // בדוק אם מעל אזור התכנות (להדגשה ויזואלית)
                const areaRect = programmingArea.getBoundingClientRect();
                const isOverProgrammingArea = (
                    e.clientX >= areaRect.left &&
                    e.clientX <= areaRect.right &&
                    e.clientY >= areaRect.top &&
                    e.clientY <= areaRect.bottom
                );
                
                // עדכון שקיפות לפי המיקום
                element.style.opacity = isOverProgrammingArea ? '1.0' : '0.7';
            } else {
                // עדכון מיקום עבור גרירה באזור התכנות
                const areaRect = programmingArea.getBoundingClientRect();
                let newLeft = e.clientX - areaRect.left - dragOffsetX;
                let newTop = e.clientY - areaRect.top - dragOffsetY;
                
                // וידוא שהלבנה נשארת בתוך אזור התכנות
                const elementRect = element.getBoundingClientRect();
                const maxLeft = areaRect.width - elementRect.width;
                const maxTop = areaRect.height - elementRect.height;
                
                newLeft = Math.max(0, Math.min(newLeft, maxLeft));
                newTop = Math.max(0, Math.min(newTop, maxTop));
                
                // עדכון מיקום
                element.style.left = newLeft + 'px';
                element.style.top = newTop + 'px';
                
                // חיפוש חיבורים אפשריים
                potentialTargets = findPotentialConnections(element);
                
                // ניקוי הדגשות קודמות
                clearAllHighlights();
                
                // הדגש לבנה קרובה אם יש כזו
                if (potentialTargets.length > 0) {
                    // מיון לפי מרחק
                    potentialTargets.sort((a, b) => a.distance - b.distance);
                    const closestTarget = potentialTargets[0];
                    
                    // הדגש את היעד הקרוב ביותר
                    highlightBlock(closestTarget.target);
                }
            }
        }
        
        /**
         * טיפול בשחרור לחצן העכבר בסיום גרירה
         * @param {Event} e - אירוע שחרור לחצן עכבר
         */
        function handleMouseUp(e) {
            if (!activeDrag || !activeDrag.element) return;
            
            // הסר מאזינים
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            const element = activeDrag.element;
            
            if (activeDrag.source === 'palette') {
                // גרירה מאזור הלבנים
                
                // בדיקה אם שוחרר מעל אזור התכנות
                const areaRect = programmingArea.getBoundingClientRect();
                const isOverProgrammingArea = (
                    e.clientX >= areaRect.left &&
                    e.clientX <= areaRect.right &&
                    e.clientY >= areaRect.top &&
                    e.clientY <= areaRect.bottom
                );
                
                // הסרת העותק מהמסמך
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                
                if (isOverProgrammingArea) {
                    // יצירת לבנה חדשה באזור התכנות
                    createBlockInProgrammingArea(
                        activeDrag.type,
                        activeDrag.category,
                        e.clientX - areaRect.left - dragOffsetX,
                        e.clientY - areaRect.top - dragOffsetY
                    );
                }
            } else {
                // גרירה באזור התכנות
                
                // הסרת סימון גרירה
                element.classList.remove('dragging');
                element.style.zIndex = '';
                
                // טיפול בחיבורים אם יש כאלה
                if (potentialTargets.length > 0) {
                    potentialTargets.sort((a, b) => a.distance - b.distance);
                    const closestTarget = potentialTargets[0];
                    
                    if (closestTarget.distance < SNAP_THRESHOLD) {
                        snapBlocks(closestTarget);
                    }
                }
            }
            
            // ניקוי הדגשות
            clearAllHighlights();
            
            // איפוס המצב
            activeDrag = null;
            potentialTargets = [];
        }
        
        /**
         * יוצר לבנה חדשה באזור התכנות
         * @param {string} type - סוג הלבנה
         * @param {string} category - קטגוריית הלבנה
         * @param {number} left - מיקום אופקי
         * @param {number} top - מיקום אנכי
         */
        function createBlockInProgrammingArea(type, category, left, top) {
            // מצא את לבנת המקור באזור הלבנים לפי הסוג והקטגוריה
            const sourceBlock = document.querySelector(`.block-container[data-type="${type}"][data-category="${category}"]`);
            if (!sourceBlock) return;
            
            // יצירת לבנה חדשה
            const newBlock = document.createElement('div');
            newBlock.className = 'block-container';
            newBlock.dataset.type = type;
            newBlock.dataset.category = category;
            
            // העתקת התוכן מלבנת המקור
            const sourceBlockHTML = sourceBlock.querySelector('.scratch-block');
            if (sourceBlockHTML) {
                // יצירת הבלוק הפנימי
                const newBlockHTML = document.createElement('div');
                newBlockHTML.className = 'scratch-block';
                
                // העתקת הסגנון מהבלוק המקורי
                const computedStyle = window.getComputedStyle(sourceBlockHTML);
                newBlockHTML.style.backgroundColor = computedStyle.backgroundColor;
                newBlockHTML.style.width = computedStyle.width;
                newBlockHTML.style.height = computedStyle.height;
                newBlockHTML.style.borderRadius = computedStyle.borderRadius;
                newBlockHTML.style.boxShadow = computedStyle.boxShadow;
                newBlockHTML.style.position = 'relative';
                
                // העתקת האייקון
                const sourceIcon = sourceBlockHTML.querySelector('.block-icon-img');
                if (sourceIcon) {
                    const newIcon = document.createElement('img');
                    newIcon.src = sourceIcon.src;
                    newIcon.alt = sourceIcon.alt;
                    newIcon.className = 'block-icon-img';
                    newBlockHTML.appendChild(newIcon);
                    
                    // ביטול גרירה של האייקון
                    newIcon.draggable = false;
                }
                
                // הוספת הבלוק הפנימי ללבנה
                newBlock.appendChild(newBlockHTML);
            }
            
            // מיקום הלבנה החדשה
            newBlock.style.position = 'absolute';
            newBlock.style.left = left + 'px';
            newBlock.style.top = top + 'px';
            
            // הוספת הלבנה לאזור התכנות
            programmingArea.appendChild(newBlock);
            
            // הגדרת אירועי גרירה עבור הלבנה החדשה
            newBlock.addEventListener('mousedown', handleProgramBlockMouseDown);
            disableBrowserDrag(newBlock);
            
            // בדיקת חיבורים אפשריים
            setTimeout(() => {
                const connections = findPotentialConnections(newBlock);
                if (connections.length > 0) {
                    // מיון לפי מרחק
                    connections.sort((a, b) => a.distance - b.distance);
                    const closestConnection = connections[0];
                    
                    if (closestConnection.distance < SNAP_THRESHOLD) {
                        snapBlocks(closestConnection);
                    }
                }
            }, 10);
        }
        
        /**
         * אתחול מערכת הגרירה והחיבור המשופרת
         */
        function init() {
            console.log('אתחול מערכת גרירה וחיבור לבנים משופרת');
            
            // ביטול גרירת דפדפן ברמת המסמך
            document.addEventListener('dragstart', preventDefault, true);
            
            // ביטול גרירה עבור כל התמונות הקיימות
            document.querySelectorAll('img').forEach(img => {
                img.draggable = false;
                img.setAttribute('draggable', 'false');
            });
            
            // הוספת מאזיני אירועים עבור לבנים באזור הלבנים
            const paletteBlocks = blockPalette.querySelectorAll('.block-container');
            paletteBlocks.forEach(block => {
                block.addEventListener('mousedown', handlePaletteBlockMouseDown);
                disableBrowserDrag(block);
            });
            
            // הוספת מאזיני אירועים עבור לבנים באזור התכנות
            const programBlocks = programmingArea.querySelectorAll('.block-container');
            programBlocks.forEach(block => {
                block.addEventListener('mousedown', handleProgramBlockMouseDown);
                disableBrowserDrag(block);
            });
            
            // מאזין אירועים לזיהוי לבנים חדשות
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                // אם זה לבנה חדשה באזור התכנות
                                if (node.classList && node.classList.contains('block-container')) {
                                    node.addEventListener('mousedown', handleProgramBlockMouseDown);
                                    disableBrowserDrag(node);
                                }
                                
                                // חיפוש והגדרת תמונות לא גרירות
                                const images = node.querySelectorAll('img');
                                images.forEach(img => {
                                    img.draggable = false;
                                    img.setAttribute('draggable', 'false');
                                    img.style.pointerEvents = 'none';
                                });
                            }
                        });
                    }
                });
            });
            
            // התחלת צפייה באזור התכנות לשינויים
            observer.observe(programmingArea, { childList: true, subtree: true });
            
            // התחלת צפייה באזור הלבנים לשינויים
            observer.observe(blockPalette, { childList: true, subtree: true });
        }
        
        // הפעלת האתחול
        init();
    });
})();/**
 * linkage-improved.js - שיפור גרירה וחיבור לבנים בסגנון ScratchJr
 * 
 * קובץ זה מספק:
 * 1. גרירה חלקה ללא תמונות רפאים מאזור הלבנים לאזור התכנות
 * 2. גרירה חלקה ללא תמונות רפאים בתוך אזור התכנות
 * 3. הילה כחולה כאשר לבנה מתקרבת לחיבור אפשרי
 * 4. הצמדה אוטומטית כאשר פין של לבנה אחת מתקרב לשקע של לבנה אחרת
 */

(function() {
    // פונקציה ראשית שתופעל כאשר ה-DOM נטען
    document.addEventListener('DOMContentLoaded', function() {
        // קבועים עבור זיהוי וסימון חיבורים
        const HIGHLIGHT_COLOR = '#0D6EFD';
        const CONNECTION_THRESHOLD = 20; // מרחק בפיקסלים לזיהוי חיבור פוטנציאלי
        const SNAP_THRESHOLD = 10; // מרחק בפיקסלים להצמדה אוטומטית
        
        // הוספת סגנון CSS גלובלי למניעת תמונות רפאים בזמן גרירה
        const style = document.createElement('style');
        style.textContent = `
            /* מניעת תמונות רפאים בזמן גרירה */
            * {
                -webkit-user-drag: none !important;
                user-drag: none !important;
                -moz-user-drag: none !important;
            }
            
            /* עיצוב מחברים ללבנים */
            .block-highlight {
                box-shadow: 0 0 8px 3px ${HIGHLIGHT_COLOR} !important;
                border: 2px solid ${HIGHLIGHT_COLOR} !important;
            }
            
            /* סגנון סמן העכבר בזמן גרירה */
            .block-container {
                cursor: grab;
            }
            
            .block-container.dragging {
                cursor: grabbing;
            }
        `;
        document.head.appendChild(style);
        
        // משתנים לעקיבה אחר מצב הגרירה
        let activeDrag = null; // האלמנט שנגרר כרגע
        let dragOffsetX = 0;   // היסט אופקי מנקודת הלחיצה
        let dragOffsetY = 0;   // היסט אנכי מנקודת הלחיצה
        let potentialTargets = []; // לבנים פוטנציאליות לחיבור
        
        // אלמנטים מרכזיים בממשק
        const blockPalette = document.getElementById('block-palette');
        const programmingArea = document.getElementById('program-blocks');
        
        // בדיקה שהאלמנטים הנדרשים קיימים
        if (!blockPalette || !programmingArea) {
            console.error('אלמנטים נדרשים חסרים. פונקציונליות גרירה וחיבור מבוטלת.');
            return;
        }
        
        /**
         * מבטל גרירה טבעית של הדפדפן לאלמנט
         * @param {HTMLElement} element - האלמנט שיש לבטל עבורו גרירה
         */
        function disableBrowserDrag(element) {
            if (!element) return;
            
            // מבטל את תכונת הגרירה
            element.setAttribute('draggable', 'false');
            element.draggable = false;
            
            // מטפל גם בתמונות בתוך האלמנט
            const images = element.querySelectorAll('img');
            images.forEach(img => {
                img.setAttribute('draggable', 'false');
                img.draggable = false;
                img.style.pointerEvents = 'none';
            });
            
            // מבטל אירועי גרירה
            element.addEventListener('dragstart', preventDefault, true);
            element.addEventListener('drag', preventDefault, true);
        }
        
        /**
         * פונקציית עזר למניעת אירועי ברירת מחדל
         * @param {Event} e - אירוע
         */
        function preventDefault(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        /**
         * מוצא נקודות חיבור אפשריות בין הלבנה הנגררת ללבנים אחרות
         * @param {HTMLElement} draggedBlock - הלבנה שנגררת
         * @returns {Array} מערך של חיבורים אפשריים
         */
        function findPotentialConnections(draggedBlock) {
            if (!draggedBlock) return [];
            
            const connections = [];
            const draggedRect = draggedBlock.getBoundingClientRect();
            const draggedCategory = draggedBlock.dataset.category;
            const draggedType = draggedBlock.dataset.type;
            
            // בדיקת כל הלבנים באזור התכנות כיעדים פוטנציאליים
            const allBlocks = programmingArea.querySelectorAll('.block-container');
            allBlocks.forEach(targetBlock => {
                // דלג על הלבנה הנגררת עצמה
                if (targetBlock === draggedBlock) return;
                
                const targetRect = targetBlock.getBoundingClientRect();
                const targetCategory = targetBlock.dataset.category;
                const targetType = targetBlock.dataset.type;
                
                // חישוב נקודות חיבור אפשריות
                
                // 1. חיבור צד ימין של לבנה נגררת לצד שמאל של לבנת יעד
                if (canConnect(draggedCategory, targetCategory)) {
                    // נקודת החיבור הימנית של הלבנה הנגררת
                    const rightEdge = {
                        x: draggedRect.right,
                        y: draggedRect.top + (draggedRect.height / 2)
                    };
                    
                    // נקודת החיבור השמאלית של לבנת היעד
                    const leftEdge = {
                        x: targetRect.left,
                        y: targetRect.top + (targetRect.height / 2)
                    };
                    
                    // חישוב המרחק בין הנקודות
                    const distance = calculateDistance(rightEdge, leftEdge);
                    
                    if (distance < CONNECTION_THRESHOLD) {
                        connections.push({
                            type: 'right-to-left',
                            source: draggedBlock,
                            target: targetBlock,
                            distance: distance
                        });
                    }
                }
                
                // 2. חיבור צד שמאל של לבנה נגררת לצד ימין של לבנת יעד
                if (canConnect(targetCategory, draggedCategory)) {
                    // נקודת החיבור השמאלית של הלבנה הנגררת
                    const leftEdge = {
                        x: draggedRect.left,
                        y: draggedRect.top + (draggedRect.height / 2)
                    };
                    
                    // נקודת החיבור הימנית של לבנת היעד
                    const rightEdge = {
                        x: targetRect.right,
                        y: targetRect.top + (targetRect.height / 2)
                    };
                    
                    // חישוב המרחק בין הנקודות
                    const distance = calculateDistance(leftEdge, rightEdge);
                    
                    if (distance < CONNECTION_THRESHOLD) {
                        connections.push({
                            type: 'left-to-right',
                            source: draggedBlock,
                            target: targetBlock,
                            distance: distance
                        });
                    }
                }
                
                // 3. חיבור מיוחד עבור בלוק repeat
                if (targetType === 'repeat' && draggedCategory !== 'triggering' && draggedCategory !== 'end') {
                    // נקודת החיבור השמאלית של הלבנה הנגררת
                    const leftEdge = {
                        x: draggedRect.left,
                        y: draggedRect.top + (draggedRect.height / 2)
                    };
                    
                    // נקודת החיבור התחתונה של בלוק repeat
                    const bottomEdge = {
                        x: targetRect.left + (targetRect.width / 2),
                        y: targetRect.bottom
                    };
                    
                    // חישוב המרחק בין הנקודות
                    const distance = calculateDistance(leftEdge, bottomEdge);
                    
                    if (distance < CONNECTION_THRESHOLD) {
                        connections.push({
                            type: 'left-to-bottom',
                            source: draggedBlock,
                            target: targetBlock,
                            distance: distance
                        });
                    }
                }
            });
            
            return connections;
        }
        
        /**
         * בודק אם שתי לבנים יכולות להתחבר לפי הקטגוריה שלהן
         * @param {string} sourceCategory - קטגוריית לבנת המקור
         * @param {string} targetCategory - קטגוריית לבנת היעד
         * @returns {boolean} האם החיבור אפשרי
         */
        function canConnect(sourceCategory, targetCategory) {
            // חוקי חיבור בסיסיים:
            
            // לבנות סיום אין חיבור ימני
            if (sourceCategory === 'end') return false;
            
            // לבנות הפעלה אין חיבור שמאלי
            if (targetCategory === 'triggering') return false;
            
            // כל שאר הלבנים יכולות להתחבר
            return true;
        }
        
        /**
         * חישוב מרחק בין שתי נקודות
         * @param {Object} point1 - נקודה ראשונה
         * @param {Object} point2 - נקודה שנייה
         * @returns {number} המרחק בין הנקודות
         */
        function calculateDistance(point1, point2) {
            return Math.sqrt(
                Math.pow(point2.x - point1.x, 2) +
                Math.pow(point2.y - point1.y, 2)
            );
        }
        
        /**
         * מדגיש לבנה כדי להראות חיבור אפשרי
         * @param {HTMLElement} block - הלבנה להדגשה
         */
        function highlightBlock(block) {
            if (!block) return;
            
            const scratchBlock = block.querySelector('.scratch-block');
            if (scratchBlock) {
                scratchBlock.classList.add('block-highlight');
            }
        }
        
        /**
         * מסיר הדגשה מלבנה
         * @param {HTMLElement} block - הלבנה להסרת הדגשה
         */
        function removeHighlight(block) {
            if (!block) return;
            
            const scratchBlock = block.querySelector('.scratch-block');
            if (scratchBlock) {
                scratchBlock.classList.remove('block-highlight');
            }
        }
        
        /**
         * מסיר הדגשה מכל הלבנים
         */
        function clearAllHighlights() {
            document.querySelectorAll('.scratch-block.block-highlight').forEach(block => {
                block.classList.remove('block-highlight');
            });
        }
        
        /**
         * מחבר שתי לבנים על ידי מיקום מדויק
         * @param {Object} connection - אובייקט המתאר את החיבור
         */
        function snapBlocks(connection) {
            if (!connection) return;
            
            const { type, source, target } = connection;
            const sourceRect = source.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const areaRect = programmingArea.getBoundingClientRect();
            
            // מיקום חדש עבור הלבנה הנגררת
            let newLeft, newTop;
            
            if (type === 'right-to-left') {
                // הימני של המקור מתחבר לשמאלי של היעד
                newLeft = targetRect.left - sourceRect.width - areaRect.left + 'px';
                newTop = targetRect.top - areaRect.top + 'px';
            } 
            else if (type === 'left-to-right') {
                // השמאלי של המקור מתחבר לימני של היעד
                newLeft = targetRect.right - areaRect.left + 'px';
                newTop = targetRect.top - areaRect.top + 'px';
            }
            else if (type === 'left-to-bottom') {
                // השמאלי של המקור מתחבר לתחתית של היעד (לבלוק repeat)
                newLeft = targetRect.left - areaRect.left + 'px';
                newTop = targetRect.bottom - areaRect.top + 'px';
            }
            
            // יישום המיקום החדש
            source.style.left = newLeft;
            source.style.top = newTop;
        }
        
        /**
         * טיפול בלחיצה על לבנה באזור הלבנים והתחלת גרירה
         * @param {Event} e - אירוע לחיצת עכבר
         */
        function handlePaletteBlockMouseDown(e) {
            // מצא את ה-container של הלבנה
            const blockContainer = e.target.closest('.block-container');
            if (!blockContainer) return;
            
            // מניעת התנהגות ברירת מחדל
            e.preventDefault();
            e.stopPropagation();
            
            // חישוב היסט הלחיצה מפינת הלבנה
            const rect = blockContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            // יצירת עותק של הלבנה לגרירה
            const clone = blockContainer.cloneNode(true);
            clone.style.position = 'absolute';
            clone.style.zIndex = '1000';
            clone.style.opacity = '0.9';
            clone.style.pointerEvents = 'none';
            clone.classList.add('dragging');
            
            // התאמת המראה החזותי
            const scratchBlock = clone.querySelector('.scratch-block');
            if (scratchBlock) {
                const originalBlock = blockContainer.querySelector('.scratch-block');
                if (originalBlock) {
                    // העתקת סגנון מהלבנה המקורית
                    const computedStyle = window.getComputedStyle(originalBlock);
                    scratchBlock.style.backgroundColor = computedStyle.backgroundColor;
                    scratchBlock.style.width = computedStyle.width;
                    scratchBlock.style.height = computedStyle.height;
                    scratchBlock.style.borderRadius = computedStyle.borderRadius;
                    scratchBlock.style.boxShadow = computedStyle.boxShadow;
                    scratchBlock.style.display = 'flex';
                    scratchBlock.style.justifyContent = 'center';
                    scratchBlock.style.alignItems = 'center';
                }
            }
            
            // ביטול גרירת דפדפן סטנדרטית
            disableBrowserDrag(clone);
            
            // הוספת העותק למסמך
            document.body.appendChild(clone);
            
            // שמירת הלבנה הנגררת
            activeDrag = {
                element: clone,
                source: 'palette',
                type: blockContainer.dataset.type,
                category: blockContainer.dataset.category
            };
            
            // מיקום התחלתי
            clone.style.left = (e.clientX - dragOffsetX) + 'px';
            clone.style.top = (e.clientY - dragOffsetY) + 'px';
            
            // הוספת מאזיני אירועים לגרירה
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        
        /**
         * טיפול בלחיצה על לבנה באזור התכנות והתחלת גרירה
         * @param {Event} e - אירוע לחיצת עכבר
         */
        function handleProgramBlockMouseDown(e) {
            // מצא את ה-container של הלבנה
            const blockContainer = e.target.closest('.block-container');
            if (!blockContainer || !blockContainer.querySelector('.scratch-block')) return;
            
            // מניעת התנהגות ברירת מחדל
            e.preventDefault();
            e.stopPropagation();
            
            // חישוב היסט הלחיצה מפינת הלבנה
            const rect = blockContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            // סימון הלבנה כנגררת
            blockContainer.classList.add('dragging');
            blockContainer.style.zIndex = '1000';
            
            // ביטול גרירת דפדפן סטנדרטית
            disableBrowserDrag(blockContainer);
            
            // שמירת הלבנה הנגררת
            activeDrag = {
                element: blockContainer,
                source: 'program',
                type: blockContainer.dataset.type,
                category: blockContainer.dataset.category,
                startPosition: {
                    left: blockContainer.style.left,
                    top: blockContainer.style.top
                }
            };
            
            // הוספת מאזיני אירועים לגרירה
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        
        /**
         * טיפול בתנועת העכבר בזמן גרירה
         * @param {Event} e - אירוע תנועת עכבר
         */
        function handleMouseMove(e) {
            if (!activeDrag || !activeDrag.element) return;
            
            // מניעת התנהגות ברירת מחדל
            e.preventDefault();
            e.stopPropagation();
            
            // עדכון מיקום האלמנט הנגרר
            const element = activeDrag.element;
            
            if (activeDrag.source === 'palette') {
                // עדכון מיקום עבור גרירה מאזור הלבנים
                element.style.left = (e.clientX - dragOffsetX) + 'px';
                element.style.top = (e.clientY - dragOffsetY) + 'px';
                
                // בדוק אם מעל אזור התכנות (להדגשה ויזואלית)
                const areaRect = programmingArea.getBoundingClientRect();
                const isOverProgrammingArea = (
                    e.clientX >= areaRect.left &&
                    e.clientX <= areaRect.right &&
                    e.clientY >= areaRect.top &&
                    e.clientY <= areaRect.bottom
                );
                
                // עדכון שקיפות לפי המיקום
                element.style.opacity = isOverProgrammingArea ? '1.0' : '0.7';
            } else {
                // עדכון מיקום עבור גרירה באזור התכנות
                const areaRect = programmingArea.getBoundingClientRect();
                let newLeft = e.clientX - areaRect.left - dragOffsetX;
                let newTop = e.clientY - areaRect.top - dragOffsetY;
                
                // וידוא שהלבנה נשארת בתוך אזור התכנות
                const elementRect = element.getBoundingClientRect();
                const maxLeft = areaRect.width - elementRect.width;
                const maxTop = areaRect.height - elementRect.height;
                
                newLeft = Math.max(0, Math.min(newLeft, maxLeft));
                newTop = Math.max(0, Math.min(newTop, maxTop));
                
                // עדכון מיקום
                element.style.left = newLeft + 'px';
                element.style.top = newTop + 'px';
                
                // חיפוש חיבורים אפשריים
                potentialTargets = findPotentialConnections(element);
                
                // ניקוי הדגשות קודמות
                clearAllHighlights();
                
                // הדגש לבנה קרובה אם יש כזו
                if (potentialTargets.length > 0) {
                    // מיון לפי מרחק
                    potentialTargets.sort((a, b) => a.distance - b.distance);
                    const closestTarget = potentialTargets[0];
                    
                    // הדגש את היעד הקרוב ביותר
                    highlightBlock(closestTarget.target);
                }
            }
        }
        
        /**
         * טיפול בשחרור לחצן העכבר בסיום גרירה
         * @param {Event} e - אירוע שחרור לחצן עכבר
         */
        function handleMouseUp(e) {
            if (!activeDrag || !activeDrag.element) return;
            
            // הסר מאזינים
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            const element = activeDrag.element;
            
            if (activeDrag.source === 'palette') {
                // גרירה מאזור הלבנים
                
                // בדיקה אם שוחרר מעל אזור התכנות
                const areaRect = programmingArea.getBoundingClientRect();
                const isOverProgrammingArea = (
                    e.clientX >= areaRect.left &&
                    e.clientX <= areaRect.right &&
                    e.clientY >= areaRect.top &&
                    e.clientY <= areaRect.bottom
                );
                
                // הסרת העותק מהמסמך
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                
                if (isOverProgrammingArea) {
                    // יצירת לבנה חדשה באזור התכנות
                    createBlockInProgrammingArea(
                        activeDrag.type,
                        activeDrag.category,
                        e.clientX - areaRect.left - dragOffsetX,
                        e.clientY - areaRect.top - dragOffsetY
                    );
                }
            } else {
                // גרירה באזור התכנות
                
                // הסרת סימון גרירה
                element.classList.remove('dragging');
                element.style.zIndex = '';
                
                // טיפול בחיבורים אם יש כאלה
                if (potentialTargets.length > 0) {
                    potentialTargets.sort((a, b) => a.distance - b.distance);
                    const closestTarget = potentialTargets[0];
                    
                    if (closestTarget.distance < SNAP_THRESHOLD) {
                        snapBlocks(closestTarget);
                    }
                }
            }
            
            // ניקוי הדגשות
            clearAllHighlights();
            
            // איפוס המצב
            activeDrag = null;
            potentialTargets = [];
        }
        
        /**
         * יוצר לבנה חדשה באזור התכנות
         * @param {string} type - סוג הלבנה
         * @param {string} category - קטגוריית הלבנה
         * @param {number} left - מיקום אופקי
         * @param {number} top - מיקום אנכי
         */
        function createBlockInProgrammingArea(type, category, left, top) {
            // מצא את לבנת המקור באזור הלבנים לפי הסוג והקטגוריה
            const sourceBlock = document.querySelector(`.block-container[data-type="${type}"][data-category="${category}"]`);
            if (!sourceBlock) return;
            
            // יצירת לבנה חדשה
            const newBlock = document.createElement('div');
            newBlock.className = 'block-container';
            newBlock.dataset.type = type;
            newBlock.dataset.category = category;
            
            // העתקת התוכן מלבנת המקור
            const sourceBlockHTML = sourceBlock.querySelector('.scratch-block');
            if (sourceBlockHTML) {
                // יצירת הבלוק הפנימי
                const newBlockHTML = document.createElement('div');
                newBlockHTML.className = 'scratch-block';
                
                // העתקת הסגנון מהבלוק המקורי
                const computedStyle = window.getComputedStyle(sourceBlockHTML);
                newBlockHTML.style.backgroundColor = computedStyle.backgroundColor;
                newBlockHTML.style.width = computedStyle.width;
                newBlockHTML.style.height = computedStyle.height;
                newBlockHTML.style.borderRadius = computedStyle.borderRadius;
                newBlockHTML.style.boxShadow = computedStyle.boxShadow;
                newBlockHTML.style.position = 'relative';
                
                // העתקת האייקון
                const sourceIcon = sourceBlockHTML.querySelector('.block-icon-img');
                if (sourceIcon) {
                    const newIcon = document.createElement('img');
                    newIcon.src = sourceIcon.src;
                    newIcon.alt = sourceIcon.alt;
                    newIcon.className = 'block-icon-img';
                    newBlockHTML.appendChild(newIcon);
                    
                    // ביטול גרירה של האייקון
                    newIcon.draggable = false;
                }
                
                // הוספת הבלוק הפנימי ללבנה
                newBlock.appendChild(newBlockHTML);
            }
            
            // מיקום הלבנה החדשה
            newBlock.style.position = 'absolute';
            newBlock.style.left = left + 'px';
            newBlock.style.top = top + 'px';
            
            // הוספת הלבנה לאזור התכנות
            programmingArea.appendChild(newBlock);
            
            // הגדרת אירועי גרירה עבור הלבנה החדשה
            newBlock.addEventListener('mousedown', handleProgramBlockMouseDown);
            disableBrowserDrag(newBlock);
            
            // בדיקת חיבורים אפשריים
            setTimeout(() => {
                const connections = findPotentialConnections(newBlock);
                if (connections.length > 0) {
                    // מיון לפי מרחק
                    connections.sort((a, b) => a.distance - b.distance);
                    const closestConnection = connections[0];
                    
                    if (closestConnection.distance < SNAP_THRESHOLD) {
                        snapBlocks(closestConnection);
                    }
                }
            }, 10);
        }
        
        /**
         * אתחול מערכת הגרירה והחיבור המשופרת
         */
        function init() {
            console.log('אתחול מערכת גרירה וחיבור לבנים משופרת');
            
            // ביטול גרירת דפדפן ברמת המסמך
            document.addEventListener('dragstart', preventDefault, true);
            
            // ביטול גרירה עבור כל התמונות הקיימות
            document.querySelectorAll('img').forEach(img => {
                img.draggable = false;
                img.setAttribute('draggable', 'false');
            });
            
            // הוספת מאזיני אירועים עבור לבנים באזור הלבנים
            const paletteBlocks = blockPalette.querySelectorAll('.block-container');
            paletteBlocks.forEach(block => {
                block.addEventListener('mousedown', handlePaletteBlockMouseDown);
                disableBrowserDrag(block);
            });
            
            // הוספת מאזיני אירועים עבור לבנים באזור התכנות
            const programBlocks = programmingArea.querySelectorAll('.block-container');
            programBlocks.forEach(block => {
                block.addEventListener('mousedown', handleProgramBlockMouseDown);
                disableBrowserDrag(block);
            });
            
            // מאזין אירועים לזיהוי לבנים חדשות
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
