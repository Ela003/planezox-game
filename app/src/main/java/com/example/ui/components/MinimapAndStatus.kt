package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.CheckBox
import androidx.compose.material.icons.rounded.CheckBoxOutlineBlank
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.DirectionsRun
import androidx.compose.material.icons.rounded.ExpandLess
import androidx.compose.material.icons.rounded.ExpandMore
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.Fullscreen
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Shield
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.ui.LiveGameState
import com.example.ui.theme.CanopySurface
import com.example.ui.theme.CrimsonAlert
import com.example.ui.theme.DeepForestBg
import com.example.ui.theme.ElderGold
import com.example.ui.theme.EmeraldLeaf
import com.example.ui.theme.MistSage
import com.example.ui.theme.SlateBorder
import com.example.ui.theme.SunlitAmber
import kotlin.math.cos
import kotlin.math.sin

/**
 * Top-left circular minimap rotating dynamically with player camera yaw,
 * showing player arrow, nearby enemies, Lost Temple, and expand button.
 */
@Composable
fun CircularMinimap(
    liveState: LiveGameState,
    onExpandMap: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.size(104.dp)) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .clip(CircleShape)
                .background(Color(0xFF132219).copy(alpha = 0.88f))
                .border(2.dp, ElderGold.copy(alpha = 0.85f), CircleShape)
                .clickable(onClick = onExpandMap)
                .testTag("circular_minimap"),
        ) {
            val center = Offset(size.width / 2f, size.height / 2f)
            val radius = size.minDimension / 2f
            val mapRange = 64f // world meters visible in minimap radius

            // Subtle radar rings & forest clearing circle
            drawCircle(
                color = EmeraldLeaf.copy(alpha = 0.25f),
                radius = radius * 0.6f,
                center = center,
                style = Stroke(width = 1.dp.toPx()),
            )
            drawCircle(
                color = ElderGold.copy(alpha = 0.2f),
                radius = radius * 0.3f,
                center = center,
                style = Stroke(width = 1.dp.toPx()),
            )

            // Rotate world markers by -playerYaw so UP on minimap matches forward view
            val yawRad = liveState.playerYaw
            val cosY = cos(yawRad)
            val sinY = sin(yawRad)

            fun worldToMap(wx: Float, wz: Float): Offset {
                val dx = wx - liveState.playerX
                val dz = wz - liveState.playerZ
                val rx = dx * cosY - dz * sinY
                val rz = dx * sinY + dz * cosY
                val nx = (rx / mapRange).coerceIn(-0.88f, 0.88f)
                val ny = (rz / mapRange).coerceIn(-0.88f, 0.88f)
                return Offset(center.x + nx * radius, center.y + ny * radius)
            }

            // Northern Safe Route / Boss Arena marker
            val templePos = worldToMap(liveState.templeX, liveState.templeZ)
            drawCircle(
                color = if (liveState.mission.ravokDefeated) EmeraldLeaf else SunlitAmber,
                radius = 5.dp.toPx(),
                center = templePos,
            )
            drawCircle(
                color = Color.White,
                radius = 5.dp.toPx(),
                center = templePos,
                style = Stroke(width = 1.2.dp.toPx()),
            )

            // Unrescued Civilians (Cyan blips)
            liveState.civilians.filter { !it.rescued }.forEach { civ ->
                val cPos = worldToMap(civ.x, civ.z)
                drawCircle(
                    color = Color(0xFF42C8FF),
                    radius = 3.5.dp.toPx(),
                    center = cPos,
                )
            }

            // Alive Cyclops Soldiers (Red enemy blips)
            liveState.enemies.filter { it.alive }.forEach { enemy ->
                val ePos = worldToMap(enemy.x, enemy.z)
                drawCircle(
                    color = Color(0xFFFF4B3E),
                    radius = 3.8.dp.toPx(),
                    center = ePos,
                )
            }

            // Boss Ravok Marker
            if (liveState.boss.visible) {
                val bPos = worldToMap(liveState.boss.x, liveState.boss.z)
                drawCircle(
                    color = Color(0xFFFF1E42),
                    radius = 6.dp.toPx(),
                    center = bPos,
                )
            }

            // Player directional chevron in center
            val arrowPath = Path().apply {
                moveTo(center.x, center.y - 7.dp.toPx())
                lineTo(center.x - 5.dp.toPx(), center.y + 5.dp.toPx())
                lineTo(center.x, center.y + 2.5.dp.toPx())
                lineTo(center.x + 5.dp.toPx(), center.y + 5.dp.toPx())
                close()
            }
            drawPath(arrowPath, color = SunlitAmber)

            // Rotating North marker on rim
            val northAngle = -yawRad
            val northPos = Offset(
                center.x + sin(northAngle) * (radius - 7.dp.toPx()),
                center.y - cos(northAngle) * (radius - 7.dp.toPx()),
            )
            rotate(degrees = 0f, pivot = northPos) {
                drawCircle(color = ElderGold, radius = 3.dp.toPx(), center = northPos)
            }
        }

        // Expand Map Corner Button
        Surface(
            onClick = onExpandMap,
            shape = CircleShape,
            color = CanopySurface.copy(alpha = 0.9f),
            border = BorderStroke(1.dp, ElderGold.copy(alpha = 0.8f)),
            modifier = Modifier
                .align(Alignment.TopEnd)
                .size(28.dp)
                .testTag("expand_map_button"),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Rounded.Fullscreen,
                    contentDescription = "Expand Map",
                    tint = SunlitAmber,
                    modifier = Modifier.size(16.dp),
                )
            }
        }
    }
}

