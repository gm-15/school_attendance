import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const EnrollmentManagement = () => {
  const { accessToken } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAvailableStudents, setShowAvailableStudents] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments();
      setShowAvailableStudents(false); // 과목 변경 시 학생 목록 닫기
    }
  }, [selectedCourse]);

  const fetchData = async () => {
    try {
      const [coursesRes, studentsRes] = await Promise.all([
        axios.get('/api/courses', { headers: { Authorization: `Bearer ${accessToken}` } }),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);
      setCourses(coursesRes.data);
      setStudents(studentsRes.data.filter(u => u.role === 'Student'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!selectedCourse) return;
    try {
      const response = await axios.get(`/api/enrollments/courses/${selectedCourse}/enrollments`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setEnrollments(response.data);
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    }
  };

  const handleEnroll = async (studentId) => {
    if (!selectedCourse) {
      setError('과목을 선택해주세요.');
      return;
    }

    try {
      await axios.post(`/api/enrollments/courses/${selectedCourse}/enrollments`, {
        user_id: studentId
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSuccess('수강신청이 완료되었습니다.');
      setError('');
      fetchEnrollments();
    } catch (error) {
      setError(error.response?.data?.error || '수강신청에 실패했습니다.');
      setSuccess('');
    }
  };

  const handleUnenroll = async (enrollmentId) => {
    if (!window.confirm('정말 수강 취소하시겠습니까?')) return;

    try {
      await axios.delete(`/api/enrollments/${enrollmentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSuccess('수강 취소가 완료되었습니다.');
      setError('');
      fetchEnrollments();
    } catch (error) {
      setError(error.response?.data?.error || '수강 취소에 실패했습니다.');
      setSuccess('');
    }
  };

  const handleExcelUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploadResult(null);

    if (!excelFile) {
      setError('엑셀 파일을 선택해주세요.');
      return;
    }

    // 파일 확장자 확인
    const fileName = excelFile.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setError('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', excelFile);

      const response = await axios.post('/api/enrollments/import', formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResult(response.data);
      setSuccess(`엑셀 업로드가 완료되었습니다. (성공: ${response.data.success_count}건, 실패: ${response.data.error_count}건)`);
      setExcelFile(null);
      setShowExcelUpload(false);
      
      // 수강신청 목록 새로고침
      if (selectedCourse) {
        fetchEnrollments();
      }
    } catch (error) {
      console.error('Failed to upload excel:', error);
      setError(error.response?.data?.error || '엑셀 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
    }
  };

  if (loading) return <div>Loading...</div>;

  const enrolledStudentIds = enrollments.map(e => e.user_id);
  const availableStudents = students.filter(s => !enrolledStudentIds.includes(s.id));

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>수강신청 관리</h2>
        <button
          className="btn"
          onClick={() => {
            setShowExcelUpload(!showExcelUpload);
            setError('');
            setSuccess('');
            setUploadResult(null);
          }}
        >
          {showExcelUpload ? '취소' : '엑셀 일괄 등록'}
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

      {showExcelUpload && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>엑셀 일괄 등록</h3>
          <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>엑셀 파일 형식</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              다음 컬럼을 포함해야 합니다:
            </p>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '1.5rem' }}>
              <li><strong>course_id</strong> (필수): 과목 ID</li>
              <li><strong>user_id</strong> 또는 <strong>student_id</strong> 또는 <strong>email</strong> (필수): 학생 식별 정보</li>
              <li><strong>role</strong> (선택): 기본값은 'student'</li>
            </ul>
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              <strong>예시:</strong>
              <table style={{ width: '100%', marginTop: '0.5rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>course_id</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>student_id</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.5rem' }}>1</td>
                    <td style={{ padding: '0.5rem' }}>202321001</td>
                    <td style={{ padding: '0.5rem' }}>student</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.5rem' }}>1</td>
                    <td style={{ padding: '0.5rem' }}>202321002</td>
                    <td style={{ padding: '0.5rem' }}>student</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={handleExcelUpload}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                엑셀 파일 선택 *
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
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

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>과목 선택</label>
        <select
          className="input"
          value={selectedCourse || ''}
          onChange={(e) => setSelectedCourse(parseInt(e.target.value))}
        >
          <option value="">과목을 선택하세요</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.title} ({course.code}-{course.section})
            </option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>수강 중인 학생</h3>
            {enrollments.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                수강 중인 학생이 없습니다.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>학번</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>이름</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>이메일</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem' }}>{enrollment.user?.student_id || 'N/A'}</td>
                        <td style={{ padding: '0.75rem' }}>{enrollment.user?.name || 'N/A'}</td>
                        <td style={{ padding: '0.75rem' }}>{enrollment.user?.email || 'N/A'}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            className="btn"
                            onClick={() => handleUnenroll(enrollment.id)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'var(--error)', color: 'white' }}
                          >
                            수강 취소
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 
              style={{ 
                marginBottom: '0.75rem', 
                cursor: 'pointer',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => setShowAvailableStudents(!showAvailableStudents)}
            >
              <span style={{ fontSize: '0.875rem' }}>{showAvailableStudents ? '▼' : '▶'}</span>
              수강신청 가능한 학생 ({availableStudents.length}명)
            </h3>
            {availableStudents.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                모든 학생이 이미 수강 중입니다.
              </div>
            ) : (
              showAvailableStudents && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>학번</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>이름</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>이메일</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableStudents.map((student) => (
                        <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem' }}>{student.student_id || 'N/A'}</td>
                          <td style={{ padding: '0.75rem' }}>{student.name}</td>
                          <td style={{ padding: '0.75rem' }}>{student.email}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <button
                              className="btn"
                              onClick={() => handleEnroll(student.id)}
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                            >
                              수강신청
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EnrollmentManagement;

