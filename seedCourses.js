require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./backend/model/Course');
const Quiz = require('./backend/model/Quiz');

// Connect to MongoDB Atlas (from .env)
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/hustlehub';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});

// --- Courses ---
const sampleCourses = [
  {
    title: "Advanced Python Programming",
    description: "Deep dive into OOP, decorators, generators, and multithreading in Python.",
    courseLink: "https://www.youtube.com/watch?v=HGOBQPFzWKo",
    image: "../../visuals/python.png",
    duration: "5h 30min",
    category: "IT & Technology"
  },
  {
    title: "C++ Object-Oriented Programming",
    description: "Master classes, inheritance, polymorphism, and memory management in C++. ",
    courseLink: "https://www.youtube.com/watch?v=vLnPwxZdW4Y",
    image: "../../visuals/c++.jpeg",
    duration: "6h 0min",
    category: "IT & Technology"
  },
  {
    title: "Electrical Wiring & Safety",
    description: "Learn advanced home wiring, circuit design, and electrical safety standards.",
    courseLink: "https://www.youtube.com/watch?v=jY7J8bK0Lz8",
    image: "../../visuals/painter.jpeg",
    duration: "4h 15min",
    category: "Trades"
  },
  {
    title: "Advanced Plumbing Systems",
    description: "Understand drainage, venting, and complex plumbing systems.",
    courseLink: "https://www.youtube.com/watch?v=WoJjmNi8dDU",
    image: "../../visuals/plumbing.jpeg",
    duration: "3h 45min",
    category: "Trades"
  }
];

