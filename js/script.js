// --- START OF FILE script.js ---

// ========================================================================
// הגדרת בלוקים (Blocks) עם שמות הקבצים המדויקים
// ========================================================================

const blocks = {
    triggering: [
        { name: "Green Flag", type: "startOnGreenFlag", svgFile: "Start on Green Flag.svg" },
        { name: "Tap", type: "startOnTap", svgFile: "Start on Tap.svg" },
        { name: "Bump", type: "startOnBump", svgFile: "Start on Bump.svg" },
        { name: "Send Message", type: "sendMessage", svgFile: "Send Message blue.svg" },
        { name: "Receive Message", type: "startOnMessage", svgFile: "Send Message orange.svg" },
    ],
    motion: [
        { name: "Move Right", type: "moveRight", svgFile: "Move Right.svg" },
        { name: "Move Left", type: "moveLeft", svgFile: "Move Left.svg" },
        { name: "Move Up", type: "moveUp", svgFile: "Move Up.svg" },
        { name: "Move Down", type: "moveDown", svgFile: "Move Down.svg" },
        { name: "Turn Right", type: "turnRight", svgFile: "Turn Right.svg" },
        { name: "Turn Left", type: "turnLeft", svgFile: "Turn Left.svg" },
        { name: "Hop", type: "hop", svgFile: "Hop.svg" },
        { name: "Go Home", type: "goHome", svgFile: "Go home.svg" },
    ],
    looks: [
        { name: "Say", type: "say", svgFile: "say.svg" },
        { name: "Grow", type: "grow", svgFile: "reset-size.svg" },
        { name: "Shrink", type: "shrink", svgFile: "Shrink.svg" },
        { name: "Reset Size", type: "resetSize", svgFile: "reset-size.svg" },
        { name: "Hide", type: "hide", svgFile: "hide.svg" },
        { name: "Show", type: "show", svgFile: "show.svg" },
    ],
    sound: [
        { name: "Play Sound", type: "popSound", svgFile: "pop.svg" },
        { name: "Play Recorded Sound", type: "playRecordedSound", svgFile: "Play Recorded Sound.svg" },
    ],
    control: [
        { name: "Stop", type: "stop", svgFile: "Stop.svg" },
        { name: "Wait", type: "wait", svgFile: "Wait.svg" },
        { name: "Set Speed", type: "setSpeed", svgFile: "Set Speed.svg" },
        { name: "Repeat", type: "repeat", svgFile: "repeat.svg", isSpecial: true },
    ],
    end: [
        { name: "End", type: "end", svgFile: "end.svg" },
        { name: "Repeat Forever", type: "repeatForever", svgFile: "repeat-forever.svg" },
        { name: "Go To Page", type: "goToPage", svgFile: "Go to page.svg" },
    ],
};

// ========================================================================
// פונקציה ליצירת אלמנט בלוק (עבור הפלטה בלבד!)
// ========================================================================
function createBlockElementForPalette(block, category) { // שם שונה להבהרה
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container", "in-palette"); // קלאס שמציין שהוא בפלטה
    blockContainer.dataset.type = block.type;
    blockContainer.dataset.category = category;

    // יצירת אלמנט תמונה לבלוק
    const blockImage = document.createElement("img");
    blockImage.src = `assets/block/${block.svgFile}`;
    blockImage.alt = block.name;
    blockImage.classList.add("block-svg-image");

    // טיפול בשגיאות טעינת תמונה
    blockImage.onerror = function() {
        console.warn(`[script.js] SVG image not found: assets/block/${block.svgFile}`);
        this.style.border = "2px dashed red"; // עיצוב בסיסי לשגיאה
        this.style.background = "#ffeeee";
    };

    blockContainer.appendChild(blockImage);

    // --- מאפייני גרירה (רק מהפלטה) ---
    blockContainer.draggable = true; // *** רק בלוקים בפלטה יהיו draggable בשיטה זו ***
    blockContainer.addEventListener("dragstart", (event) => {
        console.log(`[script.js dragstart from palette] Firing for: ${block.type}`);
        // הכנת נתונים ליצירת בלוק חדש באזור התכנות בעת השמטה (drop)
        try {
             const dataToSend = JSON.stringify({
                type: block.type,
                category: category,
                name: block.name,
                isNew: true // סימון חשוב שמקורו בפלטה
            });
             event.dataTransfer.setData("text/plain", dataToSend);
             event.dataTransfer.effectAllowed = "copy";
        } catch (e) {
             console.error("[script.js] Error setting drag data:", e);
        }
    });

    return blockContainer;
}

