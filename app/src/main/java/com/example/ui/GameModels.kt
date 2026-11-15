package com.example.ui

import org.json.JSONObject

enum class WeaponSlot(
    val slotIndex: Int,
    val displayName: String,
    val shortName: String,
    val isRanged: Boolean = false,
    val category: String = if (isRanged) "RANGED" else "MELEE",
    val lightDamage: Int = 25,
    val heavyDamage: Int = 60,
    val projectileDamage: Int = if (isRanged) 35 else 0,
    val maxAmmo: Int = 0,
    val unlocked: Boolean = true,
) {
    GUARDIAN_SWORD(
        slotIndex = 0,
        displayName = "Guardian Sword",
        shortName = "Sword",
        isRanged = false,
        category = "MELEE",
        lightDamage = 25,
        heavyDamage = 60,
    ),
    QUANTUM_AXE(
        slotIndex = 1,
        displayName = "Quantum Axe",
        shortName = "Axe",
        isRanged = false,
        category = "MELEE",
        lightDamage = 25,
        heavyDamage = 60,
    ),
    PLASMA_RIFLE(
        slotIndex = 2,
        displayName = "Plasma Rifle",
        shortName = "Rifle",
        isRanged = true,
        category = "RANGED",
        lightDamage = 25,
        heavyDamage = 60,
        projectileDamage = 35,
        maxAmmo = 18,
    ),
    DUAL_BLASTERS(
        slotIndex = 3,
        displayName = "Dual Energy Blasters",
        shortName = "Blasters",
        isRanged = true,
        category = "RANGED",
        lightDamage = 25,
        heavyDamage = 60,
        projectileDamage = 35,
        maxAmmo = 24,
    ),
    GUARDIAN_GAUNTLET(
        slotIndex = 4,
        displayName = "Guardian Gauntlet",
        shortName = "Gauntlet",
        isRanged = false,
        category = "MELEE",
        lightDamage = 25,
        heavyDamage = 60,
    ),
}

data class GuardianPowerInfo(
    val id: String,
    val name: String,
    val description: String,
    val energyCost: Int,
    val cooldown: Float,
    val damage: Int,
    val unlockChapter: Int,
    val unlocked: Boolean,
) {
    companion object {
        val defaultList = listOf(
            GuardianPowerInfo(
                id = "energy_strike",
                name = "Energy Strike",
                description = "Channels Kael’s hand emblem into a 75-damage Guardian arc shockwave.",
                energyCost = 30,
                cooldown = 4.0f,
                damage = 75,
                unlockChapter = 1,
                unlocked = true,
            ),
            GuardianPowerInfo(
                id = "shadow_dash",
                name = "Shadow Dash",
                description = "Phase-step through alien fire leaving an afterimage shock trail.",
                energyCost = 25,
                cooldown = 5.0f,
                damage = 45,
                unlockChapter = 2,
                unlocked = false,
            ),
            GuardianPowerInfo(
                id = "plasma_blast",
                name = "Plasma Blast",
                description = "Fires an overcharged core beam that pierces Cyclops armor.",
                energyCost = 40,
                cooldown = 6.5f,
                damage = 110,
                unlockChapter = 3,
                unlocked = false,
            ),
            GuardianPowerInfo(
                id = "titan_shield",
                name = "Titan Shield",
                description = "Projects a 360-degree Guardian barrier that reflects projectiles.",
                energyCost = 35,
                cooldown = 8.0f,
                damage = 50,
                unlockChapter = 4,
                unlocked = false,
            ),
            GuardianPowerInfo(
                id = "gravity_control",
                name = "Gravity Control",
                description = "Suspends nearby Cyclops units inside a crushing stasis field.",
                energyCost = 45,
                cooldown = 10.0f,
                damage = 90,
                unlockChapter = 5,
                unlocked = false,
            ),
            GuardianPowerInfo(
                id = "quantum_blast",
                name = "Quantum Blast",
                description = "Detonates a multi-ring quantum singularity at the locked target.",
                energyCost = 55,
                cooldown = 12.0f,
                damage = 155,
                unlockChapter = 6,
                unlocked = false,
            ),
            GuardianPowerInfo(
                id = "guardian_mode",
                name = "Guardian Mode",
                description = "Full Eternity Core transcendence amplifying all attacks and speed.",
                energyCost = 80,
                cooldown = 22.0f,
                damage = 220,
                unlockChapter = 7,
                unlocked = false,
            ),
        )
    }
}

