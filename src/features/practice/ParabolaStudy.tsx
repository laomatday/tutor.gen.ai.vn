/** Shows mathematical consequences only after the student solved the task or opened the last hint. */
export function ParabolaStudy({
  point, graphXs,
}: {
  point: {x:number;y:number};
  graphXs: number[];
}) {
  const coefficient = point.y / (point.x * point.x);
  if (!Number.isFinite(coefficient) || !Number.isFinite(point.x) || point.x === 0) {
    return <p className="mt-3 text-sm text-ink-600">Chưa đủ dữ kiện để dựng đồ thị.</p>;
  }
  const xs = graphXs.length ? graphXs : [point.x, 0, -point.x];
  const maxX = Math.max(1, ...xs.map((x) => Math.abs(x)), Math.abs(point.x));
  const maxY = Math.max(1, ...xs.map((x) => Math.abs(coefficient * x * x)));
  const px = (x: number) => 180 + x / maxX * 146;
  const py = (y: number) => 145 - y / maxY * 116;
  const curve = Array.from({length: 51}, (_, i) => {
    const x = -maxX + (i / 50) * 2 * maxX;
    return (i === 0 ? "M" : "L") + px(x).toFixed(2) + " " + py(coefficient * x * x).toFixed(2);
  }).join(" ");
  const values = xs.map((x) => ({x, y: coefficient * x * x}));
  return (
    <div className="mt-4">
      <svg role="img" aria-label="Đồ thị hàm số parabol qua điểm đã cho" viewBox="0 0 360 290"
        className="w-full rounded-xl bg-surface-page">
        <path d="M10 145 H350 M180 12 V278" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="1.5"/>
        <path d={curve} fill="none" stroke="currentColor" strokeWidth="3" className="text-brand"/>
        <circle cx={px(point.x)} cy={py(point.y)} r="5" className="fill-accent-strong"/>
      </svg>
      <p className="mt-3 text-sm font-semibold text-brand">Sau khi giải: y = {coefficient}x²</p>
      <div className="mt-3 max-w-full overflow-x-auto">
        <table className="w-full min-w-72 text-center text-xs">
          <tbody>
            <tr>
              <th scope="row" className="border border-ink-200 bg-ink-50 p-2">x</th>
              {values.map((item, i) => <td key={i} className="border border-ink-200 p-2">{item.x}</td>)}
            </tr>
            <tr>
              <th scope="row" className="border border-ink-200 bg-ink-50 p-2">y</th>
              {values.map((item, i) => <td key={i} className="border border-ink-200 p-2">{item.y}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
