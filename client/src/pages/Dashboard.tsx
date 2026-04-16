import { useQuery } from '@tanstack/react-query';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Calendar, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import type { Todo } from '../types';
import { useAuthStore } from '../store/authStore';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data: todos = [] } = useQuery<Todo[]>({ queryKey: ['todos'], queryFn: () => api.get('/todos').then(r => r.data) });

  const todayTodos = todos.filter(t => t.scheduled_at && isToday(new Date(t.scheduled_at)));
  const overdue = todos.filter(t => t.scheduled_at && isPast(new Date(t.scheduled_at)) && !t.completed);
  const completed = todos.filter(t => t.completed);
  const upcoming = todos.filter(t => t.scheduled_at && !t.completed && !isPast(new Date(t.scheduled_at))).slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-white">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-400 mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Tasks" value={todayTodos.length} icon={Calendar} color="#6366f1" />
        <StatCard label="Completed" value={completed.length} icon={CheckCircle2} color="#10b981" />
        <StatCard label="Overdue" value={overdue.length} icon={AlertCircle} color="#ef4444" />
        <StatCard label="Total Todos" value={todos.length} icon={TrendingUp} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's tasks */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-400" /> Today's Schedule
          </h2>
          {todayTodos.length === 0 ? (
            <p className="text-slate-500 text-sm">No tasks scheduled for today. Enjoy your day!</p>
          ) : (
            <div className="space-y-3">
              {todayTodos.map(todo => (
                <div key={todo.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${todo.completed ? 'opacity-50' : ''}`} style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${todo.priority === 'high' ? 'bg-red-400' : todo.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${todo.completed ? 'line-through text-slate-500' : 'text-white'}`}>{todo.title}</p>
                    {todo.scheduled_at && <p className="text-xs text-slate-500">{format(new Date(todo.scheduled_at), 'h:mm a')}</p>}
                  </div>
                  {todo.completed && <CheckCircle2 size={16} className="text-green-400 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={18} className="text-purple-400" /> Coming Up
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-slate-500 text-sm">No upcoming tasks. Add some todos to get started.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(todo => (
                <div key={todo.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${todo.priority === 'high' ? 'bg-red-400' : todo.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{todo.title}</p>
                    {todo.scheduled_at && (
                      <p className="text-xs text-slate-500">
                        {isToday(new Date(todo.scheduled_at)) ? 'Today' : isTomorrow(new Date(todo.scheduled_at)) ? 'Tomorrow' : format(new Date(todo.scheduled_at), 'MMM d')}
                        {' · '}{format(new Date(todo.scheduled_at), 'h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-4 flex items-center gap-3 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.08)' }}>
          <AlertCircle size={20} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">You have <strong>{overdue.length}</strong> overdue task{overdue.length > 1 ? 's' : ''}. Head to Todos to catch up.</p>
        </motion.div>
      )}
    </div>
  );
}
