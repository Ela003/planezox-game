package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.rounded.Backpack
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Gamepad
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.ui.LiveGameState
import com.example.ui.WeaponSlot
import com.example.ui.components.weaponIconFor
import com.example.ui.theme.CanopySurface
import com.example.ui.theme.DeepForestBg
import com.example.ui.theme.ElderGold
import com.example.ui.theme.EmeraldLeaf
import com.example.ui.theme.MistSage
import com.example.ui.theme.MossCard
import com.example.ui.theme.MutedMoss
import com.example.ui.theme.SlateBorder
import com.example.ui.theme.SunlitAmber

@Composable
fun PauseMenuOverlay(
    onResume: () -> Unit,
    onRestartCheckpoint: () -> Unit,
    onOpenInventory: () -> Unit,
    onOpenSettings: () -> Unit,
    onOpenControlsGuide: () -> Unit,
    onReturnToMainMenu: () -> Unit,
) {
    BackHandler(onBack = onResume)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepForestBg.copy(alpha = 0.78f))
            .safeDrawingPadding()
            .padding(16.dp),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = CanopySurface,
            border = BorderStroke(1.5.dp, ElderGold.copy(alpha = 0.75f)),
            modifier = Modifier
                .widthIn(max = 420.dp)
                .fillMaxWidth(),
        ) {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    text = "GAME PAUSED",
                    style = MaterialTheme.typography.headlineMedium,
                    color = SunlitAmber,
                )

                HorizontalDivider(color = SlateBorder)

                PausePrimaryButton("Resume Game", Icons.Rounded.PlayArrow, onResume, Modifier.testTag("pause_resume_button"))
                PauseOptionButton("Restart Checkpoint", Icons.Rounded.Refresh, onRestartCheckpoint, Modifier.testTag("pause_restart_button"))
                PauseOptionButton("Inventory", Icons.Rounded.Backpack, onOpenInventory, Modifier.testTag("pause_inventory_button"))
                PauseOptionButton("Settings", Icons.Rounded.Settings, onOpenSettings, Modifier.testTag("pause_settings_button"))
                PauseOptionButton("Controls Guide", Icons.Rounded.Gamepad, onOpenControlsGuide, Modifier.testTag("pause_controls_button"))
                PauseOptionButton("Return to Main Menu", Icons.Rounded.Home, onReturnToMainMenu, Modifier.testTag("pause_main_menu_button"))
            }
        }
    }
}

