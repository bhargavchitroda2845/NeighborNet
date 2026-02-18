const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.trim() || "http://192.168.1.3:8000";

const normalizeBaseUrl = (value) => value.replace(/\/+$/, "");

export const BASE_URL = normalizeBaseUrl(API_BASE_URL);
export const PUBLIC_PROFILE_API_URL = `${BASE_URL}/api/public/profile/`;
export const MEMBER_LOGIN_URL = `${BASE_URL}/member/login/`;
export const ADMIN_URL = `${BASE_URL}/admin/`;
export const BECOME_MEMBER_API_URL = "http://192.168.1.3:8000/member/api/members/create/";
export const MASTER_COUNTRIES_API_URL = `${BASE_URL}/api/master/countries/`;
export const MASTER_STATES_API_URL = `${BASE_URL}/api/master/states/`;
export const MASTER_CITIES_API_URL = `${BASE_URL}/api/master/cities/`;
