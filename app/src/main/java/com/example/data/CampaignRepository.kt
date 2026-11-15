package com.example.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.campaignDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "shadows_campaign_prefs"
)

data class CampaignProgress(
    val hasSavedStory: Boolean = false,
    val savedSceneId: String = "SCENE_1_INTRO",
    val chapter1Completed: Boolean = false,
    val chapter2Unlocked: Boolean = false,
    val civiliansRescued: Int = 0,
    val cyclopsDefeated: Int = 0,
)

class CampaignRepository(private val context: Context) {

    private object Keys {
        val HAS_SAVED_STORY = booleanPreferencesKey("has_saved_story")
        val SAVED_SCENE_ID = stringPreferencesKey("saved_scene_id")
        val CHAPTER_1_COMPLETED = booleanPreferencesKey("chapter_1_completed")
        val CHAPTER_2_UNLOCKED = booleanPreferencesKey("chapter_2_unlocked")
        val CIVILIANS_RESCUED = intPreferencesKey("civilians_rescued")
        val CYCLOPS_DEFEATED = intPreferencesKey("cyclops_defeated")
    }

    val campaignFlow: Flow<CampaignProgress> = context.campaignDataStore.data.map { prefs ->
        CampaignProgress(
            hasSavedStory = prefs[Keys.HAS_SAVED_STORY] ?: false,
            savedSceneId = prefs[Keys.SAVED_SCENE_ID] ?: "SCENE_1_INTRO",
            chapter1Completed = prefs[Keys.CHAPTER_1_COMPLETED] ?: false,
            chapter2Unlocked = prefs[Keys.CHAPTER_2_UNLOCKED] ?: false,
            civiliansRescued = prefs[Keys.CIVILIANS_RESCUED] ?: 0,
            cyclopsDefeated = prefs[Keys.CYCLOPS_DEFEATED] ?: 0,
        )
    }

    suspend fun saveCheckpoint(
        sceneId: String,
        civiliansRescued: Int,
        cyclopsDefeated: Int,
    ) {
        context.campaignDataStore.edit { prefs ->
            prefs[Keys.HAS_SAVED_STORY] = true
            prefs[Keys.SAVED_SCENE_ID] = sceneId
            prefs[Keys.CIVILIANS_RESCUED] = maxOf(prefs[Keys.CIVILIANS_RESCUED] ?: 0, civiliansRescued)
            prefs[Keys.CYCLOPS_DEFEATED] = maxOf(prefs[Keys.CYCLOPS_DEFEATED] ?: 0, cyclopsDefeated)
        }
    }

    suspend fun markChapter1Completed(
        civiliansRescued: Int,
        cyclopsDefeated: Int,
    ) {
        context.campaignDataStore.edit { prefs ->
            prefs[Keys.HAS_SAVED_STORY] = true
            prefs[Keys.SAVED_SCENE_ID] = "SCENE_4_GAMEPLAY"
            prefs[Keys.CHAPTER_1_COMPLETED] = true
            prefs[Keys.CHAPTER_2_UNLOCKED] = true
            prefs[Keys.CIVILIANS_RESCUED] = maxOf(prefs[Keys.CIVILIANS_RESCUED] ?: 0, civiliansRescued)
            prefs[Keys.CYCLOPS_DEFEATED] = maxOf(prefs[Keys.CYCLOPS_DEFEATED] ?: 0, cyclopsDefeated)
        }
    }

    suspend fun resetForNewCampaign() {
        context.campaignDataStore.edit { prefs ->
            prefs[Keys.HAS_SAVED_STORY] = true
            prefs[Keys.SAVED_SCENE_ID] = "SCENE_1_INTRO"
            prefs[Keys.CIVILIANS_RESCUED] = 0
            prefs[Keys.CYCLOPS_DEFEATED] = 0
        }
    }
}
