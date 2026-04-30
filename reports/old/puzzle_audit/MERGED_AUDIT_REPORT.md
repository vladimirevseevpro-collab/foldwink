# Foldwink — Merged audit report

Generated: 2026-04-20T23:45:34.666Z

Sources: phase A (local static), phase B (GPT audit via codex), phase C (Claude programmatic verification).

## Summary

- HIGH_AUTO (confirmed + high severity): **3**
- HIGH_REVIEW (subjective + high severity, needs human): **546**
- MEDIUM_NOTE: 1020
- LOW_NOTE: 15
- DROPPED_REFUTED (GPT hallucinations caught by Claude): 5

## Static-only signals (phase A)

- PAIR_SPLIT: 0
- DUP_ITEM: 0
- LABEL_OVERLAP_high: 47
- SHORT_ITEM: 95
- MISSING_META: 1201
- CROSS_PUZZLE_REP: 347

## HIGH_AUTO — apply queue candidates — 3

### DE (1)

- **de-0095** (easy) — `LABEL_OVERLAP` [high] → verdict: `confirmed-lexical`
  - „Nobelpreisträger“ überschneidet sich konzeptionell mit den Jahrhunderten-Gruppen: Planck, Heisenberg, Koch und Mayer sind ebenfalls Personen des 19./20. Jahrhunderts. Die Labels sind nicht parallel und Spieler können Personen nach Zeit oder Nobelpreis sortieren.
  - items: Planck, Heisenberg, Koch, Mayer
  - groups: Erfinder 19. Jh. | Erfinder 20. Jh. | Nobelpreisträger
  - fix: Alle Gruppen nach demselben Prinzip bilden, z. B. nur Erfinder nach Jahrhundert oder nur Nobelpreisträger nach Fachgebiet.

### RU (2)

- **ru-0202** (easy) — `LABEL_OVERLAP` [high] → verdict: `confirmed-lexical`
  - The labels mix eras, genres and scenes. «Земфира» is a solo artist rather than a rock group; «Кипелов» is also a band named after a singer but overlaps historically with Ария; several groups can fit by era and genre simultaneously.
  - items: Земфира, Кипелов, Ария
  - groups: 90-е | Металл
  - fix: Retitle to «Российские рок-исполнители» and use one axis such as decade of debut or genre.

- **ru-0489** (easy) — `LABEL_OVERLAP` [high] → verdict: `confirmed-lexical`
  - “Города-герои” and “Ещё города-герои” are the same category split into two groups, which is not a single-concept distinct label set.
  - items: Москва, Ленинград, Сталинград, Севастополь, Одесса, Киев, Минск, Тула
  - groups: Города-герои | Ещё города-герои
  - fix: Merge or replace one with a different, objective category.

## HIGH_REVIEW — human decision needed — 546

### DE (149)

- **de-0007** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Die Kategorie „Medizintechnik“ bezeichnet Geräte/Technik, die Items sind aber überwiegend Berufs- bzw. Ausbildungsabkürzungen. „BTA“ ist zudem nicht klar ein Krankenhausberuf.
  - items: MTA, MTRA, OTA, BTA
  - groups: Medizintechnik
  - fix: Kategorie in „Medizinische Assistenzberufe“ ändern und „BTA“ durch einen klaren Krankenhausberuf ersetzen, oder echte Medizintechnik-Items verwenden.

- **de-0009** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Mehrere Items in „Küchenmöbel“ und „Badezimmermöbel“ sind Geräte, Sanitäranlagen oder Einbauten, aber keine Möbel. Das macht die Kategoriebezeichnung irreführend.
  - items: Herd, Spülbecken, Kühlschrank, Badewanne, Waschbecken, Toilette
  - groups: Küchenmöbel | Badezimmermöbel
  - fix: Labels in „Küche“/„Bad“ oder „Kücheneinrichtung“/„Badezimmereinrichtung“ ändern, oder echte Möbel einsetzen.

- **de-0011** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - „Butter“ ist sowohl ein typischer Brotaufstrich als auch ein Milchprodukt; „Frischkäse“ ist ebenfalls beides. Dadurch gehören Items plausibel zu zwei Kategorien.
  - items: Butter, Frischkäse
  - groups: Brotaufstriche | Milchprodukte
  - fix: Milchprodukte durch eine nicht überlappende Frühstückskategorie ersetzen oder Brotaufstriche ohne Milchprodukte verwenden.

- **de-0018** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - „Zierbäume“ überlappt mit „Laubbäume“: Magnolie, Hängebirke, Trauerweide und Blutbuche sind ebenfalls Laubbäume. „Hängebirke“ und „Blutbuche“ sind zudem Varianten von Birke/Buche, die bereits in „Laubbäume“ vorkommen.
  - items: Birke, Buche, Magnolie, Hängebirke, Trauerweide, Blutbuche
  - groups: Laubbäume | Zierbäume
  - fix: Zierbaum-Gruppe durch eine nicht-taxonomische, eindeutig getrennte Kategorie ersetzen oder Laubbaum-Items ohne Überschneidung wählen.

- **de-0021** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Die Regionalgruppen für Bundesländer sind politisch/geografisch nicht trennscharf. Niedersachsen wird üblicherweise Norddeutschland zugeordnet, Sachsen-Anhalt eher Ostdeutschland, Saarland/Rheinland-Pfalz eher West- bzw. Südwestdeutschland, nicht schlicht Süddeutschland.
  - items: Niedersachsen, Sachsen-Anhalt, Saarland, Rheinland-Pfalz
  - groups: Norddeutsche Länder | Süddeutsche Länder | Ostdeutsche Länder | Westdeutsche Länder
  - fix: Entweder klare amtliche Kriterien verwenden oder die Gruppen nach eindeutigen Merkmalen wie Stadtstaaten/Flächenländer, alte/neue Länder, Küstenländer usw. neu bauen.

- **de-0022** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - „Elbe“ ist zugleich ein Nordsee-Zufluss und das Hauptgewässer des Elbe-Systems. Obwohl sie nicht in der Elbe-System-Gruppe steht, macht das die System-Labels semantisch überlappend.
  - items: Elbe
  - groups: Elbe-System | Nordsee-Zuflüsse
  - fix: „Nordsee-Zuflüsse“ durch eine andere, nicht überlappende Flusskategorie ersetzen oder nur Nebenflüsse verschiedener Hauptströme verwenden.

- **de-0027** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Uranus und Neptun werden heute meist als Eisriesen, nicht Gasriesen, klassifiziert. Pluto ist zudem kein bloßer generischer „Kleinkörper“, sondern ein Zwergplanet.
  - items: Uranus, Neptun, Pluto
  - groups: Gasriesen | Kleinkörper
  - fix: Label „Riesenplaneten“ verwenden und „Pluto“ in eine Kategorie „Zwergplaneten“ einbauen oder durch „Meteoroid“ ersetzen.

- **de-0028** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - „Muschel“ ist ein Weichtier und steht dadurch sowohl faktisch in „Schalentiere“ als auch in „Weichtiere“. „Schalentiere“ ist zudem kein sauberer zoologischer Begriff für Krabbe/Hummer/Garnele plus Muschel.
  - items: Muschel
  - groups: Schalentiere | Weichtiere
  - fix: „Schalentiere“ in „Krebstiere“ ändern und „Muschel“ durch „Languste“ oder „Krebs“ ersetzen.

- **de-0031** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Die Temperatur-Labels überschneiden sich mit alkoholisch/alkoholfrei: „Glühwein“ ist alkoholisch und heiß; Kaffee, Tee und Kakao können auch kalt getrunken werden; Eistee ist alkoholfrei und kalt.
  - items: Glühwein, Eistee, Kaffee, Tee, Kakao
  - groups: Alkoholfreie Getränke | Alkoholische Getränke | Heiße Getränke | Kalte Getränke
  - fix: Entweder nur nach Alkoholgehalt oder nur nach Temperatur/Servierweise gruppieren, nicht beides in einem Puzzle mischen.

- **de-0035** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Die Käsekategorien überschneiden sich stark: Brie und Camembert sind Weichkäse und Schimmelkäse; Gorgonzola/Roquefort/Stilton/Fourme sind ebenfalls Schimmelkäse und teils Weich- oder Schnittkäse. „Deutsche Käse“ ist eine Herkunftskategorie und nicht parallel zu Konsistenz/Schimmel.
  - items: Brie, Camembert, Gorgonzola, Roquefort, Stilton, Fourme, Tilsiter, Limburger
  - groups: Weichkäse | Hartkäse | Schimmelkäse | Deutsche Käse
  - fix: Nur eine Klassifikationsachse verwenden, z. B. Herkunftsländer oder Konsistenzklassen, und überlappende Schimmelkäsesorten vermeiden.

- **de-0036** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - „Aufschnitt“ ist eine Servierform und überlappt mit Wursttypen: Jagdwurst und Fleischwurst sind Brühwürste, Mortadella ebenfalls brühwurstartig. Damit ist die Gruppe nicht parallel zu Brühwurst/Rohwurst/Kochwurst.
  - items: Jagdwurst, Fleischwurst, Mortadella
  - groups: Brühwurst | Aufschnitt
  - fix: „Aufschnitt“ durch eine echte Wurstherstellungsart ersetzen oder alle Gruppen nach Servierform bilden.

- **de-0040** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - „Kamera“, „Kalender“, „Karten“ und „Notizen“ können Apps sein, aber auch Smartphone-Funktionen. „GPS“ ist zudem eng mit Karten verbunden. Die Kategorien „Apps“ und „Funktionen“ sind für diese Items nicht trennscharf.
  - items: Kamera, Kalender, Karten, Notizen, GPS
  - groups: Apps | Funktionen
  - fix: Apps durch eindeutig benannte App-Typen ersetzen oder Funktionen auf Hardware/Kommunikationsstandards beschränken.

- **de-0045** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Mehrere Figuren/Gegenstände sind märchenspezifisch mehrdeutig: „Zwerg“ kann Helfer sein, gehört aber direkt zu Schneewittchen; „Frosch“ kann ein verzauberter Prinz sein; „Wolf“ ist nicht nur böse Figur, sondern konkret Rotkäppchen/andere Märchen. „Rotkäppchens Korb“ ist kein magischer Gegenstand.
  - items: Zwerg, Frosch, Wolf, Rotkäppchens Korb
  - groups: Böse Figuren | Helfer-Figuren | Magische Gegenstände
  - fix: „Rotkäppchens Korb“ durch einen wirklich magischen Gegenstand ersetzen und Figurenrollen eindeutiger wählen.

- **de-0050** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Mehrere Items sind nicht eindeutig deutsche Erfindungen oder sind falsch zugeordnet: Telefon und Transistor gelten nicht als deutsche Erfindungen; Impfung ist nicht deutsch; Insulin wurde nicht in Deutschland entdeckt; Airbag und ABS sind nicht schlicht deutsche Auto-Erfindungen. „Diesel“ ist zudem eher Person/Kraftstoff/Motorprinzip als Item-Form uneindeutig.
  - items: Telefon, Transistor, Impfung, Insulin, Airbag, ABS, Diesel
  - groups: Auto-Erfindungen | Technik-Erfindungen | Medizin-Erfindungen
  - fix: Nur gut belegte deutsche Erfindungen verwenden, z. B. Dieselmotor, Ottomotor, Aspirin, Röntgenstrahlen, MP3, Buchdruck.

- **de-0053** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - „Krapfen“ und „Berliner“ sind je nach Region Synonyme bzw. sehr nahe Bezeichnungen für dasselbe Gebäck. In einem 4×4-Puzzle sind solche Dubletten unfair.
  - items: Krapfen, Berliner
  - groups: Karnevalsspeisen
  - fix: Eines der beiden durch ein anderes Karnevalsgebäck wie „Quarkbällchen“ ersetzen.

- **de-0062** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Die Kochtechnik-Kategorien überlappen stark: Schmoren, Dünsten, Dämpfen, Pochieren, Garen und Braten im Ofen sind allgemeine Gar-/Kochmethoden; „Garen“ ist ein Oberbegriff für fast alle genannten Techniken.
  - items: Schmoren, Dünsten, Dämpfen, Pochieren, Braten im Ofen, Garen
  - groups: Bratmethoden | Kochmethoden | Backmethoden
  - fix: Nur klar getrennte Technikfamilien verwenden und Oberbegriffe wie „Garen“ vermeiden.

- **de-0082** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Die Kategorie „Alpen-Nationalparks“ enthält „Gesäuse“ und „Hohe Tauern“, die in Österreich liegen, obwohl der Titel „Nationalparks Deutschland“ lautet. Außerdem ist „Bayerischer Wald“ kein Alpen-Nationalpark.
  - items: Gesäuse, Hohe Tauern, Bayerischer Wald
  - groups: Alpen-Nationalparks
  - fix: Entweder den Titel auf DACH/Alpenraum ändern oder nur deutsche Nationalparks verwenden; „Berchtesgaden“ ist der einzige deutsche Alpen-Nationalpark.

- **de-0082** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - „Kellerwald“ und „Sächs. Schweiz“ sind keine Tiefland-Nationalparks; sie liegen in Mittelgebirgslandschaften. Die Gruppe ist sachlich falsch.
  - items: Kellerwald, Sächs. Schweiz
  - groups: Tiefland-Nationalparks
  - fix: Für Tiefland z. B. „Müritz“, „Unteres Odertal“, „Vorpommersche Boddenlandschaft“ und „Hamburgisches Wattenmeer“ verwenden, sofern die übrigen Gruppen entsprechend angepasst werden.

- **de-0086** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - „Rügen“ und „Usedom“ sind Inseln, keine Ostseebäder. In derselben Gruppe stehen mit „Warnemünde“ und „Binz“ tatsächliche Badeorte, daher ist die Kategorie gemischt.
  - items: Rügen, Usedom
  - groups: Ostseebäder
  - fix: Durch konkrete Ostseebäder wie „Heringsdorf“, „Ahlbeck“, „Sellin“ oder „Kühlungsborn“ ersetzen.

- **de-0092** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Drei Gruppen sind Werke nach Autor, die vierte heißt aber „Heine-Themen“ und enthält ebenfalls Werkstitel bzw. verkürzte Werknamen. Das Label ist nicht parallel und macht die Kategorie unnötig unklar.
  - items: Lorelei, Wintermärchen, Buch der Lieder, Deutschland
  - groups: Heine-Themen
  - fix: Label zu „Heine-Werke“ ändern und die Items als eindeutige Werktitel formulieren, z. B. „Die Lore-Ley“ und „Deutschland. Ein Wintermärchen“.

- **de-0093** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Die Begriffe sind für easy sehr abstrakt und bildungs-/fachsprachlich. Kategorien wie Kant-, Hegel-, Nietzsche- und Marx-Begriffe sind eher Expertenwissen als konkrete Alltagskategorien.
  - items: Kat. Imperativ, Ding an sich, Weltgeist, Aufhebung, Phänomenologie, Übermensch, Ewige Wiederkehr, Mehrwert, Entfremdung
  - groups: Kant-Begriffe | Hegel-Begriffe | Nietzsche-Begriffe | Marx-Begriffe
  - fix: Auf ein höheres Tier verschieben oder für easy Philosophie durch deutlich bekanntere, konkrete Kategorien ersetzen.

- **de-0095** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Gutenberg gehört nicht ins 17.-18. Jahrhundert; er lebte im 15. Jahrhundert. Leibniz war zudem eher Universalgelehrter/Mathematiker als einfach „Erfinder“ im selben Sinn wie die anderen.
  - items: Gutenberg, Leibniz
  - groups: Erfinder 17-18. Jh.
  - fix: Gutenberg in eine passende frühere Gruppe setzen oder ersetzen; die Kategorie allgemein sauberer definieren.

- **de-0096** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - „Bergfried“ ist kein Wohnbereich, sondern der Hauptturm einer Burg und kann zudem zur Verteidigung gehören. „Vorburg“ ist ein Burgbereich, aber nicht typisch ein Wohnbereich. Die Gruppe „Burgwohnbereiche“ ist dadurch unsauber.
  - items: Bergfried, Vorburg
  - groups: Burgverteidigung | Burgwohnbereiche
  - fix: Label zu „Burgbereiche“ ändern oder Wohnräume wie „Kemenate“, „Saal“, „Küche“ und „Kammer“ verwenden.

- **de-0097** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - „Schild“ ist sowohl Teil der Ritterausrüstung als auch eine Waffe/Schutzwaffe. Da die Gruppe „Ritterrüstung“ ebenfalls Ausrüstungsteile enthält, kann es plausibel in zwei Gruppen passen.
  - items: Schild
  - groups: Ritterrüstung | Ritterwaffen
  - fix: Durch eine eindeutigere Waffe wie „Morgenstern“ oder „Axt“ ersetzen.

- **de-0103** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - „Walross“ ist ein Meeressäugetier und könnte genauso in „Meerestiere“ passen. „Leopardenrobbe“ und „Blauwal“ sind ebenfalls Säugetiere, stehen aber in „Meerestiere“. Die Kategorien „Säugetiere“ und „Meerestiere“ überschneiden sich stark.
  - items: Walross, Leopardenrobbe, Blauwal, Narwal
  - groups: Säugetiere | Meerestiere
  - fix: Statt „Säugetiere“ und „Meerestiere“ trennscharfe Gruppen verwenden, z. B. „Landtiere“, „Meeressäuger“, „Fische und Wirbellose“, „Vögel“.

- **de-0105** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - „Walhai“ ist kein Meeresraubtier im üblichen Sinn, sondern ein filtrierender Planktonfresser. In einem Puzzle über Haie und Meeresraubtiere ist das irreführend.
  - items: Walhai
  - groups: Haifischarten
  - fix: Durch einen räuberischen Hai wie „Tigerhai“ oder „Makohai“ ersetzen.

- **de-0107** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Die Gruppen „Singvögel“ und „Zugvögel“ überschneiden sich biologisch: Mauersegler, Kuckuck und Rauchschwalbe sind keine Singvögel im engeren Sinn teils, aber mehrere Singvogel-Items sind ebenfalls Zugvögel oder Teilzieher. Spieler können nach Zugverhalten statt Ordnung sortieren.
  - items: Amsel, Buchfink, Rotkehlchen, Blaumeise, Mauersegler, Kuckuck, Rauchschwalbe
  - groups: Singvögel | Zugvögel
  - fix: Keine taxonomischen Gruppen mit Verhaltensgruppen mischen; z. B. „Singvögel“, „Greifvögel“, „Wasservögel“, „Rabenvögel“ verwenden.

- **de-0110** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - „Küchenkräuter“, „Heilkräuter“ und „Teepflanzen“ überschneiden sich stark: Kamille, Pfefferminze, Melisse und Salbei können Heilkräuter und Teepflanzen sein; mehrere Küchenkräuter werden ebenfalls heilkundlich verwendet.
  - items: Kamille, Pfefferminze, Melisse, Salbei, Rosmarin, Thymian
  - groups: Küchenkräuter | Heilkräuter | Teepflanzen
  - fix: Trennscharfe Gruppen nach Pflanzenteil, Giftigkeit, Küchenverwendung oder konkreten Produktformen bilden, nicht nach überlappenden Nutzungen.

- **de-0112** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - „Maifeiertag“ und „Tag der Arbeit“ sind in Deutschland derselbe Feiertag. Zwei Items sind damit Synonyme/nahe Duplikate in derselben Gruppe.
  - items: Maifeiertag, Tag der Arbeit
  - groups: Staatliche Feiertage
  - fix: Eines der beiden Items durch „Tag der Deutschen Einheit“ ausgeschrieben oder einen anderen gesetzlichen Feiertag ersetzen.

- **de-0119** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - „Spielbegriffe“ und „Spielregeln“ sind nicht trennscharf: Rochade, En passant, Patt, Remis, Aufgabe und Umwandlung sind alles regelbezogene Schachbegriffe. Spieler können sie plausibel in beide Gruppen sortieren.
  - items: Rochade, En passant, Patt, Remis, Aufgabe, Umwandlung
  - groups: Spielbegriffe | Spielregeln
  - fix: Eine Gruppe klarer ändern, z. B. „Mattmotive“, „Endspielbegriffe“ oder „Turnierbegriffe“.

- **de-0127** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - „Sukkulenten“ und „Blühpflanzen“ überschneiden sich: Kalanchoe ist eine Sukkulente und zugleich eine Blühpflanze. Auch Kakteen können blühen. Die Gruppen sind nicht trennscharf.
  - items: Kalanchoe, Kaktus, Aloe Vera, Echeveria, Jade-Pflanze
  - groups: Sukkulenten | Blühpflanzen
  - fix: Kalanchoe in Sukkulenten ersetzen oder Gruppen nach nicht überlappenden Zimmerpflanzenfamilien/Alltagsnamen bilden.

- **de-0134** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - „Schwimmstile“ und „Wettkämpfe“ überschneiden sich: „Freistil“ ist ein Wettkampfformat, bedeutet in der Praxis aber meist Kraulschwimmen; Staffelrennen können in verschiedenen Schwimmstilen stattfinden. Die Kategorien sind für Spieler nicht sauber getrennt.
  - items: Kraulen, Freistil, Staffel
  - groups: Schwimmstile | Wettkämpfe
  - fix: „Wettkämpfe“ durch eine klar andere Gruppe ersetzen oder nur Schwimmdisziplinen als eigene, parallel definierte Gruppe verwenden.

- **de-0141** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - "Abseits" is not a standard handball rule; offside is associated with sports such as football/soccer or hockey. This makes the rules group unfair.
  - items: Abseits
  - groups: Spielregeln
  - fix: Replace with a real handball rule/term such as Schrittfehler, Kreis, Anwurf, Passives Spiel, or Doppeldribbling.

- **de-0142** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - "FIBA" is the international basketball federation, not a league. It does not fit the label "Ligen" alongside NBA, BBL, and Euroleague.
  - items: FIBA
  - groups: Ligen
  - fix: Replace with a league such as WNBA, NCAA, ProA, ACB, or Basketball Champions League depending on intended scope.

- **de-0144** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - "Spielregeln" and "Spielelemente" overlap too much in rugby: Gedränge is a set piece/game element like Gasse, Maul, Ruck, and Tackle rather than a cleanly separate rule item. The categories are not semantically distinct enough.
  - items: Gedränge, Gasse, Maul, Ruck, Tackle
  - groups: Spielregeln | Spielelemente
  - fix: Rename/split more concretely, for example "Punktearten" with Try, Umwandlung, Strafkick, Dropkick and "Standardsituationen/Kontaktphasen" with Gedränge, Gasse, Maul, Ruck.

- **de-0148** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The categories "Übungen", "Wettkampfarten", and "Kraftsportbegriffe" overlap conceptually: Reißen and Stoßen are not just exercises but the competition lifts in Gewichtheben, while Gewichtheben/Powerlifting/Strongman are sports rather than comparable "Wettkampfarten". This is not clean enough for easy.
  - items: Reißen, Stoßen, Gewichtheben, Powerlifting, Strongman
  - groups: Übungen | Wettkampfarten | Kraftsportbegriffe
  - fix: Use clearer labels such as "Kraftübungen", "Kraftsportarten", "Ausrüstung", and "Trainingsbegriffe", and avoid placing official competition lifts away from their sport context.

- **de-0149** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - "Slipstream" and "Fahrerfeld" are general motorsport terms, not specific to tourenwagen racing. They could reasonably belong under Formel 1 or general motorsport, so the Tourenwagen group is not exclusive.
  - items: Slipstream, Fahrerfeld
  - groups: Formel 1 | Tourenwagen
  - fix: Replace with touring-car-specific items such as Balance of Performance, Markenpokal, Tourenwagen Masters, or konkrete Serien/Begriffe.

- **de-0150** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The puzzle mixes sailing, rowing, and paddling under overlapping labels. Kajak and Kanu are not rowing boats, while "Skull", "Riemen", and "Achter" are rowing terms/boat classes rather than competitions. "Ergometer" is training equipment, not a rowing competition.
  - items: Kajak, Kanu, Ergometer, Skull, Riemen, Achter
  - groups: Bootstypen | Ruderwettkämpfe
  - fix: Separate into clear categories such as "Segelboottypen", "Paddelboote", "Ruderbootklassen", and "Segelbegriffe", or retitle/rework the puzzle.

- **de-0153** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - The dietary categories are not mutually exclusive. Tofu, Seitan, Tempeh, Lupinen, Nüsse, Beeren, Tomaten, Hülsenfrüchte, and Olivenöl can all be vegetarian/vegan, and several foods can fit multiple diet labels. The groups describe compatible diets rather than exclusive item classes.
  - items: Tofu, Seitan, Tempeh, Lupinen, Olivenöl, Tomaten, Hülsenfrüchte, Nüsse, Beeren, Süßkartoffel
  - groups: Vegane Lebensmittel | Vegetarisch | Mediterran | Paleo
  - fix: Use mutually exclusive labels, e.g. "Pflanzliche Proteinquellen", "Milch/Ei-Produkte", "Mediterrane Klassiker", and "Paleo-typische Lebensmittel", with items that do not cross groups.

- **de-0160** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The relationship categories overlap in everyday life: a Nachbar, Kollege, Kunde, Lieferant, or Teammitglied can also be a friend or acquaintance, and "Bekannter" is not specifically a friendship role. This makes membership context-dependent rather than unambiguous.
  - items: Bekannter, Nachbar, Kollege, Teammitglied, Kunde, Lieferant
  - groups: Freundschaft | Arbeitsbeziehungen
  - fix: Use stricter labels such as "Familie", "Schule", "Arbeitsplatz", and "Nachbarschaft", or choose items that are exclusive role nouns.

- **de-0161** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The population-size groups are factually wrong and internally inconsistent. Bremen has over 500,000 inhabitants, while Augsburg, Wiesbaden, Bonn, and Münster are generally over 200,000 and are not "Große Mittelstädte" in the usual German classification. Also "Über 200.000" semantically includes cities over 500,000 unless the label says 200,000-500,000.
  - items: Bremen, Augsburg, Wiesbaden, Bonn, Münster
  - groups: Über 200.000 Einwohner | Große Mittelstädte
  - fix: Use non-overlapping ranges, e.g. "über 1 Mio.", "500.000-1 Mio.", "300.000-500.000", "200.000-300.000", and update city placement.

- **de-0168** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - IAA is primarily associated with Frankfurt/Main and Munich, not Hannover. It does not fit the Hannover trade-fair group.
  - items: IAA
  - groups: Messen
  - fix: Replace with a Hannover fair such as LIGNA, EuroTier, DOMOTEX, or Infa.

- **de-0169** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Bremerhaven and Fischereihafen are not Bremen city harbors in the same sense as Überseestadt/Weserhafen; Bremerhaven is a separate city. This is confusing in a Bremen Sehenswürdigkeiten puzzle.
  - items: Bremerhaven, Fischereihafen
  - groups: Häfen
  - fix: Use Bremen-specific harbor/river items, or retitle the group to cover Bremen/Bremerhaven explicitly.

- **de-0171** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The title says Germany's neighboring countries, but several items are seas, rivers, a lake, a mountain, or a German state rather than countries. This directly violates the category premise.
  - items: Nordsee, Ostsee, Schleswig-Holstein, Oder, Neisse, Bodensee, Zugspitze
  - groups: Nordnachbarn | Ostnachbarn | Südnachbarn
  - fix: Use only countries, or retitle and relabel the groups as border regions/features rather than neighboring countries.

- **de-0173** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The accession-year group "Beitritt 2013" is factually wrong: only Croatia joined the EU in 2013. Slovenia joined in 2004, while Bulgaria joined in 2007, and Malta joined in 2004.
  - items: Slowenien, Bulgarien, Malta
  - groups: Beitritt 2013
  - fix: Use correct accession cohorts, for example 1957, 1973/1981/1986, 1995/2004, and 2007/2013.

- **de-0177** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Kilimanjaro is a mountain/massif, not a mountain range. It does not belong under "Afrikanische Gebirge" alongside Atlas, Rwenzori, and Drakensberge.
  - items: Kilimandscharo
  - groups: Afrikanische Gebirge
  - fix: Replace with a true African mountain range such as Äthiopisches Hochland or Tibesti.

- **de-0183** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - "Bedrohte Meerestiere" overlaps taxonomically with the other animal groups: Blauwal is a mammal, Lederschildkröte is both a reptile and a marine animal, and several listed fish/sharks are also marine animals. The categories mix habitat and class, so they are not mutually exclusive.
  - items: Blauwal, Lederschildkröte, Mantarochen, Hammerkopfhai, Weißer Stör
  - groups: Bedrohte Säugetiere | Bedrohte Reptilien | Bedrohte Meerestiere
  - fix: Use either taxonomic groups only or habitat groups only, not both.

- **de-0187** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - "Raps" is an oilseed/crop, not an item in an "Obst und Gemüse" group. Its placement is factually wrong for an easy agriculture puzzle.
  - items: Raps
  - groups: Obst und Gemüse
  - fix: Replace with a clear vegetable or fruit such as Karotte, Kartoffel, Apfel, or Kohl.

- **de-0204** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Karl I. was emperor of Austria-Hungary, not a German Kaiser of the Deutsches Kaiserreich. The German emperors were Wilhelm I., Friedrich III., and Wilhelm II.; there is no fourth valid item for this category as written.
  - items: Karl I.
  - groups: Kaiser
  - fix: Change the category to a three-item clue is not possible in this format; replace the group with another four-item imperial category or use a different fourth item under a different label.

- **de-0206** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The labels 'Ereignisse' and 'Probleme der Republik' overlap conceptually: Hyperinflation, Ruhrbesetzung, Kapp-Putsch and Schwarzer Freitag are also major problems of the Weimar Republic, while Putschversuche directly overlaps with Kapp-Putsch.
  - items: Hyperinflation, Kapp-Putsch, Ruhrbesetzung, Schwarzer Freitag, Putschversuche
  - groups: Ereignisse | Probleme der Republik
  - fix: Make one group concrete events and the other non-event structural problems, or replace the problem group with a non-overlapping category.

- **de-0207** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Stalingrad and Stalingrad-Kessel are too close: the encirclement is part of the Battle of Stalingrad and both function as battle/wendepunkt clues.
  - items: Stalingrad, Stalingrad-Kessel
  - groups: Schlachten | Wendepunkte
  - fix: Replace Stalingrad-Kessel with a distinct turning-point item such as Midway or Kriegseintritt der Sowjetunion, or replace Stalingrad in the battle group.

- **de-0208** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - '20. Juli' is an assassination attempt/event, not a resistance group. It also overlaps strongly with 'Attentat' in the actions group and 'Rastenburg' as the place of the attempt.
  - items: 20. Juli, Attentat, Rastenburg
  - groups: Gruppen | Widerstandsaktionen | Orte des Widerstands
  - fix: Replace '20. Juli' with a true group, or rename the group to include movements/events and adjust the other categories to avoid overlap.

- **de-0209** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - 'DDR-Symbole' and 'DDR-Alltag' are not cleanly separable. Trabant, Pionierhalstuch, Ampelmännchen, Datsche, FDJ, Broiler and Plattenbau can all function as everyday DDR symbols or everyday-life items.
  - items: Trabant, Pionierhalstuch, Ampelmännchen, Datsche, FDJ, Broiler, Plattenbau
  - groups: DDR-Symbole | DDR-Alltag
  - fix: Use a more concrete non-overlapping group, such as DDR-Produkte, Organisationen, Wohnen, or Konsum.

