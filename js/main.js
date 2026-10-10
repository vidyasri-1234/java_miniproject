/**
 * Apex Parcel Express - Main Client JavaScript
 * Handles navigation, accessible form validation, password visibility toggle,
 * rate estimation, and modal dialogs.
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
      // Tracking pattern: APX-XXXXXXX or 8 to 14 alphanumeric characters
      const trackingPattern = /^[A-Za-z0-9-]{8,20}$/;

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
          feedback.textContent = 'Invalid format. Tracking numbers must be 8-20 alphanumeric characters (e.g. APX-982341).';
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

      // If user is on home page, redirect to parcel-info.html with query param
      if (!window.location.pathname.includes('parcel-info.html')) {
        window.location.href = 'parcel-info.html?tracking=' + encodeURIComponent(rawVal);
        return;
      }

      // If on parcel-info.html, handle the query display
      displayTrackingQuery(rawVal, resultsContainer, notFoundContainer);
    });
  });

  // Check URL parameters for tracking on page load (e.g., ?tracking=APX-982341)
  if (window.location.pathname.includes('parcel-info.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingQuery = urlParams.get('tracking');
    if (trackingQuery) {
      const trackingInput = document.getElementById('mainTrackingInput');
      if (trackingInput) {
        trackingInput.value = trackingQuery;
      }
      const resultsContainer = document.getElementById('trackingResultsContainer');
      const notFoundContainer = document.getElementById('trackingNotFoundContainer');
      displayTrackingQuery(trackingQuery, resultsContainer, notFoundContainer);
    }
  }

  function displayTrackingQuery(trackingNumber, resultsContainer, notFoundContainer) {
    const queryDisplay = document.getElementById('searchedTrackingNumber');
    if (queryDisplay) {
      queryDisplay.textContent = trackingNumber.toUpperCase();
    }

    // Standard demo tracking numbers for real verification demonstration
    const sampleNumbers = ['APX-982341', 'APX-774102', 'EXP-401928'];
    const isSample = sampleNumbers.some(function (num) {
      return num.toLowerCase() === trackingNumber.toLowerCase();
    });

    if (resultsContainer && notFoundContainer) {
      if (isSample || trackingNumber.toUpperCase().startsWith('APX-')) {
        resultsContainer.style.display = 'block';
        notFoundContainer.style.display = 'none';
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        resultsContainer.style.display = 'none';
        notFoundContainer.style.display = 'block';
        const notFoundText = document.getElementById('notFoundTrackingNumber');
        if (notFoundText) {
          notFoundText.textContent = trackingNumber;
        }
        notFoundContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
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

      // Transparent rate computation formula
      let baseRate = 12.00;
      let ratePerKg = 4.50;
      let estDays = '3 - 5 Business Days';

      if (originCountry !== destCountry) {
        baseRate = 35.00;
        ratePerKg = 9.50;
        estDays = '5 - 8 Business Days';
      }

      if (serviceType === 'express') {
        baseRate *= 1.8;
        ratePerKg *= 1.6;
        estDays = originCountry === destCountry ? '1 - 2 Business Days' : '2 - 4 Business Days';
      } else if (serviceType === 'same-day') {
        baseRate *= 2.5;
        ratePerKg *= 2.2;
        estDays = 'Same Day (Within 8 Hours)';
      }

      const totalCost = baseRate + (weight * ratePerKg);

      const priceDisplay = document.getElementById('calcPriceDisplay');
      const timeDisplay = document.getElementById('calcTimeDisplay');
      const breakdownDisplay = document.getElementById('calcBreakdownDisplay');

      if (priceDisplay) {
        priceDisplay.textContent = '$' + totalCost.toFixed(2) + ' USD';
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
