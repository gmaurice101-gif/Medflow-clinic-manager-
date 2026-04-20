export type PatientStatus = 'Active' | 'Inactive';
export type AppointmentStatus = 'Scheduled' | 'Checked In' | 'Waiting' | 'Consulting' | 'Completed' | 'Cancelled';
export type PrescriptionStatus = 'Pending' | 'Dispensed';
export type BillStatus = 'Paid' | 'Pending' | 'Overdue';

export interface Vitals {
  bp: string;
  temp: string;
  hr: string;
  weight: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: string;
  contact: string;
  email?: string;
  bloodGroup?: string;
  status: PatientStatus;
  lastVisit?: string;
}
