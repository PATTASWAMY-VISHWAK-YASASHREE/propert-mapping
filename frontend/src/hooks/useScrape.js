// Example hook/function to fetch scraped data from backend API
import { useState } from "react";
import axios from "axios";

/**
 * useScrape - Custom hook for scraping data by type/source
 * @param {string} source - "propmap" | "propwire" | "fps"
 * @param {object} search - query params, e.g. {filters}, {firstName, lastName}, etc.
 * @returns {object} { loading, data, error, scrape }
 */
export default function useScrape(source, search = {}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function scrape() {
    setLoading(true); setError(null);
    let url = `/api/scrape/${source}`;
    if (source === "propwire" && search.filters) {
      url += "?filters=" + encodeURIComponent(JSON.stringify(search.filters));
    } else if (source === "fps") {
      // build appropriate query string
      const qs = new URLSearchParams(search).toString();
      url += "?" + qs;
    }
    try {
      const res = await axios.get(url);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  return { loading, data, error, scrape };
}