export interface Student {
  id: string;
  name: string;
  classId: string;
  completion: number;
  score: number;
  focus: string;
}

export interface Assignment {
  id: string;
  title: string;
  classId: string;
  dueDate: string;
  description: string;
  submitted: string[];
}

