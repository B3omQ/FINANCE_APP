@echo off
chcp 65001 >nul
title Finance App Launcher
cd /d "%~dp0"

REM Tu dong nap thu muc .cargo\bin neu co
if exist "%USERPROFILE%\.cargo\bin" (
    set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
)

REM Tu dong nap bien Android Toolchain neu chua co
if "%ANDROID_HOME%"=="" (
    if exist "D:\Android\Sdk" set "ANDROID_HOME=D:\Android\Sdk"
    if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
)

if "%NDK_HOME%"=="" (
    if exist "%ANDROID_HOME%\ndk" (
        for /d %%i in ("%ANDROID_HOME%\ndk\*") do set "NDK_HOME=%%i"
    )
)

if "%JAVA_HOME%"=="" (
    if exist "C:\Program Files\Java\jdk-17" set "JAVA_HOME=C:\Program Files\Java\jdk-17"
    if exist "C:\Program Files\Java\jdk-21" set "JAVA_HOME=C:\Program Files\Java\jdk-21"
)

if exist "%ANDROID_HOME%\platform-tools" (
    set "PATH=%ANDROID_HOME%\platform-tools;%PATH%"
)
if exist "%ANDROID_HOME%\cmdline-tools\latest\bin" (
    set "PATH=%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%"
)

echo ========================================================
echo               FINANCE APP - LAUNCHER
echo ========================================================
echo.

REM Kiem tra node_modules
if not exist "node_modules" (
    echo [THONG BAO] Chua tim thay thu vien node_modules.
    echo Dang tu dong cai dat thu vien pnpm install...
    call pnpm install
    if errorlevel 1 (
        echo [LOI] Khong the cai dat thu vien.
        pause
        exit /b 1
    )
    echo [OK] Cai dat thu vien hoan tat!
    echo.
)

:MENU
cls
echo ========================================================
echo               FINANCE APP - KHOI CHAY DU AN
echo ========================================================
echo.
echo   [1] Chay ung dung Web Dev [pnpm dev] (Nhanh, khong can Rust)
echo   [2] Chay ung dung Desktop Tauri [pnpm tauri dev] (Can Rust)
echo   [3] Build goi Web Frontend [pnpm build]
echo   [4] Build bo cai dat Desktop Windows [pnpm tauri build] (Can Rust)
echo   [5] Chay kiem tra ma nguon [pnpm test, typecheck, lint]
echo   [6] Don dep dung luong o dia [Xoa file build cache ~8GB]
echo   [7] Kiem tra moi truong va Build Android APK [Tauri Android]
echo   [0] Thoat
echo.
echo ========================================================

set CHOICE=1
set /p CHOICE="Nhap lua chon cua ban [Mac dinh: 1]: "

if "%CHOICE%"=="1" goto DEV_WEB
if "%CHOICE%"=="2" goto CHECK_RUST_DEV
if "%CHOICE%"=="3" goto BUILD_WEB
if "%CHOICE%"=="4" goto CHECK_RUST_BUILD
if "%CHOICE%"=="5" goto RUN_TESTS
if "%CHOICE%"=="6" goto CLEAN_TARGET
if "%CHOICE%"=="7" goto ANDROID_MENU
if "%CHOICE%"=="0" goto EXIT_SCRIPT

echo [!] Lua chon khong hop le.
timeout /t 2 >nul
goto MENU

:CHECK_RUST_DEV
where cargo >nul 2>nul
if errorlevel 1 goto RUST_MISSING
goto DEV_DESKTOP

:CHECK_RUST_BUILD
where cargo >nul 2>nul
if errorlevel 1 goto RUST_MISSING
goto BUILD_DESKTOP

:RUST_MISSING
cls
echo ========================================================
echo   [CANH BAO] CHUA CAI DAT RUST TOOLCHAIN (CARGO)
echo ========================================================
echo.
echo Ung dung Desktop Tauri can Rust va Cargo de bien dich.
echo Hien tai may tinh cua ban chua co lenh 'cargo' trong PATH.
echo.
echo Ban co the:
echo   1. Chay tuy chon [1] de dung ban Web (chay ngay, khong can Rust).
echo   2. De dung Desktop: Tai va cai dat Rust tu trang chu:
echo      https://rustup.rs/
echo      (Hoac mo PowerShell chay: winget install Rustlang.Rustup)
echo.
echo Sau khi cai xong Rust, khoi dong lai start.bat la dung duoc.
echo ========================================================
echo.
pause
goto MENU

