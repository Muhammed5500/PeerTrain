"use client";

interface NodeCardProps {
  nodeId: string;
  address: string;
  score: number | null;
  stake: number;
  initialStake: number;
  decision: "reward" | "slash" | null;
  isActive: boolean;
}

export default function NodeCard({
  nodeId,
  address,
  score,
  stake,
  initialStake,
  decision,
  isActive,
}: NodeCardProps) {
  const stakeChange = stake - initialStake;
  const scoreWidth = score !== null ? Math.max(0, Math.min(100, ((score + 1) / 2) * 100)) : 0;

  const getScoreColor = () => {
    if (score === null) return "bg-gray-600";
    if (score > 0.5) return "bg-green-500";
    if (score > 0.2) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${
        decision === "slash"
          ? "border-red-500/50 bg-red-500/5"
          : decision === "reward"
          ? "border-green-500/30 bg-[#141414]"
          : "border-[#222] bg-[#141414]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{nodeId.replace("node_", "Node ")}</h3>
          <p className="text-xs text-[#888]">{address.slice(0, 6)}...{address.slice(-4)}</p>
        </div>
        {decision && (
          <span
            className={`px-2 py-1 rounded text-xs font-bold ${
              decision === "reward"
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {decision === "reward" ? "Honest" : "Cheater"}
          </span>
        )}
      </div>

      {/* Score Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#888]">Score</span>
          <span className={score !== null && score < 0.2 ? "text-red-400" : "text-white"}>
            {score !== null ? score.toFixed(3) : "—"}
          </span>
        </div>
        <div className="h-2 bg-[#222] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getScoreColor()}`}
            style={{ width: `${scoreWidth}%` }}
          />
        </div>
      </div>

      {/* Stake */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-[#888]">Stake</span>
        <div className="flex items-center gap-2">
          <span className="font-mono">{stake}</span>
          {stakeChange !== 0 && (
            <span
              className={`text-xs font-bold ${
                stakeChange > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {stakeChange > 0 ? "+" : ""}
              {stakeChange}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
