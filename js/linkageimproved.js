// --- START OF FILE linkageimproved.js ---
// (אותו קוד כמו קודם עד לפונקציה findSnapTarget)

    // ================= Snapping Logic & Indicator =================

    function findSnapTarget(draggedBlock) {
        let bestTarget = null;
        let minDistance = SNAP_THRESHOLD; // e.g., 20

        const draggedRect = draggedBlock.getBoundingClientRect();
        if (!programmingAreaRect) programmingAreaRect = programmingArea.getBoundingClientRect();

        // קבל את כל הבלוקים האחרים באזור התכנות
        const potentialTargets = programmingArea.querySelectorAll('.block-container:not(.block-dragging)');
        log(`[findSnapTarget] Dragging ${draggedBlock.id}. Checking ${potentialTargets.length} potential targets.`); // לוג חדש

        potentialTargets.forEach(potentialTarget => {
            const targetRect = potentialTarget.getBoundingClientRect();
            log(`   [findSnapTarget] Evaluating target: ${potentialTarget.id}`); // לוג חדש

            // 1. בדיקה אנכית: מרחק בין החלק העליון של הנגרר לתחתית המטרה
            const verticalDistance = Math.abs(draggedRect.top - (targetRect.bottom + SNAP_GAP));
            log(`      [findSnapTarget] VDist = |${draggedRect.top.toFixed(1)} - (${targetRect.bottom.toFixed(1)} + ${SNAP_GAP})| = ${verticalDistance.toFixed(1)}`); // לוג חדש

            // אם המרחק האנכי קטן מסף הקרבה
            if (verticalDistance < minDistance) {
                log(`      [findSnapTarget] VDist OK (${verticalDistance.toFixed(1)} < ${minDistance}). Checking HOverlap...`); // לוג חדש

                // 2. בדיקה אופקית: חישוב חפיפה
                const horizontalOverlap = Math.max(0, Math.min(draggedRect.right, targetRect.right) - Math.max(draggedRect.left, targetRect.left));
                // חישוב החפיפה המינימלית הנדרשת (אחוז מהרוחב הצר יותר)
                const requiredOverlapWidth = Math.min(draggedRect.width, targetRect.width) * HORIZONTAL_OVERLAP_THRESHOLD;
                log(`         [findSnapTarget] HOverlap = ${horizontalOverlap.toFixed(1)}, Required = ${requiredOverlapWidth.toFixed(1)}`); // לוג חדש

                // אם יש חפיפה אופקית מספקת
                if (horizontalOverlap >= requiredOverlapWidth) {
                    log(`            [findSnapTarget] HOverlap OK. ${potentialTarget.id} is a candidate!`); // לוג חדש
                    // 3. בדיקת תאימות (אופציונלי) - כרגע מאפשרים הכל
                    minDistance = verticalDistance; // עדכן את המרחק המינימלי שנמצא
                    bestTarget = potentialTarget; // שמור את המטרה הטובה ביותר שנמצאה עד כה
                } else {
                    log(`            [findSnapTarget] HOverlap FAILED for ${potentialTarget.id}.`); // לוג חדש
                }
            } else {
                 // אם המרחק האנכי גדול מדי, אין טעם להמשיך לבדוק את הבלוק הזה
                 // log(`      [findSnapTarget] VDist too large for ${potentialTarget.id}.`); // לוג די רועש
            }
        }); // סוף הלולאה על potentialTargets

        if (bestTarget) {
             log(`[findSnapTarget] Best target found: ${bestTarget.id} (at VDist ${minDistance.toFixed(1)})`); // לוג חדש
        } else {
             log("[findSnapTarget] No suitable target found in this pass."); // לוג חדש
        }
        return bestTarget;
    }

    // ... שאר הקוד (snapBlocks, updateVisualIndicator וכו') נשאר זהה ...

// --- END OF FILE linkageimproved.js ---
