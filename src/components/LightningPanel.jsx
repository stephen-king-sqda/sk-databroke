import { LOCATION } from '../config.js';

export default function LightningPanel() {
  const url =
    `https://www.lightningmaps.org/?lang=en` +
    `#m=oss;t=3;s=0;o=0;b=;ts=0;` +
    `y=${LOCATION.latitude};x=${LOCATION.longitude};z=8;d=2;dl=2;dc=0;`;

  return (
    <section className="card lightning">
      <h2>Lightning</h2>
      <p className="muted">
        Real-time lightning strikes from the volunteer{' '}
        <a href="https://www.blitzortung.org/" target="_blank" rel="noreferrer">
          Blitzortung
        </a>{' '}
        network, rendered on{' '}
        <a href="https://www.lightningmaps.org/" target="_blank" rel="noreferrer">
          LightningMaps.org
        </a>
        .
      </p>
      <a className="lightning-button" href={url} target="_blank" rel="noreferrer">
        ⚡ Open live lightning map for {LOCATION.name}
      </a>
      <p className="muted small">
        Their site blocks embedding, so this opens in a new tab.
      </p>
    </section>
  );
}
