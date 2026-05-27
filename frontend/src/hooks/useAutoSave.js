import { useEffect, useRef } from "react";
import useTestStore from "../store/testStore";
import { autoSave } from "../services/studyApi";

export default function useAutoSave(delay = 15000) {
    const { attemptId, answers, setSavingStatus, markSavedSuccess } = useTestStore();

    // Dùng ref để lưu trữ phiên bản answers mới nhất mà không làm trigger lại setInterval
    const answersRef = useRef(answers);
    const lastSavedAnswersRef = useRef([]);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        if (!attemptId) return;

        const interval = setInterval(async () => {
            const currentAnswers = answersRef.current;

            // Nếu mảng câu trả lời trống hoặc giống hệt lần lưu trước đó thì bỏ qua không gọi API
            if (
                currentAnswers.length === 0 ||
                JSON.stringify(currentAnswers) === JSON.stringify(lastSavedAnswersRef.current)
            ) {
                return;
            }

            try {
                setSavingStatus(true);
                await autoSaveTestApi(attemptId, { answers: currentAnswers });
                lastSavedAnswersRef.current = currentAnswers; // Cập nhật trạng thái đã lưu thành công gần nhất
                markSavedSuccess();
            } catch (error) {
                console.error("Lỗi lưu nháp tự động bài Test:", error);
                setSavingStatus(false);
            }
        }, delay);

        return () => clearInterval(interval);
    }, [attemptId, delay, setSavingStatus, markSavedSuccess]);
}