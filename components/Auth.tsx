import React, { useState } from 'react';
import { supabase, isMock } from '../services/supabaseClient';
import Modal from './Modal';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
  
  // UI States
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setShowSuccessModal(true); // Show nice modal instead of alert
      }
    } catch (error: any) {
      setErrorMsg(error.error_description || error.message || 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email: 'demo@smarttask.ai',
            password: 'demo'
        });
        if (error) throw error;
    } catch (error: any) {
        setErrorMsg(error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4 font-sans">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white animate-pop relative overflow-hidden">
        
        {/* Decorate blobs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-wiggle"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-wiggle" style={{ animationDelay: '1s'}}></div>

        <div className="relative z-10 text-center">
            <div className="mb-6 inline-block p-4 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
                <span className="text-4xl">🚀</span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
                {isLogin ? 'ยินดีต้อนรับกลับ!' : 'มาเป็นชาวแก๊งกัน!'}
            </h1>
            <p className="text-slate-500 mb-8 font-medium">
                {isLogin ? 'พร้อมลุยงานต่อยัง?' : 'จัดการชีวิตให้ปัง ด้วย SmartTask AI'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
            <div className="text-left group">
                <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase tracking-wider">อีเมล</label>
                <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-400 transition-all font-medium text-lg"
                />
            </div>
            <div className="text-left group">
                <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase tracking-wider">รหัสผ่าน</label>
                <input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-400 transition-all font-medium text-lg"
                />
            </div>

            {errorMsg && (
                <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-bold border border-red-100 animate-pop flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {errorMsg}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-xl shadow-lg shadow-slate-300 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-6"
            >
                {loading ? (
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <span>{isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</span>
                )}
            </button>
            </form>

            <div className="mt-6 text-sm font-medium text-slate-500">
                {isLogin ? 'ยังไม่มีบัญชีหรอ?' : 'มีบัญชีอยู่แล้ว?'}
                <button
                    onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
                    className="ml-2 text-violet-600 font-bold hover:underline hover:text-violet-800 transition-colors"
                >
                    {isLogin ? 'สมัครเลย' : 'เข้าสู่ระบบ'}
                </button>
            </div>

            {isMock && (
                <div className="mt-8 pt-6 border-t border-dashed border-indigo-200">
                    <button
                        type="button"
                        onClick={handleDemoLogin}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-base hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-100"
                    >
                        🚀 เข้าใช้แบบ Demo (ทดลองเล่น)
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-2 font-medium">
                        ระบบจำลอง (ข้อมูลจะเก็บในเครื่องนี้เท่านั้น)
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>

    {/* Success Modal */}
    <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="🎉 สำเร็จ!">
        <div className="text-center p-6">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                ✉️
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">ส่งอีเมลยืนยันแล้ว!</h3>
            <p className="text-slate-500">
                เราได้ส่งลิงก์ยืนยันตัวตนไปที่อีเมลของคุณแล้ว<br/>รบกวนเช็คเมล (รวมถึง Junk Mail) หน่อยนะ
            </p>
            <button 
                onClick={() => setShowSuccessModal(false)} 
                className="mt-8 w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
            >
                รับทราบ
            </button>
        </div>
    </Modal>
    </>
  );
};

export default Auth;