import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const PollView = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [pollResults, setPollResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchPolls();
    }
  }, [courseId]);

  useEffect(() => {
    if (selectedPoll) {
      checkMyVote();
      if (selectedPoll.show_results_realtime || selectedPoll.status === 'closed') {
        fetchResults();
      }
    }
  }, [selectedPoll]);

  // 실시간 결과 업데이트 (5초마다)
  useEffect(() => {
    if (!selectedPoll || !selectedPoll.show_results_realtime || selectedPoll.status === 'closed') {
      return;
    }

    const interval = setInterval(() => {
      fetchResults();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedPoll]);

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

  const checkMyVote = async () => {
    if (!selectedPoll) return;
    try {
      // 내 투표 확인을 위해 결과 API 호출 (투표한 경우 포함)
      const response = await axios.get(`/api/polls/${selectedPoll.id}/results`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setMyVote(response.data.myVote || null);
    } catch (error) {
      // 결과를 볼 수 없는 경우 (아직 공개되지 않음)
      setMyVote(null);
    }
  };

  const fetchResults = async () => {
    if (!selectedPoll) return;
    try {
      const response = await axios.get(`/api/polls/${selectedPoll.id}/results`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setPollResults(response.data);
      // 내 투표 확인
      setMyVote(response.data.myVote || null);
    } catch (error) {
      if (error.response?.status !== 403) {
        console.error('Failed to fetch results:', error);
      }
    }
  };

  const handleVote = async (vote) => {
    if (!selectedPoll) return;

    try {
      await axios.post(`/api/polls/${selectedPoll.id}/vote`, { vote }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setMyVote({ vote });
      if (selectedPoll.show_results_realtime) {
        fetchResults();
      }
      setError('');
    } catch (error) {
      console.error('Failed to vote:', error);
      setError(error.response?.data?.error || '투표에 실패했습니다.');
    }
  };

  const handlePollClick = async (poll) => {
    setSelectedPoll(poll);
    setError('');
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1rem' }}>투표</h2>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {selectedPoll ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>{selectedPoll.title}</h3>
            <button className="btn" onClick={() => {
              setSelectedPoll(null);
              setMyVote(null);
              setPollResults(null);
              setError('');
            }}>
              목록으로
            </button>
          </div>

          {selectedPoll.description && (
            <div style={{ padding: '1rem', marginBottom: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
              {selectedPoll.description}
            </div>
          )}

          {(() => {
            const isDeadlinePassed = new Date() > new Date(selectedPoll.deadline);
            const isActive = selectedPoll.status === 'open' && !isDeadlinePassed;
            return (
              <>
                <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  마감일시: {new Date(selectedPoll.deadline).toLocaleString('ko-KR')} | 
                  상태: <span style={{ color: isActive ? '#10b981' : '#6b7280', fontWeight: 'bold' }}>
                    {isActive ? '진행중' : (selectedPoll.status === 'closed' ? '마감' : '기간 종료')}
                  </span>
                </div>

                {isActive ? (
            <div>
              {myVote ? (
                <div style={{ padding: '1rem', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>이미 투표하셨습니다.</div>
                  <div>투표: <span style={{ color: myVote.vote === 'agree' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                    {myVote.vote === 'agree' ? '찬성' : '반대'}
                  </span></div>
                  {selectedPoll.allow_revote && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <button className="btn" onClick={() => handleVote('agree')} style={{ marginRight: '0.5rem' }}>
                        찬성으로 변경
                      </button>
                      <button className="btn" onClick={() => handleVote('disagree')}>
                        반대로 변경
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>투표하기</div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      className="btn"
                      onClick={() => handleVote('agree')}
                      style={{ flex: 1, backgroundColor: '#10b981', color: 'white', fontSize: '1.25rem', padding: '1rem' }}
                    >
                      찬성
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleVote('disagree')}
                      style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', fontSize: '1.25rem', padding: '1rem' }}
                    >
                      반대
                    </button>
                  </div>
                </div>
              )}
                </div>
              ) : (
                <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                  {selectedPoll.status === 'closed' ? '투표가 마감되었습니다.' : '투표 기간이 지났습니다.'}
                </div>
              )}
              </>
            );
          })()}

          {/* 결과 표시 */}
          {(selectedPoll.show_results_realtime || selectedPoll.status === 'closed') && pollResults && (
            <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.375rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>투표 결과</h4>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  총 투표수: {pollResults.total}표
                </div>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                      찬성: {pollResults.agree}표 ({pollResults.total > 0 ? Math.round((pollResults.agree / pollResults.total) * 100) : 0}%)
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#ef4444', fontWeight: 'bold' }}>
                      반대: {pollResults.disagree}표 ({pollResults.total > 0 ? Math.round((pollResults.disagree / pollResults.total) * 100) : 0}%)
                    </div>
                  </div>
                </div>
                <div style={{ width: '100%', height: '30px', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div style={{ 
                    width: `${pollResults.total > 0 ? (pollResults.agree / pollResults.total) * 100 : 0}%`, 
                    height: '100%', 
                    backgroundColor: '#10b981',
                    transition: 'width 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {pollResults.total > 0 ? Math.round((pollResults.agree / pollResults.total) * 100) : 0}%
                  </div>
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
                  onClick={() => handlePollClick(poll)}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0, flex: 1 }}>{poll.title}</h4>
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
                      {poll.description.length > 100 ? `${poll.description.substring(0, 100)}...` : poll.description}
                    </div>
                  )}
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    마감일시: {new Date(poll.deadline).toLocaleString('ko-KR')}
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

export default PollView;

