const programmingArea = document.getElementById("programming-area");

// טיפול באירוע גרירה מעל אזור התכנות (dragover)
programmingArea.addEventListener("dragover", (event) => {
    event.preventDefault(); // מונע התנהגות ברירת מחדל
    event.dataTransfer.dropEffect = "move"; // מציין שהפעולה היא העברה (move)
});

// טיפול באירוע שחרור באזור התכנות (drop)
programmingArea.addEventListener("drop", (event) => {
    event.preventDefault(); // מונע התנהגות ברירת מחדל

    const data = JSON.parse(event.dataTransfer.getData("text/plain")); // קבלת המידע על הבלוק
    const blockType = data.type;
    const blockCategory = data.category;

    // יצירת אלמנט בלוק חדש (שיבוט)
    const newBlock = document.createElement("div");
    newBlock.classList.add("block");
    newBlock.style.backgroundColor = blocks[blockCategory].find(b => b.type === blockType).color; // מציאת הצבע הנכון
    newBlock.textContent = blocks[blockCategory].find(b => b.type === blockType).name; // מציאת השם הנכון
    newBlock.dataset.type = blockType;
    newBlock.draggable = false; //העתק לא ניתן לגרירה

    // מיקום הבלוק החדש
    newBlock.style.position = "absolute";
    newBlock.style.left = `${event.clientX - programmingArea.offsetLeft}px`;
    newBlock.style.top = `${event.clientY - programmingArea.offsetTop}px`;

    programmingArea.appendChild(newBlock);
});

//פונקציה לחיבור בין בלוקים
function connectBlocks(block1, block2){
  //To Do
}
