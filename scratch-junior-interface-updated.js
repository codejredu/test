import React, { useState, useRef } from 'react';

// הגדרת צבעים וסמלים עבור קטגוריות הבלוקים
const blockColors = {
  categories: [
    { 
      color: 'bg-yellow-500', 
      icon: '💬', 
      category: 'Looks', 
      blocks: [
        { color: 'bg-yellow-300', icon: '💬', name: 'Say' },
        { color: 'bg-yellow-300', icon: '📈', name: 'Grow' },
        { color: 'bg-yellow-300', icon: '📉', name: 'Shrink' },
        { color: 'bg-yellow-300', icon: '↔️', name: 'Change Size' },
        { color: 'bg-yellow-300', icon: '👻', name: 'Hide/Show' },
        { color: 'bg-yellow-300', icon: '👀', name: 'Look' }
      ]
    },
    { 
      color: 'bg-blue-500', 
      icon: '➡️', 
      category: 'Motion', 
      blocks: [
        { color: 'bg-blue-300', icon: '➡️', name: 'Move Right' },
        { color: 'bg-blue-300', icon: '⬅️', name: 'Move Left' },
        { color: 'bg-blue-300', icon: '⬆️', name: 'Move Up' },
        { color: 'bg-blue-300', icon: '⬇️', name: 'Move Down' },
        { color: 'bg-blue-300', icon: '🔄', name: 'Rotate' },
        { color: 'bg-blue-300', icon: '🔁', name: 'Repeat' },
        { color: 'bg-blue-300', icon: '🦘', name: 'Jump' },
        { color: 'bg-blue-300', icon: '🏠', name: 'Go Home' }
      ]
    },
    { 
      color: 'bg-purple-500', 
      icon: '👤', 
      category: 'Events', 
      blocks: [
        { color: 'bg-purple-300', icon: '🚩', name: 'Flag Click' },
        { color: 'bg-purple-300', icon: '👆', name: 'Touch' },
        { color: 'bg-purple-300', icon: '💥', name: 'Collision' },
        { color: 'bg-purple-300', icon: '📨', name: 'Message' },
        { color: 'bg-purple-300', icon: '✉️', name: 'Send Message' }
      ]
    },
    { 
      color: 'bg-green-500', 
      icon: '🔊', 
      category: 'Sound', 
      blocks: [
        { color: 'bg-green-300', icon: '💥', name: 'Sound Effect' },
        { color: 'bg-green-300', icon: '🔊', name: 'Play Sound' }
      ]
    },
    { 
      color: 'bg-orange-500', 
      icon: '📦', 
      category: 'Control', 
      blocks: [
        { color: 'bg-orange-300', icon: '⏳', name: 'Wait' },
        { color: 'bg-orange-300', icon: '🛑', name: 'Stop' },
        { color: 'bg-orange-300', icon: '🏎️', name: 'Start' },
        { color: 'bg-orange-300', icon: '🔁', name: 'Repeat' },
        { color: 'bg-orange-300', icon: '🏁', name: 'End' },
        { color: 'bg-orange-300', icon: '∞', name: 'Forever' },
        { color: 'bg-orange-300', icon: '📄', name: 'Clone' }
      ]
    },
    { 
      color: 'bg-red-500', 
      icon: '🏁', 
      category: 'End', 
      blocks: [
        { color: 'bg-red-300', icon: '🏁', name: 'Stop All' }
      ]
    }
  ]
};

