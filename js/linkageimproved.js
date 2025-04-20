// ========================================================================
// מנגנון הצמדת בלוקים בממשק תכנות חזותי - linkageimproved.js
// ========================================================================

// אובייקט המחזיק את המידע על בלוקים מחוברים
const BlockLinkageManager = {
    // מערך של בלוקים מקושרים (כל פריט הוא אובייקט שמכיל מערך של בלוקים שמחוברים ביחד)
    linkedGroups: [],
    
    // משתנה שמסמן האם יש בלוק שנמצא כרגע בתהליך גרירה
    currentDraggedBlock: null,
    
    // משתנה שמציין האם יש צורך להפריד את הבלוקים בעת גרירה (למשל כאשר מקש Shift לחוץ)
    shouldDetach: false,
    
    // פרמטרים להצמדה
    snapDistance: 20, // המרחק שבו תופעל ההצמדה האוטומטית (בפיקסלים)
    blockHeight: 80,  // גובה ברירת מחדל של בלוק
    
    // צבעי ההדגשה בעת קרבה להצמדה
    highlightColors: {
        target: 'rgba(255, 255, 0, 0.5)', // הילה צהובה סביב יעד ההצמדה
        dragged: 'rgba(0, 120, 255, 0.7)' // הילה כחולה סביב הבלוק הנגרר בעת קרבה להצמדה
    },
    
    // פונקציה לאתחול המנגנון
    initialize: function() {
        console.log('Initializing Block Linkage Manager');
        
        // הוספת מאזינים להזזת מקשים (עבור פעולת הפרדה)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                this.shouldDetach = true;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.shouldDetach = false;
            }
        });
        
        // הגדרת אזור התכנות
        const programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("Programming area not found!");
            return;
        }
        
        // עדכון האזינים לאירועי גרירה באזור התכנות
        this.updateDragListeners();
    },
    
    // פונקציה לעדכון מאזיני גרירה לכל הבלוקים באזור התכנות
    updateDragListeners: function() {
        const programmingArea = document.getElementById("program-blocks");
        const blocks = programmingArea.querySelectorAll('.block-container');
        
        blocks.forEach(block => {
            // הסרת מאזינים קיימים למניעת כפילויות
            block.removeEventListener('dragstart', this.handleDragStart);
            block.removeEventListener('drag', this.handleDrag);
            block.removeEventListener('dragend', this.handleDragEnd);
            
            // הוספת מאזינים חדשים עם הקשר (this) מתאים
            block.addEventListener('dragstart', this.handleDragStart.bind(this));
            block.addEventListener('drag', this.handleDrag.bind(this));
            block.addEventListener('dragend', this.handleDragEnd.bind(this));
        });
    },
    
    // טיפול בתחילת גרירה
    handleDragStart: function(event) {
        this.currentDraggedBlock = event.target;
        
        // בדיקה האם הבלוק נמצא בקבוצה מקושרת
        const linkedGroup = this.findLinkedGroup(this.currentDraggedBlock);
        
        // אם נמצא בקבוצה ולא צריך להפריד, נגדיר את כל הבלוקים בקבוצה כנגררים
        if (linkedGroup && !this.shouldDetach) {
            // שמירת אינדקס הבלוק בקבוצה
            const blockIndex = linkedGroup.blocks.indexOf(this.currentDraggedBlock);
            
            // נשמור רק את הבלוקים שמתחת לבלוק הנוכחי (כולל אותו)
            const draggingBlocks = linkedGroup.blocks.slice(blockIndex);
            
            // שמירת מיקום יחסי בין הבלוקים
            const relativePositions = [];
            const currentRect = this.currentDraggedBlock.getBoundingClientRect();
            
            draggingBlocks.forEach(block => {
                if (block !== this.currentDraggedBlock) {
                    const rect = block.getBoundingClientRect();
                    relativePositions.push({
                        block: block,
                        offsetX: rect.left - currentRect.left,
                        offsetY: rect.top - currentRect.top
                    });
                }
            });
            
            // שמירת המידע על הבלוקים הנגררים
            this.currentDraggedBlock.draggingBlocks = draggingBlocks;
            this.currentDraggedBlock.relativePositions = relativePositions;
            
            // הוספת קלאס ויזואלי לבלוקים הנגררים
            draggingBlocks.forEach(block => {
                block.classList.add('dragging');
            });
        } else {
            // אם צריך להפריד או שהבלוק לא בקבוצה, נסמן רק אותו כנגרר
            this.currentDraggedBlock.draggingBlocks = [this.currentDraggedBlock];
            this.currentDraggedBlock.relativePositions = [];
            
            // אם היינו בקבוצה והפרדנו, נעדכן את המבנה הדאטה
            if (linkedGroup && this.shouldDetach) {
                this.detachBlockFromGroup(this.currentDraggedBlock, linkedGroup);
            }
        }
        
        // סימון ויזואלי
        this.currentDraggedBlock.classList.add('dragging');
        
        // הסתרת "צל" הגרירה המובנה של הדפדפן
        event.dataTransfer.setDragImage(new Image(), 0, 0);
    },
    
    // טיפול בזמן גרירה
    handleDrag: function(event) {
        if (!this.currentDraggedBlock || !event.clientX || !event.clientY) return;
        
        const programmingArea = document.getElementById("program-blocks");
        const rect = programmingArea.getBoundingClientRect();
        
        // עדכון מיקום הבלוק הנגרר
        const newLeft = event.clientX - rect.left - (this.currentDraggedBlock.offsetWidth / 2);
        const newTop = event.clientY - rect.top - (this.currentDraggedBlock.offsetHeight / 2);
        
        this.currentDraggedBlock.style.position = "absolute";
        this.currentDraggedBlock.style.left = `${newLeft}px`;
        this.currentDraggedBlock.style.top = `${newTop}px`;
        
        // עדכון מיקום כל הבלוקים המחוברים אליו
        const { relativePositions } = this.currentDraggedBlock;
        if (relativePositions) {
            relativePositions.forEach(item => {
                item.block.style.position = "absolute";
                item.block.style.left = `${newLeft + item.offsetX}px`;
                item.block.style.top = `${newTop + item.offsetY}px`;
            });
        }
        
        // בדיקת הצמדה פוטנציאלית
        this.checkForSnapTargets(this.currentDraggedBlock);
        
        // ללא preventDefault, אירוע הdrag לא תמיד מופעל נכון בכל הדפדפנים
        event.preventDefault();
    },
    
    // טיפול בסיום גרירה
    handleDragEnd: function(event) {
        if (!this.currentDraggedBlock) return;
        
        // הסרת סימון ויזואלי מכל הבלוקים
        const blocks = document.querySelectorAll('.block-container');
        blocks.forEach(block => {
            block.classList.remove('dragging');
            block.classList.remove('snap-target');
            block.classList.remove('near-snap');
        });
        
        // בדיקה האם יש צורך בהצמדה וביצוע ההצמדה
        this.finalizeSnapping(this.currentDraggedBlock, event);
        
        // בסיום הגרירה איפוס המשתנים
        this.currentDraggedBlock = null;
    },
    
    // פונקציה לבדיקת יעדים אפשריים להצמדה
    checkForSnapTargets: function(draggedBlock) {
        // ניקוי סימוני הצמדה קודמים
        const blocks = document.querySelectorAll('.block-container');
        blocks.forEach(block => {
            block.classList.remove('snap-target');
            block.classList.remove('near-snap');
        });
        
        // אם מתבצעת הפרדה, אין צורך לחפש יעדי הצמדה
        if (this.shouldDetach) return;
        
        const draggedRect = draggedBlock.getBoundingClientRect();
        let foundSnapTarget = false;
        
        // חיפוש מועמדים להצמדה - בלוקים שאינם חלק מהקבוצה הנגררת
        blocks.forEach(targetBlock => {
            // דילוג על בלוקים שנגררים כעת
            if (draggedBlock.draggingBlocks && 
                draggedBlock.draggingBlocks.includes(targetBlock)) {
                return;
            }
            
            const targetRect = targetBlock.getBoundingClientRect();
            
            // בדיקה אם הנקודה התחתונה של הבלוק הנגרר קרובה מספיק לנקודה העליונה של הבלוק היעד
            const bottomToTopDist = Math.abs((draggedRect.bottom) - targetRect.top);
            
            // בדיקה אם הבלוקים מיושרים פחות או יותר אופקית
            const horizontalAlignment = Math.abs(targetRect.left - draggedRect.left) < this.snapDistance;
            
            if (bottomToTopDist < this.snapDistance && horizontalAlignment) {
                // סימון הבלוק כיעד אפשרי להצמדה
                targetBlock.classList.add('snap-target');
                targetBlock.dataset.snapDirection = 'bottom-to-top';
                foundSnapTarget = true;
            }
            
            // בדיקה אם הנקודה העליונה של הבלוק הנגרר קרובה מספיק לנקודה התחתונה של הבלוק היעד
            const topToBottomDist = Math.abs(draggedRect.top - targetRect.bottom);
            
            if (topToBottomDist < this.snapDistance && horizontalAlignment) {
                // סימון הבלוק כיעד אפשרי להצמדה
                targetBlock.classList.add('snap-target');
                targetBlock.dataset.snapDirection = 'top-to-bottom';
                foundSnapTarget = true;
            }
        });
        
        // אם נמצא יעד הצמדה, נוסיף גם מסגרת כחולה לבלוק הנגרר
        if (foundSnapTarget) {
            draggedBlock.classList.add('near-snap');
        }
    },
    
    // פונקציה לסיום פעולת ההצמדה
    finalizeSnapping: function(draggedBlock, event) {
        // מציאת בלוק היעד המסומן להצמדה
        const snapTarget = document.querySelector('.block-container.snap-target');
        
        if (!snapTarget || this.shouldDetach) return;
        
        const snapDirection = snapTarget.dataset.snapDirection;
        
        // מציאת הקבוצות המקושרות הרלוונטיות
        const targetGroup = this.findLinkedGroup(snapTarget);
        const sourceGroup = this.findLinkedGroup(draggedBlock);
        
        // הוצאת רשימת הבלוקים הנגררים
        const draggingBlocks = draggedBlock.draggingBlocks || [draggedBlock];
        
        // ביצוע ההצמדה בהתאם לכיוון
        if (snapDirection === 'bottom-to-top') {
            // מיקום הבלוק הנגרר מעל הבלוק היעד
            const targetRect = snapTarget.getBoundingClientRect();
            const programmingArea = document.getElementById("program-blocks");
            const areaRect = programmingArea.getBoundingClientRect();
            
            // חישוב המיקום החדש
            const newLeft = targetRect.left - areaRect.left;
            const newTop = targetRect.top - areaRect.top - draggedBlock.offsetHeight;
            
            // עדכון מיקום
            draggedBlock.style.left = `${newLeft}px`;
            draggedBlock.style.top = `${newTop}px`;
            
            // עדכון מיקום שאר הבלוקים בקבוצה
            if (draggedBlock.relativePositions) {
                draggedBlock.relativePositions.forEach(item => {
                    item.block.style.left = `${newLeft + item.offsetX}px`;
                    item.block.style.top = `${newTop + item.offsetY}px`;
                });
            }
            
            // עדכון מידע הקישור
            this.linkBlocks(draggingBlocks, snapTarget, 'above');
            
        } else if (snapDirection === 'top-to-bottom') {
            // מיקום הבלוק הנגרר מתחת לבלוק היעד
            const targetRect = snapTarget.getBoundingClientRect();
            const programmingArea = document.getElementById("program-blocks");
            const areaRect = programmingArea.getBoundingClientRect();
            
            // חישוב המיקום החדש
            const newLeft = targetRect.left - areaRect.left;
            const newTop = targetRect.bottom - areaRect.top;
            
            // עדכון מיקום
            draggedBlock.style.left = `${newLeft}px`;
            draggedBlock.style.top = `${newTop}px`;
            
            // עדכון מיקום שאר הבלוקים בקבוצה
            if (draggedBlock.relativePositions) {
                draggedBlock.relativePositions.forEach(item => {
                    item.block.style.left = `${newLeft + item.offsetX}px`;
                    item.block.style.top = `${newTop + item.offsetY}px`;
                });
            }
            
            // עדכון מידע הקישור
            this.linkBlocks(draggingBlocks, snapTarget, 'below');
        }
        
        // הוספת אנימציה קלה להצמדה
        this.animateSnap(draggedBlock);
    },
    
    // פונקציה לקישור בלוקים
    linkBlocks: function(blocksToAdd, existingBlock, position) {
        // בדיקה אם הבלוק הקיים כבר נמצא בקבוצה
        let existingGroup = this.findLinkedGroup(existingBlock);
        
        if (!existingGroup) {
            // אם לא, יצירת קבוצה חדשה
            existingGroup = { blocks: [existingBlock] };
            this.linkedGroups.push(existingGroup);
        }
        
        // חיפוש מיקום הבלוק הקיים בקבוצה שלו
        const blockIndex = existingGroup.blocks.indexOf(existingBlock);
        
        if (position === 'above') {
            // הוספת הבלוקים החדשים לפני הבלוק הקיים
            existingGroup.blocks.splice(blockIndex, 0, ...blocksToAdd);
        } else {
            // הוספת הבלוקים החדשים אחרי הבלוק הקיים
            existingGroup.blocks.splice(blockIndex + 1, 0, ...blocksToAdd);
        }
        
        // מחיקת הקבוצות הישנות של הבלוקים שהתווספו
        blocksToAdd.forEach(block => {
            const oldGroup = this.findLinkedGroup(block);
            if (oldGroup && oldGroup !== existingGroup) {
                // מחיקת הבלוק מהקבוצה הישנה
                const index = oldGroup.blocks.indexOf(block);
                if (index > -1) {
                    oldGroup.blocks.splice(index, 1);
                }
                
                // אם הקבוצה ריקה, מחיקתה
                if (oldGroup.blocks.length === 0) {
                    const groupIndex = this.linkedGroups.indexOf(oldGroup);
                    if (groupIndex > -1) {
                        this.linkedGroups.splice(groupIndex, 1);
                    }
                }
            }
        });
        
        // איפוס הכפילויות
        existingGroup.blocks = [...new Set(existingGroup.blocks)];
        
        // עדכון מידע הקישור
        console.log('Updated linked groups:', this.linkedGroups);
    },
    
    // פונקציה למציאת הקבוצה המקושרת של בלוק
    findLinkedGroup: function(block) {
        return this.linkedGroups.find(group => group.blocks.includes(block));
    },
    
    // פונקציה להפרדת בלוק מקבוצה
    detachBlockFromGroup: function(block, group) {
        if (!group) return;
        
        // מציאת המיקום של הבלוק בקבוצה
        const blockIndex = group.blocks.indexOf(block);
        if (blockIndex === -1) return;
        
        // לקיחת כל הבלוקים מהמיקום הנוכחי ומטה
        const detachedBlocks = group.blocks.splice(blockIndex);
        
        // אם נשארו בלוקים בקבוצה המקורית, נשאיר אותה
        if (group.blocks.length === 0) {
            const groupIndex = this.linkedGroups.indexOf(group);
            if (groupIndex > -1) {
                this.linkedGroups.splice(groupIndex, 1);
            }
        }
        
        // אם יש יותר מבלוק אחד שהופרד, ניצור קבוצה חדשה עבורם
        if (detachedBlocks.length > 1) {
            this.linkedGroups.push({ blocks: detachedBlocks });
        }
    },
    
    // פונקציה לאנימציית הצמדה
    animateSnap: function(block) {
        // הוספת קלאס לאנימציה
        block.classList.add('snapped');
        
        // הסרת הקלאס לאחר האנימציה
        setTimeout(() => {
            block.classList.remove('snapped');
        }, 300);
    },
    
    // פונקציה לטיפול בהשמטת בלוק באזור התכנות (מעובדת מגרסה קודמת)
    handleDrop: function(event) {
        event.preventDefault();
        
        // בדיקה אם מדובר בהזזת בלוק קיים
        const blockIndex = event.dataTransfer.getData('block-index');
        if (blockIndex !== undefined && blockIndex !== '') {
            // הזזת בלוק קיים מטופלת בפונקציית handleDragEnd
            return;
        }
        
        // יצירת בלוק חדש
        const programmingArea = document.getElementById("program-blocks");
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
            
            // יצירת בלוק חדש והוספתו לאזור התכנות
            const newBlock = createBlockElement(blockDefinition, blockCategory);
            programmingArea.appendChild(newBlock);
            
            // הוספת מאזיני גרירה מתקדמים לבלוק החדש
            newBlock.removeEventListener('dragstart', BlockLinkageManager.handleDragStart);
            newBlock.removeEventListener('drag', BlockLinkageManager.handleDrag);
            newBlock.removeEventListener('dragend', BlockLinkageManager.handleDragEnd);
            
            newBlock.addEventListener('dragstart', BlockLinkageManager.handleDragStart.bind(BlockLinkageManager));
            newBlock.addEventListener('drag', BlockLinkageManager.handleDrag.bind(BlockLinkageManager));
            newBlock.addEventListener('dragend', BlockLinkageManager.handleDragEnd.bind(BlockLinkageManager));
            
            // מיקום הבלוק החדש
            const rect = programmingArea.getBoundingClientRect();
            newBlock.style.position = "absolute";
            const blockWidth = newBlock.offsetWidth || 100;
            const blockHeight = newBlock.offsetHeight || 80;
            newBlock.style.left = `${event.clientX - rect.left - (blockWidth / 2)}px`;
            newBlock.style.top = `${event.clientY - rect.top - (blockHeight / 2)}px`;
            
            // בדיקת הצמדה אפשרית לבלוקים קיימים
            BlockLinkageManager.checkForSnapTargets(newBlock);
            
        } catch (e) {
            console.error("Error parsing dropped data:", e);
        }
    }
};

