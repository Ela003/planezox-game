/**
 * Phase 1 Mission Progression System Design & Master Registry
 * Supports Main Story, Exploration, Combat, Boss, Collection, and Puzzle missions
 * with duplicate-reward prevention and checkpoint save/load definitions.
 */
export const MISSION_TYPES = Object.freeze({
  MAIN_STORY: 'MAIN_STORY',
  EXPLORATION: 'EXPLORATION',
  COMBAT: 'COMBAT',
  BOSS: 'BOSS',
  COLLECTION: 'COLLECTION',
  PUZZLE: 'PUZZLE',
});

export const MISSIONS_DB = [
  { id: 'CH01_M01', chapter: 1, type: MISSION_TYPES.MAIN_STORY, title: 'Evacuate Warmier Settlement', rewardKey: 'rw_ch01_m01', nextMissionId: 'CH01_M02' },
  { id: 'CH01_M02', chapter: 1, type: MISSION_TYPES.COMBAT, title: 'Hold the Forest Line', rewardKey: 'rw_ch01_m02', nextMissionId: 'CH01_M03' },
  { id: 'CH01_M03', chapter: 1, type: MISSION_TYPES.EXPLORATION, title: 'Follow the Hidden Guardian Marker', rewardKey: 'rw_ch01_m03', nextMissionId: 'CH01_M04' },
  { id: 'CH01_M04', chapter: 1, type: MISSION_TYPES.BOSS, title: 'Commander of the Asteroid (Ravok)', rewardKey: 'rw_ch01_m04', nextMissionId: 'CH02_M01' },

  { id: 'CH02_M01', chapter: 2, type: MISSION_TYPES.EXPLORATION, title: 'Signal Beneath the Roots', rewardKey: 'rw_ch02_m01', nextMissionId: 'CH02_M02' },
  { id: 'CH02_M02', chapter: 2, type: MISSION_TYPES.PUZZLE, title: 'Conduit Alignment', rewardKey: 'rw_ch02_m02', nextMissionId: 'CH02_M03' },
  { id: 'CH02_M03', chapter: 2, type: MISSION_TYPES.COMBAT, title: 'Repel Recon Breach', rewardKey: 'rw_ch02_m03', nextMissionId: 'CH03_M01' },

  { id: 'CH03_M01', chapter: 3, type: MISSION_TYPES.EXPLORATION, title: 'Enter the Forgotten Woods', rewardKey: 'rw_ch03_m01', nextMissionId: 'CH03_M02' },
  { id: 'CH03_M02', chapter: 3, type: MISSION_TYPES.PUZZLE, title: 'Seals of the Ancients', rewardKey: 'rw_ch03_m02', nextMissionId: 'CH03_M03' },
  { id: 'CH03_M03', chapter: 3, type: MISSION_TYPES.COLLECTION, title: 'First Energy Fragment', rewardKey: 'rw_ch03_m03', nextMissionId: 'CH04_M01' },

  { id: 'CH04_M01', chapter: 4, type: MISSION_TYPES.COMBAT, title: 'Sandstorm Outpost Raid', rewardKey: 'rw_ch04_m01', nextMissionId: 'CH04_M02' },
  { id: 'CH04_M02', chapter: 4, type: MISSION_TYPES.BOSS, title: 'Phantom of the Dunes (Vexor)', rewardKey: 'rw_ch04_m02', nextMissionId: 'CH05_M01' },

  { id: 'CH05_M01', chapter: 5, type: MISSION_TYPES.PUZZLE, title: 'Frozen Fortress Gate', rewardKey: 'rw_ch05_m01', nextMissionId: 'CH05_M02' },
  { id: 'CH05_M02', chapter: 5, type: MISSION_TYPES.BOSS, title: 'Trial of the Cryo Colossus (Ice Guardian)', rewardKey: 'rw_ch05_m02', nextMissionId: 'CH06_M01' },

  { id: 'CH06_M01', chapter: 6, type: MISSION_TYPES.COMBAT, title: 'Liberate the Subterranean Forum', rewardKey: 'rw_ch06_m01', nextMissionId: 'CH06_M02' },
  { id: 'CH06_M02', chapter: 6, type: MISSION_TYPES.BOSS, title: 'Crucible of Brutax', rewardKey: 'rw_ch06_m02', nextMissionId: 'CH07_M01' },

  { id: 'CH07_M01', chapter: 7, type: MISSION_TYPES.EXPLORATION, title: 'Cross the Energy Bridges', rewardKey: 'rw_ch07_m01', nextMissionId: 'CH07_M02' },
  { id: 'CH07_M02', chapter: 7, type: MISSION_TYPES.BOSS, title: 'Lord of the Stratosphere (Nexar)', rewardKey: 'rw_ch07_m02', nextMissionId: 'CH08_M01' },

  { id: 'CH08_M01', chapter: 8, type: MISSION_TYPES.PUZZLE, title: 'Sanctum Trial Vault', rewardKey: 'rw_ch08_m01', nextMissionId: 'CH08_M02' },
  { id: 'CH08_M02', chapter: 8, type: MISSION_TYPES.COLLECTION, title: "Legacy of Kael's Father", rewardKey: 'rw_ch08_m02', nextMissionId: 'CH09_M01' },

  { id: 'CH09_M01', chapter: 9, type: MISSION_TYPES.MAIN_STORY, title: 'Purge the Corrupted Signal', rewardKey: 'rw_ch09_m01', nextMissionId: 'CH09_M02' },
  { id: 'CH09_M02', chapter: 9, type: MISSION_TYPES.COMBAT, title: 'Last Stand at the Temple', rewardKey: 'rw_ch09_m02', nextMissionId: 'CH10_M01' },

  { id: 'CH10_M01', chapter: 10, type: MISSION_TYPES.COMBAT, title: 'Storm the Core Reactor', rewardKey: 'rw_ch10_m01', nextMissionId: 'CH10_M02' },
  { id: 'CH10_M02', chapter: 10, type: MISSION_TYPES.BOSS, title: 'Gauntlet of the Four Commanders', rewardKey: 'rw_ch10_m02', nextMissionId: 'CH10_M03' },
  { id: 'CH10_M03', chapter: 10, type: MISSION_TYPES.BOSS, title: 'Lord Zyrox & The Eternal Nova', rewardKey: 'rw_ch10_m03', nextMissionId: null },
];
