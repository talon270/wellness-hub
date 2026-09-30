// WELLNESS HUB · DESKTOP SHELL
//   · WINDOW         loads the existing app (frontendDist = repo root)
//   · TRAY           stays resident so the JS reminder scheduler keeps ticking [desktop]
//   · CLOSE          hides to tray instead of quitting (PLAN A2) [desktop]
//   · NOTIFICATIONS  tauri-plugin-notification, driven from JS via window.__TAURI__ [desktop + mobile]
//   · SINGLE-INST    a second launch focuses the running copy, never duplicates [desktop]
//   · AUTOSTART      registers a login item once, so reminders survive a reboot [desktop]
//   · UPDATE         check_update / run_update / relaunch, driven from the
//                    Settings "Desktop app" card — same shape as Study Tracker [desktop]
//   · MOBILE ENTRY   `run()` is `#[tauri::mobile_entry_point]` on Android/iOS;
//                    main.rs calls the same `run()` on desktop
//
// No app logic lives here. Everything the Hub does stays in js/. This is the
// native frame and the tray contract, nothing more.

#[cfg(desktop)]
use std::path::PathBuf;
#[cfg(desktop)]
use std::process::Command;
#[cfg(desktop)]
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, WindowEvent,
};
#[cfg(desktop)]
use tauri_plugin_autostart::{ManagerExt, MacosLauncher};

/* Where install.sh records the source tree it installed from, so a moved
   project can be pointed at again without a rebuild. */
#[cfg(desktop)]
fn root_hint_file() -> PathBuf {
    PathBuf::from(std::env::var("HOME").unwrap_or_default())
        .join(".local/share/wellness-hub/source-root")
}

/* The project root, resolved at RUNTIME.

   It used to be `env!("CARGO_MANIFEST_DIR")` alone, on the reasoning that
   rebuilding from a different checkout re-bakes the right value. That is true
   and useless: the moment the folder moves, the baked path is gone, and the
   rebuild that would fix it is the very thing that stops working. Moving this
   project from ~/Claude/Helth to ~/SyncedWork/Claude/Helth turned the Update
   button into "couldn't start sh: No such file or directory" — because a
   missing `current_dir` makes Command::output() fail with ENOENT and name the
   program rather than the directory.

   So: the environment override first (an escape hatch that needs no rebuild),
   then whatever install.sh recorded, then the compile-time location. A
   candidate only counts if it actually holds src-tauri/Cargo.toml — an empty
   or half-moved directory is not the source tree. None means we genuinely
   cannot find it, which callers report as that rather than as a missing `sh`. */
#[cfg(desktop)]
fn project_root() -> Option<PathBuf> {
    let mut candidates: Vec<PathBuf> = Vec::new();

    if let Ok(v) = std::env::var("WELLNESS_HUB_ROOT") {
        if !v.trim().is_empty() {
            candidates.push(PathBuf::from(v.trim()));
        }
    }
    if let Ok(v) = std::fs::read_to_string(root_hint_file()) {
        if !v.trim().is_empty() {
            candidates.push(PathBuf::from(v.trim()));
        }
    }
    if let Some(baked) = PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent() {
        candidates.push(baked.to_path_buf());
    }

    pick_root(candidates)
}

/* The part that got this wrong, split out so it can be tested without an
   environment: first candidate that actually holds src-tauri/Cargo.toml wins.
   A path that no longer exists is skipped rather than handed to current_dir,
   which is the whole bug. */
#[cfg(desktop)]
fn pick_root(candidates: Vec<PathBuf>) -> Option<PathBuf> {
    candidates
        .into_iter()
        .find(|p| p.join("src-tauri").join("Cargo.toml").is_file())
}

/* One message for "the source tree has moved", written where the user will
   actually read it: the Settings card. */
#[cfg(desktop)]
fn missing_root_error() -> String {
    format!(
        "Can't find the project folder this app was built from. It was at {baked}, \
         which no longer exists — the folder has been moved or renamed.\n\n\
         Fix it either way:\n\
         · run src-tauri/install.sh from the new location (records the new path, no rebuild), or\n\
         · launch with WELLNESS_HUB_ROOT=/path/to/Helth set.",
        baked = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .map(|p| p.display().to_string())
            .unwrap_or_else(|| "?".into()),
    )
}

#[cfg(desktop)]
fn run_step(program: &str, args: &[&str], cwd: &PathBuf) -> Result<String, String> {
    /* Checked before spawning, because Command::output() reports a missing cwd
       as ENOENT against the PROGRAM — which is how a moved project folder came
       out as "couldn't start sh: No such file or directory" and sent the blame
       to the wrong place entirely. */
    if !cwd.is_dir() {
        return Err(format!(
            "working directory {} doesn't exist, so {program} was never started.",
            cwd.display()
        ));
    }
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
#[cfg(desktop)]
#[tauri::command]
async fn check_update() -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(check_update_blocking)
        .await
        .map_err(|e| format!("update check panicked: {e}"))?
}

#[cfg(desktop)]
fn check_update_blocking() -> Result<bool, String> {
    let root = project_root().ok_or_else(missing_root_error)?;
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
#[cfg(desktop)]
fn shell_escape(s: &str) -> String {
    format!("'{}'", s.replace('\'', "'\\''"))
}

/* Rebuild + reinstall from the current index.html + js/ tree, so the Settings
   button does by hand what SETUP-desktop.md otherwise tells you to run in a
   terminal: copy-assets.sh, cargo build --release, install.sh. `async fn`
   is deliberate — a plain sync command runs on Tauri's UI thread and every
   minute the cargo build takes is a minute of "app is not responding"; the
   spawn_blocking pool is where the blocking Command::output() calls belong. */
#[cfg(desktop)]
#[tauri::command]
async fn run_update() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(run_update_blocking)
        .await
        .map_err(|e| format!("update task panicked: {e}"))?
}

