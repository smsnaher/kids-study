import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchStudentExamsCached } from '../../services/cachedDataService';
import { Link } from 'react-router-dom';
import type { Exam } from '../../data/examData';
import { CacheIndicator } from '../CacheIndicator';

export const StudentView: React.FC = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<Exam[]>([]);

    const fetchExams = async (forceRefresh: boolean = false) => {
        if (!currentUser) return;
        setLoading(true);
        
        try {
            const examObjs = await fetchStudentExamsCached(currentUser.uid, forceRefresh);
            setExams(examObjs as Exam[]);
        } catch (error) {
            console.error('Error fetching student exams:', error);
            setExams([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, [currentUser]);

    if (!currentUser) return <div>Please log in as a student to view your exams.</div>;
    if (loading) return <div>Loading assigned exams...</div>;

    // Unique exams
    const uniqueExams = Array.from(new Map(exams.map(e => [e.id || e.docId, e])).values());

    return (
        <div>
            <CacheIndicator position="top-left" showDetails={true} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>👨‍🎓 My Exams</h2>
                <button 
                    onClick={() => fetchExams(true)} 
                    disabled={loading}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#0077ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    {loading ? 'Loading...' : '🔄 Refresh'}
                </button>
            </div>
            {uniqueExams.length === 0 ? (
                <div>No exams assigned to you.</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {uniqueExams.map(exam => (
                        <li key={exam.id || exam.docId} style={{ marginBottom: 16 }}>
                            <Link to={`/kids-study/exam/${exam.id || exam.docId}`} style={{ fontSize: 18, textDecoration: 'underline', color: '#0077ff' }}>
                                {exam.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
