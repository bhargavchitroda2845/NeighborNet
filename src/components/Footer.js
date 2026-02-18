import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <p>(c) {currentYear} NeighborNet. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
