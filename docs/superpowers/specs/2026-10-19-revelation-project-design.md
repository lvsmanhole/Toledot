# The Revelation Project: design

Date: 2026-10-19. Status: draft for approval.

## Intent

A full, detailed animation of the Book of Revelation, chapters 1 to 22, for the Toledot site. It opens
on John, an old man in exile on the rocky island of Patmos on the Lord's day. A great voice like a
trumpet sounds behind him. He turns, and from then on the reader sees **through John's eyes**: what he
sees, in the order he sees it, as the text describes it.

The user's words: "John on the Isle of Patmos... taken into his vision of the book", "plan it out from
that point fully as described in the text", and "all beast, all angels, all events".

The Journey (`journey/`) already ends with three short, deliberately stylised Revelation scenes
(`patmos`, `throne`, `newcreation`, about 74 scroll units in all). They summarise the book. This project
is the opposite: nothing summarised, nothing skipped.

## Goals

1. **Every event in the text, in text order.** Each event listed in the Scene Inventory below gets its
   own animated moment. "Every" means the inventory is the acceptance checklist.
2. **Every beast and every angel**, shown with the features the text gives. When a creature is
   described feature by feature (the four beasts, the locusts, the horsemen's horses, the dragon, the
   beast from the sea), every listed feature is visible.
3. **John's eyes.** After the opening, the camera is John. It turns when he turns, falls when he falls
   (1:17, 19:10, 22:8), and is carried when he is carried (4:2, 17:3, 21:10). His own hands appear
   when he acts: he is touched (1:17), eats the little book (10:10), takes the measuring reed (11:1) and
   writes (1:11, 1:19, 14:13, 19:9, 21:5).
4. **The words on screen are the King James text**, as in the Journey, checked by the same test
   against the KJV fixture.
5. **Works where the Journey works:** desktop browsers, iPhone and iPad Safari, low-memory phones.

## Non-goals

- **Interpretation.** The page shows what John says he saw. It does not identify the beast, the
  whore, the seven kings, the two witnesses or the 144,000 with any historical person, nation or
  church, and it takes no millennial or timeline position. When the text explains its own symbols
  (1:20 stars and candlesticks; 17:9–18 heads, horns, waters, woman), the explanation is shown because
  it is in the text, and nothing is added to it.
- Spoken narration. The words are captions, as in the Journey. Sound is ambience and effects.
- Replacing the Journey's three Revelation scenes. They stay as the Journey's ending, which links here.
- Video export. This is a live, scroll-driven 3D page, not a rendered film.

## Anti-goals (it fails even if it "works" if...)

- An event, angel or beast from the inventory is missing or merged into a montage.
- Something appears that the text does not describe: invented creatures, extra horns, a face on the
  One on the throne, labels such as "Rome" or "Nero".
- It reads as a horror film or a cartoon. The register is awe: vast scale, light, fire, sound and
  silence. Terrible events (the winepress, the gnawed tongues, the supper of the fowls) are shown at
  the scale the text gives, not as close-up gore.
- It crashes or stalls on an iPhone, which the Journey has already been fixed for twice.

## How it is shown

### Depiction rules

1. **Literal first.** "Like unto", "as it were" and "as" describe what John saw, so the visual takes
   the comparison literally: hair "white like wool, as white as snow", feet "like unto fine brass, as if
   they burned in a furnace".
2. **Numbers are exact** where they can be counted on screen: seven candlesticks, seven stars, seven
   horns, seven eyes, twenty-four elders, four beasts with six wings each, seven heads, ten horns, the
   right count of crowns on heads or horns (12:3 crowns on heads; 13:1 crowns on horns), twelve gates,
   twelve foundations in the order of 21:19–20. Numbers too large to count (the 200 million horsemen,
   ten thousand times ten thousand angels, the 144,000) are shown as multitudes that read as that scale.
3. **God on the throne** (4:2–3) is never given a human form, because the text gives none. He is seen
   as light "like a jasper and a sardine stone", inside the emerald rainbow.
4. **The Son of Man** (1:13–16) and **the rider Faithful and True** (19:11–16) have a human form with
   every listed feature. The face is "as the sun shineth in his strength", so it is light; no facial
   features are drawn.
5. **The Lamb** is a lamb "as it had been slain" (a visible wound), with seven horns and seven eyes.
6. **The text's explanations are captions**, not overlays. When the angel explains the seven heads
   (17:9), the camera shows the heads and the seven mountains, and the KJV caption says it.
7. **Written names (my call).** When the text gives the words of a name, they are readable in the scene
   exactly as KJV prints them: MYSTERY, BABYLON THE GREAT... (17:5); KING OF KINGS, AND LORD OF LORDS
   (19:16); the number "Six hundred threescore and six" (13:18). When the text says a name is written but
   does not give the words, it is shown as a glowing mark that cannot be read. This covers the names of
   blasphemy (13:1, 17:3), the white stone's new name (2:17), the seal and the Father's name on foreheads
   (7:3, 14:1, 22:4), the mark (13:16) and the name no man knew (19:12). Nothing readable is invented.
8. **Woes, voices and thunders are events.** The eagle-angel's three woes (8:13), the seven thunders
   (10:3–4) and "It is done" (16:17) each get their own moment, because the user asked for every event.

### Point of view

- **Scene 1 opens outside John**: wide over a dark sea, down to the island, to an old man on the rocks
  at first light. As the trumpet voice sounds behind him, the camera moves into his eyes and stays
  there to the end.
- **Last shot (my call):** after "Even so, come, Lord Jesus" the vision closes and we are back on the
  rocks of Patmos, looking down at John's hand finishing the scroll (1:11, "What thou seest, write in a
  book"). It closes the frame the opening set up, and the text supports it.
- Moments where John's body matters are listed in the inventory with **[John]**.

### Pacing and form

- The same scroll-driven form as the Journey: scrolling advances the story; captions fade in and out;
  a rail of acts lets the reader jump; deep links (`#u=`) work.
- **Rough length (my call):** about 36 scenes, 1,000 to 1,300 scroll units. That is roughly the
  Journey's length again, for one book. The builder may rebalance scene lengths; the inventory is
  fixed, the timings are not.
- **Act rail:** Prologue; I The Son of Man; II The Seven Churches; III The Throne and the Lamb; IV The
  Seven Seals; V The Seven Trumpets; VI The Woman, the Dragon and the Beasts; VII The Seven Vials;
  VIII Babylon; IX The Rider and the Thousand Years; X The New Jerusalem; Epilogue.

## Where it lives and what it is built with (my calls, built on what exists)

