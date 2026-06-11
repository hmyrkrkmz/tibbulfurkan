"""
Tıbb-ul Furkan - Form Submissions backend tests
Covers:
- Form CRUD (POST/GET list/GET by id/DELETE) at /api/form-submissions
- AI Form Analysis at POST /api/form-submissions/{fid}/analyze
  - Expects ai_analysis ending with the phrase "Lütfen seans alınız" (case-insensitive ok)
"""
import os
import time
import pytest
import requests

# Public backend URL is exposed via EXPO_PUBLIC_BACKEND_URL in /app/frontend/.env
BASE_URL = (
    os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or "https://furkan-medical.preview.emergentagent.com"
).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Shared state across tests in this module
_state = {"fid": None}


REALISTIC_FORM_PAYLOAD = {
    "ad_soyad": "TEST_Mehmet Yılmaz",
    "yas": "40",
    "tlf": "5550000000",
    "medeni_durum": "evli",
    "cocuk_sayisi": "2",
    "memleket": "Konya",
    "dogum_tarihi": "12.05.1985",
    "cinsiyet": "erkek",
    "anne_durum": "Hayatta",
    "baba_durum": "Vefat",
    "anneanne_durum": "Vefat",
    "anne_babasi_durum": "Vefat",
    "babaanne_durum": "Vefat",
    "baba_babasi_durum": "Vefat",
    "zekat_veriyor": "Evet",
    "faizli_kredi": "Hayır",
    "anne_hastalik": "Diyabet",
    "baba_hastalik": "Kalp",
    "cocuk_hastalik": "",
    "rahatsizliklar": "Migren ve uyku problemi",
    "adak_yemin": "Evet, çocukluğumda kurban adamıştık",
    "muska_okunmus_su": "Hayır",
    "miras_sorunu": "Hayır",
    "beddua_hak_haram": "Hayır",
    "intihar": "Hayır",
    "anne_baba_ofke": "Evet biraz",
    "es_soguklugu": "Hayır",
    "sehvet": "Hayır",
    "duygusallik": "Evet",
    "kin": "Hayır",
    "kusme_alinganlik": "Hayır",
    "ofke": "Evet bazen",
    "nefret": "Hayır",
    "supheci": "Hayır",
    "uyku_sorunu": "Evet",
    "aniden_parlama": "Evet",
    "alaycilik": "Hayır",
}


