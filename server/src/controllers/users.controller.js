import User from '../models/User.js';

export async function listInterviewers(req, res) {
  const users = await User.find({ role: 'interviewer' }).select('name email role').sort({ name: 1 });
  res.json(users);
}
