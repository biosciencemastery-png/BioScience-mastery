// Original decorative illustration. This is a stylized motif, not a teaching diagram.
export function ScienceArt({ compact = false }: { compact?: boolean }) {
  const rungs = Array.from({ length: 28 }, (_, i) => {
    const y = 42 + i * 15;
    const x = 110 * Math.sin(i * 0.26);
    return { y, x, depth: Math.cos(i * 0.26) };
  });
  return (
    <svg
      className={compact ? "science-art compact" : "science-art"}
      viewBox="0 0 520 520"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="260" cy="260" r="230" stroke="currentColor" opacity=".1" />
      <circle
        cx="260"
        cy="260"
        r="183"
        stroke="currentColor"
        strokeDasharray="3 9"
        opacity=".2"
      />
      <ellipse
        cx="260"
        cy="260"
        rx="230"
        ry="86"
        transform="rotate(-35 260 260)"
        stroke="currentColor"
        opacity=".15"
      />
      <path
        d="M260 12V508M12 260H508"
        stroke="currentColor"
        strokeDasharray="2 8"
        opacity=".1"
      />
      <g transform="rotate(28 260 260)">
        {rungs.map(({ x, y, depth }, i) => (
          <g key={i} opacity={0.58 + (depth + 1) * 0.2}>
            <line
              x1={260 - x}
              y1={y}
              x2={260}
              y2={y}
              stroke="#68dcc8"
              strokeWidth="3"
            />
            <line
              x1={260}
              y1={y}
              x2={260 + x}
              y2={y}
              stroke="#9cbbe8"
              strokeWidth="3"
            />
            <circle
              cx={260 - x}
              cy={y}
              r={5.5 + (depth + 1) * 1.3}
              fill="#80e8d3"
            />
            <circle cx={260 + x} cy={y} r={7 - depth} fill="#aacbee" />
            {i < rungs.length - 1 && (
              <>
                <line
                  x1={260 - x}
                  y1={y}
                  x2={260 - rungs[i + 1].x}
                  y2={rungs[i + 1].y}
                  stroke="#80e8d3"
                  strokeWidth="2"
                />
                <line
                  x1={260 + x}
                  y1={y}
                  x2={260 + rungs[i + 1].x}
                  y2={rungs[i + 1].y}
                  stroke="#aacbee"
                  strokeWidth="2"
                />
              </>
            )}
          </g>
        ))}
      </g>
      <g fill="currentColor">
        <circle cx="69" cy="161" r="4" />
        <circle cx="434" cy="388" r="4" />
        <circle cx="398" cy="88" r="3" />
        <circle cx="112" cy="425" r="3" />
      </g>
      <path
        d="M62 161H32M434 388H477M398 88V57"
        stroke="currentColor"
        opacity=".5"
      />
    </svg>
  );
}
