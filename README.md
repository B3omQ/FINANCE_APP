9# 🪙 Finance App (Finance Vault)

> **Ứng dụng quản lý tài chính cá nhân đa nền tảng (Desktop & Android) hoạt động hoàn toàn cục bộ (100% Offline-First), bảo mật tối đa, không cần tài khoản, không theo dõi và không lưu trữ dữ liệu lên máy chủ đám mây.**

---

## 📑 Mục lục
1. [Giới thiệu tổng quan](#-giới-thiệu-tổng-quan)
2. [Triết lý cốt lõi & Cam kết bảo mật](#-triết-lý-cốt-lõi--cam-kết-bảo-mật)
3. [Công nghệ sử dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
4. [Kiến trúc hệ thống (Architecture)](#-kiến-trúc-hệ-thống-architecture)
5. [Các tính năng nổi bật](#-các-tính-năng-nổi-bật)
6. [Cấu trúc thư mục nguồn](#-cấu-trúc-thư-mục-nguồn)
7. [Hướng dẫn cài đặt & Sử dụng](#-hướng-dẫn-cài-đặt--sử-dụng)
8. [Quy trình đóng gói (Desktop & Mobile APK)](#-quy-trình-đóng-gói-desktop--mobile-apk)
9. [Chạy kiểm thử & Đảm bảo chất lượng (QA)](#-chạy-kiểm-thử--đảm-bảo-chất-lượng-qa)

---

## 🌟 Giới thiệu tổng quan

**Finance App (Finance Vault)** là ứng dụng tài chính cá nhân hiện đại được thiết kế để thay thế các phần mềm ghi chép tài chính truyền thống vốn thường phụ thuộc vào máy chủ bên thứ ba. Ứng dụng cung cấp trải nghiệm liền mạch trên cả **máy tính để bàn (Windows, macOS, Linux)** và **thiết bị di động (Android)** với hiệu năng siêu nhẹ, giao diện kính mờ (Glassmorphism) đẳng cấp và khả năng đọc tự động thông báo biến động số dư từ các ngân hàng Việt Nam.

---

## 🔒 Triết lý cốt lõi & Cam kết bảo mật

- **100% Offline-First**: Toàn bộ dữ liệu giao dịch, tài khoản, hạn mức, mục tiêu tích lũy và cấu hình cá nhân được lưu trữ trực tiếp trên thiết bị của bạn bằng cơ sở dữ liệu **SQLite** và **IndexedDB**.
- **Không Telemetry & Không Tracking**: Ứng dụng không tích hợp bất kỳ SDK theo dõi hành vi, Google Analytics hay dịch vụ quảng cáo nào.
- **Quyền riêng tư tuyệt đối**: Không yêu cầu đăng ký tài khoản đám mây, không yêu cầu email/số điện thoại để sử dụng.
- **Chủ quyền dữ liệu**: Dữ liệu thuộc về bạn, có thể sao lưu, khôi phục hoặc xóa bỏ hoàn toàn bất kỳ lúc nào.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

### 1. Nền tảng Native & Desktop / Mobile Engine
- **[Tauri v2](https://v2.tauri.app/)**: Framework thế hệ mới viết bằng **Rust**, thay thế Electron với dung lượng gói cài đặt siêu nhỏ (< 15MB), chiếm ít hơn 90% bộ nhớ RAM và bảo mật cấp hệ thống.
- **[SQLite](https://www.sqlite.org/)** (thông qua `@tauri-apps/plugin-sql`): Hệ cơ sở dữ liệu nhúng quan hệ chuẩn ACID, lưu trữ trực tiếp trong thư mục ứng dụng an toàn của hệ điều hành.
- **Android Kotlin Native Services**:
  - `BankNotificationListenerService`: Dịch vụ chạy nền cấp Android để lắng nghe và chuyển đổi thông báo giao dịch ngân hàng thành bản ghi tài chính nháp.
  - `Android Jetpack Edge-to-Edge`: Hiển thị tràn viền cao cấp, hỗ trợ Safe Area Inset cho tai thỏ và camera nốt ruồi (Punch hole).
  - `FileProvider`: Hỗ trợ mở và chọn ảnh an toàn từ Thư viện ảnh thiết bị (Gallery / Google Photos).

### 2. Giao diện & Trạng thái Frontend
- **[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)**: Đảm bảo an toàn kiểu dữ liệu (Type-safety), Render đồng thời mượt mà.
- **[Vite](https://vitejs.dev/)**: Công cụ đóng gói và phát triển frontend với tốc độ Hot-Module Replacement (HMR) tính bằng mili-giây.
- **[Tailwind CSS](https://tailwindcss.com/)**: Hệ thống CSS utility-first tùy biến động với CSS Variables HSL, hỗ trợ đổi tông màu thời gian thực và kiểm tra độ tương phản WCAG 2.1 AA.
- **[Lucide React](https://lucide.dev/)**: Bộ biểu tượng vector sắc nét, tối ưu cho màn hình cảm ứng di động và màn hình Retina / 2K / 4K.
- **[Recharts](https://recharts.org/)**: Thư viện biểu đồ tài chính động (Pie Chart danh mục chi tiêu, Bar Chart dòng tiền thu / chi theo tháng).
- **[Zustand](https://zustand.docs.pmnd.rs/)**: Quản lý trạng thái giao diện siêu nhẹ (Theme store, UI store, Quick add modal).
- **[TanStack React Query v5](https://tanstack.com/query/latest)**: Quản lý bộ nhớ đệm, tối ưu hóa truy vấn bất đồng bộ từ SQLite.
- **[React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)**: Quản lý biểu mẫu và kiểm thực dữ liệu đầu vào chặt chẽ.
- **HTML5 Canvas API**: Cắt xén ảnh đại diện 1:1, nén ảnh nền và tối ưu hoá bộ nhớ trực tiếp trên trình duyệt/WebView.
- **IndexedDB**: Kho lưu trữ nhị phân nhúng (Blob) dành cho ảnh avatar và hình nền cá nhân, tránh tình trạng tràn bộ nhớ `localStorage`.

### 3. Kiểm thử & Chất lượng mã nguồn
- **[Vitest](https://vitest.dev/)**: Bộ khung unit test siêu tốc độ cao, độ tương thích 100% với cấu hình Vite.
- **[Testing Library](https://testing-library.com/)**: Kiểm thử hành vi tương tác của các thành phần giao diện.
- **[ESLint (Flat Config)](https://eslint.org/) + TypeScript ESLint**: Đảm bảo tiêu chuẩn code sạch, loại bỏ biến thừa và kiểm soát cảnh báo chặt chẽ.

---

## 🏛 Kiến trúc hệ thống (Architecture)

Ứng dụng tuân theo mô hình **Domain-Driven & Repository Pattern** rõ ràng, phân tách biệt lập giữa tầng Nghiệp vụ, Dữ liệu và Giao diện:

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT 19 FRONTEND UI                     │
│  (Pages: Dashboard, Transactions, Accounts, Budgets, v.v.)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   ┌─────────────────┐                   ┌─────────────────┐
   │  ZUSTAND STORES │                   │ TANSTACK QUERY  │
   │  (Theme, UI)    │                   │ (Data Caching)  │
   └────────┬────────┘                   └────────┬────────┘
            │                                     │
            ▼                                     ▼
┌──────────────────────┐             ┌─────────────────────────┐
│     INDEXEDDB        │             │   DOMAIN LOGIC LAYER    │
│ (Media Blobs Storage)│             │ (Balance, Budget, v.v.) │
└──────────────────────┘             └────────────┬────────────┘
                                                  │
                                                  ▼
                                     ┌─────────────────────────┐
                                     │   REPOSITORY INTERFACE  │
                                     └──────┬───────────┬──────┘
                                            │           │
                    ┌───────────────────────┘           └───────────────────────┐
                    ▼                                                           ▼
       ┌────────────────────────┐                                  ┌────────────────────────┐
       │   SQLITE REPOSITORY    │                                  │   MEMORY REPOSITORY    │
       │ (Tauri Plugin SQLite)  │                                  │   (Unit Test & Web)    │
       └────────────┬───────────┘                                  └────────────────────────┘
                    │
                    ▼
       ┌────────────────────────┐
       │  LOCAL DATABASE FILE   │
       │     (finance.db)       │
       └────────────────────────┘
```

---

## 🚀 Các tính năng nổi bật

### 1. Bảng điều khiển Tổng quan (Dashboard)
- Hiển thị tức thời **Tổng tài sản ròng**, **Tổng thu nhập tháng** và **Tổng chi tiêu tháng**.
- Thống kê tỷ lệ tăng/giảm so với tháng trước.
- Biểu đồ tròn trực quan về **Cơ cấu chi tiêu theo nhóm danh mục**.
- Biểu đồ cột so sánh **Dòng tiền Thu vs Chi** qua các tháng gần nhất.

### 2. Sổ giao dịch đa năng (Transactions)
- Ghi nhận giao dịch **Chi tiền**, **Thu tiền** hoặc **Chuyển khoản nội bộ** giữa 2 ví.
- Phím tắt toàn cục: Nhấn phím `N` trên bàn phím máy tính để mở hộp thoại thêm giao dịch nhanh.
- Hỗ trợ lọc giao dịch nâng cao: Theo khoảng thời gian, loại giao dịch, tài khoản/ví, hoặc danh mục.
- Tìm kiếm theo nội dung ghi chú tức thì.

### 3. Quản lý Tài khoản & Nguồn tiền (Accounts & Wallets)
- Đa dạng loại tài khoản: Tiền mặt, Tài khoản ngân hàng, Thẻ tín dụng, Ví điện tử (Momo, ZaloPay), Sổ tiết kiệm hoặc Tài khoản đầu tư.
- Theo dõi biến động số dư theo thời gian thực và lịch sử chuyển khoản nội bộ.

### 4. Quản lý Danh mục phân loại (Categories)
- Phân chia thành 2 nhóm độc lập: **Chi tiêu** và **Thu nhập**.
- Tùy biến biểu tượng (CategoryIcon) và mã màu nhận diện riêng biệt cho từng hạng mục.

### 5. Ngân sách & Hạn mức chi tiêu thông minh (Budgets)
- Thiết lập hạn mức ngân sách hàng tháng cho từng danh mục.
- Thanh tiến độ động với cảnh báo 3 cấp độ:
  - 🟢 **Bình thường** (< 80%): Màu xanh lá/xanh ngọc.
  - 🟡 **Cảnh báo** (80% - 100%): Màu hổ phách/vàng.
  - 🔴 **Vượt hạn mức** (> 100%): Màu đỏ hồng rực rỡ kèm số tiền bội chi.

### 6. Mục tiêu tích lũy tài chính (Savings Goals)
- Đặt mục tiêu tài chính cụ thể (Mua xe, Quỹ khẩn cấp, Du lịch, Mua laptop...).
- Theo dõi tiến độ hoàn thành theo %, số ngày còn lại và ngày dự kiến đạt được.
- Nạp tiền tích lũy trực tiếp vào mục tiêu tài chính.

### 7. Giao dịch định kỳ tự động (Recurring Engine)
- Lên lịch tự động lặp lại cho các khoản chi phí cố định: Tiền nhà, tiền điện, gói cước mạng, lương hàng tháng.
- Chu kỳ hỗ trợ: **Hàng ngày**, **Hàng tuần**, **Hàng tháng**, **Hàng năm**.
- Tự động quét và sinh giao dịch tương ứng ngay khi người dùng khởi động ứng dụng mà không cần can thiệp thủ công.

### 8. Đồng bộ thông báo ngân hàng trên Android (Mobile Bank Sync)
- Dịch vụ Android Native chạy ngầm bắt thông báo biến động số dư từ các ứng dụng ngân hàng: **Techcombank**, **MB Bank**, **Vietcombank**, **TPBank**, **VPBank**, **ACB**, **BIDV**, v.v.
- Bộ phân tích cú pháp thông minh tự động trích xuất: **Số tiền biến động**, **Dấu cộng/trừ (Thu hay Chi)**, **Nội dung chuyển khoản**, **Tên ngân hàng**.
- Hộp thoại **Chẩn đoán thông báo (Diagnostics HUD)**: Giúp người dùng kiểm tra lịch sử thông báo đã nhận, số thông báo phân tích thành công và lỗi (nếu có).

### 9. Cá nhân hóa & Công cụ tùy biến giao diện (Theming Engine)
- **3 Chế độ nền**:
  - *Tối Obsidian*: Tông đen xám ngân hàng dịu mắt.
  - *Sáng Tinh gọn*: Tông trắng trang nhã, tương phản cao.
  - *OLED Thuần đen*: Tối ưu 100% cho màn hình OLED / AMOLED, tiết kiệm pin tối đa.
- **Màu điểm nhấn (Accent Color)**: Tự do chọn mã màu HEX bất kỳ hoặc các gam màu chuẩn (Emerald, Forest, Indigo, Sky Blue, Rose, Violet, Amber...).
- **Đo lường WCAG 2.1 AA**: Tự động tính toán tỷ lệ tương phản giữa chữ và nền, đảm bảo không mỏi mắt khi đọc lâu.
- **Tùy biến Avatar & Tên hiển thị**:
  - Thay thế biểu tượng chiếc khiên mặc định bằng ảnh đại diện của bạn.
  - Thay thế chữ `FINANCE VAULT` trên Header/Sidebar bằng tên người dùng riêng.
  - Tích hợp công cụ cắt ảnh 1:1 hỗ trợ cả chuột và ngón tay cảm ứng trên di động.
- **Hình nền mờ (Glassmorphism)**: Tải ảnh nền yêu thích, hệ thống tự động làm mờ và phủ lớp kính trong suốt cho các thẻ tài chính.

---

## 📂 Cấu trúc thư mục nguồn

```
FINANCE_APP/
├── .agents/skills/              # Bộ kỹ năng AI & Quy chuẩn thiết kế UI/UX
├── docs/                        # Tài liệu kiến trúc, quyết định kỹ thuật & thiết lập Android
│   ├── ANDROID_SETUP.md         # Hướng dẫn chi tiết thiết lập môi trường Android SDK/NDK
│   ├── DECISIONS.md             # Nhật ký các quyết định kiến trúc dự án
│   └── PROGRESS.md              # Tiến độ triển khai từng giai đoạn
├── public/                      # Tệp tĩnh, favicon, logo ứng dụng
├── src/                         # Mã nguồn Frontend (React 19 + TypeScript)
│   ├── app/                     # Cấu hình ứng dụng, Layout chính, Router và Providers
│   │   ├── App.tsx              # Shell giao diện chính (Header, Sidebar, Bottom Tabs, Modals)
│   │   ├── main.tsx             # Điểm khởi chạy React DOM
│   │   ├── providers.tsx        # QueryClientProvider, RepositoryContext
│   │   └── routes.tsx           # Khai báo đường dẫn điều hướng
│   ├── data/                    # Tầng truy xuất dữ liệu (Data Access Layer)
│   │   ├── db/                  # SQLite schema và migrations
│   │   └── repositories/        # Hiện thực Repository Pattern (SQLite & Memory)
│   ├── domain/                  # Tầng nghiệp vụ cốt lõi (Domain Logic & Types)
│   │   ├── balance.ts           # Tính toán số dư ví và dòng tiền
│   │   ├── budget.ts            # Xử lý ngân sách và tỷ lệ phần trăm
│   │   ├── recurring.ts         # Thuật toán tính ngày đến hạn giao dịch lặp lại
│   │   └── types.ts             # Các Interface và Type chuẩn của toàn hệ thống
│   ├── features/                # Các mô-đun chức năng nghiệp vụ
│   │   ├── accounts/            # Quản lý tài khoản và chuyển tiền nội bộ
│   │   ├── bank-sync/           # Bắt và phân tích thông báo ngân hàng Android
│   │   ├── budgets/             # Hạn mức chi tiêu và thanh tiến độ
│   │   ├── categories/          # Quản lý danh mục thu/chi
│   │   ├── dashboard/           # Bảng thống kê tổng quan và biểu đồ tài chính
│   │   ├── goals/               # Mục tiêu tiết kiệm và tích lũy
│   │   ├── recurring/           # Quản lý lịch giao dịch định kỳ
│   │   ├── settings/            # Tùy biến giao diện, avatar, tên người dùng, theme
│   │   └── transactions/        # Sổ giao dịch và Quick Add Dialog
│   ├── shared/                  # Thư viện dùng chung (Utilities, UI Components, Styles)
│   │   ├── lib/                 # Xử lý ảnh, WCAG Contrast, IndexedDB, Format tiền tệ
│   │   ├── styles/              # globals.css (Safe area insets, Glassmorphism, Animations)
│   │   └── ui/                  # Button, Input, Modal, Toast, CategoryIcon
│   └── store/                   # Zustand stores (themeStore, uiStore)
├── src-tauri/                   # Mã nguồn Native Desktop & Android (Rust & Kotlin)
│   ├── Cargo.toml               # Khai báo dependencies Rust và Tauri
│   ├── build.rs                 # Script biên dịch Tauri icon
│   ├── tauri.conf.json          # Cấu hình cửa sổ, định danh app, phân quyền Tauri
│   ├── src/                     # Mã nguồn Rust (Commands, Plugin SQL, Diagnostic logs)
│   └── gen/android/             # Dự án Android Studio (Kotlin & Gradle)
│       └── app/src/main/
│           ├── AndroidManifest.xml # Cấp quyền thông báo, lưu trữ, dịch vụ ngầm
│           └── java/.../app/    # MainActivity.kt, BankNotificationListenerService.kt
├── start.bat                    # Menu tự động khởi chạy và build cho Windows
├── package.json                 # Khai báo thư viện Node.js và scripts
└── vite.config.ts               # Cấu hình Vite & Vitest
```

---

## 💻 Hướng dẫn cài đặt & Sử dụng

### 1. Yêu cầu hệ thống (Prerequisites)
- **Node.js**: Phiên bản 18.x hoặc 20.x trở lên.
- **pnpm**: Trình quản lý gói khuyên dùng (`npm install -g pnpm`).
- **Rust Toolchain** *(chỉ cần khi chạy/build bản Desktop hoặc Android)*: Cài đặt qua [https://rustup.rs](https://rustup.rs).
- **Android SDK & NDK** *(chỉ cần khi build file APK di động)*: Android SDK 34+ và NDK 26+. Xem chi tiết tại [`docs/ANDROID_SETUP.md`](docs/ANDROID_SETUP.md).

---

### 2. Khởi chạy nhanh bằng Menu tự động (`start.bat`)

Trên hệ điều hành Windows, dự án cung cấp sẵn tệp kịch bản `start.bat` tiện lợi:

1. Nhấp đúp vào tệp **`start.bat`** (hoặc mở Terminal gõ `.\start.bat`).
2. Giao diện điều khiển hiển thị các tùy chọn:

```text
========================================================
              FINANCE APP - KHỞI CHẠY DỰ ÁN
========================================================

  [1] Chạy ứng dụng Web Dev [pnpm dev] (Nhanh, không cần Rust)
  [2] Chạy ứng dụng Desktop Tauri [pnpm tauri dev] (Cần Rust)
  [3] Build gói Web Frontend [pnpm build]
  [4] Build bộ cài đặt Desktop Windows [pnpm tauri build] (Cần Rust)
  [5] Chạy kiểm tra mã nguồn [pnpm test, typecheck, lint]
  [6] Dọn dẹp dung lượng ổ đĩa [Xóa file build cache ~8GB]
  [7] Kiểm tra môi trường và Build Android APK [Tauri Android]
  [0] Thoát

========================================================
Nhập lựa chọn của bạn [Mặc định: 1]: 
```

- Nhập `1` để trải nghiệm ngay trên trình duyệt máy tính hoặc điện thoại cùng mạng Wi-Fi.
- Nhập `2` để mở ứng dụng desktop Tauri nguyên bản.
- Nhập `7` để mở menu đóng gói ứng dụng Android.

---

### 3. Các lệnh dòng lệnh thủ công (CLI Commands)

Nếu bạn muốn thao tác trực tiếp bằng Terminal:

```bash
# 1. Cài đặt các thư viện phụ thuộc
pnpm install

# 2. Khởi chạy môi trường phát triển Web
pnpm dev

# 3. Khởi chạy ứng dụng Desktop Tauri (Cần Rust)
pnpm tauri dev

# 4. Kiểm tra kiểu dữ liệu TypeScript
pnpm typecheck

# 5. Kiểm tra chất lượng mã nguồn (ESLint)
pnpm lint

# 6. Chạy bộ kiểm thử tự động (Vitest)
pnpm test

# 7. Đóng gói mã nguồn Web Frontend
pnpm build
```

---

## 📦 Quy trình đóng gói (Desktop & Mobile APK)

### 1. Đóng gói bộ cài đặt Windows Desktop (.exe / .msi)
```bash
pnpm tauri build
```
- Tệp cài đặt hoàn chỉnh sẽ nằm tại:
  `src-tauri/target/release/bundle/nsis/Finance App_<version>_x64-setup.exe`

---

### 2. Đóng gói file APK cho điện thoại Android
1. Mở `start.bat` ➔ chọn **7** (Android Setup & Build) ➔ chọn **2** (Build release APK).
2. Hoặc chạy lệnh thủ công:
   ```bash
   pnpm tauri android build --apk
   ```
3. Tệp APK xuất xưởng sẽ nằm tại:
   `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`
   *(Script `start.bat` sẽ tự động ký số bằng keystore và copy ra thư mục gốc thành `FinanceApp.apk` để bạn cài đặt ngay vào điện thoại)*.

---

## 🧪 Chạy kiểm thử & Đảm bảo chất lượng (QA)

Dự án áp dụng quy chuẩn kiểm thử nghiêm ngặt, 100% các bài test đều phải vượt qua trước khi xuất bản:

```bash
# Chạy toàn bộ 74+ bài test tự động
pnpm test

# Kiểm tra cú pháp và kiểu dữ liệu nghiêm ngặt
pnpm typecheck

# Kiểm tra chuẩn coding convention
pnpm lint
```

Các hạng mục kiểm thử bao gồm:
- Tính toán số dư và dòng tiền âm/dương.
- Chu kỳ và tính hợp lệ của giao dịch định kỳ (Recurring rules).
- Cảnh báo tỷ lệ ngân sách và phân bổ dòng tiền.
- Báo cáo thu chi theo tháng và tỷ lệ danh mục.
- Kiểm tra độ tương phản WCAG 2.1 AA cho màu sắc giao diện.
- Xác thực lưu trữ CRUD trong tầng Repository SQLite và Memory.
- Bắt và phân tích chuỗi tin nhắn thông báo biến động số dư ngân hàng.

---

## 📄 Bản quyền & Tác giả

- Dự án được phát triển với cam kết mã nguồn mở an toàn, phi thương mại hóa dữ liệu cá nhân.
- Mọi đóng góp (Pull Request), báo cáo lỗi (Issue) hoặc gợi ý tính năng mới đều được hoan nghênh nồng nhiệt! 🚀
