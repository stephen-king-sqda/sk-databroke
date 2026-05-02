export default function Alerts({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <section className="card alerts alerts-clear">
        <h2>Active alerts</h2>
        <p className="muted">No active NWS alerts for this location.</p>
      </section>
    );
  }

  return (
    <section className="card alerts">
      <h2>Active alerts ({alerts.length})</h2>
      <ul className="alert-list">
        {alerts.map((a) => {
          const p = a.properties || {};
          const sev = (p.severity || 'unknown').toLowerCase();
          return (
            <li key={a.id} className={`alert sev-${sev}`}>
              <div className="alert-head">
                <strong>{p.event}</strong>
                <span className="muted small">{p.severity} · {p.urgency}</span>
              </div>
              <div className="muted small">
                {p.effective && new Date(p.effective).toLocaleString()} →{' '}
                {p.expires && new Date(p.expires).toLocaleString()}
              </div>
              <p>{p.headline}</p>
              {p.description && (
                <details>
                  <summary>Details</summary>
                  <pre className="alert-desc">{p.description}</pre>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
