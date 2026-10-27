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

- [ ] **Phase 1: Lõi dữ liệu và nghiệp vụ**
  - [ ] `domain/types.ts`
  - [ ] `shared/lib/` (`formatMoney`, `parseAmount`, `date`, `uuid`) + unit tests
  - [ ] `domain/` pure logic (`balance.ts`, `budget.ts`, `report.ts`, `recurring.ts`) + unit tests
  - [ ] Migration `001_init.sql`, client DB
  - [ ] Repository: bản `memory/` và bản `sqlite/`
  - [ ] Seed dữ liệu ban đầu (danh mục mặc định, ví tiền mặt)
  - [ ] Shared test suite cho repository

- [ ] **Phase 2: Ví, danh mục, giao dịch (UI cốt lõi)**
  - [ ] App Layout (sidebar responsive, mobile tabs)
  - [ ] Feature `accounts` (danh sách ví, thêm, sửa, archive, số dư)
  - [ ] Feature `categories` (danh sách, CRUD, phân loại thu/chi)
  - [ ] Feature `transactions` (danh sách nhóm theo ngày, bộ lọc, xóa kèm hoàn tác)
  - [ ] Quick Add dialog (phím tắt `N`, parse số tiền tắt `50k`, `1tr2`, gợi ý danh mục)

- [ ] **Phase 3: Dashboard, ngân sách, mục tiêu, định kỳ**
  - [ ] Dashboard tổng quan (thẻ thu/chi, biểu đồ danh mục, biểu đồ cột 6 tháng)
  - [ ] Feature `budgets` (hạn mức, tiến độ cảnh báo 80%/100%, sao chép tháng)
  - [ ] Feature `goals` (tiết kiệm, tiến độ %)
  - [ ] Feature `recurring` (sinh giao dịch định kỳ khi mở app, chống trùng)

- [ ] **Phase 4: Import/Export và sao lưu**
  - [ ] Import CSV sao kê ngân hàng (map cột, parse tiền/ngày, bỏ qua trùng)
  - [ ] Export/Backup toàn bộ dữ liệu ra JSON & copy DB
  - [ ] Khôi phục dữ liệu từ bản sao lưu

- [ ] **Phase 5: Hoàn thiện desktop**
  - [ ] Phím tắt toàn cục mở Quick Add (`Ctrl+Shift+N`)
  - [ ] System tray chạy nền
  - [ ] Khóa bảo vệ PIN khi mở app
  - [ ] Đóng gói cài đặt Windows

- [ ] **Phase 6: Mở rộng Mobile**
- [ ] **Phase 7: Đồng bộ PC ↔ Mobile**
