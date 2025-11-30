import { File } from '../models/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const { related_type, related_id, original_filename } = req.body;

    // 파일명 처리: original_filename이 있으면 우선 사용 (프론트엔드에서 보낸 원본 파일명)
    // 없으면 req.file.originalname 사용
    let originalName = original_filename || req.file.originalname;
    
    // 파일명이 깨진 경우를 대비해 디코딩 시도
    try {
      // 만약 파일명이 이미 인코딩되어 있다면 디코딩
      if (originalName.includes('%')) {
        originalName = decodeURIComponent(originalName);
      }
    } catch (e) {
      // 디코딩 실패 시 원본 사용
      console.log('Filename decoding failed, using original:', originalName);
    }

    console.log('Upload file - original name (final):', originalName);
    console.log('Upload file - original name (from form):', original_filename);
    console.log('Upload file - original name (from multer):', req.file.originalname);

    const file = await File.create({
      original_name: originalName,
      stored_path: req.file.path,
      mime_type: req.file.mimetype,
      size: req.file.size,
      uploader_id: req.user.id,
      related_type: related_type || null,
      related_id: related_id || null
    });

    res.status(201).json(file);
  } catch (error) {
    next(error);
  }
};

export const downloadFile = async (req, res, next) => {
  try {
    const fileId = req.params.id;
    console.log('Download file request - ID:', fileId);
    
    const file = await File.findByPk(fileId);
    
    if (!file) {
      console.log('File not found in database - ID:', fileId);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log('File found:', {
      id: file.id,
      original_name: file.original_name,
      stored_path: file.stored_path
    });

    // 파일 접근 권한 확인 (간단한 버전, 나중에 세밀하게 구현)
    // TODO: 과제 파일은 업로더/교원/관리자만, 게시판 파일은 수강생 모두

    // stored_path가 절대 경로인지 상대 경로인지 확인
    let filePath;
    if (path.isAbsolute(file.stored_path)) {
      filePath = file.stored_path;
    } else {
      filePath = path.join(__dirname, '../', file.stored_path);
    }
    
    console.log('Resolved file path:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found on disk:', filePath);
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // 한글 파일명 인코딩 처리
    const encodedFileName = encodeURIComponent(file.original_name).replace(/'/g, '%27');
    
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findByPk(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // 업로더만 삭제 가능
    if (file.uploader_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 파일 삭제
    const filePath = path.join(__dirname, '../', file.stored_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await file.destroy();
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

