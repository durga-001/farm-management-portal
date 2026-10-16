"""All thresholds live here so a vet can review/tune them. Rule-based engine v1."""

ENGINE_VERSION = "rules-v1.0"

# --- usage pattern rules -------------------------------------------------
RECENT_WINDOW_DAYS = 90        # look-back window for frequency rules
FREQ_MEDIUM = 3                # >= this many antimicrobial treatments in window
FREQ_HIGH = 5
SAME_DRUG_REPEAT_COUNT = 2     # same drug used this many times in window
SHORT_INTERVAL_DAYS = 14       # gap between consecutive antimicrobial treatments
VERY_SHORT_INTERVAL_DAYS = 3

# --- peer comparison -----------------------------------------------------
MIN_PEERS = 5                  # need at least this many same-type peers
PEER_Z_THRESHOLD = 2.0
PEER_STD_FLOOR = 0.5           # avoids division by ~0 when peers are all equal
PEER_MIN_COUNT = 2             # never flag an animal with fewer treatments

# --- dose rules (only used when a vet-entered reference exists) ----------
DOSE_HIGH_RATIO = 1.25
DOSE_LOW_RATIO = 0.5
DURATION_LONG_RATIO = 1.5

# --- record quality rules ------------------------------------------------
LATE_ENTRY_DAYS = 7
DUPLICATE_WINDOW_HOURS = 24
BATCH_ENTRY_MINUTES = 10       # many records entered within this many minutes...
BATCH_MIN_RECORDS = 4          # ...at least this many records...
BATCH_MIN_SPAN_DAYS = 7        # ...whose treatment dates span at least this long
RECORD_QUALITY_POINT_CAP = 4   # missing-field points are capped (fields are optional in the UI)

# --- clearance confidence ------------------------------------------------
CONF_NO_REFERENCE = 0.30
CONF_FARMER_BELOW_REF = 0.25
CONF_DOSE_MISSING = 0.10
CONF_DOSE_HIGH = 0.20
CONF_LATE_ENTRY = 0.15
CONF_JUST_CLEARED = 0.20       # cleared < 1 day ago
CONF_HIGH_AT = 0.75
CONF_MEDIUM_AT = 0.50

LEVEL_HIGH = 6
LEVEL_MEDIUM = 3

SPECIES_SYNONYMS = {
    "cow": {"cow", "cows", "cattle", "bovine"},
    "buffalo": {"buffalo", "buffaloes", "bovine"},
    "goat": {"goat", "goats", "caprine"},
    "sheep": {"sheep", "ovine"},
    "poultry": {"poultry", "chicken", "chickens", "hen", "broiler", "layer"},
}