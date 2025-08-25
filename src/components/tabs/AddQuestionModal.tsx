import React, { useEffect, useState, createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { addQuestionGroupType, fetchAllGroupTypes } from '../../data/groupTypeService';
import styles from './ExamDetail.module.css';
import { QuestionGroupType } from '../questions/QuestionGroupType';
import { QuestionAddingForm } from '../questions/QuestionAddingForm';


interface QuestionGroup {
  id: string;
  type: string;
  mark: string;
}

interface QuestionGroupContextType {
  groupTypes: QuestionGroup[];
  setGroupTypes: Dispatch<SetStateAction<QuestionGroup[]>>;
  groupTypesSelected: QuestionGroup[];
  setGroupTypesSelected: Dispatch<SetStateAction<QuestionGroup[]>>;
}

export const QuestionGroupContext = createContext<QuestionGroupContextType>({
  groupTypes: [],
  setGroupTypes: () => { },
  groupTypesSelected: [],
  setGroupTypesSelected: () => { },
});

interface AddQuestionModalProps {
  examId: string;
  question: string;
  setQuestion: (q: string) => void;
  saving: boolean;
  error: string | null;
  success: boolean;
  onClose: () => void;
  onSubmit: () => void;
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
  const [groupTypes, setGroupTypes] = useState<{ id: string; type: string; mark: string }[]>([]);
  const [groupTypesSelected, setGroupTypesSelected] = useState<QuestionGroup[]>([]);

  // Handler to save group type to Firestore
  const handleAddType = async (type: string, mark: string) => {
    console.log('Adding group type:', { examId, type, mark });

    setGroupTypeSaving(true);
    setGroupTypeError(null);
    try {
      await addQuestionGroupType(examId, type, mark);
      setGroupTypes(prev => [...prev, { id: examId, type, mark }]);
      setGroupTypeSuccess(true);
      setTimeout(() => setGroupTypeSuccess(false), 1200);
    } catch (err) {
      setGroupTypeError('Failed to add group type');
    } finally {
      setGroupTypeSaving(false);
    }
  };

  useEffect(() => {
    // Replace this with your actual fetchAllGroupTypes API call
    async function fetchGroupTypes() {
      // Fetch data from src/data/groupTypeService.ts
      const data = await fetchAllGroupTypes();
      // Ensure each group type has both id and name
      const groupTypesWithName = data.map((item: any) => ({
        id: item.id,
        type: item.type && item.type,
        mark: item.mark && item.mark
      }));
      setGroupTypes(groupTypesWithName);
    }
    fetchGroupTypes();
  }, []);

  return (
    /* add a provider to share state info between components */
    <QuestionGroupContext.Provider value={{ groupTypes, setGroupTypes, groupTypesSelected, setGroupTypesSelected }}>
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3 style={{ marginTop: 0 }}>Question Group</h3>
            <button onClick={onClose} className={styles.closeBtn}>&times;</button>
          </div>

          <QuestionGroupType
            saving={groupTypeSaving}
            onAddType={handleAddType}
            groupTypes={groupTypes}
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
    </QuestionGroupContext.Provider>
  );
};

export default AddQuestionModal;

