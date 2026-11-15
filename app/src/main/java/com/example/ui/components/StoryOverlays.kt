package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.displayCutoutPadding
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.FastForward
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.LockOpen
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Replay
import androidx.compose.material.icons.rounded.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.CampaignProgress
import com.example.ui.BossHudState
import com.example.ui.MissionProgress
import com.example.ui.StoryHudState
import com.example.ui.theme.CanopySurface
import com.example.ui.theme.CrimsonAlert
import com.example.ui.theme.DeepForestBg
import com.example.ui.theme.ElderGold
import com.example.ui.theme.EmeraldLeaf
import com.example.ui.theme.MistSage
import com.example.ui.theme.SlateBorder
import com.example.ui.theme.SunlitAmber

private val AetherCyan = Color(0xFF42C8FF)
private val ZyroxCrimson = Color(0xFFFF3A4D)
private val ZyroxPurple = Color(0xFF9E4CFF)

@Composable
fun CutsceneOverlay(
    story: StoryHudState,
    onContinue: () -> Unit,
    onSkip: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val accent = when (story.speakerRole) {
        "AETHER" -> AetherCyan
        "ZYROX" -> ZyroxPurple
        "BOSS" -> ZyroxCrimson
        "HERO" -> Color(0xFF56B4FF)
        "UNKNOWN" -> Color(0xFF7BE8FF)
        else -> SunlitAmber
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .testTag("cutscene_overlay"),
    ) {
        // Black space title screen for Scene 1 opening beat
        AnimatedVisibility(
            visible = story.blackScreenText.isNotBlank(),
            enter = fadeIn(),
            exit = fadeOut(),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.88f))
                    .padding(32.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = story.blackScreenText,
                    style = MaterialTheme.typography.headlineMedium.copy(
                        letterSpacing = 4.sp,
                        fontWeight = FontWeight.Bold,
                    ),
                    color = AetherCyan,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.testTag("space_title_text"),
                )
            }
        }

        // Top & Bottom Cinematic Bars + Dialogue Box
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .height(32.dp)
                .background(Color.Black.copy(alpha = 0.72f)),
        )

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.86f)),
                    )
                )
                .displayCutoutPadding()
                .padding(horizontal = 24.dp, vertical = 14.dp),
        ) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = Color(0xFF0A111A).copy(alpha = 0.90f),
                border = BorderStroke(1.3.dp, accent.copy(alpha = 0.78f)),
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .widthIn(max = 720.dp)
                    .fillMaxWidth()
                    .testTag("dialogue_box"),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        if (story.speaker.isNotBlank()) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = accent.copy(alpha = 0.16f),
                                border = BorderStroke(1.dp, accent.copy(alpha = 0.65f)),
                            ) {
                                Text(
                                    text = story.speaker,
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = FontWeight.ExtraBold,
                                        letterSpacing = 1.4.sp,
                                    ),
                                    color = accent,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                )
                            }
                        }

                        Text(
                            text = if (story.subtitle.isNotBlank()) story.subtitle else "Chapter 1: The Falling Asteroid",
                            style = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp),
                            color = Color(0xFFEAF2F8),
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (story.canSkip) {
                            OutlinedButton(
                                onClick = onSkip,
                                border = BorderStroke(1.dp, SlateBorder),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .height(48.dp)
                                    .testTag("cutscene_skip_button"),
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.FastForward,
                                    contentDescription = "Skip cutscene",
                                    tint = MistSage,
                                    modifier = Modifier.size(16.dp),
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("SKIP", style = MaterialTheme.typography.labelSmall, color = MistSage)
                            }
                        }

                        if (story.canContinue) {
                            Button(
                                onClick = onContinue,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = accent,
                                    contentColor = Color(0xFF061018),
                                ),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .height(48.dp)
                                    .testTag("cutscene_continue_button"),
                            ) {
                                Text(
                                    text = "CONTINUE",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp),
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AetherGuidancePill(
    message: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = Color(0xFF081826).copy(alpha = 0.84f),
        border = BorderStroke(1.dp, AetherCyan.copy(alpha = 0.72f)),
        modifier = modifier
            .widthIn(max = 390.dp)
            .testTag("aether_comms_pill"),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(
                imageVector = Icons.Rounded.AutoAwesome,
                contentDescription = "AETHER AI",
                tint = AetherCyan,
                modifier = Modifier.size(14.dp),
            )
            Text(
                text = "AETHER: $message",
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                color = Color(0xFFD9F3FF),
                maxLines = 2,
            )
        }
    }
}

