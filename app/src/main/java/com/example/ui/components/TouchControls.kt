package com.example.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.PointerId
import androidx.compose.ui.input.pointer.changedToUp
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChange
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ControlLayoutEntry
import com.example.ui.theme.CanopySurface
import com.example.ui.theme.DeepForestBg
import com.example.ui.theme.ElderGold
import com.example.ui.theme.MistSage
import com.example.ui.theme.SunlitAmber
import kotlin.math.hypot
import kotlin.math.roundToInt

/**
 * Full-screen multitouch camera orbit drag surface placed behind HUD controls.
 * Tracks unconsumed pointers so dragging empty screen rotates the camera without
 * interrupting the left virtual joystick or right combat buttons.
 */
@Composable
fun CameraDragSurface(
    enabled: Boolean,
    onOrbitCamera: (Float, Float) -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.pointerInput(enabled) {
            if (!enabled) return@pointerInput
            awaitPointerEventScope {
                var trackedPointer: PointerId? = null
                while (true) {
                    val event = awaitPointerEvent()
                    val changes = event.changes

                    if (trackedPointer == null) {
                        val candidate = changes.firstOrNull { it.pressed && !it.isConsumed }
                        if (candidate != null) {
                            trackedPointer = candidate.id
                        }
                    }

                    val active = changes.firstOrNull { it.id == trackedPointer }
                    if (active == null || !active.pressed || active.changedToUp()) {
                        trackedPointer = null
                    } else if (!active.isConsumed) {
                        val delta = active.positionChange()
                        if (delta != Offset.Zero) {
                            onOrbitCamera(delta.x, delta.y)
                            active.consume()
                        }
                    }
                }
            }
        }
    )
}

/**
 * Multitouch pointer-captured circular virtual joystick matching the reference aesthetic.
 */
@Composable
fun MultiTouchThumbstick(
    size: Dp,
    onMove: (Float, Float) -> Unit,
    modifier: Modifier = Modifier,
) {
    val maxRadiusPx = with(LocalDensity.current) { (size * 0.34f).toPx() }
    var knobOffset by remember { mutableStateOf(Offset.Zero) }
    var isActive by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .size(size)
            .pointerInput(maxRadiusPx) {
                awaitPointerEventScope {
                    var activeId: PointerId? = null
                    while (true) {
                        val event = awaitPointerEvent()
                        val changes = event.changes

                        if (activeId == null) {
                            val down = changes.firstOrNull { it.pressed && !it.isConsumed }
                            if (down != null) {
                                activeId = down.id
                                isActive = true
                                val center = Offset(this.size.width / 2f, this.size.height / 2f)
                                val delta = down.position - center
                                val dist = hypot(delta.x, delta.y)
                                val clamped = if (dist > maxRadiusPx) delta * (maxRadiusPx / dist) else delta
                                knobOffset = clamped
                                onMove(clamped.x / maxRadiusPx, -clamped.y / maxRadiusPx)
                                down.consume()
                            }
                        } else {
                            val ptr = changes.firstOrNull { it.id == activeId }
                            if (ptr == null || !ptr.pressed || ptr.changedToUp()) {
                                activeId = null
                                isActive = false
                                knobOffset = Offset.Zero
                                onMove(0f, 0f)
                                ptr?.consume()
                            } else {
                                val center = Offset(this.size.width / 2f, this.size.height / 2f)
                                val delta = ptr.position - center
                                val dist = hypot(delta.x, delta.y)
                                val clamped = if (dist > maxRadiusPx) delta * (maxRadiusPx / dist) else delta
                                knobOffset = clamped
                                onMove(clamped.x / maxRadiusPx, -clamped.y / maxRadiusPx)
                                ptr.consume()
                            }
                        }
                    }
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val center = Offset(this.size.width / 2f, this.size.height / 2f)
            val baseRadius = this.size.minDimension * 0.45f

            drawCircle(
                color = DeepForestBg.copy(alpha = 0.54f),
                radius = baseRadius,
                center = center,
            )
            drawCircle(
                color = (if (isActive) SunlitAmber else MistSage).copy(alpha = if (isActive) 0.72f else 0.36f),
                radius = baseRadius,
                center = center,
                style = Stroke(width = 1.8.dp.toPx()),
            )

            // Cardinal directional arrows
            val arrowDist = baseRadius * 0.76f
            val triSize = 5.dp.toPx()
            val arrowColor = MistSage.copy(alpha = 0.55f)
            listOf(
                Offset(0f, -1f),
                Offset(0f, 1f),
                Offset(-1f, 0f),
                Offset(1f, 0f),
            ).forEach { dir ->
                val tip = center + dir * arrowDist
                val perp = Offset(-dir.y, dir.x)
                val path = Path().apply {
                    moveTo(tip.x + dir.x * triSize, tip.y + dir.y * triSize)
                    lineTo(tip.x + perp.x * triSize * 0.8f, tip.y + perp.y * triSize * 0.8f)
                    lineTo(tip.x - perp.x * triSize * 0.8f, tip.y - perp.y * triSize * 0.8f)
                    close()
                }
                drawPath(path, color = arrowColor)
            }

            // Metallic movable thumb knob
            val knobCenter = center + knobOffset
            val knobRadius = this.size.minDimension * 0.19f
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Color(0xFFD8D6D0), Color(0xFF70757A), Color(0xFF2B3033)),
                    center = knobCenter - Offset(knobRadius * 0.2f, knobRadius * 0.25f),
                    radius = knobRadius * 1.4f,
                ),
                radius = knobRadius,
                center = knobCenter,
            )
            drawCircle(
                color = ElderGold.copy(alpha = if (isActive) 0.85f else 0.45f),
                radius = knobRadius,
                center = knobCenter,
                style = Stroke(width = 1.6.dp.toPx()),
            )
        }
    }
}

