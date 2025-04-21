document.addEventListener('DOMContentLoaded', () => {
    const blocks = document.querySelectorAll('.block[draggable="true"]');
    const workspace = document.getElementById('workspace');
    const snapIndicator = document.getElementById('snap-indicator');
    const SNAP_THRESHOLD = 30; // מרחק הפיקסלים להפעלת החיווי

    let draggedElement = null; // האלמנט הנגרר הנוכחי
    let potentialHost = null;  // הלבנה המארחת הפוטנציאלית
    let snapSide = null;       // הצד לחיבור ('left' או 'right' של המארח)

    // --- פונקציות עזר ---

    // חישוב מיקום החיווי
    function positionSnapIndicator(host, side) {
        const hostRect = host.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect(); // מיקום אזור העבודה
        const indicatorHeight = snapIndicator.offsetHeight || 40; // גובה ברירת מחדל

        let top = hostRect.top - workspaceRect.top + (hostRect.height / 2) - (indicatorHeight / 2) + workspace.scrollTop;
        let left;

        if (side === 'left') {
            // חבר משמאל למארח (הנגרר מימין)
            left = hostRect.left - workspaceRect.left - snapIndicator.offsetWidth + workspace.scrollLeft;
        } else { // side === 'right'
            // חבר מימין למארח (הנגרר משמאל)
            left = hostRect.right - workspaceRect.left + workspace.scrollLeft;
        }

        // הצג את החיווי במיקום הנכון
        snapIndicator.style.top = `${top}px`;
        snapIndicator.style.left = `${left}px`;
        snapIndicator.style.display = 'block';
        snapIndicator.style.height = `${hostRect.height}px`; // התאם גובה החיווי לגובה הלבנה
    }

    // הסתר את חיווי החיבור
    function hideSnapIndicator() {
        snapIndicator.style.display = 'none';
        potentialHost = null;
        snapSide = null;
    }

    // בדיקה אם הלבנה הנגררת קרובה מספיק לחיבור
    function checkSnapProximity(event) {
        hideSnapIndicator(); // איפוס לפני כל בדיקה

        if (!draggedElement) return;

        const currentX = event.clientX;
        const currentY = event.clientY;

        // מצא את כל הלבנים *בתוך* אזור העבודה
        const workspaceBlocks = Array.from(workspace.querySelectorAll('.block'));

        let closestHost = null;
        let closestSide = null;
        let minDistance = SNAP_THRESHOLD;

        workspaceBlocks.forEach(hostBlock => {
            // אל תנסה לחבר לבנה לעצמה
            if (hostBlock === draggedElement) return;

            const hostRect = hostBlock.getBoundingClientRect();

            // בדוק קרבה לצד השמאלי של המארח (חיבור שהנגרר מימין)
            const distToLeft = Math.abs(currentX - hostRect.left);
            const isVerticallyAlignedLeft = currentY > hostRect.top && currentY < hostRect.bottom;

            if (isVerticallyAlignedLeft && distToLeft < minDistance) {
                minDistance = distToLeft;
                closestHost = hostBlock;
                closestSide = 'left'; // הנגרר יתחבר לשמאל המארח
            }

            // בדוק קרבה לצד הימני של המארח (חיבור שהנגרר משמאל)
            const distToRight = Math.abs(currentX - hostRect.right);
            const isVerticallyAlignedRight = currentY > hostRect.top && currentY < hostRect.bottom;

            if (isVerticallyAlignedRight && distToRight < minDistance) {
                minDistance = distToRight;
                closestHost = hostBlock;
                closestSide = 'right'; // הנגרר יתחבר לימין המארח
            }
        });

        // אם נמצא מארח קרוב מספיק
        if (closestHost) {
            potentialHost = closestHost;
            snapSide = closestSide;
            positionSnapIndicator(potentialHost, snapSide);
        }
    }

    // --- אירועי גרירה ושחרור ---

    blocks.forEach(block => {
        block.addEventListener('dragstart', (event) => {
            draggedElement = event.target;
            event.dataTransfer.setData('text/plain', draggedElement.id);
            event.dataTransfer.effectAllowed = 'move';
            // השהייה קטנה לפני הוספת הקלאס כדי שהדפדפן יספיק "לצלם" את האלמנט המקורי
            setTimeout(() => {
                draggedElement.classList.add('dragging');
            }, 0);
            hideSnapIndicator(); // הסתר חיווי קודם אם היה
        });

        block.addEventListener('dragend', (event) => {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
            }
            draggedElement = null;
            hideSnapIndicator(); // ודא שהחיווי מוסתר בסיום הגרירה
        });
    });

    // אירועים על אזור העבודה (חשוב לאפשר שחרור)
    workspace.addEventListener('dragover', (event) => {
        event.preventDefault(); // חובה כדי לאפשר את אירוע ה-drop
        event.dataTransfer.dropEffect = 'move';
        checkSnapProximity(event); // בדוק קרבה והצג חיווי
    });

    workspace.addEventListener('dragleave', (event) => {
        // אם העכבר עוזב את אזור העבודה לגמרי
        if (event.target === workspace) {
             hideSnapIndicator();
        }
        // (הלוגיקה ב-dragover מטפלת במעבר בין לבנים)
    });

    workspace.addEventListener('drop', (event) => {
        event.preventDefault(); // מנע התנהגות ברירת מחדל (כמו פתיחת קישור)
        const droppedElementId = event.dataTransfer.getData('text/plain');
        const droppedElement = document.getElementById(droppedElementId); // עשוי להיות null אם הגרירה החלה מחוץ לדף

        if (!droppedElement) {
            hideSnapIndicator();
            return;
        }

        // אם זיהינו נקודת חיבור (potentialHost ו-snapSide נקבעו ב-dragover)
        if (potentialHost && snapSide) {
            // בצע את החיבור ה"פיזי"
            if (snapSide === 'left') {
                // הכנס את הנגרר *לפני* המארח
                workspace.insertBefore(droppedElement, potentialHost);
            } else { // snapSide === 'right'
                // הכנס את הנגרר *אחרי* המארח
                // אם המארח הוא האחרון, פשוט הוסף בסוף
                if (potentialHost.nextSibling) {
                    workspace.insertBefore(droppedElement, potentialHost.nextSibling);
                } else {
                    workspace.appendChild(droppedElement);
                }
            }
            console.log(`חיבור: ${droppedElement.id} ${snapSide === 'left' ? 'לשמאל' : 'לימין'} של ${potentialHost.id}`);
        } else {
            // אם לא היתה נקודת חיבור, פשוט הוסף את הלבנה לאזור העבודה
            // (בודק אם הלבנה כבר בתוך אזור העבודה כדי לא להוסיף אותה שוב אם רק מזיזים אותה בפנים)
            if (!workspace.contains(droppedElement)) {
                workspace.appendChild(droppedElement);
                 // אפשר לשפר: למקם לפי מיקום השחרור גם אם אין חיבור
                console.log(`הלבנה ${droppedElement.id} הונחה באזור העבודה ללא חיבור ספציפי.`);
            } else {
                // אם הלבנה כבר היתה באזור העבודה ולא התחברה, היא תחזור למקומה המקורי (בערך)
                 console.log(`הלבנה ${droppedElement.id} שוחררה באזור העבודה ללא חיבור חדש.`);
            }
        }

        hideSnapIndicator(); // הסתר חיווי לאחר השחרור
        // ודא שהסטטוס 'dragging' מוסר (למקרה ש-dragend לא הספיק)
        droppedElement.classList.remove('dragging');
        // איפוס מצב
        draggedElement = null;
        potentialHost = null;
        snapSide = null;

        // עדכון ויזואלי של קצוות הפאזל (לאחר שינוי ב-DOM)
        updatePuzzleEdges();
    });

    // פונקציה לעדכון ויזואלי של קצוות הפאזל בלבנים שבתוך ה-workspace
    function updatePuzzleEdges() {
        const blocksInWorkspace = workspace.querySelectorAll('.block');
        blocksInWorkspace.forEach((block, index) => {
            // הסר כל הגדרה קודמת של first/last
            block.classList.remove('is-first', 'is-last');

            // הוסף קלאס אם הלבנה ראשונה או אחרונה
            if (index === 0) {
                block.classList.add('is-first');
            }
            if (index === blocksInWorkspace.length - 1) {
                block.classList.add('is-last');
            }
        });
    }

     // קריאה ראשונית אם יש לבנים באזור העבודה בהתחלה
    updatePuzzleEdges();

    // הוספת קלאסים ל-CSS כדי להסתיר את הקצוות המתאימים
    const styleSheet = document.styleSheets[0]; // קח את ה-stylesheet הראשון (או מצא לפי שם)
    try {
        styleSheet.insertRule('.workspace > .block.is-first::before { display: none; }', styleSheet.cssRules.length);
        styleSheet.insertRule('.workspace > .block.is-last::after { display: none; }', styleSheet.cssRules.length);
    } catch (e) {
        console.error("Could not insert CSS rules for puzzle edges:", e);
        // אם יש בעיה (למשל עם גישה ל-stylesheet מ-CDN או מקור אחר),
        // אפשר להוסיף את הכללים האלה ישירות לקובץ ה-CSS הראשי:
        // .workspace > .block.is-first::before { display: none; }
        // .workspace > .block.is-last::after { display: none; }
    }

});
