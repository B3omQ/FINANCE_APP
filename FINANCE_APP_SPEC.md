# FINANCE APP: Đặc tả dự án cho Agent

> File này là nguồn sự thật duy nhất để dựng và triển khai dự án. Agent đọc toàn bộ trước khi viết code, làm theo **từng giai đoạn (Phase)** theo đúng thứ tự, và chỉ chuyển sang phase sau khi phase hiện tại đạt đủ **Tiêu chí hoàn thành**.

---

## 0. Cách agent làm việc với file này

1. Đọc hết file. Không bỏ qua mục "Quy tắc bất biến" (mục 3).
2. Làm **một phase mỗi lần**. Cuối mỗi phase: chạy build, chạy test, báo cáo ngắn (đã làm gì, chưa làm gì, vấn đề gặp phải).
3. Khi gặp điểm chưa rõ, chọn phương án **đơn giản nhất phù hợp với quy tắc bất biến** và ghi lại quyết định vào `docs/DECISIONS.md`.
4. Không thêm tính năng ngoài phạm vi phase. Không thêm thư viện ngoài danh sách ở mục 2 khi chưa có lý do rõ ràng (nếu thêm, ghi lý do vào `docs/DECISIONS.md`).
5. Commit nhỏ, thông điệp rõ ràng theo dạng `feat(transactions): add quick add dialog`.

---

## 1. Tổng quan

**Mục tiêu**: App quản lý tài chính cá nhân, **local-first**, dữ liệu nằm hoàn toàn trên máy người dùng, không tài khoản, không server, không gửi dữ liệu ra ngoài.

**Nền tảng**: Desktop trước (Windows là ưu tiên, macOS/Linux dùng được), thiết kế sẵn để mở rộng sang mobile (Android/iOS) và đồng bộ PC ↔ mobile sau này.

**Người dùng**: một người, tiếng Việt, tiền tệ mặc định **VND**.

**Tiêu chí thành công cốt lõi**: nhập một giao dịch trong **dưới 5 giây**.

### Chức năng MVP

1. Giao dịch thu / chi / chuyển khoản
2. Ví / tài khoản (tiền mặt, ngân hàng, ví điện tử)
3. Danh mục (có sẵn mặc định, tùy chỉnh được)
4. Ngân sách theo tháng và theo danh mục
5. Dashboard (tổng quan tháng, biểu đồ)
6. Tìm kiếm và lọc
7. Giao dịch định kỳ
8. Import CSV sao kê, export/backup
9. Mục tiêu tiết kiệm

---

## 2. Công nghệ

| Phần | Lựa chọn | Ghi chú |
|---|---|---|
| Shell desktop | **Tauri 2** | Hỗ trợ build mobile về sau |
| Frontend | **React + TypeScript (strict) + Vite** | |
| UI | **Tailwind CSS + shadcn/ui** | Dark mode mặc định |
| Lưu trữ | **SQLite** qua `@tauri-apps/plugin-sql` | Một file `.db` trên máy |
| State toàn cục | **Zustand** | Chỉ cho UI state nhỏ |
| Server-state/cache | **TanStack Query** | Bọc các lời gọi repository |
| Router | **React Router** | |
| Biểu đồ | **Recharts** | |
| CSV | **PapaParse** | |
| Ngày giờ | **date-fns** | |
| Form | **React Hook Form + Zod** | Validate schema |
| Test | **Vitest** (+ Testing Library cho component) | |
| Lint/format | **ESLint + Prettier** | |
| Phím tắt toàn cục | `@tauri-apps/plugin-global-shortcut` | Phase 5 |

**Phiên bản**: dùng bản ổn định mới nhất của từng thư viện tại thời điểm khởi tạo, đọc tài liệu chính thức của Tauri 2 và plugin SQL trước khi cấu hình vì API plugin có thể thay đổi.

**Yêu cầu môi trường**: Node.js LTS, pnpm (hoặc npm), Rust toolchain (rustup), và các phụ thuộc hệ thống của Tauri theo từng hệ điều hành.

---

## 3. Quy tắc bất biến

Các quy tắc này **không được vi phạm** ở bất kỳ phase nào.

