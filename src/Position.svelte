<script>
  export let position
  import Tag from './Tag.svelte'
</script>

<div class="position">
  <span class="chronology">
    {position.chronology.start} &mdash;
    {#if position.chronology.end}
      {position.chronology.end}
    {/if}
  </span>

  <span class="information">
    <span class="head">
      <span class="title">{position.employment.title}</span> at
      <span class="employer">{position.employment.employer}</span>
    </span>
    
    <span class="body">
      {position.employment.body}
    </span>

    <span>
      {#each position.tags as tag}
        <Tag tag={tag} />
      {/each}
    </span>
  </span>
</div>

<style>
  div.position {
    margin-top: 20px;
    color: rgba(100, 100, 100, 0.6);
    font-size: 1em;
  }

  span.chronology {
    width: 15%;
    display: inline-block;
    text-transform: lowercase;
    font-weight: 100;
    font-style: italic;
    font-size: 1em;
    vertical-align: top;
    padding-left: 10px;
  }

  span.information {
    vertical-align: top;
    width: 60%;
    display: inline-block;
  }

  span.title,
  span.employer {
    font-weight: 600;
    color: rgba(100, 100, 100, 1);
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
</style>