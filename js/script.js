``javascript
const blocks = {
triggering: [
{ name: "Green Flag", color: "var(--triggering-color)", type: "startOnGreenFlag", icon: "assets/images/green-flag.svg" },
{ name: "Tap", color: "var(--triggering-color)", type: "startOnTap", icon: "assets/images/blocks/tap.svg" },
{ name: "Bump", color: "var(--triggering-color)", type: "startOnBump", icon: "assets/images/blocks/bump.svg" },
{ name: "Send Message", color: "var(--triggering-color)", type: "sendMessage", icon: "assets/images/blocks/send-message.svg" },
{ name: "Receive Message", color: "var(--triggering-color)", type: "startOnMessage", icon: "assets/images/blocks/receive-message.svg" },
],
motion: [
{ name: "Move Right", color: "var(--motion-color)", type: "moveRight", icon: "assets/images/blocks/move-right.svg" },
{ name: "Move Left", color: "var(--motion-color)", type: "moveLeft", icon: "assets/images/blocks/move-left.svg" },
{ name: "Move Up", color: "var(--motion-color)", type: "moveUp", icon: "assets/images/blocks/move-up.svg" },
{ name: "Move Down", color: "var(--motion-color)", type: "moveDown", icon: "assets/images/blocks/move-down.svg" },
{ name: "Turn Right", color: "var(--motion-color)", type: "turnRight", icon: "assets/images/blocks/turn-right.svg" },
{ name: "Turn Left", color: "var(--motion-color)", type: "turnLeft", icon: "assets/images/blocks/turn-left.svg" },
{ name: "Hop", color: "var(--motion-color)", type: "hop", icon: "assets/images/blocks/hop.svg" },
{ name: "Go Home", color: "var(--motion-color)", type: "goHome", icon: "assets/images/blocks/reset.svg" },
],
looks: [
{ name: "Say", color: "var(--looks-color)", type: "say", icon: "assets/images/blocks/say.svg" },
{ name: "Grow", color: "var(--looks-color)", type: "grow", icon: "assets/images/blocks/grow.svg" },
{ name: "Shrink", color: "var(--looks-color)", type: "shrink", icon: "assets/images/blocks/shrink.svg" },
{ name: "Reset Size", color: "var(--looks-color)", type: "resetSize", icon: "assets/images/blocks/reset-size.svg" },
{ name: "Hide", color: "var(--looks-color)", type: "hide", icon: "assets/images/blocks/hide.svg" },
{ name: "Show", color: "var(--looks-color)", type: "show", icon: "assets/images/blocks/show.svg" },
],
sound: [
{ name: "Play Sound", color: "var(--sound-color)", type: "popSound", icon: "assets/images/blocks/sound.svg" },
{ name: "Play Recorded Sound", color: "var(--sound-color)", type: "playRecordedSound", icon: "assets/images/blocks/record-sound.svg" },
],
control: [
{ name: "Wait", color: "var(--control-color)", type: "wait", icon: "assets/images/blocks/wait.svg" },
{ name: "Set Speed", color: "var(--control-color)", type: "setSpeed", icon: "assets/images/blocks/speed.svg" },
{ name: "Repeat", type: "repeat", icon: "assets/images/blocks/repeat.svg" }
],
end: [
{ name: "Stop", color: "var(--end-color)", type: "stop", icon: "assets/images/blocks/stop.svg" },
{ name: "End", color: "var(--end-color)", type: "end", icon: "assets/images/blocks/end.svg" },
{ name: "Repeat Forever", type: "repeatForever", icon: "assets/images/blocks/repeat-forever.svg", color: "var(--end-color)" },
{ name: "Go To Page", color: "var(--end-color)", type: "goToPage", icon: "assets/images/blocks/go-to-page.svg" },
],
};

function createScratchBlock(block) {
const scratchBlock = document.createElement("div");
scratchBlock.classList.add("scratch-block");
scratchBlock.style.backgroundColor = block.color;
const iconImg = document.createElement("img");
iconImg.src = block.icon;
iconImg.alt = block.name;
iconImg.classList.add("block-icon-img");
scratchBlock.appendChild(iconImg);
return scratchBlock;
}