// --- Easy / Passable Quizzes ---
const sampleQuizzes = [
  {
    title: "Python Basics Quiz",
    questions: [
      { question: "Which language is this course about?", options: ["Java", "Python", "C++", "Ruby"], correctAnswer: 1 },
      { question: "Which symbol starts a comment in Python?", options: ["#", "//", "/*", "<!--"], correctAnswer: 0 },
      { question: "Which function prints text to the screen?", options: ["echo()", "print()", "log()", "show()"], correctAnswer: 1 },
      { question: "Which of these is a Python data structure?", options: ["List", "ArrayList", "Vector", "Stack"], correctAnswer: 0 },
      { question: "True or False: Python is case-sensitive.", options: ["True", "False"], correctAnswer: 0 },
      { question: "Which keyword defines a function in Python?", options: ["function", "def", "fun", "method"], correctAnswer: 1 },
      { question: "What is the correct way to write 'Hello'?", options: ["'Hello'", '"Hello"', "Both", "None"], correctAnswer: 2 },
      { question: "Empty lists are considered True or False?", options: ["True", "False"], correctAnswer: 1 },
      { question: "Which is used for loops in Python?", options: ["for", "loop", "repeat", "iterate"], correctAnswer: 0 },
      { question: "Python files end with which extension?", options: [".py", ".java", ".cpp", ".txt"], correctAnswer: 0 }
    ],
    passingScore: 70,
    timeLimit: 15
  },
  {
    title: "C++ Basics Quiz",
    questions: [
      { question: "Which language is this course about?", options: ["C#", "C++", "Python", "Java"], correctAnswer: 1 },
      { question: "Which symbol starts a comment in C++?", options: ["//", "#", "/*", "--"], correctAnswer: 0 },
      { question: "Which header is needed for cout?", options: ["<iostream>", "<stdio.h>", "<stdlib.h>", "<string>"], correctAnswer: 0 },
      { question: "Which keyword defines a class?", options: ["class", "struct", "object", "define"], correctAnswer: 0 },
      { question: "What symbol ends a C++ statement?", options: [";", ".", ":", ","], correctAnswer: 0 },
      { question: "True or False: C++ is case-sensitive.", options: ["True", "False"], correctAnswer: 0 },
      { question: "Which operator is used to access members of a class?", options: [".", "->", "Both", "*"], correctAnswer: 2 },
      { question: "Which is used for loops in C++?", options: ["for", "loop", "repeat", "iterate"], correctAnswer: 0 },
      { question: "Which keyword allocates memory dynamically?", options: ["malloc", "new", "allocate", "dynamic"], correctAnswer: 1 },
      { question: "C++ files end with which extension?", options: [".cpp", ".java", ".py", ".txt"], correctAnswer: 0 }
    ],
    passingScore: 70,
    timeLimit: 15
  },
  {
    title: "Electrical Basics Quiz",
    questions: [
      { question: "What color is usually used for ground wire?", options: ["Red", "Green", "Black", "White"], correctAnswer: 1 },
      { question: "What device protects against overcurrent?", options: ["Fuse", "MCB", "Switch", "Battery"], correctAnswer: 1 },
      { question: "Standard household voltage?", options: ["110V or 220V", "12V", "5V", "500V"], correctAnswer: 0 },
      { question: "Which carries current to appliances?", options: ["Live", "Neutral", "Earth", "Ground"], correctAnswer: 0 },
      { question: "Always turn off ____ before electrical work.", options: ["water", "main breaker", "TV", "internet"], correctAnswer: 1 },
      { question: "Tool to measure voltage?", options: ["Voltmeter", "Ruler", "Hammer", "Screwdriver"], correctAnswer: 0 },
      { question: "True or False: Neutral wire is safe to touch.", options: ["True", "False"], correctAnswer: 1 },
      { question: "What does MCB stand for?", options: ["Miniature Circuit Breaker", "Main Cable Box", "Machine Circuit Board", "Motor Control Board"], correctAnswer: 0 },
      { question: "Which wire carries current back to source?", options: ["Live", "Neutral", "Earth", "Hot"], correctAnswer: 1 },
      { question: "Device to stop electrical leakage?", options: ["MCB", "RCCB", "Fuse", "Relay"], correctAnswer: 1 }
    ],
    passingScore: 70,
    timeLimit: 15
  },
  {
    title: "Plumbing Basics Quiz",
    questions: [
      { question: "Purpose of P-trap?", options: ["Prevent odors", "Increase pressure", "Filter water", "Drain faster"], correctAnswer: 0 },
      { question: "Tool to tighten pipes?", options: ["Hammer", "Pipe wrench", "Screwdriver", "Plier"], correctAnswer: 1 },
      { question: "Which pipe is used for hot water?", options: ["PVC", "CPVC", "Iron", "Aluminum"], correctAnswer: 1 },
      { question: "Low water pressure caused by?", options: ["High demand", "Blocked pipes", "Faulty valves", "All"], correctAnswer: 3 },
      { question: "Teflon tape is used for?", options: ["Seal pipes", "Lubricate", "Mark pipes", "Cut pipes"], correctAnswer: 0 },
      { question: "What is water hammer?", options: ["Pipe banging", "Frozen pipe", "High flow", "Low flow"], correctAnswer: 0 },
      { question: "Which fitting connects pipes of different diameter?", options: ["Reducer", "Coupling", "Elbow", "Union"], correctAnswer: 0 },
      { question: "Vent pipe does?", options: ["Balance air pressure", "Store water", "Increase flow", "Filter"], correctAnswer: 0 },
      { question: "True or False: Pipes must slope slightly for drainage.", options: ["True", "False"], correctAnswer: 0 },
      { question: "Purpose of backflow preventer?", options: ["Stops leaks", "Prevents reverse flow", "Reduces hammer", "Marks pipes"], correctAnswer: 1 }
    ],
    passingScore: 70,
    timeLimit: 15
  }
];

// --- Setup ---
async function setupLearningHub() {
  try {
    console.log('🚀 Setting up Learning Hub...');
    
    await Course.deleteMany({});
    await Quiz.deleteMany({});
    console.log('🧹 Cleared existing courses and quizzes');
    
    const courses = await Course.insertMany(sampleCourses);
    console.log(`✅ Added ${courses.length} courses`);
    
    for (let i = 0; i < courses.length; i++) {
      const quiz = sampleQuizzes[i];
      quiz.courseId = courses[i]._id;
      await Quiz.create(quiz);
    }
    console.log(`✅ Added ${sampleQuizzes.length} quizzes`);
    
    console.log('🎉 Learning Hub setup completed successfully!');
    courses.forEach(course => {
      console.log(`- ${course.title}: ${course.courseLink}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up Learning Hub:', error);
  } finally {
    mongoose.connection.close();
  }
}

setupLearningHub();
