'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

export default function MahasiswaDashboard() {
  const [loading, setLoading] = useState(true);
  const [dataStats, setDataStats] = useState({
    isClockInToday: false,
    isLogbookToday: false,
    statusAbsenToday: 'BELUM ABSEN',
    statusLogToday: 'BELUM ISI',
    absenDetail: { dosen: 'Pending', admin: 'Pending' },
    logbookDetail: { dosen: 'Pending', admin: 'Pending' },
    totalAbsen: 0,
    totalLogbook: 0,
    absApprove: 0,
    absReject: 0,
    logApprove: 0,
    logReject: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  // ... (Logika helper checkStatus, getIndividualStatus, getFinalStatus tetap sama)
  const checkStatus = (val: any, target: string) => {
    if (!val) return false;
    return String(val).toUpperCase().trim() === target.toUpperCase();
  };

  const getIndividualStatus = (isApprove: boolean, globalStatus: string) => {
    if (checkStatus(globalStatus, 'REJECTED')) {
      return isApprove ? 'Approved' : 'Rejected';
    }
    if (isApprove) return 'Approved';
    return 'Pending';
  };

  const getFinalStatus = (dApp: boolean, aApp: boolean, globalStatus: string) => {
    if (checkStatus(globalStatus, 'REJECTED')) return 'REJECTED'; 
    if (dApp && aApp) return 'APPROVED'; 
    return 'PENDING'; 
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase.from('attendance').select('*').eq('user_id', user.id);
      if (error) throw error;

      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA'); 

      let tempStats = {
        isClockInToday: false,
        isLogbookToday: false,
        statusAbsenToday: 'BELUM ABSEN',
        statusLogToday: 'BELUM ISI',
        absenDetail: { dosen: 'Pending', admin: 'Pending' },
        logbookDetail: { dosen: 'Pending', admin: 'Pending' },
        totalAbsen: data?.length || 0,
        totalLogbook: 0,
        absApprove: 0,
        absReject: 0,
        logApprove: 0,
        logReject: 0,
      };

      data?.forEach((row) => {
        const rowDate = new Date(row.clock_in).toLocaleDateString('en-CA');
        const fAbs = getFinalStatus(!!row.is_approve_dosen, !!row.is_approve_admin, row.status);
        if (fAbs === 'APPROVED') tempStats.absApprove++;
        if (fAbs === 'REJECTED') tempStats.absReject++;

        if (row.logbook_url) {
          tempStats.totalLogbook++;
          const fLog = getFinalStatus(!!row.logbook_approve_dosen, !!row.logbook_approve_admin, row.logbook_status);
          if (fLog === 'APPROVED') tempStats.logApprove++;
          if (fLog === 'REJECTED') tempStats.logReject++; 

          if (rowDate === todayStr) {
            tempStats.isLogbookToday = true;
            tempStats.statusLogToday = fLog;
            tempStats.logbookDetail = {
              dosen: getIndividualStatus(!!row.logbook_approve_dosen, row.logbook_status),
              admin: getIndividualStatus(!!row.logbook_approve_admin, row.logbook_status)
            };
          }
        }

        if (rowDate === todayStr) {
          tempStats.isClockInToday = true;
          tempStats.statusAbsenToday = fAbs;
          tempStats.absenDetail = {
            dosen: getIndividualStatus(!!row.is_approve_dosen, row.status),
            admin: getIndividualStatus(!!row.is_approve_admin, row.status)
          };
        }
      });
      
      setDataStats(tempStats);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const getBadgeStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <DashboardLayout>
      {/* PERUBAHAN DI SINI: pt-24 untuk mobile (mendorong konten turun) */}
      <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-10 px-4 sm:px-6 md:pt-12 md:px-10 font-sans text-slate-900">
        <div className="max-w-6xl mx-auto">
          
          <header className="mb-6 md:mb-10">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-800">
              Dashboard Mahasiswa
            </h1>
            <p className="text-slate-500 text-sm md:text-base mt-1">
              Pantau validasi laporan harian Anda secara realtime.
            </p>
          </header>

          {loading ? (
            <div className="animate-pulse space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-40 bg-slate-200 rounded-2xl"></div>
                <div className="h-40 bg-slate-200 rounded-2xl"></div>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: STATUS HARI INI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-10">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-700">Kehadiran Hari Ini</h3>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getBadgeStyles(dataStats.statusAbsenToday)}`}>
                      {dataStats.statusAbsenToday}
                    </span>
                  </div>
                  <div className="space-y-4 text-sm text-slate-600">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span>Dosen Pembimbing</span>
                      <span className={`font-bold ${dataStats.absenDetail.dosen === 'Rejected' ? 'text-rose-600' : 'text-slate-800'}`}>
                        {dataStats.absenDetail.dosen}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Administrator</span>
                      <span className={`font-bold ${dataStats.absenDetail.admin === 'Rejected' ? 'text-rose-600' : 'text-slate-800'}`}>
                        {dataStats.absenDetail.admin}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-700">Logbook Hari Ini</h3>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${getBadgeStyles(dataStats.statusLogToday)}`}>
                      {dataStats.statusLogToday}
                    </span>
                  </div>
                  <div className="space-y-4 text-sm text-slate-600">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span>Dosen Pembimbing</span>
                      <span className={`font-bold ${dataStats.logbookDetail.dosen === 'Rejected' ? 'text-rose-600' : 'text-slate-800'}`}>
                        {dataStats.logbookDetail.dosen}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Administrator</span>
                      <span className={`font-bold ${dataStats.logbookDetail.admin === 'Rejected' ? 'text-rose-600' : 'text-slate-800'}`}>
                        {dataStats.logbookDetail.admin}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATS SUMMARY */}
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Statistik Program</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Total Hadir</p>
                  <p className="text-2xl font-black text-slate-800">{dataStats.totalAbsen}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Logbook</p>
                  <p className="text-2xl font-black text-slate-800">{dataStats.totalLogbook}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Abs Reject</p>
                  <p className="text-2xl font-black text-rose-600">{dataStats.absReject}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-b-4 border-b-rose-500">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Log Reject</p>
                  <p className="text-2xl font-black text-rose-600">{dataStats.logReject}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}