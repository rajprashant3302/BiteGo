const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:5001';

const callOrderService = async (path, options = {}, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${ORDER_SERVICE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Order service error (${response.status}): ${text}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
};

module.exports = {
  callOrderService,
};
