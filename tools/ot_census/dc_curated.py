"""Curated configuration for the deuterocanonical and Ethiopic broader-canon books."""

# code -> (work_id, title, census witness id, census source id, has LXX witness, Ethiopic narrower canon member)
DC_BOOKS = {
    "TOB": ("tobit", "Tobit", "web", True), "JDT": ("judith", "Judith", "web", True),
    "WIS": ("wisdom-of-solomon", "Wisdom of Solomon", "web", True), "SIR": ("sirach", "Sirach", "web", True),
    "BAR": ("baruch", "Baruch", "web", True), "1MA": ("1-maccabees", "1 Maccabees", "web", True),
    "2MA": ("2-maccabees", "2 Maccabees", "web", True), "3MA": ("3-maccabees", "3 Maccabees", "web", True),
    "4MA": ("4-maccabees", "4 Maccabees", "web", True), "1ES": ("1-esdras", "1 Esdras", "web", True),
    "PRM": ("prayer-of-manasseh", "Prayer of Manasseh", "web", True), "PSX": ("psalm-151", "Psalm 151", "web", True),
    "4ES": ("ezra-sutuel", "4 Ezra (Ezra Sutuel)", "web", False),
    "ENO": ("1-enoch", "1 Enoch", "charles-enoch", False), "JUB": ("jubilees", "Jubilees", "charles-jubilees", False),
}
# Greek additions carried inside the WEB's full Greek Esther and Daniel: code -> work for verses inside the addition ranges
ADDITION_BOOKS = {"ESG": "additions-to-esther", "DNG": None}  # DNG ranges map to prayer-of-azariah / susanna / bel-and-dragon
ADDITION_TITLES = {"additions-to-esther": "Additions to Esther", "prayer-of-azariah": "Prayer of Azariah", "susanna": "Susanna",
                   "bel-and-dragon": "Bel and the Dragon", "letter-of-jeremiah": "Letter of Jeremiah"}

# Narrative setting by chapter (BCE), for display windows: code -> [(first_ch, last_ch, year_first, year_last)]
CHAPTER_DATES = {
    "TOB": [(1, 14, 725, 680)], "JDT": [(1, 16, 590, 585)], "1ES": [(1, 1, 622, 586), (2, 2, 538, 520), (3, 4, 520, 520),
                                                                    (5, 7, 538, 515), (8, 9, 458, 457)],
    "SIR": [(1, 51, 190, 180)], "BAR": [(1, 5, 581, 581), (6, 6, 597, 597)], "1MA": [(1, 1, 333, 167), (2, 2, 167, 166),
                                                                                   (3, 9, 166, 160), (10, 12, 152, 143), (13, 16, 142, 134)],
    "2MA": [(1, 2, 124, 124), (3, 3, 178, 178), (4, 7, 175, 167), (8, 15, 166, 161)], "3MA": [(1, 7, 217, 216)],
    "4MA": [(1, 18, 167, 167)], "PRM": [(1, 1, 680, 680)], "PSX": [(1, 1, 1025, 1025)], "4ES": [(3, 14, 557, 557)],
    "WIS": [(1, 19, 960, 960)],
    "additions-to-esther": [(1, 16, 474, 474)], "prayer-of-azariah": [(3, 3, 595, 595)], "susanna": [(13, 13, 590, 590)],
    "bel-and-dragon": [(14, 14, 538, 538)],
}

# Rulers and figures with external historical dates (grade C): new_id -> (birth, death, note)
FIXED = {
    "alexander-the-great": (356, 323, "Alexander III of Macedon (r. 336-323 BCE)."),
    "antiochus-iv-epiphanes": (215, 164, "Seleucid king 175-164 BCE."),
    "antiochus-v-eupator": (173, 162, "Seleucid king 164-162 BCE; executed as a boy."),
    "seleucus-iv-philopator": (218, 175, "Seleucid king 187-175 BCE."),
    "demetrius-i-soter": (185, 150, "Seleucid king 162-150 BCE."),
    "alexander-balas": (173, 145, "Seleucid king 150-145 BCE."),
    "demetrius-ii-nicator": (161, 125, "Seleucid king 145-139 and 129-125 BCE."),
    "antiochus-vi-dionysus": (148, 142, "Seleucid boy-king 145-142 BCE."),
    "trypho": (180, 138, "Diodotus Tryphon, usurper 142-138 BCE."),
    "antiochus-vii-sidetes": (164, 129, "Seleucid king 138-129 BCE."),
    "ptolemy-vi-philometor": (186, 145, "Ptolemaic king 180-145 BCE."),
    "ptolemy-iv-philopator": (244, 204, "Ptolemaic king 221-204 BCE; Raphia 217 BCE."),
    "antiochus-iii-the-great": (241, 187, "Seleucid king 222-187 BCE."),
    "mattathias-hasmonean": (240, 166, "Died in the Seleucid year 146 (1 Maccabees 2:70), i.e. 166 BCE."),
    "judas-maccabeus": (200, 160, "Killed in the Seleucid year 152 (1 Maccabees 9:3), about 160 BCE."),
    "jonathan-apphus": (195, 143, "Captured by Trypho and killed about 143 BCE (1 Maccabees 13:23)."),
    "simon-thassi": (195, 134, "Killed in the Seleucid year 177, month Shebat (1 Maccabees 16:14), about 134 BCE."),
    "john-hyrcanus": (170, 104, "Ruled 134-104 BCE (external)."),
    "eleazar-martyr": (257, 167, "Aged ninety at his martyrdom under Antiochus IV (2 Maccabees 6:24), about 167 BCE."),
    "simon-son-of-onias-high-priest": (255, 195, "Simon II, high priest about 219-196 BCE (Sirach 50; 3 Maccabees 2:1); identification and dates are editorial."),
    "jesus-son-of-sirach": (235, 170, "Ben Sira wrote about 190-180 BCE; his grandson translated the book in Egypt after 132 BCE. Dates are editorial."),
}