- A second page on the site at **`/revelation/`**, linked from the Journey's end card and from the
  Journey's Revelation act.
- **Same engine:** Three.js + Vite in `journey/`, as a second Vite entry page. It reuses the director
  (`journey/src/main.js`), the kit (`journey/src/kit/`), post-processing, sound and the Poly Haven asset
  pipeline. The director must be generalised to take a story (the scene list, captions and acts) as a
  parameter instead of importing `story.js` directly. The Journey must behave exactly as before.
- **Story file:** `journey/src/revelation/story.js` in the same shape as `journey/src/story.js`, with
  scene modules in `journey/src/revelation/scenes/`.
- **Tests:** the existing story tests run against both stories (tiling, transitions, caption order,
  KJV match). The KJV fixture script must add every verse the Revelation captions cite.
- **No Chronicle timeline on this page** (my call). The whole vision is one moment, about AD 95, so a
  people timeline adds nothing. The year stays at "AD 95 · Patmos" in the header.
- **Phones:** the Journey's rules apply: one scene in memory at a time on phones, gradual shader
  compile, mobile asset set, density budget. Multitudes (horsemen, angels, the great multitude) must
  use instancing and the `scaled()` budget.

### Creatures and figures

These are generated 3D models; see "Decided by the user" at the end. The models join the existing asset
pipeline (`journey/scripts/fetch-assets.mjs`, the mobile model set in `public/lib/models-m`), and each
has a credit line in `CREDITS.txt`. John's first-person hands are a model too.

## Scene inventory

This is the acceptance checklist. Each bullet is an event that must be seen. Verse numbers are KJV.
**[John]** marks a first-person body moment. Scene names are working names.

### Prologue: The Revelation of Jesus Christ (1:1–8)
**Staging (my call):** the Prologue is a title sequence with no point of view. It plays over the dark
sea at night before the island comes into view, so the move into John's eyes in scene 1 stays the first
point-of-view moment. No human figure appears in it. "He cometh with clouds" is shown as clouds massing
over the sea. The angel of 1:1 is a single light coming down toward the island. That light is the camera's
guide down to Patmos.
- Title: "The Revelation of Jesus Christ, which God gave unto him... and he sent and signified it by
  his angel unto his servant John" (1:1). The angel who brings the vision is seen.
- "Blessed is he that readeth" (1:3). Grace from him which is, was and is to come, and from the seven
  Spirits before his throne (1:4).
- "Behold, he cometh with clouds; and every eye shall see him" (1:7).
- "I am Alpha and Omega, the beginning and the ending" (1:8).

### 1. Patmos (1:9–11)
- An old man in exile on Patmos "for the word of God" (1:9). Rocks, sea, first light.
- "I was in the Spirit on the Lord's day" (1:10): the light and sound change.
- A great voice as of a trumpet behind him: "I am Alpha and Omega... What thou seest, write in a book,
  and send it unto the seven churches" (1:10–11), naming all seven.
- The camera moves into John's eyes.

### 2. The Son of Man among the candlesticks (1:12–20)
- **[John]** He turns to see the voice (1:12).
- Seven golden candlesticks.
- In their midst one like the Son of man (1:13–16), every feature: garment down to the foot; golden
  girdle about the paps; head and hairs white like wool, as white as snow; eyes as a flame of fire;
  feet like fine brass burned in a furnace; voice as the sound of many waters; seven stars in his right
  hand; a sharp two-edged sword out of his mouth; countenance as the sun shining in his strength.
- **[John]** He falls at his feet as dead (1:17). The right hand is laid on him. "Fear not; I am the
  first and the last."
- "I am he that liveth, and was dead... and have the keys of hell and of death" (1:18). The keys are
  seen.
- "Write the things which thou hast seen" (1:19). The mystery explained: the seven stars are the angels
  of the seven churches; the seven candlesticks are the seven churches (1:20).

### 3. The seven churches (2–3)
One beat per church, in text order. For each: its candlestick and star brighten; a glimpse of the city
(a map beat of the seven cities on their road from Ephesus round to Laodicea, built with the existing
map kit); the title of Christ that opens the letter; the charge; the promise "to him that overcometh",
shown as its object.
- **Ephesus** (2:1–7): he that holdeth the seven stars and walketh among the candlesticks. Labour and
  patience; "thou hast left thy first love"; the threat to remove the candlestick (that candlestick
  flickers); the Nicolaitans. Promise: the tree of life in the paradise of God.
- **Smyrna** (2:8–11): the first and the last, which was dead and is alive. Tribulation and poverty
  ("but thou art rich"); prison ten days; "be thou faithful unto death". Promise: a crown of life; not
  hurt of the second death.
- **Pergamos** (2:12–17): he which hath the sharp sword with two edges. Where Satan's seat is; Antipas
  the faithful martyr; the doctrine of Balaam and Balac; the Nicolaitans. Promise: hidden manna, a white
  stone with a new name written.
- **Thyatira** (2:18–29): the Son of God, eyes like a flame of fire, feet like fine brass. Works,
  charity, service; "that woman Jezebel". Promise: power over the nations, the rod of iron, the
  vessels of a potter broken to shivers, the morning star.
- **Sardis** (3:1–6): he that hath the seven Spirits of God and the seven stars. "Thou hast a name that
  thou livest, and art dead"; "I will come on thee as a thief"; a few names which have not defiled
  their garments. Promise: white raiment; name not blotted out of the book of life.
- **Philadelphia** (3:7–13): he that hath the key of David; openeth and no man shutteth. An open door
  set before them; kept from the hour of temptation; "hold that fast which thou hast, that no man take
  thy crown". Promise: a pillar in the temple of God; the name of the city of God, new Jerusalem.
- **Laodicea** (3:14–22): the Amen, the faithful and true witness. Neither cold nor hot; "I will spue
  thee out of my mouth"; "rich, and increased with goods"; gold tried in the fire, white raiment,
  eyesalve. "Behold, I stand at the door, and knock" (3:20): a door, knocking. Promise: to sit with me
  in my throne.

### 4. The door in heaven (4)
- **[John]** A door opened in heaven; the first voice as a trumpet: "Come up hither" (4:1). Immediately
  in the Spirit; he is lifted through it (4:2).
- A throne set in heaven and one sat on it, to look upon like a jasper and a sardine stone (4:2–3).
- A rainbow round about the throne, like an emerald (4:3).
- Twenty-four seats; twenty-four elders in white raiment with crowns of gold (4:4).
- Lightnings, thunderings and voices out of the throne (4:5).
- Seven lamps of fire before the throne, the seven Spirits of God (4:5).
- A sea of glass like unto crystal (4:6).
- Four beasts full of eyes before and behind (4:6): the first like a lion, the second like a calf, the
  third with a face as a man, the fourth like a flying eagle (4:7); each with six wings, full of eyes
  within (4:8).
