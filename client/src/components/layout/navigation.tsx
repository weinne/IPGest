import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  Menu,
  LogOut,
  ChevronDown,
  UserCog,
  Settings,
  User,
  CreditCard,
} from "lucide-react";
import { allRoutes } from "@/lib/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isAdmin = user?.role === "administrador";

  // Only add the users management route for admins
  const routes = isAdmin
    ? [
        ...allRoutes,
        {
          path: "/usuarios",
          label: "Usuários",
          icon: UserCog,
        },
      ]
    : allRoutes;

  const NavLinks = () => (
    <>
      {routes.map((route) => {
        const Icon = route.icon;
        return (
          <Link key={route.path} href={route.path}>
            <Button
              variant="ghost"
              className={cn(
                navigationMenuTriggerStyle(),
                location === route.path && "bg-accent text-accent-foreground",
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {route.label}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="font-semibold text-xl">IPGest</span>
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
                      <AvatarImage
                        src={`/uploads/${user.foto_url}`}
                        alt={user.username}
                      />
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
                  <>
                    <Link href="/configuracoes">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Configurações da Igreja
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/configuracoes/planos">
                      <DropdownMenuItem>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Planos de Assinatura
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
                <Link href="/perfil">
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