import { Home, Users, Boxes, UserCog, FileText } from "lucide-react";

export const allRoutes = [
  {
    path: "/membros",
    label: "Membros",
    icon: Users,
  },
  {
    path: "/grupos",
    label: "Grupos",
    icon: Boxes,
  },
  {
    path: "/lideranca",
    label: "Liderança",
    icon: UserCog,
  },
  {
    path: "/relatorios",
    label: "Relatórios",
    icon: FileText,
  },
];
