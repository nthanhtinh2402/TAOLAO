import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { getDomainInfo } from './youtube/utils/getDomainInfo.js';
import { service as tiktokService } from './tiktok/services/tiktokService.js';
import youtubeController from './youtube/controllers/youtubeController.js';

// Xác định __dirname vì đang dùng ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load biến môi trường từ file env-youtube
dotenv.config({ path: path.resolve(__dirname, './youtube/env-youtube') });

// Import các routes
import tiktokRoutes from './tiktok/routes/tiktokRoutes.js';
import envatoRoutes from './envato/routes/envatoRoutes.js';
import artlistRoutes from './artlist/routes/artlistRoutes.js';
import generalRoutes from './general/routes/generalRoutes.js';
import youtubeRoutes from './youtube/routes/youtubeRoutes.js';
import epidemicsoundRoutes from './epidemicsound/routes/epidemicsoundRoutes.js'; // ✅ sửa tên đúng

const app = express();
const port = process.env.PORT || 3000;

// Middleware xử lý form và JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/youtube', youtubeRoutes);
app.use('/tiktok', tiktokRoutes);
app.use('/envato', envatoRoutes);
app.use('/artlist', artlistRoutes);
app.use('/general', generalRoutes);
app.use('/epidemicsound', epidemicsoundRoutes); // ✅ mount đúng tên

// API getlink tự động nhận dạng domain
app.get('/api/getlink', async (req, res) => {
  const url = req.query.url;
  console.log(`[REQUEST] Nhận yêu cầu getlink cho: ${url}`);

  if (!url) return res.status(400).json({ error: 'Thiếu URL' });

  try {
    let result;

    if (url.includes('tiktok.com')) {
      result = await tiktokService.getDownloadLink(url, req.protocol + '://' + req.get('host'));
    } else if (url.includes('envato.com')) {
      const envatoService = await import('./envato/services/envatoService.js');
      result = await envatoService.default.getDownloadLink(url);
    } else if (url.includes('artlist.io')) {
      const artlistService = await import('./artlist/services/artlistService.js');
      result = await artlistService.default.getDownloadLink(url);
    } else if (url.includes('epidemicsound.com')) {
      const epidemicsoundService = await import('./epidemicsound/services/epidemicsoundService.js'); // ✅ dynamic import đúng tên
      result = await epidemicsoundService.default.getDownloadLink(url);
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const youtubeService = await import('./youtube/services/youtubeService.js');
      result = await youtubeService.default.getDownloadLink(url, req);
    } else {
      return res.status(400).json({ error: 'Không hỗ trợ URL này' });
    }

    res.json({ downloadLink: result });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(500).json({ error: err.message || 'Lỗi không xác định' });
  }
});

// Cho phép truy cập thư mục /downloads công khai
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Khởi chạy server
app.listen(port, () => {
  console.log(`\n✅ SERVER ĐANG CHẠY tại: http://localhost:${port}`);
});
