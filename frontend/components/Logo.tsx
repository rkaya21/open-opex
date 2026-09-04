/** open-opex brand mark: a rounded badge with an upward trend line —
 * "continuous improvement / operational excellence". Brand color: teal. */
export default function Logo({
  size = 28,
  withWordmark = true,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="url(#opexBrand)" />
        <path
          d="M8 21l5-5 4 3 7-8"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="11" r="2" fill="white" />
        <defs>
          <linearGradient id="opexBrand" x1="0" y1="0" x2="32" y2="32">
            <stop stopColor="#0d9488" />
            <stop offset="1" stopColor="#0891b2" />
          </linearGradient>
        </defs>
      </svg>
      {withWordmark && (
        <span className="text-lg font-bold tracking-tight text-slate-900">
          open<span className="text-teal-600">opex</span>
        </span>
      )}
    </span>
  );
}
