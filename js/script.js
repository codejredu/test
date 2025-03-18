--- START OF FILE style.css ---
/* style.css */
:root {
    --motion-color: #43D3FF;
    --triggering-color: #FFEC80;
    --looks-color: #D38BD6;
    --sound-color: green;
    --control-color: orange;
    --end-color: red;
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
    filter: invert(100%);
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
    margin-left: 10px;
    background-color: #0D66CA; /* blue background behind programming blocks */
}

.block-category.active {
    display: flex;
    flex-wrap: wrap;
    padding: 10px;
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
    margin-left: 10px;
    font-size: 24px;
    color: #999;
    cursor: pointer;
}

#block-palette .block-container,
#programming-area .block-container {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 4px;
    cursor: pointer;
    background-color: transparent;
}

#block-palette .scratch-block,
#programming-area .scratch-block {
    position: relative;
    width: 85px; /* רוחב מוגדל של הלבנה */
    height: 80px;
    background-color: #ffff00;
    border-radius: 10px;
    display: flex;
    justify-content: center; /* מרכוז אופקי */
    align-items: center; /* מרכוז אנכי */
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

.block-icon-img {
    max-width: 60%; /* הקטנת גודל מקסימלי של האיקון אם צריך */
    max-height: 60%;
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
