package com.talon.wellnesshub

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageInstaller
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.content.IntentCompat
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

/**
 * WELLNESS HUB · ANDROID UPDATER  (PLAN-android-updater.md B3)
 *
 * Download an APK, verify it, hand it to Android's PackageInstaller. js/androidupdate.js
 * decides WHETHER to update; this only does it, and reports back through status().
 *
 * What protects the phone, in order of how much weight it carries:
 *   1. Android refuses any APK not signed with the key this copy carries
 *      (INSTALL_FAILED_UPDATE_INCOMPATIBLE). That signature authenticates an update.
 *   2. The session is pinned to this app's package name, whatever the file claims.
 *   3. https only, at every redirect hop (github.com -> objects.githubusercontent.com).
 *   4. Exact byte count and SHA-256 must match the release. This catches a truncated
 *      or corrupt download; it does NOT authenticate, since whoever edits the release
 *      can edit the hash.
 *
 * Nothing here can run on a desktop or in a browser, and none of it has been run yet:
 * B6 of the plan is installing an update over a seeded app on the 2a.
 */
class Updater(private val app: Context) {
  @Volatile private var phase = "idle"
  @Volatile private var bytes = 0L
  @Volatile private var total = 0L
  @Volatile private var error: String? = null
  @Volatile private var pendingConfirm: Intent? = null
  private var receiver: BroadcastReceiver? = null

  // A finished install kills this process, so a leftover 13 MB file from the last
  // one is cleaned up by the next launch rather than by the install that made it.
  init { File(app.cacheDir, DIR).deleteRecursively() }

  fun status(): String = JSONObject()
    .put("phase", phase).put("bytes", bytes).put("total", total)
    .put("error", error ?: JSONObject.NULL).toString()

  /** "started" | "busy" | "needs-permission" | "bad-url" | "bad-hash". */
  @Synchronized
  fun start(url: String, sha256: String, size: Long): String {
    if (!url.startsWith("https://")) return "bad-url"
    if (!HEX64.matches(sha256)) return "bad-hash"
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !app.packageManager.canRequestPackageInstalls()) {
      return "needs-permission"
    }
    if (phase in BUSY) return "busy"
    set("downloading", 0L, size, null)
    Thread { run(url, sha256.lowercase(), size) }.start()
    return "started"
  }

  /**
   * Show the installer's confirmation screen again. Android can refuse to launch it
   * from a receiver while the app is in the background (a locked phone, say), and
   * that refusal is silent. This is user-driven on purpose: relaunching it from
   * onResume would reopen a dialog the person had just cancelled.
   */
  fun reshow(): Boolean {
    val i = pendingConfirm ?: return false
    return try { app.startActivity(Intent(i).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); true } catch (e: Exception) { false }
  }

  private fun set(p: String, b: Long, t: Long, e: String?) { phase = p; bytes = b; total = t; error = e }

  private fun fail(message: String) {
    pendingConfirm = null
    File(app.cacheDir, DIR).deleteRecursively()
    set("error", bytes, total, message)
  }

  private fun run(url: String, sha: String, expected: Long) {
    try {
      val dir = File(app.cacheDir, DIR).apply { deleteRecursively(); mkdirs() }
      val apk = File(dir, "update.apk")
      download(url, apk, expected)
      set("verifying", apk.length(), expected, null)
      if (sha256(apk) != sha) throw IOException("the download's SHA-256 doesn't match the release's, so it was thrown away")
      set("installing", apk.length(), expected, null)
      commit(apk)
    } catch (e: Exception) {
      fail(e.message ?: e.javaClass.simpleName)
    }
  }

  private fun download(start: String, out: File, expected: Long) {
    var u = URL(start)
    var hops = 0
    while (true) {
      val c = u.openConnection() as HttpURLConnection
      c.instanceFollowRedirects = false   // followed by hand below so every hop can be checked
      c.connectTimeout = 15_000
      c.readTimeout = 30_000
      try {
        val code = c.responseCode
        if (code in 301..308 && code != 304) {
          val loc = c.getHeaderField("Location") ?: throw IOException("a redirect with no Location")
          u = URL(u, loc)
          if (u.protocol != "https") throw IOException("a redirect to ${u.protocol} was refused")
          if (++hops > MAX_HOPS) throw IOException("too many redirects")
          continue
        }
        if (code != 200) throw IOException("the server answered HTTP $code")
        val len = c.contentLengthLong
        if (len >= 0 && len != expected) throw IOException("the server says $len bytes; the release says $expected")
        c.inputStream.use { input ->
          out.outputStream().use { o ->
            val buf = ByteArray(64 * 1024)
            var got = 0L
            var n = input.read(buf)
            while (n >= 0) {
              o.write(buf, 0, n)
              got += n
              if (got > expected) throw IOException("more data than the release's $expected bytes")
              bytes = got
              n = input.read(buf)
            }
          }
        }
        if (out.length() != expected) throw IOException("received ${out.length()} of $expected bytes")
        return
      } finally {
        c.disconnect()
      }
    }
  }

  private fun sha256(f: File): String {
    val md = MessageDigest.getInstance("SHA-256")
    f.inputStream().use { i ->
      val b = ByteArray(64 * 1024)
      var n = i.read(b)
      while (n >= 0) { md.update(b, 0, n); n = i.read(b) }
    }
    return md.digest().joinToString("") { "%02x".format(it) }
  }

  private fun commit(apk: File) {
    val installer = app.packageManager.packageInstaller
    val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
    params.setAppPackageName(app.packageName)   // this package only, whatever the file says it is
    val id = installer.createSession(params)
    register()
    val session = installer.openSession(id)
    try {
      apk.inputStream().use { input ->
        session.openWrite("update.apk", 0, apk.length()).use { out ->
          input.copyTo(out)
          session.fsync(out)
        }
      }
      // FLAG_MUTABLE from Android 12: the installer fills in the result extras.
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0)
      val result = PendingIntent.getBroadcast(app, id, Intent(ACTION).setPackage(app.packageName), flags)
      session.commit(result.intentSender)
    } catch (e: Exception) {
      session.abandon()
      throw e
    } finally {
      session.close()
    }
  }

  private fun register() {
    if (receiver != null) return
    val r = object : BroadcastReceiver() {
      override fun onReceive(c: Context, i: Intent) {
        when (val s = i.getIntExtra(PackageInstaller.EXTRA_STATUS, -1)) {
          PackageInstaller.STATUS_PENDING_USER_ACTION -> {
            val confirm = IntentCompat.getParcelableExtra(i, Intent.EXTRA_INTENT, Intent::class.java)
            if (confirm == null) {
              fail("Android asked for confirmation but did not say what to show")
            } else {
              pendingConfirm = confirm
              set("confirming", bytes, total, null)
              reshow()
            }
          }
          PackageInstaller.STATUS_SUCCESS -> { pendingConfirm = null; set("success", bytes, total, null) }
          else -> fail(i.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE)?.let { "$it (code $s)" }
            ?: "Android refused the install (code $s)")
        }
      }
    }
    ContextCompat.registerReceiver(app, r, IntentFilter(ACTION), ContextCompat.RECEIVER_NOT_EXPORTED)
    receiver = r
  }

  companion object {
    private const val DIR = "updates"
    private const val ACTION = "com.talon.wellnesshub.UPDATE_RESULT"
    private const val MAX_HOPS = 5
    private val HEX64 = Regex("[0-9a-fA-F]{64}")
    private val BUSY = setOf("downloading", "verifying", "installing", "confirming")
  }
}
