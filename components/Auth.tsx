
import React, { useState } from 'react';
import { login, register, resetPasswordWithRecovery, User } from '../services/authService';
import { IconArrowRight } from './Icons';

interface AuthProps {
    onLoginSuccess: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<AuthMode>('LOGIN');
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        recoveryCode: '',
        newPassword: ''
    });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (mode === 'LOGIN') {
            const res = login(formData.username, formData.password);
            if (res.success && res.user) {
                onLoginSuccess(res.user);
            } else {
                setError(res.message || 'Lỗi đăng nhập');
            }
        } else if (mode === 'REGISTER') {
            if (!formData.name || !formData.username || !formData.password || !formData.recoveryCode) {
                setError("Vui lòng điền đầy đủ thông tin");
                return;
            }
            const res = register(formData.name, formData.username, formData.password, formData.recoveryCode);
            if (res.success) {
                setSuccessMsg("Đăng ký thành công! Vui lòng đăng nhập.");
                setMode('LOGIN');
                setFormData(prev => ({ ...prev, password: '' }));
            } else {
                setError(res.message || 'Lỗi đăng ký');
            }
        } else if (mode === 'FORGOT_PASSWORD') {
            if (!formData.username || !formData.recoveryCode || !formData.newPassword) {
                setError("Vui lòng nhập đủ thông tin");
                return;
            }
            const res = resetPasswordWithRecovery(formData.username, formData.recoveryCode, formData.newPassword);
            if (res.success) {
                alert("Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.");
                setMode('LOGIN');
                setFormData({ name: '', username: '', password: '', recoveryCode: '', newPassword: '' });
            } else {
                setError(res.message || 'Khôi phục thất bại');
            }
        }
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300">
                <div className="card-body p-8">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/30 mx-auto mb-4">
                            FS
                        </div>
                        <h2 className="text-2xl font-bold text-base-content">
                            {mode === 'LOGIN' && 'Chào mừng trở lại'}
                            {mode === 'REGISTER' && 'Tạo tài khoản mới'}
                            {mode === 'FORGOT_PASSWORD' && 'Khôi phục mật khẩu'}
                        </h2>
                        <p className="text-base-content/60 text-sm mt-1">
                            {mode === 'LOGIN' && 'Đăng nhập để quản lý tài liệu của bạn'}
                            {mode === 'REGISTER' && 'Bắt đầu hành trình tạo tài liệu chuyên nghiệp'}
                            {mode === 'FORGOT_PASSWORD' && 'Nhập mã khôi phục bạn đã tạo khi đăng ký'}
                        </p>
                    </div>

                    {successMsg && (
                        <div className="alert alert-success text-sm py-2 rounded-lg mb-4">
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'REGISTER' && (
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Họ và tên</span></label>
                                <input 
                                    type="text" 
                                    className="input input-bordered w-full focus:input-primary bg-base-200/50" 
                                    placeholder="Nguyễn Văn A"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        )}
                        
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Tên đăng nhập</span></label>
                            <input 
                                type="text" 
                                className="input input-bordered w-full focus:input-primary bg-base-200/50" 
                                placeholder="username"
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                            />
                        </div>

                        {mode !== 'FORGOT_PASSWORD' && (
                             <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Mật khẩu</span></label>
                                <input 
                                    type="password" 
                                    className="input input-bordered w-full focus:input-primary bg-base-200/50" 
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        )}

                        {mode === 'FORGOT_PASSWORD' && (
                             <div className="form-control">
                                <label className="label"><span className="label-text font-bold">Mật khẩu mới</span></label>
                                <input 
                                    type="password" 
                                    className="input input-bordered w-full focus:input-primary bg-base-200/50" 
                                    placeholder="••••••••"
                                    value={formData.newPassword}
                                    onChange={e => setFormData({...formData, newPassword: e.target.value})}
                                />
                            </div>
                        )}

                        {(mode === 'REGISTER' || mode === 'FORGOT_PASSWORD') && (
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-bold text-indigo-600">Mã khôi phục (Quan trọng)</span>
                                </label>
                                <input 
                                    type="text" 
                                    className="input input-bordered input-primary w-full focus:input-primary bg-indigo-50" 
                                    placeholder="VD: Số điện thoại, Mã bí mật..."
                                    value={formData.recoveryCode}
                                    onChange={e => setFormData({...formData, recoveryCode: e.target.value})}
                                />
                                {mode === 'REGISTER' && <label className="label"><span className="label-text-alt text-xs text-base-content/60">Dùng để lấy lại mật khẩu khi quên.</span></label>}
                            </div>
                        )}

                        {mode === 'LOGIN' && (
                             <div className="text-right">
                                <a 
                                    onClick={() => setMode('FORGOT_PASSWORD')}
                                    className="text-xs text-indigo-600 hover:underline cursor-pointer font-semibold"
                                >
                                    Quên mật khẩu?
                                </a>
                             </div>
                        )}

                        {error && (
                            <div className="alert alert-error text-sm py-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full shadow-glow gradient-bg text-white border-none mt-2">
                            {mode === 'LOGIN' && 'Đăng nhập'}
                            {mode === 'REGISTER' && 'Đăng ký'}
                            {mode === 'FORGOT_PASSWORD' && 'Đặt lại mật khẩu'}
                        </button>
                    </form>

                    <div className="divider text-xs text-base-content/40 my-6">HOẶC</div>

                    <div className="text-center text-sm">
                        {mode === 'LOGIN' && (
                             <>
                                <span className="text-base-content/70">Chưa có tài khoản? </span>
                                <button onClick={() => { setMode('REGISTER'); setError(''); }} className="text-primary font-bold hover:underline">Đăng ký ngay</button>
                             </>
                        )}
                        {(mode === 'REGISTER' || mode === 'FORGOT_PASSWORD') && (
                             <>
                                <span className="text-base-content/70">Đã có tài khoản? </span>
                                <button onClick={() => { setMode('LOGIN'); setError(''); }} className="text-primary font-bold hover:underline">Đăng nhập</button>
                             </>
                        )}
                    </div>
                    
                    {mode === 'REGISTER' && (
                        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
                            <b>Lưu ý:</b> Dữ liệu được lưu trữ cục bộ. Hãy nhớ Mã khôi phục của bạn!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
