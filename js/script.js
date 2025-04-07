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
        const draggedBlock = programmingArea.children[draggedBlockIndex];

        if (draggedBlock) {
            // הסר את הבלוק מהמיקום הישן
            // programmingArea.removeChild(draggedBlock); // הסרת השורה הזו היא חיונית כדי שהאלמנט יישאר בזמן החישוב

            // מצא את מיקום השחרור ועדכן מיקום
            const rect = programmingArea.getBoundingClientRect();
            const newLeft = event.clientX - rect.left - (draggedBlock.offsetWidth / 2);
            const newTop = event.clientY - rect.top - (draggedBlock.offsetHeight / 2);

            // הגבלת המיקום לגבולות אזור התכנות (אופציונלי, אך מומלץ)
            // const boundedLeft = Math.max(0, Math.min(newLeft, programmingArea.offsetWidth - draggedBlock.offsetWidth));
            // const boundedTop = Math.max(0, Math.min(newTop, programmingArea.offsetHeight - draggedBlock.offsetHeight));

            draggedBlock.style.position = "absolute";
            draggedBlock.style.left = `${newLeft}px`; // השתמש ב- newLeft/boundedLeft
            draggedBlock.style.top = `${newTop}px`; // השתמש ב- newTop/boundedTop

            // אין צורך להוסיף מחדש כי לא הסרנו, רק שינינו מיקום
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
            // חשוב: ודא שאתה משתמש ב-newBlock שנוצר בהיקף הזה
            event.dataTransfer.setData('block-index', Array.from(programmingArea.children).indexOf(newBlock).toString());
            event.dataTransfer.effectAllowed = "move";
            // הוספת עיכוב קטן כדי לאפשר לדפדפן לרשום את מיקום ההתחלה לפני שהאלמנט מוסתר (אם יש אפקט גרירה ויזואלי)
            // setTimeout(() => { newBlock.style.opacity = '0.5'; }, 0); // דוגמה לאפקט
        });

        // (אופציונלי) טיפול בסיום גרירה כדי להחזיר את המראה
        // newBlock.addEventListener("dragend", (event) => {
        //     newBlock.style.opacity = '1';
        // });


        // הוספת הבלוק החדש לאזור התכנות
        programmingArea.appendChild(newBlock);

        // מיקום הבלוק החדש יחסי לאזור התכנות - מתחת לעכבר
        const rect = programmingArea.getBoundingClientRect();
        // השתמש ב offsetWidth/offsetHeight רק *אחרי* שהאלמנט נוסף ל-DOM
        const newBlockWidth = newBlock.offsetWidth;
        const newBlockHeight = newBlock.offsetHeight;

        const newLeft = event.clientX - rect.left - (newBlockWidth / 2);
        const newTop = event.clientY - rect.top - (newBlockHeight / 2);

        newBlock.style.position = "absolute"; // השתמש במיקום אבסולוטי
        newBlock.style.left = `${newLeft}px`; // מרכז את הבלוק אופקית
        newBlock.style.top = `${newTop}px`; // מרכז את הבלוק אנכית
    }
}

// ========================================================================
// פונקציות אתחול
// ========================================================================

// הוספת הבלוקים ללוח הלבנים
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    if (!categoryDiv) {
      console.error(`Category div not found: ${category}-blocks`);
      return; // מונע שגיאה אם ה-div לא קיים
    }
    categoryDiv.innerHTML = "";

    if (!blocks[category]) {
      console.error(`Blocks not found for category: ${category}`);
      return; // מונע שגיאה אם הקטגוריה לא מוגדרת
    }

    blocks[category].forEach(block => {
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}

// פונקציה לטיפול בשינוי קטגוריה
function handleCategoryChange(category) {
    blockCategories.forEach(element => element.classList.remove("active"));
    categoryTabs.forEach(tab => tab.classList.remove("active"));

    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    const categoryDiv = document.getElementById(`${category}-blocks`);

    if(tab) tab.classList.add("active");
    if(categoryDiv) categoryDiv.classList.add("active");

    populateBlockPalette(category);
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

gridToggle.addEventListener("click", () => {
    stage.classList.toggle("show-grid");
});

// ניקוי כל הבלוקים מאזור התכנות
const clearAllButton = document.getElementById("clear-all");
clearAllButton.addEventListener("click", () => {
    programmingArea.innerHTML = "";
});

// אתחול הלוח עם הקטגוריה הפעילה הראשונה
// ודא שה-DOM טעון לפני קריאה לפונקציות אתחול
document.addEventListener('DOMContentLoaded', (event) => {
    // בדוק שוב אם האלמנטים קיימים לפני האתחול
    if (document.getElementById("triggering-blocks")) {
        handleCategoryChange("triggering"); // טען את הקטגוריה הראשונה
    } else {
        console.error("Initial category 'triggering-blocks' not found on DOMContentLoaded.");
    }

    // הפעלת קוד הגרירה של הדמות רק לאחר שה-DOM טעון והדמות קיימת
    const characterElement = document.getElementById('character');
    if (characterElement) {
        characterElement.addEventListener('mousedown', startDrag);
    } else {
        console.error("Character element not found on DOMContentLoaded.");
    }

    // אתחול אירועי סמן גרירה
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            document.body.style.cursor = 'grabbing';
        }
    });

    document.addEventListener('mouseup', () => {
        // החזר סמן רק אם הגרירה הסתיימה (isDragging יהיה false כבר מ-endDrag)
        // בדיקה זו מיותרת אם endDrag תמיד נקראת, אבל לא מזיקה
        if (!isDragging) {
            document.body.style.cursor = 'default';
            const characterElement = document.getElementById('character');
            if (characterElement) {
                 characterElement.classList.remove('dragging');
            }
        }
    });
});


