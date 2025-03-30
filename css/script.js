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
        // --- START CHANGE ---
        // Moved Stop block from END to CONTROL and updated color
        {
            name: "Stop",
            color: "var(--control-color)", // Changed from var(--end-color)
            type: "stop",
            icon: "assets/images/blocks/stop.svg",
        },
        // --- END CHANGE ---
    ],
    end: [
        // --- START CHANGE ---
        // Removed Stop block from here
        // --- END CHANGE ---
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
            color: "var(--end-color)"  // שים לב שהצבע השתנה ל-end-color
        },
        {
            name: "Go To Page",
            color: "var(--end-color)",  // שים לב שהצבע השתנה ל-end-color
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

    // --- START CHANGE ---
    // Set data-type attribute, important for special styling (like repeat block)
    blockContainer.dataset.type = block.type;
    // --- END CHANGE ---

    const scratchBlock = createScratchBlock(block);
    // --- START CHANGE ---
    // Removed connector creation logic from here as CSS ::before and ::after handles it
    // const rightConnector = createRightConnector(block.color);
    // const leftConnectorWrapper = createLeftConnector();
    // --- END CHANGE ---

    blockContainer.appendChild(scratchBlock);
    // --- START CHANGE ---
    // blockContainer.appendChild(rightConnector); // Removed
    // blockContainer.appendChild(leftConnectorWrapper); // Removed
    // --- END CHANGE ---

    // --- START CHANGE ---
    // Moved dataset.type assignment higher up
    // --- END CHANGE ---
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
            // programmingArea.removeChild(draggedBlock); // Don't remove immediately if it's the same container

            // מצא את מיקום השחרור ועדכן מיקום
            const rect = programmingArea.getBoundingClientRect();
            draggedBlock.style.position = "absolute";
            // Adjust for the block's dimensions to center it under the cursor
            draggedBlock.style.left = `${event.clientX - rect.left - (draggedBlock.offsetWidth / 2)}px`;
            draggedBlock.style.top = `${event.clientY - rect.top - (draggedBlock.offsetHeight / 2)}px`;

            // Append again ensures it's at the end visually if not removed/re-added,
            // but here we just need to update position.
            // If we want z-index stacking, appending might be desired.
            // programmingArea.appendChild(draggedBlock);
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
        newBlock.dataset.type = blockType; // --- ADDED: Keep type info for styling ---

        const scratchBlock = document.createElement("div");
        scratchBlock.classList.add("scratch-block");
        // --- START CHANGE ---
        // No longer need to set color here if CSS handles it based on category/type
        // scratchBlock.style.backgroundColor = blockColor;
        // --- END CHANGE ---

        // יצירת אלמנט תמונה עבור האיקון
        const iconImg = document.createElement("img");
        iconImg.src = blockIcon;
        iconImg.alt = blockName;
        iconImg.classList.add("block-icon-img");

        scratchBlock.appendChild(iconImg);

        // --- START CHANGE ---
        // Removed connector element creation - handled by CSS ::before/::after on .scratch-block
        // --- END CHANGE ---

        // הוספת הכל ל container
        newBlock.appendChild(scratchBlock);
        // --- START CHANGE ---
        // newBlock.appendChild(rightConnector); // Removed
        // newBlock.appendChild(leftConnectorWrapper); // Removed
        // --- END CHANGE ---
        // --- START CHANGE ---
        // Moved dataset.type assignment higher up
        // --- END CHANGE ---
        newBlock.draggable = true; // אפשר גרירה לבלוקים חדשים

        // הוספת event listener לגרירה של בלוקים בתוך אזור התכנות
        newBlock.addEventListener("dragstart", (event) => {
            const index = Array.from(programmingArea.children).indexOf(newBlock);
            event.dataTransfer.setData('block-index', index.toString());
            event.dataTransfer.effectAllowed = "move";
        });

        // הוספת הבלוק החדש לאזור התכנות
        programmingArea.appendChild(newBlock);

        // מיקום הבלוק החדש יחסי לאזור התכנות - מתחת לעכבר
        const rect = programmingArea.getBoundingClientRect();
        newBlock.style.position = "absolute"; // השתמש במיקום אבסולוטי
        // Adjust for the block's dimensions to center it under the cursor
        const blockWidth = newBlock.offsetWidth || 100; // Use default if offsetWidth is 0 initially
        const blockHeight = newBlock.offsetHeight || 100; // Use default if offsetHeight is 0 initially
        newBlock.style.left = `${event.clientX - rect.left - (blockWidth / 2)}px`; // מרכז את הבלוק אופקית
        newBlock.style.top = `${event.clientY - rect.top - (blockHeight / 2)}px`; // מרכז את הבלוק אנכית
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
    blockCategories.forEach(element => element.classList.remove("active"));
    categoryTabs.forEach(tab => tab.classList.remove("active")); // Assuming .active styles the tab

    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    const categoryDiv = document.getElementById(`${category}-blocks`);

    if (tab) {
        tab.classList.add("active"); // Style the clicked tab
    } else {
        console.warn(`Tab not found for category: ${category}`);
    }

    if (categoryDiv) {
        categoryDiv.classList.add("active"); // Show the blocks for this category
        populateBlockPalette(category); // Load the blocks into the div
    } else {
        console.warn(`Block category container not found for: ${category}`);
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

if (gridToggle && stage) {
    gridToggle.addEventListener("click", () => {
        stage.classList.toggle("show-grid");
    });
} else {
    console.warn("Grid toggle button or stage element not found.");
}


// ניקוי כל הבלוקים מאזור התכנות
const clearAllButton = document.getElementById("clear-all");
if (clearAllButton && programmingArea) {
    clearAllButton.addEventListener("click", () => {
        programmingArea.innerHTML = "";
    });
} else {
    console.warn("Clear all button or programming area not found.");
}

// אתחול הלוח עם הקטגוריה הפעילה הראשונה (מצא את הטאב הפעיל או ברירת מחדל)
let initialCategory = 'triggering'; // Default
const activeTab = document.querySelector(".category-tab.active");
if (activeTab) {
    initialCategory = activeTab.dataset.category;
}
handleCategoryChange(initialCategory); // Initialize with the correct category


// ========================================================================
// גרירה של הדמות
// ========================================================================

const character = document.getElementById('character');
// const stage = document.getElementById("stage"); // Already defined above

if (character && stage) {
    character.addEventListener('dragstart', (event) => {
        // Optional: Set data for potential drop targets, though not strictly needed for just moving on stage
        event.dataTransfer.setData('text/plain', 'character');
        // Optional: Style the ghost image (though default is usually fine)
        // event.dataTransfer.setDragImage(character, character.offsetWidth / 2, character.offsetHeight / 2);
        event.dataTransfer.effectAllowed = "move"; // Indicate the type of operation
        character.style.cursor = 'grabbing'; // Change cursor during drag
    });

    character.addEventListener('dragend', () => {
        character.style.cursor = 'grab'; // Restore cursor after drag
    });


    stage.addEventListener('dragover', (event) => {
        event.preventDefault(); // Necessary to allow the drop event
        event.dataTransfer.dropEffect = "move"; // Visual feedback to the user
    });

    stage.addEventListener('drop', (event) => {
        event.preventDefault(); // Prevent default browser action (like opening file)

        // Check if the dropped item is the character (or originated from it)
        // This check might be simple or complex depending on what else can be dragged
        // For now, assume only the character drag triggers this specific logic on the stage
        // A more robust check might involve checking event.dataTransfer.getData() if set in dragstart

        const stageRect = stage.getBoundingClientRect();
        const characterWidth = character.offsetWidth;
        const characterHeight = character.offsetHeight;

        // Calculate drop position relative to the stage, centered under the cursor
        let x = event.clientX - stageRect.left - characterWidth / 2;
        let y = event.clientY - stageRect.top - characterHeight / 2;

        // Constrain the character position within the stage boundaries
        x = Math.max(0, Math.min(x, stageRect.width - characterWidth));
        y = Math.max(0, Math.min(y, stageRect.height - characterHeight));

        // Update the character's position using style.left and style.top
        // Ensure the character's CSS position is 'absolute' or 'relative' within the stage
        character.style.left = x + 'px';
        character.style.top = y + 'px';

        character.style.cursor = 'grab'; // Restore cursor after drop
    });

} else {
    console.warn("Character or stage element not found for drag-and-drop functionality.");
}
