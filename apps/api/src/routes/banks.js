import express from 'express';
import { asyncHandler } from '../lib/http.js';
import { BankService } from '../services/bankService.js';

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const banks = await BankService.list(req.query);
    res.json({ data: banks });
  })
);

export default router;
