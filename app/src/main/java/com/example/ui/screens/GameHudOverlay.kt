package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.displayCutoutPadding
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.DirectionsRun
import androidx.compose.material.icons.rounded.DoubleArrow
import androidx.compose.material.icons.rounded.Flare
import androidx.compose.material.icons.rounded.LocalDrink
import androidx.compose.material.icons.rounded.MyLocation
import androidx.compose.material.icons.rounded.PanTool
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.ScreenRotation
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.VerticalAlignTop
import androidx.compose.material.icons.rounded.Whatshot
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.data.GameSettings
import com.example.data.HudControlId
import com.example.ui.DamageNumberEvent
import com.example.ui.LiveGameState
import com.example.ui.WeaponSlot
import com.example.ui.components.AetherGuidancePill
import com.example.ui.components.BossHealthBar
import com.example.ui.components.CameraDragSurface
import com.example.ui.components.Chapter1CompleteOverlay
import com.example.ui.components.CircularMinimap
import com.example.ui.components.CustomizableControlBox
import com.example.ui.components.CutsceneOverlay
import com.example.ui.components.HoldActionButton
import com.example.ui.components.MissionObjectivePanel
import com.example.ui.components.MultiTouchThumbstick
import com.example.ui.components.PlayerStatusBars
import com.example.ui.components.RightEdgeUtilityButtons
import com.example.ui.components.TapActionButton
import com.example.ui.components.TopRightUtilityBar
import com.example.ui.components.UltimateButton
import com.example.ui.components.WeaponSelectorBar
import com.example.ui.components.weaponIconFor
import com.example.ui.theme.CanopySurface
import com.example.ui.theme.CrimsonAlert
import com.example.ui.theme.DeepForestBg
import com.example.ui.theme.ElderGold
import com.example.ui.theme.EmeraldLeaf
import com.example.ui.theme.MistSage
import com.example.ui.theme.SlateBorder
import com.example.ui.theme.SunlitAmber

