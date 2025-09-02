const mongoose = require('mongoose');
const Course = require('../backend/model/Course');
const Quiz = require('../backend/model/Quiz');

// Connect to MongoDB (adjust connection string as needed)
mongoose.connect('mongodb://localhost:27017/hustlehub', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const sampleCourses = [
  {
    title: "Python Programming Basics",
    description: "Learn the fundamentals of Python programming language",
    courseLink: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
    image: "python.png",
    duration: "2h 30min",
    category: "IT & Technology"
  },
  {
    title: "C++ Programming Fundamentals",
    description: "Master the basics of C++ programming",
    courseLink: "https://www.youtube.com/watch?v=8jLOx1hD3_o",
    image: "c++.jpeg",
    duration: "3h 15min",
    category: "IT & Technology"
  },
  {
    title: "Home Repair Basics",
    description: "Learn essential home repair and maintenance skills",
    courseLink: "https://www.youtube.com/watch?v=example",
    image: "painter.jpeg",
    duration: "1h 45min",
    category: "Trades"
  },
  {
    title: "Plumbing Essentials",
    description: "Master basic plumbing techniques and repairs",
    courseLink: "https://www.youtube.com/watch?v=example2",
    image: "plumbing.jpeg",
    duration: "2h 0min",
    category: "Trades"
  }
];

const sampleQuizzes = [
  {
    title: "Python Basics Quiz",
    questions: [
      {
        question: "What is Python?",
        options: [
          "A snake species",
          "A programming language",
          "A type of computer",
          "A software company"
        ],
        correctAnswer: 1
      },
      {
        question: "How do you print 'Hello World' in Python?",
        options: [
          "echo 'Hello World'",
          "print('Hello World')",
          "console.log('Hello World')",
          "printf('Hello World')"
        ],
        correctAnswer: 1
      },
      {
        question: "What symbol is used for comments in Python?",
        options: [
          "//",
          "/* */",
          "#",
          "--"
        ],
        correctAnswer: 2
      }
    ],
    passingScore: 70,
    timeLimit: 15
  },
  {
    title: "C++ Fundamentals Quiz",
    questions: [
      {
        question: "What is C++?",
        options: [
          "A programming language",
          "A type of coffee",
          "A computer brand",
          "A software tool"
        ],
        correctAnswer: 0
      },
      {
        question: "Which header is used for input/output in C++?",
        options: [
          "<stdio.h>",
          "<iostream>",
          "<input.h>",
          "<output.h>"
        ],
        correctAnswer: 1
      },
      {
        question: "What is the correct way to declare a variable in C++?",
        options: [
          "var x = 5;",
          "int x = 5;",
          "variable x = 5;",
          "x = 5;"
        ],
        correctAnswer: 1
      }
    ],
    passingScore: 70,
    timeLimit: 15
  },
  {
    title: "Home Repair Quiz",
    questions: [
      {
        question: "What tool is best for tightening screws?",
        options: [
          "Hammer",
          "Screwdriver",
          "Pliers",
          "Wrench"
        ],
        correctAnswer: 1
      },
      {
        question: "What should you do before starting any electrical work?",
        options: [
          "Turn off the power",
          "Call a friend",
          "Wear gloves",
          "Open windows"
        ],
        correctAnswer: 0
      }
    ],
    passingScore: 70,
    timeLimit: 10
  },
  {
    title: "Plumbing Basics Quiz",
    questions: [
      {
        question: "What is a common cause of clogged drains?",
        options: [
          "Too much water",
          "Hair and debris",
          "Cold weather",
          "Old pipes"
        ],
        correctAnswer: 1
      },
      {
        question: "What tool is used to tighten pipe connections?",
        options: [
          "Hammer",
          "Pipe wrench",
          "Screwdriver",
          "Pliers"
        ],
        correctAnswer: 1
      }
    ],
    passingScore: 70,
    timeLimit: 10
  }
];

async function setupLearningHub() {
  try {
    console.log('Setting up Learning Hub...');
    
    // Clear existing data
    await Course.deleteMany({});
    await Quiz.deleteMany({});
    console.log('Cleared existing courses and quizzes');
    
    // Add courses
    const courses = await Course.insertMany(sampleCourses);
    console.log(`Added ${courses.length} courses`);
    
    // Add quizzes (matching with courses)
    for (let i = 0; i < courses.length; i++) {
      const quiz = sampleQuizzes[i];
      quiz.courseId = courses[i]._id;
      await Quiz.create(quiz);
    }
    console.log(`Added ${sampleQuizzes.length} quizzes`);
    
    console.log('Learning Hub setup completed successfully!');
    console.log('\nSample courses added:');
    courses.forEach(course => {
      console.log(`- ${course.title}: ${course.courseLink}`);
    });
    
  } catch (error) {
    console.error('Error setting up Learning Hub:', error);
  } finally {
    mongoose.connection.close();
  }
}

setupLearningHub();