function createRepeatBlockElement(block, category) {
const blockContainer = document.createElement("div");
blockContainer.classList.add("block-container", "active-repeat");
blockContainer.dataset.type = block.type;
blockContainer.draggable = true;
const topBar = document.createElement("div");
topBar.classList.add("repeat-bar", "repeat-top-bar");
topBar.style.backgroundColor = "var(--control-color)";
topBar.textContent = block.name;
const leftBar = document.createElement("div");
leftBar.classList.add("repeat-bar", "repeat-left-bar");
leftBar.style.backgroundColor = "var(--control-color)";
const rightBar = document.createElement("div");
rightBar.classList.add("repeat-bar", "repeat-right-bar");
rightBar.style.backgroundColor = "#7ED957";
const iconImg = document.createElement("img");
iconImg.src = block.icon;
iconImg.alt = block.name;
iconImg.classList.add("block-icon-img");
blockContainer.appendChild(topBar);
blockContainer.appendChild(leftBar);
blockContainer.appendChild(rightBar);
blockContainer.appendChild(iconImg);
blockContainer.addEventListener("dragstart", (event) => { handleDragStart(event, block, category); });
return blockContainer;
}

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
blockContainer.addEventListener("dragstart", (event) => { handleDragStart(event, block, category); });
return blockContainer;
}

function createRightConnector(color) {
const rightConnector = document.createElement("div");
rightConnector.classList.add("right-connector");
rightConnector.style.backgroundColor = color;
return rightConnector;
}

function createLeftConnector() {
const leftConnectorWrapper = document.createElement("div");
leftConnectorWrapper.classList.add("left-connector-wrapper");
const leftConnector = document.createElement("div");
leftConnector.classList.add("left-connector");
leftConnectorWrapper.appendChild(leftConnector);
return leftConnectorWrapper;
}

function handleDragStart(event, block, category) {
const data = { type: block.type, icon: block.icon, color: block.color, category: category, name: block.name };
event.dataTransfer.setData("text/plain", JSON.stringify(data));
event.dataTransfer.effectAllowed = "move";
}

function handleDrop(event) {
event.preventDefault();
const blockIndex = event.dataTransfer.getData('block-index');
if (blockIndex) {
const draggedBlockIndex = parseInt(blockIndex);
const draggedBlock = programmingArea.children;
if (draggedBlock && draggedBlock.length > draggedBlockIndex) {
const blockToMove = draggedBlock.item(draggedBlockIndex);
if (blockToMove) {
programmingArea.removeChild(blockToMove);
const rect = programmingArea.getBoundingClientRect();
blockToMove.style.position = "absolute";
blockToMove.style.left = ${event.clientX - rect.left - (blockToMove.offsetWidth / 2)}px;
blockToMove.style.top = ${event.clientY - rect.top - (blockToMove.offsetHeight / 2)}px;
programmingArea.appendChild(blockToMove);
}
}
} else {
const data = JSON.parse(event.dataTransfer.getData("text/plain"));
const blockType = data.type;
const blockCategory = data.category;
const blockIcon = data.icon;
const blockColor = data.color;
const blockName = data.name;
let newBlock;
if (blockType === "repeat") {
newBlock = createRepeatBlockElement({ type: blockType, icon: blockIcon, name: blockName }, blockCategory);
} else {
newBlock = document.createElement("div");
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
const rightConnector = document.createElement("div");
rightConnector.classList.add("right-connector");
rightConnector.style.backgroundColor = blockColor;
const leftConnectorWrapper = document.createElement("div");
leftConnectorWrapper.classList.add("left-connector-wrapper");
const leftConnector = document.createElement("div");
leftConnector.classList.add("left-connector");
leftConnectorWrapper.appendChild(leftConnector);
newBlock.appendChild(scratchBlock);
newBlock.appendChild(rightConnector);
newBlock.appendChild(leftConnectorWrapper);
newBlock.dataset.type = blockType;
newBlock.draggable = true;
}
newBlock.addEventListener("dragstart", (event) => {
event.dataTransfer.setData('block-index', Array.from(programmingArea.children).indexOf(newBlock).toString());
event.dataTransfer.effectAllowed = "move";
});
programmingArea.appendChild(newBlock);
const rect = programmingArea.getBoundingClientRect();
newBlock.style.position = "absolute";
newBlock.style.left = ${event.clientX - rect.left - (newBlock.offsetWidth / 2)}px;
newBlock.style.top = ${event.clientY - rect.top - (newBlock.offsetHeight / 2)}px;
}
}

