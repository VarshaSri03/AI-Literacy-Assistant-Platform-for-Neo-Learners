import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { getSavedPreferredLanguage, getUiStrings } from "./personalization";

function LandingPage({ onLogin, onRegister }) {
  // If this browser has a saved preferred language from an earlier visit
  // (registration or login), greet the returning learner in it — at least
  // for the navigation, which is the one piece of the marketing page every
  // visitor actually reads. The rest of the marketing copy below stays in
  // English by design: machine-translating persuasive/marketing prose
  // tends to read awkwardly, whereas short nav labels translate cleanly.
  const [navLabels, setNavLabels] = useState(null);

  useEffect(() => {
    const saved = getSavedPreferredLanguage();
    if (!saved || saved === "English") return;
    let cancelled = false;
    getUiStrings(saved).then((ui) => {
      if (!cancelled) {
        setNavLabels({
          home: ui.navHome,
          how: ui.navHow,
          languages: ui.navLanguages,
          about: ui.navAbout,
          login: ui.navLogin,
          getStarted: ui.navGetStarted,
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="landing-page">

      <Navbar
        onLogin={onLogin}
        onRegister={onRegister}
        labels={navLabels}
      />

      {/* HERO */}
      <section className="landing-hero" id="home">

        <div className="landing-hero-content">

          <div className="landing-badge">
            ✨ Learning made fun
          </div>

          <h1>
            Learn.
            <br />
            Practice.
            <br />
            <span>Grow.</span>
          </h1>

          <p>
            Learn reading, writing and vocabulary through
            fun, interactive and personalized lessons.
          </p>

          <div className="landing-buttons">

            <button
              className="start-learning-btn"
              onClick={onRegister}
            >
              Start Learning
              <span>→</span>
            </button>

            <button
              className="already-account-btn"
              onClick={onLogin}
            >
              I already have an account
            </button>

          </div>

          <div className="landing-stats">

            <div>
              <strong>🔥 7</strong>
              <span>Day Streak</span>
            </div>

            <div>
              <strong>⭐ XP</strong>
              <span>Earn Rewards</span>
            </div>

            <div>
              <strong>🏆</strong>
              <span>Achievements</span>
            </div>

          </div>

        </div>


        {/* RIGHT SIDE */}
        <div className="landing-illustration">

          <div className="landing-circle"></div>

          <div className="learning-character">
            🦉

            <div className="character-bubble">
              <strong>Let's Learn!</strong>
              <span>Your journey starts here 🎉</span>
            </div>
          </div>

          <div className="floating-learning-card language-card-float">
            🌍
            <div>
              <strong>6 Languages</strong>
              <small>Choose your language</small>
            </div>
          </div>

          <div className="floating-learning-card streak-card-float">
            🔥
            <div>
              <strong>Build a streak</strong>
              <small>Learn every day</small>
            </div>
          </div>

          <div className="landing-star star-one">
            ⭐
          </div>

          <div className="landing-star star-two">
            ✨
          </div>

        </div>

      </section>


      {/* WHY LEARNLY */}
      <section className="landing-features">

        <div className="landing-heading">

          <span>WHY LEARNLY?</span>

          <h2>
            Learning that feels like
            <strong> playing.</strong>
          </h2>

          <p>
            Simple lessons, interactive activities and
            personalized learning paths.
          </p>

        </div>


        <div className="landing-feature-grid">

          <div className="landing-feature purple">
            <div className="feature-large-icon">
              🎯
            </div>

            <h3>Personalized Learning</h3>

            <p>
              Your age, preferred language and learning
              level help us create a personalized experience.
            </p>
          </div>


          <div className="landing-feature green">
            <div className="feature-large-icon">
              🌍
            </div>

            <h3>Multiple Languages</h3>

            <p>
              Learn using English, Hindi, Telugu, Tamil,
              Malayalam or Kannada.
            </p>
          </div>


          <div className="landing-feature orange">
            <div className="feature-large-icon">
              🏆
            </div>

            <h3>Gamified Learning</h3>

            <p>
              Earn XP, build streaks and unlock achievements
              as you learn.
            </p>
          </div>

        </div>

      </section>


      {/* LANGUAGES */}
      <section
        className="landing-languages"
        id="languages"
      >

        <div className="landing-heading">

          <span>CHOOSE YOUR LANGUAGE</span>

          <h2>
            Learn in a language
            <strong> you know.</strong>
          </h2>

        </div>


        <div className="landing-language-grid">

          <div className="landing-language">
            <span>🇮🇳</span>
            <strong>Hindi</strong>
            <small>हिन्दी</small>
          </div>

          <div className="landing-language">
            <span>🟠</span>
            <strong>Telugu</strong>
            <small>తెలుగు</small>
          </div>

          <div className="landing-language">
            <span>🔴</span>
            <strong>Tamil</strong>
            <small>தமிழ்</small>
          </div>

          <div className="landing-language">
            <span>🟢</span>
            <strong>Malayalam</strong>
            <small>മലയാളം</small>
          </div>

          <div className="landing-language">
            <span>🔵</span>
            <strong>Kannada</strong>
            <small>ಕನ್ನಡ</small>
          </div>

          <div className="landing-language">
            <span>🇬🇧</span>
            <strong>English</strong>
            <small>English</small>
          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}
      <section
        className="landing-how"
        id="how-it-works"
      >

        <div className="landing-heading">

          <span>HOW IT WORKS</span>

          <h2>
            Your learning journey
            <strong> starts here.</strong>
          </h2>

        </div>


        <div className="landing-steps">

          <div className="landing-step">
            <div>1</div>
            <span>👤</span>
            <h3>Create Account</h3>
            <p>Tell us about yourself.</p>
          </div>

          <div className="step-arrow">→</div>

          <div className="landing-step">
            <div>2</div>
            <span>🌍</span>
            <h3>Choose Language</h3>
            <p>Select your preferred language.</p>
          </div>

          <div className="step-arrow">→</div>

          <div className="landing-step">
            <div>3</div>
            <span>🎯</span>
            <h3>Select Level</h3>
            <p>Beginner, Intermediate or Advanced.</p>
          </div>

          <div className="step-arrow">→</div>

          <div className="landing-step">
            <div>4</div>
            <span>🚀</span>
            <h3>Start Learning</h3>
            <p>Follow your personalized path.</p>
          </div>

        </div>

      </section>


      {/* ABOUT */}
      <section
        className="landing-about"
        id="about"
      >

        <div className="about-book">
          📚
        </div>

        <div>

          <span>ABOUT LEARNLY</span>

          <h2>
            Making learning
            <br />
            <strong>simple and accessible.</strong>
          </h2>

          <p>
            Learnly is an interactive literacy learning platform
            designed to make learning reading, writing and
            vocabulary enjoyable.
          </p>

          <button
            onClick={onRegister}
            className="about-start-btn"
          >
            Start My Learning Journey →
          </button>

        </div>

      </section>


      {/* CTA */}
      <section className="landing-cta">

        <div>⭐</div>

        <h2>
          Ready to start
          <br />
          <span>learning?</span>
        </h2>

        <p>
          Create your Learnly account and begin your
          personalized learning journey.
        </p>

        <button onClick={onRegister}>
          Get Started — It's Free
        </button>

      </section>


      {/* FOOTER */}
      <footer className="landing-footer">

        <div>
          📚 <strong>Learnly</strong>
        </div>

        <p>
          Learn. Practice. Grow.
        </p>

      </footer>

    </div>
  );
}

export default LandingPage;