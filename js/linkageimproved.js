// --- START OF FILE linkageimproved.js ---
// (קוד קודם...)

    // ================= Block Discovery & Listener Setup =================
    function handleMutations(mutationsList) {
        log("[handleMutations] Detected mutations:", mutationsList.length); // לוג חדש
        for (const mutation of mutationsList) {
            log(`   [handleMutations] Mutation type: ${mutation.type}`); // לוג חדש
            if (mutation.type === 'childList') {
                 log(`   [handleMutations] Added nodes: ${mutation.addedNodes.length}, Removed nodes: ${mutation.removedNodes.length}`); // לוג חדש
                mutation.addedNodes.forEach((node, index) => {
                    log(`      [handleMutations] Checking added node ${index}:`, node); // לוג חדש ומפורט
                    // הדפס מאפיינים חשובים של הצומת
                    if (node.nodeType) log(`         Node type: ${node.nodeType}`);
                    if (node.classList) log(`         Classes: ${JSON.stringify(Array.from(node.classList))}`);
                    if (node.tagName) log(`         Tag name: ${node.tagName}`);

                    // --- תנאי הבדיקה המקורי ---
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('block-container') && !node.classList.contains('in-palette')) {
                        log(`         [handleMutations] Node IS a valid block in area! Adding listener...`); // לוג חדש
                        addBlockListeners(node); // הוסף מאזין mousedown
                    } else {
                         log(`         [handleMutations] Node is NOT a valid block in area (or is in palette). Skipping listener.`); // לוג חדש
                    }
                });
                mutation.removedNodes.forEach(node => {
                     if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('block-container')) {
                         log(`      [handleMutations] Block removed:`, node.id || node.dataset.type);
                         // כאן אפשר להוסיף לוגיקה לניקוי חיבורים אם מימשתם אותה
                     }
                 });
            }
        }
    }

    function addListenersToExistingBlocks() {
        // ... (קודם) ...
    }

    function addBlockListeners(block) {
        if (!block.id) {
            block.id = generateUniqueId(block.dataset.type);
            log(`   [addBlockListeners] Generated ID: ${block.id}`); // הוספתי רווח בהתחלה
        } else {
             log(`   [addBlockListeners] Block already has ID: ${block.id}`); // הוספתי רווח
        }
        block.removeEventListener('mousedown', handleMouseDown); // מניעת כפילות
        block.addEventListener('mousedown', handleMouseDown);
        log(`   [addBlockListeners] Added mousedown listener to ${block.id}`); // הוספתי רווח
    }

    function generateUniqueId(prefix = 'block') {
        // ... (קודם) ...
    }

// ... שאר הקוד של linkageimproved.js ...

// --- END OF FILE linkageimproved.js ---
