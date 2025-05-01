// ===================================================
// GROUP-CONNECT.JS v3.0.0 (DIRECT OVERRIDE)
// ===================================================
// פתרון ישיר שדורס את פונקציות הגרירה והחיבור המקוריות
// ומכריח חיבורים בין קבוצות באמצעות תיקון ישיר של הקוד
// ===================================================

console.log("[GroupFix] הרצת קוד תיקון ישיר עבור חיבור קבוצות");

(function() {
  'use strict';

  // === משתנים גלובליים ===
  let activeGroups = [];           // קבוצות פעילות במסמך
  let draggedGroup = null;         // קבוצה נוכחית בגרירה
  let potentialTarget = null;      // יעד אפשרי לחיבור
  let originals = {};              // שמירת פונקציות מקוריות

  // === זיהוי קבוצות ===
  function findAllGroups() {
    const groups = [];
    const visited = new Set();
    const blocks = document.querySelectorAll('.block-container');

    // עבור על כל הבלוקים
    blocks.forEach(block => {
      if (visited.has(block.id)) return;

      // מצא את כל הבלוקים המחוברים
      const group = findConnectedBlocks(block);
      if (group.length > 1) {
        // מצא את הבלוק המוביל
        const leadBlock = findLeftmostBlock(group);
        
        groups.push({
          blocks: group,
          lead: leadBlock,
          id: leadBlock.id,
          active: false
        });
        
        // סמן את כל הבלוקים בקבוצה כמבוקרים
        group.forEach(b => visited.add(b.id));
      } else {
        // בלוק בודד
        visited.add(block.id);
      }
    });

    return groups;
  }

  // מציאת שמאלי ביותר
  function findLeftmostBlock(blocks) {
    if (!blocks || blocks.length === 0) return null;
    
    let leftmost = blocks[0];
    let leftPosition = leftmost.getBoundingClientRect().left;
    
    for (let i = 1; i < blocks.length; i++) {
      const position = blocks[i].getBoundingClientRect().left;
      if (position < leftPosition) {
        leftPosition = position;
        leftmost = blocks[i];
      }
    }
    
    return leftmost;
  }

  // מציאת ימני ביותר
  function findRightmostBlock(blocks) {
    if (!blocks || blocks.length === 0) return null;
    
    let rightmost = blocks[0];
    let rightPosition = rightmost.getBoundingClientRect().right;
    
    for (let i = 1; i < blocks.length; i++) {
      const position = blocks[i].getBoundingClientRect().right;
      if (position > rightPosition) {
        rightPosition = position;
        rightmost = blocks[i];
      }
    }
    
    return rightmost;
  }

  // מציאת בלוקים מחוברים
  function findConnectedBlocks(startBlock) {
    if (!startBlock) return [];
    
    const result = [startBlock];
    const processed = new Set([startBlock.id]);
    const queue = [startBlock];
    
    while (queue.length > 0) {
      const current = queue.shift();
      const connections = new Set();
      
      // בדוק חיבורים לכיוון ימין
      if (current.hasAttribute('data-connected-to')) {
        connections.add(current.getAttribute('data-connected-to'));
      }
      
      // בדוק חיבורים מכיוון שמאל
      if (current.hasAttribute('data-connected-from-left')) {
        connections.add(current.getAttribute('data-connected-from-left'));
      }
      
      // בדוק חיבורים מכיוון ימין
      if (current.hasAttribute('data-connected-from-right')) {
        connections.add(current.getAttribute('data-connected-from-right'));
      }
      
      // הוסף בלוקים מחוברים לתור
      for (const id of connections) {
        if (!processed.has(id)) {
          const block = document.getElementById(id);
          if (block) {
            result.push(block);
            processed.add(id);
            queue.push(block);
          }
        }
      }
    }
    
    return result;
  }

  // === בדיקת חפיפה אנכית ===
  function hasVerticalOverlap(rect1, rect2) {
    if (!rect1 || !rect2) return false;
    
    const topOverlap = Math.max(rect1.top, rect2.top);
    const bottomOverlap = Math.min(rect1.bottom, rect2.bottom);
    const overlapHeight = bottomOverlap - topOverlap;
    
    if (overlapHeight <= 0) return false;
    
    const minHeight = Math.min(rect1.height, rect2.height);
    return (overlapHeight / minHeight) >= 0.05; // 5% חפיפה מספיק
  }

  // === חיבור ישיר ===
  function connectGroups(sourceGroup, targetGroup) {
    if (!sourceGroup || !targetGroup) return false;
    
    try {
      console.log("[GroupFix] מחבר קבוצות:", sourceGroup.id, "->", targetGroup.id);
      
      // מצא את הבלוקים הקיצוניים
      const sourceRight = findRightmostBlock(sourceGroup.blocks);
      const targetLeft = findLeftmostBlock(targetGroup.blocks);
      
      if (!sourceRight || !targetLeft) return false;
      
      // עדכן את החיבור
      sourceRight.setAttribute('data-connected-to', targetLeft.id);
      sourceRight.setAttribute('data-connection-direction', 'left');
      targetLeft.setAttribute('data-connected-from-left', sourceRight.id);
      
      // סימון הבלוקים כמחוברים
      sourceRight.classList.add('connected-block');
      targetLeft.classList.add('has-connected-block');
      
      // הסר מסגרות
      if (typeof window.removeOutlinesFromConnected === 'function') {
        window.removeOutlinesFromConnected(sourceRight);
        window.removeOutlinesFromConnected(targetLeft);
      } else {
        sourceRight.classList.add('no-outlines');
        targetLeft.classList.add('no-outlines');
      }
      
      // השמע צליל
      if (typeof window.playSnapSound === 'function') {
        window.playSnapSound();
      }
      
      console.log("[GroupFix] חיבור בוצע בהצלחה");
      return true;
    } catch (error) {
      console.error("[GroupFix] שגיאה בחיבור קבוצות:", error);
      return false;
    }
  }

  // == נעילת קבוצות ==
  function updateGroupPositions() {
    // עדכון מיקום של קבוצות
    activeGroups = findAllGroups();
    
    if (activeGroups.length > 1) {
      // בדוק אפשרויות חיבור
      for (let i = 0; i < activeGroups.length; i++) {
        for (let j = 0; j < activeGroups.length; j++) {
          if (i !== j) {
            const group1 = activeGroups[i];
            const group2 = activeGroups[j];
            
            // בדוק אם אפשר לחבר
            const g1Right = findRightmostBlock(group1.blocks);
            const g2Left = findLeftmostBlock(group2.blocks);
            
            const r1 = g1Right.getBoundingClientRect();
            const r2 = g2Left.getBoundingClientRect();
            
            // בדוק מרחק וחפיפה אנכית
            const distance = Math.abs(r1.right - r2.left);
            if (distance < 150 && hasVerticalOverlap(r1, r2)) {
              // קבוצות קרובות מספיק - התכונן לחיבור
              console.log("[GroupFix] קבוצות קרובות:", group1.id, group2.id, "מרחק:", distance.toFixed(1) + "px");
              
              // נסה לבצע חיבור ישיר
              connectGroups(group1, group2);
              
              // רענן את הקבוצות
              setTimeout(() => {
                activeGroups = findAllGroups();
              }, 300);
              
              return;
            }
          }
        }
      }
    }
  }

  // === פונקציית אתחול עם תלות מינימלית ===
  function initialize() {
    console.log("[GroupFix] מאתחל מודול תיקון ישיר");
    
    // עטוף את פונקציית הגרירה המקורית אם קיימת
    if (window.groupDragApi && typeof window.groupDragApi.endDragGroup === 'function') {
      originals.endDragGroup = window.groupDragApi.endDragGroup;
      
      window.groupDragApi.endDragGroup = function() {
        // הפעל את הפונקציה המקורית
        const result = originals.endDragGroup.apply(this, arguments);
        
        // בצע בדיקה של קבוצות לחיבור
        setTimeout(updateGroupPositions, 100);
        
        return result;
      };
      
      console.log("[GroupFix] שונתה פונקציית סיום גרירה");
    }
    
    // המתנה נוספת כדי לוודא טעינה מלאה של הממשק
    setTimeout(function() {
      // עטוף את פונקציית החיבור של בלוקים
      if (typeof window.performBlockSnap === 'function') {
        originals.performBlockSnap = window.performBlockSnap;
        
        window.performBlockSnap = function(sourceBlock, targetBlock, direction) {
          // הפעל את הפונקציה המקורית
          const result = originals.performBlockSnap.apply(this, arguments);
          
          // אם החיבור הצליח
          if (result) {
            console.log("[GroupFix] זוהה חיבור בלוקים:", sourceBlock.id, "->", targetBlock.id);
            
            // בדוק האם הבלוקים שייכים לקבוצות שונות
            setTimeout(updateGroupPositions, 200);
          }
          
          return result;
        };
        
        console.log("[GroupFix] שונתה פונקציית חיבור בלוקים");
      }
    }, 1000);
    
    // אירוע של לחיצת עכבר
    document.addEventListener('mouseup', function() {
      setTimeout(updateGroupPositions, 200);
    });
    
    // תיזמון בדיקה תקופתית
    setInterval(updateGroupPositions, 2000);
    
    console.log("[GroupFix] אתחול הושלם");
  }
  
  // === ריצה ===
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initialize, 1000);
    });
  } else {
    setTimeout(initialize, 500);
  }
  
  // ריצה נוספת כדי להבטיח התקנה
  setTimeout(initialize, 2000);
})();
