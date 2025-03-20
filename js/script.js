/* style.css - עם צבעים מעודכנים לילדי גן */
:root {
    --motion-color: #66D2FF;    /* כחול-תכלת בהיר */
    --triggering-color: #FFE866; /* צהוב בננה רך */
    --looks-color: #D295F6;     /* סגול לבנדר רך */
    --sound-color: #7ED957;     /* ירוק תפוח בהיר */
    --control-color: #FFBD67;   /* כתום אפרסק */
    --end-color: #FF6B6B;       /* אדום קורל רך */
}

body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f0f4ff;
    direction: ltr; /* Make sure direction is LTR */
}

.container {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

header {
    background-color: #fff;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e0e0e0;
}

main {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.stage-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
}

#stage {
    flex: 0 0 auto;
    width: 550px;
    height: 450px;
    background-color: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    position: relative;
    gap: 1px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

#stage::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background: none;
}

#stage.show-grid::before {
    background: none;
}

#stage.show-grid {
  background-image:
    linear-gradient(to right, lightgrey 1px, transparent 1px),
    linear-gradient(to bottom, lightgrey 1px, transparent 1px);
  background-size: 56px 46px; /* Set the size of the grid lines */
  background-position: top left; /* Align the grid to the top left */
}

#character {
    width: 100px;
    height: 100px;
    position: absolute;
    object-fit: contain;
    cursor: grab;
    transition: all 0.1s ease-out;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.palette-and-programming {
    display: flex;
    flex-direction: column;
    flex: 1;
}

#block-palette {
    background-color: #f0f0f0; /* Gray background as requested */
    border: 1px solid #e0e0e0;
    margin: 10px;
    padding: 10px;
    border-radius: 10px;
    height: 105px; /* Fixed height of 114px as requested */
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow: hidden; /* Prevent content from overflowing */
}

.category-tabs {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    margin-bottom: 0;
    height: 100%;
    align-content: flex-start;
    background-color: #f0f0f0; /* Gray background behind tabs */
}

.category-tab {
    border: none;
    padding: 0;
    margin-left: 5px;
    margin-bottom: 5px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 16px;
    color: #000000;
    width: 80px;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
}

.category-tab img {
    max-width: 60%;
    max-height: 60%;
    pointer-events: none;

}

.category-tab[data-category="triggering"] {
    background-color: var(--triggering-color);
}

.category-tab[data-category="motion"] {
    background-color: var(--motion-color);
}

.category-tab[data-category="looks"] {
    background-color: var(--looks-color);
}

.category-tab[data-category="sound"] {
    background-color: var(--sound-color);
}

.category-tab[data-category="control"] {
    background-color: var(--control-color);
}

.category-tab[data-category="end"] {
    background-color: var(--end-color);
}

.block-category {
    display: none;
    padding: 10px;
    flex-grow: 1;
    height: 100%;
    border-right: 1px solid #e0e0e0;
    margin-left: 0px; /* Remove margin-left to align with tabs */
    background-color: #0D66CA; /* blue background behind programming blocks */
}

.block-category.active {
    display: flex;
    flex-wrap: wrap;
    padding: 10px;
    background-color: #0D66CA; /* blue background behind programming blocks */
}

#programming-area {
    background-color: #fff;
    border: 1px solid #e0e0e0;
    margin: 10px;
    padding: 10px;
    border-radius: 10px;
    flex: 2; /* Increased to make programming area taller */
    min-height: 200px; /* Set minimum height */
}

.program-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

#clear-all {
    color: #e74c3c;
    cursor: pointer;
}

#program-blocks {
    min-height: 180px; /* Increased height */
    border: 1px dashed #ccc;
    padding: 10px;
    position: relative;
}

#program-blocks .block-container {
    position: absolute;
}

.logo {
    font-size: 20px;
    font-weight: bold;
    color: #4a90e2;
}

.header-icons {
    display: flex;
}

.icon {
    margin-left: 13px;
    font-size: 24px;
    color: #999;
    cursor: pointer;
}

#block-palette .block-container,
#programming-area .block-container {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 8px;
    cursor: pointer;
    background-color: transparent;
}

