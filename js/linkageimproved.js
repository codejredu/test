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
        let PROXIMITY_THRESHOLD = 5; // ברירת מחדל: 5 פיקסלים למרחק התקרבות

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

        // מאזין לאירוע dragstart - כאשר מתחילים לגרור בלוק
        programmingArea.addEventListener('dragstart', function(e) {
            if (e.target.classList.contains('block-container')) {
                // שמירת הבלוק הנגרר
                currentDraggedBlock = e.target;

                // מניעת יצירת רוח רפאים - הגדרת התמונה שתיווצר בזמן גרירה
                const img = new Image();
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                e.dataTransfer.setDragImage(img, 0, 0);

                // מסמנים את הבלוק כנגרר
                e.target.classList.add('dragging');

                // מיקום מקורי של הבלוק למקרה שנצטרך לשחזר אותו
                e.target.dataset.originalLeft = e.target.style.left || '';
                e.target.dataset.originalTop = e.target.style.top || '';
            }
        });

        // מאזין לאירוע dragend - כאשר מסיימים לגרור בלוק
        programmingArea.addEventListener('dragend', function(e) {
            if (e.target.classList.contains('block-container')) {
                console.log('סיום גרירה נתפס באזור התכנות');

                // הסרת הסימון
                e.target.classList.remove('dragging');

                // בדיקה אם יש בלוק קרוב וההילה מופיעה
                if (nearbyBlock &&
                    (e.target.classList.contains('proximity-source') ||
                     nearbyBlock.classList.contains('proximity-target'))) {
                    console.log('יש הילה - מבצע חיבור');
                    connectBlocks(e.target, nearbyBlock);
                } else {
                    console.log('אין הילה - לא מבצע חיבור');
                }

                // נקה את המצב והילות
                clearAllHighlights();
                currentDraggedBlock = null;
                nearbyBlock = null;
            }
        });

        // מאזין לאירוע dragover - כאשר גוררים מעל אזור התכנות
        programmingArea.addEventListener('dragover', function(e) {
            e.preventDefault(); // חייב למניעת התנהגות ברירת מחדל

            if (currentDraggedBlock) {
                // בדיקת קרבה לבלוקים אחרים
                checkProximityToOtherBlocks();
            }
        });

        // מאזין לאירוע mousemove - לעדכון רציף של מיקום הבלוק
        programmingArea.addEventListener('mousemove', function(e) {
            if (currentDraggedBlock && currentDraggedBlock.classList.contains('dragging')) {
                // בדיקת קרבה לבלוקים אחרים
                checkProximityToOtherBlocks();
            }
        });

        // פונקציה לעדכון מיקום הבלוק הנגרר בזמן אמת
        function updateDraggedBlockPosition(e) {
            if (!currentDraggedBlock) return;

            const programRect = programmingArea.getBoundingClientRect();

            // חישוב מיקום חדש יחסית לאזור התכנות
            // הפחתת מחצית מרוחב הבלוק כדי שהבלוק יהיה ממוקם במרכז הסמן
            const blockRect = currentDraggedBlock.getBoundingClientRect();
            const halfWidth = blockRect.width / 2;
            const halfHeight = blockRect.height / 2;

            // עדכון המיקום רק אם העכבר נמצא בגבולות הגיוניים
            if (e.clientX > 0 && e.clientY > 0) {
                currentDraggedBlock.style.position = 'absolute';
                currentDraggedBlock.style.left = (e.clientX - programRect.left - halfWidth) + 'px';
                currentDraggedBlock.style.top = (e.clientY - programRect.top - halfHeight) + 'px';
            }
        }

        // פונקציה לבדיקת קרבה לבלוקים אחרים
        function checkProximityToOtherBlocks() {
            if (!currentDraggedBlock) return;

            // נקה הילות קודמות
            clearAllHighlights();
            nearbyBlock = null;

            // קבלת כל הבלוקים באזור התכנות
            const blocks = programmingArea.querySelectorAll('.block-container');
            if (blocks.length < 2) return; // צריך לפחות 2 בלוקים

            // קבלת המיקום של הבלוק הנגרר
            const draggedRect = currentDraggedBlock.getBoundingClientRect();

            // משתנה לשמירת הבלוק הקרוב ביותר
            let closestBlock = null;
            let minDistance = Infinity;

            // חישוב מרכז הבלוק הנגרר
            const draggedCenterX = draggedRect.left + draggedRect.width / 2;
            const draggedCenterY = draggedRect.top + draggedRect.height / 2;

            // בדיקת כל בלוק
            blocks.forEach(block => {
                // דלג על הבלוק הנגרר עצמו
                if (block === currentDraggedBlock) return;

                const blockRect = block.getBoundingClientRect();

                // חישוב מרכז הבלוק הנבדק
                const blockCenterX = blockRect.left + blockRect.width / 2;
                const blockCenterY = blockRect.top + blockRect.height / 2;

                // חישוב המרחק בין מרכזי הבלוקים
                const distance = Math.sqrt(
                    Math.pow(draggedCenterX - blockCenterX, 2) +
                    Math.pow(draggedCenterY - blockCenterY, 2)
                );

                // חישוב המרחק האופקי בין קצוות הבלוקים
                let horizontalGap;
                if (draggedRect.right < blockRect.left) {
                    // הבלוק הנגרר משמאל לבלוק הנבדק
                    horizontalGap = blockRect.left - draggedRect.right;
                } else if (draggedRect.left > blockRect.right) {
                    // הבלוק הנגרר מימין לבלוק הנבדק
                    horizontalGap = draggedRect.left - blockRect.right;
                } else {
                    // יש חפיפה אופקית
                    horizontalGap = 0;
                }

                // אם הבלוקים קרובים אופקית וגם באותו גובה בערך
                const verticalMatch = Math.abs(draggedRect.top - blockRect.top) < 20;

                // אם הבלוקים קרובים מספיק אופקית ובאותו גובה בערך
                if (horizontalGap <= PROXIMITY_THRESHOLD && verticalMatch && horizontalGap < minDistance) {
                    minDistance = horizontalGap;
                    closestBlock = block;
                }
            });

            // אם נמצא בלוק קרוב מספיק, הדגש אותו
            if (closestBlock) {
                console.log('נמצא בלוק קרוב במרחק:', minDistance, 'פיקסלים. מציג הילה.');
                nearbyBlock = closestBlock;
                highlightBlocks(currentDraggedBlock, nearbyBlock);
            } else {
                console.log('לא נמצא בלוק קרוב מספיק.');
            }
        }

        // פונקציה להדגשת בלוקים קרובים
        function highlightBlocks(draggedBlock, targetBlock) {
            if (!draggedBlock || !targetBlock) return;

            console.log('מוסיף הילה לבלוקים');

            // הוספת קלאס להילה לבלוק הנגרר
            draggedBlock.classList.add('proximity-source');

            // הוספת קלאס להילה לבלוק המטרה
            targetBlock.classList.add('proximity-target');

            // בדיקת החלה מוצלחת של ההילה
            setTimeout(() => {
                if (draggedBlock.classList.contains('proximity-source') &&
                    targetBlock.classList.contains('proximity-target')) {
                    console.log('ההילה הופעלה בהצלחה');
                } else {
                    console.log('בעיה בהפעלת ההילה');
                }
            }, 50);
        }

        // פונקציה לניקוי כל ההילות
        function clearAllHighlights() {
            const highlightedBlocks = programmingArea.querySelectorAll('.proximity-source, .proximity-target');
            highlightedBlocks.forEach(block => {
                block.classList.remove('proximity-source', 'proximity-target');
            });
        }

        // פונקציה לחיבור בלוקים (התממשקות)
        function connectBlocks(sourceBlock, targetBlock) {
            if (!sourceBlock || !targetBlock) return;

            try {
                const sourceRect = sourceBlock.getBoundingClientRect();
                const targetRect = targetBlock.getBoundingClientRect();
                const programRect = programmingArea.getBoundingClientRect();

                // קביעת כיוון החיבור
                let direction;
                let newLeft, newTop;

                // חישוב מרכזי הבלוקים
                const sourceCenterX = sourceRect.left + sourceRect.width / 2;
                const targetCenterX = targetRect.left + targetRect.width / 2;

                // *** הבלוקים בתמונה צמודים לחלוטין - ללא חפיפה ולא רווח ***
                const OFFSET = 0; // אפס רווח או חפיפה

                if (sourceCenterX < targetCenterX) {
                    // המקור משמאל ליעד - הצד הימני של המקור צמוד לצד השמאלי של היעד
                    direction = 'left-to-right';

                    // מיקום מדויק - צמוד לחלוטין
                    newLeft = targetRect.left - sourceRect.width - programRect.left;
                    newTop = targetRect.top - programRect.top;

                    console.log('מחבר משמאל לימין, מיקום חדש:', newLeft, newTop);

                } else {
                    // המקור מימין ליעד - הצד השמאלי של המקור צמוד לצד הימני של היעד
                    direction = 'right-to-left';

                    // מיקום מדויק - צמוד לחלוטין
                    newLeft = targetRect.right - programRect.left;
                    newTop = targetRect.top - programRect.top;

                    console.log('מחבר מימין לשמאל, מיקום חדש:', newLeft, newTop);
                }

                // עדכון מיקום הבלוק המקור - חשוב מאוד
                sourceBlock.style.position = 'absolute';
                sourceBlock.style.left = newLeft + 'px';
                sourceBlock.style.top = newTop + 'px';

                // הוספת סימון לבלוקים המחוברים
                sourceBlock.classList.add('connected-block');
                targetBlock.classList.add('has-connected-block');

                // שמירת יחס החיבור לשימוש עתידי
                sourceBlock.setAttribute('data-connected-to', targetBlock.id || generateUniqueId(targetBlock));
                sourceBlock.setAttribute('data-connection-direction', direction);

                // רישום של מיקומי הבלוקים לאחר החיבור
                setTimeout(() => {
                    const newSourceRect = sourceBlock.getBoundingClientRect();
                    const newTargetRect = targetBlock.getBoundingClientRect();
                    console.log('מיקום סופי של מקור:', newSourceRect.left, newSourceRect.top);
                    console.log('מיקום סופי של יעד:', newTargetRect.left, newTargetRect.top);
                    console.log('הפרש אופקי:', Math.abs(newSourceRect.right - newTargetRect.left));
                }, 100);

                console.log('בוצעה התממשקות מדויקת בכיוון:', direction);
            } catch (err) {
                console.error('שגיאה בהתממשקות בלוקים:', err);
            }
        }

        // פונקציה להוספת מחבר ויזואלי בין הבלוקים
        function addVisualConnector(sourceBlock, targetBlock, direction) {
            // הסרת מחברים קודמים אם קיימים
            removeVisualConnectors();

            // יצירת אלמנט המחבר
            const connector = document.createElement('div');
            connector.className = 'blocks-connector';

            // מיקום המחבר בהתאם לכיוון החיבור
            if (direction === 'left-to-right') {
                // המקור משמאל ליעד
                const sourceRect = sourceBlock.getBoundingClientRect();
                const targetRect = targetBlock.getBoundingClientRect();

                // קביעת מיקום וגודל המחבר
                connector.style.position = 'absolute';
                connector.style.right = '0';
                connector.style.top = '50%';
                connector.style.width = '4px';
                connector.style.height = '4px';
                connector.style.backgroundColor = '#0066cc';
                connector.style.borderRadius = '2px';
                connector.style.transform = 'translateY(-50%)';
                connector.style.zIndex = '120';

                // הוספת המחבר לבלוק המקור
                sourceBlock.appendChild(connector);
            } else {
                // המקור מימין ליעד
                const connector2 = document.createElement('div');
                connector2.className = 'blocks-connector';

                // קביעת מיקום וגודל המחבר
                connector2.style.position = 'absolute';
                connector2.style.left = '0';
                connector2.style.top = '50%';
                connector2.style.width = '4px';
                connector2.style.height = '4px';
                connector2.style.backgroundColor = '#ffffff';
                connector2.style.border = '1px solid #cccccc';
                connector2.style.borderRadius = '2px';
                connector2.style.transform = 'translateY(-50%)';
                connector2.style.zIndex = '110';

                // הוספת המחבר לבלוק המקור
                sourceBlock.appendChild(connector2);
            }
        }

        // פונקציה להסרת מחברים ויזואליים
        function removeVisualConnectors() {
            const connectors = document.querySelectorAll('.blocks-connector');
            connectors.forEach(connector => connector.remove());
        }

        // פונקציה ליצירת מזהה ייחודי לבלוק
        function generateUniqueId(block) {
            if (!block.id) {
                const uniqueId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                block.id = uniqueId;
            }
            return block.id;
        }

        // פונקציה להוספת אנימציית התממשקות
