import * as THREE from 'three';
import { getWeaponByIndex, isPerfectBlockWindow } from './combat.js';
import { buildKaelModel, tryLoadExternalKaelGlb, getMissingExternalAssets } from './characters/kaelModel.js';
import { buildKaelAnimationClips } from './characters/kaelAnimations.js';
import { KaelAnimationController, KAEL_ANIM_STATES } from './characters/animationController.js';

/**
 * Upgraded Hero KAEL Controller:
 * - Uses original realistic humanoid skeleton & PBR model (kaelModel.js)
 * - Uses genuine THREE.AnimationClip keyframes & THREE.AnimationMixer crossFade blending
 * - Supports drop-in external GLB replacement via GLTFLoader (assets/game/models/kael_hero.glb)
 * - Connects all 18 animation states to mobile joystick, target-lock strafe/backwalk, and 5-weapon combat
 */
export function createPlayer(scene, getTerrainHeight) {
  const kaelRig = buildKaelModel();
  const root = kaelRig.root;
  root.name = 'KaelPlayer';

  const clips = buildKaelAnimationClips(kaelRig.restTransforms);
  const animController = new KaelAnimationController(root, clips);

  // Optional runtime upgrade: if an artist drops models/kael_hero.glb in APK assets, seamlessly swap in
  tryLoadExternalKaelGlb('./models/kael_hero.glb').then((glb) => {
    if (!glb) return;
    while (root.children.length > 0) {
      root.remove(root.children[0]);
    }
    root.add(glb.scene);
    root.add(kaelRig.fxNodes.wardAura);
    animController.bindExternalGlb(glb.scene, glb.animations);
  });

  // Visual AoE Shockwave Ring
  const shockwaveRing = new THREE.Mesh(
    new THREE.RingGeometry(0.4, 0.85, 36),
    new THREE.MeshBasicMaterial({ color: 0x6ce2ff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  shockwaveRing.rotation.x = -Math.PI / 2;
  shockwaveRing.visible = false;
  scene.add(shockwaveRing);
  let shockwaveTimer = 0;
  let shockwaveMaxScale = 6.0;

  const startY = getTerrainHeight(0, 0);
  root.position.set(0, startY, 0);

  const ammoByWeapon = {
    2: 18, // Plasma Rifle
    3: 24, // Dual Energy Blasters
  };

  const state = {
    name: 'Kael',
    level: 1,
    hp: 240,
    maxHp: 240,
    energy: 100,
    maxEnergy: 100,
    stamina: 100,
    maxStamina: 100,
    ultimateCharge: 45,
    potions: 3,
    ammo: 0,
    maxAmmo: 0,
    gold: 120,
    shards: 15,
    weaponIndex: 0,
    isRunning: false,
    isBlocking: false,
    isAiming: false,
    isReloading: false,
    reloadTimer: 0,
    reloadDuration: 1.5,
    isGrounded: true,
    isAwakened: false,
    verticalVel: 0,
    invulnTimer: 0,
    dodgeTimer: 0,
    dodgeDir: new THREE.Vector3(0, 0, -1),
    attackAnimTimer: 0,
    attackAnimType: 'idle',
    animState: 'idle',
    animControllerState: KAEL_ANIM_STATES.IDLE,
    comboStep: 0,
    comboResetTimer: 0,
    weaponSwitchAnim: 0,
    blockStartElapsed: -10,
    perfectBlockBannerTimer: 0,
    hitReactionTimer: 0,
    knockbackTimer: 0,
    recoveryTimer: 0,
    knockbackDir: new THREE.Vector3(0, 0, 1),
    dodgeClipKey: 'DODGE',
    dodgeCounterWindowTimer: 0,
    combatStanceTimer: 0,
    isChargingHeavy: false,
    heavyChargeElapsed: 0,
    titanShieldTimer: 0,
    guardianModeTimer: 0,
    deathTimer: 0,
    attackInstanceCounter: 0,
    blasterAltHand: false,
    cooldowns: { light: 0, heavy: 0, dodge: 0, special: 0, potion: 0 },
  };

  const pendingMeleeAttack = {
    active: false,
    elapsed: 0,
    duration: 0,
    hitTime: 0,
    hitTriggered: false,
    cancelStartTime: 0,
    lungeSpeed: 0,
    lungeStopTime: 0,
    damage: 25,
    range: 3.4,
    arcCos: -0.15,
    isHeavy: false,
    comboStep: 1,
    weaponSlot: 0,
    slashColor: 0x38d4ff,
    slashScale: 1.0,
    slashTilt: 0,
    isGroundSlam: false,
    shakeIntensity: 0,
    hitStop: 0,
    spawnDust: false,
    chainRecoveryClip: null,
    attackInstanceId: '',
  };
  const completedMeleeHits = [];
  let queuedAttackRequest = null;

  function syncAmmoForCurrentWeapon() {
    const w = getWeaponByIndex(state.weaponIndex);
    if (w.isRanged) {
      state.maxAmmo = w.maxAmmo;
      state.ammo = ammoByWeapon[w.slotIndex] ?? w.maxAmmo;
    } else {
      state.maxAmmo = 0;
      state.ammo = 0;
    }
  }

  function syncEquippedWeaponVisibility() {
    const m = kaelRig.weaponMounts;
    m.swordGroup.visible = state.weaponIndex === 0;
    m.axeGroup.visible = state.weaponIndex === 1;
    m.rifleGroup.visible = state.weaponIndex === 2;
    m.rightBlasterGroup.visible = state.weaponIndex === 3;
    m.leftBlasterGroup.visible = state.weaponIndex === 3;
    m.rightGauntletGroup.visible = state.weaponIndex === 4;
    m.leftGauntletGroup.visible = state.weaponIndex === 4;
    m.shieldGroup.visible = state.weaponIndex === 0 || state.weaponIndex === 1;
    syncAmmoForCurrentWeapon();
  }
  syncEquippedWeaponVisibility();

  let currentSpeed = 0;
  let targetRotationY = 0;
  let latestElapsed = 0;
  const moveDir = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const charForward = new THREE.Vector3();
  const charRight = new THREE.Vector3();

  function mapControllerStateToHud(ctrlState) {
    switch (ctrlState) {
      case KAEL_ANIM_STATES.BLOCK:
        return state.perfectBlockBannerTimer > 0.5 ? 'perfect_block' : 'blocking';
      case KAEL_ANIM_STATES.DODGE:
        return 'dodging';
      case KAEL_ANIM_STATES.RELOAD:
        return 'reloading';
      case KAEL_ANIM_STATES.HIT:
        return 'hit_reaction';
      case KAEL_ANIM_STATES.KNOCKBACK:
        return 'knockback';
      case KAEL_ANIM_STATES.RECOVERY:
        return 'recovery';
      case KAEL_ANIM_STATES.AIM:
        return 'aiming';
      case KAEL_ANIM_STATES.WEAPON_SWITCH:
        return 'weapon_switch';
      case KAEL_ANIM_STATES.SPRINT:
      case KAEL_ANIM_STATES.RUN:
        return 'run';
      case KAEL_ANIM_STATES.STRAFE_LEFT:
        return 'strafe_left';
      case KAEL_ANIM_STATES.STRAFE_RIGHT:
        return 'strafe_right';
      case KAEL_ANIM_STATES.BACKWARD_WALK:
        return 'walk_backward';
      case KAEL_ANIM_STATES.SHOOT:
        return 'shooting';
      default:
        return ctrlState.toLowerCase();
    }
  }

  function resolvePlayerCollisions(colliders, playerRadius = 0.62) {
    if (!colliders || colliders.length === 0) return;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < colliders.length; i++) {
        const col = colliders[i];
        if (!col || col.active === false) continue;
        if (col.type === 'aabb') {
          const closestX = THREE.MathUtils.clamp(root.position.x, col.minX, col.maxX);
          const closestZ = THREE.MathUtils.clamp(root.position.z, col.minZ, col.maxZ);
          const dx = root.position.x - closestX;
          const dz = root.position.z - closestZ;
          const distSq = dx * dx + dz * dz;
          if (distSq < playerRadius * playerRadius) {
            const dist = Math.sqrt(distSq) || 0.0001;
            const push = playerRadius - dist;
            root.position.x += (dx / dist) * push;
            root.position.z += (dz / dist) * push;
          }
        } else {
          const dx = root.position.x - col.x;
          const dz = root.position.z - col.z;
          const minDist = (col.radius || 0.7) + playerRadius;
          const distSq = dx * dx + dz * dz;
          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            if (dist > 0.0001) {
              const push = minDist - dist;
              root.position.x += (dx / dist) * push;
              root.position.z += (dz / dist) * push;
            } else {
              root.position.z += minDist;
            }
          }
        }
      }
    }
    root.position.x = THREE.MathUtils.clamp(root.position.x, -68, 68);
    root.position.z = THREE.MathUtils.clamp(root.position.z, -68, 68);
  }

  return {
    mesh: root,
    position: root.position,
    state,
    animController,
    kaelRig,
    getCurrentSpeed: () => currentSpeed,
    getDamageMultiplier: () => (state.guardianModeTimer > 0 || state.isAwakened ? 1.45 : 1.0),
    getMissingExternalAssets,
    consumePendingMeleeHits() {
      if (completedMeleeHits.length === 0) return [];
      return completedMeleeHits.splice(0, completedMeleeHits.length);
    },

    setAwakened(awakened) {
      state.isAwakened = awakened;
      kaelRig.materials.cyanEnergy.emissiveIntensity = (awakened || state.guardianModeTimer > 0) ? 3.4 : 1.75;
      kaelRig.materials.eyeIrisCyan.emissiveIntensity = (awakened || state.guardianModeTimer > 0) ? 2.8 : 1.35;
      kaelRig.fxNodes.guardianHandSymbolMat.opacity = (awakened || state.guardianModeTimer > 0) ? 1.0 : 0.65;
      kaelRig.fxNodes.guardianHandSymbol.scale.setScalar((awakened || state.guardianModeTimer > 0) ? 2.1 : 1.0);
    },

    switchWeapon(index) {
      const clamped = ((index % 5) + 5) % 5;
      if (state.weaponIndex !== clamped) {
        state.weaponIndex = clamped;
        state.weaponSwitchAnim = 0.28;
        state.combatStanceTimer = 3.5;
        state.isChargingHeavy = false;
        state.heavyChargeElapsed = 0;
        state.isReloading = false;
        state.reloadTimer = 0;
        state.comboStep = 0;
        pendingMeleeAttack.active = false;
        queuedAttackRequest = null;
        if (!getWeaponByIndex(clamped).isRanged) {
          state.isAiming = false;
        }
        syncEquippedWeaponVisibility();
        animController.triggerUpperOneShot(KAEL_ANIM_STATES.WEAPON_SWITCH, 'WEAPON_SWITCH', 0.05, 1.1);
      }
    },

    setRunning(running) {
      state.isRunning = Boolean(running);
    },

    setAiming(aiming) {
      state.isAiming = Boolean(aiming);
    },

    toggleAiming() {
      state.isAiming = !state.isAiming;
      return state.isAiming;
    },

    setBlocking(blocking) {
      const next = Boolean(blocking) && !state.isReloading;
      if (next && !state.isBlocking) {
        state.blockStartElapsed = latestElapsed;
        state.combatStanceTimer = 4.2;
        if (pendingMeleeAttack.active && (pendingMeleeAttack.hitTriggered || pendingMeleeAttack.elapsed >= pendingMeleeAttack.cancelStartTime)) {
          pendingMeleeAttack.active = false;
          queuedAttackRequest = null;
          animController.cancelCombatActions();
        }
      }
      state.isBlocking = next;
    },

    triggerJump() {
      if (state.isGrounded && state.dodgeTimer <= 0 && state.deathTimer <= 0) {
        state.verticalVel = 9.4;
        state.isGrounded = false;
        animController.triggerOneShot(KAEL_ANIM_STATES.JUMP, 'JUMP', 0.06, 1.0);
        return true;
      }
      return false;
    },

    triggerDodge(inputX, inputY, cameraYaw, lockTargetPos = null) {
      if (
        state.cooldowns.dodge > 0 ||
        state.stamina < 20 ||
        state.dodgeTimer > 0 ||
        state.knockbackTimer > 0 ||
        state.deathTimer > 0
      ) return false;
      if (pendingMeleeAttack.active) {
        pendingMeleeAttack.active = false;
        queuedAttackRequest = null;
        animController.cancelCombatActions();
      }
      state.stamina = Math.max(0, state.stamina - 20);
      state.cooldowns.dodge = 1.05;
      state.dodgeTimer = 0.34;
      state.dodgeCounterWindowTimer = 0.65;
      state.invulnTimer = 0.48;
      state.isReloading = false;
      state.recoveryTimer = 0;

      const hasInput = Math.hypot(inputX, inputY) > 0.1;
      if (hasInput) {
        forward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
        right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));
        state.dodgeDir.set(0, 0, 0).addScaledVector(right, inputX).addScaledVector(forward, inputY).normalize();

        // Directional dodge selection relative to Kael's facing (or locked target / aim)
        if (state.isAiming || lockTargetPos) {
          charForward.set(-Math.sin(root.rotation.y), 0, -Math.cos(root.rotation.y));
          charRight.set(Math.cos(root.rotation.y), 0, -Math.sin(root.rotation.y));
          const fDot = state.dodgeDir.dot(charForward);
          const rDot = state.dodgeDir.dot(charRight);
          if (Math.abs(rDot) > Math.abs(fDot) * 1.1) {
            state.dodgeClipKey = rDot >= 0 ? 'DODGE_RIGHT' : 'DODGE_LEFT';
          } else {
            state.dodgeClipKey = fDot >= -0.2 ? 'DODGE_FORWARD' : 'DODGE_BACKWARD';
          }
        } else {
          // Free movement directional dodge based on camera-relative stick direction
          if (Math.abs(inputX) > Math.abs(inputY) * 1.15) {
            state.dodgeClipKey = inputX >= 0 ? 'DODGE_RIGHT' : 'DODGE_LEFT';
          } else if (inputY < -0.25) {
            state.dodgeClipKey = 'DODGE_BACKWARD';
          } else {
            state.dodgeClipKey = 'DODGE_FORWARD';
          }
          if (state.dodgeClipKey === 'DODGE_FORWARD') {
            root.rotation.y = Math.atan2(-state.dodgeDir.x, -state.dodgeDir.z);
          }
        }
      } else {
        // Neutral dodge tap -> crisp tactical backward evade step
        state.dodgeDir.set(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y)).normalize();
        state.dodgeClipKey = 'DODGE_BACKWARD';
      }

      animController.triggerOneShot(KAEL_ANIM_STATES.DODGE, state.dodgeClipKey, 0.05, 1.05);
      return true;
    },

    triggerReload() {
      const weapon = getWeaponByIndex(state.weaponIndex);
      if (!weapon.isRanged || state.isReloading || state.deathTimer > 0) return false;
      if (state.ammo >= weapon.maxAmmo) return false;
      state.isReloading = true;
      state.reloadDuration = weapon.reloadDuration || 1.4;
      state.reloadTimer = state.reloadDuration;
      state.animState = 'reloading';
      animController.triggerUpperOneShot(KAEL_ANIM_STATES.RELOAD, 'RELOAD', 0.08, 1.0);
      return true;
    },

    _scheduleMeleeAttack(spec) {
      pendingMeleeAttack.active = true;
      pendingMeleeAttack.elapsed = 0;
      pendingMeleeAttack.duration = spec.duration;
      pendingMeleeAttack.hitTime = spec.hitTime;
      pendingMeleeAttack.hitTriggered = false;
      pendingMeleeAttack.cancelStartTime = spec.cancelStartTime;
      pendingMeleeAttack.lungeSpeed = spec.lungeSpeed || 0;
      pendingMeleeAttack.lungeStopTime = spec.lungeStopTime || 0;
      pendingMeleeAttack.damage = spec.damage;
      pendingMeleeAttack.range = spec.range;
      pendingMeleeAttack.arcCos = spec.arcCos;
      pendingMeleeAttack.isHeavy = spec.isHeavy;
      pendingMeleeAttack.comboStep = spec.comboStep;
      pendingMeleeAttack.weaponSlot = spec.weaponSlot;
      pendingMeleeAttack.slashColor = spec.slashColor;
      pendingMeleeAttack.slashScale = spec.slashScale;
      pendingMeleeAttack.slashTilt = spec.slashTilt;
      pendingMeleeAttack.isGroundSlam = Boolean(spec.isGroundSlam);
      pendingMeleeAttack.shakeIntensity = spec.shakeIntensity || 0;
      pendingMeleeAttack.hitStop = spec.hitStop || 0;
      pendingMeleeAttack.spawnDust = Boolean(spec.spawnDust);
      pendingMeleeAttack.chainRecoveryClip = spec.chainRecoveryClip || null;
      pendingMeleeAttack.attackInstanceId = spec.attackInstanceId;
    },

    startHeavyCharge() {
      const weapon = getWeaponByIndex(state.weaponIndex);
      if (weapon.isRanged || state.dodgeTimer > 0 || state.knockbackTimer > 0 || state.deathTimer > 0) {
        return { started: false, weapon };
      }
      if (state.cooldowns.heavy > 0 || state.stamina < 18) {
        return { started: false, weapon };
      }
      state.isChargingHeavy = true;
      state.heavyChargeElapsed = 0;
      state.combatStanceTimer = 4.5;
      return { started: true, weapon };
    },

    releaseHeavyCharge() {
      const chargeTime = state.heavyChargeElapsed;
      const wasCharging = state.isChargingHeavy;
      state.isChargingHeavy = false;
      state.heavyChargeElapsed = 0;
      const weapon = getWeaponByIndex(state.weaponIndex);
      if (!wasCharging || weapon.slotIndex !== 1 || chargeTime < 0.4) {
        return this.triggerAttack(true);
      }
      if (state.dodgeTimer > 0 || state.knockbackTimer > 0 || state.deathTimer > 0) return null;
      if (state.cooldowns.heavy > 0 || state.stamina < 18) return null;

      state.stamina = Math.max(0, state.stamina - 24);
      state.cooldowns.heavy = weapon.heavyCooldown + 0.35;
      state.comboStep = 3;
      state.comboResetTimer = 1.4;
      state.combatStanceTimer = 4.8;
      queuedAttackRequest = null;
      state.attackInstanceCounter += 1;
      const attackInstanceId = `atk_${state.attackInstanceCounter}`;

      state.attackAnimTimer = 0.94;
      state.attackAnimType = 'axe_charged_attack';
      animController.triggerOneShot(KAEL_ANIM_STATES.HEAVY_ATTACK, 'AXE_CHARGED_ATTACK', 0.06, 1.0);
      this._scheduleMeleeAttack({
        duration: 0.94,
        hitTime: 0.46,
        cancelStartTime: 0.72,
        lungeSpeed: 6.0,
        lungeStopTime: 0.44,
        damage: weapon.heavyDamage + 32,
        range: weapon.range + 1.5,
        arcCos: -1.0,
        isHeavy: true,
        comboStep: 3,
        weaponSlot: 1,
        slashColor: 0xffb347,
        slashScale: 1.78,
        slashTilt: 0.25,
        isGroundSlam: true,
        shakeIntensity: 0.56,
        hitStop: 0.09,
        spawnDust: true,
        chainRecoveryClip: 'AXE_RECOVERY',
        attackInstanceId,
      });

      return {
        fired: true,
        charged: true,
        weapon,
        isHeavy: true,
        comboStep: 3,
        attackInstanceId,
      };
    },

    triggerAttack(isHeavy) {
      const weapon = getWeaponByIndex(state.weaponIndex);
      const cdKey = isHeavy ? 'heavy' : 'light';
      const canDodgeCounterSword =
        !isHeavy &&
        weapon.slotIndex === 0 &&
        state.dodgeCounterWindowTimer > 0 &&
        state.dodgeTimer <= 0.18;
      if ((state.dodgeTimer > 0 && !canDodgeCounterSword) || state.knockbackTimer > 0 || state.deathTimer > 0) {
        return null;
      }

      // Input buffering during active light combo swing so 3-hit combos feel crisp
      if (!weapon.isRanged && !isHeavy && pendingMeleeAttack.active && !pendingMeleeAttack.isHeavy && pendingMeleeAttack.comboStep < 3) {
        queuedAttackRequest = { isHeavy: false, weaponIndex: state.weaponIndex };
        return {
          fired: false,
          buffered: true,
          weapon,
          isHeavy: false,
          comboStep: (pendingMeleeAttack.comboStep % 3) + 1,
        };
      }

      if (state.cooldowns[cdKey] > 0) return null;
      if (isHeavy && state.stamina < 18) return null;

      if (weapon.isRanged) {
        if (state.isReloading) return null;
        if (state.ammo <= 0) {
          this.triggerReload();
          return { autoReloadTriggered: true, fired: false };
        }
        const shots = weapon.slotIndex === 3 && isHeavy ? Math.min(2, state.ammo) : 1;
        state.ammo = Math.max(0, state.ammo - shots);
        ammoByWeapon[weapon.slotIndex] = state.ammo;
        state.cooldowns[cdKey] = isHeavy ? weapon.heavyCooldown : weapon.lightCooldown;
        state.attackAnimTimer = 0.26;
        state.attackAnimType = weapon.slotIndex === 3 ? 'dual_blaster_shoot' : 'shooting';
        state.blasterAltHand = !state.blasterAltHand;
        state.attackInstanceCounter += 1;

        const shootClip = weapon.slotIndex === 3 ? 'DUAL_BLASTER_SHOOT' : 'SHOOT';
        animController.triggerUpperOneShot(KAEL_ANIM_STATES.SHOOT, shootClip, 0.04, 1.15);

        if (state.ammo === 0) {
          this.triggerReload();
        }
        return {
          fired: true,
          shots,
          weapon,
          isHeavy,
          comboStep: 1,
          attackInstanceId: `atk_${state.attackInstanceCounter}`,
        };
      }

      state.combatStanceTimer = 4.5;
      state.attackInstanceCounter += 1;
      const attackInstanceId = `atk_${state.attackInstanceCounter}`;
      const isMoving = currentSpeed > 0.85;

      if (isHeavy) {
        state.stamina = Math.max(0, state.stamina - 18);
        state.cooldowns.heavy = weapon.heavyCooldown;
        state.comboStep = 3;
        state.comboResetTimer = 1.35;
        queuedAttackRequest = null;

        if (weapon.slotIndex === 0) {
          state.attackAnimTimer = 0.72;
          state.attackAnimType = 'sword_heavy';
          animController.triggerOneShot(KAEL_ANIM_STATES.HEAVY_ATTACK, 'SWORD_HEAVY', 0.06, 1.0);
          this._scheduleMeleeAttack({
            duration: 0.72,
            hitTime: 0.36,
            cancelStartTime: 0.52,
            lungeSpeed: 4.8,
            lungeStopTime: 0.36,
            damage: weapon.heavyDamage,
            range: weapon.range + 0.85,
            arcCos: -0.35,
            isHeavy: true,
            comboStep: 3,
            weaponSlot: 0,
            slashColor: 0x38d4ff,
            slashScale: 1.42,
            slashTilt: 1.38,
            shakeIntensity: 0.34,
            hitStop: 0.06,
            spawnDust: true,
            attackInstanceId,
          });
        } else if (weapon.slotIndex === 1) {
          // Heavy Quantum Axe Leaping Ground Slam
          state.attackAnimTimer = 0.82;
          state.attackAnimType = 'ground_slam';
          animController.triggerOneShot(KAEL_ANIM_STATES.HEAVY_ATTACK, 'AXE_HEAVY_SLAM', 0.07, 1.0);
          this._scheduleMeleeAttack({
            duration: 0.82,
            hitTime: 0.42,
            cancelStartTime: 0.62,
            lungeSpeed: 5.2,
            lungeStopTime: 0.40,
            damage: weapon.heavyDamage + 8,
            range: weapon.range + 1.15,
            arcCos: -1.0,
            isHeavy: true,
            comboStep: 3,
            weaponSlot: 1,
            slashColor: 0xff9838,
            slashScale: 1.5,
            slashTilt: 1.45,
            isGroundSlam: true,
            shakeIntensity: 0.44,
            hitStop: 0.07,
            spawnDust: true,
            chainRecoveryClip: 'AXE_RECOVERY',
            attackInstanceId,
          });
        } else {
          // Guardian Gauntlet Rising Uppercut + Kinetic Shockwave
          state.attackAnimTimer = 0.48;
          state.attackAnimType = 'ground_slam';
          animController.triggerOneShot(KAEL_ANIM_STATES.HEAVY_ATTACK, 'PUNCH_UPPERCUT', 0.05, 1.0);
          this._scheduleMeleeAttack({
            duration: 0.48,
            hitTime: 0.20,
            cancelStartTime: 0.36,
            lungeSpeed: 4.6,
            lungeStopTime: 0.22,
            damage: weapon.heavyDamage,
            range: weapon.range + 0.85,
            arcCos: -0.8,
            isHeavy: true,
            comboStep: 3,
            weaponSlot: 4,
            slashColor: 0xf3c969,
            slashScale: 1.35,
            slashTilt: 1.35,
            isGroundSlam: true,
            shakeIntensity: 0.34,
            hitStop: 0.055,
            spawnDust: true,
            attackInstanceId,
          });
        }
      } else {
        state.comboStep = state.comboResetTimer > 0 ? (state.comboStep % 3) + 1 : 1;
        state.comboResetTimer = 1.15;
        state.cooldowns.light = weapon.lightCooldown;

        if (weapon.slotIndex === 0) {
          const isJumpAttack = !state.isGrounded;
          const isDodgeAttack = canDodgeCounterSword;
          const isRunningAttack = !isJumpAttack && !isDodgeAttack && state.isRunning && currentSpeed > 4.6 && state.comboStep === 1;

          if (isJumpAttack) {
            state.attackAnimType = 'sword_jump_attack';
            state.attackAnimTimer = 0.50;
            state.verticalVel = Math.min(state.verticalVel, -12.5);
            animController.triggerOneShot(KAEL_ANIM_STATES.LIGHT_ATTACK, 'SWORD_JUMP_ATTACK', 0.05, 1.04);
            this._scheduleMeleeAttack({
              duration: 0.50,
              hitTime: 0.22,
              cancelStartTime: 0.36,
              lungeSpeed: 4.2,
              lungeStopTime: 0.24,
              damage: weapon.lightDamage + 14,
              range: weapon.range + 0.65,
              arcCos: -0.65,
              isHeavy: false,
              comboStep: 2,
              weaponSlot: 0,
              slashColor: 0x72ebff,
              slashScale: 1.38,
              slashTilt: 1.35,
              isGroundSlam: true,
              shakeIntensity: 0.28,
              hitStop: 0.048,
              spawnDust: true,
              attackInstanceId,
            });
          } else if (isDodgeAttack) {
            state.dodgeCounterWindowTimer = 0;
            state.dodgeTimer = 0;
            state.attackAnimType = 'sword_dodge_attack';
            state.attackAnimTimer = 0.42;
            animController.triggerOneShot(KAEL_ANIM_STATES.LIGHT_ATTACK, 'SWORD_DODGE_ATTACK', 0.04, 1.08);
            this._scheduleMeleeAttack({
              duration: 0.42,
              hitTime: 0.15,
              cancelStartTime: 0.28,
              lungeSpeed: 6.4,
              lungeStopTime: 0.22,
              damage: weapon.lightDamage + 10,
              range: weapon.range + 0.5,
              arcCos: -0.30,
              isHeavy: false,
              comboStep: 2,
              weaponSlot: 0,
              slashColor: 0x72ebff,
              slashScale: 1.24,
              slashTilt: -0.35,
              shakeIntensity: 0.14,
              hitStop: 0.032,
              spawnDust: true,
              attackInstanceId,
            });
          } else if (isRunningAttack) {
            state.attackAnimType = 'sword_running_attack';
            state.attackAnimTimer = 0.46;
            animController.triggerUpperOneShot(KAEL_ANIM_STATES.LIGHT_ATTACK, 'SWORD_RUNNING_ATTACK', 0.05, 1.05);
            this._scheduleMeleeAttack({
              duration: 0.46,
              hitTime: 0.18,
              cancelStartTime: 0.30,
              lungeSpeed: 5.8,
              lungeStopTime: 0.26,
              damage: weapon.lightDamage + 8,
              range: weapon.range + 0.4,
              arcCos: -0.25,
              isHeavy: false,
              comboStep: 1,
              weaponSlot: 0,
              slashColor: 0x5be0ff,
              slashScale: 1.22,
              slashTilt: 0.14,
              shakeIntensity: 0.12,
              hitStop: 0.025,
              spawnDust: true,
              attackInstanceId,
            });
          } else {
            state.attackAnimType = 'sword_combo';
            const step = state.comboStep;
            const clipName = step === 1 ? 'COMBO_1' : step === 2 ? 'COMBO_2' : 'COMBO_3';
            const stateName = step === 1 ? KAEL_ANIM_STATES.LIGHT_ATTACK : KAEL_ANIM_STATES.COMBO;
            const timeScale = step === 3 ? 1.05 : 1.08;
            const duration = (step === 3 ? 0.56 : 0.42) / timeScale;
            state.attackAnimTimer = duration;

            if (step < 3 && isMoving) {
              animController.triggerUpperOneShot(stateName, clipName, 0.05, timeScale);
            } else {
              animController.triggerOneShot(stateName, clipName, 0.06, timeScale);
            }

            this._scheduleMeleeAttack({
              duration,
              hitTime: step === 1 ? 0.14 : step === 2 ? 0.15 : 0.26,
              cancelStartTime: step === 3 ? 0.38 : 0.24,
              lungeSpeed: step === 1 ? 3.2 : step === 2 ? 3.6 : 5.4,
              lungeStopTime: step === 3 ? 0.28 : 0.16,
              damage: step === 3 ? weapon.lightDamage + 12 : step === 2 ? weapon.lightDamage + 4 : weapon.lightDamage,
              range: step === 3 ? weapon.range + 0.45 : weapon.range,
              arcCos: step === 3 ? -0.55 : -0.15,
              isHeavy: false,
              comboStep: step,
              weaponSlot: 0,
              slashColor: step === 3 ? 0x72ebff : 0x38d4ff,
              slashScale: step === 3 ? 1.32 : step === 2 ? 1.1 : 1.05,
              slashTilt: step === 1 ? 0.08 : step === 2 ? -0.22 : 0.28,
              shakeIntensity: step === 3 ? 0.20 : 0.06,
              hitStop: step === 3 ? 0.042 : 0,
              spawnDust: step === 3,
              attackInstanceId,
            });
          }
        } else if (weapon.slotIndex === 1) {
          state.attackAnimType = 'axe_combo';
          const step = state.comboStep;
          const isRunningAttack = state.isRunning && currentSpeed > 4.6 && step === 1;
          const clipName = isRunningAttack
            ? 'AXE_RUNNING_ATTACK'
            : step === 1
              ? 'AXE_LIGHT_1'
              : step === 2
                ? 'AXE_LIGHT_2'
                : 'AXE_OVERHEAD';
          const stateName = step === 1 ? KAEL_ANIM_STATES.LIGHT_ATTACK : KAEL_ANIM_STATES.COMBO;
          const duration = isRunningAttack ? 0.52 : step === 3 ? 0.68 : 0.56;
          state.attackAnimTimer = duration;

          if (isRunningAttack) {
            animController.triggerUpperOneShot(stateName, clipName, 0.06, 1.0);
          } else {
            animController.triggerOneShot(stateName, clipName, 0.07, 1.0);
          }

          this._scheduleMeleeAttack({
            duration,
            hitTime: isRunningAttack ? 0.22 : step === 3 ? 0.34 : 0.24,
            cancelStartTime: step === 3 ? 0.50 : 0.38,
            lungeSpeed: isRunningAttack ? 5.2 : step === 3 ? 3.8 : 2.8,
            lungeStopTime: step === 3 ? 0.34 : 0.24,
            damage: step === 3 ? weapon.lightDamage + 16 : weapon.lightDamage + 4,
            range: step === 3 ? weapon.range + 0.5 : weapon.range,
            arcCos: step === 3 ? -0.25 : -0.35,
            isHeavy: false,
            comboStep: step,
            weaponSlot: 1,
            slashColor: 0xff9838,
            slashScale: step === 3 ? 1.38 : 1.22,
            slashTilt: isRunningAttack ? 0.15 : step === 1 ? 0.14 : step === 2 ? -0.22 : 1.38,
            shakeIntensity: step === 3 ? 0.24 : 0.11,
            hitStop: step === 3 ? 0.045 : 0.02,
            spawnDust: step === 3 || isRunningAttack,
            attackInstanceId,
          });
        } else {
          // Guardian Gauntlet / Hand-to-Hand 3-hit Martial Combo: Left Jab -> Right Cross -> Spinning Kick / Kick
          state.attackAnimType = 'hand_to_hand';
          const step = state.comboStep;
          const clipName = step === 1 ? 'PUNCH_LEFT' : step === 2 ? 'PUNCH_RIGHT' : 'SPINNING_KICK';
          const stateName = step === 1 ? KAEL_ANIM_STATES.LIGHT_ATTACK : KAEL_ANIM_STATES.COMBO;
          const duration = step === 1 ? 0.32 : step === 2 ? 0.34 : 0.58;
          state.attackAnimTimer = duration;

          if (step < 3 && isMoving) {
            animController.triggerUpperOneShot(stateName, clipName, 0.04, 1.08);
          } else {
            animController.triggerOneShot(stateName, clipName, 0.05, 1.04);
          }

          this._scheduleMeleeAttack({
            duration,
            hitTime: step === 1 ? 0.12 : step === 2 ? 0.13 : 0.27,
            cancelStartTime: step === 3 ? 0.40 : 0.21,
            lungeSpeed: step === 3 ? 5.0 : 3.4,
            lungeStopTime: step === 3 ? 0.28 : 0.14,
            damage: step === 3 ? weapon.lightDamage + 12 : weapon.lightDamage,
            range: step === 3 ? weapon.range + 0.45 : weapon.range,
            arcCos: step === 3 ? -0.55 : 0.05,
            isHeavy: false,
            comboStep: step,
            weaponSlot: 4,
            slashColor: 0xf3c969,
            slashScale: step === 3 ? 1.28 : 0.92,
            slashTilt: step === 1 ? -0.15 : step === 2 ? 0.15 : 0.08,
            shakeIntensity: step === 3 ? 0.22 : 0.06,
            hitStop: step === 3 ? 0.04 : 0,
            spawnDust: step === 3,
            attackInstanceId,
          });
        }
      }

      return {
        fired: true,
        weapon,
        isHeavy,
        comboStep: state.comboStep,
        attackInstanceId,
      };
    },

    triggerSpecial(energyCost = 30, cooldownSec = 4.0, powerId = 'energy_strike') {
      if (state.cooldowns.special > 0 || state.energy < energyCost || state.deathTimer > 0) return null;
      state.energy = Math.max(0, state.energy - energyCost);
      state.cooldowns.special = cooldownSec;
      state.combatStanceTimer = 4.5;
      state.attackAnimTimer = 0.54;
      state.attackAnimType = powerId === 'guardian_mode' ? 'guardian_mode' : 'special_power';
      state.attackInstanceCounter += 1;

      if (powerId === 'shadow_dash') {
        state.invulnTimer = Math.max(state.invulnTimer, 0.55);
        this.spawnShockwave(0x9b66ff, 4.4);
        animController.triggerOneShot(KAEL_ANIM_STATES.DODGE, 'DODGE_FORWARD', 0.04, 1.2);
      } else if (powerId === 'titan_shield') {
        state.titanShieldTimer = 6.0;
        this.spawnShockwave(0x4ce8ff, 5.2);
        animController.triggerOneShot(KAEL_ANIM_STATES.BLOCK, 'PERFECT_BLOCK', 0.05, 1.0);
      } else if (powerId === 'guardian_mode') {
        state.guardianModeTimer = 10.0;
        state.invulnTimer = Math.max(state.invulnTimer, 0.85);
        this.spawnShockwave(0xf3c969, 8.5);
        animController.triggerOneShot(KAEL_ANIM_STATES.GUARDIAN_MODE, 'GUARDIAN_MODE', 0.08, 1.0);
      } else {
        this.spawnShockwave(powerId === 'quantum_blast' ? 0xb44cff : 0x38d4ff, 5.8);
        animController.triggerOneShot(KAEL_ANIM_STATES.SPECIAL_POWER, 'SPECIAL_POWER', 0.07, 1.05);
      }
      return {
        attackInstanceId: `pwr_${state.attackInstanceCounter}`,
      };
    },

    triggerUltimate() {
      if (state.ultimateCharge < 100 || state.deathTimer > 0) return null;
      state.ultimateCharge = 0;
      state.invulnTimer = 0.9;
      state.attackAnimTimer = 0.72;
      state.attackAnimType = 'guardian_mode';
      state.attackInstanceCounter += 1;
      this.spawnShockwave(0x88ebff, 10.5);
      animController.triggerOneShot(KAEL_ANIM_STATES.GUARDIAN_MODE, 'GUARDIAN_MODE', 0.08, 1.0);
      return {
        attackInstanceId: `ult_${state.attackInstanceCounter}`,
      };
    },

    triggerPotion() {
      if (state.potions <= 0 || state.cooldowns.potion > 0 || state.hp >= state.maxHp) return false;
      state.potions -= 1;
      state.hp = Math.min(state.maxHp, state.hp + 95);
      state.cooldowns.potion = 3.5;
      return true;
    },

    spawnShockwave(colorHex, maxScale) {
      shockwaveMaxScale = maxScale;
      shockwaveTimer = 0.55;
      shockwaveRing.material.color.setHex(colorHex);
      shockwaveRing.position.set(root.position.x, root.position.y + 0.2, root.position.z);
      shockwaveRing.scale.set(1, 1, 1);
      shockwaveRing.visible = true;
    },

    receiveDamage(amount, attackerPos = null) {
      if (state.titanShieldTimer > 0 && state.deathTimer <= 0) {
        return { mitigated: 0, blocked: true, perfectBlock: false, titanShieldReflect: true };
      }
      if (state.invulnTimer > 0 || state.deathTimer > 0) {
        return { mitigated: 0, blocked: false, perfectBlock: false };
      }
      if (state.isBlocking) {
        if (isPerfectBlockWindow(state.blockStartElapsed, latestElapsed, 0.28)) {
          state.perfectBlockBannerTimer = 0.95;
          state.invulnTimer = 0.35;
          state.energy = Math.min(state.maxEnergy, state.energy + 18);
          state.attackAnimTimer = 0.30;
          state.attackAnimType = 'perfect_block';
          animController.triggerOneShot(KAEL_ANIM_STATES.BLOCK, 'PERFECT_BLOCK', 0.04, 1.15);
          return { mitigated: 0, blocked: true, perfectBlock: true };
        }
        state.stamina = Math.max(0, state.stamina - 6);
        const blockedDmg = Math.max(2, Math.round(amount * 0.25));
        state.hp = Math.max(0, state.hp - blockedDmg);
        return { mitigated: blockedDmg, blocked: true, perfectBlock: false };
      }
      pendingMeleeAttack.active = false;
      queuedAttackRequest = null;
      state.isChargingHeavy = false;
      state.heavyChargeElapsed = 0;
      state.hp = Math.max(0, state.hp - amount);

      if (attackerPos) {
        state.knockbackDir.subVectors(root.position, attackerPos).setY(0);
        if (state.knockbackDir.lengthSq() > 0.001) state.knockbackDir.normalize();
        else state.knockbackDir.set(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y)).normalize();
      } else {
        state.knockbackDir.set(Math.sin(root.rotation.y), 0, Math.cos(root.rotation.y)).normalize();
      }

      if (state.hp <= 0) {
        state.deathTimer = 1.6;
        animController.triggerOneShot(KAEL_ANIM_STATES.DEATH, 'DEATH', 0.1, 1.0);
      } else if (amount >= 24) {
        state.knockbackTimer = 0.44;
        state.recoveryTimer = 0.38;
        state.hitReactionTimer = 0;
        animController.triggerOneShot(KAEL_ANIM_STATES.KNOCKBACK, 'KNOCKBACK', 0.05, 1.0);
      } else {
        state.hitReactionTimer = 0.28;
        animController.triggerOneShot(KAEL_ANIM_STATES.HIT, 'HIT', 0.05, 1.0);
      }
      return { mitigated: amount, blocked: false, perfectBlock: false };
    },

    reset(spawnX = 0, spawnZ = 0) {
      root.position.set(spawnX, getTerrainHeight(spawnX, spawnZ), spawnZ);
      root.rotation.y = 0;
      targetRotationY = 0;
      currentSpeed = 0;
      state.hp = state.maxHp;
      state.energy = state.maxEnergy;
      state.stamina = state.maxStamina;
      ammoByWeapon[2] = 18;
      ammoByWeapon[3] = 24;
      syncAmmoForCurrentWeapon();
      state.potions = 3;
      state.verticalVel = 0;
      state.isGrounded = true;
      state.dodgeTimer = 0;
      state.dodgeCounterWindowTimer = 0;
      state.combatStanceTimer = 0;
      state.isChargingHeavy = false;
      state.heavyChargeElapsed = 0;
      state.titanShieldTimer = 0;
      state.guardianModeTimer = 0;
      state.invulnTimer = 0;
      state.isBlocking = false;
      state.isRunning = false;
      state.isAiming = false;
      state.isReloading = false;
      state.reloadTimer = 0;
      state.comboStep = 0;
      state.comboResetTimer = 0;
      state.hitReactionTimer = 0;
      state.knockbackTimer = 0;
      state.recoveryTimer = 0;
      state.deathTimer = 0;
      state.perfectBlockBannerTimer = 0;
      state.attackAnimTimer = 0;
      pendingMeleeAttack.active = false;
      queuedAttackRequest = null;
      completedMeleeHits.length = 0;
      state.animState = 'idle';
      state.animControllerState = KAEL_ANIM_STATES.IDLE;
      this.setAwakened(false);
      animController.resetToIdle();
    },

    update(dt, time, inputX, inputY, cameraYaw, overrideWalkSpeed = null, lockTargetPos = null, colliders = null) {
      latestElapsed = time;

      Object.keys(state.cooldowns).forEach((k) => {
        if (state.cooldowns[k] > 0) state.cooldowns[k] = Math.max(0, state.cooldowns[k] - dt);
      });
      if (state.invulnTimer > 0) state.invulnTimer = Math.max(0, state.invulnTimer - dt);
      if (state.dodgeCounterWindowTimer > 0) state.dodgeCounterWindowTimer = Math.max(0, state.dodgeCounterWindowTimer - dt);
      if (state.combatStanceTimer > 0) state.combatStanceTimer = Math.max(0, state.combatStanceTimer - dt);
      if (state.titanShieldTimer > 0) state.titanShieldTimer = Math.max(0, state.titanShieldTimer - dt);
      if (state.guardianModeTimer > 0) state.guardianModeTimer = Math.max(0, state.guardianModeTimer - dt);
      if (state.isChargingHeavy) {
        state.heavyChargeElapsed += dt;
        kaelRig.materials.cyanEnergy.emissiveIntensity = Math.min(4.2, 2.0 + state.heavyChargeElapsed * 3.0);
      } else {
        const empowered = state.isAwakened || state.guardianModeTimer > 0;
        kaelRig.materials.cyanEnergy.emissiveIntensity = empowered ? 3.4 : 1.75;
        kaelRig.materials.eyeIrisCyan.emissiveIntensity = empowered ? 2.8 : 1.35;
        kaelRig.fxNodes.guardianHandSymbolMat.opacity = empowered ? 1.0 : 0.65;
        kaelRig.fxNodes.guardianHandSymbol.scale.setScalar(empowered ? 2.1 : 1.0);
      }
      if (state.weaponSwitchAnim > 0) state.weaponSwitchAnim = Math.max(0, state.weaponSwitchAnim - dt);
      if (state.comboResetTimer > 0) {
        state.comboResetTimer = Math.max(0, state.comboResetTimer - dt);
        if (state.comboResetTimer === 0) state.comboStep = 0;
      }
      if (state.perfectBlockBannerTimer > 0) {
        state.perfectBlockBannerTimer = Math.max(0, state.perfectBlockBannerTimer - dt);
      }
      if (state.hitReactionTimer > 0) {
        state.hitReactionTimer = Math.max(0, state.hitReactionTimer - dt);
      }
      if (state.attackAnimTimer > 0) {
        state.attackAnimTimer = Math.max(0, state.attackAnimTimer - dt);
      }

      if (state.isReloading) {
        state.reloadTimer -= dt;
        if (state.reloadTimer <= 0) {
          const weapon = getWeaponByIndex(state.weaponIndex);
          state.isReloading = false;
          state.reloadTimer = 0;
          if (weapon.isRanged) {
            ammoByWeapon[weapon.slotIndex] = weapon.maxAmmo;
            state.ammo = weapon.maxAmmo;
          }
        }
      }

      if (state.deathTimer > 0) {
        state.deathTimer = Math.max(0, state.deathTimer - dt);
        const ctrlState = animController.update(dt, { isDead: true });
        state.animControllerState = ctrlState;
        state.animState = 'death';
        return;
      }

      state.energy = Math.min(state.maxEnergy, state.energy + dt * 5.2);
      state.ultimateCharge = Math.min(100, state.ultimateCharge + dt * 2.2);

      const inputMagnitude = Math.min(1, Math.hypot(inputX, inputY));
      const canSprint = state.isRunning && inputMagnitude > 0.15 && state.stamina > 1 && !state.isBlocking && !state.isAiming;
      if (canSprint) {
        state.stamina = Math.max(0, state.stamina - dt * 22);
      } else {
        state.stamina = Math.min(state.maxStamina, state.stamina + dt * 16);
      }

      let moveDirectionType = 'FORWARD';

      if (state.knockbackTimer > 0) {
        state.knockbackTimer = Math.max(0, state.knockbackTimer - dt);
        const kbSpeed = 5.8 * (state.knockbackTimer / 0.44);
        root.position.x = THREE.MathUtils.clamp(root.position.x + state.knockbackDir.x * kbSpeed * dt, -68, 68);
        root.position.z = THREE.MathUtils.clamp(root.position.z + state.knockbackDir.z * kbSpeed * dt, -68, 68);
        resolvePlayerCollisions(colliders);
      } else if (state.recoveryTimer > 0) {
        state.recoveryTimer = Math.max(0, state.recoveryTimer - dt);
      }

      if (state.dodgeTimer > 0) {
        state.dodgeTimer -= dt;
        const rollSpeed = 13.8;
        root.position.x = THREE.MathUtils.clamp(root.position.x + state.dodgeDir.x * rollSpeed * dt, -68, 68);
        root.position.z = THREE.MathUtils.clamp(root.position.z + state.dodgeDir.z * rollSpeed * dt, -68, 68);
        resolvePlayerCollisions(colliders);
      } else if (state.knockbackTimer <= 0 && state.recoveryTimer <= 0) {
        if (state.isAiming && overrideWalkSpeed === null) {
          targetRotationY = cameraYaw;
        } else if (lockTargetPos && overrideWalkSpeed === null && !canSprint) {
          targetRotationY = Math.atan2(
            -(lockTargetPos.x - root.position.x),
            -(lockTargetPos.z - root.position.z)
          );
        }

        if (overrideWalkSpeed !== null) {
          currentSpeed = overrideWalkSpeed;
        } else if (inputMagnitude > 0.06) {
          forward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
          right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

          moveDir.set(0, 0, 0)
            .addScaledVector(right, inputX)
            .addScaledVector(forward, inputY)
            .normalize();

          // Smooth speed tiers matched to Walk (2.4..3.8), Run (~6.0), and Sprint (~10.6)
          const guardianBoost = state.guardianModeTimer > 0 ? 1.28 : 1.0;
          const walkMax = 3.6 * guardianBoost;
          const runMax = 6.2 * guardianBoost;
          const sprintMax = 10.6 * guardianBoost;
          const targetSpeed = state.isBlocking
            ? 3.1 * inputMagnitude
            : state.isAiming
              ? 4.0 * inputMagnitude
              : canSprint
                ? sprintMax * Math.max(0.75, inputMagnitude)
                : inputMagnitude < 0.52
                  ? THREE.MathUtils.lerp(1.9, walkMax, inputMagnitude / 0.52)
                  : THREE.MathUtils.lerp(walkMax, runMax, (inputMagnitude - 0.52) / 0.48);

          const accelRate = targetSpeed > currentSpeed ? 9.5 : 12.0;
          currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, 1 - Math.exp(-accelRate * dt));

          root.position.x = THREE.MathUtils.clamp(root.position.x + moveDir.x * currentSpeed * dt, -68, 68);
          root.position.z = THREE.MathUtils.clamp(root.position.z + moveDir.z * currentSpeed * dt, -68, 68);
          resolvePlayerCollisions(colliders);

          if (!state.isAiming && !(lockTargetPos && !canSprint)) {
            targetRotationY = Math.atan2(-moveDir.x, -moveDir.z);
          } else {
            // Directional movement relative to Kael's locked/aim facing (-Z local forward)
            charForward.set(-Math.sin(root.rotation.y), 0, -Math.cos(root.rotation.y));
            charRight.set(Math.cos(root.rotation.y), 0, -Math.sin(root.rotation.y));
            const fwdDot = moveDir.dot(charForward);
            const rightDot = moveDir.dot(charRight);
            if (Math.abs(rightDot) > Math.abs(fwdDot) * 1.15) {
              moveDirectionType = rightDot >= 0 ? 'STRAFE_RIGHT' : 'STRAFE_LEFT';
            } else if (fwdDot < -0.25) {
              moveDirectionType = 'BACKWARD';
            }
          }
        } else {
          // Smooth momentum deceleration back to idle
          currentSpeed = THREE.MathUtils.lerp(currentSpeed, 0, 1 - Math.exp(-12.5 * dt));
          if (currentSpeed < 0.08) currentSpeed = 0;
          if (currentSpeed > 0.08) {
            charForward.set(-Math.sin(root.rotation.y), 0, -Math.cos(root.rotation.y));
            root.position.x = THREE.MathUtils.clamp(root.position.x + charForward.x * currentSpeed * dt * 0.35, -68, 68);
            root.position.z = THREE.MathUtils.clamp(root.position.z + charForward.z * currentSpeed * dt * 0.35, -68, 68);
            resolvePlayerCollisions(colliders);
          }
        }

        if (state.isAiming || lockTargetPos || inputMagnitude > 0.06) {
          const angleDiff = Math.atan2(
            Math.sin(targetRotationY - root.rotation.y),
            Math.cos(targetRotationY - root.rotation.y)
          );
          root.rotation.y += angleDiff * Math.min(1, dt * 13);
        }
      }

      const wasAirborne = !state.isGrounded;
      let justLanded = false;
      const groundY = getTerrainHeight(root.position.x, root.position.z);
      if (!state.isGrounded || root.position.y > groundY + 0.02) {
        state.verticalVel -= 23.5 * dt;
        root.position.y += state.verticalVel * dt;
        if (root.position.y <= groundY) {
          root.position.y = groundY;
          state.verticalVel = 0;
          state.isGrounded = true;
          if (wasAirborne) justLanded = true;
        }
      } else {
        root.position.y = THREE.MathUtils.lerp(root.position.y, groundY, Math.min(1, dt * 18));
      }

      // Guardian Chest Core, Hand Emblem & Ward Aura pulse
      const fx = kaelRig.fxNodes;
      fx.wardAura.visible = state.isBlocking || state.invulnTimer > 0 || state.isAwakened || state.titanShieldTimer > 0 || state.guardianModeTimer > 0;
      if (fx.wardAura.visible) {
        fx.wardAura.rotation.y = time * 2.4;
        const auraScale = state.titanShieldTimer > 0 ? (1.35 + Math.sin(time * 8) * 0.08) : 1.0;
        fx.wardAura.scale.setScalar(auraScale);
        fx.wardAura.material.color.setHex(
          state.perfectBlockBannerTimer > 0 || state.guardianModeTimer > 0
            ? 0xf3c969
            : state.titanShieldTimer > 0
              ? 0x4ce8ff
              : 0x38d4ff
        );
      }
      fx.guardianHandSymbol.rotation.z = time * 2.5;
      fx.emblemCyanCore.rotation.y = time * 1.2;

      if (shockwaveTimer > 0) {
        shockwaveTimer -= dt;
        const p = 1 - shockwaveTimer / 0.55;
        const s = 1 + p * shockwaveMaxScale;
        shockwaveRing.scale.set(s, s, s);
        shockwaveRing.material.opacity = (1 - p) * 0.9;
        if (shockwaveTimer <= 0) shockwaveRing.visible = false;
      }

      // Synchronized melee animation strike frame & root-motion lunge step
      if (pendingMeleeAttack.active) {
        pendingMeleeAttack.elapsed += dt;
        if (pendingMeleeAttack.lungeSpeed > 0 && pendingMeleeAttack.elapsed <= pendingMeleeAttack.lungeStopTime) {
          charForward.set(-Math.sin(root.rotation.y), 0, -Math.cos(root.rotation.y));
          root.position.x = THREE.MathUtils.clamp(root.position.x + charForward.x * pendingMeleeAttack.lungeSpeed * dt, -68, 68);
          root.position.z = THREE.MathUtils.clamp(root.position.z + charForward.z * pendingMeleeAttack.lungeSpeed * dt, -68, 68);
          resolvePlayerCollisions(colliders);
        }
        if (!pendingMeleeAttack.hitTriggered && pendingMeleeAttack.elapsed >= pendingMeleeAttack.hitTime) {
          pendingMeleeAttack.hitTriggered = true;
          completedMeleeHits.push({
            damage: pendingMeleeAttack.damage,
            range: pendingMeleeAttack.range,
            arcCos: pendingMeleeAttack.arcCos,
            isHeavy: pendingMeleeAttack.isHeavy,
            comboStep: pendingMeleeAttack.comboStep,
            weaponSlot: pendingMeleeAttack.weaponSlot,
            slashColor: pendingMeleeAttack.slashColor,
            slashScale: pendingMeleeAttack.slashScale,
            slashTilt: pendingMeleeAttack.slashTilt,
            isGroundSlam: pendingMeleeAttack.isGroundSlam,
            shakeIntensity: pendingMeleeAttack.shakeIntensity,
            hitStop: pendingMeleeAttack.hitStop,
            spawnDust: pendingMeleeAttack.spawnDust,
            attackInstanceId: pendingMeleeAttack.attackInstanceId,
          });
        }
        if (
          queuedAttackRequest &&
          pendingMeleeAttack.hitTriggered &&
          pendingMeleeAttack.elapsed >= pendingMeleeAttack.cancelStartTime
        ) {
          const req = queuedAttackRequest;
          queuedAttackRequest = null;
          pendingMeleeAttack.active = false;
          if (req.weaponIndex === state.weaponIndex) {
            state.cooldowns.light = 0;
            this.triggerAttack(false);
          }
        } else if (pendingMeleeAttack.elapsed >= pendingMeleeAttack.duration) {
          const chainRecovery = pendingMeleeAttack.chainRecoveryClip;
          pendingMeleeAttack.active = false;
          pendingMeleeAttack.chainRecoveryClip = null;
          if (chainRecovery === 'AXE_RECOVERY') {
            state.recoveryTimer = 0.28;
            animController.triggerOneShot(KAEL_ANIM_STATES.RECOVERY, 'AXE_RECOVERY', 0.05, 1.0);
          }
        }
      }

      const speedRatio = THREE.MathUtils.clamp(currentSpeed / 10.6, 0, 1);
      const combatStanceClip = state.combatStanceTimer > 0
        ? (state.weaponIndex === 0 ? 'SWORD_READY' : state.weaponIndex === 1 ? 'AXE_READY' : null)
        : null;

      const ctrlState = animController.update(dt, {
        isDead: state.deathTimer > 0,
        isHit: state.hitReactionTimer > 0,
        isKnockback: state.knockbackTimer > 0,
        isRecovering: state.knockbackTimer <= 0 && state.recoveryTimer > 0,
        isDodging: state.dodgeTimer > 0,
        dodgeClipKey: state.dodgeClipKey,
        isReloading: state.isReloading,
        isBlocking: state.isBlocking,
        isPerfectBlock: state.perfectBlockBannerTimer > 0.5,
        isAiming: state.isAiming,
        isGrounded: state.isGrounded,
        verticalVel: state.verticalVel,
        justLanded,
        speedRatio,
        currentSpeed,
        isSprinting: canSprint,
        isRunning: speedRatio > 0.38,
        moveDirectionType,
        combatStanceClip,
      });

      state.animControllerState = ctrlState;
      state.animState = mapControllerStateToHud(ctrlState);
    },
  };
}
