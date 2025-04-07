// ========================================================================
// הגדרת בלוקים (Blocks)
// ========================================================================

// משתנים חדשים לתיקון הגרירה
let dragOffsetX = 0;
let dragOffsetY = 0;
let isDragging = false; // הגדרה אחת בלבד של המשתנה

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
            name: "Stop",
            color: "var(--control-color)",
            type: "stop",
            icon: "assets/images/blocks/stop.svg",
        },
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
        }
    ],
    end: [
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
        // Use .item() for safer access to HTMLCollection items
        const draggedBlock = programmingArea.children.item(draggedBlockIndex);

        if (draggedBlock) {
             // Get the offset of the mouse relative to the dragged block
             const blockRect = draggedBlock.getBoundingClientRect();
             const offsetX = event.clientX - blockRect.left;
             const offsetY = event.clientY - blockRect.top;

            // No need to remove and re-append if just moving
            // programmingArea.removeChild(draggedBlock); // REMOVED

            // Find the drop location and update position
            const rect = programmingArea.getBoundingClientRect();
            draggedBlock.style.position = "absolute";
             // Adjust position based on where the mouse grabbed the block
            draggedBlock.style.left = `${event.clientX - rect.left - offsetX}px`;
            draggedBlock.style.top = `${event.clientY - rect.top - offsetY}px`;

            // programmingArea.appendChild(draggedBlock); // REMOVED - block is already in the area
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
            // Get the offset of the mouse relative to the dragged block
             const blockRect = newBlock.getBoundingClientRect();
             const offsetX = event.clientX - blockRect.left;
             const offsetY = event.clientY - blockRect.top;
             // Store the index AND the offset
             event.dataTransfer.setData('block-index', Array.from(programmingArea.children).indexOf(newBlock).toString());
            event.dataTransfer.effectAllowed = "move";
        });

        // הוספת הבלוק החדש לאזור התכנות
        programmingArea.appendChild(newBlock);

        // מיקום הבלוק החדש יחסי לאזור התכנות - מתחת לעכבר
        const rect = programmingArea.getBoundingClientRect();
        newBlock.style.position = "absolute"; // השתמש במיקום אבסולוטי
        // Use offsetWidth/offsetHeight *after* adding to DOM for accurate values
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
    // Add optional chaining for safety
    categoryDiv?.innerHTML = "";

    // Add optional chaining for safety
    blocks?.[category]?.forEach(block => {
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement); // Append inside the loop
    });
}

// פונקציה לטיפול בשינוי קטגוריה
function handleCategoryChange(category) {
    blockCategories.forEach(element => element.classList.remove("active"));
    categoryTabs.forEach(tab => tab.classList.remove("active"));

    // Add optional chaining for safety
    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    tab?.classList?.add("active");
    document.getElementById(`${category}-blocks`)?.classList?.add("active");
    populateBlockPalette(category);
}

// ========================================================================
//  לוגיקת גרירה ושחרור (Drag and Drop)
// ========================================================================

const programmingArea = document.getElementById("program-blocks");

// Check if programmingArea exists before adding listeners
if (programmingArea) {
    // טיפול באירוע גרירה מעל אזור התכנות (dragover)
    programmingArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    });

    // טיפול באירוע שחרור באזור התכנות (drop)
    programmingArea.addEventListener("drop", handleDrop);
} else {
    console.error("Element with ID 'program-blocks' not found.");
}


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

// Check if elements exist before adding listeners
if (gridToggle && stage) {
    gridToggle.addEventListener("click", () => {
        stage.classList.toggle("show-grid");
    });
} else {
    if (!gridToggle) console.error("Element with ID 'grid-toggle' not found.");
    if (!stage) console.error("Element with ID 'stage' not found.");
}


// ניקוי כל הבלוקים מאזור התכנות
const clearAllButton = document.getElementById("clear-all");
// Check if clearAllButton exists before adding listener
if (clearAllButton) {
    clearAllButton.addEventListener("click", () => {
        if (programmingArea) {
            programmingArea.innerHTML = "";
        }
    });
} else {
    console.error("Element with ID 'clear-all' not found.");
}


