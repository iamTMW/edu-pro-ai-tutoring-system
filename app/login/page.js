"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    signup,
    forgotPasswordQuestion,
    resetPassword,
    forgotUsername,
    isAuthenticated,
  } = useAuth();

  // redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // --- login state ---
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // --- parent linking state ---
  const [parentStudentIds, setParentStudentIds] = useState([""]);

  // --- register state (added classCode + className) ---
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "student",
    theme: "Soccer",
    classCode: "",   // student: join existing class
    className: "",   // teacher: create new class
  });

  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);

  const [securityQuestions, setSecurityQuestions] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);

  // --- forgot password / username state ---
  const [forgotPasswordData, setForgotPasswordData] = useState({
    username: "",
    email: "",
  });
  const [forgotUsernameData, setForgotUsernameData] = useState({
    email: "",
    first_name: "",
    last_name: "",
  });
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [forgotResultData, setForgotResultData] = useState(null);

  const [forgotStep, setForgotStep] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // --- login handler ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const result = await login(loginData.username, loginData.password);

      if (result.success) {
        router.push("/dashboard");
      } else {
        setLoginError(result.error || "Invalid username or password");
      }
    } catch (error) {
      setLoginError("An error occurred. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // --- register handler (now includes classCode / className) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }

    if (!registerData.username || !registerData.password) {
      setRegisterError("Username and password are required");
      return;
    }

    setRegisterLoading(true);

    try {
      const userData = {
        username: registerData.username,
        password: registerData.password,
        role: registerData.role,
        email: registerData.email,
        security_qas: securityQuestions,
        theme: registerData.theme,
        // optional class info – backend / AuthContext can use these
        class_code:
          registerData.role === "student" ? registerData.classCode.trim() : "",
        // class_name:
        //   registerData.role === "teacher" ? registerData.className.trim() : "",
        // only for parents
        student_ids:
          registerData.role === "parent"
            ? parentStudentIds.filter((id) => id.trim())
            : [],
      };

      const result = await signup(userData);

      if (result.success) {
        setRegisterDialogOpen(false);
        alert(
          `Welcome to EduPro! Make sure to remember your Username: ${registerData.username} and Password: ${registerData.password} !`
        );
      } else {
        setRegisterError(result.error || "Registration failed");
      }
    } catch (error) {
      setRegisterError("An error occurred during registration");
    } finally {
      setRegisterLoading(false);
    }
  };

  const availableQuestions = [
    "What is your pet’s name?",
    "What is your mother’s maiden name?",
    "What is your favorite color?",
    "What city were you born in?",
    "What was your first school?",
  ];

  // --- forgot password flow ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (forgotStep === 1) {
      try {
        const res = await forgotPasswordQuestion(forgotPasswordData.username);
        if (res.success) {
          setCurrentQuestion(res.question);
          setForgotStep(2);
        } else {
          setLoginError(res.message || "User not found");
        }
      } catch (err) {
        setLoginError("An error occurred. Please try again.");
      }
    } else if (forgotStep === 2) {
      try {
        const res = await resetPassword(
          forgotPasswordData.username,
          answer,
          newPassword
        );
        if (res.success) {
          setForgotResultData({
            type: "password",
            password: newPassword,
            message: "Password reset successful",
          });
          setForgotStep(1);
          setAnswer("");
          setNewPassword("");
        } else {
          setLoginError(res.message || "Incorrect answer");
        }
      } catch (err) {
        setLoginError("An error occurred. Please try again.");
      }
    }
  };

  // --- forgot username ---
  const handleForgotUsername = async (e) => {
    e.preventDefault();
    try {
      const res = await forgotUsername(forgotUsernameData);
      if (res.success) {
        setForgotResultData({
          type: "username",
          username: res.username,
          message: "Username recovered successfully",
        });
      } else {
        setLoginError(res.message || "Unable to recover username");
      }
    } catch (err) {
      setLoginError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <BookOpen className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            EduPro
          </h1>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Login to continue your learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* LOGIN FORM */}
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({ ...loginData, username: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            {/* DIALOGS */}
            <div className="flex justify-between text-sm mt-4">
              {/* Forgot password / username dialog */}
              <Dialog
                open={forgotDialogOpen}
                onOpenChange={setForgotDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="link" className="p-0 h-auto text-blue-600">
                    Forgot Password?
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Recover Your Account</DialogTitle>
                    <DialogDescription>
                      Choose an option to recover your account credentials
                    </DialogDescription>
                  </DialogHeader>

                  {forgotResultData ? (
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p className="font-medium">
                              {forgotResultData.type === "password"
                                ? "Your Password:"
                                : "Your Username:"}
                            </p>
                            <p className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                              {forgotResultData.type === "password"
                                ? forgotResultData.password
                                : forgotResultData.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              {forgotResultData.message}
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                      <Button
                        onClick={() => {
                          setForgotResultData(null);
                          setForgotDialogOpen(false);
                        }}
                        className="w-full"
                      >
                        Close
                      </Button>
                    </div>
                  ) : (
                    <Tabs defaultValue="password">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="password">
                          Forgot Password
                        </TabsTrigger>
                        <TabsTrigger value="username">
                          Forgot Username
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="password" className="space-y-4">
                        {forgotStep === 1 ? (
                          <form
                            onSubmit={handleForgotPassword}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="forgot-username">Username</Label>
                              <Input
                                id="forgot-username"
                                type="text"
                                value={forgotPasswordData.username}
                                onChange={(e) =>
                                  setForgotPasswordData({
                                    ...forgotPasswordData,
                                    username: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                            <Button type="submit" className="w-full">
                              Next
                            </Button>
                          </form>
                        ) : (
                          <form
                            onSubmit={handleForgotPassword}
                            className="space-y-4"
                          >
                            <p className="font-medium">{currentQuestion}</p>
                            <div className="space-y-2">
                              <Label htmlFor="answer">Answer</Label>
                              <Input
                                id="answer"
                                type="text"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-password">New Password</Label>
                              <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                              />
                            </div>
                            <Button type="submit" className="w-full">
                              Reset Password
                            </Button>
                          </form>
                        )}
                      </TabsContent>

                      <TabsContent value="username" className="space-y-4">
                        <form
                          onSubmit={handleForgotUsername}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="forgot-user-email">Email</Label>
                            <Input
                              id="forgot-user-email"
                              type="email"
                              value={forgotUsernameData.email}
                              onChange={(e) =>
                                setForgotUsernameData({
                                  ...forgotUsernameData,
                                  email: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="forgot-firstname">First Name</Label>
                            <Input
                              id="forgot-firstname"
                              type="text"
                              value={forgotUsernameData.first_name}
                              onChange={(e) =>
                                setForgotUsernameData({
                                  ...forgotUsernameData,
                                  first_name: e.target.value,
                                })
                              }
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="forgot-lastname">Last Name</Label>
                            <Input
                              id="forgot-lastname"
                              type="text"
                              value={forgotUsernameData.last_name}
                              onChange={(e) =>
                                setForgotUsernameData({
                                  ...forgotUsernameData,
                                  last_name: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Recover Username
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  )}
                </DialogContent>
              </Dialog>

              {/* Register dialog */}
              <Dialog
                open={registerDialogOpen}
                onOpenChange={setRegisterDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="link" className="p-0 h-auto text-blue-600">
                    Create Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Account</DialogTitle>
                    <DialogDescription>
                      Fill in your details to get started with EduPro
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleRegister} className="space-y-4">
                    {registerError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{registerError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username *</Label>
                      <Input
                        id="reg-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            username: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password *</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm-password">
                        Confirm Password *
                      </Label>
                      <Input
                        id="reg-confirm-password"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Role selection */}
                    <div className="space-y-2">
                      <Label>Role *</Label>

                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="student"
                            checked={registerData.role === "student"}
                            onChange={() =>
                              setRegisterData({
                                ...registerData,
                                role: "student",
                              })
                            }
                          />
                          Student
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="teacher"
                            checked={registerData.role === "teacher"}
                            onChange={() =>
                              setRegisterData({
                                ...registerData,
                                role: "teacher",
                              })
                            }
                          />
                          Teacher
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="parent"
                            checked={registerData.role === "parent"}
                            onChange={() =>
                              setRegisterData({
                                ...registerData,
                                role: "parent",
                              })
                            }
                          />
                          Parent
                        </label>
                      </div>
                    </div>

                    {/* Class fields */}
                    {registerData.role === "student" && (
                      <div className="space-y-2">
                        <Label htmlFor="class-code">
                          Class Code (optional)
                        </Label>
                        <Input
                          id="class-code"
                          type="text"
                          placeholder="Enter class code if your teacher gave you one"
                          value={registerData.classCode}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              classCode: e.target.value,
                            })
                          }
                        />
                        <p className="text-xs text-gray-500">
                          Leave blank to be placed in the default class.
                        </p>
                      </div>
                    )}

                    {/*{registerData.role === "teacher" && (*/}
                    {/*  <div className="space-y-2">*/}
                    {/*    <Label htmlFor="class-name">Class Name</Label>*/}
                    {/*    <Input*/}
                    {/*      id="class-name"*/}
                    {/*      type="text"*/}
                    {/*      placeholder="e.g. Grade 4 Math, Room 203"*/}
                    {/*      value={registerData.className}*/}
                    {/*      onChange={(e) =>*/}
                    {/*        setRegisterData({*/}
                    {/*          ...registerData,*/}
                    {/*          className: e.target.value,*/}
                    {/*        })*/}
                    {/*      }*/}
                    {/*    />*/}
                    {/*    <p className="text-xs text-gray-500">*/}
                    {/*      A class code can be generated and shared with*/}
                    {/*      students after signup.*/}
                    {/*    </p>*/}
                    {/*  </div>*/}
                    {/*)}*/}

                    {/* Security questions */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Security Questions</h3>
                      {securityQuestions.map((qa, index) => (
                        <div key={index} className="space-y-2">
                          <Label htmlFor={`security-question-${index}`}>
                            Question {index + 1}
                          </Label>
                          <select
                            id={`security-question-${index}`}
                            value={qa.question}
                            onChange={(e) => {
                              const newQAs = [...securityQuestions];
                              newQAs[index].question = e.target.value;
                              setSecurityQuestions(newQAs);
                            }}
                            required
                            className="w-full border rounded p-2"
                          >
                            <option value="">Select a question</option>
                            {availableQuestions.map((q, i) => (
                              <option key={i} value={q}>
                                {q}
                              </option>
                            ))}
                          </select>

                          <Label htmlFor={`security-answer-${index}`}>
                            Answer
                          </Label>
                          <Input
                            id={`security-answer-${index}`}
                            type="text"
                            value={qa.answer}
                            onChange={(e) => {
                              const newQAs = [...securityQuestions];
                              newQAs[index].answer = e.target.value;
                              setSecurityQuestions(newQAs);
                            }}
                            required
                          />
                        </div>
                      ))}
                    </div>

                    {/* Theme – only really needed for student */}
                    {registerData.role === "student" && (
                      <div className="space-y-2">
                        <Label htmlFor="theme">Choose Theme</Label>
                        <select
                          id="theme"
                          value={registerData.theme}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              theme: e.target.value,
                            })
                          }
                          className="w-full border rounded p-2"
                        >
                          <option value="">Select a theme</option>
                          <option value="Soccer">Soccer</option>
                          <option value="Hockey">Hockey</option>
                          <option value="Toys">Toys</option>
                          <option value="Pokemon">Pokemon</option>
                          <option value="Video Games">Video Games</option>
                          <option value="Cars">Cars</option>
                          <option value="Fairies">Fairies</option>
                          <option value="Horses">Horses</option>
                          <option value="Dolls">Dolls</option>
                        </select>
                      </div>
                    )}

                    {/* Parent → student IDs */}
                    {registerData.role === "parent" && (
                      <div className="space-y-2">
                        <Label>Student IDs (for tracking)</Label>
                        {parentStudentIds.map((id, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              type="text"
                              placeholder={`Student ID #${index + 1}`}
                              value={id}
                              onChange={(e) => {
                                const newIds = [...parentStudentIds];
                                newIds[index] = e.target.value;
                                setParentStudentIds(newIds);
                              }}
                              className="flex-1"
                            />
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                  const newIds = parentStudentIds.filter(
                                    (_, i) => i !== index
                                  );
                                  setParentStudentIds(newIds);
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}

                        <Button
                          type="button"
                          onClick={() =>
                            setParentStudentIds([...parentStudentIds, ""])
                          }
                          className="mt-2"
                        >
                          Add Another Student ID
                        </Button>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerLoading}
                    >
                      {registerLoading
                        ? "Creating Account..."
                        : "Create Account"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={() => router.push("/")}
            className="text-gray-600 dark:text-gray-400"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
