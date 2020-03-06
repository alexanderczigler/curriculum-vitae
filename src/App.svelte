<script>
	import { CV } from './data/cv.js'
	
	import Assignment from './Assignment.svelte'
  import Position from './Position.svelte'
	
	// Order assignments and positions by start year.
	CV.Positions.sort(x => !x.chronology.start)
</script>

<main>
  <h1>alexander czigler</h1>
  <h2>Curriculum Vitae</h2>


	<h3>Positions</h3>
	<hr />
  {#each CV.Positions as position}
    <Position position={position} />
  {/each}

	<h3>Assignments</h3>
	<hr />
  {#each CV.Assignments as assignment}
    <Assignment assignment={assignment} />
  {/each}

	<h3 class="noprint">Information</h3>
	<hr class="noprint" />
	<p class="noprint">
		Thank you for reading my CV!<br />
		If you wish to get in touch with me, send me a text message on +46727145060.
	</p>
	<p>
		Hint: On most computers you can save my CV as a PDF via your regular printing dialogue.
	</p>
</main>

<style>
	main {
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	p {
		margin-left: 10px;
		font-size: 1em;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>