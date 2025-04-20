// ========================================================================
// הגדרת בלוקים (Blocks) עם שמות הקבצים המדויקים
// ========================================================================

const blocks = { /* ... תוכן זהה ... */
    triggering: [ { name: "Green Flag", type: "startOnGreenFlag", svgFile: "Start on Green Flag.svg" }, { name: "Tap", type: "startOnTap", svgFile: "Start on Tap.svg" }, { name: "Bump", type: "startOnBump", svgFile: "Start on Bump.svg" }, { name: "Send Message", type: "sendMessage", svgFile: "Send Message blue.svg" }, { name: "Receive Message", type: "startOnMessage", svgFile: "Send Message orange.svg" }, ], motion: [ { name: "Move Right", type: "moveRight", svgFile: "Move Right.svg" }, { name: "Move Left", type: "moveLeft", svgFile: "Move Left.svg" }, { name: "Move Up", type: "moveUp", svgFile: "Move Up.svg" }, { name: "Move Down", type: "moveDown", svgFile: "Move Down.svg" }, { name: "Turn Right", type: "turnRight", svgFile: "Turn Right.svg" }, { name: "Turn Left", type: "turnLeft", svgFile: "Turn Left.svg" }, { name: "Hop", type: "hop", svgFile: "Hop.svg" }, { name: "Go Home", type: "goHome", svgFile: "Go home.svg" }, ], looks: [ { name: "Say", type: "say", svgFile: "say.svg" }, { name: "Grow", type: "grow", svgFile: "reset-size.svg" }, { name: "Shrink", type: "shrink", svgFile: "Shrink.svg" }, { name: "Reset Size", type: "resetSize", svgFile: "reset-size.svg" }, { name: "Hide", type: "hide", svgFile: "hide.svg" }, { name: "Show", type: "show", svgFile: "show.svg" }, ], sound: [ { name: "Play Sound", type: "popSound", svgFile: "pop.svg" }, { name: "Play Recorded Sound", type: "playRecordedSound", svgFile: "Play Recorded Sound.svg" }, ], control: [ { name: "Stop", type: "stop", svgFile: "Stop.svg" }, { name: "Wait", type: "wait", svgFile: "Wait.svg" }, { name: "Set Speed", type: "setSpeed", svgFile: "Set Speed.svg" }, { name: "Repeat", type: "repeat", svgFile: "repeat.svg", isSpecial: true }, ], end: [ { name: "End", type: "end", svgFile: "end.svg" }, { name: "Repeat Forever", type: "repeatForever", svgFile: "repeat-forever.svg" }, { name: "Go To Page", type: "goToPage", svgFile: "Go to page.svg" }, ],
 };

// ========================================================================
// פונקציה ליצירת אלמנט בלוק (מהפלטה)
// ========================================================================
function createBlockElement(block, category) { /* ... תוכן זהה ... */
    const blockContainer = document.createElement("div"); blockContainer.classList.add("block-container"); blockContainer.dataset.type = block.type; blockContainer.dataset.category = category; const blockImage = document.createElement("img"); blockImage.src = `assets/block/${block.svgFile}`; blockImage.alt = block.name; blockImage.classList.add("block-svg-image"); blockImage.draggable = false; blockImage.onerror = function() { console.warn(`SVG image not found: assets/block/${block.svgFile}`); blockContainer.textContent = block.name; blockContainer.style.border = "1px dashed red"; blockContainer.style.backgroundColor = "#ffeeee"; blockContainer.style.padding = "5px"; blockContainer.style.display = 'inline-block'; }; blockContainer.appendChild(blockImage); blockContainer.draggable = true; blockContainer.addEventListener("dragstart", (event) => { try { const dataToSend = JSON.stringify({ type: block.type, category: category, name: block.name, svgFile: block.svgFile }); event.dataTransfer.setData("text/plain", dataToSend); event.dataTransfer.effectAllowed = "copy"; } catch (e) { console.error("Error setting drag data:", e); } }); return blockContainer;
}

// ========================================================================
// פונקציה למילוי הקטגוריה בבלוקים
// ========================================================================
function populateBlockPalette(category) { /* ... תוכן זהה ... */
    const categoryDiv = document.getElementById(`${category}-blocks`); if (!categoryDiv) { console.error(`Category div not found for ${category}`); return; } categoryDiv.innerHTML = ""; if (!blocks[category] || blocks[category].length === 0) { console.warn(`No blocks defined for category ${category}`); return; } blocks[category].forEach(block => { const blockElement = createBlockElement(block, category); categoryDiv.appendChild(blockElement); });
}

