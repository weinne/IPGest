import { Link } from "react-router-dom";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Menu, LogOut, ChevronDown, UserCog, Settings, User } from "lucide-react";
import { allRoutes } from "@/lib/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function Navigation() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isAdmin = user?.role === "administrador";

  const routes = isAdmin ? allRoutes : allRoutes.filter(route => !route.adminOnly);


  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="font-semibold text-xl text-blue-600">IPB Gestão</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-2">
              <NavLinks />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild className="sm:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col space-y-2 mt-6">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>

            {/* User menu dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {user?.foto_url ? (
                      <AvatarImage src={`/uploads/${user.foto_url}`} alt={user.username} />
                    ) : (
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="hidden sm:inline">{user?.username}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <Link to="/configuracoes">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações da Igreja
                    </DropdownMenuItem>
                  </Link>
                )}
                <Link to="/perfil">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}

const NavLinks = () => (
  <>
    {routes.map((route) => {
      const Icon = route.icon;
      return (
        <Link
          key={route.path}
          to={route.path}
          className={cn(
            navigationMenuTriggerStyle(),
            location === route.path && "bg-accent text-accent-foreground"
          )}
        >
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          {route.label}
        </Link>
      );
    })}
  </>
);