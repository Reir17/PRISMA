'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Menutup sidebar otomatis jika ukuran layar berubah ke desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    const confirmLogout = confirm("Apakah anda yakin ingin keluar?");
    if (confirmLogout) {
      await supabase.auth.signOut();
      // Menggunakan router atau window.location
      window.location.href = '/login';
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* 1. Mobile Header - Memberikan space agar konten tidak tertutup tombol */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0F172A] z-40 flex items-center px-4 shadow-lg">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle Menu"
        >
          {isOpen ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
          )}
        </button>
        <span className="ml-4 text-white font-black tracking-widest text-sm uppercase italic">Prisma</span>
      </div>

      {/* 2. Overlay - Menggunakan transition opacity */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* 3. Main Sidebar Navigation */}
      <nav className={`
        fixed md:sticky top-0 left-0 z-[50]
        w-72 md:w-64 bg-[#0F172A] h-screen flex flex-col font-sans shadow-2xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Branding Section */}
        <div className="p-8 pb-10 mt-4 md:mt-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <img 
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhoQAzqHuGNA1gH5Jo2wYDsglIGOnRsGBr2PHvHgQ2tCjyKzU6wJCypTFU2TcjKd7kdSAF0MQ4-YJVBtjHJWfSUuX96gdIkuna2qZGy_P2AGTBX-XVJByi4rxNLlTMODQDn9ye8OHOWmcU4qFBbsrKLGuNORSLXoXLs_lGmP57uggXcJ0Vbw2KuKw/s1712/Logo%20Provinsi%20Kepulauan%20Riau.png" 
                alt="Logo Kepri" 
                className="w-8 h-auto"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white tracking-[0.2em] leading-tight uppercase">PRISMA</span>
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.1em] mt-1 leading-relaxed">
                Dinas Pariwisata <br></br>Provinsi Kepulauan Riau
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-6 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <MenuLink 
              href={`/${role.toLowerCase()}/dashboard`} 
              active={isActive(`/${role.toLowerCase()}/dashboard`)}
              label="Dashboard Overview" 
              onClick={() => setIsOpen(false)}
            />
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] pl-4">
              Main Menu
            </p>
            <div className="space-y-1">
              {role === 'ADMIN' && (
                <>
                  <MenuLink href="/admin/users" active={isActive('/admin/users')} label="Data Pegawai" onClick={() => setIsOpen(false)} />
                  <MenuLink href="/admin/approval" active={isActive('/admin/approval')} label="Laporan Harian" onClick={() => setIsOpen(false)} />
                  <MenuLink href="/admin/settings" active={isActive('/admin/settings')} label="Pengaturan" onClick={() => setIsOpen(false)} />
                </>
              )}

              {role === 'DOSEN' && (
                <>
                  <MenuLink href="/dosen/approval" active={isActive('/dosen/approval')} label="Verifikasi Absen" onClick={() => setIsOpen(false)} />
                  <MenuLink href="/dosen/mahasiswa" active={isActive('/dosen/mahasiswa')} label="Daftar Binaan" onClick={() => setIsOpen(false)} />
                  <MenuLink href="/dosen/profile" active={isActive('/dosen/profile')} label="Profil Saya" onClick={() => setIsOpen(false)} />
                </>
              )}

              {role === 'MAHASISWA' && (
                <>
                  <MenuLink href="/mahasiswa/absen" active={isActive('/mahasiswa/absen')} label="Presensi Wajah" onClick={() => setIsOpen(false)} />
                  <MenuLink href="/mahasiswa/logbook" active={isActive('/mahasiswa/logbook')} label="Logbook Harian" onClick={() => setIsOpen(false)} />
                  <MenuLink href="/mahasiswa/riwayat" active={isActive('/mahasiswa/riwayat')} label="Riwayat" onClick={() => setIsOpen(false)} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Status & Logout */}
        <div className="p-6 bg-black/20 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{role} Account</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-5 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all duration-300 group"
          >
            <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </nav>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </>
  );
}

function MenuLink({ href, active, label, onClick }: { href: string; active: boolean; label: string; onClick?: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`relative flex items-center px-5 py-4 text-[13px] rounded-2xl transition-all duration-300 group ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={`tracking-wide ${active ? 'translate-x-0' : 'group-hover:translate-x-1'} transition-transform duration-300`}>
        {label}
      </span>
      {active && (
        <span className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full" />
      )}
    </Link>
  );
}