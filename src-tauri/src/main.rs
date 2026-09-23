// WELLNESS HUB · DESKTOP ENTRY
//   · Thin binary entry point only. All app wiring — window, tray,
//     notifications, single-instance, autostart, updater — lives in lib.rs,
//     whose `run()` doubles as the Tauri mobile entry point.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    wellness_hub_lib::run();
}
