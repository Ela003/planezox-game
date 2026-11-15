package com.example.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "shadows_settings"
)

class SettingsRepository(private val context: Context) {

    private object Keys {
        val QUALITY = stringPreferencesKey("graphics_quality")
        val SHADOW_QUALITY = stringPreferencesKey("shadow_quality")
        val WEATHER_MODE = stringPreferencesKey("weather_mode")
        val RESOLUTION_SCALE = floatPreferencesKey("resolution_scale")
        val FOG = booleanPreferencesKey("fog_enabled")

        val MASTER_VOL = floatPreferencesKey("master_volume")
        val MUSIC_VOL = floatPreferencesKey("music_volume")
        val SFX_VOL = floatPreferencesKey("sfx_volume")

        val SENSITIVITY = floatPreferencesKey("camera_sensitivity")
        val INVERT_Y = booleanPreferencesKey("invert_camera_y")
        val FOLLOW_DISTANCE = floatPreferencesKey("camera_follow_distance")

        val JOYSTICK_SENS = floatPreferencesKey("joystick_sensitivity")
        val BUTTON_SCALE = floatPreferencesKey("hud_button_scale")
        val BUTTON_OPACITY = floatPreferencesKey("hud_button_opacity")

        val SHOW_DAMAGE = booleanPreferencesKey("show_damage_numbers")
        val SHOW_MINIMAP = booleanPreferencesKey("show_minimap")
        val AIM_SENS = floatPreferencesKey("aim_sensitivity")
        val SHOW_FPS = booleanPreferencesKey("show_fps_counter")

        fun ctrlX(id: HudControlId) = floatPreferencesKey("ctrl_x_${id.name}")
        fun ctrlY(id: HudControlId) = floatPreferencesKey("ctrl_y_${id.name}")
        fun ctrlEnabled(id: HudControlId) = booleanPreferencesKey("ctrl_en_${id.name}")
    }

    val settingsFlow: Flow<GameSettings> = context.settingsDataStore.data.map { prefs ->
        val quality = runCatching {
            GraphicsQuality.valueOf(prefs[Keys.QUALITY] ?: GraphicsQuality.MEDIUM.name)
        }.getOrDefault(GraphicsQuality.MEDIUM)

        val shadowQuality = runCatching {
            ShadowQuality.valueOf(prefs[Keys.SHADOW_QUALITY] ?: ShadowQuality.MEDIUM.name)
        }.getOrDefault(ShadowQuality.MEDIUM)

        val weatherMode = runCatching {
            WeatherMode.valueOf(prefs[Keys.WEATHER_MODE] ?: WeatherMode.SUNNY.name)
        }.getOrDefault(WeatherMode.SUNNY)

        val entries = HudControlId.entries.associateWith { id ->
            ControlLayoutEntry(
                offsetX = prefs[Keys.ctrlX(id)] ?: 0f,
                offsetY = prefs[Keys.ctrlY(id)] ?: 0f,
                enabled = prefs[Keys.ctrlEnabled(id)] ?: true,
            )
        }

        GameSettings(
            quality = quality,
            shadowQuality = shadowQuality,
            weatherMode = weatherMode,
            resolutionScale = prefs[Keys.RESOLUTION_SCALE] ?: 1.0f,
            fogEnabled = prefs[Keys.FOG] ?: true,
            masterVolume = prefs[Keys.MASTER_VOL] ?: 0.8f,
            musicVolume = prefs[Keys.MUSIC_VOL] ?: 0.55f,
            sfxVolume = prefs[Keys.SFX_VOL] ?: 0.85f,
            cameraSensitivity = prefs[Keys.SENSITIVITY] ?: 1.0f,
            invertCameraY = prefs[Keys.INVERT_Y] ?: false,
            cameraFollowDistance = prefs[Keys.FOLLOW_DISTANCE] ?: 7.6f,
            joystickSensitivity = prefs[Keys.JOYSTICK_SENS] ?: 1.0f,
            hudLayout = HudLayoutConfig(
                buttonScale = prefs[Keys.BUTTON_SCALE] ?: 1.0f,
                buttonOpacity = prefs[Keys.BUTTON_OPACITY] ?: 0.90f,
                entries = entries,
            ),
            showDamageNumbers = prefs[Keys.SHOW_DAMAGE] ?: true,
            showMinimap = prefs[Keys.SHOW_MINIMAP] ?: true,
            aimSensitivity = prefs[Keys.AIM_SENS] ?: 1.0f,
            showFpsCounter = prefs[Keys.SHOW_FPS] ?: true,
        )
    }

