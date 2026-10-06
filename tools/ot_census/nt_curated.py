"""Hand-curated knowledge for the New Testament census: books, narrative dating, fixed lives, explicit ages, dated events,
Gospel parallels, unnamed individuals, and corrections to index merges.

Years are signed: negative = BCE, positive = CE (there is no year 0).
"""

# code, work_id, title, chapters
BOOKS = [
    ("Mat", "matthew", "Matthew", 28), ("Mrk", "mark", "Mark", 16), ("Luk", "luke", "Luke", 24), ("Jhn", "john", "John", 21),
    ("Act", "acts", "Acts", 28), ("Rom", "romans", "Romans", 16), ("1Co", "1-corinthians", "1 Corinthians", 16),
    ("2Co", "2-corinthians", "2 Corinthians", 13), ("Gal", "galatians", "Galatians", 6), ("Eph", "ephesians", "Ephesians", 6),
    ("Php", "philippians", "Philippians", 4), ("Col", "colossians", "Colossians", 4), ("1Th", "1-thessalonians", "1 Thessalonians", 5),
    ("2Th", "2-thessalonians", "2 Thessalonians", 3), ("1Ti", "1-timothy", "1 Timothy", 6), ("2Ti", "2-timothy", "2 Timothy", 4),
    ("Tit", "titus", "Titus", 3), ("Phm", "philemon", "Philemon", 1), ("Heb", "hebrews", "Hebrews", 13), ("Jas", "james", "James", 5),
    ("1Pe", "1-peter", "1 Peter", 5), ("2Pe", "2-peter", "2 Peter", 3), ("1Jn", "1-john", "1 John", 5), ("2Jn", "2-john", "2 John", 1),
    ("3Jn", "3-john", "3 John", 1), ("Jud", "jude", "Jude", 1), ("Rev", "revelation", "Revelation", 22),
]
NA28_VERSIFICATION = {
    "3-john": "English 3 John 1:14b-15 is NA28 1:15.", "2-corinthians": "English 2 Corinthians 13:12-14 is NA28 13:12-13.",
    "romans": "NA28 prints Romans 16:25-27 at the end of chapter 16; some English Bibles differ in placement notes.",
    "acts": "English Acts 19:40-41 matches NA28 except for the break between 19:40 and 19:41 in some editions.",
    "revelation": "English Revelation 12:17-18 corresponds to NA28 12:18 at the chapter break.",
}
# Passages whose authenticity is disputed in the critical text (people there are still inventoried, with this note)
DISPUTED = {("Jhn", 7, 53, 8, 11): "The pericope of the adulteress (John 7:53-8:11) is absent from the earliest manuscripts; NA28 prints it in double brackets.",
            ("Mrk", 16, 9, 16, 20): "The longer ending of Mark (16:9-20) is absent from the earliest manuscripts; NA28 prints it in double brackets."}

# Narrative setting by chapter (signed years): (book, first, last, year_first, year_last)
CHAPTER_DATES = [
    ("Mat", 1, 2, -6, -4), ("Mat", 3, 4, 28, 28), ("Mat", 5, 18, 28, 29), ("Mat", 19, 25, 29, 30), ("Mat", 26, 28, 30, 30),
    ("Mrk", 1, 1, 28, 28), ("Mrk", 2, 9, 28, 29), ("Mrk", 10, 13, 29, 30), ("Mrk", 14, 16, 30, 30),
    ("Luk", 1, 1, -7, -6), ("Luk", 2, 2, -5, 8), ("Luk", 3, 4, 28, 28), ("Luk", 5, 9, 28, 29), ("Luk", 10, 19, 29, 30), ("Luk", 20, 24, 30, 30),
    ("Jhn", 1, 4, 28, 28), ("Jhn", 5, 10, 28, 29), ("Jhn", 11, 21, 30, 30),
    ("Act", 1, 7, 30, 34), ("Act", 8, 12, 34, 44), ("Act", 13, 14, 46, 48), ("Act", 15, 15, 49, 49), ("Act", 16, 18, 49, 52),
    ("Act", 19, 21, 52, 57), ("Act", 22, 26, 57, 59), ("Act", 27, 28, 59, 62),
    ("Rom", 1, 16, 57, 57), ("1Co", 1, 16, 54, 54), ("2Co", 1, 13, 55, 55), ("Gal", 1, 6, 50, 50), ("Eph", 1, 6, 61, 61),
    ("Php", 1, 4, 61, 61), ("Col", 1, 4, 61, 61), ("1Th", 1, 5, 50, 50), ("2Th", 1, 3, 51, 51), ("1Ti", 1, 6, 63, 63),
    ("2Ti", 1, 4, 65, 65), ("Tit", 1, 3, 63, 63), ("Phm", 1, 1, 61, 61), ("Heb", 1, 13, 65, 65), ("Jas", 1, 5, 50, 50),
    ("1Pe", 1, 5, 63, 63), ("2Pe", 1, 3, 65, 65), ("1Jn", 1, 5, 90, 90), ("2Jn", 1, 1, 90, 90), ("3Jn", 1, 1, 90, 90),
    ("Jud", 1, 1, 70, 70), ("Rev", 1, 22, 95, 95),
]
# Chapters whose named people are retrospective/genealogical rather than present
UNDATED_CHAPTERS = {("Mat", 1), ("Luk", 3), ("Act", 7), ("Heb", 11), ("Rom", 4), ("Rom", 9), ("Gal", 3), ("Gal", 4), ("Jas", 2), ("Jas", 5),
                    ("2Pe", 2), ("Jud", 1), ("1Pe", 3)}
