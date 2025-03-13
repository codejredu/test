 function dragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const draggedBlock = document.querySelector('.block.dragging');
    if (!draggedBlock) return;

    const closestBlock = findClosestBlock(draggedBlock);
    if (closestBlock) {
        closestBlock.classList.add('highlight');
    }
}

function drop(event) {
    event.preventDefault();
    resetHighlight()
    const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    const blockType = data.type;
    const blockIcon = data.icon;
    const blockColor = data.color;
    const source = data.source || "programmingArea";
    const offsetX = event.clientX - programmingArea.offsetLeft;
    const offsetY = event.clientY - programmingArea.offsetTop;


    if (source === "blockPalette") {
              const newBlock = document.createElement("div");
               newBlock.classList.add("block");
               newBlock.style.backgroundColor = blockColor; // מציאת הצבע הנכון
               newBlock.textContent = blockIcon; // מציאת השם הנכון
               newBlock.dataset.type = blockType;
               newBlock.draggable = true;
             newBlock.style.position = "absolute";
              newBlock.style.left = `${offsetX}px`;
              newBlock.style.top = `${offsetY}px`;
    newBlock.addEventListener("dragstart", function(event) {
        draggedBlock = this; // שמירת הפניה לבלוק הנגרר
        blockElement.classList.add("dragging"); // הוספת אפקט ויזואלי
        event.dataTransfer.setData("text/plain", JSON.stringify({ type: blockType, icon: blockIcon, color: blockColor, source: "programmingArea" })); // הוספת מקור
        event.dataTransfer.effectAllowed = "move";
    });
    programmingArea.appendChild(newBlock);

    }
    else {
         draggedBlock.style.left = `${offsetX}px`;
         draggedBlock.style.top = `${offsetY}px`;
    }

}

function findClosestBlock(block) {
    const blockPosition = block.getBoundingClientRect();
    const allBlocks = programmingArea.querySelectorAll('.block:not(.dragging)');
    let closestBlock = null;
    let closestDistance = Infinity;

    allBlocks.forEach(otherBlock => {
        const otherBlockPosition = otherBlock.getBoundingClientRect();
        const distance = Math.sqrt(
            Math.pow(blockPosition.x - otherBlockPosition.x, 2) +
            Math.pow(blockPosition.y - otherBlockPosition.y, 2)
        );
        if (distance < closestDistance) {
            closestDistance = distance;
            closestBlock = otherBlock;
        }
    });

    return closestBlock;
}

function resetHighlight() {
    const highlightedBlocks = programmingArea.querySelectorAll('.block.highlight');
    highlightedBlocks.forEach(block => block.classList.remove('highlight'));
}
