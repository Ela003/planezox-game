import * as THREE from 'three';

/**
 * Canonical Animation State Machine for Hero KAEL.
 * Supports full-body locomotion/heavy combat on `mixer` plus upper-body layered
 * actions on `upperMixer` so Kael can move his legs naturally while aiming, shooting,
 * reloading, blocking, switching weapons, or performing mobile light strikes.
 */
export const KAEL_ANIM_STATES = Object.freeze({
  IDLE: 'IDLE',
  WALK: 'WALK',
  RUN: 'RUN',
  SPRINT: 'SPRINT',
  STRAFE_LEFT: 'STRAFE_LEFT',
  STRAFE_RIGHT: 'STRAFE_RIGHT',
  BACKWARD_WALK: 'BACKWARD_WALK',
  JUMP: 'JUMP',
  FALL: 'FALL',
  LAND: 'LAND',
  LIGHT_ATTACK: 'LIGHT_ATTACK',
  HEAVY_ATTACK: 'HEAVY_ATTACK',
  COMBO: 'COMBO',
  BLOCK: 'BLOCK',
  DODGE: 'DODGE',
  SHOOT: 'SHOOT',
  RELOAD: 'RELOAD',
  AIM: 'AIM',
  WEAPON_SWITCH: 'WEAPON_SWITCH',
  HIT: 'HIT',
  KNOCKBACK: 'KNOCKBACK',
  RECOVERY: 'RECOVERY',
  DEATH: 'DEATH',
  SPECIAL_POWER: 'SPECIAL_POWER',
  GUARDIAN_MODE: 'GUARDIAN_MODE',
});

const ONE_SHOT_STATES = new Set([
  KAEL_ANIM_STATES.JUMP,
  KAEL_ANIM_STATES.LAND,
  KAEL_ANIM_STATES.LIGHT_ATTACK,
  KAEL_ANIM_STATES.HEAVY_ATTACK,
  KAEL_ANIM_STATES.COMBO,
  KAEL_ANIM_STATES.DODGE,
  KAEL_ANIM_STATES.SHOOT,
  KAEL_ANIM_STATES.RELOAD,
  KAEL_ANIM_STATES.WEAPON_SWITCH,
  KAEL_ANIM_STATES.HIT,
  KAEL_ANIM_STATES.KNOCKBACK,
  KAEL_ANIM_STATES.RECOVERY,
  KAEL_ANIM_STATES.DEATH,
  KAEL_ANIM_STATES.SPECIAL_POWER,
  KAEL_ANIM_STATES.GUARDIAN_MODE,
]);

const UPPER_BODY_BONES = new Set([
  'Spine',
  'Chest',
  'Neck',
  'Head',
  'LeftShoulder',
  'LeftUpperArm',
  'LeftForearm',
  'LeftHand',
  'RightShoulder',
  'RightUpperArm',
  'RightForearm',
  'RightHand',
]);

function filterUpperBodyClip(clip) {
  if (!clip || !Array.isArray(clip.tracks)) return null;
  const upperTracks = clip.tracks.filter((track) => {
    const dotIdx = track.name.indexOf('.');
    const boneName = dotIdx >= 0 ? track.name.slice(0, dotIdx) : track.name;
    return UPPER_BODY_BONES.has(boneName);
  });
  if (upperTracks.length === 0) return null;
  return new THREE.AnimationClip(`${clip.name}_UPPER`, clip.duration, upperTracks);
}

