export interface Question {
  id: string;
  questionText: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctOption: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  courseId: string; // references Course.id
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  negativeMarking: number; // e.g. 0.25, 0.33, 0
  instructions: string;
  status: 'Published' | 'Draft';
  questions: Question[];
}

export interface Video {
  id: string;
  title: string;
  subject: string;
  courseId: string; // references Course.id
  url: string; // YouTube or direct video URL
  duration: string; // e.g. "45:00" or "1 hr 15 mins"
  faculty: string;
  description: string;
  status: 'Published' | 'Draft';
  access: 'Free' | 'Premium';
  createdAt: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  courseId: string; // references Course.id
  fileType: 'PDF' | 'Doc' | 'Link' | 'Image';
  url: string;
  fileSize: string; // e.g. "4.2 MB"
  downloadsCount: number;
  status: 'Published' | 'Draft';
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  fees: number;
  activeStudents: number;
  status: 'Active' | 'Inactive';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'Alert' | 'News' | 'Exam' | 'General';
  isPinned: boolean;
  createdAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
  status: 'Approved' | 'Pending' | 'Rejected';
  enrolledCourses: string[]; // List of Course.id
  createdAt: string;
}

export interface ThiruData {
  courses: Course[];
  videos: Video[];
  exams: Exam[];
  materials: StudyMaterial[];
  announcements: Announcement[];
  users?: AppUser[];
}
