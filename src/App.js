import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./App.css";

import Home from "./pages/Home";
import About from "./pages/About";
import News from "./pages/News";
import NewsDetails from "./pages/NewsDetails";
import Marketplace from "./pages/Marketplace";
import MarketplaceDetails from "./pages/MarketplaceDetails";
import MemberDetails from "./pages/MemberDetails";
import Business from "./pages/Business";
import Matrimonial from "./pages/Matrimonial";
import MatrimonialDetails from "./pages/MatrimonialDetails";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import BecomeMember from "./pages/BecomeMember";


function App() {
  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<NewsDetails />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<MarketplaceDetails />} />
          <Route path="/memberdetails" element={<MemberDetails />} />
          <Route path="/business" element={<Business />} />
          <Route path="/matrimonial" element={<Matrimonial />} />
          <Route path="/matrimonial/:id" element={<MatrimonialDetails />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/becomemember" element={<BecomeMember />} />

        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;

