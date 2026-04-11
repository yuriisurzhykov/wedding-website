/**
 * Stationery-style botanical corners for the hero (decorative only).
 * Colors come from theme tokens via Tailwind (`currentColor` in SVG).
 */
function BotanicalCornerCluster() {
    return (
        <svg
            className="h-auto w-full"
            viewBox="0 0 220 260"
            xmlns="http://www.w3.org/2000/svg"
            role="presentation"
        >
            <g className="text-secondary">
                <path
                    fill="currentColor"
                    opacity={0.42}
                    d="M0 262c8-72 52-168 132-214 28-16 60-24 92-22C168 42 92 118 52 198c-16 36-24 76-28 116-36-22-36-62-24-52z"
                />
                <path
                    fill="currentColor"
                    opacity={0.36}
                    d="M8 228C32 148 88 72 168 32c-56 44-104 120-120 196-6 28-6 56 0 84-48-32-48-88-40-84z"
                />
                <path
                    fill="currentColor"
                    opacity={0.4}
                    d="M32 248c12-56 56-124 116-164 20-12 42-20 64-22-48 40-92 104-108 168-8 28-8 58 4 86-44-28-56-72-76-68z"
                />
                <path
                    fill="currentColor"
                    opacity={0.34}
                    d="M-8 188c44-24 108-32 156-4-48 16-108 52-140 96-12 18-20 40-24 62-36-36-24-96 8-154z"
                />
                <path
                    fill="currentColor"
                    opacity={0.38}
                    d="M16 148c40-12 96-4 132 24-44 4-100 36-124 76-10 16-18 36-20 56-32-26-24-68 12-156z"
                />
                <path
                    fill="currentColor"
                    opacity={0.33}
                    d="M48 108c34 4 72 28 88 64-36-8-80 8-104 40-8 12-14 28-16 44-28-22-20-58 32-148z"
                />
            </g>
            <g className="text-primary">
                <circle cx={124} cy={88} r={4.5} fill="currentColor" opacity={0.26}/>
                <circle cx={158} cy={122} r={3.5} fill="currentColor" opacity={0.22}/>
                <circle cx={92} cy={158} r={3} fill="currentColor" opacity={0.24}/>
            </g>
            <path
                className="text-accent"
                fill="currentColor"
                opacity={0.12}
                d="M68 200c22-6 48-4 66 10-18 4-42 14-66 6-10-3-8-12 0-16z"
            />
        </svg>
    );
}

export function HeroBotanicalBackdrop() {
    return (
        <div
            aria-hidden
            className="hero-botanical-decor overflow-hidden"
        >
            <div
                className="absolute -left-[12%] -top-[8%] w-[min(46vw,20rem)] text-secondary opacity-[0.42] sm:w-[min(40vw,22rem)]"
            >
                <BotanicalCornerCluster/>
            </div>
            <div
                className="absolute -bottom-[6%] -right-[10%] w-[min(46vw,20rem)] scale-x-[-1] scale-y-[-1] text-secondary opacity-[0.42] sm:-right-[8%] sm:w-[min(40vw,22rem)]"
            >
                <BotanicalCornerCluster/>
            </div>
        </div>
    );
}