LEAD_IN = 30
SPAN = 65

# Eponymous ancestors: in the NT only these contexts count as personal mentions (otherwise tribe/nation usage)
EPONYM_CONTEXTS = {("Mat", 1), ("Luk", 3), ("Act", 7), ("Heb", 11), ("Rom", 9), ("Jhn", 4)}
JACOB_PERSONAL_FORMS = {"Jacob"}
JACOB_NATION_VERSES = {("Luk", 1, 33), ("Act", 7, 46), ("Rom", 11, 26)}  # 'house of Jacob' / quotations meaning the nation  # for Israel/Jacob, refs under the form "Jacob" are mostly personal; "Israel" is the nation

# id -> (birth, death, grade, note). Signed years.
FIXED = {
    "Herod@Mat.2.1-Act": (-73, -4, "C", "King of Judea 37-4 BCE (external chronology); Jesus was born before his death (Matthew 2)."),
    "Archelaus@Mat.2.22": (-23, 18, "C", "Ethnarch of Judea 4 BCE-6 CE (Matthew 2:22)."),
    "Herod@Mat.14.1-Act": (-20, 39, "C", "Tetrarch of Galilee and Perea 4 BCE-39 CE."),
    "Philip@Luk.3.1": (-20, 34, "C", "Tetrarch 4 BCE-34 CE (Luke 3:1)."),
    "Herod@Act.12.1-": (-11, 44, "C", "King 41-44 CE; his death is narrated in Acts 12:20-23."),
    "Agrippa@Act.25.13-": (27, 93, "C", "Herod Agrippa II (Acts 25-26); death year approximate."),
    "Drusilla@Act.24.24": (38, 79, "C", "Daughter of Agrippa I, wife of Felix (Acts 24:24); died in the eruption of Vesuvius."),
    "Bernice@Act.25.13-": (28, 81, "E", "Daughter of Agrippa I (Acts 25:13); death year unknown."),
    "Augustus@Luk.2.1-Act": (-63, 14, "C", "Roman emperor 27 BCE-14 CE (Luke 2:1)."),
    "Tiberius@Mat.22.17-Jhn": (-42, 37, "C", "Roman emperor 14-37 CE (Luke 3:1)."),
    "Claudius@Act.11.28-": (-10, 54, "C", "Roman emperor 41-54 CE (Acts 11:28; 18:2)."),
    "Quirinius@Luk.2.2": (-51, 21, "C", "Governor of Syria from 6 CE (Luke 2:2)."),
    "Pilate@Mat.27.2-1Ti": (-12, 39, "E", "Prefect of Judea 26-36 CE; birth and death editorial."),
    "Annas@Luk.3.2-Act": (-23, 40, "E", "High priest 6-15 CE; birth and death editorial."),
    "Caiaphas@Mat.26.3-Act": (-14, 46, "E", "High priest about 18-36 CE; birth and death editorial."),
    "Gallio@Act.18.12-": (-5, 65, "C", "Proconsul of Achaia 51-52 CE (Acts 18:12); died 65 CE."),
    "Felix@Act.23.24-": (5, 70, "E", "Procurator of Judea about 52-60 CE; birth and death editorial."),
    "Festus@Act.24.27-": (10, 62, "E", "Procurator about 60-62 CE; died in office."),
    "Zechariah@Luk.1.5-": (-65, 0, "E", "Advanced in years when John was born (Luke 1:7,18); years editorial."),
    "Elizabeth@Luk.1.5-": (-60, 5, "E", "Advanced in years and previously barren when John was born (Luke 1:7,36); years editorial."),
    "Anna@Luk.2.36": (-89, 0, "E", "Reads Luke 2:37 as 'she was eighty-four' at Jesus' presentation; if it means a widow for 84 years she was over 100. Years editorial."),
    "Lysanias@Luk.3.1": (-20, 40, "E", "Tetrarch of Abilene in the fifteenth year of Tiberius (Luke 3:1); years editorial."),
    "Aretas@2Co.11.32": (-40, 40, "E", "Aretas IV of Nabataea, r. 9 BCE-40 CE (2 Corinthians 11:32)."),
    "Jesus@Isa.7.14-Rev": (-5, 30, "E", "Born before Herod's death (Matthew 2; Luke 1:5); about thirty when he began (Luke 3:23); crucified under Pontius Pilate. 30 CE is an editorial choice; 33 CE is the main alternative."),
    "John@Mat.3.1-Act": (-6, 29, "E", "About six months older than Jesus (Luke 1:26,36); executed by Herod Antipas. Years editorial."),
    "James@Mat.4.21-Act": (-3, 44, "C", "Killed by Herod Agrippa I (Acts 12:1-2), who died in 44 CE; birth editorial."),
    "Stephen@Act.6.5-": (-1, 34, "E", "Martyred in Jerusalem (Acts 7); year editorial."),
}
# Explicit ages and durations in NT text: (person id, predicate, value, verse, note)
EXPLICIT = [
    ("Jesus@Isa.7.14-Rev", "age_at_event", 30, "Luke 3:23", "'About thirty years of age' when he began his ministry."),
    ("Jesus@Isa.7.14-Rev", "age_at_event", 12, "Luke 2:42", "Age at the Passover visit to the temple."),
    ("Anna@Luk.2.36", "age_at_event", 84, "Luke 2:37", "Widowed after seven years of marriage; the Greek can mean she was 84, or a widow for 84 years."),
    ("jairus-daughter", "age_at_event", 12, "Mark 5:42", "Also Luke 8:42."),
    ("lame-man-beautiful-gate", "age_at_event", 40, "Acts 4:22", "'More than forty years old.'"),
    ("moses", "age_at_event", 40, "Acts 7:23", "Stephen's speech: Moses was forty when he visited his brothers (not stated in Exodus)."),
]
DATED_EVENTS = [
    # id, book code, (first, last chapter), name, type, verse, text-date value, display year, note, participants
    ("census-of-quirinius", "Luk", (2, 2), "Census decreed by Augustus when Quirinius governed Syria", "census", "Luke 2:1-2",
     {"kind": "regnal_reference", "ruler": "Augustus@Luk.2.1-Act", "governor": "quirinius"}, -5,
     "The text links the census to Quirinius; Quirinius' known census was in 6 CE, after Herod's death (4 BCE). Display year follows the Herod synchronism; the tension is unresolved.",
     ["Augustus@Luk.2.1-Act", "Quirinius@Luk.2.2", "Jesus@Isa.7.14-Rev"]),
    ("ministry-of-john-begins", "Luk", (3, 3), "The word of God comes to John in the fifteenth year of Tiberius", "call", "Luke 3:1-2",
     {"kind": "regnal_date", "king": "Tiberius@Mat.22.17-Jhn", "year_number": 15}, 28,
     "Fifteenth year of Tiberius is 28/29 CE (or 26/27 CE if counted from a co-regency).", ["John@Mat.3.1-Act", "Tiberius@Mat.22.17-Jhn", "Pilate@Mat.27.2-1Ti", "Herod@Mat.14.1-Act", "Philip@Luk.3.1", "Annas@Luk.3.2-Act", "Caiaphas@Mat.26.3-Act"]),
    ("crucifixion-of-jesus", "Mat", (27, 27), "Crucifixion of Jesus under Pontius Pilate", "death", "Matthew 27:35",
     None, 30, "Display year 30 CE is editorial (33 CE is the main alternative). John dates the crucifixion to the day of preparation (John 19:14); the Synoptics present the last supper as the Passover meal.",
     ["Jesus@Isa.7.14-Rev", "Pilate@Mat.27.2-1Ti", "Caiaphas@Mat.26.3-Act"]),
    ("death-of-herod-agrippa-i", "Act", (12, 12), "Death of Herod Agrippa I at Caesarea", "death", "Acts 12:23", None, 44, None, ["Herod@Act.12.1-"]),
    ("claudius-expels-jews-from-rome", "Act", (18, 18), "Claudius orders the Jews to leave Rome", "decree", "Acts 18:2", None, 49,
     "Display year from external sources (Suetonius; Orosius).", ["Claudius@Act.11.28-", "Aquila@Act.18.2-2Ti", "Priscilla@Act.18.2-2Ti"]),
    ("paul-before-gallio", "Act", (18, 18), "Paul brought before Gallio in Corinth", "trial", "Acts 18:12", None, 51,
     "Gallio's proconsulship (51-52 CE) is fixed by the Delphi inscription.", ["Gallio@Act.18.12-", "Paul@Act.7.58-2Pe"]),
]
# Gospel parallels: id, name, type, {code: "c:v-c:v"}, note
PARALLELS = [
    ("birth-of-jesus", "Birth of Jesus", "birth", {"Mat": "1:18-2:12", "Luk": "2:1-20"}, "Matthew and Luke give independent infancy narratives."),
    ("baptism-of-jesus", "Baptism of Jesus by John", "baptism", {"Mat": "3:13-17", "Mrk": "1:9-11", "Luk": "3:21-22", "Jhn": "1:29-34"}, None),
    ("temptation-of-jesus", "Temptation in the wilderness", "narrative", {"Mat": "4:1-11", "Mrk": "1:12-13", "Luk": "4:1-13"}, "Matthew and Luke order the temptations differently."),
    ("calling-of-first-disciples", "Calling of the first disciples", "call", {"Mat": "4:18-22", "Mrk": "1:16-20", "Luk": "5:1-11", "Jhn": "1:35-51"}, "John's account differs in setting."),
    ("sermon-on-the-mount-plain", "Sermon on the Mount / Sermon on the Plain", "speech", {"Mat": "5:1-7:29", "Luk": "6:17-49"}, None),
    ("healing-of-paralytic", "Healing of the paralytic", "healing", {"Mat": "9:1-8", "Mrk": "2:1-12", "Luk": "5:17-26"}, None),
    ("calling-of-levi-matthew", "Calling of Levi/Matthew", "call", {"Mat": "9:9-13", "Mrk": "2:13-17", "Luk": "5:27-32"}, "Matthew names him Matthew; Mark and Luke, Levi."),
    ("choosing-of-the-twelve", "Choosing of the Twelve", "call", {"Mat": "10:1-4", "Mrk": "3:13-19", "Luk": "6:12-16"}, "The lists differ: Thaddaeus (Matthew, Mark) and Judas son of James (Luke)."),
    ("stilling-of-the-storm", "Stilling of the storm", "miracle", {"Mat": "8:23-27", "Mrk": "4:35-41", "Luk": "8:22-25"}, None),
    ("healing-of-gerasene-demoniac", "Healing of the demoniac(s) across the lake", "healing", {"Mat": "8:28-34", "Mrk": "5:1-20", "Luk": "8:26-39"}, "Matthew has two men at Gadara; Mark and Luke one man at Gerasa."),
    ("jairus-daughter-and-bleeding-woman", "Jairus' daughter raised; the bleeding woman healed", "healing", {"Mat": "9:18-26", "Mrk": "5:21-43", "Luk": "8:40-56"}, None),
    ("death-of-john-the-baptist", "Death of John the Baptist", "death", {"Mat": "14:1-12", "Mrk": "6:14-29", "Luk": "9:7-9"}, None),
    ("feeding-of-five-thousand", "Feeding of the five thousand", "miracle", {"Mat": "14:13-21", "Mrk": "6:30-44", "Luk": "9:10-17", "Jhn": "6:1-15"}, None),
    ("walking-on-water", "Jesus walks on the water", "miracle", {"Mat": "14:22-33", "Mrk": "6:45-52", "Jhn": "6:16-21"}, "Only Matthew has Peter walking on the water."),
    ("peters-confession", "Peter's confession at Caesarea Philippi", "narrative", {"Mat": "16:13-20", "Mrk": "8:27-30", "Luk": "9:18-21"}, None),
    ("transfiguration", "Transfiguration", "vision", {"Mat": "17:1-8", "Mrk": "9:2-8", "Luk": "9:28-36"}, None),
    ("question-of-the-rich-man", "The rich man's question", "narrative", {"Mat": "19:16-30", "Mrk": "10:17-31", "Luk": "18:18-30"}, None),
    ("healing-of-blind-at-jericho", "Healing of the blind at Jericho", "healing", {"Mat": "20:29-34", "Mrk": "10:46-52", "Luk": "18:35-43"}, "Matthew has two blind men; Mark names Bartimaeus; Luke places it on the approach to Jericho."),
    ("triumphal-entry", "Entry into Jerusalem", "procession", {"Mat": "21:1-11", "Mrk": "11:1-11", "Luk": "19:28-40", "Jhn": "12:12-19"}, None),
    ("cleansing-of-the-temple", "Cleansing of the temple", "narrative", {"Mat": "21:12-17", "Mrk": "11:15-19", "Luk": "19:45-48", "Jhn": "2:13-22"}, "John places the cleansing at the start of the ministry; the Synoptics in the final week. Kept as one linked event with the timing difference noted."),
    ("anointing-at-bethany", "Anointing at Bethany", "narrative", {"Mat": "26:6-13", "Mrk": "14:3-9", "Jhn": "12:1-8"}, "John names Mary of Bethany; Matthew and Mark an unnamed woman. Luke 7:36-50 is a separate anointing."),
    ("last-supper", "The last supper", "meal", {"Mat": "26:17-30", "Mrk": "14:12-26", "Luk": "22:7-38", "Jhn": "13:1-38"}, "The Synoptics present it as a Passover meal; John dates it before Passover."),
    ("gethsemane-and-arrest", "Prayer in Gethsemane and arrest", "arrest", {"Mat": "26:36-56", "Mrk": "14:32-52", "Luk": "22:39-53", "Jhn": "18:1-12"}, None),
    ("peters-denials", "Peter's denials", "narrative", {"Mat": "26:69-75", "Mrk": "14:66-72", "Luk": "22:54-62", "Jhn": "18:15-27"}, None),
    ("trial-before-pilate", "Trial before Pilate", "trial", {"Mat": "27:11-26", "Mrk": "15:1-15", "Luk": "23:1-25", "Jhn": "18:28-19:16"}, "Only Luke adds the hearing before Herod Antipas."),
    ("crucifixion-and-burial", "Crucifixion and burial", "death", {"Mat": "27:32-61", "Mrk": "15:21-47", "Luk": "23:26-56", "Jhn": "19:16-42"}, None),
    ("empty-tomb", "The empty tomb", "resurrection", {"Mat": "28:1-10", "Mrk": "16:1-8", "Luk": "24:1-12", "Jhn": "20:1-18"}, "The women named at the tomb differ between the Gospels."),
    ("resurrection-appearances", "Resurrection appearances", "appearance", {"Mat": "28:16-20", "Mrk": "16:9-20", "Luk": "24:13-53", "Jhn": "20:19-21:25"}, "Mark 16:9-20 is the disputed longer ending."),
]
# Section events per book (non-Gospel)
SECTIONS = {
    "Act": [(1, 7, "The Jerusalem church", "narrative"), (8, 12, "Samaria, Saul's conversion, and Peter's mission", "narrative"),
            (13, 14, "Paul's first journey", "journey"), (15, 15, "The Jerusalem council", "council"), (16, 18, "Paul's second journey", "journey"),
            (19, 21, "Paul's third journey", "journey"), (22, 26, "Paul's arrest and trials", "trial"), (27, 28, "Voyage to Rome", "journey")],
    "Rev": [(1, 3, "Vision of the Son of Man and letters to seven churches", "vision"), (4, 22, "The throne, seals, trumpets, bowls, and new Jerusalem", "vision")],
    "Mat": [(1, 2, "Genealogy and infancy (Matthew)", "narrative"), (3, 4, "Preparation and beginning of the ministry (Matthew)", "narrative"),
            (5, 18, "Ministry in Galilee (Matthew)", "narrative"), (19, 25, "Journey to and teaching in Jerusalem (Matthew)", "narrative"),
            (26, 28, "Passion and resurrection (Matthew)", "narrative")],
    "Mrk": [(1, 1, "Beginning of the ministry (Mark)", "narrative"), (2, 9, "Ministry in Galilee (Mark)", "narrative"),
            (10, 13, "Journey to and teaching in Jerusalem (Mark)", "narrative"), (14, 16, "Passion and resurrection (Mark)", "narrative")],
    "Luk": [(1, 2, "Infancy narratives (Luke)", "narrative"), (3, 4, "John's ministry, genealogy, and temptation (Luke)", "narrative"),
            (5, 9, "Ministry in Galilee (Luke)", "narrative"), (10, 19, "Journey to Jerusalem (Luke)", "narrative"), (20, 24, "Jerusalem, passion, and resurrection (Luke)", "narrative")],
    "Jhn": [(1, 4, "Prologue and early signs (John)", "narrative"), (5, 10, "Signs and discourses at the feasts (John)", "narrative"),
            (11, 12, "Raising of Lazarus and entry into Jerusalem (John)", "narrative"), (13, 17, "Farewell discourses (John)", "speech"),
            (18, 21, "Passion and resurrection (John)", "narrative")],
}

