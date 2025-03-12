let draggedBlock = null; // משתנה גלובלי לשמירת הפניה לבלוק הנגרר

// פונקציה ליצירת HTML עבור בלוק
function createBlockElement(block, category) {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.style.backgroundColor = block.color;
    blockElement.textContent = block.icon;
    blockElement.dataset.type = block.type;
    blockElement.draggable = true;

    // טיפול באירוע התחלת גרירה (dragstart) - חשוב מאוד!
    blockElement.addEventListener("dragstart", (event) => {
        draggedBlock = blockElement; // שמירת הפניה לבלוק הנגרר
        event.dataTransfer.setData("text/plain", JSON.stringify({ type: block.type, icon: block.icon, color: block.color, source: "blockPalette" })); // הוספת מקור
        event.dataTransfer.effectAllowed = "move";
    });

    return blockElement;
}

// טיפול באירוע שחרור באזור התכנות (drop)
programmingArea.addEventListener("drop", (event) => {
    event.preventDefault(); // מונע התנהגות ברירת מחדל

    const data = JSON.parse(event.dataTransfer.getData("text/plain")); // קבלת המידע על הבלוק
    const blockType = data.type;
    const blockCategory = data.category;
    const blockIcon = data.icon; //קבלת האייקון
    const blockColor = data.color;//קבלת הצבע
    const source = data.source || "programmingArea"; // קבלת מקור הבלוק

    // מיקום הבלוק החדש - מוגבל לתחומי אזור התכנות
    const offsetX = event.clientX - programmingArea.offsetLeft;
    const offsetY = event.clientY - programmingArea.offsetTop;

    // וידוא שהמיקום בתוך גבולות אזור התכנות
    const maxX = programmingArea.offsetWidth - draggedBlock.offsetWidth;
    const maxY = programmingArea.offsetHeight - draggedBlock.offsetHeight;

    const blockX = Math.min(Math.max(offsetX, 0), maxX);
    const blockY = Math.min(Math.max(offsetY, 0), maxY);

    // אם הבלוק הגיע מאזור התכנות - פשוט להזיז אותו
    if (source === "programmingArea") {
         draggedBlock.style.left = `${blockX}px`;
        draggedBlock.style.top = `${blockY}px`;
    } else {
    
    // אם הבלוק הגיע מלוח הלבנים - ליצור שיבוט
        // יצירת אלמנט בלוק חדש (שיבוט)
    const newBlock = document.createElement("div");
        newBlock.classList.add("block");
        newBlock.style.backgroundColor = blockColor; // מציאת הצבע הנכון
        newBlock.textContent = blockIcon; // מציאת השם הנכון
        newBlock.dataset.type = blockType;
        newBlock.draggable = true;

            //העתק לא ניתן לגרירה
    newBlock.style.position = "absolute";
    newBlock.style.left = `${blockX}px`;
    newBlock.style.top = `${blockY}px`;

        programmingArea.appendChild(newBlock);
    }

    draggedBlock = null; // איפוס הבלוק הנגרר
});
