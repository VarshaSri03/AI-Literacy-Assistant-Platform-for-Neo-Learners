function Navbar({ onLogin, onRegister, labels }) {

  // `labels` is optional — passed by LandingPage once it knows a returning
  // learner's saved preferred language. Falls back to English so Navbar
  // still works standalone (e.g. if reused elsewhere) without that prop.
  const t = {
    home: "Home",
    how: "How It Works",
    languages: "Languages",
    about: "About",
    login: "Log In",
    getStarted: "Get Started",
    ...labels,
  };

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <nav className="learnly-navbar">

      <div
        className="learnly-logo"
        onClick={() => goTo("home")}
      >
        <div className="learnly-logo-icon">
          📚
        </div>

        <span>Learnly</span>
      </div>


      <div className="learnly-nav-links">

        <button onClick={() => goTo("home")}>
          {t.home}
        </button>

        <button onClick={() => goTo("how-it-works")}>
          {t.how}
        </button>

        <button onClick={() => goTo("languages")}>
          {t.languages}
        </button>

        <button onClick={() => goTo("about")}>
          {t.about}
        </button>

      </div>


      <div className="learnly-nav-actions">

        <button
          className="nav-login"
          onClick={onLogin}
        >
          {t.login}
        </button>

        <button
          className="nav-register"
          onClick={onRegister}
        >
          {t.getStarted}
        </button>

      </div>

    </nav>
  );
}

export default Navbar;
