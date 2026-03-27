import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  groupId: string;
  currentUserId: string;
}

const LeaderboardTab = ({ groupId, currentUserId }: Props) => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["leaderboard", groupId],
    queryFn: async () => {
      // Get approved members
      const { data: members, error: mErr } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("status", "approved");
      if (mErr) throw mErr;

      const userIds = members.map((m) => m.user_id);
      if (!userIds.length) return [];

      // Get profiles
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      if (pErr) throw pErr;

      // Get predictions with points
      const { data: predictions, error: predErr } = await supabase
        .from("predictions")
        .select("user_id, points_awarded")
        .eq("group_id", groupId);
      if (predErr) throw predErr;

      // Aggregate points
      const pointsMap = new Map<string, { points: number; count: number }>();
      predictions.forEach((p) => {
        const current = pointsMap.get(p.user_id) || { points: 0, count: 0 };
        current.points += p.points_awarded ?? 0;
        current.count += 1;
        pointsMap.set(p.user_id, current);
      });

      const board = profiles.map((p) => ({
        userId: p.id,
        displayName: p.display_name || "Jugador",
        avatarUrl: p.avatar_url,
        points: pointsMap.get(p.id)?.points ?? 0,
        predictions: pointsMap.get(p.id)?.count ?? 0,
      }));

      board.sort((a, b) => b.points - a.points);
      return board;
    },
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>;

  if (!leaderboard?.length) return <p className="text-center text-muted-foreground py-12 font-body">No hay miembros aprobados aún.</p>;

  const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];

  return (
    <div className="space-y-2">
      {leaderboard.map((entry, i) => {
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
              <p className="text-xs text-muted-foreground font-body">{entry.predictions} predicciones</p>
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

export default LeaderboardTab;
