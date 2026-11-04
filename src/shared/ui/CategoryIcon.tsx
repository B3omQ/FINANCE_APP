import React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface CategoryIconProps {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}

// Convert kebab-case (e.g. shopping-bag) to PascalCase (ShoppingBag)
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

export function CategoryIcon({
  name,
  color,
  size = 18,
  className,
}: CategoryIconProps) {
  const pascalName = toPascalCase(name);
  const iconMap = Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>;
  const LucideIconComponent = iconMap[pascalName] || Icons.Tag;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg p-2 transition-colors",
        className
      )}
      style={{
        backgroundColor: color ? `${color}20` : undefined,
        color: color || "currentColor",
      }}
    >
      <LucideIconComponent size={size} />
    </div>
  );
}
