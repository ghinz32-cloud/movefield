"""Collect bibliographic facts, not paper text, from the Europe PMC primary index.

Network responses/abstracts stay in ignored scratch for screening. The app ships
metadata only; finding a record never authorizes it for training or plan changes.
"""
import concurrent.futures
import datetime as dt
import hashlib
import html
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
CUTOFF = "2026-10-08"
API = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
TOPICS = {
    "Volume": '(TITLE_ABS:"resistance training" AND TITLE_ABS:volume)',
    "Frequency": '(TITLE_ABS:"resistance training" AND TITLE_ABS:frequency)',
    "Loads": '(TITLE_ABS:"resistance training" AND (TITLE_ABS:load OR TITLE_ABS:intensity))',
    "Effort and failure": '(TITLE_ABS:"resistance training" AND (TITLE_ABS:failure OR TITLE_ABS:"repetitions in reserve"))',
    "Rest intervals": '(TITLE_ABS:"resistance training" AND (TITLE_ABS:"rest interval" OR TITLE_ABS:"inter-set"))',
    "Range of motion": '(TITLE_ABS:"resistance training" AND (TITLE_ABS:"range of motion" OR TITLE_ABS:"muscle length"))',
    "Exercise selection": '(TITLE_ABS:"resistance training" AND (TITLE_ABS:"exercise selection" OR TITLE_ABS:"exercise order" OR TITLE_ABS:"single-joint"))',
    "Periodization": '(TITLE_ABS:"resistance training" AND TITLE_ABS:periodization)',
    "Time and supersets": '(TITLE_ABS:"resistance training" AND (TITLE_ABS:"time-efficient" OR TITLE_ABS:superset OR TITLE_ABS:"minimal dose"))',
    "Concurrent training": '(TITLE_ABS:"concurrent training" AND (TITLE_ABS:strength OR TITLE_ABS:hypertrophy))',
    "Running": '((TITLE_ABS:running OR TITLE_ABS:runners) AND (TITLE_ABS:"strength training" OR TITLE_ABS:"training intensity distribution" OR TITLE_ABS:"running economy"))',
    "Jumping and power": '((TITLE_ABS:plyometric OR TITLE_ABS:"power training") AND (TITLE_ABS:jump OR TITLE_ABS:athlete))',
    "Youth": '((TITLE_ABS:"resistance training" OR TITLE_ABS:"strength training") AND (TITLE_ABS:youth OR TITLE_ABS:adolescent))',
    "Older adults": '(TITLE_ABS:"resistance training" AND TITLE_ABS:"older adults")',
    "Women": '(TITLE_ABS:"resistance training" AND (TITLE_ABS:women OR TITLE_ABS:female))',
    "Adherence": '((TITLE_ABS:"resistance training" OR TITLE_ABS:"strength training") AND (TITLE_ABS:adherence OR TITLE_ABS:enjoyment))',
    "Bodyweight and bands": '((TITLE_ABS:bodyweight OR TITLE_ABS:"elastic resistance") AND (TITLE_ABS:strength OR TITLE_ABS:hypertrophy))',
    "Selected syntheses and trials": '(EXT_ID:37414459 OR EXT_ID:38090747 OR EXT_ID:35044672 OR EXT_ID:39205815 OR EXT_ID:40570881 OR EXT_ID:41869632 OR EXT_ID:39959841 OR EXT_ID:36199287 OR EXT_ID:36622555 OR EXT_ID:41343037)',
}

def collect(topic, expression):
    query = f'SRC:MED AND {expression} AND FIRST_PDATE:[2020-01-01 TO {CUTOFF}] sort_date:y'
    url = API + "?" + urllib.parse.urlencode({"query": query, "format": "json", "pageSize": 60, "resultType": "core"})
    with urllib.request.urlopen(url, timeout=45) as response:
        raw = response.read(6_000_001)
    if len(raw) > 6_000_000:
        raise ValueError("Unexpectedly large metadata response")
    data = json.loads(raw)
    return topic, query, url, data, hashlib.sha256(raw).hexdigest()

