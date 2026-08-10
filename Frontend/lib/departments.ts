/** Canonical department codes — mirrors Backend/accounts/models.py. */
export const DEPARTMENTS = ["CSE", "EEE", "TE", "IPE", "FDAE"] as const;

export type Department = (typeof DEPARTMENTS)[number];
