"use client";

import {useState, useMemo, useEffect, useRef} from "react";
import {fetchUserProgress} from "@/lib/mock-data/modules";
import LeaderboardCard from "@/components/dashboard/LeaderboardCard";

import {Card, CardContent} from "@/components/ui/card";
import {Progress} from "@/components/ui/progress";
import QuestionCard from "@/components/modules/QuestionCard";
import ModuleList from "@/components/modules/ModuleList";
import {ThemeToggle} from "@/components/modules/ThemeToggle";
import {useAuth} from "@/contexts/AuthContext";
import {LogOut} from "lucide-react";
import {Button} from "@/components/ui/button";
import Link from "next/link";

const LOCAL_HOST = "http://127.0.0.1:5000";

// --- Adaptive MMR helpers ---
const expected = (ru, rq) => 1 / (1 + Math.pow(10, (rq - ru) / 400));
const baseK = (rq) => (rq >= 1500 ? 48 : rq >= 1100 ? 36 : 28);
const streakMult = (streak) =>
    streak >= 8 ? 1.5 : streak >= 5 ? 1.25 : streak >= 3 ? 1.1 : 1.0;

function updateMMR({ru, rq, correct, streak}) {
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
    return {ru: newRU};
}

// --- Difficulty + timer ---
const DIFFS = /** @type const */ (["easy", "medium", "hard"]);

// --- Build question ID map ---
function buildIdMap(lesson) {
    const map = {};
    for (const diff of DIFFS) {
        (lesson?.questions?.[diff] || []).forEach((q) => {
            map[q.id] = {
                ...q,
                difficulty: diff,
                solutionFeedback: q.solution_feedback  // <--- add this
            };
        });
    }
    return map;
}