- **de-0210** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Montagsdemo appears both as an event and as a symbol, creating a direct duplicate/ambiguity across groups.
  - items: Montagsdemos, Montagsdemo
  - groups: Ereignisse 1989 | Symbole der Wende
  - fix: Remove one occurrence; for symbols, use Kerze, Mauerstück, Trabi, Begrüßungsgeld or similar.

- **de-0210** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Volkskammerwahl belongs to 1990, not 1989, so it is factually wrong in 'Ereignisse 1989'.
  - items: Volkskammerwahl
  - groups: Ereignisse 1989
  - fix: Replace with Prager Botschaft, Mauerfall, Reiseregelung, or Massenausreise.

- **de-0211** (easy) — `OTHER` [high] → verdict: `needs-claude-review`
  - 'Kanzlerinnen-Ära' mixes one person with events/policies from Merkel's tenure. It is not parallel to the CDU/CSU- and SPD-Kanzler groups and creates category confusion.
  - items: Merkel, Große Koalition, Flüchtlingskrise, Energiewende
  - groups: Kanzlerinnen-Ära
  - fix: Use four Merkel-era events/policies, or make the category 'Kanzlerinnen/Kanzler' impossible by replacing it with a clean single-concept group.

- **de-0212** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - The regional labels are fuzzy and overlapping. Niedersachsen is commonly considered northern Germany but is placed under western Länder, while Berlin is geographically eastern Germany but placed under western Länder.
  - items: Niedersachsen, Berlin
  - groups: Nördliche Länder | Östliche Länder | Westliche Länder
  - fix: Use official or unambiguous regions such as Stadtstaaten, Flächenländer, ehemalige DDR-Länder, or alphabetical/coat-of-arms categories.

- **de-0216** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - 'Ruhr-Geschichte' and 'Industrie' overlap heavily: Kohlebergbau and Stahlproduktion are industrial activities directly tied to Zeche, Hochofen, Kokerei and Stahlwerk.
  - items: Kohlebergbau, Stahlproduktion, Zeche, Hochofen, Kokerei, Stahlwerk
  - groups: Ruhr-Geschichte | Industrie
  - fix: Make the history group specific eras/events and keep industrial facility terms separate, or replace one group.

- **de-0218** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Allgäu spans Bavarian Swabia and parts of Upper Bavaria, and Bodensee is not uniquely Bayerisch-Schwaben. These are not clean regional identifiers.
  - items: Allgäu, Bodensee
  - groups: Bayerisch-Schwaben | Oberbayern
  - fix: Replace with places clearly in Bavarian Swabia, such as Kempten, Memmingen, Donauwörth or Neu-Ulm.

- **de-0219** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Wannsee is in Berlin but also a lake in the Berlin/Brandenburg area, making it plausible under 'Brandenburger Seen' as a lake clue despite being categorized as a Berlin Besonderheit.
  - items: Wannsee
  - groups: Brandenburger Seen | Berliner Besonderheiten
  - fix: Replace Wannsee with a non-lake Berlin item such as Fernsehturm, Spree, Ampelmännchen or Pfannkuchen.

- **de-0221** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Zwerg is both a helper in Snow White and one of the well-known fairy-tale figures, while Prinz is often a hero/romantic figure tied to the princess group. The helper category is loose and overlaps with character roles elsewhere.
  - items: Zwerg, Prinz
  - groups: Märchen-Prinzessinnen | Märchen-Helfer
  - fix: Use more specific helper items such as Tauben, Jäger, gute Fee, or sprechende Tiere, and avoid generic role labels.

- **de-0222** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Dornröschen and Aschenputtel are widely known from both Grimm and Perrault traditions, so placing them only under Perrault while also having a Grimm category is ambiguous for German easy solvers.
  - items: Dornröschen, Aschenputtel
  - groups: Grimm-Märchen | Perrault-Märchen
  - fix: Use Perrault tales less strongly associated with Grimm in German, such as Der kleine Däumling or Eselshaut.

- **de-0225** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Heimdall is normally counted among the Asen, not the Wanen, so he is misplaced.
  - items: Heimdall
  - groups: Wanen-Götter
  - fix: Replace Heimdall with Kvasir or another clearer Wanen-associated figure, or move Heimdall to the Asen group.

- **de-0226** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - This is not easy-tier: Wotan aspects, Freyr attributes and Loki's family require specialized mythological knowledge, not concrete everyday categories.
  - items: Allvater, Einäugiger, Wanderer, Heerführer, Ernte, Sonne, Regen, Schiff, Hel, Fenriswolf, Jörmungandr, Sleipnir
  - groups: Wotan-Aspekte | Fruchtbarkeit und Freyr | Lokis Familie
  - fix: Move to medium/hard or replace with simpler named gods, symbols, creatures and places.

- **de-0227** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Rheingold belongs to the Nibelungen/Rhine-gold tradition, not the Loreley legend. It creates a mythology mix-up.
  - items: Rheingold
  - groups: Loreley-Sage
  - fix: Use Loreley-related items such as Felsen, Rhein, Schiffer, Kamm, Gesang.

- **de-0228** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Wünschelrute is not a standard Nibelungen treasure/object; it feels unrelated compared with Nibelungenhort, Tarnkappe and Balmung.
  - items: Wünschelrute
  - groups: Schätze und Gegenstände
  - fix: Replace with Ring, Schwert Balmung, Tarnkappe, Nibelungenhort or Drachenblut.

- **de-0230** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Hexentanzplatz is an actual place associated with witches and also appears elsewhere as a named location; Sabbat is more an event/gathering than a place. The 'Hexen-Orte' group is semantically mixed.
  - items: Hexentanzplatz, Sabbat
  - groups: Hexen-Orte
  - fix: Use four unambiguous places, e.g. Blocksberg, Brocken, Hexentanzplatz, Blocksbergregion, or rename the group to include gatherings.

- **de-0231** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - 'Schreibstile' contains scripts/typefaces (Fraktur, Sütterlin, Antiqua) and formatting/style (Kursiv), which overlaps with writing/book typography rather than a single clean concept. Folio and Oktav are also obscure book-format terms for easy tier.
  - items: Kursiv, Fraktur, Sütterlin, Antiqua, Folio, Oktav, Kolophon
  - groups: Buchformate | Schreibstile | Buchbegriffe
  - fix: Rename to 'Schriften' and replace Kursiv, or make a simpler easy puzzle with everyday reading/writing terms.

- **de-0237** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - 'Deutsche Biografien', 'Zeitgenössische Autobios' and 'Sportler-Biografien' are all person-name groups rather than distinct item types, and 'Biografien' vs 'Autobios' is not visible from the listed names alone. A player cannot know whether a name denotes a biography subject or an autobiography author without external publication assumptions.
  - items: Goethe, Bismarck, Einstein, Sophie Scholl, Helmut Schmidt, Egon Bahr, Ursula von der Leyen, Angela Merkel, Beckenbauer, Boris Becker, Steffi Graf, Michael Schumacher
  - groups: Deutsche Biografien | Zeitgenössische Autobios | Sportler-Biografien
  - fix: Use actual book titles for biography/autobiography categories, or categorize people by clear domains such as Politik, Sport, Wissenschaft, Literatur.

- **de-0238** (easy) — `OBSCURE` [high] → verdict: `needs-claude-review`
  - Thielicke is not a broadly recognized easy-tier travel writer, and 'Roth' is ambiguous among several authors. The Reiseschriftsteller group is much harder and less concrete than the other groups.
  - items: Thielicke, Roth
  - groups: Reiseschriftsteller
  - fix: Use clearly known travel writers/explorers such as Marco Polo, Goethe, Heine, Humboldt, or replace the group entirely.

- **de-0240** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - TV-Formate and TV-Genres overlap: Talkshow, Gameshow, Soap Opera, Dokumentation, Krimi, Komödie, Nachrichten and Reality-TV are all program types/genres. The distinction is not stable for a 4x4 puzzle.
  - items: Talkshow, Gameshow, Soap Opera, Dokumentation, Krimi, Komödie, Nachrichten, Reality-TV
  - groups: TV-Formate | TV-Genres
  - fix: Use one program-type group and replace the other with presenters, broadcasters, or technical TV terms.

- **de-0241** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Grimme-Preis and Bambi are television/media awards, not specifically film prizes; Deutscher Filmpreis and Lola also duplicate conceptually because Lola is the trophy/nickname of the Deutscher Filmpreis.
  - items: Grimme-Preis, Bambi, Lola, Deutscher Filmpreis
  - groups: Filmpreise
  - fix: Use film-specific awards such as Berlinale Bär, Deutscher Filmpreis, Bayerischer Filmpreis and Europäischer Filmpreis; avoid pairing Lola with Deutscher Filmpreis.

- **de-0242** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Das Boot is not a New Wave/Neuer Deutscher Film item in the same way as Angst essen Seele auf or Woyzeck; Tin Drum is the English title of Die Blechtrommel and is culturally mismatched in a German puzzle.
  - items: Das Boot, Tin Drum
  - groups: Neue Welle Filme
  - fix: Use German titles and clearer New German Cinema examples such as Aguirre, Die Ehe der Maria Braun, Alice in den Städten or Die verlorene Ehre der Katharina Blum.

- **de-0243** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The rock and pop artist categories overlap: Nena, Peter Maffay and Udo Lindenberg are commonly discussed across pop/rock/Schlager boundaries, so the split is not clean.
  - items: Nena, Peter Maffay, Udo Lindenberg, Scorpions, Rammstein, Die Toten Hosen
  - groups: Deutsche Rock-Künstler | Deutsche Pop-Künstler
  - fix: Use narrower labels such as Rockbands, Schlager/Pop-Sänger, Neue Deutsche Welle, or Electronic.

- **de-0245** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Kraftwerk and Can are primarily electronic/krautrock groups rather than straightforward 70er rock bands; Nena is both a band and singer/project name, but usually associated with NDW/pop rather than a clean rock-band category.
  - items: Kraftwerk, Can, Nena
  - groups: Rockbands 70er | Rockbands 80er
  - fix: Use unambiguous rock bands for each decade, or rename to broader German bands by decade.

- **de-0247** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Several festival labels are not clean: Wacken is primarily metal rather than general rock, MS Dockville and Fusion are multi-genre and not exclusively electronic, and Taubertal is more rock/indie than folk.
  - items: Wacken, MS Dockville, Fusion, Taubertal
  - groups: Rock-Festivals | Elektronik-Festivals | Folk-Festivals
  - fix: Use more precise labels such as Metal-Festivals, Pop/Rock-Festivals, Elektronik-Festivals, Folk/Weltmusik-Festivals, or swap ambiguous festivals.

- **de-0254** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - Deutsches Historisches and DHM Berlin refer to the same museum, creating a duplicate within the Geschichtsmuseen group.
  - items: Deutsches Historisches, DHM Berlin
  - groups: Geschichtsmuseen
  - fix: Keep one and replace the other with another history museum.

- **de-0256** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Meßberg is a location associated with Kontorhausviertel, while Chilehaus, Sprinkenhof and Mohlenhof are buildings. It is not parallel and can also fit broader historic Hamburg geography.
  - items: Meßberg
  - groups: Kontorhäuser | Historisches Hamburg
  - fix: Replace Meßberg with a specific Kontorhaus such as Montanhof.

- **de-0257** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Frauenkirche is Gothic, not Münchner Barock, so it is misplaced.
  - items: Frauenkirche
  - groups: Münchner Barock
  - fix: Replace with Asamkirche, Bürgersaalkirche, Schloss Schleißheim or another clear Baroque item.

- **de-0260** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - AEG-Turbinenhalle is a landmark of early modern industrial architecture, not Jugendstil.
  - items: AEG-Turbinenhalle
  - groups: Jugendstil-Bauten
  - fix: Replace with Mathildenhöhe, Secessionsgebäude, Majolikahaus, or another Jugendstil/Art Nouveau building.

- **de-0262** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several brand-category placements are questionable: Trigema is not streetwear, Steiff is mainly plush toys rather than an accessories fashion brand, and Birkenstock is footwear rather than an accessories brand.
  - items: Trigema, Steiff, Birkenstock
  - groups: Streetwear-Marken | Accessoires-Marken
  - fix: Use clearer German fashion/accessory labels or rename categories to match the included brands.

- **de-0264** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Keramik-Stile mixes materials/types (Steingut, Steinzeug, Porzellan, Terrakotta), while Porzellan also strongly points to Meißen in the places group. The style/type/place categories are not clean for easy solvers.
  - items: Porzellan, Meißen, Steingut, Steinzeug, Terrakotta
  - groups: Keramik-Stile | Berühmte Keramik-Orte
  - fix: Rename to 'Keramikarten' and avoid including a place whose fame is defined by one listed type, or use simpler object/tool categories.

- **de-0265** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Glasprodukte and Glas-Anwendungen overlap: Trinkglas is a glass product, and Linse/Optik and Glasfaser are both application/product-like technical uses. The distinction is not stable.
  - items: Kelch, Spiegel, Fensterscheibe, Linse, Optik, Solarpanel, Glasfaser, Trinkglas
  - groups: Glasprodukte | Glas-Anwendungen
  - fix: Separate into concrete household products and industrial/scientific applications without borderline items, or replace one group.

- **de-0268** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The categories „Webtechniken“, „Textilien“ and „Textil-Muster“ overlap semantically. „Damast“ and „Jacquard“ are not just simple visual patterns; they are tied to weave structures/techniques and can also name fabrics.
  - items: Damast, Jacquard
  - groups: Webtechniken | Textilien | Textil-Muster
  - fix: For an easy puzzle, use plain visual patterns only, e.g. „Streifen, Karo, Punkte, Blumenmuster“, and avoid weave/fabric terms.

- **de-0271** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - „Bundeswirtschaftsrat“ is not a standard German economic institution on the level of Bundesbank, IHK or Ifo-Institut. It is likely to confuse solvers or be perceived as invented/incorrect.
  - items: Bundeswirtschaftsrat
  - groups: Wirtschaftsinstitutionen
  - fix: Replace with a clearer institution such as „Bundeskartellamt“, „Wirtschaftsministerium“ or „DIHK“.

- **de-0280** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - „Handelsprodukte“ is mislabeled: „Eigenmarke“, „Markenprodukt“, „Sonderangebot“ and „Aktionsware“ are product/offer types and retail concepts, overlapping with „Handelsbegriffe“.
  - items: Eigenmarke, Markenprodukt, Sonderangebot, Aktionsware, Rabatt, Treuepunkte
  - groups: Handelsprodukte | Handelsbegriffe
  - fix: Rename „Handelsprodukte“ to „Angebotsarten“ or replace with actual product categories like „Milch, Brot, Waschmittel, Obst“.

- **de-0284** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - „Verfassungsschutz“ is not a police authority; it is a domestic intelligence agency. In a „Polizeibehörden“ group, this is factually wrong.
  - items: Verfassungsschutz
  - groups: Polizeibehörden
  - fix: Replace with „Zollfahndung“ only if broad law enforcement is intended, or use a police-specific authority.

- **de-9015** (easy) — `OTHER` [high] → verdict: `needs-claude-review`
  - The puzzle has 17 items: the „Vertrauen“ group contains five entries, while a 4×4 puzzle requires exactly four items per group.
  - items: Augen zu, Hand geben, Schlüssel übergeben, Geheimnis geteilt, Ohne Vertrag besiegelt
  - groups: Vertrauen
  - fix: Remove one item from „Vertrauen“ so the puzzle has exactly 16 items.

- **de-9033** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - „Stellt sich tot“ is not a characteristic fox behavior; it is more associated with animals such as opossums or some prey species. This makes the Fuchs group unfair.
  - items: Stellt sich tot
  - groups: Fuchs
  - fix: Replace with a fox-specific clue such as „Schleicht im Bau“ or „Bellt heiser nachts“.

- **de-0301** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several entries in the double-meaning groups do not satisfy the stated category. In particular, Bank and Sessel are not animal names; Falke is not a household appliance; and Hammer is a tool rather than a household appliance and only an animal by abbreviation/compound such as Hammerhai.
  - items: Bank, Sessel, Falke, Hammer
  - groups: Tier UND Sitzgelegenheit | Tier UND Haushaltsgerät
  - fix: Replace with words that are independently common animal names and common names for the other domain.

- **de-0302** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several alleged colloquial profession terms are not actually colloquial terms for the listed profession. Bücherwurm is a bookworm, not a teacher; Wachmann is normally a guard/security guard, not a police officer; Jurist is a standard broader legal profession term, not specifically a colloquial lawyer term; Pädagoge is standard, not folk slang for teacher.
  - items: Bücherwurm, Wachmann, Jurist, Pädagoge
  - groups: Umgangssprachlich: Polizist | Umgangssprachlich: Lehrer | Umgangssprachlich: Anwalt
  - fix: Use clearly profession-specific colloquialisms, and avoid standard occupational titles.

- **de-0303** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Some city nickname entries appear malformed, invented, or not established German nicknames. 'Weltstadt Herz' is missing the usual 'mit' in 'Weltstadt mit Herz'; 'Lederhosen-Hptst.', 'Frauenkirchen-Stadt', and 'Kölsche Metropole' read as artificial descriptors rather than recognizable nicknames.
  - items: Weltstadt Herz, Lederhosen-Hptst., Frauenkirchen-Stadt, Kölsche Metropole
  - groups: Spitzname: Dresden | Spitzname: München | Spitzname: Köln
  - fix: Use established nicknames in their normal forms, e.g. 'Weltstadt mit Herz'.

- **de-0308** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The labels say 'Erstes Wort', but the listed items are work titles, not first words of those works. The category wording is therefore factually inconsistent with the answers.
  - items: Faust, Iphigenie, Egmont, Götz, Kabale, Räuber, Wallenstein, Maria Stuart, Verwandlung, Prozess, Schloss, Amerika, Buddenbrooks, Zauberberg, Doktor Faustus, Tonio Kröger
  - groups: Erstes Wort: Goethe | Erstes Wort: Schiller | Erstes Wort: Kafka | Erstes Wort: Thomas Mann
  - fix: Rename the labels to 'Werke von ...' or replace items with actual opening words.

- **de-0309** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Several abbreviations are not uniquely tied to the period named. KPD, SPD, and Reichswehr existed in the Weimar period but are not exclusive to it as abbreviations or institutions; BKA, BND, and MAD are BRD institutions but not specifically a distinct 'BRD-Zeit' historical abbreviation set in the same sense as DDR/NS categories.
  - items: KPD, SPD, Reichswehr, BKA, BND, MAD
  - groups: Abkürzungen: BRD-Zeit | Abkürzungen: Weimarer Zeit
  - fix: Use period-exclusive institutions/abbreviations or relabel as 'gegründet/typisch in ...' with tighter criteria.

- **de-0311** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Qasim and Bahr did not receive the Nobel Peace Prize. Bahr is associated with Ostpolitik but was not a Nobel laureate; 'Qasim' is not a German Nobel Peace Prize winner.
  - items: Qasim, Bahr
  - groups: Nobelpreis Frieden
  - fix: Replace with actual German or Germany-associated Peace Prize laureates, depending on the intended scope.

- **de-0313** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Prolegomena is not one of Kant's three Critiques, so the group 'Kants drei Kritiken' cannot contain four valid items with Prolegomena included.
  - items: Prolegomena
  - groups: Kants drei Kritiken
  - fix: Rename the group to include major critical works, or replace Prolegomena with a valid related category item and adjust the label.

- **de-0313** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Kants Kernbegriffe and Kants Kategorien overlap conceptually because categories such as Kausalität, Substanz, Wechselwirkung, and Modalität are also Kantian core concepts. 'Transzendental' also cuts across the works and categories.
  - items: Transzendental, Kausalität, Substanz, Wechselwirkung, Modalität
  - groups: Kants Kernbegriffe | Kants Kategorien
  - fix: Separate by precise type, e.g. 'Kategorien der Relation/Modalität' versus 'Begriffe außerhalb der Kategorientafel'.

- **de-0317** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Libido is not cleanly a separate 'Trieb' alongside Eros and Thanatos; it is psychic/sexual energy in Freud and overlaps with Eros. Unbewusstes is not one of the structural instances Es/Ich/Über-Ich, so it does not fit 'Freuds Instanzen'.
  - items: Libido, Unbewusstes
  - groups: Freuds Triebe | Freuds Instanzen
  - fix: Keep Instanzen to Es, Ich, Über-Ich and use a different fourth item/category; separate drives from energies/concepts.

- **de-0321** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Rattenfänger is primarily associated with Hameln in Lower Saxony and is not a general North German sea/coast legend. Erdmänneken is more broadly German/Westphalian and not clearly Schwarzwald. Wildes Heer is widespread across Germanic folklore, not specifically Bavarian.
  - items: Rattenfänger, Erdmänneken, Wildes Heer
  - groups: Sagen: Schwarzwald | Sagen: Norddeutschland | Sagen: Bayern
  - fix: Use location-specific legends with unambiguous regional attachment.

- **de-0325** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The 'Nur ...' labels are too absolute and factually wrong. Beichte and Eucharistie exist in multiple Christian traditions; Synode is not only Protestant; Patriarch is not only Orthodox; Landeskirche is a regional Protestant structure but not a general 'only evangelical' doctrine.
  - items: Beichte, Eucharistie, Synode, Patriarch, Landeskirche
  - groups: Nur katholisch | Nur evangelisch | Nur orthodox | Allgemein christlich
  - fix: Remove 'Nur' or use tradition-specific institutional terms that are genuinely exclusive in ordinary usage.

- **de-0327** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The title groups overlap historically and conceptually. Kaiser, König, Herzog, and Fürst can be ancient, medieval, or modern monarchic titles; Kalif and Papst are also rulers as well as religious titles; Consul is an office rather than a monarchic-style ruler title.
  - items: Kaiser, König, Papst, Kalif, Consul
  - groups: Monarchische Titel | Religiöse Titel | Antike Herrschertitel | Moderne Herrschertitel
  - fix: Use non-overlapping criteria, such as 'monarchic rank', 'religious office', 'Roman offices', and 'modern executive offices'.

- **de-0331** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The labels are inaccurate. Newton's laws of motion are three laws; the gravitational law is Newtonian but not one of the three. Ohm's law is a single relation, while Widerstand, Spannung, and Stromstärke are electrical quantities. Boyle's gas law is not the umbrella for Gay-Lussac, Charles, and Avogadro.
  - items: Gravitationsgesetz, Widerstand, Spannung, Stromstärke, Gay-Lussac, Charles, Avogadro
  - groups: Newtons Gesetze | Ohms Gesetze | Boyles Gasgesetze
  - fix: Rename groups to 'Newtonsche Physik', 'Elektrische Grundgrößen', and 'Gasgesetze' or replace items with exact laws.

- **de-0332** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Verbrennung is itself a redox/oxidation process, so 'Verbrennungsreaktion' and 'Redoxreaktion' overlap. Oxidation belongs directly to redox as well as combustion.
  - items: Oxidation
  - groups: Verbrennungsreaktion | Redoxreaktion
  - fix: Avoid nested reaction categories; use mutually exclusive example reactions or mechanisms.

- **de-0339** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Breitensuche, Tiefensuche, and A-Stern are also graph algorithms, so 'Suchalgorithmen' and 'Graphenalgorithmen' overlap. SHA-256 is a hash function, not an encryption algorithm in the same sense as AES/RSA.
  - items: Breitensuche, Tiefensuche, A-Stern, SHA-256
  - groups: Suchalgorithmen | Graphenalgorithmen | Kryptographiealgorithmen
  - fix: Use non-graph search algorithms for the search group, or relabel the graph group to shortest path/MST.

- **de-0340** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - NoSQL is not a database language; it is an umbrella term/model family. GraphQL is primarily an API query language, not a database language in the same class as SQL/SPARQL.
  - items: NoSQL, GraphQL
  - groups: Datenbanksprachen
  - fix: Replace with actual database query languages or relabel the category.

- **de-0346** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Stickney is a crater on Phobos, not a moon of Mars. Laputa is fictional and not a real Martian moon. Mars has only Phobos and Deimos.
  - items: Stickney, Laputa
  - groups: Monde des Mars
  - fix: Do not make a four-item 'Moons of Mars' group; choose another planet or change the category.

- **de-0348** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Dunkle Energie is not a dark matter concept; it is a separate cosmological component. Gravitationslinse is an observational effect used to infer dark matter, not itself a dark matter concept.
  - items: Dunkle Energie, Gravitationslinse
  - groups: Dunkle Materie Konzepte
  - fix: Replace with dark matter candidates/properties or relabel the group as broader cosmology evidence/components.

- **de-0352** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The Stummfilm and Expressionismus groups overlap heavily: Nosferatu, Metropolis, Der Golem, and Das Cabinet des Dr. Caligari are silent-era German films and several are also central expressionist works. Caligari appears split by shortened title while 'Das Cabinet' refers to the same film, creating a direct duplicate/overlap.
  - items: Nosferatu, Metropolis, Der Golem, Das Cabinet, Caligari
  - groups: Stummfilme Meisterwerke | Expressionistisch
  - fix: Do not split German silent film and expressionist film as separate groups unless the items are mutually exclusive.

- **de-0352** (medium) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - 'Das Cabinet' and 'Caligari' both point to Das Cabinet des Dr. Caligari, so the puzzle contains duplicate references to the same film across different groups.
  - items: Das Cabinet, Caligari
  - groups: Stummfilme Meisterwerke | Expressionistisch
  - fix: Remove one and replace with a distinct film.

- **de-0361** (medium) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - Nachtwache and Die Nachtwache are the same painting, duplicated in the same group.
  - items: Nachtwache, Die Nachtwache
  - groups: Öl auf Leinwand
  - fix: Replace one duplicate with a distinct oil-on-canvas work.

- **de-0361** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Mona Lisa is painted on a poplar panel, not oil on canvas. Leonardo's Last Supper is a mural using tempera/oil on dry wall, not a true fresco. The group labels by technique are therefore factually wrong for major items.
  - items: Mona Lisa, Letztes Abendmahl
  - groups: Öl auf Leinwand | Fresco-Werke
  - fix: Use works whose support/technique matches the label exactly.

- **de-0365** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - "Mediterrane Gerichte" and "Arabische Gerichte" are overlapping regional food domains. Items such as Hummus, Tabouleh and Falafel are commonly understood as both Levantine/Arab and Mediterranean, so the category boundary is not fair.
  - items: Falafel, Hummus, Tabouleh
  - groups: Mediterrane Gerichte | Arabische Gerichte
  - fix: Use non-overlapping regional labels, or replace the Mediterranean set with clearly Southern European dishes and the Arab set with items not commonly marketed as Mediterranean.

- **de-0366** (medium) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - Pinot Noir and Spätburgunder are the same grape variety under different names, so the red grape group contains duplicate identities.
  - items: Pinot Noir, Spätburgunder
  - groups: Rote Rebsorten
  - fix: Replace one with a distinct red variety such as Syrah, Malbec, Tempranillo or Cabernet Franc.

- **de-0368** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The puzzle separates French cutting techniques from "Französische Küchentechn." but Brunoise, Julienne and Chiffonade are themselves French culinary techniques. "Mise en place Begriffe" is also an imprecise label for cutting/prep methods.
  - items: Brunoise, Julienne, Chiffonade, Taillieren
  - groups: Mise en place Begriffe | Französische Küchentechn.
  - fix: Rename the first group to "Schneidetechniken" and the fourth to a non-overlapping technique family, or replace the French technique group with non-cutting cooking methods only.

- **de-0372** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - "Bundesverfassung" is not the standard institution/document name in Germany; the constitution is the Grundgesetz. As written it is not parallel with Bundestag, Bundesrat and Bundeskanzler.
  - items: Bundesverfassung
  - groups: Deutsches Politiksystem
  - fix: Replace with Grundgesetz, Bundespräsident or Bundesverfassungsgericht depending on the intended category.

- **de-0373** (medium) — `OBSCURE` [high] → verdict: `needs-claude-review`
  - The NATO and G7 groups rely heavily on specialist abbreviations or insider process terms. NAC, SACEUR, ACO, Sherpas and Troika are likely too obscure for a medium German general-audience puzzle.
  - items: NAC, SACEUR, ACO, Sherpas, Troika
  - groups: NATO-Strukturen | G7-Gremien
  - fix: Use more recognizable international-organization terms or raise the tier.

- **de-0378** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - CRISPR is a gene-editing method/tool, not an application. GMO and Transgen are organism/property concepts, and "Genfarm" is not a standard German biotech application term.
  - items: CRISPR, GMO, Genfarm, Transgen
  - groups: Gentechnik-Anwendungen
  - fix: Rename to "Gentechnik-Begriffe" or replace with actual applications such as Gentherapie, Pflanzenzüchtung, Diagnostik and Pharmaproduktion.

- **de-0382** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Water is generally not counted as a macronutrient in the same nutritional classification as carbohydrates, protein and fat.
  - items: Wasser
  - groups: Makronährstoffe
  - fix: Replace Wasser with Ballaststoffe if using a broader nutrition grouping, or retitle to "Hauptnährstoffe und Wasser".

- **de-0389** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Kreideküste is a landform/geological feature, not a geological event. It does not fit alongside Variscan folding, Alpine uplift and glaciation.
  - items: Kreideküste
  - groups: Geologische Ereignisse
  - fix: Replace with a real geological event/process such as Kreidezeit, Gebirgsbildung or Eiszeit.

- **de-0390** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - El Niño is a coupled ocean-atmosphere climate phenomenon, not a marine current. Thermohalin is also an adjective/short form for thermohaline circulation, not a named current like Golfstrom or Humboldtstrom.
  - items: Thermohalin, El Niño
  - groups: Meeresströmungen
  - fix: Use named currents such as Kuroshio, Benguelastrom, Labradorstrom or Antarktischer Zirkumpolarstrom.

- **de-0403** (medium) — `OTHER` [high] → verdict: `needs-claude-review`
  - The category labels say "Gegensätze", but each group contains two antonym pairs rather than four items sharing a single category. The solve logic becomes pair-based and may be confusing for a 4-item grouping puzzle.
  - items: heiß, kalt, glühend, eisig, riesig, winzig, gewaltig, zwergenhaft
  - groups: Temperatur-Gegensätze | Größen-Gegensätze
  - fix: Retitle groups as semantic fields such as Temperaturwörter and Größenwörter, or use four clear members of one pole per category.

- **de-0404** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The adverb group is not grammatically reliable. "Schriftweise" is uncommon/unnatural, and "werfend" is a participle rather than a normal adverb parallel to the others. "Laufend" can also be adjectival/participle.
  - items: laufend, schriftweise, sprungartig, werfend
  - groups: Adverbien
  - fix: Replace the adverb category with a more robust part-of-speech group, or use unambiguous adverbs.

- **de-0406** (medium) — `OTHER` [high] → verdict: `needs-claude-review`
  - The "PKW steht für …" group is not a normal category: it contains fragments of one abbreviation expansion, including distractors or partial words. "Personenkraft" and "Kraftwagen" together form Personenkraftwagen, while "Privat" is wrong.
  - items: Personenkraft, Wagen, Privat, Kraftwagen
  - groups: PKW steht für …
  - fix: Replace this group with a parallel abbreviation category, or use four complete abbreviations and their meanings.

