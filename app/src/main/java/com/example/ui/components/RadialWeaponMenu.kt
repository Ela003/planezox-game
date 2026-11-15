package com.example.ui.components

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.ui.GuardianPowerInfo
import com.example.ui.LiveGameState
import com.example.ui.WeaponSlot
import com.example.ui.theme.CanopySurface
import com.example.ui.theme.DeepForestBg
import com.example.ui.theme.ElderGold
import com.example.ui.theme.MistSage
import com.example.ui.theme.MossCard
import com.example.ui.theme.SlateBorder
import com.example.ui.theme.SunlitAmber
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * Futuristic Radial Weapon Selection Overlay featuring all 5 of Kael's weapons
 * arranged around Hero Kael's Protector emblem, displaying category, damage, ammo,
 * and unlock status with immediate single-tap equipping.
 */
@Composable
fun RadialWeaponSelectionOverlay(
    liveState: LiveGameState,
    onSelectWeapon: (WeaponSlot) -> Unit,
    onDismiss: () -> Unit,
) {
    BackHandler(onBack = onDismiss)

    val weapons = WeaponSlot.entries

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        Color(0xFF081B2C).copy(alpha = 0.88f),
                        DeepForestBg.copy(alpha = 0.94f),
                    ),
                )
            )
            .clickable(onClick = onDismiss)
            .safeDrawingPadding()
            .padding(12.dp)
            .testTag("radial_weapon_overlay"),
        contentAlignment = Alignment.Center,
    ) {
        BoxWithConstraints(
            modifier = Modifier
                .widthIn(max = 640.dp)
                .fillMaxSize()
                .clickable(enabled = false) {},
            contentAlignment = Alignment.Center,
        ) {
            val wheelRadiusDp = if (maxHeight < 360.dp) 108.dp else 128.dp

            // Futuristic Radar Ring Backdrop
            Canvas(modifier = Modifier.size(wheelRadiusDp * 2.35f)) {
                val c = Offset(size.width / 2f, size.height / 2f)
                drawCircle(
                    color = Color(0xFF38E0FF).copy(alpha = 0.25f),
                    radius = size.minDimension * 0.48f,
                    center = c,
                    style = Stroke(width = 2.dp.toPx()),
                )
                drawCircle(
                    color = ElderGold.copy(alpha = 0.3f),
                    radius = size.minDimension * 0.32f,
                    center = c,
                    style = Stroke(width = 1.5.dp.toPx()),
                )
                for (i in 0 until 5) {
                    val angle = -PI / 2.0 + (2.0 * PI * i / 5.0)
                    val end = Offset(
                        c.x + (cos(angle) * size.minDimension * 0.45f).toFloat(),
                        c.y + (sin(angle) * size.minDimension * 0.45f).toFloat(),
                    )
                    drawLine(
                        color = Color(0xFF38E0FF).copy(alpha = 0.22f),
                        start = c,
                        end = end,
                        strokeWidth = 1.dp.toPx(),
                    )
                }
            }

            // Center Hero Kael Core Hub
            Surface(
                shape = CircleShape,
                color = Color(0xFF0A1B2B),
                border = BorderStroke(2.dp, Color(0xFF38E0FF)),
                modifier = Modifier.size(116.dp),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.kael_hero_portrait),
                        contentDescription = "Hero Kael",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .border(1.5.dp, SunlitAmber, CircleShape),
                    )
                    Spacer(Modifier.height(3.dp))
                    Text(
                        text = liveState.weaponSlot.shortName.uppercase(),
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 10.sp,
                            fontWeight = FontWeight.ExtraBold,
                        ),
                        color = Color(0xFF38E0FF),
                        maxLines = 1,
                    )
                    Text(
                        text = "ARSENAL",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 8.sp),
                        color = SunlitAmber,
                    )
                }
            }

            // 5 Radial Weapon Nodes around the circle
            weapons.forEachIndexed { index, slot ->
                val angle = -PI / 2.0 + (2.0 * PI * index / 5.0)
                val xOff = (cos(angle) * wheelRadiusDp.value * 1.18f).dp
                val yOff = (sin(angle) * wheelRadiusDp.value * 0.92f).dp
                val selected = liveState.weaponSlot == slot
                val dmgText = if (slot.isRanged) {
                    "${slot.projectileDamage} DMG · ${slot.maxAmmo}"
                } else {
                    "${slot.lightDamage}/${slot.heavyDamage} DMG"
                }

                Surface(
                    onClick = {
                        onSelectWeapon(slot)
                        onDismiss()
                    },
                    shape = RoundedCornerShape(14.dp),
                    color = if (selected) Color(0xFF123654) else CanopySurface.copy(alpha = 0.94f),
                    border = BorderStroke(
                        if (selected) 2.dp else 1.2.dp,
                        if (selected) Color(0xFF38E0FF) else ElderGold.copy(alpha = 0.65f),
                    ),
                    modifier = Modifier
                        .offset(x = xOff, y = yOff)
                        .width(128.dp)
                        .testTag("radial_weapon_${slot.slotIndex}"),
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(2.dp),
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Icon(
                                imageVector = weaponIconFor(slot),
                                contentDescription = slot.displayName,
                                tint = if (selected) Color(0xFF38E0FF) else SunlitAmber,
                                modifier = Modifier.size(18.dp),
                            )
                            Text(
                                text = slot.category,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                ),
                                color = if (slot.isRanged) Color(0xFF7BE8FF) else SunlitAmber,
                            )
                            Text(
                                text = if (slot.unlocked) "UNLOCKED" else "LOCKED",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 7.sp),
                                color = if (slot.unlocked) Color(0xFF75F0A5) else Color(0xFFFF6D5E),
                            )
                        }
                        Text(
                            text = slot.displayName,
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                            ),
                            color = Color.White,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            textAlign = TextAlign.Center,
                        )
                        Text(
                            text = dmgText,
                            style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                            color = MistSage,
                        )
                    }
                }
            }

            // Close Button top-right
            Surface(
                onClick = onDismiss,
                shape = CircleShape,
                color = CanopySurface,
                border = BorderStroke(1.dp, ElderGold),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(48.dp)
                    .testTag("radial_weapon_close"),
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Rounded.Close, contentDescription = "Close Weapon Wheel", tint = MistSage)
                }
            }
        }
    }
}