@Composable
fun BossHealthBar(
    boss: BossHudState,
    modifier: Modifier = Modifier,
) {
    val ratio = (boss.hp.toFloat() / boss.maxHp.coerceAtLeast(1).toFloat()).coerceIn(0f, 1f)
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = Color(0xFF140B0E).copy(alpha = 0.88f),
        border = BorderStroke(1.3.dp, ZyroxCrimson.copy(alpha = 0.85f)),
        modifier = modifier
            .widthIn(max = 360.dp)
            .fillMaxWidth()
            .testTag("boss_health_bar"),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(5.dp),
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Warning,
                        contentDescription = null,
                        tint = ZyroxCrimson,
                        modifier = Modifier.size(14.dp),
                    )
                    Text(
                        text = boss.name,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.sp,
                        ),
                        color = Color(0xFFFFD8D6),
                    )
                }
                Text(
                    text = "${boss.hp} / ${boss.maxHp}",
                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                    color = ZyroxCrimson,
                )
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp)
                    .clip(RoundedCornerShape(5.dp))
                    .background(Color(0xFF281216)),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(ratio)
                        .height(10.dp)
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(Color(0xFFB31217), ZyroxCrimson, Color(0xFFFF7A3B)),
                            )
                        ),
                )
            }
        }
    }
}

@Composable
fun Chapter1CompleteOverlay(
    mission: MissionProgress,
    onReplayChapter1: () -> Unit,
    onReturnToMenu: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF040A12).copy(alpha = 0.88f))
            .padding(24.dp)
            .testTag("chapter1_complete_overlay"),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = Color(0xFF0B1520),
            border = BorderStroke(1.6.dp, AetherCyan.copy(alpha = 0.8f)),
            modifier = Modifier
                .widthIn(max = 520.dp)
                .fillMaxWidth(),
        ) {
            Column(
                modifier = Modifier.padding(22.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Icon(
                    imageVector = Icons.Rounded.AutoAwesome,
                    contentDescription = null,
                    tint = AetherCyan,
                    modifier = Modifier.size(38.dp),
                )

                Text(
                    text = "CHAPTER 1 COMPLETED",
                    style = MaterialTheme.typography.titleLarge.copy(letterSpacing = 2.sp),
                    color = SunlitAmber,
                    textAlign = TextAlign.Center,
                )
                Text(
                    text = "THE FALLING ASTEROID",
                    style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 1.6.sp),
                    color = AetherCyan,
                )

                Text(
                    text = "Kael awakened the Ancient Guardian power within and drove back Commander Ravok. AETHER has joined your journey.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFFD6E4EF),
                    textAlign = TextAlign.Center,
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                ) {
                    StatBadge("Civilians Rescued", "${mission.civiliansRescued} / 3", EmeraldLeaf)
                    StatBadge("Cyclops Defeated", "${mission.cyclopsDefeated} / 4", SunlitAmber)
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = EmeraldLeaf.copy(alpha = 0.14f),
                    border = BorderStroke(1.dp, EmeraldLeaf.copy(alpha = 0.65f)),
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Icon(Icons.Rounded.LockOpen, contentDescription = null, tint = EmeraldLeaf, modifier = Modifier.size(18.dp))
                        Text(
                            text = "CHAPTER 2: SHADOWS OF THE CORE UNLOCKED",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = EmeraldLeaf,
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    OutlinedButton(
                        onClick = onReplayChapter1,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("replay_chapter1_button"),
                    ) {
                        Icon(Icons.Rounded.Replay, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("REPLAY", style = MaterialTheme.typography.labelSmall)
                    }
                    Button(
                        onClick = onReturnToMenu,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ElderGold,
                            contentColor = DeepForestBg,
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("complete_return_menu_button"),
                    ) {
                        Text("MAIN MENU", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold))
                    }
                }
            }
        }
    }
}

