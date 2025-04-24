// קוד גרירת בלוקים עם הילה בהתקרבות
document.addEventListener('DOMContentLoaded', function() {
    console.log('טוען מערכת גרירת בלוקים...');

    // מחכה שהדף יטען לגמרי כולל הסקריפטים האחרים
    setTimeout(function() {
        setupDragging();
    }, 1000);

    function setupDragging() {
        console.log('מפעיל מערכת גרירה...');

        // קבועים שניתן לכוונן
        let PROXIMITY_THRESHOLD = 10; // ברירת מחדל: 10 פיקסלים למרחק התקרבות
        const CONNECTION_TOLERANCE = 5;  // מרחק סף להצמדה

        // הוספת כפתור לשינוי סף הקרבה
        addProximityControl();

        // איתור אזור התכנות
        const programmingArea = document.getElementById('program-blocks');
        if (!programmingArea) {
            console.error('אזור התכנות לא נמצא!');
            return;
        }

        // משתנים גלובליים
        let currentDraggedBlock = null;
        let nearbyBlock = null;

        // הוספת סגנונות להילה
        addHighlightStyles();

        // פונקציה לטיפול בתחילת גרירה
        function handleDragStart(e) {
            if (e.target.classList.contains('block-container')) {
                currentDraggedBlock = e.target;

                // מניעת יצירת רוח רפאים
                const img = new Image();
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                e.dataTransfer.setDragImage(img, 0, 0);

                e.target.classList.add('dragging');

                // שמירת מיקום מקורי
                e.target.dataset.originalLeft = e.target.style.left || '';
                e.target.dataset.originalTop = e.target.style.top || '';
            }
        }

        // פונקציה לטיפול בסיום גרירה
        function handleDragEnd(e) {
            if (e.target.classList.contains('block-container')) {
                e.target.classList.remove('dragging');

                if (nearbyBlock &&
                    (e.target.classList.contains('proximity-source') ||
                     nearbyBlock.classList.contains('proximity-target'))) {
                    connectBlocks(e.target, nearbyBlock);
                } else {
                    // החזרת מיקום מקורי אם לא חובר
                    e.target.style.left = e.target.dataset.originalLeft || '';
                    e.target.style.top = e.target.dataset.originalTop || '';
                }

                clearAllHighlights();
                currentDraggedBlock = null;
                nearbyBlock = null;
            }
        }

        // פונקציה לטיפול בגרירה מעל אזור התכנות
        function handleDragOver(e) {
            e.preventDefault();
            if (currentDraggedBlock) {
                updateDraggedBlockPosition(e);
                checkProximityToOtherBlocks();
            }
        }

        // פונקציה לטיפול בתנועת העכבר
        function handleMouseMove(e) {
            if (currentDraggedBlock && currentDraggedBlock.classList.contains('dragging')) {
                updateDraggedBlockPosition(e);
                checkProximityToOtherBlocks();
            }
        }

        // מאזינים לאירועים
        programmingArea.addEventListener('dragstart', handleDragStart);
        programmingArea.addEventListener('dragend', handleDragEnd);
        programmingArea.addEventListener('dragover', handleDragOver);
        programmingArea.addEventListener('mousemove', handleMouseMove);

        // פונקציה לעדכון מיקום הבלוק הנגרר
        function updateDraggedBlockPosition(e) {
            if (!currentDraggedBlock) return;

            const programRect = programmingArea.getBoundingClientRect();
            const blockRect = currentDraggedBlock.getBoundingClientRect();
            const halfWidth = blockRect.width / 2;
            const halfHeight = blockRect.height / 2;

            let newLeft = e.clientX - programRect.left - halfWidth;
            let newTop = e.clientY - programRect.top - halfHeight;

            // שמירה על גבולות אזור התכנות
            newLeft = Math.max(0, Math.min(newLeft, programRect.width - blockRect.width));
            newTop = Math.max(0, Math.min(newTop, programRect.height - blockRect.height));

            currentDraggedBlock.style.left = newLeft + 'px';
            currentDraggedBlock.style.top = newTop + 'px';
        }

        // פונקציה לבדיקת קרבה בין בלוקים
        function checkProximityToOtherBlocks() {
            if (!currentDraggedBlock) return;

            clearAllHighlights();
            nearbyBlock = null;

            const blocks = programmingArea.querySelectorAll('.block-container');
            if (blocks.length < 2) return;

            const draggedRect = currentDraggedBlock.getBoundingClientRect();

            let closestBlock = null;
            let minDistance = Infinity;

            const draggedCenterX = draggedRect.left + draggedRect.width / 2;
            const draggedCenterY = draggedRect.top + draggedRect.height / 2;

            blocks.forEach(block => {
                if (block === currentDraggedBlock) return;

                const blockRect = block.getBoundingClientRect();

                const blockCenterX = blockRect.left + blockRect.width / 2;
                const blockCenterY = blockRect.top + blockRect.height / 2;

                const distance = Math.sqrt(
                    Math.pow(draggedCenterX - blockCenterX, 2) +
                    Math.pow(draggedCenterY - blockCenterY, 2)
                );

                let horizontalGap;
                if (draggedRect.right < blockRect.left) {
                    horizontalGap = blockRect.left - draggedRect.right;
                } else if (draggedRect.left > blockRect.right) {
                    horizontalGap = draggedRect.left - blockRect.right;
                } else {
                    horizontalGap = 0;
                }

                const verticalMatch = Math.abs(draggedRect.top - blockRect.top) < 20;

                if (horizontalGap <= PROXIMITY_THRESHOLD && verticalMatch && horizontalGap < minDistance) {
                    minDistance = horizontalGap;
                    closestBlock = block;
                }
            });

            if (closestBlock) {
                nearbyBlock = closestBlock;
                highlightBlocks(currentDraggedBlock, nearbyBlock);
            }
        }

        // פונקציה להדגשת בלוקים קרובים
        function highlightBlocks(draggedBlock, targetBlock) {
            if (!draggedBlock || !targetBlock) return;

            draggedBlock.classList.add('proximity-source');
            targetBlock.classList.add('proximity-target');
        }

        // פונקציה לניקוי הילות
        function clearAllHighlights() {
            const highlightedBlocks = programmingArea.querySelectorAll('.proximity-source, .proximity-target');
            highlightedBlocks.forEach(block => {
                block.classList.remove('proximity-source', 'proximity-target');
            });
        }

        // פונקציה לחיבור בלוקים
        function connectBlocks(sourceBlock, targetBlock) {
            if (!sourceBlock || !targetBlock) return;

            const sourceRect = sourceBlock.getBoundingClientRect();
            const targetRect = targetBlock.getBoundingClientRect();
            const programRect = programmingArea.getBoundingClientRect();

            let newLeft, newTop;
            let direction;

            if (Math.abs(sourceRect.top - targetRect.top) > CONNECTION_TOLERANCE) {
                console.log('הבלוקים לא באותו גובה, לא מבצע חיבור.');
                return;
            }

            if (sourceRect.right < targetRect.left && targetRect.left - sourceRect.right <= CONNECTION_TOLERANCE) {
                // מקור משמאל ליעד
                newLeft = targetRect.left - sourceRect.width - programRect.left;
                newTop = targetRect.top - programRect.top;
                direction = 'left-to-right';
            } else if (sourceRect.left > targetRect.right && sourceRect.left - targetRect.right <= CONNECTION_TOLERANCE) {
                // מקור מימין ליעד
                newLeft = targetRect.right - programRect.left;
                newTop = targetRect.top - programRect.top;
                direction = 'right-to-left';
            } else {
                 console.log('הבלוקים לא קרובים מספיק אופקית, לא מבצע חיבור.');
                 return;
            }

            // עדכון מיקום וסגנון
            sourceBlock.style.position = 'absolute';
            sourceBlock.style.left = newLeft + 'px';
            sourceBlock.style.top = newTop + 'px';

            sourceBlock.classList.add('connected-block');
            targetBlock.classList.add('has-connected-block');

            sourceBlock.setAttribute('data-connected-to', targetBlock.id || generateUniqueId(targetBlock));
            sourceBlock.setAttribute('data-connection-direction', direction);

            addConnectionAnimation(sourceBlock, targetBlock);
        }

        // פונקציות עזר (כמו קודם)
        function addVisualConnector() { /* ... */ }
        function removeVisualConnectors() { /* ... */ }
        function generateUniqueId() { /* ... */ }
        function addConnectionAnimation() { /* ... */ }
        function addHighlightStyles() { /* ... */ }
        function addProximityControl() { /* ... */ }

        // מאזין לכפתור "נקה הכל" (כמו קודם)
        const clearAllButton = document.getElementById('clear-all');
        if (clearAllButton) {
            clearAllButton.addEventListener('click', function() { /* ... */ });
        }
    }
});
