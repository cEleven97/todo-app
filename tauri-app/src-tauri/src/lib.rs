#[cfg(target_os = "macos")]
use objc2::msg_send;

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{
    GetWindowLongPtrW, SetLayeredWindowAttributes, SetWindowLongPtrW, GWL_EXSTYLE, LWA_ALPHA,
    WS_EX_LAYERED,
};

#[tauri::command]
#[cfg(target_os = "macos")]
fn set_window_alpha(window: tauri::WebviewWindow, alpha: f64) -> Result<(), String> {
    let ns_window = window
        .ns_window()
        .map_err(|e| e.to_string())?
        as *mut objc2::runtime::AnyObject;
    unsafe {
        let _: () = msg_send![ns_window, setAlphaValue: alpha];
    }
    Ok(())
}

#[tauri::command]
#[cfg(target_os = "windows")]
fn set_window_alpha(window: tauri::WebviewWindow, alpha: f64) -> Result<(), String> {
    let hwnd = window.hwnd().map_err(|e| e.to_string())?;
    let alpha_byte = (alpha.clamp(0.0, 1.0) * 255.0) as u8;
    unsafe {
        let ex_style = GetWindowLongPtrW(hwnd, GWL_EXSTYLE);
        SetWindowLongPtrW(hwnd, GWL_EXSTYLE, ex_style | WS_EX_LAYERED as isize);
        let _ = SetLayeredWindowAttributes(hwnd, windows::Win32::Foundation::COLORREF(0), alpha_byte, LWA_ALPHA);
    }
    Ok(())
}

#[tauri::command]
#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn set_window_alpha(_window: tauri::WebviewWindow, _alpha: f64) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, set_window_alpha])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
