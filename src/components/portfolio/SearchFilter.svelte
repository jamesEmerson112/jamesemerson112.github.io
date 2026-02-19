<script>
  import {
    searchTerm,
    languageFilter,
    categoryFilter,
    sortBy,
    sortOrder,
    availableLanguages,
    availableCategories,
    resetFilters,
    toggleSortOrder
  } from '../../stores/portfolioStore.js';

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'lines', label: 'Lines of Code' },
    { value: 'cost', label: 'Cost (AI)' },
    { value: 'name', label: 'Name' },
    { value: 'updated', label: 'Last Updated' }
  ];

  function setCategory(category) {
    categoryFilter.set(category);
  }
</script>

<div class="search-filter">
  <div class="search-box">
    <span class="search-icon">🔍</span>
    <input
      type="text"
      placeholder="Search repositories..."
      bind:value={$searchTerm}
      class="search-input"
      aria-label="Search repositories"
    />
    {#if $searchTerm}
      <button class="clear-button" on:click={() => searchTerm.set('')} title="Clear search" type="button">
        ✕
      </button>
    {/if}
  </div>

  {#if $availableCategories.length > 0}
    <div class="category-filter" role="group" aria-label="Category filter">
      <span class="category-label">Category:</span>
      <div class="category-chips">
        <button
          type="button"
          class:active={$categoryFilter === 'all'}
          class="category-chip"
          aria-pressed={$categoryFilter === 'all'}
          on:click={() => setCategory('all')}
        >
          All
        </button>
        {#each $availableCategories as category}
          <button
            type="button"
            class:active={$categoryFilter === category}
            class="category-chip"
            aria-pressed={$categoryFilter === category}
            on:click={() => setCategory(category)}
          >
            {category}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="filters">
    <div class="filter-group">
      <label for="language-filter" class="filter-label">Language:</label>
      <select id="language-filter" bind:value={$languageFilter} class="filter-select">
        <option value="all">All Languages</option>
        {#each $availableLanguages as language}
          <option value={language}>{language}</option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="sort-by" class="filter-label">Sort by:</label>
      <select id="sort-by" bind:value={$sortBy} class="filter-select">
        {#each sortOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <button class="sort-toggle" on:click={toggleSortOrder} title="Toggle sort order" type="button">
      {#if $sortOrder === 'desc'}
        <span class="toggle-icon">↓</span>
        <span class="toggle-label">Desc</span>
      {:else}
        <span class="toggle-icon">↑</span>
        <span class="toggle-label">Asc</span>
      {/if}
    </button>

    <button class="reset-button" on:click={resetFilters} title="Reset all filters" type="button">
      <span class="reset-icon">↻</span>
      <span class="reset-label">Reset</span>
    </button>
  </div>
</div>

<style>
  .search-filter {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1.25rem;
    background: var(--surface-panel);
    border: 1px solid var(--surface-border);
    border-radius: 12px;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    font-size: 1rem;
    color: var(--text-muted);
  }

  .search-input {
    flex: 1;
    padding: 0.75rem 3rem;
    background: var(--surface-glass);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    font-size: 0.95rem;
    color: inherit;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .search-input:focus-visible {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .clear-button {
    position: absolute;
    right: 0.9rem;
    padding: 0.15rem;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1rem;
    cursor: pointer;
  }

  .clear-button:hover {
    color: var(--text-primary);
  }

  .clear-button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .category-filter {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .category-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.35rem;
  }

  .category-chips {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .category-chip {
    border: 1px solid var(--chip-neutral-border);
    background: var(--chip-neutral-bg);
    color: var(--text-secondary);
    border-radius: 999px;
    padding: 0.35rem 0.7rem;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
  }

  .category-chip:hover {
    border-color: color-mix(in srgb, var(--accent-primary) 60%, transparent);
    color: var(--text-primary);
  }

  .category-chip.active {
    border-color: var(--chip-active-border);
    background: var(--chip-active-bg);
    color: var(--text-primary);
  }

  .category-chip:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .filters {
    display: flex;
    gap: 0.8rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .filter-label {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .filter-select {
    padding: 0.48rem 0.7rem;
    background: var(--surface-glass);
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    color: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .filter-select:hover {
    border-color: color-mix(in srgb, var(--accent-primary) 50%, transparent);
  }

  .filter-select:focus-visible {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }

  .sort-toggle,
  .reset-button {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.48rem 0.72rem;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid;
  }

  .sort-toggle {
    background: var(--surface-glass);
    border-color: var(--surface-border-strong);
    color: var(--text-secondary);
  }

  .sort-toggle:hover {
    border-color: var(--surface-border-strong);
    color: var(--text-primary);
  }

  .reset-button {
    background: var(--surface-glass);
    border-color: var(--surface-border-strong);
    color: var(--text-secondary);
    margin-left: auto;
  }

  .reset-button:hover {
    border-color: color-mix(in srgb, var(--accent-primary) 60%, transparent);
    color: var(--text-primary);
  }

  .sort-toggle:focus-visible,
  .reset-button:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .toggle-icon,
  .reset-icon {
    font-size: 1rem;
    line-height: 1;
  }

  @media (max-width: 900px) {
    .filters {
      align-items: stretch;
    }

    .filter-group {
      width: 100%;
      justify-content: space-between;
    }

    .filter-select {
      flex: 1;
    }

    .sort-toggle,
    .reset-button {
      width: 100%;
      justify-content: center;
      margin-left: 0;
    }
  }
</style>
