// ========================================================================
// linkageimproved.js - גרסה מינימלית שלא פוגעת בגרירה
// ========================================================================
console.log('[Linkage] Script start.');
(function() {
    console.log('[Linkage] IIFE start.');
    let programmingArea = null;
    let nextBlockId = 1;
    let initialized = false;
    let registrationQueue = []; // תור לרישום בלוקים לפני אתחול
    let blockRegistry = {}; // מאגר בלוקים רשומים
    
    function generateUniqueBlockId() {
        return `block-${Date.now()}-${nextBlockId++}`;
    }
    
    function initializeLinkageSystem() {
        console.log("[Linkage] Attempting initialization...");
        try {
            programmingArea = document.getElementById("program-blocks");
            if (!programmingArea) {
                console.warn("[Linkage] WARNING: #program-blocks not found! Will retry later.");
                setTimeout(initializeLinkageSystem, 500);
                return false;
            } 
            
            console.log("[Linkage] #program-blocks FOUND.");
            // שימוש ב-data attribute במקום שינוי ויזואלי
            programmingArea.dataset.linkageActive = "true";
            
            // עיבוד בלוקים שנרשמו לפני האתחול
            if (registrationQueue.length > 0) {
                console.log(`[Linkage] Processing ${registrationQueue.length} queued blocks`);
                registrationQueue.forEach(element => {
                    processBlockRegistration(element);
                });
                registrationQueue = [];
            }
            
            initialized = true;
            console.log("[Linkage] Initialization completed successfully.");
            return true;
        } catch (e) {
            console.error("[Linkage] ERROR during initialization:", e);
            return false;
        }
    }
    
    function processBlockRegistration(blockElement) {
        if (!blockElement) {
            console.error("[Linkage] ERROR: Null element in registration!");
            return;
        }
        
        try {
            if (!blockElement.id) {
                const newId = generateUniqueBlockId();
                console.log(`[Linkage] Assigning ID: ${newId}`);
                blockElement.id = newId;
            } else {
                console.log(`[Linkage] Element has ID: ${blockElement.id}`);
            }
            
            // שמירת הבלוק במאגר במקום שינוי ויזואלי
            blockRegistry[blockElement.id] = {
                element: blockElement,
                type: blockElement.dataset.type,
                category: blockElement.dataset.category,
                registered: new Date().toISOString()
            };
            
            // סימון שהבלוק רשום באמצעות data attribute (לא משנה CSS)
            blockElement.dataset.linkageRegistered = "true";
            
            console.log(`[Linkage] Successfully registered ${blockElement.id}`);
        } catch (e) {
            console.error(`[Linkage] ERROR during registration:`, e);
        }
    }
    
    // האתחול - גרסה פשוטה יותר
    function runInitialization() {
        console.log(`[Linkage] Starting initialization. readyState: ${document.readyState}`);
        
        if (document.readyState === 'loading') {
            console.log('[Linkage] Adding DOMContentLoaded listener.');
            document.addEventListener('DOMContentLoaded', function() {
                // עיכוב קל כדי לוודא שscript.js סיים
                setTimeout(initializeLinkageSystem, 100);
            });
        } else {
            // עיכוב קל גם כאן
            setTimeout(initializeLinkageSystem, 100);
        }
    }
    
    // API פומבי לרישום בלוקים - גרסה פשוטה יותר
    window.registerNewBlockForLinkage = function(newBlockElement) {
        console.log('[Linkage] registerNewBlockForLinkage called:', newBlockElement);
        
        if (!newBlockElement) {
            console.error("[Linkage] ERROR: Called with null element!");
            return;
        }
        
        if (initialized && programmingArea) {
            processBlockRegistration(newBlockElement);
        } else {
            console.log('[Linkage] System not initialized yet, queuing block for later');
            registrationQueue.push(newBlockElement);
        }
    };
    
    // לצורך דיבוג - גישה למאגר הבלוקים
    window.getLinkageRegistry = function() {
        return blockRegistry;
    };
    
    runInitialization();
    
    console.log('[Linkage] IIFE completed. System ready.');
})();
console.log('[Linkage] Script end.');
