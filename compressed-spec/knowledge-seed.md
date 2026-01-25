# Initial Knowledge Base Seed Data (Condensed)

**Version:** 2.2.0 | **Last Updated:** 2026-01-18 | **Language:** lo-LA → en-US

## Levels (4 Initial)
| ID | Title | Type |
|----|-------|------|
| script_01 | Alphabet: Consonants 1 | alphabet |
| script_02 | Alphabet: Vowels 1 | alphabet |
| basics_01 | Survival: Greetings | vocabulary |
| food_01 | Survival: Food & Drink | vocabulary |

## Alphabet Seed (3 Examples)
- **ko_kay** (ກ): Mid consonant, "K for Chicken"
- **kho_khay** (ຂ): High consonant, "Kh for Egg"
- **sara_aa** (າ): Vowel, "Long AA sound"

## Dictionary Seed (5 Core Words)
| ID | Lao | English | Category | Rank | Level |
|----|-----|---------|----------|------|-------|
| an_01 | ອັນ | piece/unit | classifier | 5 | basics_01 |
| nam_01 | ນ້ຳ | water | noun | 10 | food_01 |
| sabaidee_01 | ສະບາຍດີ | hello | particle_polite | 1 | basics_01 |
| khao_01 | ເຂົ້າ | rice/food | noun | 8 | food_01 |
| bor_01 | ບໍ່ | no/not | negation | 2 | basics_01 |

## Phrases Seed (2 Examples)
- **ph_01**: "ສະບາຍດີ ຕອນເຊົ້າ" = "Good morning" (basics_01)
- **ph_02**: "ກິນ ເຂົ້າ" = "To eat" (food_01)

## Expansion Guidelines
- Research high-frequency Lao vocabulary before adding words
- Every noun must include a `classifier_id`
- Ensure all IDs and references match knowledge_base.json schema