def main():
    scratch = ROOT / ".sites-runtime/research-screening"
    scratch.mkdir(parents=True, exist_ok=True)
    entries, queries = {}, []
    topics = TOPICS
    if '--curated-only' in sys.argv:
        previous = json.loads((ROOT / 'public/fitness-research.json').read_text())
        entries = {paper['pmid']: paper for paper in previous['papers']}
        queries = [query for query in previous['queries'] if query['topic'] != 'Selected syntheses and trials']
        topics = {'Selected syntheses and trials': TOPICS['Selected syntheses and trials']}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(lambda pair: collect(*pair), topics.items()))
    for topic, query, url, data, fingerprint in results:
        (scratch / (topic.lower().replace(" ", "-") + ".json")).write_text(json.dumps(data))
        rows = data.get("resultList", {}).get("result", [])
        queries.append({"topic": topic, "query": query, "url": url, "hitCount": data["hitCount"], "returned": len(rows), "responseSHA256": fingerprint})
        for row in rows:
            if row.get("source") != "MED" or not row.get("id", "").isdigit():
                continue
            first = row.get("firstPublicationDate", "")
            if not first or first > CUTOFF:
                continue
            key = row["id"]
            if key in entries:
                if topic not in entries[key]["topics"]:
                    entries[key]["topics"].append(topic)
                continue
            abstract = html.unescape(re.sub("<[^>]+>", " ", row.get("abstractText", "")))
            text = (row.get("title", "") + " " + abstract).lower()
            flags = []
            for label, pattern in [("Clinical population: individual applicability review needed", r"cancer|dialysis|chemotherapy|parkinson|stroke|heart failure|chronic obstructive|surgery|rehabilitation"), ("Protocol: no completed results inferred", r"study protocol|trial protocol"), ("Retraction/correction: excluded from app advice", r"retract|corrigendum|erratum|correction to")]:
                if re.search(pattern, text):
                    flags.append(label)
            entries[key] = {
                "id": "PMID-" + key, "pmid": key, "title": row["title"],
                "authors": row.get("authorString", ""), "year": int(row.get("pubYear", first[:4])),
                "firstPublished": first, "doi": row.get("doi", ""),
                "journal": row.get("journalInfo", {}).get("journal", {}).get("title", ""),
                "url": "https://pubmed.ncbi.nlm.nih.gov/" + key + "/",
                "pmcid": row.get("pmcid", ""), "openAccess": row.get("isOpenAccess") == "Y",
                "studyTypes": row.get("pubTypeList", {}).get("pubType", []),
                "topics": [topic], "hasAbstract": bool(abstract),
                "abstractSHA256": hashlib.sha256(abstract.encode()).hexdigest() if abstract else "",
                "reviewLevel": "search-indexed", "screeningFlags": flags,
                "approvedForModel": False,
            }
        print(f'{topic}: {len(rows)} records returned / {data["hitCount"]} search matches', flush=True)
    # A refreshed abstract only retains the recorded review label when its fingerprint matches.
    reviewed_path = ROOT / 'docs/research-reviewed-2026-10-09.json'
    if reviewed_path.exists():
        for reviewed in json.loads(reviewed_path.read_text())['papers']:
            entry = entries.get(reviewed['pmid'])
            if entry and entry['abstractSHA256'] == reviewed['abstractSHA256']:
                entry['reviewLevel'] = 'selected-abstract-reviewed'
            elif entry:
                entry['reviewLevel'] = 'search-indexed'
    archive = {
        "schema": 1, "version": "research-archive-2026-10-08", "cutoff": CUTOFF,
        "retrievedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "provider": "Europe PMC / PubMed-indexed MED records", "apiDocs": "https://europepmc.org/RestfulWebService",
        "method": "17 topic searches, up to 60 newest indexed publications per topic since 2020, plus one explicit PMID query for selected syntheses/trials; PMID deduplication. Metadata/abstract presence and explicit screening flags are not critical appraisal. No abstracts or full papers are redistributed. Findings enter the assistant only through separately reviewed original fitness-reference notes.",
        "queries": queries, "papers": sorted(entries.values(), key=lambda row: (row["firstPublished"], row["pmid"]), reverse=True),
    }
    if len(entries) < 300:
        raise ValueError("Fewer than 300 distinct records; do not publish an incomplete archive")
    (ROOT / "public/fitness-research.json").write_text(json.dumps(archive, ensure_ascii=False, indent=2) + "\n")
    print(f'Saved {len(entries)} unique primary-index records; no abstracts/model training data shipped.')

if __name__ == "__main__":
    main()
