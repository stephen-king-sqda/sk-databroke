import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tip">
      <div>
        {new Date(p.time).toLocaleString([], {
          weekday: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </div>
      <div>Temp <strong>{p.temp}°</strong> · Feels {p.apparent}°</div>
      <div>Precip prob <strong>{p.pop}%</strong> · {p.precip.toFixed(2)}″</div>
    </div>
  );
}

export default function HourlyForecast({ hourly }) {
  if (!hourly) return null;

  const now = Date.now();
  const data = hourly.time
    .map((t, i) => ({
      time: t,
      ts: new Date(t).getTime(),
      hour: new Date(t).toLocaleTimeString([], { hour: 'numeric' }),
      temp: Math.round(hourly.temperature_2m[i]),
      apparent: Math.round(hourly.apparent_temperature[i]),
      pop: hourly.precipitation_probability[i] ?? 0,
      precip: hourly.precipitation[i] ?? 0,
    }))
    .filter((r) => r.ts >= now - 3600 * 1000)
    .slice(0, 24);

  return (
    <section className="card">
      <h2>Next 24 hours</h2>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--card-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'var(--muted)' }} interval={2} />
            <YAxis
              yAxisId="temp"
              tick={{ fontSize: 11, fill: 'var(--muted)' }}
              domain={['dataMin - 5', 'dataMax + 5']}
              width={40}
            />
            <YAxis
              yAxisId="pop"
              orientation="right"
              tick={{ fontSize: 11, fill: 'var(--muted)' }}
              domain={[0, 100]}
              unit="%"
              width={40}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar yAxisId="pop" dataKey="pop" fill="#4ea1ff" opacity={0.4} barSize={10} />
            <Line yAxisId="temp" dataKey="temp" stroke="#ff8a4c" strokeWidth={2.5} dot={false} />
            <Line
              yAxisId="temp"
              dataKey="apparent"
              stroke="#ffb380"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend muted small">
        <span><span className="lg-swatch" style={{ background: '#ff8a4c' }} /> Temp °F</span>
        <span><span className="lg-swatch" style={{ background: '#ffb380' }} /> Feels like</span>
        <span><span className="lg-swatch" style={{ background: '#4ea1ff' }} /> Precip probability %</span>
      </div>
    </section>
  );
}
