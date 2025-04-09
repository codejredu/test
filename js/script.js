// ========================================================================
// הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        // ... (triggering blocks remain the same)
        {
            name: "Green Flag",
            color: "var(--triggering-color)",
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
        // ... (motion blocks remain the same)
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
        // ... (looks blocks remain the same)
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
        // ... (sound blocks remain the same)
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
        // --- START OF CONTROL BLOCKS ---
        // --- MOVED THE STOP BLOCK TO BE FIRST ---
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
        },
        // --- END OF CONTROL BLOCKS ---
    ],
    end: [
        // --- START OF END BLOCKS ---
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
            color: "var(--end-color)"
        },
        {
            name: "Go To Page",
            color: "var(--end-color)",
            type: "goToPage",
            icon: "assets/images/blocks/go-to-page.svg",
        },
        // --- END OF END BLOCKS ---
    ],
};

// ========================================================================
// פונקציות ליצירת אלמנטים (no changes needed here from previous version)
// ========================================================================
// ... (rest of the create functions: createRightConnector, createLeftConnector, createScratchBlock, createBlockElement) ...
function createRightConnector(color) {
    const rightConnector = document.createElement("div");
    rightConnector.classList.add("right-connector");
    rightConnector.style.backgroundColor = color;
    return rightConnector;
}
function createLeftConnector() {
    const leftConnectorWrapper = document.createElement("div");
    leftConnectorWrapper.classList.add("left-connector-wrapper");
    const leftConnector = document.createElement("div");
    leftConnector.classList.add("left-connector");
    leftConnectorWrapper.appendChild(leftConnector);
    return leftConnectorWrapper;
}
function createScratchBlock(block) {
    const scratchBlock = document.createElement("div");
    scratchBlock.classList.add("scratch-block");
    // Color is now mainly set by CSS based on category/type, but we can keep this as fallback/initial
    scratchBlock.style.backgroundColor = block.color;
    const iconImg = document.createElement("img");
    iconImg.src = block.icon;
    iconImg.alt = block.name;
    iconImg.classList.add("block-icon-img");
    scratchBlock.appendChild(iconImg);
    return scratchBlock;
}
function createBlockElement(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container");
    blockContainer.dataset.type = block.type; // Ensure type is set for styling (e.g., repeat)
    blockContainer.dataset.category = category; // Store category info

    const scratchBlock = createScratchBlock(block);
    blockContainer.appendChild(scratchBlock);

    blockContainer.draggable = true;
    blockContainer.addEventListener("dragstart", (event) => {
        handleDragStart(event, block, category);
    });
    return blockContainer;
}


// ========================================================================
// פונקציות טיפול באירועים (no changes needed here from previous version)
// ========================================================================
// ... (rest of the event handlers: handleDragStart, handleDrop) ...
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

