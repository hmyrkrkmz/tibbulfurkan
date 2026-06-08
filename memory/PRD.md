# Tıbb-ul Furkan - PRD

## Overview
"Tıbb-ul Furkan" is a Turkish Islamic spiritual analysis mobile app (React Native Expo) that detects ancestral burdens (soy yükü) by analyzing personal/family health information, allergies, life events, vows (adak), and animal-related practices.

## Architecture
- **Frontend**: React Native Expo (Expo Router, file-based routing)
- **Backend**: FastAPI + MongoDB
- **LLM**: Claude Sonnet 4.6 via emergentintegrations (EMERGENT_LLM_KEY)
- **Visualization**: react-native-svg

## Core Features (MVP)
1. **4-Stage Onboarding Wizard**
   - Stage 1: Personal Info (name, surname, birth date, gender)
   - Stage 2: Current health, symptoms, life events, allergies
   - Stage 3: Family tree (maternal/paternal ancestors with diseases, events, vows, sins)
   - Stage 4: Animal care, animal vows (kurban), action vows (fasting/prayer/Quran/visit)

2. **Disease Knowledge Base** (50+ diseases)
   - Each disease mapped to spiritual causes (unpaid zakat, unfulfilled vows, curses, cruelty, etc.)
   - Browse-able library with search

3. **Rule-based Analysis Engine**
   - Matches user's diseases/symptoms to knowledge base
   - Aggregates cause signals from self/maternal/paternal sources
   - Generates burden scores per branch

4. **LLM Deep Analysis**
   - Claude Sonnet 4.6 personalized spiritual interpretation
   - 5-section structured output in Turkish

5. **Interactive Mind Map**
   - react-native-svg visualization
   - Maternal nodes: terracotta (#C87971)
   - Paternal nodes: slate blue (#4F6D7A)
   - Tap-to-detail modal with diseases, vows, events

## Tech Stack
- expo SDK 54
- expo-router 6
- react-native-svg
- zustand (onboarding state)
- @expo-google-fonts/cormorant-garamond, manrope
- motor (async MongoDB)
- emergentintegrations (LLM)
