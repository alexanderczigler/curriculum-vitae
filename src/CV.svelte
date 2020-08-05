<script>
  import { CV } from './data/cv.js'

  import Assignment from './components/Assignment.svelte'
  import Position from './components/Position.svelte'

  const sortDelegate = (a, b) => {
    let aa = a.meta.start + (a.meta.end - a.meta.start) / 10
    let bb = b.meta.start + (b.meta.end - b.meta.start) / 10

    if (aa > bb) {
      return -1
    }

    if (aa < bb) {
      return 1
    }

    return 0
  }

  // Order assignments and positions by start year.
  CV.Assignments.sort((x, y) => sortDelegate(x, y))
</script>

<div class="section body">
  <h3>Curriculum Vitae</h3>

  <p>
    My career is characterized by learning and diversity. I have had the
    opportunity to work on several different projects and taking on different
    roles in many of them. Each one has taught me something and I have met a lot
    of intelligent and inspiring people along the way, enabling me to learn and
    grow as a consultant and as a person.
  </p>

  <p>
    My current goals are learning more about mentoring, group psychology and
    interview technique. I want to take on more assignments in the role of agile
    coach and also further explore UX Research.
  </p>

  <p>I have two firm beliefs:</p>
  <ol>

    <li>
      Developers need to be able to emphatize with their end users to be able to
      produce the best code.
    </li>
    <li>
      Developers need to be able to write code together to solve the problems of
      tomorrow.
    </li>
  </ol>

  <h4>Positions</h4>
  {#each CV.Positions as position}
    <Position {position} />
  {/each}

  <h4>Projects</h4>
  {#each CV.Assignments as assignment}
    <Assignment {assignment} />
  {/each}

  <h3 class="no-print">Thank you!</h3>
  <p class="no-print">Thank you for reading my CV.</p>
  <p class="no-print">
    Hint: On most computers you can save my CV as a PDF via your regular
    printing dialogue.
  </p>
</div>
