'use client';

import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { useAppDataContext } from '@/lib/context';
import { formatShortTime } from '@/lib/utils';
import { format, parseISO, subDays, eachDayOfInterval, isSameDay } from 'date-fns';

export default function AnalyticsPage() {
  const { timeEntries, tasks, isLoading } = useAppDataContext();

  const chartData = useMemo(() => {
    if (tasks.length === 0) return [];
    // Get last 7 days
    const endDate = new Date();
    const startDate = subDays(endDate, 6);
    const interval = eachDayOfInterval({ start: startDate, end: endDate });

    return interval.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = timeEntries.filter(e => e.date === dateStr);
      
      const dataPoint: any = {
        date: format(date, 'dd/MM/yyyy'),
        originalDate: date,
      };

      // Add time per task
      tasks.forEach(task => {
        const taskTime = dayEntries
          .filter(e => e.taskId === task.id)
          .reduce((sum, e) => sum + e.duration, 0);
        
        // Convert ms to minutes for easier display
        dataPoint[task.name] = taskTime > 0 ? Math.round(taskTime / (1000 * 60)) : 0;
      });

      return dataPoint;
    });
  }, [timeEntries, tasks]);

  if (isLoading) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const totalMinutes = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="bg-[#1a1a1a] border border-[#262626] p-4 rounded-xl shadow-xl">
          <p className="text-[#a3a3a3] text-xs mb-2">{label}</p>
          <p className="font-bold text-lg mb-2">{formatShortTime(totalMinutes * 60 * 1000)}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-white">{entry.name}</span>
                </div>
                <span className="text-[#a3a3a3]">{formatShortTime(entry.value * 60 * 1000)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <div className="flex gap-4">
        <button className="bg-[#262626] text-white px-4 py-2 rounded-lg text-sm font-medium border border-[#333]">Bars</button>
        <button className="text-[#a3a3a3] hover:text-white px-4 py-2 rounded-lg text-sm font-medium">Tasks</button>
        <button className="text-[#a3a3a3] hover:text-white px-4 py-2 rounded-lg text-sm font-medium">Week</button>
      </div>

      <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-[#262626] min-h-[400px]">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a3a3a3', fontSize: 10 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a3a3a3', fontSize: 10 }}
                tickFormatter={(value) => `${value}m`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#262626', opacity: 0.5 }} />
              {tasks.map((task) => (
                <Bar 
                  key={task.id} 
                  dataKey={task.name} 
                  stackId="a" 
                  fill={task.color} 
                  radius={[0, 0, 0, 0]}
                  barSize={40}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-6 justify-center">
          {tasks.map(task => {
             const taskTotal = timeEntries
               .filter(e => e.taskId === task.id)
               .reduce((sum, e) => sum + e.duration, 0);
             
             if (taskTotal === 0 && !task.isDefault) return null;

             return (
               <div key={task.id} className="flex items-center gap-2 text-xs">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: task.color }} />
                 <span className="text-[#a3a3a3]">{task.name}:</span>
                 <span className="text-white font-medium">{formatShortTime(taskTotal)}</span>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
}
