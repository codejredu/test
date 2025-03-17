// ========================================================================
// הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "דגל ירוק",
            color: "yellow",
            type: "startOnGreenFlag",
            icon: "assets/images/green-flag.svg",
        },
        {
            name: "הקשה",
            color: "yellow",
            type: "startOnTap",
            icon: "assets/images/tap.svg",
        },
        {
            name: "התנגשות",
            color: "yellow",
            type: "startOnBump",
            icon: "assets/images/bump.svg",
        },
        {
            name: "שלח הודעה",
            color: "yellow",
            type: "sendMessage",
            icon: "assets/images/send-message.svg",
        },
        {
            name: "קבל הודעה",
            color: "yellow",
            type: "startOnMessage",
            icon: "assets/images/receive-message.svg",
        },
    ],
    motion: [
        {
            name: "זוז ימינה",
            color: "#43D3FF",
            type: "moveRight",
            icon: "assets/images/move-right.svg",
        },
        {
            name: "זוז שמאלה",
            color: "#43D3FF",
            type: "moveLeft",
            icon: "assets/images/move-left.svg",
        },
        {
            name: "זוז למעלה",
            color: "#43D3FF",
            type: "moveUp",
            icon: "assets/images/move-up.svg",
        },
        {
            name: "זוז למטה",
            color: "#43D3FF",
            type: "moveDown",
            icon: "assets/images/move-down.svg",
        },
        {
            name: "הסתובב ימינה",
            color: "#43D3FF",
            type: "turnRight",
            icon: "assets/images/turn-right.svg",
        },
        {
            name: "הסתובב שמאלה",
            color: "#43D3FF",
            type: "turnLeft",
            icon: "assets/images/turn-left.svg",
        },
        {
            name: "קפוץ",
            color: "#43D3FF",
            type: "hop",
            icon: "assets/images/hop.svg",
        },
        {
            name: "חזור הביתה",
            color: "#43D3FF",
            type: "goHome",
            icon: "assets/images/go-home.svg",
        },
    ],
    looks: [
        {
            name: "דיבור",
            color: "purple",
            type: "say",
            icon: "assets/images/say.svg",
        },
        {
            name: "גדל",
            color: "purple",
            type: "grow",
            icon: "assets/images/grow.svg",
        },
        {
            name: "הקטן",
            color: "purple",
            type: "shrink",
            icon: "assets/images/shrink.svg",
        },
        {
            name: "אפס גודל",
            color: "purple",
            type: "resetSize",
            icon: "assets/images/reset-size.svg",
        },
        {
            name: "הסתר",
            color: "purple",
            type: "hide",
            icon: "assets/images/hide.svg",
        },
        {
            name: "הראה",
            color: "purple",
            type: "show",
            icon: "assets/images/show.svg",
        },
    ],
    sound: [
        {
            name: "השמע צליל",
            color: "green",
            type: "popSound",
            icon: "assets/images/play-sound.svg",
        },
        {
            name: "השמע הקלטה",
            color: "green",
            type: "playRecordedSound",
            icon: "assets/images/play-recorded.svg",
        },
    ],
    control: [
        {
            name: "המתן",
            color: "orange",
            type: "wait",
            icon: "assets/images/wait.svg",
        },
        {
            name: "קבע מהירות",
            color: "orange",
            type: "setSpeed",
            icon: "assets/images/set-speed.svg",
        },
        {
            name: "חזור על",
            type: "repeat",
            icon: "assets/images/repeat.svg",
            color: "orange"
        },
        {
            name: "חזור לנצח",
            type: "repeatForever",
            icon: "assets/images/repeat-forever.svg",
            color: "orange"
        },
        {
            name: "עבור לדף",
            color: "orange",
            type: "goToPage",
            icon: "assets/images/go-to-page.svg",
        },
    ],
    end: [
        {
            name: "עצור",
            color: "red",
            type: "stop",
            icon: "assets/images/stop.svg",
        },
        {
            name: "סיים",
            color: "red",
            type: "end",
            icon: "assets/images/end.svg",
        },
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
    scratchBlock.style.backgroundColor = block.color;
    
    // בדיקה אם האייקון הוא קובץ SVG
    if (block.icon && block.icon.endsWith('.svg')) {
        const img = document.createElement("img");
        img.src = block.icon;
        img.alt = block.name;
        img.classList.add("block-svg-icon");
        scratchBlock.appendChild(img);
    } else {
        // במקרה שאין קובץ SVG, נשתמש בטקסט כמו קודם
        scratchBlock.textContent = block.icon;
    }
    
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
        category: category,
        name: block.name
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
    const blockName = data.name;

    // יצירת אלמנט בלוק חדש (שיבוט)
    const newBlock = document.createElement("div");
    newBlock.classList.add("block-container");

    const scratchBlock = document.createElement("div");
    scratchBlock.classList.add("scratch-block");
    scratchBlock.style.backgroundColor = blockColor; //הצבע

    // בדיקה אם האייקון הוא קובץ SVG
    if (blockIcon && blockIcon.endsWith('.svg')) {
        const img = document.createElement("img");
        img.src = blockIcon;
        img.alt = blockName || blockType;
        img.classList.add("block-svg-icon");
        scratchBlock.appendChild(img);
    } else {
        // במקרה שאין קובץ SVG, נשתמש בטקסט כמו קודם
        scratchBlock.textContent = blockIcon;
    }

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

// פונקציה לטיפול בשינוי קטגוריה
function handleCategoryChange(category) {
    blockCategories.forEach(element => element.classList.remove("active"));
    categoryTabs.forEach(tab => tab.classList.remove("active"));

    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    tab.classList.add("active");
    document.getElementById(`${category}-blocks`).classList.add("active");
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

// כפתור ניקוי האזור תכנות
const clearAllButton = document.getElementById("clear-all");
clearAllButton.addEventListener("click", () => {
    programmingArea.innerHTML = "";
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
    let y = event.clientY - stageRect.top - characterHeight / 2;

    // Stay within stage bounds
    x = Math.max(0, Math.min(x, stageRect.width - characterWidth));
    y = Math.max(0, Math.min(y, stageRect.height - characterHeight));

    character.style.left = x + 'px';
    character.style.top = y + 'px';
});
