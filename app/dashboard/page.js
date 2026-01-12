"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import DashboardContent from "@/components/dashboard/DashboardContent";
import TeacherDashboardContent from "@/components/dashboard/TeacherDashboardContent";
import ParentDashboardContent from "@/components/dashboard/ParentDashboardContent";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  // Loading state while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authed, render nothing (redirect will have fired)
  if (!isAuthenticated || !user) {
    return null;
  }

  const role = (user.role || "").toUpperCase();

  if (role === "TEACHER") {
    return <TeacherDashboardContent user={user} />;
  }

  if (role === "PARENT") {
    return <ParentDashboardContent user={user} />;
  }

  // Default: student
  return <DashboardContent user={user} />;
}
