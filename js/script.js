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
        { name: "Grow", type: "grow", svgFile: "reset-size.svg" }, // Note: Seems Grow uses reset-size icon? Verify asset.
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
        { name: "Repeat", type: "repeat", svgFile: "repeat.svg", isSpecial: true }, // Mark repeat block
    ],
    end: [
        { name: "End", type: "end", svgFile: "end.svg" },
        { name: "Repeat Forever", type: "repeatForever", svgFile: "repeat-forever.svg" },
        { name: "Go To Page", type: "goToPage", svgFile: "Go to page.svg" },
    ],
};

// ========================================================================
// פונקציה ליצירת אלמנט בלוק (גם לפלטה וגם לאזור התכנות)
// ========================================================================
function createBlockElement(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container");
    blockContainer.dataset.type = block.type;
    blockContainer.dataset.category = category;
    // blockContainer.id = generateUniqueId(blockContainer); // ID will be generated later if needed by linkage script

    // Create image element for the block SVG
    const blockImage = document.createElement("img");
    blockImage.src = `assets/block/${block.svgFile}`; // Correct path assumption
    blockImage.alt = block.name;
    blockImage.classList.add("block-svg-image");
    // Important: Prevent native image dragging which interferes
    blockImage.draggable = false;

    // Handle image loading errors
    blockImage.onerror = function() {
        console.warn(`SVG image not found or failed to load: assets/block/${block.svgFile}`);
        // Optional: Add visual indication of error
        this.style.border = "2px dashed red";
        this.style.backgroundColor = "#ffeeee";
        this.alt = `${block.name} (Image Error)`;
    };

    blockContainer.appendChild(blockImage);

    // Set initial draggable state for palette blocks
    blockContainer.draggable = true;

    blockContainer.addEventListener("dragstart", (event) => {
        // Ensure we are dragging from the palette, not moving within the programming area
        if (event.target.closest('#block-palette')) {
             // Transfer data needed to recreate the block on drop
            const transferData = {
                type: block.type,
                category: category,
                name: block.name,
                svgFile: block.svgFile // Include svgFile for recreation
            };
            event.dataTransfer.setData("application/json", JSON.stringify(transferData));
            event.dataTransfer.effectAllowed = "copy"; // Indicate copying from palette
            // Optional: Add a class for visual feedback during drag from palette
            event.target.classList.add('dragging-from-palette');
        } else {
            // Prevent default drag behavior if initiated within programming area
            // Our custom mousedown/mousemove handles this movement
            event.preventDefault();
        }
    });

     // Optional: Clean up class on drag end
    blockContainer.addEventListener("dragend", (event) => {
        event.target.classList.remove('dragging-from-palette');
    });

    return blockContainer;
}


