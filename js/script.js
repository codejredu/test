// עדכון קוד הגרירה של הדמות
const character = document.getElementById('character');
const stage = document.getElementById("stage");

if (character && stage) {
    // נוסיף העברת מצביע בכניסה וביציאה מהדמות
    character.addEventListener('mouseenter', () => {
        character.style.cursor = 'grab';
    });
    
    character.addEventListener('mouseleave', () => {
        character.style.cursor = 'default';
    });
    
    character.addEventListener('mousedown', () => {
        character.style.cursor = 'grabbing';
    });
    
    character.addEventListener('mouseup', () => {
        character.style.cursor = 'grab';
    });

    character.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', 'character');
        event.dataTransfer.effectAllowed = "move";
        
        // ביטול תמונת הרפאים - הגדרת תמונה שקופה
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // תמונה שקופה של 1x1 פיקסלים
        event.dataTransfer.setDragImage(img, 0, 0);
        
        character.style.cursor = 'grabbing';
        character.classList.add('dragging');
    });

    character.addEventListener('dragend', (event) => {
        character.style.cursor = 'grab';
        character.classList.remove('dragging');
    });

    stage.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        
        // עדכון מיקום הדמות בזמן הגרירה לפי המיקום הנוכחי של העכבר
        if (character.classList.contains('dragging')) {
            const stageRect = stage.getBoundingClientRect();
            const characterWidth = character.offsetWidth;
            const characterHeight = character.offsetHeight;

            let x = event.clientX - stageRect.left - characterWidth / 2;
            let y = event.clientY - stageRect.top - characterHeight / 2;

            // וידוא שהדמות נשארת בתוך הבמה
            x = Math.max(0, Math.min(x, stageRect.width - characterWidth));
            y = Math.max(0, Math.min(y, stageRect.height - characterHeight));

            character.style.left = x + 'px';
            character.style.top = y + 'px';
        }
    });

    stage.addEventListener('drop', (event) => {
        event.preventDefault();
        // אין צורך לעשות כלום כאן, כי כבר עדכנו את המיקום ב-dragover
        character.classList.remove('dragging');
    });
    
    // נוסיף גם אפשרות לגרירה רגילה עם mouse (ללא שימוש ב-HTML5 Drag & Drop API)
    let isDragging = false;
    let offsetX, offsetY;
    
    character.addEventListener('mousedown', (event) => {
        isDragging = true;
        
        // חישוב ההיסט בין מיקום העכבר למיקום הדמות
        const characterRect = character.getBoundingClientRect();
        offsetX = event.clientX - characterRect.left;
        offsetY = event.clientY - characterRect.top;
        
        character.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        
        const stageRect = stage.getBoundingClientRect();
        const characterWidth = character.offsetWidth;
        const characterHeight = character.offsetHeight;
        
        // חישוב המיקום החדש עם התחשבות בהיסט
        let x = event.clientX - stageRect.left - offsetX;
        let y = event.clientY - stageRect.top - offsetY;
        
        // וידוא שהדמות נשארת בתוך הבמה
        x = Math.max(0, Math.min(x, stageRect.width - characterWidth));
        y = Math.max(0, Math.min(y, stageRect.height - characterHeight));
        
        character.style.left = x + 'px';
        character.style.top = y + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (character) {
            character.style.cursor = 'grab';
        }
    });
}

// נוסיף גם סגנון CSS להסתרת תמונת הרפאים
// צריך להוסיף את זה ל-CSS או כסגנון מוטמע

const styleElement = document.createElement('style');
styleElement.textContent = `
    .dragging {
        opacity: 1;
    }
    
    [draggable=true] {
        user-select: none;
        -webkit-user-drag: none;
    }
`;
document.head.appendChild(styleElement);
