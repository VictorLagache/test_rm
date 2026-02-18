import { useQuery } from '@tanstack/react-query';
import { Users, FolderKanban, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader } from '../components/layout/PageHeader';
import { resourcesApi } from '../api/resources';
import { projectsApi } from '../api/projects';
import { reportsApi } from '../api/reports';
import { formatDate, getFourWeekRange } from '../lib/dates';

export function DashboardPage() {
  const range = getFourWeekRange(new Date());
  const startStr = formatDate(range.start);
  const endStr = formatDate(range.end);

  const { data: resources } = useQuery({ queryKey: ['resources'], queryFn: resourcesApi.getAll });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll });
  const { data: utilization } = useQuery({
    queryKey: ['utilization', startStr, endStr],
    queryFn: () => reportsApi.getUtilization(startStr, endStr),
  });
  const { data: projectReport } = useQuery({
    queryKey: ['projectReport', startStr, endStr],
    queryFn: () => reportsApi.getProjects(startStr, endStr),
  });

  const activeResources = resources?.filter((r) => r.is_active).length ?? 0;
  const activeProjects = projects?.filter((p) => p.is_active).length ?? 0;
  const avgUtilization = utilization?.length
    ? Math.round(utilization.reduce((s, u) => s + u.utilization_percent, 0) / utilization.length)
    : 0;

  const utilizationData = (utilization || []).map((u) => ({
    name: u.resource_name.split(' ')[0],
    utilization: u.utilization_percent,
    full: u.resource_name,
  }));

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your team and projects" />

      <div className="px-8 py-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Team Members" value={activeResources} color="bg-blue-500" />
          <StatCard icon={FolderKanban} label="Active Projects" value={activeProjects} color="bg-green-500" />
          <StatCard icon={TrendingUp} label="Avg Utilization" value={`${avgUtilization}%`} color="bg-purple-500" />
          <StatCard
            icon={Calendar}
            label="Period"
            value={`${formatDate(range.start, 'MMM d')} - ${formatDate(range.end, 'MMM d')}`}
            color="bg-orange-500"
            small
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Utilization chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Team Utilization</h3>
            {utilizationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={utilizationData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Utilization']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.full || ''}
                  />
                  <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
                    {utilizationData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.utilization > 90 ? '#ef4444' :
                          entry.utilization > 70 ? '#3b82f6' :
                          entry.utilization > 40 ? '#f59e0b' : '#94a3b8'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                No data available
              </div>
            )}
          </div>

          {/* Project status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Project Status</h3>
            <div className="space-y-4">
              {(projectReport || []).map((p) => (
                <div key={p.project_id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-sm font-medium text-gray-900">{p.project_name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round(p.booked_hours)}h{p.budget_hours ? ` / ${p.budget_hours}h` : ''}
                    </span>
                  </div>
                  {p.budget_hours && (
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, p.budget_used_percent || 0)}%`,
                          backgroundColor:
                            (p.budget_used_percent || 0) > 90 ? '#ef4444' : p.color,
                        }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400">
                      {p.resource_count} {p.resource_count === 1 ? 'person' : 'people'}
                    </span>
                    {p.budget_used_percent != null && (
                      <span className="text-[11px] text-gray-400">
                        {p.budget_used_percent}% of budget
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(!projectReport || projectReport.length === 0) && (
                <div className="text-gray-400 text-sm text-center py-8">No projects</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  small,
}: {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  color: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
          <div className={`font-bold text-gray-900 ${small ? 'text-sm' : 'text-2xl'}`}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}
