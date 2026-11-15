import * as THREE from 'three';

/**
 * Smooth cinematic third-person camera positioned behind the player,
 * supporting target lock, cutscene cinematic poses, and camera shake.
 */
export class ThirdPersonCamera {
  constructor(camera, getTerrainHeight) {
    this.camera = camera;
    this.getTerrainHeight = getTerrainHeight;

    this.yaw = 0.12;
    this.pitch = 0.25;
    this.baseDistance = 7.6;
    this.sensitivity = 1.0;
    this.invertY = false;

    this.menuOrbit = true;
    this.aimMode = false;
    this.cinematicActive = false;
    this.cinematicPos = new THREE.Vector3();
    this.cinematicLookAt = new THREE.Vector3();
    this.shakeIntensity = 0;

    this.currentPosition = new THREE.Vector3(1.5, 4.2, 8.2);
    this.currentLookAt = new THREE.Vector3(0, 1.8, 0);
    this.desiredPosition = new THREE.Vector3();
    this.desiredLookAt = new THREE.Vector3();
    this.dynamicDistance = this.baseDistance;
    this.samplePos = new THREE.Vector3();
  }

  setMenuOrbit(enabled) {
    this.menuOrbit = enabled;
    if (!enabled) {
      this.yaw = 0.12;
      this.pitch = 0.25;
    }
  }

  setAimMode(enabled) {
    this.aimMode = Boolean(enabled);
  }

  setCinematicPose(active, pos = null, lookAt = null, snap = false) {
    this.cinematicActive = active;
    if (active && pos && lookAt) {
      this.cinematicPos.copy(pos);
      this.cinematicLookAt.copy(lookAt);
      if (snap) {
        this.currentPosition.copy(pos);
        this.currentLookAt.copy(lookAt);
      }
    }
  }

  triggerShake(intensity) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  setFollowDistance(dist) {
    this.baseDistance = THREE.MathUtils.clamp(Number(dist) || 7.6, 5.0, 12.5);
  }

  resetBehindPlayer(playerYaw) {
    this.yaw = playerYaw || 0.12;
    this.pitch = 0.25;
  }

  orbit(deltaX, deltaY) {
    if (this.cinematicActive) return;
    const scale = this.aimMode ? 0.65 : 1.0;
    const yawSpeed = 0.0055 * this.sensitivity * scale;
    const pitchSpeed = 0.0042 * this.sensitivity * scale;

    this.yaw -= deltaX * yawSpeed;
    const yDir = this.invertY ? -1 : 1;
    this.pitch = THREE.MathUtils.clamp(this.pitch + deltaY * pitchSpeed * yDir, 0.02, 1.05);
  }

  _preventClipping(lookAt, desiredPos, colliders) {
    // 1. Pull in slightly if solid rock/pillar/monolith sits directly on camera boom
    if (colliders && colliders.length > 0) {
      let maxAllowedT = 1.0;
      const steps = 4;
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        this.samplePos.lerpVectors(lookAt, desiredPos, t);
        for (let i = 0; i < colliders.length; i++) {
          const col = colliders[i];
          if (!col || col.active === false) continue;
          if (col.type === 'rock' || col.type === 'pillar' || col.type === 'aabb') {
            if (col.type === 'aabb') {
              if (
                this.samplePos.x >= col.minX - 0.5 &&
                this.samplePos.x <= col.maxX + 0.5 &&
                this.samplePos.z >= col.minZ - 0.5 &&
                this.samplePos.z <= col.maxZ + 0.5 &&
                this.samplePos.y < (col.maxY || 7.0)
              ) {
                maxAllowedT = Math.min(maxAllowedT, Math.max(0.45, t - 0.18));
              }
            } else {
              const dx = this.samplePos.x - col.x;
              const dz = this.samplePos.z - col.z;
              const r = (col.radius || 0.9) + 0.45;
              const maxH = (col.height || 3.2) + 0.5;
              if (dx * dx + dz * dz < r * r && this.samplePos.y < this.getTerrainHeight(col.x, col.z) + maxH) {
                maxAllowedT = Math.min(maxAllowedT, Math.max(0.42, t - 0.16));
              }
            }
          }
        }
      }
      if (maxAllowedT < 0.99) {
        desiredPos.lerpVectors(lookAt, desiredPos, maxAllowedT);
      }
    }

