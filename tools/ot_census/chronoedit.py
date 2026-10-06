"""Text-level editing of resolution records in the hybrid chronology YAML (flow, block, and anchor-merged styles)."""
import re


def record_bounds(lines, eid):
    pat = re.compile(r"\bentity_id: " + re.escape(eid) + r"\s*([,}]|$)")
    for i, ln in enumerate(lines):
        if pat.search(ln):
            break
    else:
        raise KeyError(eid)
    if "{" in ln and ln.lstrip().startswith("- "):
        return i, i + 1, True
    s = i
    while not lines[s].lstrip().startswith("- "):
        s -= 1
    ind = len(lines[s]) - len(lines[s].lstrip()) + 2
    e = s + 1
    while e < len(lines) and lines[e].strip() and not lines[e].lstrip().startswith("- ") and len(lines[e]) - len(lines[e].lstrip()) >= ind:
        e += 1
    return s, e, False


def anchor_of(lines, eid):
    s, e, _ = record_bounds(lines, eid)
    m = re.search(r"&([\w-]+)", lines[s])
    return m.group(1) if m else None


def merges_anchor(lines, eid, anchor):
    s, e, _ = record_bounds(lines, eid)
    return any(re.search(r"<<: \*" + re.escape(anchor) + r"\b", lines[t]) for t in range(s, e))


def set_fields(lines, eid, fields):
    s, e, flow = record_bounds(lines, eid)
    if flow:
        body = lines[s]
        for k, v in fields.items():
            pat = re.compile(r"(\b" + k + r": )(" + r'"(?:[^"\\]|\\.)*"' + r"|[^,}]+)")
            if pat.search(body):
                body = pat.sub(lambda m: m.group(1) + v, body, count=1)
            else:
                body = re.sub(r"(entity_id: " + re.escape(eid) + r")(?=[,}])", lambda m: m.group(1) + f", {k}: {v}", body, count=1)
        lines[s] = body
        return
    ind = " " * (len(lines[s]) - len(lines[s].lstrip()) + 2)
    for k, v in fields.items():
        for t in range(s, e):
            m = re.match(r"(\s*(?:- )?)" + k + r": ", lines[t])
            if m:
                lines[t] = f"{m.group(1)}{k}: {v}"
                break
        else:
            lines.insert(e, f"{ind}{k}: {v}")
            e += 1


def override(lines, eid, fields, lifespans, q):
    """Set fields on eid's resolution, first pinning any records that merge an anchor defined on it."""
    anchor = anchor_of(lines, eid)
    if anchor:
        for other, lr in lifespans.items():
            if other == eid:
                continue
            try:
                if not merges_anchor(lines, other, anchor):
                    continue
            except KeyError:
                continue
            set_fields(lines, other, {"birth_derivation_id": lr.birth_derivation_id,
                                      "death_derivation_id": lr.death_derivation_id,
                                      "explanation": q(lr.explanation)})
    set_fields(lines, eid, fields)
