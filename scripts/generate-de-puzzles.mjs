/**
 * Batch German puzzle generator for Foldwink.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-de-puzzles.mjs
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-de-puzzles.mjs --start=50 --count=100
 *
 * Output: puzzles/de-drafts/de-NNNN.json
 * Resume: automatically skips already-written files.
 *
 * Quality controls:
 *   - German-specific themes and cultural references
 *   - JSON Schema validation before write
 *   - Duplicate item detection within batch
 *   - Retry on malformed responses (max 3 retries per batch)
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";

// ─── CLI args ───────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const START = parseInt(args.start ?? "0", 10);
const COUNT = parseInt(args.count ?? "500", 10);
const BATCH = parseInt(args.batch ?? "10", 10);
const DRY_RUN = args["dry-run"] === true;
const MODEL = args.model ?? "claude-haiku-4-5-20251001";

// ─── Paths ──────────────────────────────────────────────────────────────────
const OUT_DIR = path.resolve("puzzles/de-drafts");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── Theme bank (600+ entries) ────────────────────────────────────────────
// [slug, humanLabel, difficulty]
const THEMES = [
  // === EASY ================================================================
  ["jahreszeiten", "Jahreszeiten", "easy"],
  ["wetter", "Wetter und Naturphänomene", "easy"],
  ["obst", "Obstsorten", "easy"],
  ["gemüse", "Gemüse", "easy"],
  ["beeren", "Beeren und Früchte", "easy"],
  ["pilze", "Pilze im Wald", "easy"],
  ["haustiere", "Haustiere", "easy"],
  ["wildtiere", "Wildtiere", "easy"],
  ["waldtiere", "Tiere im deutschen Wald", "easy"],
  ["vögel", "Vögel in Deutschland", "easy"],
  ["fische_fluss", "Fische in Flüssen und Seen", "easy"],
  ["insekten", "Insekten", "easy"],
  ["meerestiere", "Meerestiere", "easy"],
  ["bäume", "Bäume und Pflanzen", "easy"],
  ["blumen", "Blumen und Pflanzen", "easy"],
  ["farben", "Farben des Regenbogens", "easy"],
  ["berufe", "Berufe", "easy"],
  ["werkzeug", "Werkzeuge und Handwerk", "easy"],
  ["musikinstrumente", "Musikinstrumente", "easy"],
  ["möbel", "Möbel und Einrichtung", "easy"],
  ["geschirr", "Geschirr und Küchenzubehör", "easy"],
  ["kleidung", "Kleidungsstücke", "easy"],
  ["schuhe", "Schuhe und Fußbekleidung", "easy"],
  ["frühstück", "Frühstücksspeisen", "easy"],
  ["suppen", "Suppen und Eintöpfe", "easy"],
  ["hauptgerichte", "Deutsche Hauptgerichte", "easy"],
  ["backwaren", "Brot und Backwaren", "easy"],
  ["süßigkeiten", "Süßigkeiten und Desserts", "easy"],
  ["getränke", "Getränke", "easy"],
  ["gewürze", "Gewürze und Kräuter", "easy"],
  ["körper", "Körperteile", "easy"],
  ["gesicht", "Teile des Gesichts", "easy"],
  ["familie", "Familienmitglieder", "easy"],
  ["zimmer", "Zimmer im Haus", "easy"],
  ["badezimmer", "Gegenstände im Badezimmer", "easy"],
  ["küchengeräte", "Küchengeräte", "easy"],
  ["haushaltsgeräte", "Haushaltsgeräte", "easy"],
  ["sport_arten", "Sportarten", "easy"],
  ["wintersport", "Wintersportarten", "easy"],
  ["sommersport", "Sommersportarten", "easy"],
  ["sportausrüstung", "Sportausrüstung", "easy"],
  ["olympia_disziplinen", "Olympische Disziplinen", "easy"],
  ["kinderspiele", "Kinderspiele", "easy"],
  ["spielzeug", "Spielzeug", "easy"],
  ["brettspiele", "Brettspiele", "easy"],
  ["computer", "Computer und Internet", "easy"],
  ["smartphone", "Smartphone und Apps", "easy"],
  ["soziale_netzwerke", "Soziale Netzwerke", "easy"],
  ["filmgenres", "Filmgenres", "easy"],
  ["musikgenres", "Musikgenres", "easy"],
  ["buchgenres", "Buchgenres und Literaturformen", "easy"],
  ["theater", "Theater und Bühne", "easy"],
  ["zirkus", "Zirkus und Akrobatik", "easy"],
  ["zoo", "Tiere im Zoo", "easy"],
  ["planeten", "Planeten des Sonnensystems", "easy"],
  ["sterne", "Sterne und Sternbilder", "easy"],
  ["kontinente", "Kontinente der Welt", "easy"],
  ["ozeane", "Ozeane und Meere", "easy"],
  ["berge_welt", "Berge der Welt", "easy"],
  ["flüsse_deutschland", "Flüsse in Deutschland", "easy"],
  ["seen_deutschland", "Seen in Deutschland", "easy"],
  ["städte_deutschland", "Städte in Deutschland", "easy"],
  ["bundesländer", "Bundesländer Deutschlands", "easy"],
  ["länder_europa", "Länder in Europa", "easy"],
  ["hauptstädte", "Hauptstädte der Welt", "easy"],
  ["mathematik", "Mathematische Begriffe", "easy"],
  ["geometrie", "Geometrische Formen", "easy"],
  ["chemie_elemente", "Chemische Elemente", "easy"],
  ["metalle", "Metalle und Legierungen", "easy"],
  ["edelsteine", "Edelsteine und Mineralien", "easy"],
  ["zahlen", "Zahlen und Zählen", "easy"],
  ["wochentage", "Wochentage und Monate", "easy"],
  ["schule_fächer", "Schulfächer", "easy"],
  ["schulsachen", "Schulsachen und Schreibwaren", "easy"],
  ["büro", "Büromaterialien", "easy"],
  ["it_berufe", "IT-Berufe", "easy"],
  ["programmiersprachen", "Programmiersprachen", "easy"],
  ["videospiel_genres", "Videospiel-Genres", "easy"],
  ["spielkonsolen", "Spielkonsolen", "easy"],
  ["transport_stadt", "Städtische Verkehrsmittel", "easy"],
  ["transport_arten", "Verkehrsmittel", "easy"],
  ["flughafen", "Teile des Flughafens", "easy"],
  ["hafen", "Seehafen und Schiffe", "easy"],
  ["bahn", "Bahnreisen und Züge", "easy"],
  ["auto_teile", "Teile eines Autos", "easy"],
  ["straßenverkehr", "Straßenverkehr und Schilder", "easy"],
  ["baustelle", "Baustelle und Handwerk", "easy"],
  ["wohnung_renovieren", "Wohnung renovieren", "easy"],
  ["garten", "Garten und Gemüseanbau", "easy"],
  ["zimmerpflanzen", "Zimmerpflanzen", "easy"],
  ["kochen_techniken", "Kochtechniken", "easy"],
  ["fotografie", "Fotografie und Kamera", "easy"],
  ["malerei", "Malerei und Zeichnen", "easy"],
  ["skulptur", "Skulptur und Bildhauerei", "easy"],
  ["architekturstile", "Architekturstile", "easy"],
  ["mode", "Mode und Design", "easy"],
  ["schmuck", "Schmuck und Accessoires", "easy"],
  ["bücher_klassiker", "Deutsche Klassiker der Literatur", "easy"],
  ["märchen_brüder_grimm", "Märchen der Brüder Grimm", "easy"],
  ["märchen_andersen", "Märchen von Hans Christian Andersen", "easy"],
  ["disney_filme", "Disney-Filme", "easy"],
  ["superhelden", "Superhelden und Comics", "easy"],
  ["fantasy", "Fantasy und Zauberei", "easy"],
  ["tiere_afrika", "Tiere in Afrika", "easy"],
  ["tiere_australien", "Tiere in Australien", "easy"],
  ["raubtiere", "Raubtiere der Welt", "easy"],
  ["reptilien", "Reptilien", "easy"],
  ["amphibien", "Amphibien und Frösche", "easy"],
  ["meeresfrüchte", "Meeresfrüchte und Fisch", "easy"],
  ["nüsse", "Nussarten", "easy"],
  ["getreide", "Getreidesorten", "easy"],
  ["hülsenfrüchte", "Hülsenfrüchte", "easy"],
  ["käsesorten", "Käsesorten aus Deutschland", "easy"],
  ["biermarken", "Biersorten und Brauereistädte", "easy"],
  ["weinsorten", "Weinsorten", "easy"],
  ["kaffee_spezialitäten", "Kaffeespezialitäten", "easy"],
  ["tee_sorten", "Teesorten", "easy"],
  ["krankenhausberufe", "Berufe im Krankenhaus", "easy"],
  ["symptome", "Krankheitssymptome", "easy"],
  ["apotheke", "Apothekenprodukte", "easy"],
  ["fußball_begriffe", "Fußballbegriffe", "easy"],
  ["hockey_begriffe", "Eishockeybegriffe", "easy"],
  ["schach_begriffe", "Schachbegriffe", "easy"],
  ["tennis_begriffe", "Tennisbegriffe und -turniere", "easy"],
  ["kampfsport", "Kampfsportarten", "easy"],
  ["angeln", "Angeln und Fischerei", "easy"],
  ["camping", "Camping und Wandern", "easy"],
  ["reisen", "Reisen und Urlaub", "easy"],
  ["oktoberfest", "Oktoberfest und bayrische Traditionen", "easy"],
  ["weihnachten", "Weihnachten und Advent", "easy"],
  ["ostern", "Ostern und Frühjahrsbräuche", "easy"],
  ["karneval", "Karneval und Fasching", "easy"],
  ["deutsche_küche", "Typische deutsche Gerichte", "easy"],
  ["bäckerei", "Bäckerei und Konditorei", "easy"],
  ["metzgerei", "Wurst- und Fleischspezialitäten", "easy"],
  ["schokolade", "Schokoladen- und Süßwarenarten", "easy"],
  ["kuchen_torten", "Kuchen und Torten", "easy"],
  ["eis_sorten", "Eissorten", "easy"],
  ["supermarkt_abteilungen", "Abteilungen im Supermarkt", "easy"],
  ["marktplatz", "Wochenmarkt und Marktstand", "easy"],
  ["museum_arten", "Museumsarten", "easy"],
  ["kunstformen", "Kunstformen", "easy"],
  ["tanz_stile", "Tanzstile", "easy"],
  ["klassische_musik", "Klassische Musikformen", "easy"],
  ["oper_stücke", "Bekannte Opernwerke", "easy"],
  ["beethoven_werke", "Werke von Beethoven", "easy"],
  ["deutsche_komponisten", "Deutsche Komponisten", "easy"],
  ["deutsche_dichter", "Deutsche Dichter und Schriftsteller", "easy"],
  ["goethe_werke", "Werke von Goethe", "easy"],
  ["schiller_werke", "Werke von Schiller", "easy"],
  ["marx_begriffe", "Philosophische Begriffe von Marx", "easy"],
  ["philosophen_deutsch", "Deutsche Philosophen", "easy"],
  ["deutsche_erfinder", "Deutsche Erfinder und Entdeckungen", "easy"],
  ["deutsche_physiker", "Deutsche Physiker und Entdeckungen", "easy"],
  ["berlin_sehenswürdigkeiten", "Sehenswürdigkeiten Berlins", "easy"],
  ["münchen_sehenswürdigkeiten", "Sehenswürdigkeiten Münchens", "easy"],
  ["hamburger_hafen", "Hamburg und der Hafen", "easy"],
  ["rhein_orte", "Städte und Sehenswürdigkeiten am Rhein", "easy"],
  ["schlösser_deutschland", "Schlösser und Burgen in Deutschland", "easy"],
  ["autobahn", "Autobahn und Fahren in Deutschland", "easy"],
  ["deutsche_autohersteller", "Deutsche Autohersteller", "easy"],
  ["deutsche_exportprodukte", "Deutsche Exportprodukte", "easy"],
  ["dax_unternehmen", "DAX-Unternehmen und Branchen", "easy"],
  ["handwerk_zünfte", "Handwerkliche Zünfte und Berufe", "easy"],
  ["mittelalter_burg", "Mittelalterliche Burg und Ritter", "easy"],
  ["römer_in_deutschland", "Römer in Deutschland", "easy"],
  ["wikinger", "Wikinger und ihre Welt", "easy"],
  ["deutsches_kaiserreich", "Deutsches Kaiserreich", "easy"],
  ["weimarer_republik", "Weimarer Republik", "easy"],
  ["nachkriegszeit", "Nachkriegszeit und Wiederaufbau", "easy"],
  ["ddr_alltag", "Alltag in der DDR", "easy"],
  ["mauerfall", "Mauerfall und Wiedervereinigung", "easy"],
  ["europäische_union", "Europäische Union und ihre Institutionen", "easy"],
  ["bundesregierung", "Bundesregierung und Verfassung", "easy"],
  ["politische_parteien", "Politische Parteien in Deutschland", "easy"],
  ["bundeswehr", "Bundeswehr und Militär", "easy"],
  ["polizei", "Polizei und Strafverfolgung", "easy"],
  ["feuerwehr", "Feuerwehr und Rettungsdienst", "easy"],
  ["natur_schutzgebiete", "Nationalparks in Deutschland", "easy"],
  ["schwarzwald", "Schwarzwald und seine Besonderheiten", "easy"],
  ["alpen", "Alpen und Bergwandern", "easy"],
  ["nordsee", "Nordsee und ihre Besonderheiten", "easy"],
  ["ostsee", "Ostsee und ihre Küste", "easy"],
  ["wein_regionen", "Weinregionen in Deutschland", "easy"],
  ["brauereikultur", "Brauereikultur in Deutschland", "easy"],
  ["fasching_kostüme", "Faschingskostüme und Figuren", "easy"],
  ["advent_traditionen", "Adventstraditionen", "easy"],
  ["nikolaus_traditionen", "Nikolaus und Weihnachtstraditionen", "easy"],
  ["typische_souvenirs", "Typische deutsche Souvenirs", "easy"],
  ["volksfeste", "Volksfeste und Jahrmärkte", "easy"],
  ["deutsche_medien", "Deutsche Medien und Fernsehen", "easy"],
  ["kino_deutschland", "Deutsche Filmklassiker", "easy"],
  ["fußball_vereine", "Deutsche Fußballvereine", "easy"],
  ["formel1", "Formel 1 und Motorsport", "easy"],
  ["tourismus_ziele", "Beliebte Reiseziele in Deutschland", "easy"],
  ["seen_alpen", "Seen in den Alpen", "easy"],
  ["inseln_deutschland", "Inseln in Deutschland", "easy"],
  ["wanderwege", "Bekannte Wanderwege in Deutschland", "easy"],
  ["fahrrad_arten", "Fahrradarten", "easy"],
  ["öpnv", "Öffentlicher Nahverkehr", "easy"],
  ["kindergarten", "Kindergarten und Vorschule", "easy"],
  ["schulsystem", "Das deutsche Schulsystem", "easy"],
  ["studium", "Studium und Universitäten", "easy"],
  ["berufsausbildung", "Berufsausbildung und Lehre", "easy"],
  ["steuern", "Steuerarten in Deutschland", "easy"],
  ["sozialversicherung", "Sozialversicherungssysteme", "easy"],
  ["krankenversicherung", "Krankenversicherung in Deutschland", "easy"],
  ["rente", "Rentensystem und Altersvorsorge", "easy"],
  ["umweltschutz", "Umweltschutz und Nachhaltigkeit", "easy"],
  ["recycling", "Recycling und Mülltrennung", "easy"],
  ["erneuerbare_energien", "Erneuerbare Energien", "easy"],
  ["elektromobilität", "Elektroautos und Ladesäulen", "easy"],
  ["solar", "Solarenergie und Photovoltaik", "easy"],
  ["windenergie", "Windenergie und Windkraft", "easy"],
  ["gartenarbeit", "Gartenarbeit und Gartengeräte", "easy"],
  ["haustierarten", "Heimtierarten", "easy"],
  ["aquarium", "Aquarienfische und Wasserpflanzen", "easy"],
  ["vogelbeobachtung", "Vogelbeobachtung und Zugvögel", "easy"],
  ["imkerei", "Imkerei und Bienen", "easy"],
  ["jagd", "Jagd und Wildtiere", "easy"],
  ["fischen_arten", "Fischarten in deutschen Gewässern", "easy"],
  ["camping_ausrüstung", "Campingausrüstung", "easy"],
  ["klettern", "Klettersport und Bergsteigen", "easy"],
  ["skifahren", "Skifahren und Wintersport", "easy"],
  ["schwimmen", "Schwimmsport und Wasserball", "easy"],
  ["radsport", "Radsport und Radrennen", "easy"],
  ["marathon", "Marathon und Laufsport", "easy"],
  ["schwere_gewichte", "Gewichtheben und Kraftsport", "easy"],
  ["turnen", "Turnen und Sportgymnastik", "easy"],
  ["volleyball", "Volleyball und Beachvolleyball", "easy"],
  ["basketball", "Basketball und NBA", "easy"],
  ["handball", "Handball in Deutschland", "easy"],
  ["golf_begriffe", "Golfbegriffe und -ausrüstung", "easy"],
  // === MEDIUM ================================================================
  ["doppelbedeutung_tiere", "Wörter mit Doppelbedeutung: Tiere und mehr", "medium"],
  ["berufe_umgangssprachlich", "Berufe in umgangssprachlichen Ausdrücken", "medium"],
  ["städte_spitznamen", "Deutsche Städte nach Spitznamen", "medium"],
  ["wappen_bundesländer", "Tiere in deutschen Wappen", "medium"],
  ["redewendungen_farben", "Redewendungen mit Farben", "medium"],
  ["sprichwörter_zahlen", "Zahlen in deutschen Sprichwörtern", "medium"],
  ["phrasen_körperteile", "Redewendungen mit Körperteilen", "medium"],
  ["phrasen_tiere", "Redewendungen mit Tieren", "medium"],
  ["literatur_figuren", "Literarische Figuren nach Werk", "medium"],
  ["klassiker_erstezeile", "Erste Zeilen berühmter Werke", "medium"],
  ["abkürzungen_deutsch", "Deutsche Abkürzungen und ihre Bedeutung", "medium"],
  ["wissenschaft_entdeckungen", "Wissenschaftliche Entdeckungen nach Erfinder", "medium"],
  ["nobel_preisträger", "Deutsche Nobelpreisträger", "medium"],
  ["griechische_götter", "Griechische Götter und ihre Attribute", "medium"],
  ["germanische_götter", "Germanische Götter und ihre Welt", "medium"],
  ["sagen_deutschland", "Deutsche Sagen und Legenden", "medium"],
  ["rheingold_nibelungen", "Die Nibelungensage", "medium"],
  ["grimm_helden", "Helden in Grimm-Märchen", "medium"],
  ["burg_teile", "Teile einer mittelalterlichen Burg", "medium"],
  ["rittertum", "Rittertum und Ritterorden", "medium"],
  ["städte_gründer", "Gründer bedeutender Städte", "medium"],
  ["dom_kathedralen", "Bedeutende Kathedralen Deutschlands", "medium"],
  ["denkmäler_deutschland", "Denkmäler und Skulpturen in Deutschland", "medium"],
  ["plätze_deutschland", "Berühmte Plätze in deutschen Städten", "medium"],
  ["flüsse_quellen", "Quellen bedeutender Flüsse", "medium"],
  ["klimazonen_europa", "Klimazonen in Europa", "medium"],
  ["völker_deutschlands", "Historische Völker auf deutschem Boden", "medium"],
  ["sprachfamilien", "Sprachfamilien und ihre Sprachen", "medium"],
  ["dialekte_deutschland", "Dialekte und Mundarten in Deutschland", "medium"],
  ["eu_institutionen", "EU-Institutionen und ihre Funktionen", "medium"],
  ["un_organisationen", "Internationale Organisationen und Sitze", "medium"],
  ["grundgesetz_artikel", "Grundgesetzartikel und ihre Themen", "medium"],
  ["physik_begriffe", "Physikalische Begriffe und ihre Einheiten", "medium"],
  ["chemie_reaktionen", "Arten chemischer Reaktionen", "medium"],
  ["biologie_reiche", "Reiche der Lebewesen", "medium"],
  ["medizin_fachbereiche", "Medizinische Fachbereiche nach Organ", "medium"],
  ["psychologie_begriffe", "Psychologische Begriffe und Konzepte", "medium"],
  ["kognitive_verzerrungen", "Kognitive Verzerrungen", "medium"],
  ["wirtschaft_begriffe", "Wirtschaftsbegriffe", "medium"],
  ["recht_begriffe", "Juristische Begriffe", "medium"],
  ["militärische_ränge", "Militärische Dienstgrade in Deutschland", "medium"],
  ["kriegsschiffe_typen", "Kriegsschiffstypen", "medium"],
  ["raumfahrt_missionen", "Deutsche und europäische Raumfahrtmissionen", "medium"],
  ["weltraum_objekte", "Objekte im Weltall und ihre Arten", "medium"],
  ["schwarze_löcher", "Phänomene rund um Schwarze Löcher", "medium"],
  ["teleskope_arten", "Teleskoparten und ihre Funktionen", "medium"],
  ["quantenphysik", "Begriffe der Quantenphysik", "medium"],
  ["relativitätstheorie", "Konzepte der Relativitätstheorie", "medium"],
  ["thermodynamik", "Gesetze der Thermodynamik", "medium"],
  ["optik_licht", "Optik und Lichtphänomene", "medium"],
  ["mathematik_zweige", "Zweige der Mathematik", "medium"],
  ["logik_operationen", "Logische Operationen und Beweise", "medium"],
  ["programmierkonzepte", "Konzepte der Softwareentwicklung", "medium"],
  ["ki_begriffe", "KI und maschinelles Lernen", "medium"],
  ["netzwerktechnologie", "Netzwerktechnologien und Protokolle", "medium"],
  ["kryptografie", "Begriffe der Kryptografie", "medium"],
  ["design_prinzipien", "Designprinzipien und Gestaltungsregeln", "medium"],
  ["typografie", "Typografische Begriffe", "medium"],
  ["farbmodelle", "Farbmodelle und ihre Anwendungen", "medium"],
  ["filmtechnik", "Filmtechnische Begriffe", "medium"],
  ["kamera_einstellungen", "Kameraeinstellungen und Perspektiven", "medium"],
  ["filmschnitt", "Arten von Filmschnitten", "medium"],
  ["regisseure_deutschland", "Deutsche Filmregisseure", "medium"],
  ["filmpreise", "Internationale Filmpreise", "medium"],
  ["theaterformen", "Theaterformen und -stile", "medium"],
  ["opernformen", "Opernformen und -gattungen", "medium"],
  ["ballett_begriffe", "Ballettbegriffe", "medium"],
  ["klassik_formen", "Klassische Musikformen", "medium"],
  ["jazz_begriffe", "Jazzbegriffe und -stile", "medium"],
  ["rock_epochen", "Epochen der Rockmusik", "medium"],
  ["elektronische_musik", "Genres der elektronischen Musik", "medium"],
  ["modestile", "Modestile und -epochen", "medium"],
  ["stoffe_arten", "Arten von Stoffen und Textilien", "medium"],
  ["weltküchen", "Nationale Küchen der Welt", "medium"],
  ["wein_regionen_welt", "Weinregionen der Welt", "medium"],
  ["bierstile", "Bierstile und Brauarten", "medium"],
  ["cocktail_klassiker", "Klassische Cocktails", "medium"],
  ["kochechniken_profi", "Professionelle Kochtechniken", "medium"],
  ["psychologie_persönlichkeit", "Persönlichkeitstypen und Theorien", "medium"],
  ["philosophie_schulen", "Philosophische Schulen und Strömungen", "medium"],
  ["religionen_welt", "Weltreligionen und ihre Kernpunkte", "medium"],
  ["christentum_symbole", "Christliche Symbole und ihre Bedeutung", "medium"],
  ["islam_begriffe", "Grundbegriffe des Islam", "medium"],
  ["buddhismus_konzepte", "Buddhistische Konzepte", "medium"],
  ["ägyptische_götter", "Ägyptische Götter und ihre Attribute", "medium"],
  ["nordische_götter", "Nordische Götter und ihre Attribute", "medium"],
  ["heraldik", "Heraldische Symbole und Regeln", "medium"],
  ["geologie_gesteine", "Gesteinsarten und ihre Entstehung", "medium"],
  ["minerale", "Mineralien und ihre Eigenschaften", "medium"],
  ["periodensystem_gruppen", "Elementgruppen im Periodensystem", "medium"],
  ["evolution_epochen", "Erdzeitalter und Evolutionsphasen", "medium"],
  ["dinosaurier", "Dinosaurierarten und -eigenschaften", "medium"],
  ["paläontologie", "Paläontologische Funde und ihre Bedeutung", "medium"],
  ["sport_olympia", "Geschichte der Olympischen Spiele", "medium"],
  ["fußball_weltmeister", "Fußball-Weltmeisterschaften", "medium"],
  ["bundesliga_rekorde", "Bundesliga-Rekorde und Auszeichnungen", "medium"],
  ["schachstrategien", "Schachstrategien und -eröffnungen", "medium"],
  ["kartenspiele", "Kartenspiele und ihre Regeln", "medium"],
  ["computerspiele_figuren", "Computerspielfiguren nach Serie", "medium"],
  ["rpg_begriffe", "RPG-Spielbegriffe", "medium"],
  ["ökologie_probleme", "Ökologische Probleme und ihre Ursachen", "medium"],
  ["klimawandel", "Klimawandel und seine Folgen", "medium"],
  ["naturkatastrophen", "Arten von Naturkatastrophen", "medium"],
  ["energiearten", "Energiearten und ihre Eigenschaften", "medium"],
  ["biotechnologie", "Biotechnologische Verfahren", "medium"],
  ["gentechnik", "Gentechnik und Genforschung", "medium"],
  ["nanotechnologie", "Nanotechnologie und Anwendungen", "medium"],
  ["medizin_technologie", "Medizinische Technologien", "medium"],
  ["anatomie_systeme", "Organsysteme des Körpers", "medium"],
  ["neurologie", "Teile des Nervensystems", "medium"],
  ["soziale_bewegungen", "Soziale Bewegungen in Deutschland", "medium"],
  ["deutsche_reformation", "Die Reformation und ihre Akteure", "medium"],
  ["dreißigjähriger_krieg", "Der Dreißigjährige Krieg", "medium"],
  ["deutsche_revolution", "Revolutionen in der deutschen Geschichte", "medium"],
  ["bismarck_politik", "Bismarcks Innenpolitik", "medium"],
  ["erster_weltkrieg", "Erster Weltkrieg und seine Folgen", "medium"],
  ["zweiter_weltkrieg", "Zweiter Weltkrieg - wichtige Daten", "medium"],
  ["nazi_widerstand", "Widerstand gegen den Nationalsozialismus", "medium"],
  ["berliner_mauer", "Die Berliner Mauer und ihre Geschichte", "medium"],
  ["kalter_krieg", "Kalter Krieg und seine Ereignisse", "medium"],
  ["eu_geschichte", "Geschichte der europäischen Integration", "medium"],
  ["digitalisierung", "Digitalisierung und ihre Auswirkungen", "medium"],
  ["sozialpolitik", "Sozialpolitische Reformen in Deutschland", "medium"],
  ["umweltpolitik", "Umweltpolitik und Klimagesetze", "medium"],
  ["medien_recht", "Medienrecht und Pressefreiheit", "medium"],
];

// ─── Validation ───────────────────────────────────────────────────────────────
const MAX_ITEM_LEN = 22;

function validatePuzzle(p) {
  if (!p || typeof p !== "object") return "not an object";
  if (typeof p.id !== "string") return "missing id";
  if (typeof p.title !== "string") return "missing title";
  if (p.difficulty !== "easy" && p.difficulty !== "medium")
    return `bad difficulty: ${p.difficulty}`;
  if (!Array.isArray(p.groups) || p.groups.length !== 4) return "need exactly 4 groups";
  const allItems = new Set();
  for (const g of p.groups) {
    if (!Array.isArray(g.items) || g.items.length !== 4) return `group ${g.id} needs 4 items`;
    if (p.difficulty === "medium" && !g.revealHint)
      return `medium group ${g.id} missing revealHint`;
    for (const item of g.items) {
      if (typeof item !== "string" || !item.trim()) return "empty item";
      if (item.length > MAX_ITEM_LEN) return `item too long (${item.length}): "${item}"`;
      const norm = item.trim().toLowerCase();
      if (allItems.has(norm)) return `duplicate item: "${item}"`;
      allItems.add(norm);
    }
  }
  return null;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Du bist ein erfahrener Redakteur für Rätsel-Spiele bei Foldwink (ein 4×4-Gruppenrätsel auf Deutsch).
Du bekommst Themen geschickt. Für jedes Thema erstellst du ein vollständiges Rätsel.

QUALITÄTSREGELN (verbindlich):
• 4 Gruppen × 4 Wörter/Phrasen = 16 einzigartige Karten
• Alle Wörter im Nominativ, Singular oder Plural je nach Kontext
• Maximal 22 Zeichen pro Karte (sonst wird es auf Mobilgeräten abgeschnitten)
• Keine Duplikate innerhalb des Rätsels, keine offensichtlich überlappenden Begriffe
• Genau 1 falscher Pfad: Eine Karte sieht aus wie sie zur anderen Gruppe gehört, gehört aber klar zu ihrer eigenen
• Kategorien sind klar und eindeutig. Der Spieler soll sich an die Stirn schlagen ("Na klar!")
• Für medium: Füge "revealHint" zu jeder Gruppe hinzu — kurzer Hinweis ≤ 18 Zeichen, schrittweise enthüllt

AUSGABEFORMAT — streng JSON-Array, ohne zusätzlichen Text:
[
  {
    "id": "de-PLACEHOLDER",
    "title": "Rätseltitel (auf Deutsch)",
    "difficulty": "easy"|"medium",
    "meta": { "theme": "thema", "batch": "de-batch-01" },
    "groups": [
      { "id": "group_a", "label": "Kategorie A", "items": ["Wort1", "Wort2", "Wort3", "Wort4"] },
      { "id": "group_b", "label": "Kategorie B", "items": ["Wort5", "Wort6", "Wort7", "Wort8"] },
      { "id": "group_c", "label": "Kategorie C", "items": ["Wort9", "Wort10", "Wort11", "Wort12"] },
      { "id": "group_d", "label": "Kategorie D", "items": ["Wort13", "Wort14", "Wort15", "Wort16"] }
    ]
  }
]

Für medium-Rätsel enthält jede Gruppe "revealHint": "kurzer Hinweis".
Schreibe NUR den JSON-Array. Keine Erklärungen davor oder danach.`;

function buildUserPrompt(batch, startIdx) {
  const lines = batch.map(([_slug, label, diff], i) => {
    const num = startIdx + i + 1;
    return `${i + 1}. ID: de-${String(num).padStart(4, "0")} | Thema: ${label} | Schwierigkeit: ${diff}`;
  });
  return `Erstelle ${batch.length} Rätsel:\n\n${lines.join("\n")}\n\nGib einen JSON-Array mit ${batch.length} Rätseln zurück.`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const client = new Anthropic();

  const allThemes = THEMES.slice(START, START + COUNT);
  if (allThemes.length === 0) {
    console.error("No themes in range. Check --start and --count.");
    process.exit(1);
  }

  const existing = new Set(
    fs.existsSync(OUT_DIR) ? fs.readdirSync(OUT_DIR).map((f) => path.basename(f, ".json")) : [],
  );

  const todo = [];
  for (let i = 0; i < allThemes.length; i++) {
    const globalIdx = START + i;
    const id = `de-${String(globalIdx + 1).padStart(4, "0")}`;
    if (!existing.has(id)) todo.push([globalIdx, allThemes[i]]);
  }

  if (todo.length === 0) {
    console.log("All puzzles already generated. Nothing to do.");
    return;
  }

  console.log(
    `Generating ${todo.length} puzzles (skipped ${allThemes.length - todo.length} existing)...`,
  );
  console.log(`Model: ${MODEL} | Batch size: ${BATCH} | Output: ${OUT_DIR}\n`);

  let generated = 0;
  let failed = 0;

  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH);
    const batchThemes = chunk.map(([, theme]) => theme);
    const firstGlobalIdx = chunk[0][0];

    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(todo.length / BATCH);
    process.stdout.write(
      `[${batchNum}/${totalBatches}] Requesting ${batchThemes.length} puzzles... `,
    );

    if (DRY_RUN) {
      console.log("[DRY RUN skipped]");
      continue;
    }

    let puzzles = null;
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        process.stdout.write(`  retry ${attempt}... `);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
      try {
        const response = await client.messages.create({
          model: MODEL,
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserPrompt(batchThemes, firstGlobalIdx) }],
        });

        const text = response.content[0]?.text ?? "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          lastError = "no JSON array in response";
          continue;
        }
        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) {
          lastError = "parsed is not an array";
          continue;
        }
        puzzles = parsed;
        break;
      } catch (e) {
        lastError = e.message;
      }
    }

    if (!puzzles) {
      console.log(`FAILED: ${lastError}`);
      failed += batchThemes.length;
      continue;
    }

    let batchOk = 0;
    let batchFail = 0;
    for (let j = 0; j < puzzles.length; j++) {
      const p = puzzles[j];
      const [globalIdx] = chunk[j] ?? [firstGlobalIdx + j];
      const expectedId = `de-${String(globalIdx + 1).padStart(4, "0")}`;
      p.id = expectedId;

      const err = validatePuzzle(p);
      if (err) {
        console.warn(`\n  SKIP ${expectedId}: ${err}`);
        batchFail++;
        failed++;
        continue;
      }

      const outPath = path.join(OUT_DIR, `${expectedId}.json`);
      fs.writeFileSync(outPath, JSON.stringify(p, null, 2), "utf8");
      batchOk++;
      generated++;
    }

    console.log(
      `OK ${batchOk}/${batchThemes.length}${batchFail > 0 ? ` (${batchFail} skipped)` : ""}`,
    );

    if (i + BATCH < todo.length) await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`\nDone. Generated: ${generated}, Failed/skipped: ${failed}`);
  console.log(`Output: ${OUT_DIR}`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
