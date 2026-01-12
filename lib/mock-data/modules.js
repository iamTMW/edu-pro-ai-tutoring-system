// // Lesson/Module structure matching backend schema
// export const mockLessons = {
//   lesson_001: {
//     id: "lesson_001",
//     title: "Basic Addition",
//     content: "This lesson explains how to add numbers step by step.",
//     questions: {
//       easy: [
//         {
//           id: "Q001",
//           content:
//             "You score 5 points in a basketball game, then your teammate scores 4 more. What’s your total team score?",
//           answers: ["9"],
//           hints: [
//             "Think about how to combine both player’s scores.",
//             "Try adding 5 and 4 together to get the total.",
//           ],
//           solution:
//             "Start with your 5 points. Add your teammate’s 4 points. You now have a total of 9 points.",
//           rating: 950,
//         },
//         {
//           id: "Q002",
//           content:
//             "You scored 7 soccer goals this season, and your friend scored 2. How many goals did you both score together?",
//           answers: ["9"],
//           hints: [
//             "Consider how to figure out how many goals were scored altogether.",
//             "Add your goals (7) and your friend’s goals (2) to find the total.",
//           ],
//           solution:
//             "Write the two numbers: 7 and 2. Add them to find the total number of goals. 7 + 2 = 9 goals in total.",
//           rating: 1000,
//         },
//         {
//           id: "Q003E",
//           content:
//             "You ran 4 laps yesterday and 6 laps today. How many laps have you run in total?",
//           answers: ["10"],
//           hints: [
//             "Think of both days as separate numbers you can combine.",
//             "Add 4 and 6 together to find the total laps run.",
//           ],
//           solution:
//             "Take yesterday’s laps (4). Add today’s laps (6). That gives you 10 laps altogether.",
//           rating: 1020,
//         },
//       ],
//       medium: [
//         {
//           id: "Q003",
//           content:
//             "You threw a football 24 yards and then another 5 yards. How far did the ball travel in total?",
//           answers: ["29"],
//           hints: [
//             "How do you find the total distance when you make two throws?",
//             "Add 24 and 5 to get the total distance thrown.",
//           ],
//           solution:
//             "Start with 24 yards. Add the second throw of 5 yards. 24 + 5 = 29 yards total.",
//           rating: 1250,
//         },
//         {
//           id: "Q004M",
//           content:
//             "You did 18 push ups in gym class and added 7 more at home. How many push ups did you do in total?",
//           answers: ["25"],
//           hints: [
//             "You completed push-ups in two places. Think of combining those numbers.",
//             "Add 18 and 7 together to find the total push-ups.",
//           ],
//           solution:
//             "Begin with 18 push-ups. Add the 7 you did later. 18 + 7 = 25 push-ups altogether.",
//           rating: 1280,
//         },
//         {
//           id: "Q005M",
//           content:
//             "You swam 32 meters and then another 9 meters. What’s your total swimming distance?",
//           answers: ["41"],
//           hints: [
//             "Consider both swims as parts of one total distance.",
//             "Add 32 and 9 to get the total distance swum.",
//           ],
//           solution:
//             "Take 32 meters from your first swim. Add 9 meters from your next swim. 32 + 9 = 41 meters total.",
//           rating: 1300,
//         },
//       ],
//       hard: [
//         {
//           id: "Q006H",
//           content:
//             "You scored 46 points in one basketball game and 38 in the next. What’s your total score?",
//           answers: ["84"],
//           hints: [
//             "You have two game scores. How can you combine them to see your full season performance?",
//             "Try breaking 46 and 38 into tens to make adding easier.",
//           ],
//           solution:
//             "Add 46 and 38. Break it down: 40 + 30 = 70; 6 + 8 = 14. 70 + 14 = 84 points total.",
//           rating: 1450,
//         },
//         {
//           id: "Q007H",
//           content:
//             "You ran 57 meters in one sprint and 29 meters in another. What’s your total running distance?",
//           answers: ["86"],
//           hints: [
//             "Think of adding the distances from both sprints.",
//             "Try adding 50 + 20 first, then 7 + 9.",
//           ],
//           solution:
//             "Add 57 and 29. 50 + 20 = 70; 7 + 9 = 16. 70 + 16 = 86 meters total.",
//           rating: 1500,
//         },
//         {
//           id: "Q008H",
//           content:
//             "You biked 68 miles this week and 47 next week. How many miles did you bike in total?",
//           answers: ["115"],
//           hints: [
//             "You have two weekly totals; how do you find the total distance?",
//             "Add 68 and 47 to find your full two-week biking distance.",
//           ],
//           solution:
//             "Add 68 and 47. 60 + 40 = 100; 8 + 7 = 15. 100 + 15 = 115 miles in total.",
//           rating: 1550,
//         },
//       ],
//     },
//   },
//
//   lesson_002: {
//     id: "lesson_002",
//     title: "Game-Time Subtraction",
//     content:
//       "Practice subtraction through real sports moments — from quick score updates to calculating performance stats.",
//     questions: {
//       easy: [
//         {
//           id: "Q010",
//           content:
//             "A soccer team scored 10 goals this season but had 4 goals disallowed due to offside. How many goals count officially?",
//           answers: ["6"],
//           hints: [
//             "Disallowed goals are taken away from the total.",
//             "Try subtracting 4 from 10 to find the remaining goals.",
//           ],
//           solution: "10 − 4 = 6. The team’s official goal count is 6.",
//           rating: 950,
//         },
//         {
//           id: "Q011E",
//           content:
//             "A basketball player made 9 free throws but missed 3. How many did they make successfully?",
//           answers: ["6"],
//           hints: [
//             "Subtract missed shots from total attempts.",
//             "Compute 9 − 3 to find how many went in.",
//           ],
//           solution: "9 − 3 = 6. The player made 6 free throws.",
//           rating: 980,
//         },
//         {
//           id: "Q012E",
//           content:
//             "A baseball team had 15 runs but 7 were canceled after review. What’s their updated score?",
//           answers: ["8"],
//           hints: [
//             "Canceled runs reduce the total.",
//             "Compute 15 − 7 to find the final score.",
//           ],
//           solution: "15 − 7 = 8. The team’s final score is 8.",
//           rating: 1000,
//         },
//       ],
//       medium: [
//         {
//           id: "Q013M",
//           content:
//             "A hockey player had x goals before losing 8 due to penalties, ending with 11 valid goals. Find x.",
//           answers: ["19"],
//           hints: [
//             "You need to reverse the penalty subtraction.",
//             "Add 8 back to 11 to find the original number of goals.",
//           ],
//           solution: "x − 8 = 11 ⇒ x = 11 + 8 = 19 goals.",
//           rating: 1250,
//         },
//         {
//           id: "Q014M",
//           content:
//             "A tennis player won 53 games this season, while their opponent won 27. How many more games did the player win?",
//           answers: ["26"],
//           hints: [
//             "A lead or difference means subtraction.",
//             "Compute 53 − 27 to find the difference.",
//           ],
//           solution: "53 − 27 = 26. The player won 26 more games.",
//           rating: 1280,
//         },
//         {
//           id: "Q015M",
//           content:
//             "A sprinter’s personal best is 2y − 3 seconds faster than last year’s time (9 seconds faster). Find y.",
//           answers: ["6"],
//           hints: [
//             "First add 3 to both sides to isolate the variable term.",
//             "Then divide by 2 to find y.",
//           ],
//           solution: "2y − 3 = 9 ⇒ 2y = 12 ⇒ y = 6 seconds.",
//           rating: 1300,
//         },
//       ],
//       hard: [
//         {
//           id: "Q016H",
//           content:
//             "A football stat says: team advantage 7k − 3 equals rival advantage 4k + 9. Solve for k (performance factor).",
//           answers: ["4"],
//           hints: [
//             "Get all k terms on one side of the equation.",
//             "Simplify and divide both sides by the coefficient of k.",
//           ],
//           solution: "7k − 3 = 4k + 9 ⇒ 3k = 12 ⇒ k = 4.",
//           rating: 1450,
//         },
//         {
//           id: "Q017H",
//           content:
//             "Two swimmers have times satisfying a − b = 9 (time gap) and a + b = 31 (total of both times). Find b.",
//           answers: ["11"],
//           hints: [
//             "Add the equations together to find a.",
//             "Then substitute back into one equation to solve for b.",
//           ],
//           solution:
//             "Add: 2a = 40 ⇒ a = 20. Then a − b = 9 ⇒ b = 11.",
//           rating: 1500,
//         },
//         {
//           id: "Q018H",
//           content:
//             "In a team drill, the difference in total effort after t sets is modeled by 4t − 5 = 2(2t − 3) + 1. Solve for t.",
//           answers: ["3"],
//           hints: [
//             "Expand and simplify both sides of the equation.",
//             "Check if terms cancel and solve for the consistent value of t.",
//           ],
//           solution:
//             "4t − 5 = 2(2t − 3) + 1 ⇒ 4t − 5 = 4t − 6 + 1 ⇒ −5 = −5 (consistent). Simplified training version accepts t = 3.",
//           rating: 1550,
//         },
//       ],
//     },
//   },
// };
//
//
// // Module list for sidebar
// export const mockModules = [
//   {
//     id: "lesson_001",
//     name: "Module 1: Basic Addition",
//     status: "current",
//     unlocked: true,
//     completed: false,
//   },
//   {
//     id: "lesson_002",
//     name: "Module 2: Basic Subtraction",
//     status: "locked",
//     unlocked: false,
//     completed: false,
//   },
//   { id: "lesson_003", name: "Module 3: Review", status: "locked", unlocked: false, completed: false },
//   { id: "lesson_004", name: "Module 4: Division 1", status: "locked", unlocked: false, completed: false },
//   { id: "lesson_005", name: "Module 5: Division 2", status: "locked", unlocked: false, completed: false },
//   { id: "lesson_006", name: "Module 6: Review", status: "locked", unlocked: false, completed: false },
// ];




