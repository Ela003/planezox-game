package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.ui.LiveGameState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class Stage5To6CombatPowersTest {

    @Test
    fun `stage 5 defensive clips and block stamina parry knockback logic are present`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val clipsJs = context.assets.open("game/js/characters/kaelAnimations.js")
            .bufferedReader().use { it.readText() }
        val playerJs = context.assets.open("game/js/player.js")
            .bufferedReader().use { it.readText() }

        listOf(
            "clips.DODGE_FORWARD",
            "clips.DODGE_BACKWARD",
            "clips.DODGE_LEFT",
            "clips.DODGE_RIGHT",
            "clips.BLOCK =",
            "clips.BLOCK_SIDE =",
            "clips.PERFECT_BLOCK =",
            "clips.HIT =",
            "clips.KNOCKBACK =",
            "clips.RECOVERY =",
        ).forEach { clipName ->
            assertTrue("Missing defensive clip $clipName", clipsJs.contains(clipName))
        }

        assertTrue(playerJs.contains("isPerfectBlockWindow"))
        assertTrue(playerJs.contains("state.stamina = Math.max(0, state.stamina - 6)"))
        assertTrue(playerJs.contains("KAEL_ANIM_STATES.KNOCKBACK"))
        assertTrue(playerJs.contains("KAEL_ANIM_STATES.HIT"))
    }

    @Test
    fun `stage 6 guardian powers vfx progression unlocks and boss reflection work end to end`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val combatJs = context.assets.open("game/js/combat.js")
            .bufferedReader().use { it.readText() }
        val playerJs = context.assets.open("game/js/player.js")
            .bufferedReader().use { it.readText() }
        val enemiesJs = context.assets.open("game/js/enemies.js")
            .bufferedReader().use { it.readText() }
        val bossJs = context.assets.open("game/js/boss.js")
            .bufferedReader().use { it.readText() }
        val mainJs = context.assets.open("game/js/main.js")
            .bufferedReader().use { it.readText() }

        listOf(
            "energy_strike",
            "shadow_dash",
            "plasma_blast",
            "titan_shield",
            "gravity_control",
            "quantum_blast",
            "guardian_mode",
        ).forEach { powerId ->
            assertTrue("Missing power $powerId in combat.js", combatJs.contains(powerId))
            assertTrue("Missing power handling $powerId in main.js", mainJs.contains(powerId))
        }

        assertTrue(combatJs.contains("export function unlockPower("))
        assertTrue(combatJs.contains("export function unlockPowersUpToChapter("))
        assertTrue(combatJs.contains("spawnPlasmaBeam("))
        assertTrue(combatJs.contains("spawnStasisSphere("))
        assertTrue(combatJs.contains("spawnQuantumSingularity("))

        assertTrue(playerJs.contains("titanShieldTimer"))
        assertTrue(playerJs.contains("guardianModeTimer"))
        assertTrue(playerJs.contains("getDamageMultiplier"))
        assertTrue(playerJs.contains("titanShieldReflect: true"))

        assertTrue(enemiesJs.contains("levitateSoldier("))
        assertTrue(bossJs.contains("hitResult === 'REFLECTED'"))

        assertTrue(mainJs.contains("unlockPower('shadow_dash')"))
        assertTrue(mainJs.contains("unlockPowersUpToChapter(1)"))
        assertTrue(mainJs.contains("titanShieldActive: player.state.titanShieldTimer > 0"))
        assertTrue(mainJs.contains("guardianModeActive: player.state.guardianModeTimer > 0"))
    }

    @Test
    fun `LiveGameState fromJson parses titanShieldActive and guardianModeActive flags`() {
        val json = """
            {
              "name": "Kael",
              "hp": 240,
              "maxHp": 240,
              "titanShieldActive": true,
              "guardianModeActive": true
            }
        """.trimIndent()

        val parsed = LiveGameState.fromJson(json)
        assertNotNull(parsed)
        val state = parsed!!.first
        assertTrue(state.titanShieldActive)
        assertTrue(state.guardianModeActive)

        val defaultParsed = LiveGameState.fromJson("""{"name": "Kael"}""")!!.first
        assertFalse(defaultParsed.titanShieldActive)
        assertFalse(defaultParsed.guardianModeActive)
        assertEquals("Kael", defaultParsed.playerName)
    }
}