@Composable
private fun StatBadge(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, style = MaterialTheme.typography.titleMedium, color = color)
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = MistSage)
    }
}

@Composable
fun ChaptersModal(
    campaign: CampaignProgress,
    onPlayChapter1: () -> Unit,
    onContinueCheckpoint: () -> Unit,
    onDismiss: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepForestBg.copy(alpha = 0.84f))
            .clickable(onClick = onDismiss)
            .padding(24.dp)
            .testTag("chapters_modal"),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            shape = RoundedCornerShape(22.dp),
            color = CanopySurface,
            border = BorderStroke(1.4.dp, ElderGold.copy(alpha = 0.75f)),
            modifier = Modifier
                .widthIn(max = 560.dp)
                .fillMaxWidth()
                .clickable(enabled = false) {},
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "STORY CAMPAIGN CHAPTERS",
                        style = MaterialTheme.typography.titleLarge,
                        color = SunlitAmber,
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(48.dp)) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close chapters", tint = MistSage)
                    }
                }

                // Chapter 1 Card
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = DeepForestBg.copy(alpha = 0.8f),
                    border = BorderStroke(1.2.dp, ElderGold.copy(alpha = 0.8f)),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                Text(
                                    text = "CHAPTER 1 · THE FALLING ASTEROID",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = SunlitAmber,
                                )
                                if (campaign.chapter1Completed) {
                                    Icon(
                                        Icons.Rounded.CheckCircle,
                                        contentDescription = "Completed",
                                        tint = EmeraldLeaf,
                                        modifier = Modifier.size(16.dp),
                                    )
                                }
                            }
                            Text(
                                text = "Witness the Cyclops invasion, rescue Warmier villagers, and confront Commander Ravok.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MistSage,
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Button(
                                onClick = onPlayChapter1,
                                colors = ButtonDefaults.buttonColors(containerColor = ElderGold, contentColor = DeepForestBg),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.height(48.dp),
                            ) {
                                Icon(Icons.Rounded.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(if (campaign.chapter1Completed) "REPLAY" else "START", style = MaterialTheme.typography.labelSmall)
                            }
                            if (campaign.hasSavedStory && campaign.savedSceneId != "SCENE_1_INTRO") {
                                OutlinedButton(
                                    onClick = onContinueCheckpoint,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.height(44.dp),
                                ) {
                                    Text("CHECKPOINT", style = MaterialTheme.typography.labelSmall, color = AetherCyan)
                                }
                            }
                        }
                    }
                }

                // Chapter 2 Card (Locked until Chapter 1 is completed)
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = DeepForestBg.copy(alpha = 0.55f),
                    border = BorderStroke(
                        1.dp,
                        if (campaign.chapter2Unlocked) AetherCyan.copy(alpha = 0.7f) else SlateBorder,
                    ),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text(
                                text = "CHAPTER 2 · SHADOWS OF THE CORE",
                                style = MaterialTheme.typography.labelLarge,
                                color = if (campaign.chapter2Unlocked) AetherCyan else MistSage.copy(alpha = 0.55f),
                            )
                            Text(
                                text = if (campaign.chapter2Unlocked) {
                                    "Unlocked! AETHER prepares the expedition toward the Core of Eternity."
                                } else {
                                    "Complete Chapter 1: The Falling Asteroid to unlock."
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = MistSage.copy(alpha = 0.7f),
                            )
                        }
                        Icon(
                            imageVector = if (campaign.chapter2Unlocked) Icons.Rounded.LockOpen else Icons.Rounded.Lock,
                            contentDescription = if (campaign.chapter2Unlocked) "Unlocked" else "Locked",
                            tint = if (campaign.chapter2Unlocked) EmeraldLeaf else MistSage.copy(alpha = 0.5f),
                            modifier = Modifier.size(24.dp),
                        )
                    }
                }
            }
        }
    }
}
