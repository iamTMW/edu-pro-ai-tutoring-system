"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LOCAL_HOST = "http://127.0.0.1:5000";

export default function CreateClassPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  const [className, setClassName] = useState("");
  const [description, setDescription] = useState("");
  const [templateFile, setTemplateFile] = useState(null);
  const [lessonFiles, setLessonFiles] = useState({});
  const [classId, setClassId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  const isTeacher = user?.role?.toUpperCase() === "TEACHER";

  function handleTemplateChange(e) {
    setTemplateFile(e.target.files[0]);
  }

  function handleLessonFilesChange(e) {
    const files = e.target.files;
    const newFiles = {};
    for (let i = 0; i < files.length; i++) {
      newFiles[files[i].name] = files[i];
    }
    setLessonFiles(newFiles);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setClassId("");

    if (!isTeacher) {
      setError("Only teachers can create classes.");
      return;
    }

    if (!templateFile) {
      setError("Please upload a template JSON file.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("userid", user.userid);
      formData.append("class_name", className);
      formData.append("description", description);
      formData.append("template", templateFile);

      // Add lesson HTML files
      Object.keys(lessonFiles).forEach((key) => {
        formData.append(key, lessonFiles[key]);
      });

      const res = await fetch(`${LOCAL_HOST}/teacher/create-class`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Something went wrong creating the class.");
        return;
      }

      setClassId(data.class_id);
    } catch (err) {
      console.error(err);
      setError("Something went wrong creating the class.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>You must be a teacher to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create a New Class</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="class-name">Class Name</Label>
                <Input
                  id="class-name"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., Grade 3 Math - Ms. Khan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <textarea
                  id="description"
                  className="w-full border rounded px-2 py-1 text-sm"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description for this class"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-json">Upload Template JSON</Label>
                <Input
                  id="template-json"
                  type="file"
                  accept=".json"
                  onChange={handleTemplateChange}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Upload the JSON file containing lesson questions.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson-files">Lesson HTML Files</Label>
                <Input
                  id="lesson-files"
                  type="file"
                  accept=".html"
                  multiple
                  onChange={handleLessonFilesChange}
                />
                <p className="text-xs text-gray-500 mt-1">Upload HTML files for each lesson separately.</p>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating..." : "Create Class"}
              </Button>
            </form>

            {classId && (
              <div className="mt-4 p-3 rounded border bg-amber-50 text-sm">
                <p className="font-medium">Class created successfully!</p>
                <p>Share this class code with your students:</p>
                <p className="mt-1 font-mono text-xs bg-white px-2 py-1 rounded border">
                  {classId}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
