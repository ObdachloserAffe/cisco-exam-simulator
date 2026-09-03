import { useEffect, useState } from "react";
import type { ExamSession } from "../types";
import { remainingSeconds } from "../services/examEngine";

/**
 * Ticks once per second and returns remaining seconds for a timed session.
 * Because remaining time is derived from `endsAt` (an absolute timestamp),
 * a page reload does not reset the clock.
 */
export function useExamTimer(session: ExamSession | null, onExpire: () => void): number | null {
  const [remaining, setRemaining] = useState<number | null>(session ? remainingSeconds(session) : null);

  useEffect(() => {
    if (!session || session.endsAt === null || session.status !== "in_progress") {
      setRemaining(null);
      return;
    }

    setRemaining(remainingSeconds(session));
    const interval = setInterval(() => {
      const r = remainingSeconds(session);
      setRemaining(r);
      if (r !== null && r <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.endsAt, session?.status]);

  return remaining;
}
