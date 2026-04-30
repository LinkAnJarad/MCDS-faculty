// This route group layout is intentionally a passthrough.
// Authentication and sidebar are handled by app/dashboard/layout.tsx.
export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
