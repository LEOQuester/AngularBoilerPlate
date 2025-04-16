export interface LoginPayload {
    username_or_email_or_phone: string;
    password: string;
}

export interface User {
    id: number;
    name: string;
    role: string[];
}

export interface AuthResponse {
    user: User;
    access_token: string;
}