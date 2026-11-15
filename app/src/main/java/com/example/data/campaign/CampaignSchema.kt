package com.example.data.campaign

/**
 * Core architecture & persistence schema for the 10-chapter campaign of
 * WARMIER: THE RISE OF THE CYCLOPS.
 *
 * Phase 1 additive schema — existing Ch.1 gameplay files remain unmodified until
 * the architecture review is approved.
 */

enum class MissionType {
    MAIN_STORY,
    EXPLORATION,
    COMBAT,
    BOSS,
    COLLECTION,
    PUZZLE,
}

enum class CharacterFaction {
    HERO,
    ANCIENT_AI,
    GUARDIANS_OF_ETERNITY,
    CYCLOPS_EMPIRE,
    WARMIER_CIVILIAN,
}

enum class CharacterRole {
    PLAYABLE_PROTAGONIST,
    MAIN_ANTAGONIST,
    ALLY_MENTOR_AI,
    CHAPTER_BOSS,
    ELITE_ENEMY,
    STANDARD_ENEMY,
    ANCIENT_GUARDIAN,
    CIVILIAN_NPC,
}

enum class CinematicCameraShotType {
    WIDE_ESTABLISHING,
    CLOSE_UP,
    OVER_THE_SHOULDER,
    TRACKING,
    CRANE_AERIAL,
    DRAMATIC_REVEAL,
    BOSS_INTRODUCTION,
}

enum class RenderAssetStatus {
    PROCEDURAL_PLACEHOLDER,
    GLB_REQUIRED,
}

data class AssetPipelineSpec(
    val modelPath: String,
    val status: RenderAssetStatus,
    val currentPlaceholderDescription: String,
    val requiredAnimations: List<String> = emptyList(),
    val pbrTextureMaps: List<String> = listOf("albedo", "normal", "roughness", "metalness"),
)

data class CharacterDefinition(
    val id: String,
    val name: String,
    val title: String,
    val faction: CharacterFaction,
    val role: CharacterRole,
    val ageOrEra: String,
    val description: String,
    val combatStyle: String,
    val baseHp: Int,
    val moveSpeed: Float,
    val scaleMultiplier: Float,
    val primaryColorHex: String,
    val accentColorHex: String,
    val voiceProfile: String,
    val debutChapter: Int,
    val assetSpec: AssetPipelineSpec,
)

data class WeaponUpgradeTier(
    val level: Int,
    val damageMultiplier: Float,
    val energyEfficiencyBonus: Float,
    val goldCost: Int,
    val fragmentShardsCost: Int,
)

data class WeaponDefinition(
    val slotIndex: Int,
    val id: String,
    val name: String,
    val shortName: String,
    val isRanged: Boolean,
    val lightDamage: Int,
    val heavyDamage: Int,
    val projectileDamage: Int,
    val attackSpeed: Float,
    val rangeMeters: Float,
    val maxAmmo: Int,
    val reloadSeconds: Float,
    val comboHits: Int,
    val specialMoves: List<String>,
    val unlockChapter: Int,
    val accentHex: String,
    val upgradeTiers: List<WeaponUpgradeTier>,
    val assetSpec: AssetPipelineSpec,
)

data class PowerUpgradeSpec(
    val maxRank: Int,
    val damagePerRankBonus: Float,
    val cooldownReductionPerRank: Float,
    val shardsCostPerRank: Int,
)

data class PowerDefinition(
    val id: String,
    val name: String,
    val description: String,
    val isUltimateCombinedAbility: Boolean,
    val unlockChapter: Int,
    val unlockLocation: String,
    val energyCost: Int,
    val cooldownSeconds: Float,
    val baseDamage: Int,
    val activeDurationSeconds: Float,
    val energyDrainPerSecond: Float,
    val colorHex: String,
    val upgradeSpec: PowerUpgradeSpec,
)

data class MissionObjectiveSpec(
    val id: String,
    val description: String,
    val targetCount: Int,
    val triggerZoneId: String? = null,
)

data class MissionRewardSpec(
    val rewardKey: String,
    val xp: Int,
    val gold: Int,
    val shards: Int,
    val unlockedPowerId: String? = null,
    val unlockedWeaponId: String? = null,
    val storyFragmentId: String? = null,
)

data class MissionDefinition(
    val id: String,
    val chapterNumber: Int,
    val orderIndex: Int,
    val title: String,
    val type: MissionType,
    val summary: String,
    val objectives: List<MissionObjectiveSpec>,
    val reward: MissionRewardSpec,
    val nextMissionId: String?,
)

data class ChapterZoneSpec(
    val zoneId: String,
    val name: String,
    val category: String,
    val streamingBundleId: String,
)

data class ChapterDefinition(
    val chapterNumber: Int,
    val id: String,
    val title: String,
    val biome: String,
    val environmentSummary: String,
    val storySummary: String,
    val zones: List<ChapterZoneSpec>,
    val fragmentId: String?,
    val fragmentName: String?,
    val enemyRosterIds: List<String>,
    val bossId: String?,
    val bossName: String?,
    val unlockedPowerIds: List<String>,
    val flashbackTrigger: String?,
    val cutsceneIds: List<String>,
    val missionIds: List<String>,
    val nextChapterId: String?,
    val environmentAssetSpec: AssetPipelineSpec,
)

data class DialogueCue(
    val id: String,
    val speakerId: String,
    val speakerName: String,
    val speakerRole: String,
    val subtitle: String,
    val durationSeconds: Float,
    val lipSyncPreset: String,
    val audioCueId: String,
)

data class CameraBeat(
    val id: String,
    val shotType: CinematicCameraShotType,
    val startSecond: Float,
    val durationSeconds: Float,
    val targetFocus: String,
    val slowMotionScale: Float = 1.0f,
    val particleCue: String? = null,
    val transitionType: String = "SMOOTH_BLEND",
)

data class CinematicSequenceDefinition(
    val id: String,
    val chapterNumber: Int,
    val title: String,
    val locksPlayerControls: Boolean,
    val allowSkip: Boolean,
    val allowContinue: Boolean,
    val cameraBeats: List<CameraBeat>,
    val dialogueCues: List<DialogueCue>,
    val nextSequenceOrGameplayState: String,
)

/**
 * Target DataStore/JSON persistence schema for 10-chapter save/load, checkpoint recovery,
 * and duplicate-reward prevention.
 */
data class CampaignSaveSchema(
    val schemaVersion: Int = 2,
    val activeChapterNumber: Int = 1,
    val activeMissionId: String = "CH01_M01",
    val activeCheckpointId: String = "CH01_SETTLEMENT_SPAWN",
    val unlockedChapterNumbers: Set<Int> = setOf(1),
    val completedChapterNumbers: Set<Int> = emptySet(),
    val completedMissionIds: Set<String> = emptySet(),
    val claimedRewardKeys: Set<String> = emptySet(),
    val collectedFragmentIds: Set<String> = emptySet(),
    val unlockedPowerIds: Set<String> = emptySet(),
    val weaponUpgradeLevels: Map<String, Int> = emptyMap(),
    val powerUpgradeRanks: Map<String, Int> = emptyMap(),
    val playerLevel: Int = 1,
    val playerXp: Int = 0,
    val gold: Int = 120,
    val shards: Int = 15,
    val lastSavedEpochMs: Long = 0L,
)