#block-palette .scratch-block,
#programming-area .scratch-block {
    position: relative;
    width: 87px;
    height: 80px;
    background-color: #ffff00;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: black;
    font-size: 24px;
    font-weight: bold;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

/* SVG Icon styling */
.block-svg-icon {
    width: 40px;
    height: 40px;
    display: block;
    margin: 0 auto;
}

#block-palette .scratch-block::after,
#programming-area .scratch-block::after {
    content: '';
    position: absolute;
    right: -14px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    background-color: inherit;
    border-radius: 50%;
}

#block-palette .scratch-block::before,
#programming-area .scratch-block::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    background-color: #f0f4ff;
    border-radius: 50%;
}

.block-icon {
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 5px;
}

.block-icon svg {
    width: 200%;
    height: 200%;
}

#triggering-blocks .block-container .scratch-block {
    background-color: var(--triggering-color);
}

#motion-blocks .block-container .scratch-block {
    background-color: var(--motion-color);
}

#looks-blocks .block-container .scratch-block {
    background-color: var(--looks-color);
}

#sound-blocks .block-container .scratch-block {
    background-color: var(--sound-color);
}

#control-blocks .block-container .scratch-block {
    background-color: var(--control-color);
}

#end-blocks .block-container .scratch-block {
    background-color: var(--end-color);
}

#grid-toggle {
    margin-left: 10px;
    font-size: 16px;
    color: #999;
    cursor: pointer;
    border: 1px solid #ccc;
    padding: 5px 10px;
    border-radius: 5px;
}

#grid-toggle:hover {
    background-color: #f0f0f0;
}

/* תיקונים לצבעי הבלוקים בקטגוריה פעילה */
.block-category.active .scratch-block {
    /* הסרת כל צבע סגול שעשוי להיות מוחל */
    background-color: inherit; /* חשוב לוודא שהצבע יורש מההגדרה של הבלוק */
}

/* וידוא שלכל קטגוריה יש את הצבע הנכון כשהיא פעילה */
#triggering-blocks.active .block-container .scratch-block {
    background-color: var(--triggering-color);
}

#motion-blocks.active .block-container .scratch-block {
    background-color: var(--motion-color);
}

#looks-blocks.active .block-container .scratch-block {
    background-color: var(--looks-color);
}

#sound-blocks.active .block-container .scratch-block {
    background-color: var(--sound-color);
}

#control-blocks.active .block-container .scratch-block {
    background-color: var(--control-color);
}

#end-blocks.active .block-container .scratch-block {
    background-color: var(--end-color);
}

/* סגנונות לבלוק REPEAT */
.scratch-block {
    position: relative;
    border-radius: 12px;
    padding: 38px 50px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 24px;
    color: white;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
    min-width: 120px;
    height: 25px;
}

.block-icon-img{
    width: 30px;
    height: 30px;
}

/* בליטה בצד ימין - הבליטה העיקרית של הפאזל */
.right-connector {
    position: absolute;
    right: -15px;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    z-index: 1;
}

/* שקע בצד שמאל - השקע של הפאזל - הוזז 5px ימינה, ללא צל */
.left-connector-wrapper {
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    box-shadow: none;
}

.left-connector {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #f5f5f5;
    border-radius: 50%;
}

/* שקע מלבני בפאה התחתונה - ללא צל */
.bottom-indent {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 90px;
    height: 65px;
    background-color: #f5f5f5;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow: none;
}

/* בליטה בפאה השמאלית של השקע התחתון */
.bottom-left-protrusion {
    position: absolute;
    bottom: 20px;
    left: calc(50% - 55px);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    z-index: 2;
}

/* שקע בפאה הימנית של השקע התחתון - הוזזה לימין + 5px נוספים ימינה, ללא צל */
.bottom-right-indent {
    position: absolute;
    bottom: 20px;
    right: calc(50% - 55px - 5px);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    box-shadow: none;
    z-index: 2;
}

/* חץ מעוגל במקום חץ ישר */
.circular-arrow {
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    width: 20px;
    height: 20px;
}

.circular-arrow svg {
    width: 100%;
    height: 100%;
}

.counter {
    position: absolute;
    right: 15px;
    bottom: 5px;
    background-color: white;
    color: #333;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.2);
}
