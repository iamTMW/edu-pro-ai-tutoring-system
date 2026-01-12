"use client";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useState, useEffect} from "react";

export default function QuestionCard({ module, question, onAnswer, userid, classid, questionStartTsRef }) {
    const [answer, setAnswer] = useState("");
    const [status, setStatus] = useState("unanswered");
    const [feedback, setFeedback] = useState("");
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [currentHintIndex, setCurrentHintIndex] = useState(0);
    const [showHints, setShowHints] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [hasViewedSolution, setHasViewedSolution] = useState(false);
    const [animate, setAnimate] = useState(false);

    const unlockedHints = question.hints.slice(0, Math.min(wrongAttempts, question.hints.length));
    const solutionAvailable = wrongAttempts > question.hints.length;

    const handleShowHint = () => {
      setCurrentHintIndex(0);
      setShowHints(true);
    };

    // Reset state when question changes
    useEffect(() => {
        setAnswer("");
        setStatus("unanswered");
        setFeedback("");
        setWrongAttempts(0);
        setCurrentHintIndex(0);
        setShowHints(false);
        setShowSolution(false);
        setHasViewedSolution(false);

        // Trigger fade-in animation
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 300);
        return () => clearTimeout(timer);
    }, [question]);

    const handleSubmit = async () => {
    if (!answer.trim()) {
        setFeedback("Please enter an answer!");
        setStatus("unanswered");
        return;
    }

    const isCorrect = answer.trim().toLowerCase() === question.solution.trim().toLowerCase();

    if (isCorrect) {
        setFeedback("Correct! Great job!");
        setStatus("correct");
    } else {
        setFeedback("Not quite right. Try again!");
        setStatus("wrong");
        setWrongAttempts((prev) => prev + 1);
    }

    // Calculate time taken in seconds
    const timeTakenSec = Math.floor((Date.now() - questionStartTsRef.current) / 1000);
    onAnswer({
        correct: isCorrect,
        hintsUsed: unlockedHints.length > 0 ? currentHintIndex + 1 : 0,
        usedSolution: hasViewedSolution,
        wrongAttempts,
        timeTaken: timeTakenSec,
    })

    // Send progress to backend
    try {
        await fetch("http://127.0.0.1:5000/student/update-question", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                userid,
                class_id: classid,
                lesson_id: module.id,
                question_id: question.id,
                correct: isCorrect,
                time_taken: timeTakenSec, // <-- send actual time
            }),
        });
    } catch (err) {
        console.error("Failed to update question progress", err);
    }
};

const handleShowSolution = async () => {
    setShowSolution(true);
    setShowHints(false);
    setHasViewedSolution(true);

    // Calculate time taken in seconds
    const timeTakenSec = Math.floor((Date.now() - questionStartTsRef.current) / 1000);

    // Send solution viewed as "time taken" with correct=false
    try {
        await fetch("http://127.0.0.1:5000/student/update-question", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                userid,
                class_id: classid,
                lesson_id: module.id,
                question_id: question.id,
                correct: false,
                time_taken: timeTakenSec,
            }),
        });
    } catch (err) {
        console.error("Failed to update question progress for solution view", err);
    }
};


    // const handleShowSolution = () => {
    //     setShowSolution(true);
    //     setShowHints(false);
    //     setHasViewedSolution(true);
    // };

    return (
        <Card
            className={`border-2 transition-all duration-300 
        ${status === "correct" ? "border-green-500" : status === "wrong" ? "border-red-500" : "border-gray-300"} 
        ${animate ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
        >
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{module.name}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="mb-4">{question.content}</p>
                <Input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Enter your answer..."
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                {feedback && (
                    <div
                        className={`mt-2 text-sm font-medium ${
                            status === "correct" ? "text-green-600" : status === "wrong" ? "text-red-600" : "text-gray-700"
                        }`}
                    >
                        {feedback}
                    </div>
                )}

                <div className="flex items-center gap-2 mt-4">
                    {/* Left: Submit */}
                    <Button onClick={handleSubmit}>Submit</Button>

                    {/* Spacer to push the other buttons to the right */}
                    <div className="ml-auto flex gap-2">
                        {unlockedHints.length > 0 &&
                            <Button onClick={handleShowHint}>Show Hint ({unlockedHints.length})</Button>}
                        {solutionAvailable && <Button onClick={handleShowSolution}>Show Solution</Button>}
                    </div>
                </div>

                {showHints && unlockedHints.length > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 border rounded">
                        <p>{unlockedHints[currentHintIndex]}</p>
                        <div className="flex justify-between mt-2">
                            <Button
                                onClick={() => setCurrentHintIndex((i) => Math.max(i - 1, 0))}
                                disabled={currentHintIndex === 0}
                            >
                                Prev
                            </Button>
                            <Button
                                onClick={() => setCurrentHintIndex((i) => Math.min(i + 1, unlockedHints.length - 1))}
                                disabled={currentHintIndex === unlockedHints.length - 1}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {showSolution && (
                  <div className="mt-4 p-4 bg-blue-50 border rounded">
                    <strong>Solution:</strong>{" "}
                    <p>{question.solutionFeedback || question.solution}</p>
                  </div>
                )}
            </CardContent>
        </Card>
    );
}
