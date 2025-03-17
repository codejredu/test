// ========================================================================
// הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "Start on Green Flag",
            color: "yellow",
            type: "startOnGreenFlag",
            textIcon: "🚩", // למקרה שאין קובץ SVG
            iconSrc: "assets/images/block-icons/green-flag.svg",
        },
        {
            name: "Start on Tap",
            color: "yellow",
            type: "startOnTap",
            textIcon: "👆",
            iconSrc: "assets/images/block-icons/tap.svg",
        },
        {
            name: "Start on Bump",
            color: "yellow",
            type: "startOnBump",
            textIcon: "💥",
            iconSrc: "assets/images/block-icons/bump.svg",
        },
        {
            name: "Send Message",
            color: "yellow",
            type: "sendMessage",
            textIcon: "✉️",
            iconSrc: "assets/images/block-icons/send-message.svg",
        },
        {
            name: "Start on Message",
            color: "yellow",
            type: "startOnMessage",
            textIcon: "📩",
            iconSrc: "assets/images/block-icons/receive-message.svg",
        },
    ],
    motion: [
        {
            name: "Move Right",
            color: "#43D3FF",
            type: "moveRight",
            textIcon: "➡️",
            iconSrc: "assets/images/block-icons/move-right.svg",
        },
        {
            name: "Move Left",
            color: "#43D3FF",
            type: "moveLeft",
            textIcon: "⬅️",
            iconSrc: "assets/images/block-icons/move-left.svg",
        },
        {
            name: "Move Up",
            color: "#43D3FF",
            type: "moveUp",
            textIcon: "⬆️",
            iconSrc: "assets/images/block-icons/move-up.svg",
        },
        {
            name: "Move Down",
            color: "#43D3FF",
            type: "moveDown",
            textIcon: "⬇️",
            iconSrc: "assets/images/block-icons/move-down.svg",
        },
        {
            name: "Turn Right",
            color: "#43D3FF",
            type: "turnRight",
            textIcon: "↩️",
            iconSrc: "assets/images/block-icons/turn-right.svg",
        },
        {
            name: "Turn Left",
            color: "#43D3FF",
            type: "turnLeft",
            textIcon: "↪️",
            iconSrc: "assets/images/block-icons/turn-left.svg",
        },
        {
            name: "Hop",
            color: "#43D3FF",
            type: "hop",
            textIcon: "🤸",
            iconSrc: "assets/images/block-icons/hop.svg",
        },
        {
            name: "Go Home",
            color: "#43D3FF",
            type: "goHome",
            textIcon: "🏠",
            iconSrc: "assets/images/block-icons/go-home.svg",
        },
    ],
    looks: [
        {
            name: "Say",
            color: "purple",
            type: "say",
            textIcon: "💬",
            iconSrc: "assets/images/block-icons/say.svg",
        },
        {
            name: "Grow",
            color: "purple",
            type: "grow",
            textIcon: "📈",
            iconSrc: "assets/images/block-icons/grow.svg",
        },
        {
            name: "Shrink",
            color: "purple",
            type: "shrink",
            textIcon: "📉",
            iconSrc: "assets/images/block-icons/shrink.svg",
        },
        {
            name: "Reset Size",
            color: "purple",
            type: "resetSize",
            textIcon: "🔄",
            iconSrc: "assets/images/block-icons/reset-size.svg",
        },
        {
            name: "Hide",
            color: "purple",
            type: "hide",
            textIcon: "🙈",
            iconSrc: "assets/images/block-icons/hide.svg",
        },
        {
            name: "Show",
            color: "purple",
            type: "show",
            textIcon: "👁️",
            iconSrc: "assets/images/block-icons/show.svg",
        },
    ],
    sound: [
        {
            name: "Pop Sound",
            color: "green",
            type: "popSound",
            textIcon: "🎵",
            iconSrc: "assets/images/block-icons/pop-sound.svg",
        },
        {
            name: "Play Recorded Sound",
            color: "green",
            type: "playRecordedSound",
            textIcon: "🎤",
            iconSrc: "assets/images/block-icons/play-recorded.svg",
        },
    ],
    control: [
        {
            name: "Wait",
            color: "orange",
            type: "wait",
            textIcon: "⏱️",
            iconSrc: "assets/images/block-icons/wait.svg",
        },
        {
            name: "Set Speed",
            color: "orange",
            type: "setSpeed",
            textIcon: "⚡",
            iconSrc: "assets/images/block-icons/set-speed.svg",
        },
        {
            name: "Repeat",
            type: "repeat",
            textIcon: "🔁",
            iconSrc: "assets/images/block-icons/repeat.svg",
            color: "orange"
        },
        {
            name: "Repeat Forever",
            type: "repeatForever",
            textIcon: "♾️",
            iconSrc: "assets/images/block-icons/repeat-forever.svg",
            color: "orange"
        },
        {
            name: "Go To Page",
            color: "orange",
            type: "goToPage",
            textIcon: "🚪",
            iconSrc: "assets/images/block-icons/go-to-page.svg",
        },
    ],
    end: [
        {
            name: "Stop",
            color: "red",
            type: "stop",
            textIcon: "🛑",
            iconSrc: "assets/images/block-icons/stop.svg",
        },
        {
            name: "End",
            color: "red",
            type: "end",
            textIcon: "🏁",
            iconSrc: "assets/images/block-icons/end.svg",
        },
    ],
};

