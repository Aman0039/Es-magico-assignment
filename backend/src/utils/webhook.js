const axios = require('axios');
const WebhookLog = require('../models/WebhookLog');

const fireWebhook = async (project, task) => {
  if (!project.webhookUrl) return;

  const payload = {
    event: 'task.completed',
    timestamp: new Date().toISOString(),
    project: { id: project._id, name: project.name },
    task: {
      id: task._id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      resourceTag: task.resourceTag
    }
  };

  const logEntry = await WebhookLog.create({
    project: project._id,
    task: task._id,
    webhookUrl: project.webhookUrl,
    payload,
    status: 'pending'
  });

  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.post(project.webhookUrl, payload, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json', 'X-CWOS-Event': 'task.completed' }
      });

      await WebhookLog.findByIdAndUpdate(logEntry._id, {
        status: 'success',
        attempts: attempt,
        responseStatus: response.status,
        responseBody: JSON.stringify(response.data).substring(0, 500)
      });
      return;
    } catch (err) {
      lastError = err.message;
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  await WebhookLog.findByIdAndUpdate(logEntry._id, {
    status: 'failed',
    attempts: maxAttempts,
    error: lastError
  });
};

module.exports = { fireWebhook };
