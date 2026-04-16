import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch {
      toast.error('Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at top, #1a1a3e 0%, #0f0f1a 60%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 glow" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Bell size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">FocusFlow</h1>
          <p className="text-slate-400 mt-1">Start your productivity journey</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Create account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all border border-white/10 focus:border-indigo-500/50"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all border border-white/10 focus:border-indigo-500/50"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all border border-white/10 focus:border-indigo-500/50"
                style={{ background: 'rgba(255,255,255,0.05)' }}
                placeholder="Min 6 characters"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
