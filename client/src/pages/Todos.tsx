import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Todo } from '../types';

const PRIORITIES = ['low', 'medium', 'high'] as const;
const FILTERS = ['all', 'today', 'upcoming', 'completed'] as const;

function priorityColor(p: string) {
  return p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#10b981';
}

export default function Todos() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', scheduled_at: '', duration_minutes: 30, priority: 'medium' as const, category: '' });

  const { data: todos = [] } = useQuery<Todo[]>({ queryKey: ['todos'], queryFn: () => api.get('/todos').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/todos', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['todos'] }); setShowForm(false); setForm({ title: '', description: '', scheduled_at: '', duration_minutes: 30, priority: 'medium', category: '' }); toast.success('Todo added'); },
    onError: () => toast.error('Failed to add todo'),
  });

  const toggleMutation = useMutation({
    mutationFn: (todo: Todo) => api.patch(`/todos/${todo.id}`, { completed: !todo.completed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/todos/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['todos'] }); toast.success('Deleted'); },
  });

  const now = new Date();
  const filtered = todos.filter(t => {
    if (filter === 'completed') return t.completed;
    if (filter === 'today') return t.scheduled_at && new Date(t.scheduled_at).toDateString() === now.toDateString();
    if (filter === 'upcoming') return !t.completed && t.scheduled_at && new Date(t.scheduled_at) > now;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Todos</h1>
          <p className="text-slate-400 text-sm mt-0.5">{todos.filter(t => !t.completed).length} remaining</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Plus size={16} /> Add Todo
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white border border-white/5 hover:border-white/10'}`}>
            <Filter size={12} className="inline mr-1" />{f}
          </button>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">New Todo</h3>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="What needs to be done?" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-indigo-500/50" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" rows={2} className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-indigo-500/50 resize-none" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Scheduled at</label>
                  <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-indigo-500/50" style={{ background: 'rgba(255,255,255,0.05)', colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Duration (mins)</label>
                  <input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-indigo-500/50" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as typeof form.priority }))} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none border border-white/10" style={{ background: '#1a1a2e' }}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Work, Personal" className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-indigo-500/50" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {createMutation.isPending ? 'Adding...' : 'Add Todo'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Todo list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500 py-12">No todos here. Add one above.</motion.p>
          ) : (
            filtered.map(todo => (
              <motion.div key={todo.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all group ${todo.completed ? 'opacity-60 border-white/5' : 'border-white/5 hover:border-white/10'}`}
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <button onClick={() => toggleMutation.mutate(todo)} className="mt-0.5 shrink-0 transition-transform hover:scale-110">
                  {todo.completed ? <CheckCircle2 size={20} className="text-green-400" /> : <Circle size={20} className="text-slate-500 hover:text-indigo-400" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${todo.completed ? 'line-through text-slate-500' : 'text-white'}`}>{todo.title}</p>
                  {todo.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{todo.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {todo.scheduled_at && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={11} />{format(new Date(todo.scheduled_at), 'MMM d, h:mm a')}
                      </span>
                    )}
                    {todo.duration_minutes && <span className="text-xs text-slate-500">{todo.duration_minutes}m</span>}
                    {todo.category && <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-slate-400">{todo.category}</span>}
                    <span className="text-xs font-medium" style={{ color: priorityColor(todo.priority) }}>{todo.priority}</span>
                  </div>
                </div>
                <button onClick={() => deleteMutation.mutate(todo.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all shrink-0">
                  <Trash2 size={15} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
