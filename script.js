document.addEventListener('DOMContentLoaded', () => {
    const blockPalette = document.getElementById('blockPalette');
    const scriptArea = document.getElementById('scriptArea');

    // **Drag and Drop API**
    blockPalette.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', event.target.dataset.blockType);
        event.dataTransfer.effectAllowed = 'copy'; // אפשר רק העתקה
    });

    scriptArea.addEventListener('dragover', (event) => {
        event.preventDefault(); // חובה כדי לאפשר Drop
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
        let blockText = '';

        switch (blockType) {
            case 'startOnGreenFlag': iconClass = 'fas fa-flag-checkered'; blockText = 'דגל ירוק'; break;
            case 'startOnTap': iconClass = 'fas fa-hand-pointer'; blockText = 'לחיצה על דמות'; break;
            case 'startOnBump': iconClass = 'fas fa-exclamation-triangle'; blockText = 'התנגשות'; break;
            case 'sendMessage': iconClass = 'fas fa-arrow-right'; blockText = 'שליחת הודעה'; break;
            case 'startOnMessage': iconClass = 'fas fa-envelope'; blockText = 'קבלת הודעה'; break;
            case 'moveRight': iconClass = 'fas fa-arrow-right'; blockText = 'ימינה'; break;
            case 'moveLeft': iconClass = 'fas fa-arrow-left'; blockText = 'שמאלה'; break;
            case 'moveUp': iconClass = 'fas fa-arrow-up'; blockText = 'למעלה'; break;
            case 'moveDown': iconClass = 'fas fa-arrow-down'; blockText = 'למטה'; break;
            case 'turnRight': iconClass = 'fas fa-redo'; blockText = 'סוב ימינה'; break;
            case 'turnLeft': iconClass = 'fas fa-undo'; blockText = 'סוב שמאלה'; break;
            case 'hop': iconClass = 'fas fa-arrow-up'; blockText = 'קפוץ'; break;
            case 'goHome': iconClass = 'fas fa-home'; blockText = 'חזור הביתה'; break;
              case 'say': iconClass = 'fas fa-comment'; blockText = 'אמור'; break;
                case 'grow': iconClass = 'fas fa-search-plus'; blockText = 'הגדל'; break;
                case 'shrink': iconClass = 'fas fa-search-minus'; blockText = 'הקטן'; break;
                case 'resetSize': iconClass = 'fas fa-sync-alt'; blockText = 'אפס גודל'; break;
                case 'hide': iconClass = 'fas fa-eye-slash'; blockText = 'הסתר'; break;
                case 'show': iconClass = 'fas fa-eye'; blockText = 'הצג'; break;
                 case 'playSound': iconClass = 'fas fa-volume-up'; blockText = 'נגן צליל'; break;
                case 'recordSound': iconClass = 'fas fa-microphone'; blockText = 'הקלט צליל'; break;
                   case 'wait': iconClass = 'fas fa-hourglass-half'; blockText = 'חכה'; break;
                case 'setSpeed': iconClass = 'fas fa-tachometer-alt'; blockText = 'קבע מהירות'; break;
                case 'repeat': iconClass = 'fas fa-redo-alt'; blockText = 'חזור'; break;
                case 'repeatForever': iconClass = 'fas fa-infinity'; blockText = 'חזור לנצח'; break;
                 case 'goToPage': iconClass = 'fas fa-file-alt'; blockText = 'עבור לדף'; break;
                   case 'stop': iconClass = 'fas fa-stop-circle'; blockText = 'עצור הכל'; break;
                case 'end': iconClass = 'fas fa-flag-checkered'; blockText = 'סוף'; break;
            default: blockText = blockType; // טקסט ברירת מחדל
        }

        block.innerHTML = `<i class="${iconClass}"></i> ${blockText}`;

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
        }
           else if (['say', 'grow', 'shrink', 'resetSize', 'hide', 'show'].includes(blockType)) {
            return 'looks';
        }
         else if (['playSound', 'recordSound'].includes(blockType)) {
            return 'sounds';
        }
          else if (['wait', 'setSpeed', 'repeat', 'repeatForever', 'goToPage'].includes(blockType)) {
            return 'control';
        }
           else if (['stop', 'end'].includes(blockType)) {
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
});
