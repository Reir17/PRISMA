'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-[280px] w-full flex items-center justify-center bg-slate-100 rounded-xl animate-pulse">Memuat peta...</div>
});

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'geofencing' | 'profile'>('geofencing');
  const [coords, setCoords] = useState({ lat: -6.2, lng: 106.8166 });
  const [radius, setRadius] = useState(50);
  const [isWfa, setIsWfa] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(true);

  const [profile, setProfile] = useState({ id: '', full_name: '', email: '', role: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchProfile();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('office_lat, office_lng, radius_meter, is_wfa')
      .eq('id', 1)
      .maybeSingle();

    if (data) {
      setCoords({
        lat: data.office_lat ?? -6.2,
        lng: data.office_lng ?? 106.8166
      });
      setRadius(data.radius_meter ?? 50);
      setIsWfa(data.is_wfa ?? false);
    }
    setLoadingGeo(false);
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
  };

  const saveSettings = async () => {
    const { error } = await supabase.from('settings').upsert({
      id: 1, office_lat: coords.lat, office_lng: coords.lng, radius_meter: radius, is_wfa: isWfa
    });
    if (error) return alert(error.message);
    alert('Berhasil disimpan');
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({ full_name: profile.full_name }).eq('id', profile.id);
    setSavingProfile(false);
    if (error) return alert(error.message);
    alert('Profil diperbarui');
  };

  return (
    <DashboardLayout>
      {/* Container utama dengan padding responsif */}
      <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8 pt-24 md:pt-10">
        
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Pengaturan</h2>
            <p className="text-slate-500 text-sm font-semibold">Kelola sistem & akun</p>
          </div>

          {/* TAB Navigation - Mobile Friendly */}
          <div className="flex gap-2 bg-slate-200 p-1.5 rounded-2xl mb-6">
            <button
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'geofencing' ? 'bg-white text-slate-900 shadow-sm scale-[1.02]' : 'text-slate-500'
              }`}
              onClick={() => setActiveTab('geofencing')}
            >
              Lokasi Kantor
            </button>
            <button
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'profile' ? 'bg-white text-slate-900 shadow-sm scale-[1.02]' : 'text-slate-500'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              Profil Akun
            </button>
          </div>

          {/* CONTENT CARD */}
          <div className="bg-white rounded-[24px] border-2 border-slate-900/5 shadow-xl shadow-slate-200/50 p-6 md:p-8">
            
            {/* ================= GEOFENCING ================= */}
            {activeTab === 'geofencing' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Konfigurasi Lokasi</h3>

                  {/* TOGGLE WFA - UI dipercantik */}
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-full border border-slate-100">
                    <span className="text-xs font-black text-slate-400">WFA</span>
                    <div
                      onClick={() => setIsWfa(!isWfa)}
                      className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${isWfa ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isWfa ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                </div>

                {!loadingGeo && (
                  <div className="h-[300px] md:h-[350px] rounded-2xl overflow-hidden border-2 border-slate-100">
                    <MapPicker coords={coords} setCoords={setCoords} radius={radius} />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Radius (meter)</label>
                    <input
                      type="number"
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <button 
                    className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95" 
                    onClick={saveSettings}
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            )}

            {/* ================= PROFILE ================= */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Detail Profil</h3>

                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nama Lengkap</label>
                    <input
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email (ReadOnly)</label>
                    <input
                      value={profile.email}
                      disabled
                      className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl font-bold text-slate-400 italic cursor-not-allowed"
                    />
                  </div>

                  <button 
                    onClick={saveProfile} 
                    className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95"
                  >
                    {savingProfile ? 'Memproses...' : 'Update Profil'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}