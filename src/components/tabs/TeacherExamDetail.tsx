import { assignExamToUsers } from '../../data/examAssignmentData';
import { fetchAllUsers } from '../../data/userData';
import type { User } from '../../data/userData';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Link, useParams } from 'react-router-dom';
import styles from './ExamDetail.module.css';
import { getExamDetailById } from '../../data/examData';
import type { Exam } from '../../data/examData';
import { saveQuestionToExam, fetchQuestionsByExamId } from '../../data/questionData';
import type { Question as BaseQuestion } from '../../data/questionData';
import { sumAdminTemplate } from '../../utils/templates';
import AddQuestionModal from './AddQuestionModal';

interface QuestionWithData extends BaseQuestion {
    data?: number[];
}

// Exam interface imported from examData

export const TeacherExamDetail: React.FC = () => {
    const { userData } = useContext(AuthContext);
    const { id } = useParams();
    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [question, setQuestion] = useState('');
    const [questions, setQuestions] = useState<QuestionWithData[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [sumNumbers, setSumNumbers] = useState<string[]>(["", ""]);
    const [users, setUsers] = useState<User[]>([]);
    const [assigned, setAssigned] = useState<{ [uid: string]: boolean }>({});

    const [assigning, setAssigning] = useState(false);
    const [assignSuccess, setAssignSuccess] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);
    // Save assignments only
    const handleSaveAssignments = async () => {
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
    const handleAssignExam = async () => {
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
    // Fetch all users on mount
    useEffect(() => {
        fetchAllUsers().then(setUsers);
    }, []);
    // Handler for assigning/unassigning students
    const handleAssign = (uid: string) => {
        setAssigned(a => ({ ...a, [uid]: !a[uid] }));
    };


    useEffect(() => {
        if (id) {
            getExamDetailById(id, setExam, setLoading, setFetchError);
        }
    }, [id]);

    const handleAddQuestion = async () => {
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
                await saveQuestionToExam(exam.id || exam.docId, question, nums);
            } else {
                await saveQuestionToExam(exam.id || exam.docId, question);
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

    useEffect(() => {
        // Fetch questions for this exam when exam is loaded
        const fetchQuestions = async () => {
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
        };
        fetchQuestions();
    }, [exam]);

    if (loading) return <div>Loading exam...</div>;
    if (fetchError) return <div style={{ color: 'red' }}>{fetchError}</div>;
    if (!exam) return null;

    return (
        <div className={styles.examDetailContainer}>
            <div className={styles.examDetail}>
                <div className={styles.examDetailHeader}>
                    <Link to="/kids-study/" className={styles.backBtn}>← Back to Dashboard</Link>
                    {userData?.role === 'teacher' && (
                        <button
                            className={styles.modal}
                            style={{ padding: '0.7rem 1.5rem', fontSize: '1rem', cursor: 'pointer', background: '#0077ff', color: '#fff', border: 'none', borderRadius: 5 }}
                            onClick={() => setShowForm(true)}
                        >
                            Add Question
                        </button>
                    )}
                </div>
                <h2 style={{ margin: 0, flex: 1, fontWeight: 'normal' }}>
                    <strong>Exam Title:</strong>
                    <u>{exam.name}</u>
                </h2>
            </div>

            {/* Modal for adding question */}
            {userData?.role === 'teacher' && showForm && (
                <AddQuestionModal
                    examId={exam.id || exam.docId}
                    question={question}
                    setQuestion={setQuestion}
                    saving={saving}
                    error={error}
                    success={success}
                    onClose={() => { setShowForm(false); setError(null); setQuestion(''); setSumNumbers(["", ""]); }}
                    onSubmit={handleAddQuestion}
                    sumNumbers={sumNumbers}
                    setSumNumbers={setSumNumbers}
                />
            )}

            {userData?.role === 'teacher' && (
                <>
                    <h3>Assign Users</h3>
                    <button
                        onClick={handleSaveAssignments}
                        disabled={assigning}
                        style={{ marginBottom: 16, marginRight: 8, padding: '6px 18px', fontSize: 15, background: '#aaa', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}
                    >
                        {assigning ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        onClick={handleAssignExam}
                        disabled={assigning}
                        style={{ marginBottom: 16, padding: '6px 18px', fontSize: 15, background: '#0077ff', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}
                    >
                        {assigning ? 'Assigning...' : 'Save & Assign'}
                    </button>
                    {assignError && <div style={{ color: 'red', marginBottom: 8 }}>{assignError}</div>}
                    {assignSuccess && <div style={{ color: 'green', marginBottom: 8 }}>Exam assigned successfully!</div>}
                    {users.length === 0 ? (
                        <div style={{ color: '#888' }}>No users found.</div>
                    ) : (
                        <ul style={{ marginBottom: 32 }}>
                            {users.map(user => (
                                <li key={user.uid} style={{ marginBottom: 6 }}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={!!assigned[user.uid]}
                                            onChange={() => handleAssign(user.uid)}
                                            style={{ marginRight: 8 }}
                                        />
                                        {user.displayName || user.email} {user.role ? <span style={{ color: '#888', fontSize: 13 }}>({user.role})</span> : null}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            <h3>Questions</h3>
            {questions.length === 0 ? (
                <div style={{ color: '#888' }}>No questions added yet.</div>
            ) : (
                <ul>
                    {questions.map((q, idx) => (
                        <li key={idx} style={{ marginBottom: 6 }}>
                            {q.type === 'sum' && Array.isArray(q.data)
                                ? sumAdminTemplate(q.data)
                                : q.type}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