// ========================================================================
// קוד גרירה של הדמות - **נראה תקין ושומר על מיקום הלחיצה**
// ========================================================================

// מקבל הפניה לאלמנט הדמות - עדיף לעשות זאת בתוך DOMContentLoaded
// const character = document.getElementById('character'); // מועבר ל-DOMContentLoaded

// פונקציה שמתחילה את הגרירה
function startDrag(e) {
    // ודא שהאלמנט הוא הדמות עצמה
    const character = e.target.closest('#character'); // ודא שלוחצים על הדמות או אלמנט בתוכה
    if (!character) return;

    // מנע התנהגות ברירת מחדל וברירת טקסט
    e.preventDefault();
    e.stopPropagation();

    // חשוב מאוד - מחשב את הנקודה המדויקת שבה העכבר לחץ על הדמות
    const rect = character.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    // מפעיל מצב גרירה
    isDragging = true;

    // מוסיף קלאס לעיצוב (אופציונלי)
    character.classList.add('dragging');

    // מאפשר לדמות להיגרר בחופשיות (מונע אירועים על הדמות עצמה בזמן הגרירה)
    character.style.pointerEvents = 'none';

    // מוסיף שומרי אירועים זמניים למסמך כולו
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag, { once: true }); // { once: true } מבטיח שהאירוע יוסר אוטומטית לאחר הפעלה אחת
}

// פונקציה שמבצעת את הגרירה
function drag(e) {
    if (!isDragging) return;

    // הפניה לדמות - חשוב לקבל אותה שוב או להשתמש במשתנה גלובלי/בהיקף גבוה יותר
    const character = document.getElementById('character');
    if (!character) { // בדיקת בטיחות
        endDrag(e); // סיים את הגרירה אם הדמות נעלמה
        return;
    }

    // מניעת התנהגות ברירת מחדל אפשרית בזמן גרירה
    e.preventDefault();
    e.stopPropagation();

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

    // הפניה לדמות
    const character = document.getElementById('character');

    // חובה למנוע התנהגות ברירת מחדל גם בשחרור
    // e.preventDefault(); // יכול לגרום לבעיות אם השחרור הוא על אלמנט אחר עם אירוע קליק
    e.stopPropagation(); // חשוב למנוע bubbling

    // מבטל את מצב הגרירה *לפני* הסרת ה-listeners
    isDragging = false;

    // מסיר את שומרי האירועים מהמסמך
    document.removeEventListener('mousemove', drag);
    // אין צורך להסיר את mouseup אם השתמשנו ב- { once: true }
    // document.removeEventListener('mouseup', endDrag); // מוסר אוטומטית עם once: true

    // מחזיר את אירועי המצביע לדמות ומסיר קלאס עיצובי
    if (character) {
      character.style.pointerEvents = 'auto';
      character.classList.remove('dragging');
    }

    // איפוס סמן העכבר - ייעשה ע"י ה-listener הכללי של mouseup על ה-document
    document.body.style.cursor = 'default';

}

// הוספת Listener להתחלת גרירה - הועבר ל-DOMContentLoaded

// הוספת סגנון לסמן וטיפול בסיום - הועבר ל-DOMContentLoaded
