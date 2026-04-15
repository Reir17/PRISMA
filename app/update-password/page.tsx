'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const router = useRouter();

  // Cek apakah user datang dari link reset password yang valid
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ 
          type: 'error', 
          text: 'Sesi tidak ditemukan atau kedaluwarsa. Silakan minta reset password kembali.' 
        });
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert("Konfirmasi password tidak cocok!");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password berhasil diperbarui! Mengalihkan ke halaman login...' });
      
      // Tunggu 2 detik lalu pindah ke login
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ color: '#1a73e8', marginBottom: '10px' }}>Update Password</h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '25px' }}>
          Masukkan password baru Anda untuk mengamankan akun.
        </p>

        {message.text && (
          <div style={{ 
            padding: '10px', 
            borderRadius: '6px', 
            marginBottom: '15px', 
            fontSize: '13px',
            backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: message.type === 'error' ? '#b91c1c' : '#15803d'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword}>
          <label style={labelStyle}>Password Baru</label>
          <input 
            type="password" 
            placeholder="Min. 6 karakter" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Konfirmasi Password Baru</label>
          <input 
            type="password" 
            placeholder="Ulangi password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            required
          />

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Memperbarui...' : 'SIMPAN PASSWORD BARU'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- STYLES ---
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#f0f2f5',
  fontFamily: 'sans-serif'
};

const cardStyle = {
  padding: '40px',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  width: '100%',
  maxWidth: '400px',
  textAlign: 'center' as const
};

const labelStyle = {
  display: 'block',
  textAlign: 'left' as const,
  fontSize: '13px',
  fontWeight: 'bold' as const,
  color: '#444',
  marginBottom: '5px'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '20px',
  borderRadius: '6px',
  border: '1px solid #ddd',
  boxSizing: 'border-box' as const
};

const buttonStyle = {
  width: '100%',
  padding: '14px',
  backgroundColor: '#1a73e8',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold' as const,
  fontSize: '15px'
};