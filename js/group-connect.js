// group-connect.js - קובץ מאוחד עם CSS ו-JavaScript

// הוספת סגנונות CSS כחלק מהקוד
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* סגנונות לקבוצות */
        .draggable-group {
            position: relative;
            border: 1px solid #ccc;
            background-color: #f9f9f9;
            padding: 20px;
            margin: 10px;
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
        .proximity-detected .proximity-anchor {
            animation: blink 0.5s infinite alternate;
        }

        @keyframes blink {
            from { opacity: 0.5; }
            to { opacity: 1; }
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
    return distance < threshold;
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
        
        item.addEventListener('dragstart', (e) => {
            // שמירת המרחק מהקואורדינטות של העכבר לקצה האלמנט
            const rect = item.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // הגדרת אפקט הגרירה
            e.dataTransfer.effectAllowed = 'move';
        });
        
        item.addEventListener('dragend', (e) => {
            // חישוב הקואורדינטות החדשות
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            // עדכון המיקום של האלמנט
            item.style.position = 'absolute';
            item.style.left = x + 'px';
            item.style.top = y + 'px';
        });
    });
    
    // מניעת התנהגות ברירת המחדל של הדפדפן בגרירה
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        return false;
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        return false;
    });
}

// פונקציה להוספת האזנה לאירועי גרירה
function setupDragListeners(groups) {
    // מעקב אחר חיבורים קיימים
    const connections = {};
    
    groups.forEach(group => {
        // יצירת עוגני קרבה לכל קבוצה
        createProximityAnchors(group);
        
        // מעקב אחר תזוזת הקבוצה
        group.addEventListener('dragend', () => {
            // בדיקת קרבה לכל הקבוצות האחרות
            groups.forEach(otherGroup => {
                if (group !== otherGroup) {
                    // בדיקת כיוון: מימין לשמאל
                    if (detectGroupProximity(group, otherGroup)) {
                        // הוספת סימון קרבה
                        group.classList.add('proximity-detected');
                        otherGroup.classList.add('proximity-detected');
                        
                        // אם אין עדיין חיבור בין הקבוצות
                        const connectionKey = `${group.id}-${otherGroup.id}`;
                        if (!connections[connectionKey]) {
                            // יצירת חיבור חדש
                            connections[connectionKey] = connectGroups(group, otherGroup);
                        } else {
                            // עדכון מיקום החיבור הקיים
                            updateConnectionPosition(connections[connectionKey], group, otherGroup);
                        }
                    } else {
                        // הסרת סימון קרבה
                        group.classList.remove('proximity-detected');
                        otherGroup.classList.remove('proximity-detected');
                    }
                    
                    // בדיקת כיוון: משמאל לימין
                    if (detectGroupProximity(otherGroup, group)) {
                        // הוספת סימון קרבה
                        otherGroup.classList.add('proximity-detected');
                        group.classList.add('proximity-detected');
                        
                        // אם אין עדיין חיבור בין הקבוצות
                        const connectionKey = `${otherGroup.id}-${group.id}`;
                        if (!connections[connectionKey]) {
                            // יצירת חיבור חדש
                            connections[connectionKey] = connectGroups(otherGroup, group);
                        } else {
                            // עדכון מיקום החיבור הקיים
                            updateConnectionPosition(connections[connectionKey], otherGroup, group);
                        }
                    }
                }
            });
            
            // עדכון כל החיבורים הקיימים
            Object.entries(connections).forEach(([key, connection]) => {
                const [groupAId, groupBId] = key.split('-');
                const groupA = document.getElementById(groupAId);
                const groupB = document.getElementById(groupBId);
                
                if (groupA && groupB) {
                    updateConnectionPosition(connection, groupA, groupB);
                }
            });
        });
    });
}

// פונקציה לאתחול המערכת
function initGroupConnections() {
    // הוספת סגנונות CSS
    addStyles();
    
    // הפעלת גרירה
    enableDragging();
    
    // בחירת כל הקבוצות בדף
    const groups = document.querySelectorAll('.draggable-group');
    
    // הגדרת האזנה לאירועי גרירה
    setupDragListeners(Array.from(groups));
}

// הפעלת האתחול כאשר הדף נטען
document.addEventListener('DOMContentLoaded', initGroupConnections);
