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
function createRightConnector(color) { /* ... Function - no changes needed ... */ }
function createLeftConnector() { /* ... Function - no changes needed ... */ }
function createScratchBlock(block) { /* ... Function - no changes needed ... */ }
function createBlockElement(block, category) { /* ... Function - no changes needed ... */ }

// ========================================================================
// פונקציות טיפול באירועים
// ========================================================================

function handleDragStart(event, block, category) { /* ... Function - no changes needed ... */ }
function handleDrop(event) { /* ... Function - no changes needed ... */ }

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
function handleCategoryChange(category) {
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
    tab.addEventListener("click", () => {
        const category = tab.dataset.category;
        handleCategoryChange(category);
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
