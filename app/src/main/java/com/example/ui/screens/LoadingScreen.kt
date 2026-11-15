package com.example.ui.screens

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.ui.theme.CanopySurface
import com.example.ui.theme.DeepForestBg
import com.example.ui.theme.ElderGold
import com.example.ui.theme.MistSage
import com.example.ui.theme.MutedMoss
import com.example.ui.theme.SlateBorder
import com.example.ui.theme.SunlitAmber

@Composable
fun LoadingScreen(
    progress: Float,
    statusMessage: String,
    webError: String?,
    modifier: Modifier = Modifier,
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 320, easing = FastOutSlowInEasing),
        label = "loading_progress",
    )

    val pulseTransition = rememberInfiniteTransition(label = "rune_pulse")
    val ringAlpha by pulseTransition.animateFloat(
        initialValue = 0.25f,
        targetValue = 0.75f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "ring_alpha",
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        Color(0xFF163024),
                        CanopySurface,
                        DeepForestBg,
                    ),
                )
            )
            .safeDrawingPadding()
            .padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 520.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(124.dp),
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    drawCircle(
                        color = ElderGold.copy(alpha = ringAlpha),
                        style = Stroke(width = 2.dp.toPx()),
                    )
                    drawCircle(
                        color = ElderGold.copy(alpha = ringAlpha * 0.45f),
                        radius = size.minDimension * 0.43f,
                        style = Stroke(width = 1.dp.toPx()),
                    )
                }

                Image(
                    painter = painterResource(id = R.drawable.kael_hero_portrait),
                    contentDescription = stringResource(R.string.cd_game_emblem),
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(96.dp)
                        .clip(CircleShape),
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = stringResource(R.string.game_title),
                style = MaterialTheme.typography.displayMedium,
                color = SunlitAmber,
                textAlign = TextAlign.Center,
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = stringResource(R.string.game_subtitle),
                style = MaterialTheme.typography.labelSmall,
                color = MutedMoss,
                textAlign = TextAlign.Center,
            )

            Spacer(modifier = Modifier.height(32.dp))

            LinearProgressIndicator(
                progress = { animatedProgress },
                modifier = Modifier
                    .fillMaxWidth(0.84f)
                    .height(8.dp)
                    .clip(RoundedCornerShape(50))
                    .testTag("loading_progress_bar"),
                color = ElderGold,
                trackColor = SlateBorder.copy(alpha = 0.55f),
                strokeCap = StrokeCap.Round,
            )

            Spacer(modifier = Modifier.height(14.dp))

            val percentage = (animatedProgress * 100).toInt()
            Text(
                text = if (webError != null) statusMessage else "$statusMessage  $percentage%",
                style = MaterialTheme.typography.bodyMedium,
                color = if (webError != null) MaterialTheme.colorScheme.error else MistSage,
                textAlign = TextAlign.Center,
                modifier = Modifier.testTag("loading_status_text"),
            )
        }
    }
}
