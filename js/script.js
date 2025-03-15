--- START OF FILE index.html ---
<!DOCTYPE html>
<html lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ScratchJr Web</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

<div class="container">
    <header>
        <div class="logo">ScratchJr</div>
        <div class="header-icons">
            <span class="icon">💾</span>
            <span class="icon">📄</span>
            <span class="icon">▶️</span>
            <span class="icon">➕</span>
            <span class="icon">ℹ️</span>
            <span class="icon" id="grid-toggle">GRID</span>
        </div>
    </header>

    <main>
        <div class="stage-container">
            <div id="stage">
                <img id="character" src="assets/images/CAT.svg" alt="Cat" draggable="true">
            </div>
        </div>
        <div class="palette-and-programming">
            <div id="block-palette">
                <div class="category-tabs">
                    <button class="category-tab" data-category="end">
                        <img src="assets/images/end.svg" alt="End">
                    </button>
                    <button class="category-tab" data-category="control">
                        <img src="assets/images/control.svg" alt="Control">
                    </button>
                    <button class="category-tab" data-category="sound">
                        <img src="assets/images/sound.svg" alt="Sound">
                    </button>
                    <button class="category-tab" data-category="looks">
                        <img src="assets/images/looks.svg" alt="Looks">
                    </button>
                    <button class="category-tab" data-category="motion">
                        <img src="assets/images/motion.svg" alt="Motion">
                    </button>
                    <button class="category-tab active" data-category="triggering">
                        <img src="assets/images/triggering.svg" alt="Triggers">
                    </button>
                </div>
                <div id="end-blocks" class="block-category" data-category="end"></div>
                <div id="control-blocks" class="block-category" data-category="control"></div>
                <div id="sound-blocks" class="block-category" data-category="sound"></div>
                <div id="looks-blocks" class="block-category" data-category="looks"></div>
                <div id="motion-blocks" class="block-category" data-category="motion"></div>
                <div id="triggering-blocks" class="block-category active" data-category="triggering"></div>
            </div>

            <div id="programming-area">
                <div class="program-header">Program <span id="clear-all">Clear All</span></div>
                <div id="program-blocks"></div>
            </div>
        </div>
    </main>
</div>

<script src="js/script.js"></script>
</body>
</html>
--- END OF FILE index.html ---

--- START OF FILE script.js ---
// ========================================================================
// הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        { name: "🚩", color: "yellow", type: "startOnGreenFlag", icon: "🚩" },
        { name: "👆", color: "yellow", type: "startOnTap", icon: "👆" },
        { name: "💥", color: "yellow", type: "startOnBump", icon: "💥" },
        { name: "✉️", color: "yellow", type: "sendMessage", icon: "✉️" },
        { name: "📩", color: "yellow", type: "startOnMessage", icon: "📩" },
    ],
    motion: [
        { name: "➡️", color: "blue", type: "moveRight", icon: "➡️" },
        { name: "⬅️", color: "blue", type: "moveLeft", icon: "⬅️" },
        { name: "⬆️", color: "blue", type: "moveUp", icon: "⬆️" },
        { name: "⬇️", color: "blue", type: "moveDown", icon: "⬇️" },
        { name: "↩️", color: "blue", type: "turnRight", icon: "↩️" },
        { name: "↪️", color: "blue", type: "turnLeft", icon: "↪️" },
        { name: "🤸", color: "blue", type: "hop", icon: "🤸" },
        { name: "🏠", color: "blue", type: "goHome", icon: "🏠" },
    ],
    looks: [
        { name: "💬", color: "purple", type: "say", icon: "👁️" },
        { name: "📈", color: "purple", type: "grow", icon: "🙈" },
        { name: "📉", color: "purple", type: "shrink", icon: "🔄" },
        { name: "🔄", color: "purple", type: "resetSize", icon: "📈" },
        { name: "🙈", color: "purple", type: "hide", icon: "📉" },
        { name: "👁️", color: "purple", type: "show", icon: "💬" },
    ],
    sound: [
        { name: "🎵", color: "green", type: "popSound", icon: "🎵" },
        { name: "🎤", color: "green", type: "playRecordedSound", icon: "🎤" },
    ],
    control: [
        { name: "⏱️", color: "orange", type: "wait", icon: "⏱️" },
        { name: "⚡", color: "orange", type: "setSpeed", icon: "⚡" },
        { name: "🔁", type: "repeat", icon: "🔁", color: "orange" },
        { name: "♾️", type: "repeatForever", icon: "♾️", color: "orange" },
        { name: "🚪", color: "orange", type: "goToPage", icon: "🚪" },
    ],
    end: [
        { name: "🛑", color: "red", type: "stop", icon: "🛑" },
        { name: "🏁", color: "red", type: "end", icon: "🏁" },
    ],
};

// ========================================================================
// פונקציות ליצירת אלמנטים
// ========================================================================

// פונקציה ליצירת מחבר ימני
function createRightConnector(color) {
    const rightConnector = document.createElement("div");
    rightConnector.classList.add("right-connector");
    rightConnector.style.backgroundColor = color;
    return rightConnector;
}

