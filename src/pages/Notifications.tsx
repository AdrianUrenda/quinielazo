import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Bell, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch groups where user is admin
  const { data: adminGroups } = useQuery({
    queryKey: ["admin-groups", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("id, name")
        .eq("admin_user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch pending members across all admin groups
  const { data: pendingRequests, isLoading } = useQuery({
    queryKey: ["pending-requests", adminGroups?.map((g) => g.id)],
    queryFn: async () => {
      const groupIds = adminGroups!.map((g) => g.id);
      if (groupIds.length === 0) return [];

      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .in("group_id", groupIds)
        .eq("status", "pending")
        .order("joined_at", { ascending: false });
      if (error) throw error;

      const userIds = data.map((m) => m.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));
      const groupMap = new Map(adminGroups!.map((g) => [g.id, g.name]));

      return data.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id),
        groupName: groupMap.get(m.group_id) || "Grupo",
      }));
    },
    enabled: !!adminGroups,
  });

  // Fetch user's own notifications (approved/rejected responses, etc.)
  const { data: userNotifications } = useQuery({
    queryKey: ["user-notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Realtime: listen for new pending join requests
  useEffect(() => {
    if (!adminGroups?.length) return;
    const channel = supabase
      .channel("pending-requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        (payload) => {
          const row = payload.new as any;
          if (row && adminGroups.some((g) => g.id === row.group_id)) {
            queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [adminGroups, queryClient]);

  // Realtime: listen for new notifications for this user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("user-notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["user-notifications", user.id] });
          queryClient.invalidateQueries({ queryKey: ["unread-notifications", user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Mark notifications as read
  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      memberId,
      userId,
      groupId,
      status,
    }: {
      memberId: string;
      userId: string;
      groupId: string;
      status: string;
    }) => {
      const { error } = await supabase
        .from("group_members")
        .update({ status: status as any })
        .eq("id", memberId);
      if (error) throw error;

      const groupName =
        adminGroups?.find((g) => g.id === groupId)?.name || "el grupo";

      if (status === "approved") {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "join_approved" as any,
          message: `Tu solicitud para unirte a ${groupName} fue aprobada. ¡Ya puedes participar!`,
          metadata: { group_id: groupId },
        });
      } else if (status === "rejected") {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "join_rejected" as any,
          message: `Tu solicitud para unirte a ${groupName} no fue aprobada.`,
          metadata: { group_id: groupId },
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["group-members", variables.groupId],
      });
      toast.success(
        variables.status === "approved"
          ? "Miembro aprobado"
          : "Solicitud rechazada"
      );
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const unreadNotifs = userNotifications?.filter((n) => !n.is_read) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-12 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display tracking-wider text-foreground">
            NOTIFICACIONES
          </h1>
        </div>

        {/* Pending join requests section */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-secondary" />
            <h2 className="text-sm font-display tracking-wider text-secondary">
              SOLICITUDES PENDIENTES
            </h2>
            {(pendingRequests?.length ?? 0) > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {pendingRequests?.length}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : !pendingRequests?.length ? (
            <div className="text-center py-10 rounded-xl border border-border bg-card">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-body">
                No hay solicitudes pendientes
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-xl p-3 card-elevated"
                >
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-display text-muted-foreground overflow-hidden shrink-0">
                    {req.profile?.avatar_url ? (
                      <img
                        src={req.profile.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (req.profile?.display_name || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-semibold text-foreground truncate">
                      {req.profile?.display_name || "Sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground font-body truncate">
                      Quiere unirse a{" "}
                      <span className="font-semibold text-foreground/80">
                        {req.groupName}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() =>
                        updateStatus.mutate({
                          memberId: req.id,
                          userId: req.user_id,
                          groupId: req.group_id,
                          status: "approved",
                        })
                      }
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs gap-1 text-destructive hover:text-destructive"
                      onClick={() =>
                        updateStatus.mutate({
                          memberId: req.id,
                          userId: req.user_id,
                          groupId: req.group_id,
                          status: "rejected",
                        })
                      }
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rechazar
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* User notifications history */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-display tracking-wider text-primary">
                HISTORIAL
              </h2>
            </div>
            {unreadNotifs.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground"
                onClick={() => markRead.mutate(unreadNotifs.map((n) => n.id))}
              >
                Marcar todo como leído
              </Button>
            )}
          </div>

          {!userNotifications?.length ? (
            <div className="text-center py-10 rounded-xl border border-border bg-card">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-body">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {userNotifications.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`rounded-xl p-3 border transition-colors ${
                    n.is_read
                      ? "border-border bg-card"
                      : "border-primary/30 bg-primary/5"
                  } ${(n.metadata as any)?.group_id ? "cursor-pointer hover:bg-accent/50" : ""}`}
                  onClick={() => {
                    const groupId = (n.metadata as any)?.group_id;
                    if (groupId) {
                      if (!n.is_read) markRead.mutate([n.id]);
                      navigate(`/group/${groupId}`);
                    }
                  }}
                >
                  <p className="text-sm font-body text-foreground">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-body">
                    {new Date(n.created_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Notifications;
