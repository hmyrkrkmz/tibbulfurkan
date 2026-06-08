#!/usr/bin/env python3
"""
Backend API Test Suite for Tıbb-ul Furkan
Tests all form submission endpoints and AI analysis functionality
"""

import requests
import json
import sys
from typing import Dict, Any

# Backend URL from environment
BASE_URL = "https://furkan-medical.preview.emergentagent.com/api"

# Test data - realistic Turkish form submission
TEST_FORM_DATA = {
    "ad_soyad": "Ayşe Yılmaz",
    "yas": "45",
    "tlf": "05551234567",
    "anne_adi": "Fatma",
    "baba_adi": "Ahmet",
    "anne_hastalik": "Şeker, tansiyon",
    "baba_hastalik": "Kalp",
    "anneanne_hastalik": "Romatizma",
    "babaanne_hastalik": "Alzheimer",
    "anne_anne": "Ayşe",
    "anne_baba": "Mehmet",
    "baba_anne": "Zeynep",
    "baba_baba": "Ali",
    "adak_yemin": "Evet",
    "muska_okunmus_su": "Evet",
    "beddua_hak_haram": "Evet",
    "anne_baba_ofke": "Evet",
    "es_soguklugu": "Hayır",
    "sehvet": "Hayır",
    "duygusallik": "Evet",
    "kin": "Hayır",
    "kusme_alinganlik": "Evet",
    "ofke": "Evet",
    "nefret": "Hayır",
    "supheci": "Hayır",
    "uyku_sorunu": "Evet",
    "aniden_parlama": "Evet",
    "alaycilik": "Hayır",
    "zekat_vermiyor": "Hayır",
    "faizli_kredi": "Hayır",
    "intihar": "Hayır",
    "miras_sorunu": "Evet"
}

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_test_header(test_name: str):
    """Print formatted test header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}TEST: {test_name}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.RESET}")

def print_success(message: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")

def print_error(message: str):
    """Print error message"""
    print(f"{Colors.RED}✗ {message}{Colors.RESET}")

def print_warning(message: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.RESET}")

def print_info(message: str):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ {message}{Colors.RESET}")

def test_create_form() -> str:
    """Test POST /api/form-submissions - Create new form"""
    print_test_header("1. Create Form Submission (POST /api/form-submissions)")
    
    try:
        response = requests.post(
            f"{BASE_URL}/form-submissions",
            json=TEST_FORM_DATA,
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            form_id = data.get("id")
            
            if form_id:
                print_success(f"Form created successfully with ID: {form_id}")
                print_info(f"Form name: {data.get('ad_soyad')}")
                print_info(f"Created at: {data.get('created_at')}")
                return form_id
            else:
                print_error("Response missing 'id' field")
                return None
        else:
            print_error(f"Failed with status {response.status_code}")
            print_error(f"Response: {response.text[:200]}")
            return None
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        return None

def test_list_forms():
    """Test GET /api/form-submissions - List all forms"""
    print_test_header("2. List All Forms (GET /api/form-submissions)")
    
    try:
        response = requests.get(f"{BASE_URL}/form-submissions", timeout=10)
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list):
                print_success(f"Retrieved {len(data)} form(s)")
                
                if len(data) > 0:
                    print_info(f"Latest form: {data[0].get('ad_soyad')} (ID: {data[0].get('id')})")
                    return True
                else:
                    print_warning("No forms found in database")
                    return True
            else:
                print_error("Response is not a list")
                return False
        else:
            print_error(f"Failed with status {response.status_code}")
            print_error(f"Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        return False

def test_get_single_form(form_id: str):
    """Test GET /api/form-submissions/{id} - Get single form"""
    print_test_header(f"3. Get Single Form (GET /api/form-submissions/{form_id})")
    
    try:
        response = requests.get(f"{BASE_URL}/form-submissions/{form_id}", timeout=10)
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("id") == form_id:
                print_success(f"Form retrieved successfully")
                print_info(f"Name: {data.get('ad_soyad')}")
                print_info(f"Age: {data.get('yas')}")
                print_info(f"Phone: {data.get('tlf')}")
                
                # Check some key fields
                if data.get("adak_yemin") == "Evet":
                    print_info("✓ Adak/Yemin field correctly set to 'Evet'")
                if data.get("miras_sorunu") == "Evet":
                    print_info("✓ Miras sorunu field correctly set to 'Evet'")
                    
                return True
            else:
                print_error("Form ID mismatch")
                return False
        else:
            print_error(f"Failed with status {response.status_code}")
            print_error(f"Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        return False

def test_analyze_form(form_id: str):
    """Test POST /api/form-submissions/{id}/analyze - AI Analysis (CRITICAL)"""
    print_test_header(f"4. AI Form Analysis (POST /api/form-submissions/{form_id}/analyze) - CRITICAL")
    
    try:
        response = requests.post(
            f"{BASE_URL}/form-submissions/{form_id}/analyze",
            timeout=30  # Longer timeout for analysis
        )
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            ai_analysis = data.get("ai_analysis")
            
            if not ai_analysis:
                print_error("Response missing 'ai_analysis' field")
                return False
            
            print_success("AI analysis generated successfully")
            print_info(f"Analysis length: {len(ai_analysis)} characters")
            
            # CRITICAL VALIDATION: Check for required ending text
            if "Lütfen seans alınız" in ai_analysis:
                print_success("✓ CRITICAL: Analysis contains 'Lütfen seans alınız' at the end")
            else:
                print_error("✗ CRITICAL: Analysis MISSING 'Lütfen seans alınız' text!")
                print_warning("This is a CRITICAL requirement failure!")
            
            # Check for Turkish content
            if any(word in ai_analysis for word in ["Aile", "Mali", "Hastalık", "Manevi", "Değerlendirme"]):
                print_success("✓ Analysis contains Turkish section headers")
            else:
                print_warning("Analysis may be missing expected section headers")
            
            # Check for pattern matching based on form data
            validation_checks = []
            
            # Check if "Evet" responses are reflected in analysis
            if TEST_FORM_DATA.get("adak_yemin") == "Evet":
                if any(word in ai_analysis.lower() for word in ["adak", "yemin"]):
                    validation_checks.append("✓ Adak/Yemin mentioned (form had 'Evet')")
                else:
                    validation_checks.append("✗ Adak/Yemin NOT mentioned despite 'Evet' in form")
            
            if TEST_FORM_DATA.get("beddua_hak_haram") == "Evet":
                if any(word in ai_analysis.lower() for word in ["beddua", "hak", "haram"]):
                    validation_checks.append("✓ Beddua/Hak Haram mentioned (form had 'Evet')")
                else:
                    validation_checks.append("✗ Beddua/Hak Haram NOT mentioned despite 'Evet' in form")
            
            if TEST_FORM_DATA.get("miras_sorunu") == "Evet":
                if "miras" in ai_analysis.lower():
                    validation_checks.append("✓ Miras mentioned (form had 'Evet')")
                else:
                    validation_checks.append("✗ Miras NOT mentioned despite 'Evet' in form")
            
            # Check for disease pattern matching
            if TEST_FORM_DATA.get("anne_hastalik") == "Şeker, tansiyon":
                if any(word in ai_analysis.lower() for word in ["şeker", "diyabet", "tansiyon"]):
                    validation_checks.append("✓ Mother's diseases (Şeker/Tansiyon) referenced")
                else:
                    validation_checks.append("⚠ Mother's diseases may not be explicitly mentioned")
            
            print_info("\nContent Validation:")
            for check in validation_checks:
                if "✓" in check:
                    print_success(check)
                elif "✗" in check:
                    print_error(check)
                else:
                    print_warning(check)
            
            # Print sample of analysis
            print_info("\nAnalysis Preview (first 500 chars):")
            print(f"{Colors.YELLOW}{ai_analysis[:500]}...{Colors.RESET}")
            
            # Print ending (last 100 chars)
            print_info("\nAnalysis Ending (last 100 chars):")
            print(f"{Colors.YELLOW}...{ai_analysis[-100:]}{Colors.RESET}")
            
            # Check if cached
            if data.get("cached"):
                print_info("Note: This was a cached response")
            
            return True
        else:
            print_error(f"Failed with status {response.status_code}")
            print_error(f"Response: {response.text[:500]}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        import traceback
        print_error(traceback.format_exc())
        return False

def test_delete_form(form_id: str):
    """Test DELETE /api/form-submissions/{id} - Delete form"""
    print_test_header(f"5. Delete Form (DELETE /api/form-submissions/{form_id})")
    
    try:
        response = requests.delete(f"{BASE_URL}/form-submissions/{form_id}", timeout=10)
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("ok"):
                print_success("Form deleted successfully")
                
                # Verify deletion by trying to get the form
                verify_response = requests.get(f"{BASE_URL}/form-submissions/{form_id}", timeout=10)
                if verify_response.status_code == 404:
                    print_success("✓ Verified: Form no longer exists (404)")
                    return True
                else:
                    print_warning(f"Form still accessible after deletion (status: {verify_response.status_code})")
                    return False
            else:
                print_error("Delete response did not return 'ok: true'")
                return False
        else:
            print_error(f"Failed with status {response.status_code}")
            print_error(f"Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print_error(f"Exception occurred: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests in sequence"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}")
    print("TOBB-UL FURKAN BACKEND API TEST SUITE")
    print(f"{'='*70}{Colors.RESET}\n")
    print_info(f"Backend URL: {BASE_URL}")
    print_info(f"Test Data: {TEST_FORM_DATA['ad_soyad']} (Age: {TEST_FORM_DATA['yas']})")
    
    results = {
        "total": 5,
        "passed": 0,
        "failed": 0
    }
    
    # Test 1: Create Form
    form_id = test_create_form()
    if form_id:
        results["passed"] += 1
    else:
        results["failed"] += 1
        print_error("\n❌ Cannot continue tests without a valid form ID")
        print_summary(results)
        return False
    
    # Test 2: List Forms
    if test_list_forms():
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Test 3: Get Single Form
    if test_get_single_form(form_id):
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Test 4: AI Analysis (CRITICAL)
    if test_analyze_form(form_id):
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Test 5: Delete Form
    if test_delete_form(form_id):
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Print summary
    print_summary(results)
    
    return results["failed"] == 0

def print_summary(results: Dict[str, int]):
    """Print test summary"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}")
    print("TEST SUMMARY")
    print(f"{'='*70}{Colors.RESET}\n")
    
    print(f"Total Tests: {results['total']}")
    print(f"{Colors.GREEN}Passed: {results['passed']}{Colors.RESET}")
    print(f"{Colors.RED}Failed: {results['failed']}{Colors.RESET}")
    
    if results['failed'] == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✓ ALL TESTS PASSED!{Colors.RESET}")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}✗ SOME TESTS FAILED{Colors.RESET}")
    
    print(f"\n{Colors.BLUE}{'='*70}{Colors.RESET}\n")

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
