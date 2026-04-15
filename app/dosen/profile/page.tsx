'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

export default function DosenProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = confirm("Apakah Anda yakin ingin keluar?");
    if (confirmLogout) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '30px' }}>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>Identitas Pembimbing</h2>
          <p style={{ color: '#475569', marginTop: '5px', fontWeight: '500' }}>Kelola informasi akun dan profil profesional Anda.</p>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', fontWeight: 'bold' }}>Memuat profil...</div>
        ) : (
          <div style={profileCard}>
            {/* Header Profil dengan Avatar Inisial */}
            <div style={profileHeader}>
              <div style={avatarCircle}>
                {profile?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ marginLeft: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{profile?.full_name}</h3>
                <span style={badgeDosen}>DOSEN PEMBIMBING</span>
              </div>
            </div>

            <div style={infoGrid}>
              <div style={infoItem}>
                <label style={infoLabel}>NIP / Nomor Identitas</label>
                <div style={infoValue}>{profile?.nim_nip || '-'}</div>
              </div>
              
              <div style={infoItem}>
                <label style={infoLabel}>Alamat Email</label>
                <div style={infoValue}>{profile?.email}</div>
              </div>

              <div style={infoItem}>
                <label style={infoLabel}>Instansi / Universitas</label>
                <div style={infoValue}>{profile?.university || '-'}</div>
              </div>

              <div style={infoItem}>
                <label style={infoLabel}>Fakultas / Departemen</label>
                <div style={infoValue}>{profile?.major || '-'}</div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '2px solid #f1f5f9', margin: '30px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleLogout} style={btnLogout}>
                🚪 Keluar dari Sistem
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// --- STYLES ---
const profileCard = {
  backgroundColor: 'white',
  padding: '40px',
  borderRadius: '20px',
  border: '2px solid #e2e8f0',
  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
};

const profileHeader = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '40px',
  backgroundColor: '#f8fafc',
  padding: '20px',
  borderRadius: '16px',
  border: '1px solid #e2e8f0'
};

const avatarCircle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: '#0f172a',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '32px',
  fontWeight: '900',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

const badgeDosen = {
  display: 'inline-block',
  marginTop: '5px',
  padding: '4px 12px',
  backgroundColor: '#e0e7ff',
  color: '#4338ca',
  fontSize: '11px',
  fontWeight: '800',
  borderRadius: '6px',
  letterSpacing: '0.5px'
};

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '25px'
};

const infoItem = {
  display: 'flex',
  flexDirection: 'column' as 'column',
  gap: '8px'
};

const infoLabel = {
  fontSize: '12px',
  fontWeight: '800',
  color: '#64748b',
  textTransform: 'uppercase' as 'uppercase',
  letterSpacing: '1px'
};

const infoValue = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#0f172a',
  padding: '12px 16px',
  backgroundColor: '#f1f5f9',
  borderRadius: '10px',
  border: '1px solid #e2e8f0'
};

const btnLogout = {
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: '800',
  fontSize: '14px',
  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)',
  transition: 'transform 0.1s'
};