/**
 * Multitouch-safe tap action button with cooldown overlay, badge, and press scale animation.
 */
@Composable
fun TapActionButton(
    icon: ImageVector,
    contentDescription: String,
    size: Dp,
    accentColor: Color = ElderGold,
    cooldownSeconds: Float = 0f,
    maxCooldown: Float = 1f,
    badgeText: String? = null,
    subLabel: String? = null,
    highlighted: Boolean = false,
    onTap: () -> Unit,
    modifier: Modifier = Modifier,
    onPressStart: (() -> Unit)? = null,
    onPressEnd: ((Boolean) -> Unit)? = null,
) {
    var pressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.88f else 1f,
        animationSpec = spring(stiffness = 700f),
        label = "btn_scale",
    )

    val onCooldown = cooldownSeconds > 0.05f

    Box(
        modifier = modifier
            .size(size)
            .scale(scale)
            .pointerInput(onTap, onPressStart, onPressEnd) {
                awaitPointerEventScope {
                    var downId: PointerId? = null
                    while (true) {
                        val event = awaitPointerEvent()
                        val changes = event.changes
                        if (downId == null) {
                            val down = changes.firstOrNull { it.pressed && !it.isConsumed }
                            if (down != null) {
                                downId = down.id
                                pressed = true
                                onPressStart?.invoke()
                                down.consume()
                            }
                        } else {
                            val ptr = changes.firstOrNull { it.id == downId }
                            if (ptr == null || !ptr.pressed || ptr.changedToUp()) {
                                val wasValidRelease = ptr != null && ptr.changedToUp()
                                downId = null
                                pressed = false
                                if (onPressEnd != null) {
                                    onPressEnd(wasValidRelease)
                                } else if (wasValidRelease) {
                                    onTap()
                                }
                                ptr?.consume()
                            } else {
                                ptr.consume()
                            }
                        }
                    }
                }
            },
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            modifier = Modifier.size(size),
            shape = CircleShape,
            color = if (highlighted) accentColor.copy(alpha = 0.25f) else DeepForestBg.copy(alpha = 0.68f),
            border = BorderStroke(
                width = if (highlighted || pressed) 2.2.dp else 1.4.dp,
                color = if (onCooldown) MistSage.copy(alpha = 0.35f) else accentColor.copy(alpha = 0.85f),
            ),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = contentDescription,
                    tint = if (onCooldown) MistSage.copy(alpha = 0.4f) else Color.White,
                    modifier = Modifier.size(size * 0.48f),
                )

                if (onCooldown) {
                    val progress = (cooldownSeconds / maxCooldown.coerceAtLeast(0.1f)).coerceIn(0f, 1f)
                    Canvas(modifier = Modifier.size(size)) {
                        drawArc(
                            color = DeepForestBg.copy(alpha = 0.65f),
                            startAngle = -90f,
                            sweepAngle = 360f * progress,
                            useCenter = true,
                        )
                    }
                    Text(
                        text = String.format("%.1f", cooldownSeconds),
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = SunlitAmber,
                    )
                }
            }
        }

        if (badgeText != null) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .background(CanopySurface, CircleShape)
                    .border(1.dp, accentColor, CircleShape)
                    .padding(horizontal = 5.dp, vertical = 1.dp),
            ) {
                Text(
                    text = badgeText,
                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                    color = Color.White,
                )
            }
        }

        if (subLabel != null) {
            Text(
                text = subLabel,
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                color = SunlitAmber,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .offset(y = 14.dp),
            )
        }
    }
}

/**
 * Multitouch-safe hold button (used for Run and Shield Block) that never remains stuck.
 */
