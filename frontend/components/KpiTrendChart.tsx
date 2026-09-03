"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

interface Props {
  trend: TrendPoint[];
  target: string | null;
  unit: string;
  height?: number;
}

export default function KpiTrendChart({ trend, target, unit, height = 280 }: Props) {
  const data = trend.map((point) => ({
    period: point.period,
    value: Number(point.value),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={48} />
        <Tooltip formatter={(value) => [`${value} ${unit}`, "Value"]} />
        {target !== null && (
          <ReferenceLine
            y={Number(target)}
            stroke="#dc2626"
            strokeDasharray="6 4"
            label={{ value: `target ${target}`, fontSize: 11, fill: "#dc2626" }}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0f172a"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
