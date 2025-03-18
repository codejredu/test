// הוספת משתנים גלובליים לטיפול בגרירה
let isDragging = false;
let currentDraggedBlock = null;
let offsetX = 0;
let offsetY = 0;
let blockConnections = []; // מערך לשמירת חיבורים בין בלוקים

// פונקציה לשיפור טיפול בשחרור באזור התכנות
function handleDrop(event) {
    event.preventDefault();

    try {
        const data = JSON.parse(event.dataTransfer.getData("text/plain"));
        const blockType = data.type;
        const blockCategory = data.category;
        const blockIcon = data.icon;
        const blockColor = data.color;
        const blockName = data.name;

        // יצירת אלמנט בלוק חדש
        const newBlock = document.createElement("div");
        newBlock.classList.add("block-container");
        newBlock.classList.add("program-block"); // הוספת קלאס לזיהוי הבלוקים באזור התכנות

        const scratchBlock = document.createElement("div");
        scratchBlock.classList.add("scratch-block");
        scratchBlock.style.backgroundColor = blockColor;

        // יצירת אלמנט תמונה עבור האיקון
        const iconImg = document.createElement("img");
        iconImg.src = blockIcon;
        iconImg.alt = blockName;
        iconImg.classList.add("block-icon-img");
        
        scratchBlock.appendChild(iconImg);

        // יצירת אלמנט right-connector
        const rightConnector = document.createElement("div");
        rightConnector.classList.add("right-connector");
        rightConnector.style.backgroundColor = blockColor;

        // יצירת אלמנט left-connector-wrapper
        const leftConnectorWrapper = document.createElement("div");
        leftConnectorWrapper.classList.add("left-connector-wrapper");

        // יצירת אלמנט left-connector
        const leftConnector = document.createElement("div");
        leftConnector.classList.add("left-connector");

        leftConnectorWrapper.appendChild(leftConnector);

        // הוספת הכל ל container
        newBlock.appendChild(scratchBlock);
        newBlock.appendChild(rightConnector);
        newBlock.appendChild(leftConnectorWrapper);
        newBlock.dataset.type = blockType;
        newBlock.dataset.category = blockCategory;
        newBlock.dataset.blockId = generateUniqueId(); // הוספת מזהה ייחודי לכל בלוק

        // הוספת הבלוק החדש לאזור התכנות
        programmingArea.appendChild(newBlock);

        // מיקום הבלוק החדש יחסי לאזור התכנות
        const rect = programmingArea.getBoundingClientRect();
        newBlock.style.position = "absolute";
        newBlock.style.left = `${event.clientX - rect.left}px`;
        newBlock.style.top = `${event.clientY - rect.top}px`;

        // הוספת מאזיני אירועים לבלוק החדש
        addEventListenersToBlock(newBlock);

        // בדיקה האם יש בלוק קרוב לחיבור
        checkForNearbyBlocks(newBlock);
    } catch (error) {
        console.error("Error handling drop:", error);
    }
}

// פונקציה ליצירת מזהה ייחודי לבלוק
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// פונקציה להוספת מאזיני אירועים לבלוק
function addEventListenersToBlock(block) {
    block.addEventListener("mousedown", handleBlockMouseDown);
    block.addEventListener("touchstart", handleBlockTouchStart, { passive: false });
}

// פונקציה לטיפול בלחיצת עכבר על בלוק
function handleBlockMouseDown(event) {
    if (event.button !== 0) return; // שמאל לחיצת עכבר בלבד
    
    event.preventDefault();
    event.stopPropagation();
    
    const block = event.currentTarget;
    startDragging(block, event.clientX, event.clientY);
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
}

// פונקציה לטיפול בתחילת מגע על בלוק
function handleBlockTouchStart(event) {
    event.preventDefault();
    
    const block = event.currentTarget;
    const touch = event.touches[0];
    startDragging(block, touch.clientX, touch.clientY);
    
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
}

// פונקציה להתחלת גרירה
function startDragging(block, clientX, clientY) {
    isDragging = true;
    currentDraggedBlock = block;
    
    const rect = block.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;
    
    // הוספת קלאס לבלוק שנגרר
    block.classList.add("dragging");
    
    // ניתוק הבלוק מהחיבורים הקיימים
    disconnectBlock(block);
}