function handleDrop(event) {
    event.preventDefault();
    const blockIndex = event.dataTransfer.getData('block-index');

    if (blockIndex !== undefined && blockIndex !== '') { // Check if blockIndex is valid
        const programmingArea = document.getElementById("program-blocks");
        const draggedBlockIndex = parseInt(blockIndex);
        // Ensure the index is valid before trying to access the element
        if (draggedBlockIndex >= 0 && draggedBlockIndex < programmingArea.children.length) {
             const draggedBlock = programmingArea.children[draggedBlockIndex];
            if (draggedBlock) {
                const rect = programmingArea.getBoundingClientRect();
                draggedBlock.style.position = "absolute";
                draggedBlock.style.left = `${event.clientX - rect.left - (draggedBlock.offsetWidth / 2)}px`;
                draggedBlock.style.top = `${event.clientY - rect.top - (draggedBlock.offsetHeight / 2)}px`;
                // No need to remove/append if just moving within the same container
            }
        } else {
             console.warn("Invalid block index received during drop:", blockIndex);
        }

    } else {
        const programmingArea = document.getElementById("program-blocks");
        const dataString = event.dataTransfer.getData("text/plain");
         if (!dataString) {
             console.error("No data transferred on drop.");
             return;
         }
        try {
            const data = JSON.parse(dataString);
            const blockCategory = data.category;
            const blockDefinition = blocks[blockCategory]?.find(b => b.type === data.type);

            if (!blockDefinition) {
                 console.error("Could not find block definition for dropped item:", data);
                 return;
            }

            // Create new block element using the full definition
            const newBlock = createBlockElement(blockDefinition, blockCategory);

            programmingArea.appendChild(newBlock);

            // Add drag listener for the new block within the programming area
             newBlock.addEventListener("dragstart", (e) => {
                  // Find the index *after* appending
                  const index = Array.from(programmingArea.children).indexOf(newBlock);
                  e.dataTransfer.setData('block-index', index.toString());
                  e.dataTransfer.effectAllowed = "move";
             });

            // Position the new block
            const rect = programmingArea.getBoundingClientRect();
            newBlock.style.position = "absolute";
            // Use offsetWidth/Height *after* appending to DOM
            const blockWidth = newBlock.offsetWidth || 100;
            const blockHeight = newBlock.offsetHeight || 100;
            newBlock.style.left = `${event.clientX - rect.left - (blockWidth / 2)}px`;
            newBlock.style.top = `${event.clientY - rect.top - (blockHeight / 2)}px`;
        } catch (e) {
            console.error("Error parsing dropped data or creating block:", e, dataString);
        }
    }
}


// ========================================================================
// פונקציות אתחול (no changes needed here from previous version)
// ========================================================================
// ... (populateBlockPalette, handleCategoryChange) ...
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    if (!categoryDiv) {
        console.error(`Category div not found for ${category}`);
        return;
    }
    categoryDiv.innerHTML = ""; // Clear existing blocks

    if (!blocks[category]) {
        console.warn(`No blocks defined for category ${category}`); // Use warn instead of error if it might be intentional
        return;
    }

    console.log(`Populating category: ${category} with`, blocks[category]); // Debug log

    blocks[category].forEach(block => {
        console.log(`Creating element for: ${block.name}`); // Debug log
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}

function handleCategoryChange(category) {
    const categoryTabs = document.querySelectorAll(".category-tab");
    const blockCategories = document.querySelectorAll(".block-category");

    console.log(`Changing category to: ${category}`); // Debug log

    blockCategories.forEach(element => element.classList.remove("active"));
    categoryTabs.forEach(tab => tab.classList.remove("active"));

    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    const categoryDiv = document.getElementById(`${category}-blocks`);

    if (tab) {
        tab.classList.add("active");
        console.log('Activated tab:', tab); // Debug log
    } else {
        console.warn(`Tab not found for category: ${category}`);
    }

    if (categoryDiv) {
        categoryDiv.classList.add("active");
        console.log('Activated category div:', categoryDiv); // Debug log
        populateBlockPalette(category); // Populate the now active category
    } else {
        console.warn(`Block category container not found for: ${category}`);
    }
}


// ========================================================================
//  לוגיקת גרירה ושחרור (Drag and Drop) Setup (no changes needed here from previous version)
// ========================================================================
const programmingArea = document.getElementById("program-blocks");
const categoryTabs = document.querySelectorAll(".category-tab");
const blockCategories = document.querySelectorAll(".block-category"); // Define these earlier if needed

// Ensure programmingArea exists before adding listeners
if (programmingArea) {
    programmingArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    });
    programmingArea.addEventListener("drop", handleDrop);
} else {
    console.error("Programming area element (#program-blocks) not found!");
}

categoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const category = tab.dataset.category;
        handleCategoryChange(category);
    });
});

// ========================================================================
// Grid Toggle Setup (no changes needed here from previous version)
// ========================================================================
const gridToggle = document.getElementById("grid-toggle");
const stage = document.getElementById("stage");
if (gridToggle && stage) {
    gridToggle.addEventListener("click", () => {
        stage.classList.toggle("show-grid");
    });
}

