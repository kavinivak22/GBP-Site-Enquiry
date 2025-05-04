// Global variables
let deferredPrompt;
// Direct API URL without CORS proxy - add ?callback=? to force JSONP
const API_URL = 'https://script.google.com/macros/s/AKfycbyjG9bXCMVncKd3FelMP1__USQf5o4DXkAPvir_TEy5GiJarUcwDUQXOTeW7YzTuJ72kQ/exec';
const DB_NAME = 'guberaan-contact-form';
const DB_VERSION = 1;
const STORE_NAME = 'pending-submissions';

// Map of site codes to their respective Google Maps links
const mapsLinks = {
  "PKGN": "https://maps.app.goo.gl/oe1v3yWsFSWu3FU3A",
  "LVA": "https://maps.app.goo.gl/jYgwwBKjC79Prjr97",
  "IPBG": "https://maps.app.goo.gl/HQ3xVTRgHY21fjgU9",
  "KPBG": "https://maps.app.goo.gl/heKghHLm79131mEZ6"
};

// When DOM is loaded, initialize the app
document.addEventListener('DOMContentLoaded', function() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker registered with scope:', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  }

  // Initialize UI components
  initSiteSelector();
  initConnectionStatus();
  setupFormHandler();
  setupInstallPrompt();
  
  // Check for pending submissions on load
  checkPendingSubmissions();
  
  // Set up background sync when online
  window.addEventListener('online', syncPendingSubmissions);
});