// ========================================================================
// פונקציה למילוי הקטגוריה בבלוקים
// ========================================================================
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    if (!categoryDiv) {
        console.error(`[script.js] Category div not found for ${category}`);
        return;
    }

    // ניקוי הבלוקים הקיימים
    categoryDiv.innerHTML = "";

    // בדיקה אם יש בלוקים לקטגוריה
    if (!blocks[category] || blocks[category].length === 0) {
        console.warn(`[script.js] No blocks defined for category ${category}`);
        return;
    }

    // יצירת הבלוקים והוספתם לקטגוריה
    blocks[category].forEach(block => {
        const blockElement = createBlockElementForPalette(block, category); // שימוש בפונקציה הייעודית לפלטה
        categoryDiv.appendChild(blockElement);
    });
}

// ========================================================================
// פונקציה לטיפול בשינוי קטגוריה עם עדכון צבע הרקע
// ========================================================================
function handleCategoryChange(category) {
    // console.log(`[script.js] Changing category to: ${category}`);

    const categoryTabs = document.querySelectorAll(".category-tab");
    const blockCategories = document.querySelectorAll(".block-category");

    blockCategories.forEach(element => element.classList.remove("active"));
    categoryTabs.forEach(tab => tab.classList.remove("active"));

    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    const categoryDiv = document.getElementById(`${category}-blocks`);

    if (tab) tab.classList.add("active");
    else console.warn(`[script.js] Tab not found for category: ${category}`);

    if (categoryDiv) {
        categoryDiv.classList.add("active");
        const blockPalette = document.getElementById("block-palette");
        if (blockPalette) {
            const categoryColor = getCategoryColor(category);
            blockPalette.style.borderColor = categoryColor;
        }
        populateBlockPalette(category); // מילוי הפלטה מחדש
    } else {
        console.warn(`[script.js] Block category container not found for: ${category}`);
    }
}

// ========================================================================
// פונקציית עזר לקבלת הצבע המתאים לקטגוריה
// ========================================================================
function getCategoryColor(category) {
    // ודא שמשתני ה-CSS מוגדרים כראוי
    const rootStyle = getComputedStyle(document.documentElement);
    switch(category) {
        case 'triggering': return rootStyle.getPropertyValue('--triggering-color').trim() || '#FFBF1A';
        case 'motion':     return rootStyle.getPropertyValue('--motion-color').trim() || '#4a90e2';
        case 'looks':      return rootStyle.getPropertyValue('--looks-color').trim() || '#9013fe';
        case 'sound':      return rootStyle.getPropertyValue('--sound-color').trim() || '#cf63cf';
        case 'control':    return rootStyle.getPropertyValue('--control-color').trim() || '#e1a91a';
        case 'end':        return rootStyle.getPropertyValue('--end-color').trim() || '#ff6347';
        default:           return '#e0e0e0'; // צבע ברירת מחדל ניטרלי
    }
}

