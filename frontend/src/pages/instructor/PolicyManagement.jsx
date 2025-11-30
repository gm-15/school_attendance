import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const PolicyManagement = ({ courseId }) => {
  const { accessToken } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [formData, setFormData] = useState({
    late_threshold: 10,
    late_to_absent_threshold: 30,
    max_absences: null,
    absence_warning_threshold: 2,
    absence_danger_threshold: 3,
    absence_fail_threshold: 0.25,
    attendance_weight: 1.0,
    late_weight: 0.5
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchPolicy();
    }
  }, [courseId]);

  const fetchPolicy = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/policy/courses/${courseId}/policy`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setPolicy(response.data);
      setFormData({
        late_threshold: response.data.late_threshold || 10,
        late_to_absent_threshold: response.data.late_to_absent_threshold || 30,
        max_absences: response.data.max_absences || null,
        absence_warning_threshold: response.data.absence_warning_threshold || 2,
        absence_danger_threshold: response.data.absence_danger_threshold || 3,
        absence_fail_threshold: parseFloat(response.data.absence_fail_threshold) || 0.25,
        attendance_weight: parseFloat(response.data.attendance_weight) || 1.0,
        late_weight: parseFloat(response.data.late_weight) || 0.5
      });
    } catch (error) {
      console.error('Failed to fetch policy:', error);
      setError('출석 정책을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(`/api/policy/courses/${courseId}/policy`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setPolicy(response.data);
      setSuccess('출석 정책이 성공적으로 저장되었습니다.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to update policy:', error);
      setError(error.response?.data?.error || '출석 정책 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : (name.includes('threshold') || name.includes('weight') ? parseFloat(value) : parseInt(value))
    }));
  };

  if (loading) {
    return <div className="card">출석 정책을 불러오는 중...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>출석 정책 설정</h2>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '0.375rem', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>지각/결석 기준</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              지각 기준 (분)
            </label>
            <input
              type="number"
              name="late_threshold"
              value={formData.late_threshold || ''}
              onChange={handleChange}
              min="0"
              className="input"
              required
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              수업 시작 후 이 시간 이후에 출석 체크하면 지각으로 처리됩니다.
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              지각→결석 전환 기준 (분)
            </label>
            <input
              type="number"
              name="late_to_absent_threshold"
              value={formData.late_to_absent_threshold || ''}
              onChange={handleChange}
              min="0"
              className="input"
              required
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              수업 시작 후 이 시간 이후에 출석 체크하면 결석으로 처리됩니다.
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              최대 결석 허용 횟수
            </label>
            <input
              type="number"
              name="max_absences"
              value={formData.max_absences || ''}
              onChange={handleChange}
              min="0"
              className="input"
              placeholder="제한 없음 (비워두기)"
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              이 횟수를 초과하면 자동으로 경고 알림이 발송됩니다. (선택사항)
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>결석 경고 기준</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              경고 결석 횟수
            </label>
            <input
              type="number"
              name="absence_warning_threshold"
              value={formData.absence_warning_threshold || ''}
              onChange={handleChange}
              min="0"
              className="input"
              required
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              이 횟수 이상 결석 시 경고 알림이 발송됩니다.
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              위험 결석 횟수
            </label>
            <input
              type="number"
              name="absence_danger_threshold"
              value={formData.absence_danger_threshold || ''}
              onChange={handleChange}
              min="0"
              className="input"
              required
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              이 횟수 이상 결석 시 위험 알림이 발송됩니다.
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              낙제 결석 비율 (%)
            </label>
            <input
              type="number"
              name="absence_fail_threshold"
              value={formData.absence_fail_threshold ? (formData.absence_fail_threshold * 100).toFixed(2) : ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  absence_fail_threshold: isNaN(value) ? null : value / 100
                }));
              }}
              min="0"
              max="100"
              step="0.01"
              className="input"
              required
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              전체 수업 중 이 비율 이상 결석 시 낙제 처리됩니다. (예: 25 = 25%)
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>출석 점수 가중치</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              출석 가중치
            </label>
            <input
              type="number"
              name="attendance_weight"
              value={formData.attendance_weight || ''}
              onChange={handleChange}
              min="0"
              max="10"
              step="0.1"
              className="input"
              required
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              출석 시 부여되는 점수 가중치입니다. (기본값: 1.0)
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              지각 가중치
            </label>
            <input
              type="number"
              name="late_weight"
              value={formData.late_weight || ''}
              onChange={handleChange}
              min="0"
              max="10"
              step="0.1"
              className="input"
              required
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              지각 시 부여되는 점수 가중치입니다. (기본값: 0.5)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn"
            onClick={fetchPolicy}
            style={{ backgroundColor: 'var(--border)', color: 'var(--text)' }}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn"
            disabled={saving}
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PolicyManagement;

