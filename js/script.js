// ========================================================================
// הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "התחל עם דגל ירוק",
            color: "yellow",
            type: "startOnGreenFlag",
            icon: "🚩",
        },
        {
            name: "התחל בנגיעה",
            color: "yellow",
            type: "startOnTap",
            icon: "👆",
        },
        {
            name: "התחל בהתנגשות",
            color: "yellow",
            type: "startOnBump",
            icon: "💥",
        },
        {
            name: "שלח הודעה",
            color: "yellow",
            type: "sendMessage",
            icon: "✉️",
        },
        {
            name: "התחל כשמתקבלת הודעה",
            color: "yellow",
            type: "startOnMessage",
            icon: "📩",
        },
    ],
    motion: [
        {
            name: "זוז ימינה",
            color: "#43D3FF",
            type: "moveRight",
            icon: "➡️",
        },
        {
            name: "זוז שמאלה",
            color: "#43D3FF",
            type: "moveLeft",
            icon: "⬅️",
        },
        {
            name: "זוז למעלה",
            color: "#43D3FF",
            type: "moveUp",
            icon: "⬆️",
        },
        {
            name: "זוז למטה",
            color: "#43D3FF",
            type: "moveDown",
            icon: "⬇️",
        },
        {
            name: "הסתובב ימינה",
            color: "#43D3FF",
            type: "turnRight",
            icon: "↩️",
        },
        {
            name: "הסתובב שמאלה",
            color: "#43D3FF",
            type: "turnLeft",
            icon: "↪️",
        },
        {
            name: "קפוץ",
            color: "#43D3FF",
            type: "hop",
            icon: "🤸",
        },
        {
            name: "חזור להתחלה",
            color: "#43D3FF",
            type: "goHome",
            icon: "🏠",
        },
    ],
    looks: [
        {
            name: "אמור",
            color: "purple",
            type: "say",
            icon: "💬",
        },
        {
            name: "גדל",
            color: "purple",
            type: "grow",
            icon: "📈",
        },
        {
            name: "הקטן",
            color: "purple",
            type: "shrink",
            icon: "📉",
        },
        {
            name: "אפס גודל",
            color: "purple",
            type: "resetSize",
            icon: "🔄",
        },
        {
            name: "הסתר",
            color: "purple",
            type: "hide",
            icon: "🙈",
        },
        {
            name: "הצג",
            color: "purple",
            type: "show",
            icon: "👁️",
        },
    ],
    sound: [
        {
            name: "השמע צליל",
            color: "green",
            type: "popSound",
            icon: "🎵",
        },
        {
            name: "נגן הקלטה",
            color: "green",
            type: "playRecordedSound",
            icon: "🎤",
        },
    ],
    control: [
        {
            name: "המתן",
            color: "orange",
            type: "wait",
            icon: "⏱️",
        },
        {
            name: "קבע מהירות
