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

        // נבטל את ברירת המחדל של גרירה מובנית, נשתמש רק בגרירת עכבר רגילה
    character.addEventListener('dragstart', (event) => {
        // מניעת ברירת המחדל של גרירה מובנית בדפדפן
        event.preventDefault();
        return false;
    });
    
    // נגדיר את האלמנט כלא ניתן לגרירה באמצעות המערכת המובנית של הדפדפן
    character.setAttribute('draggable', 'false');
    
    // נשתמש רק בגרירה עם mouse (ללא שימוש ב-HTML5 Drag & Drop API)
    // כדי לשמור על הסמן מעל הדמות
    let isDragging = false;
    let dragStartX, dragStartY; // נקודת התחלה של הגרירה
    let initialLeft, initialTop; // מיקום התחלתי של הדמות
    
    character.addEventListener('mousedown', (event) => {
        event.preventDefault(); // מניעת ברירת מחדל של הדפדפן
        
        isDragging = true;
        
        // נשמור את המיקום ההתחלתי של העכבר
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        
        // נשמור את המיקום ההתחלתי של הדמות
        initialLeft = parseInt(character.style.left) || 0;
        initialTop = parseInt(character.style.top) || 0;
        
        character.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        
        // חישוב ההפרש בין המיקום הנוכחי למיקום ההתחלתי של העכבר
        const deltaX = event.clientX - dragStartX;
        const deltaY = event.clientY - dragStartY;
        
        const stageRect = stage.getBoundingClientRect();
        const characterWidth = character.offsetWidth;
        const characterHeight = character.offsetHeight;
        
        // חישוב המיקום החדש על פי ההפרש + המיקום ההתחלתי של הדמות
        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;
        
        // וידוא שהדמות נשארת בתוך הבמה
        newLeft = Math.max(0, Math.min(newLeft, stageRect.width - characterWidth));
        newTop = Math.max(0, Math.min(newTop, stageRect.height - characterHeight));
        
        character.style.left = newLeft + 'px';
        character.style.top = newTop + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (character) {
            character.style.cursor = 'grab';
        }
    });
    
    // מניעת התנהגות גרירה מובנית של הדפדפן
    character.ondragstart = function() { 
        return false; 
    };
}

// נוסיף גם סגנון CSS להסתרת תמונת הרפאים
// צריך להוסיף את זה ל-CSS או כסגנון מוטמע

const styleElement = document.createElement('style');
styleElement.textContent = `
    #character {
        cursor: grab;
        user-select: none;
        -webkit-user-drag: none;
        touch-action: none;
    }
    
    #character:active {
        cursor: grabbing;
    }
`;
document.head.appendChild(styleElement);