- **de-0409** (medium) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Matching aria incipits to operas at this density is specialist opera knowledge, especially with shortened German/Italian titles. This is too hard for medium.
  - items: Là ci darem, Madamina, Batti batti, Durch die Wälder, Wie nahte mir, Was gleicht wohl
  - groups: Aus Don Giovanni | Aus dem Freischütz
  - fix: Raise difficulty or use more widely known complete aria titles.

- **de-0410** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Goethe and Schiller are deliberately split by life phase across Sturm und Drang and Weimarer Klassik. This is historically defensible but unfair as a grouping puzzle because the same identity belongs to two listed literary-epoch categories.
  - items: Goethe (jung), Goethe (reif), Schiller (jung), Schiller (reif)
  - groups: Sturm und Drang | Weimarer Klassik
  - fix: Avoid splitting the same author by phase; use distinct representatives for each epoch.

- **de-0411** (medium) — `OTHER` [high] → verdict: `needs-claude-review`
  - Each category is keyed by the prompt phrase and contains one correct completion plus three incorrect completions. That creates trivia/multiple-choice sets rather than four items that all belong to the category.
  - items: … Ende gut, … wohl bedacht, … Glück gehabt, … singt am besten, … fliegt am weit, … kennt den Tag
  - groups: Ende gut … | Der frühe Vogel … | Viele Köche … | Wer zuletzt lacht …
  - fix: Use four complete proverb endings as one group and separate them from other proverb-related categories, or redesign as a different puzzle type.

- **de-0413** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Leibniz died in 1716 and is usually classified as early modern/rationalist, not straightforwardly as an Enlightenment figure in the same German literary-historical sense as Kant and Lessing. Beethoven and Kleist are also not cleanly "Romantik-Ära" representatives.
  - items: Leibniz, Beethoven, Kleist
  - groups: Aufklärung | Romantik-Ära
  - fix: Use more clearly period-aligned figures, or retitle categories as broad chronological eras rather than movements.

- **de-0418** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Major philosophers cannot be cleanly assigned to only one of these broad themes. Kant is central to ethics as well as epistemology, Nietzsche to existential questions as well as ethics, and Marx to economics/history as well as society.
  - items: Kant, Nietzsche, Marx, Aristoteles, Hume
  - groups: Erkenntnistheorie | Ethik | Gesellschaft | Existenz & Sein
  - fix: Use specific works or doctrines rather than whole philosophers, or make the categories much narrower.

- **de-0420** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The Pan Am Building is not a Walter Gropius building; it was designed by Emery Roth & Sons with Pietro Belluschi and Walter Gropius as collaborating architects, making attribution contested and not parallel with the other examples.
  - items: Pan Am Gebäude
  - groups: Gropius-Bauten
  - fix: Replace with a more direct Gropius work such as Gropius House or Auerbach House.

- **de-0421** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - "Symbole des Wunders" and "Produkte der Zeit" are not semantically distinct; Kühlschrank, Fernsehen, Plattenspieler and Waschmaschine can all be products and symbols of the Wirtschaftswunder consumer era.
  - items: Kühlschrank, Fernsehen, Plattenspieler, Waschmaschine, VW Käfer, Vespa
  - groups: Symbole des Wunders | Produkte der Zeit
  - fix: Make one category specifically "Konsumgüter" and replace the other with non-product symbols, or merge/rebuild the split.

- **de-0424** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Put-Option is both a hedge strategy instrument and a derivative type, while Leerverkauf/Short exposure can also be a bearish strategy. The hedge and derivative categories overlap by design here.
  - items: Put-Option, Futures, Call-Option, Forward, Zertifikat
  - groups: Hedge-Strategien | Derivate-Typen
  - fix: Separate strategies from instruments more cleanly, e.g. use "Hedge-Techniken" without derivative names or make both groups instrument types with non-overlapping labels.

- **de-0425** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Lohnsteuer and Kapitalertragsteuer are Erhebungsformen/Sonderformen der Einkommensteuer, while Schenkungsteuer is closely linked with Erbschaftsteuer. The category labels are tax types but include subtypes and adjacent taxes, creating nested relationships.
  - items: Lohnsteuer, Kapitalertragsteuer, Schenkungsteuer
  - groups: Einkommensteuer | Erbschaftsteuer
  - fix: Use only concepts within each tax type that are not themselves separate tax labels, or retitle categories to "Begriffe rund um …".

- **de-0427** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Schulwesen is primarily Article 7 GG, which fits Art. 6-10, but Versammlungsfreiheit is Article 8 and Briefgeheimnis Article 10. The larger issue is Article 9 (Vereinigungsfreiheit) is absent while Art. 6-10 has only selected topics; that may be acceptable. However, Auslieferungsverbot is Article 16/16a context, not Art. 11-15, so it is placed in the wrong range.
  - items: Auslieferungsverbot
  - groups: Art. 11–15 GG
  - fix: Replace with Sozialisierung, Eigentum/Erbrecht or Staatsangehörigkeit depending on intended range, or adjust the article range.

- **de-0430** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Das Montrealer Protokoll ist primär ein Abkommen zum Schutz der Ozonschicht, nicht ein Klimaschutzabkommen wie Paris/Kyoto/Glasgow. Außerdem ist der TTIP-Entwurf kein abgeschlossenes internationales Abkommen.
  - items: Montrealer Protokoll, TTIP-Entwurf
  - groups: Klimaschutz | Handel
  - fix: Montrealer Protokoll durch ein klar klimaorientiertes Abkommen ersetzen; TTIP-Entwurf durch ein tatsächlich geschlossenes Handelsabkommen ersetzen.

- **de-0432** (medium) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Die Zuordnung von Jugendsprache zu Jahrzehnten ist sehr unscharf und kaum fair lösbar: viele Wörter waren über mehrere Jahrzehnte verbreitet oder wurden erst später im Mainstream bekannt. Besonders 'Krass', 'Trash', 'Chillen', 'Digger', 'Lol', 'Nerd' und 'Fail' sind nicht eindeutig an genau eines der genannten Jahrzehnte gebunden.
  - items: Krass, Trash, Chillen, Digger, Lol, Nerd, Fail
  - groups: 80er-Jugendsprache | 90er-Jugendsprache | 00er-Jugendsprache | 10er-Jugendsprache
  - fix: Auf klar datierbare Jugendwörter/Jugendwort-des-Jahres-Belege umstellen oder die Kategorien thematisch statt chronologisch gestalten.

- **de-0433** (medium) — `OBSCURE` [high] → verdict: `needs-claude-review`
  - Mehrere Slogans sind für ein deutsches Medium-Puzzle zu unbekannt oder nicht eindeutig marken-/branchenzuordenbar. 'Samsung needs you', 'Made for real life', 'Inspire Innovate' und 'Create together' wirken nicht wie breit bekannte deutsche Werbesprüche; Spieler müssten Spezial- oder Werbehistorienwissen haben.
  - items: Samsung needs you, Made for real life, Inspire Innovate, Create together
  - groups: Elektronikslogans | Kleidungsslogans
  - fix: Durch sehr bekannte deutsche Slogans ersetzen und sicherstellen, dass jeder Slogan eindeutig einer Branche zugeordnet ist.

- **de-0435** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - 'Dreibund' ist ein politisch-militärisches Bündnis, kein kulturelles Symbol des Kaiserreichs. 'Wilhelminisch' ist ein Stil-/Epochenadjektiv, aber als einzelnes Item kein konkretes Symbol wie die anderen Einträge.
  - items: Dreibund, Wilhelminisch
  - groups: Kulturelle Symbole
  - fix: Durch klar kulturelle Symbole ersetzen, etwa konkrete Kulturartefakte, Stilobjekte oder Orte.

- **de-0439** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - 'Schabbat' und 'Ramadan' sind keine Feste im gleichen Sinn wie die übrigen Einträge: Schabbat ist ein wöchentlicher Ruhetag, Ramadan ein Fastenmonat. Dadurch passen sie nicht sauber in 'Religiöse Feste'.
  - items: Schabbat, Ramadan
  - groups: Jüdische Feste | Islamische Feste
  - fix: Schabbat durch Sukkot, Chanukka oder Purim ersetzen; Ramadan durch ein eigentliches Fest ersetzen.

- **de-0440** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Die Kategorien überschneiden sich konzeptuell: Propheten sind im Alten Testament, und Apostel Jesu sind im Neuen Testament. Zudem sind mehrere Namen mehrdeutig oder überlappend, z. B. Johannes kann Apostel/Evangelist/Täufer sein und Jakobus ist ein Apostel im Neuen Testament.
  - items: Johannes, Jakobus, Jesaja, Jeremia, Ezechiel, Amos
  - groups: Altes Testament | Neues Testament | Propheten | Apostel Jesu
  - fix: Nicht nach Testament und Rollen gleichzeitig sortieren. Entweder vier Rollenkategorien oder vier klar getrennte Buch-/Traditionsgruppen verwenden.

- **de-0445** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - 'Der Schrei' ist eine Vorläufer-/Ikonenposition, aber nicht sauber als expressionistisches Werk im engeren Gruppensinn. 'Verkündigung' ist ohne Künstler/Titelkontext mehrdeutig und kein eindeutig bekanntes expressionistisches Werk.
  - items: Der Schrei, Verkündigung
  - groups: Expressionis.-Werke
  - fix: Eindeutig expressionistische Werke mit klarem Titel verwenden.

- **de-0446** (medium) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - 'Automat. Schreiben' und 'Écriture automatique' sind im Wesentlichen dasselbe Verfahren in deutscher bzw. französischer Bezeichnung und stehen in derselben Vierergruppe.
  - items: Automat. Schreiben, Écriture automatique
  - groups: Surrealist.-Techniken
  - fix: Einen der beiden Einträge durch eine andere surrealistische Technik wie 'Cadavre exquis' oder 'Frottage' ersetzen.

- **de-0466** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Die Kategorien überschneiden sich: Tier-Aberglaube enthält Glücks- und Unglückszeichen, während Glücksbringer/Unglücksbringer ebenfalls nach Wirkung sortieren. 'Schwalbe = Glück' könnte in Glücksbringer, 'Krähe = Unglück' in Unglücksbringer gehören.
  - items: Schwalbe = Glück, Krähe = Unglück, Eule = Tod, Marienkäfer
  - groups: Glücksbringer | Unglücksbringer | Tier-Aberglaube
  - fix: Entweder nach Objektart sortieren oder nach positiver/negativer Wirkung, aber nicht beides mischen.

- **de-0471** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - 'Schmale Biene' ist kein gängiger deutscher Name einer typischen Nischen-Art. Die Kategorie 'Typische Nischen-Arten' wirkt zudem uneinheitlich: Kletterspecht und Bartgeier sind Arten/Artgruppen, Blattschneider-Ameise ist eher eine ökologische Gilde/Trivialgruppe.
  - items: Schmale Biene, Kletterspecht, Blattschneider-Ameise
  - groups: Typische Nischen-Arten
  - fix: Durch etablierte, klar benannte Arten oder Gilden ersetzen und den Gruppentitel präzisieren.

- **de-0492** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - 'Fehlende Schwerkraft' ist für den Mars falsch formuliert: Mars hat geringere Schwerkraft, nicht fehlende. Gerard O'Neill ist vor allem für Weltraumkolonien/O'Neill-Zylinder bekannt, nicht spezifisch für Mars-Kolonisierung.
  - items: Fehlende Schwerkraft, Gerard O'Neill
  - groups: Mars-Probleme | Mars-Personen
  - fix: 'Geringe Schwerkraft' verwenden und O'Neill durch eine klar marsbezogene Person ersetzen.

- **de-0494** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - 'WOW-Signal' und 'Arecibo-Botschaft' sind keine SETI-Projekte, sondern ein Signalereignis bzw. eine gesendete Botschaft. Außerdem überschneiden sich SETI-Suche und SETI-Projekte stark, weil 'Allen Telescope Array' auch ein konkretes SETI-Instrument/Projektbezug ist.
  - items: WOW-Signal, Arecibo-Botschaft, Allen Telescope Array
  - groups: SETI-Suche | SETI-Projekte
  - fix: SETI-Projekte durch echte Projekte/Programme ersetzen und Ereignisse/Botschaften in eine eigene Kategorie verschieben oder entfernen.

- **de-0500** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Superintelligenz, AGI, Singularität und KI-Ethik überschneiden sich stark. 'Kontrollproblem', 'Alignment', 'AI Safety' und 'Werteproblem' beschreiben eng verwandte Sicherheits-/Ausrichtungsfragen und könnten in mehreren Kategorien stehen; 'Bostrom' passt auch zu Superintelligenz und AI Safety.
  - items: Kontrollproblem, Alignment, AI Safety, Werteproblem, Bostrom
  - groups: Superintelligenz | AGI-Konzepte | Singularitäts-Ideen | KI-Ethik-Konzepte
  - fix: Kategorien stärker trennen, z. B. Personen, technische Begriffe, Zukunftsszenarien und Ethikprinzipien ohne überlappende Safety-Begriffe.

- **de-9020** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - „1918 erste Wahl“ ist für das deutsche Frauenwahlrecht sachlich falsch formuliert. Das Wahlrecht wurde im November 1918 eingeführt, aber die erste reichsweite Wahl, an der Frauen teilnehmen konnten, war die Wahl zur Nationalversammlung am 19. Januar 1919.
  - items: 1918 erste Wahl
  - groups: Frauenwahlrecht
  - fix: Zum Beispiel „1918 Wahlrecht erkämpft“ oder „1919 erste Wahl“ verwenden.

- **de-9023** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Die Kategorien sind abstrakte Stimmungsmetaphern, und mehrere Naturbilder lassen sich plausibel mehreren Gruppen zuordnen. „Fluss versickert“, „Quelle trocken“ und „Same ohne Regen“ können alle Erschöpfung, Stagnation oder Dürre/Bedrohung signalisieren; „Baum nach Sturm nackt“ kann ebenso Nachwirkung einer Bedrohung wie Erschöpfung sein.
  - items: Fluss versickert, Baum nach Sturm nackt, Quelle trocken, Same ohne Regen
  - groups: Erschöpfung | Bedrohung | Stagnation
  - fix: Die Gruppen stärker durch klarere, weniger austauschbare Naturzeichen trennen oder konkretere Labels wählen, etwa Dürre, Neubeginn, Unwettergefahr, Stillstand.

- **de-9049** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - „Eigentor zugeben“ passt semantisch sehr stark zu Fairness, weil es um Ehrlichkeit und das Zugeben eines eigenen Fehlers geht. In „Teamgeist“ ist es deutlich weniger eindeutig als die anderen Items.
  - items: Eigentor zugeben
  - groups: Fairness | Teamgeist
  - fix: Für Teamgeist ein klar kooperatives Item verwenden, etwa „Pass statt Alleingang“, „Mitspieler trösten“ oder „Gemeinsam verteidigen“.

### EN (152)

- **puzzle-0034** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Crescent and gibbous describe moon shape, while waxing and waning describe whether illumination is increasing or decreasing. They combine with each other rather than forming four parallel moon phases, so the category is not a clean set.
  - items: Crescent, Gibbous, Waning, Waxing
  - groups: Moon Phases
  - fix: Use four full phase names such as New Moon, First Quarter, Full Moon, and Last Quarter, or use Waxing Crescent, Waxing Gibbous, Waning Crescent, and Waning Gibbous.

- **puzzle-0043** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Contrail is not one of the standard high cloud genera alongside cirrus, cirrocumulus, and cirrostratus. Fog and mist are also not low cloud genera in the same way as stratus and stratocumulus.
  - items: Contrail, Fog, Mist
  - groups: High Clouds | Low Clouds
  - fix: Replace Contrail with a standard high-cloud term if available, and rename "Low Clouds" to include ground-level phenomena or use standard low-cloud types only.

- **puzzle-0043** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The cloud categories are nested/overlapping: fog is essentially cloud at ground level, mist is closely related to fog, and "Overcast" in Sky Colors describes cloud cover rather than a color. The puzzle mixes cloud types, weather signs, and sky conditions in a way that is not clean for easy tier.
  - items: Fog, Mist, Overcast
  - groups: Low Clouds | Sky Colors
  - fix: Replace this puzzle or simplify it into concrete everyday groups such as Cloud Types, Storm Features, Weather Words, and Sky Colors with non-overlapping items.

- **puzzle-0045** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - This is not easy-tier content. Gothic and Baroque architectural features, plus terms like bailey, stucco, rotunda, and glass curtain, require specialized architectural knowledge.
  - items: Buttress, Rose Window, Stucco, Rotunda, Bailey, Glass Curtain
  - groups: Gothic Features | Baroque Features | Modernist Materials | Castle Parts
  - fix: Move to a harder tier or replace with more everyday building categories.

- **puzzle-0046** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Uranus and Neptune are ice giants, not gas giants under the common modern classification. The group label is factually shaky for an astronomy puzzle.
  - items: Uranus, Neptune
  - groups: Gas Giants
  - fix: Rename the group to "Outer Planets" or use only Jupiter and Saturn in a different four-item category.

- **puzzle-0050** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Fork is a chess tactic, not a special move. It also has an everyday meaning that does not fit the chess move category, making the group unfair.
  - items: Fork
  - groups: Special Moves
  - fix: Replace Fork with Check, Capture, or Kingside Castling; or rename the group to "Chess Tactics and Moves" and adjust the other items.

- **puzzle-0052** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Shepherd and Sheepdog are generic dog-type terms rather than clear breeds, and they overlap strongly with the herding category. Some Corgis are herding dogs but also widely treated as a small companion breed, making the group less clean.
  - items: Shepherd, Sheepdog, Corgi
  - groups: Herding Dogs | Toy Dogs
  - fix: Use specific breed names such as Border Collie, Australian Shepherd, Shetland Sheepdog, and Australian Cattle Dog.

- **puzzle-0052** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Sphynx is not a short-haired cat; it is commonly known as a hairless breed. It does not belong cleanly under "Short-haired Cats".
  - items: Sphynx
  - groups: Short-haired Cats
  - fix: Replace Sphynx with Abyssinian, British Shorthair, Russian Blue, or American Shorthair.

- **puzzle-0071** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Compass appears both as a map feature phrase (Compass Rose) and as a hiking gear item, and Scale is also a map feature tied to measuring. The map/hiking categories are close enough that Compass especially creates a near-duplicate cue.
  - items: Compass Rose, Compass, Trail Map
  - groups: Map Features | Hiking Gear
  - fix: Replace Compass in Hiking Gear with Boots, Trekking Poles, or Backpack; consider replacing Trail Map as well to keep the categories distinct.

- **puzzle-0078** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Ice Events, Skating, and Snowboarding are all winter sport/event categories, and several labels are nested or uneven. Hockey is an ice sport, while Figure, Speed, Short Track, and Pairs are skating disciplines; Bobsleigh and Luge are ice-track sports rather than "ice events" in a parallel sense.
  - items: Hockey, Figure, Speed, Short Track, Pairs, Bobsleigh, Luge
  - groups: Ice Events | Skating
  - fix: Use precise labels such as "Ice Hockey/Curling", "Sliding Sports", "Skating Disciplines", and "Snowboarding Events", with items that do not overlap.

- **puzzle-0079** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Relay is not inherently a sprint; relays can be different distances. It also belongs broadly to track events like the other running categories, so the sprint category is not clean.
  - items: Relay
  - groups: Sprints | Distance Events
  - fix: Replace Relay with 60m or 4x100m Relay if the label is adjusted to "Sprint Events".

- **puzzle-0083** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Latin Dances and Ballroom Dances overlap because many Latin dances are part of ballroom dance classifications. The labels are nested rather than clean sibling categories.
  - items: Rumba, Samba, Cha-Cha, Paso Doble
  - groups: Latin Dances | Ballroom Dances
  - fix: Use "Latin Ballroom Dances" and "Standard Ballroom Dances" as clearer sibling labels, or replace one category.

- **puzzle-0086** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Salad greens, leafy herbs, sprouts, and cabbage family overlap conceptually as edible leafy plants. Kale, bok choy, savoy, and napa are also leafy greens; broccoli sprout belongs to the same plant family as cabbage. The labels are too nested for a fair easy puzzle.
  - items: Broccoli Sprout, Bok Choy, Kale, Savoy, Napa
  - groups: Salad Greens | Sprouts | Cabbage Family
  - fix: Replace one or more plant groups with unrelated everyday categories, or make the labels very specific and non-overlapping.

- **puzzle-0087** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - “Calendar Stone” most commonly refers to the Aztec Sun Stone, not a Mayan artifact, so its placement under Mayan Civilization is misleading.
  - items: Calendar Stone
  - groups: Mayan Civilization
  - fix: Replace with an unambiguous Mayan item such as Long Count, Codex, Temple, or Chichen Itza.

- **puzzle-0103** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The footwear categories are not mutually exclusive. Athletic, formal, casual, and boots describe overlapping use/style domains rather than clean single concepts.
  - groups: Athletic Shoes | Formal Footwear | Casual Footwear | Boots
  - fix: Use narrower non-overlapping categories, such as shoe parts, boot types, sandal types, and formal shoe types, or replace ambiguous items.

- **puzzle-0103** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Several items can reasonably belong to more than one listed footwear group: sneakers and high-tops can be casual or athletic, loafers and moccasins can be casual or formal, and hiking boots can be athletic/outdoor as well as boots.
  - items: Sneaker, High-Top, Loafer, Moccasin, Hiking Boot
  - groups: Athletic Shoes | Formal Footwear | Casual Footwear | Boots
  - fix: Replace with items that clearly map to one label only, or restructure the categories by form rather than occasion.

- **puzzle-0106** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Mahjong is not a standard card game; it is a tile game. Its placement in a card-game puzzle is factually wrong.
  - items: Mahjong
  - groups: Matching Games
  - fix: Replace Mahjong with a card matching game such as Old Maid, Go Fish, or Concentration.

- **puzzle-0110** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Tree categories overlap: fruit trees can be deciduous, tropical trees can be evergreen or fruit-bearing, and the labels mix leaf habit, climate, and use.
  - groups: Deciduous Trees | Evergreen Trees | Tropical Trees | Fruit Trees
  - fix: Use one classification principle across all groups, such as leaf habit, fruit type, region, or tree family.

- **puzzle-0110** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Apple, cherry, pear, and plum are deciduous trees as well as fruit trees; mango and palm can also be fruit/tropical items depending on interpretation.
  - items: Apple, Cherry, Pear, Plum, Mango, Palm
  - groups: Deciduous Trees | Tropical Trees | Fruit Trees
  - fix: Replace the overlapping fruit/tropical groups or move to non-overlapping categories.

- **puzzle-0131** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Mountain Sports overlaps strongly with Snow Sports. Alpine skiing, moguls, slalom, and downhill are snow skiing events, so the categories are not semantically separate.
  - items: Alpine Skiing, Moguls, Slalom, Downhill
  - groups: Snow Sports | Mountain Sports
  - fix: Replace Mountain Sports with a non-overlapping group such as Indoor Winter Sports, Winter Gear, or Ski Equipment.

- **puzzle-0132** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Soft Cheeses and Fresh Cheeses overlap: ricotta and mozzarella are fresh cheeses, while feta, cottage cheese, queso fresco, and paneer can also be classified as soft/fresh cheeses.
  - items: Ricotta, Mozzarella, Feta, Cottage, Queso Fresco, Paneer
  - groups: Soft Cheeses | Fresh Cheeses
  - fix: Use non-overlapping cheese categories such as Blue, Hard, Washed-Rind, and Pasta Filata, or replace the fresh/soft split.

- **puzzle-0133** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Historical Currencies overlaps with regional currency groups because drachma, guilder, lira, and mark are historical European currencies. The grouping mixes region and time period.
  - items: Drachma, Guilder, Lira, Mark
  - groups: European Currencies | Historical Currencies
  - fix: Use either regional categories only or time-period categories only.

- **puzzle-0135** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Fedora and Trilby can be casual or fashion hats, not specifically formal. Panama appears in a Sun Hats category here but is also a formal/fashion hat in common use. Bucket Hat can be casual or sunwear.
  - items: Fedora, Trilby, Panama, Bucket Hat
  - groups: Formal Hats | Sun Hats
  - fix: Replace with hats whose function is unambiguous, or define categories by construction rather than occasion.

- **puzzle-0138** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Soup categories overlap heavily. Ramen and pho are noodle soups but not simply broth-based in contrast to other soups; borscht can be hot or cold; chowder and bisque are also thick soups; bouillabaisse is usually a soup rather than a thick stew.
  - items: Ramen, Pho, Borscht, Chowder, Bisque, Bouillabaisse
  - groups: Broth-Based Soups | Cream Soups | Cold Soups | Thick Stews
  - fix: Use clearer non-overlapping categories, such as noodle soups, cold soups, cream soups, and stews, with items that uniquely match.

- **puzzle-0140** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Poetry Forms and Literary Genres overlap: epic, elegy, and ode are also poetic forms/genres, while ballad can be a literary genre/form. The labels are not cleanly separated.
  - items: Epic, Elegy, Ode, Ballad
  - groups: Poetry Forms | Literary Genres
  - fix: Replace Literary Genres with non-poetry genres such as Novel, Short Story, Drama, and Essay, or make all groups poetry-specific but distinct.

- **puzzle-0183** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Caravanserai is an inn/roadside lodging for travelers, not an Islamic religious building comparable to mosque, minaret, and madrasa.
  - items: Caravanserai
  - groups: Islamic Buildings
  - fix: Replace with Mausoleum, Mihrab, Minbar, or Khanqah.

- **puzzle-0187** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Corn snakes are constrictors in feeding behavior, but the common category “Constrictor Snakes” usually means boas, pythons, and anacondas; corn snake is more commonly classified as a colubrid and may feel out of place.
  - items: Corn Snake
  - groups: Constrictor Snakes
  - fix: Replace Corn Snake with Reticulated Python, King Snake, or Rosy Boa depending on intended precision.

- **puzzle-0189** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Hair-style categories overlap by length and construction. Ponytails, buns, waves, and extensions can be long styles; bobs can be short or medium; braids can be long hairstyles too.
  - items: Ponytail, Low Bun, Beach Waves, Extensions, Bob, French Braid, Cornrows, Dutch Braid, Fishtail
  - groups: Long Hair Styles | Short Hair Styles | Braided Styles
  - fix: Use non-overlapping groups such as Cuts, Braids, Updos, and Salon Tools.

- **puzzle-0235** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Bonsai is strongly associated with Japan but is not uniquely Japanese; Spring Roll and Fried Rice are common across multiple East/Southeast Asian cuisines and are not exclusively Chinese. The symbol/food nationality categories rely on cultural associations that blur easily.
  - items: Bonsai, Spring Roll, Fried Rice
  - groups: Chinese Symbols | Japanese Symbols | Chinese Food | Japanese Food
  - fix: Use more unambiguous national/cultural items, e.g. Great Wall, Terracotta Warrior, Sushi, Sashimi.

- **puzzle-0236** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Castle and Forest are generic settings, not specifically Arthurian legendary places. They do not uniquely point to Arthurian legend.
  - items: Castle, Forest
  - groups: Legendary Places
  - fix: Replace with Tintagel, Logres, Lyonesse, or other specific Arthurian places.

- **puzzle-0241** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - Greeting Card and Birthday Card are not distinct enough; a birthday card is a type of greeting card. This creates a nested duplicate in the same group.
  - items: Greeting Card, Birthday Card
  - groups: Mailed Items
  - fix: Replace one with Postcard, Parcel, Catalogue, or Invitation.

- **puzzle-0257** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Beowulf is an Old English legendary hero, and Leif Erikson is a historical Norse explorer, not a Viking hero in the same mythic category as Sigurd/Ragnar. Bifrost is also a place/bridge rather than an item, so the group label is inaccurate.
  - items: Beowulf, Leif Erikson, Bifrost
  - groups: Viking Heroes | Legendary Items
  - fix: Replace Beowulf/Leif Erikson with clearer Norse legendary figures, and move or replace Bifrost with an actual object such as Draupnir.

- **puzzle-0258** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Cleopatra and Nefertiti are shaky for 'Famous Pharaohs' at easy level: Cleopatra was a Ptolemaic queen/pharaoh, while Nefertiti is primarily known as a queen and her status as pharaoh is disputed.
  - items: Cleopatra, Nefertiti
  - groups: Famous Pharaohs
  - fix: Use Khufu, Hatshepsut, Akhenaten, or Thutmose instead.

- **puzzle-0266** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Invoice and Receipt are commercial documents, not tax documents. Payslip may support taxes but is not itself a tax document. The category label is inaccurate for three of four items.
  - items: Invoice, Receipt, Payslip
  - groups: Tax Documents
  - fix: Rename to Financial Documents, or use W-2, 1099, Tax Return, and Deduction Form for a U.S.-leaning tax group.

- **puzzle-0281** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Country-winner categories across different sports are not mutually exclusive by concept: the same nation can be true for multiple listed winner categories, so the labels invite overlap even if this exact item set avoids some duplicates.
  - items: Italy, Germany, USA, Canada, Sweden
  - groups: FIFA World Cup Winners | Cricket World Cup Winners | Ice Hockey World Champions | FIFA Women's World Cup Winners
  - fix: Avoid country-winner categories that can overlap across sports, or use event-specific clues with no cross-category membership.

- **puzzle-0306** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Steam Locomotive and Steamship are steam-power inventions as well as transport innovations, overlapping directly with Steam Power Inventions. Canal Boat and Hot Air Balloon are also weak as industrial transport breakthroughs.
  - items: Steam Locomotive, Steamship, Canal Boat, Hot Air Balloon
  - groups: Steam Power Inventions | Transport Innovations
  - fix: Avoid steam transport in a separate transport group, or relabel the first group to Stationary Steam Machines.

- **puzzle-0309** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Grace Hopper did not create COBOL alone in the same straightforward way Ritchie, van Rossum, and Stroustrup created C, Python, and C++; she contributed foundational compiler and language work and influenced COBOL. The category overstates the fact.
  - items: Grace Hopper
  - groups: Created a Widely-Used Programming Language
  - fix: Replace with James Gosling, Brendan Eich, or Yukihiro Matsumoto.

- **puzzle-0313** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Focaccia is both a flatbread and a leavened bread, so it reasonably fits two listed groups. More broadly, 'Flatbreads' and 'Leavened Loaves' are not mutually exclusive bread categories.
  - items: Focaccia
  - groups: Flatbreads | Leavened Loaves
  - fix: Replace Focaccia with an unleavened or clearly flat-only bread, or relabel the groups to separate by region/style rather than leavening.

- **puzzle-0314** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - The puzzle relies on hobby-board-game taxonomy and specific modern game titles. For an easy puzzle, these are not concrete everyday categories for most players.
  - groups: Worker Placement Games | Deck-Building Games | Area Control Games | Cooperative Games
  - fix: Move to a harder tier or replace with more everyday board-game categories.

