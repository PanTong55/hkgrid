export function setupSidebarCombos(container = document) {
  const selects = container.querySelectorAll('.filter-content select');
  selects.forEach((select) => replaceSelectWithCombo(select));
}

function replaceSelectWithCombo(select) {
  // clear any default selection so button shows "Select"
  select.selectedIndex = -1;
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
    const value = li.dataset.value;
    const option = select.querySelector(`option[value="${CSS.escape(value)}"]`);
    const allLi = list.querySelector('li[data-value=""]');
    const allOption = select.querySelector('option[value=""]');

    if (value === '') {
      list.querySelectorAll('li').forEach((other) => {
        if (other !== li) {
          other.classList.remove('selected');
          const opt = select.querySelector(`option[value="${CSS.escape(other.dataset.value)}"]`);
          if (opt) opt.selected = false;
        }
      });
      li.classList.add('selected');
      if (allOption) allOption.selected = true;
    } else {
      if (allLi) allLi.classList.remove('selected');
      if (allOption) allOption.selected = false;

      li.classList.toggle('selected');
      option.selected = li.classList.contains('selected');
    }
    updateToggleText();
    select.dispatchEvent(new Event('change'));
  });

  select.addEventListener('change', updateToggleText);

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
