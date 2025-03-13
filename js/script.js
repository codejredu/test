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

let draggedBlock = null; // גוש נגרר עכשוי
let isDragging = false;

// ========================================================================
//  יצירת HTML לבני התכנות
// ========================================================================

function createBlockElement(block, category) {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.style.backgroundColor = block.color;
    blockElement.textContent = block.icon;
    blockElement.dataset.type = block.type;
    blockElement.draggable = true;

    // טיפול באירוע התחלת גרירה (dragstart) - חשוב מאוד!
    blockElement.addEventListener("dragstart", function(event) {
        draggedBlock = this; // הבלוק שנגרר עכשיו
        blockElement.classList.add("dragging"); // הוספת אפקט ויזואלי
        event.dataTransfer.setData("text/plain", JSON.stringify({ type: block.type, icon: block.icon, color: block.color, source: "blockPalette" })); // הוספת מקור
        event.dataTransfer.effectAllowed = "move";
    });

    blockElement.addEventListener("dragend", () => {
        blockElement.classList.remove("dragging"); // הסרת האפקט הויזואלי
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
//  אזור הקוד
// ========================================================================
const programBlocks = document.getElementById("program-blocks");

programBlocks.addEventListener("dragover", function(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
});

programBlocks.addEventListener("drop", function(event) {
    event.preventDefault();

    const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    const blockType = data.type;
    const blockIcon = data.icon;
    const blockColor = data.color;
    const source = data.source;

    const offsetX = event.clientX - programBlocks.offsetLeft;
    const offsetY = event.clientY - programBlocks.offsetTop;

    if (draggedBlock) {
        draggedBlock.style.left = `${offsetX}px`;
        draggedBlock.style.top = `${offsetY}px`;
        draggedBlock.classList.remove("dragging");
        draggedBlock = null;
    } else {
        const newBlock = document.createElement("div");
        newBlock.classList.add("block");
        newBlock.style.backgroundColor = blockColor;
        newBlock.textContent = blockIcon;
        newBlock.dataset.type = blockType;
        newBlock.draggable = true;
         newBlock.style.position = "absolute";
    newBlock.style.left = `${offsetX}px`;
    newBlock.style.top = `${offsetY}px`;

        newBlock.addEventListener("dragstart", function(event) {
            draggedBlock = this;
            event.dataTransfer.setData("text/plain", JSON.stringify({ type: blockType, icon: blockIcon, color: blockColor, source: "programmingArea" }));
            event.dataTransfer.effectAllowed = "move";
        });
         programBlocks.appendChild(newBlock);
    }

});

const categoryTabs = document.querySelectorAll(".category-tab");
const blockCategories = document.querySelectorAll(".block-category");

categoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        blockCategories.forEach(c => c.classList.remove("active"));
       
        categoryTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const category = tab.dataset.category;
        document.getElementById(`${category}-blocks`).classList.add("active");
        populateBlockPalette(category);
    });
});