- They rest not day and night: "Holy, holy, holy, Lord God Almighty" (4:8).
- The elders fall down and cast their crowns before the throne: "Thou art worthy, O Lord" (4:10–11).

### 5. The book and the Lamb (5)
- In the right hand of him on the throne, a book written within and on the backside, sealed with seven
  seals (5:1).
- A strong angel proclaims with a loud voice, "Who is worthy to open the book?" (5:2). No man in
  heaven, earth or under the earth is able (5:3).
- **[John]** John weeps much (5:4): the view blurs with tears.
- An elder: "Weep not: behold, the Lion of the tribe of Juda, the Root of David, hath prevailed" (5:5).
- **[John]** He looks for a lion and sees a Lamb as it had been slain, standing in the midst of the
  throne and the beasts and the elders, with seven horns and seven eyes, the seven Spirits sent forth
  into all the earth (5:6). The turn from expecting a lion to seeing a lamb is the beat.
- The Lamb takes the book (5:7).
- The four beasts and twenty-four elders fall down, each with harps and golden vials full of odours,
  the prayers of saints (5:8). The new song: "Thou art worthy to take the book... for thou wast slain"
  (5:9–10).
- Many angels round the throne, ten thousand times ten thousand, and thousands of thousands: "Worthy
  is the Lamb that was slain" (5:11–12).
- Every creature in heaven, on earth, under the earth and in the sea: "Blessing, and honour, and glory,
  and power" (5:13). The four beasts say "Amen"; the elders fall and worship (5:14).

### 6. The first four seals: the horsemen (6:1–8)
For each seal: the Lamb opens it, one of the four beasts says "Come and see" (the first with a voice
of thunder), and the horse rides out.
- **First seal:** a white horse; the rider has a bow and is given a crown; he goes forth conquering and
  to conquer (6:1–2).
- **Second seal:** a red horse; power given to take peace from the earth, that they should kill one
  another; a great sword (6:3–4).
- **Third seal:** a black horse; the rider has a pair of balances; a voice in the midst of the four
  beasts: "A measure of wheat for a penny... and see thou hurt not the oil and the wine" (6:5–6).
- **Fourth seal:** a pale horse; his name that sat on him was Death, and Hell followed with him; power
  over the fourth part of the earth to kill with sword, with hunger, with death and with the beasts of
  the earth (6:7–8). All four killing means are seen.

### 7. The fifth seal: the souls under the altar (6:9–11)
- Under the altar, the souls of them slain for the word of God (6:9).
- They cry, "How long, O Lord, holy and true, dost thou not judge and avenge our blood?" (6:10).
- White robes given unto every one of them; rest yet for a little season (6:11).

### 8. The sixth seal (6:12–17)
- A great earthquake (6:12).
- The sun black as sackcloth of hair; the moon as blood (6:12).
- The stars of heaven fall unto the earth as a fig tree casteth her untimely figs, shaken of a mighty
  wind (6:13).
- The heaven departs as a scroll when it is rolled together (6:14).
- Every mountain and island moved out of their places (6:14).
- The kings of the earth, the great men, the rich men, the chief captains, the mighty men, every
  bondman and every free man hide in the dens and rocks of the mountains (6:15).
- "Fall on us, and hide us from the face of him that sitteth on the throne, and from the wrath of the
  Lamb: for the great day of his wrath is come" (6:16–17).

### 9. The sealing of the 144,000 (7:1–8)
- Four angels standing on the four corners of the earth, holding the four winds, that the wind should
  not blow on the earth, sea or any tree (7:1). The world goes still.
- Another angel ascending from the east, having the seal of the living God (7:2): "Hurt not the earth,
  neither the sea, nor the trees, till we have sealed the servants of our God in their foreheads" (7:3).
- 144,000 sealed, 12,000 of each tribe, named in the text's order: Juda, Reuben, Gad, Aser, Nepthalim,
  Manasses, Simeon, Levi, Issachar, Zabulon, Joseph, Benjamin (7:4–8). All twelve names are shown in
  that order (and only those twelve).

### 10. The great multitude (7:9–17)
- A great multitude which no man could number, of all nations, kindreds, people and tongues, before the
  throne and the Lamb, clothed with white robes and palms in their hands (7:9).
- "Salvation to our God which sitteth upon the throne, and unto the Lamb" (7:10).
- All the angels round the throne, the elders and the four beasts fall on their faces and worship
  (7:11–12).
- **[John]** An elder asks John, "What are these which are arrayed in white robes?" John: "Sir, thou
  knowest" (7:13–14).
- "These are they which came out of great tribulation, and have washed their robes, and made them
  white in the blood of the Lamb" (7:14).
- They hunger no more, neither thirst; the sun shall not light on them; the Lamb shall feed them and
  lead them unto living fountains of waters; God shall wipe away all tears (7:16–17).

### 11. The seventh seal and the golden censer (8:1–6)
- The seventh seal opened: silence in heaven about the space of half an hour (8:1). The page goes
  silent. Sound off, motion almost still, no caption for a long scroll stretch.
- The seven angels which stood before God are given seven trumpets (8:2).
- Another angel at the altar with a golden censer, given much incense to offer with the prayers of all
  saints on the golden altar before the throne. The smoke of the incense ascends before God (8:3–4).
- The angel fills the censer with fire of the altar and casts it into the earth: voices, thunderings,
  lightnings and an earthquake (8:5).
- The seven angels prepare themselves to sound (8:6).

### 12. The first four trumpets (8:7–12)
- **First:** hail and fire mingled with blood, cast upon the earth; the third part of trees and all
  green grass burnt up (8:7).
- **Second:** as it were a great mountain burning with fire cast into the sea; the third part of the
  sea became blood; a third of the creatures in the sea died; a third of the ships destroyed (8:8–9).
- **Third:** a great star from heaven, burning as it were a lamp, falls on the third part of the rivers
  and the fountains of waters. The name of the star is called Wormwood. The waters become wormwood and
  many men die of the bitter waters (8:10–11).
- **Fourth:** the third part of the sun, of the moon and of the stars smitten and darkened; the day
  shone not for a third part of it, and the night likewise (8:12).

### 13. The angel crying woe (8:13)
- An angel flying through the midst of heaven, saying with a loud voice, "Woe, woe, woe, to the
  inhabiters of the earth by reason of the other voices of the trumpet... which are yet to sound."
  (KJV reads "angel"; shown as an angel.)

