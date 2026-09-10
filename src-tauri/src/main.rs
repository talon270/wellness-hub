// WELLNESS HUB · DESKTOP SHELL
//   · WINDOW         loads the existing app (frontendDist = repo root)
//   · TRAY           stays resident so the JS reminder scheduler keeps ticking
//   · CLOSE          hides to tray instead of quitting (PLAN A2)
//   · NOTIFICATIONS  tauri-plugin-notification, driven from JS via window.__TAURI__
//   · SINGLE-INST    a second launch focuses the running copy, never duplicates
//   · AUTOSTART      registers a login item once, so reminders survive a reboot
//
// No app logic lives here. Everything the Hub does stays in js/. This is the
// native frame and the tray contract, nothing more.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, WindowEvent,
};
use tauri_plugin_autostart::{ManagerExt, MacosLauncher};

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
