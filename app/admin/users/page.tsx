'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function AdminUsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterUni, setFilterUni] = useState('');
  const [filterMajor, setFilterMajor] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users.filter(u => {
      const matchSearch = (
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchRole = (filterRole === '' || u.role === filterRole);
      const matchUni = (u.university?.toLowerCase() || "").includes(filterUni.toLowerCase());
      const matchMajor = (u.major?.toLowerCase() || "").includes(filterMajor.toLowerCase());

      return matchSearch && matchRole && matchUni && matchMajor;
    });
    setFilteredUsers(result);
  }, [searchTerm, filterRole, filterUni, filterMajor, users]);

  const fetchUsers = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setUsers(data);
    setLoadingList(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    const isConfirmed = confirm(`Apakah Anda yakin ingin menghapus ${name}?`);
    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      alert(`Profil ${name} berhasil dihapus.`);
      fetchUsers();
    } catch (error: any) {
      alert("Gagal menghapus: " + error.message);
    }
  };

  return (
    <DashboardLayout>
      {/* Container utama dengan padding responsif */}
      <div className="min-h-screen bg-[#f1f5f9] pt-24 p-4 md:pt-8 md:p-8">
        
        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-[900] text-[#0f172a] tracking-tight">
            Data Pengguna PRISMA
          </h2>
          <p className="text-[#334155] font-semibold text-sm">
            Manajemen akun mahasiswa magang, dosen, dan administrator.
          </p>
        </div>

        {/* Tab Navigation - Scrollable on Mobile */}
        <div className="flex overflow-x-auto pb-2 mb-6 no-scrollbar">
          <div className="flex gap-2 p-1.5 bg-[#334155] rounded-[14px] shrink-0">
            <Link href="/admin/users" className="px-6 py-2.5 bg-white text-[#0f172a] rounded-[10px] text-xs font-[800] shadow-md whitespace-nowrap">
              Semua Pengguna
            </Link>
            <Link href="/admin/tambah" className="px-6 py-2.5 text-[#cbd5e1] rounded-[10px] text-xs font-[800] hover:text-white transition-all whitespace-nowrap">
              + Tambah Baru
            </Link>
          </div>
        </div>

        {/* Filter Box - Grid system */}
        <div className="bg-white p-6 rounded-[16px] border-2 border-[#334155] shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FilterItem label="Cari Pengguna">
              <input 
                placeholder="Nama atau email..." value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-semibold transition-all"
              />
            </FilterItem>

            <FilterItem label="Filter Role">
              <select 
                value={filterRole} onChange={e => setFilterRole(e.target.value)} 
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-semibold transition-all"
              >
                <option value="">Semua Role</option>
                <option value="MAHASISWA">MAHASISWA</option>
                <option value="DOSEN">DOSEN</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </FilterItem>

            <FilterItem label="Universitas">
              <input 
                placeholder="Cari Kampus..." value={filterUni} 
                onChange={e => setFilterUni(e.target.value)} 
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-semibold transition-all"
              />
            </FilterItem>

            <FilterItem label="Jurusan">
              <input 
                placeholder="Cari Jurusan..." value={filterMajor} 
                onChange={e => setFilterMajor(e.target.value)} 
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-semibold transition-all"
              />
            </FilterItem>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-[16px] border-2 border-[#334155] shadow-sm overflow-hidden">
          
          {/* DESKTOP TABLE VIEW (Visible on Large Screens) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#1e293b]">
                  <th className="p-5 text-[#f8fafc] text-[11px] font-[900] text-left uppercase tracking-wider">Pengguna</th>
                  <th className="p-5 text-[#f8fafc] text-[11px] font-[900] text-left uppercase tracking-wider">Role</th>
                  <th className="p-5 text-[#f8fafc] text-[11px] font-[900] text-left uppercase tracking-wider">Instansi</th>
                  <th className="p-5 text-[#f8fafc] text-[11px] font-[900] text-right uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingList ? <FullRowLoading /> : filteredUsers.length === 0 ? <FullRowEmpty /> :
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5">
                        <Link href={`/admin/detail?id=${u.id}`} className="block group">
                          <div className="font-[800] text-[#0f172a] group-hover:text-indigo-600 transition-colors">{u.full_name}</div>
                          <div className="text-[12px] text-[#475569] font-[500]">{u.email}</div>
                        </Link>
                      </td>
                      <td className="p-5">
                        <span className="bg-[#334155] text-[#f8fafc] px-3 py-1 rounded-[6px] text-[11px] font-[800]">{u.role}</span>
                      </td>
                      <td className="p-5 text-[#1e293b] text-sm font-[500]">{u.university || '-'}</td>
                      <td className="p-5 text-right">
                        <button onClick={() => handleDelete(u.id, u.full_name)} className="bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-rose-600 hover:text-white transition-all">
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW (Visible on Small Screens) */}
          <div className="lg:hidden divide-y divide-slate-100">
            {loadingList ? <div className="p-10 text-center font-black text-slate-400">MEMUAT...</div> :
             filteredUsers.length === 0 ? <div className="p-10 text-center font-bold text-slate-500 italic">Tidak ada data.</div> :
             filteredUsers.map((u) => (
              <div key={u.id} className="p-5 space-y-4">
                <Link href={`/admin/detail?id=${u.id}`} className="block">
                  <div className="font-[800] text-lg text-[#0f172a]">{u.full_name}</div>
                  <div className="text-xs text-[#475569]">{u.email}</div>
                </Link>
                <div className="flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="w-fit bg-[#334155] text-[#f8fafc] px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter">
                      {u.role}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 italic truncate max-w-[150px]">
                      {u.university || '-'}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(u.id, u.full_name)} className="p-2.5 px-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase">
                    Hapus Akun
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Helper Components
function FilterItem({ label, children }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-[900] text-[#1e293b] uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );
}

function FullRowLoading() {
  return <tr><td colSpan={4} className="p-20 text-center font-black text-[#1e293b] animate-pulse uppercase tracking-widest">Memuat Data...</td></tr>;
}

function FullRowEmpty() {
  return <tr><td colSpan={4} className="p-20 text-center font-bold text-slate-400 italic">Tidak ada pengguna ditemukan.</td></tr>;
}