### 14. The fifth trumpet: the bottomless pit and the locusts (9:1–12)
- A star fallen from heaven unto the earth, given the key of the bottomless pit (9:1).
- He opens the pit; smoke arises as the smoke of a great furnace; the sun and the air darkened (9:2).
- Out of the smoke, locusts upon the earth, with power as scorpions (9:3).
- Commanded not to hurt the grass, any green thing or any tree, but only the men which have not the
  seal of God in their foreheads (9:4). The sealed are passed over.
- Not to kill them but to torment them five months, as the torment of a scorpion (9:5). In those days
  men seek death and shall not find it (9:6).
- The locusts, every feature (9:7–10): like unto horses prepared unto battle; on their heads as it were
  crowns like gold; faces as the faces of men; hair as the hair of women; teeth as the teeth of lions;
  breastplates as it were breastplates of iron; the sound of their wings as the sound of chariots of
  many horses running to battle; tails like unto scorpions, with stings in their tails.
- Their king, the angel of the bottomless pit, whose name in the Hebrew tongue is Abaddon and in the
  Greek tongue Apollyon (9:11).
- "One woe is past" (9:12).

### 15. The sixth trumpet: the four angels at Euphrates (9:13–21)
- A voice from the four horns of the golden altar which is before God (9:13): "Loose the four angels
  which are bound in the great river Euphrates" (9:14).
- The four angels loosed, prepared for an hour, a day, a month and a year, to slay the third part of
  men (9:15).
- The army of the horsemen: two hundred thousand thousand (9:16).
- The horses and riders, every feature (9:17–19): breastplates of fire, of jacinth and brimstone; the
  heads of the horses as the heads of lions; out of their mouths issued fire and smoke and brimstone;
  their tails like unto serpents, having heads, and with them they do hurt. By the fire, smoke and
  brimstone a third part of men killed.
- The rest repented not: they worship devils, and idols of gold, silver, brass, stone and wood which
  neither see, hear nor walk; nor of their murders, sorceries, fornication or thefts (9:20–21). Each
  kind of idol is seen.

### 16. The mighty angel and the little book (10)
- Another mighty angel comes down from heaven (10:1), every feature: clothed with a cloud; a rainbow
  upon his head; his face as it were the sun; his feet as pillars of fire.
- A little book open in his hand (10:2). He sets his right foot upon the sea and his left foot on the
  earth (10:2), and cries with a loud voice as when a lion roareth (10:3).
- Seven thunders utter their voices (10:3). Seven distinct thunders, heard.
- **[John]** John is about to write; a voice from heaven: "Seal up those things which the seven thunders
  uttered, and write them not" (10:4). His hand stops.
- The angel lifts up his hand to heaven and swears by him that liveth for ever "that there should be
  time no longer" (10:5–6); in the days of the voice of the seventh angel the mystery of God should be
  finished (10:7).
- **[John]** The voice: "Go and take the little book" (10:8). He goes to the angel; "Give me the little
  book." "Take it, and eat it up" (10:9). He eats it: in his mouth sweet as honey; his belly bitter
  (10:10).
- "Thou must prophesy again before many peoples, and nations, and tongues, and kings" (10:11).

### 17. The measuring and the two witnesses (11:1–14)
- **[John]** He is given a reed like unto a rod: "Rise, and measure the temple of God, and the altar,
  and them that worship therein" (11:1). He measures.
- The court which is without the temple is left out, given unto the Gentiles; the holy city trodden
  under foot forty and two months (11:2).
- Two witnesses prophesy 1,260 days, clothed in sackcloth (11:3). They are the two olive trees and the
  two candlesticks standing before the God of the earth (11:4): both shown.
- Fire proceeds out of their mouth and devours their enemies (11:5).
- They shut heaven that it rain not; they turn waters to blood; they smite the earth with all plagues
  (11:6). Each power seen.
- The beast that ascendeth out of the bottomless pit makes war against them, overcomes them and kills
  them (11:7). (The first sight of a beast; kept in shadow, since its full form comes in 13 and 17.)
- Their dead bodies lie in the street of the great city, which spiritually is called Sodom and Egypt,
  where also our Lord was crucified (11:8).
- Peoples, kindreds, tongues and nations see their bodies three days and a half and suffer them not to
  be buried; they rejoice, make merry and send gifts one to another (11:9–10).
- After three days and a half the Spirit of life from God enters into them; they stand upon their
  feet; great fear falls on them that saw them (11:11).
- A great voice: "Come up hither." They ascend up to heaven in a cloud, and their enemies beheld them
  (11:12).
- The same hour a great earthquake; the tenth part of the city fell; seven thousand men slain; the
  remnant affrighted gave glory to the God of heaven (11:13).
- "The second woe is past; and, behold, the third woe cometh quickly" (11:14).

### 18. The seventh trumpet (11:15–19)
- The seventh angel sounds; great voices in heaven: "The kingdoms of this world are become the kingdoms
  of our Lord, and of his Christ; and he shall reign for ever and ever" (11:15).
- The twenty-four elders fall upon their faces and worship (11:16–18).
- The temple of God opened in heaven; the ark of his testament seen in his temple (11:19).
- Lightnings, voices, thunderings, an earthquake and great hail (11:19).

### 19. The woman and the dragon (12)
- A great wonder in heaven: a woman clothed with the sun, the moon under her feet, upon her head a
  crown of twelve stars, being with child, crying, travailing in birth (12:1–2).
- Another wonder: a great red dragon, having seven heads and ten horns, and seven crowns upon his heads
  (12:3).
- His tail draws the third part of the stars of heaven and casts them to the earth (12:4).
- The dragon stands before the woman to devour her child as soon as it was born (12:4).
- She brings forth a man child, who was to rule all nations with a rod of iron; her child caught up
  unto God and to his throne (12:5).
- The woman flees into the wilderness, to a place prepared of God, to be fed 1,260 days (12:6).
- **War in heaven:** Michael and his angels fight against the dragon; the dragon fights and his angels,
  and prevail not; neither is their place found any more in heaven (12:7–8).
- The great dragon cast out, that old serpent, called the Devil, and Satan, which deceiveth the whole
  world: cast out into the earth, and his angels cast out with him (12:9).
- A loud voice in heaven: "Now is come salvation, and strength... for the accuser of our brethren is
  cast down... And they overcame him by the blood of the Lamb, and by the word of their testimony"
  (12:10–11). "Woe to the inhabiters of the earth and of the sea! for the devil is come down unto you,
  having great wrath, because he knoweth that he hath but a short time" (12:12).