export class KaelAnimationController {
  constructor(rootObject, clipsMap) {
    this.mixer = new THREE.AnimationMixer(rootObject);
    this.upperMixer = new THREE.AnimationMixer(rootObject);
    this.clips = clipsMap;
    this.upperClips = {};
    this.actions = {};
    this.upperActions = {};
    this.currentState = KAEL_ANIM_STATES.IDLE;
    this.currentClipKey = 'IDLE';
    this.activeAction = null;
    this.activeOneShotState = null;
    this.oneShotTimer = 0;

    this.activeUpperAction = null;
    this.activeUpperState = null;
    this.upperOneShotTimer = 0;
    this.activeUpperClipKey = null;

    this.idleLookTimer = 0;

    this._buildActions(clipsMap);

    this.mixer.addEventListener('finished', (event) => {
      if (
        this.activeOneShotState &&
        event.action === this.activeAction &&
        this.activeOneShotState !== KAEL_ANIM_STATES.DEATH
      ) {
        this.activeOneShotState = null;
        this.oneShotTimer = 0;
      }
    });

    this.upperMixer.addEventListener('finished', (event) => {
      if (this.activeUpperOneShot && event.action === this.activeUpperAction) {
        this._clearUpperLayer(0.10);
      }
    });

    if (this.actions.IDLE) {
      this.activeAction = this.actions.IDLE;
      this.activeAction.play();
    }
  }

  _buildActions(clipsMap) {
    this.actions = {};
    this.upperActions = {};
    this.upperClips = {};
    Object.entries(clipsMap).forEach(([key, clip]) => {
      this.actions[key] = this.mixer.clipAction(clip);
      const upperClip = filterUpperBodyClip(clip);
      if (upperClip) {
        this.upperClips[key] = upperClip;
        this.upperActions[key] = this.upperMixer.clipAction(upperClip);
      }
    });
  }

  /**
   * Swaps in external GLB AnimationMixer & AnimationClips if an artist-authored
   * kael_hero.glb model is loaded at runtime.
   */
  bindExternalGlb(glbScene, gltfAnimations) {
    this.mixer.stopAllAction();
    this.upperMixer.stopAllAction();
    this.mixer = new THREE.AnimationMixer(glbScene);
    this.upperMixer = new THREE.AnimationMixer(glbScene);
    const clipLookup = { ...this.clips };
    gltfAnimations.forEach((clip) => {
      const normalized = clip.name.toUpperCase().replace(/[\s-]+/g, '_');
      clipLookup[normalized] = clip;
    });
    this._buildActions(clipLookup);
    this.activeAction = this.actions.IDLE || Object.values(this.actions)[0] || null;
    if (this.activeAction) this.activeAction.play();
    this.activeUpperAction = null;
    this.activeUpperOneShot = false;
    this.activeUpperState = null;
  }

  _clearUpperLayer(fadeOut = 0.08) {
    if (this.activeUpperAction) {
      this.activeUpperAction.fadeOut(fadeOut);
      this.activeUpperAction = null;
    }
    this.activeUpperOneShot = false;
    this.activeUpperState = null;
    this.activeUpperClipKey = null;
    this.upperOneShotTimer = 0;
  }

  cancelCombatActions() {
    if (
      this.activeOneShotState === KAEL_ANIM_STATES.LIGHT_ATTACK ||
      this.activeOneShotState === KAEL_ANIM_STATES.HEAVY_ATTACK ||
      this.activeOneShotState === KAEL_ANIM_STATES.COMBO ||
      this.activeOneShotState === KAEL_ANIM_STATES.SHOOT ||
      this.activeOneShotState === KAEL_ANIM_STATES.RELOAD ||
      this.activeOneShotState === KAEL_ANIM_STATES.WEAPON_SWITCH
    ) {
      this.activeOneShotState = null;
      this.oneShotTimer = 0;
    }
    this._clearUpperLayer(0.05);
  }

  _transitionTo(state, clipKey, fadeSeconds = 0.16, timeScale = 1.0, forceRestart = false) {
    const resolvedKey = this.actions[clipKey] ? clipKey : (this.actions[state] ? state : 'IDLE');
    const nextAction = this.actions[resolvedKey];
    if (!nextAction) return;

    const isOneShot = ONE_SHOT_STATES.has(state);

    if (this.activeAction === nextAction && !forceRestart) {
      nextAction.setEffectiveTimeScale(timeScale);
      this.currentState = state;
      this.currentClipKey = resolvedKey;
      return;
    }

    nextAction.reset();
    nextAction.setEffectiveTimeScale(timeScale);
    nextAction.setEffectiveWeight(1);
    if (isOneShot) {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
      nextAction.clampWhenFinished = false;
    }

    nextAction.play();
    if (this.activeAction && this.activeAction !== nextAction) {
      this.activeAction.crossFadeTo(nextAction, fadeSeconds, true);
    }

    this.activeAction = nextAction;
    this.currentState = state;
    this.currentClipKey = resolvedKey;
  }

