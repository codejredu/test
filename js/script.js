// ========================================================================
//  הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "🚩",
            color: "yellow",
            type: "startOnGreenFlag",
        },
        {
            name: "👆",
            color: "yellow",
            type: "startOnTap",
        },
        {
            name: "💥",
            color: "yellow",
            type: "startOnBump",
        },
        {
            name: "✉️",
            color: "yellow",
            type: "sendMessage",
        },
        {
            name: "📩",
            color: "yellow",
            type: "startOnMessage",
        },
    ],
    motion: [
        {
            name: "➡️",
            color: "blue",
            type: "moveRight",
        },
        {
            name: "⬅️",
            color: "blue",
            type: "moveLeft",
        },
        {
            name: "⬆️",
            color: "blue",
            type: "moveUp",
        },
        {
            name: "⬇️",
            color: "blue",
            type: "moveDown",
        },
        {
            name: "↩️",
            color: "blue",
            type: "turnRight",
        },
        {
            name: "↪️",
            color: "blue",
            type: "turnLeft",
        },
        {
            name: "🤸",
            color: "blue",
            type: "hop",
        },
        {
            name: "🏠",
            color: "blue",
            type: "goHome",
        },
    ],
    looks: [
        {
            name: "💬",
            color: "purple",
            type: "say",
        },
        {
            name: "📈",
            color: "purple",
            type: "grow",
        },
        {
            name: "📉",
            color: "purple",
            type: "shrink",
        },
        {
            name: "🔄",
            color: "purple",
            type: "resetSize",
        },
        {
            name: "🙈",
            color: "purple",
            type: "hide",
        },
        {
            name: "👁️",
            color: "purple",
            type: "show",
        },
    ],
    sound: [
        {
            name: "🎵",
            color: "green",
            type: "popSound",
        },
        {
            name: "🎤",
            color: "green",
            type: "playRecordedSound",
        },
    ],
    control: [
        {
            name: "⏱️",
            color: "orange",
            type: "wait",
        },
        {
            name: "⚡",
            color: "orange",
            type: "setSpeed",
        },
        {
            name: "🔁",
            color: "orange",
            type: "repeat",
        },
        {
            name: "♾️",
            color: "orange",
            type: "repeatForever",
        },
        {
            name: "🚪",
            color: "orange",
            type: "goToPage",
        },
    ],
    end: [
        {
            name: "🛑",
            color: "red",
            type: "stop",
        },
        {
            name: "🏁",
            color: "red",
            type: "end",
        },
    ],
};

// פונקציה ליצירת HTML עבור בלוק
function createBlockElement(block, category) {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.style.backgroundColor = block.color;
    blockElement.textContent = block.name;

    // הוספת אייקון
    blockElement.textContent = block.icon;
    blockElement.dataset.type = block.type;
    blockElement.draggable = true;

    // טיפול באירוע התחלת גרירה (dragstart) - חשוב מאוד!
    blockElement.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", JSON.stringify({ type: block.type, category }));
        event.dataTransfer.effectAllowed = "move";
    });

    return blockElement;
}

// הוספת הבלוקים ללוח הלבנים
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    categoryDiv.innerHTML = ""; // ניקוי הבלוקים הקיימים
    blocks[category].forEach(block => {
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}

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
        blockCategories.forEach(otherCategory => {
        if (otherCategory.id !== `${category}-blocks`) {
            otherCategory.classList.remove('active');
        }
    });
       populateBlockPalette(category)
    });
});
