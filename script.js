// הגדרת מידע על הבלוקים השונים - עודכנו האייקונים והתיאורים
const blockDefinitions = {
    trigger: [
        { id: 'start-green-flag', name: 'התחל עם דגל ירוק', icon: '🏁', description: 'התחל את הסקריפט כשלוחצים על הדגל הירוק' },
        { id: 'start-tap', name: 'התחל בלחיצה', icon: '👆', description: 'התחל את הסקריפט כשלוחצים על הדמות' },
        { id: 'start-on-bump', name: 'התחל בהתנגשות', icon: '💥', description: 'התחל את הסקריפט כשהדמות מתנגשת בדמות אחרת' },
        { id: 'send-message', name: 'שלח הודעה', icon: '📤', description: 'שלח הודעה בצבע מסוים', value: 'red' },
        { id: 'start-on-message', name: 'התחל עם הודעה', icon: '📨', description: 'התחל את הסקריפט כשמתקבלת הודעה בצבע מסוים', value: 'red' }
    ],
    motion: [
        { id: 'move-right', name: 'זוז ימינה', icon: '➡️', description: 'זוז מספר צעדים ימינה', value: 1 },
        { id: 'move-left', name: 'זוז שמאלה', icon: '⬅️', description: 'זוז מספר צעדים שמאלה', value: 1 },
        { id: 'move-up', name: 'זוז למעלה', icon: '⬆️', description: 'זוז מספר צעדים למעלה', value: 1 },
        { id: 'move-down', name: 'זוז למטה', icon: '⬇️', description: 'זוז מספר צעדים למטה', value: 1 },
        { id: 'turn-right', name: 'פנה ימינה', icon: '↩️', description: 'פנה ימינה במספר צעדים', value: 1 },
        { id: 'turn-left', name: 'פנה שמאלה', icon: '↪️', description: 'פנה שמאלה במספר צעדים', value: 1 },
        { id: 'hop', name: 'קפוץ', icon: '⤴️', description: 'קפוץ במקום' },
        { id: 'go-home', name: 'חזור הביתה', icon: '🏠', description: 'חזור למיקום ההתחלתי' }
    ],
    looks: [
        { id: 'say', name: 'אמור', icon: '💬', description: 'הצג בועת דיבור עם טקסט', value: 'שלום!' },
        { id: 'grow', name: 'גדל', icon: '🔍+', description: 'הגדל את הדמות' },
        { id: 'shrink', name: 'הקטן', icon: '🔍-', description: 'הקטן את הדמות' },
        { id: 'reset-size', name: 'אפס גודל', icon: '🔍=', description: 'החזר את הדמות לגודל המקורי' },
        { id: 'hide', name: 'הסתר', icon: '👻', description: 'הסתר את הדמות' },
        { id: 'show', name: 'הצג', icon: '👁️', description: 'הצג את הדמות אם היא מוסתרת' }
    ],
    sound: [
        { id: 'play-pop', name: 'השמע פופ', icon: '🔊', description: 'השמע צליל פופ' },
        { id: 'play-recorded', name: 'השמע הקלטה', icon: '🎵', description: 'השמע צליל מוקלט' },
        { id: 'play-note', name: 'נגן תו', icon: '🎼', description: 'נגן תו מוזיקלי', value: 'do' },
        { id: 'stop-sounds', name: 'עצור צלילים', icon: '🔇', description: 'עצור את כל הצלילים' }
    ],
    control: [
        { id: 'wait', name: 'המתן', icon: '⏱️', description: 'המתן מספר שניות', value: 1 },
        { id: 'set-speed', name: 'קבע מהירות', icon: '⚡', description: 'קבע את מהירות הריצה', value: 'normal' },
        { id: 'repeat', name: 'חזור', icon: '🔄', description: 'חזור על הבלוקים שבתוך הלולאה מספר פעמים', value: 2 },
        { id: 'repeat-forever', name: 'חזור לנצח', icon: '♾️', description: 'חזור על הבלוקים שבתוך הלולאה ללא הגבלה' },
        { id: 'go-to-page', name: 'עבור לעמוד', icon: '📄', description: 'עבור לעמוד אחר בפרויקט', value: 1 }
    ],
    end: [
        { id: 'stop', name: 'עצור', icon: '🛑', description: 'עצור את ריצת כל הסקריפטים' },
        { id: 'end', name: 'סיים', icon: '🏁', description: 'סיים את ריצת הסקריפט הנוכחי' }
    ]
};

