'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function RiwayatMahasiswa() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('clock_in', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err: any) {
      console.error("Error Fetch History:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyles = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const renderApprovalSmall = (isApproved: boolean, role: string) => (
    <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
      isApproved ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'
    }`}>
      <span className="tracking-tighter">{role}</span>
      <span className="ml-2">{isApproved ? '✅' : '⏳'}</span>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Tambahkan pt-24 agar tidak tertutup header mobile */}
      <div className="min-h-screen bg-[#F8FAFC] px-4 pt-24 pb-12 md:pt-12 md:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Riwayat Aktivitas</h1>
              <p className="text-slate-500 text-sm md:text-base font-medium">Lacak verifikasi absensi dan logbook harian Anda.</p>
            </div>
            <Link href="/mahasiswa">
              <button className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 hover:shadow-sm transition-all active:scale-[0.98]">
                <span>←</span> Kembali
              </button>
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="relative flex items-center justify-center mb-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sinkronisasi Data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Desktop Table (Visible on MD screens and up) */}
              <div className="hidden md:block bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Waktu Presensi</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Absensi</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Logbook</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Koordinat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-6">
                          <p className="font-bold text-slate-800 text-sm">
                            {new Date(item.clock_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{new Date(item.clock_in).toLocaleDateString('id-ID', { weekday: 'long' })}</p>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                IN: {new Date(item.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                OUT: {item.clock_out ? new Date(item.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </span>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border mb-3 inline-block tracking-wider ${getBadgeStyles(item.status)}`}>
                            {item.status}
                          </span>
                          <div className="flex gap-2">
                            {renderApprovalSmall(item.is_approve_dosen, 'DOSEN')}
                            {renderApprovalSmall(item.is_approve_admin, 'ADMIN')}
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border mb-3 inline-block tracking-wider ${getBadgeStyles(item.logbook_status || 'PENDING')}`}>
                            {item.logbook_status || 'BELUM ISI'}
                          </span>
                          <div className="flex gap-2">
                            {renderApprovalSmall(item.logbook_approve_dosen, 'DOSEN')}
                            {renderApprovalSmall(item.logbook_approve_admin, 'ADMIN')}
                          </div>
                        </td>
                        <td className="p-6 text-right font-mono text-[10px] text-slate-400">
                           {item.lat_in?.toFixed(4)}, {item.long_in?.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List (Visible on Small screens only) */}
              <div className="md:hidden space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-5 pb-5 border-b border-slate-50">
                      <div>
                        <h4 className="font-black text-slate-900 text-lg">
                          {new Date(item.clock_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(item.clock_in).toLocaleDateString('id-ID', { weekday: 'long' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-600">IN {new Date(item.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-xs font-black text-slate-300">OUT {item.clock_out ? new Date(item.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Absensi</p>
                        <span className={`px-2 py-1.5 rounded-lg text-[9px] font-black border block text-center ${getBadgeStyles(item.status)}`}>
                          {item.status}
                        </span>
                        <div className="space-y-1.5">
                          {renderApprovalSmall(item.is_approve_dosen, 'DSN')}
                          {renderApprovalSmall(item.is_approve_admin, 'ADM')}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logbook</p>
                        <span className={`px-2 py-1.5 rounded-lg text-[9px] font-black border block text-center ${getBadgeStyles(item.logbook_status || 'PENDING')}`}>
                          {item.logbook_status || 'BELUM ISI'}
                        </span>
                        <div className="space-y-1.5">
                          {renderApprovalSmall(item.logbook_approve_dosen, 'DSN')}
                          {renderApprovalSmall(item.logbook_approve_admin, 'ADM')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {history.length === 0 && !loading && (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                  <div className="text-4xl mb-4">📂</div>
                  <h3 className="text-slate-900 font-bold">Tidak ada riwayat</h3>
                  <p className="text-slate-400 text-xs font-medium mt-1">Mulailah melakukan presensi untuk melihat data di sini.</p>
                </div>
              )}
            </div>
          )}

          <footer className="mt-16 text-center">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">
              PRISMA
            </p>
          </footer>
        </div>
      </div>
    </DashboardLayout>
  );
}