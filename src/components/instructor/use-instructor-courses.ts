"use client";

import { convexApi } from "@/lib/convex-api";
import type { InstructorCourseSummary } from "@/lib/instructor-course-workspace";
import { useConvex, useConvexAuth } from "convex/react";
import { useCallback, useEffect, useState } from "react";

export function useInstructorCourses() {
  const convex = useConvex();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [courses, setCourses] = useState<InstructorCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isAuthenticated) {
      setCourses([]);
      setError("Authenticated Convex staff identity is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = (await convex.query(convexApi.courses.listInstructorCourses, {})) as InstructorCourseSummary[];
      setCourses(result);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to load instructor courses.";
      setError(message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [convex, isAuthenticated]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    void reload();
  }, [authLoading, reload]);

  return { courses, loading, error, reload };
}
