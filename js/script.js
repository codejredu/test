// ========================================================================
// הגדרת בלוקים (Blocks) - מעודכן לנתיבי קבצים חדשים
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "Green Flag",
            color: "var(--triggering-color)",
            type: "startOnGreenFlag",
            svgFile: "Start on Green Flag.svg"
        },
        {
            name: "Tap",
            color: "var(--triggering-color)",
            type: "startOnTap",
            svgFile: "Start on Tap.svg"
        },
        {
            name: "Bump",
            color: "var(--triggering-color)",
            type: "startOnBump",
            svgFile: "Start on Bump.svg"
        },
        {
            name: "Send Message",
            color: "var(--triggering-color)",
            type: "sendMessage",
            svgFile: "Send Message blue.svg"
        },
        {
            name: "Receive Message",
            color: "var(--triggering-color)",
            type: "startOnMessage",
            svgFile: "Send Message orange.svg" // משתמש בקובץ הכתום עבור קבלת הודעות
        },
    ],
    motion: [
        {
            name: "Move Right",
            color: "var(--motion-color)",
            type: "moveRight",
            svgFile: "Move Right.svg"
        },
        {
            name: "Move Left",
            color: "var(--motion-color)",
            type: "moveLeft",
            svgFile: "Move Left.svg"
        },
        {
            name: "Move Up",
            color: "var(--motion-color)",
            type: "moveUp",
            svgFile: "Move Up.svg"
        },
        {
            name: "Move Down",
            color: "var(--motion-color)",
            type: "moveDown",
            svgFile: "Move Down.svg"
        },
        {
            name: "Turn Right",
            color: "var(--motion-color)",
            type: "turnRight",
            svgFile: "Turn Right.svg"
        },
        {
            name: "Turn Left",
            color: "var(--motion-color)",
            type: "turnLeft",
            svgFile: "Turn Left.svg"
        },
        {
            name: "Hop",
            color: "var(--motion-color)",
            type: "hop",
            svgFile: "Hop.svg"
        },
        {
            name: "Go Home",
            color: "var(--motion-color)",
            type: "goHome",
            svgFile: "Go home.svg"
        },
    ],
    looks: [
        {
            name: "Say",
            color: "var(--looks-color)",
            type: "say",
            svgFile: "say.svg"
        },
        {
            name: "Grow",
            color: "var(--looks-color)",
            type: "grow",
            svgFile: "reset-size.svg" // אם אין קובץ ספציפי לגדילה, משתמשים בזה
        },
        {
            name: "Shrink",
            color: "var(--looks-color)",
            type: "shrink",
            svgFile: "Shrink.svg"
        },
        {
            name: "Reset Size",
            color: "var(--looks-color)",
            type: "resetSize",
            svgFile: "reset-size.svg"
        },
        {
            name: "Hide",
            color: "var(--looks-color)",
            type: "hide",
            svgFile: "hide.svg"
        },
        {
            name: "Show",
            color: "var(--looks-color)",
            type: "show",
            svgFile: "show.svg"
        },
    ],
    sound: [
        {
            name: "Play Sound",
            color: "var(--sound-color)",
            type: "popSound",
            svgFile: "pop.svg"
        },
        {
            name: "Play Recorded Sound",
            color: "var(--sound-color)",
            type: "playRecordedSound",
            svgFile: "Play Recorded Sound.svg"
        },
    ],
    control: [
        {
            name: "Stop",
            color: "var(--control-color)",
            type: "stop",
            svgFile: "Stop.svg"
        },
        {
            name: "Wait",
            color: "var(--control-color)",
            type: "wait",
            svgFile: "Wait.svg"
        },
        {
            name: "Set Speed",
            color: "var(--control-color)",
            type: "setSpeed",
            svgFile: "Set Speed.svg"
        },
        {
            name: "Repeat",
            type: "repeat",
            svgFile: "repeat.svg",
            color: "var(--control-color)"
        },
    ],
    end: [
        {
            name: "End",
            color: "var(--end-color)",
            type: "end",
            svgFile: "end.svg"
        },
        {
            name: "Repeat Forever",
            type: "repeatForever",
            svgFile: "repeat-forever.svg",
            color: "var(--end-color)"
        },
        {
            name: "Go To Page",
            color: "var(--end-color)",
            type: "goToPage",
            svgFile: "Go to page.svg"
        },
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

    // יצירת אלמנט תמונה SVG
    const blockImage = document.createElement("img");
    // שימוש בשם הקובץ המדויק שציינו
    blockImage.src = `assets/block/${block.svgFile}`;
    blockImage.alt = block.name;
    blockImage.classList.add("block-svg-image");
    
    // הוספת טיפול בשגיאות לטעינת התמונה
    blockImage.onerror = function() {
        console.warn(`SVG image not found: assets/block/${block.svgFile}`);
        // אם יש שגיאה, הצג שגיאה בקונסול אבל אל תעשה כלום אחר
        this.style.border = "2px dashed red"; // סימון ויזואלי לבעיה
        this.style.background = "#ffeeee";
    };
    
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
        svgFile: block.svgFile,
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
    
    // נקה את הבלוקים הקיימים
    categoryDiv.innerHTML = "";

    // בדוק אם יש בלוקים מוגדרים לקטגוריה זו
    if (!blocks[category] || blocks[category].length === 0) {
        console.warn(`No blocks defined for category ${category}`);
        return;
    }

    console.log(`Populating category: ${category} with ${blocks[category].length} blocks`);

    // צור את הבלוקים עבור הקטגוריה
    blocks[category].forEach(block => {
        console.log(`Creating block: ${block.name} (${block.svgFile})`);
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}

function handleCategoryChange(category) {
    console.log(`Changing category to: ${category}`);
    
    // הסר את המחלקה 'active' מכל הקטגוריות והכרטיסיות
    const categoryTabs = document.querySelectorAll(".category-tab");
    const blockCategories = document.querySelectorAll(".block-category");

    blockCategories.forEach(element => element.classList.remove("active"));
    categoryTabs.forEach(tab => tab.classList.remove("active"));

    // מצא את הכרטיסייה והקטגוריה המתאימות
    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    const categoryDiv = document.getElementById(`${category}-blocks`);

    // הוסף את המחלקה 'active' לכרטיסייה
    if (tab) {
        tab.classList.add("active");
        console.log('Activated tab:', tab.getAttribute('data-category'));
    } else {
        console.warn(`Tab not found for category: ${category}`);
    }

    // הוסף את המחלקה 'active' לקטגוריה ומלא אותה בבלוקים
    if (categoryDiv) {
        categoryDiv.classList.add("active");
        console.log('Activated category div:', categoryDiv.id);
        populateBlockPalette(category); // אכלס את הקטגוריה הפעילה
    } else {
        console.warn(`Block category container not found for: ${category}`);
    }
}

// ========================================================================
//  לוגיקת גרירה ושחרור (Drag and Drop) Setup
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    const programmingArea = document.getElementById("program-blocks");
    const categoryTabs = document.querySelectorAll(".category-tab");

    // וודא שאזור התכנות קיים לפני הוספת מאזינים
    if (programmingArea) {
        programmingArea.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        });
        
        programmingArea.addEventListener("drop", handleDrop);
        console.log("Drop handlers added to programming area");
    } else {
        console.error("Programming area element (#program-blocks) not found!");
    }

    // הוסף מאזיני אירועים לכרטיסיות הקטגוריות
    if (categoryTabs.length > 0) {
        categoryTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const category = tab.getAttribute('data-category');
                console.log(`Tab clicked: ${category}`);
                handleCategoryChange(category);
            });
        });
        console.log(`${categoryTabs.length} category tabs initialized`);
    } else {
        console.error("No category tabs found!");
    }

    // ========================================================================
    // Grid Toggle Setup
    // ========================================================================
    const gridToggle = document.getElementById("grid-toggle");
    const stage = document.getElementById("stage");
    if (gridToggle && stage) {
        gridToggle.addEventListener("click", () => {
            stage.classList.toggle("show-grid");
            console.log("Grid toggled");
        });
    }

    // ========================================================================
    // Clear All Button Setup
    // ========================================================================
    const clearAllButton = document.getElementById("clear-all");
    if (clearAllButton && programmingArea) {
        clearAllButton.addEventListener("click", () => {
            programmingArea.innerHTML = "";
            console.log("Programming area cleared");
        });
    }

    // ========================================================================
    // Character Dragging - קוד גרירת דמות
    // ========================================================================
    const character = document.getElementById('character');
    const stageElement = document.getElementById('stage');
    
    if (character && stageElement) {
        // מרכוז הדמות
        function centerCharacterExactly() {
            character.style.transform = 'none';
            character.style.transition = 'none';
            
            const stageRect = stageElement.getBoundingClientRect();
            const charRect = character.getBoundingClientRect();
            
            const centerX = (stageRect.width - charRect.width) / 2;
            const centerY = (stageRect.height - charRect.height) / 2;
            
            character.style.position = 'absolute';
            character.style.left = centerX + 'px';
            character.style.top = centerY + 'px';
            
            console.log('Character centered at:', centerX, centerY);
        }
        
        setTimeout(centerCharacterExactly, 500);
        
        // גרירת דמות
        let isDragging = false;
        let offsetX, offsetY;
        
        character.addEventListener('dragstart', function(e) {
            if (e.target === character) {
                e.preventDefault();
                return false;
            }
        });
        
        character.addEventListener('mousedown', function(e) {
            if (e.target !== character) return;
            e.preventDefault();
            
            const charRect = character.getBoundingClientRect();
            offsetX = e.clientX - charRect.left;
            offsetY = e.clientY - charRect.top;
            
            isDragging = true;
            character.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            character.style.transform = 'none';
            character.style.transition = 'none';
            
            const stageRect = stageElement.getBoundingClientRect();
            let newLeft = e.clientX - stageRect.left - offsetX;
            let newTop = e.clientY - stageRect.top - offsetY;
            
            const charRect = character.getBoundingClientRect();
            const maxLeft = stageRect.width - charRect.width;
            const maxTop = stageRect.height - charRect.height;
            
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            
            character.style.left = newLeft + 'px';
            character.style.top = newTop + 'px';
        });
        
        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                character.style.cursor = 'grab';
            }
        });
    }

    // ========================================================================
    // Initial Setup - אתחול התצוגה הראשונית
    // ========================================================================
    
    // מצא את הכרטיסייה הפעילה כרגע או השתמש ב-'triggering' כברירת מחדל
    let initialCategory = 'triggering';
    const activeTab = document.querySelector(".category-tab.active");
    
    if (activeTab && activeTab.getAttribute('data-category')) {
        initialCategory = activeTab.getAttribute('data-category');
        console.log(`Found active tab: ${initialCategory}`);
    } else {
        // אם אין כרטיסייה פעילה, הפעל את 'triggering'
        const triggeringTab = document.querySelector('.category-tab[data-category="triggering"]');
        if (triggeringTab) {
            triggeringTab.classList.add('active');
            console.log("No active tab found, activating triggering tab");
        }
    }
    
    // אתחל את התצוגה עם הקטגוריה הראשונית
    handleCategoryChange(initialCategory);
    console.log(`Initial category set to: ${initialCategory}`);
});