  triggerOneShot(state, clipKey = state, fadeSeconds = 0.08, timeScale = 1.0) {
    if (this.currentState === KAEL_ANIM_STATES.DEATH && state !== KAEL_ANIM_STATES.IDLE) return;
    // Full-body one-shots take control cleanly away from upper-body overlay
    this._clearUpperLayer(0.04);
    const resolvedKey = this.actions[clipKey] ? clipKey : state;
    const clip = this.clips[resolvedKey] || this.clips[state];
    this.activeOneShotState = state;
    this.oneShotTimer = clip ? (clip.duration / Math.max(0.2, timeScale)) : 0.35;
    this._transitionTo(state, resolvedKey, fadeSeconds, timeScale, true);
  }

  triggerUpperOneShot(state, clipKey = state, fadeSeconds = 0.06, timeScale = 1.0) {
    if (this.currentState === KAEL_ANIM_STATES.DEATH) return;
    const resolvedKey = this.upperActions[clipKey] ? clipKey : (this.upperActions[state] ? state : null);
    if (!resolvedKey) {
      this.triggerOneShot(state, clipKey, fadeSeconds, timeScale);
      return;
    }
    const nextAction = this.upperActions[resolvedKey];
    const clip = this.upperClips[resolvedKey];

    nextAction.reset();
    nextAction.setEffectiveTimeScale(timeScale);
    nextAction.setEffectiveWeight(1);
    nextAction.setLoop(THREE.LoopOnce, 1);
    nextAction.clampWhenFinished = true;
    nextAction.play();

    if (this.activeUpperAction && this.activeUpperAction !== nextAction) {
      this.activeUpperAction.crossFadeTo(nextAction, fadeSeconds, true);
    }

    this.activeUpperAction = nextAction;
    this.activeUpperState = state;
    this.activeUpperClipKey = resolvedKey;
    this.activeUpperOneShot = true;
    this.upperOneShotTimer = clip ? (clip.duration / Math.max(0.2, timeScale)) : 0.35;
  }

  _setUpperLoop(state, clipKey, fadeSeconds = 0.10, timeScale = 1.0) {
    const resolvedKey = this.upperActions[clipKey] ? clipKey : null;
    if (!resolvedKey) return;
    const nextAction = this.upperActions[resolvedKey];
    if (this.activeUpperAction === nextAction && !this.activeUpperOneShot) {
      nextAction.setEffectiveTimeScale(timeScale);
      this.activeUpperState = state;
      this.activeUpperClipKey = resolvedKey;
      return;
    }
    nextAction.reset();
    nextAction.setEffectiveTimeScale(timeScale);
    nextAction.setEffectiveWeight(1);
    nextAction.setLoop(THREE.LoopRepeat, Infinity);
    nextAction.clampWhenFinished = false;
    nextAction.play();
    if (this.activeUpperAction && this.activeUpperAction !== nextAction) {
      this.activeUpperAction.crossFadeTo(nextAction, fadeSeconds, true);
    }
    this.activeUpperAction = nextAction;
    this.activeUpperState = state;
    this.activeUpperClipKey = resolvedKey;
    this.activeUpperOneShot = false;
  }

  resetToIdle() {
    this.activeOneShotState = null;
    this.oneShotTimer = 0;
    this.idleLookTimer = 0;
    this._clearUpperLayer(0.05);
    this._transitionTo(KAEL_ANIM_STATES.IDLE, 'IDLE', 0.12, 1.0, true);
  }

