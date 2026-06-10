export default function FloorPlan() {
  const W = 760;
  const H = 390;
  const blue = '#2563EB';

  // Left bay section
  const bayRight = 148;
  const bayTop = 28;
  const bayBottom = 372;
  const bayCount = 4;
  const bayH = (bayBottom - bayTop) / bayCount; // ~86px each

  // Upper training stations
  const stLeft = 290;
  const stDepth = 150;
  const stCount = 5;
  const stW = (W - stLeft) / stCount; // ~94px each

  // Gray equipment rectangle
  const gx = 160, gy = 44, gw = 76, gh = 90;

  // XVR simulation room (thick black walls, center-bottom)
  const xvrX = 248, xvrY = 258, xvrW = 248, xvrH = H - xvrY - 4;

  // Debriefing / right-side room
  const drX = 548, drY = 268, drW = W - drX - 4, drH = H - drY - 4;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className="w-full rounded-xl border border-gray-200"
      style={{ background: 'white', maxHeight: 420 }}
    >
      {/* Outer building walls */}
      <rect x={2} y={2} width={W - 4} height={H - 4}
        fill="white" stroke="black" strokeWidth={5} />

      {/* ── LEFT BAY SECTION ── */}
      {/* Right boundary vertical wall */}
      <line x1={bayRight} y1={bayTop} x2={bayRight} y2={bayBottom}
        stroke={blue} strokeWidth={4} />
      {/* Horizontal bay dividers (top, between bays, bottom) */}
      {Array.from({ length: bayCount + 1 }, (_, i) => (
        <line key={`bay${i}`}
          x1={12} y1={bayTop + i * bayH}
          x2={bayRight} y2={bayTop + i * bayH}
          stroke={blue} strokeWidth={4} />
      ))}
      {/* Window symbols on outer left wall */}
      {Array.from({ length: bayCount }, (_, i) => (
        <rect key={`win${i}`}
          x={2} y={bayTop + i * bayH + bayH / 2 - 16}
          width={10} height={32} fill="black" />
      ))}

      {/* ── GRAY EQUIPMENT RECTANGLE ── */}
      <rect x={gx} y={gy} width={gw} height={gh} fill="#ADADAD" />

      {/* ── UPPER TRAINING STATIONS ── */}
      {/* Vertical dividers */}
      {Array.from({ length: stCount + 1 }, (_, i) => (
        <line key={`stv${i}`}
          x1={stLeft + i * stW} y1={2}
          x2={stLeft + i * stW} y2={stDepth}
          stroke={blue} strokeWidth={4} />
      ))}
      {/* Desk / monitor lines at top of each station */}
      {Array.from({ length: stCount }, (_, i) => {
        const sx = stLeft + i * stW + 10;
        const sw = stW - 20;
        return (
          <g key={`desk${i}`}>
            <line x1={sx} y1={22} x2={sx + sw} y2={22} stroke="black" strokeWidth={2.5} />
            <line x1={sx + sw * 0.1} y1={29} x2={sx + sw * 0.9} y2={29} stroke="black" strokeWidth={1.5} />
          </g>
        );
      })}

      {/* ── XVR SIMULATION ROOM (thick walls) ── */}
      <rect x={xvrX} y={xvrY} width={xvrW} height={xvrH}
        fill="white" stroke="black" strokeWidth={7} />
      {/* Door gap on bottom wall (left side) */}
      <line x1={xvrX + 4} y1={H - 2} x2={xvrX + 36} y2={H - 2}
        stroke="white" strokeWidth={11} />
      {/* Door arc (hinge at left, swings into room) */}
      <path d={`M ${xvrX + 36} ${H - 2} A 32 32 0 0 1 ${xvrX + 4} ${H - 34}`}
        fill="none" stroke="black" strokeWidth={1.5} />
      {/* Door gap on right wall */}
      <line x1={xvrX + xvrW} y1={xvrY + 20} x2={xvrX + xvrW} y2={xvrY + 52}
        stroke="white" strokeWidth={11} />
      {/* Door arc (swings right) */}
      <path d={`M ${xvrX + xvrW} ${xvrY + 52} A 32 32 0 0 0 ${xvrX + xvrW + 32} ${xvrY + 20}`}
        fill="none" stroke="black" strokeWidth={1.5} />

      {/* ── DEBRIEFING ROOM ── */}
      <rect x={drX} y={drY} width={drW} height={drH}
        fill="white" stroke="black" strokeWidth={4} />
      {/* Door gap on right outer wall */}
      <line x1={W - 2} y1={drY + 12} x2={W - 2} y2={drY + 44}
        stroke="white" strokeWidth={8} />
      {/* Door arc (swings into room, left) */}
      <path d={`M ${W - 2} ${drY + 44} A 32 32 0 0 1 ${W - 34} ${drY + 12}`}
        fill="none" stroke="black" strokeWidth={1.5} />
    </svg>
  );
}
