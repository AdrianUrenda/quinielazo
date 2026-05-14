import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Trophy, Bell, Menu, Calendar, BarChart3, Users as UsersIcon, User, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState, useRef, useCallback } from "react";

const Navbar = () => {
  const { user, loading } = useAuth();

  const [bellRinging, setBellRinging] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  const triggerBellRing = useCallback(() => {
    setBellRinging(true);
    setTimeout(() => setBellRinging(false), 800);
  }, []);

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

  useEffect(() => {
    if (!user || unreadCount === undefined) return;
    if (prevCountRef.current !== null && unreadCount > prevCountRef.current) {
      triggerBellRing();
      toast("🔔 Nueva notificación", { duration: 3000 });
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, user, triggerBellRing]);



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
          <Link to="/statistics" className="text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            Estadísticas
          </Link>
          {!loading && user ? (
            <>
              <Link to="/groups" className="text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Mis Grupos
              </Link>
              <Link to="/notifications" className="relative text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Bell className={`w-5 h-5 origin-top ${bellRinging ? "animate-bell-ring" : ""}`} />
                {(unreadCount ?? 0) > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ${bellRinging ? "animate-badge-pop" : ""}`}>
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Mi Perfil
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

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/90 backdrop-blur-md border-b border-primary-foreground/10">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-gold" />
          <span className="font-display text-xl md:text-2xl text-primary-foreground tracking-wider">QUINIELAZO</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/calendar" className="text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            Calendario
          </Link>
          <Link to="/statistics" className="text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            Estadísticas
          </Link>
          {!loading && user ? (
            <>
              <Link to="/groups" className="text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Mis Grupos
              </Link>
              <Link to="/notifications" className="relative text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <Bell className={`w-5 h-5 origin-top ${bellRinging ? "animate-bell-ring" : ""}`} />
                {(unreadCount ?? 0) > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ${bellRinging ? "animate-badge-pop" : ""}`}>
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Mi Perfil
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

        <div className="md:hidden flex items-center gap-2">
          {!loading && user && (
            <Link to="/notifications" aria-label="Notificaciones" className="relative p-2 text-primary-foreground/80 hover:text-primary-foreground">
              <Bell className={`w-5 h-5 origin-top ${bellRinging ? "animate-bell-ring" : ""}`} />
              {(unreadCount ?? 0) > 0 && (
                <span className={`absolute top-0 right-0 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center ${bellRinging ? "animate-badge-pop" : ""}`}>
                  {unreadCount}
                </span>
              )}
            </Link>
          )}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Abrir menú"
                className="p-2 text-primary-foreground/80 hover:text-primary-foreground"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-navy border-primary-foreground/10 w-[80vw] max-w-xs p-0">
              <SheetHeader className="p-6 border-b border-primary-foreground/10">
                <SheetTitle className="flex items-center gap-2 text-primary-foreground">
                  <Trophy className="w-5 h-5 text-gold" />
                  <span className="font-display text-xl tracking-wider">QUINIELAZO</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4 gap-1">
                <SheetClose asChild>
                  <Link to="/calendar" className="flex items-center gap-3 px-3 py-3 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/5 hover:text-primary-foreground font-body">
                    <Calendar className="w-4 h-4" /> Calendario
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/statistics" className="flex items-center gap-3 px-3 py-3 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/5 hover:text-primary-foreground font-body">
                    <BarChart3 className="w-4 h-4" /> Estadísticas
                  </Link>
                </SheetClose>
                {!loading && user ? (
                  <>
                    <SheetClose asChild>
                      <Link to="/groups" className="flex items-center gap-3 px-3 py-3 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/5 hover:text-primary-foreground font-body">
                        <UsersIcon className="w-4 h-4" /> Mis Grupos
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/profile" className="flex items-center gap-3 px-3 py-3 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/5 hover:text-primary-foreground font-body">
                        <User className="w-4 h-4" /> Mi Perfil
                      </Link>
                    </SheetClose>
                  </>
                ) : !loading ? (
                  <>
                    <SheetClose asChild>
                      <Link to="/login" className="flex items-center gap-3 px-3 py-3 rounded-md text-primary-foreground/80 hover:bg-primary-foreground/5 hover:text-primary-foreground font-body">
                        <LogIn className="w-4 h-4" /> Iniciar sesión
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/register" className="mt-2">
                        <Button variant="hero" className="w-full">
                          <UserPlus className="w-4 h-4" /> Registrarse
                        </Button>
                      </Link>
                    </SheetClose>
                  </>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
