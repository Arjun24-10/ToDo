import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { TimetableSlot } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function Timetable() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', day_of_week: 1, start_time: '09:00', end_time: '10:00', color: '#6366f1' });

  const { data: slots = [] } = useQuery<TimetableSlot[]>({ queryKey: ['timetable'], queryFn: () => api.get('/timetable').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/timetable', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetable'] }); setShowForm(false); toast.success('Slot added'); },
    onError: () => toast.error('Failed to add slot'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/timetable/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable'] }),
  });

  const slotsByDay = DAYS.map((_, i) => slots.filter(s => s.day_of_week === i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Timetable</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your weekly schedule at a glance</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Plus size={16} /> Add Slot
        </button>
      </div>

      {/* Add form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-white">Add Timetable Slot</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Slot title (e.g. Morning Workout)" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-indigo-500/50" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Day</label>
                  <select value={form.day_of_week} onChange={e => setForm(p => ({ ...p, day_of_week: parseInt(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none border border-white/10" style={{ background: '#1a1a2e' }}>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Start time</label>
                    <input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none border border-white/10" style={{ background: 'rgba(255,255,255,0.05)', colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">End time</label>
                    <input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none border border-white/10" style={{ background: 'rgba(255,255,255,0.05)', colorScheme: 'dark' }} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))} className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110' : ''}`} style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => createMutation.mutate(form)} disabled={!form.title || createMutation.isPending} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {createMutation.isPending ? 'Adding...' : 'Add Slot'}
                  </button>
                  <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white border border-white/10 transition-all">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly grid */}
      <div className="grid grid-cols-7 gap-3">
        {DAYS.map((day, i) => (
          <div key={day} className="space-y-2">
            <div className={`text-center text-xs font-semibold py-2 rounded-lg ${new Date().getDay() === i ? 'text-indigo-300 bg-indigo-500/20' : 'text-slate-400'}`}>
              {day}
            </div>
            <div className="space-y-1.5 min-h-24">
              {slotsByDay[i].map(slot => (
                <motion.div key={slot.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="group relative p-2 rounded-lg text-xs cursor-default"
                  style={{ background: `${slot.color}20`, borderLeft: `3px solid ${slot.color}` }}>
                  <p className="font-medium text-white truncate">{slot.title}</p>
                  <p className="text-slate-400 mt-0.5">{slot.start_time} – {slot.end_time}</p>
                  {slot.source !== 'manual' && <span className="text-xs" style={{ color: slot.color }}>{slot.source}</span>}
                  <button onClick={() => deleteMutation.mutate(slot.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all">
                    <Trash2 size={11} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
