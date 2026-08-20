import { Router, Request, Response } from 'express';
import { AiService } from '../services/aiService';

const router = Router();

// POST /api/ai/chat - Pariksha AI Assistant & Operations Copilot Chat Endpoint
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, portalContext, userRole, userId, userEmail, candidateCode, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message parameter is required.'
      });
    }

    const aiResponse = await AiService.handleChat({
      message: message.trim(),
      portalContext: portalContext || 'STUDENT',
      userRole: userRole || 'CANDIDATE',
      userId,
      userEmail,
      candidateCode,
      history: Array.isArray(history) ? history : [],
    });

    return res.json({
      success: true,
      data: aiResponse,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal AI Copilot error.',
    });
  }
});

export default router;