# ---------- CRUD ----------
class TestFormCRUD:
    def test_create_form_submission(self, api_client):
        r = api_client.post(f"{API}/form-submissions", json=REALISTIC_FORM_PAYLOAD)
        assert r.status_code == 200, f"POST failed: {r.status_code} {r.text[:300]}"
        data = r.json()
        # Required keys
        assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 0
        assert "created_at" in data and isinstance(data["created_at"], str)
        # Echoed fields
        assert data["ad_soyad"] == REALISTIC_FORM_PAYLOAD["ad_soyad"]
        assert data["dogum_tarihi"] == REALISTIC_FORM_PAYLOAD["dogum_tarihi"]
        assert data["cinsiyet"] == REALISTIC_FORM_PAYLOAD["cinsiyet"]
        assert data["rahatsizliklar"] == REALISTIC_FORM_PAYLOAD["rahatsizliklar"]
        # No MongoDB _id leak
        assert "_id" not in data
        # ai_analysis should be empty/None on create
        assert data.get("ai_analysis") in (None, "")
        _state["fid"] = data["id"]

    def test_list_form_submissions_includes_created(self, api_client):
        assert _state["fid"], "fid not set from create test"
        r = api_client.get(f"{API}/form-submissions")
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        ids = [d.get("id") for d in data]
        assert _state["fid"] in ids, f"Created fid {_state['fid']} missing in list"
        # _id not leaked
        for d in data[:5]:
            assert "_id" not in d

    def test_get_form_submission_by_id(self, api_client):
        fid = _state["fid"]
        r = api_client.get(f"{API}/form-submissions/{fid}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] == fid
        assert data["ad_soyad"] == REALISTIC_FORM_PAYLOAD["ad_soyad"]
        assert "_id" not in data

    def test_get_unknown_form_returns_404(self, api_client):
        r = api_client.get(f"{API}/form-submissions/does-not-exist-uuid-xyz")
        assert r.status_code == 404

    def test_create_minimal_required_only(self, api_client):
        """ad_soyad is the only required field per pydantic model."""
        minimal = {"ad_soyad": "TEST_Min User"}
        r = api_client.post(f"{API}/form-submissions", json=minimal)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data
        # Clean up immediately
        d = api_client.delete(f"{API}/form-submissions/{data['id']}")
        assert d.status_code == 200


# ---------- AI Analysis ----------
class TestFormAnalysis:
    def test_analyze_form_returns_ai_analysis_with_required_phrase(self, api_client):
        fid = _state["fid"]
        assert fid, "fid not set from create test"

        last_err = None
        r = None
        for attempt in range(2):
            try:
                r = api_client.post(
                    f"{API}/form-submissions/{fid}/analyze", timeout=180
                )
                if r.status_code == 200:
                    break
                last_err = f"status={r.status_code} body={r.text[:300]}"
            except requests.exceptions.ReadTimeout as e:
                last_err = f"timeout: {e}"
            time.sleep(3)

        assert r is not None, f"No response from analyze endpoint: {last_err}"

        # If budget exhausted, surface this as a clear skip with details
        if r.status_code == 503:
            pytest.skip(
                f"LLM provider budget exhausted (503). Body: {r.text[:300]}"
            )

        assert r.status_code == 200, f"Analyze failed: {last_err or r.text[:300]}"
        data = r.json()

        # Response shape
        assert "ai_analysis" in data, f"Missing ai_analysis in response: {data}"
        assert "signals" in data, f"Missing signals in response: {data}"
        assert isinstance(data["signals"], dict)

        text = data["ai_analysis"]
        assert isinstance(text, str), f"ai_analysis must be string, got {type(text)}"
        assert len(text) >= 100, f"ai_analysis too short ({len(text)} chars): {text!r}"

        # Turkish-ness sanity
        assert any(
            ch in text for ch in "ığüşöçİĞÜŞÖÇ"
        ), "ai_analysis does not look Turkish"

        # KEY CHECK: must contain 'Lütfen seans alınız' (case-insensitive)
        norm = text.lower()
        assert "lütfen seans alınız" in norm, (
            "ai_analysis MUST contain the phrase 'Lütfen seans alınız' "
            f"(case-insensitive). Tail of analysis: ...{text[-300:]!r}"
        )

        # Should be near the end - within last 400 chars
        tail = text[-400:].lower()
        assert "lütfen seans alınız" in tail, (
            "'Lütfen seans alınız' must appear at/near the END of ai_analysis. "
            f"Last 400 chars: {text[-400:]!r}"
        )

        # Signals should reflect at least one positive answer from the payload
        # (e.g., adak_yemin -> adak_hayvan or adak_eylem; anne_baba_ofke -> zulum_anne_baba; uyku_sorunu -> adak_hayvan/zekat)
        # We don't require an exact category, just that the dict is non-empty for this payload.
        assert len(data["signals"]) > 0, (
            f"Expected at least one signal for the realistic payload, got empty: {data['signals']}"
        )

    def test_analyze_persists_ai_analysis(self, api_client):
        """After analyze, GET by id should now include the ai_analysis text."""
        fid = _state["fid"]
        r = api_client.get(f"{API}/form-submissions/{fid}")
        assert r.status_code == 200, r.text
        data = r.json()
        # If previous test was skipped due to 503, ai_analysis may still be None.
        if data.get("ai_analysis"):
            assert isinstance(data["ai_analysis"], str)
            assert "lütfen seans alınız" in data["ai_analysis"].lower()

    def test_analyze_unknown_form_returns_404(self, api_client):
        r = api_client.post(f"{API}/form-submissions/does-not-exist-uuid-xyz/analyze")
        assert r.status_code == 404


# ---------- Cleanup ----------
class TestCleanup:
    def test_delete_form_submission(self, api_client):
        fid = _state["fid"]
        if not fid:
            pytest.skip("No fid to delete")
        r = api_client.delete(f"{API}/form-submissions/{fid}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data == {"ok": True}

        # Verify it's gone
        g = api_client.get(f"{API}/form-submissions/{fid}")
        assert g.status_code == 404
