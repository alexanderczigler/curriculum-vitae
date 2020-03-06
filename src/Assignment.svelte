<script>
  export let assignment
  import Tag from './Tag.svelte'
</script>

<div class="assignment">
  <span class="chronology">
    {assignment.meta.start} &mdash;
    {#if assignment.meta.end}
      {assignment.meta.end}
    {/if}
  </span>

  <span class="information">
    <span class="head">
      <span class="customer">{assignment.meta.customer}</span> ({assignment.meta.origin} consultant)
    </span>
    
    <span class="body">
      {assignment.meta.body}
    </span>

    <span>
      {#each assignment.tags as tag}
        <Tag tag={tag} />
      {/each}
    </span>
  </span>
</div>

<style>
  div.assignment {
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

  span.customer {
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