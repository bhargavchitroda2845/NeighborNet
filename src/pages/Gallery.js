import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import "./Gallery.css";

const PAGE_SIZE = 12;

function Gallery() {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    fetch("/data/galleryData.json")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories || []);
        setPhotos(data.photos || []);
      })
      .catch((err) => console.error("Error loading gallery data", err));
  }, []);

  const filteredPhotos = useMemo(() => {
    if (selectedCategory === "all") {
      return photos;
    }
    return photos.filter((photo) => photo.category === selectedCategory);
  }, [photos, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredPhotos.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const currentPagePhotos = filteredPhotos.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
    setActiveIndex(null);
  }, [selectedCategory]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!location.state?.refreshGallery) {
      return;
    }

    setSelectedCategory("all");
    setPage(1);
    setActiveIndex(null);
  }, [location.key, location.state]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    if (activeIndex < 0 || activeIndex >= filteredPhotos.length) {
      setActiveIndex(null);
    }
  }, [activeIndex, filteredPhotos]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (activeIndex === null) {
        return;
      }

      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowLeft") {
        if (filteredPhotos.length > 0) {
          setActiveIndex((prev) =>
            prev === null ? null : (prev - 1 + filteredPhotos.length) % filteredPhotos.length
          );
        }
      }

      if (event.key === "ArrowRight") {
        if (filteredPhotos.length > 0) {
          setActiveIndex((prev) =>
            prev === null ? null : (prev + 1) % filteredPhotos.length
          );
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filteredPhotos.length]);

  const goToPrevious = () => {
    if (filteredPhotos.length === 0) {
      return;
    }
    setActiveIndex((prev) =>
      prev === null ? null : (prev - 1 + filteredPhotos.length) % filteredPhotos.length
    );
  };

  const goToNext = () => {
    if (filteredPhotos.length === 0) {
      return;
    }
    setActiveIndex((prev) =>
      prev === null ? null : (prev + 1) % filteredPhotos.length
    );
  };

  const activePhoto = activeIndex === null ? null : filteredPhotos[activeIndex];

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <h1>Community Gallery</h1>
        <div className="gallery-filter">
          <label htmlFor="gallery-category">Category</label>
          <select
            id="gallery-category"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="gallery-grid">
        {currentPagePhotos.length === 0 ? (
          <p className="gallery-empty">No images found.</p>
        ) : (
          currentPagePhotos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              className="gallery-card"
              style={{ "--index": index }}
              onClick={() => setActiveIndex(pageStart + index)}
            >
              <img src={photo.image_url} alt={photo.title} loading="lazy" />
              <span className="gallery-card-title">{photo.title}</span>
            </button>
          ))
        )}
      </div>

      <div className="gallery-pagination">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>

      {activePhoto && (
        <div className="lightbox-backdrop" onClick={() => setActiveIndex(null)}>
          <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setActiveIndex(null)}
              aria-label="Close image viewer"
            >
              x
            </button>
            <button
              type="button"
              className="lightbox-nav left"
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              {"<"}
            </button>
            <img src={activePhoto.image_url} alt={activePhoto.title} className="lightbox-image" />
            <button
              type="button"
              className="lightbox-nav right"
              onClick={goToNext}
              aria-label="Next image"
            >
              {">"}
            </button>

            <div className="lightbox-meta">
              <h3>{activePhoto.title}</h3>
              <p><strong>Category:</strong> {activePhoto.category}</p>
              <p><strong>Uploaded by:</strong> {activePhoto.uploaded_by}</p>
              <p><strong>Time:</strong> {activePhoto.uploaded_at}</p>
              <p><strong>Description:</strong> {activePhoto.description}</p>
              <p>{activePhoto.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
