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
class Stage3AxeCombatTest {

    @Test
    fun `kael animations and player define complete quantum axe combat and recovery chain`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val clipsJs = context.assets.open("game/js/characters/kaelAnimations.js")
            .bufferedReader().use { it.readText() }
        val playerJs = context.assets.open("game/js/player.js")
            .bufferedReader().use { it.readText() }
        val mainJs = context.assets.open("game/js/main.js")
            .bufferedReader().use { it.readText() }

        listOf(
            "AXE_READY",
            "AXE_LIGHT_1",
            "AXE_LIGHT_2",
            "AXE_OVERHEAD",
            "AXE_HEAVY_SLAM",
            "AXE_CHARGED_ATTACK",
            "AXE_RUNNING_ATTACK",
            "AXE_RECOVERY",
        ).forEach { clipName ->
            assertTrue("Missing Stage 3 axe clip $clipName", clipsJs.contains("clips.$clipName ="))
        }

        assertTrue(playerJs.contains("AXE_READY"))
        assertTrue(playerJs.contains("AXE_CHARGED_ATTACK"))
        assertTrue(playerJs.contains("chainRecoveryClip"))
        assertTrue(playerJs.contains("startHeavyCharge"))
        assertTrue(playerJs.contains("releaseHeavyCharge"))
        assertTrue(mainJs.contains("startHeavyCharge()"))
        assertTrue(mainJs.contains("releaseHeavyCharge()"))
    }
}
