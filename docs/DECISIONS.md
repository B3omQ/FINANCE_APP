# Architecture & Implementation Decisions (DECISIONS.md)

Tài liệu này ghi lại các quyết định kỹ thuật, lý do lựa chọn và sai khác (nếu có) so với đặc tả ban đầu.

---

### [2026-10-27] Khởi tạo dự án (Phase 0)

1. **Khởi tạo bằng `pnpm` và template Tauri 2 React TypeScript**:
   - Sử dụng package manager `pnpm` (v12) theo cấu hình dự án.
   - Setup React 19 + TypeScript strict mode + Vite 8.

2. **Tailwind CSS & Thiết kế giao diện**:
   - Sử dụng Tailwind CSS v3 với dark mode mặc định qua class `dark`.
   - Bổ sung các semantic tokens cho tài chính: `income`, `expense`, `transfer` và font số tabular (`.font-tabular`).

3. **Kiểm soát kiến trúc tầng qua ESLint (`eslint-plugin-boundaries`)**:
   - Cấu hình bắt buộc tuân thủ quy tắc phụ thuộc:
     - `domain/` độc lập hoàn toàn, không import bất kỳ tầng nào khác và không import React/Tauri.
     - `data/` chỉ được import `domain` và `shared`.
     - `features/` không được import chéo lẫn nhau (mỗi feature đóng gói riêng).
     - `store/` chỉ phục vụ `app` và `features`.
     - `shared/` chỉ chứa tiện ích dùng chung độc lập.


4. **Testing**:
   - Thiết lập Vitest với môi trường `jsdom` và Testing Library.

---

### [2026-10-27] Lõi dữ liệu và nghiệp vụ (Phase 1)

1. **Kiến trúc Domain thuần túy (Rule 4)**:
   - Toàn bộ tính toán nghiệp vụ (`balance.ts`, `budget.ts`, `report.ts`, `recurring.ts`) sử dụng pure TypeScript, không import bất kỳ phụ thuộc nào từ UI, React, Tauri hay `shared/`.
   - Độ phủ kiểm thử các hàm tính toán chính đạt trên 95%.

2. **Xử lý số tiền và chuyển khoản (Rules 1, 2, 9)**:
   - Số tiền luôn là số nguyên (integer VND).
   - Số tiền trong DB lưu có dấu (`+` cho thu/chuyển đến, `-` cho chi/chuyển đi).
   - Chuyển khoản gồm cặp 2 bản ghi giao dịch gắn chung một `transfer_group_id`.
   - `summarizeMonth` và `calculateCategorySpent` loại bỏ hoàn toàn các giao dịch có `type = 'transfer'`, đảm bảo chuyển khoản giữa các ví nội bộ không làm sai lệch báo cáo thu/chi tài chính.
   - Xóa mềm một giao dịch chuyển khoản tự động xóa mềm cả giao dịch còn lại trong cặp và khôi phục đồng thời khi hoàn tác.

3. **Chống trùng lặp định kỳ và xử lý ngày cuối tháng (Section 7 & 13)**:
   - `generateDue` bảo lưu ngày neo (anchor day) ban đầu (ví dụ ngày 31) và tự động co dãn theo số ngày tối đa của tháng đích (28/29 cho tháng 2, 30 cho tháng 4/6/9/11) mà không làm mất ngày neo cho các tháng 31 ngày tiếp theo.
   - Tránh sinh trùng nhờ vào trường `last_generated_date`.

4. **Kiểm thử đa nền tảng cho Repository SQLite (sql.js Wasm)**:
   - Để kiểm thử repository SQLite mà không cần khởi động Tauri desktop runtime, sử dụng engine `sql.js` (WebAssembly SQLite) trong môi trường Vitest.
   - Cả hai implementation `MemoryRepository` và `SqliteRepository` đều chạy chung một test suite (`repositories.test.ts`), chứng minh tính tương đương 100% về mặt hành vi.

---

### [2026-10-28] Kiểm thử & Hoàn thiện UI cốt lõi (Phase 2)

1. **Đồng bộ hóa hai đầu giao dịch chuyển khoản khi cập nhật (`update`)**:
   - Khi chỉnh sửa một giao dịch thuộc `transfer_group_id`, repository (cả `sqlite` và `memory`) tự động đồng bộ hóa giao dịch còn lại trong cặp: cập nhật ngày, ghi chú và gán số tiền đối dấu (`-patch.amount`).
   - Sửa lỗi trong `TransactionEditDialog`: bảo toàn đúng dấu âm cho chân chuyển đi (`amount < 0`), tránh trường hợp cả 2 chân đều thành số dương gây sai lệch số dư ví.

2. **Cơ chế hoán đổi ví trong hộp thoại chuyển tiền (UX Deadlock Resolution)**:
   - Xóa bỏ việc disable các option ví khiến người dùng bị kẹt không thể đảo chiều khi chỉ có 2 ví (ví dụ Tiền mặt & Ngân hàng).
   - Thêm nút Đổi chiều (Swap) và tự động hoán đổi hai ví khi chọn trùng ví đích/ví nguồn trong cả `TransferDialog` và `QuickAddDialog`.

