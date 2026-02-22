import { type LucideIcon } from "lucide-react";

export default function SectionHeader({
  icon: Icon,
  label,
  color,
}: {
  icon: LucideIcon;
  label: string;
  color: string;
}) {
  return (
    <h3 className="text-base-content/60 mb-3 flex items-center gap-2 px-1 text-xs font-semibold tracking-wider uppercase">
      <Icon size={14} className={color} />
      {label}
    </h3>
  );
}
