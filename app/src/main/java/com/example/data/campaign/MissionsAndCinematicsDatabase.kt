package com.example.data.campaign

/**
 * Mission Progression & Cinematic Sequence Blueprint Databases across Chapters 01–10.
 */
object MissionsAndCinematicsDatabase {

    val missions: List<MissionDefinition> = listOf(
        // ── CHAPTER 1: THE FALLING ASTEROID ──────────────────────────────────
        MissionDefinition(
            id = "CH01_M01", chapterNumber = 1, orderIndex = 1,
            title = "Evacuate Warmier Settlement", type = MissionType.MAIN_STORY,
            summary = "Guide panicked villagers out of the burning valley huts before debris crushes the ridge.",
            objectives = listOf(MissionObjectiveSpec("ch01_rescue_civ", "Rescue trapped Warmier civilians", 3, "ch01_settlement")),
            reward = MissionRewardSpec("rw_ch01_m01", xp = 120, gold = 60, shards = 3),
            nextMissionId = "CH01_M02",
        ),
        MissionDefinition(
            id = "CH01_M02", chapterNumber = 1, orderIndex = 2,
            title = "Hold the Forest Line", type = MissionType.COMBAT,
            summary = "Eliminate Cyclops vanguard raiders sweeping down from the crater ridge.",
            objectives = listOf(MissionObjectiveSpec("ch01_kill_vanguard", "Defeat Cyclops raiders", 4, "ch01_forest_trail")),
            reward = MissionRewardSpec("rw_ch01_m02", xp = 150, gold = 80, shards = 4),
            nextMissionId = "CH01_M03",
        ),
        MissionDefinition(
            id = "CH01_M03", chapterNumber = 1, orderIndex = 3,
            title = "Follow the Hidden Guardian Marker", type = MissionType.EXPLORATION,
            summary = "Follow Kael's pulsing hand emblem through the burned ridge to the safe evacuation route.",
            objectives = listOf(MissionObjectiveSpec("ch01_safe_route", "Reach the Burned Ridge Safe Route", 1, "ch01_hidden_shrine")),
            reward = MissionRewardSpec("rw_ch01_m03", xp = 140, gold = 75, shards = 5),
            nextMissionId = "CH01_M04",
        ),
        MissionDefinition(
            id = "CH01_M04", chapterNumber = 1, orderIndex = 4,
            title = "Commander of the Asteroid", type = MissionType.BOSS,
            summary = "Defeat Cyclops Commander Ravok and unleash Kael's first Awakening Energy Blast.",
            objectives = listOf(MissionObjectiveSpec("ch01_defeat_ravok", "Defeat Ravok, Cyclops Commander", 1, "ch01_impact_crater")),
            reward = MissionRewardSpec("rw_ch01_m04", xp = 400, gold = 250, shards = 12, storyFragmentId = "AWAKENING_SPARK"),
            nextMissionId = "CH02_M01",
        ),

        // ── CHAPTER 2: THE AWAKENING ─────────────────────────────────────────
        MissionDefinition(
            id = "CH02_M01", chapterNumber = 2, orderIndex = 1,
            title = "Signal Beneath the Roots", type = MissionType.EXPLORATION,
            summary = "Descend into the ancient underground facility beneath the shattered forest ridge.",
            objectives = listOf(MissionObjectiveSpec("ch02_reach_nexus", "Locate AETHER Central Nexus", 1, "ch02_aether_chamber")),
            reward = MissionRewardSpec("rw_ch02_m01", xp = 220, gold = 120, shards = 6),
            nextMissionId = "CH02_M02",
        ),
        MissionDefinition(
            id = "CH02_M02", chapterNumber = 2, orderIndex = 2,
            title = "Conduit Alignment", type = MissionType.PUZZLE,
            summary = "Synchronize 3 dormant Quantum Resonance relays to boot AETHER's Eternity Core map.",
            objectives = listOf(MissionObjectiveSpec("ch02_align_relays", "Activate Quantum Conduits", 3, "ch02_resonance_conduit")),
            reward = MissionRewardSpec("rw_ch02_m02", xp = 260, gold = 140, shards = 8),
            nextMissionId = "CH02_M03",
        ),
        MissionDefinition(
            id = "CH02_M03", chapterNumber = 2, orderIndex = 3,
            title = "Repel Recon Breach", type = MissionType.COMBAT,
            summary = "Destroy invading Cyclops Drones breaching the eastern corridor.",
            objectives = listOf(MissionObjectiveSpec("ch02_clear_drones", "Destroy Cyclops Recon Squad", 6, "ch02_scout_breach")),
            reward = MissionRewardSpec("rw_ch02_m03", xp = 320, gold = 180, shards = 10),
            nextMissionId = "CH03_M01",
        ),

        // ── CHAPTER 3: THE FORGOTTEN FOREST ──────────────────────────────────
        MissionDefinition(
            id = "CH03_M01", chapterNumber = 3, orderIndex = 1,
            title = "Enter the Forgotten Woods", type = MissionType.EXPLORATION,
            summary = "Navigate glowing canopy roots and ancient stone aqueducts toward the First Spark Altar.",
            objectives = listOf(MissionObjectiveSpec("ch03_cross_canopy", "Reach the Sunken Rune Courtyard", 1, "ch03_rune_courtyard")),
            reward = MissionRewardSpec("rw_ch03_m01", xp = 340, gold = 200, shards = 10),
            nextMissionId = "CH03_M02",
        ),
        MissionDefinition(
            id = "CH03_M02", chapterNumber = 3, orderIndex = 2,
            title = "Seals of the Ancients", type = MissionType.PUZZLE,
            summary = "Rotate 4 ancient Guardian rune pillars to unseal the Altar of the First Spark.",
            objectives = listOf(MissionObjectiveSpec("ch03_solve_runes", "Align Guardian Rune Pillars", 4, "ch03_rune_courtyard")),
            reward = MissionRewardSpec("rw_ch03_m02", xp = 380, gold = 220, shards = 12),
            nextMissionId = "CH03_M03",
        ),
        MissionDefinition(
            id = "CH03_M03", chapterNumber = 3, orderIndex = 3,
            title = "First Energy Fragment", type = MissionType.COLLECTION,
            summary = "Claim Fragment I and master the Energy Strike power against Cyclops Heavy Warriors.",
            objectives = listOf(MissionObjectiveSpec("ch03_claim_frag1", "Retrieve Fragment I — Ember of Kinetic Dawn", 1, "ch03_fragment_altar")),
            reward = MissionRewardSpec("rw_ch03_m03", xp = 520, gold = 320, shards = 18, unlockedPowerId = "energy_strike", storyFragmentId = "FRAGMENT_01"),
            nextMissionId = "CH04_M01",
        ),

        // ── CHAPTER 4: THE DARK DESERT ───────────────────────────────────────
        MissionDefinition(
            id = "CH04_M01", chapterNumber = 4, orderIndex = 1,
            title = "Sandstorm Outpost Raid", type = MissionType.COMBAT,
            summary = "Break the Cyclops desert perimeter amidst blinding obsidian sandstorms.",
            objectives = listOf(MissionObjectiveSpec("ch04_clear_outpost", "Neutralize Outpost Garrison", 8, "ch04_cyclops_outpost")),
            reward = MissionRewardSpec("rw_ch04_m01", xp = 480, gold = 300, shards = 14),
            nextMissionId = "CH04_M02",
        ),
        MissionDefinition(
            id = "CH04_M02", chapterNumber = 4, orderIndex = 2,
            title = "Phantom of the Dunes", type = MissionType.BOSS,
            summary = "Defeat Vexor in the Storm Mirage Arena and unlock Shadow Dash.",
            objectives = listOf(MissionObjectiveSpec("ch04_defeat_vexor", "Defeat Boss Vexor", 1, "ch04_vexor_pit")),
            reward = MissionRewardSpec("rw_ch04_m02", xp = 750, gold = 480, shards = 24, unlockedPowerId = "shadow_dash", storyFragmentId = "FRAGMENT_02"),
            nextMissionId = "CH05_M01",
        ),

        // ── CHAPTER 5: THE FROZEN MOUNTAINS ──────────────────────────────────
        MissionDefinition(
            id = "CH05_M01", chapterNumber = 5, orderIndex = 1,
            title = "Frozen Fortress Gate", type = MissionType.PUZZLE,
            summary = "Redirect thermal mirrors through the cryo caverns to unfreeze the Frost Citadel gate.",
            objectives = listOf(MissionObjectiveSpec("ch05_melt_seal", "Align Cryo-Thermal Mirrors", 3, "ch05_fortress_gate")),
            reward = MissionRewardSpec("rw_ch05_m01", xp = 600, gold = 380, shards = 18),
            nextMissionId = "CH05_M02",
        ),
        MissionDefinition(
            id = "CH05_M02", chapterNumber = 5, orderIndex = 2,
            title = "Trial of the Cryo Colossus", type = MissionType.BOSS,
            summary = "Defeat the Ice Guardian atop the Peak Sanctuary to unlock Plasma Blast.",
            objectives = listOf(MissionObjectiveSpec("ch05_defeat_ice", "Defeat Ice Guardian", 1, "ch05_glacier_throne")),
            reward = MissionRewardSpec("rw_ch05_m02", xp = 900, gold = 580, shards = 28, unlockedPowerId = "plasma_blast", storyFragmentId = "FRAGMENT_03"),
            nextMissionId = "CH06_M01",
        ),

        // ── CHAPTER 6: THE UNDERGROUND CITY ──────────────────────────────────
        MissionDefinition(
            id = "CH06_M01", chapterNumber = 6, orderIndex = 1,
            title = "Liberate the Subterranean Forum", type = MissionType.COMBAT,
            summary = "Fight across magma-lit skyways to sever Brutax's refinery shield pylons.",
            objectives = listOf(MissionObjectiveSpec("ch06_break_pylons", "Destroy Magma Shield Pylons", 4, "ch06_reactor_bridge")),
            reward = MissionRewardSpec("rw_ch06_m01", xp = 760, gold = 460, shards = 20),
            nextMissionId = "CH06_M02",
        ),
        MissionDefinition(
            id = "CH06_M02", chapterNumber = 6, orderIndex = 2,
            title = "Crucible of Brutax", type = MissionType.BOSS,
            summary = "Shatter Brutax the Siege Juggernaut and claim Fragment IV & Titan Shield.",
            objectives = listOf(MissionObjectiveSpec("ch06_defeat_brutax", "Defeat Boss Brutax", 1, "ch06_brutax_foundry")),
            reward = MissionRewardSpec("rw_ch06_m02", xp = 1100, gold = 700, shards = 32, unlockedPowerId = "titan_shield", storyFragmentId = "FRAGMENT_04"),
            nextMissionId = "CH07_M01",
        ),

        // ── CHAPTER 7: THE FLOATING ISLANDS ──────────────────────────────────
        MissionDefinition(
            id = "CH07_M01", chapterNumber = 7, orderIndex = 1,
            title = "Cross the Energy Bridges", type = MissionType.EXPLORATION,
            summary = "Traverse shifting gravity anomalies and stabilize hard-light bridges up to Cloudspire.",
            objectives = listOf(MissionObjectiveSpec("ch07_stabilize", "Stabilize Gravity Bridges", 3, "ch07_energy_bridges")),
            reward = MissionRewardSpec("rw_ch07_m01", xp = 920, gold = 540, shards = 24),
            nextMissionId = "CH07_M02",
        ),
        MissionDefinition(
            id = "CH07_M02", chapterNumber = 7, orderIndex = 2,
            title = "Lord of the Stratosphere", type = MissionType.BOSS,
            summary = "Defeat Nexar, claim Fragment V, unlock Gravity Control, and trigger Kael's childhood memory.",
            objectives = listOf(MissionObjectiveSpec("ch07_defeat_nexar", "Defeat Boss Nexar", 1, "ch07_nexar_zenith")),
            reward = MissionRewardSpec("rw_ch07_m02", xp = 1300, gold = 820, shards = 36, unlockedPowerId = "gravity_control", storyFragmentId = "FRAGMENT_05"),
            nextMissionId = "CH08_M01",
        ),

        // ── CHAPTER 8: THE LOST GUARDIAN TEMPLE ──────────────────────────────
        MissionDefinition(
            id = "CH08_M01", chapterNumber = 8, orderIndex = 1,
            title = "Sanctum Trial Vault", type = MissionType.PUZZLE,
            summary = "Pass the ancient Guardians' Quantum Resonance trials to unlock Quantum Blast.",
            objectives = listOf(MissionObjectiveSpec("ch08_trials", "Complete Guardian Sanctum Trials", 3, "ch08_sanctum_trials")),
            reward = MissionRewardSpec("rw_ch08_m01", xp = 1150, gold = 680, shards = 30, unlockedPowerId = "quantum_blast"),
            nextMissionId = "CH08_M02",
        ),
        MissionDefinition(
            id = "CH08_M02", chapterNumber = 8, orderIndex = 2,
            title = "Legacy of Kael's Father", type = MissionType.COLLECTION,
            summary = "Enter the Core Energy Chamber, witness the full Guardian flashback, and awaken Guardian Mode.",
            objectives = listOf(MissionObjectiveSpec("ch08_core_chamber", "Commune with the Core Energy Chamber", 1, "ch08_core_chamber")),
            reward = MissionRewardSpec("rw_ch08_m02", xp = 1500, gold = 950, shards = 40, unlockedPowerId = "guardian_mode", storyFragmentId = "FRAGMENT_06"),
            nextMissionId = "CH09_M01",
        ),

        // ── CHAPTER 9: THE BETRAYAL ──────────────────────────────────────────
        MissionDefinition(
            id = "CH09_M01", chapterNumber = 9, orderIndex = 1,
            title = "Purge the Corrupted Signal", type = MissionType.MAIN_STORY,
            summary = "Sever Zyrox's hijack transmission inside AETHER's core and recover the Seventh Fragment.",
            objectives = listOf(MissionObjectiveSpec("ch09_purge_signal", "Restore AETHER Core Firewall", 1, "ch09_nexus_breach")),
            reward = MissionRewardSpec("rw_ch09_m01", xp = 1400, gold = 850, shards = 36, storyFragmentId = "FRAGMENT_07"),
            nextMissionId = "CH09_M02",
        ),
        MissionDefinition(
            id = "CH09_M02", chapterNumber = 9, orderIndex = 2,
            title = "Last Stand at the Temple", type = MissionType.COMBAT,
            summary = "Hold the besieged ramparts against Cyclops drop-pod waves until the Core descent gate opens.",
            objectives = listOf(MissionObjectiveSpec("ch09_survive_siege", "Repel Cyclops Siege Waves", 3, "ch09_temple_ramparts")),
            reward = MissionRewardSpec("rw_ch09_m02", xp = 1650, gold = 1000, shards = 42),
            nextMissionId = "CH10_M01",
        ),

        // ── CHAPTER 10: THE FINAL WAR ────────────────────────────────────────
        MissionDefinition(
            id = "CH10_M01", chapterNumber = 10, orderIndex = 1,
            title = "Storm the Core Reactor", type = MissionType.COMBAT,
            summary = "Cut across the Core Reactor Causeway through Cyclops Elite Royal Guards.",
            objectives = listOf(MissionObjectiveSpec("ch10_breach_core", "Clear Core Reactor Causeway", 10, "ch10_core_causeway")),
            reward = MissionRewardSpec("rw_ch10_m01", xp = 1800, gold = 1100, shards = 45),
            nextMissionId = "CH10_M02",
        ),
        MissionDefinition(
            id = "CH10_M02", chapterNumber = 10, orderIndex = 2,
            title = "Gauntlet of the Four Commanders", type = MissionType.BOSS,
            summary = "Shatter the resurrected echoes of Ravok, Vexor, Brutax, and Nexar guarding the inner ring.",
            objectives = listOf(MissionObjectiveSpec("ch10_gauntlet", "Defeat the Cyclops Commander Gauntlet", 4, "ch10_commander_ring")),
            reward = MissionRewardSpec("rw_ch10_m02", xp = 2400, gold = 1500, shards = 60),
            nextMissionId = "CH10_M03",
        ),
        MissionDefinition(
            id = "CH10_M03", chapterNumber = 10, orderIndex = 3,
            title = "Lord Zyrox & The Eternal Nova", type = MissionType.BOSS,
            summary = "Confront Lord Zyrox across all phases inside the Heart of Eternity and unleash Eternal Nova.",
            objectives = listOf(MissionObjectiveSpec("ch10_defeat_zyrox", "Defeat Lord Zyrox", 1, "ch10_eternity_nexus")),
            reward = MissionRewardSpec("rw_ch10_m03", xp = 5000, gold = 3000, shards = 100, unlockedPowerId = "eternal_nova", storyFragmentId = "CORE_CONVERGENCE"),
            nextMissionId = null,
        ),
    )

