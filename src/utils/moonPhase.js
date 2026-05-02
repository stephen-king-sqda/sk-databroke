// Synodic month length and a known new-moon reference (2000-01-06 18:14 UTC).
const SYNODIC = 29.5305882;
const REF = Date.UTC(2000, 0, 6, 18, 14, 0);

export function moonPhaseFraction(date = new Date()) {
  const days = (date.getTime() - REF) / 86400000;
  let phase = (days % SYNODIC) / SYNODIC;
  if (phase < 0) phase += 1;
  return phase;
}

const PHASES = [
  { max: 0.0312, name: 'New Moon',         emoji: '🌑' },
  { max: 0.2188, name: 'Waxing Crescent',  emoji: '🌒' },
  { max: 0.2812, name: 'First Quarter',    emoji: '🌓' },
  { max: 0.4688, name: 'Waxing Gibbous',   emoji: '🌔' },
  { max: 0.5312, name: 'Full Moon',        emoji: '🌕' },
  { max: 0.7188, name: 'Waning Gibbous',   emoji: '🌖' },
  { max: 0.7812, name: 'Last Quarter',     emoji: '🌗' },
  { max: 0.9688, name: 'Waning Crescent',  emoji: '🌘' },
  { max: 1.0001, name: 'New Moon',         emoji: '🌑' },
];

export function moonPhase(date = new Date()) {
  const f = moonPhaseFraction(date);
  const found = PHASES.find((p) => f <= p.max) || PHASES[0];
  return { ...found, fraction: f, illumination: illumination(f) };
}

function illumination(phase) {
  return Math.round(((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100);
}
