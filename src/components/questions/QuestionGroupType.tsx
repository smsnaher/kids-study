import React, { useState, useContext } from 'react';
import styles from '../tabs/ExamDetail.module.css';
import { QuestionGroupContext } from '../tabs/AddQuestionModal';

interface GroupType {
    id: string;
    type: string;
    mark: string;
}

interface QuestionTypeGroupProps {
    saving: boolean;
    onAddType: (type: string, mark: string) => void;
    groupTypes: { id: string; type: string; mark: string }[];
}


export const QuestionGroupType: React.FC<QuestionTypeGroupProps> = ({ saving, onAddType, groupTypes }) => {
    const [type, setType] = useState('');
    const [mark, setMark] = useState('');
    const [view, setView] = useState(false);
    const { setGroupTypesSelected } = useContext(QuestionGroupContext);
    const { setGroupTypes } = useContext(QuestionGroupContext);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddType(type, mark);
        setType('');
        setMark('');

    };

    const addGroupType = (groupType: { id: string; type: string; mark: string }) => {
        console.log(groupType);

        setGroupTypes((prev: GroupType[]) => prev.filter(gt => gt.id !== groupType.id));

        setGroupTypesSelected((prev: GroupType[]) => [
            ...prev,
            { id: groupType.id, type: groupType.type, mark: groupType.mark }
        ]);


        setView(false);
    };

    return (
        <>
            <form style={{ marginBottom: 24, position: 'relative' }} onSubmit={handleSubmit}>
                <input type="text" placeholder="Question Type" value={type} onChange={e => setType(e.target.value)} onFocus={() => setView(true)} />
                <input type="text" placeholder="Marks" value={mark} onChange={e => setMark(e.target.value)} />
                <button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                </button>
                {view && (
                    <div className={styles.existingGroups}>
                        {groupTypes.length === 0 ? (
                            <p>No group types available.</p>
                        ) : (
                            <ul>
                                {groupTypes.map(gt => (
                                    <li key={gt.id} onClick={() => addGroupType(gt)}>
                                        {gt.type} - {gt.mark} marks
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </form>

        </>
    );
};