/**
 * Top-left player portrait, level badge, Health/Energy/Stamina bars, and active status badges.
 */
@Composable
fun PlayerStatusBars(
    liveState: LiveGameState,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            // Character Portrait + Level (Hero Kael)
            Box(contentAlignment = Alignment.BottomCenter) {
                Image(
                    painter = painterResource(id = R.drawable.kael_hero_portrait),
                    contentDescription = "Hero Kael portrait",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .border(2.dp, if (liveState.isLowHealth) CrimsonAlert else ElderGold, CircleShape),
                )
                Box(
                    modifier = Modifier
                        .background(DeepForestBg.copy(alpha = 0.92f), RoundedCornerShape(6.dp))
                        .border(1.dp, ElderGold.copy(alpha = 0.8f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 5.dp, vertical = 1.dp),
                ) {
                    Text(
                        text = "Lv.${liveState.level}",
                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp, fontWeight = FontWeight.Bold),
                        color = SunlitAmber,
                    )
                }
            }

            // Name + Health / Energy / Stamina Bars
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    text = liveState.playerName,
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = MistSage,
                )
                HudMeterBar(
                    icon = Icons.Rounded.Favorite,
                    value = liveState.hp,
                    max = liveState.maxHp,
                    fillColor = if (liveState.isLowHealth) Color(0xFFFF382E) else Color(0xFFD9362E),
                    label = "${liveState.hp} / ${liveState.maxHp}",
                    modifier = Modifier.testTag("health_bar"),
                )
                HudMeterBar(
                    icon = Icons.Rounded.Bolt,
                    value = liveState.energy,
                    max = liveState.maxEnergy,
                    fillColor = Color(0xFF1F8EF1),
                    label = "${liveState.energy} / ${liveState.maxEnergy}",
                    modifier = Modifier.testTag("energy_bar"),
                )
                HudMeterBar(
                    icon = Icons.Rounded.DirectionsRun,
                    value = liveState.stamina,
                    max = liveState.maxStamina,
                    fillColor = Color(0xFFE8A925),
                    label = null,
                    modifier = Modifier.testTag("stamina_bar"),
                )
            }
        }

        // Small active status indicators
        Row(
            horizontalArrangement = Arrangement.spacedBy(5.dp),
            modifier = Modifier.padding(start = 56.dp),
        ) {
            if (liveState.perfectBlockActive) {
                MiniStatusChip(icon = Icons.Rounded.Shield, color = SunlitAmber, text = "PARRY!")
            } else if (liveState.isBlocking) {
                MiniStatusChip(icon = Icons.Rounded.Shield, color = Color(0xFF399BFF), text = "WARD")
            }
            if (liveState.titanShieldActive) {
                MiniStatusChip(icon = Icons.Rounded.Shield, color = Color(0xFF4CE8FF), text = "TITAN SHIELD")
            }
            if (liveState.guardianModeActive) {
                MiniStatusChip(icon = Icons.Rounded.Bolt, color = SunlitAmber, text = "GUARDIAN")
            }
            if (liveState.isAiming) {
                MiniStatusChip(icon = Icons.Rounded.Info, color = Color(0xFF38E0FF), text = "AIM")
            }
            if (liveState.isLowHealth) {
                MiniStatusChip(icon = Icons.Rounded.Favorite, color = CrimsonAlert, text = "LOW HP")
            }
            if (liveState.hasTargetLock) {
                MiniStatusChip(icon = Icons.Rounded.Info, color = SunlitAmber, text = "LOCKED")
            }
        }
    }
}