function populateBlockPalette(category) {
const categoryDiv = document.getElementById(${category}-blocks);
categoryDiv.innerHTML = "";
blocks.control.forEach(block => {
let blockElement;
if (block.type === "repeat") {
blockElement = createRepeatBlockElement(block, "control");
} else {
blockElement = createBlockElement(block, "control");
}
categoryDiv.appendChild(blockElement);
});
blocks.end.forEach(block => { const blockElement = createBlockElement(block, "end"); document.getElementById(end-blocks).appendChild(blockElement); });
blocks.sound.forEach(block => { const blockElement = createBlockElement(block, "sound"); document.getElementById(sound-blocks).appendChild(blockElement); });
blocks.looks.forEach(block => { const blockElement = createBlockElement(block, "looks"); document.getElementById(looks-blocks).appendChild(blockElement); });
blocks.motion.forEach(block => { const blockElement = createBlockElement(block, "motion"); document.getElementById(motion-blocks).appendChild(blockElement); });
blocks.triggering.forEach(block => { const blockElement = createBlockElement(block, "triggering"); document.getElementById(triggering-blocks).appendChild(blockElement); });
}

function handleCategoryChange(category) {
blockCategories.forEach(element => element.classList.remove("active"));
categoryTabs.forEach(tab => tab.classList.remove("active"));
const tab = document.querySelector(.category-tabActive [data-category="${category}"]);
if (tab) { tab.classList.add("active"); } else if (category === 'control') { document.querySelector(.category-tabActive).classList.add("active"); }
document.querySelectorAll('.block-category').forEach(catDiv => catDiv.classList.remove('active'));
const activeCategoryDiv = document.getElementById(${category}-blocks);
if (activeCategoryDiv) { activeCategoryDiv.classList.add("active"); } else if (category === 'control') { document.getElementById('control-blocks').classList.add('active'); }
}

const programmingArea = document.getElementById("program-blocks");
programmingArea.addEventListener("dragover", (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; });
programmingArea.addEventListener("drop", handleDrop);
const categoryTabs = document.querySelectorAll(".category-tab");
const blockCategories = document.querySelectorAll(".block-category");
const categoryTabActiveClass = document.querySelector('.category-tabs');
categoryTabActiveClass.addEventListener('click', (event) => {
if (event.target.classList.contains('category-tab')) {
const category = event.target.dataset.category;
handleCategoryChange(category);
}
});
const gridToggle = document.getElementById("grid-toggle");
const stage = document.getElementById("stage");
gridToggle.addEventListener("click", () => { stage.classList.toggle("show-grid"); });
const clearAllButton = document.getElementById("clear-all");
clearAllButton.addEventListener("click", () => { programmingArea.innerHTML = ""; });
populateBlockPalette("control");
handleCategoryChange("control");
const character = document.getElementById('character');
character.addEventListener('dragstart', (event) => { event.dataTransfer.setData('text/plain', ''); });
stage.addEventListener('dragover', (event) => { event.preventDefault(); });
stage.addEventListener('drop', (event) => {
event.preventDefault();
const stageRect = stage.getBoundingClientRect();
const characterWidth = character.offsetWidth;
const characterHeight = character.offsetHeight;
let x = event.clientX - stageRect.left - characterWidth / 2;
let y = event.clientY - stageRect.top - characterHeight / 2;
x = Math.max(0, Math.min(x, stageRect.width - characterWidth));
y = Math.max(0, Math.min(y, stageRect.height - characterHeight));
character.style.left = x + 'px';
character.style.top = y + 'px';
});
``
