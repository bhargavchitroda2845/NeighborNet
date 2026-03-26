import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import "./Gallery.css";
import { GALLERY_ALBUMS_API_URL, BASE_URL, GALLERY_GOOGLE_DRIVE_CONNECT_URL, GALLERY_GOOGLE_DRIVE_STATUS_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 12;

function Gallery() {
  const location = useLocation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, member, isLoading: isAuthLoading } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [page, setPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [driveConnected, setDriveConnected] = useState(false);
  const [folderExists, setFolderExists] = useState(true);

  const username = member?.member?.username || member?.username || "";

  const fetchAlbums = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl = `${GALLERY_ALBUMS_API_URL}?logged_in=${isAuthenticated}&username=${username}`;
      const response = await fetch(apiUrl, {
        credentials: "include",
      });
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
  }, [isAuthenticated, username]);

  const checkDriveStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetch(GALLERY_GOOGLE_DRIVE_STATUS_URL, {
        credentials: "include",
      });
      const data = await response.json();
      setDriveConnected(data.connected);
      setFolderExists(data.folder_exists ?? true);
    } catch (err) {
      console.error("Error checking drive status", err);
    }
  }, [isAuthenticated]);

  const lastFetchParams = useRef("");

  useEffect(() => {
    if (isAuthLoading) return;
    
    checkDriveStatus();
    
    const refreshSuffix = location.state?.refreshGallery ? `refresh-${location.key}` : "normal";
    const currentParams = `${isAuthenticated}-${username}-${refreshSuffix}`;
    
    if (lastFetchParams.current === currentParams) return;
    lastFetchParams.current = currentParams;

    fetchAlbums();

    if (location.state?.refreshGallery) {
      setSelectedAlbum(null);
      setPage(1);
      setLightboxIndex(null);
    }
  }, [isAuthLoading, isAuthenticated, username, location.key, location.state, fetchAlbums]);

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

  // Determine which image array the lightbox should loop over
  const currentViewImages = selectedAlbum ? (selectedAlbum.images || []) : allImages;

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }

    if (lightboxIndex < 0 || lightboxIndex >= currentViewImages.length) {
      setLightboxIndex(null);
    }
  }, [lightboxIndex, currentViewImages]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (lightboxIndex === null) {
        return;
      }

      if (event.key === "Escape") {
        setLightboxIndex(null);
      }

      if (event.key === "ArrowLeft") {
        if (currentViewImages.length > 0) {
          setLightboxIndex((prev) =>
            prev === null ? null : (prev - 1 + currentViewImages.length) % currentViewImages.length
          );
        }
      }

      if (event.key === "ArrowRight") {
        if (currentViewImages.length > 0) {
          setLightboxIndex((prev) =>
            prev === null ? null : (prev + 1) % currentViewImages.length
          );
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, currentViewImages.length]);

  const goToPrevious = () => {
    if (currentViewImages.length === 0) {
      return;
    }
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + currentViewImages.length) % currentViewImages.length
    );
  };

  const goToNext = () => {
    if (currentViewImages.length === 0) {
      return;
    }
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % currentViewImages.length
    );
  };

  const activeImage = lightboxIndex === null ? null : currentViewImages[lightboxIndex];

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

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    event.currentTarget.style.setProperty("--mx", `${x}px`);
    event.currentTarget.style.setProperty("--my", `${y}px`);
  };

  const handleTouchMove = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = touch.clientX - bounds.left;
    const y = touch.clientY - bounds.top;

    event.currentTarget.style.setProperty("--mx", `${x}px`);
    event.currentTarget.style.setProperty("--my", `${y}px`);
  };

  return (
    <div
      className="gallery-page"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      <div className="gallery-header">
        <h1>Community Gallery</h1>
        <div className="header-actions">
          {isAuthenticated && (
            <div className={`drive-status-bar ${!driveConnected || !folderExists ? 'status-warning' : 'status-healthy'}`}>
                <div className="status-message">
                    <i className="fab fa-google-drive mr-2"></i>
                    <strong>Google Drive Status:</strong>
                    <span className="ml-2">
                        {!driveConnected ? 'Not Connected' : !folderExists ? 'Connection Broken (Root folder missing)' : 'Connected & Healthy'}
                    </span>
                </div>
                <a href={GALLERY_GOOGLE_DRIVE_CONNECT_URL} className="btn-reconnect-compact">
                    <i className="fas fa-sync-alt mr-1"></i> {!driveConnected ? 'Link Drive' : 'Reconnect / Fix'}
                </a>
            </div>
          )}
          {selectedAlbum && (
            <button
              className="btn btn-secondary"
              onClick={() => handleAlbumSelect(null)}
            >
              Back to All Albums
            </button>
          )}
        </div>
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
                    decoding="async"
                  />
                  <span className="gallery-card-title">{album.title}</span>
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
              By {selectedAlbum.created_by_name}
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
                  <img src={img.image_url} alt={img.title || selectedAlbum.title} loading="lazy" decoding="async" />
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