# Index persons to drop entirely (inferences, not textual persons)
DROP_UIDS = {"wife_of_Heli@Luk.1.5", "father_of_Elizabeth@Luk.1.5", "father_of_Lazarus@Luk.10.39", "husband_of_Mary@Act.12.12",
             "father_of_Barnabas@Col.4.10", "father_of_Eunice@2Ti.1.5",
             "Lazarus@Luk.16.20-"}  # Lazarus of Luke 16 is a character in a parable, not a historical person
# Verse references removed from an index person because they belong to another (curated) individual: (uid, book, ch, v-range)
SPLIT_REFS = [
    ("Salome@Mat.20.20-Mrk", "Mat", None, "mother-of-zebedees-sons"),  # all Matthew refs: 'mother of the sons of Zebedee'
    ("John@Mat.4.21-Rev", "Rev", None, "john-of-patmos"),
    ("Jezebel@1Ki.16.31-Rev", "Rev", None, "jezebel-of-thyatira"),  # a contemporary prophetess given Ahab's queen's name            # the seer of Revelation; identity with the apostle is traditional
]
NAME_OVERRIDE = {"Salome@Mat.14.6": ("Daughter of Herodias", "Unnamed in the text (Matthew 14:6; Mark 6:22); Josephus calls her Salome.", True)}

