import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Play, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { MustDoHabit, MustNotDoHabit } from '../types';

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

export default function Habits() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'do' | 'dont'>('do');
  const [showForm, setShowForm] = useState(false);
  const [doForm, setDoForm] = useState({ title: '', description: '', frequency: 'daily' });
  const [dontForm, setDontForm] = useState({ title: '', description: '', motivation_video_url: '', motivation_video_title: '' });
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const { data: mustDo = [] } = useQuery<MustDoHabit[]>({ queryKey: ['must-do'], queryFn: () => api.get('/habits/must-do').then(r => r.data) });
  const { data: mustNotDo = [] } = useQuery<MustNotDoHabit[]>({ queryKey: ['must-not-do'], queryFn: () => api.get('/habits/must-not-do').then(r => r.data) });

  const addDoMutation = useMutation({
    mutationFn: (data: typeof doForm) => api.post('/habits/must-do', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['must-do'] }); setShowForm(false); setDoForm({ title: '', description: '', frequency: 'daily' }); toast.success('Habit added'); },
  });

  const addDontMutation = useMutation({
    mutationFn: (data: typeof dontForm) => api.post('/habits/must-not-do', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['must-not-do'] }); setShowForm(false); setDontForm({ title: '', description: '', motivation_video_url: '', motivation_video_title: '' }); toast.success('Added to avoid list'); },
  });

  const deleteDoMutation = useMutation({ mutationFn: (id: string) => api.delete(`/habits/must-do/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['must-do'] }) });
  const deleteDontMutation = useMutation({ mutationFn: (id: string) => api.delete(`/habits/must-not-do/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['must-not-do'] }) });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Habits</h1>
          <p className="text-slate-400 text-sm mt-0.5">Build good habits, break bad ones</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Plus size={16} /> Add Habit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <button onClick={() => setTab('do')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'do' ? 'bg-green-500/20 text-green-300' : 'text-slate-400 hover:text-white'}`}>
          <CheckCircle size={15} /> Must Do
        </button>
        <button onClick={() => setTab('dont')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'dont' ? 'bg-red-500/20 text-red-300' : 'text-slate-400 hover:text-white'}`}>
          <XCircle size={15} /> Must Not Do
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">{tab === 'do' ? 'Add Must-Do Habit' : 'Add Must-Not-Do Habit'}</h3>
            {tab === 'do' ? (
              <div className="space-y-3">
                <input value={doForm.title} onChange={e => setDoForm(p => ({ ...p, title: e.target.value }))} placeholder="Habit title" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-green-500/50" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <textarea value={doForm.description} onChange={e => setDoForm(p => ({ ...p, description: e.target.value }))} placeholder="Why is this important?" rows={2} className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none border border-white/10 resize-none" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <select value={doForm.frequency} onChange={e => setDoForm(p => ({ ...p, frequency: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none border border-white/10" style={{ background: '#1a1a2e' }}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <div className="flex gap-3">
                  <button onClick={() => addDoMutation.mutate(doForm)} disabled={!doForm.title} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>Add</button>
                  <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 border border-white/10">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input value={dontForm.title} onChange={e => setDontForm(p => ({ ...p, title: e.target.value }))} placeholder="What to avoid?" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-red-500/50" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <textarea value={dontForm.description} onChange={e => setDontForm(p => ({ ...p, description: e.target.value }))} placeholder="Why avoid this?" rows={2} className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none border border-white/10 resize-none" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <input value={dontForm.motivation_video_url} onChange={e => setDontForm(p => ({ ...p, motivation_video_url: e.target.value }))} placeholder="YouTube motivation video URL (optional)" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-red-500/50" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <input value={dontForm.motivation_video_title} onChange={e => setDontForm(p => ({ ...p, motivation_video_title: e.target.value }))} placeholder="Video title (optional)" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="flex gap-3">
                  <button onClick={() => addDontMutation.mutate(dontForm)} disabled={!dontForm.title} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>Add</button>
                  <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 border border-white/10">Cancel</button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lists */}
      <AnimatePresence mode="wait">
        {tab === 'do' ? (
          <motion.div key="do" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {mustDo.length === 0 ? <p className="text-center text-slate-500 py-12">No must-do habits yet. Add some to build your routine.</p> : mustDo.map(h => (
              <motion.div key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 p-4 rounded-xl border border-green-500/10 group" style={{ background: 'rgba(16,185,129,0.05)' }}>
                <CheckCircle size={18} className="text-green-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{h.title}</p>
                  {h.description && <p className="text-xs text-slate-400 mt-0.5">{h.description}</p>}
                  <span className="text-xs text-green-400/70 mt-1 inline-block capitalize">{h.frequency}</span>
                </div>
                <button onClick={() => deleteDoMutation.mutate(h.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="dont" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {mustNotDo.length === 0 ? <p className="text-center text-slate-500 py-12">No habits to avoid yet. Add things you want to stay away from.</p> : mustNotDo.map(h => (
              <motion.div key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 rounded-xl border border-red-500/10 group" style={{ background: 'rgba(239,68,68,0.05)' }}>
                <div className="flex items-start gap-3">
                  <XCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{h.title}</p>
                    {h.description && <p className="text-xs text-slate-400 mt-0.5">{h.description}</p>}
                  </div>
                  <button onClick={() => deleteDontMutation.mutate(h.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>

                {h.motivation_video_url && (
                  <div className="mt-3 ml-7">
                    {playingVideo === h.id ? (
                      <div className="space-y-2">
                        <div className="rounded-xl overflow-hidden aspect-video">
                          <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeId(h.motivation_video_url)}?autoplay=1`}
                            className="w-full h-full" allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>
                        <button onClick={() => setPlayingVideo(null)} className="text-xs text-slate-400 hover:text-white">Close video</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setPlayingVideo(h.id)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-300 border border-red-500/20 hover:bg-red-500/10 transition-all">
                          <Play size={12} /> Watch motivation video
                        </button>
                        {h.motivation_video_title && <span className="text-xs text-slate-500 truncate">{h.motivation_video_title}</span>}
                        <a href={h.motivation_video_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 transition-all">
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
