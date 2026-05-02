export const LOCATION = {
  name: 'Bella Vista, AR',
  region: 'Northwest Arkansas',
  latitude: 36.4814,
  longitude: -94.273,
  timezone: 'America/Chicago',
};

export const UNITS = {
  temperature: 'fahrenheit',
  windSpeed: 'mph',
  precipitation: 'inch',
};

// Ryan Hall, Y'all panel.
// Channel ID resolved from https://www.youtube.com/@RyanHallYall page metadata.
export const RYAN_HALL = {
  enabled: true,
  channelId: 'UCBBsPuUY-8UwkSim4zLXp1w',
  handle: '@RyanHallYall',
  channelUrl: 'https://www.youtube.com/@RyanHallYall',
  // Auto-expand the live embed when an NWS alert with one of these event
  // names is active for the location.
  severeEvents: [
    'Tornado Warning',
    'Tornado Watch',
    'Severe Thunderstorm Warning',
    'Severe Thunderstorm Watch',
    'Flash Flood Warning',
    'Flash Flood Emergency',
    'Special Weather Statement',
  ],
};