// משתנים גלובליים למערכת
let currentCategory = 'trigger';
let currentPage = 1;
let scripts = {}; // מילון שמכיל את הסקריפטים לפי דמות
let isRunning = false;
let activeCharacter = 'character1';
let draggedBlock = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let blockIdCounter = 1;
let charactersData = {}; // נתונים על הדמויות במערכת
let runningScripts = []; // סקריפטים שרצים כרגע
let executionSpeed = 'normal'; // מהירות ריצה: slow, normal, fast
let soundEffects = {
    pop: new Audio('data:audio/wav;base64,UklGRrwIAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YZgIAACBhYqFbF1fdJOnqnlpZHWOkaGqlX9yY15kiJacmIV0aWRgYG6Ij5uooYt2aGBid4iXm5uYhHBlYmh1hI+ZoJ+ajnttZGFlcX+JkJSZmZePhnx1cHJ3gIWLkZWWlZGMhn96eHp9goaLjpKTkY+LiIN/fHx9f4GFh4qMjIuKiIaEgYB/f4CBg4WGh4eGhYSCgYB/f3+AgICBgYGBgICAgH9/f39/f4CAgICAgICAf39/f39/f3+AgICAgICAgIB/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f4B/gH+AgIB/f39/f39/f3+AgICAgICAgIB/f39/f39/f4CAgICAgICAgIB/f39/f3+AgICAgICAgICAgH9/f39/f4CAgICAgICAgICAf39/f39/gICAgICAgICAgIB/f39/f3+AgICAgICAgICAgH9/f39/f4CAgICAgICAgICAf39/f39/gICAgICAgICAgIB/f39/f3+AgICAgICAgICAgIB/f4CAgICAgIB/gICAgICBgICAgH9/gICBgoOEgX9+gIODhIN/goaEgH+AhIaHhIB+fX1+gYKDg4KAf3+AgoSGh4eDgH58e3p7fH1+f4GDhYeHh4WDgX99e3p6e3x+gIKEhoiIiIeGhIF/fXt7e3t9f4GDhYeJiYmIhoWCgH58e3t8fX+Bg4aIiYmJiIeGg4F/fXx7fH1/gYOFh4iIiIiHhYSCgH59fHx9f4GDhYeIiIiHhoWEgoB+fXx8fX+Bg4WGh4iHh4aFg4KAfn18fH1/gIKEhoaHh4eGhYOCgX9+fX19fn+Bg4SFhoaGhoWEg4GAfn19fX5/gIKDhIWFhYWEg4KBgH9+fX1+f4CBgoOEhISEg4OCgYB/fn5+fn+AgYKDg4SEhIOCgoGAf35+fn5/gIGCgoODg4OCgYGAf39+fn5/gIGBgoKDg4OCgoGBgH9/fn5/f4CBgYKCgoKCgoGBgH9/f39/f4CAgYGBgoKCgoGBgIB/f39/f4CAgYGBgYGBgYGAgIB/f39/f4CAgICBgYGBgYCAgIB/f39/f4CAgICAgYGBgYCAgIB/f39/f4CAgICAgICBgICAgH9/f39/f4CAgICAgICAgICAgH9/f39/f4CAgICAgICAgICAgIB/f39/f4CAgICAgICAgICAgIB/f39/f4CAgICAgICAgICAgIB/f39/f4CAgICAgICAgICAgIB/f39/f4CAgICAgICAgICAgIB/f39/f4CAgICAgICAgICAgIB/f39/f4CAgICAgICAgICAgIB/f39/f3+AgICAgICAgICAgIB/f39/f3+AgICAgICAgICAgIB/f39/f3+AgICAgICAgICAgIB/f39/f3+AgICAgICAgICAgIB/f39/f3+AgICAgICAgICAgIB/f39/f3+AgICAgICAgICAgH9/f39/f3+AgICAgICAgICAgH9/f39/f3+AgICAgICAgICAgH9/f39/f3+AgICAgICAgICAgH9/f39/f3+AgICAgICAgICAgH9/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f3+AgICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/gICAgICAgICAf39/f39/f39/f4CAgICAgICAf39/f39/f39/f4CAgICAgICAf39/f39/f39/f4CAgICAgICAf39/f39/f39/f4CAgICAgICAf39/f39/f39/f4CAgICAgICAf39/f39/f39/f4CAgICAgICAf39/f39/f39/f4CAgICAgICAf39/f39/f39/f4CAgICAgICAf39/f39/f39/f4CAgICAgICAf39/f39/f39/f4CA'),
    note: new Audio('data:audio/wav;base64,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')
};

