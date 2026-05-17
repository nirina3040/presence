export interface Student {
  student_id: string;
  name: string;
  class_name: string;
  created_at?: string;
}

export interface StudentResponse {
  students: Student[];
}