- **puzzle-0314** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The category labels are not mutually exclusive: 'Cooperative Games' describes player alignment, while worker placement, deck-building, and area control describe mechanisms. A game can be cooperative and also use one of the other mechanisms.
  - items: Spirit Island, Gloomhaven
  - groups: Area Control Games | Cooperative Games | Deck-Building Games
  - fix: Use one consistent axis, such as only mechanisms or only player/team formats.

- **puzzle-0331** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Several animal collective nouns overlap. Orcas are whales, so 'Orca' could fit the same pod group as 'Whale'. Penguins are birds and can be said to flock, so they can conflict with the bird flock category.
  - items: Orca, Whale, Penguin
  - groups: Animals That Live in a Colony | Animals That Move in a Pod | Birds That Fly in a Murmuration or Flock
  - fix: Avoid species/subspecies overlap and do not mix a bird colony group with a bird flock group in the same puzzle.

- **puzzle-0332** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Pontoon bridges are floating bridges, not cable-supported bridges. Rope bridges may be suspended, but 'Cable-Supported Bridges' normally refers to cable-stayed and suspension-family structures, making this grouping imprecise.
  - items: Pontoon Bridge, Rope Bridge
  - groups: Cable-Supported Bridges
  - fix: Move Pontoon Bridge to a floating-bridge group or replace it with Suspension Bridge.

- **puzzle-0332** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Tied Arch Bridge and Bowstring Arch Bridge are near-overlapping terms, and bowstring bridges are also a truss/arch hybrid. This makes the arch and beam/truss split less clean than an easy puzzle needs.
  - items: Tied Arch Bridge, Bowstring Arch Bridge
  - groups: Arch Bridges | Beam and Truss Bridges
  - fix: Use simpler, non-overlapping bridge categories such as arch, suspension, beam, and movable with clearly distinct examples.

- **puzzle-0335** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Most phobia names here are specialized Greek-derived terms. For easy, this is vocabulary-heavy and not concrete everyday knowledge.
  - items: Ophidiophobia, Gephyrophobia, Astraphobia, Scopophobia, Erythrophobia
  - fix: Move to a harder tier or use common fear descriptions rather than technical phobia names.

- **puzzle-0337** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Architectural movement membership by architect is specialized art-history knowledge, especially for Fischer von Erlach, Horta, Guimard, Libeskind, and Eisenman. This is not easy-tier material.
  - items: Fischer von Erlach, Horta, Guimard, Libeskind, Eisenman
  - fix: Move to a harder tier or use famous buildings/architects with more common recognition.

- **puzzle-0340** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Olympic debut years for specific events are highly specialized trivia, not easy-tier knowledge.
  - items: Lightweight Rowing, Women's Team Sprint, Women's Steeplechase, Open Water Swimming
  - fix: Move to a harder tier or group Olympic sports by equipment, venue, or season.

- **puzzle-0341** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Heraldic tinctures, furs, ordinaries, and attitudes are specialist vocabulary and not easy-tier everyday categories.
  - items: Gules, Azure, Vair, Pean, Fess, Sejant
  - fix: Move to a harder tier.

- **puzzle-0356** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Behavioural economics biases are also cognitive biases. The labels create nested/overlapping domains, so items such as loss aversion and status quo bias could reasonably be treated as cognitive biases.
  - items: Sunk Cost, Loss Aversion, Status Quo Bias, Endowment Effect
  - groups: Cognitive Biases | Behavioural Economics Biases
  - fix: Use non-overlapping labels, for example 'General Cognitive Biases' and 'Decision-Making Biases in Economics' only if the item sets are clearly distinguished.

- **puzzle-0356** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Sunk cost, loss aversion, status quo bias, and endowment effect are all commonly listed as cognitive biases as well as behavioral economics concepts.
  - items: Sunk Cost, Loss Aversion, Status Quo Bias, Endowment Effect
  - groups: Cognitive Biases | Behavioural Economics Biases
  - fix: Replace the behavioral economics group with a category from a different domain.

- **puzzle-0360** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Scaphoid is a carpal bone of the wrist/hand, so it fits both 'Arm Bones' and 'Hand Bones' as labeled. Sesamoid bones also occur in the foot and elsewhere, so 'Hand Bones' is not exclusive.
  - items: Scaphoid, Sesamoid
  - groups: Arm Bones | Hand Bones | Foot Bones
  - fix: Replace Scaphoid with a clear arm bone, and replace Sesamoid with a specific hand bone type if needed.

- **puzzle-0362** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Internet slang meanings are highly context-dependent. 'Ate', 'Slay', 'Hits Different', 'Legend', and 'Understood the Assignment' can all function as compliments/reactions; 'No Cap' can signal agreement or truthfulness rather than agreement specifically.
  - items: Ate, Slay, Hits Different, Legend, Understood The Assignment, No Cap
  - groups: Expressions of Agreement | Compliments Online | Viral Reaction Words
  - fix: Use less overlapping slang functions or replace with clearer phrases.

- **puzzle-0365** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Cao Dai is a syncretic Vietnamese religion with Abrahamic, Buddhist, Taoist, and Confucian influences, not cleanly an East Asian religion in the same sense as Taoism, Confucianism, and Shinto. Indigenous traditions are practices/categories rather than specific religions, so category types also differ.
  - items: Cao Dai, Animism, Shamanism, Totemism, Ancestor Worship
  - groups: East Asian Religions | Indigenous Traditions
  - fix: Use specific religions/traditions on all four rows, or label the last group as 'Indigenous Religious Concepts' and avoid mixing it with named religions.

- **puzzle-0384** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Charon is not usually a Roman god; he is the ferryman of the underworld from Greek mythology, adopted into Roman myth but not a god like Neptune or Pluto. Mercury is also not primarily a sky/state god; he is a messenger/trade/travel god.
  - items: Charon, Mercury
  - groups: SEA AND UNDERWORLD GODS | SKY AND STATE GODS
  - fix: Replace Charon with a clearer underworld deity and move Mercury to a commerce/messenger grouping or replace him.

- **puzzle-0385** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Temperate Rainforest appears under temperate forests, while Rainforest and Cloud Forest appear under tropical forests; rainforests/cloud forests can be tropical or temperate depending on location. Subalpine forest can overlap with boreal/montane zones, and riparian/flooded/swamp/gallery forests overlap by moisture regime.
  - items: Rainforest, Cloud Forest, Temperate Rainforest, Subalpine Forest, Gallery Forest, Riparian Forest, Flooded Forest, Swamp Forest
  - groups: TROPICAL FORESTS | TEMPERATE FORESTS | BOREAL FORESTS | SPECIALIST WETLAND FORESTS
  - fix: Use one classification axis, such as climate-zone forest types only, and avoid moisture/landform categories in the same puzzle.

- **puzzle-0386** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Hybrid genres overlap with the other genre groups: dark comedy is a comedy, docudrama is a drama/nonfiction hybrid, noir can overlap with crime/drama, and psychological thriller can be action/drama depending on framing. The label is not parallel with the other subgenre labels.
  - items: Dark Comedy, Docudrama, Noir, Psychological Thriller
  - groups: ACTION SUBGENRES | DRAMA SUBGENRES | COMEDY SUBGENRES | HYBRID GENRES
  - fix: Use four parallel parent genres or four non-overlapping format categories.

- **puzzle-0387** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Depth of Field is a camera/lens setting or optical result, not primarily a composition principle. Bracketing is a shooting technique/camera setting workflow, not a processing term. Vignette can be a lens effect or composition/framing effect as well as a processing term.
  - items: Depth of Field, Bracketing, Vignette
  - groups: CAMERA SETTINGS | COMPOSITION PRINCIPLES | PROCESSING TERMS
  - fix: Move Depth of Field to settings/optics, Bracketing to shooting techniques, and use clearer composition/processing terms.

- **puzzle-0389** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The categories overlap heavily. Ranked choice and single transferable vote are electoral systems/voting methods; runoff election appears both as a counting/tally method and as a special election type; primary and by-election are also election types. Players could reasonably place several items in multiple groups.
  - items: Single Transferable Vote, Ranked Choice, Majority Runoff, Runoff Election, Primary, By-Election
  - groups: ELECTORAL SYSTEMS | VOTE-COUNTING METHODS | ELECTION TIMING TYPES | SPECIAL ELECTION TYPES
  - fix: Use a single axis such as electoral systems only, election timing only, or institutions only.

- **puzzle-0390** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Speculative fiction items such as dystopia, cyberpunk, and alternate history are narrative fiction modes/subgenres, so they overlap with 'Narrative Fiction Modes'. Satire and pastoral can also be prose/fiction modes as well as poetic/dramatic forms.
  - items: Dystopia, Cyberpunk, Alternate History, Satire, Pastoral
  - groups: NARRATIVE FICTION MODES | SPECULATIVE FICTION | POETIC AND DRAMATIC FORMS
  - fix: Use non-overlapping genre families or separate by medium/form more consistently.

- **puzzle-0409** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Schwarzbier is a dark lager, not a dark ale. Gose is usually a sour wheat beer but not normally grouped with Hefeweizen/Witbier/Berliner Weisse as a straightforward wheat-beer style for easy categorization.
  - items: Schwarzbier, Gose
  - groups: DARK ALES | WHEAT BEERS
  - fix: Move Schwarzbier to lager styles or replace it with a true dark ale such as Brown Ale; consider replacing Gose with a more obvious wheat beer.

- **puzzle-0412** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The W in 'Sword' is silent, but the listed silent letter is not initial like the other Silent W examples. This is still technically a silent W, but it breaks the obvious pattern and may feel like a trap in an easy puzzle.
  - items: Sword
  - groups: SILENT W
  - fix: Replace Sword with Wreck, Write, Wren, or Wrinkle.

- **puzzle-0414** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Best Picture is not a directing or writing Oscar; it is awarded to producers and is the overall picture category.
  - items: Best Picture
  - groups: DIRECTING & WRITING OSCARS
  - fix: Replace Best Picture with a true directing/writing category or relabel the group to include Best Picture explicitly.

- **puzzle-0433** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Egyptian deities often have overlapping domains, and several listed items can reasonably fit more than one category. Isis is strongly associated with magic as well as protection; Hathor has sky/solar associations; Neith can be associated with sky/creation/war/protection. This makes the grouping unfair.
  - items: Isis, Hathor, Neith
  - groups: SUN / SKY GODS | KNOWLEDGE / MAGIC | PROTECTIVE GODDESSES
  - fix: Use deities with single, widely recognized domains, or change the theme to more concrete labels such as symbols, animals, or famous myths.

- **puzzle-0434** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Individual Medley is not a relay event; it is an individual swimming event.
  - items: Individual Medley
  - groups: POOL EVENTS (RELAY)
  - fix: Replace Individual Medley with a true relay event such as 4x100 Freestyle Relay or 4x100 Medley Relay.

- **puzzle-0435** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several Monopoly properties are assigned to the wrong color groups. Oriental Ave and Vermont Ave are light blue, not purple/brown; Pacific Ave and North Carolina Ave are green, not dark blue.
  - items: Oriental Ave, Vermont Ave, Pacific Ave, North Carolina Ave
  - groups: PURPLE PROPERTIES | DARK BLUE PROPERTIES
  - fix: Use Mediterranean Ave, Baltic Ave, and two correctly named properties only if the intended group is not the standard U.S. Monopoly color set; otherwise make PURPLE/BROWN a 2-item concept impossible for this format and choose another group.

- **puzzle-0436** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - The ingredient/type categories overlap with sushi form categories. Shrimp Nigiri and Eel Nigiri are effectively ebi/unagi nigiri, while Ebi and Unagi are cooked sushi toppings that can appear as nigiri. Cooked sushi is not mutually exclusive with nigiri, maki, or temaki.
  - items: Shrimp Nigiri, Eel Nigiri, Ebi, Unagi
  - groups: NIGIRI | COOKED SUSHI
  - fix: Keep all categories at the same level, e.g. sushi forms only, or toppings only; do not mix form and ingredient/cooked-status labels.

- **puzzle-0440** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - All four groups are about blended words or portmanteaus, but two labels use the same concept at different levels: 'Food Portmanteaus', 'Tech Portmanteaus', and 'Modern Culture Blends' are semantic-domain labels, while 'Animal Blends' is ambiguous between hybrid animals and blended words. The category basis shifts from word formation to biological hybrids.
  - items: Liger, Mule, Zorse, Wholphin
  - groups: ANIMAL BLENDS | FOOD PORTMANTEAUS | TECH PORTMANTEAUS | MODERN CULTURE BLENDS
  - fix: Rename ANIMAL BLENDS to 'HYBRID ANIMALS' and avoid presenting it as parallel to portmanteau word groups, or make all groups word-blend categories.

- **puzzle-0440** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Mule is a hybrid animal but not a portmanteau or lexical blend. It breaks the apparent word-blend theme.
  - items: Mule
  - groups: ANIMAL BLENDS
  - fix: Replace Mule with a true animal-name blend such as Coywolf or Beefalo, if the intended category is blended animal names.

- **puzzle-0442** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Metroidvania is typically an action-adventure/platforming genre, so it overlaps with ACTION / COMBAT rather than being cleanly only narrative/adventure. Walking Simulator is also a loose, contested genre label.
  - items: Metroidvania, Walking Simulator
  - groups: ACTION / COMBAT | NARRATIVE / ADVENTURE
  - fix: Use clearer adventure labels such as Graphic Adventure, Text Adventure, Hidden Object, and Interactive Fiction.

- **puzzle-0443** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - The mushroom categories are not mutually exclusive. Oyster and Shiitake are prized edibles as well as supermarket mushrooms; Lion's Mane is edible and commonly sold; False Morel can be eaten in some traditions but is also toxic/misleading. Truffle is not a mushroom in the ordinary cap-and-stem sense, though it is a fungus.
  - items: Oyster, Shiitake, Lion's Mane, False Morel, Truffle
  - groups: PRIZED EDIBLES | SUPERMARKET MUSHROOMS | TOXIC MUSHROOMS | MEDICINAL MUSHROOMS
  - fix: Use non-overlapping labels such as 'common grocery names', 'deadly/toxic names', 'medicinal supplement names', and 'luxury culinary fungi', with carefully chosen items.

- **puzzle-0457** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - The bread-process categories mix phases, actions, and outcomes. Fold commonly happens during bulk proofing but is also a dough-handling/mixing action; Pre-Shape and Final Shape are shaping steps, not proofing; Bloom and Crust are results of baking, not baking actions; Rest can occur before proofing, after shaping, or after baking.
  - items: Fold, Pre-Shape, Final Shape, Bloom, Crust, Rest
  - groups: MIXING | PROOFING | BAKING | COOLING
  - fix: Use a chronological process with unambiguous stages, or rename groups to actions/results and choose items consistently.

- **puzzle-0458** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Fermentation categories overlap by biochemical process. Kombucha and Tepache include alcoholic and acetic/lactic fermentation components; Soy Sauce, Miso, and Doenjang involve molds plus other microbial fermentation; Shrub is usually vinegar-based syrup rather than necessarily a fermented food itself.
  - items: Kombucha, Tepache, Soy Sauce, Miso, Doenjang, Shrub
  - groups: ALCOHOLIC | ACETIC ACID | MOULD-FERMENTED
  - fix: Use product-type categories rather than fermentation chemistry, or choose examples with one dominant, commonly taught fermentation type.

- **puzzle-0460** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - The OSI-layer mapping is not clean. Bandwidth and Latency are cross-layer performance measures, not specifically physical-layer items; TLS is usually above transport/session/presentation rather than application in strict OSI terms; Gateway can be used generically across layers; Switches can operate beyond layer 2 in common usage.
  - items: Bandwidth, Latency, TLS, Gateway, Switch
  - groups: PHYSICAL LAYER | DATA LINK LAYER | NETWORK LAYER | APPLICATION LAYER
  - fix: Use canonical OSI examples only, or avoid strict layer labels for easy-tier networking.

- **puzzle-0461** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - The surgical terminology is far beyond easy-tier everyday knowledge. Laparotomy, thoracotomy, sternotomy, hysteroscopy, palatoplasty, and transplant organ shorthand are specialized medical terms.
  - items: Laparotomy, Thoracotomy, Sternotomy, Hysteroscopy, Palatoplasty
  - fix: Move to a much harder tier or use broad everyday medical categories.

- **puzzle-0462** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - IONISING RADIATION and NUCLEAR MEDICINE overlap conceptually. PET Scan uses ionising radiation and is also a nuclear medicine modality; SPECT, Scintigraphy, Bone Scan, and Thyroid Scan also involve ionising radiation.
  - items: PET Scan, SPECT, Scintigraphy, Bone Scan, Thyroid Scan
  - groups: IONISING RADIATION | NUCLEAR MEDICINE
  - fix: Separate by imaging modality labels such as X-ray-based, MRI-based, ultrasound-based, and nuclear medicine, and move PET Scan to nuclear medicine.

- **puzzle-0462** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - HIFU is a therapeutic ultrasound technique, not primarily an imaging method like the others in this puzzle.
  - items: HIFU
  - groups: SOUND-BASED
  - fix: Replace HIFU with Sonogram or Elastography.

- **puzzle-0464** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Chinese Room is usually a philosophy of mind / AI thought experiment, not metaphysics. Utility Monster is normally associated with ethics/utilitarianism, not political philosophy. Desert Island is too vague to identify a specific political-philosophy thought experiment.
  - items: Chinese Room, Utility Monster, Desert Island
  - groups: METAPHYSICS | POLITICAL PHILOSOPHY
  - fix: Move Chinese Room to a mind/AI category, Utility Monster to ethics/utilitarianism, and replace Desert Island with a recognized political philosophy item.

- **puzzle-0465** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Artemis I was uncrewed, so it does not belong in CREWED EXPLORATION. Curiosity and Perseverance are rovers rather than landers. Cassini was primarily an orbiter/probe, not a flyby mission in the same sense as Voyager/New Horizons/Pioneer.
  - items: Artemis I, Curiosity, Perseverance, Cassini
  - groups: CREWED EXPLORATION | ROBOTIC LANDERS | FLYBY / PROBE
  - fix: Replace Artemis I with a crewed mission, rename ROBOTIC LANDERS to 'Mars/Titan Surface Missions' or use true landers, and rename Cassini's group to probes/orbiters.

- **puzzle-0467** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several Yiddish-derived words are assigned to categories they do not fit. Nosh means to snack/eat, not talk/socialize; Schmaltz means rendered fat or excessive sentimentality, not wisdom/praise; Schlep means to drag/carry or a tedious journey, not wisdom/praise; Schpiel means a speech/pitch, not praise.
  - items: Nosh, Schmaltz, Schpiel, Schlep
  - groups: TALK / SOCIALISE | WISDOM / PRAISE
  - fix: Move Nosh to food/eating and replace the WISDOM / PRAISE group with accurately matched terms such as Maven, Mazel tov, Naches, and Kvell if appropriate.

- **puzzle-0468** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Taklamakan is an Asian desert, not a polar/cold desert in the same geographic grouping. Great Basin is American, not polar, though it is a cold desert. The POLAR / COLD label mixes climate and location while the other labels are continents.
  - items: Taklamakan, Great Basin
  - groups: ASIAN | AMERICAN | POLAR / COLD
  - fix: Keep all groups geographic, moving Taklamakan to Asia and Great Basin to America, or make all groups climate/type-based.

- **puzzle-0481** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Marie Curie won the Nobel Prize in Physics and Chemistry, so she belongs in Physics here, but Francis Crick won the Nobel Prize in Physiology or Medicine, not a separate 'Medicine Prize' in the common shorthand sense is acceptable. The larger issue is that Marie Curie also won Chemistry, creating possible cross-Nobel ambiguity if categories are strict prize fields beyond the listed ones.
  - items: Marie Curie
  - groups: NOBEL PHYSICS PRIZE
  - fix: Consider replacing Marie Curie with a Physics-only laureate to avoid cross-prize ambiguity.

- **puzzle-0482** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Pu'u 'O'o is a volcanic cone/vent on Kilauea but is not usually classified as a standalone cinder cone volcano in the same way as Paricutin, Cerro Negro, or Sunset Crater. Lassen Peak is commonly described as a lava dome/plug dome, but Novarupta is a lava dome from an eruption rather than a volcano name parallel to the others.
  - items: Pu'u 'O'o, Novarupta
  - groups: CINDER CONE VOLCANOES | LAVA DOME VOLCANOES
  - fix: Use widely accepted examples for each volcano type.

- **puzzle-0483** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Four Seasons is a set of violin concertos, but the item name is less formally parallel than the others and could be recognized as a general work title rather than a concerto title. Violin Concerto in D is ambiguous because multiple composers have famous violin concertos in D major.
  - items: Four Seasons, Violin Concerto in D
  - groups: CONCERTOS
  - fix: Use composer-qualified titles such as Vivaldi's Four Seasons and Tchaikovsky Violin Concerto, or choose less ambiguous concerto names.

- **puzzle-0484** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Dead Weight is not a standard high-camp logistics term in mountaineering parallel to Bivouac, Base Camp, and Cache.
  - items: Dead Weight
  - groups: HIGH-CAMP LOGISTICS
  - fix: Replace Dead Weight with Load Carry, Depot, Camp I, or another recognized logistics term.

- **puzzle-0486** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Several contronym assignments are strained or ambiguous. Screen can mean show or conceal, not clearly allow/prohibit; Table has opposite meanings in different dialects but not allow/prohibit; Fix does not cleanly mean both separate and join; Trim can mean decorate/add or cut/remove but is context-heavy; Left means remaining or departed, not secured/free.
  - items: Screen, Table, Fix, Trim, Left
  - groups: MEANS ALLOW AND PROHIBIT | MEANS SEPARATE AND JOIN | MEANS ADD AND REMOVE | MEANS SECURED AND FREE
  - fix: Use well-established contronyms with category labels that match their actual opposing senses.

- **puzzle-0486** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Contronyms grouped by subtle paired meanings are not easy-tier. Many require dictionary-level sense knowledge and dialect awareness.
  - items: Sanction, Enjoin, Cleave, Ravel, Bound
  - fix: Move to hard or replace with concrete everyday categories.

- **puzzle-0376** (hard) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - “Euler's Formula” is not uniquely a geometry theorem; it commonly refers to the complex-analysis identity e^(ix)=cos x + i sin x, while the puzzle also has “Euler's Theorem” in another category. The near-identical Euler labels make the intended split unfair without more precise wording such as “Euler's Polyhedron Formula.”
  - items: Euler's Formula, Euler's Theorem
  - groups: Geometry Theorems | Number Theory Theorems
  - fix: Rename “Euler's Formula” to “Euler's Polyhedron Formula” or replace it with a less overloaded geometry theorem.

- **puzzle-0404** (hard) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - “Overture” is spelled OVER + TURE, not OVER + “Ture” as a standalone suffix fragment. The item casing also makes the fragment look like a word rather than the intended completion.
  - items: Ture
  - groups: OVER + ___
  - fix: Use “Ture” only if the game convention allows arbitrary letter fragments; otherwise replace it with a cleaner OVER completion such as “Time,” “Cast,” “Head,” or “Board.”

- **puzzle-0430** (hard) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - “Coral Snake” is not colour + snake in the same way as the other entries; “coral” is a noun/material/color term only indirectly, and the animal name is not normally parsed as a simple colour adjective plus snake. “Red-Bellied Black” is also incomplete as a standalone snake name unless “Snake” is implied.
  - items: Coral Snake, Red-Bellied Black
  - groups: COLOUR + SNAKE
  - fix: Use cleaner colour-adjective snake names such as “Green Anaconda,” “Brown Snake,” “Black Rat Snake,” or write “Red-Bellied Black Snake” in full.

- **puzzle-0454** (hard) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - “Crab Nebula” is both commonly called a nebula and specifically a supernova remnant. Because “SUPERNOVA REMNANTS” is a separate category, this item reasonably belongs to two listed groups.
  - items: Crab Nebula
  - groups: NEBULAE | SUPERNOVA REMNANTS
  - fix: Replace “Crab Nebula” with a nebula that is not also primarily a supernova remnant, or avoid using “Supernova Remnants” as a parallel group.

- **puzzle-0479** (hard) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Multiple items are misplaced or not Nahuatl loans. “Cocoa” is a food/plant product and overlaps with the FOOD category; “Chipotle” is food, not place/ritual; “Cenote” is from Yucatec Maya, not Nahuatl. “Mesquite” is generally from Nahuatl via Mexican Spanish, but the mixed “PLACE / RITUAL” group is not a coherent semantic category.
  - items: Cocoa, Chipotle, Cenote
  - groups: NAHUATL: FOOD | NAHUATL: PLACE / RITUAL
  - fix: Replace the last group with a coherent Nahuatl-derived category, or move “Chipotle”/“Cocoa” into food and replace “Cenote” with a Nahuatl-derived place/ritual term.

- **puzzle-0479** (hard) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - “Chili,” “Cocoa,” and “Chipotle” are all food terms; “Cocoa” also belongs with plant/product terms. This breaks the one-category-only requirement even apart from the etymology issue.
  - items: Chili, Cocoa, Chipotle
  - groups: NAHUATL: FOOD | NAHUATL: PLANTS | NAHUATL: PLACE / RITUAL
  - fix: Keep food, animal, plant, and object/place categories strictly separated by replacing food/product overlaps.

- **puzzle-0480** (hard) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The dice-game categories are not mutually exclusive. “Betting / banking,” “push your luck,” “matching / bluffing,” and “elimination” describe overlapping mechanics, and several games can reasonably fit more than one label.
  - items: Craps, Sic Bo, Chuck-a-Luck, Hazard, Farkle, Yahtzee, Zombie Dice, Pass the Pigs, Perudo, Mexico, Liar's Dice, Pig, Shut the Box
  - groups: BETTING / BANKING | PUSH YOUR LUCK | MATCHING / BLUFFING | ELIMINATION
  - fix: Use categories based on a single taxonomy axis, such as commercial dice games, traditional pub dice games, bluffing dice games, and roll-and-score dice games, or pick items with clearly exclusive mechanics.

- **puzzle-0480** (hard) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - “Pig” and “Pass the Pigs” are push-your-luck games, but “Pig” is placed under ELIMINATION. “Liar's Dice” and “Perudo” are essentially the same bluffing family, while “Mexico” is also a bluffing dice game. These placements make the solution non-unique by mechanism.
  - items: Pig, Pass the Pigs, Liar's Dice, Perudo, Mexico
  - groups: PUSH YOUR LUCK | MATCHING / BLUFFING | ELIMINATION
  - fix: Move or replace “Pig,” and avoid using near-duplicate bluffing dice variants unless the category is explicitly about that family.

- **puzzle-0492** (hard) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - “P vs NP” is a computer science/mathematics problem, not an unsolved physics problem. “Consciousness” and “Why We Sleep” are interdisciplinary neuroscience questions rather than cleanly biology in the same sense as the other biology items, and “Fermi Paradox” is astrobiology/SETI rather than cosmology.
  - items: P vs NP, Consciousness, Why We Sleep, Fermi Paradox
  - groups: UNSOLVED PURE MATHEMATICS | UNSOLVED PHYSICS | UNSOLVED BIOLOGY | UNSOLVED COSMOLOGY
  - fix: Move “P vs NP” out of physics or replace it with a physics problem such as “Turbulence,” “High-Temperature Superconductivity,” or “Measurement Problem.” Consider tightening the other labels to avoid interdisciplinary overlap.

- **hard-001** (hard) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - “Record” belongs naturally to “Break a ritual” only if interpreted as a phrase, but “break a record” is not a ritual. It is a different sense of “break” from the group label and does not match the other ritual items.
  - items: Record
  - groups: Break a ritual
  - fix: Replace “Record” with a ritual/observance item such as “Sabbath,” “Vigil,” or “Tradition,” or relabel the group as general “things you can break by ending/interruption.”

- **puzzle-0026** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Lagos is not the capital of Nigeria; Abuja is. This makes the African Capitals group factually incorrect.
  - items: Lagos
  - groups: African Capitals
  - fix: Replace Lagos with Abuja or another African capital.

- **puzzle-0029** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Storm Events and Cold Weather overlap because blizzards, hail, sleet, and flurries are also storm or storm-like weather events. The categories do not define mutually exclusive domains.
  - items: Hail, Blizzard, Sleet, Flurry
  - groups: Storm Events | Cold Weather
  - fix: Use clearer labels such as Thunderstorm Phenomena, Winter Precipitation, Heat Conditions, and Mild/Cloudy Conditions.

- **puzzle-0035** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Tabloid is a newspaper format/type, not a newspaper section. This group mixes sections with non-sections.
  - items: Tabloid
  - groups: Newspaper Sections
  - fix: Replace Tabloid with Sports, Business, Opinion, Arts, or Weather.

- **puzzle-0069** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Platinum is not usually classified as a coinage metal in the traditional chemistry group; the coinage metals are copper, silver, gold, and roentgenium. Platinum is a precious/platinum-group metal.
  - items: Platinum
  - groups: Coinage Metals
  - fix: Replace Platinum with Roentgenium, or rename the group to Precious/Coin Metals and adjust the set.

- **puzzle-0092** (medium) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - Sublime and Sublimity are essentially the same concept in different grammatical forms, appearing in the same group.
  - items: Sublime, Sublimity
  - groups: Romantic Period
  - fix: Replace one with a distinct Romantic-period concept such as Nature, Individualism, Imagination, or Melancholy.

- **puzzle-0096** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Heart is an organ that pumps blood, but it is not part of the transport vessel set in the same way as artery, vein, and capillary. The category label 'Transport System' is also vague for the circulatory system.
  - items: Heart
  - groups: Transport System
  - fix: Rename the group to Circulatory System or replace Heart with Blood/Vessel depending on the intended category.

- **puzzle-0097** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - La Tomatina is a tomato-throwing festival, not a water festival. Holi Phera is also not a standard water-festival item; Holi is a color/spring festival, while water may be part of some celebrations.
  - items: La Tomatina, Holi Phera
  - groups: Festivals of Water
  - fix: Replace with clearer water festivals such as Thingyan, Bon Om Touk, Boryeong Mud Festival, or Water Festival.

- **puzzle-0121** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Sharp and Natural are not flats in music; they are other accidentals. Key Signature can contain flats, but it is not a flat.
  - items: Sharp, Natural, Key Signature
  - groups: Flat in music
  - fix: Rename the group to Music Notation or replace with B-flat, E-flat, A-flat, and D-flat.

- **puzzle-0126** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Precious metals, industrial metals, and alkali metals are all types or uses of metals, and Copper appears as both an industrial metal and a traditional coinage/precious-adjacent metal. The category domains are not mutually exclusive enough.
  - items: Platinum, Palladium, Rhodium, Iridium, Copper
  - groups: Precious metals | Industrial metals | Alkali metals
  - fix: Use mutually exclusive chemical families or clearly define the industrial category with non-overlapping examples.

- **puzzle-0129** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Tuber and bulb are not roots botanically; they are storage organs, typically modified stems or leaf bases. Rhizome is also a modified stem, not a root.
  - items: Tuber, Bulb, Rhizome
  - groups: Plant roots
  - fix: Rename to Underground Plant Parts or replace with root types such as Fibrous Root, Adventitious Root, Prop Root, and Taproot.

