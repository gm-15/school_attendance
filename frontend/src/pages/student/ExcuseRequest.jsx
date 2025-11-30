import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import FileViewer from '../../components/FileViewer';

const ExcuseRequest = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [myExcuses, setMyExcuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [formData, setFormData] = useState({
    reason_code: '',
    reason_text: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchSessions();
      fetchMyExcuses();
    }
  }, [courseId]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setError('세션 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyExcuses = async () => {
    try {
      const response = await axios.get('/api/excuses', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      // 현재 과목의 세션에 대한 공결만 필터링
      const sessionIds = sessions.map(s => s.id);
      const filtered = response.data.filter(excuse => 
        sessionIds.includes(excuse.session_id)
      );
      setMyExcuses(filtered);
    } catch (error) {
      console.error('Failed to fetch excuses:', error);
    }
  };

  // 주차별로 그룹화
  const getWeeks = () => {
    const weekSet = new Set();
    sessions.forEach(session => {
      if (session.week) weekSet.add(session.week);
    });
    return Array.from(weekSet).sort((a, b) => a - b);
  };

  // 특정 주차에 공결 신청이 있는지 확인
  const hasExcuseForWeek = (week) => {
    const weekSessions = sessions.filter(s => s.week === week);
    const weekSessionIds = weekSessions.map(s => s.id);
    return myExcuses.some(e => weekSessionIds.includes(e.session_id));
  };

  useEffect(() => {
    if (courseId && sessions.length > 0) {
      fetchMyExcuses();
    }
  }, [sessions, courseId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 체크 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    if (!selectedWeek) {
      setError('주차를 선택해주세요.');
      setUploading(false);
      return;
    }

    if (!formData.reason_code) {
      setError('사유를 선택해주세요.');
      setUploading(false);
      return;
    }

    try {
      let fileData = null;
      
      // 파일이 있으면 먼저 업로드
      if (formData.file) {
        const formDataFile = new FormData();
        formDataFile.append('file', formData.file);
        formDataFile.append('related_type', 'excuse_request');
        // 파일명을 별도로 보내서 인코딩 문제 방지
        formDataFile.append('original_filename', formData.file.name);
        
        console.log('Uploading file with name:', formData.file.name);
        
        const uploadResponse = await axios.post('/api/files', formDataFile, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('Upload response - original_name:', uploadResponse.data.original_name);
        
        fileData = {
          id: uploadResponse.data.id,
          original_name: uploadResponse.data.original_name,
          stored_path: uploadResponse.data.stored_path,
          mime_type: uploadResponse.data.mime_type
        };
      }

      // 공결 신청 (주차 단위)
      await axios.post(`/api/excuses/courses/${courseId}/weeks/${selectedWeek}/excuses`, {
        reason_code: formData.reason_code,
        reason_text: formData.reason_text || null,
        files: fileData ? [fileData] : []
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setSuccess(`${selectedWeek}주차 공결 신청이 완료되었습니다.`);
      setShowForm(false);
      setFormData({ reason_code: '', reason_text: '', file: null });
      setSelectedWeek(null);
      fetchMyExcuses();
    } catch (error) {
      console.error('Failed to submit excuse:', error);
      setError(error.response?.data?.error || '공결 신청에 실패했습니다.');
    } finally {
      setUploading(false);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>공결 신청</h2>
        <button 
          className="btn" 
          onClick={() => {
            setShowForm(!showForm);
            setError('');
            setSuccess('');
          }}
        >
          {showForm ? '취소' : '신청하기'}
        </button>
      </div>

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

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              주차 선택 *
            </label>
            <select
              className="input"
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
              required
            >
              <option value="">주차를 선택하세요</option>
              {getWeeks().map(week => {
                const hasExcuse = hasExcuseForWeek(week);
                const weekSessions = sessions.filter(s => s.week === week);
                return (
                  <option 
                    key={week} 
                    value={week}
                    disabled={hasExcuse}
                  >
                    {week}주차 ({weekSessions.length}개 세션) {hasExcuse ? '(이미 신청됨)' : ''}
                  </option>
                );
              })}
            </select>
            {selectedWeek && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                선택된 주차의 모든 세션이 공결 처리됩니다.
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              사유 *
            </label>
            <select
              className="input"
              value={formData.reason_code}
              onChange={(e) => setFormData({ ...formData, reason_code: e.target.value })}
              required
            >
              <option value="">사유를 선택하세요</option>
              <option value="병가">병가</option>
              <option value="경조사">경조사</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              사유 상세 (선택)
            </label>
            <textarea
              className="input"
              value={formData.reason_text}
              onChange={(e) => setFormData({ ...formData, reason_text: e.target.value })}
              rows={4}
              placeholder="사유를 상세히 입력해주세요."
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              첨부 파일 (선택, 최대 1개, 10MB 이하)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.zip"
              style={{ width: '100%', padding: '0.5rem' }}
            />
            {formData.file && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                선택된 파일: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)}MB)
              </div>
            )}
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              허용 형식: 사진, PDF, 오피스 문서, 한글, ZIP
            </div>
          </div>

          <button 
            type="submit" 
            className="btn" 
            disabled={uploading}
            style={{ width: '100%' }}
          >
            {uploading ? '신청 중...' : '신청하기'}
          </button>
        </form>
      )}

      <div>
        <h3 style={{ marginBottom: '1rem' }}>내 공결 신청 내역</h3>
        {myExcuses.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            공결 신청 내역이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {getWeeks().map(week => {
              const weekExcuses = myExcuses.filter(e => {
                const session = sessions.find(s => s.id === e.session_id);
                return session && session.week === week;
              });
              
              if (weekExcuses.length === 0) return null;
              
              // 같은 주차의 공결들은 같은 정보를 공유하므로 첫 번째 것 사용
              const firstExcuse = weekExcuses[0];
              const weekSessions = sessions.filter(s => s.week === week);
              const sessionNumbers = weekSessions.map(s => s.session_number).sort((a, b) => a - b);
              
              return (
                <div 
                  key={week} 
                  style={{ 
                    padding: '1rem', 
                    backgroundColor: 'white', 
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {week}주차 ({sessionNumbers.join(', ')}교시)
                      </div>
                      {weekSessions[0] && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {new Date(weekSessions[0].start_at).toLocaleDateString('ko-KR')}
                        </div>
                      )}
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      backgroundColor: statusColors[firstExcuse.status] + '20',
                      color: statusColors[firstExcuse.status],
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}>
                      {statusLabels[firstExcuse.status]}
                    </span>
                  </div>
                  
                  <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>사유:</strong> {reasonLabels[firstExcuse.reason_code] || firstExcuse.reason_code}
                    </div>
                    {firstExcuse.reason_text && (
                      <div style={{ marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                        {firstExcuse.reason_text}
                      </div>
                    )}
                    {firstExcuse.files && firstExcuse.files.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <strong>첨부 파일:</strong>
                        {firstExcuse.files.map((file, idx) => (
                          <div key={idx} style={{ marginLeft: '0.5rem', marginTop: '0.25rem' }}>
                            <FileViewer file={file} />
                          </div>
                        ))}
                      </div>
                    )}
                    {firstExcuse.instructor_comment && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.25rem' }}>
                        <strong>교원 코멘트:</strong> {firstExcuse.instructor_comment}
                      </div>
                    )}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      신청일: {new Date(firstExcuse.submitted_at).toLocaleString('ko-KR')}
                      {firstExcuse.reviewed_at && (
                        <> | 처리일: {new Date(firstExcuse.reviewed_at).toLocaleString('ko-KR')}</>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcuseRequest;

