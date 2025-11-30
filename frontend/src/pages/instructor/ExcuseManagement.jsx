import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import FileViewer from '../../components/FileViewer';

const ExcuseManagement = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [excuses, setExcuses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [filteredExcuses, setFilteredExcuses] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedExcuse, setSelectedExcuse] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '',
    instructor_comment: ''
  });

  useEffect(() => {
    if (courseId) {
      fetchExcuses();
    }
  }, [courseId]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredExcuses(excuses);
    } else {
      setFilteredExcuses(excuses.filter(e => e.status === statusFilter));
    }
  }, [statusFilter, excuses]);

  const fetchExcuses = async () => {
    try {
      const [excusesResponse, sessionsResponse] = await Promise.all([
        axios.get('/api/excuses', {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        axios.get(`/api/courses/${courseId}/sessions`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ]);
      
      const sessionIds = (sessionsResponse.data || []).map(s => s.id);
      const filtered = excusesResponse.data.filter(excuse => 
        sessionIds.includes(excuse.session_id)
      );
      
      setSessions(sessionsResponse.data || []);
      setExcuses(filtered);
    } catch (error) {
      console.error('Failed to fetch excuses:', error);
      setError('공결 신청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 주차별, 학생별로 그룹화
  const getGroupedExcuses = () => {
    const grouped = {};
    
    filteredExcuses.forEach(excuse => {
      const week = excuse.session?.week;
      const studentId = excuse.student_id;
      const key = `${week}-${studentId}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          week,
          student: excuse.student,
          excuses: [],
          status: excuse.status,
          reason_code: excuse.reason_code,
          reason_text: excuse.reason_text,
          files: excuse.files,
          instructor_comment: excuse.instructor_comment,
          submitted_at: excuse.submitted_at,
          reviewed_at: excuse.reviewed_at
        };
      }
      
      grouped[key].excuses.push(excuse);
    });
    
    return Object.values(grouped);
  };

  const handleReview = (excuse) => {
    setSelectedExcuse(excuse);
    setReviewData({
      status: excuse.status === 'pending' ? '' : excuse.status,
      instructor_comment: excuse.instructor_comment || ''
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
      await axios.patch(`/api/excuses/${selectedExcuse.id}`, {
        status: reviewData.status,
        instructor_comment: reviewData.instructor_comment || null
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setSuccess(`${selectedExcuse.session?.week}주차 공결 신청이 ${reviewData.status === 'approved' ? '승인' : '반려'}되었습니다.`);
      setShowReviewForm(false);
      setSelectedExcuse(null);
      fetchExcuses();
    } catch (error) {
      console.error('Failed to review excuse:', error);
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

  const reasonLabels = {
    '병가': '병가',
    '경조사': '경조사',
    '기타': '기타'
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>공결 관리</h2>

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
          총 {getGroupedExcuses().length}건
        </div>
      </div>

      {showReviewForm && selectedExcuse && (
        <div style={{ 
          marginBottom: '2rem', 
          padding: '1.5rem', 
          backgroundColor: 'var(--gray-50)', 
          borderRadius: '0.375rem',
          border: '2px solid var(--primary)'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>공결 신청 검토</h3>
          <form onSubmit={handleReviewSubmit}>
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>학생:</strong> {selectedExcuse.student?.name} ({selectedExcuse.student?.student_id})
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>주차:</strong> {selectedExcuse.session?.week}주차 (해당 주차의 모든 세션이 공결 처리됩니다)
              </div>
              {selectedExcuse.session?.start_at && (
                <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  첫 세션 시간: {new Date(selectedExcuse.session.start_at).toLocaleString('ko-KR')}
                </div>
              )}
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>사유:</strong> {reasonLabels[selectedExcuse.reason_code] || selectedExcuse.reason_code}
              </div>
              {selectedExcuse.reason_text && (
                <div style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                  <strong>사유 상세:</strong> {selectedExcuse.reason_text}
                </div>
              )}
              {selectedExcuse.files && selectedExcuse.files.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>첨부 파일:</strong>
                  {selectedExcuse.files.map((file, idx) => (
                    <div key={idx} style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}>
                      <FileViewer file={file} />
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                신청일: {new Date(selectedExcuse.submitted_at).toLocaleString('ko-KR')}
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
                  setSelectedExcuse(null);
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

      {filteredExcuses.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          공결 신청이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {getGroupedExcuses().map((group, idx) => {
            const sessionNumbers = group.excuses
              .map(e => e.session?.session_number)
              .filter(n => n !== undefined)
              .sort((a, b) => a - b);
            
            return (
              <div 
                key={idx} 
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
                      {group.student?.name} ({group.student?.student_id})
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      {group.week}주차 ({sessionNumbers.join(', ')}교시)
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      backgroundColor: statusColors[group.status] + '20',
                      color: statusColors[group.status],
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}>
                      {statusLabels[group.status]}
                    </span>
                    {group.status === 'pending' && (
                      <button 
                        className="btn" 
                        onClick={() => handleReview(group.excuses[0])}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        처리하기
                      </button>
                    )}
                  </div>
                </div>
                
                <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <strong>사유:</strong> {reasonLabels[group.reason_code] || group.reason_code}
                  </div>
                  {group.reason_text && (
                    <div style={{ marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                      {group.reason_text}
                    </div>
                  )}
                  {group.files && group.files.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>첨부 파일:</strong>
                      {group.files.map((file, idx) => (
                        <div key={idx} style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}>
                          <FileViewer file={file} />
                        </div>
                      ))}
                    </div>
                  )}
                  {group.instructor_comment && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                      <strong>내 코멘트:</strong> {group.instructor_comment}
                    </div>
                  )}
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    신청일: {new Date(group.submitted_at).toLocaleString('ko-KR')}
                    {group.reviewed_at && (
                      <> | 처리일: {new Date(group.reviewed_at).toLocaleString('ko-KR')}</>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExcuseManagement;

