"""
Tıbb-ul Furkan backend API tests
Covers: health, diseases, cause categories, profile CRUD,
rule-based analysis logic, disease matching, LLM endpoint, MongoDB persistence.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "https://furkan-medical.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

# Shared state across tests
created_profile_ids: list = []


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Health ----------
class TestHealth:
    def test_root_returns_health_message(self, api_client):
        r = api_client.get(f"{API}/")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "message" in data
        assert "Tıbb-ul Furkan" in data["message"]


# ---------- Static data ----------
class TestDiseases:
    def test_list_diseases_returns_50(self, api_client):
        r = api_client.get(f"{API}/diseases")
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        # Spec says 50 diseases (50+ acceptable)
        assert len(data) >= 50, f"Expected at least 50, got {len(data)}"
        first = data[0]
        for key in ("name", "category", "symptoms", "causes", "remedy"):
            assert key in first, f"Disease missing key: {key}"
        # diabetes must exist for rule-based test below
        names = [d["name"] for d in data]
        assert any("Diyabet" in n for n in names), "Diyabet (Şeker Hastalığı) not found"

    def test_cause_categories(self, api_client):
        r = api_client.get(f"{API}/cause-categories")
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, dict)
        # Expected categories from server.detect_cause_keywords
        for cat in ("adak_eylem", "faiz", "zulum_insan", "beddua"):
            assert cat in data, f"Missing category: {cat}"


# ---------- Profile CRUD + Analysis ----------
TEST_PROFILE_PAYLOAD = {
    "first_name": "TEST_Ahmet",
    "last_name": "Yılmaz",
    "birth_date": "1985-06-15",
    "gender": "erkek",
    "current_diseases": ["Şeker", "Migren", "Bağırsak Hastalıkları"],
    "symptoms": ["baş ağrısı", "yorgunluk"],
    "life_events": ["İş kaybı yaşadı"],
    "allergies": [{"allergen": "polen", "since": "2010"}],
    "ancestors": [
        {
            "name": "Fatma",
            "relation": "anne",
            "side": "maternal",
            "diseases": ["Şeker"],
            "events": [],
            "unfulfilled_vows": ["hatim adağı yarım kaldı"],
            "sins_admitted": [],
            "is_alive": False,
        },
        {
            "name": "Mehmet",
            "relation": "baba",
            "side": "paternal",
            "diseases": [],
            "events": [],
            "unfulfilled_vows": [],
            "sins_admitted": ["faiz işiyle uğraştı"],
            "is_alive": False,
        },
    ],
    "has_animals": False,
    "animals_kept": [],
    "animal_vows": [{"animal": "koyun", "quantity": 1, "fulfilled": False, "issue": ""}],
    "action_vows": [{"action_type": "oruç", "description": "", "fulfilled": False}],
}


class TestProfileFlow:
    def test_create_profile_and_auto_analysis(self, api_client):
        r = api_client.post(f"{API}/profiles", json=TEST_PROFILE_PAYLOAD)
        assert r.status_code == 200, r.text
        prof = r.json()
        assert prof["first_name"] == "TEST_Ahmet"
        assert "id" in prof
        assert "_id" not in prof, "MongoDB _id leaked into response"
        created_profile_ids.append(prof["id"])

    def test_get_profile(self, api_client):
        assert created_profile_ids, "No profile created"
        pid = created_profile_ids[0]
        r = api_client.get(f"{API}/profiles/{pid}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] == pid
        assert "_id" not in data
        assert len(data["ancestors"]) == 2

    def test_get_analysis_full_structure(self, api_client):
        pid = created_profile_ids[0]
        r = api_client.get(f"{API}/profiles/{pid}/analysis")
        assert r.status_code == 200, r.text
        a = r.json()
        assert "_id" not in a
        for k in (
            "matches",
            "maternal_burden_score",
            "paternal_burden_score",
            "self_burden_score",
            "dominant_categories",
            "mind_map",
        ):
            assert k in a, f"Missing analysis key: {k}"
        assert isinstance(a["matches"], list)
        assert isinstance(a["mind_map"], dict)
        assert "nodes" in a["mind_map"] and "edges" in a["mind_map"]
        # Sanity: at least one ancestor node + center node
        assert len(a["mind_map"]["nodes"]) >= 3

    def test_disease_matching_seker_to_diyabet(self, api_client):
        """current_diseases 'Şeker' must match 'Diyabet (Şeker Hastalığı)'"""
        pid = created_profile_ids[0]
        r = api_client.get(f"{API}/profiles/{pid}/analysis")
        a = r.json()
        diseases_matched = [m["disease"] for m in a["matches"]]
        assert any("Diyabet" in d for d in diseases_matched), (
            f"Expected Diyabet match for 'Şeker', got: {diseases_matched}"
        )

    def test_rule_based_categories_and_sides(self, api_client):
        """Verify rule-based mapping: ancestor unfulfilled_vows->adak_eylem,
        ancestor sins_admitted with 'faiz'->faiz,
        maternal score >0 and paternal score >0."""
        pid = created_profile_ids[0]
        r = api_client.get(f"{API}/profiles/{pid}/analysis")
        a = r.json()
        # Both sides should contribute
        assert a["maternal_burden_score"] > 0, "Maternal score should be >0"
        assert a["paternal_burden_score"] > 0, "Paternal score should be >0"
        # Inspect cause categories across matches
        cats_seen = set()
        sides_seen = set()
        for m in a["matches"]:
            for c in m["matched_causes"]:
                cats_seen.add(c["category"])
                if c.get("source_side"):
                    sides_seen.add(c["source_side"])
        assert "adak_eylem" in cats_seen, f"adak_eylem missing in cats: {cats_seen}"
        assert "faiz" in cats_seen, f"faiz missing in cats: {cats_seen}"
        assert "maternal" in sides_seen
        assert "paternal" in sides_seen

    def test_reanalyze_endpoint(self, api_client):
        pid = created_profile_ids[0]
        r = api_client.post(f"{API}/profiles/{pid}/analyze")
        assert r.status_code == 200, r.text
        a = r.json()
        assert a["profile_id"] == pid
        assert "matches" in a

    def test_llm_analysis(self, api_client):
        pid = created_profile_ids[0]
        last_err = None
        for attempt in range(2):
            try:
                r = api_client.post(f"{API}/profiles/{pid}/llm-analysis", timeout=180)
                if r.status_code == 200:
                    break
                last_err = f"status={r.status_code} body={r.text[:200]}"
            except requests.exceptions.ReadTimeout as e:
                last_err = f"timeout: {e}"
            time.sleep(3)
        else:
            pytest.fail(f"LLM endpoint failed after retries: {last_err}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "llm_analysis" in data
        text = data["llm_analysis"]
        assert isinstance(text, str) and len(text) > 50, f"LLM text too short: {text!r}"
        # Lightweight Turkish-ish check: should contain Turkish letters
        assert any(ch in text for ch in "ığüşöçİĞÜŞÖÇ"), "LLM response does not look Turkish"

    def test_delete_profile_and_verify_404(self, api_client):
        pid = created_profile_ids[0]
        r = api_client.delete(f"{API}/profiles/{pid}")
        assert r.status_code == 200, r.text
        g = api_client.get(f"{API}/profiles/{pid}")
        assert g.status_code == 404


# ---------- Edge: 404 on unknown profile ----------
class TestEdge:
    def test_unknown_profile_returns_404(self, api_client):
        r = api_client.get(f"{API}/profiles/does-not-exist-uuid")
        assert r.status_code == 404
