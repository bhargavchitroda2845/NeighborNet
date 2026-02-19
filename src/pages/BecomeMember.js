import { useEffect, useState } from "react";
import {
  BECOME_MEMBER_API_URL,
  MASTER_CITIES_API_URL,
  MASTER_COUNTRIES_API_URL,
  MASTER_STATES_API_URL,
} from "../config/api";
import "./BecomeMember.css";

const initialForm = {
  first_name: "",
  middle_name: "",
  surname: "",
  phone_no: "",
  email_id: "",
  gender: "",
  date_of_birth: "",
  occupation: "",
  country: "",
  state: "",
  city: "",
  residential_address: "",
};

function normalizeResults(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveRefId(value) {
  if (value && typeof value === "object") {
    return toNumber(value.id);
  }
  return toNumber(value);
}

function getOptionLabel(item) {
  return (
    item?.name ||
    item?.title ||
    item?.label ||
    item?.country_name ||
    item?.state_name ||
    `ID ${item?.id}`
  );
}

function BecomeMember() {
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadMasterData = async () => {
      try {
        setLoadingCountries(true);
        const countryRes = await fetch(MASTER_COUNTRIES_API_URL, { signal: controller.signal });
        const countryData = await countryRes.json();
        setCountries(normalizeResults(countryData));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Master data load error:", error);
        }
      } finally {
        setLoadingCountries(false);
      }
    };

    loadMasterData();
    return () => controller.abort();
  }, []);

  // Render reCAPTCHA widget when grecaptcha is available
  useEffect(() => {
    let mounted = true;

    const renderRecaptcha = () => {
      try {
        if (!window?.grecaptcha) return false;
        const el = document.getElementById("become-member-recaptcha");
        if (!el) return false;
        const id = window.grecaptcha.render("become-member-recaptcha", {
          sitekey: "6LcR428sAAAAAGf8btT931wd2r9qWVnezAnJjA31",
        });
        if (mounted) setRecaptchaWidgetId(id);
        return true;
      } catch (e) {
        // ignore render errors and retry
        return false;
      }
    };

    if (!renderRecaptcha()) {
      const iv = setInterval(() => {
        if (renderRecaptcha()) clearInterval(iv);
      }, 500);
      return () => {
        mounted = false;
        clearInterval(iv);
      };
    }
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const selectedCountryId = toNumber(formData.country);
    if (!selectedCountryId) {
      setStates([]);
      setCities([]);
      return;
    }

    const controller = new AbortController();

    const fetchStatesAndCities = async () => {
      try {
        setLoadingStates(true);
        setLoadingCities(true);
        const stateParams = new URLSearchParams();
        stateParams.set("country_id", String(selectedCountryId));

        const [stateResponse] = await Promise.all([
          fetch(`${MASTER_STATES_API_URL}?${stateParams.toString()}`, {
            signal: controller.signal,
          }),
        ]);

        const stateData = await stateResponse.json();
        const stateResults = normalizeResults(stateData);

        const safeStates = stateResults.filter((state) => {
          const stateCountryId =
            resolveRefId(state.country_id) ??
            resolveRefId(state.country) ??
            resolveRefId(state.country_ref);
          return stateCountryId === selectedCountryId;
        });

        setStates(safeStates.length > 0 ? safeStates : stateResults);
        setCities([]);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("States/Cities load error:", error);
          setStates([]);
          setCities([]);
        }
      } finally {
        setLoadingStates(false);
        setLoadingCities(false);
      }
    };

    fetchStatesAndCities();
    return () => controller.abort();
  }, [formData.country]);

  useEffect(() => {
    const selectedStateId = toNumber(formData.state);

    // If state is not selected, don't load cities
    if (!selectedStateId) {
      setCities([]);
      return;
    }

    const controller = new AbortController();

    const fetchStateCities = async () => {
      try {
        setLoadingCities(true);
        const params = new URLSearchParams();
        params.set("state_id", String(selectedStateId));

        const url = `${MASTER_CITIES_API_URL}?${params.toString()}`;
        console.log("Fetching cities from:", url);

        const response = await fetch(url, {
          signal: controller.signal,
        });
        const data = await response.json();
        console.log("Cities API response:", data);

        const results = normalizeResults(data);
        console.log("Normalized results:", results);

        setCities(results);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Cities load error:", error);
          setCities([]);
        }
      } finally {
        setLoadingCities(false);
      }
    };

    fetchStateCities();
    return () => controller.abort();
  }, [formData.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      if (name === "country") {
        return { ...prev, country: value, state: "", city: "" };
      }
      if (name === "state") {
        return { ...prev, state: value, city: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const safeTrim = (value) => (typeof value === "string" ? value.trim() : "");

      const payload = {
        first_name: safeTrim(formData.first_name),
        surname: safeTrim(formData.surname),
        phone_no: safeTrim(formData.phone_no),
        email_id: safeTrim(formData.email_id),
        gender:
          safeTrim(formData.gender) === "male"
            ? "M"
            : safeTrim(formData.gender) === "female"
              ? "F"
              : safeTrim(formData.gender) === "other"
                ? "O"
                : safeTrim(formData.gender),
        country: safeTrim(formData.country),
        residential_address: safeTrim(formData.residential_address),
      };

      const optionalFields = {
        middle_name: safeTrim(formData.middle_name),
        date_of_birth: safeTrim(formData.date_of_birth),
        occupation: safeTrim(formData.occupation),
        state: safeTrim(formData.state),
        city: safeTrim(formData.city),
      };

      Object.entries(optionalFields).forEach(([key, value]) => {
        if (value) {
          payload[key] = value;
        }
      });

      // Get reCAPTCHA response token
      try {
        const grecaptcha = window?.grecaptcha;
        const token = grecaptcha
          ? typeof recaptchaWidgetId === "number"
            ? grecaptcha.getResponse(recaptchaWidgetId)
            : grecaptcha.getResponse()
          : null;

        if (!token) {
          setErrorMessage("Please complete the CAPTCHA before submitting.");
          setSubmitting(false);
          return;
        }

        // include token in payload so backend (if implemented) can verify
        payload["g-recaptcha-response"] = token;
      } catch (e) {
        console.warn("reCAPTCHA token error", e);
      }

      const response = await fetch(BECOME_MEMBER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const rawError = await response.text();
        let backendMessage = rawError;

        if (rawError) {
          try {
            const parsedError = JSON.parse(rawError);
            backendMessage = JSON.stringify(parsedError);
          } catch {
            backendMessage = rawError;
          }
        }

        throw new Error(backendMessage || `Request failed (${response.status})`);
      }

      setSuccessMessage("Your request was submitted successfully.");
      setFormData(initialForm);

      // reset captcha after successful submit
      try {
        if (window?.grecaptcha) {
          if (typeof recaptchaWidgetId === "number") {
            window.grecaptcha.reset(recaptchaWidgetId);
          } else {
            window.grecaptcha.reset();
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

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
      className="become-member-page"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      <h1>Become a Member</h1>
      <p className="become-member-subtitle">
        Fill in your details and submit your membership request.
      </p>

      <form className="become-member-form" onSubmit={handleSubmit}>
        <label>
          First Name
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Middle Name (Optional)
          <input
            type="text"
            name="middle_name"
            value={formData.middle_name}
            onChange={handleChange}
          />
        </label>

        <label>
          Surname
          <input
            type="text"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Phone Number
          <input
            type="tel"
            name="phone_no"
            value={formData.phone_no}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email_id"
            value={formData.email_id}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Gender
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label>
          Date of Birth (Optional)
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
          />
        </label>

        <label>
          Occupation (Optional)
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
          />
        </label>

        <label>
          Country
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            disabled={loadingCountries}
          >
            <option value="">
              {loadingCountries ? "Loading countries..." : "Select Country"}
            </option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {getOptionLabel(country)}
              </option>
            ))}
          </select>
        </label>

        <label>
          State
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            disabled={!formData.country || loadingStates}
          >
            <option value="">
              {loadingStates
                ? "Loading states..."
                : formData.country
                  ? "Select State"
                  : "Select Country First"}
            </option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {getOptionLabel(state)}
              </option>
            ))}
          </select>
        </label>

        <label>
          City
          <select
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={!formData.state || loadingCities}
            required
          >
            <option value="">
              {loadingCities
                ? "Loading cities..."
                : formData.state
                  ? "Select City"
                  : "Select State First"}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {getOptionLabel(city)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Residential Address
          <textarea
            name="residential_address"
            value={formData.residential_address}
            onChange={handleChange}
            rows={4}
            required
          />
        </label>

        <div id="become-member-recaptcha" style={{ margin: "12px 0" }} />

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>

      {successMessage ? <p className="become-member-success">{successMessage}</p> : null}
      {errorMessage ? <p className="become-member-error">{errorMessage}</p> : null}
    </div>
  );
}

export default BecomeMember;