#[cfg(desktop)]
fn run_update_blocking() -> Result<String, String> {
    let root = project_root().ok_or_else(missing_root_error)?;
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

/* install.sh replaces the binary while this process is still running it, and
   Linux then reports the running executable as "<path> (deleted)". That string
   is what current_exe() returns, it names no file, and spawning it fails with
   ENOENT — so after every Update the Relaunch button errored out before
   reaching app.exit(0): no restart, no quit, and no message either. The real
   path is the same string without the suffix, and it now holds the new build. */
#[cfg(desktop)]
fn relaunch_target(exe: PathBuf) -> PathBuf {
    match exe.to_string_lossy().strip_suffix(" (deleted)") {
        Some(live) => PathBuf::from(live),
        None => exe,
    }
}

/* The new copy starts from a shell that first waits for this process to be
   gone. Spawning it directly would race the single-instance plugin: the new
   copy asks "is anyone already running?", finds this one still shutting down,
   hands over its arguments and exits — and this one then quits as well. The
   wait is capped at 5s (50 × 0.1s) so a launcher that never reaps its child
   can't leave the helper looping on a zombie. $1 = old pid, $2 = binary. */
#[cfg(desktop)]
const RELAUNCH_SH: &str =
    r#"i=0; while kill -0 "$1" 2>/dev/null && [ $i -lt 50 ]; do sleep 0.1; i=$((i+1)); done; exec "$2""#;

#[cfg(desktop)]
#[tauri::command]
async fn relaunch(app: AppHandle) -> Result<(), String> {
    let exe = relaunch_target(std::env::current_exe().map_err(|e| e.to_string())?);
    /* Checked before quitting: if the binary isn't there, staying open with a
       message beats closing the app and starting nothing. */
    if !exe.is_file() {
        return Err(format!("{} no longer exists, so there is nothing to relaunch.", exe.display()));
    }
    Command::new("sh")
        .args(["-c", RELAUNCH_SH, "wellness-hub-relaunch"])
        .arg(std::process::id().to_string())
        .arg(&exe)
        .spawn()
        .map_err(|e| format!("couldn't start the relaunch helper: {e}"))?;
    app.exit(0);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // Must be registered first: it intercepts a duplicate launch before any
    // window is created. The running instance gets the callback and surfaces.
    // Single-instance and autostart are desktop concepts; Android/iOS handle
    // both at the OS level already.
    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None));

    let builder = builder.plugin(tauri_plugin_notification::init());

    // The updater commands (check_update/run_update/relaunch) rebuild this
    // machine's own checkout — meaningless on a phone, which installs a
    // signed APK instead. Mobile registers no commands rather than a
    // never-called stand-in.
    #[cfg(desktop)]
    let builder = builder.invoke_handler(tauri::generate_handler![check_update, run_update, relaunch]);

    let builder = builder.setup(|app| {
        let _ = &app; // unused on mobile: setup below is desktop-only so far
        #[cfg(desktop)]
        {
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
        }

        Ok(())
    });

    // Close = minimize to tray. Quitting the reminder scheduler with it
    // is exactly the silent-app failure PLAN A2 guards against. Real
    // quit is the tray menu's "Quit". There is no tray on mobile, so a
    // close there is a real close.
    #[cfg(desktop)]
    let builder = builder.on_window_event(|window, event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            let _ = window.hide();
            api.prevent_close();
        }
    });

    builder
        .run(tauri::generate_context!())
        .expect("error while running Wellness Hub");
}

#[cfg(all(test, desktop))]
mod tests {
    use super::*;

    /* The exact failure this replaced: a baked path that no longer exists was
       passed straight to Command::current_dir, which fails with ENOENT and
       blames the program ("couldn't start sh"). */
    #[test]
    fn skips_a_path_that_no_longer_exists() {
        let real = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .to_path_buf();
        /* Any path that cannot exist will do. Deliberately not the real old
           location: hard-coding someone's home directory puts a username in a
           public repo and makes the test meaningless on any other machine. */
        let dead = PathBuf::from("/nonexistent/moved-away/project-root");
        assert!(!dead.exists(), "the test needs a path that genuinely isn't there");

        assert_eq!(pick_root(vec![dead.clone()]), None);
        assert_eq!(pick_root(vec![dead, real.clone()]), Some(real));
    }

    /* The exact string /proc/self/exe produced in the scratchpad repro after
       `install -m755` replaced a running binary. */
    #[test]
    fn relaunch_target_drops_the_deleted_suffix() {
        let live = PathBuf::from("/home/u/.local/bin/wellness-hub");
        let stale = PathBuf::from("/home/u/.local/bin/wellness-hub (deleted)");
        assert_eq!(relaunch_target(stale), live);
        assert_eq!(relaunch_target(live.clone()), live);
    }

    /* A directory that exists but isn't the project is not the project. */
    #[test]
    fn rejects_a_directory_without_the_crate() {
        assert_eq!(pick_root(vec![PathBuf::from("/tmp")]), None);
    }

    /* Earlier candidates win, so WELLNESS_HUB_ROOT overrides the recorded and
       baked paths rather than merely being consulted. */
    #[test]
    fn honours_candidate_order() {
        let real = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .to_path_buf();
        assert_eq!(
            pick_root(vec![PathBuf::from("/nonexistent"), real.clone(), PathBuf::from("/tmp")]),
            Some(real)
        );
    }
}
