import { cn } from "./utils";

type Props = {
  title: string;
  text: string;
  tone: "warning" | "success" | "neutral";
  icon: React.ReactNode;
};

export default function AlertItem({ title, text, tone, icon }: Props) {
  const toneMap = {
    warning: "border-amber-200 bg-amber-50",
    success: "border-green-200 bg-green-50",
    neutral: "border-gray-100 bg-gray-50",
  };

  return (
    <div className={cn("rounded-2xl border p-4", toneMap[tone])}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-[#FF651D]">{icon}</div>
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
        </div>
      </div>
    </div>
  );
}