'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

export default function DosenApproval() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'logbook'>('attendance');
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDosen, setCurrentDosen] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setCurrentDosen(data);
        fetchData(user.id);
      }
    };
    init();
  }, [activeTab]);

  const fetchData = async (dosenId?: string) => {
    const idToUse = dosenId || currentDosen?.id;
    if (!idToUse) return;

    try {
      setLoading(true);
      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles:user_id!inner(
            full_name, 
            university, 
            mentor_id
          )
        `)
        .eq('profiles.mentor_id', idToUse) 
        .order('created_at', { ascending: false });

      if (activeTab === 'attendance') {
        query = query.eq('status', 'PENDING');
      } else {
        query = query.eq('logbook_status', 'PENDING').not('logbook_url', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAllData(data || []);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (item: any, newStatus: 'APPROVED' | 'REJECTED') => {
    if (!currentDosen) return alert("Sesi habis.");
    const confirmAction = confirm(`Yakin ingin ${newStatus === 'APPROVED' ? 'menyetujui' : 'menolak'} data ini?`);
    if (!confirmAction) return;

    let updateData: any = {};

    if (activeTab === 'attendance') {
      if (newStatus === 'REJECTED') {
        updateData = { status: 'REJECTED' };
      } else {
        const willBeApproveDosen = true; 
        const willBeApproveAdmin = item.is_approve_admin; 
        updateData = {
          is_approve_dosen: willBeApproveDosen,
          approved_by_dosen: currentDosen.id,
          status: (willBeApproveDosen && willBeApproveAdmin) ? 'APPROVED' : 'PENDING'
        };
      }
    } else {
      if (newStatus === 'REJECTED') {
        updateData = { logbook_status: 'REJECTED' };
      } else {
        const willBeLogDosen = true;
        const willBeLogAdmin = item.logbook_approve_admin;
        updateData = {
          logbook_approve_dosen: willBeLogDosen,
          logbook_by_dosen: currentDosen.id,
          logbook_status: (willBeLogDosen && willBeLogAdmin) ? 'APPROVED' : 'PENDING'
        };
      }
    }

    const { error } = await supabase.from('attendance').update(updateData).eq('id', item.id);
    if (error) alert("Gagal update: " + error.message);
    else fetchData();
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-16 md:pt-0">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">📋 Persetujuan Pembimbing</h2>
            <p className="text-slate-500 text-sm md:text-base mt-2 font-medium">
              Validasi data bimbingan mahasiswa sebelum diteruskan ke sistem pusat.
            </p>
          </div>
          <div className="bg-blue-50 px-4 py-3 rounded-2xl border-2 border-blue-100 text-sm shadow-sm self-start md:self-center">
            Pembimbing: <strong className="text-blue-700 font-bold">{currentDosen?.full_name}</strong>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b-2 border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button 
            className={`pb-3 px-4 text-sm font-bold transition-all ${activeTab === 'attendance' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-400 border-b-4 border-transparent hover:text-slate-600'}`}
            onClick={() => setActiveTab('attendance')}
          >
            📍 Antrean Absensi
          </button>
          <button 
            className={`pb-3 px-4 text-sm font-bold transition-all ${activeTab === 'logbook' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-400 border-b-4 border-transparent hover:text-slate-600'}`}
            onClick={() => setActiveTab('logbook')}
          >
            📖 Antrean Logbook
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-900 font-bold gap-3">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             Memuat data...
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border-2 border-slate-100 overflow-hidden">
            {/* Desktop Table - Hidden on Mobile */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b-2 border-slate-100">
                  <tr>
                    <th className="p-5 text-xs font-black uppercase tracking-wider text-slate-900">Mahasiswa</th>
                    <th className="p-5 text-xs font-black uppercase tracking-wider text-slate-900">{activeTab === 'attendance' ? 'Bukti Foto' : 'Isi Logbook'}</th>
                    <th className="p-5 text-xs font-black uppercase tracking-wider text-slate-900">Verifikasi</th>
                    <th className="p-5 text-xs font-black uppercase tracking-wider text-slate-900 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allData.length === 0 ? (
                    <EmptyState colSpan={4} />
                  ) : (
                    allData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-5">
                          <div className="font-extrabold text-slate-900">{item.profiles?.full_name}</div>
                          <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-tighter">
                            {new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </td>
                        <td className="p-5">
                          {activeTab === 'attendance' ? (
                            <ImageThumbnail url={item.image_url_in} />
                          ) : (
                            <div className="max-w-xs text-sm font-medium bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed text-slate-800">
                              {item.logbook_url || "Kosong"}
                            </div>
                          )}
                        </td>
                        <td className="p-5 space-y-2">
                          <StatusTag label="Dosen" active={activeTab === 'attendance' ? item.is_approve_dosen : item.logbook_approve_dosen} />
                          <StatusTag label="Admin" active={activeTab === 'attendance' ? item.is_approve_admin : item.logbook_approve_admin} />
                        </td>
                        <td className="p-5 text-center">
                          <ActionButtons 
                            alreadyApproved={activeTab === 'attendance' ? item.is_approve_dosen : item.logbook_approve_dosen}
                            onApprove={() => handleAction(item, 'APPROVED')}
                            onReject={() => handleAction(item, 'REJECTED')}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile List View - Hidden on Desktop */}
            <div className="lg:hidden divide-y divide-slate-100">
               {allData.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-bold">🎉 Tidak ada data.</div>
              ) : (
                allData.map((item) => (
                  <div key={item.id} className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-black text-slate-900 text-base">{item.profiles?.full_name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(item.created_at).toLocaleString('id-ID')}</div>
                      </div>
                      <div className="flex gap-2">
                        <StatusTag label="Me" active={activeTab === 'attendance' ? item.is_approve_dosen : item.logbook_approve_dosen} />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {activeTab === 'attendance' ? (
                        <div className="flex items-center gap-4">
                           <ImageThumbnail url={item.image_url_in} />
                           <span className="text-xs font-bold text-slate-500 italic">Bukti Foto Masuk</span>
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-slate-700 leading-relaxed italic line-clamp-3">
                          "{item.logbook_url || "Logbook kosong"}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <ActionButtons 
                        alreadyApproved={activeTab === 'attendance' ? item.is_approve_dosen : item.logbook_approve_dosen}
                        onApprove={() => handleAction(item, 'APPROVED')}
                        onReject={() => handleAction(item, 'REJECTED')}
                        fullWidth
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// --- Shared Components ---

const EmptyState = ({ colSpan }: { colSpan: number }) => (
  <tr>
    <td colSpan={colSpan} className="text-center py-24 text-slate-400 font-bold">
      <div className="text-4xl mb-3">🎉</div>
      Semua data telah ditinjau.
    </td>
  </tr>
);

const ImageThumbnail = ({ url }: { url: string }) => (
  url ? (
    <a href={url} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm active:scale-95 transition-transform">
      <img src={url} className="w-full h-full object-cover" alt="Absen" />
    </a>
  ) : <span className="text-xs text-slate-300 font-bold italic underline">Tanpa Foto</span>
);

const StatusTag = ({ label, active }: { label: string, active: boolean }) => (
  <div className={`px-2 py-1 rounded-lg text-[10px] font-black w-fit border ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
    {label}: {active ? 'OK' : 'WAITING'}
  </div>
);

const ActionButtons = ({ alreadyApproved, onApprove, onReject, fullWidth }: any) => {
  if (alreadyApproved) {
    return <span className="text-[10px] font-black bg-emerald-600 text-white px-4 py-2 rounded-xl">✓ TELAH DISETUJUI</span>;
  }
  return (
    <div className={`flex gap-3 ${fullWidth ? 'w-full' : 'justify-center'}`}>
      <button onClick={onApprove} className={`${fullWidth ? 'flex-1' : ''} bg-emerald-600 text-white py-2 px-6 rounded-xl text-xs font-black shadow-lg shadow-emerald-200 active:scale-95 transition-all`}>SETUJU</button>
      <button onClick={onReject} className={`${fullWidth ? 'flex-1' : ''} bg-rose-600 text-white py-2 px-6 rounded-xl text-xs font-black shadow-lg shadow-rose-200 active:scale-95 transition-all`}>TOLAK</button>
    </div>
  );
};