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
        // --- Moved from 'end' category ---
        {
            name: "Stop",
            color: "var(--control-color)", // Updated color
            type: "stop",
            icon: "assets/images/blocks/stop.svg",
        },
        // --- End of moved block ---
    ],
    end: [
        // --- "Stop" block removed from here ---
        {
            name: "End",
            color: "var(--end-color)",
            type: "end",
            icon: "assets/images/blocks/end.svg",
        },
        {
            name: "Repeat Forever",
            type: "repeatForever",
            icon: "assets/images/blocks/repeat-forever.svg",
            color: "var(--end-color)"  // Still uses end-color as per original definition
        },
        {
            name: "Go To Page",
            color: "var(--end-color)",  // Still uses end-color as per original definition
            type: "goToPage",
            icon: "assets/images/blocks/go-to-page.svg",
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

// פונקציה ליצירת בלוק גרפי - עודכנה להוספת תמונות SVG
function createScratchBlock(block) {
    const scratchBlock = document.createElement("div");
    scratchBlock.classList.add("scratch-block");
    scratchBlock.style.backgroundColor = block.color;

    // יצירת אלמנט תמונה עבור האיקון
    const iconImg = document.createElement("img");
    iconImg.src = block.icon;
    iconImg.alt = block.name;
    iconImg.classList.add("block-icon-img");

    scratchBlock.appendChild(iconImg);
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
    // No need to add connectors visually for now based on current CSS?
    // blockContainer.appendChild(rightConnector);
    // blockContainer.appendChild(leftConnectorWrapper);

    blockContainer.dataset.type = block.type;
    blockContainer.dataset.category = category; // Make sure category is set for CSS styling
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
            // הסר את הבלוק מהמיקום הישן (will be re-appended later)
            // programmingArea.removeChild(draggedBlock); // Let's not remove it yet

            // מצא את מיקום השחרור ועדכן מיקום
            const rect = programmingArea.getBoundingClientRect();
            // Calculate new position relative to the programming area, centered under the cursor
            const newLeft = event.clientX - rect.left - (draggedBlock.offsetWidth / 2);
            const newTop = event.clientY - rect.top - (draggedBlock.offsetHeight / 2);

            draggedBlock.style.position = "absolute";
            // Ensure position stays within bounds (optional, but good practice)
            draggedBlock.style.left = `${Math.max(0, Math.min(newLeft, rect.width - draggedBlock.offsetWidth))}px`;
            draggedBlock.style.top = `${Math.max(0, Math.min(newTop, rect.height - draggedBlock.offsetHeight))}px`;

            // No need to re-append if it was never removed, just update position
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
        newBlock.dataset.type = blockType; // שמירת ה type

        const scratchBlock = document.createElement("div");
        scratchBlock.classList.add("scratch-block");
        // No need to set background color here, CSS handles it via data-category

        // יצירת אלמנט תמונה עבור האיקון
        const iconImg = document.createElement("img");
        iconImg.src = blockIcon;
        iconImg.alt = blockName;
        iconImg.classList.add("block-icon-img");

        scratchBlock.appendChild(iconImg);

        // הוספת הכל ל container
        newBlock.appendChild(scratchBlock);
        newBlock.draggable = true; // אפשר גרירה לבלוקים חדשים

        // הוספת event listener לגרירה של בלוקים בתוך אזור התכנות
        newBlock.addEventListener("dragstart", (event) => {
            // Find the index of the block *within* the programming area children
             const index = Array.from(programmingArea.children).indexOf(newBlock);
            if (index > -1) { // Make sure the block is actually in the programming area
                 event.dataTransfer.setData('block-index', index.toString());
            }
            event.dataTransfer.effectAllowed = "move";
        });

        // הוספת הבלוק החדש לאזור התכנות
        programmingArea.appendChild(newBlock);

        // מיקום הבלוק החדש יחסי לאזור התכנות - מתחת לעכבר
        const rect = programmingArea.getBoundingClientRect();
        newBlock.style.position = "absolute"; // השתמש במיקום אבסולוטי
        // Calculate position centered under the cursor
        const newLeft = event.clientX - rect.left - (newBlock.offsetWidth / 2);
        const newTop = event.clientY - rect.top - (newBlock.offsetHeight / 2);
         // Ensure position stays within bounds (optional, but good practice)
        newBlock.style.left = `${Math.max(0, Math.min(newLeft, rect.width - newBlock.offsetWidth))}px`;
        newBlock.style.top = `${Math.max(0, Math.min(newTop, rect.height - newBlock.offsetHeight))}px`;
    }
}


// ========================================================================
// פונקציות אתחול
// ========================================================================

// הוספת הבלוקים ללוח הלבנים
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    if (!categoryDiv) {
        console.error(`Category div not found for ${category}`);
        return;
    }
    categoryDiv.innerHTML = ""; // Clear existing blocks

    if (!blocks[category]) {
         console.error(`No blocks defined for category ${category}`);
        return;
    }

    blocks[category].forEach(block => {
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}


// פונקציה לטיפול בשינוי קטגוריה
function handleCategoryChange(category) {
    // Deactivate all category content divs
    blockCategories.forEach(element => element.classList.remove("active"));
    // Deactivate all category tabs
    categoryTabs.forEach(tab => tab.classList.remove("active"));

    // Activate the clicked tab
    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    if (tab) {
        tab.classList.add("active");
    } else {
        console.error(`Tab not found for category ${category}`);
    }


    // Activate the corresponding category content div
    const categoryContent = document.getElementById(`${category}-blocks`);
     if (categoryContent) {
        categoryContent.classList.add("active");
        populateBlockPalette(category); // Populate the newly active category
    } else {
        console.error(`Content div not found for category ${category}`);
    }
}


// ========================================================================
//  לוגיקת גרירה ושחרור (Drag and Drop)
// ========================================================================

const programmingArea = document.getElementById("program-blocks");

// טיפול באירוע גרירה מעל אזור התכנות (dragover)
programmingArea.addEventListener("dragover", (event) => {
    event.preventDefault(); // Necessary to allow dropping
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
    programmingArea.innerHTML = ""; // Clear all child elements
});

// אתחול הלוח עם הקטגוריה הפעילה הראשונה (Triggering)
handleCategoryChange("triggering"); // Use the handler to ensure proper setup

// ========================================================================
// גרירה של הדמות
// ========================================================================

const character = document.getElementById('character');
let isDraggingChar = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

character.addEventListener('mousedown', (event) => {
    isDraggingChar = true;
    character.style.cursor = 'grabbing';
    // Calculate offset from the top-left corner of the character
    dragOffsetX = event.clientX - character.getBoundingClientRect().left;
    dragOffsetY = event.clientY - character.getBoundingClientRect().top;
     // Prevent default image dragging behavior
    event.preventDefault();
});

document.addEventListener('mousemove', (event) => {
    if (!isDraggingChar) return;

    const stageRect = stage.getBoundingClientRect();

    // Calculate potential new top-left position based on cursor and offset
    let x = event.clientX - stageRect.left - dragOffsetX;
    let y = event.clientY - stageRect.top - dragOffsetY;

    // Constrain within stage bounds
    x = Math.max(0, Math.min(x, stageRect.width - character.offsetWidth));
    y = Math.max(0, Math.min(y, stageRect.height - character.offsetHeight));

    character.style.left = x + 'px';
    character.style.top = y + 'px';
});

document.addEventListener('mouseup', () => {
    if (isDraggingChar) {
        isDraggingChar = false;
        character.style.cursor = 'grab';
    }
});

// Prevent default dragstart event which conflicts with mousedown/mousemove
character.addEventListener('dragstart', (event) => {
    event.preventDefault();
});
