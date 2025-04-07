// ========================================================================
// הגדרת בלוקים (Blocks)
// ========================================================================

// משתנים חדשים לתיקון הגרירה (לא רלוונטי לגרירת הדמות, אלא לגרירת הבלוקים)
// let dragOffsetX = 0; // משתנה זה משמש לגרירת הדמות
// let dragOffsetY = 0; // משתנה זה משמש לגרירת הדמות
// let isDragging = false; // הגדרה אחת בלבד של המשתנה - משמש גם לגרירת הדמות

// --- (שאר הגדרות הבלוקים נשארות זהות) ---
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
// פונקציות טיפול באירועים (בלוקים)
// ========================================================================

// פונקציה לטיפול בהתחלת גרירה של בלוק
function handleDragStart(event, block, category) {
    const data = {
        type: block.type,
        icon: block.icon,
        color: block.color,
        category: category,
        name: block.name
    };
    // לא להגדיר כאן dragOffsetX/Y כי אלו משמשים לגרירת הדמות
    event.dataTransfer.setData("text/plain", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
}

// פונקציה לטיפול בשחרור בלוק באזור התכנות
function handleDrop(event) {
    event.preventDefault();
    const programmingArea = document.getElementById("program-blocks"); // ודא שההפניה קיימת

    const blockIndex = event.dataTransfer.getData('block-index'); // נסה לקבל אינדקס, אם קיים

    if (blockIndex && programmingArea) { // אם קיים block-index, זה אומר שגוררים בלוק בתוך אזור התכנות
        const draggedBlockIndex = parseInt(blockIndex);
        // ודא שהאינדקס תקין
        if (draggedBlockIndex >= 0 && draggedBlockIndex < programmingArea.children.length) {
            const draggedBlock = programmingArea.children[draggedBlockIndex];

            if (draggedBlock) {
                // מצא את מיקום השחרור ועדכן מיקום
                const rect = programmingArea.getBoundingClientRect();
                 // חשוב לחשב את האופסט של העכבר *ביחס לבלוק הנגרר עצמו* אם רוצים לשמור על מיקום הלחיצה עליו
                 // אם לא שמרנו אופסט ב-dragstart של הבלוק, נשתמש במרכז הבלוק כברירת מחדל
                const blockRect = draggedBlock.getBoundingClientRect();
                const dropX = event.clientX - rect.left;
                const dropY = event.clientY - rect.top;

                // מרכז את הבלוק תחת העכבר כברירת מחדל
                const newLeft = dropX - (draggedBlock.offsetWidth / 2);
                const newTop = dropY - (draggedBlock.offsetHeight / 2);

                // הגבלת המיקום לגבולות אזור התכנות (אופציונלי, אך מומלץ)
                // const boundedLeft = Math.max(0, Math.min(newLeft, programmingArea.offsetWidth - draggedBlock.offsetWidth));
                // const boundedTop = Math.max(0, Math.min(newTop, programmingArea.offsetHeight - draggedBlock.offsetHeight));

                draggedBlock.style.position = "absolute";
                draggedBlock.style.left = `${newLeft}px`; // השתמש ב- newLeft/boundedLeft
                draggedBlock.style.top = `${newTop}px`; // השתמש ב- newTop/boundedTop

                // ודא שהבלוק נשאר בתוך programmingArea (למקרה שיצא בטעות)
                programmingArea.appendChild(draggedBlock);
            }
        } else {
            console.warn("Invalid block index received:", blockIndex);
        }

    } else if (programmingArea) { // אם אין block-index, זה אומר שגוררים בלוק מלוח הלבנים (התנהגות קודמת)
        try {
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

             // הוספת הבלוק החדש לאזור התכנות *לפני* חישוב הגודל והמיקום
            programmingArea.appendChild(newBlock);

            // הוספת event listener לגרירה של בלוקים בתוך אזור התכנות
            newBlock.addEventListener("dragstart", (dragEvent) => {
                // חשוב: ודא שאתה משתמש ב-newBlock שנוצר בהיקף הזה
                const index = Array.from(programmingArea.children).indexOf(newBlock);
                if (index > -1) { // ודא שהאלמנט נמצא לפני שמירת האינדקס
                    dragEvent.dataTransfer.setData('block-index', index.toString());
                    dragEvent.dataTransfer.effectAllowed = "move";
                } else {
                    console.error("Could not find new block in programming area during dragstart.");
                }
                // אפשר להוסיף כאן חישוב ושמירה של אופסט הלחיצה על הבלוק אם רוצים דיוק בגרירה פנימית
                // const blockRect = newBlock.getBoundingClientRect();
                // dragEvent.dataTransfer.setData('offset-x', dragEvent.clientX - blockRect.left);
                // dragEvent.dataTransfer.setData('offset-y', dragEvent.clientY - blockRect.top);
            });

            // מיקום הבלוק החדש יחסי לאזור התכנות - מתחת לעכבר
            const rect = programmingArea.getBoundingClientRect();
            // השתמש ב offsetWidth/offsetHeight רק *אחרי* שהאלמנט נוסף ל-DOM
            const newBlockWidth = newBlock.offsetWidth;
            const newBlockHeight = newBlock.offsetHeight;

            // חשב מיקום למרכז הבלוק מתחת לעכבר
            const newLeft = event.clientX - rect.left - (newBlockWidth / 2);
            const newTop = event.clientY - rect.top - (newBlockHeight / 2);

            newBlock.style.position = "absolute"; // השתמש במיקום אבסולוטי
            newBlock.style.left = `${newLeft}px`; // מרכז את הבלוק אופקית
            newBlock.style.top = `${newTop}px`; // מרכז את הבלוק אנכית

        } catch (e) {
            console.error("Error handling drop:", e);
            // ייתכן שה- dataTransfer לא הכיל JSON תקין
        }
    } else if (!programmingArea) {
         console.error("Programming area not found during drop event.");
    }
}


// ========================================================================
// פונקציות אתחול
// ========================================================================
let blockCategories = []; // אתחול מערכים ריקים
let categoryTabs = [];    // כדי למנוע שגיאות אם ה-DOM לא מוכן

// הוספת הבלוקים ללוח הלבנים
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    if (!categoryDiv) {
      console.error(`Category div not found: ${category}-blocks`);
      return; // מונע שגיאה אם ה-div לא קיים
    }
    categoryDiv.innerHTML = ""; // נקה לפני הוספה

    if (!blocks[category]) {
      console.warn(`Blocks not found for category: ${category}. Displaying empty.`);
      // אפשר להציג הודעה למשתמש או פשוט להשאיר ריק
      return;
    }

    blocks[category].forEach(block => {
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}

// פונקציה לטיפול בשינוי קטגוריה
function handleCategoryChange(category) {
    // ודא שהמערכים אותחלו
    if (!blockCategories || !categoryTabs) return;

    blockCategories.forEach(element => element.classList.remove("active"));
    categoryTabs.forEach(tab => tab.classList.remove("active"));

    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    const categoryDiv = document.getElementById(`${category}-blocks`);

    if(tab) {
      tab.classList.add("active");
    } else {
      console.warn(`Tab not found for category: ${category}`);
    }
    if(categoryDiv) {
      categoryDiv.classList.add("active");
      populateBlockPalette(category); // טען בלוקים רק אם ה-div קיים
    } else {
       console.warn(`Block category div not found: ${category}-blocks`);
    }
}

// ========================================================================
//  אתחול כללי והוספת Event Listeners
// ========================================================================

document.addEventListener('DOMContentLoaded', (event) => {
    const programmingArea = document.getElementById("program-blocks");
    const stage = document.getElementById("stage");
    const character = document.getElementById('character'); // הפניה לדמות
    const gridToggle = document.getElementById("grid-toggle");
    const clearAllButton = document.getElementById("clear-all");

    // אתחול הפניות לקטגוריות רק אחרי שה-DOM מוכן
    blockCategories = document.querySelectorAll(".block-category");
    categoryTabs = document.querySelectorAll(".category-tab");

    // הגדרת משתני גרירה גלובליים (או בהיקף גבוה יותר)
    dragOffsetX = 0; // אופסט X לגרירת הדמות
    dragOffsetY = 0; // אופסט Y לגרירת הדמות
    isDragging = false; // האם הדמות נגררת כעת?

    // --- Event Listeners לאזור התכנות (בלוקים) ---
    if (programmingArea) {
        programmingArea.addEventListener("dragover", (event) => {
            event.preventDefault(); // אפשר שחרור
            event.dataTransfer.dropEffect = "move";
        });
        programmingArea.addEventListener("drop", handleDrop); // טפל בשחרור
    } else {
        console.error("Programming area ('program-blocks') not found!");
    }

    // --- Event Listeners לטאבים של הקטגוריות ---
    if (categoryTabs.length > 0) {
        categoryTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const category = tab.dataset.category;
                if (category) {
                    handleCategoryChange(category);
                }
            });
        });
        // אתחול הלוח עם הקטגוריה הפעילה הראשונה (אם קיימת)
        const firstCategory = categoryTabs[0]?.dataset.category;
        if (firstCategory) {
            handleCategoryChange(firstCategory);
        } else {
           console.warn("No category tabs found to initialize.");
        }
    } else {
        console.warn("No category tabs found.");
    }

    // --- Event Listener לכפתור Grid ---
    if (gridToggle && stage) {
        gridToggle.addEventListener("click", () => {
            stage.classList.toggle("show-grid");
        });
    }

    // --- Event Listener לכפתור ניקוי ---
    if (clearAllButton && programmingArea) {
        clearAllButton.addEventListener("click", () => {
            programmingArea.innerHTML = ""; // נקה את אזור התכנות
        });
    }

    // --- Event Listeners לגרירת הדמות ---
    if (character && stage) {
        // פונקציה שמתחילה את הגרירה
        function startDragCharacter(e) {
            // ודא שהאלמנט הוא הדמות עצמה
            if (!e.target.closest('#character')) return;

            e.preventDefault();
            e.stopPropagation();

            const rect = character.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left; // שמור אופסט X
            dragOffsetY = e.clientY - rect.top; // שמור אופסט Y

            isDragging = true; // סמן שאנו גוררים את הדמות
            character.classList.add('dragging'); // הוסף קלאס לעיצוב (אופציונלי)
            character.style.pointerEvents = 'none'; // מנע אירועים על הדמות בזמן הגרירה
            document.body.style.cursor = 'grabbing'; // שנה סמן גוף הדף

            // הוסף מאזינים למסמך כולו
            document.addEventListener('mousemove', dragCharacter);
            document.addEventListener('mouseup', endDragCharacter, { once: true });
        }

        // פונקציה שמבצעת את הגרירה
        function dragCharacter(e) {
            if (!isDragging) return; // רק אם אנחנו במצב גרירה

            // מניעת התנהגות ברירת מחדל (כמו בחירת טקסט)
            // e.preventDefault(); // לא תמיד נחוץ ב-mousemove ויכול להפריע לאירועים אחרים
            e.stopPropagation();

            const stageRect = stage.getBoundingClientRect();
            const characterWidth = character.offsetWidth;
            const characterHeight = character.offsetHeight;

            // חשב מיקום חדש תוך שימוש באופסט שנשמר
            let x = e.clientX - stageRect.left - dragOffsetX;
            let y = e.clientY - stageRect.top - dragOffsetY;

            // ודא שהדמות נשארת בתוך גבולות הבמה
            x = Math.max(0, Math.min(x, stageRect.width - characterWidth));
            y = Math.max(0, Math.min(y, stageRect.height - characterHeight));

            // עדכן מיקום הדמות
            character.style.left = x + 'px';
            character.style.top = y + 'px';
        }

        // פונקציה שמסיימת את הגרירה
        function endDragCharacter(e) {
            if (!isDragging) return; // אם לא היינו בגרירה, צא

            isDragging = false; // סיים מצב גרירה

            // הסר מאזינים מהמסמך
            document.removeEventListener('mousemove', dragCharacter);
            // אין צורך להסיר mouseup ידנית בזכות { once: true }

            // אפשר אירועים חזרה על הדמות והסר קלאס
            character.style.pointerEvents = 'auto';
            character.classList.remove('dragging');
            document.body.style.cursor = 'default'; // החזר סמן ברירת מחדל לגוף

            // e.stopPropagation(); // חשוב למנוע השפעה על אלמנטים אחרים
        }

        // הוסף מאזין להתחלת גרירה על הדמות
        character.addEventListener('mousedown', startDragCharacter);

    } else {
        if (!character) console.error("Character element ('character') not found!");
        if (!stage) console.error("Stage element ('stage') not found!");
    }

}); // סוף DOMContentLoaded
