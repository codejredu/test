// --- START OF FILE linkageimproved.js ---
// (קודם זהה עד findSnapTarget)

    function findSnapTarget(draggedBlock) {
        let bestTarget = null;
        let minDistance = SNAP_THRESHOLD; // e.g., 20

        const draggedRect = draggedBlock.getBoundingClientRect();
        if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();

        const potentialTargets = programmingArea.querySelectorAll('.block-container:not(.block-dragging)');
        log(`[findSnapTarget] Dragging ${draggedBlock.id} (${draggedRect.top.toFixed(0)}). Checking ${potentialTargets.length} targets.`); // לוג מעודכן

        potentialTargets.forEach(potentialTarget => {
            const targetRect = potentialTarget.getBoundingClientRect();
            log(`   [findSnapTarget] Eval: ${potentialTarget.id} (Bottom: ${targetRect.bottom.toFixed(0)})`); // לוג מעודכן

            // 1. Vertical Check
            const verticalDistance = Math.abs(draggedRect.top - (targetRect.bottom + SNAP_GAP));
            log(`      [findSnapTarget] VDist = |${draggedRect.top.toFixed(1)} - ${targetRect.bottom.toFixed(1)}| = ${verticalDistance.toFixed(1)} (Threshold: ${minDistance})`); // לוג מופעל מחדש

            if (verticalDistance < minDistance) {
                log(`      [findSnapTarget] VDist OK. Checking HOverlap...`); // לוג מופעל מחדש

                // 2. Horizontal Check
                const horizontalOverlap = Math.max(0, Math.min(draggedRect.right, targetRect.right) - Math.max(draggedRect.left, targetRect.left));
                const requiredOverlapWidth = Math.min(draggedRect.width, targetRect.width) * HORIZONTAL_OVERLAP_THRESHOLD;
                log(`         [findSnapTarget] HOverlap = ${horizontalOverlap.toFixed(1)}, Required >= ${requiredOverlapWidth.toFixed(1)} (Threshold: ${HORIZONTAL_OVERLAP_THRESHOLD*100}%)`); // לוג מופעל מחדש

                if (horizontalOverlap >= requiredOverlapWidth) {
                    log(`            [findSnapTarget] >>> HOverlap OK. ${potentialTarget.id} is a candidate! <<<`); // לוג מופעל מחדש ומודגש
                    // 3. Compatibility Check (optional)
                    minDistance = verticalDistance; // עדכן את המרחק הטוב ביותר שנמצא
                    bestTarget = potentialTarget; // שמור את המטרה הטובה ביותר
                } else {
                    log(`            [findSnapTarget] HOverlap FAILED for ${potentialTarget.id}.`); // לוג מופעל מחדש
                }
            }
             // else { log(`      [findSnapTarget] VDist too large for ${potentialTarget.id}.`); } // עדיין רועש מדי, נשאיר כהערה
        }); // סוף לולאה

        if (bestTarget) {
             log(`[findSnapTarget] ---> Best target found: ${bestTarget.id} (at VDist ${minDistance.toFixed(1)}) <---`); // לוג מופעל מחדש ומודגש
        } else {
             log("[findSnapTarget] No suitable target found in this pass."); // לוג מופעל מחדש
        }
        return bestTarget;
    }

// ... שאר הקוד זהה ...

// --- END OF FILE linkageimproved.js ---