// ========================================================================
// הוספת סגנונות CSS למערכת ההצמדה
// ========================================================================
function addLinkageStyles() {
    // בדיקה האם הסגנונות כבר קיימים
    if (document.getElementById('linkage-styles')) {
        return;
    }
    
    const styleSheet = document.createElement("style");
    styleSheet.id = "linkage-styles";
    styleSheet.type = "text/css";
    styleSheet.innerHTML = `
        /* סגנון בלוק בגרירה */
        .block-container.dragging {
            opacity: 0.8;
            z-index: 1000;
        }
        
        /* סגנון בלוק שמהווה יעד הצמדה */
        .block-container.snap-target {
            background-color: rgba(255, 255, 0, 0.3) !important;
            border: 2px solid #FFD700 !important;
            box-shadow: 0 0 8px 2px rgba(255, 215, 0, 0.5) !important;
            z-index: 999;
        }
        
        /* סגנון בלוק נגרר בעת קרבה להצמדה */
        .block-container.near-snap {
            border: 2px dashed #0078FF !important;
            box-shadow: 0 0 8px 2px rgba(0, 120, 255, 0.5) !important;
            z-index: 1001;
        }
        
        /* אנימציית הצמדה */
        .block-container.snapped {
            animation: snap-animation 0.3s ease;
        }
        
        @keyframes snap-animation {
            0% { transform: scale(1.05); }
            50% { transform: scale(0.95); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(styleSheet);
    console.log("Added linkage styles");
}

// ========================================================================
// עדכון פונקציית ה-handleDrop הקיימת עם פונקציית המנגנון החדש
// ========================================================================
function overrideDropHandler() {
    const programmingArea = document.getElementById("program-blocks");
    if (programmingArea) {
        // הסרת המאזין הקיים
        programmingArea.removeEventListener("drop", handleDrop);
        
        // הוספת המאזין החדש
        programmingArea.addEventListener("drop", BlockLinkageManager.handleDrop.bind(BlockLinkageManager));
    }
}

// ========================================================================
// אתחול מנגנון ההצמדה כאשר ה-DOM נטען
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing Block Linkage System");
    
    // הוספת סגנונות CSS למנגנון ההצמדה
    addLinkageStyles();
    
    // עדכון מאזין ה-drop באזור התכנות
    overrideDropHandler();
    
    // אתחול מנגנון ההצמדה
    BlockLinkageManager.initialize();
});
