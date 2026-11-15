import * as THREE from 'three';

/**
 * Centralized Combat, Weapons, Guardian Powers, and Visual Effects System
 * for WARMIER: THE RISE OF THE CYCLOPS.
 */

export const WEAPONS = [
  {
    slotIndex: 0,
    id: 'guardian_sword',
    name: 'Guardian Sword',
    shortName: 'Sword',
    category: 'MELEE',
    isRanged: false,
    lightDamage: 25,
    heavyDamage: 60,
    projectileDamage: 0,
    attackSpeed: 1.35,
    lightCooldown: 0.30,
    heavyCooldown: 1.55,
    range: 3.4,
    maxAmmo: 0,
    reloadDuration: 0,
    unlocked: true,
    accentHex: '#38D4FF',
    description: 'High-speed energy blade with crisp 3-hit sword combo and counter slash.',
  },
  {
    slotIndex: 1,
    id: 'quantum_axe',
    name: 'Quantum Axe',
    shortName: 'Axe',
    category: 'MELEE',
    isRanged: false,
    lightDamage: 25,
    heavyDamage: 60,
    projectileDamage: 0,
    attackSpeed: 0.95,
    lightCooldown: 0.44,
    heavyCooldown: 1.85,
    range: 3.9,
    maxAmmo: 0,
    reloadDuration: 0,
    unlocked: true,
    accentHex: '#FF9838',
    description: 'Heavy quantum cleaver delivering sweeping axe combos and ground-slam shockwaves.',
  },
  {
    slotIndex: 2,
    id: 'plasma_rifle',
    name: 'Plasma Rifle',
    shortName: 'Rifle',
    category: 'RANGED',
    isRanged: true,
    lightDamage: 25,
    heavyDamage: 60,
    projectileDamage: 35,
    attackSpeed: 1.25,
    lightCooldown: 0.24,
    heavyCooldown: 1.20,
    range: 36.0,
    maxAmmo: 18,
    reloadDuration: 1.5,
    unlocked: true,
    accentHex: '#4CE8FF',
    description: 'Long-range precision plasma carbine with manual aim reticle and mobile auto-aim.',
  },
  {
    slotIndex: 3,
    id: 'dual_blasters',
    name: 'Dual Energy Blasters',
    shortName: 'Blasters',
    category: 'RANGED',
    isRanged: true,
    lightDamage: 25,
    heavyDamage: 60,
    projectileDamage: 35,
    attackSpeed: 1.65,
    lightCooldown: 0.18,
    heavyCooldown: 1.05,
    range: 28.0,
    maxAmmo: 24,
    reloadDuration: 1.3,
    unlocked: true,
    accentHex: '#A67BFF',
    description: 'Rapid-fire twin cyber blasters alternating twin bolts at high cadence.',
  },
  {
    slotIndex: 4,
    id: 'guardian_gauntlet',
    name: 'Guardian Gauntlet',
    shortName: 'Gauntlet',
    category: 'MELEE',
    isRanged: false,
    lightDamage: 25,
    heavyDamage: 60,
    projectileDamage: 0,
    attackSpeed: 1.45,
    lightCooldown: 0.26,
    heavyCooldown: 1.45,
    range: 3.2,
    maxAmmo: 0,
    reloadDuration: 0,
    unlocked: true,
    accentHex: '#F3C969',
    description: 'Kinetic energy gauntlets built for Energy Punches, Ground Slams, and Finishing Strikes.',
  },
];

export const GUARDIAN_POWERS = [
  {
    id: 'energy_strike',
    name: 'Energy Strike',
    description: 'Channels Kael’s hand emblem into a 75-damage Guardian arc shockwave.',
    energyCost: 30,
    cooldown: 4.0,
    damage: 75,
    unlockChapter: 1,
    unlocked: true,
  },
  {
    id: 'shadow_dash',
    name: 'Shadow Dash',
    description: 'Phase-step through alien fire leaving an afterimage shock trail.',
    energyCost: 25,
    cooldown: 5.0,
    damage: 45,
    unlockChapter: 2,
    unlocked: false,
  },
  {
    id: 'plasma_blast',
    name: 'Plasma Blast',
    description: 'Fires an overcharged core beam that pierces Cyclops armor.',
    energyCost: 40,
    cooldown: 6.5,
    damage: 110,
    unlockChapter: 3,
    unlocked: false,
  },
  {
    id: 'titan_shield',
    name: 'Titan Shield',
    description: 'Projects a 360-degree Guardian barrier that reflects projectiles.',
    energyCost: 35,
    cooldown: 8.0,
    damage: 50,
    unlockChapter: 4,
    unlocked: false,
  },
  {
    id: 'gravity_control',
    name: 'Gravity Control',
    description: 'Suspends nearby Cyclops units inside a crushing stasis field.',
    energyCost: 45,
    cooldown: 10.0,
    damage: 90,
    unlockChapter: 5,
    unlocked: false,
  },
  {
    id: 'quantum_blast',
    name: 'Quantum Blast',
    description: 'Detonates a multi-ring quantum singularity at the locked target.',
    energyCost: 55,
    cooldown: 12.0,
    damage: 155,
    unlockChapter: 6,
    unlocked: false,
  },
  {
    id: 'guardian_mode',
    name: 'Guardian Mode',
    description: 'Full Eternity Core transcendence amplifying all attacks and speed.',
    energyCost: 80,
    cooldown: 22.0,
    damage: 220,
    unlockChapter: 7,
    unlocked: false,
  },
];

