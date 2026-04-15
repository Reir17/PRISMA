'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';

export default function MahasiswaLogbook() {
  const router = useRouter();
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [logContent, setLogContent] = useState('');
  const [logStatus, setLogStatus] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Mengecek status absensi...');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkActiveAttendance();
  }, []);

  const checkActiveAttendance = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.toISOString();
      
      const tomorrow = new Date();
      tomorrow.setHours(23, 59, 59, 999);
      const endOfDay = tomorrow.toISOString();

      const { data, error } = await supabase
        .from('attendance')
        .select('id, logbook_url, logbook_status')
        .eq('user_id', user.id)
        .gte('clock_in', startOfDay)
        .lte('clock_in', endOfDay)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle(); // Menggunakan maybeSingle agar tidak error jika data kosong

      if (error || !data) {
        setStatusText('Belum ada data kehadiran hari ini.');
      } else {
        setAttendanceId(data.id);
        setLogContent(data.logbook_url || '');
        setLogStatus(data.logbook_status);
        
        const s = data.logbook_status?.toUpperCase();
        if (s === 'APPROVED') {
          setStatusText('✅ Logbook hari ini sudah disetujui.');
        } else if (s === 'REJECTED') {
          setStatusText('❌ Logbook ditolak. Silakan perbaiki konten Anda.');
        } else if (s === 'PENDING' && data.logbook_url) {
          setStatusText('⏳ Logbook terkirim. Menunggu verifikasi.');
        } else {
          setStatusText('📝 Tuliskan detail kegiatan magang Anda hari ini.');
        }
      }
    } catch (err) {
      console.error("Fetch Logbook Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveLogbook = async () => {
    if (!attendanceId) return;
    if (!logContent.trim()) return alert("Konten logbook tidak boleh kosong!");

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('attendance')
        .update({ 
          logbook_url: logContent,
          logbook_status: 'PENDING',
          logbook_approve_dosen: false,
          logbook_approve_admin: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', attendanceId);

      if (error) throw error;
      alert("Logbook berhasil dikirim!");
      await checkActiveAttendance(); 
    } catch (err: any) {
      alert("Gagal simpan logbook: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isDisabled = isSaving || loading || logStatus === 'APPROVED';

  return (
    <DashboardLayout>
      {/* Container Utama dengan Responsive Padding */}
      <div className="min-h-screen bg-slate-50 px-4 pt-24 pb-12 md:pt-12 md:px-10 lg:px-16 font-sans">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Section */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Logbook Harian
              </h1>
              <p className="text-slate-500 text-sm md:text-base mt-2">
                Dokumentasikan progres pengerjaan tugas Anda hari ini.
              </p>
            </div>
            <div className="inline-flex items-center self-start sm:self-auto text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </header>

          {/* Alert Status Area */}
          <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-4 shadow-sm transition-all duration-300 ${
            logStatus === 'REJECTED' ? 'bg-rose-50 border-rose-100 text-rose-700' : 
            logStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
            attendanceId ? 'bg-white border-slate-200 text-slate-600' : 'bg-amber-50 border-amber-100 text-amber-700'
          }`}>
            <div className={`flex-shrink-0 w-3 h-3 rounded-full ${
                logStatus === 'REJECTED' ? 'bg-rose-500 animate-pulse' : 
                logStatus === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`}></div>
            <p className="text-xs md:text-sm font-bold tracking-tight">{statusText}</p>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 animate-pulse">
               <div className="h-4 w-32 bg-slate-100 rounded mb-6"></div>
               <div className="h-64 bg-slate-50 rounded-2xl"></div>
            </div>
          ) : attendanceId ? (
            /* Input Area */
            <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                      Deskripsi Kegiatan
                    </label>
                    {logStatus === 'APPROVED' && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold">TERKUNCI</span>
                    )}
                </div>
                <textarea
                  rows={10}
                  value={logContent}
                  onChange={(e) => setLogContent(e.target.value)}
                  disabled={logStatus === 'APPROVED'}
                  placeholder="Ceritakan apa yang Anda pelajari atau kerjakan hari ini..."
                  className={`w-full p-4 md:p-6 rounded-2xl border outline-none transition-all text-slate-700 leading-relaxed text-sm md:text-base shadow-inner ${
                    logStatus === 'REJECTED' 
                        ? 'border-rose-200 bg-rose-50/20 focus:border-rose-400' 
                        : 'border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5'
                  } ${logStatus === 'APPROVED' ? 'bg-slate-50 cursor-not-allowed opacity-70' : ''}`}
                />
              </div>
              
              <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <p className="text-[10px] md:text-xs text-slate-400 italic text-center md:text-left">
                  {logStatus === 'APPROVED' 
                    ? "Logbook yang sudah disetujui tidak dapat diubah." 
                    : "Tekan simpan untuk mengirim laporan harian."}
                </p>
                <button
                  onClick={saveLogbook}
                  disabled={isDisabled}
                  className={`w-full md:w-auto px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.95] shadow-xl ${
                    logStatus === 'APPROVED' 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                  }`}
                >
                  {isSaving ? 'Menyimpan...' : logStatus === 'REJECTED' ? 'Kirim Revisi' : 'Simpan Logbook'}
                </button>
              </div>
            </div>
          ) : (
            /* Lock Screen */
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-10 md:p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                <span className="text-4xl">🔐</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Akses Terkunci</h3>
              <p className="text-slate-500 text-sm mt-3 mb-10 max-w-xs mx-auto leading-relaxed">
                Silakan lakukan <strong>Clock In</strong> pada menu Presensi sebelum mengisi logbook harian Anda.
              </p>
              <button 
                onClick={() => router.push('/mahasiswa/absen')}
                className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100"
              >
                Buka Kamera Presensi
              </button>
            </div>
          )}

          <footer className="mt-12 text-center px-6">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-loose">
              Laporan yang jujur dan detail sangat membantu dalam proses penilaian magang Anda.
            </p>
          </footer>
        </div>
      </div>
    </DashboardLayout>
  );
}