// מחלקות וקוד שכבר הוספנו קודם
// (כולל Sprite, Block, Script, ExecutionEngine, BlockLibrary, ProjectManager, AssetLibrary)

// פונקציה ליצירת אזור הציור
function createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.getElementById('canvas-area').appendChild(canvas);
    return canvas.getContext('2d');
}

// פונקציה ליצירת הבלוקים בסרגל הצד
function createBlockCategories() {
    const categories = ['Triggers', 'Motion', 'Looks', 'Sound', 'Control', 'End'];
    const sidebar = document.getElementById('sidebar');
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category;
        button.onclick = () => showBlocksForCategory(category);
        sidebar.appendChild(button);
    });
}

// פונקציה להצגת הבלוקים לפי קטגוריה
function showBlocksForCategory(category) {
    const scriptArea = document.getElementById('script-area');
    scriptArea.innerHTML = '';
    
    Object.keys(BlockLibrary).forEach(blockName => {
        const blockElement = document.createElement('div');
        blockElement.className = 'block';
        blockElement.textContent = blockName;
        blockElement.draggable = true;
        blockElement.ondragstart = drag;
        scriptArea.appendChild(blockElement);
    });
}

// פונקציות גרירה ושחרור
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.textContent);
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    console.log("Block dropped: " + data);
    // כאן נוסיף את הבלוק לסקריפט
}

// אתחול האפליקציה
function init() {
    const ctx = createCanvas();
    createBlockCategories();
    
    const engine = new ExecutionEngine();
    const projectManager = new ProjectManager();

    // הוספת אזור לשחרור בלוקים
    const dropZone = document.createElement('div');
    dropZone.id = 'drop-zone';
    dropZone.ondrop = drop;
    dropZone.ondragover = allowDrop;
    document.getElementById('script-area').appendChild(dropZone);

    // טעינת ספרייטים
    AssetLibrary.sprites.forEach(spriteData => {
        const spriteElement = document.createElement('div');
        spriteElement.className = 'sprite-thumbnail';
        spriteElement.textContent = spriteData.name;
        spriteElement.onclick = () => {
            const sprite = new Sprite(100, 100, spriteData.image);
            engine.addSprite(sprite);
            console.log("Sprite added: " + spriteData.name);
        };
        document.getElementById('sidebar').appendChild(spriteElement);
    });

    // כפתורי שמירה וטעינה
    document.getElementById('saveButton').onclick = () => {
        projectManager.saveProject();
        console.log("Project saved");
    };
    
    document.getElementById('loadButton').onclick = () => {
        projectManager.loadProject();
        console.log("Project loaded");
    };
}

// הפעלת האפליקציה כאשר הדף נטען
window.onload = init;
