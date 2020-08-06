<script>
  export let assignment
  import Tag from './Tag.svelte'
</script>

<style>
  div.assignment {
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

  span.customer {
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

<div class="assignment">
  <span class="time">
    {assignment.meta.start} &mdash;
    {#if assignment.meta.end}{assignment.meta.end}{/if}
  </span>

  <span class="information">
    <span class="head">
      <span class="customer">{assignment.meta.customer}</span>
      ({assignment.meta.origin} consultant)
    </span>

    {#each assignment.meta.body as text}
      <span class="body">{text}</span>
    {/each}

    <span class="web">
      {#each assignment.tags as tag}
        <Tag {tag} />
      {/each}
    </span>
  </span>
</div>