:DEV_WEB
cls
echo [DANG KHOI CHAY] Web Dev Server (Ho tro test ca tren may tinh va dien thoai Wi-Fi)...
echo Nhan Ctrl + C de dung server.
echo.
call pnpm dev --host
pause
goto MENU

:DEV_DESKTOP
cls
echo [DANG KHOI CHAY] Desktop App [Tauri 2 + SQLite]...
echo.
call pnpm tauri dev
pause
goto MENU

:BUILD_WEB
cls
echo [DANG BUILD] Frontend Production Bundle [tsc + vite build]...
echo.
call pnpm build
echo.
if errorlevel 1 (
    echo [LOI] Build that bai!
) else (
    echo [THANH CONG] Build hoan tat! Thu muc xuat: dist/
)
echo.
pause
goto MENU

:BUILD_DESKTOP
cls
echo [DANG BUILD] Windows Desktop Installer [tauri build]...
echo.
echo Dang don dep cache resource icon cu cua tauri-app...
if exist "src-tauri\target\release\build" (
    for /d %%d in ("src-tauri\target\release\build\tauri-app-*") do rmdir /s /q "%%d" >nul 2>nul
)
if exist "src-tauri\target\release\tauri-app.exe" del /f /q "src-tauri\target\release\tauri-app.exe" >nul 2>nul
call pnpm tauri build
echo.
if errorlevel 1 (
    echo [LOI] Build installer that bai!
) else (
    echo [THANH CONG] Build hoan tat!
)
echo.
pause
goto MENU

:RUN_TESTS
cls
echo [DANG KIEM TRA] Chay test, typecheck va lint...
echo.
call pnpm typecheck
if errorlevel 1 (
    echo [X] Typecheck that bai!
    pause
    goto MENU
)
call pnpm lint
if errorlevel 1 (
    echo [X] Lint that bai!
    pause
    goto MENU
)
call pnpm test
if errorlevel 1 (
    echo [X] Test that bai!
    pause
    goto MENU
)
echo.
echo [THANH CONG] Toan bo kiem tra deu PASS!
echo.
pause
goto MENU

:CLEAN_TARGET
cls
echo ========================================================
echo        DON DEP DUNG LUONG BUILD (CARGO TARGET)
echo ========================================================
echo.
echo Thu muc 'src-tauri\target' chua cache bien dich tam thoi cua Rust.
echo Xoa thu muc nay se giai phong khoang 6GB - 8GB o dia ma khong anh huong toi ma nguon.
echo.
echo   [1] Xoa toan bo thu muc build target (Giai phong ~8GB)
echo   [2] Chi xoa thu muc debug (Giai phong ~6.2GB, giu lai file installer release)
echo   [3] Quay lai Menu chinh
echo.
set CLEAN_CHOICE=1
set /p CLEAN_CHOICE="Nhap lua chon cua ban [1]: "
if "%CLEAN_CHOICE%"=="1" (
    echo.
    echo Dang xoa src-tauri\target...
    if exist "src-tauri\target" rmdir /s /q "src-tauri\target"
    echo [THANH CONG] Da xoa sach thu muc target! Thu hoi ngay ~8GB o dia!
    echo.
    pause
    goto MENU
)
if "%CLEAN_CHOICE%"=="2" (
    echo.
    echo Dang xoa src-tauri\target\debug...
    if exist "src-tauri\target\debug" rmdir /s /q "src-tauri\target\debug"
    echo [THANH CONG] Da xoa sach thu muc debug! Thu hoi ngay ~6.2GB o dia!
    echo.
    pause
    goto MENU
)
goto MENU

:ANDROID_MENU
cls
echo ========================================================
echo        KIEM TRA MOI TRUONG VA BUILD ANDROID APK
echo ========================================================
echo.
set ANDROID_READY=1

echo [1/4] Kiem tra Java JDK...
where javac >nul 2>nul
if errorlevel 1 (
    echo   [-] Khong tim thay javac [Java JDK chua duoc cai dat hoac chua them vao PATH].
    set ANDROID_READY=0
) else (
    echo   [+] Java JDK da san sang.
)

