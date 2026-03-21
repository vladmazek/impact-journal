import { cn } from "@/lib/utils";

type MorningSceneIllustrationProps = {
  className?: string;
};

export function MorningSceneIllustration({ className }: MorningSceneIllustrationProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
      data-testid="morning-scene-illustration"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/15 bg-primary/5 sm:hidden">
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="morning-mobile-sun" x1="24" x2="40" y1="16" y2="34">
              <stop stopColor="#FEF9C3" />
              <stop offset="1" stopColor="#FBBF24" />
            </linearGradient>
            <linearGradient id="morning-mobile-ground" x1="10" x2="52" y1="46" y2="56">
              <stop stopColor="#7DD3FC" stopOpacity="0.55" />
              <stop offset="1" stopColor="#60A5FA" stopOpacity="0.32" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="25" fill="#E0F2FE" opacity="0.42" r="18" />
          <circle cx="32" cy="25" fill="url(#morning-mobile-sun)" r="10" />
          <path
            d="M32 8V13M20 13L23.5 16.5M44 13L40.5 16.5M16 25H11M53 25H48"
            stroke="#F59E0B"
            strokeLinecap="round"
            strokeWidth="2.25"
          />
          <path
            d="M14 40H50"
            stroke="#7C8BA1"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <path
            d="M12 48C19 43.5 25.5 41.5 31.5 41.5C38.2 41.5 43.7 44 52 48"
            fill="url(#morning-mobile-ground)"
            opacity="0.95"
          />
          <path
            d="M18 44L24 40M46 44L40 40"
            stroke="#38BDF8"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </div>

      <svg
        className="hidden h-[124px] w-[220px] sm:block md:h-[138px] md:w-[260px] lg:h-[152px] lg:w-[320px]"
        fill="none"
        viewBox="0 0 340 176"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="morning-sky-wash" x1="44" x2="304" y1="16" y2="130">
            <stop stopColor="#FEF3C7" stopOpacity="0.45" />
            <stop offset="0.38" stopColor="#BAE6FD" stopOpacity="0.3" />
            <stop offset="1" stopColor="#67E8F9" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="morning-hill-back" x1="66" x2="306" y1="94" y2="152">
            <stop stopColor="#BFDBFE" stopOpacity="0.28" />
            <stop offset="0.56" stopColor="#7DD3FC" stopOpacity="0.24" />
            <stop offset="1" stopColor="#93C5FD" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="morning-hill-front" x1="34" x2="286" y1="108" y2="152">
            <stop stopColor="#FDE68A" stopOpacity="0.22" />
            <stop offset="0.48" stopColor="#A5F3FC" stopOpacity="0.22" />
            <stop offset="1" stopColor="#60A5FA" stopOpacity="0.16" />
          </linearGradient>
          <radialGradient id="morning-sun-glow" cx="0" cy="0" gradientTransform="translate(240 66) rotate(90) scale(54)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF7D6" stopOpacity="0.92" />
            <stop offset="0.45" stopColor="#FDE68A" stopOpacity="0.55" />
            <stop offset="1" stopColor="#93C5FD" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="morning-sun-core" x1="218" x2="258" y1="42" y2="84">
            <stop stopColor="#FEF3C7" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="morning-ridge" x1="104" x2="274" y1="118" y2="118">
            <stop stopColor="#7DD3FC" stopOpacity="0.45" />
            <stop offset="1" stopColor="#FDE68A" stopOpacity="0.28" />
          </linearGradient>
        </defs>
        <path
          d="M50 42C98 20 149 13 204 18C250 22 289 38 316 62C324 70 329 80 331 88C305 75 275 69 238 69C205 69 171 77 138 87C105 97 74 99 44 92C44 73 46 56 50 42Z"
          fill="url(#morning-sky-wash)"
        />
        <path
          d="M58 138C92 116 123 106 157 106C194 106 224 117 259 129C281 136 299 139 318 138H58Z"
          fill="url(#morning-hill-front)"
        />
        <path
          d="M86 124C117 90 151 73 193 73C231 73 268 89 307 124L319 138H76L86 124Z"
          fill="url(#morning-hill-back)"
        />
        <circle cx="240" cy="66" fill="url(#morning-sun-glow)" r="54" />
        <circle cx="240" cy="66" fill="url(#morning-sun-core)" r="28" />

        <path
          d="M108 112H286"
          stroke="url(#morning-ridge)"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M38 140H314"
          stroke="#7C8BA1"
          strokeOpacity="0.24"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <path
          d="M240 16V30M203 28L214 39M276 28L266 39M190 66H204M276 66H290"
          stroke="#F59E0B"
          strokeLinecap="round"
          strokeWidth="1.85"
        />
        <path
          d="M240 18V40M180 38L197 54M300 38L283 54M163 66H181M299 66H317"
          stroke="#FBBF24"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          d="M64 140C95 138 124 131 153 118C174 108 191 101 215 101C239 101 262 110 282 123C294 130 305 136 314 140"
          stroke="#64748B"
          strokeOpacity="0.18"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M52 152C82 147 115 147 147 155C175 162 203 163 233 156C259 150 286 149 306 151"
          stroke="#7C8BA1"
          strokeOpacity="0.22"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M94 100L118 109M128 94L150 104M276 98L293 104"
          stroke="#38BDF8"
          strokeOpacity="0.34"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <path
          d="M84 52C92 46 102 42 115 42"
          stroke="#60A5FA"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <path
          d="M104 68C112 61 122 58 134 58"
          stroke="#22D3EE"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <path
          d="M142 34L150 42M161 28L167 34"
          stroke="#38BDF8"
          strokeOpacity="0.35"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