@Composable
fun GameHudOverlay(
    liveState: LiveGameState,
    settings: GameSettings,
    fps: Int,
    isMissionCollapsed: Boolean,
    isCustomizingHud: Boolean,
    eventBanner: String?,
    damageNumbers: List<DamageNumberEvent>,
    onJoystickMove: (Float, Float) -> Unit,
    onOrbitCamera: (Float, Float) -> Unit,
    onRunHoldChange: (Boolean) -> Unit,
    onJump: () -> Unit,
    onLightAttack: () -> Unit,
    onMainAttackPressStart: () -> Unit = {},
    onMainAttackPressEnd: () -> Unit = {},
    onHeavyAttack: () -> Unit,
    onHeavyPressStart: () -> Unit = {},
    onHeavyPressEnd: () -> Unit = {},
    onDodge: () -> Unit,
    onBlockHoldChange: (Boolean) -> Unit,
    onSpecialPower: () -> Unit,
    onUltimatePower: () -> Unit,
    onToggleAim: () -> Unit,
    onReloadWeapon: () -> Unit,
    onUsePotion: () -> Unit,
    onInteract: () -> Unit,
    onSelectWeapon: (WeaponSlot) -> Unit,
    onOpenRadialWeaponMenu: () -> Unit,
    onOpenPowersMenu: () -> Unit,
    onToggleTargetLock: () -> Unit,
    onResetCamera: () -> Unit,
    onToggleMissionCollapse: () -> Unit,
    onOpenInventory: () -> Unit,
    onExpandMap: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenPause: () -> Unit,
    onUpdateControlOffset: (HudControlId, Float, Float) -> Unit,
    onToggleControlEnabled: (HudControlId, Boolean) -> Unit,
    onUpdateButtonScale: (Float) -> Unit,
    onUpdateButtonOpacity: (Float) -> Unit,
    onResetHudLayout: () -> Unit,
    onFinishCustomizingHud: () -> Unit,
    onContinueCutscene: () -> Unit,
    onSkipCutscene: () -> Unit,
    onReplayChapter1: () -> Unit,
    onReturnToMenu: () -> Unit,
    modifier: Modifier = Modifier,
) {
    BackHandler {
        if (isCustomizingHud) onFinishCustomizingHud() else onOpenPause()
    }

    val layout = settings.hudLayout
    val scale = layout.buttonScale.coerceIn(0.75f, 1.35f)
    val opacity = layout.buttonOpacity.coerceIn(0.4f, 1.0f)
    val isCutscene = liveState.story.isCutscene

    BoxWithConstraints(modifier = modifier.fillMaxSize()) {
        val isPortrait = maxHeight > maxWidth

        // Multitouch camera drag surface behind all HUD buttons (disabled during cutscenes)
        CameraDragSurface(
            enabled = !isCustomizingHud && !isPortrait && !isCutscene,
            onOrbitCamera = onOrbitCamera,
            modifier = Modifier.fillMaxSize(),
        )

        // Low-health crimson warning vignette
        if (liveState.isLowHealth) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(Color.Transparent, CrimsonAlert.copy(alpha = 0.28f)),
                        )
                    ),
            )
        }

        // Floating Damage Numbers
        if (settings.showDamageNumbers) {
            val wPx = constraints.maxWidth.toFloat()
            val hPx = constraints.maxHeight.toFloat()
            damageNumbers.forEach { dmg ->
                val xDp = with(androidx.compose.ui.platform.LocalDensity.current) {
                    (dmg.normX.coerceIn(0.08f, 0.92f) * wPx).toDp()
                }
                val yDp = with(androidx.compose.ui.platform.LocalDensity.current) {
                    (dmg.normY.coerceIn(0.1f, 0.85f) * hPx).toDp()
                }
                Text(
                    text = if (dmg.isPlayerHit) "-${dmg.amount}" else "${dmg.amount}",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                    color = if (dmg.isPlayerHit) CrimsonAlert else SunlitAmber,
                    modifier = Modifier.offset(x = xDp - 16.dp, y = yDp - 24.dp),
                )
            }
        }

        if (isCutscene) {
            if (liveState.story.chapterCompleted) {
                Chapter1CompleteOverlay(
                    mission = liveState.mission,
                    onReplayChapter1 = onReplayChapter1,
                    onReturnToMenu = onReturnToMenu,
                )
            } else {
                CutsceneOverlay(
                    story = liveState.story,
                    onContinue = onContinueCutscene,
                    onSkip = onSkipCutscene,
                )
            }
        }

        // Manual Aim Crosshair Reticle
        if (liveState.isAiming && !isCutscene && !isPortrait) {
            Canvas(
                modifier = Modifier
                    .align(Alignment.Center)
                    .size(44.dp)
                    .testTag("manual_aim_crosshair"),
            ) {
                val c = androidx.compose.ui.geometry.Offset(size.width / 2f, size.height / 2f)
                val r = size.minDimension * 0.36f
                val gap = 5.dp.toPx()
                val arm = 8.dp.toPx()
                val cyan = Color(0xFF38E0FF)
                drawCircle(
                    color = cyan.copy(alpha = 0.85f),
                    radius = r,
                    center = c,
                    style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.6.dp.toPx()),
                )
                drawCircle(color = SunlitAmber, radius = 2.2.dp.toPx(), center = c)
                drawLine(cyan, androidx.compose.ui.geometry.Offset(c.x - gap - arm, c.y), androidx.compose.ui.geometry.Offset(c.x - gap, c.y), 1.6.dp.toPx())
                drawLine(cyan, androidx.compose.ui.geometry.Offset(c.x + gap, c.y), androidx.compose.ui.geometry.Offset(c.x + gap + arm, c.y), 1.6.dp.toPx())
                drawLine(cyan, androidx.compose.ui.geometry.Offset(c.x, c.y - gap - arm), androidx.compose.ui.geometry.Offset(c.x, c.y - gap), 1.6.dp.toPx())
                drawLine(cyan, androidx.compose.ui.geometry.Offset(c.x, c.y + gap), androidx.compose.ui.geometry.Offset(c.x, c.y + gap + arm), 1.6.dp.toPx())
            }
        }

        // Safe-area / Cutout-aware Landscape Gameplay HUD Container (hidden during cutscenes so dialogue never overlaps controls)
        if (!isCutscene) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .displayCutoutPadding()
                .padding(horizontal = 14.dp, vertical = 10.dp),
        ) {
            // ── TOP LEFT: Minimap + Player Status + Mission Panel ──────────────────────
            Column(
                modifier = Modifier.align(Alignment.TopStart),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    if (settings.showMinimap) {
                        CircularMinimap(
                            liveState = liveState,
                            onExpandMap = onExpandMap,
                        )
                    }
                    PlayerStatusBars(liveState = liveState)
                }

                MissionObjectivePanel(
                    liveState = liveState,
                    collapsed = isMissionCollapsed,
                    onToggleCollapse = onToggleMissionCollapse,
                )
            }

            // ── TOP CENTER: Boss Health Bar + AETHER Guidance + Notifications ──────────
            Column(
                modifier = Modifier.align(Alignment.TopCenter),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                if (liveState.boss.visible) {
                    BossHealthBar(boss = liveState.boss)
                } else {
                    Text(
                        text = stringResource(R.string.game_title),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontSize = 12.sp,
                            letterSpacing = 1.6.sp,
                        ),
                        color = SunlitAmber.copy(alpha = 0.9f),
                    )
                }

                if (liveState.story.speakerRole == "AETHER" && liveState.story.subtitle.isNotBlank()) {
                    AetherGuidancePill(message = liveState.story.subtitle)
                }

                if (settings.showFpsCounter) {
                    Text(
                        text = "$fps FPS · ${settings.quality.label}",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                        color = MistSage.copy(alpha = 0.78f),
                        modifier = Modifier
                            .background(DeepForestBg.copy(alpha = 0.55f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                            .testTag("fps_badge"),
                    )
                }

                Text(
                    text = "${liveState.zoneName} · ${settings.weatherMode.label} · ${liveState.crystalsCollected}/${liveState.totalCrystals} Crystals",
                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                    color = Color(0xFF8BEFFF),
                    modifier = Modifier
                        .background(DeepForestBg.copy(alpha = 0.52f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                        .testTag("zone_weather_badge"),
                )

                AnimatedVisibility(visible = liveState.comboStep >= 2 || liveState.perfectBlockActive) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = Color(0xFF0E293D).copy(alpha = 0.88f),
                        border = BorderStroke(
                            1.2.dp,
                            if (liveState.perfectBlockActive) SunlitAmber else Color(0xFF38E0FF),
                        ),
                    ) {
                        Text(
                            text = if (liveState.perfectBlockActive) "PERFECT BLOCK! COUNTER READY" else "COMBO x${liveState.comboStep}",
                            style = MaterialTheme.typography.labelLarge.copy(fontSize = 11.sp, fontWeight = FontWeight.ExtraBold),
                            color = if (liveState.perfectBlockActive) SunlitAmber else Color(0xFF38E0FF),
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                        )
                    }
                }

                AnimatedVisibility(visible = eventBanner != null, enter = fadeIn(), exit = fadeOut()) {
                    if (eventBanner != null) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = CanopySurface.copy(alpha = 0.92f),
                            border = BorderStroke(1.2.dp, SunlitAmber),
                        ) {
                            Text(
                                text = eventBanner,
                                style = MaterialTheme.typography.labelLarge.copy(fontSize = 12.sp),
                                color = SunlitAmber,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                            )
                        }
                    }
                }
            }

            // ── TOP RIGHT: Utility Bar + 5-Slot Weapon Bar + Target Lock / Cam Reset ──
            Column(
                modifier = Modifier.align(Alignment.TopEnd),
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                TopRightUtilityBar(
                    gold = liveState.gold,
                    shards = liveState.shards,
                    onOpenPowers = onOpenPowersMenu,
                    onOpenInventory = onOpenInventory,
                    onOpenMap = onExpandMap,
                    onOpenSettings = onOpenSettings,
                    onOpenPause = onOpenPause,
                )

                WeaponSelectorBar(
                    liveState = liveState,
                    onSelectWeapon = onSelectWeapon,
                    onOpenRadialMenu = onOpenRadialWeaponMenu,
                )

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    val lockEntry = layout.entryFor(HudControlId.TARGET_LOCK)
                    val camEntry = layout.entryFor(HudControlId.CAMERA_RESET)
                    RightEdgeUtilityButtons(
                        hasTargetLock = liveState.hasTargetLock,
                        showTargetLock = lockEntry.enabled || isCustomizingHud,
                        showCameraReset = camEntry.enabled || isCustomizingHud,
                        onToggleTargetLock = onToggleTargetLock,
                        onResetCamera = onResetCamera,
                    )
                }
            }

            // ── BOTTOM LEFT: Run + Multitouch Joystick + Health Potion ─────────────────
            Box(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(start = 6.dp, bottom = 4.dp),
            ) {
                val joyEntry = layout.entryFor(HudControlId.JOYSTICK)
                CustomizableControlBox(
                    entry = joyEntry,
                    opacity = opacity,
                    isCustomizing = isCustomizingHud,
                    label = "Joystick",
                    onOffsetDrag = { dx, dy ->
                        onUpdateControlOffset(HudControlId.JOYSTICK, joyEntry.offsetX + dx, joyEntry.offsetY + dy)
                    },
                    modifier = Modifier.padding(start = 20.dp, top = 36.dp, end = 52.dp),
                ) {
                    MultiTouchThumbstick(
                        size = (126 * scale).dp,
                        onMove = onJoystickMove,
                        modifier = Modifier.testTag("virtual_thumbstick"),
                    )
                }

                // Hold-to-Run button positioned upper-left of joystick
                val runEntry = layout.entryFor(HudControlId.RUN)
                CustomizableControlBox(
                    entry = runEntry,
                    opacity = opacity,
                    isCustomizing = isCustomizingHud,
                    label = "Run",
                    onOffsetDrag = { dx, dy ->
                        onUpdateControlOffset(HudControlId.RUN, runEntry.offsetX + dx, runEntry.offsetY + dy)
                    },
                    modifier = Modifier.align(Alignment.TopStart),
                ) {
                    HoldActionButton(
                        icon = Icons.Rounded.DirectionsRun,
                        contentDescription = "Hold to Run",
                        size = (46 * scale).dp,
                        isActive = liveState.isRunning,
                        onHoldChange = onRunHoldChange,
                        modifier = Modifier.testTag("run_button"),
                    )
                }

                // Health Potion button bottom-right beside joystick
                val potionEntry = layout.entryFor(HudControlId.POTION)
                CustomizableControlBox(
                    entry = potionEntry,
                    opacity = opacity,
                    isCustomizing = isCustomizingHud,
                    label = "Potion",
                    onOffsetDrag = { dx, dy ->
                        onUpdateControlOffset(HudControlId.POTION, potionEntry.offsetX + dx, potionEntry.offsetY + dy)
                    },
                    modifier = Modifier.align(Alignment.BottomEnd),
                ) {
                    TapActionButton(
                        icon = Icons.Rounded.LocalDrink,
                        contentDescription = "Health Potion",
                        size = (48 * scale).dp,
                        accentColor = Color(0xFFE5534B),
                        cooldownSeconds = liveState.cooldowns.potion,
                        maxCooldown = 3.5f,
                        badgeText = "${liveState.potions}",
                        onTap = onUsePotion,
                        modifier = Modifier.testTag("potion_button"),
                    )
                }
            }

            // ── BOTTOM CENTER: Contextual Interact Banner + Ultimate Power Button ──────
            Column(
                modifier = Modifier.align(Alignment.BottomCenter),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                if (liveState.nearbyPrompt.isNotBlank()) {
                    Surface(
                        onClick = onInteract,
                        shape = RoundedCornerShape(14.dp),
                        color = CanopySurface.copy(alpha = 0.88f),
                        border = BorderStroke(1.2.dp, SunlitAmber),
                    ) {
                        Text(
                            text = "Tap Interact: ${liveState.nearbyPrompt}",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = SunlitAmber,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                        )
                    }
                }

                val ultEntry = layout.entryFor(HudControlId.ULTIMATE)
                CustomizableControlBox(
                    entry = ultEntry,
                    opacity = opacity,
                    isCustomizing = isCustomizingHud,
                    label = "Ultimate",
                    onOffsetDrag = { dx, dy ->
                        onUpdateControlOffset(HudControlId.ULTIMATE, ultEntry.offsetX + dx, ultEntry.offsetY + dy)
                    },
                ) {
                    UltimateButton(
                        icon = Icons.Rounded.AutoAwesome,
                        chargePercent = liveState.ultimateCharge,
                        size = (52 * scale).dp,
                        onActivate = onUltimatePower,
                        modifier = Modifier.testTag("ultimate_button"),
                    )
                }
            }

            // ── BOTTOM RIGHT: Radial Combat Action Cluster ─────────────────────────────
            val combatEntry = layout.entryFor(HudControlId.ATTACK_CLUSTER)
            CustomizableControlBox(
                entry = combatEntry,
                opacity = opacity,
                isCustomizing = isCustomizingHud,
                label = "Combat Pad",
                onOffsetDrag = { dx, dy ->
                    onUpdateControlOffset(
                        HudControlId.ATTACK_CLUSTER,
                        combatEntry.offsetX + dx,
                        combatEntry.offsetY + dy,
                    )
                },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 6.dp, bottom = 4.dp),
            ) {
                Box(modifier = Modifier.size((246 * scale).dp, (198 * scale).dp)) {
                    // Main Attack (Large circular sword/weapon button — hold for ranged auto-fire)
                    TapActionButton(
                        icon = weaponIconFor(liveState.weaponSlot),
                        contentDescription = "Main Attack",
                        size = (76 * scale).dp,
                        accentColor = SunlitAmber,
                        cooldownSeconds = liveState.cooldowns.light,
                        maxCooldown = 0.45f,
                        highlighted = true,
                        onTap = onLightAttack,
                        onPressStart = {
                            if (liveState.weaponSlot.isRanged) {
                                onLightAttack()
                                onMainAttackPressStart()
                            }
                        },
                        onPressEnd = { wasValidRelease ->
                            onMainAttackPressEnd()
                            if (wasValidRelease && !liveState.weaponSlot.isRanged) {
                                onLightAttack()
                            }
                        },
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .offset(x = (16 * scale).dp, y = (-26 * scale).dp)
                            .testTag("main_attack_button"),
                    )

                    // Heavy Attack (upper-left of Main Attack — tap or hold to charge Quantum Axe)
                    TapActionButton(
                        icon = Icons.Rounded.Whatshot,
                        contentDescription = "Heavy Attack",
                        size = (48 * scale).dp,
                        accentColor = Color(0xFFFF8C3B),
                        cooldownSeconds = liveState.cooldowns.heavy,
                        maxCooldown = 1.85f,
                        onTap = onHeavyAttack,
                        onPressStart = onHeavyPressStart,
                        onPressEnd = { onHeavyPressEnd() },
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .offset(x = (-22 * scale).dp, y = (24 * scale).dp)
                            .testTag("heavy_attack_button"),
                    )

                    // Special Power (top arc, glowing cyan - Energy Strike)
                    TapActionButton(
                        icon = Icons.Rounded.Flare,
                        contentDescription = "Special Power",
                        size = (48 * scale).dp,
                        accentColor = Color(0xFF42B9FF),
                        cooldownSeconds = liveState.cooldowns.special,
                        maxCooldown = 4.0f,
                        onTap = onSpecialPower,
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .offset(x = (32 * scale).dp, y = (2 * scale).dp)
                            .testTag("special_power_button"),
                    )

                    // Jump Button (upper-right arc)
                    TapActionButton(
                        icon = Icons.Rounded.VerticalAlignTop,
                        contentDescription = "Jump",
                        size = (48 * scale).dp,
                        accentColor = EmeraldLeaf,
                        onTap = onJump,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .offset(y = (32 * scale).dp)
                            .testTag("jump_button"),
                    )

                    // Aim Toggle Button (far-left upper)
                    TapActionButton(
                        icon = Icons.Rounded.MyLocation,
                        contentDescription = "Manual Aim",
                        size = (46 * scale).dp,
                        accentColor = if (liveState.isAiming) Color(0xFF38E0FF) else MistSage,
                        highlighted = liveState.isAiming,
                        onTap = onToggleAim,
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .offset(y = (20 * scale).dp)
                            .testTag("aim_button"),
                    )

                    // Contextual Reload Button when ranged weapon is equipped
                    if (liveState.weaponSlot.isRanged) {
                        TapActionButton(
                            icon = Icons.Rounded.Refresh,
                            contentDescription = "Reload Weapon",
                            size = (46 * scale).dp,
                            accentColor = Color(0xFF38E0FF),
                            badgeText = if (liveState.isReloading) "..." else "${liveState.ammo}",
                            highlighted = liveState.ammo == 0 || liveState.isReloading,
                            onTap = onReloadWeapon,
                            modifier = Modifier
                                .align(Alignment.TopStart)
                                .offset(x = (4 * scale).dp, y = (-26 * scale).dp)
                                .testTag("reload_button"),
                        )
                    }

                    // Hold-to-Block Shield Button (left of Main Attack)
                    HoldActionButton(
                        icon = Icons.Rounded.Shield,
                        contentDescription = "Hold to Block",
                        size = (48 * scale).dp,
                        isActive = liveState.isBlocking,
                        accentColor = if (liveState.perfectBlockActive) SunlitAmber else Color(0xFF42B9FF),
                        onHoldChange = onBlockHoldChange,
                        modifier = Modifier
                            .align(Alignment.CenterStart)
                            .offset(y = (16 * scale).dp)
                            .testTag("block_button"),
                    )

                    // Dodge Roll Button (bottom-left of Main Attack)
                    TapActionButton(
                        icon = Icons.Rounded.DoubleArrow,
                        contentDescription = "Dodge Roll",
                        size = (48 * scale).dp,
                        accentColor = MistSage,
                        cooldownSeconds = liveState.cooldowns.dodge,
                        maxCooldown = 1.05f,
                        onTap = onDodge,
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .offset(x = (18 * scale).dp)
                            .testTag("dodge_button"),
                    )

                    // Contextual Interaction Button (bottom-right)
                    TapActionButton(
                        icon = Icons.Rounded.PanTool,
                        contentDescription = "Interact",
                        size = (48 * scale).dp,
                        accentColor = if (liveState.nearbyPrompt.isNotBlank()) SunlitAmber else MistSage,
                        highlighted = liveState.nearbyPrompt.isNotBlank(),
                        onTap = onInteract,
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .testTag("interact_button"),
                    )
                }
            }

            // ── HUD Customization Floating Bar ─────────────────────────────────────────
            if (isCustomizingHud) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = CanopySurface.copy(alpha = 0.94f),
                    border = BorderStroke(1.2.dp, SunlitAmber),
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 42.dp),
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text(
                            text = "HUD CUSTOMIZATION — Drag highlighted controls to move",
                            style = MaterialTheme.typography.labelLarge.copy(fontSize = 11.sp),
                            color = SunlitAmber,
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.width(140.dp)) {
                                Text("Button Size: ${(scale * 100).toInt()}%", style = MaterialTheme.typography.labelSmall, color = MistSage)
                                Slider(
                                    value = layout.buttonScale,
                                    onValueChange = onUpdateButtonScale,
                                    valueRange = 0.75f..1.35f,
                                )
                            }
                            Column(modifier = Modifier.width(140.dp)) {
                                Text("Opacity: ${(opacity * 100).toInt()}%", style = MaterialTheme.typography.labelSmall, color = MistSage)
                                Slider(
                                    value = layout.buttonOpacity,
                                    onValueChange = onUpdateButtonOpacity,
                                    valueRange = 0.4f..1.0f,
                                )
                            }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf(HudControlId.RUN, HudControlId.POTION, HudControlId.ULTIMATE, HudControlId.TARGET_LOCK, HudControlId.CAMERA_RESET).forEach { id ->
                                val en = layout.entryFor(id).enabled
                                FilterChip(
                                    selected = en,
                                    onClick = { onToggleControlEnabled(id, !en) },
                                    label = { Text(id.label, fontSize = 10.sp) },
                                )
                            }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedButton(onClick = onResetHudLayout) {
                                Text("Reset Default")
                            }
                            Button(
                                onClick = onFinishCustomizingHud,
                                colors = ButtonDefaults.buttonColors(containerColor = ElderGold, contentColor = DeepForestBg),
                            ) {
                                Text("Save & Done")
                            }
                        }
                    }
                }
            }
        }
        } // end if (!isCutscene)

        // Portrait Mode Rotate-Device Overlay
        if (isPortrait) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(DeepForestBg.copy(alpha = 0.96f))
                    .padding(32.dp)
                    .testTag("rotate_device_overlay"),
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    Icon(
                        imageVector = Icons.Rounded.ScreenRotation,
                        contentDescription = "Rotate device to landscape",
                        tint = SunlitAmber,
                        modifier = Modifier.size(64.dp),
                    )
                    Text(
                        text = "ROTATE TO LANDSCAPE",
                        style = MaterialTheme.typography.headlineMedium,
                        color = SunlitAmber,
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        text = "Warmier: The Rise of the Cyclops is optimized for 16:9 horizontal gameplay. Please rotate your device.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MistSage,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }
    }
}
