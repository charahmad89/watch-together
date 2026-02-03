const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { movieId, type } = req.body; // type: "ONE_TIME" or "LIFETIME"
    const userId = req.user.userId;

    if (!movieId || !type) {
      return res.status(400).json({ error: 'Movie ID and type are required' });
    }

    // Determine amount
    let amount = 0;
    if (type === 'ONE_TIME') {
      amount = 75 * 100; // ₹75 in paise
    } else if (type === 'LIFETIME') {
      amount = 300 * 100; // ₹300 in paise
    } else {
      return res.status(400).json({ error: 'Invalid purchase type' });
    }

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_${userId}_${movieId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify Payment
router.post('/verify-payment', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, movieId, type } = req.body;
    const userId = req.user.userId;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Payment successful
      const token = crypto.randomBytes(32).toString('hex');
      let amount = type === 'ONE_TIME' ? 75 : 300;

      // Record purchase
      const purchase = await prisma.purchase.create({
        data: {
          userId,
          movieId: parseInt(movieId),
          type,
          token,
          amount,
        },
      });

      res.json({ success: true, token, purchase });
    } else {
      res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Check Access
router.get('/check-access/:movieId', authMiddleware, async (req, res) => {
  try {
    const { movieId } = req.params;
    const userId = req.user.userId;

    const purchase = await prisma.purchase.findFirst({
      where: {
        userId,
        movieId: parseInt(movieId),
      },
    });

    if (purchase) {
      res.json({ hasAccess: true, type: purchase.type, token: purchase.token });
    } else {
      res.json({ hasAccess: false });
    }
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
});

module.exports = router;
