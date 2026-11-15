package com.example.data

enum class GraphicsQuality(val jsValue: String, val label: String) {
    LOW("low", "Low"),
    MEDIUM("medium", "Medium"),
    HIGH("high", "High"),
}

enum class ShadowQuality(val jsValue: String, val label: String) {
    OFF("off", "Off"),
    LOW("low", "Low"),
    MEDIUM("medium", "Medium"),
    HIGH("high", "High"),
}

enum class WeatherMode(val jsValue: String, val label: String) {
    SUNNY("SUNNY", "Sunny"),
    CLOUDY("CLOUDY", "Cloudy"),
    RAIN("RAIN", "Rain"),
    THUNDERSTORM("THUNDERSTORM", "Storm"),
    FOG("FOG", "Mist"),
    WINDSTORM("WINDSTORM", "Gale"),
}

enum class HudControlId(val label: String) {
    JOYSTICK("Joystick"),
    RUN("Run"),
    POTION("Potion"),
    ATTACK_CLUSTER("Combat Pad"),
    ULTIMATE("Ultimate"),
    TARGET_LOCK("Target Lock"),
    CAMERA_RESET("Cam Reset"),
}

data class ControlLayoutEntry(
    val offsetX: Float = 0f,
    val offsetY: Float = 0f,
    val enabled: Boolean = true,
)

data class HudLayoutConfig(
    val buttonScale: Float = 1.0f,
    val buttonOpacity: Float = 0.90f,
    val entries: Map<HudControlId, ControlLayoutEntry> =
        HudControlId.entries.associateWith { ControlLayoutEntry() },
) {
    fun entryFor(id: HudControlId): ControlLayoutEntry = entries[id] ?: ControlLayoutEntry()
}

data class GameSettings(
    // Graphics
    val quality: GraphicsQuality = GraphicsQuality.MEDIUM,
    val shadowQuality: ShadowQuality = ShadowQuality.MEDIUM,
    val weatherMode: WeatherMode = WeatherMode.SUNNY,
    val resolutionScale: Float = 1.0f,
    val fogEnabled: Boolean = true,
    // Audio
    val masterVolume: Float = 0.8f,
    val musicVolume: Float = 0.55f,
    val sfxVolume: Float = 0.85f,
    // Camera
    val cameraSensitivity: Float = 1.0f,
    val invertCameraY: Boolean = false,
    val cameraFollowDistance: Float = 7.6f,
    // Controls
    val joystickSensitivity: Float = 1.0f,
    val hudLayout: HudLayoutConfig = HudLayoutConfig(),
    // Gameplay
    val showDamageNumbers: Boolean = true,
    val showMinimap: Boolean = true,
    val aimSensitivity: Float = 1.0f,
    val showFpsCounter: Boolean = true,
)
