'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminApproval() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'logbook'>('attendance');
  const [allData, setAllData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  const [searchName, setSearchName] = useState('');
  const [searchUni, setSearchUni] = useState('');
  const [searchDate, setSearchDate] = useState('');

  useEffect(() => {
    fetchData();
    getAdmin();
  }, [activeTab]);

  useEffect(() => {
    let result = [...allData];
    if (searchName) {
      result = result.filter(item => 
        item.profiles?.full_name?.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    if (searchUni) {
      result = result.filter(item => 
        item.profiles?.university?.toLowerCase().includes(searchUni.toLowerCase())
      );
    }
    if (searchDate) {
      result = result.filter(item => item.created_at.startsWith(searchDate));
    }
    setFilteredData(result);
  }, [searchName, searchUni, searchDate, allData]);

  const getAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentAdmin(data);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('attendance')
        .select(`*, profiles:user_id (full_name, university)`)
        .order('created_at', { ascending: false });

      if (activeTab === 'attendance') {
        query = query.eq('status', 'PENDING');
      } else {
        query = query.eq('logbook_status', 'PENDING').not('logbook_url', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAllData(data || []);
      setFilteredData(data || []);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (item: any, newStatus: 'APPROVED' | 'REJECTED') => {
    if (!currentAdmin) return alert("Sesi habis. Silakan login kembali.");
    const role = currentAdmin.role;
    if (role !== 'DOSEN' && role !== 'ADMIN') return alert("Izin ditolak.");
    
    const confirmAction = confirm(`Yakin ingin ${newStatus} data ini?`);
    if (!confirmAction) return;

    let updateData: any = {};
    const isDosen = role === 'DOSEN';

    if (activeTab === 'attendance') {
      if (newStatus === 'REJECTED') {
        updateData = { status: 'REJECTED' };
      } else {
        const willBeApproveDosen = isDosen ? true : item.is_approve_dosen;
        const willBeApproveAdmin = role === 'ADMIN' ? true : item.is_approve_admin;
        updateData = {
          is_approve_dosen: willBeApproveDosen,
          is_approve_admin: willBeApproveAdmin,
          approved_by_dosen: isDosen ? currentAdmin.id : item.approved_by_dosen,
          approved_by_admin: role === 'ADMIN' ? currentAdmin.id : item.approved_by_admin,
          status: (willBeApproveDosen && willBeApproveAdmin) ? 'APPROVED' : 'PENDING'
        };
      }
    } else {
      if (newStatus === 'REJECTED') {
        updateData = { logbook_status: 'REJECTED' };
      } else {
        const willBeLogDosen = isDosen ? true : item.logbook_approve_dosen;
        const willBeLogAdmin = role === 'ADMIN' ? true : item.logbook_approve_admin;
        updateData = {
          logbook_approve_dosen: willBeLogDosen,
          logbook_approve_admin: willBeLogAdmin,
          logbook_by_dosen: isDosen ? currentAdmin.id : item.logbook_by_dosen,
          logbook_by_admin: role === 'ADMIN' ? currentAdmin.id : item.logbook_by_admin,
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
      <div className="pt-20 p-4 md:pt-8 md:p-8 max-w-7xl mx-auto font-sans">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              🛡️ <span className="tracking-tight">Sistem Approval</span>
            </h2>
            <p className="text-slate-500 text-sm md:text-base font-medium mt-1">
              Validasi bukti kehadiran dan laporan aktivitas harian mahasiswa.
            </p>
          </div>
          {currentAdmin && (
            <div className="bg-indigo-50 border-2 border-indigo-100 px-4 py-2 rounded-xl text-sm self-start">
              <span className="text-slate-600 font-semibold">Role: </span>
              <span className="text-indigo-600 font-black uppercase tracking-wider">{currentAdmin.role}</span>
            </div>
          )}
        </header>

        {/* FILTER BAR - Responsif: Stack di mobile, Row di desktop */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Mahasiswa</label>
            <input 
              type="text" placeholder="Cari nama..." value={searchName} 
              onChange={(e) => setSearchName(e.target.value)} 
              className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Asal Kampus</label>
            <input 
              type="text" placeholder="Universitas..." value={searchUni} 
              onChange={(e) => setSearchUni(e.target.value)} 
              className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm font-semibold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
            <input 
              type="date" value={searchDate} 
              onChange={(e) => setSearchDate(e.target.value)} 
              className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm font-semibold"
            />
          </div>
          <button 
            onClick={() => {setSearchName(''); setSearchUni(''); setSearchDate('');}} 
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            Reset Filter
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-4 border-b-2 border-slate-100 mb-6">
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`pb-3 px-4 text-sm font-bold transition-all border-b-4 ${activeTab === 'attendance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            📍 Presensi
          </button>
          <button 
            onClick={() => setActiveTab('logbook')}
            className={`pb-3 px-4 text-sm font-bold transition-all border-b-4 ${activeTab === 'logbook' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
          >
            📖 Logbook
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse">Menghubungkan ke server...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* DESKTOP TABLE VIEW - Hidden on Mobile */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-black">
                    <th className="p-5">Mahasiswa</th>
                    <th className="p-5">{activeTab === 'attendance' ? 'Foto Bukti' : 'Isi Aktivitas'}</th>
                    <th className="p-5">Progress Verifikasi</th>
                    <th className="p-5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-20 text-center text-slate-400 font-bold italic">Tidak ada antrean data ditemukan.</td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <DesktopRow key={item.id} item={item} activeTab={activeTab} currentAdmin={currentAdmin} handleAction={handleAction} />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW - Hidden on Desktop */}
            <div className="lg:hidden space-y-4">
              {filteredData.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-bold italic bg-white rounded-2xl border border-slate-200">Tidak ada antrean data.</div>
              ) : (
                filteredData.map((item) => (
                  <MobileCard key={item.id} item={item} activeTab={activeTab} currentAdmin={currentAdmin} handleAction={handleAction} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Sub-komponen untuk Baris Desktop
const DesktopRow = ({ item, activeTab, currentAdmin, handleAction }: any) => {
  const isDosen = currentAdmin?.role === 'DOSEN';
  const hasUserApproved = activeTab === 'attendance'
    ? (isDosen ? item.is_approve_dosen : item.is_approve_admin)
    : (isDosen ? item.logbook_approve_dosen : item.logbook_approve_admin);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="p-5">
        <div className="font-bold text-slate-900">{item.profiles?.full_name}</div>
        <div className="text-xs text-indigo-600 font-bold mt-0.5">{item.profiles?.university}</div>
        <div className="text-[10px] text-slate-400 mt-2">🕒 {new Date(item.created_at).toLocaleString('id-ID')}</div>
      </td>
      <td className="p-5">
        {activeTab === 'attendance' ? (
          item.image_url_in ? (
            <a href={item.image_url_in} target="_blank" rel="noopener noreferrer">
              <img src={item.image_url_in} className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer" />
            </a>
          ) : <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-400 tracking-tighter">NO IMAGE</span>
        ) : (
          <div className="max-w-xs text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-3">
            {item.logbook_url || "Deskripsi kosong."}
          </div>
        )}
      </td>
      <td className="p-5">
        <div className="flex flex-col gap-2">
          <StatusBadge label="Dosen" active={activeTab === 'attendance' ? item.is_approve_dosen : item.logbook_approve_dosen} />
          <StatusBadge label="Admin" active={activeTab === 'attendance' ? item.is_approve_admin : item.logbook_approve_admin} />
        </div>
      </td>
      <td className="p-5 text-right">
        {hasUserApproved ? (
          <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">VERIFIED</span>
        ) : (
          <div className="flex justify-end gap-2">
            <button onClick={() => handleAction(item, 'APPROVED')} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-md transition-all">Setuju</button>
            <button onClick={() => handleAction(item, 'REJECTED')} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-md transition-all">Tolak</button>
          </div>
        )}
      </td>
    </tr>
  );
};

// Sub-komponen untuk Kartu Mobile
const MobileCard = ({ item, activeTab, currentAdmin, handleAction }: any) => {
  const isDosen = currentAdmin?.role === 'DOSEN';
  const hasUserApproved = activeTab === 'attendance'
    ? (isDosen ? item.is_approve_dosen : item.is_approve_admin)
    : (isDosen ? item.logbook_approve_dosen : item.logbook_approve_admin);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-black text-slate-900 text-lg leading-tight">{item.profiles?.full_name}</div>
          <div className="text-xs font-bold text-indigo-600 mt-1 uppercase tracking-wide">{item.profiles?.university}</div>
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          {new Date(item.created_at).toLocaleDateString('id-ID')}
        </div>
      </div>

      <div className="flex gap-3">
        {activeTab === 'attendance' && item.image_url_in && (
          <img src={item.image_url_in} className="w-20 h-20 rounded-xl object-cover border-2 border-slate-100" />
        )}
        <div className="flex-1 space-y-2">
           <div className="flex flex-wrap gap-2">
             <StatusBadge label="Dosen" active={activeTab === 'attendance' ? item.is_approve_dosen : item.logbook_approve_dosen} />
             <StatusBadge label="Admin" active={activeTab === 'attendance' ? item.is_approve_admin : item.logbook_approve_admin} />
           </div>
           {activeTab === 'logbook' && (
             <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
               "{item.logbook_url || "Deskripsi kosong."}"
             </div>
           )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100">
        {hasUserApproved ? (
          <div className="w-full text-center py-2 bg-emerald-50 text-emerald-600 text-xs font-black rounded-xl">BERHASIL DIVERIFIKASI ANDA</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleAction(item, 'APPROVED')} className="py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100">Setujui</button>
            <button onClick={() => handleAction(item, 'REJECTED')} className="py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100">Tolak</button>
          </div>
        )}
      </div>
    </div>
  );
};

// UI Reusable Badge Status
const StatusBadge = ({ label, active }: { label: string, active: boolean }) => (
  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border w-fit ${active ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
    <span className="text-[9px] font-black uppercase tracking-tighter">{label}: {active ? 'Selesai' : 'Pending'}</span>
  </div>
);