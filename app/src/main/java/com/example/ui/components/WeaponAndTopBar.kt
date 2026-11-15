package com.example.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Backpack
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.CenterFocusStrong
import androidx.compose.material.icons.rounded.Flare
import androidx.compose.material.icons.rounded.GpsFixed
import androidx.compose.material.icons.rounded.Hardware
import androidx.compose.material.icons.rounded.Map
import androidx.compose.material.icons.rounded.Pause
import androidx.compose.material.icons.rounded.Radar
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.SportsMartialArts
import androidx.compose.material.icons.rounded.SportsMma
import androidx.compose.material.icons.rounded.Videocam
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.LiveGameState
import com.example.ui.WeaponSlot
import com.example.ui.theme.CanopySurface
import com.example.ui.theme.DeepForestBg
import com.example.ui.theme.ElderGold
import com.example.ui.theme.MistSage
import com.example.ui.theme.SlateBorder
import com.example.ui.theme.SunlitAmber

fun weaponIconFor(slot: WeaponSlot): ImageVector = when (slot) {
    WeaponSlot.GUARDIAN_SWORD -> Icons.Rounded.SportsMartialArts
    WeaponSlot.QUANTUM_AXE -> Icons.Rounded.Hardware
    WeaponSlot.PLASMA_RIFLE -> Icons.Rounded.GpsFixed
    WeaponSlot.DUAL_BLASTERS -> Icons.Rounded.Flare
    WeaponSlot.GUARDIAN_GAUNTLET -> Icons.Rounded.SportsMma
}

/**
 * Top-right resource counters & utility buttons (Powers, Inventory, Map, Settings, Pause).
 */
@Composable
fun TopRightUtilityBar(
    gold: Int,
    shards: Int,
    onOpenPowers: () -> Unit,
    onOpenInventory: () -> Unit,
    onOpenMap: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenPause: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Gold & Shards pill
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = DeepForestBg.copy(alpha = 0.72f),
            border = BorderStroke(1.dp, SlateBorder),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "◈ $gold",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = SunlitAmber,
                )
                Text(
                    text = "✦ $shards",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = Color(0xFFA97BFF),
                )
            }
        }

        TopIconChip(Icons.Rounded.Bolt, "Guardian Powers", onOpenPowers, Modifier.testTag("hud_powers_button"))
        TopIconChip(Icons.Rounded.Backpack, "Inventory", onOpenInventory, Modifier.testTag("hud_inventory_button"))
        TopIconChip(Icons.Rounded.Map, "Map", onOpenMap, Modifier.testTag("hud_map_button"))
        TopIconChip(Icons.Rounded.Settings, "Settings", onOpenSettings, Modifier.testTag("hud_settings_button"))
        TopIconChip(Icons.Rounded.Pause, "Pause", onOpenPause, Modifier.testTag("hud_pause_button"))
    }
}

@Composable
private fun TopIconChip(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        onClick = onClick,
        shape = CircleShape,
        color = DeepForestBg.copy(alpha = 0.76f),
        border = BorderStroke(1.dp, ElderGold.copy(alpha = 0.6f)),
        modifier = modifier.size(38.dp),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = icon,
                contentDescription = contentDescription,
                tint = MistSage,
                modifier = Modifier.size(19.dp),
            )
        }
    }
}

/**
 * Top-right 5-slot Weapon Selection Bar + Futuristic Radial Wheel Launcher.
 */
