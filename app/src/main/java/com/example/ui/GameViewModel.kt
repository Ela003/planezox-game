package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.CampaignProgress
import com.example.data.CampaignRepository
import com.example.data.GameSettings
import com.example.data.GraphicsQuality
import com.example.data.HudControlId
import com.example.data.SettingsRepository
import com.example.data.ShadowQuality
import com.example.data.WeatherMode
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class GameScreenState {
    LOADING,
    MAIN_MENU,
    PLAYING,
}

data class GameUiState(
    val screenState: GameScreenState = GameScreenState.LOADING,
    val loadingProgress: Float = 0.05f,
    val loadingMessage: String = "Initializing Warmier...",
    val isSceneReady: Boolean = false,
    val isPaused: Boolean = false,
    val isSettingsOpen: Boolean = false,
    val isInventoryOpen: Boolean = false,
    val isMapExpanded: Boolean = false,
    val isControlsGuideOpen: Boolean = false,
    val isChaptersOpen: Boolean = false,
    val isRadialWeaponMenuOpen: Boolean = false,
    val isPowersMenuOpen: Boolean = false,
    val isCustomizingHud: Boolean = false,
    val isMissionCollapsed: Boolean = false,
    val eventBanner: String? = null,
    val fps: Int = 60,
    val webError: String? = null,
    val liveState: LiveGameState = LiveGameState(),
    val damageNumbers: List<DamageNumberEvent> = emptyList(),
    val settings: GameSettings = GameSettings(),
    val campaign: CampaignProgress = CampaignProgress(),
) {
    val shouldPauseSimulation: Boolean
        get() = isPaused || isSettingsOpen || isInventoryOpen || isMapExpanded || isControlsGuideOpen || isCustomizingHud || isChaptersOpen || isRadialWeaponMenuOpen || isPowersMenuOpen
}

class GameViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = SettingsRepository(application.applicationContext)
    private val campaignRepository = CampaignRepository(application.applicationContext)

    private data class InternalState(
        val screenState: GameScreenState = GameScreenState.LOADING,
        val loadingProgress: Float = 0.05f,
        val loadingMessage: String = "Initializing Warmier...",
        val isSceneReady: Boolean = false,
        val isPaused: Boolean = false,
        val isSettingsOpen: Boolean = false,
        val isInventoryOpen: Boolean = false,
        val isMapExpanded: Boolean = false,
        val isControlsGuideOpen: Boolean = false,
        val isChaptersOpen: Boolean = false,
        val isRadialWeaponMenuOpen: Boolean = false,
        val isPowersMenuOpen: Boolean = false,
        val isCustomizingHud: Boolean = false,
        val isMissionCollapsed: Boolean = false,
        val eventBanner: String? = null,
        val fps: Int = 60,
        val webError: String? = null,
        val liveState: LiveGameState = LiveGameState(),
        val damageNumbers: List<DamageNumberEvent> = emptyList(),
    )

    private val internalState = MutableStateFlow(InternalState())
    private var lastCheckpointScene: String = ""
    private var chapterCompletionPersisted = false

    val uiState: StateFlow<GameUiState> = combine(
        internalState,
        repository.settingsFlow,
        campaignRepository.campaignFlow,
    ) { internal, settings, campaign ->
        GameUiState(
            screenState = internal.screenState,
            loadingProgress = internal.loadingProgress,
            loadingMessage = internal.loadingMessage,
            isSceneReady = internal.isSceneReady,
            isPaused = internal.isPaused,
            isSettingsOpen = internal.isSettingsOpen,
            isInventoryOpen = internal.isInventoryOpen,
            isMapExpanded = internal.isMapExpanded,
            isControlsGuideOpen = internal.isControlsGuideOpen,
            isChaptersOpen = internal.isChaptersOpen,
            isRadialWeaponMenuOpen = internal.isRadialWeaponMenuOpen,
            isPowersMenuOpen = internal.isPowersMenuOpen,
            isCustomizingHud = internal.isCustomizingHud,
            isMissionCollapsed = internal.isMissionCollapsed,
            eventBanner = internal.eventBanner,
            fps = internal.fps,
            webError = internal.webError,
            liveState = internal.liveState,
            damageNumbers = internal.damageNumbers,
            settings = settings,
            campaign = campaign,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = GameUiState(),
    )

    fun onWebLoadProgress(percent: Int, message: String) {
        val clamped = (percent.coerceIn(0, 100)) / 100f
        internalState.update { state ->
            state.copy(
                loadingProgress = maxOf(state.loadingProgress, clamped),
                loadingMessage = message,
            )
        }
    }

    fun onWebSceneReady() {
        viewModelScope.launch {
            internalState.update {
                it.copy(
                    loadingProgress = 1f,
                    loadingMessage = "Warmier Ready",
                    isSceneReady = true,
                )
            }
            delay(400)
            internalState.update { state ->
                if (state.screenState == GameScreenState.LOADING) {
                    state.copy(screenState = GameScreenState.MAIN_MENU)
                } else {
                    state
                }
            }
        }
    }

    fun onWebFpsUpdate(fps: Int) {
        internalState.update { it.copy(fps = fps.coerceIn(0, 240)) }
    }

    fun onHudStateJson(json: String) {
        val parsed = LiveGameState.fromJson(json) ?: return
        val (live, newDmg) = parsed
        val now = System.currentTimeMillis()
        internalState.update { state ->
            val activeDmg = (state.damageNumbers.filter { now - it.createdAtMs < 950 } + newDmg).takeLast(12)
            state.copy(liveState = live, damageNumbers = activeDmg)
        }

        val sceneId = live.story.sceneId
        if ((sceneId == "SCENE_4_GAMEPLAY" || sceneId == "SCENE_5_BOSS_FIGHT") && sceneId != lastCheckpointScene) {
            lastCheckpointScene = sceneId
            viewModelScope.launch {
                campaignRepository.saveCheckpoint(
                    sceneId = sceneId,
                    civiliansRescued = live.mission.civiliansRescued,
                    cyclopsDefeated = live.mission.cyclopsDefeated,
                )
            }
        }

        if (live.story.chapterCompleted && !chapterCompletionPersisted) {
            chapterCompletionPersisted = true
            viewModelScope.launch {
                campaignRepository.markChapter1Completed(
                    civiliansRescued = live.mission.civiliansRescued,
                    cyclopsDefeated = live.mission.cyclopsDefeated,
                )
            }
        }
    }

    fun onGameEvent(eventType: String, message: String) {
        if (message.isBlank()) return
        internalState.update { it.copy(eventBanner = message) }
        viewModelScope.launch {
            delay(if (eventType == "chapter1_complete" || eventType == "boss_fight") 4200L else 2800L)
            internalState.update { state ->
                if (state.eventBanner == message) state.copy(eventBanner = null) else state
            }
        }
    }

    fun onWebError(errorMessage: String) {
        internalState.update {
            it.copy(
                webError = errorMessage,
                loadingMessage = "WebGL Error: $errorMessage",
            )
        }
    }

    fun onNewGameClicked() {
        lastCheckpointScene = ""
        chapterCompletionPersisted = false
        viewModelScope.launch {
            campaignRepository.resetForNewCampaign()
        }
        internalState.update {
            it.copy(
                screenState = GameScreenState.PLAYING,
                isPaused = false,
                isSettingsOpen = false,
                isInventoryOpen = false,
                isMapExpanded = false,
                isControlsGuideOpen = false,
                isChaptersOpen = false,
                isRadialWeaponMenuOpen = false,
                isPowersMenuOpen = false,
                isCustomizingHud = false,
            )
        }
    }

    fun onContinueCampaignClicked() {
        chapterCompletionPersisted = false
        internalState.update {
            it.copy(
                screenState = GameScreenState.PLAYING,
                isPaused = false,
                isSettingsOpen = false,
                isInventoryOpen = false,
                isMapExpanded = false,
                isControlsGuideOpen = false,
                isChaptersOpen = false,
                isRadialWeaponMenuOpen = false,
                isPowersMenuOpen = false,
                isCustomizingHud = false,
            )
        }
    }

    fun onReturnToMainMenu() {
        internalState.update {
            it.copy(
                screenState = GameScreenState.MAIN_MENU,
                isPaused = false,
                isSettingsOpen = false,
                isInventoryOpen = false,
                isMapExpanded = false,
                isControlsGuideOpen = false,
                isChaptersOpen = false,
                isRadialWeaponMenuOpen = false,
                isPowersMenuOpen = false,
                isCustomizingHud = false,
            )
        }
    }

    fun onOpenPauseMenu() = internalState.update { it.copy(isPaused = true) }
    fun onResumeGame() = internalState.update {
        it.copy(
            isPaused = false,
            isSettingsOpen = false,
            isInventoryOpen = false,
            isMapExpanded = false,
            isControlsGuideOpen = false,
            isChaptersOpen = false,
            isRadialWeaponMenuOpen = false,
            isPowersMenuOpen = false,
            isCustomizingHud = false,
        )
    }

    fun onOpenSettings() = internalState.update { it.copy(isSettingsOpen = true) }
    fun onCloseSettings() = internalState.update { it.copy(isSettingsOpen = false) }

    fun onOpenChapters() = internalState.update { it.copy(isChaptersOpen = true) }
    fun onCloseChapters() = internalState.update { it.copy(isChaptersOpen = false) }

    fun onOpenRadialWeaponMenu() = internalState.update { it.copy(isRadialWeaponMenuOpen = true) }
    fun onCloseRadialWeaponMenu() = internalState.update { it.copy(isRadialWeaponMenuOpen = false) }

    fun onOpenPowersMenu() = internalState.update { it.copy(isPowersMenuOpen = true) }
    fun onClosePowersMenu() = internalState.update { it.copy(isPowersMenuOpen = false) }

    fun onOpenInventory() = internalState.update { it.copy(isInventoryOpen = true) }
    fun onCloseInventory() = internalState.update { it.copy(isInventoryOpen = false) }

    fun onOpenMapExpanded() = internalState.update { it.copy(isMapExpanded = true) }
    fun onCloseMapExpanded() = internalState.update { it.copy(isMapExpanded = false) }

    fun onOpenControlsGuide() = internalState.update { it.copy(isControlsGuideOpen = true) }
    fun onCloseControlsGuide() = internalState.update { it.copy(isControlsGuideOpen = false) }

    fun onStartCustomizingHud() = internalState.update {
        it.copy(isCustomizingHud = true, isSettingsOpen = false, isPaused = false)
    }

    fun onFinishCustomizingHud() = internalState.update { it.copy(isCustomizingHud = false) }

    fun onToggleMissionCollapse() = internalState.update {
        it.copy(isMissionCollapsed = !it.isMissionCollapsed)
    }

    // Settings mutations
    fun updateQuality(quality: GraphicsQuality) = viewModelScope.launch { repository.setQuality(quality) }
    fun updateShadowQuality(shadow: ShadowQuality) = viewModelScope.launch { repository.setShadowQuality(shadow) }
    fun updateWeather(weather: WeatherMode) = viewModelScope.launch { repository.setWeatherMode(weather) }
    fun updateResolutionScale(scale: Float) = viewModelScope.launch { repository.setResolutionScale(scale) }
    fun toggleFog(enabled: Boolean) = viewModelScope.launch { repository.setFogEnabled(enabled) }

    fun updateMasterVolume(vol: Float) = viewModelScope.launch { repository.setMasterVolume(vol) }
    fun updateMusicVolume(vol: Float) = viewModelScope.launch { repository.setMusicVolume(vol) }
    fun updateSfxVolume(vol: Float) = viewModelScope.launch { repository.setSfxVolume(vol) }

    fun updateSensitivity(value: Float) = viewModelScope.launch { repository.setCameraSensitivity(value) }
    fun toggleInvertCameraY(invert: Boolean) = viewModelScope.launch { repository.setInvertCameraY(invert) }
    fun updateFollowDistance(dist: Float) = viewModelScope.launch { repository.setCameraFollowDistance(dist) }

    fun updateJoystickSensitivity(value: Float) = viewModelScope.launch { repository.setJoystickSensitivity(value) }
    fun updateButtonScale(scale: Float) = viewModelScope.launch { repository.setButtonScale(scale) }
    fun updateButtonOpacity(opacity: Float) = viewModelScope.launch { repository.setButtonOpacity(opacity) }
    fun updateControlOffset(id: HudControlId, x: Float, y: Float) =
        viewModelScope.launch { repository.setControlOffset(id, x, y) }

    fun toggleControlEnabled(id: HudControlId, enabled: Boolean) =
        viewModelScope.launch { repository.setControlEnabled(id, enabled) }

    fun resetControlsToDefault() = viewModelScope.launch { repository.resetControlsLayout() }

    fun toggleDamageNumbers(show: Boolean) = viewModelScope.launch { repository.setShowDamageNumbers(show) }
    fun toggleShowMinimap(show: Boolean) = viewModelScope.launch { repository.setShowMinimap(show) }
    fun updateAimSensitivity(value: Float) = viewModelScope.launch { repository.setAimSensitivity(value) }
    fun toggleShowFps(show: Boolean) = viewModelScope.launch { repository.setShowFpsCounter(show) }
}
