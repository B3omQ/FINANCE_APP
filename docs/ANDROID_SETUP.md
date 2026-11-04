# Hướng Dẫn Thiết Lập Môi Trường & Build Android APK (Phase 6)

Tài liệu này hướng dẫn chi tiết cách thiết lập Android Toolchain trên máy tính Windows để biên dịch file cài đặt Android APK/AAB cho ứng dụng Finance App bằng Tauri v2.

---

## 1. Yêu Cầu Tiên Quyết (Prerequisites)

1. **Java Development Kit (JDK 17 hoặc 21)**:
   - Đã có sẵn trên máy tính (`javac -version`).
2. **Rust & Cargo**:
   - Đã có sẵn trên máy tính (`rustc -version`, `cargo -version`).

---

## 2. Các Bước Cài Đặt Android SDK & NDK

### Bước 2.1: Cài đặt Android Studio hoặc Android Command Line Tools
- Nếu chưa có, tải và cài đặt [Android Studio](https://developer.android.com/studio).
- Mở Android Studio → Chọn **More Actions** → **SDK Manager**:
  1. Tab **SDK Platforms**:
     - Tick chọn: **Android 14.0 (API 34)** hoặc **Android 15.0 (API 35)**.
  2. Tab **SDK Tools**:
     - Tick chọn: **Android SDK Build-Tools** (bản 34.0.0 hoặc mới hơn).
     - Tick chọn: **NDK (Side by side)** (chọn bản 26.x hoặc 27.x).
     - Tick chọn: **Android SDK Command-line Tools (latest)**.
     - Tick chọn: **Android SDK Platform-Tools**.
  3. Bấm **Apply** để hệ thống tự động tải và cài đặt vào máy.

### Bước 2.2: Cấu hình Biến Môi Trường (Environment Variables)
Sau khi Android Studio cài đặt xong SDK (mặc định tại `%LOCALAPPDATA%\Android\Sdk` hoặc thư mục bạn chọn, ví dụ `D:\Android\Sdk`):

1. Mở **Start Menu** → Gõ `env` → Chọn **Edit the system environment variables**.
2. Bấm vào **Environment Variables...**:
3. Tại mục **User variables** (hoặc **System variables**), thiết lập:
   - `ANDROID_HOME` = Đường dẫn thư mục SDK (ví dụ: `C:\Users\<Tên_User>\AppData\Local\Android\Sdk` hoặc `D:\Android\Sdk`).
   - `NDK_HOME` = Đường dẫn thư mục NDK bên trong SDK (ví dụ: `%ANDROID_HOME%\ndk\<phiên_bản_ndk>`).
4. Thêm vào biến `Path`:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\cmdline-tools\latest\bin`

### Bước 2.3: Thêm các Target CPU Android vào Rust
Mở PowerShell và chạy lệnh sau để thêm 4 kiến trúc Android thông dụng:

```powershell
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
```

---

## 3. Khởi Tạo & Biên Dịch (Build APK)

### Cách 1: Sử dụng Menu Tự Động trong `start.bat`
Chạy file `start.bat` tại thư mục gốc của dự án:
- Chọn menu: **`[7] Kiem tra moi truong & Build Android APK`**.
- Hệ thống sẽ tự động chạy Preflight Check (kiểm tra Java, SDK, NDK, Rust targets) và hướng dẫn build.

### Cách 2: Chạy Bằng Dòng Lệnh

1. **Khởi tạo dự án Android (chỉ cần chạy lần đầu)**:
   ```bash
   pnpm tauri android init
   ```
   Lệnh này sẽ tạo thư mục `src-tauri/gen/android` chứa toàn bộ Gradle project.

2. **Chạy thử trên thiết bị thật hoặc máy ảo (Dev Mode)**:
   - Cắm điện thoại Android vào máy tính, bật chế độ **USB Debugging** (Gỡ lỗi USB).
   - Chạy lệnh:
     ```bash
     pnpm tauri android dev
     ```

3. **Biên dịch file APK Release để cài vào máy**:
   ```bash
   pnpm tauri android build --apk
   ```
   File APK thành phẩm sẽ nằm tại:  
   `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`

---

## 4. Ghi Chú Về Lưu Trữ SQLite Trên Android
- Ứng dụng sử dụng `tauri-plugin-sql` chạy trực tiếp SQLite trên Android.
- Tệp cơ sở dữ liệu `finance.db` được lưu tự động trong vùng nhớ nội bộ an toàn của app (`/data/data/com.financeapp.app/files/finance.db`), được bảo vệ hoàn toàn bởi sandbox của hệ điều hành Android.