/**
 * Modular 7-Power Guardian Matrix Overlay.
 * Chapter 1 starts with Energy Strike unlocked; Chapters 2-7 powers stay locked.
 */
@Composable
fun GuardianPowersOverlay(
    liveState: LiveGameState,
    onActivatePower: (GuardianPowerInfo) -> Unit,
    onDismiss: () -> Unit,
) {
    BackHandler(onBack = onDismiss)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepForestBg.copy(alpha = 0.84f))
            .clickable(onClick = onDismiss)
            .safeDrawingPadding()
            .padding(16.dp)
            .testTag("guardian_powers_overlay"),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = CanopySurface,
            border = BorderStroke(1.5.dp, Color(0xFF38E0FF).copy(alpha = 0.78f)),
            modifier = Modifier
                .widthIn(max = 620.dp)
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
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Bolt,
                            contentDescription = null,
                            tint = Color(0xFF38E0FF),
                        )
                        Text(
                            text = "GUARDIAN POWERS MATRIX",
                            style = MaterialTheme.typography.titleLarge,
                            color = Color(0xFF38E0FF),
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.size(48.dp)) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close Powers", tint = MistSage)
                    }
                }

                HorizontalDivider(color = SlateBorder)

                liveState.powers.forEach { power ->
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = if (power.unlocked) Color(0xFF102A3C) else MossCard.copy(alpha = 0.65f),
                        border = BorderStroke(
                            1.2.dp,
                            if (power.unlocked) Color(0xFF38E0FF) else SlateBorder,
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("power_card_${power.id}"),
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(end = 10.dp),
                                verticalArrangement = Arrangement.spacedBy(2.dp),
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                ) {
                                    Text(
                                        text = power.name,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = if (power.unlocked) SunlitAmber else MistSage,
                                    )
                                    Text(
                                        text = "${power.damage} DMG · ${power.energyCost} EN · ${power.cooldown}s CD",
                                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                                        color = Color(0xFF7BE8FF),
                                    )
                                }
                                Text(
                                    text = power.description,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MistSage.copy(alpha = 0.85f),
                                )
                            }

                            if (power.unlocked) {
                                Button(
                                    onClick = {
                                        onActivatePower(power)
                                        onDismiss()
                                    },
                                    enabled = liveState.energy >= power.energyCost && liveState.cooldowns.special <= 0.05f,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF38E0FF),
                                        contentColor = Color(0xFF041320),
                                    ),
                                ) {
                                    Text("Cast", fontWeight = FontWeight.Bold)
                                }
                            } else {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    modifier = Modifier
                                        .background(DeepForestBg.copy(alpha = 0.8f), RoundedCornerShape(8.dp))
                                        .padding(horizontal = 10.dp, vertical = 6.dp),
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.Lock,
                                        contentDescription = "Locked",
                                        tint = SunlitAmber,
                                        modifier = Modifier.size(14.dp),
                                    )
                                    Text(
                                        text = "CH. ${power.unlockChapter}",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = SunlitAmber,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
