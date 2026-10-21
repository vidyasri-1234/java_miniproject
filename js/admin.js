// Admin JavaScript for Apex Parcel Express
document.addEventListener('DOMContentLoaded', () => {
  // Check if on login page
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: usernameInput.value,
            password: passwordInput.value
          })
        });

        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem('adminUser', JSON.stringify(data.user));
          window.location.href = 'admin-dashboard.html';
        } else {
          alert(data.message || 'Login failed. Please check your credentials.');
        }
      } catch (err) {
        alert('Could not connect to the authentication server: ' + err.message);
      }
    });
    return;
  }

  // Check if on admin dashboard page
  const parcelTable = document.getElementById('parcelTable');
  if (parcelTable) {
    // Check authentication
    const user = sessionStorage.getItem('adminUser');
    if (!user) {
      // Allow viewing but inform or redirect
      // window.location.href = 'admin-login.html';
    }

    loadParcels();

    const parcelForm = document.getElementById('parcelForm');
    if (parcelForm) {
      parcelForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const trackingId = document.getElementById('trackingId').value.trim();
        const customerName = document.getElementById('customerName').value.trim();
        const destination = document.getElementById('destination').value.trim();
        const location = document.getElementById('location').value.trim();
        const status = document.getElementById('status').value;

        const messageEl = document.getElementById('message');
        try {
          const res = await fetch('/api/admin/parcels', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackingId, customerName, destination, location, status })
          });
          const result = await res.json();
          if (result.success) {
            if (messageEl) {
              messageEl.textContent = 'Parcel saved successfully!';
              messageEl.style.color = '#155724';
            }
            parcelForm.reset();
            document.getElementById('cancelEdit').hidden = true;
            document.getElementById('formTitle').textContent = 'Add New Parcel';
            loadParcels();
          } else {
            if (messageEl) {
              messageEl.textContent = result.message || 'Failed to save parcel.';
              messageEl.style.color = '#721c24';
            }
          }
        } catch (err) {
          if (messageEl) {
            messageEl.textContent = 'Server error: ' + err.message;
            messageEl.style.color = '#721c24';
          }
        }
      });
    }

    const cancelEditBtn = document.getElementById('cancelEdit');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => {
        parcelForm.reset();
        cancelEditBtn.hidden = true;
        document.getElementById('formTitle').textContent = 'Add New Parcel';
      });
    }

    const searchBtn = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', () => {
        const query = searchInput.value.toLowerCase().trim();
        filterParcels(query);
      });
      searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          filterParcels(searchInput.value.toLowerCase().trim());
        }
      });
    }

    const showAllBtn = document.getElementById('showAllButton');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        loadParcels();
      });
    }
  }
});

let allParcelsCache = [];

async function loadParcels() {
  try {
    const res = await fetch('/api/admin/parcels');
    const data = await res.json();
    if (data.success && Array.isArray(data.parcels)) {
      allParcelsCache = data.parcels;
      renderTable(allParcelsCache);
      updateStats(allParcelsCache);
    }
  } catch (err) {
    console.error('Error loading parcels:', err);
  }
}

function updateStats(parcels) {
  const total = parcels.length;
  const inTransit = parcels.filter(p => (p.current_status || '').toLowerCase() === 'in transit').length;
  const delivered = parcels.filter(p => (p.current_status || '').toLowerCase() === 'delivered').length;

  const totalEl = document.getElementById('totalParcels');
  const inTransitEl = document.getElementById('inTransit');
  const deliveredEl = document.getElementById('delivered');

  if (totalEl) totalEl.textContent = total;
  if (inTransitEl) inTransitEl.textContent = inTransit;
  if (deliveredEl) deliveredEl.textContent = delivered;
}

function renderTable(parcels) {
  const tbody = document.getElementById('parcelTable');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (parcels.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No parcels found.</td></tr>';
    return;
  }

  parcels.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(p.tracking_id)}</strong></td>
      <td>${escapeHtml(p.receiver_name || p.sender_name || 'N/A')}</td>
      <td>${escapeHtml(p.destination || 'N/A')}</td>
      <td>${escapeHtml(p.current_location || 'N/A')}</td>
      <td><span class="status-badge status-${(p.current_status || 'booked').toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(p.current_status || 'Booked')}</span></td>
      <td><a href="parcel-info.html?tracking=${encodeURIComponent(p.tracking_id)}" target="_blank">View Live</a></td>
      <td>
        <button type="button" class="btn-action btn-edit" onclick="editParcel('${escapeHtml(p.tracking_id)}')">Edit</button>
        <button type="button" class="btn-action btn-delete" onclick="deleteParcel('${escapeHtml(p.tracking_id)}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterParcels(query) {
  if (!query) {
    renderTable(allParcelsCache);
    return;
  }
  const filtered = allParcelsCache.filter(p => {
    return (
      (p.tracking_id && p.tracking_id.toLowerCase().includes(query)) ||
      (p.receiver_name && p.receiver_name.toLowerCase().includes(query)) ||
      (p.current_status && p.current_status.toLowerCase().includes(query)) ||
      (p.destination && p.destination.toLowerCase().includes(query))
    );
  });
  renderTable(filtered);
}

window.editParcel = function(trackingId) {
  const p = allParcelsCache.find(x => x.tracking_id.toLowerCase() === trackingId.toLowerCase());
  if (!p) return;

  document.getElementById('formTitle').textContent = 'Edit Parcel: ' + p.tracking_id;
  document.getElementById('trackingId').value = p.tracking_id;
  document.getElementById('customerName').value = p.receiver_name || p.sender_name || '';
  document.getElementById('destination').value = p.destination || '';
  document.getElementById('location').value = p.current_location || '';
  document.getElementById('status').value = p.current_status || 'Booked';
  document.getElementById('cancelEdit').hidden = false;
  window.scrollTo({ top: 200, behavior: 'smooth' });
};

window.deleteParcel = async function(trackingId) {
  if (!confirm(`Are you sure you want to delete parcel ${trackingId}?`)) return;

  try {
    const res = await fetch(`/api/admin/parcels/${encodeURIComponent(trackingId)}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadParcels();
    } else {
      alert(data.message || 'Failed to delete parcel.');
    }
  } catch (err) {
    alert('Server error: ' + err.message);
  }
};

window.logout = function() {
  sessionStorage.removeItem('adminUser');
  window.location.href = 'admin-login.html';
};

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
