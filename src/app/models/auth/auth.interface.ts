export interface LoginPayload {
    username_or_email_or_phone: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    user: User;
}

export interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    phone_number?: string;
    role: string[];
    profile_pic?: string;
    gender?: 'M' | 'F' | 'O';
    address?: string;
    dob?: string;
    nic?: string;
    is_email_verified: boolean;
    is_phone_verified: boolean;
}

export interface VerificationStatus {
    is_email_verified: boolean;
    is_phone_verified: boolean;
    is_verified: boolean;
}

export interface RegistrationPayload {
    username: string;
    password: string;
    password2: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    gender?: 'M' | 'F' | 'O';
    address?: string;
    dob?: Date | string;
    nic?: string;
    profile_pic?: File | null;
}