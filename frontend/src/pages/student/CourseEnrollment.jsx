import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const CourseEnrollment = () => {
  const { accessToken } = useAuth();
  const [allCourses, setAllCourses] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        axios.get('/api/courses', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('/api/enrollments/my', { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);
      setAllCourses(coursesRes.data);
      setMyEnrollments(enrollmentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await axios.post(`/api/enrollments/courses/${courseId}/enrollments`, {
        user_id: null // 학생 자신이므로 null (백엔드에서 req.user.id 사용)
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSuccess('수강신청이 완료되었습니다.');
      setError('');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || '수강신청에 실패했습니다.');
      setSuccess('');
    }
  };

  const handleUnenroll = async (enrollmentId) => {
    if (!window.confirm('정말 수강 취소하시겠습니까?')) return;

    try {
      await axios.delete(`/api/enrollments/${enrollmentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSuccess('수강 취소가 완료되었습니다.');
      setError('');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || '수강 취소에 실패했습니다.');
      setSuccess('');
    }
  };

  if (loading) return <div>Loading...</div>;

  const enrolledCourseIds = myEnrollments.map(e => e.course_id);
  const availableCourses = allCourses.filter(c => !enrolledCourseIds.includes(c.id));

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>수강신청</h2>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '0.375rem' }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>수강 중인 과목</h3>
        {myEnrollments.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
            수강 중인 과목이 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>과목명</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>과목 코드</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>분반</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>담당 교원</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {myEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem' }}>{enrollment.course?.title || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>{enrollment.course?.code || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>{enrollment.course?.section || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>{enrollment.course?.instructor?.name || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        className="btn"
                        onClick={() => handleUnenroll(enrollment.id)}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--error)', color: 'white' }}
                      >
                        수강 취소
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: '0.75rem' }}>수강신청 가능한 과목</h3>
        {availableCourses.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
            수강신청 가능한 과목이 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>과목명</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>과목 코드</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>분반</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>담당 교원</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
                </tr>
              </thead>
              <tbody>
                {availableCourses.map((course) => (
                  <tr key={course.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem' }}>{course.title}</td>
                    <td style={{ padding: '0.75rem' }}>{course.code}</td>
                    <td style={{ padding: '0.75rem' }}>{course.section}</td>
                    <td style={{ padding: '0.75rem' }}>{course.instructor?.name || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        className="btn"
                        onClick={() => handleEnroll(course.id)}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        수강신청
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseEnrollment;

