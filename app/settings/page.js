"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/modules/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_SETTINGS = {
  username: "",
  theme: [],
};

export default function SettingsPage() {
  const { user } = useAuth();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [profileMessage, setProfileMessage] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  /* -------------------- Load & persist profile settings -------------------- */

  // Load from localStorage + hydrate from auth user on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem("pixel_settings");
    let base = { ...DEFAULT_SETTINGS };

    if (stored) {
      try {
        base = { ...base, ...JSON.parse(stored) };
      } catch (e) {
        console.error("Bad settings in localStorage", e);
      }
    }

    if (user) {
      base.username = base.username || user.username || "";
    }

    setSettings(base);
  }, [user]);

  // Persist settings (non-password) to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      "pixel_settings",
      JSON.stringify({
        username: settings.username,
        theme: settings.theme,
      })
    );
  }, [settings.username, settings.theme]);

  const handleProfileChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setProfileMessage("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage("");

    try {
      // TODO: hook to your real backend later
      await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: settings.username,
          theme: settings.theme,
        }),
      }).catch(() => {});

      setProfileMessage("Profile updated ✓");
    } catch (err) {
      console.error(err);
      setProfileMessage("Could not save profile. Please try again.");
    }
  };

  /* -------------------------- Password / security -------------------------- */

  const handlePasswordChange = (key, value) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    setPasswordError("");
    setPasswordMessage("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password should be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      // TODO: hook to your real backend later
      await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      }).catch(() => {});

      setPasswordMessage("Password updated ✓");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
    } catch (err) {
      console.error(err);
      setPasswordError("Could not update password. Please try again.");
    }
  };

  /* --------------------------------- Render -------------------------------- */

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Manage your profile, theme, and account security. We’ll
              use this info to keep Pixel feeling personal and on-theme for you.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              ← Back to dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Profile & theme card */}
        <Card className="px-6 py-5 border-border bg-card shadow-sm rounded-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center text-lg font-semibold">
              {(settings.username || "P").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">Profile & theme</p>
              <p className="text-xs text-muted-foreground">
                These details help us theme your word problems.
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Username</label>
              <input
                type="text"
                value={settings.username}
                onChange={(e) =>
                  handleProfileChange("username", e.target.value)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Choose a handle, e.g. taha_math"
              />
              <p className="text-xs text-muted-foreground">
                Used for greetings and, later, for sharing progress or
                leaderboards.
              </p>
            </div>

            {/* Optional read-only email */}
            {user?.email && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Email is managed by your account system. We’ll just use it for
                  login.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                You can change these anytime. We’ll quietly adapt questions in
                the background.
              </div>
              <Button type="submit" className="px-5 py-2 text-sm font-medium">
                Save profile
              </Button>
            </div>

            {profileMessage && (
              <p className="text-xs text-emerald-500 pt-1">
                {profileMessage}
              </p>
            )}
          </form>
        </Card>

        {/* Security card */}
        <Card className="px-6 py-5 border-border bg-card shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium">Security</p>
              <p className="text-xs text-muted-foreground">
                Update your password to keep your account safe.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordForm((v) => !v)}
            >
              {showPasswordForm ? "Cancel" : "Change password"}
            </Button>
          </div>

          {!showPasswordForm && (
            <p className="text-xs text-muted-foreground mt-3">
              Your password is stored securely. Click{" "}
              <span className="font-medium">Change password</span> to update it.
            </p>
          )}

          {showPasswordForm && (
            <form
              onSubmit={handlePasswordSubmit}
              className="space-y-4 max-w-md mt-4"
            >
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  Current password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    handlePasswordChange("currentPassword", e.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  New password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    handlePasswordChange("newPassword", e.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    handlePasswordChange("confirmPassword", e.target.value)
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Type it again"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" className="text-sm">
                  Update password
                </Button>
                {passwordError && (
                  <p className="text-xs text-destructive">{passwordError}</p>
                )}
                {passwordMessage && !passwordError && (
                  <p className="text-xs text-emerald-500">
                    {passwordMessage}
                  </p>
                )}
              </div>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
