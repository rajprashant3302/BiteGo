type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export default function SectionCard({ title, subtitle, children, action }: Props) {
  return (
    <section className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}