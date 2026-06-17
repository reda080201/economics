export function hydrateScenarioSelect(select, groups) {
  if (!select || !Array.isArray(groups) || select.dataset.hydrated === "true") return;
  const currentValue = select.value;
  select.innerHTML = "";
  groups.forEach((group) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.label;
    group.options.forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  });
  if (currentValue && Array.from(select.options).some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }
  select.dataset.hydrated = "true";
}
