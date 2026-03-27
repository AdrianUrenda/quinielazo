import { Button } from "@/components/ui/button";
import { Trophy, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const { user, loading } = useAuth();

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
              <Link to="/groups" className="relative text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Bell className="w-5 h-5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
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
              <Link to="/groups" className="relative text-primary-foreground/70 hover:text-primary-foreground">
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
