"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { fetchUserProgress } from "@/lib/mock-data/modules";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import QuestionCard from "@/components/modules/QuestionCard";
import ModuleList from "@/components/modules/ModuleList";
import { ThemeToggle } from "@/components/modules/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

import Link from "next/link";

const LOCAL_HOST = "http://127.0.0.1:5000";

// --- Adaptive MMR helpers ---
const expected = (ru, rq) => 1 / (1 + Math.pow(10, (rq - ru) / 400));
const baseK = (rq) => (rq >= 1500 ? 48 : rq >= 1100 ? 36 : 28);
const streakMult = (streak) =>
  streak >= 8 ? 1.5 : streak >= 5 ? 1.25 : streak >= 3 ? 1.1 : 1.0;

function updateMMR({ ru, rq, correct, streak }) {
  const E = expected(ru, rq);
  const S = correct ? 1 : 0;
  const K = baseK(rq);
  const mult = streakMult(streak);
  const delta = K * (S - E) * mult;
  const newRU = Math.max(200, Math.round(ru + delta));
  try {
    localStorage.setItem("pp_mmr", String(newRU));
  } catch {
    // ignore
  }
  return { ru: newRU };
}

// --- Difficulty + timer ---
const DIFFS = /** @type const */ (["easy", "medium", "hard"]);

// --- Build question ID map ---
function buildIdMap(lesson) {
  const map = {};
  for (const diff of DIFFS) {
    (lesson?.questions?.[diff] || []).forEach((q) => {
      map[q.id] = { ...q, difficulty: diff };
    });
  }
  return map;
}

