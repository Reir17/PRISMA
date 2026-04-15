'use client';
import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';

export default function AbsensiMahasiswa() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Menginisialisasi AI...');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setStatus('Sistem Siap. Silakan buka kamera.');
      } catch (err) {
        setStatus('Gagal memuat model AI.');
      }
    };
    loadModels();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current) return reject("Video tidak aktif");
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Gagal context canvas");
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject("Gagal konversi blob");
      }, 'image/jpeg', 0.8);
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleAbsen = async (type: 'IN' | 'OUT') => {
    if (isUploading) return;
    setIsUploading(true);
    setStatus('Validasi Lokasi...');

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Sesi berakhir.");
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Ambil sesi aktif
        const { data: activeSession } = await supabase
          .from('attendance')
          .select('id, clock_in')
          .eq('user_id', user.id)
          .is('clock_out', null)
          .order('clock_in', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Validasi Alur Absensi (Strict)
        if (type === 'IN') {
          if (activeSession) {
            const sessionDate = new Date(activeSession.clock_in).toISOString().split('T')[0];
            if (sessionDate === todayStr) throw new Error("Anda sudah melakukan Clock In hari ini.");
          }
        } else {
          if (!activeSession) throw new Error("Anda belum melakukan Clock In.");
          const sessionDate = new Date(activeSession.clock_in).toISOString().split('T')[0];
          if (sessionDate !== todayStr) throw new Error("Sesi Clock In sudah kadaluwarsa (berbeda hari).");
        }

        // Validasi Radius
        const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
        if (settings && !settings.is_wfa) {
          const distance = calculateDistance(latitude, longitude, settings.office_lat, settings.office_lng);
          if (distance > settings.radius_meter) throw new Error(`Di luar jangkauan (${Math.round(distance)}m).`);
        }

        // Verifikasi Wajah
        setStatus('Verifikasi Wajah...');
        if (!videoRef.current) return;
        const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
        if (!detection) throw new Error("Wajah tidak terdeteksi! Pastikan wajah terlihat jelas.");

        const { data: profile } = await supabase.from('profiles').select('face_embedding').eq('id', user.id).single();
        if (!profile?.face_embedding) throw new Error("Data wajah Anda belum terdaftar di sistem.");

        const matchDistance = faceapi.euclideanDistance(detection.descriptor, new Float32Array(profile.face_embedding));
        if (matchDistance > 0.45) throw new Error("Wajah tidak cocok. Gunakan wajah asli.");

        // Validasi Jam Kerja (Clock Out minimal setelah 8 jam)
        if (type === 'OUT' && activeSession) {
          const diffHours = (now.getTime() - new Date(activeSession.clock_in).getTime()) / (1000 * 60 * 60);
          if (diffHours < 8) throw new Error(`Belum mencapai 8 jam kerja. (Baru ${diffHours.toFixed(1)} jam)`);
        }

        setStatus('Mengunggah...');
        const imageBlob = await captureImage();
        const fileName = `${type}_${user.id}_${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from('attendance_photos').upload(fileName, imageBlob);
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage.from('attendance_photos').getPublicUrl(fileName);

        if (type === 'IN') {
          await supabase.from('attendance').insert({
            user_id: user.id, clock_in: now.toISOString(), lat_in: latitude, long_in: longitude,
            image_url_in: publicUrl, status: 'PENDING', is_approve_dosen: false, is_approve_admin: false
          });
        } else {
          await supabase.from('attendance').update({
            clock_out: now.toISOString(), lat_out: latitude, long_out: longitude, image_url_out: publicUrl,
          }).eq('id', activeSession?.id);
        }

        alert(`Presensi ${type} Berhasil!`);
        setStatus(`Presensi Berhasil`);
      } catch (err: any) {
        alert(err.message);
        setStatus('Gagal: ' + err.message);
      } finally {
        setIsUploading(false);
      }
    }, () => {
      alert("Izin lokasi diperlukan untuk presensi.");
      setIsUploading(false);
    }, { enableHighAccuracy: true });
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 1280 } } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOpen(true);
      setStatus('Kamera Aktif.');
    } catch (err) {
      alert("Gagal akses kamera.");
    }
  };

  return (
    <DashboardLayout>
      {/* Tambahkan pt-24 agar tidak tertutup header mobile */}
      <div className="min-h-screen bg-slate-50 px-4 pt-24 pb-12 md:pt-12 md:px-8">
        <div className="max-w-md mx-auto">
          
          <header className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Presensi Digital</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">Verifikasi lokasi & wajah secara realtime</p>
          </header>

          {/* Status Panel */}
          <div className={`mb-6 p-4 rounded-2xl border text-center shadow-sm transition-all duration-300 ${
            isUploading ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-1 opacity-60">
              {isUploading ? 'Sedang Memproses' : 'Status Sistem'}
            </span>
            <p className="text-sm font-bold truncate px-2">{status}</p>
          </div>

          {/* Viewport Kamera */}
          <div className="relative aspect-[3/4] bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white ring-1 ring-slate-200">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline
              className="w-full h-full object-cover scale-x-[-1]" 
            />
            
            {/* Guide Mask */}
            {isCameraOpen && !isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[75%] h-[70%] border-2 border-white/40 rounded-[4rem] border-dashed ring-[1000px] ring-black/40"></div>
                <div className="absolute bottom-10 text-white/80 text-[10px] font-medium bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm">
                  Posisikan wajah di dalam area kotak
                </div>
              </div>
            )}

            {/* Uploading State */}
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-indigo-400 rounded-full animate-pulse"></div>
                </div>
                <p className="mt-4 text-indigo-950 font-black text-xs uppercase tracking-widest">Memproses Presensi...</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-8">
            {!isCameraOpen ? (
              <button 
                onClick={startVideo}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-[0.98]"
              >
                Aktifkan Kamera
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  disabled={isUploading}
                  onClick={() => handleAbsen('IN')}
                  className="group relative overflow-hidden py-5 bg-emerald-600 disabled:bg-slate-300 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-[0.95]"
                >
                  <span className="relative z-10">Clock IN</span>
                </button>
                <button 
                  disabled={isUploading}
                  onClick={() => handleAbsen('OUT')}
                  className="py-5 bg-rose-600 disabled:bg-slate-300 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-100 transition-all hover:bg-rose-700 active:scale-[0.95]"
                >
                  Clock OUT
                </button>
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-[10px] text-slate-400 font-medium px-4">
            Pastikan Anda berada di area kantor dan menggunakan pencahayaan yang cukup untuk verifikasi wajah.
          </p>

        </div>
      </div>
    </DashboardLayout>
  );
}