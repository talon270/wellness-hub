// WELLNESS HUB · DESKTOP SHELL
//   · WINDOW         loads the existing app (frontendDist = repo root)
//   · TRAY           stays resident so the JS reminder scheduler keeps ticking
//   · CLOSE          hides to tray instead of quitting (PLAN A2)
//   · NOTIFICATIONS  tauri-plugin-notification, driven from JS via window.__TAURI__
//   · SINGLE-INST    a second launch focuses the running copy, never duplicates
//   · AUTOSTART      registers a login item once, so reminders survive a reboot
//   · UPDATE         check_update / run_update / relaunch, driven from the
//                    Settings "Desktop app" card — same shape as Study Tracker
//
// No app logic lives here. Everything the Hub does stays in js/. This is the
// native frame and the tray contract, nothing more.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use std::process::Command;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, WindowEvent,
};
use tauri_plugin_autostart::{ManagerExt, MacosLauncher};

/* The project root, baked in at compile time from where this crate lives.
   Rebuilding from a different checkout re-bakes the right value, so nothing
   here is hand-maintained the way install.sh's $HOME lookup is. */
fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("src-tauri always has a parent directory")
        .to_path_buf()
}

fn run_step(program: &str, args: &[&str], cwd: &PathBuf) -> Result<String, String> {
    let output = Command::new(program)
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("couldn't start {program}: {e}"))?;
    let text = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    if output.status.success() {
        Ok(text)
    } else {
        Err(format!("{program} {args:?} failed:\n{text}"))
    }
}

/* Any source file newer than the running binary means the installed copy is
   stale. Uses `find -newer` because coreutils already knows how to answer
   this question in one line — the ponytail-native option beats walking the
   tree in Rust. Excludes src-tauri/target (rebuilt on every check) and the
   *.backup-* files this project sprinkles alongside its live sources. */
/* `find` is fast (bails on the first newer file with -print -quit) but still
   forks a process — off the UI thread all the same, since a spinning disk or
   cold cache could add a second or two. */
#[tauri::command]
async fn check_update() -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(check_update_blocking)
        .await
        .map_err(|e| format!("update check panicked: {e}"))?
}

fn check_update_blocking() -> Result<bool, String> {
    let root = project_root();
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let output = Command::new("sh")
        .arg("-c")
        .arg(format!(
            "find {root} -type f \
                ! -path '*/src-tauri/target/*' \
                ! -path '*/src-tauri/dist/*' \
                ! -path '*/.git/*' \
                ! -name '*backup*' \
                -newer {exe} -print -quit",
            root = shell_escape(root.to_string_lossy().as_ref()),
            exe = shell_escape(exe.to_string_lossy().as_ref()),
        ))
        .output()
        .map_err(|e| e.to_string())?;
    Ok(!output.stdout.is_empty())
}

/* Minimal single-quote escape for a shell argument. Paths on this machine are
   plain ASCII, so this is enough — anything richer would need shell_words. */
fn shell_escape(s: &str) -> String {
    format!("'{}'", s.replace('\'', "'\\''"))
}

/* Rebuild + reinstall from the current index.html + js/ tree, so the Settings
   button does by hand what SETUP-desktop.md otherwise tells you to run in a
   terminal: copy-assets.sh, cargo build --release, install.sh. `async fn`
   is deliberate — a plain sync command runs on Tauri's UI thread and every
   minute the cargo build takes is a minute of "app is not responding"; the
   spawn_blocking pool is where the blocking Command::output() calls belong. */
#[tauri::command]
async fn run_update() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(run_update_blocking)
        .await
        .map_err(|e| format!("update task panicked: {e}"))?
}

fn run_update_blocking() -> Result<String, String> {
    let root = project_root();
    let cargo = if Command::new("cargo").arg("--version").output().is_ok() {
        "cargo".to_string()
    } else {
        // ponytail: GUI launches often don't inherit a login shell's PATH, so
        // rustup's default install location is the one fallback worth trying.
        format!("{}/.cargo/bin/cargo", std::env::var("HOME").unwrap_or_default())
    };

    let mut log = run_step("sh", &["src-tauri/copy-assets.sh"], &root)?;
    log.push_str(&run_step(
        &cargo,
        &["build", "--release", "--manifest-path", "src-tauri/Cargo.toml"],
        &root,
    )?);
    log.push_str(&run_step("sh", &["src-tauri/install.sh"], &root)?);
    Ok(log)
}

#[tauri::command]
async fn relaunch(app: AppHandle) -> Result<(), String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    Command::new(exe).spawn().map_err(|e| e.to_string())?;
    app.exit(0);
    Ok(())
}

fn main() {
    tauri::Builder::default()
        // Must be registered first: it intercepts a duplicate launch before any
        // window is created. The running instance gets the callback and surfaces.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .invoke_handler(tauri::generate_handler![check_update, run_update, relaunch])
        .setup(|app| {
            // Enable autostart ONCE, tracked by a marker in the app config dir.
            // Without the marker we would re-enable it on every launch, silently
            // undoing a user who later turned it off — the opposite of consent.
            if let Ok(dir) = app.path().app_config_dir() {
                let marker = dir.join(".autostart-initialized");
                if !marker.exists() {
                    let _ = app.autolaunch().enable();
                    let _ = std::fs::create_dir_all(&dir);
                    let _ = std::fs::write(&marker, b"1");
                }
            }

            let show = MenuItem::with_id(app, "show", "Open Wellness Hub", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Wellness Hub")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            // Close = minimize to tray. Quitting the reminder scheduler with it
            // is exactly the silent-app failure PLAN A2 guards against. Real
            // quit is the tray menu's "Quit".
            if let WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running Wellness Hub");
}
