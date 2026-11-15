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
class Stage4RangedCombatTest {

    @Test
    fun `ranged combat supports muzzle flash projectile trails and hold-to-auto-fire`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val combatJs = context.assets.open("game/js/combat.js")
            .bufferedReader().use { it.readText() }
        val mainJs = context.assets.open("game/js/main.js")
            .bufferedReader().use { it.readText() }
        val clipsJs = context.assets.open("game/js/characters/kaelAnimations.js")
            .bufferedReader().use { it.readText() }

        assertTrue(combatJs.contains("spawnMuzzleFlash"))
        assertTrue(combatJs.contains("spawnProjectileTrail"))
        assertTrue(mainJs.contains("setAutoFire"))
        assertTrue(mainJs.contains("autoFireActive"))
        assertTrue(mainJs.contains("combatVfx.spawnMuzzleFlash"))
        assertTrue(mainJs.contains("combatVfx.spawnProjectileTrail"))
        assertTrue(clipsJs.contains("clips.AIM_RIFLE ="))
        assertTrue(clipsJs.contains("clips.SHOOT ="))
        assertTrue(clipsJs.contains("clips.DUAL_BLASTER_SHOOT ="))
        assertTrue(clipsJs.contains("clips.RELOAD ="))
    }
}