// פונקציה לטיפול בתנועת עכבר
function handleMouseMove(event) {
    if (!isDragging) return;
    
    event.preventDefault();
    moveBlock(event.clientX, event.clientY);
}

// פונקציה לטיפול בתנועת מגע
function handleTouchMove(event) {
    if (!isDragging) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    moveBlock(touch.clientX, touch.clientY);
}

// פונקציה להזזת הבלוק
function moveBlock(clientX, clientY) {
    if (!currentDraggedBlock) return;
    
    const programmingAreaRect = programmingArea.getBoundingClientRect();
    
    let left = clientX - programmingAreaRect.left - offsetX;
    let top = clientY - programmingAreaRect.top - offsetY;
    
    // שמירה על גבולות אזור התכנות
    left = Math.max(0, Math.min(left, programmingAreaRect.width - currentDraggedBlock.offsetWidth));
    top = Math.max(0, Math.min(top, programmingAreaRect.height - currentDraggedBlock.offsetHeight));
    
    currentDraggedBlock.style.left = `${left}px`;
    currentDraggedBlock.style.top = `${top}px`;
    
    // בדיקה האם יש בלוק קרוב לחיבור תוך כדי גרירה
    checkForNearbyBlocks(currentDraggedBlock, true);
}

// פונקציה לטיפול בשחרור עכבר
function handleMouseUp(event) {
    if (!isDragging) return;
    
    finishDragging();
    
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
}

// פונקציה לטיפול בסיום מגע
function handleTouchEnd(event) {
    if (!isDragging) return;
    
    finishDragging();
    
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
}

// פונקציה לסיום גרירה
function finishDragging() {
    if (!currentDraggedBlock) return;
    
    // הסרת קלאס הגרירה
    currentDraggedBlock.classList.remove("dragging");
    
    // בדיקה האם יש בלוק קרוב לחיבור
    const connectedBlock = checkForNearbyBlocks(currentDraggedBlock);
    
    // אם יש חיבור, יש לעדכן את מיקום הבלוק
    if (connectedBlock) {
        snapToConnection(currentDraggedBlock, connectedBlock);
    }
    
    isDragging = false;
    currentDraggedBlock = null;
}

// פונקציה לבדיקת בלוקים קרובים לחיבור
function checkForNearbyBlocks(block, isDraggingCheck = false) {
    const blockRect = block.getBoundingClientRect();
    const blocks = document.querySelectorAll(".program-block:not(.dragging)");
    let closestBlock = null;
    let minDistance = 30; // מרחק מינימלי לחיבור בפיקסלים
    
    blocks.forEach(otherBlock => {
        if (otherBlock !== block) {
            const otherRect = otherBlock.getBoundingClientRect();
            
            // בדיקה האם הבלוק מתחת לבלוק הנוכחי
            if (Math.abs((blockRect.bottom) - otherRect.top) < minDistance &&
                Math.abs(blockRect.left - otherRect.left) < minDistance) {
                closestBlock = otherBlock;
                minDistance = Math.abs((blockRect.bottom) - otherRect.top);
            }
        }
    });
    
    // אם אנחנו רק בודקים במהלך הגרירה, אין צורך לחבר
    if (isDraggingCheck) return closestBlock;
    
    // אם מצאנו בלוק קרוב, נחבר אותו
    if (closestBlock && !isDragging) {
        connectBlocks(block, closestBlock);
        return closestBlock;
    }
    
    return null;
}

// פונקציה לחיבור בלוקים
function connectBlocks(topBlock, bottomBlock) {
    // הסרת חיבורים קודמים
    disconnectBlock(topBlock);
    
    // הוספת החיבור למערך החיבורים
    blockConnections.push({
        top: topBlock.dataset.blockId,
        bottom: bottomBlock.dataset.blockId
    });
    
    // עדכון מיקום הבלוק התחתון
    snapToConnection(topBlock, bottomBlock);
}

