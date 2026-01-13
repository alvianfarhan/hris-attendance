export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: string          // yyyy-mm-dd
  checkIn: string       // "HH:MM:SS"
  checkOut?: string     // "HH:MM:SS"
  isLate?: boolean      // telat > 09:15
}

// in-memory store (reset kalau server restart)
export const attendanceStore: AttendanceRecord[] = []