// --- Main component ---
export default function DashboardContent({ user }) {
  const { logout } = useAuth();

  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [lessonContent, setLessonContent] = useState("");

  const [pathByModule, setPathByModule] = useState({});
  const [pathIndex, setPathIndex] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState({});
  const [reviewByModule, setReviewByModule] = useState({});
  const [difficulty, setDifficulty] = useState("easy");
  const [ru, setRU] = useState(1100);
  const [streak, setStreak] = useState(0);
  const questionStartTsRef = useRef(null);

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  // --- State for teacher/parent views ---
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [teacherStudents, setTeacherStudents] = useState({});
  const [parentStudents, setParentStudents] = useState([]); // objects from students-progress
  const [parentProgress, setParentProgress] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // --- Which student's data are we showing? ---
  const [selectedStudentId, setSelectedStudentId] = useState(
    user?.role === "PARENT" ? null : user?.userid
  );

  // The userid actually used for all student APIs
  const effectiveUserId =
    user?.role === "PARENT" ? selectedStudentId : user?.userid;

  // Helper flags
  const isParent = user?.role === "PARENT";
  const isTeacher = user?.role === "TEACHER";
  const hideStreakAndDiff = isParent || isTeacher;

  useEffect(() => {
  if (!modules || modules.length === 0) return;

  // Pick the first unlocked module if available, otherwise first module
  const firstModule =
    modules.find((m) => m.unlocked || !m.completed) || modules[0];

  if (firstModule && firstModule.id !== selectedModuleId) {
    handleViewContent(firstModule);
  }
}, [modules, selectedClassId]);

  // --- Fetch classrooms for student / selected child ---
  useEffect(() => {
    async function loadClasses() {
      if (!effectiveUserId) return;

      console.log("Loading classes for", effectiveUserId);

      try {
        const res = await fetch(`${LOCAL_HOST}/student/classes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userid: effectiveUserId }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.classes)) {
          setClasses(data.classes);
          if (data.classes.length > 0) {
            setSelectedClassId((prev) => prev ?? data.classes[0].classid);
          }
        }

        console.log(data.classes);
      } catch (err) {
        console.error("Failed to fetch classes", err);
      }
    }
    loadClasses();
  }, [effectiveUserId]);

  // --- Fetch modules whenever selectedClassId or effectiveUserId changes ---
  useEffect(() => {
    async function loadModules() {
      if (!effectiveUserId || !selectedClassId) return;

      const progress = await fetchUserProgress(effectiveUserId, selectedClassId);
      if (!progress) return;

      console.log(progress);

      const loadedModules = Object.values(progress.lessons).map(
        (lesson, index) => {
          const unlocked = lesson.unlocked ?? (index === 0);
          const completed = lesson.completed ?? false;

          let status = "locked";
          if (completed) status = "completed";
          else if (unlocked) status = "unlocked";
          if (index === 0 && !completed) status = "current";

          return {
            id: lesson.id,
            name: lesson.title || `Module ${index + 1}`,
            unlocked,
            completed,
            questions: lesson.questions,
            status,
          };
        }
      );

      console.log("Loaded Modules");
      console.log(loadedModules);

      setModules(loadedModules);

    // Pick first module to auto-load content
        if (loadedModules.length > 0) {
          const firstModule = loadedModules.find(m => m.unlocked || !m.completed) || loadedModules[0];
          setSelectedModuleId(firstModule.id); // update selected module
          handleViewContent(firstModule);       // fetch lesson content
        }
    }

    loadModules();
  }, [effectiveUserId, selectedClassId]);

  // --- Selected module / lesson ---
  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId),
    [modules, selectedModuleId]
  );

  const idMap = useMemo(() => buildIdMap(selectedModule), [selectedModule]);

  // --- Lesson-level summary for parent/teacher views ---
  const lessonSummary = useMemo(() => {
    if (!selectedModule) return null;

    let total = 0;
    let answered = 0;
    let correct = 0;
    let incorrect = 0;
    let totalTime = 0;

    DIFFS.forEach((diff) => {
      (selectedModule.questions?.[diff] || []).forEach((q) => {
        total += 1;
        // q.correct is expected to be true/false or undefined
        if (typeof q.correct === "boolean") {
          answered += 1;
          if (q.correct) correct += 1;
          else incorrect += 1;
        }
        if (typeof q.time_taken === "number") {
          totalTime += q.time_taken;
        }
      });
    });

    const avgTime = answered > 0 ? totalTime / answered : 0;

    return {
      total,
      answered,
      correct,
      incorrect,
      avgTime: Math.round(avgTime),
    };
  }, [selectedModule]);

  // --- Populate question path when module changes ---
  useEffect(() => {
    if (!selectedModule) return;

    const usedIds = new Set();
    const path = [];

    DIFFS.forEach((diff) => {
      (selectedModule.questions[diff] || []).forEach((q) => {
        if (!usedIds.has(q.id)) {
          path.push({ id: q.id, difficulty: diff });
          usedIds.add(q.id);
        }
      });
    });

    setPathByModule((prev) => ({
      ...prev,
      [selectedModuleId]: path,
    }));

    setPathIndex(0);
    setStreak(0);
    setDifficulty("easy");

    setReviewByModule((prev) => ({
      ...prev,
      [selectedModuleId]: selectedModule.completed,
    }));
  }, [selectedModule, selectedModuleId]);

  const currentPath = pathByModule[selectedModuleId] || [];
  const currentPathItem = currentPath[pathIndex] || null;
  const currentQuestion = currentPathItem
    ? idMap[currentPathItem.id]
    : null;
  const currentModuleCompleted =
    completedQuestions[selectedModuleId] || new Set();

  // --- Initialize streak and difficulty ---
  useEffect(() => {
    setStreak(0);
    setDifficulty("easy");
    const storedRU = Number(localStorage.getItem("pp_mmr"));
    if (!Number.isNaN(storedRU) && storedRU) setRU(storedRU);
  }, []);

  // --- Update localStorage for streak / difficulty ---
  useEffect(() => {
    localStorage.setItem("pp_streak_ui", String(streak));
  }, [streak]);

  useEffect(() => {
    localStorage.setItem("pp_diff_hidden", difficulty);
  }, [difficulty]);

  // --- Update difficulty when current question changes ---
  useEffect(() => {
    questionStartTsRef.current = Date.now();
    if (
      currentPathItem?.difficulty &&
      currentPathItem.difficulty !== difficulty
    ) {
      setDifficulty(currentPathItem.difficulty);
    }
  }, [currentPathItem?.id, pathIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Lesson content fetch ---
  const handleViewContent = async (module) => {
    if (!module || !selectedClassId) return;

    // Set the selected module
    setSelectedModuleId(module.id);

    try {
      const res = await fetch(`${LOCAL_HOST}/lesson-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: selectedClassId,
          lesson_id: module.id,
        }),
      });
      const data = await res.json();
      setLessonContent(
        data.success
          ? data.html
          : `<p style="color:red">${data.message}</p>`
      );
    } catch (err) {
      setLessonContent(
        `<p style="color:red">Error fetching lesson content</p>`
      );
    }
  };

  // --- Handle question answer (students/teachers; parents won't see QuestionCard) ---
  const handleQuestionAnswer = async ({
    correct,
    hintsUsed = 0,
    usedSolution = false,
    wrongAttempts = 0,
  }) => {
    if (!currentQuestion || !effectiveUserId) return;

    // --- Update MMR ---
    const deltaRU = updateMMR({
      ru,
      rq: currentQuestion.rating ?? 1100,
      correct,
      streak,
    });
    setRU(deltaRU.ru);

    // --- Mark question as completed locally ---
    const newCompleted = new Set(currentModuleCompleted);
    if (correct) newCompleted.add(currentQuestion.id);
    setCompletedQuestions((prev) => ({
      ...prev,
      [selectedModuleId]: newCompleted,
    }));

    // --- Update streak ---
    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);

    // --- Check module completion locally ---
    const allIds = currentPath.map((q) => q.id);
    const moduleCompleted = allIds.every((id) => newCompleted.has(id));

    if (moduleCompleted) {
      // Call backend to mark lesson complete
      try {
        const res = await fetch(`${LOCAL_HOST}/student/complete-lesson`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userid: effectiveUserId,
            class_id: selectedClassId,
            lesson_id: selectedModuleId,
          }),
        });
        const data = await res.json();
        if (data.success) {
          alert(
            data.message || `Module "${selectedModule.name}" completed!`
          );

          // Refresh modules from backend
          const progress = await fetchUserProgress(
            effectiveUserId,
            selectedClassId
          );
          if (progress) {
            const loadedModules = Object.values(
              progress.lessons
            ).map((lesson, index) => {
              const unlocked = lesson.unlocked ?? (index === 0);
              const completed = lesson.completed ?? false;

              let status = "locked";
              if (completed) status = "completed";
              else if (unlocked) status = "unlocked";
              if (index === 0 && !completed) status = "current";

              return {
                id: lesson.id,
                name: lesson.title || `Module ${index + 1}`,
                unlocked,
                completed,
                questions: lesson.questions,
                status,
              };
            });
            setModules(loadedModules);
          }
        }
      } catch (err) {
        console.error("Failed to complete lesson", err);
        alert("Error completing lesson. Please try again.");
      }
    } else {
      // --- Move to next question if not finished ---
      if (correct) {
        setPathIndex((prev) =>
          Math.min(prev + 1, currentPath.length - 1)
        );
      }
    }
  };

  const handlePrevious = () => setPathIndex(Math.max(pathIndex - 1, 0));
  const handleNext = () =>
    setPathIndex(Math.min(pathIndex + 1, currentPath.length - 1));

  const answeredCount = currentPath.filter((p) =>
    currentModuleCompleted.has(p.id)
  ).length;
  const progressValue =
    currentPath.length > 0 ? (answeredCount / currentPath.length) * 100 : 0;

  const streakTier =
    streak >= 10
      ? "bg-red-500/20 text-red-600 border-red-500/40"
      : streak >= 7
      ? "bg-orange-500/20 text-orange-600 border-orange-500/40"
      : streak >= 4
      ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/40"
      : "bg-gray-200 text-gray-700 border-gray-400";

  const streakEmoji =
    streak >= 3 ? "🔥🔥" : streak >= 2 ? "🔥" : streak >= 1 ? "⚡️" : "•";

  const diffBadge =
    difficulty === "hard"
      ? "bg-fuchsia-600/20 text-fuchsia-700 border-fuchsia-500/60"
      : difficulty === "medium"
      ? "bg-blue-600/20 text-blue-700 border-blue-500/60"
      : "bg-emerald-600/20 text-emerald-700 border-emerald-500/60";

  // --- Fetch teacher classes and students ---
  useEffect(() => {
    async function fetchTeacherData() {
      if (user?.role === "TEACHER") {
        setLoadingExtra(true);
        try {
          // Get all classes for this teacher
          const res = await fetch(`${LOCAL_HOST}/teacher/classes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userid: user.userid }),
          });
          const data = await res.json();
          setTeacherClasses(data.classes || []);

          // For each class, get students
          const studentsByClass = {};
          for (const cls of data.classes || []) {
            const studentsRes = await fetch(
              `${LOCAL_HOST}/teacher/students`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  class_id:
                    cls.class_id || cls.classid || cls.id,
                }),
              }
            );
            const studentsData = await studentsRes.json();
            studentsByClass[
              cls.class_id || cls.classid || cls.id
            ] = studentsData.students || [];
          }
          setTeacherStudents(studentsByClass);
        } catch (err) {
          console.error("Failed to fetch teacher data", err);
        } finally {
          setLoadingExtra(false);
        }
      }
    }
    fetchTeacherData();
  }, [user]);

  // --- Fetch parent students and their progress (for selector) ---
  useEffect(() => {
    async function fetchParentData() {
      if (user?.role !== "PARENT") return;

      setLoadingExtra(true);
      try {
        const progressRes = await fetch(
          `${LOCAL_HOST}/parent/students-progress`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parent_userid: user.userid }),
          }
        );
        const progressData = await progressRes.json();
        const students = progressData.students_progress || [];
        setParentStudents(students);
        setParentProgress(students);

        // Default selected student
        if (!selectedStudentId && students.length > 0) {
          setSelectedStudentId(students[0].student_id);
        }
      } catch (err) {
        console.error("Failed to fetch parent data", err);
      } finally {
        setLoadingExtra(false);
      }
    }
    fetchParentData();
  }, [user?.role, user?.userid]); // don't depend on selectedStudentId to avoid loops

  // ---- NEW: flag for incomplete lesson in observer view (parent/teacher) ----
  const showOnlyIncompleteMessage =
    (isParent || isTeacher) &&
    selectedModule &&
    selectedModule.completed === false;

  // --- Main content view ---
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 border-r bg-gray-50 dark:bg-gray-900">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">
              Good Morning, {user?.username || "Student"}
            </h1>
            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600
                     text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Settings
              </Link>
              <ThemeToggle />
            </div>
          </div>

          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="w-full mt-2"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>

          <Button asChild variant="default" size="sm" className="w-full mt-2">
            <Link href="/student-progress">
              {/* or "/dashboard" if you prefer */}
              View Learning Overview
            </Link>
          </Button>

          {/* Parent: select which student's data to view */}
          {user?.role === "PARENT" && parentStudents.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Viewing student
              </label>
              <select
                value={selectedStudentId || ""}
                onChange={(e) => {
                  const newClassId = e.target.value;
                  setSelectedClassId(newClassId);
                  setSelectedModuleId(null);  // so effect will pick first lesson
                  setLessonContent("");        // clear content while loading
                }}
                className="w-full rounded border px-2 py-1 text-sm"
              >
                {parentStudents.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.student_name || s.student_id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* --- Classroom dropdown --- */}
          {classes.length > 0 && effectiveUserId && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Select Class
              </label>
              <select
                  value={selectedClassId || ""}
                  onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {classes.map((c) => (
                    <option key={c.classid} value={c.classid}>
                      {c.class_name || "Unnamed Class"}
                    </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <ModuleList
            modules={modules}
          selectedModule={selectedModule}
          onModuleSelect={(module) => handleViewContent(module)}
          onViewContent={handleViewContent}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardContent>
              <Button
                onClick={() =>
                  selectedModule && handleViewContent(selectedModule)
                }
                className="mb-4"
                disabled={!selectedModule || !selectedClassId}
              >
                View Lesson Content
              </Button>
              <div
                id="lesson-box"
                className="border rounded p-4 max-h-96 overflow-auto bg-white dark:bg-gray-800"
                dangerouslySetInnerHTML={{ __html: lessonContent }}
              ></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              {showOnlyIncompleteMessage ? (
                // ------- PARENT / TEACHER + lesson not complete -------
                <div className="text-gray-500">
                  Lesson not complete.
                </div>
              ) : (
                <>
                  {/* Summary block for parents/teachers (only if we’re not in the incomplete case) */}
                  {(user?.role === "PARENT" || user?.role === "TEACHER") &&
                    lessonSummary && (
                      <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-semibold">
                            Total questions:
                          </span>{" "}
                          {lessonSummary.total}
                        </div>
                        <div>
                          <span className="font-semibold">
                            Answered:
                          </span>{" "}
                          {lessonSummary.answered}
                        </div>
                        <div>
                          <span className="font-semibold">
                            Correct:
                          </span>{" "}
                          {lessonSummary.correct}
                        </div>
                        <div>
                          <span className="font-semibold">
                            Incorrect:
                          </span>{" "}
                          {lessonSummary.incorrect}
                        </div>
                      </div>
                    )}

                  {/* Streak + Difficulty ONLY for students */}
                  {!hideStreakAndDiff && (
                    <div className="flex justify-between items-center mb-2">
                      <div
                        className={`px-2 py-1 border rounded ${streakTier}`}
                      >
                        {streakEmoji} Streak: {streak}
                      </div>
                      <div
                        className={`px-2 py-1 border rounded ${diffBadge}`}
                      >
                        Difficulty: {difficulty}
                      </div>
                    </div>
                  )}

                  <Progress value={progressValue} className="mb-4" />

                  {/* QUESTIONS ONLY FOR NON-PARENTS */}
                  {!isParent && currentQuestion && (
                    <>
                      <QuestionCard
                        question={currentQuestion}
                        module={selectedModule}
                        onAnswer={handleQuestionAnswer}
                        userid={effectiveUserId}
                        classid={selectedClassId}
                      />

                      {/* Only show Next/Previous buttons if current question is answered */}
                      {currentModuleCompleted.has(currentQuestion.id) && (
                        <div className="flex justify-between mt-4">
                          <Button onClick={handlePrevious}>Previous</Button>
                          <Button onClick={handleNext}>Next</Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* What parents (or users with no questions) see instead */}
                  {(isParent || !currentQuestion) && (
                    <div className="text-gray-500 mt-2">
                      {selectedModule
                        ? isParent
                          ? "You are viewing a summary of this lesson. Questions are only available in the student view."
                          : "No questions remaining"
                        : "Select a module to begin"}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}