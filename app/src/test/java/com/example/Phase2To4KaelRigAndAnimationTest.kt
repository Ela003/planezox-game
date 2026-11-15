package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class Phase2To4KaelRigAndAnimationTest {

    @Test
    fun `threejs webjar includes GLTFLoader and Skeleton modules for external GLB support`() {
        val classLoader = javaClass.classLoader!!
        val gltfStream = classLoader.getResourceAsStream(
            "META-INF/resources/webjars/three/0.167.1/examples/jsm/loaders/GLTFLoader.js"
        )
        assertNotNull("GLTFLoader.js must be bundled in Three.js WebJar", gltfStream)
        gltfStream!!.close()
    }

    @Test
    fun `index html defines three addons importmap and character modules exist in apk assets`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val indexHtml = context.assets.open("game/index.html").bufferedReader().use { it.readText() }
        assertTrue(indexHtml.contains("\"three/addons/\""))
        assertTrue(indexHtml.contains("webjars/three/examples/jsm/"))

        val charAssets = listOf(
            "game/js/characters/kaelModel.js",
            "game/js/characters/kaelAnimations.js",
            "game/js/characters/animationController.js",
        )
        charAssets.forEach { path ->
            context.assets.open(path).use { stream ->
                assertTrue("Expected non-empty asset $path", stream.available() > 0)
            }
        }
    }

    @Test
    fun `kael model defines humanoid bone hierarchy, PBR maps, and GLTFLoader fallback`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val modelJs = context.assets.open("game/js/characters/kaelModel.js")
            .bufferedReader().use { it.readText() }

        val requiredBones = listOf(
            "Hips", "Spine", "Chest", "Neck", "Head",
            "LeftShoulder", "LeftUpperArm", "LeftForearm", "LeftHand",
            "RightShoulder", "RightUpperArm", "RightForearm", "RightHand",
            "LeftThigh", "LeftShin", "LeftFoot", "LeftToe",
            "RightThigh", "RightShin", "RightFoot", "RightToe",
        )
        requiredBones.forEach { bone ->
            assertTrue("Missing humanoid bone $bone", modelJs.contains("makeBone('$bone'"))
        }

        assertTrue(modelJs.contains("GLTFLoader"))
        assertTrue(modelJs.contains("roughnessMap"))
        assertTrue(modelJs.contains("normalMap"))
        assertTrue(modelJs.contains("THREE.Skeleton"))
    }

    @Test
    fun `animation controller and clips define all 18 canonical states and directional movement clips`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val ctrlJs = context.assets.open("game/js/characters/animationController.js")
            .bufferedReader().use { it.readText() }
        val clipsJs = context.assets.open("game/js/characters/kaelAnimations.js")
            .bufferedReader().use { it.readText() }

        val canonicalStates = listOf(
            "IDLE", "WALK", "RUN", "SPRINT", "JUMP", "FALL", "LAND",
            "LIGHT_ATTACK", "HEAVY_ATTACK", "COMBO", "BLOCK", "DODGE",
            "SHOOT", "RELOAD", "HIT", "DEATH", "SPECIAL_POWER", "GUARDIAN_MODE",
        )
        canonicalStates.forEach { st ->
            assertTrue("Missing controller state $st", ctrlJs.contains("$st: '$st'"))
        }

        val requiredClips = listOf(
            "IDLE", "LOOK_AROUND", "WALK", "RUN", "SPRINT",
            "WALK_BACKWARD", "STRAFE_LEFT", "STRAFE_RIGHT",
            "JUMP", "FALL", "LAND",
            "COMBO_1", "COMBO_2", "COMBO_3", "AXE_ATTACK", "ENERGY_PUNCH",
            "HEAVY_ATTACK", "SHOOT", "RELOAD", "BLOCK", "PERFECT_BLOCK",
            "DODGE", "HIT", "DEATH", "SPECIAL_POWER", "GUARDIAN_MODE",
        )
        requiredClips.forEach { clip ->
            assertTrue("Missing AnimationClip $clip", clipsJs.contains("clips.$clip ="))
        }
        assertTrue(clipsJs.contains("QuaternionKeyframeTrack"))
        assertTrue(clipsJs.contains("AnimationClip"))
    }
}