// ========================================================================
// פונקציה לטיפול בשינוי קטגוריה עם עדכון צבע הרקע
// ========================================================================
function handleCategoryChange(category) { /* ... תוכן זהה ... */
    const categoryTabs = document.querySelectorAll(".category-tab"); const blockCategories = document.querySelectorAll(".block-category"); blockCategories.forEach(element => element.classList.remove("active")); categoryTabs.forEach(tab => tab.classList.remove("active")); const tab = document.querySelector(`.category-tab[data-category="${category}"]`); const categoryDiv = document.getElementById(`${category}-blocks`); if (tab) { tab.classList.add("active"); } else { console.warn(`Tab not found for category: ${category}`); } if (categoryDiv) { categoryDiv.classList.add("active"); const blockPalette = document.getElementById("block-palette"); if (blockPalette) { blockPalette.style.borderColor = getCategoryColor(category); } populateBlockPalette(category); } else { console.warn(`Block category container not found for: ${category}`); }
}

// ========================================================================
// פונקציית עזר לקבלת הצבע המתאים לקטגוריה
// ========================================================================
function getCategoryColor(category) { /* ... תוכן זהה ... */
    try { switch(category) { case 'triggering': return getComputedStyle(document.documentElement).getPropertyValue('--triggering-color').trim(); case 'motion': return getComputedStyle(document.documentElement).getPropertyValue('--motion-color').trim(); case 'looks': return getComputedStyle(document.documentElement).getPropertyValue('--looks-color').trim(); case 'sound': return getComputedStyle(document.documentElement).getPropertyValue('--sound-color').trim(); case 'control': return getComputedStyle(document.documentElement).getPropertyValue('--control-color').trim(); case 'end': return getComputedStyle(document.documentElement).getPropertyValue('--end-color').trim(); default: return '#DDDDDD'; } } catch (e) { console.error("Error getting category color:", e); return '#CCCCCC'; }
}

// ========================================================================
// פונקציה לטיפול בהשמטת בלוק באזור התכנות (נטרלנו קוד ישן)
// ========================================================================
function handleDrop(event) {
    event.preventDefault();
    const programmingArea = document.getElementById("program-blocks");
    if (!programmingArea) { console.error("Programming area not found in handleDrop!"); return; }

    const dataString = event.dataTransfer.getData("text/plain");
    let data;
    try { data = JSON.parse(dataString); }
    catch (e) { console.log("handleDrop ignored: Not valid JSON data (likely internal drag)."); return; }

    if (!data || !data.type || !data.category || !data.name || !data.svgFile) {
        console.warn("handleDrop ignored: Dropped data missing required fields.", data); return;
    }

    console.log("handleDrop: Processing drop from palette:", data);

    try {
        const blockCategory = data.category;
        const blockDefinition = blocks[blockCategory]?.find(b => b.type === data.type);
        if (!blockDefinition) { console.error("Could not find block definition for dropped block:", data); return; }

        const newBlock = createProgrammingBlockElement(blockDefinition, blockCategory);
        programmingArea.appendChild(newBlock);

        const rect = programmingArea.getBoundingClientRect();
        newBlock.style.position = "absolute";
        const blockWidth = newBlock.offsetWidth || 100;
        const blockHeight = newBlock.offsetHeight || 40;
        let dropX = event.clientX - rect.left - (blockWidth / 2);
        let dropY = event.clientY - rect.top - (blockHeight / 2);
        dropX = Math.max(0, Math.min(dropX, rect.width - blockWidth));
        dropY = Math.max(0, Math.min(dropY, rect.height - blockHeight));
        newBlock.style.left = `${dropX}px`;
        newBlock.style.top = `${dropY}px`;
        console.log(`Positioned new block at: x=${dropX.toFixed(0)}, y=${dropY.toFixed(0)}`);

        if (window.registerNewBlockForLinkage) {
            console.log(">>> Calling registerNewBlockForLinkage for:", newBlock.id || 'new block (no id yet!)');
            window.registerNewBlockForLinkage(newBlock);
        } else { console.error("!!! Linkage system function 'registerNewBlockForLinkage' not found."); }

    } catch (e) { console.error("Error processing dropped block:", e); }
}

// ========================================================================
// פונקציה ייעודית ליצירת אלמנט בלוק *באזור התכנות*
// ========================================================================
function createProgrammingBlockElement(block, category) { /* ... תוכן זהה ... */
    const blockContainer = document.createElement("div"); blockContainer.classList.add("block-container"); blockContainer.dataset.type = block.type; blockContainer.dataset.category = category; const blockImage = document.createElement("img"); blockImage.src = `assets/block/${block.svgFile}`; blockImage.alt = block.name; blockImage.classList.add("block-svg-image"); blockImage.draggable = false; blockImage.onerror = function() { console.warn(`(Prog Area) SVG image not found: assets/block/${block.svgFile}`); blockContainer.textContent = block.name; blockContainer.style.border = "1px dashed orange"; blockContainer.style.backgroundColor = "#fff5e6"; blockContainer.style.padding = "5px"; blockContainer.style.display = 'inline-block'; blockContainer.style.minWidth = '50px'; }; blockContainer.appendChild(blockImage); return blockContainer;
}


