<script>
  export let tag
</script>

<style>
  div {
    background-color: var(--myrtle);
    border-radius: 2px;
    color: var(--white);
    display: inline-block;
    font-family: 'Fira Code', monospace;
    font-size: 0.7em;
    font-weight: 300;
    margin: 2px 4px 2px 0px;
    padding: 4px 8px;
  }

  i {
    color: var(--azure);
  }
</style>

<div>
  <i class="fa fa-tag" />
  {tag}
</div>