@Composable
private fun HudMeterBar(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    value: Int,
    max: Int,
    fillColor: Color,
    label: String?,
    modifier: Modifier = Modifier,
) {
    val ratio = (value.toFloat() / max.coerceAtLeast(1).toFloat()).coerceIn(0f, 1f)
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        modifier = modifier,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = fillColor,
            modifier = Modifier.size(12.dp),
        )
        Box(
            modifier = Modifier
                .width(126.dp)
                .height(12.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(DeepForestBg.copy(alpha = 0.85f))
                .border(1.dp, Color.White.copy(alpha = 0.22f), RoundedCornerShape(6.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(ratio)
                    .height(12.dp)
                    .align(Alignment.CenterStart)
                    .background(fillColor),
            )
            if (label != null) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp, fontWeight = FontWeight.Bold),
                    color = Color.White,
                )
            }
        }
    }
}

@Composable
private fun MiniStatusChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    text: String,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(3.dp),
        modifier = Modifier
            .background(DeepForestBg.copy(alpha = 0.78f), RoundedCornerShape(8.dp))
            .border(1.dp, color.copy(alpha = 0.8f), RoundedCornerShape(8.dp))
            .padding(horizontal = 6.dp, vertical = 2.dp),
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = color, modifier = Modifier.size(10.dp))
        Text(text = text, style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp), color = Color.White)
    }
}

/**
 * Collapsible Mission Objective Panel below the minimap.
 */
@Composable
fun MissionObjectivePanel(
    liveState: LiveGameState,
    collapsed: Boolean,
    onToggleCollapse: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val mission = liveState.mission
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = DeepForestBg.copy(alpha = 0.68f),
        border = BorderStroke(1.dp, ElderGold.copy(alpha = 0.45f)),
        modifier = modifier
            .widthIn(max = 236.dp)
            .clickable(onClick = onToggleCollapse)
            .testTag("mission_panel"),
    ) {
        Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "CH. 1 · THE FALLING ASTEROID",
                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                    color = SunlitAmber,
                )
                Icon(
                    imageVector = if (collapsed) Icons.Rounded.ExpandMore else Icons.Rounded.ExpandLess,
                    contentDescription = if (collapsed) "Expand mission" else "Collapse mission",
                    tint = SunlitAmber,
                    modifier = Modifier.size(16.dp),
                )
            }

            AnimatedVisibility(visible = !collapsed) {
                Column(
                    modifier = Modifier.padding(top = 5.dp),
                    verticalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    ObjectiveRow("Escape destroyed settlement", mission.escapedSettlement)
                    ObjectiveRow("Rescue civilians (${mission.civiliansRescued}/3)", mission.civiliansRescued >= 3)
                    ObjectiveRow("Defeat Cyclops (${mission.cyclopsDefeated}/4)", mission.cyclopsDefeated >= 4)
                    ObjectiveRow("Reach northern forest route", mission.reachedSafeRoute)
                    if (liveState.boss.visible || mission.reachedSafeRoute) {
                        ObjectiveRow("Confront Commander Ravok", mission.ravokDefeated)
                    }
                }
            }
        }
    }
}

