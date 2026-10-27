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
