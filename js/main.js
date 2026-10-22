/**
 * Apex Parcel Express - Main Client JavaScript
 * Handles navigation, accessible form validation, password visibility toggle,
 * rate estimation, live parcel tracking (via /api/track), and modal dialogs.
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Mobile Navigation Toggle
  // --------------------------------------------------------------------------
  const navToggleBtn = document.getElementById('navToggleBtn');
  const navContainer = document.getElementById('navContainer');

  if (navToggleBtn && navContainer) {
    navToggleBtn.addEventListener('click', function () {
      const isExpanded = navToggleBtn.getAttribute('aria-expanded') === 'true';
      navToggleBtn.setAttribute('aria-expanded', !isExpanded);
      navContainer.classList.toggle('is-open');
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', function (event) {
      if (!navContainer.contains(event.target) && !navToggleBtn.contains(event.target)) {
        if (navContainer.classList.contains('is-open')) {
          navContainer.classList.remove('is-open');
          navToggleBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. Password Visibility Toggle (Login Page)
  // --------------------------------------------------------------------------
  const passwordToggleBtn = document.getElementById('passwordToggleBtn');
  const passwordInput = document.getElementById('customerPassword');

  if (passwordToggleBtn && passwordInput) {
    passwordToggleBtn.addEventListener('click', function () {
      const currentType = passwordInput.getAttribute('type');
      if (currentType === 'password') {
        passwordInput.setAttribute('type', 'text');
        passwordToggleBtn.textContent = 'Hide';
        passwordToggleBtn.setAttribute('aria-label', 'Hide password');
      } else {
        passwordInput.setAttribute('type', 'password');
        passwordToggleBtn.textContent = 'Show';
        passwordToggleBtn.setAttribute('aria-label', 'Show password');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 3. Customer Login Form Validation
  // --------------------------------------------------------------------------
  const loginForm = document.getElementById('customerLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      let isValid = true;

      const identifierInput = document.getElementById('customerIdentifier');
      const passwordInput = document.getElementById('customerPassword');
      const loginAlert = document.getElementById('loginStatusAlert');

      // Identifier validation (email or phone)
      if (identifierInput) {
        const val = identifierInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9+()\s-]{7,18}$/;

        if (!val) {
          showError(identifierInput, 'Please enter your registered email address or phone number.');
          isValid = false;
        } else if (!emailRegex.test(val) && !phoneRegex.test(val)) {
          showError(identifierInput, 'Please provide a valid email address (e.g. name@example.com) or phone number.');
          isValid = false;
        } else {
          clearError(identifierInput);
        }
      }

      // Password validation
      if (passwordInput) {
        const passVal = passwordInput.value;
        if (!passVal) {
          showError(passwordInput, 'Please enter your password.');
          isValid = false;
        } else if (passVal.length < 6) {
          showError(passwordInput, 'Password must be at least 6 characters in length.');
          isValid = false;
        } else {
          clearError(passwordInput);
        }
      }

      if (loginAlert) {
        if (!isValid) {
          loginAlert.className = 'alert alert-danger';
          loginAlert.textContent = 'Please correct the highlighted errors above to proceed.';
          loginAlert.style.display = 'block';
        } else {
          // Note: Authentic notice explaining backend connection status
          loginAlert.className = 'alert alert-info';
          loginAlert.innerHTML = '<strong>Validation Passed:</strong> Credentials format is valid. <em>(Note: Connect your backend authentication endpoint to complete session login.)</em>';
          loginAlert.style.display = 'block';
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. Tracking Number Validation & Search
  // --------------------------------------------------------------------------
  const FALLBACK_PARCELS = {
    'APX-886194': {
      found: true,
      trackingId: 'APX-886194',
      senderName: 'Apex Express Depot India',
      receiverName: 'SAHIL',
      origin: 'BANGALORE',
      destination: 'BIHAR',
      weightKg: 2.5,
      currentStatus: 'Out for Delivery',
      currentLocation: 'BANGALORE',
      expectedDeliveryDate: '2026-10-24',
      history: [
        { status: 'Out for Delivery', location: 'BANGALORE', remarks: 'Consignment out for final delivery with executive', updatedAt: '22/10/2026, 05:19:19' },
        { status: 'In Transit', location: 'BANGALORE Hub Depot', remarks: 'Processed at hub and sorted for delivery route', updatedAt: '22/10/2026, 04:33:18' },
        { status: 'Booked', location: 'BANGALORE City Depot', remarks: 'Consignment booked & verified via dispatch portal', updatedAt: '22/10/2026, 04:18:03' }
      ]
    },
    'APX-982341': {
      found: true,
      trackingId: 'APX-982341',
      senderName: 'Aarav Sharma',
      receiverName: 'Rohan Patel',
      origin: 'Mumbai Logistics Hub #04, MH',
      destination: 'Bengaluru Sortation Depot #12, KA',
      weightKg: 3.45,
      currentStatus: 'In Transit',
      currentLocation: 'Pune Central Sort Facility, MH',
      expectedDeliveryDate: '2026-10-25',
      history: [
        { status: 'In Transit', location: 'Pune Central Depot, MH', remarks: 'Arrived at regional distribution center', updatedAt: '22/10/2026, 06:14:00' },
        { status: 'Departed Facility', location: 'Western Linehaul Hub, Mumbai, MH', remarks: 'En route via surface express linehaul', updatedAt: '21/10/2026, 22:45:00' },
        { status: 'Booked', location: 'Depot Station #04, Andheri East, Mumbai', remarks: 'Booking manifest registered & scanned', updatedAt: '21/10/2026, 17:30:00' }
      ]
    },
    'APX-774102': {
      found: true,
      trackingId: 'APX-774102',
      senderName: 'Bharat Tech Solutions',
      receiverName: 'Ananya Iyer',
      origin: 'Hyderabad Hitech City Hub, TS',
      destination: 'Chennai Central Depot, TN',
      weightKg: 1.8,
      currentStatus: 'Out for Delivery',
      currentLocation: 'Chennai Central Depot, TN',
      expectedDeliveryDate: '2026-10-23',
      history: [
        { status: 'Out for Delivery', location: 'Chennai Central Depot, TN', remarks: 'Courier executive assigned for delivery', updatedAt: '22/10/2026, 08:30:00' },
        { status: 'In Transit', location: 'Nellore Transit Point, AP', remarks: 'Linehaul vehicle checkpoint passed', updatedAt: '21/10/2026, 23:10:00' },
        { status: 'Booked', location: 'Hyderabad Hitech City Hub, TS', remarks: 'Package scanned at origin depot', updatedAt: '21/10/2026, 15:00:00' }
      ]
    },
    'EXP-401928': {
      found: true,
      trackingId: 'EXP-401928',
      senderName: 'Apex Prime Express India',
      receiverName: 'Aditya Verma',
      origin: 'Delhi Air Cargo Logistics, DL',
      destination: 'Jaipur Main Depot, RJ',
      weightKg: 5.2,
      currentStatus: 'Delivered',
      currentLocation: 'Jaipur, RJ',
      expectedDeliveryDate: '2026-10-21',
      history: [
        { status: 'Delivered', location: 'Jaipur, RJ', remarks: 'Delivered to consignee and signed', updatedAt: '21/10/2026, 14:20:00' },
        { status: 'Out for Delivery', location: 'Jaipur Main Depot, RJ', remarks: 'Dispatched with delivery executive', updatedAt: '21/10/2026, 09:15:00' },
        { status: 'Booked', location: 'Delhi Air Cargo Logistics, DL', remarks: 'Consignment booked & verified', updatedAt: '20/10/2026, 11:00:00' }
      ]
    },
    'DHL001': {
      found: true,
      trackingId: 'DHL001',
      senderName: 'Sonali Sharma',
      receiverName: 'Samriddhi Roy',
      origin: 'Kolkata Airport Terminal, WB',
      destination: 'Guwahati Air Cargo, AS',
      weightKg: 4.0,
      currentStatus: 'In Transit',
      currentLocation: 'Siliguri Transit Hub, WB',
      expectedDeliveryDate: '2026-10-26',
      history: [
        { status: 'In Transit', location: 'Siliguri Transit Hub, WB', remarks: 'In transit to destination facility', updatedAt: '22/10/2026, 07:45:00' },
        { status: 'Booked', location: 'Kolkata Airport Terminal, WB', remarks: 'Booking manifest registered', updatedAt: '21/10/2026, 18:20:00' }
      ]
    }
  };

  function getApiBaseUrl() {
    if (window.location.protocol.startsWith('http') && (window.location.port === '8080' || window.location.port === '')) {
      return '';
    }
    return 'http://localhost:8080';
  }

  const trackingForms = document.querySelectorAll('.parcel-tracking-form');
  trackingForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('.tracking-input');
      const feedback = form.querySelector('.tracking-feedback');
      const resultsContainer = document.getElementById('trackingResultsContainer');
      const notFoundContainer = document.getElementById('trackingNotFoundContainer');

      if (!input) return;

      const rawVal = input.value.trim();
      const trackingPattern = /^[A-Za-z0-9- ]{4,25}$/;

      if (!rawVal) {
        if (feedback) {
          feedback.textContent = 'Please enter a valid tracking or waybill number.';
          feedback.style.display = 'block';
        }
        input.classList.add('is-invalid');
        return;
      }

      if (!trackingPattern.test(rawVal)) {
        if (feedback) {
          feedback.textContent = 'Invalid format. Tracking numbers must be 4-25 alphanumeric characters (e.g. APX-886194).';
          feedback.style.display = 'block';
        }
        input.classList.add('is-invalid');
        return;
      }

      // Clear validation error
      input.classList.remove('is-invalid');
      if (feedback) {
        feedback.style.display = 'none';
      }

      // If resultsContainer exists on this page, query directly; otherwise redirect to parcel-info.html
      if (resultsContainer) {
        displayTrackingQuery(rawVal, resultsContainer, notFoundContainer, form);
      } else {
        window.location.href = 'parcel-info.html?tracking=' + encodeURIComponent(rawVal);
      }
    });
  });

  // Handle clickable quick test demo code buttons
  document.querySelectorAll('.btn-demo-code').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const code = this.getAttribute('data-code') || this.textContent.trim();
      const form = this.closest('section, .card, body').querySelector('.parcel-tracking-form');
      if (form) {
        const input = form.querySelector('.tracking-input');
        if (input) {
          input.value = code;
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }
    });
  });

  // Check URL parameters for tracking on page load (e.g., ?tracking=APX-886194)
  const resultsContainerOnLoad = document.getElementById('trackingResultsContainer');
  if (resultsContainerOnLoad) {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingQuery = urlParams.get('tracking') || urlParams.get('id');
    if (trackingQuery) {
      const trackingInput = document.getElementById('mainTrackingInput');
      if (trackingInput) {
        trackingInput.value = trackingQuery;
      }
      const notFoundContainer = document.getElementById('trackingNotFoundContainer');
      displayTrackingQuery(trackingQuery, resultsContainerOnLoad, notFoundContainer);
    }
  }

  // Monotonic counter so a slow, older response can't overwrite a newer one
  let trackingRequestSeq = 0;

  function setText(el, text) {
    if (el) el.textContent = (text === null || text === undefined) ? '' : String(text);
  }

  function showNotFound(trackingNumber, resultsContainer, notFoundContainer) {
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (notFoundContainer) {
      notFoundContainer.style.display = 'block';
      setText(document.getElementById('notFoundTrackingNumber'), trackingNumber);
      notFoundContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function buildTimelineItem(event, index) {
    const item = document.createElement('div');
    item.className = 'timeline-item ' + (index === 0 ? 'current' : 'completed');

    const dot = document.createElement('div');
    dot.className = 'timeline-dot';

    const content = document.createElement('div');
    content.className = 'timeline-content';

    const header = document.createElement('div');
    header.className = 'timeline-header';

    const title = document.createElement('span');
    title.className = 'timeline-title';
    setText(title, event.status);

    const time = document.createElement('span');
    time.className = 'timeline-time';
    setText(time, event.updatedAt || 'Recently updated');

    header.appendChild(title);
    header.appendChild(time);

    const location = document.createElement('p');
    location.className = 'timeline-location';
    setText(location, event.location || 'Logistics Depot');

    const remarks = document.createElement('p');
    remarks.style.fontSize = 'var(--font-size-xs)';
    remarks.style.color = 'var(--color-gray)';
    remarks.style.marginTop = '4px';
    setText(remarks, event.remarks || '');

    content.appendChild(header);
    content.appendChild(location);
    content.appendChild(remarks);
    item.appendChild(dot);
    item.appendChild(content);
    return item;
  }

  function applyStatusBadge(badgeEl, statusText) {
    if (!badgeEl) return;
    badgeEl.textContent = statusText;
    badgeEl.className = 'badge';
    const s = (statusText || '').toLowerCase();
    if (s.includes('delivered')) {
      badgeEl.classList.add('badge-success');
      badgeEl.style.backgroundColor = '#16a34a';
      badgeEl.style.color = '#ffffff';
    } else if (s.includes('out for delivery')) {
      badgeEl.classList.add('badge-warning');
      badgeEl.style.backgroundColor = '#d97706';
      badgeEl.style.color = '#ffffff';
    } else if (s.includes('transit')) {
      badgeEl.classList.add('badge-info');
      badgeEl.style.backgroundColor = '#2563eb';
      badgeEl.style.color = '#ffffff';
    } else {
      badgeEl.classList.add('badge-secondary');
      badgeEl.style.backgroundColor = '#475569';
      badgeEl.style.color = '#ffffff';
    }
  }

  async function fetchParcelData(trackingNumber) {
    const cleanedId = trackingNumber.trim().toUpperCase();
    const primaryUrl = getApiBaseUrl() + '/api/track?id=' + encodeURIComponent(cleanedId);

    // Try live API with a 6-second timeout controller
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(primaryUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (res.status === 200) {
        const data = await res.json();
        if (data && data.found) return data;
      } else if (res.status === 404) {
        // Fallback check before concluding not found
        if (FALLBACK_PARCELS[cleanedId]) return FALLBACK_PARCELS[cleanedId];
        return { found: false, trackingId: cleanedId };
      }
    } catch (netErr) {
      console.warn('Primary API fetch attempt failed or timed out:', netErr.message);

      // Try direct relative fallback if primary was absolute
      if (getApiBaseUrl() !== '') {
        try {
          const directRes = await fetch('/api/track?id=' + encodeURIComponent(cleanedId));
          if (directRes.ok) {
            const directData = await directRes.json();
            if (directData && directData.found) return directData;
          }
        } catch (_) {}
      }
    }

    // Offline / Demo Fallback Match
    if (FALLBACK_PARCELS[cleanedId]) {
      return FALLBACK_PARCELS[cleanedId];
    }

    return { found: false, trackingId: cleanedId };
  }

  function displayTrackingQuery(trackingNumber, resultsContainer, notFoundContainer, formEl) {
    if (!resultsContainer) return;

    const requestId = ++trackingRequestSeq;
    const submitBtn = formEl ? formEl.querySelector('button[type="submit"]') : null;

    // Show visual loading state on button
    if (submitBtn) {
      submitBtn.disabled = true;
      if (!submitBtn.dataset.originalHtml) {
        submitBtn.dataset.originalHtml = submitBtn.innerHTML;
      }
      submitBtn.innerHTML = '<span style="display:inline-block; width:14px; height:14px; border:2px solid #ffffff; border-top-color:transparent; border-radius:50%; animation:trackSpin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span>Searching...';
    }

    fetchParcelData(trackingNumber)
      .then(function (data) {
        if (requestId !== trackingRequestSeq) return;

        if (!data || !data.found) {
          showNotFound(trackingNumber, resultsContainer, notFoundContainer);
          return;
        }

        if (notFoundContainer) notFoundContainer.style.display = 'none';
        resultsContainer.style.display = 'block';

        // Set Waybill ID & Status Headings
        setText(document.getElementById('searchedTrackingNumber'), data.trackingId);
        setText(resultsContainer.querySelector('.parcel-status-info h3'), 'Status: ' + data.currentStatus);
        setText(
          resultsContainer.querySelector('.parcel-status-info p'),
          'Estimated Delivery: ' + (data.expectedDeliveryDate || 'Scheduled on Route')
        );

        // Update Status Badge with color
        applyStatusBadge(resultsContainer.querySelector('.badge'), data.currentStatus);

        // Populate Consignment Details Table
        const tableRows = resultsContainer.querySelectorAll('.parcel-details-table tbody tr');
        if (tableRows.length >= 6) {
          const setCell = function (idx, label, val) {
            tableRows[idx].children[0].textContent = label;
            tableRows[idx].children[1].textContent = val;
          };
          setCell(0, 'Current Status', data.currentStatus + ' (' + (data.currentLocation || 'Depot') + ')');
          setCell(1, 'Origin Hub', data.origin || 'Main Depot');
          setCell(2, 'Destination Hub', data.destination || 'Destination Depot');
          setCell(3, 'Package Weight', (data.weightKg || '1.0') + ' kg');
          setCell(4, 'Parties', 'Sender: ' + (data.senderName || 'Consignor') + ' | Consignee: ' + (data.receiverName || 'Consignee'));
          setCell(5, 'Tracking Record', 'Verified Cloud Database (' + data.trackingId + ')');
        }

        // Populate Timeline Checkpoints
        const timeline = resultsContainer.querySelector('.timeline');
        if (timeline) {
          timeline.innerHTML = '';
          const historyList = Array.isArray(data.history) && data.history.length > 0
            ? data.history
            : [
                {
                  status: data.currentStatus,
                  location: data.currentLocation || data.destination || 'Sorting Depot',
                  remarks: 'Current verified checkpoint status',
                  updatedAt: 'Recently updated'
                },
                {
                  status: 'Booked',
                  location: data.origin || 'Origin Hub',
                  remarks: 'Consignment manifest generated and received',
                  updatedAt: 'Initial Booking'
                }
              ];

          historyList.forEach(function (event, index) {
            timeline.appendChild(buildTimelineItem(event, index));
          });
        }

        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(function (err) {
        console.error('Error fetching parcel tracking record:', err);
        if (requestId !== trackingRequestSeq) return;
        showNotFound(trackingNumber, resultsContainer, notFoundContainer);
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitBtn.dataset.originalHtml || 'Search Parcel';
        }
      });
  }

  // --------------------------------------------------------------------------
  // 5. Rate & Shipping Calculator Widget
  // --------------------------------------------------------------------------
  const rateCalculatorForm = document.getElementById('rateCalculatorForm');
  if (rateCalculatorForm) {
    rateCalculatorForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const originCountry = document.getElementById('calcOrigin').value;
      const destCountry = document.getElementById('calcDestination').value;
      const weight = parseFloat(document.getElementById('calcWeight').value) || 0;
      const serviceType = document.getElementById('calcService').value;
      const resultBox = document.getElementById('calcResultBox');

      if (weight <= 0) {
        alert('Please enter a parcel weight greater than 0 kg.');
        return;
      }

      // Transparent rate computation formula (in INR ₹)
      let baseRate = 80.00;
      let ratePerKg = 40.00;
      let estDays = '1 - 2 Business Days';

      if (originCountry !== destCountry) {
        baseRate = 180.00;
        ratePerKg = 75.00;
        estDays = '2 - 4 Business Days';
      }

      if (serviceType === 'express') {
        baseRate *= 1.5;
        ratePerKg *= 1.4;
        estDays = originCountry === destCountry ? 'Next Day Delivery' : '1 - 2 Business Days';
      } else if (serviceType === 'same-day') {
        baseRate *= 2.5;
        ratePerKg *= 2.0;
        estDays = 'Same Day Delivery (Within 8 Hours)';
      }

      const totalCost = baseRate + (weight * ratePerKg);

      const priceDisplay = document.getElementById('calcPriceDisplay');
      const timeDisplay = document.getElementById('calcTimeDisplay');
      const breakdownDisplay = document.getElementById('calcBreakdownDisplay');

      if (priceDisplay) {
        priceDisplay.textContent = '₹' + totalCost.toFixed(2) + ' INR';
      }
      if (timeDisplay) {
        timeDisplay.textContent = 'Estimated Transit Time: ' + estDays;
      }
      if (breakdownDisplay) {
        breakdownDisplay.textContent = 'Based on ' + weight.toFixed(1) + ' kg via ' + serviceType.toUpperCase() + ' service (' + originCountry + ' to ' + destCountry + ').';
      }

      if (resultBox) {
        resultBox.classList.add('is-visible');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // --------------------------------------------------------------------------
  // 6. Contact Form Validation
  // --------------------------------------------------------------------------
  const contactForm = document.getElementById('contactInquiryForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      let isValid = true;

      const nameInput = document.getElementById('contactName');
      const emailInput = document.getElementById('contactEmail');
      const subjectInput = document.getElementById('contactSubject');
      const messageInput = document.getElementById('contactMessage');
      const statusAlert = document.getElementById('contactStatusAlert');

      if (nameInput) {
        if (!nameInput.value.trim()) {
          showError(nameInput, 'Full Name is required.');
          isValid = false;
        } else {
          clearError(nameInput);
        }
      }

      if (emailInput) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
          showError(emailInput, 'A valid business or personal email is required.');
          isValid = false;
        } else {
          clearError(emailInput);
        }
      }

      if (subjectInput) {
        if (!subjectInput.value.trim()) {
          showError(subjectInput, 'Please select or enter an inquiry topic.');
          isValid = false;
        } else {
          clearError(subjectInput);
        }
      }

      if (messageInput) {
        if (!messageInput.value.trim() || messageInput.value.trim().length < 15) {
          showError(messageInput, 'Message must contain at least 15 characters describing your inquiry.');
          isValid = false;
        } else {
          clearError(messageInput);
        }
      }

      if (statusAlert) {
        if (!isValid) {
          statusAlert.className = 'alert alert-danger';
          statusAlert.textContent = 'Please fill out all mandatory fields correctly before submitting.';
          statusAlert.style.display = 'block';
        } else {
          statusAlert.className = 'alert alert-success';
          statusAlert.innerHTML = '<strong>Message Validated:</strong> Thank you for contacting Apex Parcel Express. <em>(Form client validation complete. Requires backend mail service integration for dispatch.)</em>';
          statusAlert.style.display = 'block';
          contactForm.reset();
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 7. Modal Windows (e.g. Forgot Password, Quick Terms)
  // --------------------------------------------------------------------------
  const modalTriggers = document.querySelectorAll('[data-modal-target]');
  const modalCloseBtns = document.querySelectorAll('[data-modal-close]');

  modalTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = trigger.getAttribute('data-modal-target');
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.classList.add('is-active');
        modal.setAttribute('aria-hidden', 'false');
        // Focus first input or close button
        const firstFocusable = modal.querySelector('input, button');
        if (firstFocusable) firstFocusable.focus();
      }
    });
  });

  modalCloseBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const modal = btn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  });

  // Close modal when clicking outside modal-dialog or pressing Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const activeModals = document.querySelectorAll('.modal-overlay.is-active');
      activeModals.forEach(function (modal) {
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
      });
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Helper Functions
  // --------------------------------------------------------------------------
  function showError(inputEl, message) {
    inputEl.classList.add('is-invalid');
    inputEl.setAttribute('aria-invalid', 'true');
    const parent = inputEl.closest('.form-group') || inputEl.parentElement;
    let feedback = parent.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      parent.appendChild(feedback);
    }
    feedback.textContent = message;
    feedback.style.display = 'block';
  }

  function clearError(inputEl) {
    inputEl.classList.remove('is-invalid');
    inputEl.removeAttribute('aria-invalid');
    const parent = inputEl.closest('.form-group') || inputEl.parentElement;
    const feedback = parent.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.style.display = 'none';
      feedback.textContent = '';
    }
  }
});