// ========================================================================
// Clear All Button Setup (no changes needed here from previous version)
// ========================================================================
const clearAllButton = document.getElementById("clear-all");
if (clearAllButton && programmingArea) { // Check if programmingArea exists
    clearAllButton.addEventListener("click", () => {
        programmingArea.innerHTML = "";
    });
}

// ========================================================================
// Character Dragging (no changes needed here from previous version)
// ========================================================================
const character = document.getElementById('character');
// const stage = document.getElementById("stage"); // Already defined

if (character && stage) {
    character.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', 'character');
        event.dataTransfer.effectAllowed = "move";
        character.style.cursor = 'grabbing';
    });

    character.addEventListener('dragend', () => {
        character.style.cursor = 'grab';
    });

    stage.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    });

    stage.addEventListener('drop', (event) => {
        event.preventDefault();
        // Simple check: if data is 'character', move it. Could be more robust.
        if (event.dataTransfer.getData('text/plain') === 'character') {
             const stageRect = stage.getBoundingClientRect();
             const characterWidth = character.offsetWidth;
             const characterHeight = character.offsetHeight;

             let x = event.clientX - stageRect.left - characterWidth / 2;
             let y = event.clientY - stageRect.top - characterHeight / 2;

             x = Math.max(0, Math.min(x, stageRect.width - characterWidth));
             y = Math.max(0, Math.min(y, stageRect.height - characterHeight));

             character.style.left = x + 'px';
             character.style.top = y + 'px';
             character.style.cursor = 'grab';
        }
    });
}


// ========================================================================
// Initial Setup (no changes needed here from previous version)
// ========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Find the initially active tab or default to 'triggering'
    let initialCategory = 'triggering';
    const activeTab = document.querySelector(".category-tab.active");
    if (activeTab && activeTab.dataset.category) {
        initialCategory = activeTab.dataset.category;
    } else {
        // If no tab is active initially, make the 'triggering' tab active
        const triggeringTab = document.querySelector('.category-tab[data-category="triggering"]');
        if (triggeringTab) {
            triggeringTab.classList.add('active');
        }
    }
    // Ensure the DOM is ready before trying to manipulate it
    handleCategoryChange(initialCategory);
});
--- START OF FILE style.css ---
/* style.css - עם צבעים מעודכנים לילדי גן */
:root {
    --motion-color: #66D2FF;    /* כחול-תכלת בהיר */
    --triggering-color: #FFE866; /* צהוב בננה רך */
    --looks-color: #D295F6;     /* סגול לבנדר רך */
    --sound-color: #7ED957;     /* ירוק תפוח בהיר */
    --control-color: #FFBD67;   /* כתום אפרסק */
    --end-color: #FF6B6B;       /* אדום קורל רך */
}

body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f0f4ff;
    direction: ltr; /* Make sure direction is LTR */
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
    background: none;
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
    width: 100px;
    height: 100px;
    position: absolute;
    object-fit: contain;
    cursor: grab;
    transition: all 0.1s ease-out;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.palette-and-programming {
    display: flex;
    flex-direction: column;
    flex: 1;
}

#block-palette {
    background-color: #f0f0f0; /* Gray background as requested */
    border: 1px solid #e0e0e0;
    margin: 10px;
    padding: 10px;
    border-radius: 10px;
    height: 105px; /* Fixed height of 114px as requested */
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow: hidden; /* Prevent content from overflowing */
}

.category-tabs {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-bottom: 0;
    height: 100%;
    align-content: flex-start;
    background-color: #f0f0f0; /* Gray background behind tabs */
}

.category-tab {
    border: none;
    padding: 0;
    margin-left: 5px;
    margin-bottom: 5px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 16px;
    color: #000000;
    width: 80px;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
}

.category-tab img {
    max-width: 60%;
    max-height: 60%;
    pointer-events: none;

}

