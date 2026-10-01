import { ThiruData } from './types';

export const INITIAL_THIRU_DATA: ThiruData = {
  courses: [
    {
      id: "course-appsc-g2",
      name: "APPSC Group 2 - Comprehensive Batch (Telugu & English Medium)",
      code: "AP-G2-2026",
      description: "Complete coverage of APPSC Group 2 syllabus including Paper 1 (General Studies), Paper 2 (AP History & Indian Constitution), and Paper 3 (Planning & Economy).",
      fees: 12500,
      activeStudents: 340,
      status: "Active"
    },
    {
      id: "course-tspsc-g1",
      name: "TSPSC Group 1 & 2 - Integrated Prelims & Mains",
      code: "TS-G12-2026",
      description: "Specially tailored course covering Telangana Movement, State Economy, Indian Polity, History, and General Mental Ability with live-streamed lectures.",
      fees: 15000,
      activeStudents: 185,
      status: "Active"
    },
    {
      id: "course-si-pc",
      name: "SI & Constable - Uniform Services Special Batch",
      code: "SI-PC-2026",
      description: "Focus on Arithmetic, Reasoning, General Studies, and Physical Test guidance. Free access to premium daily practice exams.",
      fees: 8500,
      activeStudents: 520,
      status: "Active"
    },
    {
      id: "course-gs-foundation",
      name: "General Studies & Current Affairs Foundation Class",
      code: "GS-FND-2026",
      description: "Daily analysis of newspapers (The Hindu, Eenadu), monthly PIB updates, Science & Technology, and environment topics.",
      fees: 4000,
      activeStudents: 780,
      status: "Active"
    }
  ],
  videos: [
    {
      id: "vid-1",
      title: "AP History: Satavahanas Dynasty - Complete Administration & Culture",
      subject: "Andhra Pradesh History",
      courseId: "course-appsc-g2",
      url: "https://www.youtube.com/watch?v=Xz963x4P2xM",
      duration: "1 hr 12 mins",
      faculty: "Thiru Sir",
      description: "In-depth analysis of the Satavahana political administration, social conditions, land grants system, trade guilds, and religious policies. Essential for APPSC Group 2 Screening Test.",
      status: "Published",
      access: "Free",
      createdAt: "2026-09-01"
    },
    {
      id: "vid-2",
      title: "Indian Polity: Preamble & Key Amendments (Kesavananda Bharati Case)",
      subject: "Indian Polity & Constitution",
      courseId: "course-appsc-g2",
      url: "https://www.youtube.com/watch?v=8O988vA0hsc",
      duration: "45 mins",
      faculty: "Thiru Sir",
      description: "Learn about the significance of the Preamble, the theory of basic structure established in the 1973 landmark Supreme Court judgement, and the 42nd & 44th Constitutional Amendments.",
      status: "Published",
      access: "Premium",
      createdAt: "2026-09-10"
    },
    {
      id: "vid-3",
      title: "Telangana Movement: 1969 Agitation Causes & Key Events",
      subject: "Telangana History & Movement",
      courseId: "course-tspsc-g1",
      url: "https://www.youtube.com/watch?v=F_S5M1t1kI0",
      duration: "1 hr 5 mins",
      faculty: "K. Raghunath Chowdary",
      description: "An overview of the historical reasons behind the 1969 agitation. Detailed examination of the Mulki Rules, Gentlemens Agreement violations, and the fast-unto-death of Ravindranath.",
      status: "Published",
      access: "Premium",
      createdAt: "2026-09-12"
    },
    {
      id: "vid-4",
      title: "Arithmetic: Time, Speed and Distance Short-cut Tricks",
      subject: "Arithmetic & Mental Ability",
      courseId: "course-si-pc",
      url: "https://www.youtube.com/watch?v=680DInOq0v8",
      duration: "38 mins",
      faculty: "Srinivasa Raju (Maths Dept)",
      description: "Solve complex train cross-over questions, relative speed issues, and upstream/downstream problems within 30 seconds using formula-free ratio methods.",
      status: "Published",
      access: "Free",
      createdAt: "2026-09-15"
    },
    {
      id: "vid-5",
      title: "Indian Economy: NITI Aayog vs Planning Commission Analysis",
      subject: "Indian Economy",
      courseId: "course-appsc-g2",
      url: "https://www.youtube.com/watch?v=3-pL7Pz7o2Y",
      duration: "52 mins",
      faculty: "Thiru Sir",
      description: "Comprehensive lecture contrastive analysis of centralized planning vs cooperative federalism, composition of NITI Aayog, and current 3-year action plans.",
      status: "Draft",
      access: "Premium",
      createdAt: "2026-09-28"
    }
  ],
  exams: [
    {
      id: "exam-polity-1",
      title: "Indian Polity: Fundamental Rights & Directive Principles (DPSE)",
      subject: "Indian Polity",
      courseId: "course-appsc-g2",
      duration: 30,
      totalMarks: 40,
      passingMarks: 20,
      negativeMarking: 0.33,
      instructions: "1. Read all questions carefully.\n2. Each correct answer carries 2 marks.\n3. There is a negative marking of 0.33 (1/3rd) of the assigned marks for each wrong answer.\n4. Do not refresh or exit the browser during the exam.",
      status: "Published",
      questions: [
        {
          id: "q-1-1",
          questionText: "Which of the following Articles under the Indian Constitution guarantees the 'Right to Equality' before law and equal protection of laws?",
          options: {
            a: "Article 14",
            b: "Article 15",
            c: "Article 16",
            d: "Article 19"
          },
          correctOption: "a",
          explanation: "Article 14 of the Constitution of India provides that the State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.",
          difficulty: "Easy",
          topic: "Fundamental Rights"
        },
        {
          id: "q-1-2",
          questionText: "Which Amendment of the Constitution of India added the term 'Secular' and 'Socialist' to the Preamble?",
          options: {
            a: "44th Constitutional Amendment Act",
            b: "42nd Constitutional Amendment Act",
            c: "24th Constitutional Amendment Act",
            d: "52nd Constitutional Amendment Act"
          },
          correctOption: "b",
          explanation: "The Preamble was amended only once so far, by the 42nd Constitutional Amendment Act of 1976, which added three new words: Socialist, Secular, and Integrity.",
          difficulty: "Medium",
          topic: "Preamble"
        },
        {
          id: "q-1-3",
          questionText: "The Directive Principles of State Policy (DPSP) are inspired by the Constitution of which country?",
          options: {
            a: "USA",
            b: "USSR",
            c: "Ireland",
            d: "Australia"
          },
          correctOption: "c",
          explanation: "Directive Principles of State Policy in Part IV of the Indian Constitution are borrowed from the Irish Constitution (which in turn borrowed it from Spain).",
          difficulty: "Easy",
          topic: "DPSP"
        },
        {
          id: "q-1-4",
          questionText: "Which fundamental right cannot be suspended even during a National Emergency under Article 352?",
          options: {
            a: "Right to Freedom of Speech (Article 19)",
            b: "Right to Constitutional Remedies (Article 32)",
            c: "Protection of Life and Personal Liberty (Articles 20 & 21)",
            d: "Right to Equality (Article 14)"
          },
          correctOption: "c",
          explanation: "By the 44th Amendment Act of 1978, the right to protection in respect of conviction for offences (Article 20) and the protection of life and personal liberty (Article 21) cannot be suspended even during a national emergency.",
          difficulty: "Hard",
          topic: "Emergency Provisions"
        }
      ]
    },
    {
      id: "exam-ap-history-1",
      title: "AP History: Ikshvakus & Eastern Chalukyas Mini Mock Test",
      subject: "Andhra Pradesh History",
      courseId: "course-appsc-g2",
      duration: 15,
      totalMarks: 20,
      passingMarks: 10,
      negativeMarking: 0.25,
      instructions: "Welcome to Thiru Study Circle Daily Mini Test. Answer all 4 multiple choice questions. Total Marks: 20.",
      status: "Published",
      questions: [
        {
          id: "q-2-1",
          questionText: "Who was the founder of the Ikshvaku Dynasty in Andhra?",
          options: {
            a: "Sri Chamtamula",
            b: "Virapurushadatta",
            c: "Ehuvula Chamtamula",
            d: "Rudrapurushadatta"
          },
          correctOption: "a",
          explanation: "Sri Chamtamula (Chamtamula I) was the founder of the Ikshvaku dynasty. He performed Vedic sacrifices like Ashvamedha and Agnihotra.",
          difficulty: "Medium",
          topic: "Ikshvakus"
        },
        {
          id: "q-2-2",
          questionText: "What was the capital city of the Eastern Chalukyas initially, before it was shifted to Rajamahendravaram?",
          options: {
            a: "Vijayawada",
            b: "Vengi (near Eluru)",
            c: "Amaravati",
            d: "Nagarjunakonda"
          },
          correctOption: "b",
          explanation: "The Eastern Chalukyas ruled from their capital at Vengi (modern Pedavegi near Eluru in Andhra Pradesh) for the major part of their dynasty before shifting to Rajahmundry/Rajamahendravaram.",
          difficulty: "Easy",
          topic: "Eastern Chalukyas"
        }
      ]
    },
    {
      id: "exam-arithmetic-1",
      title: "Arithmetic Speed Test: Ratios, Proportions and Averages",
      subject: "Quantitative Aptitude",
      courseId: "course-si-pc",
      duration: 20,
      totalMarks: 30,
      passingMarks: 15,
      negativeMarking: 0.25,
      instructions: "No calculator allowed. Try to use mental calculations or fast shortcut techniques.",
      status: "Draft",
      questions: [
        {
          id: "q-3-1",
          questionText: "If A:B = 2:3 and B:C = 4:5, find the composite ratio A:B:C.",
          options: {
            a: "8:12:15",
            b: "2:4:5",
            c: "10:12:15",
            d: "6:8:10"
          },
          correctOption: "a",
          explanation: "Multiply the ratios: A:B = (2*4):(3*4) = 8:12. B:C = (4*3):(5*3) = 12:15. Hence, A:B:C = 8:12:15.",
          difficulty: "Easy",
          topic: "Ratios"
        }
      ]
    }
  ],
  materials: [
    {
      id: "mat-1",
      title: "Complete Hand-written Indian Polity Notes (E-Book Part-1)",
      subject: "Polity",
      courseId: "course-appsc-g2",
      fileType: "PDF",
      url: "https://example.com/polity_notes_part1.pdf",
      fileSize: "14.5 MB",
      downloadsCount: 1250,
      status: "Published",
      createdAt: "2026-09-05"
    },
    {
      id: "mat-2",
      title: "Andhra Pradesh Economy and Budget Highlights 2026-27",
      subject: "AP Economy",
      courseId: "course-appsc-g2",
      fileType: "PDF",
      url: "https://example.com/ap_budget_2026.pdf",
      fileSize: "3.2 MB",
      downloadsCount: 840,
      status: "Published",
      createdAt: "2026-09-18"
    },
    {
      id: "mat-3",
      title: "Telangana Socio-Economic Outlook Handout (Key Tables & Figures)",
      subject: "Telangana Economy",
      courseId: "course-tspsc-g1",
      fileType: "PDF",
      url: "https://example.com/ts_socio_economic_outlook.pdf",
      fileSize: "6.8 MB",
      downloadsCount: 450,
      status: "Published",
      createdAt: "2026-09-22"
    },
    {
      id: "mat-4",
      title: "Previous Year Solved Papers APPSC Group II (2020-2024)",
      subject: "Previous Papers",
      courseId: "course-appsc-g2",
      fileType: "PDF",
      url: "https://example.com/appsc_g2_pyqs.pdf",
      fileSize: "22.1 MB",
      downloadsCount: 1980,
      status: "Published",
      createdAt: "2026-09-08"
    },
    {
      id: "mat-5",
      title: "Syllabus Copy & Reference Booklist for Group 1 Mains",
      subject: "Syllabus",
      courseId: "course-tspsc-g1",
      fileType: "Link",
      url: "https://www.tspsc.gov.in/syllabus",
      fileSize: "Web Link",
      downloadsCount: 310,
      status: "Published",
      createdAt: "2026-08-15"
    }
  ],
  announcements: [
    {
      id: "ann-1",
      title: "🚨 APPSC Group 2 Notification 2026 Released!",
      content: "Official notification for APPSC Group 2 screening test has been announced. Form submissions start from October 15th. The tentative Prelims screening exam is scheduled for January 24th, 2027. Gear up your preparation at Thiru Study Circle with daily mock tests!",
      type: "Exam",
      isPinned: true,
      createdAt: "2026-09-28"
    },
    {
      id: "ann-2",
      title: "New Batch Launch for SI & Constable Uniform Services",
      content: "A fresh physical coaching plus intensive digital study batch is starting this Monday at our Dilsukhnagar & Vizag branches. Enroll immediately to get standard hand-written material free of cost.",
      type: "News",
      isPinned: false,
      createdAt: "2026-09-25"
    },
    {
      id: "ann-3",
      title: "Interactive Live Doubt Clearing Class with Thiru Sir",
      content: "Thiru Sir will conduct a live interactive doubt-clearing session on YouTube & Student Portal on Indian Polity and AP History this Sunday at 5:00 PM. Keep your doubts prepared on Chapter-1 to Chapter-3.",
      type: "Alert",
      isPinned: true,
      createdAt: "2026-09-29"
    }
  ]
};
