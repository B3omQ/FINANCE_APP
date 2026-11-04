import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { formatMoney } from "@/shared/lib/formatMoney";
import { formatMonthYear } from "@/shared/lib/date";

export interface MonthlyTrendDataPoint {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  net: number;
}

export interface MonthlyBarChartProps {
  data: MonthlyTrendDataPoint[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const chartData = data.map((d) => {
    const parts = d.month.split("-");
    const label = parts[1] ? `T${Number(parts[1])}` : d.month;
    return {
      ...d,
      displayMonth: label,
      fullName: formatMonthYear(d.month),
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="displayMonth"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => {
              if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}tr`;
              if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
              return `${val}`;
            }}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => [
              formatMoney(Number(value) || 0),
              name === "income" ? "Thu nhập" : "Chi tiêu",
            ]}
            labelFormatter={(_: unknown, payload: readonly { payload?: { fullName?: string } }[]) => {
              const item = payload?.[0]?.payload;
              return item?.fullName ?? "";
            }}
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
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            formatter={(value: string) => (
              <span className="text-xs text-muted-foreground font-medium mr-2">
                {value === "income" ? "Thu nhập" : "Chi tiêu"}
              </span>
            )}
          />
          <Bar
            dataKey="income"
            name="income"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="expense"
            name="expense"
            fill="#f43f5e"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
