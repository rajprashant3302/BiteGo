import { cn } from "./utils";

type Props = {
  label: string;
  value: number;
  colorClass: string;
};

export default function ProgressRow({ label, value, colorClass }: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="font-semibold text-gray-500">{value}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100">
        <div
          className={cn("h-2.5 rounded-full transition-all duration-700", colorClass)}
          style={{ width: `${Math.max(8, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}