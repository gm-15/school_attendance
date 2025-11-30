import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const MessageManagement = ({ courses }) => {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'received', 'sent'
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 메시지 작성 폼
  const [formData, setFormData] = useState({
    course_id: '',
    receiver_id: '',
    subject: '',
    content: ''
  });

  // 선택한 과목의 학생 목록
  const [students, setStudents] = useState([]);

  // students 상태 변경 추적
  useEffect(() => {
    console.log('Students state updated:', students);
  }, [students]);

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  useEffect(() => {
    if (!showCompose) {
      setStudents([]);
    }
    // course_id가 변경되면 handleCompose나 onChange에서 처리하므로 여기서는 처리하지 않음
  }, [showCompose]);

  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const params = filter !== 'all' ? { type: filter } : {};
      const response = await axios.get('/api/messages', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params
      });
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setError('메시지를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (courseId) => {
    try {
      console.log('Fetching students for course:', courseId);
      const response = await axios.get(`/api/enrollments/courses/${courseId}/enrollments`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('Enrollments response:', response.data);
      console.log('First enrollment:', response.data[0]);
      console.log('First enrollment.user:', response.data[0]?.user);
      
      // enrollment 객체에서 user 필드 확인
      const studentsList = response.data
        .filter(e => {
          console.log('Checking enrollment:', e);
          console.log('Has user?', !!e.user);
          console.log('User role:', e.user?.role);
          return e.user && (e.user.role === 'Student' || e.user.role === 'student');
        })
        .map(e => e.user);
      console.log('Filtered students:', studentsList);
      console.log('Setting students state with', studentsList.length, 'students');
      setStudents(studentsList);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      console.error('Error response:', error.response);
      setStudents([]);
    }
  };

  const handleCompose = async () => {
    setShowCompose(true);
    setSelectedMessage(null);
    const firstCourseId = courses.length > 0 ? courses[0].id : '';
    setFormData({
      course_id: firstCourseId,
      receiver_id: '',
      subject: '',
      content: ''
    });
    // 첫 번째 과목이 있으면 학생 목록 가져오기
    if (firstCourseId) {
      // 약간의 지연을 두어 formData가 먼저 업데이트되도록 함
      setTimeout(async () => {
        await fetchStudents(firstCourseId);
      }, 100);
    } else {
      setStudents([]);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage) return;
    setShowCompose(true);
    // 답변할 때는 원래 메시지의 과목의 학생 목록을 먼저 가져와야 함
    if (selectedMessage.course_id) {
      const studentsList = await axios.get(`/api/enrollments/courses/${selectedMessage.course_id}/enrollments`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(response => response.data.map(e => e.user).filter(u => u && u.role === 'Student'))
        .catch(() => []);
      
      setStudents(studentsList);
      // 학생 목록을 가져온 후 formData 설정
      setFormData({
        course_id: selectedMessage.course_id,
        receiver_id: selectedMessage.sender_id,
        subject: selectedMessage.subject.startsWith('Re: ') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`,
        content: ''
      });
    } else {
      setFormData({
        course_id: '',
        receiver_id: selectedMessage.sender_id,
        subject: selectedMessage.subject.startsWith('Re: ') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`,
        content: ''
      });
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.course_id || !formData.receiver_id || !formData.subject || !formData.content) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    try {
      await axios.post('/api/messages', formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setShowCompose(false);
      setFormData({ course_id: '', receiver_id: '', subject: '', content: '' });
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error.response?.data?.error || '메시지 전송에 실패했습니다.');
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('메시지를 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchMessages();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      setError(error.response?.data?.error || '메시지 삭제에 실패했습니다.');
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    setShowCompose(false);
    
    // 수신 메시지인 경우 읽음 처리
    if (!message.is_read && message.receiver_id) {
      try {
        await axios.patch(`/api/messages/${message.id}/read`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        fetchMessages();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>메시지 관리</h2>
        <button className="btn" onClick={handleCompose}>
          + 메시지 작성
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.375rem' }}>
          {error}
        </div>
      )}

      {/* 필터 */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className="btn"
          onClick={() => setFilter('all')}
          style={{
            backgroundColor: filter === 'all' ? 'var(--primary)' : 'transparent',
            color: filter === 'all' ? 'white' : 'var(--text)'
          }}
        >
          전체
        </button>
        <button
          className="btn"
          onClick={() => setFilter('received')}
          style={{
            backgroundColor: filter === 'received' ? 'var(--primary)' : 'transparent',
            color: filter === 'received' ? 'white' : 'var(--text)'
          }}
        >
          받은 메시지
        </button>
        <button
          className="btn"
          onClick={() => setFilter('sent')}
          style={{
            backgroundColor: filter === 'sent' ? 'var(--primary)' : 'transparent',
            color: filter === 'sent' ? 'white' : 'var(--text)'
          }}
        >
          보낸 메시지
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        {/* 메시지 목록 */}
        <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              메시지가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {messages.map(message => (
                <div
                  key={message.id}
                  onClick={() => handleMessageClick(message)}
                  style={{
                    padding: '1rem',
                    backgroundColor: selectedMessage?.id === message.id ? 'var(--primary-light)' : (message.is_read ? 'white' : '#fff3cd'),
                    border: '1px solid var(--border)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    borderLeft: message.is_read ? '1px solid var(--border)' : '4px solid #ffc107'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {message.subject}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        {filter === 'sent' ? `받는 사람: ${message.receiver?.name || 'N/A'}` : `보낸 사람: ${message.sender?.name || 'N/A'}`}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {message.course?.title || 'N/A'} | {new Date(message.createdAt).toLocaleString('ko-KR')}
                      </div>
                    </div>
                    {!message.is_read && filter === 'received' && (
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#ffc107', color: '#000', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                        새
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 메시지 상세 또는 작성 폼 */}
        <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '0.375rem', padding: '1rem' }}>
          {showCompose ? (
            <div>
              <h3 style={{ marginBottom: '1rem' }}>메시지 작성</h3>
              <form onSubmit={handleSend}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>과목</label>
                  <select
                    className="input"
                    value={formData.course_id}
                    onChange={async (e) => {
                      const newCourseId = e.target.value;
                      setFormData({ ...formData, course_id: newCourseId, receiver_id: '' });
                      // 과목 변경 시 해당 과목의 학생 목록 가져오기
                      if (newCourseId) {
                        await fetchStudents(newCourseId);
                      } else {
                        setStudents([]);
                      }
                    }}
                    required
                  >
                    <option value="">과목 선택</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.code}-{course.section})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>받는 사람 (학생)</label>
                  <select
                    className="input"
                    value={formData.receiver_id}
                    onChange={(e) => setFormData({ ...formData, receiver_id: e.target.value })}
                    required
                    disabled={!formData.course_id}
                  >
                    <option value="">학생 선택</option>
                    {students.length === 0 && formData.course_id && (
                      <option value="" disabled>학생 목록을 불러오는 중...</option>
                    )}
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.student_id || student.email})
                      </option>
                    ))}
                  </select>
                  {formData.course_id && students.length === 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      수강 중인 학생이 없거나 목록을 불러오는 중입니다.
                    </div>
                  )}
                  {formData.course_id && students.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      {students.length}명의 학생이 수강 중입니다.
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>제목</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>내용</label>
                  <textarea
                    className="input"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn">전송</button>
                  <button type="button" className="btn" onClick={() => setShowCompose(false)}>
                    취소
                  </button>
                </div>
              </form>
            </div>
          ) : selectedMessage ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{selectedMessage.subject}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {filter === 'received' && (
                    <button
                      className="btn"
                      onClick={handleReply}
                      style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                    >
                      답변하기
                    </button>
                  )}
                  {filter === 'sent' && (
                    <button
                      className="btn"
                      onClick={() => handleDelete(selectedMessage.id)}
                      style={{ backgroundColor: '#dc2626', color: 'white' }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--gray-50)', borderRadius: '0.375rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {filter === 'sent' ? `받는 사람: ${selectedMessage.receiver?.name || 'N/A'}` : `보낸 사람: ${selectedMessage.sender?.name || 'N/A'}`}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  과목: {selectedMessage.course?.title || 'N/A'} ({selectedMessage.course?.code || 'N/A'})
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {new Date(selectedMessage.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {selectedMessage.content}
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              메시지를 선택하거나 새 메시지를 작성하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageManagement;

