
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { useIgrejaContext } from "@/hooks/use-igreja-context";

export function Navbar() {
  const { igreja, user } = useIgrejaContext();
  
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-4">
          {igreja?.logo_url && (
            <img 
              src={`/uploads/${igreja.logo_url}`} 
              alt="Logo" 
              className="h-8 w-auto"
            />
          )}
          <h2 className="text-lg font-semibold">Sistema de Gestão IPB</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm">{user?.username}</span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.foto_url ? `/uploads/${user.foto_url}` : undefined} />
            <AvatarFallback>
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