    suspend fun setQuality(quality: GraphicsQuality) {
        context.settingsDataStore.edit { it[Keys.QUALITY] = quality.name }
    }

    suspend fun setShadowQuality(shadowQuality: ShadowQuality) {
        context.settingsDataStore.edit { it[Keys.SHADOW_QUALITY] = shadowQuality.name }
    }

    suspend fun setWeatherMode(weatherMode: WeatherMode) {
        context.settingsDataStore.edit { it[Keys.WEATHER_MODE] = weatherMode.name }
    }

    suspend fun setResolutionScale(scale: Float) {
        context.settingsDataStore.edit { it[Keys.RESOLUTION_SCALE] = scale }
    }

    suspend fun setFogEnabled(enabled: Boolean) {
        context.settingsDataStore.edit { it[Keys.FOG] = enabled }
    }

    suspend fun setMasterVolume(vol: Float) {
        context.settingsDataStore.edit { it[Keys.MASTER_VOL] = vol }
    }

    suspend fun setMusicVolume(vol: Float) {
        context.settingsDataStore.edit { it[Keys.MUSIC_VOL] = vol }
    }

    suspend fun setSfxVolume(vol: Float) {
        context.settingsDataStore.edit { it[Keys.SFX_VOL] = vol }
    }

    suspend fun setCameraSensitivity(sensitivity: Float) {
        context.settingsDataStore.edit { it[Keys.SENSITIVITY] = sensitivity }
    }

    suspend fun setInvertCameraY(invert: Boolean) {
        context.settingsDataStore.edit { it[Keys.INVERT_Y] = invert }
    }

    suspend fun setCameraFollowDistance(distance: Float) {
        context.settingsDataStore.edit { it[Keys.FOLLOW_DISTANCE] = distance }
    }

    suspend fun setJoystickSensitivity(sensitivity: Float) {
        context.settingsDataStore.edit { it[Keys.JOYSTICK_SENS] = sensitivity }
    }

    suspend fun setButtonScale(scale: Float) {
        context.settingsDataStore.edit { it[Keys.BUTTON_SCALE] = scale }
    }

    suspend fun setButtonOpacity(opacity: Float) {
        context.settingsDataStore.edit { it[Keys.BUTTON_OPACITY] = opacity }
    }

    suspend fun setControlOffset(id: HudControlId, offsetX: Float, offsetY: Float) {
        context.settingsDataStore.edit {
            it[Keys.ctrlX(id)] = offsetX
            it[Keys.ctrlY(id)] = offsetY
        }
    }

    suspend fun setControlEnabled(id: HudControlId, enabled: Boolean) {
        context.settingsDataStore.edit { it[Keys.ctrlEnabled(id)] = enabled }
    }

    suspend fun resetControlsLayout() {
        context.settingsDataStore.edit { prefs ->
            prefs[Keys.BUTTON_SCALE] = 1.0f
            prefs[Keys.BUTTON_OPACITY] = 0.90f
            prefs[Keys.JOYSTICK_SENS] = 1.0f
            HudControlId.entries.forEach { id ->
                prefs[Keys.ctrlX(id)] = 0f
                prefs[Keys.ctrlY(id)] = 0f
                prefs[Keys.ctrlEnabled(id)] = true
            }
        }
    }

    suspend fun setShowDamageNumbers(show: Boolean) {
        context.settingsDataStore.edit { it[Keys.SHOW_DAMAGE] = show }
    }

    suspend fun setShowMinimap(show: Boolean) {
        context.settingsDataStore.edit { it[Keys.SHOW_MINIMAP] = show }
    }

    suspend fun setAimSensitivity(sensitivity: Float) {
        context.settingsDataStore.edit { it[Keys.AIM_SENS] = sensitivity }
    }

    suspend fun setShowFpsCounter(show: Boolean) {
        context.settingsDataStore.edit { it[Keys.SHOW_FPS] = show }
    }
}
