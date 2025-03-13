// ========================================================================
//  הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "🚩",
            color: "yellow",
            type: "startOnGreenFlag",
            icon: "🚩",
        },
        {
            name: "👆",
            color: "yellow",
            type: "startOnTap",
            icon: "👆",
        },
        {
            name: "💥",
            color: "yellow",
            type: "startOnBump",
            icon: "💥",
        },
        {
            name: "✉️",
            color: "yellow",
            type: "sendMessage",
            icon: "✉️",
        },
        {
            name: "📩",
            color: "yellow",
            type: "startOnMessage",
            icon: "📩",
        },
    ],
    motion: [
        {
            name: "➡️",
            color: "blue",
            type: "moveRight",
            icon: "➡️",
        },
        {
            name: "⬅️",
            color: "blue",
            type: "moveLeft",
            icon: "⬅️",
        },
        {
            name: "⬆️",
            color: "blue",
            type: "moveUp",
            icon: "⬆️",
        },
        {
            name: "⬇️",
            color: "blue",
            type: "moveDown",
            icon: "⬇️",
        },
        {
            name: "↩️",
            color: "blue",
            type: "turnRight",
            icon: "↩️",
        },
        {
            name: "↪️",
            color: "blue",
            type: "turnLeft",
            icon: "↪️",
        },
        {
            name: "🤸",
            color: "blue",
            type: "hop",
            icon: "🤸",
        },
        {
            name: "🏠",
            color: "blue",
            type: "goHome",
            icon: "🏠",
        },
    ],
    looks: [
        {
            name: "💬",
            color: "purple",
            type: "say",
            icon: "👁️",
        },
        {
            name: "📈",
            color: "purple",
            type: "grow",
            icon: "🙈",
        },
        {
            name: "📉",
            color: "purple",
            type: "shrink",
            icon: "🔄",
        },
        {
            name: "🔄",
            color: "purple",
            type: "resetSize",
            icon: "📈",
        },
        {
            name: "🙈",
            color: "purple",
            type: "hide",
            icon: "📉",
        },
        {
            name: "👁️",
            color: "purple",
            type: "show",
            icon: "💬",
        },
    ],
    sound: [
        {
            name: "🎵",
            color: "green",
            type: "popSound",
            icon: "🎵",
        },
        {
            name: "🎤",
            color: "green",
            type: "playRecordedSound",
            icon: "🎤",
        },
    ],
    control: [
        {
            name: "⏱️",
            color: "orange",
            type: "wait",
            icon: "⏱️",
        },
        {
            name: "⚡",
            color: "orange",
            type: "setSpeed",
            icon: "⚡",
        },
        {
            name: "🔁",
            type: "repeat",
            icon: "🔁",
            color: "orange"
        },
        {
            name: "♾️",
            type: "repeatForever",
            icon: "♾️",
            color: "orange"
        },
        {
            name: "🚪",
            color: "orange",
            type: "goToPage",
            icon: "🚪",
        },
    ],
    end: [
        {
            name: "🛑",
            color: "red",
            type: "stop",
            icon: "🛑",
        },
        {
            name: "🏁",
            color: "red",
            type: "end",
            icon: "🏁",
        },
    ],
};

// פונקציה ליצירת HTML עבור בלוק
function createBlockElement(block, category) {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.style.backgroundColor = block.color;
    blockElement.textContent = block.icon;
    blockElement.dataset.type = block.type;
    blockElement.draggable = true;

    // יצירת השקע
    const socketElement = document.createElement("div");
    socketElement.classList.add("socket");
    blockElement.appendChild(socketElement);

    // טיפול באירוע התחלת גרירה (dragstart) - חשוב מאוד!
    blockElement.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", JSON.stringify({
            type: block.type,
            icon: block.icon,
            color: block.color,
            category: category // הוספת קטגוריה לנתונים
        }));
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
    const blockIcon = data.icon; //קבלת האייקון
    const blockColor = data.color;//קבלת הצבע

    // יצירת אלמנט בלוק חדש (שיבוט)
    const newBlock = document.createElement("div");
    newBlock.classList.add("block");
    newBlock.style.backgroundColor = blockColor; // שימוש בצבע שהועבר
    newBlock.textContent = blockIcon; //הוספת האייקון
    newBlock.dataset.type = blockType;
    newBlock.draggable = false; //העתק לא ניתן לגרירה

    // הוספת הבלוק החדש לאזור התכנות
    programmingArea.appendChild(newBlock);

    // מיקום הבלוק החדש יחסי לאזור התכנות
    const rect = programmingArea.getBoundingClientRect();
    newBlock.style.position = "absolute";
    newBlock.style.left = `${event.clientX - rect.left}px`;
    newBlock.style.top = `${event.clientY - rect.top}px`;
});

const categoryTabs = document.querySelectorAll(".category-tab");
const blockCategories = document.querySelectorAll(".block-category");

categoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        blockCategories.forEach(function(element){
            element.classList.remove("active")
        })
        const category = tab.dataset.category;
        categoryTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`${category}-blocks`).classList.add("active");
        populateBlockPalette(category);
    });
});

// אתחול הלוח עם הקטגוריה הפעילה הראשונה
populateBlockPalette("triggering");
