import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { logoutUser } from '../firebase/auth';
import { StudentView } from './tabs/StudentView';
import { TeacherView } from './tabs/TeacherView';

const Dashboard: React.FC = () => {
  const { currentUser, userData, switchUserRole } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 style={{ color: 'green', fontSize: '24px' }}>Welcome {userData?.displayName || 'User'}</h1>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="user-info">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>User Information</h2>
          <button className={`edit-button ${userData?.role}`} onClick={switchUserRole}>
            Switch to {userData?.role === 'teacher' ? 'Student 👨‍🎓 ' : 'Teacher 👨‍🏫 '}
          </button>
        </div>
        <div className="info-item">
          <strong>Email:</strong> {currentUser?.email}
        </div>
      </div>

      <div className="dashboard-content">
        {/* If detailExam is set, show ExamDetail, otherwise show TeacherView or StudentView */}
        {userData?.role === 'teacher' ? (
          <TeacherView />
        ) : (
          <StudentView />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
