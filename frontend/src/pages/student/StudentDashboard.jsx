import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AttendanceCheck from './AttendanceCheck';
import AttendanceHistory from './AttendanceHistory';
import CourseEnrollment from './CourseEnrollment';
import ExcuseRequest from './ExcuseRequest';
import AppealRequest from './AppealRequest';
import AnnouncementView from './AnnouncementView';
import MessageView from './MessageView';
import PollView from './PollView';
import NotificationCenter from '../../components/NotificationCenter';

const StudentDashboard = () => {
  const { logout, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('check');
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
      // 학생의 수강 과목 가져오기
      const response = await axios.get('/api/enrollments/my', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const coursesData = response.data.map(e => e.course).filter(c => c !== null);
      setCourses(coursesData);
      if (coursesData.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesData[0].id);
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
        <h1>학생 대시보드</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NotificationCenter />
          <button className="btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="card">
          <p>수강 중인 과목이 없습니다.</p>
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
                onClick={() => setActiveTab('enrollment')}
                style={{
                  backgroundColor: activeTab === 'enrollment' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'enrollment' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                수강신청
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('check')}
                style={{
                  backgroundColor: activeTab === 'check' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'check' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                출석 체크
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('history')}
                style={{
                  backgroundColor: activeTab === 'history' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'history' ? 'white' : 'var(--text)',
                  border: 'none',
                  borderRadius: '0.375rem 0.375rem 0 0',
                  padding: '0.75rem 1rem'
                }}
              >
                출석 현황
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
                공결 신청
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
                이의제기
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
            </div>
          </div>

          {activeTab === 'enrollment' && <CourseEnrollment />}
          {selectedCourse && activeTab === 'check' && <AttendanceCheck courseId={selectedCourse} />}
          {selectedCourse && activeTab === 'history' && <AttendanceHistory courseId={selectedCourse} />}
          {selectedCourse && activeTab === 'excuse' && <ExcuseRequest courseId={selectedCourse} />}
          {selectedCourse && activeTab === 'appeal' && <AppealRequest courseId={selectedCourse} />}
          {selectedCourse && activeTab === 'announcement' && <AnnouncementView courseId={selectedCourse} />}
          {activeTab === 'message' && <MessageView courses={courses} />}
          {selectedCourse && activeTab === 'poll' && <PollView courseId={selectedCourse} />}
        </>
      )}
    </div>
  );
};

export default StudentDashboard;