    // 2. Check intermediate points along camera ray so ridges don't clip the camera frustum
    for (let s = 1; s <= 3; s++) {
      const t = 0.35 + (s / 3) * 0.65;
      this.samplePos.lerpVectors(lookAt, desiredPos, t);
      const groundH = this.getTerrainHeight(this.samplePos.x, this.samplePos.z) + 1.05;
      if (this.samplePos.y < groundH) {
        desiredPos.y += (groundH - this.samplePos.y);
      }
    }
    const groundBelowCam = this.getTerrainHeight(desiredPos.x, desiredPos.z) + 1.15;
    if (desiredPos.y < groundBelowCam) {
      desiredPos.y = groundBelowCam;
    }
  }

  update(dt, playerPos, lockedTargetPos = null, locomotion = null, colliders = null) {
    if (this.cinematicActive) {
      const lerpAlpha = 1 - Math.exp(-5.0 * dt);
      this.currentPosition.lerp(this.cinematicPos, lerpAlpha);
      this.currentLookAt.lerp(this.cinematicLookAt, lerpAlpha);
    } else {
      const speedRatio = locomotion ? THREE.MathUtils.clamp(locomotion.speedRatio || 0, 0, 1) : 0;
      const isSprinting = Boolean(locomotion && locomotion.isSprinting);

      // Relaxed distance during idle/walk; pulls back smoothly when running/sprinting for forward visibility
      const sprintPullback = isSprinting ? 1.55 : speedRatio > 0.36 ? speedRatio * 0.85 : 0;
      const targetDistance = this.menuOrbit
        ? 9.2
        : this.aimMode
          ? Math.max(3.9, this.baseDistance * 0.56)
          : this.baseDistance + sprintPullback;

      this.dynamicDistance = THREE.MathUtils.lerp(this.dynamicDistance, targetDistance, 1 - Math.exp(-4.5 * dt));

      if (this.menuOrbit) {
        this.yaw += dt * 0.12;
        this.pitch = 0.24;
      } else if (lockedTargetPos && !this.aimMode) {
        const dx = lockedTargetPos.x - playerPos.x;
        const dz = lockedTargetPos.z - playerPos.z;
        const targetYaw = Math.atan2(-dx, -dz);
        const diff = Math.atan2(Math.sin(targetYaw - this.yaw), Math.cos(targetYaw - this.yaw));
        this.yaw += diff * Math.min(1, dt * 6.5);
        this.pitch = THREE.MathUtils.lerp(this.pitch, 0.28, Math.min(1, dt * 5));
      }

      const horizDist = Math.cos(this.pitch) * this.dynamicDistance;
      const vertDist = Math.sin(this.pitch) * this.dynamicDistance;
      const shoulderOffset = this.menuOrbit ? 0.0 : this.aimMode ? 0.95 : 0.65;
      const rightX = Math.cos(this.yaw) * shoulderOffset;
      const rightZ = -Math.sin(this.yaw) * shoulderOffset;

      // Subtle forward look-ahead when running/sprinting so Kael sees upcoming terrain & threats
      const forwardAhead = this.menuOrbit || this.aimMode ? 0 : (isSprinting ? 1.05 : speedRatio * 0.55);
      const fwdX = -Math.sin(this.yaw) * forwardAhead;
      const fwdZ = -Math.cos(this.yaw) * forwardAhead;

      if (lockedTargetPos && !this.menuOrbit) {
        this.desiredLookAt.set(
          THREE.MathUtils.lerp(playerPos.x, lockedTargetPos.x, 0.42),
          THREE.MathUtils.lerp(playerPos.y + 1.55, lockedTargetPos.y + 1.4, 0.42),
          THREE.MathUtils.lerp(playerPos.z, lockedTargetPos.z, 0.42)
        );
      } else {
        this.desiredLookAt.set(
          playerPos.x + rightX * 0.55 + fwdX,
          playerPos.y + 1.55,
          playerPos.z + rightZ * 0.55 + fwdZ
        );
      }

      this.desiredPosition.set(
        playerPos.x + Math.sin(this.yaw) * horizDist + rightX,
        playerPos.y + (this.aimMode ? 1.55 : 1.65) + vertDist,
        playerPos.z + Math.cos(this.yaw) * horizDist + rightZ
      );

      if (!this.menuOrbit) {
        this._preventClipping(this.desiredLookAt, this.desiredPosition, colliders);
      } else {
        const groundBelowCam = this.getTerrainHeight(this.desiredPosition.x, this.desiredPosition.z);
        if (this.desiredPosition.y < groundBelowCam + 1.15) {
          this.desiredPosition.y = groundBelowCam + 1.15;
        }
      }

      const posLerp = 1 - Math.exp(-(isSprinting ? 9.2 : 7.8) * dt);
      const lookLerp = 1 - Math.exp(-10.5 * dt);
      this.currentPosition.lerp(this.desiredPosition, posLerp);
      this.currentLookAt.lerp(this.desiredLookAt, lookLerp);
    }

    this.camera.position.copy(this.currentPosition);
    if (this.shakeIntensity > 0.005) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= Math.exp(-6.5 * dt);
    } else {
      this.shakeIntensity = 0;
    }

    this.camera.lookAt(this.currentLookAt);
  }
}
