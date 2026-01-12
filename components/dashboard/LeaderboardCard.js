"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function LeaderboardCard({
  leaderboard,
  currentUser,
  currentClassId,
}) {
  const rows = Array.isArray(leaderboard) ? leaderboard : [];
  const isGlobal = !currentClassId; // null/undefined => global leaderboard

  if (!rows.length) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-900">
              {isGlobal ? "Leaderboard" : "Class Leaderboard"}
            </h2>
            <span className="text-[11px] text-gray-500">
              Based on adaptive difficulty / points
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {isGlobal
              ? "No leaderboard data yet. Start answering questions to appear here!"
              : "No leaderboard data yet for this class."}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Keep answering correctly to climb the leaderboard ✨
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {isGlobal ? "Leaderboard (All Students)" : "Class Leaderboard"}
          </h2>
          {!isGlobal && currentClassId && (
            <span className="text-[11px] text-gray-500">
              Class: <span className="font-medium">{currentClassId}</span>
            </span>
          )}
        </div>

        <ol className="space-y-1">
          {rows.slice(0, 10).map((entry, index) => {
            const rank = entry.rank ?? index + 1;

            const name =
              entry.display_name ||
              entry.username ||
              entry.name ||
              entry.user_name ||
              entry.userid ||
              `Student ${rank}`;

            const score =
              entry.points ??
              entry.mmr ??
              entry.rating ??
              entry.score ??
              0;

            const isCurrentUser =
              currentUser &&
              (entry.userid === currentUser.userid ||
                entry.username === currentUser.username ||
                entry.display_name === currentUser.username);

            const key = entry.userid
              ? `${entry.userid}-${rank}`
              : `${name}-${rank}`;

            return (
              <li
                key={key}
                className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs ${
                  isCurrentUser
                    ? "bg-amber-50 text-amber-900 border border-amber-200"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-[11px] font-semibold text-gray-400">
                    #{rank}
                  </span>
                  <span className="font-medium truncate max-w-[120px]">
                    {name}
                  </span>
                  {isCurrentUser && (
                    <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-600">
                  <span className="font-semibold">{score}</span>
                  <span className="text-[10px] uppercase tracking-wide">
                    pts
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {rows.length > 10 && (
          <p className="mt-2 text-[10px] text-gray-500">
            Showing top 10 students.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
