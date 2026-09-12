// ============================================
// FarmChain AI — Admin User Management
// Cross-role user listing, verification, ban
// ============================================

import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { getRoleConfig, showToast, timeAgo } from '../../utils/helpers.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { getFirestoreUsers } from '../../firebase/firestore.js';
import { fetchUsers } from '../../utils/api.js';

export function renderAdminUsers(container) {
  const users = store.get('users') || {};
  const userList = Object.values(users);

  // Role counts
  const roleCounts = {};
  userList.forEach(u => {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  });

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main">
        <div class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">User Management 👥</div>
              <div class="topbar-breadcrumb"><span>Admin</span> <span>›</span> <span>Users</span></div>
            </div>
          </div>
          <div class="topbar-right">
            <div class="topbar-search">
              <span class="topbar-search-icon">🔍</span>
              <input type="text" placeholder="Search users..." id="user-search-input" />
            </div>
            <button class="btn btn-secondary btn-sm logout-btn" data-action="logout" style="border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red); padding: 6px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px;">🚪 <span>Logout</span></button>
          </div>
        </div>

        <div class="page-content">
          <!-- Role Summary Stats -->
          <div class="dashboard-stats stagger-children">
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">👥</div>
              <div class="stat-card-value">${userList.length}</div>
              <div class="stat-card-label">Total Users</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-green-dim); color: var(--accent-green);">🌾</div>
              <div class="stat-card-value">${roleCounts.farmer || 0}</div>
              <div class="stat-card-label">Farmers</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-amber-dim); color: var(--accent-amber);">🏪</div>
              <div class="stat-card-value">${roleCounts.intermediary || 0}</div>
              <div class="stat-card-label">Intermediaries</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon" style="background: var(--accent-blue-dim); color: var(--accent-blue);">🛒</div>
              <div class="stat-card-value">${(roleCounts.retailer || 0) + (roleCounts.consumer || 0)}</div>
              <div class="stat-card-label">Retailers + Consumers</div>
            </div>
          </div>

          <!-- Role Filter Tabs -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="tab active role-filter-tab" data-role="all">All</button>
            <button class="tab role-filter-tab" data-role="farmer">🌾 Farmers</button>
            <button class="tab role-filter-tab" data-role="intermediary">🏪 Intermediaries</button>
            <button class="tab role-filter-tab" data-role="retailer">🛒 Retailers</button>
            <button class="tab role-filter-tab" data-role="consumer">👤 Consumers</button>
            <button class="tab role-filter-tab" data-role="admin">🔧 Admins</button>
          </div>

          <!-- Users Table -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">All Platform Users</div>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Rating</th>
                  <th>Verified</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="users-tbody">
                ${userList.map(u => {
                  const config = getRoleConfig(u.role);
                  return `
                    <tr class="user-row" data-role="${u.role}" data-name="${escapeHtml((u.name || '').toLowerCase())}" data-id="${u.id}">
                      <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <div style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${config.bgColor}; color: ${config.color}; font-size: 1.2rem;">
                            ${u.avatar || config.icon}
                          </div>
                          <div>
                            <div style="font-weight: 600;">${escapeHtml(u.name || 'Unknown')}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(u.email || '')}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="badge" style="background: ${config.bgColor}; color: ${config.color};">
                          ${config.icon} ${config.label}
                        </span>
                      </td>
                      <td style="font-size: 0.85rem;">${escapeHtml(u.location || 'N/A')}</td>
                      <td>
                        <span style="color: var(--accent-amber);">★</span> ${u.rating || 'N/A'}
                      </td>
                      <td>
                        <span class="badge ${u.verified ? 'badge-success' : 'badge-warning'}">
                          ${u.verified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style="font-size: 0.8rem; color: var(--text-muted);">
                        ${u.joinedAt ? timeAgo(u.joinedAt) : 'N/A'}
                      </td>
                      <td>
                        <div style="display: flex; gap: 4px;">
                          ${!u.verified ? `<button class="btn btn-primary btn-sm verify-btn" data-user-id="${u.id}" style="font-size: 0.7rem; padding: 4px 8px;">✅ Verify</button>` : ''}
                          ${u.role !== 'admin' ? `<button class="btn btn-secondary btn-sm ban-btn" data-user-id="${u.id}" style="font-size: 0.7rem; padding: 4px 8px;">🚫 Ban</button>` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;

  // Search
  container.querySelector('#user-search-input')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    container.querySelectorAll('.user-row').forEach(row => {
      const name = row.dataset.name;
      row.style.display = name.includes(query) ? '' : 'none';
    });
  });

  // Role filter tabs
  container.querySelectorAll('.role-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.role-filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const role = tab.dataset.role;
      container.querySelectorAll('.user-row').forEach(row => {
        row.style.display = role === 'all' || row.dataset.role === role ? '' : 'none';
      });
    });
  });

  // Verify buttons
  container.querySelectorAll('.verify-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.dataset.userId;
      const users = store.get('users') || {};
      if (users[userId]) {
        users[userId].verified = true;
        store.set('users', users);
        showToast(`User ${users[userId].name} verified ✅`, 'success');
        renderAdminUsers(container);
      }
    });
  });

  // Ban buttons
  container.querySelectorAll('.ban-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.dataset.userId;
      const users = store.get('users') || {};
      if (users[userId]) {
        const userName = users[userId].name;
        if (confirm(`Are you sure you want to ban ${userName}?`)) {
          delete users[userId];
          store.set('users', users);
          showToast(`User ${userName} has been banned 🚫`, 'warning');
          renderAdminUsers(container);
        }
      }
    });
  });

  // Asynchronously fetch latest registered users from Firestore & Backend API
  (async () => {
    let hasChanges = false;
    const currentUsers = { ...(store.get('users') || {}) };

    try {
      const firestoreUsers = await getFirestoreUsers();
      if (Array.isArray(firestoreUsers)) {
        firestoreUsers.forEach(u => {
          const id = u.id || u.uid;
          if (id && (!currentUsers[id] || currentUsers[id].name !== u.name || currentUsers[id].email !== u.email)) {
            currentUsers[id] = { ...currentUsers[id], ...u };
            hasChanges = true;
          }
        });
      }
    } catch (e) {
      console.warn('Firestore user sync warning:', e);
    }

    try {
      const apiUsers = await fetchUsers();
      if (Array.isArray(apiUsers)) {
        apiUsers.forEach(u => {
          const id = u.id || u.uid;
          if (id && (!currentUsers[id] || currentUsers[id].name !== u.name || currentUsers[id].email !== u.email)) {
            currentUsers[id] = { ...currentUsers[id], ...u };
            hasChanges = true;
          }
        });
      }
    } catch (e) {
      console.warn('Backend user sync warning:', e);
    }

    if (hasChanges) {
      store.set('users', currentUsers);
      renderAdminUsers(container);
    }
  })();
}
