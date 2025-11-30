import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AppealManagement = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [appeals, setAppeals] = useState([]);
  const [filteredAppeals, setFilteredAppeals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '',
    instructor_comment: '',
    newStatus: 1,
    newLateMinutes: 0
  });

  useEffect(() => {
    if (courseId) {
      fetchAppeals();
    }
  }, [courseId]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredAppeals(appeals);
    } else {
      setFilteredAppeals(appeals.filter(a => a.status === statusFilter));
    }
  }, [statusFilter, appeals]);

  const fetchAppeals = async () => {
    try {
      const response = await axios.get('/api/appeals', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // 현재 과목의 출석에 대한 이의제기만 필터링
      const sessionsResponse = await axios.get(`/api/courses/${courseId}/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const sessionIds = (sessionsResponse.data || []).map(s => s.id);
      
      const filtered = response.data.filter(appeal => 
        appeal.attendance?.session && sessionIds.includes(appeal.attendance.session.id)
      );
      
      setAppeals(filtered);
    } catch (error) {
      console.error('Failed to fetch appeals:', error);
      setError('이의제기 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (appeal) => {
    setSelectedAppeal(appeal);
    setReviewData({
      status: appeal.status === 'pending' ? '' : appeal.status,
      instructor_comment: appeal.instructor_comment || '',
      newStatus: appeal.attendance?.status || 1,
      newLateMinutes: appeal.attendance?.late_minutes || 0
    });
    setShowReviewForm(true);
    setError('');
    setSuccess('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!reviewData.status || !['approved', 'rejected'].includes(reviewData.status)) {
      setError('승인 또는 반려를 선택해주세요.');
      return;
    }

    try {
      // 이의제기 처리
      await axios.patch(`/api/appeals/${selectedAppeal.id}`, {
        status: reviewData.status,
        instructor_comment: reviewData.instructor_comment || null
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // 승인 시 출석 정정
      if (reviewData.status === 'approved') {
        await axios.patch(`/api/attendance/${selectedAppeal.attendance_id}`, {
          status: reviewData.newStatus,
          late_minutes: reviewData.newLateMinutes
        }, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }

      setSuccess(`이의제기가 ${reviewData.status === 'approved' ? '승인' : '반려'}되었습니다.`);
      setShowReviewForm(false);
      setSelectedAppeal(null);
      fetchAppeals();
    } catch (error) {
      console.error('Failed to review appeal:', error);
      setError(error.response?.data?.error || '처리에 실패했습니다.');
    }
  };

  const statusLabels = {
    pending: '대기중',
    approved: '승인',
    rejected: '반려'
  };

  const statusColors = {
    pending: '#9ca3af',
    approved: '#16a34a',
    rejected: '#dc2626'
  };

  const attendanceStatusLabels = {
    0: '미정',
    1: '출석',
    2: '지각',
    3: '결석',
    4: '공결'
  };

  const attendanceStatusColors = {
    0: '#9ca3af',
    1: '#16a34a',
    2: '#eab308',
    3: '#dc2626',
    4: '#3b82f6'
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>이의제기 관리</h2>

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

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <label style={{ fontWeight: 'bold' }}>상태 필터:</label>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="all">전체</option>
          <option value="pending">대기중</option>
          <option value="approved">승인</option>
          <option value="rejected">반려</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          총 {filteredAppeals.length}건
        </div>
      </div>

      {showReviewForm && selectedAppeal && (
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          backgroundColor: 'var(--gray-50)', 
          borderRadius: '0.375rem',
          border: '2px solid var(--primary)'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>이의제기 검토</h3>
          <form onSubmit={handleReviewSubmit}>
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>학생:</strong> {selectedAppeal.student?.name} ({selectedAppeal.student?.student_id})
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>세션:</strong> {selectedAppeal.attendance?.session?.week}주차 {selectedAppeal.attendance?.session?.session_number}교시
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>현재 출석 상태:</strong>{' '}
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  backgroundColor: attendanceStatusColors[selectedAppeal.attendance?.status] + '20',
                  color: attendanceStatusColors[selectedAppeal.attendance?.status],
                  fontWeight: 'bold'
                }}>
                  {attendanceStatusLabels[selectedAppeal.attendance?.status]}
                </span>
                {selectedAppeal.attendance?.late_minutes > 0 && (
                  <> ({selectedAppeal.attendance.late_minutes}분 지각)</>
                )}
              </div>
              <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                <strong>이의제기 사유:</strong>
                <div style={{ marginTop: '0.25rem' }}>{selectedAppeal.message}</div>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                신청일: {new Date(selectedAppeal.submitted_at).toLocaleString('ko-KR')}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                처리 결과 *
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="status"
                    value="approved"
                    checked={reviewData.status === 'approved'}
                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                  />
                  <span>승인</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="status"
                    value="rejected"
                    checked={reviewData.status === 'rejected'}
                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                  />
                  <span>반려</span>
                </label>
              </div>
            </div>

            {reviewData.status === 'approved' && (
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.375rem', border: '1px solid var(--primary)' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  출석 정정 (승인 시)
                </label>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    출석 상태
                  </label>
                  <select
                    className="input"
                    value={reviewData.newStatus}
                    onChange={(e) => setReviewData({ ...reviewData, newStatus: parseInt(e.target.value) })}
                  >
                    <option value={0}>미정</option>
                    <option value={1}>출석</option>
                    <option value={2}>지각</option>
                    <option value={3}>결석</option>
                    <option value={4}>공결</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    지각 시간 (분)
                  </label>
                  <input
                    type="number"
                    className="input"
                    value={reviewData.newLateMinutes}
                    onChange={(e) => setReviewData({ ...reviewData, newLateMinutes: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                코멘트 (선택)
              </label>
              <textarea
                className="input"
                value={reviewData.instructor_comment}
                onChange={(e) => setReviewData({ ...reviewData, instructor_comment: e.target.value })}
                rows={3}
                placeholder="처리 사유나 코멘트를 입력해주세요."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn">
                처리하기
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={() => {
                  setShowReviewForm(false);
                  setSelectedAppeal(null);
                  setError('');
                  setSuccess('');
                }}
                style={{ backgroundColor: 'var(--gray-400)' }}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {filteredAppeals.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          이의제기가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredAppeals.map(appeal => (
            <div 
              key={appeal.id} 
              style={{ 
                padding: '1rem', 
                backgroundColor: 'white', 
                borderRadius: '0.375rem',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {appeal.student?.name} ({appeal.student?.student_id})
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    {appeal.attendance?.session?.week}주차 {appeal.attendance?.session?.session_number}교시
                    {appeal.attendance?.session?.start_at && (
                      <> - {new Date(appeal.attendance.session.start_at).toLocaleString('ko-KR')}</>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    <strong>현재 출석 상태:</strong>{' '}
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      backgroundColor: attendanceStatusColors[appeal.attendance?.status] + '20',
                      color: attendanceStatusColors[appeal.attendance?.status],
                      fontWeight: 'bold'
                    }}>
                      {attendanceStatusLabels[appeal.attendance?.status]}
                    </span>
                    {appeal.attendance?.late_minutes > 0 && (
                      <> ({appeal.attendance.late_minutes}분 지각)</>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    backgroundColor: statusColors[appeal.status] + '20',
                    color: statusColors[appeal.status],
                    fontWeight: 'bold',
                    fontSize: '0.875rem'
                  }}>
                    {statusLabels[appeal.status]}
                  </span>
                  {appeal.status === 'pending' && (
                    <button 
                      className="btn" 
                      onClick={() => handleReview(appeal)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                    >
                      처리하기
                    </button>
                  )}
                </div>
              </div>
              
              <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>이의제기 사유:</strong>
                  <div style={{ marginTop: '0.25rem', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                    {appeal.message}
                  </div>
                </div>
                {appeal.instructor_comment && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                    <strong>내 코멘트:</strong> {appeal.instructor_comment}
                  </div>
                )}
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  신청일: {new Date(appeal.submitted_at).toLocaleString('ko-KR')}
                  {appeal.reviewed_at && (
                    <> | 처리일: {new Date(appeal.reviewed_at).toLocaleString('ko-KR')}</>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppealManagement;

