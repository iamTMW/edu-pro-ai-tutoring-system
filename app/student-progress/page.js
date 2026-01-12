"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function StudentLearningPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();

  const [classes, setClasses] = useState([]);
  const [progressByClass, setProgressByClass] = useState({});
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        // Fetch profile
        const profileRes = await fetch(`${API_BASE}/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userid: user.userid }),
        });

        const profileJson = await profileRes.json();

        if (profileJson.success && profileJson.profile) {
          setProfile(profileJson.profile);
        } else {
          setProfile(profileJson);
        }

        // Fetch classes
        const classesRes = await fetch(`${API_BASE}/student/classes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userid: user.userid }),
        });

        if (!classesRes.ok) {
          const txt = await classesRes.text().catch(() => "");
          setError(`Failed to load classes: ${txt || classesRes.statusText}`);
          setLoading(false);
          return;
        }

        const classesJson = await classesRes.json();
        if (!classesJson.success) {
          setError(classesJson.message || "Failed to load classes");
          setLoading(false);
          return;
        }

        const fetchedClasses = classesJson.classes || [];
        setClasses(fetchedClasses);

        // Fetch progress per class
        const progressMap = {};
        await Promise.all(
          fetchedClasses.map(async (cls) => {
            const classId = cls.class_id || cls.classid || cls.id;

            try {
              const progRes = await fetch(`${API_BASE}/student/progress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userid: user.userid, class_id: classId }),
              });

              if (progRes.ok) {
                const progJson = await progRes.json();
                progressMap[classId] =
                  progJson.progress ?? progJson.data ?? {};
              }
            } catch (err) {
              console.error("Failed to load progress", err);
            }
          })
        );

        setProgressByClass(progressMap);
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading your data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center 
                      bg-gray-100 dark:bg-slate-900 
                      text-gray-800 dark:text-gray-100">
        <p className="text-lg">Loading your learning data…</p>
      </div>
    );
  }

  if (!user) return null;

  // ---- Calculate Stats ----
  let totalQuestions = 0;
  let totalCorrect = 0;
  let lastCompletedLesson = "";
  let nextLesson = "";

  if (progressByClass && Object.keys(progressByClass).length > 0) {
    const firstClassId = Object.keys(progressByClass)[0];
    const progress = progressByClass[firstClassId];

    if (progress?.lessons) {
      const lessonKeys = Object.keys(progress.lessons);

      for (let i = 0; i < lessonKeys.length; i++) {
        const lesson = progress.lessons[lessonKeys[i]];

        if (lesson.completed) {
          lastCompletedLesson = lesson.title || lessonKeys[i];
          nextLesson =
            lessonKeys[i + 1] &&
            (progress.lessons[lessonKeys[i + 1]].title ||
              lessonKeys[i + 1]);
        }

        if (lesson.questions) {
          for (const diff of Object.keys(lesson.questions)) {
            for (const q of lesson.questions[diff]) {
              totalQuestions++;
              if (q.correct) totalCorrect++;
            }
          }
        }
      }

      if (!lastCompletedLesson) {
        for (const key of lessonKeys) {
          if (progress.lessons[key].unlocked) {
            nextLesson = progress.lessons[key].title || key;
            break;
          }
        }
      }
    }
  }

  const percentCorrect =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  const lastLogin = profile?.last_login
    ? new Date(profile.last_login).toLocaleString()
    : "—";

  return (
    <div className="min-h-screen 
                    bg-gray-100 dark:bg-gray-900 
                    text-gray-900 dark:text-gray-100 
                    px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Learning Overview</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              See your progress, classes, and activity in one place.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="text-right text-sm">
              <p className="font-semibold">{user.username}</p>
              <p className="text-gray-600 dark:text-gray-400 capitalize">
                {user.role?.toLowerCase()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Last login: {lastLogin}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-700"
                onClick={() => router.push("/dashboard")}
              >
                Go to Learning
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="flex flex-wrap gap-6 mb-6">
          <Card className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 min-w-[200px]">
            <CardHeader>
              <CardTitle>Correct Answers</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{percentCorrect}%</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {totalCorrect} out of {totalQuestions} questions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 min-w-[200px]">
            <CardHeader>
              <CardTitle>Last Completed Lesson</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-lg font-semibold">
                {lastCompletedLesson || "—"}
              </span>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700 min-w-[200px]">
            <CardHeader>
              <CardTitle>Next Lesson</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-lg font-semibold">
                {nextLesson || "—"}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Errors */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Class Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((cls) => {
            const classId = cls.classid || cls.class_id;
            const prog = progressByClass[classId] || {};

            let questionsAnswered = 0;
            let questionsCorrect = 0;
            let lessonsCompleted = 0;
            let totalLessons = 0;

            if (prog.lessons) {
              totalLessons = Object.keys(prog.lessons).length;
              for (const key of Object.keys(prog.lessons)) {
                const lesson = prog.lessons[key];
                if (lesson.completed) lessonsCompleted++;

                if (lesson.questions) {
                  for (const diff of Object.keys(lesson.questions)) {
                    for (const q of lesson.questions[diff]) {
                      questionsAnswered++;
                      if (q.correct) questionsCorrect++;
                    }
                  }
                }
              }
            }

            const accuracy =
              questionsAnswered > 0
                ? Math.round((questionsCorrect / questionsAnswered) * 100)
                : null;

            return (
              <Card
                key={classId}
                className="bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-700"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{cls.class_name || "Unnamed Class"}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {classId}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Questions Answered
                      </p>
                      <p className="text-lg font-semibold">
                        {questionsAnswered}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Correct Answers
                      </p>
                      <p className="text-lg font-semibold">
                        {questionsCorrect}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Lessons Completed
                      </p>
                      <p className="text-lg font-semibold">
                        {lessonsCompleted} / {totalLessons}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Accuracy
                      </p>
                      <p className="text-lg font-semibold">
                        {accuracy !== null ? `${accuracy}%` : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