@Composable
fun HoldActionButton(
    icon: ImageVector,
    contentDescription: String,
    size: Dp,
    isActive: Boolean,
    accentColor: Color = ElderGold,
    onHoldChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    val scale by animateFloatAsState(
        targetValue = if (isActive) 0.9f else 1f,
        animationSpec = spring(stiffness = 700f),
        label = "hold_scale",
    )

    Surface(
        modifier = modifier
            .size(size)
            .scale(scale)
            .pointerInput(onHoldChange) {
                awaitPointerEventScope {
                    var downId: PointerId? = null
                    while (true) {
                        val event = awaitPointerEvent()
                        val changes = event.changes
                        if (downId == null) {
                            val down = changes.firstOrNull { it.pressed && !it.isConsumed }
                            if (down != null) {
                                downId = down.id
                                onHoldChange(true)
                                down.consume()
                            }
                        } else {
                            val ptr = changes.firstOrNull { it.id == downId }
                            if (ptr == null || !ptr.pressed || ptr.changedToUp()) {
                                downId = null
                                onHoldChange(false)
                                ptr?.consume()
                            } else {
                                ptr.consume()
                            }
                        }
                    }
                }
            },
        shape = CircleShape,
        color = if (isActive) accentColor.copy(alpha = 0.35f) else DeepForestBg.copy(alpha = 0.68f),
        border = BorderStroke(
            width = if (isActive) 2.4.dp else 1.4.dp,
            color = if (isActive) SunlitAmber else MistSage.copy(alpha = 0.65f),
        ),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = icon,
                contentDescription = contentDescription,
                tint = if (isActive) SunlitAmber else Color.White,
                modifier = Modifier.size(size * 0.48f),
            )
        }
    }
}

/**
 * Bottom-center glowing Ultimate Power button with circular charge ring.
 */
@Composable
fun UltimateButton(
    icon: ImageVector,
    chargePercent: Int,
    size: Dp,
    onActivate: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val isReady = chargePercent >= 100
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Canvas(modifier = Modifier.size(size + 10.dp)) {
                val strokeWidth = 3.2.dp.toPx()
                drawCircle(
                    color = DeepForestBg.copy(alpha = 0.6f),
                    style = Stroke(width = strokeWidth),
                )
                drawArc(
                    color = if (isReady) SunlitAmber else ElderGold.copy(alpha = 0.8f),
                    startAngle = -90f,
                    sweepAngle = 360f * (chargePercent.coerceIn(0, 100) / 100f),
                    useCenter = false,
                    style = Stroke(width = strokeWidth, cap = StrokeCap.Round),
                )
            }

            TapActionButton(
                icon = icon,
                contentDescription = "Ultimate Power",
                size = size,
                accentColor = if (isReady) SunlitAmber else MistSage.copy(alpha = 0.5f),
                highlighted = isReady,
                onTap = { if (isReady) onActivate() },
            )
        }
        Text(
            text = if (isReady) "ULTIMATE" else "$chargePercent%",
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
            color = if (isReady) SunlitAmber else MistSage,
            modifier = Modifier
                .background(DeepForestBg.copy(alpha = 0.65f), RoundedCornerShape(6.dp))
                .padding(horizontal = 6.dp, vertical = 1.dp),
        )
    }
}

/**
 * Wraps any HUD control to apply saved custom offsets, opacity, scale, and drag-to-reposition
 * when HUD customization mode is active.
 */
@Composable
fun CustomizableControlBox(
    entry: ControlLayoutEntry,
    opacity: Float,
    isCustomizing: Boolean,
    label: String,
    onOffsetDrag: (Float, Float) -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    if (!entry.enabled && !isCustomizing) return

    Box(
        modifier = modifier
            .offset { IntOffset(entry.offsetX.roundToInt(), entry.offsetY.roundToInt()) }
            .alpha(if (entry.enabled) opacity else 0.35f)
            .then(
                if (isCustomizing) {
                    Modifier
                        .border(1.5.dp, SunlitAmber, RoundedCornerShape(16.dp))
                        .background(DeepForestBg.copy(alpha = 0.35f), RoundedCornerShape(16.dp))
                        .pointerInput(entry.offsetX, entry.offsetY) {
                            detectDragGestures { change, dragAmount ->
                                change.consume()
                                onOffsetDrag(dragAmount.x, dragAmount.y)
                            }
                        }
                        .padding(4.dp)
                } else {
                    Modifier
                }
            ),
    ) {
        content()
        if (isCustomizing) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                color = SunlitAmber,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .background(DeepForestBg.copy(alpha = 0.85f), RoundedCornerShape(4.dp))
                    .padding(horizontal = 4.dp),
            )
        }
    }
}
