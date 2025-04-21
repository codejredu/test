// --- START OF FILE linkageimproved.js ---
(function() {
    'use strict';

    // ================= Configuration =================
    // ... (זהה)
    const SNAP_THRESHOLD = 20;
    const HORIZONTAL_OVERLAP_THRESHOLD = 0.4;
    const SNAP_GAP = 0;
    const LINK_SOUND_SRC = 'assets/sound/link.mp3';
    const DEBUG = true;
    const INDICATOR_CLASS = 'snap-indicator';


    // ================= State Variables =================
    // ... (זהה)
    let programmingArea = null;
    let currentlyDraggedBlock = null;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
    let linkSound = null;
    let programmingAreaRect = null;
    let currentIndicatorTarget = null;
    let observer = null;


    // ================= Logging Helper =================
    // ... (זהה)
    function log(...args) { if (DEBUG) console.log("[LinkageImproved]", ...args); }

    // ================= Utility Functions =================
    // ... (זהה)
    function generateUniqueId(prefix = 'block') { return `${prefix}-${Math.random().toString(36).substring(2, 8)}`; }

    // ================= CSS Injection =================
    // ... (זהה)
    function addIndicatorStyles() { /* ... */ }

    // ================= Core Logic Functions =================
    // findSnapTarget, snapBlocks, updateVisualIndicator - ללא שינוי

    function findSnapTarget(draggedBlock) { /* ... (ללא שינוי מהגרסה הקודמת) ... */ return null; } // Return null for now for clarity
    function snapBlocks(blockToSnap, targetBlock) { /* ... (ללא שינוי) ... */ }
    function updateVisualIndicator(newTarget) { /* ... (ללא שינוי) ... */ }


    // ================= Event Listener Setup =================
    // addBlockListeners, addListenersToExistingBlocks - ללא שינוי

    function addBlockListeners(block) { /* ... (ללא שינוי) ... */ }
    function addListenersToExistingBlocks() { /* ... (ללא שינוי) ... */ }

    // ================= Event Handlers =================

    function handleMouseDown(event) {
        log("[MouseDown] Event triggered on element:", event.target);
        if (event.button !== 0) return; // רק כפתור שמאלי
        const block = event.target.closest('.block-container');
        if (!block || !programmingArea.contains(block) || block.classList.contains('in-palette')) {
            log("[MouseDown] Ignored: Not a valid block in the programming area."); return;
        }
        event.preventDefault(); // מניעת ברירת מחדל

        // אם כבר גוררים משהו, התעלם (למקרה של קליקים כפולים מהירים)
        if (isDragging) return;

        currentlyDraggedBlock = block;
        isDragging = true; // *** סמן שהתחלנו לגרור ***

        // חישוב מיקום והוספת סגנונות
        programmingAreaRect = programmingArea.getBoundingClientRect();
        const blockRect = currentlyDraggedBlock.getBoundingClientRect();
        offsetX = event.clientX - blockRect.left;
        offsetY = event.clientY - blockRect.top;
        currentlyDraggedBlock.style.zIndex = 1000;
        currentlyDraggedBlock.classList.add('block-dragging');

        // *** הוספת מאזינים ל-document רק כשהגרירה מתחילה ***
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        log(`[MouseDown] Start custom drag: ${currentlyDraggedBlock.id}. Added global listeners.`);
    }

    function handleMouseMove(event) {
        // הפונקציה תרוץ רק אם isDragging הוא true (מה שהוגדר ב-mousedown)
        if (!isDragging || !currentlyDraggedBlock) return;

        // אין צורך ב-preventDefault כאן, זה יכול לחסום גלילה

        log("[MouseMove] Event triggered."); // *** הלוג הקריטי לבדיקה ***

        try {
            // עדכון מיקום הבלוק
            if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();
            let newLeft = event.clientX - programmingAreaRect.left - offsetX;
            let newTop = event.clientY - programmingAreaRect.top - offsetY;
            const blockWidth = currentlyDraggedBlock.offsetWidth; const blockHeight = currentlyDraggedBlock.offsetHeight;
            const maxLeft = programmingAreaRect.width - blockWidth; const maxTop = programmingAreaRect.height - blockHeight;
            newLeft = Math.max(0, Math.min(newLeft, maxLeft)); newTop = Math.max(0, Math.min(newTop, maxTop));
            currentlyDraggedBlock.style.left = `${newLeft}px`; currentlyDraggedBlock.style.top = `${newTop}px`;

            // בדיקה והצגת אינדיקטור
            // const potentialTarget = findSnapTarget(currentlyDraggedBlock); // הפעל כשנרצה לבדוק הצמדה
            // updateVisualIndicator(potentialTarget); // הפעל כשנרצה לבדוק הצמדה
        } catch (error) {
            console.error("[LinkageImproved] Error in handleMouseMove:", error);
            // שקול להפסיק את הגרירה במקרה של שגיאה
            // handleMouseUp(); // אפשר לקרוא ישירות לניקוי
        }
    }

    function handleMouseUp(event) {
        // אם לא היינו באמצע גרירה, התעלם (למקרה שהמאזין נשאר בטעות)
        if (!isDragging || !currentlyDraggedBlock) return;

        log(`[MouseUp] Releasing block ${currentlyDraggedBlock.id}. Removing global listeners.`);

        // *** הסרת המאזינים מ-document בסיום הגרירה ***
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // ניקוי סגנונות
        currentlyDraggedBlock.style.zIndex = '';
        currentlyDraggedBlock.classList.remove('block-dragging');
        // updateVisualIndicator(null); // הפעל כשנבדוק אינדיקטור

        // בדיקה והצמדה
        // const snapTarget = findSnapTarget(currentlyDraggedBlock); // הפעל כשנבדוק הצמדה
        // if (snapTarget) { /* ... הצמד והשמע צליל ... */ }
        // else { log(`[MouseUp] No valid snap target found.`); }

        log(`[MouseUp] ----- End MouseUp for ${currentlyDraggedBlock.id} -----`);

        // איפוס משתני מצב
        isDragging = false;
        currentlyDraggedBlock = null;
        programmingAreaRect = null;
    }

    function handleMutations(mutationsList, obs) {
        // (הפונקציה הזו נשארת כפי שהייתה)
        log("[handleMutations] Callback triggered! Mutations count:", mutationsList.length);
        try { /* ... קוד לזיהוי בלוקים חדשים והוספת מאזין mousedown ... */ }
        catch (mutationError) { console.error("[LinkageImproved] Error inside handleMutations callback:", mutationError); }
    }


    // ================= Initialization Function =================
    function initialize() {
        log("Attempting initialization...");
        try {
            programmingArea = document.getElementById("program-blocks");
            if (!programmingArea) { console.error("[LinkageImproved] CRITICAL: Programming area not found!"); return; }
            log("Programming area found.");

            addIndicatorStyles();
            try { /* Audio setup */ } catch (audioError) { /* ... */ }

            // *** לא מוסיפים כאן מאזינים גלובליים ל-mousemove/mouseup ***
            // document.removeEventListener('mousemove', handleMouseMove); // הסרה ליתר ביטחון אם נשארו
            // document.removeEventListener('mouseup', handleMouseUp);   // הסרה ליתר ביטחון אם נשארו
            log("Global mouse listeners will be added dynamically on mousedown.");

            log("Setting up MutationObserver...");
            try { /* MutationObserver setup */ } catch (observerError) { /* ... */ }

            addListenersToExistingBlocks(); // רק מוסיף mousedown לבלוקים קיימים

            log("Block linkage system initialized (Version - Dynamic Listeners)");
            log(`Configuration: Snap Threshold=${SNAP_THRESHOLD}px, Overlap=${HORIZONTAL_OVERLAP_THRESHOLD*100}%, Gap=${SNAP_GAP}px`);
            log("Initialization function finished successfully.");
        } catch (initError) { console.error("[LinkageImproved] CRITICAL ERROR during initialization:", initError); }
    }

    // ================= Start Initialization =================
    // ... (זהה)
    log("Script execution started. Waiting for DOMContentLoaded or initializing if ready.");
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else { log("DOM already loaded, initializing immediately."); initialize(); }

})();
// --- END OF FILE linkageimproved.js ---
