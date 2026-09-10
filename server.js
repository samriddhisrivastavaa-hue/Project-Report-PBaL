const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { classifyMessage, detectPhishing } = require('./classifier');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'sms-organizer-secret-key-2026';

app.use(express.json());
// Simple web demo (public/index.html + public/app.js) served from the same backend -
// so the deployed link shows a live, working UI with real classification, not just an API.
app.use(express.static('public'));

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token nahi mila, login karo pehle' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalid ya expire ho gaya' });
    }
    req.userId = decoded.userId;
    next();
  });
}

app.get('/', (req, res) => {
  res.send('Hello from your SMS Organizer backend!');
});

app.post('/signup', async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;
    if (!password || (!email && !phoneNumber)) {
      return res.status(400).json({ error: 'Password aur email/phoneNumber zaroori hai' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: email || null, phoneNumber: phoneNumber || null, password: hashedPassword }
    });
    res.json({ success: true, userId: user.id, email: user.email });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;
    const user = await prisma.user.findFirst({
      where: email ? { email } : { phoneNumber }
    });
    if (!user) {
      return res.status(404).json({ error: 'User nahi mila' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Galat password' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, userId: user.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Naya message banao - login zaroori
app.post('/messages/create', verifyToken, async (req, res) => {
  try {
    const { sender, body, source } = req.body;
    if (!sender || !body || !source) {
      return res.status(400).json({ error: 'sender, body, aur source zaroori hai' });
    }

    // Same sender + same text wala message pehle se hai kya (isi user ke liye)?
    // Agar haan, toh dobara nahi banate - duplicate import/receive rok rahe hain.
    const existing = await prisma.message.findFirst({
      where: { sender, body, userId: req.userId }
    });
    if (existing) {
      return res.json({ success: true, message: existing, duplicate: true });
    }

    const category = classifyMessage(body);
    const isPhishing = detectPhishing(body);
    const message = await prisma.message.create({
      data: { sender, body, source, category, isPhishing, userId: req.userId }
    });
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/classify-test', (req, res) => {
  const { body } = req.body;
  if (!body) {
    return res.status(400).json({ error: 'Message body zaroori hai' });
  }
  const category = classifyMessage(body);
  const isPhishing = detectPhishing(body);
  res.json({ body, category, isPhishing });
});

// Sirf login wale user ke messages dikhao (deleted wale hide honge)
app.get('/messages', verifyToken, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { userId: req.userId, isDeleted: false }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Message ko archive karo - login zaroori, sirf apna hi message
app.put('/messages/:id/archive', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await prisma.message.updateMany({
      where: { id: parseInt(id), userId: req.userId },
      data: { isArchived: true }
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Message nahi mila ya aapka nahi hai' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/messages/:id/unarchive', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await prisma.message.updateMany({
      where: { id: parseInt(id), userId: req.userId },
      data: { isArchived: false }
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Message nahi mila ya aapka nahi hai' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/messages/:id/delete', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await prisma.message.updateMany({
      where: { id: parseInt(id), userId: req.userId },
      data: { isDeleted: true }
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Message nahi mila ya aapka nahi hai' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/messages/archived', verifyToken, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { userId: req.userId, isArchived: true }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/messages/deleted', verifyToken, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { userId: req.userId, isDeleted: true }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/messages/reclassify', verifyToken, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({ where: { userId: req.userId } });
    let updatedCount = 0;
    for (const msg of messages) {
      const category = classifyMessage(msg.body);
      const isPhishing = detectPhishing(msg.body);
      if (category !== msg.category || isPhishing !== msg.isPhishing) {
        await prisma.message.update({
          where: { id: msg.id },
          data: { category, isPhishing }
        });
        updatedCount++;
      }
    }
    res.json({ success: true, updatedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server chal raha hai: http://localhost:${PORT}`);
});
