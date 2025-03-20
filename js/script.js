// ========================================================================
// הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "Green Flag",
            color: "var(--triggering-color)", // שימוש במשתנה CSS במקום ערך קבוע
            type: "startOnGreenFlag",
            icon: "assets/images/green-flag.svg",
        },
        {
            name: "Tap",
            color: "var(--triggering-color)",
            type: "startOnTap",
            icon: "assets/images/blocks/tap.svg",
        },
        {
            name: "Bump",
            color: "var(--triggering-color)",
            type: "startOnBump",
            icon: "assets/images/blocks/bump.svg",
        },
        {
            name: "Send Message",
            color: "var(--triggering-color)",
            type: "sendMessage",
            icon: "assets/images/blocks/send-message.svg",
        },
        {
            name: "Receive Message",
            color: "var(--triggering-color)",
            type: "startOnMessage",
            icon: "assets/images/blocks/receive-message.svg",
        },
    ],
    motion: [
        {
            name: "Move Right",
            color: "var(--motion-color)",
            type: "moveRight",
            icon: "assets/images/blocks/move-right.svg",
        },
        {
            name: "Move Left",
            color: "var(--motion-color)",
            type: "moveLeft",
            icon: "assets/images/blocks/move-left.svg",
        },
        {
            name: "Move Up",
            color: "var(--motion-color)",
            type: "moveUp",
            icon: "assets/images/blocks/move-up.svg",
        },
        {
            name: "Move Down",
            color: "var(--motion-color)",
            type: "moveDown",
            icon: "assets/images/blocks/move-down.svg",
        },
        {
            name: "Turn Right",
            color: "var(--motion-color)",
            type: "turnRight",
            icon: "assets/images/blocks/turn-right.svg",
        },
        {
            name: "Turn Left",
            color: "var(--motion-color)",
            type: "turnLeft",
            icon: "assets/images/blocks/turn-left.svg",
        },
        {
            name: "Hop",
            color: "var(--motion-color)",
            type: "hop",
            icon: "assets/images/blocks/hop.svg",
        },
        {
            name: "Go Home",
            color: "var(--motion-color)",
            type: "goHome",
            icon: "assets/images/blocks/reset.svg",
        },
    ],
    looks: [
        {
            name: "Say",
            color: "var(--looks-color)",
            type: "say",
            icon: "assets/images/blocks/say.svg",
        },
        {
            name: "Grow",
            color: "var(--looks-color)",
            type: "grow",
            icon: "assets/images/blocks/grow.svg",
        },
        {
            name: "Shrink",
            color: "var(--looks-color)",
            type: "shrink",
            icon: "assets/images/blocks/shrink.svg",
        },
        {
            name: "Reset Size",
            color: "var(--looks-color)",
            type: "resetSize",
            icon: "assets/images/blocks/reset-size.svg",
        },
        {
            name: "Hide",
            color: "var(--looks-color)",
            type: "hide",
            icon: "assets/images/blocks/hide.svg",
        },
        {
            name: "Show",
            color: "var(--looks-color)",
            type: "show",
            icon: "assets/images/blocks/show.svg",
        },
    ],
    sound: [
        {
            name: "Play Sound",
            color: "var(--sound-color)",
            type: "popSound",
            icon: "assets/images/blocks/sound.svg",
        },
        {
            name: "Play Recorded Sound",
            color: "var(--sound-color)",
            type: "playRecordedSound",
            icon: "assets/images/blocks/record-sound.svg",
        },
    ],
    control: [
        {
            name: "Wait",
            color: "var(--control-color)",
            type: "wait",
            icon: "assets/images/blocks/wait.svg",
        },
        {
            name: "Set Speed",
            color: "var(--control-color)",
            type: "setSpeed",
            icon: "assets/images/blocks/speed.svg",
        },
        {
            name: "Repeat",
            type: "repeat",
            icon: "assets/images/blocks/repeat.svg",
            color: "var(--control-color)"
        },
        {
            name: "Repeat Forever",
            type: "repeatForever",
            icon: "assets/images/blocks/repeat-forever.svg",
            color: "var(--control-color)"
        },
        {
            name: "Go To Page",
            color: "var(--control-color)",
            type: "goToPage",
            icon: "assets/images/blocks/go-to-page.svg",
        },
    ],
    end: [
        {
            name: "Stop",
            color: "var(--end-color)",
            type: "stop",
            icon: "assets/images/blocks/stop.svg",
        },
        {
            name: "End",
            color: "var(--end-color)",
            type: "end",
            icon: "assets/images/blocks/end.svg",
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

// פונקציה ליצירת בלוק גרפי - עודכנה עבור בלוק REPEAT
function createScratchBlock(block) {
    const scratchBlock = document.createElement("div");
    scratchBlock.classList.add("scratch-block");
    scratchBlock.style.backgroundColor = block.color;

    // יצירת אלמנט תמונה עבור האיקון
    const iconImg = document.createElement("img");
    iconImg.src = block.icon;
    iconImg.alt = block.name;
    iconImg.classList.add("block-icon-img");

    // יצירת אלמנט טקסט עבור שם הבלוק
    const blockNameText = document.createElement("span");
    blockNameText.classList.add("block-name-text");
    blockNameText.textContent = block.name; // Use block.name for text
    blockNameText.style.userSelect = 'none'; // Prevent text selection during drag

    scratchBlock.appendChild(iconImg);
    scratchBlock.appendChild(blockNameText);


    if (block.type === "repeat") {
        // Create bottom puzzle piece elements only for "repeat" block

        const bottomIndent = document.createElement("div");
        bottomIndent.classList.add("bottom-indent");
        scratchBlock.appendChild(bottomIndent);

        const bottomLeftProtrusion = document.createElement("div");
        bottomLeftProtrusion.classList.add("bottom-left-protrusion");
        scratchBlock.appendChild(bottomLeftProtrusion);

        const bottomRightIndent = document.createElement("div");
        bottomRightIndent.classList.add("bottom-right-indent");
        scratchBlock.appendChild(bottomRightIndent);
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

    const blockIndex = event.dataTransfer.getData('block-index'); // נסה לקבל אינדקס, אם קיים

    if (blockIndex) { // אם קיים block-index, זה אומר שגוררים בלוק בתוך אזור התכנות
        const draggedBlockIndex = parseInt(blockIndex);
        const draggedBlock = programmingArea.children[draggedBlockIndex];

        if (draggedBlock) {
            // הסר את הבלוק מהמיקום הישן
            programmingArea.removeChild(draggedBlock);

            // מצא את מיקום השחרור ועדכן מיקום
            const rect = programmingArea.getBoundingClientRect();
            draggedBlock.style.position = "absolute";
            draggedBlock.style.left = `${event.clientX - rect.left - (draggedBlock.offsetWidth / 2)}px`;
            draggedBlock.style.top = `${event.clientY - rect.top - (draggedBlock.offsetHeight / 2)}px`;

            programmingArea.appendChild(draggedBlock); // הוסף את הבלוק במיקום החדש (כרגע בסוף)
        }
    } else { // אם אין block-index, זה אומר שגוררים בלוק מלוח הלבנים (התנהגות קודמת)
        const data = JSON.parse(event.dataTransfer.getData("text/plain"));
        const blockType = data.type;
        const blockCategory = data.category;
        const blockIcon = data.icon;
        const blockColor = data.color; // צבע הבלוק המקורי
        const blockName = data.name;

        // יצירת אלמנט בלוק חדש (שיבוט)
        const newBlock = document.createElement("div");
        newBlock.classList.add("block-container");
        newBlock.dataset.category = blockCategory; // שמירת הקטגוריה בנתוני הבלוק

        const scratchBlock = document.createElement("div");
        scratchBlock.classList.add("scratch-block");
        scratchBlock.style.backgroundColor = blockColor; // שימוש בצבע המקורי של הבלוק

        // יצירת אלמנט תמונה עבור האיקון
        const iconImg = document.createElement("img");
        iconImg.src = blockIcon;
        iconImg.alt = blockName;
        iconImg.classList.add("block-icon-img");

        scratchBlock.appendChild(iconImg);

        //יצירת אלמנט right-connector
        const rightConnector = document.createElement("div");
        rightConnector.classList.add("right-connector");
        rightConnector.style.backgroundColor = blockColor; // שימוש באותו צבע גם למחבר

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
        newBlock.draggable = true; // אפשר גרירה לבלוקים חדשים

        // הוספת event listener לגרירה של בלוקים בתוך אזור התכנות
        newBlock.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData('block-index', Array.from(programmingArea.children).indexOf(newBlock).toString());
            event.dataTransfer.effectAllowed = "move";
        });

        // הוספת הבלוק החדש לאזור התכנות
        programmingArea.appendChild(newBlock);

        // מיקום הבלוק החדש יחסי לאזור התכנות - מתחת לעכבר
        const rect = programmingArea.getBoundingClientRect();
        newBlock.style.position = "absolute"; // השתמש במיקום אבסולוטי
        newBlock.style.left = `${event.clientX - rect.left - (newBlock.offsetWidth / 2)}px`; // מרכז את הבלוק אופקית
        newBlock.style.top = `${event.clientY - rect.top - (newBlock.offsetHeight / 2)}px`; // מרכז את הבלוק אנכית
    }
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

// ניקוי כל הבלוקים מאזור התכנות
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