const ScratchJuniorInterface = () => {
  // מצב פעיל של הקטגוריה הנוכחית
  const [activeCategory, setActiveCategory] = useState(null);
  
  // מערך הבלוקים באזור התכנות עם מיקום X ו-Y
  const [programmingBlocks, setProgrammingBlocks] = useState([]);
  
  // הפניה לאזור התכנות
  const programmingAreaRef = useRef(null);
  
  // מעקב אחרי הבלוק שנגרר כרגע באזור התכנות
  const [draggingBlockIndex, setDraggingBlockIndex] = useState(null);

  // פונקציה להוספת בלוק לאזור התכנות במיקום ספציפי
  const addBlockToProgrammingArea = (block, x, y) => {
    // יצירת מזהה ייחודי לבלוק
    const newBlock = { ...block, posX: x, posY: y, id: Date.now() };
    setProgrammingBlocks([...programmingBlocks, newBlock]);
  };

  // פונקציה להסרת הבלוק האחרון מאזור התכנות
  const removeLastBlock = () => {
    const newBlocks = [...programmingBlocks];
    newBlocks.pop();
    setProgrammingBlocks(newBlocks);
  };

  // פונקציה לעדכון מיקום של בלוק קיים
  const updateBlockPosition = (index, x, y) => {
    const updatedBlocks = [...programmingBlocks];
    updatedBlocks[index] = { ...updatedBlocks[index], posX: x, posY: y };
    setProgrammingBlocks(updatedBlocks);
  };

  // פונקציות עבור גרירה ושחרור של בלוקים חדשים
  const handleDragStart = (e, block) => {
    // שמירת מרכז האלמנט כאופסט לגרירה
    const rect = e.target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
      block,
      offsetX,
      offsetY,
      isNew: true // סימון שזה בלוק חדש
    }));
  };

  // פונקציות עבור גרירה ושחרור של בלוקים קיימים
  const handleExistingBlockDragStart = (e, block, index) => {
    e.stopPropagation();
    
    // שמירת מרכז האלמנט כאופסט לגרירה
    const rect = e.target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
      block,
      offsetX,
      offsetY,
      isNew: false, // סימון שזה בלוק קיים
      index // מיקום במערך
    }));
    
    setDraggingBlockIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggingBlockIndex(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    // חילוץ המידע מהדאטה טרנספר
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const { block, offsetX, offsetY, isNew, index } = data;
    
    // חישוב המיקום המדויק ביחס לאזור התכנות
    const rect = programmingAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - offsetX;
    const y = e.clientY - rect.top - offsetY;
    
    if (isNew) {
      // הוספת בלוק חדש
      addBlockToProgrammingArea(block, x, y);
    } else {
      // עדכון מיקום של בלוק קיים
      updateBlockPosition(index, x, y);
    }
    
    setDraggingBlockIndex(null);
  };

  // הוספת בלוק ע"י לחיצה (בתחתית אזור התכנות)
  const handleBlockClick = (block) => {
    if (programmingAreaRef.current) {
      const rect = programmingAreaRef.current.getBoundingClientRect();
      const lastBlockIndex = programmingBlocks.length - 1;
      
      // אם יש בלוקים, מקם מתחת לאחרון, אחרת בראש האזור
      const y = lastBlockIndex >= 0 
        ? programmingBlocks[lastBlockIndex].posY + 60 
        : 20;
        
      addBlockToProgrammingArea(block, rect.width / 2 - 24, y);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* סרגל כלים עליון */}
      <div className="flex justify-between p-2 bg-white shadow-sm">
        <div className="flex space-x-2">
          <button className="p-2 hover:bg-gray-200 rounded">
            💾
          </button>
          <button className="p-2 hover:bg-gray-200 rounded text-green-500">
            🚩
          </button>
        </div>
      </div>

      {/* אזור תוכן ראשי */}
      <div className="flex flex-grow">
        {/* סרגל צד של דמויות */}
        <div className="w-16 bg-gray-50 p-2 flex flex-col items-center">
          <div className="mb-2 p-2 bg-white rounded shadow">
            <img 
              src="/api/placeholder/50/50" 
              alt="דמות" 
              className="w-10 h-10"
            />
          </div>
          <button className="mt-2 p-2 bg-blue-500 text-white rounded-full">
            ➕
          </button>
        </div>

        {/* אזור הבמה ואזור התכנות */}
        <div className="flex-grow flex flex-col">
          {/* במה */}
          <div className="h-1/2 bg-white m-4 rounded-lg border flex items-center justify-center">
            <div className="text-gray-400">אזור במה</div>
          </div>

          {/* אזור תכנות */}
          <div className="h-1/2 bg-gray-200 m-4 rounded-lg p-2 relative">
            {/* מיכל סלקטורים ובלוקים */}
            <div className="flex flex-col">
              {/* סלקטורי קטגוריות */}
              <div className="flex space-x-1 mb-2 overflow-x-auto">
                {blockColors.categories.map((category, index) => (
                  <div 
                    key={index} 
                    className={`w-12 h-12 ${category.color} rounded flex items-center justify-center cursor-pointer hover:opacity-80 ${activeCategory === category.category ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setActiveCategory(
                      activeCategory === category.category ? null : category.category
                    )}
                  >
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                ))}
              </div>

              {/* תפריח בלוקים */}
              {activeCategory && (
                <div className="rounded bg-white py-2">
                  <div className="flex space-x-4 px-2">
                    {blockColors.categories
                      .find(cat => cat.category === activeCategory)
                      .blocks.map((block, index) => (
                        <div 
                          key={index} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, block)}
                          className={`w-12 h-12 ${block.color} rounded flex items-center justify-center cursor-pointer hover:opacity-80`}
                          onClick={() => handleBlockClick(block)}
                        >
                          <span className="text-2xl">{block.icon}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            {/* סביבת תכנות */}
            <div 
              ref={programmingAreaRef}
              className="mt-2 h-64 bg-white rounded overflow-y-auto p-2 relative"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {programmingBlocks.map((block, index) => (
                <div 
                  key={block.id || index} 
                  draggable
                  onDragStart={(e) => handleExistingBlockDragStart(e, block, index)}
                  onDragEnd={handleDragEnd}
                  className={`w-12 h-12 ${block.color} rounded flex items-center justify-center absolute cursor-move ${draggingBlockIndex === index ? 'opacity-50' : ''}`}
                  style={{ 
                    left: `${block.posX}px`, 
                    top: `${block.posY}px`,
                    zIndex: index,
                    cursor: 'move',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  <span className="text-2xl">{block.icon}</span>
                </div>
              ))}
              
              {/* כפתורי בטל/חזור */}
              <div className="absolute bottom-2 right-2 flex space-x-1 justify-end">
                <button 
                  className="w-12 h-12 bg-blue-300 rounded flex items-center justify-center hover:bg-blue-400"
                  onClick={removeLastBlock}
                >
                  ↩️
                </button>
                <button className="w-12 h-12 bg-blue-300 rounded flex items-center justify-center hover:bg-blue-400">
                  ↪️
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* סרגל צד של דפי פרויקט */}
        <div className="w-16 bg-gray-50 p-2 flex flex-col items-center">
          <div className="mb-2 p-2 bg-white rounded shadow">
            <img 
              src="/api/placeholder/50/50" 
              alt="פרויקט" 
              className="w-10 h-10"
            />
          </div>
          <button className="mt-2 p-2 bg-blue-500 text-white rounded-full">
            ➕
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScratchJuniorInterface;
