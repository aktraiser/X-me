import express from 'express';
import logger from '../utils/logger';
import db from '../db/index';
import { eq } from 'drizzle-orm';
import { chats, messages } from '../db/schema';

interface DbChat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
  messages: { content: string }[];
}

interface MessageMetadata {
  createdAt: string;
  sources?: any[];
}

const router = express.Router();

router.get('/', async (_, res) => {
  try {
    const dbChats = await db.query.chats.findMany();

    const formattedChats = await Promise.all(dbChats.map(async (chat) => {
      const messages = await db.query.messages.findMany({
        where: (messages) => eq(messages.role, 'assistant') && eq(messages.chatId, chat.id as string)
      });

      // Trier les messages par date de création
      const sortedMessages = messages.sort((a, b) => {
        const aMetadata = JSON.parse(a.metadata as string) as MessageMetadata;
        const bMetadata = JSON.parse(b.metadata as string) as MessageMetadata;
        return new Date(bMetadata.createdAt).getTime() - new Date(aMetadata.createdAt).getTime();
      });

      // Prendre le premier message (le plus récent)
      const latestMessage = sortedMessages[0];
      const previewContent = latestMessage?.content 
        ? latestMessage.content.substring(0, 100) + (latestMessage.content.length > 100 ? '...' : '')
        : chat.title;

      return {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        focusMode: chat.focusMode,
        content: previewContent
      };
    }));

    return res.status(200).json({ chats: formattedChats.reverse() });
  } catch (err) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in getting chats: ${err.message}`);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const chatExists = await db.query.chats.findFirst({
      where: eq(chats.id, req.params.id),
    });

    if (!chatExists) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, req.params.id),
    });

    return res.status(200).json({ chat: chatExists, messages: chatMessages });
  } catch (err) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in getting chat: ${err.message}`);
  }
});

router.delete(`/:id`, async (req, res) => {
  try {
    const chatExists = await db.query.chats.findFirst({
      where: eq(chats.id, req.params.id),
    });

    if (!chatExists) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await db.delete(chats).where(eq(chats.id, req.params.id)).execute();
    await db
      .delete(messages)
      .where(eq(messages.chatId, req.params.id))
      .execute();

    return res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in deleting chat: ${err.message}`);
  }
});

export default router;