- The dragon persecutes the woman (12:13). She is given two wings of a great eagle, to fly into the
  wilderness, where she is nourished for a time, and times, and half a time (12:14).
- The serpent casts out of his mouth water as a flood after the woman (12:15). The earth opens her
  mouth and swallows up the flood (12:16).
- The dragon, wroth with the woman, goes to make war with the remnant of her seed (12:17).
- **[John]** "And I stood upon the sand of the sea" (13:1, KJV). The camera is on the shore.

### 20. The beast out of the sea (13:1–10)
- A beast rises up out of the sea (13:1), every feature: seven heads and ten horns; upon his horns ten
  crowns; upon his heads the name of blasphemy; like unto a leopard; feet as the feet of a bear; mouth
  as the mouth of a lion (13:1–2).
- The dragon gives him his power, and his seat, and great authority (13:2).
- One of his heads as it were wounded to death, and the deadly wound healed (13:3): seen healing.
- All the world wonders after the beast; they worship the dragon and the beast: "Who is like unto the
  beast? who is able to make war with him?" (13:3–4).
- A mouth speaking great things and blasphemies; power to continue forty and two months (13:5); he
  blasphemes God, his name, his tabernacle and them that dwell in heaven (13:6).
- He makes war with the saints and overcomes them; power over all kindreds, tongues and nations (13:7).
- All that dwell upon the earth worship him, whose names are not written in the book of life of the
  Lamb slain from the foundation of the world (13:8).
- "If any man have an ear, let him hear" (13:9–10).

### 21. The beast out of the earth (13:11–18)
- Another beast coming up out of the earth; two horns like a lamb; he spake as a dragon (13:11).
- He exercises all the power of the first beast before him, and causes the earth to worship the first
  beast, whose deadly wound was healed (13:12).
- He makes fire come down from heaven on the earth in the sight of men (13:13).
- He tells them to make an image to the beast which had the wound by a sword, and did live (13:14). He
  gives life unto the image; the image speaks; as many as would not worship the image are killed
  (13:15).
- He causes all, small and great, rich and poor, free and bond, to receive a mark in their right hand,
  or in their foreheads (13:16). No man might buy or sell save he that had the mark, or the name of
  the beast, or the number of his name (13:17).
- "Here is wisdom... it is the number of a man; and his number is Six hundred threescore and six"
  (13:18). The number shown as the text writes it, no decoding.

### 22. The Lamb on Mount Sion (14:1–5)
- A Lamb stands on the mount Sion, and with him 144,000 having his Father's name written in their
  foreheads (14:1).
- A voice from heaven as the voice of many waters and of a great thunder; the voice of harpers harping
  with their harps (14:2).
- They sing as it were a new song before the throne; no man could learn that song but the 144,000
  (14:3). They follow the Lamb whithersoever he goeth; firstfruits; in their mouth was found no guile
  (14:4–5).

### 23. The three angels (14:6–13)
- **First angel:** flying in the midst of heaven, having the everlasting gospel to preach unto every
  nation, kindred, tongue and people: "Fear God, and give glory to him; for the hour of his judgment is
  come" (14:6–7).
- **Second angel:** "Babylon is fallen, is fallen, that great city, because she made all nations drink
  of the wine of the wrath of her fornication" (14:8).
- **Third angel:** "If any man worship the beast and his image... the same shall drink of the wine of
  the wrath of God... and he shall be tormented with fire and brimstone... And the smoke of their
  torment ascendeth up for ever and ever" (14:9–11).
- "Here is the patience of the saints" (14:12).
- **[John]** A voice from heaven: "Write, Blessed are the dead which die in the Lord from henceforth...
  that they may rest from their labours; and their works do follow them" (14:13). He writes.

### 24. The harvest and the winepress (14:14–20)
- A white cloud, and upon the cloud one sat like unto the Son of man, having on his head a golden crown
  and in his hand a sharp sickle (14:14).
- Another angel comes out of the temple crying, "Thrust in thy sickle, and reap... for the harvest of
  the earth is ripe" (14:15). He thrusts in his sickle on the earth and the earth is reaped (14:16).
- Another angel comes out of the temple in heaven, he also having a sharp sickle (14:17).
- Another angel comes out from the altar, which had power over fire: "Thrust in thy sharp sickle, and
  gather the clusters of the vine of the earth; for her grapes are fully ripe" (14:18).
- The angel gathers the vine of the earth and casts it into the great winepress of the wrath of God
  (14:19).
- The winepress trodden without the city; blood came out of the winepress, even unto the horse bridles,
  by the space of a thousand and six hundred furlongs (14:20). Shown from high, at its full extent.

### 25. The sea of glass mingled with fire (15)
- Another sign in heaven, great and marvellous: seven angels having the seven last plagues (15:1).
- A sea of glass mingled with fire; on it stand them that had gotten the victory over the beast, his
  image, his mark and the number of his name, having the harps of God (15:2).
- They sing the song of Moses and the song of the Lamb: "Great and marvellous are thy works, Lord God
  Almighty" (15:3–4).
- The temple of the tabernacle of the testimony in heaven is opened (15:5).
- The seven angels come out of the temple, clothed in pure and white linen, their breasts girded with
  golden girdles (15:6).
- One of the four beasts gives the seven angels seven golden vials full of the wrath of God (15:7).
- The temple is filled with smoke from the glory of God; no man is able to enter the temple till the
  seven plagues are fulfilled (15:8).

### 26. The seven vials (16)
- A great voice out of the temple: "Go your ways, and pour out the vials of the wrath of God upon the
  earth" (16:1).
- **First vial** upon the earth: a noisome and grievous sore upon the men which had the mark of the
  beast and worshipped his image (16:2).
- **Second vial** upon the sea: it becomes as the blood of a dead man; every living soul died in the sea
  (16:3).
- **Third vial** upon the rivers and fountains of waters: they become blood (16:4). The angel of the
  waters: "Thou art righteous, O Lord... For they have shed the blood of saints and prophets, and thou
  hast given them blood to drink" (16:5–6). Another out of the altar: "Even so, Lord God Almighty, true
  and righteous are thy judgments" (16:7).
- **Fourth vial** upon the sun: power to scorch men with fire; men scorched with great heat blaspheme
  the name of God, and repent not (16:8–9).
- **Fifth vial** upon the seat of the beast: his kingdom full of darkness; they gnaw their tongues for
  pain; blaspheme the God of heaven; repent not (16:10–11).
