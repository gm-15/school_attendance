import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const PollManagement = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [polls, setPolls] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [pollResults, setPollResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    session_id: '',
    deadline: '',
    show_results_realtime: true,
    allow_revote: false
  });

  useEffect(() => {
    if (courseId) {
      fetchPolls();
      fetchSessions();
    }
  }, [courseId]);

  // 실시간 결과 업데이트 (5초마다)
  useEffect(() => {
    if (!showResults || !selectedPoll || selectedPoll.status === 'closed') {
      return;
    }

    const interval = setInterval(() => {
      if (selectedPoll.id) {
        handleViewResults(selectedPoll.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [showResults, selectedPoll]);

  const fetchPolls = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/polls/courses/${courseId}/polls`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setPolls(response.data || []);
    } catch (error) {
      console.error('Failed to fetch polls:', error);
      setError('투표 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline) {
      setError('제목과 마감일은 필수입니다.');
      return;
    }

    try {
      await axios.post(`/api/polls/courses/${courseId}/polls`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        session_id: '',
        deadline: '',
        show_results_realtime: true,
        allow_revote: false
      });
      fetchPolls();
    } catch (error) {
      console.error('Failed to create poll:', error);
      setError(error.response?.data?.error || '투표 생성에 실패했습니다.');
    }
  };

  const handleClosePoll = async (pollId) => {
    if (!window.confirm('투표를 마감하시겠습니까?')) return;

    try {
      await axios.post(`/api/polls/${pollId}/close`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchPolls();
      if (selectedPoll?.id === pollId) {
        setSelectedPoll(null);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Failed to close poll:', error);
      setError(error.response?.data?.error || '투표 마감에 실패했습니다.');
    }
  };

  const handleViewResults = async (pollId) => {
    try {
      const response = await axios.get(`/api/polls/${pollId}/results`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setPollResults(response.data);
      setSelectedPoll(polls.find(p => p.id === pollId));
      setShowResults(true);
    } catch (error) {
      console.error('Failed to fetch poll results:', error);
      if (error.response?.status === 403) {
        setError('아직 결과를 볼 수 없습니다. 투표가 마감된 후 확인할 수 있습니다.');
      } else {
        setError(error.response?.data?.error || '결과를 불러오는데 실패했습니다.');
      }
    }
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>투표 관리</h2>
        <button className="btn" onClick={() => setShowCreateForm(true)}>
          + 투표 생성
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {showCreateForm ? (
        <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>투표 생성</h3>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>제목 *</label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>설명</label>
              <textarea
                className="input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>공강 대상 수업 (선택)</label>
              <select
                className="input"
                value={formData.session_id}
                onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
              >
                <option value="">선택 안함</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.week}주차 {session.session_number}교시
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>마감일시 *</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.show_results_realtime}
                  onChange={(e) => setFormData({ ...formData, show_results_realtime: e.target.checked })}
                />
                실시간 결과 공개
              </label>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.allow_revote}
                  onChange={(e) => setFormData({ ...formData, allow_revote: e.target.checked })}
                />
                재투표 허용
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn">생성</button>
              <button type="button" className="btn" onClick={() => {
                setShowCreateForm(false);
                setError('');
              }}>
                취소
              </button>
            </div>
          </form>
        </div>
      ) : showResults ? (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>투표 결과: {selectedPoll?.title}</h3>
            <button className="btn" onClick={() => {
              setShowResults(false);
              setPollResults(null);
              setSelectedPoll(null);
            }}>
              목록으로
            </button>
          </div>
          {pollResults && (
            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  총 투표수: {pollResults.total}표
                </div>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>찬성: {pollResults.agree}표 ({pollResults.total > 0 ? Math.round((pollResults.agree / pollResults.total) * 100) : 0}%)</div>
                  </div>
                  <div>
                    <div style={{ color: '#ef4444', fontWeight: 'bold' }}>반대: {pollResults.disagree}표 ({pollResults.total > 0 ? Math.round((pollResults.disagree / pollResults.total) * 100) : 0}%)</div>
                  </div>
                </div>
                <div style={{ width: '100%', height: '20px', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div style={{ 
                    width: `${pollResults.total > 0 ? (pollResults.agree / pollResults.total) * 100 : 0}%`, 
                    height: '100%', 
                    backgroundColor: '#10b981',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>투표 상세</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {pollResults.votes.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      아직 투표가 없습니다.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>학생</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>학번</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>투표</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pollResults.votes.map(vote => (
                          <tr key={vote.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.5rem' }}>{vote.student?.name || 'N/A'}</td>
                            <td style={{ padding: '0.5rem' }}>{vote.student?.student_id || 'N/A'}</td>
                            <td style={{ padding: '0.5rem', color: vote.vote === 'agree' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                              {vote.vote === 'agree' ? '찬성' : '반대'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {polls.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              투표가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {polls.map(poll => (
                <div
                  key={poll.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ margin: 0 }}>{poll.title}</h4>
                        {(() => {
                          const isDeadlinePassed = new Date() > new Date(poll.deadline);
                          const isActive = poll.status === 'open' && !isDeadlinePassed;
                          return (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: isActive ? '#10b981' : '#6b7280',
                              color: 'white',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              {isActive ? '진행중' : (poll.status === 'closed' ? '마감' : '기간 종료')}
                            </span>
                          );
                        })()}
                      </div>
                      {poll.description && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                          {poll.description}
                        </div>
                      )}
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        마감일시: {new Date(poll.deadline).toLocaleString('ko-KR')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn"
                        onClick={() => handleViewResults(poll.id)}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                      >
                        결과 보기
                      </button>
                      {poll.status === 'open' && new Date() <= new Date(poll.deadline) && (
                        <button
                          className="btn"
                          onClick={() => handleClosePoll(poll.id)}
                          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white' }}
                        >
                          마감
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PollManagement;

