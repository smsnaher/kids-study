import React, { useState } from 'react';
import { addQuestionGroupType } from '../../data/groupTypeService';
import styles from './ExamDetail.module.css';
import { QuestionGroupType } from '../questions/QuestionGroupType';
import { QuestionAddingForm } from '../questions/QuestionAddingForm';


interface AddQuestionModalProps {
  examId: string;
  question: string;
  setQuestion: (q: string) => void;
  saving: boolean;
  error: string | null;
  success: boolean;
  onClose: () => void;
  onSubmit: (selectedGroupId?: string) => void;
  sumNumbers: string[];
  setSumNumbers: (nums: string[]) => void;
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  examId,
  question,
  setQuestion,
  saving,
  error,
  success,
  onClose,
  onSubmit,
  sumNumbers,
  setSumNumbers
}) => {
  const [groupTypeError, setGroupTypeError] = useState<string | null>(null);
  const [groupTypeSuccess, setGroupTypeSuccess] = useState(false);
  const [groupTypeSaving, setGroupTypeSaving] = useState(false);

  // Handler to save group type to Firestore
  const handleAddType = async (type: string, mark: string) => {
    console.log('Adding group type:', { examId, type, mark });

    setGroupTypeSaving(true);
    setGroupTypeError(null);
    try {
      await addQuestionGroupType(examId, type, mark);
      setGroupTypeSuccess(true);
      setTimeout(() => setGroupTypeSuccess(false), 1200);
    } catch (err) {
      setGroupTypeError('Failed to add group type');
    } finally {
      setGroupTypeSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 style={{ marginTop: 0 }}>Question Group</h3>
          <button onClick={onClose} className={styles.closeBtn}>&times;</button>
        </div>

        <QuestionGroupType
          saving={groupTypeSaving}
          onAddType={handleAddType}
        />
        {groupTypeError && <div className={styles.error}>{groupTypeError}</div>}
        {groupTypeSuccess && <div className={styles.success}>Group type added!</div>}

        <QuestionAddingForm
          question={question}
          setQuestion={setQuestion}
          saving={saving}
          error={error ?? undefined}
          success={success}
          onClose={onClose}
          onSubmit={onSubmit}
          sumNumbers={sumNumbers.map(Number)}
          setSumNumbers={(nums: number[]) => setSumNumbers(nums.map(String))}
        />
      </div>
    </div>
  );
};

export default AddQuestionModal;

