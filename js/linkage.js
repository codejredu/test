<!DOCTYPE html>
<html lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ScratchJr Web</title>
    <link rel="stylesheet" href="css/style.css">
    <!-- הוספת קובץ הסגנונות של מערכת ההצמדה -->
    <link rel="stylesheet" href="css/linkage.css">
</head>
<body>

<div class="container">
    <header>
        <div class="logo">ScratchJr</div>
        <div class="header-icons">
            <div class="icon" id="background-button"><img src="assets/images/background.svg" alt="רקע" class="header-icon-img"></div>
            <div class="icon"><img src="assets/images/save.svg" alt="שמור" class="header-icon-img"></div>
            <div class="icon"><img src="assets/images/new.svg" alt="חדש" class="header-icon-img"></div>
             <div class="icon"><img src="assets/images/add.svg" alt="הוסף" class="header-icon-img"></div>
            <div class="icon"><img src="assets/images/info.svg" alt="מידע" class="header-icon-img"></div>
            <div class="icon" id="grid-toggle"><img src="assets/images/grid.svg" alt="רשת" class="header-icon-img"></div>
        </div>
    </header>

    <main>
        <!-- שאר התוכן כפי שהיה -->
        <div class="stage-container">
            <div id="stage">
                <img id="character" src="assets/images/CAT.svg" alt="Cat" draggable="true">
            </div>
        </div>
        <div class="palette-and-programming">
            <div id="block-palette">
                <div class="category-tabs">
                    <button class="category-tab" data-category="end">
                        <img src="assets/images/end.svg" alt="End">
                    </button>
                    <button class="category-tab" data-category="control">
                        <img src="assets/images/control.svg" alt="Control">
                    </button>
                    <button class="category-tab" data-category="sound">
                        <img src="assets/images/sound.svg" alt="Sound">
                    </button>
                    <button class="category-tab" data-category="looks">
                        <img src="assets/images/looks.svg" alt="Looks">
                    </button>
                    <button class="category-tab" data-category="motion">
                        <img src="assets/images/motion.svg" alt="Motion">
                    </button>
                    <button class="category-tab active" data-category="triggering">
                        <img src="assets/images/triggering.svg" alt="Triggers">
                    </button>
                </div>
                <div id="end-blocks" class="block-category" data-category="end"></div>
                <div id="control-blocks" class="block-category" data-category="control"></div>
                <div id="sound-blocks" class="block-category" data-category="sound"></div>
                <div id="looks-blocks" class="block-category" data-category="looks"></div>
                <div id="motion-blocks" class="block-category" data-category="motion"></div>
                <div id="triggering-blocks" class="block-category active" data-category="triggering"></div>
            </div>

            <div id="programming-area">
                <div class="program-header">Program <span id="clear-all">Clear All</span></div>
                <div id="program-blocks"></div>
            </div>
        </div>
    </main>
</div>

<!-- קודם קבצי JavaScript המקוריים -->
<script src="js/script.js"></script>
<script src="js/background-manager.js"></script>

<!-- לאחר מכן קובץ הקישור החדש -->
<script src="js/linkage.js"></script>
    
</body>
</html>
