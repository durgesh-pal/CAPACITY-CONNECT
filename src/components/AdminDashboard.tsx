import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/index.ts';
import { Users, GraduationCap, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { token, user } = useAuthStore();

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Users</span>
              <span className="text-2xl font-bold text-slate-900">1</span>
              <span className="text-[11px] text-green-600 font-medium">↑ New registration</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Courses</span>
              <span className="text-2xl font-bold text-slate-900">{courses?.length || 0}</span>
              <span className="text-[11px] text-green-600 font-medium">Active catalog</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">System Status</span>
              <span className="text-2xl font-bold text-slate-900">100%</span>
              <span className="text-[11px] text-slate-500 font-medium">Global Network</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg flex flex-col flex-1">
            <div className="px-5 py-4 border-b border-slate-200 font-semibold flex justify-between items-center text-slate-800">
              <span>Schema & API Architecture (Prisma)</span>
              <span className="text-[11px] font-normal text-slate-500">read-only src/db/schema.ts</span>
            </div>
            <div className="p-5 bg-slate-900 flex-1 overflow-auto rounded-b-lg">
              <pre className="font-mono text-xs bg-slate-800 text-slate-200 p-4 rounded text-left leading-relaxed">
{`export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  role: text('role').notNull().default('TRAINEE'),
  name: text('name').notNull(),
});

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  trainerId: integer('trainer_id').references(() => users.id),
  subjectTag: text('subject_tag').notNull(),
});`}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-col bg-slate-50 rounded-t-lg">
              <span className="text-xs text-slate-500 font-semibold tracking-wide">COMPETENCY ENGINE</span>
              <span className="text-sm font-medium text-slate-800">Trainer Matching System</span>
            </div>
            <div className="p-6 flex flex-col items-center justify-center text-center flex-1">
               <ShieldCheck className="w-10 h-10 text-blue-600 mb-3" />
               <p className="text-slate-800 font-medium">Map verified trainers to required subject tags instantly.</p>
               <p className="text-slate-500 text-sm mt-2 mb-6">Ensures optimal trainer-trainee assignment based on skill tags.</p>
               <button className="w-full bg-slate-900 text-white border-none py-3 rounded-md font-semibold hover:bg-slate-800 transition-colors">
                 Launch Mapping Engine →
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
