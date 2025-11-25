document.addEventListener('DOMContentLoaded', function() {

  // --- Auth0 Configuration ---
  const auth0Config = {
    domain: 'dev-rgs24jdzcvdydd77.eu.auth0.com',
    clientId: 'o7E5s7NjzEIh9HEZqYTdgcmL8ev7QorV',
    cacheLocation: 'localstorage',
    useRefreshTokens: true
  };
  const API_URL = "https://api.dematerialized.nl";
  window.auth0Client = null;

  async function initializeAuth0() {
    try {
      console.log('Starting Auth0 initialization...');
      window.auth0Client = await auth0.createAuth0Client({
        domain: auth0Config.domain,
        clientId: auth0Config.clientId,
        
        authorizationParams: {
          redirect_uri: window.location.origin + '/',
          audience: 'https://api.dematerialized.nl/'
        },

        cacheLocation: auth0Config.cacheLocation,
        useRefreshTokens: auth0Config.useRefreshTokens
      });
      
      console.log('Auth0 client created successfully');
      
      // Handle redirect
      const query = window.location.search;
      if (query.includes("code=") && query.includes("state=")) {
        console.log('📨 Handling Auth0 redirect callback...');
        await window.auth0Client.handleRedirectCallback();
        
        // Get the return path that was stored before login
        const returnPath = sessionStorage.getItem('auth_return_path') || '/';
        sessionStorage.removeItem('auth_return_path');
        
        console.log('🔙 Returning to:', returnPath);
        
        // Clean up URL and redirect to return path
        window.history.replaceState({}, document.title, returnPath);
        
        // After successful login, check user status
        await checkUserStatusAndRedirect();
      }
      
      // Update UI
      const isAuthenticated = await window.auth0Client.isAuthenticated();
      console.log('Authentication status:', isAuthenticated);
      updateUI(isAuthenticated);
      
      if (isAuthenticated) {
        const user = await window.auth0Client.getUser();
        console.log('User details:', user);
        displayUserInfo(user);
        
        // Check user status on page load if already authenticated
        await checkUserStatus();
      }
    } catch (error) {
      console.error('Auth0 initialization error:', error);
    }
  }

  // Check user status and show onboarding modal if needed
  async function checkUserStatus() {
    try {
      // Don't show onboarding modal if we're already on the onboarding page!
      if (window.location.pathname === '/onboarding') {
        console.log('⏭️ On onboarding page, skipping modal check');
        return;
      }
      
      console.log('🔍 Checking user status...');
      const token = await window.auth0Client.getTokenSilently();
      const response = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user status:', response.status);
        return;
      }
      
      const userData = await response.json();
      console.log('User data:', userData);
      
      // Check if user needs to complete their profile
      if (!userData.provided_information) {
        console.log('⚠️ User has not completed their profile');
        showOnboardingModal();
      }
      
      // Store user data globally for easy access
      window.currentUserData = userData;
      
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  }

  // Check user status and redirect to onboarding if needed (after login)
  async function checkUserStatusAndRedirect() {
    try {
      console.log('🔍 Checking user status after login...');
      const token = await window.auth0Client.getTokenSilently();
      const response = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch user status:', response.status);
        return;
      }
      
      const userData = await response.json();
      console.log('User data after login:', userData);
      
      // Check if user needs to complete their profile
      if (!userData.provided_information) {
        console.log('🚀 Redirecting to onboarding page...');
        // Redirect to onboarding page
        window.location.href = '/onboarding';
      } else {
        console.log('✅ User profile is complete');
        // User stays on current page (which is the return path)
      }
      
      // Store user data globally
      window.currentUserData = userData;
      
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  }

  // Show onboarding modal (for when user is already logged in but hasn't completed profile)
  function showOnboardingModal() {
    if (typeof window.openOnboardingModal === 'function') {
      window.openOnboardingModal();
    }
  }

  // Update UI
  function updateUI(isAuthenticated) {
    const loggedInElements = document.querySelectorAll('[data-auth="logged-in"]');
    const loggedOutElements = document.querySelectorAll('[data-auth="logged-out"]');
    
     loggedInElements.forEach(el => {
    el.style.display = isAuthenticated ? 'block' : 'none';
  });
  
  loggedOutElements.forEach(el => {
    el.style.display = !isAuthenticated ? 'block' : 'none';
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

  // Login - Store current path before redirecting
  async function login() {
    if (!window.auth0Client) return;
    
    // Store current path so we can return here after login
    sessionStorage.setItem('auth_return_path', window.location.pathname);
    console.log('💾 Stored return path:', window.location.pathname);
    
    await window.auth0Client.loginWithRedirect();
  }

  // Logout
  async function logout() {
    if (!window.auth0Client) return;
    await window.auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin + '/'
      }
    });
  }

  // API Calling Function
  async function callApi() {
    console.log("Attempting to call API...");
    try {
      const token = await window.auth0Client.getTokenSilently();
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

  // Initialize and connect buttons
  initializeAuth0();
  
  setTimeout(() => {
    // Connect login/logout by data-attribute
    document.querySelectorAll('[data-auth-action="login"]').forEach(btn => {
      btn.addEventListener('click', e => (e.preventDefault(), login()));
    });
    document.querySelectorAll('[data-auth-action="logout"]').forEach(btn => {
      btn.addEventListener('click', e => (e.preventDefault(), logout()));
    });

    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) loginBtn.addEventListener('click', e => (e.preventDefault(), login()));

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', e => (e.preventDefault(), logout()));

    const apiBtn = document.getElementById('btn-call-api');
    if (apiBtn) apiBtn.addEventListener('click', e => (e.preventDefault(), callApi()));

  }, 100);
  
  // Debug helper
  window.debugAuth = async function() { 
    console.log('=== Auth Debug Info ===');
    console.log('Auth0 Client exists:', !!window.auth0Client);
    if (window.auth0Client) {
      const isAuth = await window.auth0Client.isAuthenticated();
      console.log('Is authenticated:', isAuth);
      if (isAuth) {
        const user = await window.auth0Client.getUser();
        console.log('User:', user);
        console.log('User Data from API:', window.currentUserData);
        try {
          const token = await window.auth0Client.getTokenSilently();
          console.log('Access Token:', token.substring(0, 20) + "...");
        } catch(e) {
          console.error("Could not get token", e);
        }
      }
    }
    console.log('Stored return path:', sessionStorage.getItem('auth_return_path'));
  };
  
  // Expose check function globally
  window.checkUserStatus = checkUserStatus;
  
  console.log('Auth0 script loaded. Type debugAuth() in console for debug info.');
});
