import amqp from 'amqplib';

let connection = null;
let channel = null;
let isConnected = false;
let lastError = null;

/**
 * Initializes connection to RabbitMQ broker using RABBITMQ_URL environment variable.
 * If RABBITMQ_URL is empty or missing, operates in standby mode gracefully without crashing.
 */
export async function connectRabbitMQ() {
  const url = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL.trim() : '';
  const queueName = process.env.RABBITMQ_QUEUE_NAME || 'neuron_flow_queue';

  if (!url) {
    console.log('ℹ️ [RabbitMQ] RABBITMQ_URL space is empty in .env. System operating in queue standby mode.');
    isConnected = false;
    lastError = null;
    return false;
  }

  try {
    console.log(`🔌 [RabbitMQ] Attempting connection to broker (${url.replace(/\/\/[^@]+@/, '//***:***@')})...`);
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    await channel.assertQueue(queueName, { durable: true });
    isConnected = true;
    lastError = null;

    console.log(`✅ [RabbitMQ] Successfully connected & queue "${queueName}" ready.`);

    connection.on('error', (err) => {
      console.error('⚠️ [RabbitMQ] Connection error:', err.message);
      isConnected = false;
      lastError = err;
    });

    connection.on('close', () => {
      console.log('ℹ️ [RabbitMQ] Connection closed.');
      isConnected = false;
    });

    return true;
  } catch (err) {
    console.warn(`⚠️ [RabbitMQ] Could not connect to broker: ${err.message}`);
    isConnected = false;
    lastError = err;
    return false;
  }
}

/**
 * Publishes a JSON payload to a specified queue (or default RABBITMQ_QUEUE_NAME).
 * Safely falls back if RabbitMQ is offline or disconnected.
 */
export async function publishToQueue(queueName = null, payload = {}) {
  const targetQueue = queueName || process.env.RABBITMQ_QUEUE_NAME || 'neuron_flow_queue';

  if (!isConnected || !channel) {
    // Graceful fallback when queue connection is offline/not configured
    return false;
  }

  try {
    await channel.assertQueue(targetQueue, { durable: true });
    const bufferData = Buffer.from(JSON.stringify({
      timestamp: new Date().toISOString(),
      ...payload
    }));

    const sent = channel.sendToQueue(targetQueue, bufferData, { persistent: true });
    if (sent) {
      console.log(`📤 [RabbitMQ] Published message payload to queue "${targetQueue}".`);
    }
    return sent;
  } catch (err) {
    console.error(`❌ [RabbitMQ] Failed to publish message to "${targetQueue}":`, err.message);
    lastError = err;
    return false;
  }
}

/**
 * Consumes messages from a specified queue and executes handler callback.
 */
export async function consumeQueue(queueName = null, onMessageCallback = () => {}) {
  const targetQueue = queueName || process.env.RABBITMQ_QUEUE_NAME || 'neuron_flow_queue';

  if (!isConnected || !channel) {
    return false;
  }

  try {
    await channel.assertQueue(targetQueue, { durable: true });
    console.log(`📥 [RabbitMQ] Listening for incoming messages on queue "${targetQueue}"...`);

    channel.consume(targetQueue, (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.toString());
          onMessageCallback(content, msg);
          channel.ack(msg);
        } catch (err) {
          console.error(`❌ [RabbitMQ] Error processing message from "${targetQueue}":`, err.message);
          channel.nack(msg, false, false);
        }
      }
    });
    return true;
  } catch (err) {
    console.error(`❌ [RabbitMQ] Failed to consume queue "${targetQueue}":`, err.message);
    lastError = err;
    return false;
  }
}

/**
 * Returns health and connection status metrics for the RabbitMQ client module.
 */
export function getRabbitMQStatus() {
  const url = process.env.RABBITMQ_URL ? process.env.RABBITMQ_URL.trim() : '';
  const queueName = process.env.RABBITMQ_QUEUE_NAME || 'neuron_flow_queue';

  return {
    connected: isConnected,
    urlConfigured: Boolean(url),
    queueName,
    status: isConnected ? 'active' : url ? 'disconnected' : 'standby_ready_for_future_url',
    lastError: lastError?.message || null
  };
}
