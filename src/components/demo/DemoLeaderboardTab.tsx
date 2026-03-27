import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Medal } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  currentUserId: string;
}

const DemoLeaderboardTab = ({ currentUserId }: Props) => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["demo-leaderboard"],
    queryFn: async () => {
      // Get all demo group members
      const { data: members, error: mErr } = await supabase
        .from("demo_group_members")
        .select("user_id");
      if (mErr) throw mErr;

      const userIds = members.map((m: any) => m.user_id);
      if (!userIds.length) return [];

      // Get profiles
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      if (pErr) throw pErr;

      // Get all demo predictions with points
      const { data: predictions, error: predErr } = await supabase
        .from("demo_predictions")
        .select("user_id, points_awarded, predicted_home_score, predicted_away_score, demo_match_id");
      if (predErr) throw predErr;

      // Get finished matches to verify exact scores
      const { data: finishedMatches } = await supabase
        .from("demo_matches")
        .select("id, home_score, away_score")
        .eq("status", "finished");

      const matchMap = new Map((finishedMatches || []).map((m: any) => [m.id, m]));

      // Aggregate
      const statsMap = new Map<string, { points: number; exact: number; correct: number; total: number }>();
      (predictions || []).forEach((p: any) => {
        const current = statsMap.get(p.user_id) || { points: 0, exact: 0, correct: 0, total: 0 };
        if (p.points_awarded !== null && p.points_awarded !== undefined) {
          current.points += p.points_awarded;
          current.total += 1;
          if (p.points_awarded === 3) current.exact += 1;
          if (p.points_awarded === 1) current.correct += 1;
        }
        statsMap.set(p.user_id, current);
      });

      const board = (profiles || []).map((p: any) => ({
        userId: p.id,
        displayName: p.display_name || "Jugador",
        avatarUrl: p.avatar_url,
        points: statsMap.get(p.id)?.points ?? 0,
        exact: statsMap.get(p.id)?.exact ?? 0,
        correct: statsMap.get(p.id)?.correct ?? 0,
        total: statsMap.get(p.id)?.total ?? 0,
      }));

      // Sort by points, then exact scores as tiebreaker
      board.sort((a: any, b: any) => b.points - a.points || b.exact - a.exact);
      return board;
    },
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>;

  if (!leaderboard?.length) return <p className="text-center text-muted-foreground py-12 font-body">No hay miembros aún.</p>;

  const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];

  return (
    <div className="space-y-2">
      {leaderboard.map((entry: any, i: number) => {
        const isMe = entry.userId === currentUserId;
        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-3 rounded-xl p-3 ${isMe ? "bg-primary/5 ring-1 ring-primary/20" : "card-elevated"}`}
          >
            <div className="w-8 text-center font-display text-lg text-muted-foreground">
              {i < 3 ? <Medal className={`w-5 h-5 mx-auto ${medalColors[i]}`} /> : <span>{i + 1}</span>}
            </div>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-display text-muted-foreground overflow-hidden">
              {entry.avatarUrl ? (
                <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                entry.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-semibold text-foreground truncate">
                {entry.displayName} {isMe && <span className="text-xs text-primary">(tú)</span>}
              </p>
              <p className="text-xs text-muted-foreground font-body">
                {entry.exact} exactos · {entry.correct} resultados · {entry.total} jugados
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl text-foreground">{entry.points}</p>
              <p className="text-[10px] text-muted-foreground font-body">pts</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DemoLeaderboardTab;
