const fs = require('fs').promises;
const path = require('path');
const CHAT_FILE = path.join(__dirname, '../../data/chat_messages.json');

async function ensureFile() {
  try { await fs.access(CHAT_FILE); } catch { await fs.writeFile(CHAT_FILE, '[]'); }
}

const sendMessage = async (userId, userName, userRole, message) => {
  await ensureFile();
  const content = await fs.readFile(CHAT_FILE, 'utf-8');
  const messages = JSON.parse(content);
  const newMsg = {
    id: Date.now(),
    user_id: userId,
    user_name: userName.substring(0, 50),
    user_role: userRole,
    message: message.trim().substring(0, 500),
    created_at: new Date().toISOString()
  };
  messages.push(newMsg);
  if (messages.length > 500) messages.shift();
  await fs.writeFile(CHAT_FILE, JSON.stringify(messages, null, 2));
  return { id: newMsg.id };
};

const getMessages = async (limit = 50) => {
  await ensureFile();
  const content = await fs.readFile(CHAT_FILE, 'utf-8');
  let messages = JSON.parse(content);
  messages.reverse();
  return messages.slice(0, limit);
};

module.exports = { sendMessage, getMessages };