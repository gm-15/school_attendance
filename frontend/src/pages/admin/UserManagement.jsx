import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement = () => {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    role: 'Student',
    name: '',
    email: '',
    password: '',
    student_id: '',
    department_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, deptRes] = await Promise.all([
        axios.get('/api/users', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('/api/departments', { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);
      setUsers(usersRes.data);
      setDepartments(deptRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await axios.put(`/api/users/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setSuccess('사용자가 수정되었습니다.');
      } else {
        await axios.post('/api/users', formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setSuccess('사용자가 생성되었습니다.');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ role: 'Student', name: '', email: '', password: '', student_id: '', department_id: '' });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || '저장에 실패했습니다.');
    }
  };

  const handleEdit = (user) => {
    setFormData({
      role: user.role,
      name: user.name,
      email: user.email,
      password: '',
      student_id: user.student_id || '',
      department_id: user.department_id ? user.department_id.toString() : ''
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSuccess('사용자가 삭제되었습니다.');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>사용자 관리</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={() => { setShowExcelUpload(!showExcelUpload); setError(''); setSuccess(''); setUploadResult(null); }}>
            {showExcelUpload ? '취소' : '엑셀 일괄 등록'}
          </button>
          <button className="btn" onClick={() => { setShowForm(true); setEditingId(null); setFormData({ role: 'Student', name: '', email: '', password: '', student_id: '', department_id: '' }); }}>
            + 사용자 추가
          </button>
        </div>
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

      {showExcelUpload && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>엑셀 일괄 등록</h3>
          <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>엑셀 파일 형식</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              다음 컬럼을 포함해야 합니다:
            </p>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
              <li><strong>role</strong> (필수): 역할 (Admin, Instructor, Student)</li>
              <li><strong>name</strong> (필수): 이름</li>
              <li><strong>email</strong> (필수): 이메일</li>
              <li><strong>password</strong> (필수): 비밀번호 (최소 6자, 대소문자+숫자+특수문자)</li>
              <li><strong>student_id</strong> (Student인 경우 필수): 학번</li>
              <li><strong>department_id</strong> 또는 <strong>department_code</strong> (선택): 학과 ID 또는 코드</li>
            </ul>
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              <strong>예시:</strong>
              <table style={{ width: '100%', marginTop: '0.5rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>role</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>name</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>email</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>password</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>student_id</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>department_code</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.5rem' }}>Student</td>
                    <td style={{ padding: '0.5rem' }}>홍길동</td>
                    <td style={{ padding: '0.5rem' }}>hong@school.edu</td>
                    <td style={{ padding: '0.5rem' }}>Password123!</td>
                    <td style={{ padding: '0.5rem' }}>202321002</td>
                    <td style={{ padding: '0.5rem' }}>CS</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            setSuccess('');
            setUploadResult(null);

            if (!excelFile) {
              setError('엑셀 파일을 선택해주세요.');
              return;
            }

            const fileName = excelFile.name.toLowerCase();
            if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
              setError('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
              return;
            }

            setUploading(true);

            try {
              const formData = new FormData();
              formData.append('file', excelFile);

              const response = await axios.post('/api/users/import', formData, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'multipart/form-data'
                }
              });

              setUploadResult(response.data);
              setSuccess(`엑셀 업로드가 완료되었습니다. (성공: ${response.data.success_count}건, 실패: ${response.data.error_count}건)`);
              setExcelFile(null);
              setShowExcelUpload(false);
              fetchData();
            } catch (error) {
              console.error('Failed to upload excel:', error);
              setError(error.response?.data?.error || '엑셀 업로드에 실패했습니다.');
            } finally {
              setUploading(false);
            }
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                엑셀 파일 선택 *
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setExcelFile(e.target.files[0])}
                style={{ width: '100%', padding: '0.5rem' }}
              />
              {excelFile && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  선택된 파일: {excelFile.name} ({(excelFile.size / 1024).toFixed(2)}KB)
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn"
              disabled={uploading || !excelFile}
              style={{ width: '100%' }}
            >
              {uploading ? '업로드 중...' : '업로드하기'}
            </button>
          </form>

          {uploadResult && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>업로드 결과</h4>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>성공:</strong> {uploadResult.success_count}건
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>실패:</strong> {uploadResult.error_count}건
              </div>
              {uploadResult.error_count > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>오류 상세:</strong>
                  <div style={{ marginTop: '0.5rem', maxHeight: '200px', overflowY: 'auto', fontSize: '0.875rem' }}>
                    {uploadResult.results.errors.map((err, idx) => (
                      <div key={idx} style={{ padding: '0.5rem', marginBottom: '0.25rem', backgroundColor: '#fee2e2', borderRadius: '0.25rem' }}>
                        <div><strong>행:</strong> {JSON.stringify(err.row)}</div>
                        <div><strong>오류:</strong> {err.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem', backgroundColor: 'var(--gray-50)' }}>
          <h3>{editingId ? '사용자 수정' : '사용자 추가'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>역할</label>
              <select
                className="input"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="Student">학생</option>
                <option value="Instructor">교원</option>
                <option value="Admin">관리자</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>이름</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>이메일</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>비밀번호 {editingId && '(수정 시에만 입력)'}</label>
              <input
                type="password"
                className="input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingId}
              />
            </div>
            {formData.role === 'Student' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>학번</label>
                <input
                  type="text"
                  className="input"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  required
                />
              </div>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>학과 (선택)</label>
              <select
                className="input"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                <option value="">선택하세요</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn">저장</button>
              <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ role: 'Student', name: '', email: '', password: '', student_id: '', department_id: '' }); }}>
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>역할</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>이름</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>이메일</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>학번</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>학과</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem' }}>{user.id}</td>
                <td style={{ padding: '0.75rem' }}>{user.role}</td>
                <td style={{ padding: '0.75rem' }}>{user.name}</td>
                <td style={{ padding: '0.75rem' }}>{user.email}</td>
                <td style={{ padding: '0.75rem' }}>{user.student_id || '-'}</td>
                <td style={{ padding: '0.75rem' }}>{user.department?.name || '-'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button className="btn" onClick={() => handleEdit(user)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                    수정
                  </button>
                  <button className="btn" onClick={() => handleDelete(user.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--error)', color: 'white' }}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            등록된 사용자가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;

