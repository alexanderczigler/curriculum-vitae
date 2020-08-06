<script>
  import CV from './CV.svelte'
  import Header from './Header.svelte'
  import Footer from './Footer.svelte'
  import Introduction from './Introduction.svelte'
</script>

<style>
  main {
    background-color: var(--white);
    box-shadow: 0 4px 8px 0 var(--myrtle), 0 6px 20px 0 var(--myrtle);
    max-width: 1000px;
    padding-bottom: 2em;
  }
</style>

<main>
  <Header />
  <Introduction />
  <CV />
  <Footer />
</main>
