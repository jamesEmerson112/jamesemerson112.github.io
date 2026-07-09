<script lang="ts">
  import {
    searchTerm,
    languageFilter,
    categoryFilter,
    sortBy,
    availableLanguages,
    availableCategories
  } from '../../stores/portfolioStore.ts';

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'lines', label: 'Most Lines' },
    { value: 'complexity', label: 'Most Complex' }
  ];

  function setCategory(category: string) {
    categoryFilter.set(category);
  }
</script>

<div class="search-filter" data-name="SearchFilter">
  <div class="search-box" data-name="SearchFilterDiv1">
    <span class="search-icon" aria-hidden="true" data-name="SearchFilterSpan2">
      <span class="search-circle" data-name="SearchFilterSpan3"></span>
      <span class="search-handle" data-name="SearchFilterSpan21"></span>
    </span>
    <input
      type="text"
      data-name="repo-search"
      placeholder="Search repositories..."
      bind:value={$searchTerm}
      class="search-input"
      aria-label="Search repositories"
    />
    {#if $searchTerm}
      <button
        class="clear-button"
        on:click={() => searchTerm.set('')}
        title="Clear search"
        type="button"
        data-name="repo-search-clear"
      >
        ✕
      </button>
    {/if}
  </div>

  <div class="filter-row" data-name="SearchFilterDiv7">
    {#if $availableCategories.length > 0}
      <div class="category-chips" role="group" aria-label="Category filter" data-name="SearchFilterDiv6">
        <button
          type="button"
          class:active={$categoryFilter === 'all'}
          class="category-chip"
          aria-pressed={$categoryFilter === 'all'}
          data-name="category-all"
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
            data-name={`category-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            on:click={() => setCategory(category)}
          >
            {category}
          </button>
        {/each}
      </div>
    {/if}

    <div class="spacer" data-name="SearchFilterSpacer"></div>

    <div class="filter-group" data-name="SearchFilterDiv8">
      <label for="language-filter" class="filter-label" data-name="SearchFilterLabel9">Language:</label>
      <select id="language-filter" data-name="language-filter" bind:value={$languageFilter} class="filter-select">
        <option value="all" data-name="SearchFilterOption10">All Languages</option>
        {#each $availableLanguages as language}
          <option value={language} data-name="SearchFilterOption11">{language}</option>
        {/each}
      </select>
    </div>

    <div class="filter-group" data-name="SearchFilterDiv12">
      <label for="sort-by" class="filter-label" data-name="SearchFilterLabel13">Sort by:</label>
      <select id="sort-by" data-name="sort-by" bind:value={$sortBy} class="filter-select">
        {#each sortOptions as option}
          <option value={option.value} data-name="SearchFilterOption14">{option.label}</option>
        {/each}
      </select>
    </div>
  </div>
</div>

<style>
  .search-filter {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 34px;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 17px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    pointer-events: none;
  }

  .search-circle {
    position: absolute;
    left: 0;
    top: 3px;
    width: 12px;
    height: 12px;
    border: 1.5px solid var(--text-muted);
    border-radius: 50%;
  }

  .search-handle {
    position: absolute;
    left: 10px;
    top: 14px;
    width: 7px;
    height: 1.5px;
    background: var(--text-muted);
    transform: rotate(45deg);
  }

  .search-input {
    flex: 1;
    width: 100%;
    background: var(--surface-glass);
    border: 1px solid var(--line-1);
    border-radius: 12px;
    padding: 14px 18px 14px 44px;
    color: var(--scene-text);
    font-family: var(--font-mono);
    font-size: 13.5px;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    border-color: color-mix(in srgb, var(--acc) 50%, transparent);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .clear-button {
    position: absolute;
    right: 14px;
    padding: 2px 4px;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 14px;
    cursor: pointer;
  }

  .clear-button:hover {
    color: var(--text-primary);
  }

  .clear-button:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
    border-radius: 4px;
  }

  .filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .category-chips {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .category-chip {
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--mono-tone-3);
    background: transparent;
    border: 1px solid var(--line-1);
    border-radius: 999px;
    padding: 6px 15px;
    cursor: pointer;
    transition: all 0.18s;
    white-space: nowrap;
  }

  .category-chip:hover {
    border-color: color-mix(in srgb, var(--acc) 55%, transparent);
    color: var(--text-primary);
  }

  .category-chip.active {
    background: var(--acc);
    border-color: var(--acc);
    color: #06272a;
  }

  :global([data-light='true']) .category-chip.active {
    color: #ffffff;
  }

  .category-chip:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }

  .spacer {
    flex: 1;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filter-label {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .filter-select {
    background: var(--surface-glass);
    border: 1px solid var(--line-1);
    border-radius: 999px;
    padding: 8px 14px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--mono-tone-2);
    outline: none;
    cursor: pointer;
  }

  .filter-select:hover {
    border-color: color-mix(in srgb, var(--acc) 50%, transparent);
  }

  .filter-select:focus-visible {
    border-color: var(--acc);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }

  @media (max-width: 900px) {
    .spacer {
      display: none;
    }

    .filter-row {
      align-items: stretch;
      flex-direction: column;
    }

    .filter-group {
      justify-content: space-between;
    }

    .filter-select {
      flex: 1;
    }
  }
</style>
