"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Brain, TrendingUp, Users } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EduPro</h1>
          </div>
          <Button 
            onClick={() => router.push('/login')}
            variant="outline"
          >
            Login
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to EduPro
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            An Intelligent Tutoring System designed to help students learn math and English
            through personalized, adaptive learning experiences.
          </p>
          <Button 
            onClick={() => router.push('/login')}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2">Adaptive Learning</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our system adapts to your learning pace and adjusts difficulty automatically
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-green-500 transition-colors">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">Track Progress</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor your learning journey with detailed progress tracking
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-500 transition-colors">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">Interactive Lessons</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Engage with interactive content designed for grades 1-4
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-orange-500 transition-colors">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold mb-2">For Everyone</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Designed for students, teachers, and parents to work together
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* About Section */}
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4 text-center">How EduPro Works</h3>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
              <p>
                EduPro is an Intelligent Tutoring System that provides personalized learning
                experiences for elementary students in math and English. Our system uses
                adaptive algorithms to adjust to each student's learning pace.
              </p>
              <p>
                <strong>For Students:</strong> Complete interactive lessons, receive instant
                feedback, and track your progress as you learn.
              </p>
              <p>
                <strong>For Teachers:</strong> Create custom classes, monitor student progress,
                and provide targeted support where it's needed most.
              </p>
              <p>
                <strong>For Parents:</strong> Stay connected with your child's learning journey
                and see their achievements.
              </p>
            </div>
            <div className="mt-8 text-center">
              <Button 
                onClick={() => router.push('/login')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Start Learning Today
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 EduPro - Pixel Pioneers Team</p>
          <p className="text-sm mt-2">CIS 3750 Project - University of Guelph</p>
        </div>
      </footer>
    </div>
  );
}
