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
            svgFile: "reset-size.svg" // הערה: שים לב, גם ל-Grow וגם ל-Reset Size יש אותו קובץ
        },
        {
            name: "Shrink",
            type: "shrink",
            svgFile: "Shrink.svg"
        },
        {
            name: "Reset Size",
            type: "resetSize",
            svgFile: "reset-size.svg" // הערה: שים לב, גם ל-Grow וגם ל-Reset Size יש אותו קובץ
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

    // הוספת מאפייני גרירה (מהפלטה)
    blockContainer.draggable = true;
    blockContainer.addEventListener("dragstart", (event) => {
        // כשגוררים מהפלטה, שולחים את פרטי הבלוק ליצירה
        event.dataTransfer.setData("text/plain", JSON.stringify({
            type: block.type,
            category: category,
            name: block.name
        }));
        event.dataTransfer.effectAllowed = "copy"; // 'copy' כי יוצרים עותק חדש
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

    // console.log(`Populating category: ${category} with ${blocks[category].length} blocks`);

    // יצירת הבלוקים והוספתם לקטגוריה
    blocks[category].forEach(block => {
        // console.log(`Creating block: ${block.name} (${block.svgFile})`);
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}

// ========================================================================
// פונקציה לטיפול בשינוי קטגוריה עם עדכון צבע הרקע
// ========================================================================
function handleCategoryChange(category) {
    // console.log(`Changing category to: ${category}`);

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
        // console.log('Activated tab:', tab.getAttribute('data-category'));
    } else {
        console.warn(`Tab not found for category: ${category}`);
    }

    if (categoryDiv) {
        categoryDiv.classList.add("active");
        // console.log('Activated category div:', categoryDiv.id);

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
// פונקציה לטיפול בהשמטת בלוק באזור התכנות (גרסה משופרת עם לוגים)
// ========================================================================
function handleDrop(event) {
    event.preventDefault();
    console.log("[handleDrop] Drop event triggered."); // לוג חדש

    const programmingArea = document.getElementById("program-blocks");
    const rect = programmingArea.getBoundingClientRect();

    // בדיקה אם מדובר בהזזת בלוק קיים (הגיע מתוך אזור התכנות עצמו)
    const blockIndexData = event.dataTransfer.getData('block-index'); // שמירת הנתון
    if (blockIndexData !== undefined && blockIndexData !== '') {
        console.log(`[handleDrop] Moving existing block. Index data received: '${blockIndexData}'`); // לוג משופר

        // --- הערה חשובה ---
        // אם בלוק קיים הוזז, סביר להניח ש-linkageimproved.js (או קוד דומה)
        // טיפל במיקום הסופי שלו ובכל הצמדה אפשרית באירוע mouseup/dragend.
        // לכן, לרוב *אין צורך* לעדכן כאן את המיקום מחדש ב-handleDrop.
        // הפעולה העיקרית ב-drop היא לקבל את הנתונים. המיקום נקבע בסוף הגרירה.
        console.log("[handleDrop] Assuming linkage script handled final position and snapping for existing block.");

        // אפשר להשאיר את הקוד הבא אם רוצים לוודא שיש מיקום כלשהו,
        // אבל הוא עלול להידרס על ידי קוד ההצמדה.
        try {
            const draggedBlockIndex = parseInt(blockIndexData);

            if (!isNaN(draggedBlockIndex) && draggedBlockIndex >= 0 && draggedBlockIndex < programmingArea.children.length) {
                const draggedBlock = programmingArea.children[draggedBlockIndex];
                if (draggedBlock) {
                    // אופציונלי: קריאה לפונקציה חיצונית אם linkageimproved צריך לדעת שה-drop הסתיים
                    // if (window.notifyLinkageDrop) {
                    //     window.notifyLinkageDrop(draggedBlock, event.clientX, event.clientY);
                    // }
                } else {
                     console.warn(`[handleDrop] Could not find existing block DOM element at index: ${draggedBlockIndex}`);
                }
            } else {
                console.warn(`[handleDrop] Invalid index received for existing block: ${blockIndexData}`);
            }
        } catch (e) {
            console.error("[handleDrop] Error processing existing block move:", e);
        }

    } else {
        // יצירת בלוק חדש (הגיע מהפלטה)
        console.log("[handleDrop] Creating a new block (dropped from palette)."); // לוג חדש
        const dataString = event.dataTransfer.getData("text/plain");

        if (!dataString) {
            console.error("[handleDrop] No data transferred on drop for new block.");
            return;
        }
        console.log("[handleDrop] Received data string:", dataString); // לוג חדש

        try {
            const data = JSON.parse(dataString);
            console.log("[handleDrop] Parsed data:", data); // לוג חדש
            const blockCategory = data.category;
            const blockDefinition = blocks[blockCategory]?.find(b => b.type === data.type);

            if (!blockDefinition) {
                console.error("[handleDrop] Could not find block definition:", data);
                return;
            }
            console.log("[handleDrop] Found block definition:", blockDefinition); // לוג חדש

            // יצירת בלוק חדש והוספתו לאזור התכנות
            console.log("[handleDrop] Creating block element..."); // לוג חדש
            const newBlock = createBlockElement(blockDefinition, blockCategory);
            // הסרת מאפיין הגרירה המקורי (מהפלטה) כדי שלא יפריע לגרירה הפנימית
            newBlock.draggable = false;
            programmingArea.appendChild(newBlock);
            console.log("[handleDrop] New block element appended:", newBlock); // לוג חדש

            // הוספת מאזין גרירה *פנימי* לבלוק החדש (חשוב להזזה והצמדה עתידית)
            // זה מאזין שונה מזה שנוסף ב-createBlockElement
            newBlock.draggable = true; // נאפשר גרירה פנימית
            newBlock.addEventListener("dragstart", (e) => {
                // כשגוררים בלוק מתוך אזור התכנות, שולחים את האינדקס שלו
                const index = Array.from(programmingArea.children).indexOf(newBlock);
                console.log(`[dragstart on new block ${newBlock.dataset.type}] Setting block-index to: ${index}`); // לוג חדש
                e.dataTransfer.setData('block-index', index.toString());
                e.dataTransfer.effectAllowed = "move"; // 'move' כי מזיזים בלוק קיים
                // אופציונלי: הוספת קלאס שמסמן גרירה
                // newBlock.classList.add('dragging');
                // הודעה ל-linkageimproved שהגרירה התחילה (אם הוא לא מאזין ישירות ל-dragstart)
                // if (window.notifyLinkageDragStart) {
                //     window.notifyLinkageDragStart(newBlock);
                // }
            });

            // אופציונלי: מאזין לסיום הגרירה לניקוי
            // newBlock.addEventListener("dragend", (e) => {
            //     newBlock.classList.remove('dragging');
            //     // הודעה ל-linkageimproved שהגרירה הסתיימה
            //     // if (window.notifyLinkageDragEnd) {
            //     //     window.notifyLinkageDragEnd(newBlock);
            //     // }
            // });


            // מיקום הבלוק החדש
            newBlock.style.position = "absolute"; // ודא שהמיקום אבסולוטי

            // נחכה רגע קצר כדי שה-DOM יתעדכן והמידות יהיו זמינות
            requestAnimationFrame(() => {
                const blockWidth = newBlock.offsetWidth || 100; // מדידה לאחר שהוסף ל-DOM
                const blockHeight = newBlock.offsetHeight || 80; // מדידה לאחר שהוסף ל-DOM

                const initialLeft = event.clientX - rect.left - (blockWidth / 2);
                const initialTop = event.clientY - rect.top - (blockHeight / 2);
                console.log(`[handleDrop] Calculating initial position (after RAF): left=${initialLeft}, top=${initialTop} (w:${blockWidth}, h:${blockHeight})`); // לוג משופר

                // הגבלת המיקום לגבולות אזור התכנות
                const maxLeft = programmingArea.clientWidth - blockWidth;
                const maxTop = programmingArea.clientHeight - blockHeight;
                const finalLeft = Math.max(0, Math.min(initialLeft, maxLeft));
                const finalTop = Math.max(0, Math.min(initialTop, maxTop));

                newBlock.style.left = `${finalLeft}px`;
                newBlock.style.top = `${finalTop}px`;
                console.log(`[handleDrop] New block positioned at: left=${finalLeft}, top=${finalTop}`); // לוג חדש

                // --- הערה חשובה ---
                // כאן הקוד של script.js סיים את עבודתו עבור בלוק חדש.
                // כעת, linkageimproved.js אמור לזהות את הבלוק החדש (אולי דרך MutationObserver שהוספנו)
                // ולהוסיף לו את מאזיני ה-mousedown/move/up שלו (או שהוא כבר הוסיף אותם אם ה-MutationObserver מהיר)
                // לצורך גרירה עתידית והצמדה.
                // ההצמדה עצמה תקרה רק בפעם הבאה שתגרור את הבלוק *הזה* או בלוק *אחר* ותשחרר קרוב אליו.
                // אופציונלי: הודעה מפורשת ל-linkageimproved על בלוק חדש
                // if (window.notifyNewBlockAdded) {
                //     window.notifyNewBlockAdded(newBlock);
                // }
            });

        } catch (e) {
            console.error("[handleDrop] Error parsing dropped data or creating new block:", e);
        }
    }
     console.log("[handleDrop] Drop handling finished."); // לוג חדש
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
            event.preventDefault(); // חובה כדי ש-drop יעבוד
            // אפשר לשנות את ה-dropEffect בהתאם למקור הגרירה
            const isExisting = event.dataTransfer.types.includes('block-index');
            event.dataTransfer.dropEffect = isExisting ? "move" : "copy";
        });

        programmingArea.addEventListener("drop", handleDrop);
        console.log("Programming area initialized with dragover and drop listeners.");
    } else {
        console.error("Programming area element not found!");
    }

    // אתחול כרטיסיות הקטגוריות
    const categoryTabs = document.querySelectorAll(".category-tab");
    if (categoryTabs.length > 0) {
        categoryTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const category = tab.getAttribute('data-category');
                // console.log(`Tab clicked: ${category}`);
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
            // אופציונלי: להודיע ל-linkageimproved שהכל נוקה, אם הוא שומר מצב פנימי
            // if (window.notifyClearAll) {
            //     window.notifyClearAll();
            // }
        });
    }

    // אתחול גרירת דמות
    const character = document.getElementById('character');
    const stageElement = document.getElementById('stage');

    if (character && stageElement) {
        // מרכוז הדמות
        function centerCharacter() {
            character.style.position = 'absolute'; // ודא שהוא אבסולוטי לפני חישוב
            character.style.transform = 'none';
            character.style.transition = 'none'; // בטל מעברים זמנית

            const stageRect = stageElement.getBoundingClientRect();
            const charRect = character.getBoundingClientRect();

            // חישוב המרכז רק אם המידות תקינות
            if (stageRect.width > 0 && stageRect.height > 0 && charRect.width > 0 && charRect.height > 0) {
                const centerX = (stageRect.width - charRect.width) / 2;
                const centerY = (stageRect.height - charRect.height) / 2;

                character.style.left = centerX + 'px';
                character.style.top = centerY + 'px';
                console.log(`Character centered at left: ${centerX}, top: ${centerY}`);
            } else {
                 console.warn("Could not center character - stage or character dimensions invalid.");
                 // נסה שוב עוד מעט, אולי התמונה עוד לא נטענה
                 setTimeout(centerCharacter, 300);
            }
        }

        // קריאה ראשונית למירכוז (אולי עם השהייה קלה כדי לאפשר טעינת תמונות)
        setTimeout(centerCharacter, 100); // הוספתי השהייה קצרה

        // טיפול בגרירת דמות
        let isDragging = false;
        let offsetX, offsetY;

        // מניעת התנהגות ברירת מחדל של גרירת תמונה
        character.addEventListener('dragstart', function(e) {
            e.preventDefault();
        });

        character.addEventListener('mousedown', function(e) {
            // אפשר לגרור רק בלחיצה ישירה על הדמות, לא על אלמנטים פנימיים אם יהיו
            if (e.target !== character && !character.contains(e.target)) return;
            e.preventDefault(); // מניעת בחירת טקסט או גרירת תמונה

            const charRect = character.getBoundingClientRect();
            const stageRect = stageElement.getBoundingClientRect();
            // חשוב: offsetX/Y ביחס לפינה העליונה-שמאלית של ה-stage, לא של הדמות
            offsetX = e.clientX - stageRect.left - parseFloat(character.style.left || 0);
            offsetY = e.clientY - stageRect.top - parseFloat(character.style.top || 0);


            isDragging = true;
            character.style.cursor = 'grabbing';
            character.style.transition = 'none'; // בטל מעברים בזמן גרירה
            console.log("Character dragging started");
        });

        // מאזין על ה-document כדי לתפוס תנועה גם מחוץ ל-stage
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            const stageRect = stageElement.getBoundingClientRect();

            // חישוב המיקום החדש של הפינה השמאלית-עליונה של הדמות ביחס ל-stage
            let newLeft = e.clientX - stageRect.left - offsetX;
            let newTop = e.clientY - stageRect.top - offsetY;

            // קבלת מידות הדמות (יכולות להשתנות אם יש אפקטים)
            const charRect = character.getBoundingClientRect();
            const charWidth = charRect.width;
            const charHeight = charRect.height;

            // הגבלת התנועה לגבולות ה-stage
            const maxLeft = stageRect.width - charWidth;
            const maxTop = stageRect.height - charHeight;

            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            character.style.left = newLeft + 'px';
            character.style.top = newTop + 'px';
        });

        // מאזין על ה-document כדי לתפוס שחרור עכבר בכל מקום
        document.addEventListener('mouseup', function(e) {
            if (isDragging) {
                isDragging = false;
                character.style.cursor = 'grab'; // או סמן ברירת מחדל
                console.log(`Character dragging ended at left: ${character.style.left}, top: ${character.style.top}`);
            }
        });
    } else {
         if (!character) console.error("Character element not found!");
         if (!stageElement) console.error("Stage element not found!");
    }

    // אתחול הקטגוריה הראשונית
    let initialCategory = 'triggering'; // ברירת מחדל
    const activeTab = document.querySelector(".category-tab.active"); // בדוק אם יש כבר active ב-HTML

    if (activeTab && activeTab.getAttribute('data-category')) {
        initialCategory = activeTab.getAttribute('data-category');
        console.log(`Initial category from HTML: ${initialCategory}`);
    } else {
        // אם אין active ב-HTML, נסה להפוך את triggering ל-active
        const triggeringTab = document.querySelector('.category-tab[data-category="triggering"]');
        if (triggeringTab) {
            // אל תוסיף כאן 'active', תן ל-handleCategoryChange לעשות זאת
             console.log(`No initial active tab found in HTML, defaulting to: ${initialCategory}`);
        } else {
             console.warn("Triggering category tab not found, cannot set default.");
             // נסה למצוא את הטאב הראשון ולהשתמש בו
             const firstTab = document.querySelector(".category-tab");
             if (firstTab && firstTab.getAttribute('data-category')) {
                 initialCategory = firstTab.getAttribute('data-category');
                 console.log(`Using first available tab as initial category: ${initialCategory}`);
             } else {
                 console.error("No category tabs found at all!");
                 initialCategory = null; // אין קטגוריה לאתחל
             }
        }
    }

    // הפעלת הקטגוריה הראשונית (רק אם מצאנו אחת)
    if (initialCategory) {
        handleCategoryChange(initialCategory);
    } else {
         console.error("Could not determine initial category to load.");
    }
});
