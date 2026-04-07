'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
      Activity,
      MessageSquare,
      CheckCircle2,
      Zap,
      Tag,
      Clock
} from 'lucide-react';
import { SpinnerFullscreen } from "@/components/ui/spinner";

// Mock Data
const mockActivities = [
      {
            id: 1,
            user: 'Sarah',
            action: 'Completed task',
            target: 'Homepage Design',
            project: 'Orzano Website',
            time: '5 minutes ago',
            icon: CheckCircle2,
            color: 'text-green-500'
      },
      {
            id: 2,
            user: 'Mike',
            action: 'Left a comment on',
            target: 'Wireframing',
            project: 'Smart Home App',
            time: '1 hour ago',
            icon: MessageSquare,
            color: 'text-indigo-500'
      },
      {
            id: 3,
            user: 'System',
            action: 'Project status updated to',
            target: 'Delayed',
            project: 'Dashboard UI',
            time: 'Yesterday',
            icon: Zap,
            color: 'text-red-500'
      },
      {
            id: 4,
            user: 'You',
            action: 'Moved task to In Progress:',
            target: 'User Testing',
            project: 'Mobile Banking',
            time: '2 days ago',
            icon: Tag,
            color: 'text-amber-500'
      },
];

const ActivityItem: React.FC<any> = ({ activity, isDark }) => {
      const cardBg = isDark ? 'bg-[#1F2125] hover:bg-[#25282e]' : 'bg-white hover:bg-rose-50';
      const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

      return (
            <div className={`flex gap-4 p-4 rounded-xl border transition-colors ${isDark ? 'border-gray-800' : 'border-rose-100'} ${cardBg}`}>
                  <activity.icon size={20} className={`mt-1 ${activity.color}`} />
                  <div className="flex-1">
                        <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              <span className="font-semibold">{activity.user}</span> {activity.action}
                              <span className="font-semibold text-teal-500"> "{activity.target}"</span>
                              {' '} in <span className="font-semibold text-rose-500">{activity.project}</span>
                        </p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${textMuted}`}>
                              <Clock size={12} />
                              <span>{activity.time}</span>
                        </div>
                  </div>
            </div>
      );
};

export default function ActivitiesView() {
      const { resolvedTheme } = useTheme();
      const isDark = resolvedTheme === 'dark';
      const cardBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100';
      const [isLoading, setIsLoading] = useState(true);

      useEffect(() => {
            // Simulate loading activities
            const timer = setTimeout(() => setIsLoading(false), 800);
            return () => clearTimeout(timer);
      }, []);

      if (isLoading) {
            return (
                  <div className={`flex-1 transition-colors ${isDark ? 'bg-slate-950' : 'bg-rose-50'}`}>
                        <SpinnerFullscreen text="Loading activities..." />
                  </div>
            );
      }

      return (
            <div className={`flex-1 p-8 transition-colors ${isDark ? 'bg-slate-950' : 'bg-rose-50'} flex gap-8`}>

                  {/* Main Activity Feed (70% width) */}
                  <div className="flex-grow">
                        <h1 className={`text-3xl font-bold flex items-center gap-3 mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              <Activity size={32} className="text-teal-500" /> Recent Activities
                        </h1>

                        <div className="space-y-4">
                              {mockActivities.map(activity => (
                                    <ActivityItem key={activity.id} activity={activity} isDark={isDark} />
                              ))}
                              {/* Placeholder for loading more */}
                              <div className={`p-4 text-center text-sm font-medium rounded-xl border-2 border-dashed cursor-pointer transition-colors ${isDark ? 'border-gray-700 text-gray-500 hover:bg-gray-800' : 'border-rose-300 text-rose-500 hover:bg-rose-100'}`}>
                                    Load More Activity
                              </div>
                        </div>
                  </div>

                  {/* Quick Stats Sidebar (30% width) */}
                  <div className={`w-[300px] p-6 rounded-3xl border transition-colors ${cardBg} h-fit sticky top-8`}>
                        <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Summary</h3>
                        <div className="space-y-4">
                              <SummaryStat isDark={isDark} label="Tasks Completed This Week" value="18" icon={CheckCircle2} color="text-green-500" />
                              <SummaryStat isDark={isDark} label="New Comments" value="9" icon={MessageSquare} color="text-indigo-500" />
                              <SummaryStat isDark={isDark} label="Projects Added" value="2" icon={Tag} color="text-rose-500" />
                        </div>
                  </div>
            </div>
      );
}

const SummaryStat: React.FC<any> = ({ isDark, label, value, icon: Icon, color }) => {
      return (
            <div className="flex justify-between items-center p-3 rounded-xl transition-colors hover:bg-teal-500/10">
                  <div className="flex items-center gap-3">
                        <Icon size={20} className={color} />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
                  </div>
                  <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
            </div>
      );
};
