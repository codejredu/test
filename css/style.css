document.addEventListener('DOMContentLoaded', () => {
    // קבל הפניות לאלמנטים קבועים
    const workspace = document.getElementById('program-blocks'); // השתמש ב-ID הנכון
    const palette = document.getElementById('block-palette');    // הפניה לפאלט
    const snapIndicator = document.getElementById('snap-indicator');
    const SNAP_THRESHOLD = 30;

    let draggedElement = null;
    let potentialHost = null;
    let snapSide = null;
    let isDraggingFromPalette = false; // דגל לזיהוי מקור הגרירה

    // --- פונקציות עזר (positionSnapIndicator, hideSnapIndicator) ---
    // ... (כמו בקוד המקורי, ודא שהן פועלות עם 'workspace' הנכון) ...
    function positionSnapIndicator(host, side) {
        const hostRect = host.getBoundingClientRect();
        // ודא ש-workspace הוא האלמנט הנכון (#program-blocks)
        const workspaceRect = workspace.getBoundingClientRect();
        const indicatorHeight = snapIndicator.offsetHeight || hostRect.height; // התאם לגובה המארח

        let top = hostRect.top - workspaceRect.top + workspace.scrollTop; // הסר חלוקה ב-2 אם רוצים גובה מלא
        let left;

        if (side === 'left') {
            left = hostRect.left - workspaceRect.left - snapIndicator.offsetWidth + workspace.scrollLeft;
        } else { // side === 'right'
            left = hostRect.right - workspaceRect.left + workspace.scrollLeft;
        }

        snapIndicator.style.top = `${top}px`;
        snapIndicator.style.left = `${left}px`;
        snapIndicator.style.height = `${hostRect.height}px`; // התאם גובה החיווי לגובה הלבנה
        snapIndicator.style.display = 'block';
    }

    function hideSnapIndicator() {
        snapIndicator.style.display = 'none';
        potentialHost = null;
        snapSide = null;
    }

    // פונקציית בדיקת קרבה (ללא שינוי מהותי, ודא שהיא משתמשת ב-workspace הנכון)
    function checkSnapProximity(event) {
        hideSnapIndicator();
        if (!draggedElement) return;

        const currentX = event.clientX;
        const currentY = event.clientY;
        const workspaceBlocks = Array.from(workspace.querySelectorAll('.block')); // מצא בלוקים *בתוך* אזור התכנות

        let closestHost = null;
        let closestSide = null;
        let minDistance = SNAP_THRESHOLD;

        workspaceBlocks.forEach(hostBlock => {
            if (hostBlock === draggedElement) return;
            const hostRect = hostBlock.getBoundingClientRect();
            const isVerticallyAligned = currentY > hostRect.top && currentY < hostRect.bottom;

            if (isVerticallyAligned) {
                const distToLeft = Math.abs(currentX - hostRect.left);
                const distToRight = Math.abs(currentX - hostRect.right);

                if (distToLeft < minDistance && distToLeft < distToRight) { // קרוב יותר לשמאל
                    minDistance = distToLeft;
                    closestHost = hostBlock;
                    closestSide = 'left';
                } else if (distToRight < minDistance) { // קרוב יותר לימין
                    minDistance = distToRight;
                    closestHost = hostBlock;
                    closestSide = 'right';
                }
            }
        });

        if (closestHost) {
            potentialHost = closestHost;
            snapSide = closestSide;
            positionSnapIndicator(potentialHost, snapSide);
        }
    }


    // --- האזנה לאירועים באמצעות Event Delegation ---

    // 1. האזנה לתחילת גרירה (מהפאלט או מאזור התכנות)
    document.addEventListener('dragstart', (event) => {
        const target = event.target;
        isDraggingFromPalette = false; // אפס את הדגל

        // בדיקה אם הגרירה התחילה מבלוק בתוך הפאלט
        const paletteBlockContainer = target.closest('#block-palette .block-container');
        if (paletteBlockContainer) {
            draggedElement = paletteBlockContainer; // שמור את המקור מהפאלט
            // אפשר לשמור מידע מה-data attributes של ה-paletteBlockContainer
            event.dataTransfer.setData('text/plain', paletteBlockContainer.id || `palette-${Date.now()}`); // ID זמני אם אין
            event.dataTransfer.setData('blockType', paletteBlockContainer.dataset.type || 'default');
            event.dataTransfer.setData('blockCategory', paletteBlockContainer.closest('.block-category')?.dataset.category || 'unknown');
            event.dataTransfer.effectAllowed = 'copy'; // גוררים עותק מהפאלט
            isDraggingFromPalette = true;
             setTimeout(() => {
                // אפשר להוסיף קלאס ל-paletteBlockContainer אם רוצים עיצוב מיוחד בזמן גרירה ממנו
             }, 0);

        // בדיקה אם הגרירה התחילה מבלוק בתוך אזור התכנות
        } else if (target.matches('#program-blocks .block')) {
            draggedElement = target; // זה הבלוק שנגרר מאזור התכנות
            event.dataTransfer.setData('text/plain', draggedElement.id);
            event.dataTransfer.effectAllowed = 'move'; // מזיזים בלוק קיים
             setTimeout(() => {
                 if(draggedElement) draggedElement.classList.add('dragging'); // הוסף קלאס רק לבלוקים באזור התכנות
             }, 0);
        } else {
            // אם הגרירה לא התחילה מאלמנט רלוונטי, אל תעשה כלום או בטל
            // event.preventDefault(); // בדרך כלל לא נדרש כאן
            return;
        }
        hideSnapIndicator();
    });


    // 2. האזנה לסיום הגרירה (בכל מקום במסמך)
    document.addEventListener('dragend', (event) => {
        if (draggedElement) {
            // הסר קלאס 'dragging' אם הוא קיים (רק לבלוקים מאזור התכנות)
             if (draggedElement.classList.contains('block')) {
                draggedElement.classList.remove('dragging');
            }
        }
        // איפוס כל המשתנים הגלובליים הקשורים לגרירה
        draggedElement = null;
        potentialHost = null;
        snapSide = null;
        isDraggingFromPalette = false;
        hideSnapIndicator();
    });


    // 3. האזנה לאירועים על אזור התכנות עצמו
    workspace.addEventListener('dragenter', (event) => {
        event.preventDefault(); // אפשר כניסה לאזור
    });

    workspace.addEventListener('dragover', (event) => {
        event.preventDefault(); // חובה כדי לאפשר drop
        if (isDraggingFromPalette) {
            event.dataTransfer.dropEffect = 'copy';
        } else {
            event.dataTransfer.dropEffect = 'move';
        }
        checkSnapProximity(event); // בדוק קרבה והצג חיווי
    });

    workspace.addEventListener('dragleave', (event) => {
        // הסתר חיווי רק אם העכבר עוזב *לגמרי* את אזור התכנות
        if (!workspace.contains(event.relatedTarget)) {
            hideSnapIndicator();
        }
    });

    workspace.addEventListener('drop', (event) => {
        event.preventDefault();
        hideSnapIndicator(); // הסתר חיווי לפני הוספה

        let elementToDrop;

        if (isDraggingFromPalette && draggedElement) {
            // --- יצירת בלוק חדש מאלמנט שנגרר מהפאלט ---
            elementToDrop = document.createElement('div');
            elementToDrop.classList.add('block'); // הקלאס הראשי של בלוק באזור התכנות
            elementToDrop.setAttribute('draggable', 'true');
            elementToDrop.id = `prog-${draggedElement.dataset.type || 'block'}-${Date.now()}`; // ID ייחודי

            // העתק מידע רלוונטי (טקסט, סוג, צבע וכו')
            const blockType = event.dataTransfer.getData('blockType') || 'default';
            const category = event.dataTransfer.getData('blockCategory') || 'unknown';
            elementToDrop.dataset.type = blockType; // שמור את הסוג
            elementToDrop.textContent = blockType.replace('-', ' '); // טקסט פשוט לדוגמה

            // קבע צבע רקע וגבול בהתאם לקטגוריה (אם רוצים)
            // דוגמה:
             const solidColorVar = `--${category}-color-solid`;
             const bgColor = getComputedStyle(document.documentElement).getPropertyValue(solidColorVar);
             if (bgColor) {
                 elementToDrop.style.backgroundColor = bgColor;
                 // אפשר גם לשנות את צבע הגבול בהתאם
                 // elementToDrop.style.borderColor = ...;
             }
             // אחרת ישתמש בברירת המחדל מה-CSS

            console.log(`יצירת בלוק חדש מסוג: ${blockType} מקטגוריה: ${category}`);

        } else if (draggedElement && workspace.contains(draggedElement)) {
            // --- הזזת בלוק קיים בתוך אזור התכנות ---
            elementToDrop = draggedElement; // הבלוק הקיים שנגרר
             console.log(`הזזת בלוק קיים: ${elementToDrop.id}`);
        } else {
             console.log("שחרור לא רלוונטי או שגיאה");
            return; // יציאה אם הגרירה לא מזוהה נכון
        }


        // --- לוגיקת ההכנסה (זהה לקוד המקורי, פועלת על elementToDrop) ---
        if (potentialHost && snapSide && elementToDrop !== potentialHost) { // ודא שלא מחברים בלוק לעצמו
            if (snapSide === 'left') {
                workspace.insertBefore(elementToDrop, potentialHost);
                 console.log(`חיבור: ${elementToDrop.id} לשמאל של ${potentialHost.id}`);
            } else { // snapSide === 'right'
                workspace.insertBefore(elementToDrop, potentialHost.nextSibling); // nextSibling מטפל גם במקרה האחרון
                 console.log(`חיבור: ${elementToDrop.id} לימין של ${potentialHost.id}`);
            }
        } else {
            // אם אין נקודת חיבור, פשוט הוסף לסוף (או מקם לפי העכבר - יותר מורכב)
            // נבדוק אם האלמנט *כבר* נמצא באזור העבודה (למקרה של גרירה ללא חיבור)
             if (!workspace.contains(elementToDrop)) {
                 workspace.appendChild(elementToDrop);
                 console.log(`הלבנה ${elementToDrop.id} הונחה בסוף אזור העבודה.`);
             } else if (elementToDrop !== potentialHost) {
                 // אם הבלוק כבר בפנים אבל לא התחבר, הוא יישאר במקומו הישן יחסית (אלא אם נזיז אותו ידנית)
                 console.log(`הלבנה ${elementToDrop.id} שוחררה ללא חיבור חדש.`);
             }
        }

        // עדכון ויזואלי של קצוות הפאזל
        updatePuzzleEdges();

        // איפוס סופי (למקרה ש-dragend לא תפס)
        if (elementToDrop.classList.contains('block')) {
             elementToDrop.classList.remove('dragging');
        }
        draggedElement = null;
        potentialHost = null;
        snapSide = null;
        isDraggingFromPalette = false;
    });

    // --- פונקציה לעדכון ויזואלי של קצוות הפאזל ---
    function updatePuzzleEdges() {
        const blocksInWorkspace = workspace.querySelectorAll('.block');
        blocksInWorkspace.forEach((block, index, arr) => {
            // שימוש ב-classList.toggle לקיצור
            block.classList.toggle('is-first', index === 0);
            block.classList.toggle('is-last', index === arr.length - 1);
        });
    }

     // קריאה ראשונית אם יש לבנים באזור העבודה בהתחלה
    updatePuzzleEdges();

    // --- הוספת כללי CSS להסתרת קצוות (כמו בקוד המקורי) ---
    // (מומלץ לשים אותם ישירות בקובץ ה-CSS במקום להזריק עם JS)
    /*
    const styleSheet = document.styleSheets[0];
    try {
        // שים לב שהסלקטורים מתאימים ל-ID של אזור התכנות ולשמות הקלאסים שהגדרת
        styleSheet.insertRule('#program-blocks > .block.is-first::before { display: none; }', styleSheet.cssRules.length);
        styleSheet.insertRule('#program-blocks > .block.is-last::after { display: none; }', styleSheet.cssRules.length);
    } catch (e) {
        console.error("Could not insert CSS rules for puzzle edges:", e);
    }
    */
    // ודא שהכללים האלה קיימים בקובץ style.css שלך:
    // #program-blocks > .block.is-first::before { display: none; }
    // #program-blocks > .block.is-last::after { display: none; }

}); // סוף DOMContentLoaded
