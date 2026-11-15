import * as THREE from 'three';

/**
 * Builds genuine THREE.AnimationClip keyframes (QuaternionKeyframeTrack & VectorKeyframeTrack)
 * for Kael's humanoid Bone hierarchy. Every bone pose is composed relative to restTransforms
 * so crossFade transitions never snap or distort joint lengths.
 */
export function buildKaelAnimationClips(restTransforms) {
  const euler = new THREE.Euler();
  const qTemp = new THREE.Quaternion();
  const qBase = new THREE.Quaternion();

  function poseQuat(boneName, rx = 0, ry = 0, rz = 0) {
    const rest = restTransforms[boneName];
    qBase.copy(rest ? rest.quaternion : new THREE.Quaternion());
    euler.set(rx, ry, rz, 'YXZ');
    qTemp.setFromEuler(euler);
    qBase.multiply(qTemp);
    return [qBase.x, qBase.y, qBase.z, qBase.w];
  }

  function posVec(boneName, dx = 0, dy = 0, dz = 0) {
    const rest = restTransforms[boneName];
    const p = rest ? rest.position : new THREE.Vector3();
    return [p.x + dx, p.y + dy, p.z + dz];
  }

  function makeClip(name, duration, boneKeyframes) {
    const tracks = [];
    for (const [boneName, frames] of Object.entries(boneKeyframes)) {
      const times = [];
      const quatValues = [];
      const posValues = [];
      let hasPos = false;

      frames.forEach((kf) => {
        times.push(kf.t);
        const q = poseQuat(boneName, kf.rx || 0, kf.ry || 0, kf.rz || 0);
        quatValues.push(...q);
        if (kf.dx !== undefined || kf.dy !== undefined || kf.dz !== undefined) {
          hasPos = true;
          posValues.push(...posVec(boneName, kf.dx || 0, kf.dy || 0, kf.dz || 0));
        } else if (hasPos) {
          posValues.push(...posVec(boneName, 0, 0, 0));
        }
      });

      tracks.push(new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, quatValues));
      if (hasPos) {
        tracks.push(new THREE.VectorKeyframeTrack(`${boneName}.position`, times, posValues));
      }
    }
    return new THREE.AnimationClip(name, duration, tracks);
  }

  const clips = {};

  // ── 1. IDLE (Breathing + subtle hero stance) ───────────────────────────────
  clips.IDLE = makeClip('IDLE', 2.4, {
    Hips: [
      { t: 0, dy: 0, ry: 0.08 },
      { t: 1.2, dy: -0.014, ry: 0.06 },
      { t: 2.4, dy: 0, ry: 0.08 },
    ],
    Spine: [
      { t: 0, rx: 0.02 },
      { t: 1.2, rx: 0.05 },
      { t: 2.4, rx: 0.02 },
    ],
    Chest: [
      { t: 0, rx: -0.02 },
      { t: 1.2, rx: -0.06 },
      { t: 2.4, rx: -0.02 },
    ],
    Head: [
      { t: 0, ry: -0.06, rx: 0.02 },
      { t: 1.2, ry: 0.05, rx: -0.01 },
      { t: 2.4, ry: -0.06, rx: 0.02 },
    ],
    RightUpperArm: [
      { t: 0, rx: 0.14, rz: -0.14 },
      { t: 1.2, rx: 0.18, rz: -0.17 },
      { t: 2.4, rx: 0.14, rz: -0.14 },
    ],
    RightForearm: [
      { t: 0, rx: 0.34 },
      { t: 1.2, rx: 0.38 },
      { t: 2.4, rx: 0.34 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 0.1, rz: 0.14 },
      { t: 1.2, rx: 0.14, rz: 0.17 },
      { t: 2.4, rx: 0.1, rz: 0.14 },
    ],
    LeftForearm: [
      { t: 0, rx: 0.28 },
      { t: 1.2, rx: 0.32 },
      { t: 2.4, rx: 0.28 },
    ],
    LeftThigh: [{ t: 0, rx: 0.05, rz: 0.04 }, { t: 2.4, rx: 0.05, rz: 0.04 }],
    RightThigh: [{ t: 0, rx: -0.05, rz: -0.04 }, { t: 2.4, rx: -0.05, rz: -0.04 }],
  });

  // ── 2. LOOK AROUND (Idle ambient scan) ─────────────────────────────────────
  clips.LOOK_AROUND = makeClip('LOOK_AROUND', 3.0, {
    Chest: [
      { t: 0, ry: 0 },
      { t: 0.9, ry: 0.18 },
      { t: 2.0, ry: -0.2 },
      { t: 3.0, ry: 0 },
    ],
    Head: [
      { t: 0, ry: 0, rx: 0 },
      { t: 0.9, ry: 0.48, rx: -0.06 },
      { t: 2.0, ry: -0.52, rx: 0.05 },
      { t: 3.0, ry: 0, rx: 0 },
    ],
    RightUpperArm: [{ t: 0, rx: 0.16, rz: -0.15 }, { t: 3.0, rx: 0.16, rz: -0.15 }],
    LeftUpperArm: [{ t: 0, rx: 0.14, rz: 0.15 }, { t: 3.0, rx: 0.14, rz: 0.15 }],
  });

  // ── 3. WALK (Natural heel-toe cycle, zero foot slide) ──────────────────────
  clips.WALK = makeClip('WALK', 0.96, {
    Hips: [
      { t: 0, dy: 0.015, ry: -0.07 },
      { t: 0.24, dy: -0.025, ry: 0 },
      { t: 0.48, dy: 0.015, ry: 0.07 },
      { t: 0.72, dy: -0.025, ry: 0 },
      { t: 0.96, dy: 0.015, ry: -0.07 },
    ],
    Spine: [
      { t: 0, rx: -0.06, ry: 0.08 },
      { t: 0.48, rx: -0.06, ry: -0.08 },
      { t: 0.96, rx: -0.06, ry: 0.08 },
    ],
    LeftThigh: [
      { t: 0, rx: 0.46 },
      { t: 0.24, rx: 0.05 },
      { t: 0.48, rx: -0.38 },
      { t: 0.72, rx: 0.14 },
      { t: 0.96, rx: 0.46 },
    ],
    LeftShin: [
      { t: 0, rx: -0.12 },
      { t: 0.24, rx: -0.24 },
      { t: 0.48, rx: -0.16 },
      { t: 0.72, rx: -0.68 },
      { t: 0.96, rx: -0.12 },
    ],
    LeftFoot: [
      { t: 0, rx: 0.14 },
      { t: 0.24, rx: 0.0 },
      { t: 0.48, rx: -0.22 },
      { t: 0.72, rx: 0.16 },
      { t: 0.96, rx: 0.14 },
    ],
    RightThigh: [
      { t: 0, rx: -0.38 },
      { t: 0.24, rx: 0.14 },
      { t: 0.48, rx: 0.46 },
      { t: 0.72, rx: 0.05 },
      { t: 0.96, rx: -0.38 },
    ],
    RightShin: [
      { t: 0, rx: -0.16 },
      { t: 0.24, rx: -0.68 },
      { t: 0.48, rx: -0.12 },
      { t: 0.72, rx: -0.24 },
      { t: 0.96, rx: -0.16 },
    ],
    RightFoot: [
      { t: 0, rx: -0.22 },
      { t: 0.24, rx: 0.16 },
      { t: 0.48, rx: 0.14 },
      { t: 0.72, rx: 0.0 },
      { t: 0.96, rx: -0.22 },
    ],
    RightUpperArm: [
      { t: 0, rx: 0.34, rz: -0.12 },
      { t: 0.48, rx: -0.28, rz: -0.12 },
      { t: 0.96, rx: 0.34, rz: -0.12 },
    ],
    RightForearm: [
      { t: 0, rx: 0.42 },
      { t: 0.48, rx: 0.22 },
      { t: 0.96, rx: 0.42 },
    ],
    LeftUpperArm: [
      { t: 0, rx: -0.28, rz: 0.12 },
      { t: 0.48, rx: 0.34, rz: 0.12 },
      { t: 0.96, rx: -0.28, rz: 0.12 },
    ],
    LeftForearm: [
      { t: 0, rx: 0.22 },
      { t: 0.48, rx: 0.42 },
      { t: 0.96, rx: 0.22 },
    ],
  });

  // ── 4. RUN (Athletic forward combat run) ───────────────────────────────────
  clips.RUN = makeClip('RUN', 0.68, {
    Hips: [
      { t: 0, dy: 0.04, ry: -0.11 },
      { t: 0.17, dy: -0.04, ry: 0 },
      { t: 0.34, dy: 0.04, ry: 0.11 },
      { t: 0.51, dy: -0.04, ry: 0 },
      { t: 0.68, dy: 0.04, ry: -0.11 },
    ],
    Spine: [
      { t: 0, rx: -0.18, ry: 0.12 },
      { t: 0.34, rx: -0.18, ry: -0.12 },
      { t: 0.68, rx: -0.18, ry: 0.12 },
    ],
    Head: [{ t: 0, rx: 0.12 }, { t: 0.68, rx: 0.12 }],
    LeftThigh: [
      { t: 0, rx: 0.74 },
      { t: 0.17, rx: 0.05 },
      { t: 0.34, rx: -0.62 },
      { t: 0.51, rx: 0.28 },
      { t: 0.68, rx: 0.74 },
    ],
    LeftShin: [
      { t: 0, rx: -0.25 },
      { t: 0.17, rx: -0.35 },
      { t: 0.34, rx: -0.24 },
      { t: 0.51, rx: -1.12 },
      { t: 0.68, rx: -0.25 },
    ],
    RightThigh: [
      { t: 0, rx: -0.62 },
      { t: 0.17, rx: 0.28 },
      { t: 0.34, rx: 0.74 },
      { t: 0.51, rx: 0.05 },
      { t: 0.68, rx: -0.62 },
    ],
    RightShin: [
      { t: 0, rx: -0.24 },
      { t: 0.17, rx: -1.12 },
      { t: 0.34, rx: -0.25 },
      { t: 0.51, rx: -0.35 },
      { t: 0.68, rx: -0.24 },
    ],
    RightUpperArm: [
      { t: 0, rx: 0.66, rz: -0.14 },
      { t: 0.34, rx: -0.52, rz: -0.14 },
      { t: 0.68, rx: 0.66, rz: -0.14 },
    ],
    RightForearm: [{ t: 0, rx: 0.95 }, { t: 0.68, rx: 0.95 }],
    LeftUpperArm: [
      { t: 0, rx: -0.52, rz: 0.14 },
      { t: 0.34, rx: 0.66, rz: 0.14 },
      { t: 0.68, rx: -0.52, rz: 0.14 },
    ],
    LeftForearm: [{ t: 0, rx: 0.95 }, { t: 0.68, rx: 0.95 }],
  });

  // ── 5. SPRINT (High-velocity dash forward lean) ────────────────────────────
  clips.SPRINT = makeClip('SPRINT', 0.52, {
    Hips: [
      { t: 0, dy: 0.055, ry: -0.14 },
      { t: 0.13, dy: -0.05, ry: 0 },
      { t: 0.26, dy: 0.055, ry: 0.14 },
      { t: 0.39, dy: -0.05, ry: 0 },
      { t: 0.52, dy: 0.055, ry: -0.14 },
    ],
    Spine: [
      { t: 0, rx: -0.32, ry: 0.16 },
      { t: 0.26, rx: -0.32, ry: -0.16 },
      { t: 0.52, rx: -0.32, ry: 0.16 },
    ],
    Head: [{ t: 0, rx: 0.24 }, { t: 0.52, rx: 0.24 }],
    LeftThigh: [
      { t: 0, rx: 0.92 },
      { t: 0.26, rx: -0.78 },
      { t: 0.52, rx: 0.92 },
    ],
    LeftShin: [
      { t: 0, rx: -0.35 },
      { t: 0.39, rx: -1.32 },
      { t: 0.52, rx: -0.35 },
    ],
    RightThigh: [
      { t: 0, rx: -0.78 },
      { t: 0.26, rx: 0.92 },
      { t: 0.52, rx: -0.78 },
    ],
    RightShin: [
      { t: 0, rx: -0.35 },
      { t: 0.13, rx: -1.32 },
      { t: 0.52, rx: -0.35 },
    ],
    RightUpperArm: [
      { t: 0, rx: 0.85, rz: -0.15 },
      { t: 0.26, rx: -0.68, rz: -0.15 },
      { t: 0.52, rx: 0.85, rz: -0.15 },
    ],
    RightForearm: [{ t: 0, rx: 1.1 }, { t: 0.52, rx: 1.1 }],
    LeftUpperArm: [
      { t: 0, rx: -0.68, rz: 0.15 },
      { t: 0.26, rx: 0.85, rz: 0.15 },
      { t: 0.52, rx: -0.68, rz: 0.15 },
    ],
    LeftForearm: [{ t: 0, rx: 1.1 }, { t: 0.52, rx: 1.1 }],
  });

  // ── 6. WALK BACKWARD & STRAFE LEFT / RIGHT ─────────────────────────────────
  clips.WALK_BACKWARD = makeClip('WALK_BACKWARD', 0.92, {
    Hips: [
      { t: 0, dy: -0.02 },
      { t: 0.23, dy: 0.015 },
      { t: 0.46, dy: -0.02 },
      { t: 0.69, dy: 0.015 },
      { t: 0.92, dy: -0.02 },
    ],
    Spine: [{ t: 0, rx: 0.08 }, { t: 0.92, rx: 0.08 }],
    LeftThigh: [
      { t: 0, rx: -0.34 },
      { t: 0.46, rx: 0.36 },
      { t: 0.92, rx: -0.34 },
    ],
    LeftShin: [
      { t: 0, rx: -0.2 },
      { t: 0.23, rx: -0.58 },
      { t: 0.46, rx: -0.15 },
      { t: 0.92, rx: -0.2 },
    ],
    RightThigh: [
      { t: 0, rx: 0.36 },
      { t: 0.46, rx: -0.34 },
      { t: 0.92, rx: 0.36 },
    ],
    RightShin: [
      { t: 0, rx: -0.15 },
      { t: 0.69, rx: -0.58 },
      { t: 0.92, rx: -0.15 },
    ],
    LeftUpperArm: [{ t: 0, rx: 0.55, rz: 0.18 }, { t: 0.92, rx: 0.55, rz: 0.18 }],
    LeftForearm: [{ t: 0, rx: 0.72 }, { t: 0.92, rx: 0.72 }],
    RightUpperArm: [{ t: 0, rx: 0.38, rz: -0.18 }, { t: 0.92, rx: 0.38, rz: -0.18 }],
    RightForearm: [{ t: 0, rx: 0.62 }, { t: 0.92, rx: 0.62 }],
  });

  clips.STRAFE_LEFT = makeClip('STRAFE_LEFT', 0.76, {
    Hips: [{ t: 0, dy: 0.01, rz: 0.06 }, { t: 0.38, dy: -0.03, rz: 0.02 }, { t: 0.76, dy: 0.01, rz: 0.06 }],
    LeftThigh: [{ t: 0, rz: 0.34, rx: 0.12 }, { t: 0.38, rz: -0.08, rx: 0.12 }, { t: 0.76, rz: 0.34, rx: 0.12 }],
    RightThigh: [{ t: 0, rz: 0.05, rx: 0.12 }, { t: 0.38, rz: -0.32, rx: 0.12 }, { t: 0.76, rz: 0.05, rx: 0.12 }],
    LeftShin: [{ t: 0, rx: -0.25 }, { t: 0.38, rx: -0.45 }, { t: 0.76, rx: -0.25 }],
    RightShin: [{ t: 0, rx: -0.45 }, { t: 0.38, rx: -0.25 }, { t: 0.76, rx: -0.45 }],
    LeftUpperArm: [{ t: 0, rx: 0.52, rz: 0.2 }, { t: 0.76, rx: 0.52, rz: 0.2 }],
    RightUpperArm: [{ t: 0, rx: 0.45, rz: -0.2 }, { t: 0.76, rx: 0.45, rz: -0.2 }],
  });

  clips.STRAFE_RIGHT = makeClip('STRAFE_RIGHT', 0.76, {
    Hips: [{ t: 0, dy: 0.01, rz: -0.06 }, { t: 0.38, dy: -0.03, rz: -0.02 }, { t: 0.76, dy: 0.01, rz: -0.06 }],
    RightThigh: [{ t: 0, rz: -0.34, rx: 0.12 }, { t: 0.38, rz: 0.08, rx: 0.12 }, { t: 0.76, rz: -0.34, rx: 0.12 }],
    LeftThigh: [{ t: 0, rz: -0.05, rx: 0.12 }, { t: 0.38, rz: 0.32, rx: 0.12 }, { t: 0.76, rz: -0.05, rx: 0.12 }],
    RightShin: [{ t: 0, rx: -0.25 }, { t: 0.38, rx: -0.45 }, { t: 0.76, rx: -0.25 }],
    LeftShin: [{ t: 0, rx: -0.45 }, { t: 0.38, rx: -0.25 }, { t: 0.76, rx: -0.45 }],
    LeftUpperArm: [{ t: 0, rx: 0.52, rz: 0.2 }, { t: 0.76, rx: 0.52, rz: 0.2 }],
    RightUpperArm: [{ t: 0, rx: 0.45, rz: -0.2 }, { t: 0.76, rx: 0.45, rz: -0.2 }],
  });

  // ── 7. JUMP, FALL, LAND & TURN ─────────────────────────────────────────────
  clips.JUMP = makeClip('JUMP', 0.42, {
    Hips: [{ t: 0, dy: -0.08 }, { t: 0.16, dy: 0.06 }, { t: 0.42, dy: 0.04 }],
    Spine: [{ t: 0, rx: -0.15 }, { t: 0.42, rx: 0.06 }],
    LeftThigh: [{ t: 0, rx: 0.45 }, { t: 0.42, rx: 0.65 }],
    LeftShin: [{ t: 0, rx: -0.65 }, { t: 0.42, rx: -0.95 }],
    RightThigh: [{ t: 0, rx: 0.2 }, { t: 0.42, rx: -0.22 }],
    RightShin: [{ t: 0, rx: -0.35 }, { t: 0.42, rx: -0.45 }],
    LeftUpperArm: [{ t: 0, rx: 0.65, rz: 0.45 }, { t: 0.42, rx: 1.45, rz: 0.55 }],
    RightUpperArm: [{ t: 0, rx: 0.55, rz: -0.45 }, { t: 0.42, rx: 1.35, rz: -0.55 }],
  });

  clips.FALL = makeClip('FALL', 0.6, {
    Spine: [{ t: 0, rx: -0.08 }, { t: 0.3, rx: -0.12 }, { t: 0.6, rx: -0.08 }],
    LeftThigh: [{ t: 0, rx: 0.42 }, { t: 0.3, rx: 0.52 }, { t: 0.6, rx: 0.42 }],
    LeftShin: [{ t: 0, rx: -0.65 }, { t: 0.6, rx: -0.65 }],
    RightThigh: [{ t: 0, rx: 0.18 }, { t: 0.3, rx: 0.26 }, { t: 0.6, rx: 0.18 }],
    RightShin: [{ t: 0, rx: -0.42 }, { t: 0.6, rx: -0.42 }],
    LeftUpperArm: [{ t: 0, rx: 0.9, rz: 0.72 }, { t: 0.3, rx: 1.05, rz: 0.85 }, { t: 0.6, rx: 0.9, rz: 0.72 }],
    RightUpperArm: [{ t: 0, rx: 0.9, rz: -0.72 }, { t: 0.3, rx: 1.05, rz: -0.85 }, { t: 0.6, rx: 0.9, rz: -0.72 }],
  });

  clips.LAND = makeClip('LAND', 0.30, {
    Hips: [{ t: 0, dy: -0.18 }, { t: 0.14, dy: -0.22 }, { t: 0.30, dy: 0 }],
    Spine: [{ t: 0, rx: -0.28 }, { t: 0.30, rx: -0.04 }],
    LeftThigh: [{ t: 0, rx: 0.68 }, { t: 0.30, rx: 0.06 }],
    LeftShin: [{ t: 0, rx: -1.15 }, { t: 0.30, rx: -0.1 }],
    RightThigh: [{ t: 0, rx: 0.68 }, { t: 0.30, rx: -0.06 }],
    RightShin: [{ t: 0, rx: -1.15 }, { t: 0.30, rx: -0.1 }],
    LeftUpperArm: [{ t: 0, rx: 0.4, rz: 0.45 }, { t: 0.30, rx: 0.1, rz: 0.14 }],
    RightUpperArm: [{ t: 0, rx: 0.4, rz: -0.45 }, { t: 0.30, rx: 0.14, rz: -0.14 }],
  });

  // ── 8. COMBAT CLIPS: Complete 3-Hit Sword Combo + 2-Handed Heavy Cleave ────
  // Attack 1 – Light Horizontal Slash (windup -> torso torque + wrist pronation -> follow-through)
  clips.COMBO_1 = makeClip('COMBO_1', 0.42, {
    Hips: [
      { t: 0, dy: -0.03, ry: -0.22 },
      { t: 0.14, dy: -0.06, ry: 0.28 },
      { t: 0.28, dy: -0.02, ry: 0.34 },
      { t: 0.42, dy: 0, ry: 0.08 },
    ],
    Spine: [
      { t: 0, ry: -0.44, rx: -0.08 },
      { t: 0.14, ry: 0.48, rx: -0.18 },
      { t: 0.28, ry: 0.56, rx: -0.12 },
      { t: 0.42, ry: 0.12, rx: -0.04 },
    ],
    Chest: [
      { t: 0, ry: -0.28 },
      { t: 0.14, ry: 0.42 },
      { t: 0.42, ry: 0.08 },
    ],
    LeftThigh: [
      { t: 0, rx: 0.22 },
      { t: 0.14, rx: 0.48 },
      { t: 0.42, rx: 0.08 },
    ],
    LeftShin: [
      { t: 0, rx: -0.28 },
      { t: 0.14, rx: -0.58 },
      { t: 0.42, rx: -0.12 },
    ],
    RightThigh: [
      { t: 0, rx: -0.18 },
      { t: 0.14, rx: -0.42 },
      { t: 0.42, rx: -0.06 },
    ],
    RightUpperArm: [
      { t: 0, rx: 1.25, ry: -0.95, rz: -0.68 },
      { t: 0.14, rx: 1.18, ry: 0.18, rz: -0.22 },
      { t: 0.26, rx: 0.92, ry: 1.16, rz: 0.48 },
      { t: 0.42, rx: 0.46, ry: 0.28, rz: -0.16 },
    ],
    RightForearm: [
      { t: 0, rx: 0.78 },
      { t: 0.14, rx: 0.22 },
      { t: 0.26, rx: 0.14 },
      { t: 0.42, rx: 0.38 },
    ],
    RightHand: [
      { t: 0, ry: -0.35, rz: 0.36 },
      { t: 0.14, ry: 0.1, rz: -0.12 },
      { t: 0.26, ry: 0.38, rz: -0.34 },
      { t: 0.42, ry: 0.05, rz: 0 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 0.24, rz: 0.32 },
      { t: 0.14, rx: -0.38, rz: 0.48 },
      { t: 0.42, rx: 0.14, rz: 0.18 },
    ],
  });

  // Attack 2 – Reverse Slash (smooth backhand arc from Attack 1 follow-through + foot pivot)
  clips.COMBO_2 = makeClip('COMBO_2', 0.42, {
    Hips: [
      { t: 0, dy: -0.04, ry: 0.32 },
      { t: 0.15, dy: -0.07, ry: -0.28 },
      { t: 0.28, dy: -0.03, ry: -0.38 },
      { t: 0.42, dy: 0, ry: -0.04 },
    ],
    Spine: [
      { t: 0, ry: 0.54, rx: -0.12 },
      { t: 0.15, ry: -0.52, rx: -0.18 },
      { t: 0.28, ry: -0.60, rx: -0.12 },
      { t: 0.42, ry: -0.08, rx: -0.04 },
    ],
    Chest: [
      { t: 0, ry: 0.36 },
      { t: 0.15, ry: -0.46 },
      { t: 0.42, ry: -0.06 },
    ],
    RightThigh: [
      { t: 0, rx: 0.18 },
      { t: 0.15, rx: 0.52 },
      { t: 0.42, rx: 0.06 },
    ],
    RightShin: [
      { t: 0, rx: -0.24 },
      { t: 0.15, rx: -0.62 },
      { t: 0.42, rx: -0.1 },
    ],
    LeftThigh: [
      { t: 0, rx: -0.2 },
      { t: 0.15, rx: -0.44 },
      { t: 0.42, rx: -0.06 },
    ],
    RightUpperArm: [
      { t: 0, rx: 0.98, ry: 1.12, rz: 0.44 },
      { t: 0.15, rx: 1.24, ry: -0.15, rz: -0.28 },
      { t: 0.26, rx: 1.12, ry: -1.04, rz: -0.68 },
      { t: 0.42, rx: 0.42, ry: -0.12, rz: -0.18 },
    ],
    RightForearm: [
      { t: 0, rx: 0.18 },
      { t: 0.15, rx: 0.16 },
      { t: 0.26, rx: 0.32 },
      { t: 0.42, rx: 0.36 },
    ],
    RightHand: [
      { t: 0, ry: 0.35, rz: -0.32 },
      { t: 0.15, ry: -0.15, rz: 0.18 },
      { t: 0.26, ry: -0.42, rz: 0.38 },
      { t: 0.42, ry: 0, rz: 0 },
    ],
  });

  // Attack 3 – Finishing Slash (full-body 360 rotation + lunging cleave + strong follow-through)
  clips.COMBO_3 = makeClip('COMBO_3', 0.56, {
    Hips: [
      { t: 0, dy: -0.04, ry: -0.35 },
      { t: 0.18, dy: 0.08, ry: 2.4 },
      { t: 0.34, dy: -0.08, ry: 5.95 },
      { t: 0.56, dy: 0, ry: Math.PI * 2 },
    ],
    Spine: [
      { t: 0, rx: 0.18, ry: -0.42 },
      { t: 0.24, rx: -0.28, ry: 0.38 },
      { t: 0.38, rx: -0.36, ry: 0.46 },
      { t: 0.56, rx: -0.05, ry: 0 },
    ],
    LeftThigh: [
      { t: 0, rx: 0.25 },
      { t: 0.30, rx: 0.64 },
      { t: 0.56, rx: 0.06 },
    ],
    LeftShin: [
      { t: 0, rx: -0.35 },
      { t: 0.30, rx: -0.88 },
      { t: 0.56, rx: -0.1 },
    ],
    RightUpperArm: [
      { t: 0, rx: 2.25, ry: -0.5, rz: -0.45 },
      { t: 0.26, rx: 1.05, ry: 0.85, rz: 0.38 },
      { t: 0.38, rx: 0.58, ry: 1.15, rz: 0.52 },
      { t: 0.56, rx: 0.32, ry: 0, rz: -0.15 },
    ],
    RightHand: [
      { t: 0, ry: -0.25, rz: 0.3 },
      { t: 0.28, ry: 0.38, rz: -0.36 },
      { t: 0.56, ry: 0, rz: 0 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 1.85, rz: 0.38 },
      { t: 0.28, rx: 0.42, rz: 0.42 },
      { t: 0.56, rx: 0.16, rz: 0.16 },
    ],
  });

  // Heavy Sword Attack – Two-handed high overhead anticipation + crushing cleave
  clips.SWORD_HEAVY = makeClip('SWORD_HEAVY', 0.72, {
    Hips: [
      { t: 0, dy: -0.04, ry: 0.08 },
      { t: 0.24, dy: 0.11, ry: -0.14 },
      { t: 0.40, dy: -0.16, ry: 0.24 },
      { t: 0.54, dy: -0.12, ry: 0.18 },
      { t: 0.72, dy: 0, ry: 0.06 },
    ],
    Spine: [
      { t: 0, rx: 0.18 },
      { t: 0.24, rx: 0.34 },
      { t: 0.40, rx: -0.48 },
      { t: 0.54, rx: -0.34 },
      { t: 0.72, rx: -0.04 },
    ],
    Chest: [
      { t: 0, rx: 0.12 },
      { t: 0.24, rx: 0.22 },
      { t: 0.40, rx: -0.32 },
      { t: 0.72, rx: 0 },
    ],
    LeftThigh: [
      { t: 0, rx: 0.24 },
      { t: 0.40, rx: 0.68 },
      { t: 0.72, rx: 0.06 },
    ],
    LeftShin: [
      { t: 0, rx: -0.32 },
      { t: 0.40, rx: -1.04 },
      { t: 0.72, rx: -0.1 },
    ],
    RightUpperArm: [
      { t: 0, rx: 1.95, ry: -0.15, rz: -0.15 },
      { t: 0.24, rx: 2.68, ry: -0.08, rz: -0.08 },
      { t: 0.40, rx: 0.52, ry: 0.22, rz: 0.12 },
      { t: 0.72, rx: 0.28, ry: 0, rz: -0.14 },
    ],
    RightForearm: [
      { t: 0, rx: 0.92 },
      { t: 0.24, rx: 0.65 },
      { t: 0.40, rx: 0.12 },
      { t: 0.72, rx: 0.35 },
    ],
    RightHand: [
      { t: 0, rx: 0.18 },
      { t: 0.24, rx: 0.36 },
      { t: 0.40, rx: -0.42 },
      { t: 0.72, rx: 0 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 1.85, ry: 0.18, rz: 0.18 },
      { t: 0.24, rx: 2.58, ry: 0.22, rz: 0.08 },
      { t: 0.40, rx: 0.62, ry: -0.22, rz: -0.08 },
      { t: 0.72, rx: 0.2, ry: 0, rz: 0.14 },
    ],
    LeftForearm: [
      { t: 0, rx: 0.88 },
      { t: 0.24, rx: 0.72 },
      { t: 0.40, rx: 0.25 },
      { t: 0.72, rx: 0.28 },
    ],
  });

  // Poised Guardian Sword Ready Stance (alert guard idle between strikes)
  clips.SWORD_READY = makeClip('SWORD_READY', 1.8, {
    Hips: [
      { t: 0, dy: -0.05, ry: 0.24 },
      { t: 0.9, dy: -0.07, ry: 0.26 },
      { t: 1.8, dy: -0.05, ry: 0.24 },
    ],
    Spine: [
      { t: 0, rx: -0.08, ry: -0.18 },
      { t: 0.9, rx: -0.11, ry: -0.20 },
      { t: 1.8, rx: -0.08, ry: -0.18 },
    ],
    LeftThigh: [{ t: 0, rx: 0.24, rz: 0.04 }, { t: 1.8, rx: 0.24, rz: 0.04 }],
    LeftShin: [{ t: 0, rx: -0.34 }, { t: 1.8, rx: -0.34 }],
    RightThigh: [{ t: 0, rx: -0.18, rz: -0.05 }, { t: 1.8, rx: -0.18, rz: -0.05 }],
    RightShin: [{ t: 0, rx: -0.18 }, { t: 1.8, rx: -0.18 }],
    RightUpperArm: [
      { t: 0, rx: 0.56, ry: -0.16, rz: -0.24 },
      { t: 0.9, rx: 0.62, ry: -0.14, rz: -0.22 },
      { t: 1.8, rx: 0.56, ry: -0.16, rz: -0.24 },
    ],
    RightForearm: [
      { t: 0, rx: 0.72 },
      { t: 0.9, rx: 0.78 },
      { t: 1.8, rx: 0.72 },
    ],
    RightHand: [{ t: 0, ry: -0.18, rz: 0.12 }, { t: 1.8, ry: -0.18, rz: 0.12 }],
    LeftUpperArm: [
      { t: 0, rx: 0.68, ry: -0.32, rz: 0.22 },
      { t: 0.9, rx: 0.72, ry: -0.30, rz: 0.24 },
      { t: 1.8, rx: 0.68, ry: -0.32, rz: 0.22 },
    ],
    LeftForearm: [{ t: 0, rx: 0.64 }, { t: 1.8, rx: 0.64 }],
  });

  // Running Dash Sword Slash
  clips.SWORD_RUNNING_ATTACK = makeClip('SWORD_RUNNING_ATTACK', 0.46, {
    Spine: [
      { t: 0, rx: -0.24, ry: -0.46 },
      { t: 0.18, rx: -0.34, ry: 0.62 },
      { t: 0.46, rx: -0.12, ry: 0.04 },
    ],
    Chest: [
      { t: 0, ry: -0.28 },
      { t: 0.18, ry: 0.44 },
      { t: 0.46, ry: 0 },
    ],
    RightUpperArm: [
      { t: 0, rx: 1.48, ry: -0.82, rz: -0.58 },
      { t: 0.18, rx: 0.96, ry: 1.08, rz: 0.42 },
      { t: 0.46, rx: 0.44, ry: 0.08, rz: -0.16 },
    ],
    RightForearm: [
      { t: 0, rx: 0.42 },
      { t: 0.18, rx: 0.12 },
      { t: 0.46, rx: 0.45 },
    ],
    RightHand: [
      { t: 0, ry: -0.24, rz: 0.28 },
      { t: 0.18, ry: 0.34, rz: -0.32 },
      { t: 0.46, ry: 0, rz: 0 },
    ],
    LeftUpperArm: [
      { t: 0, rx: -0.26, rz: 0.32 },
      { t: 0.18, rx: 0.56, rz: 0.42 },
      { t: 0.46, rx: 0.22, rz: 0.16 },
    ],
  });

  // Aerial Plunging Sword Cleave
  clips.SWORD_JUMP_ATTACK = makeClip('SWORD_JUMP_ATTACK', 0.50, {
    Hips: [
      { t: 0, dy: 0.14, rx: -0.12 },
      { t: 0.22, dy: -0.18, rx: 0.16 },
      { t: 0.50, dy: 0, rx: 0 },
    ],
    Spine: [
      { t: 0, rx: 0.28 },
      { t: 0.22, rx: -0.54 },
      { t: 0.50, rx: -0.06 },
    ],
    LeftThigh: [
      { t: 0, rx: 0.58 },
      { t: 0.22, rx: 0.72 },
      { t: 0.50, rx: 0.08 },
    ],
    LeftShin: [
      { t: 0, rx: -0.92 },
      { t: 0.22, rx: -1.12 },
      { t: 0.50, rx: -0.12 },
    ],
    RightUpperArm: [
      { t: 0, rx: 2.62, ry: -0.14, rz: -0.18 },
      { t: 0.22, rx: 0.38, ry: 0.28, rz: 0.14 },
      { t: 0.50, rx: 0.34, ry: 0, rz: -0.15 },
    ],
    RightForearm: [
      { t: 0, rx: 0.48 },
      { t: 0.22, rx: 0.12 },
      { t: 0.50, rx: 0.36 },
    ],
    RightHand: [
      { t: 0, rx: 0.28 },
      { t: 0.22, rx: -0.44 },
      { t: 0.50, rx: 0 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 2.38, rz: 0.22 },
      { t: 0.22, rx: 0.52, rz: 0.14 },
      { t: 0.50, rx: 0.24, rz: 0.16 },
    ],
  });

  // Post-Dodge Rising Counter Slash
  clips.SWORD_DODGE_ATTACK = makeClip('SWORD_DODGE_ATTACK', 0.42, {
    Hips: [
      { t: 0, dy: -0.14, ry: 0.34 },
      { t: 0.16, dy: 0.06, ry: -0.32 },
      { t: 0.42, dy: 0, ry: 0 },
    ],
    Spine: [
      { t: 0, rx: -0.22, ry: 0.54 },
      { t: 0.16, rx: 0.14, ry: -0.52 },
      { t: 0.42, rx: -0.04, ry: 0 },
    ],
    RightThigh: [
      { t: 0, rx: 0.34 },
      { t: 0.16, rx: 0.58 },
      { t: 0.42, rx: -0.04 },
    ],
    RightShin: [
      { t: 0, rx: -0.52 },
      { t: 0.16, rx: -0.76 },
      { t: 0.42, rx: -0.10 },
    ],
    RightUpperArm: [
      { t: 0, rx: 0.42, ry: 0.92, rz: 0.42 },
      { t: 0.16, rx: 1.72, ry: -0.78, rz: -0.56 },
      { t: 0.42, rx: 0.38, ry: -0.08, rz: -0.16 },
    ],
    RightForearm: [
      { t: 0, rx: 0.26 },
      { t: 0.16, rx: 0.14 },
      { t: 0.42, rx: 0.40 },
    ],
    RightHand: [
      { t: 0, ry: 0.34, rz: -0.28 },
      { t: 0.16, ry: -0.36, rz: 0.34 },
      { t: 0.42, ry: 0, rz: 0 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 0.62, rz: 0.38 },
      { t: 0.16, rx: 0.34, rz: 0.52 },
      { t: 0.42, rx: 0.22, rz: 0.16 },
    ],
  });

  // ── 8B. AXE COMBAT CLIPS (Heavy Weight, Wide Arcs, Overhead & Running Cleave) ─
  clips.AXE_READY = makeClip('AXE_READY', 1.9, {
    Hips: [
      { t: 0, dy: -0.07, ry: 0.28 },
      { t: 0.95, dy: -0.09, ry: 0.30 },
      { t: 1.9, dy: -0.07, ry: 0.28 },
    ],
    Spine: [
      { t: 0, rx: -0.10, ry: -0.22 },
      { t: 0.95, rx: -0.13, ry: -0.24 },
      { t: 1.9, rx: -0.10, ry: -0.22 },
    ],
    LeftThigh: [{ t: 0, rx: 0.28, rz: 0.06 }, { t: 1.9, rx: 0.28, rz: 0.06 }],
    LeftShin: [{ t: 0, rx: -0.40 }, { t: 1.9, rx: -0.40 }],
    RightThigh: [{ t: 0, rx: -0.20, rz: -0.06 }, { t: 1.9, rx: -0.20, rz: -0.06 }],
    RightShin: [{ t: 0, rx: -0.24 }, { t: 1.9, rx: -0.24 }],
    RightUpperArm: [
      { t: 0, rx: 0.62, ry: -0.24, rz: -0.28 },
      { t: 0.95, rx: 0.68, ry: -0.22, rz: -0.26 },
      { t: 1.9, rx: 0.62, ry: -0.24, rz: -0.28 },
    ],
    RightForearm: [{ t: 0, rx: 0.86 }, { t: 1.9, rx: 0.86 }],
    LeftUpperArm: [
      { t: 0, rx: 0.74, ry: -0.36, rz: 0.26 },
      { t: 0.95, rx: 0.78, ry: -0.34, rz: 0.28 },
      { t: 1.9, rx: 0.74, ry: -0.36, rz: 0.26 },
    ],
    LeftForearm: [{ t: 0, rx: 0.72 }, { t: 1.9, rx: 0.72 }],
  });

  clips.AXE_LIGHT_1 = makeClip('AXE_LIGHT_1', 0.56, {
    Hips: [
      { t: 0, dy: -0.04, ry: -0.26 },
      { t: 0.24, dy: -0.09, ry: 0.34 },
      { t: 0.40, dy: -0.05, ry: 0.42 },
      { t: 0.56, dy: 0, ry: 0.08 },
    ],
    Spine: [
      { t: 0, rx: 0.14, ry: -0.58 },
      { t: 0.24, rx: -0.26, ry: 0.62 },
      { t: 0.40, rx: -0.18, ry: 0.70 },
      { t: 0.56, rx: -0.04, ry: 0.10 },
    ],
    Chest: [
      { t: 0, ry: -0.34 },
      { t: 0.24, ry: 0.48 },
      { t: 0.56, ry: 0.08 },
    ],
    LeftThigh: [
      { t: 0, rx: 0.20 },
      { t: 0.24, rx: 0.56 },
      { t: 0.56, rx: 0.08 },
    ],
    LeftShin: [
      { t: 0, rx: -0.28 },
      { t: 0.24, rx: -0.74 },
      { t: 0.56, rx: -0.12 },
    ],
    RightUpperArm: [
      { t: 0, rx: 1.72, ry: -0.95, rz: -0.62 },
      { t: 0.24, rx: 0.86, ry: 1.05, rz: 0.45 },
      { t: 0.40, rx: 0.64, ry: 1.24, rz: 0.52 },
      { t: 0.56, rx: 0.34, ry: 0.16, rz: -0.16 },
    ],
    RightForearm: [
      { t: 0, rx: 0.82 },
      { t: 0.24, rx: 0.18 },
      { t: 0.56, rx: 0.42 },
    ],
    RightHand: [
      { t: 0, ry: -0.28, rz: 0.32 },
      { t: 0.24, ry: 0.36, rz: -0.34 },
      { t: 0.56, ry: 0, rz: 0 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 1.32, ry: 0.2, rz: 0.28 },
      { t: 0.24, rx: 0.42, ry: -0.2, rz: 0.38 },
      { t: 0.56, rx: 0.18, rz: 0.16 },
    ],
  });

  clips.AXE_LIGHT_2 = makeClip('AXE_LIGHT_2', 0.56, {
    Hips: [
      { t: 0, dy: -0.06, ry: 0.38 },
      { t: 0.24, dy: -0.09, ry: -0.32 },
      { t: 0.42, dy: -0.04, ry: -0.40 },
      { t: 0.56, dy: 0, ry: -0.04 },
    ],
    Spine: [
      { t: 0, rx: -0.12, ry: 0.62 },
      { t: 0.24, rx: -0.26, ry: -0.58 },
      { t: 0.42, rx: -0.16, ry: -0.66 },
      { t: 0.56, rx: -0.04, ry: -0.08 },
    ],
    RightThigh: [
      { t: 0, rx: 0.18 },
      { t: 0.24, rx: 0.56 },
      { t: 0.56, rx: 0.06 },
    ],
    RightShin: [
      { t: 0, rx: -0.26 },
      { t: 0.24, rx: -0.72 },
      { t: 0.56, rx: -0.10 },
    ],
    RightUpperArm: [
      { t: 0, rx: 0.78, ry: 1.15, rz: 0.48 },
      { t: 0.24, rx: 1.02, ry: -0.98, rz: -0.68 },
      { t: 0.42, rx: 0.92, ry: -1.16, rz: -0.74 },
      { t: 0.56, rx: 0.36, ry: -0.1, rz: -0.16 },
    ],
    RightHand: [
      { t: 0, ry: 0.32, rz: -0.30 },
      { t: 0.24, ry: -0.38, rz: 0.36 },
      { t: 0.56, ry: 0, rz: 0 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 0.52, rz: 0.38 },
      { t: 0.24, rx: 1.18, rz: 0.55 },
      { t: 0.56, rx: 0.18, rz: 0.16 },
    ],
  });

  clips.AXE_OVERHEAD = makeClip('AXE_OVERHEAD', 0.68, {
    Hips: [
      { t: 0, dy: -0.04, ry: -0.12 },
      { t: 0.22, dy: 0.12, ry: 0 },
      { t: 0.38, dy: -0.16, ry: 0.18 },
      { t: 0.68, dy: 0, ry: 0 },
    ],
    Spine: [
      { t: 0, rx: 0.22 },
      { t: 0.22, rx: 0.36 },
      { t: 0.38, rx: -0.52 },
      { t: 0.68, rx: -0.04 },
    ],
    LeftThigh: [
      { t: 0, rx: 0.22 },
      { t: 0.38, rx: 0.72 },
      { t: 0.68, rx: 0.06 },
    ],
    LeftShin: [
      { t: 0, rx: -0.3 },
      { t: 0.38, rx: -1.06 },
      { t: 0.68, rx: -0.1 },
    ],
    RightUpperArm: [
      { t: 0, rx: 1.95, rz: -0.22 },
      { t: 0.22, rx: 2.75, rz: -0.12 },
      { t: 0.38, rx: 0.42, rz: 0.08 },
      { t: 0.68, rx: 0.30, rz: -0.15 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 1.85, rz: 0.22 },
      { t: 0.22, rx: 2.65, rz: 0.12 },
      { t: 0.38, rx: 0.48, rz: -0.06 },
      { t: 0.68, rx: 0.20, rz: 0.15 },
    ],
  });

  clips.AXE_HEAVY_SLAM = makeClip('AXE_HEAVY_SLAM', 0.82, {
    Hips: [
      { t: 0, dy: -0.08 },
      { t: 0.26, dy: 0.44 },
      { t: 0.44, dy: -0.24 },
      { t: 0.62, dy: -0.22 },
      { t: 0.82, dy: 0 },
    ],
    Spine: [
      { t: 0, rx: 0.28 },
      { t: 0.26, rx: 0.42 },
      { t: 0.44, rx: -0.62 },
      { t: 0.62, rx: -0.45 },
      { t: 0.82, rx: -0.04 },
    ],
    LeftThigh: [
      { t: 0, rx: 0.45 },
      { t: 0.26, rx: 0.88 },
      { t: 0.44, rx: 0.82 },
      { t: 0.82, rx: 0.06 },
    ],
    LeftShin: [
      { t: 0, rx: -0.75 },
      { t: 0.26, rx: -1.32 },
      { t: 0.44, rx: -1.24 },
      { t: 0.82, rx: -0.10 },
    ],
    RightThigh: [
      { t: 0, rx: 0.32 },
      { t: 0.26, rx: 0.72 },
      { t: 0.44, rx: 0.68 },
      { t: 0.82, rx: -0.06 },
    ],
    RightShin: [
      { t: 0, rx: -0.52 },
      { t: 0.26, rx: -1.1 },
      { t: 0.44, rx: -1.04 },
      { t: 0.82, rx: -0.10 },
    ],
    RightUpperArm: [
      { t: 0, rx: 2.1, rz: -0.18 },
      { t: 0.26, rx: 2.86, rz: -0.06 },
      { t: 0.44, rx: 0.38, rz: 0.1 },
      { t: 0.82, rx: 0.28, rz: -0.15 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 2.0, rz: 0.18 },
      { t: 0.26, rx: 2.78, rz: 0.06 },
      { t: 0.44, rx: 0.42, rz: -0.1 },
      { t: 0.82, rx: 0.20, rz: 0.15 },
    ],
  });

  // Charged Quantum Axe Heavy Cleave (deep coiled pull-back + wide explosive spin slam)
  clips.AXE_CHARGED_ATTACK = makeClip('AXE_CHARGED_ATTACK', 0.94, {
    Hips: [
      { t: 0, dy: -0.06, ry: -0.45 },
      { t: 0.30, dy: -0.14, ry: -0.85 },
      { t: 0.48, dy: 0.14, ry: 2.8 },
      { t: 0.64, dy: -0.22, ry: Math.PI * 2 + 0.25 },
      { t: 0.94, dy: 0, ry: Math.PI * 2 },
    ],
    Spine: [
      { t: 0, rx: 0.16, ry: -0.62 },
      { t: 0.30, rx: 0.28, ry: -0.82 },
      { t: 0.48, rx: -0.32, ry: 0.48 },
      { t: 0.64, rx: -0.52, ry: 0.64 },
      { t: 0.94, rx: -0.06, ry: 0 },
    ],
    LeftThigh: [
      { t: 0, rx: 0.34 },
      { t: 0.30, rx: 0.56 },
      { t: 0.64, rx: 0.78 },
      { t: 0.94, rx: 0.08 },
    ],
    LeftShin: [
      { t: 0, rx: -0.52 },
      { t: 0.30, rx: -0.88 },
      { t: 0.64, rx: -1.16 },
      { t: 0.94, rx: -0.12 },
    ],
    RightUpperArm: [
      { t: 0, rx: 1.45, ry: -0.85, rz: -0.72 },
      { t: 0.30, rx: 2.38, ry: -1.05, rz: -0.85 },
      { t: 0.48, rx: 1.62, ry: 0.42, rz: 0.18 },
      { t: 0.64, rx: 0.46, ry: 1.18, rz: 0.52 },
      { t: 0.94, rx: 0.34, ry: 0, rz: -0.16 },
    ],
    RightForearm: [
      { t: 0, rx: 0.62 },
      { t: 0.30, rx: 0.34 },
      { t: 0.64, rx: 0.14 },
      { t: 0.94, rx: 0.44 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 1.25, ry: 0.16, rz: 0.35 },
      { t: 0.30, rx: 2.15, ry: 0.24, rz: 0.22 },
      { t: 0.64, rx: 0.48, ry: -0.18, rz: -0.08 },
      { t: 0.94, rx: 0.22, ry: 0, rz: 0.16 },
    ],
  });

  clips.AXE_RUNNING_ATTACK = makeClip('AXE_RUNNING_ATTACK', 0.52, {
    Spine: [
      { t: 0, rx: -0.22, ry: -0.45 },
      { t: 0.22, rx: -0.34, ry: 0.64 },
      { t: 0.52, rx: -0.16, ry: 0 },
    ],
    Chest: [
      { t: 0, ry: -0.26 },
      { t: 0.22, ry: 0.46 },
      { t: 0.52, ry: 0 },
    ],
    RightUpperArm: [
      { t: 0, rx: 1.55, ry: -0.82, rz: -0.65 },
      { t: 0.22, rx: 0.96, ry: 1.12, rz: 0.48 },
      { t: 0.52, rx: 0.45, ry: 0.1, rz: -0.16 },
    ],
    LeftUpperArm: [
      { t: 0, rx: -0.28, rz: 0.32 },
      { t: 0.22, rx: 0.48, rz: 0.46 },
      { t: 0.52, rx: 0.18, rz: 0.16 },
    ],
  });

  clips.AXE_RECOVERY = makeClip('AXE_RECOVERY', 0.36, {
    Hips: [{ t: 0, dy: -0.14 }, { t: 0.36, dy: 0 }],
    Spine: [{ t: 0, rx: -0.34, ry: 0.22 }, { t: 0.36, rx: -0.04, ry: 0 }],
    RightUpperArm: [{ t: 0, rx: 0.48, rz: -0.24 }, { t: 0.36, rx: 0.26, rz: -0.15 }],
    LeftUpperArm: [{ t: 0, rx: 0.42, rz: 0.24 }, { t: 0.36, rx: 0.18, rz: 0.15 }],
  });

  clips.AXE_ATTACK = makeClip('AXE_ATTACK', 0.48, {
    Spine: [{ t: 0, rx: 0.2, ry: -0.55 }, { t: 0.22, rx: -0.28, ry: 0.68 }, { t: 0.48, rx: -0.06, ry: 0 }],
    RightUpperArm: [{ t: 0, rx: 1.85, ry: -0.7, rz: -0.5 }, { t: 0.22, rx: 0.72, ry: 1.15, rz: 0.45 }, { t: 0.48, rx: 0.32, ry: 0, rz: -0.15 }],
    LeftUpperArm: [{ t: 0, rx: 1.4, rz: 0.2 }, { t: 0.22, rx: 0.55, rz: 0.15 }, { t: 0.48, rx: 0.18, rz: 0.16 }],
  });

  // ── 8C. HAND-TO-HAND / GAUNTLET COMBAT CLIPS ──────────────────────────────
  clips.PUNCH_LEFT = makeClip('PUNCH_LEFT', 0.32, {
    Spine: [
      { t: 0, ry: 0.34, rx: -0.08 },
      { t: 0.12, ry: -0.52, rx: -0.16 },
      { t: 0.32, ry: 0, rx: -0.04 },
    ],
    Chest: [
      { t: 0, ry: 0.22 },
      { t: 0.12, ry: -0.40 },
      { t: 0.32, ry: 0 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 0.55, rz: 0.18 },
      { t: 0.12, rx: 1.56, ry: -0.08, rz: 0.04 },
      { t: 0.32, rx: 0.62, rz: 0.16 },
    ],
    LeftForearm: [
      { t: 0, rx: 1.42 },
      { t: 0.12, rx: 0.06 },
      { t: 0.32, rx: 0.85 },
    ],
    RightUpperArm: [
      { t: 0, rx: 0.92, rz: -0.2 },
      { t: 0.12, rx: 0.44, rz: -0.26 },
      { t: 0.32, rx: 0.72, rz: -0.18 },
    ],
  });

  clips.PUNCH_RIGHT = makeClip('PUNCH_RIGHT', 0.34, {
    Hips: [
      { t: 0, ry: -0.18, dy: -0.03 },
      { t: 0.13, ry: 0.32, dy: -0.05 },
      { t: 0.34, ry: 0, dy: 0 },
    ],
    Spine: [
      { t: 0, ry: -0.40, rx: -0.10 },
      { t: 0.13, ry: 0.58, rx: -0.20 },
      { t: 0.34, ry: 0, rx: -0.04 },
    ],
    Chest: [
      { t: 0, ry: -0.26 },
      { t: 0.13, ry: 0.42 },
      { t: 0.34, ry: 0 },
    ],
    RightUpperArm: [
      { t: 0, rx: 0.52, rz: -0.18 },
      { t: 0.13, rx: 1.58, ry: 0.08, rz: -0.04 },
      { t: 0.34, rx: 0.60, rz: -0.16 },
    ],
    RightForearm: [
      { t: 0, rx: 1.45 },
      { t: 0.13, rx: 0.06 },
      { t: 0.34, rx: 0.85 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 1.05, rz: 0.18 },
      { t: 0.13, rx: 0.38, rz: 0.28 },
      { t: 0.34, rx: 0.68, rz: 0.18 },
    ],
  });

  clips.PUNCH_DOUBLE = makeClip('PUNCH_DOUBLE', 0.44, {
    Spine: [
      { t: 0, ry: 0.32 },
      { t: 0.12, ry: -0.45 },
      { t: 0.25, ry: 0.52, rx: -0.18 },
      { t: 0.44, ry: 0, rx: -0.04 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 0.55 },
      { t: 0.12, rx: 1.54 },
      { t: 0.25, rx: 0.65 },
      { t: 0.44, rx: 0.58 },
    ],
    LeftForearm: [{ t: 0, rx: 1.4 }, { t: 0.12, rx: 0.08 }, { t: 0.44, rx: 0.8 }],
    RightUpperArm: [
      { t: 0, rx: 0.72 },
      { t: 0.12, rx: 0.52 },
      { t: 0.25, rx: 1.58 },
      { t: 0.44, rx: 0.58 },
    ],
    RightForearm: [{ t: 0, rx: 1.35 }, { t: 0.25, rx: 0.06 }, { t: 0.44, rx: 0.8 }],
  });

  clips.PUNCH_UPPERCUT = makeClip('PUNCH_UPPERCUT', 0.48, {
    Hips: [
      { t: 0, dy: -0.16, ry: -0.28 },
      { t: 0.20, dy: 0.12, ry: 0.36 },
      { t: 0.48, dy: 0, ry: 0 },
    ],
    Spine: [
      { t: 0, rx: -0.30, ry: -0.44 },
      { t: 0.20, rx: 0.22, ry: 0.48 },
      { t: 0.48, rx: -0.04, ry: 0 },
    ],
    RightUpperArm: [
      { t: 0, rx: -0.22, rz: -0.24 },
      { t: 0.20, rx: 2.24, ry: 0.22, rz: -0.08 },
      { t: 0.48, rx: 0.48, ry: 0, rz: -0.16 },
    ],
    RightForearm: [
      { t: 0, rx: 1.52 },
      { t: 0.20, rx: 0.96 },
      { t: 0.48, rx: 0.72 },
    ],
    LeftUpperArm: [
      { t: 0, rx: 0.85, rz: 0.26 },
      { t: 0.20, rx: 0.32, rz: 0.42 },
      { t: 0.48, rx: 0.52, rz: 0.18 },
    ],
  });

  clips.KICK = makeClip('KICK', 0.46, {
    Hips: [
      { t: 0, dy: -0.03, ry: -0.18 },
      { t: 0.18, dy: 0.04, ry: -0.62, rz: 0.16 },
      { t: 0.46, dy: 0, ry: 0, rz: 0 },
    ],
    Spine: [
      { t: 0, rx: 0.06, rz: -0.08 },
      { t: 0.18, rx: 0.28, rz: -0.26 },
      { t: 0.46, rx: -0.04, rz: 0 },
    ],
    RightThigh: [
      { t: 0, rx: 0.25 },
      { t: 0.18, rx: 1.58, rz: -0.35 },
      { t: 0.46, rx: -0.04 },
    ],
    RightShin: [
      { t: 0, rx: -1.15 },
      { t: 0.18, rx: -0.08 },
      { t: 0.46, rx: -0.1 },
    ],
    LeftThigh: [
      { t: 0, rx: -0.08 },
      { t: 0.18, rx: 0.12 },
      { t: 0.46, rx: 0.04 },
    ],
    LeftUpperArm: [{ t: 0, rx: 0.9, rz: 0.24 }, { t: 0.18, rx: 0.65, rz: 0.65 }, { t: 0.46, rx: 0.4, rz: 0.18 }],
    RightUpperArm: [{ t: 0, rx: 0.9, rz: -0.24 }, { t: 0.18, rx: -0.35, rz: -0.45 }, { t: 0.46, rx: 0.4, rz: -0.18 }],
  });

  clips.SPINNING_KICK = makeClip('SPINNING_KICK', 0.58, {
    Hips: [
      { t: 0, dy: -0.04, ry: 0 },
      { t: 0.26, dy: 0.09, ry: Math.PI * 1.15, rz: -0.18 },
      { t: 0.44, dy: 0.04, ry: Math.PI * 1.85, rz: -0.08 },
      { t: 0.58, dy: 0, ry: Math.PI * 2, rz: 0 },
    ],
    Spine: [
      { t: 0, rx: 0.1 },
      { t: 0.28, rx: 0.32, rz: 0.22 },
      { t: 0.58, rx: -0.04, rz: 0 },
    ],
    RightThigh: [
      { t: 0, rx: 0.35 },
      { t: 0.28, rx: 1.48, rz: -0.85 },
      { t: 0.58, rx: -0.04, rz: 0 },
    ],
    RightShin: [
      { t: 0, rx: -0.95 },
      { t: 0.28, rx: -0.06 },
      { t: 0.58, rx: -0.1 },
    ],
    LeftUpperArm: [{ t: 0, rx: 0.6, rz: 0.45 }, { t: 0.28, rx: 0.9, rz: 0.95 }, { t: 0.58, rx: 0.35, rz: 0.18 }],
    RightUpperArm: [{ t: 0, rx: 0.6, rz: -0.45 }, { t: 0.28, rx: 0.9, rz: -0.95 }, { t: 0.58, rx: 0.35, rz: -0.18 }],
  });

  clips.ENERGY_PUNCH = makeClip('ENERGY_PUNCH', 0.32, {
    Spine: [{ t: 0, ry: -0.45, rx: -0.14 }, { t: 0.14, ry: 0.52, rx: -0.2 }, { t: 0.32, ry: 0, rx: -0.05 }],
    RightUpperArm: [{ t: 0, rx: 0.35, rz: -0.2 }, { t: 0.14, rx: 1.52, rz: -0.05 }, { t: 0.32, rx: 0.45, rz: -0.15 }],
    RightForearm: [{ t: 0, rx: 1.35 }, { t: 0.14, rx: 0.08 }, { t: 0.32, rx: 0.75 }],
    LeftUpperArm: [{ t: 0, rx: 1.15, rz: 0.15 }, { t: 0.14, rx: 0.25, rz: 0.25 }, { t: 0.32, rx: 0.6, rz: 0.18 }],
  });

  clips.HEAVY_ATTACK = makeClip('HEAVY_ATTACK', 0.56, {
    Hips: [{ t: 0, dy: 0 }, { t: 0.2, dy: 0.18 }, { t: 0.38, dy: -0.16 }, { t: 0.56, dy: 0 }],
    Spine: [{ t: 0, rx: 0.32 }, { t: 0.38, rx: -0.46 }, { t: 0.56, rx: -0.05 }],
    LeftThigh: [{ t: 0, rx: 0.2 }, { t: 0.38, rx: 0.62 }, { t: 0.56, rx: 0.05 }],
    LeftShin: [{ t: 0, rx: -0.3 }, { t: 0.38, rx: -0.95 }, { t: 0.56, rx: -0.1 }],
    RightUpperArm: [{ t: 0, rx: 2.55, rz: -0.2 }, { t: 0.38, rx: 0.48, rz: -0.1 }, { t: 0.56, rx: 0.25, rz: -0.15 }],
    LeftUpperArm: [{ t: 0, rx: 2.45, rz: 0.2 }, { t: 0.38, rx: 0.48, rz: 0.1 }, { t: 0.56, rx: 0.2, rz: 0.15 }],
  });

  // ── 9. RANGED, BLOCK, DIRECTIONAL DODGE, KNOCKBACK, RECOVERY & DEATH ──────
  clips.AIM_RIFLE = makeClip('AIM_RIFLE', 0.80, {
    Chest: [{ t: 0, ry: -0.22, rx: -0.04 }, { t: 0.4, ry: -0.24, rx: -0.05 }, { t: 0.80, ry: -0.22, rx: -0.04 }],
    Head: [{ t: 0, ry: 0.18 }, { t: 0.80, ry: 0.18 }],
    RightUpperArm: [{ t: 0, rx: 1.46, rz: -0.08 }, { t: 0.80, rx: 1.46, rz: -0.08 }],
    RightForearm: [{ t: 0, rx: 0.16 }, { t: 0.80, rx: 0.16 }],
    LeftUpperArm: [{ t: 0, rx: 1.38, ry: -0.42, rz: 0.12 }, { t: 0.80, rx: 1.38, ry: -0.42, rz: 0.12 }],
    LeftForearm: [{ t: 0, rx: 0.38 }, { t: 0.80, rx: 0.38 }],
  });

  clips.SHOOT = makeClip('SHOOT', 0.26, {
    Chest: [{ t: 0, ry: -0.18 }, { t: 0.08, ry: -0.22, rx: 0.08 }, { t: 0.26, ry: -0.18, rx: 0 }],
    RightUpperArm: [{ t: 0, rx: 1.48, rz: -0.06 }, { t: 0.08, rx: 1.66, rz: -0.06 }, { t: 0.26, rx: 1.48, rz: -0.06 }],
    RightForearm: [{ t: 0, rx: 0.15 }, { t: 0.26, rx: 0.15 }],
    LeftUpperArm: [{ t: 0, rx: 1.38, ry: -0.38, rz: 0.1 }, { t: 0.08, rx: 1.52, ry: -0.38 }, { t: 0.26, rx: 1.38, ry: -0.38 }],
    LeftForearm: [{ t: 0, rx: 0.35 }, { t: 0.26, rx: 0.35 }],
  });

  clips.DUAL_BLASTER_SHOOT = makeClip('DUAL_BLASTER_SHOOT', 0.28, {
    Chest: [{ t: 0, ry: -0.12 }, { t: 0.08, ry: 0.12, rx: 0.06 }, { t: 0.18, ry: -0.12, rx: 0.06 }, { t: 0.28, ry: 0, rx: 0 }],
    RightUpperArm: [{ t: 0, rx: 1.42, rz: -0.1 }, { t: 0.08, rx: 1.68, rz: -0.08 }, { t: 0.28, rx: 1.42, rz: -0.1 }],
    RightForearm: [{ t: 0, rx: 0.16 }, { t: 0.28, rx: 0.16 }],
    LeftUpperArm: [{ t: 0, rx: 1.42, rz: 0.1 }, { t: 0.18, rx: 1.68, rz: 0.08 }, { t: 0.28, rx: 1.42, rz: 0.1 }],
    LeftForearm: [{ t: 0, rx: 0.16 }, { t: 0.28, rx: 0.16 }],
  });

  clips.RELOAD = makeClip('RELOAD', 1.25, {
    Chest: [{ t: 0, rx: -0.08, ry: -0.15 }, { t: 0.6, rx: -0.14, ry: -0.22 }, { t: 1.25, rx: -0.04, ry: 0 }],
    Head: [{ t: 0, rx: -0.22 }, { t: 0.6, rx: -0.3 }, { t: 1.25, rx: 0 }],
    RightUpperArm: [{ t: 0, rx: 0.92, rz: -0.18 }, { t: 0.6, rx: 0.85, rz: -0.18 }, { t: 1.25, rx: 0.92, rz: -0.18 }],
    RightForearm: [{ t: 0, rx: 0.72 }, { t: 0.6, rx: 0.85 }, { t: 1.25, rx: 0.72 }],
    LeftUpperArm: [{ t: 0, rx: 0.35, rz: 0.2 }, { t: 0.45, rx: 0.88, ry: -0.45 }, { t: 0.95, rx: 1.05, ry: -0.4 }, { t: 1.25, rx: 0.55, ry: -0.2 }],
    LeftForearm: [{ t: 0, rx: 0.9 }, { t: 0.55, rx: 1.15 }, { t: 1.25, rx: 0.65 }],
  });

  clips.WEAPON_SWITCH = makeClip('WEAPON_SWITCH', 0.28, {
    Chest: [{ t: 0, ry: 0.16 }, { t: 0.14, ry: -0.24 }, { t: 0.28, ry: 0 }],
    RightUpperArm: [{ t: 0, rx: 0.2, rz: -0.2 }, { t: 0.12, rx: 2.1, rz: -0.35 }, { t: 0.28, rx: 0.35, rz: -0.15 }],
    RightForearm: [{ t: 0, rx: 0.5 }, { t: 0.12, rx: 1.25 }, { t: 0.28, rx: 0.42 }],
    LeftUpperArm: [{ t: 0, rx: 0.2, rz: 0.2 }, { t: 0.12, rx: 0.95, rz: 0.35 }, { t: 0.28, rx: 0.25, rz: 0.16 }],
  });

  clips.BLOCK = makeClip('BLOCK', 0.8, {
    Hips: [{ t: 0, dy: -0.04, ry: 0.22 }, { t: 0.8, dy: -0.04, ry: 0.22 }],
    LeftThigh: [{ t: 0, rx: 0.25 }, { t: 0.8, rx: 0.25 }],
    LeftShin: [{ t: 0, rx: -0.35 }, { t: 0.8, rx: -0.35 }],
    LeftUpperArm: [{ t: 0, rx: 1.22, ry: -0.58, rz: 0.22 }, { t: 0.8, rx: 1.22, ry: -0.58, rz: 0.22 }],
    LeftForearm: [{ t: 0, rx: 0.75 }, { t: 0.8, rx: 0.75 }],
    RightUpperArm: [{ t: 0, rx: 0.35, rz: -0.25 }, { t: 0.8, rx: 0.35, rz: -0.25 }],
  });

  clips.BLOCK_SIDE = makeClip('BLOCK_SIDE', 0.8, {
    Spine: [{ t: 0, ry: 0.32, rx: -0.08 }, { t: 0.8, ry: 0.32, rx: -0.08 }],
    LeftUpperArm: [{ t: 0, rx: 1.28, ry: -0.22, rz: 0.38 }, { t: 0.8, rx: 1.28, ry: -0.22, rz: 0.38 }],
    LeftForearm: [{ t: 0, rx: 0.82 }, { t: 0.8, rx: 0.82 }],
    RightUpperArm: [{ t: 0, rx: 0.42, rz: -0.22 }, { t: 0.8, rx: 0.42, rz: -0.22 }],
  });

  clips.PERFECT_BLOCK = makeClip('PERFECT_BLOCK', 0.36, {
    Spine: [{ t: 0, ry: -0.2 }, { t: 0.14, ry: 0.42, rx: 0.08 }, { t: 0.36, ry: 0, rx: 0 }],
    LeftUpperArm: [{ t: 0, rx: 1.22, ry: -0.58 }, { t: 0.14, rx: 1.38, ry: 0.45, rz: 0.75 }, { t: 0.36, rx: 0.8, ry: -0.2, rz: 0.2 }],
    RightUpperArm: [{ t: 0, rx: 0.4 }, { t: 0.14, rx: 1.0, rz: -0.45 }, { t: 0.36, rx: 0.25, rz: -0.15 }],
  });

  clips.DODGE = makeClip('DODGE', 0.36, {
    Hips: [
      { t: 0, dy: -0.1, rx: -0.4 },
      { t: 0.12, dy: -0.26, rx: -2.2 },
      { t: 0.24, dy: -0.22, rx: -4.2 },
      { t: 0.36, dy: 0, rx: -Math.PI * 2 },
    ],
    Spine: [{ t: 0, rx: -0.45 }, { t: 0.18, rx: -0.65 }, { t: 0.36, rx: 0 }],
    LeftThigh: [{ t: 0, rx: 0.9 }, { t: 0.18, rx: 1.2 }, { t: 0.36, rx: 0.05 }],
    LeftShin: [{ t: 0, rx: -1.4 }, { t: 0.18, rx: -1.6 }, { t: 0.36, rx: -0.1 }],
    RightThigh: [{ t: 0, rx: 0.9 }, { t: 0.18, rx: 1.2 }, { t: 0.36, rx: -0.05 }],
    RightShin: [{ t: 0, rx: -1.4 }, { t: 0.18, rx: -1.6 }, { t: 0.36, rx: -0.1 }],
  });

  clips.DODGE_FORWARD = clips.DODGE;

  clips.DODGE_BACKWARD = makeClip('DODGE_BACKWARD', 0.36, {
    Hips: [{ t: 0, dy: -0.06, rx: 0.15 }, { t: 0.18, dy: 0.16, rx: 0.38 }, { t: 0.36, dy: 0, rx: 0 }],
    Spine: [{ t: 0, rx: 0.22 }, { t: 0.18, rx: 0.36 }, { t: 0.36, rx: 0 }],
    LeftThigh: [{ t: 0, rx: 0.55 }, { t: 0.18, rx: 0.92 }, { t: 0.36, rx: 0.05 }],
    LeftShin: [{ t: 0, rx: -0.95 }, { t: 0.18, rx: -1.35 }, { t: 0.36, rx: -0.1 }],
    RightThigh: [{ t: 0, rx: 0.45 }, { t: 0.18, rx: 0.78 }, { t: 0.36, rx: -0.05 }],
    RightShin: [{ t: 0, rx: -0.85 }, { t: 0.18, rx: -1.2 }, { t: 0.36, rx: -0.1 }],
    LeftUpperArm: [{ t: 0, rx: 0.65, rz: 0.45 }, { t: 0.18, rx: 1.1, rz: 0.55 }, { t: 0.36, rx: 0.2, rz: 0.16 }],
    RightUpperArm: [{ t: 0, rx: 0.65, rz: -0.45 }, { t: 0.18, rx: 1.1, rz: -0.55 }, { t: 0.36, rx: 0.2, rz: -0.16 }],
  });

  clips.DODGE_LEFT = makeClip('DODGE_LEFT', 0.34, {
    Hips: [{ t: 0, dy: -0.08, rz: -0.18 }, { t: 0.16, dy: 0.08, rz: -0.34 }, { t: 0.34, dy: 0, rz: 0 }],
    Spine: [{ t: 0, rz: 0.22, rx: -0.16 }, { t: 0.16, rz: 0.34, rx: -0.24 }, { t: 0.34, rz: 0, rx: 0 }],
    LeftThigh: [{ t: 0, rx: 0.38, rz: -0.32 }, { t: 0.34, rx: 0.04, rz: 0 }],
    RightThigh: [{ t: 0, rx: 0.46, rz: -0.24 }, { t: 0.34, rx: -0.04, rz: 0 }],
    LeftUpperArm: [{ t: 0, rx: 0.55, rz: 0.48 }, { t: 0.34, rx: 0.18, rz: 0.16 }],
    RightUpperArm: [{ t: 0, rx: 0.72, rz: -0.32 }, { t: 0.34, rx: 0.22, rz: -0.16 }],
  });

  clips.DODGE_RIGHT = makeClip('DODGE_RIGHT', 0.34, {
    Hips: [{ t: 0, dy: -0.08, rz: 0.18 }, { t: 0.16, dy: 0.08, rz: 0.34 }, { t: 0.34, dy: 0, rz: 0 }],
    Spine: [{ t: 0, rz: -0.22, rx: -0.16 }, { t: 0.16, rz: -0.34, rx: -0.24 }, { t: 0.34, rz: 0, rx: 0 }],
    RightThigh: [{ t: 0, rx: 0.38, rz: 0.32 }, { t: 0.34, rx: -0.04, rz: 0 }],
    LeftThigh: [{ t: 0, rx: 0.46, rz: 0.24 }, { t: 0.34, rx: 0.04, rz: 0 }],
    LeftUpperArm: [{ t: 0, rx: 0.72, rz: 0.32 }, { t: 0.34, rx: 0.18, rz: 0.16 }],
    RightUpperArm: [{ t: 0, rx: 0.55, rz: -0.48 }, { t: 0.34, rx: 0.22, rz: -0.16 }],
  });

  clips.HIT = makeClip('HIT', 0.30, {
    Spine: [{ t: 0, rx: 0.36, rz: -0.15 }, { t: 0.14, rx: 0.42, rz: 0.15 }, { t: 0.30, rx: 0, rz: 0 }],
    Head: [{ t: 0, rx: 0.32 }, { t: 0.30, rx: 0 }],
    LeftUpperArm: [{ t: 0, rx: 0.65, rz: 0.65 }, { t: 0.30, rx: 0.1, rz: 0.15 }],
    RightUpperArm: [{ t: 0, rx: 0.65, rz: -0.65 }, { t: 0.30, rx: 0.14, rz: -0.15 }],
  });

  clips.KNOCKBACK = makeClip('KNOCKBACK', 0.48, {
    Hips: [{ t: 0, dy: -0.06, rx: 0.22 }, { t: 0.22, dy: -0.34, rx: 0.72 }, { t: 0.48, dy: -0.44, rx: 0.54 }],
    Spine: [{ t: 0, rx: 0.45 }, { t: 0.24, rx: 0.65 }, { t: 0.48, rx: 0.22 }],
    Head: [{ t: 0, rx: 0.38 }, { t: 0.48, rx: 0.12 }],
    LeftThigh: [{ t: 0, rx: 0.45 }, { t: 0.48, rx: 0.75 }],
    LeftShin: [{ t: 0, rx: -0.75 }, { t: 0.48, rx: -1.15 }],
    LeftUpperArm: [{ t: 0, rx: 0.8, rz: 0.85 }, { t: 0.48, rx: 0.4, rz: 0.55 }],
    RightUpperArm: [{ t: 0, rx: 0.8, rz: -0.85 }, { t: 0.48, rx: 0.4, rz: -0.55 }],
  });

  clips.RECOVERY = makeClip('RECOVERY', 0.44, {
    Hips: [{ t: 0, dy: -0.42, rx: 0.45 }, { t: 0.22, dy: -0.16, rx: 0.12 }, { t: 0.44, dy: 0, rx: 0 }],
    Spine: [{ t: 0, rx: -0.38 }, { t: 0.22, rx: -0.22 }, { t: 0.44, rx: -0.04 }],
    LeftThigh: [{ t: 0, rx: 0.75 }, { t: 0.44, rx: 0.05 }],
    LeftShin: [{ t: 0, rx: -1.2 }, { t: 0.44, rx: -0.1 }],
    RightThigh: [{ t: 0, rx: 0.32 }, { t: 0.44, rx: -0.04 }],
    RightUpperArm: [{ t: 0, rx: 0.75, rz: -0.35 }, { t: 0.44, rx: 0.22, rz: -0.15 }],
    LeftUpperArm: [{ t: 0, rx: 0.75, rz: 0.35 }, { t: 0.44, rx: 0.18, rz: 0.15 }],
  });

  clips.DEATH = makeClip('DEATH', 1.15, {
    Hips: [{ t: 0, dy: 0, rx: 0 }, { t: 0.45, dy: -0.35, rx: 0.45 }, { t: 1.15, dy: -0.78, rx: 1.48 }],
    Spine: [{ t: 0, rx: 0.1 }, { t: 1.15, rx: 0.25 }],
    LeftThigh: [{ t: 0, rx: 0 }, { t: 0.45, rx: 0.65 }, { t: 1.15, rx: 0.18 }],
    LeftShin: [{ t: 0, rx: 0 }, { t: 0.45, rx: -1.1 }, { t: 1.15, rx: -0.3 }],
    RightUpperArm: [{ t: 0, rx: 0.2, rz: -0.2 }, { t: 1.15, rx: 0.4, rz: -0.95 }],
    LeftUpperArm: [{ t: 0, rx: 0.2, rz: 0.2 }, { t: 1.15, rx: 0.4, rz: 0.95 }],
  });

  // ── 10. SPECIAL POWERS & GUARDIAN MODE TRANSFORMATION ──────────────────────
  clips.SPECIAL_POWER = makeClip('SPECIAL_POWER', 0.56, {
    Hips: [{ t: 0, dy: -0.08 }, { t: 0.22, dy: 0.08 }, { t: 0.56, dy: 0 }],
    Chest: [{ t: 0, rx: 0.22 }, { t: 0.24, rx: -0.24 }, { t: 0.56, rx: 0 }],
    RightUpperArm: [{ t: 0, rx: 0.3, rz: -0.3 }, { t: 0.24, rx: 1.58, rz: -0.12 }, { t: 0.56, rx: 0.3, rz: -0.15 }],
    LeftUpperArm: [{ t: 0, rx: 0.3, rz: 0.3 }, { t: 0.24, rx: 1.48, rz: 0.35 }, { t: 0.56, rx: 0.2, rz: 0.15 }],
  });

  clips.GUARDIAN_MODE = makeClip('GUARDIAN_MODE', 0.85, {
    Hips: [{ t: 0, dy: -0.1 }, { t: 0.35, dy: 0.22 }, { t: 0.85, dy: 0.05 }],
    Spine: [{ t: 0, rx: -0.25 }, { t: 0.4, rx: 0.28 }, { t: 0.85, rx: -0.05 }],
    Head: [{ t: 0, rx: -0.2 }, { t: 0.4, rx: 0.35 }, { t: 0.85, rx: 0 }],
    LeftUpperArm: [{ t: 0, rx: 0.6, rz: 0.2 }, { t: 0.4, rx: 1.35, rz: 1.1 }, { t: 0.85, rx: 0.35, rz: 0.32 }],
    RightUpperArm: [{ t: 0, rx: 0.6, rz: -0.2 }, { t: 0.4, rx: 1.35, rz: -1.1 }, { t: 0.85, rx: 0.35, rz: -0.32 }],
  });

  return clips;
}
