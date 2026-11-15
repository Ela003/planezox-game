import * as THREE from 'three';

/**
 * Manages the Cyclops Alien Soldiers patrolling the settlement escape route & forest.
 * Basic Cyclops: 100 HP | Heavy Cyclops Vanguard: 250 HP.
 * Supports stun (from Perfect Block), hit reaction, blocking guard, knockback, and death collapse.
 */
export function createCyclopsSoldiers(scene, getTerrainHeight) {
  const soldiersGroup = new THREE.Group();
  soldiersGroup.name = 'CyclopsSoldiers';
  scene.add(soldiersGroup);

  const blackMetalMat = new THREE.MeshStandardMaterial({ color: 0x151921, roughness: 0.42, metalness: 0.72 });
  const heavyArmorMat = new THREE.MeshStandardMaterial({ color: 0x222733, roughness: 0.35, metalness: 0.82 });
  const redEnergyMat = new THREE.MeshStandardMaterial({
    color: 0xff2a22,
    emissive: 0xff1a12,
    emissiveIntensity: 1.65,
    roughness: 0.25,
  });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x8e99a3, metalness: 0.8, roughness: 0.28 });

  const lockRingGeo = new THREE.RingGeometry(0.85, 1.15, 28);
  lockRingGeo.rotateX(-Math.PI / 2);
  const lockRing = new THREE.Mesh(
    lockRingGeo,
    new THREE.MeshBasicMaterial({ color: 0xff3b2f, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  lockRing.visible = false;
  scene.add(lockRing);

  const spawnConfigs = [
    { id: 'cyclops_1', name: 'Cyclops Scout', x: -5.5, z: -15, maxHp: 100, isHeavy: false, scale: 1.0 },
    { id: 'cyclops_2', name: 'Cyclops Trooper', x: 6.0, z: -21, maxHp: 100, isHeavy: false, scale: 1.0 },
    { id: 'cyclops_3', name: 'Cyclops Striker', x: -4.5, z: -28, maxHp: 100, isHeavy: false, scale: 1.0 },
    { id: 'cyclops_4', name: 'Heavy Cyclops Vanguard', x: 4.5, z: -33, maxHp: 250, isHeavy: true, scale: 1.24 },
  ];

  function buildCyclopsMesh(cfg) {
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);

    const armorMat = cfg.isHeavy ? heavyArmorMat : blackMetalMat;

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.06, 0.5), armorMat);
    torso.position.y = 1.38;
    torso.castShadow = true;
    torso.receiveShadow = true;
    body.add(torso);

    const chestLineL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.56, 0.52), redEnergyMat);
    chestLineL.position.set(-0.18, 1.44, 0);
    chestLineL.rotation.z = 0.22;
    body.add(chestLineL);

    const chestLineR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.56, 0.52), redEnergyMat);
    chestLineR.position.set(0.18, 1.44, 0);
    chestLineR.rotation.z = -0.22;
    body.add(chestLineR);

    [-0.55, 0.55].forEach((sx) => {
      const pauldron = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.55, 5), armorMat);
      pauldron.position.set(sx, 1.84, 0);
      pauldron.rotation.z = sx < 0 ? 0.45 : -0.45;
      pauldron.castShadow = true;
      body.add(pauldron);
    });

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.42), armorMat);
    head.position.y = 2.15;
    head.castShadow = true;
    body.add(head);

    const cyclopsEye = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), redEnergyMat);
    cyclopsEye.position.set(0, 2.16, -0.21);
    body.add(cyclopsEye);

    const armPivot = new THREE.Group();
    armPivot.position.set(0.56, 1.65, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.68, 7), armorMat);
    arm.position.y = -0.32;
    arm.castShadow = true;
    armPivot.add(arm);

    const plasmaBlade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.28, 0.14), bladeMat);
    plasmaBlade.position.set(0, -0.58, -0.35);
    plasmaBlade.rotation.x = Math.PI * 0.42;
    plasmaBlade.castShadow = true;
    armPivot.add(plasmaBlade);

    const bladeCore = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.15, 0.16), redEnergyMat);
    bladeCore.position.copy(plasmaBlade.position);
    bladeCore.rotation.copy(plasmaBlade.rotation);
    armPivot.add(bladeCore);
    body.add(armPivot);

    // Optional Left Forearm Guard Shield for Heavy Cyclops
    const leftShield = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.82, 0.48), heavyArmorMat);
    leftShield.position.set(-0.56, 1.4, -0.24);
    leftShield.visible = cfg.isHeavy;
    body.add(leftShield);

    const legGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.85, 7);
    const legL = new THREE.Mesh(legGeo, armorMat);
    legL.position.set(-0.22, 0.45, 0);
    legL.castShadow = true;
    body.add(legL);

    const legR = new THREE.Mesh(legGeo, armorMat);
    legR.position.set(0.22, 0.45, 0);
    legR.castShadow = true;
    body.add(legR);

    body.scale.setScalar(cfg.scale);

    // Floating overhead 3D HP bar
    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x161b18, side: THREE.DoubleSide })
    );
    hpBg.position.y = 2.78 * cfg.scale;
    root.add(hpBg);

    const hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.08, 0.08),
      new THREE.MeshBasicMaterial({ color: cfg.isHeavy ? 0xff7b29 : 0xff3b2f, side: THREE.DoubleSide })
    );
    hpFill.position.set(0, 2.78 * cfg.scale, 0.01);
    root.add(hpFill);

    const y = getTerrainHeight(cfg.x, cfg.z);
    root.position.set(cfg.x, y, cfg.z);
    soldiersGroup.add(root);

    return {
      id: cfg.id,
      name: cfg.name,
      isHeavy: cfg.isHeavy,
      spawnX: cfg.x,
      spawnZ: cfg.z,
      root,
      body,
      armPivot,
      leftShield,
      legL,
      legR,
      hpBg,
      hpFill,
      maxHp: cfg.maxHp,
      hp: cfg.maxHp,
      alive: true,
      active: false,
      isBlocking: false,
      stunTimer: 0,
      levitateTimer: 0,
      hitReactionTimer: 0,
      deathTimer: 0,
      knockbackVel: new THREE.Vector3(),
      attackCooldown: 0,
      windupTimer: 0,
      hitFlash: 0,
      walkPhase: Math.random() * Math.PI * 2,
      patrolAngle: Math.random() * Math.PI * 2,
    };
  }

  const soldiers = spawnConfigs.map(buildCyclopsMesh);
  let lockedId = null;

  return {
    soldiers,
    setActive(active) {
      soldiersGroup.visible = active;
      soldiers.forEach((s) => { s.active = active; });
    },
    getLockedTarget(extraTargets = []) {
      if (!lockedId) return null;
      const s = soldiers.find((item) => item.id === lockedId && item.alive && item.active);
      if (s) return s;
      const extra = extraTargets.find((item) => item.id === lockedId && item.alive && item.active);
      if (extra) return extra;
      lockedId = null;
      lockRing.visible = false;
      return null;
    },
    toggleTargetLock(playerPos, extraTargets = []) {
      if (lockedId) {
        lockedId = null;
        lockRing.visible = false;
        return null;
      }
      const candidates = [...soldiers, ...extraTargets].filter((t) => t.alive && t.active);
      let best = null;
      let bestDist = 34;
      for (const c of candidates) {
        const d = playerPos.distanceTo(c.root.position);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (best) {
        lockedId = best.id;
        lockRing.visible = true;
      }
      return best;
    },
    clearLock() {
      lockedId = null;
      lockRing.visible = false;
    },
    getDefeatedCount() {
      return soldiers.filter((s) => !s.alive).length;
    },
    resetAll() {
      lockedId = null;
      lockRing.visible = false;
      for (const s of soldiers) {
        s.hp = s.maxHp;
        s.alive = true;
        s.isBlocking = false;
        s.stunTimer = 0;
        s.levitateTimer = 0;
        s.hitReactionTimer = 0;
        s.deathTimer = 0;
        s.knockbackVel.set(0, 0, 0);
        s.attackCooldown = 0.5;
        s.windupTimer = 0;
        s.hitFlash = 0;
        s.body.rotation.set(0, 0, 0);
        s.body.position.set(0, 0, 0);
        s.root.visible = true;
        s.hpBg.visible = true;
        s.hpFill.visible = true;
        s.root.position.set(s.spawnX, getTerrainHeight(s.spawnX, s.spawnZ), s.spawnZ);
        s.hpFill.scale.x = 1;
        s.hpFill.position.x = 0;
      }
    },
    levitateSoldier(soldier, duration = 2.6) {
      if (!soldier.alive) return;
      soldier.levitateTimer = Math.max(soldier.levitateTimer, duration);
      soldier.stunTimer = Math.max(soldier.stunTimer, duration + 0.4);
      soldier.windupTimer = 0;
      soldier.isBlocking = false;
    },
    stunSoldier(soldier, duration = 1.6, knockbackVec = null) {
      if (!soldier.alive) return;
      soldier.stunTimer = Math.max(soldier.stunTimer, duration);
      soldier.windupTimer = 0;
      soldier.isBlocking = false;
      if (knockbackVec) {
        soldier.knockbackVel.copy(knockbackVec);
      }
    },
    damageSoldier(soldier, amount, knockbackVec = null, bypassBlock = false) {
      if (!soldier.alive) return { defeated: false, actualDamage: 0, blocked: false };
      let actual = amount;
      let blocked = false;
      if (soldier.isBlocking && !bypassBlock && soldier.stunTimer <= 0) {
        actual = Math.max(4, Math.round(amount * 0.35));
        blocked = true;
      }
      soldier.hp = Math.max(0, soldier.hp - actual);
      soldier.hitFlash = 0.2;
      soldier.hitReactionTimer = 0.22;
      if (knockbackVec) {
        soldier.knockbackVel.addScaledVector(knockbackVec, blocked ? 0.4 : 1.0);
      }
      const ratio = soldier.hp / soldier.maxHp;
      soldier.hpFill.scale.x = Math.max(0.001, ratio);
      soldier.hpFill.position.x = -(1 - ratio) * 0.54;

      if (soldier.hp <= 0) {
        soldier.alive = false;
        soldier.deathTimer = 0.75;
        soldier.hpBg.visible = false;
        soldier.hpFill.visible = false;
        if (lockedId === soldier.id) {
          lockedId = null;
          lockRing.visible = false;
        }
        return { defeated: true, actualDamage: actual, blocked };
      }
      return { defeated: false, actualDamage: actual, blocked };
    },
    update(dt, time, playerPos, cameraPos, onHitPlayer, extraTargets = []) {
      const locked = this.getLockedTarget(extraTargets);
      if (locked) {
        lockRing.visible = true;
        lockRing.position.set(locked.root.position.x, locked.root.position.y + 0.12, locked.root.position.z);
        lockRing.rotation.z = time * 1.8;
      } else {
        lockRing.visible = false;
      }

      for (const s of soldiers) {
        if (!s.active) continue;

        // Death collapse animation
        if (!s.alive) {
          if (s.deathTimer > 0) {
            s.deathTimer -= dt;
            s.body.rotation.x = THREE.MathUtils.lerp(s.body.rotation.x, -1.48, Math.min(1, dt * 8));
            s.root.position.addScaledVector(s.knockbackVel, dt);
            s.knockbackVel.multiplyScalar(0.86);
            s.root.position.y = getTerrainHeight(s.root.position.x, s.root.position.z);
            if (s.deathTimer <= 0) {
              s.root.visible = false;
            }
          }
          continue;
        }

        s.hpBg.lookAt(cameraPos);
        s.hpFill.lookAt(cameraPos);

        // Apply knockback physics
        if (s.knockbackVel.lengthSq() > 0.02) {
          s.root.position.x = THREE.MathUtils.clamp(s.root.position.x + s.knockbackVel.x * dt, -68, 68);
          s.root.position.z = THREE.MathUtils.clamp(s.root.position.z + s.knockbackVel.z * dt, -68, 68);
          s.knockbackVel.multiplyScalar(Math.exp(-8.5 * dt));
        }

        if (s.attackCooldown > 0) s.attackCooldown -= dt;
        if (s.hitFlash > 0) {
          s.hitFlash -= dt;
          s.body.position.y = Math.sin(s.hitFlash * 42) * 0.08;
        } else {
          s.body.position.y = 0;
        }

        if (s.levitateTimer > 0) {
          s.levitateTimer -= dt;
          s.stunTimer = Math.max(0, s.stunTimer - dt);
          const lift = Math.sin(Math.min(1, s.levitateTimer / 0.6) * Math.PI * 0.5) * 1.65;
          s.body.position.y = lift + Math.sin(time * 7) * 0.14;
          s.body.rotation.y += dt * 2.2;
          s.body.rotation.x = 0.18;
          s.root.position.y = getTerrainHeight(s.root.position.x, s.root.position.z);
          continue;
        } else {
          s.body.rotation.y = THREE.MathUtils.lerp(s.body.rotation.y, 0, dt * 8);
        }

        if (s.stunTimer > 0) {
          s.stunTimer -= dt;
          s.body.rotation.x = THREE.MathUtils.lerp(s.body.rotation.x, 0.25, dt * 8);
          s.body.rotation.z = Math.sin(time * 18) * 0.08;
          s.root.position.y = getTerrainHeight(s.root.position.x, s.root.position.z);
          continue;
        } else if (s.hitReactionTimer > 0) {
          s.hitReactionTimer -= dt;
          s.body.rotation.x = -0.18;
        } else {
          s.body.rotation.x = THREE.MathUtils.lerp(s.body.rotation.x, 0, dt * 10);
          s.body.rotation.z = THREE.MathUtils.lerp(s.body.rotation.z, 0, dt * 10);
        }

        const dx = playerPos.x - s.root.position.x;
        const dz = playerPos.z - s.root.position.z;
        const distToPlayer = Math.hypot(dx, dz);

        if (distToPlayer < 16.5) {
          const targetRot = Math.atan2(-dx, -dz);
          const diff = Math.atan2(Math.sin(targetRot - s.root.rotation.y), Math.cos(targetRot - s.root.rotation.y));
          s.root.rotation.y += diff * Math.min(1, dt * 8);

          // Heavy Cyclops intermittently raises shield between attacks
          if (s.isHeavy && s.windupTimer <= 0 && s.attackCooldown > 0.6 && distToPlayer < 4.5) {
            s.isBlocking = true;
            s.leftShield.position.z = -0.42;
          } else {
            s.isBlocking = false;
            s.leftShield.position.z = -0.24;
          }

          if (distToPlayer > 2.35 && s.windupTimer <= 0) {
            const speed = s.isHeavy ? 2.65 : 3.2;
            s.root.position.x += (dx / distToPlayer) * speed * dt;
            s.root.position.z += (dz / distToPlayer) * speed * dt;
            s.walkPhase += dt * 7.5;
            s.legL.rotation.x = Math.sin(s.walkPhase) * 0.5;
            s.legR.rotation.x = -Math.sin(s.walkPhase) * 0.5;
            s.armPivot.rotation.x = THREE.MathUtils.lerp(s.armPivot.rotation.x, 0, dt * 8);
          } else {
            s.legL.rotation.x = THREE.MathUtils.lerp(s.legL.rotation.x, 0, dt * 8);
            s.legR.rotation.x = THREE.MathUtils.lerp(s.legR.rotation.x, 0, dt * 8);

            if (s.windupTimer > 0) {
              s.windupTimer -= dt;
              s.armPivot.rotation.x = s.windupTimer > 0.16 ? 1.15 : -1.1;
              if (s.windupTimer <= 0) {
                s.attackCooldown = s.isHeavy ? 2.1 : 1.75;
                if (distToPlayer <= 3.25) {
                  onHitPlayer(s.isHeavy ? 28 : 18, s.root.position, s);
                }
              }
            } else if (s.attackCooldown <= 0 && distToPlayer <= 2.75) {
              s.windupTimer = 0.45;
            } else {
              s.armPivot.rotation.x = THREE.MathUtils.lerp(s.armPivot.rotation.x, 0.15, dt * 6);
            }
          }
        } else {
          s.isBlocking = false;
          s.patrolAngle += dt * 0.5;
          const targetX = s.spawnX + Math.cos(s.patrolAngle) * 2.5;
          const targetZ = s.spawnZ + Math.sin(s.patrolAngle) * 2.5;
          const pdx = targetX - s.root.position.x;
          const pdz = targetZ - s.root.position.z;
          const pd = Math.hypot(pdx, pdz);
          if (pd > 0.1) {
            s.root.position.x += (pdx / pd) * 1.5 * dt;
            s.root.position.z += (pdz / pd) * 1.5 * dt;
            s.root.rotation.y = Math.atan2(-pdx, -pdz);
            s.walkPhase += dt * 4.5;
            s.legL.rotation.x = Math.sin(s.walkPhase) * 0.3;
            s.legR.rotation.x = -Math.sin(s.walkPhase) * 0.3;
          }
          s.armPivot.rotation.x = THREE.MathUtils.lerp(s.armPivot.rotation.x, 0, dt * 6);
        }

        s.root.position.y = getTerrainHeight(s.root.position.x, s.root.position.z);
      }
    },
  };
}
