package com.talon.wellnesshub

import android.app.AlarmManager
import android.content.Context
import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  // window.WHNative, read by js/native.js. Only the app's own bundled pages
  // load in this WebView, so the bridge is not reachable from the web.
  override fun onWebViewCreate(webView: WebView) {
    webView.addJavascriptInterface(Bridge(), "WHNative")
  }

  inner class Bridge {
    // A1: false means the plugin has quietly fallen back to inexact alarms.
    @JavascriptInterface
    fun exactAlarms(): Boolean {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
      val am = getSystemService(Context.ALARM_SERVICE) as AlarmManager
      return am.canScheduleExactAlarms()
    }

    // Picks which battery steps the first-run card shows (A8: Samsung only
    // needs "Never sleeping apps").
    @JavascriptInterface
    fun maker(): String = Build.MANUFACTURER ?: ""

    @JavascriptInterface
    fun sdk(): Int = Build.VERSION.SDK_INT

    // The one battery state Android lets an app read. Samsung's sleep lists
    // have no API, so Settings can only ask the user to confirm those.
    @JavascriptInterface
    fun batteryExempt(): Boolean {
      val pm = getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
      return pm.isIgnoringBatteryOptimizations(packageName)
    }

    // Opens the settings screen where the user grants each thing. Falls back
    // to the app's own details page, which every Android and skin has.
    @JavascriptInterface
    fun openSettings(what: String) {
      runOnUiThread {
        val pkg = android.net.Uri.parse("package:$packageName")
        val intent = when (what) {
          "notifications" -> android.content.Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, packageName)
          "exactAlarms" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
            android.content.Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, pkg) else null
          "battery" -> android.content.Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
          else -> null
        } ?: android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg)
        try { startActivity(intent) } catch (e: Exception) {
          startActivity(android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg))
        }
      }
    }

    // The app-drawn AOD (PLAN-android.md A13). No Android version on the 2a
    // lets a third-party app draw on the real AOD, so while the countdown face
    // is up the app shows over the lock screen, keeps the display awake, and
    // drops to near-minimum brightness. Pressing power still turns it off.
    @JavascriptInterface
    fun face(on: Boolean) {
      runOnUiThread {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) setShowWhenLocked(on)
        val lp = window.attributes
        lp.screenBrightness = if (on) FACE_BRIGHTNESS else WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
        window.attributes = lp
        if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        // The face is laid out for portrait and uses the whole screen, so it
        // holds portrait and hides the status and nav bars while it is up.
        // A swipe from an edge still brings the bars back briefly.
        requestedOrientation = if (on) ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
          else ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        val bars = WindowCompat.getInsetsController(window, window.decorView)
        if (on) {
          bars.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
          bars.hide(WindowInsetsCompat.Type.systemBars())
        } else bars.show(WindowInsetsCompat.Type.systemBars())
      }
    }

    // Keep-awake alone, for an idle or paused face (js/native.js awake()).
    @JavascriptInterface
    fun awake(on: Boolean) {
      runOnUiThread {
        if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }

    // ---- app updates (PLAN-android-updater.md B3), read by js/androidupdate.js ----
    // The check happens in JS; download, verification and install live in Updater.kt.

    // The number the update check compares a release against. Tauri derives it from
    // tauri.conf.json's version (1.0.0 -> 1000000).
    @Suppress("DEPRECATION")
    @JavascriptInterface
    fun versionCode(): Int {
      val info = packageManager.getPackageInfo(packageName, 0)
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) info.longVersionCode.toInt() else info.versionCode
    }

    @JavascriptInterface
    fun versionName(): String = packageManager.getPackageInfo(packageName, 0).versionName ?: ""

    // Before Android 8 there was one global "unknown sources" switch and no per-app gate.
    @JavascriptInterface
    fun canInstall(): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.O || packageManager.canRequestPackageInstalls()

    // The per-app "Install unknown apps" screen, which only the user can switch on.
    @JavascriptInterface
    fun openInstallSettings() {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
      runOnUiThread {
        startActivity(android.content.Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
          android.net.Uri.parse("package:$packageName")))
      }
    }

    // "started" | "busy" | "needs-permission" | "bad-url" | "bad-hash".
    @JavascriptInterface
    fun install(url: String, sha256: String, size: Long): String = updater.start(url, sha256, size)

    // {"phase","bytes","total","error"}; phase is idle | downloading | verifying |
    // installing | confirming | success | error.
    @JavascriptInterface
    fun installStatus(): String = updater.status()

    // Android can refuse to open its confirmation screen from the background, silently.
    @JavascriptInterface
    fun reshow(): Boolean = updater.reshow()
  }

  private val updater by lazy { Updater(applicationContext) }

  companion object {
    // 0.05 read as too dim on the 2a (seen 2026-09-23); raised by 5 points.
    const val FACE_BRIGHTNESS = 0.10f
  }
}
