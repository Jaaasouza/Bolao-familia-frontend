// USAM World Cup 2026 mark: a green badge with a classic white leather soccer
// ball (black pentagon + hexagon seams) and "2026" in red. Pure SVG so it scales
// crisply and is reused for the header, favicon and the home-screen icon.
//
// Geometry note: the ball is a stylized "telstar" pattern — one central black
// pentagon, five outer black pentagons around the rim, joined by seams. The
// values come from a pentagon laid out on a 100×100 viewBox centered at (50,50).

const CENTER = [[50, 37], [62.36, 45.98], [57.64, 60.52], [42.36, 60.52], [37.64, 45.98]];
const OUTER = [[69.4, 23.3], [81.38, 60.2], [50, 83], [18.62, 60.2], [30.6, 23.3]];
const poly = (pts) => pts.map((p) => p.join(',')).join(' ');

// A small pentagon centered at (x,y) pointing toward the rim (rotation r deg).
function OuterPent({ x, y, r }) {
  const rad = 9;
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = ((i * 72 + r - 90) * Math.PI) / 180;
    pts.push([+(x + rad * Math.cos(a)).toFixed(2), +(y + rad * Math.sin(a)).toFixed(2)]);
  }
  return <polygon points={poly(pts)} fill="#0a1733" />;
}

export default function Logo({ size = 48, withYear = true, title = 'USAM World Cup 2026' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      {/* green badge */}
      <rect x="2" y="2" width="96" height="96" rx="22" fill="#06a77d" />
      <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#lg-shade)" />
      <defs>
        <linearGradient id="lg-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {/* white leather ball */}
      <circle cx="50" cy="50" r="40" fill="#ffffff" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#0a1733" strokeWidth="2" opacity="0.25" />

      {/* central black pentagon */}
      <polygon points={poly(CENTER)} fill="#0a1733" />

      {/* seams from central pentagon vertices out to the outer pentagons */}
      {CENTER.map((c, i) => {
        const o = OUTER[i];
        return <line key={i} x1={c[0]} y1={c[1]} x2={o[0]} y2={o[1]} stroke="#0a1733" strokeWidth="2.4" />;
      })}

      {/* five outer (partial) black pentagons around the rim */}
      {OUTER.map(([x, y], i) => (
        <OuterPent key={i} x={x} y={y} r={i * 72 + 36} />
      ))}

      {/* 2026 in red, on a ribbon across the lower third */}
      {withYear && (
        <g>
          <rect x="14" y="68" width="72" height="20" rx="10" fill="#e63946" />
          <text
            x="50"
            y="82.5"
            textAnchor="middle"
            fontFamily="'Anton','Archivo Black',sans-serif"
            fontSize="16"
            fontWeight="800"
            letterSpacing="1.5"
            fill="#ffffff"
          >2026</text>
        </g>
      )}
    </svg>
  );
}

export { Logo };
