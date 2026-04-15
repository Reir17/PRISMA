'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import * as faceapi from 'face-api.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Login, 2: Face Scan
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [userData, setUserData] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  // Load Face API Models on Mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        console.log("Models Loaded Successfully");
      } catch (err) {
        console.error("Gagal memuat model face-api", err);
      }
    };
    loadModels();

    // Cleanup kamera saat tab ditutup atau komponen hancur
    return () => stopVideo();
  }, []);

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('Sistem Siap');
    } catch (err) {
      alert("Gagal akses kamera. Pastikan izin kamera diberikan.");
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email, password,
      });

      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) throw new Error("Profil tidak ditemukan.");

      setUserData(profile);
      setIsNewUser(!profile.face_embedding);
      setStep(2);
      
      // Berikan delay sedikit sebelum menyalakan kamera agar transisi smooth
      setTimeout(() => startVideo(), 500);
    } catch (err: any) {
      alert("Login gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const processFace = async () => {
    if (!videoRef.current) return;
    setLoading(true);
    setStatus(isNewUser ? 'Mendaftarkan wajah...' : 'Memverifikasi...');

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        alert("Wajah tidak terdeteksi. Pastikan wajah terlihat jelas dan pencahayaan cukup.");
        setLoading(false);
        return;
      }

      const currentDescriptor = Array.from(detection.descriptor);

      if (isNewUser) {
        const { error } = await supabase
          .from('profiles')
          .update({ face_embedding: currentDescriptor })
          .eq('id', userData.id);

        if (error) throw error;
        stopVideo();
        redirectUser(userData.role);
      } else {
        const savedDescriptor = new Float32Array(userData.face_embedding);
        const distance = faceapi.euclideanDistance(detection.descriptor, savedDescriptor);

        if (distance < 0.5) { // Threshold 0.5 adalah standar face-api
          stopVideo();
          redirectUser(userData.role);
        } else {
          alert("Wajah tidak cocok. Silakan coba lagi.");
        }
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return alert("Masukkan email Anda terlebih dahulu.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      alert("Email reset password telah dikirim!");
    } catch (err: any) {
      alert("Gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role: string) => {
    router.push(`/${role.toLowerCase()}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[440px] bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 transition-all duration-500">
        
        {/* Accent Bar */}
        <div className="h-2 bg-slate-900 w-full" />
        
        <div className="p-10 md:p-12">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <img 
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhoQAzqHuGNA1gH5Jo2wYDsglIGOnRsGBr2PHvHgQ2tCjyKzU6wJCypTFU2TcjKd7kdSAF0MQ4-YJVBtjHJWfSUuX96gdIkuna2qZGy_P2AGTBX-XVJByi4rxNLlTMODQDn9ye8OHOWmcU4qFBbsrKLGuNORSLXoXLs_lGmP57uggXcJ0Vbw2KuKw/s1712/Logo%20Provinsi%20Kepulauan%20Riau.png" 
                alt="Logo Kepri" 
                className="w-14 h-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">PRISMA</h1>
            <p className="text-slate-400 text-[13px] font-medium mt-1 tracking-wide uppercase">Dinas Pariwisata Provinsi Kepulauan Riau</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleCredentialLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="admin@kepriprov.go.id" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none text-slate-700 font-medium"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all outline-none text-slate-700 font-medium"
                  required 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4.5 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:bg-slate-300 mt-2"
              >
                {loading ? 'Processing...' : 'Authentication'}
              </button>

              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors pt-2 uppercase tracking-widest"
              >
                Lupa Password?
              </button>
            </form>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="text-center">
                <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] ${isNewUser ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {isNewUser ? 'Biometric Registration' : 'Face Identification'}
                </span>
                <p className="text-xs text-slate-400 mt-4 font-medium italic">{status}</p>
              </div>

              {/* Face Scanner UI */}
              <div className="relative aspect-square w-full max-w-[280px] mx-auto overflow-hidden rounded-full border-[6px] border-slate-50 shadow-inner bg-slate-900 group">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1] relative z-10" 
                />
                
                {/* Scanner Animation Overlay */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                   {/* Scanning Line */}
                   <div className="absolute left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] opacity-70 animate-[scan_3s_ease-in-out_infinite]" />
                   
                   {/* Vignette effect */}
                   <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button 
                  onClick={processFace} 
                  disabled={loading} 
                  className={`w-full py-4.5 rounded-2xl font-bold text-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 ${
                    isNewUser ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                  }`}
                >
                  {loading ? 'Processing...' : isNewUser ? 'Register Biometric' : 'Confirm Identity'}
                </button>
                
                <button 
                  onClick={() => { stopVideo(); setStep(1); setStatus(''); }} 
                  className="w-full text-slate-400 font-bold text-[10px] hover:text-slate-600 transition-colors uppercase tracking-[0.2em]"
                >
                  Cancel & Return
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { top: 5%; opacity: 0; }
          20%, 80% { opacity: 1; }
          100% { top: 95%; opacity: 0; }
        }
        .py-4\.5 {
          padding-top: 1.125rem;
          padding-bottom: 1.125rem;
        }
      `}</style>
    </div>
  );
}