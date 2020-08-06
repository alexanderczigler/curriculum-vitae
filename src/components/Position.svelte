<script>
  export let position
  import Tag from './Tag.svelte'
</script>

<style>
  div.position {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: stretch;
  }

  span.time {
    color: var(--myrtle);
    font-weight: 100;
    vertical-align: top;
    width: 10em;
  }

  span.information {
    vertical-align: top;
    width: 100%;
    margin-bottom: 2em;
  }

  span.title,
  span.employer {
    font-weight: 600;
    color: var(--black);
  }

  span.head {
    width: 100%;
    padding-bottom: 10px;
    display: block;
  }

  span.body {
    width: 100%;
    padding-bottom: 10px;
    display: block;
  }

  @media print {
    span.information {
      margin-bottom: 0.5em;
    }

    span.time {
      color: #000000;
    }
  }
</style>

<div class="position">
  <span class="time">
    {position.meta.start} &mdash;
    {#if position.meta.end}{position.meta.end}{/if}
  </span>

  <span class="information">
    <span class="head">
      <span class="title">{position.meta.title}</span>
      at
      <span class="employer">{position.meta.employer}</span>
    </span>

    <span class="body">{position.meta.body}</span>

    <span class="web">
      {#each position.tags as tag}
        <Tag {tag} />
      {/each}
    </span>
  </span>
</div>
