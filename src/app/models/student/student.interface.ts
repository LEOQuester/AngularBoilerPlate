export interface Student {
    id?: number;
    guardian_name: string;
    guardian_contact: string;
    school: string;
    olevel_batch_year: string;
    alevel_batch_year: string;
    medium: string;
    current_grade: number;
    user: number | null;
}