# Curated people not (separately) in the index: id, name, gender, [(book, ch, v)], description, unnamed
CURATED = [
    ("mother-of-zebedees-sons", "Mother of the sons of Zebedee", "female", [("Mat", 20, 20), ("Mat", 27, 56)],
     "Asked Jesus for places of honor for James and John. Often identified with Salome (Mark 15:40) by comparing lists; the texts do not say so.", True),
    ("john-of-patmos", "John (the seer of Revelation)", "male", [("Rev", 1, 1), ("Rev", 1, 4), ("Rev", 1, 9), ("Rev", 22, 8)],
     "Recipient of the revelation on Patmos. Tradition identifies him with the apostle John; the text does not.", False),
    ("jezebel-of-thyatira", "Jezebel of Thyatira", "female", [("Rev", 2, 20)],
     "Self-styled prophetess at Thyatira whom the letter calls 'Jezebel'; the name is applied symbolically and is not Ahab's queen.", False),
    ("samaritan-woman-at-the-well", "Samaritan woman at the well", "female", [("Jhn", 4, 7), ("Jhn", 4, 39)], "Spoke with Jesus at Jacob's well near Sychar (John 4).", True),
    ("man-born-blind", "Man born blind", "male", [("Jhn", 9, 1), ("Jhn", 9, 35)], "Healed at the pool of Siloam (John 9).", True),
    ("parents-of-man-born-blind-father", "Father of the man born blind", "male", [("Jhn", 9, 18)], "Questioned by the Pharisees (John 9:18-23).", True),
    ("woman-caught-in-adultery", "Woman caught in adultery", "female", [("Jhn", 8, 3)], "John 8:3-11, in the disputed pericope of the adulteress.", True),
    ("royal-official-capernaum", "Royal official of Capernaum", "male", [("Jhn", 4, 46)], "His son was healed at a distance (John 4:46-53).", True),
    ("son-of-royal-official", "Son of the royal official", "male", [("Jhn", 4, 47)], "Healed at the seventh hour (John 4:46-53).", True),
    ("man-at-bethesda", "Man healed at the pool of Bethesda", "male", [("Jhn", 5, 5)], "Ill for thirty-eight years (John 5:5-15).", True),
    ("boy-with-loaves-and-fish", "Boy with five loaves and two fish", "male", [("Jhn", 6, 9)], "John 6:9.", True),
    ("master-of-the-feast-cana", "Master of the feast at Cana", "male", [("Jhn", 2, 8)], "John 2:8-10.", True),
    ("bridegroom-at-cana", "Bridegroom at Cana", "male", [("Jhn", 2, 9)], "John 2:9-10.", True),
    ("syrophoenician-woman", "Syrophoenician (Canaanite) woman", "female", [("Mrk", 7, 25), ("Mat", 15, 22)], "Her daughter was freed from a demon (Mark 7:24-30; Matthew 15:21-28).", True),
    ("daughter-of-syrophoenician-woman", "Daughter of the Syrophoenician woman", "female", [("Mrk", 7, 25), ("Mat", 15, 22)], "Mark 7:25-30.", True),
    ("centurion-of-capernaum", "Centurion of Capernaum", "male", [("Mat", 8, 5), ("Luk", 7, 2)], "His servant was healed (Matthew 8:5-13; Luke 7:1-10).", True),
    ("servant-of-centurion", "Servant of the centurion of Capernaum", "male", [("Mat", 8, 6), ("Luk", 7, 2)], "Matthew 8:6; Luke 7:2.", True),
    ("centurion-at-the-cross", "Centurion at the cross", "male", [("Mat", 27, 54), ("Mrk", 15, 39), ("Luk", 23, 47)], "Confessed Jesus at his death.", True),
    ("gerasene-demoniac", "Demoniac of the Gerasenes", "male", [("Mrk", 5, 2), ("Luk", 8, 27)], "Possessed by 'Legion' (Mark 5:1-20; Luke 8:26-39). Matthew 8:28 has two men.", True),
    ("widow-of-nain", "Widow of Nain", "female", [("Luk", 7, 12)], "Her only son was raised (Luke 7:11-17).", True),
    ("son-of-widow-of-nain", "Son of the widow of Nain", "male", [("Luk", 7, 12)], "Raised from his bier (Luke 7:11-17).", True),
    ("sinful-woman-who-anointed-jesus", "Woman who anointed Jesus in the Pharisee's house", "female", [("Luk", 7, 37)], "Luke 7:36-50; not identified with Mary Magdalene in the text.", True),
    ("woman-with-hemorrhage", "Woman with a hemorrhage", "female", [("Mrk", 5, 25), ("Mat", 9, 20), ("Luk", 8, 43)], "Ill for twelve years; healed by touching Jesus' garment.", True),
    ("jairus-daughter", "Daughter of Jairus", "female", [("Mrk", 5, 23), ("Mrk", 5, 42), ("Luk", 8, 42), ("Mat", 9, 18)], "Raised from death at twelve (Mark 5:42).", True),
    ("rich-young-man", "Rich young man", "male", [("Mat", 19, 16), ("Mrk", 10, 17), ("Luk", 18, 18)], "Luke calls him a ruler; Matthew a young man.", True),
    ("paralytic-lowered-through-roof", "Paralytic lowered through the roof", "male", [("Mrk", 2, 3), ("Mat", 9, 2), ("Luk", 5, 18)], "Mark 2:1-12.", True),
    ("leper-cleansed-in-galilee", "Leper cleansed in Galilee", "male", [("Mrk", 1, 40), ("Mat", 8, 2), ("Luk", 5, 12)], "Mark 1:40-45.", True),
    ("man-with-withered-hand", "Man with a withered hand", "male", [("Mrk", 3, 1), ("Mat", 12, 10), ("Luk", 6, 6)], "Healed on a Sabbath.", True),
    ("boy-with-unclean-spirit", "Boy with an unclean spirit", "male", [("Mrk", 9, 17), ("Mat", 17, 15), ("Luk", 9, 38)], "Healed after the transfiguration.", True),
    ("father-of-boy-with-unclean-spirit", "Father of the boy with an unclean spirit", "male", [("Mrk", 9, 17), ("Mat", 17, 14), ("Luk", 9, 38)], "'I believe; help my unbelief' (Mark 9:24).", True),
    ("wife-of-pilate", "Pilate's wife", "female", [("Mat", 27, 19)], "Sent word about her dream (Matthew 27:19).", True),
    ("penitent-criminal", "Penitent criminal crucified with Jesus", "male", [("Luk", 23, 40)], "Luke 23:40-43.", True),
    ("impenitent-criminal", "Criminal who mocked Jesus on the cross", "male", [("Luk", 23, 39)], "Luke 23:39.", True),
    ("young-man-who-fled-naked", "Young man who fled naked", "male", [("Mrk", 14, 51)], "Mark 14:51-52.", True),
    ("servant-girl-who-questioned-peter", "Servant girl who questioned Peter", "female", [("Mrk", 14, 66), ("Mat", 26, 69), ("Luk", 22, 56), ("Jhn", 18, 17)],
     "The doorkeeper girl of John 18:17. The Synoptics mention one or two servant girls; one entry is kept.", True),
    ("woman-who-anointed-jesus-at-bethany", "Woman who anointed Jesus at Bethany", "female", [("Mat", 26, 7), ("Mrk", 14, 3)], "John 12:3 names Mary of Bethany; Matthew and Mark do not name her.", True),
    ("poor-widow-at-the-treasury", "Poor widow at the treasury", "female", [("Mrk", 12, 42), ("Luk", 21, 2)], "Gave two small coins.", True),
    ("man-with-dropsy", "Man with dropsy", "male", [("Luk", 14, 2)], "Healed on a Sabbath (Luke 14:1-6).", True),
    ("samaritan-leper-who-returned", "Samaritan leper who returned to give thanks", "male", [("Luk", 17, 15)], "Luke 17:11-19.", True),
    ("bent-woman", "Woman bent over for eighteen years", "female", [("Luk", 13, 11)], "Healed in a synagogue on a Sabbath (Luke 13:10-17).", True),
    ("lame-man-beautiful-gate", "Lame man at the Beautiful Gate", "male", [("Act", 3, 2), ("Act", 4, 22)], "Healed by Peter and John; over forty years old (Acts 4:22).", True),
    ("ethiopian-eunuch", "Ethiopian eunuch", "male", [("Act", 8, 27)], "Treasurer of Candace, baptized by Philip (Acts 8:26-39).", True),
    ("philippian-jailer", "Philippian jailer", "male", [("Act", 16, 27)], "Baptized with his household (Acts 16:25-34).", True),
    ("slave-girl-of-philippi", "Slave girl with a spirit of divination", "female", [("Act", 16, 16)], "Acts 16:16-18.", True),
    ("lame-man-of-lystra", "Lame man of Lystra", "male", [("Act", 14, 8)], "Acts 14:8-10.", True),
    ("sister-of-paul", "Paul's sister", "female", [("Act", 23, 16)], "Mother of the nephew who warned of the plot (Acts 23:16).", True),
    ("nephew-of-paul", "Paul's nephew", "male", [("Act", 23, 16)], "Warned of the plot against Paul (Acts 23:16-22).", True),
    ("town-clerk-of-ephesus", "Town clerk of Ephesus", "male", [("Act", 19, 35)], "Quieted the riot (Acts 19:35-41).", True),
    ("the-egyptian-rebel", "The Egyptian who led a revolt", "male", [("Act", 21, 38)], "Rebel with whom Paul was confused (Acts 21:38).", True),
    ("man-with-fathers-wife-corinth", "Corinthian man living with his father's wife", "male", [("1Co", 5, 1)], "1 Corinthians 5:1-5.", True),
]
CURATED_PARENTS = [("sister-of-paul", "nephew-of-paul"), ("syrophoenician-woman", "daughter-of-syrophoenician-woman"),
                   ("widow-of-nain", "son-of-widow-of-nain"), ("royal-official-capernaum", "son-of-royal-official"),
                   ("parents-of-man-born-blind-father", "man-born-blind"), ("father-of-boy-with-unclean-spirit", "boy-with-unclean-spirit")]