// ========================================================================
// פונקציה לטיפול בהשמטת בלוק באזור התכנות (רק ליצירת בלוקים חדשים)
// ========================================================================
function handleDrop(event) {
    event.preventDefault(); // חובה כדי לאפשר השמטה
    console.log("[script.js handleDrop] Drop event triggered.");

    const programmingArea = document.getElementById("program-blocks");
    if (!programmingArea) {
        console.error("[script.js handleDrop] Programming area not found!");
        return;
    }
    const rect = programmingArea.getBoundingClientRect();
    const dataString = event.dataTransfer.getData("text/plain");

    if (!dataString) {
        console.error("[script.js handleDrop] No data transferred on drop.");
        return;
    }
    console.log("[script.js handleDrop] Received data string:", dataString);

    try {
        const data = JSON.parse(dataString);

        // --- ודא שההשמטה היא של בלוק חדש מהפלטה ---
        if (data.isNew === true) {
            console.log("[script.js handleDrop] Data indicates a new block from palette. Creating...");
            const blockCategory = data.category;
            const blockDefinition = blocks[blockCategory]?.find(b => b.type === data.type);

            if (!blockDefinition) {
                console.error("[script.js handleDrop] Could not find block definition for new block:", data);
                return;
            }
            console.log("[script.js handleDrop] Found block definition:", blockDefinition);

            // --- יצירת אלמנט הבלוק החדש באזור התכנות ---
            const newBlockContainer = document.createElement("div");
            newBlockContainer.classList.add("block-container"); // קלאס בסיסי, ללא 'in-palette'
            newBlockContainer.dataset.type = blockDefinition.type;
            newBlockContainer.dataset.category = blockCategory;
            // ID ייחודי יתווסף על ידי linkageimproved.js

            const newBlockImage = document.createElement("img");
            newBlockImage.src = `assets/block/${blockDefinition.svgFile}`;
            newBlockImage.alt = blockDefinition.name;
            newBlockImage.classList.add("block-svg-image");
            newBlockImage.onerror = function() {
                console.warn(`[script.js] SVG image failed to load for new block: ${blockDefinition.svgFile}`);
                this.style.border = "1px dashed red"; // סימון שגיאה קל
            };
            newBlockContainer.appendChild(newBlockImage);

            // *** חשוב: הבלוק החדש שנוצר כאן אינו draggable בשיטת HTML5 ***
            // newBlockContainer.draggable = false; // ברירת מחדל היא false, אין צורך להגדיר
            // *** אין להוסיף כאן מאזין dragstart פנימי ***
            // האחריות על הפיכת הבלוק הזה לגריר (עם mousedown) היא של linkageimproved.js

            programmingArea.appendChild(newBlockContainer);
            console.log("[script.js handleDrop] New block element appended to programming area:", newBlockContainer);

            // --- מיקום הבלוק החדש ---
            newBlockContainer.style.position = "absolute"; // חובה למיקום עם left/top

            // שימוש ב-requestAnimationFrame לדיוק במידות ובמיקום
            requestAnimationFrame(() => {
                const blockWidth = newBlockContainer.offsetWidth;
                const blockHeight = newBlockContainer.offsetHeight;

                // חישוב מיקום התחלתי (מרכז הבלוק תחת העכבר)
                let initialLeft = event.clientX - rect.left - (blockWidth / 2);
                let initialTop = event.clientY - rect.top - (blockHeight / 2);

                // הגבלת המיקום לגבולות אזור התכנות
                const maxLeft = programmingArea.clientWidth - blockWidth;
                const maxTop = programmingArea.clientHeight - blockHeight;
                const finalLeft = Math.max(0, Math.min(initialLeft, maxLeft));
                const finalTop = Math.max(0, Math.min(initialTop, maxTop));

                newBlockContainer.style.left = `${finalLeft}px`;
                newBlockContainer.style.top = `${finalTop}px`;
                console.log(`[script.js handleDrop] New block positioned at: left=${finalLeft}, top=${finalTop} (w:${blockWidth}, h:${blockHeight})`);

                 // בשלב זה, linkageimproved.js אמור לזהות את הבלוק החדש (דרך MutationObserver)
                 // ולהוסיף לו את מאזין ה-mousedown שלו כדי לאפשר גרירה פנימית והצמדה.
            });

        } else {
            // אם הנתונים לא מסומנים כ-isNew, ההנחה היא שזו הייתה גרירה פנימית
            // שטופלה במלואה על ידי linkageimproved.js (או מקור אחר),
            // ולכן אין צורך בפעולה נוספת כאן ב-handleDrop.
            console.log("[script.js handleDrop] Drop detected, but data doesn't indicate a new block from palette. Assuming internal move was handled by linkage script.");
        }

    } catch (e) {
        console.error("[script.js handleDrop] Error parsing dropped data or creating new block:", e);
    }

    console.log("[script.js handleDrop] Drop handling finished.");
}

