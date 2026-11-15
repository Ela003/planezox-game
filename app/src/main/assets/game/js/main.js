import * as THREE from 'three';
import { getTerrainHeight, createTerrain } from './terrain.js';
import { createSkyAndLighting } from './skyLighting.js';
import { createForestEnvironment } from './environment.js';
import { createPlayer } from './player.js';
import { createCyclopsSoldiers } from './enemies.js';
import { createRavokBoss } from './boss.js';
import { createChapter1World } from './story.js';
import { ThirdPersonCamera } from './camera.js';
import { GameAudio } from './audio.js';
import {
  WEAPONS,
  GUARDIAN_POWERS,
  unlockPower,
  unlockPowersUpToChapter,
  getWeaponByIndex,
  computeKnockbackVector,
  resolveAttackHit,
  createCombatVfx,
} from './combat.js';

function notifyProgress(percent, message) {
  if (window.AndroidBridge && window.AndroidBridge.onLoadProgress) {
    window.AndroidBridge.onLoadProgress(percent, message);
  }
}

function notifyReady() {
  if (window.AndroidBridge && window.AndroidBridge.onSceneReady) {
    window.AndroidBridge.onSceneReady();
  }
}

function notifyFps(fps) {
  if (window.AndroidBridge && window.AndroidBridge.onFpsUpdate) {
    window.AndroidBridge.onFpsUpdate(fps);
  }
}

function notifyHudState(payload) {
  if (window.AndroidBridge && window.AndroidBridge.onHudStateUpdate) {
    window.AndroidBridge.onHudStateUpdate(JSON.stringify(payload));
  }
}

function notifyEvent(eventType, message) {
  if (window.AndroidBridge && window.AndroidBridge.onGameEvent) {
    window.AndroidBridge.onGameEvent(eventType, message);
  }
}