@Composable
private fun ObjectiveRow(text: String, completed: Boolean) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        Icon(
            imageVector = if (completed) Icons.Rounded.CheckBox else Icons.Rounded.CheckBoxOutlineBlank,
            contentDescription = null,
            tint = if (completed) EmeraldLeaf else MistSage.copy(alpha = 0.7f),
            modifier = Modifier.size(13.dp),
        )
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
            color = if (completed) EmeraldLeaf else MistSage,
        )
    }
}

/**
 * Fullscreen Expanded Forest Tactical Map Dialog.
 */
@Composable
fun ExpandedMapDialog(
    liveState: LiveGameState,
    onDismiss: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepForestBg.copy(alpha = 0.82f))
            .clickable(onClick = onDismiss)
            .padding(20.dp),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = CanopySurface,
            border = BorderStroke(1.5.dp, ElderGold.copy(alpha = 0.75f)),
            modifier = Modifier
                .widthIn(max = 560.dp)
                .fillMaxWidth()
                .clickable(enabled = false) {},
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "ANCIENT VALLEY MAP",
                        style = MaterialTheme.typography.titleLarge,
                        color = SunlitAmber,
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(48.dp)) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close Map", tint = MistSage)
                    }
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(210.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFF102016))
                        .border(1.dp, SlateBorder, RoundedCornerShape(14.dp)),
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val cx = size.width / 2f
                        val cy = size.height / 2f
                        val scale = size.minDimension / 140f

                        fun toCanvas(wx: Float, wz: Float) = Offset(cx + wx * scale, cy + wz * scale)

                        // Clearing & Forest rings
                        drawCircle(color = Color(0xFF1F3B27), radius = 16f * scale, center = toCanvas(0f, 0f))
                        drawCircle(color = Color(0xFF284D33), radius = 12f * scale, center = toCanvas(0f, -46f))

                        // Crater / Arena Marker
                        val t = toCanvas(liveState.templeX, liveState.templeZ)
                        drawCircle(color = SunlitAmber, radius = 7.dp.toPx(), center = t)

                        // Unrescued Civilians
                        liveState.civilians.filter { !it.rescued }.forEach { c ->
                            drawCircle(color = Color(0xFF42C8FF), radius = 4.5.dp.toPx(), center = toCanvas(c.x, c.z))
                        }

                        // Cyclops Soldiers
                        liveState.enemies.filter { it.alive }.forEach { e ->
                            drawCircle(color = Color(0xFFFF4B3E), radius = 5.dp.toPx(), center = toCanvas(e.x, e.z))
                        }

                        // Boss Ravok
                        if (liveState.boss.visible) {
                            drawCircle(color = Color(0xFFFF1E42), radius = 7.5.dp.toPx(), center = toCanvas(liveState.boss.x, liveState.boss.z))
                        }

                        // Player Marker
                        val p = toCanvas(liveState.playerX, liveState.playerZ)
                        drawCircle(color = Color.White, radius = 6.dp.toPx(), center = p)
                        drawCircle(color = ElderGold, radius = 3.5.dp.toPx(), center = p)
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    LegendItem(Color.White, "Kael")
                    LegendItem(Color(0xFF42C8FF), "Civilians")
                    LegendItem(Color(0xFFFF4B3E), "Cyclops")
                    LegendItem(SunlitAmber, "Safe Route")
                }
            }
        }
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(modifier = Modifier.size(10.dp).background(color, CircleShape))
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = MistSage)
    }
}
