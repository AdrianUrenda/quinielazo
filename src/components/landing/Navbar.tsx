import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
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
          <Link to="/login" className="text-sm font-body text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            Iniciar sesión
          </Link>
          <Button variant="hero" size="sm" asChild>
            <Link to="/register">Registrarse</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Button variant="hero" size="sm" asChild>
            <Link to="/register">Registrarse</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