export function getWeaponByIndex(slotIndex) {
  return WEAPONS.find((w) => w.slotIndex === slotIndex) || WEAPONS[0];
}

export function unlockPower(powerId) {
  const power = GUARDIAN_POWERS.find((p) => p.id === powerId);
  if (power) {
    power.unlocked = true;
  }
  return power || null;
}

export function unlockPowersUpToChapter(chapterNum = 1) {
  const cap = Number(chapterNum) || 1;
  GUARDIAN_POWERS.forEach((p) => {
    p.unlocked = p.unlockChapter <= cap;
  });
  return GUARDIAN_POWERS;
}

export function isPerfectBlockWindow(blockStartElapsed, currentElapsed, windowSeconds = 0.28) {
  return blockStartElapsed >= 0 && (currentElapsed - blockStartElapsed) <= windowSeconds;
}

export function computeKnockbackVector(attackerPos, targetPos, force = 6.5) {
  const dir = new THREE.Vector3().subVectors(targetPos, attackerPos);
  dir.y = 0;
  if (dir.lengthSq() < 0.0001) {
    dir.set(0, 0, -1);
  } else {
    dir.normalize();
  }
  return dir.multiplyScalar(force);
}

/**
 * Resolves a single hit with per-attackInstanceId deduplication so one swing
 * cannot damage the same enemy twice across frames.
 */
export function resolveAttackHit(hitRegistry, attackInstanceId, targetId) {
  if (!attackInstanceId) return true;
  let set = hitRegistry.get(attackInstanceId);
  if (!set) {
    set = new Set();
    hitRegistry.set(attackInstanceId, set);
    if (hitRegistry.size > 24) {
      const oldestKey = hitRegistry.keys().next().value;
      hitRegistry.delete(oldestKey);
    }
  }
  if (set.has(targetId)) return false;
  set.add(targetId);
  return true;
}

/**
 * Pooled / lightweight 3D Visual Effects manager for:
 * - Sword slash arcs
 * - Ground slam & axe shockwaves
 * - Red enemy impact bursts
 * - Blue energy trails (dodge / sprint / Energy Strike)
 * - Shield / Perfect Block dome bursts
 * - Glowing Plasma projectiles
 */
