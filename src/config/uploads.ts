import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import AppError from '../errors/AppError';

const tmpFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tmpFolder,
  storage: multer.diskStorage({
    destination: tmpFolder,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('hex');
      const fileName = `${fileHash}-${file.originalname}`;
      return callback(null, fileName);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB
  },
  fileFilter: (request: any, file: any, cb: any): void => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new AppError('Invalid csv file'));
    }
  },
};
