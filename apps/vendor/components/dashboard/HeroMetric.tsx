type Props = {
  title: string;
  value: string;
  subtitle: string;
};

export default function HeroMetric({ title, value, subtitle }: Props) {
  return (
    <div className="rounded-[24px] bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/10">
      <p className="text-sm font-semibold text-orange-100">{title}</p>
      <h3 className="mt-2 text-2xl font-black text-white">{value}</h3>
      <p className="mt-2 text-xs leading-5 text-gray-200">{subtitle}</p>
    </div>
  );
}