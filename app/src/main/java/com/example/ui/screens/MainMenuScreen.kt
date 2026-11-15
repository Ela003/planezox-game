package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoStories
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Restore
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.data.CampaignProgress
import com.example.ui.theme.CanopySurface
import com.example.ui.theme.DeepForestBg
import com.example.ui.theme.ElderGold
import com.example.ui.theme.MistSage
import com.example.ui.theme.MutedMoss
import com.example.ui.theme.SlateBorder
import com.example.ui.theme.SunlitAmber

@Composable
fun MainMenuScreen(
    campaign: CampaignProgress,
    onNewGameClick: () -> Unit,
    onContinueClick: () -> Unit,
    onChaptersClick: () -> Unit,
    onSettingsClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    // Translucent gradient scrim lets the live orbiting 3D WebGL world shine through
    BoxWithConstraints(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        DeepForestBg.copy(alpha = 0.62f),
                        DeepForestBg.copy(alpha = 0.25f),
                        DeepForestBg.copy(alpha = 0.72f),
                    ),
                )
            )
            .safeDrawingPadding()
            .padding(horizontal = 24.dp, vertical = 16.dp),
    ) {
        val isLandscape = maxWidth > maxHeight

        if (isLandscape) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .widthIn(max = 960.dp)
                    .align(Alignment.Center),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                MenuTitleBlock(
                    centered = false,
                    modifier = Modifier
                        .weight(1.15f)
                        .padding(end = 24.dp),
                )

                MenuActionsPanel(
                    campaign = campaign,
                    onNewGameClick = onNewGameClick,
                    onContinueClick = onContinueClick,
                    onChaptersClick = onChaptersClick,
                    onSettingsClick = onSettingsClick,
                    modifier = Modifier
                        .weight(0.85f)
                        .widthIn(max = 360.dp),
                )
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .widthIn(max = 460.dp)
                    .align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween,
            ) {
                Spacer(modifier = Modifier.height(12.dp))

                MenuTitleBlock(centered = true)

                MenuActionsPanel(
                    campaign = campaign,
                    onNewGameClick = onNewGameClick,
                    onContinueClick = onContinueClick,
                    onChaptersClick = onChaptersClick,
                    onSettingsClick = onSettingsClick,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun MenuTitleBlock(
    centered: Boolean,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        horizontalAlignment = if (centered) Alignment.CenterHorizontally else Alignment.Start,
    ) {
        Image(
            painter = painterResource(id = R.drawable.kael_hero_portrait),
            contentDescription = stringResource(R.string.cd_game_emblem),
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(72.dp)
                .clip(CircleShape),
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = stringResource(R.string.game_title),
            style = MaterialTheme.typography.displayLarge,
            color = SunlitAmber,
            textAlign = if (centered) TextAlign.Center else TextAlign.Start,
        )

        Spacer(modifier = Modifier.height(8.dp))

        HorizontalDivider(
            modifier = Modifier.width(120.dp),
            thickness = 1.5.dp,
            color = ElderGold.copy(alpha = 0.7f),
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = stringResource(R.string.game_subtitle),
            style = MaterialTheme.typography.labelLarge,
            color = MistSage.copy(alpha = 0.88f),
            textAlign = if (centered) TextAlign.Center else TextAlign.Start,
        )
    }
}

@Composable
private fun MenuActionsPanel(
    campaign: CampaignProgress,
    onNewGameClick: () -> Unit,
    onContinueClick: () -> Unit,
    onChaptersClick: () -> Unit,
    onSettingsClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val canContinue = campaign.hasSavedStory && campaign.savedSceneId != "SCENE_1_INTRO"

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = CanopySurface.copy(alpha = 0.84f),
        border = BorderStroke(1.dp, SlateBorder.copy(alpha = 0.8f)),
        tonalElevation = 6.dp,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (canContinue) {
                Button(
                    onClick = onContinueClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .testTag("continue_story_button"),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF42C8FF),
                        contentColor = Color(0xFF04101A),
                    ),
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Restore,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp),
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.btn_continue_story),
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
            }

            Button(
                onClick = onNewGameClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .testTag("new_game_button"),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = ElderGold,
                    contentColor = DeepForestBg,
                ),
            ) {
                Icon(
                    imageVector = Icons.Rounded.PlayArrow,
                    contentDescription = null,
                    modifier = Modifier.size(22.dp),
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = stringResource(R.string.btn_new_game),
                    style = MaterialTheme.typography.labelLarge,
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                OutlinedButton(
                    onClick = onChaptersClick,
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .testTag("chapters_button"),
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.2.dp, ElderGold.copy(alpha = 0.65f)),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MistSage,
                        containerColor = Color.Transparent,
                    ),
                ) {
                    Icon(
                        imageVector = Icons.Rounded.AutoStories,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = stringResource(R.string.btn_chapters),
                        style = MaterialTheme.typography.labelSmall,
                    )
                }

                OutlinedButton(
                    onClick = onSettingsClick,
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .testTag("settings_button"),
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.2.dp, ElderGold.copy(alpha = 0.65f)),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MistSage,
                        containerColor = Color.Transparent,
                    ),
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Settings,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = stringResource(R.string.btn_settings),
                        style = MaterialTheme.typography.labelSmall,
                    )
                }
            }

            Text(
                text = if (campaign.chapter2Unlocked) {
                    "Chapter 1 Complete · Chapter 2 Unlocked"
                } else {
                    stringResource(R.string.controls_guide_body)
                },
                style = MaterialTheme.typography.bodySmall,
                color = MutedMoss,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 2.dp),
            )
        }
    }
}
