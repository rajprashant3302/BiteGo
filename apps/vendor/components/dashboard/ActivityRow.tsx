import { cn } from "./utils";

type Props = {
  title: string;
  time: string;
  detail: string;
  status: "hot" | "good" | "note";
};

export default function ActivityRow({ title, time, detail, status }: Props) {
  const dotClass =
    status === "hot"
      ? "bg-red-500"
      : status === "good"
      ? "bg-green-500"
      : "bg-orange-500";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={cn("mt-2 h-2.5 w-2.5 rounded-full", dotClass)} />
        <span className="mt-1 h-full w-px bg-gray-200" />
      </div>
      <div className="pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-bold text-gray-900">{title}</h4>
          <span className="text-xs font-semibold text-gray-400">{time}</span>
        </div>
        <p className="mt-1 text-sm leading-6 text-gray-600">{detail}</p>
      </div>
    </div>
  );
}