@Composable
private fun PausePrimaryButton(
    text: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Button(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(containerColor = ElderGold, contentColor = DeepForestBg),
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp),
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
        Spacer(Modifier.size(8.dp))
        Text(text = text, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
private fun PauseOptionButton(
    text: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    OutlinedButton(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, SlateBorder),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = MistSage, containerColor = MossCard.copy(alpha = 0.6f)),
        modifier = modifier
            .fillMaxWidth()
            .height(46.dp),
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp), tint = ElderGold)
        Spacer(Modifier.size(8.dp))
        Text(text = text, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
fun InventoryOverlay(
    liveState: LiveGameState,
    onSelectWeapon: (WeaponSlot) -> Unit,
    onUsePotion: () -> Unit,
    onDismiss: () -> Unit,
) {
    BackHandler(onBack = onDismiss)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepForestBg.copy(alpha = 0.82f))
            .clickable(onClick = onDismiss)
            .safeDrawingPadding()
            .padding(16.dp),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = CanopySurface,
            border = BorderStroke(1.5.dp, ElderGold.copy(alpha = 0.7f)),
            modifier = Modifier
                .widthIn(max = 580.dp)
                .fillMaxWidth()
                .clickable(enabled = false) {},
        ) {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("INVENTORY & ARSENAL", style = MaterialTheme.typography.headlineMedium, color = SunlitAmber)
                    IconButton(onClick = onDismiss, modifier = Modifier.size(48.dp)) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close Inventory", tint = MistSage)
                    }
                }

                HorizontalDivider(color = SlateBorder)

                Text("WEAPONS ARSENAL (Tap to Equip)", style = MaterialTheme.typography.labelLarge, color = MistSage)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    WeaponSlot.entries.forEach { slot ->
                        val equipped = liveState.weaponSlot == slot
                        Surface(
                            onClick = { onSelectWeapon(slot) },
                            shape = RoundedCornerShape(12.dp),
                            color = if (equipped) ElderGold.copy(alpha = 0.22f) else MossCard,
                            border = BorderStroke(1.2.dp, if (equipped) SunlitAmber else SlateBorder),
                            modifier = Modifier.weight(1f),
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 8.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(3.dp),
                            ) {
                                Icon(weaponIconFor(slot), contentDescription = null, tint = if (equipped) SunlitAmber else MistSage)
                                Text(slot.shortName, style = MaterialTheme.typography.labelMedium, color = MistSage)
                                Text(
                                    text = if (slot.isRanged) "${slot.projectileDamage} DMG" else "${slot.lightDamage}/${slot.heavyDamage}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MutedMoss,
                                )
                                Text(
                                    text = if (equipped) "EQUIPPED" else slot.category,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (equipped) SunlitAmber else MutedMoss,
                                )
                            }
                        }
                    }
                }

                Text("SUPPLIES & RELICS", style = MaterialTheme.typography.labelLarge, color = MistSage)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MossCard,
                        border = BorderStroke(1.dp, SlateBorder),
                        modifier = Modifier.weight(1f),
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column {
                                Text("Healing Vials", style = MaterialTheme.typography.titleMedium, color = MistSage)
                                Text("Remaining: ${liveState.potions}", style = MaterialTheme.typography.bodyMedium, color = SunlitAmber)
                            }
                            Button(
                                onClick = onUsePotion,
                                enabled = liveState.potions > 0 && liveState.hp < liveState.maxHp,
                                colors = ButtonDefaults.buttonColors(containerColor = ElderGold, contentColor = DeepForestBg),
                            ) {
                                Text("Use")
                            }
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = MossCard,
                        border = BorderStroke(1.dp, SlateBorder),
                        modifier = Modifier.weight(1f),
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Guardian Emblem", style = MaterialTheme.typography.titleMedium, color = MistSage)
                            Text(
                                text = if (liveState.artifactCollected) "Guardian Power Awakened" else "Dormant on Kael's Hand",
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (liveState.artifactCollected) EmeraldLeaf else MutedMoss,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ControlsGuideOverlay(
    onCustomizeHud: () -> Unit,
    onDismiss: () -> Unit,
) {
    BackHandler(onBack = onDismiss)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepForestBg.copy(alpha = 0.82f))
            .clickable(onClick = onDismiss)
            .safeDrawingPadding()
            .padding(16.dp),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = CanopySurface,
            border = BorderStroke(1.5.dp, ElderGold.copy(alpha = 0.7f)),
            modifier = Modifier
                .widthIn(max = 560.dp)
                .fillMaxWidth()
                .clickable(enabled = false) {},
        ) {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("CONTROLS GUIDE", style = MaterialTheme.typography.headlineMedium, color = SunlitAmber)
                    IconButton(onClick = onDismiss, modifier = Modifier.size(48.dp)) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close Guide", tint = MistSage)
                    }
                }

                HorizontalDivider(color = SlateBorder)

                GuideLine("Movement (Left)", "Drag the Virtual Joystick to move in all directions. Hold RUN to sprint.")
                GuideLine("Camera (Screen)", "Drag any open screen area to orbit the camera smoothly around your hero.")
                GuideLine("Combat (Right)", "Tap Attack (light), Heavy Attack, Special Power, Jump, Dodge, or Hold Block.")
                GuideLine("Interact & Weapons", "Tap Interact near Warmier civilians to rescue them, or collect healing vials. Tap top-right slots to switch weapons.")
                GuideLine("Ultimate & Lock-On", "Tap Ultimate at 100% charge. Tap Target Lock on the right to lock onto Cyclops soldiers or Commander Ravok.")

                Button(
                    onClick = onCustomizeHud,
                    colors = ButtonDefaults.buttonColors(containerColor = ElderGold, contentColor = DeepForestBg),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                ) {
                    Icon(Icons.Rounded.Tune, contentDescription = null)
                    Spacer(Modifier.size(8.dp))
                    Text("Customize HUD Layout", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun GuideLine(title: String, detail: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MossCard, RoundedCornerShape(10.dp))
            .padding(10.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(title, style = MaterialTheme.typography.labelLarge, color = SunlitAmber, modifier = Modifier.widthIn(min = 120.dp))
        Text(detail, style = MaterialTheme.typography.bodyMedium, color = MistSage, modifier = Modifier.weight(1f))
    }
}
