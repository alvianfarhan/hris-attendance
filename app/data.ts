// src/app/data.ts

export type Role = 'EMPLOYEE' | 'ADMIN'

export interface Employee {
  id: string
  name: string
  password: string // plain text, untuk demo
  role: Role
}

export const employees: Employee[] = [
  {
    id: 'emp001',
    name: 'Admin HR',
    password: 'admin123', // password login admin
    role: 'ADMIN',
  },
  {
    id: 'emp002',
    name: 'Karyawan Satu',
    password: 'karyawan1',
    role: 'EMPLOYEE',
  },
  {
    id: 'emp003',
    name: 'Karyawan Dua',
    password: 'karyawan2',
    role: 'EMPLOYEE',
  },
  // tambahkan sampai 20 orang kalau mau
]