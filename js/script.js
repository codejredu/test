// ========================================================================
// הגדרת בלוקים (Blocks) עם שמות הקבצים המדויקים
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "Green Flag",
            type: "startOnGreenFlag",
            svgFile: "Start on Green Flag.svg"
        },
        {
            name: "Tap",
            type: "startOnTap",
            svgFile: "Start on Tap.svg"
        },
        {
            name: "Bump",
            type: "startOnBump",
            svgFile: "Start on Bump.svg"
        },
        {
            name: "Send Message",
            type: "sendMessage",
            svgFile: "Send Message blue.svg"
        },
        {
            name: "Receive Message",
            type: "startOnMessage",
            svgFile: "Send Message orange.svg"
        },
    ],
    motion: [
        {
            name: "Move Right",
            type: "moveRight",
            svgFile: "Move Right.svg"
        },
        {
            name: "Move Left",
            type: "moveLeft",
            svgFile: "Move Left.svg"
        },
        {
            name: "Move Up",
            type: "moveUp",
            svgFile: "Move Up.svg"
        },
        {
            name: "Move Down",
            type: "moveDown",
            svgFile: "Move Down.svg"
        },
        {
            name: "Turn Right",
            type: "turnRight",
            svgFile: "Turn Right.svg"
        },
        {
            name: "Turn Left",
            type: "turnLeft",
            svgFile: "Turn Left.svg"
        },
        {
            name: "Hop",
            type: "hop",
            svgFile: "Hop.svg"
        },
        {
            name: "Go Home",
            type: "goHome",
            svgFile: "Go home.svg"
        },
    ],
    looks: [
        {
            name: "Say",
            type: "say",
            svgFile: "say.svg"
        },
        {
            name: "Grow",
            type: "grow",
            svgFile: "reset-size.svg"
        },
        {
            name: "Shrink",
            type: "shrink",
            svgFile: "Shrink.svg"
        },
        {
            name: "Reset Size",
            type: "resetSize",
            svgFile: "reset-size.svg"
        },
        {
            name: "Hide",
            type: "hide",
            svgFile: "hide.svg"
        },
        {
            name: "Show",
            type: "show",
            svgFile: "show.svg"
        },
    ],
    sound: [
        {
            name: "Play Sound",
            type: "popSound",
            svgFile: "pop.svg"
        },
        {
            name: "Play Recorded Sound",
            type: "playRecordedSound",
            svgFile: "Play Recorded Sound.svg"
        },
    ],
    control: [
        {
            name: "Stop",
            type: "stop",
            svgFile: "Stop.svg"
        },
        {
            name: "Wait",
            type: "wait",
            svgFile: "Wait.svg"
        },
        {
            name: "Set Speed",
            type: "setSpeed",
            svgFile: "Set Speed.svg"
        },
        {
            name: "Repeat",
            type: "repeat",
            svgFile: "repeat.svg",
            isSpecial: true
        },
    ],
    end: [
        {
            name: "End",
            type: "end",
            svgFile: "end.svg"
        },
        {
            name: "Repeat Forever",
            type: "repeatForever",
            svgFile: "repeat-forever.svg"
        },
        {
            name: "Go To Page",
            type: "goToPage",
            svgFile: "Go to page.svg"
        },
    ],
};

// ========================================================================
// פונקציה ליצירת אלמנט בלוק
// ========================================================================
function createBlockElement(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container");
    blockContainer.dataset.type = block.type;
    blockContainer.dataset.category = category;

    // יצירת אלמנט תמונה לבלוק
    const blockImage = document.createElement("img");
    blockImage.src = `assets/block/${block.svgFile}`;
    blockImage.alt = block.name;
    blockImage.classList.add("block-svg-image");
    
    // טיפול בשגיאות טעינת תמונה
    blockImage.onerror = function() {
        console.warn(`SVG image not found: assets/block/${block.svgFile}`);
        this.style.border = "2px dashed red";
        this.style.background = "#ffeeee";
    };
    
    blockContainer.appendChild(blockImage);

    // הוספת מאפייני גרירה
    blockContainer.draggable = true;
    blockContainer.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", JSON.stringify({
            type: block.type,
            category: category,
            name: block.name
        }));
        event.dataTransfer.effectAllowed = "move";
    });
    
    return blockContainer;
}

