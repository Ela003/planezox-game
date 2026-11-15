package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.WeatherMode
import com.example.ui.LiveGameState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class Stage1ForgottenForestTest {

    @Test
    fun `forgotten forest defines 3 distinct zones, river, waterfall, bridge, hidden cave, puzzle pillars, crystals, and alien tech`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val terrainJs = context.assets.open("game/js/terrain.js").bufferedReader().use { it.readText() }
        val envJs = context.assets.open("game/js/environment.js").bufferedReader().use { it.readText() }
        val mainJs = context.assets.open("game/js/main.js").bufferedReader().use { it.readText() }

        // Terrain river carving & bridge deck
        assertTrue(terrainJs.contains("export function getRiverCenterZ"))
        assertTrue(terrainJs.contains("export function getRiverHalfWidth"))
        assertTrue(terrainJs.contains("export function isOnStoneBridge"))

        // 3 Forgotten Forest Zones
        assertTrue(envJs.contains("FORGOTTEN_FOREST_ZONES"))
        assertTrue(envJs.contains("ZONE_A"))
        assertTrue(envJs.contains("ZONE_B"))
        assertTrue(envJs.contains("ZONE_C"))
        assertTrue(envJs.contains("export function getZoneAt"))

        // Water, waterfall, bridge, hidden cave, crystals, puzzle pillars, Zone C alien tech, LOD
        assertTrue(envJs.contains("RiverWater"))
        assertTrue(envJs.contains("WaterfallStream"))
        assertTrue(envJs.contains("StoneBridge"))
        assertTrue(envJs.contains("HiddenCave"))
        assertTrue(envJs.contains("AncientPuzzlePillars"))
        assertTrue(envJs.contains("AbandonedAlienTech"))
        assertTrue(envJs.contains("crystal_hidden_cave"))
        assertTrue(envJs.contains("updateLod"))
        assertTrue(envJs.contains("setWeatherWindMultiplier"))

        // Main loop wiring
        assertTrue(mainJs.contains("tryAutoCollectCrystal"))
        assertTrue(mainJs.contains("environment.updateLod"))
        assertTrue(mainJs.contains("setWeatherWindMultiplier"))
    }

    @Test
    fun `dynamic weather system supports all 6 weather modes, clouds, rain, lightning thunder, and kotlin serialization`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val skyJs = context.assets.open("game/js/skyLighting.js").bufferedReader().use { it.readText() }
        val audioJs = context.assets.open("game/js/audio.js").bufferedReader().use { it.readText() }
        val mainJs = context.assets.open("game/js/main.js").bufferedReader().use { it.readText() }

        WeatherMode.entries.forEach { mode ->
            assertTrue("Missing weather mode ${mode.jsValue}", skyJs.contains("${mode.jsValue}: '${mode.jsValue}'"))
        }
        assertTrue(skyJs.contains("SkyClouds"))
        assertTrue(skyJs.contains("WeatherRainParticles"))
        assertTrue(skyJs.contains("onThunder"))
        assertTrue(audioJs.contains("playThunder"))
        assertTrue(audioJs.contains("playCrystalPickup"))
        assertTrue(mainJs.contains("setWeather(mode)"))

        val json = """
            {
              "zoneId": "ZONE_B",
              "zoneName": "Zone B · Ancient Guardian Ruins",
              "weather": "THUNDERSTORM",
              "crystalsCollected": 4,
              "totalCrystals": 6,
              "puzzlePillarsActivated": 2
            }
        """.trimIndent()
        val parsed = LiveGameState.fromJson(json)
        assertNotNull(parsed)
        val live = parsed!!.first
        assertEquals("ZONE_B", live.zoneId)
        assertEquals("Zone B · Ancient Guardian Ruins", live.zoneName)
        assertEquals("THUNDERSTORM", live.weather)
        assertEquals(4, live.crystalsCollected)
        assertEquals(6, live.totalCrystals)
        assertEquals(2, live.puzzlePillarsActivated)
    }

    @Test
    fun `upgraded forgotten forest includes PBR terrain maps, conifers, vines, ferns, stairs, colonnade, statues, rune seal, IBL reflections, and energy device`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val terrainJs = context.assets.open("game/js/terrain.js").bufferedReader().use { it.readText() }
        val skyJs = context.assets.open("game/js/skyLighting.js").bufferedReader().use { it.readText() }
        val envJs = context.assets.open("game/js/environment.js").bufferedReader().use { it.readText() }
        val mainJs = context.assets.open("game/js/main.js").bufferedReader().use { it.readText() }

        // Procedural terrain PBR relief & branching cave/waterfall paths
        assertTrue(terrainJs.contains("createTerrainDetailTextures"))
        assertTrue(terrainJs.contains("distToSegment2D"))
        assertTrue(terrainJs.contains("setWetness"))

        // PMREM IBL reflections + wind streaks
        assertTrue(skyJs.contains("initEnvironmentMap"))
        assertTrue(skyJs.contains("PMREMGenerator"))
        assertTrue(skyJs.contains("WeatherWindStreaks"))

        // Conifers, hanging vines, 3D splayed ferns, ancient stairs, colonnade, statues, cliffside rune seal, twin waterfall, energy obelisk, and asset audit
        assertTrue(envJs.contains("TreeConifersInstanced"))
        assertTrue(envJs.contains("TreeVinesInstanced"))
        assertTrue(envJs.contains("ForestFernsInstanced"))
        assertTrue(envJs.contains("TempleStairs"))
        assertTrue(envJs.contains("TempleColonnade"))
        assertTrue(envJs.contains("ForgottenStatues"))
        assertTrue(envJs.contains("CliffsideRuneSeal"))
        assertTrue(envJs.contains("TwinWaterfallCascade"))
        assertTrue(envJs.contains("GuardianEnergyDevice"))
        assertTrue(envJs.contains("getMissingEnvironmentAssets"))

        // Main loop hooks
        assertTrue(mainJs.contains("skyLighting.initEnvironmentMap(renderer)"))
        assertTrue(mainJs.contains("energy_device"))
        assertTrue(mainJs.contains("environment.getMissingEnvironmentAssets()"))
    }
}

