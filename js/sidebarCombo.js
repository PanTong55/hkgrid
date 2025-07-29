export function setupSidebarCombos(container = document) {
  const selects = container.querySelectorAll('.filter-content select');
  selects.forEach((select) => replaceSelectWithCombo(select));
}

function replaceSelectWithCombo(select) {
  const combo = document.createElement('div');
  combo.className = 'sidebar-combo';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'combo-toggle';
  toggle.textContent = 'Select';
  combo.appendChild(toggle);

  const dropdown = document.createElement('div');
  dropdown.className = 'combo-dropdown';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'combo-search';
  searchInput.placeholder = 'Search...';
  dropdown.appendChild(searchInput);

  const list = document.createElement('ul');
  list.className = 'combo-options';

  Array.from(select.options).forEach((opt) => {
    const li = document.createElement('li');
    li.dataset.value = opt.value;
    li.innerHTML = `<i data-lucide="check" class="combo-check"></i><span class="combo-label">${opt.textContent}</span>`;
    if (opt.selected) {
      li.classList.add('selected');
    }
    list.appendChild(li);
  });

  dropdown.appendChild(list);
  combo.appendChild(dropdown);

  select.style.display = 'none';
  select.after(combo);
  lucide.createIcons();

  toggle.addEventListener('click', () => {
    combo.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!combo.contains(e.target)) {
      combo.classList.remove('open');
    }
  });

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase();
    list.querySelectorAll('li').forEach((li) => {
      li.style.display = li.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });

  list.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    li.classList.toggle('selected');
    const option = select.querySelector(`option[value="${CSS.escape(li.dataset.value)}"]`);
    if (li.classList.contains('selected')) {
      option.selected = true;
    } else {
      option.selected = false;
    }
    updateToggleText();
    select.dispatchEvent(new Event('change'));
  });

  function updateToggleText() {
    const selected = list.querySelectorAll('li.selected .combo-label');
    if (selected.length === 0) {
      toggle.textContent = 'Select';
    } else {
      toggle.textContent = Array.from(selected)
        .map((el) => el.textContent)
        .join(', ');
    }
  }

  updateToggleText();
}
