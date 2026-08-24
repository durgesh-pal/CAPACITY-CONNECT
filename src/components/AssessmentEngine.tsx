import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.ts';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function AssessmentEngine() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', id],
    queryFn: async () => {
      const res = await fetch(`/api/assessments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },
    enabled: !!id && !!token
  });

  const [timeLeft, setTimeLeft] = useState(30 * 60);

  useEffect(() => {
    if (assessment?.timeLimitMinutes) {
      setTimeLeft(assessment.timeLimitMinutes * 60);
    }
  }, [assessment]);
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/assessments/${id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
      });
      if (res.ok) {
        navigate('/');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center text-slate-500">Loading Assessment...</div>;
  if (!assessment) return <div className="flex h-screen items-center justify-center text-slate-500">Assessment not found.</div>;

  const questions = assessment.questions || [];

  return (
    <div className="max-w-3xl mx-auto py-8 flex flex-col h-[calc(100vh-100px)]">
      <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-full overflow-hidden shadow-sm">
        <div className="bg-slate-100 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-semibold tracking-wide uppercase">LIVE ASSESSMENT ENGINE</span>
            <span className="text-sm font-medium text-slate-800">{assessment.title}</span>
          </div>
          <div className="text-red-600 font-mono font-bold text-[18px]">
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-10">
            {questions.map((q: any, idx: number) => (
              <div key={q.id}>
                <div className="mb-6">
                  <span className="text-xs text-blue-600 font-bold tracking-widest uppercase">QUESTION {(idx + 1).toString().padStart(2, '0')} / {questions.length.toString().padStart(2, '0')}</span>
                  <h3 className="mt-2 text-base text-slate-800 leading-relaxed font-medium">
                    {q.questionText}
                  </h3>
                </div>
                <div className="space-y-3">
                  {q.options.map((opt: string, optIdx: number) => {
                    const isSelected = answers[q.id] === optIdx;
                    return (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 px-4 rounded-md border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                            : 'border-slate-200 hover:border-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-full flex shrink-0 items-center justify-center ${isSelected ? 'border-blue-600 border-[5px]' : 'border-2 border-slate-300'}`} />
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          checked={isSelected}
                          onChange={() => setAnswers({ ...answers, [q.id]: optIdx })}
                          className="sr-only"
                        />
                        <span className="text-slate-800">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleSubmit}
            className="w-full mt-8 bg-slate-900 text-white border-none py-3 rounded-md font-semibold hover:bg-slate-800 transition-colors"
          >
            Submit Assessment →
          </button>
        </div>

        <div className="mt-auto p-5 border-t border-slate-200 bg-slate-50 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-800">Progress</span>
            <span className="text-xs text-slate-500 font-medium">{questions.length > 0 ? Math.round((Object.keys(answers).length / questions.length) * 100) : 0}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-out" 
              style={{ width: `${questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
