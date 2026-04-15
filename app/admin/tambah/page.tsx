'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';

export default function AdminAddUser() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dosenList, setDosenList] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'MAHASISWA',
    university: '',
    major: '',
    dosenId: ''
  });

  useEffect(() => {
    fetchDosen();
  }, []);

  const fetchDosen = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'DOSEN')
        .order('full_name', { ascending: true });

      if (error) throw error;
      if (data) setDosenList(data);
    } catch (err) {
      console.error("Fetch dosen error:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (!form.fullName || !form.email || !form.password) {
        throw new Error("Semua field wajib diisi");
      }

      const isMhs = form.role === 'MAHASISWA';

      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName
        })
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.error?.includes("already registered")) {
          throw new Error("Email sudah terdaftar");
        }
        throw new Error(result.error || "Gagal membuat user");
      }

      const userId = result.user.id;
      await new Promise((res) => setTimeout(res, 300));

      let mentorId: string | null = null;
      if (isMhs && form.dosenId) {
        const { data: dosenCheck, error: dosenError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', form.dosenId)
          .eq('role', 'DOSEN')
          .single();

        if (dosenError || !dosenCheck) {
          throw new Error("Dosen tidak valid");
        }
        mentorId = form.dosenId;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: form.fullName,
          role: form.role,
          university: isMhs ? form.university || null : null,
          major: isMhs ? form.major || null : null,
          mentor_id: mentorId
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      alert("User berhasil dibuat!");
      setForm({
        fullName: '', email: '', password: '', role: 'MAHASISWA',
        university: '', major: '', dosenId: ''
      });
      router.push('/admin/users');

    } catch (err: any) {
      console.error("ERROR:", err);
      setErrorMsg(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <style dangerouslySetInnerHTML={{ __html: `
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .span-full {
          grid-column: span 2;
        }
        @media (max-width: 800px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .span-full {
            grid-column: span 1;
          }
          .responsive-container {
            padding-top: 80px !important;
            padding-left: 15px !important;
            padding-right: 15px !important;
          }
        }
      `}} />

      <div style={container} className="responsive-container">
        <div style={card} className="responsive-card">
          <div style={headerSection}>
            <h2 style={title}>Tambah User Baru</h2>
            <p style={subtitle}>Daftarkan akun ke dalam sistem</p>
          </div>

          {errorMsg && <div style={errorBox}>{errorMsg}</div>}

          <form onSubmit={handleSubmit} style={formStyle}>
            <div className="form-grid">
              
              {/* NAMA - Lebar Penuh */}
              <div className="span-full">
                <label style={label}>Nama Lengkap</label>
                <input
                  style={input}
                  placeholder="Masukkan nama lengkap"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              {/* EMAIL */}
              <div>
                <label style={label}>Email</label>
                <input
                  type="email"
                  style={input}
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label style={label}>Password</label>
                <input
                  type="password"
                  style={input}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              {/* ROLE - Lebar Penuh */}
              <div className="span-full">
                <label style={label}>Role Akun</label>
                <select
                  style={input}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="MAHASISWA">Mahasiswa</option>
                  <option value="DOSEN">Dosen</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* KHUSUS MAHASISWA */}
              {form.role === 'MAHASISWA' && (
                <div className="span-full" style={box}>
                  <h4 style={sectionTitle}>Data Akademik Mahasiswa</h4>
                  <div className="form-grid">
                    <div className="span-full">
                      <label style={label}>Dosen Pembimbing</label>
                      <select
                        style={input}
                        value={form.dosenId}
                        onChange={(e) => setForm({ ...form, dosenId: e.target.value })}
                      >
                        <option value="">Pilih Dosen (Opsional)</option>
                        {dosenList.map((d) => (
                          <option key={d.id} value={d.id}>{d.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={label}>Universitas</label>
                      <input
                        style={input}
                        placeholder="Nama Kampus"
                        value={form.university}
                        onChange={(e) => setForm({ ...form, university: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={label}>Jurusan</label>
                      <input
                        style={input}
                        placeholder="Program Studi"
                        value={form.major}
                        onChange={(e) => setForm({ ...form, major: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              disabled={loading} 
              style={button}
            >
              {loading ? 'Sedang Memproses...' : 'Simpan Akun'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* UI STYLE - Konsistensi & Kontras Tinggi */
const container: any = {
  paddingTop: '60px', 
  paddingBottom: '60px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  background: '#f1f5f9', // Warna dasar solid yang bersih
  minHeight: '100vh',
  boxSizing: 'border-box'
};

const card: any = {
  width: '100%',
  maxWidth: '800px', // Sedikit lebih lebar untuk layout 2 kolom
  background: '#ffffff',
  padding: '40px',
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  boxSizing: 'border-box',
  border: '1px solid #e2e8f0'
};

const headerSection: any = {
  borderBottom: '2px solid #f1f5f9',
  marginBottom: '24px',
  paddingBottom: '16px'
};

const title: any = {
  fontSize: '24px',
  fontWeight: '800',
  color: '#0f172a', // Hitam pekat agar kontras
  margin: '0 0 4px 0'
};

const subtitle: any = {
  fontSize: '14px',
  color: '#475569', // Abu gelap agar tetap terbaca jelas
  margin: 0
};

const label: any = {
  fontSize: '13px',
  fontWeight: '700',
  marginBottom: '6px',
  display: 'block',
  color: '#1e293b', // Kontras tinggi terhadap putih
  letterSpacing: '0.01em'
};

const formStyle: any = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const input: any = {
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1.5px solid #cbd5e1',
  width: '100%',
  outline: 'none',
  fontSize: '14px',
  color: '#0f172a',
  background: '#ffffff',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
};

const box: any = {
  padding: '20px',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  background: '#f8fafc', // Background box sedikit berbeda agar ada dimensi
  marginTop: '10px'
};

const sectionTitle: any = {
  fontSize: '14px',
  fontWeight: '800',
  marginBottom: '16px',
  color: '#334155',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const button: any = {
  marginTop: '24px',
  padding: '14px',
  border: 'none',
  background: '#2563eb', // Biru solid
  color: '#ffffff',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
  width: '100%',
  transition: 'background 0.2s'
};

const errorBox: any = {
  background: '#fef2f2',
  color: '#991b1b',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '20px',
  border: '1px solid #fee2e2'
};