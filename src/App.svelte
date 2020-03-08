<script>
	import { CV } from './data/cv.js'
	
	import Assignment from './Assignment.svelte'
  import Position from './Position.svelte'
	
	const sortDelegate = (a, b) => {
		if (a.meta.start > b.meta.start) {
			return -1
		}

		if (a.meta.start < b.meta.start) {
			return 1
		}
		
		return 0
	}

	// Order assignments and positions by start year.
	CV.Assignments.sort((x, y) => sortDelegate(x, y))
	CV.Positions.sort((x, y) => sortDelegate(x, y))

	const assignments = CV.Assignments.filter(a => a.meta.origin !== 'Volunteer')
	const volunteerAssignments = CV.Assignments.filter(a => a.meta.origin === 'Volunteer')
</script>

<main>
  <h1>alexander czigler</h1>
  <h2>Curriculum Vitae</h2>

	<h3>Introduction</h3>
	<hr />
	<p>
		We are at the golden age of team efficiency. I firmly believe that companies who want to thrive in the future need to make their employees experts at cooperation and autonomy.
	</p>
	<p>
		This is where I come in; I love using my technical experience to help improve the culture and way of working. My specialty is meshing into existing teams and taking a blended role helping out where I am needed most from day to day; be it pair-programming, agile coaching or UX research.
	</p>
	<p>
		My long background as a system developer has given me a lot of insights as to why so many IT projects fail. I am a great addition to any team that wants to identify bottlenecks, have fun and learn the ways of DevOps Thinking and Lean UX.
	</p>

	<h3>Positions</h3>
	<hr />
  {#each CV.Positions as position}
    <Position position={position} />
  {/each}

	<h3>Assignments</h3>
	<hr />
  {#each assignments as assignment}
    <Assignment assignment={assignment} />
  {/each}

	<h3>Volunteering</h3>
	<hr />
  {#each volunteerAssignments as assignment}
    <Assignment assignment={assignment} />
  {/each}

	<h3 class="noprint">Links</h3>
	<hr class="noprint" />
	<ul class="noprint">
		{#each CV.Links as link}
			<li>
				<a href="{link.url}">{link.title}</a>
			</li>	
		{/each}
	</ul>

	<h3 class="noprint">Information</h3>
	<hr class="noprint" />
	<p class="noprint">
		Thank you for reading my CV!<br />
		If you wish to get in touch with me, send me a text message on +46727145060.
	</p>
	<p class="noprint">
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