- **Sixth vial** upon the great river Euphrates: its water dried up, that the way of the kings of the
  east might be prepared (16:12).
- Three unclean spirits like frogs come out of the mouth of the dragon, out of the mouth of the beast and
  out of the mouth of the false prophet (16:13). They are the spirits of devils working miracles, which
  go forth unto the kings of the earth and of the whole world, to gather them to the battle of that
  great day of God Almighty (16:14).
- "Behold, I come as a thief. Blessed is he that watcheth, and keepeth his garments" (16:15).
- He gathers them together into a place called in the Hebrew tongue Armageddon (16:16). The gathering
  is seen; the battle is not yet (it comes in 19).
- **Seventh vial** into the air: a great voice out of the temple, from the throne, "It is done" (16:17).
- Voices, thunders, lightnings; a great earthquake such as was not since men were upon the earth
  (16:18).
- The great city divided into three parts; the cities of the nations fell; great Babylon came in
  remembrance before God, to give unto her the cup of the wine of the fierceness of his wrath (16:19).
- Every island fled away, and the mountains were not found (16:20).
- A great hail out of heaven, every stone about the weight of a talent; men blaspheme God because of the
  plague of the hail (16:21).

### 27. The great whore and the scarlet beast (17)
- One of the seven angels which had the seven vials: "Come hither; I will shew unto thee the judgment of
  the great whore that sitteth upon many waters" (17:1–2).
- **[John]** He is carried away in the spirit into the wilderness (17:3).
- A woman sitting upon a scarlet coloured beast, full of names of blasphemy, having seven heads and ten
  horns (17:3).
- The woman arrayed in purple and scarlet colour, decked with gold and precious stones and pearls,
  having a golden cup in her hand full of abominations and filthiness of her fornication (17:4).
- Upon her forehead a name written: MYSTERY, BABYLON THE GREAT, THE MOTHER OF HARLOTS AND ABOMINATIONS
  OF THE EARTH (17:5). Shown in capitals as KJV prints it.
- The woman drunken with the blood of the saints and of the martyrs of Jesus (17:6).
- **[John]** When he saw her, he wondered with great admiration (17:6). The angel: "Wherefore didst thou
  marvel? I will tell thee the mystery" (17:7).
- The angel's explanation, each part shown as it is said:
  - The beast that was, and is not; shall ascend out of the bottomless pit, and go into perdition; they
    that dwell on the earth shall wonder (17:8).
  - The seven heads are seven mountains, on which the woman sitteth (17:9).
  - And there are seven kings: five are fallen, one is, the other is not yet come; the beast is the
    eighth, and is of the seven (17:10–11). Shown as seven crowned shapes in that state, no names.
  - The ten horns are ten kings which have received no kingdom as yet, but receive power as kings one
    hour with the beast (17:12–13).
  - These make war with the Lamb, and the Lamb overcomes them: he is Lord of lords, and King of kings;
    they that are with him are called, and chosen, and faithful (17:14).
  - The waters where the whore sitteth are peoples, multitudes, nations and tongues (17:15).
  - The ten horns upon the beast shall hate the whore, make her desolate and naked, eat her flesh and
    burn her with fire (17:16), for God hath put in their hearts to fulfil his will (17:17).
  - The woman is that great city, which reigneth over the kings of the earth (17:18).

### 28. The fall of Babylon (18)
- Another angel comes down from heaven, having great power; the earth is lightened with his glory
  (18:1).
- He cries mightily with a strong voice: "Babylon the great is fallen, is fallen, and is become the
  habitation of devils, and the hold of every foul spirit, and a cage of every unclean and hateful bird"
  (18:2–3).
- Another voice from heaven: "Come out of her, my people, that ye be not partakers of her sins"
  (18:4–8). Her plagues come in one day: death, mourning, famine; she is utterly burned with fire.
- The kings of the earth bewail her, standing afar off for the fear of her torment, when they see the
  smoke of her burning: "Alas, alas, that great city Babylon... for in one hour is thy judgment come"
  (18:9–10).
- The merchants of the earth weep, for no man buyeth their merchandise any more (18:11). The whole cargo
  list is seen, in order (18:12–13): gold, silver, precious stones, pearls, fine linen, purple, silk,
  scarlet, all thyine wood, all manner vessels of ivory, vessels of most precious wood, brass, iron,
  marble, cinnamon, odours, ointments, frankincense, wine, oil, fine flour, wheat, beasts, sheep,
  horses, chariots, slaves, and souls of men. The fruits that thy soul lusted after are departed
  (18:14). The merchants stand afar off, weeping and wailing (18:15–17).
- Every shipmaster, all the company in ships, sailors and as many as trade by sea stand afar off and
  cry when they see the smoke of her burning; they cast dust on their heads (18:17–19).
- "Rejoice over her, thou heaven, and ye holy apostles and prophets" (18:20).
- A mighty angel takes up a stone like a great millstone and casts it into the sea: "Thus with violence
  shall that great city Babylon be thrown down, and shall be found no more at all" (18:21).
- Each "no more at all" is heard falling silent in turn (18:22–23): harpers, musicians, pipers,
  trumpeters; no craftsman; the sound of a millstone; the light of a candle; the voice of the
  bridegroom and of the bride.
- In her was found the blood of prophets, and of saints, and of all that were slain upon the earth
  (18:24).

### 29. Alleluia and the marriage supper (19:1–10)
- A great voice of much people in heaven: "Alleluia; Salvation, and glory, and honour, and power, unto
  the Lord our God" (19:1–2). Again, "Alleluia. And her smoke rose up for ever and ever" (19:3).
- The twenty-four elders and the four beasts fall down and worship: "Amen; Alleluia" (19:4).
- A voice out of the throne: "Praise our God, all ye his servants" (19:5).
- **[John]** The voice of a great multitude, as the voice of many waters and of mighty thunderings:
  "Alleluia: for the Lord God omnipotent reigneth" (19:6). The loudest sound in the piece.
- "The marriage of the Lamb is come, and his wife hath made herself ready"; to her was granted that she
  should be arrayed in fine linen, clean and white: the righteousness of saints (19:7–8).
- **[John]** "Write, Blessed are they which are called unto the marriage supper of the Lamb" (19:9).
- **[John]** He falls at the angel's feet to worship; "See thou do it not: I am thy fellowservant...
  worship God: for the testimony of Jesus is the spirit of prophecy" (19:10).

### 30. The rider on the white horse (19:11–21)
- Heaven opened; a white horse; he that sat upon him was called Faithful and True; in righteousness he
  doth judge and make war (19:11).