CURATED_PARENTS_INDEX = [(("Jairus", ""), "jairus-daughter"), (("Zebedee", ""), "mother-of-zebedees-sons")]  # second pair is a spouse link, see ntgen
SPOUSES_INDEX = [("Pilate@Mat.27.2-1Ti", "wife-of-pilate")]

# Genealogy policy: Matthew 1 and Luke 3 disagree with each other and with Chronicles. Parent links from these chapters are only
# added when they do not conflict; conflicts become parent_reference claims (Joseph's father Jacob vs Heli; Shealtiel's father;
# 'Joram fathered Uzziah', 'Josiah fathered Jechoniah').
GENEALOGY_CHAPTERS = {("Mat", 1), ("Luk", 3)}
MANUAL_MAP = {"Cainan@Luk.3.36": "cainan-postflood"}  # Luke 3:36 follows the Septuagint's post-flood Cainan
SENTINELS = [("sinodos-sirate-tsion", "Sinodos: Sirate Tsion"), ("sinodos-tizaz", "Sinodos: Tizaz"), ("sinodos-gitsew", "Sinodos: Gitsew"),
             ("sinodos-abtilis", "Sinodos: Abtilis"), ("book-of-covenant-1", "Book of the Covenant 1"), ("book-of-covenant-2", "Book of the Covenant 2"),
             ("ethiopic-clement", "Ethiopic Clement"), ("ethiopic-didascalia", "Ethiopic Didascalia")]
# Verses not in the NA28 text (later additions printed in the Majority/KJV tradition): references there are dropped.
NOT_IN_NA28 = {("Act", 8, 37), ("Act", 15, 34), ("Act", 24, 7), ("Act", 24, 8)}
# The index carries some names from KJV subscriptions printed after an epistle's last verse (e.g. "written ... by Titus and Lucas").
# References in a book's final two verses are kept only when the verse text names the person.
SUBSCRIPTION_CHECK_VERSES = 2
WEB_CODES = {"Mat": "MAT", "Mrk": "MAR", "Luk": "LUK", "Jhn": "JOH", "Act": "ACT", "Rom": "ROM", "1Co": "1CO", "2Co": "2CO", "Gal": "GAL",
             "Eph": "EPH", "Php": "PHI", "Col": "COL", "1Th": "1TH", "2Th": "2TH", "1Ti": "1TI", "2Ti": "2TI", "Tit": "TIT", "Phm": "PHM",
             "Heb": "HEB", "Jas": "JAM", "1Pe": "1PE", "2Pe": "2PE", "1Jn": "1JO", "2Jn": "2JO", "3Jn": "3JO", "Jud": "JUD", "Rev": "REV"}
