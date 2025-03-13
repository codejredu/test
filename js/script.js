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
    // יצירת אלמנט container לבלוק
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container");

    // יצירת אלמנט scratch-block
    const scratchBlock = document.createElement("div");
    scratchBlock.classList.add("scratch-block");
    scratchBlock.textContent = block.icon; // הצגת הטקסט בתוך הבלוק
    scratchBlock.style.backgroundColor = block.color; //הצבע

    //יצירת אלמנט right-connector
    const rightConnector = document.createElement("div");
    rightConnector.classList.add("right-connector");
    rightConnector.style.backgroundColor = block.color;

    //יצירת אלמנט left-connector-wrapper
    const leftConnectorWrapper = document.createElement("div");
    leftConnectorWrapper.classList.add("left-connector-wrapper");

     //יצירת אלמנט left-connector
    const leftConnector = document.createElement("div");
    leftConnector.classList.add("left-connector");

    leftConnectorWrapper.appendChild(leftConnector);

    // הוספת הכל ל container
    blockContainer.appendChild(scratchBlock);
    blockContainer.appendChild(rightConnector);
    blockContainer.appendChild(leftConnectorWrapper);

    blockContainer.dataset.type = block.type;
    blockContainer.draggable = true;

    // טיפול באירוע התחלת גרירה (dragstart) - חשוב מאוד!
    blockContainer.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", JSON.stringify({
            type: block.type,
            icon: block.icon,
            color: block.color,
            category: category // הוספת קטגוריה לנתונים
        }));
        event.dataTransfer.effectAllowed = "move";
    });

    return blockContainer;
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
    newBlock.classList.add("block-container");

    const scratchBlock = document.createElement("div");
    scratchBlock.classList.add("scratch-block");
    scratchBlock.textContent = blockIcon; // הצגת הטקסט בתוך הבלוק
    scratchBlock.style.backgroundColor = blockColor; //הצבע

    //יצירת אלמנט right-connector
    const rightConnector = document.createElement("div");
    rightConnector.classList.add("right-connector");
    rightConnector.style.backgroundColor = blockColor;

    //יצירת אלמנט left-connector-wrapper
    const leftConnectorWrapper = document.createElement("div");
    leftConnectorWrapper.classList.add("left-connector-wrapper");

     //יצירת אלמנט left-connector
    const leftConnector = document.createElement("div");
    leftConnector.classList.add("left-connector");

    leftConnectorWrapper.appendChild(leftConnector);

    // הוספת הכל ל container
    newBlock.appendChild(scratchBlock);
    newBlock.appendChild(rightConnector);
    newBlock.appendChild(leftConnectorWrapper);
    newBlock.dataset.type = blockType;
    newBlock.draggable = false;

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

// הוספת כפתור קווי GRID
const gridToggle = document.getElementById("grid-toggle");
const stage = document.getElementById("stage");

gridToggle.addEventListener("click", () => {
    stage.classList.toggle("show-grid");
});
// ... קוד קודם (כולל הפונקציות ליצירת בלוקים וטיפול בגרירה ושחרור של בלוקים) ...

// ========================================================================
//  אפשור גרירה ושחרור של החתול - קוד מינימלי
// ========================================================================
const character = document.getElementById("character");
const stage = document.getElementById("stage");
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

character.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - character.offsetLeft;
    offsetY = e.clientY - character.offsetTop;
});

stage.addEventListener("mouseup", () => {
    isDragging = false;
});

stage.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const stageRect = stage.getBoundingClientRect();
    const charRect = character.getBoundingClientRect();

    let x = e.clientX - stageRect.left - offsetX;
    let y = e.clientY - stageRect.top - offsetY;

    // שמירה שהחתול לא יצא מגבולות הבמה
    x = Math.max(0, Math.min(x, stageRect.width - charRect.width));
    y = Math.max(0, Math.min(y, stageRect.height - charRect.height));

    character.style.left = `${x}px`;
    character.style.top = `${y}px`;
});

// אתחול הלוח עם הקטגוריה הפעילה הראשונה
populateBlockPalette("triggering");
