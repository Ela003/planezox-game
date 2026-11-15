/**
 * Phase 1 Master Cinematic Sequence Structure
 * Defines all 7 camera shot types, control lock/restore hooks, dialogue subtitle timing,
 * particle triggers, slow-motion time-scale beats, and Skip/Continue flow.
 */
export const CINEMATIC_SHOT_TYPES = Object.freeze({
  WIDE_ESTABLISHING: 'WIDE_ESTABLISHING',
  CLOSE_UP: 'CLOSE_UP',
  OVER_THE_SHOULDER: 'OVER_THE_SHOULDER',
  TRACKING: 'TRACKING',
  CRANE_AERIAL: 'CRANE_AERIAL',
  DRAMATIC_REVEAL: 'DRAMATIC_REVEAL',
  BOSS_INTRODUCTION: 'BOSS_INTRODUCTION',
});

export const CINEMATICS_DB = [
  {
    id: 'CS_01_SPACE_WARMIER',
    chapterNumber: 1,
    locksControls: true,
    allowSkip: true,
    shots: [CINEMATIC_SHOT_TYPES.WIDE_ESTABLISHING, CINEMATIC_SHOT_TYPES.TRACKING],
  },
  {
    id: 'CS_01_ASTEROID_MOTHERSHIP',
    chapterNumber: 1,
    locksControls: true,
    allowSkip: true,
    shots: [CINEMATIC_SHOT_TYPES.CRANE_AERIAL, CINEMATIC_SHOT_TYPES.DRAMATIC_REVEAL, CINEMATIC_SHOT_TYPES.CLOSE_UP],
  },
  {
    id: 'CS_01_RAVOK_INTRO',
    chapterNumber: 1,
    locksControls: true,
    allowSkip: true,
    shots: [CINEMATIC_SHOT_TYPES.BOSS_INTRODUCTION, CINEMATIC_SHOT_TYPES.OVER_THE_SHOULDER],
  },
  {
    id: 'CS_02_MEETING_AETHER',
    chapterNumber: 2,
    locksControls: true,
    allowSkip: true,
    shots: [CINEMATIC_SHOT_TYPES.DRAMATIC_REVEAL, CINEMATIC_SHOT_TYPES.CLOSE_UP],
  },
  {
    id: 'CS_08_FATHER_FLASHBACK',
    chapterNumber: 8,
    locksControls: true,
    allowSkip: true,
    shots: [CINEMATIC_SHOT_TYPES.WIDE_ESTABLISHING, CINEMATIC_SHOT_TYPES.CLOSE_UP, CINEMATIC_SHOT_TYPES.CRANE_AERIAL],
  },
  {
    id: 'CS_09_AETHER_CORRUPTION',
    chapterNumber: 9,
    locksControls: true,
    allowSkip: true,
    shots: [CINEMATIC_SHOT_TYPES.CLOSE_UP, CINEMATIC_SHOT_TYPES.OVER_THE_SHOULDER],
  },
  {
    id: 'CS_10_ETERNAL_NOVA_FINALE',
    chapterNumber: 10,
    locksControls: true,
    allowSkip: false,
    shots: [CINEMATIC_SHOT_TYPES.BOSS_INTRODUCTION, CINEMATIC_SHOT_TYPES.TRACKING, CINEMATIC_SHOT_TYPES.CRANE_AERIAL],
  },
  {
    id: 'CS_10_POST_CREDIT_MULTIVERSE_PHASE_TWO',
    chapterNumber: 10,
    locksControls: true,
    allowSkip: true,
    shots: [CINEMATIC_SHOT_TYPES.DRAMATIC_REVEAL],
    bannerText: 'CYCLOPS EMPIRE – MULTIVERSE INVASION: PHASE TWO ACTIVATED',
  },
];