.category-tab[data-category="triggering"] {
    background-color: var(--triggering-color);
}

.category-tab[data-category="motion"] {
    background-color: var(--motion-color);
}

.category-tab[data-category="looks"] {
    background-color: var(--looks-color);
}

.category-tab[data-category="sound"] {
    background-color: var(--sound-color);
}

.category-tab[data-category="control"] {
    background-color: var(--control-color);
}

.category-tab[data-category="end"] {
    background-color: var(--end-color);
}

.block-category {
    display: none;
    padding: 10px;
    flex-grow: 1;
    height: 100%;
    border-right: 1px solid #e0e0e0;
    margin-left: 0px; /* Remove margin-left to align with tabs */
    background-color: #0D66CA; /* blue background behind programming blocks */
}

.block-category.active {
    display: flex;
    flex-wrap: wrap;
    padding: 10px;
    background-color: #0D66CA; /* blue background behind programming blocks */
}

#programming-area {
    background-color: #fff;
    border: 1px solid #e0e0e0;
    margin: 10px;
    padding: 10px;
    border-radius: 10px;
    flex: 2; /* Increased to make programming area taller */
    min-height: 200px; /* Set minimum height */
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
    min-height: 180px; /* Increased height */
    border: 1px dashed #ccc;
    padding: 10px;
    position: relative;
}

#program-blocks .block-container {
    position: absolute;
}

.logo {
    font-size: 20px;
    font-weight: bold;
    color: #4a90e2;
}

/* עיצוב לאזור האייקונים בכותרת */
.header-icons {
    display: flex;
    align-items: center;
}

/* עיצוב לכל אייקון בכותרת */
.icon {
    margin-left: 13px;
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: none;
    outline: none;
    position: relative;
    background-color: transparent;
    /* הסרת הבורדר השחור וההצללה */
    box-shadow: none;
}

/* עיצוב ספציפי לאייקון הרשת (grid) */
#grid-toggle {
    margin-left: 13px;
    width: 50px;
    height: 50px;
    border: none;
    outline: none;
    padding: 0;
    /* הסרת המסגרת שראינו בתמונה */
    background-color: transparent;
    border-radius: 0;
}

/* עיצוב לתמונות בתוך האייקונים */
.header-icon-img {
    width: 45px;
    height: 45px;
    object-fit: contain;
    border: none;
    outline: none;
}

/* עיצוב כשהעכבר מרחף מעל האייקון */
.icon:hover {
    background-color: #f0f0f0;
    border-radius: 8px;
}

/* הסרת מאפיינים מיותרים שהיו בכותרת */
#grid-toggle:hover {
    background-color: #f0f0f0;
    border-radius: 8px;
}

#block-palette .block-container,
#programming-area .block-container {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 8px;
    cursor: pointer;
    background-color: transparent;
}

#block-palette .scratch-block,
#programming-area .scratch-block {
    position: relative;
    width: 87px;
    height: 80px;
    background-color: #ffff00; /* צבע ברירת מחדל, ידרוס ע"י כללים ספציפיים */
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: black;
    font-size: 24px;
    font-weight: bold;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

/* SVG Icon styling */
.block-svg-icon {
    width: 40px;
    height: 40px;
    display: block;
    margin: 0 auto;
}

/* בליטות/שקעים סטנדרטיים (לא בבלוק repeat ולא בבלוקים מקטגורית end) */
#block-palette .scratch-block:not([data-category="end"])::after,
#programming-area .scratch-block:not([data-type="repeat"]):not([data-category="end"])::after {
    content: '';
    position: absolute;
    right: -9px; /* שינוי מ-14px ל-9px כדי ליצור חצי עיגול */
    top: 50%;
    transform: translateY(-50%);
    width: 9px; /* שינוי מ-18px ל-9px (חצי מהרוחב המקורי) */
    height: 18px; /* נשאר הגובה המקורי */
    background-color: inherit;
    border-radius: 0 9px 9px 0; /* שינוי מ-50% (עיגול מלא) לחצי עיגול בצד ימין */
}

