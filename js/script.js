--- a/index.html
+++ b/index.html
@@ -101,6 +101,7 @@
 
 #block-palette .block-container,
 #programming-area .block-container {
+    position: relative; /* for tooltip positioning */
     position: relative;
     width: 100px;
     height: 100px;
@@ -203,6 +204,19 @@
 #grid-toggle:hover {
     background-color: #f0f0f0;
 }
+
+/* Tooltip Styles */
+.block-tooltip {
+    position: absolute;
+    bottom: -35px; /* Position below the block */
+    left: 50%;
+    transform: translateX(-50%);
+    background-color: rgba(0, 0, 0, 0.8);
+    color: white;
+    padding: 5px 10px;
+    border-radius: 5px;
+    font-size: 12px;
+    white-space: nowrap; /* Prevent text wrapping */
+}
 --- START OF FILE script.js ---
@@ -25,47 +25,55 @@
         {
             name: "🚩",
             color: "yellow",
+            tooltip: "התחל בדגל ירוק",
             type: "startOnGreenFlag",
             icon: "🚩",
         },
         {
             name: "👆",
             color: "yellow",
+            tooltip: "הקש להתחלה",
             type: "startOnTap",
             icon: "👆",
         },
         {
             name: "💥",
             color: "yellow",
+            tooltip: "התחל בהתנגשות",
             type: "startOnBump",
             icon: "💥",
         },
         {
             name: "✉️",
             color: "yellow",
+            tooltip: "שלח הודעה",
             type: "sendMessage",
             icon: "✉️",
         },
         {
             name: "📩",
             color: "yellow",
+            tooltip: "התחל בקבלת הודעה",
             type: "startOnMessage",
             icon: "📩",
         },
     ],
     motion: [
         {
+            name: "10",
             name: "➡️",
             color: "#43D3FF",
+            tooltip: "זוז ימינה",
             type: "moveRight",
             icon: "➡️",
         },
         {
+            name: "10",
             name: "⬅️",
-            color: "blue",
+            color: "#43D3FF",
+            tooltip: "זוז שמאלה",
             type: "moveLeft",
             icon: "⬅️",
         },
@@ -73,7 +81,8 @@
         {
             name: "⬆️",
             color: "#43D3FF",
-            type: "moveUp",
+            tooltip: "זוז למעלה",
+           type: "moveUp",
             icon: "⬆️",
         },
         {
@@ -87,7 +96,8 @@
         {
             name: "↩️",
             color: "#43D3FF",
-            type: "turnRight",
+            tooltip: "הסתובב ימינה",
+           type: "turnRight",
             icon: "↩️",
         },
         {
@@ -102,21 +112,24 @@
         {
             name: "🤸",
             color: "#43D3FF",
+            tooltip: "קפוץ",
             type: "hop",
             icon: "🤸",
         },
         {
             name: "🏠",
-            color: "blue",
+            color: "#43D3FF",
+            tooltip: "חזור הביתה",
             type: "goHome",
             icon: "🏠",
         },
     ],
     looks: [
         {
-            name: "💬",
+            name: "👁️",
             color: "purple",
             type: "say",
+            tooltip: "אמור",
             icon: "👁️",
         },
         {
@@ -124,6 +137,7 @@
             color: "purple",
             type: "grow",
             icon: "🙈",
+            tooltip: "הגדל",
         },
         {
             name: "📉",
@@ -131,14 +145,16 @@
             color: "purple",
             type: "shrink",
             icon: "🔄",
+            tooltip: "הקטן",
         },
         {
             name: "🔄",
             color: "purple",
             type: "resetSize",
             icon: "📈",
+            tooltip: "אפס גודל",
         },
-        {
+       {
             name: "🙈",
             color: "purple",
             type: "hide",
@@ -147,9 +163,10 @@
         },
         {
             name: "👁️",
-            color: "purple",
+            color: "#D38BD6",
             type: "show",
             icon: "💬",
+            tooltip: "הראה",
         },
     ],
     sound: [
@@ -157,6 +174,7 @@
             name: "🎵",
             color: "green",
             type: "popSound",
+            tooltip: "נגן צליל פופ",
             icon: "🎵",
         },
         {
@@ -164,6 +182,7 @@
             name: "🎤",
             color: "green",
             type: "playRecordedSound",
+            tooltip: "נגן צליל מוקלט",
             icon: "🎤",
         },
     ],
@@ -172,30 +191,35 @@
         {
             name: "⏱️",
             color: "orange",
+            tooltip: "חכה שנייה",
             type: "wait",
             icon: "⏱️",
         },
         {
             name: "⚡",
             color: "orange",
+            tooltip: "קבע מהירות",
             type: "setSpeed",
             icon: "⚡",
         },
         {
             name: "🔁",
             type: "repeat",
+            tooltip: "חזור על הפעולה",
             icon: "🔁",
             color: "orange"
         },
         {
             name: "♾️",
             type: "repeatForever",
+            tooltip: "חזור לנצח",
             icon: "♾️",
             color: "orange"
         },
         {
             name: "🚪",
             color: "orange",
+            tooltip: "עבור לדף",
             type: "goToPage",
             icon: "🚪",
         },
@@ -44,12 +46,14 @@
         {
             name: "🛑",
             color: "red",
+            tooltip: "עצור הכל",
             type: "stop",
             icon: "🛑",
         },
         {
             name: "🏁",
             color: "red",
+            tooltip: "סוף",
             type: "end",
             icon: "🏁",
         },
@@ -51,7 +55,7 @@
 };
 
 // ========================================================================
-// פונקציות ליצירת אלמנטים
+// Functions for creating elements
 // ========================================================================
 
 // פונקציה ליצירת מחבר ימני
@@ -96,12 +100,30 @@
     blockContainer.dataset.type = block.type;
     blockContainer.draggable = true;
 
-    // טיפול באירוע התחלת גרירה (dragstart)
+    // Event handling for drag start
     blockContainer.addEventListener("dragstart", (event) => {
         handleDragStart(event, block, category);
     });
 
+    // Tooltip functionality
+    blockContainer.addEventListener("mouseover", (event) => {
+        const tooltip = document.createElement("div");
+        tooltip.classList.add("block-tooltip");
+        tooltip.textContent = block.tooltip || block.name; // Use tooltip text if available, otherwise use name
+        blockContainer.appendChild(tooltip);
+    });
+
+    blockContainer.addEventListener("mouseout", () => {
+        const tooltip = blockContainer.querySelector(".block-tooltip");
+        if (tooltip) {
+            blockContainer.removeChild(tooltip);
+        }
+    });
+
     return blockContainer;
 }
+
+
 
 // ========================================================================
 // פונקציות טיפול באירועים
@@ -402,3 +424,4 @@
 });
+
