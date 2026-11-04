import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatMoney } from "@/shared/lib/formatMoney";

export interface CategoryExpenseItem {
  id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  count: number;
}

export interface CategoryPieChartProps {
  data: CategoryExpenseItem[];
  totalExpense: number;
}

export function CategoryPieChart({ data, totalExpense }: CategoryPieChartProps) {
  if (data.length === 0 || totalExpense <= 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-64 rounded-2xl border border-dashed border-border/60">
        <p className="text-xs text-muted-foreground">Chưa có chi tiêu nào trong tháng này.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Donut Chart with glowing center */}
      <div className="h-56 w-56 shrink-0 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
            >
              {data.map((entry) => (
                <Cell key={entry.id} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: unknown) => [formatMoney(Number(value) || 0), "Số tiền"]}
              contentStyle={{
                backgroundColor: "rgba(15, 20, 31, 0.95)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "0.875rem",
                fontSize: "12px",
                color: "#f8fafc",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(12px)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground">
            Tổng chi tiêu
          </span>
          <span className="text-sm font-extrabold font-tabular text-foreground mt-0.5">
            {formatMoney(totalExpense)}
          </span>
        </div>
      </div>

      {/* Categories Legend List with Sleek Progress Visuals */}
      <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
        {data.map((cat) => {
          const percent = totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0;
          return (
            <div
              key={cat.id}
              className="p-2 rounded-xl hover:bg-muted/40 transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-foreground truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 font-tabular">
                  <span className="text-[11px] text-muted-foreground font-mono">{percent}%</span>
                  <span className="font-bold text-foreground text-xs">{formatMoney(cat.total)}</span>
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
