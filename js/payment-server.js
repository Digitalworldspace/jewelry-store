// payment-server.js - Node.js Express server
// Run this on a server or Vercel serverless function

const express = require('express');
const Razorpay = require('razorpay');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: 'YOUR_RAZORPAY_KEY_ID',
    key_secret: 'YOUR_RAZORPAY_KEY_SECRET'
});

// Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, currency, receipt, notes } = req.body;
        
        const options = {
            amount: amount * 100, // Convert to paise
            currency: currency || 'INR',
            receipt: receipt || 'receipt_' + Date.now(),
            notes: notes || {},
            payment_capture: 1 // Auto capture
        };
        
        const order = await razorpay.orders.create(options);
        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify Payment Signature
app.post('/api/verify-payment', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        const secret = 'DUuUMtWEtOa2obpj7FdmC9mg';
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body.toString())
            .digest('hex');
        
        if (expectedSignature === razorpay_signature) {
            res.json({ success: true, message: 'Payment verified' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Payment server running on port 3000');
});
