import { saveQuestionToExam, fetchQuestionsByExamId } from '../data/questionData';
import type { Question as BaseQuestion } from '../data/questionData';
import { assignExamToUsers } from '../data/examAssignmentData';

interface QuestionWithData extends BaseQuestion {
    data?: number[];
}

export const handleAddQuestion = async (
    question: string,
    exam: any,
    sumNumbers: string[],
    setError: (error: string | null) => void,
    setSaving: (saving: boolean) => void,
    setSuccess: (success: boolean) => void,
    setQuestion: (question: string) => void,
    setShowForm: (showForm: boolean) => void,
    setQuestions: (questions: QuestionWithData[]) => void,
    selectedGroupId?: string
): Promise<void> => {
    console.log(exam);
    
    if (!question.trim() || !exam) {
        setError('Question is required');
        return;
    }
    setSaving(true);
    setError(null);
    try {
        if (question === 'sum') {
            // Convert string inputs to numbers, filter out empty
            const nums = sumNumbers.map(n => Number(n)).filter(n => !isNaN(n));
            await saveQuestionToExam(exam.id || exam.docId, question, nums, selectedGroupId);
        } else {
            await saveQuestionToExam(exam.id || exam.docId, question, undefined, selectedGroupId);
        }
        setSuccess(true);
        setQuestion('');
        setTimeout(() => setSuccess(false), 1200);
        setShowForm(false);
        // Refresh questions from Firestore
        if (exam) {
            const qs = await fetchQuestionsByExamId(exam.id || exam.docId);
            // Sort by createdAt descending (handle Firestore Timestamp, Date, string, number)
            const getDate = (val: unknown) => {
                if (val && typeof (val as { toDate?: () => Date }).toDate === 'function') return (val as { toDate: () => Date }).toDate();
                if (val instanceof Date) return val;
                if (typeof val === 'string' || typeof val === 'number') return new Date(val);
                return new Date();
            };
            qs.sort((a, b) => {
                const aDate = getDate(a.createdAt);
                const bDate = getDate(b.createdAt);
                return aDate.getTime() - bDate.getTime();
            });
            setQuestions(qs);
        }
    } catch {
        setError('Failed to save question');
    } finally {
        setSaving(false);
    }
};

// Save assignments only
export const handleSaveAssignments = async (
    exam: any,
    assigned: { [uid: string]: boolean },
    setAssigning: (assigning: boolean) => void,
    setAssignError: (error: string | null) => void,
    setAssignSuccess: (success: boolean) => void
): Promise<void> => {
    if (!exam) return;
    const selectedUserIds = Object.keys(assigned).filter(uid => assigned[uid]);
    if (selectedUserIds.length === 0) {
        setAssignError('Please select at least one user.');
        return;
    }
    setAssigning(true);
    setAssignError(null);
    try {
        await assignExamToUsers(exam.id || exam.docId, selectedUserIds, false);
        setAssignSuccess(true);
        setTimeout(() => setAssignSuccess(false), 1500);
    } catch {
        setAssignError('Failed to save assignments.');
    } finally {
        setAssigning(false);
    }
};

// Save & Assign (submitted)
export const handleAssignExam = async (
    exam: any,
    assigned: { [uid: string]: boolean },
    setAssigning: (assigning: boolean) => void,
    setAssignError: (error: string | null) => void,
    setAssignSuccess: (success: boolean) => void
): Promise<void> => {
    if (!exam) return;
    const selectedUserIds = Object.keys(assigned).filter(uid => assigned[uid]);
    if (selectedUserIds.length === 0) {
        setAssignError('Please select at least one user.');
        return;
    }
    setAssigning(true);
    setAssignError(null);
    try {
        await assignExamToUsers(exam.id || exam.docId, selectedUserIds, true);
        setAssignSuccess(true);
        setTimeout(() => setAssignSuccess(false), 1500);
    } catch {
        setAssignError('Failed to assign exam.');
    } finally {
        setAssigning(false);
    }
};
