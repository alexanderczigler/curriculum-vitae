<style>
  div.section {
    background-color: var(--black);
    border-bottom: 8px var(--azure) solid;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: stretch;
  }

  h1 {
    margin-top: 3em;
  }

  h2 {
    margin-top: 0;
  }

  img {
    width: 8em;
    height: 8em;
    display: inline-block;
    border-radius: 50%;
    margin: 1em 2em 1em 1em;
    border: 1px var(--white) solid;
  }

  @media print {
    div.section {
      border-width: 0;
    }

    img {
      border-width: 0;
    }

    h1,
    h2 {
      color: #000000;
    }
  }

  @media (max-width: 640px) {
    div.section {
      display: block;
      text-align: center;
    }

    span {
      text-align: center;
    }

    img {
      margin-top: 4em;
    }

    h1 {
      margin-top: 0;
    }
  }
</style>

<div class="section">
  <img src="avatar-512.png" alt="Alexander" />
  <span>
    <h1>Alexander M. Czigler</h1>
    <h2>
      Working with Code, Culture and UX at
      <span class="weak">at</span>
      Iteam Solutions
    </h2>
  </span>

</div>
