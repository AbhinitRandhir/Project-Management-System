
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-content">

        {/* LEFT SECTION */}
        <div className="app-footer-left">
          <span className="app-footer-brand">
            © {currentYear} ProjectTrack
          </span>

          <span
            className="app-footer-separator"
            aria-hidden="true"
          >
            |
          </span>

          <span className="app-footer-description">
            Team-Based Project Management System
          </span>
        </div>

        {/* RIGHT SECTION */}
        <div className="app-footer-right">
          <span>
            Designed for Academic Project Management
          </span>
        </div>

      </div>
    </footer>
  );
}

export default Footer;