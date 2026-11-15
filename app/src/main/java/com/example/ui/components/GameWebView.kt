package com.example.ui.components

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.webkit.WebViewAssetLoader
import com.example.data.GameSettings
import com.example.data.WeatherMode
import com.example.ui.GameScreenState

class GameBridgeController(
    private val evaluateJs: (String) -> Unit,
) {
    fun setJoystickInput(x: Float, y: Float) =
        evaluateJs("window.GameAPI && window.GameAPI.setJoystickInput($x, $y);")

    fun orbitCamera(dx: Float, dy: Float) =
        evaluateJs("window.GameAPI && window.GameAPI.orbitCamera($dx, $dy);")

    fun setRunning(running: Boolean) =
        evaluateJs("window.GameAPI && window.GameAPI.setRunning($running);")

    fun jump() = evaluateJs("window.GameAPI && window.GameAPI.jump();")
    fun lightAttack() = evaluateJs("window.GameAPI && window.GameAPI.lightAttack();")
    fun setAutoFire(enabled: Boolean) =
        evaluateJs("window.GameAPI && window.GameAPI.setAutoFire($enabled);")
    fun heavyAttack() = evaluateJs("window.GameAPI && window.GameAPI.heavyAttack();")
    fun startHeavyCharge() = evaluateJs("window.GameAPI && window.GameAPI.startHeavyCharge();")
    fun releaseHeavyCharge() = evaluateJs("window.GameAPI && window.GameAPI.releaseHeavyCharge();")
    fun dodge() = evaluateJs("window.GameAPI && window.GameAPI.dodge();")
    fun setBlocking(blocking: Boolean) =
        evaluateJs("window.GameAPI && window.GameAPI.setBlocking($blocking);")

    fun specialPower() = evaluateJs("window.GameAPI && window.GameAPI.specialPower();")
    fun activatePower(powerId: String) =
        evaluateJs("window.GameAPI && window.GameAPI.activatePower('$powerId');")
    fun ultimatePower() = evaluateJs("window.GameAPI && window.GameAPI.ultimatePower();")
    fun toggleAim() = evaluateJs("window.GameAPI && window.GameAPI.toggleAim();")
    fun reloadWeapon() = evaluateJs("window.GameAPI && window.GameAPI.reloadWeapon();")
    fun usePotion() = evaluateJs("window.GameAPI && window.GameAPI.usePotion();")
    fun interact() = evaluateJs("window.GameAPI && window.GameAPI.interact();")
    fun switchWeapon(slotIndex: Int) =
        evaluateJs("window.GameAPI && window.GameAPI.switchWeapon($slotIndex);")

    fun toggleTargetLock() = evaluateJs("window.GameAPI && window.GameAPI.toggleTargetLock();")
    fun resetCamera() = evaluateJs("window.GameAPI && window.GameAPI.resetCamera();")
    fun resetPlayer() = evaluateJs("window.GameAPI && window.GameAPI.resetPlayer();")
    fun startChapter1(startScene: String = "SCENE_1_INTRO") =
        evaluateJs("window.GameAPI && window.GameAPI.startChapter1('$startScene');")

    fun skipCutscene() = evaluateJs("window.GameAPI && window.GameAPI.skipCutscene();")
    fun continueCutscene() = evaluateJs("window.GameAPI && window.GameAPI.continueCutscene();")
    fun setMenuOrbit(enabled: Boolean) =
        evaluateJs("window.GameAPI && window.GameAPI.setMenuOrbit($enabled);")

    fun setPaused(paused: Boolean) =
        evaluateJs("window.GameAPI && window.GameAPI.setPaused($paused);")

    fun setWeather(weather: WeatherMode) =
        evaluateJs("window.GameAPI && window.GameAPI.setWeather('${weather.jsValue}');")

    fun applySettings(settings: GameSettings) {
        val script = buildString {
            append("if (window.GameAPI) {")
            append("window.GameAPI.setQuality('${settings.quality.jsValue}');")
            append("window.GameAPI.setShadowQuality('${settings.shadowQuality.jsValue}');")
            append("window.GameAPI.setWeather('${settings.weatherMode.jsValue}');")
            append("window.GameAPI.setResolutionScale(${settings.resolutionScale});")
            append("window.GameAPI.setFogEnabled(${settings.fogEnabled});")
            append("window.GameAPI.setAudioVolumes(${settings.masterVolume}, ${settings.musicVolume}, ${settings.sfxVolume});")
            append("window.GameAPI.setCameraSensitivity(${settings.cameraSensitivity});")
            append("window.GameAPI.setInvertCameraY(${settings.invertCameraY});")
            append("window.GameAPI.setCameraFollowDistance(${settings.cameraFollowDistance});")
            append("window.GameAPI.setJoystickSensitivity(${settings.joystickSensitivity});")
            append("window.GameAPI.setAimSensitivity(${settings.aimSensitivity});")
            append("}")
        }
        evaluateJs(script)
    }
}

