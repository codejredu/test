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
// פונקציה מעודכנת ליצירת אלמנטי בלוקים עם תמונות SVG
// ========================================================================
function createBlockElement(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container");
    blockContainer.dataset.type = block.type;
    blockContainer.dataset.category = category;

    // יצירת אלמנט תמונה במקום div מעוצב
    const blockImage = document.createElement("img");
    blockImage.src = `assets/block/${block.type}.svg`; // שימוש בנתיב החדש לתמונות SVG
    blockImage.alt = block.name;
    blockImage.classList.add("block-svg-image");
    
    blockContainer.appendChild(blockImage);

    blockContainer.draggable = true;
    blockContainer.addEventListener("dragstart", (event) => {
        handleDragStart(event, block, category);
    });
    
    return blockContainer;
}

// ========================================================================
// עדכון הטיפול בגרירה והשמטה
// ========================================================================
function handleDragStart(event, block, category) {
    const data = {
        type: block.type,
        icon: `assets/block/${block.type}.svg`, // עדכון נתיב האייקון
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

    if (blockIndex !== undefined && blockIndex !== '') {
        const programmingArea = document.getElementById("program-blocks");
        const draggedBlockIndex = parseInt(blockIndex);
        if (draggedBlockIndex >= 0 && draggedBlockIndex < programmingArea.children.length) {
             const draggedBlock = programmingArea.children[draggedBlockIndex];
            if (draggedBlock) {
                const rect = programmingArea.getBoundingClientRect();
                draggedBlock.style.position = "absolute";
                draggedBlock.style.left = `${event.clientX - rect.left - (draggedBlock.offsetWidth / 2)}px`;
                draggedBlock.style.top = `${event.clientY - rect.top - (draggedBlock.offsetHeight / 2)}px`;
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

            // יצירת בלוק חדש עם הגדרה מלאה
            const newBlock = createBlockElement(blockDefinition, blockCategory);

            programmingArea.appendChild(newBlock);

            // הוספת מאזין גרירה לבלוק החדש בתוך אזור התכנות
             newBlock.addEventListener("dragstart", (e) => {
                  const index = Array.from(programmingArea.children).indexOf(newBlock);
                  e.dataTransfer.setData('block-index', index.toString());
                  e.dataTransfer.effectAllowed = "move";
             });

            // מיקום הבלוק החדש
            const rect = programmingArea.getBoundingClientRect();
            newBlock.style.position = "absolute";
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
// פונקציות אתחול
// ========================================================================
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
//  לוגיקת גרירה ושחרור (Drag and Drop) Setup
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
// Grid Toggle Setup
// ========================================================================
const gridToggle = document.getElementById("grid-toggle");
const stage = document.getElementById("stage");
if (gridToggle && stage) {
    gridToggle.addEventListener("click", () => {
        stage.classList.toggle("show-grid");
    });
}

// ========================================================================
// Clear All Button Setup
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
    
    // גילוי המיקום המדויק של הלחיצה
