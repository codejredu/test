// ========================================================================
//  הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "🚩 התחל בלחיצה על דגל ירוק",
            color: "yellow",
            type: "startOnGreenFlag",
            icon: "flag.png", // נניח שיש לך אייקון לדגל
        },
        {
            name: "👆 התחל בלחיצה על דמות",
            color: "yellow",
            type: "startOnTap",
            icon: "tap.png",
        },
        {
            name: "💥 התנגשות",
            color: "yellow",
            type: "startOnBump",
            icon: "bump.png",
        },
        {
            name: "✉️ שלח הודעה",
            color: "yellow",
            type: "sendMessage",
            icon: "message.png",
        },
        {
            name: "📩 קבל הודעה",
            color: "yellow",
            type: "startOnMessage",
            icon: "receive_message.png",
        },
    ],
    motion: [
        {
            name: "➡️ זוז ימינה",
            color: "blue",
            type: "moveRight",
            icon: "right.png",
        },
        {
            name: "⬅️ זוז שמאלה",
            color: "blue",
            type: "moveLeft",
            icon: "left.png",
        },
        {
            name: "⬆️ זוז למעלה",
            color: "blue",
            type: "moveUp",
            icon: "up.png",
        },
        {
            name: "⬇️ זוז למטה",
            color: "blue",
            type: "moveDown",
            icon: "down.png",
        },
        {
            name: "↩️ סובב ימינה",
            color: "blue",
            type: "turnRight",
            icon: "turn_right.png",
        },
        {
            name: "↪️ סובב שמאלה",
            color: "blue",
            type: "turnLeft",
            icon: "turn_left.png",
        },
        {
            name: "🤸 קפוץ",
            color: "blue",
            type: "hop",
            icon: "hop.png",
        },
        {
            name: "🏠 חזור הביתה",
            color: "blue",
            type: "goHome",
            icon: "home.png",
        },
    ],
    looks: [
        {
            name: "💬 אמור",
            color: "purple",
            type: "say",
            icon: "say.png",
        },
        {
            name: "📈 הגדל",
            color: "purple",
            type: "grow",
            icon: "grow.png",
        },
        {
            name: "📉 הקטן",
            color: "purple",
            type: "shrink",
            icon: "shrink.png",
        },
        {
            name: "🔄 אפס גודל",
            color: "purple",
            type: "resetSize",
            icon: "reset_size.png",
        },
        {
            name: "🙈 הסתר",
            color: "purple",
            type: "hide",
            icon: "hide.png",
        },
        {
            name: "👁️ הצג",
            color: "purple",
            type: "show",
            icon: "show.png",
        },
    ],
    sound: [
        {
            name: "🎵 צליל פופ",
            color: "green",
            type: "popSound",
            icon: "pop.png",
        },
        {
            name: "🎤 הקלטת קול",
            color: "green",
            type: "playRecordedSound",
            icon: "record.png",
        },
    ],
    control: [
        {
            name: "⏱️ המתן",
            color: "orange",
            type: "wait",
            icon: "wait.png",
        },
        {
            name: "⚡ שנה מהירות",
            color: "orange",
            type: "setSpeed",
            icon: "speed.png",
        },
        {
            name: "🔁 חזור",
            color: "orange",
            type: "repeat",
            icon: "repeat.png",
        },
        {
            name: "♾️ חזור לנצח",
            color: "orange",
            type: "repeatForever",
            icon: "repeat_forever.png",
        },
        {
            name: "🚪 עבור לעמוד",
            color: "orange",
            type: "goToPage",
            icon: "page.png",
        },
    ],
    end: [
        {
            name: "🛑 עצור",
            color: "red",
            type: "stop",
            icon: "stop.png",
        },
        {
            name: "🏁 סוף",
            color: "red",
            type: "end",
            icon: "end.png",
        },
    ],
};

// פונקציה ליצירת HTML עבור בלוק
function createBlockElement(block, category) {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.style.backgroundColor = block.color;
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
