import { ReactNode } from 'react';
import { useAuthStore } from '../store/index.ts';
import { auth } from '../lib/firebase.ts';
import { signOut } from 'firebase/auth';
import { BookOpen, Home, Settings, LogOut, Users, Award, Shield } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Dashboard';

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    try {
      const res = await fetch('/api/users/me/role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        useAuthStore.getState().setAuth(useAuthStore.getState().token!, updatedUser);
        // Reset tab to dashboard on role change
        setSearchParams({ tab: 'Dashboard' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = [
    { label: 'Dashboard', icon: Home, roles: ['TRAINEE', 'TRAINER', 'ADMIN'] },
    { label: 'Courses', icon: BookOpen, roles: ['TRAINEE', 'TRAINER'] },
    { label: 'Users', icon: Users, roles: ['ADMIN'] },
    { label: 'Certificates', icon: Award, roles: ['TRAINEE'] },
    { label: 'Competency Mapping', icon: Shield, roles: ['ADMIN'] },
    { label: 'Settings', icon: Settings, roles: ['TRAINEE', 'TRAINER', 'ADMIN'] },
  ];

  const visibleMenu = menuItems.filter(item => item.roles.includes(user?.role || 'TRAINEE'));

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <div className="font-extrabold text-[18px] tracking-tight leading-none">CAPACITY CONNECT</div>
          <div className="text-[10px] text-white/60 mt-1 uppercase tracking-wider">Learning Management Portal</div>
        </div>
        
        <nav className="flex-1 pt-5 space-y-1 overflow-y-auto">
          {visibleMenu.map((item, index) => {
            const isActive = activeTab === item.label;
            return (
              <button
                key={index}
                onClick={() => setSearchParams({ tab: item.label })}
                className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-white/10 text-white border-l-4 border-blue-600' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white border-l-4 border-transparent'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-5 mt-auto text-xs text-white/50 border-t border-white/10">
          v2.4.0 Professional Ed.
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-slate-500">Global Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">System Overview</span>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 mr-4 border-r border-slate-200 pr-4">
              <span className="text-xs text-slate-500 font-medium">Demo Role:</span>
              <select 
                value={user?.role || 'TRAINEE'} 
                onChange={handleRoleChange}
                className="bg-slate-100 border-none text-sm text-slate-700 font-semibold py-1 px-2 rounded cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TRAINEE">Trainee</option>
                <option value="TRAINER">Trainer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {user?.role === 'ADMIN' && (
              <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-[11px] font-bold uppercase tracking-wide">
                Admin Access
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700">{user?.name}</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="ml-2 text-slate-400 hover:text-red-600 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