- Every feature (19:12–13, 15–16): eyes as a flame of fire; on his head many crowns; a name written
  that no man knew but he himself; a vesture dipped in blood; his name is called The Word of God; out of
  his mouth goeth a sharp sword; he shall rule them with a rod of iron; he treadeth the winepress of the
  fierceness and wrath of Almighty God; on his vesture and on his thigh a name written, KING OF KINGS,
  AND LORD OF LORDS.
- The armies which were in heaven follow him upon white horses, clothed in fine linen, white and clean
  (19:14).
- An angel standing in the sun cries to all the fowls that fly in the midst of heaven: "Come and gather
  yourselves together unto the supper of the great God" (19:17–18).
- The beast, the kings of the earth and their armies gathered together to make war against him that
  sat on the horse and against his army (19:19).
- The beast taken, and with him the false prophet that wrought miracles before him; both cast alive
  into a lake of fire burning with brimstone (19:20).
- The remnant slain with the sword of him that sat upon the horse; all the fowls filled (19:21).
  Shown at distance, as birds descending over a field; no close-ups.

### 31. The thousand years (20:1–10)
- An angel comes down from heaven, having the key of the bottomless pit and a great chain in his hand
  (20:1).
- He lays hold on the dragon, that old serpent, which is the Devil, and Satan, and binds him a thousand
  years; casts him into the bottomless pit, shuts him up and sets a seal upon him (20:2–3).
- Thrones, and they sat upon them, and judgment was given unto them (20:4).
- The souls of them that were beheaded for the witness of Jesus and for the word of God, which had not
  worshipped the beast nor received his mark; they lived and reigned with Christ a thousand years
  (20:4). "This is the first resurrection" (20:5–6).
- When the thousand years are expired, Satan is loosed out of his prison (20:7).
- He goes out to deceive the nations in the four quarters of the earth, Gog and Magog, to gather them
  together to battle, the number of whom is as the sand of the sea (20:8).
- They go up on the breadth of the earth and compass the camp of the saints about, and the beloved city
  (20:9).
- Fire comes down from God out of heaven and devours them (20:9).
- The devil that deceived them is cast into the lake of fire and brimstone, where the beast and the
  false prophet are (20:10).

### 32. The great white throne (20:11–15)
- A great white throne, and him that sat on it, from whose face the earth and the heaven fled away; and
  there was found no place for them (20:11). Everything else leaves the frame.
- The dead, small and great, stand before God; the books are opened; another book is opened, which is
  the book of life; the dead judged out of those things which were written in the books, according to
  their works (20:12).
- The sea gave up the dead which were in it; death and hell delivered up the dead which were in them
  (20:13).
- Death and hell cast into the lake of fire. This is the second death (20:14).
- Whosoever was not found written in the book of life was cast into the lake of fire (20:15).

### 33. A new heaven and a new earth (21:1–8)
- A new heaven and a new earth; the first heaven and the first earth passed away; and there was no
  more sea (21:1).
- **[John]** "And I John saw the holy city, new Jerusalem, coming down from God out of heaven, prepared
  as a bride adorned for her husband" (21:2).
- A great voice out of heaven: "Behold, the tabernacle of God is with men... And God shall wipe away all
  tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall
  there be any more pain" (21:3–4).
- "Behold, I make all things new." **[John]** "Write: for these words are true and faithful" (21:5).
- "It is done. I am Alpha and Omega... I will give unto him that is athirst of the fountain of the
  water of life freely. He that overcometh shall inherit all things" (21:6–7). The fearful,
  unbelieving and the rest shall have their part in the lake (21:8).

### 34. The holy city (21:9–27)
- One of the seven angels which had the seven vials: "Come hither, I will shew thee the bride, the
  Lamb's wife" (21:9).
- **[John]** He is carried away in the spirit to a great and high mountain, and shown that great city,
  the holy Jerusalem, descending out of heaven from God (21:10).
- Having the glory of God; her light like unto a stone most precious, even like a jasper stone, clear
  as crystal (21:11).
- A wall great and high, twelve gates, at the gates twelve angels, and names written thereon, the names
  of the twelve tribes (21:12). Three gates on each side: east, north, south, west (21:13).
- The wall has twelve foundations, and in them the names of the twelve apostles of the Lamb (21:14).
- The angel's golden reed measures the city, its gates and its wall (21:15). The city lieth foursquare;
  12,000 furlongs, the length and the breadth and the height of it equal (21:16). The wall 144 cubits
  (21:17). The scale is made felt: the camera climbs the wall.
- The building of the wall of jasper; the city pure gold, like unto clear glass (21:18).
- The twelve foundations garnished, in the text's order (21:19–20): jasper; sapphire; chalcedony;
  emerald; sardonyx; sardius; chrysolite; beryl; topaz; chrysoprasus; jacinth; amethyst. Each is shown
  and named.
- The twelve gates are twelve pearls, every gate of one pearl; the street of the city pure gold, as it
  were transparent glass (21:21).
- No temple therein: the Lord God Almighty and the Lamb are the temple of it (21:22).
- No need of the sun, neither of the moon; the glory of God did lighten it, and the Lamb is the light
  thereof (21:23). Every light source in the scene is the city itself.
- The nations walk in the light of it; the kings of the earth bring their glory and honour into it
  (21:24, 26).
- The gates not shut at all by day: for there shall be no night there (21:25).
- There shall in no wise enter into it any thing that defileth; but they which are written in the
  Lamb's book of life (21:27).

### 35. The river and the tree of life (22:1–5)
- A pure river of water of life, clear as crystal, proceeding out of the throne of God and of the Lamb
  (22:1).
- In the midst of the street of it, and on either side of the river, the tree of life, which bare
  twelve manner of fruits, and yielded her fruit every month; the leaves of the tree for the healing of
  the nations (22:2). (The Journey's Eden has a tree of life; echoing its form is the builder's call.)
- There shall be no more curse; the throne of God and of the Lamb shall be in it; his servants shall
  serve him (22:3).
- They shall see his face; and his name shall be in their foreheads (22:4). (His face is not shown;
  their faces turned toward the light are.)
- No night there; they need no candle, neither light of the sun; for the Lord God giveth them light:
  and they shall reign for ever and ever (22:5).

### 36. Epilogue: "Surely I come quickly" (22:6–21)
- "These sayings are faithful and true"; the Lord God sent his angel to shew his servants (22:6).
- "Behold, I come quickly: blessed is he that keepeth the sayings of the prophecy of this book" (22:7).
- **[John]** "And I John saw these things, and heard them." He falls down to worship before the feet of
  the angel (22:8). "See thou do it not: for I am thy fellowservant... worship God" (22:9).
