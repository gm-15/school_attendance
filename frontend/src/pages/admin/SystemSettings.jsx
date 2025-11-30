import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const SystemSettings = () => {
  const { accessToken } = useAuth();
  const [settings, setSettings] = useState({
    max_file_size: 10, // MB
    allowed_file_types: 'image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/x-hwp,application/zip',
    session_auto_close_minutes: 60,
    notification_polling_interval: 30, // seconds
    default_late_threshold: 10, // minutes
    default_late_to_absent_threshold: 30, // minutes
    password_min_length: 6,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_number: true,
    password_require_special: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (accessToken) {
      fetchSettings();
    }
  }, [accessToken]);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/system', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // 기본값 사용
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.put('/api/system', { settings }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSuccess('시스템 설정이 성공적으로 저장되었습니다.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to update settings:', error);
      setError(error.response?.data?.error || '시스템 설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card">시스템 설정을 불러오는 중...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>시스템 설정</h2>

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
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>파일 업로드 설정</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              최대 파일 크기 (MB)
            </label>
            <input
              type="number"
              name="max_file_size"
              value={settings.max_file_size || ''}
              onChange={handleChange}
              min="1"
              max="100"
              className="input"
              required
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              업로드 가능한 최대 파일 크기를 설정합니다.
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              허용 파일 타입
            </label>
            <input
              type="text"
              name="allowed_file_types"
              value={settings.allowed_file_types || ''}
              onChange={handleChange}
              className="input"
              required
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              콤마로 구분된 MIME 타입 목록 (예: image/jpeg,application/pdf)
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>출석 세션 설정</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              세션 자동 종료 시간 (분)
            </label>
            <input
              type="number"
              name="session_auto_close_minutes"
              value={settings.session_auto_close_minutes || ''}
              onChange={handleChange}
              min="10"
              max="180"
              className="input"
              required
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              세션 시작 후 자동으로 종료되는 시간을 설정합니다.
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>알림 설정</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              알림 폴링 간격 (초)
            </label>
            <input
              type="number"
              name="notification_polling_interval"
              value={settings.notification_polling_interval || ''}
              onChange={handleChange}
              min="5"
              max="300"
              className="input"
              required
            />
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              클라이언트가 알림을 확인하는 주기입니다.
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>기본 출석 정책</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              기본 지각 기준 (분)
            </label>
            <input
              type="number"
              name="default_late_threshold"
              value={settings.default_late_threshold || ''}
              onChange={handleChange}
              min="0"
              className="input"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              기본 지각→결석 전환 기준 (분)
            </label>
            <input
              type="number"
              name="default_late_to_absent_threshold"
              value={settings.default_late_to_absent_threshold || ''}
              onChange={handleChange}
              min="0"
              className="input"
              required
            />
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>비밀번호 정책</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              최소 비밀번호 길이
            </label>
            <input
              type="number"
              name="password_min_length"
              value={settings.password_min_length || ''}
              onChange={handleChange}
              min="6"
              max="20"
              className="input"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                name="password_require_uppercase"
                checked={settings.password_require_uppercase || false}
                onChange={handleChange}
              />
              대문자 필수
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                name="password_require_lowercase"
                checked={settings.password_require_lowercase || false}
                onChange={handleChange}
              />
              소문자 필수
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                name="password_require_number"
                checked={settings.password_require_number || false}
                onChange={handleChange}
              />
              숫자 필수
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                name="password_require_special"
                checked={settings.password_require_special || false}
                onChange={handleChange}
              />
              특수문자 필수
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn"
            onClick={fetchSettings}
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

export default SystemSettings;

