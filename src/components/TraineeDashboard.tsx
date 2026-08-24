import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/index.ts';
import { PlayCircle, Clock, CheckCircle, Award } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function TraineeDashboard() {
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Dashboard';

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['assessments', 'my'] });
      alert('Successfully enrolled!');
    }
  });

  const { data: myAssessments } = useQuery({
    queryKey: ['assessments', 'my'],
    queryFn: async () => {
      const res = await fetch('/api/assessments/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },
    enabled: !!token
  });

  if (isLoading) return <div className="text-slate-500">Loading courses...</div>;

  if (activeTab === 'Settings') {
    return (
      <div className="space-y-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Profile Settings</h2>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700">Full Name</label>
            <input type="text" disabled value={user?.name || ''} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 px-3 py-2 text-slate-500 sm:text-sm" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700">Email Address</label>
            <input type="email" disabled value={user?.email || ''} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 px-3 py-2 text-slate-500 sm:text-sm" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700">Role</label>
            <input type="text" disabled value={user?.role || ''} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 px-3 py-2 text-slate-500 sm:text-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'Certificates') {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">My Certificates</h2>
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No certificates yet</h3>
          <p className="text-slate-500 mt-1">Complete courses and assessments to earn certificates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
        <p className="text-slate-500 mt-1">Ready to learn something new today?</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          {activeTab === 'Courses' ? 'All Courses' : 'Available Courses'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course: any) => (
            <div key={course.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col hover:border-blue-600 hover:shadow-md transition-all">
              <div className="h-32 bg-slate-900 p-4 flex items-end">
                <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded backdrop-blur-sm">
                  {course.subjectTag}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1">{course.title}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-1">{course.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center text-xs font-medium text-slate-500 gap-1 uppercase tracking-wide">
                    <Clock className="w-4 h-4" /> 2h 30m
                  </div>
                  <button
                    onClick={() => enrollMutation.mutate(course.id)}
                    disabled={enrollMutation.isPending}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded font-semibold text-sm transition-colors"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
          {courses?.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 bg-white border border-dashed rounded-lg">
              No courses available yet. Switch to "Trainer" demo role (top right) to create one!
            </div>
          )}
        </div>
      </section>
      
      {(activeTab === 'Dashboard' || activeTab === 'Courses') && (
        <section className="pt-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">My Assessments</h2>
          
          {(!myAssessments || myAssessments.length === 0) ? (
            <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500">
              Enroll in courses to unlock assessments.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myAssessments.map((assessment: any) => (
                <div key={assessment.id} className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-900">{assessment.title}</h3>
                    <div className="flex items-center text-xs text-slate-500 gap-3 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {assessment.timeLimitMinutes} mins</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Pass: {assessment.passingThreshold}%</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/assessments/${assessment.id}`)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Start →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
