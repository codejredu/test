// ========================================================================
// מנגנון הצמדת בלוקים בממשק תכנות חזותי - linkageimproved.js (גרסה עם לוגינג מפורט)
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
                console.log("מקש Shift נלחץ - מצב הפרדה פעיל");
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.shouldDetach = false;
                console.log("מקש Shift שוחרר - מצב הפרדה כבוי");
            }
        });
        
        // הגדרת אזור התכנות
        const programmingArea = document.getElementById("program-blocks");
        if (!programmingArea) {
            console.error("Programming area not found!");
            return;
        }
        
        console.log("אזור התכנות אותר בהצלחה");
        
        // עדכון האזינים לאירועי גרירה באזור התכנות
        this.updateDragListeners();
    },
    
    // פונקציה לעדכון מאזיני גרירה לכל הבלוקים באזור התכנות
    updateDragListeners: function() {
        const programmingArea = document.getElementById("program-blocks");
        const blocks = programmingArea.querySelectorAll('.block-container');
        
        console.log(`מעדכן מאזיני גרירה ל-${blocks.length} בלוקים`);
        
        blocks.forEach((block, index) => {
            // הסרת מאזינים קיימים למניעת כפילויות
            block.removeEventListener('dragstart', this.handleDragStart);
            block.removeEventListener('drag', this.handleDrag);
            block.removeEventListener('dragend', this.handleDragEnd);
            
            // הוספת מאזינים חדשים עם הקשר (this) מתאים
            block.addEventListener('dragstart', this.handleDragStart.bind(this));
            block.addEventListener('drag', this.handleDrag.bind(this));
            block.addEventListener('dragend', this.handleDragEnd.bind(this));
            
            console.log(`מאזיני גרירה נוספו לבלוק #${index}`);
        });
    },
    
    // טיפול בתחילת גרירה
    handleDragStart: function(event) {
        console.log("תחילת גרירה", event.target);
        
        this.currentDraggedBlock = event.target;
        
        // בדיקה האם הבלוק נמצא בקבוצה מקושרת
        const linkedGroup = this.findLinkedGroup(this.currentDraggedBlock);
        
        // אם נמצא בקבוצה ולא צריך להפריד, נגדיר את כל הבלוקים בקבוצה כנגררים
        if (linkedGroup && !this.shouldDetach) {
            // שמירת אינדקס הבלוק בקבוצה
            const blockIndex = linkedGroup.blocks.indexOf(this.currentDraggedBlock);
            
            // נשמור רק את הבלוקים שמתחת לבלוק הנוכחי (כולל אותו)
            const draggingBlocks = linkedGroup.blocks.slice(blockIndex);
