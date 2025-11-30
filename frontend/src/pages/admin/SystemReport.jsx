import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const SystemReport = () => {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('status');
  const [statusData, setStatusData] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'status') {
      fetchSystemStatus();
    } else if (activeTab === 'errors') {
      fetchSystemErrors();
    } else if (activeTab === 'performance') {
      fetchSystemPerformance();
    }
  }, [activeTab]);

  const fetchSystemStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/admin/system/status', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setStatusData(response.data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      setError('시스템 상태를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemErrors = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/admin/system/errors', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setErrorData(response.data);
    } catch (error) {
      console.error('Failed to fetch system errors:', error);
      setError('시스템 오류 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemPerformance = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/admin/system/performance', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setPerformanceData(response.data);
    } catch (error) {
      console.error('Failed to fetch system performance:', error);
      setError('시스템 성능 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>시스템 리포트</h2>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)' }}>
          <button
            className="btn"
            onClick={() => setActiveTab('status')}
            style={{
              backgroundColor: activeTab === 'status' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'status' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              padding: '0.75rem 1rem'
            }}
          >
            시스템 상태
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('errors')}
            style={{
              backgroundColor: activeTab === 'errors' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'errors' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              padding: '0.75rem 1rem'
            }}
          >
            시스템 오류
          </button>
          <button
            className="btn"
            onClick={() => setActiveTab('performance')}
            style={{
              backgroundColor: activeTab === 'performance' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'performance' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              padding: '0.75rem 1rem'
            }}
          >
            시스템 성능
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">데이터를 불러오는 중...</div>
      ) : (
        <>
          {activeTab === 'status' && statusData && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>시스템 상태</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>데이터베이스</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: statusData.database.status === 'connected' ? '#10b981' : '#ef4444' }}>
                    {statusData.database.status === 'connected' ? '연결됨' : '연결 안됨'}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>전체 사용자</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statusData.users.total}명</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    관리자: {statusData.users.admin} | 교원: {statusData.users.instructor} | 학생: {statusData.users.student}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>과목</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statusData.courses.total}개</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    활성: {statusData.courses.active}개
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>수업 세션</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statusData.sessions.total}개</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    진행중: {statusData.sessions.open} | 종료: {statusData.sessions.closed}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>출석 기록</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statusData.attendance.total_records}건</div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>수강신청</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statusData.enrollments.total}건</div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.375rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>대기 중인 공결</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{statusData.pending.excuses}건</div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.375rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>대기 중인 이의제기</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{statusData.pending.appeals}건</div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.375rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>읽지 않은 알림</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{statusData.notifications.unread}건</div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '0.375rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>최근 24시간 감사 로그</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{statusData.audit_logs.last_24h}건</div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                마지막 업데이트: {new Date(statusData.timestamp).toLocaleString('ko-KR')}
              </div>
            </div>
          )}

          {activeTab === 'errors' && errorData && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>시스템 오류 리포트</h3>
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.375rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>기간</div>
                <div style={{ fontWeight: 'bold' }}>
                  {new Date(errorData.period.start).toLocaleDateString('ko-KR')} ~ {new Date(errorData.period.end).toLocaleDateString('ko-KR')}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>
                  총 오류: {errorData.summary.total_errors}건
                </div>
              </div>

              {errorData.errors.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  오류가 없습니다.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>시간</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>사용자</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>대상</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorData.errors.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                            {new Date(log.createdAt).toLocaleString('ko-KR')}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {log.user?.name || 'N/A'} ({log.user?.role || ''})
                          </td>
                          <td style={{ padding: '0.75rem' }}>{log.action}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {log.target_type} (ID: {log.target_id})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'performance' && performanceData && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>시스템 성능 리포트</h3>
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '0.375rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>기간</div>
                <div style={{ fontWeight: 'bold' }}>
                  {new Date(performanceData.period.start).toLocaleDateString('ko-KR')} ~ {new Date(performanceData.period.end).toLocaleDateString('ko-KR')}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>날짜</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>세션 생성</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>출석 기록</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>감사 로그</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.daily_stats.map((stat, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem' }}>{stat.date}</td>
                        <td style={{ padding: '0.75rem' }}>{stat.sessions}개</td>
                        <td style={{ padding: '0.75rem' }}>{stat.attendances}건</td>
                        <td style={{ padding: '0.75rem' }}>{stat.audit_logs}건</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SystemReport;

