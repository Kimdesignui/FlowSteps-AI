
import React, { useState } from 'react';
import { login, register, User } from '../services/authService';

interface AuthProps {
    onLoginSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isLogin) {
            const res = login(formData.username, formData.password);
            if (res.success && res.user) {
                onLoginSuccess(res.user);
            } else {
                setError(res.message || 'Lỗi đăng nhập');
            }
        } else {
            if (!formData.name || !formData.username || !formData.password) {
                setError("Vui lòng điền đầy đủ thông tin");
                return;
            }
            const res = register(formData.name, formData.username, formData.password);
            if (res.success) {
                alert("Đăng ký thành công! Vui lòng đăng nhập.");
                setIsLogin(true);
                setFormData({ name: '', username: '', password: '' });
            } else {
                setError(res.message || 'Lỗi đăng ký');
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
                        <h2 className="text-2xl font-bold text-base-content">{isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</h2>
                        <p className="text-base-content/60 text-sm mt-1">
                            {isLogin ? 'Đăng nhập để quản lý tài liệu của bạn' : 'Bắt đầu hành trình tạo tài liệu chuyên nghiệp'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
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

                        {error && (
                            <div className="alert alert-error text-sm py-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full shadow-glow gradient-bg text-white border-none mt-2">
                            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                        </button>
                    </form>

                    <div className="divider text-xs text-base-content/40 my-6">HOẶC</div>

                    <div className="text-center text-sm">
                        <span className="text-base-content/70">{isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} </span>
                        <button 
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-primary font-bold hover:underline"
                        >
                            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                        </button>
                    </div>
                    
                    {!isLogin && (
                        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
                            <b>Lưu ý:</b> Dữ liệu được lưu trữ trên trình duyệt của bạn (LocalStorage). Nếu bạn xóa dữ liệu duyệt web hoặc dùng máy khác, dữ liệu sẽ không được đồng bộ.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