1. **Tiền là số nguyên.** VND không có phần thập phân. Lưu và tính toán bằng `INTEGER` (đơn vị: đồng). Tuyệt đối không dùng `float` cho tiền.
2. **Số tiền có dấu trong DB.** `amount` âm cho khoản chi/chuyển đi, dương cho khoản thu/chuyển đến. Số dư ví = `initial_balance + SUM(amount)`.
3. **Chỉ lớp `data/` được viết SQL.** UI và `features/` không bao giờ gọi SQL trực tiếp, chỉ gọi qua repository interface.
4. **`domain/` là TypeScript thuần.** Không import React, Tauri, hay bất cứ thứ gì từ `data/`, `features/`, `shared/`. Phải test được bằng Vitest không cần môi trường Tauri.
5. **Không import chéo giữa các feature.** Cần dùng chung thì đẩy xuống `domain/` hoặc `shared/`.
6. **ID là UUID (v4/v7), dạng TEXT.** Không dùng auto-increment, để đồng bộ về sau không đụng ID.
7. **Mọi bảng dữ liệu có `created_at`, `updated_at`, `deleted_at`.** Xóa là **xóa mềm** (đặt `deleted_at`), để đồng bộ sau này hoạt động đúng. Thời gian lưu dạng ISO 8601 UTC.
8. **Ngày giao dịch** lưu dạng `YYYY-MM-DD` (TEXT) theo giờ địa phương người dùng, tách biệt với `created_at`.
9. **Chuyển khoản = hai giao dịch liên kết** bằng cùng `transfer_group_id`. Chuyển khoản **không được** tính vào thu/chi trong báo cáo và ngân sách.
10. **Mọi thay đổi schema đi qua migration** có đánh số. Không sửa migration đã chạy.
11. **Không gọi mạng.** Ứng dụng phải chạy hoàn toàn offline.
12. **UI responsive từ đầu**: component co giãn được, sidebar trên màn hình rộng, thanh tab dưới trên màn hình hẹp.

---

## 4. Cấu trúc thư mục

```
finance-app/
├── src-tauri/                       # Khối 1: vỏ desktop (Rust)
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs                   # đăng ký plugin, migrations, phím tắt
│   ├── capabilities/                # quyền truy cập
│   ├── tauri.conf.json
│   └── Cargo.toml
│
├── src/
│   ├── app/                         # Khối 2: khởi động, layout, điều hướng
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── providers.tsx            # gắn repositories, QueryClient, theme
│   │
│   ├── features/                    # Khối 3: từng chức năng
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── accounts/
│   │   ├── categories/
│   │   ├── recurring/
│   │   ├── goals/
│   │   └── settings/
│   │
│   ├── domain/                      # Khối 4: nghiệp vụ thuần
│   │   ├── types.ts
│   │   ├── balance.ts
│   │   ├── budget.ts
│   │   ├── report.ts
│   │   ├── recurring.ts
│   │   └── __tests__/
│   │
│   ├── data/                        # Khối 5: truy cập dữ liệu
│   │   ├── repositories/
│   │   │   ├── types.ts             # interface các repository
│   │   │   ├── sqlite/
│   │   │   └── memory/              # bản giả trong RAM để dev UI và test
│   │   ├── db/
│   │   │   ├── client.ts
│   │   │   └── migrations/          # 001_init.sql, 002_...
│   │   └── importExport/
│   │       ├── csvImport.ts
│   │       └── backup.ts
│   │
│   ├── shared/                      # Khối 6: đồ dùng chung
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── hooks/
│   │   ├── lib/                     # formatMoney, parseAmount, date, uuid
│   │   └── styles/
│   │
│   └── store/                       # Khối 7: state toàn cục nhỏ
│       └── uiStore.ts
│
├── docs/
│   ├── DECISIONS.md                 # nhật ký quyết định
│   └── PROGRESS.md                  # trạng thái từng phase
├── package.json
├── vite.config.ts
├── tsconfig.json
└── FINANCE_APP_SPEC.md              # file này
```

### Quy tắc phụ thuộc