echo [2/4] Kiem tra ANDROID_HOME...
if "%ANDROID_HOME%"=="" (
    echo   [-] Bien ANDROID_HOME chua duoc thiet lap.
    set ANDROID_READY=0
) else (
    if not exist "%ANDROID_HOME%" (
        echo   [-] Thu muc ANDROID_HOME khong ton tai tren o dia!
        set ANDROID_READY=0
    ) else (
        echo   [+] ANDROID_HOME hop le: %ANDROID_HOME%
    )
)

echo [3/4] Kiem tra NDK_HOME...
if "%NDK_HOME%"=="" (
    if exist "%ANDROID_HOME%\ndk" (
        for /d %%i in ("%ANDROID_HOME%\ndk\*") do set "NDK_HOME=%%i"
    )
)
if "%NDK_HOME%"=="" (
    echo   [-] Bien NDK_HOME chua duoc thiet lap.
    set ANDROID_READY=0
) else (
    if not exist "%NDK_HOME%" (
        echo   [-] Thu muc NDK_HOME khong ton tai!
        set ANDROID_READY=0
    ) else (
        echo   [+] NDK_HOME hop le: %NDK_HOME%
    )
)

echo [4/4] Kiem tra Rust Android target...
where rustup >nul 2>nul
if errorlevel 1 (
    echo   [-] Khong tim thay lenh rustup [Chua cai dat Rust].
    set ANDROID_READY=0
) else (
    rustup target list 2>nul | findstr /c:"aarch64-linux-android (installed)" >nul 2>nul
    if errorlevel 1 (
        echo   [-] Rust target aarch64-linux-android chua duoc cai dat.
        echo       [Goi y: Chon muc 2 ben duoi de tu dong cai dat]
        set ANDROID_READY=0
    ) else (
        echo   [+] Rust aarch64-linux-android target da san sang.
    )
)

echo.
echo ========================================================
if "%ANDROID_READY%"=="0" (
    echo [THONG BAO] Moi truong Android SDK/NDK chua day du tren may.
    echo Vui long xem huong dan chi tiet trong file: docs\ANDROID_SETUP.md
    echo.
    echo   [1] Mo file huong dan docs\ANDROID_SETUP.md
    echo   [2] Tu dong them cac target Android vao Rust [rustup target add]
    echo   [3] Quay lai Menu chinh
    echo.
    set AND_CHOICE=1
    set /p AND_CHOICE="Nhap lua chon [1]: "
    if "%AND_CHOICE%"=="1" start docs\ANDROID_SETUP.md
    if "%AND_CHOICE%"=="2" (
        echo Dang cai dat Rust Android targets...
        call rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
        echo Da cai dat xong!
        pause
    )
    goto MENU
)

echo [CHUC MUNG] Moi truong Android da san sang de build!
echo.
echo   [1] Khoi tao project Android (pnpm tauri android init)
echo   [2] Build ban APK Release (pnpm tauri android build --apk)
echo   [3] Chay thu nghiem tren thiet bi (pnpm tauri android dev)
echo   [4] Quay lai Menu chinh
echo.
set AND_ACTION=2
set /p AND_ACTION="Nhap lua chon [2]: "
if "%AND_ACTION%"=="1" (
    call pnpm tauri android init
    pause
    goto MENU
)
if "%AND_ACTION%"=="2" (
    call pnpm tauri android build --apk
    if exist "src-tauri\gen\android\app\build\outputs\apk" (
        echo.
        echo Dang ky chu ky so [Sign APK] va xuat ban cai dat hop le...
        if exist "%ANDROID_HOME%\build-tools\34.0.0\apksigner.bat" (
            call "%ANDROID_HOME%\build-tools\34.0.0\apksigner.bat" sign --ks release.keystore --ks-pass pass:123456 --key-pass pass:123456 --out FinanceApp.apk "src-tauri\gen\android\app\build\outputs\apk\universal\release\app-universal-release-unsigned.apk" >nul 2>nul
        ) else (
            for /r "src-tauri\gen\android\app\build\outputs\apk" %%f in (*.apk) do copy /y "%%f" "FinanceApp.apk" >nul 2>nul
        )
        if exist "FinanceApp.apk" (
            echo [THANH CONG] File APK da duoc ky chu ky so hop le tai: %cd%\FinanceApp.apk
            explorer /select,FinanceApp.apk
        )
    )
    pause
    goto MENU
)
if "%AND_ACTION%"=="3" (
    call pnpm tauri android dev
    pause
    goto MENU
)
goto MENU

:EXIT_SCRIPT
echo Tam biet!
exit /b 0
