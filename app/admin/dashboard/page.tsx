'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminDashboard() {
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const timeStart = `${today}T00:00:00`;
    const timeEnd = `${today}T23:59:59`;

    try {
      const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'MAHASISWA');

      const { data: absData, error: absError } = await supabase
        .from('attendance')
        .select('status, logbook_status, clock_in, logbook_url');

      if (absError) throw absError;
      const allData = absData || [];

      setStats({
        totalStudents: studentCount || 0,
        absTotalPending: allData.filter(i => i.status === 'PENDING').length,
        absTotalApproved: allData.filter(i => i.status === 'APPROVED').length,
        absTotalRejected: allData.filter(i => i.status === 'REJECTED').length,
        absTodayPending: allData.filter(i => i.status === 'PENDING' && i.clock_in >= timeStart && i.clock_in <= timeEnd).length,
        absTodayApproved: allData.filter(i => i.status === 'APPROVED' && i.clock_in >= timeStart && i.clock_in <= timeEnd).length,
        logTotalPending: allData.filter(i => i.logbook_url && i.logbook_status === 'PENDING').length,
        logTotalApproved: allData.filter(i => i.logbook_url && i.logbook_status === 'APPROVED').length,
        logTotalRejected: allData.filter(i => i.logbook_url && i.logbook_status === 'REJECTED').length,
        logTodayPending: allData.filter(i => i.logbook_url && i.logbook_status === 'PENDING' && i.clock_in >= timeStart && i.clock_in <= timeEnd).length,
        logTodayApproved: allData.filter(i => i.logbook_url && i.logbook_status === 'APPROVED' && i.clock_in >= timeStart && i.clock_in <= timeEnd).length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* pt-20 ditambahkan agar tidak tertutup header mobile fixed */}
      <div className="min-h-screen bg-slate-50 pt-20 p-4 md:pt-8 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Ringkasan Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">Monitoring verifikasi dosen & admin secara real-time.</p>
            </div>
            <button 
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              ) : '🔄'} 
              Segarkan Data
            </button>
          </header>

          {/* Stats Grid - Responsif: 1 kolom di HP, 3 di Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <MetricCard 
              label="Total Mahasiswa" 
              value={stats.totalStudents} 
              unit="Peserta" 
              color="bg-slate-900" 
              icon="👥"
            />
            <MetricCard 
              label="Hadir Hari Ini" 
              value={stats.absTodayApproved + stats.absTodayPending} 
              subtext={`Selesai Verifikasi: ${stats.absTodayApproved}`}
              color="bg-indigo-600" 
              icon="📍"
            />
            <MetricCard 
              label="Butuh Tindakan" 
              value={stats.absTodayPending + stats.logTodayPending} 
              subtext={`Absen: ${stats.absTodayPending} | Log: ${stats.logTodayPending}`}
              color="bg-amber-500" 
              icon="⚠️"
            />
          </div>

          {/* Content Layout - Responsif: Stack di HP, Berjajar di Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <TableSection 
              title="Antrean Absensi" 
              count={stats.absTotalPending} 
              todayPending={stats.absTodayPending}
              todayDone={stats.absTodayApproved}
              totalDone={stats.absTotalApproved}
              totalFail={stats.absTotalRejected}
              btnColor="bg-indigo-600"
              link="/admin/approval"
            />
            
            <TableSection 
              title="Antrean Logbook" 
              count={stats.logTotalPending} 
              todayPending={stats.logTodayPending}
              todayDone={stats.logTodayApproved}
              totalDone={stats.logTotalApproved}
              totalFail={stats.logTotalRejected}
              btnColor="bg-slate-700"
              link="/admin/approval"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ label, value, unit = "", subtext = "", color, icon }: any) {
  return (
    <div className={`${color} rounded-[24px] md:rounded-[32px] p-6 md:p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden`}>
      <div className="relative z-10">
        <p className="text-[10px] md:text-xs font-bold opacity-70 uppercase tracking-widest mb-1">{label}</p>
        <h2 className="text-3xl md:text-4xl font-black mb-2">{value} <span className="text-base md:text-lg font-medium opacity-60">{unit}</span></h2>
        {subtext && <p className="text-[10px] md:text-xs font-medium opacity-80 leading-relaxed">{subtext}</p>}
      </div>
      <span className="absolute -right-2 -bottom-2 text-6xl md:text-8xl opacity-10 grayscale pointer-events-none">{icon}</span>
    </div>
  );
}

function TableSection({ title, count, todayPending, todayDone, totalDone, totalFail, btnColor, link }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <h3 className="text-lg font-bold text-slate-900 italic tracking-tight">{title}</h3>
        <span className="w-fit px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-tighter">
          {count} PENDING
        </span>
      </div>
      
      <div className="space-y-4 md:space-y-6">
        <DataRow label="Menunggu Persetujuan" today={todayPending} total={count} />
        <DataRow label="Sudah Terverifikasi" today={todayDone} total={totalDone} isGreen />
        <DataRow label="Ditolak / Bermasalah" today="-" total={totalFail} isRed />
      </div>

      <button 
        onClick={() => window.location.href = link}
        className={`w-full mt-8 md:mt-10 py-4 ${btnColor} text-white rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] hover:brightness-110`}
      >
        Buka Modul Verifikasi
      </button>
    </div>
  );
}

function DataRow({ label, today, total, isGreen, isRed }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50">
      <div className="pr-2">
        <p className="text-sm font-bold text-slate-700 leading-tight">{label}</p>
        <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Hari Ini: {today}</p>
      </div>
      <div className={`text-lg md:text-xl font-black ${isGreen ? 'text-emerald-500' : isRed ? 'text-rose-500' : 'text-slate-900'}`}>
        {total}
      </div>
    </div>
  );
}