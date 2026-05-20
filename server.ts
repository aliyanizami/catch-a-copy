import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyCuh9rvKcfaOY8g70bXKqX8Lpwl1HMYObw",
  authDomain: "catch-a-copy.firebaseapp.com",
  projectId: "catch-a-copy",
  storageBucket: "catch-a-copy.firebasestorage.app",
  messagingSenderId: "1042424424393",
  appId: "1:1042424424393:web:87c59f91cb60c0b1b06a18"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();
app.use(cors());
let PORT = Number(process.env.PORT) || 5000;

function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server is live at http://localhost:${port}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error("Server Error:", err);
    }
  });
}

app.use(express.json());

// A test route to confirm connection
app.get('/api/verify', (req, res) => {
  res.json({ message: "Backend is successfully linked to Catch A Copy!" });
});

// This route sends the list of shops to the frontend
app.get('/api/shops', (req, res) => {
  const shops = [
    { id: '1', name: "QuickPrint Xerox", location: "123 University Ave, Near Library", 
	rating: 4.8, services: ["B&W PRINTING", "COLOR", "SPIRAL BINDING"] },
    { id: '2', name: "Student Copy Center", location: "45 College Road, Opposite Gate 2", 
	rating: 4.5, services: ["B&W PRINTING", "LAMINATION", "SOFT BINDING"] },
    { id: '3', name: "Pro Graphics", location: "Sector 7, Market B", 
	rating: 4.0, services: ["POSTER PRINTING",  "FAST DELIVERY"] }
  ];
  res.json(shops);
});

// Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SaaF5s6ZUvI06w',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'ekfXrGSvo3ORSu05vJMMqZR5'
});

// Create Order API
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, shopId } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount is required" });

    // 1. Fetch the Shop's Razorpay Account ID from Firestore
    let transfers = [];
    if (shopId) {
      try {
        const shopRef = doc(db, "shops", shopId);
        const shopSnap = await getDoc(shopRef);
        
        if (shopSnap.exists() && shopSnap.data().razorpayAccountId) {
          const accountId = shopSnap.data().razorpayAccountId;
          console.log(`🔗 Routing payment to shop account: ${accountId}`);
          
          transfers.push({
            account: accountId,
            amount: amount * 100, // Total amount to transfer in paise
            currency: "INR",
            notes: { branch: "Catch A Copy Marketplace" },
            on_hold: 0
          });
        }
      } catch (err) {
        console.warn("⚠️ Could not fetch shop account, proceeding with platform-only payment:", err);
      }
    }

    const options = {
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      ...(transfers.length > 0 && { transfers })
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Razorpay Error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Verify Payment API
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const secret = process.env.RAZORPAY_KEY_SECRET || 'ekfXrGSvo3ORSu05vJMMqZR5';
    const hmac = crypto.createHmac('sha256', secret);
    
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');
    
    if (generated_signature === razorpay_signature) {
      console.log("✅ Payment Verified Successfully");
      res.json({ status: 'ok', message: "Payment verified successfully" });
    } else {
      console.error("❌ Invalid Payment Signature");
      res.status(400).json({ status: 'failure', message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

startServer(PORT);