data class MinimapEnemyBlip(
    val id: String,
    val x: Float,
    val z: Float,
    val alive: Boolean,
)

data class MinimapCivilianBlip(
    val id: String,
    val x: Float,
    val z: Float,
    val rescued: Boolean,
)

data class DamageNumberEvent(
    val id: String,
    val normX: Float,
    val normY: Float,
    val amount: Int,
    val isPlayerHit: Boolean,
    val createdAtMs: Long,
)

data class MissionProgress(
    val escapedSettlement: Boolean = false,
    val civiliansRescued: Int = 0,
    val cyclopsDefeated: Int = 0,
    val reachedSafeRoute: Boolean = false,
    val ravokDefeated: Boolean = false,
) {
    val isAllComplete: Boolean
        get() = ravokDefeated
}

data class BossHudState(
    val visible: Boolean = false,
    val name: String = "RAVOK, CYCLOPS COMMANDER",
    val hp: Int = 2000,
    val maxHp: Int = 2000,
    val x: Float = 0f,
    val z: Float = -46f,
)

data class StoryHudState(
    val sceneId: String = "MENU_ORBIT",
    val isCutscene: Boolean = false,
    val canContinue: Boolean = false,
    val canSkip: Boolean = false,
    val speaker: String = "",
    val speakerRole: String = "",
    val subtitle: String = "",
    val blackScreenText: String = "",
    val chapterCompleted: Boolean = false,
)

data class ActionCooldowns(
    val light: Float = 0f,
    val heavy: Float = 0f,
    val dodge: Float = 0f,
    val special: Float = 0f,
    val potion: Float = 0f,
)

