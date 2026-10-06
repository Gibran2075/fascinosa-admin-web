/* =============================================================
 * FASCINOSA ADMIN PORTAL — Dashboard Module (Vanilla JavaScript)
 * -------------------------------------------------------------
 * Fitur:
 *   - Sidebar navigation (aktif / smooth scroll / menu Phase 2)
 *   - Toast notification elegan
 *   - 4 ringkasan card statistik (static HTML)
 *   - Grafik "Pertumbuhan Member Baru 2026" (Chart.js)
 *   - Tabel member: search, filter status, export Excel (SheetJS)
 *   - Modal Detail / Edit member (ubah status Active / Inactive)
 *   - Pagination dummy
 * ============================================================= */
(function () {
  'use strict';

  /* =============================================================
   * 1. DATA DUMMY MEMBER
   * ============================================================= */
  var MEMBERS = [
    { id: 'MB-001234', name: 'Andi Pratama',      phone: '+62 812-3456-7890', email: 'andi.pratama@gmail.com',   status: 'Active',   joined: '2026-01-12', tier: 'Gold',   points: 1250, visits: 48 },
    { id: 'MB-001235', name: 'Sinta Putri',       phone: '+62 813-9876-5432', email: 'sinta.putri@gmail.com',    status: 'Active',   joined: '2026-01-25', tier: 'Silver', points: 780,  visits: 31 },
    { id: 'MB-001236', name: 'Budi Santoso',      phone: '+62 821-4567-8901', email: 'budi.santoso@yahoo.com',   status: 'Inactive', joined: '2026-02-03', tier: 'Bronze', points: 210,  visits: 9 },
    { id: 'MB-001237', name: 'Dewi Lestari',      phone: '+62 857-2233-4455', email: 'dewi.lestari@outlook.com', status: 'Active',   joined: '2026-02-18', tier: 'Gold',   points: 1520, visits: 55 },
    { id: 'MB-001238', name: 'Rizky Ramadhan',    phone: '+62 811-6677-8899', email: 'rizky.ramadhan@gmail.com', status: 'Active',   joined: '2026-03-07', tier: 'Silver', points: 640,  visits: 26 },
    { id: 'MB-001239', name: 'Maya Anggraini',    phone: '+62 812-5544-3322', email: 'maya.anggraini@gmail.com', status: 'Inactive', joined: '2026-03-22', tier: 'Bronze', points: 150,  visits: 6 },
    { id: 'MB-001240', name: 'Joko Saputra',      phone: '+62 856-8899-0011', email: 'joko.saputra@gmail.com',   status: 'Active',   joined: '2026-04-15', tier: 'Silver', points: 890,  visits: 34 },
    { id: 'MB-001241', name: 'Fitri Handayani',   phone: '+62 858-1122-3344', email: 'fitri.handayani@gmail.com',status: 'Active',   joined: '2026-05-02', tier: 'Gold',   points: 1105, visits: 42 }
  ];

  var TOTAL_MEMBERS_LABEL = '1,245';
  var AVATAR_GRADIENTS = [
    'linear-gradient(135deg,#6366F1,#8B5CF6)',
    'linear-gradient(135deg,#10B981,#059669)',
    'linear-gradient(135deg,#F59E0B,#F97316)',
    'linear-gradient(135deg,#EC4899,#DB2777)',
    'linear-gradient(135deg,#0EA5E9,#2563EB)',
    'linear-gradient(135deg,#14B8A6,#0D9488)',
    'linear-gradient(135deg,#8B5CF6,#6D28D9)',
    'linear-gradient(135deg,#EF4444,#DC2626)'
  ];

  var state = {
    search: '',
    status: 'all',
    selected: {},      // { 'MB-001234': true }
    currentId: null,   // member yang sedang dibuka di modal
    pendingStatus: null
  };

  /* =============================================================
   * 2. UTILITAS
   * ============================================================= */
  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $$(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function initials(name) {
    var parts = String(name).trim().split(/\s+/);
    var first = parts[0] ? parts[0][0] : '';
    var last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  function formatDate(iso) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    var parts = String(iso).split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + ' ' + months[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  }

  function gradientFor(index) {
    return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function hasActiveFilter() {
    return state.search.trim() !== '' || state.status !== 'all';
  }

  function getFilteredMembers() {
    var keyword = state.search.trim().toLowerCase();
    return MEMBERS.filter(function (member) {
      var matchStatus = state.status === 'all' || member.status === state.status;
      if (!matchStatus) return false;
      if (!keyword) return true;
      return (
        member.name.toLowerCase().indexOf(keyword) > -1 ||
        member.id.toLowerCase().indexOf(keyword) > -1 ||
        member.phone.replace(/\s|-/g, '').indexOf(keyword.replace(/\s|-/g, '')) > -1 ||
        member.email.toLowerCase().indexOf(keyword) > -1
      );
    });
  }

  /* =============================================================
   * 3. TOAST NOTIFICATION
   * ============================================================= */
  var TOAST_ICONS = {
    success: 'circle-check',
    info: 'info',
    warning: 'clock',
    error: 'circle-x'
  };

  function showToast(title, message, type) {
    var container = $('#toastContainer');
    if (!container) return;

    type = type || 'info';

    var toast = document.createElement('div');
    toast.className = 'toast pointer-events-auto';
    toast.setAttribute('data-type', type);
    toast.setAttribute('role', 'status');
    toast.innerHTML =
      '<span class="toast-icon"><i data-lucide="' + (TOAST_ICONS[type] || 'info') + '" class="h-4 w-4"></i></span>' +
      '<div class="min-w-0 flex-1">' +
        '<p class="text-[13px] font-extrabold leading-tight text-slate-800">' + escapeHtml(title) + '</p>' +
        '<p class="mt-1 text-[12px] leading-snug text-slate-500">' + escapeHtml(message) + '</p>' +
      '</div>' +
      '<button type="button" class="toast-close grid h-6 w-6 flex-none place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Tutup notifikasi">' +
        '<i data-lucide="x" class="h-3.5 w-3.5"></i>' +
      '</button>';

    container.appendChild(toast);
    refreshIcons();

    var removed = false;
    function remove() {
      if (removed) return;
      removed = true;
      toast.classList.add('is-leaving');
      window.setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 240);
    }

    var closeBtn = $('.toast-close', toast);
    if (closeBtn) closeBtn.addEventListener('click', remove);
    window.setTimeout(remove, 4500);
  }

  /* =============================================================
   * 4. SIDEBAR & NAVIGASI
   * ============================================================= */
  function initSidebar() {
    var sidebar = $('#adminSidebar');
    var overlay = $('#sidebarOverlay');
    var openBtn = $('#sidebarToggle');
    var closeBtn = $('#sidebarClose');

    function openSidebar() {
      if (!sidebar) return;
      sidebar.classList.remove('-translate-x-full');
      if (overlay) overlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
      if (!sidebar) return;
      sidebar.classList.add('-translate-x-full');
      if (overlay) overlay.classList.add('hidden');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024) {
        if (overlay) overlay.classList.add('hidden');
        document.body.style.overflow = '';
        if (sidebar) sidebar.classList.remove('-translate-x-full');
      }
    });

    // Menu aktif
    $$('.nav-item[data-nav]').forEach(function (item) {
      item.addEventListener('click', function () {
        $$('.nav-item[data-nav]').forEach(function (el) { el.classList.remove('is-active'); });
        item.classList.add('is-active');
        closeSidebar();
      });
    });
  }

  /* =============================================================
   * 5. MENU UNDER MAINTENANCE (Phase 2)
   * ============================================================= */
  function initSoonMenus() {
    $$('[data-soon]').forEach(function (el) {
      el.addEventListener('click', function () {
        var feature = el.getAttribute('data-soon') || 'Fitur';
        showToast(feature, 'Fitur ini sedang dalam pengembangan (Phase 2).', 'warning');
      });
    });
  }

  /* =============================================================
   * 6. HEADER: SEARCH GLOBAL, DROPDOWN, NOTIFIKASI
   * ============================================================= */
  function closeAllDropdowns(except) {
    $$('.dropdown-menu.is-open').forEach(function (menu) {
      if (menu !== except) {
        menu.classList.remove('is-open');
        var trigger = menu.parentNode ? $('.dropdown-trigger', menu.parentNode) : null;
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function setupDropdown(triggerId, menuId) {
    var trigger = document.getElementById(triggerId);
    var menu = document.getElementById(menuId);
    if (!trigger || !menu) return;

    trigger.classList.add('dropdown-trigger');

    trigger.addEventListener('click', function (event) {
      event.stopPropagation();
      var willOpen = !menu.classList.contains('is-open');
      closeAllDropdowns(menu);
      menu.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    menu.addEventListener('click', function (event) { event.stopPropagation(); });
  }

  function initHeader() {
    setupDropdown('dateRangeBtn', 'dateRangeMenu');
    setupDropdown('bellBtn', 'bellMenu');

    document.addEventListener('click', function () { closeAllDropdowns(); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeAllDropdowns();
    });

    // Date range picker (dummy)
    $$('[data-range]').forEach(function (item) {
      item.addEventListener('click', function () {
        var range = item.getAttribute('data-range');
        var label = $('#dateRangeLabel');
        if (label) label.textContent = range;
        $$('[data-range]').forEach(function (el) { el.classList.remove('is-selected'); });
        item.classList.add('is-selected');
        closeAllDropdowns();
        showToast('Rentang tanggal', 'Filter laporan diubah ke "' + range + '".', 'success');
      });
    });

    // Notifikasi
    var bellBtn = $('#bellBtn');
    if (bellBtn) {
      bellBtn.addEventListener('click', function () {
        var dot = $('.notification-dot', bellBtn);
        if (dot) dot.style.display = 'none';
      });
    }
    $$('[data-toast]').forEach(function (item) {
      item.addEventListener('click', function () {
        closeAllDropdowns();
        showToast('Notifikasi', item.getAttribute('data-toast'), 'info');
      });
    });

    // Search bar global -> filter tabel member
    var globalSearch = $('#globalSearch');
    var tableSearch = $('#memberSearch');

    if (globalSearch) {
      globalSearch.addEventListener('input', function () {
        state.search = globalSearch.value;
        if (tableSearch) tableSearch.value = globalSearch.value;
        renderTable();
      });
      globalSearch.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          scrollToTable();
        }
      });
    }

    // Shortcut Ctrl/Cmd + K
    document.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 'k') {
        event.preventDefault();
        var target = globalSearch && globalSearch.offsetParent !== null ? globalSearch : tableSearch;
        if (target) {
          target.focus();
          target.select();
          if (target === tableSearch) scrollToTable();
        }
      }
    });

    var mobileSearchBtn = $('#mobileSearchBtn');
    if (mobileSearchBtn) {
      mobileSearchBtn.addEventListener('click', function () {
        scrollToTable();
        if (tableSearch) window.setTimeout(function () { tableSearch.focus(); }, 420);
      });
    }
  }

  function scrollToTable() {
    var section = $('#memberTable');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* =============================================================
   * 7. TABEL MANAJEMEN MEMBER
   * ============================================================= */
  function statusBadge(status) {
    return status === 'Active'
      ? '<span class="badge-status badge-active"><span class="dot"></span>Active</span>'
      : '<span class="badge-status badge-inactive"><span class="dot"></span>Inactive</span>';
  }

  function rowTemplate(member, index) {
    var checked = state.selected[member.id] ? 'checked' : '';
    return '' +
      '<tr data-id="' + escapeHtml(member.id) + '"' + (state.selected[member.id] ? ' class="is-selected"' : '') + '>' +
        '<td>' +
          '<input type="checkbox" class="row-check h-4 w-4 rounded border-slate-300" data-id="' + escapeHtml(member.id) + '" aria-label="Pilih ' + escapeHtml(member.name) + '" ' + checked + ' />' +
        '</td>' +
        '<td class="font-bold text-slate-700">' + escapeHtml(member.id) + '</td>' +
        '<td>' +
          '<div class="flex items-center gap-3">' +
            '<span class="member-avatar" style="background:' + gradientFor(index) + '">' + escapeHtml(initials(member.name)) + '</span>' +
            '<span class="min-w-0">' +
              '<span class="block font-bold text-slate-800">' + escapeHtml(member.name) + '</span>' +
              '<span class="block text-[11px] font-semibold text-slate-400">' + escapeHtml(member.tier) + ' Member</span>' +
            '</span>' +
          '</div>' +
        '</td>' +
        '<td class="whitespace-nowrap font-medium tabular-nums text-slate-600">' + escapeHtml(member.phone) + '</td>' +
        '<td class="text-slate-600">' + escapeHtml(member.email) + '</td>' +
        '<td>' + statusBadge(member.status) + '</td>' +
        '<td class="whitespace-nowrap font-medium text-slate-600">' + formatDate(member.joined) + '</td>' +
        '<td class="text-right">' +
          '<button type="button" class="btn-row js-detail" data-id="' + escapeHtml(member.id) + '">' +
            '<i data-lucide="pencil" class="h-3.5 w-3.5"></i> Detail / Edit' +
          '</button>' +
        '</td>' +
      '</tr>';
  }

  function renderTable() {
    var tbody = $('#memberTableBody');
    if (!tbody) return;

    var rows = getFilteredMembers();
    tbody.innerHTML = rows.map(rowTemplate).join('');

    var emptyState = $('#emptyState');
    var tableWrap = tbody.closest ? tbody.closest('.fx-scroll') : null;
    if (emptyState) emptyState.classList.toggle('hidden', rows.length !== 0);
    if (tableWrap) tableWrap.classList.toggle('hidden', rows.length === 0);

    var info = $('#tableInfo');
    if (info) {
      info.textContent = hasActiveFilter()
        ? 'Showing 1-' + rows.length + ' of ' + MEMBERS.length + ' members (filtered)'
        : 'Showing 1-' + MEMBERS.length + ' of ' + TOTAL_MEMBERS_LABEL + ' members';
    }

    bindRowEvents();
    syncSelectAll(rows);
    renderSelectionChip();
    refreshIcons();
  }

  function bindRowEvents() {
    $$('.js-detail').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(btn.getAttribute('data-id'));
      });
    });

    $$('.row-check').forEach(function (checkbox) {
      checkbox.addEventListener('change', function () {
        var id = checkbox.getAttribute('data-id');
        if (checkbox.checked) state.selected[id] = true;
        else delete state.selected[id];

        var row = checkbox.closest('tr');
        if (row) row.classList.toggle('is-selected', checkbox.checked);
        syncSelectAll(getFilteredMembers());
        renderSelectionChip();
      });
    });
  }

  function syncSelectAll(visibleRows) {
    var selectAll = $('#selectAll');
    if (!selectAll) return;
    var visibleIds = visibleRows.map(function (m) { return m.id; });
    var selectedVisible = visibleIds.filter(function (id) { return state.selected[id]; }).length;
    selectAll.checked = visibleIds.length > 0 && selectedVisible === visibleIds.length;
    selectAll.indeterminate = selectedVisible > 0 && selectedVisible < visibleIds.length;
  }

  function renderSelectionChip() {
    var count = Object.keys(state.selected).length;
    var chip = $('#selectedChip');
    var label = $('#selectedCount');
    if (label) label.textContent = String(count);
    if (chip) chip.classList.toggle('hidden', count === 0);
  }

  function initTableControls() {
    var searchInput = $('#memberSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.search = searchInput.value;
        var globalSearch = $('#globalSearch');
        if (globalSearch) globalSearch.value = searchInput.value;
        renderTable();
      });
    }

    var statusFilter = $('#statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', function () {
        state.status = statusFilter.value;
        renderTable();
      });
    }

    var selectAll = $('#selectAll');
    if (selectAll) {
      selectAll.addEventListener('change', function () {
        getFilteredMembers().forEach(function (member) {
          if (selectAll.checked) state.selected[member.id] = true;
          else delete state.selected[member.id];
        });
        renderTable();
      });
    }

    var clearSelection = $('#clearSelection');
    if (clearSelection) {
      clearSelection.addEventListener('click', function () {
        state.selected = {};
        renderTable();
      });
    }

    // Pagination dummy
    $$('.page-btn[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var page = btn.getAttribute('data-page');
        if (page === '1') return;
        $$('.page-btn[data-page]').forEach(function (el) { el.classList.remove('is-active'); });
        if (page !== 'next') btn.classList.add('is-active');
        showToast('Pagination', 'Halaman ' + (page === 'next' ? 'berikutnya' : page) + ' hanya tampil sebagai preview (data dummy, Phase 2).', 'info');
      });
    });

    var refreshBtn = $('#btnRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        renderTable();
        showToast('Data diperbarui', 'Ringkasan dashboard berhasil dimuat ulang.', 'success');
      });
    }
  }

  /* =============================================================
   * 8. EXPORT EXCEL (SheetJS)
   * ============================================================= */
  function exportToExcel() {
    if (typeof XLSX === 'undefined') {
      showToast('Export gagal', 'Library SheetJS belum termuat. Periksa koneksi internet Anda.', 'error');
      return;
    }

    var rows = getFilteredMembers();
    if (!rows.length) {
      showToast('Export gagal', 'Tidak ada data member untuk diexport.', 'error');
      return;
    }

    var header = [
      'Member ID', 'Nama Member', 'No. Handphone', 'Email',
      'Status', 'Tanggal Bergabung', 'Tier', 'Poin Loyalty', 'Total Kunjungan'
    ];

    var data = [header].concat(rows.map(function (m) {
      return [m.id, m.name, m.phone, m.email, m.status, formatDate(m.joined), m.tier, m.points, m.visits];
    }));

    var worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 13 }, { wch: 22 }, { wch: 20 }, { wch: 30 },
      { wch: 11 }, { wch: 17 }, { wch: 9 }, { wch: 12 }, { wch: 14 }
    ];

    var workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Member');
    XLSX.writeFile(workbook, 'Data_Member_Fascinosa.xlsx');

    showToast(
      'Export Excel berhasil',
      rows.length + ' data member tersimpan sebagai Data_Member_Fascinosa.xlsx',
      'success'
    );
  }

  /* =============================================================
   * 9. MODAL DETAIL / EDIT MEMBER
   * ============================================================= */
  function findMember(id) {
    for (var i = 0; i < MEMBERS.length; i++) {
      if (MEMBERS[i].id === id) return MEMBERS[i];
    }
    return null;
  }

  function modalTemplate(member) {
    var gradient = AVATAR_GRADIENTS[MEMBERS.indexOf(member) % AVATAR_GRADIENTS.length];
    return '' +
      '<div class="flex items-start gap-4 border-b border-[#E5E7EB] p-5 sm:p-6">' +
        '<span class="member-avatar h-14 w-14 text-base" style="background:' + gradient + '">' + escapeHtml(initials(member.name)) + '</span>' +
        '<div class="min-w-0 flex-1">' +
          '<p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Detail Member</p>' +
          '<h3 id="modalTitle" class="mt-0.5 truncate text-lg font-extrabold tracking-tight text-slate-900">' + escapeHtml(member.name) + '</h3>' +
          '<div class="mt-1.5 flex flex-wrap items-center gap-2">' +
            '<span class="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-600">' + escapeHtml(member.id) + '</span>' +
            statusBadge(member.status) +
          '</div>' +
        '</div>' +
        '<button type="button" class="grid h-9 w-9 flex-none place-items-center rounded-lg border border-[#E5E7EB] text-slate-500 transition hover:bg-slate-50 hover:text-slate-700" data-close-modal aria-label="Tutup modal">' +
          '<i data-lucide="x" class="h-4 w-4"></i>' +
        '</button>' +
      '</div>' +

      '<div class="space-y-5 p-5 sm:p-6">' +
        '<div class="grid gap-3 sm:grid-cols-2">' +
          '<dl class="info-tile"><dt>No. Handphone</dt><dd>' + escapeHtml(member.phone) + '</dd></dl>' +
          '<dl class="info-tile"><dt>Email</dt><dd>' + escapeHtml(member.email) + '</dd></dl>' +
          '<dl class="info-tile"><dt>Tanggal Bergabung</dt><dd>' + formatDate(member.joined) + '</dd></dl>' +
          '<dl class="info-tile"><dt>Tier Keanggotaan</dt><dd>' + escapeHtml(member.tier) + '</dd></dl>' +
          '<dl class="info-tile"><dt>Poin Loyalty</dt><dd>' + member.points.toLocaleString('id-ID') + ' pts</dd></dl>' +
          '<dl class="info-tile"><dt>Total Kunjungan</dt><dd>' + member.visits + 'x transaksi</dd></dl>' +
        '</div>' +

        '<div class="rounded-xl border border-[#E5E7EB] bg-white p-4">' +
          '<p class="text-[13px] font-extrabold text-slate-800">Ubah Status Keanggotaan</p>' +
          '<p class="mt-0.5 text-[12px] text-slate-500">Pilih status baru untuk member ini, lalu simpan perubahan.</p>' +
          '<div class="mt-3 grid gap-3 sm:grid-cols-2">' +
            '<button type="button" class="status-option' + (member.status === 'Active' ? ' is-selected' : '') + '" data-status="Active">' +
              '<span class="radio"></span>' +
              '<span>' +
                '<span class="block text-[13px] font-extrabold text-slate-800">Active</span>' +
                '<span class="block text-[11px] font-medium text-slate-500">Member aktif & dapat transaksi</span>' +
              '</span>' +
            '</button>' +
            '<button type="button" class="status-option' + (member.status === 'Inactive' ? ' is-selected' : '') + '" data-status="Inactive">' +
              '<span class="radio"></span>' +
              '<span>' +
                '<span class="block text-[13px] font-extrabold text-slate-800">Inactive</span>' +
                '<span class="block text-[11px] font-medium text-slate-500">Nonaktif / perlu re-engagement</span>' +
              '</span>' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">' +
          '<button type="button" class="btn-ghost" data-close-modal>Tutup</button>' +
          '<button type="button" class="btn-primary" id="btnSaveStatus">' +
            '<i data-lucide="save" class="h-4 w-4"></i> Simpan Perubahan' +
          '</button>' +
        '</div>' +
      '</div>';
  }

  function openModal(id) {
    var member = findMember(id);
    var modal = $('#memberModal');
    var content = $('#modalContent');
    if (!member || !modal || !content) return;

    state.currentId = id;
    state.pendingStatus = member.status;

    content.innerHTML = modalTemplate(member);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    refreshIcons();

    // Pilih status
    $$('.status-option', content).forEach(function (option) {
      option.addEventListener('click', function () {
        state.pendingStatus = option.getAttribute('data-status');
        $$('.status-option', content).forEach(function (el) { el.classList.remove('is-selected'); });
        option.classList.add('is-selected');
      });
    });

    // Simpan
    var saveBtn = $('#btnSaveStatus', content);
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var current = findMember(state.currentId);
        if (!current) return;

        if (current.status === state.pendingStatus) {
          showToast('Tidak ada perubahan', 'Status member "' + current.name + '" tetap ' + current.status + '.', 'info');
          closeModal();
          return;
        }

        current.status = state.pendingStatus;
        renderTable();
        closeModal();
        showToast(
          'Status diperbarui',
          current.name + ' sekarang berstatus ' + current.status + '.',
          'success'
        );
      });
    }

    // Tutup
    $$('[data-close-modal]', modal).forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    var closeBtn = $('[data-close-modal]', content);
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    var modal = $('#memberModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    state.currentId = null;
    state.pendingStatus = null;
  }

  function initModal() {
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        var modal = $('#memberModal');
        if (modal && !modal.classList.contains('hidden')) closeModal();
      }
    });
  }

  /* =============================================================
   * 10. GRAFIK (Chart.js)
   * ============================================================= */
  function initChart() {
    var canvas = document.getElementById('growthChart');
    if (!canvas || typeof Chart === 'undefined') return;

    var labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
    var values = [18, 24, 21, 32, 27, 35, 41, 38, 46, 32];
    var target = labels.map(function () { return 30; });

    Chart.defaults.font.family = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";
    Chart.defaults.font.size = 12;

    var areaGradient = function (context) {
      var chart = context.chart;
      var ctx = chart.ctx;
      var area = chart.chartArea;
      if (!area) return 'rgba(79,70,229,0.15)';
      var gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
      gradient.addColorStop(0, 'rgba(79, 70, 229, 0.30)');
      gradient.addColorStop(0.6, 'rgba(79, 70, 229, 0.08)');
      gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
      return gradient;
    };

    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Member Baru',
            data: values,
            borderColor: '#4F46E5',
            borderWidth: 2.5,
            backgroundColor: areaGradient,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#4F46E5',
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 3
          },
          {
            label: 'Target 30 / bulan',
            data: target,
            borderColor: '#CBD5E1',
            borderWidth: 2,
            borderDash: [6, 6],
            fill: false,
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F172A',
            titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' },
            padding: 12,
            cornerRadius: 10,
            displayColors: true,
            boxPadding: 4,
            callbacks: {
              title: function (items) {
                return items.length ? items[0].label + ' 2026' : '';
              },
              label: function (context) {
                return ' ' + context.dataset.label + ': ' + context.parsed.y + ' member';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#94A3B8', font: { weight: '600', size: 11 } }
          },
          y: {
            beginAtZero: true,
            suggestedMax: 50,
            grid: { color: '#F1F5F9', drawTicks: false },
            border: { display: false, dash: [4, 4] },
            ticks: {
              color: '#94A3B8',
              padding: 8,
              stepSize: 10,
              font: { weight: '600', size: 11 },
              callback: function (value) { return value + (value === 0 ? '' : ''); }
            }
          }
        }
      }
    });
  }

  /* =============================================================
   * 11. INIT
   * ============================================================= */
  function init() {
    // Guard tambahan: pastikan sesi valid sebelum render
    if (window.FascinosaAuth && !window.FascinosaAuth.getSession()) {
      window.FascinosaAuth.requireAuth();
      return;
    }

    initSidebar();
    initSoonMenus();
    initHeader();
    initTableControls();
    initModal();

    var exportBtn = $('#btnExportExcel');
    if (exportBtn) exportBtn.addEventListener('click', exportToExcel);

    renderTable();
    initChart();
    refreshIcons();

    // Sapaan pembuka
    window.setTimeout(function () {
      showToast('Selamat datang 👋', 'Anda masuk sebagai Admin Toko · FASCINOSA.', 'success');
    }, 700);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
