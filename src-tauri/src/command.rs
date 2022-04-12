use tauri::Manager;

#[tauri::command]
pub async fn show(window: tauri::Window) {
  window.get_window("main").unwrap().show().unwrap();
}
