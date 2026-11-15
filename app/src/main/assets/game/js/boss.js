import * as THREE from 'three';

/**
 * RAVOK – First Boss (Cyclops Commander)
 * Heavy black mechanical armor, single intense glowing red Cyclops eye,
 * forearm plasma cannon, massive mechanical battle weapon, ranged plasma orbs,
 * heavy melee smash, ground slam shockwave, and Awakening knockback reaction.
 */
export function createRavokBoss(scene, getTerrainHeight) {
  const root = new THREE.Group();
  root.name = 'BossRavok';
  root.visible = false;
  scene.add(root);

  const blackArmorMat = new THREE.MeshStandardMaterial({ color: 0x13161d, roughness: 0.38, metalness: 0.78 });
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x262c36, roughness: 0.32, metalness: 0.85 });
  const redCoreMat = new THREE.MeshStandardMaterial({
    color: 0xff2b1f,
    emissive: 0xff1c0d,
    emissiveIntensity: 2.1,
    roughness: 0.2,
  });

  const body = new THREE.Group();
  root.add(body);

  // Towering Boss Torso & Chest Core
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.65, 0.9), blackArmorMat);
  torso.position.y = 2.25;
  torso.castShadow = true;
  torso.receiveShadow = true;
  body.add(torso);

  const chestReactor = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), redCoreMat);
  chestReactor.position.set(0, 2.38, -0.44);
  body.add(chestReactor);

  // Spiked Heavy Shoulder Pauldrons
  [-0.95, 0.95].forEach((sx) => {
    const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 0), blackArmorMat);
    pauldron.position.set(sx, 2.95, 0);
    pauldron.scale.set(1.15, 0.9, 1.15);
    pauldron.castShadow = true;
    body.add(pauldron);

    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 5), darkSteelMat);
    spike.position.set(sx * 1.25, 3.35, 0);
    spike.rotation.z = sx < 0 ? 0.5 : -0.5;
    body.add(spike);
  });

  // Mechanical Head with Single Glowing Red Cyclops Eye
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.7, 0.64), blackArmorMat);
  head.position.y = 3.45;
  head.castShadow = true;
  body.add(head);

  const cyclopsEye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), redCoreMat);
  cyclopsEye.position.set(0, 3.46, -0.31);
  body.add(cyclopsEye);

  // Right Arm: Massive Mechanical Battle Cleaver
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.98, 2.7, 0);
  const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 1.15, 8), blackArmorMat);
  rArm.position.y = -0.55;
  rArm.castShadow = true;
  rightArmPivot.add(rArm);

  const cleaver = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.85, 0.36), darkSteelMat);
  cleaver.position.set(0, -1.1, -0.65);
  cleaver.rotation.x = Math.PI * 0.42;
  cleaver.castShadow = true;
  rightArmPivot.add(cleaver);

  const cleaverEdge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.65, 0.38), redCoreMat);
  cleaverEdge.position.copy(cleaver.position);
  cleaverEdge.rotation.copy(cleaver.rotation);
  rightArmPivot.add(cleaverEdge);
  body.add(rightArmPivot);

  // Left Arm: Heavy Forearm Plasma Cannon
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.98, 2.7, 0);
  const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 1.1, 8), blackArmorMat);
  lArm.position.y = -0.52;
  lArm.castShadow = true;
  leftArmPivot.add(lArm);

  const cannonBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.72, 10), darkSteelMat);
  cannonBarrel.rotation.x = Math.PI / 2;
  cannonBarrel.position.set(0, -0.95, -0.32);
  cannonBarrel.castShadow = true;
  leftArmPivot.add(cannonBarrel);

  const cannonMuzzle = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), redCoreMat);
  cannonMuzzle.position.set(0, -0.95, -0.7);
  leftArmPivot.add(cannonMuzzle);
  body.add(leftArmPivot);

  // Heavy Mechanical Legs
  const legGeo = new THREE.CylinderGeometry(0.25, 0.21, 1.4, 8);
  const legL = new THREE.Mesh(legGeo, blackArmorMat);
  legL.position.set(-0.38, 0.72, 0);
  legL.castShadow = true;
  body.add(legL);

  const legR = new THREE.Mesh(legGeo, blackArmorMat);
  legR.position.set(0.38, 0.72, 0);
  legR.castShadow = true;
  body.add(legR);

  // Boss Ground Slam Shockwave Ring
  const slamRing = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 1.25, 32),
    new THREE.MeshBasicMaterial({ color: 0xff3b24, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  slamRing.rotation.x = -Math.PI / 2;
  slamRing.visible = false;
  scene.add(slamRing);

  // Active Ranged Plasma Projectiles
  const plasmaOrbs = [];
  const orbGeo = new THREE.SphereGeometry(0.3, 10, 10);
  const orbMat = new THREE.MeshBasicMaterial({ color: 0xff3c28 });

  const spawnX = 0;
  const spawnZ = -45;
  root.position.set(spawnX, getTerrainHeight(spawnX, spawnZ), spawnZ);

  const boss = {
    id: 'boss_ravok',
    name: 'RAVOK, CYCLOPS COMMANDER',
    root,
    maxHp: 2000,
    hp: 2000,
    alive: false,
    active: false,
    pushedBack: false,
    knockbackVel: new THREE.Vector3(),
    attackCooldown: 1.5,
    stateTimer: 0,
    actionState: 'idle', // 'idle' | 'melee_windup' | 'plasma_windup' | 'slam_leap' | 'stagger' | 'defeated'
    slamRingTimer: 0,
    walkPhase: 0,
  };

  return {
    boss,
    spawn(x = 0, z = -45) {
      boss.hp = boss.maxHp;
      boss.alive = true;
      boss.active = true;
      boss.pushedBack = false;
      boss.knockbackVel.set(0, 0, 0);
      boss.actionState = 'idle';
      boss.attackCooldown = 1.6;
      boss.stateTimer = 0;
      root.visible = true;
      root.rotation.set(0, 0, 0);
      body.position.set(0, 0, 0);
      body.rotation.set(0, 0, 0);
      root.position.set(x, getTerrainHeight(x, z), z);
    },
    hide() {
      boss.alive = false;
      boss.active = false;
      root.visible = false;
      slamRing.visible = false;
      plasmaOrbs.forEach((p) => scene.remove(p.mesh));
      plasmaOrbs.length = 0;
    },
    staggerFromParry(kaelPos) {
      if (!boss.alive || !boss.active) return;
      boss.actionState = 'stagger';
      boss.stateTimer = 1.6;
      const dir = new THREE.Vector3().subVectors(root.position, kaelPos).setY(0).normalize();
      if (dir.lengthSq() > 0.01) boss.knockbackVel.copy(dir).multiplyScalar(7.5);
    },
    damage(amount, knockbackVec = null) {
      if (!boss.alive || !boss.active) return false;
      boss.hp = Math.max(40, boss.hp - amount);
      body.position.y = 0.08;
      if (knockbackVec) {
        boss.knockbackVel.addScaledVector(knockbackVec, 0.45);
      }
      if (boss.hp <= 520 && boss.actionState === 'idle') {
        boss.actionState = 'stagger';
        boss.stateTimer = 0.45;
      }
      return false;
    },
    triggerAwakeningBlast(kaelPos) {
      // Kael's blue-white Awakening explosion pushes Ravok violently away!
      boss.pushedBack = true;
      boss.actionState = 'defeated';
      boss.stateTimer = 2.4;
      const dir = new THREE.Vector3().subVectors(root.position, kaelPos).setY(0).normalize();
      if (dir.lengthSq() < 0.01) dir.set(0, 0, -1);
      boss.knockbackVel.copy(dir).multiplyScalar(18);
      boss.hp = 0;
      boss.alive = false;
    },
    update(dt, time, playerPos, onHitPlayer, onCameraShake, onPlasmaSound) {
      if (!root.visible) return;

      // Update slam shockwave
      if (boss.slamRingTimer > 0) {
        boss.slamRingTimer -= dt;
        const p = 1 - boss.slamRingTimer / 0.55;
        const s = 1 + p * 8.5;
        slamRing.scale.set(s, s, s);
        slamRing.material.opacity = (1 - p) * 0.9;
        if (boss.slamRingTimer <= 0) slamRing.visible = false;
      }

      // Update plasma projectiles
      for (let i = plasmaOrbs.length - 1; i >= 0; i--) {
        const p = plasmaOrbs[i];
        p.life -= dt;
        p.mesh.position.addScaledVector(p.dir, p.speed * dt);
        if (p.reflected) {
          const bossCenter = root.position.clone().add(new THREE.Vector3(0, 2.0, 0));
          if (boss.alive && boss.active && p.mesh.position.distanceTo(bossCenter) < 2.2) {
            this.damage(50, p.dir.clone().multiplyScalar(5.5));
            scene.remove(p.mesh);
            plasmaOrbs.splice(i, 1);
            continue;
          }
        } else {
          const hitTarget = playerPos.clone().add(new THREE.Vector3(0, 1.15, 0));
          if (p.mesh.position.distanceTo(hitTarget) < 1.15) {
            const hitResult = onHitPlayer(28, p.mesh.position, boss);
            if (hitResult === 'REFLECTED') {
              p.reflected = true;
              p.dir.negate();
              p.speed *= 1.5;
              p.life = 2.0;
              p.mesh.material = new THREE.MeshBasicMaterial({ color: 0x4ce8ff });
              continue;
            }
            scene.remove(p.mesh);
            plasmaOrbs.splice(i, 1);
            continue;
          }
        }
        if (p.life <= 0) {
          scene.remove(p.mesh);
          plasmaOrbs.splice(i, 1);
        }
      }

      if (boss.actionState === 'defeated') {
        if (boss.stateTimer > 0) {
          boss.stateTimer -= dt;
          root.position.addScaledVector(boss.knockbackVel, dt);
          boss.knockbackVel.multiplyScalar(0.92);
          root.position.y = getTerrainHeight(root.position.x, root.position.z);
          body.rotation.x = THREE.MathUtils.lerp(body.rotation.x, -1.35, Math.min(1, dt * 4));
        }
        return;
      }

      if (!boss.active || !boss.alive) return;

      if (boss.knockbackVel.lengthSq() > 0.02) {
        root.position.x = THREE.MathUtils.clamp(root.position.x + boss.knockbackVel.x * dt, -68, 68);
        root.position.z = THREE.MathUtils.clamp(root.position.z + boss.knockbackVel.z * dt, -68, 68);
        boss.knockbackVel.multiplyScalar(Math.exp(-8 * dt));
      }

      body.position.y = THREE.MathUtils.lerp(body.position.y, 0, dt * 10);

      const dx = playerPos.x - root.position.x;
      const dz = playerPos.z - root.position.z;
      const dist = Math.hypot(dx, dz);

      const targetYaw = Math.atan2(-dx, -dz);
      const diff = Math.atan2(Math.sin(targetYaw - root.rotation.y), Math.cos(targetYaw - root.rotation.y));
      root.rotation.y += diff * Math.min(1, dt * 6);

      if (boss.attackCooldown > 0) boss.attackCooldown -= dt;

      if (boss.actionState === 'stagger') {
        boss.stateTimer -= dt;
        body.rotation.x = 0.2;
        if (boss.stateTimer <= 0) {
          body.rotation.x = 0;
          boss.actionState = 'idle';
        }
        return;
      }

      if (boss.actionState === 'melee_windup') {
        boss.stateTimer -= dt;
        rightArmPivot.rotation.x = boss.stateTimer > 0.2 ? 1.5 : -1.35;
        if (boss.stateTimer <= 0) {
          boss.actionState = 'idle';
          boss.attackCooldown = 1.65;
          if (dist < 4.3) {
            onHitPlayer(36, root.position, boss);
            onCameraShake(0.35);
          }
        }
        return;
      }

      if (boss.actionState === 'plasma_windup') {
        boss.stateTimer -= dt;
        leftArmPivot.rotation.x = -1.35;
        if (boss.stateTimer <= 0) {
          boss.actionState = 'idle';
          boss.attackCooldown = 1.9;
          const orb = new THREE.Mesh(orbGeo, orbMat);
          const origin = root.position.clone().add(new THREE.Vector3(0, 1.9, 0));
          const aimDir = playerPos.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(origin).normalize();
          orb.position.copy(origin).addScaledVector(aimDir, 1.2);
          scene.add(orb);
          plasmaOrbs.push({ mesh: orb, dir: aimDir, speed: 17.5, life: 2.6 });
          if (onPlasmaSound) onPlasmaSound();
        }
        return;
      }

      if (boss.actionState === 'slam_leap') {
        boss.stateTimer -= dt;
        const p = 1 - boss.stateTimer / 0.75;
        body.position.y = Math.sin(p * Math.PI) * 2.4;
        rightArmPivot.rotation.x = 1.6;
        leftArmPivot.rotation.x = 1.6;
        if (boss.stateTimer <= 0) {
          body.position.y = 0;
          boss.actionState = 'idle';
          boss.attackCooldown = 2.4;
          slamRing.position.set(root.position.x, root.position.y + 0.22, root.position.z);
          slamRing.scale.set(1, 1, 1);
          slamRing.visible = true;
          boss.slamRingTimer = 0.55;
          onCameraShake(0.65);
          if (dist < 7.5) {
            onHitPlayer(44, root.position, boss);
          }
        }
        return;
      }

      // Idle / Chase & Attack Selection
      rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, 0.1, dt * 6);
      leftArmPivot.rotation.x = THREE.MathUtils.lerp(leftArmPivot.rotation.x, 0.1, dt * 6);

      if (dist > 3.6) {
        const moveSpeed = 3.8;
        root.position.x += (dx / dist) * moveSpeed * dt;
        root.position.z += (dz / dist) * moveSpeed * dt;
        boss.walkPhase += dt * 6.0;
        legL.rotation.x = Math.sin(boss.walkPhase) * 0.4;
        legR.rotation.x = -Math.sin(boss.walkPhase) * 0.4;
      } else {
        legL.rotation.x = THREE.MathUtils.lerp(legL.rotation.x, 0, dt * 8);
        legR.rotation.x = THREE.MathUtils.lerp(legR.rotation.x, 0, dt * 8);
      }

      if (boss.attackCooldown <= 0) {
        if (dist <= 3.9) {
          if (Math.random() < 0.38) {
            boss.actionState = 'slam_leap';
            boss.stateTimer = 0.75;
          } else {
            boss.actionState = 'melee_windup';
            boss.stateTimer = 0.55;
          }
        } else if (dist < 22) {
          boss.actionState = 'plasma_windup';
          boss.stateTimer = 0.45;
        }
      }

      root.position.y = getTerrainHeight(root.position.x, root.position.z);
    },
  };
}
