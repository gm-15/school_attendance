import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DepartmentManagement from './DepartmentManagement';
import SemesterManagement from './SemesterManagement';
import CourseManagement from './CourseManagement';
import EnrollmentManagement from './EnrollmentManagement';
import UserManagement from './UserManagement';
import AuditLogView from './AuditLogView';
import SystemReport from './SystemReport';
import SystemSettings from './SystemSettings';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('departments');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="container">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>관리자 대시보드</h1>
        <button className="btn" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)' }}>
          <button
            className="btn"
            onClick={() => setActiveTab('departments')}
            style={{
              backgroundColor: activeTab === 'departments' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'departments' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              padding: '0.75rem 1rem'
            }}
          >
            학과 관리
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('semesters')}
            style={{
              backgroundColor: activeTab === 'semesters' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'semesters' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              padding: '0.75rem 1rem'
            }}
          >
            학기 관리
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('courses')}
            style={{
              backgroundColor: activeTab === 'courses' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'courses' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              padding: '0.75rem 1rem'
            }}
          >
            과목 관리
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('enrollments')}
            style={{
              backgroundColor: activeTab === 'enrollments' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'enrollments' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              padding: '0.75rem 1rem'
            }}
          >
            수강신청 관리
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('users')}
            style={{
              backgroundColor: activeTab === 'users' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'users' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              padding: '0.75rem 1rem'
            }}
          >
            사용자 관리
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('audits')}
            style={{
              backgroundColor: activeTab === 'audits' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'audits' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              padding: '0.75rem 1rem'
            }}
          >
            감사 로그
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('reports')}
            style={{
              backgroundColor: activeTab === 'reports' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'reports' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              padding: '0.75rem 1rem'
            }}
          >
            시스템 리포트
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('settings')}
            style={{
              backgroundColor: activeTab === 'settings' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'settings' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              padding: '0.75rem 1rem'
            }}
          >
            시스템 설정
          </button>
        </div>
      </div>

      {activeTab === 'departments' && <DepartmentManagement />}
      {activeTab === 'semesters' && <SemesterManagement />}
      {activeTab === 'courses' && <CourseManagement />}
      {activeTab === 'enrollments' && <EnrollmentManagement />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'audits' && <AuditLogView />}
      {activeTab === 'reports' && <SystemReport />}
      {activeTab === 'settings' && <SystemSettings />}
    </div>
  );
};

export default AdminDashboard;

