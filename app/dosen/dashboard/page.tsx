'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

export default function DosenDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    absTotalPending: 0,
    absTotalApproved: 0,
    absTotalRejected: 0,
    absTodayPending: 0,
    absTodayApproved: 0,
    logTotalPending: 0,
    logTotalApproved: 0,
    logTotalRejected: 0,
    logTodayPending: 0,
    logTodayApproved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchDosenData();
  }, []);

  const fetchDosenData = async () => {
    setLoading(true);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(prof);

      const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .eq('mentor_id', user.id)
        .eq('role', 'MAHASISWA');

      const studentIds = students?.map(s => s.id) || [];

      if (studentIds.length === 0) {
        setStats(prev => ({ ...prev, totalStudents: 0 }));
        return;
      }

      const { data: absData } = await supabase
        .from('attendance')
        .select(`status, logbook_status, clock_in, logbook_url, is_approve_dosen, logbook_approve_dosen`)
        .in('user_id', studentIds);

      const allData = absData || [];
      const isToday = (dateStr: string) => {
        const d = new Date(dateStr);
        return d >= startOfDay && d <= endOfDay;
      };

      setStats({
        totalStudents: studentIds.length,
        absTotalPending: allData.filter(i => i.status === 'PENDING').length,
        absTotalApproved: allData.filter(i => i.is_approve_dosen === true).length,
        absTotalRejected: allData.filter(i => i.status === 'REJECTED').length,
        absTodayPending: allData.filter(i => i.status === 'PENDING' && isToday(i.clock_in)).length,
        absTodayApproved: allData.filter(i => i.is_approve_dosen === true && isToday(i.clock_in)).length,
        logTotalPending: allData.filter(i => i.logbook_url && i.logbook_status === 'PENDING').length,
        logTotalApproved: allData.filter(i => i.logbook_approve_dosen === true).length,
        logTotalRejected: allData.filter(i => i.logbook_status === 'REJECTED').length,
        logTodayPending: allData.filter(i => i.logbook_url && i.logbook_status === 'PENDING' && isToday(i.clock_in)).length,
        logTodayApproved: allData.filter(i => i.logbook_approve_dosen === true && isToday(i.clock_in)).length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* pt-24 di mobile agar tidak tertutup header, md:pt-12 di desktop */}
      <div className="min-h-screen bg-slate-50 px-4 pt-24 pb-12 md:pt-12 md:px-8 lg:px-12 text-slate-900">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                Halo, <span className="text-indigo-600">{profile?.full_name?.split(' ')[0] || 'Mentor'}</span> 👋
              </h1>
              <p className="text-slate-500 text-sm md:text-lg mt-1 font-medium italic md:not-italic">
                Monitoring progres bimbingan mahasiswa Anda hari ini.
              </p>
            </div>
            <button 
              onClick={fetchDosenData} 
              disabled={loading}
              className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 text-sm"
            >
              {loading ? '🔄 Memuat...' : '🔄 Segarkan Data'}
            </button>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
            <MetricCard label="Total Mahasiswa" value={stats.totalStudents} unit="Siswa" color="bg-slate-900" icon="👥" />
            <MetricCard label="Hadir Hari Ini" value={stats.absTodayApproved + stats.absTodayPending} unit="Siswa" color="bg-indigo-600" icon="📍" />
            <MetricCard 
              label="Perlu Tindakan" 
              value={stats.absTodayPending + stats.logTodayPending} 
              unit="Item" 
              color="bg-rose-600" 
              icon="⚠️" 
              subtext="Menunggu verifikasi" 
            />
          </div>

          {/* Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
            <TableSection 
              title="Antrean Kehadiran" 
              count={stats.absTotalPending} 
              todayPending={stats.absTodayPending}
              todayDone={stats.absTodayApproved}
              totalDone={stats.absTotalApproved}
              totalFail={stats.absTotalRejected}
              btnColor="bg-indigo-600"
              link="/dosen/approval"
            />
            <TableSection 
              title="Antrean Logbook" 
              count={stats.logTotalPending} 
              todayPending={stats.logTodayPending}
              todayDone={stats.logTodayApproved}
              totalDone={stats.logTotalApproved}
              totalFail={stats.logTotalRejected}
              btnColor="bg-slate-800"
              link="/dosen/logbook"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ label, value, unit, color, icon, subtext }: any) {
  return (
    <div className={`${color} rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-40 md:h-48`}>
      <div className="relative z-10">
        <p className="text-[10px] md:text-sm font-bold opacity-80 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <h2 className="text-4xl md:text-5xl font-black">{value}</h2>
          <span className="text-base md:text-lg font-bold opacity-70">{unit}</span>
        </div>
        {subtext && (
          <p className="text-[10px] mt-2 font-black bg-white/20 inline-block px-2 py-0.5 md:py-1 rounded-lg uppercase tracking-tighter">
            {subtext}
          </p>
        )}
      </div>
      <span className="absolute -right-2 -bottom-4 text-7xl md:text-9xl opacity-20 pointer-events-none">{icon}</span>
    </div>
  );
}

function TableSection({ title, count, todayPending, todayDone, totalDone, totalFail, btnColor, link }: any) {
  return (
    <div className="bg-white border-2 border-slate-100 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-8 md:mb-10">
          <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight leading-tight">{title}</h3>
          <span className="px-3 py-1 bg-rose-50 text-rose-700 border-2 border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex-shrink-0">
            {count} Pending
          </span>
        </div>
        
        <div className="space-y-2 md:space-y-4">
          <DataRow label="Menunggu Review" today={todayPending} total={count} />
          <DataRow label="Sudah Disetujui" today={todayDone} total={totalDone} isGreen />
          <DataRow label="Ditolak / Revisi" today="-" total={totalFail} isRed />
        </div>
      </div>

      <button 
        onClick={() => window.location.href = link}
        className={`w-full mt-8 md:mt-10 py-4 md:py-5 ${btnColor} text-white rounded-2xl md:rounded-[1.5rem] font-black text-sm md:text-base shadow-lg hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-widest`}
      >
        Mulai Verifikasi
      </button>
    </div>
  );
}

function DataRow({ label, today, total, isGreen, isRed }: any) {
  return (
    <div className="flex items-center justify-between py-3 md:py-4 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm md:text-base font-bold text-slate-700">{label}</p>
        <p className="text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Hari Ini: {today}</p>
      </div>
      <div className={`text-xl md:text-2xl font-black ${isGreen ? 'text-emerald-600' : isRed ? 'text-rose-600' : 'text-slate-900'}`}>
        {total}
      </div>
    </div>
  );
}