// אתחול הלוח עם הקטגוריה הפעילה הראשונה (only if elements exist)
if (categoryTabs.length > 0 && blockCategories.length > 0 && programmingArea) {
     // Ensure the first tab is active initially if needed
     const firstCategory = categoryTabs[0]?.dataset?.category;
     if (firstCategory) {
         handleCategoryChange(firstCategory); // Call handleCategoryChange to populate and set active
     } else {
        // Fallback or default category if the first tab has no category data
        populateBlockPalette("triggering"); // Or your default category
        document.getElementById("triggering-blocks")?.classList.add("active");
        document.querySelector('.category-tab[data-category="triggering"]')?.classList.add('active');
     }
}

// ========================================================================
// קוד מתוקן לגרירה של הדמות
// ========================================================================

// מקבל הפניה לאלמנט הדמות
const character = document.getElementById('character');

// Check if character and stage elements exist before proceeding
if (character && stage) {

    // פונקציה שמתחילה את הגרירה
    function startDrag(e) {
        // מנע התנהגות ברירת מחדל וברירת טקסט
        // Check if the event target is the character itself or a child
        // This prevents dragging if clicking on interactive elements *inside* the character later
        if (e.target !== character && !character.contains(e.target)) {
             return;
        }

        e.preventDefault();
        // e.stopPropagation(); // Usually not needed here, might interfere if needed elsewhere

        // חשוב מאוד - מחשב את הנקודה המדויקת שבה העכבר לחץ על הדמות
        const rect = character.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;

        // מפעיל מצב גרירה
        isDragging = true;

        // Optional: Add a class for visual feedback during drag
        character.classList.add('dragging');
        document.body.style.cursor = 'grabbing'; // Change cursor immediately

        // מאפשר לדמות להיגרר בחופשיות (already handled by class/cursor)
        // character.style.pointerEvents = 'none'; // Can cause issues with mouseup if not handled carefully

        // מוסיף שומרי אירועים זמניים למסמך כולו
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag, { once: true }); // Use { once: true } for automatic removal
        document.addEventListener('mouseleave', endDrag, { once: true }); // Handle leaving the window
    }

    // פונקציה שמבצעת את הגרירה
    function drag(e) {
        if (!isDragging) return;

        // No need for preventDefault/stopPropagation here usually in mousemove
        // e.preventDefault();
        // e.stopPropagation();

        const stageRect = stage.getBoundingClientRect();
        const characterWidth = character.offsetWidth;
        const characterHeight = character.offsetHeight;

        // חישוב המיקום החדש כך שהסמן יישאר במקום המדויק שבו התחיל את הגרירה
        let x = e.clientX - stageRect.left - dragOffsetX;
        let y = e.clientY - stageRect.top - dragOffsetY;

        // וידוא שהדמות נשארת בתוך גבולות הבמה
        x = Math.max(0, Math.min(x, stageRect.width - characterWidth));
        y = Math.max(0, Math.min(y, stageRect.height - characterHeight));

        // עדכון מיקום הדמות
        character.style.left = x + 'px';
        character.style.top = y + 'px';
    }

    // פונקציה שמסיימת את הגרירה
    function endDrag(e) {
        if (!isDragging) return;

        // חובה למנוע התנהגות ברירת מחדל גם בשחרור (less critical here, but good practice)
        // e.preventDefault();
        // e.stopPropagation();

        // מבטל את מצב הגרירה
        isDragging = false;

        // מחזיר את אירועי המצביע לדמות וסטייל
        // character.style.pointerEvents = 'auto'; // Reset if 'none' was used
        character.classList.remove('dragging');
        document.body.style.cursor = 'default'; // Reset cursor

        // מסיר את שומרי האירועים מהמסמך (automatically done with { once: true })
        document.removeEventListener('mousemove', drag);
        // document.removeEventListener('mouseup', endDrag); // Not needed with { once: true }
        // document.removeEventListener('mouseleave', endDrag); // Not needed with { once: true }

    }

    // מוסיף שומר אירועים להתחלת גרירה
    character.addEventListener('mousedown', startDrag);

    // Prevent browser's default drag behavior on the image/character
    character.addEventListener('dragstart', (e) => e.preventDefault());

} else {
     if (!character) console.error("Element with ID 'character' not found.");
     if (!stage) console.error("Element with ID 'stage' not found. Character dragging disabled.");
}