```
app  →  features  →  domain
                 →  data  →  domain
        (tất cả)  →  shared
store: chỉ được dùng bởi app và features
```

Mỗi feature có cấu trúc con thống nhất:

```
features/<tên>/
├── <Tên>Page.tsx        # trang chính (nếu có)
├── components/          # component riêng của feature
├── use<Tên>.ts          # hook gọi repository qua TanStack Query
└── schema.ts            # Zod schema cho form (nếu có)
```

---

## 5. Mô hình dữ liệu

### 5.1 Types (`domain/types.ts`)

```ts
export type ID = string;               // UUID
export type ISODateTime = string;      // 2026-10-27T08:30:00.000Z
export type DateOnly = string;         // 2026-10-27
export type Money = number;            // integer, đơn vị đồng

export interface BaseEntity {
  id: ID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt: ISODateTime | null;
}

export type AccountType = 'cash' | 'bank' | 'ewallet' | 'other';
export interface Account extends BaseEntity {
  name: string;
  type: AccountType;
  initialBalance: Money;
  color: string;
  icon: string;
  archived: boolean;
  sortOrder: number;
}

export type CategoryKind = 'income' | 'expense';
export interface Category extends BaseEntity {
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string;
  sortOrder: number;
}

export type TransactionType = 'income' | 'expense' | 'transfer';
export interface Transaction extends BaseEntity {
  date: DateOnly;
  amount: Money;                  // CÓ DẤU: thu (+), chi (-), chuyển đi (-), chuyển đến (+)
  type: TransactionType;
  accountId: ID;
  categoryId: ID | null;          // null khi type = 'transfer'
  note: string;
  transferGroupId: ID | null;     // cùng giá trị cho 2 dòng của một lần chuyển
  recurringRuleId: ID | null;     // nếu sinh ra từ giao dịch định kỳ
}

export interface Budget extends BaseEntity {
  categoryId: ID;
  month: string;                  // 'YYYY-MM'
  limit: Money;                   // dương
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export interface RecurringRule extends BaseEntity {
  name: string;
  type: 'income' | 'expense';
  amount: Money;                  // dương, dấu áp dụng khi sinh giao dịch
  accountId: ID;
  categoryId: ID;
  note: string;
  frequency: RecurringFrequency;
  interval: number;               // mỗi N đơn vị
  startDate: DateOnly;
  endDate: DateOnly | null;
  lastGeneratedDate: DateOnly | null;
  active: boolean;
}

export interface Goal extends BaseEntity {
  name: string;
  targetAmount: Money;
  savedAmount: Money;
  targetDate: DateOnly | null;
  accountId: ID | null;
  color: string;
  icon: string;
}
```