// ========================================================================
// אתחול כללי - מופעל כשה-DOM נטען
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");

    // אתחול אזור התכנות
    const programmingArea = document.getElementById("program-blocks");
    if (programmingArea) { programmingArea.addEventListener("dragover", (event) => { if (event.dataTransfer.types.includes("text/plain")) { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; } else { event.dataTransfer.dropEffect = "none"; } }); programmingArea.addEventListener("drop", handleDrop); console.log("Programming area drag listeners initialized (for palette drops)"); } else { console.error("Programming area element not found!"); }

    // אתחול כרטיסיות הקטגוריות
    const categoryTabs = document.querySelectorAll(".category-tab");
    if (categoryTabs.length > 0) { categoryTabs.forEach(tab => { tab.addEventListener("click", () => { handleCategoryChange(tab.getAttribute('data-category')); }); }); console.log(`${categoryTabs.length} category tabs initialized`); } else { console.error("No category tabs found!"); }

    // אתחול כפתור הרשת
    const gridToggle = document.getElementById("grid-toggle"); const stage = document.getElementById("stage"); if (gridToggle && stage) { gridToggle.addEventListener("click", () => { stage.classList.toggle("show-grid"); }); }

    // אתחול כפתור ניקוי
    const clearAllButton = document.getElementById("clear-all"); if (clearAllButton && programmingArea) { clearAllButton.addEventListener("click", () => { programmingArea.innerHTML = ""; console.log("Programming area cleared"); }); }


    // --- *** קוד הדמות מנוטרל זמנית *** ---
    /*
    const character = document.getElementById('character');
    const stageElement = document.getElementById('stage');
    if (character && stageElement) {
         function centerCharacter() { character.style.transform = 'none'; character.style.transition = 'none'; const stageRect = stageElement.getBoundingClientRect(); const charRect = character.getBoundingClientRect(); const centerX = (stageRect.width - charRect.width) / 2; const centerY = (stageRect.height - charRect.height) / 2; character.style.position = 'absolute'; character.style.left = centerX + 'px'; character.style.top = centerY + 'px'; }
         setTimeout(centerCharacter, 100);
         let isCharDragging = false; // שם שונה כדי למנוע התנגשות
         let charOffsetX, charOffsetY;
         character.addEventListener('dragstart', (e) => {e.preventDefault(); return false;});
         character.addEventListener('mousedown', function(e) { if (e.target !== character) return; e.preventDefault(); const charRect = character.getBoundingClientRect(); charOffsetX = e.clientX - charRect.left; charOffsetY = e.clientY - charRect.top; isCharDragging = true; character.style.cursor = 'grabbing'; character.style.transition = 'none'; document.addEventListener('mousemove', handleCharacterMove); document.addEventListener('mouseup', handleCharacterUp); });
         function handleCharacterMove(e) { if (!isCharDragging) return; character.style.transform = 'none'; const stageRect = stageElement.getBoundingClientRect(); let newLeft = e.clientX - stageRect.left - charOffsetX; let newTop = e.clientY - stageRect.top - charOffsetY; const charRect = character.getBoundingClientRect(); const maxLeft = stageRect.width - charRect.width; const maxTop = stageRect.height - charRect.height; newLeft = Math.max(0, Math.min(newLeft, maxLeft)); newTop = Math.max(0, Math.min(newTop, maxTop)); character.style.left = newLeft + 'px'; character.style.top = newTop + 'px'; }
         function handleCharacterUp() { if (isCharDragging) { isCharDragging = false; character.style.cursor = 'grab'; document.removeEventListener('mousemove', handleCharacterMove); document.removeEventListener('mouseup', handleCharacterUp); } }
     }
     */
     // --- *** סוף קוד הדמות המנוטרל *** ---


    // אתחול הקטגוריה הראשונית
    let initialCategory = 'triggering'; const activeTab = document.querySelector(".category-tab.active"); if (activeTab && activeTab.getAttribute('data-category')) { initialCategory = activeTab.getAttribute('data-category'); handleCategoryChange(initialCategory); } else { const triggeringTab = document.querySelector('.category-tab[data-category="triggering"]'); if (triggeringTab) { handleCategoryChange(initialCategory); } else { const firstTab = document.querySelector(".category-tab"); if (firstTab) { initialCategory = firstTab.getAttribute('data-category'); handleCategoryChange(initialCategory); } else { console.warn("No category tabs found to initialize."); } } }
    console.log("Initialization complete.");
});
