import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({
  children,
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background bg-gray-50 dark:bg-gray-950",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