    val cinematics: List<CinematicSequenceDefinition> = listOf(
        CinematicSequenceDefinition(
            id = "CS_01_SPACE_WARMIER", chapterNumber = 1,
            title = "Deep Space — Planet Warmier Introduction",
            locksPlayerControls = true, allowSkip = true, allowContinue = true,
            cameraBeats = listOf(
                CameraBeat("b1", CinematicCameraShotType.WIDE_ESTABLISHING, 0f, 5.5f, "Planet Warmier Orbit", 1.0f, "starfield_drift"),
                CameraBeat("b2", CinematicCameraShotType.TRACKING, 5.5f, 4.0f, "Atmosphere Entry Dive", 1.0f, "cloud_wisps"),
            ),
            dialogueCues = listOf(
                DialogueCue("d1", "narrator", "CHRONICLE", "Narrator", "Far beyond the Milky Way lies Warmier—peaceful on the surface, yet guarding the Core of Eternity.", 9.0f, "VO_CALM", "sfx_space_drone"),
            ),
            nextSequenceOrGameplayState = "CS_01_FOREST_NIGHTMARE",
        ),
        CinematicSequenceDefinition(
            id = "CS_01_ASTEROID_MOTHERSHIP", chapterNumber = 1,
            title = "The Falling Asteroid & Zyrox Reveal",
            locksPlayerControls = true, allowSkip = true, allowContinue = true,
            cameraBeats = listOf(
                CameraBeat("b1", CinematicCameraShotType.CRANE_AERIAL, 0f, 3.2f, "Flaming Asteroid Descent", 0.75f, "meteor_fire_trail"),
                CameraBeat("b2", CinematicCameraShotType.DRAMATIC_REVEAL, 3.2f, 4.5f, "Cyclops Mothership Unfolding", 1.0f, "shockwave_dust"),
                CameraBeat("b3", CinematicCameraShotType.CLOSE_UP, 7.7f, 4.5f, "Lord Zyrox Hologram", 1.0f, "crimson_holo_static"),
            ),
            dialogueCues = listOf(
                DialogueCue("d1", "lord_zyrox", "LORD ZYROX", "Villain", "The Core of Eternity belongs to the Cyclops Empire. Burn every settlement until it is mine!", 5.0f, "ZYROX_COMMAND", "sfx_zyrox_bass"),
            ),
            nextSequenceOrGameplayState = "GAMEPLAY_CH01_ESCAPE",
        ),
        CinematicSequenceDefinition(
            id = "CS_01_RAVOK_INTRO", chapterNumber = 1,
            title = "Boss Introduction — Ravok, Cyclops Commander",
            locksPlayerControls = true, allowSkip = true, allowContinue = true,
            cameraBeats = listOf(
                CameraBeat("b1", CinematicCameraShotType.BOSS_INTRODUCTION, 0f, 3.5f, "Ravok Impact Crater Arrival", 0.55f, "crimson_ground_slam"),
                CameraBeat("b2", CinematicCameraShotType.OVER_THE_SHOULDER, 3.5f, 2.5f, "Kael Drawing Guardian Sword", 1.0f, "emblem_cyan_spark"),
            ),
            dialogueCues = listOf(
                DialogueCue("d1", "ravok", "RAVOK", "Boss", "No human flees the asteroid zone. Surrender the Guardian spark, boy!", 4.5f, "RAVOK_ROAR", "sfx_boss_horn"),
            ),
            nextSequenceOrGameplayState = "GAMEPLAY_CH01_RAVOK_BOSS",
        ),
        CinematicSequenceDefinition(
            id = "CS_02_MEETING_AETHER", chapterNumber = 2,
            title = "Ancient AI Awakening — AETHER",
            locksPlayerControls = true, allowSkip = true, allowContinue = true,
            cameraBeats = listOf(
                CameraBeat("b1", CinematicCameraShotType.DRAMATIC_REVEAL, 0f, 4.0f, "AETHER Hologram Projection", 1.0f, "cyan_data_particles"),
                CameraBeat("b2", CinematicCameraShotType.CLOSE_UP, 4.0f, 3.5f, "Kael's Glowing Hand Emblem", 1.0f, "quantum_resonance"),
            ),
            dialogueCues = listOf(
                DialogueCue("d1", "aether", "AETHER", "Ancient AI", "Genetic Quantum Resonance confirmed. Kael, seven fragments of Eternity lie scattered across Warmier.", 7.0f, "AETHER_SYNC", "sfx_aether_chime"),
            ),
            nextSequenceOrGameplayState = "GAMEPLAY_CH02_CONDUITS",
        ),
        CinematicSequenceDefinition(
            id = "CS_08_FATHER_FLASHBACK", chapterNumber = 8,
            title = "Truth of the Guardians & Kael's Father",
            locksPlayerControls = true, allowSkip = true, allowContinue = true,
            cameraBeats = listOf(
                CameraBeat("b1", CinematicCameraShotType.WIDE_ESTABLISHING, 0f, 4.0f, "Fall of the Ancient Guardians", 0.8f, "golden_embers"),
                CameraBeat("b2", CinematicCameraShotType.CLOSE_UP, 4.0f, 4.0f, "Father Placing Guardian Crest on Young Kael", 0.65f, "eternity_flare"),
                CameraBeat("b3", CinematicCameraShotType.CRANE_AERIAL, 8.0f, 3.5f, "Kael Ascending in Guardian Mode", 1.0f, "golden_aura_burst"),
            ),
            dialogueCues = listOf(
                DialogueCue("d1", "guardians_of_eternity", "SUPREME GUARDIAN", "Kael's Father", "The Core must never fall into darkness, Kael. Carry our light until you awaken Guardian Mode.", 7.5f, "FATHER_SOLEMN", "sfx_flashback_swell"),
            ),
            nextSequenceOrGameplayState = "GAMEPLAY_CH08_GUARDIAN_MODE",
        ),
        CinematicSequenceDefinition(
            id = "CS_09_AETHER_CORRUPTION", chapterNumber = 9,
            title = "The Betrayal — Corrupted Transmission",
            locksPlayerControls = true, allowSkip = true, allowContinue = true,
            cameraBeats = listOf(
                CameraBeat("b1", CinematicCameraShotType.CLOSE_UP, 0f, 3.5f, "AETHER Glitching Red-Cyan", 1.0f, "corruption_glitch_sparks"),
                CameraBeat("b2", CinematicCameraShotType.OVER_THE_SHOULDER, 3.5f, 3.5f, "Temple Ramparts Under Siege", 1.0f, "crimson_sky_beams"),
            ),
            dialogueCues = listOf(
                DialogueCue("d1", "aether", "AETHER [CORRUPTED]", "AI Override", "Firewall breached—coordinates transmitted to Zyrox. Kael, fight on—your father's life-sign still pulses inside the Core!", 7.0f, "AETHER_DISTORTED", "sfx_alarm_corruption"),
            ),
            nextSequenceOrGameplayState = "GAMEPLAY_CH09_TEMPLE_SIEGE",
        ),
        CinematicSequenceDefinition(
            id = "CS_10_ETERNAL_NOVA_FINALE", chapterNumber = 10,
            title = "Final Awakening — Eternal Nova vs Lord Zyrox",
            locksPlayerControls = true, allowSkip = false, allowContinue = true,
            cameraBeats = listOf(
                CameraBeat("b1", CinematicCameraShotType.BOSS_INTRODUCTION, 0f, 3.5f, "Lord Zyrox Final Core Phase", 0.7f, "crimson_void_vortex"),
                CameraBeat("b2", CinematicCameraShotType.TRACKING, 3.5f, 3.5f, "7 Fragments Orbiting Kael", 0.45f, "seven_fragment_convergence"),
                CameraBeat("b3", CinematicCameraShotType.CRANE_AERIAL, 7.0f, 4.5f, "Eternal Nova Detonation", 0.35f, "eternal_nova_supernova"),
            ),
            dialogueCues = listOf(
                DialogueCue("d1", "kael", "KAEL", "Guardian of Eternity", "This is for Warmier, for the fallen Guardians, and for my father—ETERNAL NOVA!", 6.5f, "KAEL_ULTIMATE_SHOUT", "sfx_eternal_nova_climax"),
            ),
            nextSequenceOrGameplayState = "CS_10_POST_CREDIT_MULTIVERSE_PHASE_TWO",
        ),
        CinematicSequenceDefinition(
            id = "CS_10_POST_CREDIT_MULTIVERSE_PHASE_TWO", chapterNumber = 10,
            title = "Post-Credit Teaser — Multiverse Invasion",
            locksPlayerControls = true, allowSkip = true, allowContinue = true,
            cameraBeats = listOf(
                CameraBeat("b1", CinematicCameraShotType.DRAMATIC_REVEAL, 0f, 5.0f, "Deep Space Armadas Awakening", 1.0f, "purple_rift_portal"),
            ),
            dialogueCues = listOf(
                DialogueCue("d1", "system", "SYSTEM", "Deep Space Relay", "CYCLOPS EMPIRE – MULTIVERSE INVASION: PHASE TWO ACTIVATED", 5.0f, "NONE", "sfx_post_credit_sting"),
            ),
            nextSequenceOrGameplayState = "CAMPAIGN_EPILOGUE_COMPLETE",
        ),
    )

    fun getMissionsForChapter(chapterNumber: Int): List<MissionDefinition> =
        missions.filter { it.chapterNumber == chapterNumber }.sortedBy { it.orderIndex }

    fun getCinematicsForChapter(chapterNumber: Int): List<CinematicSequenceDefinition> =
        cinematics.filter { it.chapterNumber == chapterNumber }
}
