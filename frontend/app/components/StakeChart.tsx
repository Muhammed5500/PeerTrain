"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface StakeChartProps {
  data: { round: number; node_A: number; node_B: number; node_C: number; node_D: number }[];
}

export default function StakeChart({ data }: StakeChartProps) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#141414] p-4">
      <h3 className="text-sm font-semibold text-[#888] mb-3">Stake History</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis dataKey="round" stroke="#888" tick={{ fontSize: 12 }} />
          <YAxis stroke="#888" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: "#141414", border: "1px solid #222", borderRadius: 8 }}
            labelStyle={{ color: "#888" }}
          />
          <Legend />
          <Line type="monotone" dataKey="node_A" stroke="#22c55e" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="node_B" stroke="#16a34a" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="node_C" stroke="#15803d" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="node_D" stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
