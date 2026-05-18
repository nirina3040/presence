// src/app/models/student.ts
export interface Student {
  id?: number;
  student_id: string;
  name: string;
  class_name: string;
  email?: string;
  phone?: string;
  address?: string;
  photo?: string; 
  created_at?: string;
}

export interface StudentResponse {
  students: Student[];
  count: number;
}