// --- Main component ---
export default function DashboardContent({user}) {
    const {logout} = useAuth();

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

    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);

    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState(null);

    // --- Fetch classrooms for student ---
    useEffect(() => {
        async function loadClasses() {
            if (!user?.userid) return;

            try {
                const res = await fetch(`${LOCAL_HOST}/student/classes`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({userid: user.userid}),
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.classes)) {
                    setClasses(data.classes);
                    if (data.classes.length > 0) {
                        setSelectedClassId(data.classes[0].classid);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch classes", err);
            }
        }

        loadClasses();
    }, [user?.userid]);

    // --- Fetch modules whenever selectedClassId changes ---
    useEffect(() => {
        async function loadModules() {
            if (!user?.userid || !selectedClassId) return;

            const progress = await fetchUserProgress(user.userid, selectedClassId);
            if (!progress) return;

            const loadedModules = Object.values(progress.lessons).map(
                (lesson, index) => ({
                    id: lesson.id,
                    name: lesson.title || `Module ${index + 1}`,
                    unlocked: lesson.unlocked ?? index === 0,
                    completed: lesson.completed ?? false,
                    questions: lesson.questions,
                    status: lesson.completed
                        ? "completed"
                        : lesson.unlocked
                            ? "unlocked"
                            : "locked",
                })
            );

            setModules(loadedModules);
            if (loadedModules.length > 0) {
                setSelectedModuleId(loadedModules[0].id);
            }
        }

        loadModules();
    }, [user?.userid, selectedClassId]);

    // --- Selected module / lesson ---
    const selectedModule = useMemo(
        () => modules.find((m) => m.id === selectedModuleId),
        [modules, selectedModuleId]
    );

    const idMap = useMemo(() => buildIdMap(selectedModule), [selectedModule]);

    // --- Populate question path when module changes ---
    useEffect(() => {
        if (!selectedModule || !selectedModuleId) return;

        const usedIds = new Set();
        const path = [];

        DIFFS.forEach((diff) => {
            (selectedModule.questions[diff] || []).forEach((q) => {
                if (!usedIds.has(q.id)) {
                    path.push({id: q.id, difficulty: diff});
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
    const currentQuestion = currentPathItem ? idMap[currentPathItem.id] : null;
    const currentModuleCompleted =
        completedQuestions[selectedModuleId] || new Set();

    // figure out which class is currently selected + if it's the default
    const currentClass = classes.find((c) => c.classid === selectedClassId);
    const isDefaultClass = currentClass?.class_name === "default_math";

    const [joinClassInput, setJoinClassInput] = useState("");

    // --- Classroom dropdown effect: fetch first lesson content ---
    useEffect(() => {
        if (selectedModule) {
            handleViewContent(selectedModule);
        }
    }, [selectedModule]);

    // --- Initialize streak and difficulty ---
    useEffect(() => {
        setStreak(0);
        setDifficulty("easy");
        const storedRU = Number(localStorage.getItem("pp_mmr"));
        if (!Number.isNaN(storedRU) && storedRU) setRU(storedRU);
    }, []);

    // --- Update localStorage for streak / difficulty ---
    useEffect(() => {
        try {
            localStorage.setItem("pp_streak_ui", String(streak));
        } catch {
            // ignore
        }
    }, [streak]);

    useEffect(() => {
        try {
            localStorage.setItem("pp_diff_hidden", difficulty);
        } catch {
            // ignore
        }
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

    // --- Leaderboard: default class => GLOBAL, other classes => CLASS-ONLY ---
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                let url;
                if (!selectedClassId || isDefaultClass) {
                    // default / no class => global
                    url = `${LOCAL_HOST}/leaderboard`;
                } else {
                    // specific teacher class => class-only leaderboard
                    url = `${LOCAL_HOST}/leaderboard?class_id=${encodeURIComponent(
                        selectedClassId
                    )}`;
                }

                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to fetch leaderboard");
                const data = await res.json();
                setLeaderboard(data.leaderboard || []);
            } catch (err) {
                console.error("Failed to fetch leaderboard", err);
                setLeaderboard([]);
            }
        };

        fetchLeaderboard();
    }, [selectedClassId, isDefaultClass, leaderboardRefreshKey]);

    // --- Lesson content fetch ---
    const handleViewContent = async (module) => {
        if (!module || !selectedClassId) return;

        setSelectedModuleId(module.id);

        try {
            const res = await fetch(`${LOCAL_HOST}/lesson-content`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({class_id: selectedClassId, lesson_id: module.id}),
            });
            const data = await res.json();
            setLessonContent(
                data.success ? data.html : `<p style="color:red">${data.message}</p>`
            );
        } catch (err) {
            setLessonContent(
                `<p style="color:red">Error fetching lesson content</p>`
            );
        }
    };

    // --- Handle question answer ---
    const handleQuestionAnswer = async ({
                                            correct,
                                            hintsUsed = 0,
                                            usedSolution = false,
                                            wrongAttempts = 0,
                                        }) => {
        if (!currentQuestion) return;

        // --- Update MMR ---
        const deltaRU = updateMMR({
            ru,
            rq: currentQuestion.rating ?? 1100,
            correct,
            streak,
        });
        setRU(deltaRU.ru);

        // --- Track whether this question needs extra practice ---
        const needsExtraPractice =
            usedSolution || wrongAttempts > 0;

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
            try {
                const res = await fetch(`${LOCAL_HOST}/student/complete-lesson`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        userid: user.userid,
                        class_id: selectedClassId,
                        lesson_id: selectedModuleId,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    alert(data.message || `Module "${selectedModule.name}" completed!`);
                    const progress = await fetchUserProgress(user.userid, selectedClassId);
                    if (progress) {
                        const loadedModules = Object.values(progress.lessons).map(
                            (lesson, index) => ({
                                id: lesson.id,
                                name: lesson.title || `Module ${index + 1}`,
                                unlocked: lesson.unlocked ?? index === 0,
                                completed: lesson.completed ?? false,
                                questions: lesson.questions,
                                status: lesson.completed
                                    ? "completed"
                                    : lesson.unlocked
                                        ? "unlocked"
                                        : "locked",
                            })
                        );
                        setModules(loadedModules);
                    }
                }
            } catch (err) {
                console.error("Failed to complete lesson", err);
                alert("Error completing lesson. Please try again.");
            }
        } else if (correct) {
            // --- Extra practice logic ---
            if (needsExtraPractice) {
                // push user 1 question back
                setPathIndex((prev) => Math.max(prev - 1, 0));
            } else {
                // move to next question normally
                setPathIndex((prev) => Math.min(prev + 1, currentPath.length - 1));
            }
        }

        // 🔁 ALWAYS refresh leaderboard after an answer
        setLeaderboardRefreshKey((k) => k + 1);
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
                                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Settings
                            </Link>
                            <ThemeToggle/>
                        </div>
                    </div>

                    <Button
                        onClick={logout}
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                    >
                        <LogOut className="h-4 w-4 mr-2"/>
                        Logout
                    </Button>

                    <Button asChild variant="default" size="sm" className="w-full mt-2">
                        <Link href="/student-progress">View Learning Overview</Link>
                    </Button>

                    {/* --- Join class input --- */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">
                            Join Class by ID
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter class ID"
                                value={joinClassInput}
                                onChange={(e) => setJoinClassInput(e.target.value)}
                                className="flex-1 rounded border px-2 py-1 text-sm"
                            />
                            <Button
                                size="sm"
                                onClick={async () => {
                                    if (!user?.userid || !joinClassInput) {
                                        alert("Please enter a class ID.");
                                        return;
                                    }
                                    try {
                                        const res = await fetch(`${LOCAL_HOST}/student/join-class`, {
                                            method: "POST",
                                            headers: {"Content-Type": "application/json"},
                                            body: JSON.stringify({
                                                student_userid: user.userid,
                                                class_id: joinClassInput,
                                            }),
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            alert(`Joined class ${joinClassInput}!`);
                                            setJoinClassInput(""); // clear input after joining
                                            // refresh classes list
                                            const classesRes = await fetch(`${LOCAL_HOST}/student/classes`, {
                                                method: "POST",
                                                headers: {"Content-Type": "application/json"},
                                                body: JSON.stringify({userid: user.userid}),
                                            });
                                            const classesData = await classesRes.json();
                                            if (classesData.success) setClasses(classesData.classes);
                                        } else {
                                            alert(`Failed to join class: ${data.message}`);
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        alert("Error joining class. Please try again.");
                                    }
                                }}
                            >
                                Join
                            </Button>
                        </div>
                    </div>

                    {/* --- Classroom dropdown --- */}
                    {classes.length > 0 && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">
                                Select Class
                            </label>
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
                            >
                                View Lesson Content
                            </Button>
                            <div
                                id="lesson-box"
                                className="border rounded p-4 max-h-96 overflow-auto bg-white dark:bg-gray-800"
                                dangerouslySetInnerHTML={{__html: lessonContent}}
                            ></div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <div className="flex justify-between items-center mb-2">
                                <div className={`px-2 py-1 border rounded ${streakTier}`}>
                                    {streakEmoji} Streak: {streak}
                                </div>
                                <div className={`px-2 py-1 border rounded ${diffBadge}`}>
                                    Difficulty: {difficulty}
                                </div>
                            </div>
                            <Progress value={progressValue} className="mb-4"/>

                            {currentQuestion ? (
                                <QuestionCard
                                    question={currentQuestion}
                                    module={selectedModule}
                                    onAnswer={handleQuestionAnswer}
                                    userid={user.userid}
                                    classid={selectedClassId}
                                    questionStartTsRef={questionStartTsRef}
                                />
                            ) : (
                                <div className="text-gray-500">No questions remaining</div>
                            )}

                            {/* Only show Next/Previous buttons if current question is answered */}
                            {currentModuleCompleted.has(currentQuestion?.id) && (
                                <div className="flex justify-between mt-4">
                                    <Button onClick={handlePrevious}>Previous</Button>
                                    <Button onClick={handleNext}>Next</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right-side leaderboard */}
            <div className="w-80 border-l bg-gray-50 dark:bg-gray-900 p-4">
                <LeaderboardCard
                    leaderboard={leaderboard}
                    currentUser={user}
                    // default class => global view, so hide class id from card
                    currentClassId={isDefaultClass ? null : selectedClassId}
                />
            </div>
        </div>
    );
}