// פונקציה לניתוק בלוק מחיבורים
function disconnectBlock(block) {
    const blockId = block.dataset.blockId;
    
    // מחיקת חיבורים שבהם הבלוק הנוכחי הוא העליון
    blockConnections = blockConnections.filter(connection => {
        return connection.top !== blockId;
    });
    
    // בדיקה האם יש בלוק שמתחבר לבלוק הנוכחי מלמעלה
    const topConnection = blockConnections.find(connection => connection.bottom === blockId);
    
    if (topConnection) {
        // מחיקת החיבור
        blockConnections = blockConnections.filter(connection => {
            return connection.bottom !== blockId;
        });
    }
}

// פונקציה להצמדה לפי חיבור
function snapToConnection(topBlock, bottomBlock) {
    const bottomRect = bottomBlock.getBoundingClientRect();
    const programmingAreaRect = programmingArea.getBoundingClientRect();
    
    const left = parseInt(bottomBlock.style.left) || 0;
    const top = parseInt(bottomBlock.style.top) - topBlock.offsetHeight;
    
    topBlock.style.left = `${left}px`;
    topBlock.style.top = `${top}px`;
}

// פונקציה לקבלת התסריט המלא
function getFullScript() {
    const script = [];
    const startingBlocks = document.querySelectorAll(".program-block");
    
    // איסוף כל הבלוקים הראשיים (שאין להם בלוק מעליהם)
    startingBlocks.forEach(block => {
        const blockId = block.dataset.blockId;
        const isBottom = blockConnections.some(connection => connection.bottom === blockId);
        
        // אם אין לבלוק בלוק מעליו, הוא בלוק ראשי
        if (!isBottom) {
            const blockScript = getBlockScript(block);
            script.push(blockScript);
        }
    });
    
    return script;
}

// פונקציה רקורסיבית לבניית תסריט מבלוק
function getBlockScript(block) {
    const blockId = block.dataset.blockId;
    const blockType = block.dataset.type;
    
    // יצירת אובייקט המייצג את הבלוק
    const blockData = {
        type: blockType,
        id: blockId,
        children: []
    };
    
    // חיפוש בלוקים מתחת לבלוק הנוכחי
    const bottomConnection = blockConnections.find(connection => connection.top === blockId);
    
    if (bottomConnection) {
        // מציאת הבלוק התחתון
        const bottomBlock = document.querySelector(`.program-block[data-block-id="${bottomConnection.bottom}"]`);
        
        if (bottomBlock) {
            // הוספת הבלוק התחתון לרשימת הילדים
            blockData.children.push(getBlockScript(bottomBlock));
        }
    }
    
    return blockData;
}

// עדכון טיפול באירוע גרירה מעל אזור התכנות
programmingArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
});

// עדכון טיפול באירוע שחרור באזור התכנות
programmingArea.addEventListener("drop", handleDrop);

// פונקציה לניקוי כל הבלוקים מאזור התכנות
function clearProgrammingArea() {
    const blocks = document.querySelectorAll(".program-block");
    blocks.forEach(block => {
        block.remove();
    });
    blockConnections = [];
}

// הוספת כפתור ניקוי לממשק
function addClearButton() {
    const clearButton = document.createElement("button");
    clearButton.textContent = "נקה אזור תכנות";
    clearButton.id = "clear-button";
    clearButton.addEventListener("click", clearProgrammingArea);
    
    // הוספת הכפתור למקום המתאים בממשק
    const controlsContainer = document.querySelector(".controls-container") || document.body;
    controlsContainer.appendChild(clearButton);
}

// הוספת CSS לעיצוב
function addCustomStyles() {
    const style = document.createElement("style");
    style.textContent = `
        .program-block {
            cursor: move;
            z-index: 1;
        }
        
        .program-block.dragging {
            opacity: 0.8;
            z-index: 100;
        }
        
        #clear-button {
            margin: 10px;
            padding: 5px 10px;
            background-color: #ff6b6b;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        #clear-button:hover {
            background-color: #ff5252;
        }
    `;
    document.head.appendChild(style);
}

// אתחול הרחבות
function initDragAndDrop() {
    addCustomStyles();
    addClearButton();
    
    // הוספת מאזיני אירועים לבלוקים קיימים
    const existingBlocks = document.querySelectorAll(".program-block");
    existingBlocks.forEach(block => {
        addEventListenersToBlock(block);
    });
}

// הפעלת פונקציית האתחול
document.addEventListener("DOMContentLoaded", initDragAndDrop);
