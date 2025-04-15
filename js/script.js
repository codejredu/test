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
// Character Dragging - קוד גרירת דמות מתוקן
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
  const character = document.getElementById('character');
  const stage = document.getElementById('stage');
  
  if (!character || !stage) return;
  
  // 1. מרכוז הדמות במרכז הבמה
  function centerCharacterExactly() {
    // מאפס את כל המאפיינים שיכולים להפריע
    character.style.transform = 'none';
    character.style.transition = 'none';
    
    // מדידת הגדלים האמיתיים
    const stageRect = stage.getBoundingClientRect();
    const charRect = character.getBoundingClientRect();
    
    // חישוב המרכז
    const centerX = (stageRect.width - charRect.width) / 2;
    const centerY = (stageRect.height - charRect.height) / 2;
    
    // מיקום מדויק
    character.style.position = 'absolute';
    character.style.left = centerX + 'px';
    character.style.top = centerY + 'px';
    
    console.log('Character centered at:', centerX, centerY);
  }
  
  // קריאה למרכוז אחרי השהייה קטנה
  setTimeout(centerCharacterExactly, 500);
  
  // 2. תיקון גרירת דמות
  let isDragging = false;
  let offsetX, offsetY; // המרחק בין נקודת הלחיצה לפינה העליונה-שמאלית של הדמות
  
  // מניעת גרירה מובנית של HTML5
  character.addEventListener('dragstart', function(e) {
    if (e.target === character) {
      e.preventDefault();
      return false;
    }
  });
  
  // אירוע לחיצה
  character.addEventListener('mousedown', function(e) {
    if (e.target !== character) return;
    e.preventDefault();
    
    // גילוי המיקום המדויק של הלחיצה יחסית לפינת הדמות
    const charRect = character.getBoundingClientRect();
    offsetX = e.clientX - charRect.left;
    offsetY = e.clientY - charRect.top;
    
    isDragging = true;
    character.style.cursor = 'grabbing';
  });
  
  // אירוע תנועה
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    
    // מניעת ברירות מחדל שמפריעות לנו
    character.style.transform = 'none';
    character.style.transition = 'none';
    
    // חישוב מיקום חדש - המיקום של העכבר פחות ההיסט ופחות המיקום של הבמה
    const stageRect = stage.getBoundingClientRect();
    let newLeft = e.clientX - stageRect.left - offsetX;
    let newTop = e.clientY - stageRect.top - offsetY;
    
    // הגבלת גבולות פנימיים של הבמה
    const charRect = character.getBoundingClientRect();
    const maxLeft = stageRect.width - charRect.width;
    const maxTop = stageRect.height - charRect.height;
    
    // וידוא שלא חורגים מהגבולות
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    // עדכון מיקום
    character.style.left = newLeft + 'px';
    character.style.top = newTop + 'px';
    
    // דיבוג
    console.log('Position:', newLeft, newTop, 'Max:', maxLeft, maxTop);
  });
  
  // אירוע עזיבת לחצן
  document.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      character.style.cursor = 'grab';
    }
  });
});


// ========================================================================
// Initial Setup
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
