// ========================================================================
// הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "דגל ירוק",
            color: "yellow",
            type: "startOnGreenFlag",
            icon: "assets/images/green-flag.svg",
        },
        {
            name: "התחל בלחיצה",
            color: "yellow",
            type: "startOnTap",
            icon: "assets/images/tap.svg",
        },
        {
            name: "התחל בהתנגשות",
            color: "yellow",
            type: "startOnBump",
            icon: "assets/images/bump.svg",
        },
        {
            name: "שלח הודעה",
            color: "yellow",
            type: "sendMessage",
            icon: "assets/images/send-message.svg",
        },
        {
            name: "קבל הודעה",
            color: "yellow",
            type: "startOnMessage",
            icon: "assets/images/receive-message.svg",
        },
    ],
    motion: [
        {
            name: "זוז ימינה",
            color: "#43D3FF",
            type: "moveRight",
            icon: "assets/images/move-right.svg",
        },
        {
            name: "זוז שמאלה",
            color: "#43D3FF",
            type: "moveLeft",
            icon: "assets/images/move-left.svg",
        },
        {
            name: "זוז למעלה",
            color: "#43D3FF",
            type: "moveUp",
            icon: "assets/images/move-up.svg",
        },
        {
            name: "זוז למטה",
            color: "#43D3FF",
            type: "moveDown",
            icon: "assets/images/move-down.svg",
        },
        {
            name: "סובב ימינה",
            color: "#43D3FF",
            type: "turnRight",
            icon: "assets/images/turn-right.svg",
        },
        {
            name: "סובב שמאלה",
            color: "#43D3FF",
            type: "turnLeft",
            icon: "assets/images/turn-left.svg",
        },
        {
            name: "קפוץ",
            color: "#43D3FF",
            type: "hop",
            icon: "assets/images/hop.svg",
        },
        {
            name: "חזור הביתה",
            color: "#43D3FF",
            type: "goHome",
            icon: "assets/images/go-home.svg",
        },
    ],
    looks: [
        {
            name: "אמור",
            color: "purple",
            type: "say",
            icon: "assets/images/say.svg",
        },
        {
            name: "גדל",
            color: "purple",
            type: "grow",
            icon: "assets/images/grow.svg",
        },
        {
            name: "קטן",
            color: "purple",
            type: "shrink",
            icon: "assets/images/shrink.svg",
        },
        {
            name: "חזור לגודל המקורי",
            color: "purple",
            type: "resetSize",
            icon: "assets/images/reset-size.svg",
        },
        {
            name: "הסתר",
            color: "purple",
            type: "hide",
            icon: "assets/images/hide.svg",
        },
        {
            name: "הראה",
            color: "purple",
            type: "show",
            icon: "assets/images/show.svg",
        },
    ],
    sound: [
        {
            name: "השמע צליל",
            color: "green",
            type: "popSound",
            icon: "assets/images/play-sound.svg",
        },
        {
            name: "השמע הקלטה",
            color: "green",
            type: "playRecordedSound",
            icon: "assets/images/play-recording.svg",
        },
    ],
    control: [
        {
            name: "המתן",
            color: "orange
