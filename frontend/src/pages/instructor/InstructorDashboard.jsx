import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SessionManagement from './SessionManagement';
import AttendanceManagement from './AttendanceManagement';
import StudentManagement from './StudentManagement';
import ExcuseManagement from './ExcuseManagement';
import AppealManagement from './AppealManagement';
import ReportManagement from './ReportManagement';
import AnnouncementManagement from './AnnouncementManagement';
import MessageManagement from './MessageManagement';
import PollManagement from './PollManagement';
import PolicyManagement from './PolicyManagement';
import NotificationCenter from '../../components/NotificationCenter';

const InstructorDashboard = () => {
  const { logout, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('sessions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    // location.state에서 전달된 courseId와 activeTab 처리
    if (location.state?.courseId) {
      setSelectedCourse(location.state.courseId);
    }
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setCourses(response.data);
      if (response.data.length > 0 && !selectedCourse) {
        setSelectedCourse(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>교원 대시보드</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NotificationCenter />
          <button className="btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="card">
          <p>담당 과목이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>과목 선택</label>
            <select
              className="input"
              value={selectedCourse || ''}
              onChange={(e) => setSelectedCourse(parseInt(e.target.value))}
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.code}-{course.section})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)' }}>
              <button
                className="btn"
                onClick={() => setActiveTab('sessions')}
                style={{
                  backgroundColor: activeTab === 'sessions' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'sessions' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                수업 세션 관리
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('attendance')}
                style={{
                  backgroundColor: activeTab === 'attendance' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'attendance' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                출석 관리
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('students')}
                style={{
                  backgroundColor: activeTab === 'students' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'students' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                수강생 관리
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('excuse')}
                style={{
                  backgroundColor: activeTab === 'excuse' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'excuse' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                공결 관리
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('appeal')}
                style={{
                  backgroundColor: activeTab === 'appeal' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'appeal' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                이의제기 관리
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('report')}
                style={{
                  backgroundColor: activeTab === 'report' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'report' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                리포트/통계
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('announcement')}
                style={{
                  backgroundColor: activeTab === 'announcement' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'announcement' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                공지사항
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('message')}
                style={{
                  backgroundColor: activeTab === 'message' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'message' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                메시지
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('poll')}
                style={{
                  backgroundColor: activeTab === 'poll' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'poll' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                투표
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('policy')}
                style={{
                  backgroundColor: activeTab === 'policy' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'policy' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                출석 정책 설정
              </button>
            </div>
          </div>

          {selectedCourse && (
            <>
              {activeTab === 'sessions' && <SessionManagement courseId={selectedCourse} />}
              {activeTab === 'attendance' && <AttendanceManagement courseId={selectedCourse} />}
              {activeTab === 'students' && <StudentManagement courseId={selectedCourse} />}
              {activeTab === 'excuse' && <ExcuseManagement courseId={selectedCourse} />}
              {activeTab === 'appeal' && <AppealManagement courseId={selectedCourse} />}
              {activeTab === 'report' && <ReportManagement courseId={selectedCourse} />}
              {activeTab === 'announcement' && <AnnouncementManagement courseId={selectedCourse} />}
              {activeTab === 'poll' && <PollManagement courseId={selectedCourse} />}
              {activeTab === 'policy' && <PolicyManagement courseId={selectedCourse} />}
            </>
          )}
          {activeTab === 'message' && <MessageManagement courses={courses} />}
        </>
      )}
    </div>
  );
};

export default InstructorDashboard;

