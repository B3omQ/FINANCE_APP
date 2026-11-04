// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn get_storage_file(app: &tauri::AppHandle, filename: &str) -> PathBuf {
    if let Ok(data_dir) = app.path().app_data_dir() {
        let _ = fs::create_dir_all(&data_dir);
        let file = data_dir.join(filename);
        if file.exists() {
            return file;
        }
    }

    // Android fallback locations
    let paths = [
        format!("/data/data/com.financeapp.app/files/{}", filename),
        format!("/data/user/0/com.financeapp.app/files/{}", filename),
        format!("/data/data/com.financeapp.app/no_backup/{}", filename),
        format!("/data/user/0/com.financeapp.app/no_backup/{}", filename),
    ];

    for p in paths {
        let pb = PathBuf::from(p);
        if pb.exists() {
            return pb;
        }
    }

    // Default to app_data_dir or filename
    app.path()
        .app_data_dir()
        .map(|d| d.join(filename))
        .unwrap_or_else(|_| PathBuf::from(filename))
}

fn get_transactions_file(app: &tauri::AppHandle) -> PathBuf {
    get_storage_file(app, "pending_bank_transactions.json")
}

fn get_logs_file(app: &tauri::AppHandle) -> PathBuf {
    get_storage_file(app, "notification_diagnostic_logs.json")
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_pending_bank_transactions(app: tauri::AppHandle) -> Result<String, String> {
    let file = get_transactions_file(&app);
    if file.exists() {
        fs::read_to_string(&file).map_err(|e| e.to_string())
    } else {
        Ok("[]".to_string())
    }
}

#[tauri::command]
fn update_bank_transaction_status(app: tauri::AppHandle, id: String, status: String) -> Result<bool, String> {
    let file = get_transactions_file(&app);
    if !file.exists() {
        return Ok(false);
    }

    let content = fs::read_to_string(&file).map_err(|e| e.to_string())?;
    let mut val: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    let mut found = false;
    if let Some(arr) = val.as_array_mut() {
        for item in arr {
            if item.get("id").and_then(|i| i.as_str()) == Some(&id) {
                if let Some(obj) = item.as_object_mut() {
                    obj.insert("status".to_string(), serde_json::Value::String(status.clone()));
                    found = true;
                }
            }
        }
    }

    if found {
        let serialized = serde_json::to_string_pretty(&val).map_err(|e| e.to_string())?;
        fs::write(&file, serialized).map_err(|e| e.to_string())?;
    }

    Ok(found)
}

#[tauri::command]
fn get_bank_notification_logs(app: tauri::AppHandle) -> Result<String, String> {
    let file = get_logs_file(&app);
    if file.exists() {
        fs::read_to_string(&file).map_err(|e| e.to_string())
    } else {
        Ok("[]".to_string())
    }
}

#[tauri::command]
fn clear_bank_notification_logs(app: tauri::AppHandle) -> Result<bool, String> {
    let file = get_logs_file(&app);
    if file.exists() {
        let _ = fs::remove_file(&file);
    }
    Ok(true)
}

#[tauri::command]
fn add_mock_bank_transaction(
    app: tauri::AppHandle,
    bank_code: String,
    bank_name: String,
    amount: i64,
    tx_type: String,
    content: String,
) -> Result<String, String> {
    let file = get_transactions_file(&app);
    let mut list = if file.exists() {
        let raw = fs::read_to_string(&file).unwrap_or_else(|_| "[]".to_string());
        serde_json::from_str::<Vec<serde_json::Value>>(&raw).unwrap_or_default()
    } else {
        Vec::new()
    };

    let new_id = format!("mock-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
    let new_item = serde_json::json!({
        "id": new_id,
        "bankCode": bank_code,
        "bankName": bank_name,
        "amount": amount,
        "type": tx_type,
        "accountNumber": "9999***",
        "content": content,
        "timestamp": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis(),
        "rawTitle": format!("Biến động số dư {}", bank_name),
        "rawText": format!("GD: {} {} VND. ND: {}", if tx_type == "expense" { "-" } else { "+" }, amount, content),
        "packageName": "com.mock.bank",
        "status": "pending"
    });

    list.insert(0, new_item);
    if list.len() > 50 {
        list.truncate(50);
    }

    let serialized = serde_json::to_string_pretty(&list).map_err(|e| e.to_string())?;
    fs::write(&file, serialized).map_err(|e| e.to_string())?;

    Ok(new_id)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_pending_bank_transactions,
            update_bank_transaction_status,
            get_bank_notification_logs,
            clear_bank_notification_logs,
            add_mock_bank_transaction
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
