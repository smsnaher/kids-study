import React, { useState } from "react";
import { CreateExam } from "./CreateExam";

export const TeacherView: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div>
            <h2>👨‍🏫 Teacher View</h2>
            <p>This is the teacher view content.</p>
            <div className="tab-container">
                <button
                    className={`tab-button${activeTab === 0 ? " active" : ""}`}
                    onClick={() => setActiveTab(0)}
                >
                    Create Exam
                </button>
                <button
                    className={`tab-button${activeTab === 1 ? " active" : ""}`}
                    onClick={() => setActiveTab(1)}
                >
                    Tab 2
                </button>
                <button
                    className={`tab-button${activeTab === 2 ? " active" : ""}`}
                    onClick={() => setActiveTab(2)}
                >
                    Tab 3
                </button>
            </div>
            <div className="tab-content">
                {activeTab === 0 && <CreateExam />}
                {activeTab === 1 && <><h3>Tab 2 Content</h3><p>This is the content for Tab 2.</p></>}
                {activeTab === 2 && <><h3>Tab 3 Content</h3><p>This is the content for Tab 3.</p></>}
            </div>
        </div>
    );
};
