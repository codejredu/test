// ========================================================================
// הגדרת בלוקים (Blocks)
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
            svgFile: "Send Message orange.svg"
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
            color: "var(--control-color)",
            isContainer: true // מסמן שזה בלוק מכיל
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
// פונקציה ליצירת אלמנטי בלוקים רגילים
// ========================================================================
function createRegularBlockElement(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container");
    blockContainer.dataset.type = block.type;
    blockContainer.dataset.category = category;

    // יצירת אלמנט תמונה SVG
    const blockImage = document.createElement("img");
    blockImage.src = `assets/block/${block.svgFile}`;
    blockImage.alt = block.name;
    blockImage.classList.add("block-svg-image");
    
    // הוספת טיפול בשגיאות לטעינת התמונה
    blockImage.onerror = function() {
        console.warn(`SVG image not found: assets/block/${block.svgFile}`);
        this.style.border = "2px dashed red";
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
// פונקציה ליצירת בלוק repeat מיוחד
// ========================================================================
function createRepeatBlockElement(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container", "repeat-container");
    blockContainer.dataset.type = "repeat";
    blockContainer.dataset.category = category;
    
    // יצירת החלק העליון של בלוק ה-repeat
    const topImage = document.createElement("img");
    topImage.src = `assets/block/${block.svgFile}`;
    topImage.alt = "Repeat";
    topImage.classList.add("repeat-top");
    
    // יצירת אזור הדרופ - לכאן יגררו בלוקים
    const dropArea = document.createElement("div");
    dropArea.classList.add("repeat-drop-area");
    
    // הוספת אירועי גרירה ייחודיים לאזור הדרופ
    dropArea.addEventListener("dragover", handleRepeatDragOver);
    dropArea.addEventListener("drop", handleRepeatDrop);
    
    // החלק התחתון (סוגר) של בלוק ה-repeat
    const bottomImage = document.createElement("div");
    bottomImage.classList.add("repeat-bottom");
    bottomImage.style.backgroundColor = "var(--control-color)";
    bottomImage.style.borderRadius = "0 0 10px 10px";
    
    // הרכבת הבלוק
    blockContainer.appendChild(topImage);
    blockContainer.appendChild(dropArea);
    blockContainer.appendChild(bottomImage);
    
    blockContainer.draggable = true;
    blockContainer.addEventListener("dragstart", handleRepeatDragStart);
    
    return blockContainer;
}

// ========================================================================
// פונקציה מרכזית ליצירת אלמנטי בלוקים מכל הסוגים
// ========================================================================
function createBlockElement(block, category) {
    // בדיקה אם זהו בלוק מסוג repeat (מכיל)
    if (block.type === "repeat" && block.isContainer) {
        return createRepeatBlockElement(block, category);
    } else {
        return createRegularBlockElement(block, category);
    }
}

// ========================================================================
// טיפול בגרירת בלוקים רגילים
// ========================================================================
function handleDragStart(event, block, category) {
    const data = {
        type: block.type,
        svgFile: block.svgFile,
        color: block.color,
        category: category,
        name: block.name,
        isContainer: block.isContainer || false
    };
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
}

// ========================================================================
// טיפול בגרירת בלוק repeat
// ========================================================================
function handleRepeatDragStart(event) {
    const repeatBlock = this;
    
    // שמירת מידע על הבלוק והתוכן שלו
    const blocksInsideHTML = repeatBlock.querySelector(".repeat-drop-area").innerHTML;
    
    const data = {
        type: "repeat",
        isContainer: true,
        category: repeatBlock.dataset.category,
        name: "Repeat",
        blocksInside: blocksInsideHTML
    };
    
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
}

// ========================================================================
// טיפול בגרירה מעל אזור הדרופ של בלוק repeat
// ========================================================================
function handleRepeatDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    this.classList.add("drag-over");
}

// ========================================================================
// טיפול בהשמטה (drop) בתוך בלוק repeat
// ========================================================================
function handleRepeatDrop(event) {
    event.preventDefault();
    event.stopPropagation(); // מניעת בועה למעלה לאזור התכנות
    this.classList.remove("drag-over");
    
    const dataString = event.dataTransfer.getData("text/plain");
    if (!dataString) {
        console.error("No data transferred on drop inside repeat.");
        return;
    }
    
    try {
        const data = JSON.parse(dataString);
        
        // אם מנסים לגרור בלוק repeat לתוך בלוק repeat - לא מאפשרים
        if (data.isContainer) {
            console.warn("Cannot drag container blocks into repeat blocks");
            return;
        }
        
        const blockCategory = data.category;
        const blockDefinition = blocks[blockCategory]?.find(b => b.type === data.type);
        
        if (!blockDefinition) {
            console.error("Could not find block definition for dropped item:", data);
            return;
        }
        
        // יצירת בלוק חדש
        const newBlock = createRegularBlockElement(blockDefinition, blockCategory);
        newBlock.style.position = "static"; // בתוך repeat הבלוקים צריכים להיות סטטיים
        
        // הוספת הבלוק לאזור ה-repeat
        this.appendChild(newBlock);
        
        // עדכון גובה בלוק ה-repeat
        updateRepeatBlockHeight(this.parentElement);
        
    } catch (e) {
        console.error("Error parsing dropped data inside repeat:", e, dataString);
    }
}

// ========================================================================
// עדכון גובה בלוק repeat בהתאם לתוכן שלו
// ========================================================================
function updateRepeatBlockHeight(repeatBlock) {
    if (!repeatBlock || !repeatBlock.classList.contains("repeat-container")) return;
    
    const dropArea = repeatBlock.querySelector(".repeat-drop-area");
    if (!dropArea) return;
    
    // ספירת מספר הבלוקים באזור
    const blocksInside = dropArea.querySelectorAll(".block-container");
    const blockCount = blocksInside.length;
    
    // חישוב הגובה הדרוש
    const minHeight = 30; // גובה מינימלי לאזור הדרופ
    const blockHeight = 85; // גובה משוער לכל בלוק
    let dropAreaHeight = Math.max(minHeight, blockCount * blockHeight);
    
    // עדכון הגובה באזור הדרופ
    dropArea.style.height = dropAreaHeight + "px";
    
    // עדכון הגובה הכולל של מיכל ה-repeat
    const topHeight = 118; // גובה החלק העליון
    const bottomHeight = 40; // גובה החלק התחתון
    repeatBlock.style.height = (topHeight + dropAreaHeight + bottomHeight) + "px";
    
    console.log(`Updated repeat block height: ${repeatBlock.style.height}, contains ${blockCount} blocks`);
}

// ========================================================================
// טיפול בגרירה ושחרור באזור התכנות הראשי
// ========================================================================
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
            
            // טיפול בבלוק repeat שנגרר עם תוכן
            if (data.type === "repeat" && data.isContainer) {
                const blockCategory = "control";
                const blockDefinition = blocks[blockCategory].find(b => b.type === "repeat");
                
                if (!blockDefinition) {
                    console.error("Could not find repeat block definition");
                    return;
                }
                
                // יצירת בלוק repeat חדש
                const newRepeatBlock = createRepeatBlockElement(blockDefinition, blockCategory);
                
                // אם יש בלוקים בפנים - שחזור שלהם
                if (data.blocksInside) {
                    const dropArea = newRepeatBlock.querySelector(".repeat-drop-area");
                    if (dropArea) {
                        dropArea.innerHTML = data.blocksInside;
                        // עדכון מאזיני אירועים לבלוקים המשוחזרים
                        dropArea.querySelectorAll(".block-container").forEach(block => {
                            block.draggable = true;
                            block.addEventListener("dragstart", (e) => {
                                const blockData = {
                                    type: block.dataset.type,
                                    category: block.dataset.category
                                };
                                e.dataTransfer.setData("text/plain", JSON.stringify(blockData));
                            });
                        });
                        updateRepeatBlockHeight(newRepeatBlock);
                    }
                }
                
                programmingArea.appendChild(newRepeatBlock);
                
                // מיקום הבלוק החדש
                const rect = programmingArea.getBoundingClientRect();
                newRepeatBlock.style.position = "absolute";
                newRepeatBlock.style.left = `${event.
