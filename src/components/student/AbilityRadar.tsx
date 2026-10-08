export function AbilityRadar({
  values,
  size = 240,
}: {
  values: [number, number, number, number, number];
  size?: number;
}) {
  const center = size / 2;
  const radius = size * 0.34;
  const labels = [
    ["Tư duy logic", -90],
    ["Giải quyết vấn đề", -18],
    ["Tự chủ học tập", 54],
    ["Kiến thức nền", 126],
    ["Phân tích", 198],
  ] as const;

  const point = (angle: number, scale: number) => {
    const rad = (angle * Math.PI) / 180;
    return [
      center + Math.cos(rad) * radius * scale,
      center + Math.sin(rad) * radius * scale,
    ];
  };

  const polygon = (scales: number[]) =>
    scales
      .map((scale, index) => point(labels[index][1], scale).join(","))
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-auto w-full"
      role="img"
      aria-label="Radar năng lực nhận thức"
    >
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={polygon([scale, scale, scale, scale, scale])}
          fill="none"
          stroke="var(--color-ink-200)"
          strokeWidth="1"
        />
      ))}
      {labels.map(([, angle]) => {
        const [x, y] = point(angle, 1);
        return (
          <line
            key={angle}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="var(--color-ink-200)"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={polygon(values.map((value) => value / 100))}
        fill="color-mix(in oklab, var(--color-brand) 16%, transparent)"
        stroke="var(--color-brand)"
        strokeWidth="2.5"
      />
      {values.map((value, index) => {
        const [x, y] = point(labels[index][1], value / 100);
        return <circle key={labels[index][0]} cx={x} cy={y} r="4" fill="var(--color-brand)" />;
      })}
      <circle cx={center} cy={center} r="4" fill="var(--color-accent)" />
    </svg>
  );
}
