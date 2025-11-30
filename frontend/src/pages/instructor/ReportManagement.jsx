import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const ReportManagement = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [riskStudents, setRiskStudents] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchAvailableWeeks();
      fetchReport();
      fetchRiskStudents();
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchReport();
    }
  }, [selectedWeek, courseId]);

  const fetchAvailableWeeks = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/sessions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const sessions = response.data || [];
      const uniqueWeeks = [...new Set(sessions.map(s => s.week))].sort((a, b) => a - b);
      setAvailableWeeks(uniqueWeeks);
    } catch (error) {
      console.error('Failed to fetch weeks:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { course_id: courseId };
      if (selectedWeek) {
        params.week = selectedWeek;
      }
      const response = await axios.get('/api/reports/attendance', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      setError('리포트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskStudents = async () => {
    try {
      const response = await axios.get('/api/reports/risk-students', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { course_id: courseId }
      });
      setRiskStudents(response.data.risk_students || []);
    } catch (error) {
      console.error('Failed to fetch risk students:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const params = { course_id: courseId };
      if (selectedWeek) {
        params.week = selectedWeek;
      }
      const response = await axios.get('/api/reports/attendance/export', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `attendance_report_${courseId}_${selectedWeek || 'all'}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
      setError('엑셀 다운로드에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>출석 리포트</h2>
        {reportData && (
          <button
            className="btn"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? '다운로드 중...' : '엑셀 다운로드'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          주차 선택
        </label>
        <select
          className="input"
          value={selectedWeek || ''}
          onChange={(e) => setSelectedWeek(e.target.value ? parseInt(e.target.value) : null)}
          style={{ width: 'auto' }}
        >
          <option value="">전체</option>
          {availableWeeks.map(week => (
            <option key={week} value={week}>{week}주차</option>
          ))}
        </select>
      </div>

      {reportData && (
        <>
          {/* 통계 요약 */}
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>통계 요약</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>총 수업 세션</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{reportData.total_sessions}회</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>지각→결석 전환</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{reportData.late_to_absent_count}건</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>공결 승인율</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>{reportData.excuse_approval_rate}%</div>
              </div>
            </div>
          </div>

          {/* 학생별 출석 현황 */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>학생별 출석 현황</h3>
            {reportData.student_stats.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                출석 데이터가 없습니다.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>학번</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>이름</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>출석</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>지각</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>결석</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>공결</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>출석률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.student_stats
                      .sort((a, b) => parseFloat(b.attendance_rate) - parseFloat(a.attendance_rate))
                      .map((stat, idx) => {
                        const attendanceRate = parseFloat(stat.attendance_rate);
                        const rateColor = attendanceRate >= 80 ? '#16a34a' : attendanceRate >= 60 ? '#eab308' : '#dc2626';
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.75rem' }}>{stat.student?.student_id || 'N/A'}</td>
                            <td style={{ padding: '0.75rem' }}>{stat.student?.name || 'N/A'}</td>
                            <td style={{ padding: '0.75rem' }}>{stat.present}</td>
                            <td style={{ padding: '0.75rem' }}>{stat.late}</td>
                            <td style={{ padding: '0.75rem' }}>{stat.absent}</td>
                            <td style={{ padding: '0.75rem' }}>{stat.excuse}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ color: rateColor, fontWeight: 'bold' }}>
                                {stat.attendance_rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 위험군 학생 */}
          <div>
            <h3 style={{ marginBottom: '1rem' }}>위험군 학생 (결석률 15% 이상)</h3>
            {riskStudents.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                위험군 학생이 없습니다.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>학번</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>이름</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>결석 횟수</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>총 수업</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>결석률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskStudents.map((risk, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#fee2e2' }}>
                        <td style={{ padding: '0.75rem' }}>{risk.student?.student_id || 'N/A'}</td>
                        <td style={{ padding: '0.75rem' }}>{risk.student?.name || 'N/A'}</td>
                        <td style={{ padding: '0.75rem', color: '#dc2626', fontWeight: 'bold' }}>{risk.absent_count}</td>
                        <td style={{ padding: '0.75rem' }}>{risk.total_sessions}</td>
                        <td style={{ padding: '0.75rem', color: '#dc2626', fontWeight: 'bold' }}>{risk.absence_rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportManagement;

