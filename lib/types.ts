export interface Team {
  id: string;
  name: string;
}

export interface Division {
  id: string;
  name: string;
  teams: Team[];
}

export interface Conference {
  id: string;
  name: string;
  divisions: Division[];
}

export interface League {
  name: string;
  conferences: Conference[];
}

export interface UploadedLogo {
  id: string;
  file: File;
  objectUrl: string;
  originalName: string;
}

export type Assignments = Record<string, string>;
