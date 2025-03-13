const blocks = {
    triggering: [
        {
            name: "🚩",
            color: "yellow",
            type: "startOnGreenFlag",
            icon: "🚩",
        },
        {
            name: "👆",
            color: "yellow",
            type: "startOnTap",
            icon: "👆",
        },
        {
            name: "💥",
            color: "yellow",
            type: "startOnBump",
            icon: "💥",
        },
        {
            name: "✉️",
            color: "yellow",
            type: "sendMessage",
            icon: "✉️",
        },
        {
            name: "📩",
            color: "yellow",
            type: "startOnMessage",
            icon: "📩",
        },
    ],
    motion: [
        {
            name: "➡️",
            color: "blue",
            type: "moveRight",
            icon: "➡️",
        },
        {
            name: "⬅️",
            color: "blue",
            type: "moveLeft",
            icon: "⬅️",
        },
        {
            name: "⬆️",
            color: "blue",
            type: "moveUp",
            icon: "⬆️",
        },
        {
            name: "⬇️",
            color: "blue",
            type: "moveDown",
            icon: "⬇️",
        },
        {
            name: "↩️",
            color: "blue",
            type: "turnRight",
            icon: "↩️",
        },
        {
            name: "↪️",
            color: "blue",
            type: "turnLeft",
            icon: "↪️",
        },
        {
            name: "🤸",
            color: "blue",
            type: "hop",
            icon: "🤸",
        },
        {
            name: "🏠",
            color: "blue",
            type: "goHome",
            icon: "🏠",
        },
    ],
    looks: [
        {
            name: "💬",
            color: "purple",
            type: "say",
            icon: "👁️",
        },
        {
            name: "📈",
            color: "purple",
            type: "grow",
            icon: "🙈",
        },
        {
            name: "📉",
            color: "purple",
            type: "shrink",
            icon: "🔄",
        },
        {
            name: "🔄",
            color: "purple",
            type: "resetSize",
            icon: "📈",
        },
        {
            name: "🙈",
            color: "purple",
            type: "hide",
            icon: "📉",
        },
        {
            name: "👁️",
            color: "purple",
            type: "show",
            icon: "💬",
        },
    ],
    sound: [
        {
            name: "🎵",
            color: "green",
            type: "popSound",
            icon: "🎵",
        },
        {
            name: "🎤",
            color: "green",
            type: "playRecordedSound",
            icon: "🎤",
        },
    ],
    control: [
        {
            name: "⏱️",
            color: "orange",
            type: "wait",
            icon: "⏱️",
        },
        {
            name: "⚡",
            color: "orange",
            type: "setSpeed",
            icon: "⚡",
        },
        {
            name: "🔁",
            type: "repeat",
            icon: "🔁",
            color: "orange"
        },
        {
            name: "♾️",
            type: "repeatForever",
            icon: "♾️",
            color: "orange"
        },
        {
            name: "🚪",
            color: "orange",
            type: "goToPage",
            icon: "🚪",
        },
    ],
    end: [
        {
            name: "🛑",
            color: "red",
            type: "stop",
            icon: "🛑",
        },
        {
            name: "🏁",
            color: "red",
            type: "end",
            icon: "🏁",
        },
    ],
};

let draggedBlock = null; // גוש נגרר עכשוי
let isDragging = false;

// ========================================================================
//  יצירת HTML לבני התכנות
// ========================================================================

function createBlockElement(block, category) {
    const blockElement = document.createElement("div");
    blockElement.classList.add("block");
    blockElement.style.backgroundColor = block.color;
    blockElement.textContent = block.icon;
    blockElement.dataset.type = block.type;
    blockElement.draggable = true;

    // טיפול באירוע התחלת הגרירה
    blockElement.addEventListener("dragstart", (event) => {
        draggedBlock = blockElement; // הבלוק שנגרר עכשיו

        // מאפייני הבלוק לתהליך הגרירה
        event.dataTransfer.setData("text/plain", JSON.stringify({
            type: block.type,
            icon: block.icon,
            color: block.color
        }));

        event.dataTransfer.effectAllowed = "move";
        isDragging = true
    });

    // כשהגרירה מסתיימת
    blockElement.addEventListener("dragend", () => {
        isDragging = false;
    });

    return blockElement;
}

