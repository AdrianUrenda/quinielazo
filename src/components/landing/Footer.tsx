import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-navy text-primary-foreground/60 py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            <span className="font-display text-xl text-primary-foreground tracking-wider">QUINIELAZO 2026</span>
          </div>
          <div className="flex gap-6 text-sm font-body">
            <Link to="/calendar" className="hover:text-primary-foreground transition-colors">Calendario</Link>
            <Link to="/terms" className="hover:text-primary-foreground transition-colors">Términos</Link>
            <Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacidad</Link>
          </div>
          <p className="text-sm font-body">© 2026 Quinielazo. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