### 5.2 Migration đầu tiên (`001_init.sql`)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash','bank','ewallet','other')),
  initial_balance INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#64748b',
  icon TEXT NOT NULL DEFAULT 'wallet',
  archived INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
  color TEXT NOT NULL DEFAULT '#64748b',
  icon TEXT NOT NULL DEFAULT 'tag',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE recurring_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  category_id TEXT NOT NULL REFERENCES categories(id),
  note TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
  interval INTEGER NOT NULL DEFAULT 1 CHECK (interval >= 1),
  start_date TEXT NOT NULL,
  end_date TEXT,
  last_generated_date TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,                       -- YYYY-MM-DD
  amount INTEGER NOT NULL,                  -- có dấu
  type TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  account_id TEXT NOT NULL REFERENCES accounts(id),
  category_id TEXT REFERENCES categories(id),
  note TEXT NOT NULL DEFAULT '',
  transfer_group_id TEXT,
  recurring_rule_id TEXT REFERENCES recurring_rules(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_tx_date ON transactions(date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tx_account ON transactions(account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tx_category ON transactions(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tx_transfer ON transactions(transfer_group_id);

CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  month TEXT NOT NULL,                      -- YYYY-MM
  "limit" INTEGER NOT NULL CHECK ("limit" >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE UNIQUE INDEX idx_budget_unique ON budgets(category_id, month) WHERE deleted_at IS NULL;

CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount INTEGER NOT NULL CHECK (target_amount > 0),
  saved_amount INTEGER NOT NULL DEFAULT 0,
  target_date TEXT,
  account_id TEXT REFERENCES accounts(id),
  color TEXT NOT NULL DEFAULT '#22c55e',
  icon TEXT NOT NULL DEFAULT 'target',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Migration được đăng ký trong Rust (`tauri_plugin_sql::Builder::add_migrations`). Khi thêm migration mới, tạo file `00N_*.sql` và đăng ký tiếp.

### 5.3 Danh mục mặc định (seed ở lần chạy đầu)

- **Chi**: Ăn uống, Đi lại, Nhà ở, Hóa đơn & tiện ích, Mua sắm, Sức khỏe, Học tập, Giải trí, Quà tặng & từ thiện, Khác
- **Thu**: Lương, Thưởng, Thu nhập phụ, Khác

---

## 6. Hợp đồng Repository (`data/repositories/types.ts`)

```ts
export interface TransactionFilter {
  dateFrom?: DateOnly;
  dateTo?: DateOnly;
  accountIds?: ID[];
  categoryIds?: ID[];
  type?: TransactionType;
  search?: string;                // tìm trong note
  limit?: number;
  offset?: number;
}

export interface TransactionRepository {
  list(filter?: TransactionFilter): Promise<Transaction[]>;
  get(id: ID): Promise<Transaction | null>;
  create(input: NewTransaction): Promise<Transaction>;
  createTransfer(input: NewTransfer): Promise<[Transaction, Transaction]>;  // atomic
  update(id: ID, patch: Partial<NewTransaction>): Promise<Transaction>;
  softDelete(id: ID): Promise<void>;    // xóa cả cặp nếu là transfer
  restore(id: ID): Promise<void>;       // dùng cho "Hoàn tác"
}

export interface AccountRepository {
  list(opts?: { includeArchived?: boolean }): Promise<Account[]>;
  get(id: ID): Promise<Account | null>;
  create(input: NewAccount): Promise<Account>;
  update(id: ID, patch: Partial<NewAccount>): Promise<Account>;
  softDelete(id: ID): Promise<void>;
  balances(): Promise<Record<ID, Money>>;   // initial_balance + SUM(amount)
}

export interface CategoryRepository { /* list, get, create, update, softDelete */ }
export interface BudgetRepository {
  listByMonth(month: string): Promise<Budget[]>;
  upsert(categoryId: ID, month: string, limit: Money): Promise<Budget>;
  copyMonth(from: string, to: string): Promise<void>;
  softDelete(id: ID): Promise<void>;
}
export interface RecurringRepository { /* CRUD + markGenerated(id, date) */ }
export interface GoalRepository { /* CRUD + addSaving(id, amount) */ }
export interface SettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export interface Repositories {
  transactions: TransactionRepository;
  accounts: AccountRepository;
  categories: CategoryRepository;
  budgets: BudgetRepository;
  recurring: RecurringRepository;
  goals: GoalRepository;
  settings: SettingsRepository;
}
```

`providers.tsx` cung cấp `Repositories` qua React Context. Có hai bản cài đặt: `sqlite/` (thật) và `memory/` (giả). Chuyển đổi bằng biến môi trường lúc dev.

---

## 7. Logic nghiệp vụ (`domain/`)

Tất cả là **hàm thuần**, có unit test.

| File | Hàm chính | Quy tắc |
|---|---|---|
| `balance.ts` | `accountBalance(initial, txs)` | `initial + sum(amount)`, bỏ giao dịch đã xóa mềm |
| `budget.ts` | `budgetStatus(limit, spent)` | Trả `{ spent, remaining, percent, level }` với `level`: `ok` (<80%), `warn` (80-100%), `over` (>100%). `spent` chỉ tính giao dịch `expense`, **loại `transfer`** |
| `report.ts` | `summarizeMonth(txs)`, `groupByCategory(txs)`, `monthlyTrend(txs, n)` | Thu/chi **loại bỏ** `transfer`. Chi tiêu hiển thị dạng số dương |
| `recurring.ts` | `generateDue(rule, today)` | Sinh danh sách ngày đến hạn từ `lastGeneratedDate` (hoặc `startDate`) đến `today`, tôn trọng `endDate`. Ngày cuối tháng xử lý đúng (31 → 30/28) |

---

## 8. Tiện ích dùng chung (`shared/lib/`)

- `formatMoney(n)`: `1500000` → `1.500.000 ₫` (locale `vi-VN`, không thập phân).
- `parseAmount(input)`: hỗ trợ gõ tắt, trả `number | null`:
  - `50k` → 50000, `1tr` → 1000000, `1tr2` → 1200000, `2tr5` → 2500000
  - `1.500.000` / `1,500,000` / `1500000` → 1500000
  - Không hợp lệ hoặc âm → `null`
- `date.ts`: `today()` (DateOnly theo giờ máy), `toMonthKey(date)`, `monthRange(month)`.
- `uuid.ts`: sinh UUID.

---

## 9. Đặc tả giao diện

### 9.1 Điều hướng

- **Desktop (≥ 1024px)**: sidebar trái gồm Tổng quan, Giao dịch, Ngân sách, Ví, Mục tiêu, Định kỳ, Cài đặt.
- **Hẹp (< 1024px)**: thanh tab dưới (5 mục chính), mục còn lại vào menu "Thêm".
- Nút **`+` nổi** luôn có mặt ở màn hình chính, mở Quick Add.

### 9.2 Phong cách

- Dark mode mặc định, có thể chuyển sang light.
- Màu thu: xanh lá. Màu chi: đỏ cam. Số tiền dùng font monospace/tabular-nums.
- Tối giản, nhiều khoảng trắng, bo góc nhẹ.

### 9.3 Quick Add (quan trọng nhất)

- Mở bằng nút `+` hoặc phím `N` (trong app).
- Trường bắt buộc: **số tiền**, **danh mục**, **ví**. Ngày mặc định hôm nay. Ghi chú tùy chọn.
- Ô số tiền nhận `parseAmount`, hiển thị xem trước định dạng ngay khi gõ.
- Danh mục hay dùng hiện thành chip bấm một lần. Ví dùng gần nhất được chọn sẵn.
- Chuyển nhanh giữa Chi / Thu / Chuyển khoản bằng tab nhỏ ở đầu.
- `Enter` để lưu, `Esc` để đóng. Có tùy chọn "Lưu và thêm tiếp".
- Gợi ý danh mục theo ghi chú đã dùng trước đó (khớp từ khóa đơn giản, không cần AI).

### 9.4 Các trang

**Tổng quan**
- 3 thẻ: Thu, Chi, Còn lại (tháng đang chọn) kèm so sánh tháng trước.
- Biểu đồ tròn chi tiêu theo danh mục + biểu đồ cột thu/chi 6 tháng.
- 5 giao dịch gần nhất + các ngân sách sắp vượt (`warn`/`over`).
- Bộ chọn tháng ở đầu trang.

**Giao dịch**
- Danh sách nhóm theo ngày (tổng ngày ở đầu nhóm), thanh lọc phía trên (khoảng ngày, ví, danh mục, loại, ô tìm kiếm).
- Bấm dòng để sửa. Xóa hiện toast "Hoàn tác" trong vài giây (dùng `softDelete`/`restore`).
- Phân trang hoặc cuộn vô hạn (50 dòng mỗi lần).

**Ngân sách**
- Danh sách danh mục chi với thanh tiến độ (màu theo `level`), nhập hạn mức tại chỗ.
- Nút "Sao chép từ tháng trước".

**Ví**
- Thẻ từng ví với số dư hiện tại, tổng tài sản ở đầu trang.
- Thêm, sửa, lưu trữ (archive) ví. Nút "Chuyển tiền giữa ví".

**Mục tiêu**: thẻ mục tiêu với thanh phần trăm, nút "Thêm tiền tiết kiệm".

**Định kỳ**: danh sách quy tắc, bật/tắt, sửa, xem lần sinh tiếp theo.

**Cài đặt**: giao diện, tiền tệ, danh mục, import CSV, export/backup, khôi phục.

---

## 10. Kế hoạch triển khai theo phase

Mỗi phase có: **Việc cần làm**, **Tiêu chí hoàn thành**. Agent không chuyển phase khi chưa đạt.

### Phase 0: Khởi tạo dự án

**Việc cần làm**
- Khởi tạo Tauri 2 + React + TypeScript (strict) + Vite.
- Cài Tailwind, shadcn/ui, ESLint, Prettier, Vitest, TanStack Query, React Router, Zustand, Zod, React Hook Form, date-fns, Recharts, PapaParse.
- Tạo đủ cấu trúc thư mục ở mục 4 (thư mục rỗng có `.gitkeep`).
- Cấu hình path alias (`@/app`, `@/features`, `@/domain`, `@/data`, `@/shared`, `@/store`).
- Thêm ESLint rule/`eslint-plugin-boundaries` (hoặc tương đương) để **cấm vi phạm quy tắc phụ thuộc** ở mục 4.
- Tạo `docs/DECISIONS.md`, `docs/PROGRESS.md`.

**Tiêu chí hoàn thành**
- `pnpm tauri dev` mở được cửa sổ app hiển thị trang trống.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` chạy không lỗi.
- Một import sai quy tắc phụ thuộc bị lint báo lỗi (kiểm tra thử rồi bỏ).

### Phase 1: Lõi dữ liệu và nghiệp vụ

**Việc cần làm**
- Viết `domain/types.ts` đúng mục 5.1.
- Viết `shared/lib` (`formatMoney`, `parseAmount`, `date`, `uuid`) kèm test đầy đủ.
- Viết `domain/balance.ts`, `budget.ts`, `report.ts`, `recurring.ts` kèm test.
- Viết migration `001_init.sql`, đăng ký trong Rust, viết `db/client.ts`.
- Cài đặt toàn bộ repository bản `memory/` trước, rồi bản `sqlite/`.
- Seed danh mục mặc định và tạo ví "Tiền mặt" ở lần chạy đầu.
- Test repository `sqlite/` bằng bộ test dùng chung chạy được với cả hai bản cài đặt (cùng một test suite, hai implementation).

**Tiêu chí hoàn thành**
- Toàn bộ test `domain/` và `shared/lib` pass, độ phủ các hàm tính toán chính ≥ 90%.
- Test bắt buộc có: chuyển khoản không làm thay đổi tổng thu/chi; xóa mềm cặp transfer xóa cả hai dòng; số dư ví đúng sau chuỗi giao dịch; `parseAmount` đủ các ca ở mục 8; `generateDue` đúng ca cuối tháng.
- Mở app lần đầu tạo file DB, seed đúng, mở lại không seed trùng.

### Phase 2: Ví, danh mục, giao dịch (UI cốt lõi)

**Việc cần làm**
- Layout app (sidebar/tab dưới, theme dark/light), routes.
- Feature `accounts`: danh sách, thêm, sửa, archive, hiển thị số dư.
- Feature `categories`: danh sách, thêm, sửa, đổi màu/icon, sắp xếp.
- Feature `transactions`: danh sách nhóm theo ngày, form thêm/sửa, xóa kèm hoàn tác, chuyển khoản giữa ví.
- **Quick Add** theo đúng mục 9.3 (kể cả phím `N`, chip danh mục, gợi ý theo ghi chú).
- Bộ lọc và tìm kiếm giao dịch.

**Tiêu chí hoàn thành**
- Thêm một giao dịch chi bằng bàn phím: `N` → gõ `50k` → chọn danh mục → `Enter` hoàn tất trong dưới 5 giây.
- Số dư ví cập nhật đúng sau thêm/sửa/xóa/hoàn tác/chuyển khoản.
- Đóng và mở lại app, dữ liệu vẫn còn.
- Giao diện không vỡ khi thu nhỏ cửa sổ xuống ~400px.

### Phase 3: Dashboard, ngân sách, mục tiêu, định kỳ

**Việc cần làm**
- Feature `dashboard` theo mục 9.4 (thẻ tổng quan, biểu đồ tròn, biểu đồ cột 6 tháng, so sánh tháng trước).
- Feature `budgets`: nhập hạn mức, thanh tiến độ theo `level`, sao chép từ tháng trước.
- Feature `goals`: CRUD, thêm tiền tiết kiệm, phần trăm hoàn thành.
- Feature `recurring`: CRUD quy tắc. Khi mở app, chạy `generateDue` cho mọi quy tắc đang bật và tạo giao dịch tương ứng, cập nhật `lastGeneratedDate`. **Tuyệt đối không sinh trùng** nếu mở app nhiều lần.

**Tiêu chí hoàn thành**
- Số liệu dashboard khớp với tổng tính tay từ danh sách giao dịch (kèm test tích hợp với dữ liệu mẫu).
- Chuyển khoản không xuất hiện trong thu/chi/ngân sách.
- Mở app 3 lần liên tiếp không sinh thêm giao dịch định kỳ mới.
- Ngân sách đổi màu đúng tại các ngưỡng 80% và 100%.

### Phase 4: [ĐÃ LƯỢC BỎ]
> **Quyết định**: Tính năng Import/Export sao kê ngân hàng CSV và sao lưu phức tạp được lược bỏ do không cần thiết đối với nhu cầu sử dụng cá nhân độc lập. Toàn bộ dữ liệu của người dùng được tự động lưu trữ trực tiếp và bền vững trong cơ sở dữ liệu SQLite cục bộ (`finance.db`).

### Phase 5: Đóng gói hoàn thiện bản Windows

**Mục tiêu chính**: Tập trung hoàn thiện và đóng gói ứng dụng desktop Windows độc lập, an toàn và dễ sử dụng cho cá nhân.

**Việc cần làm**
- **Cấu hình Tauri & Đóng gói release**: Cấu hình hoàn thiện `tauri.conf.json` (tên sản phẩm `FinanceApp`, phiên bản, icon ứng dụng, kích thước cửa sổ tối ưu 1100x750, minWidth 400).
- **Quyền hạn SQLite cục bộ**: Đảm bảo toàn quyền I/O cho SQLite (`sql:default`, `sql:allow-execute`, `sql:allow-load`, `sql:allow-select`, `sql:allow-close`) để dữ liệu lưu vĩnh viễn vào `%APPDATA%\com.financeapp.desktop\finance.db`.
- **Bộ cài đặt Windows tự động (NSIS & Portable)**: Xuất file cài đặt chuẩn `FinanceApp_x64-setup.exe` và file chạy trực tiếp `tauri-app.exe`.
- **Tối ưu dung lượng & Tiện ích quản lý**: Tích hợp menu tiện ích khởi chạy, build và dọn dẹp dung lượng cache build (`target/`) trong `start.bat` để giải phóng ổ cứng bất cứ khi nào cần.
- **Dọn dẹp mã nguồn & Kiểm thử chất lượng**: Đảm bảo 100% test cases pass, 0 lỗi TypeScript strict, 0 warning ESLint, giao diện hiển thị sắc nét trên màn hình Windows.

**Tiêu chí hoàn thành**
- Bản cài đặt Windows `.exe` chạy độc lập trên máy tính sạch (không cần cài thêm Node.js hay Rust).
- Thao tác thêm/sửa/xóa giao dịch, tài khoản, ngân sách, mục tiêu được lưu vĩnh viễn vào SQLite. Đóng app, mở lại hoặc khởi động lại máy dữ liệu vẫn nguyên vẹn.
- Thao tác build và dọn dẹp dung lượng được tự động hóa, dễ sử dụng.

### Phase 6: Mobile (làm sau khi desktop ổn định)

Việc cần làm

Kích hoạt target Android của Tauri 2.
Chỉnh layout: thanh tab dưới, nút nhập nhanh lớn, form tối ưu cảm ứng. Không sửa domain/ hay data/.
Kiểm tra plugin SQL và đường dẫn lưu file trên mobile.

Tiêu chí hoàn thành

Cùng codebase build được bản mobile chạy trên thiết bị/giả lập.
Quick Add dùng thoải mái bằng một tay.

Phương án dự phòng: nếu Tauri mobile gặp lỗi chặn được, giữ nguyên domain/ + data/ + shared/lib và viết UI mobile riêng (React Native hoặc Capacitor). Ghi quyết định vào DECISIONS.md.

### Phase 7: Đồng bộ PC ↔ mobile (tùy chọn, làm cuối)

Hướng khuyến nghị: đồng bộ qua file trong thư mục cloud có sẵn (Drive/OneDrive/Syncthing). Mỗi thiết bị ghi bản đổi của mình, gộp dựa trên updated_at, bản sửa mới nhất thắng, xóa mềm được đồng bộ như một thay đổi. Thực hiện bằng cách bọc/tạo thêm một bản cài đặt repository, không sửa UI.

Tiêu chí hoàn thành

Sửa trên PC, đồng bộ, thấy trên mobile và ngược lại.
Xóa trên một máy được phản ánh trên máy kia, không "sống lại".

## 11. Tiêu chuẩn chất lượng

**Kiểm thử**
- `domain/` và `shared/lib`: unit test bắt buộc, không phụ thuộc Tauri.
- Repository: một test suite chung chạy cho cả `memory/` và `sqlite/`.
- Component quan trọng (Quick Add, form giao dịch): test hành vi cơ bản bằng Testing Library.

**Code**
- TypeScript `strict`, không dùng `any` nếu không có lý do (ghi chú tại chỗ).
- Component nhỏ, một trách nhiệm. File không nên vượt ~250 dòng.
- Validate input người dùng bằng Zod trước khi gọi repository.
- Xử lý lỗi rõ ràng: lỗi DB hiện toast thân thiện, không làm app chết trắng.

**Hiệu năng**
- Danh sách giao dịch phân trang/ảo hóa, mượt với 10.000+ bản ghi.
- Truy vấn dashboard dùng chỉ mục, không tải toàn bộ bảng vào bộ nhớ.

**Bảo mật và riêng tư**
- Không gọi mạng, không telemetry.
- Không log dữ liệu tài chính ra console ở bản build.
- Khóa PIN không lưu dạng thô.

---

## 12. Lệnh thường dùng

```bash
pnpm install              # cài phụ thuộc
pnpm tauri dev            # chạy app desktop khi phát triển
pnpm dev                  # chạy riêng giao diện web (dùng repository memory)
pnpm typecheck            # kiểm tra kiểu
pnpm lint                 # lint (gồm kiểm tra quy tắc phụ thuộc)
pnpm test                 # chạy test
pnpm tauri build          # đóng gói bản cài đặt
```

---

## 13. Rủi ro và cách xử lý

| Rủi ro | Cách xử lý |
|---|---|
| Plugin SQL/Tauri mobile chưa ổn định | Giữ lớp `domain/` + `data/` độc lập framework; có phương án dự phòng ở Phase 6 |
| Sinh trùng giao dịch định kỳ | Dùng `lastGeneratedDate`, chạy trong transaction DB, có test mở app nhiều lần |
| Sai lệch số dư | Số dư luôn tính từ `initial_balance + SUM(amount)`, không lưu số dư riêng |
| Mất dữ liệu do xóa nhầm | Xóa mềm + hoàn tác, nhắc sao lưu định kỳ |
| Xung đột đồng bộ | Quy tắc "mới nhất thắng" dựa trên `updated_at`, đủ cho một người dùng |
| Lệch múi giờ khi lưu ngày | Ngày giao dịch lưu `DateOnly` giờ địa phương, `created_at/updated_at` lưu UTC |

---

## 14. Định nghĩa "Hoàn thành" cho cả dự án (bản desktop)

- [ ] Phase 0 đến 5 đạt toàn bộ tiêu chí hoàn thành
- [ ] Không vi phạm quy tắc bất biến (mục 3)
- [ ] Test pass, lint sạch, typecheck sạch
- [ ] Nhập một giao dịch dưới 5 giây bằng bàn phím
- [ ] Backup/restore thành công, dữ liệu giống hệt
- [ ] Bản cài đặt Windows chạy trên máy sạch
- [ ] `docs/DECISIONS.md` và `docs/PROGRESS.md` được cập nhật đầy đủ