// ========================================================================
// אתחול כללי - מופעל כשה-DOM נטען
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("[script.js] DOM fully loaded");

    // --- אתחול אזור התכנות ---
    const programmingArea = document.getElementById("program-blocks");
    if (programmingArea) {
        // מאזין dragover - חיוני כדי לאפשר drop
        programmingArea.addEventListener("dragover", (event) => {
            // בדוק אם הנתונים המועברים הם מהסוג שאנחנו מצפים לו מהפלטה
            // (במקרה שלנו, שלחנו "text/plain")
            if (event.dataTransfer.types.includes("text/plain")) {
                 event.preventDefault(); // אפשר את ההשמטה
                 event.dataTransfer.dropEffect = "copy"; // סמן חזותית שזה עותק
                 // console.log("[script.js dragover] Allowed drop (copy)"); // יכול להציף, השאר כהערה
            } else {
                // console.log("[script.js dragover] Denied drop (unsupported type)"); // יכול להציף
            }
        });

        // מאזין drop - מטפל רק ביצירת בלוקים חדשים
        programmingArea.addEventListener("drop", handleDrop);
        console.log("[script.js] Programming area initialized with dragover (copy only) and drop listeners.");
    } else {
        console.error("[script.js] Programming area element (#program-blocks) not found!");
    }

    // --- אתחול כרטיסיות הקטגוריות ---
    const categoryTabs = document.querySelectorAll(".category-tab");
    if (categoryTabs.length > 0) {
        categoryTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const category = tab.getAttribute('data-category');
                handleCategoryChange(category);
            });
        });
        console.log(`[script.js] ${categoryTabs.length} category tabs initialized`);
    } else {
        console.error("[script.js] No category tabs found!");
    }

    // --- אתחול כפתור הרשת ---
    const gridToggle = document.getElementById("grid-toggle");
    const stage = document.getElementById("stage");
    if (gridToggle && stage) {
        gridToggle.addEventListener("click", () => {
            stage.classList.toggle("show-grid");
            console.log("[script.js] Grid toggled");
        });
    }

    // --- אתחול כפתור ניקוי ---
    const clearAllButton = document.getElementById("clear-all");
    if (clearAllButton && programmingArea) {
        clearAllButton.addEventListener("click", () => {
            programmingArea.innerHTML = ""; // מנקה את כל הבלוקים מאזור התכנות
            console.log("[script.js] Programming area cleared");
            // כאן אפשר להודיע ל-linkageimproved.js לנקות מצב פנימי אם צריך
            // if (window.notifyLinkageClearAll) window.notifyLinkageClearAll();
        });
    }

    // --- אתחול גרירת דמות ---
    const character = document.getElementById('character');
    const stageElement = document.getElementById('stage');
    if (character && stageElement) {
        // פונקציה למרכוז הדמות
        function centerCharacter() {
            character.style.position = 'absolute';
            character.style.transform = 'none';
            character.style.transition = 'none';

            const stageRect = stageElement.getBoundingClientRect();
            const charRect = character.getBoundingClientRect();

            if (stageRect.width > 0 && stageRect.height > 0 && charRect.width > 0 && charRect.height > 0) {
                const centerX = (stageRect.width - charRect.width) / 2;
                const centerY = (stageRect.height - charRect.height) / 2;
                character.style.left = centerX + 'px';
                character.style.top = centerY + 'px';
                // console.log(`[script.js] Character centered at left: ${centerX}, top: ${centerY}`);
            } else {
                 console.warn("[script.js] Could not center character - dimensions invalid. Retrying...");
                 setTimeout(centerCharacter, 300); // נסה שוב
            }
        }
        // קריאה ראשונית למירכוז עם השהייה קלה
        setTimeout(centerCharacter, 150);

        // טיפול בגרירת דמות (באמצעות mouse events, לא HTML5 D&D)
        let isDraggingChar = false;
        let charOffsetX, charOffsetY;

        character.addEventListener('dragstart', (e) => e.preventDefault()); // מניעת גרירת ברירת מחדל

        character.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return; // רק כפתור שמאלי
            // אפשר לגרור רק בלחיצה ישירה על הדמות
            if (e.target !== character && !character.contains(e.target)) return;
            e.preventDefault(); // מניעת בחירת טקסט/גרירת תמונה

            const charRect = character.getBoundingClientRect();
            const stageRect = stageElement.getBoundingClientRect();
            charOffsetX = e.clientX - charRect.left; // Offset ביחס לפינת הדמות
            charOffsetY = e.clientY - charRect.top;

            isDraggingChar = true;
            character.style.cursor = 'grabbing';
            character.style.transition = 'none';
            // console.log("[script.js] Character dragging started");
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDraggingChar) return;

            const stageRect = stageElement.getBoundingClientRect();
            const charWidth = character.offsetWidth;
            const charHeight = character.offsetHeight;

            // מיקום חדש ביחס ל-stage
            let newLeft = e.clientX - stageRect.left - charOffsetX;
            let newTop = e.clientY - stageRect.top - charOffsetY;

            // הגבלת גבולות
            const maxLeft = stageRect.width - charWidth;
            const maxTop = stageRect.height - charHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            character.style.left = newLeft + 'px';
            character.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', function(e) {
            if (isDraggingChar) {
                isDraggingChar = false;
                character.style.cursor = 'grab';
                // console.log(`[script.js] Character dragging ended at left: ${character.style.left}, top: ${character.style.top}`);
            }
        });
         console.log("[script.js] Character dragging initialized.");
    } else {
         if (!character) console.error("[script.js] Character element (#character) not found!");
         if (!stageElement) console.error("[script.js] Stage element (#stage) not found!");
    }

    // --- אתחול הקטגוריה הראשונית ---
    let initialCategory = 'triggering'; // ברירת מחדל
    const activeTab = document.querySelector(".category-tab.active");
    if (activeTab && activeTab.dataset.category) {
        initialCategory = activeTab.dataset.category;
        console.log(`[script.js] Initial category from HTML: ${initialCategory}`);
    } else {
        console.log(`[script.js] No initial active tab found in HTML, defaulting to: ${initialCategory}`);
    }

    // הפעלת הקטגוריה הראשונית
    const initialTabElement = document.querySelector(`.category-tab[data-category="${initialCategory}"]`);
    if (initialTabElement) {
        handleCategoryChange(initialCategory); // הפעל את הקטגוריה שנבחרה
    } else {
        console.error(`[script.js] Initial category tab ('${initialCategory}') not found! Cannot load initial blocks.`);
        // נסה לטעון את הקטגוריה הראשונה הזמינה אם ברירת המחדל נכשלה
        const firstTab = document.querySelector(".category-tab");
        if (firstTab && firstTab.dataset.category) {
             console.warn(`[script.js] Falling back to first available category: ${firstTab.dataset.category}`);
             handleCategoryChange(firstTab.dataset.category);
        } else {
            console.error("[script.js] No category tabs found at all!");
        }
    }
});

// --- END OF FILE script.js ---
