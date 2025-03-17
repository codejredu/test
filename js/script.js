// ========================================================================
// הגדרת בלוקים (Blocks)
// ========================================================================

const blocks = {
    triggering: [
        {
            name: "התחל בדגל ירוק",
            color: "yellow",
            type: "startOnGreenFlag",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                <rect x="5" y="5" width="5" height="30" fill="black"/>
                <polygon points="10,5 35,15 10,25" fill="green"/>
            </svg>`,
        },
        {
            name: "התחל בלחיצה",
            color: "yellow",
            type: "startOnTap",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                <path d="M12,10 L20,5 L28,10 L28,20 C28,25 20,35 20,35 C20,35 12,25 12,20 Z" fill="#FFB347" stroke="black" stroke-width="1.5"/>
                <circle cx="20" cy="15" r="5" fill="white" stroke="black" stroke-width="1.5"/>
            </svg>`,
        },
        {
            name: "התחל בהתנגשות",
            color: "yellow",
            type: "startOnBump",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                <polygon points="5,35 13,20 20,35 27,20 35,35" fill="red" stroke="black" stroke-width="1.5"/>
                <polygon points="20,5 10,15 15,15 5,25 20,25 20,35 35,20 25,20 25,10" fill="orange" stroke="black" stroke-width="1.5"/>
            </svg>`,
        },
        {
            name: "שלח הודעה",
            color: "yellow",
            type: "sendMessage",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                <rect x="5" y="10" width="30" height="20" rx="3" fill="white" stroke="black" stroke-width="1.5"/>
                <line x1="5" y1="15" x2="35" y2="15" stroke="black" stroke-width="1.5"/>
                <polygon points="8,25 15,20 8,15" fill="red"/>
            </svg>`,
        },
        {
            name: "התחל בקבלת הודעה",
            color: "yellow",
            type: "startOnMessage",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                <rect x="5" y="10" width="30" height="20" rx="3" fill="white" stroke="black" stroke-width="1.5"/>
                <line x1="5" y1="15" x2="35" y2="15" stroke="black" stroke-width="1.5"/>
                <polygon points="32,25 25,20 32,15" fill="blue"/>
            </svg>`,
        },
    ],
    motion: [
        {
            name: "זוז ימינה",
            color: "#43D3FF",
            type: "moveRight",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                <polygon points="5,20 25,20 25,10 35,20 25,30 25,20" fill="black"/>
            </svg>`,
        },
        {
            name: "זוז שמאלה",
            color: "#43D3FF",
            type: "moveLeft",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                <polygon points="35,20 15,20 15,10 5,20 15,30 15,20" fill="black"/>
            </svg>`,
        },
        {
            name: "זוז למעלה",
            color: "#43D3FF",
            type: "moveUp",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                <polygon points="20,5 10,25 20,25 20,35 20,25 30,25" fill="black"/>
            </svg>`,
        },
        {
            name: "זוז למטה",
            color: "#43D3FF",
            type: "moveDown",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
                <polygon points="20,35 10,15 20,15