/* Change the full circle to half circle on the left side */
#block-palette .scratch-block:not([data-category="end"])::before,
#programming-area .scratch-block:not([data-type="repeat"]):not([data-category="end"])::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 9px; /* Half the original width of 18px */
    height: 18px; /* Keep the original height */
    background-color: #f0f4ff; /* Keep the background color */
    border-radius: 0 9px 9px 0; /* Make only the right side rounded */
}

.block-icon {
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 5px;
}

.block-icon svg {
    width: 200%;
    height: 200%;
}

.block-icon-img {
    max-width: 60%;
    max-height: 60%;
    display: block;
    margin: auto; /* Center the image */
}


#triggering-blocks .block-container .scratch-block {
    background-color: var(--triggering-color);
}

#motion-blocks .block-container .scratch-block {
    background-color: var(--motion-color);
}

#looks-blocks .block-container .scratch-block {
    background-color: var(--looks-color);
}

#sound-blocks .block-container .scratch-block {
    background-color: var(--sound-color);
}

#control-blocks .block-container .scratch-block {
    background-color: var(--control-color);
}

#end-blocks .block-container .scratch-block {
    background-color: var(--end-color);
}

/* תיקונים לצבעי הבלוקים בקטגוריה פעילה */
.block-category.active .scratch-block {
    background-color: inherit;
}
#triggering-blocks.active .block-container .scratch-block {
    background-color: var(--triggering-color);
}
#motion-blocks.active .block-container .scratch-block {
    background-color: var(--motion-color);
}
#looks-blocks.active .block-container .scratch-block {
    background-color: var(--looks-color);
}
#sound-blocks.active .block-container .scratch-block {
    background-color: var(--sound-color);
}
#control-blocks.active .block-container .scratch-block:not([data-type="repeat"]) { /* הוספנו :not */
    background-color: var(--control-color);
}
#end-blocks.active .block-container .scratch-block {
    background-color: var(--end-color);
}

/* --- סגנון מיוחד לבלוק Repeat --- */

/* עיצוב הבלוק הכתום עם חצי לבן שמאלי + חצי לבן הפוך (פונה ימינה) צמוד לימין הלבן ומוזז */
#control-blocks .block-container[data-type="repeat"] .scratch-block,
#programming-area .block-container[data-type="repeat"] .scratch-block {
  position: relative;

  /* הגדרת הרקע המרובה החדשה */
  background:
    /* 1. שכבה עליונה: חצי עיגול לבן (בקצה השמאלי של הכתום) */
    radial-gradient(circle at 0% 50%, white 10px, transparent 10.5px) no-repeat center left 0px / 10px 20px,

    /* 2. שכבה שניה: חצי עיגול לבן (פונה ימינה, צמוד לימין הלבן ומוזז) */
    /*    מיקום אזור הרקע: אופקי = calc(50% + 45px), אנכי = 40px */
    radial-gradient(circle at 0% 50%, white 10px, transparent 10.5px) no-repeat calc(50% + 45px) 40px / 10px 20px, /* <-- שינוי: --looks-color ל-white */

    /* 3. שכבה תחתונה: צבע הרקע הכתום המקורי */
    var(--control-color);

  /* שאר ההגדרות של הבלוק הכתום */
  width: 140px;
  border-radius: 10px 10px 10px 10px;
  padding-right: 10px;
  padding-left: 15px;
  text-align: center;
  font-size: 20px;
  overflow: visible;
  height: 80px;
  color: black;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

/* הבליטה הימנית של בלוק repeat */
#control-blocks .block-container[data-type="repeat"] .scratch-block::after,
#programming-area .block-container[data-type="repeat"] .scratch-block::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -10px;
  transform: translateY(-50%);
  width: 10px; /* שינוי מ-20px ל-10px (חצי מהרוחב) */
  height: 20px; /* נשאר הגובה המקורי */
  background-color: inherit;
  border-radius: 0 10px 10px 0; /* שינוי לחצי עיגול בצד ימין בלבד */
  box-shadow: 3px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 2; /* מעל הרקע, מתחת למלבן הלבן (::before) */
}