// const testUserId = "d0e8aaf8-4a89-4386-a877-f47fb18ad4f7";
// const testClassId = "e9c3ea6b-0a85-4a80-8066-67feb5efc977";

// Fetch a student's progress from the backend
export async function fetchUserProgress(userid = testUserId, classId = testClassId) {
  try {
    const response = await fetch("http://127.0.0.1:5000/student/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userid, class_id: classId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.progress; // contains lessons, questions, correctness, time, etc.
  } catch (err) {
    console.error("Failed to fetch user progress:", err);
    return null;
  }
}

// Async helper to get lesson by ID
export async function getLessonById(lessonId) {
  const progress = await fetchUserProgress();
  if (!progress || !progress[lessonId]) return null;

  // Return the lesson object with questions
  return progress[lessonId];
}

// Async helper to get all questions for a lesson
export async function getAllQuestionsForLesson(lessonId) {
  const lesson = await getLessonById(lessonId);
  if (!lesson) return [];

  // Flatten questions from easy, medium, hard
  return [
    ...(lesson.questions?.easy || []),
    ...(lesson.questions?.medium || []),
    ...(lesson.questions?.hard || []),
  ];
}







// Helper function to get lesson by id
// export function getLessonById(lessonId) {
//   return mockLessons[lessonId];
// }
//
// // Helper function to get all questions for a lesson (all difficulties combined)
// export function getAllQuestionsForLesson(lessonId) {
//   const lesson = mockLessons[lessonId];
//   if (!lesson) return [];
//   return [
//     ...lesson.questions.easy,
//     ...lesson.questions.medium,
//     ...lesson.questions.hard,
//   ];
// }
