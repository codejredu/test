<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>חיבור בין קבוצות - דוגמה</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .container {
            display: flex;
            justify-content: space-around;
            margin-bottom: 50px;
        }
        
        .draggable-group {
            background-color: #fff;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            width: 200px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            cursor: move;
        }
        
        .draggable-group h3 {
            margin-top: 0;
            color: #444;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        
        .instructions {
            background-color: #e9f7fe;
            border: 1px solid #c5e8ff;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 30px;
        }
        
        .instructions h2 {
            margin-top: 0;
            color: #0078d4;
        }
        
        .instructions ul {
            margin-bottom: 0;
        }
    </style>
</head>
<body>
    <div class="instructions">
        <h2>הוראות</h2>
        <ul>
            <li>גרור את הקבוצות באמצעות לחיצה והחזקה</li>
            <li>כאשר תגרור קבוצה קרוב לקבוצה אחרת, העוגנים הכחולים והכתומים יתחילו להבהב</li>
            <li>שחרר את הקבוצה כדי ליצור חיבור בין הקבוצות</li>
            <li>ניתן ליצור חיבורים מימין לשמאל או משמאל לימין</li>
        </ul>
    </div>

    <h1>מערכת חיבור בין קבוצות</h1>
    
    <div class="container">
        <div id="group1" class="draggable-group" draggable="true">
            <h3>קבוצה 1</h3>
            <p>פריט לדוגמה בקבוצה 1</p>
            <p>גרור אותי!</p>
        </div>
        
        <div id="group2" class="draggable-group" draggable="true">
            <h3>קבוצה 2</h3>
            <p>פריט לדוגמה בקבוצה 2</p>
            <p>גרור אותי!</p>
        </div>
        
        <div id="group3" class="draggable-group" draggable="true">
            <h3>קבוצה 3</h3>
            <p>פריט לדוגמה בקבוצה 3</p>
            <p>גרור אותי!</p>
        </div>
    </div>

    <!-- טעינת הקובץ המאוחד -->
    <script>
    // הטמעה ישירה של הקוד group-connect.js
    
    // הוספת סגנונות CSS כחלק מהקוד
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* סגנונות לקבוצות */
            .draggable-group {
                position: relative;
                cursor: move;
                user-select: none;
                display: inline-block;
            }

            /* סגנונות לעוגני קרבה */
            .proximity-anchor {
                position: absolute;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                cursor: pointer;
                z-index: 10;
                box-shadow: 0 0 3px rgba(0,0,0,0.3);
                transition: transform 0.2s ease;
            }

            .proximity-anchor:hover {
                transform: scale(1.3) translateY(-50%);
            }

            .left-anchor {
                left: -6px;
                top: 50%;
                transform: translateY(-50%);
                /* צבע כחול */
                background-color: #0066cc;
            }

            .right-anchor {
                right: -6px;
                top: 50%;
                transform: translateY(-50%);
                /* צבע כתום */
                background-color: #ff9900;
            }

            /* סגנונות לחיבורים בין קבוצות */
            .group-connection {
                position: absolute;
                height: 3px;
                background-color: #555;
                pointer-events: none;
                transition: background-color 0.3s ease;
            }

            .group-connection:hover {
                background-color: #ff5500;
            }

            /* אנימציית הבהוב לזיהוי קרבה */
            .proximity-anchor.active {
                animation: blink 0.5s infinite alternate;
                box-shadow: 0 0 8px rgba(255, 255, 255, 0.8), 0 0 12px rgba(0, 0, 0, 0.4);
            }

            @keyframes blink {
                from { opacity: 0.5; transform: scale(1) translateY(-50%); }
                to { opacity: 1; transform: scale(1.3) translateY(-50%); }
            }
        `;
        document.head.appendChild(style);
    }

    // פונקציה ליצירת עוגני קרבה לקבוצה
    function createProximityAnchors(group) {
        // יצירת עוגן שמאלי (כחול)
        const leftAnchor = document.createElement('div');
        leftAnchor.className = 'proximity-anchor left-anchor';
        
        // יצירת עוגן ימני (כתום)
        const rightAnchor = document.createElement('div');
        rightAnchor.className = 'proximity-anchor right-anchor';
        
        // הוספת העוגנים לקבוצה
        group.appendChild(leftAnchor);
        group.appendChild(rightAnchor);
        
        // החזרת אובייקט עם שני העוגנים
        return { leftAnchor, rightAnchor };
    }

    // פונקציה לזיהוי קרבה בין קבוצות
    function detectGroupProximity(groupA, groupB, threshold = 50) {
        // קבלת המיקום של העוגנים
        const groupARight = groupA.querySelector('.right-anchor').getBoundingClientRect();
        const groupBLeft = groupB.querySelector('.left-anchor').getBoundingClientRect();
        
        // חישוב המרחק בין העוגן הימני של קבוצה A לעוגן השמאלי של קבוצה B
        const distance = Math.abs(groupARight.right - groupBLeft.left);
        
        // בדיקה אם המרחק קטן מהסף שהוגדר
        const isClose = distance < threshold;
        
        // הוספת/הסרת מחלקת קרבה
        if (isClose) {
            groupA.querySelector('.right-anchor').classList.add('active');
            groupB.querySelector('.left-anchor').classList.add('active');
        } else {
            groupA.querySelector('.right-anchor').classList.remove('active');
            groupB.querySelector('.left-anchor').classList.remove('active');
        }
        
        return isClose;
    }

    // פונקציה לחיבור בין שתי קבוצות
    function connectGroups(groupA, groupB) {
        // יצירת אלמנט החיבור
        const connection = document.createElement('div');
        connection.className = 'group-connection';
        
        // שמירת מזהים של הקבוצות המחוברות
        connection.dataset.groupA = groupA.id;
        connection.dataset.groupB = groupB.id;
        
        // הוספת החיבור לדף
        document.body.appendChild(connection);
        
        // עדכון מיקום החיבור
        updateConnectionPosition(connection, groupA, groupB);
        
        return connection;
    }

    // פונקציה לעדכון מיקום החיבור בין קבוצות
    function updateConnectionPosition(connection, groupA, groupB) {
        const groupARight = groupA.querySelector('.right-anchor').getBoundingClientRect();
        const groupBLeft = groupB.querySelector('.left-anchor').getBoundingClientRect();
        
        // חישוב נקודת האמצע בין שני העוגנים
        const startX = groupARight.right;
        const startY = groupARight.top + groupARight.height / 2;
        const endX = groupBLeft.left;
        const endY = groupBLeft.top + groupBLeft.height / 2;
        
        // עדכון המיקום והגודל של החיבור
        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        
        connection.style.width = `${length}px`;
        connection.style.left = `${startX}px`;
        connection.style.top = `${startY}px`;
        connection.style.transform = `rotate(${angle}deg)`;
        connection.style.transformOrigin = '0 50%';
    }

    // פונקציה להפיכת אלמנטים לגרירים
    function enableDragging() {
        const draggables = document.querySelectorAll('.draggable-group');
        
        draggables.forEach(item => {
            // משתנים לשמירת מיקום התחלתי
            let offsetX, offsetY;
            let isDragging = false;
            
            item.addEventListener('dragstart', (e) => {
                // שמירת המרחק מהקואורדינטות של העכבר לקצה האלמנט
                const rect = item.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                
                // הגדרת אפקט הגרירה
                e.dataTransfer.effectAllowed = 'move';
                isDragging = true;
                
                // הוספת מחלקה לסימון הגרירה
                item.classList.add('is-dragging');
            });
            
            item.addEventListener('drag', (e) => {
                if (isDragging && e.clientX > 0) {  // תיקון לבאג בחלק מהדפדפנים שמציג קואורדינטות 0
                    // חישוב הקואורדינטות החדשות תוך כדי גרירה
                    const x = e.clientX - offsetX;
                    const y = e.clientY - offsetY;
                    
                    // עדכון המיקום של האלמנט בזמן אמת
                    item.style.position = 'absolute';
                    item.style.left = x + 'px';
                    item.style.top = y + 'px';
                    
                    // פעולת אירוע מותאם אישית
                    const event = new CustomEvent('groupMoved');
                    item.dispatchEvent(event);
                }
            });
            
            item.addEventListener('dragend', (e) => {
                // חישוב הקואורדינטות החדשות
                const x = e.clientX - offsetX;
                const y = e.clientY - offsetY;
                
                // עדכון המיקום של האלמנט
                item.style.position = 'absolute';
                item.style.left = x + 'px';
                item.style.top = y + 'px';
                
                // הסרת מחלקה לסימון הגרירה
                item.classList.remove('is-dragging');
                isDragging = false;
                
                // פעולת אירוע מותאם אישית
                const event = new CustomEvent('groupMoved');
                item.dispatchEvent(event);
