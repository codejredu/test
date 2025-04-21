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
function createBlockElementForPalette(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container", "in-palette");
    blockContainer.dataset.type = block.type;
    blockContainer.dataset.category = category;

    const blockImage = document.createElement("img");
    blockImage.src = `assets/block/${block.svgFile}`;
    blockImage.alt = block.name;
    blockImage.classList.add("block-svg-image");
    blockImage.onerror = function() {
        console.warn(`[script.js] SVG image not found: assets/block/${block.svgFile}`);
        this.style.border = "2px dashed red"; this.style.background = "#ffeeee";
    };
    blockContainer.appendChild(blockImage);

    blockContainer.draggable = true;
    blockContainer.addEventListener("dragstart", (event) => {
        console.log(`[script.js dragstart from palette] Firing for: ${block.type}`);
        try {
             const dataToSend = JSON.stringify({ type: block.type, category: category, name: block.name, isNew: true });
             event.dataTransfer.setData("text/plain", dataToSend);
             event.dataTransfer.effectAllowed = "copy";
        } catch (e) { console.error("[script.js] Error setting drag data:", e); }
    });
    return blockContainer;
}

// ========================================================================
// פונקציה למילוי הקטגוריה בבלוקים
// ========================================================================
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    if (!categoryDiv) { console.error(`[script.js] Category div not found for ${category}`); return; }
    categoryDiv.innerHTML = "";
    if (!blocks[category] || blocks[category].length === 0) { console.warn(`[script.js] No blocks defined for category ${category}`); return; }
    blocks[category].forEach(block => { categoryDiv.appendChild(createBlockElementForPalette(block, category)); });
}

// ========================================================================
// פונקציה לטיפול בשינוי קטגוריה עם עדכון צבע הרקע
// ========================================================================
function handleCategoryChange(category) {
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
        if (blockPalette) { blockPalette.style.borderColor = getCategoryColor(category); }
        populateBlockPalette(category);
    } else { console.warn(`[script.js] Block category container not found for: ${category}`); }
}

// ========================================================================
// פונקציית עזר לקבלת הצבע המתאים לקטגוריה
// ========================================================================
function getCategoryColor(category) {
    const rootStyle = getComputedStyle(document.documentElement);
    switch(category) {
        case 'triggering': return rootStyle.getPropertyValue('--triggering-color').trim() || '#FFBF1A';
        case 'motion':     return rootStyle.getPropertyValue('--motion-color').trim() || '#4a90e2';
        case 'looks':      return rootStyle.getPropertyValue('--looks-color').trim() || '#9013fe';
        case 'sound':      return rootStyle.getPropertyValue('--sound-color').trim() || '#cf63cf';
        case 'control':    return rootStyle.getPropertyValue('--control-color').trim() || '#e1a91a';
        case 'end':        return rootStyle.getPropertyValue('--end-color').trim() || '#ff6347';
        default:           return '#e0e0e0';
    }
}

// ========================================================================
// פונקציה לטיפול בהשמטת בלוק באזור התכנות (רק ליצירת בלוקים חדשים)
// ========================================================================
function handleDrop(event) {
    event.preventDefault();
    console.log("[script.js handleDrop] Drop event triggered.");
    const programmingArea = document.getElementById("program-blocks");
    if (!programmingArea) { console.error("[script.js handleDrop] Programming area not found!"); return; }
    const rect = programmingArea.getBoundingClientRect();
    const dataString = event.dataTransfer.getData("text/plain");
    if (!dataString) { console.error("[script.js handleDrop] No data transferred on drop."); return; }
    console.log("[script.js handleDrop] Received data string:", dataString);

    try {
        const data = JSON.parse(dataString);
        if (data.isNew === true) {
            console.log("[script.js handleDrop] Data indicates a new block from palette. Creating...");
            const blockCategory = data.category;
            const blockDefinition = blocks[blockCategory]?.find(b => b.type === data.type);
            if (!blockDefinition) { console.error("[script.js handleDrop] Could not find block definition:", data); return; }
            console.log("[script.js handleDrop] Found block definition:", blockDefinition);

            const newBlockContainer = document.createElement("div");
            newBlockContainer.classList.add("block-container");
            newBlockContainer.dataset.type = blockDefinition.type;
            newBlockContainer.dataset.category = blockCategory;

            const newBlockImage = document.createElement("img");
            newBlockImage.src = `assets/block/${blockDefinition.svgFile}`;
            newBlockImage.alt = blockDefinition.name;
            newBlockImage.classList.add("block-svg-image");
            newBlockImage.onerror = function() { console.warn(`[script.js] SVG image failed: ${blockDefinition.svgFile}`); this.style.border = "1px dashed red"; };
            newBlockContainer.appendChild(newBlockImage);

            programmingArea.appendChild(newBlockContainer);
            console.log("[script.js handleDrop] New block element appended:", newBlockContainer);

            newBlockContainer.style.position = "absolute";
            requestAnimationFrame(() => {
                const blockWidth = newBlockContainer.offsetWidth || 100;
                const blockHeight = newBlockContainer.offsetHeight || 80;
                let initialLeft = event.clientX - rect.left - (blockWidth / 2);
                let initialTop = event.clientY - rect.top - (blockHeight / 2);
                const maxLeft = programmingArea.clientWidth - blockWidth;
                const maxTop = programmingArea.clientHeight - blockHeight;
                const finalLeft = Math.max(0, Math.min(initialLeft, maxLeft));
                const finalTop = Math.max(0, Math.min(initialTop, maxTop));
                newBlockContainer.style.left = `${finalLeft}px`;
                newBlockContainer.style.top = `${finalTop}px`;
                console.log(`[script.js handleDrop] New block positioned at: left=${finalLeft}, top=${finalTop}`);

                // --- *** הפעלה ידנית של עדכון המאזינים (לאבחון) *** ---
                if (typeof window.updateLinkageListeners === 'function') {
                    console.log("[script.js handleDrop] Manually triggering listener update for linkage script.");
                    window.updateLinkageListeners(); // קריאה לפונקציה גלובלית שנגדיר ב-linkageimproved
                } else {
                     console.warn("[script.js handleDrop] window.updateLinkageListeners not found.");
                }
                // --- *** סוף הפעלה ידנית *** ---
            });
        } else {
            console.log("[script.js handleDrop] Drop detected, but not a new block. Assuming handled elsewhere.");
        }
    } catch (e) { console.error("[script.js handleDrop] Error:", e); }
    console.log("[script.js handleDrop] Drop handling finished.");
}

