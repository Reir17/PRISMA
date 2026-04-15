'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function DosenMonitoring() {
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');
  const [currentDosenId, setCurrentDosenId] = useState<string | null>(null);

  // --- DATA STATES ---
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // --- DETAIL & HISTORY STATES ---
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');

  // --- FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentDosenId(user.id);
        fetchMyStudents(user.id);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    let result = [...users];
    if (searchTerm) {
      result = result.filter(u => 
        (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredUsers(result);
  }, [searchTerm, users]);

  const fetchMyStudents = async (dosenId: string) => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('mentor_id', dosenId)
      .eq('role', 'MAHASISWA')
      .order('full_name', { ascending: true });

    if (!error) {
      setUsers(data || []);
      setFilteredUsers(data || []);
    }
    setLoadingList(false);
  };

  const viewUserDetail = async (user: any) => {
    setSelectedUser(user);
    setActiveTab('detail');
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .order('clock_in', { ascending: false });
    
    if (!error) setHistoryData(data || []);
    setLoadingHistory(false);
  };

  const handleApprove = async (attendanceId: string) => {
    const confirmApprove = confirm("Setujui kehadiran dan logbook ini?");
    if (!confirmApprove) return;

    const { error } = await supabase
      .from('attendance')
      .update({ 
        is_approve_dosen: true,
        logbook_approve_dosen: true 
      })
      .eq('id', attendanceId);
    
    if (!error) {
      setHistoryData(prev => prev.map(h => h.id === attendanceId ? {...h, is_approve_dosen: true, logbook_approve_dosen: true} : h));
    }
  };

  const filteredHistory = historyData.filter(h => 
    (h.logbook_url?.toLowerCase().includes(searchHistory.toLowerCase())) ||
    (new Date(h.clock_in).toLocaleDateString('id-ID').includes(searchHistory))
  );

  // --- EXPORT TOOLS ---
  const downloadExcel = () => {
    const dataToExport = filteredHistory.map(h => ({
      'Tanggal': new Date(h.clock_in).toLocaleDateString('id-ID'),
      'Jam Masuk': new Date(h.clock_in).toLocaleTimeString(),
      'Jam Keluar': h.clock_out ? new Date(h.clock_out).toLocaleTimeString() : '-',
      'Isi Logbook': h.logbook_url || '-',
      'Status Verifikasi': h.is_approve_dosen ? 'Disetujui' : 'Pending'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `LOGBOOK_${selectedUser.full_name.toUpperCase()}.xlsx`);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`LAPORAN AKTIVITAS MAHASISWA`, 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Nama Mahasiswa : ${selectedUser.full_name}`, 14, 30);
    doc.text(`Instansi : ${selectedUser.university}`, 14, 35);

    const tableData = filteredHistory.map(h => [
      new Date(h.clock_in).toLocaleDateString('id-ID'),
      `${new Date(h.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      h.logbook_url || '-',
      h.is_approve_dosen ? 'VERIFIED' : 'PENDING'
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Tanggal', 'Waktu', 'Kegiatan', 'Status']],
      body: tableData,
    });

    doc.save(`LAPORAN_${selectedUser.full_name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
        <header className="mb-8 pt-16 md:pt-0">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">👨‍🏫 Monitoring Bimbingan</h1>
          <p className="text-slate-500 mt-2 font-medium">Pantau perkembangan dan unduh laporan mahasiswa bimbingan Anda.</p>
        </header>

        {activeTab === 'list' ? (
          <div className="space-y-6">
            {/* Filter Search */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cari nama atau email mahasiswa..." 
                className="w-full p-4 pl-12 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-900 font-semibold bg-white"
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            </div>

            {loadingList ? (
              <div className="text-center py-20 font-bold text-slate-400">Memuat data mahasiswa...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                  <div key={u.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="mb-4">
                      <div className="text-lg font-bold text-slate-900 leading-tight">{u.full_name}</div>
                      <div className="text-xs text-slate-500 font-medium">{u.email}</div>
                    </div>
                    <div className="mb-6 space-y-1">
                      <div className="text-sm font-bold text-slate-700 bg-slate-50 p-2 rounded-lg">{u.university}</div>
                      <div className="text-xs text-slate-500 pl-2">{u.major}</div>
                    </div>
                    <button 
                      onClick={() => viewUserDetail(u)} 
                      className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors"
                    >
                      Lihat Aktivitas
                    </button>
                  </div>
                )) : (
                  <div className="col-span-full bg-white p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">
                    Mahasiswa tidak ditemukan.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* TAB DETAIL */
          <div className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <button onClick={() => setActiveTab('list')} className="text-indigo-600 font-bold text-sm flex items-center gap-2 hover:underline">
                    ← Kembali ke Daftar
                  </button>
                  <h3 className="text-2xl font-black text-slate-900">{selectedUser?.full_name}</h3>
                  <p className="text-slate-500 font-semibold">{selectedUser?.university} — {selectedUser?.major}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={downloadPDF} className="flex-1 md:flex-none bg-rose-600 text-white px-6 py-3 rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-rose-200">📕 PDF</button>
                  <button onClick={downloadExcel} className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-emerald-200">📊 Excel</button>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 md:p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
              <input 
                type="text" 
                placeholder="Filter riwayat (tanggal/kegiatan)..." 
                className="w-full mb-6 p-4 rounded-xl border-2 border-slate-50 bg-slate-50 outline-none focus:bg-white focus:border-indigo-500 transition-all text-slate-900 font-semibold"
                value={searchHistory}
                onChange={e => setSearchHistory(e.target.value)}
              />

              {loadingHistory ? (
                <div className="text-center py-20 font-bold text-slate-400">Memuat riwayat...</div>
              ) : (
                <div className="space-y-4">
                  {/* Card Style for Mobile, Table for Desktop */}
                  <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full border-collapse">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                        <tr>
                          <th className="p-4 text-left">Tanggal</th>
                          <th className="p-4 text-left">Waktu</th>
                          <th className="p-4 text-left">Logbook</th>
                          <th className="p-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredHistory.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-bold text-slate-900 text-sm">
                              {new Date(h.clock_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="p-4 text-xs font-semibold text-slate-600">
                              {new Date(h.clock_in).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {h.clock_out ? new Date(h.clock_out).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}
                            </td>
                            <td className="p-4">
                              <div className="text-xs text-slate-600 line-clamp-2 max-w-xs italic">{h.logbook_url || 'Kosong'}</div>
                            </td>
                            <td className="p-4 text-center">
                               {h.is_approve_dosen ? (
                                 <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 tracking-tighter">✅ VERIFIED</span>
                               ) : (
                                 <button onClick={() => handleApprove(h.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-colors">Verifikasi</button>
                               )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View Card */}
                  <div className="md:hidden space-y-4">
                    {filteredHistory.map((h) => (
                      <div key={h.id} className="p-5 border-2 border-slate-50 rounded-2xl bg-white space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-slate-900">{new Date(h.clock_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                          {h.is_approve_dosen ? (
                            <span className="text-[10px] font-black text-emerald-600">✅ DISREJUTUI</span>
                          ) : (
                            <button onClick={() => handleApprove(h.id)} className="text-[10px] font-black text-indigo-600 underline">VERIFIKASI</button>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg italic">
                          {h.logbook_url || "Belum ada catatan logbook."}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}