- "Seal not the sayings of the prophecy of this book: for the time is at hand" (22:10). (The opposite
  of 10:4: his hand is not stopped.)
- "Behold, I come quickly; and my reward is with me" (22:12). "I am Alpha and Omega, the beginning and
  the end, the first and the last" (22:13).
- "Blessed are they that do his commandments, that they may have right to the tree of life, and may
  enter in through the gates into the city" (22:14). Without are dogs, sorcerers, whoremongers,
  murderers, idolaters, and whosoever loveth and maketh a lie (22:15): outside the gates.
- "I Jesus have sent mine angel... I am the root and the offspring of David, and the bright and morning
  star" (22:16). The morning star rises.
- "And the Spirit and the bride say, Come. And let him that heareth say, Come... And whosoever will, let
  him take the water of life freely" (22:17).
- The warning against adding to or taking away from the words of this book (22:18–19).
- "Surely I come quickly. Amen. Even so, come, Lord Jesus" (22:20).
- "The grace of our Lord Jesus Christ be with you all. Amen" (22:21).
- Last shot (my call, see Point of view): back on Patmos at dawn, John's hand finishing the scroll.

### Cast list (cross-check)

Every one of these appears in the inventory above. The builder ticks them off.

**Angels and heavenly beings:** the angel who signifies the vision (1:1); the seven Spirits / seven
lamps (1:4, 4:5, 5:6); the seven angels of the churches as stars (1:20); the four beasts (4:6–8); the
twenty-four elders (4:4); the strong angel (5:2); ten thousand times ten thousand angels (5:11); four
angels at the four corners (7:1); the angel from the east with the seal (7:2); the seven trumpet angels
(8:2); the angel with the golden censer (8:3); the angel crying woe (8:13); the star fallen with the key
(9:1); Abaddon / Apollyon (9:11); the four angels bound at Euphrates (9:14); the mighty angel with the
little book (10:1); Michael and his angels (12:7); the three flying angels (14:6, 8, 9); the angel from
the temple at the harvest (14:15); the angel with the sharp sickle (14:17); the angel from the altar with
power over fire (14:18); the seven vial angels (15:1, 6); the angel of the waters (16:5); the vial angel
who shows Babylon (17:1); the angel who lightens the earth (18:1); the mighty angel with the millstone
(18:21); the fellowservant angel (19:10, 22:8–9); the angel standing in the sun (19:17); the angel with
the key and the chain (20:1); the vial angel who shows the bride (21:9); the twelve angels at the gates
(21:12); the measuring angel with the golden reed (21:15).

**Beasts and creatures:** the four living creatures (lion, calf, man, eagle); the Lamb; the four horses
(white, red, black, pale) and their riders, Death and Hell; the beasts of the earth (6:8); the locusts;
the 200 million horsemen and their lion-headed, serpent-tailed horses; the beast from the bottomless pit
(11:7); the great red dragon / that old serpent; the great eagle's wings (12:14); the beast from the sea
(leopard, bear, lion; seven heads, ten horns, ten crowns); the beast from the earth (two lamb horns); the
image of the beast; the three frog-like unclean spirits; the scarlet beast; the unclean and hateful birds
(18:2); the white horse and the armies' white horses; the fowls of the supper (19:17).

**People and figures:** John; the Son of Man; the churches' people as each letter needs them (Antipas;
"Jezebel"); the souls under the altar; the 144,000; the great multitude; the two witnesses; the woman
clothed with the sun and the man child; the remnant of her seed; the false prophet (named from 16:13); the
great whore; kings, merchants and shipmasters; the rider Faithful and True; the souls on thrones; Gog and
Magog; the dead small and great; the bride; the nations and kings of the new earth.

## Sound (builder's call within these rules)

- The trumpet voice (1:10, 4:1) and "many waters" (1:15, 14:2, 19:6) are distinct, recognisable sounds
  that return each time the text uses them.
- Silence is designed: the half hour of silence (8:1) is total; Babylon's sounds fall away one by one
  (18:22–23).
- The seven thunders (10:3) are seven separate thunders.
- Sound stays off until the reader turns it on, as in the Journey.

## Delivery (my call; it can change)

Built in slices, each a working, published page:
1. **Engine and chapters 1–5**: the director takes a story; `/revelation/` exists; Patmos through the
   Lamb taking the book. This proves the point of view, the throne room and the creature approach.
2. Chapters 6–11 (seals and trumpets).
3. Chapters 12–16 (the dragon, the beasts, the vials).
4. Chapters 17–20 (Babylon, the rider, the thousand years, the white throne).
5. Chapters 21–22 (the new Jerusalem) and the closing shot.

Each slice is checked on desktop and on an iPhone-sized headless run before it ships.

## Left to the builder

Scene lengths and caption timing; camera paths; materials, lighting and colour; how multitudes are
instanced; which verse excerpts become captions (every inventory bullet needs either a caption or an
unmistakable visual, and every quoted caption must be exact KJV); sound design inside the rules above;
how the director is generalised, as long as the Journey is unchanged.

## Decided by the user

**Creatures and figures are generated 3D models** (user, 2026-10-20). Each one is made with text-to-3D
through fal.ai, then cleaned up, posed or rigged, compressed to the size the Journey uses for scanned
models, and given a reduced copy for phones. Rules:
- **The user approves each creature** against the depiction rules before it goes into a scene. A
  creature is checked feature by feature against its verse ("every listed feature visible, nothing
  added").
- **One style for everything.** The builder writes a shared style prompt and material treatment so
  that dozens of models read as one world. The first slice sets that style.
- **Spend:** the builder estimates the per-model cost and the total before generating, and the user
  agrees a ceiling. No ceiling is set yet.
- Simple elements stay procedural where that is plainly enough: light, fire, smoke, water, hail, the
  sea of glass, the stars, multitudes drawn as instanced crowds.

**The audience is all ages** (user, 2026-10-20). The hardest passages are staged through symbol and
scale, and nothing is explicit:
- The great whore (17) is fully clothed as 17:4 describes. "Her fornication" stays in the words and is
  never staged.
- 17:16 ("desolate and naked... eat her flesh, and burn her with fire") is shown as the ten horns
  turning on her and fire taking the city (17:18). No nudity and no eating is shown.
- The beheaded souls (20:4) are souls in white, as under the altar in 6:9. No beheading is shown.
- Sores (16:2), gnawed tongues (16:10), killing (6:4, 9:15) and the supper of the fowls (19:17–21) are
  shown through people turning away, darkness, distance and the birds, never through wounds up close.