3. **Điều hướng trên màn hình hẹp (< 1024px)**:
   - Triển khai thanh 5 tab theo mục 9.1: 4 mục chính (Tổng quan, Giao dịch, Ví tiền, Danh mục) và mục thứ 5 là menu "Thêm" mở danh sách các tính năng mở rộng (Ngân sách, Mục tiêu, Định kỳ, Cài đặt).

4. **Sắp xếp thứ tự danh mục**:
   - Thêm nút di chuyển thứ tự lên/xuống (`ChevronUp`/`ChevronDown`) trong `CategoriesPage` để người dùng linh hoạt sắp xếp danh mục theo mục tiêu hiển thị ưu tiên.

5. **Tương tác danh sách giao dịch**:
   - Cho phép người dùng bấm trực tiếp vào toàn bộ hàng giao dịch để mở cửa sổ chỉnh sửa nhanh, nút xóa được bảo vệ bằng `stopPropagation`.

6. **Chất lượng mã nguồn**:
   - Bổ sung cấu hình type `@testing-library/jest-dom/vitest` cho TypeScript.
   - Sửa toàn bộ warning của ESLint về dependencies của `useMemo` và biến thừa.
   - Mở rộng test suite lên 58 bài kiểm thử, 100% pass, Typecheck và Lint sạch 100%.

---

### [2026-10-28] Dashboard, Ngân sách, Mục tiêu, Định kỳ (Phase 3)

1. **Khởi tạo và chạy giao dịch định kỳ tự động (`useRecurringAutoProcess`)**:
   - Khi khởi động ứng dụng, hook tự động gọi `processDueRecurringRules` quét toàn bộ quy tắc `active = 1`.
   - Đối với mỗi quy tắc, sinh toàn bộ ngày đến hạn còn thiếu từ `lastGeneratedDate` (hoặc `startDate`) đến ngày hôm nay thông qua hàm thuần `generateDue`.
   - Cập nhật trường `lastGeneratedDate` ngay sau khi tạo giao dịch. Cùng với cờ khóa đồng thời (`isGlobalProcessing`), đảm bảo tuyệt đối không sinh trùng lặp ngay cả khi mở app nhiều lần liên tiếp trong ngày (đã kiểm thử 3 lần mở app liên tiếp).
   - Bổ sung trường `active?: boolean` vào `NewRecurringRule` và cập nhật câu lệnh SQL `UPDATE recurring_rules` để lưu giữ trạng thái bật/tắt của quy tắc.

2. **Dashboard tổng quan & Báo cáo so sánh**:
   - Tính toán 3 thẻ chỉ số (Thu, Chi, Còn lại) theo tháng được chọn, đồng thời so sánh chênh lệch phần trăm với tháng liền kề trước đó (`shiftMonth(month, -1)`).
   - Biểu đồ tròn Recharts hiển thị tỷ trọng chi tiêu các danh mục trong tháng.
   - Biểu đồ cột Recharts hiển thị xu hướng thu/chi 6 tháng liên tiếp (`getLastNMonths(6)`).
   - Danh sách 5 giao dịch gần đây nhất và danh sách các danh mục vượt hoặc tiệm cận hạn mức ngân sách (`warn` >= 80%, `over` > 100%).
   - Bất biến: Chuyển khoản hoàn toàn bị loại khỏi doanh thu, chi phí và báo cáo số dư ròng.

3. **Quản lý ngân sách (`budgets`)**:
   - Phân cấp cảnh báo trực quan: màu xanh (`ok`, <80%), vàng cam (`warn`, 80%-100%), đỏ (`over`, >100%).
   - Cung cấp tính năng sao chép hạn mức từ tháng trước sang tháng đang xem chỉ với một nút bấm (`copyMonth`).
   - Hạn mức ngân sách tính toán dựa trên chi tiêu thực tế của danh mục trong tháng (loại bỏ hoàn toàn transfer).

4. **Mục tiêu tiết kiệm (`goals`)**:
   - Thẻ theo dõi trực quan tiến độ tích lũy theo phần trăm hoàn thành.
   - Hỗ trợ thêm nhanh tiền tích lũy vào mục tiêu (`addSaving`), tính toán số tiền còn thiếu và ngày hạn mục tiêu.

