"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LockIcon, CheckCircle2Icon, CircleIcon } from "lucide-react";

export default function ModuleList({
  modules,
  selectedModule,
  onModuleSelect,
  onViewContent,
  onCompleteLearning,
}) {
  const getModuleIcon = (module) => {
  if (module.completed)
    return <CheckCircle2Icon className="h-4 w-4 text-green-500" />;
  if (module.unlocked)
    return <CircleIcon className="h-4 w-4 text-blue-500" />;
  return <LockIcon className="h-4 w-4 text-gray-400" />;
};

  return (
    <ScrollArea className="h-[calc(100vh-80px)]">
      <div className="p-4 space-y-2">


        {modules.map((module) => (
          <div
            key={module.id}
            className={`relative p-2 rounded-md ${
              selectedModule?.id === module.id
                ? "bg-gray-100 dark:bg-gray-800"
                : ""
            }`}
          >
            {/* Module Header */}
            <div className="flex items-center justify-between w-full">
              <div
                  className="flex items-center flex-1 cursor-pointer"
                  onClick={() => module.unlocked && onModuleSelect(module)}
              >
                <span className="mr-2">{getModuleIcon(module)}</span>
                <span className="text-sm">{module.name}</span>
              </div>

              {!module.unlocked && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Locked
                  </Badge>
              )}
            </div>

            {/* Module Actions */}
            {module.unlocked && (
                <div className="mt-2 flex gap-2">
                {module.lessonContent && !module.completed && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => onCompleteLearning(module)}
                  >
                    Mark Lesson Complete
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
