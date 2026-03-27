import { Button } from "@/components/ui/button";
import { Trophy, Bell, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState, useRef, useCallback } from "react";

const Navbar = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [bellRinging, setBellRinging] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  const triggerBellRing = useCallback(() => {
    setBellRinging(true);
    setTimeout(() => setBellRinging(false), 800);
  }, []);

  // Realtime: refresh unread count when notifications change
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("navbar-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-notifications", user.id] });
          triggerBellRing();
          toast("🔔 Nueva notificación", { duration: 3000 });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient, triggerBellRing]);

  const { data: unreadCount } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/90 backdrop-blur-md border-b border-primary-foreground/10">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-gold" />
          <span className="font-display text-2xl text-primary-foreground tracking-wider">QUINIELAZO</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/calendar" className="text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            Calendario
          </Link>
          {!loading && user ? (
            <>
              <Link to="/groups" className="text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Mis Grupos
              </Link>
              <Link to="/notifications" className="relative text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Bell className="w-5 h-5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Button
                size="sm"
                onClick={handleLogout}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body text-xs gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar sesión
              </Button>
            </>
          ) : !loading ? (
            <>
              <Link to="/login" className="text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Iniciar sesión
              </Link>
              <Button variant="hero" size="sm" asChild>
                <Link to="/register">Registrarse</Link>
              </Button>
            </>
          ) : null}
        </div>

        <div className="md:hidden flex items-center gap-3">
          {!loading && user ? (
            <>
              <Link to="/notifications" className="relative text-primary-foreground/70 hover:text-primary-foreground">
                <Bell className="w-5 h-5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Button variant="hero" size="sm" asChild>
                <Link to="/groups">Mis Grupos</Link>
              </Button>
              <Button
                size="icon"
                onClick={handleLogout}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 w-9"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : !loading ? (
            <Button variant="hero" size="sm" asChild>
              <Link to="/register">Registrarse</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