- **puzzle-0164** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Club moss is not a moss; it is a lycophyte. Peat is a soil/accumulated organic material, not a moss or lichen, though it is often formed from sphagnum.
  - items: Peat, Club Moss
  - groups: Mosses and lichens
  - fix: Replace with true mosses/lichens such as Haircap Moss, Cushion Moss, Iceland Moss, or Usnea.

- **puzzle-0169** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Sand Trap is not a type of golf iron or an iron-related club term; it is a course hazard. Fairway is also a course area, not a golf iron. This makes the Golf irons group unfair.
  - items: Sand Trap, Fairway
  - groups: Golf irons
  - fix: Replace with actual iron/club terms such as 3-Iron, 7-Iron, Long Iron, Short Iron, or Blade.

- **puzzle-0175** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Launch belongs naturally to Rocket stage as well as Development stage. The rocket category already includes rocket-launch concepts, so this item can reasonably be selected with the rocket group.
  - items: Launch
  - groups: Rocket stage | Development stage
  - fix: Replace Launch in Development stage with Pilot, MVP, Alpha, or Release Candidate.

- **puzzle-0178** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Cider is not wine, and Vineyard and Barrel are wine-production associations rather than a wine press itself. The Press (wine) group is semantically loose and one item is placed incorrectly.
  - items: Vineyard, Barrel, Cider
  - groups: Press (wine)
  - fix: Rename to Press (beverage making) or replace with Pomace, Crush, Must, Winepress.

- **puzzle-0197** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Schooner is not a bark/barque; it is a different type of sailing vessel. Vessel is also generic rather than specifically a bark ship.
  - items: Schooner, Vessel
  - groups: Bark ship
  - fix: Use Barque, Three-Master, Foremast, Mainmast, Mizzenmast, or Square-Rigged.

- **puzzle-0199** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Crease and Bowler are central cricket terms but not specific to a cricket bat. Dugout and Home Run are baseball-game terms rather than baseball-bat terms. The two bat-sport groups are close enough that generic sport terms weaken uniqueness.
  - items: Crease, Bowler, Dugout, Home Run
  - groups: Baseball bat | Cricket bat
  - fix: Make the labels broader, such as Baseball and Cricket, or use bat-specific items like Barrel, Knob, Handle, Willow, Blade, and Grip.

- **puzzle-0202** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - These four emotion categories are intensity levels or related affective states, not cleanly separated meanings. Afraid contains Terrified/Petrified while Furious contains Enraged, and the puzzle is mostly synonym sorting by subtle intensity, which is brittle for medium.
  - items: Livid, Enraged, Incensed, Irate, Terrified, Petrified, Frightened, Spooked
  - groups: Meaning FURIOUS | Meaning ANNOYED | Meaning SAD | Meaning AFRAID
  - fix: Use clearer non-overlapping synonym sets or make the title/difficulty reflect a synonym ladder with carefully separated intensities.

- **puzzle-0255** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Witness Statement can be a physical clue/evidence item, and Evidence Bag is part of handling physical clues. The Crime Scene and Physical Clues groups overlap in the evidence domain.
  - items: Witness Statement, Evidence Bag, Fingerprint, DNA Sample
  - groups: Physical Clues | Crime Scene
  - fix: Make Crime Scene contain scene-setting items only, such as Yellow Tape, Chalk Outline, Body, Flashlight, or remove evidence-container/document items.

- **puzzle-0276** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Several desserts belong to more than one listed dessert category. Tiramisu and Opera are cakes but also layered cream desserts; Trifle is commonly a custard dessert but also cake/cream layered; Baked Alaska and Ice Cream Cake combine cake and frozen dessert. The category boundaries are not clean.
  - items: Tiramisu, Opera, Trifle, Baked Alaska, Ice Cream Cake
  - groups: Cake Desserts | Custard Desserts | Frozen Desserts
  - fix: Use mutually exclusive dessert families or replace hybrid desserts with cleaner examples.

- **puzzle-0287** (medium) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Regional African river sorting with items like Moulouya, Medjerda, Chelif, Sebou, Jubba, Awash, Rufiji, and Lomami is specialist geography knowledge and too hard for medium.
  - items: Moulouya, Medjerda, Chelif, Sebou, Jubba, Awash, Rufiji, Lomami
  - groups: West African Rivers | East African Rivers | North African Rivers | Congo Basin Tributaries
  - fix: Move to hard/expert or use more widely known rivers and less granular regional labels.

- **puzzle-0290** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Norway has both a Nordic cross design and a red-white-blue flag, so it fits two listed categories. Several Eagle Emblem countries also have red/white/blue elements, but Norway is the clearest direct overlap with the explicit Red, White and Blue category.
  - items: Norway
  - groups: Flags: Red, White and Blue Tricolour | Flags: Nordic Cross Design
  - fix: Change the first label to Horizontal Red/White/Blue Tricolour and avoid any country also matching another flag-design category.

- **puzzle-0292** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - ER and Grey's Anatomy are medical dramas, not procedural dramas in the usual TV-format sense. Big Brother is a reality show, but not always a competition format in the same way as Survivor, The Amazing Race, or MasterChef.
  - items: ER, Grey's Anatomy, Big Brother
  - groups: Procedural Drama Examples | Reality Competition Examples
  - fix: Use clearer procedurals such as CSI, Law & Order, NCIS, Criminal Minds, and rename or adjust the reality group if including Big Brother.

- **puzzle-0301** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Structural Story Devices overlaps with Point of View Types because Unreliable Narrator is fundamentally a narration/point-of-view device. Frame Narrative and Epistolary are also narrative structure/time/perspective devices, making the categories conceptually entangled.
  - items: Unreliable Narrator, Frame Narrative, Epistolary, Parallel Narrative
  - groups: Point of View Types | Structural Story Devices | Narrative Time Techniques
  - fix: Separate by unmistakable surface forms, or replace Unreliable Narrator with a purely structural item.

- **puzzle-0305** (medium) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - French culinary technique names such as Poeler, Mijoter, Laminage, Crémage, Feuilletage, and Foncer are specialist terminology and too hard for English medium unless the audience is culinary-trained.
  - items: Poeler, Mijoter, Laminage, Crémage, Feuilletage, Foncer
  - groups: French Dry-Heat Techniques | French Moist-Heat Techniques | French Pastry Methods
  - fix: Move to hard/expert or use English culinary terms with only widely recognized French sauce names.

- **puzzle-0316** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Keyboard-Plucked Instruments is a subset of Plucked String Instruments, and Struck String Instruments also includes keyboard instruments like Piano and Clavichord. The categories are nested by playing mechanism and interface, so the labels overlap conceptually.
  - items: Harpsichord, Virginal, Spinet, Psaltery, Clavichord, Piano
  - groups: Plucked String Instruments | Struck String Instruments | Keyboard-Plucked Instruments
  - fix: Make categories parallel, for example Bowed, Plucked Non-keyboard, Struck, Keyboard String, and move Psaltery out of keyboard-plucked.

- **puzzle-0316** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Psaltery is plucked or struck, but it is not a keyboard-plucked instrument. Harpsichord, virginal, and spinet are keyboard-plucked; psaltery does not belong with them.
  - items: Psaltery
  - groups: Keyboard-Plucked Instruments
  - fix: Replace Psaltery with Clavicytherium or another keyboard-plucked instrument, or move Psaltery to Plucked String Instruments.

- **puzzle-0317** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Treaty of Versailles was signed in 1919, so it fits the 1910s, but it is strongly a post-WWI settlement; Wall Street Crash Aftermath is awkward because the crash was in 1929 and only the aftermath is 1930s. The label relies on a phrasing workaround and is less clean than the other event items.
  - items: Wall Street Crash Aftermath
  - groups: World Events of the 1930s
  - fix: Use Great Depression, Dust Bowl, Munich Agreement, or another unambiguously 1930s event.

- **puzzle-0320** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several items are not cleanly first/defining milestones of the listed decade. Wi-Fi was introduced in the late 1990s, app stores and cloud storage were major 2000s developments, streaming video was already a major 2000s milestone, and short-form video was strongly associated with the 2010s via Vine/TikTok. GPS Navigation is also not inherently an internet milestone.
  - items: Wi-Fi, App Stores, Streaming Video, Cloud Storage, Short-Form Video, GPS Navigation
  - groups: 1990s Internet Milestones | 2000s Internet Milestones | 2010s Internet Milestones | 2020s Internet Milestones
  - fix: Rebuild around clearly dated internet events or services, or change the labels from decade-first milestones to broader technology eras with less rigid dating.

- **puzzle-0322** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Jazz musicians often span multiple listed subgenres, so several items do not belong uniquely to one category. Miles Davis and John Coltrane are especially ambiguous across bebop, hard bop, cool/modal, and later styles; Thelonious Monk also resists a clean single-subgenre placement.
  - items: Miles Davis, John Coltrane, Thelonious Monk
  - groups: Bebop Artists | Hard Bop Artists | Cool Jazz / Modal Jazz Artists
  - fix: Use albums, tunes, or narrower era-specific descriptors instead of artist names, or choose artists with much less cross-subgenre overlap.

- **puzzle-0323** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The heat-transfer categories overlap conceptually. Deep-frying is cooking in a liquid medium but is listed under convection; braising, poaching, simmering, and blanching also rely heavily on convection in liquid. Roasting and baking can involve radiation as well as convection. This makes the categories not mutually exclusive.
  - items: Deep-Frying, Poaching, Simmering, Braising, Blanching, Baking, Roasting
  - groups: Convection Cooking Techniques | Radiation Cooking Techniques | Liquid-Medium Cooking Techniques
  - fix: Use non-overlapping culinary method labels such as dry-heat, moist-heat, fat-based, and combination methods, then place items accordingly.

- **puzzle-0325** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several consumer gadgets are assigned to decades after they were first sold or commercially available. The Sony Walkman is 1979, but fax machines and flat-screen TVs existed commercially before their listed decades; the first commercial e-readers also appeared in the late 1990s, not the 2000s.
  - items: Fax Machine, Flat-Screen TV, e-Reader
  - groups: Consumer Gadgets First Sold in the 1980s | Consumer Gadgets First Sold in the 2000s
  - fix: Change labels to 'popularized in' instead of 'first sold in', or replace the disputed items with cleaner decade-first examples.

- **puzzle-0352** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Structural categories overlap. A dome can be a compression structure or a shell structure; a geodesic dome is both dome-like and often treated as a frame or shell system; cable-stayed bridges also use compression towers and tension cables. Items are not uniquely classifiable by the listed labels.
  - items: Dome, Geodesic Dome, Cable-Stayed, Thin Shell
  - groups: Compression Structures | Tension Structures | Frame Structures | Shell Structures
  - fix: Use more mutually exclusive structural families, or choose examples that do not combine systems.

- **puzzle-0353** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Board-game mechanics overlap heavily. Deck Building and Drafting are both card-based but also resource/engine mechanics; Trading is a resource-management mechanic as well as social; Tile Placement and Route Building can be territory/spatial mechanics but not necessarily territory control. The groups are not cleanly exclusive.
  - items: Engine Building, Tableau Building, Deck Building, Drafting, Trading, Tile Placement, Route Building
  - groups: Resource Management Mechanics | Card-Based Mechanics | Territory Mechanics | Social Mechanics
  - fix: Use more specific labels or choose mechanics with less cross-category usage.

- **puzzle-0367** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Therapy schools overlap substantially. DBT is a cognitive-behavioural therapy, EMDR is usually a trauma-focused psychotherapy rather than simply body-based, and Logotherapy is commonly classified as existential therapy, which is already in the same group but not necessarily humanistic in a strict sense. Several labels are too broad for unique sorting.
  - items: CBT, DBT, EMDR, Logotherapy, Cognitive Processing
  - groups: Cognitive Therapies | Behavioural Therapies | Humanistic Therapies | Body-Based Therapies
  - fix: Use accepted umbrella categories from one taxonomy, or use clearer examples that do not span CBT/behavioural/body-based traditions.

- **puzzle-0368** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The political-system labels overlap. Democracy can be a government system and can also involve direct participation; republics can be democratic; constitutional monarchies can be parliamentary; caliphates can be theocratic and authoritarian. Several items are adjectives or structures rather than parallel system names.
  - items: Democracy, Direct Democracy, Republic, Constitutional Monarchy, Parliamentary, Caliphate, State Religion, Oligarchy
  - groups: Authoritarian Systems | Government Structures | Direct Participation | Theocratic Systems
  - fix: Rebuild with parallel, non-overlapping categories such as regime type, state structure, selection mechanism, and religious authority terms in separate puzzles.

- **puzzle-0378** (medium) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - Self-Esteem, Self-Worth, and Self-Respect are near-synonyms, and the category labels 'Self-Worth Concepts' and 'Self-Belief Concepts' are semantically close. The puzzle relies on fine distinctions that are not stable enough for a 4x4 grouping puzzle.
  - items: Self-Esteem, Self-Respect, Self-Worth, Dignity, Self-Efficacy, Growth Mindset, Internal Locus, Resilience
  - groups: Self-Worth Concepts | Self-Belief Concepts
  - fix: Use more distinct psychological construct families, or avoid grouping near-synonyms together against adjacent self-concept labels.

- **puzzle-0394** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Carcassonne and Ticket to Ride are not worker-placement games. Carcassonne is primarily tile-laying/area control, and Ticket to Ride is route building/set collection. Azul is commonly classed as abstract strategy, but also pattern building; the main blocker is the worker-placement group.
  - items: Carcassonne, Ticket to Ride
  - groups: WORKER PLACEMENT
  - fix: Replace with clear worker-placement games such as Caylus, Stone Age, Viticulture, or A Feast for Odin.

- **puzzle-0400** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - The 'starts with dot' and 'starts with dash' groups overlap with the 'all dots' and 'all dashes' groups: E/I/S/H also start with dots, and T/M/O/CH also start with dashes. This violates the one-category rule. CH is also not part of standard international Morse as a single English letter, which is a language-specific complication.
  - items: E, I, S, H, T, M, O, CH
  - groups: MORSE ALL DOTS | MORSE ALL DASHES | MORSE STARTS WITH DOT | MORSE STARTS WITH DASH
  - fix: Change the latter labels to 'mixed codes starting with dot/dash' and use only standard symbols for the target language.

- **puzzle-0403** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Orion is not a zodiac constellation. Scorpius and Sagittarius are zodiac constellations but also southern/equatorial sky objects, while the 'Prominent Seasonal (Northern)' label overlaps with northern constellations. The category scheme mixes hemisphere, zodiac membership, and seasonal visibility.
  - items: Orion, Scorpius, Sagittarius, Cygnus, Lyra, Aquila, Hercules
  - groups: NORTHERN CONSTELLATIONS | SOUTHERN CONSTELLATIONS | ZODIAC CONSTELLATIONS | PROMINENT SEASONAL (NORTHERN)
  - fix: Use one classification principle, such as zodiac vs non-zodiac, official constellation families, or hemisphere only.

- **puzzle-0422** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several buildings are assigned to the wrong movement. Sagrada Família is usually Catalan Modernisme/Art Nouveau, while 30 St Mary Axe is contemporary high-tech architecture, not Art Nouveau or Art Deco. St. Peter's Basilica is primarily Renaissance with Baroque additions, so it is not a clean Baroque/Rococo example.
  - items: Sagrada Família, 30 St Mary Axe, St. Peter's Basilica
  - groups: BAROQUE & ROCOCO | ART NOUVEAU & DECO
  - fix: Replace with cleaner movement exemplars, e.g. Casa Batlló for Art Nouveau and Chrysler Building/Empire State for Art Deco, and a clearly Baroque church/palace for Baroque.

- **puzzle-0423** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The group labels claim consecutive Greek-letter ranges, but each group omits two letters from the range because there are only four items. For example letters 1-6 should include Epsilon and Zeta, and letters 7-12 should include Lambda and Mu. This is misleading even if the included letters are in the stated ranges.
  - items: Alpha, Beta, Gamma, Delta, Eta, Theta, Iota, Kappa, Nu, Xi, Omicron, Pi, Tau, Upsilon, Phi, Omega
  - groups: GREEK LETTERS 1–6 | GREEK LETTERS 7–12 | GREEK LETTERS 13–18 | GREEK LETTERS 19–24
  - fix: Rename labels to 'Selected Greek letters from positions 1-6' or use exact ordinal groups such as 1-4, 7-10, 13-16, 21-24.

- **puzzle-0424** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Nur-Sultan is no longer the capital name of Kazakhstan; it reverted to Astana in 2022. The title also says 'countries' but the groups include regions; that is minor compared with the outdated capital.
  - items: Nur-Sultan
  - groups: CENTRAL ASIAN CAPITALS
  - fix: Replace Nur-Sultan with Astana.

- **puzzle-0425** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The Paleogene group contains animals from the wrong time periods. Mammoths and dodos are Quaternary/Holocene, saber-toothed cats are mostly Neogene/Quaternary depending on the intended animal, and Megalodon is mainly Miocene-Pliocene, not Paleogene megafauna. The category is factually unusable.
  - items: Mammoth, Saber-Tooth Tiger, Megalodon, Dodo
  - groups: PALEOGENE MEGAFAUNA
  - fix: Change the label to a broader 'Cenozoic Megafauna' or replace with actual Paleogene animals such as Basilosaurus, Uintatherium, Arsinoitherium, or Gastornis.

- **puzzle-0445** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Mexican food categories overlap strongly. Tacos, tamales, quesadillas, tlayudas, huaraches, sopes, and tostadas are all commonly corn-based antojitos/street foods. Birria can be served as tacos and as a stew. Mole negro is a complex sauce, not merely a condiment, but that is less serious than the category overlap.
  - items: Taco, Tamale, Quesadilla, Tlayuda, Huarache, Sope, Tostada, Birria, Mole Negro
  - groups: STREET FOOD (ANTOJITOS) | SOUPS / STEWS | CORN-BASED DISHES | SAUCES / CONDIMENTS
  - fix: Use non-overlapping categories such as soups/stews, sauces, masa-based antojitos, and beverages/desserts, with labels that avoid 'street food' vs 'corn-based' overlap.

- **puzzle-0448** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Surrealism is an early 20th-century movement, not mid-century. Neo-Expressionism is usually late 20th century/contemporary, while Conceptual Art began in the 1960s and could fit mid-century/late modern categories. The time labels are too loose and overlapping.
  - items: Surrealism, Neo-Expressionism, Conceptual Art
  - groups: MID-CENTURY | CONTEMPORARY
  - fix: Use narrower date bands and assign movements by origin period, or replace ambiguous movements with cleaner chronological examples.

- **puzzle-0450** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - The transformation categories overlap. Isometric is both an item under Projections and the adjective for Isometries; scaling and dilation are near-synonyms; homothety is a type of dilation; inversion can be a geometric transformation not necessarily topological in the same sense as homeomorphism/homotopy. This is unfairly non-exclusive.
  - items: Isometric, Dilation, Scaling, Homothety, Inversion
  - groups: ISOMETRIES | SIMILARITY TRANSFORMS | PROJECTIONS | TOPOLOGICAL
  - fix: Remove nested/synonymous transform terms and keep projection types separate from transformation classes.

- **puzzle-0450** (medium) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - Dilation, Scaling, and Homothety are near-duplicate similarity transformations, with homothety essentially a specific kind of dilation/scaling.
  - items: Dilation, Scaling, Homothety
  - groups: SIMILARITY TRANSFORMS
  - fix: Keep one of these and replace the others with distinct similarity transformations.

- **puzzle-0469** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Programming-language paradigms are not mutually exclusive. Scala and Elixir are functional as well as concurrent/actor-oriented; Prolog is logic/declarative; C++ and Ruby support multiple paradigms; SQL is declarative but not a general-purpose language in the same way as others. Solvers can reasonably place several items in more than one category.
  - items: Scala, Elixir, Prolog, C++, Ruby, SQL
  - groups: OBJECT-ORIENTED | FUNCTIONAL | DECLARATIVE | CONCURRENT / ACTOR
  - fix: Use labels like 'best known for' and choose less multiparadigm examples, or make categories about language features with very clear item wording.

- **puzzle-0470** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The label says Falcon family, but Starship is a separate SpaceX launch system, not a member of the Falcon rocket family.
  - items: Starship
  - groups: FALCON FAMILY (SpaceX)
  - fix: Replace Starship with Falcon 1e or Falcon 9 Block 5, or relabel the group as SpaceX launch vehicles.

- **puzzle-0470** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Vega-C is an ESA/Avio launch vehicle, but it is not part of the Ariane family. The category label promises Ariane-family vehicles specifically.
  - items: Vega-C
  - groups: ARIANE FAMILY (ESA)
  - fix: Replace Vega-C with another Ariane variant, or relabel the group as ESA / European launch vehicles.

- **puzzle-0472** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Several legal terms can reasonably belong to more than one listed legal category. Assault and fraud can be both crimes and tort/civil claims, while trespass can be a tort and also a criminal offense. That makes the criminal vs civil/tort grouping unfair as written.
  - items: Assault, Fraud, Trespass
  - groups: CRIMINAL LAW | CIVIL / TORT
  - fix: Use items that are more exclusively procedural or doctrinal within each area, or make the labels explicitly 'Crimes' and 'Torts' and avoid dual-use terms.

- **puzzle-0474** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Corporate tax is generally an income tax, but payroll taxes are also commonly taxes on wages/payroll income, so 'Income Tax' and 'Payroll Tax' overlap conceptually. This is especially problematic because Wage Tax sits under Income Tax while payroll-tax items are also wage-based.
  - items: Wage Tax, Corporate Tax, Social Security, Medicare Levy, Unemployment Tax, Pension Contribution
  - groups: INCOME TAX | PAYROLL TAX
  - fix: Make the labels more precise, e.g. 'Personal/Business Income Taxes' vs 'Social Insurance Payroll Charges', and avoid 'Wage Tax' if payroll tax is another group.

- **puzzle-0475** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Poitiers is ambiguous without a year. The Battle of Poitiers can refer to the 732 early medieval battle or the 1356 Hundred Years' War battle, while the group appears to mean medieval Hundred Years' War battles alongside Agincourt and Crécy.
  - items: Poitiers
  - groups: MEDIEVAL
  - fix: Specify 'Poitiers (1356)' or replace it with an unambiguous medieval battle.

- **puzzle-0476** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Several fairy-tale figures are role-ambiguous across traditions. Puss in Boots is commonly a helper rather than only a trickster; Rumpelstiltskin is often treated as an antagonist/villain; Tom Thumb is often a hero/protagonist. These overlap with the listed Hero, Villain, Helper, and Trickster roles.
  - items: Tom Thumb, Puss in Boots, Rumpelstiltskin
  - groups: THE HERO | THE VILLAIN | THE HELPER | THE TRICKSTER
  - fix: Use archetypes that are less role-overlapping, or label the group 'Trickster Figures' and avoid characters better known as helpers/villains/heroes.

- **puzzle-0478** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Flyweight, Bantamweight, and Featherweight are weight-class names used in both boxing and MMA. Even though the boxing group uses WBC-specific modified names for some classes, the overlapping terminology makes the UFC/MMA items not uniquely tied to that category.
  - items: Flyweight, Bantamweight, Featherweight
  - groups: BOXING (WBC) | UFC / MMA
  - fix: Use MMA-specific weights with kg/lb values or choose boxing classes whose names do not duplicate the MMA group.

- **puzzle-0488** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Diffie-Hellman is primarily a key-exchange protocol, not an asymmetric encryption algorithm in the same sense as RSA or ElGamal. Elliptic Curve is also a family of public-key cryptographic techniques rather than a single encryption scheme. The label 'Asymmetric / Public Key' partly saves this, but the mixed granularity is likely to confuse solvers.
  - items: Diffie-Hellman, Elliptic Curve
  - groups: ASYMMETRIC / PUBLIC KEY
  - fix: Rename the group to 'Public-Key Cryptography' or replace these with clearer asymmetric encryption/signature algorithms.

- **puzzle-0489** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Tim Sort and Intro Sort are hybrid algorithms rather than clean divide-and-conquer sorts. Tim Sort is based on insertion sort plus merge sort, while Intro Sort combines quicksort, heapsort, and insertion sort. They overlap with other listed technique categories.
  - items: Tim Sort, Intro Sort
  - groups: DIVIDE AND CONQUER | INSERTION-BASED | SELECTION-BASED
  - fix: Use pure divide-and-conquer sorts such as Merge Sort, Quick Sort, Bitonic Sort, or Stooge Sort, or add a separate 'Hybrid Sorts' group.

### RU (245)

- **ru-0005** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Категории «В пенале» и «В рюкзаке» пересекаются: пенал обычно сам лежит в рюкзаке, а предметы из пенала тоже могут находиться в рюкзаке. Это делает принцип группировки ситуативным, а не семантически чистым.
  - groups: В пенале | В рюкзаке
  - fix: Переименовать категории по функциям, например «Чертёжные принадлежности» и «Школьные вещи для переноски/учёбы», либо заменить ситуативные labels.

- **ru-0005** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Портфель» не является предметом, который находится «в рюкзаке»; это альтернативный школьный контейнер/сумка.
  - items: Портфель
  - groups: В рюкзаке
  - fix: Заменить на предмет, который действительно кладут в рюкзак, например «Сменка», «Ланчбокс» уже есть, «Папка» или «Учебник».

- **ru-0007** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Метро» не подходит к label «Наземный на рельсах»: метро часто подземное, а ключевой признак не наземность.
  - items: Метро
  - groups: Наземный на рельсах
  - fix: Переименовать группу в «Рельсовый транспорт» или заменить «Метро» на наземный рельсовый вид.

- **ru-0008** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Спутник» и «Марсоход» не являются транспортом в обычном смысле: спутник не перевозит людей/грузы по маршруту, а марсоход — исследовательский аппарат. Для easy категория «Космический транспорт» становится нечеткой.
  - items: Спутник, Марсоход
  - groups: Космический транспорт
  - fix: Переименовать группу в «Космические аппараты» либо заменить на более транспортные элементы вроде «Космический корабль», «Капсула», «Луноход» с подходящим label.

- **ru-0011** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Розовый» не является цветом радуги, поэтому категория «Тёплые цвета радуги» фактически неверна.
  - items: Розовый
  - groups: Тёплые цвета радуги
  - fix: Заменить «Розовый» на «Зелёный» и пересобрать группу оттенков зелёного, либо отказаться от темы радуги.

- **ru-0014** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Многие ягоды из категорий по месту произрастания могут относиться сразу к нескольким группам: малина, смородина и крыжовник бывают садовыми, но также растут дикорастущими; голубика может быть болотной и лесной. Для easy это слишком ситуативно.
  - items: Малина, Смородина, Крыжовник, Голубика
  - groups: Лесные ягоды | Садовые ягоды | Болотные ягоды
  - fix: Использовать более устойчивые категории, например «красные ягоды», «синие/тёмные ягоды», «ягоды в варенье», либо заменить спорные items.

- **ru-0015** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Сатанинский гриб» не является опасным двойником в этой группе, а самостоятельным ядовитым/несъедобным грибом; «Мухомор» и «Бледная поганка» тоже не поданы как двойники конкретных съедобных грибов. Label не соответствует items.
  - items: Мухомор, Бледная поганка, Сатанинский гриб
  - groups: Опасные двойники
  - fix: Переименовать группу в «Ядовитые грибы» или заменить на настоящие пары/двойники.

- **ru-0016** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Домашний скот» и «Мелкие фермерские животные» пересекаются: коза, осёл и кролик тоже могут относиться к сельскохозяйственным/домашним фермерским животным, а «мелкие фермерские» не является независимой категорией от скота.
  - items: Коза, Кролик, Осёл
  - groups: Домашний скот | Мелкие фермерские животные
  - fix: Разделить по устойчивым признакам: «крупный скот», «мелкий скот», «птица», «питомцы», либо заменить label на непересекающийся.

- **ru-0020** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Категории по способу передвижения и поведению пересекаются: комар, оса, пчела и слепень тоже летающие насекомые; муравьи и жуки тоже ползают. Игрок может разумно распределять items иначе.
  - items: Комар, Оса, Пчела, Слепень, Муравей, Таракан
  - groups: Летающие насекомые | Кусающие насекомые | Жуки | Ползающие насекомые
  - fix: Использовать непересекающиеся таксономические/бытовые группы, например «бабочки», «жуки», «перепончатокрылые», «двукрылые», либо другие конкретные признаки.

- **ru-0031** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Таратор» не является супом русской кухни. Он культурно относится к балканской кухне, что конфликтует с title «Супы русской кухни».
  - items: Таратор
  - groups: Холодные супы
  - fix: Заменить на русский/восточнославянский холодный суп или изменить title на просто «Супы».

- **ru-0031** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Тюря» и «Похлёбка» не являются однозначно рыбными супами: тюря обычно хлебная холодная похлёбка, а похлёбка — общий тип супа.
  - items: Тюря, Похлёбка
  - groups: Рыбные супы
  - fix: Заменить на конкретные рыбные супы или переименовать группу.

- **ru-0037** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Пальцы и суставы» пересекается с «Части руки»: большой палец, указательный палец, мизинец и фаланга являются частями руки. Категории не независимы.
  - items: Большой палец, Указательный палец, Мизинец, Фаланга
  - groups: Части руки | Пальцы и суставы
  - fix: Переименовать первую группу в «Части руки без кисти» или заменить группу пальцев на другой непересекающийся набор.

- **ru-0038** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Органы чувств» и «Части глаза» пересекаются: глаза являются органом чувств, а ресницы, веки и зрачок относятся к глазам. Также язык является частью рта и органом чувств. Это создаёт вложенность категорий.
  - items: Глаза, Язык, Ресницы, Веки, Зрачок
  - groups: Органы чувств | Части рта | Части глаза
  - fix: Избегать nested labels: например «Вокруг глаз», «Во рту», «Контуры лица», «Органы чувств» без внутренних частей соседних органов.

- **ru-0047** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «На льду с камнями» фактически описывает кёрлинг/айс-сток, но включает «Ринк-бэнди» и «Айсхоккей», которые пересекаются с группой «На коньках» и не играются с камнями. «Хоккей» и «Айсхоккей» также являются почти одним и тем же в русском контексте.
  - items: Ринк-бэнди, Айсхоккей, Хоккей
  - groups: На коньках | На льду с камнями
  - fix: Заменить группу на «Игры на льду» без камней или убрать хоккей/айсхоккей-дубликат.

- **ru-0047** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - «Хоккей» и «Айсхоккей» в русскоязычном бытовом контексте обычно означают один и тот же вид спорта, что нарушает уникальность items.
  - items: Хоккей, Айсхоккей
  - groups: На коньках | На льду с камнями
  - fix: Оставить только один термин, второй заменить на другой зимний вид спорта.

- **ru-0050** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Летняя олимпиада», «Гимнастика» и «Новые в программе» пересекаются: гимнастика является летним олимпийским направлением, а скалолазание, скейтбординг, сёрфинг и брейкинг тоже относятся к летней программе. Категории не являются независимыми.
  - items: Художественная, Спортивная, Батут, Брейкинг, Скалолазание, Скейтбординг, Сёрфинг
  - groups: Летняя олимпиада | Гимнастика | Новые в программе
  - fix: Сделать группы параллельными, например «единоборства», «водные», «гимнастика», «зимние».

