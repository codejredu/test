document.addEventListener('DOMContentLoaded', () => {
    const blockPalette = document.getElementById('blockPalette');
    const scriptArea = document.getElementById('scriptArea');

    // **Drag and Drop API**
    blockPalette.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', event.target.dataset.blockType);
        event.dataTransfer.effectAllowed = 'copy';
    });

    scriptArea.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    scriptArea.addEventListener('drop', (event) => {
        event.preventDefault();
        const blockType = event.dataTransfer.getData('text/plain');
        const newBlock = createBlockElement(blockType);
        scriptArea.appendChild(newBlock);
    });

    // **יצירת בלוק חדש**
    function createBlockElement(blockType) {
        const block = document.createElement('div');
        block.classList.add('block');
        block.draggable = true;
        block.dataset.blockType = blockType;

        //הוספת אייקון
        let iconClass = '';
        switch (blockType) {
            case 'startOnGreenFlag': iconClass = 'fas fa-flag-checkered'; break;
            case 'startOnTap': iconClass = 'fas fa-hand-pointer'; break;
            case 'startOnBump': iconClass = 'fas fa-exclamation-triangle'; break;
            case 'sendMessage': iconClass = 'fas fa-arrow-right'; break;
            case 'startOnMessage': iconClass = 'fas fa-envelope'; break;
            case 'moveRight': iconClass = 'fas fa-arrow-right'; break;
            case 'moveLeft': iconClass = 'fas fa-arrow-left'; break;
            case 'moveUp': iconClass = 'fas fa-arrow-up'; break;
            case 'moveDown': iconClass = 'fas fa-arrow-down'; break;
            case 'turnRight': iconClass = 'fas fa-redo'; break;
            case 'turnLeft': iconClass = 'fas fa-undo'; break;
            case 'hop': iconClass = 'fas fa-arrow-up'; break;
            case 'goHome': iconClass = 'fas fa-home'; break;
            case 'say': iconClass = 'fas fa-comment'; break;
            case 'grow': iconClass = 'fas fa-search-plus'; break;
            case 'shrink': iconClass = 'fas fa-search-minus'; break;
            case 'resetSize': iconClass = 'fas fa-sync-alt'; break;
            case 'hide': iconClass = 'fas fa-eye-slash'; break;
            case 'show': iconClass = 'fas fa-eye'; break;
            case 'playSound': iconClass = 'fas fa-volume-up'; break;
            case 'recordSound': iconClass = 'fas fa-microphone'; break;
            case 'wait': iconClass = 'fas fa-hourglass-half'; break;
            case 'setSpeed': iconClass = 'fas fa-tachometer-alt'; break;
            case 'repeat': iconClass = 'fas fa-redo-alt'; break;
            case 'repeatForever': iconClass = 'fas fa-infinity'; break;
            case 'goToPage': iconClass = 'fas fa-file-alt'; break;
            case 'stop': iconClass = 'fas fa-stop-circle'; break;
            case 'end': iconClass = 'fas fa-flag-checkered'; break;
            default: iconClass = '';
        }

        block.innerHTML = `<i class="${iconClass}"></i>`;

        //הוספת צבע רקע
        const category = getCategoryFromBlockType(blockType);
        block.style.backgroundColor = getBackgroundColorByCategory(category);
        return block;
    }

    function getCategoryFromBlockType(blockType) {
        // מיפוי סוג בלוק לקטגוריה
        if (['startOnGreenFlag', 'startOnTap', 'startOnBump', 'sendMessage', 'startOnMessage'].includes(blockType)) {
            return 'trigger';
        } else if (['moveRight', 'moveLeft', 'moveUp', 'moveDown', 'turnRight', 'turnLeft', 'hop', 'goHome'].includes(blockType)) {
            return 'motion';
        } else if (['say', 'grow', 'shrink', 'resetSize', 'hide', 'show'].includes(blockType)) {
            return 'looks';
        } else if (['playSound', 'recordSound'].includes(blockType)) {
            return 'sounds';
        } else if (['wait', 'setSpeed', 'repeat', 'repeatForever', 'goToPage'].includes(blockType)) {
            return 'control';
        } else if (['stop', 'end'].includes(blockType)) {
            return 'end';
        }
        return 'unknown';
    }

    function getBackgroundColorByCategory(category) {
        // החזרת צבע רקע על סמך הקטגוריה
        switch (category) {
            case 'trigger': return '#fdd835';
            case 'motion': return '#03a9f4';
            case 'looks': return '#ab47bc';
            case 'sounds': return '#4caf50';
            case 'control': return '#ff9800';
            case 'end': return '#f44336';
            default: return '#999';
        }
    }

    // הוספת אירוע לחיצה לכותרות הקטגוריות
    const categoryHeaders = document.querySelectorAll('.categoryHeader');
    categoryHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const category = header.dataset.category;
            const blockCategory = document.querySelector(`.blockCategory[data-category="${category}"]`);

            // סגירת כל הקטגוריות הפתוחות
            document.querySelectorAll('.blockCategory').forEach(cat => {
                cat.style.display = 'none';
            });

            // פתיחה/סגירה של הקטגוריה הנוכחית
            if (blockCategory.style.display === 'block') {
                blockCategory.style.display = 'none';
            } else {
                blockCategory.style.display = 'block';
            }
        });
    });
});
