// Mock data for the Room Finder feature.
//
// Schedules are per-room booking lists. About half the rooms run dense,
// near-continuous blocks from early morning through evening (~08:00–21:00), so
// they read as OCCUPIED at almost any time of day; the rest keep light, gappy
// schedules and read as FREE most of the day. That way the demo always shows a
// realistic mix regardless of when it's run. Status is NEVER stored here: it
// is derived from the schedule + current time at render time by
// getRoomStatus() (see lib/getRoomStatus.ts), so it stays consistent as time
// passes.

export interface ScheduleEntry {
  /** 24-hour start time, e.g. "09:00". */
  startTime: string;
  /** 24-hour end time, e.g. "10:30". */
  endTime: string;
  /** Section name for the class booking this slot, e.g. "CSE-3A". */
  className: string;
  teacherName: string;
}

export interface Room {
  id: string;
  building: string;
  floor: number;
  /** Display number, e.g. "301" — labs use names like "IT Lab 2". */
  roomNumber: string;
  capacity: number;
  schedule: ScheduleEntry[];
}

export const ROOMS: Room[] = [
  // ---- Academic Building 1 ----
  {
    id: "ab1-101",
    building: "Academic Building 1",
    floor: 1,
    roomNumber: "101",
    capacity: 60,
    schedule: [
      { startTime: "08:00", endTime: "09:30", className: "CSE-301", teacherName: "Dr. Tanvir Ahmed" },
      { startTime: "09:45", endTime: "11:15", className: "CSE-305", teacherName: "Farhana Akter" },
      { startTime: "11:30", endTime: "13:00", className: "MATH-203", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "13:15", endTime: "14:45", className: "CSE-311", teacherName: "Rakibul Hasan" },
      { startTime: "15:00", endTime: "16:30", className: "ENG-102", teacherName: "Sharmin Sultana" },
      { startTime: "16:45", endTime: "18:15", className: "CSE-301", teacherName: "Dr. Tanvir Ahmed" },
      { startTime: "18:30", endTime: "20:00", className: "MATH-203", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "20:15", endTime: "21:45", className: "CSE-305", teacherName: "Farhana Akter" },
    ],
  },
  {
    id: "ab1-102",
    building: "Academic Building 1",
    floor: 1,
    roomNumber: "102",
    capacity: 55,
    schedule: [
      { startTime: "08:00", endTime: "09:30", className: "ENG-101", teacherName: "Rakibul Hasan" },
      { startTime: "09:45", endTime: "11:15", className: "PHY-101", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "11:30", endTime: "13:00", className: "CHE-101", teacherName: "Dr. Nazmul Islam" },
      { startTime: "13:15", endTime: "14:45", className: "CSE-311", teacherName: "Rakibul Hasan" },
      { startTime: "15:00", endTime: "16:30", className: "STAT-201", teacherName: "Farhana Akter" },
      { startTime: "16:45", endTime: "18:15", className: "ENG-103", teacherName: "Sharmin Sultana" },
      { startTime: "18:30", endTime: "20:00", className: "PHY-101", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "20:15", endTime: "21:45", className: "HUM-101", teacherName: "Rakibul Hasan" },
    ],
  },
  {
    id: "ab1-103",
    building: "Academic Building 1",
    floor: 1,
    roomNumber: "103",
    capacity: 50,
    schedule: [
      { startTime: "10:00", endTime: "11:30", className: "MATH-101", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "14:00", endTime: "15:30", className: "STAT-201", teacherName: "Farhana Akter" },
    ],
  },
  {
    id: "ab1-201",
    building: "Academic Building 1",
    floor: 2,
    roomNumber: "201",
    capacity: 70,
    schedule: [
      { startTime: "08:00", endTime: "09:30", className: "CSE-301", teacherName: "Dr. Tanvir Ahmed" },
      { startTime: "09:45", endTime: "11:15", className: "CSE-305", teacherName: "Farhana Akter" },
      { startTime: "11:30", endTime: "13:00", className: "MATH-203", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "13:15", endTime: "14:45", className: "CSE-311", teacherName: "Rakibul Hasan" },
      { startTime: "15:00", endTime: "16:30", className: "EEE-211", teacherName: "Asif Rahman" },
      { startTime: "16:45", endTime: "18:15", className: "ENG-102", teacherName: "Sharmin Sultana" },
      { startTime: "18:30", endTime: "20:00", className: "CSE-301", teacherName: "Dr. Tanvir Ahmed" },
      { startTime: "20:15", endTime: "21:45", className: "CSE-311", teacherName: "Rakibul Hasan" },
    ],
  },
  {
    id: "ab1-202",
    building: "Academic Building 1",
    floor: 2,
    roomNumber: "202",
    capacity: 65,
    schedule: [
      { startTime: "08:00", endTime: "09:30", className: "EEE-211", teacherName: "Asif Rahman" },
      { startTime: "09:45", endTime: "11:15", className: "EEE-213", teacherName: "Asif Rahman" },
      { startTime: "11:30", endTime: "13:00", className: "ENG-101", teacherName: "Sharmin Sultana" },
      { startTime: "13:15", endTime: "14:45", className: "MATH-203", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "15:00", endTime: "16:30", className: "PHY-101", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "16:45", endTime: "18:15", className: "EEE-213", teacherName: "Asif Rahman" },
      { startTime: "18:30", endTime: "20:00", className: "CSE-305", teacherName: "Farhana Akter" },
      { startTime: "20:15", endTime: "21:45", className: "NITER Programming Club", teacherName: "Sharmin Sultana" },
    ],
  },
  {
    id: "ab1-203",
    building: "Academic Building 1",
    floor: 2,
    roomNumber: "203",
    capacity: 45,
    schedule: [
      { startTime: "11:00", endTime: "12:30", className: "ENG-102", teacherName: "Sharmin Sultana" },
      { startTime: "14:00", endTime: "15:30", className: "HUM-101", teacherName: "Rakibul Hasan" },
    ],
  },
  {
    id: "ab1-301",
    building: "Academic Building 1",
    floor: 3,
    roomNumber: "301",
    capacity: 80,
    schedule: [
      { startTime: "08:00", endTime: "09:30", className: "CSE-311", teacherName: "Rakibul Hasan" },
      { startTime: "09:45", endTime: "11:15", className: "CSE-311", teacherName: "Rakibul Hasan" },
      { startTime: "11:30", endTime: "13:00", className: "EEE-211", teacherName: "Asif Rahman" },
      { startTime: "13:15", endTime: "14:45", className: "CSE-301", teacherName: "Dr. Tanvir Ahmed" },
      { startTime: "15:00", endTime: "16:30", className: "CSE-301", teacherName: "Dr. Tanvir Ahmed" },
      { startTime: "16:45", endTime: "18:15", className: "MATH-101", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "18:30", endTime: "20:00", className: "EEE-213", teacherName: "Asif Rahman" },
      { startTime: "20:15", endTime: "21:45", className: "ENG-101", teacherName: "Rakibul Hasan" },
    ],
  },
  {
    id: "ab1-302",
    building: "Academic Building 1",
    floor: 3,
    roomNumber: "302",
    capacity: 40,
    schedule: [
      { startTime: "09:30", endTime: "11:00", className: "MATH-101", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "13:00", endTime: "14:30", className: "HUM-101", teacherName: "Sharmin Sultana" },
    ],
  },

  // ---- Academic Building 2 ----
  {
    id: "ab2-101",
    building: "Academic Building 2",
    floor: 1,
    roomNumber: "101",
    capacity: 60,
    schedule: [
      { startTime: "08:00", endTime: "09:30", className: "CSE-305", teacherName: "Farhana Akter" },
      { startTime: "09:45", endTime: "11:15", className: "CSE-311", teacherName: "Rakibul Hasan" },
      { startTime: "11:30", endTime: "13:00", className: "ENG-103", teacherName: "Sharmin Sultana" },
      { startTime: "13:15", endTime: "14:45", className: "MATH-203", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "15:00", endTime: "16:30", className: "CSE-301", teacherName: "Dr. Tanvir Ahmed" },
      { startTime: "16:45", endTime: "18:15", className: "STAT-201", teacherName: "Farhana Akter" },
      { startTime: "18:30", endTime: "20:00", className: "CSE-305", teacherName: "Farhana Akter" },
      { startTime: "20:15", endTime: "21:45", className: "CSE-311", teacherName: "Rakibul Hasan" },
    ],
  },
  {
    id: "ab2-102",
    building: "Academic Building 2",
    floor: 1,
    roomNumber: "102",
    capacity: 55,
    schedule: [
      { startTime: "10:00", endTime: "11:30", className: "PHY-101", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "15:00", endTime: "16:30", className: "MATH-203", teacherName: "Dr. Mahmuda Khatun" },
    ],
  },
  {
    id: "ab2-201",
    building: "Academic Building 2",
    floor: 2,
    roomNumber: "201",
    capacity: 50,
    schedule: [
      { startTime: "09:00", endTime: "10:30", className: "CHE-101", teacherName: "Dr. Nazmul Islam" },
      { startTime: "12:30", endTime: "14:00", className: "STAT-201", teacherName: "Farhana Akter" },
    ],
  },
  {
    id: "ab2-202",
    building: "Academic Building 2",
    floor: 2,
    roomNumber: "202",
    capacity: 60,
    schedule: [
      { startTime: "08:00", endTime: "09:30", className: "ENG-102", teacherName: "Sharmin Sultana" },
      { startTime: "09:45", endTime: "11:15", className: "EEE-213", teacherName: "Asif Rahman" },
      { startTime: "11:30", endTime: "13:00", className: "CSE-301", teacherName: "Dr. Tanvir Ahmed" },
      { startTime: "13:15", endTime: "14:45", className: "PHY-101", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "15:00", endTime: "16:30", className: "CSE-305", teacherName: "Farhana Akter" },
      { startTime: "16:45", endTime: "18:15", className: "ENG-103", teacherName: "Sharmin Sultana" },
      { startTime: "18:30", endTime: "20:00", className: "MATH-203", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "20:15", endTime: "21:45", className: "HUM-101", teacherName: "Rakibul Hasan" },
    ],
  },
  {
    id: "ab2-lab1",
    building: "Academic Building 2",
    floor: 1,
    roomNumber: "IT Lab 1",
    capacity: 40,
    schedule: [
      { startTime: "08:00", endTime: "10:00", className: "CSE-311 Lab", teacherName: "Asif Rahman" },
      { startTime: "10:15", endTime: "12:15", className: "CSE-305 Lab", teacherName: "Farhana Akter" },
      { startTime: "12:30", endTime: "14:30", className: "CSE-301 Lab", teacherName: "Dr. Tanvir Ahmed" },
      { startTime: "14:45", endTime: "16:45", className: "CSE-311 Lab", teacherName: "Asif Rahman" },
      { startTime: "17:00", endTime: "19:00", className: "CSE-305 Lab", teacherName: "Farhana Akter" },
      { startTime: "19:15", endTime: "21:15", className: "NITER Programming Club", teacherName: "Sharmin Sultana" },
    ],
  },
  {
    id: "ab2-lab2",
    building: "Academic Building 2",
    floor: 1,
    roomNumber: "IT Lab 2",
    capacity: 35,
    schedule: [
      { startTime: "08:00", endTime: "10:00", className: "CSE-305 Lab", teacherName: "Farhana Akter" },
      { startTime: "10:15", endTime: "12:15", className: "CSE-311 Lab", teacherName: "Asif Rahman" },
      { startTime: "12:30", endTime: "14:30", className: "CSE-301 Lab", teacherName: "Dr. Tanvir Ahmed" },
      { startTime: "14:45", endTime: "16:45", className: "CSE-305 Lab", teacherName: "Farhana Akter" },
      { startTime: "17:00", endTime: "19:00", className: "CSE-311 Lab", teacherName: "Asif Rahman" },
      { startTime: "19:15", endTime: "21:15", className: "IT Club Open Lab", teacherName: "Sharmin Sultana" },
    ],
  },

  // ---- Yan Shet ----
  {
    id: "sc-chem1",
    building: "Yan Shet",
    floor: 1,
    roomNumber: "Chemistry Lab 1",
    capacity: 30,
    schedule: [
      { startTime: "09:00", endTime: "10:30", className: "CHE-101 Lab", teacherName: "Dr. Nazmul Islam" },
      { startTime: "11:00", endTime: "12:30", className: "CHE-101 Lab", teacherName: "Dr. Nazmul Islam" },
    ],
  },
  {
    id: "sc-phys2",
    building: "Yan Shet",
    floor: 1,
    roomNumber: "Physics Lab 2",
    capacity: 30,
    schedule: [
      { startTime: "10:30", endTime: "12:30", className: "PHY-101 Lab", teacherName: "Dr. Mahmuda Khatun" },
      { startTime: "14:00", endTime: "16:00", className: "PHY-101 Lab", teacherName: "Dr. Mahmuda Khatun" },
    ],
  },
  {
    id: "sc-seminar",
    building: "Yan Shet",
    floor: 2,
    roomNumber: "Seminar Room",
    capacity: 120,
    schedule: [
      { startTime: "10:00", endTime: "12:00", className: "CSE-301 Makeup Lecture", teacherName: "Dr. Tanvir Ahmed" },
    ],
  },
  {
    id: "sc-multi",
    building: "Yan Shet",
    floor: 2,
    roomNumber: "Multimedia Room",
    capacity: 45,
    schedule: [
      { startTime: "09:30", endTime: "11:00", className: "ENG-101", teacherName: "Sharmin Sultana" },
      { startTime: "14:00", endTime: "15:30", className: "CSE-305", teacherName: "Farhana Akter" },
    ],
  },
];

/** "301" → "Room 301"; named rooms like "IT Lab 2" keep their name as-is. */
export function getRoomLabel(roomNumber: string): string {
  return /^\d+$/.test(roomNumber) ? `Room ${roomNumber}` : roomNumber;
}
