
export interface User {
    id: string;
    username: string;
    name: string;
    password: string; // In a real app, never store passwords in plain text!
}

const KEYS = {
    USERS: 'fs_users',
    CURRENT_USER: 'fs_current_user'
};

export const register = (name: string, username: string, password: string): { success: boolean; message?: string } => {
    const usersStr = localStorage.getItem(KEYS.USERS);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    if (users.find(u => u.username === username)) {
        return { success: false, message: 'Tên đăng nhập đã tồn tại' };
    }

    const newUser: User = {
        id: Date.now().toString(),
        name,
        username,
        password
    };

    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return { success: true };
};

export const login = (username: string, password: string): { success: boolean; user?: User; message?: string } => {
    const usersStr = localStorage.getItem(KEYS.USERS);
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
        return { success: true, user };
    }

    return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' };
};

export const logout = () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
};

export const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem(KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
    return !!getCurrentUser();
};