export function createCombatVfx(scene) {
  const effects = [];
  const pool = new Map();
  let qualityLevel = 'medium';

  const slashGeo = new THREE.TorusGeometry(1.75, 0.065, 6, 18, Math.PI * 0.85);
  const shockGeo = new THREE.RingGeometry(0.45, 0.95, 24);
  shockGeo.rotateX(-Math.PI / 2);
  const sparkGeo = new THREE.OctahedronGeometry(0.16, 0);
  const trailGeo = new THREE.SphereGeometry(0.24, 8, 6);
  const domeGeo = new THREE.SphereGeometry(1.45, 14, 10);
  const beamGeo = new THREE.CylinderGeometry(0.26, 0.42, 1.0, 10, 1, true);
  beamGeo.rotateX(Math.PI / 2);

  function acquireMesh(kind, geometry, materialConfig) {
    let bucket = pool.get(kind);
    if (!bucket) {
      bucket = [];
      pool.set(kind, bucket);
    }
    const recycled = bucket.pop();
    if (recycled) {
      recycled.material.color.setHex(materialConfig.color);
      recycled.material.opacity = materialConfig.opacity;
      recycled.material.wireframe = Boolean(materialConfig.wireframe);
      recycled.scale.set(1, 1, 1);
      recycled.rotation.set(0, 0, 0);
      recycled.visible = true;
      return recycled;
    }
    const mat = new THREE.MeshBasicMaterial({
      color: materialConfig.color,
      transparent: true,
      opacity: materialConfig.opacity,
      side: materialConfig.side || THREE.FrontSide,
      wireframe: Boolean(materialConfig.wireframe),
    });
    return new THREE.Mesh(geometry, mat);
  }

  function releaseEffect(fx) {
    fx.mesh.visible = false;
    scene.remove(fx.mesh);
    let bucket = pool.get(fx.kind);
    if (!bucket) {
      bucket = [];
      pool.set(fx.kind, bucket);
    }
    if (bucket.length < 32) {
      bucket.push(fx.mesh);
    } else if (fx.mesh.material) {
      fx.mesh.material.dispose();
    }
  }

  function spawnMeshEffect(kind, mesh, life, onUpdate) {
    const maxEffects = qualityLevel === 'low' ? 24 : qualityLevel === 'medium' ? 42 : 64;
    if (effects.length >= maxEffects) {
      const oldest = effects.shift();
      releaseEffect(oldest);
    }
    scene.add(mesh);
    effects.push({ kind, mesh, life, maxLife: life, onUpdate });
  }

  return {
    setQuality(level) {
      qualityLevel = level || 'medium';
    },

    spawnSlashArc(originPos, yaw, colorHex = 0x38d4ff, scale = 1.0, tilt = 0) {
      const mesh = acquireMesh('slash', slashGeo, {
        color: colorHex,
        opacity: 0.92,
        side: THREE.DoubleSide,
      });
      mesh.position.set(originPos.x, originPos.y + 1.2, originPos.z);
      mesh.rotation.x = Math.PI * 0.5 + tilt;
      mesh.rotation.z = yaw + Math.PI * 0.58;
      mesh.scale.setScalar(scale);
      spawnMeshEffect('slash', mesh, 0.26, (p) => {
        mesh.scale.setScalar(scale * (1 + p * 0.45));
        mesh.material.opacity = (1 - p) * 0.92;
      });
    },

    spawnGroundDust(pos, count = 4, spread = 1.15) {
      const scaled = qualityLevel === 'low' ? Math.max(2, Math.floor(count * 0.5)) : count;
      for (let i = 0; i < scaled; i++) {
        const puff = acquireMesh('trail', trailGeo, {
          color: 0xc2b296,
          opacity: 0.42,
        });
        const angle = (i / scaled) * Math.PI * 2 + Math.random() * 0.5;
        const speed = spread * (1.2 + Math.random() * 1.4);
        const vx = Math.cos(angle) * speed;
        const vz = Math.sin(angle) * speed;
        puff.position.set(pos.x, pos.y + 0.16, pos.z);
        puff.scale.setScalar(0.85);
        spawnMeshEffect('trail', puff, 0.38, (p, dt) => {
          puff.position.x += vx * dt;
          puff.position.y += 0.55 * dt;
          puff.position.z += vz * dt;
          puff.scale.setScalar(0.85 + p * 1.35);
          puff.material.opacity = (1 - p) * 0.42;
        });
      }
    },

    spawnGroundShockwave(pos, colorHex = 0xff9838, maxScale = 4.6) {
      const mesh = acquireMesh('shock', shockGeo, {
        color: colorHex,
        opacity: 0.92,
        side: THREE.DoubleSide,
      });
      mesh.position.set(pos.x, pos.y + 0.16, pos.z);
      spawnMeshEffect('shock', mesh, 0.42, (p) => {
        const s = 1 + p * maxScale;
        mesh.scale.set(s, s, s);
        mesh.material.opacity = (1 - p) * 0.92;
      });
    },

    spawnImpactBurst(pos, colorHex = 0xff3b2f, count = 5) {
      const scaledCount = qualityLevel === 'low' ? Math.max(2, Math.floor(count * 0.5)) : count;
      for (let i = 0; i < scaledCount; i++) {
        const spark = acquireMesh('spark', sparkGeo, {
          color: colorHex,
          opacity: 0.95,
        });
        spark.position.set(pos.x, pos.y + 1.2, pos.z);
        let vx = (Math.random() - 0.5) * 7.5;
        let vy = 2.0 + Math.random() * 3.5;
        let vz = (Math.random() - 0.5) * 7.5;
        spawnMeshEffect('spark', spark, 0.28, (p, dt) => {
          spark.position.x += vx * dt;
          spark.position.y += vy * dt;
          spark.position.z += vz * dt;
          vy -= 11 * dt;
          spark.scale.setScalar(Math.max(0.1, 1 - p));
          spark.material.opacity = 1 - p;
        });
      }
    },

    spawnEnergyTrail(pos, colorHex = 0x38d4ff) {
      const orb = acquireMesh('trail', trailGeo, {
        color: colorHex,
        opacity: 0.55,
      });
      orb.position.set(pos.x, pos.y + 1.05, pos.z);
      spawnMeshEffect('trail', orb, 0.28, (p) => {
        orb.scale.setScalar(1 - p * 0.65);
        orb.material.opacity = (1 - p) * 0.55;
      });
    },

    spawnShieldBurst(pos, isPerfect = false) {
      const dome = acquireMesh('dome', domeGeo, {
        color: isPerfect ? 0xf3c969 : 0x38d4ff,
        opacity: isPerfect ? 0.65 : 0.4,
        wireframe: true,
      });
      dome.position.set(pos.x, pos.y + 1.15, pos.z);
      spawnMeshEffect('dome', dome, isPerfect ? 0.4 : 0.24, (p) => {
        const s = 1 + p * (isPerfect ? 0.9 : 0.35);
        dome.scale.setScalar(s);
        dome.material.opacity = (1 - p) * (isPerfect ? 0.65 : 0.4);
      });
    },

    spawnMuzzleFlash(originPos, dir, colorHex = 0x4ce8ff) {
      const flash = acquireMesh('spark', sparkGeo, {
        color: colorHex,
        opacity: 0.96,
      });
      flash.position.copy(originPos).addScaledVector(dir, 0.92);
      flash.scale.setScalar(1.35);
      spawnMeshEffect('spark', flash, 0.11, (p) => {
        flash.scale.setScalar(Math.max(0.1, 1.35 * (1 - p) + p * 0.4));
        flash.material.opacity = (1 - p) * 0.96;
      });
    },

    spawnProjectileTrail(pos, colorHex = 0x4ce8ff) {
      const orb = acquireMesh('trail', trailGeo, {
        color: colorHex,
        opacity: 0.62,
      });
      orb.position.copy(pos);
      orb.scale.setScalar(0.45);
      spawnMeshEffect('trail', orb, 0.16, (p) => {
        orb.scale.setScalar(Math.max(0.08, 0.45 * (1 - p)));
        orb.material.opacity = (1 - p) * 0.62;
      });
    },

    spawnPlasmaBeam(originPos, dir, length = 22, colorHex = 0x38e0ff) {
      const beam = acquireMesh('beam', beamGeo, {
        color: colorHex,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });
      const normDir = dir.clone().normalize();
      beam.position.copy(originPos).addScaledVector(normDir, length * 0.5);
      beam.lookAt(beam.position.clone().add(normDir));
      beam.scale.set(1.2, 1.2, length);
      spawnMeshEffect('beam', beam, 0.36, (p) => {
        const w = 1.25 * (1 - p * 0.65);
        beam.scale.set(w, w, length);
        beam.material.opacity = (1 - p) * 0.9;
      });
    },

    spawnStasisSphere(pos, radius = 6.0, colorHex = 0x8b6eff) {
      const sphere = acquireMesh('dome', domeGeo, {
        color: colorHex,
        opacity: 0.45,
        wireframe: true,
      });
      sphere.position.set(pos.x, pos.y + 1.0, pos.z);
      const baseScale = radius / 1.45;
      sphere.scale.setScalar(0.2);
      spawnMeshEffect('dome', sphere, 2.2, (p, dt) => {
        const expand = Math.min(1, p * 4.5);
        const pulse = 1 + Math.sin(p * Math.PI * 10) * 0.04;
        sphere.scale.setScalar(baseScale * expand * pulse);
        sphere.rotation.y += dt * 1.4;
        sphere.material.opacity = p < 0.8 ? 0.42 : (1 - p) * 2.1;
      });
    },

    spawnQuantumSingularity(pos, colorHex = 0xb44cff) {
      const ringA = acquireMesh('shock', shockGeo, {
        color: colorHex,
        opacity: 0.95,
        side: THREE.DoubleSide,
      });
      ringA.position.set(pos.x, pos.y + 0.9, pos.z);
      spawnMeshEffect('shock', ringA, 0.72, (p, dt) => {
        const s = 1 + Math.sin(p * Math.PI) * 5.2;
        ringA.scale.set(s, s, s);
        ringA.rotation.z += dt * 8.0;
        ringA.material.opacity = (1 - p) * 0.95;
      });

      const core = acquireMesh('dome', domeGeo, {
        color: 0x38e0ff,
        opacity: 0.72,
        wireframe: true,
      });
      core.position.set(pos.x, pos.y + 1.2, pos.z);
      spawnMeshEffect('dome', core, 0.68, (p, dt) => {
        const s = p < 0.35 ? 2.4 - p * 3.0 : 1.35 + (p - 0.35) * 3.2;
        core.scale.setScalar(Math.max(0.4, s));
        core.rotation.y -= dt * 4.5;
        core.material.opacity = (1 - p) * 0.72;
      });
    },

    update(dt) {
      for (let i = effects.length - 1; i >= 0; i--) {
        const fx = effects[i];
        fx.life -= dt;
        const progress = THREE.MathUtils.clamp(1 - fx.life / fx.maxLife, 0, 1);
        fx.onUpdate(progress, dt);
        if (fx.life <= 0) {
          releaseEffect(fx);
          effects.splice(i, 1);
        }
      }
    },

    clear() {
      for (const fx of effects) {
        releaseEffect(fx);
      }
      effects.length = 0;
    },
  };
}
