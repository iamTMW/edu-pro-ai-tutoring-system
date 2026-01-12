import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LeaderboardCard from "@/components/dashboard/LeaderboardCard";
import { ThemeToggle } from "@/components/modules/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { LogOut, Copy } from "lucide-react";

const LOCAL_HOST = "http://127.0.0.1:5000";

export default function TeacherDashboardContent({ user }) {
  const { logout } = useAuth();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const [students, setStudents] = useState([]);
  const [studentsProgress, setStudentsProgress] = useState({});
  // const [leaderboard, setLeaderboard] = useState({});
  const [deadlines, setDeadlines] = useState({});

  // --- Load all teacher classes ---
  useEffect(() => {
    if (!user?.userid) return;

    const loadClasses = async () => {
      try {
        const res = await fetch(`${LOCAL_HOST}/teacher/classes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userid: user.userid }),
        });
        const data = await res.json();

        if (data.success) {
          const list = data.classes || [];
          setClasses(list);

          if (list.length > 0 && !selectedClassId) {
            setSelectedClassId(list[0].classid);
          }
        }
      } catch (err) {
        console.error("Failed to load classes", err);
      }
    };

    loadClasses();
  }, [user?.userid, selectedClassId]);

  // --- Load students and their progress whenever selectedClassId changes ---
  useEffect(() => {
    if (!selectedClassId) return;

    const loadClassData = async () => {
      try {
        // Fetch students
        const sRes = await fetch(`${LOCAL_HOST}/teacher/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ class_id: selectedClassId }),
        });
        const sData = await sRes.json();

        let studentsList = [];
        if (sData.success && Array.isArray(sData.students)) {
          const profiles = await Promise.all(
            sData.students.map(async (userid) => {
              const pRes = await fetch(`${LOCAL_HOST}/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userid }),
              });
              const pData = await pRes.json();
              const username =
                pData.success && pData.profile?.username
                  ? pData.profile.username
                  : userid;
              return { userid, username };
            })
          );
          studentsList = profiles;
        }
        setStudents(studentsList);

        // Fetch progress
        const pRes = await fetch(`${LOCAL_HOST}/teacher/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ class_id: selectedClassId }),
        });
        const pData = await pRes.json();
        if (pData.success) {
          setStudentsProgress(pData.students_progress || {});
        }
      } catch (err) {
        console.error("Failed to load class data", err);
      }
    };

    loadClassData();
  }, [selectedClassId]);

  // --- Compute summary stats per student ---
  const studentSummaryRows = useMemo(() => {
    return students.map((student) => {
      const progress = studentsProgress[student.userid] || {};
      let totalLessons = 0,
        completedLessons = 0,
        totalQuestions = 0,
        correct = 0,
        wrong = 0,
        avgTime = 0;

      if (progress.lessons) {
        totalLessons = Object.keys(progress.lessons).length;
        Object.values(progress.lessons).forEach((lesson) => {
          if (lesson.completed) completedLessons += 1;

          const questionsByLevel = lesson.questions || {};
          Object.values(questionsByLevel).forEach((questions) => {
            (questions || []).forEach((q) => {
              totalQuestions += 1;
              if (q.correct === true) correct += 1;
              else if (q.correct === false) wrong += 1;
              if (q.time_taken) avgTime += Number(q.time_taken) || 0;
            });
          });
        });
      }

      const avgTimePerQuestion = totalQuestions > 0 ? Math.round(avgTime / totalQuestions) : 0;

      return {
        userid: student.userid,
        username: student.username,
        totalLessons,
        completedLessons,
        totalQuestions,
        correct,
        wrong,
        avgTimePerQuestion,
      };
    });
  }, [students, studentsProgress]);

  const copyClassId = async () => {
  if (!selectedClassId) return;

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(selectedClassId);
      alert("Class ID copied to clipboard!");
    } else {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = selectedClassId;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Class ID copied to clipboard!");
    }
  } catch (err) {
    console.error("Failed to copy class ID", err);
    alert("Failed to copy class ID");
  }
};

  const leaderboard = useMemo(() => {
  if (!studentSummaryRows || studentSummaryRows.length === 0) return [];

  // Sort students by number of correct questions descending
  const board = studentSummaryRows
    .map((s) => ({
      userid: s.userid,
      username: s.username,
      score: s.correct || 0,
    }))
    .sort((a, b) => b.score - a.score);

  return board;
}, [studentSummaryRows]);


  return (
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50 dark:bg-gray-900 p-4">
          <div className="mb-4">
            <h1 className="text-xl font-bold">
              Good Morning, {user?.username || "Teacher"}
            </h1>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Link
                href="/settings"
                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Settings
            </Link>
            <ThemeToggle/>
          </div>

          <Link href="/teacher/create-class">
            <Button className="w-full mb-2">Create New Class</Button>
          </Link>

          <Button onClick={logout} variant="outline" size="sm" className="w-full mb-4">
            <LogOut className="h-4 w-4 mr-2"/>
            Logout
          </Button>

          {classes.length > 0 && (
              <div className="mt-4 space-y-1">
                <label className="block text-sm font-medium">Your Classes</label>
                <select
                    value={selectedClassId || ""}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full rounded border px-2 py-1 text-sm"
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

        {/* Main content */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Class ID Card */}
            {selectedClassId && (
                <Card>
                  <CardContent className="flex items-center justify-between">
                    <span className="font-medium">Class ID: {selectedClassId}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={copyClassId}
                        className="flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4"/>
                      Copy
                    </Button>
                  </CardContent>
                </Card>
            )}

            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold mb-4">Class Progress Overview</h2>

                {students.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Select a class to view students' progress.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4">Student</th>
                          <th className="text-left py-2 pr-4">Lessons Completed</th>
                          <th className="text-left py-2 pr-4">
                            Correct / Wrong / Total Questions
                          </th>
                          <th className="text-left py-2 pr-4">Avg Time (s / question)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {studentSummaryRows.map((row) => (
                            <tr key={row.userid} className="border-b">
                              <td className="py-2 pr-4">{row.username}</td>
                              <td className="py-2 pr-4">
                                {row.completedLessons} / {row.totalLessons}
                              </td>
                              <td className="py-2 pr-4">
                                {row.correct} / {row.wrong} / {row.totalQuestions}
                              </td>
                              <td className="py-2 pr-4">
                                {row.avgTimePerQuestion ? `${row.avgTimePerQuestion}s` : "-"}
                              </td>
                            </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>


        <div className="w-80 border-l bg-gray-50 dark:bg-gray-900 p-4">
          <LeaderboardCard
              leaderboard={leaderboard}
              currentUser={user}
              currentClassId={selectedClassId}
          />
        </div>


      </div>
  );
}
