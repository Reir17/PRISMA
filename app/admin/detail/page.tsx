'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function UserDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('id');

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userAttendance, setUserAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profile) setSelectedUser(profile);

    const { data: attendance } = await supabase.from('attendance')
      .select('*')
      .eq('user_id', userId)
      .order('clock_in', { ascending: false });
    
    if (attendance) setUserAttendance(attendance);
    setLoading(false);
  };

  const exportExcel = (type: 'absensi' | 'logbook') => {
    const fileName = `${type === 'absensi' ? 'Absensi' : 'Logbook'}_${selectedUser?.full_name}`;
    let dataToExport = [];

    if (type === 'absensi') {
      dataToExport = userAttendance.map(a => ({
        Tanggal: new Date(a.clock_in).toLocaleDateString('id-ID'),
        'Jam Masuk': new Date(a.clock_in).toLocaleTimeString('id-ID'),
        'Jam Pulang': a.clock_out ? new Date(a.clock_out).toLocaleTimeString('id-ID') : '-',
        Status: a.status || 'Hadir'
      }));
    } else {
      dataToExport = userAttendance.map(a => ({
        Tanggal: new Date(a.clock_in).toLocaleDateString('id-ID'),
        Aktivitas: a.notes || a.activity || '-',
        'ACC Dosen': a.is_approved_dosen ? 'SUDAH' : 'BELUM',
        'ACC Admin': a.is_approved_admin ? 'SUDAH' : 'BELUM'
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const handleExportPDF = (type: 'absensi' | 'logbook') => {
    const doc = new jsPDF();
    const title = `${type === 'absensi' ? 'LAPORAN ABSENSI' : 'LOGBOOK AKTIVITAS'}: ${selectedUser?.full_name?.toUpperCase()}`;
    doc.setFontSize(14);
    doc.text(title, 14, 15);

    const head = type === 'absensi' 
      ? [['Tanggal', 'Masuk', 'Pulang', 'Status']] 
      : [['Tanggal', 'Aktivitas / Tugas', 'Dosen', 'Admin']];

    const body = userAttendance.map(a => 
      type === 'absensi' 
        ? [
            new Date(a.clock_in).toLocaleDateString('id-ID'),
            new Date(a.clock_in).toLocaleTimeString('id-ID'),
            a.clock_out ? new Date(a.clock_out).toLocaleTimeString('id-ID') : '-',
            a.status || 'Hadir'
          ]
        : [
            new Date(a.clock_in).toLocaleDateString('id-ID'),
            a.notes || a.activity || '-',
            a.is_approved_dosen ? 'Sudah' : 'Belum',
            a.is_approved_admin ? 'Sudah' : 'Belum'
          ]
    );

    autoTable(doc, {
      head: head,
      body: body,
      startY: 25,
      headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save(`${type}_${selectedUser?.full_name}.pdf`);
  };

  if (loading) return <div className="p-20 text-center font-black text-slate-800 animate-pulse">MEMUAT DATA...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 pt-24 md:pt-8">
      
      {/* Header Section Responsif */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-8">
        <div className="flex-1">
          <button onClick={() => router.back()} className="text-slate-500 font-extrabold text-sm hover:text-slate-800 transition-colors">
            ← Kembali ke Daftar
          </button>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            Profil & Aktivitas Pengguna
          </h2>
        </div>
        
        {/* Tombol Export - Menjadi Grid di Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
          <ExportControl 
            label="LAPORAN ABSENSI" 
            onPdf={() => handleExportPDF('absensi')} 
            onExcel={() => exportExcel('absensi')} 
          />
          <ExportControl 
            label="LOGBOOK HARIAN" 
            onPdf={() => handleExportPDF('logbook')} 
            onExcel={() => exportExcel('logbook')} 
          />
        </div>
      </div>

      {/* Main Layout: Stacked di mobile, 2-column di desktop */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Info Pengguna */}
        <div className="w-full lg:w-[350px] shrink-0">
          <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-sm overflow-hidden sticky top-24 lg:top-8">
            <div className="p-8 bg-slate-800 text-white text-center">
               <div className="w-16 h-16 bg-white text-slate-900 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                 {selectedUser?.full_name?.charAt(0)}
               </div>
               <h3 className="mt-4 text-xl font-bold truncate px-2">{selectedUser?.full_name}</h3>
               <span className="inline-block mt-2 px-3 py-1 bg-slate-700 rounded-full text-[10px] font-bold tracking-widest uppercase italic">
                 {selectedUser?.role}
               </span>
            </div>
            <div className="p-6 space-y-4">
              <InfoRow label="EMAIL" value={selectedUser?.email} />
              <InfoRow label="INSTANSI" value={selectedUser?.university || '-'} />
              <InfoRow label="JURUSAN" value={selectedUser?.major || '-'} />
              
              <div className="mt-6 p-5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Kehadiran</div>
                  <div className="text-4xl font-black text-slate-900">{userAttendance.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Tabel - Scrollable di Mobile */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          {/* TABEL 1: ABSENSI */}
          <TableCard title="RIWAYAT KEHADIRAN (ABSENSI)">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-900">
                  <th className={thClass}>TANGGAL</th>
                  <th className={thClass}>MASUK</th>
                  <th className={thClass}>PULANG</th>
                  <th className={thClass}>STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userAttendance.map((att, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className={tdClass}>{new Date(att.clock_in).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</td>
                    <td className={tdClass + " font-bold"}>{new Date(att.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className={tdClass}>{att.clock_out ? new Date(att.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                    <td className={tdClass}>
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-black border border-emerald-100 uppercase">
                        {att.status || 'Hadir'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

          {/* TABEL 2: LOGBOOK */}
          <TableCard title="LOGBOOK AKTIVITAS & PEKERJAAN">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-900">
                  <th className={thClass + " w-32"}>TANGGAL</th>
                  <th className={thClass}>AKTIVITAS</th>
                  <th className={thClass + " text-center"}>DOSEN</th>
                  <th className={thClass + " text-center"}>ADMIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userAttendance.map((att, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className={tdClass}>{new Date(att.clock_in).toLocaleDateString('id-ID')}</td>
                    <td className={tdClass + " leading-relaxed text-slate-600 font-medium"}>
                      {att.notes || att.activity || 'Tidak ada catatan.'}
                    </td>
                    <td className={tdClass + " text-center"}>
                      <StatusBadge active={att.is_approved_dosen} />
                    </td>
                    <td className={tdClass + " text-center"}>
                      <StatusBadge active={att.is_approved_admin} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>

        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS UNTUK KEBERSIHAN KODE ---

function ExportControl({ label, onPdf, onExcel }: any) {
  return (
    <div className="bg-white border-2 border-slate-900 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
      <div className="text-[10px] font-black text-slate-400 text-center border-b border-slate-50 pb-1">{label}</div>
      <div className="flex gap-2">
        <button onClick={onPdf} className="flex-1 bg-rose-700 hover:bg-rose-800 text-white py-1.5 rounded-lg text-[10px] font-black transition-colors">PDF</button>
        <button onClick={onExcel} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-1.5 rounded-lg text-[10px] font-black transition-colors">EXCEL</button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: any) {
  return (
    <div className="border-b border-slate-50 pb-3 last:border-0">
      <label className="text-[10px] font-black text-slate-400 block mb-1 tracking-widest">{label}</label>
      <div className="text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

function TableCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-slate-800 text-white font-black text-xs tracking-widest uppercase">
        {title}
      </div>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black border transition-all ${
      active 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      : 'bg-rose-50 text-rose-700 border-rose-200'
    }`}>
      {active ? 'SUDAH' : 'BELUM'}
    </span>
  );
}

const thClass = "p-4 text-[11px] font-black text-slate-900 uppercase tracking-wider";
const tdClass = "p-4 text-sm text-slate-800 align-top";

export default function UserDetailPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-20 text-center font-bold">Loading Component...</div>}>
        <UserDetailContent />
      </Suspense>
    </DashboardLayout>
  );
}