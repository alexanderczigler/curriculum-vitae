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
    My career is characterized by diversity and learning. I have had the
    opportunity to work on several different projects and taking on different
    roles in many of them. Each one has taught me something valuable and I have
    met a lot of intelligent and inspiring people along the way.
  </p>
  <p>
    Some of my current goals in life include learning more about mentoring,
    group psychology and interview technique. From my experience, in order for
    an IT project to succeed, team members need to have empathy and experience
    connectedness with each other as well as the end users of their product.
    This is the reason why I love to keep writing code while also being
    passionate about learning about the key to creating successful teams,
    sharing knowledge and understanding users.
  </p>

  <p>To sum up, I have two firm beliefs about software development:</p>
  <ol>

    <li>
      The best code is written by developers who empathize with the end user.
    </li>
    <li>
      Complex problems are best solved by developers who master cooperation and
      the sharing of knowledge.
    </li>
  </ol>

  <p class="web">
    You can some of my work on
    <a href="https://github.com/alexanderczigler" target="_blank">
      <i class="fa fa-github" />
      GitHub
    </a>
    and
    <a href="https://hub.docker.com/u/aczigler" target="_blank">
      <i class="fab fa-docker" />
      Docker Hub
    </a>
  </p>

  <h4>Positions</h4>
  {#each CV.Positions as position}
    <Position {position} />
  {/each}

  <h4>Projects</h4>
  {#each CV.Assignments as assignment}
    <Assignment {assignment} />
  {/each}

  <h3>Other information</h3>
  <p>
    I am a Swedish citizen and my native tounge is Swedish. I may be available
    for consultancy assignments. If you wish to get in touch with me, I prefer
    if you send me a text message on +46727145060.
  </p>
  <p class="web">
    Hint: I have added a print css so that you can save my CV as a PDF (or print
    it) via your regular printing dialogue.
  </p>
</div>
