import { useEffect, useRef } from "react";
import useTestStore from "../store/testStore";
import { autoSave } from "../services/studyApi";   // ✅ import đúng

export default function useAutoSave(delay = 15000) {
  const { attemptId, answers, setSavingStatus, markSavedSuccess } = useTestStore();
  const answersRef = useRef(answers);
  const lastSavedAnswersRef = useRef([]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!attemptId) return;

    const interval = setInterval(async () => {
      const currentAnswers = answersRef.current;
      if (currentAnswers.length === 0 || JSON.stringify(currentAnswers) === JSON.stringify(lastSavedAnswersRef.current)) {
        return;
      }

      try {
        setSavingStatus(true);
        await autoSave(attemptId, currentAnswers);
        lastSavedAnswersRef.current = currentAnswers;
        markSavedSuccess();
      } catch (error) {
        console.error("Lỗi lưu nháp:", error);
        setSavingStatus(false);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [attemptId, delay, setSavingStatus, markSavedSuccess]);
}