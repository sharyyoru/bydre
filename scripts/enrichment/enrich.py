#!/usr/bin/env python3
"""
Contact Enrichment Pipeline
Reads contacts from CSV, enriches via People Data Labs API, outputs enriched CSV.

Usage:
    python enrich.py --input raw_contacts.csv --output enriched_investors.csv
"""

import argparse
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv

from phone_sanitizer import normalize_to_e164
from pdl_client import PDLClient, EnrichedContact

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Rate limiting: PDL allows 10 req/sec, we use 8 for safety buffer
REQUESTS_PER_SECOND = 8
REQUEST_INTERVAL = 1.0 / REQUESTS_PER_SECOND

# Save progress every N records
SAVE_INTERVAL = 10


def load_input_csv(filepath: str) -> pd.DataFrame:
    """Load and validate input CSV."""
    path = Path(filepath)
    
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {filepath}")
    
    df = pd.read_csv(filepath)
    
    # Check required columns
    required_cols = ["Name", "Phone_Number"]
    missing = [col for col in required_cols if col not in df.columns]
    
    if missing:
        # Try alternative column names
        alt_names = {
            "name": "Name",
            "full_name": "Name",
            "contact_name": "Name",
            "phone": "Phone_Number",
            "phone_number": "Phone_Number",
            "mobile": "Phone_Number",
            "telephone": "Phone_Number",
        }
        
        for old, new in alt_names.items():
            if old in df.columns and new not in df.columns:
                df = df.rename(columns={old: new})
        
        # Check again
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            raise ValueError(
                f"Missing required columns: {missing}. "
                f"CSV must have 'Name' and 'Phone_Number' columns."
            )
    
    logger.info(f"Loaded {len(df)} contacts from {filepath}")
    return df


def load_existing_output(filepath: str) -> set:
    """Load already-processed phone numbers from existing output file."""
    path = Path(filepath)
    
    if not path.exists():
        return set()
    
    df = pd.read_csv(filepath)
    processed = set(df["Phone_Number"].dropna().astype(str))
    
    logger.info(f"Found {len(processed)} already-processed contacts in {filepath}")
    return processed


def save_result(result: EnrichedContact, filepath: str, is_first: bool = False):
    """Append a single result to the output CSV."""
    data = result.to_dict()
    df = pd.DataFrame([data])
    
    # Write header only if it's the first record and file doesn't exist
    write_header = is_first or not Path(filepath).exists()
    
    df.to_csv(
        filepath,
        mode="a" if not is_first else "w",
        header=write_header,
        index=False,
    )


def save_batch(results: list[EnrichedContact], filepath: str):
    """Save a batch of results to the output CSV."""
    if not results:
        return
    
    data = [r.to_dict() for r in results]
    df = pd.DataFrame(data)
    
    # Append if file exists, otherwise create new
    write_header = not Path(filepath).exists()
    
    df.to_csv(
        filepath,
        mode="a",
        header=write_header,
        index=False,
    )


