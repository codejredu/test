// ========================================================================
// linkageimproved.js - שיפור גרסה
// ========================================================================
console.log('[Linkage] Script start.');
(function() {
    console.log('[Linkage] IIFE start.');
    let programmingArea = null;
    let nextBlockId = 1;
    let initialized = false;
    let registrationQueue = []; // תור לרישום בלוקים לפני אתחול
    
    function generateUniqueBlockId() {
        return `block-${Date.now()}-${nextBlockId++}`;
    }
    
    function initializeLinkageSystem() {
        console.log("[Linkage] Attempting initialization...");
        try {
            programmingArea = document.getElementById("program-blocks");
            if (!programmingArea) {
                console.warn("[Linkage] WARNING: #program-blocks not found! Will retry later.");
                // הגדרת ניסיון חוזר אחרי חצי שנייה
                setTimeout(initializeLinkageSystem, 500);
                return false;
            } 
            
            console.log("[Linkage] #program-blocks FOUND.");
            programmingArea.style.outline = '2px solid green';
            
            // עיבוד כל הבלוקים שנרשמו לפני האתחול
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
            
            // כאן תוסיף את הלוגיקה של הלינקג'
            console.log(`[Linkage] Successfully registered ${blockElement.id}`);
            
            // עיצוב ויזואלי כדי לראות שהרישום הצליח
            blockElement.style.boxShadow = '0 0 5px blue';
        } catch (e) {
            console.error(`[Linkage] ERROR during registration:`, e);
        }
    }
    
    // האתחול - עם MutationObserver כגיבוי
    function runInitialization() {
        console.log(`[Linkage] Starting initialization. readyState: ${document.readyState}`);
        
        // ניסיון ראשון בהתאם למצב הדף
        if (document.readyState === 'loading') {
            console.log('[Linkage] Adding DOMContentLoaded listener.');
            document.addEventListener('DOMContentLoaded', function() {
                // נסה להתחיל, ואם נכשל, תגדיר MutationObserver
                if (!initializeLinkageSystem()) {
                    setupMutationObserver();
                }
            });
        } else {
            // נסה מיד, אם נכשל תגדיר MutationObserver
            setTimeout(function() {
                if (!initializeLinkageSystem()) {
                    setupMutationObserver();
                }
            }, 100);
        }
    }
    
    // MutationObserver לזיהוי מתי האלמנט מופיע בדף
    function setupMutationObserver() {
        console.log('[Linkage] Setting up MutationObserver to watch for #program-blocks');
        const observer = new MutationObserver(function(mutations) {
            if (document.getElementById('program-blocks')) {
                console.log('[Linkage] #program-blocks found by MutationObserver!');
                observer.disconnect();
                initializeLinkageSystem();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // API פומבי לרישום בלוקים
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
    
    // נסה להתחיל מיד
    runInitialization();
    
    console.log('[Linkage] IIFE completed. System ready.');
})();
console.log('[Linkage] Script end.');
