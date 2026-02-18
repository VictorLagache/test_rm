import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { PageHeader } from '../components/layout/PageHeader';
import { reportsApi } from '../api/reports';
import { formatDate, getFourWeekRange } from '../lib/dates';

export function ReportsPage() {
  const [range] = useState(() => getFourWeekRange(new Date()));
  const startStr = formatDate(range.start);
  const endStr = formatDate(range.end);

  const { data: utilization } = useQuery({
    queryKey: ['utilization', startStr, endStr],
    queryFn: () => reportsApi.getUtilization(startStr, endStr),
  });

  const { data: projectReport } = useQuery({
    queryKey: ['projectReport', startStr, endStr],
    queryFn: () => reportsApi.getProjects(startStr, endStr),
  });

  const utilizationData = (utilization || []).map((u) => ({
    name: u.resource_name,
    booked: u.booked_hours,
    leave: u.leave_hours,
    available: Math.max(0, u.capacity_hours - u.booked_hours - u.leave_hours),
    utilization: u.utilization_percent,
  }));

  const projectData = (projectReport || []).map((p) => ({
    name: p.project_name,
    booked: Math.round(p.booked_hours),
    budget: p.budget_hours || 0,
    color: p.color,
  }));

  return (
    <div>
      <PageHeader
        title="Reports"
        description={`${formatDate(range.start, 'MMM d')} — ${formatDate(range.end, 'MMM d, yyyy')}`}
      />

      <div className="px-8 py-6 space-y-8">
        {/* Utilization Report */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Resource Utilization</h3>
          {utilizationData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={utilizationData} margin={{ bottom: 60 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tickFormatter={(v) => `${v}h`} />
                  <Tooltip formatter={(value: number) => [`${Math.round(value)}h`]} />
                  <Legend />
                  <Bar dataKey="booked" name="Booked" fill="#3b82f6" stackId="stack" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="leave" name="Leave" fill="#94a3b8" stackId="stack" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="available" name="Available" fill="#e2e8f0" stackId="stack" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Utilization table */}
              <div className="mt-6 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Name</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Department</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Capacity</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Booked</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Leave</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(utilization || []).map((u) => (
                      <tr key={u.resource_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{u.resource_name}</td>
                        <td className="py-2 px-3 text-gray-500">{u.department_name || '—'}</td>
                        <td className="py-2 px-3 text-right">{Math.round(u.capacity_hours)}h</td>
                        <td className="py-2 px-3 text-right">{Math.round(u.booked_hours)}h</td>
                        <td className="py-2 px-3 text-right">{Math.round(u.leave_hours)}h</td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`font-semibold ${
                              u.utilization_percent > 90
                                ? 'text-red-600'
                                : u.utilization_percent > 70
                                ? 'text-blue-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {u.utilization_percent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
          )}
        </div>

        {/* Project Report */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Project Hours</h3>
          {projectData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectData} margin={{ bottom: 40 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickFormatter={(v) => `${v}h`} />
                  <Tooltip formatter={(value: number) => [`${value}h`]} />
                  <Legend />
                  <Bar dataKey="booked" name="Booked Hours" radius={[4, 4, 0, 0]}>
                    {projectData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar dataKey="budget" name="Budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Project</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Client</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Booked</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Budget</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Used</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">People</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(projectReport || []).map((p) => (
                      <tr key={p.project_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            {p.project_name}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-gray-500">{p.client_name || '—'}</td>
                        <td className="py-2 px-3 text-right">{Math.round(p.booked_hours)}h</td>
                        <td className="py-2 px-3 text-right">{p.budget_hours ? `${p.budget_hours}h` : '—'}</td>
                        <td className="py-2 px-3 text-right">
                          {p.budget_used_percent != null ? (
                            <span
                              className={`font-semibold ${
                                p.budget_used_percent > 90 ? 'text-red-600' : 'text-gray-700'
                              }`}
                            >
                              {p.budget_used_percent}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">{p.resource_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
