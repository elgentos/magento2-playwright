async function getAdminToken(baseUrl, username, password, httpCredentials) {
  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  };

  if (httpCredentials) {
    fetchOptions.headers['Authorization'] =
      'Basic ' + Buffer.from(`${httpCredentials.username}:${httpCredentials.password}`).toString('base64');
  }

  const response = await fetch(`${baseUrl}rest/V1/integration/admin/token`, fetchOptions);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to get admin token: ${response.status} ${body}`);
  }

  return await response.json();
}

async function apiRequest(method, url, token, baseUrl, httpCredentials, payload) {
  const fetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  if (httpCredentials) {
    fetchOptions.headers['Authorization'] =
      'Basic ' + Buffer.from(`${httpCredentials.username}:${httpCredentials.password}`).toString('base64');
    fetchOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  if (payload) {
    fetchOptions.body = JSON.stringify(payload);
  }

  const response = await fetch(`${baseUrl}${url}`, fetchOptions);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${method} ${url} failed: ${response.status} ${body}`);
  }

  return await response.json();
}

module.exports = { getAdminToken, apiRequest };
