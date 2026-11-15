package com.example

import android.app.Application
import android.content.Context
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import kotlinx.coroutines.withTimeout
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
class ExampleRobolectricTest {

    @Test
    fun `app name matches Warmier Rise of Cyclops`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val appName = context.getString(R.string.app_name)
        assertEquals("Warmier: Rise of Cyclops", appName)
    }

    @Test
    fun `hero kael portrait drawable resource is bundled`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val drawable = context.getDrawable(R.drawable.kael_hero_portrait)
        assertNotNull("Expected Hero Kael portrait drawable resource", drawable)
    }

    @Test
    fun `threejs webjar module resource is bundled on classpath`() {
        val classLoader = javaClass.classLoader!!
        val moduleStream = classLoader.getResourceAsStream(
            "META-INF/resources/webjars/three/0.167.1/build/three.module.min.js"
        )
        assertNotNull("Expected three.module.min.js inside WebJar classpath", moduleStream)
        val content = moduleStream!!.bufferedReader().use { it.readText() }
        assertTrue("Expected non-empty Three.js module", content.isNotEmpty())

        if (content.contains("three.core.min.js")) {
            val coreStream = classLoader.getResourceAsStream(
                "META-INF/resources/webjars/three/0.167.1/build/three.core.min.js"
            )
            assertNotNull("Expected three.core.min.js inside WebJar classpath", coreStream)
            coreStream!!.close()
        }
    }

    @Test
    fun `all modular threejs game assets including combat js exist in apk assets`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val assetManager = context.assets
        val expectedFiles = listOf(
            "game/index.html",
            "game/js/main.js",
            "game/js/terrain.js",
            "game/js/skyLighting.js",
            "game/js/environment.js",
            "game/js/player.js",
            "game/js/camera.js",
            "game/js/enemies.js",
            "game/js/boss.js",
            "game/js/story.js",
            "game/js/audio.js",
            "game/js/combat.js",
        )
        expectedFiles.forEach { filePath ->
            assetManager.open(filePath).use { stream ->
                assertNotNull("Asset $filePath should open", stream)
                assertTrue("Asset $filePath should be non-empty", stream.available() > 0)
            }
        }
    }

    @Test
    fun `five weapons and seven guardian powers enforce initial lock and damage balance`() {
        val weapons = com.example.ui.WeaponSlot.entries
        assertEquals(5, weapons.size)
        assertEquals("Guardian Sword", weapons[0].displayName)
        assertEquals("Quantum Axe", weapons[1].displayName)
        assertEquals("Plasma Rifle", weapons[2].displayName)
        assertEquals("Dual Energy Blasters", weapons[3].displayName)
        assertEquals("Guardian Gauntlet", weapons[4].displayName)

        assertEquals(25, weapons[0].lightDamage)
        assertEquals(60, weapons[1].heavyDamage)
        assertEquals(35, weapons[2].projectileDamage)
        assertEquals(18, weapons[2].maxAmmo)
        assertEquals(35, weapons[3].projectileDamage)
        assertEquals(24, weapons[3].maxAmmo)

        val powers = com.example.ui.GuardianPowerInfo.defaultList
        assertEquals(7, powers.size)
        assertEquals("Energy Strike", powers.first().name)
        assertTrue(powers.first().unlocked)
        assertEquals(75, powers.first().damage)
        powers.drop(1).forEach { lockedPower ->
            assertFalse("${lockedPower.name} should start locked", lockedPower.unlocked)
        }
    }

    @Test
    fun `live game state json parses 5-weapon combat, aim, reload, perfect block, powers, boss Ravok, and story`() {
        val sampleJson = """
            {
              "name": "Kael",
              "level": 3,
              "hp": 180,
              "maxHp": 240,
              "energy": 65,
              "maxEnergy": 100,
              "stamina": 80,
              "maxStamina": 100,
              "ultimate": 100,
              "potions": 2,
              "ammo": 14,
              "maxAmmo": 18,
              "isReloading": false,
              "reloadProgress": 0.0,
              "isAiming": true,
              "comboStep": 3,
              "animState": "shooting",
              "perfectBlockActive": true,
              "weaponIndex": 2,
              "isBlocking": true,
              "hasTargetLock": true,
              "enemies": [{"id": "cyclops_1", "x": -5.5, "z": -15.0, "alive": true}],
              "civilians": [{"id": "civ_1", "x": -5.2, "z": -3.5, "rescued": true}],
              "mission": {"escapedSettlement": true, "civiliansRescued": 1, "cyclopsDefeated": 2, "reachedSafeRoute": true, "ravokDefeated": false},
              "boss": {"visible": true, "name": "RAVOK, CYCLOPS COMMANDER", "hp": 1420, "maxHp": 2000, "x": 0.0, "z": -45.0},
              "story": {"sceneId": "SCENE_5_BOSS_FIGHT", "isCutscene": false, "canContinue": false, "canSkip": false, "speaker": "AETHER", "speakerRole": "AETHER", "subtitle": "Dodge Ravok!", "blackScreenText": "", "chapterCompleted": false},
              "damageNumbers": [{"id": "d1", "x": 0.5, "y": 0.4, "amount": 35, "isPlayerHit": false}]
            }
        """.trimIndent()

        val parsed = com.example.ui.LiveGameState.fromJson(sampleJson)
        assertNotNull(parsed)
        val (state, damages) = parsed!!
        assertEquals("Kael", state.playerName)
        assertEquals(240, state.maxHp)
        assertEquals(180, state.hp)
        assertEquals(65, state.energy)
        assertEquals(100, state.ultimateCharge)
        assertEquals(com.example.ui.WeaponSlot.PLASMA_RIFLE, state.weaponSlot)
        assertEquals(14, state.ammo)
        assertEquals(18, state.maxAmmo)
        assertTrue(state.isAiming)
        assertEquals(3, state.comboStep)
        assertEquals("shooting", state.animState)
        assertTrue(state.perfectBlockActive)
        assertTrue(state.isBlocking)
        assertTrue(state.hasTargetLock)
        assertEquals(7, state.powers.size)
        assertTrue(state.powers.first().unlocked)
        assertEquals(1, state.enemies.size)
        assertEquals(1, state.civilians.size)
        assertTrue(state.civilians.first().rescued)
        assertTrue(state.mission.escapedSettlement)
        assertTrue(state.mission.reachedSafeRoute)
        assertEquals(1, state.mission.civiliansRescued)
        assertEquals(2, state.mission.cyclopsDefeated)
        assertTrue(state.boss.visible)
        assertEquals(1420, state.boss.hp)
        assertEquals(2000, state.boss.maxHp)
        assertEquals("SCENE_5_BOSS_FIGHT", state.story.sceneId)
        assertEquals("AETHER", state.story.speaker)
        assertEquals(1, damages.size)
        assertEquals(35, damages.first().amount)
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    @Test
    fun `viewModel transitions, radial weapon menu, powers drawer, and Chapter 1 campaign save unlock Chapter 2`() = runBlocking {
        Dispatchers.setMain(Dispatchers.Unconfined)
        try {
            val app = ApplicationProvider.getApplicationContext<Application>()
            val vm = com.example.ui.GameViewModel(app)
            val job = launch { vm.uiState.collect {} }

            assertEquals(com.example.ui.GameScreenState.LOADING, vm.uiState.value.screenState)

            vm.onWebLoadProgress(50, "Sculpting Warmier terrain...")
            withTimeout(5000) { vm.uiState.first { it.loadingProgress >= 0.5f } }

            vm.onNewGameClicked()
            withTimeout(5000) { vm.uiState.first { it.screenState == com.example.ui.GameScreenState.PLAYING } }

            vm.onOpenRadialWeaponMenu()
            withTimeout(5000) { vm.uiState.first { it.isRadialWeaponMenuOpen && it.shouldPauseSimulation } }
            vm.onCloseRadialWeaponMenu()

            vm.onOpenPowersMenu()
            withTimeout(5000) { vm.uiState.first { it.isPowersMenuOpen && it.shouldPauseSimulation } }
            vm.onClosePowersMenu()

            vm.onHudStateJson(
                """
                {
                  "mission": {"escapedSettlement": true, "civiliansRescued": 2, "cyclopsDefeated": 3, "reachedSafeRoute": false, "ravokDefeated": false},
                  "story": {"sceneId": "SCENE_4_GAMEPLAY", "isCutscene": false, "chapterCompleted": false}
                }
                """.trimIndent()
            )
            withTimeout(5000) { vm.uiState.first { it.campaign.savedSceneId == "SCENE_4_GAMEPLAY" } }

            vm.onHudStateJson(
                """
                {
                  "mission": {"escapedSettlement": true, "civiliansRescued": 3, "cyclopsDefeated": 4, "reachedSafeRoute": true, "ravokDefeated": true},
                  "story": {"sceneId": "CHAPTER_1_COMPLETE", "isCutscene": true, "chapterCompleted": true}
                }
                """.trimIndent()
            )
            withTimeout(5000) { vm.uiState.first { it.campaign.chapter1Completed && it.campaign.chapter2Unlocked } }

            vm.onOpenPauseMenu()
            withTimeout(5000) { vm.uiState.first { it.isPaused && it.shouldPauseSimulation } }

            vm.onOpenInventory()
            withTimeout(5000) { vm.uiState.first { it.isInventoryOpen } }
            vm.onCloseInventory()

            vm.onOpenSettings()
            withTimeout(5000) { vm.uiState.first { it.isSettingsOpen } }
            vm.onCloseSettings()

            vm.onResumeGame()
            withTimeout(5000) { vm.uiState.first { !it.isPaused && !it.shouldPauseSimulation } }
            assertFalse(vm.uiState.value.shouldPauseSimulation)

            vm.onOpenChapters()
            withTimeout(5000) { vm.uiState.first { it.isChaptersOpen } }
            vm.onCloseChapters()

            vm.onReturnToMainMenu()
            withTimeout(5000) { vm.uiState.first { it.screenState == com.example.ui.GameScreenState.MAIN_MENU } }

            job.cancel()
        } finally {
            Dispatchers.resetMain()
        }
    }
}
