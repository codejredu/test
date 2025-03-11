document.addEventListener('DOMContentLoaded', () => {
    const blockPalette = document.getElementById('blockPalette');
    const scriptArea = document.getElementById('scriptArea');

    let draggedBlock = null; // הבלוק שנגרר כרגע

    // טיפול בתחילת גרירה
    blockPalette.addEventListener('mousedown', (event) => {
        if (event.target.classList.contains('block')) {
            draggedBlock = event.target.cloneNode(true); // שיבוט הבלוק
            draggedBlock.style.position = 'absolute';
            draggedBlock.style.zIndex = '1000'; // מעל הכל
            document.body.append(draggedBlock);

            moveAt(event.pageX, event.pageY);

            function moveAt(pageX, pageY) {
                draggedBlock.style.left = pageX - draggedBlock.offsetWidth / 2 + 'px';
                draggedBlock.style.top = pageY - draggedBlock.offsetHeight / 2 + 'px';
            }

            function onMouseMove(event) {
                moveAt(event.pageX, event.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);

            draggedBlock.onmouseup = function() {
                document.removeEventListener('mousemove', onMouseMove);
                draggedBlock.onmouseup = null;
                draggedBlock = null; // סיום הגרירה
            };
        }
    });

    // מניעת ברירת מחדל של גרירה
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });

    // טיפול בשחרור הבלוק באזור הסקריפט
    scriptArea.addEventListener('mouseup', (event) => {
        if (draggedBlock) {
            draggedBlock.style.position = 'static';
            draggedBlock.style.zIndex = 'auto';
            scriptArea.appendChild(draggedBlock); // הוספה לאזור הסקריפט
            draggedBlock = null;
        }
    });

    // טיפול בשחרור מחוץ לאזור הסקריפט (החזרה למקור)
    document.addEventListener('mouseup', (event) => {
        if (draggedBlock && !scriptArea.contains(event.target)) {
           // החזרה למקור - כאן צריך לוגיקה מורכבת יותר
           // כי הבלוק הוסר מהמקור.
           draggedBlock.remove();
           draggedBlock = null;
        }
    });
});
