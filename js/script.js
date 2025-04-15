// ========================================================================
// Character Dragging - קוד גרירת דמות סופי ומתוקן
// ========================================================================
const character = document.getElementById('character');
const stage = document.getElementById("stage");

if (character && stage) {
    let isDragging = false;
    let dragStartX, dragStartY;
    let initialLeft, initialTop;
    
    // פונקציה למרכוז הדמות
    function centerCharacter() {
        if (!character || !stage) return;
        
        // שימור המאפיינים המקוריים של הדמות
        const originalTransform = character.style.transform;
        
        // מדידת גודל הבמה והדמות
        const stageWidth = stage.offsetWidth;
        const stageHeight = stage.offsetHeight;
        const charWidth = character.offsetWidth;
        const charHeight = character.offsetHeight;
        
        // חישוב מיקום מרכז (בתיאום עם transform המקורי)
        if (originalTransform && originalTransform.includes('translate')) {
            // יש transform - נשתמש בו
            character.style.left = '50%';
            character.style.top = '50%';
        } else {
            // אין transform - נמקם ידנית
            const centerX = (stageWidth - charWidth) / 2;
            const centerY = (stageHeight - charHeight) / 2;
            character.style.left = `${centerX}px`;
            character.style.top = `${centerY}px`;
        }
    }
    
    // מניעת ברירת המחדל של גרירה מובנית בדפדפן עבור הדמות בלבד
    character.ondragstart = function(event) {
        // בדיקה אם האירוע הוא על הדמות עצמה ולא על אלמנט אחר
        if (event.target === character) {
            event.preventDefault();
            return false;
        }
        // אחרת נאפשר לאירוע להמשיך כרגיל עבור אלמנטים אחרים (כמו לבני התכנות)
    };
    
    character.addEventListener('mousedown', (event) => {
        // בדיקה שהלחיצה היא על הדמות עצמה ולא על אלמנט אחר
        if (event.target !== character) return;
        
        event.preventDefault();
        
        isDragging = true;
        
        // נשמור את המיקום ההתחלתי של העכבר
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        
        // בדיקה אם הדמות ממורכזת עם transform
        const computedStyle = window.getComputedStyle(character);
        if (computedStyle.transform && computedStyle.transform !== 'none') {
            // יש transform - נשתמש במיקום אחוז
            const rect = character.getBoundingClientRect();
            const stageRect = stage.getBoundingClientRect();
            
            initialLeft = rect.left - stageRect.left;
            initialTop = rect.top - stageRect.top;
            
            // הסרת ה-transform לפני הגרירה
            character.style.transform = 'none';
            character.style.left = initialLeft + 'px';
            character.style.top = initialTop + 'px';
        } else {
            // אין transform - נשתמש במיקום רגיל
            initialLeft = parseInt(character.style.left) || 0;
            initialTop = parseInt(character.style.top) || 0;
        }
        
        character.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        
        // חישוב ההפרש בין המיקום הנוכחי למיקום ההתחלתי של העכבר
        const deltaX = event.clientX - dragStartX;
        const deltaY = event.clientY - dragStartY;
        
        // מדידת גודל הבמה והדמות
        const stageWidth = stage.offsetWidth;
        const stageHeight = stage.offsetHeight;
        const characterWidth = character.offsetWidth;
        const characterHeight = character.offsetHeight;
        
        // חישוב המיקום החדש
        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;
        
        // הגבלה לגבולות הבמה
        const maxLeft = stageWidth - characterWidth;
        const maxTop = stageHeight - characterHeight;
        
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        
        // עדכון מיקום
        character.style.left = newLeft + 'px';
        character.style.top = newTop + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        
        isDragging = false;
        character.style.cursor = 'grab';
    });
    
    // מרכוז הדמות בעת טעינת הדף
    // setTimeout מאפשר למידות להתייצב
    setTimeout(centerCharacter, 200);
}