// ========================================================================
// פונקציות ליצירת אלמנטים
// ========================================================================

// פונקציה לבדיקה אם קובץ SVG קיים
function checkIfImageExists(url, callback) {
    const img = new Image();
    img.onload = function() { callback(true); };
    img.onerror = function() { callback(false); };
    img.src = url;
}

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

    // בדיקה אם קובץ ה-SVG קיים
    checkIfImageExists(block.iconSrc, function(exists) {
        if (exists) {
            // אם קובץ ה-SVG קיים - יצירת תג img
            const iconImg = document.createElement("img");
            iconImg.src = block.iconSrc;
            iconImg.alt = block.name;
            iconImg.classList.add("block-icon-img");
            scratchBlock.appendChild(iconImg);
        } else {
            // אם קובץ ה-SVG לא קיים - שימוש באימוג'י
            scratchBlock.textContent = block.textIcon;
        }
    });
    
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
        textIcon: block.textIcon,
        iconSrc: block.iconSrc,
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
    const blockColor = data.color;
    const blockIconSrc = data.iconSrc;
    const blockTextIcon = data.textIcon;

    // יצירת אלמנט בלוק חדש (שיבוט)
    const newBlock = document.createElement("div");
    newBlock.classList.add("block-container");

    const scratchBlock = document.createElement("div");
    scratchBlock.classList.add("scratch-block");
    scratchBlock.style.backgroundColor = blockColor; //הצבע

    // בדיקה אם קובץ ה-SVG קיים
    checkIfImageExists(blockIconSrc, function(exists) {
        if (exists) {
            // אם קובץ ה-SVG קיים - יצירת תג img
            const iconImg = document.createElement("img");
            iconImg.src = blockIconSrc;
            iconImg.alt = blockType;
            iconImg.classList.add("block-icon-img");
            scratchBlock.appendChild(iconImg);
        } else {
            // אם קובץ ה-SVG לא קיים - שימוש באימוג'י
            scratchBlock.textContent = blockTextIcon;
        }
    });

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
    if (tab) {
        tab.classList.add("active");
        const blockCategory = document.getElementById(`${category}-blocks`);
        if (blockCategory) {
            blockCategory.classList.add("active");
            populateBlockPalette(category);
        }
    }
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

// ניקוי כל הבלוקים באזור התכנות
const clearAllButton = document.getElementById("clear-all");
if (clearAllButton) {
    clearAllButton.addEventListener("click", () => {
        programmingArea.innerHTML = "";
    });
}

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

// ========================================================================
// יצירת תיקיות וקבצי SVG אם לא קיימים
// ========================================================================

// פונקציה לבדיקה אם התיקיה assets/images/block-icons קיימת ויצירתה אם לא
function checkAndCreateDirectories() {
  console.log("מנסה ליצור תיקיות אם לא קיימות");
  // הודעה שהתיקיות נבדקות - לא ניתן באמת ליצור תיקיות מהדפדפן ללא חיבור לשרת
}

// הרצת הפונקציה בטעינת הדף
document.addEventListener('DOMContentLoaded', function() {
  checkAndCreateDirectories();
});
