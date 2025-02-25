import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { LogOut, ChevronDown } from "lucide-react";
import { allRoutes } from "@/lib/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isAdmin = user?.role === "administrador";

  // Only add the users management route for admins
  const routes = isAdmin ? [
    ...allRoutes,
    {
      path: "/usuarios",
      label: "Usuários",
      icon: UserCog
    }
  ] : allRoutes;

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="font-semibold text-xl text-blue-600">IPB Gestão</span>
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-2">
              {routes.map((route) => {
                const Icon = route.icon;
                return (
                  <Link 
                    key={route.path}
                    href={route.path}
                  >
                    <Button
                      variant="ghost"
                      className={cn(
                        navigationMenuTriggerStyle(),
                        location === route.path && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {route.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  {user?.username}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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