// הוספת סגנונות CSS להדגשה ואנימציה (המשך הפונקציה)
    function addHighlightStyles() {
      // יצירת אלמנט style
      const style = document.createElement('style');
      style.textContent = `
        /* הדגשת בלוק מקור (הנגרר) כשקרוב להצמדה */
        .snap-source .block-svg-image,
        .snap-source img {
          filter: brightness(1.05);
          transition: all 0.15s ease-out;
          box-shadow: 0 0 8px 2px rgba(0, 180, 255, 0.6);
        }
        
        /* הדגשת בלוק יעד */
        .snap-target .block-svg-image,
        .snap-target img {
          filter: brightness(1.1);
          transition: all 0.15s ease-out;
          box-shadow: 0 0 8px 2px rgba(255, 255, 0, 0.6);
        }
        
        /* הדגשת השקע השמאלי בבלוק היעד */
        .snap-left::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 18px;
          background-color: rgba(255, 255, 100, 0.8);
          border-radius: 0 3px 3px 0;
          z-index: 10;
        }
        
        /* הדגשת הפין הימני בבלוק היעד */
        .snap-right::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 18px;
          background-color: rgba(255, 255, 100, 0.8);
          border-radius: 3px 0 0 3px;
          z-index: 10;
        }
        
        /* אנימציית הצמדה */
        @keyframes snapEffect {
          0% { transform: scale(1.02); }
          40% { transform: scale(0.98); }
          70% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }
        
        .snap-animation {
          animation: snapEffect 0.3s ease-out;
        }
        
        /* אנימציית ניתוק */
        @keyframes detachEffect {
          0% { transform: scale(1); }
          30% { transform: scale(1.04) rotate(1deg); }
          60% { transform: scale(0.98) rotate(-1deg); }
          100% { transform: scale(1) rotate(0); }
        }
        
        .detach-animation {
          animation: detachEffect 0.3s ease-out;
        }
        
        /* אנימציית פעימה לאינדיקטור החיבור */
        @keyframes pulseIndicator {
          0% { opacity: 0.5; }
          50% { opacity: 0.9; }
          100% { opacity: 0.5; }
        }
        
        /* סימון בלוקים מחוברים */
        .connected-block {
          filter: brightness(1.02);
        }
        
        .has-connected-block {
          position: relative;
        }
        
        /* סימון חיבור ויזואלי - קו דק בין בלוקים מחוברים */
        .connected-block[data-connection-direction="right"]::after,
        .has-connected-block[data-connection-direction="left"]::before {
          content: '';
          position: absolute;
          width: 4px;
          height: 12px;
          background-color: rgba(255, 255, 0, 0.4);
          z-index: 5;
        }
        
        /* עיצוב התפריט הקשר */
        .detach-context-menu {
          min-width: 120px;
          font-family: Arial, sans-serif;
          font-size: 14px;
        }
        
        /* סגנון לאינדיקטור החיבור */
        #connection-indicator {
          transition: all 0.2s ease-out;
        }
      `;
      
      // הוספה לראש המסמך
      document.head.appendChild(style);
    }
    
    // מאזין לכפתור "נקה הכל"
    const clearAllButton = document.getElementById('clear-all');
    if (clearAllButton) {
      clearAllButton.addEventListener('click', function() {
        // ניקוי משתנים גלובליים
        currentDraggedBlock = null;
        potentialSnapTarget = null;
        snapDirection = null;
        lastClickedBlock = null;
        lastRightClickedBlock = null;
        clearAllHighlights();
        removeDetachMenu();
        hideConnectionIndicator();
      });
    }
  }
});
