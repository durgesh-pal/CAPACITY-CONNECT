import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/index.ts';
import { Plus, Layout, BookOpen, Users, BarChart } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function TrainerDashboard() {
  const { token, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Dashboard';
  
  const [courseForm, setCourseForm] = useState({ title: '', description: '', subjectTag: '' });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', 'trainer'],
    queryFn: async () => {
      const res = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Mock filtering for simplicity since API returns all for now.
      const all = await res.json();
      return all.filter((c: any) => c.trainerId === user.id);
    }
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof courseForm) => {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsCreatingCourse(false);
      setCourseForm({ title: '', description: '', subjectTag: '' });
    }
  });

  const createAssessmentMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId,
          title: 'Final Knowledge Check',
          timeLimitMinutes: 15,
          passingThreshold: 70,
          questionsData: [
            { questionText: 'What is the primary objective of this course?', options: ['Learning core skills', 'Ignoring concepts', 'Basic networking', 'Memorizing terms'], correctOptionIndex: 0 },
            { questionText: 'How should you apply these concepts?', options: ['Randomly', 'Systematically and consistently', 'Never', 'Only when asked'], correctOptionIndex: 1 }
          ]
        })
      });
      return res.json();
    },
    onSuccess: () => {
      alert('Mock Assessment successfully created and attached to course!');
    }
  });

  if (activeTab === 'Settings') {
    return (
      <div className="space-y-6 max-w-2xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Trainer Settings</h2>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700">Full Name</label>
            <input type="text" disabled value={user?.name || ''} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 px-3 py-2 text-slate-500 sm:text-sm" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700">Role</label>
            <input type="text" disabled value={user?.role || ''} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 px-3 py-2 text-slate-500 sm:text-sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trainer Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your courses, resources, and assessments.</p>
        </div>
        <button
          onClick={() => setIsCreatingCourse(true)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Course
        </button>
      </header>

      {isCreatingCourse && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">New Course Details</h2>
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Course Title</label>
              <input
                type="text"
                value={courseForm.title}
                onChange={e => setCourseForm({...courseForm, title: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. Advanced Leadership Skills"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject Tag</label>
              <input
                type="text"
                value={courseForm.subjectTag}
                onChange={e => setCourseForm({...courseForm, subjectTag: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g. Management"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={courseForm.description}
                onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={3}
                placeholder="Course overview..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCreatingCourse(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createCourseMutation.mutate(courseForm)}
                disabled={createCourseMutation.isPending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Publish Course
              </button>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'Dashboard' || activeTab === 'Courses') && (
        <>
          {activeTab === 'Dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{courses?.length || 0}</p>
                  <p className="text-sm font-medium text-slate-500">Active Courses</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-sm font-medium text-slate-500">Total Trainees</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                  <BarChart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-sm font-medium text-slate-500">Assessments Built</p>
                </div>
              </div>
            </div>
          )}

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full text-center py-8 text-slate-500">Loading your courses...</div>
              ) : courses?.map((course: any) => (
                <div key={course.id} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{course.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-slate-50 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-slate-200">
                      Manage Content
                    </button>
                    <button 
                      onClick={() => createAssessmentMutation.mutate(course.id)}
                      className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-transparent"
                    >
                      Add Assessment
                    </button>
                  </div>
                </div>
              ))}
              {courses?.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500 bg-white border border-dashed border-slate-300 rounded-lg">
                  You haven't created any courses yet.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
