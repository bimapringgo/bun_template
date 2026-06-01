// public/assets/custom.js

// Initialize a global namespace object if it doesn't exist
window.App = window.App || {};

window.App.initTimeout = function(minutes = 5) {
  const INACTIVITY_TIMEOUT = minutes * 60 * 1000; 
  let idleTimer;

  // Function to redirect to logout
  function logoutUser() {
    alert("You have been logged out due to inactivity.");
    window.location.href = "/logout";
  }

  // Attach the reset function to the global App object so other scripts can call it
  window.App.resetTimer = function() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(logoutUser, INACTIVITY_TIMEOUT);
  };

  // Setup core global browser movement listeners
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
  activityEvents.forEach(event => {
    document.addEventListener(event, window.App.resetTimer, true);
  });

  // Start the initial countdown
  window.App.resetTimer();
  console.log(`Inactivity timer initialized for ${minutes} minutes.`);
};

document.addEventListener("DOMContentLoaded", function() {
    const toggleButton = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar");

    toggleButton.addEventListener("click", function(e) {
        e.preventDefault();
        sidebar.classList.toggle("collapsed");
    });
});

// public/assets/custom.js

async function ajaxPost(url, data, callback, errorCallback) {
  try {
    // 1. Execute the fetch request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Tells Bun to expect a JSON body
        "Accept": "application/json"
      },
      body: JSON.stringify(data) // Convert your JS object to a JSON string
    });

    // 2. Parse the JSON response
    const R = await response.json();

    // 3. Check for HTTP errors (e.g., 400, 500)
    if (!response.ok) {
      // Throw an error so it gets caught in the catch block below
      throw new Error(R.message || `HTTP Error: ${response.status}`);
    }

    // 4. Success Callback
    if (typeof callback === 'function') {
      callback(R);
    }

    // Return the response for cases where no callback was provided
    return R; 

  } catch (err) {
    // 5. Global Error Handling (SweetAlert)
    errSwal(err.message || err); 
    
    // Fire the custom error callback if provided
    if (typeof errorCallback === 'function') {
      errorCallback(err);
    }

    // If no callback exists, log it so it doesn't fail silently
    if (!callback && !errorCallback) {
        console.error("AjaxPost Error:", err);
    }
  }
}