- **ru-0053** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Монополия», «Эрудит», «Имаджинариум» и «Активити» не являются «играми-ходилками» в обычном смысле. Это разные жанры настольных игр.
  - items: Монополия, Эрудит, Имаджинариум, Активити
  - groups: Игры-ходилки
  - fix: Переименовать группу в «Популярные настольные игры» или заменить на настоящие ходилки.

- **ru-0058** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Уличная музыка» и «Живая классика» являются оценочными/нестрогими labels. R&B, соул, джаз, блюз и регги исторически и жанрово пересекаются, а «хип-хоп» может включать рэп и трэп. Для puzzle группировки это нечетко.
  - items: Рэп, Хип-хоп, R&B, Трэп, Джаз, Блюз, Соул, Регги
  - groups: Уличная музыка | Живая классика
  - fix: Сделать labels жанрово точными и непересекающимися: «электронные жанры», «рок», «хип-хоп жанры», «джаз/блюз/соул» без регги или с отдельной логикой.

- **ru-0065** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Орион не является зодиакальным созвездием, поэтому один элемент группы «Созвездия зодиака» размещён неверно.
  - items: Орион
  - groups: Созвездия зодиака
  - fix: Заменить Орион на зодиакальное созвездие, например Телец, Овен или Рыбы.

- **ru-0067** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Географические категории морей пересекаются: моря России могут одновременно быть морями Европы или Азии. Это делает принцип группировки не взаимоисключающим.
  - groups: Моря России | Моря Европы | Моря Азии
  - fix: Развести категории по непересекающимся признакам, например «Океаны», «Моря Северного Ледовитого океана», «Моря Атлантики», «Моря Тихого океана».

- **ru-0067** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Японское море одновременно подходит как «Море России» и как море Азии, так как омывает берега России и находится в Восточной Азии.
  - items: Японское
  - groups: Моря России | Моря Азии
  - fix: Заменить на море, которое не пересекает другую заявленную категорию, либо поменять labels на непересекающиеся.

- **ru-0068** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Вершины-восьмитысячники» являются горами Азии, а несколько из них находятся в Гималаях. Категория вложена в «Горы Азии» и не является независимой.
  - items: Эверест, К2, Канченджанга, Лхоцзе
  - groups: Горы Азии | Вершины-восьмитысячники
  - fix: Не смешивать горные системы и отдельные вершины; заменить одну из групп на другой непересекающийся тип, например «Вулканы мира» или «Горные системы Африки».

- **ru-0069** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Реки Европейской России» пересекаются с «Реки Урала и Севера»: Урал, Печора, Северная Двина и Онега также относятся к европейской части России или её северу.
  - items: Урал, Печора, Северная Двина, Онега
  - groups: Реки Европейской России | Реки Урала и Севера
  - fix: Сделать регионы взаимоисключающими, например «Сибирь», «Дальний Восток», «Поволжье», «Север Европейской России».

- **ru-0071** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Города-миллионники пересекаются с региональными категориями: Новосибирск, Омск, Красноярск, Самара, Волгоград, Челябинск, Пермь, Уфа и другие тоже являются или были городами-миллионниками.
  - items: Новосибирск, Омск, Красноярск, Самара, Волгоград, Челябинск, Пермь, Уфа
  - groups: Города-миллионники | Города Сибири | Города Поволжья | Города Урала
  - fix: Не смешивать размер города с географией; сделать все категории региональными или все категории по размеру/статусу.

- **ru-0072** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Польша не относится к странам Балтии в обычном русском употреблении; это группа Эстония, Латвия, Литва.
  - items: Польша
  - groups: Страны Балтии
  - fix: Заменить Польшу или изменить категорию на «Страны у Балтийского моря».

- **ru-0072** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Франция не является «страной Пиренеев» в таком же очевидном смысле, как Испания, Португалия и Андорра; чаще речь о странах Пиренейского полуострова, куда Франция не входит.
  - items: Франция
  - groups: Страны Пиренеев
  - fix: Заменить Францию на более подходящий элемент или переименовать группу, если имеются в виду страны, связанные с Пиренеями.

- **ru-0074** (easy) — `TRIVIAL` [high] → verdict: `needs-claude-review`
  - Категории основаны на названиях флагов, но элементы включают не только цвета, а описатели вроде «Триколор» и «Трёхполосный». Это превращает группы в набор подсказок к одному флагу, а не в честную категорию цветов.
  - items: Триколор, Трёхполосный, Солнечный, Пшеничный
  - groups: Флаг России | Флаг Германии | Флаг Украины | Флаг Японии
  - fix: Использовать только настоящие цвета флагов или заменить тему на «страны по цветам флага» без самоописательных слов.

- **ru-0074** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - Во многих группах элементы являются синонимами или почти синонимами, особенно украинская группа: «Голубой», «Лазурный», «Небесный». Это нарушает принцип четырёх разных элементов.
  - items: Голубой, Лазурный, Небесный, Алый, Багровый
  - groups: Флаг Украины | Флаг Японии
  - fix: Заменить синонимические оттенки на различимые предметы или использовать другую категорию.

- **ru-0075** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Остаток не является частью дроби; это результат деления с остатком.
  - items: Остаток
  - groups: Части дроби
  - fix: Заменить на «целая часть» или «дробная часть», если нужна терминология дробей.

- **ru-0076** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Параллелограмм является четырёхугольником, но помещён в «Многоугольники». Так как «Четырёхугольники» уже есть отдельной группой, элемент разумно относится к двум категориям.
  - items: Параллелограмм
  - groups: Четырёхугольники | Многоугольники
  - fix: Заменить параллелограмм на многоугольник с числом сторон больше четырёх, например семиугольник.

- **ru-0076** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Четырёхугольники» являются подмножеством «Многоугольников», поэтому labels концептуально вложены.
  - groups: Четырёхугольники | Многоугольники
  - fix: Переименовать «Многоугольники» в «Многоугольники с 5+ сторонами» или заменить категорию.

- **ru-0078** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Титан, вольфрам, молибден и ванадий не являются редкоземельными элементами. Это фактическая ошибка в категории.
  - items: Титан, Вольфрам, Молибден, Ванадий
  - groups: Редкоземельные
  - fix: Заменить label на «Тугоплавкие и редкие металлы» или использовать настоящие редкоземельные элементы: лантан, церий, неодим, иттрий.

- **ru-0079** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Цветовые категории камней пересекаются: топаз, циркон, сапфир, шпинель и другие бывают разных цветов, поэтому один и тот же тип камня может соответствовать нескольким цветовым группам.
  - items: Топаз, Циркон, Сапфир, Шпинель
  - groups: Прозрачные камни | Красные камни | Синие камни | Зелёные камни
  - fix: Использовать камни с однозначной общеизвестной окраской или перейти на категории по типу/минералу, а не по цвету.

- **ru-0080** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - В группе «Цвета моря» элементы почти дублируют друг друга: «Бирюзовый», «Бирюзово-синий» и «Сине-зелёный» описывают очень близкие оттенки.
  - items: Бирюзовый, Бирюзово-синий, Сине-зелёный
  - groups: Цвета моря
  - fix: Заменить на более различимые цвета или сделать категории не оттеночными.

- **ru-0082** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Ноябрь не является зимним месяцем, а Май не является летним месяцем в стандартном календарном делении.
  - items: Ноябрь, Май
  - groups: Зимние месяцы | Летние месяцы
  - fix: Заменить Ноябрь и Май или перестроить группы месяцев.

- **ru-0088** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Охотники» и «Стадион» не являются основными героями «Ну, погоди!»; один элемент вообще место/эпизодический контекст, а не персонаж.
  - items: Охотники, Стадион
  - groups: Ну, погоди!
  - fix: Переименовать группу в «Ну, погоди!: персонажи и места» либо заменить на персонажей.

- **ru-0097** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Категории по эпохам пересекаются: Маяковский, Есенин, Пастернак также связаны с Серебряным веком/ранним XX веком, а «советские поэты» является широким периодом, включающим многих шестидесятников.
  - items: Маяковский, Есенин, Пастернак, Евтушенко, Вознесенский, Ахмадулина, Рождественский
  - groups: Поэты Серебряного века | Советские поэты | Поэты-шестидесятники
  - fix: Сделать labels более точными или не смешивать широкую советскую эпоху с подгруппой шестидесятников.

- **ru-0098** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Категории писателей по жанровой специализации пересекаются: Чехов и Гоголь — драматурги, Гоголь и Крылов — сатирики, Толстой и Достоевский писали рассказы. Для такой темы нельзя гарантировать единственную принадлежность.
  - items: Чехов, Гоголь, Крылов, Толстой, Достоевский
  - groups: Авторы великих романов | Мастера рассказа | Драматурги | Писатели-сатирики
  - fix: Использовать непересекающиеся факты, например конкретные произведения по авторам.

- **ru-0099** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Жанровые категории советских писателей пересекаются: Булгаков и Хармс не только сатирики, Чуковский, Маршак, Михалков и Барто тоже классики советской литературы, Симонов был не только автором военной прозы.
  - items: Булгаков, Хармс, Чуковский, Маршак, Михалков, Барто, Симонов
  - groups: Классики советской прозы | Авторы военной прозы | Советские сатирики | Детские советские авторы
  - fix: Лучше группировать конкретные произведения по авторам или авторов по однозначным произведениям.

- **ru-0100** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Категории художников пересекаются: Шишкин, Левитан, Саврасов и Куинджи связаны с передвижниками или близкими кругами, а Суриков и Репин также мастера исторической живописи.
  - items: Шишкин, Левитан, Саврасов, Куинджи, Суриков, Репин
  - groups: Передвижники | Пейзажисты | Мастера исторической живописи
  - fix: Использовать категории по конкретным объединениям или по известным картинам, не смешивая объединение и жанр.

- **ru-0112** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Группа «Герои» слишком общая: в сказках героями могут быть и помощники, и правители, и победители злодеев. Василиса, Алёнушка и Марья Моревна скорее образуют отдельную группу сказочных героинь.
  - items: Василиса, Алёнушка, Марья Моревна
  - groups: Герои | Волшебные помощники | Правители
  - fix: Переименовать группу в «Сказочные девушки/героини» и заменить Иван-дурака либо перестроить категории по ролям без общей группы «Герои».

- **ru-0117** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Акула и мурена являются рыбами, но помещены в «Прочие обитатели», при наличии отдельной группы «Рыбы».
  - items: Акула, Мурена
  - groups: Рыбы | Прочие обитатели
  - fix: Заменить акулу и мурену на не-рыб или переименовать первую группу в «Промысловые рыбы».

- **ru-0118** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Вискоза обычно считается искусственным, а не синтетическим волокном. В easy-категории «Синтетические» это неточно.
  - items: Вискоза
  - groups: Синтетические
  - fix: Заменить на эластан, полиамид или лавсан, либо переименовать группу в «Искусственные и синтетические».

- **ru-0118** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Категории смешивают состав, фактуру и декоративность: велюр, трикотаж, твид, бархат, органза и кружево могут быть натуральными, синтетическими или смешанными. Это не взаимоисключающие признаки.
  - items: Велюр, Флис, Трикотаж, Твид, Гипюр, Кружево, Бархат, Органза
  - groups: Натуральные | Синтетические | Фактурные | Декоративные
  - fix: Группировать только по составу волокна или только по типу ткани/плетения.

- **ru-0121** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Заголовок обещает спорт в воде и на льду, но две группы — обычные виды спорта с мячом и ракеткой. Кроме того, теннис одновременно спорт с мячом и с ракеткой.
  - items: Теннис
  - groups: С мячом | С ракеткой
  - fix: Убрать пересечение: заменить теннис в первой группе на гандбол или регби, а заголовок расширить до «Виды спорта».

- **ru-0122** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Пенальти, штрафной удар и угловой — не нарушения; это стандартные возобновления/удары, назначаемые в разных ситуациях. Угловой вообще обычно не связан с нарушением.
  - items: Пенальти, Штрафной удар, Угловой
  - groups: Нарушения
  - fix: Переименовать группу в «Стандартные положения» и заменить офсайд, либо сделать группу настоящих нарушений.

- **ru-0126** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Блесна — искусственная приманка/снасть, а не наживка в смысле червя, мотыля и опарыша. Она может относиться к снастям или приманкам.
  - items: Блесна
  - groups: Снасти | Наживка
  - fix: Переименовать группу в «Приманки и наживки» или заменить блесну на кукурузу/тесто.

- **ru-0133** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «На небе» и «В воздухе» концептуально пересекаются, а ураган, буран, смерч и торнадо происходят в атмосфере/небе. Гроза также происходит в воздухе.
  - items: Гроза, Торнадо, Ураган, Буран, Смерч
  - groups: На небе | В воздухе
  - fix: Развести категории по типу явления: «Атмосферные оптические», «Ветровые», «Геологические», «Морские».

- **ru-0134** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Маленькие звери» пересекается с другими биологическими группами: барсук и выдра являются хищниками. Категория по размеру смешана с таксономическими категориями.
  - items: Барсук, Выдра, Заяц, Ёж
  - groups: Хищники | Грызуны | Маленькие звери
  - fix: Заменить «Маленькие звери» на таксономически точную группу, например «Насекомоядные» или «Куньи», с корректными элементами.

- **ru-0140** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Узкие специалисты» is not a single non-overlapping category: cardiologists, nephrologists, gastroenterologists and pulmonologists are also narrow specialists. The label overlaps the therapeutic group rather than defining a separate axis.
  - groups: Терапевтические | Узкие специалисты
  - fix: Rename/rebuild the fourth group around a concrete specialty domain, e.g. «Органы чувств и кожа» if the items are офтальмолог/лор/дерматолог plus another matching specialist.

- **ru-0142** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The puzzle mixes meat-source categories with a dish-form category. «Котлеты» can be made from beef, pork, poultry, etc., so it overlaps the first three groups by construction.
  - items: Пожарская, Рубленая, Биточки, Люля-кебаб
  - groups: Из говядины | Из свинины | Из птицы | Котлеты
  - fix: Use four parallel meat-source categories or four parallel dish-form categories.

- **ru-0142** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Several dishes are not tied uniquely to the listed meat source. Шашлык can be pork, lamb, beef or chicken; гуляш can be made from different meats; жульен is often mushroom/chicken but not inherently poultry; пожарская is both a cutlet and usually poultry-based.
  - items: Шашлык, Гуляш, Жульен, Пожарская
  - groups: Из говядины | Из свинины | Из птицы | Котлеты
  - fix: Replace with items whose defining association is unambiguous for the intended group.

- **ru-0145** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The group «Твёрдые» does not fit most of its items: масло, творог and сметана are not hard dairy products. «Брынза» is a cheese, but not enough to make the category valid.
  - items: Масло, Творог, Сметана, Брынза
  - groups: Твёрдые
  - fix: Replace the category with actual hard cheeses or rename/rebuild the group.

- **ru-0145** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Кисломолочные» overlaps strongly with «Традиционные восточные»: айран, катык, варенец and мацони are also fermented dairy products. «Снежок» is also a drink, overlapping with «Напитки».
  - items: Снежок, Айран, Катык, Варенец, Мацони
  - groups: Кисломолочные | Напитки | Традиционные восточные
  - fix: Use one axis only: product type, consistency, or regional origin.

- **ru-0147** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «На основе эспрессо» overlaps with «С молоком»: cappuccino, latte, flat white and cortado are also espresso-based. The labels are not mutually exclusive.
  - items: Капучино, Латте, Флэт уайт, Кортадо
  - groups: На основе эспрессо | С молоком
  - fix: Rename the first group to «Без молока на основе эспрессо» or use a different non-overlapping category.

- **ru-0151** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Виды шашлыка» contains items that are not types of shashlik. Цыплёнок табака is a fried pressed chicken dish, and тикка is South Asian rather than Caucasian in a Russian-language food context.
  - items: Цыплёнок табака, Тикка
  - groups: Виды шашлыка
  - fix: Replace with recognized kebab/shashlik variants, or rename/rebuild the group.

- **ru-0152** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - This is not easy-tier vocabulary. «Брюнуаз», «шифонад», «пассеровать», «деглазировать» and «эмульгировать» are culinary-school terms rather than everyday kitchen words.
  - items: Брюнуаз, Шифонад, Пассеровать, Деглазировать, Эмульгировать
  - groups: Нарезка | Техники с соусами
  - fix: For easy tier, use common actions such as «резать», «шинковать», «мешать», «взбивать», «солить».

- **ru-0155** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The spice categories are subjective and overlapping: «сладкие», «ароматные», «пряные» and «жгучие» are flavor descriptors, not mutually exclusive taxonomy. Cardamom, clove, anise, fennel and others can reasonably be described as aromatic or sweet-spice.
  - items: Кардамон, Гвоздика, Анис, Фенхель, Корица
  - groups: Сладкие пряности | Ароматные | Пряные травы
  - fix: Use concrete botanical/form categories, e.g. seeds, roots, bark, peppers, or cuisine-origin groups.

- **ru-0156** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The nut taxonomy is inconsistent and overlapping. Кешью, миндаль, макадамия, пекан and бразильский орех are all commonly called nuts but not all botanical nuts; «псевдоорехи» is unclear and overlaps common usage.
  - items: Миндаль, Кешью, Макадамия, Пекан, Бразильский, Арахис, Каштан, Кедровый, Мускатный
  - groups: Классические | Экзотические | Псевдоорехи
  - fix: Use common-market categories rather than botanical pseudo-categories, or make the taxonomy scientifically precise.

- **ru-0157** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Злаки», «Крупы» and «Переработанные крупы» overlap because rice, corn and millet are cereals, while pearl barley, bulgur and couscous are processed products of cereals already represented by the first group.
  - items: Рис, Кукуруза, Просо, Перловка, Булгур, Кускус
  - groups: Злаки | Крупы | Переработанные крупы
  - fix: Use categories on one axis only, such as plants vs processed products, and avoid mixing them in the same puzzle.

- **ru-0158** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Квас» is usually non-alcoholic or very low-alcohol and does not fit a category titled «Алкоголь по стране» alongside spirits and beer-like drinks.
  - items: Квас
  - groups: Россия
  - fix: Replace with a clearly alcoholic Russian drink or retitle the puzzle to include low-alcohol/traditional drinks.

- **ru-0161** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Boris Godunov was not a Rurikid, though he ruled between Rurikid and Romanov dynasties. Placing him in «Рюриковичи» is factually wrong.
  - items: Борис Годунов
  - groups: Рюриковичи
  - fix: Rename the group to «Конец XVI - начало XVII века» or replace Boris Godunov with a Rurikid ruler.

- **ru-0164** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - «Городецкая» appears as painting and «Городецкая резьба» as woodwork; both share the same locality/tradition term and can confuse a grouping puzzle by near-duplicate surface form.
  - items: Городецкая, Городецкая резьба
  - groups: Росписи | Деревянные
  - fix: Avoid repeating the same tradition root across groups; replace one item.

- **ru-0168** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several films in «Драмы» are primarily comedies or romantic comedies. «Берегись автомобиля», «Ирония судьбы» and «Служебный роман» especially conflict with the existing «Комедии» group.
  - items: Берегись автомобиля, Ирония судьбы, Служебный роман
  - groups: Драмы | Комедии
  - fix: Rename the group to «Лирические комедии» or replace with clear dramas.

- **ru-0171** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Естественные науки» and «Точные науки» overlap conceptually: physics, chemistry and astronomy are often considered exact sciences as well as natural sciences. The labels are not mutually exclusive.
  - items: Физика, Химия, Астрономия
  - groups: Естественные науки | Точные науки
  - fix: Use a single taxonomy, e.g. natural/formal/social/humanities, with «Формальные науки» instead of «Точные науки».

- **ru-0175** (easy) — `CULTURAL_MISFIT` [high] → verdict: `needs-claude-review`
  - «Transpiration» is in English while the rest of the Russian puzzle uses Russian terminology. This is conspicuous and confusing at easy tier.
  - items: Transpiration
  - groups: Ботаника
  - fix: Use «Транспирация».

- **ru-0179** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Мировые чудовища» is an umbrella category that can include Greek, Slavic and Scandinavian beings. It is not mutually exclusive with the other mythology-origin groups.
  - items: Дракон, Феникс, Единорог, Грифон
  - groups: Греческие существа | Славянские существа | Мировые чудовища | Скандинавские
  - fix: Use four origin-based groups or four creature-type groups, not both.

- **ru-0187** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Казуары are primarily associated with New Guinea and northeastern Australia, but can be acceptable; the bigger issue is «Проехидна» and «Длинноносая ехидна» are not standard Australian fauna in the way the title implies, as long-beaked echidnas are New Guinean.
  - items: Проехидна, Длинноносая ехидна
  - groups: Однопроходные
  - fix: Replace with Australia-specific animals or retitle to include Oceania.

- **ru-0203** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The categories mix nationality, genre and decade. Led Zeppelin, Deep Purple and Black Sabbath are British and also hard-rock classics; Nirvana and Foo Fighters are American and also 90s alternative-related. Items can reasonably belong to multiple listed categories.
  - items: Led Zeppelin, Deep Purple, Black Sabbath, Nirvana, Foo Fighters
  - groups: Британские | Американские | Хард-рок классика | Альтернатива 90-х
  - fix: Use four nationality groups or four genre/era groups, not both.

- **ru-0208** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Локи's classification as an Aesir is complicated but often acceptable by association; the bigger issue is that Ёрмунганд, Фенрир and Хель are not simply «Великаны». They are Loki's monstrous children, with only partial giant lineage.
  - items: Ёрмунганд, Фенрир, Хель
  - groups: Великаны
  - fix: Rename the group to «Дети Локи» or replace with clear giants such as «Сурт», «Трюм», «Скади».

- **ru-0213** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «На улице» and «Советские игры» are not mutually exclusive concepts. «Классики», «Резинки» and «Штандер» are also outdoor children's games, so the solver cannot rely on one clear categorization principle.
  - items: Классики, Резинки, Штандер
  - groups: На улице | Советские игры
  - fix: Make all four categories use the same axis, for example by replacing «Советские игры» with another setting/mechanics category.

- **ru-0216** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Клещ» is not an insect; ticks are arachnids. This is especially problematic in a puzzle titled «Насекомые».
  - items: Клещ
  - groups: Вредители
  - fix: Replace with an insect pest such as «Комар», «Клоп» or «Таракан».

- **ru-0216** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - The puzzle uses «Пчела» under pollinators and «Пчела рабочая» under social insects. These are not cleanly distinct identities; a worker bee is also a bee and a pollinator.
  - items: Пчела, Пчела рабочая
  - groups: Опылители | Общественные
  - fix: Avoid caste/species duplication; replace «Пчела рабочая» with another social insect or replace «Пчела» with a different pollinator.

- **ru-0218** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «К2» is in the Karakoram, not the Himalayas in the narrower common geographic sense. The «Америка» group also contains «Килиманджаро» in Africa and «Монблан» in Europe.
  - items: К2, Килиманджаро, Монблан
  - groups: Гималаи | Америка
  - fix: Use accurate regional groups: move K2 to «Каракорум» or rename the group, and replace «Килиманджаро»/«Монблан» with American peaks such as «Аконкагуа», «Денали», «Уаскаран», «Логан».

- **ru-0224** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - «Верхнее», «Мичиган», «Гурон» and «Эри» are also part of the Great Lakes system, while the category is only «Северная Америка». This broad geographic label can include many lakes from other groups too.
  - items: Верхнее, Мичиган, Гурон, Эри
  - groups: Северная Америка
  - fix: Rename the group to «Великие озёра».

- **ru-0224** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Каспий» is usually treated as the Caspian Sea, not a lake in everyday Russian naming; it also is not solely Russian. «Женевское», «Комо» and «Люцерн» are not normally classified as mountain lakes in the same clear way as «Титикака».
  - items: Каспий, Женевское, Комо, Люцерн
  - groups: Россия | Горные озёра
  - fix: Use unambiguous lakes and labels, such as «Великие озёра», «Африканские озёра», «Российские озёра», «Альпийские озёра» with accurate members.

- **ru-0228** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Особые жанры» is a vague catch-all and overlaps with the other literary form labels. «Эпопея» can be prose, while «Баллада» can be poetic or narrative and may not be exclusive to «Поэзия» in everyday classification.
  - items: Эпопея, Баллада
  - groups: Проза | Поэзия | Особые жанры
  - fix: Replace «Особые жанры» with a single clear category, such as «Документальная проза», and use items that fit only that label.

- **ru-0235** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The labels mix coat length, unusual appearance, and wild ancestry/appearance. A breed can easily be both short-haired and «unusual» or have wild traits, so the category axes overlap.
  - items: Бенгальская, Саванна, Оцикет, Чаузи, Сфинкс, Корниш-рекс
  - groups: Короткошёрстные | Необычные | Дикие черты
  - fix: Use one categorization axis, such as coat type only or origin/registry group only.

- **ru-0239** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Кёрлинг» is not a water sport and does not use a ball. «Пляжный волейбол» and «Пляжный футбол» are team ball games, so they overlap with «Командные игры» rather than forming a clean «Водные виды» group.
  - items: Кёрлинг, Пляжный волейбол, Пляжный футбол
  - groups: Командные игры | Водные виды
  - fix: Replace the last group with true water ball sports, or rename it to a coherent non-overlapping category.

- **ru-0243** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The East Asian five elements include five items; this group lists only four and omits «Земля», so it is not a valid four-item category without a clarifying label.
  - items: Металл, Дерево, Вода, Огонь
  - groups: Стихии Востока
  - fix: Change the group to a different four-item category, or include «Земля» and redesign the puzzle size/category.

- **ru-0251** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Саванна» is placed under «Лесные зоны», but savanna is not a forest zone in the ordinary school-geography classification. «Субарктика» is a broad climatic/geographic region, not a natural zone parallel to tundra or forest-tundra.
  - items: Саванна, Субарктика
  - groups: Лесные зоны | Полярные зоны
  - fix: Move «Саванна» to a dry/grassland category or replace it with «Широколиственный лес»; replace «Субарктика» with a true zone term.

- **ru-0255** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several painting placements are inaccurate or unclear: «Герника» is generally Picasso/Cubism-associated rather than Surrealism, and «Танец в Мулен»/«Бал в ля Мулен» appear to be malformed or duplicate references to Moulin/Moulin de la Galette titles.
  - items: Герника, Танец в Мулен, Бал в ля Мулен
  - groups: Импрессионизм | Сюрреализм
  - fix: Use canonical Russian titles and verify movement attribution; replace «Герника» with a clear surrealist work such as «Сын человеческий».

- **ru-0259** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The bird categories use overlapping traits: waterfowl can be wintering or migratory, and birds of prey can also be resident or migratory. «Цапля» and «Выпь» are wading birds rather than waterfowl in the narrow everyday sense.
  - items: Утка, Лебедь, Цапля, Выпь, Орёл, Беркут, Сапсан, Скопа
  - groups: Зимующие | Перелётные | Водоплавающие | Хищные
  - fix: Use one axis only, such as habitat groups or migration-status groups, and choose unambiguous examples.

- **ru-0267** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Драматический театр», «Музыкальный театр», «Кукольный театр» and «Народный театр» mix venue/form/tradition axes. «Вертеп» is also puppet theater, and «Теневой театр» is a form rather than a puppet type.
  - items: Вертеп, Теневой театр
  - groups: Музыкальный театр | Кукольный театр | Народный театр
  - fix: Use four parallel categories such as dramatic genres, musical-theater genres, puppet types, and folk forms in separate puzzles, or redesign with one axis.

- **ru-0276** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Дорогие ткани» overlaps with «Натуральные»: cashmere, angora, mohair and alpaca are natural animal fibers. The categories are based on different axes and are not mutually exclusive.
  - items: Кашемир, Ангора, Мохер, Альпака
  - groups: Натуральные | Дорогие ткани
  - fix: Rename to «Животные волокна» and adjust the natural group, or use only origin-based categories.

- **ru-0277** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Стерлядь», «Осётр» and «Бёлуга» are sturgeons, not catfish. The group label «Сомовые» is factually wrong for three of the four items.
  - items: Стерлядь, Осётр, Бёлуга
  - groups: Сомовые
  - fix: Create a proper «Осетровые» group or replace the sturgeon items with actual catfish-family items.

- **ru-0288** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - The puzzle repeats bee identity across groups: «Пчела медоносная» and «Пчела» are not cleanly distinct for a grouping puzzle, and both are useful as pollinators and raw-material producers.
  - items: Пчела медоносная, Пчела
  - groups: Опылители садов | Сырьё
  - fix: Avoid using generic «Пчела» if a bee species already appears; use another distinct raw-material insect if accurate.

- **ru-0289** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The puzzle is titled «Ядовитые растения», but one full category is «Ядовитые грибы». Fungi are not plants.
  - items: Бледная поганка, Мухомор, Ложный опёнок, Галерина
  - groups: Ядовитые грибы
  - fix: Change the title to «Ядовитые растения и грибы» or replace the mushroom category with poisonous plants.

- **ru-0296** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The same planet names appear across multiple groups: Mars, Jupiter, Venus and Saturn occur as gods/planets, characteristics and symbols. The categories are about different representations, but the repeated identities make item membership ambiguous for a word puzzle.
  - items: Марс, Юпитер, Венера, Сатурн, Кольца Сатурна, Пятно Юпитера, Каньоны Марса, Облака Венеры, ♂ Марс, ♀ Венера, ♃ Юпитер, ♄ Сатурн
  - groups: Боги — планеты | Характеристики планет | Символы планет
  - fix: Avoid repeating the same base planet names in several categories; use one planet-related category and three unrelated categories, or make all items distinct without embedded duplicate names.

- **ru-0298** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Благородные грибы» and «Ценные виды» are subjective value labels and overlap conceptually. «Сморчок», «Строчок» and «Дождевик» can also be grouped by morphology/edibility rather than value, so the category is not clean.
  - items: Трюфель, Сморчок, Строчок, Дождевик
  - groups: Благородные грибы | Ценные виды
  - fix: Use objective categories such as «Трубчатые», «Пластинчатые», «Сумчатые», «Ядовитые».

- **ru-0299** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Рамануджан» died in 1920 and is not a XX–XXI century mathematician in the usual sense of modern 20th/21st grouping; he mainly belongs to late XIX/early XX.
  - items: Рамануджан
  - groups: XX–XXI вв.
  - fix: Replace «Рамануджан» with a clearer 20th/21st-century mathematician such as «Гёдель», «Гротендик» or «Вайлс».

- **ru-0302** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Зебровая» is not a filter-feeding shark. «Молот-акула», «Голубая акула» and «Мако» are not small species in an ordinary sense; mako and hammerhead can be large active predators.
  - items: Зебровая, Молот-акула, Голубая акула, Мако
  - groups: Фильтраторы | Небольшие виды
  - fix: Use true filter feeders only, and replace the small-species group with genuinely small sharks such as «Катран» or «Кошачья акула».

- **ru-0302** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - «Гоблин-акула» and «Акула-домовой» are two Russian names for the same shark, creating a duplicate item in one group.
  - items: Гоблин-акула, Акула-домовой
  - groups: Глубоководные
  - fix: Keep one name and replace the other with a different deep-sea shark.

