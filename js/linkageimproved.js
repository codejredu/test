// --- INSIDE handleDrop function in script.js ---

// (Previous code for finding block definition...)

            // יצירת בלוק חדש והוספתו לאזור התכנות
            const newBlock = createBlockElement(blockDefinition, blockCategory);
            programmingArea.appendChild(newBlock);

            // הוספת מאזין גרירה לבלוק החדש - THIS IS NO LONGER NEEDED
            // remove this -> newBlock.addEventListener("dragstart", ...);

            // מיקום הבלוק החדש
            const rect = programmingArea.getBoundingClientRect();
            newBlock.style.position = "absolute"; // linkageimproved assumes absolute

            // Use offsetWidth/Height AFTER appending might be more reliable
            const blockWidth = newBlock.offsetWidth || 100; // Default fallback size
            const blockHeight = newBlock.offsetHeight || 40; // Default fallback size

            // Calculate position relative to the programming area
            let dropX = event.clientX - rect.left - (blockWidth / 2);
            let dropY = event.clientY - rect.top - (blockHeight / 2);

            // Basic boundary check within programming area
            dropX = Math.max(0, Math.min(dropX, rect.width - blockWidth));
            dropY = Math.max(0, Math.min(dropY, rect.height - blockHeight));

            newBlock.style.left = `${dropX}px`;
            newBlock.style.top = `${dropY}px`;

            // **** ADD THIS LINE: Register the new block with the linkage system ****
            if (window.registerNewBlockForLinkage) {
                window.registerNewBlockForLinkage(newBlock);
            } else {
                 console.error("Linkage system function 'registerNewBlockForLinkage' not found.");
            }

        } catch (e) {
            console.error("Error parsing dropped data:", e);
        }
    } // End of 'else' for creating new block
} // End of handleDrop
