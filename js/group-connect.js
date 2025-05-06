// group-connect.js

// פונקציה ליצירת עוגני קרבה לקבוצה
function createProximityAnchors(group) {
    // יצירת עוגן שמאלי (כחול)
    const leftAnchor = document.createElement('div');
    leftAnchor.className = 'proximity-anchor left-anchor';
    leftAnchor.style.backgroundColor = 'blue';
    
    // יצירת עוגן ימני (כתום)
    const rightAnchor = document.createElement('div');
    rightAnchor.className = 'proximity-anchor right-anchor';
    rightAnchor.style.backgroundColor = 'orange';
    
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

// הגדרת סגנון CSS לעוגנים ולחיבורים
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .proximity-anchor {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            cursor: pointer;
        }
        
        .left-anchor {
            left: -5px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .right-anchor {
            right: -5px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .group-connection {
            position: absolute;
            height: 2px;
            background-color: #333;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
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
                        // אם אין עדיין חיבור בין הקבוצות
                        const connectionKey = `${group.id}-${otherGroup.id}`;
                        if (!connections[connectionKey]) {
                            // יצירת חיבור חדש
                            connections[connectionKey] = connectGroups(group, otherGroup);
                        } else {
                            // עדכון מיקום החיבור הקיים
                            updateConnectionPosition(connections[connectionKey], group, otherGroup);
                        }
                    }
                    
                    // בדיקת כיוון: משמאל לימין
                    if (detectGroupProximity(otherGroup, group)) {
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
        });
    });
}

// פונקציה לאתחול המערכת
function initGroupConnections() {
    // הוספת סגנונות CSS
    addStyles();
    
    // בחירת כל הקבוצות בדף
    const groups = document.querySelectorAll('.draggable-group');
    
    // הגדרת האזנה לאירועי גרירה
    setupDragListeners(Array.from(groups));
}

// הפעלת האתחול כאשר הדף נטען
document.addEventListener('DOMContentLoaded', initGroupConnections);
