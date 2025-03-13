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
    e.stopPropagation(); // עצירת הפצת האירוע
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
    if (!categoryDiv) {
        console.error(`Element with ID "${category}-blocks" not found.`);
        return;
    }

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
    const leftConnector.classList.add("left-connector");

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

// אתחול הלוח עם הקטגוריה הפעילה הראשונה
populateBlockPalette("triggering");
--- START OF FILE style.css ---

body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f0f4ff;
    direction: rtl;
}

.container {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

header {
    background-color: #fff;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e0e0e0;
}

main {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.stage-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
}

#stage {
    flex: 0 0 auto;
    width: 550px;
    height: 450px;
    background-color: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    position: relative;
    /* display: grid; הסרתי את זה כי אנחנו יוצרים קווי רשת אחרת */
    /* grid-template-columns: repeat(10, 1fr); */
    /* grid-template-rows: repeat(10, 1fr); */
    gap: 1px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

#stage::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background: none; /* הסרת הרקע של קווי הרשת המובנים */
    /* opacity: 0; הסתרת הרשת כברירת מחדל */
}

#stage.show-grid::before {
    background: none;
}

#stage.show-grid {
  background-image: 
    linear-gradient(to right, lightgrey 1px, transparent 1px),
    linear-gradient(to bottom, lightgrey 1px, transparent 1px);
  background-size: 56px 46px; /* Set the size of the grid lines */
  background-position: top left; /* Align the grid to the top left */
}

#character {
    width: 100px; /* שינוי הרוחב ל-100px */
    height: 100px; /* שינוי הגובה ל-100px */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    object-fit: contain; /* גורם לתמונה להתאים בתוך השטח המוקצה לה */
     /* שינוי הסמן לגרירה */
    cursor: grab;
}

#character:active {
    cursor: grabbing; /* סמן אחר כאשר לוחצים */
}

.palette-and-programming {
    display: flex;
    flex-direction: column;
    flex: 1;
}

#block-palette {
    background-color: #fff;
    border: 1px solid #e0e0e0;
    margin: 10px;
    padding: 10px;
    border-radius: 10px;
    flex: 1;
    overflow-y: auto;
}

.category-tabs {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 10px;
}

.category-tab {
    border: none;
    padding: 0;
    margin-right: 5px;
    margin-bottom: 5px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    color: #000000;
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
}

.category-tab img {
    max-width: 100%;
    max-height: 100%;
    pointer-events: none;
   filter: invert(100%);
}

.category-tab[data-category="triggering"] {
    background-color: yellow;
}

.category-tab[data-category="motion"] {
    background-color: blue;
}

.category-tab[data-category="looks"] {
    background-color: lavender;
}

.category-tab[data-category="sound"] {
    background-color: green;
}

.category-tab[data-category="control"] {
    background-color: orange;
}

.category-tab[data-category="end"] {
    background-color: red;
}

.block-category {
    display: none;
    padding: 10px;
}

.block-category.active {
    display: flex;
    flex-wrap: wrap;
    padding: 10px;
}

#programming-area {
    background-color: #fff;
    border: 1px solid #e0e0e0;
    margin: 10px;
    padding: 10px;
    border-radius: 10px;
    flex: 1;
}

.program-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

#clear-all {
    color: #e74c3c;
    cursor: pointer;
}

#program-blocks {
    min-height: 100px;
    border: 1px dashed #ccc;
    padding: 10px;
    position: relative; /* כדי למקם אלמנטים באופן אבסולוטי בתוכו */
}

#program-blocks .block-container {
    position: absolute; /* כדי למקם את הבלוקים באופן חופשי */
    /* כאן אפשר להוסיף עוד סגנונות */
}

.logo {
    font-size: 20px;
    font-weight: bold;
    color: #4a90e2;
}

.header-icons {
    display: flex;
}

.icon {
    margin-left: 10px;
    font-size: 24px;
    color: #999;
    cursor: pointer;
}

/* הוספתי את זה כדי שהגודל ישפיע על הבלוקים בפלטה */
#block-palette .block-container,
#programming-area .block-container {
    position: relative;
    width: 60px; /* שינוי הרוחב ל-60px */
    height: 60px; /* שינוי הגובה ל-60px */
    margin: 5px;
    cursor: pointer;
    background-color: transparent; /* הוספת רקע שקוף */
}

/* הוספתי את זה כדי שהגודל ישפיע על הבלוקים בפלטה */
#block-palette .scratch-block,
#programming-area .scratch-block {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #25AFF4;
    border-radius: 6px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.1); /* הוספת צללית פנימית */
    transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out; /* הוספת transition ל-background-color */
}

.right-connector {
    position: absolute;
    right: -5px; /* התאמת המיקום */
    top: 50%;
    transform: translateY(-50%);
    width: 8px; /* הקטנת הרוחב */
    height: 15px; /* הקטנת הגובה */
    background-color: #25AFF4;
    border-radius: 0 30px 30px 0;
}

.left-connector-wrapper {
    position: absolute;
    left: -7px; /* התאמת המיקום */
    top: 0;
    height: 100%;
    width: 10px; /* הקטנת הרוחב */
    overflow: hidden;
}

.left-connector {
    position: absolute;
    left: -8px; /* התאמת המיקום */
    top: 50%;
    transform: translateY(-50%);
    width: 16px; /* הקטנת הרוחב */
    height: 16px; /* הקטנת הגובה */
    background-color: #f0f0f0;
    border-radius: 50%;
}

.block-icon {
    width: 16px;
    height: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 5px; /* הוספת רווח בין האייקון לטקסט */
}

.block-icon svg {
    width: 100%;
    height: 100%;
}

#triggering-blocks .block-container .scratch-block {
    background-color: #F9D74C;
}

#motion-blocks .block-container .scratch-block {
    background-color: #3D81CC;
}

#looks-blocks .block-container .scratch-block {
    background-color: #D86FBA;
}

#sound-blocks .block-container .scratch-block {
    background-color: #4DC251;
}

#control-blocks .block-container .scratch-block {
    background-color: #F8AA4C;
}

#end-blocks .block-container .scratch-block {
    background-color: #F15959;
}

#grid-toggle {
    margin-left: 10px;
    font-size: 16px;
    color: #999;
    cursor: pointer;
    border: 1px solid #ccc;
    padding: 5px 10px;
    border-radius: 5px;
}

#grid-toggle:hover {
    background-color: #f0f0f0;
}
