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

