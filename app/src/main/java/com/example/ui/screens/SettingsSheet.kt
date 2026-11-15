package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.data.GameSettings
import com.example.data.GraphicsQuality
import com.example.data.ShadowQuality
import com.example.data.WeatherMode
import com.example.ui.theme.CanopySurface
import com.example.ui.theme.DeepForestBg
import com.example.ui.theme.ElderGold
import com.example.ui.theme.MistSage
import com.example.ui.theme.MossCard
import com.example.ui.theme.MutedMoss
import com.example.ui.theme.SlateBorder
import com.example.ui.theme.SunlitAmber
import kotlin.math.roundToInt

@Composable
fun SettingsOverlay(
    settings: GameSettings,
    canCustomizeHud: Boolean,
    onQualityChange: (GraphicsQuality) -> Unit,
    onShadowQualityChange: (ShadowQuality) -> Unit,
    onWeatherChange: (WeatherMode) -> Unit = {},
    onResolutionScaleChange: (Float) -> Unit,
    onFogToggle: (Boolean) -> Unit,
    onMasterVolChange: (Float) -> Unit,
    onMusicVolChange: (Float) -> Unit,
    onSfxVolChange: (Float) -> Unit,
    onSensitivityChange: (Float) -> Unit,
    onInvertYToggle: (Boolean) -> Unit,
    onFollowDistanceChange: (Float) -> Unit,
    onJoystickSensChange: (Float) -> Unit,
    onButtonScaleChange: (Float) -> Unit,
    onButtonOpacityChange: (Float) -> Unit,
    onCustomizeHudClick: () -> Unit,
    onResetControlsClick: () -> Unit,
    onDamageNumbersToggle: (Boolean) -> Unit,
    onShowMinimapToggle: (Boolean) -> Unit,
    onAimSensChange: (Float) -> Unit,
    onShowFpsToggle: (Boolean) -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    BackHandler(onBack = onDismiss)

    val tabs = listOf("Graphics", "Audio", "Camera", "Controls", "Gameplay")
    var selectedTab by remember { mutableIntStateOf(0) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(DeepForestBg.copy(alpha = 0.78f))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onDismiss,
            )
            .safeDrawingPadding()
            .padding(14.dp),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            modifier = Modifier
                .widthIn(max = 640.dp)
                .fillMaxWidth()
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = {},
                ),
            shape = RoundedCornerShape(22.dp),
            color = CanopySurface,
            border = BorderStroke(1.2.dp, ElderGold.copy(alpha = 0.6f)),
            tonalElevation = 8.dp,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = stringResource(R.string.settings_title),
                        style = MaterialTheme.typography.headlineMedium,
                        color = SunlitAmber,
                    )
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .size(48.dp)
                            .testTag("close_settings_button"),
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Close,
                            contentDescription = stringResource(R.string.cd_close_settings),
                            tint = MistSage,
                        )
                    }
                }

                ScrollableTabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = MossCard,
                    contentColor = SunlitAmber,
                    edgePadding = 8.dp,
                ) {
                    tabs.forEachIndexed { idx, title ->
                        Tab(
                            selected = selectedTab == idx,
                            onClick = { selectedTab = idx },
                            text = { Text(title, style = MaterialTheme.typography.labelLarge) },
                        )
                    }
                }

                HorizontalDivider(color = SlateBorder.copy(alpha = 0.7f))

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(230.dp)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    when (selectedTab) {
                        0 -> {
                            Text("Graphics Preset", style = MaterialTheme.typography.titleMedium, color = MistSage)
                            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                                GraphicsQuality.entries.forEachIndexed { index, option ->
                                    SegmentedButton(
                                        selected = settings.quality == option,
                                        onClick = { onQualityChange(option) },
                                        shape = SegmentedButtonDefaults.itemShape(index, GraphicsQuality.entries.size),
                                        colors = segmentedColors(),
                                        modifier = Modifier.testTag("quality_${option.jsValue}_button"),
                                    ) { Text(option.label) }
                                }
                            }

                            Text("Shadow Quality", style = MaterialTheme.typography.titleMedium, color = MistSage)
                            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                                ShadowQuality.entries.forEachIndexed { index, option ->
                                    SegmentedButton(
                                        selected = settings.shadowQuality == option,
                                        onClick = { onShadowQualityChange(option) },
                                        shape = SegmentedButtonDefaults.itemShape(index, ShadowQuality.entries.size),
                                        colors = segmentedColors(),
                                    ) { Text(option.label) }
                                }
                            }

                            Text("Forgotten Forest Weather", style = MaterialTheme.typography.titleMedium, color = MistSage)
                            WeatherMode.entries.chunked(3).forEach { rowModes ->
                                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                                    rowModes.forEachIndexed { index, mode ->
                                        SegmentedButton(
                                            selected = settings.weatherMode == mode,
                                            onClick = { onWeatherChange(mode) },
                                            shape = SegmentedButtonDefaults.itemShape(index, rowModes.size),
                                            colors = segmentedColors(),
                                            modifier = Modifier.testTag("weather_${mode.jsValue.lowercase()}_button"),
                                        ) { Text(mode.label) }
                                    }
                                }
                            }

                            SettingSliderRow(
                                label = "Resolution Scale",
                                valueText = "${(settings.resolutionScale * 100).roundToInt()}%",
                                value = settings.resolutionScale,
                                range = 0.6f..1.3f,
                                onValueChange = onResolutionScaleChange,
                            )

                            SettingSwitchRow(
                                title = "Atmospheric Fog",
                                subtitle = "Depth haze across distant trees and mountains",
                                checked = settings.fogEnabled,
                                onCheckedChange = onFogToggle,
                                tag = "fog_switch",
                            )
                        }
                        1 -> {
                            SettingSliderRow(
                                label = "Master Volume",
                                valueText = "${(settings.masterVolume * 100).roundToInt()}%",
                                value = settings.masterVolume,
                                range = 0f..1f,
                                onValueChange = onMasterVolChange,
                            )
                            SettingSliderRow(
                                label = "Music Volume",
                                valueText = "${(settings.musicVolume * 100).roundToInt()}%",
                                value = settings.musicVolume,
                                range = 0f..1f,
                                onValueChange = onMusicVolChange,
                            )
                            SettingSliderRow(
                                label = "Sound Effects Volume",
                                valueText = "${(settings.sfxVolume * 100).roundToInt()}%",
                                value = settings.sfxVolume,
                                range = 0f..1f,
                                onValueChange = onSfxVolChange,
                            )
                        }
                        2 -> {
                            SettingSliderRow(
                                label = "Camera Sensitivity",
                                valueText = "${((settings.cameraSensitivity * 10).roundToInt()) / 10f}x",
                                value = settings.cameraSensitivity,
                                range = 0.4f..2.2f,
                                onValueChange = onSensitivityChange,
                            )
                            SettingSliderRow(
                                label = "Camera Follow Distance",
                                valueText = "${((settings.cameraFollowDistance * 10).roundToInt()) / 10f}m",
                                value = settings.cameraFollowDistance,
                                range = 5.5f..11.5f,
                                onValueChange = onFollowDistanceChange,
                            )
                            SettingSwitchRow(
                                title = "Invert Camera Y-Axis",
                                subtitle = null,
                                checked = settings.invertCameraY,
                                onCheckedChange = onInvertYToggle,
                                tag = "invert_y_switch",
                            )
                        }
                        3 -> {
                            SettingSliderRow(
                                label = "Joystick Sensitivity",
                                valueText = "${((settings.joystickSensitivity * 10).roundToInt()) / 10f}x",
                                value = settings.joystickSensitivity,
                                range = 0.6f..1.6f,
                                onValueChange = onJoystickSensChange,
                            )
                            SettingSliderRow(
                                label = "Button Size",
                                valueText = "${(settings.hudLayout.buttonScale * 100).roundToInt()}%",
                                value = settings.hudLayout.buttonScale,
                                range = 0.75f..1.35f,
                                onValueChange = onButtonScaleChange,
                            )
                            SettingSliderRow(
                                label = "Button Opacity",
                                valueText = "${(settings.hudLayout.buttonOpacity * 100).roundToInt()}%",
                                value = settings.hudLayout.buttonOpacity,
                                range = 0.4f..1.0f,
                                onValueChange = onButtonOpacityChange,
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                if (canCustomizeHud) {
                                    Button(
                                        onClick = onCustomizeHudClick,
                                        colors = ButtonDefaults.buttonColors(containerColor = ElderGold, contentColor = DeepForestBg),
                                        modifier = Modifier.weight(1f),
                                    ) {
                                        Icon(Icons.Rounded.Tune, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.size(6.dp))
                                        Text("Edit HUD Positions")
                                    }
                                }
                                OutlinedButton(
                                    onClick = onResetControlsClick,
                                    modifier = Modifier.weight(1f),
                                ) {
                                    Text("Reset Controls")
                                }
                            }
                        }
                        4 -> {
                            SettingSwitchRow(
                                title = "Show Damage Numbers",
                                subtitle = "Display floating combat hit numbers",
                                checked = settings.showDamageNumbers,
                                onCheckedChange = onDamageNumbersToggle,
                                tag = "damage_numbers_switch",
                            )
                            SettingSwitchRow(
                                title = "Show Circular Minimap",
                                subtitle = "Display top-left radar minimap",
                                checked = settings.showMinimap,
                                onCheckedChange = onShowMinimapToggle,
                                tag = "show_minimap_switch",
                            )
                            SettingSwitchRow(
                                title = "Show FPS Counter",
                                subtitle = null,
                                checked = settings.showFpsCounter,
                                onCheckedChange = onShowFpsToggle,
                                tag = "show_fps_switch",
                            )
                            SettingSliderRow(
                                label = "Bow Aim Sensitivity",
                                valueText = "${((settings.aimSensitivity * 10).roundToInt()) / 10f}x",
                                value = settings.aimSensitivity,
                                range = 0.5f..2.0f,
                                onValueChange = onAimSensChange,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun segmentedColors() = SegmentedButtonDefaults.colors(
    activeContainerColor = ElderGold,
    activeContentColor = DeepForestBg,
    inactiveContainerColor = MossCard,
    inactiveContentColor = MistSage,
    activeBorderColor = ElderGold,
    inactiveBorderColor = SlateBorder,
)

@Composable
private fun SettingSliderRow(
    label: String,
    valueText: String,
    value: Float,
    range: ClosedFloatingPointRange<Float>,
    onValueChange: (Float) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = MaterialTheme.typography.titleMedium, color = MistSage)
            Text(valueText, style = MaterialTheme.typography.titleMedium, color = ElderGold)
        }
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = range,
            colors = SliderDefaults.colors(
                thumbColor = ElderGold,
                activeTrackColor = ElderGold,
                inactiveTrackColor = SlateBorder,
            ),
        )
    }
}

@Composable
private fun SettingSwitchRow(
    title: String,
    subtitle: String?,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    tag: String,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = MistSage)
            if (subtitle != null) {
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MutedMoss)
            }
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = DeepForestBg,
                checkedTrackColor = ElderGold,
                uncheckedThumbColor = MistSage,
                uncheckedTrackColor = MossCard,
                uncheckedBorderColor = SlateBorder,
            ),
            modifier = Modifier.testTag(tag),
        )
    }
}
