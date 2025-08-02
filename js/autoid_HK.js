// Auto-identification logic for Hong Kong bat species.
// Each species may define ranges for multiple frequency measurements,
// including high, low, knee, heel, start, end, CF start and CF end
// frequencies, plus duration, bandwidth, knee-low time, knee-low bandwidth,
// heel-low bandwidth, knee-heel bandwidth and call type. Edit SPECIES_RULES to
// update values or add new species. Leave any unused range as null for easy
// editing.

export const SPECIES_RULES = [
  {
    sciName: 'Rhinolophus sinicus',
    requirements: {
      freq: {
        high:    { min: 105, max: 110 }, // Highest frequency (kHz)
        low:     { min: 101, max: 105 }, // Lowest frequency (kHz)
        knee:    null,                   // Knee frequency (kHz)
        heel:    null,                   // Heel frequency (kHz)
        start:   null,                   // Start frequency (kHz)
        end:     null,                   // End frequency (kHz)
        cfStart: null,                   // CF start frequency (kHz)
        cfEnd:   null                    // CF end frequency (kHz)
      },
      duration:    { min: 20, max: 35 }, // ms
      bandwidth:   { min: 2, max: 5 },   // kHz
      kneeLowTime: null,                 // ms
      kneeLowBw:   null,                 // kHz
      heelLowBw:   null,                 // kHz
      kneeHeelBw:  null,                 // kHz
      callType:    ['CF']
    }
  },
  {
    sciName: 'Rhinolophus affinis',
    requirements: {
      freq: {
        high:    { min: 86, max: 92 },
        low:     { min: 80, max: 84 },
        knee:    null,
        heel:    null,
        start:   null,
        end:     null,
        cfStart: null,
        cfEnd:   null
      },
      duration:    { min: 20, max: 40 },
      bandwidth:   { min: 2, max: 5 },
      kneeLowTime: null,
      kneeLowBw:   null,
      heelLowBw:   null,
      kneeHeelBw:  null,
      callType:    ['CF']
    }
  },
  {
    sciName: 'Pipistrellus abramus',
    requirements: {
      freq: {
        high:    { min: 48, max: 55 },
        low:     { min: 40, max: 45 },
        knee:    null,
        heel:    null,
        start:   null,
        end:     null,
        cfStart: null,
        cfEnd:   null
      },
      duration:    { min: 5, max: 15 },
      bandwidth:   { min: 10, max: 30 },
      kneeLowTime: null,
      kneeLowBw:   null,
      heelLowBw:   null,
      kneeHeelBw:  null,
      callType:    ['FM', 'FM-QCF']
    }
  },
  {
    sciName: 'Miniopterus pusillus',
    requirements: {
      freq: {
        high:    { min: 58, max: 65 },
        low:     { min: 50, max: 55 },
        knee:    null,
        heel:    null,
        start:   null,
        end:     null,
        cfStart: null,
        cfEnd:   null
      },
      duration:    { min: 4, max: 12 },
      bandwidth:   { min: 15, max: 40 },
      kneeLowTime: null,
      kneeLowBw:   null,
      heelLowBw:   null,
      kneeHeelBw:  null,
      callType:    ['FM', 'FM-QCF']
    }
  }
  // Add more species definitions here as needed
];

function matchRange(value, range) {
  if (!range) return true;
  const { min = -Infinity, max = Infinity } = range;
  return value >= min && value <= max;
}

function matchList(value, list) {
  if (!list || list.length === 0) return true;
  return list.includes(value);
}

export function autoIdHK({
  freqHigh,
  freqLow,
  freqKnee,
  freqHeel,
  freqStart,
  freqEnd,
  freqCfStart,
  freqCfEnd,
  callType,
  duration,
  timeKnee,
  timeLow
}) {
  const bandwidth =
    typeof freqHigh === 'number' && typeof freqLow === 'number'
      ? freqHigh - freqLow
      : undefined;

  const kneeLowTime =
    typeof timeKnee === 'number' && typeof timeLow === 'number'
      ? timeKnee - timeLow
      : undefined;
  const kneeLowBw =
    typeof freqKnee === 'number' && typeof freqLow === 'number'
      ? freqKnee - freqLow
      : undefined;
  const heelLowBw =
    typeof freqHeel === 'number' && typeof freqLow === 'number'
      ? freqHeel - freqLow
      : undefined;
  const kneeHeelBw =
    typeof freqKnee === 'number' && typeof freqHeel === 'number'
      ? freqKnee - freqHeel
      : undefined;

  const matches = SPECIES_RULES.filter(({ requirements }) => {
    const { freq } = requirements;
    return (
      matchRange(freqHigh, freq?.high) &&
      matchRange(freqLow, freq?.low) &&
      matchRange(freqKnee, freq?.knee) &&
      matchRange(freqHeel, freq?.heel) &&
      matchRange(freqStart, freq?.start) &&
      matchRange(freqEnd, freq?.end) &&
      matchRange(freqCfStart, freq?.cfStart) &&
      matchRange(freqCfEnd, freq?.cfEnd) &&
      matchRange(duration, requirements.duration) &&
      matchRange(bandwidth, requirements.bandwidth) &&
      matchRange(kneeLowTime, requirements.kneeLowTime) &&
      matchRange(kneeLowBw, requirements.kneeLowBw) &&
      matchRange(heelLowBw, requirements.heelLowBw) &&
      matchRange(kneeHeelBw, requirements.kneeHeelBw) &&
      matchList(callType, requirements.callType)
    );
  }).map(({ sciName }) => sciName);

  return matches.join(' / ');
}

