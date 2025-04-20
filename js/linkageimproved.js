// ========================================================================
// linkageimproved.js - גרסה מינימלית ביותר עם אפס התערבות
// ========================================================================
console.log('[MinimalLinkage] Script start.');
(function() {
    // שמירת מידע פנימי בלבד - ללא שינויים ב-DOM
    let blockRegistry = {};
    
    // API פומבי - רק רושם לקונסול בלי לשנות שום דבר
    window.registerNewBlockForLinkage = function(newBlockElement) {
        if (!newBlockElement) {
            console.log('[MinimalLinkage] Warning: null element provided');
            return;
        }
        
        // רק רישום ללא שינוי
        console.log('[MinimalLinkage] Block registered:', 
                  newBlockElement.id || '(no id)');
        
        // שמירה במאגר פנימי בלבד - בלי לגעת ב-DOM
        if (newBlockElement.id) {
            blockRegistry[newBlockElement.id] = {
                registeredAt: new Date().toISOString()
            };
        }
    };
    
    // לצורך דיבוג בלבד
    window.getLinkageRegistry = function() {
        return blockRegistry;
    };
    
    console.log('[MinimalLinkage] Registration system ready (no DOM changes).');
})();
