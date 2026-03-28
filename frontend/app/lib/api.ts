const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface RoundResult {
  round: number;
  scores: Record<string, number>;
  similarity_matrix: Record<string, number>;
  decisions: Record<string, "reward" | "slash">;
  accuracy: number;
  stakes: Record<string, number>;
  tx_hash: string;
}

export interface TrainingStatus {
  current_round: number;
  total_rounds: number;
  is_training: boolean;
  round_history: RoundResult[];
}

export async function startTraining() {
  const res = await fetch(API_URL + "/start-training", { method: "POST" });
  return res.json();
}

export async function getStatus(): Promise<TrainingStatus> {
  const res = await fetch(API_URL + "/status");
  return res.json();
}

export async function getRound(roundId: number): Promise<RoundResult> {
  const res = await fetch(API_URL + "/round/" + roundId);
  return res.json();
}

export async function predict(image: number[]): Promise<{ digit: number; confidence: number }> {
  const res = await fetch(API_URL + "/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  return res.json();
}
