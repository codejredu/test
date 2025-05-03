// --- GROUP-CONNECT.JS v1.0.1 --- 
// מודול לחיבור קבוצות בלוקים מחוברות (גרסה מתוקנת לבדיקת אתחול)

(function() {
  'use strict';

  // === הגדרות ===
  const config = {
    debug: true,                       // האם להדפיס הודעות דיבאג בקונסול
    groupConnectThreshold: 45,         // מרחק מרבי (בפיקסלים) לזיהוי אפשרות חיבור קבוצה
    verticalAlignThreshold: 30,        // סף חפיפה אנכית (בפיקסלים) - רחב יותר לקבוצות
    verticalOverlapReq: 0.2,           // דרישת חפיפה אנכית יחסית מינימלית (20%)
    highlightDelay: 10,                // השהייה קטנה לפני הצגת הדגשה
    
    // ערכי היסט פאזל - זהים ל-linkageimproved.js
    puzzleRightBulgeWidth: 10, 
    puzzleLeftSocketWidth: 10,
    verticalCenterOffset: 0,
    
    // כוונון עדין - זהה ל-linkageimproved.js
    horizontalFineTuningLeft: 9,
    horizontalFineTuningRight: -9,
    
    // צבעים מותאמים לחיבור קבוצות
    groupSnapColors: {
      source: '#FF6B35',  // כתום
      target: '#4A90E2'   // כחול
    }
  };

  // === משתני מצב ===
  let potentialSnapInfo = null; // { sourceBlock, targetBlock, direction ('left'/'right') }

  // === פונקציות עזר ===
  
  // הדפסת הודעות דיבאג
  function log(message, data) {
    if (config.debug) {
      if (data !== undefined) {
        console.log(`[GroupConnect] ${message}`, data);
      } else {
        console.log(`[GroupConnect] ${message}`);
      }
    }
  }

  // פונקציה חדשה ליצירת מחוונים עם צבעים מותאמים
  function createColoredHighlight(block, isLeftPoint, color) {
    if (!block) {
      log("Can't create highlight - block is null");
      return null;
    }

    // נסה קודם להסיר הדגשות קיימות
    const existingHighlights = block.querySelectorAll('.connection-highlight');
    existingHighlights.forEach(el => el.remove());
    
    // צור אלמנט הדגשה חדש
    const highlight = document.createElement('div');
    highlight.className = 'connection-highlight';
    
    // הגדר את הסגנון של ההדגשה
    highlight.style.position = 'absolute';
    highlight.style.width = '14px';
    highlight.style.height = '14px';
    highlight.style.borderRadius = '50%';
    highlight.style.backgroundColor = color;
    highlight.style.border = '2px solid white';
    highlight.style.boxShadow = `0 0 12px ${color}`;
    highlight.style.zIndex = '1000';
    highlight.style.opacity = '0';
    highlight.style.transition = 'opacity 0.3s ease-in-out';
    
    // מיקום ההדגשה
    if (isLeftPoint) {
      highlight.style.left = '-7px';
    } else {
      highlight.style.right = '-7px';
    }
    highlight.style.top = '50%';
    highlight.style.transform = 'translateY(-50%)';
    
    // וודא שהבלוק הוא אלמנט בעל relative/absolute positioning
    const computedStyle = window.getComputedStyle(block);
    if (computedStyle.position === 'static') {
      block.style.position = 'relative';
    }
    
    // הוסף את ההדגשה לבלוק
    block.appendChild(highlight);
    
    // הצג את ההדגשה עם אנימציה
    setTimeout(() => {
      highlight.style.opacity = '1';
    }, 50);
    
    // הוסף אנימציית פועם
    const pulseAnimation = highlight.animate([
      { transform: 'translateY(-50%) scale(1)', opacity: 1 },
      { transform: 'translateY(-50%) scale(1.2)', opacity: 0.8 },
      { transform: 'translateY(-50%) scale(1)', opacity: 1 }
    ], {
      duration: 1000,
      iterations: Infinity,
      easing: 'ease-in-out'
    });
    
    log(`Created highlight for block ${block.id} at ${isLeftPoint ? 'left' : 'right'} with color ${color}`);
    
    return highlight;
  }

  // הדגשת נקודות חיבור פוטנציאליות
  function highlightGroupSnapPoints(sourceBlock, targetBlock, direction) {
    log(`Attempting to highlight: ${sourceBlock?.id} -> ${targetBlock?.id} (${direction})`);
    
    // נקה את כל ההדגשות הקיימות
    clearGroupSnapHighlight();
    
    // הצג מיד ללא השהייה
    if (sourceBlock && document.body.contains(sourceBlock) && 
        targetBlock && document.body.contains(targetBlock)) {
      
      const sourceColor = config.groupSnapColors.source;
      const targetColor = config.groupSnapColors.target;
      
      if (direction === 'left') {
        // מקור מתחבר לשמאל של היעד
        createColoredHighlight(sourceBlock, false, sourceColor);  // נקודה ימנית במקור בכתום
        createColoredHighlight(targetBlock, true, targetColor);   // נקודה שמאלית ביעד בכחול
      } else {
        // מקור מתחבר לימין של היעד
        createColoredHighlight(sourceBlock, true, sourceColor);   // נקודה שמאלית במקור בכתום
        createColoredHighlight(targetBlock, false, targetColor);  // נקודה ימנית ביעד בכחול
      }
      
      log(`Successfully highlighted snap points`);
    } else {
      log("Cannot highlight - blocks not valid or not in DOM");
    }
  }

  // ניקוי הדגשות
  function clearGroupSnapHighlight() {
    // נקה הדגשות צבעוניות
    const highlights = document.querySelectorAll('.connection-highlight');
    highlights.forEach(el => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    });
    
    potentialSnapInfo = null;
    log("Cleared all highlights");
  }

  // === בדיקת גרירת קבוצה ===
  function isGroupBeingDragged() {
    // בדיקה פשוטה יותר
    return window.isGroupDragging === true && 
           window.groupBlocks && 
           window.groupBlocks.length > 0;
  }

  // === ליבת הלוגיקה - פשוטה יותר ===
  function checkPotentialGroupSnap() {
    // בדוק אם מתבצעת גרירת קבוצה
    if (!isGroupBeingDragged()) {
      if (potentialSnapInfo) {
        clearGroupSnapHighlight();
      }
      return;
    }

    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;

    // קבל את הבלוקים הנגררים
    const draggedBlocks = window.groupBlocks.filter(b => b && document.body.contains(b));
    if (draggedBlocks.length === 0) return;

    // מצא את בלוק הקצה הימני של הקבוצה הנגררת
    let rightmostDragged = draggedBlocks[0];
    let rightPosition = rightmostDragged.getBoundingClientRect().right;
    
    for (let i = 1; i < draggedBlocks.length; i++) {
      const pos = draggedBlocks[i].getBoundingClientRect().right;
      if (pos > rightPosition) {
        rightPosition = pos;
        rightmostDragged = draggedBlocks[i];
      }
    }

    // מצא את כל הבלוקים שאינם חלק מהקבוצה הנגררת
    const draggedIds = new Set(draggedBlocks.map(b => b.id));
    const allBlocks = Array.from(programArea.querySelectorAll('.block-container'));
    const targetBlocks = allBlocks.filter(b => !draggedIds.has(b.id));

    let closestTarget = null;
    let minDistance = config.groupConnectThreshold + 1;

    // חפש את הבלוק הקרוב ביותר
    for (const targetBlock of targetBlocks) {
      if (!targetBlock || !document.body.contains(targetBlock)) continue;
      
      const targetRect = targetBlock.getBoundingClientRect();
      const draggedRect = rightmostDragged.getBoundingClientRect();
      
      // בדוק מרחק אופקי
      const distance = Math.abs(draggedRect.right - targetRect.left);
      
      // בדוק אם המרחק קטן מהסף
      if (distance < config.groupConnectThreshold) {
        // בדוק חפיפה אנכית
        const topOverlap = Math.max(draggedRect.top, targetRect.top);
        const bottomOverlap = Math.min(draggedRect.bottom, targetRect.bottom);
        const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
        
        if (verticalOverlap > 0 && distance < minDistance) {
          minDistance = distance;
          closestTarget = targetBlock;
        }
      }
    }

    // אם מצאנו מטרה קרובה, הדגש אותה
    if (closestTarget && minDistance < config.groupConnectThreshold) {
      // בדוק אם זה מועמד חדש
      if (!potentialSnapInfo || 
          potentialSnapInfo.sourceBlock.id !== rightmostDragged.id ||
          potentialSnapInfo.targetBlock.id !== closestTarget.id) {
        
        log(`Found snap candidate: ${rightmostDragged.id} -> ${closestTarget.id}`);
        
        potentialSnapInfo = {
          sourceBlock: rightmostDragged,
          targetBlock: closestTarget,
          direction: 'left'
        };
        
        highlightGroupSnapPoints(rightmostDragged, closestTarget, 'left');
      }
    } else {
      // אם אין מועמד, נקה הדגשות
      if (potentialSnapInfo) {
        log("No valid snap candidate found");
        clearGroupSnapHighlight();
      }
    }
  }

  // === מאזיני אירועים ===
  function handleGlobalMouseMove(e) {
    checkPotentialGroupSnap();
  }

  function handleGlobalMouseUp(e) {
    const wasGroupDragging = isGroupBeingDragged();
    const hasSnapCandidate = potentialSnapInfo !== null;

    if (wasGroupDragging && hasSnapCandidate) {
      log("Mouse up with snap candidate - performing snap...");
      // כאן תוסיף את הלוגיקה להצמדה
    }
    
    clearGroupSnapHighlight();
  }

  // === אתחול המודול ===
  function initGroupConnect() {
    log("Initializing group-connect module...");
    
    // הוסף מאזינים
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    // הוסף CSS פעם אחת
    const style = document.createElement('style');
    style.textContent = `
      .connection-highlight {
        pointer-events: none;
        transition: all 0.3s ease-in-out;
      }
    `;
    document.head.appendChild(style);
    
    window.groupConnectInitialized = true;
    log("Group connect module initialized");
  }

  // אתחול מיידי
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGroupConnect);
  } else {
    initGroupConnect();
  }

})();
