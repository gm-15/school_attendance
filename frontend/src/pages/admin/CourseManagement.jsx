import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const CourseManagement = () => {
  const { accessToken } = useAuth();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    section: 1,
    instructor_id: '',
    semester_id: '',
    department_id: '',
    room: '',
    duration_hours: 3,
    duration_minutes: 0
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
      const [coursesRes, deptRes, semRes, userRes] = await Promise.all([
        axios.get('/api/courses', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('/api/departments', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('/api/semesters', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);
      setCourses(coursesRes.data);
      setDepartments(deptRes.data);
      setSemesters(semRes.data);
      setInstructors(userRes.data.filter(u => u.role === 'Instructor'));
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

    try {
      if (editingId) {
        await axios.put(`/api/courses/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } else {
        await axios.post('/api/courses', formData, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', code: '', section: 1, instructor_id: '', semester_id: '', department_id: '', room: '', duration_hours: 3, duration_minutes: 0 });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || '저장에 실패했습니다.');
    }
  };

  const handleEdit = (course) => {
    setFormData({
      title: course.title,
      code: course.code,
      section: course.section,
      instructor_id: course.instructor_id.toString(),
      semester_id: course.semester_id.toString(),
      department_id: course.department_id.toString(),
      room: course.room || '',
      duration_hours: course.duration_hours || 3,
      duration_minutes: course.duration_minutes || 0
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>과목 관리</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={() => { setShowExcelUpload(!showExcelUpload); setError(''); setSuccess(''); setUploadResult(null); }}>
            {showExcelUpload ? '취소' : '엑셀 일괄 등록'}
          </button>
          <button className="btn" onClick={() => { setShowForm(true); setEditingId(null); setFormData({ title: '', code: '', section: 1, instructor_id: '', semester_id: '', department_id: '', room: '', duration_hours: 3, duration_minutes: 0 }); }}>
            + 과목 추가
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
              <li><strong>title</strong> (필수): 과목명</li>
              <li><strong>code</strong> (필수): 과목 코드</li>
              <li><strong>section</strong> (필수): 분반 (1-4)</li>
              <li><strong>instructor_id</strong> 또는 <strong>instructor_email</strong> (필수): 교원 ID 또는 이메일</li>
              <li><strong>semester_id</strong> (필수): 학기 ID</li>
              <li><strong>department_id</strong> 또는 <strong>department_code</strong> (필수): 학과 ID 또는 코드</li>
              <li><strong>room</strong> (선택): 강의실</li>
              <li><strong>duration_hours</strong> (선택): 수업 시간 (기본 3)</li>
              <li><strong>duration_minutes</strong> (선택): 추가 시간 (0 또는 30, 기본 0)</li>
            </ul>
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              <strong>예시:</strong>
              <table style={{ width: '100%', marginTop: '0.5rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>title</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>code</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>section</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>instructor_email</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>semester_id</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>department_code</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.5rem' }}>웹서버프로그래밍</td>
                    <td style={{ padding: '0.5rem' }}>HBJ00052</td>
                    <td style={{ padding: '0.5rem' }}>1</td>
                    <td style={{ padding: '0.5rem' }}>instructor@school.edu</td>
                    <td style={{ padding: '0.5rem' }}>1</td>
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

              const response = await axios.post('/api/courses/import', formData, {
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
          <h3>{editingId ? '과목 수정' : '과목 추가'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>과목명</label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>과목 코드</label>
              <input
                type="text"
                className="input"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>분반 (1-4)</label>
              <input
                type="number"
                className="input"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: parseInt(e.target.value) })}
                required
                min="1"
                max="4"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>담당 교원</label>
              <select
                className="input"
                value={formData.instructor_id}
                onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
                required
              >
                <option value="">선택하세요</option>
                {instructors.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name} ({inst.email})</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>학기</label>
              <select
                className="input"
                value={formData.semester_id}
                onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
                required
              >
                <option value="">선택하세요</option>
                {semesters.map(sem => (
                  <option key={sem.id} value={sem.id}>{sem.year}년 {sem.term}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>학과</label>
              <select
                className="input"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                required
              >
                <option value="">선택하세요</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>강의실 (선택)</label>
              <input
                type="text"
                className="input"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>수업 시간</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="input"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                  required
                  style={{ flex: 1 }}
                >
                  <option value={1}>1시간</option>
                  <option value={2}>2시간</option>
                  <option value={3}>3시간</option>
                  <option value={4}>4시간</option>
                  <option value={5}>5시간</option>
                  <option value={6}>6시간</option>
                </select>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const newMinutes = formData.duration_minutes === 30 ? 0 : 30;
                    setFormData({ ...formData, duration_minutes: newMinutes });
                  }}
                  style={{
                    backgroundColor: formData.duration_minutes === 30 ? 'var(--primary)' : 'var(--gray-300)',
                    color: formData.duration_minutes === 30 ? 'white' : 'var(--text)',
                    padding: '0.5rem 1rem'
                  }}
                >
                  {formData.duration_minutes === 30 ? '30분 제거' : '+30분'}
                </button>
              </div>
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--gray-100)', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                총 수업 시간: {formData.duration_hours}시간 {formData.duration_minutes > 0 ? '30분' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn">저장</button>
              <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ title: '', code: '', section: 1, instructor_id: '', semester_id: '', department_id: '', room: '', duration_hours: 3, duration_minutes: 0 }); }}>
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
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>과목명</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>코드</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>분반</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>교원</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem' }}>{course.id}</td>
                <td style={{ padding: '0.75rem' }}>{course.title}</td>
                <td style={{ padding: '0.75rem' }}>{course.code}</td>
                <td style={{ padding: '0.75rem' }}>{course.section}</td>
                <td style={{ padding: '0.75rem' }}>{course.instructor?.name || 'N/A'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <button className="btn" onClick={() => handleEdit(course)} style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                    수정
                  </button>
                  <button className="btn" onClick={() => handleDelete(course.id)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--error)', color: 'white' }}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            등록된 과목이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;

