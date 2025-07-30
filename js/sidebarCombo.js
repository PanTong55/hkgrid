export function setupSidebarCombos(container = document) {
  const selects = container.querySelectorAll('.filter-content select');
  selects.forEach((select) => replaceSelectWithCombo(select));
}

export function rebuildSidebarCombos(container = document) {
  const selects = container.querySelectorAll('.filter-content select');
  selects.forEach((select) => {
    const next = select.nextElementSibling;
    if (next && next.classList.contains('sidebar-combo')) {
      next.remove();
    }
  });
  setupSidebarCombos(container);
}

function replaceSelectWithCombo(select) {
  const isSingle = select.hasAttribute('data-single');
  const preserve = select.hasAttribute('data-preserve-default');
  const isScientific = select.id === 'filterGenus' || select.id === 'filterSpecies';
  const NO_ITALIC = ['sp.', 'sp.1', 'sp.2', 'sp.3', 'Unknown', 'All', 'NA'];

  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const formatScientificText = (text) => {
    let formatted = text;
    NO_ITALIC.forEach((token) => {
      const regex = new RegExp(escapeRegExp(token), 'g');
      formatted = formatted.replace(regex, `<span class="no-italic">${token}</span>`);
    });
    return formatted;
  };

  if (!preserve) {
    // clear any default selection so button shows "Select"
    select.selectedIndex = -1;
  }
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
  if (isSingle) {
    searchInput.style.display = 'none';
  }
  dropdown.appendChild(searchInput);

  const list = document.createElement('ul');
  list.className = 'combo-options';

  Array.from(select.options).forEach((opt) => {
    const li = document.createElement('li');
    li.dataset.value = opt.value;
    const text = opt.textContent;
    const italic = isScientific && !NO_ITALIC.some((token) => text.includes(token));
    if (italic) opt.style.fontStyle = 'italic';
    const labelHtml = isScientific
      ? `<span class="combo-label scientific-label">${formatScientificText(text)}</span>`
      : `<span class="combo-label">${text}</span>`;
    li.innerHTML = `<i data-lucide="check" class="combo-check"></i>${labelHtml}`;
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

  if (!isSingle) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.toLowerCase();
      list.querySelectorAll('li').forEach((li) => {
        li.style.display = li.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
    });
  }

  list.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const value = li.dataset.value;
    const option = select.querySelector(`option[value="${CSS.escape(value)}"]`);
    const allLi = list.querySelector('li[data-value=""]');
    const allOption = select.querySelector('option[value=""]');

    if (isSingle) {
      list.querySelectorAll('li').forEach((other) => {
        other.classList.remove('selected');
        const opt = select.querySelector(`option[value="${CSS.escape(other.dataset.value)}"]`);
        if (opt) opt.selected = false;
      });
      li.classList.add('selected');
      option.selected = true;
      combo.classList.remove('open');
    } else if (value === '') {
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
