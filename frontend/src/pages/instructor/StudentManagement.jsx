import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const StudentManagement = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      const enrollmentsRes = await axios.get(`/api/enrollments/courses/${courseId}/enrollments`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setEnrollments(enrollmentsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>수강생 목록</h2>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      <div>
        <h3 style={{ marginBottom: '0.75rem' }}>수강 중인 학생</h3>
        {enrollments.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
            수강 중인 학생이 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>학번</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>이름</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>이메일</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem' }}>{enrollment.user?.student_id || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>{enrollment.user?.name || 'N/A'}</td>
                    <td style={{ padding: '0.75rem' }}>{enrollment.user?.email || 'N/A'}</td>
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

export default StudentManagement;

