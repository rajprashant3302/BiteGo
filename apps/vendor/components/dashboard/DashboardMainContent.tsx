type Props = {
  children: React.ReactNode;
};

export default function DashboardMainContent({ children }: Props) {
  return <div className="space-y-6">{children}</div>;
}