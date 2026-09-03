import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import { connectDb } from './config/db.js';

const port = process.env.PORT || 5000;
connectDb().then(() => {
  app.listen(port, '0.0.0.0', () => console.log(`API listening on ${port}`));
}).catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
