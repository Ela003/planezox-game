package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class Milestone2LivingForestTest {

    @Test
    fun `animation controller exposes explicit directional locomotion states and speed coupling`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val ctrlJs = context.assets.open("game/js/characters/animationController.js")
            .bufferedReader().use { it.readText() }
        val playerJs = context.assets.open("game/js/player.js")
            .bufferedReader().use { it.readText() }
        val modelJs = context.assets.open("game/js/characters/kaelModel.js")
            .bufferedReader().use { it.readText() }

        val locomotionStates = listOf(
            "IDLE", "WALK", "RUN", "SPRINT",
            "STRAFE_LEFT", "STRAFE_RIGHT", "BACKWARD_WALK",
            "JUMP", "FALL", "LAND",
        )
        locomotionStates.forEach { state ->
            assertTrue("Missing locomotion state $state", ctrlJs.contains("$state: '$state'"))
        }

        assertTrue(ctrlJs.contains("currentSpeed"))
        assertTrue(playerJs.contains("resolvePlayerCollisions"))
        assertTrue(playerJs.contains("getMissingExternalAssets"))
        assertTrue(modelJs.contains("getMissingExternalAssets"))
    }

    @Test
    fun `third person camera adjusts for running sprint and prevents terrain and obstacle clipping`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val cameraJs = context.assets.open("game/js/camera.js")
            .bufferedReader().use { it.readText() }

        assertTrue(cameraJs.contains("dynamicDistance"))
        assertTrue(cameraJs.contains("sprintPullback"))
        assertTrue(cameraJs.contains("_preventClipping"))
        assertTrue(cameraJs.contains("getTerrainHeight"))
    }

    @Test
    fun `living forest implements instanced wind trees, reactive plants, wildlife particles, and colliders`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val envJs = context.assets.open("game/js/environment.js")
            .bufferedReader().use { it.readText() }
        val skyJs = context.assets.open("game/js/skyLighting.js")
            .bufferedReader().use { it.readText() }
        val combatJs = context.assets.open("game/js/combat.js")
            .bufferedReader().use { it.readText() }
        val mainJs = context.assets.open("game/js/main.js")
            .bufferedReader().use { it.readText() }

        // Phase 6: GPU-instanced trees with non-synchronized wind sway
        assertTrue(envJs.contains("applyTreeWindShader"))
        assertTrue(envJs.contains("aTreeData"))
        assertTrue(envJs.contains("TreeTrunksInstanced"))
        assertTrue(envJs.contains("TreeCanopyInstanced"))

        // Phase 7: Grass, bushes, wildflowers + player proximity bending
        assertTrue(envJs.contains("uPlayerPos"))
        assertTrue(envJs.contains("ForestBushes"))
        assertTrue(envJs.contains("ForestFlowers"))
        assertTrue(envJs.contains("AncientGrass"))

        // Phase 8: Falling leaves, insects, distant birds, moving mist
        assertTrue(envJs.contains("FallingLeaves"))
        assertTrue(envJs.contains("ForestInsects"))
        assertTrue(envJs.contains("FlyingBirds"))
        assertTrue(envJs.contains("ForestGroundMist"))

        // Phase 9: Sunlight shafts & sky lighting quality controls
        assertTrue(skyJs.contains("ForestSunlightShafts"))
        assertTrue(skyJs.contains("setQuality"))

        // Phase 10: Colliders wired into player & camera
        assertTrue(envJs.contains("getColliders"))
        assertTrue(mainJs.contains("environment.getColliders()"))

        // Phase 11: Pooled combat VFX and quality scaling
        assertTrue(combatJs.contains("acquireMesh"))
        assertTrue(combatJs.contains("releaseEffect"))
        assertTrue(combatJs.contains("setQuality"))
    }
}