async function initGame() {
  const canvas = document.getElementById('game-canvas');
  const audio = new GameAudio();

  notifyProgress(14, 'Initializing Warmier WebGL engine...');

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / Math.max(1, window.innerHeight),
    0.2,
    460
  );

  let currentQuality = 'medium';
  let resolutionScale = 1.0;

  function applyResolution() {
    const dpr = window.devicePixelRatio || 1;
    const qualityCap = currentQuality === 'low' ? 0.95 : currentQuality === 'medium' ? 1.3 : 1.7;
    renderer.setPixelRatio(Math.min(dpr, qualityCap) * resolutionScale);
  }

  function handleResize() {
    const width = window.innerWidth;
    const height = Math.max(1, window.innerHeight);
    const aspect = width / height;
    camera.fov = aspect < 1.0 ? 64 : 52;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  applyResolution();
  handleResize();
  window.addEventListener('resize', handleResize);

  const yieldFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

  notifyProgress(32, 'Sculpting Warmier valleys & northern wasteland...');
  await yieldFrame();
  const terrainMesh = createTerrain();
  scene.add(terrainMesh);

  notifyProgress(50, 'Building atmosphere, stars & lighting...');
  await yieldFrame();
  const skyLighting = createSkyAndLighting(scene);
  skyLighting.initEnvironmentMap(renderer);
  skyLighting.onThunder(() => audio.playThunder());

  notifyProgress(68, 'Growing ancient forest & settlement...');
  await yieldFrame();
  const environment = createForestEnvironment(scene, getTerrainHeight);
  environment.setQuality(currentQuality);
  skyLighting.setQuality(currentQuality);

  const chapter1World = createChapter1World(scene, getTerrainHeight);

  notifyProgress(86, 'Preparing Kael, 5 weapons, Cyclops army & Ravok...');
  await yieldFrame();
  const player = createPlayer(scene, getTerrainHeight);
  scene.add(player.mesh);

  const cyclopsSystem = createCyclopsSoldiers(scene, getTerrainHeight);
  cyclopsSystem.setActive(false);

  const bossSystem = createRavokBoss(scene, getTerrainHeight);
  const thirdPersonCam = new ThirdPersonCamera(camera, getTerrainHeight);
  const combatVfx = createCombatVfx(scene);
  combatVfx.setQuality(currentQuality);

  // Reusable scratch vectors to avoid per-frame GC allocations
  const _tmpTargetCenter = new THREE.Vector3();
  const _camLocomotion = { speedRatio: 0, isSprinting: false };

  // Active Plasma Projectiles for Plasma Rifle & Dual Energy Blasters
  const projectiles = [];
  const plasmaBoltGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.9, 6);
  plasmaBoltGeo.rotateX(Math.PI / 2);
  const rifleBoltMat = new THREE.MeshBasicMaterial({ color: 0x38e0ff });
  const blasterBoltMat = new THREE.MeshBasicMaterial({ color: 0xb685ff });

  const hitRegistry = new Map();
  let hitStopTimer = 0;
  let trailTimer = 0;

  // Floating Damage Numbers projected to normalized screen coordinates (0..1)
  const damageEvents = [];
  function pushDamageNumber(worldPos, amount, isPlayerHit = false) {
    const projected = worldPos.clone().add(new THREE.Vector3(0, 2.2, 0)).project(camera);
    if (projected.z > 1) return;
    damageEvents.push({
      id: Math.random().toString(36).slice(2, 9),
      x: (projected.x * 0.5 + 0.5),
      y: (-projected.y * 0.5 + 0.5),
      amount,
      isPlayerHit,
    });
  }

  // Chapter 1 Campaign & Objectives State
  const mission = {
    escapedSettlement: false,
    civiliansRescued: 0,
    cyclopsDefeated: 0,
    reachedSafeRoute: false,
    ravokDefeated: false,
  };

  const story = {
    sceneId: 'MENU_ORBIT',
    subStep: 0,
    timer: 0,
    isCutscene: false,
    canContinue: false,
    canSkip: false,
    speaker: '',
    speakerRole: '',
    subtitle: '',
    blackScreenText: '',
    chapterCompleted: false,
    timeScale: 1.0,
    asteroidFallProgress: 0,
    shockwaveTimer: 0,
  };

  let isPaused = false;
  let aimSensitivity = 1.0;
  let joystickSensitivity = 1.0;
  let lastZoneId = '';
  const joystick = { x: 0, y: 0 };
  const keys = {};

  window.addEventListener('keydown', (e) => { keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  function resetMissionFlags() {
    mission.escapedSettlement = false;
    mission.civiliansRescued = 0;
    mission.cyclopsDefeated = 0;
    mission.reachedSafeRoute = false;
    mission.ravokDefeated = false;
  }

  function clearProjectiles() {
    for (const p of projectiles) {
      scene.remove(p.mesh);
    }
    projectiles.length = 0;
    hitRegistry.clear();
  }

  function setupGameplayInvasionState(spawnX = 0, spawnZ = 2) {
    chapter1World.spaceGroup.visible = false;
    chapter1World.asteroidMesh.visible = false;
    chapter1World.craterRing.visible = true;
    chapter1World.impactShockwave.visible = false;
    chapter1World.shipGroup.visible = true;
    chapter1World.zyroxGroup.visible = false;
    chapter1World.setDamagedSettlement(true);
    skyLighting.setDoomAmount(0.85);
    cyclopsSystem.resetAll();
    cyclopsSystem.setActive(true);
    bossSystem.hide();
    clearProjectiles();
    combatVfx.clear();
    player.reset(spawnX, spawnZ);
    thirdPersonCam.setAimMode(false);
    thirdPersonCam.setCinematicPose(false);
    thirdPersonCam.setMenuOrbit(false);
    thirdPersonCam.resetBehindPlayer(player.mesh.rotation.y);
    story.timeScale = 1.0;
    story.isCutscene = false;
    story.canContinue = false;
    story.canSkip = false;
    story.blackScreenText = '';
    story.speaker = 'AETHER';
    story.speakerRole = 'AETHER';
    story.subtitle = 'Escape the burning settlement! Rescue civilians nearby and clear the northern route.';
  }

  function enterStoryScene(sceneId, subStep = 0) {
    story.sceneId = sceneId;
    story.subStep = subStep;
    story.timer = 0;
    story.timeScale = 1.0;
    story.chapterCompleted = false;

    if (sceneId === 'MENU_ORBIT') {
      story.isCutscene = false;
      story.canContinue = false;
      story.canSkip = false;
      story.speaker = '';
      story.speakerRole = '';
      story.subtitle = '';
      story.blackScreenText = '';
      chapter1World.resetCampaignObjects();
      cyclopsSystem.setActive(false);
      bossSystem.hide();
      clearProjectiles();
      combatVfx.clear();
      skyLighting.setDoomAmount(0);
      player.reset(0, 0);
      thirdPersonCam.setAimMode(false);
      thirdPersonCam.setCinematicPose(false);
      thirdPersonCam.setMenuOrbit(true);
      return;
    }

    if (sceneId === 'SCENE_1_INTRO') {
      story.isCutscene = true;
      story.canSkip = true;
      story.canContinue = true;
      chapter1World.resetCampaignObjects();
      cyclopsSystem.setActive(false);
      bossSystem.hide();
      clearProjectiles();
      combatVfx.clear();
      skyLighting.setDoomAmount(0);
      player.reset(0, 8);
      thirdPersonCam.setAimMode(false);
      thirdPersonCam.setMenuOrbit(false);

      if (subStep === 0) {
        chapter1World.spaceGroup.visible = true;
        story.blackScreenText = 'FAR BEYOND THE MILKY WAY GALAXY...';
        story.speaker = '';
        story.speakerRole = '';
        story.subtitle = '';
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(0, 322, 28),
          new THREE.Vector3(0, 320, 0),
          true
        );
      } else if (subStep === 1) {
        chapter1World.spaceGroup.visible = true;
        story.blackScreenText = '';
        story.speaker = 'NARRATOR';
        story.speakerRole = 'NARRATOR';
        story.subtitle =
          'Far beyond the Milky Way lies Planet Warmier — a world of ancient forests, towering mountains, deserts, and forgotten civilizations.';
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(3.5, 321.5, 19.5),
          new THREE.Vector3(0, 320, 0),
          false
        );
      } else {
        chapter1World.spaceGroup.visible = false;
        story.blackScreenText = '';
        story.speaker = 'NARRATOR';
        story.speakerRole = 'NARRATOR';
        story.subtitle =
          'Near the northern mountain ridge lives 19-year-old Kael — walking peacefully through his settlement, unaware of what falls from above.';
        const py = getTerrainHeight(0, 6);
        player.position.set(0, py, 6);
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(4.2, py + 2.3, 1.5),
          new THREE.Vector3(0, py + 1.4, 5.0),
          true
        );
      }
      return;
    }

    if (sceneId === 'SCENE_2_ASTEROID') {
      story.isCutscene = true;
      story.canSkip = true;
      story.canContinue = true;
      story.blackScreenText = '';
      chapter1World.spaceGroup.visible = false;
      skyLighting.setDoomAmount(0.95);
      const impactPos = chapter1World.impactPos;

      if (subStep === 0) {
        story.asteroidFallProgress = 0;
        chapter1World.asteroidMesh.visible = true;
        chapter1World.asteroidMesh.position.set(0, 68, -110);
        chapter1World.craterRing.visible = false;
        chapter1World.impactShockwave.visible = false;
        story.speaker = 'AETHER';
        story.speakerRole = 'AETHER';
        story.subtitle =
          'WARNING: Sky darkening! A colossal burning asteroid has breached Warmier’s atmosphere!';
        const ky = getTerrainHeight(0, 2);
        player.position.set(0, ky, 2);
        player.mesh.rotation.y = 0;
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(5.5, ky + 3.0, 9.0),
          new THREE.Vector3(0, 28, -68),
          true
        );
      } else {
        chapter1World.asteroidMesh.visible = false;
        chapter1World.craterRing.visible = true;
        chapter1World.impactShockwave.visible = true;
        chapter1World.impactShockwave.scale.set(1, 1, 1);
        chapter1World.impactShockwave.material.opacity = 0.95;
        story.shockwaveTimer = 1.4;
        chapter1World.setDamagedSettlement(true);
        thirdPersonCam.triggerShake(1.15);
        skyLighting.triggerFlash(0xff5a22, impactPos, 28);
        audio.playExplosion();
        story.speaker = 'NARRATOR';
        story.speakerRole = 'NARRATOR';
        story.subtitle =
          'A thunderous explosion tears across the northern wasteland! Shockwaves shatter the sky and rain molten rocks onto the village!';
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(14, impactPos.y + 12, -32),
          new THREE.Vector3(impactPos.x, impactPos.y + 2, impactPos.z),
          false
        );
      }
      return;
    }

    if (sceneId === 'SCENE_3_INVASION') {
      story.isCutscene = true;
      story.canSkip = true;
      story.canContinue = true;
      story.blackScreenText = '';
      chapter1World.craterRing.visible = true;
      chapter1World.shipGroup.visible = true;
      chapter1World.setDamagedSettlement(true);
      cyclopsSystem.resetAll();
      cyclopsSystem.setActive(true);
      const impactPos = chapter1World.impactPos;

      if (subStep === 0) {
        chapter1World.zyroxGroup.visible = false;
        story.speaker = 'NARRATOR';
        story.speakerRole = 'NARRATOR';
        story.subtitle =
          'The asteroid cracks open — revealing a gargantuan alien warship. Mechanical Cyclops warriors pour across the valley!';
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(-12, impactPos.y + 9.5, -24),
          new THREE.Vector3(impactPos.x, impactPos.y + 9.5, impactPos.z),
          false
        );
      } else {
        chapter1World.zyroxGroup.visible = true;
        story.speaker = 'LORD ZYROX';
        story.speakerRole = 'ZYROX';
        story.subtitle =
          '"Destroy their cities. Break their resistance. Find the Core. This planet will belong to me."';
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(0, impactPos.y + 9.4, -37.2),
          new THREE.Vector3(0, impactPos.y + 9.3, -45),
          true
        );
      }
      return;
    }

    if (sceneId === 'SCENE_4_GAMEPLAY') {
      setupGameplayInvasionState(0, 2);
      notifyEvent('chapter1_start', 'CHAPTER 1: Escape the settlement & rescue civilians!');
      return;
    }

    if (sceneId === 'SCENE_5_BOSS_INTRO') {
      story.isCutscene = true;
      story.canSkip = true;
      story.canContinue = true;
      story.blackScreenText = '';
      chapter1World.zyroxGroup.visible = false;
      chapter1World.shipGroup.visible = true;
      chapter1World.craterRing.visible = true;
      cyclopsSystem.setActive(true);
      bossSystem.spawn(0, -46);
      bossSystem.boss.active = false;
      mission.reachedSafeRoute = true;

      const by = getTerrainHeight(0, -46);
      if (subStep === 0) {
        audio.playExplosion();
        thirdPersonCam.triggerShake(0.65);
        story.speaker = 'RAVOK';
        story.speakerRole = 'BOSS';
        story.subtitle =
          '"No Warmier rat escapes my hunt! I am Ravok — and this forest is your grave!"';
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(2.8, by + 3.4, -38.5),
          new THREE.Vector3(0, by + 2.5, -46),
          true
        );
      } else {
        story.speaker = 'KAEL';
        story.speakerRole = 'HERO';
        story.subtitle =
          '"My home... my people! I won’t let you take Warmier without a fight!"';
        player.position.set(0, getTerrainHeight(0, -37), -37);
        player.mesh.rotation.y = 0;
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(-2.4, player.position.y + 2.0, -33.2),
          new THREE.Vector3(0, by + 1.8, -44),
          false
        );
      }
      return;
    }

    if (sceneId === 'SCENE_5_BOSS_FIGHT') {
      story.isCutscene = false;
      story.canSkip = false;
      story.canContinue = false;
      story.timeScale = 1.0;
      chapter1World.craterRing.visible = true;
      chapter1World.shipGroup.visible = true;
      chapter1World.zyroxGroup.visible = false;
      chapter1World.setDamagedSettlement(true);
      skyLighting.setDoomAmount(0.9);
      cyclopsSystem.setActive(true);
      if (!bossSystem.boss.alive) bossSystem.spawn(0, -46);
      bossSystem.boss.active = true;

      if (player.position.z > -32) {
        player.reset(0, -37);
      }
      thirdPersonCam.setCinematicPose(false);
      thirdPersonCam.setMenuOrbit(false);
      thirdPersonCam.resetBehindPlayer(0);
      story.speaker = 'AETHER';
      story.speakerRole = 'AETHER';
      story.subtitle = 'Use Perfect Block, dodges & combos against Ravok! Strike when he staggers!';
      notifyEvent('boss_fight', 'BOSS ENCOUNTER: RAVOK, CYCLOPS COMMANDER');
      return;
    }

    if (sceneId === 'SCENE_6_AWAKENING') {
      story.isCutscene = true;
      story.canSkip = true;
      story.canContinue = true;
      story.blackScreenText = '';
      bossSystem.boss.active = false;
      cyclopsSystem.clearLock();
      thirdPersonCam.setAimMode(false);
      player.setAiming(false);

      if (subStep === 0) {
        story.timeScale = 0.28; // Cinematic Slow-Motion Awakening
        player.setAwakened(true);
        player.state.hp = player.state.maxHp;
        player.state.energy = player.state.maxEnergy;
        player.spawnShockwave(0x7be8ff, 15.0);
        skyLighting.triggerFlash(0x6ce2ff, player.position, 32);
        thirdPersonCam.triggerShake(1.0);
        audio.playAwakening();
        bossSystem.triggerAwakeningBlast(player.position);
        mission.ravokDefeated = true;

        story.speaker = 'UNKNOWN VOICE';
        story.speakerRole = 'UNKNOWN';
        story.subtitle = '"Finally... the last Guardian has awakened."';
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(player.position.x + 2.8, player.position.y + 1.9, player.position.z + 3.2),
          new THREE.Vector3(player.position.x, player.position.y + 1.3, player.position.z),
          true
        );
      } else {
        story.timeScale = 1.0;
        skyLighting.setDoomAmount(0.35);
        story.speaker = 'AETHER';
        story.speakerRole = 'AETHER';
        story.subtitle =
          '"Ancient Guardian protocol initialized. I am AETHER. The symbol on your hand holds the Core’s secret — and Lord Zyrox’s doom."';
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(player.position.x - 2.6, player.position.y + 2.1, player.position.z + 3.0),
          new THREE.Vector3(player.position.x, player.position.y + 1.45, player.position.z),
          false
        );
      }
      return;
    }

    if (sceneId === 'CHAPTER_1_COMPLETE') {
      story.isCutscene = true;
      story.canSkip = false;
      story.canContinue = false;
      story.chapterCompleted = true;
      story.timeScale = 1.0;
      story.speaker = '';
      story.speakerRole = '';
      story.subtitle = '';
      unlockPower('shadow_dash');
      notifyEvent('chapter1_complete', 'CHAPTER 1 COMPLETED · Shadow Dash Unlocked!');
    }
  }

  function advanceCutscene() {
    audio.ensureContext();
    switch (story.sceneId) {
      case 'SCENE_1_INTRO':
        if (story.subStep === 0) enterStoryScene('SCENE_1_INTRO', 1);
        else if (story.subStep === 1) enterStoryScene('SCENE_1_INTRO', 2);
        else enterStoryScene('SCENE_2_ASTEROID', 0);
        break;
      case 'SCENE_2_ASTEROID':
        if (story.subStep === 0) enterStoryScene('SCENE_2_ASTEROID', 1);
        else enterStoryScene('SCENE_3_INVASION', 0);
        break;
      case 'SCENE_3_INVASION':
        if (story.subStep === 0) enterStoryScene('SCENE_3_INVASION', 1);
        else enterStoryScene('SCENE_4_GAMEPLAY', 0);
        break;
      case 'SCENE_5_BOSS_INTRO':
        if (story.subStep === 0) enterStoryScene('SCENE_5_BOSS_INTRO', 1);
        else enterStoryScene('SCENE_5_BOSS_FIGHT', 0);
        break;
      case 'SCENE_6_AWAKENING':
        if (story.subStep === 0) enterStoryScene('SCENE_6_AWAKENING', 1);
        else enterStoryScene('CHAPTER_1_COMPLETE', 0);
        break;
      default:
        break;
    }
  }

  function skipCutscene() {
    audio.ensureContext();
    if (story.sceneId === 'SCENE_1_INTRO' || story.sceneId === 'SCENE_2_ASTEROID' || story.sceneId === 'SCENE_3_INVASION') {
      enterStoryScene('SCENE_4_GAMEPLAY', 0);
    } else if (story.sceneId === 'SCENE_5_BOSS_INTRO') {
      enterStoryScene('SCENE_5_BOSS_FIGHT', 0);
    } else if (story.sceneId === 'SCENE_6_AWAKENING') {
      enterStoryScene('CHAPTER_1_COMPLETE', 0);
    }
  }

  function applyDamageToSoldier(soldier, dmg, isHeavy, attackInstanceId, comboStep, knockbackForce = 6.0) {
    if (!resolveAttackHit(hitRegistry, attackInstanceId, soldier.id)) return false;

    const isFinisher = comboStep === 3 && soldier.hp <= soldier.maxHp * 0.35;
    const totalDmg = isFinisher ? dmg + 25 : dmg;
    const knockVec = computeKnockbackVector(player.position, soldier.root.position, isHeavy ? knockbackForce * 1.45 : knockbackForce);
    const result = cyclopsSystem.damageSoldier(soldier, totalDmg, knockVec, isHeavy || isFinisher);

    combatVfx.spawnImpactBurst(soldier.root.position, result.blocked ? 0x99b8ff : 0xff3b2f, isHeavy ? 7 : 5);
    pushDamageNumber(soldier.root.position, result.actualDamage, false);
    player.state.ultimateCharge = Math.min(100, player.state.ultimateCharge + (isHeavy ? 18 : 13));

    if (isFinisher && !result.defeated) {
      notifyEvent('finisher', 'FINISHING STRIKE!');
    }
    if (result.defeated) {
      player.state.gold += soldier.isHeavy ? 140 : 85;
      player.state.shards += soldier.isHeavy ? 10 : 5;
      player.state.level += 1;
      notifyEvent('cyclops_defeated', `${soldier.name} destroyed! (+${soldier.isHeavy ? 140 : 85} Gold)`);
    }
    return true;
  }

  function applyDamageToBoss(dmg, isHeavy, attackInstanceId, knockbackForce = 4.5) {
    if (!bossSystem.boss.alive || !bossSystem.boss.active) return false;
    if (!resolveAttackHit(hitRegistry, attackInstanceId, bossSystem.boss.id)) return false;

    const knockVec = computeKnockbackVector(player.position, bossSystem.boss.root.position, knockbackForce);
    bossSystem.damage(dmg, knockVec);
    combatVfx.spawnImpactBurst(bossSystem.boss.root.position, 0xff3b2f, isHeavy ? 8 : 5);
    pushDamageNumber(bossSystem.boss.root.position, dmg, false);
    player.state.ultimateCharge = Math.min(100, player.state.ultimateCharge + 16);
    return true;
  }

  function performMeleeHitCheck(baseDamage, range, arcCos, isHeavy, attackInstanceId, comboStep = 1) {
    if (story.isCutscene) return;
    const scaledDamage = Math.round(baseDamage * player.getDamageMultiplier());
    const forwardVec = new THREE.Vector3(
      -Math.sin(player.mesh.rotation.y),
      0,
      -Math.cos(player.mesh.rotation.y)
    ).normalize();

    let hitAny = false;
    for (const soldier of cyclopsSystem.soldiers) {
      if (!soldier.alive || !soldier.active) continue;
      const toSoldier = new THREE.Vector3().subVectors(soldier.root.position, player.position);
      const dist = Math.hypot(toSoldier.x, toSoldier.z);
      if (dist > range) continue;

      toSoldier.y = 0;
      toSoldier.normalize();
      if (dist < 1.7 || forwardVec.dot(toSoldier) >= arcCos) {
        if (applyDamageToSoldier(soldier, scaledDamage, isHeavy, attackInstanceId, comboStep)) {
          hitAny = true;
        }
      }
    }

    // Check Boss Ravok Hit
    if (bossSystem.boss.alive && bossSystem.boss.active) {
      const toBoss = new THREE.Vector3().subVectors(bossSystem.boss.root.position, player.position);
      const dist = Math.hypot(toBoss.x, toBoss.z);
      if (dist <= range + 1.0) {
        toBoss.y = 0;
        toBoss.normalize();
        if (dist < 2.4 || forwardVec.dot(toBoss) >= arcCos) {
          if (applyDamageToBoss(scaledDamage, isHeavy, attackInstanceId)) {
            hitAny = true;
          }
        }
      }
    }

    if (hitAny) {
      audio.playHit();
      if (isHeavy) {
        hitStopTimer = 0.055;
        thirdPersonCam.triggerShake(0.32);
      } else if (comboStep === 3) {
        hitStopTimer = 0.04;
        thirdPersonCam.triggerShake(0.18);
      }
    }
  }

  function findAutoAimTarget() {
    const extraTargets = bossSystem.boss.alive && bossSystem.boss.active ? [bossSystem.boss] : [];
    const locked = cyclopsSystem.getLockedTarget(extraTargets);
    if (locked) return locked;

    const candidates = [...cyclopsSystem.soldiers, ...extraTargets].filter((t) => t.alive && t.active);
    let nearest = null;
    let bestDist = 30;
    for (const c of candidates) {
      const d = player.position.distanceTo(c.root.position);
      if (d < bestDist) {
        bestDist = d;
        nearest = c;
      }
    }
    return nearest;
  }

  function spawnPlasmaBolt(weapon, attackInstanceId, lateralOffset = 0) {
    const isBlaster = weapon.slotIndex === 3;
    const mat = isBlaster ? blasterBoltMat : rifleBoltMat;
    const bolt = new THREE.Mesh(plasmaBoltGeo, mat);

    const spawnOrigin = player.position.clone().add(new THREE.Vector3(0, 1.42, 0));
    const rightVec = new THREE.Vector3(Math.cos(player.mesh.rotation.y), 0, -Math.sin(player.mesh.rotation.y));
    spawnOrigin.addScaledVector(rightVec, lateralOffset);

    const dir = new THREE.Vector3();
    if (player.state.isAiming) {
      // Manual aiming follows camera reticle ray
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const aimTarget = camera.position.clone().addScaledVector(camDir, 28);
      dir.subVectors(aimTarget, spawnOrigin).normalize();
    } else {
      // Mobile auto-aim targets locked or nearest active enemy
      const autoTarget = findAutoAimTarget();
      if (autoTarget) {
        const targetHeight = autoTarget.id === 'boss_ravok' ? 2.1 : 1.35;
        dir.subVectors(
          autoTarget.root.position.clone().add(new THREE.Vector3(0, targetHeight, 0)),
          spawnOrigin
        ).normalize();
      } else {
        dir.set(
          -Math.sin(thirdPersonCam.yaw) * Math.cos(thirdPersonCam.pitch * 0.35),
          -Math.sin(thirdPersonCam.pitch * 0.25) + 0.03,
          -Math.cos(thirdPersonCam.yaw) * Math.cos(thirdPersonCam.pitch * 0.35)
        ).normalize();
      }
    }

    // Face player toward shot direction
    player.mesh.rotation.y = Math.atan2(-dir.x, -dir.z);
    const trailColor = isBlaster ? 0xa67bff : 0x4ce8ff;
    combatVfx.spawnMuzzleFlash(spawnOrigin, dir, trailColor);
    bolt.position.copy(spawnOrigin).addScaledVector(dir, 0.95);
    bolt.lookAt(bolt.position.clone().add(dir));
    scene.add(bolt);

    projectiles.push({
      mesh: bolt,
      dir,
      life: 2.2,
      speed: (isBlaster ? 42 : 48) * (0.88 + aimSensitivity * 0.12),
      damage: Math.round((weapon.projectileDamage || 35) * player.getDamageMultiplier()),
      trailColor,
      trailTimer: 0,
      attackInstanceId,
    });
  }

  function handlePlayerDamaged(rawDmg, attackerPos = null, attackerEntity = null) {
    if (story.isCutscene) return null;
    const result = player.receiveDamage(rawDmg, attackerPos);

    if (result.titanShieldReflect) {
      audio.playPerfectBlock();
      combatVfx.spawnShieldBurst(player.position, true);
      thirdPersonCam.triggerShake(0.18);
      if (attackerEntity && attackerEntity.id !== 'boss_ravok') {
        const knock = computeKnockbackVector(player.position, attackerEntity.root.position, 8.0);
        cyclopsSystem.damageSoldier(attackerEntity, 50, knock, true);
      }
      notifyEvent('titan_shield', 'TITAN SHIELD DEFLECTED ATTACK!');
      return 'REFLECTED';
    }

    if (result.perfectBlock) {
      audio.playPerfectBlock();
      combatVfx.spawnShieldBurst(player.position, true);
      hitStopTimer = 0.085;
      thirdPersonCam.triggerShake(0.28);
      if (attackerEntity) {
        if (attackerEntity.id === 'boss_ravok') {
          bossSystem.staggerFromParry(player.position);
        } else {
          const knock = computeKnockbackVector(player.position, attackerEntity.root.position, 8.5);
          cyclopsSystem.stunSoldier(attackerEntity, 1.6, knock);
        }
      }
      notifyEvent('perfect_block', 'PERFECT BLOCK! Attacker stunned!');
      return;
    }

    if (result.mitigated <= 0) return;

    if (result.blocked) {
      audio.playBlock();
      combatVfx.spawnShieldBurst(player.position, false);
    } else {
      audio.playHit();
      combatVfx.spawnImpactBurst(player.position, 0xff3b2f, 4);
    }
    pushDamageNumber(player.position, result.mitigated, true);

    if (story.sceneId === 'SCENE_5_BOSS_FIGHT') {
      if (player.state.hp <= 78) {
        enterStoryScene('SCENE_6_AWAKENING', 0);
      }
    } else if (player.state.hp <= 0) {
      player.state.hp = 160;
      player.state.deathTimer = 0;
      player.position.set(0, getTerrainHeight(0, 2), 2);
      notifyEvent('respawn', 'AETHER restored your shields at the settlement edge!');
    }
  }

  function activatePowerById(powerId = 'energy_strike') {
    if (story.isCutscene) return;
    audio.ensureContext();
    const power = GUARDIAN_POWERS.find((p) => p.id === powerId) || GUARDIAN_POWERS[0];
    if (!power.unlocked) {
      notifyEvent('power_locked', `${power.name} unlocks in Chapter ${power.unlockChapter}`);
      return;
    }
    const triggered = player.triggerSpecial(power.energyCost, power.cooldown, power.id);
    if (!triggered) return;

    audio.playPowerCast(power.id);
    const id = triggered.attackInstanceId;

    if (power.id === 'shadow_dash') {
      const dashDir = new THREE.Vector3(-Math.sin(player.mesh.rotation.y), 0, -Math.cos(player.mesh.rotation.y)).normalize();
      const startPos = player.position.clone();
      for (let step = 1; step <= 4; step++) {
        const sample = startPos.clone().addScaledVector(dashDir, step * 2.3);
        sample.x = THREE.MathUtils.clamp(sample.x, -68, 68);
        sample.z = THREE.MathUtils.clamp(sample.z, -68, 68);
        sample.y = getTerrainHeight(sample.x, sample.z);
        combatVfx.spawnEnergyTrail(sample, 0x9b66ff);
        player.position.copy(sample);
        for (const s of cyclopsSystem.soldiers) {
          if (s.alive && s.active && s.root.position.distanceTo(sample) < 2.6) {
            applyDamageToSoldier(s, power.damage, true, id, 2, 7.5);
          }
        }
        if (bossSystem.boss.alive && bossSystem.boss.active && bossSystem.boss.root.position.distanceTo(sample) < 3.2) {
          applyDamageToBoss(power.damage, true, id, 4.5);
        }
      }
      thirdPersonCam.triggerShake(0.24);
      notifyEvent('shadow_dash', 'SHADOW DASH!');
    } else if (power.id === 'plasma_blast') {
      const target = findAutoAimTarget();
      const origin = player.position.clone().add(new THREE.Vector3(0, 1.38, 0));
      const beamDir = target
        ? target.root.position.clone().add(new THREE.Vector3(0, 1.3, 0)).sub(origin).setY(0).normalize()
        : new THREE.Vector3(-Math.sin(player.mesh.rotation.y), 0, -Math.cos(player.mesh.rotation.y)).normalize();
      player.mesh.rotation.y = Math.atan2(-beamDir.x, -beamDir.z);
      combatVfx.spawnPlasmaBeam(origin, beamDir, 22, 0x38e0ff);
      const beamLength = 22;
      for (const s of cyclopsSystem.soldiers) {
        if (!s.alive || !s.active) continue;
        const toEnemy = s.root.position.clone().sub(origin);
        toEnemy.y = 0;
        const proj = toEnemy.dot(beamDir);
        if (proj >= 0 && proj <= beamLength) {
          const perpSq = toEnemy.lengthSq() - proj * proj;
          if (perpSq <= 2.35 * 2.35) {
            applyDamageToSoldier(s, power.damage, true, id, 3, 9.0);
          }
        }
      }
      if (bossSystem.boss.alive && bossSystem.boss.active) {
        const toBoss = bossSystem.boss.root.position.clone().sub(origin);
        toBoss.y = 0;
        const proj = toBoss.dot(beamDir);
        if (proj >= 0 && proj <= beamLength && (toBoss.lengthSq() - proj * proj) <= 2.9 * 2.9) {
          applyDamageToBoss(power.damage, true, id, 6.0);
        }
      }
      hitStopTimer = 0.06;
      thirdPersonCam.triggerShake(0.45);
      notifyEvent('plasma_blast', 'PLASMA BLAST BEAM!');
    } else if (power.id === 'titan_shield') {
      combatVfx.spawnShieldBurst(player.position, true);
      thirdPersonCam.triggerShake(0.22);
      performMeleeHitCheck(power.damage, 4.2, -1.0, false, id, 2);
      notifyEvent('titan_shield', 'TITAN SHIELD ACTIVE (6s) — Reflects projectiles!');
    } else if (power.id === 'gravity_control') {
      combatVfx.spawnStasisSphere(player.position, 6.5, 0x8b6eff);
      thirdPersonCam.triggerShake(0.38);
      for (const s of cyclopsSystem.soldiers) {
        if (!s.alive || !s.active) continue;
        if (s.root.position.distanceTo(player.position) <= 6.8) {
          cyclopsSystem.levitateSoldier(s, 2.6);
          applyDamageToSoldier(s, power.damage, true, id, 2, 2.0);
        }
      }
      if (bossSystem.boss.alive && bossSystem.boss.active && bossSystem.boss.root.position.distanceTo(player.position) <= 7.2) {
        applyDamageToBoss(power.damage, true, id, 3.0);
      }
      notifyEvent('gravity_control', 'GRAVITY STASIS FIELD!');
    } else if (power.id === 'quantum_blast') {
      const locked = findAutoAimTarget();
      const center = locked
        ? locked.root.position.clone()
        : player.position.clone().add(new THREE.Vector3(-Math.sin(player.mesh.rotation.y) * 6.0, 0, -Math.cos(player.mesh.rotation.y) * 6.0));
      center.y = getTerrainHeight(center.x, center.z);
      combatVfx.spawnQuantumSingularity(center, 0xb44cff);
      combatVfx.spawnGroundShockwave(center, 0x38e0ff, 5.5);
      for (const s of cyclopsSystem.soldiers) {
        if (!s.alive || !s.active) continue;
        if (s.root.position.distanceTo(center) <= 6.0) {
          s.root.position.lerp(center, 0.45);
          s.root.position.y = getTerrainHeight(s.root.position.x, s.root.position.z);
          applyDamageToSoldier(s, power.damage, true, id, 3, 1.5);
        }
      }
      if (bossSystem.boss.alive && bossSystem.boss.active && bossSystem.boss.root.position.distanceTo(center) <= 6.5) {
        applyDamageToBoss(power.damage, true, id, 3.5);
      }
      hitStopTimer = 0.08;
      thirdPersonCam.triggerShake(0.58);
      notifyEvent('quantum_blast', 'QUANTUM SINGULARITY DETONATED!');
    } else if (power.id === 'guardian_mode') {
      combatVfx.spawnGroundShockwave(player.position, 0xf3c969, 8.5);
      combatVfx.spawnShieldBurst(player.position, true);
      performMeleeHitCheck(power.damage, 8.5, -1.0, true, id, 3);
      hitStopTimer = 0.09;
      thirdPersonCam.triggerShake(0.68);
      notifyEvent('guardian_mode', 'GUARDIAN MODE TRANSCENDENCE! (+30% SPD, +45% DMG)');
    } else {
      // energy_strike (Chapter 1 default)
      combatVfx.spawnEnergyTrail(player.position, 0x38e0ff);
      combatVfx.spawnGroundShockwave(player.position, 0x38e0ff, 6.2);
      thirdPersonCam.triggerShake(0.35);
      performMeleeHitCheck(power.damage, 6.2, -1.0, true, id, 3);
    }
  }

  // Public GameAPI connected to Android Jetpack Compose HUD & Campaign System
  window.GameAPI = {
    startChapter1(startScene = 'SCENE_1_INTRO') {
      audio.ensureContext();
      resetMissionFlags();
      lastZoneId = '';
      unlockPowersUpToChapter(1);
      environment.temple.reset();
      environment.hiddenCave.reset();
      environment.zoneFeatures.reset();
      if (startScene === 'SCENE_5_BOSS_FIGHT' || startScene === 'SCENE_5_BOSS_INTRO') {
        mission.escapedSettlement = true;
        mission.reachedSafeRoute = true;
        enterStoryScene('SCENE_5_BOSS_FIGHT', 0);
      } else if (startScene === 'SCENE_4_GAMEPLAY') {
        enterStoryScene('SCENE_4_GAMEPLAY', 0);
      } else {
        enterStoryScene('SCENE_1_INTRO', 0);
      }
    },
    skipCutscene() {
      skipCutscene();
    },
    continueCutscene() {
      advanceCutscene();
    },
    setJoystickInput(x, y) {
      joystick.x = THREE.MathUtils.clamp(x * joystickSensitivity, -1, 1);
      joystick.y = THREE.MathUtils.clamp(y * joystickSensitivity, -1, 1);
    },
    orbitCamera(dx, dy) {
      thirdPersonCam.orbit(dx, dy);
    },
    setMenuOrbit(enabled) {
      if (enabled) {
        enterStoryScene('MENU_ORBIT', 0);
      } else {
        thirdPersonCam.setMenuOrbit(false);
      }
    },
    setPaused(paused) {
      isPaused = Boolean(paused);
      if (isPaused) autoFireActive = false;
    },
    setAutoFire(enabled) {
      autoFireActive = Boolean(enabled);
    },
    resetCamera() {
      thirdPersonCam.resetBehindPlayer(player.mesh.rotation.y);
    },
    resetPlayer() {
      resetMissionFlags();
      lastZoneId = '';
      unlockPowersUpToChapter(1);
      environment.temple.reset();
      environment.hiddenCave.reset();
      environment.zoneFeatures.reset();
      enterStoryScene('SCENE_1_INTRO', 0);
    },
    setRunning(running) {
      audio.ensureContext();
      player.setRunning(running);
    },
    jump() {
      if (story.isCutscene) return;
      audio.ensureContext();
      if (player.triggerJump()) audio.playJump();
    },
    toggleAim() {
      if (story.isCutscene) return;
      audio.ensureContext();
      const next = player.toggleAiming();
      thirdPersonCam.setAimMode(next);
    },
    reloadWeapon() {
      if (story.isCutscene) return;
      audio.ensureContext();
      if (player.triggerReload()) {
        audio.playReload();
        notifyEvent('reload', 'Reloading plasma core...');
      }
    },
    lightAttack() {
      if (story.isCutscene) return;
      audio.ensureContext();
      const res = player.triggerAttack(false);
      if (!res) return;
      if (res.autoReloadTriggered) {
        audio.playReload();
        notifyEvent('reload', 'Plasma depleted! Reloading...');
        return;
      }
      if (res.buffered) return;
      const w = res.weapon;
      if (w.isRanged) {
        if (w.slotIndex === 2) audio.playPlasmaRifle();
        else audio.playDualBlaster(player.state.blasterAltHand);
        const lateral = w.slotIndex === 3 ? (player.state.blasterAltHand ? 0.34 : -0.34) : 0.16;
        spawnPlasmaBolt(w, res.attackInstanceId, lateral);
      } else {
        if (w.slotIndex === 0) audio.playSwordSlash(res.comboStep);
        else if (w.slotIndex === 1) audio.playAxeCleave();
        else audio.playGauntletPunch(res.comboStep);
      }
    },
    heavyAttack() {
      if (story.isCutscene) return;
      audio.ensureContext();
      const res = player.triggerAttack(true);
      if (!res) return;
      if (res.autoReloadTriggered) {
        audio.playReload();
        notifyEvent('reload', 'Plasma depleted! Reloading...');
        return;
      }
      const w = res.weapon;
      if (w.isRanged) {
        if (w.slotIndex === 2) audio.playPlasmaRifle();
        else audio.playDualBlaster(false);
        spawnPlasmaBolt(w, res.attackInstanceId, 0.25);
        if (w.slotIndex === 3 && res.shots > 1) {
          spawnPlasmaBolt(w, `${res.attackInstanceId}_twin`, -0.25);
        }
      } else {
        if (w.slotIndex === 0) audio.playSwordSlash(3);
        else if (w.slotIndex === 1) audio.playAxeCleave();
        else audio.playGauntletPunch(3);
      }
    },
    startHeavyCharge() {
      if (story.isCutscene) return;
      audio.ensureContext();
      player.startHeavyCharge();
    },
    releaseHeavyCharge() {
      if (story.isCutscene) return;
      audio.ensureContext();
      const res = player.releaseHeavyCharge();
      if (!res) return;
      if (res.autoReloadTriggered) {
        audio.playReload();
        notifyEvent('reload', 'Plasma depleted! Reloading...');
        return;
      }
      const w = res.weapon;
      if (w.isRanged) {
        if (w.slotIndex === 2) audio.playPlasmaRifle();
        else audio.playDualBlaster(false);
        spawnPlasmaBolt(w, res.attackInstanceId, 0.25);
        if (w.slotIndex === 3 && res.shots > 1) {
          spawnPlasmaBolt(w, `${res.attackInstanceId}_twin`, -0.25);
        }
      } else {
        if (w.slotIndex === 0) audio.playSwordSlash(3);
        else if (w.slotIndex === 1) {
          audio.playAxeCleave();
          if (res.charged) {
            combatVfx.spawnGroundShockwave(player.position, 0xffb347, 5.4);
            notifyEvent('axe_charged', 'CHARGED QUANTUM CLEAVE!');
          }
        } else {
          audio.playGauntletPunch(3);
        }
      }
    },
    dodge() {
      if (story.isCutscene) return;
      audio.ensureContext();
      const extraTargets = bossSystem.boss.alive && bossSystem.boss.active ? [bossSystem.boss] : [];
      const locked = cyclopsSystem.getLockedTarget(extraTargets);
      if (player.triggerDodge(joystick.x, joystick.y, thirdPersonCam.yaw, locked ? locked.root.position : null)) {
        audio.playDodge();
        combatVfx.spawnEnergyTrail(player.position, 0x38d4ff);
        combatVfx.spawnGroundDust(player.position, 4, 1.0);
      }
    },
    setBlocking(blocking) {
      audio.ensureContext();
      player.setBlocking(blocking);
    },
    activatePower(powerId = 'energy_strike') {
      activatePowerById(powerId);
    },
    unlockPower(powerId) {
      return unlockPower(powerId);
    },
    unlockPowersUpToChapter(chapterNum) {
      return unlockPowersUpToChapter(chapterNum);
    },
    specialPower() {
      activatePowerById('energy_strike');
    },
    ultimatePower() {
      if (story.isCutscene) return;
      audio.ensureContext();
      const res = player.triggerUltimate();
      if (!res) return;
      audio.playUltimate();
      combatVfx.spawnGroundShockwave(player.position, 0x88ebff, 9.5);
      performMeleeHitCheck(145, 9.5, -1.0, true, res.attackInstanceId, 3);
      notifyEvent('ultimate', 'GUARDIAN SURGE UNLEASHED!');
    },
    usePotion() {
      if (story.isCutscene) return;
      audio.ensureContext();
      if (player.triggerPotion()) {
        audio.playHeal();
        notifyEvent('heal', '+95 Health Restored');
      }
    },
    interact() {
      if (story.isCutscene) return;
      audio.ensureContext();
      const civ = chapter1World.getNearbyCivilian(player.position);
      if (civ && chapter1World.rescueCivilian(civ)) {
        audio.playObjectiveComplete();
        mission.civiliansRescued = chapter1World.getRescuedCount();
        player.state.hp = Math.min(player.state.maxHp, player.state.hp + 45);
        player.state.gold += 50;
        notifyEvent('civilian_rescued', `Rescued ${civ.name}! (${mission.civiliansRescued}/3)`);
        return;
      }

      if (
        !environment.hiddenCave.isRelicCollected() &&
        player.position.distanceTo(environment.hiddenCave.relicPos) < 3.4 &&
        environment.hiddenCave.tryClaimRelic()
      ) {
        audio.playAwakening();
        player.state.gold += 150;
        player.state.shards += 20;
        player.state.potions += 1;
        player.state.energy = player.state.maxEnergy;
        notifyEvent('cave_relic', 'Ancient Cave Sanctuary Relic claimed! (+150 Gold, +20 Shards, +1 Potion)');
        return;
      }

      const zoneRes = environment.zoneFeatures.interact(player.position);
      if (zoneRes) {
        if (zoneRes.event === 'energy_device') {
          audio.playAwakening();
          player.state.energy = Math.min(player.state.maxEnergy, player.state.energy + 35);
          player.state.stamina = Math.min(player.state.maxStamina, player.state.stamina + 35);
          if (zoneRes.pos) {
            combatVfx.spawnGroundShockwave(zoneRes.pos, 0x4ae8ff, 5.2);
          }
        } else if (zoneRes.event === 'crystal_collected') {
          audio.playCrystalPickup();
          player.state.energy = Math.min(player.state.maxEnergy, player.state.energy + 30);
          player.state.shards += 5;
        } else if (zoneRes.event === 'puzzle_solved') {
          audio.playAwakening();
          player.state.gold += 120;
          player.state.shards += 15;
          player.state.potions += 1;
          player.state.energy = player.state.maxEnergy;
        } else {
          audio.playObjectiveComplete();
        }
        notifyEvent(zoneRes.event, zoneRes.message);
        return;
      }

      const res = environment.temple.interact(player.position);
      if (res) {
        audio.playObjectiveComplete();
        if (res.event === 'herb_collected' || res.bonusPotion) {
          player.state.potions += 1;
        }
        notifyEvent(res.event, res.message);
      }
    },
    switchWeapon(slotIndex) {
      audio.ensureContext();
      autoFireActive = false;
      player.switchWeapon(slotIndex);
      const w = getWeaponByIndex(player.state.weaponIndex);
      if (!w.isRanged) {
        thirdPersonCam.setAimMode(false);
      }
      audio.playSwing(false);
    },
    toggleTargetLock() {
      if (story.isCutscene) return;
      audio.ensureContext();
      const extraTargets = bossSystem.boss.alive && bossSystem.boss.active ? [bossSystem.boss] : [];
      const locked = cyclopsSystem.toggleTargetLock(player.position, extraTargets);
      if (locked) {
        notifyEvent('target_lock', `Locked onto ${locked.name}`);
      }
    },
    setQuality(level) {
      currentQuality = level;
      applyResolution();
      environment.setQuality(level);
      skyLighting.setQuality(level);
      combatVfx.setQuality(level);
    },
    getMissingExternalAssets() {
      return {
        ...player.getMissingExternalAssets(),
        ...environment.getMissingEnvironmentAssets(),
      };
    },
    setShadowQuality(level) {
      if (level === 'off') {
        renderer.shadowMap.enabled = false;
        skyLighting.setShadowMapSize(0);
      } else {
        renderer.shadowMap.enabled = true;
        const size = level === 'low' ? 512 : level === 'medium' ? 1024 : 2048;
        skyLighting.setShadowMapSize(size);
      }
    },
    setResolutionScale(scale) {
      resolutionScale = THREE.MathUtils.clamp(Number(scale) || 1.0, 0.6, 1.5);
      applyResolution();
    },
    setFogEnabled(enabled) {
      skyLighting.setFogEnabled(Boolean(enabled));
    },
    setWeather(mode) {
      skyLighting.setWeather(mode);
    },
    getZones() {
      return environment.FORGOTTEN_FOREST_ZONES;
    },
    setCameraSensitivity(val) {
      thirdPersonCam.sensitivity = Number(val) || 1.0;
    },
    setInvertCameraY(invert) {
      thirdPersonCam.invertY = Boolean(invert);
    },
    setCameraFollowDistance(dist) {
      thirdPersonCam.setFollowDistance(dist);
    },
    setAimSensitivity(val) {
      aimSensitivity = Number(val) || 1.0;
    },
    setJoystickSensitivity(val) {
      joystickSensitivity = Number(val) || 1.0;
    },
    setAudioVolumes(master, music, sfx) {
      audio.setVolumes(master, music, sfx);
    },
  };

  // Warm-up render
  thirdPersonCam.update(0.016, player.position);
  renderer.render(scene, camera);

  notifyProgress(100, 'Warmier Ready');
  notifyReady();

  const clock = new THREE.Clock();
  let frameCounter = 0;
  let fpsTimer = 0;
  let hudSyncTimer = 0;
  let autoFireActive = false;

  function animate() {
    requestAnimationFrame(animate);

    const rawDt = clock.getDelta();
    if (hitStopTimer > 0) {
      hitStopTimer = Math.max(0, hitStopTimer - rawDt);
    }
    const freezeFactor = hitStopTimer > 0 ? 0.08 : 1.0;
    const dt = isPaused ? 0 : Math.min(rawDt, 0.05) * story.timeScale * freezeFactor;
    const elapsed = clock.elapsedTime;

    if (!isPaused) {
      story.timer += rawDt;
      combatVfx.update(rawDt);

      // ── Cutscene Automation & Visual Sequences ─────────────────────────────
      if (story.sceneId === 'SCENE_1_INTRO') {
        chapter1World.updateSpace(rawDt);
        if (story.subStep === 0 && story.timer > 2.5) {
          enterStoryScene('SCENE_1_INTRO', 1);
        } else if (story.subStep === 2) {
          player.position.z -= rawDt * 1.4;
          player.mesh.rotation.y = 0;
          player.update(rawDt, elapsed, 0, 0, 0, 2.4);
          thirdPersonCam.setCinematicPose(
            true,
            new THREE.Vector3(player.position.x + 3.4, player.position.y + 2.0, player.position.z - 3.6),
            new THREE.Vector3(player.position.x, player.position.y + 1.45, player.position.z),
            false
          );
        } else {
          player.update(rawDt, elapsed, 0, 0, 0, 0);
        }
        thirdPersonCam.update(rawDt, player.position, null);
      } else if (story.sceneId === 'SCENE_2_ASTEROID') {
        if (story.subStep === 0) {
          story.asteroidFallProgress = Math.min(1, story.asteroidFallProgress + rawDt * 0.42);
          const impactPos = chapter1World.impactPos;
          chapter1World.asteroidMesh.position.lerpVectors(
            new THREE.Vector3(0, 68, -110),
            new THREE.Vector3(impactPos.x, impactPos.y + 2, impactPos.z),
            story.asteroidFallProgress
          );
          chapter1World.asteroidMesh.rotation.x += rawDt * 2.2;
          chapter1World.asteroidMesh.rotation.z += rawDt * 1.8;
          if (story.asteroidFallProgress >= 1.0) {
            enterStoryScene('SCENE_2_ASTEROID', 1);
          }
        } else if (story.shockwaveTimer > 0) {
          story.shockwaveTimer = Math.max(0, story.shockwaveTimer - rawDt);
          const p = 1 - story.shockwaveTimer / 1.4;
          const s = 1 + p * 18;
          chapter1World.impactShockwave.scale.set(s, s, s);
          chapter1World.impactShockwave.material.opacity = (1 - p) * 0.95;
          if (story.shockwaveTimer <= 0) chapter1World.impactShockwave.visible = false;
        }
        player.update(rawDt, elapsed, 0, 0, 0, 0);
        thirdPersonCam.update(rawDt, player.position, null);
      } else if (story.sceneId === 'SCENE_3_INVASION') {
        chapter1World.shipGroup.position.y =
          chapter1World.impactPos.y + 11.5 + Math.sin(elapsed * 1.4) * 0.45;
        player.update(rawDt, elapsed, 0, 0, 0, 0);
        thirdPersonCam.update(rawDt, player.position, null);
      } else if (story.sceneId === 'SCENE_5_BOSS_INTRO') {
        player.update(rawDt, elapsed, 0, 0, 0, 0);
        bossSystem.update(dt, elapsed, player.position, () => {}, (s) => thirdPersonCam.triggerShake(s));
        thirdPersonCam.update(rawDt, player.position, null);
      } else if (story.sceneId === 'SCENE_6_AWAKENING') {
        if (story.subStep === 0 && story.timer > 3.2) {
          enterStoryScene('SCENE_6_AWAKENING', 1);
        }
        player.update(dt, elapsed, 0, 0, 0, 0);
        bossSystem.update(dt, elapsed, player.position, () => {}, () => {});
        const angle = elapsed * 0.7;
        thirdPersonCam.setCinematicPose(
          true,
          new THREE.Vector3(
            player.position.x + Math.cos(angle) * 3.8,
            player.position.y + 1.9,
            player.position.z + Math.sin(angle) * 3.8
          ),
          new THREE.Vector3(player.position.x, player.position.y + 1.35, player.position.z),
          false
        );
        thirdPersonCam.update(rawDt, player.position, null);
      } else if (story.sceneId === 'CHAPTER_1_COMPLETE') {
        player.update(rawDt, elapsed, 0, 0, 0, 0);
        thirdPersonCam.update(rawDt, player.position, null);
      } else {
        // ── Active Third-Person Gameplay ──────────────────────────────────────
        let inputX = story.sceneId === 'MENU_ORBIT' ? 0 : joystick.x;
        let inputY = story.sceneId === 'MENU_ORBIT' ? 0 : joystick.y;
        if (story.sceneId !== 'MENU_ORBIT') {
          if (keys['KeyW'] || keys['ArrowUp']) inputY += 1;
          if (keys['KeyS'] || keys['ArrowDown']) inputY -= 1;
          if (keys['KeyD'] || keys['ArrowRight']) inputX += 1;
          if (keys['KeyA'] || keys['ArrowLeft']) inputX -= 1;
        }

        const extraTargets = bossSystem.boss.alive && bossSystem.boss.active ? [bossSystem.boss] : [];
        const lockedTarget = cyclopsSystem.getLockedTarget(extraTargets);
        const worldColliders = environment.getColliders();
        player.update(
          dt,
          elapsed,
          inputX,
          inputY,
          thirdPersonCam.yaw,
          null,
          lockedTarget ? lockedTarget.root.position : null,
          worldColliders
        );

        // Execute synchronized melee hitboxes & slash/dust VFX on exact animation strike frames
        const pendingHits = player.consumePendingMeleeHits();
        for (const hit of pendingHits) {
          if (hit.isGroundSlam) {
            audio.playGroundSlam();
            combatVfx.spawnGroundShockwave(player.position, hit.slashColor, 4.8);
          } else {
            combatVfx.spawnSlashArc(
              player.position,
              player.mesh.rotation.y,
              hit.slashColor,
              hit.slashScale,
              hit.slashTilt
            );
          }
          if (hit.spawnDust) {
            combatVfx.spawnGroundDust(player.position, hit.isHeavy ? 6 : 4, hit.isHeavy ? 1.5 : 1.1);
          }
          if (hit.shakeIntensity > 0) {
            thirdPersonCam.triggerShake(hit.shakeIntensity);
          }
          if (hit.hitStop > 0) {
            hitStopTimer = Math.max(hitStopTimer, hit.hitStop);
          }
          performMeleeHitCheck(
            hit.damage,
            hit.range,
            hit.arcCos,
            hit.isHeavy,
            hit.attackInstanceId,
            hit.comboStep
          );
        }

        // Sprint / Dodge blue energy trail particles
        if (player.state.animState === 'run' || player.state.animState === 'dodging') {
          trailTimer += dt;
          if (trailTimer >= 0.09) {
            trailTimer = 0;
            combatVfx.spawnEnergyTrail(player.position, 0x38d4ff);
          }
        }

        _camLocomotion.speedRatio = THREE.MathUtils.clamp(player.getCurrentSpeed() / 10.6, 0, 1);
        _camLocomotion.isSprinting = player.state.animControllerState === 'SPRINT';
        thirdPersonCam.update(
          rawDt,
          player.position,
          lockedTarget ? lockedTarget.root.position : null,
          _camLocomotion,
          worldColliders
        );

        cyclopsSystem.update(
          dt,
          elapsed,
          player.position,
          camera.position,
          (dmg, pos, attacker) => handlePlayerDamaged(dmg, pos, attacker),
          extraTargets
        );

        bossSystem.update(
          dt,
          elapsed,
          player.position,
          (dmg, pos, attacker) => handlePlayerDamaged(dmg, pos, attacker),
          (shake) => thirdPersonCam.triggerShake(shake),
          () => audio.playPlasmaShot()
        );

        // Check Boss Low-HP Awakening Trigger (Ravok <= 520 HP out of 2000 HP)
        if (story.sceneId === 'SCENE_5_BOSS_FIGHT' && bossSystem.boss.hp <= 520) {
          enterStoryScene('SCENE_6_AWAKENING', 0);
        }

        // Falling Meteor Debris Hazards during Scene 4 Escape
        chapter1World.updateDebrisHazards(
          dt,
          player.position,
          story.sceneId === 'SCENE_4_GAMEPLAY' && player.position.z > -36,
          (dmg, pos) => {
            handlePlayerDamaged(dmg, pos, null);
            audio.playExplosion();
          },
          (shake) => thirdPersonCam.triggerShake(shake)
        );

        // Hold-to-auto-fire for ranged weapons (Plasma Rifle & Dual Energy Blasters)
        if (autoFireActive && story.sceneId !== 'MENU_ORBIT') {
          const curWep = getWeaponByIndex(player.state.weaponIndex);
          if (curWep.isRanged && player.state.cooldowns.light <= 0 && !player.state.isReloading && player.state.dodgeTimer <= 0) {
            window.GameAPI.lightAttack();
          }
        }

        // Update Plasma Rifle & Dual Blaster Projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
          const p = projectiles[i];
          p.life -= dt;
          p.mesh.position.addScaledVector(p.dir, p.speed * dt);
          p.trailTimer = (p.trailTimer || 0) + dt;
          if (p.trailTimer >= 0.032) {
            p.trailTimer = 0;
            combatVfx.spawnProjectileTrail(p.mesh.position, p.trailColor || 0x4ce8ff);
          }
          let hit = false;

          for (const s of cyclopsSystem.soldiers) {
            if (!s.alive || !s.active) continue;
            _tmpTargetCenter.set(s.root.position.x, s.root.position.y + 1.3, s.root.position.z);
            if (p.mesh.position.distanceTo(_tmpTargetCenter) < 1.35) {
              hit = true;
              if (applyDamageToSoldier(s, p.damage, false, p.attackInstanceId, 1, 3.8)) {
                audio.playHit();
              }
              break;
            }
          }

          if (!hit && bossSystem.boss.alive && bossSystem.boss.active) {
            _tmpTargetCenter.set(
              bossSystem.boss.root.position.x,
              bossSystem.boss.root.position.y + 2.1,
              bossSystem.boss.root.position.z
            );
            if (p.mesh.position.distanceTo(_tmpTargetCenter) < 1.85) {
              hit = true;
              if (applyDamageToBoss(p.damage, false, p.attackInstanceId, 2.5)) {
                audio.playHit();
              }
            }
          }

          if (hit || p.life <= 0) {
            scene.remove(p.mesh);
            projectiles.splice(i, 1);
          }
        }

        // Update Chapter 1 Objectives during Gameplay
        if (story.sceneId === 'SCENE_4_GAMEPLAY') {
          if (!mission.escapedSettlement && player.position.z < -12) {
            mission.escapedSettlement = true;
            audio.playObjectiveComplete();
            story.subtitle = 'Settlement cleared! Engage Cyclops scouts and reach the northern forest route.';
            notifyEvent('objective', 'Escaped the destroyed settlement!');
          }
          mission.civiliansRescued = chapter1World.getRescuedCount();
          mission.cyclopsDefeated = cyclopsSystem.getDefeatedCount();

          if (player.position.z <= -36.5) {
            mission.reachedSafeRoute = true;
            enterStoryScene('SCENE_5_BOSS_INTRO', 0);
          }
        } else if (story.sceneId === 'SCENE_5_BOSS_FIGHT') {
          mission.civiliansRescued = chapter1World.getRescuedCount();
          mission.cyclopsDefeated = cyclopsSystem.getDefeatedCount();
        }
        // Auto-collect glowing Energy Crystals when Kael walks right over them
        const collectedCrystal = environment.zoneFeatures.tryAutoCollectCrystal(player.position);
        if (collectedCrystal) {
          audio.playCrystalPickup();
          player.state.energy = Math.min(player.state.maxEnergy, player.state.energy + 30);
          player.state.shards += 5;
          combatVfx.spawnEnergyTrail(player.position, 0x4ae8ff);
          const cnt = environment.zoneFeatures.getCollectedCrystalCount();
          const tot = environment.zoneFeatures.getTotalCrystals();
          notifyEvent('crystal_collected', `Energy Crystal (${cnt}/${tot}) · +30 Energy`);
        }

        // Zone change telemetry banner during open exploration
        const currentZone = environment.getZoneAt(player.position.x, player.position.z);
        if (story.sceneId === 'SCENE_4_GAMEPLAY' && currentZone.id !== lastZoneId) {
          if (lastZoneId !== '') {
            notifyEvent('zone_enter', `${currentZone.name} — ${currentZone.subtitle}`);
          }
          lastZoneId = currentZone.id;
        }
      }

      skyLighting.update(elapsed, player.position, rawDt);
      const wetness = skyLighting.getWetness();
      if (terrainMesh.userData.setWetness) {
        terrainMesh.userData.setWetness(wetness);
      }
      environment.setWetness(wetness);
      environment.setWeatherWindMultiplier(skyLighting.getWindMultiplier());
      environment.updateLod(camera.position, currentQuality);
      environment.update(dt, elapsed, player.position);
    }

    renderer.render(scene, camera);

    // Sync HUD + Story + Boss State ~15Hz
    hudSyncTimer += rawDt;
    if (hudSyncTimer >= 0.065) {
      hudSyncTimer = 0;
      const nearbyCiv = story.sceneId === 'SCENE_4_GAMEPLAY'
        ? chapter1World.getNearbyCivilian(player.position)
        : null;
      const nearbyCaveRelic = !environment.hiddenCave.isRelicCollected() &&
        player.position.distanceTo(environment.hiddenCave.relicPos) < 3.4;
      const nearbyZoneFeature = environment.zoneFeatures.getNearbyInteractable(player.position);
      const nearbyTemple = environment.temple.getNearbyInteractable(player.position);
      const nearbyLabel = nearbyCiv
        ? `Rescue ${nearbyCiv.name}`
        : nearbyCaveRelic
          ? 'Claim Hidden Cave Relic'
          : nearbyZoneFeature
            ? nearbyZoneFeature.label
            : nearbyTemple
              ? nearbyTemple.label
              : '';

      const extraTargets = bossSystem.boss.alive && bossSystem.boss.active ? [bossSystem.boss] : [];
      const locked = cyclopsSystem.getLockedTarget(extraTargets);
      const pendingDamage = damageEvents.splice(0, damageEvents.length);
      const currentWeapon = getWeaponByIndex(player.state.weaponIndex);
      const reloadProgress = player.state.isReloading && player.state.reloadDuration > 0
        ? Number((1 - player.state.reloadTimer / player.state.reloadDuration).toFixed(2))
        : 0;

      notifyHudState({
        name: player.state.name,
        level: player.state.level,
        hp: Math.round(player.state.hp),
        maxHp: player.state.maxHp,
        energy: Math.round(player.state.energy),
        maxEnergy: player.state.maxEnergy,
        stamina: Math.round(player.state.stamina),
        maxStamina: player.state.maxStamina,
        ultimate: Math.round(player.state.ultimateCharge),
        potions: player.state.potions,
        ammo: player.state.ammo,
        maxAmmo: player.state.maxAmmo,
        isReloading: player.state.isReloading,
        reloadProgress,
        isAiming: player.state.isAiming,
        comboStep: player.state.comboStep,
        animState: player.state.animState,
        perfectBlockActive: player.state.perfectBlockBannerTimer > 0,
        titanShieldActive: player.state.titanShieldTimer > 0,
        guardianModeActive: player.state.guardianModeTimer > 0,
        gold: player.state.gold,
        shards: player.state.shards,
        weaponIndex: player.state.weaponIndex,
        weaponId: currentWeapon.id,
        isBlocking: player.state.isBlocking,
        isRunning: player.state.isRunning,
        hasTargetLock: Boolean(locked),
        lockedEnemyName: locked ? locked.name : '',
        nearbyPrompt: nearbyLabel,
        weapons: WEAPONS.map((w) => ({
          slotIndex: w.slotIndex,
          id: w.id,
          name: w.name,
          category: w.category,
          lightDamage: w.lightDamage,
          heavyDamage: w.heavyDamage,
          projectileDamage: w.projectileDamage,
          maxAmmo: w.maxAmmo,
          unlocked: w.unlocked,
        })),
        powers: GUARDIAN_POWERS.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          energyCost: p.energyCost,
          cooldown: p.cooldown,
          damage: p.damage,
          unlockChapter: p.unlockChapter,
          unlocked: p.unlocked,
        })),
        cooldowns: {
          light: Number(player.state.cooldowns.light.toFixed(2)),
          heavy: Number(player.state.cooldowns.heavy.toFixed(2)),
          dodge: Number(player.state.cooldowns.dodge.toFixed(2)),
          special: Number(player.state.cooldowns.special.toFixed(2)),
          potion: Number(player.state.cooldowns.potion.toFixed(2)),
        },
        playerX: Number(player.position.x.toFixed(2)),
        playerZ: Number(player.position.z.toFixed(2)),
        playerYaw: Number(thirdPersonCam.yaw.toFixed(3)),
        enemies: cyclopsSystem.soldiers.map((s) => ({
          id: s.id,
          x: Number(s.root.position.x.toFixed(1)),
          z: Number(s.root.position.z.toFixed(1)),
          alive: s.alive && s.active,
        })),
        civilians: chapter1World.civilians.map((c) => ({
          id: c.id,
          x: Number(c.pos.x.toFixed(1)),
          z: Number(c.pos.z.toFixed(1)),
          rescued: c.rescued,
        })),
        templeX: 0,
        templeZ: -46,
        artifactCollected: mission.ravokDefeated,
        zoneId: environment.getZoneAt(player.position.x, player.position.z).id,
        zoneName: environment.getZoneAt(player.position.x, player.position.z).name,
        weather: skyLighting.getWeather(),
        crystalsCollected: environment.zoneFeatures.getCollectedCrystalCount(),
        totalCrystals: environment.zoneFeatures.getTotalCrystals(),
        puzzlePillarsActivated: environment.zoneFeatures.getActivatedPuzzleCount(),
        mission: {
          escapedSettlement: mission.escapedSettlement,
          civiliansRescued: mission.civiliansRescued,
          cyclopsDefeated: mission.cyclopsDefeated,
          reachedSafeRoute: mission.reachedSafeRoute,
          ravokDefeated: mission.ravokDefeated,
        },
        boss: {
          visible: story.sceneId === 'SCENE_5_BOSS_FIGHT' && bossSystem.boss.alive,
          name: bossSystem.boss.name,
          hp: Math.round(bossSystem.boss.hp),
          maxHp: bossSystem.boss.maxHp,
          x: Number(bossSystem.boss.root.position.x.toFixed(1)),
          z: Number(bossSystem.boss.root.position.z.toFixed(1)),
        },
        story: {
          sceneId: story.sceneId,
          isCutscene: story.isCutscene,
          canContinue: story.canContinue,
          canSkip: story.canSkip,
          speaker: story.speaker,
          speakerRole: story.speakerRole,
          subtitle: story.subtitle,
          blackScreenText: story.blackScreenText,
          chapterCompleted: story.chapterCompleted,
        },
        damageNumbers: pendingDamage,
      });
    }

    frameCounter++;
    fpsTimer += rawDt;
    if (fpsTimer >= 0.8) {
      notifyFps(Math.round(frameCounter / fpsTimer));
      frameCounter = 0;
      fpsTimer = 0;
    }
  }

  animate();
}

initGame().catch((err) => {
  if (window.AndroidBridge && window.AndroidBridge.onWebError) {
    window.AndroidBridge.onWebError(err && err.message ? err.message : String(err));
  }
});
