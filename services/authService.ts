
export interface User {
    id: string;
    username: string;
    name: string;
    password: string;
    role: 'admin' | 'user';
    recoveryCode?: string; // Secret code to reset password
    createdAt: number;
}

const KEYS = {
    USERS: 'fs_users',
    CURRENT_USER: 'fs_current_user'
};

// Initialize Admin if not exists
const initAdmin = (users: User[]) => {
    if (!users.find(u => u.role === 'admin')) {
        const admin: User = {
            id: 'admin_01',
            username: 'admin',
            password: 'admin123', // Default password
            name: 'Quản trị viên',
            role: 'admin',
            createdAt: Date.now()
        };
        users.push(admin);
        return true;
    }
    return false;
};

const getUsers = (): User[] => {
    const usersStr = localStorage.getItem(KEYS.USERS);
    let users: User[] = usersStr ? JSON.parse(usersStr) : [];
    if (initAdmin(users)) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    }
    return users;
};

export const register = (name: string, username: string, password: string, recoveryCode: string): { success: boolean; message?: string } => {
    const users = getUsers();

    if (users.find(u => u.username === username)) {
        return { success: false, message: 'Tên đăng nhập đã tồn tại' };
    }

    const newUser: User = {
        id: Date.now().toString(),
        name,
        username,
        password,
        role: 'user',
        recoveryCode,
        createdAt: Date.now()
    };

    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return { success: true };
};

export const login = (username: string, password: string): { success: boolean; user?: User; message?: string } => {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
        return { success: true, user };
    }

    return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' };
};

export const resetPasswordWithRecovery = (username: string, recoveryCode: string, newPassword: string): { success: boolean; message?: string } => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        return { success: false, message: 'Không tìm thấy tài khoản' };
    }

    const user = users[userIndex];
    if (user.recoveryCode !== recoveryCode) {
        return { success: false, message: 'Mã khôi phục không chính xác' };
    }

    users[userIndex].password = newPassword;
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return { success: true, message: 'Đặt lại mật khẩu thành công' };
};

export const logout = () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
};

export const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem(KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
};

// --- Admin Functions ---

export const getAllUsers = (): User[] => {
    return getUsers();
};

export const adminResetPassword = (userId: string): string => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        const newPass = '123456'; // Default reset password
        users[index].password = newPass;
        localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        return newPass;
    }
    return '';
};

export const deleteUser = (userId: string): boolean => {
    let users = getUsers();
    const userToDelete = users.find(u => u.id === userId);
    
    if (userToDelete && userToDelete.role === 'admin') return false; // Cannot delete admin

    users = users.filter(u => u.id !== userId);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    
    // Cleanup user data (Simulation)
    const guidesKey = `df_guides_${userId}`;
    const projectsKey = `df_projects_${userId}`;
    localStorage.removeItem(guidesKey);
    localStorage.removeItem(projectsKey);
    
    return true;
};