// בניית פלטת הבלוקים
function populateBlockPalette(category) {
    const categoryDiv = document.getElementById(`${category}-blocks`);
    categoryDiv.innerHTML = ""; // נקה את הפלטה הקודמת

    blocks[category].forEach(block => {
        const blockElement = createBlockElement(block, category);
        categoryDiv.appendChild(blockElement);
    });
}

// ========================================================================
//  אזור הקוד
// ========================================================================
const programBlocks = document.getElementById("program-blocks");

programBlocks.addEventListener("dragover", function(event) {
    event.preventDefault();
    if(!isDragging) return;
    const draggedOverElement = event.target

});

programBlocks.addEventListener("drop", function(event) {
  if(!isDragging) return;
      event.preventDefault();

    const data = JSON.parse(event.dataTransfer.getData("text/plain"));

        if (data.source === "blockPalette") {
        const newBlock = document.createElement("div");
        newBlock.classList.add("block");
        newBlock.style.backgroundColor = data.color;
        newBlock.textContent = data.icon;
        newBlock.dataset.type = data.type;
        newBlock.draggable = true;
          newBlock.style.position = "absolute";
         newBlock.style.left = `${event.clientX - programBlocks.offsetLeft}px`;
         newBlock.style.top = `${event.clientY - programBlocks.offsetTop}px`;

         newBlock.addEventListener("dragstart", function(event) {
             draggedBlock = this; // שמירת הפניה לבלוק הנגרר
             isDragging = true;
             event.dataTransfer.setData("text/plain", JSON.stringify({ type: blockType, icon: blockIcon, color: blockColor, source: "programmingArea" }));
                event.dataTransfer.effectAllowed = "move";
           });
           programBlocks.appendChild(newBlock);
        checkAndAttach(newBlock);
    }
    function checkAndAttach(currentElement) {
  const proximityThreshold = 50;

  const rect1 = currentElement.getBoundingClientRect();
  const allBlocks = document.querySelectorAll('.block');

  allBlocks.forEach((existingElement) => {
  if(currentElement === existingElement) return;

      const rect2 = existingElement.getBoundingClientRect();

          let test=  Math.abs(rect1.right - rect2.left) < proximityThreshold &&
              Math.abs(rect1.top - rect2.top) < proximityThreshold &&
               rect1.dataset.type !== "pepe";

      if (test){

               if (currentElement.parentNode){

            }
          console.log( "اتصال");

          //מחק לטובת יצירת אחד חדש
         addBefore(currentElement,existingElement)
         // currentElement = null;
          existingElement = null;


        }
          //לייעד אוביקט אחר כך ולשנותו-במידת הצורך


          });
          function addBefore(el, target) {
            target.parentNode.insertBefore(el, target);
          }


}

});

// פונקציה למציאת בלוק קרוב ביותר לחיבור
function findClosestBlock(block) {
    const blockPosition = block.getBoundingClientRect();
    const allBlocks = programBlocks.querySelectorAll('.block:not(.dragging)');
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

// הסרה ה"סימון"
function resetHighlight() {
    const highlightedBlocks = programBlocks.querySelectorAll('.highlight');
    highlightedBlocks.forEach(block => block.classList.remove('highlight'));
}

// הפעלת הקוד
const categoryTabs = document.querySelectorAll(".category-tab");

categoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        blockCategories.forEach(c => c.classList.remove("active"));
        categoryTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const category = tab.dataset.category;
        document.getElementById(`${category}-blocks`).classList.add("active");
        populateBlockPalette(category);
    });
});
