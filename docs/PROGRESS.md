# Tiến độ dự án (PROGRESS.md)

Theo dõi trạng thái hoàn thành từng Phase dựa theo `FINANCE_APP_SPEC.md`.

---

## Tổng quan các Phase

- [x] **Phase 0: Khởi tạo dự án**
  - [x] Khởi tạo Tauri 2 + React + TypeScript (strict) + Vite
  - [x] Cài đặt thư viện cốt lõi: Tailwind CSS, TanStack Query, React Router, Zustand, Zod, React Hook Form, date-fns, Recharts, PapaParse, Vitest, ESLint, Prettier
  - [x] Tạo đầy đủ cấu trúc thư mục chuẩn theo mục 4
  - [x] Cấu hình path alias (`@/app`, `@/features`, `@/domain`, `@/data`, `@/shared`, `@/store`)
  - [x] Cấu hình ESLint boundaries ngăn chặn vi phạm quy tắc phụ thuộc giữa các tầng
  - [x] Tạo `docs/DECISIONS.md`, `docs/PROGRESS.md`
  - [x] Kiểm tra lint, typecheck, test

- [x] **Phase 1: Lõi dữ liệu và nghiệp vụ**
  - [x] `domain/types.ts` (định nghĩa chuẩn mục 5.1: BaseEntity, Account, Category, Transaction, Budget, RecurringRule, Goal)
  - [x] `shared/lib/` (`formatMoney`, `parseAmount`, `date`, `uuid`) + unit tests (độ phủ 93.6%)
  - [x] `domain/` pure logic (`balance.ts`, `budget.ts`, `report.ts`, `recurring.ts`) + unit tests (độ phủ 96.6%)
  - [x] Migration `001_init.sql`, đăng ký plugin SQLite trong Rust và `src-tauri/Cargo.toml`, capabilities, `db/client.ts`
  - [x] Triển khai Repositories: cả bản `memory/` và bản `sqlite/`
  - [x] Seed dữ liệu ban đầu (danh mục mặc định, ví tiền mặt, đánh dấu `app_settings` idempotent)
  - [x] Bộ test dùng chung cho cả `memory/` và `sqlite/` đạt 100% (48 tests pass)
  - [x] Kiểm tra bắt buộc: chuyển khoản không làm đổi tổng thu/chi; xóa mềm cặp transfer xóa cả hai dòng; số dư ví đúng sau chuỗi giao dịch; `parseAmount` đủ ca; `generateDue` đúng ca cuối tháng.

- [x] **Phase 2: Ví, danh mục, giao dịch (UI cốt lõi)**
  - [x] App Layout (sidebar responsive, mobile tabs + menu "Thêm")
  - [x] Feature `accounts` (danh sách ví, thêm, sửa, archive, số dư tổng tài sản, chuyển khoản giữa ví với nút đổi chiều)
  - [x] Feature `categories` (danh sách, CRUD, phân loại thu/chi, đổi màu/icon, sắp xếp thứ tự)
  - [x] Feature `transactions` (danh sách nhóm theo ngày, bộ lọc, xóa kèm hoàn tác, bấm dòng để sửa)
  - [x] Quick Add dialog (phím tắt `N`, parse số tiền tắt `50k`, `1tr2`, gợi ý danh mục theo từ khóa ghi chú, lưu và thêm tiếp)
  - [x] Đã kiểm thử và sửa lỗi: đồng bộ hai đầu cặp chuyển khoản khi sửa, tránh bế tắc chọn ví chuyển tiền khi chỉ có 2 ví, kiểm tra typecheck và lint đạt 100% sạch.

- [x] **Phase 3: Dashboard, ngân sách, mục tiêu, định kỳ**
  - [x] Dashboard tổng quan (3 thẻ Thu/Chi/Còn lại kèm so sánh tháng trước, biểu đồ tròn danh mục, biểu đồ cột thu/chi 6 tháng, 5 giao dịch gần nhất, ngân sách cảnh báo, bộ chọn tháng)
  - [x] Feature `budgets` (hạn mức danh mục, thanh tiến độ phân cấp cảnh báo `ok`/`warn`/`over`, sao chép hạn mức từ tháng trước)
  - [x] Feature `goals` (tiết kiệm, tiến độ %, nạp thêm tiền tiết kiệm, theo dõi hoàn thành)
  - [x] Feature `recurring` (tự động sinh giao dịch khi mở app, kiểm tra chống trùng tuyệt đối, quản lý bật/tắt và xem ngày đến hạn tiếp theo)
  - [x] Bộ test kiểm thử tích hợp Phase 3 đạt 100% (64/64 tests pass, typecheck và lint sạch)

- [-] **Phase 4: [ĐÃ LƯỢC BỎ]**
  - Đã lược bỏ tính năng Import/Export CSV sao kê ngân hàng và sao lưu JSON theo nhu cầu sử dụng cá nhân (dữ liệu đã lưu trực tiếp, an toàn và tự động vào SQLite cục bộ `finance.db`).