private class ThreeWebJarPathHandler(private val context: Context) : WebViewAssetLoader.PathHandler {
    override fun handle(path: String): WebResourceResponse? {
        val cleanPath = path.trimStart('/')
        val resourcePath = "META-INF/resources/webjars/three/0.167.1/$cleanPath"
        val stream = context.classLoader.getResourceAsStream(resourcePath) ?: return null

        val mimeType = when {
            cleanPath.endsWith(".js") || cleanPath.endsWith(".mjs") -> "application/javascript"
            cleanPath.endsWith(".css") -> "text/css"
            else -> "application/octet-stream"
        }
        return WebResourceResponse(mimeType, "UTF-8", stream)
    }
}

private class AndroidGameJsBridge(
    private val onProgress: (Int, String) -> Unit,
    private val onReady: () -> Unit,
    private val onFps: (Int) -> Unit,
    private val onHudState: (String) -> Unit,
    private val onEvent: (String, String) -> Unit,
    private val onError: (String) -> Unit,
) {
    @JavascriptInterface
    fun onLoadProgress(percent: Int, message: String) = onProgress(percent, message)

    @JavascriptInterface
    fun onSceneReady() = onReady()

    @JavascriptInterface
    fun onFpsUpdate(fps: Int) = onFps(fps)

    @JavascriptInterface
    fun onHudStateUpdate(json: String) = onHudState(json)

    @JavascriptInterface
    fun onGameEvent(eventType: String, message: String) = onEvent(eventType, message)

    @JavascriptInterface
    fun onWebError(message: String) = onError(message)
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun GameWebView(
    screenState: GameScreenState,
    isSimulationPaused: Boolean,
    settings: GameSettings,
    isSceneReady: Boolean,
    onProgress: (Int, String) -> Unit,
    onSceneReady: () -> Unit,
    onFpsUpdate: (Int) -> Unit,
    onHudState: (String) -> Unit,
    onGameEvent: (String, String) -> Unit,
    onWebError: (String) -> Unit,
    onControllerReady: (GameBridgeController) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val webView = remember(context) {
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
            .addPathHandler("/webjars/three/", ThreeWebJarPathHandler(context))
            .build()

        WebView(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.parseColor("#09120E"))
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = WebView.OVER_SCROLL_NEVER

            this.settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                mediaPlaybackRequiresUserGesture = false
                cacheMode = WebSettings.LOAD_DEFAULT
            }

            addJavascriptInterface(
                AndroidGameJsBridge(
                    onProgress = { pct, msg -> post { onProgress(pct, msg) } },
                    onReady = { post { onSceneReady() } },
                    onFps = { fps -> post { onFpsUpdate(fps) } },
                    onHudState = { json -> post { onHudState(json) } },
                    onEvent = { type, msg -> post { onGameEvent(type, msg) } },
                    onError = { err -> post { onWebError(err) } },
                ),
                "AndroidBridge",
            )

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest,
                ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)
            }

            loadUrl("https://appassets.androidplatform.net/assets/game/index.html")
        }
    }

    val controller = remember(webView) {
        GameBridgeController { script ->
            webView.post { webView.evaluateJavascript(script, null) }
        }
    }

    LaunchedEffect(controller) { onControllerReady(controller) }
    LaunchedEffect(isSceneReady, settings) { if (isSceneReady) controller.applySettings(settings) }
    LaunchedEffect(isSceneReady, screenState) {
        if (isSceneReady) controller.setMenuOrbit(screenState != GameScreenState.PLAYING)
    }
    LaunchedEffect(isSceneReady, isSimulationPaused) {
        if (isSceneReady) controller.setPaused(isSimulationPaused)
    }

    DisposableEffect(lifecycleOwner, webView) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> webView.onResume()
                Lifecycle.Event.ON_PAUSE -> webView.onPause()
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            webView.destroy()
        }
    }

    AndroidView(factory = { webView }, modifier = modifier)
}
