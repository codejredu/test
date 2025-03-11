// ========================================================================
//  הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "→ 1",
            color: "yellow",
            type: "startOnGreenFlag",
            icon: "flag.png", // נניח שיש לך אייקון לדגל
        },
        {
            name: "🚩 0",
            color: "yellow",
            type: "startOnTap",
            icon: "tap.png",
        },
        // הוסף בלוקים נוספים כאן
    ],
    motion: [
        {
            name: "→ 1",
            color: "blue",
            type: "moveRight",
            icon: "right.png",
        },
        // הוסף בלוקים נוספים כאן
    ],
    looks:[
        {
            name: "← 1",
            color: "purple",
            type: "moveRight",
            icon: "right.png",
        },
         // הוסף בלוקים נוספים כאן
    ],
    sound:[
        {
            name: "↑ 1",
            color: "green",
            type: "moveRight",
            icon: "right.png",
        },
         // הוסף בלוקים נוספים כאן
    ],
    control:[
        {
            name: "← 1",
            color: "orange",
            type: "moveRight",
            icon: "right.png",
        },
         // הוסף בלוקים נוספים כאן
    ]
    // הוסף כאן הגדרות בלוקים לשאר הקטגוריות
};

// פונקציה ליצירת HTML עבור בלוק
function createBlockElement(block, category) {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.style.backgroundColor = block.color;
    blockElement.textContent = block.name;
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
    newBlock.textContent = blocks[blockCategory].find(b => b.type === blockType).name; // מציאת השם הנכון
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