5. **Bộ kiểm thử Phase 3**:
   - Tạo test suite tích hợp [phase3.test.ts](file:///c:/Users/LAPTOP/OneDrive/Documents/GitHub/FINANCE_APP/src/features/__tests__/phase3.test.ts) kiểm tra 100% các tiêu chí hoàn thành của Phase 3.
   - Nâng tổng số lượng bài test lên 64 test cases, tất cả đều PASS 100%. Typecheck sạch, ESLint sạch, Build thành công.

---

### [2026-10-29] Tinh giản lộ trình cho nhu cầu cá nhân: Lược bỏ Phase 4 & Đóng gói hoàn thiện Windows (Phase 5)

1. **Lược bỏ Phase 4 (Import/Export CSV & Sao lưu JSON)**:
   - **Lý do**: Ứng dụng phục vụ nhu cầu quản lý tài chính cá nhân độc lập trên máy tính. Toàn bộ dữ liệu được lưu trữ tự động, trực tiếp và vĩnh viễn trong file SQLite (`%APPDATA%\com.financeapp.desktop\finance.db`).
   - Tính năng đọc và ánh xạ cột sao kê ngân hàng CSV phức tạp không cần thiết cho việc ghi chép chi tiêu cá nhân thường nhật. Người dùng hoàn toàn có thể tự sao lưu dữ liệu bất kỳ lúc nào bằng cách sao chép file database `finance.db`.

2. **Trọng tâm đóng gói hoàn thiện bản Windows Desktop (Phase 5)**:
   - **Phân quyền SQLite toàn vẹn**: Cấu hình đầy đủ các quyền thực thi của `tauri-plugin-sql` trong `capabilities/default.json` (`sql:allow-execute`, `sql:allow-load`, `sql:allow-select`, `sql:allow-close`), đảm bảo dữ liệu ghi và đọc vĩnh viễn không phụ thuộc môi trường ngoài.
   - **Lưu trữ Persistent đa nền tảng**: Tích hợp cơ chế tự động đồng bộ hóa `localStorage` cho chế độ Web/Browser, đảm bảo không bao giờ mất dữ liệu ngay cả khi reload hay chạy dev.
   - **Công cụ quản lý & dọn dẹp dung lượng tự động**: Bổ sung menu quản lý trong `start.bat` cho phép dọn dẹp nhanh thư mục `src-tauri/target`, thu hồi ngay ~8GB bộ nhớ đệm biên dịch của Rust.
   - **Đóng gói xuất xưởng**: Hỗ trợ build tự động bộ cài đặt Windows NSIS (`FinanceApp_0.1.0_x64-setup.exe`) và file chạy portable độc lập (`tauri-app.exe`).
   - **Chất lượng kiểm thử**: Đạt 64/64 test cases PASS 100%, 0 lỗi cú pháp TypeScript, 0 lỗi cảnh báo ESLint.

---

### [2026-10-29] Triển khai Phase 6: Mobile Android & Trải nghiệm Cảm ứng Một tay

1. **Bảo toàn bất biến kiến trúc lõi (`domain/` & `data/`)**:
   - Tuân thủ nghiêm ngặt nguyên tắc của spec: không sửa đổi bất kỳ tệp nào trong `domain/` hay `data/`.
   - `tauri-plugin-sql` (v2.6) tự động khởi tạo cơ sở dữ liệu SQLite trong sandbox ứng dụng trên Android (`/data/data/com.financeapp.app/files/finance.db`).

2. **Chuyển đổi Modal sang Bottom Sheet trên Mobile**:
   - Trên màn hình nhỏ (`< sm`), `Modal.tsx` neo xuống đáy màn hình (`items-end`), bo góc trên `rounded-t-3xl`, tích hợp thanh trượt chỉ dẫn (`drag handle pill`), giúp toàn bộ nội dung nằm gọn trong tầm với của ngón tay cái mà không cần rướn tay lên đỉnh màn hình 6.7 inch.

3. **Xử lý Nút Back phần cứng của Android**:
   - Khi mở modal, tự động kích hoạt `window.history.pushState` và lắng nghe sự kiện `popstate`. Khi người dùng bấm nút Back vật lý hoặc vuốt từ cạnh màn hình Android, hệ thống sẽ đóng modal đang mở trước, ngăn chặn hành vi thoát ứng dụng đột ngột.

4. **Tối ưu hóa Quick Add siêu tốc 1 tay**:
   - Bổ sung dãy nút chọn nhanh mệnh giá (`+10k`, `+20k`, `+50k`, `+100k`, `+200k`, `+500k`, `+1tr`, `+2tr`), tự động cộng dồn vào số tiền đang nhập mà không cần chuyển đổi bàn phím ảo giữa chữ và số.
   - Thêm `touch-action: manipulation`, hỗ trợ Safe Area Insets (`env(safe-area-inset-bottom)`) cho thanh điều hướng và nút Floating Action Button (+).

5. **Tự động hóa Kiểm tra Môi trường Android SDK/NDK trong `start.bat`**:
   - Tích hợp menu `[7]` tự động chạy Preflight Check kiểm tra JDK, `ANDROID_HOME`, `NDK_HOME` và Rust targets.
   - Biên soạn tài liệu chi tiết `docs/ANDROID_SETUP.md` hướng dẫn thiết lập SDK Platform 34 và NDK để xuất file `.apk`.