data class LiveGameState(
    val playerName: String = "Kael",
    val level: Int = 1,
    val hp: Int = 240,
    val maxHp: Int = 240,
    val energy: Int = 100,
    val maxEnergy: Int = 100,
    val stamina: Int = 100,
    val maxStamina: Int = 100,
    val ultimateCharge: Int = 45,
    val potions: Int = 3,
    val ammo: Int = 0,
    val maxAmmo: Int = 0,
    val isReloading: Boolean = false,
    val reloadProgress: Float = 0f,
    val isAiming: Boolean = false,
    val comboStep: Int = 0,
    val animState: String = "idle",
    val perfectBlockActive: Boolean = false,
    val titanShieldActive: Boolean = false,
    val guardianModeActive: Boolean = false,
    val gold: Int = 120,
    val shards: Int = 15,
    val weaponSlot: WeaponSlot = WeaponSlot.GUARDIAN_SWORD,
    val isBlocking: Boolean = false,
    val isRunning: Boolean = false,
    val hasTargetLock: Boolean = false,
    val lockedEnemyName: String = "",
    val nearbyPrompt: String = "",
    val powers: List<GuardianPowerInfo> = GuardianPowerInfo.defaultList,
    val cooldowns: ActionCooldowns = ActionCooldowns(),
    val playerX: Float = 0f,
    val playerZ: Float = 0f,
    val playerYaw: Float = 0f,
    val enemies: List<MinimapEnemyBlip> = emptyList(),
    val civilians: List<MinimapCivilianBlip> = emptyList(),
    val templeX: Float = 0f,
    val templeZ: Float = -46f,
    val artifactCollected: Boolean = false,
    val zoneId: String = "ZONE_A",
    val zoneName: String = "Zone A · Forest Entrance",
    val weather: String = "SUNNY",
    val crystalsCollected: Int = 0,
    val totalCrystals: Int = 6,
    val puzzlePillarsActivated: Int = 0,
    val mission: MissionProgress = MissionProgress(),
    val boss: BossHudState = BossHudState(),
    val story: StoryHudState = StoryHudState(),
) {
    val isLowHealth: Boolean
        get() = maxHp > 0 && hp.toFloat() / maxHp.toFloat() <= 0.30f

    companion object {
        fun fromJson(json: String): Pair<LiveGameState, List<DamageNumberEvent>>? = runCatching {
            val obj = JSONObject(json)
            val cdObj = obj.optJSONObject("cooldowns") ?: JSONObject()
            val mObj = obj.optJSONObject("mission") ?: JSONObject()
            val bObj = obj.optJSONObject("boss") ?: JSONObject()
            val sObj = obj.optJSONObject("story") ?: JSONObject()

            val enemiesArr = obj.optJSONArray("enemies")
            val enemies = buildList {
                if (enemiesArr != null) {
                    for (i in 0 until enemiesArr.length()) {
                        val e = enemiesArr.getJSONObject(i)
                        add(
                            MinimapEnemyBlip(
                                id = e.optString("id"),
                                x = e.optDouble("x", 0.0).toFloat(),
                                z = e.optDouble("z", 0.0).toFloat(),
                                alive = e.optBoolean("alive", true),
                            )
                        )
                    }
                }
            }

            val civArr = obj.optJSONArray("civilians")
            val civilians = buildList {
                if (civArr != null) {
                    for (i in 0 until civArr.length()) {
                        val c = civArr.getJSONObject(i)
                        add(
                            MinimapCivilianBlip(
                                id = c.optString("id"),
                                x = c.optDouble("x", 0.0).toFloat(),
                                z = c.optDouble("z", 0.0).toFloat(),
                                rescued = c.optBoolean("rescued", false),
                            )
                        )
                    }
                }
            }

            val powersArr = obj.optJSONArray("powers")
            val powers = if (powersArr != null && powersArr.length() > 0) {
                buildList {
                    for (i in 0 until powersArr.length()) {
                        val p = powersArr.getJSONObject(i)
                        add(
                            GuardianPowerInfo(
                                id = p.optString("id"),
                                name = p.optString("name"),
                                description = p.optString("description"),
                                energyCost = p.optInt("energyCost", 30),
                                cooldown = p.optDouble("cooldown", 4.0).toFloat(),
                                damage = p.optInt("damage", 75),
                                unlockChapter = p.optInt("unlockChapter", 1),
                                unlocked = p.optBoolean("unlocked", false),
                            )
                        )
                    }
                }
            } else {
                GuardianPowerInfo.defaultList
            }

            val now = System.currentTimeMillis()
            val dmgArr = obj.optJSONArray("damageNumbers")
            val dmgList = buildList {
                if (dmgArr != null) {
                    for (i in 0 until dmgArr.length()) {
                        val d = dmgArr.getJSONObject(i)
                        add(
                            DamageNumberEvent(
                                id = d.optString("id"),
                                normX = d.optDouble("x", 0.5).toFloat(),
                                normY = d.optDouble("y", 0.5).toFloat(),
                                amount = d.optInt("amount", 0),
                                isPlayerHit = d.optBoolean("isPlayerHit", false),
                                createdAtMs = now,
                            )
                        )
                    }
                }
            }

            val slotIdx = obj.optInt("weaponIndex", 0)
            val slot = WeaponSlot.entries.firstOrNull { it.slotIndex == slotIdx } ?: WeaponSlot.GUARDIAN_SWORD

            val state = LiveGameState(
                playerName = obj.optString("name", "Kael"),
                level = obj.optInt("level", 1),
                hp = obj.optInt("hp", 240),
                maxHp = obj.optInt("maxHp", 240),
                energy = obj.optInt("energy", 100),
                maxEnergy = obj.optInt("maxEnergy", 100),
                stamina = obj.optInt("stamina", 100),
                maxStamina = obj.optInt("maxStamina", 100),
                ultimateCharge = obj.optInt("ultimate", 0),
                potions = obj.optInt("potions", 3),
                ammo = obj.optInt("ammo", 0),
                maxAmmo = obj.optInt("maxAmmo", 0),
                isReloading = obj.optBoolean("isReloading", false),
                reloadProgress = obj.optDouble("reloadProgress", 0.0).toFloat(),
                isAiming = obj.optBoolean("isAiming", false),
                comboStep = obj.optInt("comboStep", 0),
                animState = obj.optString("animState", "idle"),
                perfectBlockActive = obj.optBoolean("perfectBlockActive", false),
                titanShieldActive = obj.optBoolean("titanShieldActive", false),
                guardianModeActive = obj.optBoolean("guardianModeActive", false),
                gold = obj.optInt("gold", 120),
                shards = obj.optInt("shards", 15),
                weaponSlot = slot,
                isBlocking = obj.optBoolean("isBlocking", false),
                isRunning = obj.optBoolean("isRunning", false),
                hasTargetLock = obj.optBoolean("hasTargetLock", false),
                lockedEnemyName = obj.optString("lockedEnemyName", ""),
                nearbyPrompt = obj.optString("nearbyPrompt", ""),
                powers = powers,
                cooldowns = ActionCooldowns(
                    light = cdObj.optDouble("light", 0.0).toFloat(),
                    heavy = cdObj.optDouble("heavy", 0.0).toFloat(),
                    dodge = cdObj.optDouble("dodge", 0.0).toFloat(),
                    special = cdObj.optDouble("special", 0.0).toFloat(),
                    potion = cdObj.optDouble("potion", 0.0).toFloat(),
                ),
                playerX = obj.optDouble("playerX", 0.0).toFloat(),
                playerZ = obj.optDouble("playerZ", 0.0).toFloat(),
                playerYaw = obj.optDouble("playerYaw", 0.0).toFloat(),
                enemies = enemies,
                civilians = civilians,
                templeX = obj.optDouble("templeX", 0.0).toFloat(),
                templeZ = obj.optDouble("templeZ", -46.0).toFloat(),
                artifactCollected = obj.optBoolean("artifactCollected", false),
                zoneId = obj.optString("zoneId", "ZONE_A"),
                zoneName = obj.optString("zoneName", "Zone A · Forest Entrance"),
                weather = obj.optString("weather", "SUNNY"),
                crystalsCollected = obj.optInt("crystalsCollected", 0),
                totalCrystals = obj.optInt("totalCrystals", 6),
                puzzlePillarsActivated = obj.optInt("puzzlePillarsActivated", 0),
                mission = MissionProgress(
                    escapedSettlement = mObj.optBoolean("escapedSettlement", false),
                    civiliansRescued = mObj.optInt("civiliansRescued", 0),
                    cyclopsDefeated = mObj.optInt("cyclopsDefeated", 0),
                    reachedSafeRoute = mObj.optBoolean("reachedSafeRoute", false),
                    ravokDefeated = mObj.optBoolean("ravokDefeated", false),
                ),
                boss = BossHudState(
                    visible = bObj.optBoolean("visible", false),
                    name = bObj.optString("name", "RAVOK, CYCLOPS COMMANDER"),
                    hp = bObj.optInt("hp", 2000),
                    maxHp = bObj.optInt("maxHp", 2000),
                    x = bObj.optDouble("x", 0.0).toFloat(),
                    z = bObj.optDouble("z", -46.0).toFloat(),
                ),
                story = StoryHudState(
                    sceneId = sObj.optString("sceneId", "MENU_ORBIT"),
                    isCutscene = sObj.optBoolean("isCutscene", false),
                    canContinue = sObj.optBoolean("canContinue", false),
                    canSkip = sObj.optBoolean("canSkip", false),
                    speaker = sObj.optString("speaker", ""),
                    speakerRole = sObj.optString("speakerRole", ""),
                    subtitle = sObj.optString("subtitle", ""),
                    blackScreenText = sObj.optString("blackScreenText", ""),
                    chapterCompleted = sObj.optBoolean("chapterCompleted", false),
                ),
            )
            state to dmgList
        }.getOrNull()
    }
}
