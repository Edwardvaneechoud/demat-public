document.addEventListener('DOMContentLoaded', function() {
  
  // --- Auth0 Configuration ---
  const auth0Config = {
    domain: 'dev-rgs24jdzcvdydd77.eu.auth0.com',
    clientId: 'o7E5s7NjzEIh9HEZqYTdgcmL8ev7QorV',
    cacheLocation: 'localstorage',
    useRefreshTokens: true
  };
  const API_URL = "https://api.dematerialized.nl";
  let auth0Client = null;

  async function initializeAuth0() {
    try {
      console.log('Starting Auth0 initialization...');
      auth0Client = await auth0.createAuth0Client({
        domain: auth0Config.domain,
        clientId: auth0Config.clientId,
        
        authorizationParams: {
          redirect_uri: 'https://dematerialized-24fc59.webflow.io/',
          audience: 'https://api.dematerialized.nl/'
        },

        cacheLocation: auth0Config.cacheLocation,
        useRefreshTokens: auth0Config.useRefreshTokens
      });
      
      console.log('Auth0 client created successfully');
      
      // Handle redirect
      const query = window.location.search;
      if (query.includes("code=") && query.includes("state=")) {
        await auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname.split('?')[0]);
      }
      
      // Update UI
      const isAuthenticated = await auth0Client.isAuthenticated();
      console.log('Authentication status:', isAuthenticated);
      updateUI(isAuthenticated);
      
      if (isAuthenticated) {
        const user = await auth0Client.getUser();
        console.log('User details:', user);
        displayUserInfo(user);
      }
    } catch (error) {
      console.error('Auth0 initialization error:', error);
    }
  }

  // Update UI
  function updateUI(isAuthenticated) {
    const loggedInElements = document.querySelectorAll('[data-auth="logged-in"]');
    const loggedOutElements = document.querySelectorAll('[data-auth="logged-out"]');
    
    loggedInElements.forEach(el => {
      el.style.display = isAuthenticated ? '' : 'none';
    });
    
    loggedOutElements.forEach(el => {
      el.style.display = !isAuthenticated ? '' : 'none';
    });
  }

  // Display user info
  function displayUserInfo(user) {
    if (!user) return;
    document.querySelectorAll('[data-auth="user-name"]').forEach(el => {
      el.textContent = user.name || user.email || 'User';
    });
    document.querySelectorAll('[data-auth="user-email"]').forEach(el => {
      el.textContent = user.email || '';
    });
    document.querySelectorAll('[data-auth="user-picture"]').forEach(el => {
      if (user.picture) el.src = user.picture;
    });
  }

  // Login
  async function login() {
    if (!auth0Client) return;
    await auth0Client.loginWithRedirect();
  }

  // Logout
  async function logout() {
    if (!auth0Client) return;
    await auth0Client.logout({
      logoutParams: {
        returnTo: 'https://dematerialized-24fc59.webflow.io/' // Fixed redirect
      }
    });
  }

  // --- API Calling Function (This was missing from your version) ---
  async function callApi() {
    console.log("Attempting to call API...");
    try {
      const token = await auth0Client.getTokenSilently();
      const response = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "API failed");
      console.log("API Response:", data);
      alert("API call successful! Check the console.");
    } catch (e) {
      console.error("API call failed", e);
      alert(`API call failed: ${e.message}`);
    }
  }

  // --- Initialize and connect buttons ---
  initializeAuth0();
  
  setTimeout(() => {
    // Connect login/logout by data-attribute
    document.querySelectorAll('[data-auth-action="login"]').forEach(btn => {
      btn.addEventListener('click', e => (e.preventDefault(), login()));
    });
    document.querySelectorAll('[data-auth-action="logout"]').forEach(btn => {
      btn.addEventListener('click', e => (e.preventDefault(), logout()));
    });

    // Connect login/logout by ID (your original method)
    const loginBtn = document.getElementById('login-button');
    if (loginBtn) loginBtn.addEventListener('click', e => (e.preventDefault(), login()));
    
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) logoutBtn.addEventListener('click', e => (e.preventDefault(), logout()));

    // Connect API test button (if you have one with this ID)
    const apiBtn = document.getElementById('btn-call-api');
    if (apiBtn) apiBtn.addEventListener('click', e => (e.preventDefault(), callApi()));

  }, 100);
  
  // Your debug helper
  window.debugAuth = async function() { 
    console.log('=== Auth Debug Info ===');
    console.log('Auth0 Client exists:', !!auth0Client);
    if (auth0Client) {
      const isAuth = await auth0Client.isAuthenticated();
      console.log('Is authenticated:', isAuth);
      if (isAuth) {
        const user = await auth0Client.getUser();
        console.log('User:', user);
        try {
          const token = await auth0Client.getTokenSilently();
          console.log('Access Token:', token.substring(0, 20) + "...");
        } catch(e) {
          console.error("Could not get token", e);
        }
      }
    }
  };
  console.log('Auth0 script loaded. Type debugAuth() in console for debug info.');
});