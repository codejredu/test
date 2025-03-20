// הגדרת הבלוקים
const blocks = {
    control: [
        {
            name: "Repeat",
            type: "repeat",
            icon: "assets/images/blocks/repeat.svg",
            color: "#FFCC00" // צהוב בהיר עבור Repeat
        }
    ]
};

// פונקציה ליצירת מחבר ימני
function createRightConnector(color) {
    const rightConnector = document.createElement("div");
    rightConnector.classList.add("puzzle-protrusion");
    rightConnector.style.backgroundColor = color;
    return rightConnector;
}

// פונקציה ליצירת מחבר שמאלי
function createLeftConnector() {
    const leftConnectorWrapper = document.createElement("div");
    leftConnectorWrapper.classList.add("puzzle-indent-wrapper");

    const leftConnector = document.createElement("div");
    leftConnector.classList.add("puzzle-indent");

    leftConnectorWrapper.appendChild(leftConnector);
    return leftConnectorWrapper;
}

// פונקציה ליצירת שקע תחתון עם בליטות ושקעים
function createBottomIndent(color) {
    const bottomIndent = document.createElement("div");
    bottomIndent.classList.add("bottom-indent");

    const bottomLeftProtrusion = document.createElement("div");
    bottomLeftProtrusion.classList.add("bottom-left-protrusion");
    bottomLeftProtrusion.style.backgroundColor = color;

    const bottomRightIndent = document.createElement("div");
    bottomRightIndent.classList.add("bottom-right-indent");

    bottomIndent.appendChild(bottomLeftProtrusion);
    bottomIndent.appendChild(bottomRightIndent);

    return bottomIndent;
}

// פונקציה ליצירת חץ מעוגל
function createCircularArrow() {
    const circularArrow = document.createElement("div");
    circularArrow.classList.add("circular-arrow");
    circularArrow.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="M12 16l4-4-4-4"/>
            <path d="M8 12h8"/>
        </svg>
    `;
    return circularArrow;
}

// פונקציה ליצירת מונה
function createCounter() {
    const counter = document.createElement("div");
    counter.classList.add("counter");
    counter.textContent = "10"; // ערך ברירת מחדל
    return counter;
}

// פונקציה ליצירת בלוק גרפי
function createScratchBlock(block) {
    const scratchBlock = document.createElement("div");
    scratchBlock.classList.add("scratch-block");
    scratchBlock.style.backgroundColor = block.color;

    const iconImg = document.createElement("img");
    iconImg.src = block.icon;
    iconImg.alt = block.name;
    iconImg.classList.add("block-icon-img");

    scratchBlock.appendChild(iconImg);

    // הוספת חץ מעוגל ומונה לבלוק Repeat
    if (block.type === "repeat") {
        const circularArrow = createCircularArrow();
        const counter = createCounter();
        scratchBlock.appendChild(circularArrow);
        scratchBlock.appendChild(counter);
    }

    return scratchBlock;
}

// פונקציה ליצירת אלמנט בלוק
function createBlockElement(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container");

    const scratchBlock = createScratchBlock(block);
    const rightConnector = createRightConnector(block.color);
    const leftConnector = createLeftConnector();
    const bottomIndent = createBottomIndent(block.color);

    blockContainer.appendChild(scratchBlock);
    blockContainer.appendChild(rightConnector);
    blockContainer.appendChild(leftConnector);
    blockContainer.appendChild(bottomIndent);

    blockContainer.dataset.type = block.type;
    blockContainer.draggable = true;

    blockContainer.addEventListener("dragstart", (event) => {
        handleDragStart(event, block, category);
    });

    return blockContainer;
}

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

// פונקציה לטיפול בשחרור
function handleDrop(event) {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    const blockType = data.type;
    const blockCategory = data.category;
    const blockIcon = data.icon;
    const blockColor = data.color;
    const blockName = data.name;

    const newBlock = document.createElement("div");
    newBlock.classList.add("block-container");
    newBlock.dataset.category = blockCategory;

    const scratchBlock = document.createElement("div");
    scratchBlock.classList.add("scratch-block");
    scratchBlock.style.backgroundColor = blockColor;

    const iconImg = document.createElement("img");
    iconImg.src = blockIcon;
    iconImg.alt = blockName;
    iconImg.classList.add("block-icon-img");

    scratchBlock.appendChild(iconImg);

    if (blockType === "repeat") {
        const circularArrow = createCircularArrow();
        const counter = createCounter();
        scratchBlock.appendChild(circularArrow);
        scratchBlock.appendChild(counter);
    }

    const rightConnector = createRightConnector(blockColor);
    const leftConnector = createLeftConnector();
    const bottomIndent = createBottomIndent(blockColor);

    newBlock.appendChild(scratchBlock);
    newBlock.appendChild(rightConnector);
    newBlock.appendChild(leftConnector);
    newBlock.appendChild(bottomIndent);
    newBlock.dataset.type = blockType;
    newBlock.draggable = true;

    newBlock.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData('block-index', Array.from(programmingArea.children).indexOf(newBlock).toString());
        event.dataTransfer.effectAllowed = "move";
    });

    programmingArea.appendChild(newBlock);

    const rect = programmingArea.getBoundingClientRect();
    newBlock.style.position = "absolute";
    newBlock.style.left = `${event.clientX - rect.left - (newBlock.offsetWidth / 2)}px`;
    newBlock.style.top = `${event.clientY - rect.top - (newBlock.offsetHeight / 2)}px`;
}

// הוספת הבלוקים ללוח
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    categoryDiv.innerHTML = "";
    blocks[category].forEach(block => {
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}

// אתחול
const programmingArea = document.getElementById("program-blocks");
programmingArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
});
programmingArea.addEventListener("drop", handleDrop);

const categoryTabs = document.querySelectorAll(".category-tab");
categoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const category = tab.dataset.category;
        handleCategoryChange(category);
    });
});

function handleCategoryChange(category) {
    document.querySelectorAll(".block-category").forEach(element => element.classList.remove("active"));
    document.querySelectorAll(".category-tab").forEach(tab => tab.classList.remove("active"));

    const tab = document.querySelector(`.category-tab[data-category="${category}"]`);
    tab.classList.add("active");
    document.getElementById(`${category}-blocks`).classList.add("active");
    populateBlockPalette(category);
}

document.getElementById("clear-all").addEventListener("click", () => {
    programmingArea.innerHTML = "";
});

populateBlockPalette("control");
