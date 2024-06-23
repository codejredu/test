document.addEventListener('DOMContentLoaded', () => {
    const blocksByCategory = {
        triggers: ['כשלוחצים על דגל', 'כשלוחצים על דמות'],
        motion: ['זוז 10 צעדים', 'פנה ימינה 15 מעלות', 'פנה שמאלה 15 מעלות'],
        looks: ['אמור "שלום"', 'החלף תלבושת ל...', 'הגדל ב-10%'],
        sound: ['נגן צליל "מיאו"', 'נגן תופים למשך 0.25 שניות'],
        control: ['המתן 1 שנייה', 'חזור 10 פעמים'],
        end: ['סיים סקריפט']
    };

    const blocksContainer = document.getElementById('blocks-container');
    const scriptContainer = document.getElementById('script-container');

    function createBlock(text, category) {
        const block = document.createElement('div');
        block.className = 'block';
        block.textContent = text;
        block.style.backgroundColor = getComputedStyle(document.querySelector(`[data-category="${category}"]`)).backgroundColor;
        block.draggable = true;
        block.addEventListener('dragstart', drag);
        return block;
    }

    function showBlocksForCategory(category) {
        blocksContainer.innerHTML = '';
        blocksByCategory[category].forEach(blockText => {
            blocksContainer.appendChild(createBlock(blockText, category));
        });
    }

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => showBlocksForCategory(btn.dataset.category));
    });

    function drag(ev) {
        ev.dataTransfer.setData("text", ev.target.textContent);
        ev.dataTransfer.setData("category", ev.target.style.backgroundColor);
    }

    function allowDrop(ev) {
        ev.preventDefault();
    }

    function drop(ev) {
        ev.preventDefault();
        const data = ev.dataTransfer.getData("text");
        const category = ev.dataTransfer.getData("category");
        const newBlock = createBlock(data, category);
        scriptContainer.appendChild(newBlock);
    }

    scriptContainer.addEventListener('dragover', allowDrop);
    scriptContainer.addEventListener('drop', drop);

    // הצג את הבלוקים של הקטגוריה הראשונה כברירת מחדל
    showBlocksForCategory('triggers');
});
