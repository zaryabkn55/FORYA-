import { Link } from 'react-router-dom';
import { Wordmark } from './Logo';
import { SectionLink } from './SectionLink';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="stack" style={{ gap: 14 }}>
            <Wordmark size={34} />
            <p className="body" style={{ maxWidth: 300 }}>
              You've got plans. <span className="wink" style={{ color: 'var(--ink)' }}>We've got the look.</span> A style journal for every moment, and a
              second opinion on every price.
            </p>
          </div>
          <div>
            <h4 className="eyebrow">Product</h4>
            <ul>
              <li>
                <SectionLink id="how">How it works</SectionLink>
              </li>
              <li>
                <SectionLink id="price-check">Price check</SectionLink>
              </li>
              <li>
                <Link to="/discover">Discover</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow">Your FORYA</h4>
            <ul>
              <li>
                <Link to="/moments">Moments</Link>
              </li>
              <li>
                <Link to="/wardrobe">Wardrobe</Link>
              </li>
              <li>
                <Link to="/login">Log in</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="eyebrow">Company</h4>
            <ul>
              <li>
                <a href="mailto:hello@forya.com">Contact</a>
              </li>
              <li>
                <a href="#privacy">Privacy</a>
              </li>
              <li>
                <a href="#terms">Terms</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <span className="small">© {new Date().getFullYear()} FORYA. Prices shown are illustrative while retailer feeds are connected.</span>
          <span className="small">Made in London</span>
        </div>
      </div>
    </footer>
  );
}
