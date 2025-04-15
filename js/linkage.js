/* linkage.css - סגנונות למערכת הצמדת בלוקים 
   גרסה מינימלית שלא תפגע בפונקציונליות הקיימת */

/* סימון בלוק פוטנציאלי לחיבור - הדגשה עדינה */
.potential-connection .scratch-block {
    box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.5) !important;
    transition: box-shadow 0.2s ease-in-out;
}

/* הדגשת החיבור בין בלוקים - ללא שינוי מראה דרמטי */
.block-connected .scratch-block {
    /* הבלטה סמנטית קלה מאוד של בלוקים מחוברים */
    filter: brightness(1.02);
}

/* בלוק עליון שיש מתחתיו בלוק מחובר - הדגשה עדינה */
.has-block-below .scratch-block::after {
    /* הדגשת הבליטה הימנית שדרכה יש חיבור - כמעט בלתי מורגש */
    box-shadow: 0 0 3px rgba(255, 255, 0, 0.3);
}

/* בלוק תחתון שיש מעליו בלוק מחובר - הדגשה עדינה */
.has-block-above .scratch-block::before {
    /* הדגשת השקע השמאלי שדרכו יש חיבור - כמעט בלתי מורגש */
    box-shadow: inset 0 0 3px rgba(255, 255, 0, 0.3);
}

/* ===== אנימציות להצמדה ===== */

/* אנימציה כשבלוק נצמד */
@keyframes snapAnimation {
    0% { transform: scale(1.05); }
    50% { transform: scale(0.98); }
    100% { transform: scale(1); }
}

.just-snapped {
    animation: snapAnimation 0.3s ease-out;
}

/* שיפור התנהגות גרירה */
.block-container {
    user-select: none;
    -webkit-user-drag: none;
    z-index: 1;
}

.block-container.dragging {
    z-index: 100; /* ודא שהבלוק הנגרר תמיד מעל שאר הבלוקים */
    cursor: grabbing !important;
}

/* הסגנון של קו המחבר בין בלוקים מחוברים */
.connection-line {
    position: absolute;
    pointer-events: none; /* הקו לא יפריע לאירועי עכבר */
    background-color: rgba(255, 255, 0, 0.4);
    height: 2px;
    transform-origin: left center;
    transition: opacity 0.2s ease-in-out;
}

/* הסתר קווי חיבור בזמן גרירה אקטיבית, להפחתת הסחות דעת */
.block-container.dragging + .connection-line {
    opacity: 0.2;
}

/* ===== מצבים מיוחדים לבלוקי repeat ===== */

/* בלוק repeat עם בלוק בתוכו */
.block-container[data-type="repeat"].has-inner-block .scratch-block::before {
    box-shadow: inset 0 0 5px rgba(255, 255, 0, 0.5);
}

/* בלוקים שנמצאים בתוך לולאת repeat */
.inside-repeat-block {
    margin-left: 20px; /* הזחה לסימון שהבלוק בתוך לולאה */
}

/* ===== דגשים והנחיות ויזואליות ===== */

/* סימון אזור שאליו אפשר לגרור בלוק בתוך repeat */
.repeat-drop-zone {
    background-color: rgba(255, 255, 0, 0.1);
    border: 1px dashed rgba(255, 255, 0, 0.5);
    border-radius: 5px;
}

/* ===== מצבים ספציפיים לקטגוריות בלוקים ===== */

/* בלוקי end - התנהגות הצמדה ספציפית */
.block-container[data-category="end"].block-connected .scratch-block {
    /* אפקט ויזואלי ספציפי לבלוקי end מחוברים */
    filter: brightness(1.1);
}

/* שיפור עיצוב פינים כשבלוקים מחוברים */
.block-connected .scratch-block::after,
.has-block-above .scratch-block::before {
    transition: background-color 0.2s ease;
}
