// Mock profile of the currently "logged in" student. Used to personalize the
// notices they see (their class, lab group, and club).

export interface CurrentStudent {
  name: string;
  studentId: string;
  className: string;
  labGroup: string;
  club: string;
}

export const currentStudent: CurrentStudent = {
  name: "Arif Hasan",
  studentId: "NIT-2101004",
  className: "CSE 3A",
  labGroup: "Lab Group B",
  club: "NITER Programming Club",
};