- **ru-0304** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - «Ехидна» and «Обыкновенная ехидна» are not cleanly distinct for an easy grouping puzzle; one is the generic name and the other is a species within it.
  - items: Ехидна, Обыкновенная ехидна
  - groups: Однопроходные
  - fix: Use one echidna item and replace the duplicate with another monotreme only if the distinction is intended and clear.

- **ru-0307** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The title «Романтические жанры» does not match the content: most groups are broad fiction genres unrelated to romance. «Поджанры романа» also overlaps with «Исторический роман» and potentially genre labels like detective/fantasy when used in novels.
  - items: Исторический роман, Приключения, Семейная сага
  - groups: Поджанры романа | Ужасы | Детектив | Фантастика
  - fix: Retitle to «Литературные жанры» or make all categories romance-related subgenres.

- **ru-0310** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Бобовые злаки» is factually wrong: lentil, chickpea, mung bean and soy are legumes, not cereals/grains in the botanical sense. The title says food products - cereals.
  - items: Чечевица, Нут, Маш, Соя
  - groups: Бобовые злаки
  - fix: Rename the group to «Бобовые» and change the puzzle title, or replace with actual cereal grains.

- **ru-0312** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - «ЦСКА» appears as both a football team and a hockey team identity, with only the hockey item disambiguated as «ЦСКА хоккей». «Динамо» is also ambiguous across multiple sports and cities.
  - items: ЦСКА, ЦСКА хоккей, Динамо
  - groups: Российский футбол | Хоккей
  - fix: Use fully disambiguated club names for every sports team, e.g. «ЦСКА Москва (футбол)» and «Динамо Москва (хоккей)», or avoid repeated club brands.

- **ru-0315** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - This puzzle is far too specialized for easy tier. Items such as «Хримтурс», «Бергрисир», «Нидавеллир», «Нидхёгг», «Хульдры» and «Дис» require niche Norse mythology knowledge.
  - items: Хримтурс, Бергрисир, Нидавеллир, Нидхёгг, Хульдры, Дис
  - groups: Великаны | Дварфы и альвы | Чудовища | Духи
  - fix: Raise the difficulty substantially or use only widely known figures like «Один», «Тор», «Локи», «Фрейя».

- **ru-0319** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Категории смешивают технику, географическое происхождение, зону тела и эффект. Один и тот же массаж может быть восточным, расслабляющим и/или для лица/головы, поэтому группы не являются взаимоисключающими.
  - groups: Восточные | Лицо и голова | Расслабляющие | Классические
  - fix: Перестроить все группы по одному принципу: только техники, только регионы происхождения или только зоны применения.

- **ru-0321** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Социальные эмоции пересекаются с положительными и отрицательными: гордость может быть положительной, стыд/смущение/зависть отрицательными или сложными. 'Сложные' также не отделено от валентности.
  - groups: Положительные | Отрицательные | Сложные | Социальные
  - fix: Использовать один принцип классификации, например базовые эмоции, социальные эмоции, телесные состояния и настроения, без пересечения по положительности/отрицательности.

- **ru-0321** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Эйфория обычно относится к положительным состояниям, тоска — к отрицательным, гордость — к положительным/социальным, зависть — к отрицательным/социальным. Эти элементы имеют разумные альтернативные группы.
  - items: Эйфория, Тоска, Гордость, Зависть, Стыд, Смущение
  - groups: Положительные | Отрицательные | Сложные | Социальные
  - fix: Заменить спорные элементы или переименовать группы так, чтобы принадлежность задавалась одним явным критерием.

- **ru-0329** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - 'Небесные явления' слишком широкая категория и может включать затмения, звёздные события и часть остальных астрономических объектов/явлений.
  - groups: Затмения | Небесные явления | Звёздные события | Галактики
  - fix: Заменить общий ярлык на более узкий, например 'Наблюдаемые с Земли явления' с однозначными элементами.

- **ru-0329** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Пульсар, квазар и нейтронная звезда — это астрономические объекты, а не события. Чёрная дыра не является галактикой.
  - items: Пульсар, Квазар, Нейтронная звезда, Чёрная дыра
  - groups: Звёздные события | Галактики
  - fix: Для событий использовать вспышка сверхновой, гамма-всплеск, транзит, соединение; для галактик заменить чёрную дыру на конкретную галактику.

- **ru-0333** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Многие русские писатели XIX века работали в нескольких жанрах: Пушкин и Лермонтов писали прозу и драму, Гоголь известен как прозаик и драматург, Чернышевский был и критиком, и прозаиком. Жанровые группы не дают уникальной принадлежности.
  - items: Пушкин, Лермонтов, Гоголь, Чернышевский
  - groups: Поэты | Прозаики | Драматурги | Критики
  - fix: Либо использовать произведения вместо авторов, либо сделать категории по более однозначным ролям/периодам.

- **ru-0335** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Пазл сильно сложнее easy: используются специальные океанографические аббревиатуры и сокращения, которые большинство русскоязычных игроков не распознает.
  - items: Термохалин. цирк., NADW, AABW, Антарктическое донное
  - groups: Глубинные течения
  - fix: Для easy заменить на общеизвестные течения и полностью русские названия без аббревиатур.

- **ru-0335** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - AABW означает Antarctic Bottom Water, то есть фактически дублирует 'Антарктическое донное'.
  - items: AABW, Антарктическое донное
  - groups: Глубинные течения
  - fix: Оставить только один вариант и заменить второй другим глубинным течением.

- **ru-0338** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Россия географически находится в Европе и Азии, поэтому группа 'Россия' пересекается с группами 'Азия' и 'Европа'. Кавказ, Урал и Алтай также не дают чистого разделения по материкам.
  - items: Кавказ, Урал, Алтай
  - groups: Азия | Европа | Россия
  - fix: Разделить по материкам без отдельной России или сделать все группы региональными: Кавказ, Сибирь, Европа, Центральная Азия.

- **ru-0340** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - 'Перро' и 'Шарль Перро' — один и тот же автор.
  - items: Перро, Шарль Перро
  - groups: Зарубежные
  - fix: Заменить один из элементов на другого зарубежного сказочника, например Гауфа.

- **ru-0340** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Илиада, Махабхарата, Калевала и Нибелунги — эпические произведения/циклы, а не русские сказители. Группа не соответствует теме пазла.
  - items: Илиада, Махабхарата, Калевала, Нибелунги
  - groups: Эпические традиции
  - fix: Заменить на русских былинных сказителей или переименовать весь пазл в более широкую тему.

- **ru-0342** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Аридный и семиаридный фактически синонимичны/пересекаются с пустынным и полупустынным, а 'полусухой' в тропической группе пересекается с засушливыми климатами.
  - items: Полусухой, Пустынный, Полупустынный, Аридный, Семиаридный
  - groups: Тропический | Засушливый
  - fix: Не смешивать климатические пояса и степень увлажнения; выбрать одну классификацию.

- **ru-0344** (easy) — `OBSCURE` [high] → verdict: `needs-claude-review`
  - Эффект Пандема и часть названий оптических иллюзий слишком специализированны для easy; к тому же 'невозм. треугольник' использует неестественное сокращение.
  - items: Эффект Пандема, Невозм. треугольник, Лестница Шрёдера
  - groups: Восприятие | Оптические иллюзии
  - fix: Заменить на более известные иллюзии: утка-кролик, ваза Рубина, треугольник Пенроуза, иллюзия Эббингауза.

- **ru-0345** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Тема 'Ткацкие изделия' не покрывает вышивку, вязание и народные промыслы. Категории смешивают изделия, техники и декоративные промыслы.
  - groups: Ткачество | Вышивка | Вязание | Народные промыслы
  - fix: Переименовать тему в 'Рукоделие и промыслы' или оставить только тканые изделия.

- **ru-0349** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Фёдор и Афанасий имеют греческое происхождение, поэтому могут относиться и к 'Греческого происхождения', и к 'Старинные редкие'.
  - items: Фёдор, Афанасий
  - groups: Греческого происхождения | Старинные редкие
  - fix: Не смешивать происхождение имени с частотностью/старинностью; сделать все группы по происхождению или все по полу/употреблению.

- **ru-0353** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - 'Ёжик в тумане' — рисованный мультфильм, не кукольный. 'Маша и медведь' в современном узнаваемом смысле не советский мультфильм.
  - items: Ёжик в тумане, Маша и медведь
  - groups: Кукольные
  - fix: Заменить на однозначные советские кукольные мультфильмы.

- **ru-0353** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Чебурашка является персонажем из 'Крокодила Гены', Дядя Фёдор — из 'Простоквашино', Волк — из 'Ну, погоди!'. Элементы группы 'Персонажи' напрямую пересекаются с названиями мультфильмов в другой группе.
  - items: Чебурашка, Дядя Фёдор, Волк из Ну, погоди!
  - groups: Классика Союзмульт. | Персонажи
  - fix: Не смешивать названия мультфильмов и персонажей из тех же мультфильмов в одном пазле.

- **ru-0355** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Псёл относится к бассейну Днепра, а Хопёр — приток Дона; для easy они выглядят как спорные/неочевидные представители 'Бассейна Чёрного моря' рядом с главными реками.
  - items: Псёл, Хопёр
  - groups: Бассейн Чёрного моря
  - fix: Использовать главные реки бассейнов без спорных притоков: Днепр, Днестр, Кубань, Дон.

- **ru-0357** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - 'Западные тюрки' и 'Тюрки России' пересекаются с географическими и этнокультурными классификациями, а 'Туркоманы' легко смешиваются с туркменами из Центральной Азии. Группа 'Культура' вообще не является народами.
  - items: Туркоманы, Юрта, Кумыс, Курай, Курган
  - groups: Центральная Азия | Тюрки России | Западные тюрки | Культура
  - fix: Сделать тему 'Тюркские народы и культура' или заменить культурные элементы на четвертую группу народов.

- **ru-0361** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Скорпион — паукообразное, а не насекомое.
  - items: Скорпион
  - groups: Ядовитые насекомые
  - fix: Переименовать группу в 'Ядовитые членистоногие' или заменить скорпиона на шершня.

- **ru-0365** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Тема 'Российские реки — рыбалка' смешивает реки, озёра и виды рыб. Кроме того, 'таёжные реки' пересекаются с 'великими реками' по природной зоне и рыболовной тематике.
  - groups: Великие реки | Рыболовные озёра | Таёжные реки | Популярная рыба
  - fix: Сделать отдельный пазл про реки или отдельный пазл про рыбалку.

- **ru-0376** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Категории страхования пересекаются: туристическое страхование часто включает медицинское и несчастные случаи; страхование от несчастного случая относится к личному страхованию, как и жизнь; ответственность и грузы могут быть имущественными/бизнес-страхованием.
  - items: Туристическое, От несчастного случая, Ответственность, Грузы
  - groups: Страхование жизни | Имущественное | Медицинское | Бизнес
  - fix: Сделать категории по одному юридическому принципу: личное, имущественное, ответственность, финансовые риски.

- **ru-0377** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Виктория находится в Африке, но помещена в Северную Америку как 'Виктории'. Также в Африке есть 'Виктория', что создаёт прямое противоречие/дубль.
  - items: Виктории, Виктория
  - groups: Северная Америка | Африка
  - fix: Заменить североамериканский элемент на Йеллоустонский, Хавасу или другой водопад Северной Америки.

- **ru-0384** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Лезгинка — кавказский танец, не специфически казачья традиция. Лук не является типичным казачьим вооружением в одном ряду с шашкой, нагайкой и пикой.
  - items: Лезгинка, Лук
  - groups: Традиции | Вооружение
  - fix: Заменить на однозначно казачьи элементы, например 'казачий круг', 'папаха', 'бурка', 'караул'.

- **ru-0394** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Жанры кино сильно пересекаются: триллер, хоррор, фантастика, фэнтези, исторический и биографический могут сочетаться с драмой/боевиком. Категории не являются взаимоисключающими.
  - items: Триллер, Хоррор, Исторический, Биографический, Фэнтези
  - groups: Экшн и боевик | Драма | Фантастика
  - fix: Для easy лучше использовать четыре ясно различимые группы или вынести поджанры в отдельные пазлы.

- **ru-0401** (easy) — `OTHER` [high] → verdict: `needs-claude-review`
  - Название 'Виды налоговых систем' не соответствует содержанию: группы про бюджеты, расходы, долг и фискальную политику, а не налоговые системы. Для easy это не единая понятная тема.
  - groups: Типы бюджетов | Фискальная политика | Расходы бюджета | Долг и дефицит
  - fix: Переименовать в 'Государственные финансы' или собрать настоящий пазл про налоги.

- **ru-0403** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Альф Ромео — не автопромышленник; бренд Alfa Romeo назван по аббревиатуре A.L.F.A. и фамилии Никола Ромео. 'Волождин' выглядит как ошибочная фамилия; известный предприниматель — Аркадий Волож.
  - items: Альф Ромео, Волождин
  - groups: Автопромышленники | Российские
  - fix: Заменить на 'Никола Ромео' и 'Волож' или другого российского предпринимателя.

- **ru-0404** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Лавина не является огненной природной силой, а метеорный удар также не огненное явление в одном ряду с пожарами.
  - items: Лавина, Метеорный удар
  - groups: Огненные
  - fix: Заменить на 'извержение', 'пирокластический поток' или 'сухая гроза'.

- **ru-0407** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Полёт, назад, оборот и штоппер не являются стандартными 'видами прыжков' в плавании/прыжках в воду в таком виде. Триатлон не является видом в воде, а многоборьем с плавательным этапом.
  - items: Полёт, Назад, Оборот, Штоппер, Триатлон
  - groups: Виды прыжков | Виды в воде
  - fix: Заменить на стандартные категории прыжков в воду или убрать группу.

- **ru-0409** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Финляндия обычно не входит в страны Балтии в русской школьной/повседневной классификации, а Хельсинки соответственно не столица страны Балтии. Мидсоммер — скорее скандинавский праздник, не балтийский маркер.
  - items: Финляндия, Хельсинки, Мидсоммер
  - groups: Страны Балтии | Столицы | Культура
  - fix: Заменить Финляндию/Хельсинки на корректные элементы или сделать тему 'Балтийский регион'.

- **ru-0410** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Ланцетник — не рыба; это хордовое животное. Морская игуана — современный специализированный вид, но не типичный 'живой ископаемый' в одном ряду с гаттерией, крокодилом и черепахой.
  - items: Ланцетник, Морская игуана
  - groups: Древние рыбы | Древние рептилии
  - fix: Заменить ланцетника на двоякодышащую рыбу, а морскую игуану на более общепринятый пример.

- **ru-0413** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Шапка-невидимка и плащ-невидимка выполняют одну функцию и могут восприниматься как одна категория волшебных предметов; Философский камень встречается и в западной алхимической традиции, и в фэнтези. Экскалибур также мифологический/легендарный предмет.
  - items: Шапка-невидимка, Плащ-невидимка, Философский камень, Меч Экскалибур
  - groups: Русские сказки | Западные сказки | Фэнтези | Мифологические
  - fix: Не смешивать происхождение, жанр и функцию; сделать категории по традициям с однозначными источниками.

- **ru-0420** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Свадебная фотография может быть портретной, репортажной и коммерческой; архитектурная может быть документальной или коммерческой; макро и астрофото не обязательно 'природа'. Категории смешивают жанр, объект и назначение.
  - items: Свадебная, Архитектурная, Макро, Астрофото
  - groups: Портретная | Природа | Документальная | Коммерческая
  - fix: Разделить по одному признаку: объект съёмки, назначение или техника.

- **ru-0422** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Тот, Маат и Атум не являются богами подземного мира в том же смысле, что Анубис; Гор не является прежде всего богом войны. Группы выглядят фактически неточными.
  - items: Тот, Маат, Атум, Гор
  - groups: Подземный мир | Боги войны
  - fix: Для подземного мира использовать Осирис, Анубис, Дуат, Аммит; для войны — Сехмет, Монту, Нейт, Сет.

- **ru-0423** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Биатлон не является видом лёгкой атлетики и не относится к легкоатлетическому многоборью.
  - items: Биатлон
  - groups: Многоборье
  - fix: Заменить на корректное легкоатлетическое многоборье.

- **ru-0426** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Грузия и Украина не являются действующими государствами-участниками СНГ, а Абхазия не является общепризнанным государством и не член СНГ. Группа 'Страны СНГ' фактически неверна.
  - items: Грузия, Абхазия, Украина
  - groups: Кавказ | Славянские
  - fix: Использовать только действующих членов СНГ или переименовать в 'Постсоветские страны' и убрать Абхазию.

- **ru-0429** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The title says countries of Oceania, but several entries are not countries: Hawaii, Tahiti, and Guam are territories/regions rather than sovereign countries. This makes the puzzle premise misleading for an easy geography puzzle.
  - items: Гавайи, Таити, Гуам
  - groups: Полинезия | Микронезия
  - fix: Retitle away from “countries” or replace these with sovereign states/clear island groups.

- **ru-0431** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Many wind names are specialist geography terms rather than easy everyday vocabulary, especially “Низовка”, “Сарма”, “Бакланий ветер”, “Горний”, “Трамонтана”, “Харматтан”, “Катабатический”, and “Анабатический”.
  - items: Низовка, Сарма, Бакланий ветер, Горний, Трамонтана, Харматтан, Катабатический, Анабатический
  - fix: Move to a harder tier or replace with common wind/weather terms.

- **ru-0431** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - The category axes overlap: some winds are defined by geography while others by physical mechanism or climate zone. “Бора” is also a katabatic wind, and “бриз” is not specifically a mountain wind.
  - items: Бора, Бриз
  - groups: Средиземноморье | Горные
  - fix: Use one organizing principle only, such as regional named winds or mechanism-based wind types.

- **ru-0434** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - “Водные элементы” is a subset of “Элементы сада”, so the category labels overlap conceptually.
  - items: Пруд, Ручей, Фонтан, Водопад
  - groups: Водные элементы | Элементы сада
  - fix: Rename/split so the non-water elements category is clearly distinct, or replace the water category with another garden-type category.

- **ru-0439** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The star categories mix overlapping taxonomies. “G-звёзды” and “Жёлтый карлик” can describe the same kind of star, and known stars such as the Sun, Sirius, and Betelgeuse also have spectral/size classes.
  - items: G-звёзды (жёлтые), Жёлтый карлик, Солнце, Сириус, Бетельгейзе
  - groups: Спектральные классы | По размеру | Известные звёзды
  - fix: Avoid mixing taxonomy labels with individual examples, or make all groups parallel.

- **ru-0439** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - “Переменная” and “Новая звезда” are not types of multiple-star systems; they describe variability/outburst phenomena.
  - items: Переменная, Новая звезда
  - groups: Кратные системы
  - fix: Replace with clean multiple-system terms such as “кратная”, “визуально-двойная”, or retitle the group.

- **ru-0442** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Leonardo DiCaprio and Denzel Washington are also action stars in common usage, while Jackie Chan, Schwarzenegger, Stallone, and Van Damme are Hollywood actors. The labels overlap heavily.
  - items: Леонардо Ди Каприо, Дензел Вашингтон, Шварценеггер, Сталлоне, Ван Дамм, Джеки Чан
  - groups: Актёры Голливуда | Звёзды экшн
  - fix: Use mutually exclusive labels such as actors by country/era, or make all groups genre-based.

- **ru-0442** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Гайдай is primarily famous as a film director, not as a Soviet actor category member alongside Nikulin, Smoktunovsky, and Mironov.
  - items: Гайдай
  - groups: Советские актёры
  - fix: Replace with a clearly Soviet actor.

- **ru-0444** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - “Известные”, “Редкие”, and “С сильным запахом” are subjective/descriptive buckets that can overlap with citrus or with one another, rather than mutually exclusive fruit types.
  - items: Манго, Папайя, Ананас, Банан, Рамбутан, Лонган, Карамбола, Питайя, Дуриан, Джекфрут, Нони
  - groups: Известные | Редкие | С сильным запахом
  - fix: Use objective categories, e.g. citrus, palm fruits, berries/botanical types, Southeast Asian fruits.

- **ru-0446** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The labels overlap: “Вышибалы” is both a team game and a running/chasing game; “Прятки в воде” overlaps directly with “Прятки”; many Russian folk games are also outdoor/running games.
  - items: Вышибалы, Прятки в воде, Прятки, Салки, Горелки, Жмурки
  - groups: Командные | Русские народные | Водные | Беговые
  - fix: Use mutually exclusive settings/equipment or replace overlapping games.

- **ru-0448** (easy) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - “Вавилов” appears twice, once as a physicist surname and once as “Вавилов Ник.” for the biologist. In a surname-only puzzle this creates avoidable ambiguity between Sergei and Nikolai Vavilov.
  - items: Вавилов, Вавилов Ник.
  - groups: Физики | Биологи
  - fix: Use full names or replace one Vavilov.

- **ru-0450** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Some listed “records” are not current or are too vague. Michael Johnson no longer holds the men’s 200 m world record, and “Сифан Хасан 5000 м” is not the current 5000 m world record holder.
  - items: Майкл Джонсон 200 м, Сифан Хасан 5000 м
  - groups: Лёгкая атлетика
  - fix: Use stable categories or verify current record holders before publishing.

- **ru-0450** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - The puzzle relies on detailed sports-record knowledge and specific record holders, which is not easy-tier concrete everyday knowledge.
  - groups: Лёгкая атлетика | Плавание | Сила | Зимний спорт
  - fix: Move to a harder tier or use simple sport categories without record specifics.

- **ru-0452** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - “Регионарная” overlaps with “Местная анестезия” in common medical taxonomy; проводниковая/плексусная/эпидуральная are related regional techniques. This is too nested for a clean grouping puzzle.
  - items: Проводниковая, Эпидуральная, Спинальная, Плексусная
  - groups: Местная анестезия | Регионарная
  - fix: Use broader non-overlapping categories such as methods, routes, drugs, and monitoring terms.

- **ru-0453** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several items do not match their labels: “Хохлома” and “Гжель” are Russian decorative styles rather than textile ethnic patterns; “Медальон” and “Дамаск” are not specifically floral patterns.
  - items: Хохлома, Гжель, Медальон, Дамаск
  - groups: Этнические | Цветочные
  - fix: Replace with clear textile pattern names that match each label.

- **ru-0454** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Мадагаскар and Сахалин are single islands, not archipelagos. Маврикий is usually a single island/country, not a world archipelago item in this context.
  - items: Мадагаскар, Сахалин, Маврикий
  - groups: Индийский океан | Российские
  - fix: Replace with actual archipelagos.

- **ru-0456** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Black is not normally one of the primary colors in painting; standard painterly primary colors are red, yellow, and blue. The group needs a fourth item from another clear concept or should be renamed.
  - items: Чёрный
  - groups: Основные цвета
  - fix: Replace black or retitle as a different color set.

- **ru-0458** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The song categories overlap by era, authorship, and theme. “День Победы” is a Soviet-era war song but also a named popular song; “Песня о друге” and “Если друг вдруг…” appear to refer to the same Vysotsky song, and author songs can also be lyrical.
  - items: Если друг вдруг…, Песня о друге, День Победы
  - groups: Военные песни | Лирические | Авторские
  - fix: Use mutually exclusive categories such as songs from cartoons, war songs, film songs, and bard songs with non-duplicate titles.

- **ru-0458** (easy) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - “Если друг вдруг…” is an opening lyric for “Песня о друге”, so these are effectively the same song listed as two separate items.
  - items: Если друг вдруг…, Песня о друге
  - groups: Авторские
  - fix: Keep one and replace the other.

- **ru-0462** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - “Пар и гриль” is a mixed label and overlaps with “Тепловая обработка”, since steaming, grilling, smoking, and blanching are also heat treatments.
  - items: На пару, Гриль, Копчение, Бланширование
  - groups: Тепловая обработка | Пар и гриль
  - fix: Make all categories mutually exclusive, e.g. wet heat, dry heat, preservation without heat, modern techniques.

- **ru-0464** (easy) — `OTHER` [high] → verdict: `needs-claude-review`
  - The title is “Виды покрытий дорог”, but three of four groups are bridges, tunnels, and interchanges rather than road surfaces. This breaks the puzzle premise.
  - groups: Типы мостов | Тоннели | Развязки
  - fix: Retitle as “Дорожная инфраструктура” or replace the non-surface groups.

- **ru-0466** (easy) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - This is specialist medical vocabulary and too technical for an easy puzzle, especially “вентрикулостомия”, “стереотаксия”, “артродез”, “остеотомия”, and “АКШ”.
  - items: АКШ (шунтирование), Артродез, Остеотомия, Стереотаксия, Вентрикулостомия
  - fix: Move to a hard/medical tier or use broad everyday surgery categories.

- **ru-0470** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The title is forest types, but several groups contain tree species rather than forest types. A player could sort “ель”, “кедр”, “пихта”, “дуб”, etc. by tree category instead of forest category.
  - items: Ель, Кедр, Пихта, Дуб, Бук, Клён, Липа
  - groups: Хвойные леса | Широколиственные
  - fix: Use forest-type names consistently, e.g. ельник, кедрач, дубрава, буковый лес.

- **ru-0474** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - “Исторические”, “Российские”, and “Катастрофы” are not mutually exclusive: “Аврора”, “Потёмкин”, “Варяг”, “Марат”, “Титаник”, and “Лузитания” are all historical ships, and “Бисмарк” is both historical and a sinking/catastrophe item.
  - items: Аврора, Потёмкин, Варяг, Марат, Титаник, Бисмарк, Луизитания
  - groups: Исторические | Российские | Катастрофы
  - fix: Use parallel labels such as exploration ships, warships, disaster ships, fictional ships.

- **ru-0477** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - “Беспроводные” and “Цифровые” overlap: Wi-Fi, Bluetooth, mobile phones, messengers, video calls, and satellite communication are commonly digital and wireless depending on use.
  - items: Мобильный телефон, Wi-Fi, Bluetooth, Мессенджер, Видеозвонок, Спутниковая связь
  - groups: Беспроводные | Цифровые
  - fix: Use one axis only, such as historical/personal/broadcast/internet services.

- **ru-0479** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - “Кисломолочные” are also “молочные продукты”, so the labels are nested and overlap.
  - items: Кефир, Ряженка, Айран, Тан, Сметана, Творог
  - groups: Кисломолочные | Молочные продукты
  - fix: Rename the fourth group to a non-fermented product category or split by product type more cleanly.

- **ru-0483** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The material categories are not unique because items like “пакет”, “ведро”, “контейнер”, “тубус”, “тюбик”, and “флакон” can be made from different materials. The same generic container type appears under multiple material labels.
  - items: Контейнер, Пакет, Ведро, Флаконик, Коробка, Пакет крафт, Мешок, Тубус, Тюбик
  - groups: Пластиковая | Бумажная | Металлическая
  - fix: Make every item material-specific, e.g. “пластиковое ведро”, “бумажный тубус”, “металлический тюбик”.

- **ru-0487** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - The labels overlap strongly: “земляника” and “малина” can be wild/forest berries, “морошка”, “костяника”, “черёмуха”, “калина”, “рябина”, and “барбарис” can all be wild or medicinal. The categories are not mutually exclusive.
  - items: Малина, Морошка, Костяника, Земляника, Черёмуха, Калина, Рябина, Барбарис
  - groups: Лесные ягоды | Садовые ягоды | Редкие ягоды | Лечебные
  - fix: Use one axis such as habitat, color, plant family, or culinary use.

- **ru-0493** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Culinary, medicinal, tea, and garden-pr spice categories overlap heavily: mint, thyme/chabrets, oregano/dushitsa, rosemary, sage, lavender, basil, melissa, and chamomile can fit multiple uses.
  - items: Мята, Чабрец, Душица, Розмарин, Шалфей, Лаванда, Базилик, Мелисса, Ромашка
  - groups: Кулинарные травы | Лечебные травы | Чайные травы | Садовые пряности
  - fix: Use objective botanical or culinary categories that do not overlap.

- **ru-0494** (easy) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - “Питьевая вода” overlaps with “Природные воды” and “Состояния воды”: freshwater can be drinking water, mineral water is drinking water, and snow/ice are natural states/forms of water.
  - items: Пресная, Ледниковая, Лёд, Снег, Газированная, Дистиллированная
  - groups: Природные воды | Состояния воды | Питьевая вода
  - fix: Use one classification axis or replace drinking-water items with a non-overlapping group.

- **ru-0496** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - “Мисо-суп” is a dish made with miso, not itself a primary fermented drink; placing it under “Напитки” is wrong.
  - items: Мисо-суп
  - groups: Напитки
  - fix: Replace with a fermented drink.

- **ru-9001** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several idioms are assigned to the wrong trait: “Дерёт три шкуры” means overcharges/exploits rather than simple stinginess; “Гусь лапчатый” means a sly/dubious person, not boasting; “Берёт от потолка” means invents figures, not boasting.
  - items: Дерёт три шкуры, Гусь лапчатый, Берёт от потолка
  - groups: Скупость | Хвастовство
  - fix: Replace with idioms that directly express the target traits.

- **ru-9002** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several dishes do not match their cooking-method categories. Хинкали are boiled, not steamed in the usual Russian/Caucasus culinary understanding; рассольник and кислые щи are soups, not pickling/salting products; форшмак is not a studen/aspic dish; цыплёнок табака is pan-fried/pressed, not cooked on an open fire.
  - items: Хинкали, Рассольник, Кислые щи, Форшмак, Цыплёнок табака
  - groups: Блюда на пару | Квашение и засолка | Студень и холодец | На открытом огне
  - fix: Replace with dishes that directly match each cooking method.

- **ru-9004** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - “Они сражались за неё” is not the title of the Soviet war drama; the film is “Они сражались за Родину”.
  - items: Они сражались за неё
  - groups: Военная драма
  - fix: Correct the title.

- **ru-9005** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several idioms are assigned imprecisely or incorrectly: “Ни рыба ни мясо” means neither one thing nor another, not laziness; “Горит работа” means work is going well, not necessarily diligence; “На все руки от скуки” is malformed and should be “на все руки мастер”.
  - items: Ни рыба ни мясо, Горит работа, На все руки от скуки
  - groups: Лень | Усердие | Мастерство
  - fix: Replace or correct these idioms.

- **ru-9006** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Many idioms do not match the literal natural-stichia categories. “Как две капли воды” means similarity, not drought; “Ветер в голове” means frivolity, not storm; “Дышит в затылок” means close behind, not frost; “Берёт за душу” means emotionally affects, not frost.
  - items: Как две капли воды, Ветер в голове, Дышит в затылок, Берёт за душу
  - groups: Буря и гроза | Засуха | Мороз
  - fix: Use idioms whose meaning or imagery clearly matches each category.

- **ru-9009** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Several idioms are malformed or assigned incorrectly: “На словах Толстой” is not a standard honesty/hypocrisy idiom as written; “Слово не с делом” is not honesty; “На чужом горбу в рай” is opportunism, not envy; “Теши — не своротишь” is malformed/unclear.
  - items: На словах Толстой, Слово не с делом, На чужом горбу в рай, Теши — не своротишь
  - groups: Лицемерие | Честность | Зависть | Упрямство
  - fix: Use standard idioms and verify their meanings.