// Initialize site selector functionality
function initSiteSelector() {
  document.querySelectorAll('.site-option').forEach(option => {
    option.addEventListener('click', function() {
      // Remove selected class from all options
      document.querySelectorAll('.site-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      this.classList.add('selected');
      
      // Update hidden input value
      document.getElementById('site').value = this.getAttribute('data-value');
    });
  });
  
  // Set default selected site
  document.querySelector('.site-option[data-value="PKGN"]').click();
}

// Initialize connection status indicator
function initConnectionStatus() {
  // Create connection status element
  const connectionStatus = document.createElement('div');
  connectionStatus.id = 'connectionStatus';
  connectionStatus.className = navigator.onLine ? 'connection-status online' : 'connection-status offline';
  connectionStatus.innerHTML = `
    <span class="connection-status-indicator"></span>
    <span>${navigator.onLine ? 'Online' : 'Offline'}</span>
  `;
  document.body.appendChild(connectionStatus);
  
  // Update connection status when online/offline
  window.addEventListener('online', function() {
    connectionStatus.className = 'connection-status online';
    connectionStatus.innerHTML = `
      <span class="connection-status-indicator"></span>
      <span>Online</span>
    `;
    syncPendingSubmissions();
  });
  
  window.addEventListener('offline', function() {
    connectionStatus.className = 'connection-status offline';
    connectionStatus.innerHTML = `
      <span class="connection-status-indicator"></span>
      <span>Offline</span>
    `;
  });
}

// Set up form submission handler
function setupFormHandler() {
  document.getElementById("contactForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    // Disable the submit button and show loading spinner
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('loading').style.display = 'block';
    document.getElementById('status').style.display = 'none';
    
    // Get form values
    const site = document.getElementById("site").value;
    const name = document.getElementById("name").value;
    const rawPhone = document.getElementById("phone").value;
    const product = document.getElementById("product").value;
    
    // Validate form fields
    if (!site) {
      showStatus("Please select a site", "error");
      return;
    }
    
    if (!name.trim()) {
      showStatus("Please enter your name", "error");
      return;
    }
    
    // Validate phone number
    if (!rawPhone.match(/^(\+91|91)?\d{10}$/)) {
      showStatus("Please enter a valid 10-digit phone number with or without +91 prefix", "error");
      return;
    }
    
    if (!product) {
      showStatus("Please select an interested product", "error");
      return;
    }
    
    // Format phone number with country code if needed
    const formattedPhone = formatPhoneNumber(rawPhone);
    
    // Prepare data for submission
    const formData = {
      site: site,
      name: name,
      phone: formattedPhone,
      product: product,
      timestamp: new Date().toISOString()
    };
    
    try {
      let result;
      
      if (navigator.onLine) {
        // If online, submit data directly
        result = await submitFormData(formData);
      } else {
        // If offline, save data locally
        await saveLocalFormData(formData);
        result = { status: 'success', message: 'Form saved offline. Will submit when online.' };
      }
      
      if (result.status === 'success') {
        // Create WhatsApp message and build the link
        const message = createWhatsAppMessage(site, name, formattedPhone, product);
        const waLink = `https://wa.me/${formattedPhone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
        
        // Show success message
        showStatus(result.message, "success");
        
        // Slight delay before redirecting to WhatsApp
        setTimeout(function() {
          window.open(waLink, "_blank");
          
          // Reset the form after success
          document.getElementById("contactForm").reset();
          document.querySelector('.site-option[data-value="PKGN"]').click();
        }, 1500);
      } else {
        // Show error message if save failed
        showStatus("Error: " + result.message, "error");
      }
    } catch (error) {
      // Handle any errors
      showStatus("Failed to process your request: " + (error.message || "Unknown error"), "error");
    }
  });
}

// Format phone number with +91 prefix if needed
function formatPhoneNumber(phone) {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if the phone already has country code
  if (phone.startsWith('+91')) {
    return phone;
  } else if (phone.startsWith('91') && cleanPhone.length >= 12) {
    return '+' + phone;
  } else if (cleanPhone.length === 10) {
    // Add +91 prefix for 10-digit numbers without country code
    return '+91' + cleanPhone;
  }
  
  // Return original if none of the conditions match
  return phone;
}

// Create WhatsApp message
function createWhatsAppMessage(site, name, phone, product) {
  const mapsLink = mapsLinks[site] || "https://maps.google.com";
  
  const message = `Dear Mr./Ms. ${name}, 👋
It was a pleasure meeting you at our layout today.

🏡 Gated community sites | Ready to Occupy Villas | Rental Properties

📹 Site Videos & Details: https://hovqr.to/8262c683

📍 Location: ${mapsLink}

Please feel free to reach out for any further information. We'll be happy to assist you.
Guberaan Builders and Promotors | 9688447799`;

  return message;
}

// Show status message
function showStatus(message, type = 'error') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + (type === 'success' ? 'success' : 'error');
  statusDiv.style.display = 'block';
  
  // Hide the loading spinner
  document.getElementById('loading').style.display = 'none';
  
  // Re-enable the submit button
  document.getElementById('submitBtn').disabled = false;
}

// Save form data locally when offline
async function saveLocalFormData(formData) {
  const db = await openDatabase();
  await storeFormData(db, formData);
  
  // Show notification for pending submissions
  const pendingCount = await getPendingCount();
  togglePendingNotification(true, pendingCount);
  
  return true;
}

// Toggle pending notification banner
function togglePendingNotification(show, count = 0) {
  let notification = document.getElementById('pendingNotification');
  
  // Create notification if it doesn't exist
  if (!notification && show) {
    notification = document.createElement('div');
    notification.id = 'pendingNotification';
    notification.className = 'pending-notification';
    document.body.appendChild(notification);
  }
  
  if (notification) {
    if (show && count > 0) {
      notification.textContent = `${count} form${count > 1 ? 's' : ''} waiting to be submitted`;
      notification.style.display = 'block';
    } else {
      notification.style.display = 'none';
    }
  }
}

// Check for pending submissions
async function checkPendingSubmissions() {
  try {
    const pendingCount = await getPendingCount();
    togglePendingNotification(pendingCount > 0, pendingCount);
    
    return pendingCount;
  } catch (error) {
    console.error('Error checking pending submissions:', error);
    return 0;
  }
}

// Get count of pending submissions
async function getPendingCount() {
  try {
    const db = await openDatabase();
    const submissions = await getAllPendingSubmissions(db);
    return submissions.length;
  } catch (error) {
    console.error('Error getting pending count:', error);
    return 0;
  }
}

// Submit form data to Google Apps Script
async function submitFormData(formData) {
  try {
    // Create a form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = API_URL;
    // Create and use a hidden iframe to avoid page redirect
    let iframe = document.getElementById('hidden-form-target');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.name = 'hidden-form-target';
      iframe.id = 'hidden-form-target';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }
    form.target = 'hidden-form-target';
    form.style.display = 'none';
    
    // Add form data as hidden fields
    for (const key in formData) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = typeof formData[key] === 'object' ? JSON.stringify(formData[key]) : formData[key];
      form.appendChild(input);
    }
    
    // Add the form to the document and submit it
    document.body.appendChild(form);
    form.submit();
    
    // After a moment, clean up and resolve with a success response
    setTimeout(() => {
      document.body.removeChild(form);
    }, 1000);
    
    return {
      status: 'success',
      message: 'Data submitted successfully!'
    };
  } catch (error) {
    console.error('Error submitting form:', error);
    // Save locally if submission fails due to network issues
    if (!navigator.onLine) {
      await saveLocalFormData(formData);
      return {
        status: 'success',
        message: 'Saved offline. Will submit when online.'
      };
    }
    throw error;
  }
}

// Sync pending submissions when back online
async function syncPendingSubmissions() {
  if (!navigator.onLine) return;
  
  try {
    const db = await openDatabase();
    const pendingSubmissions = await getAllPendingSubmissions(db);
    
    if (pendingSubmissions.length === 0) return;
    
    console.log(`Syncing ${pendingSubmissions.length} pending submissions`);
    
    // Process each pending submission
    for (const submission of pendingSubmissions) {
      try {
        // Submit the data
        const result = await submitFormData(submission.data);
        
        if (result.status === 'success') {
          // Remove from local storage after successful submission
          await deleteSubmission(db, submission.id);
        }
      } catch (error) {
        console.error(`Failed to sync submission ${submission.id}:`, error);
      }
    }
    
    // Update the pending notification
    const remainingCount = await getPendingCount();
    togglePendingNotification(remainingCount > 0, remainingCount);
    
  } catch (error) {
    console.error('Error syncing pending submissions:', error);
  }
}

// Open IndexedDB database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = event => {
      reject('Database error: ' + event.target.error);
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create object store for pending submissions if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Store form data in IndexedDB
function storeFormData(db, formData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.add({
      data: formData,
      timestamp: new Date().toISOString()
    });
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get all pending submissions from IndexedDB
function getAllPendingSubmissions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Delete a submission from IndexedDB
function deleteSubmission(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Set up install prompt
function setupInstallPrompt() {
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show the install prompt after a delay (5 seconds)
    setTimeout(() => {
      showInstallPrompt();
    }, 5000);
  });
  
  // Listen for appinstalled event
  window.addEventListener('appinstalled', (e) => {
    hideInstallPrompt();
    deferredPrompt = null;
    console.log('App was installed');
  });
}

// Show install prompt
function showInstallPrompt() {
  if (!deferredPrompt) return;
  
  // Check if prompt already exists
  let prompt = document.getElementById('installPrompt');
  if (prompt) return;
  
  // Create prompt element
  prompt = document.createElement('div');
  prompt.id = 'installPrompt';
  prompt.className = 'install-prompt';
  prompt.innerHTML = `
    <p>Install this app on your device for offline use!</p>
    <div class="install-actions">
      <button class="install-btn" id="installBtn">Install</button>
      <button class="close-prompt-btn" id="closePromptBtn">Not Now</button>
    </div>
  `;
  document.body.appendChild(prompt);
  
  // Handle install button click
  document.getElementById('installBtn').addEventListener('click', () => {
    // Show the browser install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      hideInstallPrompt();
      deferredPrompt = null;
    });
  });
  
  // Handle close button click
  document.getElementById('closePromptBtn').addEventListener('click', hideInstallPrompt);
}

// Hide install prompt
function hideInstallPrompt() {
  const prompt = document.getElementById('installPrompt');
  if (prompt) {
    prompt.style.display = 'none';
  }
}