// פונקציה ליצירת מחבר שמאלי
function createLeftConnector() {
    const leftConnectorWrapper = document.createElement("div");
    leftConnectorWrapper.classList.add("left-connector-wrapper");

    const leftConnector = document.createElement("div");
    leftConnector.classList.add("left-connector");

    leftConnectorWrapper.appendChild(leftConnector);
    return leftConnectorWrapper;
}

// פונקציה ליצירת בלוק גרפי
function createScratchBlock(block) {
    const scratchBlock = document.createElement("div");
    scratchBlock.classList.add("scratch-block");
    scratchBlock.textContent = block.icon;
    scratchBlock.style.backgroundColor = block.color;
    return scratchBlock;
}

// פונקציה ליצירת HTML עבור בלוק
function createBlockElement(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container");

    const scratchBlock = createScratchBlock(block);
    const rightConnector = createRightConnector(block.color);
    const leftConnectorWrapper = createLeftConnector();

    blockContainer.appendChild(scratchBlock);
    blockContainer.appendChild(rightConnector);
    blockContainer.appendChild(leftConnectorWrapper);

    blockContainer.dataset.type = block.type;
    blockContainer.draggable = true;

    // טיפול באירוע התחלת גרירה (dragstart)
    blockContainer.addEventListener("dragstart", (event) => {
        handleDragStart(event, block, category);
    });

    return blockContainer;
}

// ========================================================================
// פונקציות טיפול באירועים
// ========================================================================

// פונקציה לטיפול בהתחלת גרירה
function handleDragStart(event, block, category) {
    const data = {
        type: block.type,
        icon: block.icon,
        color: block.color,
        category: category
    };
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
}

// פונקציה לטיפול בשחרור באזור התכנות
function handleDrop(event) {
    event.preventDefault();

    const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    const blockType = data.type;
    const blockCategory = data.category;
    const blockIcon = data.icon;
    const blockColor = data.color;

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
}

// ========================================================================
// פונקציות אתחול
// ========================================================================

// הוספת הבלוקים ללוח הלבנים
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    categoryDiv.innerHTML = "";

    blocks[category].forEach(block => {
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}

// פונקציה לטיפול בשינוי קטגוריה - **תיקון כאן!**
function handleCategoryChange(category, tabElement) {
    blockCategories.forEach(element => {
        element.classList.remove("active");
        element.style.display = "none"; // **הסתרת כל הקטגוריות**
    });
    categoryTabs.forEach(tab => tab.classList.remove("active"));

    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    tab.classList.add("active");
    const categoryBlocksElement = document.getElementById(`${category}-blocks`);
    categoryBlocksElement.classList.add("active");
    categoryBlocksElement.style.display = "flex"; // **הצגת הקטגוריה הנכונה**
    populateBlockPalette(category);

    // **קוד חדש למיקום אופקי - תיקון קריטי**
    const blockPaletteRect = document.getElementById('block-palette').getBoundingClientRect(); // Get blockPalette rect
    categoryBlocksElement.style.left = `${blockPaletteRect.left + 70}px`; // Position category to the right of the **palette**, offset by tab width
    categoryBlocksElement.style.top = `${categoryTabs[0].getBoundingClientRect().top}px`;   // Align category to the top of the **first tab**
}


// ========================================================================
//  לוגיקת גרירה ושחרור (Drag and Drop)
// ========================================================================

const programmingArea = document.getElementById("program-blocks");

// טיפול באירוע גרירה מעל אזור התכנות (dragover)
programmingArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
});

// טיפול באירוע שחרור באזור התכנות (drop)
programmingArea.addEventListener("drop", handleDrop);

const categoryTabs = document.querySelectorAll(".category-tab");
const blockCategories = document.querySelectorAll(".block-category");

categoryTabs.forEach(tab => {
    tab.addEventListener("click", (event) => { // **שינוי: העברת event לפונקציה**
        const category = tab.dataset.category;
        handleCategoryChange(category, event.currentTarget); // **שינוי: העברת currentTarget**
    });
});

// הוספת כפתור קווי GRID
const gridToggle = document.getElementById("grid-toggle");
const stage = document.getElementById("stage");

gridToggle.addEventListener("click", () => {
    stage.classList.toggle("show-grid");
});

// אתחול הלוח עם הקטגוריה הפעילה הראשונה
populateBlockPalette("triggering");

// ========================================================================
// גרירה של הדמות
// ========================================================================

const character = document.getElementById('character');
const stage = document.getElementById('stage');

character.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', ''); // Required for drag to work in Firefox
});

stage.addEventListener('dragover', (event) => {
    event.preventDefault(); // Allow drop
});

stage.addEventListener('drop', (event) => {
    event.preventDefault();

    const stageRect = stage.getBoundingClientRect();
    const characterWidth = character.offsetWidth;
    const characterHeight = character.offsetHeight;

    let x = event.clientX - stageRect.left - characterWidth / 2;
    let y = event.clientY - offsetY - stageRect.top - characterHeight / 2;

    // Stay within stage bounds
    x = Math.max(0, Math.min(x, stageRect.width - characterWidth));
    y = Math.max(0, Math.min(y, stageRect.height - characterHeight));

    character.style.left = x + 'px';
    character.style.top = y + 'px';
});
--- END OF FILE script.js ---
