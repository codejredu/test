// ========================================================================
//  הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "התחל בלחיצה על דגל ירוק",
            color: "yellow",
            type: "startOnGreenFlag",
            icon: "🚩", // דגל
        },
        {
            name: "התחל בלחיצה על דמות",
            color: "yellow",
            type: "startOnTap",
            icon: "👆", // יד מצביעה
        },
        {
            name: "התנגשות",
            color: "yellow",
            type: "startOnBump",
            icon: "💥", // התנגשות
        },
        {
            name: "שלח הודעה",
            color: "yellow",
            type: "sendMessage",
            icon: "✉️", // מעטפה
        },
        {
            name: "קבל הודעה",
            color: "yellow",
            type: "startOnMessage",
            icon: "📩", // מעטפה נכנסת
        },
    ],
    motion: [
        {
            name: "זוז ימינה",
            color: "blue",
            type: "moveRight",
            icon: "➡️", // חץ ימינה
        },
        {
            name: "זוז שמאלה",
            color: "blue",
            type: "moveLeft",
            icon: "⬅️", // חץ שמאלה
        },
        {
            name: "זוז למעלה",
            color: "blue",
            type: "moveUp",
            icon: "⬆️", // חץ למעלה
        },
        {
            name: "זוז למטה",
            color: "blue",
            type: "moveDown",
            icon: "⬇️", // חץ למטה
        },
        {
            name: "סובב ימינה",
            color: "blue",
            type: "turnRight",
            icon: "↩️", // חץ מסתובב ימינה
        },
        {
            name: "סובב שמאלה",
            color: "blue",
            type: "turnLeft",
            icon: "↪️", // חץ מסתובב שמאלה
        },
        {
            name: "קפוץ",
            color: "blue",
            type: "hop",
            icon: "🤸", // אקרובט
        },
        {
            name: "חזור הביתה",
            color: "blue",
            type: "goHome",
            icon: "🏠", // בית
        },
    ],
    looks: [
        {
            name: "אמור",
            color: "purple",
            type: "say",
            icon: "💬", // בועת דיבור
        },
        {
            name: "הגדל",
            color: "purple",
            type: "grow",
            icon: "📈", // גרף עולה
        },
        {
            name: "הקטן",
            color: "purple",
            type: "shrink",
            icon: "📉", // גרף יורד
        },
        {
            name: "אפס גודל",
            color: "purple",
            type: "resetSize",
            icon: "🔄", // חצים מסתובבים
        },
        {
            name: "הסתר",
            color: "purple",
            type: "hide",
            icon: "🙈", // קוף מסתיר עיניים
        },
        {
            name: "הצג",
            color: "purple",
            type: "show",
            icon: "👁️", // עין
        },
    ],
    sound: [
        {
            name: "צליל פופ",
            color: "green",
            type: "popSound",
            icon: "🎵", // תו מוזיקלי
        },
        {
            name: "הקלטת קול",
            color: "green",
            type: "playRecordedSound",
            icon: "🎤", // מיקרופון
        },
    ],
    control: [
        {
            name: "המתן",
            color: "orange",
            type: "wait",
            icon: "⏱️", // שעון עצר
        },
        {
            name: "שנה מהירות",
            color: "orange",
            type: "setSpeed",
            icon: "⚡", // ברק
        },
        {
            name: "חזור",
            color: "orange",
            type: "repeat",
            icon: "🔁", // חזור
        },
        {
            name: "חזור לנצח",
            color: "orange",
            type: "repeatForever",
            icon: "♾️", // אינסוף
        },
        {
            name: "עבור לעמוד",
            color: "orange",
            type: "goToPage",
            icon: "🚪", // דלת
        },
    ],
    end: [
        {
            name: "עצור",
            color: "red",
            type: "stop",
            icon: "🛑", // עיגול עצור
        },
        {
            name: "סוף",
            color: "red",
            type: "end",
            icon: "🏁", // דגל סיום
        },
    ],
};

// פונקציה ליצירת HTML עבור בלוק
function createBlockElement(block, category) {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.style.backgroundColor = block.color;
   // הוספת אייקון
   blockElement.textContent = block.icon;
    //blockElement.textContent = block.name; // הסרת הכתובית
    blockElement.dataset.type = block.type; // שמור את סוג הבלוק כ-data attribute
    blockElement.draggable = true; // הופך את הבלוק לניתן לגרירה

    // טיפול באירוע התחלת גרירה (dragstart) - חשוב מאוד!
    blockElement.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", JSON.stringify({ type: block.type, category: category })); // העברת מידע על הבלוק
        event.dataTransfer.effectAllowed = "move"; // מציין שהפעולה היא העברה (move)
    });

    return blockElement;
}

// הוספת הבלוקים ללוח הלבנים
function populateBlockPalette() {
    for (const category in blocks) {
        const categoryDiv = document.getElementById(`${category}-blocks`);
        if (categoryDiv) {
            blocks[category].forEach(block => {
                const blockElement = createBlockElement(block, category);
                categoryDiv.appendChild(blockElement);
            });
        }
    }
}

populateBlockPalette(); // הפעלת הפונקציה ליצירת הבלוקים

// ========================================================================
//  לוגיקת גרירה ושחרור (Drag and Drop)
// ========================================================================

const programmingArea = document.getElementById("program-blocks");
const blockPalette = document.getElementById("block-palette");
// טיפול באירוע גרירה מעל אזור התכנות (dragover)
programmingArea.addEventListener("dragover", (event) => {
    event.preventDefault(); // מונע התנהגות ברירת מחדל
    event.dataTransfer.dropEffect = "move"; // מציין שהפעולה היא העברה (move)
});

// טיפול באירוע שחרור באזור התכנות (drop)
programmingArea.addEventListener("drop", (event) => {
    event.preventDefault(); // מונע התנהגות ברירת מחדל

    const data = JSON.parse(event.dataTransfer.getData("text/plain")); // קבלת המידע על הבלוק
    const blockType = data.type;
    const blockCategory = data.category;

    // יצירת אלמנט בלוק חדש (שיבוט)
    const newBlock = document.createElement("div");
    newBlock.classList.add("block");
    newBlock.style.backgroundColor = blocks[blockCategory].find(b => b.type === blockType).color; // מציאת הצבע הנכון
    //newBlock.textContent = blocks[blockCategory].find(b => b.type === blockType).name; // מציאת השם הנכון
    newBlock.dataset.type = blockType;
    newBlock.draggable = false; //העתק לא ניתן לגרירה

    // הוספת הבלוק החדש לאזור התכנות
    programmingArea.appendChild(newBlock);
});

const categoryTabs = document.querySelectorAll(".category-tab");
const blockCategories = document.querySelectorAll(".block-category");

categoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        // הסרת ה-active מכל הטאבים והקטגוריות
        categoryTabs.forEach(t => t.classList.remove("active"));
        blockCategories.forEach(c => c.classList.remove("active"));

        // הוספת ה-active לטאב שנלחץ ולקטגוריה המתאימה
        tab.classList.add("active");
        const category = tab.dataset.category;
        document.getElementById(`${category}-blocks`).classList.add("active");
    });
});
