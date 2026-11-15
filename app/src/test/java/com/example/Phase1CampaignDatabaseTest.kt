package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.campaign.ChapterDatabase
import com.example.data.campaign.CinematicCameraShotType
import com.example.data.campaign.MissionType
import com.example.data.campaign.MissionsAndCinematicsDatabase
import com.example.data.campaign.RosterAndArsenalDatabase
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class Phase1CampaignDatabaseTest {

    @Test
    fun `chapter database defines all 10 sequential story chapters with expected bosses and powers`() {
        val chapters = ChapterDatabase.chapters
        assertEquals(10, chapters.size)
        assertEquals((1..10).toList(), chapters.map { it.chapterNumber })

        chapters.forEachIndexed { idx, ch ->
            assertTrue("Chapter ${ch.chapterNumber} must have zones", ch.zones.isNotEmpty())
            assertTrue("Chapter ${ch.chapterNumber} must have cutscenes", ch.cutsceneIds.isNotEmpty())
            assertTrue("Chapter ${ch.chapterNumber} must have missions", ch.missionIds.isNotEmpty())
            if (idx < 9) {
                assertEquals("CHAPTER_${(idx + 2).toString().padStart(2, '0')}", ch.nextChapterId)
            } else {
                assertNull(ch.nextChapterId)
            }
        }

        assertEquals("ravok", ChapterDatabase.getChapter(1)?.bossId)
        assertEquals("vexor", ChapterDatabase.getChapter(4)?.bossId)
        assertEquals("ice_guardian", ChapterDatabase.getChapter(5)?.bossId)
        assertEquals("brutax", ChapterDatabase.getChapter(6)?.bossId)
        assertEquals("nexar", ChapterDatabase.getChapter(7)?.bossId)
        assertEquals("lord_zyrox", ChapterDatabase.getChapter(10)?.bossId)
        assertTrue(ChapterDatabase.getChapter(10)?.unlockedPowerIds?.contains("eternal_nova") == true)
    }

    @Test
    fun `character roster includes hero, villains, AI, all 5 bosses, all 5 cyclops classes, guardians, and civilians`() {
        val requiredIds = listOf(
            "kael",
            "lord_zyrox",
            "aether",
            "ravok",
            "vexor",
            "ice_guardian",
            "brutax",
            "nexar",
            "cyclops_soldier",
            "cyclops_archer",
            "cyclops_heavy",
            "cyclops_drone",
            "cyclops_elite_guardian",
            "guardians_of_eternity",
            "warmier_civilians",
        )
        requiredIds.forEach { id ->
            val character = RosterAndArsenalDatabase.getCharacter(id)
            assertNotNull("Missing character $id", character)
            assertTrue("Missing asset glb path for $id", character!!.assetSpec.modelPath.endsWith(".glb"))
        }
    }

    @Test
    fun `weapons and powers database defines 5 weapons, 7 guardian powers, and Eternal Nova`() {
        assertEquals(5, RosterAndArsenalDatabase.weapons.size)
        assertEquals(
            listOf("guardian_sword", "quantum_axe", "plasma_rifle", "dual_blasters", "guardian_gauntlet"),
            RosterAndArsenalDatabase.weapons.map { it.id }
        )

        val guardianPowers = RosterAndArsenalDatabase.getGuardianPowers()
        assertEquals(7, guardianPowers.size)
        assertEquals(
            listOf(
                "energy_strike",
                "shadow_dash",
                "plasma_blast",
                "titan_shield",
                "gravity_control",
                "quantum_blast",
                "guardian_mode",
            ),
            guardianPowers.map { it.id }
        )

        val eternalNova = RosterAndArsenalDatabase.getFinalCombinedAbility()
        assertEquals("eternal_nova", eternalNova.id)
        assertEquals(10, eternalNova.unlockChapter)
        assertTrue(eternalNova.isUltimateCombinedAbility)
    }

    @Test
    fun `mission database covers all 6 mission types and enforces unique reward keys`() {
        val missions = MissionsAndCinematicsDatabase.missions
        val usedTypes = missions.map { it.type }.toSet()
        assertEquals(MissionType.entries.toSet(), usedTypes)

        val rewardKeys = missions.map { it.reward.rewardKey }
        assertEquals("Duplicate reward keys detected", rewardKeys.size, rewardKeys.toSet().size)

        val missionIds = missions.map { it.id }.toSet()
        missions.forEach { mission ->
            mission.nextMissionId?.let { nextId ->
                assertTrue("Broken mission link $nextId", missionIds.contains(nextId))
            }
        }
    }

    @Test
    fun `cinematic sequences cover all 7 camera shot types and post-credit multiverse scene`() {
        val cinematics = MissionsAndCinematicsDatabase.cinematics
        val usedShots = cinematics.flatMap { it.cameraBeats }.map { it.shotType }.toSet()
        assertEquals(CinematicCameraShotType.entries.toSet(), usedShots)

        val postCredit = cinematics.firstOrNull { it.id == "CS_10_POST_CREDIT_MULTIVERSE_PHASE_TWO" }
        assertNotNull(postCredit)
        assertTrue(
            postCredit!!.dialogueCues.any {
                it.subtitle.contains("CYCLOPS EMPIRE – MULTIVERSE INVASION: PHASE TWO ACTIVATED")
            }
        )
    }

    @Test
    fun `all phase 1 js data modules exist in apk assets`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val assetFiles = listOf(
            "game/js/data/chaptersDb.js",
            "game/js/data/charactersDb.js",
            "game/js/data/weaponsPowersDb.js",
            "game/js/data/missionsDb.js",
            "game/js/data/cinematicsDb.js",
        )
        assetFiles.forEach { path ->
            context.assets.open(path).use { stream ->
                assertTrue("Expected non-empty asset $path", stream.available() > 0)
            }
        }
    }
}