def enrich_contacts(
    input_file: str,
    output_file: str,
    dry_run: bool = False,
    limit: int = None,
):
    """
    Main enrichment pipeline.
    
    Args:
        input_file: Path to input CSV with Name, Phone_Number columns
        output_file: Path to output CSV for enriched data
        dry_run: If True, only sanitize phones without API calls
        limit: Maximum number of contacts to process (for testing)
    """
    start_time = datetime.now()
    
    # Load input data
    df = load_input_csv(input_file)
    
    # Load already-processed contacts for resume capability
    processed_phones = load_existing_output(output_file)
    
    # Initialize PDL client (skip in dry run mode)
    client = None
    if not dry_run:
        try:
            client = PDLClient()
            logger.info("PDL client initialized successfully")
        except ValueError as e:
            logger.error(f"Failed to initialize PDL client: {e}")
            logger.error("Set PDL_API_KEY in your .env file")
            sys.exit(1)
    
    # Stats tracking
    stats = {
        "total": len(df),
        "processed": 0,
        "enriched": 0,
        "failed": 0,
        "skipped": 0,
        "invalid_phone": 0,
    }
    
    # Apply limit if specified
    if limit:
        df = df.head(limit)
        stats["total"] = len(df)
        logger.info(f"Limited to {limit} contacts")
    
    # Batch for periodic saving
    pending_results = []
    
    logger.info("=" * 60)
    logger.info("Starting enrichment pipeline")
    logger.info(f"Input: {input_file}")
    logger.info(f"Output: {output_file}")
    logger.info(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    logger.info("=" * 60)
    
    for idx, row in df.iterrows():
        row_num = idx + 1
        name = str(row.get("Name", "")).strip()
        raw_phone = str(row.get("Phone_Number", "")).strip()
        
        # Sanitize phone number
        phone = normalize_to_e164(raw_phone)
        
        if not phone:
            logger.warning(f"[INVALID] Row {row_num}: '{name}' - Invalid phone: '{raw_phone}'")
            stats["invalid_phone"] += 1
            
            # Save invalid record with error
            result = EnrichedContact(
                name=name,
                phone=raw_phone,
                error="Invalid phone number",
            )
            pending_results.append(result)
            continue
        
        # Skip if already processed
        if phone in processed_phones:
            logger.debug(f"[SKIP] Row {row_num}: '{name}' - Already processed")
            stats["skipped"] += 1
            continue
        
        # Dry run mode - just show sanitized number
        if dry_run:
            logger.info(f"[DRY RUN] Row {row_num}: '{name}' | {raw_phone} -> {phone}")
            stats["processed"] += 1
            continue
        
        # Rate limiting
        time.sleep(REQUEST_INTERVAL)
        
        # Call PDL API
        result = client.identify_person(name=name, phone=phone)
        stats["processed"] += 1
        
        if result.is_enriched:
            stats["enriched"] += 1
            logger.info(
                f"[SUCCESS] Row {row_num}: {name} -> "
                f"{result.email or 'no email'} | "
                f"{result.linkedin_url or 'no LinkedIn'}"
            )
        else:
            stats["failed"] += 1
            logger.warning(
                f"[FAILED] Row {row_num}: {name} -> {result.error or 'No data found'}"
            )
        
        pending_results.append(result)
        processed_phones.add(phone)
        
        # Periodic save
        if len(pending_results) >= SAVE_INTERVAL:
            save_batch(pending_results, output_file)
            pending_results = []
            logger.debug(f"Progress saved ({stats['processed']}/{stats['total']})")
    
    # Save any remaining results
    if pending_results:
        save_batch(pending_results, output_file)
    
    # Print summary
    elapsed = (datetime.now() - start_time).total_seconds()
    success_rate = (stats["enriched"] / max(stats["processed"], 1)) * 100
    
    logger.info("=" * 60)
    logger.info("ENRICHMENT COMPLETE")
    logger.info("=" * 60)
    logger.info(f"Total contacts:     {stats['total']}")
    logger.info(f"Processed:          {stats['processed']}")
    logger.info(f"Enriched:           {stats['enriched']}")
    logger.info(f"Failed:             {stats['failed']}")
    logger.info(f"Skipped (existing): {stats['skipped']}")
    logger.info(f"Invalid phones:     {stats['invalid_phone']}")
    logger.info(f"Success rate:       {success_rate:.1f}%")
    logger.info(f"Time elapsed:       {elapsed:.1f} seconds")
    logger.info(f"Output saved to:    {output_file}")
    logger.info("=" * 60)
    
    return stats


def main():
    parser = argparse.ArgumentParser(
        description="Enrich contacts with email and LinkedIn data via People Data Labs API"
    )
    
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Path to input CSV file (must have Name and Phone_Number columns)",
    )
    
    parser.add_argument(
        "--output", "-o",
        default="enriched_investors.csv",
        help="Path to output CSV file (default: enriched_investors.csv)",
    )
    
    parser.add_argument(
        "--dry-run", "-d",
        action="store_true",
        help="Sanitize phone numbers only, no API calls",
    )
    
    parser.add_argument(
        "--limit", "-l",
        type=int,
        default=None,
        help="Limit number of contacts to process (for testing)",
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging",
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        enrich_contacts(
            input_file=args.input,
            output_file=args.output,
            dry_run=args.dry_run,
            limit=args.limit,
        )
    except KeyboardInterrupt:
        logger.warning("\nInterrupted by user. Progress has been saved.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
