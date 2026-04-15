'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setRole(data?.role || null);
      }
      // Memberikan sedikit delay (misal 800ms) agar animasi prisma sempat terlihat dan halus
      setTimeout(() => setLoading(false), 800);
    };
    getRole();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0F172A] flex flex-col items-center justify-center z-50">
        {/* Container Animasi */}
        <div className="flex flex-col items-center gap-4">
          {/* Logo Kepri Kecil (Opsional, agar konsisten) */}
          <img 
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhoQAzqHuGNA1gH5Jo2wYDsglIGOnRsGBr2PHvHgQ2tCjyKzU6wJCypTFU2TcjKd7kdSAF0MQ4-YJVBtjHJWfSUuX96gdIkuna2qZGy_P2AGTBX-XVJByi4rxNLlTMODQDn9ye8OHOWmcU4qFBbsrKLGuNORSLXoXLs_lGmP57uggXcJ0Vbw2KuKw/s1712/Logo%20Provinsi%20Kepulauan%20Riau.png" 
            alt="Logo" 
            className="w-30 h-auto opacity-100 mb-2 animate-pulse"
          />
          
          {/* Animasi Tulisan PRISMA */}
          <h1 className="text-3xl font-black text-white tracking-[0.5em] animate-pulse transition-all">
            PRISMA
          </h1>
          <h2>Dinas Pariwisata Provinsi Kepualauan Riau</h2>
          
          {/* Indikator Loading Bar Minimalis */}
          <div className="w-24 h-[2px] bg-white/10 overflow-hidden relative mt-2">
            <div className="absolute inset-0 bg-indigo-500 animate-[loading_1.5s_infinite] origin-left"></div>
          </div>
        </div>

        {/* CSS Animation (Inline Style untuk kemudahan) */}
        <style jsx>{`
          @keyframes loading {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(1); }
            100% { transform: scaleX(0); transform-origin: right; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar tampil di kiri */}
      <Sidebar role={role || ''} />
      
      {/* Konten halaman tampil di kanan */}
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}