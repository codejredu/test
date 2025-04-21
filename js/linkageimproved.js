// --- linkageimproved_protected_release.js ---

// ... (קוד קודם) ...

  // ========================================================================
  // חישוב מידע הצמדה (מרחק וחפיפה) - עם יותר Debugging
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) {
    const topOverlap = Math.max(sourceRect.top, targetRect.top);
    const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
    const minHeightReq = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;

    // בדיקת חפיפה אנכית
    if (verticalOverlap < minHeightReq || verticalOverlap <= 0) {
      if (CONFIG.DEBUG > 2) console.log(`[CalcInfo] Failed Vertical Overlap: V=${verticalOverlap.toFixed(1)} (Req=${minHeightReq.toFixed(1)})`);
      return null;
    }

    let distance, direction;
    const distRightToLeft = Math.abs(sourceRect.right - targetRect.left); // My right edge to target's left edge
    const distLeftToRight = Math.abs(sourceRect.left - targetRect.right); // My left edge to target's right edge

    // קביעת כיוון הצמדה פוטנציאלי
    if (distRightToLeft < distLeftToRight) {
      distance = distRightToLeft;
      direction = 'left'; // אני אצמד לשמאל המטרה
    } else {
      distance = distLeftToRight;
      direction = 'right'; // אני אצמד לימין המטרה
    }

    if (CONFIG.DEBUG > 1) {
        console.log(`[CalcInfo] Target: ${targetRect.left.toFixed(0)},${targetRect.top.toFixed(0)} | Overlap: V=${verticalOverlap.toFixed(1)} (Req=${minHeightReq.toFixed(1)}) | Dist: H=${distance.toFixed(1)} (Threshold=${CONFIG.CONNECT_THRESHOLD}) | Potential Dir: ${direction}`);
    }

    // החזר מידע רק אם המרחק בטווח
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
       if (CONFIG.DEBUG > 1) console.log(`[CalcInfo] -> SUCCESS: Within threshold.`);
       return { direction, distance };
    } else {
       if (CONFIG.DEBUG > 1) console.log(`[CalcInfo] -> FAILED: Distance too large.`);
       return null;
    }
  }


  // ========================================================================
  // פונקציה לבדיקת קרבה והפעלת חיווי ויזואלי (ב-MouseMove) - עם Debugging
  // ========================================================================
  function checkAndHighlightForVisuals() {
    if (!currentDraggedBlock) return;
    const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null);

    if (CONFIG.DEBUG > 2) console.log(`[Visuals] Checking ${allVisibleBlocks.length} potential targets for ${currentDraggedBlock.id}`);

    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1;

    // Reset visual highlights and visual state
    document.querySelectorAll('.snap-target').forEach(el => { el.classList.remove('snap-target', 'snap-left', 'snap-right'); });
    potentialSnapTargetForVisuals = null;
    snapDirectionForVisuals = null;
    removeFuturePositionIndicator();

    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      if (CONFIG.DEBUG > 2) console.log(`[Visuals] Checking target: ${targetBlock.id}`);
      const targetRect = targetBlock.getBoundingClientRect();
      const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');

      const snapInfo = calculateSnapInfo(sourceRect, targetRect); // בודק קרבה לפי CONNECT_THRESHOLD

      if (snapInfo) {
         let connectionAllowed = true;
         if (snapInfo.direction === 'left' && targetConnectedLeft) {
             connectionAllowed = false;
             if (CONFIG.DEBUG > 1) console.log(`[Visuals] Connection to ${targetBlock.id} (left) blocked: Target already connected on left.`);
         }
         else if (snapInfo.direction === 'right' && targetConnectedRight) {
             connectionAllowed = false;
             if (CONFIG.DEBUG > 1) console.log(`[Visuals] Connection to ${targetBlock.id} (right) blocked: Target already connected on right.`);
         }

         if (connectionAllowed && snapInfo.distance < minDistance) {
             if (CONFIG.DEBUG > 1) console.log(`[Visuals] Found NEW Best Target: ${targetBlock.id}, Dist: ${snapInfo.distance.toFixed(1)} (Old min: ${minDistance.toFixed(1)})`);
             minDistance = snapInfo.distance;
             bestTarget = targetBlock;
             bestDirection = snapInfo.direction;
         } else if (connectionAllowed) {
             if (CONFIG.DEBUG > 2) console.log(`[Visuals] Target ${targetBlock.id} is valid but further (${snapInfo.distance.toFixed(1)}) than current best (${minDistance.toFixed(1)}).`);
         }
      }
    } // End loop

    // After the loop
    if (bestTarget) {
      if (CONFIG.DEBUG) console.log(`[Visuals Loop Result] Best Target: ${bestTarget.id}, Direction: ${bestDirection}, Min Distance: ${minDistance.toFixed(1)}`);
      // עדכון המצב הגלובלי *לחיווי בלבד*
      potentialSnapTargetForVisuals = bestTarget;
      snapDirectionForVisuals = bestDirection;

      // *** הפעל הדגשה צהובה ***
      bestTarget.classList.add('snap-target', bestDirection === 'left' ? 'snap-left' : 'snap-right');
      if (CONFIG.DEBUG) console.log(`[Visuals] --> Applied .snap-target class to ${bestTarget.id}`);

      // הצג מחוון כחול אם קרוב מספיק
      if (minDistance <= CONFIG.INDICATOR_TOUCH_THRESHOLD) {
          if (CONFIG.DEBUG > 1) console.log(`[Visuals] --> Showing blue indicator (dist ${minDistance.toFixed(1)} <= ${CONFIG.INDICATOR_TOUCH_THRESHOLD})`);
          updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programmingArea.getBoundingClientRect());
      } else {
          removeFuturePositionIndicator();
          if (CONFIG.DEBUG > 1) console.log(`[Visuals] --> Hiding blue indicator (dist ${minDistance.toFixed(1)} > ${CONFIG.INDICATOR_TOUCH_THRESHOLD})`);
      }

    } else {
        if (CONFIG.DEBUG) console.log(`[Visuals Loop Result] No suitable target found within threshold.`);
        removeFuturePositionIndicator(); // ודא שהמחוון כבוי
    }
  }

// ... (שאר הקוד ללא שינוי) ...
