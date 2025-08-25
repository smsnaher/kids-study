import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './CreateExam.module.css';
import { Timestamp } from 'firebase/firestore';
import { ExamModal } from './ExamModal';
import { useAuth } from '../../hooks/useAuth';
import { getUUID } from '../../utils/utils';
import { 
  fetchExamsByUserIdCached, 
  createExamCached, 
  updateExamCached, 
  deleteExamCached 
} from '../../services/cachedDataService';
import { CacheIndicator } from '../CacheIndicator';


interface Exam {
    id: string;
    name: string;
    userId: string;
    createdAt: Timestamp;
    docId: string;
}

export const CreateExam: React.FC = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [examName, setExamName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [exams, setExams] = useState<Exam[]>([]);
    const { currentUser } = useAuth();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    // Close modal and reset state
    const handleClose = () => {
        setModalOpen(false);
        setExamName('');
        setError(null);
        setSuccess(false);
    };

    const handleOpen = () => {
        setModalOpen(true);
        setExamName('');
        setError(null);
        setSuccess(false);
    };

    // Fetch exams for the current user
    const fetchExams = async (forceRefresh: boolean = false) => {
        if (!currentUser) {
            setExams([]);
            return;
        }
        try {
            const docsData = await fetchExamsByUserIdCached(currentUser.uid, forceRefresh);
            setExams(docsData);
        } catch {
            setExams([]);
        }
    };

    // useEffect(() => {
    //     console.log(exams);
    // }, [exams]);

    useEffect(() => {
        fetchExams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const handleSave = async () => {
        if (!examName.trim()) {
            setError('Exam Name is required');
            return;
        }
        if (!currentUser) {
            setError('User not authenticated');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Generate a short 9-character exam id
            const examId = getUUID(9);
            await createExamCached({
                id: examId,
                name: examName,
                userId: currentUser.uid,
                createdAt: new Date(),
            });
            setSuccess(true);
            await fetchExams(true); // Force refresh after creating new exam
            setTimeout(() => {
                // handleClose(); 
            }, 1000);
        } catch {
            setError('Failed to create exam');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <CacheIndicator position="top-right" showDetails={true} />
            <div className={styles.heading}>
                <h2>Create Exam</h2>
                <button onClick={handleOpen}>Create Exam</button>
            </div>
            {modalOpen && (
                <ExamModal
                    examName={examName}
                    onExamNameChange={e => setExamName(e.target.value)}
                    onSave={handleSave}
                    onClose={handleClose}
                    loading={loading}
                    error={error}
                    success={success}
                    styles={styles}
                />
            )}
            <div className={styles.examList} style={{ marginTop: 32 }}>
                <h3>Your Exams</h3>
                {exams.length === 0 ? (
                    <div>No exams found.</div>
                ) : (
                    <ol>
                        {exams.map(exam => (
                            <li key={exam.id || exam.docId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {editingId === exam.docId ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            style={{ marginRight: 8, padding: '2px 6px', fontSize: 15 }}
                                        />
                                        <button
                                            style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer', marginRight: 4 }}
                                            onClick={async () => {
                                                if (!editingName.trim()) return;
                                                await updateExamCached(exam.docId, exam.id, exam.userId, { name: editingName });
                                                setEditingId(null);
                                                setEditingName('');
                                                await fetchExams(true);
                                            }}
                                        >
                                            Save
                                        </button>
                                        <button
                                            style={{ background: '#bbb', color: '#222', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditingName('');
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to={`exam/${exam.id}`}
                                            style={{ color: '#888', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            {exam.name}
                                        </Link>
                                        <button
                                            style={{ marginLeft: 8, background: '#2980b9', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}
                                            onClick={() => {
                                                setEditingId(exam.docId);
                                                setEditingName(exam.name);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            style={{ marginLeft: 8, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to delete this exam?')) {
                                                    await deleteExamCached(exam.docId, exam.id, exam.userId);
                                                    await fetchExams(true);
                                                }
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </div>
    );
};