// אתחול המערכת
document.addEventListener('DOMContentLoaded', function() {
    // אתחול מערכת הדמויות
    initializeCharacters();
    
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
    
    // הוספת אירועים לדמויות בשלב
    setupCharacterEvents();
    
    // יצירת אזור התכנות לגרירת בלוקים
    setupProgrammingArea();
});

// אתחול נתוני הדמויות
function initializeCharacters() {
    // הגדרת דמות ברירת המחדל
    charactersData['character1'] = {
        id: 'character1',
        x: 160,
        y: 160,
        initialX: 160,
        initialY: 160,
        width: 80,
        height: 80,
        rotation: 0,
        scale: 1,
        visible: true,
        type: 'default'
    };
    
    // אתחול אוסף הסקריפטים לכל דמות
    scripts['character1'] = [];
}

// הגדרת אירועים לדמויות בשלב
function setupCharacterEvents() {
    document.querySelectorAll('.character').forEach(character => {
        // אירוע לחיצה על דמות
        character.addEventListener('click', function(e) {
            if (!isRunning) {
                // הפעלה של כל הסקריפטים שמגיבים ללחיצה על דמות
                activateCharacter(this.id);
                e.stopPropagation();
            } else {
                // הפעלה של סקריפטים שמופעלים בלחיצה על דמות
                runScriptsWithTrigger('start-tap', this.id);
                e.stopPropagation();
            }
        });
        
        // אירוע לגרירת דמות (רק למצב עריכה)
        character.addEventListener('mousedown', function(e) {
            if (!isRunning) {
                const charId = this.id;
                activateCharacter(charId);
                
                // חישוב נקודת ההתחלה של הגרירה
                const startX = e.clientX;
                const startY = e.clientY;
                const charRect = this.getBoundingClientRect();
                const offsetX = startX - charRect.left;
                const offsetY = startY - charRect.top;
                
                // פונקציה להזזת הדמות
                const moveCharacter = function(e) {
                    const x = e.clientX - offsetX;
                    const y = e.clientY - offsetY;
                    const stageRect = document.getElementById('stage').getBoundingClientRect();
                    
                    // חישוב המיקום בתוך השלב
                    const relativeX = x - stageRect.left;
                    const relativeY = y - stageRect.top;
                    
                    // עדכון מיקום הדמות
                    if (relativeX >= 0 && relativeX <= stageRect.width - charRect.width &&
                        relativeY >= 0 && relativeY <= stageRect.height - charRect.height) {
                        document.getElementById(charId).style.left = relativeX + 'px';
                        document.getElementById(charId).style.top = relativeY + 'px';
                        
                        // עדכון נתוני הדמות
                        charactersData[charId].x = relativeX;
                        charactersData[charId].y = relativeY;
                    }
                };
                
                // פונקציה לסיום הגרירה
                const stopMoving = function() {
                    document.removeEventListener('mousemove', moveCharacter);
                    document.removeEventListener('mouseup', stopMoving);
                };
                
                // הוספת מאזיני אירועים זמניים
                document.addEventListener('mousemove', moveCharacter);
                document.addEventListener('mouseup', stopMoving);
                
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });
    
    // הוספת אירוע לחיצה על השלב
    document.getElementById('stage').addEventListener('click', function() {
        // בדיקת התנגשויות בין דמויות
        if (isRunning) {
            checkCollisions();
        }
    });
}

// הגדרת אזור התכנות לגרירת בלוקים
function setupProgrammingArea() {
    const programmingArea = document.getElementById('programming-area');
    
    // הוספת אירועים לגרירת בלוקים
    programmingArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    programmingArea.addEventListener('drop', function(e) {
        e.preventDefault();
        const blockType = e.dataTransfer.getData('text/plain');
        
        // יצירת בלוק חדש
        if (blockType) {
            createNewScript(blockType, e.clientX, e.clientY);
        }
    });
}

// פונקציה ליצירת סקריפט חדש בהתאם לסוג הבלוק
function createNewScript(blockType, clientX, clientY) {
    // מצא את הגדרת הבלוק
    let blockDef = null;
    let category = null;
    
    // חיפוש הבלוק בכל הקטגוריות
    for (const cat in blockDefinitions) {
        const found = blockDefinitions[cat].find(block => block.id === blockType);
        if (found) {
            blockDef = found;
            category = cat
