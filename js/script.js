function createBlockElement(block, category) {
    const blockContainer = document.createElement("div");
    blockContainer.classList.add("block-container");

    const scratchBlock = document.createElement("div");
    scratchBlock.classList.add("scratch-block");

    if (block.type === "repeat") {
        scratchBlock.classList.add("repeat");
        scratchBlock.style.backgroundColor = block.color;

        // יצירת אלמנטים נוספים עבור העיצוב החדש
        const bottomIndent = document.createElement("div");
        bottomIndent.classList.add("bottom-indent");

        const bottomLeftProtrusion = document.createElement("div");
        bottomLeftProtrusion.classList.add("bottom-left-protrusion");

        const bottomRightIndent = document.createElement("div");
        bottomRightIndent.classList.add("bottom-right-indent");

        const circularArrow = document.createElement("div");
        circularArrow.classList.add("circular-arrow");
        circularArrow.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4V1l-3 3 3 3V4c1.5 0 2.8.9 3.4 2.2l1.5-.8C15.1 5.3 13.7 4 12 4zM6.2 8.8l-1.5.8c.6-1.3 1.9-2.2 3.4-2.2v3l3-3-3-3v4c-1.5 0-2.8.9-3.4 2.2zM12 20v3l3-3-3-3v3c-1.5 0-2.8-.9-3.4-2.2l-1.5.8c.6 1.3 1.9 2.2 3.4 2.2zM17.8 15.2l1.5-.8c-.6 1.3-1.9 2.2-3.4 2.2v-3l-3 3 3 3v-4c1.5 0 2.8-.9 3.4-2.2z"/>
            </svg>
        `;

        // הוספת האלמנטים לתוך הבלוק
        scratchBlock.appendChild(bottomIndent);
        scratchBlock.appendChild(bottomLeftProtrusion);
        scratchBlock.appendChild(bottomRightIndent);
        scratchBlock.appendChild(circularArrow);
    }

    // ... המשך הפונקציה כרגיל ...

    blockContainer.appendChild(scratchBlock);
    // ...
    return blockContainer;
}
