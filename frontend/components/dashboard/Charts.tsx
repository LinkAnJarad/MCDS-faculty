"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface ChartsProps {
  scoreDistribution: { name: string; count: number }[];
  departmentAllocations: { department: string; allocations: number }[];
}

const PIE_COLORS = ["#4361ee", "#3a0ca3", "#7209b7", "#f72585", "#4cc9f0"];

export function DashboardCharts({ scoreDistribution, departmentAllocations }: ChartsProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
      {/* Bar Chart - Score Distribution */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: 16, marginBottom: "1rem", color: "var(--color-text-primary)" }}>
          MCDM Score Distribution
        </h3>
        <div style={{ width: "100%", height: 300 }}>
          {scoreDistribution && scoreDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-bg-elevated)" }}
                  contentStyle={{ backgroundColor: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)", fontSize: 14 }}>
              No score data available yet.
            </div>
          )}
        </div>
      </div>

      {/* Pie Chart - Allocations by Department */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: 16, marginBottom: "1rem", color: "var(--color-text-primary)" }}>
          Allocations by Department
        </h3>
        <div style={{ width: "100%", height: 300 }}>
          {departmentAllocations && departmentAllocations.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentAllocations}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="allocations"
                  nameKey="department"
                >
                  {departmentAllocations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-bg-primary)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--color-text-primary)" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)", fontSize: 14 }}>
              No allocation data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
