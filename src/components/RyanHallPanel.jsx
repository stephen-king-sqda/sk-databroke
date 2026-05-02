import { useEffect, useMemo, useState } from 'react';
import { RYAN_HALL } from '../config.js';

const liveEmbedUrl = (channelId) =>
  `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1`;

export default function RyanHallPanel({ alerts }) {
  if (!RYAN_HALL.enabled) return null;

  // Detect any active alert whose event matches the severe-weather list.
  const triggering = useMemo(() => {
    if (!alerts || alerts.length === 0) return null;
    const set = new Set(RYAN_HALL.severeEvents.map((s) => s.toLowerCase()));
    return alerts.find((a) => {
      const ev = a.properties?.event?.toLowerCase();
      return ev && set.has(ev);
    }) || null;
  }, [alerts]);

  const [expanded, setExpanded] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);

  // When a severe alert appears, auto-open the embed once.
  useEffect(() => {
    if (triggering && !autoOpened) {
      setExpanded(true);
      setAutoOpened(true);
    }
    if (!triggering && autoOpened) {
      // Reset the auto-open guard so the next severe event also pops it.
      setAutoOpened(false);
    }
  }, [triggering, autoOpened]);

  const headerClass = `card ryan-hall ${triggering ? 'ryan-hall-severe' : ''}`;

  return (
    <section className={headerClass}>
      <div className="ryan-hall-head">
        <div>
          <h2>Ryan Hall, Y'all</h2>
          <div className="muted small">
            {triggering
              ? `Severe weather active (${triggering.properties.event}) — livestream recommended`
              : 'Severe weather livestreams covering the Mid-South / Ozarks'}
          </div>
        </div>
        <div className="ryan-hall-actions">
          <button onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Hide live' : 'Watch live'}
          </button>
          <a
            href={RYAN_HALL.channelUrl}
            target="_blank"
            rel="noreferrer"
            className="ryan-hall-link"
          >
            Channel ↗
          </a>
        </div>
      </div>

      {expanded && (
        <div className="ryan-hall-embed">
          <iframe
            title="Ryan Hall, Y'all live stream"
            src={liveEmbedUrl(RYAN_HALL.channelId)}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <p className="muted small">
            If no stream is shown, Ryan isn&apos;t live right now. Visit the channel for recent forecasts.
          </p>
        </div>
      )}
    </section>
  );
}
