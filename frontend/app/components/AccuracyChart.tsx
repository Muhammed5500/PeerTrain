"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AccuracyChartProps {
  data: { round: number; accuracy: number }[];
}

export default function AccuracyChart({ data }: AccuracyChartProps) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#141414] p-4">
      <h3 className="text-sm font-semibold text-[#888] mb-3">Model Accuracy</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="round" stroke="#888" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} stroke="#888" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: "#141414", border: "1px solid #222", borderRadius: 8 }}
            labelStyle={{ color: "#888" }}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
