import express from 'express';
import imagesRouter from './images';
import videosRouter from './videos';
import configRouter from './config';
import modelsRouter from './models';
import suggestionsRouter from './suggestions';
import chatsRouter from './chats';
import searchRouter from './search';
import newsRouter from './news';
import uploadsRouter from './uploads';
import legalRouter from './legal';
import discoverRouter from './discover';
import expertsRouter from './experts';
import marketResearchRouter from './marketResearch';

const router = express.Router();

router.use('/images', imagesRouter);
router.use('/videos', videosRouter);
router.use('/config', configRouter);
router.use('/models', modelsRouter);
router.use('/suggestions', suggestionsRouter);
router.use('/chats', chatsRouter);
router.use('/search', searchRouter);
router.use('/market-research', marketResearchRouter);
router.use('/news', newsRouter);
router.use('/uploads', uploadsRouter);
router.use('/legal', legalRouter);
router.use('/discover', discoverRouter);
router.use('/experts', expertsRouter);

export default router;
