@echo off
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
goto ANDROID_MENU

:ANDROID_MENU
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
) else (
    echo [CHUC MUNG] Moi truong Android da san sang de build!
)
echo TEST_SUCCESS

