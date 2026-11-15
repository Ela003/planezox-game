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
class Stage2SwordCombatTest {

    @Test
    fun `kael animations and controller define complete sword combat clips and stance routing`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val clipsJs = context.assets.open("game/js/characters/kaelAnimations.js")
            .bufferedReader().use { it.readText() }
        val ctrlJs = context.assets.open("game/js/characters/animationController.js")
            .bufferedReader().use { it.readText() }

        listOf(
            "SWORD_READY",
            "SWORD_RUNNING_ATTACK",
            "SWORD_JUMP_ATTACK",
            "SWORD_DODGE_ATTACK",
            "COMBO_1",
            "COMBO_2",
            "COMBO_3",
            "SWORD_HEAVY",
        ).forEach { clipName ->
            assertTrue("Missing Stage 2 sword clip $clipName", clipsJs.contains("clips.$clipName ="))
        }

        assertTrue(ctrlJs.contains("combatStanceClip"))
        assertTrue(ctrlJs.contains("this.actions[combatStanceClip]"))
    }

    @Test
    fun `player triggers sword running jump dodge counter and ready stance transitions`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val playerJs = context.assets.open("game/js/player.js")
            .bufferedReader().use { it.readText() }

        assertTrue(playerJs.contains("SWORD_READY"))
        assertTrue(playerJs.contains("SWORD_RUNNING_ATTACK"))
        assertTrue(playerJs.contains("SWORD_JUMP_ATTACK"))
        assertTrue(playerJs.contains("SWORD_DODGE_ATTACK"))
        assertTrue(playerJs.contains("dodgeCounterWindowTimer"))
        assertTrue(playerJs.contains("combatStanceTimer"))
    }
}
