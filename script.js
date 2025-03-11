// הגדרת מידע על הבלוקים השונים
const blockDefinitions = {
    trigger: [
        { id: 'start-green-flag', name: 'התחל בלחיצה על הדגל הירוק', icon: '🏁' },
        { id: 'start-tap', name: 'התחל בלחיצה על הדמות', icon: '👆' },
        { id: 'start-on-bump', name: 'התחל בהתנגשות', icon: '💥' },
        { id: 'send-message', name: 'שלח הודעה', icon: '📤' },
        { id: 'start-on-message', name: 'התחל בקבלת הודעה', icon: '📨' }
    ],
    motion: [
        { id: 'move-right', name: 'זוז ימינה', icon: '➡️', value: 1 },
        { id: 'move-left', name: 'זוז שמאלה', icon: '⬅️', value: 1 },
        { id: 'move-up', name: 'זוז למעלה', icon: '⬆️', value: 1 },
        { id: 'move-down', name: 'זוז למטה', icon: '⬇️', value: 1 },
        { id: 'turn-right', name: 'פנה ימינה', icon: '↩️', value: 1 },
        { id: 'turn-left', name: 'פנה שמאלה', icon: '↪️', value: 1 },
        { id: 'hop', name: 'קפוץ', icon: '⤴️' },
        { id: 'go-home', name: 'חזור הביתה', icon: '🏠' }
    ],
    looks: [
        { id: 'say', name: 'אמור', icon: '💬', value: 'שלום!' },
        { id: 'grow', name: 'גדל', icon: '🔍+' },
        { id: 'shrink', name: 'הקטן', icon: '🔍-' },
        { id: 'reset-size', name: 'אפס גודל', icon: '🔍=' },
        { id: 'hide', name: 'הסתר', icon: '👻' },
        { id: 'show', name: 'הצג', icon: '👁️' }
    ],
    sound: [
        { id: 'play-pop', name: 'השמע צליל פופ', icon: '🔊' },
        { id: 'play-recorded', name: 'השמע הקלטה', icon: '🎵' }
    ],
    control: [
        { id: 'wait', name: 'המתן', icon: '⏱️', value: 1 },
        { id: 'set-speed', name: 'קבע מהירות', icon: '⚡', value: 'normal' },
        { id: 'repeat', name: 'חזור', icon: '🔄', value: 2 },
        { id: 'repeat-forever', name: 'חזור לנצח', icon: '♾️' },
        { id: 'go-to-page', name: 'עבור לעמוד', icon: '📄', value: 1 }
    ],
    end: [
        { id: 'stop', name: 'עצור', icon: '🛑' },
        { id: 'end', name: 'סיום', icon: '🏁' }
    ]
};

// משתנים גלובליים למערכת
let currentCategory = 'trigger';
let currentPage = 1;
let scripts = []; // מערך שמכיל את כל הסקריפטים
let isRunning = false;
let activeCharacter = 'character1';
let draggedBlock = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let blockIdCounter = 1;

// אתחול המערכת
document.addEventListener('DOMContentLoaded', function() {
    // הצג בלוקים מהקטגוריה הראשונה
    displayBlocksForCategory(currentCategory);
    
    // הגדר אירועים לכפתורי הקטגוריות
    document.querySelectorAll('.category-button').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            selectCategory(category);
        });
    });
    
    // אירועים לכפתורי הניווט
    document.getElementById('save-button').addEventListener('click', saveProject);
    document.getElementById('load-button').addEventListener('click', loadProject);
    document.getElementById('prev-page').addEventListener('click', goToPreviousPage);
    document.getElementById('next-page').addEventListener('click', goToNextPage);
    document.getElementById('add-character').addEventListener('click', toggleCharacterLibrary);
    document.getElementById('change-background').addEventListener('click', changeBackground);
    
    // אירועים להפעלה ועצירה
    document.getElementById('start-button').addEventListener('click', startExecution);
    document.getElementById('stop-button').addEventListener('click', stopExecution);
    
    // הגדרת אירועי גרירה לשלב
    setupStageDragEvents();
    
    // הגדרת אירועים לספריית הדמויות
    setupCharacterLibrary();
});

// הצגת הבלוקים עבור קטגוריה מסוימת
function displayBlocksForCategory(category) {
    const blocksContainer = document.getElementById('blocks-container');
    blocksContainer.innerHTML = '';
    
    blockDefinitions[category].forEach(blockDef => {
        const block = document.createElement('div');
        block.className = `block ${category}`;
        block.dataset.blockType = blockDef.id;
        block.dataset.category = category;
        block.title = blockDef.name;
        
        // הוספת צלמית לבלוק
        block.innerHTML = `<div class="block-icon">${blockDef.icon}</div>`;
        
        // הוספת ערך לבלוק אם יש כזה
        if (blockDef.value !== undefined) {
            block.dataset.value = blockDef.value;
        }
        
        // הגדרת אירועי גרירה לבלוק
        block.draggable = true;
        block.addEventListener('dragstart', handleBlockDragStart);
        block.addEventListener('mousedown', handleBlockMouseDown);
        
        blocksContainer.appendChild(block);
    });
}

// בחירת קטגוריה
function selectCategory(category) {
    // הסר את הסימון מכל הקטגוריות
    document.querySelectorAll('.category-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // סמן את הקטגוריה הנבחרת
    document.querySelector(`.category-button[data-category="${category}"]`).classList.add('active');
    
    // עדכן את הקטגוריה הנוכחית והצג את הבלוקים שלה
    currentCategory = category;
    displayBlocksForCategory(category);
}

// טיפול בהתחלת גרירת בלוק
function handleBlockDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.blockType);
    e.dataTransfer.effectAllowed = 'copy';
}

// טיפול בלחיצה על בלוק
function handleBlockMouseDown(e) {
    // יצירת בלוק חדש לגרירה (העתק של הבלוק המקורי)
    const original = e.currentTarget;
    draggedBlock = original.cloneNode(true);
    draggedBlock.style.position = 'absolute';
    draggedBlock.style.zIndex = 1000;
    
    // חישוב ההיסט בין נקודת הלחיצה למיקום הבלוק
    const rect = original.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    
    // הוספת מזהה ייחודי לבלוק
    draggedBlock.id = 'block-' + blockIdCounter++;
    
    // הוספת הבלוק לגוף המסמך
    document.body.appendChild(draggedBlock);
    
    // עדכון מיקום הבלוק
    updateDraggedBlockPosition(e);
    
    // הוספת מאזיני אירועים לתנועת העכבר ושחרור הלחצן
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // מניעת התנהגות ברירת המחדל
    e.preventDefault();
}

// עדכון מיקום הבלוק הנגרר
function updateDraggedBlockPosition(e) {
    if (draggedBlock) {
        draggedBlock.style.left = (e.clientX - dragOffsetX) + 'px';
        draggedBlock.style.top = (e.clientY - dragOffsetY) + 'px';
    }
}

// טיפול בתנועת העכבר בזמן גרירה
function handleMouseMove(e) {
    updateDraggedBlockPosition(e);
    
    // בדיקה אם הבלוק נמצא מעל אזור התכנות
    const programmingArea = document.getElementById('programming-area');
    const programmingAreaRect = programmingArea.getBoundingClientRect();
    
    if (e.clientX >= programmingAreaRect.left && e.clientX <= programmingAreaRect.right &&
        e.clientY >= programmingAreaRect.top && e.clientY <= programmingAreaRect.bottom) {
        programmingArea.
