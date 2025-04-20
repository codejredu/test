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
            svgFile: "reset-size.svg" // שים לב, זהה ל-Reset Size
        },
        {
            name: "Shrink",
            type: "shrink",
            svgFile: "Shrink.svg"
        },
        {
            name: "Reset Size",
            type: "resetSize",
            svgFile: "reset-size.svg" // שים לב, זהה ל-Grow
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
// פונקציה ליצירת אלמנט בלוק (מהפלטה)
// ========================================================================
function createBlockElement(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container");
    blockContainer.dataset.type = block.type;
    blockContainer.dataset.category = category; // שמור את הקטגוריה המקורית

    // יצירת אלמנט תמונה לבלוק
    const blockImage = document.createElement("img");
    blockImage.src = `assets/block/${block.svgFile}`;
    blockImage.alt = block.name;
    blockImage.classList.add("block-svg-image");
    // מניעת גרירת התמונה עצמה באופן טבעי של הדפדפן
    blockImage.draggable = false;

    // טיפול בשגיאות טעינת תמונה
    blockImage.onerror = function() {
        console.warn(`SVG image not found: assets/block/${block.svgFile}`);
        // מראה חלופי פשוט במקרה של שגיאה
        blockContainer.textContent = block.name; // הצג את שם הבלוק במקום תמונה שבורה
        blockContainer.style.border = "1px dashed red";
        blockContainer.style.backgroundColor = "#ffeeee";
        blockContainer.style.padding = "5px";
        blockContainer.style.display = 'inline-block'; // כדי שיהיה רוחב וגובה
    };

    blockContainer.appendChild(blockImage);

    // הוספת מאפייני גרירה *רק לבלוקים בפלטה*
    // linkageimproved.js יטפל בגרירה בתוך אזור התכנות
    blockContainer.draggable = true;
    blockContainer.addEventListener("dragstart", (event) => {
        // העבר את הנתונים הדרושים ליצירת הבלוק באזור התכנות
        event.dataTransfer.setData("text/plain", JSON.stringify({
            type: block.type,
            category: category, // העבר את הקטגוריה
            name: block.name,
            svgFile: block.svgFile // העבר גם את שם הקובץ, למקרה שנצטרך אותו
        }));
        event.dataTransfer.effectAllowed = "copy"; // שנה ל-'copy' כי אנחנו יוצרים עותק חדש
        console.log(`Drag Start from Palette: ${block.name}`);
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
        // console.log(`Creating block: ${block.name} (${block.svgFile})`); // אפשר להוריד את הלוג הזה אם רוצים פחות רעש
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
        // console.log('Activated tab:', tab.getAttribute('data-category')); // לוג פחות קריטי
    } else {
        console.warn(`Tab not found for category: ${category}`);
    }

    if (categoryDiv) {
        categoryDiv.classList.add("active");
        // console.log('Activated category div:', categoryDiv.id); // לוג פחות קריטי

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
    // ודא שה-CSS נטען לפני קריאה ל-getComputedStyle
    // אפשר להוסיף בדיקה או להסתמך על כך שה-CSS תמיד נטען
    try {
        switch(category) {
            case 'triggering': return getComputedStyle(document.documentElement).getPropertyValue('--triggering-color').trim();
            case 'motion': return getComputedStyle(document.documentElement).getPropertyValue('--motion-color').trim();
            case 'looks': return getComputedStyle(document.documentElement).getPropertyValue('--looks-color').trim();
            case 'sound': return getComputedStyle(document.documentElement).getPropertyValue('--sound-color').trim();
            case 'control': return getComputedStyle(document.documentElement).getPropertyValue('--control-color').trim();
            case 'end': return getComputedStyle(document.documentElement).getPropertyValue('--end-color').trim();
            default: return '#DDDDDD'; // צבע ברירת מחדל ברור יותר
        }
    } catch (e) {
        console.error("Error getting computed style for category color. CSS might not be loaded?", e);
        return '#CCCCCC'; // צבע ברירת מחדל במקרה של שגיאה
    }
}

// ========================================================================
// פונקציה לטיפול בהשמטת בלוק באזור התכנות
// ========================================================================
function handleDrop(event) {
    event.preventDefault();
    console.log("Drop event detected on programming area.");

    // קבל הפניה לאזור התכנות
    const programmingArea = document.getElementById("program-blocks");
    if (!programmingArea) {
        console.error("Programming area not found in handleDrop!");
        return;
    }

    // --- חשוב: הבחנה בין גרירה מהפלטה לגרירה פנימית ---
    // linkageimproved.js מטפל בגרירה פנימית (mousedown/move/up).
    // פונקציית drop זו אמורה לפעול *רק* עבור גרירה מהפלטה.
    // נבדוק אם המידע המועבר מגיע מהפלטה (JSON עם category)
    const dataString = event.dataTransfer.getData("text/plain");
    let data;
    try {
        data = JSON.parse(dataString);
    } catch (e) {
        console.warn("Drop event without valid JSON data. Likely internal drag handled by linkageimproved.js. Ignoring drop.", dataString);
        // אם זה לא JSON תקין, נניח שזה לא מהפלטה ונצא
        // linkageimproved יטפל במיקום הסופי ב-mouseup שלו.
        return;
    }

    // ודא שהנתונים מכילים את המאפיינים הצפויים מהפלטה
    if (!data || !data.type || !data.category || !data.name) {
        console.warn("Dropped data doesn't seem to be from palette. Ignoring.", data);
        return;
    }

    console.log("Processing drop from palette:", data);

    // --- המשך יצירת בלוק חדש מהפלטה ---
    try {
        const blockCategory = data.category;
        // נמצא את הגדרת הבלוק המקורית לפי הנתונים שהועברו
        const blockDefinition = blocks[blockCategory]?.find(b => b.type === data.type);

        if (!blockDefinition) {
            console.error("Could not find block definition for dropped block:", data);
            return;
        }

        // יצירת אלמנט הבלוק החדש באמצעות הפונקציה הקיימת
        // חשוב: הפונקציה createBlockElement מוסיפה מאזין dragstart - זה מיותר כאן
        // כי הגרירה הבאה תהיה פנימית. נשתמש בפונקציה אחרת או נסיר את המאזין.
        // ניצור פונקציה ייעודית ליצירת בלוק *באזור התכנות*
        const newBlock = createProgrammingBlockElement(blockDefinition, blockCategory);

        // הוספת הבלוק החדש לאזור התכנות
        programmingArea.appendChild(newBlock);
        console.log("New block element created and appended:", newBlock);

        // מיקום הבלוק החדש לפי נקודת ההפלה
        const rect = programmingArea.getBoundingClientRect();
        newBlock.style.position = "absolute"; // linkageimproved.js מצפה לזה

        // חשוב לחשב רוחב/גובה *אחרי* ההוספה ל-DOM
        const blockWidth = newBlock.offsetWidth || 100; // רוחב ברירת מחדל
        const blockHeight = newBlock.offsetHeight || 40; // גובה ברירת מחדל

        // חישוב מיקום יחסי לאזור התכנות
        let dropX = event.clientX - rect.left - (blockWidth / 2);
        let dropY = event.clientY - rect.top - (blockHeight / 2);

        // תיקון מיקום כדי למנוע יציאה מהגבולות
        dropX = Math.max(0, Math.min(dropX, rect.width - blockWidth));
        dropY = Math.max(0, Math.min(dropY, rect.height - blockHeight));

        newBlock.style.left = `${dropX}px`;
        newBlock.style.top = `${dropY}px`;
        console.log(`Positioned new block at: x=${dropX}, y=${dropY}`);


        // --- *** התיקון הקריטי: רישום הבלוק החדש במערכת ההצמדה *** ---
        if (window.registerNewBlockForLinkage) {
            console.log(">>> Calling registerNewBlockForLinkage from script.js for:", newBlock); // לוג אישור
            window.registerNewBlockForLinkage(newBlock);
        } else {
            console.error("!!! Linkage system function 'registerNewBlockForLinkage' not found in script.js handleDrop.");
        }
        // --- *** סוף התיקון *** ---

    } catch (e) {
        console.error("Error processing dropped block in script.js handleDrop:", e); // שפר הודעת שגיאה
    }
}

// ========================================================================
// פונקציה ייעודית ליצירת אלמנט בלוק *באזור התכנות*
// (בלי מאזין dragstart של הפלטה)
// ========================================================================
function createProgrammingBlockElement(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container"); // אותם קלאסים
    blockContainer.dataset.type = block.type;
    blockContainer.dataset.category = category;

    // יצירת אלמנט תמונה לבלוק
    const blockImage = document.createElement("img");
    blockImage.src = `assets/block/${block.svgFile}`;
    blockImage.alt = block.name;
    blockImage.classList.add("block-svg-image");
    blockImage.draggable = false; // למנוע גרירת תמונה טבעית

    // טיפול בשגיאות טעינת תמונה
    blockImage.onerror = function() {
        console.warn(`(Programming Area) SVG image not found: assets/block/${block.svgFile}`);
        blockContainer.textContent = block.name;
        blockContainer.style.border = "1px dashed orange"; // צבע שונה לאזור התכנות
        blockContainer.style.backgroundColor = "#fff5e6";
        blockContainer.style.padding = "5px";
        blockContainer.style.display = 'inline-block';
        blockContainer.style.minWidth = '50px'; // להבטיח גודל מינימלי
    };

    blockContainer.appendChild(blockImage);

    // *** לא מוסיפים כאן מאזין dragstart ***
    // linkageimproved.js מטפל בגרירה באמצעות mousedown על אזור התכנות

    return blockContainer;
}


// ========================================================================
// אתחול כללי - מופעל כשה-DOM נטען
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");

    // אתחול אזור התכנות (מאזיני Drop מהפלטה)
    const programmingArea = document.getElementById("program-blocks");
    if (programmingArea) {
        // מאזין dragover נדרש כדי לאפשר drop
        programmingArea.addEventListener("dragover", (event) => {
            // בדוק אם הנתונים המועברים הם מהסוג שאנו מצפים לו מהפלטה
            if (event.dataTransfer.types.includes("text/plain")) {
                event.preventDefault(); // אפשר את ההפלה רק אם זה מהפלטה
                event.dataTransfer.dropEffect = "copy"; // סמן שזה עותק
            } else {
                // אם זה לא מהפלטה, אל תאפשר drop (זה יטופל ב-mouseup של linkageimproved)
                 event.dataTransfer.dropEffect = "none";
            }
        });

        // מאזין drop מטפל *רק* בבלוקים מהפלטה
        programmingArea.addEventListener("drop", handleDrop);
        console.log("Programming area dragover/drop listeners initialized (for palette drops)");
    } else {
        console.error("Programming area element not found!");
    }

    // אתחול כרטיסיות הקטגוריות
    const categoryTabs = document.querySelectorAll(".category-tab");
    if (categoryTabs.length > 0) {
        categoryTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const category = tab.getAttribute('data-category');
                // console.log(`Tab clicked: ${category}`); // פחות קריטי
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
            programmingArea.innerHTML = ""; // מנקה את כל הבלוקים
            console.log("Programming area cleared");
            // אופציונלי: לאפס גם את המצב הפנימי של linkageimproved אם יש צורך
        });
    }

    // אתחול גרירת דמות (קוד זה נשאר ללא שינוי)
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

        // עיכוב קל למרכוז כדי לאפשר ל-layout להתייצב
        setTimeout(centerCharacter, 100); // הקטנתי את העיכוב

        // טיפול בגרירת דמות
        let isDragging = false;
        let offsetX, offsetY;

        character.addEventListener('dragstart', function(e) {
            e.preventDefault(); // למנוע התנהגות גרירה טבעית
            return false;
        });

        character.addEventListener('mousedown', function(e) {
            if (e.target !== character) return; // רק אם הלחיצה ישירות על הדמות
            e.preventDefault(); // למנוע תופעות לוואי

            const charRect = character.getBoundingClientRect();
            offsetX = e.clientX - charRect.left;
            offsetY = e.clientY - charRect.top;

            isDragging = true;
            character.style.cursor = 'grabbing';
            character.style.transition = 'none'; // למנוע אנימציות בזמן גרירה
            document.addEventListener('mousemove', handleCharacterMove); // הוסף מאזינים רק כשמתחילים גרירה
            document.addEventListener('mouseup', handleCharacterUp);
        });

        function handleCharacterMove(e) {
            if (!isDragging) return;

            character.style.transform = 'none'; // בטל טרנספורמציות קודמות אם היו

            const stageRect = stageElement.getBoundingClientRect();
            let newLeft = e.clientX - stageRect.left - offsetX;
            let newTop = e.clientY - stageRect.top - offsetY;

            const charRect = character.getBoundingClientRect(); // קבל מידות עדכניות
            const maxLeft = stageRect.width - charRect.width;
            const maxTop = stageRect.height - charRect.height;

            // הגבלת התנועה לגבולות הבמה
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            character.style.left = newLeft + 'px';
            character.style.top = newTop + 'px';
        }

         function handleCharacterUp() {
             if (isDragging) {
                 isDragging = false;
                 character.style.cursor = 'grab'; // החזר סמן רגיל
                 document.removeEventListener('mousemove', handleCharacterMove); // הסר מאזינים
                 document.removeEventListener('mouseup', handleCharacterUp);
             }
         }
    } // סוף בלוק גרירת דמות

    // אתחול הקטגוריה הראשונית
    let initialCategory = 'triggering';
    const activeTab = document.querySelector(".category-tab.active");

    if (activeTab && activeTab.getAttribute('data-category')) {
        initialCategory = activeTab.getAttribute('data-category');
    } else {
        const triggeringTab = document.querySelector('.category-tab[data-category="triggering"]');
        if (triggeringTab) {
            // הפעל רק אם נמצא ולא פעיל כבר
            if (!triggeringTab.classList.contains('active')) {
                 handleCategoryChange(initialCategory); // הפעל קטגוריה ראשונית
            }
        } else {
             // אם גם הקטגוריה הראשונית לא נמצאה, נסה את הראשונה ברשימה
             const firstTab = document.querySelector(".category-tab");
             if (firstTab) {
                 initialCategory = firstTab.getAttribute('data-category');
                 handleCategoryChange(initialCategory);
             } else {
                 console.warn("No category tabs found to initialize.");
             }
        }
    }
    // אם כבר יש טאב פעיל, אל תקרא ל-handleCategoryChange שוב שלא לצורך
    // handleCategoryChange(initialCategory); // הסרנו את הקריאה הלא מותנית

    console.log("Initialization complete.");
}); // סוף DOMContentLoaded
