import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/adminRoutes';
import publicRoutes from './routes/publicRoutes';
import internalRoutes from './routes/internalRoutes';
import { startOrderCompletedConsumer } from './kafka/consumers/orderCompletedConsumer';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Apply Routes
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/internal', internalRoutes);

app.use('/',(req,res)=>{
  console.log("Good");
  return res.status(200).json({message:"Everything is fine"});
})

const PORT = process.env.PORT || 5006;

app.listen(PORT, async () => {
  console.log(`🚀 Promotion Service running on port ${PORT}`);
  
  // Start Kafka Listeners
  try {
    await startOrderCompletedConsumer();
    console.log(`🎧 Kafka Consumer Connected`);
  } catch (err) {
    console.error(`⚠️ Kafka connection failed (Will retry later):`, err);
  }
});