- [x] **Phase 5: Đóng gói hoàn thiện bản Windows Desktop**
  - [x] Cấu hình phân quyền SQLite Tauri v2 đầy đủ trong `capabilities/default.json` (`allow-execute`, `allow-load`, `allow-select`, `allow-close`)
  - [x] Cơ chế lưu trữ dữ liệu an toàn vĩnh viễn trên Desktop (`%APPDATA%\com.financeapp.desktop\finance.db`)
  - [x] Tích hợp bộ công cụ quản lý dự án trong `start.bat`: chạy nhanh Web Dev, chạy Desktop, build installer và dọn dẹp tự động cache biên dịch giải phóng ~8GB ổ đĩa
  - [x] Cấu hình cửa sổ ứng dụng tối ưu trong `tauri.conf.json` (kích thước chuẩn 1100x750, responsive đến 400px, icon ứng dụng, tiêu đề `Finance App`)
  - [x] Bộ kiểm thử chất lượng toàn diện: 64/64 tests pass, 0 lỗi TypeScript strict, 0 warning ESLint
  - [x] Đóng gói thành công bản cài đặt Windows NSIS (`FinanceApp_0.1.0_x64-setup.exe`) và file chạy độc lập (`tauri-app.exe`)

- [x] **Phase 6: Mobile Android & Tối ưu cảm ứng một tay**
  - [x] Giữ nguyên 100% tính toàn vẹn của tầng `domain/` và `data/` (SQLite offline chạy mượt qua `tauri-plugin-sql` trên Android)
  - [x] Tối ưu hóa Viewport & Safe Area Insets: chống zoom vô tình (`user-scalable=no, viewport-fit=cover`), `touch-action: manipulation` loại bỏ delay 300ms, hỗ trợ vùng đệm tai thỏ và thanh gạt điều hướng Android (`pb-safe`, `pt-safe`, `bottom-safe-fab`)
  - [x] Nâng cấp Modal thành Bottom Sheet trượt từ đáy màn hình với góc bo `rounded-t-3xl` và thanh gạt điều hướng trực quan cho ngón cái
  - [x] Tích hợp bộ lắng nghe sự kiện nút Back phần cứng của Android (`popstate`), bấm Back đóng Dialog trước thay vì thoát app
  - [x] Quick Add siêu tốc 1 tay: Hàng phím tắt cộng dồn mệnh giá nhanh (`+10k`, `+20k`, `+50k`, `+100k`, `+200k`, `+500k`, `+1tr`, `+2tr`), bàn phím số ảo `inputMode="text"`, nút bấm $\ge 48\text{px}$
  - [x] Cấu hình Tauri Android: `src-tauri/tauri.android.conf.json` định danh `com.financeapp.app`
  - [x] Tài liệu hướng dẫn thiết lập SDK/NDK: `docs/ANDROID_SETUP.md`
  - [x] Tự động hóa kiểm tra & Build Android: Tích hợp menu `[7]` vào `start.bat` kèm Preflight Check 4 bước (Java, SDK, NDK, Rust targets)

- [x] **Phase 7: Tự Động Bắt Thông Báo Ngân Hàng (Android Bank Notification Auto-Tracking)**
  - [x] Cài đặt trọn vẹn bộ Android Command-line Tools gọn nhẹ (`D:\Android\Sdk`), SDK Platform 34, Build-Tools 34.0.0, NDK 26.3, tự động chấp thuận giấy phép Google.
  - [x] Khởi tạo mã nguồn Android native với `tauri android init` tại `src-tauri/gen/android/`.
  - [x] Xây dựng Native Android `BankNotificationListenerService.kt` kế thừa `NotificationListenerService` và khai báo quyền `BIND_NOTIFICATION_LISTENER_SERVICE` trong `AndroidManifest.xml`.
  - [x] Xây dựng bộ bóc tách thông báo ngân hàng `BankNotificationParser.kt` hỗ trợ 14 ngân hàng & ví điện tử Việt Nam (VCB, TCB, MB, TPB, VPB, ACB, BIDV, VietinBank, Timo, Cake, MoMo, ZaloPay, Sacombank).
  - [x] Cơ chế lưu trữ đệm `BankNotificationStorage.kt` lưu vào `pending_bank_transactions.json` chạy nền bền vững kể cả khi app bị tắt đa nhiệm.
  - [x] Cầu nối Tauri Rust Bridge (`src-tauri/src/lib.rs`): Cung cấp các lệnh `get_pending_bank_transactions`, `update_bank_transaction_status`, `add_mock_bank_transaction`.
  - [x] Giao diện người dùng: Hook `useBankNotifications.ts`, Banner phát hiện giao dịch `BankNotificationBanner.tsx` trên Dashboard, hỗ trợ 1-chạm điền sẵn vào `QuickAddDialog` và tự động đánh dấu đã nhập.
  - [x] Widget giả lập thông báo (`BankNotificationTestWidget`) giúp kiểm thử trực tiếp trên Web/Desktop mà không cần cắm điện thoại.
  - [x] Kiểm thử chất lượng: 74/74 tests pass, 0 lỗi TypeScript, 0 warning ESLint, Cargo check đạt `Finished dev profile`.