  /**
   * Evaluates priority rules, full-body + upper-body mixers, and returns active semantic state.
   */
  update(dt, ctx) {
    const {
      isDead = false,
      isHit = false,
      isKnockback = false,
      isRecovering = false,
      isDodging = false,
      dodgeClipKey = 'DODGE',
      isReloading = false,
      isBlocking = false,
      isPerfectBlock = false,
      isAiming = false,
      isGrounded = true,
      verticalVel = 0,
      justLanded = false,
      speedRatio = 0,
      currentSpeed = 0,
      isSprinting = false,
      isRunning = false,
      moveDirectionType = 'FORWARD', // FORWARD | BACKWARD | STRAFE_LEFT | STRAFE_RIGHT
      combatStanceClip = null,
    } = ctx;

    // 1. Highest priority: DEATH
    if (isDead) {
      if (this.currentState !== KAEL_ANIM_STATES.DEATH) {
        this.triggerOneShot(KAEL_ANIM_STATES.DEATH, 'DEATH', 0.12, 1.0);
      }
      this.mixer.update(dt);
      return this.currentState;
    }

    // Decrement failsafe timers
    if (this.activeOneShotState) {
      this.oneShotTimer -= dt;
      if (this.oneShotTimer <= 0 && !isReloading && !isDodging && !isHit && !isKnockback) {
        this.activeOneShotState = null;
      }
    }
    if (this.activeUpperOneShot) {
      this.upperOneShotTimer -= dt;
      if (this.upperOneShotTimer <= 0 && !isReloading) {
        this._clearUpperLayer(0.08);
      }
    }

    // 2. Full-body high-priority combat / defensive states
    if (isDodging && this.activeOneShotState !== KAEL_ANIM_STATES.DODGE) {
      this.triggerOneShot(KAEL_ANIM_STATES.DODGE, dodgeClipKey, 0.05, 1.05);
    } else if (isKnockback && this.activeOneShotState !== KAEL_ANIM_STATES.KNOCKBACK) {
      this.triggerOneShot(KAEL_ANIM_STATES.KNOCKBACK, 'KNOCKBACK', 0.05, 1.0);
    } else if (isRecovering && this.activeOneShotState !== KAEL_ANIM_STATES.RECOVERY) {
      this.triggerOneShot(KAEL_ANIM_STATES.RECOVERY, 'RECOVERY', 0.08, 1.0);
    } else if (isHit && !this.activeOneShotState) {
      this.triggerOneShot(KAEL_ANIM_STATES.HIT, 'HIT', 0.05, 1.0);
    } else if (isPerfectBlock && this.activeOneShotState !== KAEL_ANIM_STATES.BLOCK) {
      this.triggerOneShot(KAEL_ANIM_STATES.BLOCK, 'PERFECT_BLOCK', 0.04, 1.15);
    } else if (!this.activeOneShotState) {
      // 3. Base locomotion & airborne state machine on full-body mixer
      if (!isGrounded) {
        if (verticalVel > 1.2) {
          this._transitionTo(KAEL_ANIM_STATES.JUMP, 'JUMP', 0.08, 1.0);
        } else {
          this._transitionTo(KAEL_ANIM_STATES.FALL, 'FALL', 0.14, 1.0);
        }
      } else if (justLanded) {
        this.triggerOneShot(KAEL_ANIM_STATES.LAND, 'LAND', 0.06, 1.0);
      } else if (isBlocking && speedRatio <= 0.06) {
        // Stationary full-body block stance
        this._transitionTo(KAEL_ANIM_STATES.BLOCK, 'BLOCK', 0.09, 1.0);
      } else if (speedRatio > 0.045) {
        this.idleLookTimer = 0;
        const speedNorm = currentSpeed > 0 ? currentSpeed : speedRatio * 10.6;
        if (moveDirectionType === 'BACKWARD') {
          const ts = THREE.MathUtils.clamp(speedNorm / 3.2, 0.72, 1.35);
          this._transitionTo(KAEL_ANIM_STATES.BACKWARD_WALK, 'WALK_BACKWARD', 0.14, ts);
        } else if (moveDirectionType === 'STRAFE_LEFT') {
          const ts = THREE.MathUtils.clamp(speedNorm / 3.6, 0.75, 1.4);
          this._transitionTo(KAEL_ANIM_STATES.STRAFE_LEFT, 'STRAFE_LEFT', 0.14, ts);
        } else if (moveDirectionType === 'STRAFE_RIGHT') {
          const ts = THREE.MathUtils.clamp(speedNorm / 3.6, 0.75, 1.4);
          this._transitionTo(KAEL_ANIM_STATES.STRAFE_RIGHT, 'STRAFE_RIGHT', 0.14, ts);
        } else if (isSprinting && speedRatio > 0.62) {
          const ts = THREE.MathUtils.clamp(speedNorm / 9.2, 0.88, 1.28);
          this._transitionTo(KAEL_ANIM_STATES.SPRINT, 'SPRINT', 0.14, ts);
        } else if (isRunning || speedRatio > 0.36) {
          const ts = THREE.MathUtils.clamp(speedNorm / 5.4, 0.78, 1.3);
          this._transitionTo(KAEL_ANIM_STATES.RUN, 'RUN', 0.14, ts);
        } else {
          const ts = THREE.MathUtils.clamp(speedNorm / 2.8, 0.65, 1.32);
          this._transitionTo(KAEL_ANIM_STATES.WALK, 'WALK', 0.16, ts);
        }
      } else if (combatStanceClip && this.actions[combatStanceClip]) {
        // Alert weapon guard stance (SWORD_READY / AXE_READY) while engaged in combat
        this.idleLookTimer = 0;
        this._transitionTo(KAEL_ANIM_STATES.IDLE, combatStanceClip, 0.18, 1.0);
      } else {
        // Calm IDLE + periodic LOOK_AROUND variation
        this.idleLookTimer += dt;
        if (this.idleLookTimer > 7.5) {
          this.idleLookTimer = 0;
          this._transitionTo(KAEL_ANIM_STATES.IDLE, 'LOOK_AROUND', 0.24, 1.0, true);
        } else if (this.currentClipKey !== 'LOOK_AROUND' || this.idleLookTimer > 3.1) {
          this._transitionTo(KAEL_ANIM_STATES.IDLE, 'IDLE', 0.22, 1.0);
        }
      }
    }

    // 4. Upper-body overlay arbitration (allows walking/strafing during block, aim, reload, light upper-body actions)
    if (!this.activeOneShotState && !isDodging && !isKnockback && !isRecovering && !isHit) {
      if (isReloading && !this.activeUpperOneShot) {
        this.triggerUpperOneShot(KAEL_ANIM_STATES.RELOAD, 'RELOAD', 0.08, 1.0);
      } else if (!this.activeUpperOneShot) {
        if (isBlocking && speedRatio > 0.06) {
          const blockClip =
            (moveDirectionType === 'STRAFE_LEFT' || moveDirectionType === 'STRAFE_RIGHT') &&
            this.upperActions.BLOCK_SIDE
              ? 'BLOCK_SIDE'
              : 'BLOCK';
          this._setUpperLoop(KAEL_ANIM_STATES.BLOCK, blockClip, 0.09, 1.0);
        } else if (isAiming && this.upperActions.AIM_RIFLE) {
          this._setUpperLoop(KAEL_ANIM_STATES.AIM, 'AIM_RIFLE', 0.10, 1.0);
        } else if (this.activeUpperAction) {
          this._clearUpperLayer(0.10);
        }
      }
    } else if (this.activeOneShotState && this.activeUpperAction) {
      this._clearUpperLayer(0.04);
    }

    this.mixer.update(dt);
    if (this.activeUpperAction) {
      this.upperMixer.update(dt);
      return this.activeUpperState || this.currentState;
    }
    return this.currentState;
  }
}

