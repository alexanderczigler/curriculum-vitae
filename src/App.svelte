<script>
  import CV from './CV.svelte'
  import Header from './Header.svelte'
  import Introduction from './Introduction.svelte'
</script>

<style>
  main {
    background-color: var(--white);
    border-radius: 3px;
    max-width: 240px;
    padding-bottom: 2em;
  }

  @media (min-width: 640px) {
    main {
      max-width: 1000px;
      box-shadow: 0 4px 8px 0 var(--myrtle), 0 6px 20px 0 var(--myrtle);
    }
  }
</style>

<main>
  <Header />
  <Introduction />
  <CV />
</main>