- **ru-9010** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - The title says Peredvizhniki painting, but Levitan and Vasnetsov are not normally grouped as core Peredvizhniki in the same clean way as Repin/Surikov, and the categories are really “artist wrote/painted these works” rather than the movement. Also “Вечерний звон” is not a painting title by Levitan in the expected canon; Levitan’s well-known work is “Вечерний звон” only if referring to a landscape, but it is less canonical than the others for easy tier.
  - items: Левитан написал, Васнецов написал, Вечерний звон
  - fix: Retitle as “Русская живопись: кто написал” or use only confirmed Peredvizhniki and very canonical works.

- **ru-9012** (easy) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - “Вишнёвый сад Раневской” is awkwardly phrased as if the play is the character; the character is Любовь Раневская. “Дядя Ваня” is both a play title and a character nickname, so it is less clean as a character item.
  - items: Вишнёвый сад Раневской, Дядя Ваня
  - groups: Персонажи Чехова
  - fix: Use clear character names such as Раневская and Астров/Треплев/Лопахин.

- **ru-0108** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Группа «Молодёжные орг.» составлена некорректно: ГТО и БГТО — это не организации, а нормативные комплексы/ступени, а ДОСААФ не является однозначно «молодёжной организацией». Категория перестаёт быть чёткой.
  - items: ВЛКСМ, ДОСААФ, ГТО, БГТО
  - groups: Молодёжные орг.
  - fix: Либо заменить ярлык на более широкий вроде «советские массовые аббревиатуры», либо оставить только реальные молодёжные организации.

- **ru-0110** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В пазле несколько спорных или неверных приписок изобретений конкретным людям. Например, когерер не изобретён Поповым, «скафандр» и «реактивное движение» некорректно давать как его/их изобретения Циолковского, а «трансформатор» не является однозначным изобретением Яблочкова.
  - items: Когерер, Скафандр, Реактивное движение, Трансформатор
  - groups: Циолковский | Попов | Яблочков
  - fix: Оставить только бесспорно ассоциируемые с каждым изобретателем позиции.

- **ru-0111** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Заголовок «Боги Олимпа» не соответствует набору: в пазле есть неолимпийские персонажи, второстепенные существа и даже собирательные группы. Это делает рамку категории неточной.
  - items: Тритон, Нереиды, Харон, Геката, Хариты
  - groups: Море | Подземный мир | Любовь и красота
  - fix: Либо переименовать пазл в более широкое «Персонажи греческой мифологии», либо оставить только олимпийских богов.

- **ru-0130** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Лагос не является столицей Африки; это крупнейший город Нигерии, но не столица. В группе столиц это явная ошибка.
  - items: Лагос
  - groups: Африка
  - fix: Заменить «Лагос» на действительную столицу африканской страны.

- **ru-0139** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - «Ханты» разумно подходят и к «Сибирь и Дальний Восток», и к «Малые народы Севера». Игрок не может однозначно определить единственную группу по данному набору меток.
  - items: Ханты
  - groups: Сибирь и Дальний Восток | Малые народы Севера
  - fix: Заменить «Ханты» на народ, уверенно относящийся только к одной из двух групп.

- **ru-0160** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Чили кон карне» обычно воспринимается как техасско-мексиканское/американское блюдо, а не бесспорно мексиканское. Для тематического набора по национальным кухням это даёт ложную опору.
  - items: Чили кон карне
  - groups: Мексика
  - fix: Заменить на более однозначно мексиканское блюдо.

- **ru-0185** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В группе «Борцы и тяжелоатлеты» есть спортсмены, которые не являются ни российскими, ни подходящими по виду спорта. Ломаченко — украинский боксёр, Арямнов — белорусский тяжелоатлет.
  - items: Арямнов, Ломаченко
  - groups: Борцы и тяжелоатлеты
  - fix: Заменить на российских борцов/тяжелоатлетов без спорной атрибуции.

- **ru-0193** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Категории и элементы исторически неточны. «Русский» не является стандартным названием средневекового архитектурного стиля, а рамка «Ренессанс и барокко» плохо соответствует включённым туда рококо и классицизму.
  - items: Русский, Рококо, Классицизм
  - groups: Средневековье | Ренессанс и барокко
  - fix: Использовать общепринятые названия стилей и согласовать эпохи в заголовках групп.

- **ru-0220** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Пазл содержит несколько грубых фактических проблем: «МКС Мир» — некорректное смешение двух разных станций; «Магнитогорск. комб.» вообще не изобретение и не энергетический объект того же типа. В целом группа распадается.
  - items: МКС Мир, Магнитогорск. комб.
  - groups: Космос | Энергетика
  - fix: Пересобрать пазл на реально советских разработках и объектах одного класса.

- **ru-0229** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Группы медицинских специальностей составлены некорректно: дефектолог не является врачебной специальностью, а невролог относится к неврологии, не к «психическому здоровью» в одном ряду с психиатром и психологом.
  - items: Дефектолог, Невролог
  - groups: Детская медицина | Психическое здоровье
  - fix: Заменить на профильные медицинские специальности без междисциплинарной путаницы.

- **ru-0240** (medium) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - «Романский» и «Романеск» — по сути одно и то же название стиля. Это дублирование внутри одного пазла.
  - items: Романский, Романеск
  - groups: Средневековье
  - fix: Оставить только один термин и заменить второй на другой стиль.

- **ru-0242** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В каждой группе к знакам зодиака добавлена планета/светило, которое не является знаком зодиака. Это ломает основной принцип категории.
  - items: Марс, Венера, Меркурий, Луна
  - groups: Огонь | Земля | Воздух | Вода
  - fix: Заменить эти элементы на реальные знаки зодиака соответствующих стихий.

- **ru-0244** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Темы пословиц сильно пересекаются: труд, время, мастерство и лень в русском пословичном фонде регулярно выражаются одними и теми же формулами. Из-за этого игроку трудно однозначно разнести элементы по четырём непересекающимся группам.
  - items: Куй железо, Глаза боятся, Делу время, Не откладывай
  - groups: Про труд | Про время | Про мастерство | Про лень
  - fix: Либо сделать группы по конкретным пословицам/источникам, либо подобрать менее пересекающиеся тематические ярлыки.

- **ru-0250** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Группа «Центральная Америка» собрана неверно: Колумбия и Венесуэла находятся в Южной Америке, Куба — Карибы, Мексика обычно относится к Северной Америке. Это нерабочая географическая категория.
  - items: Мексика, Куба, Колумбия, Венесуэла
  - groups: Центральная Америка
  - fix: Либо переименовать группу в более широкий регион, либо заменить страны на действительно центральноамериканские.

- **ru-0252** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Жанровые группы сериалов сильно пересекаются: одни и те же сериалы разумно читать как драму, фантастику, триллер и т.п. «Игра престолов» и «Чёрное зеркало» особенно проблемны. Отдельная группа «Российские» пересекается с жанровыми по другому основанию.
  - items: Игра престолов, Чёрное зеркало, Очень странные дела
  - groups: Драма | Фантастика | Российские
  - fix: Использовать единый принцип классификации: либо только жанры, либо только страны/регионы.

- **ru-0256** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Классификация облаков составлена неверно: есть неканоничные или плохо оформленные названия, а часть типов помещена не в ту высотную группу. Это делает решение зависимым от ошибок редактора.
  - items: Кучево-перистые, Слоисто-кучевые, Слоистые, Кучево-дождевые
  - groups: Высокие облака | Средние облака | Низкие облака
  - fix: Пересобрать набор по стандартной метеорологической классификации облаков.

- **ru-0258** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Группа «Фантастика» содержит фильмы, которые к научной фантастике не относятся: «Барри Линдон» и «Сияние», а «Доктор Стрейнджлав» тоже неочевиден в таком ряду. Категория неточна.
  - items: Доктор Стрейнджлав, Барри Линдон, Сияние
  - groups: Фантастика
  - fix: Либо переименовать группу, либо оставить только бесспорно фантастические фильмы Кубрика.

- **ru-0269** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Под заголовком «Спортивные трофеи» перечислены в основном турниры и серии соревнований, а не собственно трофеи/кубки. Это особенно заметно в теннисе, гольфе и автоспорте.
  - items: Уимблдон, Ролан Гаррос, Формула 1, Индикар, 24 часа Ле-Мана
  - groups: Теннис | Гольф | Автоспорт
  - fix: Либо переименовать пазл в «Крупные соревнования», либо заменить элементы на реальные трофеи.

- **ru-0271** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Категории ОС перекрываются: Ubuntu, Fedora, Debian и FreeBSD разумно воспринимаются и как десктопные, и как серверные системы. Игрок не получает однозначного разбиения.
  - items: Ubuntu, Fedora, Debian, FreeBSD
  - groups: Десктопные ОС | Серверные
  - fix: Использовать взаимоисключающие категории, например по ядру, семейству или основному назначению без пересечения конкретных систем.

- **ru-0274** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В группе «Мембраны» присутствует «Эндоплазм. сеть», которая не является мембраной, а органеллой/системой мембран. Категория составлена неточно.
  - items: Эндоплазм. сеть
  - groups: Мембраны
  - fix: Заменить на реальный мембранный компонент либо переименовать группу в более широкую.

- **ru-0284** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Несколько марок отнесены к неверным странам/регионам: OnePlus — китайская марка, Sony — японская, HTC — тайваньская. Из-за этого географическая логика пазла ломается.
  - items: OnePlus, Sony, HTC
  - groups: США | Европа
  - fix: Заменить бренды на действительно соответствующие указанным странам/регионам.

- **ru-0286** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Группа «Зенитные» содержит системы ПВО и одну ракетную систему другого класса: С-400 и Patriot — это комплексы, а Искандер вообще не зенитный. Категория некорректна.
  - items: С-400, Пэтриот, Искандер
  - groups: Зенитные
  - fix: Либо использовать именно названия зенитных ракет, либо переименовать группу в «системы ПВО» и убрать Искандер.

- **ru-0291** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Группы флагов не взаимоисключающие: «трёхцветные» пересекаются почти с любыми цветовыми группами, «с зелёным» тоже. Дополнительно «Ливия» как «нестандартный» опирается на устаревший флаговый факт.
  - items: Франция, Германия, Италия, Россия, Бразилия, Нигерия, Пакистан, Саудовская Аравия, Ливия
  - groups: Трёхцветные | С зелёным | Нестандартные
  - fix: Выбрать один принцип классификации флагов и обновить спорные/устаревшие примеры.

- **ru-0293** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Пазл смешивает несопоставимые сущности: в «Источниках света» есть механизм и материал вместо источников, а в «Цвет и смешение» стоят модель печати и физический объект. Категории нестроги.
  - items: Неон, Накаливание, CMYK, Призма
  - groups: Источники света | Цвет и смешение
  - fix: Собрать группы из сущностей одного типа: либо только источники, либо только модели цвета, либо только оптические приборы/явления.

- **ru-0308** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Категории «Возобновляемые» и «Альтернативные» пересекаются: приливная, волновая и биогаз обычно одновременно считаются возобновляемыми, а водород часто относится к альтернативной энергетике без отдельного четкого класса.
  - groups: Возобновляемые | Альтернативные
  - fix: Сделать группы одного основания, например: «Возобновляемые / Ископаемые / Ядерные / Носители энергии и технологии» или заменить «Альтернативные» на непересекающуюся категорию.

- **ru-0320** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В пазле смешаны виды, родовые группы, типы паутины и сомнительные/неузнаваемые названия. «Сеть-воронка» — это не паук, «Бразильский» неполон, а часть скорпионов выглядит недостоверно для среднего тира.
  - items: Бразильский, Сеть-воронка, Паттер, Эмпора
  - groups: Опасные пауки | Ткачи паутины | Скорпионы
  - fix: Использовать однородные таксоны/общеупотребительные русские названия: либо только виды, либо только семейства/роды.

- **ru-0326** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Охрид» в первую очередь известен как город/озёрный курорт, а не как общеизвестный горнолыжный курорт, что ломает группу.
  - items: Охрид
  - groups: Прочие
  - fix: Заменить на однозначный лыжный курорт.

- **ru-0332** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Группа «Функциональное» составлена не по одному основанию: юнит-, интеграционное и системное — это уровни тестирования, а регрессионное — тип по цели. Это не однородный класс.
  - items: Юнит-тест, Интеграционный, Системный, Регрессионный
  - groups: Функциональное
  - fix: Либо сделать группу «Уровни тестирования», либо заменить набор на действительно функциональные виды.

- **ru-0339** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Amazon и Alibaba одинаково естественно относятся и к технологиям, и к ритейлу. У игрока нет однозначного способа выбрать единственную группу.
  - items: Amazon, Alibaba
  - groups: IT и технологии | Ритейл
  - fix: Заменить спорные конгломераты на компании с более однозначной отраслевой привязкой.

- **ru-0346** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Внутри «Доисторического» смешаны вложенные уровни периодизации: «Палеолит» является частью каменного века, а не параллельным периодом одного уровня.
  - items: Каменный век, Палеолит
  - groups: Доисторический
  - fix: Использовать только один уровень периодизации внутри группы.

- **ru-0346** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Крестовые походы» — это серия исторических событий, а не исторический период уровня «Раннее/Высокое/Позднее Средневековье».
  - items: Крестовые походы
  - groups: Средневековье
  - fix: Заменить на период или подэпоху того же типа.

- **ru-0351** (medium) — `OTHER` [high] → verdict: `needs-claude-review`
  - Название пазла «Виды судопроизводства» не соответствует содержанию: группы про правовые системы, суды, участников и акты, а не про виды судопроизводства. Это вводит игрока в заблуждение.
  - groups: Правовые системы | Суды | Участники | Правовые акты
  - fix: Переименовать пазл или пересобрать все 4 группы вокруг реальных видов судопроизводства.

- **ru-0354** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Арлекин», «Коломбина» и «Пульчинелла» — прежде всего персонажи комедии дель арте, а не венецианские маски как класс; «Тыква» у Хэллоуина — символ/атрибут, а не персонаж.
  - items: Арлекин, Коломбина, Пульчинелла, Тыква
  - groups: Венецианские маски | Хэллоуин
  - fix: Либо сделать группу «Персонажи комедии дель арте», либо заменить на реальные типы масок; в Хэллоуине держать только персонажей.

- **ru-0359** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Минфин» и «Счётная палата» не являются налоговыми органами в том же смысле, что ФНС/ФТС. Группа составлена некорректно.
  - items: Минфин, Счётная палата
  - groups: Налоговые органы
  - fix: Оставить только профильные органы администрирования/контроля налогов или переименовать категорию шире.

- **ru-0360** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Штатив» не относится к фотооптике как тип оптики/объектива; это аксессуар. Из-за этого группа неоднородна.
  - items: Штатив
  - groups: Фотооптика
  - fix: Заменить на объектив/оптический термин того же уровня.

- **ru-0362** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Жанры «Открытый мир» и «Выживание» массово пересекаются; ряд игр естественно подходит в обе категории. Это не четыре непересекающихся класса.
  - groups: Открытый мир | Выживание
  - fix: Использовать более ортогональные жанры или заменить спорные теги на однозначные.

- **ru-0362** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Minecraft разумно отнести и к «Выживанию», и к «Открытому миру».
  - items: Minecraft
  - groups: Открытый мир | Выживание
  - fix: Заменить на игру, однозначно ассоциируемую только с одним из жанров.

- **ru-0364** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Федеративная» — не тип республики в одном ряду с президентской/парламентской/смешанной, а другая ось классификации государственного устройства.
  - items: Федеративная
  - groups: Типы республик
  - fix: Заменить на «полупрезидентская» или иную форму правления того же уровня.

- **ru-0366** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - «Марокканский» одинаково естественно читается как этнический стиль и как люксовый/декоративный интерьерный стиль. Категории пересекаются.
  - items: Марокканский
  - groups: Этнические | Люкс
  - fix: Сделать группы по одному основанию и убрать гибридные стили.

- **ru-0371** (medium) — `OTHER` [high] → verdict: `needs-claude-review`
  - Название «Виды акцентов» не соответствует содержанию: половина групп про жаргон и общие языковые явления, которые не являются акцентами.
  - groups: Жаргон | Языковые явления
  - fix: Либо переименовать пазл в более широкую лингвистическую тему, либо собрать все группы именно из акцентов/произносительных вариантов.

- **ru-0373** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В группе «Нацпарки» перечислены известные заповедники, а не национальные парки: Кроноцкий, Алтайский и Тебердинский — не нацпарки.
  - items: Кроноцкий, Алтайский, Тебердинский
  - groups: Нацпарки
  - fix: Заменить на реальные национальные парки России или переименовать группу в «заповедники».

- **ru-0378** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Омега-3» и «железо» не являются витаминами. Группа некорректна по базовому факту.
  - items: Омега-3, Железо
  - groups: Витамины
  - fix: Заменить на витамины или переименовать группу в «микронутриенты/добавки».

- **ru-0380** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В пазле смешаны бренды и стили: «Балтика/Heineken/Budweiser» — марки, а «IPA/стаут/портер/вит-бир» и «Weizen/Märzen/Dunkel/Bock» — стили. Это разные основания классификации.
  - items: IPA, Стаут, Портер, Вит-бир, Weizen, Märzen, Dunkel, Bock
  - groups: Крафт | Немецкие
  - fix: Либо делать все группы из брендов, либо все группы из стилей.

- **ru-0395** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В «Чёрные металлы» смешаны металл и сплавы/разговорные названия: сталь, чугун и нержавейка не параллельны железу; «титановый» вообще неполное обозначение сплава.
  - items: Сталь, Чугун, Нержавейка, Титановый
  - groups: Чёрные металлы | Сплавы
  - fix: Привести все элементы к одному уровню: либо металлы, либо сплавы, с полными названиями.

- **ru-0398** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Астрологическая классификация нарушена: Марс обычно относится к личным планетам, а Лилит и Хирон не являются планетами. Кроме того, пазл про «планеты», но одна группа — это дома.
  - items: Марс, Лилит, Хирон
  - groups: Социальные планеты | Внешние планеты | Астрологические дома
  - fix: Использовать общепринятую астрологическую классификацию и не смешивать планеты с домами.

- **ru-0402** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Уран и Нептун обычно выделяются как ледяные гиганты, а не газовые. Для пазла такого типа это заметная фактическая ошибка.
  - items: Уран, Нептун
  - groups: Газовые гиганты
  - fix: Либо переименовать группу в «гиганты», либо заменить состав на действительно газовых гигантов.

- **ru-0405** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В группе поп-арта есть сомнительное/ошибочное имя «Хамеринг», а в уличном искусстве «Romero Britto» плохо подходит как общеупотребимый пример street art. Набор выглядит редакторски нестабильным.
  - items: Хамеринг, Romero Britto
  - groups: Поп-арт | Уличное искусство
  - fix: Заменить на бесспорных представителей соответствующих направлений и нормализовать написание имен.

- **ru-0406** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Лейшманиоз» и «онхоцеркоз» передаются через насекомых, а не контактным путем; «COVID-19», «MERS» и «SARS» вообще плохо соответствуют теме тропических болезней.
  - items: Лейшманиоз, Онхоцеркоз, COVID-19, MERS, SARS
  - groups: Контактные | Респираторные
  - fix: Собрать группы по реальным путям передачи и держаться именно тропических заболеваний.

- **ru-0412** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Пазл содержит явные неверные отнесения: «Тишина ягнят» — произведение, а не женщина-детектив; «Перри Мейсон» не российский детектив; «Коломбо женщина» выглядит как несуществующий персонаж.
  - items: Тишина ягнят, Перри Мейсон, Коломбо женщина
  - groups: Женщины-детективы | Российские детективы
  - fix: Полностью пересобрать спорные группы из реальных персонажей одного типа.

- **ru-0416** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Самозанятость» не является видом договора, а «ГПХ» в группе трудовых конфликтует с гражданско-правовыми договорами. Основание классификации распадается.
  - items: Самозанятость, ГПХ
  - groups: Трудовые | Гражданские
  - fix: Убрать правовые режимы/статусы и оставить только договоры одного уровня.

- **ru-0417** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В омонимах есть неверные значения: «музыкальный такт» не является значением слова «замок», а «полуостров» неточно передает значение «коса» (нужна «песчаная коса»).
  - items: Музыкальный такт, Полуостров
  - groups: Замок / замок | Значения слова «коса»
  - fix: Заменить на реальные словарные значения без натяжек.

- **ru-0432** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Гамма-камера» — прибор, а не метод сканирования; кроме того, сам пазл про «сканирование», но включает эндоскопию как отдельный класс процедур. Основание неоднородно.
  - items: Гамма-камера
  - groups: Ядерная медицина | Эндоскопия
  - fix: Либо сделать пазл про методы диагностической визуализации, либо убрать устройства/процедуры, не являющиеся сканированием.

- **ru-0433** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В пазле несколько грубых ошибок: Карачи, Лагос, Шанхай и Мумбаи не являются фактическими столицами своих стран; Сукре не островная столица; Эр-Рияд/Джидда не общепринятая «двойная столица».
  - items: Карачи, Лагос, Шанхай, Мумбаи, Сукре, Эр-Рияд/Джидда
  - groups: Фактические столицы | Островные столицы | Двойные столицы
  - fix: Полностью перепроверить все примеры по справочнику и брать только бесспорные случаи.

- **ru-0438** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Аконкагуа» не является вулканической горой. Группа содержит как минимум один очевидно неверный пример.
  - items: Аконкагуа
  - groups: Вулканические горы
  - fix: Заменить на реально вулканическую гору.

- **ru-0440** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Metropolitan/Метрополитен дублируется сразу в двух группах: как «Европейские» и как «Американские». Это прямое нарушение уникальности элемента.
  - items: Метрополитен, Metropolitan
  - groups: Европейские | Американские
  - fix: Убрать дубликат и исправить европейскую группу на реально европейский музей.

- **ru-0441** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Категории пересекаются по одному и тому же признаку: приметы о дожде, приметы о лете и животные-предсказатели. Игрок не может надёжно отделить тематический признак от сезонного/сюжетного.
  - items: Лягушки квак.=дождь, Кошка умыв.=дождь, Ласточ. низко=дождь, Синица поёт — тепло
  - groups: О дожде | О лете | Животные предсказывают | О зиме
  - fix: Развести оси классификации: либо только сезоны, либо только погодные явления, либо только животные-приметы.

- **ru-0443** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - «Недавние» — это подмножество политических революций; категории заданы по разным основаниям (тип vs время), из-за чего домены вложены друг в друга.
  - items: Арабская весна, Евромайдан, Революция роз, Оранжевая
  - groups: Политические | Недавние
  - fix: Сделать все группы одного уровня: либо по эпохам, либо по типам, либо по регионам.

- **ru-0445** (medium) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Для medium набор слишком клинический и требует специализированного знания психиатрической классификации, включая аббревиатуры и пограничные диагнозы.
  - items: ГТР, ОКР, Дистимия, Циклотимия, Шизоаффективное, Бредовое
  - groups: Аффективные | Тревожные | Психозы | Личность
  - fix: Упростить тему до более общих психологических терминов или сделать tier harder.

- **ru-0447** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Часть групп смешивает классификацию по эмитенту с классификацией по свойствам. Такие бумаги могут одновременно быть муниципальными и «особыми».
  - items: Зелёные, Инфраструктурные
  - groups: Муниципальные | Особые
  - fix: Держать все группы в одной оси: либо по эмитенту, либо по структуре/условиям выпуска.

- **ru-0463** (medium) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Заголовок обещает «виды разведки», но внутри смешаны виды, спецслужбы, методы контрразведки и тайные операции. Это не единый набор категорий.
  - groups: Виды разведки | Спецслужбы | Контрразведка | Тайные операции
  - fix: Либо переименовать тему в более широкую, либо собрать четыре однородные группы.

- **ru-0463** (medium) — `AMBIGUOUS_ITEM` [high] → verdict: `needs-claude-review`
  - Ряд элементов естественно читается сразу в нескольких группах: как методы разведки, контрразведки и тайных операций.
  - items: Перехват, Внедрение, Вербовка
  - groups: Виды разведки | Контрразведка | Тайные операции
  - fix: Убрать межгрупповые методы и оставить только однозначные элементы.

- **ru-0465** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Антаблемент не является частью колонны; это горизонтальная несомая часть ордерной системы над колоннами.
  - items: Антаблемент
  - groups: Колонна
  - fix: Заменить на корректную часть колонны, например «база / ствол / капитель / эхин» или аналогичный термин.

- **ru-0467** (medium) — `LABEL_OVERLAP` [high] → verdict: `needs-claude-review`
  - Эпохи размыты и перекрываются: композиторы рубежа XIX–XX вв. и XIX века существенно пересекаются по времени и стилю.
  - items: Чайковский, Римский-Корсаков, Рахманинов, Скрябин
  - groups: XIX век | Рубеж XIX–XX вв.
  - fix: Выбрать более чёткие периоды с неоспоримыми представителями или классифицировать по школам/жанрам.

- **ru-0467** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В «русскую музыку» включены авторы, обычно не относимые к русским композиторам: Пярт — эстонский, Канчели — грузинский.
  - items: Пярт, Канчели
  - groups: Современная
  - fix: Либо переименовать тему в «музыка России и СССР/постсоветского пространства», либо заменить этих авторов.

- **ru-0469** (medium) — `REDUNDANT_ITEMS` [high] → verdict: `needs-claude-review`
  - Тора и Танах находятся в отношении часть-целое внутри одной группы, а не как параллельные единицы; это ломает чистоту категории.
  - items: Тора, Танах
  - groups: Авраамические
  - fix: Заменить один из элементов на другой самостоятельный священный текст.

- **ru-0482** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Группа «Ветви» составлена не на одном уровне. Дзен — школа внутри махаяны, а «хинаяна» — спорный и устаревший внешний термин, обычно не ставится в один ряд с махаяной и ваджраяной.
  - items: Хинаяна, Дзен
  - groups: Ветви
  - fix: Использовать более корректный ряд, например «Тхеравада / Махаяна / Ваджраяна / Чань» с аккуратным названием группы, либо сменить тему группы.

- **ru-0488** (medium) — `WRONG_TIER` [high] → verdict: `needs-claude-review`
  - Пазл смешивает формы правления, режимы, исторические порядки и идеологии. Это разные оси классификации, поэтому группы выглядят искусственно и неравноценны.
  - groups: Демократии | Авторитаризм | Исторические | Идеологии
  - fix: Собрать четыре однородные группы: например только формы правления, только режимы или только идеологии.

- **ru-0490** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Группа «Просвещение» заполнена фигурами, которые плохо соответствуют этому ярлыку: Наполеон обычно относится к постреволюционной эпохе, Пётр I — к более раннему периоду.
  - items: Наполеон, Пётр I
  - groups: Просвещение
  - fix: Переименовать группу в более точную эпоху или заменить фигуры на бесспорных деятелей Просвещения.

- **ru-0497** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - Несколько элементов размечены неточно: Янус обычно не считается «малым богом», а «Энеида» — это эпос, а не миф-сюжет одного типа с остальными пунктами.
  - items: Янус, Энеида
  - groups: Малые боги | Мифы
  - fix: Заменить на бесспорных minor deities и на конкретный мифологический сюжет.

- **ru-9015** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В группе использованы сломанные или неполные фразеологизмы, поэтому игроку приходится угадывать редакторскую задумку, а не узнавать устойчивые выражения.
  - items: Смотрит телячьи глаза, Принял за монету
  - groups: Наивность
  - fix: Исправить на нормативные формы, например «смотрит телячьими глазами», «принял за чистую монету».

- **ru-9018** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - «Советский интернет» в группе «первые в СССР» описан как несостоявшийся проект. Это выбивается из ряда реальных осуществлённых достижений.
  - items: Советский интернет
  - groups: Советский интернет
  - fix: Заменить на реально реализованную советскую технологическую «первую».

- **ru-9020** (medium) — `FACTUAL_ERROR` [high] → verdict: `needs-claude-review`
  - В набор под «русские народные сказки» попадают элементы из авторской литературной сказки «Конёк-Горбунок», что смешивает фольклор и литературную обработку.
  - items: Конёк-Горбунок, Достань перо птицы, Поймай коня златого
  - groups: Волшебные помощники | Испытания героя
  - fix: Либо сузить тему до народных сказок без авторских произведений, либо явно расширить её до «русские сказки».

## DROPPED_REFUTED — GPT claims Claude refuted — 5

### EN (3)

- **puzzle-0184** (easy) — `SAME_SPECIES_SPLIT` [high] → verdict: `refuted`
  - The puzzle groups animals by species but uses sex/age terms within each species. This is explicitly unfair under the audit rules for same-species identity splits.
  - items: Cow, Bull, Calf, Ox, Sow, Boar, Piglet, Hog, Ewe, Ram, Lamb, Merino
  - groups: Cattle | Pigs | Sheep
  - fix: Replace with groups that do not rely on sex/age variants, such as farm tools, farm buildings, crops, and animal species.

- **puzzle-0331** (easy) — `SAME_SPECIES_SPLIT` [medium] → verdict: `refuted`
  - Orca is a kind of whale, so listing 'Whale' and 'Orca' as separate items creates identity/species overlap inside the same group.
  - items: Whale, Orca
  - groups: Animals That Move in a Pod
  - fix: Replace either 'Whale' or 'Orca' with a non-overlapping pod animal.

- **puzzle-0429** (hard) — `FACTUAL_ERROR` [high] → verdict: `refuted`
  - Several words do not hide the listed animal as a contiguous substring. “Locate” does not contain CAT; “Vacation” does not contain CAT; “Grateful” does not contain RAT; “Strategy” does not contain RAT; “Encoder” does not contain COD; “Sewer” and “Brewer” do not contain EWE.
  - items: Locate, Vacation, Grateful, Strategy, Encoder, Sewer, Brewer
  - groups: HIDES 'CAT' | HIDES 'RAT' | HIDES 'COD' | HIDES 'EWE'
  - fix: Replace the non-matching words with words that contain the exact hidden animal substring, or relabel the mechanism if non-contiguous letters are intended.
  - check: "Locate" does not contain "CAT" → GPT **hallucinated**
  - check: "Vacation" does not contain "CAT" → GPT **hallucinated**
  - check: "Grateful" does not contain "RAT" → GPT **hallucinated**
  - check: "Strategy" does not contain "RAT" → GPT **hallucinated**
  - check: "Encoder" does not contain "COD" → GPT **hallucinated**

### RU (2)

- **ru-0187** (easy) — `SAME_SPECIES_SPLIT` [high] → verdict: `refuted`
  - «Ехидна», «Проехидна» and «Длинноносая ехидна» are overlapping/closely nested animal identities rather than cleanly distinct everyday items; «проехидны» are long-beaked echidnas.
  - items: Ехидна, Проехидна, Длинноносая ехидна
  - groups: Однопроходные
  - fix: Use broader, distinct monotreme entries only if the puzzle tier supports it, or replace the category.

- **ru-0320** (medium) — `SAME_SPECIES_SPLIT` [high] → verdict: `refuted`
  - «Чёрная вдова» и «каракурт» в русской традиции обычно воспринимаются как одно и то же/крайне близкое обозначение, что делает набор неуникальным.
  - items: Чёрная вдова, Каракурт
  - groups: Опасные пауки
  - fix: Оставить только одно из двух названий и заменить второе на другой однозначный вид.

## Medium + low notes

See `MERGED_AUDIT_REPORT.json` companion file for full detail (1035 items).
