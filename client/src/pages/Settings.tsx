import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Globe, Monitor, Bell, BellOff, RefreshCw, Unlink, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { IntegrationStatus } from '../types';

async function subscribeToPush() {
  const reg = await navigator.serviceWorker.ready;
  const keyRes = await api.get('/notifications/vapid-key');
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyRes.data.publicKey,
  });
  await api.post('/notifications/subscribe', { subscription: sub });
  return sub;
}

export default function Settings() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const { data: integrations = [] } = useQuery<IntegrationStatus[]>({
    queryKey: ['integrations'],
    queryFn: () => api.get('/integrations/status').then(r => r.data),
  });

  useEffect(() => {
    const integration = searchParams.get('integration');
    const status = searchParams.get('status');
    if (integration && status === 'success') toast.success(`${integration} connected successfully`);
    if (integration && status === 'error') toast.error(`Failed to connect ${integration}`);
  }, [searchParams]);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => setPushEnabled(!!sub));
      });
    }
  }, []);

  const handlePushToggle = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        await sub?.unsubscribe();
        await api.delete('/notifications/unsubscribe');
        setPushEnabled(false);
        toast.success('Push notifications disabled');
      } else {
        await subscribeToPush();
        setPushEnabled(true);
        toast.success('Push notifications enabled');
      }
    } catch {
      toast.error('Failed to update notification settings');
    } finally {
      setPushLoading(false);
    }
  };

  const connectGoogle = async () => {
    const res = await api.get('/integrations/google/auth-url');
    window.location.href = res.data.url;
  };

  const revokeMutation = useMutation({
    mutationFn: (provider: string) => api.delete(`/integrations/${provider}`),
    onSuccess: (_, provider) => { qc.invalidateQueries({ queryKey: ['integrations'] }); toast.success(`${provider} disconnected`); },
  });

  const syncGoogleMutation = useMutation({
    mutationFn: () => api.post('/integrations/google/sync'),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['timetable'] }); toast.success(res.data.message); },
    onError: () => toast.error('Sync failed'),
  });

  const googleStatus = integrations.find(i => i.provider === 'google');
  const microsoftStatus = integrations.find(i => i.provider === 'microsoft');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage integrations and preferences</p>
      </div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-1 flex items-center gap-2"><Bell size={18} className="text-indigo-400" /> Push Notifications</h2>
        <p className="text-sm text-slate-400 mb-4">Get alerted 5 minutes before a task is due, even when the app is in the background.</p>
        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center gap-3">
            {pushEnabled ? <Bell size={18} className="text-green-400" /> : <BellOff size={18} className="text-slate-400" />}
            <div>
              <p className="text-sm font-medium text-white">Task Alarms</p>
              <p className="text-xs text-slate-500">{pushEnabled ? 'Active — you will receive 5-min warnings' : 'Disabled'}</p>
            </div>
          </div>
          <button onClick={handlePushToggle} disabled={pushLoading} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pushEnabled ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
            {pushLoading ? '...' : pushEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </motion.div>

      {/* Integrations */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-indigo-400" />
          <h2 className="font-semibold text-white">Integrations</h2>
        </div>
        <p className="text-sm text-slate-400 mb-5">Connect your accounts to automatically import meetings into your timetable. You control what gets accessed.</p>

        <div className="space-y-3">
          {/* Google */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(66,133,244,0.15)' }}>
                <Globe size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Google Calendar</p>
                <p className="text-xs text-slate-500">{googleStatus?.enabled ? `Connected · ${googleStatus.granted_at ? new Date(googleStatus.granted_at).toLocaleDateString() : ''}` : 'Import meetings from Google Calendar'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {googleStatus?.enabled ? (
                <>
                  <button onClick={() => syncGoogleMutation.mutate()} disabled={syncGoogleMutation.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/10 transition-all">
                    <RefreshCw size={12} className={syncGoogleMutation.isPending ? 'animate-spin' : ''} /> Sync
                  </button>
                  <button onClick={() => revokeMutation.mutate('google')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
                    <Unlink size={12} /> Disconnect
                  </button>
                </>
              ) : (
                <button onClick={connectGoogle} className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #4285f4, #34a853)' }}>
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* Microsoft */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,120,212,0.15)' }}>
                <Monitor size={18} className="text-sky-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Microsoft / OneDrive</p>
                <p className="text-xs text-slate-500">{microsoftStatus?.enabled ? 'Connected' : 'Import meetings from Outlook Calendar'}</p>
              </div>
            </div>
            <div>
              {microsoftStatus?.enabled ? (
                <button onClick={() => revokeMutation.mutate('microsoft')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
                  <Unlink size={12} /> Disconnect
                </button>
              ) : (
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #0078d4, #00bcf2)' }}>
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
