package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.GameScreenState
import com.example.ui.GameViewModel
import com.example.ui.components.ChaptersModal
import com.example.ui.components.ExpandedMapDialog
import com.example.ui.components.GameBridgeController
import com.example.ui.components.GameWebView
import com.example.ui.components.GuardianPowersOverlay
import com.example.ui.components.RadialWeaponSelectionOverlay
import com.example.ui.screens.ControlsGuideOverlay
import com.example.ui.screens.GameHudOverlay
import com.example.ui.screens.InventoryOverlay
import com.example.ui.screens.LoadingScreen
import com.example.ui.screens.MainMenuScreen
import com.example.ui.screens.PauseMenuOverlay
import com.example.ui.screens.SettingsOverlay
import com.example.ui.theme.ShadowsOfTheAncientsTheme

class MainActivity : ComponentActivity() {

    private val viewModel: GameViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        configureImmersiveLandscape()
        setContent {
            ShadowsOfTheAncientsTheme {
                ShadowsOfTheAncientsApp(viewModel = viewModel)
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) configureImmersiveLandscape()
    }

    private fun configureImmersiveLandscape() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }
}

@Composable
fun ShadowsOfTheAncientsApp(viewModel: GameViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var bridgeController by remember { mutableStateOf<GameBridgeController?>(null) }

    Box(modifier = Modifier.fillMaxSize()) {
        // Real 3D Three.js + WebGL World Viewport
        GameWebView(
            screenState = uiState.screenState,
            isSimulationPaused = uiState.shouldPauseSimulation,
            settings = uiState.settings,
            isSceneReady = uiState.isSceneReady,
            onProgress = viewModel::onWebLoadProgress,
            onSceneReady = viewModel::onWebSceneReady,
            onFpsUpdate = viewModel::onWebFpsUpdate,
            onHudState = viewModel::onHudStateJson,
            onGameEvent = viewModel::onGameEvent,
            onWebError = viewModel::onWebError,
            onControllerReady = { bridgeController = it },
            modifier = Modifier.fillMaxSize(),
        )

        // In-Game Landscape Mobile Action-Adventure HUD
        AnimatedVisibility(
            visible = uiState.screenState == GameScreenState.PLAYING,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            GameHudOverlay(
                liveState = uiState.liveState,
                settings = uiState.settings,
                fps = uiState.fps,
                isMissionCollapsed = uiState.isMissionCollapsed,
                isCustomizingHud = uiState.isCustomizingHud,
                eventBanner = uiState.eventBanner,
                damageNumbers = uiState.damageNumbers,
                onJoystickMove = { x, y -> bridgeController?.setJoystickInput(x, y) },
                onOrbitCamera = { dx, dy -> bridgeController?.orbitCamera(dx, dy) },
                onRunHoldChange = { running -> bridgeController?.setRunning(running) },
                onJump = { bridgeController?.jump() },
                onLightAttack = { bridgeController?.lightAttack() },
                onMainAttackPressStart = { bridgeController?.setAutoFire(true) },
                onMainAttackPressEnd = { bridgeController?.setAutoFire(false) },
                onHeavyAttack = { bridgeController?.heavyAttack() },
                onHeavyPressStart = { bridgeController?.startHeavyCharge() },
                onHeavyPressEnd = { bridgeController?.releaseHeavyCharge() },
                onDodge = { bridgeController?.dodge() },
                onBlockHoldChange = { blocking -> bridgeController?.setBlocking(blocking) },
                onSpecialPower = { bridgeController?.specialPower() },
                onUltimatePower = { bridgeController?.ultimatePower() },
                onToggleAim = { bridgeController?.toggleAim() },
                onReloadWeapon = { bridgeController?.reloadWeapon() },
                onUsePotion = { bridgeController?.usePotion() },
                onInteract = { bridgeController?.interact() },
                onSelectWeapon = { slot -> bridgeController?.switchWeapon(slot.slotIndex) },
                onOpenRadialWeaponMenu = viewModel::onOpenRadialWeaponMenu,
                onOpenPowersMenu = viewModel::onOpenPowersMenu,
                onToggleTargetLock = { bridgeController?.toggleTargetLock() },
                onResetCamera = { bridgeController?.resetCamera() },
                onToggleMissionCollapse = viewModel::onToggleMissionCollapse,
                onOpenInventory = viewModel::onOpenInventory,
                onExpandMap = viewModel::onOpenMapExpanded,
                onOpenSettings = viewModel::onOpenSettings,
                onOpenPause = viewModel::onOpenPauseMenu,
                onUpdateControlOffset = viewModel::updateControlOffset,
                onToggleControlEnabled = viewModel::toggleControlEnabled,
                onUpdateButtonScale = viewModel::updateButtonScale,
                onUpdateButtonOpacity = viewModel::updateButtonOpacity,
                onResetHudLayout = viewModel::resetControlsToDefault,
                onFinishCustomizingHud = viewModel::onFinishCustomizingHud,
                onContinueCutscene = { bridgeController?.continueCutscene() },
                onSkipCutscene = { bridgeController?.skipCutscene() },
                onReplayChapter1 = {
                    viewModel.onNewGameClicked()
                    bridgeController?.startChapter1("SCENE_1_INTRO")
                },
                onReturnToMenu = viewModel::onReturnToMainMenu,
            )
        }

        // Main Menu Overlay over the live orbiting 3D forest
        AnimatedVisibility(
            visible = uiState.screenState == GameScreenState.MAIN_MENU && !uiState.isSettingsOpen && !uiState.isChaptersOpen,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            MainMenuScreen(
                campaign = uiState.campaign,
                onNewGameClick = {
                    viewModel.onNewGameClicked()
                    bridgeController?.startChapter1("SCENE_1_INTRO")
                },
                onContinueClick = {
                    val savedScene = uiState.campaign.savedSceneId.ifBlank { "SCENE_4_GAMEPLAY" }
                    viewModel.onContinueCampaignClicked()
                    bridgeController?.startChapter1(savedScene)
                },
                onChaptersClick = viewModel::onOpenChapters,
                onSettingsClick = viewModel::onOpenSettings,
            )
        }

        // Chapters Modal
        AnimatedVisibility(
            visible = uiState.isChaptersOpen,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            ChaptersModal(
                campaign = uiState.campaign,
                onPlayChapter1 = {
                    viewModel.onNewGameClicked()
                    bridgeController?.startChapter1("SCENE_1_INTRO")
                },
                onContinueCheckpoint = {
                    val savedScene = uiState.campaign.savedSceneId.ifBlank { "SCENE_4_GAMEPLAY" }
                    viewModel.onContinueCampaignClicked()
                    bridgeController?.startChapter1(savedScene)
                },
                onDismiss = viewModel::onCloseChapters,
            )
        }

        // Pause Menu Modal
        AnimatedVisibility(
            visible = uiState.screenState == GameScreenState.PLAYING &&
                uiState.isPaused &&
                !uiState.isSettingsOpen &&
                !uiState.isInventoryOpen &&
                !uiState.isMapExpanded &&
                !uiState.isControlsGuideOpen,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            PauseMenuOverlay(
                onResume = viewModel::onResumeGame,
                onRestartCheckpoint = {
                    val checkpoint = uiState.campaign.savedSceneId.ifBlank { "SCENE_1_INTRO" }
                    bridgeController?.startChapter1(checkpoint)
                    viewModel.onResumeGame()
                },
                onOpenInventory = viewModel::onOpenInventory,
                onOpenSettings = viewModel::onOpenSettings,
                onOpenControlsGuide = viewModel::onOpenControlsGuide,
                onReturnToMainMenu = viewModel::onReturnToMainMenu,
            )
        }

        // Futuristic Radial Weapon Selection Overlay
        AnimatedVisibility(
            visible = uiState.isRadialWeaponMenuOpen,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            RadialWeaponSelectionOverlay(
                liveState = uiState.liveState,
                onSelectWeapon = { slot -> bridgeController?.switchWeapon(slot.slotIndex) },
                onDismiss = viewModel::onCloseRadialWeaponMenu,
            )
        }

        // Modular 7-Power Guardian Matrix Overlay
        AnimatedVisibility(
            visible = uiState.isPowersMenuOpen,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            GuardianPowersOverlay(
                liveState = uiState.liveState,
                onActivatePower = { power -> bridgeController?.activatePower(power.id) },
                onDismiss = viewModel::onClosePowersMenu,
            )
        }

        // Inventory Modal
        AnimatedVisibility(
            visible = uiState.isInventoryOpen,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            InventoryOverlay(
                liveState = uiState.liveState,
                onSelectWeapon = { slot -> bridgeController?.switchWeapon(slot.slotIndex) },
                onUsePotion = { bridgeController?.usePotion() },
                onDismiss = viewModel::onCloseInventory,
            )
        }

        // Expanded Tactical Forest Map Modal
        AnimatedVisibility(
            visible = uiState.isMapExpanded,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            ExpandedMapDialog(
                liveState = uiState.liveState,
                onDismiss = viewModel::onCloseMapExpanded,
            )
        }

        // Controls Guide Modal
        AnimatedVisibility(
            visible = uiState.isControlsGuideOpen,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            ControlsGuideOverlay(
                onCustomizeHud = viewModel::onStartCustomizingHud,
                onDismiss = viewModel::onCloseControlsGuide,
            )
        }

        // Settings Modal
        AnimatedVisibility(
            visible = uiState.isSettingsOpen,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            SettingsOverlay(
                settings = uiState.settings,
                canCustomizeHud = uiState.screenState == GameScreenState.PLAYING,
                onQualityChange = viewModel::updateQuality,
                onShadowQualityChange = viewModel::updateShadowQuality,
                onWeatherChange = viewModel::updateWeather,
                onResolutionScaleChange = viewModel::updateResolutionScale,
                onFogToggle = viewModel::toggleFog,
                onMasterVolChange = viewModel::updateMasterVolume,
                onMusicVolChange = viewModel::updateMusicVolume,
                onSfxVolChange = viewModel::updateSfxVolume,
                onSensitivityChange = viewModel::updateSensitivity,
                onInvertYToggle = viewModel::toggleInvertCameraY,
                onFollowDistanceChange = viewModel::updateFollowDistance,
                onJoystickSensChange = viewModel::updateJoystickSensitivity,
                onButtonScaleChange = viewModel::updateButtonScale,
                onButtonOpacityChange = viewModel::updateButtonOpacity,
                onCustomizeHudClick = viewModel::onStartCustomizingHud,
                onResetControlsClick = viewModel::resetControlsToDefault,
                onDamageNumbersToggle = viewModel::toggleDamageNumbers,
                onShowMinimapToggle = viewModel::toggleShowMinimap,
                onAimSensChange = viewModel::updateAimSensitivity,
                onShowFpsToggle = viewModel::toggleShowFps,
                onDismiss = viewModel::onCloseSettings,
            )
        }

        // Atmospheric Loading Screen
        AnimatedVisibility(
            visible = uiState.screenState == GameScreenState.LOADING,
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            LoadingScreen(
                progress = uiState.loadingProgress,
                statusMessage = uiState.loadingMessage,
                webError = uiState.webError,
            )
        }
    }
}
