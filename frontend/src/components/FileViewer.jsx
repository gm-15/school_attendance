import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const FileViewer = ({ file, style }) => {
  const { accessToken } = useAuth();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // 파일 정보가 문자열인 경우 처리
  const fileInfo = typeof file === 'string' ? { original_name: file } : file;
  const fileName = fileInfo?.original_name || fileInfo || '파일';
  const fileId = fileInfo?.id;
  const mimeType = fileInfo?.mime_type || '';

  // 디버깅: 파일 정보 확인
  console.log('FileViewer - file:', file);
  console.log('FileViewer - fileInfo:', fileInfo);
  console.log('FileViewer - fileId:', fileId);

  const isImage = mimeType && mimeType.startsWith('image/');

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!fileId) {
      console.error('FileViewer - No file ID provided');
      alert('파일 ID가 없습니다.');
      return;
    }

    console.log('FileViewer - Downloading file ID:', fileId);

    try {
      const response = await axios.get(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'blob'
      });
      
      console.log('FileViewer - Download response:', response);

      // Blob을 다운로드 링크로 변환
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Content-Disposition 헤더에서 파일명 추출 시도
      const contentDisposition = response.headers['content-disposition'];
      let downloadFileName = fileName;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (fileNameMatch) {
          downloadFileName = decodeURIComponent(fileNameMatch[1]);
        } else {
          const fileNameMatch2 = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch2) {
            downloadFileName = fileNameMatch2[1];
          }
        }
      }
      
      link.setAttribute('download', downloadFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      console.error('Error response:', error.response);
      alert(`파일 다운로드에 실패했습니다: ${error.response?.status === 404 ? '파일을 찾을 수 없습니다.' : error.response?.data?.error || error.message}`);
    }
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!fileId) {
      console.error('FileViewer - No file ID provided for preview');
      alert('파일 ID가 없습니다.');
      return;
    }

    console.log('FileViewer - Previewing file ID:', fileId);

    try {
      const response = await axios.get(`/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'blob'
      });
      
      console.log('FileViewer - Preview response:', response);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to preview file:', error);
      console.error('Error response:', error.response);
      alert(`파일 미리보기에 실패했습니다: ${error.response?.status === 404 ? '파일을 찾을 수 없습니다.' : error.response?.data?.error || error.message}`);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setShowPreview(false);
  };

  if (!fileId) {
    console.warn('FileViewer - No file ID, showing filename only:', fileName);
    return (
      <div style={style}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{fileName} (파일 ID 없음)</span>
      </div>
    );
  }

  return (
    <>
      <div style={{ ...style, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem' }}>{fileName}</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {isImage && (
            <button
              onClick={handlePreview}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              미리보기
            </button>
          )}
          <button
            onClick={handleDownload}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              backgroundColor: 'var(--gray-600)',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            다운로드
          </button>
        </div>
      </div>

      {showPreview && previewUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}
          onClick={closePreview}
        >
          <div
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closePreview}
              style={{
                position: 'absolute',
                top: '-2.5rem',
                right: 0,
                padding: '0.5rem 1rem',
                backgroundColor: 'white',
                color: 'var(--text)',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              닫기
            </button>
            <img
              src={previewUrl}
              alt={fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FileViewer;

