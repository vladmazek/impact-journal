import { cn } from "@/lib/utils";

type EveningSceneIllustrationProps = {
  className?: string;
};

export function EveningSceneIllustration({ className }: EveningSceneIllustrationProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
      data-testid="evening-scene-illustration"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/15 bg-primary/5 sm:hidden">
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="evening-mobile-glow" cx="0" cy="0" gradientTransform="translate(39 22) rotate(90) scale(18)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE68A" stopOpacity="0.55" />
              <stop offset="1" stopColor="#A78BFA" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="39" cy="22" fill="url(#evening-mobile-glow)" r="18" />
          <path
            d="M42 13C34.6 13.9 28.8 20.2 28.8 27.9C28.8 36 35.3 42.6 43.5 42.6C46.4 42.6 49.1 41.7 51.4 40.2C48.8 45.8 43 49.7 36.2 49.7C26.6 49.7 18.8 41.9 18.8 32.3C18.8 22.4 27 14.3 36.9 14.3C38.7 14.3 40.4 14.7 42 15.2V13Z"
            fill="#FDE68A"
          />
          <path
            d="M12.5 49H51.5"
            stroke="#7C8BA1"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="M18.5 17.5L19.6 20.4L22.5 21.5L19.6 22.6L18.5 25.5L17.4 22.6L14.5 21.5L17.4 20.4L18.5 17.5Z"
            stroke="#A78BFA"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M43.5 12V17M41 14.5H46"
            stroke="#EAB308"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
          <circle cx="28" cy="13.5" fill="#F8FAFC" opacity="0.65" r="1.5" />
        </svg>
      </div>

      <svg
        className="hidden h-[124px] w-[220px] sm:block md:h-[138px] md:w-[260px] lg:h-[152px] lg:w-[320px]"
        fill="none"
        viewBox="0 0 340 176"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="evening-sky-wash" x1="52" x2="302" y1="20" y2="128">
            <stop stopColor="#312E81" stopOpacity="0.22" />
            <stop offset="0.45" stopColor="#7C3AED" stopOpacity="0.18" />
            <stop offset="1" stopColor="#0EA5E9" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="evening-hill-back" x1="60" x2="302" y1="106" y2="152">
            <stop stopColor="#A78BFA" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#60A5FA" stopOpacity="0.18" />
            <stop offset="1" stopColor="#1E293B" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="evening-hill-front" x1="34" x2="290" y1="118" y2="150">
            <stop stopColor="#312E81" stopOpacity="0.22" />
            <stop offset="0.55" stopColor="#7C3AED" stopOpacity="0.14" />
            <stop offset="1" stopColor="#0F172A" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="evening-moon-glow" cx="0" cy="0" gradientTransform="translate(245 55) rotate(90) scale(44)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FEF3C7" stopOpacity="0.55" />
            <stop offset="0.58" stopColor="#A78BFA" stopOpacity="0.18" />
            <stop offset="1" stopColor="#312E81" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M58 34C97 18 143 14 190 18C242 22 285 40 315 71C323 80 328 89 330 98C308 81 280 70 246 68C202 66 166 74 129 84C92 94 62 94 37 86C39 67 45 49 58 34Z"
          fill="url(#evening-sky-wash)"
        />
        <path
          d="M35 145C68 123 100 115 135 118C171 121 200 136 234 141C264 145 287 142 307 136V148H35V145Z"
          fill="url(#evening-hill-front)"
        />
        <path
          d="M68 126C88 112 109 104 137 104C165 104 184 116 206 126C228 136 253 142 280 142H60C61.5 135.5 64.3 130.5 68 126Z"
          fill="url(#evening-hill-back)"
        />
        <circle cx="245" cy="55" fill="url(#evening-moon-glow)" r="44" />
        <circle cx="253" cy="51" fill="#FDE68A" fillOpacity="0.95" r="27" />
        <circle cx="265" cy="45" fill="#131A2C" fillOpacity="0.82" r="24" />

        <path
          className="stroke-foreground/20"
          d="M26 148H314"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <path
          d="M34 148C61 145 88 138 114 124C136 112 155 104 178 104C202 104 220 111 240 124C261 137 286 145 311 148"
          stroke="#7C8BA1"
          strokeOpacity="0.22"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M54 160C86 153 117 152 149 159C179 166 209 166 240 159C264 154 286 153 305 156"
          stroke="#94A3B8"
          strokeOpacity="0.16"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M75 39L78.5 48.5L88 52L78.5 55.5L75 65L71.5 55.5L62 52L71.5 48.5L75 39Z"
          stroke="#A78BFA"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M126 27V35M122 31H130"
          stroke="#FDE68A"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <path
          d="M166 52V58M163 55H169"
          stroke="#F9A8D4"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
        <circle cx="203" cy="35" fill="#FEF3C7" fillOpacity="0.7" r="2.4" />
        <circle cx="102" cy="79" fill="#E2E8F0" fillOpacity="0.45" r="1.8" />
        <circle cx="299" cy="47" fill="#F8FAFC" fillOpacity="0.5" r="2" />
        <circle cx="286" cy="27" fill="#E9D5FF" fillOpacity="0.58" r="1.8" />
        <circle cx="145" cy="43" fill="#F9A8D4" fillOpacity="0.52" r="1.7" />
        <path
          d="M121 93C129 86 138 83 150 83C162 83 171 87 178 94"
          stroke="#60A5FA"
          strokeOpacity="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M275 92L278.5 99.5L286 103L278.5 106.5L275 114L271.5 106.5L264 103L271.5 99.5L275 92Z"
          stroke="#FDE68A"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.75"
          strokeWidth="1.35"
        />
      </svg>
    </div>
  );
}