// ========================================================================
// פונקציה למילוי הקטגוריה בבלוקים
// ========================================================================
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    if (!categoryDiv) {
        console.error(`Category div not found for ${category}`);
        return;
    }
    
    // ניקוי הבלוקים הקיימים
    categoryDiv.innerHTML = "";

    // בדיקה אם יש בלוקים לקטגוריה
    if (!blocks[category] || blocks[category].length === 0) {
        console.warn(`No blocks defined for category ${category}`);
        return;
    }

    console.log(`Populating category: ${category} with ${blocks[category].length} blocks`);

    // יצירת הבלוקים והוספתם לקטגוריה
    blocks[category].forEach(block => {
        console.log(`Creating block: ${block.name} (${block.svgFile})`);
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}

// ========================================================================
// פונקציה לטיפול בשינוי קטגוריה עם עדכון צבע הרקע
// ========================================================================
function handleCategoryChange(category) {
    console.log(`Changing category to: ${category}`);
    
    // הסרת מחלקת active מכל הקטגוריות והכרטיסיות
    const categoryTabs = document.querySelectorAll(".category-tab");
    const blockCategories = document.querySelectorAll(".block-category");

    blockCategories.forEach(element => element.classList.remove("active"));
    categoryTabs.forEach(tab => tab.classList.remove("active"));

    // הוספת מחלקת active לקטגוריה שנבחרה
    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    const categoryDiv = document.getElementById(`${category}-blocks`);

    if (tab) {
        tab.classList.add("active");
        console.log('Activated tab:', tab.getAttribute('data-category'));
    } else {
        console.warn(`Tab not found for category: ${category}`);
    }

    if (categoryDiv) {
        categoryDiv.classList.add("active");
        console.log('Activated category div:', categoryDiv.id);
        
        // עדכון צבע הגבול של מכל הבלוקים
        const blockPalette = document.getElementById("block-palette");
        if (blockPalette) {
            // שימוש בצבע המתאים לקטגוריה
            const categoryColor = getCategoryColor(category);
            blockPalette.style.borderColor = categoryColor;
        }
        
        // מילוי הקטגוריה בבלוקים
        populateBlockPalette(category);
    } else {
        console.warn(`Block category container not found for: ${category}`);
    }
}

// ========================================================================
// פונקציית עזר לקבלת הצבע המתאים לקטגוריה
// ========================================================================
function getCategoryColor(category) {
    switch(category) {
        case 'triggering': return getComputedStyle(document.documentElement).getPropertyValue('--triggering-color');
        case 'motion': return getComputedStyle(document.documentElement).getPropertyValue('--motion-color');
        case 'looks': return getComputedStyle(document.documentElement).getPropertyValue('--looks-color');
        case 'sound': return getComputedStyle(document.documentElement).getPropertyValue('--sound-color');
        case 'control': return getComputedStyle(document.documentElement).getPropertyValue('--control-color');
        case 'end': return getComputedStyle(document.documentElement).getPropertyValue('--end-color');
        default: return '#f0f0f0'; // צבע ברירת מחדל
    }
}

// ========================================================================
// פונקציה לטיפול בהשמטת בלוק באזור התכנות
// ========================================================================
function handleDrop(event) {
    event.preventDefault();
    
    // בדיקה אם מדובר בהזזת בלוק קיים
    const blockIndex = event.dataTransfer.getData('block-index');
    if (blockIndex !== undefined && blockIndex !== '') {
        // הזזת בלוק קיים
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
        }
    } else {
        // יצירת בלוק חדש
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
                console.error("Could not find block definition:", data);
                return;
            }
            
            // יצירת בלוק חדש והוספתו לאזור התכנות
            const newBlock = createBlockElement(blockDefinition, blockCategory);
            programmingArea.appendChild(newBlock);
            
            // הוספת מאזין גרירה לבלוק החדש
            newBlock.addEventListener("dragstart", (e) => {
                const index = Array.from(programmingArea.children).indexOf(newBlock);
                e.dataTransfer.setData('block-index', index.toString());
                e.dataTransfer.effectAllowed = "move";
            });
            
            // מיקום הבלוק החדש
            const rect = programmingArea.getBoundingClientRect();
            newBlock.style.position = "absolute";
            const blockWidth = newBlock.offsetWidth || 100;
            const blockHeight = newBlock.offsetHeight || 80;
            newBlock.style.left = `${event.clientX - rect.left - (blockWidth / 2)}px`;
            newBlock.style.top = `${event.clientY - rect.top - (blockHeight / 2)}px`;
            
        } catch (e) {
            console.error("Error parsing dropped data:", e);
        }
    }
}

// ========================================================================
// אתחול כללי - מופעל כשה-DOM נטען
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    // אתחול אזור התכנות
    const programmingArea = document.getElementById("program-blocks");
    if (programmingArea) {
        programmingArea.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        });
        
        programmingArea.addEventListener("drop", handleDrop);
        console.log("Programming area initialized");
    } else {
        console.error("Programming area element not found!");
    }
    
    // אתחול כרטיסיות הקטגוריות
    const categoryTabs = document.querySelectorAll(".category-tab");
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
    
    // אתחול כפתור הרשת
    const gridToggle = document.getElementById("grid-toggle");
    const stage = document.getElementById("stage");
    if (gridToggle && stage) {
        gridToggle.addEventListener("click", () => {
            stage.classList.toggle("show-grid");
            console.log("Grid toggled");
        });
    }
    
    // אתחול כפתור ניקוי
    const clearAllButton = document.getElementById("clear-all");
    if (clearAllButton && programmingArea) {
        clearAllButton.addEventListener("click", () => {
            programmingArea.innerHTML = "";
            console.log("Programming area cleared");
        });
    }
    
    // אתחול גרירת דמות
    const character = document.getElementById('character');
    const stageElement = document.getElementById('stage');
    
    if (character && stageElement) {
        // מרכוז הדמות
        function centerCharacter() {
            character.style.transform = 'none';
            character.style.transition = 'none';
            
            const stageRect = stageElement.getBoundingClientRect();
            const charRect = character.getBoundingClientRect();
            
            const centerX = (stageRect.width - charRect.width) / 2;
            const centerY = (stageRect.height - charRect.height) / 2;
            
            character.style.position = 'absolute';
            character.style.left = centerX + 'px';
            character.style.top = centerY + 'px';
        }
        
        setTimeout(centerCharacter, 500);
        
        // טיפול בגרירת דמות
        let isDragging = false;
        let offsetX, offsetY;
        
        character.addEventListener('dragstart', function(e) {
            e.preventDefault();
            return false;
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
    
    // אתחול הקטגוריה הראשונית
    let initialCategory = 'triggering';
    const activeTab = document.querySelector(".category-tab.active");
    
    if (activeTab && activeTab.getAttribute('data-category')) {
        initialCategory = activeTab.getAttribute('data-category');
    } else {
        const triggeringTab = document.querySelector('.category-tab[data-category="triggering"]');
        if (triggeringTab) {
            triggeringTab.classList.add('active');
        }
    }
    
    // הפעלת הקטגוריה הראשונית
    handleCategoryChange(initialCategory);
});