@Composable
fun WeaponSelectorBar(
    liveState: LiveGameState,
    onSelectWeapon: (WeaponSlot) -> Unit,
    onOpenRadialMenu: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.End,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Radial Wheel Open Button
            Surface(
                onClick = onOpenRadialMenu,
                shape = RoundedCornerShape(10.dp),
                color = Color(0xFF0F2B42).copy(alpha = 0.88f),
                border = BorderStroke(1.2.dp, Color(0xFF38E0FF)),
                modifier = Modifier
                    .size(width = 44.dp, height = 44.dp)
                    .testTag("open_radial_weapon_button"),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Rounded.Radar,
                        contentDescription = "Open Weapon Wheel",
                        tint = Color(0xFF38E0FF),
                        modifier = Modifier.size(21.dp),
                    )
                }
            }

            WeaponSlot.entries.forEach { slot ->
                val isSelected = liveState.weaponSlot == slot
                val borderColor by animateColorAsState(
                    targetValue = if (isSelected) Color(0xFF38E0FF) else SlateBorder,
                    label = "weapon_border",
                )
                val bgColor by animateColorAsState(
                    targetValue = if (isSelected) Color(0xFF143852).copy(alpha = 0.92f) else DeepForestBg.copy(alpha = 0.76f),
                    label = "weapon_bg",
                )

                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = bgColor,
                    border = BorderStroke(if (isSelected) 1.8.dp else 1.dp, borderColor),
                    modifier = Modifier
                        .size(width = 46.dp, height = 44.dp)
                        .clickable { onSelectWeapon(slot) }
                        .testTag("weapon_slot_${slot.slotIndex}"),
                ) {
                    Box(modifier = Modifier.padding(4.dp)) {
                        Icon(
                            imageVector = weaponIconFor(slot),
                            contentDescription = slot.displayName,
                            tint = if (isSelected) Color(0xFF38E0FF) else MistSage.copy(alpha = 0.75f),
                            modifier = Modifier
                                .size(20.dp)
                                .align(Alignment.Center),
                        )
                        Text(
                            text = "${slot.slotIndex + 1}",
                            style = MaterialTheme.typography.labelSmall.copy(fontSize = 8.sp),
                            color = MistSage.copy(alpha = 0.8f),
                            modifier = Modifier.align(Alignment.TopStart),
                        )
                        if (slot.isRanged) {
                            val ammoLabel = if (isSelected) "${liveState.ammo}" else "${slot.maxAmmo}"
                            Text(
                                text = ammoLabel,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                ),
                                color = SunlitAmber,
                                modifier = Modifier.align(Alignment.BottomEnd),
                            )
                        }
                    }
                }
            }
        }

        // Equipped weapon name + ammo / reload status badge
        Surface(
            onClick = onOpenRadialMenu,
            shape = RoundedCornerShape(8.dp),
            color = CanopySurface.copy(alpha = 0.84f),
            border = BorderStroke(1.dp, ElderGold.copy(alpha = 0.45f)),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = liveState.weaponSlot.displayName,
                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.SemiBold),
                    color = SunlitAmber,
                )
                if (liveState.weaponSlot.isRanged) {
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = if (liveState.isReloading) {
                            "RELOADING ${(liveState.reloadProgress * 100).toInt()}%"
                        } else {
                            "${liveState.ammo}/${liveState.maxAmmo}"
                        },
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                        color = if (liveState.isReloading) Color(0xFF38E0FF) else MistSage,
                    )
                }
                if (liveState.cooldowns.special > 0.05f) {
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = "⚡${String.format("%.1f", liveState.cooldowns.special)}s",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                        color = Color(0xFF62D9FF),
                    )
                }
            }
        }
    }
}

/**
 * Right-edge Target Lock & Camera Reset buttons.
 */
@Composable
fun RightEdgeUtilityButtons(
    hasTargetLock: Boolean,
    showTargetLock: Boolean,
    showCameraReset: Boolean,
    onToggleTargetLock: () -> Unit,
    onResetCamera: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalAlignment = Alignment.End,
    ) {
        if (showTargetLock) {
            TapActionButton(
                icon = Icons.Rounded.CenterFocusStrong,
                contentDescription = "Target Lock",
                size = 42.dp,
                accentColor = if (hasTargetLock) Color(0xFFFF594F) else ElderGold,
                highlighted = hasTargetLock,
                onTap = onToggleTargetLock,
                modifier = Modifier.testTag("target_lock_button"),
            )
        }
        if (showCameraReset) {
            TapActionButton(
                icon = Icons.Rounded.Videocam,
                contentDescription = "Reset Camera",
                size = 42.dp,
                accentColor = MistSage,
                onTap = onResetCamera,
                modifier = Modifier.testTag("reset_camera_button"),
            )
        }
    }
}
