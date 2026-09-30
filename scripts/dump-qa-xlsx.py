"""Extract all sheets from the manual QA xlsx as JSON rows, stdlib only."""
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {
    "s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pr": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def col_letters_to_index(letters: str) -> int:
    n = 0
    for c in letters:
        n = n * 26 + (ord(c) - ord("A") + 1)
    return n - 1


def read_shared_strings(z: zipfile.ZipFile) -> list[str]:
    try:
        data = z.read("xl/sharedStrings.xml")
    except KeyError:
        return []
    root = ET.fromstring(data)
    out: list[str] = []
    for si in root.findall("s:si", NS):
        text_parts: list[str] = []
        for t in si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"):
            text_parts.append(t.text or "")
        out.append("".join(text_parts))
    return out


def read_workbook_sheets(z: zipfile.ZipFile) -> list[tuple[str, str]]:
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rel_by_id: dict[str, str] = {}
    for r in rels.findall("pr:Relationship", NS):
        rel_by_id[r.get("Id") or ""] = r.get("Target") or ""
    out: list[tuple[str, str]] = []
    for s in wb.find("s:sheets", NS) or []:
        name = s.get("name") or ""
        rid = s.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id") or ""
        target = rel_by_id.get(rid, "")
        if target and not target.startswith("/"):
            target = "xl/" + target
        out.append((name, target.lstrip("/")))
    return out


def read_sheet(z: zipfile.ZipFile, path: str, shared: list[str]) -> list[list[str]]:
    data = z.read(path)
    root = ET.fromstring(data)
    sheet_data = root.find("s:sheetData", NS)
    rows: list[list[str]] = []
    if sheet_data is None:
        return rows
    for row in sheet_data.findall("s:row", NS):
        cells_by_col: dict[int, str] = {}
        for c in row.findall("s:c", NS):
            ref = c.get("r") or ""
            letters = "".join(ch for ch in ref if ch.isalpha())
            col = col_letters_to_index(letters) if letters else 0
            t = c.get("t")
            v = c.find("s:v", NS)
            inline = c.find("s:is", NS)
            if t == "s" and v is not None and v.text is not None:
                value = shared[int(v.text)] if int(v.text) < len(shared) else ""
            elif t == "inlineStr" and inline is not None:
                value = "".join(
                    (t2.text or "")
                    for t2 in inline.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
                )
            elif v is not None:
                value = v.text or ""
            else:
                value = ""
            cells_by_col[col] = value
        if not cells_by_col:
            rows.append([])
            continue
        max_col = max(cells_by_col.keys())
        rows.append([cells_by_col.get(i, "") for i in range(max_col + 1)])
    return rows


def main(path: str) -> None:
    with zipfile.ZipFile(path) as z:
        shared = read_shared_strings(z)
        sheets = read_workbook_sheets(z)
        out: dict[str, list[list[str]]] = {}
        for name, target in sheets:
            if not target:
                continue
            out[name] = read_sheet(z, target, shared)
    sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(sys.argv[1])
