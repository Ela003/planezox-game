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
class Milestone3CombatAnimationTest {

    @Test
    fun `kael animations define complete sword, axe, hand to hand, dodge, defense, and ranged clip library`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val clipsJs = context.assets.open("game/js/characters/kaelAnimations.js")
            .bufferedReader().use { it.readText() }

        val milestone3Clips = listOf(
            // Sword Combat
            "COMBO_1", "COMBO_2", "COMBO_3", "SWORD_HEAVY",
            // Axe Combat
            "AXE_LIGHT_1", "AXE_LIGHT_2", "AXE_OVERHEAD", "AXE_HEAVY_SLAM",
            "AXE_RUNNING_ATTACK", "AXE_RECOVERY", "AXE_ATTACK",
            // Hand-to-Hand / Gauntlet Combat
            "PUNCH_LEFT", "PUNCH_RIGHT", "PUNCH_DOUBLE", "PUNCH_UPPERCUT",
            "KICK", "SPINNING_KICK", "ENERGY_PUNCH",
            // Dodge, Defense & Reactions
            "DODGE", "DODGE_FORWARD", "DODGE_BACKWARD", "DODGE_LEFT", "DODGE_RIGHT",
            "BLOCK", "BLOCK_SIDE", "PERFECT_BLOCK", "HIT", "KNOCKBACK", "RECOVERY", "DEATH",
            // Ranged Combat & Weapon Switch
            "AIM_RIFLE", "SHOOT", "DUAL_BLASTER_SHOOT", "RELOAD", "WEAPON_SWITCH",
        )
        milestone3Clips.forEach { clipName ->
            assertTrue("Missing Milestone 3 AnimationClip $clipName", clipsJs.contains("clips.$clipName ="))
        }

        // Sword attacks animate wrist, shoulder, forearm, and torso rotation
        assertTrue(clipsJs.contains("RightHand:"))
        assertTrue(clipsJs.contains("RightForearm:"))
        assertTrue(clipsJs.contains("RightUpperArm:"))
    }

    @Test
    fun `animation controller supports dual layer upper body mixing, states, and combat cancellation`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val ctrlJs = context.assets.open("game/js/characters/animationController.js")
            .bufferedReader().use { it.readText() }

        val expandedStates = listOf(
            "AIM", "WEAPON_SWITCH", "KNOCKBACK", "RECOVERY",
            "LIGHT_ATTACK", "HEAVY_ATTACK", "COMBO", "BLOCK", "DODGE", "SHOOT", "RELOAD",
        )
        expandedStates.forEach { state ->
            assertTrue("Missing state $state in KAEL_ANIM_STATES", ctrlJs.contains("$state: '$state'"))
        }

        assertTrue(ctrlJs.contains("upperMixer"))
        assertTrue(ctrlJs.contains("filterUpperBodyClip"))
        assertTrue(ctrlJs.contains("triggerUpperOneShot"))
        assertTrue(ctrlJs.contains("cancelCombatActions"))
    }

    @Test
    fun `player and combat integrate synchronized hit windows, combo buffering, directional dodge, and vfx`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val playerJs = context.assets.open("game/js/player.js")
            .bufferedReader().use { it.readText() }
        val combatJs = context.assets.open("game/js/combat.js")
            .bufferedReader().use { it.readText() }
        val mainJs = context.assets.open("game/js/main.js")
            .bufferedReader().use { it.readText() }
        val modelJs = context.assets.open("game/js/characters/kaelModel.js")
            .bufferedReader().use { it.readText() }

        // Synchronized hit window & combo input buffering
        assertTrue(playerJs.contains("consumePendingMeleeHits"))
        assertTrue(playerJs.contains("queuedAttackRequest"))
        assertTrue(playerJs.contains("hitTime"))
        assertTrue(playerJs.contains("DODGE_BACKWARD"))
        assertTrue(playerJs.contains("DODGE_LEFT"))
        assertTrue(playerJs.contains("DODGE_RIGHT"))
        assertTrue(playerJs.contains("KNOCKBACK"))
        assertTrue(playerJs.contains("RECOVERY"))
        assertTrue(playerJs.contains("DUAL_BLASTER_SHOOT"))
        assertTrue(playerJs.contains("AXE_HEAVY_SLAM"))
        assertTrue(playerJs.contains("SPINNING_KICK"))

        // Combat VFX & deduplication
        assertTrue(combatJs.contains("spawnGroundDust"))
        assertTrue(combatJs.contains("resolveAttackHit"))
        assertTrue(combatJs.contains("isPerfectBlockWindow"))
        assertTrue(mainJs.contains("player.consumePendingMeleeHits()"))
        assertTrue(mainJs.contains("FINISHING STRIKE!"))

        // Missing external Milestone 3 GLB assets explicitly reported
        assertTrue(modelJs.contains("sword_combo.glb"))
        assertTrue(modelJs.contains("axe_combat.glb"))
        assertTrue(modelJs.contains("hand_to_hand.glb"))
        assertTrue(modelJs.contains("dodge_block.glb"))
        assertTrue(modelJs.contains("ranged_combat.glb"))
    }
}
