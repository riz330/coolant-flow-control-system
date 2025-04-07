
/**
 * Utility function for making authenticated fetch requests
 */

interface FetchOptions extends RequestInit {
  isFormData?: boolean;
}

const fetchWithAuth = async (url: string, options: FetchOptions = {}) => {
  // Get the token from localStorage
  const token = localStorage.getItem('token');
  
  // Prepare headers
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // Add content-type header if not form data
  if (!options.isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Include credentials in the request
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include'
  };

  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export default fetchWithAuth;