/* מיקום איקון (אם יש) בבלוק repeat */
#control-blocks .block-container[data-type="repeat"] .scratch-block .block-icon-img,
#programming-area .block-container[data-type="repeat"] .scratch-block .block-icon-img {
  position: absolute !important;
  top: 5px !important;
  right: 5px !important;
  height: auto !important;
  width: auto !important;
  transform: scale(0.5) !important;
  transform-origin: top right !important;
  z-index: 3 !important; /* מעל הכל */
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* הגדרת המלבן הלבן (::before) עם חצי עיגול כתום שמאלי */
#control-blocks .block-container[data-type="repeat"] .scratch-block::before,
#programming-area .block-container[data-type="repeat"] .scratch-block::before {
  content: '' !important; /* דרוס את content:none המקורי */
  position: absolute;
  top: 20px; /* מרווח מהחלק העליון של הבלוק הכתום */
  bottom: 0; /* צמוד לתחתית הבלוק הכתום */
  left: 50%;
  transform: translateX(-50%); /* מרכוז אופקי */
  width: 80px;
  height: auto; /* גובה דינמי */

  /* רקע: חצי כתום שמאלי + לבן */
  background:
    /* 1. שכבה עליונה: חצי עיגול כתום (פונה ימינה) */
    radial-gradient(circle at 0% 50%, var(--control-color) 10px, transparent 10.5px) no-repeat left center / 10px 20px,
    /* 2. שכבה תחתונה: צבע הרקע הלבן */
    white;

  /* עיגול הפינות העליונות של המלבן הלבן עצמו */
  border-radius: 10px 10px 0 0;

  z-index: 10; /* מעל הבלוק הכתום והבליטה הימנית שלו */
  box-shadow: none; /* הסר צל מיותר */
}

/* --- עיצוב מיוחד לבלוקי END --- */
/* סגנון לרוחב מוקטן ופינות מעוגלות בבלוקי END */
#end-blocks .block-container .scratch-block,
#programming-area .block-container[data-category="end"] .scratch-block {
     width: 67px !important;/* רוחב מוקטן מ-87px */
    height: 80px;
    border-radius: 10px 30px 30px 10px; /* פינות מעוגלות בהתאמה */
    padding-right: 10px; /* מרווח מימין */
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--end-color);
}

/* החזרת השקע הסטנדרטי בצד שמאל */
#end-blocks .block-container .scratch-block::before,
#programming-area .block-container[data-category="end"] .scratch-block::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 9px; /* חצי מהרוחב המקורי של 18px */
    height: 18px; /* הגובה המקורי */
    background-color: #f0f4ff; /* צבע הרקע */
    border-radius: 0 9px 9px 0; /* רק הצד הימני מעוגל */
    z-index: 2;
}

/* הסרת הבליטה הסטנדרטית בצד ימין */
#end-blocks .block-container .scratch-block::after,
#programming-area .block-container[data-category="end"] .scratch-block::after {
    content: none; /* הסרת הבליטה בצד ימין */
}

/* מרכוז האיקון בתוך הבלוק */
#end-blocks .block-container .scratch-block .block-icon-img,
#programming-area .block-container[data-category="end"] .scratch-block .block-icon-img {
    margin: 0 auto;
    display: block;
    position: relative;
}

/* התאמת מיכל הבלוק לרוחב המוקטן */
#end-blocks .block-container,
#programming-area .block-container[data-category="end"] {
    width: 80px; /* התאמת רוחב המיכל לבלוק המוקטן */
}

/* סגנון מיוחד ללחצן רקע */
.header-icons .background-button {
    width: 70px;
    height: 70px;
}

.header-icons .background-button .header-icon-img {
    width: 60px;
    height: 60px;
}