// ========================================================================
// אתחול כללי - מופעל כשה-DOM נטען
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("[script.js] DOM fully loaded");

    const programmingArea = document.getElementById("program-blocks");
    if (programmingArea) {
        programmingArea.addEventListener("dragover", (event) => {
            if (event.dataTransfer.types.includes("text/plain")) {
                 event.preventDefault(); event.dataTransfer.dropEffect = "copy";
            }
        });
        programmingArea.addEventListener("drop", handleDrop);
        console.log("[script.js] Programming area initialized with dragover (copy only) and drop listeners.");
    } else { console.error("[script.js] Programming area element (#program-blocks) not found!"); }

    const categoryTabs = document.querySelectorAll(".category-tab");
    if (categoryTabs.length > 0) {
        categoryTabs.forEach(tab => { tab.addEventListener("click", () => { handleCategoryChange(tab.dataset.category); }); });
        console.log(`[script.js] ${categoryTabs.length} category tabs initialized`);
    } else { console.error("[script.js] No category tabs found!"); }

    const gridToggle = document.getElementById("grid-toggle");
    const stage = document.getElementById("stage");
    if (gridToggle && stage) { gridToggle.addEventListener("click", () => { stage.classList.toggle("show-grid"); console.log("[script.js] Grid toggled"); }); }

    const clearAllButton = document.getElementById("clear-all");
    if (clearAllButton && programmingArea) { clearAllButton.addEventListener("click", () => { programmingArea.innerHTML = ""; console.log("[script.js] Programming area cleared"); /* if (window.notifyLinkageClearAll) window.notifyLinkageClearAll(); */ }); }

    const character = document.getElementById('character');
    const stageElement = document.getElementById('stage');
    if (character && stageElement) {
        function centerCharacter() { /* ... (כמו קודם) ... */ }
        setTimeout(centerCharacter, 150);
        let isDraggingChar = false, charOffsetX, charOffsetY;
        character.addEventListener('dragstart', (e) => e.preventDefault());
        character.addEventListener('mousedown', function(e) { /* ... (כמו קודם) ... */ });
        document.addEventListener('mousemove', function(e) { /* ... (כמו קודם) ... */ });
        document.addEventListener('mouseup', function(e) { /* ... (כמו קודם) ... */ });
        console.log("[script.js] Character dragging initialized.");
    } else { /* Error logging */ }

    let initialCategory = 'triggering';
    const activeTab = document.querySelector(".category-tab.active");
    if (activeTab && activeTab.dataset.category) { initialCategory = activeTab.dataset.category; console.log(`[script.js] Initial category from HTML: ${initialCategory}`); }
    else { console.log(`[script.js] No initial active tab found, defaulting to: ${initialCategory}`); }
    const initialTabElement = document.querySelector(`.category-tab[data-category="${initialCategory}"]`);
    if (initialTabElement) { handleCategoryChange(initialCategory); }
    else { /* Fallback or error */ console.error(`[script.js] Initial category tab ('${initialCategory}') not found!`); }
});

// --- END OF FILE script.js ---
