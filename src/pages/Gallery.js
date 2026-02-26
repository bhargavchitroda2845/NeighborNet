import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import "./Gallery.css";
import { GALLERY_ALBUMS_API_URL, BASE_URL } from "../config/api";

const PAGE_SIZE = 12;

function Gallery() {
  const location = useLocation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [page, setPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const fetchAlbums = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(GALLERY_ALBUMS_API_URL);
      const data = await response.json();
      
      if (data.results) {
        setAlbums(data.results);
      } else {
        setAlbums([]);
      }
      setError(null);
    } catch (err) {
      console.error("Error loading gallery data", err);
      setError("Failed to load gallery");
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // Handle URL slug parameter - select album based on URL
  useEffect(() => {
    if (slug && albums.length > 0) {
      const album = albums.find(a => a.slug === slug);
      if (album) {
        setSelectedAlbum(album);
      }
    } else if (!slug) {
      setSelectedAlbum(null);
    }
  }, [slug, albums]);

  // Handle album selection - update URL
  const handleAlbumSelect = useCallback((album) => {
    setSelectedAlbum(album);
    setPage(1);
    setLightboxIndex(null);
    if (album) {
      navigate(`/gallery/${album.slug}`, { replace: true });
    } else {
      navigate('/gallery', { replace: true });
    }
  }, [navigate]);

  // Get all images from all albums for the grid view
  const allImages = useMemo(() => {
    const images = [];
    albums.forEach((album) => {
      if (album.images && album.images.length > 0) {
        album.images.forEach((img) => {
          images.push({
            ...img,
            albumTitle: album.title,
            albumSlug: album.slug,
            coverImageUrl: album.cover_image_url,
          });
        });
      } else if (album.cover_image_url) {
        // If album has no images but has cover, show cover as single image
        images.push({
          id: album.id,
          image_url: album.cover_image_url,
          title: album.title,
          albumTitle: album.title,
          albumSlug: album.slug,
          coverImageUrl: album.cover_image_url,
        });
      }
    });
    return images;
  }, [albums]);

  const totalPages = Math.max(1, Math.ceil(allImages.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const currentPageImages = allImages.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
    setLightboxIndex(null);
  }, [selectedAlbum]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!location.state?.refreshGallery) {
      return;
    }

    fetchAlbums();
    setSelectedAlbum(null);
    setPage(1);
    setLightboxIndex(null);
  }, [location.key, location.state, fetchAlbums]);

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }

    if (lightboxIndex < 0 || lightboxIndex >= allImages.length) {
      setLightboxIndex(null);
    }
  }, [lightboxIndex, allImages]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (lightboxIndex === null) {
        return;
      }

      if (event.key === "Escape") {
        setLightboxIndex(null);
      }

      if (event.key === "ArrowLeft") {
        if (allImages.length > 0) {
          setLightboxIndex((prev) =>
            prev === null ? null : (prev - 1 + allImages.length) % allImages.length
          );
        }
      }

      if (event.key === "ArrowRight") {
        if (allImages.length > 0) {
          setLightboxIndex((prev) =>
            prev === null ? null : (prev + 1) % allImages.length
          );
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, allImages.length]);

  const goToPrevious = () => {
    if (allImages.length === 0) {
      return;
    }
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + allImages.length) % allImages.length
    );
  };

  const goToNext = () => {
    if (allImages.length === 0) {
      return;
    }
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % allImages.length
    );
  };

  const activeImage = lightboxIndex === null ? null : allImages[lightboxIndex];

  if (loading) {
    return (
      <div className="gallery-page">
        <div className="gallery-header">
          <h1>Community Gallery</h1>
        </div>
        <div className="gallery-loading">
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-page">
        <div className="gallery-header">
          <h1>Community Gallery</h1>
        </div>
        <div className="gallery-error">
          <p>{error}</p>
          <button onClick={fetchAlbums} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <h1>Community Gallery</h1>
        {selectedAlbum && (
          <button 
            className="btn btn-secondary"
            onClick={() => handleAlbumSelect(null)}
          >
            Back to All Albums
          </button>
        )}
      </div>

      {/* Album Cards View */}
      {!selectedAlbum && (
        <>
          {albums.length === 0 ? (
            <p className="gallery-empty">No albums found.</p>
          ) : (
            <div className="gallery-grid">
              {albums.map((album, index) => (
                <button
                  key={album.id}
                  type="button"
                  className="gallery-card"
                  style={{ "--index": index }}
                  onClick={() => handleAlbumSelect(album)}
                >
                  <img 
                    src={album.cover_image_url || `${BASE_URL}/static/assets_members/adminlte/dist/img/user2-160x160.jpg`} 
                    alt={album.title} 
                    loading="lazy" 
                  />
                  <span className="gallery-card-title">{album.title}</span>
                  <span className="gallery-card-count">{album.image_count} photos</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Single Album View */}
      {selectedAlbum && (
        <>
          <div className="album-header">
            <h2>{selectedAlbum.title}</h2>
            {selectedAlbum.description && (
              <p>{selectedAlbum.description}</p>
            )}
            <small className="text-muted">
              By {selectedAlbum.created_by_name} | {selectedAlbum.image_count} photos
            </small>
          </div>

          {selectedAlbum.images && selectedAlbum.images.length > 0 ? (
            <div className="gallery-grid">
              {selectedAlbum.images.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  className="gallery-card"
                  style={{ "--index": index }}
                  onClick={() => setLightboxIndex(index)}
                >
                  <img src={img.image_url} alt={img.title || selectedAlbum.title} loading="lazy" />
                  {img.title && <span className="gallery-card-title">{img.title}</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="gallery-empty">No images in this album yet.</p>
          )}
        </>
      )}

      {/* Pagination */}
      {allImages.length > PAGE_SIZE && (
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
      )}

      {/* Lightbox */}
      {activeImage && (
        <div className="lightbox-backdrop" onClick={() => setLightboxIndex(null)}>
          <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setLightboxIndex(null)}
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
            <img src={activeImage.image_url} alt={activeImage.title} className="lightbox-image" />
            <button
              type="button"
              className="lightbox-nav right"
              onClick={goToNext}
              aria-label="Next image"
            >
              {">"}
            </button>

            <div className="lightbox-meta">
              <h3>{activeImage.title || selectedAlbum?.title || "Untitled"}</h3>
              {activeImage.albumTitle && (
                <p><strong>Album:</strong> {activeImage.albumTitle}</p>
              )}
              {activeImage.description && (
                <p><strong>Description:</strong> {activeImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
