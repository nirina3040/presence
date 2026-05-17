export interface Attendance {
  id?: number;
  student_id: string;
  name: string;
  date: string;
  time: string;
  status: string;
}

export interface AttendanceResponse {
  records: Attendance[];
  date?: string;
}

export interface TodayAttendanceResponse {
  records: Attendance[];
  date: string;
}