// ========================================================================
// פונקציה למילוי פלטת הבלוקים עבור קטגוריה נבחרת
// ========================================================================
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    if (!categoryDiv) {
        console.error(`Block palette container div not found for category: ${category}`);
        return;
    }

    // Clear existing blocks from the palette category
    categoryDiv.innerHTML = "";

    // Check if blocks exist for the category
    if (!blocks[category] || blocks[category].length === 0) {
        // console.warn(`No blocks defined for category: ${category}`);
        categoryDiv.innerHTML = `<p style="color: #888; text-align: center; padding: 10px;">אין בלוקים בקטגוריה זו.</p>`;
        return;
    }

    // console.log(`Populating category: ${category} with ${blocks[category].length} blocks`);

    // Create and add block elements to the palette category div
    blocks[category].forEach(block => {
        // console.log(`Creating block for palette: ${block.name} (${block.svgFile})`);
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}

// ========================================================================
// פונקציה לטיפול בשינוי קטגוריה (לחצני טאבים)
// ========================================================================
function handleCategoryChange(category) {
    // console.log(`Changing category to: ${category}`);

    // Remove 'active' class from all tabs and category divs
    document.querySelectorAll(".category-tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".block-category").forEach(div => div.classList.remove("active"));

    // Add 'active' class to the selected tab and corresponding category div
    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    const categoryDiv = document.getElementById(`${category}-blocks`);

    if (tab) {
        tab.classList.add("active");
        // console.log('Activated tab:', tab.getAttribute('data-category'));
    } else {
        console.warn(`Tab element not found for category: ${category}`);
    }

    if (categoryDiv) {
        categoryDiv.classList.add("active");
        // console.log('Activated category div:', categoryDiv.id);

        // Update the border color of the block palette container (optional aesthetic)
        // const blockPalette = document.getElementById("block-palette");
        // if (blockPalette) {
        //     const categoryColor = getCategoryColor(category); // Use helper to get CSS var
        //     blockPalette.style.borderColor = categoryColor;
        // }

        // Populate the now active category div with its blocks
        populateBlockPalette(category);
    } else {
        console.warn(`Block category container element not found for: ${category}`);
    }
}

// ========================================================================
// פונקציית עזר לקבלת צבע הקטגוריה (אם צריך)
// ========================================================================
function getCategoryColor(category) {
    // Ensure styles are computed before accessing CSS variables
    const style = getComputedStyle(document.documentElement);
    switch(category) {
        case 'triggering': return style.getPropertyValue('--triggering-color-solid').trim() || '#FFE866';
        case 'motion':     return style.getPropertyValue('--motion-color-solid').trim() || '#66D2FF';
        case 'looks':      return style.getPropertyValue('--looks-color-solid').trim() || '#D295F6';
        case 'sound':      return style.getPropertyValue('--sound-color-solid').trim() || '#7ED957';
        case 'control':    return style.getPropertyValue('--control-color-solid').trim() || '#FFBD67';
        case 'end':        return style.getPropertyValue('--end-color-solid').trim() || '#FF6B6B';
        default:           return '#e0e0e0'; // Default fallback color
    }
}

// ========================================================================
// פונקציה לטיפול בהשלכת בלוק לאזור התכנות
// ========================================================================
function handleDrop(event) {
    event.preventDefault(); // Prevent default drop behavior (like opening file)
    const programmingArea = document.getElementById("program-blocks");
    if (!programmingArea) return;

    // Check if data was transferred correctly (expecting JSON)
    const dataString = event.dataTransfer.getData("application/json");
    if (!dataString) {
        // Maybe it was a native file drag or something else - ignore
        // console.warn("Drop event occurred without expected JSON data.");
        return;
    }

    try {
        const data = JSON.parse(dataString);
        // console.log("Dropped data:", data);

        // Validate data needed to create a block
        if (!data.type || !data.category || !data.svgFile) {
           console.error("Invalid data received on drop:", data);
           return;
        }

        // Find the full block definition from our 'blocks' object
        const blockDefinition = blocks[data.category]?.find(b => b.type === data.type);
        if (!blockDefinition) {
            console.error("Could not find block definition for dropped data:", data);
            return;
        }

        // Create a new block element using the definition
        const newBlock = createBlockElement(blockDefinition, data.category);

        // --- Position the new block ---
        const areaRect = programmingArea.getBoundingClientRect();
        // Calculate drop position relative to the programming area, considering scroll
        let dropX = event.clientX - areaRect.left + programmingArea.scrollLeft;
        let dropY = event.clientY - areaRect.top + programmingArea.scrollTop;

        // Adjust position so the drop point is near the center of the block
        // Use estimated dimensions or get them after appending briefly (less ideal)
        const blockWidth = blockDefinition.type === 'repeat' ? 256 : 100; // Use known special size
        const blockHeight = blockDefinition.type === 'repeat' ? 118 : 80;
        dropX -= blockWidth / 2;
        dropY -= blockHeight / 2;

        // Constrain position within the programming area
        dropX = Math.max(0, Math.min(dropX, programmingArea.scrollWidth - blockWidth));
        dropY = Math.max(0, Math.min(dropY, programmingArea.scrollHeight - blockHeight));

        // Apply absolute positioning styles
        newBlock.style.position = "absolute";
        newBlock.style.left = `${Math.round(dropX)}px`;
        newBlock.style.top = `${Math.round(dropY)}px`;
        newBlock.style.margin = "0"; // Ensure no margin interferes

        // Add the new block to the programming area
        // The MutationObserver in linkageimproved.js should handle adding drag listeners
        programmingArea.appendChild(newBlock);
        console.log(`Block ${newBlock.dataset.type} dropped at (${Math.round(dropX)}, ${Math.round(dropY)})`);

        // Important: Draggability within programming area is handled by linkage script
        // Set draggable=false initially, linkage mousedown will enable custom drag
        newBlock.draggable = false;


    } catch (e) {
        console.error("Error processing drop data:", e, "Data string:", dataString);
    }
}


// ========================================================================
// אתחול כללי - מופעל כשה-DOM נטען
// ========================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed.");

    // Initialize Programming Area for Dropping
    const programmingArea = document.getElementById("program-blocks");
    if (programmingArea) {
        programmingArea.addEventListener("dragover", (event) => {
            event.preventDefault(); // Necessary to allow dropping
            event.dataTransfer.dropEffect = "copy"; // Indicate copying is allowed
        });
        programmingArea.addEventListener("drop", handleDrop);
        console.log("Programming area drop listeners initialized.");
    } else {
        console.error("Programming area element (#program-blocks) not found!");
    }

    // Initialize Category Tabs
    const categoryTabs = document.querySelectorAll(".category-tab");
    if (categoryTabs.length > 0) {
        categoryTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                const category = tab.getAttribute('data-category');
                if (category) {
                    // console.log(`Tab clicked: ${category}`);
                    handleCategoryChange(category);
                } else {
                    console.warn("Clicked tab is missing data-category attribute.");
                }
            });
        });
        console.log(`${categoryTabs.length} category tabs initialized.`);
    } else {
        console.warn("No category tabs found!"); // Changed from error to warning
    }

    // Initialize Grid Toggle Button
    const gridToggle = document.getElementById("grid-toggle");
    const stage = document.getElementById("stage");
    if (gridToggle && stage) {
        gridToggle.addEventListener("click", () => {
            stage.classList.toggle("show-grid");
            console.log("Grid toggled. Has class 'show-grid':", stage.classList.contains("show-grid"));
        });
        console.log("Grid toggle initialized.");
    } else {
       if (!gridToggle) console.warn("Grid toggle button (#grid-toggle) not found.");
       if (!stage) console.warn("Stage element (#stage) not found for grid toggle.");
    }

    // Initialize Clear All Button
    const clearAllButton = document.getElementById("clear-all");
    if (clearAllButton && programmingArea) {
        clearAllButton.addEventListener("click", () => {
            if (confirm("האם אתה בטוח שברצונך למחוק את כל הבלוקים?")) { // Confirmation dialog
               programmingArea.innerHTML = ""; // Clear all blocks
               console.log("Programming area cleared by user.");
            }
        });
        console.log("Clear All button initialized.");
    } else {
        if (!clearAllButton) console.warn("Clear All button (#clear-all) not found.");
        if (!programmingArea) console.warn("Programming area not found for Clear All button."); // Should have been caught earlier
    }

    // Initialize Character Dragging on Stage
    const character = document.getElementById('character');
    const stageElement = document.getElementById('stage'); // Renamed variable for clarity
    if (character && stageElement) {
        let isDraggingChar = false;
        let startX, startY, charStartX, charStartY;

        // Center character initially (after slight delay for layout)
        function centerCharacter() {
             // Reset potential transforms from previous drags or CSS centering
            character.style.transform = 'none';
            character.style.transition = 'none'; // Disable transition during setup

            const stageRect = stageElement.getBoundingClientRect();
            const charWidth = character.offsetWidth; // Use offsetWidth for actual rendered width
            const charHeight = character.offsetHeight;

            // Calculate center position relative to stage top-left
            const centerX = (stageRect.width - charWidth) / 2;
            const centerY = (stageRect.height - charHeight) / 2;

            character.style.position = 'absolute'; // Ensure it's absolute
            character.style.left = `${centerX}px`;
            character.style.top = `${centerY}px`;
            console.log(`Character centered at (${centerX.toFixed(0)}, ${centerY.toFixed(0)})`);
        }
        setTimeout(centerCharacter, 100); // Delay slightly

        // Prevent native drag behavior on the character image
        character.addEventListener('dragstart', (e) => e.preventDefault());

        // Mouse Down on Character
        character.addEventListener('mousedown', (e) => {
            // Ensure the click is directly on the character, not something else bubbling up
            if (e.target !== character) return;
            e.preventDefault(); // Prevent text selection, etc.

            isDraggingChar = true;
            startX = e.clientX; // Mouse position at start
            startY = e.clientY;
            charStartX = character.offsetLeft; // Character position at start
            charStartY = character.offsetTop;

            character.style.cursor = 'grabbing';
            character.style.transition = 'none'; // Disable transitions during drag
            document.body.classList.add('user-select-none'); // Prevent text selection globally
            console.log("Character drag started");
        });

        // Mouse Move (Document Level)
        document.addEventListener('mousemove', (e) => {
            if (!isDraggingChar) return;
            e.preventDefault();

            const dx = e.clientX - startX; // Mouse movement delta
            const dy = e.clientY - startY;

            let newLeft = charStartX + dx;
            let newTop = charStartY + dy;

            // Constrain character within stage boundaries
            const stageRect = stageElement.getBoundingClientRect(); // Re-get in case of resize
            const charWidth = character.offsetWidth;
            const charHeight = character.offsetHeight;
            const maxLeft = stageRect.width - charWidth;
            const maxTop = stageRect.height - charHeight;

            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            character.style.left = `${newLeft}px`;
            character.style.top = `${newTop}px`;
        });

        // Mouse Up (Document Level)
        document.addEventListener('mouseup', (e) => {
            if (isDraggingChar) {
                isDraggingChar = false;
                character.style.cursor = 'grab';
                character.style.transition = ''; // Restore transitions if any defined in CSS
                document.body.classList.remove('user-select-none');
                console.log("Character drag ended");
            }
        });
        console.log("Character dragging initialized.");

    } else {
        if (!character) console.warn("Character element (#character) not found.");
        if (!stageElement) console.warn("Stage element (#stage) not found for character dragging.");
    }


    // Set Initial Category (e.g., 'triggering')
    let initialCategory = 'triggering'; // Default initial category
    // Check if an 'active' class was set in the HTML (less common)
    const activeTab = document.querySelector(".category-tab.active");
    if (activeTab && activeTab.dataset.category) {
        initialCategory = activeTab.dataset.category;
    } else {
        // Ensure the default tab exists and make it active if no other is
        const defaultTab = document.querySelector(`.category-tab[data-category="${initialCategory}"]`);
        if (defaultTab && !activeTab) { // Only set if no other tab was marked active in HTML
           defaultTab.classList.add('active');
        } else if (!defaultTab) {
           // Fallback if even the default tab doesn't exist
           const firstTab = document.querySelector(".category-tab");
           if (firstTab && firstTab.dataset.category) {
              initialCategory = firstTab.dataset.category;
              firstTab.classList.add('active');
              console.warn(`Default category '${initialCategory}' not found, using first available: ${initialCategory}`);
           } else {
               console.error("No category tabs found at all. Cannot set initial category.");
               return; // Stop initialization if no categories work
           }
        }
    }

    // Populate the initial category
    console.log(`Setting initial category to: ${initialCategory}`);
    handleCategoryChange(initialCategory);

}); // End DOMContentLoaded
